import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllApplicants, fetchApplicantById } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  const MINIO_BASE_URL = 'http://localhost:9000'; 

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      const result = await fetchAllApplicants();
      setApplicants(result.data || result || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "डेटा लोड करने में विफल (Failed to load).");
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
    if (status === 'PAYMENT_COMPLETED') return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">शुल्क प्राप्त (Active)</span>;
    if (status?.includes('REJECTED')) return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">अस्वीकृत (Rejected)</span>;
    if (status?.includes('PAYMENT_PENDING')) return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">भुगतान लंबित (Payment Pending)</span>;
    if (status?.includes('PENDING')) return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">अनुमोदन लंबित (Pending Approval)</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">{status || 'UNKNOWN'}</span>;
  };

  const getFileUrl = (type) => {
    if (!selectedApplicant?.files) return null;
    const file = selectedApplicant.files.find(f => f.file_type === type);
    return file ? `${MINIO_BASE_URL}${file.minio_url}` : null;
  };

  return (
    // 'print:bg-white' ensures the background is plain white when printing
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 sm:p-8 font-sans relative print:bg-white print:p-0">
      
      {/* MAIN DASHBOARD (Hidden during print)
        'print:hidden' hides this entire table section when printing 
      */}
      <div className="max-w-7xl mx-auto print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-md mb-8 border-t-4 border-orange-500">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">आजीवन सदस्यता आवेदन</h1>
              <p className="text-indigo-600 font-semibold text-sm">Lifetime Membership Applications</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm border border-red-100">
            लॉग आउट (Logout)
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-16 text-center text-indigo-600 font-bold flex flex-col items-center">
              <svg className="animate-spin mb-4 h-8 w-8 text-orange-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              डेटा लोड हो रहा है...
            </div>
          ) : applicants.length === 0 ? (
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
          )}
        </div>
      </div>

      {/* MODAL OVERLAY (Becomes the main page content during print)
      */}
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
              <h1 className="text-3xl font-extrabold text-gray-900">महाराष्ट्र मंडळ, रायपूर, छत्तीसगढ़</h1>
              <h2 className="text-xl font-bold mt-2">सभासद आवेदन पत्र (आजीवन)</h2>
              <p className="text-sm text-gray-600 mt-1">Ref ID: {selectedApplicant.id}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 print:gap-y-6">
                <DetailItem label="पूर्ण नाम (Full Name)" value={selectedApplicant.full_name} />
                <DetailItem label="पिता/पति का नाम (Father/Husband Name)" value={selectedApplicant.father_or_husband_name} />
                <DetailItem label="जन्म तिथि (Date of Birth)" value={selectedApplicant.date_of_birth} />
                <DetailItem label="विवाह तिथि (Marriage Date)" value={selectedApplicant.marriage_date || 'N/A'} />
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
    <p className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 print:border-black print:text-base">{value}</p>
  </div>
);