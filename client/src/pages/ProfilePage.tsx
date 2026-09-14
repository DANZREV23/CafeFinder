import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Shield, Mail, Calendar, LogOut, Heart, ChevronRight } from 'lucide-react';

import { MainLayout } from '../components/layout/MainLayout';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-black mb-2">Account Settings</h1>
            <p className="text-brand-muted">Manage your profile and account preferences.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={logout}
            className="rounded-full text-red-600 border-red-100 hover:bg-red-50"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-brand-coffee/10 rounded-full flex items-center justify-center mb-4 text-brand-coffee">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={48} />
              )}
            </div>
            <h2 className="text-xl font-bold text-brand-black">{user.name}</h2>
            <p className="text-brand-muted mb-4">{user.email}</p>
            <div className="inline-flex items-center px-3 py-1 bg-brand-coffee/10 text-brand-coffee text-xs font-bold rounded-full uppercase tracking-wider mb-6">
              {user.role}
            </div>
            <div className="w-full h-px bg-brand-border mb-6" />
            <Link to="/favorites" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-background transition-colors group">
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-rose-500" />
                <span className="font-bold text-brand-charcoal">Saved Cafes</span>
              </div>
              <ChevronRight size={16} className="text-brand-muted group-hover:translate-x-1 transition-transform" />
            </Link>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="p-8">
              <h3 className="text-lg font-bold text-brand-black mb-6 border-b pb-4">Personal Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-background rounded-lg flex items-center justify-center text-brand-muted">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Full Name</p>
                    <p className="text-brand-black font-medium">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-background rounded-lg flex items-center justify-center text-brand-muted">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Email Address</p>
                    <p className="text-brand-black font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-background rounded-lg flex items-center justify-center text-brand-muted">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Account Role</p>
                    <p className="text-brand-black font-medium">{user.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-background rounded-lg flex items-center justify-center text-brand-muted">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Member Since</p>
                    <p className="text-brand-black font-medium">September 2026</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
