import React, { useState } from "react";
import { updateMembershipFee } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SettingsTab() {
  const [newFee, setNewFee] = useState("");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const navigate = useNavigate();

  const handleUpdateFee = async () => {
    if (!newFee || isNaN(newFee)) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setIsUpdatingFee(true);
    try {
      await updateMembershipFee(Number(newFee));
      toast.success("Membership fee updated successfully!");
      setNewFee("");
    } catch (err) {
      toast.error("Failed to update the membership fee.");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  // 🔥 IDENTICAL BUTTON STYLE FOR ALL THREE BUTTONS
  const commonButtonClass = "px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 active:scale-95 text-base whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";

  return (
    <div className="min-h-full  from-indigo-50 via-fuchsia-50 to-orange-50 p-4 sm:p-8 lg:p-10 rounded-3xl font-sans">
      
      <div className="max-w-5xl mx-auto space-y-10 pb-10">
        
      
        {/* Primary Setting: Membership Fee */}
        <div className="bg-white/80 backdrop-blur-md border-t-4 border-t-orange-400 rounded-2xl p-8 sm:p-10 shadow-xl shadow-orange-100/50 hover:bg-white transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            
            {/* Colorful Icon Container */}
            <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner hidden sm:flex">
              <svg className="w-8 h-8 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-2xl font-bold text-gray-900">
                Membership Fee Configuration
              </h3>
              <p className="text-gray-600 mt-2 mb-8 leading-relaxed text-sm sm:text-base">
                Set the default lifetime membership fee displayed to new applicants on the registration portal.
              </p>
              
              <div className="flex flex-col sm:flex-row items-end gap-5 max-w-xl bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">
                    New Fee Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-orange-400 font-bold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-orange-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all duration-200 text-lg font-bold text-gray-900 placeholder-gray-300 shadow-sm"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateFee}
                  disabled={isUpdatingFee}
                  className={`${commonButtonClass} w-full sm:w-auto`}
                >
                  {isUpdatingFee ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Manage Regions Card */}
          <div className="bg-white/80 backdrop-blur-md border-t-4 border-t-emerald-400 rounded-2xl p-8 shadow-xl shadow-emerald-100/50 flex flex-col justify-between hover:bg-white transition-all duration-300 group">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-7 h-7 text-emerald-600 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Region Management
              </h3>
              <p className="text-gray-600 mt-3 mb-10 leading-relaxed text-sm sm:text-base font-medium">
                Add, remove, or update the list of regional zones available to applicants during the registration process.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/manage-regions')}
              className={`${commonButtonClass} w-full`}
            >
              Manage Regions
            </button>
          </div>

          {/* Change Password Card */}
          <div className="bg-white/80 backdrop-blur-md border-t-4 border-t-indigo-400 rounded-2xl p-8 shadow-xl shadow-indigo-100/50 flex flex-col justify-between hover:bg-white transition-all duration-300 group">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-7 h-7 text-indigo-600 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Security Settings
              </h3>
              <p className="text-gray-600 mt-3 mb-10 leading-relaxed text-sm sm:text-base font-medium">
                Update your administrator account password regularly to ensure platform security and prevent unauthorized access.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/change-password')}
              className={`${commonButtonClass} w-full`}
            >
              Change Password
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}