// client/src/pages/admin/AdminContentQualityPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Send, 
  Calendar,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { fetchApi } from '@/services/api';
import toast from 'react-hot-toast';

interface QualityIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR';
  entityType: string;
  entityId: string;
  entityName: string;
  message: string;
}

export const AdminContentQualityPage: React.FC = () => {
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchQualityIssues = async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: QualityIssue[] }>('/admin/editorial/quality');
      if (res.success && Array.isArray(res.data)) {
        setIssues(res.data);
      } else {
        setIssues([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to run content quality checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityIssues();
  }, []);

  const handleTriggerScheduled = async () => {
    setPublishing(true);
    try {
      const res = await fetchApi<{ success: boolean; data: any }>('/admin/editorial/publish-scheduled', {
        method: 'POST',
      });
      if (res.success) {
        toast.success(
          `Published ${res.data?.blogPosts ?? 0} blog posts and ${res.data?.curatedLists ?? 0} curated lists.`
        );
        await fetchQualityIssues();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger scheduled publishing');
    } finally {
      setPublishing(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <AlertCircle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Content Quality & Editorial</h1>
          <p className="text-stone-500 mt-1">
            Automated audits for incomplete cafe profiles, missing media, and scheduled publication triggers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchQualityIssues();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Audit
          </button>
          <button
            onClick={handleTriggerScheduled}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            {publishing ? 'Publishing...' : 'Publish Scheduled Now'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Audit Flags</span>
          <div className="text-3xl font-bold text-stone-900 mt-2">{issues.length}</div>
        </div>
        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Errors (Needs Action)</span>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {issues.filter((i) => i.severity === 'ERROR').length}
          </div>
        </div>
        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Warnings</span>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {issues.filter((i) => i.severity === 'WARNING').length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-xl shadow-sm text-sm">
        <span className="font-semibold text-stone-700">Filter Severity:</span>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="all">All ({issues.length})</option>
          <option value="ERROR">Errors ({issues.filter((i) => i.severity === 'ERROR').length})</option>
          <option value="WARNING">Warnings ({issues.filter((i) => i.severity === 'WARNING').length})</option>
          <option value="INFO">Info ({issues.filter((i) => i.severity === 'INFO').length})</option>
        </select>
      </div>

      {/* Issues Table / List */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-stone-500">Scanning content records...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-900">Zero Content Issues Found</h3>
            <p className="text-sm text-stone-500 mt-1">
              All published cafes, articles, and curated lists meet editorial quality guidelines.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    {getSeverityBadge(issue.severity)}
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {issue.entityType}
                    </span>
                    <span className="font-semibold text-stone-900 text-sm">{issue.entityName}</span>
                  </div>
                  <p className="text-sm text-stone-600">{issue.message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {issue.entityType === 'Cafe' && (
                    <a
                      href={`/cafes/${issue.entityId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Cafe
                    </a>
                  )}
                  {issue.entityType === 'BlogPost' && (
                    <a
                      href={`/admin/blog`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Edit Post
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
