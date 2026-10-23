import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { loyaltyService, Reward } from '@/services/loyaltyService';
import { Gift, Coffee, Search, Star, Award, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RewardsPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemNotes, setRedeemNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<any | null>(null);
  const [userAccounts, setUserAccounts] = useState<Record<string, number>>({});

  const fetchUserAccounts = useCallback(async () => {
    if (!user) {
      setUserAccounts({});
      return;
    }
    try {
      const res = await loyaltyService.getCustomerDashboard();
      if (res.success && res.data?.accounts) {
        const map: Record<string, number> = {};
        res.data.accounts.forEach((acc: any) => {
          const balance = Number(acc.pointsBalance) || 0;
          const cId = acc.program?.cafe?.id || acc.program?.cafeId || acc.cafeId;
          const pId = acc.program?.id || acc.programId;
          if (cId) map[cId] = balance;
          if (pId) map[pId] = balance;
          if (acc.id) map[acc.id] = balance;
        });
        setUserAccounts(map);
      }
    } catch {
      // User may not have enrolled accounts yet
    }
  }, [user]);

  const getRewardBalanceInfo = useCallback(
    (reward: Reward | null) => {
      if (!reward) {
        return { currentBalance: 0, isMember: false, hasEnoughPoints: false, cafeName: '', cafeSlug: '' };
      }

      const cafeId =
        (reward as any).cafe?.id ||
        reward.program?.cafe?.id ||
        reward.program?.cafeId ||
        (reward as any).cafeId;

      const programId = reward.programId || reward.program?.id;

      let balance = 0;
      let isMember = false;

      if (cafeId && userAccounts[cafeId] !== undefined) {
        balance = userAccounts[cafeId];
        isMember = true;
      } else if (programId && userAccounts[programId] !== undefined) {
        balance = userAccounts[programId];
        isMember = true;
      }

      const pointsCost = Number(reward.pointsCost) || 0;
      const hasEnoughPoints = isMember && balance >= pointsCost;
      const cafeName = (reward as any).cafe?.name || reward.program?.cafe?.name || reward.program?.name || 'this Cafe';
      const cafeSlug = (reward as any).cafe?.slug || reward.program?.cafe?.slug || '';

      return {
        cafeId,
        programId,
        currentBalance: balance,
        isMember,
        hasEnoughPoints,
        cafeName,
        cafeSlug,
      };
    },
    [userAccounts]
  );

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await loyaltyService.getPublicRewards({ search: search || undefined });
      if (res.success) {
        setRewards(res.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [search]);

  useEffect(() => {
    fetchUserAccounts();
  }, [fetchUserAccounts]);

  // Support direct deep-linking to a reward via query param (e.g. /rewards?rewardId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rewardIdParam = params.get('rewardId');
    if (rewardIdParam && rewards.length > 0) {
      const found = rewards.find((r) => r.id === rewardIdParam);
      if (found) {
        setSelectedReward(found);
      }
    }
  }, [rewards]);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    if (!user) {
      toast.error('Please log in to redeem rewards');
      return;
    }
    setRedeeming(true);
    try {
      const res = await loyaltyService.redeemReward(selectedReward.id, redeemNotes);
      if (res.success) {
        setRedemptionSuccess(res.data);
        toast.success('Reward redemption requested!');
        fetchUserAccounts();
      }
    } catch (err: any) {
      toast.error(err.message || 'Redemption failed. Check your points balance.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-brand-cream/40 border-b border-brand-border py-12">
        <PageContainer>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-coffee/10 text-brand-coffee font-medium text-xs mb-4">
              <Gift className="w-4 h-4" />
              CafeFinder Loyalty & Rewards
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-coffee-dark mb-4">
              Earn Points, Sip More Free Coffee
            </h1>
            <p className="text-brand-muted text-lg mb-8">
              Explore exclusive perks, free beverages, pastries, and owner-managed rewards from your favorite local cafes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search rewards or cafes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border bg-white text-brand-coffee placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                />
              </div>
              {user && (
                <Link
                  to="/dashboard/loyalty"
                  className="px-6 py-3 rounded-xl bg-brand-coffee text-white font-medium hover:bg-brand-coffee-dark transition text-center flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Award className="w-5 h-5" />
                  My Loyalty Dashboard
                </Link>
              )}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-brand-border rounded-2xl p-6 h-64" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-brand-border rounded-3xl p-8 max-w-xl mx-auto">
            <Gift className="w-12 h-12 text-brand-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-coffee mb-2">No Rewards Available Yet</h3>
            <p className="text-brand-muted mb-6">
              Participating cafes are currently setting up their reward programs. Check back soon or visit your favorite cafe to check in!
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-coffee text-white font-medium hover:bg-brand-coffee-dark transition"
            >
              Explore Cafes
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-1 rounded-full bg-brand-cream text-brand-coffee font-bold text-xs">
                        {reward.pointsCost} Points
                      </span>
                      {reward.program?.cafe && (
                        <Link
                          to={`/cafes/${reward.program.cafe.slug}`}
                          className="block text-sm font-semibold text-brand-muted hover:text-brand-coffee mt-2"
                        >
                          {reward.program.cafe.name}
                        </Link>
                      )}
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Gift className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-brand-coffee-dark mb-2">{reward.name}</h3>
                  <p className="text-sm text-brand-muted line-clamp-3 mb-4">
                    {reward.description || 'Redeem your loyalty points for this special reward at the counter.'}
                  </p>

                  {reward.termsAndConditions && (
                    <div className="text-xs text-brand-muted/80 bg-brand-cream/50 rounded-lg p-2.5 mb-4">
                      <span className="font-semibold block mb-0.5">Terms:</span>
                      {reward.termsAndConditions}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between gap-2">
                  {reward.program?.cafe ? (
                    <Link
                      to={`/cafes/${reward.program.cafe.slug}`}
                      className="text-xs font-medium text-brand-coffee hover:underline flex items-center gap-1"
                    >
                      Cafe profile <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : <span />}

                  <button
                    onClick={() => {
                      setSelectedReward(reward);
                      setRedemptionSuccess(null);
                      setRedeemNotes('');
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-coffee text-white font-medium text-sm hover:bg-brand-coffee-dark transition shadow-xs"
                  >
                    Redeem Reward
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedReward(null)}
              className="absolute right-6 top-6 text-brand-muted hover:text-brand-coffee"
            >
              ✕
            </button>

            {redemptionSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-brand-coffee mb-2">Redemption Requested!</h3>
                <p className="text-brand-muted text-sm mb-6">
                  Your redemption request has been recorded. Present your redemption code to cafe staff when placing your order.
                </p>

                {(redemptionSuccess.plainCode || redemptionSuccess.verificationCode || redemptionSuccess.code) && (
                  <div className="bg-brand-cream p-4 rounded-2xl mb-6">
                    <span className="text-xs text-brand-muted block uppercase tracking-wider mb-1">Your Redemption Code</span>
                    <span className="text-3xl font-mono font-bold tracking-widest text-brand-coffee-dark select-all">
                      {redemptionSuccess.plainCode || redemptionSuccess.verificationCode || redemptionSuccess.code}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    to="/dashboard/loyalty"
                    className="flex-1 py-3 rounded-xl bg-brand-coffee text-white font-semibold text-center hover:bg-brand-coffee-dark transition"
                  >
                    View in Dashboard
                  </Link>
                  <button
                    onClick={() => setSelectedReward(null)}
                    className="flex-1 py-3 rounded-xl border border-brand-border text-brand-coffee font-semibold hover:bg-brand-cream transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-coffee-dark">{selectedReward.name}</h3>
                    <p className="text-xs text-brand-muted">
                      Cost: <span className="font-bold text-brand-coffee">{selectedReward.pointsCost} points</span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-brand-muted mb-4">{selectedReward.description}</p>

                {selectedReward.termsAndConditions && (
                  <div className="bg-brand-cream/60 p-3 rounded-xl text-xs text-brand-muted mb-4">
                    <span className="font-semibold block mb-1">Program Terms:</span>
                    {selectedReward.termsAndConditions}
                  </div>
                )}

                {!user ? (
                  <div className="text-center py-6 border-t border-brand-border">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-brand-coffee mb-3">Login Required</p>
                    <Link
                      to="/login"
                      className="inline-block px-6 py-2.5 rounded-xl bg-brand-coffee text-white text-sm font-medium hover:bg-brand-coffee-dark transition"
                    >
                      Sign In to Redeem
                    </Link>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const { currentBalance, isMember, hasEnoughPoints, cafeName, cafeSlug } = getRewardBalanceInfo(selectedReward);

                      return (
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl mb-4 text-xs border transition-all",
                            hasEnoughPoints
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : isMember
                              ? "bg-amber-50 border-amber-200 text-amber-900"
                              : "bg-amber-50/70 border-brand-border text-brand-coffee"
                          )}
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span>Your Balance at {cafeName}:</span>
                            <span className="font-bold text-sm">
                              {isMember ? `${currentBalance} pts` : 'Not enrolled yet'}
                            </span>
                          </div>

                          {isMember && hasEnoughPoints && (
                            <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                              ✓ You have sufficient points to redeem this reward.
                            </p>
                          )}

                          {isMember && !hasEnoughPoints && (
                            <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-amber-800">
                                Need {selectedReward.pointsCost - currentBalance} more points to redeem.
                              </span>
                              {cafeSlug && (
                                <Link
                                  to={`/cafes/${cafeSlug}`}
                                  className="font-bold text-brand-coffee underline hover:text-brand-coffee-dark shrink-0"
                                >
                                  Visit Cafe
                                </Link>
                              )}
                            </div>
                          )}

                          {!isMember && (
                            <div className="mt-2 pt-2 border-t border-brand-border/60 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-brand-muted">
                                You can join now and redeem with sufficient points ({selectedReward.pointsCost} pts).
                              </span>
                              {cafeSlug && (
                                <Link
                                  to={`/cafes/${cafeSlug}`}
                                  className="font-bold text-brand-coffee underline hover:text-brand-coffee-dark shrink-0"
                                >
                                  Visit Cafe
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-brand-coffee mb-1">
                        Optional Note to Cafe Staff
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Oat milk preference, table number..."
                        value={redeemNotes}
                        onChange={(e) => setRedeemNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setSelectedReward(null)}
                        className="flex-1 py-3 rounded-xl border border-brand-border text-brand-muted font-medium hover:bg-brand-cream transition text-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                      {(() => {
                        const { currentBalance, isMember, hasEnoughPoints } = getRewardBalanceInfo(selectedReward);
                        const canSubmit = !isMember || hasEnoughPoints;

                        return (
                          <button
                            onClick={handleRedeem}
                            disabled={redeeming || (isMember && !hasEnoughPoints)}
                            className={cn(
                              "flex-1 py-3 rounded-xl font-medium transition text-sm shadow-xs",
                              canSubmit
                                ? "bg-brand-coffee text-white hover:bg-brand-coffee-dark cursor-pointer"
                                : "bg-brand-coffee/40 text-white/80 cursor-not-allowed opacity-60"
                            )}
                          >
                            {redeeming
                              ? 'Processing...'
                              : !isMember
                              ? `Confirm (${selectedReward.pointsCost} pts)`
                              : !hasEnoughPoints
                              ? `Need ${selectedReward.pointsCost - currentBalance} more pts`
                              : `Confirm (${selectedReward.pointsCost} pts)`}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
