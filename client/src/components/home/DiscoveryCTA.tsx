import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

export const DiscoveryCTA: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-brand-charcoal text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-coffee/10 -skew-x-12 translate-x-1/4 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-coffee/30 text-brand-accent text-xs font-bold rounded-full uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              <span>Personalized Discovery</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
              Your next favorite <br />
              cafe is <span className="text-brand-accent italic">waiting.</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 max-w-xl leading-relaxed">
              Explore local coffee shops, hidden gems, and community favorites. Filter by vibe, coffee type, or amenities to find your perfect spot.
            </p>
            
            <Link to="/explore">
              <Button className="bg-brand-accent text-brand-charcoal hover:bg-brand-accent/90 rounded-full px-10 py-5 h-auto text-lg font-bold shadow-xl shadow-brand-accent/20 group transition-all">
                Explore All Cafes
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-brand-coffee/20 rounded-3xl -rotate-6 scale-105" />
              <img 
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80" 
                alt="Cafe Interior"
                className="w-full h-full object-cover rounded-3xl shadow-2xl relative z-10 rotate-3 transition-transform hover:rotate-0 duration-500"
              />
              
              {/* Floating Element */}
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-2xl z-20 max-w-[200px] text-brand-charcoal animate-bounce-slow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-brand-success/10 rounded-full flex items-center justify-center text-brand-success">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Top Rated</span>
                </div>
                <p className="text-sm font-bold">"Best coffee I've had in the city!"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
