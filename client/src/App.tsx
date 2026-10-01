import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './components/map/MapProvider';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import { I18nProvider } from './i18n';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Loading Component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy Loaded Pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const CafeProfilePage = lazy(() => import('@/pages/CafeProfilePage'));
const CafeMenuPage = lazy(() => import('@/pages/CafeMenuPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('@/pages/CollectionDetailPage'));
const PublicCollectionPage = lazy(() => import('@/pages/PublicCollectionPage'));
const CafeClaimPage = lazy(() => import('@/pages/CafeClaimPage'));
const OwnerDashboardPage = lazy(() => import('@/pages/OwnerDashboardPage'));
const OwnerCafesPage = lazy(() => import('@/pages/OwnerCafesPage'));
const OwnerCafeDetailsPage = lazy(() => import('@/pages/OwnerCafeDetailsPage'));
const OwnerCafeEditPage = lazy(() => import('./pages/OwnerCafeEditPage'));
const OwnerCafeLocationPage = lazy(() => import('./pages/OwnerCafeLocationPage'));
const OwnerCafeHoursPage = lazy(() => import('./pages/OwnerCafeHoursPage'));
const OwnerCafeAmenitiesPage = lazy(() => import('./pages/OwnerCafeAmenitiesPage'));
const OwnerCafePhotosPage = lazy(() => import('./pages/OwnerCafePhotosPage'));
const OwnerCafeReviewsPage = lazy(() => import('./pages/OwnerCafeReviewsPage'));
const OwnerCafeAnalyticsPage = lazy(() => import('./pages/OwnerCafeAnalyticsPage'));
const OwnerCafeMenuPage = lazy(() => import('./pages/OwnerCafeMenuPage'));
const OwnerChangeRequestsPage = lazy(() => import('./pages/OwnerChangeRequestsPage'));
const OwnerCafeChangeRequestFormPage = lazy(() => import('./pages/OwnerCafeChangeRequestFormPage'));
const OwnerClaimsPage = lazy(() => import('./pages/OwnerClaimsPage'));
const OwnerClaimDetailsPage = lazy(() => import('./pages/OwnerClaimDetailsPage'));
const SubmitCafePage = lazy(() => import('./pages/SubmitCafePage'));
const MySubmissionsPage = lazy(() => import('./pages/MySubmissionsPage'));
const SubmissionDetailsPage = lazy(() => import('./pages/SubmissionDetailsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));const AboutPage = lazy(() => import('@/pages/AboutPage'));const BlogListPage = lazy(() => import('./pages/blog/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage'));
const ListsPage = lazy(() => import('./pages/lists/ListsPage'));
const ListPage = lazy(() => import('./pages/lists/ListPage'));
const OfflinePage = lazy(() => import('./pages/OfflinePage'));
const TimeSensitiveDirectoryPage = lazy(() => import('./pages/TimeSensitivePages').then(module => ({ default: module.TimeSensitiveDirectoryPage })));
const TimeSensitiveDetailPage = lazy(() => import('./pages/TimeSensitivePages').then(module => ({ default: module.TimeSensitiveDetailPage })));
const OwnerTimeSensitivePage = lazy(() => import('./pages/TimeSensitivePages').then(module => ({ default: module.OwnerTimeSensitivePage })));

// Admin Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminSubmissionsPage = lazy(() => import('./pages/admin/AdminSubmissionsPage').then(m => ({ default: m.AdminSubmissionsPage })));
const AdminSubmissionDetailsPage = lazy(() => import('./pages/admin/AdminSubmissionDetailsPage').then(m => ({ default: m.AdminSubmissionDetailsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminReviewDetailsPage = lazy(() => import('./pages/admin/AdminReviewDetailsPage').then(m => ({ default: m.AdminReviewDetailsPage })));
const AdminCafesPage = lazy(() => import('./pages/admin/AdminCafesPage').then(m => ({ default: m.AdminCafesPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminActivityLogPage = lazy(() => import('./pages/admin/AdminActivityLogPage').then(m => ({ default: m.AdminActivityLogPage })));
const AdminSystemPage = lazy(() => import('./pages/admin/AdminSystemPage').then(m => ({ default: m.AdminSystemPage })));
const AdminDeploymentsPage = lazy(() => import('./pages/admin/AdminDeploymentsPage').then(m => ({ default: m.AdminDeploymentsPage })));
const AdminDataIntegrityPage = lazy(() => import('./pages/admin/DataIntegrity').then(m => ({ default: m.DataIntegrity })));
const AdminMaintenanceJobsPage = lazy(() => import('./pages/admin/system/MaintenanceJobs').then(m => ({ default: m.MaintenanceJobs })));
const AdminOperationalAlertsPage = lazy(() => import('./pages/admin/system/OperationalAlerts').then(m => ({ default: m.OperationalAlerts })));
const AdminSecurityOverviewPage = lazy(() => import('./pages/admin/system/SecurityOverview').then(m => ({ default: m.SecurityOverview })));
const AdminRecommendationsPage = lazy(() => import('./pages/admin/AdminRecommendationsPage').then(m => ({ default: m.AdminRecommendationsPage })));
const AdminOwnerClaimsPage = lazy(() => import('./pages/admin/AdminOwnerClaimsPage'));
const AdminOwnerClaimDetailsPage = lazy(() => import('./pages/admin/AdminOwnerClaimDetailsPage'));
const AdminChangeRequestsPage = lazy(() => import('./pages/admin/AdminChangeRequestsPage'));
const AdminChangeRequestDetailsPage = lazy(() => import('./pages/admin/AdminChangeRequestDetailsPage'));
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'));
const AdminBlogPostEditPage = lazy(() => import('./pages/admin/AdminBlogPostEditPage'));
const AdminListsPage = lazy(() => import('./pages/admin/AdminListsPage'));
const AdminListEditPage = lazy(() => import('./pages/admin/AdminListEditPage'));
const AdminMediaLibraryPage = lazy(() => import('./pages/admin/AdminMediaLibraryPage').then(m => ({ default: m.AdminMediaLibraryPage })));
const AdminContentQualityPage = lazy(() => import('./pages/admin/AdminContentQualityPage').then(m => ({ default: m.AdminContentQualityPage })));
const AdminRedirectsPage = lazy(() => import('./pages/admin/AdminRedirectsPage').then(m => ({ default: m.AdminRedirectsPage })));
const AdminTestimonialsPage = lazy(() => import('./pages/admin/AdminTestimonialsPage').then(m => ({ default: m.AdminTestimonialsPage })));
const AdminTimeSensitivePage = lazy(() => import('./pages/admin/AdminTimeSensitivePage'));

export default function App() {
  return (
    <HelmetProvider>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <MapProvider>
              <Toaster position="top-center" />
              <Suspense fallback={<PageLoading />}>
                <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/cafes/:slug" element={<CafeProfilePage />} />
                <Route path="/cafes/:slug/menu" element={<CafeMenuPage />} />
                <Route path="/cafes/:slug/claim" element={<ProtectedRoute><CafeClaimPage /></ProtectedRoute>} />
                <Route path="/about" element={<AboutPage />} />
                
                {/* Blog Routes */}
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                
                {/* Curated Lists Routes */}
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/lists/:slug" element={<ListPage />} />
                <Route path="/collections/:slug" element={<PublicCollectionPage />} />
                <Route path="/events" element={<TimeSensitiveDirectoryPage kind="events" />} />
                <Route path="/events/:cafeSlug/:slug" element={<TimeSensitiveDetailPage kind="events" />} />
                <Route path="/specials" element={<TimeSensitiveDirectoryPage kind="specials" />} />
                <Route path="/specials/:cafeSlug/:slug" element={<TimeSensitiveDetailPage kind="specials" />} />
                <Route path="/announcements" element={<TimeSensitiveDirectoryPage kind="announcements" />} />
                <Route path="/announcements/:cafeSlug/:slug" element={<TimeSensitiveDetailPage kind="announcements" />} />

                <Route path="/offline" element={<OfflinePage />} />

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
                <Route path="/dashboard/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
                <Route path="/dashboard/collections/:slug" element={<ProtectedRoute><CollectionDetailPage /></ProtectedRoute>} />
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
                <Route path="/owner/events" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="events" /></RoleRoute>} />
                <Route path="/owner/events/new" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="events" /></RoleRoute>} />
                <Route path="/owner/events/:id/edit" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="events" /></RoleRoute>} />
                <Route path="/owner/specials" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="specials" /></RoleRoute>} />
                <Route path="/owner/specials/new" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="specials" /></RoleRoute>} />
                <Route path="/owner/specials/:id/edit" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="specials" /></RoleRoute>} />
                <Route path="/owner/announcements" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="announcements" /></RoleRoute>} />
                <Route path="/owner/announcements/new" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="announcements" /></RoleRoute>} />
                <Route path="/owner/announcements/:id/edit" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerTimeSensitivePage kind="announcements" /></RoleRoute>} />
                <Route path="/owner/cafes" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafesPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeDetailsPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/edit" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeEditPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/location" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeLocationPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/hours" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeHoursPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/amenities" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeAmenitiesPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/photos" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafePhotosPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/menu" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeMenuPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/reviews" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeReviewsPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/analytics" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeAnalyticsPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/change-requests" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerChangeRequestsPage /></RoleRoute>} />
                <Route path="/owner/cafes/:id/change-requests/new" element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']}><OwnerCafeChangeRequestFormPage /></RoleRoute>} />
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
                  <Route path="system" element={<AdminSystemPage />} />
                  <Route path="system/deployments" element={<AdminDeploymentsPage />} />
                  <Route path="system/integrity" element={<AdminDataIntegrityPage />} />
                  <Route path="system/jobs" element={<AdminMaintenanceJobsPage />} />
                  <Route path="system/alerts" element={<AdminOperationalAlertsPage />} />
                  <Route path="system/security" element={<AdminSecurityOverviewPage />} />
                  <Route path="system/recommendations" element={<AdminRecommendationsPage />} />
                  <Route path="claims" element={<AdminOwnerClaimsPage />} />
                  <Route path="claims/:id" element={<AdminOwnerClaimDetailsPage />} />
                  <Route path="change-requests" element={<AdminChangeRequestsPage />} />
                  <Route path="change-requests/:id" element={<AdminChangeRequestDetailsPage />} />
                  <Route path="time-sensitive" element={<AdminTimeSensitivePage />} />
                  
                  {/* Blog Management */}
                  <Route path="blog" element={<AdminBlogPage />} />
                  <Route path="blog/new" element={<AdminBlogPostEditPage />} />
                  <Route path="blog/:id/edit" element={<AdminBlogPostEditPage />} />
                  
                  {/* List Management */}
                  <Route path="lists" element={<AdminListsPage />} />
                  <Route path="lists/new" element={<AdminListEditPage />} />
                  <Route path="lists/:id/edit" element={<AdminListEditPage />} />

                  {/* New Content Management */}
                  <Route path="media" element={<AdminMediaLibraryPage />} />
                  <Route path="content/quality" element={<AdminContentQualityPage />} />
                  <Route path="redirects" element={<AdminRedirectsPage />} />
                  <Route path="testimonials" element={<AdminTestimonialsPage />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
              </Routes>
            </Suspense>
          </MapProvider>
        </AuthProvider>
      </BrowserRouter>
      </I18nProvider>
    </HelmetProvider>
  );
}
