import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CafeRating } from "@/components/cafe/CafeRating";
import { CafePrice } from "@/components/cafe/CafePrice";
import { ErrorState } from "@/components/ui/States";
import { cafeService } from "@/services/cafeService";
import { ownerClaimService } from "@/services/ownerClaimService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
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
  CheckCircle2,
  Coffee,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Instagram,
  Facebook,
  FolderPlus,
  MessageCircleQuestion,
  Calendar,
  Sparkles,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/cafe/FavoriteButton";
import { FollowCafeButton } from "@/components/cafe/FollowCafeButton";
import { ContactCafeModal } from "@/components/cafe/ContactCafeModal";
import { InquiryCategory, InquirySource } from "@/services/inquiryService";
import { CollectionPicker } from "@/components/collections/CollectionPicker";
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
import { useI18n } from "@/i18n";
import reviewService, { Review, ReviewStats, ReviewFilterParams, ReviewResponse } from "@/services/reviewService";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { VisitorPhotoGallery } from "@/components/reviews/VisitorPhotoGallery";
import { ReportModal } from "@/components/reviews/ReportModal";
import { OwnerResponseModal } from "@/components/reviews/OwnerResponseModal";
import { CafeLoyaltySection } from "@/components/cafe/CafeLoyaltySection";

export default function CafeProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { t, formatTime, locale } = useI18n();
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
  const [reviewFilters, setReviewFilters] = React.useState<ReviewFilterParams>({
    sort: 'newest',
    rating: undefined,
    hasPhotos: false,
  });

  // Reporting and owner response modal states
  const [reportingReview, setReportingReview] = React.useState<Review | null>(null);
  const [respondingReview, setRespondingReview] = React.useState<Review | null>(null);
  const [editingResponse, setEditingResponse] = React.useState<ReviewResponse | null>(null);

  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [contactModal, setContactModal] = React.useState<{
    isOpen: boolean;
    category: InquiryCategory;
    subject: string;
    source: InquirySource;
    eventContext?: { id: string; title: string } | null;
    specialContext?: { id: string; title: string } | null;
  }>({
    isOpen: false,
    category: 'GENERAL',
    subject: '',
    source: 'CAFE_PROFILE',
    eventContext: null,
    specialContext: null,
  });

  const openContactModal = (options?: {
    category?: InquiryCategory;
    subject?: string;
    source?: InquirySource;
    eventContext?: { id: string; title: string } | null;
    specialContext?: { id: string; title: string } | null;
  }) => {
    setContactModal({
      isOpen: true,
      category: options?.category || 'GENERAL',
      subject: options?.subject || '',
      source: options?.source || 'CAFE_PROFILE',
      eventContext: options?.eventContext || null,
      specialContext: options?.specialContext || null,
    });
  };

  const navigate = useNavigate();
  const [isClaimingVisit, setIsClaimingVisit] = React.useState(false);
  const [isVisited, setIsVisited] = React.useState(false);
  const [showAutoClaimModal, setShowAutoClaimModal] = React.useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = React.useState(false);
  const [claimPhone, setClaimPhone] = React.useState('');
  const [claimRole, setClaimRole] = React.useState('Owner / Manager');

  React.useEffect(() => {
    if (cafe) {
      setIsVisited(Boolean(cafe.isVisited));
    }
  }, [cafe?.isVisited]);

  const handleClaimVisit = async () => {
    if (!cafe?.id) return;
    if (!isAuthenticated) {
      toast.error('Please log in to claim your visit to this cafe');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsClaimingVisit(true);
    try {
      const res = await cafeService.claimVisit(cafe.id);
      if (res.success) {
        setIsVisited(true);
        toast.success(res.message || `Visit to ${cafe.name} claimed!`);
        fetchCafe();
      } else {
        toast.error(res.message || 'Unable to claim visit');
      }
    } catch (err: any) {
      toast.error(err.message || 'Unable to claim visit');
    } finally {
      setIsClaimingVisit(false);
    }
  };

  const handleAutoClaimSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cafe?.id) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsSubmittingClaim(true);
    try {
      const res = await ownerClaimService.createClaim(cafe.id, {
        businessName: cafe.name,
        contactName: user?.name || 'Cafe Representative',
        contactEmail: user?.email || '',
        contactPhone: claimPhone.trim() || undefined,
        message: `Automatic ownership claim for ${cafe.name}. Authorized representative: ${user?.name || 'User'} (${claimRole}).`,
      });
      if (res.success) {
        toast.success(`Claim for ${cafe.name} submitted! An administrator will review your request.`);
        setShowAutoClaimModal(false);
        setCafe(prev => prev ? { ...prev, claimStatus: 'PENDING' } : null);
      } else {
        toast.error((res as any).error?.message || 'Unable to submit claim');
      }
    } catch (err: any) {
      toast.error(err.message || 'Unable to submit claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const isCafeOwner = Boolean(user && cafe && (cafe.ownerId === user.id || (user.role === 'OWNER' && (cafe as any).claimedBy === user.id)));

  const fetchReviews = async (page = 1, append = false, currentFilters = reviewFilters) => {
    if (!cafe?.id) return;
    setReviewsLoading(true);
    try {
      const response = await reviewService.getCafeReviews(cafe.id, {
        page,
        limit: 10,
        ...currentFilters,
      });
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

  const handleFilterChange = (newFilters: Partial<ReviewFilterParams>) => {
    const updated = { ...reviewFilters, ...newFilters };
    setReviewFilters(updated);
    setReviewPage(1);
    fetchReviews(1, false, updated);
  };

  const handleHelpfulToggle = async (reviewId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await reviewService.toggleHelpful(reviewId);
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isHelpful: res.data.isHelpful, helpfulCount: res.data.helpfulCount } : r));
      }
    } catch (err) {
      console.error("Failed to toggle helpful", err);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!window.confirm("Are you sure you want to remove your owner response?")) return;
    try {
      await reviewService.deleteResponse(responseId);
      fetchReviews(reviewPage, false);
    } catch (err) {
      console.error("Failed to delete response", err);
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
    const hours = cafe.hours.find(h => h.dayOfWeek === day);

    if (!hours || hours.isClosed) return { status: t("cafe.closed"), color: 'text-red-500' };

    const [openH, openM] = hours.openTime?.split(':').map(Number) || [0, 0];
    const [closeH, closeM] = hours.closeTime?.split(':').map(Number) || [0, 0];
    
    const openTime = new Date(now);
    openTime.setHours(openH, openM, 0);
    
    const closeTime = new Date(now);
    closeTime.setHours(closeH, closeM, 0);
    
    // Handle overnight hours
    if (closeTime <= openTime) {
      closeTime.setDate(closeTime.getDate() + 1);
    }

    if (now >= openTime && now < closeTime) {
      return { status: t("cafe.openNow"), color: 'text-emerald-500' };
    }
    
    return { status: t("cafe.closed"), color: 'text-red-500' };
  };

  const formatHourString = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    return formatTime(date);
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
            <nav className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-muted overflow-hidden whitespace-nowrap" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-brand-coffee transition-colors">{t("nav.home")}</Link>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <Link to="/explore" className="hover:text-brand-coffee transition-colors">{t("nav.explore")}</Link>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="text-brand-charcoal truncate" aria-current="page">{cafe.name}</span>
            </nav>
            
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <Button
                variant={isVisited ? "secondary" : "outline"}
                size="sm"
                disabled={isClaimingVisit}
                className={cn(
                  "h-9 px-4 rounded-xl border transition-all font-semibold",
                  isVisited
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "border-brand-coffee/30 text-brand-coffee hover:bg-brand-cream hover:border-brand-coffee"
                )}
                onClick={handleClaimVisit}
                title={isVisited ? "You have visited this cafe. Click to log another visit." : "Claim your visit to this cafe"}
              >
                {isClaimingVisit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-brand-coffee" />
                    Claiming...
                  </>
                ) : isVisited ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Visited
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4 mr-1.5 text-brand-coffee" />
                    Claim Visit
                  </>
                )}
              </Button>

              <FavoriteButton 
                cafeId={cafe.id} 
                cafeName={cafe.name} 
                initialIsFavorite={cafe.isFavorite}
                variant="outline"
                className="h-9 px-4 rounded-xl border-brand-border hover:bg-rose-50 hover:border-rose-200"
              />
              <FollowCafeButton
                cafeId={cafe.id}
                cafeName={cafe.name}
                className="h-9 px-4"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl border-brand-border hover:bg-brand-cream"
                onClick={() => openContactModal({ category: 'GENERAL', source: 'CAFE_PROFILE' })}
              >
                <MessageCircleQuestion className="w-4 h-4 mr-2 text-brand-coffee" />
                Contact Cafe
              </Button>
              {isAuthenticated && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-4 rounded-xl border-brand-border hover:bg-brand-background"
                  onClick={() => setIsPickerOpen(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
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
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      {t("cafe.verified")}
                    </div>
                  )}
                  {cafe.featured && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                      {t("cafe.featured")}
                    </div>
                  )}
                  {cafe.trending && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-cream text-brand-coffee rounded-full text-xs font-bold border border-brand-coffee/10">
                      {t("cafe.trending")}
                    </div>
                  )}
                  <div className="h-4 w-px bg-brand-border hidden md:block" />
                  <CafePrice priceRange={cafe.priceRange} className="text-sm font-bold text-brand-coffee" />
                  
                  {cafe.claimStatus === 'MANAGED' && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 h-8 px-4 font-bold shadow-xs">
                      <Link to={`/owner/cafes/${cafe.id}`}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" aria-hidden="true" /> {t("cafe.managed")}
                      </Link>
                    </Button>
                  )}
                  {cafe.claimStatus === 'PENDING' && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 h-8 px-4 font-bold shadow-xs">
                      <Link to="/owner/claims">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" aria-hidden="true" /> {t("cafe.claimPending")}
                      </Link>
                    </Button>
                  )}
                  {cafe.claimStatus === 'OWNED' && !isCafeOwner && (
                    <span className="px-4 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-bold border border-stone-200">
                      {t("cafe.ownerClaimed")}
                    </span>
                  )}
                  {cafe.claimStatus === 'AVAILABLE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        } else {
                          setShowAutoClaimModal(true);
                        }
                      }}
                      className="rounded-full border-brand-coffee bg-brand-cream/80 text-brand-coffee hover:bg-brand-coffee hover:text-white h-8 px-4 font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> {t("cafe.claimThis")}
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

              {/* Cafe Loyalty & Rewards Section */}
              <CafeLoyaltySection cafeId={cafe.id} cafeSlug={cafe.slug} cafeName={cafe.name} />

              {/* Amenities */}
              <section className="space-y-8 pt-8 border-t border-brand-border" aria-labelledby="amenities-heading">
                <h2 id="amenities-heading" className="text-3xl font-serif font-bold text-brand-charcoal">{t("cafe.amenitiesVibe")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {cafe.amenities && cafe.amenities.length > 0 ? (
                    cafe.amenities.map((ca) => (
                      <div key={ca.amenity.id} className="flex flex-col gap-4 p-6 rounded-3xl border border-brand-border bg-white hover:border-brand-coffee/30 transition-all group">
                         <div className="w-10 h-10 bg-brand-background rounded-2xl flex items-center justify-center text-brand-coffee group-hover:bg-brand-coffee group-hover:text-white transition-colors" aria-hidden="true">
                           <Check className="w-5 h-5" />
                         </div>
                         <span className="font-bold text-brand-charcoal">{ca.amenity.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-brand-muted italic">{t("cafe.noAmenities")}</p>
                  )}
                </div>
              </section>

              {/* Menu Highlights */}
              <CafeMenuHighlights />

              {/* Events, Specials & Announcements */}
              {((cafe.announcements && cafe.announcements.length > 0) ||
                (cafe.events && cafe.events.length > 0) ||
                (cafe.specials && cafe.specials.length > 0)) && (
                <section className="space-y-8 pt-8 border-t border-brand-border" aria-labelledby="whats-happening-heading">
                  <h2 id="whats-happening-heading" className="text-3xl font-serif font-bold text-brand-charcoal">
                    Events, Specials & Updates
                  </h2>

                  {cafe.announcements && cafe.announcements.length > 0 && (
                    <div className="space-y-4">
                      {cafe.announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className="p-5 rounded-2xl border border-amber-200 bg-amber-50/70 flex items-start gap-4"
                        >
                          <Megaphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-brand-charcoal text-base">{ann.title}</h3>
                            <p className="text-sm text-brand-muted mt-1 whitespace-pre-line">{ann.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cafe.events && cafe.events.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-brand-charcoal flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-coffee" />
                        Upcoming Events
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cafe.events.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-6 rounded-3xl border border-brand-border bg-white shadow-sm flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-cream text-brand-coffee">
                                {ev.eventType.replace(/_/g, ' ')}
                              </span>
                              <h4 className="text-xl font-serif font-bold text-brand-charcoal">{ev.title}</h4>
                              <p className="text-xs font-semibold text-brand-muted">
                                {new Date(ev.startAt).toLocaleDateString(locale, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-brand-muted line-clamp-3">
                                {ev.shortDescription || ev.description}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-xl border-brand-coffee/30 text-brand-coffee hover:bg-brand-cream gap-2"
                              onClick={() =>
                                openContactModal({
                                  category: 'EVENT',
                                  subject: `Question about event: ${ev.title}`,
                                  source: 'EVENT',
                                  eventContext: { id: ev.id, title: ev.title },
                                })
                              }
                            >
                              <MessageCircleQuestion className="w-4 h-4" />
                              Ask About This Event
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cafe.specials && cafe.specials.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-brand-charcoal flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-coffee" />
                        Current Specials & Promotions
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cafe.specials.map((sp) => (
                          <div
                            key={sp.id}
                            className="p-6 rounded-3xl border border-brand-border bg-white shadow-sm flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                  {sp.specialType.replace(/_/g, ' ')}
                                </span>
                                {sp.discountPercent ? (
                                  <span className="text-xs font-bold text-emerald-700">
                                    {sp.discountPercent}% OFF
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="text-xl font-serif font-bold text-brand-charcoal">{sp.title}</h4>
                              <p className="text-sm text-brand-muted line-clamp-3">
                                {sp.shortDescription || sp.description}
                              </p>
                              {sp.terms && (
                                <p className="text-[11px] text-brand-muted italic">Terms: {sp.terms}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-xl border-brand-coffee/30 text-brand-coffee hover:bg-brand-cream gap-2"
                              onClick={() =>
                                openContactModal({
                                  category: 'SPECIAL',
                                  subject: `Question about special: ${sp.title}`,
                                  source: 'SPECIAL',
                                  specialContext: { id: sp.id, title: sp.title },
                                })
                              }
                            >
                              <MessageCircleQuestion className="w-4 h-4" />
                              Ask About This Special
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Reviews Section */}
              {/* Community Visitor Photos */}
              <VisitorPhotoGallery cafeId={cafe.id} />

              {/* Reviews Section */}
              <section id="reviews" className="space-y-12 pt-8 border-t border-brand-border" aria-labelledby="reviews-heading">
                <div className="flex items-center justify-between">
                  <h2 id="reviews-heading" className="text-3xl font-serif font-bold text-brand-charcoal">{t("cafe.customerReviews")}</h2>
                  {!myReview && !isWritingReview && (
                    <Button 
                      variant="primary" 
                      onClick={() => isAuthenticated ? setIsWritingReview(true) : window.location.href = '/login'}
                      className="hidden sm:flex"
                    >
                      {t("cafe.writeReview")}
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
                  filters={reviewFilters}
                  onFilterChange={handleFilterChange}
                  onLoadMore={handleLoadMoreReviews}
                  onHelpfulToggle={handleHelpfulToggle}
                  onReport={(r) => setReportingReview(r)}
                  isCafeOwner={isCafeOwner}
                  cafeName={cafe.name}
                  onRespond={(r) => setRespondingReview(r)}
                  onEditResponse={(res) => setEditingResponse(res)}
                  onDeleteResponse={handleDeleteResponse}
                  onEditReview={(review) => setEditingReview(review)}
                  onDeleteReview={handleDeleteReview}
                />
              </section>

              {/* Modals */}
              <ReportModal
                isOpen={reportingReview !== null}
                onClose={() => setReportingReview(null)}
                reviewId={reportingReview?.id || null}
                reviewerName={reportingReview?.reviewer.name}
              />

              <OwnerResponseModal
                isOpen={respondingReview !== null || editingResponse !== null}
                onClose={() => {
                  setRespondingReview(null);
                  setEditingResponse(null);
                }}
                reviewId={respondingReview?.id || null}
                cafeName={cafe.name}
                reviewerName={respondingReview?.reviewer.name}
                existingResponse={editingResponse}
                onResponseSaved={() => {
                  fetchReviews(reviewPage, false);
                }}
              />

              {/* Related Cafes */}
              {cafe.relatedCafes && cafe.relatedCafes.length > 0 && (
                <section className="pt-16 border-t border-brand-border">
                  <RelatedCafes cafes={cafe.relatedCafes} />
                </section>
              )}
            </div>

            <CollectionPicker 
              cafeId={cafe.id}
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
            />

            <ContactCafeModal
              isOpen={contactModal.isOpen}
              onClose={() => setContactModal((prev) => ({ ...prev, isOpen: false }))}
              cafeId={cafe.id}
              cafeName={cafe.name}
              defaultCategory={contactModal.category}
              defaultSubject={contactModal.subject}
              source={contactModal.source}
              eventContext={contactModal.eventContext}
              specialContext={contactModal.specialContext}
            />

            {/* Auto-Claim Ownership Modal */}
            <Dialog open={showAutoClaimModal} onOpenChange={setShowAutoClaimModal}>
              <DialogContent className="max-w-md rounded-3xl p-6 md:p-8">
                <DialogHeader className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-cream text-brand-coffee flex items-center justify-center mb-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <DialogTitle className="text-2xl font-serif font-bold text-brand-charcoal">
                    Claim {cafe.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-brand-muted">
                    Submit an ownership claim to manage this cafe listing on CafeFinder.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAutoClaimSubmit} className="space-y-4 mt-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Applicant:</span>
                      <span className="font-bold text-stone-800">{user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Account Email:</span>
                      <span className="font-bold text-stone-800">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Target Cafe:</span>
                      <span className="font-bold text-stone-800">{cafe.name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                      Your Role at {cafe.name}
                    </label>
                    <input
                      type="text"
                      value={claimRole}
                      onChange={(e) => setClaimRole(e.target.value)}
                      placeholder="e.g. Owner, Co-Owner, General Manager"
                      className="w-full h-11 px-3 rounded-xl border border-brand-border text-sm focus:border-brand-coffee focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                      className="w-full h-11 px-3 rounded-xl border border-brand-border text-sm focus:border-brand-coffee focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2.5">
                    <Button
                      type="submit"
                      disabled={isSubmittingClaim}
                      className="w-full h-11 bg-brand-coffee hover:bg-brand-coffee-dark text-white font-bold rounded-xl shadow-xs"
                    >
                      {isSubmittingClaim ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting Claim...
                        </>
                      ) : (
                        'Confirm & Submit Claim'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAutoClaimModal(false)}
                      className="w-full h-10 text-xs text-brand-muted hover:text-brand-charcoal"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Sidebar Sticky Area */}
            <aside className="space-y-8 lg:sticky lg:top-36 self-start">
              {/* Ownership & Claim Action Card */}
              <div className="p-8 rounded-[40px] border border-brand-border bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-cream flex items-center justify-center text-brand-coffee shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal leading-tight">
                      {cafe.claimStatus === 'MANAGED'
                        ? 'You Manage This Cafe'
                        : cafe.claimStatus === 'PENDING'
                        ? 'Claim Under Review'
                        : `Own or Manage ${cafe.name}?`}
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {cafe.claimStatus === 'MANAGED'
                        ? 'Manage your hours, menu, and community feedback.'
                        : cafe.claimStatus === 'PENDING'
                        ? 'Your ownership application is being verified.'
                        : 'Claim this verified listing to manage details and rewards.'}
                    </p>
                  </div>
                </div>

                {cafe.claimStatus === 'MANAGED' ? (
                  <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl h-11 font-bold">
                    <Link to={`/owner/cafes/${cafe.id}`}>Open Owner Dashboard</Link>
                  </Button>
                ) : cafe.claimStatus === 'PENDING' ? (
                  <Button asChild variant="outline" className="w-full border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-2xl h-11 font-bold">
                    <Link to="/owner/claims">View Claim Status</Link>
                  </Button>
                ) : cafe.claimStatus === 'AVAILABLE' ? (
                  <div className="space-y-2 pt-1">
                    <Button
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        } else {
                          setShowAutoClaimModal(true);
                        }
                      }}
                      className="w-full bg-brand-coffee hover:bg-brand-coffee-dark text-white rounded-2xl h-11 font-bold shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                      Auto-Claim This Cafe
                    </Button>
                    <Link
                      to={`/cafes/${cafe.slug}/claim`}
                      className="block text-center text-xs font-semibold text-brand-muted hover:text-brand-coffee transition-colors pt-1"
                    >
                      Or open full claim form &rarr;
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Quick Contact Card */}
              <div className="bg-brand-coffee-dark text-white rounded-[40px] p-10 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-serif font-bold text-brand-accent-warm">{t("cafe.visitUs")}</h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-brand-accent-warm mt-1 shrink-0" aria-hidden="true" />
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
                        aria-label={`${t("common.call")} ${cafe.phone}`}
                      >
                        <Phone className="w-5 h-5 text-brand-accent-warm shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium group-hover:text-brand-accent-warm transition-colors">{cafe.phone}</span>
                      </a>
                    )}
                    {cafe.email && (
                      <a 
                        href={`mailto:${cafe.email}`} 
                        className="flex items-center gap-4 group"
                        aria-label={`${t("auth.email")} ${cafe.email}`}
                      >
                        <Mail className="w-5 h-5 text-brand-accent-warm shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium group-hover:text-brand-accent-warm transition-colors truncate">{cafe.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-serif font-bold text-brand-accent-warm">{t("cafe.hours")}</h3>
                  <div className="space-y-3">
                    {Array.from({ length: 7 }, (_, i) => {
                      const dayIdx = (i + 1) % 7; // Mon-Sun (1, 2, 3, 4, 5, 6, 0)
                      const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(2021, 0, 4 + i));
                      const hours = cafe.hours?.find(h => h.dayOfWeek === dayIdx);
                      const isToday = new Date().getDay() === dayIdx;
                      
                      return (
                        <div key={dayName} className={cn(
                          "flex justify-between text-sm transition-colors",
                          isToday ? "text-brand-accent-warm font-bold scale-[1.02] origin-left" : "text-white/40 font-medium"
                        )}>
                          <span>{dayName}</span>
                          <span>{hours?.isClosed ? t("cafe.closed") : `${formatHourString(hours?.openTime || "")} - ${formatHourString(hours?.closeTime || "")}`}</span>
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
                          {t("common.website")}
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
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
                      <Navigation className="w-4 h-4" aria-hidden="true" />
                      {t("common.directions")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-14 border-brand-accent-warm/40 bg-brand-accent-warm/10 text-brand-accent-warm hover:bg-brand-accent-warm hover:text-white rounded-2xl gap-2 font-bold"
                      onClick={() => openContactModal({ category: 'GENERAL', source: 'CAFE_PROFILE' })}
                    >
                      <MessageCircleQuestion className="w-4 h-4" aria-hidden="true" />
                      Contact Cafe
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-14 rounded-2xl gap-2 font-bold transition-all",
                        isVisited 
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                          : "border-amber-400/30 bg-white/5 text-white hover:bg-white/10"
                      )}
                      onClick={handleClaimVisit}
                      disabled={isClaimingVisit}
                    >
                      {isClaimingVisit ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      ) : isVisited ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Coffee className="w-4 h-4 text-amber-300" />
                      )}
                      {isVisited ? 'Visited Cafe' : 'Claim Visited Cafe'}
                    </Button>
                </div>
              </div>
              
              {/* Featured In Lists */}
              {cafe.curatedLists && cafe.curatedLists.length > 0 && (
                <div className="p-8 rounded-[40px] border border-brand-border bg-white shadow-sm space-y-6" aria-labelledby="featured-in-heading">
                  <h3 id="featured-in-heading" className="text-xl font-serif font-bold text-brand-charcoal">{t("cafe.featuredIn")}</h3>
                  <div className="space-y-4">
                    {cafe.curatedLists.map(({ list }) => (
                      <Link 
                        key={list.id} 
                        to={`/lists/${list.slug}`}
                        className="flex items-center gap-4 group"
                        aria-label={`${t("common.viewDetails")} for ${list.title}`}
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-brand-border group-hover:border-brand-coffee transition-colors">
                          <img 
                            src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=80'} 
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-brand-charcoal group-hover:text-brand-coffee transition-colors leading-tight mb-1">
                            {list.title}
                          </h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{t("cafe.viewCollection")}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Card */}
              <div className="p-8 rounded-[40px] border border-brand-border bg-white shadow-sm space-y-6" aria-labelledby="location-heading">
                 <div className="flex items-center justify-between">
                    <h3 id="location-heading" className="text-xl font-serif font-bold text-brand-charcoal">{t("cafe.location")}</h3>
                    <div className="flex gap-2">
                      {cafe.instagram && (
                        <a 
                          href={cafe.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 bg-brand-cream rounded-full text-brand-coffee hover:bg-brand-coffee hover:text-white transition-all"
                          onClick={() => cafeService.trackInteraction(cafe.id, 'INSTAGRAM_CLICK')}
                          aria-label="Instagram"
                        >
                          <div className="flex gap-2">
                            <Instagram className="w-4 h-4" aria-hidden="true" />
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
                          aria-label="Facebook"
                        >
                          <Facebook className="w-4 h-4" aria-hidden="true" />
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
                        aria-label={t("accessibility.mapLabel")}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-brand-background">
                        <WifiOff className="h-10 w-10 text-brand-muted mb-4" aria-hidden="true" />
                        <p className="text-sm font-bold text-brand-charcoal">{t("cafe.mapUnavailableOffline")}</p>
                        <p className="text-xs text-brand-muted mt-2">{t("cafe.reconnectToViewMap")}</p>
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
