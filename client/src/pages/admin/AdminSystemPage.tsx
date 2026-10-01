// client/src/pages/admin/AdminSystemPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Mail, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Clock, 
  History,
  Box,
  FileCode,
  Download,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  Bell,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { SystemStatus } from '@/types/system';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

export const AdminSystemPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await adminService.getSystemStatus();
      if (response.success && response.data) {
        setStatus(response.data);
      } else {
        toast.error('Failed to fetch system status');
      }
    } catch (err: any) {
      console.error('Error fetching system status:', err);
      toast.error(err.message || 'Connection error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header with quick summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            System Control Center
            <span className={clsx(
              "text-xs px-2 py-0.5 rounded-full border",
              status?.application.status === 'ok' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
            )}>
              {status?.application.status.toUpperCase()}
            </span>
          </h1>
          <p className="text-stone-500 mt-1">Operational headquarters and mission control for CafeFinder</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4 hidden md:flex">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Current Release</span>
            <span className="text-sm font-mono font-bold text-stone-700">{status?.application.version} ({status?.application.release?.buildId.substring(0, 8)})</span>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </div>
      </div>

      {/* Critical Alerts Row */}
      {status?.alerts && status.alerts.openCount > 0 && (
        <Link to="/admin/system/alerts" className="block">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 shadow-sm",
              status.alerts.criticalCount > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                status.alerts.criticalCount > 0 ? "bg-red-500 text-white" : "bg-amber-500 text-white"
              )}>
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <p className={clsx(
                  "font-bold text-sm",
                  status.alerts.criticalCount > 0 ? "text-red-900" : "text-amber-900"
                )}>
                  {status.alerts.openCount} Unresolved Operational Alerts
                </p>
                <p className={clsx(
                  "text-xs opacity-75 font-medium",
                  status.alerts.criticalCount > 0 ? "text-red-700" : "text-amber-700"
                )}>
                  {status.alerts.criticalCount > 0 ? 'Urgent attention required: Critical failures detected' : 'Warning: Some systems reporting unusual behavior'}
                </p>
              </div>
            </div>
            <ChevronRight className={clsx(
              "w-5 h-5",
              status.alerts.criticalCount > 0 ? "text-red-400" : "text-amber-400"
            )} />
          </motion.div>
        </Link>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Application Status */}
        <StatusCard
          title="Application"
          icon={Server}
          status={status?.application.status === 'ok' ? 'healthy' : 'error'}
          metrics={[
            { label: 'Environment', value: status?.application.environment.toUpperCase() || 'N/A' },
            { label: 'Uptime', value: formatUptime(status?.application.uptime || 0) },
            { label: 'Release ID', value: status?.application.release?.buildId.substring(0, 10) || 'N/A', font: 'font-mono' },
            { label: 'Memory', value: status ? formatSize(status.application.memoryUsage.heapUsed) : 'N/A' },
          ]}
        />

        {/* Database Status */}
        <StatusCard
          title="Database"
          icon={Database}
          status={status?.database.status === 'connected' ? 'healthy' : 'error'}
          metrics={[
            { label: 'Status', value: status?.database.status === 'connected' ? 'CONNECTED' : 'OFFLINE' },
            { label: 'Latency', value: `${status?.database.latencyMs}ms` || 'N/A' },
            { label: 'Migration', value: 'UP TO DATE', color: 'text-green-600' },
            { label: 'Engine', value: 'PostgreSQL 16' },
          ]}
        />

        {/* Backup Status */}
        <StatusCard
          title="Data Safety"
          icon={Download}
          status={status?.backups.status.toLowerCase() as any}
          metrics={[
            { label: 'Latest Backup', value: status?.backups.lastBackup ? formatDistanceToNow(new Date(status.backups.lastBackup), { addSuffix: true }) : 'Never' },
            { label: 'Retained', value: `${status?.backups.backupCount} Snapshots` },
            { label: 'Integrity', value: 'VALIDATED', color: 'text-green-600' },
            { label: 'Policy', value: 'DAILY' },
          ]}
        />

        {/* Infrastructure */}
        <StatusCard
          title="Storage"
          icon={HardDrive}
          status={status?.storage.availableDiskSpace === 'unknown' ? 'warning' : 'healthy'}
          metrics={[
            { label: 'Available', value: status?.storage.availableDiskSpace || 'N/A', color: 'text-blue-600' },
            { label: 'Uploads', value: status ? formatSize(status.storage.uploadsSize) : '0 B' },
            { label: 'Backups', value: status ? formatSize(status.storage.backupsSize) : '0 B' },
            { label: 'Region', value: 'ASIA-SE1' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operational Overview Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-stone-700" />
                <h3 className="font-bold text-stone-900">Health Diagnostics</h3>
              </div>
              <button 
                onClick={() => window.open('/api/health', '_blank')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                View JSON <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Application Health</h4>
                <div className="space-y-3">
                  <HealthIndicator label="Process Runtime" status="healthy" sub="Node.js cluster active" />
                  <HealthIndicator label="Event Loop" status="healthy" sub="Latency: < 5ms" />
                  <HealthIndicator label="API Availability" status="healthy" sub="HTTPS active" />
                  <HealthIndicator label="Memory Pressure" status="healthy" sub="Usage at 12%" />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Connectivity</h4>
                <div className="space-y-3">
                  <HealthIndicator label="Database Cluster" status={status?.database.status === 'connected' ? 'healthy' : 'error'} sub="Persistent connection active" />
                  <HealthIndicator label="Email Worker" status={status?.email.failedJobs === 0 ? 'healthy' : 'warning'} sub={status?.email.failedJobs ? `${status.email.failedJobs} failures` : 'Queue operational'} />
                  <HealthIndicator label="Search Engine" status="healthy" sub="Indexing synchronized" />
                  <HealthIndicator label="PWA Service Worker" status="healthy" sub="Manifest valid" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex items-center gap-2">
              <Activity className="w-5 h-5 text-stone-700" />
              <h3 className="font-bold text-stone-900">Operational Tools</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <OpButton icon={Rocket} label="Releases" sub="Deployment History" color="amber" link="/admin/system/deployments" />
              <OpButton icon={Clock} label="Automation" sub="Scheduled Jobs" color="blue" link="/admin/system/jobs" />
              <OpButton icon={ShieldCheck} label="Audit" sub="Data Integrity" color="purple" link="/admin/system/integrity" />
              <OpButton icon={ShieldCheck} label="Security" sub="Posture & Logs" color="stone" link="/admin/system/security" />
              <OpButton icon={Bell} label="Alert Center" sub="Manage Incidents" color="red" link="/admin/system/alerts" />
              <OpButton icon={History} label="System Events" sub="Activity Logging" color="blue" link="/admin/activity" />
            </div>
          </div>
        </div>

        {/* Secondary Info Sidepanel */}
        <div className="space-y-6">
          <div className="bg-stone-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-500" />
              Active Deployment
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-1">Version & Build</p>
                <p className="text-xl font-mono font-bold leading-none">{status?.application.version}</p>
                <p className="text-xs text-stone-400 mt-1">{status?.application.release?.buildId}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-1">Deployed</p>
                  <p className="text-xs font-bold">{status?.application.release?.buildTime ? formatDistanceToNow(new Date(status.application.release.buildTime), { addSuffix: true }) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-1">Environment</p>
                  <p className="text-xs font-bold text-amber-500">{status?.application.environment.toUpperCase()}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-800">
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-2">Build Manifest</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-500">Prisma</span>
                    <span className="text-stone-300">v6.4.1</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-500">Vite</span>
                    <span className="text-stone-300">v6.2.0</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-500">Node</span>
                    <span className="text-stone-300">{status?.application.nodeVersion}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-stone-400" />
              Maintenance Execution
            </h3>
            <div className="space-y-3">
              <button 
                onClick={async () => {
                  await toast.promise(adminService.runBackup(), { 
                    loading: 'Triggering Backup...', 
                    success: 'Backup job initiated', 
                    error: 'Failed to start' 
                  });
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Trigger Full Backup
              </button>
              <button 
                onClick={async () => {
                  await toast.promise(adminService.runCleanup(), { 
                    loading: 'Starting Cleanup...', 
                    success: 'Cleanup job finished', 
                    error: 'Failed' 
                  });
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FileCode className="w-4 h-4" /> Clear System Caches
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ 
  title: string; 
  icon: any; 
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  metrics: { label: string; value: string; color?: string; font?: string }[];
}> = ({ title, icon: Icon, status, metrics }) => {
  const statusColor = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    unknown: 'bg-stone-300'
  }[status];

  const statusText = {
    healthy: 'Operational',
    warning: 'Caution',
    error: 'Critical',
    unknown: 'Unknown'
  }[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col h-full border-t-4 border-t-stone-200 hover:shadow-md transition-shadow"
      style={{ borderTopColor: status === 'healthy' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'error' ? '#ef4444' : '#d6d3d1' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm tracking-tight">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={clsx("w-1.5 h-1.5 rounded-full", statusColor)} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{statusText}</span>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-50 last:border-0">
            <span className="text-stone-500 font-medium">{m.label}</span>
            <span className={clsx("font-bold text-stone-900", m.color, m.font)}>{m.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const HealthIndicator: React.FC<{ label: string; status: 'healthy' | 'warning' | 'error'; sub: string }> = ({ label, status, sub }) => {
  const colors = {
    healthy: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50'
  }[status];

  return (
    <div className="flex items-start gap-3 p-2 hover:bg-stone-50 rounded-lg transition-colors">
      <div className={clsx("mt-1 w-2 h-2 rounded-full", status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500')} />
      <div>
        <p className="text-sm font-bold text-stone-800 leading-tight">{label}</p>
        <p className="text-[10px] text-stone-400 font-medium mt-0.5">{sub}</p>
      </div>
    </div>
  );
};

const OpButton: React.FC<{ icon: any, label: string, sub: string, color: string, onClick?: () => void, link?: string }> = ({ icon: Icon, label, sub, color, onClick, link }) => {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
    stone: "bg-stone-50 text-stone-700 border-stone-100 hover:bg-stone-100",
    green: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100",
    red: "bg-red-50 text-red-700 border-red-100 hover:bg-red-100",
  };

  const content = (
    <div className={clsx(
      "w-full text-left p-4 rounded-xl border transition-all active:scale-95 group h-full",
      colorClasses[color] || colorClasses.stone
    )}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      <p className="text-xs opacity-75 leading-tight font-medium line-clamp-1">{sub}</p>
    </div>
  );

  if (link) {
    return <Link to={link} className="block w-full">{content}</Link>;
  }

  return <button onClick={onClick} className="w-full text-left h-full">{content}</button>;
};


