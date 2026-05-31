f = "server/server.cjs"
with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# 1. Replace allSlots generation (hardcoded 8-17:30) with opening hours version
old_slots = """  // All possible start times in 15-minute intervals (08:00 - 17:30)
    const allSlots = [];
    for (let h = 8; h <= 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        allSlots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
      }
    }
    allSlots.push("17:30");

    // Service durations mapping (in minutes)
    const serviceDurations = {
      "knippen-stylen": 30, "knippen-baard": 45, "senioren": 30,
      "tondeuse": 20, "baard": 15, "baard-nek": 25, "jong-tm11": 25, "jong-12-13": 30
    };
    const requestedDuration = (service && serviceDurations[service]) ? serviceDurations[service] : 30;
    const CLOSING_MIN = 18 * 60;

    const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };"""

new_slots = """  // Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)
    const openingHours = {
      1: { open: 10, close: 18 },  // Maandag
      2: { open: 9, close: 18 },   // Dinsdag
      3: { open: 9, close: 18 },   // Woensdag
      4: { open: 9, close: 18 },   // Donderdag
      5: { open: 9, close: 18 },   // Vrijdag
      6: { open: 8, close: 17 },   // Zaterdag
    };
    const dateObj = new Date(date + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];
    const allSlots = [];
    if (todayHours) {
      for (let h = todayHours.open; h < todayHours.close; h++) {
        for (let m = 0; m < 60; m += 15) {
          allSlots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
        }
      }
    }

    // Service durations mapping (in minutes)
    const serviceDurations = {
      "knippen-stylen": 30, "knippen-baard": 45, "senioren": 30,
      "tondeuse": 20, "baard": 15, "baard-nek": 25, "jong-tm11": 25, "jong-12-13": 30
    };
    const requestedDuration = (service && serviceDurations[service]) ? serviceDurations[service] : 30;
    const CLOSING_MIN = todayHours ? todayHours.close * 60 : 18 * 60;

    const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };"""

if old_slots in c:
    c = c.replace(old_slots, new_slots)
    print("Step 1: Opening hours added to GET")
else:
    print("ERROR: old_slots not found!")
    # Debug: find the section
    idx = c.find("All possible start times")
    print(f"Found at {idx}: {repr(c[idx:idx+120])}")

# 2. Add opening hours to POST (before overlapping check)
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
    const dateObj = new Date(date + "T" + time);
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];

    if (!todayHours) {
      return res.status(400).json({
        success: false,
        error: "Op zondag zijn wij gesloten. Kies een andere dag."
      });
    }

    const hour = parseInt(time.split(":")[0]);
    if (hour < todayHours.open) {
      return res.status(400).json({
        success: false,
        error: "Onze openingstijd op deze dag is " + String(todayHours.open).padStart(2, "0") + ":00. Kies een later tijdstip."
      });
    }

    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const postServiceDurations = {"""

if old_post in c:
    c = c.replace(old_post, new_post)
    print("Step 2: Opening hours added to POST")
else:
    print("ERROR: old_post not found!")
    idx2 = c.find("Check overlap met bestaande")
    print(f"Found at {idx2}: {repr(c[idx2:idx2+80])}")

# 3. Fix POST closing time
old_closing = '        if (newEndMin > 18 * 60) {'
new_closing = '        if (newEndMin > todayHours.close * 60) {'
if old_closing in c:
    c = c.replace(old_closing, new_closing)
    print("Step 3: POST closing time fixed")
else:
    print("ERROR: old_closing not found")

# 4. Fix closing time error message
c = c.replace("error: 'Deze afspraak zou na sluitingstijd (18:00) eindigen.", "error: 'Deze afspraak zou na sluitingstijd eindigen.")
print("Step 4: Error message updated")

# 5. Remove duplicate allSlots.push("17:30")
c = c.replace('\n    allSlots.push("17:30");', "")
print("Step 5: Removed duplicate 17:30 push")

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("ALL DONE!")
