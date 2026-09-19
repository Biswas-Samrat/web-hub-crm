import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Edit2, Save, X, Plus, Globe, Phone, Mail,
  Tag, Calendar, CheckCircle, Clock, Briefcase, Monitor, AlertTriangle, Trash2
} from 'lucide-react';
import { getClient, updateClient, updateDemo, updateProject, convertToProject, addActivity, archiveClient } from '../api/clients';
import StatusBadge from '../components/ui/StatusBadge';
import FollowUpTimer from '../components/ui/FollowUpTimer';
import ActivityTimeline from '../components/clients/ActivityTimeline';
import FollowUpModal from '../components/clients/FollowUpModal';
import QuickStatusModal from '../components/clients/QuickStatusModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LoadingState from '../components/ui/LoadingState';
import { formatDate, formatPrice } from '../utils/helpers';
import { CLIENT_STATUSES, RESPONSE_TYPES, DEMO_STATUSES, PROJECT_STATUSES, PAYMENT_STATUSES, CATEGORIES, CURRENCIES } from '../utils/statusConfig';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getClient(id);
      setClient(res.data.client);
      setEditForm(res.data.client);
    } catch {
      toast.error('Client not found.');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const setField = (field) => (e) => setEditForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateClient(id, editForm);
      setClient(res.data.client);
      setEditing(false);
      toast.success('Client saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemoUpdate = async (demoData) => {
    try {
      const res = await updateDemo(id, demoData);
      setClient(c => ({ ...c, demo: res.data.demo }));
      toast.success('Demo updated.');
      load();
    } catch {
      toast.error('Failed to update demo.');
    }
  };

  const handleProjectUpdate = async (projectData) => {
    try {
      const res = await updateProject(id, projectData);
      setClient(res.data.client);
      toast.success('Project updated.');
      load();
    } catch {
      toast.error('Failed to update project.');
    }
  };

  if (loading) return <LoadingState fullPage message="Loading client..." />;
  if (!client) return null;

  const TABS = [
    { id: 'info', label: 'Info' },
    { id: 'followup', label: 'Follow-Up' },
    { id: 'demo', label: 'Demo' },
    { id: 'project', label: 'Project' },
    { id: 'activity', label: 'Timeline' },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors mt-0.5 flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-surface-900 break-words">{client.businessName}</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <StatusBadge status={client.status} />
            {client.responseType && <StatusBadge status={client.responseType} type="response" />}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`btn-sm ${editing ? 'btn-secondary' : 'btn-outline'} flex-shrink-0`}
        >
          {editing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
        </button>
      </div>

      {/* Quick actions bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setShowStatusModal(true)} className="btn-sm btn-outline whitespace-nowrap">
          <Tag size={13} /> Status
        </button>
        <button onClick={() => setShowFollowUp(true)} className="btn-sm btn-outline whitespace-nowrap">
          <Clock size={13} /> Follow-Up
        </button>
        {client.facebookUrl && (
          <a href={client.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-sm btn-outline whitespace-nowrap">
            <ExternalLink size={13} /> Facebook
          </a>
        )}
        {!['Ongoing Project', 'Website Delivered', 'Project Completed'].includes(client.status) && (
          <button onClick={() => setShowConvert(true)} className="btn-sm btn-success whitespace-nowrap">
            <Briefcase size={13} /> Convert to Project
          </button>
        )}
        <button onClick={() => setShowArchiveConfirm(true)} className="btn-sm btn-ghost whitespace-nowrap text-surface-500">
          <Trash2 size={13} /> Archive
        </button>
      </div>

      {/* Follow-up banner */}
      {client.followUpAt && (
        <div
          className="card p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-card-hover transition-shadow"
          onClick={() => setShowFollowUp(true)}
        >
          <Clock size={18} className="text-brand-500 flex-shrink-0" />
          <div className="flex-1">
            <FollowUpTimer followUpAt={client.followUpAt} />
            <p className="text-xs text-surface-400 mt-0.5">Tap to update follow-up</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="filter-chips border-b border-surface-200 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <InfoTab
          client={client}
          editing={editing}
          editForm={editForm}
          setField={setField}
          setEditForm={setEditForm}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {activeTab === 'followup' && (
        <FollowUpTab client={client} onFollowUp={() => setShowFollowUp(true)} onUpdate={load} />
      )}
      {activeTab === 'demo' && (
        <DemoTab client={client} onUpdate={handleDemoUpdate} />
      )}
      {activeTab === 'project' && (
        <ProjectTab client={client} onUpdate={handleProjectUpdate} onConvert={() => setShowConvert(true)} />
      )}
      {activeTab === 'activity' && (
        <div className="card p-4">
          <ActivityTimeline
            activities={client.activityLog || []}
            onAddActivity={() => setShowAddActivity(true)}
          />
        </div>
      )}

      {/* Modals */}
      {showFollowUp && (
        <FollowUpModal
          client={client}
          onClose={() => setShowFollowUp(false)}
          onSuccess={() => { setShowFollowUp(false); load(); }}
        />
      )}
      {showStatusModal && (
        <QuickStatusModal
          client={client}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => { setShowStatusModal(false); load(); }}
        />
      )}
      {showConvert && (
        <ConvertModal
          client={client}
          onClose={() => setShowConvert(false)}
          onSuccess={() => { setShowConvert(false); load(); }}
        />
      )}
      {showAddActivity && (
        <AddActivityModal
          clientId={id}
          onClose={() => setShowAddActivity(false)}
          onSuccess={() => { setShowAddActivity(false); load(); }}
        />
      )}
      <ConfirmationModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={async () => {
          await archiveClient(id);
          toast.success('Client archived.');
          navigate('/clients');
        }}
        title="Archive Client"
        message={`Archive "${client.businessName}"? You can restore them later from the Archived filter.`}
        confirmLabel="Archive"
      />
    </div>
  );
}

// ─── Info Tab ──────────────────────────────────────────────────────────────────
function InfoTab({ client, editing, editForm, setField, setEditForm, onSave, saving }) {
  const SectionField = ({ label, value, children }) => (
    <div>
      <dt className="text-xs text-surface-400 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5">{children || <span className="text-sm text-surface-700">{value || '—'}</span>}</dd>
    </div>
  );

  if (editing) {
    return (
      <div className="card p-4 space-y-4">
        <h3 className="font-semibold text-surface-900">Edit Client</h3>
        <div className="space-y-3">
          {[
            { label: 'Business Name *', field: 'businessName', type: 'text' },
            { label: 'Contact Person', field: 'contactName', type: 'text' },
            { label: 'Facebook URL *', field: 'facebookUrl', type: 'url' },
            { label: 'Messenger URL', field: 'messengerUrl', type: 'url' },
            { label: 'Phone', field: 'phone', type: 'tel' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'Website', field: 'website', type: 'url' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input type={type} value={editForm[field] || ''} onChange={setField(field)} className="input" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={editForm.category || ''} onChange={setField('category')} className="select">
                <option value="">— None —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Country</label>
              <input type="text" value={editForm.country || ''} onChange={setField('country')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">City</label>
            <input type="text" value={editForm.city || ''} onChange={setField('city')} className="input" />
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              value={(editForm.tags || []).join(', ')}
              onChange={(e) => setEditForm(f => ({
                ...f,
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))}
              className="input"
              placeholder="UK, High Potential, Demo"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={editForm.notes || ''} onChange={setField('notes')} className="textarea" rows={4} />
          </div>

          <div>
            <label className="label">Proposal Date</label>
            <input
              type="date"
              value={editForm.proposalSentAt ? editForm.proposalSentAt.split('T')[0] : ''}
              onChange={setField('proposalSentAt')}
              className="input"
            />
          </div>
        </div>
        <button onClick={onSave} disabled={saving} className="btn-lg btn-primary w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <h3 className="font-semibold text-surface-900 mb-3">Contact Information</h3>
        <dl className="space-y-3">
          <SectionField label="Business Name" value={client.businessName} />
          <SectionField label="Contact Person" value={client.contactName} />
          <SectionField label="Category">{client.category ? (
            <span className="text-sm text-surface-700">{client.category}</span>
          ) : '—'}</SectionField>
          <SectionField label="Country / City" value={[client.country, client.city].filter(Boolean).join(', ')} />
          <SectionField label="Phone">{client.phone ? (
            <a href={`tel:${client.phone}`} className="text-sm text-brand-600 hover:underline">{client.phone}</a>
          ) : '—'}</SectionField>
          <SectionField label="Email">{client.email ? (
            <a href={`mailto:${client.email}`} className="text-sm text-brand-600 hover:underline">{client.email}</a>
          ) : '—'}</SectionField>
          <SectionField label="Website">{client.website ? (
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              <Globe size={12} /> {client.website.replace(/^https?:\/\//, '')}
            </a>
          ) : '—'}</SectionField>
          <SectionField label="Facebook">{client.facebookUrl ? (
            <a href={client.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline break-url flex items-center gap-1">
              <ExternalLink size={12} /> {client.facebookUrl}
            </a>
          ) : '—'}</SectionField>
        </dl>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-surface-900 mb-3">Sales Information</h3>
        <dl className="space-y-3">
          <SectionField label="Status"><StatusBadge status={client.status} /></SectionField>
          <SectionField label="Response Type">{client.responseType ? <StatusBadge status={client.responseType} type="response" /> : '—'}</SectionField>
          <SectionField label="Proposal Sent" value={formatDate(client.proposalSentAt)} />
          <SectionField label="First Contact" value={formatDate(client.firstContactAt)} />
          <SectionField label="Last Contact" value={formatDate(client.lastContactAt)} />
        </dl>
      </div>

      {client.tags?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {client.tags.map(tag => (
              <span key={tag} className="badge bg-surface-100 text-surface-600">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {client.notes && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-900 mb-2">Notes</h3>
          <p className="text-sm text-surface-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Follow-Up Tab ─────────────────────────────────────────────────────────────
function FollowUpTab({ client, onFollowUp, onUpdate }) {
  return (
    <div className="card p-4 space-y-4">
      <h3 className="font-semibold text-surface-900">Follow-Up Status</h3>
      {client.followUpAt ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Next Follow-Up</p>
            <p className="text-sm font-medium text-surface-800">{formatDate(client.followUpAt)}</p>
            <FollowUpTimer followUpAt={client.followUpAt} />
          </div>
          {client.followUpCompletedAt && (
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Last Completed</p>
              <p className="text-sm text-surface-700">{formatDate(client.followUpCompletedAt)}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-surface-400">No follow-up set.</p>
      )}
      <button onClick={onFollowUp} className="btn-md btn-primary w-full gap-2">
        <Clock size={16} /> Set / Update Follow-Up
      </button>
    </div>
  );
}

// ─── Demo Tab ──────────────────────────────────────────────────────────────────
function DemoTab({ client, onUpdate }) {
  const [form, setForm] = useState({
    requested: client.demo?.requested || false,
    url: client.demo?.url || '',
    name: client.demo?.name || '',
    status: client.demo?.status || 'Not Requested',
    feedback: client.demo?.feedback || '',
    notes: client.demo?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(form);
    setSaving(false);
  };

  return (
    <div className="card p-4 space-y-4">
      <h3 className="font-semibold text-surface-900">Demo Information</h3>
      <div className="space-y-3">
        <div>
          <label className="label">Demo Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="select">
            {DEMO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-1.5"><StatusBadge status={form.status} /></div>
        </div>
        <div>
          <label className="label">Demo Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. ABC Cleaning Demo" />
        </div>
        <div>
          <label className="label">Demo URL</label>
          <div className="flex gap-2">
            <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="input flex-1" placeholder="https://..." />
            {form.url && (
              <a href={form.url} target="_blank" rel="noopener noreferrer" className="btn-md btn-outline px-3">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
        <div>
          <label className="label">Client Feedback</label>
          <textarea value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} className="textarea" rows={3} placeholder="What did the client say about the demo?" />
        </div>
        <div>
          <label className="label">Demo Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="textarea" rows={2} />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-md btn-primary w-full">
        {saving ? 'Saving...' : 'Save Demo'}
      </button>
    </div>
  );
}

// ─── Project Tab ───────────────────────────────────────────────────────────────
function ProjectTab({ client, onUpdate, onConvert }) {
  const [form, setForm] = useState({
    status: client.project?.status || 'Not Started',
    name: client.project?.name || '',
    price: client.project?.price || '',
    currency: client.project?.currency || 'GBP',
    startDate: client.project?.startDate ? client.project.startDate.split('T')[0] : '',
    targetDate: client.project?.targetDate ? client.project.targetDate.split('T')[0] : '',
    deliveryDate: client.project?.deliveryDate ? client.project.deliveryDate.split('T')[0] : '',
    paymentStatus: client.project?.paymentStatus || 'Not Discussed',
    liveUrl: client.project?.liveUrl || '',
    notes: client.project?.notes || '',
    clientFeedback: client.project?.clientFeedback || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(form);
    setSaving(false);
  };

  const hasProject = ['Ongoing Project', 'Website Delivered', 'Project Completed'].includes(client.status)
    || client.project?.status !== 'Not Started';

  if (!hasProject) {
    return (
      <div className="card p-6 text-center space-y-3">
        <Briefcase size={32} className="text-surface-300 mx-auto" />
        <p className="text-sm text-surface-500">This client hasn't been converted to a project yet.</p>
        <button onClick={onConvert} className="btn-md btn-primary mx-auto">
          Convert to Project
        </button>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-surface-900">Project Information</h3>
        <StatusBadge status={form.status} type="project" />
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Project Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="select">
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Project Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" placeholder="500" />
          </div>
          <div>
            <label className="label">Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="select">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Payment Status</label>
          <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))} className="select">
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-1.5"><StatusBadge status={form.paymentStatus} type="payment" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Start Date', field: 'startDate' },
            { label: 'Target Delivery', field: 'targetDate' },
            { label: 'Actual Delivery', field: 'deliveryDate' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input type="date" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="input" />
            </div>
          ))}
        </div>
        <div>
          <label className="label">Live Website URL</label>
          <div className="flex gap-2">
            <input type="url" value={form.liveUrl} onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))} className="input flex-1" placeholder="https://..." />
            {form.liveUrl && (
              <a href={form.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-md btn-outline px-3">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
        <div>
          <label className="label">Project Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="textarea" rows={3} />
        </div>
        <div>
          <label className="label">Client Feedback</label>
          <textarea value={form.clientFeedback} onChange={e => setForm(f => ({ ...f, clientFeedback: e.target.value }))} className="textarea" rows={2} />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-md btn-primary w-full">
        {saving ? 'Saving...' : 'Save Project'}
      </button>
    </div>
  );
}

// ─── Convert Modal ─────────────────────────────────────────────────────────────
function ConvertModal({ client, onClose, onSuccess }) {
  const [form, setForm] = useState({ projectName: '', price: '', currency: 'GBP', startDate: '', targetDate: '' });
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      await convertToProject(client._id, form);
      toast.success('Client converted to project!');
      onSuccess();
    } catch {
      toast.error('Failed to convert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Convert to Project" size="sm">
      <div className="space-y-3">
        <p className="text-sm text-surface-600">Convert <strong>{client.businessName}</strong> into an active project.</p>
        <div>
          <label className="label">Project Name</label>
          <input type="text" value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} className="input" placeholder={`${client.businessName} Website`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" placeholder="500" />
          </div>
          <div>
            <label className="label">Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="select">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Target Delivery</label>
          <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="input" />
        </div>
        <button onClick={handleConvert} disabled={loading} className="btn-md btn-success w-full">
          {loading ? 'Converting...' : 'Convert to Project'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Activity Modal ────────────────────────────────────────────────────────
function AddActivityModal({ clientId, onClose, onSuccess }) {
  const [type, setType] = useState('Note Added');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { ACTIVITY_TYPES } = require('../utils/statusConfig');

  const handleAdd = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await addActivity(clientId, { type, message });
      toast.success('Activity added.');
      onSuccess();
    } catch {
      toast.error('Failed to add activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Activity" size="sm">
      <div className="space-y-3">
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="select">
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} className="textarea" rows={3} placeholder="What happened?" autoFocus />
        </div>
        <button onClick={handleAdd} disabled={loading || !message.trim()} className="btn-md btn-primary w-full">
          {loading ? 'Adding...' : 'Add Activity'}
        </button>
      </div>
    </Modal>
  );
}
