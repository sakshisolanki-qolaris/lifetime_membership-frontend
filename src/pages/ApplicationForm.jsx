import React, { useState,useEffect } from "react";
import { fetchMembersList } from "../services/api";
import { submitApplication } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
export default function MembershipForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    father_or_husband_name: "",
    gender: "",        
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
  });


  const [proposers, setProposers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingProposers, setLoadingProposers] = useState(false);
const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
useEffect(() => {
    // If search is empty, don't hit the API
    if (searchTerm.trim() === "") {
      setProposers([]);
      return;
    }

    // Set a timer to wait 500ms after the user stops typing
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
    }, 500); // 500ms debounce

    // Cleanup the timer if the user types again before 500ms passes
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // When a user clicks a name from the dropdown list
  const handleSelectProposer = (member) => {
    // 1. Save the hidden ID to the actual formData for the backend
    setFormData({ ...formData, proposer_member_id: member.id });
    
    // 2. Change the visible text to the selected name
    setSearchTerm(member.name);
    
    // 3. Close the dropdown
    setIsDropdownOpen(false); 
  };

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
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
   const file = e.target.files[0];
    if (file) {
      // Save the actual file for the backend
      setFiles({ ...files, [e.target.name]: file });
      
      // Generate a temporary URL to show the image preview on the screen
      setPreviews({ ...previews, [e.target.name]: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e) => { // <-- Added 'async'
    e.preventDefault();
   
    // Safety check before talking to backend
    if (!files.applicant_photo || !files.applicant_signature) {
      toast.error("कृपया पासपोर्ट फोटो आणि स्वाक्षरी अपलोड करा. (Please upload photo and signature)");
      return;
    }

    if (!formData.proposer_member_id) {
      toast.error("कृपया अनुमोदकाची निवड करा. (Please select a proposer)");
      return;
    }

    setLoading(true); // Disable the button while uploading
    
    const formDataToSend = new FormData();
    
    // 1. Append all text fields
   Object.keys(formData).forEach(key => {
      if (formData[key] !== "") { 
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // 2. Append the mandatory files
    formDataToSend.append('applicant_photo', files.applicant_photo);
    formDataToSend.append('applicant_signature', files.applicant_signature);
formDataToSend.append('aadhar_front', files.aadhar_front);
    formDataToSend.append('aadhar_back', files.aadhar_back);
    try {
      // 3. Send to backend via our Axios service
      const result = await submitApplication(formDataToSend);
      
      // 4. Show success message
      toast.success("अर्ज यशस्वीरीत्या जमा झाला! (Application submitted!)");
      
      // 5. Redirect to the Success Page (Phase 1 complete)
      navigate('/success');
      
    } catch (error) {
      console.error("Submission error:", error);
      
      // Extract the exact error message from the backend (e.g., Joi validation errors)
    console.error("Submission error:", error.response?.data || error);
      
      // 1. Prioritize the detailed Joi 'errors' array if it exists
      // 2. Fall back to the general 'message'
      // 3. Fall back to a default string if the server is completely down
      const errorMsg = 
        (error.response?.data?.errors && error.response.data.errors.length > 0) 
          ? error.response.data.errors.join("\n") 
          : error.response?.data?.message || "Submission failed. Please try again.";
      
      toast.error(errorMsg, { duration: 5000 }); // Show for 5 seconds so they can read it
    } finally {
        console.log("Submission attempt finished.", formDataToSend); // Debug log to confirm completion
      setLoading(false); // Re-enable the button
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border-t-8 border-orange-600">
        
        {/* Header Section mimicking the physical form */}
        <div className="px-8 py-6 border-b-2 border-orange-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-orange-50/30">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              महाराष्ट्र मंडळ, रायपुर, छत्तीसगढ
            </h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">
              सभासद आवेदन पत्र (Membership Application)
            </p>
            <p className="text-sm text-gray-500 mt-1 font-semibold text-orange-600">
              सदस्यता प्रकार: आजीवन (Lifetime)
            </p>
          </div>
          
          {/* Passport Photo Box */}
         <div className="relative">
            <label className="cursor-pointer flex flex-col items-center justify-center w-32 h-40 border-2 border-dashed border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
              {previews.applicant_photo ? (
                /* SHOW THE IMAGE PREVIEW */
                <img 
                  src={previews.applicant_photo} 
                  alt="Passport Preview" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                /* SHOW THE UPLOAD TEXT IF NO IMAGE */
                <>
                  <span className="text-gray-500 text-sm font-medium">पासपोर्ट फोटो</span>
                  <span className="text-gray-400 text-xs mt-1">(Upload)</span>
                </>
              )}
              <input 
                type="file" 
                name="applicant_photo" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
                required 
              />
            </label>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
          
          {/* Section 1: Personal Details */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                पूर्ण नांव <span className="text-gray-400 font-normal">(Full Name)</span> *
              </label>
              <input
                type="text"
                name="full_name"
                required
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                वडील/पति चे नांव <span className="text-gray-400 font-normal">(Father/Husband Name)</span> *
              </label>
              <input
                type="text"
                name="father_or_husband_name"
                required
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

  {/* NEW FIELD: Gender */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                लिंग <span className="text-gray-400 font-normal">(Gender)</span> *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
              >
                <option value="">Select...</option>
                <option value="MALE">पुरुष (Male)</option>
                <option value="FEMALE">महिला (Female)</option>
                <option value="OTHER">अन्य (Other)</option>
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
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

          

            {/* NEW FIELD: Aadhar Card */}
            {/* Aadhar Front Upload */}
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
                <input type="file" name="aadhar_front" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange}  />
              </label>
            </div>

            {/* Aadhar Back Upload */}
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

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                रक्त गट <span className="text-gray-400 font-normal">(Blood Group)</span>
              </label>
              <select
                name="blood_group"
                onChange={handleChange}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                स्थाई पत्ता <span className="text-gray-400 font-normal">(Permanent Address)</span> *
              </label>
              <textarea
                name="permanent_address"
                rows="2"
                required
                onChange={handleChange}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              ></textarea>
            </div>
          </div>

{/* Section 4: Proposer / Reference (अनुमोदक) */}
          <div className="bg-orange-50/50 p-6 rounded-md border border-orange-200 mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-orange-200 pb-2">
              अनुमोदक <span className="text-gray-500 font-normal text-sm">(Proposer / Reference)</span>
            </h3>
            
            <div className="sm:col-span-2 relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                आजीव सदस्याचे नाव <span className="text-gray-400 font-normal">(Search Proposer Name)</span> *
              </label>
              
              {/* Search Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // If they clear the input, clear the saved ID
                  if (e.target.value === "") {
                    setFormData({ ...formData, proposer_member_id: "" });
                  }
                }}
                placeholder="Type member name to search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
                required={!formData.proposer_member_id} // Make required if nothing is selected
              />

              {loadingProposers && (
                <div className="absolute right-3 top-9 text-sm text-gray-400">Searching...</div>
              )}

              {/* Custom Dropdown List */}
              {isDropdownOpen && proposers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {proposers.map((member) => (
                    <li
                      key={member.id}
                      onClick={() => handleSelectProposer(member)}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-orange-100 text-gray-900"
                    >
                      {member.name}
                    </li>
                  ))}
                </ul>
              )}
              
              {/* No Results Message */}
              {isDropdownOpen && proposers.length === 0 && !loadingProposers && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-red-500 ring-1 ring-black ring-opacity-5">
                  No lifetime member found with that name.
                </div>
              )}
            </div>
          </div>

          {/* Declaration Section */}
         {/* Declaration and Signature Section */}
          <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mt-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
            
            {/* Left Side: Declaration Text & Checkbox */}
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium mb-4 leading-relaxed">
                (संविधानाची प्रत वाचावी)<br/>
                मला मराठी बोलता व वाचता येते आणि संविधाना प्रमाणे मंडळाचा सदस्य होण्यास पात्र आहे. मी मंडळाचे नियमांचे पालन करीन.
              </p>
              <div className="flex items-center">
                <input
                  id="declaration"
                  name="declaration"
                  type="checkbox"
                  required
                  className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="declaration" className="ml-3 block text-sm font-bold text-gray-900">
                  I agree to the terms and conditions of the Maharashtra Mandal.
                </label>
              </div>
            </div>

            {/* Right Side: Signature Upload Box */}
           <div className="relative shrink-0">
              <label className="cursor-pointer flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-100 transition-colors overflow-hidden">
                {previews.applicant_signature ? (
                  /* SHOW THE SIGNATURE PREVIEW */
                  <img 
                    src={previews.applicant_signature} 
                    alt="Signature Preview" 
                    className="w-full h-full object-contain p-1" 
                  />
                ) : (
                  /* SHOW THE UPLOAD TEXT IF NO IMAGE */
                  <>
                    <span className="text-gray-600 text-sm font-bold">स्वाक्षरी</span>
                    <span className="text-gray-400 text-xs mt-1">(Upload Signature)</span>
                  </>
                )}
                <input 
                  type="file" 
                  name="applicant_signature" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  required 
                />
              </label>
            </div>
            </div>
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
             className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                ${loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}
              `}
            >
              {loading ? "Uploading files... (कृपया प्रतीक्षा करा...)" : "Submit Application (अर्ज जमा करा)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}