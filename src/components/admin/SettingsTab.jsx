import React, { useState } from "react";
import { updateMembershipFee } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SettingsTab() {
  const [newFee, setNewFee] = useState("");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const navigate = useNavigate();

  const handleUpdateFee = async () => {
    if (!newFee || Number.isNaN(Number(newFee))) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsUpdatingFee(true);

    try {
      await updateMembershipFee(Number(newFee));
      toast.success("Membership fee updated successfully!");
      setNewFee("");
    } catch (err) {
      console.error("Error updating fee:", err);
      toast.error("Failed to update the membership fee.");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Platform Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage membership fees, regional zones, and admin security.
          </p>
        </div>

        {/* Primary Setting: Membership Fee */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-lg font-bold text-gray-900">
                Membership Fee Configuration
              </h3>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                Set the default lifetime membership fee displayed to new
                applicants on the registration portal.
              </p>

              <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
                <div className="flex-1 w-full">
                  <label
                    htmlFor="newFee"
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                  >
                    New Fee Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                      ₹
                    </span>
                    <input
                      id="newFee"
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-gray-900 shadow-sm"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateFee}
                  disabled={isUpdatingFee}
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isUpdatingFee ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manage Regions Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Region Management
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Add, remove, or update the list of regional zones available to
                  applicants during the registration process.
                </p>
              </div>
            </div>
            {/* mt-auto pushes the button to the very bottom, keeping the cards perfectly even */}
            <div className="mt-auto">
              <button
                onClick={() => navigate("/admin/manage-regions")}
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-lg transition-colors shadow-sm"
              >
                Manage Regions
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Security Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Update your administrator account password regularly to ensure
                  platform security and prevent unauthorized access.
                </p>
              </div>
            </div>
            {/* mt-auto pushes the button to the very bottom, keeping the cards perfectly even */}
            <div className="mt-auto">
              <button
                onClick={() => navigate("/admin/change-password")}
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-lg transition-colors shadow-sm"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
