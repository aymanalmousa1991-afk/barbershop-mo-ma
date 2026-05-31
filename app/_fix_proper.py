import sys
f = "server/server.cjs"

with open(f, "r", encoding="utf8") as fh:
    lines = fh.readlines()

# ===== 1. Find and replace the business hours section =====
# Find line with "Business hours:"
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Replace the business hours section
    if '// Business hours: 08:00 - 18:00 with 30-minute intervals' in line:
        # Skip until we find the end of the businessHours array
        while i < len(lines):
            if "];" in lines[i] and "businessHours" in lines[i-1] or "businessHours" in line:
                # Found the end
                if "];" in lines[i]:
                    # Skip this line too
                    i += 1
                    break
            i += 1
        # Add the new opening hours code
        new_lines.append('  // Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)\n')
        new_lines.append('    const openingHours = {\n')
        new_lines.append('      1: { open: 10, close: 18 },  // Maandag\n')
        new_lines.append('      2: { open: 9, close: 18 },   // Dinsdag\n')
        new_lines.append('      3: { open: 9, close: 18 },   // Woensdag\n')
        new_lines.append('      4: { open: 9, close: 18 },   // Donderdag\n')
        new_lines.append('      5: { open: 9, close: 18 },   // Vrijdag\n')
        new_lines.append('      6: { open: 8, close: 17 },   // Zaterdag\n')
        new_lines.append('    };\n')
        new_lines.append("    const dateObj = new Date(date + 'T12:00:00');\n")
        new_lines.append('    const dayOfWeek = dateObj.getDay();\n')
        new_lines.append('    const todayHours = openingHours[dayOfWeek];\n')
        new_lines.append('    const allSlots = [];\n')
        new_lines.append('    if (todayHours) {\n')
        new_lines.append('      for (let h = todayHours.open; h < todayHours.close; h++) {\n')
        new_lines.append('        for (let m = 0; m < 60; m += 15) {\n')
        new_lines.append("          allSlots.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));\n")
        new_lines.append('        }\n')
        new_lines.append('      }\n')
        new_lines.append('    }\n')
        continue
    
    # Replace businessHours with allSlots (but not in comments)
    if 'businessHours' in line and '//' not in line.split('businessHours')[0]:
        line = line.replace('businessHours', 'allSlots')
    
    new_lines.append(line)
    i += 1

# ===== 2. Add blockedSlotsSet logic =====
# Find: "const bookedTimes = rows.map(row => row.time);"
content = "".join(new_lines)
old_booked = "        const bookedTimes = rows.map(row => row.time);"
insert_code = """        // Block all 15-min start times that overlap with existing appointments
        const blockedSlotsSet = new Set();
        rows.forEach(row => {
          const dur = serviceDurations[row.treatment] || 30;
          const existingStart = toMin(row.time);
          const existingEnd = existingStart + dur;
          allSlots.forEach(slot => {
            const slotMin = toMin(slot);
            if (slotMin < existingEnd && slotMin + requestedDuration > existingStart) {
              blockedSlotsSet.add(slot);
            }
          });
        });
        
"""

if old_booked in content:
    content = content.replace(old_booked, insert_code + old_booked)
    print("Step 2: Added overlap logic")
else:
    print("ERROR: old_booked not found!")

# ===== 3. unavailableSlots fix =====
content = content.replace(
    "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes])];",
    "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];"
)
print("Step 3: Fixed unavailableSlots")

# ===== 4. POST opening hours =====
old_post = "    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===\n    const postServiceDurations = {"
new_post = """    // === VALIDATIE: Check openingstijden voor deze dag ===
    const openingHours = {
      1: { open: 10, close: 18 },
      2: { open: 9, close: 18 },
      3: { open: 9, close: 18 },
      4: { open: 9, close: 18 },
      5: { open: 9, close: 18 },
      6: { open: 8, close: 17 },
    };
    const dateObj = new Date(date + 'T' + time);
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];

    if (!todayHours) {
      return res.status(400).json({
        success: false,
        error: 'Op zondag zijn wij gesloten. Kies een andere dag.'
      });
    }

    const hour = parseInt(time.split(':')[0]);
    if (hour < todayHours.open) {
      return res.status(400).json({
        success: false,
        error: 'Onze openingstijd op deze dag is ' + String(todayHours.open).padStart(2, '0') + ':00. Kies een later tijdstip.'
      });
    }

    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const postServiceDurations = {"""

if old_post in content:
    content = content.replace(old_post, new_post)
    print("Step 4: Added POST opening hours")
else:
    print("ERROR: old_post not found!")

# ===== 5. POST closing time =====
content = content.replace("if (newEndMin > 18 * 60) {", "if (newEndMin > todayHours.close * 60) {")
content = content.replace("error: 'Deze afspraak zou na sluitingstijd (18:00) eindigen.", "error: 'Deze afspraak zou na sluitingstijd eindigen.")
print("Step 5: Fixed POST closing time")

with open(f, "w", encoding="utf8") as fh:
    fh.write(content)
print("ALL DONE!")
