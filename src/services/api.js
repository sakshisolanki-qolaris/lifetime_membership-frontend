import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("Session expired or unauthorized. Logging out...");
      // Clear UI flags instead of the token
      localStorage.removeItem('adminLoggedIn'); 
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const submitApplication = async (formData) => {
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


export const checkPaymentStatus = async (applicant_id) => {
  const response = await apiClient.get(`/payments/status/${applicant_id}`);
  return response.data;
};

// --- ADMIN API CALLS ---


export const adminLogin = async (phone, password) => {
  
  const response = await apiClient.post('/admins/login', { phone_number: phone, 
    password: password});
  return response.data;
};


export const fetchAllApplicants = async () => {
 
  const response = await apiClient.get('/applicants');
  return response.data;
};

export const fetchApplicantById = async (id) => {
  const response = await apiClient.get(`/applicants/${id}`);
  return response.data;
};

export const resubmitApplication = async (id, formData) => {
  const response = await apiClient.put(`/applicants/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const promoteApplicant = async (applicant_id, registration_number) => {
  const response = await apiClient.post('/admins/promote', 
    { applicant_id, registration_number }
  );
  return response.data;
};

export const fetchAllMembers = async () => {
  const response = await apiClient.get('/admins/all-members');
  return response.data;
};


export const toggleMemberStatus = async (id) => {
  const response = await apiClient.patch(`/admins/members/${id}/status`, {});
  return response.data;
};



export const downloadIdCard = async (id) => {
  const response = await apiClient.get(`/admins/members/${id}/id-card`, {
    responseType: 'blob' 
  });
  return response.data;
};

export const updateMembershipFee = async (amount) => {
  const response = await apiClient.patch('/admins/settings/update-fee', { amount });
  return response.data;
};


export const fetchCurrentFee = async () => {
  try {
    const response = await apiClient.get('/payments/fee');
    return response.data;
  } catch (err) {
    console.error("Fee API Error:", err);
    return { fee: 1510 }; 
  }
};



export const editApplicantByAdmin = async (id, updateData) => {
  const response = await apiClient.put(`/admins/applicants/${id}/edit`, updateData);
  return response.data;
};


export const reviewApplicantByAdmin = async (id, action) => {
  const response = await apiClient.post(`/admins/applicants/${id}/review`, { action });
  return response.data;
};



export const fetchActiveRegions = async () => {
  const response = await apiClient.get('/regions');
  return response.data;
};


export const fetchMemberById = async (id) => {
  const response = await apiClient.get(`/admins/members/${id}`);
  return response.data;
};