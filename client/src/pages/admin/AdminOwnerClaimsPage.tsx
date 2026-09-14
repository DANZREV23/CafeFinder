import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, Search, XCircle } from 'lucide-react';
import { adminClaimService } from '../../services/adminClaimService';
import { OwnerClaim, ClaimStatus } from '../../services/ownerClaimService';

export default function AdminOwnerClaimsPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') || 'PENDING') as ClaimStatus | 'ALL';
  const search = params.get('search') || '';
  const [claims, setClaims] = useState<OwnerClaim[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => adminClaimService.getClaims({ status, search }).then(result => setClaims(result.data)).catch(err => setError(err.message));
  useEffect(() => {
    void load();
  }, [status, search]);
  const action = async (id: string, type: 'approve' | 'reject') => { if (type === 'approve' && !window.confirm('Approve this claim and assign the cafe to the claimant?')) return; const reason = type === 'reject' ? window.prompt('Enter a rejection reason (at least 5 characters):') : null; if (type === 'reject' && (!reason || reason.trim().length < 5)) return; setBusy(id); try { if (type === 'approve') await adminClaimService.approveClaim(id); else await adminClaimService.rejectClaim(id, reason!.trim()); load(); } catch (err: any) { setError(err.message); } finally { setBusy(null); } };
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-stone-900">Owner Claims</h1><p className="text-sm text-stone-500">Review ownership requests before assigning a cafe.</p></div><div className="flex flex-col sm:flex-row gap-3"><select value={status} onChange={e => setParams({ status: e.target.value, search })} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>CANCELLED</option><option>ALL</option></select><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" /><input value={search} onChange={e => setParams({ status, search: e.target.value })} placeholder="Search cafe, claimant, or business" className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm" /></div></div>{error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}<div className="overflow-hidden rounded-xl border border-stone-200 bg-white"><div className="divide-y divide-stone-100">{claims.length === 0 ? <p className="p-12 text-center text-stone-500">No claims found.</p> : claims.map(claim => <div key={claim.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><p className="font-bold text-stone-900">{claim.cafe.name}</p><p className="text-sm text-stone-600">{claim.user?.name} · {claim.businessName}</p><p className="text-xs text-stone-400">Submitted {new Date(claim.submittedAt).toLocaleDateString()}</p></div><span className="self-start rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase">{claim.status}</span><div className="flex items-center gap-2"><Link to={`/admin/claims/${claim.id}`} title="View claim" className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"><Eye className="h-5 w-5" /></Link>{claim.status === 'PENDING' && <><button title="Approve claim" disabled={!!busy} onClick={() => action(claim.id, 'approve')} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="h-5 w-5" /></button><button title="Reject claim" disabled={!!busy} onClick={() => action(claim.id, 'reject')} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><XCircle className="h-5 w-5" /></button></>}</div></div>)}</div></div></div>;
}
