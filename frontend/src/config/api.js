const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// API Service
export const api = {
  // ========== Auth Endpoints ==========

  sendOTP: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  verifyOTPAndRegister: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  forgotPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  resetPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  login: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  adminLogin: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  deleteAccount: async (confirmText) => {
    const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmText }),
    });
    return response.json();
  },

  // ========== Admin Endpoints ==========

  getPendingReports: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/pending`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  getAllReports: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/all`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  approveReport: async (reportId) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  rejectReport: async (reportId) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  deleteReport: async (reportId) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  getAdminItems: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/items`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  deleteAdminItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  getAdminStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  // ========== Items Endpoints ==========

  getItems: async (speciality = '') => {
    const url = speciality
      ? `${API_BASE_URL}/items?speciality=${encodeURIComponent(speciality)}`
      : `${API_BASE_URL}/items`;
    const response = await fetch(url);
    return response.json();
  },

  getItem: async (id) => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    return response.json();
  },

  createItem: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });

    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return response.json();
  },

  // ========== Appointments Endpoints ==========

  bookAppointment: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });

    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return response.json();
  },

  getMyAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments/my-appointments`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  cancelAppointment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  // ========== User Endpoints ==========

  getUserProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.json();
  },

  updateProfile: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return response.json();
  },

  // ✅ NEW — Update Profile Image
  updateProfileImage: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/users/profile/image`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });
    return response.json();
  },

  changePassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  submitReport: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });

    const response = await fetch(`${API_BASE_URL}/users/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return response.json();
  },
};

export default api;
