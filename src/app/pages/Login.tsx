import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useAuth } from '@/app/contexts/AuthContext';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Lock, Mail, Loader2, BarChart3, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { darkMode } = useDashboard();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      login(data.access_token);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-black text-white' : 'bg-gray-50'}`}>
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-indigo-600' : 'bg-blue-400'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-purple-600' : 'bg-indigo-400'}`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative w-full max-w-[450px] p-8 rounded-2xl border shadow-2xl backdrop-blur-sm ${
          darkMode 
            ? 'bg-gray-900/50 border-white/10 shadow-indigo-500/10' 
            : 'bg-white/80 border-gray-200 shadow-gray-200'
        }`}
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-4 ${
              darkMode ? 'shadow-lg shadow-indigo-500/50' : 'shadow-lg shadow-blue-500/30'
            }`}
          >
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-center">FQC DASHBOARD</h1>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Please sign in to access the QC insights
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <Mail size={18} />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 h-11 ${darkMode ? 'bg-gray-800/50 border-white/10 focus:ring-indigo-500' : 'bg-white border-gray-300'}`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <Lock size={18} />
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 h-11 ${darkMode ? 'bg-gray-800/50 border-white/10 focus:ring-indigo-500' : 'bg-white border-gray-300'}`}
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-lg flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <Button 
            type="submit" 
            className={`w-full h-11 text-base font-semibold transition-all duration-300 ${
              darkMode 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={14} />
          <span>Need access? Contact FQC team</span>
        </div>
      </motion.div>
    </div>
  );
};
