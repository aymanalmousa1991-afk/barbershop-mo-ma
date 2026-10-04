import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function WaitlistManagement() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/waitlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEntries(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWaitlist(); }, []);

  const markContacted = async (id: number) => {
    await fetch(`${API_URL}/admin/waitlist/${id}/contacted`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    await loadWaitlist();
    toast.success('Gemarkeerd als gecontacteerd');
  };

  const removeEntry = async (id: number) => {
    if (!confirm('Verwijder deze wachtlijst vermelding?')) return;
    await fetch(`${API_URL}/admin/waitlist/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    await loadWaitlist();
    toast.success('Verwijderd');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-500" /></div>;
  }

  const waitingCount = entries.filter(e => !e.contacted).length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
        <CardTitle className="text-white flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Wachtlijst
          {waitingCount > 0 && (
            <span className="ml-2 bg-amber-400 text-[#1a1a1a] text-xs font-bold px-2 py-0.5 rounded-full">
              {waitingCount} wachtend
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-stone-500">Niemand op de wachtlijst</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-stone-500">
                  <th className="pb-3 pr-3">Naam</th>
                  <th className="pb-3 pr-3">Telefoon</th>
                  <th className="pb-3 pr-3">Kapper</th>
                  <th className="pb-3 pr-3">Datum</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Notities</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-3 pr-3 font-medium">
                      {entry.name}
                      {entry.email && <p className="text-xs text-stone-400">{entry.email}</p>}
                    </td>
                    <td className="py-3 pr-3">{entry.phone}</td>
                    <td className="py-3 pr-3">{entry.preferred_barber || '-'}</td>
                    <td className="py-3 pr-3">{entry.preferred_date || '-'}</td>
                    <td className="py-3 pr-3">
                      {entry.contacted ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Gecontacteerd</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">Wachtend</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs text-stone-500 max-w-[150px] truncate">{entry.notes || '-'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {!entry.contacted && (
                          <Button variant="outline" size="sm" onClick={() => markContacted(entry.id)} className="text-green-600 border-green-600">
                            bel terug
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-red-500">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
