import React, { useState, useEffect } from "react";
import { submitApplication, fetchMembersList, fetchActiveRegions } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod Validation Schema
const applicationSchema = z.object({
  full_name: z.string().min(2, "पूरा नाम आवश्यक है (Full name is required)"),
  father_or_husband_name: z.string().min(2, "पिता/पति का नाम आवश्यक है"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { errorMap: () => ({ message: "कृपया लिंग चुनें (Select gender)" }) }),
  date_of_birth: z.string().min(1, "जन्म तिथि आवश्यक है"),
  marriage_date: z.string().optional(),
  blood_group: z.string().optional(),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, "अमान्य मोबाइल नंबर (Invalid 10-digit mobile number)"),
  email: z.string().email("अमान्य ईमेल पता (Invalid email address)"),
  permanent_address: z.string().min(5, "स्थाई पता आवश्यक है (Permanent address is required)"),
  current_address: z.string().min(5, "वर्तमान पता आवश्यक है (Current address is required)"),
  is_from_raipur: z.enum(["true", "false"]),
  region: z.string().optional(),
  education: z.string().min(2, "शैक्षणिक योग्यता आवश्यक है (Education is required)"),
  occupation: z.string().min(2, "व्यवसाय/नौकरी आवश्यक है (Occupation is required)"),
  office_address: z.string().optional(),
  proposer_member_id: z.string().min(1, "कृपया अनुमोदक चुनें (Select a proposer from the list)"),
  declaration: z.literal(true, { errorMap: () => ({ message: "आपको नियमों से सहमत होना होगा (You must agree to the terms)" }) })
}).superRefine((data, ctx) => {
  // Conditional validation: If from Raipur, region MUST be selected
  if (data.is_from_raipur === "true" && (!data.region || data.region === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "कृपया क्षेत्र चुनें (Select region)",
      path: ["region"],
    });
  }
});

