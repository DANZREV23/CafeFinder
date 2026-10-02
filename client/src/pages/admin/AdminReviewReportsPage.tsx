import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Flag, 
  CheckCircle, 
  XCircle, 
  EyeOff, 
  RotateCcw, 
  Loader2, 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  Image, 
  Wrench, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import reviewService, { ReviewReport } from '@/services/reviewService';

export default function AdminReviewReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'photos' | 'responses' | 'integrity'>('reports');
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Photos tab state
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Responses tab state
  const [responses, setResponses] = useState<any[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // Integrity tab state
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<any[] | null>(null);
  const [repairResult, setRepairResult] = useState<any | null>(null);

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reviewService.getReports({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setReports(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    setPhotosLoading(true);
    try {
      const res = await reviewService.getReviewPhotosAdmin({ page: 1, limit: 30 });
      if (res.success) {
        setPhotos(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load photos' });
    } finally {
      setPhotosLoading(false);
    }
  };

  const fetchResponses = async () => {
    setResponsesLoading(true);
    try {
      const res = await reviewService.getReviewResponsesAdmin({ page: 1, limit: 20 });
      if (res.success) {
        setResponses(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load responses' });
    } finally {
      setResponsesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'photos') {
      fetchPhotos();
    } else if (activeTab === 'responses') {
      fetchResponses();
    }
  }, [activeTab, statusFilter, page]);

  const handleResolve = async (reportId: string, actionTaken: string) => {
    setActionLoadingId(reportId);
    setFeedback(null);
    try {
      await reviewService.resolveReport(reportId, actionTaken);
      setFeedback({ type: 'success', message: `Report processed with action: ${actionTaken}` });
      fetchReports();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process report' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismiss = async (reportId: string) => {
    setActionLoadingId(reportId);
    setFeedback(null);
    try {
      await reviewService.dismissReport(reportId);
      setFeedback({ type: 'success', message: 'Report dismissed successfully' });
      fetchReports();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to dismiss report' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePhotoStatus = async (photoId: string, status: string) => {
    setActionLoadingId(photoId);
    try {
      await reviewService.updatePhotoStatus(photoId, status);
      setFeedback({ type: 'success', message: `Photo status updated to ${status}` });
      fetchPhotos();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update photo' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResponseStatus = async (responseId: string, status: string) => {
    setActionLoadingId(responseId);
    try {
      await reviewService.updateResponseStatus(responseId, status);
      setFeedback({ type: 'success', message: `Response status updated to ${status}` });
      fetchResponses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update response' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckIntegrity = async () => {
    setIntegrityLoading(true);
    setDiscrepancies(null);
    setRepairResult(null);
    try {
      const res = await reviewService.checkRatingsIntegrity();
      if (res.success) {
        setDiscrepancies(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to check integrity' });
    } finally {
      setIntegrityLoading(false);
    }
  };

  const handleRepairRatings = async () => {
    if (!confirm('Recalculate and repair all cafe rating aggregates from approved reviews?')) return;
    setRepairLoading(true);
    try {
      const res = await reviewService.repairRatings();
      if (res.success) {
        setRepairResult(res.data);
        setDiscrepancies([]);
        setFeedback({ type: 'success', message: `Successfully repaired ${res.data.repairedCount} cafe ratings!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to repair ratings' });
    } finally {
      setRepairLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Community & Review Moderation</h1>
          <p className="text-stone-500 text-sm">Moderate reported reviews, audit user photos, verify owner responses, and run rating integrity diagnostics.</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-brand-border gap-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Review Reports</span>
            {totalCount > 0 && activeTab === 'reports' && (
              <span className="text-xs bg-brand-coffee text-white px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Review Photos</span>
          </button>

          <button
            onClick={() => setActiveTab('responses')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'responses'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Owner Responses</span>
          </button>

          <button
            onClick={() => setActiveTab('integrity')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'integrity'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Rating Diagnostics & Repair</span>
          </button>
        </div>

        {/* Global Feedback */}
        {feedback && (
          <div className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="font-bold text-xs uppercase hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Review Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-stone-500">Status:</span>
              {['PENDING', 'RESOLVED', 'DISMISSED', ''].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? 'bg-brand-coffee text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {s || 'All Reports'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-coffee" />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                <p className="text-sm text-stone-500">No review reports in this queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 bg-white border border-brand-border rounded-2xl space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 font-bold border-red-200 text-xs">
                          {report.reason.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-stone-500">
                          Reported on {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <Badge className={
                        report.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                      }>
                        {report.status}
                      </Badge>
                    </div>

                    {/* Reported Review Preview */}
                    {report.reviewPreview && (
                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between text-stone-600">
                          <span className="font-bold text-stone-800">
                            {report.reviewPreview.cafeName || 'Cafe'} — Review by {report.reviewPreview.reviewerName || 'Customer'}
                          </span>
                          <span className="font-semibold text-amber-600">{report.reviewPreview.overallRating}★ ({report.reviewPreview.status})</span>
                        </div>
                        <p className="text-stone-700 italic">
                          "{report.reviewPreview.comment}"
                        </p>
                      </div>
                    )}

                    {report.description && (
                      <div className="text-xs text-stone-600">
                        <span className="font-bold text-stone-700">Reporter's Note:</span> {report.description}
                      </div>
                    )}

                    {/* Actions if PENDING */}
                    {report.status === 'PENDING' && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === report.id}
                          onClick={() => handleDismiss(report.id)}
                          className="text-stone-600 hover:bg-stone-100 text-xs"
                        >
                          Dismiss Report
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === report.id}
                          onClick={() => handleResolve(report.id, 'HIDE_REVIEW')}
                          className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
                        >
                          Hide Review
                        </Button>
                        <Button
                          size="sm"
                          disabled={actionLoadingId === report.id}
                          onClick={() => handleResolve(report.id, 'REMOVE_REVIEW')}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                          Remove Review
                        </Button>
                      </div>
                    )}

                    {/* Resolved info */}
                    {report.status !== 'PENDING' && (
                      <div className="text-xs text-stone-500 pt-1">
                        Processed on {report.resolvedAt ? format(new Date(report.resolvedAt), 'MMM dd, yyyy') : 'N/A'} by {report.resolvedByName || 'Admin'} ({report.actionTaken || 'N/A'})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Review Photos */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {photosLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-coffee" />
              </div>
            ) : photos.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                <p className="text-sm text-stone-500">No review photos found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white border border-brand-border rounded-2xl p-3 space-y-2 shadow-2xs">
                    <div className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <img src={photo.url} alt="Review" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs text-stone-600 truncate">
                      <strong>{photo.review?.cafe?.name || 'Cafe'}</strong> by {photo.review?.user?.name || 'User'}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <Badge className={photo.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {photo.status}
                      </Badge>
                      <div className="flex gap-1">
                        {photo.status !== 'APPROVED' ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePhotoStatus(photo.id, 'APPROVED')}>
                            Approve
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handlePhotoStatus(photo.id, 'HIDDEN')}>
                            Hide
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Owner Responses */}
        {activeTab === 'responses' && (
          <div className="space-y-4">
            {responsesLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-coffee" />
              </div>
            ) : responses.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                <p className="text-sm text-stone-500">No owner responses found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((resp) => (
                  <div key={resp.id} className="bg-white border border-brand-border rounded-2xl p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                      <span className="font-bold text-stone-800">
                        {resp.review?.cafe?.name || 'Cafe'} — Response by {resp.owner?.name || 'Owner'}
                      </span>
                      <Badge className={resp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}>
                        {resp.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed italic bg-brand-cream/20 p-3 rounded-xl">
                      "{resp.content}"
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {resp.status === 'APPROVED' ? (
                        <Button size="sm" variant="outline" className="text-xs text-amber-700 border-amber-200" onClick={() => handleResponseStatus(resp.id, 'HIDDEN')}>
                          Hide Response
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs text-emerald-700 border-emerald-200" onClick={() => handleResponseStatus(resp.id, 'APPROVED')}>
                          Restore Response
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Rating Diagnostics & Repair */}
        {activeTab === 'integrity' && (
          <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-brand-charcoal">
                Rating Calculation & Data Integrity Tool
              </h3>
              <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
                Verifies that all stored cafe ratings (`ratingAverage`, `reviewCount`) strictly reflect approved customer reviews. You can run diagnostics to audit discrepancies, and perform an audited repair operation.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={integrityLoading}
                onClick={handleCheckIntegrity}
                className="text-xs font-semibold"
              >
                {integrityLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />}
                Run Diagnostic Audit
              </Button>

              <Button
                variant="primary"
                disabled={repairLoading}
                onClick={handleRepairRatings}
                className="text-xs font-semibold bg-brand-coffee text-white hover:bg-brand-coffee-dark"
              >
                {repairLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wrench className="w-4 h-4 mr-1" />}
                Repair Discrepancies
              </Button>
            </div>

            {discrepancies && (
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                  Audit Results: {discrepancies.length === 0 ? 'All 100% In Sync' : `${discrepancies.length} Mismatches Found`}
                </h4>
                {discrepancies.length === 0 ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All cafe rating averages and review counts are accurate and in transactional sync with approved reviews.</span>
                  </div>
                ) : (
                  <div className="border border-brand-border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-700">
                        <tr>
                          <th className="p-3">Cafe</th>
                          <th className="p-3">Current Rating</th>
                          <th className="p-3">Expected Rating</th>
                          <th className="p-3">Current Count</th>
                          <th className="p-3">Expected Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discrepancies.map((d) => (
                          <tr key={d.cafeId} className="border-b border-stone-100 hover:bg-stone-50">
                            <td className="p-3 font-semibold">{d.name}</td>
                            <td className="p-3 text-red-600 font-bold">{d.current.ratingAverage}</td>
                            <td className="p-3 text-emerald-600 font-bold">{d.expected.ratingAverage}</td>
                            <td className="p-3 text-red-600 font-bold">{d.current.reviewCount}</td>
                            <td className="p-3 text-emerald-600 font-bold">{d.expected.reviewCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
