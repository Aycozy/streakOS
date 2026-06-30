import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ session }: { session: any }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
