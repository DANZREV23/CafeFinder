import React, { useState, useEffect } from 'react';
import { X, Send, HelpCircle, CheckCircle2, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  inquiryService,
  InquiryCategory,
  InquirySource,
  INQUIRY_CATEGORIES,
} from '../../services/inquiryService';
import { Link } from 'react-router-dom';

interface ContactCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  cafeName: string;
  defaultCategory?: InquiryCategory;
  defaultSubject?: string;
  source?: InquirySource;
  eventContext?: { id: string; title: string } | null;
  specialContext?: { id: string; title: string } | null;
}

export const ContactCafeModal: React.FC<ContactCafeModalProps> = ({
  isOpen,
  onClose,
  cafeId,
  cafeName,
  defaultCategory = 'GENERAL',
  defaultSubject = '',
  source = 'CAFE_PROFILE',
  eventContext = null,
  specialContext = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [category, setCategory] = useState<InquiryCategory>(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setSubject(defaultSubject);
      setMessage('');
      setError(null);
      setSubmittedId(null);
    }
  }, [isOpen, defaultCategory, defaultSubject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 3 || subject.trim().length > 150) {
      setError('Subject must be between 3 and 150 characters.');
      return;
    }
    if (message.trim().length < 10 || message.trim().length > 5000) {
      setError('Message must be between 10 and 5000 characters.');
      return;
    }

    if (!isAuthenticated) {
      if (guestName.trim().length < 2) {
        setError('Please enter your name.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        setError('Please enter a valid email address so the cafe can respond.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await inquiryService.submitInquiry(cafeId, {
        category,
        subject: subject.trim(),
        message: message.trim(),
        source,
        guestName: isAuthenticated ? undefined : guestName.trim(),
        guestEmail: isAuthenticated ? undefined : guestEmail.trim(),
        eventId: eventContext?.id,
        specialId: specialContext?.id,
      });

      if (response.success) {
        setSubmittedId(response.data.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-cafe-title"
    >
      <div className="bg-white rounded-3xl border border-brand-border max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-brand-cream/60 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-coffee text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="contact-cafe-title" className="text-lg font-serif font-bold text-brand-charcoal">
                Contact {cafeName}
              </h2>
              <p className="text-xs text-brand-muted">
                Ask about hours, menu options, seating, or events
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-brand-muted hover:text-brand-charcoal hover:bg-brand-border/30 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {submittedId ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-brand-charcoal">
                  Inquiry Sent to {cafeName}
                </h3>
                <p className="text-sm text-brand-muted max-w-sm mx-auto leading-relaxed">
                  {isAuthenticated
                    ? 'Your question has been delivered to the cafe owner. You will receive a notification and email when they respond.'
                    : 'Your question has been delivered. The cafe response will be sent to your email address.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {isAuthenticated && (
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to={`/dashboard/inquiries/${submittedId}`} onClick={onClose}>
                      View My Inquiry
                    </Link>
                  </Button>
                )}
                <Button variant="primary" onClick={onClose} className="rounded-xl">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Contextual Badge if from Event or Special */}
              {eventContext && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Asking about event: <strong>{eventContext.title}</strong>
                  </span>
                </div>
              )}

              {specialContext && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Asking about special: <strong>{specialContext.title}</strong>
                  </span>
                </div>
              )}

              {isAuthenticated && user ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                  <span>
                    Sending as <strong>{user.name}</strong>
                  </span>
                  <span className="text-[11px] text-stone-400">Your email remains private</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inquiry-guest-name" className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Your Name *
                    </label>
                    <input
                      id="inquiry-guest-name"
                      type="text"
                      required
                      maxLength={100}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                    />
                  </div>
                  <div>
                    <label htmlFor="inquiry-guest-email" className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Your Email *
                    </label>
                    <input
                      id="inquiry-guest-email"
                      type="email"
                      required
                      maxLength={150}
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="inquiry-category" className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                  Topic / Category *
                </label>
                <select
                  id="inquiry-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InquiryCategory)}
                  className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                >
                  {INQUIRY_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="inquiry-subject" className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    Subject *
                  </label>
                  <span className="text-[11px] text-brand-muted">{subject.length}/150</span>
                </div>
                <input
                  id="inquiry-subject"
                  type="text"
                  required
                  maxLength={150}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Do you have outdoor seating or vegan milk options?"
                  className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="inquiry-message" className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    Question / Message *
                  </label>
                  <span className="text-[11px] text-brand-muted">{message.length}/5000</span>
                </div>
                <textarea
                  id="inquiry-message"
                  required
                  rows={4}
                  maxLength={5000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your question clearly for the cafe team..."
                  className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee resize-y"
                />
              </div>

              <p className="text-[11px] text-brand-muted leading-relaxed">
                Please keep inquiries focused on cafe hours, menu items, reservations, or events. Spam or promotional solicitations are prohibited.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="rounded-xl gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send Inquiry'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
