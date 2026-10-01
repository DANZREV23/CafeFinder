import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  Search, 
  User, 
  Quote,
  Loader2,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/Dialog';
import { testimonialService } from '@/services/testimonialService';
import { Testimonial } from '@/types';
import { toast } from 'react-hot-toast';

export const AdminTestimonialsPage: React.FC = () => {
  const { t } = useI18n();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog & Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatarUrl: '',
    content: '',
    rating: 5,
    status: 'PUBLISHED'
  });

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await testimonialService.adminGetAll();
      if (response.success && response.data) {
        setTestimonials(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenAdd = () => {
    setEditingTestimonial(null);
    setFormData({
      name: '',
      role: '',
      avatarUrl: '',
      content: '',
      rating: 5,
      status: 'PUBLISHED'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || '',
      role: testimonial.role || '',
      avatarUrl: testimonial.avatarUrl || '',
      content: testimonial.content || '',
      rating: testimonial.rating || 5,
      status: testimonial.status || 'PUBLISHED'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Customer name is required';
    if (!formData.content.trim()) errors.content = 'Testimonial content is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      const payload: Partial<Testimonial> = {
        name: formData.name.trim(),
        role: formData.role.trim() || undefined,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        content: formData.content.trim(),
        rating: Number(formData.rating) || 5,
        status: formData.status
      };

      if (editingTestimonial) {
        await testimonialService.adminUpdate(editingTestimonial.id, payload);
        toast.success('Testimonial updated successfully');
      } else {
        await testimonialService.adminCreate(payload);
        toast.success('Testimonial created successfully');
      }

      setIsDialogOpen(false);
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await testimonialService.adminDelete(id);
      toast.success('Testimonial deleted');
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete testimonial');
    }
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.role && t.role.toLowerCase().includes(q)) ||
      t.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">{t("admin.testimonials") || "Testimonials"}</h1>
          <p className="text-stone-500">Manage customer testimonials displayed on the homepage.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleOpenAdd}
          >
            <Plus size={18} />
            Add Testimonial
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTestimonials} aria-label="Refresh testimonials">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Card className="p-4 flex items-center gap-4">
        <Search className="text-stone-400" size={18} />
        <Input 
          placeholder="Search testimonials by name, role, or content..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none focus:ring-0 shadow-none"
        />
        {search && (
          <button 
            type="button" 
            onClick={() => setSearch('')}
            className="text-xs text-stone-400 hover:text-stone-600 font-bold px-2 py-1"
          >
            Clear
          </button>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 h-48 animate-pulse bg-stone-50" />
          ))
        ) : filteredTestimonials.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 rounded-2xl">
            <Quote className="mx-auto text-stone-200 mb-4" size={48} />
            <h3 className="text-lg font-medium text-stone-900">
              {search ? 'No matching testimonials found' : 'No testimonials found'}
            </h3>
            <p className="text-stone-500 mt-1">
              {search ? 'Try clearing your search query.' : 'Add your first customer testimonial to get started.'}
            </p>
            {!search && (
              <Button 
                variant="primary" 
                size="sm" 
                className="mt-4 inline-flex items-center gap-2"
                onClick={handleOpenAdd}
              >
                <Plus size={16} />
                Add Testimonial
              </Button>
            )}
          </div>
        ) : (
          filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 flex flex-col justify-between group hover:border-amber-200 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200 shrink-0">
                      {testimonial.avatarUrl ? (
                        <img 
                          src={testimonial.avatarUrl} 
                          alt={testimonial.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="text-stone-400" size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 leading-tight">{testimonial.name}</h3>
                      <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">{testimonial.role || 'Customer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" title={`${testimonial.rating || 5} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={13} 
                        className={i < (testimonial.rating || 5) ? "fill-amber-400 text-amber-400" : "text-stone-200"} 
                      />
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Quote className="absolute -left-1 -top-1 text-stone-100 -z-0" size={24} />
                  <p className="text-sm text-stone-600 line-clamp-4 relative z-10 italic">
                    "{testimonial.content}"
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <Badge variant={testimonial.status === 'PUBLISHED' ? 'success' : 'outline'} className="text-[10px]">
                  {testimonial.status}
                </Badge>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleOpenEdit(testimonial)}
                    className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit testimonial"
                    aria-label={`Edit testimonial from ${testimonial.name}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    type="button"
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleDelete(testimonial.id)}
                    title="Delete testimonial"
                    aria-label={`Delete testimonial from ${testimonial.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Testimonial Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
            </DialogTitle>
            <DialogDescription>
              {editingTestimonial 
                ? 'Update customer feedback and details displayed across the platform.'
                : 'Add a new verified customer review or feedback highlight for the homepage.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className={formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Role / Description
                </label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Specialty Coffee Lover"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Avatar Image URL (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="text-stone-300" size={18} />
                  )}
                </div>
                <Input
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Rating ({formData.rating} / 5 Stars)
                </label>
                <div className="flex items-center gap-1.5 py-1.5 px-3 bg-stone-50 rounded-xl border border-stone-200 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-0.5 text-stone-300 hover:scale-110 transition-transform"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={18}
                        className={
                          star <= (hoverRating ?? formData.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Display Status
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      formData.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {formData.status === 'PUBLISHED' && <Check size={14} />}
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      formData.status === 'DRAFT'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {formData.status === 'DRAFT' && <Check size={14} />}
                    Draft
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Testimonial Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                placeholder="What did the customer say about their coffee discovery experience?"
                className={`w-full bg-white border rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none ${
                  formErrors.content ? 'border-red-500' : 'border-stone-200'
                }`}
              />
              {formErrors.content && (
                <p className="text-[11px] text-red-500 font-semibold mt-1">{formErrors.content}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

