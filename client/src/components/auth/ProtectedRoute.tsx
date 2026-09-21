import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../common/SEO';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PrivateOfflineState } from '../pwa/PrivateOfflineState';
import { MainLayout } from '../layout/MainLayout';
import { PageContainer } from '../layout/PageContainer';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
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

  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};

export default ProtectedRoute;
