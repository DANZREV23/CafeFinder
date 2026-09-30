import React from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, X, Upload, AlertCircle } from 'lucide-react';
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
      setError(t("review.photoLimit"));
      return;
    }

    const validFiles = files.filter(file => {
      const f = file as File;
      if (f.size > 10 * 1024 * 1024) {
        setError(t("review.fileTooLarge", { name: f.name }));
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
    if (!coffeeRating || !ambianceRating || !serviceRating || !overallRating) {
      setError(t("review.allRatingsRequired"));
      return;
    }
    if (comment.trim().length < 5) {
      setError(t("review.commentTooShort"));
      return;
    }

    try {
      await onSubmit({
        coffeeRating,
        ambianceRating,
        serviceRating,
        overallRating,
        comment,
      }, selectedFiles);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t("review.submitError"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-brand-background border border-brand-border rounded-3xl" aria-labelledby="review-form-title">
      <h3 id="review-form-title" className="sr-only">{initialData ? t("common.edit") : t("cafe.writeReview")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label id="coffee-rating-label" className="text-sm font-bold text-brand-charcoal">{t("review.coffeeQuality")}</label>
          <StarRating rating={coffeeRating} onChange={setCoffeeRating} label={t("review.coffeeQuality")} />
        </div>
        <div className="space-y-2">
          <label id="ambiance-rating-label" className="text-sm font-bold text-brand-charcoal">{t("review.ambiance")}</label>
          <StarRating rating={ambianceRating} onChange={setAmbianceRating} label={t("review.ambiance")} />
        </div>
        <div className="space-y-2">
          <label id="service-rating-label" className="text-sm font-bold text-brand-charcoal">{t("review.service")}</label>
          <StarRating rating={serviceRating} onChange={setServiceRating} label={t("review.service")} />
        </div>
        <div className="space-y-2">
          <label id="overall-rating-label" className="text-sm font-bold text-brand-charcoal">{t("review.overallExperience")}</label>
          <StarRating rating={overallRating} onChange={setOverallRating} size="lg" label={t("review.overallExperience")} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-bold text-brand-charcoal">{t("review.yourReview")}</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("review.placeholder")}
          className="w-full min-h-[120px] p-4 rounded-2xl border border-brand-border bg-white focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all text-sm"
          required
          aria-required="true"
          aria-invalid={!!error && error === t("review.commentTooShort")}
          aria-describedby={error ? "review-error" : undefined}
        />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold text-brand-charcoal">{t("review.photos")}</label>
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden group">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t("common.delete")}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selectedFiles.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center gap-1 text-brand-muted hover:border-brand-coffee hover:text-brand-coffee transition-all"
              aria-label={t("review.upload")}
            >
              <Upload className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-bold">{t("review.upload")}</span>
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
        <p className="text-[10px] text-brand-muted">JPG, PNG, or WebP. Max 10MB each.</p>
      </div>

      {error && (
        <div id="review-error" className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? t("common.save") : t("common.submit")}
        </Button>
      </div>
    </form>
  );
};
