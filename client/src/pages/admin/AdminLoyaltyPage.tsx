import React, { useState, useEffect } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import { Award, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLoyaltyPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await loyaltyService.getAdminOverview();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load admin loyalty overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateProgramStatus = async (programId: string, status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED') => {
    if (!confirm(`Are you sure you want to set program status to ${status}?`)) return;
    try {
      const res = await loyaltyService.adminUpdateProgramStatus(programId, status);
      if (res.success) {
        toast.success(`Program status updated to ${status}`);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update program status');
    }
  };

  const handleReconcile = async () => {
    if (!confirm('Run full ledger audit and balance consistency reconciliation across all accounts?')) return;
    setReconciling(true);
    try {
      const res = await loyaltyService.adminReconcileLedgers();
      if (res.success) {
        toast.success(res.data?.message || 'Ledger reconciliation completed successfully');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const stats = data?.stats || data?.summary || {};
  const programs = data?.programs || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Award className="w-4 h-4" />
            Platform Loyalty Governance
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Loyalty Programs & Rewards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Audit points ledgers, monitor cafe reward programs, and prevent abusive balance changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
            {reconciling ? 'Auditing...' : 'Reconcile Ledgers'}
          </button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 block mb-1">Total Programs</span>
          <span className="text-2xl font-bold text-gray-900">{stats.totalPrograms ?? programs.length ?? 0}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 block mb-1">Active Programs</span>
          <span className="text-2xl font-bold text-emerald-600">
            {stats.activePrograms ?? programs.filter((p: any) => p.status === 'ACTIVE').length ?? 0}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 block mb-1">Total Customer Accounts</span>
          <span className="text-2xl font-bold text-brand-coffee">{stats.totalAccounts ?? 0}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 block mb-1">Completed Redemptions</span>
          <span className="text-2xl font-bold text-amber-600">{stats.completedRedemptions ?? 0}</span>
        </div>
      </div>

      {/* Programs Management Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-lg">Registered Cafe Programs</h3>
          <span className="text-xs text-gray-500">{programs.length} programs registered</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading loyalty programs...</div>
        ) : programs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No loyalty programs registered in the platform yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">Cafe & Program</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Visit Points</th>
                  <th className="p-4">Rewards / Members</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {programs.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{p.cafe?.name}</span>
                      <span className="text-xs text-gray-400">{p.name}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">{p.pointsPerVisit} pts</td>
                    <td className="p-4">
                      <span className="text-xs block text-gray-500">
                        {p._count?.rewards || 0} rewards • {p._count?.accounts || 0} members
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {p.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateProgramStatus(p.id, 'ACTIVE')}
                          className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
                        >
                          Activate
                        </button>
                      )}
                      {p.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleUpdateProgramStatus(p.id, 'SUSPENDED')}
                          className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
