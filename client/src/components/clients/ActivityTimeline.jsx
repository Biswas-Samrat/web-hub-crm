import { formatRelative, formatDate } from '../../utils/helpers';
import {
  Send, MessageSquare, Clock, CheckCircle, Monitor, Navigation, Briefcase,
  Globe, DollarSign, Tag, StickyNote, Plus, User
} from 'lucide-react';

const ACTIVITY_ICONS = {
  'Proposal Sent': Send,
  'Client Replied': MessageSquare,
  'Follow-Up Scheduled': Clock,
  'Follow-Up Completed': CheckCircle,
  'Demo Created': Monitor,
  'Demo Sent': Navigation,
  'Demo Feedback': MessageSquare,
  'Price Discussed': DollarSign,
  'Negotiation': DollarSign,
  'Project Started': Briefcase,
  'Website Delivered': Globe,
  'Payment Received': DollarSign,
  'Status Changed': Tag,
  'Note Added': StickyNote,
  'Client Created': User,
  'Client Converted': Briefcase,
  'Other': StickyNote,
};

const ACTIVITY_COLORS = {
  'Proposal Sent': 'bg-blue-100 text-blue-600',
  'Client Replied': 'bg-emerald-100 text-emerald-600',
  'Follow-Up Scheduled': 'bg-amber-100 text-amber-600',
  'Follow-Up Completed': 'bg-emerald-100 text-emerald-600',
  'Demo Created': 'bg-purple-100 text-purple-600',
  'Demo Sent': 'bg-indigo-100 text-indigo-600',
  'Demo Feedback': 'bg-fuchsia-100 text-fuchsia-600',
  'Price Discussed': 'bg-pink-100 text-pink-600',
  'Negotiation': 'bg-pink-100 text-pink-600',
  'Project Started': 'bg-brand-100 text-brand-600',
  'Website Delivered': 'bg-cyan-100 text-cyan-600',
  'Payment Received': 'bg-emerald-200 text-emerald-700',
  'Status Changed': 'bg-surface-100 text-surface-600',
  'Note Added': 'bg-yellow-100 text-yellow-700',
  'Client Created': 'bg-surface-100 text-surface-500',
  'Client Converted': 'bg-brand-100 text-brand-700',
  'Other': 'bg-surface-100 text-surface-500',
};

export default function ActivityTimeline({ activities = [], onAddActivity }) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-surface-900">Activity Timeline</h3>
        {onAddActivity && (
          <button
            onClick={onAddActivity}
            className="btn-sm btn-outline gap-1"
          >
            <Plus size={13} />
            Add
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-surface-400 py-4 text-center">No activity yet.</p>
      ) : (
        <div className="relative">
          {sorted.map((log, idx) => {
            const Icon = ACTIVITY_ICONS[log.type] || StickyNote;
            const colorClass = ACTIVITY_COLORS[log.type] || 'bg-surface-100 text-surface-500';

            return (
              <div key={log._id || idx} className="flex gap-3 pb-4 last:pb-0">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={13} />
                  </div>
                  {idx < sorted.length - 1 && (
                    <div className="w-px flex-1 bg-surface-200 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <p className="text-sm text-surface-800 leading-snug">{log.message}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {formatRelative(log.createdAt)}
                    <span className="mx-1">·</span>
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
