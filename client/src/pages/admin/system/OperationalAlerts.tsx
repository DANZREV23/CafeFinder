// client/src/pages/admin/system/OperationalAlerts.tsx
import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Check, 
  Eye,
  Clock,
  MoreVertical,
  XCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

interface OperationalAlert {
  id: string;
  key: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  source: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  count: number;
  details: any;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: { name: string };
  resolvedAt?: string;
}

export const OperationalAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<{ status?: string; severity?: string }>({ status: 'OPEN' });

  const fetchAlerts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await adminService.getAlerts(filter);
      if (response.success && response.data) {
        setAlerts(response.data as OperationalAlert[]);
      }
    } catch (err: any) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(), 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await adminService.acknowledgeAlert(id);
      if (res.success) {
        toast.success('Alert acknowledged');
        fetchAlerts();
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await adminService.resolveAlert(id);
      if (res.success) {
        toast.success('Alert resolved');
        fetchAlerts();
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Operational Alerts</h1>
            <p className="text-stone-500 mt-1">System-wide monitoring and incident tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500"
            title="Refresh"
          >
            <RefreshCw className={clsx("w-5 h-5", refreshing && "animate-spin")} />
          </button>
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter({ ...filter, status: s })}
                className={clsx(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter.status === s ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setFilter({ ...filter, status: undefined })}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                !filter.status ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              ALL
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          <AnimatePresence mode="popLayout">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx(
                    "p-6 flex flex-col sm:flex-row gap-6 transition-colors",
                    alert.status === 'OPEN' ? "hover:bg-stone-50/50" : "opacity-75"
                  )}
                >
                  <div className="flex-shrink-0 pt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-grow space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                            alert.severity === 'CRITICAL' ? "bg-red-50 text-red-700" :
                            alert.severity === 'WARNING' ? "bg-amber-50 text-amber-700" :
                            "bg-blue-50 text-blue-700"
                          )}>
                            {alert.severity}
                          </span>
                          <span className="text-stone-400 text-xs font-mono">{alert.key}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-lg leading-tight">{alert.message}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400 font-medium">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
                        {alert.count > 1 && (
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                            Occurred {alert.count} times
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Source: <span className="font-semibold text-stone-700">{alert.source}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated: {formatDistanceToNow(new Date(alert.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {alert.status === 'ACKNOWLEDGED' && alert.acknowledgedBy && (
                      <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-2 text-xs">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-stone-500">
                          Acknowledged by <span className="font-bold text-stone-900">{alert.acknowledgedBy.name}</span> {formatDistanceToNow(new Date(alert.acknowledgedAt!), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2 items-end justify-center">
                    {alert.status === 'OPEN' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                    {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-50 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolve</span>
                      </button>
                    )}
                    {alert.status === 'RESOLVED' && (
                      <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        <Check className="w-4 h-4" />
                        <span>Resolved</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-stone-300" />
                </div>
                <h3 className="font-bold text-stone-900">All Systems Normal</h3>
                <p className="text-stone-500 text-sm mt-1">No active operational alerts found for this filter.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
