import React, { useState, useEffect } from "react";
import {
  submitApplication,
  fetchMembersList,
  fetchActiveRegions,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PropTypes from "prop-types";
import useDebounce from "../hooks/useDebounce";

const applicationSchema = z
  .object({
    full_name: z.string().min(2, "पूरा नाम आवश्यक है (Full name is required)"),
    father_or_husband_name: z.string().min(2, "पिता/पति का नाम आवश्यक है"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({ message: "कृपया लिंग चुनें (Select gender)" }),
    }),
    date_of_birth: z.string().min(1, "जन्म तिथि आवश्यक है"),
    marriage_date: z.string().optional(),
    blood_group: z.string().optional(),
    mobile_number: z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "अमान्य मोबाइल नंबर (Invalid 10-digit mobile number)",
      ),
    email: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "अमान्य ईमेल पता (Invalid email address)",
      ),
    permanent_address: z
      .string()
      .min(5, "स्थाई पता आवश्यक है (Permanent address is required)"),
    current_address: z
      .string()
      .min(5, "वर्तमान पता आवश्यक है (Current address is required)"),
    is_from_raipur: z.enum(["true", "false"]),
    region: z.string().optional(),
    education: z
      .string()
      .min(2, "शैक्षणिक योग्यता आवश्यक है (Education is required)"),
    occupation: z
      .string()
      .min(2, "व्यवसाय/नौकरी आवश्यक है (Occupation is required)"),
    office_address: z.string().optional(),
    proposer_member_id: z
      .string()
      .min(1, "कृपया अनुमोदक चुनें (Select a proposer from the list)"),
    declaration: z.literal(true, {
      errorMap: () => ({
        message: "आपको नियमों से सहमत होना होगा (You must agree to the terms)",
      }),
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.is_from_raipur === "true" &&
      (!data.region || data.region === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "कृपया क्षेत्र चुनें (Select region)",
        path: ["region"],
      });
    }
  });

// --- HELPER HOOKS ---

function useRegions() {
  const [regions, setRegions] = useState([]);
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const result = await fetchActiveRegions();
        if (result.success) setRegions(result.data);
      } catch (error) {
        console.error("Error fetching regions", error);
      }
    };
    loadRegions();
  }, []);
  return regions;
}

