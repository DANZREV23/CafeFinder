import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { recommendationService } from '../../services/recommendationService';
import { Cafe } from '../../types';
import { CafeCard } from '../cafe/CafeCard';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';

export const RecommendedForYou: React.FC = () => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recommendationService.getPersonalized(4);
      if (response.success && response.data) {
        setCafes(response.data);
      }
    } catch (err) {
      setError('Unable to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-brand-surface/40 border-b border-brand-border/40">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div className="space-y-3">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-5 w-80" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[380px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || cafes.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-amber-500/[0.03] border-b border-brand-border/50">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{user ? `Personalized for ${user.name.split(' ')[0]}` : 'Smart Discovery'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-black mb-2">
              {user ? 'Recommended For You' : 'Curated Spot Recommendations'}
            </h2>
            <p className="text-brand-muted text-base leading-relaxed">
              {user 
                ? 'Matches tailored to your saved cafes, preferred amenities, and coffee taste.'
                : 'Popular top-rated coffee shops with high community approval and verified amenities.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link to="/profile">
                <Button variant="outline" size="sm" className="text-stone-700 border-stone-300 hover:bg-stone-100 gap-1.5 rounded-full text-xs font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                  Preferences
                </Button>
              </Link>
            )}
            <Link to="/explore?sort=recommended">
              <Button variant="ghost" size="sm" className="text-brand-coffee font-bold group">
                Explore More
                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cafes.map((cafe, index) => (
            <motion.div
              key={cafe.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <CafeCard cafe={cafe} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
