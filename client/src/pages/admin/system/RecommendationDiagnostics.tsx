import React, { useEffect, useState } from 'react';
import { Activity, Database, Gauge, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/services/api';
import { ApiResponse } from '@/types';
import { Card } from '@/components/ui/Card';

interface Diagnostics {
  totalRequests: number;
  personalizedRequests: number;
  anonymousRequests: number;
  fallbackRequests: number;
  cacheHits: number;
  averageDurationMs: number;
  status: string;
  lastUpdated: string;
}

export const RecommendationDiagnostics: React.FC = () => {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchApi<ApiResponse<any>>('/admin/system/diagnostics');
      setData(response.data.recommendations);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to load diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-stone-900">Recommendation diagnostics</h1><p className="text-stone-500">Aggregate operational metrics only; no user preference profiles are shown.</p></div>
        <button onClick={load} disabled={loading} className="rounded-lg border border-stone-200 p-2" aria-label="Refresh recommendation diagnostics"><RefreshCw className={loading ? 'animate-spin' : ''} size={18} /></button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {data && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Requests', data.totalRequests, Activity],
          ['Average duration', `${data.averageDurationMs} ms`, Gauge],
          ['Fallbacks', data.fallbackRequests, Database],
          ['Cache hits', data.cacheHits, Activity],
        ].map(([label, value, Icon]) => <Card key={String(label)} className="p-5"><Icon size={20} className="mb-3 text-coffee-600" /><p className="text-sm text-stone-500">{label}</p><p className="text-2xl font-bold text-stone-900">{String(value)}</p></Card>)}
      </div>}
      {data && <p className="text-sm text-stone-500">Status: <span className="font-semibold text-green-700">{data.status}</span> · Personalized requests: {data.personalizedRequests} · Anonymous requests: {data.anonymousRequests}</p>}
    </div>
  );
};
