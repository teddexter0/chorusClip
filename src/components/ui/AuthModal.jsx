'use client';
import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { signInUser, signUpUser, sendPasswordResetEmail } = await import('@/lib/firebase');
      
      if (mode === 'signin') {
        await signInUser(email, password);
        onSuccess?.('✅ Welcome back!');
        onClose();
      } else if (mode === 'signup') {
        await signUpUser(email, password, displayName);
        onSuccess?.('🎉 Account created! Welcome!');
        onClose();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(email);
        onSuccess?.('✉️ Check your inbox for reset link!');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500 my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-purple-300 transition">
          <X size={32} />
        </button>

        <h2 className="text-4xl font-black mb-6">
          {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-base font-bold text-purple-300 mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-4 text-purple-400" size={22} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="john_doe"
                  className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-base font-bold text-purple-300 mb-2">Strathmore Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-4 text-purple-400" size={22} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@strathmore.edu"
                className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-base font-bold text-purple-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 text-purple-400" size={22} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-4 text-base">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          {mode !== 'reset' && (
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-purple-300 hover:text-purple-200 text-base font-semibold"
            >
              {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          )}
          <button
            onClick={() => setMode(mode === 'reset' ? 'signin' : 'reset')}
            className="text-purple-400 hover:text-purple-300 text-base"
          >
            {mode === 'reset' ? '← Back to Sign In' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    </div>
  );
}