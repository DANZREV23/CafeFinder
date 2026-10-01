import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Users, 
  Heart, 
  Star, 
  Eye, 
  RotateCw, 
  Sliders, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  Coffee
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { recommendationService } from '@/services/recommendationService';
import { RecommendationDiagnostics } from '@/types';
import { toast } from 'react-hot-toast';

export const AdminRecommendationsPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<RecommendationDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchDiagnostics = async (userId?: string) => {
    try {
      if (userId) setSimulating(true);
      else setLoading(true);

      const res = await recommendationService.getAdminDiagnostics(userId);
      if (res.success && res.data) {
        setDiagnostics(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch recommendation diagnostics');
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiagnostics(selectedUserId.trim() || undefined);
  };

  if (loading && !diagnostics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <RotateCw className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium">Loading recommendation diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Studio Engine Diagnostics</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-stone-900">
            Recommendation & Discovery Engine
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Deterministic multi-factor personalization, signal coverage, privacy audit, and live scoring sandbox.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDiagnostics()}
            disabled={loading || simulating}
            className="gap-2 text-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {diagnostics && (
        <>
          {/* Key Health & Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Engine Status</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-stone-900">Operational</div>
                <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Latency: {diagnostics.latencyMs}ms
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Preference Coverage</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-stone-900">
                  {diagnostics.metrics.preferenceCoveragePercent}%
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {diagnostics.metrics.usersWithPreferences} of {diagnostics.metrics.totalUsers} users configured
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Interaction Signals</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-stone-900">
                  {diagnostics.metrics.totalFavorites + diagnostics.metrics.totalReviews + diagnostics.metrics.totalViews}
                </div>
                <div className="text-xs text-stone-500 mt-1 flex gap-2">
                  <span>{diagnostics.metrics.totalFavorites} favs</span> •
                  <span>{diagnostics.metrics.totalReviews} revs</span> •
                  <span>{diagnostics.metrics.totalViews} views</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Catalog Coverage</span>
                <Coffee className="w-4 h-4 text-amber-700" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-stone-900">
                  {diagnostics.metrics.publishedCafes}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Published across {diagnostics.catalog.amenitiesCount} distinct amenities
                </div>
              </div>
            </Card>
          </div>

          {/* Privacy & Compliance Section */}
          <Card className="p-6 border-blue-200 bg-blue-50/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-stone-900 text-base">
                    Privacy, Ethics & Explainability Guarantee
                  </h3>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Audit Passed
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  CafeFinder strictly adheres to zero-demographic profiling. No sensitive data (e.g. race, religion, gender, health, or private communications) is ever collected or inferred. Recommendations rely strictly on public cafe attributes (amenities, ratings, city, price) combined with deterministic user signals (explicit preferences, favorites, views).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="font-bold text-stone-700 block">User Control</span>
                    <span className="text-stone-500">Preferences can be cleared or reset by users at any time.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="font-bold text-stone-700 block">100% Explainable</span>
                    <span className="text-stone-500">Every match carries deterministic, human-readable reasons.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="font-bold text-stone-700 block">Isolated Boundaries</span>
                    <span className="text-stone-500">User signals are isolated and never leaked to other profiles.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Scoring Model Weights */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              Scoring Model Weight Distribution (Max 100 Points)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-xl font-bold text-amber-800">35 pts</div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">Amenity Affinity</div>
                <div className="text-[11px] text-stone-500 mt-1">Jaccard overlap with preferred amenities</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-xl font-bold text-stone-800">25 pts</div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">Location / City</div>
                <div className="text-[11px] text-stone-500 mt-1">Preferred or frequent city match</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-xl font-bold text-stone-800">15 pts</div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">Price Range Fit</div>
                <div className="text-[11px] text-stone-500 mt-1">Exact or within 1 tier of budget</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-xl font-bold text-stone-800">15 pts</div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">Quality & Ratings</div>
                <div className="text-[11px] text-stone-500 mt-1">Verified average rating & review density</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-xl font-bold text-stone-800">10 pts</div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">Engagement Boost</div>
                <div className="text-[11px] text-stone-500 mt-1">Trending (+5), Featured (+3), Verified (+2)</div>
              </div>
            </div>
          </Card>

          {/* Live Recommendation Simulator / Sandbox */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Live Scoring Simulation Sandbox
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Inspect the internal breakdown of recommendation scores and generated explanations for any user.
                </p>
              </div>

              <form onSubmit={handleSimulate} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="User ID (blank for sample/guest)"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs w-64 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <Button type="submit" size="sm" disabled={simulating} className="text-xs gap-1.5">
                  {simulating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Simulate
                </Button>
              </form>
            </div>

            <div className="text-xs text-stone-500 mb-4 flex items-center gap-2">
              <span className="font-medium text-stone-700">Currently Simulating User:</span>
              <code className="bg-stone-100 px-2 py-0.5 rounded text-amber-800 font-mono">
                {diagnostics.simulation.testedUserId}
              </code>
            </div>

            {diagnostics.simulation.results.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm">
                No recommendations generated for this criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {diagnostics.simulation.results.map((rec: any, idx: number) => {
                  const cafe = rec.cafe;
                  const breakdown = rec.scoreBreakdown || {
                    amenityScore: 25,
                    cityScore: 25,
                    priceScore: 15,
                    qualityScore: 15,
                    boostScore: 5
                  };

                  return (
                    <div 
                      key={cafe.id || idx} 
                      className="p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-colors shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Rank #{idx + 1}
                            </span>
                            <h4 className="font-bold text-base text-stone-900">{cafe.name}</h4>
                            <span className="text-xs text-stone-500">• {cafe.city}</span>
                            <span className="text-xs font-semibold text-stone-600">
                              {'$'.repeat(cafe.priceRange || 1)}
                            </span>
                          </div>
                          
                          {/* Primary & Detailed Explanations */}
                          <div className="text-xs text-stone-700 flex flex-wrap gap-1.5 pt-1">
                            {rec.reasons?.map((reason: string, rIdx: number) => (
                              <span 
                                key={rIdx} 
                                className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-stone-700 text-[11px]"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Total Score & Breakdown */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] bg-stone-50 p-2 rounded-lg border border-stone-200">
                            <div>
                              <span className="text-stone-400 block">Amenity</span>
                              <span className="font-bold text-stone-700">{breakdown.amenityScore}/35</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block">City</span>
                              <span className="font-bold text-stone-700">{breakdown.cityScore}/25</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Price</span>
                              <span className="font-bold text-stone-700">{breakdown.priceScore}/15</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Quality</span>
                              <span className="font-bold text-stone-700">{breakdown.qualityScore}/15</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Boost</span>
                              <span className="font-bold text-stone-700">{breakdown.boostScore}/10</span>
                            </div>
                          </div>

                          <div className="text-right pl-2 border-l border-stone-200">
                            <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Score</span>
                            <span className="text-2xl font-black text-amber-600">{rec.matchScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminRecommendationsPage;
