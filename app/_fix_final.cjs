const fs = require("fs");
let c = fs.readFileSync("server/server.cjs", "utf8");

// Helper
function between(str, a, b) {
  const i = str.indexOf(a);
  const j = str.indexOf(b, i + a.length);
  return { start: i, end: j + b.length, text: str.substring(i, j + b.length) };
}

// 1. allSlots generation
const gen = between(c, "  // All possible start times in 15-minute intervals (08:00 - 17:30)", 'allSlots.push("17:30");');
console.log("Gen found:", gen.start >= 0, "len:", gen.text.length);

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
    }
`;

c = c.substring(0, gen.start) + newGen + c.substring(gen.end);

// 2. Fix overlap logic
const oldOverlap = between(c, "for (let m = Math.max(0, startMin - requestedDuration + 15); m < endMin; m += 15) {", "});");
console.log("Overlap found:", oldOverlap.start >= 0);

// Replace the entire block from 'for (let m...' through the closing '});'
const overlapStart = c.indexOf("for (let m = Math.max(0, startMin - requestedDuration + 15); m < endMin; m += 15) {");
// Find the matching closing brace for the for loop - it's `}` followed by `});`
const overlapEnd = c.indexOf("});", overlapStart) + 3;

const oldOverlapFull = c.substring(overlapStart, overlapEnd);
console.log("Overlap block length:", oldOverlapFull.length);

const newOverlap = `allSlots.forEach(slot => {
            const slotMin = toMin(slot);
            if (slotMin < existingEnd && slotMin + requestedDuration > existingStart) {
              blockedSlotsSet.add(slot);
            }
          });`;

c = c.substring(0, overlapStart) + newOverlap + c.substring(overlapEnd);

// 3. Fix unavailableSlots
c = c.replace(
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes])];",
  "const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];"
);

// 4. Add opening hours to POST
const oldPost = between(c, "// === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===", "const postServiceDurations = {");
console.log("Post found:", oldPost.start >= 0);

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

c = c.substring(0, oldPost.start) + newPost + c.substring(oldPost.end);

// 5. Fix closing time check in POST
c = c.replace("if (newEndMin > 18 * 60) {", "if (newEndMin > todayHours.close * 60) {");

// 6. Fix CLOSING_MIN
c = c.replace("const CLOSING_MIN = 18 * 60;", "const CLOSING_MIN = todayHours ? todayHours.close * 60 : 18 * 60;");

fs.writeFileSync("server/server.cjs", c, "utf8");
console.log("All done!");
