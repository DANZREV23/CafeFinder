import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { loyaltyService, LoyaltyProgram, Reward } from '@/services/loyaltyService';
import { ownerService } from '@/services/ownerService';
import { 
  Gift, 
  Award, 
  Coffee, 
  Plus, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight, 
  Edit2, 
  Key, 
  Search,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerLoyaltyPage() {
  const [searchParams] = useSearchParams();
  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string>('');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'program' | 'rewards' | 'customers' | 'redemptions'>('program');

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

  // Award points modal
  const [awardModal, setAwardModal] = useState<{ accountId: string; customerName: string } | null>(null);
  const [awardPoints, setAwardPoints] = useState(15);
  const [awardReason, setAwardReason] = useState('');
  const [issuingPoints, setIssuingPoints] = useState(false);

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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCafes(res.data);
        const queryCafeId = searchParams.get('cafeId');
        const matched = queryCafeId && res.data.find((c) => c.id === queryCafeId);
        setSelectedCafeId(matched ? matched.id : res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      toast.error('Failed to load owned cafes');
      setLoading(false);
    }
  };

  const loadOverview = async (cafeId: string) => {
    setLoading(true);
    try {
      const res = await loyaltyService.getOwnerOverview();
      if (res.success) {
        setOverview(res.data);
        // Find current cafe program if present
        const currentProg = res.data?.programs?.find((p: any) => p.cafeId === cafeId) || res.data?.program;
        if (currentProg) {
          setProgramForm({
            name: currentProg.name || '',
            description: currentProg.description || '',
            pointsEnabled: currentProg.pointsEnabled !== false,
            pointsPerVisit: currentProg.pointsPerVisit || 10,
            minimumRedemptionPoints: currentProg.minimumRedemptionPoints || 50,
            termsAndConditions: currentProg.termsAndConditions || '',
          });
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId) return;
    setSavingProgram(true);
    try {
      const res = await loyaltyService.upsertOwnerProgram(selectedCafeId, programForm);
      if (res.success) {
        toast.success('Loyalty program settings updated!');
        loadOverview(selectedCafeId);
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
        name: rewardForm.name,
        description: rewardForm.description,
        pointsCost: Number(rewardForm.pointsCost),
        stockLimit: rewardForm.stockLimit ? Number(rewardForm.stockLimit) : null,
      };

      if (editingRewardId) {
        await loyaltyService.updateOwnerReward(selectedCafeId, editingRewardId, payload);
        toast.success('Reward updated');
      } else {
        await loyaltyService.createOwnerReward(selectedCafeId, payload);
        toast.success('Reward created');
      }
      setIsRewardModalOpen(false);
      setEditingRewardId(null);
      setRewardForm({ name: '', description: '', pointsCost: 50, stockLimit: '' });
      loadOverview(selectedCafeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save reward');
    } finally {
      setSavingReward(false);
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
        undefined,
        action === 'REDEEM' ? verificationCodeInput.trim() : undefined
      );
      if (res.success) {
        toast.success(`Redemption ${action.toLowerCase()}d successfully`);
        setVerifyModal(null);
        setVerificationCodeInput('');
        loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} redemption`);
    } finally {
      setProcessingRedemption(false);
    }
  };

  const handleIssuePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeId || !awardModal) return;
    setIssuingPoints(true);
    try {
      const res = await loyaltyService.issueOwnerPoints(selectedCafeId, {
        accountId: awardModal.accountId,
        points: Number(awardPoints),
        description: awardReason.trim(),
        reason: awardReason.trim(),
      });
      if (res.success) {
        toast.success(`Awarded +${awardPoints} points to ${awardModal.customerName}`);
        setAwardModal(null);
        setAwardReason('');
        loadOverview(selectedCafeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue points');
    } finally {
      setIssuingPoints(false);
    }
  };

  const rewards = overview?.rewards || overview?.activeRewards || [];
  const pendingRedemptions = overview?.pendingRedemptions || [];
  const recentCheckIns = overview?.recentCheckIns || [];
  const customers = overview?.customers || overview?.enrolledCustomers || [];

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

          {cafes.length > 1 && (
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-2 shadow-sm">
              <span className="text-xs font-semibold text-stone-500 pl-2">Cafe:</span>
              <select
                value={selectedCafeId}
                onChange={(e) => setSelectedCafeId(e.target.value)}
                className="text-sm font-semibold text-stone-800 bg-white border-none focus:outline-none pr-3"
              >
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-px">
          {[
            { id: 'program', label: 'Program Settings', icon: Settings },
            { id: 'rewards', label: `Rewards (${rewards.length})`, icon: Gift },
            { id: 'redemptions', label: `Voucher Redemptions (${pendingRedemptions.length})`, icon: Clock },
            { id: 'customers', label: `Members (${customers.length})`, icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap ${
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
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">
              Configure Cafe Loyalty Program
            </h2>
            <p className="text-stone-500 text-sm mb-6">
              Reward repeat patrons with visit points redeemable for drinks, beans, and bakery items.
            </p>

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
                  placeholder="e.g. Blue Bottle VIP Perks"
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
                  <span className="text-xs text-stone-400 mt-1 block">Balance required to claim rewards</span>
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

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProgram}
                  className="px-6 py-3 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 transition-colors disabled:opacity-50"
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
            <div className="flex items-center justify-between">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-coffee text-white font-semibold rounded-xl text-sm hover:bg-brand-coffee/90 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Reward
              </button>
            </div>

            {rewards.length === 0 ? (
              <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                <Gift className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-800">No Rewards Created</h3>
                <p className="text-sm text-stone-400 mt-1">Add your first redeemable item like a free drip coffee or pastry.</p>
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {reward.pointsCost} Points
                        </span>
                        {reward.stockLimit && (
                          <span className="text-xs text-stone-400">
                            Stock: {reward.stockLimit - (reward.redeemedCount || 0)} left
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-900 text-base mt-2">{reward.name}</h3>
                      {reward.description && <p className="text-stone-500 text-xs mt-1">{reward.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span>Redeemed {reward.redeemedCount || 0} times</span>
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
                        className="text-brand-coffee hover:underline font-semibold"
                      >
                        Edit
                      </button>
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
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">Voucher Redemptions</h2>
              <p className="text-stone-500 text-sm">
                Verify voucher codes presented by customers in-store before handing over their reward.
              </p>
            </div>

            {pendingRedemptions.length === 0 ? (
              <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-800">No Pending Redemptions</h3>
                <p className="text-sm text-stone-400 mt-1">All customer reward vouchers have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                {pendingRedemptions.map((redemption: any) => (
                  <div key={redemption.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-base">{redemption.reward?.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {redemption.pointsSpent} pts
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Requested by <strong className="text-stone-800">{redemption.account?.user?.name}</strong> •{' '}
                        {new Date(redemption.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setVerifyModal({
                            redemptionId: redemption.id,
                            customerName: redemption.account?.user?.name,
                            rewardName: redemption.reward?.name,
                          })
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Verify & Redeem
                      </button>
                      <button
                        onClick={() => handleProcessRedemption(redemption.id, 'REJECT')}
                        className="px-3 py-2 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Customers / Members */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">Enrolled Patrons</h2>
              <p className="text-stone-500 text-sm">Customers actively enrolled in your cafe's loyalty program.</p>
            </div>

            {customers.length === 0 ? (
              <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl text-stone-500">
                <Users className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-800">No Enrolled Members Yet</h3>
                <p className="text-sm text-stone-400 mt-1">Patrons who join on your cafe profile will appear here.</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
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
                    {customers.map((c: any) => (
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
                            className="px-3 py-1.5 bg-brand-coffee text-white text-xs font-semibold rounded-lg hover:bg-brand-coffee/90 shadow-sm transition-colors"
                          >
                            + Award Points
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReward}
                    className="px-5 py-2 bg-brand-coffee text-white rounded-xl text-sm font-semibold hover:bg-brand-coffee/90 disabled:opacity-50"
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
                <strong>{verifyModal.rewardName}</strong>.
              </p>

              <div>
                <input
                  type="text"
                  autoFocus
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CF-XXXXXX"
                  className="w-full text-center font-mono font-bold text-lg tracking-wider rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModal(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessRedemption(verifyModal.redemptionId, 'REDEEM')}
                  disabled={processingRedemption}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
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
                    onClick={() => setAwardModal(null)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-sm font-semibold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuingPoints}
                    className="px-5 py-2 bg-brand-coffee text-white rounded-xl text-sm font-semibold hover:bg-brand-coffee/90 disabled:opacity-50"
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
