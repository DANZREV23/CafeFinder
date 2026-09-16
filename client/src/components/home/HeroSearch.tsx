import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Coffee, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const HeroSearch: React.FC = () => {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('city', location);
    
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-32 px-4 overflow-hidden bg-brand-background">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-coffee/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-5xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-coffee/10 text-brand-coffee text-sm font-bold rounded-full uppercase tracking-wider mb-6">
            <Coffee size={16} />
            <span>Discover Your Local Coffee Scene</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-[-0.06em] text-brand-black mb-6 leading-[0.9]">
            Find your next <br />
            <span className="text-brand-coffee">favorite cafe.</span>
          </h1>
          
          <p className="text-xl text-brand-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover great coffee, cozy spaces, fast Wi-Fi, and local favorites near you. Your perfect spot is just a search away.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto"
        >
          <form 
            onSubmit={handleSearch}
            className="bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl shadow-brand-coffee/10 border border-brand-border/50 flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 relative flex items-center px-4 border-b md:border-b-0 md:border-r border-brand-border/50 pb-2 md:pb-0">
              <Search className="text-brand-muted shrink-0 mr-3" size={20} />
              <input
                type="text"
                placeholder="Search cafes, coffee, vibes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-3 bg-transparent border-none focus:ring-0 text-brand-black placeholder:text-brand-muted text-lg"
              />
            </div>
            
            <div className="flex-1 relative flex items-center px-4 pb-2 md:pb-0">
              <MapPin className="text-brand-muted shrink-0 mr-3" size={20} />
              <input
                type="text"
                placeholder="Search by city or neighborhood"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full py-3 bg-transparent border-none focus:ring-0 text-brand-black placeholder:text-brand-muted text-lg"
              />
            </div>
            
            <Button 
              type="submit"
              className="bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-xl md:rounded-full px-8 py-4 h-auto text-lg font-bold shadow-lg shadow-brand-coffee/20 group transition-all"
            >
              Search
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <p className="text-sm font-bold text-brand-muted uppercase tracking-wider">Popular Searches:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Study Cafes', 'Best Coffee', 'Quiet Spots', 'Pet Friendly'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/explore?search=${tag}`)}
                  className="text-sm font-medium text-brand-black hover:text-brand-coffee transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