export default function MembershipForm() {
  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      is_from_raipur: "false",
    }
  });

  // Watch fields to trigger UI changes
  const isFromRaipur = watch("is_from_raipur");

  // Local State for Search, Dropdowns, and Files
  const [proposers, setProposers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingProposers, setLoadingProposers] = useState(false);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  // Fetch Regions on mount
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

 // Debounced Proposer Search with Cleanup
  useEffect(() => {
    // 1. Create a flag to track if the component is alive
    let isMounted = true; 

    if (searchTerm.trim() === "") {
      setProposers([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      // 2. Before making the API call, check if the component is still mounted
      if (!isMounted) return; 

      setLoadingProposers(true);
      try {
        const result = await fetchMembersList(searchTerm);
        
        // 3. Before updating state with the results, check again!
        // The component might have unmounted while waiting for the API response
        if (isMounted && result.success) {
          setProposers(result.data);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        if (isMounted) console.error("Error fetching proposers", error);
      } finally {
        // 4. Safely stop the loading spinner
        if (isMounted) {
          setLoadingProposers(false);
        }
      }
    }, 500);

    // Cleanup function: runs when the component unmounts OR before the next effect runs
    return () => {
      isMounted = false; // Mark component as unmounted so pending promises don't update state
      clearTimeout(delayDebounceFn); // Clear the timeout
    };
  }, [searchTerm]);

  const handleSelectProposer = (member) => {
    setValue("proposer_member_id", member.id, { shouldValidate: true });
    setSearchTerm(member.name);
    setIsDropdownOpen(false); 
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [e.target.name]: file });
      setPreviews({ ...previews, [e.target.name]: URL.createObjectURL(file) });
    }
  };

  // Validated Submit Handler
  const onSubmit = async (data) => {
    // Safety check for files
    if (!files.applicant_photo || !files.applicant_signature || !files.aadhar_front || !files.aadhar_back) {
      toast.error("कृपया सभी आवश्यक तस्वीरें अपलोड करें। (Please upload all photos and signatures)");
      return;
    }

    setLoading(true); 
    const formDataToSend = new FormData();
    
    // 1. Append Validated Text Fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== "") { 
        formDataToSend.append(key, data[key]);
      }
    });

    // 2. Append Default Membership Type
    formDataToSend.append("membership_type", "LIFETIME");
    
    // 3. Append Files
    formDataToSend.append('applicant_photo', files.applicant_photo);
    formDataToSend.append('applicant_signature', files.applicant_signature);
    formDataToSend.append('aadhar_front', files.aadhar_front);
    formDataToSend.append('aadhar_back', files.aadhar_back);
    
    try {
      await submitApplication(formDataToSend);
      toast.success("अर्ज यशस्वीरीत्या जमा झाला! (Application submitted!)");
      navigate('/success');
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      const errorMsg = (error.response?.data?.errors && error.response.data.errors.length > 0) 
          ? error.response.data.errors.join("\n") 
          : error.response?.data?.message || "Submission failed. Please try again.";
      
      toast.error(errorMsg, { duration: 5000 }); 
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border-t-8 border-orange-600">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b-2 border-orange-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-orange-50/30">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">महाराष्ट्र मंडळ, रायपुर, छत्तीसगढ</h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">सभासद आवेदन पत्र (Membership Application)</p>
            <p className="text-sm text-gray-500 mt-1 font-semibold text-orange-600">सदस्यता प्रकार: आजीवन (Lifetime)</p>
          </div>
          
          {/* Passport Photo Box */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-8">
          
          {/* Section 1: Personal Details */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">पूर्ण नांव <span className="text-gray-400 font-normal">(Full Name)</span> *</label>
              <input type="text" {...register("full_name")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">वडील/पति चे नांव <span className="text-gray-400 font-normal">(Father/Husband Name)</span> *</label>
              <input type="text" {...register("father_or_husband_name")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.father_or_husband_name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.father_or_husband_name && <p className="text-red-500 text-xs mt-1">{errors.father_or_husband_name.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">लिंग <span className="text-gray-400 font-normal">(Gender)</span> *</label>
              <select {...register("gender")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select...</option>
                <option value="MALE">पुरुष (Male)</option>
                <option value="FEMALE">महिला (Female)</option>
                <option value="OTHER">अन्य (Other)</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">जन्म तारीख <span className="text-gray-400 font-normal">(Date of Birth)</span> *</label>
              <input type="date" {...register("date_of_birth")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">विवाह तारीख <span className="text-gray-400 font-normal">(Marriage Date)</span></label>
              <input type="date" {...register("marriage_date")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.marriage_date ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.marriage_date && <p className="text-red-500 text-xs mt-1">{errors.marriage_date.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">रक्त गट <span className="text-gray-400 font-normal">(Blood Group)</span></label>
              <select {...register("blood_group")} className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white">
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

            {/* Aadhar Uploads (Managed by Local State) */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">आधार कार्ड (Front) *</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-1">आधार कार्ड (Back) *</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-1">मोबाईल <span className="text-gray-400 font-normal">(Mobile Number)</span> *</label>
              <input type="tel" {...register("mobile_number")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.mobile_number ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.mobile_number && <p className="text-red-500 text-xs mt-1">{errors.mobile_number.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">ई-मेल <span className="text-gray-400 font-normal">(Email)</span> *</label>
              <input type="email" {...register("email")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">स्थाई पत्ता <span className="text-gray-400 font-normal">(Permanent Address)</span> *</label>
              <textarea rows="2" {...register("permanent_address")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.permanent_address ? 'border-red-500' : 'border-gray-300'}`}></textarea>
              {errors.permanent_address && <p className="text-red-500 text-xs mt-1">{errors.permanent_address.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">वर्तमान पत्ता <span className="text-gray-400 font-normal">(Current Address)</span> *</label>
              <textarea rows="2" {...register("current_address")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.current_address ? 'border-red-500' : 'border-gray-300'}`}></textarea>
              {errors.current_address && <p className="text-red-500 text-xs mt-1">{errors.current_address.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">काय तुम्ही रायपूरचे आहात? <span className="text-gray-400 font-normal">(Are you from Raipur?)</span> *</label>
            <select 
              {...register("is_from_raipur")}
              onChange={(e) => {
                 // Call react-hook-form's register onChange to keep it synced
                 setValue("is_from_raipur", e.target.value, { shouldValidate: true });
                 if (e.target.value === "false") {
                   setValue("region", ""); // Reset region if No
                 }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm bg-white"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {isFromRaipur === "true" && (
            <div className="sm:col-span-1 mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">क्षेत्र <span className="text-gray-400 font-normal">(Region)</span> *</label>
              <select {...register("region")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white ${errors.region ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Region...</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
            </div>
          )}

          <hr className="border-gray-200 mt-6" />

          {/* Section 3: Professional Details */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 mt-6">
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">शैक्षणिक योग्यता <span className="text-gray-400 font-normal">(Education)</span> *</label>
              <input type="text" {...register("education")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.education ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">व्यवसाय/नौकरी <span className="text-gray-400 font-normal">(Occupation)</span> *</label>
              <input type="text" {...register("occupation")} className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${errors.occupation ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.occupation && <p className="text-red-500 text-xs mt-1">{errors.occupation.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">कार्यालयीन पत्ता <span className="text-gray-400 font-normal">(Office Address)</span></label>
              <textarea rows="2" {...register("office_address")} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm"></textarea>
            </div>
          </div>

          {/* Section 4: Proposer / Reference */}
          <div className="bg-orange-50/50 p-6 rounded-md border border-orange-200 mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-orange-200 pb-2">
              अनुमोदक <span className="text-gray-500 font-normal text-sm">(Proposer / Reference)</span>
            </h3>
            
            <div className="sm:col-span-2 relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                आजीव सदस्याचे नाव <span className="text-gray-400 font-normal">(Search Proposer Name)</span> *
              </label>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value === "") {
                    setValue("proposer_member_id", "", { shouldValidate: true });
                  }
                }}
                placeholder="Type member name to search..."
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white ${errors.proposer_member_id ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.proposer_member_id && <p className="text-red-500 text-xs mt-1">{errors.proposer_member_id.message}</p>}

              {loadingProposers && <div className="absolute right-3 top-9 text-sm text-gray-400">Searching...</div>}

              {isDropdownOpen && proposers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {proposers.map((member) => (
                    <li key={member.id} onClick={() => handleSelectProposer(member)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-orange-100 text-gray-900">
                      {member.name}
                    </li>
                  ))}
                </ul>
              )}
              
              {isDropdownOpen && proposers.length === 0 && !loadingProposers && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-red-500 ring-1 ring-black ring-opacity-5">
                  No lifetime member found with that name.
                </div>
              )}
            </div>
          </div>

          {/* Declaration and Signature Section */}
          <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mt-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
            
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium mb-4 leading-relaxed">
                (संविधानाची प्रत वाचावी)<br/>
                मला मराठी बोलता व वाचता येते आणि संविधाना प्रमाणे मंडळाचा सदस्य होण्यास पात्र आहे. मी मंडळाचे नियमांचे पालन करीन.
              </p>
              <div className="flex items-start">
                <input
                  id="declaration"
                  type="checkbox"
                  {...register("declaration")}
                  className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-0.5"
                />
                <div className="ml-3 flex flex-col">
                  <label htmlFor="declaration" className="block text-sm font-bold text-gray-900">
                    I agree to the terms and conditions of the Maharashtra Mandal.
                  </label>
                  {errors.declaration && <span className="text-red-500 text-xs mt-1">{errors.declaration.message}</span>}
                </div>
              </div>
            </div>

            {/* Signature Upload Box */}
           <div className="relative shrink-0">
              <label className="cursor-pointer flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-100 transition-colors overflow-hidden">
                {previews.applicant_signature ? (
                  <img src={previews.applicant_signature} alt="Signature Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <>
                    <span className="text-gray-600 text-sm font-bold">स्वाक्षरी</span>
                    <span className="text-gray-400 text-xs mt-1">(Upload Signature)</span>
                  </>
                )}
                <input type="file" name="applicant_signature" accept="image/*" className="hidden" onChange={handleFileChange} />
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