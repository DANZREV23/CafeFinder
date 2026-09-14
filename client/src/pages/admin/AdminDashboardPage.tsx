import React, { useEffect, useState } from 'react';
import { 
  Coffee, 
  Star, 
  MapPin, 
  Users, 
  Clock, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { AdminDashboardStats, ActivityLog } from '../../types';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getActivityLogs({ limit: 5 })
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (logsRes.success) setRecentLogs(logsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-2xl border border-red-100 p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-red-900 mb-2">Dashboard Error</h2>
        <p className="text-red-700 text-center max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">Welcome Back, Admin</h1>
        <p className="text-stone-500">Here's what's happening with CafeFinder today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <AdminStatCard 
          label="Pending Submissions" 
          value={stats?.pendingCafeSubmissions || 0} 
          icon={Coffee} 
          color="amber"
          isLoading={loading}
        />
        <AdminStatCard 
          label="Pending Reviews" 
          value={stats?.pendingReviews || 0} 
          icon={Star} 
          color="blue"
          isLoading={loading}
        />
        <AdminStatCard 
          label="Published Cafes" 
          value={stats?.publishedCafes || 0} 
          icon={MapPin} 
          color="green"
          isLoading={loading}
        />
        <AdminStatCard 
          label="Rejected" 
          value={stats?.rejectedSubmissions || 0} 
          icon={XCircle} 
          color="red"
          isLoading={loading}
        />
        <AdminStatCard 
          label="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          color="purple"
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Actions & Pending Moderation */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Pending Moderation</h2>
              <div className="flex gap-2">
                <Link 
                  to="/admin/submissions?status=PENDING" 
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                >
                  Submissions <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-stone-200">|</span>
                <Link 
                  to="/admin/reviews?status=PENDING" 
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  Reviews <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-stone-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-100 rounded w-1/3" />
                      <div className="h-3 bg-stone-100 rounded w-1/4" />
                    </div>
                    <div className="w-20 h-8 bg-stone-100 rounded-full" />
                  </div>
                ))
              ) : stats?.pendingCafeSubmissions === 0 && stats?.pendingReviews === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-stone-900 font-bold">All caught up!</h3>
                  <p className="text-stone-500 text-sm">No pending submissions or reviews to moderate.</p>
                </div>
              ) : (
                <>
                  {stats?.pendingCafeSubmissions ? stats.pendingCafeSubmissions > 0 && (
                    <div className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                          <Coffee className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{stats.pendingCafeSubmissions} Submissions</p>
                          <p className="text-xs text-stone-500">Awaiting your approval</p>
                        </div>
                      </div>
                      <Link 
                        to="/admin/submissions?status=PENDING" 
                        className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ) : null}
                  
                  {stats?.pendingReviews ? stats.pendingReviews > 0 && (
                    <div className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{stats.pendingReviews} Reviews</p>
                          <p className="text-xs text-stone-500">Check for inappropriate content</p>
                        </div>
                      </div>
                      <Link 
                        to="/admin/reviews?status=PENDING" 
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Moderate
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Cafe Management
                </h3>
                <p className="text-sm text-stone-500 mb-6">Update status, feature cafes, or manage verification badges.</p>
                <Link to="/admin/cafes" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all group">
                  <span className="text-sm font-semibold text-stone-700">View All Cafes</span>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </Link>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  User Management
                </h3>
                <p className="text-sm text-stone-500 mb-6">Manage user roles, statuses, and review their activity history.</p>
                <Link to="/admin/users" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all group">
                  <span className="text-sm font-semibold text-stone-700">View All Users</span>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </Link>
             </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-stone-400" />
              Recent Activity
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-stone-100 rounded w-2/3" />
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                  </div>
                ))
              ) : recentLogs.length === 0 ? (
                <div className="p-12 text-center text-stone-500 text-sm italic">
                  No activity logs found.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 pt-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-900 font-medium leading-tight mb-1">
                          {log.description || log.action}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold uppercase tracking-tight">
                          <span className="text-stone-700">{log.user?.name || 'System'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(log.createdAt))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          
          <Link 
            to="/admin/activity" 
            className="p-4 text-center text-sm font-bold text-stone-600 hover:bg-stone-50 border-t border-stone-50 transition-colors"
          >
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  );
};
