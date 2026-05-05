import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Photo { id: number; filename: string; caption: string; uploaded_at: string; }

export function AdminPhotoManagement() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try { const res = await fetch(API_URL + "/photos"); const data = await res.json(); if (data.success) setPhotos(data.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("caption", caption);
      const res = await fetch(API_URL + "/admin/photos", { method: "POST", headers: { Authorization: "Bearer " + token }, body: formData });
      const data = await res.json();
      if (data.success) { await fetchPhotos(); setSelectedFile(null); setCaption(""); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Weet je zeker dat je deze foto wilt verwijderen?")) return;
    try { await fetch(API_URL + "/admin/photos/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } }); await fetchPhotos(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-500" /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font mb-8">Foto Beheer</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]"><CardTitle className="text-white flex items-center gap-2"><Upload className="h-5 w-5 text-[#d4af37]" />Foto Uploaden</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div><Label>Bestand kiezen</Label><Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} /></div>
            <div><Label>Bijschrift (optioneel)</Label><Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Bijv. Nieuw kapsel trend" /></div>
            {selectedFile && <div className="flex items-center gap-2 text-sm text-stone-600"><span>Geselecteerd: {selectedFile.name}</span><button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button></div>}
            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full bg-[#6b0f1a]">{uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig met uploaden...</> : "Uploaden"}</Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]"><CardTitle className="text-white flex items-center gap-2">Huidige Foto's ({photos.length})</CardTitle></CardHeader>
          <CardContent className="p-6">
            {photos.length === 0 ? (
              <div className="text-center py-12 text-stone-500"><div className="text-4xl mb-4">??</div><p>Nog geen foto's geupload</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden shadow">
                    <img src={API_URL + "/uploads/photos/" + photo.filename} alt={photo.caption || "Foto"} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(photo.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    {photo.caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2"><p className="text-white text-xs truncate">{photo.caption}</p></div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
