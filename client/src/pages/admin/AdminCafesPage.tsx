import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Coffee, 
  Star, 
  Settings,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Edit,
  Eye,
  AlertCircle,
  Utensils,
  User,
  UserPlus,
  UserMinus,
  X
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Cafe, PaginatedResponse } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { clsx } from 'clsx';

export const AdminCafesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Cafe>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerModal, setOwnerModal] = useState<{ isOpen: boolean; cafe: Cafe | null }>({
    isOpen: false,
    cafe: null
  });
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const city = searchParams.get('city') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchCafes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getCafes({ 
        status, 
        search, 
        city,
        sortBy,
        page, 
        limit: 20 
      });
      if (res.success) {
        setCafes(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cafes');
    } finally {
      setLoading(false);
    }
  }, [status, search, city, sortBy, page]);

  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  const handleSearchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await adminService.getUsers({ search: query, limit: 10 });
      if (res.success) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('User search failed', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch) handleSearchUsers(userSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch, handleSearchUsers]);

  const handleUpdateOwner = async (cafeId: string, ownerId: string | null) => {
    try {
      const res = await adminService.updateCafeOwner(cafeId, ownerId);
      if (res.success) {
        setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, ownerId, owner: res.data.owner } : c));
        setOwnerModal({ isOpen: false, cafe: null });
        setUserSearch('');
        setSearchResults([]);
      }
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchParams({ 
      status, 
      city,
      sortBy,
      search: formData.get('search') as string, 
      page: '1' 
    });
  };

  const handleToggleFlag = async (id: string, flag: 'verified' | 'featured' | 'trending', currentValue: boolean) => {
    try {
      const res = await adminService.toggleCafeFlag(id, flag, !currentValue);
      if (res.success) {
        setCafes(prev => prev.map(c => c.id === id ? { ...c, [flag]: !currentValue } : c));
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ status, search, city, sortBy, page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Cafe Directory</h1>
          <p className="text-stone-500 text-sm">Manage published listings, verification, and featured status.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setSearchParams({ status: e.target.value, search, city, sortBy, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">City</label>
            <select 
              value={city} 
              onChange={(e) => setSearchParams({ status, search, city: e.target.value, sortBy, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Cities</option>
              <option value="Davao City">Davao City</option>
              <option value="Digos City">Digos City</option>
              <option value="Tagum City">Tagum City</option>
              <option value="Panabo City">Panabo City</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSearchParams({ status, search, city, sortBy: e.target.value, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Search</label>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Name or address..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 flex items-center gap-6 animate-pulse">
                <div className="w-12 h-12 bg-stone-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-1/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : cafes.length === 0 ? (
          <div className="p-20 text-center text-stone-400">No cafes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Cafe</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Rating</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Owner</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Badges</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cafes.map((cafe) => (
                  <tr key={cafe.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                           {cafe.photos?.[0] ? (
                             <img src={cafe.photos[0].url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <Coffee className="w-5 h-5" />
                             </div>
                           )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate max-w-[180px]">{cafe.name}</p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">{cafe.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{cafe.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-sm font-bold text-stone-900">
                            {Number(cafe.ratingAverage).toFixed(1)} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          </div>
                          <p className="text-[10px] text-stone-500 font-medium">{cafe.reviewCount} reviews</p>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AdminStatusBadge type="cafe" status={cafe.status as any} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {cafe.owner ? (
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-stone-900 truncate max-w-[120px]">{cafe.owner.name}</span>
                            <span className="text-[10px] text-stone-500 truncate max-w-[120px]">{cafe.owner.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Unclaimed</span>
                        )}
                        <button 
                          onClick={() => setOwnerModal({ isOpen: true, cafe })}
                          className="p-1 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all ml-auto shrink-0"
                          title="Change Owner"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleToggleFlag(cafe.id, 'verified', cafe.verified)}
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              cafe.verified ? "bg-blue-100 text-blue-600" : "bg-stone-100 text-stone-300 hover:text-stone-400"
                            )}
                            title={cafe.verified ? "Remove Verification" : "Verify Cafe"}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleFlag(cafe.id, 'featured', cafe.featured)}
                            disabled={cafe.status !== 'PUBLISHED' as any}
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              cafe.featured ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-300 hover:text-stone-400",
                              cafe.status !== 'PUBLISHED' as any && "opacity-20 cursor-not-allowed"
                            )}
                            title={cafe.featured ? "Remove Featured" : "Mark Featured"}
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleFlag(cafe.id, 'trending', cafe.trending)}
                            disabled={cafe.status !== 'PUBLISHED' as any}
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              cafe.trending ? "bg-green-100 text-green-600" : "bg-stone-100 text-stone-300 hover:text-stone-400",
                              cafe.status !== 'PUBLISHED' as any && "opacity-20 cursor-not-allowed"
                            )}
                            title={cafe.trending ? "Remove Trending" : "Mark Trending"}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/cafes/${cafe.slug}`} 
                            target="_blank"
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                            title="View Public Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link 
                            to={`/owner/cafes/${cafe.id}/menu`}
                            className="p-2 text-stone-400 hover:text-brand-coffee hover:bg-stone-100 rounded-lg transition-all"
                            title="Manage Menu"
                          >
                            <Utensils className="w-4 h-4" />
                          </Link>
                          <Link 
                            to={`/owner/cafes/${cafe.id}/edit`}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Cafe"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={clsx(
                      "w-10 h-10 rounded-lg font-bold text-sm transition-all",
                      page === p ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    {p}
                  </button>
                );
              }
              if (p === page - 2 || p === page + 2) return <span key={p} className="text-stone-400 italic text-sm">...</span>;
              return null;
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.totalPages}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Change Owner Modal */}
      {ownerModal.isOpen && ownerModal.cafe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Manage Ownership</h3>
                <p className="text-xs text-stone-500 mt-1">Assign or revoke ownership for <span className="font-semibold text-stone-700">{ownerModal.cafe.name}</span></p>
              </div>
              <button 
                onClick={() => {
                  setOwnerModal({ isOpen: false, cafe: null });
                  setUserSearch('');
                  setSearchResults([]);
                }}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {ownerModal.cafe.owner && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Current Owner</p>
                      <p className="text-sm font-semibold text-amber-900">{ownerModal.cafe.owner.name}</p>
                      <p className="text-xs text-amber-700/70">{ownerModal.cafe.owner.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateOwner(ownerModal.cafe!.id, null)}
                    className="flex flex-col items-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all group"
                  >
                    <UserMinus className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Revoke</span>
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Search New Owner</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    autoFocus
                  />
                </div>

                <div className="max-h-[200px] overflow-y-auto divide-y divide-stone-50 rounded-lg border border-stone-100">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-stone-400">Searching...</div>
                  ) : userSearch.length > 0 && searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-stone-400 italic">No users found.</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUpdateOwner(ownerModal.cafe!.id, user.id)}
                        disabled={user.id === ownerModal.cafe?.ownerId}
                        className="w-full p-3 flex items-center justify-between hover:bg-stone-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                            <p className="text-xs text-stone-500">{user.email}</p>
                          </div>
                        </div>
                        <UserPlus className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-400">Type at least 2 characters to search users.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
