import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  MessageSquare,
  User as UserIcon,
  Coffee,
  Loader2,
  AlertCircle
} from "lucide-react";
import { claimService, Claim, ClaimStatus } from "@/services/claimService";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminClaimsPage() {
  const { user, isAuthenticated } = useAuth();
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await claimService.getPendingClaims();
      if (response.success) {
        setClaims(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch claims");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchClaims();
    }
  }, [user?.role]);

  const handleReview = async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this claim?`)) return;
    
    setProcessingId(claimId);
    try {
      const response = await claimService.reviewClaim(claimId, status);
      if (response.success) {
        setClaims(prev => prev.filter(c => c.id !== claimId));
      } else {
        alert(response.error?.message || "Failed to process claim");
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-brand-background">
        <PageContainer className="py-12 md:py-20">
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand-coffee font-bold uppercase tracking-widest text-xs">
                <div className="h-px w-8 bg-brand-coffee" />
                Administration
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-charcoal">Ownership Claims</h1>
              <p className="text-brand-muted text-lg">
                Review and verify ownership requests for cafes in Davao City.
              </p>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-white border border-brand-border rounded-[32px] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-red-600 font-bold">{error}</p>
                <Button onClick={fetchClaims} variant="outline" className="rounded-xl">Try Again</Button>
              </div>
            ) : claims.length > 0 ? (
              <div className="grid gap-6">
                <AnimatePresence>
                  {claims.map((claim) => (
                    <motion.div
                      key={claim.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-brand-border rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Cafe Info */}
                        <div className="lg:col-span-1 space-y-4">
                          <div className="flex items-center gap-3 text-brand-coffee text-xs font-bold uppercase tracking-widest">
                            <Coffee className="w-4 h-4" />
                            Target Cafe
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-brand-charcoal group-hover:text-brand-coffee transition-colors">
                              {claim.cafeName}
                            </h3>
                            <Link to={`/cafes/${claim.cafeId}`} target="_blank" className="text-xs text-brand-muted flex items-center gap-1 mt-1 hover:underline">
                              View Profile <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="lg:col-span-1 space-y-4">
                          <div className="flex items-center gap-3 text-brand-coffee text-xs font-bold uppercase tracking-widest">
                            <UserIcon className="w-4 h-4" />
                            Claimant
                          </div>
                          <div>
                            <p className="font-bold text-brand-charcoal">{claim.userName}</p>
                            <p className="text-sm text-brand-muted">{claim.businessName}</p>
                          </div>
                        </div>

                        {/* Verification Info */}
                        <div className="lg:col-span-1 space-y-4">
                          <div className="flex items-center gap-3 text-brand-coffee text-xs font-bold uppercase tracking-widest">
                            <MessageSquare className="w-4 h-4" />
                            Verification Proof
                          </div>
                          <p className="text-sm text-brand-muted line-clamp-3 italic">
                            "{claim.verificationInformation}"
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-1 flex flex-col justify-center gap-3">
                          <Button 
                            variant="primary" 
                            className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none"
                            disabled={!!processingId}
                            onClick={() => handleReview(claim.id, 'APPROVED')}
                          >
                            {processingId === claim.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve Claim
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-12 rounded-xl text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                            disabled={!!processingId}
                            onClick={() => handleReview(claim.id, 'REJECTED')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-brand-border flex items-center justify-between text-xs text-brand-muted">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Submitted {format(new Date(claim.submittedAt), 'PPp')}
                        </div>
                        <div className="bg-brand-cream text-brand-coffee px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                          {claim.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white border border-brand-border rounded-[40px] p-20 text-center space-y-8">
                <div className="w-20 h-20 bg-brand-background rounded-3xl flex items-center justify-center mx-auto text-brand-muted">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="space-y-4 max-w-sm mx-auto">
                  <h2 className="text-3xl font-serif font-bold text-brand-charcoal">No pending claims</h2>
                  <p className="text-brand-muted leading-relaxed">
                    You're all caught up! There are currently no cafe ownership claims awaiting your review.
                  </p>
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </div>
    </MainLayout>
  );
}
