import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Shield, Mail, Calendar, LogOut, Heart, ChevronRight, Edit2, Camera, Save, X, Loader2, Sparkles, RotateCcw, Check, Lock, SlidersHorizontal } from 'lucide-react';
import { userService } from '../services/userService';
import { userPreferenceService } from '../services/userPreferenceService';
import { toast } from 'react-hot-toast';

import { MainLayout } from '../components/layout/MainLayout';

import { useI18n } from '../i18n';
import { Label } from '../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { t, locale, setLocale, timezone, setTimezone, formatDate } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Discovery Preferences State
  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [preferences, setPreferences] = useState<{
    preferredCity: string;
    preferredPriceRange: number | null;
    preferredAmenities: string[];
    preferredCoffeeTypes: string[];
    preferredVibes: string[];
  }>({
    preferredCity: '',
    preferredPriceRange: null,
    preferredAmenities: [],
    preferredCoffeeTypes: [],
    preferredVibes: [],
  });

  React.useEffect(() => {
    const fetchPrefs = async () => {
      setPrefLoading(true);
      try {
        const res = await userPreferenceService.getPreferences();
        if (res.success && res.data) {
          setPreferences({
            preferredCity: res.data.preferredCity || '',
            preferredPriceRange: res.data.preferredPriceRange ?? null,
            preferredAmenities: res.data.preferredAmenities || [],
            preferredCoffeeTypes: res.data.preferredCoffeeTypes || [],
            preferredVibes: res.data.preferredVibes || [],
          });
        }
      } catch (err) {
        console.error('Failed to load preferences', err);
      } finally {
        setPrefLoading(false);
      }
    };
    if (user) {
      fetchPrefs();
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setPrefSaving(true);
    try {
      await userPreferenceService.updatePreferences({
        preferredCity: preferences.preferredCity.trim() || null,
        preferredPriceRange: preferences.preferredPriceRange,
        preferredAmenities: preferences.preferredAmenities,
        preferredCoffeeTypes: preferences.preferredCoffeeTypes,
        preferredVibes: preferences.preferredVibes,
      });
      toast.success('Discovery preferences saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleResetPreferences = async () => {
    if (!window.confirm('Reset all recommendation preferences to default?')) return;
    setPrefSaving(true);
    try {
      await userPreferenceService.resetPreferences();
      setPreferences({
        preferredCity: '',
        preferredPriceRange: null,
        preferredAmenities: [],
        preferredCoffeeTypes: [],
        preferredVibes: [],
      });
      toast.success('Preferences reset to default');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  const toggleAmenity = (name: string) => {
    setPreferences(prev => {
      const exists = prev.preferredAmenities.includes(name);
      return {
        ...prev,
        preferredAmenities: exists 
          ? prev.preferredAmenities.filter(a => a !== name)
          : [...prev.preferredAmenities, name]
      };
    });
  };

  const toggleCoffeeType = (type: string) => {
    setPreferences(prev => {
      const exists = prev.preferredCoffeeTypes.includes(type);
      return {
        ...prev,
        preferredCoffeeTypes: exists
          ? prev.preferredCoffeeTypes.filter(t => t !== type)
          : [...prev.preferredCoffeeTypes, type]
      };
    });
  };

  const toggleVibe = (vibe: string) => {
    setPreferences(prev => {
      const exists = prev.preferredVibes.includes(vibe);
      return {
        ...prev,
        preferredVibes: exists
          ? prev.preferredVibes.filter(v => v !== vibe)
          : [...prev.preferredVibes, vibe]
      };
    });
  };

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

  const displayDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return formatDate(dateString, {
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
                      <p className="text-brand-black font-medium">{displayDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-8">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-brand-black">{t("common.regionalSettings")}</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language-select">{t("common.language")}</Label>
                  <Select value={locale} onValueChange={(val: any) => setLocale(val)}>
                    <SelectTrigger id="language-select">
                      <SelectValue placeholder={t("common.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-PH">English (Philippines)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone-select">{t("common.timezone")}</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone-select">
                      <SelectValue placeholder={t("admin.selectTimezone")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Manila">Manila (PHT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-brand-muted italic mt-1">
                    Dates and times will be displayed according to this selection.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-amber-200/60 bg-gradient-to-b from-white to-amber-500/[0.02]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b pb-4 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-black">Discovery Preferences</h3>
                    <p className="text-xs text-brand-muted">Customize your personalized recommendations across CafeFinder.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPreferences}
                    disabled={prefSaving || prefLoading}
                    className="text-stone-500 hover:text-stone-700 text-xs gap-1.5"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    disabled={prefSaving || prefLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm"
                  >
                    {prefSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {prefLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preferred City */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      Preferred City / Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Davao City, Makati, Taguig"
                        value={preferences.preferredCity}
                        onChange={(e) => setPreferences(prev => ({ ...prev, preferredCity: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-brand-background border border-brand-border rounded-xl text-sm font-medium text-brand-black focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Preferred Price Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      Preferred Budget
                    </label>
                    <div className="flex gap-2">
                      {[
                        { level: 1, label: '₱ (Budget)' },
                        { level: 2, label: '₱₱ (Standard)' },
                        { level: 3, label: '₱₱₱ (Upscale)' },
                        { level: 4, label: '₱₱₱₱ (Premium)' },
                      ].map(({ level, label }) => {
                        const isSelected = preferences.preferredPriceRange === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setPreferences(prev => ({
                              ...prev,
                              preferredPriceRange: prev.preferredPriceRange === level ? null : level,
                            }))}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-brand-background text-stone-700 border-brand-border hover:bg-stone-100'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Amenities */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      Must-Have Amenities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Fast Wi-Fi',
                        'Power Outlets',
                        'Quiet',
                        'Work Friendly',
                        'Outdoor Seating',
                        'Pet Friendly',
                        'Air Conditioning',
                        'Late Night',
                        'Parking',
                        'Study Friendly',
                        'Vegan Options',
                        'Vegetarian Options',
                      ].map((amenity) => {
                        const isSelected = preferences.preferredAmenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-brand-background text-stone-700 border-brand-border hover:bg-stone-100'
                            }`}
                          >
                            {isSelected && <Check size={12} className="shrink-0" />}
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Coffee Types */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      Favorite Coffee Types & Styles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Pour-over',
                        'Espresso',
                        'Cold Brew',
                        'Specialty Roasts',
                        'Decaf',
                        'Matcha & Tea',
                        'Single Origin',
                      ].map((type) => {
                        const isSelected = preferences.preferredCoffeeTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleCoffeeType(type)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                                : 'bg-brand-background text-stone-700 border-brand-border hover:bg-stone-100'
                            }`}
                          >
                            {isSelected && <Check size={12} className="shrink-0" />}
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Vibes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      Preferred Vibes & Atmosphere
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Work / Study Friendly',
                        'Cozy & Quiet',
                        'Modern & Minimalist',
                        'Outdoor & Garden',
                        'Late Night Vibes',
                        'Social & Bustling',
                      ].map((vibe) => {
                        const isSelected = preferences.preferredVibes.includes(vibe);
                        return (
                          <button
                            key={vibe}
                            type="button"
                            onClick={() => toggleVibe(vibe)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-coffee-700 text-white border-coffee-700 shadow-sm'
                                : 'bg-brand-background text-stone-700 border-brand-border hover:bg-stone-100'
                            }`}
                          >
                            {isSelected && <Check size={12} className="shrink-0" />}
                            {vibe}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Privacy & Safe Profiling Reassurance */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl flex items-start gap-3 text-xs text-stone-600">
                    <Lock size={16} className="text-stone-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-800">Privacy Guarantee:</span> Your discovery preferences are strictly private and belong only to your account. CafeFinder never infers demographic data or sells your activity. You can reset these settings at any time.
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
