import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Coffee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  MoreVertical,
  ChevronRight,
  Loader2,
  Search
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cafeSubmissionService, CafeSubmission, CafeSubmissionStatus } from '../services/cafeSubmissionService';
import { MainLayout } from '../components/layout/MainLayout';

export default function MySubmissionsPage() {
  const location = useLocation();
  const [submissions, setSubmissions] = useState<CafeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.message || null);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await cafeSubmissionService.getMySubmissions();
        setSubmissions(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const STATUS_CONFIG = {
    [CafeSubmissionStatus.PENDING]: {
      label: 'Pending Review',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      description: 'An admin is currently reviewing your submission.'
    },
    [CafeSubmissionStatus.APPROVED]: {
      label: 'Approved',
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      description: 'Great news! Your cafe has been published.'
    },
    [CafeSubmissionStatus.REJECTED]: {
      label: 'Rejected',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      description: 'Your submission did not meet our guidelines.'
    },
    [CafeSubmissionStatus.CANCELLED]: {
      label: 'Cancelled',
      icon: AlertCircle,
      color: 'text-neutral-500',
      bg: 'bg-neutral-50',
      border: 'border-neutral-100',
      description: 'You have cancelled this submission.'
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">My Submissions</h1>
              <p className="text-neutral-500 mt-1">Track the status of cafes you've submitted to CafeFinder Davao.</p>
            </div>
            <Link 
              to="/submit-cafe"
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-sm shadow-amber-200 w-fit"
            >
              <Plus className="w-5 h-5" />
              Submit New Cafe
            </Link>
          </div>

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {submissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-neutral-100">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">No submissions yet</h3>
              <p className="text-neutral-500 mt-2 mb-8 max-w-md mx-auto">
                Help us grow the community by sharing your favorite Davao cafes. Submissions are reviewed and published within 24-48 hours.
              </p>
              <Link 
                to="/submit-cafe"
                className="inline-flex items-center gap-2 text-amber-600 font-bold hover:text-amber-700"
              >
                Start your first submission
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {submissions.map((submission) => {
                const status = STATUS_CONFIG[submission.status];
                return (
                  <motion.div 
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-md transition-all group"
                  >
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                          {submission.photos?.[0] ? (
                            <img 
                              src={submission.photos[0].url} 
                              alt={submission.name} 
                              className="w-full h-full object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Coffee className="w-8 h-8 text-neutral-300" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h3 className="font-bold text-neutral-900 text-lg group-hover:text-amber-600 transition-colors">
                            {submission.name}
                          </h3>
                          <p className="text-neutral-500 text-sm flex items-center gap-1.5">
                            <Search className="w-3 h-3" />
                            {submission.city}, {submission.country}
                          </p>
                          <p className="text-neutral-400 text-xs mt-1">
                            Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} ${status.border} border`}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                        {submission.status === CafeSubmissionStatus.REJECTED && submission.rejectionReason && (
                          <p className="text-xs text-red-500 italic max-w-[200px] sm:text-right">
                            Reason: {submission.rejectionReason}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/my-submissions/${submission.id}`}
                            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-all"
                          >
                            View Details
                          </Link>
                          {submission.status === CafeSubmissionStatus.PENDING && (
                            <button className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-400">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-12 bg-neutral-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Are you a cafe owner?</h2>
              <p className="text-neutral-400 mb-6 max-w-lg">
                Claim your cafe to manage your profile, respond to reviews, and get exclusive analytics.
              </p>
              <Link 
                to="/claim-cafe"
                className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-100 transition-all"
              >
                Claim a Cafe
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <Coffee className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 rotate-12" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
