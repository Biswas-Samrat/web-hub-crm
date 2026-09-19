import { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { createClient } from '../../api/clients';
import { CLIENT_STATUSES, CATEGORIES } from '../../utils/statusConfig';
import StatusBadge from '../ui/StatusBadge';
import EasyTimeSelector from '../ui/EasyTimeSelector';
import toast from 'react-hot-toast';

export default function AddClientModal({ onClose, onSuccess, prefillUrl = '' }) {
  const [form, setForm] = useState({
    facebookUrl: prefillUrl || '',
    businessName: '',
    contactName: '',
    country: '',
    category: '',
    status: 'Proposal Sent',
    phone: '',
    email: '',
    website: '',
    notes: '',
    followUpAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => {
    setTimeout(() => urlRef.current?.focus(), 100);
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDuplicateInfo(null);

    if (!form.facebookUrl.trim()) {
      setError('Facebook URL is required.');
      return;
    }
    if (!form.businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    setLoading(true);
    try {
      await createClient({
        facebookUrl: form.facebookUrl.trim(),
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        country: form.country,
        category: form.category,
        status: form.status,
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        notes: form.notes.trim(),
        ...(form.followUpAt && { followUpAt: form.followUpAt }),
      });

      toast.success(`${form.businessName} added to CRM!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicateInfo(err.response.data);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Unable to save client.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Client" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Facebook URL — most important field */}
        <div>
          <label htmlFor="fb-url" className="label">
            Facebook URL <span className="text-red-500">*</span>
          </label>
          <input
            id="fb-url"
            ref={urlRef}
            type="url"
            value={form.facebookUrl}
            onChange={set('facebookUrl')}
            className={`input ${error && !form.facebookUrl ? 'input-error' : ''}`}
            placeholder="https://facebook.com/businessname"
            autoComplete="off"
          />
        </div>

        {/* Business Name & Contact Name row on laptop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="biz-name" className="label">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="biz-name"
              type="text"
              value={form.businessName}
              onChange={set('businessName')}
              className="input"
              placeholder="e.g. ABC Cleaning Services"
            />
          </div>

          <div>
            <label htmlFor="contact-name" className="label">Contact Person</label>
            <input
              id="contact-name"
              type="text"
              value={form.contactName}
              onChange={set('contactName')}
              className="input"
              placeholder="e.g. Sarah Johnson"
            />
          </div>
        </div>

        {/* Category + Country row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={set('category')} className="select">
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={set('country')}
              className="input"
              placeholder="e.g. UK"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={set('status')} className="select">
            {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-1.5">
            <StatusBadge status={form.status} />
          </div>
        </div>

        {/* Easy Follow-up Time Selector */}
        <div>
          <label className="label">Follow-Up Reminder <span className="text-surface-400 font-normal">(optional)</span></label>
          <EasyTimeSelector
            value={form.followUpAt}
            onChange={(val) => setForm(f => ({ ...f, followUpAt: val }))}
          />
        </div>

        {/* Optional fields (collapsible) */}
        <details className="group border border-surface-200 rounded-xl p-3 bg-surface-50/50">
          <summary className="text-sm text-brand-600 cursor-pointer hover:text-brand-700 font-medium select-none list-none flex items-center justify-between">
            <span>+ More details (phone, email, website, notes)</span>
            <span className="text-xs text-surface-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-3 pt-2 border-t border-surface-200/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="input" placeholder="+44..." />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="contact@example.com" />
              </div>
            </div>
            <div>
              <label className="label">Website</label>
              <input type="url" value={form.website} onChange={set('website')} className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} className="textarea" rows={3} placeholder="Conversation notes..." />
            </div>
          </div>
        </details>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
            {duplicateInfo && (
              <div className="mt-2 flex gap-2">
                <a
                  href={`/clients/${duplicateInfo.existingClient?.id}`}
                  className="btn-sm btn-outline text-xs"
                >
                  Open Existing Client
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-md btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-lg sm:btn-md btn-primary w-full sm:w-auto sm:min-w-[130px]"
          >
            {loading ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
