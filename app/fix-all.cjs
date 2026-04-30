const fs = require('fs');
let c = fs.readFileSync('src/sections/AdminDashboard.tsx','utf8');

// === 0. Add Input + Textarea imports ===
c = c.replace(
  "import { Label } from '@/components/ui/label';",
  "import { Label } from '@/components/ui/label';\nimport { Input } from '@/components/ui/input';\nimport { Textarea } from '@/components/ui/textarea';"
);

// === 1. Add Plus to lucide-react ===
c = c.replace('Settings, ArrowRight, KeyRound', 'Settings, ArrowRight, KeyRound, Plus');

// === 2. Add serviceOptions ===
c = c.replace(
  'const barberColors: Record<string, { bg: string; text: string; border: string; light: string }> = {',
  'const serviceOptions = Object.keys(serviceNames).map(k => ({ key: k, name: serviceNames[k] }));\n\nconst barberColors: Record<string, { bg: string; text: string; border: string; light: string }> = {'
);

// === 3. REMOVE hardcoded barbersAgenda (will be replaced by state) ===
c = c.replace(
  "const barbersAgenda = [\n  { key: 'mo', name: 'Mo', color: barberColors.mo },\n  { key: 'ma', name: 'Ma', color: barberColors.ma },\n  { key: 'third', name: 'Derde kapper', color: barberColors.third },\n];\n",
  ""
);

