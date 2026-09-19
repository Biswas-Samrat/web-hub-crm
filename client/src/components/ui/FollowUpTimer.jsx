import { useEffect, useState } from 'react';
import { getFollowUpStatus, urgencyClasses } from '../../utils/helpers';
import { Clock, AlertTriangle } from 'lucide-react';

export default function FollowUpTimer({ followUpAt, compact = false }) {
  const [status, setStatus] = useState(() => getFollowUpStatus(followUpAt));

  // Update every minute
  useEffect(() => {
    if (!followUpAt) return;
    const interval = setInterval(() => {
      setStatus(getFollowUpStatus(followUpAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [followUpAt]);

  if (!followUpAt || !status) return null;

  const isOverdue = status.urgency === 'overdue';
  const isToday = status.urgency === 'today';

  if (compact) {
    return (
      <span className={`text-xs font-medium ${urgencyClasses[status.urgency]}`}>
        {status.shortLabel}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${urgencyClasses[status.urgency]}`}>
      {isOverdue ? (
        <AlertTriangle size={12} className="flex-shrink-0" />
      ) : (
        <Clock size={12} className="flex-shrink-0" />
      )}
      {status.label}
    </div>
  );
}
