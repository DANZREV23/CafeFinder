import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Mail, 
  Shield, 
  Clock,
  MoreVertical,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { User as UserType, PaginatedResponse, UserStatus } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<UserType>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ 
        role, 
        status, 
        search, 
        page, 
        limit: 20 
      });
      if (res.success) {
        setUsers(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [role, status, search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchParams({ role, status, search: formData.get('search') as string, page: '1' });
  };

  const handleStatusUpdate = async (id: string, newStatus: UserStatus) => {
    const action = newStatus === 'SUSPENDED' ? 'suspend' : newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await adminService.updateUserStatus(id, newStatus);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ role, status, search, page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">User Management</h1>
          <p className="text-stone-500 text-sm">Manage user accounts, roles, and security status.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Role</label>
            <select 
              value={role} 
              onChange={(e) => setSearchParams({ role: e.target.value, status, search, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setSearchParams({ role, status: e.target.value, search, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
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
                placeholder="Name or email..."
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
                <div className="w-10 h-10 bg-stone-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-1/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center text-stone-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-stone-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <p className="font-bold text-stone-900 text-sm truncate max-w-[150px]">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <AdminStatusBadge type="role" status={user.role} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AdminStatusBadge type="user" status={user.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-stone-300" />
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {user.status === 'ACTIVE' ? (
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Suspend User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Activate User"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-all">
                             <MoreVertical className="w-4 h-4" />
                          </button>
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
          
          <span className="text-sm font-bold text-stone-600">
            Page {page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.totalPages}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
