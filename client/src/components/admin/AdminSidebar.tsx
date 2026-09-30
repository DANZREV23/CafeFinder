import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coffee, 
  ShieldCheck,
  FileText, 
  Star, 
  Users, 
  History, 
  Settings,
  X,
  MapPin,
  ChevronRight,
  LayoutGrid,
  Activity,
  Rocket,
  Clock,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { useI18n } from '@/i18n';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard, path: '/admin' },
  { 
    id: 'moderation', 
    labelKey: 'admin.moderation', 
    type: 'group',
    items: [
      { id: 'submissions', labelKey: 'admin.submissions', icon: Coffee, path: '/admin/submissions' },
      { id: 'reviews', labelKey: 'admin.reviews', icon: Star, path: '/admin/reviews' },
          { id: 'claims', labelKey: 'admin.claims', icon: ShieldCheck, path: '/admin/claims' },
          { id: 'change-requests', labelKey: 'admin.changeRequests', icon: FileText, path: '/admin/change-requests' },
    ]
  },
  { 
    id: 'directory', 
    labelKey: 'admin.directory', 
    type: 'group',
    items: [
      { id: 'cafes', labelKey: 'admin.cafes', icon: MapPin, path: '/admin/cafes' },
    ]
  },
  { 
    id: 'users', 
    labelKey: 'admin.users', 
    type: 'group',
    items: [
      { id: 'user-list', labelKey: 'admin.userList', icon: Users, path: '/admin/users' },
    ]
  },
  { 
    id: 'content', 
    labelKey: 'admin.content', 
    type: 'group',
    items: [
      { id: 'blog', labelKey: 'admin.blog', icon: FileText, path: '/admin/blog' },
      { id: 'lists', labelKey: 'admin.lists', icon: LayoutGrid, path: '/admin/lists' },
      { id: 'testimonials', labelKey: 'admin.testimonials', icon: Star, path: '/admin/testimonials' },
      { id: 'media', labelKey: 'admin.mediaLibrary', icon: LayoutGrid, path: '/admin/media' },
      { id: 'quality', labelKey: 'admin.contentQuality', icon: ShieldCheck, path: '/admin/content/quality' },
      { id: 'redirects', labelKey: 'admin.redirects', icon: History, path: '/admin/redirects' },
    ]
  },
  { 
    id: 'system', 
    labelKey: 'admin.system', 
    type: 'group',
    items: [
      { id: 'overview', labelKey: 'admin.controlCenter', icon: Activity, path: '/admin/system', end: true },
      { id: 'alerts', labelKey: 'admin.alerts', icon: Bell, path: '/admin/system/alerts' },
      { id: 'jobs', labelKey: 'admin.jobs', icon: Clock, path: '/admin/system/jobs' },
      { id: 'deployments', labelKey: 'admin.deployments', icon: Rocket, path: '/admin/system/deployments' },
      { id: 'integrity', labelKey: 'admin.integrity', icon: ShieldCheck, path: '/admin/system/integrity' },
      { id: 'security', labelKey: 'admin.security', icon: ShieldCheck, path: '/admin/system/security' },
      { id: 'recommendations', labelKey: 'admin.recommendations', icon: Activity, path: '/admin/system/recommendations' },
      { id: 'activity', labelKey: 'admin.auditLogs', icon: History, path: '/admin/activity' },
      { id: 'settings', labelKey: 'admin.settings', icon: Settings, path: '/admin/settings' },
    ]
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100 w-64 shadow-xl">
      <div className="p-6 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">{t("admin.panel")}</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-stone-400 hover:text-white transition-colors"
          aria-label={t("common.close")}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar" aria-label="Admin sidebar">
        <ul className="space-y-6">
          {MENU_ITEMS.map((section) => (
            <li key={section.id}>
              {section.type === 'group' ? (
                <>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 px-3">
                    {t(section.labelKey)}
                  </h3>
                  <ul className="space-y-1">
                    {section.items?.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.comingSoon ? '#' : item.path}
                          end={item.end || item.path === '/admin'}
                          onClick={item.comingSoon ? (e) => e.preventDefault() : onClose}
                          className={({ isActive }) => clsx(
                            "flex items-center justify-between px-3 py-2 rounded-lg transition-all group",
                            isActive && !item.comingSoon ? "bg-amber-600 text-white" : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
                            item.comingSoon && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={clsx(
                              "w-5 h-5",
                              !item.comingSoon && "group-hover:text-amber-500 transition-colors"
                            )} aria-hidden="true" />
                            <span className="text-sm font-medium">{t(item.labelKey)}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="text-[10px] bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded uppercase font-bold">
                              Soon
                            </span>
                          )}
                          {!item.comingSoon && (
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <NavLink
                  to={section.path || '#'}
                  end={section.path === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                    isActive ? "bg-amber-600 text-white" : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                  )}
                >
                  <section.icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium">{t(section.labelKey)}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-stone-800">
        <div className="p-3 bg-stone-800/50 rounded-xl">
          <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-1">CafeFinder v2.0</p>
          <p className="text-xs text-stone-400">Moderation Dashboard</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
