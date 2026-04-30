const fs = require('fs');
let c = fs.readFileSync('src/sections/AdminDashboard.tsx','utf8');

// A. Add AddAppointmentDialog JSX before Password Change Dialog
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

// B. Add AddAppointmentDialog component function before AppointmentListItem
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

// C. Fix the move dialog (the onOpenChange escape had bad quotes)
c = c.replace(
  'onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\"\\u0027\"); setMoveDate(\"\\u0027\"); setMoveTime(\"\\u0027\"); } setMoveDialogOpen(v); }}',
  'onOpenChange={(v) => { if (!v) { setMoveTargetBarber(\"\"); setMoveDate(\"\"); setMoveTime(\"\"); } setMoveDialogOpen(v); }}'
);

// D. Update move dialog content with date/time fields
c = c.replace(
  '<DialogContent>',
  '<DialogContent className=\"sm:max-w-md\">'
);

c = c.replace(
  'Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.',
  'Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong> naar een andere kapper, datum of tijd.',
);

// Replace the move dialog's simple select with grid layout
c = c.replace(
  '<div className=\"py-4\">\n            <Label>Verplaats naar kapper</Label>\n            <select className=\"w-full mt-1 p-2 border rounded\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>\n              <option value=\"\">Selecteer kapper...</option>\n              <option value=\"mo\">Mo</option>\n              <option value=\"ma\">Ma</option>\n              <option value=\"third\">Derde kapper</option>\n            </select>\n          </div>',
  '<div className=\"space-y-4 py-2\">\n            <div>\n              <Label>Huidig: <strong>{getBarberDisplayName(appointmentToMove?.barber_name || \"\")}</strong> \u2014 {appointmentToMove?.date} om {appointmentToMove?.time}</Label>\n            </div>\n            <div className=\"grid grid-cols-3 gap-3\">\n              <div className=\"col-span-1\">\n                <Label>Kapper</Label>\n                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>\n                  <option value=\"\">Kies...</option>\n                  <option value=\"mo\">Mo</option>\n                  <option value=\"ma\">Ma</option>\n                  <option value=\"third\">Derde kapper</option>\n                </select>\n              </div>\n              <div>\n                <Label>Datum</Label>\n                <Input type=\"date\" className=\"mt-1\" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />\n              </div>\n              <div>\n                <Label>Tijd</Label>\n                <select className=\"w-full mt-1 p-2 border rounded text-sm\" value={moveTime} onChange={(e) => setMoveTime(e.target.value)}>\n                  <option value=\"\">Kies...</option>\n                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}\n                </select>\n              </div>\n            </div>\n          </div>'
);

fs.writeFileSync('src/sections/AdminDashboard.tsx', c, 'utf8');
console.log('DONE');
