import { useState } from 'react';
import Modal from '../ui/Modal';
import { updateStatus } from '../../api/clients';
import { CLIENT_STATUSES, RESPONSE_TYPES } from '../../utils/statusConfig';
import StatusBadge from '../ui/StatusBadge';
import toast from 'react-hot-toast';

export default function QuickStatusModal({ client, onClose, onSuccess }) {
  const [status, setStatus] = useState(client.status || '');
  const [responseType, setResponseType] = useState(client.responseType || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!status) return;
    setLoading(true);
    try {
      await updateStatus(client._id, { status, responseType: responseType || undefined });
      toast.success('Status updated.');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Change Status" size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select"
          >
            {CLIENT_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Response Type <span className="text-surface-400 font-normal">(optional)</span></label>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            className="select"
          >
            <option value="">— None —</option>
            {RESPONSE_TYPES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Preview:</span>
          {status && <StatusBadge status={status} />}
          {responseType && <StatusBadge status={responseType} type="response" />}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-md btn-primary w-full"
        >
          {loading ? 'Saving...' : 'Save Status'}
        </button>
      </div>
    </Modal>
  );
}
