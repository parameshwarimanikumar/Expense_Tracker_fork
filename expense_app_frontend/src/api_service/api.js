import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Set token from localStorage on load
const storedToken = localStorage.getItem('jwtToken');
if (storedToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// ✅ Set Auth Token (Login/Register)
export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwtToken', token);
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwtToken');
  }
};

// ✅ Auth APIs
export const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/login/', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/register/', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post('/logout/');
  return response.data;
};

// 🔄 Token Refresh
export const attemptTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axiosInstance.post('/token/refresh/', {
      refresh: refreshToken,
    });

    setAuthToken(response.data.access);
    return true;
  } catch {
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return false;
  }
};

//
// 📦 EXPENSE APIs
//

// ✅ GET all expenses (admin or user based)
export const fetchExpenses = async () => {
  const response = await axiosInstance.get('/expenses/');
  return response.data;
};

// ✅ POST new expense with optional file upload
export const addExpense = async (data) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }

  const response = await axiosInstance.post('/expenses/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// ✅ PUT update an existing expense
export const updateExpense = async (id, data) => {
  const response = await axiosInstance.put(`/expenses/${id}/`, data);
  return response.data;
};

// ✅ DELETE an expense
export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}/`);
  return response.data;
};

export default axiosInstance;
