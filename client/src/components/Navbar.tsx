import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Coffee, Search, User, Bell, Heart } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Explore', href: '/explore' },
    { name: 'Cafes', href: '/explore' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-stone-900 p-1.5 rounded-lg group-hover:bg-amber-800 transition-colors">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-900">CafeFinder</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="h-4 w-px bg-stone-200 mx-2" />
            <Link to="/owner" className="text-amber-800 hover:text-amber-900 font-medium text-sm">
              For Owners
            </Link>
            <button
              onClick={() => navigate('/login')}
              className="bg-stone-900 text-white px-5 py-2 rounded-full font-medium hover:bg-stone-800 transition-all active:scale-95"
            >
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button className="text-stone-600 p-1">
              <Search className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-900 p-1 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/owner"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-50"
            >
              For Owners
            </Link>
            <div className="pt-4 pb-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/login');
                }}
                className="w-full bg-stone-900 text-white px-4 py-3 rounded-xl font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