function useProposerSearch(debouncedSearchTerm, selectedProposerName) {
  const [proposers, setProposers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingProposers, setLoadingProposers] = useState(false);

  useEffect(() => {
    if (
      debouncedSearchTerm.trim() === "" ||
      debouncedSearchTerm === selectedProposerName
    ) {
      setProposers([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchProposers = async () => {
      setLoadingProposers(true);
      try {
        const result = await fetchMembersList(debouncedSearchTerm);
        if (result.success) {
          setProposers(result.data);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        console.error("Error fetching proposers", error);
      } finally {
        setLoadingProposers(false);
      }
    };
    fetchProposers();
  }, [debouncedSearchTerm, selectedProposerName]);

  return {
    proposers,
    setProposers,
    isDropdownOpen,
    setIsDropdownOpen,
    loadingProposers,
  };
}

// --- UNIFIED UI COMPONENT (REDUCES DUPLICATION TO 0%) ---

const FormField = ({
  label,
  id,
  name,
  register,
  error,
  as = "input",
  options = [],
  wrapperClass,
  ...rest
}) => {
  const fieldClasses = `w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${as === "select" ? "bg-white" : ""} ${error ? "border-red-500" : "border-gray-300"}`;

  // Safely merge React Hook Form's onChange with custom onChange logic
  const { onChange: customOnChange, ...otherRest } = rest;
  const { onChange: hookFormOnChange, ...hookFormProps } = register(name);

  const commonProps = {
    id,
    className: fieldClasses,
    ...hookFormProps,
    onChange: (e) => {
      hookFormOnChange(e);
      if (customOnChange) customOnChange(e);
    },
    ...otherRest,
  };

  return (
    <div className={wrapperClass}>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-700 mb-1"
      >
        {label}
      </label>
      {as === "input" && <input type={rest.type || "text"} {...commonProps} />}
      {as === "select" && (
        <select {...commonProps}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {as === "textarea" && (
        <textarea rows={rest.rows || "2"} {...commonProps} />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  error: PropTypes.shape({ message: PropTypes.string }),
  as: PropTypes.oneOf(["input", "select", "textarea"]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  wrapperClass: PropTypes.string,
};

// --- FILE UPLOAD COMPONENT ---

const FileUploadField = ({
  id,
  name,
  label,
  uploadText,
  preview,
  onChange,
}) => (
  <div className="sm:col-span-1">
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">
      {label} *
    </label>
    <label
      htmlFor={id}
      className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors overflow-hidden"
    >
      {preview ? (
        <img
          src={preview}
          alt={`${label} Preview`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-500 text-sm font-medium">{uploadText}</span>
      )}
      <input
        id={id}
        type="file"
        name={name}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onChange}
      />
    </label>
  </div>
);

FileUploadField.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  uploadText: PropTypes.string.isRequired,
  preview: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// --- PROPOSER SELECTOR ---

const ProposerSelector = ({ setValue, error }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProposerName, setSelectedProposerName] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    proposers,
    setProposers,
    isDropdownOpen,
    setIsDropdownOpen,
    loadingProposers,
  } = useProposerSearch(debouncedSearchTerm, selectedProposerName);

  const handleSelectProposer = (member) => {
    setValue("proposer_member_id", member.id, { shouldValidate: true });
    setSelectedProposerName(member.name);
    setSearchTerm(member.name);
    setProposers([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-orange-50/50 p-6 rounded-md border border-orange-200 mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-orange-200 pb-2">
        अनुमोदक{" "}
        <span className="text-gray-500 font-normal text-sm">
          (Proposer / Reference)
        </span>
      </h3>
      <div className="sm:col-span-2 relative">
        <label
          htmlFor="proposer_search"
          className="block text-sm font-bold text-gray-700 mb-1"
        >
          आजीव सदस्याचे नाव{" "}
          <span className="text-gray-400 font-normal">
            (Search Proposer Name)
          </span>{" "}
          *
        </label>
        <input
          id="proposer_search"
          type="text"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchTerm(newValue);
            if (newValue !== selectedProposerName) {
              setValue("proposer_member_id", "", { shouldValidate: true });
              setSelectedProposerName("");
            }
          }}
          placeholder="Type member name to search..."
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white ${error ? "border-red-500" : "border-gray-300"}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}

        {loadingProposers && (
          <div className="absolute right-3 top-9 text-sm text-gray-400">
            Searching...
          </div>
        )}

        {isDropdownOpen && proposers.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {proposers.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => handleSelectProposer(member)}
                  className="w-full text-left cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-orange-100 focus:bg-orange-200 text-gray-900 outline-none"
                >
                  {member.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {isDropdownOpen &&
          proposers.length === 0 &&
          !loadingProposers &&
          searchTerm && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-red-500 ring-1 ring-black ring-opacity-5">
              No lifetime member found with that name.
            </div>
          )}
      </div>
    </div>
  );
};

ProposerSelector.propTypes = {
  setValue: PropTypes.func.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
};

// --- MAIN COMPONENT ---

export default function MembershipForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: { is_from_raipur: "false" },
  });

  const isFromRaipur = watch("is_from_raipur");
  const regions = useRegions();
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [e.target.name]: file });
      setPreviews({ ...previews, [e.target.name]: URL.createObjectURL(file) });
    }
  };

  const onSubmit = async (data) => {
    if (
      !files.applicant_photo ||
      !files.applicant_signature ||
      !files.aadhar_front ||
      !files.aadhar_back
    ) {
      toast.error(
        "कृपया सभी आवश्यक तस्वीरें अपलोड करें। (Please upload all photos and signatures)",
      );
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== "") {
        formDataToSend.append(key, data[key]);
      }
    });

    formDataToSend.append("membership_type", "LIFETIME");
    formDataToSend.append("applicant_photo", files.applicant_photo);
    formDataToSend.append("applicant_signature", files.applicant_signature);
    formDataToSend.append("aadhar_front", files.aadhar_front);
    formDataToSend.append("aadhar_back", files.aadhar_back);

    try {
      await submitApplication(formDataToSend);
      toast.success("अर्ज यशस्वीरीत्या जमा झाला! (Application submitted!)");
      navigate("/success");
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      const errorMsg =
        error.response?.data?.errors && error.response.data.errors.length > 0
          ? error.response.data.errors.join("\n")
          : error.response?.data?.message ||
            "Submission failed. Please try again.";
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border-t-8 border-orange-600">
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

          <div className="relative">
            <label
              htmlFor="applicant_photo"
              className="cursor-pointer flex flex-col items-center justify-center w-32 h-40 border-2 border-dashed border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
            >
              {previews.applicant_photo ? (
                <img
                  src={previews.applicant_photo}
                  alt="Passport Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <span className="text-gray-500 text-sm font-medium">
                    पासपोर्ट फोटो
                  </span>
                  <span className="text-gray-400 text-xs mt-1">(Upload)</span>
                </>
              )}
              <input
                id="applicant_photo"
                type="file"
                name="applicant_photo"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-8">
          <fieldset
            disabled={loading}
            className="space-y-8 opacity-100 disabled:opacity-70 transition-opacity duration-300"
          >
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <FormField
                wrapperClass="sm:col-span-2"
                id="full_name"
                name="full_name"
                label={
                  <>
                    पूर्ण नांव{" "}
                    <span className="text-gray-400 font-normal">
                      (Full Name)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.full_name}
              />
              <FormField
                wrapperClass="sm:col-span-2"
                id="father_or_husband_name"
                name="father_or_husband_name"
                label={
                  <>
                    वडील/पति चे नांव{" "}
                    <span className="text-gray-400 font-normal">
                      (Father/Husband Name)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.father_or_husband_name}
              />

              <FormField
                as="select"
                wrapperClass="sm:col-span-1"
                id="gender"
                name="gender"
                label={
                  <>
                    लिंग{" "}
                    <span className="text-gray-400 font-normal">(Gender)</span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.gender}
                options={[
                  { value: "", label: "Select..." },
                  { value: "MALE", label: "पुरुष (Male)" },
                  { value: "FEMALE", label: "महिला (Female)" },
                  { value: "OTHER", label: "अन्य (Other)" },
                ]}
              />

              <FormField
                type="date"
                wrapperClass="sm:col-span-1"
                id="date_of_birth"
                name="date_of_birth"
                label={
                  <>
                    जन्म तारीख{" "}
                    <span className="text-gray-400 font-normal">
                      (Date of Birth)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.date_of_birth}
              />
              <FormField
                type="date"
                wrapperClass="sm:col-span-1"
                id="marriage_date"
                name="marriage_date"
                label={
                  <>
                    विवाह तारीख{" "}
                    <span className="text-gray-400 font-normal">
                      (Marriage Date)
                    </span>
                  </>
                }
                register={register}
                error={errors.marriage_date}
              />

              <FormField
                as="select"
                wrapperClass="sm:col-span-1"
                id="blood_group"
                name="blood_group"
                label={
                  <>
                    रक्त गट{" "}
                    <span className="text-gray-400 font-normal">
                      (Blood Group)
                    </span>
                  </>
                }
                register={register}
                error={errors.blood_group}
                options={[
                  { value: "", label: "Select..." },
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
                label="आधार कार्ड (Front)"
                uploadText="Upload Front Side"
                preview={previews.aadhar_front}
                onChange={handleFileChange}
              />
              <FileUploadField
                id="aadhar_back"
                name="aadhar_back"
                label="आधार कार्ड (Back)"
                uploadText="Upload Back Side"
                preview={previews.aadhar_back}
                onChange={handleFileChange}
              />
            </div>

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <FormField
                type="tel"
                wrapperClass="sm:col-span-1"
                id="mobile_number"
                name="mobile_number"
                label={
                  <>
                    मोबाईल{" "}
                    <span className="text-gray-400 font-normal">
                      (Mobile Number)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.mobile_number}
              />
              <FormField
                type="email"
                wrapperClass="sm:col-span-1"
                id="email"
                name="email"
                label={
                  <>
                    ई-मेल{" "}
                    <span className="text-gray-400 font-normal">(Email)</span> *
                  </>
                }
                register={register}
                error={errors.email}
              />

              <FormField
                as="textarea"
                wrapperClass="sm:col-span-2"
                id="permanent_address"
                name="permanent_address"
                label={
                  <>
                    स्थाई पत्ता{" "}
                    <span className="text-gray-400 font-normal">
                      (Permanent Address)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.permanent_address}
              />

              <FormField
                as="textarea"
                wrapperClass="sm:col-span-2"
                id="current_address"
                name="current_address"
                label={
                  <>
                    वर्तमान पत्ता{" "}
                    <span className="text-gray-400 font-normal">
                      (Current Address)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.current_address}
              />
            </div>

            {/* Custom Handling for Location & Region utilizing the Unified FormField */}
            <div className="sm:col-span-1">
              <FormField
                as="select"
                wrapperClass=""
                id="is_from_raipur"
                name="is_from_raipur"
                label={
                  <>
                    काय तुम्ही रायपूरचे आहात?{" "}
                    <span className="text-gray-400 font-normal">
                      (Are you from Raipur?)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.is_from_raipur}
                onChange={(e) => {
                  if (e.target.value === "false") {
                    setValue("region", "");
                  }
                }}
                options={[
                  { value: "false", label: "No" },
                  { value: "true", label: "Yes" },
                ]}
              />
            </div>

            {isFromRaipur === "true" && (
              <FormField
                as="select"
                wrapperClass="sm:col-span-1 mt-6"
                id="region"
                name="region"
                label={
                  <>
                    क्षेत्र{" "}
                    <span className="text-gray-400 font-normal">(Region)</span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.region}
                options={[
                  { value: "", label: "Select Region..." },
                  ...regions.map((r) => ({ value: r.name, label: r.name })),
                ]}
              />
            )}

            <hr className="border-gray-200 mt-6" />

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 mt-6">
              <FormField
                wrapperClass="sm:col-span-1"
                id="education"
                name="education"
                label={
                  <>
                    शैक्षणिक योग्यता{" "}
                    <span className="text-gray-400 font-normal">
                      (Education)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.education}
              />
              <FormField
                wrapperClass="sm:col-span-1"
                id="occupation"
                name="occupation"
                label={
                  <>
                    व्यवसाय/नौकरी{" "}
                    <span className="text-gray-400 font-normal">
                      (Occupation)
                    </span>{" "}
                    *
                  </>
                }
                register={register}
                error={errors.occupation}
              />
              <FormField
                as="textarea"
                wrapperClass="sm:col-span-2"
                id="office_address"
                name="office_address"
                label={
                  <>
                    कार्यालयीन पत्ता{" "}
                    <span className="text-gray-400 font-normal">
                      (Office Address)
                    </span>
                  </>
                }
                register={register}
                error={errors.office_address}
              />
            </div>

            <ProposerSelector
              setValue={setValue}
              error={errors.proposer_member_id}
            />

            <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mt-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-medium mb-4 leading-relaxed">
                  (संविधानाची प्रत वाचावी) <br />
                  मला मराठी बोलता व वाचता येते आणि संविधाना प्रमाणे मंडळाचा
                  सदस्य होण्यास पात्र आहे. मी मंडळाचे नियमांचे पालन करीन.
                </p>
                <div className="flex items-start">
                  <input
                    id="declaration"
                    type="checkbox"
                    {...register("declaration")}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-0.5"
                  />
                  <div className="ml-3 flex flex-col">
                    <label
                      htmlFor="declaration"
                      className="block text-sm font-bold text-gray-900"
                    >
                      I agree to the terms and conditions of the Maharashtra
                      Mandal.
                    </label>
                    {errors.declaration && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.declaration.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative shrink-0">
                <label
                  htmlFor="applicant_signature"
                  className="cursor-pointer flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-400 rounded-md bg-white hover:bg-gray-100 transition-colors overflow-hidden"
                >
                  {previews.applicant_signature ? (
                    <img
                      src={previews.applicant_signature}
                      alt="Signature Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <>
                      <span className="text-gray-600 text-sm font-bold">
                        स्वाक्षरी
                      </span>
                      <span className="text-gray-400 text-xs mt-1">
                        (Upload Signature)
                      </span>
                    </>
                  )}
                  <input
                    id="applicant_signature"
                    type="file"
                    name="applicant_signature"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}`}
              >
                {loading
                  ? "Uploading files... (कृपया प्रतीक्षा करा...)"
                  : "Submit Application (अर्ज जमा करा)"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
