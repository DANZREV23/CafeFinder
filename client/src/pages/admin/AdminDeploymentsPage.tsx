// client/src/pages/admin/AdminDeploymentsPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Rocket, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  Database, 
  ShieldCheck, 
  Terminal, 
  FileCode,
  Info,
  ChevronRight,
  RotateCcw,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export const AdminDeploymentsPage: React.FC = () => {
  const [release, setRelease] = useState<any>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<any | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [relRes, depRes] = await Promise.all([
        adminService.getReleaseMetadata(),
        adminService.getDeployments({ page: 1, limit: 15 }),
      ]);

      if (relRes.success) setRelease(relRes.data);
      if (depRes.success) {
        setDeployments(depRes.data.deployments);
        setPagination(depRes.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load deployment data:', err);
      toast.error('Could not load deployment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Succeeded
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'ROLLED_BACK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5" />
            Rolled Back
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {status}
          </span>
        );
    }
  };

  if (loading && !release) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Rocket className="w-8 h-8 text-amber-600" />
            Deployment & Release Management
          </h1>
          <p className="text-stone-500 mt-1">
            Production release tracking, migration safety, health verification, and rollback control
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Active Release Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">CafeFinder Production</h2>
                <span className="bg-stone-900 text-stone-100 font-mono text-xs px-2.5 py-0.5 rounded-md font-semibold">
                  v{release?.version || '1.0.0'}
                </span>
              </div>
              <p className="text-sm text-stone-500 mt-0.5">Active Release Manifest & Operational Environment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Production Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Environment</span>
            <span className="text-sm font-bold text-stone-900 capitalize">{release?.environment || 'Production'}</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Build / Commit</span>
            <span className="text-sm font-mono font-bold text-stone-900">{release?.buildId || 'latest'}</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Node.js Runtime</span>
            <span className="text-sm font-bold text-stone-900">{release?.nodeVersion || process.version}</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Uptime</span>
            <span className="text-sm font-bold text-stone-900">{formatUptime(release?.uptime || 0)}</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Prisma Schema</span>
            <span className="text-sm font-mono font-bold text-stone-900 truncate block" title={release?.schemaVersion}>
              {release?.schemaVersion || 'synchronized'}
            </span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs text-stone-500 block font-medium">Built At</span>
            <span className="text-sm font-bold text-stone-900">
              {release?.buildTime ? formatDistanceToNow(new Date(release.buildTime), { addSuffix: true }) : 'Recent'}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Pipeline Checklist */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-md border border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Automated Deployment Pipeline Workflow</h3>
          </div>
          <span className="text-xs bg-stone-800 text-stone-400 px-2.5 py-1 rounded-md font-mono">
            npm run deploy
          </span>
        </div>
        <p className="text-xs text-stone-400 mb-6">
          Every production release enforces a strict, atomic 9-step pipeline preventing broken releases and database corruption.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1. Lock & Preflight</span>
            </div>
            <p className="text-stone-300">
              Acquires filesystem lock (<code className="font-mono text-[11px] text-amber-300">.deployment.lock</code>). Validates Node 20+, environment credentials, and directory write permissions.
            </p>
          </div>

          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Database className="w-4 h-4 text-blue-400" />
              <span>2. Pre-Deploy Backup & Build</span>
            </div>
            <p className="text-stone-300">
              Executes full database backup snapshot before touching migrations. Compiles Vite client and Node server bundle.
            </p>
          </div>

          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. Migration Safety</span>
            </div>
            <p className="text-stone-300">
              Scans Prisma migrations for dangerous patterns (<code className="font-mono text-[11px]">DROP TABLE/COLUMN</code>). Applies <code className="font-mono text-[11px]">prisma migrate deploy</code>.
            </p>
          </div>

          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Server className="w-4 h-4 text-purple-400" />
              <span>4. Graceful Restart</span>
            </div>
            <p className="text-stone-300">
              Restarts application via systemd. Node entrypoint cleanly flushes active HTTP requests and closes Prisma pool.
            </p>
          </div>

          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>5. Health & Smoke Tests</span>
            </div>
            <p className="text-stone-300">
              Verifies <code className="font-mono text-[11px]">/api/live</code>, <code className="font-mono text-[11px]">/api/ready</code>, <code className="font-mono text-[11px]">/api/health</code>, public cafe search, and email queue.
            </p>
          </div>

          <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>6. Retention & Rollback</span>
            </div>
            <p className="text-stone-300">
              Retains 3 past releases for atomic rollback (<code className="font-mono text-[11px]">npm run rollback</code>). Cleans up older releases automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Deployment History</h2>
            <p className="text-xs text-stone-500 mt-0.5">Audit log of all production deployments, migrations, and rollbacks</p>
          </div>
          {pagination && (
            <span className="text-xs text-stone-500 font-medium">
              Total {pagination.total} release record(s)
            </span>
          )}
        </div>

        {deployments.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Clock className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="font-medium">No recorded deployments yet</p>
            <p className="text-xs text-stone-400 mt-1">Deployments executed via automated scripts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deployment ID</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Migration</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {deployments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(dep.status)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-stone-900">
                      {dep.deploymentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-900">v{dep.version}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-stone-600">
                      {dep.migrationStatus || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {dep.healthStatus ? (
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[11px] font-semibold",
                          dep.healthStatus === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        )}>
                          {dep.healthStatus}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500 whitespace-nowrap">
                      {format(new Date(dep.startedAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDeployment(dep)}
                        className="text-amber-700 hover:text-amber-800 font-medium text-xs inline-flex items-center gap-1 hover:underline"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Rollback Warning Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-base text-amber-950">Database Rollback Architectural Warning</h4>
            <p className="text-amber-900/90 leading-relaxed">
              Application code rollback does <strong>not</strong> automatically mean database rollback. If a previous migration introduced destructive schema changes (e.g. dropped columns or modified constraints), rolling back application code alone may cause runtime errors.
            </p>
            <p className="text-amber-900/90 leading-relaxed">
              Always use <strong>expand and contract (additive)</strong> database migration patterns so the previous application code continues to function while new releases deploy.
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Deployment Details</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{selectedDeployment.deploymentId}</p>
              </div>
              <button
                onClick={() => setSelectedDeployment(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <span className="text-stone-500 block font-sans font-semibold text-xs mb-1">Status & Timeline</span>
                <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-stone-700">
                  <div>Status: {selectedDeployment.status}</div>
                  <div>Version: v{selectedDeployment.version}</div>
                  <div>Started: {selectedDeployment.startedAt}</div>
                  <div>Completed: {selectedDeployment.completedAt || 'In progress or aborted'}</div>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block font-sans font-semibold text-xs mb-1">Execution Details</span>
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedDeployment.details || {}, null, 2)}
                </pre>
              </div>
            </div>
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setSelectedDeployment(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
