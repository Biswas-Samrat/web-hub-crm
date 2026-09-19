import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle2,
  ExternalLink, Bell, Briefcase, Filter
} from 'lucide-react';
import { getClients } from '../api/clients';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, formatDateTime, getFollowUpStatus } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, followups, deliveries
  const navigate = useNavigate();

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClients({ limit: 100, sortBy: 'followUpAt', sortOrder: 'asc' });
      setClients(res.data.clients || []);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Extract follow-ups and delivery dates into unified calendar items
  const items = [];
  clients.forEach(c => {
    if (c.followUpAt && filterType !== 'deliveries') {
      items.push({
        id: `${c._id}-followup`,
        client: c,
        date: new Date(c.followUpAt),
        type: 'followup',
        title: `Follow up with ${c.businessName}`,
        note: c.followUpNote || c.notes,
        status: c.status,
      });
    }
    if (c.project?.deliveryDate && filterType !== 'followups') {
      items.push({
        id: `${c._id}-delivery`,
        client: c,
        date: new Date(c.project.deliveryDate),
        type: 'delivery',
        title: `Project Delivery: ${c.businessName}`,
        note: c.project.scope || 'Website delivery milestone',
        status: c.project.status,
      });
    }
  });

  // Sort chronological
  items.sort((a, b) => a.date - b.date);

  // Group items by timeframe
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdueItems = items.filter(i => i.date < startOfToday);
  const todayItems = items.filter(i => i.date >= startOfToday && i.date < startOfTomorrow);
  const thisWeekItems = items.filter(i => i.date >= startOfTomorrow && i.date < endOfWeek);
  const upcomingItems = items.filter(i => i.date >= endOfWeek);

  const renderSection = (title, list, badgeColor, iconColor) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
          <h2 className="text-sm font-bold text-surface-800 tracking-wide uppercase">
            {title} ({list.length})
          </h2>
        </div>
        <div className="space-y-2.5">
          {list.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/clients/${item.client._id}`)}
              className="card p-3.5 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  item.type === 'followup' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
                }`}>
                  {item.type === 'followup' ? <Bell size={16} /> : <Briefcase size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-surface-900 truncate">{item.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatDateTime(item.date)}
                  </p>
                  {item.note && (
                    <p className="text-xs text-surface-600 mt-1 line-clamp-1 italic bg-surface-50 px-2 py-0.5 rounded">
                      "{item.note}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={item.status} type={item.type === 'delivery' ? 'project' : 'client'} />
                <ArrowRight size={14} className="text-surface-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`filter-chip ${filterType === 'all' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
        >
          All Events ({items.length})
        </button>
        <button
          onClick={() => setFilterType('followups')}
          className={`filter-chip ${filterType === 'followups' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
        >
          Follow-ups Only
        </button>
        <button
          onClick={() => setFilterType('deliveries')}
          className={`filter-chip ${filterType === 'deliveries' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
        >
          Deliveries Only
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading schedule..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No scheduled items"
          description="Schedule follow-ups with leads or set project delivery dates to see them in your calendar."
        />
      ) : (
        <div className="space-y-6">
          {renderSection('Overdue Items', overdueItems, 'bg-red-500', 'text-red-500')}
          {renderSection('Today', todayItems, 'bg-orange-500', 'text-orange-500')}
          {renderSection('This Week', thisWeekItems, 'bg-blue-500', 'text-blue-500')}
          {renderSection('Upcoming', upcomingItems, 'bg-surface-400', 'text-surface-500')}
        </div>
      )}
    </div>
  );
}
