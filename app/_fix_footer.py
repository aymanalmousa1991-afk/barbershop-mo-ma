with open("src/sections/Footer.tsx","r",encoding="utf8") as f:
    c = f.read()

# Change "Mo&Ma" to "Barbershop Mo&Ma" in footer brand section
c = c.replace(
    '<span className="logo-font text-4xl text-white">Mo</span>\n              <span className="logo-font-italic text-3xl text-[#d4af37]">&</span>\n              <span className="logo-font text-4xl text-white">Ma</span>',
    '<span className="logo-font text-2xl text-white">Barbershop</span>\n              <span className="logo-font text-4xl text-white">Mo</span>\n              <span className="logo-font-italic text-3xl text-[#d4af37]">&</span>\n              <span className="logo-font text-4xl text-white">Ma</span>'
)

# Add "Over Ons" and "Foto's" links in footer
old_links = """              <li>
                <button 
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Tarieven
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('booking')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Afspraak Maken
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Admin
                </button>
              </li>"""

new_links = """              <li>
                <button 
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Over Ons
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Tarieven
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('photos')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Foto's
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('booking')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Afspraak Maken
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Admin
                </button>
              </li>"""

c = c.replace(old_links, new_links)

with open("src/sections/Footer.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Footer.tsx updated")
