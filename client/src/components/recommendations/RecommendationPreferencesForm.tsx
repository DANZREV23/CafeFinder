import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getRecommendationPreferences, resetRecommendationPreferences, updateRecommendationPreferences, UserRecommendationPreferences } from '@/services/recommendationService';

export const RecommendationPreferencesForm: React.FC = () => {
  const [preferences, setPreferences] = useState<Partial<UserRecommendationPreferences>>({ preferredAmenities: [], preferredCoffeeTypes: [], preferredVibes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRecommendationPreferences().then(response => {
      if (response.data) setPreferences(response.data);
    }).catch(() => toast.error('Unable to load recommendation preferences')).finally(() => setLoading(false));
  }, []);

  const updateList = (key: 'preferredAmenities' | 'preferredCoffeeTypes' | 'preferredVibes', value: string) => {
    setPreferences(current => ({ ...current, [key]: value.split(',').map(item => item.trim()).filter(Boolean).slice(0, 20) }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await updateRecommendationPreferences({
        preferredCity: preferences.preferredCity || null,
        preferredPriceRange: preferences.preferredPriceRange || null,
        preferredAmenities: preferences.preferredAmenities || [],
        preferredCoffeeTypes: preferences.preferredCoffeeTypes || [],
        preferredVibes: preferences.preferredVibes || [],
      });
      setPreferences(response.data);
      toast.success('Recommendation preferences saved');
    } catch (error: any) {
      toast.error(error.message || 'Unable to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset only your recommendation preferences? Favorites and reviews will not be changed.')) return;
    await resetRecommendationPreferences();
    setPreferences({ preferredAmenities: [], preferredCoffeeTypes: [], preferredVibes: [] });
    toast.success('Recommendation preferences reset');
  };

  if (loading) return <Card className="p-6" aria-live="polite">Loading preferences...</Card>;

  return (
    <Card className="p-6">
      <form onSubmit={save} className="space-y-5">
        <label className="block text-sm font-medium text-stone-700">Preferred city
          <input value={preferences.preferredCity || ''} onChange={event => setPreferences({ ...preferences, preferredCity: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" maxLength={120} />
        </label>
        <label className="block text-sm font-medium text-stone-700">Preferred price range (1–5)
          <input type="number" min="1" max="5" value={preferences.preferredPriceRange || ''} onChange={event => setPreferences({ ...preferences, preferredPriceRange: event.target.value ? Number(event.target.value) : null })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        {(['preferredAmenities', 'preferredCoffeeTypes', 'preferredVibes'] as const).map(key => (
          <label key={key} className="block text-sm font-medium capitalize text-stone-700">{key.replace('preferred', '').replace(/([A-Z])/g, ' $1').trim()}
            <input value={(preferences[key] || []).join(', ')} onChange={event => updateList(key, event.target.value)} placeholder="Separate values with commas" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</Button>
          <Button type="button" variant="outline" onClick={reset}>Reset preferences</Button>
        </div>
      </form>
    </Card>
  );
};
