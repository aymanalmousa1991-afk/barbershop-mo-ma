const fs = require("fs");
let c = fs.readFileSync("server/server.cjs", "utf8");

// ===== 1. Replace business hours with opening hours =====
const oldGen = `  // Business hours: 08:00 - 18:00 with 30-minute intervals
    const businessHours = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];`;

const newGen = `  // Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)
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
    }`;

c = c.replace(oldGen, newGen);
console.log("Step 1: Opening hours added");

// ===== 2. businessHours -> allSlots =====
c = c.replace(/businessHours/g, "allSlots");
console.log("Step 2: businessHours replaced with allSlots");

// ===== 3. Add blockedSlotsSet and overlap logic =====
const oldPart = `    // Get booked slots for this date and barber
    db.all(
      "SELECT time FROM appointments WHERE date = ? AND barber_name = ? AND status = \\"active\\"",
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ 
            success: false,
            error: "Beschikbare tijden konden niet worden opgehaald" 
          });
        }

        const bookedTimes = rows.map(row => row.time);`;

const newPart = `    // Get booked slots (with treatment) for this date and barber
    db.all(
      "SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = \\"active\\"",
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ 
            success: false,
            error: "Beschikbare tijden konden niet worden opgehaald" 
          });
        }

        // Block all 15-min start times that overlap with existing appointments
        const blockedSlotsSet = new Set();
        const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };
        const serviceDurations = {
          "knippen-stylen": 30, "knippen-baard": 45, "senioren": 30,
          "tondeuse": 20, "baard": 15, "baard-nek": 25, "jong-tm11": 25, "jong-12-13": 30
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

        const bookedTimes = rows.map(row => row.time);`;

if (c.includes(oldPart)) {
  c = c.replace(oldPart, newPart);
  console.log("Step 3: Overlap logic added");
} else {
  console.error("ERROR: oldPart not found!");
}

// ===== 4. unavailableSlots =====
c = c.replace(
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes])];",
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];"
);
console.log("Step 4: blockedSlotsSet added to unavailableSlots");

// ===== 5. POST opening hours check =====
const oldPost = `    // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const postServiceDurations = {`;

const newPost = `    // === VALIDATIE: Check openingstijden voor deze dag ===
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

if (c.includes(oldPost)) {
  c = c.replace(oldPost, newPost);
  console.log("Step 5: POST opening hours added");
} else {
  console.error("ERROR: oldPost not found!");
}

// ===== 6. POST closing time =====
c = c.replace("if (newEndMin > 18 * 60) {", "if (newEndMin > todayHours.close * 60) {");
c = c.replace('error: "Deze afspraak zou na sluitingstijd (18:00) eindigen.', 'error: "Deze afspraak zou na sluitingstijd eindigen.');
console.log("Step 6: POST closing time fixed");

fs.writeFileSync("server/server.cjs", c, "utf8");
console.log("ALL DONE!");
