with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

# 1. Change static barbersAgenda to dynamic from API
old_barbers = """const barbersAgenda = [
  { key: 'mo', name: 'Mo', color: barberColors.mo },
  { key: 'ma', name: 'Ma', color: barberColors.ma },
  { key: 'third', name: 'Derde kapper', color: barberColors.third },
];"""

new_barbers = """// Dynamische barbers - wordt geladen uit API
const [barbersAgenda, setBarbersAgenda] = useState<{key:string;name:string;color:{bg:string;text:string;border:string;light:string}}[]>([]);
// Hardcode fallback voor Mo en Ma (altijd bestaand)
const [barberFilter, setBarberFilter] = useState<string>("");"""

c = c.replace(old_barbers, new_barbers)

# 2. Add fetchBarbers in fetchData
old_fetch = """  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [appointmentsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (!appointmentsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      const appointmentsResult = await appointmentsRes.json();
      const statsResult = await statsRes.json();
      setAppointments(appointmentsResult.data || appointmentsResult);
      setStats(statsResult.data?.stats || statsResult.stats);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kon gegevens niet laden.');
    } finally {
      setIsLoading(false);
    }
  };"""

new_fetch = """  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [appointmentsRes, statsRes, barbersRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/barbers`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (!appointmentsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      const appointmentsResult = await appointmentsRes.json();
      const statsResult = await statsRes.json();
      setAppointments(appointmentsResult.data || appointmentsResult);
      setStats(statsResult.data?.stats || statsResult.stats);
      
      // Laad dynamische barbers
      if (barbersRes.ok) {
        const barbersResult = await barbersRes.json();
        if (barbersResult.success && barbersResult.data) {
          const mapped = barbersResult.data.map((b: any) => ({
            key: b.name,
            name: b.display_name,
            color: barberColors[b.name] || defaultBarberColor
          }));
          setBarbersAgenda(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kon gegevens niet laden.');
    } finally {
      setIsLoading(false);
    }
  };"""

c = c.replace(old_fetch, new_fetch)

# 3. Add barber filter and date to add appointment dialog
# The barberFilter state and select element for agenda
old_agenda_header = """            {activeView === 'agenda' ? (
              <>
                <div className=\"flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap\">
                  <Button variant=\"outline\" size=\"sm\" onClick={() => setAddDialogOpen(true)} className=\"gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white\">
                    <Plus className=\"h-4 w-4\" />Nieuwe Afspraak
                  </Button>"""

new_agenda_header = """            {activeView === 'agenda' ? (
              <>
                <div className=\"flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap\">
                  <div className=\"flex items-center gap-2 flex-wrap\">
                    <Button variant=\"outline\" size=\"sm\" onClick={() => setAddDialogOpen(true)} className=\"gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white\">
                      <Plus className=\"h-4 w-4\" />Nieuwe Afspraak
                    </Button>
                    <select className=\"p-2 border rounded text-sm\" value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)}>
                      <option value=\"\">Alle kappers</option>
                      {barbersAgenda.map((b: any) => <option key={b.key} value={b.key}>{b.name}</option>)}
                    </select>
                  </div>"""

c = c.replace(old_agenda_header, new_agenda_header)

# 4. Filter grid by barberFilter
old_grid = """                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
                  {barbersAgenda.map(({ key, name, color }) => {"""

new_grid = """                <div className=\"grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6\">
                  {barbersAgenda
                    .filter((b: any) => !barberFilter || b.key === barberFilter)
                    .map(({ key, name, color }: any) => {"""

c = c.replace(old_grid, new_grid)

# 5. Add date field to AddAppointmentDialog
old_add_dialog_open = """      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        barber={addBarber}
        setBarber={setAddBarber}
        time={addTime}
        setTime={setAddTime}
        formData={newAppointment}
        setFormData={setNewAppointment}
        onSave={handleAddAppointment}
        isAdding={isAdding}
      />"""

new_add_dialog_open = """      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        barber={addBarber}
        setBarber={setAddBarber}
        date={selectedDate}
        setDate={setSelectedDate}
        time={addTime}
        setTime={setAddTime}
        formData={newAppointment}
        setFormData={setNewAppointment}
        onSave={handleAddAppointment}
        isAdding={isAdding}
      />"""

c = c.replace(old_add_dialog_open, new_add_dialog_open)

with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("AdminDashboard.tsx part 1 updated")
