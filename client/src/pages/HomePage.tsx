import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSearch } from "@/components/layout/HeroSearch";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { PageContainer } from "@/components/layout/PageContainer";
import { CafeGrid, CafeGridSkeleton } from "@/components/cafe/CafeGrid";
import { CafeCard } from "@/components/cafe/CafeCard";
import { Button } from "@/components/ui/Button";
import { cafeService } from "@/services/api";
import { Cafe } from "@/types";
import { cn } from "@/lib/utils";
import { Coffee, Wifi, Plug, Dog, ArrowRight, Store, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [trendingCafes, setTrendingCafes] = React.useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCafes = async () => {
      try {
        const response = await cafeService.getAll({ trending: true, limit: 4 });
        if (response.success) {
          setTrendingCafes(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch trending cafes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCafes();
  }, []);

  const vibes = [
    { name: "Specialty Coffee", icon: Coffee, count: 24, color: "bg-orange-50 text-orange-700" },
    { name: "Study Friendly", icon: Coffee, count: 18, color: "bg-blue-50 text-blue-700" },
    { name: "Fast Wi-Fi", icon: Wifi, count: 15, color: "bg-purple-50 text-purple-700" },
    { name: "Pet Friendly", icon: Dog, count: 12, color: "bg-green-50 text-green-700" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-brand-cream/30">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-coffee/5 blur-3xl rounded-full -mr-24 -mt-24 pointer-events-none" />
        
        <PageContainer className="relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <span className="text-brand-accent-warm font-semibold text-xs tracking-widest uppercase mb-4 block">
              Discover Your Next Favorite Ritual
            </span>
            <h1 className="text-5xl md:text-7xl font-serif text-brand-charcoal mb-8 leading-[1.1]">
              The finest coffee spots, <br />
              <span className="editorial-title text-brand-coffee">handpicked</span> for you.
            </h1>
            <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-12 leading-relaxed">
              Find the perfect cafe for your mood, work style, and taste. Explore curated directories of specialty coffee shops and hidden gems.
            </p>
            
            <HeroSearch />
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">Popular:</span>
            {["Specialty", "Quiet", "Outdoor", "Work"].map((tag) => (
              <Link 
                key={tag} 
                to={`/explore?q=${tag}`}
                className="text-xs font-semibold text-brand-charcoal hover:text-brand-coffee transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Trending Now */}
      <section className="section-spacing bg-white">
        <PageContainer>
          <SectionHeading 
            title="Trending Now"
            eyebrow="Popular Picks"
            description="The most talked-about coffee shops in the community right now."
            action={{ label: "See all cafes", href: "/explore" }}
          />
          
          {isLoading ? (
            <CafeGridSkeleton />
          ) : (
            <CafeGrid>
              {trendingCafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </CafeGrid>
          )}
        </PageContainer>
      </section>

      {/* Explore by Vibe */}
      <section className="section-spacing bg-brand-cream/20">
        <PageContainer>
          <SectionHeading 
            title="Explore by Vibe"
            eyebrow="Curated Styles"
            description="Find exactly the atmosphere you're looking for, from quiet study corners to lively social hubs."
            centered
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {vibes.map((vibe) => (
              <Link
                key={vibe.name}
                to={`/explore?vibe=${vibe.name}`}
                className={cn(
                  "p-8 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105 border border-transparent hover:border-brand-border/50 bg-white shadow-xs hover:shadow-md",
                )}
              >
                <div className={cn("p-4 rounded-xl mb-4", vibe.color)}>
                  <vibe.icon className="h-6 w-6" />
                </div>
                <h4 className="font-serif font-bold text-brand-charcoal text-sm md:text-base mb-1">{vibe.name}</h4>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">{vibe.count} Spots</p>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Owner CTA */}
      <section className="section-spacing bg-white overflow-hidden">
        <PageContainer>
          <div className="bg-brand-charcoal rounded-[2rem] p-8 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full opacity-30 pointer-events-none">
               <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
                alt="Cafe Interior"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="relative z-10 lg:w-3/5 space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-white/90 text-xs font-semibold uppercase tracking-widest">
                <Store className="h-4 w-4 text-brand-accent-warm" />
                For Coffee Shop Owners
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-white leading-[1.1]">
                Connect with local <br />
                <span className="editorial-title text-brand-accent-warm">coffee lovers</span>.
              </h2>
              <p className="text-lg text-white/70 max-w-xl font-sans leading-relaxed">
                Join our community of independent coffee shops and hidden gems. Claim your listing to manage your profile, respond to reviews, and showcase your specialty brews.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/owner">
                  <Button variant="primary" size="lg" className="bg-brand-accent-warm hover:bg-brand-accent-warm/90">
                    Claim Your Business
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                    Learn how it works
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative z-10 lg:w-2/5 hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: "Reach New Customers", icon: ArrowRight },
                { label: "Verified Badge", icon: ShieldCheck },
                { label: "Menu Management", icon: Coffee },
                { label: "Analytics Insight", icon: ArrowRight }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col gap-3">
                  <item.icon className="h-5 w-5 text-brand-accent-warm" />
                  <span className="text-white text-sm font-medium leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Blog/Journal Section */}
      <section className="section-spacing bg-brand-cream/10">
        <PageContainer>
          <SectionHeading 
            title="The Coffee Journal"
            eyebrow="Editorial"
            description="Guides, interviews, and the latest trends from the world of specialty coffee."
            action={{ label: "Read more stories", href: "/blog" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "The Art of Slow Brewing", 
                category: "Technique", 
                image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
                date: "Sep 12, 2026"
              },
              { 
                title: "Hidden Gems of Davao", 
                category: "City Guide", 
                image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
                date: "Sep 10, 2026"
              },
              { 
                title: "Understanding Coffee Origins", 
                category: "Knowledge", 
                image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
                date: "Sep 08, 2026"
              }
            ].map((post, i) => (
              <Link key={i} to="/blog" className="group">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl mb-4">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                    <span className="text-brand-accent-warm">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-serif text-brand-charcoal group-hover:text-brand-coffee transition-colors">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>
    </MainLayout>
  );
}
