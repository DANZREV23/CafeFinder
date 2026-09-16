import React from 'react';
import { CafeCard } from '../cafe/CafeCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CafeListSectionProps {
  title: string;
  cafes: any[];
  viewAllLink?: string;
}

export const CafeListSection: React.FC<CafeListSectionProps> = ({ title, cafes, viewAllLink }) => {
  if (cafes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm font-medium text-coffee-600 hover:text-coffee-700 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </div>
  );
};
