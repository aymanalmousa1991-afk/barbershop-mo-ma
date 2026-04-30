const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'sections', 'AdminDashboard.tsx');

// Read clean version from commit 37c20b8
const { execSync } = require('child_process');
const buf = execSync('git show 37c20b8:app/src/sections/AdminDashboard.tsx', { 
  cwd: path.join(__dirname, '..', '..'),
  encoding: 'buffer' 
});
let c = buf.toString('utf8');

// ===== Stap 1: imports =====
c = c.replace(
  "import { Label } from '@/components/ui/label';",
  "import { Label } from '@/components/ui/label';\nimport { Input } from '@/components/ui/input';\nimport { Textarea } from '@/components/ui/textarea';"
);
c = c.replace('Settings, ArrowRight, KeyRound', 'Settings, ArrowRight, KeyRound, Plus');

// ===== Stap 2: serviceOptions =====
c = c.replace(
  'const barberColors: Record',
  "const serviceOptions = Object.keys(serviceNames).map(k => ({ key: k, name: serviceNames[k] }));\n\nconst barberColors: Record"
);

// ===== Stap 3: moveDate, moveTime states =====
c = c.replace(
  "const [moveTargetBarber, setMoveTargetBarber] = useState('');\n  const [isMoving, setIsMoving] = useState(false);",
  "const [moveTargetBarber, setMoveTargetBarber] = useState('');\n  const [moveDate, setMoveDate] = useState('');\n  const [moveTime, setMoveTime] = useState('');\n  const [isMoving, setIsMoving] = useState(false);"
);

// ===== Stap 4: add appointment states =====
c = c.replace(
  "const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);",
  "const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);\n\n  // Nieuwe afspraak toevoegen\n  const [addDialogOpen, setAddDialogOpen] = useState(false);\n  const [addBarber, setAddBarber] = useState('');\n  const [addTime, setAddTime] = useState('');\n  const [newAppointment, setNewAppointment] = useState({ name: '', email: '', phone: '', service: 'knippen-stylen', notes: '' });\n  const [isAdding, setIsAdding] = useState(false);"
);

// ===== Stap 5: handleMove met PUT =====
c = c.replace(
  "  const handleMove = async () => {\n    if (!appointmentToMove || !moveTargetBarber) return;\n    setIsMoving(true);\n    try {\n      const token = localStorage.getItem('token');\n      const response = await fetch(`$",
  "  const handleMove = async () => {\n    if (!appointmentToMove || !moveTargetBarber) return;\n    setIsMoving(true);\n    try {\n      const token = localStorage.getItem('token');\n      const response = await fetch(`$"
);
// This is tricky, let's use a more precise approach - find the old handleMove and replace it

// Let me write it differently - extract old and new as variables
const oldHandleMove = [
  "  const handleMove = async () => {",
  "    if (!appointmentToMove || !moveTargetBarber) return;",
  "    setIsMoving(true);",
  "    try {",
  "      const token = localStorage.getItem('token');",
  "      const response = await fetch(`${API_URL}/admin/appointments/${appointmentToMove.id}/move`, {",
  "        method: 'POST',",
  "        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },",
  "        body: JSON.stringify({ target_barber_name: moveTargetBarber })",
  "      });",
  "      if (!response.ok) throw new Error('Move failed');",
  "      await fetchData();",
  "      setMoveDialogOpen(false);",
  "      setAppointmentToMove(null);",
  "      setMoveTargetBarber('');",
  "    } catch (err) {",
  "      console.error('Error moving:', err);",
  "    } finally {",
  "      setIsMoving(false);",
  "    }",
  "  };",
].join('\n');

