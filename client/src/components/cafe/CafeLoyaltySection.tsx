import React, { useState, useEffect } from 'react';
import { loyaltyService, LoyaltyProgram, LoyaltyAccount, Reward } from '@/services/loyaltyService';
import { Award, Gift, CheckCircle2, Coffee, ChevronRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CafeLoyaltySectionProps {
  cafeId: string;
  cafeSlug?: string;
  cafeName: string;
}

export const CafeLoyaltySection: React.FC<CafeLoyaltySectionProps> = ({ cafeId, cafeSlug, cafeName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');

  const fetchLoyaltyInfo = async () => {
    const identifier = cafeId || cafeSlug;
    if (!identifier) return;

    try {
      const res = await loyaltyService.getCafeLoyalty(identifier);
      if (res.success && res.data) {
        setProgram(res.data.program);
        const resolvedAccount = (res.data as any).account || (res.data as any).customerAccount || null;
        setAccount(resolvedAccount);
        setRewards(res.data.rewards || []);
      }
    } catch (err) {
      // Non-fatal if loyalty not active
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyInfo();
  }, [cafeId, cafeSlug, user?.id]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to join the loyalty program');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const identifier = cafeId || cafeSlug;
    if (!identifier) return;

    setEnrolling(true);
    try {
      const res = await loyaltyService.enroll(identifier);
      if (res.success) {
        toast.success(`You are now enrolled in ${program?.name || 'the loyalty program'}!`);
        await fetchLoyaltyInfo();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCheckIn = async () => {
    const identifier = cafeId || cafeSlug;
    if (!identifier) return;

    setCheckingIn(true);
    try {
      const res = await loyaltyService.checkIn(identifier, visitNotes);
      if (res.success) {
        toast.success(res.message || 'Visit check-in submitted for review!');
        setShowCheckInModal(false);
        setVisitNotes('');
        await fetchLoyaltyInfo();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || !program || program.status !== 'ACTIVE') {
    return null;
  }

  const isMember = Boolean(account && account.status === 'ACTIVE');

  return (
    <div className="bg-gradient-to-br from-brand-cream/80 to-amber-50/50 border border-brand-border rounded-3xl p-6 md:p-8 my-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-coffee text-white text-xs font-semibold mb-3">
            <Award className="w-4 h-4 text-amber-300" />
            Loyalty Program Active
          </div>
          <h3 className="text-2xl font-serif font-bold text-brand-coffee-dark mb-1">
            {program.name}
          </h3>
          <p className="text-sm text-brand-muted max-w-xl">
            {program.description || `Earn ${program.pointsPerVisit} points per verified visit and redeem for exclusive perks at ${cafeName}.`}
          </p>
        </div>

        <div>
          {isMember && account ? (
            <div className="flex flex-col sm:items-end gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active Member</span>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-xs text-right min-w-[210px]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs text-brand-muted">Points Balance</span>
                  <span className="text-[11px] font-bold text-brand-coffee bg-brand-cream px-2 py-0.5 rounded-full">
                    {program.pointsPerVisit} pts / visit
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-brand-coffee block">
                  {account.pointsBalance} pts
                </span>
                <div className="mt-2.5 flex gap-2 justify-end">
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition shadow-xs flex items-center gap-1"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    Check In
                  </button>
                  <Link
                    to="/dashboard/loyalty"
                    className="px-3 py-1.5 rounded-xl border border-brand-border text-brand-coffee text-xs font-semibold hover:bg-brand-cream transition flex items-center gap-1"
                  >
                    My Wallet →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-6 py-3 rounded-2xl bg-brand-coffee text-white font-semibold text-sm hover:bg-brand-coffee-dark transition shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              {enrolling ? 'Enrolling...' : 'Join Loyalty Program'}
            </button>
          )}
        </div>
      </div>

      {/* Available Rewards */}
      {rewards.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-base text-brand-coffee-dark flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-600" />
              Available Rewards at {cafeName}
            </h4>
            <Link to="/rewards" className="text-xs font-semibold text-brand-coffee hover:underline">
              View all rewards →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.slice(0, 3).map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    {r.pointsCost} Points
                  </span>
                  <h5 className="font-bold text-sm text-brand-coffee-dark">{r.name}</h5>
                  <p className="text-xs text-brand-muted line-clamp-2 mt-1">{r.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-brand-border/40 text-right">
                  <Link
                    to={`/rewards?rewardId=${r.id}`}
                    className="text-xs font-semibold text-brand-coffee hover:underline inline-flex items-center gap-0.5"
                  >
                    Redeem details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowCheckInModal(false)}
              className="absolute right-4 top-4 text-brand-muted hover:text-brand-coffee cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-brand-coffee-dark mb-1">Check In at {cafeName}</h3>
            <p className="text-xs text-brand-muted mb-4">
              Self-reported visit check-ins are reviewed by cafe staff before loyalty points are issued to your ledger.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-coffee mb-1">
                Optional visit details or receipt #
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Ordered a cappuccino at table 4..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-border text-xs"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="flex-1 py-2 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark cursor-pointer"
              >
                {checkingIn ? 'Submitting...' : 'Submit Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
