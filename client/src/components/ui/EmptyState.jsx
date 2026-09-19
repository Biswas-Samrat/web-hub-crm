export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-surface-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-surface-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-400 max-w-xs mb-4">{description}</p>}
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  );
}
