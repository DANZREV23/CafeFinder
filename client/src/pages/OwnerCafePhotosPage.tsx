import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Star, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';

export default function OwnerCafePhotosPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    ownerService
      .getOwnedCafe(id)
      .then((res) => {
        setName(res.data?.name || '');
        setPhotos(res.data?.photos || []);
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return;
    setUploading(true);
    setMessage('');
    try {
      await ownerCafeService.uploadPhoto(id, e.target.files[0]);
      setMessage('Photo uploaded successfully.');
      load();
    } catch (err: any) {
      setMessage(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!id) return;
    try {
      await ownerCafeService.deletePhoto(id, photoId);
      setMessage('Photo deleted.');
      load();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleSetCover = async (photoId: string) => {
    if (!id) return;
    try {
      await ownerCafeService.setCover(id, photoId);
      setMessage('Cover photo updated.');
      load();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link to={`/owner/cafes/${id}`} className="inline-flex items-center gap-2 text-sm text-brand-muted">
          <ArrowLeft className="h-4 w-4" />
          Back to {name || 'Cafe'}
        </Link>
        <div className="mt-8 max-w-4xl">
          <h1 className="text-4xl font-serif font-bold text-stone-900">Cafe Photos</h1>
          <p className="mt-2 text-stone-600">Upload high-resolution photos and select your cover image</p>

          {message && <p className="mt-4 rounded-xl bg-brand-cream p-4 text-brand-coffee">{message}</p>}

          <div className="mt-6 flex items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-coffee px-5 py-3 font-semibold text-white hover:bg-brand-coffee-dark transition-colors">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload New Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
            </div>
          ) : photos.length === 0 ? (
            <div className="mt-8 p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white">
              <p className="text-stone-500">No photos uploaded yet. Add photos to showcase your cafe!</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {photos.map((p) => (
                <div key={p.id} className="relative rounded-2xl border border-brand-border bg-white overflow-hidden shadow-xs">
                  <img src={p.url} alt={p.altText || name} className="h-48 w-full object-cover" />
                  <div className="p-3 flex items-center justify-between bg-white border-t border-stone-100">
                    <button
                      onClick={() => handleSetCover(p.id)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        p.isCover ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${p.isCover ? 'fill-amber-500 text-amber-500' : ''}`} />
                      {p.isCover ? 'Cover' : 'Set as cover'}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
