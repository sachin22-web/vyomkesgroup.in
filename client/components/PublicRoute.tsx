import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PublicRoute() {
  const { user } = useAuth();

  if (user) {
    // User is authenticated, redirect to the app dashboard
    return <Navigate to="/app" replace />;
  }

  // User is not authenticated, render the public route content
  return <Outlet />;
}