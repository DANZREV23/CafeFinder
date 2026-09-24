// client/src/pages/admin/system/MaintenanceJobs.tsx
import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  History,
  ShieldCheck,
  Search,
  Database,
  Mail,
  Trash2,
  HardDrive
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

const JOB_CONFIG = [
  { id: 'backup-database', label: 'Database Backup', icon: Database, color: 'blue', description: 'Create a full Prisma/JSON fallback backup of the database.' },
  { id: 'backup-uploads', label: 'Uploads Backup', icon: HardDrive, color: 'blue', description: 'Compress and archive the shared uploads directory.' },
  { id: 'verify-backups', label: 'Verify Backups', icon: ShieldCheck, color: 'blue', description: 'Perform integrity checks on all existing backup files.' },
  { id: 'system-cleanup', label: 'System Cleanup', icon: Trash2, color: 'stone', description: 'Clean up expired sessions, notifications, logs, and analytics.' },
  { id: 'data-integrity-scan', label: 'Integrity Scan', icon: ShieldCheck, color: 'purple', description: 'Scan for missing media and orphaned records without repairing.' },
  { id: 'recalculate-ratings', label: 'Recalculate Ratings', icon: RefreshCw, color: 'amber', description: 'Recalculate average ratings and review counts for all cafes.' },
  { id: 'cleanup-missing-media', label: 'Repair Missing Media', icon: AlertCircle, color: 'red', description: 'Delete database records pointing to non-existent files.' },
  { id: 'cleanup-orphaned-media', label: 'Delete Orphaned Files', icon: AlertCircle, color: 'red', description: 'Permanently delete files on disk that are not referenced in the database.' },
  { id: 'repair-orphaned-reviews', label: 'Repair Orphaned Reviews', icon: ShieldCheck, color: 'amber', description: 'Remove reviews belonging to deleted cafes or users.' },
  { id: 'release-cleanup', label: 'Release Cleanup', icon: History, color: 'stone', description: 'Clean up old deployment release directories to save disk space.' },
  { id: 'certificate-monitoring', label: 'SSL Certificate Monitor', icon: ShieldCheck, color: 'stone', description: 'Check the status and expiration of the system SSL certificate.' },
];

export const MaintenanceJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [jobsRes, runsRes] = await Promise.all([
        adminService.getMaintenanceJobs(),
        adminService.getJobRuns(15)
      ]);
      
      if (jobsRes.success) setJobs(jobsRes.data);
      if (runsRes.success) setRuns(runsRes.data);
    } catch (err) {
      console.error('Failed to fetch job data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunJob = async (jobName: string) => {
    if (runningJob) return;
    
    // Explicit confirmation for red jobs (destructive)
    const config = JOB_CONFIG.find(c => c.id === jobName);
    if (config?.color === 'red') {
      if (!window.confirm(`Are you sure you want to run "${config.label}"? This action may be destructive.`)) {
        return;
      }
    }

    setRunningJob(jobName);
    try {
      const res = await adminService.runJob(jobName);
      // More robust check for res and res.data
      if (res && res.success && res.data) {
        const executionId = res.data.executionId;
        const shortId = typeof executionId === 'string' ? executionId.substring(0, 8) : 'N/A';
        toast.success(`Job "${jobName}" started (Execution: ${shortId})`);
        fetchData(true);
      } else {
        toast.error('Failed to start job: Invalid response from server');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error running job');
    } finally {
      setRunningJob(null);
    }
  };

  if (loading && jobs.length === 0) {
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
          <h1 className="text-3xl font-bold text-stone-900">Maintenance Jobs</h1>
          <p className="text-stone-500 mt-1">Automated background tasks and operational health</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Jobs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-stone-700" />
            <h2 className="text-xl font-bold text-stone-900">Registered Jobs</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {JOB_CONFIG.map((config) => {
              const lastRun = jobs.find(j => j.jobName === config.id);
              const isRunning = runningJob === config.id || lastRun?.status === 'RUNNING';

              return (
                <div key={config.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        config.color === 'blue' && "bg-blue-50 text-blue-600",
                        config.color === 'stone' && "bg-stone-50 text-stone-600",
                        config.color === 'purple' && "bg-purple-50 text-purple-600",
                        config.color === 'amber' && "bg-amber-50 text-amber-600",
                        config.color === 'red' && "bg-red-50 text-red-600",
                      )}>
                        <config.icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-stone-900 truncate">{config.label}</h3>
                          {lastRun && (
                            <span className={clsx(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                              lastRun.status === 'SUCCEEDED' && "bg-green-100 text-green-700",
                              lastRun.status === 'FAILED' && "bg-red-100 text-red-700",
                              lastRun.status === 'RUNNING' && "bg-blue-100 text-blue-700 animate-pulse",
                              lastRun.status === 'SKIPPED' && "bg-stone-100 text-stone-600"
                            )}>
                              {lastRun.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 line-clamp-2 mb-3">{config.description}</p>
                        {lastRun && (
                          <div className="flex items-center gap-4 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {formatDistanceToNow(new Date(lastRun.startedAt), { addSuffix: true })}
                            </span>
                            {lastRun.durationMs && (
                              <span className="flex items-center gap-1">
                                <History className="w-3 h-3" />
                                {lastRun.durationMs}ms
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunJob(config.id)}
                      disabled={isRunning}
                      className={clsx(
                        "p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50",
                        isRunning ? "bg-stone-100 text-stone-400" : "bg-stone-900 text-white hover:bg-stone-800 shadow-md"
                      )}
                      title="Run job now"
                    >
                      {isRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-stone-700" />
            <h2 className="text-xl font-bold text-stone-900">Execution History</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Job / Execution ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-900 text-sm">{run.jobName}</span>
                          <span className="text-[10px] font-mono text-stone-400 mt-0.5">
                            {typeof run.executionId === 'string' ? run.executionId.substring(0, 12) : 'N/A'}
                          </span>
                          <span className="text-[10px] text-stone-500 mt-1">{formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {run.status === 'SUCCEEDED' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {run.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-500" />}
                          {run.status === 'RUNNING' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                          {run.status === 'SKIPPED' && <AlertCircle className="w-4 h-4 text-stone-400" />}
                          <span className={clsx(
                            "text-xs font-bold uppercase",
                            run.status === 'SUCCEEDED' && "text-green-600",
                            run.status === 'FAILED' && "text-red-600",
                            run.status === 'RUNNING' && "text-blue-600",
                            run.status === 'SKIPPED' && "text-stone-500"
                          )}>
                            {run.status}
                          </span>
                        </div>
                        {run.errorMessage && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={run.errorMessage}>
                            {run.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-stone-700">
                            {run.processedCount > 0 ? `${run.processedCount} items` : 'N/A'}
                          </span>
                          {run.durationMs && (
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              Took {run.durationMs}ms
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-stone-400">
                        No recent job executions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
