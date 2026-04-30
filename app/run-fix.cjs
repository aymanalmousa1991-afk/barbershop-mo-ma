const fs = require('fs');
let c = fs.readFileSync('src/sections/AdminDashboard.tsx','utf8');

// ===== 1. Vervang hardcoded barbersAgenda met useState =====
const oldAgenda = [
  "const barbersAgenda = [",
  "  { key: 'mo', name: 'Mo', color: barberColors.mo },",
  "  { key: 'ma', name: 'Ma', color: barberColors.ma },",
  "  { key: 'third', name: 'Derde kapper', color: barberColors.third },",
  "];"
].join('\n');

const newAgenda = "const [barbersAgenda, setBarbersAgenda] = useState([]);";

c = c.replace(oldAgenda, newAgenda);

// ===== 2. Voeg fetchBarbers functie toe vóór fetchData =====
const fetchBarbersCode = [
  '  const fetchBarbers = async () => {',
  '    try {',
  "      const token = localStorage.getItem('token');",
  "      const res = await fetch(API_URL + '/admin/barbers', { headers: { Authorization: 'Bearer ' + token } });",
  '      const data = await res.json();',
  '      if (data.success && data.data) {',
  '        setBarbersAgenda(data.data.filter((b) => b.is_active).map((b) => ({',
  '          key: b.name,',
  '          name: b.display_name,',
  "          color: barberColors[b.name] || { bg: 'bg-stone-600', text: 'text-stone-600', border: 'border-stone-600', light: 'bg-stone-50 border-stone-200' },",
  '        })));',
  '      }',
  '    } catch (err) {',
  "      console.error('Error fetching barbers:', err);",
  '    }',
  '  };',
  '',
  '  const fetchData = async () => {'
].join('\n');

c = c.replace('  const fetchData = async () => {', fetchBarbersCode);

// ===== 3. Voeg fetchBarbers toe aan useEffect =====
c = c.replace(
  "useEffect(() => { fetchData(); }, []);",
  "useEffect(() => { fetchData(); fetchBarbers(); }, []);"
);

// ===== 4. Voeg Plus import toe aan lucide-react =====
c = c.replace(
  "  Settings, ArrowRight, KeyRound",
  "  Settings, ArrowRight, KeyRound, Plus"
);

// ===== 5. Voeg serviceOptions toe na serviceNames =====
c = c.replace(
  "const barberColors: Record<string, { bg: string; text: string; border: string; light: string }> = {",
  "const serviceOptions = Object.keys(serviceNames).map(k => ({ key: k, name: serviceNames[k] }));\n\nconst barberColors: Record<string, { bg: string; text: string; border: string; light: string }> = {"
);

// ===== 6. Voeg states voor add appointment toe =====
c = c.replace(
  "  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);",
  [
    '  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);',
    '',
    '  // Nieuwe afspraak toevoegen',
    "  const [addDialogOpen, setAddDialogOpen] = useState(false);",
    "  const [addBarber, setAddBarber] = useState('');",
    "  const [addTime, setAddTime] = useState('');",
    "  const [newAppointment, setNewAppointment] = useState({ name: '', email: '', phone: '', service: 'knippen-stylen', notes: '' });",
    "  const [isAdding, setIsAdding] = useState(false);"
  ].join('\n')
);

// ===== 7. Voeg moveDate/moveTime states toe (na moveTargetBarber) =====
c = c.replace(
  "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
  [
    "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
    "  const [moveDate, setMoveDate] = useState('');",
    "  const [moveTime, setMoveTime] = useState('');"
  ].join('\n')
);

// ===== 8. Voeg handleAddAppointment functie toe vóór handleLogout =====
const addFunc = [
  '',
  '  const handleAddAppointment = async () => {',
  "    if (!addBarber || !addTime || !newAppointment.name) return;",
  '    setIsAdding(true);',
  '    try {',
  "      const token = localStorage.getItem('token');",
  "      const response = await fetch(API_URL + '/appointments', {",
  "        method: 'POST',",
  "        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },",
  '        body: JSON.stringify({',
  '          name: newAppointment.name,',
  '          email: newAppointment.email,',
  '          phone: newAppointment.phone,',
  '          treatment: newAppointment.service,',
  '          barber_name: addBarber,',
  '          date: selectedDate,',
  '          time: addTime,',
  '          notes: newAppointment.notes,',
  '        })',
  '      });',
  "      if (!response.ok) throw new Error('Fout bij toevoegen');",
  '      await fetchData();',
  '      setAddDialogOpen(false);',
  "      setAddBarber('');",
  "      setAddTime('');",
  "      setNewAppointment({ name: '', email: '', phone: '', service: 'knippen-stylen', notes: '' });",
  '    } catch (err) {',
  "      console.error('Error adding:', err);",
  '    } finally {',
  '      setIsAdding(false);',
  '    }',
  '  };'
].join('\n');

