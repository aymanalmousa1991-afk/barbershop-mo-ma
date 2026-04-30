with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

# 1. Replace handleMove function (old POST /move -> new PUT with date/time)
old_handle = '''  const handleMove = async () => {
    if (!appointmentToMove || !moveTargetBarber) return;
    setIsMoving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_URL + "/admin/appointments/" + appointmentToMove.id + "/move", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: JSON.stringify({ target_barber_name: moveTargetBarber })
      });
      if (!response.ok) throw new Error("Move failed");
      await fetchData();
      setMoveDialogOpen(false);
      setAppointmentToMove(null);
      setMoveTargetBarber("");
    } catch (err) {
      console.error("Error moving:", err);
    } finally {
      setIsMoving(false);
    }
  };'''

new_handle = '''  const handleMove = async () => {
    if (!appointmentToMove || !moveTargetBarber) return;
    setIsMoving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_URL + "/appointments/" + appointmentToMove.id, {
        method: "PUT",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appointmentToMove.name,
          email: appointmentToMove.email,
          phone: appointmentToMove.phone,
          service: appointmentToMove.service,
          barber_name: moveTargetBarber,
          date: moveDate || appointmentToMove.date,
          time: moveTime || appointmentToMove.time,
          notes: appointmentToMove.notes,
        })
      });
      if (!response.ok) throw new Error("Verplaatsen mislukt");
      await fetchData();
      setMoveDialogOpen(false);
      setAppointmentToMove(null);
      setMoveTargetBarber("");
      setMoveDate("");
      setMoveTime("");
    } catch (err) {
      console.error("Error moving:", err);
    } finally {
      setIsMoving(false);
    }
  };'''

if old_handle in c:
    c = c.replace(old_handle, new_handle)
    print("handleMove replaced")
else:
    print("handleMove NOT FOUND - trying different quote style")
    # Try with single quotes
    old_single = old_handle.replace('"', "'")
    new_single = new_handle.replace('"', "'")
    if old_single in c:
        c = c.replace(old_single, new_single)
        print("handleMove replaced (single quotes)")
    else:
        print("STILL NOT FOUND")

# 2. Replace move dialog JSX (add date/time fields and dynamic barbers)
old_dialog = '''      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(""); setMoveDate(""); setMoveTime(""); } setMoveDialogOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afspraak Verplaatsen</DialogTitle>
            <DialogDescription>
              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> ({appointmentToMove?.date} om {appointmentToMove?.time}) naar een andere kapper.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Verplaats naar kapper</Label>
            <select className="w-full mt-1 p-2 border rounded" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>
              <option value="">Selecteer kapper...</option>
              <option value="mo">Mo</option>
              <option value="ma">Ma</option>
              <option value="third">Derde kapper</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(""); }}>Annuleren</Button>
            <Button onClick={handleMove} disabled={!moveTargetBarber || isMoving} className="bg-[#6b0f1a]">
              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : "Verplaatsen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>'''

new_dialog = '''      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(""); setMoveDate(""); setMoveTime(""); } setMoveDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Afspraak Verplaatsen</DialogTitle>
            <DialogDescription>
              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Huidig: <strong>{getBarberDisplayName(appointmentToMove?.barber_name || "")}</strong> &mdash; {appointmentToMove?.date} om {appointmentToMove?.time}</Label>
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
            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(""); setMoveDate(""); setMoveTime(""); }}>Annuleren</Button>
            <Button onClick={handleMove} disabled={!moveTargetBarber || isMoving} className="bg-[#6b0f1a]">
              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : "Verplaatsen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>'''

old_dialog_single = old_dialog.replace('"', "'")
new_dialog_single = new_dialog.replace('"', "'")

if old_dialog in c:
    c = c.replace(old_dialog, new_dialog)
    print("move dialog replaced (double quotes)")
elif old_dialog_single in c:
    c = c.replace(old_dialog_single, new_dialog_single)
    print("move dialog replaced (single quotes)")
else:
    print("move dialog NOT FOUND")

with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("DONE")
