import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { StarRating } from '@/components/reviews/StarRating';
import { fetchApi } from '@/services/api';
import { 
  User, 
  Coffee, 
  Calendar, 
  Award, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Camera, 
  MapPin 
} from 'lucide-react';
import { format } from 'date-fns';
import { SEO } from '@/components/common/SEO';

interface PublicProfileData {
  id: string;
  isPrivate: boolean;
  name: string;
  avatarUrl: string | null;
  bio?: string | null;
  joinedAt: string;
  reviewCount?: number;
  photoCount?: number;
  submissionCount?: number;
  badges?: { id: string; label: string; description: string }[];
  recentReviews?: {
    id: string;
    overallRating: number;
    coffeeRating?: number;
    comment: string | null;
    createdAt: string;
    cafe: {
      id: string;
      name: string;
      slug: string;
      city: string;
    };
  }[];
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchApi<{ success: boolean; data: PublicProfileData }>(`/users/${id}/public-profile`);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError('User profile not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-brand-muted">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Profile Not Found</h2>
            <p className="text-sm text-brand-muted">{error || 'This user profile does not exist.'}</p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-coffee text-white rounded-xl text-sm font-semibold hover:bg-brand-coffee-dark"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Explore</span>
            </Link>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={`${profile.name}'s Profile | CafeFinder`}
        description={`Coffee explorer profile for ${profile.name} on CafeFinder.`}
      />
      <PageContainer>
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          {/* Back link */}
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-brand-coffee transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cafe Discovery</span>
          </Link>

          {/* Profile Card Header */}
          <div className="bg-white border border-brand-border rounded-3xl p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=240'}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-brand-coffee/20 shadow-md"
              />

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-charcoal">
                    {profile.name}
                  </h1>
                  {profile.isPrivate ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Community Member
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-sm text-stone-700 leading-relaxed max-w-xl">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-brand-muted pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {format(new Date(profile.joinedAt), 'MMMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Public Stats Bar */}
            {!profile.isPrivate && (
              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-stone-100 text-center">
                <div className="space-y-0.5">
                  <div className="text-2xl font-serif font-bold text-brand-coffee">
                    {profile.reviewCount || 0}
                  </div>
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Reviews
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-serif font-bold text-brand-coffee">
                    {profile.photoCount || 0}
                  </div>
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Photos
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-serif font-bold text-brand-coffee">
                    {profile.submissionCount || 0}
                  </div>
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Cafes Added
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* If Profile is Private */}
          {profile.isPrivate ? (
            <div className="bg-stone-50 border border-brand-border rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-brand-charcoal">
                Private Activity
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                This coffee explorer has chosen to keep their review activity and contributions private.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Badges Section */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-serif font-bold text-brand-charcoal flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span>Community Contributions</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {profile.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          {badge.id === 'photo_contributor' ? (
                            <Camera className="w-5 h-5" />
                          ) : (
                            <Coffee className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-brand-charcoal">{badge.label}</div>
                          <div className="text-[11px] text-stone-500">{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Public Reviews */}
              <div className="space-y-4">
                <h3 className="text-lg font-serif font-bold text-brand-charcoal flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-brand-coffee" />
                  <span>Recent Public Reviews</span>
                </h3>

                {profile.recentReviews && profile.recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recentReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white border border-brand-border rounded-2xl p-5 space-y-3 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Link
                            to={`/cafes/${rev.cafe.slug}`}
                            className="font-bold text-brand-charcoal hover:text-brand-coffee transition-colors flex items-center gap-1.5"
                          >
                            <span>{rev.cafe.name}</span>
                            <span className="text-xs text-stone-400 font-normal">({rev.cafe.city})</span>
                          </Link>
                          <div className="flex items-center gap-3">
                            <StarRating rating={rev.overallRating} readonly size="sm" />
                            <span className="text-[11px] text-stone-400">
                              {format(new Date(rev.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-stone-700 leading-relaxed italic bg-brand-cream/20 p-3 rounded-xl border border-brand-border/40">
                            "{rev.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-white border border-dashed border-brand-border rounded-2xl text-center text-xs text-stone-500">
                    No public reviews available yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
