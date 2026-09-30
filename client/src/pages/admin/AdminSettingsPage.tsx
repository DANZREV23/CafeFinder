import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Globe2, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n';

export const AdminSettingsPage: React.FC = () => {
  const { t, locale, timezone } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">{t('admin.settings')}</h1>
        <p className="mt-2 text-stone-500">Manage operational tools and discovery settings for the admin portal.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="text-amber-600" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-stone-900">Recommendation diagnostics</h2>
              <p className="text-sm text-stone-500">Monitor aggregate recommendation performance.</p>
            </div>
          </div>
          <Link to="/admin/system/recommendations" className="inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            Open diagnostics
          </Link>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <Globe2 className="text-amber-600" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-stone-900">{t('admin.regionalSettings')}</h2>
              <p className="text-sm text-stone-500">Current locale: {locale}; timezone: {timezone}.</p>
            </div>
          </div>
          <p className="text-sm text-stone-600">Regional preferences are managed per user from the profile settings.</p>
        </Card>
      </div>

      <Card className="flex items-start gap-3 border-blue-100 bg-blue-50 p-5">
        <SettingsIcon className="mt-0.5 text-blue-600" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-blue-900">Safe settings scope</h2>
          <p className="text-sm text-blue-800">This page exposes aggregate operational tools only. Individual user recommendation preferences and behavior history are not visible to administrators.</p>
        </div>
      </Card>
    </div>
  );
};
