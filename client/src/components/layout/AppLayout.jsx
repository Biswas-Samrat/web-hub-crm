import { Outlet } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';
import DesktopSidebar from './DesktopSidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-safe lg:pb-6">
          <div className="max-w-4xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
