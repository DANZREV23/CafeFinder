import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Coffee, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/common/SEO';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PrivateOfflineState } from '../components/pwa/PrivateOfflineState';

import { MainLayout } from '../components/layout/MainLayout';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  const from = (location.state as any)?.from?.pathname || '/';

  React.useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      const target = (from && from !== '/' && from !== '/login') 
        ? from 
        : (user.role === 'ADMIN' ? '/admin' : user.role === 'OWNER' ? '/owner' : '/');
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, authLoading, user, from, navigate]);

  if (!isOnline) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
          <div className="w-full max-w-md">
            <PrivateOfflineState 
              title="Connection Required" 
              description="Signing in requires an active internet connection to securely verify your credentials."
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const loggedUser = await login({ email, password });
      const target = (from && from !== '/' && from !== '/login') 
        ? from 
        : (loggedUser?.role === 'ADMIN' ? '/admin' : loggedUser?.role === 'OWNER' ? '/owner' : '/');
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <SEO title="Login" noindex={true} />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-brand-coffee rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-brand-coffee/20">
              <Coffee size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-brand-black mb-2 text-center">Welcome back</h1>
            <p className="text-brand-muted text-center max-w-xs">
              Sign in to continue discovering great coffee.
            </p>
          </div>

          <Card className="p-8 border-brand-border/50 shadow-xl shadow-brand-black/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-100 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-brand-black">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-brand-border focus:border-brand-coffee focus:ring-brand-coffee/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-brand-black">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 rounded-xl border-brand-border focus:border-brand-coffee focus:ring-brand-coffee/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-xl h-12 shadow-lg shadow-brand-coffee/10 group transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-border/50 text-center">
              <p className="text-sm text-brand-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-coffee font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
