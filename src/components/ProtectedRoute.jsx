import React from 'react';
import { Navigate } from 'react-router-dom';

// Helper function to decode a JWT and check if it is expired
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // JWTs are split into 3 parts separated by dots. The payload is the middle part.
    const base64Url = token.split('.')[1];
    
    // If the token doesn't have 3 parts, it's a fake/invalid token
    if (!base64Url) return false; 
    
    // Decode the base64 payload into a JSON string
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse the JSON to get the expiration time (exp)
    const { exp } = JSON.parse(jsonPayload);
    
    // If the token has an expiration time, verify it is in the future
    if (exp) {
      const currentTime = Date.now() / 1000; // Convert to seconds
      return exp > currentTime;
    }
    
    return true; // Token is valid format and has no expiration
  } catch (error) {
    console.error("Invalid token format detected.");
    return false; // If decoding fails, the token is junk
  }
};

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');

  // Check if token exists AND is actually valid/not expired
  if (!token || !isTokenValid(token)) {
    
    // If there was a token but it was expired/fake, clean it up
    if (token) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    
    // Kick them to the login page immediately
    return <Navigate to="/admin/login" replace />;
  }

  // Allow them in if token is valid
  return children;
}