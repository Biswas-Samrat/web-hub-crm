import { useEffect, useState } from 'react';
import { calculateTimeRemaining } from './LiveCountdownTimer';
import { Clock, AlertTriangle } from 'lucide-react';

export default function FollowUpTimer({ followUpAt, compact = false, live = true }) {
  const [time, setTime] = useState(() => calculateTimeRemaining(followUpAt));

  useEffect(() => {
    if (!followUpAt) return;
    setTime(calculateTimeRemaining(followUpAt));
    if (live) {
      const interval = setInterval(() => {
        setTime(calculateTimeRemaining(followUpAt));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [followUpAt, live]);

  if (!followUpAt || !time) return null;

  const { isOverdue, urgency, formatted } = time;

  const urgencyClasses = {
    overdue: 'text-red-600 font-semibold',
    critical: 'text-orange-600 font-semibold',
    today: 'text-amber-600 font-semibold',
    soon: 'text-blue-600 font-medium',
    upcoming: 'text-surface-600 font-medium',
  };

  const urgencyClass = urgencyClasses[urgency] || urgencyClasses.upcoming;

  if (compact) {
    return (
      <span className={`text-xs font-mono font-semibold ${urgencyClass}`}>
        {isOverdue ? `-${formatted}` : formatted}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${urgencyClass}`}>
      {isOverdue ? (
        <AlertTriangle size={13} className="flex-shrink-0 text-red-500" />
      ) : (
        <Clock size={13} className="flex-shrink-0 text-brand-500" />
      )}
      <span>{isOverdue ? 'Overdue:' : 'Due in:'}</span>
      <span className="font-mono font-bold">{formatted}</span>
    </div>
  );
}

