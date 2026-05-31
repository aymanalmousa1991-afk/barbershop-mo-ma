#!/usr/bin/env python3
import sys

f = "server/server.cjs"

with open(f, "r", encoding="utf8") as fh:
    content = fh.read()

# ===== 1. Fix available-slots =====
old_slots = (
    "  // Business hours: 08:00 - 18:00 with 30-minute intervals\n"
    "    const businessHours = [\n"
    "      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',\n"
    "      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',\n"
    "      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'\n"
    "    ];\n"
    "\n"
    "    // Get booked slots for this date and barber\n"
    "    db.all(\n"
    '      \'SELECT time FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"\',\n'
    "      [date, barber_name],\n"
    "      (err, rows) => {\n"
    "        if (err) {\n"
    "          console.error('Database error:', err);\n"
    "          return res.status(500).json({ \n"
    "            success: false,\n"
    "            error: 'Beschikbare tijden konden niet worden opgehaald' \n"
    "          });\n"
    "        }\n"
    "\n"
    "        const bookedTimes = rows.map(row => row.time);"
)

# 15-min intervals
new_slots = (
    "  // All possible start times in 15-minute intervals (08:00 - 17:30)\n"
    "    const allSlots = [];\n"
    "    for (let h = 8; h <= 17; h++) {\n"
    "      for (let m = 0; m < 60; m += 15) {\n"
    '        allSlots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));\n'
    "      }\n"
    "    }\n"
    '    allSlots.push("17:30");\n'
    "\n"
    "    // Service durations mapping (in minutes)\n"
    "    const serviceDurations = {\n"
    '      "knippen-stylen": 30, "knippen-baard": 45, "senioren": 30,\n'
    '      "tondeuse": 20, "baard": 15, "baard-nek": 25, "jong-tm11": 25, "jong-12-13": 30\n'
    "    };\n"
    "    const requestedDuration = (service && serviceDurations[service]) ? serviceDurations[service] : 30;\n"
    "    const CLOSING_MIN = 18 * 60;\n"
    "\n"
    '    const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };\n'
    "\n"
    "    // Get booked slots (with treatment) for this date and barber\n"
    "    db.all(\n"
    '      \'SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"\',\n'
    "      [date, barber_name],\n"
    "      (err, rows) => {\n"
    "        if (err) {\n"
    "          console.error('Database error:', err);\n"
    "          return res.status(500).json({ \n"
    "            success: false,\n"
    "            error: 'Beschikbare tijden konden niet worden opgehaald' \n"
    "          });\n"
    "        }\n"
    "\n"
    "        // Block all 15-min start times that overlap with existing appointments\n"
    "        const blockedSlotsSet = new Set();\n"
    "        rows.forEach(row => {\n"
    "          const dur = serviceDurations[row.treatment] || 30;\n"
    "          const startMin = toMin(row.time);\n"
    "          const endMin = startMin + dur;\n"
    "          // Block T where overlapping: T < endMin AND T + requestedDuration > startMin\n"
    "          for (let m = Math.max(0, startMin - requestedDuration + 15); m < endMin; m += 15) {\n"
    "            const h = Math.floor(m / 60);\n"
    "            const min = m % 60;\n"
    "            if (h >= 8 && h <= 17) {\n"
    '              blockedSlotsSet.add(String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0"));\n'
    "            }\n"
    "          }\n"
    "        });\n"
    "\n"
    "        // Block slots that would end after closing time (18:00)\n"
    "        allSlots.forEach(slot => {\n"
    "          const slotMin = toMin(slot);\n"
    "          if (slotMin + requestedDuration > CLOSING_MIN) {\n"
    "            blockedSlotsSet.add(slot);\n"
    "          }\n"
    "        });\n"
    "\n"
    "        const bookedTimes = rows.map(row => row.time);"
)

if old_slots not in content:
    print("ERROR: old_slots not found!")
    print("Looking for first 80 chars:", repr(old_slots[:80]))
    idx = content.find("Business hours")
    if idx >= 0:
        print("Found Business hours at", idx)
        print("Context:", repr(content[idx-5:idx+80]))
    sys.exit(1)

content = content.replace(old_slots, new_slots)
print("Replaced available-slots handler")

# Replace all businessHours references
content = content.replace("businessHours", "allSlots")

# ===== 2. Fix POST overlap check =====
old_post_start = (
    "    // Check of slot is already booked for this barber\n"
    "    db.get(\n"
    '      \'SELECT * FROM appointments WHERE date = ? AND time = ? AND barber_name = ? AND status = "active"\',\n'
    "      [date, time, barber_name],\n"
    "      (err, existing) => {\n"
    "        if (err) {\n"
    "          console.error('Database error:', err);\n"
    "          return res.status(500).json({ \n"
    "            success: false,\n"
    "            error: 'Database fout' \n"
    "          });\n"
    "        }\n"
    "\n"
    "        if (existing) {\n"
    "          return res.status(409).json({ \n"
    "            success: false,\n"
    "            error: 'Dit tijdstip is al bezet voor deze kapper' \n"
    "          });\n"
    "        }\n"
    "\n"
    "        // === VALIDATIE: Check of kapper afwezig is ==="
)

new_post_start = (
    "    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===\n"
    "    const postServiceDurations = {\n"
    '      "knippen-stylen": 30, "knippen-baard": 45, "senioren": 30,\n'
    '      "tondeuse": 20, "baard": 15, "baard-nek": 25, "jong-tm11": 25, "jong-12-13": 30\n'
    "    };\n"
    "    const newDuration = postServiceDurations[service] || 30;\n"
    '    const newStartMin = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);\n'
    "    const newEndMin = newStartMin + newDuration;\n"
    "\n"
    "    // Check overlap with existing active appointments\n"
    "    db.all(\n"
    '      \'SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"\',\n'
    "      [date, barber_name],\n"
    "      (err, existingSlots) => {\n"
    "        if (err) {\n"
    "          console.error('Database error:', err);\n"
    "          return res.status(500).json({ success: false, error: 'Database fout' });\n"
    "        }\n"
    "\n"
    "        for (const existing of existingSlots) {\n"
    "          const existingDur = postServiceDurations[existing.treatment] || 30;\n"
    '          const existingStart = parseInt(existing.time.split(":")[0]) * 60 + parseInt(existing.time.split(":")[1]);\n'
    "          const existingEnd = existingStart + existingDur;\n"
    "          \n"
    "          if (newStartMin < existingEnd && newEndMin > existingStart) {\n"
    "            return res.status(409).json({ \n"
    "              success: false,\n"
    "              error: 'Dit tijdstip overlapt met een bestaande afspraak' \n"
    "            });\n"
    "          }\n"
    "        }\n"
    "\n"
    "        if (newEndMin > 18 * 60) {\n"
    "          return res.status(400).json({\n"
    "            success: false,\n"
    "            error: 'Deze afspraak zou na sluitingstijd (18:00) eindigen. Kies een eerder tijdstip.'\n"
    "          });\n"
    "        }\n"
    "\n"
    "        // === VALIDATIE: Check of kapper afwezig is ==="
)

if old_post_start not in content:
    print("ERROR: old_post_start not found!")
    idx = content.find("Check of slot is already")
    if idx >= 0:
        print(f"Found at {idx}: {repr(content[idx:idx+100])}")
    sys.exit(1)

content = content.replace(old_post_start, new_post_start)
print("Replaced POST overlap check")

with open(f, "w", encoding="utf8") as fh:
    fh.write(content)
print("Server updated successfully!")
