import React from 'react';
import { useI18n } from '@/i18n';
import { RecommendationItem } from '@/services/recommendationService';

interface Props {
  reason: RecommendationItem['reason'];
}

export const RecommendationReason: React.FC<Props> = ({ reason }) => {
  const { t } = useI18n();
  const keyByType: Record<string, string> = {
    FAVORITE_SIMILARITY: 'recommendations.similarToFavorites',
    AMENITY_MATCH: 'recommendations.amenityMatch',
    CITY_MATCH: 'recommendations.cityMatch',
    PRICE_MATCH: 'recommendations.priceMatch',
    VIEW_SIMILARITY: 'recommendations.viewSimilarity',
    PREFERENCE_MATCH: 'recommendations.preferenceMatch',
    TRENDING: 'recommendations.trending',
    FEATURED: 'recommendations.featured',
    CURATED_LIST: 'recommendations.curatedList',
    HIGH_RATING: 'recommendations.highlyRated',
  };
  const key = keyByType[reason.type] || 'recommendations.highlyRated';
  return <p className="text-xs text-brand-muted" aria-label={t(key, reason.data)}>{t(key, reason.data)}</p>;
};
