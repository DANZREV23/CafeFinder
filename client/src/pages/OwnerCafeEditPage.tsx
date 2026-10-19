import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';

export default function OwnerCafeEditPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    priceRange: 1,
  });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      ownerService
        .getOwnedCafe(id)
        .then((result) => {
          const cafe = result.data;
          setName(cafe.name || 'Cafe');
          setForm({
            name: cafe.name || '',
            shortDescription: cafe.shortDescription || '',
            description: cafe.description || '',
            phone: cafe.phone || '',
            email: cafe.email || '',
            website: cafe.website || '',
            instagram: cafe.instagram || '',
            facebook: cafe.facebook || '',
            priceRange: cafe.priceRange || 1,
          });
        })
        .catch((error: any) => {
          setStatusMessage({ text: error.message || 'Failed to load cafe details', isError: true });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      await ownerCafeService.updateBusiness(id, {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        priceRange: Number(form.priceRange) || 1,
      });
      setName(form.name.trim());
      setStatusMessage({ text: 'Cafe information updated successfully!' });
    } catch (error: any) {
      setStatusMessage({ text: error.message || 'Failed to update cafe information', isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link
          to={`/owner/cafes/${id}`}
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {name || 'cafe'}
        </Link>

        <div className="mt-8 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-coffee">
            Edit Cafe Information
          </h1>
          <p className="mt-2 text-brand-muted">
            Update your business details, contact points, and public overview.
          </p>

          {statusMessage && (
            <div
              className={`mt-6 flex items-center gap-3 rounded-xl p-4 text-sm font-medium ${
                statusMessage.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {loading ? (
            <div className="mt-8 p-12 text-center text-brand-muted">Loading cafe details...</div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6 rounded-2xl border border-brand-border bg-white p-6 md:p-8 shadow-sm"
            >
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-brand-coffee">
                  Cafe Name *
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                  />
                </label>

                <label className="block text-sm font-semibold text-brand-coffee">
                  Short Description / Tagline
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Artisanal specialty espresso & vegan pastries in Midtown"
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                  />
                </label>

                <label className="block text-sm font-semibold text-brand-coffee">
                  Full Description
                  <textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe your atmosphere, roasting philosophy, origins, and seating..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold text-brand-coffee">
                    Price Range
                    <select
                      value={form.priceRange}
                      onChange={(e) => setForm({ ...form, priceRange: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    >
                      <option value={1}>$ (Inexpensive - under $5)</option>
                      <option value={2}>$$ (Moderate - $5 to $10)</option>
                      <option value={3}>$$$ (Specialty / High-end - $10 to $20)</option>
                      <option value={4}>$$$$ (Luxury / Reserve - $20+)</option>
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-brand-coffee">
                    Phone Number
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 012-3456"
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold text-brand-coffee">
                    Email Address
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="hello@cafename.com"
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-brand-coffee">
                    Website URL
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://cafename.com"
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold text-brand-coffee">
                    Instagram Handle / URL
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="@cafename"
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-brand-coffee">
                    Facebook Handle / URL
                    <input
                      type="text"
                      value={form.facebook}
                      onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                      placeholder="facebook.com/cafename"
                      className="mt-1.5 w-full rounded-xl border border-brand-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-coffee/30"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-coffee px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-coffee/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
