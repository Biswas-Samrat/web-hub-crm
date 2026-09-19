import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, Download, Upload, Users, RotateCcw } from 'lucide-react';
import { getClients, exportCSV, importCSV } from '../api/clients';
import { getDashboardStats } from '../api/dashboard';
import ClientCard from '../components/clients/ClientCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { CLIENT_STATUSES } from '../utils/statusConfig';
import toast from 'react-hot-toast';

const STAT_FILTERS = [
  { id: 'all', label: 'Total Leads', filter: '', status: '', key: 'totalLeads', dot: 'bg-surface-400' },
  { id: 'proposals', label: 'Proposals Sent', filter: '', status: 'Proposal Sent', key: 'proposalsSent', dot: 'bg-blue-500' },
  { id: 'positive', label: 'Positive Replies', filter: 'positive_replies', status: '', key: 'positiveReplies', dot: 'bg-emerald-500' },
  { id: 'today', label: 'Follow-Ups Today', filter: 'follow_up_due', status: '', key: 'followUpsToday', dot: 'bg-orange-500' },
  { id: 'overdue', label: 'Overdue', filter: 'overdue', status: '', key: 'overdueFollowUps', dot: 'bg-red-500' },
  { id: 'demo', label: 'Demos Sent', filter: 'demo', status: '', key: 'demosSent', dot: 'bg-purple-500' },
  { id: 'ongoing', label: 'Ongoing Projects', filter: 'ongoing', status: '', key: 'ongoingProjects', dot: 'bg-brand-600' },
  { id: 'delivered', label: 'Delivered', filter: 'delivered', status: '', key: 'deliveredProjects', dot: 'bg-cyan-500' },
  { id: 'completed', label: 'Completed', filter: 'completed', status: '', key: 'completedProjects', dot: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost Leads', filter: 'lost', status: '', key: 'lostLeads', dot: 'bg-gray-400' },
];

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimer = useRef(null);

  // Sync state when URL query params change
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const statusParam = searchParams.get('status');
    if (filterParam !== null) {
      setActiveFilter(filterParam);
      setStatus('');
    } else if (statusParam !== null) {
      setStatus(statusParam);
      setActiveFilter('');
    }
  }, [searchParams]);

  // Load stats counts for the mixed grid
  const loadStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data.stats);
    } catch {
      // ignore
    }
  }, []);

  const loadClients = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) setPage(1);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        sortBy: 'followUpAt',
        sortOrder: 'asc',
      };
      if (search) params.search = search;
      if (activeFilter) params.filter = activeFilter;
      if (status) params.status = status;

      const res = await getClients(params);
      if (reset || currentPage === 1) {
        setClients(res.data.clients);
      } else {
        setClients(prev => [...prev, ...res.data.clients]);
      }
      setPagination(res.data.pagination);
    } catch {
      toast.error('Unable to load clients.');
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, status, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadClients(true);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, activeFilter, status]);

  const handleSelectFilter = (item) => {
    if (item.status) {
      setStatus(item.status);
      setActiveFilter('');
      setSearchParams({ status: item.status });
    } else {
      setActiveFilter(item.filter);
      setStatus('');
      if (item.filter) {
        setSearchParams({ filter: item.filter });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webhub-crm-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch {
      toast.error('Export failed.');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await importCSV(text);
      toast.success(res.data.message);
      loadClients(true);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.');
    }
    e.target.value = '';
  };

  const handleClientUpdated = () => {
    loadClients(true);
    loadStats();
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 pr-9"
            placeholder="Search clients by name, notes..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-md btn-outline px-3 ${showFilters ? 'border-brand-500 text-brand-600' : ''}`}
          title="Filter by status"
        >
          <SlidersHorizontal size={16} />
        </button>
        <button onClick={handleExport} className="btn-md btn-outline px-3" title="Export CSV">
          <Download size={16} />
        </button>
        <label className="btn-md btn-outline px-3 cursor-pointer" title="Import CSV">
          <Upload size={16} />
          <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {/* Mixed Grid Filter Section on Mobile (2 cols) & Tablet/Desktop (3-5 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STAT_FILTERS.map((item) => {
          const isSelected = item.status
            ? status === item.status
            : activeFilter === item.filter && !status;
          const count = stats ? stats[item.key] : 0;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectFilter(item)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-500/20'
                  : 'bg-white hover:bg-surface-50 border-surface-200'
              }`}
            >
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : item.dot}`} />
                  <p className={`text-xs font-medium leading-tight truncate ${isSelected ? 'text-white font-semibold' : 'text-surface-800'}`}>
                    {item.label}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-surface-100 text-surface-700'
                }`}
              >
                {count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced status selector dropdown */}
      {showFilters && (
        <div className="card p-4 space-y-3 animate-slide-down">
          <div>
            <label className="label text-xs">Specific Client Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setActiveFilter('');
                if (e.target.value) {
                  setSearchParams({ status: e.target.value });
                } else {
                  setSearchParams({});
                }
              }}
              className="select"
            >
              <option value="">— All Specific Statuses —</option>
              {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(status || activeFilter) && (
            <button
              onClick={() => {
                setStatus('');
                setActiveFilter('');
                setSearchParams({});
              }}
              className="btn-sm btn-ghost text-surface-500 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Results count indicator */}
      {pagination && (
        <div className="flex items-center justify-between px-0.5 text-xs text-surface-400">
          <p>
            Showing {clients.length} of {pagination.total} client{pagination.total !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
          {(activeFilter || status || search) && (
            <button
              onClick={() => {
                setActiveFilter('');
                setStatus('');
                setSearch('');
                setSearchParams({});
              }}
              className="text-brand-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Client list */}
      {loading && clients.length === 0 ? (
        <LoadingState message="Loading clients..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={
            search
              ? `No results for "${search}"`
              : activeFilter || status
              ? 'No clients found matching this filter.'
              : 'Add your first client to get started.'
          }
        />
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <ClientCard
              key={client._id}
              client={client}
              onUpdate={handleClientUpdated}
            />
          ))}

          {/* Load more button */}
          {pagination && page < pagination.pages && (
            <button
              onClick={() => { setPage(p => p + 1); loadClients(false); }}
              className="btn-md btn-outline w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : `Load More (${pagination.total - clients.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
