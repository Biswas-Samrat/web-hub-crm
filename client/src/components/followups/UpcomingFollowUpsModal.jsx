import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, MessageSquare, Send, Copy, Check, CheckCircle2,
  AlertTriangle, Calendar, Search, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, Phone, Mail, Sparkles, MessageCircle,
  SlidersHorizontal, ArrowRight, User
} from 'lucide-react';
import { getFollowUpQueue } from '../../api/followups';
import { updateFollowUp } from '../../api/clients';
import LiveCountdownTimer from '../ui/LiveCountdownTimer';
import StatusBadge from '../ui/StatusBadge';
import EasyTimeSelector from '../ui/EasyTimeSelector';
import toast from 'react-hot-toast';

const SMS_TEMPLATES = [
  {
    id: 'checkin',
    name: 'Quick Check-in',
    template: (client) =>
      `Hi ${client.contactName || client.businessName}, hope you're having a great day! Just following up to see how things are going with ${client.businessName}. Have you had a chance to think about getting a modern website built for your business?`,
  },
  {
    id: 'proposal',
    name: 'Proposal Follow-up',
    template: (client) =>
      `Hi ${client.contactName || client.businessName}, following up on the website proposal we discussed for ${client.businessName}. I'd love to answer any questions you might have or adjust the scope to fit your exact needs!`,
  },
  {
    id: 'demo',
    name: 'Demo Review',
    template: (client) =>
      `Hi ${client.contactName || client.businessName}, hope all is well! Did you have a moment to check out the website demo we created for ${client.businessName}? Looking forward to your thoughts!`,
  },
  {
    id: 'offer',
    name: 'Special Offer',
    template: (client) =>
      `Hi ${client.contactName || client.businessName}, just reaching out from Web Hub! We currently have a few slots open this week for full website delivery with fast turnaround for ${client.businessName}. Let me know if you'd like to get started!`,
  },
  {
    id: 'friendly',
    name: 'Friendly Touchpoint',
    template: (client) =>
      `Hi ${client.contactName || client.businessName}, touching base as planned regarding ${client.businessName}. Would this week work for a quick 5-minute chat?`,
  },
];

