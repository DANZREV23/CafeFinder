import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Coffee, Search, User, LogOut, LayoutDashboard, Settings, Heart, ShieldCheck, ClipboardList, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "./PageContainer";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Journal", href: "/blog" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
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
    setIsUserMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
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
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-brand-coffee text-white p-1.5 rounded-lg transition-transform group-hover:scale-105">
                <Coffee className="h-5 w-5" />
              </div>
              <span className="text-xl font-serif font-bold text-brand-coffee-dark tracking-tight">
                CafeFinder
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-coffee",
                    location.pathname === link.href ? "text-brand-coffee" : "text-brand-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button className="p-2 text-brand-muted hover:text-brand-coffee transition-colors lg:hidden">
                <Search className="h-5 w-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/owner" className="hidden lg:flex">
                  <Button variant="ghost" size="sm">For Owners</Button>
                </Link>
                
                {isAuthenticated ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1 pl-3 bg-brand-background rounded-full border border-brand-border hover:border-brand-coffee transition-all"
                    >
                      <span className="text-sm font-medium text-brand-charcoal hidden md:block">
                        {user?.name.split(' ')[0]}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-brand-coffee text-white flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-white border border-brand-border rounded-xl shadow-xl py-2 overflow-hidden"
                        >
                          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-background transition-colors">
                            <LayoutDashboard size={16} className="text-brand-muted" />
                            Dashboard
                          </Link>
                          <Link to="/my-submissions" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-background transition-colors">
                            <ClipboardList size={16} className="text-brand-muted" />
                            My Submissions
                          </Link>
                          <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-background transition-colors">
                            <Heart size={16} className="text-brand-muted" />
                            Saved Cafes
                          </Link>
                          {user?.role === "ADMIN" && (
                            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-background transition-colors">
                              <ShieldCheck size={16} className="text-brand-muted" />
                              Admin Portal
                            </Link>
                          )}
                          <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-background transition-colors">
                            <Settings size={16} className="text-brand-muted" />
                            Account
                          </Link>
                          <div className="h-px bg-brand-border my-1" />
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login">
                      <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="primary" size="sm">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 text-brand-charcoal"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-xl font-serif transition-colors",
                      location.pathname === link.href ? "text-brand-coffee font-semibold" : "text-brand-charcoal"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-px bg-brand-border my-2" />
                
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <LayoutDashboard size={20} className="text-brand-coffee" />
                      Dashboard
                    </Link>
                    <Link to="/my-submissions" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <ClipboardList size={20} className="text-brand-coffee" />
                      My Submissions
                    </Link>
                    <Link to="/favorites" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <Heart size={20} className="text-brand-coffee" />
                      Saved Cafes
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link to="/admin" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                        <ShieldCheck size={20} className="text-brand-coffee" />
                        Admin Portal
                      </Link>
                    )}
                    <Link to="/profile" className="text-lg font-medium text-brand-charcoal flex items-center gap-2">
                      <Settings size={20} className="text-brand-coffee" />
                      Account Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="text-lg font-medium text-red-600 flex items-center gap-2"
                    >
                      <LogOut size={20} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/owner" className="text-lg font-medium text-brand-muted">For Owners</Link>
                    <Link to="/submit-cafe" className="text-lg font-medium text-brand-muted">Submit a Cafe</Link>
                    <div className="flex flex-col gap-3 mt-4">
                      <Link to="/login">
                        <Button fullWidth variant="outline">Sign In</Button>
                      </Link>
                      <Link to="/register">
                        <Button fullWidth>Create Account</Button>
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
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={cn(
            "flex flex-col items-center gap-1",
            location.pathname === "/" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <Coffee className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/explore" className={cn(
            "flex flex-col items-center gap-1",
            location.pathname === "/explore" ? "text-brand-coffee" : "text-brand-muted"
          )}>
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>
          <Link to={isAuthenticated ? "/profile" : "/login"} className={cn(
            "flex flex-col items-center gap-1",
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
