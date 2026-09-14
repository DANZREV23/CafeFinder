import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { cafeSubmissionService, CafeSubmission, CafeSubmissionStatus } from '../services/cafeSubmissionService';

export default function SubmissionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<CafeSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!id) return;
      try {
        const response = await cafeSubmissionService.getSubmission(id);
        setSubmission(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [id]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this submission?')) return;
    
    setCancelling(true);
    try {
      await cafeSubmissionService.cancelSubmission(id);
      navigate('/my-submissions', { state: { message: 'Submission cancelled successfully.' } });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel submission');
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 text-center border border-neutral-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900">{error || 'Submission not found'}</h2>
          <Link to="/my-submissions" className="text-amber-600 font-semibold mt-4 inline-block">
            Back to my submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/my-submissions" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-all mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to My Submissions
        </Link>

        <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
          {/* Status Banner */}
          <div className={`px-8 py-4 border-b flex items-center justify-between ${
            submission.status === CafeSubmissionStatus.PENDING ? 'bg-amber-50 border-amber-100 text-amber-800' :
            submission.status === CafeSubmissionStatus.APPROVED ? 'bg-green-50 border-green-100 text-green-800' :
            submission.status === CafeSubmissionStatus.REJECTED ? 'bg-red-50 border-red-100 text-red-800' :
            'bg-neutral-50 border-neutral-100 text-neutral-800'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="w-4 h-4" />
              Status: {submission.status.replace('_', ' ')}
            </div>
            {submission.status === CafeSubmissionStatus.PENDING && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Cancel Submission
              </button>
            )}
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{submission.name}</h1>
                  <p className="text-neutral-600 italic">"{submission.shortDescription}"</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Address</p>
                        <p className="text-sm text-neutral-600">{submission.address}</p>
                        <p className="text-sm text-neutral-600">{submission.city}, {submission.country}</p>
                      </div>
                    </div>

                    {submission.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-neutral-900">Phone</p>
                          <p className="text-sm text-neutral-600">{submission.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {submission.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-neutral-900">Website</p>
                          <a href={submission.website} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 hover:underline break-all">
                            {submission.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {(submission.instagram || submission.facebook) && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-2 mt-1">
                          {submission.instagram && <Instagram className="w-4 h-4 text-neutral-400" />}
                          {submission.facebook && <Facebook className="w-4 h-4 text-neutral-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">Social Media</p>
                          {submission.instagram && (
                            <a href={submission.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 hover:text-amber-600 block truncate max-w-[150px]">
                              Instagram
                            </a>
                          )}
                          {submission.facebook && (
                            <a href={submission.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 hover:text-amber-600 block truncate max-w-[150px]">
                              Facebook
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900 mb-3">About the Cafe</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                    {submission.description}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-72 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {submission.amenities.map(a => (
                      <span key={a.id} className="px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-lg text-xs font-medium text-neutral-600">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>

                {submission.photos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Photos</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {submission.photos.map(p => (
                        <div key={p.id} className="aspect-square rounded-lg overflow-hidden border border-neutral-100">
                          <img src={p.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Price Level</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(p => (
                      <span key={p} className={`text-lg ${p <= (submission.priceRange || 2) ? 'text-amber-500' : 'text-neutral-200'}`}>$</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2">
                    Estimate based on your submission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {submission.status === CafeSubmissionStatus.REJECTED && (
            <div className="bg-red-50 border-t border-red-100 p-8">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                Submission Rejected
              </h3>
              <p className="text-sm text-red-700">
                {submission.rejectionReason || 'No specific reason provided. Please contact support for more information.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
