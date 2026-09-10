import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Instagram, Facebook, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-amber-800 p-1.5 rounded-lg">
                <Coffee className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">CafeFinder</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Discovering the finest coffee shops in your city. From quiet study spots to bustling social hubs, we find the perfect brew for every ritual.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Discovery</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/explore" className="hover:text-white transition-colors">Popular Cafes</Link></li>
              <li><Link to="/explore" className="hover:text-white transition-colors">Newly Added</Link></li>
              <li><Link to="/explore" className="hover:text-white transition-colors">Study Spots</Link></li>
              <li><Link to="/explore" className="hover:text-white transition-colors">Pet Friendly</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Coffee Journal</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Newsletter</h4>
            <p className="text-sm mb-4">Get the latest cafe guides and coffee tips directly in your inbox.</p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Email address"
                className="bg-stone-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-amber-800"
              />
              <button className="bg-amber-800 text-white p-2 rounded-lg hover:bg-amber-700 transition-colors">
                <Mail className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-16 pt-8 text-xs text-center">
          <p>&copy; {new Date().getFullYear()} CafeFinder. All rights reserved. Built for coffee lovers.</p>
        </div>
      </div>
    </footer>
  );
}
