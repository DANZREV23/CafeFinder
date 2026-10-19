import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Coffee, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/common/SEO';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PrivateOfflineState } from '../components/pwa/PrivateOfflineState';
import { MainLayout } from '../components/layout/MainLayout';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  const from = (location.state as any)?.from?.pathname || '/';

  if (!isOnline) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12">
          <div className="w-full max-w-md">
            <PrivateOfflineState
              title="Connection Required"
              description="Signing into your account requires an active internet connection."
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <SEO
        title="Sign In - CafeFinder"
        description="Log into your CafeFinder account to explore cafes, manage favorites, and claim rewards."
      />
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-coffee text-white mb-4 shadow-sm">
              <Coffee className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Welcome Back</h1>
            <p className="mt-2 text-stone-600 text-sm">
              Sign in to manage your favorites, cafes, and loyalty rewards
            </p>
          </div>

          <Card className="p-8 shadow-md border-brand-border bg-white rounded-2xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-brand-coffee hover:bg-brand-coffee-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Quick Sign-In Helpers */}
            <div className="mt-6 pt-5 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5 text-center">
                Demo Accounts (Password: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 font-mono">password123</code>)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('revero.b@agentsofvalue.com');
                    setPassword('password123');
                    setError(null);
                  }}
                  className="px-2.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 hover:bg-brand-cream/50 hover:border-brand-coffee/40 font-medium text-stone-700 transition text-center cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@cafefinder.local');
                    setPassword('password123');
                    setError(null);
                  }}
                  className="px-2.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 hover:bg-brand-cream/50 hover:border-brand-coffee/40 font-medium text-stone-700 transition text-center cursor-pointer"
                >
                  Cafe Owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('maria@example.com');
                    setPassword('password123');
                    setError(null);
                  }}
                  className="px-2.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 hover:bg-brand-cream/50 hover:border-brand-coffee/40 font-medium text-stone-700 transition text-center cursor-pointer"
                >
                  Customer
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 text-center">
              <p className="text-sm text-stone-600">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-semibold text-brand-coffee hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
