import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApplicantById, fetchActiveRegions, fetchMembersList, resubmitApplication } from "../services/api";
import toast from 'react-hot-toast';

const MINIO_BASE_URL = import.meta.env.VITE_MINIO_URL;

export default function EditApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ADDED MISSING REGIONS STATE
  const [regions, setRegions] = useState([]);

  // FIXED INITIALIZATION: Must be snake_case to match the input 'name' attributes 
  // and what the backend API expects upon form submission.
  const [formData, setFormData] = useState({
    full_name: "",
    father_or_husband_name: "",
    gender: "",
    is_from_raipur: false, 
    region: "",            
    permanent_address: "",
    current_address: "",
    mobile_number: "",
    email: "",
    education: "",
    occupation: "",
    office_address: "",
    date_of_birth: "",
    marriage_date: "",
    blood_group: "",
    membership_type: "LIFETIME",
    proposer_member_id: ""
  });

  const [proposers, setProposers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingProposers, setLoadingProposers] = useState(false);

  const [files, setFiles] = useState({
    applicant_photo: null,
    applicant_signature: null,
    aadhar_front: null,
    aadhar_back: null,
  });

  const [previews, setPreviews] = useState({
    applicant_photo: null,
    applicant_signature: null,
    aadhar_front: null,
    aadhar_back: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchApplicantById(id);
        const data = result.data || result;
        
        // FIXED MAPPING: Read from backend camelCase, store in frontend snake_case
        setFormData({
          full_name: data.fullName || "",
          father_or_husband_name: data.fatherOrHusbandName || "",
          gender: data.gender || "",            
          is_from_raipur: data.isFromRaipur || false, 
          region: data.region || "",                    
          permanent_address: data.permanentAddress || "",
          current_address: data.currentAddress || "",
          mobile_number: data.mobileNumber || "",
          email: data.email || "",
          education: data.education || "",
          occupation: data.occupation || "",
          office_address: data.officeAddress || "",
          date_of_birth: data.dateOfBirth || "",
          marriage_date: data.marriageDate || "",
          blood_group: data.bloodGroup || "",
          membership_type: data.membershipType || "LIFETIME",
          proposer_member_id: data.proposerMemberId || (data.proposer ? data.proposer.id : "")
        });

        // Populate proposer search term
        if (data.proposer) {
          setSearchTerm(data.proposer.name);
        }

        // FIXED FILES: Use camelCase fileType and minioUrl to read from backend
        if (data.files) {
          const photoUrl = data.files.find(f => f.fileType === 'PHOTO')?.minioUrl;
          const sigUrl = data.files.find(f => f.fileType === 'SIGNATURE')?.minioUrl;
          const aadharFrontUrl = data.files.find(f => f.fileType === 'AADHAR_FRONT')?.minioUrl;
          const aadharBackUrl = data.files.find(f => f.fileType === 'AADHAR_BACK')?.minioUrl;
          
          setPreviews({
            applicant_photo: photoUrl ? `${MINIO_BASE_URL}${photoUrl}` : null,
            applicant_signature: sigUrl ? `${MINIO_BASE_URL}${sigUrl}` : null,
            aadhar_front: aadharFrontUrl ? `${MINIO_BASE_URL}${aadharFrontUrl}` : null,
            aadhar_back: aadharBackUrl ? `${MINIO_BASE_URL}${aadharBackUrl}` : null,
          });
        }
      } catch (error) {
        toast.error("Error loading application details.");
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [id]); // MINIO_BASE_URL removed from dependencies since it's a constant outside the component

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const result = await fetchActiveRegions();
        if (result.success) {
          setRegions(result.data);
        }
      } catch (error) {
        console.error("Error fetching regions", error);
      }
    };
    loadRegions();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setProposers([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setLoadingProposers(true);
      try {
        const result = await fetchMembersList(searchTerm);
        if (result.success) {
          setProposers(result.data);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        console.error("Error fetching proposers", error);
      } finally {
        setLoadingProposers(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectProposer = (member) => {
    setFormData({ ...formData, proposer_member_id: member.id });
    setSearchTerm(member.name);
    setIsDropdownOpen(false); 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [e.target.name]: file });
      setPreviews({ ...previews, [e.target.name]: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!formData.proposer_member_id) {
      toast.error("कृपया अनुमोदकाची निवड करा. (Please select a proposer)");
      return;
    }

    setLoading(true); 
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key] === "") {
         if (key === 'marriage_date' || key === 'office_address' || key === 'blood_group' || key === 'region') {
            // Skip optional empty fields to prevent backend validation errors
         }
       } else if (formData[key] !== null) { 
         formDataToSend.append(key, formData[key]);
       }
    });
    
    // Only append files if user selected NEW ones during editing
    if (files.applicant_photo) formDataToSend.append('applicant_photo', files.applicant_photo);
    if (files.applicant_signature) formDataToSend.append('applicant_signature', files.applicant_signature);
    if (files.aadhar_front) formDataToSend.append('aadhar_front', files.aadhar_front);
    if (files.aadhar_back) formDataToSend.append('aadhar_back', files.aadhar_back);
    
    try {
      await resubmitApplication(id, formDataToSend);
      toast.success("अर्ज यशस्वीरीत्या अद्यतनित झाला! (Application updated!)");
      navigate('/success');
    } catch (error) {
      const errorMsg = (error.response?.data?.errors && error.response.data.errors.length > 0) 
          ? error.response.data.errors.join("\n") 
          : error.response?.data?.message || "Update failed. Please try again.";
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
       <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border-t-8 border-orange-600">
         <div className="px-8 py-4 bg-orange-100 text-orange-800 font-bold text-center">
            You are editing a rejected application (Resubmission Mode)
         </div>
         <div className="px-8 py-6 border-b-2 border-orange-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-orange-50/30">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              महाराष्ट्र मंडळ, रायपुर, छत्तीसगढ
            </h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">
              सभासद आवेदन पत्र (Membership Application)
            </p>
          </div>
          
          <div className="relative">
            <label className="cursor-pointer flex flex-col items-center justify-center w-32 h-40 border-2 border-dashed border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
              {previews.applicant_photo ? (
                <img src={previews.applicant_photo} alt="Passport Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-gray-500 text-sm font-medium">पासपोर्ट फोटो</span>
                  <span className="text-gray-400 text-xs mt-1">(Upload)</span>
                </>
              )}
              <input type="file" name="applicant_photo" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
          
           <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">पूर्ण नांव *</label>
              <input type="text" name="full_name" value={formData.full_name} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
            </div>
           
             <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                वडील/पति चे नांव <span className="text-gray-400 font-normal">(Father/Husband Name)</span> *
              </label>
              <input
                type="text"
                name="father_or_husband_name"
                value={formData.father_or_husband_name}
                required
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                लिंग <span className="text-gray-400 font-normal">(Gender)</span> *
              </label>
              <select
                name="gender"
                value={formData.gender}
                required
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                जन्म तारीख <span className="text-gray-400 font-normal">(Date of Birth)</span> *
              </label>
              <input
                type="date"
                name="date_of_birth"
                required
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                विवाह तारीख <span className="text-gray-400 font-normal">(Marriage Date)</span>
              </label>
              <input
                type="date"
                name="marriage_date"
                value={formData.marriage_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                रक्त गट <span className="text-gray-400 font-normal">(Blood Group)</span>
              </label>
              <select
                name="blood_group"
                onChange={handleChange}
                value={formData.blood_group}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                आधार कार्ड (Front) *
              </label>
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors overflow-hidden">
                {previews.aadhar_front ? (
                  <img src={previews.aadhar_front} alt="Aadhar Front Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 text-sm font-medium">Upload Front Side</span>
                )}
                <input type="file" name="aadhar_front" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                आधार कार्ड (Back) *
              </label>
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors overflow-hidden">
                {previews.aadhar_back ? (
                  <img src={previews.aadhar_back} alt="Aadhar Back Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 text-sm font-medium">Upload Back Side</span>
                )}
                <input type="file" name="aadhar_back" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange}  />
              </label>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: Contact & Address */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                मोबाईल <span className="text-gray-400 font-normal">(Mobile Number)</span> *
              </label>
              <input
                type="tel"
                name="mobile_number"
                required
                pattern="[6-9][0-9]{9}"
                onChange={handleChange}
                value={formData.mobile_number}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                ई-मेल <span className="text-gray-400 font-normal">(Email)</span> *
              </label>
              <input
                type="email"
                name="email"
                required
                onChange={handleChange}
                value={formData.email}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            {/* ADDED: is_from_raipur AND region */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                काय तुम्ही रायपूरचे आहात? <span className="text-gray-400 font-normal">(Are you from Raipur?)</span> *
              </label>
              <select
                name="is_from_raipur"
                value={formData.is_from_raipur}
                onChange={(e) => {
                  const isFromRaipur = e.target.value === 'true';
                  setFormData({ 
                    ...formData, 
                    is_from_raipur: isFromRaipur, 
                    region: isFromRaipur ? formData.region : "" 
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            {formData.is_from_raipur && (
              <div className="sm:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  क्षेत्र <span className="text-gray-400 font-normal">(Region)</span> *
                </label>
                <select
                  name="region"
                  required={formData.is_from_raipur}
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
                >
                  <option value="">Select Region...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                स्थाई पत्ता <span className="text-gray-400 font-normal">(Permanent Address)</span> *
              </label>
              <textarea
                name="permanent_address"
                rows="2"
                required
                onChange={handleChange}
                value={formData.permanent_address}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              ></textarea>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                वर्तमान पत्ता <span className="text-gray-400 font-normal">(Current Address)</span> *
              </label>
              <textarea
                name="current_address"
                rows="2"
                required
                onChange={handleChange}
                value={formData.current_address}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              ></textarea>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 3: Professional Details */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                शैक्षणिक योग्यता <span className="text-gray-400 font-normal">(Education)</span> *
              </label>
              <input
                type="text"
                name="education"
                required
                onChange={handleChange}
                value={formData.education}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                व्यवसाय/नौकरी <span className="text-gray-400 font-normal">(Occupation)</span> *
              </label>
              <input
                type="text"
                name="occupation"
                required
                onChange={handleChange}
                value={formData.occupation}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                कार्यालयीन पत्ता <span className="text-gray-400 font-normal">(Office Address)</span>
              </label>
              <textarea
                name="office_address"
                rows="2"
                onChange={handleChange}
                value={formData.office_address}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              ></textarea>
            </div>
          
             <div className="sm:col-span-2 relative mt-4">
               <label className="block text-sm font-bold text-gray-700 mb-1">आजीव सदस्याचे नाव (Search Proposer Name) *</label>
               <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value === "") setFormData({ ...formData, proposer_member_id: "" }); }} className="w-full px-4 py-2 border border-gray-300 rounded-md" required={!formData.proposer_member_id} />
               {isDropdownOpen && proposers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto">
                  {proposers.map((member) => (
                    <li key={member.id} onClick={() => handleSelectProposer(member)} className="cursor-pointer py-2 pl-3 hover:bg-orange-100">{member.name}</li>
                  ))}
                </ul>
              )}
             </div>

             <div className="relative shrink-0 mt-6">
                <label className="cursor-pointer flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-400 rounded-md bg-white">
                  {previews.applicant_signature ? (
                    <img src={previews.applicant_signature} alt="Signature Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-gray-600 text-sm font-bold">स्वाक्षरी</span>
                  )}
                  <input type="file" name="applicant_signature" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
             </div>
           </div>

           <div className="pt-4 mt-6">
            <button type="submit" disabled={loading} className={`w-full py-3 rounded-md text-white font-bold ${loading ? "bg-orange-400" : "bg-orange-600 hover:bg-orange-700"}`}>
              {loading ? "Updating... (कृपया प्रतीक्षा करा...)" : "Update Application (अर्ज अद्यतनित करा)"}
            </button>
          </div>
        </form>
       </div>
    </div>
  );
}