with open("src/sections/Navbar.tsx","r",encoding="utf8") as f:
    c = f.read()

# Add useAuth import
c = c.replace("from 'lucide-react';", "from 'lucide-react';\nimport { useAuth } from '@/hooks/useAuth';")

# Add isAuthenticated in function
c = c.replace(
    "export function Navbar({ onNavigate, currentPage }: NavbarProps) {",
    "export function Navbar({ onNavigate, currentPage }: NavbarProps) {\n  const { isAuthenticated } = useAuth();"
)

# Replace navItems
old_nav = "const navItems = [\n    { id: 'home', label: 'Home' },\n    { id: 'services', label: 'Tarieven' },\n    { id: 'booking', label: 'Afspraak' },\n    { id: 'admin', label: 'Admin' },\n  ];"

new_nav = "const navItems = [\n    { id: 'home', label: 'Home' },\n    { id: 'about', label: 'Over Ons' },\n    { id: 'services', label: 'Tarieven' },\n    { id: 'photos', label: 'Foto\'s' },\n    { id: 'booking', label: 'Afspraak' },\n    ...(isAuthenticated ? [{ id: 'admin', label: 'Admin' }] : []),\n  ];"

if old_nav in c:
    c = c.replace(old_nav, new_nav)
    print("navItems replaced")
else:
    print("navItems NOT FOUND")

with open("src/sections/Navbar.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Done")
