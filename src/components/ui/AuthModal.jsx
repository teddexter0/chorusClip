'use client';
import { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle } from 'lucide-react';

const AUTH_ERRORS = {
  'auth/wrong-password': 'Wrong password. Try again or reset your password.',
  'auth/invalid-credential': 'Wrong password. Try again or reset your password.',
  'auth/user-not-found': "No account with this email — sign up instead!",
  'auth/email-already-in-use': 'Email already registered. Sign in instead!',
  'auth/weak-password': 'Password too weak — use at least 6 characters.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection.',
};

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSent(false);

    try {
      const { signInUser, signUpUser, sendPasswordResetEmail } = await import('../../lib/firebase');

      if (mode === 'signin') {
        await signInUser(email, password);
        onSuccess?.('Welcome back!');
        onClose();
      } else if (mode === 'signup') {
        await signUpUser(email, password, displayName);
        onSuccess?.('Account created! Welcome!');
        onClose();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(email);
        setResetSent(true);
      }
    } catch (err) {
      console.error('Auth error:', err);
      const friendly = AUTH_ERRORS[err.code] || err.message || 'Something went wrong!';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-purple-500 my-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-purple-300 transition"
          aria-label="Close"
        >
          <X size={28} />
        </button>

        <h2 className="text-3xl sm:text-4xl font-black mb-2">
          {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-purple-400 text-sm mb-6">
          {mode === 'signin' && 'Sign in with your Strathmore email'}
          {mode === 'signup' && 'Join ChorusClip with your Strathmore email'}
          {mode === 'reset' && "We'll send a link to your email"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="john_doe"
                  className="w-full pl-11 pr-4 py-3.5 text-base bg-purple-950 bg-opacity-60 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-purple-300 mb-2">Strathmore Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@strathmore.edu"
                className="w-full pl-11 pr-4 py-3.5 text-base bg-purple-950 bg-opacity-60 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-500"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 text-base bg-purple-950 bg-opacity-60 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-500"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950 bg-opacity-70 border border-red-500 rounded-xl p-3 text-sm text-red-200 leading-relaxed">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="bg-green-950 bg-opacity-80 border border-green-500 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle size={22} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-bold text-sm">Reset email sent!</p>
                <p className="text-green-400 text-xs mt-1">
                  Check your inbox (and spam folder) at <strong>{email}</strong> for a password reset link.
                  It may take a minute to arrive.
                </p>
              </div>
            </div>
          )}

          {!resetSent && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50 mt-2"
            >
              {loading
                ? 'Sending...'
                : mode === 'reset'
                ? 'Send Reset Link'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </button>
          )}

          {resetSent && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setResetSent(false); setError(''); }}
              className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition mt-2"
            >
              Back to Sign In
            </button>
          )}
        </form>

        <div className="mt-5 text-center space-y-3 border-t border-purple-700 pt-5">
          {mode !== 'reset' && (
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="block w-full text-purple-300 hover:text-purple-200 text-sm font-semibold transition"
            >
              {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          )}
          <button
            onClick={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setError(''); }}
            className="block w-full text-purple-400 hover:text-purple-300 text-sm transition"
          >
            {mode === 'reset' ? '← Back to Sign In' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    </div>
  );
}
