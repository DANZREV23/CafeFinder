import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Coffee, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { cafeService } from '../services/cafeService';
import { ownerClaimService } from '../services/ownerClaimService';
import { Cafe } from '../types';

export default function CafeClaimPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ contactName: '', contactEmail: '', contactPhone: '', businessName: '', website: '', message: '' });

  useEffect(() => { if (slug) cafeService.getBySlug(slug).then(result => setCafe(result.data)).catch(err => setError(err.message)).finally(() => setLoading(false)); }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cafe) return;
    setSaving(true); setError('');
    try { await ownerClaimService.createClaim(cafe.id, form); setSubmitted(true); }
    catch (err: any) { setError(err.message || 'Unable to submit claim'); }
    finally { setSaving(false); }
  };

  return <MainLayout><PageContainer className="py-12 md:py-20">
    <Link to={cafe ? `/cafes/${cafe.slug}` : '/explore'} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-coffee"><ArrowLeft className="w-4 h-4" /> Back to cafe</Link>
    {loading ? <div className="py-24 text-center text-brand-muted">Loading cafe...</div> : !cafe ? <div className="py-24 text-center"><AlertCircle className="mx-auto mb-4 text-red-500" /><p>{error || 'Cafe not found'}</p></div> : submitted ? <div className="max-w-xl mx-auto mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center space-y-5"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="text-3xl font-serif font-bold text-brand-charcoal">Claim submitted</h1><p className="text-brand-muted">Your ownership claim has been submitted for review. An administrator will review your request.</p><div className="flex flex-wrap justify-center gap-3"><Button asChild><Link to="/owner/claims">View Claim</Link></Button><Button asChild variant="outline"><Link to={`/cafes/${cafe.slug}`}>View Cafe</Link></Button><Button asChild variant="ghost"><Link to="/explore">Back to Explore</Link></Button></div></div> : <div className="max-w-3xl mx-auto mt-10"><div className="mb-8"><div className="flex items-center gap-3 text-brand-coffee text-xs font-bold uppercase tracking-widest"><Coffee className="w-4 h-4" /> Ownership request</div><h1 className="mt-3 text-4xl md:text-5xl font-serif font-bold text-brand-charcoal">Claim this cafe</h1><p className="mt-3 text-brand-muted">Tell us why you are authorized to manage <strong>{cafe.name}</strong>. Submission creates a pending request, not ownership.</p></div><form onSubmit={submit} className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"><div className="grid sm:grid-cols-2 gap-5"><label className="space-y-2 text-sm font-semibold">Contact name<input required maxLength={150} value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="space-y-2 text-sm font-semibold">Contact email<input required type="email" maxLength={255} value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="space-y-2 text-sm font-semibold">Phone<input maxLength={40} value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="space-y-2 text-sm font-semibold">Business name<input required maxLength={150} value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className="w-full h-11 rounded-xl border border-brand-border px-3" /></label></div><label className="block space-y-2 text-sm font-semibold">Website<input type="url" maxLength={500} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="block space-y-2 text-sm font-semibold">Why are you authorized to manage this cafe?<textarea required maxLength={2000} rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-brand-border px-3 py-3" /></label>{error && <div className="flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}<Button type="submit" isLoading={saving} className="w-full sm:w-auto">Submit claim</Button></form></div>}
  </PageContainer></MainLayout>;
}
