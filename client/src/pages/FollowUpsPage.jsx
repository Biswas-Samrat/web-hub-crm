import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { getTodayFollowUps, getOverdueFollowUps, getUpcomingFollowUps } from '../api/followups';
import ClientCard from '../components/clients/ClientCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState('all'); // all, overdue, today, upcoming
  const [overdue, setOverdue] = useState([]);
  const [today, setToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overdueRes, todayRes, upcomingRes] = await Promise.all([
        getOverdueFollowUps(),
        getTodayFollowUps(),
        getUpcomingFollowUps(),
      ]);
      setOverdue(overdueRes.data.clients || []);
      setToday(todayRes.data.clients || []);
      setUpcoming(upcomingRes.data.clients || []);
    } catch {
      toast.error('Failed to load follow-up reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalCount = overdue.length + today.length + upcoming.length;

  return (
    <div className="space-y-5">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'overdue'
              ? 'bg-red-500 text-white border-red-500 shadow-sm'
              : 'bg-white border-surface-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${activeTab === 'overdue' ? 'text-red-100' : 'text-red-600'}`}>
              Overdue
            </span>
            <AlertTriangle size={14} className={activeTab === 'overdue' ? 'text-white' : 'text-red-500'} />
          </div>
          <p className="text-xl font-bold leading-tight">{overdue.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'today'
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white border-surface-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${activeTab === 'today' ? 'text-orange-100' : 'text-orange-600'}`}>
              Due Today
            </span>
            <Clock size={14} className={activeTab === 'today' ? 'text-white' : 'text-orange-500'} />
          </div>
          <p className="text-xl font-bold leading-tight">{today.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'upcoming'
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
              : 'bg-white border-surface-200 hover:border-brand-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${activeTab === 'upcoming' ? 'text-blue-100' : 'text-brand-600'}`}>
              Upcoming
            </span>
            <Calendar size={14} className={activeTab === 'upcoming' ? 'text-white' : 'text-brand-500'} />
          </div>
          <p className="text-xl font-bold leading-tight">{upcoming.length}</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-200 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`filter-chip ${activeTab === 'all' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            All Pending ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`filter-chip ${activeTab === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'filter-chip-inactive'}`}
          >
            Overdue ({overdue.length})
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`filter-chip ${activeTab === 'today' ? 'bg-orange-500 text-white border-orange-500' : 'filter-chip-inactive'}`}
          >
            Today ({today.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`filter-chip ${activeTab === 'upcoming' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-surface-500 hover:text-brand-600 rounded-lg transition-colors flex-shrink-0"
          title="Refresh follow-ups"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Follow-up Reminders Content */}
      {loading ? (
        <LoadingState message="Loading follow-up tasks..." />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="You don't have any scheduled follow-ups pending right now."
        />
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {(activeTab === 'all' || activeTab === 'overdue') && overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h2 className="text-sm font-bold text-red-700 tracking-wide uppercase">
                  Overdue Follow-ups ({overdue.length})
                </h2>
              </div>
              <div className="space-y-3">
                {overdue.map(client => (
                  <ClientCard key={client._id} client={client} onUpdate={loadData} />
                ))}
              </div>
            </div>
          )}

          {/* Today Section */}
          {(activeTab === 'all' || activeTab === 'today') && today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <h2 className="text-sm font-bold text-orange-700 tracking-wide uppercase">
                  Today's Reminders ({today.length})
                </h2>
              </div>
              <div className="space-y-3">
                {today.map(client => (
                  <ClientCard key={client._id} client={client} onUpdate={loadData} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {(activeTab === 'all' || activeTab === 'upcoming') && upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <h2 className="text-sm font-bold text-surface-800 tracking-wide uppercase">
                  Upcoming Follow-ups ({upcoming.length})
                </h2>
              </div>
              <div className="space-y-3">
                {upcoming.map(client => (
                  <ClientCard key={client._id} client={client} onUpdate={loadData} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
