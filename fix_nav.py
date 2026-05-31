# coding: utf-8
with open("src/sections/Navbar.tsx", "r", encoding="utf8") as f:
    c = f.read()

# Fix the apostrophe in "Foto's"
c = c.replace("label: 'Foto's'", 'label: "Foto\'s"')

with open("src/sections/Navbar.tsx", "w", encoding="utf8") as f:
    f.write(c)
print("Fixed Navbar apostrophe")
