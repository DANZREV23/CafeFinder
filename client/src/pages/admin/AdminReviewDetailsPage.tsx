import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Coffee, 
  User, 
  Calendar, 
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { CafeReview } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const AdminReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<CafeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await adminService.getReviewById(id);
        if (res.success) {
          setReview(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load review');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [id]);

  const handleStatusChange = async (action: 'approve' | 'reject' | 'hide' | 'restore') => {
    if (!id) return;
    
    let confirmMsg = '';
    if (action === 'reject') confirmMsg = 'Reject this review?';
    if (action === 'hide') confirmMsg = 'Hide this review from public view?';
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      let res;
      if (action === 'approve' || action === 'restore') res = await adminService.approveReview(id);
      else if (action === 'reject') res = await adminService.rejectReview(id);
      else res = await adminService.hideReview(id);

      if (res.success) {
        setReview(prev => prev ? { ...prev, status: res.data.status } : null);
        alert(`Review ${action === 'approve' ? 'approved' : action} successfully.`);
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!id || !window.confirm('Delete this photo? This action cannot be undone.')) return;

    try {
      setSubmitting(true);
      const res = await adminService.deleteReviewPhoto(id, photoId);
      if (res.success) {
        setReview(prev => prev ? {
          ...prev,
          photos: prev.photos?.filter(p => p.id !== photoId)
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading review details...</div>;
  if (error || !review) return <div className="p-8 text-center text-red-500">{error || 'Review not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/reviews')}
            className="p-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Review Details</h1>
            <p className="text-sm text-stone-500">ID: {review.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {review.status === 'PENDING' && (
            <>
              <button 
                onClick={() => handleStatusChange('reject')}
                disabled={submitting}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleStatusChange('approve')}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50"
              >
                Approve Review
              </button>
            </>
          )}
          {review.status === 'APPROVED' && (
            <button 
              onClick={() => handleStatusChange('hide')}
              disabled={submitting}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center gap-2"
            >
              <EyeOff className="w-4 h-4" /> Hide Review
            </button>
          )}
          {(review.status === 'REJECTED' || review.status === 'HIDDEN') && (
            <button 
              onClick={() => handleStatusChange('restore')}
              disabled={submitting}
              className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
            >
              Restore & Approve
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Review Content */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-amber-600" />
                <Link to={`/cafes/${review.cafe?.slug}`} className="font-bold text-stone-900 hover:text-amber-600 transition-colors">
                  {review.cafe?.name}
                </Link>
              </div>
              <AdminStatusBadge type="review" status={review.status} size="sm" />
            </div>
            
            <div className="p-8">
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Overall</p>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-1 justify-center">
                    {review.overallRating} <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                </div>
                <div className="w-px h-10 bg-stone-100" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Coffee</p>
                  <p className="text-sm font-bold text-stone-900">{review.coffeeRating || 'N/A'}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Ambiance</p>
                  <p className="text-sm font-bold text-stone-900">{review.ambianceRating || 'N/A'}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Service</p>
                  <p className="text-sm font-bold text-stone-900">{review.serviceRating || 'N/A'}/5</p>
                </div>
              </div>

              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 mb-8">
                <p className="text-stone-700 leading-relaxed italic">
                  "{review.comment || <span className="opacity-40">No comment provided.</span>}"
                </p>
              </div>

              {/* Photos */}
              {review.photos && review.photos.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Attached Photos ({review.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {review.photos.map((photo) => (
                      <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                             onClick={() => handleDeletePhoto(photo.id)}
                             className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                             title="Delete photo"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reviewer Info */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm p-6">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Reviewer</h3>
            <div className="flex items-center gap-4 mb-6">
              {review.user?.avatarUrl ? (
                <img src={review.user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-stone-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-stone-900 truncate">{review.user?.name}</p>
                <p className="text-xs text-stone-500 truncate">{review.user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-stone-50">
               <div className="flex justify-between text-xs">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Submitted
                  </span>
                  <span className="text-stone-700 font-bold">{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </span>
                  <span className="text-stone-700 font-bold">{format(new Date(review.createdAt), 'p')}</span>
               </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
             <div className="flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                   <h4 className="text-sm font-bold text-amber-900 mb-1">Moderation Notice</h4>
                   <p className="text-xs text-amber-700 leading-relaxed">
                     Approving this review will update the cafe's overall rating and review count.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
