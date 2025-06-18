import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrash,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import axios from "axios";

const UpdateItem = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    item_name: "",
    item_price: "",
    category: 1,
  });
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [itemHistory, setItemHistory] = useState([]);
  const [showItemHistory, setShowItemHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // API Functions Declared Within the Component
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access");
    if (!token) {
      throw new Error("No access token found.");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/items/",
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Fetch items error:", error);
      throw error.response
        ? error.response.data
        : "Failed to fetch items. Please try again later";
    }
  };

  const addItem = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/items/",
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Add item error:", error);
      throw error.response
        ? error.response.data
        : "Failed to add item. Please try again later";
    }
  };

  const updateItem = async (id, data) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/items/${id}/`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Update item error:", error);
      throw error.response
        ? error.response.data
        : "Failed to update item. Please try again later";
    }
  };

  const deleteItem = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/items/${id}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Delete item error:", error);
      throw error.response
        ? error.response.data
        : "Failed to delete item. Please try again later";
    }
  };

  const fetchItemPriceHistory = async (itemId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/items/${itemId}/price-history/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Fetch item price history error:", error);
      throw error.response
        ? error.response.data
        : "Failed to fetch item price history. Please try again later";
    }
  };

  // Decode JWT to get user ID
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Error decoding JWT:", err);
      return null;
    }
  };

  // Get current user ID from JWT and fetch items
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const payload = decodeJWT(token);
    if (payload && payload.user_id) setCurrentUserId(payload.user_id);

    const fetchAndSetItems = async () => {
      try {
        const data = await axios.get(
          "http://localhost:8000/api/items/",
          getAuthHeaders()
        );
        setItems(data.data || data);
        setError(null);
      } catch (error) {
        setError(error.message || "Failed to fetch items");
      }
    };

    fetchAndSetItems();
  }, []);

  // Fetch all price history
  const fetchHistory = async () => {
    try {
      const items = await fetchItems();
      const allHistory = [];
      for (const item of items) {
        const history = await fetchItemPriceHistory(item.id);
        history.forEach((entry) => {
          allHistory.push({ ...entry, item_name: item.item_name });
        });
      }
      setHistory(
        allHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
      setShowHistory(true);
      setError(null);
    } catch (error) {
      console.error("Error fetching history:", error);
      setError(error.message || "Failed to fetch history");
    }
  };

  // Fetch specific item price history
  const fetchItemHistory = async (item) => {
    try {
      const history = await fetchItemPriceHistory(item.id);
      setItemHistory(
        history.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
      setSelectedItem(item);
      setShowItemHistory(true);
      setError(null);
    } catch (error) {
      console.error("Error fetching item history:", error);
      setError(error.message || "Failed to fetch item history");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      item_name: item.item_name,
      item_price: item.item_price.toString(),
      category: item.category || 1,
    });
    setError(null);
  };

  const handleDelete = async (id) => {
    const originalItems = [...items];
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);

    if (formData.id === id) {
      handleCancel();
    }

    try {
      await deleteItem(id);
      setError(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      setItems(originalItems); // Revert on error
      setError(error.message || "Failed to delete item");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.item_name.trim()) {
      setError("Item name is required");
      return;
    }
    if (
      !formData.item_price ||
      isNaN(parseFloat(formData.item_price)) ||
      parseFloat(formData.item_price) <= 0
    ) {
      setError("Price must be a positive number");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      console.error("No access token found.");
      return;
    }

    const payload = {
      item_name: formData.item_name.trim(),
      item_price: parseFloat(formData.item_price),
      category: parseInt(formData.category),
      created_user: currentUserId,
    };

    const originalItems = [...items]; // Store original state for reversion
    let updatedItems;

    try {
      if (formData.id) {
        // Optimistic update for editing
        updatedItems = items.map((item) =>
          item.id === formData.id ? { ...item, ...payload } : item
        );
        setItems(updatedItems);
        await updateItem(formData.id, payload);
      } else {
        // Optimistic update for adding
        const newItem = { id: Date.now(), ...payload }; // Temporary ID for optimistic update
        updatedItems = [...items, newItem];
        setItems(updatedItems);
        const response = await addItem(payload);
        // Update the item with the actual ID from the backend
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === newItem.id ? { ...item, id: response.id } : item
          )
        );
      }
      handleCancel();
      setError(null);
    } catch (error) {
      console.error("Error saving item:", error);
      setItems(originalItems); // Revert on error
      setError(error.message || "Failed to save item");
    }
  };

  const handleCancel = () => {
    setFormData({ id: null, item_name: "", item_price: "", category: 1 });
    setError(null);
  };

  return (
    <div className="flex min-h-screen font-sans bg-blue-50">
      <div className="flex-1 p-8">
        <div className="bg-white p-6 rounded shadow">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Item List</h3>
            <button
              onClick={fetchHistory}
              className="bg-teal-700 text-white px-4 py-1 rounded shadow flex items-center gap-1"
            >
              📜 All History
            </button>
          </div>

          <div className="flex flex-row items-start gap-6">
            <div className="w-2/3 overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2">S.No</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{item.item_name}</td>
                      <td className="p-2">₹ {item.item_price}</td>
                      <td className="p-2 space-x-4">
                        <button onClick={() => handleEdit(item)}>
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            className="text-gray-600 hover:text-teal-700"
                          />
                        </button>
                        <button onClick={() => handleDelete(item.id)}>
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-gray-600 hover:text-red-500"
                          />
                        </button>
                        <button onClick={() => fetchItemHistory(item)}>
                          <FontAwesomeIcon
                            icon={faHistory}
                            className="text-gray-600 hover:text-blue-500"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-1/3 border-l pl-6">
              <h3 className="text-lg font-bold mb-4">
                {formData.id ? "Update Item" : "Add Item"}
              </h3>
              <div>
                <label className="block text-gray-600 mb-1">Item Name</label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="Enter item name"
                  className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
                />
              </div>
              <div className="mt-4">
                <label className="block text-gray-600 mb-1">Price</label>
                <input
                  type="number"
                  name="item_price"
                  value={formData.item_price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
                />
              </div>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleCancel}
                  className="bg-gray-400 text-white px-4 py-1 rounded shadow"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-teal-700 text-white px-4 py-1 rounded shadow"
                >
                  {formData.id ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {showHistory && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">All Price History</h3>
                {history.length ? (
                  <ul className="space-y-2">
                    {history.map((entry) => (
                      <li key={entry.id} className="text-gray-700">
                        {entry.item_name} - ₹ {entry.price} on{" "}
                        {dayjs(entry.date).format("DD/MM/YYYY")}
                        {entry.is_updated && (
                          <span className="text-blue-500 ml-2">[updated]</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No history available</p>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="mt-4 bg-teal-700 text-white px-4 py-1 rounded shadow"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showItemHistory && selectedItem && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">
                  Price History for {selectedItem.item_name}
                </h3>
                {itemHistory.length ? (
                  <ul className="space-y-2">
                    {itemHistory.map((entry) => (
                      <li key={entry.id} className="text-gray-700">
                        ₹ {entry.price} on{" "}
                        {dayjs(entry.date).format("DD/MM/YYYY")}
                        {entry.is_updated && (
                          <span className="text-blue-500 ml-2">[updated]</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No history available for {selectedItem.item_name}</p>
                )}
                <button
                  onClick={() => setShowItemHistory(false)}
                  className="mt-4 bg-teal-700 text-white px-4 py-1 rounded shadow"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateItem;
