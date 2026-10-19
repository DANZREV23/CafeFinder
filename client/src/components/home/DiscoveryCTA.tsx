import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const DiscoveryCTA: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-brand-background border-t border-brand-border/40">
      <div className="container max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-brand-coffee to-brand-coffee-dark rounded-[2.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Interactive Cafe Map
            </div>

            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
              Ready to find your next favorite corner?
            </h2>

            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Filter by specialty brews, quiet study corners, fast Wi-Fi, or pet-friendly patios. Your ideal coffee experience is just a click away.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/explore">
                <Button className="bg-white text-brand-coffee hover:bg-stone-100 rounded-full px-8 py-4 h-auto font-bold shadow-lg cursor-pointer">
                  <Compass className="w-4 h-4 mr-2" />
                  Explore Cafes Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoveryCTA;
