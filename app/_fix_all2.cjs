const fs = require("fs");
let c = fs.readFileSync("server/server.cjs", "utf8");

// ===== 1. Opening hours =====
c = c.replace(
  "// Business hours: 08:00 - 18:00 with 30-minute intervals",
  "// Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)"
);
c = c.replace(
  "const businessHours = [",
  "const openingHours = {"
);
c = c.replace(
  `"08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];`,
  `1: { open: 10, close: 18 },  // Maandag
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
    }`
);
console.log("Step 1 done");

// ===== 2. businessHours -> allSlots =====
c = c.replace(/businessHours/g, "allSlots");
console.log("Step 2 done");

// ===== 3. Remove the duplicate businessHours -> allSlots in the old serviceDurations section =====
// Find and remove the now-duplicate variable definitions that were before the db.all
const oldBlockToRemove = `    // All possible start times in 15-minute intervals (08:00 - 17:30)
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

    const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };`;

c = c.replace(oldBlockToRemove, "");
console.log("Step 3 done");

// ===== 4. Add blockedSlotsSet logic BEFORE the const bookedTimes line =====
// The current code now has: const bookedTimes = rows.map(row => row.time);
// We need to add blockedSlotsSet + overlap logic BEFORE it
const insertionPoint = "\n        const bookedTimes = rows.map(row => row.time);";
const codeToInsert = `\n        // Block all 15-min start times that overlap with existing appointments
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
        });\n        const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };`;

// But wait - toMin is already removed. Let's check what's actually in the file now.
// Actually the better approach: just insert blockedSlotsSet before bookedTimes
const insertCode = `\n        // Block all 15-min start times that overlap with existing appointments
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
        });\n`;

c = c.replace(insertionPoint, insertCode + insertionPoint.trim());
console.log("Step 4 done");

// ===== 5. unavailableSlots fix =====
c = c.replace(
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes])];",
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];"
);
console.log("Step 5 done");

// ===== 6. POST openingstijden =====
const oldPostCheck = `    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const postServiceDurations = {`;

const newPostCheck = `    // === VALIDATIE: Check openingstijden voor deze dag ===
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
    const postServiceDurations = {`;

if (c.includes(oldPostCheck)) {
  c = c.replace(oldPostCheck, newPostCheck);
  console.log("Step 6 done");
} else {
  console.log("Step 6 FAILED: oldPostCheck not found");
  // Debug: find it
  const idx = c.indexOf("Check overlap met bestaande");
  if (idx >= 0) console.log("Found at", idx, ":", c.substring(idx, idx + 80));
}

// ===== 7. POST closing time =====
c = c.replace("if (newEndMin > 18 * 60) {", "if (newEndMin > todayHours.close * 60) {");
c = c.replace('error: "Deze afspraak zou na sluitingstijd (18:00) eindigen.', 'error: "Deze afspraak zou na sluitingstijd eindigen.');
console.log("Step 7 done");

// ===== 8. Remove duplicate allSlots.push("17:30") =====
c = c.replace('\n    allSlots.push("17:30");', "");

fs.writeFileSync("server/server.cjs", c, "utf8");
console.log("ALL DONE!");
