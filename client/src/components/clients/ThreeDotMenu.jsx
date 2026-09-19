import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Edit2, Tag, Clock, StickyNote, Monitor, Briefcase, Archive, Trash2, X, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { archiveClient, deleteClient } from '../../api/clients';
import ConfirmationModal from '../ui/ConfirmationModal';
import QuickStatusModal from './QuickStatusModal';
import FollowUpModal from './FollowUpModal';
import toast from 'react-hot-toast';

export default function ThreeDotMenu({ client, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    try {
      await archiveClient(client._id);
      toast.success(client.isArchived ? 'Client restored.' : 'Client archived.');
      onClose();
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to archive client.');
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClient(client._id);
      toast.success('Client deleted.');
      onClose();
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to delete client.');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: Eye, label: 'View', action: () => { navigate(`/clients/${client._id}`); onClose(); } },
    { icon: Edit2, label: 'Edit', action: () => { navigate(`/clients/${client._id}?edit=true`); onClose(); } },
    { icon: Tag, label: 'Change Status', action: () => setShowStatusModal(true) },
    { icon: Clock, label: 'Set Follow-Up', action: () => setShowFollowUp(true) },
    { icon: Archive, label: client.isArchived ? 'Restore' : 'Archive', action: handleArchive },
    { icon: Trash2, label: 'Delete', action: () => setShowDeleteConfirm(true), danger: true },
  ];

  if (showStatusModal) {
    return (
      <QuickStatusModal
        client={client}
        onClose={onClose}
        onSuccess={onUpdate}
      />
    );
  }

  if (showFollowUp) {
    return (
      <FollowUpModal
        client={client}
        onClose={onClose}
        onSuccess={onUpdate}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe"
        >
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-surface-900 text-sm">{client.businessName}</p>
              <p className="text-xs text-surface-400">{client.status}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-100">
              <X size={18} className="text-surface-400" />
            </button>
          </div>
          <div className="p-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-surface-700 hover:bg-surface-50'
                }`}
              >
                <item.icon size={18} className={item.danger ? 'text-red-500' : 'text-surface-400'} />
                <span className="font-medium text-sm">{item.label}</span>
                <ArrowRight size={14} className="ml-auto text-surface-300" />
              </button>
            ))}
          </div>
          <div className="h-2" />
        </motion.div>
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to permanently delete "${client.businessName}"? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger={true}
        loading={loading}
      />
    </>
  );
}
