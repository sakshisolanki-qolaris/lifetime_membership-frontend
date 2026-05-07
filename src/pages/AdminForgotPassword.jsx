import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotAdminPassword, resetAdminPassword } from "../services/api";
import toast from "react-hot-toast";

export default function AdminForgotPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotAdminPassword(formData.email);
      toast.success("OTP sent to the associated email! (OTP भेजा गया)");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetAdminPassword(
        formData.email,
        formData.otp,
        formData.newPassword,
      );
      toast.success(
        "पासवर्ड सफलतापूर्वक बदल दिया गया! (Password reset successful!)",
      );
      navigate("/admin/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-orange-500">
        <div className="px-8 pt-10 pb-6 text-center bg-white border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            पासवर्ड रीसेट (Reset Password)
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {step === 1
              ? "Enter your registered email to receive an OTP"
              : "Enter the OTP and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form
            onSubmit={handleRequestOTP}
            className="p-8 space-y-6 bg-gray-50/50"
          >
            <div>
              {/* Fixed: Added htmlFor to associate label with input */}
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                पंजीकृत ईमेल (Registered Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </span>
                <input
                  id="email" /* Fixed: Added matching id */
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm outline-none"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md ${
                loading
                  ? "bg-orange-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg"
              }`}
            >
              {loading ? "प्रतीक्षा करें..." : "OTP प्राप्त करें (Get OTP)"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleResetPassword}
            className="p-8 space-y-6 bg-gray-50/50"
          >
            <div>
              {/* Fixed: Added htmlFor to associate label with input */}
              <label
                htmlFor="otp"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                OTP
              </label>
              <input
                id="otp" /* Fixed: Added matching id */
                type="text"
                name="otp"
                required
                value={formData.otp}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="6-digit OTP"
              />
            </div>
            <div>
              {/* Fixed: Added htmlFor to associate label with input */}
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                नया पासवर्ड (New Password)
              </label>
              <input
                id="newPassword" /* Fixed: Added matching id */
                type="password"
                name="newPassword"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md ${
                loading
                  ? "bg-orange-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg"
              }`}
            >
              {loading
                ? "अपडेट हो रहा है..."
                : "पासवर्ड बदलें (Reset Password)"}
            </button>
          </form>
        )}

        <div className="pb-6 text-center bg-gray-50/50">
          <Link
            to="/admin/login"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            लॉगिन पर वापस जाएं (Back to Login)
          </Link>
        </div>
      </div>
    </div>
  );
}
