with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()
print("old endpoint:", "/move" in c)
print("POST:", "method: 'POST'" in c)
print("PUT:", "method: 'PUT'" in c)
print("date/time in move:", "moveDate ||" in c)
print("datetime fields:", "Datum</Label>" in c and "Tijd</Label>" in c)