const newHandleMove = [
  "  const handleMove = async () => {",
  "    if (!appointmentToMove || !moveTargetBarber) return;",
  "    setIsMoving(true);",
  "    try {",
  "      const token = localStorage.getItem('token');",
  "      const response = await fetch(`${API_URL}/appointments/${appointmentToMove.id}`, {",
  "        method: 'PUT',",
  "        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },",
  "        body: JSON.stringify({",
  "          name: appointmentToMove.name,",
  "          email: appointmentToMove.email,",
  "          phone: appointmentToMove.phone,",
  "          service: appointmentToMove.service,",
  "          barber_name: moveTargetBarber,",
  "          date: moveDate || appointmentToMove.date,",
  "          time: moveTime || appointmentToMove.time,",
  "          notes: appointmentToMove.notes,",
  "        })",
  "      });",
  "      if (!response.ok) throw new Error('Verplaatsen mislukt');",
  "      await fetchData();",
  "      setMoveDialogOpen(false);",
  "      setAppointmentToMove(null);",
  "      setMoveTargetBarber('');",
  "      setMoveDate('');",
  "      setMoveTime('');",
  "    } catch (err) {",
  "      console.error('Error moving:', err);",
  "    } finally {",
  "      setIsMoving(false);",
  "    }",
  "  };",
].join('\n');

if (c.includes(oldHandleMove)) {
  c = c.replace(oldHandleMove, newHandleMove);
  console.log('Stap 5: handleMove vervangen');
} else {
  console.log('Stap 5: handleMove NIET gevonden, zoek alternatief...');
}

// ===== Stap 6: handleAddAppointment toevoegen voor handleLogout =====
const handleAddAppointment = [
  "  const handleAddAppointment = async () => {",
  "    if (!addBarber || !addTime || !newAppointment.name) return;",
  "    setIsAdding(true);",
  "    try {",
  "      const token = localStorage.getItem('token');",
  "      const response = await fetch(`${API_URL}/appointments`, {",
  "        method: 'POST',",
  "        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },",
  "        body: JSON.stringify({",
  "          name: newAppointment.name,",
  "          email: newAppointment.email,",
  "          phone: newAppointment.phone,",
  "          treatment: newAppointment.service,",
  "          barber_name: addBarber,",
  "          date: selectedDate,",
  "          time: addTime,",
  "          notes: newAppointment.notes,",
  "        })",
  "      });",
  "      if (!response.ok) throw new Error('Fout bij toevoegen');",
  "      await fetchData();",
  "      setAddDialogOpen(false);",
  "      setAddBarber('');",
  "      setAddTime('');",
  "      setNewAppointment({ name: '', email: '', phone: '', service: 'knippen-stylen', notes: '' });",
  "    } catch (err) {",
  "      console.error('Error adding:', err);",
  "    } finally {",
  "      setIsAdding(false);",
  "    }",
  "  };",
].join('\n');

c = c.replace(
  "  const handleLogout = () => { logout(); onNavigate('home'); };",
  handleAddAppointment + "\n\n  const handleLogout = () => { logout(); onNavigate('home'); };"
);

// ===== Stap 7: Nieuwe Afspraak knop + flex-wrap =====
const oldHeader = '<div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4">\n                  <Button variant="ghost" onClick={handlePrevDay}';
const newHeader = '<div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">\n                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">\n                    <Plus className="h-4 w-4" />Nieuwe Afspraak\n                  </Button>\n                  <Button variant="ghost" onClick={handlePrevDay}';
c = c.replace(oldHeader, newHeader);

// ===== Stap 8: Move button set moveDate/moveTime =====
c = c.replace(
  "onClick={() => { setAppointmentToMove(apt); setMoveDialogOpen(true); }}",
  "onClick={() => { setAppointmentToMove(apt); setMoveDate(apt.date); setMoveTime(apt.time); setMoveDialogOpen(true); }}"
);

// ===== Stap 9: Clickable empty slots =====
const oldSlot = '<div className="text-xs text-stone-100 italic">\u2014</div>';
const newSlot = '<button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} \n                                        className="w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors">\n                                        <span className="text-xs text-stone-200 group-hover:text-stone-400 italic">+ Toevoegen</span>\n                                      </button>';
c = c.replace(oldSlot, newSlot);

// ===== Stap 10: Alle onMove handlers in list view =====
c = c.replace(
  "onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }}",
  "onMove={() => { setAppointmentToMove(a); setMoveDate(a.date); setMoveTime(a.time); setMoveDialogOpen(true); }}"
);

