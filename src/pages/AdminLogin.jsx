import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await adminLogin(formData.phone, formData.password);
      
      // ✅ Token extraction fixed
      localStorage.setItem('adminToken', result.data.token);
      toast.success('लॉगिन सफल रहा! (Login Successful!)');
      navigate('/admin/dashboard');

    } catch (error) {
      toast.error(error.response?.data?.message || 'लॉगिन विफल (Login failed).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-orange-500">
        
        {/* Header Section */}
        <div className="px-8 pt-10 pb-6 text-center bg-white border-b border-gray-100">
          <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            {/* You can replace this SVG with the actual Mandal Logo */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            महाराष्ट्र मंडळ, रायपूर
          </h1>
          <h2 className="text-sm font-bold text-indigo-600 mt-2 uppercase tracking-wider">
            आजीवन सदस्यता पोर्टल <br/> (Lifetime Membership Portal)
          </h2>
          <p className="text-sm text-gray-500 mt-2">व्यवस्थापक लॉगिन (Admin Access)</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-gray-50/50">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              पंजीकृत मोबाइल नंबर (Registered Phone)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                +91
              </span>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm outline-none"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              पासवर्ड (Password)
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md ${
              loading 
                ? 'bg-orange-400 cursor-not-allowed' 
                : 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                प्रमाणित किया जा रहा है...
              </span>
            ) : (
              'सुरक्षित लॉगिन (Secure Login)'
            )}
          </button>
        </form>
        
      </div>
    </div>
  );
}