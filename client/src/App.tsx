import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import ExplorePage from '@/pages/ExplorePage';
import CafeProfilePage from '@/pages/CafeProfilePage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProfilePage from '@/pages/ProfilePage';
import FavoritesPage from '@/pages/FavoritesPage';
import AdminClaimsPage from '@/pages/AdminClaimsPage';
import SubmitCafePage from '@/pages/SubmitCafePage';
import MySubmissionsPage from '@/pages/MySubmissionsPage';
import SubmissionDetailsPage from '@/pages/SubmissionDetailsPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import { MainLayout } from './components/layout/MainLayout';

import { MapProvider } from './components/map/MapProvider';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MapProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/cafes/:slug" element={<CafeProfilePage />} />
            <Route path="/about" element={<PlaceholderPage title="About Us" />} />
            <Route path="/blog" element={<PlaceholderPage title="Coffee Journal" />} />
            <Route path="/submit-cafe" element={
              <ProtectedRoute>
                <SubmitCafePage />
              </ProtectedRoute>
            } />
            <Route path="/my-submissions" element={
              <ProtectedRoute>
                <MySubmissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/my-submissions/:id" element={
              <ProtectedRoute>
                <SubmissionDetailsPage />
              </ProtectedRoute>
            } />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PlaceholderPage title="User Dashboard" />
              </ProtectedRoute>
            } />
            
            <Route path="/owner" element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <PlaceholderPage title="Owner Portal" />
              </RoleRoute>
            } />
            
            <Route path="/admin/claims" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminClaimsPage />
              </RoleRoute>
            } />
            
            <Route path="/admin" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <PlaceholderPage title="Admin Dashboard" />
              </RoleRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
          </Routes>
        </MapProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
