import * as React from "react";
import { 
  X, 
  ShieldCheck, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { claimService } from "@/services/claimService";
import { motion, AnimatePresence } from "motion/react";

interface ClaimCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  cafeName: string;
}

export function ClaimCafeModal({ isOpen, onClose, cafeId, cafeName }: ClaimCafeModalProps) {
  const [businessName, setBusinessName] = React.useState(cafeName);
  const [verificationInfo, setVerificationInfo] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await claimService.submitClaim({
        cafeId,
        businessName,
        verificationInformation: verificationInfo
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error?.message || "Failed to submit claim");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm" 
              onClick={onClose} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              {success ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Claim Submitted!</h2>
                    <p className="text-brand-muted leading-relaxed">
                      Thank you for claiming <strong>{cafeName}</strong>. Our team will review your application and documents. You'll receive a notification once approved.
                    </p>
                  </div>
                  <Button onClick={onClose} variant="primary" className="w-full h-14 rounded-2xl">
                    Got it
                  </Button>
                </div>
              ) : (
                <>
                  <div className="px-8 pt-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-brand-coffee font-bold uppercase tracking-widest text-[10px]">
                      <ShieldCheck className="w-4 h-4" />
                      Business Verification
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-background rounded-full transition-colors text-brand-muted">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Claim {cafeName}</h2>
                      <p className="text-brand-muted">
                        Are you the owner of this cafe? Claiming allows you to manage details, respond to reviews, and view insights.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-brand-charcoal">Official Business Name</label>
                          <Input 
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Enter legal business name"
                            required
                            className="h-12 bg-brand-background border-transparent focus:bg-white focus:ring-brand-coffee/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-brand-charcoal">Verification Details</label>
                          <textarea 
                            value={verificationInfo}
                            onChange={(e) => setVerificationInfo(e.target.value)}
                            placeholder="Tell us about your role and any business registration details (DTI/SEC, etc.)"
                            required
                            rows={4}
                            className="w-full p-4 rounded-2xl bg-brand-background border-transparent focus:bg-white focus:ring-brand-coffee/20 focus:outline-none transition-all text-brand-charcoal placeholder:text-brand-muted/60"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="bg-brand-cream/30 p-4 rounded-2xl flex gap-3">
                        <Info className="w-5 h-5 text-brand-coffee shrink-0" />
                        <p className="text-xs text-brand-coffee-dark leading-relaxed">
                          Your claim will be reviewed by our administrators. We might contact you via email for further verification documents.
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-14 rounded-2xl"
                        variant="primary"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : "Submit Claim Request"}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
