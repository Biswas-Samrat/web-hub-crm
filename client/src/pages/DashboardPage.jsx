import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Send, ThumbsUp, Bell, AlertTriangle, Monitor, Briefcase, Globe, CheckCircle2,
  XCircle, Clock, ArrowRight, TrendingUp
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import { getTodayFollowUps, getOverdueFollowUps } from '../api/followups';
import { useAuth } from '../context/AuthContext';
import { getGreeting, formatRelative, formatDate } from '../utils/helpers';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import FollowUpTimer from '../components/ui/FollowUpTimer';
import StatusBadge from '../components/ui/StatusBadge';
import FollowUpModal from '../components/clients/FollowUpModal';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    className={`card p-4 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-surface-900 leading-none">{value ?? '—'}</p>
      <p className="text-xs text-surface-500 mt-0.5 leading-snug">{label}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUpModal, setFollowUpModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, todayRes, overdueRes] = await Promise.all([
        getDashboardStats(),
        getTodayFollowUps(),
        getOverdueFollowUps(),
      ]);
      setStats(statsRes.data.stats);
      setRecentActivity(statsRes.data.recentActivity || []);
      setTodayFollowUps(todayRes.data.clients || []);
      setOverdueFollowUps(overdueRes.data.clients || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading dashboard..." fullPage />;

  const greeting = getGreeting();
  const hour = new Date().getHours();
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-surface-900">
          {greetEmoji} {greeting}, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-sm text-surface-500 mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} color="bg-surface-100 text-surface-600" onClick={() => navigate('/clients')} />
          <StatCard icon={Send} label="Proposals Sent" value={stats.proposalsSent} color="bg-blue-100 text-blue-600" onClick={() => navigate('/clients?status=Proposal+Sent')} />
          <StatCard icon={ThumbsUp} label="Positive Replies" value={stats.positiveReplies} color="bg-emerald-100 text-emerald-600" onClick={() => navigate('/clients?filter=positive_replies')} />
          <StatCard icon={Bell} label="Follow-Ups Today" value={stats.followUpsToday} color="bg-orange-100 text-orange-600" onClick={() => navigate('/follow-ups')} />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdueFollowUps} color={stats.overdueFollowUps > 0 ? 'bg-red-100 text-red-600' : 'bg-surface-100 text-surface-400'} onClick={() => navigate('/follow-ups')} />
          <StatCard icon={Monitor} label="Demos Sent" value={stats.demosSent} color="bg-purple-100 text-purple-600" onClick={() => navigate('/clients?filter=demo')} />
          <StatCard icon={Briefcase} label="Ongoing Projects" value={stats.ongoingProjects} color="bg-brand-100 text-brand-600" onClick={() => navigate('/ongoing')} />
          <StatCard icon={Globe} label="Delivered" value={stats.deliveredProjects} color="bg-cyan-100 text-cyan-600" onClick={() => navigate('/delivered')} />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completedProjects} color="bg-emerald-200 text-emerald-700" onClick={() => navigate('/completed')} />
          <StatCard icon={XCircle} label="Lost Leads" value={stats.lostLeads} color="bg-surface-100 text-surface-400" onClick={() => navigate('/clients?filter=lost')} />
        </div>
      )}

      {/* OVERDUE */}
      {overdueFollowUps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="font-semibold text-red-600">Overdue ({overdueFollowUps.length})</h3>
          </div>
          <div className="space-y-2">
            {overdueFollowUps.map(client => (
              <FollowUpCard
                key={client._id}
                client={client}
                urgency="overdue"
                onUpdate={load}
                onFollowUp={() => setFollowUpModal(client)}
              />
            ))}
          </div>
        </section>
      )}

      {/* TODAY */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-orange-500" />
          <h3 className="font-semibold text-surface-800">
            Follow-Ups Today {todayFollowUps.length > 0 && `(${todayFollowUps.length})`}
          </h3>
        </div>
        {todayFollowUps.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No follow-ups due today!" description="You're all caught up. 🎉" />
        ) : (
          <div className="space-y-2">
            {todayFollowUps.map(client => (
              <FollowUpCard
                key={client._id}
                client={client}
                urgency="today"
                onUpdate={load}
                onFollowUp={() => setFollowUpModal(client)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-500" />
              <h3 className="font-semibold text-surface-800">Recent Activity</h3>
            </div>
          </div>
          <div className="card divide-y divide-surface-100">
            {recentActivity.slice(0, 8).map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${act.clientId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{act.clientName}</p>
                  <p className="text-xs text-surface-500 truncate">{act.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-surface-400">{formatRelative(act.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Follow-up modal */}
      {followUpModal && (
        <FollowUpModal
          client={followUpModal}
          onClose={() => setFollowUpModal(null)}
          onSuccess={() => { setFollowUpModal(null); load(); }}
        />
      )}
    </div>
  );
}

function FollowUpCard({ client, urgency, onUpdate, onFollowUp }) {
  const navigate = useNavigate();
  const bgClass = urgency === 'overdue'
    ? 'bg-red-50 border-red-200'
    : 'bg-orange-50 border-orange-200';

  return (
    <div className={`rounded-xl border p-3.5 ${bgClass}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 truncate">{client.businessName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {client.category && <span className="text-xs text-surface-500">{client.category}</span>}
            {client.country && <span className="text-xs text-surface-400">• {client.country}</span>}
          </div>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <FollowUpTimer followUpAt={client.followUpAt} />

      {client.notes && (
        <p className="text-xs text-surface-500 mt-2 truncate-2">{client.notes}</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate(`/clients/${client._id}`)}
          className="btn-sm btn-outline flex-1 text-xs"
        >
          Open
        </button>
        <button
          onClick={onFollowUp}
          className={`btn-sm flex-1 text-xs ${urgency === 'overdue' ? 'btn-danger' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
        >
          Follow Up
        </button>
      </div>
    </div>
  );
}
