import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, CheckCircle, AlertCircle, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
}

// Accountinstellingen van de admin: gebruikersnaam en wachtwoord wijzigen
export function PasswordChangeDialog({ open, onClose }: PasswordChangeDialogProps) {
  const { user, token, login } = useAuth();
  const [mode, setMode] = useState<'username' | 'password'>('username');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (next: 'username' | 'password') => {
    setMode(next);
    setError('');
    setSuccess('');
    setCurrentPassword('');
  };

  const post = async (path: string, body: object) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json().catch(() => ({ success: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) { setError('Huidig wachtwoord is verplicht'); return; }

    if (mode === 'username') {
      const name = newUsername.trim();
      if (name.length < 3 || name.length > 30) { setError('De gebruikersnaam moet 3 tot 30 tekens lang zijn'); return; }
      if (!/^[A-Za-z0-9._@-]+$/.test(name)) { setError('Gebruik alleen letters, cijfers en . _ - @ (geen spaties)'); return; }
    } else {
      if (!newPassword) { setError('Nieuw wachtwoord is verplicht'); return; }
      if (newPassword.length < 8) { setError('Nieuw wachtwoord moet minimaal 8 tekens lang zijn'); return; }
      if (newPassword !== confirmPassword) { setError('Nieuw wachtwoord en bevestiging komen niet overeen'); return; }
    }

    setIsSaving(true);
    try {
      if (mode === 'username') {
        const data = await post('/admin/auth/change-username', { currentPassword, newUsername: newUsername.trim() });
        if (!data.success) { setError(data.error || 'Gebruikersnaam wijzigen mislukt'); return; }
        // Naam ook in de ingelogde sessie bijwerken (welkomsttekst)
        if (token && user) login(token, { ...user, username: data.data.username });
        setSuccess(`Gebruikersnaam gewijzigd naar "${data.data.username}". Log voortaan hiermee in.`);
        setNewUsername('');
      } else {
        const data = await post('/admin/auth/change-password', { currentPassword, newPassword });
        if (!data.success) { setError(data.error || 'Wachtwoord wijzigen mislukt'); return; }
        setSuccess('Wachtwoord succesvol gewijzigd!');
        setNewPassword('');
        setConfirmPassword('');
      }
      setCurrentPassword('');
    } catch {
      setError('Server fout. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabClass = (active: boolean) =>
    'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
    (active ? 'bg-[#6b0f1a] text-white' : 'text-stone-600 hover:bg-stone-200');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-[#6b0f1a]/10 rounded-full flex items-center justify-center mb-4">
            <UserCog className="h-6 w-6 text-[#6b0f1a]" />
          </div>
          <DialogTitle className="text-center">Account</DialogTitle>
          <DialogDescription className="text-center">
            Ingelogd als <strong>{user?.username}</strong>. Wijzig je gebruikersnaam of wachtwoord.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          <button type="button" className={tabClass(mode === 'username')} onClick={() => switchMode('username')}>
            <UserCog className="h-4 w-4" />Gebruikersnaam
          </button>
          <button type="button" className={tabClass(mode === 'password')} onClick={() => switchMode('password')}>
            <KeyRound className="h-4 w-4" />Wachtwoord
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {mode === 'username' ? (
            <div>
              <Label>Nieuwe gebruikersnaam</Label>
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Bijv. mo of info@barbershopmoma.nl" autoComplete="username" />
              <p className="text-xs text-stone-400 mt-1">3 tot 30 tekens: letters, cijfers en . _ - @ (geen spaties)</p>
            </div>
          ) : (
            <>
              <div>
                <Label>Nieuw wachtwoord</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimaal 8 tekens" autoComplete="new-password" />
              </div>
              <div>
                <Label>Bevestig nieuw wachtwoord</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Herhaal nieuw wachtwoord" autoComplete="new-password" />
              </div>
            </>
          )}
          <div>
            <Label>Huidig wachtwoord (ter bevestiging)</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Huidig wachtwoord" autoComplete="current-password" />
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
            <Button variant="outline" type="button" onClick={onClose}>Sluiten</Button>
            <Button type="submit" disabled={isSaving} className="bg-[#6b0f1a]">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : mode === 'username' ? 'Gebruikersnaam wijzigen' : 'Wachtwoord wijzigen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
