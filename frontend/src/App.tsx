import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { initReminders } from './lib/notifications';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Paywall from './pages/Paywall';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize daily reminder if previously set up
  useEffect(() => { initReminders(); }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute session={session} />}>
          <Route path="/onboarding" element={<><Onboarding /><BottomNav /></>} />
          <Route path="/paywall" element={<><Paywall /><BottomNav /></>} />
          <Route path="/dashboard" element={<><Dashboard /><BottomNav /></>} />
          <Route path="/analytics" element={<><Analytics /><BottomNav /></>} />
          <Route path="/settings" element={<><Settings /><BottomNav /></>} />
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
