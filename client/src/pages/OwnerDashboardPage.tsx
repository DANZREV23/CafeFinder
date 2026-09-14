import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ClipboardList, MessageSquare, ShieldCheck } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService, OwnerDashboard } from '../services/ownerService';
import { useAuth } from '../contexts/AuthContext';

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { ownerService.getDashboard().then(result => setData(result.data)).catch(err => setError(err.message)); }, []);
  const cards = [['Claimed Cafes', data?.claimedCafes, Building2], ['Pending Claims', data?.pendingClaims, ClipboardList], ['Published Cafes', data?.publishedCafes, ShieldCheck], ['Total Reviews', data?.totalReviews, MessageSquare], ['Pending Changes', data?.pendingChangeRequests, ClipboardList], ['Average Rating', data?.averageRating?.toFixed(1), ShieldCheck]] as const;
  return <MainLayout><PageContainer className="py-12 md:py-16 space-y-10"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">{user?.role === 'ADMIN' ? 'Administrative access' : 'Owner workspace'}</p><h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">Owner Dashboard</h1><p className="mt-2 text-brand-muted">{data?.isAdministrativeAccess ? 'Viewing ownership data for administrative support.' : 'Manage your claimed cafes and ownership requests.'}</p></div>{error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label, value, Icon]) => <div key={label} className="bg-white border border-brand-border rounded-2xl p-5"><Icon className="w-6 h-6 text-brand-coffee mb-5" /><p className="text-3xl font-bold text-brand-charcoal">{value ?? '...'}</p><p className="text-sm text-brand-muted mt-1">{label}</p></div>)}</div><div className="grid md:grid-cols-2 gap-5"><Link to="/owner/cafes" className="rounded-2xl bg-brand-charcoal text-white p-7 hover:bg-brand-charcoal/90"><h2 className="text-xl font-bold">My Cafes</h2><p className="mt-2 text-white/70">View cafes owned by this account.</p></Link><Link to="/owner/claims" className="rounded-2xl border border-brand-border bg-white p-7 hover:border-brand-coffee"><h2 className="text-xl font-bold text-brand-charcoal">Cafe Claims</h2><p className="mt-2 text-brand-muted">Track pending and reviewed ownership requests.</p></Link></div></PageContainer></MainLayout>;
}
