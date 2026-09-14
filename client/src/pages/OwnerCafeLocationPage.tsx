import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService } from '../services/ownerService';
import { ownerCafeService } from '../services/ownerCafeService';

export default function OwnerCafeLocationPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [form, setForm] = useState({ address: '', city: '', state: '', country: '', postalCode: '', latitude: '', longitude: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (id) ownerService.getOwnedCafe(id).then(result => { const cafe = result.data; setName(cafe.name); setForm({ address: cafe.address || '', city: cafe.city || '', state: cafe.state || '', country: cafe.country || '', postalCode: cafe.postalCode || '', latitude: cafe.latitude?.toString() || '', longitude: cafe.longitude?.toString() || '' }); }).catch(error => setMessage(error.message)); }, [id]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!id) return; setSaving(true); try { await ownerCafeService.createChangeRequest(id, { type: 'LOCATION', payload: { ...form, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null }, reason: 'Request to update the cafe location.' }); setMessage('Your location changes have been submitted for review.'); } catch (error: any) { setMessage(error.message); } finally { setSaving(false); } };
  return <MainLayout><PageContainer className="py-12"><Link to={`/owner/cafes/${id}`} className="inline-flex items-center gap-2 text-sm text-brand-muted"><ArrowLeft className="h-4 w-4" /> Back to {name}</Link><div className="mt-8 max-w-3xl"><h1 className="text-4xl font-serif font-bold">Location</h1><p className="mt-2 text-brand-muted">Location changes are reviewed before they replace the public cafe information.</p>{message && <p className="mt-4 rounded-xl bg-brand-cream p-4 text-brand-coffee">{message}</p>}<form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border border-brand-border bg-white p-6 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-semibold">Address<input required minLength={2} maxLength={300} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label>{[['city','City'],['state','State'],['country','Country'],['postalCode','Postal code'],['latitude','Latitude'],['longitude','Longitude']].map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label>)}<button disabled={saving} className="sm:col-span-2 inline-flex w-fit items-center gap-2 rounded-xl bg-brand-coffee px-5 py-3 font-semibold text-white"><Send className="h-4 w-4" />{saving ? 'Submitting...' : 'Submit location change'}</button></form></div></PageContainer></MainLayout>;
}
