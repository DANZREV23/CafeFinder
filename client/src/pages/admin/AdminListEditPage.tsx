import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Search, GripVertical, Info, ExternalLink, Image, Coffee } from 'lucide-react';
import { adminListService } from '../../services/adminListService';
import { cafeService } from '../../services/cafeService';
import { CuratedList, Cafe, PostStatus, CuratedListCafe } from '../../types';
import { Button } from '../../components/ui/Button';

const AdminListEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEdit ? true : false);
  const [saving, setSaving] = useState(false);
  const [cafeSearch, setCafeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Cafe[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CuratedList>>({
    title: '',
    description: '',
    coverImage: '',
    coverImageAlt: '',
    featured: false,
    status: 'DRAFT',
    sortOrder: 0,
    cafes: []
  });

  useEffect(() => {
    if (isEdit) {
      loadList();
    }
  }, [id]);

  const loadList = async () => {
    try {
      const response = await adminListService.getById(id!);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to load list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await adminListService.update(id!, formData);
      } else {
        await adminListService.create(formData);
      }
      navigate('/admin/lists');
    } catch (error) {
      console.error('Failed to save collection:', error);
    } finally {
      setSaving(false);
    }
  };

  const searchCafes = async () => {
    if (cafeSearch.length < 2) return;
    setSearching(true);
    try {
      const response = await cafeService.search(cafeSearch);
      if (response.success) {
        // Filter out cafes already in the list
        const existingIds = new Set(formData.cafes?.map(c => c.cafeId) || []);
        setSearchResults(response.data.filter(c => !existingIds.has(c.id)));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const addCafe = async (cafe: Cafe) => {
    if (!isEdit) {
      // For new lists, we'll need to save the list first or manage local state
      // Simplest: require saving basic info first, or implement sophisticated state
      alert('Please save the collection basics first before adding cafes.');
      return;
    }

    try {
      const response = await adminListService.addCafe(id!, {
        cafeId: cafe.id,
        sortOrder: (formData.cafes?.length || 0) + 1
      });
      if (response.success) {
        loadList(); // Reload to get full data
        setCafeSearch('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add cafe:', error);
    }
  };

  const removeCafe = async (cafeId: string) => {
    if (!window.confirm('Remove this cafe from the collection?')) return;
    try {
      const response = await adminListService.removeCafe(id!, cafeId);
      if (response.success) {
        setFormData({
          ...formData,
          cafes: formData.cafes?.filter(c => c.cafeId !== cafeId)
        });
      }
    } catch (error) {
      console.error('Failed to remove cafe:', error);
    }
  };

  const updateCafeOrder = async (cafeId: string, sortOrder: number, editorialNote?: string) => {
    try {
      await adminListService.updateCafe(id!, cafeId, { sortOrder, editorialNote });
      // Update local state for immediate feedback
      setFormData({
        ...formData,
        cafes: formData.cafes?.map(c => 
          c.cafeId === cafeId ? { ...c, sortOrder, editorialNote } : c
        ).sort((a, b) => a.sortOrder - b.sortOrder)
      });
    } catch (error) {
      console.error('Failed to update association:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <Link to="/admin/lists" className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-2 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
          <h1 className="text-3xl font-black text-neutral-900">
            {isEdit ? 'Edit Collection' : 'Create New Collection'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => window.open(`/lists/${formData.slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Live Preview
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {saving ? 'Saving...' : 'Save Collection'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        {/* Left Column: Basics & Cafes */}
        <div className="space-y-12">
          {/* Basic Info Card */}
          <section className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              General Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Collection Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Best Minimalist Work Cafes"
                  className="w-full text-2xl font-bold bg-neutral-50 border border-neutral-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell the story behind this collection..."
                  rows={4}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-base focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </section>

          {/* Cafes Management */}
          {isEdit ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-primary-600" />
                  Cafes in this Collection
                </h2>
                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                  {formData.cafes?.length || 0} Total
                </div>
              </div>

              <div className="space-y-4">
                {formData.cafes && formData.cafes.length > 0 ? (
                  formData.cafes.map((item, idx) => (
                    <div key={item.cafeId} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex gap-6 items-start group">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        <GripVertical className="w-5 h-5 text-neutral-200 cursor-grab" />
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-lg text-neutral-900">{item.cafe.name}</h4>
                            <p className="text-neutral-500 text-xs font-medium">{item.cafe.city}</p>
                          </div>
                          <button 
                            onClick={() => removeCafe(item.cafeId)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Editorial Note</label>
                          <input
                            type="text"
                            value={item.editorialNote || ''}
                            onChange={e => updateCafeOrder(item.cafeId, item.sortOrder, e.target.value)}
                            placeholder="Why did you pick this cafe? (Optional)"
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center">
                    <p className="text-neutral-400 font-medium">No cafes added yet. Search and add some!</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="bg-primary-50 p-8 rounded-3xl border border-primary-100 flex flex-col items-center text-center">
              <Info className="w-8 h-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-black text-primary-900 mb-2">Almost there!</h3>
              <p className="text-primary-700 text-sm max-w-xs mx-auto">
                Please save your collection's title and description before you can start adding cafes.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Settings */}
        <div className="space-y-8">
          {/* Cover Image */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Featured Image</label>
            <div className="aspect-video bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100 group relative">
              {formData.coverImage ? (
                <img src={formData.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                  <Image className="w-10 h-10 mb-2" />
                  <span className="text-[10px] font-bold">No Image Selected</span>
                </div>
              )}
            </div>
            <input
              type="text"
              value={formData.coverImage || ''}
              onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="Enter cover image URL..."
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary-500 outline-none font-medium"
            />
            <input
              type="text"
              value={formData.coverImageAlt || ''}
              onChange={e => setFormData({ ...formData, coverImageAlt: e.target.value })}
              placeholder="Alt text"
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary-500 outline-none font-medium"
            />
          </div >

          {/* Quick Settings */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">List Settings</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-tight text-neutral-900">Featured List</div>
                  <div className="text-[10px] text-neutral-500">Show in trending sections</div>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData.featured ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    formData.featured ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Publication Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['DRAFT', 'PUBLISHED'] as PostStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.status === s 
                          ? 'bg-neutral-900 text-white shadow-md' 
                          : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cafe Search (Only when editing) */}
          {isEdit && (
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">Add More Cafes</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search cafes to add..."
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  value={cafeSearch}
                  onChange={(e) => {
                    setCafeSearch(e.target.value);
                    if (e.target.value.length > 2) searchCafes();
                    else setSearchResults([]);
                  }}
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {searching ? (
                  <div className="py-4 text-center">
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin mx-auto" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(cafe => (
                    <button
                      key={cafe.id}
                      onClick={() => addCafe(cafe)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors group text-left"
                    >
                      <div className="w-10 h-10 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
                        {cafe.photos?.[0]?.url && (
                          <img src={cafe.photos[0].url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-neutral-900 truncate group-hover:text-primary-700">{cafe.name}</div>
                        <div className="text-[10px] text-neutral-500 uppercase font-black">{cafe.city}</div>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : cafeSearch.length > 2 ? (
                  <div className="py-4 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    No results found
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminListEditPage;
