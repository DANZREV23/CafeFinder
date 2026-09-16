import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coffee, ArrowRight } from 'lucide-react';
import { CuratedList } from '../../types';

interface ListCardProps {
  list: CuratedList;
  index?: number;
}

export const ListCard: React.FC<ListCardProps> = ({ list, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative h-[320px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="absolute inset-0">
        <img
          src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'}
          alt={list.coverImageAlt || list.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="flex items-center gap-2 text-white/80 text-xs font-semibold mb-2 uppercase tracking-widest">
          <Coffee className="w-3 h-3" />
          {list._count?.cafes || 0} Cafes
        </div>

        <Link to={`/lists/${list.slug}`}>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
            {list.title}
          </h3>
        </Link>

        {list.description && (
          <p className="text-white/70 text-sm line-clamp-2 mb-4 leading-relaxed max-w-[90%]">
            {list.description}
          </p>
        )}

        <Link
          to={`/lists/${list.slug}`}
          className="inline-flex items-center gap-2 text-white text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-all w-fit"
        >
          Explore Collection
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {list.featured && (
        <div className="absolute top-4 right-4 bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter shadow-lg">
          Featured
        </div>
      )}
    </motion.div>
  );
};
