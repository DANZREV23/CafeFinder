import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Coffee
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

interface QualityIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR';
  entityType: string;
  entityId: string;
  entityName: string;
  message: string;
}

export const AdminContentQualityPage: React.FC = () => {
  const { t } = useI18n();
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/editorial/quality');
      const data = await response.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (error) {
      toast.error('Failed to run quality checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const filteredIssues = filter === 'ALL' 
    ? issues 
    : issues.filter(issue => issue.severity === filter);

  const stats = {
    total: issues.length,
    errors: issues.filter(i => i.severity === 'ERROR').length,
    warnings: issues.filter(i => i.severity === 'WARNING').length,
    info: issues.filter(i => i.severity === 'INFO').length,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR': return <AlertCircle className="text-red-500" size={18} />;
      case 'WARNING': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'INFO': return <Info className="text-blue-500" size={18} />;
      default: return null;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Cafe': return <Coffee size={16} />;
      case 'BlogPost': return <FileText size={16} />;
      default: return <ChevronRight size={16} />;
    }
  };

  const getEditLink = (issue: QualityIssue) => {
    switch (issue.entityType) {
      case 'Cafe': return `/admin/cafes/${issue.entityId}`;
      case 'BlogPost': return `/admin/blog/${issue.entityId}/edit`;
      case 'CuratedList': return `/admin/lists/${issue.entityId}/edit`;
      default: return '#';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">{t("admin.contentQuality")}</h1>
          <p className="text-stone-500">Diagnostic dashboard for content integrity and SEO completeness.</p>
        </div>
        <Button variant="primary" size="sm" onClick={fetchIssues} disabled={loading}>
          <RefreshCw size={18} className={clsx("mr-2", loading && "animate-spin")} />
          Run Checks
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Total Issues</p>
            <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
          </div>
          <div className="p-2 bg-stone-100 rounded-lg text-stone-400">
            <ShieldCheck size={24} />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Errors</p>
            <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Warnings</p>
            <p className="text-2xl font-bold text-amber-600">{stats.warnings}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div>
            <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Info</p>
            <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap gap-2">
          {(['ALL', 'ERROR', 'WARNING', 'INFO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                filter === f 
                  ? "bg-stone-900 text-white" 
                  : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
              )}
            >
              {f === 'ALL' ? 'All Issues' : `${f.charAt(0)}${f.slice(1).toLowerCase()}s`}
            </button>
          ))}
        </div>

        <div className="divide-y divide-stone-200">
          {loading ? (
            <div className="p-12 text-center text-stone-400">
              <RefreshCw className="mx-auto animate-spin mb-4" size={32} />
              <p>Scanning content...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <ShieldCheck className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-stone-900">No issues found</h3>
              <p>Your content quality is looking great!</p>
            </div>
          ) : (
            filteredIssues.map((issue, idx) => (
              <div key={`${issue.entityId}-${idx}`} className="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      {getEntityIcon(issue.entityType)}
                      {issue.entityType}
                    </Badge>
                    <span className="text-sm font-semibold text-stone-900 truncate">{issue.entityName}</span>
                  </div>
                  <p className="text-sm text-stone-600">{issue.message}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={getEditLink(issue)} className="flex items-center gap-2">
                    Fix
                    <ExternalLink size={14} />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
