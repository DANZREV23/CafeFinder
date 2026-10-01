import React from 'react';
import { CafeCard } from '../cafe/CafeCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CafeListSectionProps {
  title: string;
  subtitle?: string;
  cafes: any[];
  viewAllLink?: string;
  actionLink?: {
    href: string;
    label: string;
  };
}

export const CafeListSection: React.FC<CafeListSectionProps> = ({ title, subtitle, cafes, viewAllLink, actionLink }) => {
  if (cafes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actionLink && (
            <Link
              to={actionLink.href}
              className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-full transition-colors"
            >
              {actionLink.label}
            </Link>
          )}
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-sm font-medium text-brand-coffee hover:text-brand-coffee-dark flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </div>
  );
};
