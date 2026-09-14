import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'stone';
  change?: {
    value: number;
    isUp: boolean;
  };
  isLoading?: boolean;
}

const COLOR_VARIANTS = {
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  stone: 'bg-stone-100 text-stone-700 border-stone-200',
};

const ICON_VARIANTS = {
  amber: 'bg-amber-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  purple: 'bg-purple-600',
  stone: 'bg-stone-600',
};

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  change,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-stone-200 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100" />
          <div className="w-16 h-4 bg-stone-100 rounded" />
        </div>
        <div className="w-24 h-8 bg-stone-100 rounded mb-2" />
        <div className="w-32 h-4 bg-stone-100 rounded" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
          ICON_VARIANTS[color]
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {change && (
          <div className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
            change.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {change.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change.value}%
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-stone-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">{label}</p>
      </div>

      {/* Decorative background shape */}
      <div className={clsx(
        "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform",
        ICON_VARIANTS[color]
      )} />
    </motion.div>
  );
};
