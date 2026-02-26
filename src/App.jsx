import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ApplicationForm from './pages/ApplicationForm';
import ApprovalPage from './pages/ApprovalPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EditApplication from './pages/EditApplication';
function App() {
  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster position="top-right" /> 
      
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Routes>
          {/* Public Application Form */}
          <Route path="/" element={<ApplicationForm />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/success" element={<SuccessPage />} />
          {/* Dynamic Email Approval Routes */}
          <Route path="/approve/member" element={<ApprovalPage />} />
          <Route path="/approve/president" element={<ApprovalPage />} />
          
          {/* Final Payment Route */}
          <Route path="/payment" element={<PaymentPage />} />

          <Route path="/edit-application/:id" element={<EditApplication />} />

          {/* --- ADMIN SECURE ROUTES --- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;