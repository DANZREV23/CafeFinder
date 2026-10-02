import React from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import { Loader2, X, Upload, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Review } from '@/services/reviewService';
import { useI18n } from '@/i18n';

interface ReviewFormProps {
  initialData?: Review;
  onSubmit: (data: any, files: File[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [coffeeRating, setCoffeeRating] = React.useState(initialData?.coffeeRating || 0);
  const [ambianceRating, setAmbianceRating] = React.useState(initialData?.ambianceRating || 0);
  const [serviceRating, setServiceRating] = React.useState(initialData?.serviceRating || 0);
  const [overallRating, setOverallRating] = React.useState(initialData?.overallRating || 0);
  const [comment, setComment] = React.useState(initialData?.comment || '');
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      setError('You can upload up to 5 photos per review.');
      return;
    }

    const validFiles = files.filter(file => {
      const f = file as File;
      if (f.size > 10 * 1024 * 1024) {
        setError(`File ${f.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file as File));
    setPreviews(prev => [...prev, ...newPreviews]);
    setError(null);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overallRating) {
      setError('Please provide an overall experience rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters describing your experience.');
      return;
    }

    try {
      await onSubmit({
        coffeeRating: coffeeRating || overallRating,
        ambianceRating: ambianceRating || overallRating,
        serviceRating: serviceRating || overallRating,
        overallRating,
        comment: comment.trim(),
      }, selectedFiles);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || t("review.submitError"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-brand-background border border-brand-border rounded-3xl" aria-labelledby="review-form-title">
      <div className="flex items-center justify-between">
        <h3 id="review-form-title" className="text-xl font-serif font-bold text-brand-charcoal">
          {initialData ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <span className="text-xs text-brand-muted">
          Reviews are moderated for community safety
        </span>
      </div>

      {/* Community Quality Guidance Box (Part 31) */}
      <div className="p-4 bg-brand-cream/40 border border-brand-coffee/15 rounded-2xl text-xs text-brand-charcoal space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-brand-coffee">
          <Sparkles className="w-4 h-4 text-brand-accent-warm" />
          <span>Helpful Review Tips</span>
        </div>
        <p className="text-stone-600 leading-relaxed">
          Share details that help others decide: What brew or beans did you try? How were the seats, Wi-Fi, and noise levels? Was the staff friendly? Please keep criticism constructive, civil, and free of personal attacks.
        </p>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-brand-border">
        <div className="space-y-2">
          <label id="overall-rating-label" className="text-sm font-bold text-brand-charcoal">
            Overall Experience <span className="text-red-500">*</span>
          </label>
          <StarRating rating={overallRating} onChange={setOverallRating} size="lg" label="Overall Experience" />
        </div>
        <div className="space-y-2">
          <label id="coffee-rating-label" className="text-sm font-bold text-brand-charcoal">Coffee Quality</label>
          <StarRating rating={coffeeRating} onChange={setCoffeeRating} label="Coffee Quality" />
        </div>
        <div className="space-y-2">
          <label id="ambiance-rating-label" className="text-sm font-bold text-brand-charcoal">Ambiance & Seating</label>
          <StarRating rating={ambianceRating} onChange={setAmbianceRating} label="Ambiance & Seating" />
        </div>
        <div className="space-y-2">
          <label id="service-rating-label" className="text-sm font-bold text-brand-charcoal">Customer Service</label>
          <StarRating rating={serviceRating} onChange={setServiceRating} label="Customer Service" />
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="review-comment" className="text-sm font-bold text-brand-charcoal">
            Your Review <span className="text-red-500">*</span>
          </label>
          <span className={`text-[11px] ${comment.length < 10 ? 'text-amber-700' : 'text-stone-500'}`}>
            {comment.length}/2000 {comment.length < 10 ? '(min 10 characters)' : ''}
          </span>
        </div>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe your visit, coffee flavor notes, workspace atmosphere, or recommended treats..."
          maxLength={2000}
          className="w-full min-h-[130px] p-4 rounded-2xl border border-brand-border bg-white focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all text-sm leading-relaxed"
          required
          aria-required="true"
        />
      </div>

      {/* Photos */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-brand-charcoal">Photos from Your Visit (Optional)</label>
          <span className="text-xs text-brand-muted">{selectedFiles.length}/5 uploaded</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-brand-border">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selectedFiles.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center gap-1 text-brand-muted hover:border-brand-coffee hover:text-brand-coffee bg-white transition-all"
              aria-label="Upload photo"
            >
              <Upload className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-bold">Add Photo</span>
            </button>
          )}
        </div>
        <input
          type="file"
          id="review-photos"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
        <p className="text-[11px] text-brand-muted">JPEG, PNG, or WebP up to 10MB. Maximum 5 photos.</p>
      </div>

      {error && (
        <div id="review-error" className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[130px] rounded-xl bg-brand-coffee text-white hover:bg-brand-coffee-dark">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {initialData ? 'Save Changes' : 'Publish Review'}
        </Button>
      </div>
    </form>
  );
};
