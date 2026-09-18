import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Coffee, ArrowRight, Wifi, BookOpen, Trees, Dog, Zap, VolumeX, Cookie } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

const categories = [
  { label: 'Best Coffee', icon: Coffee, color: 'bg-orange-50 text-orange-600' },
  { label: 'Study Cafes', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  { label: 'Fast Wi-Fi', icon: Wifi, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Outdoor', icon: Trees, color: 'bg-green-50 text-green-600' },
  { label: 'Pet Friendly', icon: Dog, color: 'bg-purple-50 text-purple-600' },
  { label: 'Power Outlets', icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Quiet Spots', icon: VolumeX, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Pastries', icon: Cookie, color: 'bg-pink-50 text-pink-600' },
];

export const HeroSearch: React.FC = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 px-4 overflow-hidden bg-brand-background">
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
            <span>Your next favorite local coffee scene is just a click away!</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-[-0.02em] text-brand-black mb-6 leading-[0.9]">
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
          className="w-full max-w-3xl mx-auto"
        >
          <div className="bg-white p-2 rounded-full shadow-2xl shadow-brand-coffee/10 border border-brand-border/50 flex flex-row items-center mb-12">
            <div className="flex-1">
              <SearchInput
                placeholder="Search cafes, cities, or vibes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={() => handleSearch()}
                className="border-none shadow-none focus:ring-0 h-14"
                suggestionType="all"
                onSuggestionSelect={(s) => {
                  if (s.type === 'city') {
                    navigate(`/explore?city=${encodeURIComponent(s.label)}`);
                  } else if (s.type === 'cafe') {
                    navigate(`/cafes/${s.slug}`);
                  } else if (s.type === 'amenity') {
                    navigate(`/explore?search=${encodeURIComponent(s.label)}`);
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={() => handleSearch()}
              className="bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-full px-8 h-12 md:h-14 text-lg font-bold shadow-lg shadow-brand-coffee/20 group transition-all shrink-0 mr-1"
            >
              <span className="hidden md:inline">Find Coffee</span>
              <span className="md:hidden">Search</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/explore?search=${cat.label}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-border/50 hover:border-brand-coffee/30 hover:shadow-md transition-all group"
              >
                <div className={`w-6 h-6 ${cat.color} rounded-full flex items-center justify-center`}>
                  <cat.icon size={12} />
                </div>
                <span className="text-xs font-bold text-brand-black whitespace-nowrap">
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

