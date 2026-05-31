f = "server/server.cjs"
with open(f, "r", encoding="utf8") as fh:
    lines = fh.readlines()

print("=== Lines with 'bookedTimes' ===")
for i, line in enumerate(lines):
    if "bookedTimes" in line:
        print(f"  Line {i+1}: {line.rstrip()}")

print("\n=== Lines with 'Service durations' ===")
for i, line in enumerate(lines):
    if "serviceDurations" in line or "postServiceDurations" in line:
        print(f"  Line {i+1}: {line.rstrip()}")

print("\n=== Lines with 'VALIDATIE' ===")
for i, line in enumerate(lines):
    if "VALIDATIE" in line:
        print(f"  Line {i+1}: {line.rstrip()}")

print("\n=== Lines around bookedTimes (250-280) ===")
for i in range(249, min(280, len(lines))):
    print(f"  {i+1}: {lines[i].rstrip()}")
