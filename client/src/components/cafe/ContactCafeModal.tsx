import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { inquiryService, InquiryCategory, InquirySource, INQUIRY_CATEGORIES } from '@/services/inquiryService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContactCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  cafeName: string;
  defaultCategory?: InquiryCategory;
  defaultSubject?: string;
  source?: InquirySource;
  eventContext?: { id: string; title: string };
  specialContext?: { id: string; title: string };
}

export const ContactCafeModal: React.FC<ContactCafeModalProps> = ({
  isOpen,
  onClose,
  cafeId,
  cafeName,
  defaultCategory = 'GENERAL',
  defaultSubject = '',
  source = 'CAFE_PROFILE',
  eventContext,
  specialContext,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [subject, setSubject] = useState(defaultSubject);
  const [category, setCategory] = useState<InquiryCategory>(defaultCategory);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject || (eventContext ? `Event: ${eventContext.title}` : specialContext ? `Special: ${specialContext.title}` : ''));
      setCategory(defaultCategory);
      setMessage('');
      if (user) {
        setGuestName(user.name);
        setGuestEmail(user.email);
      }
    }
  }, [isOpen, defaultSubject, defaultCategory, eventContext, specialContext, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!subject.trim() || !message.trim()) {
      toast.error('Please enter a subject and message.');
      return;
    }

    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      toast.error('Please provide your name and email so the cafe can reply.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inquiryService.submitInquiry(cafeId, {
        subject: subject.trim(),
        message: message.trim(),
        category,
        source,
        guestName: !isAuthenticated ? guestName.trim() : undefined,
        guestEmail: !isAuthenticated ? guestEmail.trim() : undefined,
        eventId: eventContext?.id,
        specialId: specialContext?.id,
      });

      if (res.success) {
        toast.success('Your message has been sent to the cafe!');
        onClose();
      } else {
        toast.error((res.error as any)?.message || 'Failed to send inquiry.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact {cafeName}</DialogTitle>
          <DialogDescription>
            Send a direct question or request to the cafe management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestEmail">Your Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="category">Topic / Category</Label>
            <select
              id="category"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-brand-primary focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as InquiryCategory)}
            >
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is your question about?"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              rows={4}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-brand-primary focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your inquiry here..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
