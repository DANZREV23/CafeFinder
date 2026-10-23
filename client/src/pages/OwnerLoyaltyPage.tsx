import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { loyaltyService } from '@/services/loyaltyService';
import { ownerService } from '@/services/ownerService';
import { 
  Gift, 
  Award, 
  Plus, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Search,
  Trash2,
  CalendarCheck,
  Check,
  X,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'program' | 'rewards' | 'redemptions' | 'checkins' | 'customers';

export default function OwnerLoyaltyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string>('');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Derive initial tab from URL pathname or query param
  const getTabFromLocation = (): TabType => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/rewards')) return 'rewards';
    if (p.includes('/redemptions')) return 'redemptions';
    if (p.includes('/checkins')) return 'checkins';
    if (p.includes('/customers') || p.includes('/members')) return 'customers';
    if (p.includes('/program')) return 'program';
    const queryTab = searchParams.get('tab');
    if (queryTab && ['program', 'rewards', 'redemptions', 'checkins', 'customers'].includes(queryTab)) {
      return queryTab as TabType;
    }
    return 'program';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromLocation());

  // Keep activeTab in sync with pathname changes (back/forward, direct links)
  useEffect(() => {
    const targetTab = getTabFromLocation();
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  }, [location.pathname, searchParams]);

  // Program form
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    pointsEnabled: true,
    pointsPerVisit: 10,
    minimumRedemptionPoints: 50,
    termsAndConditions: '',
  });
  const [savingProgram, setSavingProgram] = useState(false);

  // Reward modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsCost: 50,
    stockLimit: '',
  });
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [savingReward, setSavingReward] = useState(false);

  // Voucher verification code modal
  const [verifyModal, setVerifyModal] = useState<{ redemptionId: string; customerName: string; rewardName: string } | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [processingRedemption, setProcessingRedemption] = useState(false);

  // Redemptions view toggle (pending vs all history)
  const [redemptionsFilter, setRedemptionsFilter] = useState<'pending' | 'all'>('pending');

  // Customer search & pagination
  const [customerSearch, setCustomerSearch] = useState('');

  // Award points modal
  const [awardModal, setAwardModal] = useState<{ accountId: string; customerName: string } | null>(null);
  const [awardPoints, setAwardPoints] = useState(15);
  const [awardReason, setAwardReason] = useState('');
  const [issuingPoints, setIssuingPoints] = useState(false);

  // Check-in review state
  const [reviewingCheckInId, setReviewingCheckInId] = useState<string | null>(null);

  useEffect(() => {
    loadCafes();
  }, []);

  useEffect(() => {
    if (selectedCafeId) {
      loadOverview(selectedCafeId);
    }
  }, [selectedCafeId]);

  const loadCafes = async () => {
    try {
      const res = await ownerService.getOwnedCafes(1);
      const cafesList = (res.success && Array.isArray(res.data) && res.data.length > 0) ? res.data : [];
      if (cafesList.length > 0) {
        setCafes(cafesList);
        const queryCafeId = searchParams.get('cafeId');
        const matched = queryCafeId && cafesList.find((c: any) => c.id === queryCafeId);
        setSelectedCafeId(matched ? matched.id : cafesList[0].id);
      } else {
        // Fallback: check overview to see accessible cafes
        const overviewRes = await loyaltyService.getOwnerOverview();
        if (overviewRes.success && overviewRes.data?.cafes?.length > 0) {
          setCafes(overviewRes.data.cafes);
          const queryCafeId = searchParams.get('cafeId');
          const matched = queryCafeId && overviewRes.data.cafes.find((c: any) => c.id === queryCafeId);
          setSelectedCafeId(matched ? matched.id : overviewRes.data.cafes[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to load owned cafes:', err);
      toast.error('Failed to load owned cafes');
      setLoading(false);
    }
  };

  const loadOverview = async (cafeId: string) => {
    setLoading(true);
    try {
      const [res, custRes] = await Promise.all([
        loyaltyService.getOwnerOverview(cafeId),
        loyaltyService.getOwnerCustomers(cafeId).catch(() => ({ success: false, data: [] })),
      ]);

      if (res.success) {
        const data = res.data || {};
        if (custRes.success && Array.isArray(custRes.data)) {
          data.customers = custRes.data;
        } else if (!data.customers) {
          data.customers = [];
        }

        setOverview(data);

        if (data.cafes && Array.isArray(data.cafes) && data.cafes.length > 0 && cafes.length === 0) {
          setCafes(data.cafes);
        }

        // Find current cafe program if present
        const currentProg = data.program || data.programs?.find((p: any) => p.cafeId === cafeId);
        if (currentProg) {
          setProgramForm({
            name: currentProg.name || '',
            description: currentProg.description || '',
            pointsEnabled: currentProg.pointsEnabled !== false,
            pointsPerVisit: currentProg.pointsPerVisit || 10,
            minimumRedemptionPoints: currentProg.minimumRedemptionPoints ?? 50,
            termsAndConditions: currentProg.termsAndConditions || '',
          });
        } else {
          const cafeObj = data.selectedCafe || cafes.find((c: any) => c.id === cafeId);
          setProgramForm({
            name: cafeObj ? `${cafeObj.name} Rewards` : 'Cafe Loyalty Program',
            description: 'Earn points with every visit and redeem for exclusive perks.',
            pointsEnabled: true,
            pointsPerVisit: 10,
            minimumRedemptionPoints: 50,
            termsAndConditions: 'Points are non-transferable and valid for in-store redemption.',
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading loyalty overview:', err);
      toast.error(err.message || 'Failed to load loyalty overview');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    const query = selectedCafeId ? `?cafeId=${encodeURIComponent(selectedCafeId)}` : '';
    navigate(`/owner/loyalty/${newTab}${query}`);
  };

  const handleCafeChange = (newCafeId: string) => {
    setSelectedCafeId(newCafeId);
    navigate(`/owner/loyalty/${activeTab}?cafeId=${encodeURIComponent(newCafeId)}`, { replace: true });
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    setSavingProgram(true);
    try {
      const cafeObj = overview?.selectedCafe || cafes.find((c: any) => c.id === selectedCafeId);
      const payload: any = {
        name: programForm.name.trim() || `${cafeObj?.name || 'Cafe'} Rewards`,
        description: programForm.description.trim() || undefined,
        status: programForm.pointsEnabled ? 'ACTIVE' : 'PAUSED',
        pointsEnabled: programForm.pointsEnabled,
        pointsPerVisit: Math.max(1, Number(programForm.pointsPerVisit) || 10),
        minimumRedemptionPoints: Math.max(0, Number(programForm.minimumRedemptionPoints) || 0),
        termsAndConditions: programForm.termsAndConditions.trim() || undefined,
      };

      const res = await loyaltyService.upsertOwnerProgram(selectedCafeId, payload);
      if (res.success) {
        toast.success('Loyalty program settings updated!');
        await loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save loyalty program');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    setSavingReward(true);
    try {
      const payload: any = {
        name: rewardForm.name.trim(),
        description: rewardForm.description ? rewardForm.description.trim() : '',
        pointsCost: Math.max(1, Number(rewardForm.pointsCost) || 50),
        stockLimit: rewardForm.stockLimit && String(rewardForm.stockLimit).trim() !== '' ? Number(rewardForm.stockLimit) : null,
      };

      if (editingRewardId) {
        await loyaltyService.updateOwnerReward(selectedCafeId, editingRewardId, payload);
        toast.success('Reward updated successfully!');
      } else {
        await loyaltyService.createOwnerReward(selectedCafeId, payload);
        toast.success('Reward created successfully!');
      }
      setIsRewardModalOpen(false);
      setEditingRewardId(null);
      setRewardForm({ name: '', description: '', pointsCost: 50, stockLimit: '' });
      await loadOverview(selectedCafeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save reward');
    } finally {
      setSavingReward(false);
    }
  };

  const handleToggleRewardStatus = async (reward: any) => {
    if (!selectedCafeId) return;
    try {
      const newStatus = reward.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await loyaltyService.updateOwnerReward(selectedCafeId, reward.id, { status: newStatus as any });
      toast.success(`Reward marked as ${newStatus.toLowerCase()}`);
      await loadOverview(selectedCafeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update reward status');
    }
  };

  const handleDeleteReward = async (reward: any) => {
    if (!selectedCafeId) return;
    if (!window.confirm(`Are you sure you want to delete or archive "${reward.name}"?`)) return;
    try {
      await loyaltyService.deleteOwnerReward(selectedCafeId, reward.id);
      toast.success('Reward removed');
      await loadOverview(selectedCafeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete reward');
    }
  };

  const handleProcessRedemption = async (redemptionId: string, action: 'APPROVE' | 'REJECT' | 'REDEEM') => {
    if (!selectedCafeId) return;
    setProcessingRedemption(true);
    try {
      const res = await loyaltyService.processOwnerRedemption(
        selectedCafeId,
        redemptionId,
        action,
        action === 'REJECT' ? 'Redemption could not be fulfilled at this time' : undefined,
        action === 'REDEEM' && verificationCodeInput ? verificationCodeInput.trim() : undefined
      );
      if (res.success) {
        toast.success(`Redemption ${action === 'REDEEM' ? 'fulfilled' : action.toLowerCase() + 'd'} successfully`);
        setVerifyModal(null);
        setVerificationCodeInput('');
        await loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} redemption`);
    } finally {
      setProcessingRedemption(false);
    }
  };

  const handleReviewCheckIn = async (checkInId: string, approved: boolean) => {
    if (!selectedCafeId) return;
    setReviewingCheckInId(checkInId);
    try {
      const res = await loyaltyService.reviewCheckIn(selectedCafeId, checkInId, approved);
      if (res.success) {
        toast.success(approved ? 'Check-in approved and visit points awarded!' : 'Check-in declined');
        await loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to review check-in');
    } finally {
      setReviewingCheckInId(null);
    }
  };

  const handleIssuePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId || !awardModal) return;
    setIssuingPoints(true);
    try {
      const res = await loyaltyService.issueOwnerPoints(selectedCafeId, {
        accountId: awardModal.accountId,
        mode: 'ADJUSTMENT',
        type: 'ADJUSTMENT',
        points: Number(awardPoints),
        description: awardReason.trim() || 'Manual adjustment by cafe owner',
        reason: awardReason.trim() || 'Manual adjustment by cafe owner',
      });
      if (res.success) {
        toast.success(`Awarded +${awardPoints} points to ${awardModal.customerName}`);
        setAwardModal(null);
        setAwardReason('');
        await loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue points');
    } finally {
      setIssuingPoints(false);
    }
  };

  const rewards = overview?.rewards || overview?.activeRewards || overview?.program?.rewards || [];
  const allRedemptions = overview?.recentRedemptions || [];
  const pendingRedemptions = (overview?.pendingRedemptions || allRedemptions).filter(
    (r: any) => r.status === 'REQUESTED' || r.status === 'APPROVED'
  );
  const recentCheckIns = overview?.pendingCheckIns || overview?.recentCheckIns || [];
  const rawCustomers = overview?.customers || overview?.enrolledCustomers || [];

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return rawCustomers;
    const q = customerSearch.toLowerCase();
    return rawCustomers.filter((c: any) => 
      c.user?.name?.toLowerCase().includes(q) || c.user?.email?.toLowerCase().includes(q)
    );
  }, [rawCustomers, customerSearch]);

  const activeProgram = overview?.program;
  const isProgramActive = activeProgram?.status === 'ACTIVE' && activeProgram?.pointsEnabled !== false;

  return (
    <MainLayout>
      <PageContainer className="py-10 md:py-14 space-y-8">
        {/* Header & Cafe Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" /> Owner Loyalty Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">
              Customer Loyalty & Rewards
            </h1>
          </div>

          {cafes.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-2 shadow-sm">
              <span className="text-xs font-semibold text-stone-500 pl-2">Cafe:</span>
              <select
                value={selectedCafeId}
                onChange={(e) => handleCafeChange(e.target.value)}
                className="text-sm font-semibold text-stone-800 bg-white border-none focus:outline-none pr-3 cursor-pointer"
              >
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Empty state if user owns no cafes */}
        {!loading && cafes.length === 0 && (
          <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500 space-y-4 shadow-sm">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-serif font-bold text-stone-900">No Managed Cafes Found</h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              You do not have any published or claimed cafes linked to your account. Claim or add your cafe to begin offering loyalty points and perks to patrons.
            </p>
            <div className="pt-2">
              <Link
                to="/cafes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 shadow-sm transition-colors"
              >
                Browse Cafes & Claim
              </Link>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && cafes.length === 0 && (
          <div className="p-12 text-center text-stone-400 animate-pulse bg-white border border-stone-200 rounded-3xl">
            Loading your cafe loyalty program...
          </div>
        )}

        {/* Main Content when cafes exist */}
        {cafes.length > 0 && (
          <>
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-px">
              {[
                { id: 'program', label: 'Program Settings', icon: Settings },
                { id: 'rewards', label: `Rewards (${rewards.length})`, icon: Gift },
                { id: 'redemptions', label: `Voucher Redemptions (${pendingRedemptions.length})`, icon: Clock },
                { id: 'checkins', label: `Check-Ins (${recentCheckIns.length})`, icon: CalendarCheck },
                { id: 'customers', label: `Members (${rawCustomers.length})`, icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-b-2 border-brand-coffee text-brand-coffee bg-stone-50/50'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Program Settings */}
            {activeTab === 'program' && (
              <div className="max-w-3xl bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">
                      Configure Cafe Loyalty Program
                    </h2>
                    <p className="text-stone-500 text-sm">
                      Reward repeat patrons with visit points redeemable for drinks, beans, and bakery items.
                    </p>
                  </div>
                  {activeProgram && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isProgramActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isProgramActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isProgramActive ? 'Active & Earning' : 'Paused'}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveProgram} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Program Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={programForm.name}
                      onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                      placeholder="e.g. Green Coffee Rewards Club"
                      className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Tagline / Description
                    </label>
                    <input
                      type="text"
                      value={programForm.description}
                      onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                      placeholder="e.g. Earn 10 points with every cup. Redeem for complimentary roasts."
                      className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Points Awarded Per Visit *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        required
                        value={programForm.pointsPerVisit}
                        onChange={(e) => setProgramForm({ ...programForm, pointsPerVisit: Number(e.target.value) })}
                        className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                      />
                      <span className="text-xs text-stone-400 mt-1 block">Standard visit points upon check-in verification</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Minimum Redemption Threshold
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={programForm.minimumRedemptionPoints}
                        onChange={(e) => setProgramForm({ ...programForm, minimumRedemptionPoints: Number(e.target.value) })}
                        className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                      />
                      <span className="text-xs text-stone-400 mt-1 block">Points balance required to claim rewards</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Terms & Conditions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={programForm.termsAndConditions}
                      onChange={(e) => setProgramForm({ ...programForm, termsAndConditions: e.target.value })}
                      placeholder="Points are non-transferable. One redemption per transaction."
                      className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="pointsEnabled"
                      checked={programForm.pointsEnabled}
                      onChange={(e) => setProgramForm({ ...programForm, pointsEnabled: e.target.checked })}
                      className="w-4 h-4 text-brand-coffee rounded focus:ring-brand-coffee cursor-pointer"
                    />
                    <label htmlFor="pointsEnabled" className="text-xs font-semibold text-stone-700 cursor-pointer">
                      Loyalty Points Earning Active (Uncheck to temporarily pause program)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProgram}
                      className="px-6 py-3 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {savingProgram ? 'Saving Settings...' : 'Save Program Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Rewards */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">Redeemable Rewards</h2>
                    <p className="text-stone-500 text-sm">Create and manage rewards customers can claim with points.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRewardId(null);
                      setRewardForm({ name: '', description: '', pointsCost: 50, stockLimit: '' });
                      setIsRewardModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Reward
                  </button>
                </div>

                {rewards.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                    <Gift className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-stone-800">No Rewards Created</h3>
                    <p className="text-sm text-stone-400 mt-1 mb-4">Add your first redeemable item like a free drip coffee, croissant, or cold brew.</p>
                    <button
                      onClick={() => {
                        setEditingRewardId(null);
                        setRewardForm({ name: '', description: '', pointsCost: 50, stockLimit: '' });
                        setIsRewardModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add First Reward
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {rewards.map((reward: any) => (
                      <div
                        key={reward.id}
                        className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {reward.pointsCost} Points
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                reward.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {reward.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-stone-900 text-base mt-2.5">{reward.name}</h3>
                          {reward.description && <p className="text-stone-500 text-xs mt-1 line-clamp-2">{reward.description}</p>}
                          {reward.stockLimit && (
                            <div className="text-xs text-stone-400 mt-2">
                              Stock: {Math.max(0, reward.stockLimit - (reward.redeemedCount || 0))} left
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                          <span>Claimed {reward.redeemedCount || 0} times</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleRewardStatus(reward)}
                              className={`cursor-pointer ${
                                reward.status === 'ACTIVE' ? 'text-stone-500 hover:text-stone-800' : 'text-emerald-600 font-semibold hover:underline'
                              }`}
                            >
                              {reward.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingRewardId(reward.id);
                                setRewardForm({
                                  name: reward.name,
                                  description: reward.description || '',
                                  pointsCost: reward.pointsCost,
                                  stockLimit: reward.stockLimit ? String(reward.stockLimit) : '',
                                });
                                setIsRewardModalOpen(true);
                              }}
                              className="text-brand-coffee hover:underline font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReward(reward)}
                              className="text-stone-400 hover:text-red-600 cursor-pointer"
                              title="Delete or Archive Reward"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Redemptions */}
            {activeTab === 'redemptions' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">Voucher Redemptions</h2>
                    <p className="text-stone-500 text-sm">
                      Verify voucher codes presented by customers in-store before handing over their reward.
                    </p>
                  </div>
                  <div className="inline-flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setRedemptionsFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        redemptionsFilter === 'pending' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Pending ({pendingRedemptions.length})
                    </button>
                    <button
                      onClick={() => setRedemptionsFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        redemptionsFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      History ({allRedemptions.length})
                    </button>
                  </div>
                </div>

                {(redemptionsFilter === 'pending' ? pendingRedemptions : allRedemptions).length === 0 ? (
                  <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-stone-800">
                      {redemptionsFilter === 'pending' ? 'No Pending Redemptions' : 'No Redemptions Yet'}
                    </h3>
                    <p className="text-sm text-stone-400 mt-1">
                      {redemptionsFilter === 'pending'
                        ? 'All customer reward vouchers have been processed.'
                        : 'Customer vouchers and redemptions will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    {(redemptionsFilter === 'pending' ? pendingRedemptions : allRedemptions).map((redemption: any) => (
                      <div key={redemption.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-base">{redemption.reward?.name || redemption.rewardName || 'Reward'}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              {redemption.pointsSpent} pts
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                redemption.status === 'REDEEMED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : redemption.status === 'REJECTED'
                                  ? 'bg-red-50 text-red-700'
                                  : redemption.status === 'APPROVED'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {redemption.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Requested by <strong className="text-stone-800">{redemption.customer?.name || redemption.account?.user?.name || 'Customer'}</strong> •{' '}
                            {new Date(redemption.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(redemption.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {(redemption.status === 'REQUESTED' || redemption.status === 'APPROVED') ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setVerifyModal({
                                  redemptionId: redemption.id,
                                  customerName: redemption.customer?.name || redemption.account?.user?.name || 'Customer',
                                  rewardName: redemption.rewardName || redemption.reward?.name || 'Reward',
                                })
                              }
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Verify & Redeem
                            </button>
                            <button
                              onClick={() => handleProcessRedemption(redemption.id, 'REJECT')}
                              className="px-3 py-2 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-stone-400">
                            {redemption.status === 'REDEEMED' && redemption.redeemedAt && (
                              <span>Fulfilled at {new Date(redemption.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                            {redemption.status === 'REJECTED' && (
                              <span>Declined: {redemption.rejectionReason || 'Declined by owner'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Check-Ins Review */}
            {activeTab === 'checkins' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">Visit Check-In Approvals</h2>
                  <p className="text-stone-500 text-sm">
                    Confirm in-person cafe visits to credit patrons with loyalty points.
                  </p>
                </div>

                {recentCheckIns.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                    <CalendarCheck className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-stone-800">No Pending Check-Ins</h3>
                    <p className="text-sm text-stone-400 mt-1">
                      When patrons check in on your cafe profile, their visit verifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    {recentCheckIns.map((checkIn: any) => (
                      <div key={checkIn.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-base">
                              {checkIn.user?.name || checkIn.account?.user?.name || 'Cafe Patron'}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              +{overview?.program?.pointsPerVisit || 10} pts
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            {checkIn.user?.email || checkIn.account?.user?.email} • Checked in{' '}
                            {new Date(checkIn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(checkIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {checkIn.visitNotes && (
                            <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg mt-1 italic border border-stone-100">
                              "{checkIn.visitNotes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReviewCheckIn(checkIn.id, true)}
                            disabled={reviewingCheckInId === checkIn.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve (+{overview?.program?.pointsPerVisit || 10} pts)
                          </button>
                          <button
                            onClick={() => handleReviewCheckIn(checkIn.id, false)}
                            disabled={reviewingCheckInId === checkIn.id}
                            className="px-3 py-2 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Customers / Members */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">Enrolled Patrons</h2>
                    <p className="text-stone-500 text-sm">Customers actively enrolled in your cafe's loyalty program.</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search member name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-coffee/20 w-full sm:w-64"
                    />
                  </div>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                    <Users className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-stone-800">
                      {customerSearch ? 'No matching members found' : 'No Enrolled Members Yet'}
                    </h3>
                    <p className="text-sm text-stone-400 mt-1">
                      {customerSearch ? 'Try a different search term.' : 'Patrons who join on your cafe profile will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-medium border-b border-stone-100">
                          <tr>
                            <th className="px-6 py-4">Patron</th>
                            <th className="px-6 py-4">Points Balance</th>
                            <th className="px-6 py-4">Lifetime Earned</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredCustomers.map((c: any) => (
                            <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-stone-900">{c.user?.name || 'Customer'}</div>
                                <div className="text-xs text-stone-400">{c.user?.email}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-stone-900">{c.pointsBalance} pts</td>
                              <td className="px-6 py-4 text-stone-500 text-xs">{c.lifetimePointsEarned} pts</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() =>
                                    setAwardModal({
                                      accountId: c.id,
                                      customerName: c.user?.name || 'Customer',
                                    })
                                  }
                                  className="px-3 py-1.5 bg-brand-coffee text-white text-xs font-semibold rounded-lg hover:bg-brand-coffee/90 shadow-sm transition-colors cursor-pointer"
                                >
                                  + Award Points
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal: Add/Edit Reward */}
        {isRewardModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {editingRewardId ? 'Edit Reward' : 'Create New Reward'}
              </h3>
              <form onSubmit={handleSaveReward} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Reward Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                    placeholder="e.g. Free Oat Latte"
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Points Cost *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    required
                    value={rewardForm.pointsCost}
                    onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: Number(e.target.value) })}
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Stock Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rewardForm.stockLimit}
                    onChange={(e) => setRewardForm({ ...rewardForm, stockLimit: e.target.value })}
                    placeholder="Unlimited if empty"
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={rewardForm.description}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                    placeholder="Any size, cold or hot."
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsRewardModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReward}
                    className="px-5 py-2 bg-brand-coffee text-white rounded-xl text-sm font-semibold hover:bg-brand-coffee/90 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {savingReward ? 'Saving...' : 'Save Reward'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Verify Voucher Code */}
        {verifyModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="text-xl font-serif font-bold text-stone-900">Verify Voucher Code</h3>
              <p className="text-stone-500 text-xs">
                Enter the voucher code displayed on {verifyModal.customerName}'s phone to redeem{' '}
                <strong>{verifyModal.rewardName}</strong>, or click Fulfill Reward if already verified.
              </p>

              <div>
                <input
                  type="text"
                  autoFocus
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CF-XXXX-XXXX"
                  className="w-full text-center font-mono font-bold text-lg tracking-wider rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModal(null);
                    setVerificationCodeInput('');
                  }}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessRedemption(verifyModal.redemptionId, 'REDEEM')}
                  disabled={processingRedemption}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {processingRedemption ? 'Verifying...' : 'Fulfill Reward'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Award Points */}
        {awardModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="text-xl font-serif font-bold text-stone-900">Award Points</h3>
              <p className="text-stone-500 text-xs">
                Issue bonus loyalty points to <strong>{awardModal.customerName}</strong>.
              </p>

              <form onSubmit={handleIssuePoints} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Points to Award *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Reason / Description *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    placeholder="e.g. Tasting event attendee, receipt verified"
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAwardModal(null);
                      setAwardReason('');
                    }}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuingPoints}
                    className="px-5 py-2 bg-brand-coffee text-white rounded-xl text-sm font-semibold hover:bg-brand-coffee/90 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {issuingPoints ? 'Awarding...' : 'Confirm Award'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
