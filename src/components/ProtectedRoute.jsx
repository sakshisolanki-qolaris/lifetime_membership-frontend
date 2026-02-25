import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // Kick them to the login page if they don't have a token
    return <Navigate to="/admin/login" replace />;
  }

  // Allow them in if token exists
  return children;
}