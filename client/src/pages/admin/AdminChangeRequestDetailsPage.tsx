import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Coffee, User, Calendar, Info, MapPin, Phone, Globe, Instagram, Facebook } from 'lucide-react';
import { adminChangeRequestService } from '../../services/adminChangeRequestService';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function AdminChangeRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      adminChangeRequestService.getRequest(id)
        .then(r => setRequest(r.data))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const approve = async () => {
    if (!id || !window.confirm('Approve these cafe changes?')) return;
    try {
      await adminChangeRequestService.approve(id);
      navigate('/admin/change-requests');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const reject = async () => {
    if (!id) return;
    const reason = window.prompt('Rejection reason (at least 5 characters):');
    if (!reason || reason.trim().length < 5) return;
    try {
      await adminChangeRequestService.reject(id, reason.trim());
      navigate('/admin/change-requests');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-24 mb-4" />
        <div className="h-8 bg-stone-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-stone-200 rounded w-1/4 mb-8" />
        <div className="h-64 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-4xl space-y-6">
        <Link to="/admin/change-requests" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">Request not found</h3>
          <p className="text-stone-500">{error || "The requested change request could not be found."}</p>
        </div>
      </div>
    );
  }

  const payload = request.payload as Record<string, any>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/admin/change-requests" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>
        <div className="flex items-center gap-2">
          <AdminStatusBadge type="submission" status={request.status} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-stone-50 border-b border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded">
              {request.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-stone-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(request.createdAt), 'MMMM d, yyyy h:mm a')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">{request.cafe.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-4 h-4 text-stone-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Requester</p>
                <p className="text-sm font-medium">{request.requestedBy.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <Coffee className="w-4 h-4 text-stone-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Cafe ID</p>
                <p className="text-sm font-medium font-mono">{request.cafeId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-stone-900">Requested Changes</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(payload).map(([key, value]) => (
                <div key={key} className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                  <div className="sm:w-1/3">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                  <div className="flex-1">
                    {typeof value === 'object' && value !== null ? (
                      <pre className="text-sm text-stone-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-stone-200">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-stone-800 font-medium">
                        {value === null || value === '' ? <span className="text-stone-400 italic">No value / Removed</span> : value.toString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {request.reason && (
            <section className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="text-sm font-bold text-amber-800 mb-1">Owner's Reason for Change:</h3>
              <p className="text-sm text-amber-900">{request.reason}</p>
            </section>
          )}

          {request.status === 'REJECTED' && request.adminNotes && (
            <section className="p-4 bg-red-50 rounded-xl border border-red-100">
              <h3 className="text-sm font-bold text-red-800 mb-1">Rejection Reason:</h3>
              <p className="text-sm text-red-900">{request.adminNotes}</p>
            </section>
          )}
        </div>

        {request.status === 'PENDING' && (
          <div className="p-6 sm:p-8 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-3">
            <button 
              onClick={approve}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve Changes
            </button>
            <button 
              onClick={reject}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all"
            >
              <XCircle className="w-5 h-5" />
              Reject Request
            </button>
          </div>
        )}
      </div>

      {request.reviewedBy && (
        <div className="p-4 flex items-center gap-3 text-xs text-stone-400">
          <Clock className="w-4 h-4" />
          <span>
            Reviewed by {request.reviewedBy.name || 'Admin'} on {format(new Date(request.reviewedAt), 'PPP p')}
          </span>
        </div>
      )}
    </div>
  );
}
