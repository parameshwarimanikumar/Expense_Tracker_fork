import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/'; // Your Django backend URL

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Store token in localStorage/sessionStorage
    localStorage.setItem('jwtToken', token);
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwtToken');
  }
};

// Login API
export const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/login/', {
    email,
    password,
  });
  return response.data;
};

// Register API
export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/register/', userData);
  return response.data;
};

// Logout API
export const logoutUser = async () => {
  const response = await axiosInstance.post('/logout/');
  return response.data;
};

// Recently Added API
export const RecentlyAdded = async () => {
  const response = await axiosInstance.get('/order-summary/');
  return response.data;
};


// 🔹 Get all items (tea, Coffee)
export const fetchItems = async () => {
  const response = await axiosInstance.get('/items/');
  return response.data;
};


// Initialize auth token if exists
const token = localStorage.getItem('jwtToken');
if (token) {
  setAuthToken(token);
}


// Token refresh function
const attemptTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    
    const response = await axiosInstance.post('/token/refresh/', {
      refresh: refreshToken
    });
    
    setAuthToken(response.data.access);
    return true;
  } catch (refreshError) {
    // Clear tokens and redirect to login
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return false;
  }
};


// Get order items by date and user
export const fetchOrderItemsByDate = async (date, username) => {
  const response = await axiosInstance.get(`/orders-by-date/?date=${date}&username=${username}`);
  return response.data;
};



export const submitOrder = async (payload) => {
  try {
    const response = await axiosInstance.post('/orders/', payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting order:', error.response?.data || error.message);
    throw error;
  }
};



export const deleteOrder = async (orderId) => {
  const response = await axiosInstance.delete(`/orders/${orderId}/delete/`);
  return response.data;
};



export const deleteOrdersByDate = async (date, username) => {
  return axiosInstance.delete(`/orders/delete-by-date/?date=${date}&username=${username}`);
};



// Get orders grouped by date with pagination and filters
export const getGroupedOrders = async (page = 1, pageSize = 10, filters = {}) => {
  const params = {
    page,
    page_size: pageSize,
    ...filters
  };
  
  try {
    const response = await axiosInstance.get('/orders/grouped-by-date/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching grouped orders:', error);
    throw error;
  }
};

// Get available dates for filter dropdowns
export const getAvailableDates = async () => {
  try {
    const response = await axiosInstance.get('/orders/available-dates/');
    return response.data;
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
};