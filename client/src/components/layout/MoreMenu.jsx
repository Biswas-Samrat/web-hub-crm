import { useNavigate } from 'react-router-dom';
import { Globe, CheckCircle2, Clock, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { to: '/delivered', icon: Globe, label: 'Delivered' },
  { to: '/completed', icon: CheckCircle2, label: 'Completed' },
  { to: '/calendar', icon: Clock, label: 'Calendar' },
];

export default function MoreMenu({ onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNav = (to) => {
    navigate(to);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p className="font-semibold text-surface-900">{user?.name}</p>
            <p className="text-xs text-surface-400">{user?.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-100">
            <X size={20} className="text-surface-500" />
          </button>
        </div>
        <div className="px-2 py-2 border-t border-surface-100">
          {menuItems.map((item) => (
            <button
              key={item.to}
              onClick={() => handleNav(item.to)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-surface-50 text-surface-700 transition-colors"
            >
              <item.icon size={20} className="text-surface-500" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
        <div className="h-4" />
      </motion.div>
    </AnimatePresence>
  );
}