// === 4. Add barbersAgenda state + extra states inside component ===
c = c.replace(
  "  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);",
  [
    '  const [barbersAgenda, setBarbersAgenda] = useState([]);',
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

// === 5. Add moveDate/moveTime states ===
c = c.replace(
  "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
  [
    "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
    "  const [moveDate, setMoveDate] = useState('');",
    "  const [moveTime, setMoveTime] = useState('');"
  ].join('\n')
);

// === 6. Add fetchBarbers before fetchData ===
c = c.replace(
  "  const fetchData = async () => {",
  [
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
  ].join('\n')
);

// === 7. Add fetchBarbers to useEffect ===
c = c.replace(
  "useEffect(() => { fetchData(); }, []);",
  "useEffect(() => { fetchData(); fetchBarbers(); }, []);"
);

// === 8. Fix: use 'service' instead of 'treatment' ===
c = c.replace(
  "          treatment: newAppointment.service,",
  "          service: newAppointment.service,"
);

// === 9. Add handleAddAppointment before handleLogout ===
c = c.replace(
  "  const handleLogout = () => { logout(); onNavigate('home'); };",
  [
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
    '          service: newAppointment.service,',
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
    '  };',
    '',
    "  const handleLogout = () => { logout(); onNavigate('home'); };"
  ].join('\n')
);

// === 10. Update handleMove to include date/time ===
const newMoveBody = [
  "      const response = await fetch(API_URL + '/appointments/' + appointmentToMove.id, {",
  "        method: 'PUT',",
  "        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },",
  '        body: JSON.stringify({',
  '          name: appointmentToMove.name,',
  '          email: appointmentToMove.email,',
  '          phone: appointmentToMove.phone,',
  '          service: appointmentToMove.service,',
  '          barber_name: moveTargetBarber,',
  '          date: moveDate || appointmentToMove.date,',
  '          time: moveTime || appointmentToMove.time,',
  '          notes: appointmentToMove.notes,',
  '        })',
  '      });',
  "      if (!response.ok) throw new Error('Verplaatsen mislukt');"
].join('\n');

c = c.replace(
  "      const response = await fetch(API_URL + '/admin/appointments/' + appointmentToMove.id + '/move', {\n        method: 'POST',\n        headers: { 'Authorization': 'Bearer ' + token },\n        body: JSON.stringify({ target_barber_name: moveTargetBarber })\n      });\n      if (!response.ok) throw new Error('Move failed');",
  newMoveBody
);

// === 11. Add "Nieuwe Afspraak" button in agenda header ===
c = c.replace(
  '<div className=\"flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4\">',
  '<div className=\"flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap\">\n                  <Button variant=\"outline\" size=\"sm\" onClick={() => setAddDialogOpen(true)} className=\"gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white\">\n                    <Plus className=\"h-4 w-4\" />Nieuwe Afspraak\n                  </Button>'
);

// === 12. Replace empty time slot dash with clickable add button ===
c = c.replace(
  '<div className=\"text-xs text-stone-100 italic\">\u2014</div>',
  '<button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} className=\"w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors\"><span className=\"text-xs text-stone-200 group-hover:text-stone-400 italic\">+ Toevoegen</span></button>'
);

// === 13. Update move dialog with date/time fields ===
c = c.replace(
  '<Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>',
  '<Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\"\"); setMoveDate(\"\"); setMoveTime(\"\"); } setMoveDialogOpen(v); }}>'
);

c = c.replace(
  '<DialogContent>',
  '<DialogContent className=\"sm:max-w-md\">'
);

c = c.replace(
  '<div className=\"py-4\">\n            <Label>Verplaats naar kapper</Label>\n            <select className=\"w-full mt-1 p-2 border rounded\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>\n              <option value=\"\">Selecteer kapper...</option>\n              <option value=\"mo\">Mo</option>\n              <option value=\"ma\">Ma</option>\n              <option value=\"third\">Derde kapper</option>\n            </select>\n          </div>',
  '<div className=\"space-y-4 py-2\">\n            <div>\n              <Label>Huidig: <strong>{getBarberDisplayName(appointmentToMove?.barber_name || \"\")}</strong> \u2014 {appointmentToMove?.date} om {appointmentToMove?.time}</Label>\n            </div>\n            <div className=\"grid grid-cols-3 gap-3\">\n              <div className=\"col-span-1\">\n                <Label>Kapper</Label>\n                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>\n                  <option value=\"\">Kies...</option>\n                  <option value=\"mo\">Mo</option>\n                  <option value=\"ma\">Ma</option>\n                  <option value=\"third\">Derde kapper</option>\n                </select>\n              </div>\n              <div>\n                <Label>Datum</Label>\n                <Input type=\"date\" className=\"mt-1\" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />\n              </div>\n              <div>\n                <Label>Tijd</Label>\n                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTime} onChange={(e) => setMoveTime(e.target.value)}>\n                  <option value=\"\">Kies...</option>\n                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}\n                </select>\n              </div>\n            </div>\n          </div>'
);

c = c.replace(
  '            <Button variant=\"outline\" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\"\"); }}>Annuleren</Button>',
  '            <Button variant=\"outline\" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(\"\"); setMoveDate(\"\"); setMoveTime(\"\"); }}>Annuleren</Button>'
);

// === 14. Add AddAppointmentDialog JSX before Password Change Dialog ===
c = c.replace(
  '      {/* Password Change Dialog */}',
  '      {/* Add Appointment Dialog */}\n      <AddAppointmentDialog\n        open={addDialogOpen}\n        onOpenChange={setAddDialogOpen}\n        barber={addBarber}\n        setBarber={setAddBarber}\n        time={addTime}\n        setTime={setAddTime}\n        formData={newAppointment}\n        setFormData={setNewAppointment}\n        onSave={handleAddAppointment}\n        isAdding={isAdding}\n      />\n\n      {/* Password Change Dialog */}'
);

// === 15. Add AddAppointmentDialog component before AppointmentListItem ===
const addComp = [
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
  '      <DialogContent className=\"sm:max-w-md\">',
  '        <DialogHeader>',
  '          <DialogTitle className=\"flex items-center gap-2\"><Plus className=\"h-5 w-5 text-[#6b0f1a]\" />Nieuwe Afspraak Toevoegen</DialogTitle>',
  '          <DialogDescription>Voeg handmatig een afspraak toe voor de geselecteerde kapper en tijd.</DialogDescription>',
  '        </DialogHeader>',
  '        <div className=\"space-y-4 py-2\">',
  '          <div className=\"grid grid-cols-2 gap-4\">',
  '            <div>',
  '        <Label>Kapper</Label>',
  '        <select className=\"w-full mt-1 p-2 border rounded\" value={barber} onChange={(e) => setBarber(e.target.value)}>',
  '          <option value=\"\">Kies kapper...</option>',
  '          <option value=\"mo\">Mo</option>',
  '          <option value=\"ma\">Ma</option>',
  '          <option value=\"third\">Derde kapper</option>',
  '        </select>',
  '            </div>',
  '            <div>',
  '        <Label>Tijd</Label>',
  '        <select className=\"w-full mt-1 p-2 border rounded\" value={time} onChange={(e) => setTime(e.target.value)}>',
  '          <option value=\"\">Kies tijd...</option>',
  '          {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}',
  '        </select>',
  '            </div>',
  '          </div>',
  '          <div>',
  '            <Label>Naam *</Label>',
  '            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder=\"Naam klant\" required />',
  '          </div>',
  '          <div className=\"grid grid-cols-2 gap-4\">',
  '            <div>',
  '        <Label>Email</Label>',
  '        <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder=\"email@voorbeeld.nl\" />',
  '            </div>',
  '            <div>',
  '        <Label>Telefoon</Label>',
  '        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder=\"06 12345678\" />',
  '            </div>',
  '          </div>',
  '          <div>',
  '            <Label>Behandeling</Label>',
  '            <select className=\"w-full mt-1 p-2 border rounded\" value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>',
  '        {serviceOptions.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}',
  '            </select>',
  '          </div>',
  '          <div>',
  '            <Label>Notities</Label>',
  '            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder=\"Eventuele notities...\" rows={2} />',
  '          </div>',
  '        </div>',
  '        <DialogFooter>',
  '          <Button variant=\"outline\" onClick={() => onOpenChange(false)} disabled={isAdding}>Annuleren</Button>',
  '          <Button onClick={onSave} disabled={!barber || !time || !formData.name || isAdding} className=\"bg-[#6b0f1a]\">',
  '            {isAdding ? <><Loader2 className=\"h-4 w-4 mr-2 animate-spin\" />Bezig...</> : \"Toevoegen\"}',
  '          </Button>',
  '        </DialogFooter>',
  '      </DialogContent>',
  '    </Dialog>',
  '  );',
  '}'
].join('\n');

c = c.replace(
  'function AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {',
  addComp + '\n\nfunction AppointmentListItem({ appointment, onDelete, onMove }: { appointment: Appointment; onDelete: () => void; onMove: () => void }) {'
);

fs.writeFileSync('src/sections/AdminDashboard.tsx', c, 'utf8');
console.log('DONE');
