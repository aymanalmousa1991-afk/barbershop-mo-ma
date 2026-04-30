with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()
c = c.replace('grid grid-cols-1 md:grid-cols-3 gap-6', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6')
with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("OK")
