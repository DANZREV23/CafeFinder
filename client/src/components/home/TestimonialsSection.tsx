import React, { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { testimonialService } from '../../services/testimonialService';
import { Testimonial } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await testimonialService.getAll(3);
        setTestimonials(response.data);
      } catch (err) {
        setError('Unable to load testimonials.');
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-24 px-4 bg-white">
        <div className="container max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-12 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || testimonials.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-white overflow-hidden">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-brand-black mb-4">What Coffee Lovers Are Saying</h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Join thousands of coffee enthusiasts who use CafeFinder to discover their daily spots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-8 h-full bg-brand-background border-none shadow-xl flex flex-col">
                <Quote className="text-brand-coffee/20 mb-6" size={40} />
                <p className="text-brand-charcoal text-lg italic leading-relaxed mb-8 flex-grow">
                  "{item.content}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-coffee/10">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-coffee font-bold">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-black">{item.name}</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-brand-accent text-brand-accent" />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