// ===== Stap 11: Move Dialog vervangen =====
const oldMoveDialogStart = '      {/* Move Dialog */}\n      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>';
const oldMoveDialogEnd = '      </Dialog>';
const oldMoveDialogFull = [
  '      {/* Move Dialog */}',
  '      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>',
  '        <DialogContent>',
  '          <DialogHeader>',
  '            <DialogTitle>Afspraak Verplaatsen</DialogTitle>',
  '            <DialogDescription>',
  '              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> ({appointmentToMove?.date} om {appointmentToMove?.time}) naar een andere kapper.',
  '            </DialogDescription>',
  '          </DialogHeader>',
  '          <div className="py-4">',
  '            <Label>Verplaats naar kapper</Label>',
  '            <select className="w-full mt-1 p-2 border rounded" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>',
  '              <option value="">Selecteer kapper...</option>',
  '              <option value="mo">Mo</option>',
  '              <option value="ma">Ma</option>',
  '              <option value="third">Derde kapper</option>',
  '            </select>',
  '          </div>',
  '          <DialogFooter>',
  '            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\'\'); }}>Annuleren</Button>',
  '            <Button onClick={handleMove} disabled={!moveTargetBarber || isMoving} className="bg-[#6b0f1a]">',
  '              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : \'Verplaatsen\'}',
  '            </Button>',
  '          </DialogFooter>',
  '        </DialogContent>',
  '      </Dialog>',
].join('\n');

const newMoveDialogFull = [
  '      {/* Move Dialog */}',
  '      <Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\'\'); setMoveDate(\'\'); setMoveTime(\'\'); } setMoveDialogOpen(v); }}>',
  '        <DialogContent className="sm:max-w-md">',
  '          <DialogHeader>',
  '            <DialogTitle>Afspraak Verplaatsen</DialogTitle>',
  '            <DialogDescription>',
  '              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.',
  '            </DialogDescription>',
  '          </DialogHeader>',
  '          <div className="space-y-4 py-2">',
  '            <div>',
  '              <Label>Huidig: <strong>{getBarberDisplayName(appointmentToMove?.barber_name || \'\')}</strong> \u2014 {appointmentToMove?.date} om {appointmentToMove?.time}</Label>',
  '            </div>',
  '            <div className="grid grid-cols-3 gap-3">',
  '              <div className="col-span-1">',
  '                <Label>Kapper</Label>',
  '                <select className="w-full mt-1 p-2 border rounded text-sm" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>',
  '                  <option value="">Kies...</option>',
  '                  <option value="mo">Mo</option>',
  '                  <option value="ma">Ma</option>',
  '                  <option value="third">Derde kapper</option>',
  '                </select>',
  '              </div>',
  '              <div>',
  '                <Label>Datum</Label>',
  '                <Input type="date" className="mt-1" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />',
  '              </div>',
  '              <div>',
  '                <Label>Tijd</Label>',
  '                <select className="w-full mt-1 p-2 border rounded text-sm" value={moveTime} onChange={(e) => setMoveTime(e.target.value)}>',
  '                  <option value="">Kies...</option>',
  '                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}',
  '                </select>',
  '              </div>',
  '            </div>',
  '          </div>',
  '          <DialogFooter>',
  '            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\'\'); setMoveDate(\'\'); setMoveTime(\'\'); }}>Annuleren</Button>',
  '            <Button onClick={handleMove} disabled={!moveTargetBarber || isMoving} className="bg-[#6b0f1a]">',
  '              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : \'Verplaatsen\'}',
  '            </Button>',
  '          </DialogFooter>',
  '        </DialogContent>',
  '      </Dialog>',
].join('\n');

c = c.replace(oldMoveDialogFull, newMoveDialogFull);

