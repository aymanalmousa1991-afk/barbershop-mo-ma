import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PasswordChangeDialog({ open, onClose }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) { setError('Huidig wachtwoord is verplicht'); return; }
    if (!newPassword) { setError('Nieuw wachtwoord is verplicht'); return; }
    if (newPassword.length < 6) { setError('Nieuw wachtwoord moet minimaal 6 tekens lang zijn'); return; }
    if (newPassword !== confirmPassword) { setError('Nieuw wachtwoord en bevestiging komen niet overeen'); return; }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/auth/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Wachtwoord succesvol gewijzigd!');
        setTimeout(() => { onClose(); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }, 2000);
      } else {
        setError(data.error || 'Wachtwoord wijzigen mislukt');
      }
    } catch (err) {
      setError('Server fout. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-[#6b0f1a]/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-[#6b0f1a]" />
          </div>
          <DialogTitle className="text-center">Wachtwoord Wijzigen</DialogTitle>
          <DialogDescription className="text-center">
            Wijzig je wachtwoord voor het admin dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label>Huidig wachtwoord</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Huidig wachtwoord" />
          </div>
          <div>
            <Label>Nieuw wachtwoord</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nieuw wachtwoord" />
          </div>
          <div>
            <Label>Bevestig nieuw wachtwoord</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Bevestig nieuw wachtwoord" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Annuleren</Button>
            <Button type="submit" disabled={isSaving} className="bg-[#6b0f1a]">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : 'Wachtwoord Wijzigen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
