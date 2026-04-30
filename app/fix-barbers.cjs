const fs = require('fs');
let c = fs.readFileSync('src/sections/AdminDashboard.tsx','utf8');

// 1. Hardcoded barbersAgenda -> useState
const oldAgenda = "const barbersAgenda = [\n  { key: 'mo', name: 'Mo', color: barberColors.mo },\n  { key: 'ma', name: 'Ma', color: barberColors.ma },\n  { key: 'third', name: 'Derde kapper', color: barberColors.third },\n];";
const newAgenda = "const [barbersAgenda, setBarbersAgenda] = useState([]);";
c = c.replace(oldAgenda, newAgenda);

// 2. Add fetchBarbers before fetchData
const fetchBarbersCode = "  const fetchBarbers = async () => {\n    try {\n      const token = localStorage.getItem('token');\n      const res = await fetch(API_URL + '/admin/barbers', { headers: { Authorization: 'Bearer ' + token } });\n      const data = await res.json();\n      if (data.success && data.data) {\n        setBarbersAgenda(data.data.filter((b) => b.is_active).map((b) => ({\n          key: b.name,\n          name: b.display_name,\n          color: barberColors[b.name] || { bg: 'bg-stone-600', text: 'text-stone-600', border: 'border-stone-600', light: 'bg-stone-50 border-stone-200' },\n        })));\n      }\n    } catch (err) {\n      console.error('Error fetching barbers:', err);\n    }\n  };\n\n  const fetchData = async () => {";
c = c.replace("  const fetchData = async () => {", fetchBarbersCode);

// 3. Add fetchBarbers to useEffect
c = c.replace("useEffect(() => { fetchData(); }, []);", "useEffect(() => { fetchData(); fetchBarbers(); }, []);");

// 4. Fix: use 'service' instead of 'treatment' in handleAddAppointment
c = c.replace("          treatment: newAppointment.service,", "          service: newAppointment.service,");

fs.writeFileSync('src/sections/AdminDashboard.tsx', c, 'utf8');
console.log('DONE');
