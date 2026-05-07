import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSearchParams, useLocation } from "react-router-dom";

import { fetchApprovalDetails, submitApproval } from "../services/api";

import toast from "react-hot-toast";

const MINIO_BASE_URL = import.meta.env.VITE_MINIO_URL;

const getFileUrl = (files, fileType) => {
  const fileObj = files?.find((f) => f.fileType === fileType);
  return fileObj ? `${MINIO_BASE_URL}${fileObj.minioUrl}` : null;
};

const ImagePreviewModal = ({ src, onClose }) => {
  // Added global escape key listener for standard modal accessibility behavior
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity">
      {/* 
        Fixed: Replaced the clickable <div> with a native <button> for the backdrop.
        This provides native keyboard accessibility and semantics without violating Sonar rules.
      */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-slate-900/80 backdrop-blur-sm cursor-default focus:outline-none"
        onClick={onClose}
        aria-label="Close full size image preview"
      />

      {/* 
        Fixed: Removed onClick and stopPropagation from this div.
        Since the backdrop is now a sibling positioned absolutely behind this content,
        clicking this div no longer triggers the close action anyway.
      */}
      <div className="relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-red-400 p-2 transition-colors z-50 bg-black/50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Close view"
        >
          <svg
            className="w-8 h-8"
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
        <img
          src={src}
          alt="Document Full Size"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

// Added Prop Validation for ImagePreviewModal
ImagePreviewModal.propTypes = {
  src: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default function ApprovalPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const token = searchParams.get("token");
  const role = location.pathname.includes("president") ? "PRESIDENT" : "MEMBER";

  const [applicant, setApplicant] = useState(null);
  const [isUsed, setIsUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid approval link. Token is missing.");
      setLoading(false);
      return;
    }

    fetchApprovalDetails(token, role)
      .then((res) => {
        if (res.success) {
          setApplicant(res.data.applicant);
          setIsUsed(res.data.isUsed);
        }
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "This link is invalid."),
      )
      .finally(() => setLoading(false));
  }, [token, role]);

  const handleAction = async (action) => {
    const actionText =
      action === "APPROVE" ? "मंजूर (Approve)" : "नाकार (Reject)";

    if (
      !globalThis.confirm(
        `Are you sure you want to ${actionText} this application?`,
      )
    )
      return;

    setActionLoading(true);

    try {
      const result = await submitApproval(role, token, action);
      toast.success(result.message, { duration: 5000 });
      setIsUsed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process action.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-600">
        Loading Application Details...
      </div>
    );

  if (!applicant)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-xl font-bold">
        Invalid or Expired Approval Link
      </div>
    );

  const photoUrl = getFileUrl(applicant.files, "PHOTO");
  const signatureUrl = getFileUrl(applicant.files, "SIGNATURE");
  const aadharFrontUrl = getFileUrl(applicant.files, "AADHAR_FRONT");
  const aadharBackUrl = getFileUrl(applicant.files, "AADHAR_BACK");

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <ImagePreviewModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden border-t-8 border-indigo-600 relative">
        <div className="px-8 py-6 border-b-2 border-indigo-100 flex justify-between items-start bg-indigo-50/30">
          <div>
            <span
              className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${role === "PRESIDENT" ? "bg-purple-200 text-purple-800" : "bg-blue-200 text-blue-800"}`}
            >
              {role} REVIEW
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Application Review
            </h1>

            <p className="text-gray-600 mt-1 font-medium">
              Lifetime Membership Application
            </p>
          </div>

          <button
            type="button"
            className="w-32 h-40 border-4 border-white shadow-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 group relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => photoUrl && setPreviewImage(photoUrl)}
            disabled={!photoUrl}
            aria-label="View Applicant Photo"
          >
            {photoUrl ? (
              <React.Fragment>
                <img
                  src={photoUrl}
                  alt="Applicant"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs drop-shadow-md">
                    View
                  </span>
                </div>
              </React.Fragment>
            ) : (
              <span className="text-gray-400 text-xs text-center px-2">
                No Photo Provided
              </span>
            )}
          </button>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Personal Details Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Full Name
                </p>
                <p className="font-bold text-gray-900 text-lg bg-gray-50 p-2 rounded">
                  {applicant.fullName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Father/Husband Name
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.fatherOrHusbandName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Gender</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.gender || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Date of Birth
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.dateOfBirth}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Blood Group
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.bloodGroup || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Marriage Date
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.marriageDate || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">
              Contact & Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Mobile Number
                </p>
                <p className="font-bold text-gray-900 bg-gray-50 p-2 rounded">
                  {applicant.mobileNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Email Address
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.email}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Current Address
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded leading-relaxed">
                  {applicant.currentAddress}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Permanent Address
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded leading-relaxed">
                  {applicant.permanentAddress}
                </p>
              </div>
            </div>
          </section>

          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">
              From Raipur?
            </p>
            <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
              {applicant.isFromRaipur ? "Yes" : "No"}
            </p>
          </div>
          {applicant.isFromRaipur && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Region</p>
              <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                {applicant.region}
              </p>
            </div>
          )}

          {/* Professional Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">
              Professional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Education
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.education}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Occupation
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.occupation}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Office Address
                </p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                  {applicant.officeAddress || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">
              Attached Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wider">
                  Aadhar Card (Front)
                </p>
                <button
                  type="button"
                  className="w-full h-48 bg-gray-50 rounded-lg border border-gray-300 overflow-hidden flex items-center justify-center p-2 shadow-inner group relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() =>
                    aadharFrontUrl && setPreviewImage(aadharFrontUrl)
                  }
                  disabled={!aadharFrontUrl}
                  aria-label="View Aadhar Card Front Full Size"
                >
                  {aadharFrontUrl ? (
                    <React.Fragment>
                      <img
                        src={aadharFrontUrl}
                        alt="Aadhar Front"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-bold drop-shadow-md flex items-center gap-1">
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
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          View Full Size
                        </span>
                      </div>
                    </React.Fragment>
                  ) : (
                    <span className="text-gray-400 text-sm font-semibold">
                      No Document Uploaded
                    </span>
                  )}
                </button>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wider">
                  Aadhar Card (Back)
                </p>
                <button
                  type="button"
                  className="w-full h-48 bg-gray-50 rounded-lg border border-gray-300 overflow-hidden flex items-center justify-center p-2 shadow-inner group relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() =>
                    aadharBackUrl && setPreviewImage(aadharBackUrl)
                  }
                  disabled={!aadharBackUrl}
                  aria-label="View Aadhar Card Back Full Size"
                >
                  {aadharBackUrl ? (
                    <React.Fragment>
                      <img
                        src={aadharBackUrl}
                        alt="Aadhar Back"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-bold drop-shadow-md flex items-center gap-1">
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
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          View Full Size
                        </span>
                      </div>
                    </React.Fragment>
                  ) : (
                    <span className="text-gray-400 text-sm font-semibold">
                      No Document Uploaded
                    </span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Proposer & Signature Section */}
          <div className="bg-indigo-50/50 p-6 rounded-md border border-indigo-200 flex flex-col sm:flex-row justify-between items-end gap-6 mt-8">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium mb-1">
                Proposed By (अनुमोदक)
              </p>
              <p className="font-bold text-indigo-900 text-xl">
                {applicant.proposer?.name}
              </p>
              <p className="text-xs text-indigo-600 mt-2">
                The applicant has agreed to all terms and conditions of
                Maharashtra Mandal.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <button
                type="button"
                className="w-48 h-20 border-b-2 border-gray-400 bg-white flex items-center justify-center mb-1 overflow-hidden p-1 group relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => signatureUrl && setPreviewImage(signatureUrl)}
                disabled={!signatureUrl}
                aria-label="View Applicant Signature Full Size"
              >
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform origin-bottom"
                  />
                ) : (
                  <span className="text-gray-300 text-xs">No Signature</span>
                )}
              </button>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                Applicant Signature
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          {isUsed ? (
            <div className="bg-orange-100 text-orange-800 p-4 text-center text-lg font-bold rounded-md border border-orange-300">
              हा अर्ज आधीच तपासला गेला आहे. <br />
              <span className="text-sm font-medium text-orange-700">
                (This application has already been processed. You cannot vote
                again.)
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleAction("APPROVE")}
                disabled={actionLoading}
                className="flex-1 flex justify-center items-center bg-green-600 text-white py-4 rounded-md font-extrabold text-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "APPROVE (मंजूर करा)"}
              </button>

              <button
                onClick={() => handleAction("REJECT")}
                disabled={actionLoading}
                className="flex-1 flex justify-center items-center bg-red-600 text-white py-4 rounded-md font-extrabold text-lg shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "REJECT (नाकार करा)"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
