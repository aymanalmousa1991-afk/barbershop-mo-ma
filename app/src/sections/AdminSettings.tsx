import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X, Save, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { BarberManagement } from './BarberManagement';

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
      // Check of deze service al bestaat in de opgehaalde lijst
      const isExisting = services.some(s => s.key === service.key);
      if (isExisting) {
        const res = await fetch(`${API_URL}/admin/services/${service.key}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(service),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Update mislukt');
        }
      } else {
        const res = await fetch(`${API_URL}/admin/services`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(service),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Aanmaken mislukt');
        }
      }
      await loadData();
      setShowServiceDialog(false);
      setEditingService(null);
      toast.success('Dienst opgeslagen!');
    } catch (err) {
      console.error(err);
      toast.error('Fout bij opslaan: ' + (err instanceof Error ? err.message : 'Onbekende fout'));
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

      <Tabs defaultValue="home">
        <TabsList className="bg-stone-100 mb-6">
          <TabsTrigger value="home" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Home Teksten
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Diensten
          </TabsTrigger>
          <TabsTrigger value="absences" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Afwezigheid
          </TabsTrigger>
          <TabsTrigger value="barbers" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Kappers
          </TabsTrigger>
        </TabsList>

        {/* HOME CONTENT TAB */}
        <TabsContent value="home">
          <HomeContentEditor />
        </TabsContent>

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
                        <td className="py-3 pr-4">{s.is_active ? 'Actief' : 'Inactief'}</td>
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

        {/* BARBERS TAB */}
        <TabsContent value="barbers">
          <BarberManagement />
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
                <Input value={editingService.key || ''} disabled={services.some(s => s.key === editingService.key) && editingService.key !== ''}
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
{/* HomeContentEditor component */}
function HomeContentEditor() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_URL}/home-content`);
      const data = await res.json();
      if (data.success) setContent(data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    const saveSection = async (section: string) => {
    setSaving(section);
    try {
      const res = await fetch(`${API_URL}/admin/home-content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content: content[section] || '' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Opgeslagen!');
      } else {
        toast.error('Fout bij opslaan');
      }
      await fetchContent();
    } catch (err) {
      console.error(err);
      toast.error('Fout bij opslaan');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-500" /></div>;
  }

    const sections = [
    { key: 'hero_title', label: 'Hero Titel', type: 'text', default: 'Jouw Stijl, Ons Vakmanschap' },
    { key: 'hero_subtitle', label: 'Hero Ondertitel', type: 'textarea', default: 'Welkom bij Barbershop Mo&Ma. Ontdek de beste barbershop in Volendam voor herenkapsels, baarden, bartrimmen en meer.' },
    { key: 'opening_hours_title', label: 'Openingstijden Titel', type: 'text', default: 'Openingstijden' },
    { key: 'opening_ma', label: 'Openingstijden Maandag', type: 'text', default: '10:00 - 18:00' },
    { key: 'opening_di_vr', label: 'Openingstijden Di-Vrij', type: 'text', default: '09:00 - 18:00' },
    { key: 'opening_za', label: 'Openingstijden Zaterdag', type: 'text', default: '08:00 - 17:00' },
    { key: 'opening_zo', label: 'Openingstijden Zondag', type: 'text', default: 'Gesloten' },
    { key: 'opening_afspraak', label: 'Op afspraak tekst', type: 'text', default: 'Ma, Di, Vr, Za: uitsluitend op afspraak' },
    { key: 'opening_inloop', label: 'Inloop tekst', type: 'text', default: 'Wo, Do: Inloop' },
    { key: 'welcome_text', label: 'Welkomsttekst Home', type: 'textarea', default: 'Welkom bij Barbershop Mo&Ma, dé mannenkapper van Edam-Volendam.' },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
        <CardTitle className="text-white flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Home Pagina Teksten
        </CardTitle>
        <p className="text-white/60 text-xs mt-1">
          Pas de teksten op de home pagina aan. Wijzigingen worden direct opgeslagen.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="border-b border-stone-100 pb-4">
              <Label className="font-semibold text-[#1a1a1a]">{section.label}</Label>
              {section.default && section.default !== (content[section.key] || "") && (
                <span className="ml-2 text-xs text-stone-400">(origineel: <em>{section.default}</em>)</span>
              )}
              {section.type === 'textarea' ? (
                <textarea
                  className="w-full mt-2 p-3 border rounded-lg text-sm min-h-[100px]"
                  value={content[section.key] || ''}
                  onChange={(e) => setContent({ ...content, [section.key]: e.target.value })}
                />
              ) : (
                <Input
                  className="mt-2"
                  value={content[section.key] || ''}
                  onChange={(e) => setContent({ ...content, [section.key]: e.target.value })}
                />
              )}
              <Button
                size="sm"
                onClick={() => saveSection(section.key)}
                disabled={saving === section.key}
                className="mt-2 bg-[#6b0f1a]"
              >
                {saving === section.key ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />...</> : 'Opslaan'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

