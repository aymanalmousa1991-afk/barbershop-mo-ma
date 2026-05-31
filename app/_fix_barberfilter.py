f = "src/sections/AdminDashboard.tsx"
with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# 1. Vervang header div om barberFilter dropdown toe te voegen
old_header = """                <div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                    <Plus className="h-4 w-4" />Nieuwe Afspraak
                  </Button>"""

new_header = """                <div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                      <Plus className="h-4 w-4" />Nieuwe Afspraak
                    </Button>
                    <select className="p-2 border rounded text-sm bg-white" value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)}>
                      <option value="">Alle kappers</option>
                      {barbersAgenda.map((b: any) => <option key={b.key} value={b.key}>{b.name}</option>)}
                    </select>
                  </div>"""

c = c.replace(old_header, new_header)
print("1. Header met filter dropdown")

# 2. Vervang grid met filter
old_grid = """                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {barbersAgenda.map(({ key, name, color }) => {"""

new_grid = """                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {barbersAgenda
                    .filter((b: any) => !barberFilter || b.key === barberFilter)
                    .map(({ key, name, color }: any) => {"""

c = c.replace(old_grid, new_grid)
print("2. Grid filter toegevoegd")

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("DONE!")
