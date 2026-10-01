// client/src/pages/admin/DataIntegrity.tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw, 
  FileWarning, 
  Users, 
  Star, 
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  Trash2,
  Database,
  CalendarDays,
  Clock
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

interface IntegrityReport {
  cafes: {
    total: number;
    inconsistentRatings: number;
    invalidStatus: number;
    missingRequiredFields: number;
  };
  reviews: {
    total: number;
    orphaned: number;
    invalidRatings: number;
  };
  media: {
    total: number;
    missingFiles: number;
    orphanedFiles: number;
  };
  users: {
    total: number;
    invalidRoleStatus: number;
    staleSessions: number;
  };
  notifications: {
    total: number;
    brokenReferences: number;
  };
  timeSensitive?: {
    publishedEvents: number;
    upcomingEvents: number;
    expiredEvents: number;
    publishedSpecials: number;
    activeSpecials: number;
    expiredSpecials: number;
    pendingReview: number;
    invalidDateRanges: number;
    invalidTimezones: number;
    invalidRegistrationUrls: number;
  };
}

export const DataIntegrity: React.FC = () => {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ action: string; label: string; destructive?: boolean } | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDataIntegrityReport();
      setReport(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load integrity report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleActionClick = (action: string, label: string, destructive?: boolean) => {
    setPendingAction({ action, label, destructive });
  };

  const executeRepair = async () => {
    if (!pendingAction) return;
    const { action } = pendingAction;
    setPendingAction(null);

    try {
      setRepairing(action);
      let result;
      
      switch (action) {
        case 'repair-orphans':
          result = await adminService.repairOrphanedReviews();
          toast.success(`Repaired ${result.repairedCount} orphaned reviews`);
          break;
        case 'cleanup-sessions':
          await adminService.runCleanup();
          toast.success('Cleanup process started in background');
          break;
        case 'recalculate-all-ratings':
          result = await adminService.recalculateCafeRatings('all');
          toast.success(`Recalculated ratings. Fixed ${result.fixedCount} cafes.`);
          break;
        case 'cleanup-missing-media':
          result = await adminService.cleanupMedia('missing');
          toast.success(`Removed ${result.removedCount} missing media records.`);
          break;
        case 'cleanup-orphaned-media':
          result = await adminService.cleanupMedia('orphaned');
          toast.success(`Removed ${result.removedCount} orphaned files from disk.`);
          break;
        case 'find-duplicates':
          result = await adminService.findDuplicateCafes();
          toast.success(`Scan complete. Found ${result.length || 0} potential duplicate pairs.`);
          break;
        default:
          toast.error('Action not implemented yet');
      }
      
      // Refresh report after a short delay
      setTimeout(fetchReport, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Repair failed');
    } finally {
      setRepairing(null);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
        <p className="text-stone-500 font-medium">Analyzing data integrity...</p>
      </div>
    );
  }

  const sections = [
    {
      title: 'Cafes',
      icon: Database,
      color: 'blue',
      stats: [
        { label: 'Total Cafes', value: report?.cafes.total || 0, icon: Database },
        { label: 'Inconsistent Ratings', value: report?.cafes.inconsistentRatings || 0, icon: AlertTriangle, warning: (report?.cafes.inconsistentRatings || 0) > 0 },
        { label: 'Missing Fields', value: report?.cafes.missingRequiredFields || 0, icon: FileWarning, warning: (report?.cafes.missingRequiredFields || 0) > 0 },
      ],
      actions: [
        { label: 'Find Duplicates', action: 'find-duplicates' },
        { label: 'Recalculate All Ratings', action: 'recalculate-all-ratings' }
      ]
    },
    {
      title: 'Reviews',
      icon: Star,
      color: 'amber',
      stats: [
        { label: 'Total Reviews', value: report?.reviews.total || 0, icon: Star },
        { label: 'Orphaned Reviews', value: report?.reviews.orphaned || 0, icon: Trash2, warning: (report?.reviews.orphaned || 0) > 0 },
        { label: 'Invalid Ratings', value: report?.reviews.invalidRatings || 0, icon: AlertTriangle, warning: (report?.reviews.invalidRatings || 0) > 0 },
      ],
      actions: [
        { label: 'Repair Orphans', action: 'repair-orphans', destructive: true }
      ]
    },
    {
      title: 'Media',
      icon: ImageIcon,
      color: 'green',
      stats: [
        { label: 'Total Photos', value: report?.media.total || 0, icon: ImageIcon },
        { label: 'Missing Files', value: report?.media.missingFiles || 0, icon: FileWarning, warning: (report?.media.missingFiles || 0) > 0 },
        { label: 'Orphaned Files', value: report?.media.orphanedFiles || 0, icon: Trash2, warning: (report?.media.orphanedFiles || 0) > 0 },
      ],
      actions: [
        { label: 'Cleanup Missing', action: 'cleanup-missing-media', destructive: true },
        { label: 'Cleanup Orphaned', action: 'cleanup-orphaned-media', destructive: true }
      ]
    },
    {
      title: 'Users & Sessions',
      icon: Users,
      color: 'purple',
      stats: [
        { label: 'Total Users', value: report?.users.total || 0, icon: Users },
        { label: 'Stale Sessions', value: report?.users.staleSessions || 0, icon: RefreshCcw, warning: (report?.users.staleSessions || 0) > 0 },
      ],
      actions: [
        { label: 'Cleanup Sessions', action: 'cleanup-sessions' }
      ]
    },
    {
      title: 'Events & Specials',
      icon: CalendarDays,
      color: 'green',
      stats: [
        { label: 'Upcoming Events', value: report?.timeSensitive?.upcomingEvents || 0, icon: CalendarDays },
        { label: 'Active Specials', value: report?.timeSensitive?.activeSpecials || 0, icon: Star },
        { label: 'Expired Events', value: report?.timeSensitive?.expiredEvents || 0, icon: Clock, warning: (report?.timeSensitive?.expiredEvents || 0) > 0 },
        { label: 'Expired Specials', value: report?.timeSensitive?.expiredSpecials || 0, icon: Clock, warning: (report?.timeSensitive?.expiredSpecials || 0) > 0 },
        { label: 'Pending Review', value: report?.timeSensitive?.pendingReview || 0, icon: FileWarning },
        { label: 'Invalid Schedules', value: report?.timeSensitive?.invalidDateRanges || 0, icon: AlertTriangle, warning: (report?.timeSensitive?.invalidDateRanges || 0) > 0 },
        { label: 'Invalid Timezones', value: report?.timeSensitive?.invalidTimezones || 0, icon: AlertTriangle, warning: (report?.timeSensitive?.invalidTimezones || 0) > 0 },
        { label: 'Unsafe Registration URLs', value: report?.timeSensitive?.invalidRegistrationUrls || 0, icon: AlertTriangle, warning: (report?.timeSensitive?.invalidRegistrationUrls || 0) > 0 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
            Data Integrity Dashboard
          </h1>
          <p className="text-stone-500">Diagnose and repair application data consistency issues.</p>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-stone-700 font-medium disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${section.color}-50 text-${section.color}-600`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-stone-900">{section.title}</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Monitored
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                {section.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-stone-50/50">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-4 h-4 ${stat.warning ? 'text-red-500' : 'text-stone-400'}`} />
                      <span className="text-sm text-stone-600">{stat.label}</span>
                    </div>
                    <span className={`font-bold ${stat.warning ? 'text-red-600' : 'text-stone-900'}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {section.actions && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {section.actions.map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => handleActionClick(btn.action, btn.label, btn.destructive)}
                      disabled={repairing !== null}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        btn.destructive
                          ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {repairing === btn.action ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Administrative Warning</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Repair operations directly modify production data. Always ensure you have a verified backup
            before performing destructive repairs like "Repair Orphans" or "Reset Ratings".
            All maintenance actions are logged in the <strong>Activity Log</strong> for auditing purposes.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${pendingAction.destructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Confirm Operation</h3>
                <p className="text-xs text-stone-500">Data Integrity Maintenance</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Are you sure you want to execute <strong className="text-stone-900">{pendingAction.label}</strong>?
              {pendingAction.destructive ? (
                <span className="block mt-2 text-red-600 font-medium">
                  This operation may remove or permanently alter database records.
                </span>
              ) : (
                <span className="block mt-2 text-stone-500">
                  This process will run in the background and reconcile system data.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={repairing !== null}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRepair}
                disabled={repairing !== null}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
                  pendingAction.destructive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {repairing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