export default function UpcomingFollowUpsModal({ isOpen, onClose, onQueueUpdated }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [counts, setCounts] = useState({ total: 0, overdue: 0, today: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overdue', 'today', 'upcoming'
  const [expandedSmsClientId, setExpandedSmsClientId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('checkin');
  const [customMessages, setCustomMessages] = useState({});
  const [reschedulingClientId, setReschedulingClientId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFollowUpQueue();
      setClients(res.data.clients || []);
      setCounts(res.data.counts || { total: 0, overdue: 0, today: 0, upcoming: 0 });
    } catch {
      toast.error('Failed to load follow-up queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, loadQueue]);

  // Filtered and searched clients
  const filteredClients = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return clients.filter((client) => {
      // 1. Tab filter
      const fDate = new Date(client.followUpAt);
      if (activeFilter === 'overdue' && fDate >= startOfDay) return false;
      if (activeFilter === 'today' && (fDate < startOfDay || fDate > endOfDay)) return false;
      if (activeFilter === 'upcoming' && fDate <= endOfDay) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = client.businessName?.toLowerCase().includes(q);
        const matchContact = client.contactName?.toLowerCase().includes(q);
        const matchCategory = client.category?.toLowerCase().includes(q);
        const matchCountry = client.country?.toLowerCase().includes(q);
        const matchPhone = client.phone?.toLowerCase().includes(q);
        return matchName || matchContact || matchCategory || matchCountry || matchPhone;
      }

      return true;
    });
  }, [clients, activeFilter, searchQuery]);

  const getMessageForClient = (client) => {
    if (customMessages[client._id] !== undefined) {
      return customMessages[client._id];
    }
    const tpl = SMS_TEMPLATES.find((t) => t.id === selectedTemplateId) || SMS_TEMPLATES[0];
    return tpl.template(client);
  };

  const handleCopySms = (client) => {
    const message = getMessageForClient(client);
    navigator.clipboard.writeText(message);
    toast.success(`Copied SMS for ${client.businessName}!`, { icon: '📋' });
  };

  const handleMarkComplete = async (client) => {
    setActionLoading((prev) => ({ ...prev, [client._id]: true }));
    try {
      await updateFollowUp(client._id, { action: 'complete' });
      toast.success(`Follow-up completed for ${client.businessName}!`, { icon: '✅' });
      loadQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch {
      toast.error('Failed to update follow-up');
    } finally {
      setActionLoading((prev) => ({ ...prev, [client._id]: false }));
    }
  };

  const handleSnooze = async (client, days) => {
    setActionLoading((prev) => ({ ...prev, [client._id]: true }));
    try {
      await updateFollowUp(client._id, { action: 'snooze', snoozeDays: days });
      toast.success(`Follow-up snoozed +${days}d for ${client.businessName}`);
      loadQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch {
      toast.error('Failed to snooze');
    } finally {
      setActionLoading((prev) => ({ ...prev, [client._id]: false }));
    }
  };

  const handleSaveReschedule = async (client) => {
    if (!rescheduleDate) {
      toast.error('Please pick a date and time');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [client._id]: true }));
    try {
      await updateFollowUp(client._id, { followUpAt: rescheduleDate });
      toast.success(`Rescheduled follow-up for ${client.businessName}!`);
      setReschedulingClientId(null);
      setRescheduleDate(null);
      loadQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch {
      toast.error('Failed to reschedule');
    } finally {
      setActionLoading((prev) => ({ ...prev, [client._id]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
        />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative z-50 bg-surface-50 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-surface-200 overflow-hidden"
        >
          {/* Top Bar Header */}
          <div className="bg-white px-5 py-4 border-b border-surface-200 flex-shrink-0 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 flex-shrink-0">
                <Clock size={20} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-surface-900 leading-none">
                    Upcoming Follow-Up & SMS Queue
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
                    {counts.total} Pending
                  </span>
                </div>
                <p className="text-xs text-surface-500 mt-1 truncate">
                  Ordered chronologically with real-time countdowns & quick SMS tools
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={loadQueue}
                disabled={loading}
                className="p-2 rounded-xl text-surface-500 hover:text-brand-600 hover:bg-surface-100 transition-colors"
                title="Refresh queue"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin text-brand-600' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-white border-b border-surface-200 px-4 sm:px-6 py-3 space-y-3 flex-shrink-0">
            {/* Search input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, contact, category, country..."
                className="w-full pl-10 pr-4 py-2 bg-surface-50 rounded-xl border border-surface-200 text-sm text-surface-800 placeholder-surface-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs & Global Template selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'all'
                      ? 'bg-surface-900 text-white shadow-xs'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  All ({counts.total})
                </button>

                <button
                  onClick={() => setActiveFilter('overdue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeFilter === 'overdue'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Overdue ({counts.overdue})
                </button>

                <button
                  onClick={() => setActiveFilter('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeFilter === 'today'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Due Today ({counts.today})
                </button>

                <button
                  onClick={() => setActiveFilter('upcoming')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeFilter === 'upcoming'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
                  }`}
                >
                  <Calendar size={13} />
                  Upcoming ({counts.upcoming})
                </button>
              </div>

              {/* Template preset switcher */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-surface-400 font-medium whitespace-nowrap flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  SMS Preset:
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="px-2.5 py-1 bg-surface-50 border border-surface-200 rounded-lg text-xs font-medium text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {SMS_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Queue List Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {loading && clients.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-surface-500">Loading follow-up queue & countdowns...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-14 text-center bg-white rounded-2xl border border-surface-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-surface-900 text-base">All Caught Up!</h3>
                <p className="text-xs text-surface-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No clients found matching "${searchQuery}".`
                    : activeFilter !== 'all'
                    ? `No follow-ups in the ${activeFilter} category.`
                    : 'There are no scheduled follow-ups pending right now.'}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="btn-sm btn-outline mx-auto text-xs">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client, index) => {
                  const isSmsExpanded = expandedSmsClientId === client._id;
                  const isRescheduling = reschedulingClientId === client._id;
                  const isActing = !!actionLoading[client._id];
                  const currentMessage = getMessageForClient(client);

                  // Contact actions
                  const cleanPhone = client.phone ? client.phone.replace(/[^0-9+]/g, '') : null;
                  const smsHref = cleanPhone
                    ? `sms:${cleanPhone}?body=${encodeURIComponent(currentMessage)}`
                    : null;
                  const waHref = cleanPhone
                    ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(currentMessage)}`
                    : null;
                  const messengerHref =
                    client.messengerUrl ||
                    (client.facebookUrl?.includes('facebook.com')
                      ? client.facebookUrl
                      : null);

                  return (
                    <div
                      key={client._id}
                      className="bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Card Header & Client Info */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-mono font-bold text-surface-400">
                                #{index + 1}
                              </span>
                              <h3
                                onClick={() => {
                                  onClose();
                                  navigate(`/clients/${client._id}`);
                                }}
                                className="font-bold text-surface-900 text-base hover:text-brand-600 cursor-pointer truncate transition-colors flex items-center gap-1.5"
                                title="Click to view client details"
                              >
                                {client.businessName}
                                <ExternalLink size={13} className="text-surface-400 flex-shrink-0" />
                              </h3>
                            </div>

                            {/* Contact Person & Meta */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-surface-500">
                              {client.contactName && (
                                <span className="flex items-center gap-1 font-medium text-surface-700">
                                  <User size={12} className="text-surface-400" />
                                  {client.contactName}
                                </span>
                              )}
                              {client.contactName && client.category && <span>•</span>}
                              {client.category && (
                                <span className="text-surface-500">{client.category}</span>
                              )}
                              {client.country && (
                                <>
                                  <span>•</span>
                                  <span className="text-surface-500">{client.country}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <StatusBadge status={client.status} />
                          </div>
                        </div>

                        {/* LIVE COUNTDOWN SECTION */}
                        <div className="pt-1">
                          <LiveCountdownTimer
                            targetDate={client.followUpAt}
                            variant="detailed"
                            className="w-full shadow-xs"
                          />
                        </div>

                        {/* Client Notes (if present) */}
                        {client.notes && (
                          <div className="p-2.5 bg-surface-50 rounded-xl border border-surface-100 text-xs text-surface-600 line-clamp-2">
                            <strong className="text-surface-700">Note:</strong> {client.notes}
                          </div>
                        )}

                        {/* Quick Reschedule Inline Panel */}
                        {isRescheduling && (
                          <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-200 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                                <Clock size={14} className="text-brand-600" />
                                Reschedule Follow-Up Date & Time
                              </span>
                              <button
                                onClick={() => setReschedulingClientId(null)}
                                className="text-xs text-surface-400 hover:text-surface-600 p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <EasyTimeSelector
                              value={rescheduleDate || client.followUpAt}
                              onChange={(newDate) => setRescheduleDate(newDate)}
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveReschedule(client)}
                                disabled={isActing}
                                className="btn-sm btn-primary flex-1 text-xs"
                              >
                                {isActing ? 'Saving...' : 'Confirm Reschedule'}
                              </button>
                              <button
                                onClick={() => setReschedulingClientId(null)}
                                className="btn-sm btn-ghost text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Expandable SMS / Message Generator Box */}
                        {isSmsExpanded && (
                          <div className="p-3.5 bg-gradient-to-b from-indigo-50/60 to-surface-50 rounded-xl border border-indigo-100 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                <MessageSquare size={14} className="text-indigo-600" />
                                <span>Follow-Up SMS & Message Composer</span>
                              </div>
                              <button
                                onClick={() => handleCopySms(client)}
                                className="btn-sm bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs gap-1 shadow-xs py-1"
                              >
                                <Copy size={13} />
                                Copy Text
                              </button>
                            </div>

                            <textarea
                              value={currentMessage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomMessages((prev) => ({ ...prev, [client._id]: val }));
                              }}
                              rows={3}
                              className="w-full p-2.5 bg-white rounded-lg border border-indigo-200 text-xs text-surface-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                              placeholder="Type SMS message..."
                            />

                            {/* Direct Action Send Channels */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {smsHref && (
                                <a
                                  href={smsHref}
                                  className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs"
                                  title="Send direct SMS"
                                >
                                  <Phone size={13} />
                                  <span>Send SMS</span>
                                </a>
                              )}

                              {waHref && (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-sm bg-emerald-500 hover:bg-emerald-600 text-white text-xs gap-1.5 shadow-xs"
                                  title="Send via WhatsApp"
                                >
                                  <MessageCircle size={13} />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {messengerHref && (
                                <a
                                  href={messengerHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-sm bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs"
                                  title="Open Facebook / Messenger"
                                >
                                  <MessageSquare size={13} />
                                  <span>Messenger</span>
                                </a>
                              )}

                              {client.email && (
                                <a
                                  href={`mailto:${client.email}?subject=${encodeURIComponent(
                                    `Website follow-up for ${client.businessName}`
                                  )}&body=${encodeURIComponent(currentMessage)}`}
                                  className="btn-sm btn-outline text-xs gap-1.5"
                                  title="Send Email"
                                >
                                  <Mail size={13} />
                                  <span>Email</span>
                                </a>
                              )}

                              <button
                                onClick={() => handleCopySms(client)}
                                className="btn-sm btn-secondary text-xs gap-1 ml-auto"
                              >
                                <Copy size={13} />
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Footer Buttons */}
                      <div className="bg-surface-50 px-4 py-2.5 border-t border-surface-200 flex flex-wrap items-center justify-between gap-2">
                        {/* Left action: SMS Composer Toggle */}
                        <button
                          onClick={() =>
                            setExpandedSmsClientId(isSmsExpanded ? null : client._id)
                          }
                          className={`btn-sm text-xs gap-1.5 transition-all ${
                            isSmsExpanded
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white border border-surface-300 text-surface-700 hover:border-indigo-400 hover:text-indigo-600'
                          }`}
                        >
                          <MessageSquare size={13} />
                          <span>{isSmsExpanded ? 'Hide SMS Composer' : 'Compose SMS'}</span>
                          {isSmsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {/* Right Quick Controls */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Snooze +1d */}
                          <button
                            onClick={() => handleSnooze(client, 1)}
                            disabled={isActing}
                            className="btn-sm bg-white border border-surface-200 hover:bg-surface-100 text-surface-600 text-xs px-2.5 py-1"
                            title="Snooze 1 Day"
                          >
                            +1d
                          </button>

                          {/* Snooze +3d */}
                          <button
                            onClick={() => handleSnooze(client, 3)}
                            disabled={isActing}
                            className="btn-sm bg-white border border-surface-200 hover:bg-surface-100 text-surface-600 text-xs px-2.5 py-1"
                            title="Snooze 3 Days"
                          >
                            +3d
                          </button>

                          {/* Reschedule */}
                          <button
                            onClick={() => {
                              setReschedulingClientId(isRescheduling ? null : client._id);
                              setRescheduleDate(client.followUpAt);
                            }}
                            disabled={isActing}
                            className="btn-sm bg-white border border-surface-200 hover:bg-surface-100 text-surface-600 text-xs px-2.5 py-1"
                            title="Pick exact date/time"
                          >
                            <Clock size={12} />
                          </button>

                          {/* Mark Completed */}
                          <button
                            onClick={() => handleMarkComplete(client)}
                            disabled={isActing}
                            className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 px-3 py-1 font-semibold shadow-xs"
                          >
                            <Check size={13} />
                            <span>Mark Done</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-white px-5 py-3 border-t border-surface-200 flex-shrink-0 flex items-center justify-between text-xs text-surface-500">
            <span>
              Showing {filteredClients.length} of {clients.length} scheduled follow-ups
            </span>
            <button
              onClick={() => {
                onClose();
                navigate('/follow-ups');
              }}
              className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
            >
              <span>Go to Full Follow-Ups Page</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
