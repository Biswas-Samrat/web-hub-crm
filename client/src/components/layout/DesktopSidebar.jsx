import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bell, Briefcase, MoreHorizontal, LogOut,
  ChevronDown, ChevronRight, Clock, CheckCircle2, Globe
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/clients', icon: Users, label: 'All Clients' },
  { to: '/follow-ups', icon: Bell, label: 'Follow-Ups' },
  {
    label: 'Projects',
    icon: Briefcase,
    children: [
      { to: '/ongoing', label: 'Ongoing', icon: Briefcase },
      { to: '/delivered', label: 'Delivered', icon: Globe },
      { to: '/completed', label: 'Completed', icon: CheckCircle2 },
    ],
  },
  { to: '/calendar', icon: Clock, label: 'Calendar' },
];

export default function DesktopSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-surface-200 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-surface-900 text-sm leading-none">Web Hub</p>
            <p className="text-xs text-surface-400 leading-none mt-0.5">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                >
                  <item.icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {projectsOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                          }`
                        }
                      >
                        <child.icon size={16} />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-surface-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
            <p className="text-xs text-surface-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
