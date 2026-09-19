import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddClientModal from '../clients/AddClientModal';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/clients': 'All Clients',
  '/follow-ups': 'Follow-Ups',
  '/ongoing': 'Ongoing Projects',
  '/delivered': 'Delivered',
  '/completed': 'Completed',
  '/calendar': 'Calendar',
};

export default function TopBar() {
  const location = useLocation();
  const [showAddClient, setShowAddClient] = useState(false);

  const isDetailPage = location.pathname.startsWith('/clients/') && location.pathname !== '/clients';
  const title = isDetailPage ? 'Client Detail' : (PAGE_TITLES[location.pathname] || 'Web Hub CRM');

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-surface-200 lg:px-6 flex-shrink-0">
        <h1 className="page-title">{title}</h1>
        <button
          onClick={() => setShowAddClient(true)}
          className="btn-md btn-primary rounded-xl gap-1.5"
          id="add-client-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Client</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => setShowAddClient(false)}
        />
      )}
    </>
  );
}
