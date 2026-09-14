import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerClaimService, OwnerClaim } from '../services/ownerClaimService';

export default function OwnerClaimDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<OwnerClaim | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (id) ownerClaimService.getClaim(id).then(result => setClaim(result.data)).catch(err => setError(err.message)); }, [id]);
  return <MainLayout><PageContainer className="py-12"><Link to="/owner/claims" className="inline-flex items-center gap-2 text-sm text-brand-muted"><ArrowLeft className="h-4 w-4" /> Back to claims</Link>{error ? <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : !claim ? <p className="mt-8 text-brand-muted">Loading claim...</p> : <div className="mt-8 max-w-2xl rounded-2xl border border-brand-border bg-white p-6 space-y-5"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Claim status</p><h1 className="mt-2 text-3xl font-serif font-bold">{claim.cafe.name}</h1></div><span className="inline-block rounded-full bg-brand-cream px-3 py-1 text-xs font-bold uppercase">{claim.status}</span><dl className="grid sm:grid-cols-2 gap-4 text-sm"><div><dt className="text-brand-muted">Submitted</dt><dd className="font-semibold">{new Date(claim.submittedAt).toLocaleString()}</dd></div><div><dt className="text-brand-muted">Business</dt><dd className="font-semibold">{claim.businessName}</dd></div></dl>{claim.rejectionReason && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700"><strong>Rejection reason:</strong> {claim.rejectionReason}</div>}<Link to={`/cafes/${claim.cafe.slug}`} className="font-semibold text-brand-coffee">View public cafe</Link></div>}</PageContainer></MainLayout>;
}
