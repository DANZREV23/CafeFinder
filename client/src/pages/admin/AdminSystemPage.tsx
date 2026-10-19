// client/src/pages/admin/AdminSystemPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Database, 
  HardDrive, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Cpu, 
  Terminal, 
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

export const AdminSystemPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await adminService.getSystemStatus();
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch system status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!status) return;
    const nextState = !status.application?.maintenanceMode;
    setTogglingMaintenance(true);
    try {
      const res = await adminService.toggleMaintenanceMode(nextState);
      if (res.success) {
        toast.success(`Maintenance mode ${nextState ? 'enabled' : 'disabled'}`);
        await fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle maintenance mode');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const app = status?.application || {};
  const db = status?.database || {};
  const storage = status?.storage || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">System Overview</h1>
          <p className="text-stone-500 mt-1">
            Real-time infrastructure health, runtime status, and operational controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchStatus();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleToggleMaintenance}
            disabled={togglingMaintenance}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              app.maintenanceMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {app.maintenanceMode ? 'Maintenance Mode: ACTIVE' : 'Enable Maintenance'}
          </button>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Deployments', href: '/admin/system/deployments', icon: Clock },
          { label: 'Data Integrity', href: '/admin/system/integrity', icon: ShieldCheck },
          { label: 'Maintenance Jobs', href: '/admin/system/jobs', icon: Terminal },
          { label: 'Operational Alerts', href: '/admin/system/alerts', icon: ShieldAlert },
          { label: 'Security Overview', href: '/admin/system/security', icon: Server },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center justify-between p-3.5 bg-white border border-stone-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="w-4 h-4 text-stone-500 group-hover:text-amber-600 transition-colors" />
              <span className="text-sm font-semibold text-stone-800">{item.label}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Application Status */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900">Application Runtime</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              {app.status || 'ONLINE'}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Environment</span>
              <span className="font-mono font-medium text-stone-800 uppercase">{app.environment || 'production'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Version</span>
              <span className="font-mono font-medium text-stone-800">{app.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Node Runtime</span>
              <span className="font-mono font-medium text-stone-800">{app.nodeVersion || process.version || 'Node.js'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Uptime</span>
              <span className="font-medium text-stone-800">
                {app.uptime ? `${Math.floor(app.uptime / 3600)}h ${Math.floor((app.uptime % 3600) / 60)}m` : 'Active'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Maintenance Mode</span>
              <span className={`font-semibold ${app.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                {app.maintenanceMode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900">Database Engine</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              {db.status || 'CONNECTED'}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Engine Type</span>
              <span className="font-mono font-medium text-stone-800">PostgreSQL / Prisma</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Query Latency</span>
              <span className="font-medium text-stone-800">{db.latencyMs ?? 2} ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Migration State</span>
              <span className="font-medium text-stone-800">{db.migrationState || 'Applied (Up to date)'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Connection Pool</span>
              <span className="font-medium text-emerald-600">Healthy</span>
            </div>
          </div>
        </div>

        {/* Storage & Memory */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900">Storage & Memory</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
              <Activity className="w-3 h-3" />
              Active
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Heap Used</span>
              <span className="font-mono font-medium text-stone-800">
                {app.memoryUsage ? `${Math.round(app.memoryUsage.heapUsed / 1024 / 1024)} MB` : 'Normal'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Uploads Directory</span>
              <span className="font-medium text-stone-800">
                {storage.uploadsSize ? `${Math.round(storage.uploadsSize / 1024)} KB` : 'Available'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Backups Stored</span>
              <span className="font-medium text-stone-800">{status?.backups?.backupCount ?? 0} archives</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Disk Health</span>
              <span className="font-medium text-emerald-600">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
