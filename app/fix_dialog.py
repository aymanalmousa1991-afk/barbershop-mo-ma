with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

# Find the move dialog block
start = c.find("      {/* Move Dialog */}")
end = c.find("      {/* Add Appointment Dialog */}")
print(f"Move dialog from {start} to {end}")
if start >= 0 and end > start:
    old_dialog = c[start:end]
    print("=== OLD DIALOG ===")
    print(old_dialog[:200])
    print("...")
    
    new_dialog = """      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(''); setMoveDate(''); setMoveTime(''); } setMoveDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Afspraak Verplaatsen</DialogTitle>
            <DialogDescription>
              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Huidig: <strong>{getBarberDisplayName(appointmentToMove?.barber_name || '')}</strong> &mdash; {appointmentToMove?.date} om {appointmentToMove?.time}</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Kapper</Label>
                <select className="w-full mt-1 p-2 border rounded text-sm" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>
                  <option value="">Kies...</option>
                  {barbersAgenda.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Datum</Label>
                <Input type="date" className="mt-1" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
              </div>
              <div>
                <Label>Tijd</Label>
                <select className="w-full mt-1 p-2 border rounded text-sm" value={moveTime} onChange={(e) => setMoveTime(e.target.value)}>
                  <option value="">Kies...</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(''); setMoveDate(''); setMoveTime(''); }}>Annuleren</Button>
            <Button onClick={handleMove} disabled={!moveTargetBarber || isMoving} className="bg-[#6b0f1a]">
              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : 'Verplaatsen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
"""
    
    c = c[:start] + new_dialog + c[end:]
    print("Move dialog replaced")
    
    with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
        f.write(c)
    print("DONE")
else:
    print("Move dialog not found!")
