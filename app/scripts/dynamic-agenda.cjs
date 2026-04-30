const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'sections', 'AdminDashboard.tsx');
let c = fs.readFileSync(file, 'utf8');

// 1. Vervang hardcoded barbersAgenda met useState
const oldAgenda = `const barbersAgenda = [
  { key: 'mo', name: 'Mo', color: barberColors.mo },
  { key: 'ma', name: 'Ma', color: barberColors.ma },
  { key: 'third', name: 'Derde kapper', color: barberColors.third },
];`;

const newAgendaStart = `const [barbersAgenda, setBarbersAgenda] = useState<{key:string;name:string;color:{bg:string;text:string;border:string;light:string}}[]>([]);`;

c = c.replace(oldAgenda, newAgendaStart);

// 2. Voeg fetchBarbers functie toe vóór fetchData
const oldFetch = `  const fetchData = async () => {`;
const newFetch = `  const fetchBarbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(\`\${API_URL}/admin/barbers\`, { headers: { Authorization: \`Bearer \${token}\` } });
      const data = await res.json();
      if (data.success && data.data) {
        setBarbersAgenda(data.data.filter((b:any) => b.is_active).map((b:any) => ({
          key: b.name,
          name: b.display_name,
          color: barberColors[b.name] || { bg: 'bg-stone-600', text: 'text-stone-600', border: 'border-stone-600', light: 'bg-stone-50 border-stone-200' },
        })));
      }
    } catch (err) {
      console.error('Error fetching barbers:', err);
    }
  };

  const fetchData = async () => {`;

c = c.replace(oldFetch, newFetch);

// 3. Voeg fetchBarbers toe aan useEffect
c = c.replace(
  "useEffect(() => { fetchData(); }, []);",
  "useEffect(() => { fetchData(); fetchBarbers(); }, []);"
);

fs.writeFileSync(file, c, 'utf8');
console.log('✅ Agenda dynamic gemaakt');
