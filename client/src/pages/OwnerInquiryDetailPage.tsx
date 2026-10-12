import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Play,
  Loader2,
  Calendar,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import {
  inquiryService,
  OwnerInquiryItem,
  InquiryStatus,
  InquiryPriority,
  INQUIRY_CATEGORIES,
} from '../services/inquiryService';

export default function OwnerInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<OwnerInquiryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getOwnerInquiryById(id);
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

  const handleUpdateStatus = async (status: InquiryStatus) => {
    if (!id) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await inquiryService.updateOwnerInquiry(id, { status });
      if (res.success) {
        setInquiry(res.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePriority = async () => {
    if (!id || !inquiry) return;
    const nextPriority: InquiryPriority = inquiry.priority === 'HIGH' ? 'NORMAL' : 'HIGH';
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await inquiryService.updateOwnerInquiry(id, { priority: nextPriority });
      if (res.success) {
        setInquiry(res.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update priority');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !responseMessage.trim()) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await inquiryService.respondToOwnerInquiry(id, responseMessage.trim());
      if (res.success) {
        setInquiry(res.data);
        setResponseMessage('');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to send response');
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
            to="/owner/inquiries"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Inquiries
          </Link>
          <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {error || 'Inquiry not found'}
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/owner/inquiries"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customer Inquiries
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={handleTogglePriority}
              className="rounded-xl text-xs gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {inquiry.priority === 'HIGH' ? 'Set Normal Priority' : 'Mark High Priority'}
            </Button>

            {inquiry.status !== 'IN_PROGRESS' && inquiry.status !== 'CLOSED' && (
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                className="rounded-xl text-xs gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                Start Working
              </Button>
            )}

            {inquiry.status !== 'CLOSED' ? (
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleUpdateStatus('CLOSED')}
                className="rounded-xl text-xs gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-stone-600" />
                Close Inquiry
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                className="rounded-xl text-xs gap-1.5"
              >
                Reopen
              </Button>
            )}

            {inquiry.status !== 'SPAM' && (
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleUpdateStatus('SPAM')}
                className="rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Mark Spam
              </Button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {actionError}
          </div>
        )}

        {/* Inquiry Detail Card */}
        <div className="p-8 rounded-3xl bg-white border border-brand-border shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-cream text-brand-coffee">
                {getCategoryLabel(inquiry.category)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800">
                Status: {inquiry.status.replace(/_/g, ' ')}
              </span>
              {inquiry.priority === 'HIGH' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  High Priority
                </span>
              )}
              <span className="text-xs text-brand-muted">
                Source: {inquiry.source.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-xs text-brand-muted">
              Received {new Date(inquiry.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-coffee">
              Cafe: {inquiry.cafe.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-brand-charcoal">
              {inquiry.subject}
            </h1>
            <div className="flex items-center gap-2 text-sm text-brand-muted pt-1">
              <UserIcon className="w-4 h-4 text-brand-coffee" />
              <span>
                From: <strong className="text-brand-charcoal">{inquiry.sender.name}</strong>{' '}
                ({inquiry.sender.type === 'GUEST' ? 'Guest Visitor' : 'Registered Member'})
              </span>
              {inquiry.sender.id && (
                <Link
                  to={`/users/${inquiry.sender.id}`}
                  className="text-xs font-bold text-brand-coffee hover:underline ml-2"
                >
                  View Public Profile
                </Link>
              )}
            </div>
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

          <div className="p-6 rounded-2xl bg-brand-background border border-brand-border/60">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
              Visitor Message
            </p>
            <p className="text-sm text-brand-charcoal whitespace-pre-wrap leading-relaxed">
              {inquiry.message}
            </p>
          </div>
        </div>

        {/* Thread History */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-brand-charcoal">
            Conversation History ({inquiry.responses?.length || 0}/{inquiry.maxReplies || 20})
          </h2>

          {inquiry.responses && inquiry.responses.length > 0 ? (
            <div className="space-y-4">
              {inquiry.responses.map((resp) => {
                const isOwner = resp.senderRole === 'OWNER' || resp.senderRole === 'ADMIN';
                return (
                  <div
                    key={resp.id}
                    className={`p-5 rounded-2xl border ${
                      isOwner
                        ? 'bg-brand-cream/40 border-brand-coffee/30 ml-0 md:ml-12'
                        : 'bg-white border-brand-border mr-0 md:mr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-brand-charcoal">
                        {resp.responder?.name || (isOwner ? 'Cafe Response' : inquiry.sender.name)}
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
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-brand-border text-sm text-brand-muted text-center">
              No responses sent yet. Use the form below to reply to this customer.
            </div>
          )}
        </div>

        {/* Respond Form */}
        {inquiry.status !== 'SPAM' && (
          <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-charcoal">
              Send Official Response
            </h3>
            <p className="text-xs text-brand-muted">
              Your response will be sent through CafeFinder without exposing your personal email address.
            </p>
            <form onSubmit={handleSendResponse} className="space-y-4">
              <textarea
                rows={4}
                maxLength={5000}
                required
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Write a helpful response to the customer's question..."
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-muted">{responseMessage.length}/5000</span>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || responseMessage.trim().length < 2}
                  className="rounded-xl gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
