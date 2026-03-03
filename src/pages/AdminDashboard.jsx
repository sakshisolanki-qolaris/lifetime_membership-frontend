import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllApplicants,
  fetchApplicantById,
  promoteApplicant,
  fetchAllMembers,
  toggleMemberStatus,
  downloadIdCard,
  updateMembershipFee,
  reviewApplicantByAdmin,
  editApplicantByAdmin,
} from "../services/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("applicants");

  const [applicants, setApplicants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  const [newFee, setNewFee] = useState("");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Edit & Review States
  const [isReviewing, setIsReviewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // NEW: Side-by-Side Image Viewer State
  const [previewImage, setPreviewImage] = useState(null);
const [isZoomed, setIsZoomed] = useState(false); // <-- ADD THIS

  // <-- ADD THIS: Automatically reset zoom when switching images
  useEffect(() => {
    setIsZoomed(false);
  }, [previewImage]);
  const navigate = useNavigate();
  const MINIO_BASE_URL = import.meta.env.VITE_MINIO_URL;

  useEffect(() => {
    if (activeTab === "applicants") loadApplicants();
    else if (activeTab === "members") loadMembers();
  }, [activeTab]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const result = await fetchAllApplicants();
      setApplicants(result.data || result || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const result = await fetchAllMembers();
      setMembers(result.data || result || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error) => {
    toast.error(
      error.response?.data?.message ||
        "डेटा लोड करने में विफल (Failed to load).",
    );
    if (error.response?.status === 401 || error.response?.status === 403)
      handleLogout();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const handleRowClick = async (app) => {
    setSelectedApplicant(app);
    setPreviewImage(null); // Reset preview on new selection
    setIsEditing(false);
    setLoadingDetails(true);
    try {
      const fullDetails = await fetchApplicantById(app.id);
      setSelectedApplicant(fullDetails.data || fullDetails);
    } catch (error) {
      toast.error("आवेदक का पूरा विवरण लोड नहीं हो सका।");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAdminReview = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} this application?`))
      return;
    setIsReviewing(true);
    try {
      const result = await reviewApplicantByAdmin(selectedApplicant.id, action);
      toast.success(result.message || `Application ${action}ED successfully!`);
      setSelectedApplicant(null);
      setPreviewImage(null);
      loadApplicants();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process review.");
    } finally {
      setIsReviewing(false);
    }
  };

  const startEditing = () => {
    setEditData({
      full_name: selectedApplicant.full_name || "",
      father_or_husband_name: selectedApplicant.father_or_husband_name || "",
      gender: selectedApplicant.gender || "",
      date_of_birth: selectedApplicant.date_of_birth || "",
      marriage_date:
        selectedApplicant.marriage_date &&
        selectedApplicant.marriage_date.toLowerCase() !== "invalid date"
          ? selectedApplicant.marriage_date
          : "",
      blood_group: selectedApplicant.blood_group || "",
      membership_type: selectedApplicant.membership_type || "",
      education: selectedApplicant.education || "",
      occupation: selectedApplicant.occupation || "",
      mobile_number: selectedApplicant.mobile_number || "",
      email: selectedApplicant.email || "",
      current_address: selectedApplicant.current_address || "",
      permanent_address: selectedApplicant.permanent_address || "",
      office_address: selectedApplicant.office_address || "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    const payloadToSave = { ...editData };

    if (
      !payloadToSave.marriage_date ||
      payloadToSave.marriage_date === "" ||
      payloadToSave.marriage_date.toLowerCase() === "invalid date"
    )
      payloadToSave.marriage_date = null;
    if (payloadToSave.blood_group === "") payloadToSave.blood_group = null;
    if (payloadToSave.office_address === "")
      payloadToSave.office_address = null;

    try {
      const result = await editApplicantByAdmin(
        selectedApplicant.id,
        payloadToSave,
      );
      toast.success("Details updated successfully!");
      // Merge new data with existing files to prevent photos from disappearing
      setSelectedApplicant((prev) => ({ ...prev, ...result.data }));
      setIsEditing(false);
      loadApplicants();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update details.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePromote = async () => {
    if (!registrationNumber.trim()) {
      toast.error(
        "कृपया पंजीकरण संख्या दर्ज करें (Please enter registration number).",
      );
      return;
    }
    setIsPromoting(true);
    try {
      await promoteApplicant(selectedApplicant.id, registrationNumber);
      toast.success("सदस्य को सफलतापूर्वक प्रमोट किया गया!");
      setRegistrationNumber("");
      setSelectedApplicant(null);
      setPreviewImage(null);
      loadApplicants();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "प्रमोट करने में विफल (Failed to promote).",
      );
    } finally {
      setIsPromoting(false);
    }
  };

  const handleToggleMemberStatus = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await toggleMemberStatus(id);
      toast.success(response?.message || "स्थिति अपडेट की गई (Status Updated)");
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === id
            ? { ...m, is_active: response?.data?.is_active ?? !m.is_active }
            : m,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "स्थिति अपडेट करने में विफल",
      );
    }
  };

  const handleDownloadIdCard = async (id, e) => {
    e.stopPropagation();
    toast.loading("डाउनलोड हो रहा है... (Downloading...)", {
      id: "downloadId",
    });
    try {
      const blob = await downloadIdCard(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Member_ID_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("ID कार्ड डाउनलोड हो गया! (Downloaded)", {
        id: "downloadId",
      });
    } catch (error) {
      toast.error("ID कार्ड डाउनलोड करने में विफल", { id: "downloadId" });
    }
  };

  const handleUpdateFee = async () => {
    if (!newFee || isNaN(newFee)) {
      toast.error("कृपया सही राशि दर्ज करें (Please enter a valid amount)");
      return;
    }
    setIsUpdatingFee(true);
    try {
      await updateMembershipFee(Number(newFee));
      toast.success("शुल्क सफलतापूर्वक अपडेट किया गया");
      setNewFee("");
    } catch (err) {
      toast.error("शुल्क अपडेट करने में विफल");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handlePrint = () => window.print();

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

  const getFileUrl = (type) => {
    if (!selectedApplicant?.files) return null;
    const file = selectedApplicant.files.find((f) => f.file_type === type);
    return file ? `${MINIO_BASE_URL}${file.minio_url}` : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 sm:p-8 font-sans relative print:bg-white print:p-0">
      {/* BACKGROUND CONTENT */}
      <div className="max-w-7xl mx-auto print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-md mb-6 border-t-4 border-orange-500">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-sm">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                एडमिन डैशबोर्ड
              </h1>
              <p className="text-indigo-600 font-semibold text-sm">
                Admin Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm border border-red-100"
          >
            लॉग आउट (Logout)
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "applicants" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            आवेदक (Applicants)
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "members" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            सदस्य (Members)
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "settings" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            सेटिंग्स (Settings)
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 min-h-[400px]">
          {loading && activeTab !== "settings" ? (
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
          ) : activeTab === "applicants" ? (
            applicants.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-medium">
                कोई आवेदन नहीं मिला।
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                    {applicants.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => handleRowClick(app)}
                        className="hover:bg-indigo-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {app.full_name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {app.education} • {app.occupation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">
                            {app.mobile_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.email}
                          </div>
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
              </div>
            )
          ) : activeTab === "members" ? (
            members.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-medium">
                कोई सदस्य नहीं मिला।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        सदस्य (Member)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        भूमिका (Role)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        सक्रिय (Active Toggle)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-indigo-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-700">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {member.mobile_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-bold ${member.role === "PRESIDENT" ? "bg-purple-100 text-purple-800" : "bg-indigo-50 text-indigo-700"}`}
                          >
                            {member.role === "PRESIDENT"
                              ? "अध्यक्ष (President)"
                              : "सदस्य (Member)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) =>
                                handleToggleMemberStatus(member.id, e)
                              }
                              disabled={member.role === "PRESIDENT"}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${member.is_active ? "bg-green-500" : "bg-gray-300"}`}
                              role="switch"
                              aria-checked={member.is_active}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${member.is_active ? "translate-x-5" : "translate-x-0"}`}
                              />
                            </button>
                            <span
                              className={`text-sm font-semibold ${member.is_active ? "text-green-700" : "text-gray-500"}`}
                            >
                              {member.is_active ? "सक्रिय" : "निष्क्रिय"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="p-8 sm:p-12">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                सिस्टम सेटिंग्स (System Settings)
              </h2>
              <p className="text-gray-500 mb-8">
                आजीवन सदस्यता के लिए सिस्टम-वाइड शुल्क बदलें।
              </p>
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 max-w-lg">
                <h3 className="text-lg font-bold text-orange-900 mb-4">
                  सदस्यता शुल्क अद्यतन (Update Fee)
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-orange-800 mb-1">
                      नया शुल्क (New Fee Amount ₹)
                    </label>
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm font-semibold text-gray-900"
                      placeholder="e.g. 1500"
                    />
                  </div>
                  <button
                    onClick={handleUpdateFee}
                    disabled={isUpdatingFee}
                    className="w-full sm:w-auto bg-orange-600 text-white px-8 py-3 rounded-md font-bold hover:bg-orange-700 transition shadow-md disabled:opacity-50"
                  >
                    {isUpdatingFee ? "Saving..." : "अपडेट करें"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL SECTION WITH SIDE-BY-SIDE VIEWER --- */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity print:static print:bg-transparent print:p-0">
          {/* Main Modal Container: dynamically widens if an image is being previewed */}
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col lg:flex-row ${previewImage ? "max-w-[95vw]" : "max-w-3xl"} max-h-[95vh] overflow-hidden border-t-8 border-orange-500 transition-all duration-300 print:max-h-none print:shadow-none print:border-none relative`}
          >
            {loadingDetails && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center print:hidden">
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

          {/* --- LEFT SIDE: APPLICATION FORM --- */}
            {/* Added print:overflow-visible to ensure the whole page prints, not just the scrollable area */}
            <div className={`flex-1 overflow-y-auto flex flex-col ${previewImage ? 'lg:border-r-2 lg:border-gray-200' : ''} print:block print:overflow-visible`}>
              
              {/* Sticky Header (Hidden during print) */}
              <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10 print:hidden shadow-sm">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">आवेदक विवरण (Applicant Details)</h2>
                  <p className="text-sm text-indigo-600 font-semibold mt-1">Ref ID: {selectedApplicant.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  


                  {/* EDIT BUTTON */}
                  {!isEditing && selectedApplicant.status === 'PENDING_ADMIN_REVIEW' && (
                    <button onClick={startEditing} className="flex items-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors border border-orange-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      <span className="hidden sm:inline">एडिट (Edit)</span>
                    </button>
                  )}

                   {/* 🖨️ PRINT BUTTON: Only shows when NOT editing and NO image is open */}
                     <button 
                  onClick={handlePrint}
                  className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>प्रिंट (Print)</span>
                </button>

                  {/* CLOSE BUTTON */}
                  <button onClick={() => { setSelectedApplicant(null); setPreviewImage(null); }} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors" title="Close">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* 🖨️ THE BIG PRINT HEADER (Only shows on paper) */}
              <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mt-6 mx-8">
                <h1 className="text-3xl font-extrabold text-gray-900">महाराष्ट्र मंडळ, रायपूर, छत्तीसगढ़</h1>
                <h2 className="text-xl font-bold mt-2 text-gray-800">सभासद आवेदन पत्र (आजीवन)</h2>
                
                {selectedApplicant.registration_number ? (
                  <p className="text-lg font-bold text-black mt-2">पंजीकरण संख्या: {selectedApplicant.registration_number}</p>
                ) : (
                  <p className="text-sm font-semibold text-gray-600 mt-2">Ref ID: {selectedApplicant.id.substring(0, 8).toUpperCase()}</p>
                )}
              </div>

              {/* Form Body */}
              <div className="p-6 pt-0 print:pt-6">
                
                {/* Top Quick Details & Photo */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 bg-slate-50 p-5 rounded-xl border border-slate-100 gap-4 print:bg-transparent print:border-none print:p-0 print:mb-8">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center flex-wrap gap-3 print:hidden">
                      <span className="text-gray-500 font-semibold text-sm">
                        वर्तमान स्थिति (Status):
                      </span>
                      {getStatusBadge(selectedApplicant.status)}
                      
                     
                    </div>
                    {selectedApplicant.proposer && (
                      <div className="text-sm text-gray-800 text-lg print:text-base">
                        <span className="font-semibold">
                          अनुमोदक (Proposer):
                        </span>{" "}
                        <span className="text-indigo-700 font-bold print:text-black">
                          {selectedApplicant.proposer.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="w-32 h-36 bg-gray-100 border-2 border-gray-400 rounded-md flex items-center justify-center overflow-hidden shrink-0 group relative print:border-black">
                    {getFileUrl("PHOTO") ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(getFileUrl("PHOTO"))}
                        className="w-full h-full block cursor-pointer"
                      >
                        <img
                          src={getFileUrl("PHOTO")}
                          alt="Applicant"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs flex flex-col items-center gap-1 drop-shadow-md">
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
                            View
                          </span>
                        </div>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 font-bold text-center px-2">
                        पासपोर्ट फोटो
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Layout (Edit or Read) */}
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 print:gap-y-6 bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <EditInput
                      label="पूर्ण नाम (Full Name)"
                      name="full_name"
                      value={editData.full_name}
                      onChange={handleEditChange}
                    />
                    <EditInput
                      label="पिता/पति का नाम"
                      name="father_or_husband_name"
                      value={editData.father_or_husband_name}
                      onChange={handleEditChange}
                    />
                    <EditSelect
                      label="लिंग (Gender)"
                      name="gender"
                      value={editData.gender}
                      onChange={handleEditChange}
                    >
                      <option value="MALE">Male (पुरुष)</option>
                      <option value="FEMALE">Female (महिला)</option>
                      <option value="OTHER">Other (अन्य)</option>
                    </EditSelect>
                    <EditInput
                      label="जन्म तिथि (DOB)"
                      name="date_of_birth"
                      type="date"
                      value={editData.date_of_birth}
                      onChange={handleEditChange}
                    />
                    <EditInput
                      label="विवाह तिथि"
                      name="marriage_date"
                      type="date"
                      value={editData.marriage_date}
                      onChange={handleEditChange}
                    />
                    <EditSelect
                      label="रक्त गट (Blood Group)"
                      name="blood_group"
                      value={editData.blood_group}
                      onChange={handleEditChange}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </EditSelect>
                    <EditSelect
                      label="सदस्यता प्रकार"
                      name="membership_type"
                      value={editData.membership_type}
                      onChange={handleEditChange}
                    >
                      <option value="LIFETIME">Lifetime (आजीवन)</option>
                    </EditSelect>
                    <EditInput
                      label="शैक्षणिक योग्यता"
                      name="education"
                      value={editData.education}
                      onChange={handleEditChange}
                    />
                    <EditInput
                      label="व्यवसाय/नौकरी"
                      name="occupation"
                      value={editData.occupation}
                      onChange={handleEditChange}
                    />
                    <EditInput
                      label="मोबाईल"
                      name="mobile_number"
                      value={editData.mobile_number}
                      onChange={handleEditChange}
                    />
                    <EditInput
                      label="ई-मेल"
                      name="email"
                      value={editData.email}
                      onChange={handleEditChange}
                    />
                    <div className="md:col-span-2">
                      <EditInput
                        label="वर्तमान पता"
                        name="current_address"
                        value={editData.current_address}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <EditInput
                        label="स्थाई पता"
                        name="permanent_address"
                        value={editData.permanent_address}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <EditInput
                        label="कार्यालय का पता"
                        name="office_address"
                        value={editData.office_address}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-4 mt-6 print:hidden">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md font-bold hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={isSavingEdit}
                        className="px-6 py-2 bg-orange-600 text-white rounded-md font-bold hover:bg-orange-700 disabled:opacity-50"
                      >
                        {isSavingEdit ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 print:gap-y-6">
                      <DetailItem
                        label="पूर्ण नाम (Full Name)"
                        value={selectedApplicant.full_name}
                      />
                      <DetailItem
                        label="पिता/पति का नाम (Father/Husband Name)"
                        value={selectedApplicant.father_or_husband_name}
                      />
                      <DetailItem
                        label="लिंग (Gender)"
                        value={selectedApplicant.gender}
                      />
                      <DetailItem
                        label="जन्म तिथि (Date of Birth)"
                        value={selectedApplicant.date_of_birth}
                      />
                      <DetailItem
                        label="विवाह तिथि (Marriage Date)"
                        value={selectedApplicant.marriage_date || "N/A"}
                      />
                      <DetailItem
                        label="रक्त गट (Blood Group)"
                        value={selectedApplicant.blood_group || "N/A"}
                      />
                      <DetailItem
                        label="सदस्यता (Membership Type)"
                        value={selectedApplicant.membership_type}
                      />
                      <DetailItem
                        label="शैक्षणिक योग्यता (Education)"
                        value={selectedApplicant.education}
                      />
                      <DetailItem
                        label="व्यवसाय/नौकरी (Occupation)"
                        value={selectedApplicant.occupation}
                      />
                      <DetailItem
                        label="मोबाईल (Mobile Number)"
                        value={selectedApplicant.mobile_number}
                      />
                      <DetailItem
                        label="ई-मेल (Email)"
                        value={selectedApplicant.email}
                      />
                      <div className="md:col-span-2">
                        <DetailItem
                          label="वर्तमान पता (Current Address)"
                          value={selectedApplicant.current_address}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <DetailItem
                          label="स्थाई पता (Permanent Address)"
                          value={selectedApplicant.permanent_address}
                        />
                      </div>
                      {selectedApplicant.office_address && (
                        <div className="md:col-span-2">
                          <DetailItem
                            label="कार्यालय का पता (Office Address)"
                            value={selectedApplicant.office_address}
                          />
                        </div>
                      )}
                    </div>

                    {/* Aadhar Documents List */}
                    <div className="mt-8 pt-6 border-t border-gray-200 print:mt-6 print:pt-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">
                        सलग्न कागदपत्रे (Attached Documents)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase">
                            आधार कार्ड (Front)
                          </p>
                          <div className="h-32 bg-gray-50 rounded-lg border border-gray-300 overflow-hidden relative group shadow-inner">
                            {getFileUrl("AADHAR_FRONT") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage(getFileUrl("AADHAR_FRONT"))
                                }
                                className="w-full h-full block cursor-pointer"
                              >
                                <img
                                  src={getFileUrl("AADHAR_FRONT")}
                                  alt="Aadhar Front"
                                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                  <span className="text-white opacity-0 group-hover:opacity-100 font-bold tracking-wider drop-shadow-md flex items-center gap-2">
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
                                    View Side-by-Side
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm flex items-center justify-center h-full">
                                No Document
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase">
                            आधार कार्ड (Back)
                          </p>
                          <div className="h-32 bg-gray-50 rounded-lg border border-gray-300 overflow-hidden relative group shadow-inner">
                            {getFileUrl("AADHAR_BACK") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage(getFileUrl("AADHAR_BACK"))
                                }
                                className="w-full h-full block cursor-pointer"
                              >
                                <img
                                  src={getFileUrl("AADHAR_BACK")}
                                  alt="Aadhar Back"
                                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                  <span className="text-white opacity-0 group-hover:opacity-100 font-bold tracking-wider drop-shadow-md flex items-center gap-2">
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
                                    View Side-by-Side
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm flex items-center justify-center h-full">
                                No Document
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Admin Review Action Panel */}
                {!isEditing &&
                  selectedApplicant.status === "PENDING_ADMIN_REVIEW" && (
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 print:hidden shadow-inner">
                      <h3 className="text-lg font-bold text-blue-900 mb-3">
                        एडमिन समीक्षा (Admin Review)
                      </h3>
                      <p className="text-sm text-blue-800 mb-4">
                        Verify documents by clicking them to view side-by-side.
                        Fix typos using the <b>Edit</b> button above, or reject
                        the form for major corrections.
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
                  )}

                {/* Promote Action Panel */}
                {selectedApplicant.status === "PAYMENT_COMPLETED" && (
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
                        <label className="block text-sm font-bold text-green-800 mb-1">
                          पंजीकरण संख्या (Assign Registration Number) *
                        </label>
                        <input
                          type="text"
                          value={registrationNumber}
                          onChange={(e) =>
                            setRegistrationNumber(e.target.value)
                          }
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
                )}

                {/* Signature Panel */}
                <div className="mt-12 border-t border-gray-300 pt-6 flex justify-between items-end print:mt-16">
                  <div className="text-center print:block hidden">
                    <div className="mt-12 mb-2 border-b border-black w-48"></div>
                    <p className="text-xs font-bold text-gray-800">
                      अध्यक्ष / सचिव हस्ताक्षर
                    </p>
                  </div>

                  <div className="text-center ml-auto">
                    <div className="w-48 h-16 bg-transparent flex items-end justify-center mb-2 overflow-hidden print:border-b print:border-black group relative">
                      {getFileUrl("SIGNATURE") ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage(getFileUrl("SIGNATURE"))
                          }
                          className="w-full h-full block cursor-pointer"
                        >
                          <img
                            src={getFileUrl("SIGNATURE")}
                            alt="Signature"
                            className="max-w-full max-h-full object-contain pb-1 group-hover:scale-110 transition-transform duration-300 origin-bottom"
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic mb-2">
                          हस्ताक्षर (Signature)
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      आवेदक के हस्ताक्षर (Applicant Signature)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT SIDE: DYNAMIC IMAGE VIEWER --- */}
            {/* This side only appears when an admin clicks on a document */}
           {/* --- RIGHT SIDE: DYNAMIC IMAGE VIEWER --- */}
            {/* This side only appears when an admin clicks on a document */}
            {previewImage && (
              <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 relative flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header bar for image viewer */}
                <div className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800 shadow-sm z-10">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-300 font-semibold text-sm tracking-wide">Document Preview</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-700 hidden xl:block">
                      Double-click to Zoom
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {/* Zoom Toggle Button */}
                    <button onClick={() => setIsZoomed(!isZoomed)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition" title={isZoomed ? "Zoom Out" : "Zoom In"}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isZoomed 
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /> 
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          }
                       </svg>
                    </button>
                    {/* Open in New Tab Button */}
                    <a href={previewImage} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition" title="Open full size in new tab">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                    {/* Close Button */}
                    <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition" title="Close Preview">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                
                {/* The actual image with Zoom properties */}
                <div className="flex-1 p-6 flex items-center justify-center overflow-auto relative bg-slate-800/30">
                  <img 
                    src={previewImage} 
                    alt="Document Preview" 
                    onDoubleClick={() => setIsZoomed(!isZoomed)}
                    className={`max-w-full max-h-full object-contain rounded drop-shadow-2xl transition-transform duration-300 origin-center ${
                      isZoomed ? 'scale-[2.0] cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                    }`} 
                  />
                </div>
              </div>
            )}
            {/* Fallback floating close button for small screens if image is opened */}
            {previewImage && (
              <div className="lg:hidden absolute inset-0 z-50 bg-slate-900 flex flex-col">
                <div className="flex justify-end p-4 bg-slate-950">
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="text-white bg-slate-800 p-2 rounded-full"
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
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <img
                    src={previewImage}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div className="bg-transparent">
    <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wide print:text-gray-600">
      {label}
    </p>
    <p className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 print:border-black print:text-base">
      {value || "N/A"}
    </p>
  </div>
);

const EditInput = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-xs font-bold text-orange-800 mb-1 uppercase">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-orange-500 font-semibold text-gray-900"
    />
  </div>
);

const EditSelect = ({ label, name, value, onChange, children }) => (
  <div>
    <label className="block text-xs font-bold text-orange-800 mb-1 uppercase">
      {label}
    </label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-orange-500 font-semibold text-gray-900 bg-white"
    >
      <option value="">Select...</option>
      {children}
    </select>
  </div>
);
