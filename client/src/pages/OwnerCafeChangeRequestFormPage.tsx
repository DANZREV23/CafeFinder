import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';
import toast from 'react-hot-toast';

enum ChangeType {
  BUSINESS_INFO = 'BUSINESS_INFO',
  LOCATION = 'LOCATION'
}

export default function OwnerCafeChangeRequestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState<any>(null);
  const [type, setType] = useState<ChangeType>(ChangeType.BUSINESS_INFO);
  const [payload, setPayload] = useState<any>({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      ownerService.getOwnedCafe(id)
        .then(r => {
          setCafe(r.data);
          const initialPayload: any = {};
          if (type === ChangeType.BUSINESS_INFO) {
            ['shortDescription', 'description', 'phone', 'email', 'website', 'instagram', 'facebook', 'priceRange'].forEach(key => {
              initialPayload[key] = r.data[key] || '';
            });
            initialPayload.priceRange = r.data.priceRange || 2;
          } else {
            ['address', 'city', 'state', 'country', 'postalCode'].forEach(key => {
              initialPayload[key] = r.data[key] || '';
            });
          }
          setPayload(initialPayload);
        })
        .catch(e => toast.error(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, type]);

  const updatePayload = (key: string, value: any) => {
    setPayload((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (reason.length < 10) {
      toast.error('Please provide a more detailed reason for this change (min 10 chars).');
      return;
    }

    setSubmitting(true);
    try {
      const finalPayload = { ...payload };
      
      // Clean up payload
      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === '') finalPayload[key] = null;
      });
      
      if (finalPayload.priceRange) finalPayload.priceRange = Number(finalPayload.priceRange);

      await ownerCafeService.createChangeRequest(id, {
        type,
        payload: finalPayload,
        reason
      });
      
      toast.success('Change request submitted successfully! An admin will review it soon.');
      navigate(`/owner/cafes/${id}/change-requests`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer className="py-12">
          <div className="text-center text-brand-muted">Loading cafe details...</div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <div className="max-w-3xl mx-auto">
          <Link to={`/owner/cafes/${id}/change-requests`} className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to requests
          </Link>
          
          <h1 className="mt-6 text-4xl font-serif font-bold text-brand-charcoal">Request cafe change</h1>
          <p className="mt-2 text-brand-muted">Submit a request to update your cafe's information. Changes will be reviewed by our team.</p>

          <div className="mt-8 space-y-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900">Moderation policy</h3>
                <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                  Major changes to business identity or location require verification to maintain data integrity. 
                  Most requests are processed within 24-48 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm">
                <h2 className="text-xl font-bold text-brand-charcoal mb-6">1. Select change category</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType(ChangeType.BUSINESS_INFO)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      type === ChangeType.BUSINESS_INFO 
                        ? 'border-brand-coffee bg-brand-cream/10' 
                        : 'border-brand-border hover:border-brand-coffee/30'
                    }`}
                  >
                    <span className="block font-bold">Business Info</span>
                    <span className="text-xs text-brand-muted mt-1 block">Descriptions, contact, social, pricing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(ChangeType.LOCATION)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      type === ChangeType.LOCATION 
                        ? 'border-brand-coffee bg-brand-cream/10' 
                        : 'border-brand-border hover:border-brand-coffee/30'
                    }`}
                  >
                    <span className="block font-bold">Location</span>
                    <span className="text-xs text-brand-muted mt-1 block">Address, city, postal code</span>
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm">
                <h2 className="text-xl font-bold text-brand-charcoal mb-6">2. Updated information</h2>
                
                {type === ChangeType.BUSINESS_INFO ? (
                  <div className="space-y-5">
                    <label className="block">
                      <span className="text-sm font-bold text-brand-charcoal">Short description</span>
                      <input
                        required
                        value={payload.shortDescription || ''}
                        onChange={(e) => updatePayload('shortDescription', e.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-brand-charcoal">Full description</span>
                      <textarea
                        required
                        rows={5}
                        value={payload.description || ''}
                        onChange={(e) => updatePayload('description', e.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm font-bold">
                        Phone
                        <input
                          value={payload.phone || ''}
                          onChange={(e) => updatePayload('phone', e.target.value)}
                          className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none font-normal"
                        />
                      </label>
                      <label className="block text-sm font-bold">
                        Email
                        <input
                          type="email"
                          value={payload.email || ''}
                          onChange={(e) => updatePayload('email', e.target.value)}
                          className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none font-normal"
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-bold">
                      Price Range
                      <select
                        value={payload.priceRange || 2}
                        onChange={(e) => updatePayload('priceRange', e.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none font-normal"
                      >
                        <option value={1}>₱ - Budget</option>
                        <option value={2}>₱₱ - Standard</option>
                        <option value={3}>₱₱₱ - Premium</option>
                        <option value={4}>₱₱₱₱ - Luxury</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <label className="block">
                      <span className="text-sm font-bold text-brand-charcoal">New address</span>
                      <input
                        required
                        value={payload.address || ''}
                        onChange={(e) => updatePayload('address', e.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm font-bold">
                        City
                        <input
                          required
                          value={payload.city || ''}
                          onChange={(e) => updatePayload('city', e.target.value)}
                          className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none font-normal"
                        />
                      </label>
                      <label className="block text-sm font-bold">
                        Postal Code
                        <input
                          value={payload.postalCode || ''}
                          onChange={(e) => updatePayload('postalCode', e.target.value)}
                          className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none font-normal"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm">
                <h2 className="text-xl font-bold text-brand-charcoal mb-2">3. Reason for change</h2>
                <p className="text-sm text-brand-muted mb-6">Briefly explain why this information needs to be updated.</p>
                
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="e.g. Moved to a new location, changed contact numbers, or updated business focus..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-brand-border p-4 focus:ring-2 focus:ring-brand-coffee/20 outline-none"
                />
              </section>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-brand-coffee px-10 py-4 font-bold text-white shadow-lg shadow-brand-coffee/20 hover:bg-brand-coffee/90 transition-all disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-4 font-bold text-brand-muted hover:text-brand-charcoal transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
