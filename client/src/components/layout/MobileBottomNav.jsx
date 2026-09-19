import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, Briefcase, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import MoreMenu from './MoreMenu';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/follow-ups', icon: Bell, label: 'Follow-Ups' },
  { to: '/ongoing', icon: Briefcase, label: 'Projects' },
];

export default function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 z-30"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-surface-400 hover:text-surface-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-surface-400 hover:text-surface-600 transition-colors"
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
    </>
  );
}
