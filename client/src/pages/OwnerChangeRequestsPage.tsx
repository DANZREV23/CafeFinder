import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';

export default function OwnerChangeRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    ownerCafeService.getChangeRequests(id)
      .then(r => setRequests(r.data))
      .catch(e => setMessage(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) {
      ownerService.getOwnedCafe(id)
        .then(r => setName(r.data.name))
        .catch(e => setMessage(e.message));
      load();
    }
  }, [id]);

  const cancel = async (requestId: string) => {
    try {
      await ownerCafeService.cancelChangeRequest(requestId);
      load();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to={`/owner/cafes/${id}`} className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to {name || 'cafe'}
            </Link>
            <h1 className="mt-4 text-4xl font-serif font-bold text-brand-charcoal">Change requests</h1>
            <p className="mt-2 text-brand-muted">Track and manage your requests for cafe information updates.</p>
          </div>
          <Link 
            to={`/owner/cafes/${id}/change-requests/new`}
            className="inline-flex items-center justify-center rounded-xl bg-brand-coffee px-6 py-3 font-bold text-white shadow-lg shadow-brand-coffee/20 hover:bg-brand-coffee/90 transition-all"
          >
            Submit New Request
          </Link>
        </div>

        {message && (
          <div className="mt-8 rounded-xl bg-red-50 p-4 text-red-700 flex items-center gap-3">
            <span className="flex-1 text-sm">{message}</span>
            <button onClick={() => setMessage('')} className="text-red-400 hover:text-red-600">&times;</button>
          </div>
        )}

        <div className="mt-10 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-brand-muted">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-brand-border bg-brand-cream/10 p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-brand-coffee opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-brand-charcoal">No change requests found</h3>
              <p className="mt-1 text-brand-muted max-w-xs mx-auto">You haven't submitted any requests for this cafe yet.</p>
              <Link 
                to={`/owner/cafes/${id}/change-requests/new`}
                className="mt-6 inline-block text-sm font-bold text-brand-coffee hover:underline"
              >
                Create your first request &rarr;
              </Link>
            </div>
          ) : (
            requests.map(request => (
              <article key={request.id} className="group overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="font-bold text-lg text-brand-charcoal">{request.type.replace(/_/g, ' ')}</h2>
                        <span className={clsx(
                          "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider",
                          request.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                          request.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                          request.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                          request.status === 'CANCELLED' ? "bg-stone-100 text-stone-500" :
                          "bg-brand-cream text-brand-muted"
                        )}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-brand-muted mt-1">Submitted {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    {request.status === 'PENDING' && (
                      <button 
                        onClick={() => cancel(request.id)} 
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>

                  {request.reason && (
                    <div className="mt-4 p-4 rounded-xl bg-brand-cream/20 border border-brand-border/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-coffee mb-2">Reason for change</p>
                      <p className="text-sm text-brand-charcoal leading-relaxed">{request.reason}</p>
                    </div>
                  )}

                  {request.adminNotes && (
                    <div className="mt-4 p-4 rounded-xl bg-stone-100 border border-stone-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Reviewer feedback</p>
                      <p className="text-sm text-stone-700 leading-relaxed italic">"{request.adminNotes}"</p>
                    </div>
                  )}
                  
                  {request.status === 'APPROVED' && request.reviewedAt && (
                    <p className="mt-4 text-[10px] text-brand-muted uppercase tracking-widest font-bold">
                      Approved on {new Date(request.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
