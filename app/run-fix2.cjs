const fs = require('fs');
let c = fs.readFileSync('src/sections/AdminDashboard.tsx','utf8');

// 1. Add Input + Textarea imports if missing
if (c.indexOf('Input') < 20) {
  c = c.replace(
    "import { Label } from '@/components/ui/label';",
    "import { Label } from '@/components/ui/label';\nimport { Input } from '@/components/ui/input';\nimport { Textarea } from '@/components/ui/textarea';"
  );
}

// 2. Add Plus to lucide-react
c = c.replace('KeyRound', 'KeyRound, Plus');

// 3. Add serviceOptions after serviceNames
c = c.replace(
  "const barberColors",
  "const serviceOptions = Object.keys(serviceNames).map(k => ({ key: k, name: serviceNames[k] }));\n\nconst barberColors"
);

// 4. Replace hardcoded barbersAgenda with useState
c = c.replace(
  "const barbersAgenda = [\n  { key: 'mo', name: 'Mo', color: barberColors.mo },\n  { key: 'ma', name: 'Ma', color: barberColors.ma },\n  { key: 'third', name: 'Derde kapper', color: barberColors.third },\n];",
  "const [barbersAgenda, setBarbersAgenda] = useState([]);"
);

// 5. Add fetchBarbers before fetchData
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

// 6. Add fetchBarbers to useEffect
c = c.replace(
  "useEffect(() => { fetchData(); }, []);",
  "useEffect(() => { fetchData(); fetchBarbers(); }, []);"
);

// 7. Add moveDate/moveTime states
c = c.replace(
  "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
  [
    "  const [moveTargetBarber, setMoveTargetBarber] = useState('');",
    "  const [moveDate, setMoveDate] = useState('');",
    "  const [moveTime, setMoveTime] = useState('');"
  ].join('\n')
);

// 8. Add add appointment states
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

// 9. Add handleAddAppointment before handleLogout
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
    '  };',
    '',
    "  const handleLogout = () => { logout(); onNavigate('home'); };"
  ].join('\n')
);

// 10. Update handleMove to include date/time
c = c.replace(
  "      const response = await fetch(API_URL + '/admin/appointments/' + appointmentToMove.id + '/move', {",
  "      const response = await fetch(API_URL + '/appointments/' + appointmentToMove.id, {",
);
c = c.replace(
  "        method: 'POST',\n        headers: { 'Authorization': Bearer  },\n        body: JSON.stringify({ target_barber_name: moveTargetBarber })",
  "        method: 'PUT',\n        headers: { 'Authorization': Bearer , 'Content-Type': 'application/json' },\n        body: JSON.stringify({\n          name: appointmentToMove.name,\n          email: appointmentToMove.email,\n          phone: appointmentToMove.phone,\n          service: appointmentToMove.service,\n          barber_name: moveTargetBarber,\n          date: moveDate || appointmentToMove.date,\n          time: moveTime || appointmentToMove.time,\n          notes: appointmentToMove.notes,\n        })"
);

// 11. Add new appointment button in agenda header
c = c.replace(
  '<div className=\"flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4\">',
  '<div className=\"flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap\"><Button variant=\"outline\" size=\"sm\" onClick={() => setAddDialogOpen(true)} className=\"gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white\"><Plus className=\"h-4 w-4\" />Nieuwe Afspraak</Button>'
);

// 12. Replace empty time slot dash with clickable add button
c = c.replace(
  '<div className=\"text-xs text-stone-100 italic\">\u2014</div>',
  '<button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} className=\"w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors\"><span className=\"text-xs text-stone-200 group-hover:text-stone-400 italic\">+ Toevoegen</span></button>'
);

// 13. Update move dialog: make dialog controlled with reset
c = c.replace(
  '<Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>',
  '<Dialog open={moveDialogOpen} onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\"\u0027\"); setMoveDate(\"\u0027\"); setMoveTime(\"\u0027\"); } setMoveDialogOpen(v); }}>'
);

fs.writeFileSync('src/sections/AdminDashboard.tsx', c, 'utf8');
console.log('DONE');
