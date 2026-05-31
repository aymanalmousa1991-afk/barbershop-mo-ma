with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

# 1. Add new tabs: Foto beheer, Rapportage
old_tabs_list = """          <TabsList className=\"bg-stone-100\">
            <TabsTrigger value=\"dashboard\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value=\"settings\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              <Settings className=\"h-4 w-4 mr-1\" />Instellingen
            </TabsTrigger>
          </TabsList>"""

new_tabs_list = """          <TabsList className=\"bg-stone-100 flex-wrap\">
            <TabsTrigger value=\"dashboard\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value=\"photos\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              Foto beheer
            </TabsTrigger>
            <TabsTrigger value=\"reports\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              Rapportage
            </TabsTrigger>
            <TabsTrigger value=\"settings\" className=\"data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white\">
              <Settings className=\"h-4 w-4 mr-1\" />Instellingen
            </TabsTrigger>
          </TabsList>"""

c = c.replace(old_tabs_list, new_tabs_list)

# 2. Add PhotoManagement and Reports tabs content before the closing </Tabs>
old_closing_tabs = """          <TabsContent value=\"settings\">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""

new_closing_tabs = """          <TabsContent value=\"photos\">
            <AdminPhotoManagement />
          </TabsContent>
          <TabsContent value=\"reports\">
            <AdminReports />
          </TabsContent>
          <TabsContent value=\"settings\">
            <AdminSettings />
          </TabsContent>
        </Tabs>"""

c = c.replace(old_closing_tabs, new_closing_tabs)

# 3. Update AddAppointmentDialog to accept date prop
old_dialog_props = """function AddAppointmentDialog({
  open, onOpenChange, barber, setBarber, time, setTime,
  formData, setFormData, onSave, isAdding
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  barber: string; setBarber: (v: string) => void;
  time: string; setTime: (v: string) => void;
  formData: { name: string; email: string; phone: string; service: string; notes: string };
  setFormData: (v: any) => void;
  onSave: () => void; isAdding: boolean;
}) {"""

new_dialog_props = """function AddAppointmentDialog({
  open, onOpenChange, barber, setBarber, date, setDate, time, setTime,
  formData, setFormData, onSave, isAdding
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  barber: string; setBarber: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  formData: { name: string; email: string; phone: string; service: string; notes: string };
  setFormData: (v: any) => void;
  onSave: () => void; isAdding: boolean;
}) {"""

c = c.replace(old_dialog_props, new_dialog_props)

# 4. Add Date field in AddAppointmentDialog
old_date_insert = """          <div className=\"grid grid-cols-2 gap-4\">
            <div>
        <Label>Kapper</Label>
        <select className=\"w-full mt-1 p-2 border rounded\" value={barber} onChange={(e) => setBarber(e.target.value)}>
          <option value=\"\">Kies kapper...</option>
          <option value=\"mo\">Mo</option>
          <option value=\"ma\">Ma</option>
          <option value=\"third\">Derde kapper</option>
        </select>
            </div>
            <div>
        <Label>Tijd</Label>
        <select className=\"w-full mt-1 p-2 border rounded\" value={time} onChange={(e) => setTime(e.target.value)}>
          <option value=\"\">Kies tijd...</option>
          {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
            </div>
          </div>"""

new_date_insert = """          <div className=\"grid grid-cols-3 gap-3\">
            <div>
        <Label>Kapper</Label>
        <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={barber} onChange={(e) => setBarber(e.target.value)}>
          <option value=\"\">Kies kapper...</option>
          {barbersAgenda.map((b: any) => <option key={b.key} value={b.key}>{b.name}</option>)}
        </select>
            </div>
            <div>
        <Label>Datum</Label>
        <Input type=\"date\" className=\"mt-1\" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
        <Label>Tijd</Label>
        <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={time} onChange={(e) => setTime(e.target.value)}>
          <option value=\"\">Kies tijd...</option>
          {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
            </div>
          </div>"""

c = c.replace(old_date_insert, new_date_insert)

# 5. Add dynamic barbers in move dialog
old_move_select = """                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>
                  <option value=\"\">Kies...</option>
                  <option value=\"mo\">Mo</option>
                  <option value=\"ma\">Ma</option>
                  <option value=\"third\">Derde kapper</option>
                </select>"""

new_move_select = """                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>
                  <option value=\"\">Kies...</option>
                  {barbersAgenda.map((b: any) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>"""

c = c.replace(old_move_select, new_move_select)

# 6. Update AppointmentListItem to show cancelled status
old_status_html = """          <span className={`text-xs px-2 py-0.5 rounded-full ${
            statusLabel === 'Vandaag' ? 'bg-[#6b0f1a] text-white' 
            : statusLabel === 'Aankomend' ? 'bg-[#d4af37] text-[#1a1a1a]' : 'bg-stone-200 text-stone-600'
          }`}>{statusLabel}</span>"""

new_status_html = """          <span className={`text-xs px-2 py-0.5 rounded-full ${
            statusLabel === 'Vandaag' ? 'bg-[#6b0f1a] text-white' 
            : statusLabel === 'Aankomend' ? 'bg-[#d4af37] text-[#1a1a1a]' : 'bg-stone-200 text-stone-600'
          }`}>{statusLabel}</span>
          {appointment.status === 'cancelled' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300">Geannuleerd</span>
          )}"""

c = c.replace(old_status_html, new_status_html)

# 7. Add cancelled filter in query (include cancelled in appointments list)
# In de fetchData, de appointments filteren om ook cancelled te tonen
# We moeten de query aanpassen om ook cancelled appointments te tonen
c = c.replace(
    "fetch(`${API_URL}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } })",
    "fetch(`${API_URL}/admin/appointments/all`, { headers: { 'Authorization': `Bearer ${token}` } })"
)

with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("AdminDashboard.tsx part 2 updated")

