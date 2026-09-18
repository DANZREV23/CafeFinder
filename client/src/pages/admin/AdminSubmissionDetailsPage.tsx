import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Coffee, 
  MapPin, 
  User, 
  Calendar, 
  Globe, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { CafeSubmission } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export const AdminSubmissionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<CafeSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await adminService.getSubmissionById(id);
        if (res.success) {
          setSubmission(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleApprove = async () => {
    if (!submission || !id) return;
    if (!window.confirm(`Approve "${submission.name}"? Approving this submission will make the cafe visible in the public CafeFinder directory.`)) return;

    try {
      setSubmitting(true);
      const res = await adminService.approveSubmission(id);
      if (res.success) {
        alert('Cafe approved and published successfully!');
        navigate('/admin/submissions');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) return;
    if (rejectionReason.length < 5) {
      alert('Please provide a detailed rejection reason (min 5 characters)');
      return;
    }

    try {
      setSubmitting(true);
      const res = await adminService.rejectSubmission(id, rejectionReason);
      if (res.success) {
        alert('Submission rejected.');
        setIsRejecting(false);
        navigate('/admin/submissions');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    if (!window.confirm('Reopen this submission? It will be moved back to PENDING status.')) return;

    try {
      setSubmitting(true);
      const res = await adminService.reopenSubmission(id);
      if (res.success) {
        alert('Submission reopened.');
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reopen submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4" />
        <div className="bg-white p-8 rounded-3xl border border-stone-200 space-y-8">
           <div className="flex gap-8">
              <div className="w-64 h-64 bg-stone-100 rounded-2xl" />
              <div className="flex-1 space-y-4">
                 <div className="h-10 bg-stone-100 rounded w-1/2" />
                 <div className="h-4 bg-stone-100 rounded w-3/4" />
                 <div className="h-4 bg-stone-100 rounded w-1/2" />
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-3xl border border-red-100 px-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Submission</h2>
        <p className="text-red-700 max-w-md mb-8">{error || 'The requested submission could not be found.'}</p>
        <button 
          onClick={() => navigate('/admin/submissions')}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Submissions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/submissions')}
            className="p-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{submission.name}</h1>
              <AdminStatusBadge type="submission" status={submission.status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-stone-500">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4" /> Submitted by {submission.submittedBy?.name}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4" /> {format(new Date(submission.createdAt), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4" /> {format(new Date(submission.createdAt), 'p')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {submission.status === 'PENDING' ? (
            <>
              <button 
                onClick={() => setIsRejecting(true)}
                disabled={submitting}
                className="px-6 py-2.5 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button 
                onClick={handleApprove}
                disabled={submitting}
                className="px-8 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Publish
              </button>
            </>
          ) : submission.status === 'REJECTED' || submission.status === 'CANCELLED' ? (
            <button 
              onClick={handleReopen}
              disabled={submitting}
              className="px-6 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center gap-2 border border-stone-200"
            >
              <Clock className="w-4 h-4" /> Reopen Submission
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photos Section */}
          <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">Submission Photos ({submission.photos.length})</h2>
            </div>
            <div className="p-6">
              {submission.photos.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-stone-100 rounded-2xl overflow-hidden group">
                    <img 
                      src={submission.photos[activePhotoIndex].url} 
                      alt="Submitted cafe" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {submission.photos.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : submission.photos.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all text-stone-900"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setActivePhotoIndex((prev) => (prev < submission.photos.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all text-stone-900"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {submission.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {submission.photos.map((photo, i) => (
                        <button
                          key={photo.id}
                          onClick={() => setActivePhotoIndex(i)}
                          className={clsx(
                            "w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                            activePhotoIndex === i ? "border-amber-600 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="text-stone-400 font-medium italic">No photos submitted</p>
                </div>
              )}
            </div>
          </section>

          {/* Detailed Info */}
          <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">Cafe Information</h2>
            </div>
            <div className="p-6 space-y-8">
              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pitch & Description</h3>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="font-bold text-stone-900 mb-2">{submission.shortDescription}</p>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{submission.description}</p>
                </div>
              </div>

              {/* Grid of basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                     <MapPin className="w-3 h-3" /> Address & Location
                   </h3>
                   <p className="text-sm text-stone-900 font-medium">{submission.address}</p>
                   <p className="text-sm text-stone-500">{submission.city}, {submission.state} {submission.postalCode}</p>
                   <p className="text-[10px] text-stone-400 mt-1">Coordinates: {submission.latitude}, {submission.longitude}</p>
                 </div>

                 <div className="space-y-1">
                   <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                     <Coffee className="w-3 h-3" /> Business Info
                   </h3>
                   <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-stone-400 mb-0.5">Price Range</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={clsx(
                                "text-xs font-bold",
                                i < (submission.priceRange || 0) ? "text-amber-600" : "text-stone-200"
                              )}
                            >
                              ₱
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-stone-100" />
                      <div>
                        <p className="text-[10px] text-stone-400 mb-0.5">Submission Type</p>
                        <p className="text-xs font-bold text-stone-900 uppercase tracking-wide">Community</p>
                      </div>
                   </div>
                 </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3 pt-2">
                 <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Selected Amenities</h3>
                 <div className="flex flex-wrap gap-2">
                    {submission.amenities.map((item: any) => {
                      const amenity = item.amenity || item;
                      return (
                        <div 
                          key={amenity.id} 
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                           {amenity.name}
                        </div>
                      );
                    })}
                    {submission.amenities.length === 0 && (
                      <p className="text-sm text-stone-400 italic">No amenities selected</p>
                    )}
                 </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-8">
           {/* Submitter Info */}
           <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-stone-100">
               <h2 className="text-lg font-bold text-stone-900">Submitter Info</h2>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 border border-amber-200">
                      <User className="w-6 h-6" />
                   </div>
                   <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate">{submission.submittedBy?.name}</p>
                      <p className="text-xs text-stone-500 truncate">{submission.submittedBy?.email}</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-stone-50 space-y-2">
                   <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Submission ID</span>
                      <span className="text-stone-600 font-mono font-bold select-all">{submission.id}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Total Photos</span>
                      <span className="text-stone-600 font-bold">{submission.photos.length}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="text-stone-400">User Role</span>
                      <span className="text-stone-600 font-bold uppercase tracking-tight">Verified User</span>
                   </div>
                </div>
             </div>
           </section>

           {/* Contact Links */}
           <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-stone-100 flex items-center justify-between">
               <h2 className="text-lg font-bold text-stone-900">Contact & Socials</h2>
             </div>
             <div className="p-6 space-y-3">
                {submission.phone && (
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <p className="text-sm font-medium text-stone-700">{submission.phone}</p>
                  </div>
                )}
                {submission.email && (
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <Mail className="w-4 h-4 text-stone-400" />
                    <p className="text-sm font-medium text-stone-700 truncate">{submission.email}</p>
                  </div>
                )}
                {submission.website && (
                  <a href={submission.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Globe className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
                      <p className="text-sm font-medium text-stone-700 truncate">Website</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-stone-300 group-hover:text-amber-600" />
                  </a>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {submission.instagram && (
                    <a href={submission.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all group">
                      <Instagram className="w-4 h-4 text-stone-400 group-hover:text-pink-600" />
                      <span className="text-xs font-bold text-stone-700 uppercase">IG</span>
                    </a>
                  )}
                  {submission.facebook && (
                    <a href={submission.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all group">
                      <Facebook className="w-4 h-4 text-stone-400 group-hover:text-blue-600" />
                      <span className="text-xs font-bold text-stone-700 uppercase">FB</span>
                    </a>
                  )}
                </div>
                {!submission.phone && !submission.email && !submission.website && !submission.instagram && !submission.facebook && (
                  <p className="text-sm text-stone-400 italic py-4 text-center">No contact links provided</p>
                )}
             </div>
           </section>

           {/* Rejection Display */}
           {submission.status === 'REJECTED' && (
             <section className="bg-red-50 rounded-3xl border border-red-100 overflow-hidden">
                <div className="p-4 bg-red-600 text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Rejection Reason</span>
                </div>
                <div className="p-6">
                   <p className="text-sm text-red-700 leading-relaxed italic">
                     "{submission.rejectionReason || 'No reason provided.'}"
                   </p>
                </div>
             </section>
           )}
        </div>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {isRejecting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsRejecting(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
             >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-stone-900">Reject Submission</h3>
                  <button onClick={() => setIsRejecting(false)} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                   <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700">
                        Please provide a clear reason for the submitter. This will be visible on their dashboard.
                      </p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Rejection Reason</label>
                      <textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Duplicate cafe listing, insufficient information, or unable to verify location."
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm min-h-[120px] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                        autoFocus
                      />
                      <div className="flex justify-between px-1">
                        <p className={clsx("text-[10px]", rejectionReason.length < 5 ? "text-red-500" : "text-stone-400")}>
                          Min 5 characters: {rejectionReason.length}/1000
                        </p>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-stone-50 flex items-center justify-end gap-3">
                   <button 
                     onClick={() => setIsRejecting(false)}
                     className="px-6 py-2 text-sm font-bold text-stone-500 hover:text-stone-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleReject}
                     disabled={submitting || rejectionReason.length < 5}
                     className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                   >
                     Reject Submission
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
