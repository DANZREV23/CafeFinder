import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  Filter, 
  Trash2, 
  Info, 
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  FileIcon,
  AlertCircle
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/services/api';
import { ApiResponse } from '@/types';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  uploadedBy?: { name: string };
  cafePhotos?: any[];
  blogPosts?: any[];
  curatedLists?: any[];
}

export const AdminMediaLibraryPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<ApiResponse<{ assets: MediaAsset[]; totalPages: number }>>(`/admin/media?page=${page}&search=${search}&limit=24`);
      if (data.success && data.data) {
        setAssets(data.data.assets);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      toast.error('Failed to fetch media assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      const data = await fetchApi<ApiResponse<void>>(`/admin/media/${id}`, { method: 'DELETE' });
      if (data.success) {
        toast.success('Asset deleted');
        fetchAssets();
        if (selectedAsset?.id === id) setSelectedAsset(null);
      } else {
        toast.error(data.error?.message || 'Failed to delete asset');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error deleting asset');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">{t("admin.mediaLibrary")}</h1>
          <p className="text-stone-500">Manage your application's visual assets and track usage.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-stone-100' : ''}
          >
            <LayoutGrid size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-stone-100' : ''}
          >
            <ListIcon size={18} />
          </Button>
          <Button variant="primary" size="sm" onClick={() => fetchAssets()}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input 
              placeholder="Search by filename, alt text, or caption..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={18} />
            Filters
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-stone-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-stone-200">
              <ImageIcon className="mx-auto text-stone-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-stone-900">No media found</h3>
              <p className="text-stone-500">Try adjusting your search or filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={clsx(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                    selectedAsset?.id === asset.id ? "border-amber-600 ring-2 ring-amber-100" : "border-transparent hover:border-stone-300"
                  )}
                >
                  <img 
                    src={asset.thumbnailUrl || asset.url} 
                    alt={asset.altText || asset.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Info className="text-white" size={24} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Preview</th>
                    <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Filename</th>
                    <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {assets.map((asset) => (
                    <tr 
                      key={asset.id} 
                      onClick={() => setSelectedAsset(asset)}
                      className={clsx(
                        "cursor-pointer hover:bg-stone-50 transition-colors",
                        selectedAsset?.id === asset.id ? "bg-amber-50" : ""
                      )}
                    >
                      <td className="px-4 py-3">
                        <img 
                          src={asset.thumbnailUrl || asset.url} 
                          alt="" 
                          className="w-10 h-10 rounded object-cover border border-stone-200"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-stone-900 truncate max-w-[200px]">{asset.filename}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">{asset.mimeType.split('/')[1].toUpperCase()}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">{formatFileSize(asset.size)}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">{formatDate(asset.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center px-4 text-sm text-stone-500">
                Page {page} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedAsset ? (
            <div className="sticky top-24 space-y-6">
              <Card className="p-4 overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-200 mb-4">
                  <img 
                    src={selectedAsset.url} 
                    alt={selectedAsset.altText || ''} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 mb-1">Metadata</h3>
                    <div className="space-y-1 text-xs text-stone-500">
                      <p><span className="font-medium text-stone-700">Filename:</span> {selectedAsset.filename}</p>
                      <p><span className="font-medium text-stone-700">Original:</span> {selectedAsset.originalName}</p>
                      <p><span className="font-medium text-stone-700">Dimensions:</span> {selectedAsset.width} x {selectedAsset.height}</p>
                      <p><span className="font-medium text-stone-700">Size:</span> {formatFileSize(selectedAsset.size)}</p>
                      <p><span className="font-medium text-stone-700">Type:</span> {selectedAsset.mimeType}</p>
                      <p><span className="font-medium text-stone-700">Uploaded:</span> {formatDate(selectedAsset.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <h3 className="text-sm font-semibold text-stone-900">Accessibility & SEO</h3>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Alt Text</label>
                      <Input 
                        value={selectedAsset.altText || ''} 
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, altText: e.target.value })}
                        placeholder="Describe the image..."
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Caption</label>
                      <textarea
                        value={selectedAsset.caption || ''}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, caption: e.target.value })}
                        placeholder="Add a caption..."
                        rows={2}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full"
                      onClick={async () => {
                        try {
                          const data = await fetchApi<ApiResponse<any>>(`/admin/media/${selectedAsset.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ altText: selectedAsset.altText, caption: selectedAsset.caption })
                          });
                          if (data.success) {
                            toast.success('Metadata updated');
                            fetchAssets();
                          }
                        } catch (error) {
                          toast.error('Failed to update metadata');
                        }
                      }}
                    >
                      Update Metadata
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <h3 className="text-sm font-semibold text-stone-900 mb-2">Usage</h3>
                    <div className="space-y-2">
                      {(!selectedAsset.cafePhotos?.length && !selectedAsset.blogPosts?.length && !selectedAsset.curatedLists?.length) ? (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded text-xs border border-amber-100">
                          <AlertCircle size={14} />
                          This asset is orphaned (unused).
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {selectedAsset.cafePhotos?.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-stone-50 rounded border border-stone-100 text-xs">
                              <span className="truncate max-w-[120px]">Cafe: {p.cafe?.name}</span>
                              <ExternalLink size={12} className="text-stone-400" />
                            </div>
                          ))}
                          {/* Other usages... */}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                        <ExternalLink size={14} />
                        View Full Size
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                      onClick={() => handleDelete(selectedAsset.id)}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Asset
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl p-8 text-center border-2 border-dashed border-stone-200">
              <Info className="mx-auto text-stone-300 mb-2" size={32} />
              <p className="text-xs text-stone-500 uppercase font-bold tracking-widest">Select an asset</p>
              <p className="text-sm text-stone-400 mt-2">Select an item from the library to view details and manage metadata.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
