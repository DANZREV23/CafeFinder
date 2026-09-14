import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerClaimService, OwnerClaim } from '../services/ownerClaimService';

export default function OwnerClaimsPage() {
  const [claims, setClaims] = useState<OwnerClaim[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => ownerClaimService.getMyClaims().then(result => setClaims(result.data)).catch(err => setError(err.message));
  useEffect(() => {
    void load();
  }, []);
  const cancel = async (id: string) => { if (!window.confirm('Cancel this pending ownership claim?')) return; setBusy(id); try { await ownerClaimService.cancelClaim(id); load(); } catch (err: any) { setError(err.message); } finally { setBusy(null); } };
  return <MainLayout><PageContainer className="py-12 md:py-16 space-y-8"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Owner workspace</p><h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">Cafe Claims</h1><p className="mt-2 text-brand-muted">A submitted claim stays pending until an administrator approves it.</p></div>{error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}<div className="space-y-4">{claims.length === 0 ? <div className="rounded-2xl border border-dashed border-brand-border p-16 text-center text-brand-muted">No ownership claims yet.</div> : claims.map(claim => <article key={claim.id} className="rounded-2xl border border-brand-border bg-white p-5 md:p-6"><div className="flex flex-col md:flex-row md:items-center gap-4"><div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-cream">{claim.cafe.coverImage && <img src={claim.cafe.coverImage} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><h2 className="font-bold text-brand-charcoal">{claim.cafe.name}</h2><p className="text-sm text-brand-muted">{claim.businessName} · {claim.cafe.city}</p><p className="mt-1 flex items-center gap-1 text-xs text-brand-muted"><Calendar className="w-3 h-3" /> {new Date(claim.submittedAt).toLocaleDateString()}</p></div><span className="self-start rounded-full bg-brand-cream px-3 py-1 text-xs font-bold uppercase">{claim.status}</span></div><div className="mt-5 flex flex-wrap gap-4 text-sm"><Link to={`/cafes/${claim.cafe.slug}`} className="inline-flex items-center gap-1 font-semibold text-brand-coffee">View Cafe <ExternalLink className="w-3 h-3" /></Link><Link to={`/cafe-owner-claims/${claim.id}`} className="font-semibold text-brand-charcoal">View Claim</Link>{claim.status === 'PENDING' && <button onClick={() => cancel(claim.id)} disabled={busy === claim.id} className="font-semibold text-red-600">{busy === claim.id ? 'Cancelling...' : 'Cancel'}</button>}{claim.status === 'REJECTED' && <p className="w-full text-sm text-red-700">Reason: {claim.rejectionReason || 'Not provided'}</p>}{claim.status === 'APPROVED' && <Link to={`/owner/cafes/${claim.cafeId}`} className="font-semibold text-emerald-700">Manage Cafe</Link>}</div></article>)}</div></PageContainer></MainLayout>;
}
