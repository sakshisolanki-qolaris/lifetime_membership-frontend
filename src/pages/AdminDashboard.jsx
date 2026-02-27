import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchAllApplicants, 
  fetchApplicantById, 
  promoteApplicant,
  fetchAllMembers, 
  toggleMemberStatus, 
  downloadIdCard, 
  updateMembershipFee 
} from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('applicants'); // 'applicants', 'members', 'settings'
  
  const [applicants, setApplicants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const [newFee, setNewFee] = useState('');
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  
  const navigate = useNavigate();
  const MINIO_BASE_URL = 'http://localhost:9000'; 

  useEffect(() => {
    if (activeTab === 'applicants') {
      loadApplicants();
    } else if (activeTab === 'members') {
      loadMembers();
    }
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
    toast.error(error.response?.data?.message || "डेटा लोड करने में विफल (Failed to load).");
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleRowClick = async (app) => {
    setSelectedApplicant(app);
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

  const handlePrint = () => {
    window.print();
  };

  const handlePromote = async () => {
    if (!registrationNumber.trim()) {
      toast.error('कृपया पंजीकरण संख्या दर्ज करें (Please enter registration number).');
      return;
    }
    setIsPromoting(true);
    try {
      await promoteApplicant(selectedApplicant.id, registrationNumber);
      toast.success('सदस्य को सफलतापूर्वक प्रमोट किया गया! (Successfully promoted to member)');
      setRegistrationNumber('');
      setSelectedApplicant(null); 
      loadApplicants(); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'प्रमोट करने में विफल (Failed to promote).');
    } finally {
      setIsPromoting(false);
    }
  };

  // --- NEW TOGGLE LOGIC INTEGRATED WITH BACKEND ---
  const handleToggleMemberStatus = async (id, e) => {
    e.stopPropagation(); 
    try {
      // 1. Call Backend API to toggle status
      const response = await toggleMemberStatus(id);
      toast.success(response?.message || "स्थिति अपडेट की गई (Status Updated)");
      
      // 2. Update local React state instantly for snappy UI (so we don't need to reload)
      setMembers((prevMembers) => 
        prevMembers.map((m) => 
          m.id === id ? { ...m, is_active: response?.data?.is_active ?? !m.is_active } : m
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "स्थिति अपडेट करने में विफल");
    }
  };

  const handleDownloadIdCard = async (id, e) => {
    e.stopPropagation(); 
    toast.loading("डाउनलोड हो रहा है... (Downloading...)", { id: "downloadId" });
    try {
      const blob = await downloadIdCard(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Member_ID_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("ID कार्ड डाउनलोड हो गया! (Downloaded)", { id: "downloadId" });
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
      toast.success("शुल्क सफलतापूर्वक अपडेट किया गया (Fee Updated Successfully)");
      setNewFee('');
    } catch (err) {
      toast.error("शुल्क अपडेट करने में विफल (Failed to update fee)");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'MEMBER') return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">आजीवन सदस्य (Official Member)</span>;
    if (status === 'PAYMENT_COMPLETED') return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">शुल्क प्राप्त (Ready to Promote)</span>;
    if (status?.includes('REJECTED')) return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">अस्वीकृत (Rejected)</span>;
    if (status?.includes('PAYMENT_PENDING')) return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">भुगतान लंबित (Payment Pending)</span>;
    if (status?.includes('APPROVED_BY')) return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">मंजूर (Approved - Interim)</span>;
    if (status?.includes('PENDING')) return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">अनुमोदन लंबित (Pending Approval)</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">{status || 'UNKNOWN'}</span>;
  };

  const getFileUrl = (type) => {
    if (!selectedApplicant?.files) return null;
    const file = selectedApplicant.files.find(f => f.file_type === type);
    return file ? `${MINIO_BASE_URL}${file.minio_url}` : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 sm:p-8 font-sans relative print:bg-white print:p-0">
      
      <div className="max-w-7xl mx-auto print:hidden">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-md mb-6 border-t-4 border-orange-500">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">एडमिन डैशबोर्ड</h1>
              <p className="text-indigo-600 font-semibold text-sm">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm border border-red-100">
            लॉग आउट (Logout)
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => setActiveTab('applicants')} 
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === 'applicants' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            आवेदक (Applicants)
          </button>
          <button 
            onClick={() => setActiveTab('members')} 
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === 'members' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            सदस्य (Members)
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            सेटिंग्स (Settings)
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 min-h-[400px]">
          
          {loading && activeTab !== 'settings' ? (
            <div className="p-16 text-center text-indigo-600 font-bold flex flex-col items-center">
              <svg className="animate-spin mb-4 h-8 w-8 text-orange-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              डेटा लोड हो रहा है...
            </div>
          ) : activeTab === 'applicants' ? (
            
            /* --- APPLICANTS TABLE --- */
            applicants.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-medium">कोई आवेदन नहीं मिला।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">आवेदक (Applicant)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">संपर्क (Contact)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">आवेदन तिथि (Date)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">स्थिति (Status)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {applicants.map((app) => (
                      <tr key={app.id} onClick={() => handleRowClick(app)} className="hover:bg-indigo-50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{app.full_name}</div>
                          <div className="text-sm text-gray-500 mt-1">{app.education} • {app.occupation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">{app.mobile_number}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                          {new Date(app.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          ) : activeTab === 'members' ? (
            
            /* --- MEMBERS TABLE WITH TOGGLE --- */
            members.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-medium">कोई सदस्य नहीं मिला।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">सदस्य (Member)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">भूमिका (Role)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">सक्रिय (Active Toggle)</th>
                     
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-indigo-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-700">{member.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{member.mobile_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold ${member.role === 'PRESIDENT' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-50 text-indigo-700'}`}>
                            {member.role === 'PRESIDENT' ? 'अध्यक्ष (President)' : 'सदस्य (Member)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           {/* VISUAL TOGGLE SWITCH */}
                           <div className="flex items-center space-x-3">
                             <button 
                               onClick={(e) => handleToggleMemberStatus(member.id, e)} 
                               disabled={member.role === 'PRESIDENT'}
                               className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${member.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                               role="switch"
                               aria-checked={member.is_active}
                             >
                               <span 
                                 className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${member.is_active ? 'translate-x-5' : 'translate-x-0'}`} 
                               />
                             </button>
                             <span className={`text-sm font-semibold ${member.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                               {member.is_active ? 'सक्रिय' : 'निष्क्रिय'}
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

            /* --- SETTINGS TAB --- */
            <div className="p-8 sm:p-12">
               <h2 className="text-2xl font-extrabold text-gray-900 mb-2">सिस्टम सेटिंग्स (System Settings)</h2>
               <p className="text-gray-500 mb-8">आजीवन सदस्यता के लिए सिस्टम-वाइड शुल्क बदलें। (Update the system-wide fee for lifetime membership.)</p>
               
               <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 max-w-lg">
                 <h3 className="text-lg font-bold text-orange-900 mb-4">सदस्यता शुल्क अद्यतन (Update Fee)</h3>
                 <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                   <div className="flex-1 w-full">
                     <label className="block text-sm font-bold text-orange-800 mb-1">नया शुल्क (New Fee Amount ₹)</label>
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
                     {isUpdatingFee ? 'Saving...' : 'अपडेट करें'}
                   </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAY (Becomes the main page content during print) */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity print:static print:bg-transparent print:p-0">
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-t-8 border-orange-500 print:max-h-none print:shadow-none print:border-none print:overflow-visible relative">
            
            {loadingDetails && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center print:hidden">
                 <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
            )}

            {/* Print Only Header (Shows up only on paper) */}
            <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 mt-4">
              <h1 className="text-3xl font-extrabold text-gray-900">महाराष्ट्र मंडळ, रायपूर, छत्तीसगढ़</h1>
              <h2 className="text-xl font-bold mt-2">सभासद आवेदन पत्र (आजीवन)</h2>
              
              {selectedApplicant.registration_number && (
                <p className="text-lg font-bold text-black mt-2">पंजीकरण संख्या: {selectedApplicant.registration_number}</p>
              )}
            </div>

            {/* Sticky Header (Hidden during print) */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10 print:hidden">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">आवेदक विवरण (Applicant Details)</h2>
                <p className="text-sm text-indigo-600 font-semibold mt-1">Ref ID: {selectedApplicant.id.substring(0, 8).toUpperCase()}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 🖨️ Print Button */}
                <button 
                  onClick={handlePrint}
                  className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>प्रिंट (Print)</span>
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedApplicant(null)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Body (This is what gets printed) */}
            <div className="p-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 bg-slate-50 p-5 rounded-xl border border-slate-100 gap-4 print:bg-transparent print:border-none print:p-0 print:mb-8">
                 <div className="flex-1 space-y-3">
                   <div className="flex items-center space-x-3 print:hidden">
                      <span className="text-gray-500 font-semibold text-sm">वर्तमान स्थिति (Status):</span>
                      {getStatusBadge(selectedApplicant.status)}
                   </div>
                   {selectedApplicant.proposer && (
                      <div className="text-sm text-gray-800 text-lg print:text-base">
                        <span className="font-semibold">अनुमोदक (Proposer):</span> <span className="text-indigo-700 font-bold print:text-black">{selectedApplicant.proposer.name}</span>
                      </div>
                   )}
                 </div>
                 
                 <div className="w-32 h-36 bg-gray-100 border-2 border-gray-400 rounded-md flex items-center justify-center overflow-hidden shrink-0 print:border-black">
                    {getFileUrl('PHOTO') ? (
                      <img src={getFileUrl('PHOTO')} alt="Applicant" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500 font-bold text-center px-2">पासपोर्ट फोटो <br/>(Photo)</span>
                    )}
                 </div>
              </div>

              {/* --- REGISTRATION NUMBER (If member) --- */}
              {selectedApplicant.registration_number && (
                <div className="md:col-span-2 bg-green-50 p-4 rounded-xl border border-green-300 mb-6 flex items-center justify-between print:border-black print:bg-transparent">
                  <div>
                    <p className="text-sm font-bold text-green-800 uppercase tracking-wider print:text-black">
                      पंजीकरण संख्या (Registration Number)
                    </p>
                    <p className="text-2xl font-black text-green-900 mt-1 print:text-black">
                      {selectedApplicant.registration_number}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="px-4 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold print:border print:border-black print:bg-transparent print:text-black">
                      Official Member
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 print:gap-y-6">
                <DetailItem label="पूर्ण नाम (Full Name)" value={selectedApplicant.full_name} />
                <DetailItem label="पिता/पति का नाम (Father/Husband Name)" value={selectedApplicant.father_or_husband_name} />
                <DetailItem label="लिंग (Gender)" value={selectedApplicant.gender} />
                <DetailItem label="जन्म तिथि (Date of Birth)" value={selectedApplicant.date_of_birth} />
                <DetailItem label="विवाह तिथि (Marriage Date)" value={selectedApplicant.marriage_date || 'N/A'} />
                <DetailItem label="आधार कार्ड (Aadhar Card)" value={selectedApplicant.aadhar_number} />
                <DetailItem label="रक्त गट (Blood Group)" value={selectedApplicant.blood_group || 'N/A'} />
                <DetailItem label="सदस्यता (Membership Type)" value={selectedApplicant.membership_type} />
                <DetailItem label="शैक्षणिक योग्यता (Education)" value={selectedApplicant.education} />
                <DetailItem label="व्यवसाय/नौकरी (Occupation)" value={selectedApplicant.occupation} />
                <DetailItem label="मोबाईल (Mobile Number)" value={selectedApplicant.mobile_number} />
                <DetailItem label="ई-मेल (Email)" value={selectedApplicant.email} />
                <div className="md:col-span-2"><DetailItem label="वर्तमान पता (Current Address)" value={selectedApplicant.current_address} /></div>
                <div className="md:col-span-2"><DetailItem label="स्थाई पता (Permanent Address)" value={selectedApplicant.permanent_address} /></div>
                {selectedApplicant.office_address && <div className="md:col-span-2"><DetailItem label="कार्यालय का पता (Office Address)" value={selectedApplicant.office_address} /></div>}
              </div>

              {/* --- PROMOTE TO MEMBER SECTION --- */}
              {selectedApplicant.status === 'PAYMENT_COMPLETED' && (
                <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 print:hidden shadow-inner">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    सदस्य म्हणून बढती द्या (Promote to Official Member)
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-green-800 mb-1">पंजीकरण संख्या (Assign Registration Number) *</label>
                      <input 
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
                      {isPromoting ? 'प्रतीक्षा करा...' : 'Promote Member'}
                    </button>
                  </div>
                </div>
              )}

              {/* Signature Section */}
              <div className="mt-12 border-t border-gray-300 pt-6 flex justify-between items-end print:mt-16">
                <div className="text-center print:block hidden">
                   <div className="mt-12 mb-2 border-b border-black w-48"></div>
                   <p className="text-xs font-bold text-gray-800">अध्यक्ष / सचिव हस्ताक्षर</p>
                </div>
                
                <div className="text-center ml-auto">
                  <div className="w-48 h-16 bg-transparent flex items-end justify-center mb-2 overflow-hidden print:border-b print:border-black">
                    {getFileUrl('SIGNATURE') ? (
                      <img src={getFileUrl('SIGNATURE')} alt="Signature" className="max-w-full max-h-full object-contain pb-1" />
                    ) : (
                      <span className="text-xs text-gray-400 italic mb-2">हस्ताक्षर (Signature)</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800">आवेदक के हस्ताक्षर (Applicant Signature)</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div className="bg-transparent">
    <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wide print:text-gray-600">{label}</p>
    <p className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 print:border-black print:text-base">{value || 'N/A'}</p>
  </div>
);