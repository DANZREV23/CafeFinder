import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw,
  Search,
  User,
  Quote
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
}

export const AdminTestimonialsPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/testimonials');
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Testimonial deleted');
        fetchTestimonials();
      }
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">{t("admin.testimonials")}</h1>
          <p className="text-stone-500">Manage customer testimonials displayed on the homepage.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <Plus size={18} />
            Add Testimonial
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTestimonials}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Card className="p-4 flex items-center gap-4">
        <Search className="text-stone-400" size={18} />
        <Input 
          placeholder="Search testimonials by name or content..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none focus:ring-0 shadow-none"
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 h-48 animate-pulse bg-stone-50" />
          ))
        ) : testimonials.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 rounded-2xl">
            <Quote className="mx-auto text-stone-200 mb-4" size={48} />
            <h3 className="text-lg font-medium text-stone-900">No testimonials found</h3>
            <p className="text-stone-500">Add your first testimonial to get started.</p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 flex flex-col justify-between group hover:border-amber-200 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                      {testimonial.avatarUrl ? (
                        <img src={testimonial.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-stone-400" size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 leading-tight">{testimonial.name}</h3>
                      <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">{testimonial.role || 'Customer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"} 
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
                  <button className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
