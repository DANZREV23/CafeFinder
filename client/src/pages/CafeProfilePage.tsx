import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CafeRating } from "@/components/cafe/CafeRating";
import { CafePrice } from "@/components/cafe/CafePrice";
import { ErrorState } from "@/components/ui/States";
import { cafeService } from "@/services/cafeService";
import { Cafe } from "@/types";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Clock, 
  ChevronRight, 
  ShieldCheck,
  Navigation,
  Check,
  ArrowLeft,
  ExternalLink,
  Instagram,
  Facebook
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/cafe/FavoriteButton";
import { ShareButtons } from "@/components/common/ShareButtons";
import { SEO } from "@/components/common/SEO";
import { generateCafeJsonLd, generateBreadcrumbJsonLd } from "@/utils/seoUtils";
import { CafeGallery } from "@/components/cafe/CafeGallery";
import { RelatedCafes } from "@/components/cafe/RelatedCafes";
import { CafeMenuHighlights } from "@/components/cafe/CafeMenuHighlights";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

import { MapProvider } from "@/components/map/MapProvider";
import { CafeMap } from "@/components/map/CafeMap";

import { useAuth } from "@/contexts/AuthContext";
import reviewService, { Review, ReviewStats } from "@/services/reviewService";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export default function CafeProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const [cafe, setCafe] = React.useState<Cafe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Review states
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [myReview, setMyReview] = React.useState<Review | null>(null);
  const [stats, setStats] = React.useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [isWritingReview, setIsWritingReview] = React.useState(false);
  const [editingReview, setEditingReview] = React.useState<Review | null>(null);
  const [reviewTotal, setReviewTotal] = React.useState(0);
  const [reviewPage, setReviewPage] = React.useState(1);

  const fetchReviews = async (page = 1, append = false) => {
    if (!cafe?.id) return;
    setReviewsLoading(true);
    try {
      const response = await reviewService.getCafeReviews(cafe.id, page);
      if (response.success) {
        setReviews(prev => append ? [...prev, ...response.data] : response.data);
        setReviewTotal(response.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    if (!cafe?.id) return;
    try {
      const response = await reviewService.getCafeRatingStats(cafe.id);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch review stats", err);
    }
  };

  const fetchMyReview = async () => {
    if (!cafe?.id || !isAuthenticated) {
      setMyReview(null);
      return;
    }
    try {
      const response = await reviewService.getMyReviewForCafe(cafe.id);
      if (response.success) {
        setMyReview(response.data);
      }
    } catch (err: any) {
      // Don't log 401 as an error, just clear myReview
      if (err.message !== 'Authentication required') {
        console.error("Failed to fetch my review", err);
      }
      setMyReview(null);
    }
  };

  const isOnline = useOnlineStatus();

  const fetchCafe = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const response = await cafeService.getBySlug(slug);
      if (response.success) {
        setCafe(response.data);
      } else {
        setError(response.error?.message || "Cafe not found");
      }
    } catch (err) {
      setError("Failed to load cafe details");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCafe();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  React.useEffect(() => {
    if (cafe?.id) {
      fetchReviews();
      fetchReviewStats();
      fetchMyReview();
    }
  }, [cafe?.id, isAuthenticated]);

  const handleLoadMoreReviews = () => {
    const nextPage = reviewPage + 1;
    setReviewPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleSubmitReview = async (data: any, files: File[]) => {
    if (!cafe?.id) return;
    try {
      let reviewId = "";
      if (editingReview) {
        const response = await reviewService.updateReview(editingReview.id, data);
        reviewId = response.data.id;
      } else {
        const response = await reviewService.createReview(cafe.id, data);
        reviewId = response.data.id;
      }

      // Upload photos if any
      if (files.length > 0) {
        for (const file of files) {
          await reviewService.uploadPhoto(reviewId, file);
        }
      }

      // Refresh data
      setIsWritingReview(false);
      setEditingReview(null);
      fetchReviews();
      fetchReviewStats();
      fetchMyReview();
      fetchCafe(); // Update cafe average rating
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await reviewService.deleteReview(reviewId);
      fetchReviews();
      fetchReviewStats();
      fetchMyReview();
      fetchCafe();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  // Open/Closed Status Calculation
  const getStatus = () => {
    if (!cafe?.hours || cafe.hours.length === 0) return null;
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 100 + now.getMinutes();
    const hours = cafe.hours.find(h => h.dayOfWeek === day);

    if (!hours || hours.isClosed) return { status: 'Closed', color: 'text-red-500' };

    const open = parseInt(hours.openTime.replace(':', ''));
    const close = parseInt(hours.closeTime.replace(':', ''));

    if (time >= open && time < close) return { status: 'Open now', color: 'text-emerald-500' };
    return { status: 'Closed now', color: 'text-red-500' };
  };

  const currentStatus = getStatus();

  if (loading) {
    return (
      <MainLayout>
        <div className="h-[400px] bg-brand-border/10 animate-pulse" />
        <PageContainer className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-16 w-3/4 bg-brand-border/10 animate-pulse rounded-2xl" />
              <div className="h-4 w-1/4 bg-brand-border/10 animate-pulse rounded-full" />
              <div className="h-64 bg-brand-border/10 animate-pulse rounded-3xl" />
            </div>
            <div className="h-[500px] bg-brand-border/10 animate-pulse rounded-3xl" />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !cafe) {
    return (
      <MainLayout>
        <SEO 
          title="Cafe not found"
          noindex={true}
        />
        <PageContainer className="py-24 text-center">
          <div className="max-w-md mx-auto space-y-8">
            <div className="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto">
              <MapPin className="w-12 h-12 text-brand-muted" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-bold text-brand-charcoal">Cafe not found</h1>
              <p className="text-brand-muted leading-relaxed">
                {error === "Cafe not found" 
                  ? "The cafe you're looking for doesn't exist or hasn't been published yet." 
                  : "We encountered a problem while retrieving the cafe details."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="primary" className="h-12 px-8">
                <Link to="/explore">Explore Cafes</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8">
                <Link to="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {cafe && (
        <SEO 
          title={cafe.name}
          description={cafe.shortDescription || `${cafe.name} in ${cafe.city}, ${cafe.state}. Discover ratings, reviews, menu, and more.`}
          ogImage={cafe.photos?.[0]?.url}
          ogType="place"
          jsonLd={[
            generateCafeJsonLd(cafe),
            generateBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Explore", item: "/explore" },
              { name: cafe.name, item: `/cafes/${cafe.slug}` }
            ])
          ]}
        />
      )}
      <div className="bg-brand-background">
        {/* Navigation & Actions Bar */}
        <div className="border-b border-brand-border bg-white sticky top-[64px] z-30">
          <PageContainer className="h-16 flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-muted overflow-hidden whitespace-nowrap">
              <Link to="/" className="hover:text-brand-coffee transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link to="/explore" className="hover:text-brand-coffee transition-colors">Explore</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-brand-charcoal truncate">{cafe.name}</span>
            </nav>
            
            <div className="flex items-center gap-2 md:gap-4">
              <FavoriteButton 
                cafeId={cafe.id} 
                cafeName={cafe.name} 
                initialIsFavorite={cafe.isFavorite}
                variant="outline"
                className="h-9 px-4 rounded-xl border-brand-border hover:bg-rose-50 hover:border-rose-200"
              />
              <ShareButtons 
                url={window.location.href}
                title={cafe.name}
              />
            </div>
          </PageContainer>
        </div>

        {/* Gallery Section */}
        <PageContainer className="py-8">
          <CafeGallery photos={cafe.photos} cafeName={cafe.name} />
        </PageContainer>

        <PageContainer className="pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-16">
              {/* Header Info */}
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  {cafe.verified && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Listing
                    </div>
                  )}
                  {cafe.featured && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                      Featured
                    </div>
                  )}
                  {cafe.trending && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-cream text-brand-coffee rounded-full text-xs font-bold border border-brand-coffee/10">
                      Trending Now
                    </div>
                  )}
                  <div className="h-4 w-px bg-brand-border hidden md:block" />
                  <CafePrice priceRange={cafe.priceRange} className="text-sm font-bold text-brand-coffee" />
                  
                  {cafe.claimStatus === 'MANAGED' && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 px-4">
                      <Link to={`/owner/cafes/${cafe.id}`}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> You manage this cafe
                      </Link>
                    </Button>
                  )}
                  {cafe.claimStatus === 'PENDING' && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-amber-200 text-amber-700 hover:bg-amber-50 h-8 px-4">
                      <Link to="/owner/claims">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Claim pending
                      </Link>
                    </Button>
                  )}
                  {cafe.claimStatus === 'OWNED' && <span className="px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-xs font-bold">Owner claimed</span>}
                  {cafe.claimStatus === 'AVAILABLE' && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-brand-coffee/20 text-brand-coffee hover:bg-brand-cream h-8 px-4">
                      <Link to={isAuthenticated ? `/cafes/${cafe.slug}/claim` : `/login?redirect=/cafes/${cafe.slug}/claim`}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Claim this cafe
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-charcoal leading-tight">
                    {cafe.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <CafeRating rating={cafe.ratingAverage} reviewCount={cafe.reviewCount} className="scale-125 origin-left" />
                    <div className="flex items-center gap-2 text-brand-muted font-medium">
                      <MapPin className="w-5 h-5 text-brand-coffee shrink-0" />
                      <span>{cafe.address}, {cafe.city}, {cafe.state} {cafe.postalCode}</span>
                    </div>
                    {currentStatus && (
                      <div className={cn("flex items-center gap-2 font-bold text-sm uppercase tracking-widest", currentStatus.color)}>
                        <Clock className="w-4 h-4" />
                        <span>{currentStatus.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <section className="space-y-8">
                <div className="prose prose-brand max-w-none">
                  <p className="text-xl text-brand-charcoal font-medium leading-relaxed italic border-l-4 border-brand-coffee pl-8 py-2">
                    {cafe.shortDescription}
                  </p>
                  <div className="h-8" />
                  <div className="text-lg text-brand-muted leading-relaxed font-sans space-y-6">
                    {cafe.description?.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </section>

              {/* Amenities */}
              <section className="space-y-8 pt-8 border-t border-brand-border">
                <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Amenities & Vibe</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {cafe.amenities && cafe.amenities.length > 0 ? (
                    cafe.amenities.map((ca) => (
                      <div key={ca.amenity.id} className="flex flex-col gap-4 p-6 rounded-3xl border border-brand-border bg-white hover:border-brand-coffee/30 transition-all group">
                         <div className="w-10 h-10 bg-brand-background rounded-2xl flex items-center justify-center text-brand-coffee group-hover:bg-brand-coffee group-hover:text-white transition-colors">
                           <Check className="w-5 h-5" />
                         </div>
                         <span className="font-bold text-brand-charcoal">{ca.amenity.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-brand-muted italic">No amenities listed yet.</p>
                  )}
                </div>
              </section>

              {/* Menu Highlights */}
              <CafeMenuHighlights />

              {/* Reviews Section */}
              <section id="reviews" className="space-y-12 pt-8 border-t border-brand-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Customer Reviews</h2>
                  {!myReview && !isWritingReview && (
                    <Button 
                      variant="primary" 
                      onClick={() => isAuthenticated ? setIsWritingReview(true) : window.location.href = '/login'}
                      className="hidden sm:flex"
                    >
                      Write a review
                    </Button>
                  )}
                </div>

                {stats && <ReviewSummary stats={stats} />}

                {(isWritingReview || editingReview) ? (
                  <ReviewForm 
                    initialData={editingReview || undefined}
                    onCancel={() => {
                      setIsWritingReview(false);
                      setEditingReview(null);
                    }}
                    onSubmit={handleSubmitReview}
                  />
                ) : null}

                <ReviewList 
                  reviews={reviews}
                  total={reviewTotal}
                  myReview={myReview}
                  isLoading={reviewsLoading}
                  onLoadMore={handleLoadMoreReviews}
                  onEditReview={(review) => setEditingReview(review)}
                  onDeleteReview={handleDeleteReview}
                />
              </section>

              {/* Related Cafes */}
              {cafe.relatedCafes && cafe.relatedCafes.length > 0 && (
                <section className="pt-16 border-t border-brand-border">
                  <RelatedCafes cafes={cafe.relatedCafes} />
                </section>
              )}
            </div>

            {/* Sidebar Sticky Area */}
            <aside className="space-y-10 lg:sticky lg:top-36 self-start">
              {/* Quick Contact Card */}
              <div className="bg-brand-coffee-dark text-white rounded-[40px] p-10 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-serif font-bold text-brand-accent-warm">Visit Us</h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-brand-accent-warm mt-1 shrink-0" />
                      <div className="text-sm leading-relaxed text-white/80">
                        <p>{cafe.address}</p>
                        <p>{cafe.city}, {cafe.state} {cafe.postalCode}</p>
                      </div>
                    </div>
                    {cafe.phone && (
                      <a 
                        href={`tel:${cafe.phone}`} 
                        className="flex items-center gap-4 group"
                        onClick={() => cafeService.trackInteraction(cafe.id, 'PHONE_CLICK')}
                      >
                        <Phone className="w-5 h-5 text-brand-accent-warm shrink-0" />
                        <span className="text-sm font-medium group-hover:text-brand-accent-warm transition-colors">{cafe.phone}</span>
                      </a>
                    )}
                    {cafe.email && (
                      <a href={`mailto:${cafe.email}`} className="flex items-center gap-4 group">
                        <Mail className="w-5 h-5 text-brand-accent-warm shrink-0" />
                        <span className="text-sm font-medium group-hover:text-brand-accent-warm transition-colors truncate">{cafe.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-serif font-bold text-brand-accent-warm">Hours</h3>
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                      // Adjust JS Sunday (0) to match our list index if needed, but the seed uses 0=Sunday
                      const dayMap = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
                      const dayIdx = dayMap[idx];
                      const hours = cafe.hours?.find(h => h.dayOfWeek === dayIdx);
                      const isToday = new Date().getDay() === dayIdx;
                      
                      return (
                        <div key={day} className={cn(
                          "flex justify-between text-sm transition-colors",
                          isToday ? "text-brand-accent-warm font-bold scale-[1.02] origin-left" : "text-white/40 font-medium"
                        )}>
                          <span>{day}</span>
                          <span>{hours?.isClosed ? "Closed" : `${hours?.openTime} - ${hours?.closeTime}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 relative z-10">
                    {cafe.website && (
                      <Button 
                        asChild
                        className="w-full h-14 bg-white text-brand-coffee-dark hover:bg-brand-accent-warm hover:text-white rounded-2xl gap-2 transition-all font-bold"
                        onClick={() => cafeService.trackInteraction(cafe.id, 'WEBSITE_CLICK')}
                      >
                        <a 
                          href={cafe.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                        >
                          Visit Website
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full h-14 border-white/20 text-white hover:bg-white/10 rounded-2xl gap-2"
                      onClick={() => {
                        cafeService.trackInteraction(cafe.id, 'DIRECTIONS_CLICK');
                        const fullAddress = `${cafe.address}, ${cafe.city}, ${cafe.state} ${cafe.postalCode || ''}`.trim();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`, '_blank');
                      }}
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>
                </div>
              </div>
              
              {/* Featured In Lists */}
              {cafe.curatedLists && cafe.curatedLists.length > 0 && (
                <div className="p-8 rounded-[40px] border border-brand-border bg-white shadow-sm space-y-6">
                  <h3 className="text-xl font-serif font-bold text-brand-charcoal">Featured In</h3>
                  <div className="space-y-4">
                    {cafe.curatedLists.map(({ list }) => (
                      <Link 
                        key={list.id} 
                        to={`/lists/${list.slug}`}
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-brand-border group-hover:border-brand-coffee transition-colors">
                          <img 
                            src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=80'} 
                            alt={list.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-brand-charcoal group-hover:text-brand-coffee transition-colors leading-tight mb-1">
                            {list.title}
                          </h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">View Collection</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Card */}
              <div className="p-8 rounded-[40px] border border-brand-border bg-white shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold text-brand-charcoal">Location</h3>
                    <div className="flex gap-2">
                      {cafe.instagram && (
                        <a 
                          href={cafe.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 bg-brand-cream rounded-full text-brand-coffee hover:bg-brand-coffee hover:text-white transition-all"
                          onClick={() => cafeService.trackInteraction(cafe.id, 'INSTAGRAM_CLICK')}
                        >
                          <div className="flex gap-2">
                            <Instagram className="w-4 h-4" />
                          </div>
                        </a>
                      )}
                      {cafe.facebook && (
                        <a 
                          href={cafe.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 bg-brand-cream rounded-full text-brand-coffee hover:bg-brand-coffee hover:text-white transition-all"
                          onClick={() => cafeService.trackInteraction(cafe.id, 'FACEBOOK_CLICK')}
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                 </div>
                 <div className="aspect-square bg-brand-cream/30 rounded-3xl border border-brand-border overflow-hidden relative group">
                    {isOnline ? (
                      <CafeMap 
                        cafes={[cafe]} 
                        selectedCafeId={cafe.id}
                        center={cafe.latitude && cafe.longitude ? { lat: Number(cafe.latitude), lng: Number(cafe.longitude) } : undefined}
                        zoom={15}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-brand-background">
                        <WifiOff className="h-10 w-10 text-brand-muted mb-4" />
                        <p className="text-sm font-bold text-brand-charcoal">Map unavailable offline</p>
                        <p className="text-xs text-brand-muted mt-2">Reconnect to view the interactive map.</p>
                      </div>
                    )}
                 </div>
              </div>
            </aside>
          </div>
        </PageContainer>
      </div>

    </MainLayout>
  );
}
