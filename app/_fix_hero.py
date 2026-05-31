with open("src/sections/Hero.tsx","r",encoding="utf8") as f:
    c = f.read()

# Change opening hours text
c = c.replace(
    '<span className="text-[#d4af37]">Ma, Di, Vr, Za:</span> Op afspraak',
    '<span className="text-[#d4af37]">Ma, Di, Vr, Za:</span> uitsluitend op afspraak'
)

with open("src/sections/Hero.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Hero.tsx updated")
