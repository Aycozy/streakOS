import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel w-full max-w-md animate-fade-in text-center">
        <h1 className="gradient-text mb-2">StreakOS</h1>
        <p className="mb-8">Your ultimate productivity habit tracker.</p>

        <form onSubmit={handleLogin} className="mb-6">
          <div className="input-group">
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending link...' : 'Continue with Email'}
          </button>
        </form>

        <div className="flex items-center gap-sm mb-6">
          <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }}></div>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>or</span>
          <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }}></div>
        </div>

        <div className="flex flex-col gap-sm">
          <button onClick={() => handleOAuthLogin('google')} className="btn btn-secondary btn-block">
            Continue with Google
          </button>
          <button onClick={() => handleOAuthLogin('apple')} className="btn btn-secondary btn-block">
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
