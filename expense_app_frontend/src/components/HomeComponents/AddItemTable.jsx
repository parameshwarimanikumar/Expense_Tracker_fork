import React, { useState, useEffect } from "react";
import axios from "axios";
import ItemRow from "../HomeComponents/ItemRow";
import dayjs from "dayjs";

// Axios instance setup
const axiosInstance = axios.create({
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set token from localStorage on load
const storedToken = localStorage.getItem("jwtToken");
if (storedToken) {
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
}

// Set Auth Token function
const setAuthToken = (token) => {
  try {
    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("jwtToken", token);
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
    }
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
};

// Token Refresh function
const attemptTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await axiosInstance.post("http://127.0.0.1:8000/api/token/refresh/", {
      refresh: refreshToken,
    });

    setAuthToken(response.data.access);
    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    setAuthToken(null);
    localStorage.removeItem("refreshToken");
    window.location.href = "/login"; // Redirect to login on token failure
    return false;
  }
};

// API functions
const fetchItems = async () => {
  try {
    const response = await axiosInstance.get("http://127.0.0.1:8000/api/items/");
    return response.data;
  } catch (error) {
    console.error("Fetch items error:", error);
    throw error.response ? error.response.data : "Failed to fetch items. Please try again later";
  }
};

const addOrder = async (data) => {
  try {
    const response = await axiosInstance.post("http://127.0.0.1:8000/api/orders/", data);
    return response.data;
  } catch (error) {
    console.error("Add order error:", error);
    throw error.response ? error.response.data : "Failed to add order. Please try again later";
  }
};

const fetchOrders = async () => {
  try {
    const response = await axiosInstance.get("http://127.0.0.1:8000/api/orders/");
    return response.data;
  } catch (error) {
    console.error("Fetch orders error:", error);
    throw error.response ? error.response.data : "Failed to fetch orders. Please try again later";
  }
};

// Axios interceptor to handle 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          const originalRequest = error.config;
          originalRequest.headers["Authorization"] = `Bearer ${localStorage.getItem("jwtToken")}`;
          return axiosInstance(originalRequest);
        }
      }
      console.error("API error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });
    } else {
      console.error("Network error:", error.message);
    }
    return Promise.reject(error);
  }
);

const AddItemTable = ({ editMode, editingData, onCancel, onUpdateSuccess }) => {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch items and orders on mount and when currentUser changes
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchAllItems = async () => {
      setLoadingItems(true);
      try {
        const data = await fetchItems();
        setAllItems(data);
        setError(null);
      } catch (error) {
        setError(error.message || "Failed to fetch items.");
      } finally {
        setLoadingItems(false);
      }
    };

    const fetchUserOrders = async () => {
      setLoadingOrders(true);
      try {
        const data = await fetchOrders();
        // Defensive check to avoid error on undefined order_items
        const userOrders = data
          .filter((order) => order.created_user === currentUser.id)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setSubmittedOrders(userOrders);
        setError(null);
      } catch (error) {
        setError(error.message || "Failed to fetch orders.");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchAllItems();
    fetchUserOrders();

    if (editMode && editingData) {
      setItems(
        (editingData.order_items || []).map((item) => ({
          id: item.id,
          item_id: item.item,
          item_name: item.item_name,
          count: item.count,
          price: item.item_price,
          total: item.count * item.item_price,
        }))
      );
      setSelectedDate(dayjs(editingData.added_date || new Date()));
    } else {
      setItems([{ item_id: null, item_name: "", count: 1, price: 0, total: 0 }]);
    }
  }, [editMode, editingData, currentUser?.id]);

  // Calculate total price
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    setTotalPrice(total);
  }, [items]);

  const addRow = () => {
    setItems([...items, { item_id: null, item_name: "", count: 1, price: 0, total: 0 }]);
  };

  const updateItem = (index, updatedItem) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItem,
      total: updatedItem.count * updatedItem.price,
    };
    setItems(updatedItems);
  };

  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDateChange = (e) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || items.some((item) => !item.item_id || item.count <= 0)) {
      setError("Please select an item and enter a valid count for all entries.");
      return;
    }
    if (!selectedDate) {
      setError("Please select a valid date.");
      return;
    }

    const payload = {
      created_user: currentUser?.id,
      added_date: selectedDate.format("YYYY-MM-DD"),
      order_items: items.map((item) => ({
        item: item.item_id,
        count: item.count,
      })),
    };

    try {
      const newOrder = await addOrder(payload);
      console.log("Order added successfully:", newOrder);

      // Refresh order list
      const updatedOrders = await fetchOrders();
      const userOrders = updatedOrders
        .filter((order) => order.created_user === currentUser?.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setSubmittedOrders(userOrders);

      // Reset form
      setItems([{ item_id: null, item_name: "", count: 1, price: 0, total: 0 }]);
      setSelectedDate(dayjs());

      if (onUpdateSuccess) onUpdateSuccess();
      setError(null);
    } catch (error) {
      setError(error.message || "Failed to add order. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-[#1e2a52] mb-4">
        {editMode ? "Edit Order" : "Add New Order"}
      </h3>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <label className="text-[#1e2a52] font-semibold mr-2">Select Date:</label>
        <input
          type="date"
          value={selectedDate.format("YYYY-MM-DD")}
          onChange={handleDateChange}
          className="border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none"
        />
      </div>

      {loadingItems ? (
        <div>Loading items...</div>
      ) : (
        <table className="w-full table-auto mb-6">
          <thead>
            <tr className="text-[#1e2a52]">
              <th className="border-b px-3 py-2">Item Name</th>
              <th className="border-b px-3 py-2">Count</th>
              <th className="border-b px-3 py-2">Price</th>
              <th className="border-b px-3 py-2">Total</th>
              <th className="border-b px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <ItemRow
                key={index}
                index={index}
                items={allItems}
                item={item}
                onUpdate={(updatedItem) => updateItem(index, updatedItem)}
                onDelete={() => deleteItem(index)}
              />
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={addRow}
        className="mb-4 bg-[#1e2a52] text-white rounded-full px-4 py-2 hover:bg-[#14203f]"
      >
        Add Item
      </button>

      <div className="mb-6 text-lg font-semibold text-[#1e2a52]">
        Total Price: ₹{totalPrice.toFixed(2)}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          className="bg-[#1e2a52] text-white rounded-full px-4 py-2 hover:bg-[#14203f]"
        >
          {editMode ? "Update Order" : "Submit Order"}
        </button>
        {editMode && (
          <button
            onClick={onCancel}
            className="bg-gray-300 text-[#1e2a52] rounded-full px-4 py-2 hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>

      <hr className="my-6" />

      <h4 className="text-lg font-bold text-[#1e2a52] mb-3">Submitted Orders</h4>
      {loadingOrders ? (
        <p>Loading orders...</p>
      ) : (
        <ul>
          {submittedOrders.length === 0 && <li>No orders submitted yet.</li>}
          {submittedOrders.map((order) => (
            <li key={order.id} className="mb-2">
              Date: {dayjs(order.added_date).format("DD MMM YYYY")} - Items:{" "}
              {(order.order_items || []).length} - Total: ₹
              {(order.order_items || []).reduce(
                (acc, item) => acc + item.count * item.item_price,
                0
              ).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddItemTable;
