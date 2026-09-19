import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Globe, ExternalLink, Award, ArrowRight, DollarSign
} from 'lucide-react';
import { getClients } from '../api/clients';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CompletedPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClients({ filter: 'completed', limit: 100 });
      setClients(res.data.clients || []);
    } catch {
      toast.error('Failed to load completed projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const totalEarned = clients.reduce((acc, c) => acc + (c.project?.price || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-800">Completed Projects</p>
          </div>
          <p className="text-2xl font-bold text-emerald-950">{clients.length}</p>
        </div>
        <div className="card p-4 bg-brand-50 border-brand-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-brand-600" />
            <p className="text-xs font-semibold text-brand-800">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-brand-950">{formatPrice(totalEarned)}</p>
        </div>
      </div>

      {/* Completed List */}
      {loading ? (
        <LoadingState message="Loading completed projects..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No completed projects yet"
          description="Projects you close out and complete will appear here in your trophy room."
        />
      ) : (
        <div className="space-y-3.5">
          {clients.map((client) => {
            const project = client.project || {};

            return (
              <div
                key={client._id}
                onClick={() => navigate(`/clients/${client._id}`)}
                className="card p-4 hover:shadow-md transition-all cursor-pointer space-y-3 border-l-4 border-l-emerald-500"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-surface-900 text-base leading-tight">
                      {client.businessName}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">{client.clientName || 'No contact name'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <StatusBadge status="Project Completed" type="client" />
                  </div>
                </div>

                {/* Live Website Link / Domain */}
                {project.liveUrl && (
                  <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100 text-xs">
                    <Globe size={14} className="text-emerald-600" />
                    <a
                      href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-brand-600 hover:underline font-medium truncate flex-1"
                    >
                      {project.liveUrl}
                    </a>
                    <ExternalLink size={12} className="text-surface-400 flex-shrink-0" />
                  </div>
                )}

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-surface-100 text-xs">
                  <div>
                    <span className="text-surface-400 block text-[11px]">Final Price</span>
                    <span className="font-semibold text-emerald-700">{formatPrice(project.price, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Payment</span>
                    <span className="font-semibold text-emerald-700">Fully Paid</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Completed Date</span>
                    <span className="font-semibold text-surface-700">{formatDate(client.updatedAt)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 text-xs text-brand-600 font-medium">
                  <span className="text-surface-400">Tap to view client history</span>
                  <div className="flex items-center gap-1">
                    <span>View Record</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
