import * as React from "react";
import { 
  ShieldCheck, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { claimService } from "@/services/claimService";
import { useI18n } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";

interface ClaimCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  cafeName: string;
}

export function ClaimCafeModal({ isOpen, onClose, cafeId, cafeName }: ClaimCafeModalProps) {
  const { t } = useI18n();
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
        setError(response.error?.message || t("common.error"));
      }
    } catch (err) {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:rounded-[32px] p-0 overflow-hidden">
        {success ? (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-serif font-bold text-brand-charcoal">Claim Submitted!</DialogTitle>
              <DialogDescription className="text-brand-muted leading-relaxed">
                Thank you for claiming <strong>{cafeName}</strong>. Our team will review your application and documents. You'll receive a notification once approved.
              </DialogDescription>
            </div>
            <Button onClick={onClose} variant="primary" className="w-full h-14 rounded-2xl">
              Got it
            </Button>
          </div>
        ) : (
          <div className="p-0">
            <div className="px-8 pt-8 flex items-center justify-between">
              <div className="flex items-center gap-3 text-brand-coffee font-bold uppercase tracking-widest text-[10px]">
                <ShieldCheck className="w-4 h-4" />
                Business Verification
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-serif font-bold text-brand-charcoal">
                    {t("cafe.claimThis")} {cafeName}
                  </DialogTitle>
                  <DialogDescription className="text-brand-muted">
                    Are you the owner of this cafe? Claiming allows you to manage details, respond to reviews, and view insights.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="businessName" className="text-sm font-bold text-brand-charcoal">
                      Official Business Name
                    </label>
                    <Input 
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter legal business name"
                      required
                      className="h-12 bg-brand-background border-transparent focus:bg-white focus:ring-brand-coffee/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="verificationInfo" className="text-sm font-bold text-brand-charcoal">
                      Verification Details
                    </label>
                    <textarea 
                      id="verificationInfo"
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
                  <div role="alert" className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="bg-brand-cream/30 p-4 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-brand-coffee shrink-0" aria-hidden="true" />
                  <p className="text-xs text-brand-coffee-dark leading-relaxed">
                    Your claim will be reviewed by our administrators. We might contact you via email for further verification documents.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  isLoading={loading}
                  className="w-full h-14 rounded-2xl"
                  variant="primary"
                >
                  {loading ? "Submitting..." : "Submit Claim Request"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
