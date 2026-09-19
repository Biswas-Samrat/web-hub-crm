import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import FollowUpsPage from './pages/FollowUpsPage';
import OngoingPage from './pages/OngoingPage';
import DeliveredPage from './pages/DeliveredPage';
import CompletedPage from './pages/CompletedPage';
import CalendarPage from './pages/CalendarPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-surface-500 text-sm">Loading...</p>
    </div>
  </div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="ongoing" element={<OngoingPage />} />
        <Route path="delivered" element={<DeliveredPage />} />
        <Route path="completed" element={<CompletedPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '14px',
              padding: '12px 16px',
              marginBottom: '80px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
