import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const submitApplication = async (formData) => {
  // We use multipart/form-data because of the file uploads (multer on backend)
  const response = await apiClient.post('/applicants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchApprovalDetails = async (token, role) => {
  const response = await apiClient.get(`/approvals/verify/${token}?role=${role}`);
  return response.data;
};

export const submitApproval = async (role, token, action) => {
  // role should be 'member' or 'president' matching your backend routes
  const response = await apiClient.post(`/approvals/${role.toLowerCase()}`, { token, action });
  return response.data;
};

export const createPaymentOrder = async (applicant_id) => {
  const response = await apiClient.post('/payments/create-order', { applicant_id });
  return response.data;
};

export const verifyPayment = async (paymentDetails) => {
  const response = await apiClient.post('/payments/verify', paymentDetails);
  return response.data;
};


export const fetchMembersList = async (searchTerm = "") => {
  const response = await apiClient.get(`/admins/members?search=${searchTerm}`);
  return response.data; 
};

// Checks if the applicant has already paid
export const checkPaymentStatus = async (applicant_id) => {
  const response = await apiClient.get(`/payments/status/${applicant_id}`);
  return response.data;
};

// --- ADMIN API CALLS ---

// 1. Admin Login
export const adminLogin = async (phone, password) => {
  // Update '/auth/login' to match your actual backend admin login route
  const response = await apiClient.post('/admins/login', { phone_number: phone, 
    password: password});
  return response.data;
};

// 2. Fetch All Applicants (Protected)
export const fetchAllApplicants = async () => {
  const token = localStorage.getItem('adminToken');
  
  // Update '/applicants' to match your backend route that lists everyone
  const response = await apiClient.get('/applicants', {
    headers: {
      Authorization: `Bearer ${token}` 
    }
  });
  return response.data;
};

export const fetchApplicantById = async (id) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.get(`/applicants/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const resubmitApplication = async (id, formData) => {
  const response = await apiClient.put(`/applicants/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const promoteApplicant = async (applicant_id, registration_number) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.post('/admins/promote', 
    { applicant_id, registration_number },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const fetchAllMembers = async () => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.get('/admins/all-members', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


export const toggleMemberStatus = async (id) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.patch(`/admins/members/${id}/status`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


//exceptional
export const downloadIdCard = async (id) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.get(`/admins/members/${id}/id-card`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob' // Required for handling binary files
  });
  return response.data;
};

export const updateMembershipFee = async (amount) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.patch('/admins/settings/update-fee', { amount }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


export const fetchCurrentFee = async () => {
  try {
    const response = await apiClient.get('/payments/fee');
    console.log("Fee API Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Fee API Error:", err);
    return { fee: 1510 }; // Fallback based on your backend default
  }
};


// Admin: Edit Applicant Details manually
export const editApplicantByAdmin = async (id, updateData) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.put(`/admins/applicants/${id}/edit`, updateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Admin: Approve or Reject Application
export const reviewApplicantByAdmin = async (id, action) => {
  const token = localStorage.getItem('adminToken');
  const response = await apiClient.post(`/admins/applicants/${id}/review`, { action }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


// Fetch active regions for the dropdown
export const fetchActiveRegions = async () => {
  const response = await apiClient.get('/regions');
  return response.data;
};