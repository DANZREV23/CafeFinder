import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Coffee, MapPin, Star, Share2, ChevronRight, Info } from 'lucide-react';
import { listService } from '../../services/listService';
import { CuratedList } from '../../types';
import { MainLayout } from '../../components/layout/MainLayout';
import { SEO } from '@/components/common/SEO';
import { ShareButtons } from '@/components/common/ShareButtons';
import { generateItemListJsonLd, generateBreadcrumbJsonLd } from '@/utils/seoUtils';

const ListPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<CuratedList | null>(null);
  const [otherLists, setOtherLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadList();
    }
  }, [slug]);

  const loadList = async () => {
    setLoading(true);
    try {
      const response = await listService.getBySlug(slug!);
      if (response.success) {
        setList(response.data);
        // Fetch other lists for the "Discover More" section
        const othersResponse = await listService.getAll({ limit: 4 });
        if (othersResponse.success) {
          setOtherLists(othersResponse.data.lists.filter((l: CuratedList) => l.slug !== slug));
        }
      } else {
        navigate('/lists');
      }
    } catch (error) {
      console.error('Failed to load curated list:', error);
      navigate('/lists');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium animate-pulse">Brewing your collection...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!list) return null;

  return (
    <MainLayout>
      <SEO 
        title={list.title}
        description={list.description}
        ogImage={list.coverImage}
        jsonLd={[
          generateItemListJsonLd(list),
          generateBreadcrumbJsonLd([
            { name: "Home", item: "/" },
            { name: "Collections", item: "/lists" },
            { name: list.title, item: `/lists/${list.slug}` }
          ])
        ]}
      />
      <div className="min-h-screen bg-neutral-50/50 pb-20">
        {/* Hero Header */}
        <div className="relative h-[450px] w-full overflow-hidden">
          <img
            src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80'}
            alt={list.coverImageAlt || list.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-7xl mx-auto w-full">
              <Link 
                to="/lists"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Collections
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary-500 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-widest">
                  Curated Collection
                </span>
                <span className="flex items-center gap-1.5 text-white/90 text-sm font-bold">
                  <Coffee className="w-4 h-4" />
                  {list.cafes?.length || 0} Spots
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                {list.title}
              </h1>
              
              <p className="text-white/80 text-xl max-w-2xl leading-relaxed font-medium">
                {list.description}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
            {/* Cafe List */}
            <div className="space-y-8">
              {list.cafes && list.cafes.length > 0 ? (
                list.cafes.map((item, idx) => (
                  <motion.div
                    key={item.cafeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100 group"
                  >
                    <div className="flex flex-col md:flex-row h-full md:h-64">
                      <div className="md:w-72 h-48 md:h-full relative overflow-hidden">
                        <img
                          src={item.cafe.photos?.[0]?.url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'}
                          alt={item.cafe.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xl font-black text-neutral-900 shadow-sm">
                          {idx + 1}
                        </div>
                      </div>

                      <div className="flex-1 p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <Link to={`/cafes/${item.cafe.slug}`}>
                            <h3 className="text-2xl font-black text-neutral-900 hover:text-primary-600 transition-colors">
                              {item.cafe.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-bold text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            {item.cafe.ratingAverage}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-500 text-sm font-medium mb-4">
                          <MapPin className="w-4 h-4" />
                          {item.cafe.address}, {item.cafe.city}
                        </div>

                        {item.editorialNote && (
                          <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100/50 mb-6 flex gap-3">
                            <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                            <p className="text-neutral-700 text-sm leading-relaxed italic">
                              "{item.editorialNote}"
                            </p>
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex gap-2">
                            {item.cafe.amenities?.slice(0, 3).map((a) => (
                              <span key={a.amenityId} className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                {a.amenity.name}
                              </span>
                            ))}
                          </div>
                          <Link
                            to={`/cafes/${item.cafe.slug}`}
                            className="flex items-center gap-1.5 text-primary-600 font-bold text-sm hover:gap-2.5 transition-all"
                          >
                            View Details
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
                  <p className="text-neutral-500 font-medium">No cafes added to this collection yet.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
                <h4 className="text-lg font-black text-neutral-900 mb-4">Share Collection</h4>
                <p className="text-neutral-500 text-sm mb-6">
                  Loved this collection? Share it with your coffee-loving friends!
                </p>
                <ShareButtons 
                  url={window.location.href}
                  title={list.title}
                />
              </div>

              {otherLists.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
                  <h4 className="text-lg font-black text-neutral-900 mb-6 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-primary-600" />
                    Discover More
                  </h4>
                  <div className="space-y-6">
                    {otherLists.slice(0, 3).map((other) => (
                      <Link 
                        key={other.id} 
                        to={`/lists/${other.slug}`}
                        className="group flex gap-4 items-center"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                          <img 
                            src={other.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80'} 
                            alt={other.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div>
                          <h5 className="font-bold text-neutral-900 line-clamp-2 text-sm leading-snug group-hover:text-primary-600 transition-colors">
                            {other.title}
                          </h5>
                          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">
                            {other._count?.cafes || 0} Spots
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/lists"
                    className="mt-8 flex items-center justify-center gap-2 text-neutral-500 hover:text-primary-600 font-bold text-sm transition-colors py-3 border-t border-neutral-50"
                  >
                    View All Collections
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </aside>
          </div>

          {/* Bottom Discover More Section */}
          {otherLists.length > 0 && (
            <div className="mt-20 pt-20 border-t border-neutral-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-3xl font-black text-neutral-900 mb-4">Discover More Collections</h2>
                  <p className="text-neutral-500 font-medium max-w-2xl">
                    Explore our other hand-picked guides to find your next favorite coffee spot across Mindanao and beyond.
                  </p>
                </div>
                <Link
                  to="/lists"
                  className="inline-flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-sm hover:gap-3 transition-all"
                >
                  Browse All Collections
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {otherLists.slice(0, 3).map((other, idx) => (
                  <motion.div
                    key={other.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="group"
                  >
                    <Link to={`/lists/${other.slug}`} className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-neutral-100 h-full">
                      <div className="aspect-[16/9] overflow-hidden relative">
                        <img
                          src={other.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'}
                          alt={other.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-neutral-900 uppercase tracking-widest shadow-sm">
                          {other._count?.cafes || 0} Spots
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-black text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                          {other.title}
                        </h3>
                        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">
                          {other.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default ListPage;
