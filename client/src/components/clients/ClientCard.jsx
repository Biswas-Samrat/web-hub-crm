import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MoreVertical, Clock, CheckCircle, Plus } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import FollowUpTimer from '../ui/FollowUpTimer';
import ThreeDotMenu from './ThreeDotMenu';
import FollowUpModal from './FollowUpModal';
import { extractFacebookHandle } from '../../utils/helpers';

export default function ClientCard({ client, onUpdate }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const handleOpen = () => navigate(`/clients/${client._id}`);

  return (
    <>
      <div className="card p-4 transition-shadow hover:shadow-card-hover animate-fade-in">
        {/* Top row: name + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-surface-900 text-base leading-snug truncate cursor-pointer hover:text-brand-700 transition-colors"
              onClick={handleOpen}
            >
              {client.businessName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {client.category && (
                <span className="text-xs text-surface-400">{client.category}</span>
              )}
              {client.category && client.country && (
                <span className="text-surface-300 text-xs">•</span>
              )}
              {client.country && (
                <span className="text-xs text-surface-400">{client.country}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors flex-shrink-0"
            aria-label="Options"
          >
            <MoreVertical size={17} />
          </button>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <StatusBadge status={client.status} />
          {client.responseType && (
            <StatusBadge status={client.responseType} type="response" />
          )}
        </div>

        {/* Follow-up timer */}
        {client.followUpAt && (
          <div className="mb-3">
            <FollowUpTimer followUpAt={client.followUpAt} />
          </div>
        )}

        {/* Facebook URL */}
        {client.facebookUrl && (
          <a
            href={client.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mb-3 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={11} />
            <span className="truncate max-w-[200px]">
              {extractFacebookHandle(client.facebookUrl)}
            </span>
          </a>
        )}

        {/* Notes preview */}
        {client.notes && (
          <p className="text-xs text-surface-500 mb-3 truncate-2">{client.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleOpen}
            className="btn-sm btn-primary flex-1"
          >
            Open
          </button>
          <button
            onClick={() => setShowFollowUp(true)}
            className="btn-sm btn-secondary flex-1 gap-1"
          >
            <Clock size={13} />
            Follow Up
          </button>
        </div>
      </div>

      {/* Three dot menu */}
      {showMenu && (
        <ThreeDotMenu
          client={client}
          onClose={() => setShowMenu(false)}
          onUpdate={onUpdate}
        />
      )}

      {/* Follow-up modal */}
      {showFollowUp && (
        <FollowUpModal
          client={client}
          onClose={() => setShowFollowUp(false)}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
