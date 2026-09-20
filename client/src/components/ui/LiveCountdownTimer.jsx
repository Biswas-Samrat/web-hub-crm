import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Flame, Calendar } from 'lucide-react';

export function calculateTimeRemaining(targetDate) {
  if (!targetDate) return null;

  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Urgency
  let urgency = 'upcoming';
  if (isOverdue) {
    urgency = 'overdue';
  } else if (days === 0) {
    if (hours < 2) {
      urgency = 'critical';
    } else {
      urgency = 'today';
    }
  } else if (days <= 2) {
    urgency = 'soon';
  }

  const pad = (num) => String(num).padStart(2, '0');

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else if (hours > 0) {
    formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    formatted = `${pad(minutes)}m ${pad(seconds)}s`;
  }

  return {
    isOverdue,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    urgency,
    formatted,
    pad,
  };
}

export default function LiveCountdownTimer({
  targetDate,
  variant = 'pill', // 'pill' | 'detailed' | 'compact'
  className = '',
  showLabel = true,
}) {
  const [time, setTime] = useState(() => calculateTimeRemaining(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    setTime(calculateTimeRemaining(targetDate));
    const interval = setInterval(() => {
      setTime(calculateTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate || !time) return null;

  const { isOverdue, days, hours, minutes, seconds, urgency, formatted, pad } = time;

  // Style themes
  const themes = {
    overdue: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
      box: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      label: 'Overdue by',
    },
    critical: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse',
      dot: 'bg-orange-500',
      box: 'bg-orange-100 text-orange-900 border-orange-300',
      icon: Flame,
      iconColor: 'text-orange-500',
      label: 'Due in (urgent)',
    },
    today: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      box: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Clock,
      iconColor: 'text-amber-500',
      label: 'Due today in',
    },
    soon: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      box: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Calendar,
      iconColor: 'text-blue-500',
      label: 'Due in',
    },
    upcoming: {
      bg: 'bg-surface-100 text-surface-700 border-surface-200',
      dot: 'bg-surface-400',
      box: 'bg-white text-surface-800 border-surface-200',
      icon: Clock,
      iconColor: 'text-surface-500',
      label: 'Due in',
    },
  };

  const theme = themes[urgency] || themes.upcoming;
  const Icon = theme.icon;

  if (variant === 'detailed') {
    return (
      <div className={`p-3 rounded-xl border ${theme.bg} ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${theme.dot} animate-ping`} />
            <Icon size={14} className={theme.iconColor} />
            <span>{isOverdue ? 'Overdue Follow-Up' : theme.label}</span>
          </div>
          <span className="text-[11px] font-medium opacity-75">
            {new Date(targetDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Digital Blocks */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className={`py-1.5 rounded-lg border font-mono font-bold ${theme.box}`}>
            <div className="text-base leading-none">{days}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">Days</div>
          </div>
          <div className={`py-1.5 rounded-lg border font-mono font-bold ${theme.box}`}>
            <div className="text-base leading-none">{pad(hours)}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">Hours</div>
          </div>
          <div className={`py-1.5 rounded-lg border font-mono font-bold ${theme.box}`}>
            <div className="text-base leading-none">{pad(minutes)}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">Mins</div>
          </div>
          <div className={`py-1.5 rounded-lg border font-mono font-bold ${theme.box}`}>
            <div className="text-base leading-none">{pad(seconds)}</div>
            <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">Secs</div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${theme.iconColor} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
        {isOverdue ? `-${formatted}` : formatted}
      </span>
    );
  }

  // Default 'pill' variant
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${theme.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${theme.dot} flex-shrink-0`} />
      <Icon size={12} className={`${theme.iconColor} flex-shrink-0`} />
      {showLabel && (
        <span className="font-semibold">
          {isOverdue ? 'Overdue:' : 'Due:'}
        </span>
      )}
      <span className="font-mono font-bold tracking-tight">{formatted}</span>
    </div>
  );
}
