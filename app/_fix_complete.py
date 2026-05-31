import sys
f = "src/sections/AdminDashboard.tsx"

with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# ============================================
# 1. IMPORTS: Voeg AdminPhotoManagement en AdminReports toe
# ============================================
old_import = "import { PasswordChangeDialog } from './PasswordChangeDialog';"
new_import = "import { AdminPhotoManagement } from './AdminPhotoManagement';\nimport { AdminReports } from './AdminReports';\nimport { PasswordChangeDialog } from './PasswordChangeDialog';"
c = c.replace(old_import, new_import)
print("1. Imports toegevoegd")

# ============================================
# 2. timeSlots: 15-min intervallen
# ============================================
old_slots = """const timeSlots = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
];"""

new_slots = """const timeSlots = [
  '08:00','08:15','08:30','08:45',
  '09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45',
  '11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45',
  '13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45',
  '15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45',
  '17:00','17:15','17:30','17:45'
];"""

c = c.replace(old_slots, new_slots)
print("2. timeSlots 15-min")

# ============================================
# 3. serviceDurations toevoegen
# ============================================
old_bf = "const barbersAgenda = ["
new_sd = """const serviceDurations: Record<string, number> = {
  'knippen-stylen': 30, 'knippen-baard': 45, 'senioren': 30,
  'tondeuse': 20, 'baard': 15, 'baard-nek': 25, 'jong-tm11': 25, 'jong-12-13': 30,
  'wassen': 10,
};

const barbersAgenda = ["""

c = c.replace(old_bf, new_sd)
print("3. serviceDurations toegevoegd")

# ============================================
# 4. Hardcoded barbersAgenda -> useState (dynamisch)
# ============================================
old_hardcoded = """const barbersAgenda = [
  { key: 'mo', name: 'Mo', color: barberColors.mo },
  { key: 'ma', name: 'Ma', color: barberColors.ma },
  { key: 'third', name: 'Derde kapper', color: barberColors.third },
];"""

new_state = """// Dynamische barbers uit API
const [barbersAgenda, setBarbersAgenda] = useState<{key:string;name:string;color:{bg:string;text:string;border:string;light:string}}[]>([]);
const [barberFilter, setBarberFilter] = useState<string>("");"""

c = c.replace(old_hardcoded, new_state)
print("4. barbersAgenda dynamisch gemaakt + barberFilter")

# ============================================
# 5. fetchBarbers toevoegen voor fetchData
# ============================================
old_fetch_start = """  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);"""

new_fetch = """  const fetchBarbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/barbers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        const mapped = data.data.filter((b: any) => b.is_active).map((b: any) => ({
          key: b.name,
          name: b.display_name,
          color: barberColors[b.name] || defaultBarberColor,
        }));
        // Fallback: als er geen barbers uit API komen, gebruik hardcoded
        if (mapped.length === 0) {
          setBarbersAgenda([
            { key: 'mo', name: 'Mo', color: barberColors.mo },
            { key: 'ma', name: 'Ma', color: barberColors.ma },
            { key: 'third', name: 'Derde kapper', color: barberColors.third },
          ]);
        } else {
          setBarbersAgenda(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching barbers:', err);
      // Fallback
      setBarbersAgenda([
        { key: 'mo', name: 'Mo', color: barberColors.mo },
        { key: 'ma', name: 'Ma', color: barberColors.ma },
        { key: 'third', name: 'Derde kapper', color: barberColors.third },
      ]);
    }
  };

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); fetchBarbers(); }, []);"""

c = c.replace(old_fetch_start, new_fetch)
print("5. fetchBarbers toegevoegd")

# ============================================
# 6. TabsList: Voeg Foto beheer en Rapportage tabs toe
# ============================================
old_tabs = """          <TabsList className="bg-stone-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-1" />Instellingen
            </TabsTrigger>
          </TabsList>"""

new_tabs = """          <TabsList className="bg-stone-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              Foto beheer
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              Rapportage
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-1" />Instellingen
            </TabsTrigger>
          </TabsList>"""

c = c.replace(old_tabs, new_tabs)
print("6. Tabs toegevoegd")

# ============================================
# 7. TabsContent: Foto beheer en Rapportage inhoud
# ============================================
old_tabs_content = """          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""

new_tabs_content = """          <TabsContent value="photos">
            <AdminPhotoManagement />
          </TabsContent>
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""

c = c.replace(old_tabs_content, new_tabs_content)
print("7. TabsContent toegevoegd")

# ============================================
# 8. Agenda header: barberFilter toevoegen
# ============================================
old_header = """                <div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                    <Plus className="h-4 w-4" />Nieuwe Afspraak
                  </Button>
                  <Button variant="ghost" onClick={handlePrevDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    <ChevronLeft className="h-5 w-5 mr-1" />Vorige dag
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[#1a1a1a]">
                      {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                    </span>
                    {!isTodaySelected && (
                      <Button size="sm" onClick={handleToday} className="bg-[#d4af37] text-[#1a1a1a] hover:bg-[#b8941f]">
                        Vandaag
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" onClick={handleNextDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    Volgende dag<ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>"""

