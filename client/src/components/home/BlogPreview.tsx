import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { motion } from 'motion/react';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const BlogPreview: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await blogService.getLatest(3);
        setPosts(response.data);
      } catch (err) {
        setError('Unable to load blog posts.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-24 px-4 bg-brand-background">
        <div className="container max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-brand-background">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-display font-bold text-brand-black mb-4">From the CafeFinder Journal</h2>
            <p className="text-brand-muted text-lg">
              Explore our latest guides, coffee tips, and local cafe deep-dives.
            </p>
          </div>
          <Link to="/blog">
            <Button variant="ghost" className="text-brand-coffee font-bold group">
              View All Guides
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`} className="group block h-full">
                <Card className="overflow-hidden h-full flex flex-col border-none shadow-xl group-hover:shadow-2xl transition-all">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={post.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80'} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-brand-coffee text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Coffee Journal
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-brand-muted mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{post.author.name}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-brand-black mb-3 group-hover:text-brand-coffee transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-brand-muted mb-6 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-brand-coffee group-hover:gap-3 transition-all">
                      <span>Read Guide</span>
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