// ===== Stap 12: AddAppointmentDialog component toevoegen voor AppointmentListItem =====
const addDialogComponent = [
  'function AddAppointmentDialog({',
  '  open, onOpenChange, barber, setBarber, time, setTime,',
  '  formData, setFormData, onSave, isAdding',
  '}: {',
  '  open: boolean; onOpenChange: (v: boolean) => void;',
  '  barber: string; setBarber: (v: string) => void;',
  '  time: string; setTime: (v: string) => void;',
  '  formData: { name: string; email: string; phone: string; service: string; notes: string };',
  '  setFormData: (v: any) => void;',
  '  onSave: () => void; isAdding: boolean;',
  '}) {',
  '  return (',
  '    <Dialog open={open} onOpenChange={onOpenChange}>',
  '      <DialogContent className="sm:max-w-md">',
  '        <DialogHeader>',
  '          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-[#6b0f1a]" />Nieuwe Afspraak Toevoegen</DialogTitle>',
  '          <DialogDescription>Voeg handmatig een afspraak toe voor de geselecteerde kapper en tijd.</DialogDescription>',
  '        </DialogHeader>',
  '        <div className="space-y-4 py-2">',
  '          <div className="grid grid-cols-2 gap-4">',
  '            <div>',
  '        <Label>Kapper</Label>',
  '        <select className="w-full mt-1 p-2 border rounded" value={barber} onChange={(e) => setBarber(e.target.value)}>',
  '          <option value="">Kies kapper...</option>',
  '          <option value="mo">Mo</option>',
  '          <option value="ma">Ma</option>',
  '          <option value="third">Derde kapper</option>',
  '        </select>',
  '            </div>',
  '            <div>',
  '        <Label>Tijd</Label>',
  '        <select className="w-full mt-1 p-2 border rounded" value={time} onChange={(e) => setTime(e.target.value)}>',
  '          <option value="">Kies tijd...</option>',
  '          {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}',
  '        </select>',
  '            </div>',
  '          </div>',
  '          <div>',
  '            <Label>Naam *</Label>',
  '            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Naam klant" required />',
  '          </div>',
  '          <div className="grid grid-cols-2 gap-4">',
  '            <div>',
  '        <Label>Email</Label>',
  '        <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@voorbeeld.nl" />',
  '            </div>',
  '            <div>',
  '        <Label>Telefoon</Label>',
  '        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="06 12345678" />',
  '            </div>',
  '          </div>',
  '          <div>',
  '            <Label>Behandeling</Label>',
  '            <select className="w-full mt-1 p-2 border rounded" value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>',
  '              {serviceOptions.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}',
  '            </select>',
  '          </div>',
  '          <div>',
  '            <Label>Notities</Label>',
  '            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Eventuele notities..." rows={2} />',
  '          </div>',
  '        </div>',
  '        <DialogFooter>',
  '          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>Annuleren</Button>',
  '          <Button onClick={onSave} disabled={!barber || !time || !formData.name || isAdding} className="bg-[#6b0f1a]">',
  '            {isAdding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : \'Toevoegen\'}',
  '          </Button>',
  '        </DialogFooter>',
  '      </DialogContent>',
  '    </Dialog>',
  '  );',
  '}',
  '',
].join('\n');

c = c.replace(
  'function AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {',
  addDialogComponent + 'function AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {'
);

// ===== Stap 13: AddAppointmentDialog usage toevoegen voor Password Change Dialog =====
const addDialogUsage = [
  '      {/* Add Appointment Dialog */}',
  '      <AddAppointmentDialog',
  '        open={addDialogOpen}',
  '        onOpenChange={setAddDialogOpen}',
  '        barber={addBarber}',
  '        setBarber={setAddBarber}',
  '        time={addTime}',
  '        setTime={setAddTime}',
  '        formData={newAppointment}',
  '        setFormData={setNewAppointment}',
  '        onSave={handleAddAppointment}',
  '        isAdding={isAdding}',
  '      />',
  '',
].join('\n');

c = c.replace(
  '      {/* Password Change Dialog */}',
  addDialogUsage + '      {/* Password Change Dialog */}'
);

fs.writeFileSync(file, c, 'utf8');
console.log('Alle stappen toegepast!');
