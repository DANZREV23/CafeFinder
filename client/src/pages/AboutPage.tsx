import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coffee, MapPin, Users, Star, Heart, Search, CheckCircle, Mail } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEO } from '@/components/common/SEO';
import { Button } from '@/components/ui/Button';

const stats = [
  { value: '500+', label: 'Cafes Listed' },
  { value: '10k+', label: 'Coffee Lovers' },
  { value: '25+', label: 'Cities Covered' },
  { value: '4.8★', label: 'Average Rating' },
];

const values = [
  {
    icon: Search,
    title: 'Discover Authentically',
    description:
      'Every cafe on CafeFinder is hand-reviewed. No pay-to-rank, no fake reviews — just honest recommendations from real coffee lovers.',
  },
  {
    icon: Heart,
    title: 'Community First',
    description:
      'We are built on the experiences of locals. Your reviews, photos, and tips help other coffee lovers find their next favorite spot.',
  },
  {
    icon: MapPin,
    title: 'Rooted in the Philippines',
    description:
      'Starting in Mindanao, we are passionate about showcasing the incredible local cafe culture across the Philippines and beyond.',
  },
  {
    icon: CheckCircle,
    title: 'Owner Friendly',
    description:
      'We partner with cafe owners to keep listings accurate and up-to-date. Claim your listing, manage your info, and grow your audience.',
  },
];

const team = [
  {
    name: 'The CafeFinder Team',
    role: 'Builders & Coffee Drinkers',
    image: 'https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&q=80&w=400',
    bio: 'A small team of developers, designers, and coffee enthusiasts who got tired of not being able to find a good spot to work or catch up with friends.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function AboutPage() {
  return (
    <MainLayout>
      <SEO
        title="About Us"
        description="Learn about CafeFinder — our mission to help coffee lovers discover the best cafes across the Philippines."
      />

      {/* Hero */}
      <section className="relative bg-brand-background overflow-hidden py-28 px-4">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand-coffee/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-coffee/5 rounded-full blur-3xl pointer-events-none" />
        <PageContainer>
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 bg-brand-coffee/10 text-brand-coffee text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Coffee className="w-4 h-4" />
                Our Story
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-charcoal leading-tight mb-6">
                We help you find your <span className="text-brand-coffee">perfect cafe.</span>
              </h1>
              <p className="text-xl text-brand-muted leading-relaxed">
                CafeFinder started with a simple frustration — finding a great cafe with good Wi-Fi, quality coffee, and the right vibe shouldn't be this hard. So we built the tool we always wanted.
              </p>
            </motion.div>
          </div>
        </PageContainer>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-y border-brand-border">
        <PageContainer>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <p className="text-4xl font-serif font-bold text-brand-coffee">{stat.value}</p>
                <p className="text-sm font-semibold text-brand-muted uppercase tracking-widest mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Mission */}
      <section className="py-24 px-4">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal leading-tight mb-6">
                Our mission is to put great cafes on the map.
              </h2>
              <p className="text-lg text-brand-muted leading-relaxed mb-6">
                Too many incredible local cafes go undiscovered because they don't have the marketing budget of big chains. CafeFinder levels the playing field — giving every great cafe the chance to be found.
              </p>
              <p className="text-lg text-brand-muted leading-relaxed mb-10">
                We believe the best coffee experiences are local, personal, and community-driven. Our platform is built to celebrate that.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/explore">
                  <Button className="bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-full px-8 py-4 h-auto font-bold shadow-lg shadow-brand-coffee/10">
                    Start Exploring
                  </Button>
                </Link>
                <Link to="/submit-cafe">
                  <Button variant="outline" className="rounded-full px-8 py-4 h-auto font-bold border-brand-coffee text-brand-coffee hover:bg-brand-coffee/5">
                    Submit a Cafe
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80"
                  alt="Cozy cafe interior with warm lighting"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-coffee/5 rounded-3xl" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white px-6 py-4 rounded-2xl shadow-xl border border-brand-border/50 hidden md:flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-coffee/10 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-brand-coffee" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal">Community Reviewed</p>
                  <p className="text-xs text-brand-muted">Real people, honest opinions</p>
                </div>
              </div>
            </motion.div>
          </div>
        </PageContainer>
      </section>

      {/* Values */}
      <section className="py-24 px-4 bg-brand-background">
        <PageContainer>
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-brand-charcoal mb-4">What we stand for</h2>
            <p className="text-lg text-brand-muted max-w-xl mx-auto">
              These are the principles that guide every feature we build and every decision we make.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-8 border border-brand-border/50 shadow-sm"
                >
                  <div className="w-12 h-12 bg-brand-coffee/10 rounded-2xl flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-brand-coffee" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">{value.title}</h3>
                  <p className="text-brand-muted leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* Team */}
      <section className="py-24 px-4 bg-white">
        <PageContainer>
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-brand-charcoal mb-4">The people behind it</h2>
            <p className="text-lg text-brand-muted max-w-xl mx-auto">
              A small but passionate group who care deeply about coffee, community, and good design.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {team.map((member) => (
              <motion.div
                key={member.name}
                {...fadeUp}
                className="flex flex-col sm:flex-row items-center gap-8 bg-brand-background rounded-3xl p-8 border border-brand-border/50"
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xl font-serif font-bold text-brand-charcoal">{member.name}</p>
                  <p className="text-sm font-semibold text-brand-coffee uppercase tracking-widest mt-1 mb-3">{member.role}</p>
                  <p className="text-brand-muted leading-relaxed">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Contact CTA */}
      <section className="py-24 px-4 bg-brand-background border-t border-brand-border">
        <PageContainer>
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 bg-brand-coffee/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-brand-coffee" />
            </div>
            <h2 className="text-4xl font-serif font-bold text-brand-charcoal mb-4">Get in touch</h2>
            <p className="text-lg text-brand-muted mb-8">
              Have a question, a suggestion, or just want to say hello? We'd love to hear from you.
            </p>
            <a href="mailto:hello@cafefinder.ph">
              <Button className="bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-full px-10 py-4 h-auto font-bold shadow-lg shadow-brand-coffee/10">
                hello@cafefinder.ph
              </Button>
            </a>
          </motion.div>
        </PageContainer>
      </section>
    </MainLayout>
  );
}
