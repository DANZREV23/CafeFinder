import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Coffee,
  Star,
  Flag,
  Folder,
  ShieldCheck,
  FileText,
  Bell,
  MapPin,
  Award,
  Users,
  LayoutGrid,
  Image,
  Sparkles,
  RotateCcw,
  Activity,
  Clock,
  Rocket,
  Shield,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: string;
  isExternal?: boolean;
  disabled?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SIDEBAR_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'MODERATION',
    items: [
      { to: '/admin/submissions', label: 'Cafe Submissions', icon: Coffee },
      { to: '/admin/reviews', label: 'Reviews', icon: Star },
      { to: '/admin/review-reports', label: 'Review Reports', icon: Flag },
      { to: '/admin/collections', label: 'User Collections', icon: Folder },
      { to: '/admin/claims', label: 'Owner Claims', icon: ShieldCheck },
      { to: '/admin/change-requests', label: 'Cafe Change Requests', icon: FileText },
      { to: '/admin/inquiries', label: 'Customer Inquiries', icon: Bell },
    ],
  },
  {
    title: 'DIRECTORY',
    items: [
      { to: '/admin/cafes', label: 'Cafes', icon: MapPin },
      { to: '/admin/loyalty', label: 'Loyalty & Rewards', icon: Award },
    ],
  },
  {
    title: 'USERS',
    items: [
      { to: '/admin/users', label: 'User List', icon: Users },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { to: '/admin/blog', label: 'Blog Articles', icon: FileText },
      { to: '/admin/lists', label: 'Curated Lists', icon: LayoutGrid },
      { to: '/admin/testimonials', label: 'Testimonials', icon: Star },
      { to: '/admin/media', label: 'Media Library', icon: LayoutGrid },
      { to: '/admin/content/quality', label: 'Content Quality', icon: ShieldCheck },
      { to: '/admin/redirects', label: 'Redirects', icon: RotateCcw },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin/system', label: 'Control Center', icon: Activity, end: true },
      { to: '/admin/alerts', label: 'Operational Alerts', icon: Bell },
      { to: '/admin/jobs', label: 'Scheduled Jobs', icon: Clock },
      { to: '/admin/deployments', label: 'Deployment History', icon: Rocket },
      { to: '/admin/integrity', label: 'Data Integrity', icon: ShieldCheck },
      { to: '/admin/security', label: 'Security & Logs', icon: Shield },
      { to: '/admin/recommendations', label: 'Recommendations', icon: Sparkles },
      { to: '/admin/activity', label: 'Audit Logs', icon: RotateCcw },
      { to: '#', label: 'Settings', icon: Settings, badge: 'SOON', disabled: true },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#141210] text-[#a8a29e] flex flex-col transition-transform duration-200 ease-in-out border-r border-white/[0.05] shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] shrink-0">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center text-white shadow-sm shadow-orange-950/50 group-hover:bg-[#f97316] transition-colors">
              <Coffee className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight font-sans">
              Admin Panel
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
          {SIDEBAR_SECTIONS.map((section, sIdx) => (
            <div key={section.title || `section-${sIdx}`} className="space-y-0.5">
              {section.title && (
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#736b63] px-3 pt-3 pb-1.5 select-none font-mono">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                
                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-stone-500 opacity-60 cursor-not-allowed text-[13px] font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 text-stone-600" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#201d1a] text-stone-400 border border-white/5">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                }

                // Check active state
                const isItemActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) => {
                      const active = isActive || isItemActive;
                      return `flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors ${
                        active
                          ? 'bg-[#ea580c] text-white font-bold shadow-xs'
                          : 'text-[#d6d3d1] hover:text-white hover:bg-white/[0.04]'
                      }`;
                    }}
                  >
                    {({ isActive }) => {
                      const active = isActive || isItemActive;
                      return (
                        <>
                          <div className="flex items-center gap-3 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                active ? 'text-white stroke-[2.2]' : 'text-stone-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                active
                                  ? 'bg-black/30 text-white'
                                  : 'bg-[#201d1a] text-stone-400 border border-white/5'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      );
                    }}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Card as in the image */}
        <div className="p-3 shrink-0 border-t border-white/[0.06] space-y-2">
          <div className="p-3 rounded-xl bg-[#1b1816] border border-white/[0.06]">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
              CAFEFINDER V2.0
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">
              Moderation Dashboard
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-between text-xs font-semibold text-stone-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span>Exit to Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
