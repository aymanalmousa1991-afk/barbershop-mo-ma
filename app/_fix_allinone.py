f = "src/sections/AdminDashboard.tsx"
with open(f, "r", encoding="utf8") as fh:
    c = fh.read()

# 1. Imports
c = c.replace(
    "import { PasswordChangeDialog } from './PasswordChangeDialog';",
    "import { AdminPhotoManagement } from './AdminPhotoManagement';\nimport { AdminReports } from './AdminReports';\nimport { PasswordChangeDialog } from './PasswordChangeDialog';"
)

# 2. timeSlots 15-min
c = c.replace(
    "const timeSlots = [\n  '08:00','08:30','09:00','09:30','10:00','10:30',\n  '11:00','11:30','12:00','12:30','13:00','13:30',\n  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'\n];",
    "const timeSlots = [\n  '08:00','08:15','08:30','08:45',\n  '09:00','09:15','09:30','09:45',\n  '10:00','10:15','10:30','10:45',\n  '11:00','11:15','11:30','11:45',\n  '12:00','12:15','12:30','12:45',\n  '13:00','13:15','13:30','13:45',\n  '14:00','14:15','14:30','14:45',\n  '15:00','15:15','15:30','15:45',\n  '16:00','16:15','16:30','16:45',\n  '17:00','17:15','17:30','17:45'\n];"
)

# 3. serviceDurations
c = c.replace(
    "const barbersAgenda = [",
    "const serviceDurations: Record<string, number> = {\n  'knippen-stylen': 30, 'knippen-baard': 45, 'senioren': 30,\n  'tondeuse': 20, 'baard': 15, 'baard-nek': 25, 'jong-tm11': 25, 'jong-12-13': 30,\n  'wassen': 10,\n};\n\nconst barbersAgenda = ["
)

# 4. TabsList (alleen foto beheer + rapportage toevoegen)
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

# 5. TabsContent (foto beheer + rapportage)
old_content = """          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""
new_content = """          <TabsContent value="photos">
            <AdminPhotoManagement />
          </TabsContent>
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""
c = c.replace(old_content, new_content)

# 6. Agenda duration-aware
# Zoek het space-y-0.5 blok met timeSlots.map en vervang het
start_marker = '<div className="space-y-0.5">'
idx_start = c.find(start_marker)
end_marker = "                        </CardContent>"
idx_end = c.find(end_marker, idx_start)

if idx_start >= 0 and idx_end >= 0:
    old_block = c[idx_start:idx_end]
    new_block = """                          <div className="space-y-0.5">
                            {(() => {
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
    c = c[:idx_start] + new_block + c[idx_end:]
    print("6. Agenda layout: OK")

with open(f, "w", encoding="utf8") as fh:
    fh.write(c)
print("ALL DONE!")
