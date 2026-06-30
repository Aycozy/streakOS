import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-label={label}
          >
            <div className={`bottom-nav-icon ${active ? 'active' : ''}`}>
              <Icon size={22} />
            </div>
            <span className={`bottom-nav-label ${active ? 'active' : ''}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
