import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        if (!form.name) { setError('Name is required.'); setLoading(false); return; }
        await register({ name: form.name, email: form.email, password: form.password });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <Globe size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Web Hub CRM</h1>
          <p className="text-brand-300 text-sm mt-1">Personal freelancer CRM</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-6">
          {/* Mode toggle */}
          <div className="flex mb-6 bg-surface-100 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  className="input"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-lg btn-primary w-full"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {/* Demo hint */}
          {mode === 'login' && (
            <p className="text-center text-xs text-surface-400 mt-4">
              Demo: <span className="font-medium">admin@webhub.com</span> / <span className="font-medium">Admin123!</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
