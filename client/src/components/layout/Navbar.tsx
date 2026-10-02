import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Coffee, Search, User, LogOut, LayoutDashboard, Settings, Heart, ShieldCheck, ClipboardList, PlusCircle, BarChart3, BookOpen, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "./PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { PWAInstallButton } from "../pwa/PWAInstallButton";
import { useI18n } from "@/i18n";

const navLinks = [
  { labelPath: "nav.home", href: "/" },
  { labelPath: "nav.explore", href: "/explore" },
  { labelPath: "nav.blog", href: "/blog" },
  { labelPath: "nav.about", href: "/about" },
];

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/DropdownMenu";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-b border-brand-border py-3" 
            : "bg-white py-5"
        )}
      >
        <PageContainer>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" aria-label={t("common.appName")}>
              <div className="bg-brand-coffee text-white p-1.5 rounded-lg transition-transform group-hover:scale-105" aria-hidden="true">
                <Coffee className="h-5 w-5" />
              </div>
              <span className="text-xl font-serif font-bold text-brand-coffee-dark tracking-tight">
                {t("common.appName")}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8" aria-label={t("accessibility.navigation")}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-coffee",
                    location.pathname === link.href ? "text-brand-coffee" : "text-brand-muted"
                  )}
                >
                  {t(link.labelPath)}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                className="p-2 text-brand-muted hover:text-brand-coffee transition-colors lg:hidden"
                aria-label={t("common.search")}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/owner" className="hidden lg:flex">
                  <Button variant="ghost" size="sm">{t("nav.ownerPortal")}</Button>
                </Link>
                
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="flex items-center gap-2 p-1 pl-3 bg-brand-background rounded-full border border-brand-border hover:border-brand-coffee transition-all focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                        aria-label={t("nav.profile")}
                      >
                        <span className="text-sm font-medium text-brand-charcoal hidden md:block">
                          {user?.name.split(' ')[0]}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-brand-coffee text-white flex items-center justify-center overflow-hidden" aria-hidden="true">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                      <DropdownMenuLabel>{t("nav.profile")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex w-full items-center gap-2">
                          <LayoutDashboard size={16} className="text-brand-muted" aria-hidden="true" />
                          {t("nav.dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-submissions" className="flex w-full items-center gap-2">
                          <ClipboardList size={16} className="text-brand-muted" aria-hidden="true" />
                          My Submissions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/favorites" className="flex w-full items-center gap-2">
                          <Heart size={16} className="text-brand-muted" aria-hidden="true" />
                          Saved Cafes
                        </Link>
                      </DropdownMenuItem>
                      {(user?.role === "OWNER" || user?.role === "ADMIN") && (
                        <DropdownMenuItem asChild>
                          <Link to="/owner" className="flex w-full items-center gap-2">
                            <BarChart3 size={16} className="text-brand-muted" aria-hidden="true" />
                            {t("nav.ownerPortal")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user?.role === "ADMIN" && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex w-full items-center gap-2">
                            <ShieldCheck size={16} className="text-brand-muted" aria-hidden="true" />
                            {t("nav.adminPanel")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex w-full items-center gap-2">
                          <Settings size={16} className="text-brand-muted" aria-hidden="true" />
                          {t("nav.profile")}
                        </Link>
                      </DropdownMenuItem>
                      <div className="px-2 py-1.5" role="none">
                        <PWAInstallButton className="w-full justify-start h-8 px-2 text-xs" variant="ghost" />
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onSelect={handleLogout}
                        className="text-red-600 focus:bg-red-50 focus:text-red-600"
                      >
                        <LogOut size={16} className="mr-2" aria-hidden="true" />
                        {t("nav.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login">
                      <Button variant="ghost" size="sm">{t("nav.login")}</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="primary" size="sm">{t("nav.register")}</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 text-brand-charcoal"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? t("accessibility.closeMenu") : t("accessibility.openMenu")}
              >
                {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-brand-charcoal/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute top-0 left-0 right-0 bg-white border-b border-brand-border pt-24 pb-8 px-6 shadow-xl">
              <nav className="flex flex-col gap-6" aria-label={t("accessibility.navigation")}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-xl font-serif transition-colors",
                      location.pathname === link.href ? "text-brand-coffee font-semibold" : "text-brand-charcoal"
                    )}
                  >
                    {t(link.labelPath)}
                  </Link>
                ))}
                <div className="h-px bg-brand-border my-2" aria-hidden="true" />
                
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <LayoutDashboard size={20} className="text-brand-coffee" aria-hidden="true" />
                      {t("nav.dashboard")}
                    </Link>
                    <Link to="/my-submissions" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <ClipboardList size={20} className="text-brand-coffee" aria-hidden="true" />
                      My Submissions
                    </Link>
                    <Link to="/favorites" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <Heart size={20} className="text-brand-coffee" aria-hidden="true" />
                      Saved Cafes
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link to="/admin" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                        <ShieldCheck size={20} className="text-brand-coffee" aria-hidden="true" />
                        {t("nav.adminPanel")}
                      </Link>
                    )}
                    <Link to="/profile" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <Settings size={20} className="text-brand-coffee" aria-hidden="true" />
                      {t("nav.profile")}
                    </Link>
                    <div className="py-2" role="none">
                      <PWAInstallButton className="w-full justify-start h-12 rounded-xl" variant="outline" />
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-lg font-medium text-red-600 flex items-center gap-2"
                    >
                      <LogOut size={20} aria-hidden="true" />
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/owner" className="text-lg font-medium text-brand-muted">{t("nav.ownerPortal")}</Link>
                    <Link to="/submit-cafe" className="text-lg font-medium text-brand-muted">{t("nav.submitCafe")}</Link>
                    <div className="flex flex-col gap-3 mt-4">
                      <Link to="/login">
                        <Button fullWidth variant="outline">{t("nav.login")}</Button>
                      </Link>
                      <Link to="/register">
                        <Button fullWidth>{t("nav.register")}</Button>
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacing for fixed header */}
      <div className="h-[72px] md:h-[84px]" />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-brand-border pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <Link to="/" className={cn(
            "flex flex-col items-center gap-1 min-w-[50px]",
            location.pathname === "/" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <Coffee className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/explore" className={cn(
            "flex flex-col items-center gap-1 min-w-[50px]",
            location.pathname === "/explore" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>
          <Link to="/blog" className={cn(
            "flex flex-col items-center gap-1 min-w-[50px]",
            location.pathname.startsWith("/blog") ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] font-medium">Blog</span>
          </Link>
          <Link to="/about" className={cn(
            "flex flex-col items-center gap-1 min-w-[50px]",
            location.pathname === "/about" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <Info className="h-5 w-5" />
            <span className="text-[10px] font-medium">About</span>
          </Link>
          <Link to={isAuthenticated ? "/profile" : "/login"} className={cn(
            "flex flex-col items-center gap-1 min-w-[50px]",
            location.pathname === "/profile" || location.pathname === "/login" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
        </div>
      </div>
    </>
  );
}
