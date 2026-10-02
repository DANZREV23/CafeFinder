import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import reviewService, { ReviewResponse } from '@/services/reviewService';

interface OwnerResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string | null;
  cafeName?: string;
  reviewerName?: string;
  existingResponse?: ReviewResponse | null;
  onResponseSaved?: (response: any) => void;
}

export const OwnerResponseModal: React.FC<OwnerResponseModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  cafeName,
  reviewerName,
  existingResponse,
  onResponseSaved,
}) => {
  const [content, setContent] = useState<string>(existingResponse?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (existingResponse) {
      setContent(existingResponse.content);
    } else {
      setContent('');
    }
    setError(null);
  }, [existingResponse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId && !existingResponse) return;

    if (content.trim().length < 5) {
      setError('Response must be at least 5 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let savedResponse;
      if (existingResponse) {
        const res = await reviewService.updateResponse(existingResponse.id, content.trim());
        savedResponse = res.data;
      } else {
        const res = await reviewService.createResponse(reviewId!, content.trim());
        savedResponse = res.data;
      }

      onResponseSaved?.(savedResponse);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save owner response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 bg-white rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-brand-coffee mb-1">
            <MessageSquare className="w-5 h-5 text-brand-coffee" />
            <DialogTitle className="text-xl font-serif font-bold text-brand-charcoal">
              {existingResponse ? 'Edit Owner Response' : 'Respond to Customer Review'}
            </DialogTitle>
          </div>
          <p className="text-xs text-brand-muted">
            Replying on behalf of <strong className="text-brand-charcoal">{cafeName || 'your cafe'}</strong> to {reviewerName || 'this reviewer'}.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="p-3.5 bg-brand-cream/40 border border-brand-coffee/10 rounded-2xl text-xs text-brand-coffee-dark space-y-1">
            <p className="font-bold">Guidelines for responding:</p>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600">
              <li>Thank the reviewer for visiting and sharing feedback</li>
              <li>Address specific points constructively and politely</li>
              <li>Keep the tone welcoming, professional, and respectful</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Your Response
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Thank you for taking the time to share your feedback..."
              rows={5}
              maxLength={1500}
              className="w-full p-3.5 rounded-2xl border border-brand-border bg-white text-sm text-brand-charcoal focus:ring-2 focus:ring-brand-coffee outline-none resize-none"
              required
            />
            <div className="flex justify-between items-center text-[10px] text-brand-muted">
              <span>Minimum 5 characters</span>
              <span>{content.length}/1500 characters</span>
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
            <Button type="submit" variant="primary" disabled={loading} className="bg-brand-coffee text-white hover:bg-brand-coffee-dark">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {existingResponse ? 'Save Changes' : 'Publish Response'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
