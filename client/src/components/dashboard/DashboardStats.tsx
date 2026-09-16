import React from 'react';
import { Heart, MessageSquare, PlusCircle, Bell } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsProps {
  stats: {
    favoriteCount: number;
    reviewCount: number;
    submissionCount: number;
    unreadNotificationCount: number;
  };
}

export const DashboardStats: React.FC<StatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Favorites',
      value: stats.favoriteCount,
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-50',
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4"
        >
          <div className={`${card.bg} p-3 rounded-lg`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">{card.label}</p>
            <p className="text-2xl font-bold text-stone-900">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
