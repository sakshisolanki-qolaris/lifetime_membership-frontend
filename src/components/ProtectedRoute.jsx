import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {

  const isLoggedIn = localStorage.getItem('adminLoggedIn');

  if (!isLoggedIn) {
  
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}