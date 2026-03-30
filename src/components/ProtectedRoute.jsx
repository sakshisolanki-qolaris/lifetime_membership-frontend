import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // Since the actual JWT is securely hidden in an httpOnly cookie, 
  // we check a simple UI flag to see if the user has logged in.
  const isLoggedIn = localStorage.getItem('adminLoggedIn');

  if (!isLoggedIn) {
    // If there's no login flag, kick them to the login page immediately
    return <Navigate to="/admin/login" replace />;
  }

  // Allow them to view the protected route. 
  // Note: If their httpOnly cookie is actually expired/invalid on the backend, 
  // their first API request will fail with a 401 Unauthorized. 
  // The Axios interceptor in api.js will then handle logging them out.
  return children;
}