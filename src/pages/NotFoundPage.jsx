import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center border-t-8 border-gray-400">
        
        <h1 className="text-9xl font-extrabold text-gray-200 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          पृष्ठ आढळले नाही <br/>
          <span className="text-xl text-gray-600 font-medium">(Page Not Found)</span>
        </h2>
        
        <p className="text-gray-500 mb-8 mt-4">
          तुम्ही शोधत असलेले पृष्ठ अस्तित्वात नाही किंवा हलवले गेले आहे. 
          <br/>
          <span className="text-sm">(The page you are looking for does not exist or has been moved.)</span>
        </p>

        <Link 
          to="/" 
          className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          मुख्य पृष्ठावर जा (Go to Homepage)
        </Link>
      </div>
    </div>
  );
}