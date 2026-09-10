import { Link } from "react-router-dom";
import { Coffee, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { PageContainer } from "./PageContainer";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-cream border-t border-brand-border pt-16 pb-24 lg:pb-16">
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-brand-coffee text-white p-1.5 rounded-lg">
                <Coffee className="h-5 w-5" />
              </div>
              <span className="text-xl font-serif font-bold text-brand-coffee-dark tracking-tight">
                CafeFinder
              </span>
            </Link>
            <p className="text-brand-muted text-sm leading-relaxed max-w-xs">
              Discover your next favorite coffee spot. Curated lists of the best local cafes for working, studying, or relaxing.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-brand-muted hover:text-brand-coffee transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-brand-muted hover:text-brand-coffee transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-brand-muted hover:text-brand-coffee transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Discover Col */}
          <div>
            <h4 className="font-serif font-bold text-brand-charcoal mb-6">Discover</h4>
            <ul className="space-y-4">
              <li><Link to="/explore" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Explore Cafes</Link></li>
              <li><Link to="/explore?filter=specialty" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Specialty Coffee</Link></li>
              <li><Link to="/explore?filter=work" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Best for Work</Link></li>
              <li><Link to="/lists" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Curated Lists</Link></li>
            </ul>
          </div>

          {/* Owners Col */}
          <div>
            <h4 className="font-serif font-bold text-brand-charcoal mb-6">For Owners</h4>
            <ul className="space-y-4">
              <li><Link to="/owner" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Claim Your Cafe</Link></li>
              <li><Link to="/submit-cafe" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Submit a Listing</Link></li>
              <li><Link to="/owner/dashboard" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Owner Dashboard</Link></li>
              <li><Link to="/owner/resources" className="text-sm text-brand-muted hover:text-brand-coffee transition-colors">Business Resources</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <h4 className="font-serif font-bold text-brand-charcoal mb-6">Stay Updated</h4>
            <p className="text-sm text-brand-muted mb-4">Get the latest coffee spot recommendations delivered to your inbox.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white border border-brand-border rounded-md px-3 py-2 text-sm w-full focus:outline-hidden focus:ring-2 focus:ring-brand-coffee/20"
              />
              <button className="bg-brand-coffee text-white p-2 rounded-md hover:bg-brand-coffee-dark transition-colors">
                <Mail className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-brand-muted">
            © {currentYear} CafeFinder. All rights reserved. Crafted for coffee lovers.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-brand-muted hover:text-brand-coffee transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-brand-muted hover:text-brand-coffee transition-colors">Terms of Service</Link>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
