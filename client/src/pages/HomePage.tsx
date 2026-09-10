import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.js';
import { Coffee, MapPin, Search, Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80"
            alt="Hero"
            className="w-full h-full object-cover brightness-[0.4]"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              Discover your next <span className="text-amber-500">favorite</span> ritual.
            </h1>
            <p className="text-xl text-stone-200 mb-10 max-w-xl">
              CafeFinder is the definitive directory for specialty coffee, quiet workspaces, and local gems. Find the perfect brew for your lifestyle.
            </p>
            
            <div className="bg-white p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl">
              <div className="flex-grow flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-stone-100">
                <Search className="h-5 w-5 text-stone-400 mr-3" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="bg-transparent border-none focus:ring-0 w-full text-stone-900 placeholder:text-stone-400"
                />
              </div>
              <div className="flex-grow flex items-center px-4 py-2">
                <MapPin className="h-5 w-5 text-stone-400 mr-3" />
                <input
                  type="text"
                  placeholder="In which city?"
                  className="bg-transparent border-none focus:ring-0 w-full text-stone-900 placeholder:text-stone-400"
                />
              </div>
              <Link
                to="/explore"
                className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center"
              >
                Find Coffee
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-stone-900 mb-4 uppercase tracking-tighter">Browse by vibe</h2>
              <p className="text-stone-500">Find exactly the atmosphere you're looking for.</p>
            </div>
            <Link to="/explore" className="hidden md:flex items-center text-amber-800 font-bold hover:text-amber-900 transition-colors">
              Explore All <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Study Friendly', icon: '📖', color: 'bg-blue-50 text-blue-700' },
              { name: 'Pet Friendly', icon: '🐕', color: 'bg-green-50 text-green-700' },
              { name: 'Outdoor Seating', icon: '🌿', color: 'bg-amber-50 text-amber-700' },
              { name: 'Quiet Space', icon: '🤫', color: 'bg-purple-50 text-purple-700' },
            ].map((cat) => (
              <Link
                key={cat.name}
                to="/explore"
                className={`${cat.color} p-8 rounded-3xl flex flex-col items-center text-center hover:scale-105 transition-transform duration-300`}
              >
                <span className="text-4xl mb-4">{cat.icon}</span>
                <span className="font-black text-sm uppercase tracking-widest">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured CTA */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
                alt="Bg"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 max-w-xl">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Are you a cafe owner?</h2>
              <p className="text-xl text-stone-400 mb-10">
                Join our community of independent coffee shops and connect with thousands of local coffee enthusiasts. Claim your listing today.
              </p>
              <Link
                to="/owner"
                className="inline-block bg-amber-800 text-white px-10 py-5 rounded-2xl font-black hover:bg-amber-700 transition-all uppercase tracking-widest text-sm"
              >
                Claim Your Business
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
