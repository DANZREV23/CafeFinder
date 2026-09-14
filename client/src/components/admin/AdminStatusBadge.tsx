import React from 'react';
import { clsx } from 'clsx';
import { 
  CafeStatus, 
  ReviewStatus, 
  CafeSubmissionStatus, 
  UserStatus,
  Role
} from '../../types';

interface AdminStatusBadgeProps {
  type: 'cafe' | 'review' | 'submission' | 'user' | 'role';
  status: CafeStatus | ReviewStatus | CafeSubmissionStatus | UserStatus | Role | string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Cafe Status
  PUBLISHED: { label: 'Published', className: 'bg-green-100 text-green-700 border-green-200' },
  PENDING_REVIEW: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  DRAFT: { label: 'Draft', className: 'bg-stone-100 text-stone-700 border-stone-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700 border-red-200' },
  ARCHIVED: { label: 'Archived', className: 'bg-stone-100 text-stone-700 border-stone-200' },

  // Review Status
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' },
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  HIDDEN: { label: 'Hidden', className: 'bg-stone-100 text-stone-700 border-stone-200' },

  // Submission Status
  CANCELLED: { label: 'Cancelled', className: 'bg-stone-100 text-stone-700 border-stone-200' },

  // User Status
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
  INACTIVE: { label: 'Inactive', className: 'bg-stone-100 text-stone-700 border-stone-200' },

  // Roles
  ADMIN: { label: 'Admin', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  OWNER: { label: 'Owner', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  USER: { label: 'User', className: 'bg-stone-100 text-stone-700 border-stone-200' },
};

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const config = STATUS_CONFIG[status as string] || { 
    label: status as string, 
    className: 'bg-stone-100 text-stone-700 border-stone-200' 
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={clsx(
      "inline-flex items-center font-bold uppercase tracking-wider border rounded-full",
      config.className,
      sizeClasses[size]
    )}>
      {config.label}
    </span>
  );
};
