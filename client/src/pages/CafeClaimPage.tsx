import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Coffee, Search, Building2, MapPin, Loader2, X } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { cafeService } from '../services/cafeService';
import { ownerClaimService } from '../services/ownerClaimService';
import { useAuth } from '../contexts/AuthContext';
import { Cafe } from '../types';

export default function CafeClaimPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const querySlug = searchParams.get('slug') || searchParams.get('cafe');
  const effectiveSlug = slug || querySlug;

  const navigate = useNavigate();
  const { user } = useAuth();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(effectiveSlug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cafe selector state when on /claim-cafe with no pre-selected slug
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Cafe[]>([]);
  const [recentCafes, setRecentCafes] = useState<Cafe[]>([]);

  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    businessName: '',
    website: '',
    message: '',
  });

  // Pre-fill user info once user context is loaded
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactName: prev.contactName || user.name || '',
        contactEmail: prev.contactEmail || user.email || '',
      }));
    }
  }, [user]);

  // Load cafe if slug or querySlug is present
  useEffect(() => {
    if (effectiveSlug) {
      setLoading(true);
      setError('');
      cafeService
        .getBySlug(effectiveSlug)
        .then((result) => {
          if (result.data) {
            setCafe(result.data);
            setForm((prev) => ({
              ...prev,
              businessName: prev.businessName || result.data.name,
              website: prev.website || result.data.website || '',
            }));
          } else {
            setError('Cafe not found');
          }
        })
        .catch((err) => setError(err.message || 'Cafe not found'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      // Fetch initial list of cafes for quick selection
      setIsSearching(true);
      cafeService
        .getAll({ limit: 12 })
        .then((res) => {
          if (res.data) setRecentCafes(res.data);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }
  }, [effectiveSlug]);

  // Live search when typing in cafe selector
  useEffect(() => {
    if (cafe || effectiveSlug) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      cafeService
        .getAll({ search: searchQuery.trim(), limit: 8 })
        .then((res) => {
          if (res.data) setSearchResults(res.data);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, cafe, effectiveSlug]);

  const handleSelectCafe = (selected: Cafe) => {
    setCafe(selected);
    setError('');
    setForm((prev) => ({
      ...prev,
      businessName: prev.businessName || selected.name,
      website: prev.website || selected.website || '',
    }));
  };

  const handleClearSelectedCafe = () => {
    setCafe(null);
    if (effectiveSlug) {
      navigate('/claim-cafe', { replace: true });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cafe) {
      setError('Please select a cafe to claim.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await ownerClaimService.createClaim(cafe.id, form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit claim');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-20">
        <Link
          to={cafe ? `/cafes/${cafe.slug}` : '/explore'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-coffee transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {cafe ? 'Back to cafe' : 'Back to explore'}
        </Link>

        {loading ? (
          <div className="py-24 text-center text-brand-muted">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-coffee" />
            Loading cafe information...
          </div>
        ) : submitted ? (
          <div className="max-w-xl mx-auto mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center space-y-5">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="text-3xl font-serif font-bold text-brand-charcoal">Claim submitted</h1>
            <p className="text-brand-muted">
              Your ownership claim for <strong>{cafe?.name}</strong> has been submitted for review. An administrator
              will review your request shortly.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/owner/claims">View Claim</Link>
              </Button>
              {cafe && (
                <Button asChild variant="outline">
                  <Link to={`/cafes/${cafe.slug}`}>View Cafe</Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link to="/explore">Back to Explore</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mt-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 text-brand-coffee text-xs font-bold uppercase tracking-widest">
                <Coffee className="w-4 h-4" /> Ownership request
              </div>
              <h1 className="mt-3 text-4xl md:text-5xl font-serif font-bold text-brand-charcoal">
                Claim a cafe
              </h1>
              <p className="mt-3 text-brand-muted">
                {cafe ? (
                  <>
                    Tell us why you are authorized to manage <strong>{cafe.name}</strong>. Submission creates a pending
                    request, not immediate ownership.
                  </>
                ) : (
                  'Select the cafe you own or manage, then provide your contact and business details to verify ownership.'
                )}
              </p>
            </div>

            {/* Cafe Selection Banner / Picker */}
            {!cafe ? (
              <div className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm mb-8">
                <div className="flex items-center gap-3 text-brand-charcoal font-serif font-bold text-lg">
                  <Building2 className="w-5 h-5 text-brand-coffee" />
                  Select your cafe listing
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cafe by name, address, or neighborhood..."
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border border-brand-border bg-stone-50/50 text-sm text-stone-900 focus:bg-white focus:border-brand-coffee focus:outline-none transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand-muted" />
                  )}
                </div>

                {/* Search Results or Popular Suggestions */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {searchQuery.trim() ? 'Matching Cafes' : 'Available Davao Cafes'}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {(searchQuery.trim() ? searchResults : recentCafes).length === 0 ? (
                      <div className="sm:col-span-2 py-8 text-center text-sm text-brand-muted">
                        {isSearching ? 'Searching cafes...' : 'No cafes found matching your search. You can also submit a new cafe listing.'}
                      </div>
                    ) : (
                      (searchQuery.trim() ? searchResults : recentCafes).map((c) => {
                        const isAlreadyClaimed = Boolean(c.ownerId || c.claimStatus === 'OWNED');
                        return (
                          <div
                            key={c.id}
                            onClick={() => !isAlreadyClaimed && handleSelectCafe(c)}
                            className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                              isAlreadyClaimed
                                ? 'border-stone-200 bg-stone-50/80 opacity-60 cursor-not-allowed'
                                : 'border-brand-border bg-white hover:border-brand-coffee hover:shadow-md cursor-pointer group'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-brand-cream overflow-hidden shrink-0 flex items-center justify-center border border-brand-border">
                              {c.coverImage ? (
                                <img
                                  src={c.coverImage}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <Coffee className="w-5 h-5 text-brand-coffee/60" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm text-brand-charcoal truncate group-hover:text-brand-coffee transition-colors">
                                {c.name}
                              </h3>
                              <p className="text-xs text-brand-muted flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {c.address || c.city || 'Davao City'}
                              </p>
                              {isAlreadyClaimed ? (
                                <span className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                                  Already Claimed
                                </span>
                              ) : (
                                <span className="inline-block mt-2 text-[10px] font-bold text-brand-coffee group-hover:underline">
                                  Click to claim &rarr;
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-brand-muted border-t border-brand-border">
                  Don't see your coffee shop listed?{' '}
                  <Link to="/submit-cafe" className="font-bold text-brand-coffee hover:underline">
                    Submit a new cafe listing first
                  </Link>
                </div>
              </div>
            ) : (
              /* Selected Cafe Header Card */
              <div className="bg-brand-cream/60 border border-brand-border rounded-3xl p-5 mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden shrink-0 border border-brand-border flex items-center justify-center shadow-sm">
                    {cafe.coverImage ? (
                      <img src={cafe.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-6 h-6 text-brand-coffee" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-coffee bg-white/80 px-2 py-0.5 rounded-md border border-brand-border">
                      Selected Cafe
                    </span>
                    <h2 className="text-lg md:text-xl font-bold font-serif text-brand-charcoal truncate mt-1">
                      {cafe.name}
                    </h2>
                    <p className="text-xs text-brand-muted flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {cafe.address ? `${cafe.address}, ` : ''}{cafe.city || 'Davao City'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelectedCafe}
                  className="shrink-0 text-xs gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Change
                </Button>
              </div>
            )}

            {/* Claim Verification Form */}
            {cafe && (
              <form
                onSubmit={submit}
                className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <label className="space-y-2 text-sm font-semibold text-brand-charcoal">
                    Contact name
                    <input
                      required
                      maxLength={150}
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="Your full name"
                      className="w-full h-11 rounded-xl border border-brand-border px-3 text-sm focus:border-brand-coffee focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-brand-charcoal">
                    Contact email
                    <input
                      required
                      type="email"
                      maxLength={255}
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="business@example.com"
                      className="w-full h-11 rounded-xl border border-brand-border px-3 text-sm focus:border-brand-coffee focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-brand-charcoal">
                    Phone number
                    <input
                      maxLength={40}
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="+63 912 345 6789"
                      className="w-full h-11 rounded-xl border border-brand-border px-3 text-sm focus:border-brand-coffee focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-brand-charcoal">
                    Business / Entity name
                    <input
                      required
                      maxLength={150}
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      placeholder="Registered business or brand name"
                      className="w-full h-11 rounded-xl border border-brand-border px-3 text-sm focus:border-brand-coffee focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block space-y-2 text-sm font-semibold text-brand-charcoal">
                  Official Website or Social Media Page
                  <input
                    type="url"
                    maxLength={500}
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://facebook.com/yourcafe or https://instagram.com/yourcafe"
                    className="w-full h-11 rounded-xl border border-brand-border px-3 text-sm focus:border-brand-coffee focus:outline-none"
                  />
                </label>

                <label className="block space-y-2 text-sm font-semibold text-brand-charcoal">
                  Why are you authorized to manage this cafe?
                  <textarea
                    required
                    maxLength={2000}
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Briefly describe your role (e.g. Owner, General Manager, Marketing Director) and any verification details that can help our team confirm your relationship with this cafe."
                    className="w-full rounded-xl border border-brand-border p-3 text-sm focus:border-brand-coffee focus:outline-none"
                  />
                </label>

                {error && (
                  <div className="flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-brand-muted">
                    By submitting, you certify that you have authorization to represent this business listing.
                  </p>
                  <Button type="submit" isLoading={saving} className="w-full sm:w-auto shrink-0">
                    Submit ownership claim
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
