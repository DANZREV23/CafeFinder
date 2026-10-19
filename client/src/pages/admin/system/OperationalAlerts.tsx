// client/src/pages/admin/system/OperationalAlerts.tsx
import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Check, 
  Info,
  Filter
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

export const OperationalAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      const res = await adminService.getAlerts(params);
      if (res.success && Array.isArray(res.data)) {
        setAlerts(res.data);
      } else {
        setAlerts([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch operational alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus, filterSeverity]);

  const handleAcknowledge = async (id: string) => {
    setActingId(id);
    try {
      const res = await adminService.acknowledgeAlert(id);
      if (res.success) {
        toast.success('Alert acknowledged');
        await fetchAlerts();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge alert');
    } finally {
      setActingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActingId(id);
    try {
      const res = await adminService.resolveAlert(id);
      if (res.success) {
        toast.success('Alert resolved');
        await fetchAlerts();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve alert');
    } finally {
      setActingId(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">WARNING</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Operational Alerts</h1>
          <p className="text-stone-500 mt-1">
            Real-time anomalies, threshold warnings, and system incident logs.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchAlerts();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Alerts
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Filter className="w-4 h-4" />
          Filter:
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-stone-200 rounded-lg px-2.5 py-1 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-stone-200 rounded-lg px-2.5 py-1 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-900">All Systems Nominal</h3>
          <p className="text-sm text-stone-500 mt-1">No operational alerts matching current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 bg-white border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                alert.status === 'RESOLVED'
                  ? 'border-stone-200 opacity-60'
                  : alert.severity === 'CRITICAL'
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-stone-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  {getSeverityBadge(alert.severity)}
                  <span className="font-semibold text-stone-900 text-base">{alert.title || alert.type}</span>
                  <span className="text-xs text-stone-400 font-mono">
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{alert.message || alert.description}</p>
              </div>

              {alert.status !== 'RESOLVED' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.status === 'OPEN' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={actingId === alert.id}
                      className="px-3 py-1.5 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={actingId === alert.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
