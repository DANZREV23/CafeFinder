import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  BarChart3, 
  ExternalLink,
  Star,
  MessageSquare,
  Coffee
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService, OwnerCafeSummary } from '../services/ownerService';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export default function OwnerCafesPage() {
  const [cafes, setCafes] = useState<OwnerCafeSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ownerService.getOwnedCafes()
      .then(result => {
        setCafes(result.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Owner workspace</p>
          <h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">My Cafes</h1>
          <p className="mt-2 text-brand-muted font-medium">Select a cafe to manage its details or view performance analytics.</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-red-700 border border-red-100 flex items-center gap-3">
            <span className="font-bold text-lg">!</span> {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-[420px] rounded-[32px] bg-brand-background animate-pulse border border-brand-border" />
            ))}
          </div>
        ) : cafes.length === 0 ? (
          <div className="rounded-[48px] border-2 border-dashed border-brand-border p-20 text-center space-y-6 bg-brand-background/30">
            <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto text-brand-coffee">
              <Coffee size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-brand-charcoal">No cafes found</h2>
              <p className="text-brand-muted max-w-sm mx-auto font-medium leading-relaxed">
                You haven't claimed any cafes yet. Once your claim is approved by our team, your cafes will appear here for management.
              </p>
            </div>
            <div className="pt-4">
              <Link to="/explore">
                <Button variant="outline" className="rounded-2xl px-8 h-12 shadow-sm bg-white font-bold">
                  Explore Cafes to Claim
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cafes.map(cafe => (
              <article key={cafe.id} className="group overflow-hidden rounded-[32px] border border-brand-border bg-white hover:shadow-2xl hover:border-brand-coffee/20 transition-all duration-500">
                <div className="aspect-[16/10] bg-brand-cream relative overflow-hidden">
                  {cafe.coverImage ? (
                    <img 
                      src={cafe.coverImage} 
                      alt={cafe.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-muted bg-brand-background">
                      <Coffee size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-5 right-5">
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-widest rounded-full px-4 py-1.5 shadow-lg border backdrop-blur-md",
                      cafe.status === 'PUBLISHED' 
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    )}>
                      {cafe.status}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-1">
                    <h2 className="font-serif font-bold text-2xl text-brand-charcoal group-hover:text-brand-coffee transition-colors leading-tight">
                      {cafe.name}
                    </h2>
                    <p className="flex items-center gap-1.5 text-sm text-brand-muted font-bold">
                      <MapPin className="w-4 h-4 text-brand-coffee" />
                      {cafe.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-charcoal">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {cafe.ratingAverage.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-muted">
                      <MessageSquare className="w-4 h-4 text-brand-coffee" />
                      {cafe.reviewCount} reviews
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      to={`/owner/cafes/${cafe.id}/analytics`} 
                      className="flex items-center justify-center gap-2 rounded-2xl bg-brand-background px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-charcoal hover:bg-brand-coffee hover:text-white transition-all shadow-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Insights
                    </Link>
                    <Link 
                      to={`/owner/cafes/${cafe.id}`} 
                      className="flex items-center justify-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-charcoal/90 transition-all shadow-lg"
                    >
                      Manage
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="pt-4 border-t border-brand-border">
                    <Link to={`/cafes/${cafe.slug}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-coffee transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Public Profile
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
