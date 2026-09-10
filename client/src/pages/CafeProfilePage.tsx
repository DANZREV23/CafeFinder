import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CafeRating } from "@/components/cafe/CafeRating";
import { CafeLocation } from "@/components/cafe/CafeLocation";
import { CafeImage } from "@/components/cafe/CafeImage";
import { CafePrice } from "@/components/cafe/CafePrice";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { cafeService } from "@/services/api";
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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CafeProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [cafe, setCafe] = React.useState<Cafe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFavorited, setIsFavorited] = React.useState(false);

  React.useEffect(() => {
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

    fetchCafe();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (loading) {
    return (
      <MainLayout>
        <div className="h-96 bg-brand-border/20 animate-pulse" />
        <PageContainer className="py-12">
          <div className="max-w-4xl space-y-8">
            <div className="space-y-4">
              <div className="h-12 w-1/2 bg-brand-border/20 animate-pulse rounded" />
              <div className="h-6 w-1/4 bg-brand-border/20 animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 h-64 bg-brand-border/20 animate-pulse rounded-xl" />
              <div className="h-64 bg-brand-border/20 animate-pulse rounded-xl" />
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !cafe) {
    return (
      <MainLayout>
        <PageContainer className="py-24">
          <ErrorState description={error || "We couldn't find the cafe you're looking for."} />
        </PageContainer>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: cafe.name, href: `/cafes/${cafe.slug}` },
  ];

  return (
    <MainLayout>
      {/* Gallery Section */}
      <div className="bg-brand-cream/30">
        <PageContainer className="py-6">
           <nav className="flex items-center gap-1 text-xs text-brand-muted mb-6">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <Link to={crumb.href} className="hover:text-brand-coffee transition-colors">
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3" />
                )}
              </React.Fragment>
            ))}
          </nav>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[500px]">
            <div className="md:col-span-2 h-full">
              <CafeImage 
                src={cafe.photos?.find(p => p.isCover)?.url} 
                aspectRatio="auto" 
                className="h-full w-full rounded-2xl shadow-sm"
              />
            </div>
            <div className="hidden md:grid grid-rows-2 gap-4 md:col-span-1 h-full">
               <CafeImage 
                src={cafe.photos?.[1]?.url} 
                aspectRatio="auto" 
                className="h-full w-full rounded-2xl shadow-sm"
              />
               <CafeImage 
                src={cafe.photos?.[2]?.url} 
                aspectRatio="auto" 
                className="h-full w-full rounded-2xl shadow-sm"
              />
            </div>
            <div className="hidden md:block md:col-span-1 h-full">
               <CafeImage 
                src={cafe.photos?.[3]?.url} 
                aspectRatio="auto" 
                className="h-full w-full rounded-2xl shadow-sm"
              />
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <header className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {cafe.verified && (
                  <Badge variant="success" className="gap-1 px-3 py-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {cafe.featured && (
                   <Badge variant="accent" className="px-3 py-1">Featured</Badge>
                )}
                <CafePrice priceRange={cafe.priceRange} className="text-sm" />
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-serif text-brand-charcoal leading-tight">
                    {cafe.name}
                  </h1>
                  <div className="flex items-center gap-6">
                    <CafeRating rating={cafe.ratingAverage} reviewCount={cafe.reviewCount} className="scale-110 origin-left" />
                    <div className="flex items-center gap-2 text-brand-muted text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      {cafe.city}, {cafe.state}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant={isFavorited ? "primary" : "outline"} 
                    className={cn("h-12 px-6 gap-2", isFavorited && "bg-rose-500 hover:bg-rose-600")}
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </header>

            <div className="h-px bg-brand-border" />

            <section className="space-y-6">
              <h2 className="text-2xl font-serif text-brand-charcoal editorial-title">About this spot</h2>
              <p className="text-lg text-brand-muted font-sans leading-relaxed">
                {cafe.description}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-serif text-brand-charcoal">Amenities & Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cafe.amenities?.map((ca) => (
                  <div key={ca.amenityId} className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-white shadow-xs">
                    <div className="text-brand-coffee shrink-0">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-brand-charcoal">{ca.amenity.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Hours & Contact Card */}
            <div className="bg-brand-coffee-dark text-white rounded-3xl p-8 shadow-xl space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Clock className="h-5 w-5 text-brand-accent-warm" />
                  <h3 className="text-lg font-serif font-bold">Business Hours</h3>
                </div>
                <div className="space-y-4">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                    const hours = cafe.hours?.find(h => h.dayOfWeek === idx);
                    const isToday = new Date().getDay() === idx;
                    return (
                      <div key={day} className={cn(
                        "flex justify-between items-center text-sm",
                        isToday ? "text-brand-accent-warm font-bold" : "text-white/60 font-medium"
                      )}>
                        <span>{day}</span>
                        <span>
                          {hours?.isClosed ? "Closed" : `${hours?.openTime} - ${hours?.closeTime}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 pt-4">
                  <Phone className="h-5 w-5 text-brand-accent-warm" />
                  <h3 className="text-lg font-serif font-bold">Contact & Info</h3>
                </div>
                <div className="space-y-4 font-sans">
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Globe className="h-4 w-4 text-white/40 group-hover:text-brand-accent-warm transition-colors" />
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors underline decoration-white/10">
                      {cafe.website || "Visit website"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-white/40" />
                    <span className="text-sm text-white/80">{cafe.phone || "No phone listed"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-white/40" />
                    <span className="text-sm text-white/80">{cafe.email || "No email listed"}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full h-14 bg-brand-accent-warm hover:bg-brand-accent-warm/90 text-white rounded-xl gap-2 shadow-lg">
                <Navigation className="h-4 w-4" />
                Get Directions
              </Button>
            </div>

            {/* Address Details */}
            <div className="p-8 rounded-3xl border border-brand-border bg-white shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-brand-charcoal">Location</h3>
              <div className="text-sm text-brand-muted space-y-1">
                <p>{cafe.address}</p>
                <p>{cafe.city}, {cafe.state} {cafe.zipCode}</p>
              </div>
              <div className="aspect-square bg-brand-cream/50 rounded-2xl flex items-center justify-center border border-dashed border-brand-border">
                <span className="text-xs text-brand-muted font-medium">Map View Placeholder</span>
              </div>
            </div>
          </aside>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
