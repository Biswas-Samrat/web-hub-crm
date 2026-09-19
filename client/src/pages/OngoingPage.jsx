import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Calendar, DollarSign, ExternalLink, MoreVertical,
  CheckCircle2, Clock, Globe, ArrowRight, AlertCircle, Plus
} from 'lucide-react';
import { getClients } from '../api/clients';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function OngoingPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClients({ filter: 'ongoing', limit: 100 });
      setClients(res.data.clients || []);
    } catch {
      toast.error('Failed to load ongoing projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const totalValue = clients.reduce((acc, c) => acc + (c.project?.price || 0), 0);
  const totalPaid = clients.reduce((acc, c) => acc + (c.project?.depositPaid || 0), 0);
  const totalRemaining = totalValue - totalPaid;

  return (
    <div className="space-y-5">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="card p-3.5 bg-brand-50 border-brand-200">
          <p className="text-xs font-semibold text-brand-700">Active Projects</p>
          <p className="text-xl font-bold text-brand-900 mt-0.5">{clients.length}</p>
        </div>
        <div className="card p-3.5 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Deposits Paid</p>
          <p className="text-xl font-bold text-emerald-900 mt-0.5">{formatPrice(totalPaid)}</p>
        </div>
        <div className="card p-3.5 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Remaining Balance</p>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{formatPrice(totalRemaining)}</p>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <LoadingState message="Loading ongoing projects..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No ongoing projects"
          description="Projects you move to 'Ongoing' or 'Ready to Start' will show up here."
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
                className="card p-4 hover:shadow-md transition-all cursor-pointer space-y-3 border-l-4 border-l-brand-600"
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
                    {project.status && (
                      <StatusBadge status={project.status} type="project" />
                    )}
                    {project.paymentStatus && (
                      <StatusBadge status={project.paymentStatus} type="payment" />
                    )}
                  </div>
                </div>

                {/* Project Scope / Description */}
                {project.scope && (
                  <p className="text-xs text-surface-600 bg-surface-50 p-2.5 rounded-lg border border-surface-200/60 line-clamp-2">
                    {project.scope}
                  </p>
                )}

                {/* Financials and Deadlines */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-surface-100 text-xs">
                  <div>
                    <span className="text-surface-400 block text-[11px]">Total Price</span>
                    <span className="font-semibold text-surface-800">{formatPrice(project.price, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Deposit Paid</span>
                    <span className="font-semibold text-emerald-600">{formatPrice(project.depositPaid, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Balance Due</span>
                    <span className="font-semibold text-amber-600">{formatPrice(balance, project.currency)}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[11px]">Delivery Date</span>
                    <span className="font-semibold text-surface-800">{formatDate(project.deliveryDate)}</span>
                  </div>
                </div>

                {/* Footer with Links */}
                <div className="flex items-center justify-between pt-1 text-xs text-brand-600 font-medium">
                  <div className="flex items-center gap-3">
                    {project.demoUrl && (
                      <span className="flex items-center gap-1 hover:underline">
                        <Globe size={13} /> Demo Ready
                      </span>
                    )}
                    {client.facebookUrl && (
                      <span className="flex items-center gap-1 text-surface-500 hover:text-surface-800">
                        <ExternalLink size={13} /> Messenger
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Manage Project</span>
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
