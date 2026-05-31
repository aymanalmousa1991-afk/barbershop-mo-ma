f = "src/sections/AdminDashboard.tsx"
with open(f, "r", encoding="utf8") as fh:
    lines = fh.readlines()

for i, line in enumerate(lines):
    if "barbersAgenda" in line and "useState" in line and i > 80:
        print(f"Found at line {i+1}")
        # Check if barberFilter already exists nearby
        has_filter = any("barberFilter" in l for l in lines[i:i+5])
        if not has_filter:
            lines.insert(i+1, '  const [barberFilter, setBarberFilter] = useState<string>("");\n')
            print("Added barberFilter state")
        break

with open(f, "w", encoding="utf8") as fh:
    fh.writelines(lines)
print("Done")
