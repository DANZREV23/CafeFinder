import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { CuratedList } from '../../types';

interface ListCardProps {
  list: CuratedList;
  index?: number;
}

export const ListCard: React.FC<ListCardProps> = ({ list, index = 0 }) => {
  const photoUrl = list.coverImage || list.coverImageAsset?.url || '/placeholder-cafe.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex flex-col bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300"
    >
      <Link to={`/lists/${list.slug}`} className="relative h-52 w-full overflow-hidden bg-stone-100 block">
        <img
          src={photoUrl}
          alt={list.coverImageAlt || list.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {list._count?.cafes !== undefined && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-bold text-stone-800">
            <Coffee className="w-3.5 h-3.5 text-brand-coffee" />
            {list._count.cafes} {list._count.cafes === 1 ? 'cafe' : 'cafes'}
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-brand-coffee transition-colors line-clamp-1 mb-2">
            <Link to={`/lists/${list.slug}`}>{list.title}</Link>
          </h3>
          {list.description && (
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-4">
              {list.description}
            </p>
          )}
        </div>

        <Link
          to={`/lists/${list.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-coffee hover:text-brand-coffee-dark mt-auto group-hover:translate-x-1 transition-transform"
        >
          View Collection
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ListCard;
