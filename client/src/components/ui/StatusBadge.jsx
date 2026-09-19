import { STATUS_CONFIG, RESPONSE_TYPE_CONFIG, PROJECT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../../utils/statusConfig';

export default function StatusBadge({ status, type = 'client', className = '' }) {
  let config;
  if (type === 'client') config = STATUS_CONFIG[status];
  else if (type === 'response') config = RESPONSE_TYPE_CONFIG[status];
  else if (type === 'project') config = PROJECT_STATUS_CONFIG[status];
  else if (type === 'payment') config = PAYMENT_STATUS_CONFIG[status];

  const colorClass = config?.color || 'bg-surface-100 text-surface-600';

  return (
    <span className={`badge ${colorClass} ${className}`}>
      {config?.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      )}
      {status || '—'}
    </span>
  );
}
