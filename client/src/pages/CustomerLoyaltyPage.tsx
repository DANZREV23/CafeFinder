import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { loyaltyService, CustomerLoyaltyDashboard, RewardRedemption, LoyaltyAccount } from '@/services/loyaltyService';
import { Gift, Award, Coffee, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerLoyaltyPage() {
  const { programId } = useParams<{ programId?: string }>();
  const [data, setData] = useState<CustomerLoyaltyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'programs' | 'redemptions' | 'rewards'>('programs');
  const [selectedAccount, setSelectedAccount] = useState<LoyaltyAccount | null>(null);
  const [viewingCode, setViewingCode] = useState<{ id: string; code: string; hint: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await loyaltyService.getCustomerDashboard();
      if (res.success) {
        setData(res.data);
        if (programId && res.data.accounts) {
          const acc = res.data.accounts.find((a) => a.programId === programId);
          if (acc) setSelectedAccount(acc);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load loyalty dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [programId]);

  const handleCancelRedemption = async (redemptionId: string) => {
    if (!confirm('Are you sure you want to cancel this pending redemption? Your points will be refunded.')) return;
    setCancellingId(redemptionId);
    try {
      const res = await loyaltyService.cancelRedemption(redemptionId);
      if (res.success) {
        toast.success('Redemption cancelled and points refunded');
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel redemption');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLeaveProgram = async (pId: string, cafeName: string) => {
    if (!confirm(`Are you sure you want to leave the loyalty program for ${cafeName}? Historical transaction records will remain archived.`)) return;
    try {
      const res = await loyaltyService.leaveProgram(pId);
      if (res.success) {
        toast.success(res.message || 'Left loyalty program');
        setSelectedAccount(null);
        fetchDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave program');
    }
  };

  const handleGetCode = async (redemptionId: string) => {
    try {
      const res = await loyaltyService.regenerateCode(redemptionId);
      if (res.success) {
        setViewingCode({ id: redemptionId, code: res.data.plainCode, hint: res.data.codeHint });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to retrieve code');
    }
  };

  const accounts = data?.accounts || [];
  const redemptions = data?.redemptions || [];
  const availableRewards = data?.availableRewards || [];

  const totalPoints = accounts.reduce((acc, a) => acc + (a.pointsBalance || 0), 0);
  const totalEarned = accounts.reduce((acc, a) => acc + (a.lifetimePointsEarned || 0), 0);

  return (
    <MainLayout>
      <div className="bg-brand-cream/30 border-b border-brand-border py-8">
        <PageContainer>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-coffee/10 text-brand-coffee font-medium text-xs mb-2">
                <Award className="w-4 h-4" />
                Customer Loyalty Hub
              </div>
              <h1 className="text-3xl font-serif font-bold text-brand-coffee-dark">My Loyalty & Rewards</h1>
              <p className="text-brand-muted text-sm mt-1">
                Track your cafe memberships, points balance, and active redemption vouchers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/rewards"
                className="px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-coffee font-medium text-sm hover:bg-brand-cream transition flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Browse Rewards
              </Link>
              <button
                onClick={fetchDashboard}
                className="p-2.5 rounded-xl border border-brand-border bg-white text-brand-muted hover:text-brand-coffee transition"
                title="Refresh dashboard"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-2xl border border-brand-border">
              <span className="text-xs text-brand-muted block mb-1">Total Active Balance</span>
              <span className="text-2xl font-bold text-brand-coffee">{totalPoints} pts</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-brand-border">
              <span className="text-xs text-brand-muted block mb-1">Lifetime Earned</span>
              <span className="text-2xl font-bold text-amber-600">{totalEarned} pts</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-brand-border">
              <span className="text-xs text-brand-muted block mb-1">Enrolled Cafes</span>
              <span className="text-2xl font-bold text-brand-coffee-dark">{accounts.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-brand-border">
              <span className="text-xs text-brand-muted block mb-1">Active Redemptions</span>
              <span className="text-2xl font-bold text-emerald-600">
                {redemptions.filter((r) => r.status === 'APPROVED' || r.status === 'REQUESTED').length}
              </span>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-brand-border mb-8 space-x-6 text-sm font-semibold">
          <button
            onClick={() => { setActiveTab('programs'); setSelectedAccount(null); }}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'programs'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-brand-muted hover:text-brand-coffee'
            }`}
          >
            My Cafe Memberships ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('redemptions')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'redemptions'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-brand-muted hover:text-brand-coffee'
            }`}
          >
            Redemption Vouchers ({redemptions.length})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'rewards'
                ? 'border-brand-coffee text-brand-coffee'
                : 'border-transparent text-brand-muted hover:text-brand-coffee'
            }`}
          >
            Available Rewards ({availableRewards.length})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-brand-muted">Loading your loyalty data...</div>
        ) : (
          <div>
            {/* Tab: Programs */}
            {activeTab === 'programs' && (
              <div>
                {selectedAccount ? (
                  <div>
                    <button
                      onClick={() => setSelectedAccount(null)}
                      className="text-xs font-semibold text-brand-muted hover:text-brand-coffee mb-4 inline-flex items-center gap-1"
                    >
                      ← Back to all memberships
                    </button>

                    <div className="bg-white border border-brand-border rounded-2xl p-6 mb-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border/60 pb-6 mb-6">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full mb-2 inline-block">
                            Member since {new Date(selectedAccount.joinedAt).toLocaleDateString()}
                          </span>
                          <h2 className="text-2xl font-bold text-brand-coffee-dark">
                            {selectedAccount.program?.cafe?.name || 'Cafe Loyalty Program'}
                          </h2>
                          <p className="text-sm text-brand-muted">{selectedAccount.program?.name}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs text-brand-muted block">Current Balance</span>
                            <span className="text-3xl font-extrabold text-brand-coffee">
                              {selectedAccount.pointsBalance} pts
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              handleLeaveProgram(
                                selectedAccount.programId,
                                selectedAccount.program?.cafe?.name || 'this cafe'
                              )
                            }
                            className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition flex items-center gap-1.5"
                            title="Leave Program"
                          >
                            <LogOut className="w-4 h-4" />
                            Leave
                          </button>
                        </div>
                      </div>

                      {/* Terms */}
                      {selectedAccount.program?.termsAndConditions && (
                        <div className="bg-brand-cream/40 p-4 rounded-xl text-xs text-brand-muted mb-6">
                          <span className="font-semibold block mb-1">Program Terms & Rules:</span>
                          {selectedAccount.program.termsAndConditions}
                        </div>
                      )}

                      {/* Transaction Ledger */}
                      <h3 className="text-lg font-bold text-brand-coffee-dark mb-4">Points Activity Ledger</h3>
                      {selectedAccount.transactions && selectedAccount.transactions.length > 0 ? (
                        <div className="divide-y divide-brand-border/60 border border-brand-border rounded-xl overflow-hidden">
                          {selectedAccount.transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex items-center justify-between text-sm bg-white">
                              <div>
                                <span className="font-medium text-brand-coffee block">
                                  {tx.description || `${tx.type} transaction`}
                                </span>
                                <span className="text-xs text-brand-muted">
                                  {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span
                                className={`font-bold ${
                                  tx.points > 0 ? 'text-emerald-600' : 'text-brand-coffee'
                                }`}
                              >
                                {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-brand-muted">No transactions recorded yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {accounts.length === 0 ? (
                      <div className="text-center py-16 bg-white border border-dashed border-brand-border rounded-3xl p-8">
                        <Award className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-brand-coffee mb-2">You haven't joined any loyalty programs yet</h3>
                        <p className="text-brand-muted text-sm max-w-md mx-auto mb-6">
                          Visit any participating cafe's profile page and click "Join Loyalty Program" to start earning points for visits.
                        </p>
                        <Link
                          to="/explore"
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-coffee text-white text-sm font-medium hover:bg-brand-coffee-dark transition"
                        >
                          Find Cafes
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs hover:border-brand-coffee/40 transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-brand-coffee-dark">
                                    {account.program?.cafe?.name || 'Cafe Program'}
                                  </h3>
                                  <span className="text-xs text-brand-muted">{account.program?.name}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-brand-cream text-brand-coffee">
                                  <Coffee className="w-5 h-5" />
                                </div>
                              </div>

                              <div className="my-4 p-4 rounded-xl bg-brand-cream/50 flex items-center justify-between">
                                <span className="text-xs text-brand-muted font-medium">Balance</span>
                                <span className="text-2xl font-extrabold text-brand-coffee">
                                  {account.pointsBalance} pts
                                </span>
                              </div>

                              <div className="flex justify-between text-xs text-brand-muted mb-4">
                                <span>Earned: {account.lifetimePointsEarned} pts</span>
                                <span>Redeemed: {account.lifetimePointsRedeemed} pts</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedAccount(account)}
                              className="w-full py-2.5 rounded-xl bg-brand-coffee text-white text-sm font-semibold hover:bg-brand-coffee-dark transition flex items-center justify-center gap-1.5"
                            >
                              View Details & Ledger <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Redemptions */}
            {activeTab === 'redemptions' && (
              <div>
                {redemptions.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-brand-border rounded-3xl p-8">
                    <Gift className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-brand-coffee mb-2">No Redemptions Yet</h3>
                    <p className="text-brand-muted text-sm mb-4">
                      When you redeem loyalty points for rewards, your vouchers and verification codes will appear here.
                    </p>
                    <button
                      onClick={() => setActiveTab('rewards')}
                      className="px-5 py-2.5 rounded-xl bg-brand-coffee text-white text-sm font-medium"
                    >
                      Browse Rewards
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {redemptions.map((redemption) => {
                      const isPending = redemption.status === 'REQUESTED';
                      const isApproved = redemption.status === 'APPROVED';
                      const isRedeemed = redemption.status === 'REDEEMED';
                      const isCancelled = redemption.status === 'CANCELLED' || redemption.status === 'REJECTED';

                      return (
                        <div
                          key={redemption.id}
                          className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : isRedeemed
                                    ? 'bg-brand-cream text-brand-coffee'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {redemption.status}
                              </span>
                              <span className="text-xs text-brand-muted">
                                Requested {new Date(redemption.requestedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="text-lg font-bold text-brand-coffee-dark">
                              {redemption.reward?.name || 'Loyalty Reward'}
                            </h4>
                            <p className="text-xs text-brand-muted">
                              Points spent: <span className="font-semibold text-brand-coffee">{redemption.pointsSpent} pts</span>
                              {redemption.codeHint && ` • Code ending in ...${redemption.codeHint}`}
                            </p>

                            {redemption.rejectionReason && (
                              <p className="text-xs text-red-600 mt-2">Reason: {redemption.rejectionReason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {(isApproved || isPending) && (
                              <button
                                onClick={() => handleGetCode(redemption.id)}
                                className="px-4 py-2 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition"
                              >
                                View Voucher Code
                              </button>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleCancelRedemption(redemption.id)}
                                disabled={cancellingId === redemption.id}
                                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition"
                              >
                                {cancellingId === redemption.id ? 'Refunding...' : 'Cancel Request'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Available Rewards */}
            {activeTab === 'rewards' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-brand-cream text-brand-coffee font-bold text-xs">
                          {reward.pointsCost} Points
                        </span>
                        <Gift className="w-5 h-5 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-bold text-brand-coffee-dark mb-1">{reward.name}</h4>
                      <p className="text-xs text-brand-muted line-clamp-3 mb-4">{reward.description}</p>
                    </div>

                    <Link
                      to="/rewards"
                      className="w-full py-2.5 rounded-xl border border-brand-border text-center text-xs font-semibold text-brand-coffee hover:bg-brand-cream transition"
                    >
                      Redeem on Catalog
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>

      {/* Code Modal */}
      {viewingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setViewingCode(null)}
              className="absolute right-4 top-4 text-brand-muted hover:text-brand-coffee"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-brand-cream text-brand-coffee flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-coffee-dark mb-1">Redemption Code</h3>
            <p className="text-xs text-brand-muted mb-4">
              Present this verification code to cafe staff when placing your order.
            </p>

            <div className="bg-brand-cream/80 p-4 rounded-2xl border border-brand-border mb-6">
              <span className="text-2xl font-mono font-extrabold tracking-widest text-brand-coffee-dark">
                {viewingCode.code}
              </span>
            </div>

            <button
              onClick={() => setViewingCode(null)}
              className="w-full py-2.5 rounded-xl bg-brand-coffee text-white font-medium text-sm hover:bg-brand-coffee-dark transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
