import React from 'react';
import Navbar from '../components/Navbar.js';
import Footer from '../components/Footer.js';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 selection:bg-amber-100 selection:text-amber-900">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
