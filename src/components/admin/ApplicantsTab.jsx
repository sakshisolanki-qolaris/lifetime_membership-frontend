import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllApplicants, fetchApplicantById } from "../../services/api";
import toast from "react-hot-toast";
import ApplicantDetailModal from "./ApplicantModal/ApplicantDetailModal";
import useDebounce from "../../hooks/useDebounce";

export default function ApplicantsTab() {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: applicants = [],
    isLoading: loading,
    refetch: loadApplicants,
  } = useQuery({
    queryKey: ["applicants", debouncedSearch],
    queryFn: async () => {
      const result = await fetchAllApplicants(debouncedSearch);
      return result.data?.applicants || result.data || [];
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "डेटा लोड करने में विफल (Failed to load).",
      );
    },
  });

  // --- FRONTEND FILTERING LOGIC ---
  const filteredApplicants = applicants.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.fullName?.toLowerCase().includes(searchLower) ||
      app.mobileNumber?.includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleRowClick = async (app) => {
    setSelectedApplicant(app);
    setLoadingDetails(true);
    try {
      const fullDetails = await fetchApplicantById(app.id);
      setSelectedApplicant(fullDetails.data || fullDetails);
    } catch (error) {
      // Fixed: Handled the exception by logging it for debugging
      console.error("Error loading applicant details:", error);
      toast.error("आवेदक का पूरा विवरण लोड नहीं हो सका।");
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "MEMBER")
      return (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
          आजीवन सदस्य (Official Member)
        </span>
      );
    if (status === "PAYMENT_COMPLETED")
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
          शुल्क प्राप्त (Ready to Promote)
        </span>
      );
    if (status === "PENDING_ADMIN_REVIEW")
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
          एडमिन समीक्षा (Pending Admin)
        </span>
      );
    if (status === "PENDING_PRESIDENT_APPROVAL")
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-200">
          अध्यक्ष अनुमोदन (Pending President)
        </span>
      );
    if (status === "REJECTED_BY_ADMIN")
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">
          एडमिन अस्वीकृत (Admin Rejected)
        </span>
      );
    if (status?.includes("REJECTED"))
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">
          अस्वीकृत (Rejected)
        </span>
      );
    if (status?.includes("PAYMENT_PENDING"))
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">
          भुगतान लंबित (Payment Pending)
        </span>
      );
    if (status?.includes("APPROVED_BY"))
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
          मंजूर (Approved - Interim)
        </span>
      );
    if (status?.includes("PENDING"))
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
          अनुमोदन लंबित (Pending Approval)
        </span>
      );
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
        {status || "UNKNOWN"}
      </span>
    );
  };

  // Fixed: Extracted the nested ternary operation into a clean independent function
  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="p-16 text-center text-indigo-600 font-bold flex flex-col items-center">
          <svg
            className="animate-spin mb-4 h-8 w-8 text-orange-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          डेटा लोड हो रहा है...
        </div>
      );
    }

    if (filteredApplicants.length === 0) {
      return (
        <div className="p-16 text-center text-gray-500 font-medium">
          कोई आवेदन नहीं मिला (No applicants found).
        </div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              आवेदक (Applicant)
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              संपर्क (Contact)
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              आवेदन तिथि (Date)
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              स्थिति (Status)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filteredApplicants.map((app) => (
            <tr
              key={app.id}
              onClick={() => handleRowClick(app)}
              className="hover:bg-indigo-50 transition-colors cursor-pointer group"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                  {app.fullName}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {app.education} • {app.occupation}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-800">
                  {app.mobileNumber}
                </div>
                <div className="text-sm text-gray-500">{app.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                {new Date(app.createdAt).toLocaleDateString("en-IN")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(app.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {/* Search Input UI (Always visible) */}
      <div className="p-4 border-b border-gray-100 bg-white print:hidden">
        {/* Fixed: Added screen-reader label for the input */}
        <label htmlFor="searchApplicants" className="sr-only">
          Search Applicants
        </label>
        <input
          id="searchApplicants"
          type="text"
          placeholder="Search applicants by name, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="overflow-x-auto relative print:hidden">
        {/* Loading overlay for row clicks */}
        {loadingDetails && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {/* Refactored rendering logic */}
        {renderTableContent()}
      </div>

      {selectedApplicant && (
        <ApplicantDetailModal
          selectedApplicant={selectedApplicant}
          setSelectedApplicant={setSelectedApplicant}
          loadingDetails={loadingDetails}
          loadApplicants={loadApplicants}
          getStatusBadge={getStatusBadge}
        />
      )}
    </>
  );
}