c = c.replace('  const handleLogout = () => { logout(); onNavigate(\'home\'); };', addFunc + '\n\n  const handleLogout = () => { logout(); onNavigate(\'home\'); };');

// ===== 9. Voeg "Nieuwe Afspraak" knop toe in agenda header =====
c = c.replace(
  '<div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4">',
  '<div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">\n                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">\n                    <Plus className="h-4 w-4" />Nieuwe Afspraak\n                  </Button>'
);

// ===== 10. Vervang leeg tijdslot (—) met klikbare "Toevoegen" knop =====
c = c.replace(
  '                          <div className="text-xs text-stone-100 italic">\u2014</div>',
  '                          <button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} \n                                            className="w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors">\n                                            <span className="text-xs text-stone-200 group-hover:text-stone-400 italic">+ Toevoegen</span>\n                                          </button>'
);

// ===== 11. Update move dialog: voeg datum/tijd velden toe =====
c = c.replace(
  '      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>',
  '      <Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\'\'); setMoveDate(\'\'); setMoveTime(\'\'); } setMoveDialogOpen(v); }}>'
);

c = c.replace(
  '        <DialogContent>',
  '        <DialogContent className="sm:max-w-md">'
);

// Update move dialog description
c = c.replace(
  '              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> ({appointmentToMove?.date} om {appointmentToMove?.time}) naar een andere kapper.',
  '              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.'
);

// Replace the simple move dialog content with grid layout
c = c.replace(
  '          <div className="py-4">\n            <Label>Verplaats naar kapper</Label>\n            <select className="w-full mt-1 p-2 border rounded" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>\n              <option value="">Selecteer kapper...</option>\n              <option value="mo">Mo</option>\n              <option value="ma">Ma</option>\n              <option value="third">Derde kapper</option>\n            </select>\n          </div>',
  [
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
    '          </div>'
  ].join('\n')
);

// Update cancel button in move dialog
c = c.replace(
  '            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\'\'); }}>Annuleren</Button>',
  '            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\'\'); setMoveDate(\'\'); setMoveTime(\'\'); }}>Annuleren</Button>'
);

// ===== 12. Voeg AddAppointmentDialog component toe na de Move Dialog sluiting, vóór Password Change Dialog =====
const addDialogJSX = [
  '',
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
  '      />'
].join('\n');

c = c.replace(
  '      {/* Password Change Dialog */}',
  addDialogJSX + '\n\n      {/* Password Change Dialog */}'
);

// ===== 13. Voeg AddAppointmentDialog functiecomponent toe vóór AppointmentListItem =====
const addDialogComponent = [
  '',
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
  '        {serviceOptions.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}',
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
  '}'
].join('\n');

c = c.replace(
  'function AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {',
  addDialogComponent + '\n\nfunction AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {'
);

// ===== 14. Update onMove in lijstweergave om moveDate/moveTime te zetten =====
c = c.replace(
  'onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }}',
  'onMove={() => { setAppointmentToMove(a); setMoveDate(a.date); setMoveTime(a.time); setMoveDialogOpen(true); }}'
);

// ===== 15. Update verplaatsknop in agenda =====
c = c.replace(
  'onClick={() => { setAppointmentToMove(apt); setMoveDialogOpen(true); }} \n                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 bg-white rounded-full p-1 shadow-sm" title="Verplaatsen">',
  'onClick={() => { setAppointmentToMove(apt); setMoveDate(apt.date); setMoveTime(apt.time); setMoveDialogOpen(true); }} \n                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 bg-white rounded-full p-1 shadow-sm" title="Verplaatsen">'
);

// ===== 16. Update handleMove PUT endpoint =====
c = c.replace(
  "      const response = await fetch(API_URL + '/admin/appointments/' + appointmentToMove.id + '/move', {",
  "      const response = await fetch(API_URL + '/appointments/' + appointmentToMove.id, {",
);
c = c.replace(
  "        method: 'POST',",
  "        method: 'PUT',",
);
c = c.replace(
  "        body: JSON.stringify({ target_barber_name: moveTargetBarber })",
  "        body: JSON.stringify({\n          name: appointmentToMove.name,\n          email: appointmentToMove.email,\n          phone: appointmentToMove.phone,\n          service: appointmentToMove.service,\n          barber_name: moveTargetBarber,\n          date: moveDate || appointmentToMove.date,\n          time: moveTime || appointmentToMove.time,\n          notes: appointmentToMove.notes,\n        })"
);
c = c.replace(
  "      if (!response.ok) throw new Error('Move failed');",
  "      if (!response.ok) throw new Error('Verplaatsen mislukt');",
);
c = c.replace(
  "      setMoveTargetBarber('');\n    } catch (err) {",
  "      setMoveTargetBarber('');\n      setMoveDate('');\n      setMoveTime('');\n    } catch (err) {",
);

fs.writeFileSync('src/sections/AdminDashboard.tsx', c, 'utf8');
console.log('ALL DONE');
