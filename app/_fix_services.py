with open("src/sections/Services.tsx","r",encoding="utf8") as f:
    c = f.read()

# 1. Add "duration" to herenServices without displaying it on home (remove duration display)
# The services page doubles as home services, so we need to keep durations in data but display differently
# Actually the user wants: "Verwijder de tijdsduur alleen op de home pagina"
# Since this component is used for both home and services page, and we need to conditionally show duration
# We'll pass a prop or just remove durations from all service displays here and keep them in Booking.tsx
# Since the user says "Op de afspraakpagina moet de tijd wél zichtbaar blijven", we remove duration from Services.tsx

# Remove duration displays in herenServices
c = c.replace(
    '<p className="text-sm text-stone-500">{service.duration}</p>',
    ''
)
c = c.replace(
    '<p className="text-xs text-stone-500">{service.duration}</p>',
    ''
)

# 2. Restructure extras - create "Standaard Inbegrepen" block and update "Extra's & Acties"
# Find the extras section and replace with new structure

old_extras = """      {/* Extra's & Acties */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#b8941f] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Extra's & Acties</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {extras.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                  >
                    <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                    <span className="font-bold text-[#6b0f1a]">{service.price}</span>
                  </div>
                ))}
              </div>
              
              {/* Inclusief */}
              <div className="mt-6 p-4 bg-[#faf9f7] rounded-lg">
                <h4 className="font-semibold text-[#1a1a1a] mb-3 text-sm">
                  Inclusief bij alle behandelingen:
                </h4>
                <ul className="space-y-2">
                  {inclusiefItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                      <Check className="h-4 w-4 text-[#d4af37]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stempelkaart */}
              <div className="mt-6 p-4 bg-[#6b0f1a] rounded-lg text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#d4af37]" />
                  Stempelkaart Actie
                </h4>
                <p className="text-sm text-stone-300">
                  Na 10 stempels een haar/baard product naar keuze cadeau!
                </p>
              </div>
            </CardContent>
          </Card>"""

new_extras = """      {/* Standaard Inbegrepen */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#b8941f] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Standaard Inbegrepen</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {extras.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                  >
                    <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                    <span className="font-bold text-[#6b0f1a]">{service.price}</span>
                  </div>
                ))}
              </div>
              
              {/* Inclusief */}
              <div className="mt-6 p-4 bg-[#faf9f7] rounded-lg">
                <h4 className="font-semibold text-[#1a1a1a] mb-3 text-sm">
                  Inclusief bij alle behandelingen:
                </h4>
                <ul className="space-y-2">
                  {inclusiefItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                      <Check className="h-4 w-4 text-[#d4af37]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Extra's & Acties */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-[#6b0f1a] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-[#6b0f1a]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Extra's & Acties</h3>
              </div>
            </div>
            <CardContent className="p-6">
              {/* Stempelkaart */}
              <div className="p-4 bg-[#faf9f7] rounded-lg">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-[#6b0f1a]">
                  <Gift className="h-4 w-4" />
                  Stempelkaart &mdash; Vaste Actie
                </h4>
                <p className="text-sm text-stone-600">
                  Na 10 stempels krijgt u een haar/baard product naar keuze cadeau!
                </p>
              </div>
            </CardContent>
          </Card>"""

c = c.replace(old_extras, new_extras)

# 3. Update grid to show 4 cards
c = c.replace(
    '<div className="grid lg:grid-cols-3 gap-8">',
    '<div className="grid lg:grid-cols-4 gap-8">'
)

with open("src/sections/Services.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Services.tsx updated")
