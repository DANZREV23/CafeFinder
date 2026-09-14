import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Laptop, Trees, Dog, VolumeX, Users, Croissant, Leaf } from 'lucide-react';
import { motion } from 'motion/react';

const vibes = [
  { title: 'Coffee Lover', icon: Coffee, desc: 'For those who appreciate the craft of a perfect brew.', query: 'specialty' },
  { title: 'Work & Study', icon: Laptop, desc: 'Quiet spaces with fast Wi-Fi and plenty of outlets.', query: 'work' },
  { title: 'Outdoor', icon: Trees, desc: 'Fresh air, sunlight, and beautiful garden seating.', query: 'outdoor' },
  { title: 'Pet Friendly', icon: Dog, desc: 'Bring your furry friends along for your coffee break.', query: 'pet-friendly' },
  { title: 'Quiet & Cozy', icon: VolumeX, desc: 'Tucked away spots perfect for reading or solitude.', query: 'quiet' },
  { title: 'Social & Lively', icon: Users, desc: 'Great atmosphere for catching up with friends.', query: 'social' },
  { title: 'Coffee & Pastries', icon: Croissant, desc: 'Delicious bakes to pair with your favorite drink.', query: 'pastries' },
  { title: 'Vegan Friendly', icon: Leaf, desc: 'Plant-based options and alternative milks galore.', query: 'vegan' },
];

export const VibeExplorer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-brand-background overflow-hidden">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-display font-bold text-brand-black mb-4">What's Your Cafe Vibe?</h2>
            <p className="text-brand-muted text-lg">
              Every cafe has a unique soul. Find the atmosphere that matches your current mood.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vibes.map((vibe, index) => (
            <motion.button
              key={vibe.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/explore?search=${vibe.title}`)}
              className="flex flex-col items-start p-8 bg-white rounded-3xl border border-brand-border/50 text-left hover:shadow-2xl hover:shadow-brand-coffee/5 transition-all group"
            >
              <div className="w-12 h-12 bg-brand-background rounded-2xl flex items-center justify-center text-brand-coffee mb-6 group-hover:bg-brand-coffee group-hover:text-white transition-colors">
                <vibe.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-2">{vibe.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                {vibe.desc}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
