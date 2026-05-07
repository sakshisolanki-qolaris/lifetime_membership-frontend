import React from "react";
import PropTypes from "prop-types";

export default function MemberDetailModal({ selectedMember, onClose }) {
  if (!selectedMember) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-indigo-600 relative flex flex-col max-h-[90vh]">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              सदस्य विवरण (Member Details)
            </h2>
            <p className="text-sm text-indigo-600 font-semibold mt-1">
              ID: {selectedMember.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"
            title="Close"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body Section */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <DetailItem label="नाम (Name)" value={selectedMember.name} />
            <DetailItem label="ई-मेल (Email)" value={selectedMember.email} />
            <DetailItem
              label="मोबाईल (Mobile Number)"
              value={selectedMember.mobileNumber}
            />
            <DetailItem
              label="जन्म तिथि (Date of Birth)"
              value={selectedMember.dateOfBirth}
            />
            <DetailItem
              label="रक्त गट (Blood Group)"
              value={selectedMember.bloodGroup}
            />
            <DetailItem
              label="भूमिका (Role)"
              value={
                selectedMember.role === "PRESIDENT"
                  ? "अध्यक्ष (President)"
                  : "सदस्य (Member)"
              }
            />

            <div className="md:col-span-2">
              <DetailItem
                label="वर्तमान पता (Current Address)"
                value={selectedMember.currentAddress}
              />
            </div>
            <div className="md:col-span-2">
              <DetailItem
                label="स्थाई पता (Permanent Address)"
                value={selectedMember.permanentAddress}
              />
            </div>

            <div className="md:col-span-2 mt-4 flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="font-bold text-gray-700">स्थिति (Status):</span>
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold ${selectedMember.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {selectedMember.isActive
                  ? "सक्रिय (Active)"
                  : "निष्क्रिय (Inactive)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MemberDetailModal.propTypes = {
  selectedMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    mobileNumber: PropTypes.string,
    dateOfBirth: PropTypes.string,
    bloodGroup: PropTypes.string,
    role: PropTypes.string,
    currentAddress: PropTypes.string,
    permanentAddress: PropTypes.string,
    isActive: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wide">
      {label}
    </p>
    <p className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
      {value || "N/A"}
    </p>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
