import sys
f = "server/server.cjs"
with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# The _fix_server.py uses " for quotes. Let me check:
idx = c.find("All possible start times")
if idx >= 0:
    print("AllSlots gen starts at", idx)
    print(repr(c[idx:idx+60]))

# Find the for-loop overlap block and replace it
old = '''        // Block all 15-min start times that overlap with existing appointments
        const blockedSlotsSet = new Set();
        rows.forEach(row => {
          const dur = serviceDurations[row.treatment] || 30;
          const startMin = toMin(row.time);
          const endMin = startMin + dur;
          // Block T where overlapping: T < endMin AND T + requestedDuration > startMin
          for (let m = Math.max(0, startMin - requestedDuration + 15); m < endMin; m += 15) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            if (h >= 8 && h <= 17) {
              blockedSlotsSet.add(String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0"));
            }
          }
        });'''

new = '''        // Block all 15-min start times that overlap with existing appointments
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
        });'''

if old in c:
    c = c.replace(old, new)
    print("Replaced for-loop with allSlots.forEach")
else:
    print("ERROR: for-loop not found")
    # Find what is there
    i = c.find("Block all 15-min start times")
    if i >= 0:
        print("Found at", i, ":")
        print(repr(c[i:i+400]))

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("DONE!")
