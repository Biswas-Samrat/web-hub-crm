import { useState } from 'react';
import Modal from '../ui/Modal';
import { updateFollowUp } from '../../api/clients';
import { formatDate } from '../../utils/helpers';
import EasyTimeSelector from '../ui/EasyTimeSelector';
import toast from 'react-hot-toast';

export default function FollowUpModal({ client, onClose, onSuccess, afterComplete = false }) {
  const [scheduledAt, setScheduledAt] = useState(client.followUpAt || null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateFollowUp(client._id, { followUpAt: scheduledAt });
      toast.success(scheduledAt ? 'Follow-up reminder scheduled!' : 'Follow-up cleared.');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error('Failed to update follow-up.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (nextFollowUpDays = null) => {
    setLoading(true);
    try {
      const payload = { action: 'complete' };
      if (nextFollowUpDays !== null) {
        payload.followUpAt = getDateFromDays(nextFollowUpDays);
      }
      await updateFollowUp(client._id, payload);
      toast.success('Follow-up completed!');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error('Failed to complete follow-up.');
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (days) => {
    setLoading(true);
    try {
      await updateFollowUp(client._id, { action: 'snooze', snoozeDays: days });
      toast.success(`Snoozed for ${days} day${days !== 1 ? 's' : ''}.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error('Failed to snooze.');
    } finally {
      setLoading(false);
    }
  };

  if (afterComplete) {
    return (
      <Modal isOpen={true} onClose={onClose} title="✅ Follow-Up Completed!" size="sm">
        <p className="text-sm text-surface-600 mb-4">Set the next follow-up?</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Tomorrow', days: 1 },
            { label: '3 Days', days: 3 },
            { label: '1 Week', days: 7 },
            { label: '2 Weeks', days: 14 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleComplete(opt.days)}
              disabled={loading}
              className="btn-md btn-secondary"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => handleComplete(null)} className="btn-md btn-ghost w-full text-surface-400">
          No next follow-up
        </button>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Follow-Up: ${client.businessName}`} size="md">
      <div className="space-y-4">
        {/* Easy Time Selector */}
        <div>
          <label className="label text-xs">Set Follow-Up Date & Time</label>
          <EasyTimeSelector
            value={scheduledAt}
            onChange={(val) => setScheduledAt(val)}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-md btn-primary w-full"
        >
          {loading ? 'Saving...' : 'Save Follow-Up'}
        </button>

        {/* If existing follow-up — quick complete & snooze actions */}
        {client.followUpAt && (
          <div className="pt-3 border-t border-surface-100">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Quick Actions</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleComplete(null)}
                disabled={loading}
                className="btn-sm btn-success flex-1 text-xs"
              >
                ✓ Mark Done
              </button>
              <button
                onClick={() => handleSnooze(1)}
                disabled={loading}
                className="btn-sm btn-secondary flex-1 text-xs"
              >
                +1 Day
              </button>
              <button
                onClick={() => handleSnooze(3)}
                disabled={loading}
                className="btn-sm btn-secondary flex-1 text-xs"
              >
                +3 Days
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
