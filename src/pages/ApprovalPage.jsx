import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { fetchApprovalDetails, submitApproval } from '../services/api';
import toast from 'react-hot-toast';

// Base URL for your local MinIO server so images can load
// (Change this to your real server URL when deploying, e.g., "https://api.yourdomain.com")
const MINIO_BASE_URL = "http://localhost:9000"; 

export default function ApprovalPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const token = searchParams.get('token');
  // Determine if it is the Proposer or the President viewing the page
  const role = location.pathname.includes('president') ? 'PRESIDENT' : 'MEMBER';

  const [applicant, setApplicant] = useState(null);
  const [isUsed, setIsUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data on load
  useEffect(() => {
    if (!token) {
      toast.error("Invalid approval link. Token is missing.");
      setLoading(false);
      return;
    }

    fetchApprovalDetails(token, role)
      .then(res => {
        console.log("DATA FROM BACKEND:", res.data.applicant);
        if (res.success) {

          setApplicant(res.data.applicant);
          setIsUsed(res.data.is_used);
        }
      })
      .catch(err => toast.error(err.response?.data?.message || 'This link is invalid.'))
      .finally(() => setLoading(false));
  }, [token, role]);

  // Handle the Approve/Reject Action
  const handleAction = async (action) => {
    const actionText = action === 'APPROVE' ? 'मंजूर (Approve)' : 'नाकार (Reject)';
    if (!window.confirm(`Are you sure you want to ${actionText} this application?`)) return;
    
    setActionLoading(true);
    try {
      const result = await submitApproval(role, token, action);
      
      // Show success popup
      toast.success(result.message, { duration: 5000 });
      
      // Instantly hide the buttons and show the orange banner without reloading the page
      setIsUsed(true); 
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading and Error States
  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-600">Loading Application Details...</div>;
  if (!applicant) return <div className="min-h-screen flex items-center justify-center text-red-600 text-xl font-bold">Invalid or Expired Approval Link</div>;

  // Extract file URLs safely
  const photoObj = applicant.files?.find(f => f.file_type === 'PHOTO');
  const signatureObj = applicant.files?.find(f => f.file_type === 'SIGNATURE');
  const photoUrl = photoObj ? `${MINIO_BASE_URL}${photoObj.minio_url}` : null;
  const signatureUrl = signatureObj ? `${MINIO_BASE_URL}${signatureObj.minio_url}` : null;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden border-t-8 border-indigo-600 relative">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b-2 border-indigo-100 flex justify-between items-start bg-indigo-50/30">
          <div>
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${role === 'PRESIDENT' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
              {role} REVIEW
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Application Review
            </h1>
            <p className="text-gray-600 mt-1 font-medium">
              Lifetime Membership Application
            </p>
          </div>
          
          {/* Photo Display */}
          <div className="w-32 h-40 border-4 border-white shadow-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Applicant" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xs text-center px-2">No Photo Provided</span>
            )}
          </div>
        </div>

        {/* Read-Only Form Body */}
        <div className="px-8 py-8 space-y-8">
          
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Full Name</p>
                <p className="font-bold text-gray-900 text-lg bg-gray-50 p-2 rounded">{applicant.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Father/Husband Name</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.father_or_husband_name}</p>
              </div>
              
                   <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Gender</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.gender || "N/A"}</p>
             
             </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Date of Birth</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.date_of_birth}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Blood Group</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.blood_group || "N/A"}</p>
              </div>


              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Marriage Date</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.marriage_date || "N/A"}</p>
              </div>
        
         
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Aadhar Card</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.aadhar_number || "N/A"}</p>
              </div>
</div>
          </div>

          {/* Section 2: Contact & Address */}
          <div>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">Contact & Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Mobile Number</p>
                <p className="font-bold text-gray-900 bg-gray-50 p-2 rounded">{applicant.mobile_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Email Address</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.email}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">Current Address</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded leading-relaxed">{applicant.current_address}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">Permanent Address</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded leading-relaxed">{applicant.permanent_address}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Professional Details */}
          <div>
            <h3 className="text-lg font-bold text-indigo-800 border-b border-gray-200 pb-2 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Education</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.education}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Occupation</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.occupation}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 font-medium mb-1">Office Address</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">{applicant.office_address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Proposer & Signature */}
          <div className="bg-indigo-50/50 p-6 rounded-md border border-indigo-200 flex flex-col sm:flex-row justify-between items-end gap-6 mt-8">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium mb-1">Proposed By (अनुमोदक)</p>
              <p className="font-bold text-indigo-900 text-xl">{applicant.proposer?.name}</p>
              <p className="text-xs text-indigo-600 mt-2">The applicant has agreed to all terms and conditions of Maharashtra Mandal.</p>
            </div>

            {/* Signature Display */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-48 h-20 border-b-2 border-gray-400 bg-white flex items-center justify-center mb-1 overflow-hidden p-1">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-gray-300 text-xs">No Signature</span>
                )}
              </div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Applicant Signature</span>
            </div>
          </div>

        </div>

        {/* Action Buttons (Sticky at Bottom) */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          
          {isUsed ? (
            /* IF TOKEN IS USED: Show this message instead of buttons */
            <div className="bg-orange-100 text-orange-800 p-4 text-center text-lg font-bold rounded-md border border-orange-300">
              हा अर्ज आधीच तपासला गेला आहे. <br/>
              <span className="text-sm font-medium text-orange-700">(This application has already been processed. You cannot vote again.)</span>
            </div>
          ) : (
            /* IF TOKEN IS FRESH: Show the Approve/Reject buttons */
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => handleAction('APPROVE')} 
                disabled={actionLoading}
                className="flex-1 flex justify-center items-center bg-green-600 text-white py-4 rounded-md font-extrabold text-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'APPROVE (मंजूर करा)'}
              </button>
              
              <button 
                onClick={() => handleAction('REJECT')} 
                disabled={actionLoading}
                className="flex-1 flex justify-center items-center bg-red-600 text-white py-4 rounded-md font-extrabold text-lg shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'REJECT (नाकार करा)'}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}