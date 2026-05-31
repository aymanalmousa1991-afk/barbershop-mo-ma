with open("src/sections/Footer.tsx","r",encoding="utf8") as f:
    c = f.read()

c = c.replace(
    "Ma, Di, Vr, Za: Op afspraak",
    "Ma, Di, Vr, Za: uitsluitend op afspraak"
)

with open("src/sections/Footer.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Footer.tsx updated")
