import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cafeService } from '../../services/cafeService';
import { Cafe } from '../../types';
import { CafeCard } from '../cafe/CafeCard';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

export const TrendingCafes: React.FC = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cafeService.getTrending(4);
      setCafes(response.data);
    } catch (err) {
      setError('Unable to load trending cafes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-brand-background">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-brand-background">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <Button onClick={fetchTrending} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (cafes.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-brand-background">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-display font-bold text-brand-black mb-4">Trending Cafes</h2>
            <p className="text-brand-muted text-lg leading-relaxed">
              Popular spots people are discovering right now. Based on community ratings and popularity.
            </p>
          </div>
          <Link to="/explore?sort=popular">
            <Button variant="ghost" className="text-brand-coffee font-bold group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cafes.map((cafe, index) => (
            <motion.div
              key={cafe.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <CafeCard cafe={cafe} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
