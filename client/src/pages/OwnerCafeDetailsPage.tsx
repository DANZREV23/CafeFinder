import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Image, 
  ListChecks, 
  MessageSquare, 
  Pencil, 
  Utensils, 
  BarChart3 
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';

export default function OwnerCafeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [cafe, setCafe] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      ownerService.getOwnedCafe(id)
        .then(result => setCafe(result.data))
        .catch(err => setError(err.message));
    }
  }, [id]);

  if (error) {
    return (
      <MainLayout>
        <PageContainer className="py-12 md:py-16">
          <Link to="/owner/cafes" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee">
            <ArrowLeft className="w-4 h-4" /> Back to my cafes
          </Link>
          <div className="mt-10 rounded-2xl bg-red-50 p-8 text-red-700">{error}</div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (!cafe) {
    return (
      <MainLayout>
        <PageContainer className="py-12 md:py-16">
          <Link to="/owner/cafes" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee">
            <ArrowLeft className="w-4 h-4" /> Back to my cafes
          </Link>
          <div className="mt-10 text-brand-muted">Loading cafe...</div>
        </PageContainer>
      </MainLayout>
    );
  }

  const managementLinks = [
    { href: `/owner/cafes/${id}/edit`, label: 'Edit information', icon: Pencil },
    { href: `/owner/cafes/${id}/hours`, label: 'Hours', icon: Clock },
    { href: `/owner/cafes/${id}/amenities`, label: 'Amenities', icon: ListChecks },
    { href: `/owner/cafes/${id}/photos`, label: 'Photos', icon: Image },
    { href: `/owner/cafes/${id}/menu`, label: 'Menu', icon: Utensils },
    { href: `/owner/cafes/${id}/reviews`, label: 'Reviews', icon: MessageSquare },
    { href: `/owner/cafes/${id}/analytics`, label: 'Analytics', icon: BarChart3 },
    { href: `/owner/cafes/${id}/change-requests`, label: 'Change requests', icon: ShieldCheck },
  ];

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16">
        <Link to="/owner/cafes" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee">
          <ArrowLeft className="w-4 h-4" /> Back to my cafes
        </Link>

        <div className="mt-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-64 aspect-video rounded-2xl overflow-hidden bg-brand-cream">
              {cafe.photos?.[0] && <img src={cafe.photos[0].url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Manage cafe</p>
              <h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">{cafe.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-brand-muted">
                <MapPin className="w-4 h-4" />{cafe.address}, {cafe.city}
              </p>
              <div className="mt-4 flex gap-2 text-sm">
                {cafe.verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" /> Verified by CafeFinder
                  </span>
                )}
                <span className="rounded-full bg-brand-cream px-3 py-1 font-semibold">{cafe.status}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-brand-border bg-white p-5">
              <p className="text-sm text-brand-muted">Rating</p>
              <p className="mt-2 text-3xl font-bold">{Number(cafe.ratingAverage).toFixed(1)}</p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-white p-5">
              <p className="text-sm text-brand-muted">Reviews</p>
              <p className="mt-2 text-3xl font-bold">{cafe.reviews?.length || 0}</p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-white p-5">
              <p className="text-sm text-brand-muted">Public status</p>
              <p className="mt-2 text-xl font-bold">{cafe.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {managementLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href} 
                className="flex items-center gap-2 rounded-xl border border-brand-border bg-white p-4 text-sm font-semibold hover:border-brand-coffee transition-all"
              >
                <link.icon className="h-4 w-4 text-brand-coffee"/>
                {link.label}
              </Link>
            ))}
          </div>

          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <h2 className="text-xl font-bold">Protected by CafeFinder</h2>
            <p className="mt-3 text-brand-muted">
              Ownership, publication, verification, featured status, trending status, ratings, and review moderation remain platform-controlled.
            </p>
          </section>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
