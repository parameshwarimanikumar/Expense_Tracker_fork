import axios from 'axios';

// Set up Axios instance
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';


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

// ✅ Set Auth Token
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

// ✅ Login API
export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post('/login/', { email, password });
    setAuthToken(response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response ? error.response.data : 'Login failed, please try again';
  }
};

// ✅ Register API
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/register/', userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error.response ? error.response.data : 'Registration failed, please try again';
  }
};

// ✅ Logout API — sends refresh_token
export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('jwtToken');

    if (!refreshToken || !accessToken) {
      throw new Error('Missing tokens');
    }

    await axios.post(`${BASE_URL}logout/`, {
      refresh_token: refreshToken,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error) {
    console.error("Logout error:", error);
    throw error.response?.data || 'Logout failed';
  }
};

// ✅ Token Refresh
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
    window.location.href = '/login';
    return false;
  }
};

// 📦 EXPENSE APIs

export const fetchExpenses = async () => {
  try {
    const response = await axiosInstance.get('/expenses/');
    return response.data;
  } catch (error) {
    console.error("Fetch expenses error:", error);
    throw error.response ? error.response.data : 'Failed to fetch expenses.';
  }
};

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
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error("Add expense error:", error);
    throw error.response ? error.response.data : 'Failed to add expense.';
  }
};

export const updateExpense = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/expenses/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Update expense error:", error);
    throw error.response ? error.response.data : 'Failed to update expense.';
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await axiosInstance.delete(`/expenses/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Delete expense error:", error);
    throw error.response ? error.response.data : 'Failed to delete expense.';
  }
};

export const fetchOrderItemsByDate = async (date, user) => {
  try {
    const response = await axiosInstance.get(`/orders/items_by_date/?date=${date}&user=${user}`);
    return response.data;
  } catch (error) {
    console.error("Fetch order items error:", error);
    throw error.response ? error.response.data : 'Failed to fetch order items.';
  }
};

export const deleteOrdersByDate = async (date, user) => {
  try {
    const response = await axiosInstance.delete(`/orders/${date}/${user}`);
    return response.data;
  } catch (error) {
    console.error('Delete orders error:', error);
    throw error.response ? error.response.data : 'Failed to delete orders.';
  }
};

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
    throw error.response ? error.response.data : 'Failed to fetch grouped orders.';
  }
};

export const getAvailableDates = async () => {
  try {
    const response = await axiosInstance.get('/orders/available-dates/');
    return response.data;
  } catch (error) {
    console.error("Fetch available dates error:", error);
    throw error.response ? error.response.data : 'Failed to fetch available dates.';
  }
};

// 🔄 Axios interceptor for auto token refresh
axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        const originalRequest = error.config;
        originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('jwtToken')}`;
        return axiosInstance(originalRequest);
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
