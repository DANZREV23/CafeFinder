import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import ExplorePage from './pages/ExplorePage.js';
import CafeProfilePage from './pages/CafeProfilePage.js';
import PlaceholderPage from './pages/PlaceholderPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/cafes/:slug" element={<CafeProfilePage />} />
        <Route path="/about" element={<PlaceholderPage title="About Us" />} />
        <Route path="/blog" element={<PlaceholderPage title="Coffee Journal" />} />
        <Route path="/submit-cafe" element={<PlaceholderPage title="Submit a Cafe" />} />
        <Route path="/login" element={<PlaceholderPage title="Sign In" />} />
        <Route path="/register" element={<PlaceholderPage title="Create Account" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="User Dashboard" />} />
        <Route path="/owner" element={<PlaceholderPage title="Owner Portal" />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin Dashboard" />} />
        
        {/* Fallback */}
        <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}