new_header = """                <div className="flex items-center justify-between gap-2 mb-4 bg-white rounded-lg shadow-lg p-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                      <Plus className="h-4 w-4" />Nieuwe Afspraak
                    </Button>
                    <select className="p-2 border rounded text-sm" value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)}>
                      <option value="">Alle kappers</option>
                      {barbersAgenda.map((b: any) => <option key={b.key} value={b.key}>{b.name}</option>)}
                    </select>
                  </div>
                  <Button variant="ghost" onClick={handlePrevDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    <ChevronLeft className="h-5 w-5 mr-1" />Vorige dag
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[#1a1a1a]">
                      {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                    </span>
                    {!isTodaySelected && (
                      <Button size="sm" onClick={handleToday} className="bg-[#d4af37] text-[#1a1a1a] hover:bg-[#b8941f]">
                        Vandaag
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" onClick={handleNextDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    Volgende dag<ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>"""

c = c.replace(old_header, new_header)
print("8. Barber filter toegevoegd aan header")

# ============================================
# 9. Grid filter by barberFilter
# ============================================
old_grid = """                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {barbersAgenda.map(({ key, name, color }) => {"""

new_grid = """                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {barbersAgenda
                    .filter((b: any) => !barberFilter || b.key === barberFilter)
                    .map(({ key, name, color }: any) => {"""

c = c.replace(old_grid, new_grid)
print("9. Grid filter toegevoegd")

# ============================================
# 10. VERVANG de agenda tijdsslots (timeSlots.map) met duration-aware versie
# ============================================
# Zoek de start en end
start_marker = '<div className="space-y-0.5">'
idx_start = c.find(start_marker)
# Zoek de sluiting: "})}\n                          </div>\n                        </CardContent>"
end_marker1 = "})}\n                          </div>\n                        </CardContent>"
idx_end = c.find(end_marker1, idx_start)

if idx_start >= 0 and idx_end >= 0:
    # Vind de complete div: van start_marker tot </div> + newline
    block_end = idx_end + len(end_marker1) - len("                        </CardContent>")
    old_block = c[idx_start:block_end]
    
    new_block = """                          <div className="space-y-0.5">
                            {(() => {
                              // Mark occupied slots by appointment duration
                              const occupiedBy: Record<string, Appointment> = {};
                              barberAppointments.forEach(apt => {
                                const dur = serviceDurations[apt.service] || 30;
                                const [sh, sm] = apt.time.split(":").map(Number);
                                const startMin = sh * 60 + sm;
                                const endMin = startMin + dur;
                                timeSlots.forEach(slot => {
                                  const [h, m] = slot.split(":").map(Number);
                                  const slotMin = h * 60 + m;
                                  if (slotMin >= startMin && slotMin < endMin) {
                                    occupiedBy[slot] = apt;
                                  }
                                });
                              });
                              return timeSlots.filter(slot => {
                                if (barberAppointments.find(a => a.time === slot)) return true;
                                if (!occupiedBy[slot]) return true;
                                return false;
                              }).map((time) => {
                                const apt = barberAppointments.find(a => a.time === time);
                                const isContinuation = !apt && occupiedBy[time];
                                return (
                                  <div key={time} className={`flex items-stretch min-h-[44px] rounded-lg transition-colors ${apt ? `${color.light} border ${color.border}` : isContinuation ? `border-l-4 ${color.border} bg-stone-50` : ""}`}>
                                    <div className={`w-14 flex-shrink-0 flex items-start pt-2 px-2 text-xs font-medium ${apt ? "text-stone-500" : isContinuation ? "text-stone-300" : "text-stone-200"}`}>{isContinuation ? "" : time}</div>
                                    <div className="flex-1 min-w-0 py-1.5 pr-2">
                                      {apt ? (
                                        <div className="group relative">
                                          <p className={`text-sm font-semibold ${color.text} truncate`}>{apt.name}</p>
                                          <p className="text-xs text-stone-500 truncate">{serviceNames[apt.service] || apt.service} - {serviceDurations[apt.service] || 30} min</p>
                                          {apt.notes && <p className="text-xs text-stone-400 truncate">{apt.notes}</p>}
                                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                                            <button onClick={() => { setAppointmentToMove(apt); setMoveDate(apt.date); setMoveTime(apt.time); setMoveDialogOpen(true); }} 
                                              className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 bg-white rounded-full p-1 shadow-sm" title="Verplaatsen">
                                              <ArrowRight className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => { setAppointmentToDelete(apt); setDeleteDialogOpen(true); }} 
                                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm" title="Verwijderen">
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} 
                                          className="w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors">
                                          <span className="text-xs text-stone-100 group-hover:text-stone-400 italic">+</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>"""
    
    c = c[:idx_start] + new_block + c[block_end:]
    print("10. Agenda layout duration-aware gemaakt")
else:
    print(f"10. ERROR: markers not found! idx_start={idx_start}, idx_end={idx_end}")
    if idx_start >= 0:
        print(f"     Context: {repr(c[idx_start:idx_start+200])}")

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("ALL DONE!")
