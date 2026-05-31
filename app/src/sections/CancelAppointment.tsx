import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function CancelAppointment() {
  // Parse URL params zonder react-router-dom
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateHome = () => { window.location.href = '/'; };

  useEffect(() => {
    if (!token) {
      setError('Geen annuleringslink gevonden.');
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      try {
        const res = await fetch(`${API_URL}/appointments/cancel?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setAppointment(data.data);
        } else {
          setError(data.error || 'Ongeldige annuleringslink.');
        }
      } catch (err) {
        setError('Er is een fout opgetreden.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/appointments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setCancelled(true);
      } else {
        setError(data.error || 'Annuleren mislukt.');
      }
    } catch (err) {
      setError('Er is een fout opgetreden.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#faf9f7]">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />Laden...
        </div>
      </section>
    );
  }

  if (error && !appointment) {
    return (
      <section className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#faf9f7]">
        <Card className="max-w-md mx-auto border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Annuleren mislukt</h2>
            <p className="text-stone-600 mb-6">{error}</p>
            <Button onClick={navigateHome} className="bg-[#6b0f1a]">Naar Home</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (cancelled) {
    return (
      <section className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#faf9f7]">
        <Card className="max-w-md mx-auto border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Afspraak geannuleerd!</h2>
            <p className="text-stone-600 mb-2">Je afspraak is succesvol geannuleerd.</p>
            <p className="text-sm text-stone-500 mb-6">Het tijdstip is weer vrijgemaakt in onze agenda.</p>
            <Button onClick={navigateHome} className="bg-[#6b0f1a]">Naar Home</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#faf9f7]">
      <Card className="max-w-md mx-auto border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-[#d4af37] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Afspraak annuleren?</h2>
          <p className="text-stone-600 mb-6">
            Weet je zeker dat je de volgende afspraak wilt annuleren?
          </p>
          {appointment && (
            <div className="bg-stone-50 rounded-lg p-4 mb-6 text-left space-y-2">
              <p><span className="font-medium">Naam:</span> {appointment.name}</p>
              <p><span className="font-medium">Datum:</span> {appointment.date}</p>
              <p><span className="font-medium">Tijd:</span> {appointment.time}</p>
              <p><span className="font-medium">Behandeling:</span> {appointment.treatment}</p>
              <p><span className="font-medium">Kapper:</span> {appointment.barber}</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={navigateHome}>Terug</Button>
            <Button onClick={handleCancel} disabled={cancelling} className="bg-red-600 hover:bg-red-700 text-white">
              {cancelling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : 'Ja, annuleer afspraak'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
