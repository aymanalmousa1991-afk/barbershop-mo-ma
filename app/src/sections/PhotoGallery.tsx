import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Photo {
  id: number; filename: string; caption: string; uploaded_at: string;
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(API_URL + "/photos");
      const data = await res.json();
      if (data.success) setPhotos(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <section className="w-full py-24 bg-[#faf9f7]"><div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6b0f1a]" /></div></section>;
  }

  return (
    <section className="w-full py-24 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">Galerij</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-6 logo-font">Onze Werken</h2>
          <p className="text-lg text-stone-600">Een greep uit onze kapsels en stijlen. Laat je inspireren!</p>
        </div>
        {photos.length === 0 ? (
          <div className="text-center py-20"><div className="text-6xl mb-4">??</div><h3 className="text-xl font-bold text-stone-500 mb-2">Nog geen foto's</h3><p className="text-stone-400">Er zijn nog geen foto's toegevoegd. Kom later terug!</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <button key={photo.id} onClick={() => setSelectedPhoto(photo)} className="group relative aspect-square overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all">
                <img src={API_URL + "/uploads/photos/" + photo.filename} alt={photo.caption || "Kapsel foto"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                {photo.caption && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-white text-sm">{photo.caption}</p></div>}
              </button>
            ))}
          </div>
        )}
      </div>
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-0 shadow-none">
          <button onClick={() => setSelectedPhoto(null)} className="absolute -top-10 right-0 text-white hover:text-stone-300 z-10"><X className="h-6 w-6" /></button>
          {selectedPhoto && <div className="relative"><img src={API_URL + "/uploads/photos/" + selectedPhoto.filename} alt={selectedPhoto.caption || "Kapsel foto"} className="w-full max-h-[80vh] object-contain rounded-xl" /></div>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
