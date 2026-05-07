import React from "react";
import PropTypes from "prop-types";

export const AdminReviewPanel = ({ handleAdminReview, isReviewing }) => (
  <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 print:hidden shadow-inner">
    <h3 className="text-lg font-bold text-blue-900 mb-3">
      एडमिन समीक्षा (Admin Review)
    </h3>
    <p className="text-sm text-blue-800 mb-4">
      Verify documents by clicking them to view side-by-side. Fix typos using
      the <b>Edit</b> button above, or reject the form for major corrections.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={() => handleAdminReview("APPROVE")}
        disabled={isReviewing}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold disabled:opacity-50 shadow"
      >
        Approve & Forward to President
      </button>
      <button
        onClick={() => handleAdminReview("REJECT")}
        disabled={isReviewing}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-bold disabled:opacity-50 shadow"
      >
        Reject & Ask for Corrections
      </button>
    </div>
  </div>
);

AdminReviewPanel.propTypes = {
  handleAdminReview: PropTypes.func.isRequired,
  isReviewing: PropTypes.bool.isRequired,
};

export const PromotePanel = ({
  registrationNumber,
  setRegistrationNumber,
  handlePromote,
  isPromoting,
}) => (
  <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 print:hidden shadow-inner">
    <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      सदस्य म्हणून बढती द्या (Promote to Official Member)
    </h3>
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="flex-1 w-full">
        <label
          htmlFor="assign_reg_no"
          className="block text-sm font-bold text-green-800 mb-1"
        >
          पंजीकरण संख्या (Assign Registration Number) *
        </label>
        <input
          id="assign_reg_no"
          type="text"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          className="w-full px-4 py-2 border border-green-300 rounded-md focus:ring-green-500 bg-white shadow-sm"
          placeholder="Ex: MM-2026-001"
        />
      </div>
      <button
        onClick={handlePromote}
        disabled={isPromoting}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md font-bold transition-colors shadow-sm disabled:opacity-50"
      >
        {isPromoting ? "प्रतीक्षा करा..." : "Promote Member"}
      </button>
    </div>
  </div>
);

PromotePanel.propTypes = {
  registrationNumber: PropTypes.string.isRequired,
  setRegistrationNumber: PropTypes.func.isRequired,
  handlePromote: PropTypes.func.isRequired,
  isPromoting: PropTypes.bool.isRequired,
};
