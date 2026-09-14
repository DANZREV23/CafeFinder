import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Coffee, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

import { MainLayout } from '../components/layout/MainLayout';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-brand-coffee rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-brand-coffee/20">
              <UserPlus size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-brand-black mb-2 text-center">Join CafeFinder</h1>
            <p className="text-brand-muted text-center max-w-xs">
              Discover and share your favorite coffee spots.
            </p>
          </div>

          <Card className="p-8 border-brand-border/50 shadow-xl shadow-brand-black/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-100 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-brand-black">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-xl border-brand-border focus:border-brand-coffee focus:ring-brand-coffee/20"
                />
              </div>

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
                <label htmlFor="password" className="text-sm font-medium text-brand-black">
                  Password
                </label>
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
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-brand-black">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl border-brand-border focus:border-brand-coffee focus:ring-brand-coffee/20"
                />
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-brand-border text-brand-coffee focus:ring-brand-coffee"
                />
                <label htmlFor="terms" className="text-sm text-brand-muted leading-tight">
                  I agree to the <Link to="/terms" className="text-brand-coffee hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-brand-coffee hover:underline">Privacy Policy</Link>.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-xl h-12 shadow-lg shadow-brand-coffee/10 transition-all mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-border/50 text-center">
              <p className="text-sm text-brand-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-coffee font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
