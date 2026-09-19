import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes, isToday, isTomorrow, isPast } from 'date-fns';

// ─── Follow-up countdown ───────────────────────────────────────────────────────
export const getFollowUpStatus = (followUpAt) => {
  if (!followUpAt) return null;

  const date = new Date(followUpAt);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = differenceInDays(date, now);
  const diffHours = differenceInHours(date, now);
  const diffMins = differenceInMinutes(date, now);

  if (isPast(date) && !isToday(date)) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      urgency: 'overdue',
      shortLabel: `${overdueDays}d overdue`,
    };
  }

  if (isToday(date)) {
    if (diffMs < 0) {
      return { label: 'Follow up today (past time)', urgency: 'overdue', shortLabel: 'Today!' };
    }
    if (diffHours < 1) {
      return { label: `Follow up in ${diffMins} minutes`, urgency: 'today', shortLabel: 'Now!' };
    }
    return { label: `Follow up today`, urgency: 'today', shortLabel: 'Today!' };
  }

  if (isTomorrow(date)) {
    return { label: 'Follow up tomorrow', urgency: 'soon', shortLabel: 'Tomorrow' };
  }

  if (diffDays <= 7) {
    return { label: `Follow up in ${diffDays} days`, urgency: 'upcoming', shortLabel: `${diffDays}d` };
  }

  if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return {
      label: `Follow up in ${weeks} week${weeks > 1 ? 's' : ''}`,
      urgency: 'later',
      shortLabel: `${weeks}w`,
    };
  }

  const months = Math.ceil(diffDays / 30);
  return {
    label: `Follow up in ${months} month${months > 1 ? 's' : ''}`,
    urgency: 'later',
    shortLabel: `${months}mo`,
  };
};

export const urgencyClasses = {
  overdue: 'text-red-600 font-semibold',
  today: 'text-orange-500 font-semibold',
  soon: 'text-amber-500 font-medium',
  upcoming: 'text-blue-600 font-medium',
  later: 'text-surface-500',
};

export const urgencyBgClasses = {
  overdue: 'bg-red-50 border-red-200 text-red-700',
  today: 'bg-orange-50 border-orange-200 text-orange-700',
  soon: 'bg-amber-50 border-amber-200 text-amber-700',
  upcoming: 'bg-blue-50 border-blue-200 text-blue-700',
  later: 'bg-surface-50 border-surface-200 text-surface-600',
};

// ─── Date formatting ───────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'd MMM yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'd MMM yyyy, h:mm a');
};

export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// ─── Currency formatting ───────────────────────────────────────────────────────
export const formatPrice = (price, currency = 'GBP') => {
  if (!price && price !== 0) return '—';
  const symbols = { GBP: '£', USD: '$', EUR: '€', CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', ZAR: 'R' };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${Number(price).toLocaleString()}`;
};

// ─── Follow-up date quick calculations ────────────────────────────────────────
export const quickFollowUpDates = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '2 Days', days: 2 },
  { label: '3 Days', days: 3 },
  { label: '5 Days', days: 5 },
  { label: '1 Week', days: 7 },
  { label: '10 Days', days: 10 },
  { label: '2 Weeks', days: 14 },
  { label: '3 Weeks', days: 21 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

export const getDateFromDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0); // Default 9am
  return date.toISOString();
};

export const getDateFromDaysAndHour = (days, hour = 9, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minutes, 0, 0);
  return date.toISOString();
};

export const addDaysToFollowUp = (currentFollowUp, days) => {
  const base = currentFollowUp ? new Date(currentFollowUp) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString();
};

// ─── Greeting ─────────────────────────────────────────────────────────────────
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Truncate URL for display ──────────────────────────────────────────────────
export const displayUrl = (url) => {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};

// ─── Facebook profile shortname ────────────────────────────────────────────────
export const extractFacebookHandle = (url) => {
  if (!url) return '';
  const match = url.match(/facebook\.com\/([^/?#]+)/i);
  return match ? match[1] : displayUrl(url);
};
