import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Star, Trash2, Edit2, Check, X as CloseIcon } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';

export default function OwnerCafePhotosPage() {
  const { id } = useParams<{ id: string }>();
  const [cafe, setCafe] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editData, setEditData] = useState({ altText: '', caption: '' });

  const load = () => {
    if (!id) return;
    ownerService.getOwnedCafe(id)
      .then(r => setCafe(r.data))
      .catch(e => toast.error(e.message));
  };

  useEffect(() => {
    load();
  }, [id]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!id || !file) return;
    setBusy(true);
    try {
      await ownerCafeService.uploadPhoto(id, file);
      toast.success('Photo uploaded successfully');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photoId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await ownerCafeService.deletePhoto(id, photoId);
      toast.success('Photo deleted');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const cover = async (photoId: string) => {
    if (!id) return;
    try {
      await ownerCafeService.setCover(id, photoId);
      toast.success('Cover photo updated');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (photo: any) => {
    setEditingPhoto(photo.id);
    setEditData({
      altText: photo.altText || '',
      caption: photo.caption || ''
    });
  };

  const saveEdit = async (photoId: string) => {
    if (!id) return;
    try {
      await ownerCafeService.updatePhotoMetadata(id, photoId, editData);
      toast.success('Photo metadata updated');
      setEditingPhoto(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link 
          to={`/owner/cafes/${id}`} 
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {cafe?.name || 'cafe'}
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-stone-900">Cafe Photos</h1>
            <p className="text-stone-500 mt-2">Manage your cafe's gallery. The first photo or selected cover will be shown in search results.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all active:scale-95">
            <ImagePlus className="h-5 w-5" />
            {busy ? 'Uploading...' : 'Upload New Photo'}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={upload} 
              className="hidden" 
              disabled={busy} 
            />
          </label>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cafe?.photos?.map((photo: any) => (
            <div key={photo.id} className="group flex flex-col bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="relative aspect-video overflow-hidden bg-stone-100">
                <img 
                  src={photo.url} 
                  alt={photo.altText || cafe.name} 
                  className="h-full w-full object-cover" 
                />
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    title="Set as cover" 
                    onClick={() => cover(photo.id)} 
                    className={`rounded-full p-3 transition-all ${photo.isCover ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 hover:scale-110'}`}
                  >
                    <Star className={`h-5 w-5 ${photo.isCover ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    title="Edit details" 
                    onClick={() => startEdit(photo)} 
                    className="rounded-full bg-white p-3 text-stone-600 hover:text-blue-600 hover:scale-110 transition-all"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    title="Delete photo" 
                    onClick={() => remove(photo.id)} 
                    className="rounded-full bg-white p-3 text-stone-600 hover:text-red-600 hover:scale-110 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {photo.isCover && (
                  <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    Cover
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4">
                {editingPhoto === photo.id ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input 
                      label="Alt Text" 
                      value={editData.altText} 
                      onChange={e => setEditData({ ...editData, altText: e.target.value })}
                      placeholder="Describe the photo for screen readers..."
                      className="text-xs"
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Caption</label>
                      <textarea
                        value={editData.caption}
                        onChange={e => setEditData({ ...editData, caption: e.target.value })}
                        placeholder="Add a caption..."
                        rows={2}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => saveEdit(photo.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingPhoto(null)}
                      >
                        <CloseIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Caption</h3>
                      <p className="text-sm text-stone-700 line-clamp-2 italic">
                        {photo.caption || <span className="text-stone-300 font-normal">No caption provided.</span>}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Alt Text</h3>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {photo.altText || <span className="text-stone-300 font-normal">No alt text.</span>}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {(!cafe?.photos || cafe.photos.length === 0) && (
            <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
              <ImagePlus className="mx-auto h-12 w-12 text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900">No photos yet</h3>
              <p className="text-stone-500 max-w-xs mx-auto mt-2">Upload some photos of your cafe to showcase your space and menu to potential customers.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
