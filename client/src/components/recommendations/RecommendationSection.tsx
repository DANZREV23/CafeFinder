import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CafeCard } from '@/components/cafe/CafeCard';
import { RecommendationItem } from '@/services/recommendationService';
import { RecommendationReason } from './RecommendationReason';
import { useI18n } from '@/i18n';

interface Props {
  title?: string;
  items: RecommendationItem[];
  viewAllLink?: string;
}

export const RecommendationSection: React.FC<Props> = ({ title, items, viewAllLink }) => {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <section aria-labelledby="recommendation-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="recommendation-heading" className="mb-4 text-4xl font-display font-bold text-brand-black">{title || t('recommendations.forYou')}</h2>
        {viewAllLink && <Link to={viewAllLink} className="flex items-center gap-1 text-sm font-medium text-coffee-600" aria-label={`${t('common.more')}: ${title || t('recommendations.forYou')}`}>
          {t('common.more')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {items.map(item => <div key={item.cafe.id} className="space-y-2"><CafeCard cafe={item.cafe} /><RecommendationReason reason={item.reason} /></div>)}
      </div>
    </section>
  );
};
