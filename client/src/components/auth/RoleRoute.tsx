import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { SEO } from '../common/SEO';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PrivateOfflineState } from '../pwa/PrivateOfflineState';
import { MainLayout } from '../layout/MainLayout';
import { PageContainer } from '../layout/PageContainer';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-coffee border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <MainLayout>
        <PageContainer>
          <PrivateOfflineState />
        </PageContainer>
      </MainLayout>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h1 className="text-4xl font-display font-bold text-brand-black mb-4">403 - Access Denied</h1>
        <p className="text-brand-muted mb-8 max-w-md">
          You do not have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-brand-coffee text-white rounded-full hover:bg-brand-coffee/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};

export default RoleRoute;
