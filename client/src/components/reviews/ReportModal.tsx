import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Loader2, Flag } from 'lucide-react';
import reviewService from '@/services/reviewService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string | null;
  reviewerName?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or commercial content' },
  { value: 'HARASSMENT', label: 'Harassment or hate speech' },
  { value: 'OFFENSIVE_CONTENT', label: 'Offensive or inappropriate language' },
  { value: 'FALSE_INFORMATION', label: 'Misleading or false information' },
  { value: 'DUPLICATE', label: 'Duplicate review' },
  { value: 'IRRELEVANT', label: 'Not related to this cafe' },
  { value: 'OTHER', label: 'Other violation' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  reviewerName,
  onReportSubmitted,
}) => {
  const [reason, setReason] = useState<string>('SPAM');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;

    setLoading(true);
    setError(null);

    try {
      await reviewService.reportReview(reviewId, reason, description);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        setReason('SPAM');
        onReportSubmitted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-brand-coffee mb-1">
            <Flag className="w-5 h-5 text-red-500" />
            <DialogTitle className="text-xl font-serif font-bold text-brand-charcoal">
              Report Review
            </DialogTitle>
          </div>
          <p className="text-xs text-brand-muted">
            Help maintain a respectful and safe community. {reviewerName ? `Reporting review by ${reviewerName}.` : ''}
          </p>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="font-bold text-brand-charcoal text-base">Report Submitted</h4>
            <p className="text-xs text-brand-muted">
              Thank you. Our moderation team will carefully review this submission against community guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-charcoal focus:ring-2 focus:ring-brand-coffee outline-none"
                required
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any specific context that may assist the moderators..."
                rows={3}
                maxLength={500}
                className="w-full p-3 rounded-xl border border-brand-border bg-white text-sm text-brand-charcoal focus:ring-2 focus:ring-brand-coffee outline-none resize-none"
              />
              <div className="text-[10px] text-brand-muted text-right">
                {description.length}/500 characters
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
