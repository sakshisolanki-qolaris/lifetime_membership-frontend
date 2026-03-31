import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary'; // ✅ Import the boundary
import ProtectedRoute from './components/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes without refetching
      refetchOnWindowFocus: false, // Don't refetch every time the user clicks the browser tab
    },
  },
});


// 1. Lazy loaded components
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const ApprovalPage = lazy(() => import('./pages/ApprovalPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EditApplication = lazy(() => import('./pages/EditApplication'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// 2. Global Auth Listener
const GlobalAuthListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/admin/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);
  return null;
};

// 3. Page Loader fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

// 4. ✅ Create the Error Fallback UI
// This is what users will see if the app crashes
const ErrorFallbackUI = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-600 mb-6 text-sm bg-gray-100 p-3 rounded overflow-auto text-left">
          {error.message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <GlobalAuthListener />
      <Toaster position="top-right" /> 
      
      <div className="min-h-screen bg-gray-50 text-gray-800">
        {/* ✅ Wrap everything inside the boundary */}
        <ErrorBoundary 
          FallbackComponent={ErrorFallbackUI}
          onReset={() => window.location.href = '/'} // Send them home if they click reload
        >
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
        </ErrorBoundary>
      </div>
    </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;