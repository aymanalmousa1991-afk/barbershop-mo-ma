import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Foto van de winkel op de contactpagina: uploaden, vervangen of verwijderen
export function ContactImageEditor() {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem('token');
  const baseUrl = API_URL.replace('/api', '');

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/contact-image`);
      const data = await res.json();
      setPreview(data.success && data.data?.url ? baseUrl + data.data.url : null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/admin/contact-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPreview(baseUrl + data.data.url);
        toast.success('Foto van de winkel bijgewerkt!');
      } else {
        toast.error(data.error || 'Upload mislukt');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload mislukt');
    } finally {
      setBusy(false);
      input.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je de foto van de contactpagina wilt verwijderen?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/admin/contact-image`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPreview(null);
        toast.success('Foto verwijderd');
      } else {
        toast.error(data.error || 'Verwijderen mislukt');
      }
    } catch (err) {
      console.error(err);
      toast.error('Verwijderen mislukt');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
        <CardTitle className="text-white flex items-center gap-2">
          <Store className="h-5 w-5 text-[#d4af37]" />
          Foto winkel (contactpagina)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {preview ? (
            <div className="rounded-lg overflow-hidden border border-stone-200">
              <img src={preview} alt="Huidige foto van de winkel" className="w-full h-48 object-cover" />
            </div>
          ) : (
            <p className="text-sm text-stone-500">Er staat nog geen foto op de contactpagina.</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={busy}
              className="block flex-1 min-w-0 text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6b0f1a] file:text-white hover:file:bg-[#8b1523]"
            />
            {busy && <Loader2 className="h-5 w-5 animate-spin text-[#6b0f1a]" />}
            {preview && !busy && (
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />Verwijderen
              </Button>
            )}
          </div>
          <p className="text-xs text-stone-400">Kies een nieuwe foto om de huidige te vervangen. Liggend formaat werkt het best (bijv. 1600x900px). JPG, PNG of WebP (max 10MB)</p>
        </div>
      </CardContent>
    </Card>
  );
}
