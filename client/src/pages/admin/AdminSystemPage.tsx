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
  Box,
  FileCode,
  Download,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { SystemStatus } from '@/types/system';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminSystemPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetch('/api/admin/system/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      } else {
        toast.error('Failed to fetch system status');
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
      toast.error('Connection error');
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">System Status</h1>
          <p className="text-stone-500 mt-1">Real-time operational metrics and health monitoring</p>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Application Status */}
        <StatusCard
          title="Application"
          icon={Server}
          status={status?.application.status === 'ok' ? 'healthy' : 'error'}
          metrics={[
            { label: 'Status', value: status?.application.status.toUpperCase() || 'UNKNOWN' },
            { label: 'Environment', value: status?.application.environment || 'N/A' },
            { label: 'Version', value: `v${status?.application.version}` || 'N/A' },
            { label: 'Uptime', value: formatUptime(status?.application.uptime || 0) },
            { label: 'Node.js', value: status?.application.nodeVersion || 'N/A' },
            { label: 'Memory (Heap)', value: status ? formatSize(status.application.memoryUsage.heapUsed) : 'N/A' },
          ]}
        />

        {/* Database Status */}
        <StatusCard
          title="Database"
          icon={Database}
          status={status?.database.status === 'connected' ? 'healthy' : 'error'}
          metrics={[
            { label: 'Status', value: status?.database.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED' },
            { label: 'Latency', value: `${status?.database.latencyMs}ms` || 'N/A' },
            { label: 'Type', value: 'PostgreSQL' },
            { label: 'Connection Pool', value: 'Active' },
          ]}
        />

        {/* Storage Status */}
        <StatusCard
          title="Storage"
          icon={HardDrive}
          status="healthy"
          metrics={[
            { label: 'Uploads Size', value: status ? formatSize(status.storage.uploadsSize) : 'N/A' },
            { label: 'Backups Size', value: status ? formatSize(status.storage.backupsSize) : 'N/A' },
            { label: 'Available Disk', value: status?.storage.availableDiskSpace || 'N/A' },
            { label: 'Backup Path', value: '/backups' },
          ]}
        />

        {/* Email Status */}
        <StatusCard
          title="Email System"
          icon={Mail}
          status={status?.email.failedJobs === 0 ? 'healthy' : 'warning'}
          metrics={[
            { label: 'Provider', value: 'SMTP / Managed' },
            { label: 'Pending Jobs', value: status?.email.pendingJobs.toString() || '0' },
            { label: 'Failed Jobs', value: status?.email.failedJobs.toString() || '0', color: status?.email.failedJobs ? 'text-red-600' : '' },
          ]}
        />

        {/* Backup Status */}
        <StatusCard
          title="Backups"
          icon={Download}
          status={status?.backups.lastBackup ? 'healthy' : 'warning'}
          metrics={[
            { label: 'Latest Backup', value: status?.backups.lastBackup ? formatDistanceToNow(new Date(status.backups.lastBackup), { addSuffix: true }) : 'Never' },
            { label: 'Total Backups', value: status?.backups.backupCount.toString() || '0' },
            { label: 'Retention', value: '14 Days' },
          ]}
        />
      </div>

      {/* Operations Quick Links */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-stone-700" />
          <h3 className="font-bold text-stone-900">System Operations</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OpButton 
            icon={Box} 
            label="Run Backup" 
            sub="Database & Uploads" 
            color="amber" 
            onClick={async () => {
              try {
                await toast.promise(fetch('/api/admin/system/backup', { method: 'POST' }), { 
                  loading: 'Starting backup...', 
                  success: 'Backup processes started in background', 
                  error: 'Failed to start backup' 
                });
                // Small delay to allow backup to at least start/create files before refreshing
                setTimeout(() => fetchStatus(true), 2000);
              } catch (err) {
                console.error('Backup trigger failed:', err);
              }
            }} 
          />
          <OpButton icon={FileCode} label="Run Cleanup" sub="Logs & Sessions" color="stone" onClick={() => toast.promise(fetch('/api/admin/system/cleanup', { method: 'POST' }), { loading: 'Starting cleanup...', success: 'Cleanup started', error: 'Failed to start cleanup' })} />
          <OpButton icon={CheckCircle2} label="Health Check" sub="Full Diagnostic" color="green" onClick={() => window.open('/api/health', '_blank')} />
          <OpButton icon={ShieldCheck} label="Audit Logs" sub="Security Events" color="blue" link="/admin/activity" />
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ 
  title: string; 
  icon: any; 
  status: 'healthy' | 'warning' | 'error';
  metrics: { label: string; value: string; color?: string }[];
}> = ({ title, icon: Icon, status, metrics }) => {
  const statusColor = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  }[status];

  const statusText = {
    healthy: 'Operational',
    warning: 'Action Required',
    error: 'Critical'
  }[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-50 rounded-full border border-stone-100">
          <div className={clsx("w-2 h-2 rounded-full animate-pulse", statusColor)} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">{statusText}</span>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-stone-50 last:border-0">
            <span className="text-stone-500">{m.label}</span>
            <span className={clsx("font-medium text-stone-900", m.color)}>{m.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const OpButton: React.FC<{ icon: any, label: string, sub: string, color: string, onClick?: () => void, link?: string }> = ({ icon: Icon, label, sub, color, onClick, link }) => {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
    stone: "bg-stone-50 text-stone-700 border-stone-100 hover:bg-stone-100",
    green: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
  };

  const content = (
    <div className={clsx(
      "w-full text-left p-4 rounded-xl border transition-all active:scale-95 group",
      colorClasses[color] || colorClasses.stone
    )}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-sm">{label}</span>
      </div>
      <p className="text-xs opacity-70 leading-relaxed font-medium">{sub}</p>
    </div>
  );

  if (link) {
    return <a href={link} className="block w-full">{content}</a>;
  }

  return <button onClick={onClick} className="w-full text-left">{content}</button>;
};


