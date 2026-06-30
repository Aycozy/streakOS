import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function Paywall() {
  const navigate = useNavigate();

  const checkoutMutation = useMutation({
    mutationFn: api.createCheckoutSession,
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: any) => {
      alert(`Checkout failed: ${err.message}`);
    }
  });

  const handleUpgrade = () => {
    checkoutMutation.mutate();
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at center, #1e1b4b 0%, var(--bg-color) 100%)' }}>
      <div className="relative glass-panel w-full max-w-md animate-fade-in border-t-4" style={{ borderTopColor: 'var(--accent-primary)' }}>
        
        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          ✕
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 gradient-text">StreakOS Pro</h1>
          <p className="text-lg text-gray-300">Unlock your full potential.</p>
        </div>

        <ul className="flex flex-col gap-md mb-8">
          {[
            'Unlimited habits tracking',
            'Advanced analytics & insights',
            'Custom app icons and colors',
            'Priority support',
          ].map((feature, i) => (
            <li key={i} className="flex items-center gap-sm">
              <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                <Check size={16} />
              </div>
              <span className="font-medium text-gray-200">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="p-4 rounded-xl mb-8 border" style={{ borderColor: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white">Yearly</span>
            <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-bold">SAVE 50%</span>
          </div>
          <div className="text-gray-300">
            <span className="text-2xl font-bold text-white">$29.99</span> / year
          </div>
        </div>

        <button 
          onClick={handleUpgrade} 
          disabled={checkoutMutation.isPending}
          className="btn btn-primary w-full py-4 text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] flex justify-center items-center gap-2"
        >
          {checkoutMutation.isPending ? 'Loading...' : 'Start 7-Day Free Trial'}
        </button>
        <p className="text-xs text-center text-gray-500 mt-4">
          Cancel anytime. Auto-renews after 7 days.
        </p>
      </div>
    </div>
  );
}
