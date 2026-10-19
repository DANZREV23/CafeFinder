import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import reviewService, { ReviewResponse } from '@/services/reviewService';
import { toast } from 'sonner';

interface OwnerResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string | null;
  cafeName: string;
  reviewerName?: string;
  existingResponse?: ReviewResponse | null;
  onResponseSaved: () => void;
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
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(existingResponse?.content || '');
    }
  }, [isOpen, existingResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Response message cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      if (existingResponse) {
        await reviewService.updateResponse(existingResponse.id, content.trim());
        toast.success('Response updated successfully');
      } else if (reviewId) {
        await reviewService.createResponse(reviewId, content.trim());
        toast.success('Response submitted for review');
      }
      onResponseSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingResponse ? 'Edit Owner Response' : 'Respond to Customer Review'}
          </DialogTitle>
          <DialogDescription>
            {reviewerName
              ? `Replying to review from ${reviewerName} at ${cafeName}.`
              : `Replying as the management of ${cafeName}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="response-content">Your Response</Label>
            <textarea
              id="response-content"
              rows={5}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 focus:border-brand-primary focus:outline-none"
              placeholder="Thank the customer for visiting and address their feedback professionally..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-stone-500">
              Your response will appear publicly under the review once reviewed.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : existingResponse ? 'Update Response' : 'Submit Response'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
