import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService, OwnerCafeSummary } from '../services/ownerService';

export default function OwnerCafesPage() {
  const [cafes, setCafes] = useState<OwnerCafeSummary[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { ownerService.getOwnedCafes().then(result => setCafes(result.data)).catch(err => setError(err.message)); }, []);
  return <MainLayout><PageContainer className="py-12 md:py-16 space-y-8"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Owner workspace</p><h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">My Cafes</h1></div>{error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{cafes.length === 0 ? <div className="rounded-2xl border border-dashed border-brand-border p-16 text-center text-brand-muted">No cafes are owned by this account yet.</div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{cafes.map(cafe => <article key={cafe.id} className="overflow-hidden rounded-2xl border border-brand-border bg-white"><div className="aspect-[16/9] bg-brand-cream">{cafe.coverImage && <img src={cafe.coverImage} alt="" className="w-full h-full object-cover" />}</div><div className="p-5 space-y-3"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-lg text-brand-charcoal">{cafe.name}</h2><span className="text-[10px] uppercase font-bold rounded-full bg-brand-cream px-2 py-1">{cafe.status}</span></div><p className="flex items-center gap-1 text-sm text-brand-muted"><MapPin className="w-4 h-4" />{cafe.city}</p><p className="text-sm text-brand-muted">{cafe.ratingAverage.toFixed(1)} rating · {cafe.reviewCount} reviews</p><div className="flex gap-3 pt-2"><Link to={`/cafes/${cafe.slug}`} className="text-sm font-semibold text-brand-coffee">View Cafe</Link><Link to={`/owner/cafes/${cafe.id}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-charcoal">Manage <ArrowRight className="w-4 h-4" /></Link></div></div></article>)}</div>}</PageContainer></MainLayout>;
}
