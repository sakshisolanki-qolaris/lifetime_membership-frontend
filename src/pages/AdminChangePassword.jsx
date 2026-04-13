import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changeAdminPassword } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('नया पासवर्ड मेल नहीं खाता (New passwords do not match)');
      return;
    }

    setLoading(true);
    try {
      await changeAdminPassword(formData.currentPassword, formData.newPassword);
      toast.success('पासवर्ड सफलतापूर्वक बदल दिया गया! (Password updated!)');
      navigate('/admin/dashboard'); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'पासवर्ड बदलने में विफल (Failed to change password).');
    } finally {
      setLoading(false);
    }
  };
  const commonButtonClass = "px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 active:scale-95 text-base whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Back Button */}
      <div className="max-w-md w-full mb-4">
        <Link 
          to="/admin/dashboard" 
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          डैशबोर्ड पर वापस जाएं (Back to Dashboard)
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-gray-800">
        <div className="px-8 pt-8 pb-6 bg-white border-b border-gray-50">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            पासवर्ड बदलें
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Change your account password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              वर्तमान पासवर्ड (Current Password)
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition-colors outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              नया पासवर्ड (New Password)
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition-colors outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              नए पासवर्ड की पुष्टि करें (Confirm Password)
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition-colors outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
  type="submit"
  disabled={loading}
  className={`${commonButtonClass} w-full ${
    loading 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-gray-900 hover:bg-black hover:shadow-lg'
  }`}
>
            {loading ? 'अपडेट हो रहा है...' : 'पासवर्ड सुरक्षित करें (Save Password)'}
          </button>
        </form>
      </div>
    </div>
  );
}