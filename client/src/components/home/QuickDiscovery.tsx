import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, BookOpen, Coffee, Trees, Dog, Zap, VolumeX, Cookie } from 'lucide-react';
import { motion } from 'motion/react';

const categories = [
  { label: 'Best Coffee', icon: Coffee, query: 'best-coffee', color: 'bg-orange-50 text-orange-600' },
  { label: 'Study Cafes', icon: BookOpen, query: 'study', color: 'bg-blue-50 text-blue-600' },
  { label: 'Fast Wi-Fi', icon: Wifi, query: 'fast-wifi', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Outdoor', icon: Trees, query: 'outdoor', color: 'bg-green-50 text-green-600' },
  { label: 'Pet Friendly', icon: Dog, query: 'pet-friendly', color: 'bg-purple-50 text-purple-600' },
  { label: 'Power Outlets', icon: Zap, query: 'outlets', color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Quiet Spots', icon: VolumeX, query: 'quiet', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Pastries', icon: Cookie, query: 'pastries', color: 'bg-pink-50 text-pink-600' },
];

export const QuickDiscovery: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-brand-black mb-4">Quick Discovery</h2>
          <p className="text-brand-muted">Find exactly what you need with our popular categories.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, index) => (
            <motion.button
              key={cat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/explore?search=${cat.label}`)}
              className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-brand-border/50 hover:border-brand-coffee/30 hover:shadow-xl hover:shadow-brand-coffee/5 transition-all group"
            >
              <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <cat.icon size={24} />
              </div>
              <span className="text-sm font-bold text-brand-black text-center whitespace-nowrap">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
