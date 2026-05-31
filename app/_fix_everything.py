import sys
f = "server/server.cjs"

with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# 1. Replace business hours with opening hours
old = """  // Business hours: 08:00 - 18:00 with 30-minute intervals
    const businessHours = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];"""

new = """  // Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)
    const openingHours = {
      1: { open: 10, close: 18 },  // Maandag
      2: { open: 9, close: 18 },   // Dinsdag
      3: { open: 9, close: 18 },   // Woensdag
      4: { open: 9, close: 18 },   // Donderdag
      5: { open: 9, close: 18 },   // Vrijdag
      6: { open: 8, close: 17 },   // Zaterdag
    };
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];
    const allSlots = [];
    if (todayHours) {
      for (let h = todayHours.open; h < todayHours.close; h++) {
        for (let m = 0; m < 60; m += 15) {
          allSlots.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
        }
      }
    }"""

if old in c:
    c = c.replace(old, new)
    print("Step 1: Opening hours added")
else:
    print("ERROR step 1: old not found")

c = c.replace("businessHours", "allSlots")
print("Step 1b: businessHours replaced with allSlots")

# 2. Replace GET handler - add blockedSlotsSet + overlap logic
old_get = """    // Get booked slots for this date and barber
    db.all(
      'SELECT time FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"',
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Beschikbare tijden konden niet worden opgehaald' 
          });
        }

        const bookedTimes = rows.map(row => row.time);"""

new_get = """    // Get booked slots (with treatment) for this date and barber
    db.all(
      'SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"',
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Beschikbare tijden konden niet worden opgehaald' 
          });
        }

        // Block all 15-min start times that overlap with existing appointments
        const blockedSlotsSet = new Set();
        const toMin = (t) => { const p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
        const serviceDurations = {
          'knippen-stylen': 30, 'knippen-baard': 45, 'senioren': 30,
          'tondeuse': 20, 'baard': 15, 'baard-nek': 25, 'jong-tm11': 25, 'jong-12-13': 30
        };
        const requestedDuration = (service && serviceDurations[service]) ? serviceDurations[service] : 30;

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

        const bookedTimes = rows.map(row => row.time);"""

if old_get in c:
    c = c.replace(old_get, new_get)
    print("Step 2: Overlap logic added")
else:
    print("ERROR step 2: old_get not found")
    # Debug
    idx = c.find("Get booked slots for this date")
    print(f"  Found at {idx}: {repr(c[idx:idx+80])}")

# 3. unavailableSlots fix
old_unavail = "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes])];"
new_unavail = "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];"
if old_unavail in c:
    c = c.replace(old_unavail, new_unavail)
    print("Step 3: unavailableSlots fixed")
else:
    print("ERROR step 3")

# 4. POST openingstijden
old_post = """    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const postServiceDurations = {"""

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

if old_post in c:
    c = c.replace(old_post, new_post)
    print("Step 4: POST opening hours added")
else:
    print("ERROR step 4: old_post not found")

# 5. POST closing time
c = c.replace("if (newEndMin > 18 * 60) {", "if (newEndMin > todayHours.close * 60) {")
c = c.replace("error: 'Deze afspraak zou na sluitingstijd (18:00) eindigen.", "error: 'Deze afspraak zou na sluitingstijd eindigen.")
print("Step 5: POST closing time fixed")

# 6. CLOSING_MIN constant
old_closing_const = "    const CLOSING_MIN = 18 * 60;"
new_closing_const = "    const CLOSING_MIN = todayHours ? todayHours.close * 60 : 18 * 60;"
if old_closing_const in c:
    c = c.replace(old_closing_const, new_closing_const)
    print("Step 6: CLOSING_MIN fixed")
else:
    print("Step 6: Already fixed or not found")

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("ALL DONE!")
