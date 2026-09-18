import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';

export default function OwnerCafeEditPage() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate();
  const [form, setForm] = useState<any>({
    shortDescription: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    priceRange: 2
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      ownerService.getOwnedCafe(id)
        .then(r => {
          setName(r.data.name);
          setForm({
            shortDescription: r.data.shortDescription || '',
            description: r.data.description || '',
            address: r.data.address || '',
            city: r.data.city || '',
            state: r.data.state || '',
            country: r.data.country || '',
            postalCode: r.data.postalCode || '',
            phone: r.data.phone || '',
            email: r.data.email || '',
            website: r.data.website || '',
            instagram: r.data.instagram || '',
            facebook: r.data.facebook || '',
            priceRange: r.data.priceRange || 2
          });
        })
        .catch(e => setError(e.message));
    }
  }, [id]);

  const update = (key: string, value: unknown) => setForm((current: any) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        priceRange: Number(form.priceRange)
      };

      // Convert empty strings to null for optional fields to pass backend validation
      ['phone', 'email', 'website', 'instagram', 'facebook', 'state', 'postalCode'].forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      await ownerCafeService.updateBusiness(id, payload);
      navigate(`/owner/cafes/${id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link to={`/owner/cafes/${id}`} className="inline-flex items-center gap-2 text-sm text-brand-muted">
          <ArrowLeft className="h-4 w-4" /> Back to {name || 'cafe'}
        </Link>
        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Business information</p>
          <h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">Edit {name}</h1>
          <p className="mt-2 text-brand-muted">Update your cafe's basic information and location details.</p>
          {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
          
          <form onSubmit={save} className="mt-8 space-y-6 rounded-2xl border border-brand-border bg-white p-6">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-brand-charcoal border-b pb-2">General Information</h2>
              
              <label className="block text-sm font-semibold">
                Short description
                <input 
                  required 
                  minLength={10} 
                  maxLength={300} 
                  value={form.shortDescription} 
                  onChange={e => update('shortDescription', e.target.value)} 
                  className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                />
              </label>

              <label className="block text-sm font-semibold">
                Description
                <textarea 
                  required 
                  minLength={20} 
                  maxLength={5000} 
                  rows={7} 
                  value={form.description} 
                  onChange={e => update('description', e.target.value)} 
                  className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                />
              </label>

              <h2 className="text-lg font-bold text-brand-charcoal border-b pb-2 pt-4">Location</h2>
              
              <label className="block text-sm font-semibold">
                Address
                <input 
                  required 
                  value={form.address} 
                  onChange={e => update('address', e.target.value)} 
                  className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  City
                  <input 
                    required 
                    value={form.city} 
                    onChange={e => update('city', e.target.value)} 
                    className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                  />
                </label>
                <label className="block text-sm font-semibold">
                  State / Province
                  <input 
                    value={form.state} 
                    onChange={e => update('state', e.target.value)} 
                    className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Country
                  <input 
                    required 
                    value={form.country} 
                    onChange={e => update('country', e.target.value)} 
                    className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Postal Code
                  <input 
                    value={form.postalCode} 
                    onChange={e => update('postalCode', e.target.value)} 
                    className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                  />
                </label>
              </div>

              <h2 className="text-lg font-bold text-brand-charcoal border-b pb-2 pt-4">Contact & Social</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['phone', 'Phone'],
                  ['email', 'Email'],
                  ['website', 'Website'],
                  ['instagram', 'Instagram URL'],
                  ['facebook', 'Facebook URL']
                ].map(([key, label]) => (
                  <label key={key} className="block text-sm font-semibold">
                    {label}
                    <input 
                      type={key === 'email' ? 'email' : 'text'} 
                      value={form[key]} 
                      onChange={e => update(key, e.target.value)} 
                      className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none" 
                    />
                  </label>
                ))}
                
                <label className="block text-sm font-semibold">
                  Price range
                  <select 
                    value={form.priceRange} 
                    onChange={e => update('priceRange', e.target.value)} 
                    className="mt-2 w-full rounded-xl border border-brand-border p-3 focus:ring-2 focus:ring-brand-coffee/20 outline-none"
                  >
                    {[1, 2, 3, 4].map(value => (
                      <option key={value} value={value}>{'₱'.repeat(value)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={saving} 
                className="inline-flex items-center gap-2 rounded-xl bg-brand-coffee px-8 py-4 font-bold text-white shadow-lg shadow-brand-coffee/20 hover:bg-brand-coffee/90 transition-all disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
