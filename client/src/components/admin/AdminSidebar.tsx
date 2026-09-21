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
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { 
    id: 'moderation', 
    label: 'Moderation', 
    type: 'group',
    items: [
      { id: 'submissions', label: 'Cafe Submissions', icon: Coffee, path: '/admin/submissions' },
      { id: 'reviews', label: 'Reviews', icon: Star, path: '/admin/reviews' },
          { id: 'claims', label: 'Owner Claims', icon: ShieldCheck, path: '/admin/claims' },
          { id: 'change-requests', label: 'Cafe Change Requests', icon: FileText, path: '/admin/change-requests' },
    ]
  },
  { 
    id: 'directory', 
    label: 'Directory', 
    type: 'group',
    items: [
      { id: 'cafes', label: 'Cafes', icon: MapPin, path: '/admin/cafes' },
    ]
  },
  { 
    id: 'users', 
    label: 'Users', 
    type: 'group',
    items: [
      { id: 'user-list', label: 'User List', icon: Users, path: '/admin/users' },
    ]
  },
  { 
    id: 'content', 
    label: 'Content', 
    type: 'group',
    items: [
      { id: 'blog', label: 'Blog Articles', icon: FileText, path: '/admin/blog' },
      { id: 'lists', label: 'Curated Lists', icon: LayoutGrid, path: '/admin/lists' },
    ]
  },
  { 
    id: 'system', 
    label: 'System', 
    type: 'group',
    items: [
      { id: 'status', label: 'System Status', icon: Activity, path: '/admin/system' },
      { id: 'activity', label: 'Activity Logs', icon: History, path: '/admin/activity' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings', comingSoon: true },
    ]
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100 w-64 shadow-xl">
      <div className="p-6 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Admin Panel</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul className="space-y-6">
          {MENU_ITEMS.map((section) => (
            <li key={section.id}>
              {section.type === 'group' ? (
                <>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 px-3">
                    {section.label}
                  </h3>
                  <ul className="space-y-1">
                    {section.items?.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.comingSoon ? '#' : item.path}
                          end={item.path === '/admin'}
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
                            )} />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="text-[10px] bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded uppercase font-bold">
                              Soon
                            </span>
                          )}
                          {!item.comingSoon && (
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <section.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.label}</span>
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
