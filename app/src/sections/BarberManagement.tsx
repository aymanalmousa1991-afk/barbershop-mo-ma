import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, AlertTriangle, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Barber {
  id: number;
  name: string;
  display_name: string;
  is_active: number;
  created_at?: string;
}

export function BarberManagement() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBarber, setEditBarber] = useState<Barber | null>(null);
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchBarbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/barbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBarbers(data.data);
      } else {
        setError(data.error || 'Ophalen mislukt');
      }
    } catch {
      setError('Server fout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBarbers(); }, []);

  const openAdd = () => {
    setEditBarber(null);
    setFormName('');
    setFormDisplayName('');
    setDialogOpen(true);
  };

  const openEdit = (barber: Barber) => {
    setEditBarber(barber);
    setFormName(barber.name);
    setFormDisplayName(barber.display_name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formDisplayName) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const method = editBarber ? 'PUT' : 'POST';
      const url = editBarber
        ? `${API_URL}/admin/barbers/${encodeURIComponent(editBarber.name)}`
        : `${API_URL}/admin/barbers`;

      const body: any = { display_name: formDisplayName };
      if (!editBarber) body.name = formName;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        await fetchBarbers();
      } else {
        setError(data.error || 'Opslaan mislukt');
      }
    } catch {
      setError('Server fout');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (barber: Barber) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/barbers/${encodeURIComponent(barber.name)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: barber.display_name, is_active: !barber.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchBarbers();
      }
    } catch {
      // ignore
    }
  };

  const confirmDelete = (barber: Barber) => {
    setDeleteTarget(barber);
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/barbers/${encodeURIComponent(deleteTarget.name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        await fetchBarbers();
      } else {
        setDeleteError(data.error || 'Verwijderen mislukt');
      }
    } catch {
      setDeleteError('Server fout');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#6b0f1a]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Kappers Beheren</h3>
          <p className="text-sm text-stone-500">Voeg kappers toe, pas namen aan of schakel ze uit</p>
        </div>
        <Button onClick={openAdd} className="bg-[#6b0f1a] gap-2">
          <Plus className="h-4 w-4" />Nieuwe Kapper
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-4">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      <div className="space-y-3">
        {barbers.map((barber) => (
          <Card key={barber.id} className={`border-0 shadow ${!barber.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${barber.is_active ? 'bg-[#6b0f1a] text-white' : 'bg-stone-200 text-stone-500'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">{barber.display_name}</p>
                    <p className="text-sm text-stone-500">Key: <code className="bg-stone-100 px-1 rounded">{barber.name}</code></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(barber)} className="gap-1">
                    {barber.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-stone-400" />}
                    {barber.is_active ? 'Actief' : 'Inactief'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(barber)} className="gap-1">
                    <Edit3 className="h-4 w-4" />Bewerk
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => confirmDelete(barber)} className="gap-1">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {barbers.length === 0 && !loading && (
          <div className="text-center py-12 text-stone-500">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen kappers</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editBarber ? 'Kapper Bewerken' : 'Nieuwe Kapper'}</DialogTitle>
            <DialogDescription>
              {editBarber ? 'Pas de weergavenaam aan' : 'Voeg een nieuwe kapper toe'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editBarber && (
              <div>
                <Label>Key (technische naam) *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="bijv. vierde" />
                <p className="text-xs text-stone-400 mt-1">Wordt gebruikt in de URL en API. Bijv. "vierde", "ahmed"</p>
              </div>
            )}
            <div>
              <Label>Weergavenaam *</Label>
              <Input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="Bijv. Vierde kapper" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuleren</Button>
            <Button onClick={handleSave} disabled={!formName || !formDisplayName || saving} className="bg-[#6b0f1a]">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : editBarber ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Kapper Verwijderen</DialogTitle>
            <DialogDescription className="text-center">
              Weet je zeker dat je <strong>{deleteTarget?.display_name}</strong> ({deleteTarget?.name}) wilt verwijderen?
              <br /><br />
              <span className="text-red-600">Alleen mogelijk als er geen actieve afspraken meer zijn.</span>
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mx-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }} disabled={deleting}>Annuleren</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verwijderen...</> : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
