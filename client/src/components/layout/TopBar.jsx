import { useLocation } from 'react-router-dom';
import { Plus, Clock, Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import AddClientModal from '../clients/AddClientModal';
import UpcomingFollowUpsModal from '../followups/UpcomingFollowUpsModal';
import { getFollowUpQueue } from '../../api/followups';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/clients': 'All Clients',
  '/follow-ups': 'Follow-Ups',
  '/ongoing': 'Ongoing Projects',
  '/delivered': 'Delivered',
  '/completed': 'Completed',
  '/calendar': 'Calendar',
};

export default function TopBar() {
  const location = useLocation();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showFollowUpQueue, setShowFollowUpQueue] = useState(false);
  const [queueCounts, setQueueCounts] = useState({ total: 0, overdue: 0, today: 0 });

  const fetchQueueCounts = useCallback(async () => {
    try {
      const res = await getFollowUpQueue();
      if (res.data?.counts) {
        setQueueCounts(res.data.counts);
      }
    } catch {
      // ignore in navbar background polling
    }
  }, []);

  useEffect(() => {
    fetchQueueCounts();
    // Periodic refresh every 60s
    const interval = setInterval(fetchQueueCounts, 60000);
    return () => clearInterval(interval);
  }, [fetchQueueCounts]);

  const isDetailPage = location.pathname.startsWith('/clients/') && location.pathname !== '/clients';
  const title = isDetailPage ? 'Client Detail' : (PAGE_TITLES[location.pathname] || 'Web Hub CRM');

  const hasUrgent = queueCounts.overdue > 0 || queueCounts.today > 0;

  return (
    <>
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-surface-200 lg:px-6 flex-shrink-0 z-20 sticky top-0">
        <h1 className="page-title truncate mr-2">{title}</h1>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* New Upcoming Follow-Ups / SMS Queue Button */}
          <button
            onClick={() => setShowFollowUpQueue(true)}
            id="upcoming-followups-btn"
            className={`relative flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-95 ${
              hasUrgent
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
                : 'bg-surface-100 hover:bg-surface-200 text-surface-800'
            }`}
            title="View upcoming follow-ups and SMS countdown queue"
          >
            <Clock size={16} className={hasUrgent ? 'animate-pulse' : ''} />
            <span className="hidden md:inline">Follow-Ups</span>
            <span className="md:hidden">Queue</span>

            {/* Live Count Badge */}
            {queueCounts.total > 0 && (
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-full leading-none min-w-[18px] ${
                  queueCounts.overdue > 0
                    ? 'bg-red-600 text-white'
                    : hasUrgent
                    ? 'bg-white text-orange-700'
                    : 'bg-brand-600 text-white'
                }`}
              >
                {queueCounts.total}
              </span>
            )}
          </button>

          {/* Add Client Button */}
          <button
            onClick={() => setShowAddClient(true)}
            className="btn-md btn-primary rounded-xl gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm"
            id="add-client-btn"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => {
            setShowAddClient(false);
            fetchQueueCounts();
          }}
        />
      )}

      {/* Upcoming Follow-Ups & SMS Countdown Queue Modal */}
      <UpcomingFollowUpsModal
        isOpen={showFollowUpQueue}
        onClose={() => setShowFollowUpQueue(false)}
        onQueueUpdated={fetchQueueCounts}
      />
    </>
  );
}

