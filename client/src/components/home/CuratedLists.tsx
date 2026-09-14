import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coffee } from 'lucide-react';
import { motion } from 'motion/react';
import { listService } from '../../services/listService';
import { CuratedList } from '../../types';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const CuratedLists: React.FC = () => {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await listService.getFeatured(3);
        setLists(response.data);
      } catch (err) {
        setError('Unable to load curated lists.');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-12 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || lists.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-brand-black mb-4">Curated for You</h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Expertly picked collections of the best coffee shops for every occasion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {lists.map((list, index) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/lists/${list.slug}`} className="group block h-full">
                <Card className="relative overflow-hidden h-full min-h-[350px] flex flex-col justify-end p-8 border-none shadow-xl transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80'} 
                      alt={list.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/40 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-3 py-1 bg-brand-coffee/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {list._count.cafes} Cafes
                      </div>
                      {list.featured && (
                        <div className="px-3 py-1 bg-brand-accent/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Featured
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-brand-accent transition-colors">
                      {list.title}
                    </h3>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-6">
                      {list.description}
                    </p>
                    <div className="flex items-center gap-2 font-bold text-sm group-hover:gap-3 transition-all">
                      <span>View Collection</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
