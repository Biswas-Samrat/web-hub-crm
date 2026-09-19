import Modal from './Modal';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="btn-md btn-outline flex-1"
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`btn-md flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
          disabled={loading}
        >
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
