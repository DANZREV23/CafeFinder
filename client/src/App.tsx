import OwnerCafeEditPage from './pages/OwnerCafeEditPage';
import OwnerCafeHoursPage from './pages/OwnerCafeHoursPage';
import OwnerCafeAmenitiesPage from './pages/OwnerCafeAmenitiesPage';
import OwnerCafePhotosPage from './pages/OwnerCafePhotosPage';
import OwnerCafeReviewsPage from './pages/OwnerCafeReviewsPage';
import OwnerCafeMenuPage from './pages/OwnerCafeMenuPage';
import OwnerChangeRequestsPage from './pages/OwnerChangeRequestsPage';
import OwnerCafeLocationPage from './pages/OwnerCafeLocationPage';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import ExplorePage from '@/pages/ExplorePage';
import CafeProfilePage from '@/pages/CafeProfilePage';
import CafeMenuPage from '@/pages/CafeMenuPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProfilePage from '@/pages/ProfilePage';
import FavoritesPage from '@/pages/FavoritesPage';
import CafeClaimPage from '@/pages/CafeClaimPage';
import OwnerDashboardPage from '@/pages/OwnerDashboardPage';
import OwnerCafesPage from '@/pages/OwnerCafesPage';
import OwnerCafeDetailsPage from '@/pages/OwnerCafeDetailsPage';
import OwnerClaimsPage from '@/pages/OwnerClaimsPage';
import OwnerClaimDetailsPage from '@/pages/OwnerClaimDetailsPage';
import SubmitCafePage from '@/pages/SubmitCafePage';
import MySubmissionsPage from '@/pages/MySubmissionsPage';
import SubmissionDetailsPage from '@/pages/SubmissionDetailsPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import DashboardPage from './pages/DashboardPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminSubmissionDetailsPage } from './pages/admin/AdminSubmissionDetailsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminReviewDetailsPage } from './pages/admin/AdminReviewDetailsPage';
import { AdminCafesPage } from './pages/admin/AdminCafesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminActivityLogPage } from './pages/admin/AdminActivityLogPage';
import AdminOwnerClaimsPage from './pages/admin/AdminOwnerClaimsPage';
import AdminOwnerClaimDetailsPage from './pages/admin/AdminOwnerClaimDetailsPage';
import AdminChangeRequestsPage from './pages/admin/AdminChangeRequestsPage';
import AdminChangeRequestDetailsPage from './pages/admin/AdminChangeRequestDetailsPage';
import BlogListPage from './pages/blog/BlogListPage';
import BlogPostPage from './pages/blog/BlogPostPage';
import ListsPage from './pages/lists/ListsPage';
import ListPage from './pages/lists/ListPage';
import AdminBlogPage from './pages/admin/AdminBlogPage';
import AdminBlogPostEditPage from './pages/admin/AdminBlogPostEditPage';
import AdminListsPage from './pages/admin/AdminListsPage';
import AdminListEditPage from './pages/admin/AdminListEditPage';
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
            <Route path="/cafes/:slug/menu" element={<CafeMenuPage />} />
            <Route path="/cafes/:slug/claim" element={<ProtectedRoute><CafeClaimPage /></ProtectedRoute>} />
            <Route path="/about" element={<PlaceholderPage title="About Us" />} />
            
            {/* Blog Routes */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            
            {/* Curated Lists Routes */}
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:slug" element={<ListPage />} />

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
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/owner" element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerDashboardPage />
              </RoleRoute>
            } />
            <Route path="/owner/cafes" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafesPage /></RoleRoute>} />
            <Route path="/owner/cafes/:id" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeDetailsPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/edit" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeEditPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/location" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeLocationPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/hours" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeHoursPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/amenities" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeAmenitiesPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/photos" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafePhotosPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/menu" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeMenuPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/reviews" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeReviewsPage /></RoleRoute>} />
                        <Route path="/owner/cafes/:id/change-requests" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerChangeRequestsPage /></RoleRoute>} />
            <Route path="/owner/claims" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerClaimsPage /></RoleRoute>} />
            <Route path="/cafe-owner-claims/:id" element={<ProtectedRoute><OwnerClaimDetailsPage /></ProtectedRoute>} />
            
            <Route path="/admin" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="submissions" element={<AdminSubmissionsPage />} />
              <Route path="submissions/:id" element={<AdminSubmissionDetailsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="reviews/:id" element={<AdminReviewDetailsPage />} />
              <Route path="cafes" element={<AdminCafesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="activity" element={<AdminActivityLogPage />} />
              <Route path="claims" element={<AdminOwnerClaimsPage />} />
              <Route path="claims/:id" element={<AdminOwnerClaimDetailsPage />} />
                          <Route path="change-requests" element={<AdminChangeRequestsPage />} />
                          <Route path="change-requests/:id" element={<AdminChangeRequestDetailsPage />} />
              
              {/* Blog Management */}
              <Route path="blog" element={<AdminBlogPage />} />
              <Route path="blog/new" element={<AdminBlogPostEditPage />} />
              <Route path="blog/:id/edit" element={<AdminBlogPostEditPage />} />
              
              {/* List Management */}
              <Route path="lists" element={<AdminListsPage />} />
              <Route path="lists/new" element={<AdminListEditPage />} />
              <Route path="lists/:id/edit" element={<AdminListEditPage />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
          </Routes>
        </MapProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
