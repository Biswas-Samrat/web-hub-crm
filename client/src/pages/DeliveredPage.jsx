import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, ExternalLink, CheckCircle2, DollarSign, Calendar, ArrowRight, Check
} from 'lucide-react';
import { getClients } from '../api/clients';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DeliveredPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClients({ filter: 'delivered', limit: 100 });
      setClients(res.data.clients || []);
    } catch {
      toast.error('Failed to load delivered websites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="card p-4 bg-cyan-50/70 border-cyan-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="font-bold text-cyan-950 text-sm">Delivered Websites</h2>
            <p className="text-xs text-cyan-800">
              Websites currently delivered to clients awaiting final signoff or remaining payments.
            </p>
          </div>
        </div>
      </div>

      {/* Delivered List */}
      {loading ? (
        <LoadingState message="Loading delivered websites..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No delivered websites"
          description="Projects you mark as 'Website Delivered' will appear here."
        />
      ) : (
        <div className="space-y-3.5">
          {clients.map((client) => {
            const project = client.project || {};
            const balance = (project.price || 0) - (project.depositPaid || 0);

            return (
              <div
                key={client._id}
                onClick={() => navigate(`/clients/${client._id}`)}
                className="card p-4 hover:shadow-md transition-all cursor-pointer space-y-3 border-l-4 border-l-cyan-600"
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
                    <StatusBadge status={client.status} type="client" />
                    {project.paymentStatus && (
                      <StatusBadge status={project.paymentStatus} type="payment" />
                    )}
                  </div>
                </div>

                {/* Live Website Link / Domain */}
                {project.liveUrl && (
                  <div className="flex items-center gap-2 bg-surface-50 px-3 py-2 rounded-lg border border-surface-200 text-xs">
                    <Globe size={14} className="text-cyan-600" />
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

                {/* Financial Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-surface-100 text-xs">
                  <div>
                    <span className="text-surface-400 block text-[11px]">Total Price</span>
                    <span className="font-semibold text-surface-800">{formatPrice(project.price, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Paid So Far</span>
                    <span className="font-semibold text-emerald-600">{formatPrice(project.depositPaid, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Remaining Balance</span>
                    <span className={`font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatPrice(balance, project.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Delivered On</span>
                    <span className="font-semibold text-surface-800">{formatDate(project.deliveryDate || client.updatedAt)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 text-xs text-brand-600 font-medium">
                  <span className="text-surface-400">Tap to view full project & payments</span>
                  <div className="flex items-center gap-1">
                    <span>View Client</span>
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
