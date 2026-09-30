import React from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { RecommendationPreferencesForm } from '@/components/recommendations/RecommendationPreferencesForm';

const RecommendationSettingsPage: React.FC = () => (
  <MainLayout>
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div>
          <Link to="/dashboard" className="text-sm text-coffee-600 hover:underline">Back to dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">Recommendation preferences</h1>
          <p className="mt-2 text-stone-500">Choose optional cafe interests used only to personalize your CafeFinder suggestions.</p>
        </div>
        <RecommendationPreferencesForm />
      </div>
    </PageContainer>
  </MainLayout>
);

export default RecommendationSettingsPage;
