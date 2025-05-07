import axios from 'axios';

// Set up Axios instance
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
  try {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('jwtToken', token);
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      localStorage.removeItem('jwtToken');
    }
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
};

// ✅ Auth APIs
export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post('/login/', { email, password });
    setAuthToken(response.data.access); // Store token after login
    localStorage.setItem('refreshToken', response.data.refresh); // Store refresh token
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response ? error.response.data : 'Login failed, please try again';
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/register/', userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error.response ? error.response.data : 'Registration failed, please try again';
  }
};

export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/logout/');
    setAuthToken(null); // Clear token on logout
    localStorage.removeItem('refreshToken'); // Remove refresh token on logout
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error.response ? error.response.data : 'Logout failed, please try again';
  }
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
  } catch (error) {
    console.error("Token refresh error:", error);
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Redirect to login on token failure
    return false;
  }
};

// 📦 EXPENSE APIs
// ✅ GET all expenses (admin or user based)
export const fetchExpenses = async () => {
  try {
    const response = await axiosInstance.get('/expenses/');
    return response.data;
  } catch (error) {
    console.error("Fetch expenses error:", error);
    throw error.response ? error.response.data : 'Failed to fetch expenses. Please try again later';
  }
};

// ✅ POST new expense with optional file upload
export const addExpense = async (data) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }

    const response = await axiosInstance.post('/expenses/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Axios automatically sets this, but it's good practice to specify it here
      },
    });

    return response.data;
  } catch (error) {
    console.error("Add expense error:", error);
    throw error.response ? error.response.data : 'Failed to add expense. Please try again later';
  }
};

// ✅ PUT update an existing expense
export const updateExpense = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/expenses/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Update expense error:", error);
    throw error.response ? error.response.data : 'Failed to update expense. Please try again later';
  }
};

// ✅ DELETE an expense
export const deleteExpense = async (id) => {
  try {
    const response = await axiosInstance.delete(`/expenses/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Delete expense error:", error);
    throw error.response ? error.response.data : 'Failed to delete expense. Please try again later';
  }
};

// ✅ Fetch order items by date and user
export const fetchOrderItemsByDate = async (date, user) => {
  try {
    const response = await axiosInstance.get(`/orders/items_by_date/?date=${date}&user=${user}`);
    return response.data;
  } catch (error) {
    console.error("Fetch order items error:", error);
    throw error.response ? error.response.data : 'Failed to fetch order items. Please try again later';
  }
};

// ✅ DELETE all orders for a specific date and user
export const deleteOrdersByDate = async (date, user) => {
  try {
    const response = await axiosInstance.delete(`/orders/${date}/${user}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting orders:', error);
    throw error.response ? error.response.data : 'Failed to delete orders. Please try again later';
  }
};

// ✅ Get grouped orders
export const getGroupedOrders = async (page, pageSize, filters) => {
  try {
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });

    const response = await axiosInstance.get(`/orders/grouped-by-date/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get grouped orders error:', error);
    throw error.response ? error.response.data : 'Failed to fetch grouped orders. Please try again later';
  }
};


// ✅ Fetch available dates (example)
export const getAvailableDates = async () => {
  try {
    const response = await axiosInstance.get('/orders/available-dates/');

    return response.data;
  } catch (error) {
    console.error("Fetch available dates error:", error);
    throw error.response ? error.response.data : 'Failed to fetch available dates. Please try again later';
  }
};

// Global error handling for axios responses
axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response) {
      // Check for 401 (Unauthorized) and attempt to refresh token
      if (error.response.status === 401) {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          // Retry the original request with the new token
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('jwtToken')}`;
          return axiosInstance(originalRequest);
        } else {
          window.location.href = '/login'; // Redirect to login on token failure
        }
      }
    } else {
      console.error('API error: ', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
