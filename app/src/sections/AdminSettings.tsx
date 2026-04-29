import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X, Save, Trash2, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Service {
  key: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  is_active: number;
}

interface BarberAbsence {
  id?: number;
  barber_name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  is_full_day: number;
}

const barberOptions = ['mo', 'ma', 'third'];
const barberLabels: Record<string, string> = { mo: 'Mo', ma: 'Ma', third: 'Derde kapper' };

export function AdminSettings() {
  const [services, setServices] = useState<Service[]>([]);
  const [absences, setAbsences] = useState<BarberAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAbsence, setNewAbsence] = useState<BarberAbsence>({
    barber_name: 'mo',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
    is_full_day: 0,
  });

  const token = localStorage.getItem('token');

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcRes, absRes] = await Promise.all([
        fetch(`${API_URL}/admin/services`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/absences`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const svc = await svcRes.json();
      const abs = await absRes.json();
      if (svc.success) setServices(svc.data);
      if (abs.success) setAbsences(abs.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // === SERVICES ===

  const saveService = async (service: Service) => {
    setIsSaving(true);
    try {
      if (service.key && service.key !== '_new') {
        await fetch(`${API_URL}/admin/services/${service.key}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(service),
        });
      } else {
        await fetch(`${API_URL}/admin/services`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...service, key: service.key === '_new' ? '' : service.key }),
        });
      }
      await loadData();
      setShowServiceDialog(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteService = async (key: string) => {
    if (!confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) return;
    await fetch(`${API_URL}/admin/services/${key}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadData();
  };

  // === ABSENCES ===

  const saveAbsence = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/admin/absences`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newAbsence),
      });
      await loadData();
      setNewAbsence({
        barber_name: 'mo',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        reason: '',
        is_full_day: 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAbsence = async (id: number) => {
    if (!confirm('Weet je zeker dat je deze afwezigheid wilt verwijderen?')) return;
    await fetch(`${API_URL}/admin/absences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font mb-8">Instellingen</h1>

      <Tabs defaultValue="services">
        <TabsList className="bg-stone-100 mb-6">
          <TabsTrigger value="services" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Diensten
          </TabsTrigger>
          <TabsTrigger value="absences" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Afwezigheid
          </TabsTrigger>
        </TabsList>

        {/* SERVICES TAB */}
        <TabsContent value="services">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Diensten
              </CardTitle>
              <Button size="sm" onClick={() => { setEditingService({ key: '', name: '', duration: 30, price: 0, description: '', is_active: 1 }); setShowServiceDialog(true); }}
                className="bg-[#d4af37] text-[#1a1a1a] hover:bg-[#b8941f]">
                <Plus className="h-4 w-4 mr-1" />Nieuwe dienst
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-stone-500">
                      <th className="pb-3 pr-4">Key</th>
                      <th className="pb-3 pr-4">Naam</th>
                      <th className="pb-3 pr-4">Duur (min)</th>
                      <th className="pb-3 pr-4">Prijs (&euro;)</th>
                      <th className="pb-3 pr-4">Actief</th>
                      <th className="pb-3 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.key} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="py-3 pr-4 font-mono text-xs">{s.key}</td>
                        <td className="py-3 pr-4 font-medium">{s.name}</td>
                        <td className="py-3 pr-4">{s.duration}</td>
                        <td className="py-3 pr-4">&euro; {s.price}</td>
                        <td className="py-3 pr-4">{s.is_active ? '✅' : '❌'}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingService(s); setShowServiceDialog(true); }}>
                              <Save className="h-3.5 w-3.5 mr-1" />Bewerk
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteService(s.key)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {services.length === 0 && (
                <div className="text-center py-8 text-stone-500">Nog geen diensten toegevoegd.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABSENCES TAB */}
        <TabsContent value="absences">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nieuwe afwezigheid */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
                <CardTitle className="text-white">Nieuwe Afwezigheid</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>Kapper</Label>
                  <select className="w-full mt-1 p-2 border rounded" value={newAbsence.barber_name}
                    onChange={(e) => setNewAbsence({ ...newAbsence, barber_name: e.target.value })}>
                    {barberOptions.map(b => <option key={b} value={b}>{barberLabels[b]}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input type="date" value={newAbsence.date}
                    onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fullDay" checked={newAbsence.is_full_day === 1}
                    onChange={(e) => setNewAbsence({ ...newAbsence, is_full_day: e.target.checked ? 1 : 0 })} />
                  <Label htmlFor="fullDay">Hele dag afwezig</Label>
                </div>
                {newAbsence.is_full_day !== 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Van</Label>
                      <Input type="time" value={newAbsence.start_time || '09:00'}
                        onChange={(e) => setNewAbsence({ ...newAbsence, start_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tot</Label>
                      <Input type="time" value={newAbsence.end_time || '17:00'}
                        onChange={(e) => setNewAbsence({ ...newAbsence, end_time: e.target.value })} />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Reden (optioneel)</Label>
                  <Input value={newAbsence.reason}
                    onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })} placeholder="vakantie, ziek, etc." />
                </div>
                <Button onClick={saveAbsence} disabled={isSaving} className="w-full bg-[#6b0f1a]">
                  {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opslaan...</> : 'Toevoegen'}
                </Button>
              </CardContent>
            </Card>

            {/* Overzicht afwezigheden */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
                <CardTitle className="text-white">Geplande Afwezigheid</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {absences.length === 0 && (
                  <div className="text-center py-8 text-stone-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Geen afwezigheden gepland
                  </div>
                )}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {absences.sort((a, b) => a.date.localeCompare(b.date)).map((abs) => (
                    <div key={abs.id} className="flex items-center justify-between bg-stone-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">
                          {barberLabels[abs.barber_name] || abs.barber_name}
                          <span className="text-stone-400 ml-2">{abs.date}</span>
                        </p>
                        <p className="text-xs text-stone-500">
                          {abs.is_full_day ? 'Hele dag' : `${abs.start_time} - ${abs.end_time}`}
                          {abs.reason && <span className="italic ml-1">({abs.reason})</span>}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteAbsence(abs.id!)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService?.key ? 'Dienst Bewerken' : 'Nieuwe Dienst'}</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Key (unieke code)</Label>
                <Input value={editingService.key || ''} disabled={!!editingService.key && editingService.key !== '_new'}
                  onChange={(e) => setEditingService({ ...editingService, key: e.target.value })} placeholder="bijv. knippen-stylen" />
              </div>
              <div>
                <Label>Naam</Label>
                <Input value={editingService.name} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} placeholder="Knippen + Stylen" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duur (minuten)</Label>
                  <Input type="number" value={editingService.duration} onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Prijs (&euro;)</Label>
                  <Input type="number" step="0.01" value={editingService.price} onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <Label>Beschrijving</Label>
                <textarea className="w-full mt-1 p-2 border rounded" rows={3} value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={editingService.is_active === 1}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked ? 1 : 0 })} />
                <Label htmlFor="isActive">Actief (zichtbaar in boekingssysteem)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Annuleren</Button>
            <Button onClick={() => editingService && saveService(editingService)} disabled={isSaving} className="bg-[#6b0f1a]">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opslaan...</> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
