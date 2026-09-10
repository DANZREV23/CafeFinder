import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.js';
import { LoadingState, ErrorState } from '../components/States.js';
import { getCafeBySlug } from '../services/cafeService.js';
import { Cafe } from '../types/index.js';
import { MapPin, Phone, Globe, Star, Clock, Heart, Share2, CheckCircle, Wifi, Dog, Sun, Zap, Wind, Car, Coffee, Book, Laptop, VolumeX, Moon, Mail } from 'lucide-react';

export default function CafeProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCafe = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getCafeBySlug(slug);
        if (response.success) {
          setCafe(response.data);
        } else {
          setError(response.error?.message || 'Cafe not found');
        }
      } catch (err) {
        setError('Failed to load cafe details');
      } finally {
        setLoading(false);
      }
    };

    fetchCafe();
  }, [slug]);

  if (loading) return <MainLayout><LoadingState /></MainLayout>;
  if (error || !cafe) return <MainLayout><ErrorState message={error || 'Not found'} /></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {cafe.verified && (
                  <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </span>
                )}
                {cafe.trending && (
                  <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Trending</span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-stone-900 mb-4 tracking-tighter">{cafe.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-stone-500">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-stone-100 px-3 py-1.5 rounded-xl">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1.5" />
                    <span className="font-bold text-stone-900">{cafe.ratingAverage}</span>
                  </div>
                  <span className="text-sm font-medium underline decoration-stone-200">{cafe.reviewCount} Reviews</span>
                </div>
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-stone-400" />
                  <span>{cafe.address}, {cafe.city}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-2 bg-stone-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 active:scale-95">
                <Heart className="h-5 w-5" />
                <span>Favorite</span>
              </button>
              <button className="bg-white border border-stone-200 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <Share2 className="h-5 w-5 text-stone-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Gallery placeholder */}
            <div className="grid grid-cols-2 gap-4 h-[400px]">
              <div className="col-span-2 md:col-span-1 rounded-3xl overflow-hidden bg-stone-100">
                <img src={cafe.photos?.[0]?.url} className="w-full h-full object-cover" alt={cafe.name} referrerPolicy="no-referrer" />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-4">
                <div className="rounded-3xl overflow-hidden bg-stone-100">
                   <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80" className="w-full h-full object-cover" alt="Detail" referrerPolicy="no-referrer" />
                </div>
                <div className="rounded-3xl overflow-hidden bg-stone-100">
                   <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80" className="w-full h-full object-cover" alt="Interior" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight underline decoration-amber-200 decoration-4 underline-offset-8">About the cafe</h2>
              <p className="text-xl text-stone-600 leading-relaxed font-medium">
                {cafe.description}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cafe.amenities?.map((ca) => (
                  <div key={ca.amenityId} className="flex items-center space-x-3 bg-white border border-stone-100 p-4 rounded-2xl">
                    <div className="bg-stone-50 p-2 rounded-lg text-amber-800">
                      <AmenityIcon name={ca.amenity.name} />
                    </div>
                    <span className="font-bold text-stone-700 text-sm">{ca.amenity.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-stone-900 text-white rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-400" />
                Opening Hours
              </h3>
              <div className="space-y-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                  const hours = cafe.hours?.find(h => h.dayOfWeek === idx);
                  return (
                    <div key={day} className="flex justify-between items-center text-sm">
                      <span className={idx === new Date().getDay() ? 'font-bold text-amber-400' : 'text-stone-400'}>{day}</span>
                      <span className="font-medium">
                        {hours?.isClosed ? 'Closed' : `${hours?.openTime} - ${hours?.closeTime}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xl font-bold text-stone-900">Contact Info</h3>
              <div className="space-y-4 text-stone-600 font-medium">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-stone-400" />
                  <span>{cafe.phone || '(555) 012-3456'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-stone-400" />
                  <span>{cafe.website || 'www.cafefinder.com'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-stone-400" />
                  <span>{cafe.email || 'hello@cafe.com'}</span>
                </div>
              </div>
              <button className="w-full bg-amber-800 text-white py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function AmenityIcon({ name }: { name: string }) {
  switch (name) {
    case 'FAST_WIFI': return <Wifi className="h-5 w-5" />;
    case 'PET_FRIENDLY': return <Dog className="h-5 w-5" />;
    case 'OUTDOOR_SEATING': return <Sun className="h-5 w-5" />;
    case 'POWER_OUTLETS': return <Zap className="h-5 w-5" />;
    case 'AIR_CONDITIONING': return <Wind className="h-5 w-5" />;
    case 'PARKING': return <Car className="h-5 w-5" />;
    case 'STUDY_FRIENDLY': return <Book className="h-5 w-5" />;
    case 'WORK_FRIENDLY': return <Laptop className="h-5 w-5" />;
    case 'QUIET': return <VolumeX className="h-5 w-5" />;
    case 'LATE_NIGHT': return <Moon className="h-5 w-5" />;
    default: return <Coffee className="h-5 w-5" />;
  }
}
