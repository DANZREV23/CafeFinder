import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Shield, Mail, Calendar, LogOut, Heart, ChevronRight, Edit2, Camera, Save, X, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';
import { toast } from 'react-hot-toast';

import { MainLayout } from '../components/layout/MainLayout';

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  if (!user) return null;

  const handleEdit = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userService.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

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
          <div className="flex items-center gap-3">
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="rounded-full"
              >
                <Edit2 size={18} className="mr-2" />
                Edit Profile
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={logout}
              className="rounded-full text-red-600 border-red-100 hover:bg-red-50"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-24 h-24 bg-brand-coffee/10 rounded-full flex items-center justify-center mb-4 text-brand-coffee overflow-hidden border-2 border-transparent group-hover:border-brand-coffee transition-all">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
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
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-brand-black">Personal Information</h3>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancel}
                      className="text-brand-muted"
                      disabled={isSaving}
                    >
                      <X size={16} className="mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSubmit}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={16} className="mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-brand-background border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium text-brand-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-brand-background border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium text-brand-black"
                        required
                      />
                    </div>
                  </div>
                </form>
              ) : (
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
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
