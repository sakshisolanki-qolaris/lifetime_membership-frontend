import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// 1. Replace static imports with lazy loading
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const ApprovalPage = lazy(() => import('./pages/ApprovalPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EditApplication = lazy(() => import('./pages/EditApplication'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// 2. Create a simple loading fallback to show while the chunk is downloading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" /> 
      
      <div className="min-h-screen bg-gray-50 text-gray-800">
        {/* 3. Wrap all Routes inside Suspense */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<ApplicationForm />} />
            <Route path="/apply" element={<ApplicationForm />} />
            <Route path="/success" element={<SuccessPage />} />
            
            <Route path="/approve/member" element={<ApprovalPage />} />
            <Route path="/approve/president" element={<ApprovalPage />} />
            
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/recheck-application/:applicant_id" element={<PaymentPage />} />
            <Route path="/edit-application/:id" element={<EditApplication />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
           <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;