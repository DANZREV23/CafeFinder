import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  RotateCcw,
  Loader2,
  Building2,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import {
  inquiryService,
  CustomerInquiryItem,
  INQUIRY_CATEGORIES,
} from '../services/inquiryService';

export default function CustomerInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<CustomerInquiryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getMyInquiryById(id);
      if (res.success) {
        setInquiry(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiry details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !replyText.trim()) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await inquiryService.replyToMyInquiry(id, replyText.trim());
      if (res.success) {
        setInquiry(res.data);
        setReplyText('');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await inquiryService.reopenMyInquiry(id);
      if (res.success) {
        setInquiry(res.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: string) =>
    INQUIRY_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
        </div>
      </MainLayout>
    );
  }

  if (error || !inquiry) {
    return (
      <MainLayout>
        <PageContainer className="py-16 space-y-6">
          <Link
            to="/dashboard/inquiries"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Inquiries
          </Link>
          <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {error || 'Inquiry not found'}
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  const isClosed = inquiry.status === 'CLOSED';
  const isCafeActive = inquiry.cafe?.status === 'PUBLISHED';
  const repliesCount = inquiry.responses?.length || 0;
  const maxReplies = inquiry.maxReplies || 20;
  const reachedLimit = repliesCount >= maxReplies;

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/dashboard/inquiries"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Inquiries
          </Link>
          {inquiry.cafe && (
            <Link
              to={`/cafes/${inquiry.cafe.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-coffee hover:underline"
            >
              <Building2 className="w-4 h-4" /> View {inquiry.cafe.name}
            </Link>
          )}
        </div>

        {/* Header Card */}
        <div className="p-8 rounded-3xl bg-white border border-brand-border shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cream text-brand-coffee">
                {getCategoryLabel(inquiry.category)}
              </span>
              {inquiry.status === 'RESPONDED' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Responded
                </span>
              ) : inquiry.status === 'CLOSED' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                  Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> {inquiry.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <span className="text-xs text-brand-muted">
              Submitted {new Date(inquiry.createdAt).toLocaleString()}
            </span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-brand-charcoal">
              {inquiry.subject}
            </h1>
            {inquiry.cafe && (
              <p className="text-sm text-brand-muted mt-1">
                To: <strong className="text-brand-charcoal">{inquiry.cafe.name}</strong> ({inquiry.cafe.city})
              </p>
            )}
          </div>

          {inquiry.event && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Related Event: <strong>{inquiry.event.title}</strong>
              </span>
            </div>
          )}

          {inquiry.special && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Related Special: <strong>{inquiry.special.title}</strong>
              </span>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-brand-background border border-brand-border/60">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
              Your Original Question
            </p>
            <p className="text-sm text-brand-charcoal whitespace-pre-wrap leading-relaxed">
              {inquiry.message}
            </p>
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-brand-charcoal">
            Responses ({repliesCount}/{maxReplies})
          </h2>

          {!inquiry.responses || inquiry.responses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-brand-border text-center text-sm text-brand-muted">
              The cafe hasn't responded yet. You will be notified as soon as they reply.
            </div>
          ) : (
            <div className="space-y-4">
              {inquiry.responses.map((resp) => {
                const isCustomer = resp.senderRole === 'CUSTOMER';
                return (
                  <div
                    key={resp.id}
                    className={`p-5 rounded-2xl border ${
                      isCustomer
                        ? 'bg-white border-brand-border ml-0 md:ml-12'
                        : 'bg-brand-cream/50 border-brand-coffee/20 mr-0 md:mr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-brand-charcoal">
                        {resp.senderName || (isCustomer ? 'You' : `${inquiry.cafe?.name} Team`)}
                      </span>
                      <span className="text-[11px] text-brand-muted">
                        {new Date(resp.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-brand-charcoal whitespace-pre-wrap leading-relaxed">
                      {resp.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply or Reopen Box */}
        <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-4">
          {actionError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {!isCafeActive ? (
            <p className="text-sm text-brand-muted text-center">
              This cafe is no longer active and cannot receive further replies.
            </p>
          ) : reachedLimit ? (
            <p className="text-sm text-brand-muted text-center">
              This inquiry has reached the maximum limit of {maxReplies} messages. Please submit a new inquiry if you have another question.
            </p>
          ) : isClosed ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-brand-charcoal">This inquiry is closed</h3>
                <p className="text-xs text-brand-muted">
                  Need to ask a follow-up question on this topic? You can reopen the inquiry.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleReopen}
                disabled={submitting}
                className="rounded-xl gap-2 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Reopen Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="customer-reply-input" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                  Follow-up Reply
                </label>
                <span className="text-[11px] text-brand-muted">{replyText.length}/5000</span>
              </div>
              <textarea
                id="customer-reply-input"
                rows={3}
                maxLength={5000}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a follow-up message..."
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || replyText.trim().length < 2}
                  className="rounded-xl gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
