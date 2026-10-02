import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Coffee, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  MapPin, 
  Wifi, 
  Users, 
  Star, 
  ArrowRight, 
  Award, 
  Compass, 
  CheckCircle2,
  Plug,
  Clock,
  BookOpen
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEO } from '@/components/common/SEO';

export default function AboutPage() {
  const values = [
    {
      icon: Coffee,
      title: 'Craft & Specialty First',
      description: 'We prioritize third-wave specialty roasters, passionate baristas, and independent coffee houses that take their beans and extractions seriously.'
    },
    {
      icon: Wifi,
      title: 'Real Work & Study Amenities',
      description: 'No more guessing whether a spot has reliable high-speed Wi-Fi, abundant electrical outlets, or comfortable ergonomics for deep focus sessions.'
    },
    {
      icon: ShieldCheck,
      title: 'Safe, Moderated Community',
      description: 'Every review and photo is monitored to uphold community guidelines. We prevent spam, manipulated rankings, and pay-to-win listing placements.'
    },
    {
      icon: Heart,
      title: 'Championing Local Owners',
      description: 'We give independent coffee shop owners free tools to claim their listings, update seasonal menus, showcase authentic photos, and respond to patrons.'
    }
  ];

  const standards = [
    {
      step: '01',
      title: 'Coffee & Extraction',
      description: 'Origin transparency, roasting dates, espresso balance, pour-over selections, and alternative milk offerings.'
    },
    {
      step: '02',
      title: 'Ambiance & Acoustics',
      description: 'Lighting quality, background music volume, seating comfort, layout flow, and conversational intimacy.'
    },
    {
      step: '03',
      title: 'Productivity Infrastructure',
      description: 'Measured internet stability, accessible wall sockets, table space, and work-friendly hours.'
    },
    {
      step: '04',
      title: 'Hospitality & Inclusivity',
      description: 'Welcoming service, pet-friendly patios, dietary accommodations, and accessibility for all visitors.'
    }
  ];

  const faqs = [
    {
      question: 'How do cafes get featured or recommended on CafeFinder?',
      answer: 'Our recommendations are entirely data-driven and community-powered. Rankings reflect real patron reviews, verified amenities, and traveler popularity. We never accept payment to feature a cafe.'
    },
    {
      question: 'I own a coffee shop. How can I manage my listing?',
      answer: 'You can claim your cafe for free through our Owner Portal. Once verified by our team, you can update business hours, menu items, photos, and directly answer customer feedback.'
    },
    {
      question: 'Can I submit a neighborhood cafe that is not listed yet?',
      answer: 'Absolutely! Our community thrives on local discoveries. Use the "Submit a Cafe" link in the menu to share your favorite hidden gems with fellow coffee lovers.'
    },
    {
      question: 'How do you prevent fake reviews and manipulated ratings?',
      answer: 'We employ automated text quality verification, duplicate submission filters, user session audits, and manual admin moderation to ensure all feedback is authentic and respectful.'
    }
  ];

  return (
    <MainLayout>
      <SEO 
        title="About Us - Our Mission & Coffee Community"
        description="Discover the story behind CafeFinder. We connect remote workers, students, and specialty coffee lovers with curated local cafes and transparent amenity details."
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-cream/50 border-b border-brand-border py-20 lg:py-28">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#5A3825_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <PageContainer className="relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-coffee/10 text-brand-coffee rounded-full text-xs font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5" />
              <span>The Independent Cafe Guide</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-charcoal tracking-tight leading-[1.15]">
              Connecting Coffee Lovers with Exceptional Spaces
            </h1>

            <p className="text-lg md:text-xl text-brand-muted font-sans leading-relaxed">
              CafeFinder was founded on a simple belief: the world is better when we slow down, savor a finely crafted cup of coffee, and gather in welcoming neighborhood spaces.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/explore">
                <Button size="lg" className="rounded-xl px-6 font-semibold flex items-center gap-2">
                  <span>Explore Cafes</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/submit-cafe">
                <Button variant="outline" size="lg" className="rounded-xl px-6 font-semibold">
                  Submit a Hidden Gem
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Origin Story Section */}
      <section className="py-20 bg-white border-b border-brand-border">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-coffee">
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal leading-tight">
                Born from the Search for the Perfect &quot;Third Place&quot;
              </h2>
              <div className="space-y-4 text-brand-muted leading-relaxed text-base">
                <p>
                  Sociologist Ray Oldenburg coined the concept of the <em>&quot;Third Place&quot;</em> — the social surroundings separate from the two usual environments of home and workplace. For millions of remote creators, students, and dreamers, coffee shops are exactly that sanctuary.
                </p>
                <p>
                  Yet too often, discovering a new cafe meant rolling the dice. Will the Wi-Fi actually work? Are there power outlets near the tables? Is the espresso properly calibrated, or is it bitter and over-extracted? Is the music comfortable for conversation?
                </p>
                <p>
                  We built <strong>CafeFinder</strong> to provide clarity. We look past the superficial aesthetic and document the concrete details coffee enthusiasts and mobile workers genuinely care about: roast profiles, acoustic vibes, seat comfort, and authentic local ownership.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-6 text-sm font-medium text-brand-charcoal">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Amenities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Unsponsored Rankings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real Patron Reviews</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl bg-brand-cream/80 p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-brand-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-coffee text-white flex items-center justify-center font-serif font-bold">
                      CF
                    </div>
                    <div>
                      <div className="font-bold text-brand-charcoal">The CafeFinder Standard</div>
                      <div className="text-xs text-brand-muted">What we evaluate in every coffee spot</div>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-brand-coffee" />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-brand-border/60 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-charcoal">Specialty Beans & Roasters</h4>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Transparency in bean origins, single-origin pour-overs, calibrated grinders, and master baristas.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-brand-border/60 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Plug className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-charcoal">Sockets & Stable Connectivity</h4>
                      <p className="text-xs text-brand-muted mt-0.5">
                        High-speed internet speed checks and outlet coverage so you can work without battery anxiety.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-brand-border/60 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-charcoal">Verified Hours & Menus</h4>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Direct sync with verified cafe owners ensures opening hours and seasonal specialty items are always accurate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Core Values Bento Grid */}
      <section className="py-20 bg-brand-cream/30 border-b border-brand-border">
        <PageContainer>
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-coffee">
              Our Principles
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal">
              Guided by Craft, Community & Transparency
            </h2>
            <p className="text-brand-muted text-base">
              Every feature we build serves one goal: helping people discover and support great independent coffee shops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Card key={i} className="p-6 bg-white border-brand-border flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-cream flex items-center justify-center text-brand-coffee">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal">
                      {v.title}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* Evaluation Framework Section */}
      <section className="py-20 bg-white border-b border-brand-border">
        <PageContainer>
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-coffee">
              The Framework
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal">
              How We Evaluate Coffee Spots
            </h2>
            <p className="text-brand-muted text-base">
              Our 4-part review matrix gives equal weight to craft, comfort, and hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {standards.map((s, i) => (
              <div key={i} className="space-y-3 relative">
                <div className="text-4xl font-serif font-bold text-brand-coffee/20">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-brand-charcoal">
                  {s.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* For Cafe Owners Section */}
      <section className="py-20 bg-brand-charcoal text-white">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-200">
                <Users className="w-3.5 h-3.5" />
                <span>For Independent Cafe Owners</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white">
                Showcase Your Cafe to Thousands of Coffee Lovers
              </h2>
              <p className="text-stone-300 leading-relaxed text-base max-w-xl">
                You pour your heart into every roast, espresso extraction, and welcoming interior. CafeFinder helps you connect with local patrons who truly value your craft.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-200">Free claim and verification</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-200">Full control over menus and hours</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-200">Direct replies to patron reviews</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-200">Rich visitor analytics</span>
                </div>
              </div>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link to="/owner">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl">
                    Claim or Register Your Cafe
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button variant="outline" size="lg" className="border-stone-700 text-white hover:bg-white/10 font-semibold rounded-xl">
                    Read Our Coffee Stories
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">Community First</h4>
                    <p className="text-xs text-stone-400">Zero predatory fees or sponsored placements</p>
                  </div>
                </div>
                <blockquote className="text-sm text-stone-300 italic leading-relaxed border-l-2 border-amber-500 pl-4 py-1">
                  &quot;CafeFinder brought us regular patrons who appreciate our pour-over bar and actually stay to work peacefully. It is the best thing that happened to our neighborhood shop.&quot;
                </blockquote>
                <div className="text-xs text-stone-400">
                  <strong className="text-white">Davao Specialty Roasters</strong> — Verified Cafe Partner
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-b border-brand-border">
        <PageContainer>
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-coffee">
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal">
              Frequently Asked Questions
            </h2>
            <p className="text-brand-muted text-base">
              Everything you need to know about our community guidelines and discovery tools.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="p-6 bg-brand-cream/30 border border-brand-border rounded-2xl space-y-2"
              >
                <h3 className="font-serif font-bold text-lg text-brand-charcoal">
                  {faq.question}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-brand-cream border-t border-brand-border text-center">
        <PageContainer>
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-serif font-bold text-brand-charcoal">
              Ready to Discover Your Next Favorite Cafe?
            </h2>
            <p className="text-brand-muted text-base">
              Filter by location, fast Wi-Fi, ambiance, and specialty brews. Join our community of passionate coffee explorers today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/explore">
                <Button size="lg" className="rounded-xl px-8 font-semibold">
                  Start Exploring Cafes
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="rounded-xl px-8 font-semibold">
                  Read Coffee Guides
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </MainLayout>
  );
}
