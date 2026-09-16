import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ActivityProps {
  reviews: any[];
  submissions: any[];
}

export const RecentActivity: React.FC<ActivityProps> = ({ reviews, submissions }) => {
  const activities = [
    ...reviews.map(r => ({
      id: r.id,
      type: 'review',
      date: new Date(r.createdAt),
      title: `Reviewed ${r.cafe.name}`,
      description: r.comment.length > 60 ? `${r.comment.substring(0, 60)}...` : r.comment,
      link: `/cafes/${r.cafe.slug}`,
      icon: MessageSquare,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50'
    })),
    ...submissions.map(s => ({
      id: s.id,
      type: 'submission',
      date: new Date(s.createdAt),
      title: `Submitted ${s.cafeName}`,
      description: `Status: ${s.status}`,
      link: `/my-submissions/${s.id}`,
      icon: PlusCircle,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-50',
      status: s.status as string
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-stone-200 text-center">
        <p className="text-stone-500">No recent activity yet.</p>
        <Link to="/explore" className="text-coffee-600 font-medium hover:underline mt-2 inline-block">
          Explore Cafes
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100 bg-stone-50/50">
        <h3 className="font-semibold text-stone-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-stone-100">
        {activities.map((activity) => (
          <Link
            key={`${activity.type}-${activity.id}`}
            to={activity.link}
            className="p-4 flex gap-4 hover:bg-stone-50 transition-colors group"
          >
            <div className={`${activity.iconBg} p-2 rounded-lg h-fit`}>
              <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-stone-900 truncate group-hover:text-coffee-700 transition-colors">
                  {activity.title}
                </p>
                <span className="text-xs text-stone-400 whitespace-nowrap">
                  {formatDistanceToNow(activity.date, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-stone-500 line-clamp-1 flex items-center gap-2">
                {activity.type === 'submission' && getStatusIcon((activity as any).status)}
                {activity.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
