import React from 'react';
import { Heart, MessageSquare, PlusCircle, Bell, FolderHeart, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface StatsProps {
  stats: {
    favoriteCount: number;
    reviewCount: number;
    submissionCount: number;
    unreadNotificationCount: number;
    collectionCount: number;
    followCount: number;
    inquiryCount?: number;
    unreadInquiryResponseCount?: number;
  };
}

export const DashboardStats: React.FC<StatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Following',
      value: stats.followCount,
      icon: Bell,
      color: 'text-brand-coffee',
      bg: 'bg-brand-cream',
      link: '/dashboard/following'
    },
    {
      label: 'Inquiries',
      value: stats.inquiryCount ?? 0,
      badge: stats.unreadInquiryResponseCount ? `${stats.unreadInquiryResponseCount} new` : undefined,
      icon: HelpCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      link: '/dashboard/inquiries'
    },
    {
      label: 'Favorites',
      value: stats.favoriteCount,
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-50',
      link: '/favorites'
    },
    {
      label: 'Collections',
      value: stats.collectionCount,
      icon: FolderHeart,
      color: 'text-brand-coffee',
      bg: 'bg-brand-cream',
      link: '/dashboard/collections'
    },
    {
      label: 'Reviews',
      value: stats.reviewCount,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Submissions',
      value: stats.submissionCount,
      icon: PlusCircle,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      label: 'Notifications',
      value: stats.unreadNotificationCount,
      icon: Bell,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4 h-full hover:border-brand-coffee/30 transition-colors"
          >
            <div className={`${card.bg} p-3 rounded-lg shrink-0`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-stone-500 truncate">{card.label}</p>
                {(card as any).badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                    {(card as any).badge}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-stone-900">{card.value}</p>
            </div>
          </motion.div>
        );

        if (card.link) {
          return (
            <Link key={card.label} to={card.link}>
              {content}
            </Link>
          );
        }

        return <div key={card.label}>{content}</div>;
      })}
    </div>
  );
};
