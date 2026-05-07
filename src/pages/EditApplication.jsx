import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  fetchApplicantById,
  fetchActiveRegions,
  fetchMembersList,
  resubmitApplication,
} from "../services/api";
import toast from "react-hot-toast";

const MINIO_BASE_URL = import.meta.env.VITE_MINIO_URL;

// 1. UNIFIED FormField: Reduced internal duplication to 0%
const FormField = ({
  label,
  hint,
  id,
  name,
  type = "text",
  value,
  onChange,
  required,
  as = "input",
  options = [],
  colSpan = "sm:col-span-1",
  ...rest
}) => {
  const commonProps = {
    id,
    name,
    value,
    onChange,
    required,
    className: `w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm outline-none ${
      as === "select" ? "bg-white" : ""
    }`,
    ...rest,
  };

  return (
    <div className={colSpan}>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-700 mb-1"
      >
        {label}{" "}
        {hint && <span className="text-gray-400 font-normal">{hint}</span>}{" "}
        {required && "*"}
      </label>
      {as === "input" && <input type={type} {...commonProps} />}
      {as === "select" && (
        <select {...commonProps}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {as === "textarea" && <textarea {...commonProps} />}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.node.isRequired,
  hint: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  as: PropTypes.oneOf(["input", "select", "textarea"]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  colSpan: PropTypes.string,
};

// 2. EXTRACTED FileUploadField: Eliminates the 4 duplicated image upload blocks
const FileUploadField = ({
  id,
  name,
  label,
  uploadText,
  hint,
  preview,
  onChange,
  wrapperClass = "sm:col-span-1",
  containerClass = "w-full h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors overflow-hidden",
  imgClass = "w-full h-full object-cover",
  accept = "image/*,application/pdf",
}) => (
  <div className={wrapperClass}>
    {label && (
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-700 mb-1"
      >
        {label}
      </label>
    )}
    <label
      htmlFor={id}
      className={`cursor-pointer flex flex-col items-center justify-center ${containerClass}`}
    >
      {preview ? (
        <img src={preview} alt={`${uploadText} Preview`} className={imgClass} />
      ) : (
        <>
          <span className="text-gray-500 text-sm font-medium">
            {uploadText}
          </span>
          {hint && <span className="text-gray-400 text-xs mt-1">{hint}</span>}
        </>
      )}
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
    </label>
  </div>
);

FileUploadField.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  uploadText: PropTypes.string.isRequired,
  hint: PropTypes.string,
  preview: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  wrapperClass: PropTypes.string,
  containerClass: PropTypes.string,
  imgClass: PropTypes.string,
  accept: PropTypes.string,
};

export default function EditApplication() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [regions, setRegions] = useState([]);

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
    proposer_member_id: "",
  });

  const [proposers, setProposers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          proposer_member_id:
            data.proposerMemberId || (data.proposer ? data.proposer.id : ""),
        });

        if (data.proposer) {
          setSearchTerm(data.proposer.name);
        }

        if (data.files) {
          const photoUrl = data.files.find(
            (f) => f.fileType === "PHOTO",
          )?.minioUrl;
          const sigUrl = data.files.find(
            (f) => f.fileType === "SIGNATURE",
          )?.minioUrl;
          const aadharFrontUrl = data.files.find(
            (f) => f.fileType === "AADHAR_FRONT",
          )?.minioUrl;
          const aadharBackUrl = data.files.find(
            (f) => f.fileType === "AADHAR_BACK",
          )?.minioUrl;

          setPreviews({
            applicant_photo: photoUrl ? `${MINIO_BASE_URL}${photoUrl}` : null,
            applicant_signature: sigUrl ? `${MINIO_BASE_URL}${sigUrl}` : null,
            aadhar_front: aadharFrontUrl
              ? `${MINIO_BASE_URL}${aadharFrontUrl}`
              : null,
            aadhar_back: aadharBackUrl
              ? `${MINIO_BASE_URL}${aadharBackUrl}`
              : null,
          });
        }
      } catch (error) {
        console.error("Error loading application details:", error);
        toast.error("Error loading application details.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [id]);

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
      try {
        const result = await fetchMembersList(searchTerm);
        if (result.success) {
          setProposers(result.data);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        console.error("Error fetching proposers", error);
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

    const optionalFields = new Set([
      "marriage_date",
      "office_address",
      "blood_group",
      "region",
    ]);

    Object.keys(formData).forEach((key) => {
      const isOptionalEmpty = formData[key] === "" && optionalFields.has(key);
      if (!isOptionalEmpty && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (files.applicant_photo)
      formDataToSend.append("applicant_photo", files.applicant_photo);
    if (files.applicant_signature)
      formDataToSend.append("applicant_signature", files.applicant_signature);
    if (files.aadhar_front)
      formDataToSend.append("aadhar_front", files.aadhar_front);
    if (files.aadhar_back)
      formDataToSend.append("aadhar_back", files.aadhar_back);

    try {
      await resubmitApplication(id, formDataToSend);
      toast.success("अर्ज यशस्वीरीत्या अद्यतनित झाला! (Application updated!)");
      navigate("/success");
    } catch (error) {
      const errorMsg =
        error.response?.data?.errors && error.response.data.errors.length > 0
          ? error.response.data.errors.join("\n")
          : error.response?.data?.message || "Update failed. Please try again.";
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Data...
      </div>
    );
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

          <FileUploadField
            id="applicant_photo"
            name="applicant_photo"
            uploadText="पासपोर्ट फोटो"
            hint="(Upload)"
            preview={previews.applicant_photo}
            onChange={handleFileChange}
            wrapperClass="relative"
            containerClass="w-32 h-40 border-2 border-dashed border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
            accept="image/*"
          />
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <FormField
              colSpan="sm:col-span-2"
              id="full_name"
              name="full_name"
              label="पूर्ण नांव"
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <FormField
              colSpan="sm:col-span-2"
              id="father_or_husband_name"
              name="father_or_husband_name"
              label="वडील/पति चे नांव"
              hint="(Father/Husband Name)"
              value={formData.father_or_husband_name}
              onChange={handleChange}
              required
            />

            <FormField
              as="select"
              colSpan="sm:col-span-1"
              id="gender"
              name="gender"
              label="लिंग"
              hint="(Gender)"
              value={formData.gender}
              onChange={handleChange}
              required
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
            />

            <FormField
              type="date"
              colSpan="sm:col-span-1"
              id="date_of_birth"
              name="date_of_birth"
              label="जन्म तारीख"
              hint="(Date of Birth)"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />

            <FormField
              type="date"
              colSpan="sm:col-span-1"
              id="marriage_date"
              name="marriage_date"
              label="विवाह तारीख"
              hint="(Marriage Date)"
              value={formData.marriage_date}
              onChange={handleChange}
            />

            <FormField
              as="select"
              colSpan="sm:col-span-1"
              id="blood_group"
              name="blood_group"
              label="रक्त गट"
              hint="(Blood Group)"
              value={formData.blood_group}
              onChange={handleChange}
              options={[
                { value: "A+", label: "A+" },
                { value: "A-", label: "A-" },
                { value: "B+", label: "B+" },
                { value: "B-", label: "B-" },
                { value: "AB+", label: "AB+" },
                { value: "AB-", label: "AB-" },
                { value: "O+", label: "O+" },
                { value: "O-", label: "O-" },
              ]}
            />

            <FileUploadField
              id="aadhar_front"
              name="aadhar_front"
              label="आधार कार्ड (Front) *"
              uploadText="Upload Front Side"
              preview={previews.aadhar_front}
              onChange={handleFileChange}
            />

            <FileUploadField
              id="aadhar_back"
              name="aadhar_back"
              label="आधार कार्ड (Back) *"
              uploadText="Upload Back Side"
              preview={previews.aadhar_back}
              onChange={handleFileChange}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: Contact & Address */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <FormField
              type="tel"
              pattern="[6-9][0-9]{9}"
              colSpan="sm:col-span-1"
              id="mobile_number"
              name="mobile_number"
              label="मोबाईल"
              hint="(Mobile Number)"
              value={formData.mobile_number}
              onChange={handleChange}
              required
            />
            <FormField
              type="email"
              colSpan="sm:col-span-1"
              id="email"
              name="email"
              label="ई-मेल"
              hint="(Email)"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <FormField
              as="select"
              colSpan="sm:col-span-1"
              id="is_from_raipur"
              name="is_from_raipur"
              label="काय तुम्ही रायपूरचे आहात?"
              hint="(Are you from Raipur?)"
              value={formData.is_from_raipur}
              onChange={(e) => {
                const isFromRaipur = e.target.value === "true";
                setFormData({
                  ...formData,
                  is_from_raipur: isFromRaipur,
                  region: isFromRaipur ? formData.region : "",
                });
              }}
              required
              options={[
                { value: "false", label: "No" },
                { value: "true", label: "Yes" },
              ]}
            />

            {formData.is_from_raipur && (
              <FormField
                as="select"
                colSpan="sm:col-span-1"
                id="region"
                name="region"
                label="क्षेत्र"
                hint="(Region)"
                value={formData.region}
                onChange={handleChange}
                required={formData.is_from_raipur}
                options={regions.map((r) => ({ value: r.name, label: r.name }))}
              />
            )}

            <FormField
              as="textarea"
              rows="2"
              colSpan="sm:col-span-2"
              id="permanent_address"
              name="permanent_address"
              label="स्थाई पत्ता"
              hint="(Permanent Address)"
              value={formData.permanent_address}
              onChange={handleChange}
              required
            />

            <FormField
              as="textarea"
              rows="2"
              colSpan="sm:col-span-2"
              id="current_address"
              name="current_address"
              label="वर्तमान पत्ता"
              hint="(Current Address)"
              value={formData.current_address}
              onChange={handleChange}
              required
            />
          </div>

          <hr className="border-gray-200" />

          {/* Section 3: Professional Details */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
            <FormField
              colSpan="sm:col-span-1"
              id="education"
              name="education"
              label="शैक्षणिक योग्यता"
              hint="(Education)"
              value={formData.education}
              onChange={handleChange}
              required
            />
            <FormField
              colSpan="sm:col-span-1"
              id="occupation"
              name="occupation"
              label="व्यवसाय/नौकरी"
              hint="(Occupation)"
              value={formData.occupation}
              onChange={handleChange}
              required
            />
            <FormField
              as="textarea"
              rows="2"
              colSpan="sm:col-span-2"
              id="office_address"
              name="office_address"
              label="कार्यालयीन पत्ता"
              hint="(Office Address)"
              value={formData.office_address}
              onChange={handleChange}
            />

            <div className="sm:col-span-2 relative mt-4">
              <label
                htmlFor="proposer_member_id"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                आजीव सदस्याचे नाव (Search Proposer Name) *
              </label>
              <input
                id="proposer_member_id"
                type="text"
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value === "")
                    setFormData({ ...formData, proposer_member_id: "" });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 shadow-sm outline-none"
                required={!formData.proposer_member_id}
              />

              {isDropdownOpen && proposers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto">
                  {proposers.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectProposer(member)}
                        className="w-full text-left cursor-pointer py-2 pl-3 hover:bg-orange-100 focus:bg-orange-200 outline-none"
                      >
                        {member.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <FileUploadField
              id="applicant_signature"
              name="applicant_signature"
              uploadText="स्वाक्षरी"
              preview={previews.applicant_signature}
              onChange={handleFileChange}
              wrapperClass="relative shrink-0 mt-6"
              containerClass="w-48 h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors overflow-hidden"
              imgClass="w-full h-full object-contain p-1"
              accept="image/*"
            />
          </div>

          <div className="pt-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md text-white font-bold transition-colors ${
                loading
                  ? "bg-orange-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {loading
                ? "Updating... (कृपया प्रतीक्षा करा...)"
                : "Update Application (अर्ज अद्यतनित करा)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
