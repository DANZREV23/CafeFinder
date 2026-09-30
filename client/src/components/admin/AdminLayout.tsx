import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useI18n } from '@/i18n';
import { SkipLink } from '../ui/SkipLink';

export const AdminLayout: React.FC = () => {
  const { t } = useI18n();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <SkipLink />
      {/* Sidebar Navigation */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          <Outlet />
        </main>
        
        <footer className="py-6 px-8 text-center border-t border-stone-200" aria-labelledby="admin-footer-heading">
          <h2 id="admin-footer-heading" className="sr-only">{t("accessibility.footer")}</h2>
          <p className="text-xs text-stone-500">
            &copy; {new Date().getFullYear()} {t("common.appName")}. All rights reserved. 
            <span className="mx-2 font-medium">|</span> 
            Moderation Dashboard v2.1
          </p>
        </footer>
      </div>
    </div>
  );
};
