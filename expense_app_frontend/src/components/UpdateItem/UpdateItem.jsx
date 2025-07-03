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
  const [categories, setCategories] = useState([]);
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access");
    if (!token) throw new Error("No access token found.");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

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

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const payload = decodeJWT(token);
    if (payload?.user_id) setCurrentUserId(payload.user_id);

    (async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          axios.get("http://localhost:8000/api/categories/", getAuthHeaders()),
          axios.get("http://localhost:8000/api/items/", getAuthHeaders()),
        ]);
        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
        setError(null);
      } catch {
        setError("Failed to load initial data");
      }
    })();
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      showHistory || showItemHistory ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showHistory, showItemHistory]);

  const addItem = async (data) => {
    const response = await axios.post(
      "http://localhost:8000/api/items/",
      data,
      getAuthHeaders()
    );
    return response.data;
  };

  const updateItem = async (id, data) => {
    const response = await axios.put(
      `http://localhost:8000/api/items/${id}/`,
      data,
      getAuthHeaders()
    );
    return response.data;
  };

  const deleteItem = async (id) => {
    const response = await axios.delete(
      `http://localhost:8000/api/items/${id}/`,
      getAuthHeaders()
    );
    return response.data;
  };

  const fetchItemPriceHistory = async (itemId) => {
    const response = await axios.get(
      `http://localhost:8000/api/items/${itemId}/price-history/`,
      getAuthHeaders()
    );
    return response.data;
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/items/",
        getAuthHeaders()
      );
      const allHistory = [];
      for (const item of response.data) {
        const hist = await fetchItemPriceHistory(item.id);
        hist.forEach((entry) =>
          allHistory.push({ ...entry, item_name: item.item_name })
        );
      }
      setHistory(
        allHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
      setShowHistory(true);
    } catch {
      setError("Failed to fetch price history");
    }
  };

  const fetchItemHistory = async (item) => {
    try {
      const hist = await fetchItemPriceHistory(item.id);
      setItemHistory(hist.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setSelectedItem(item);
      setShowItemHistory(true);
    } catch {
      setError("Failed to fetch item history");
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
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const originalItems = [...items];
    setItems(items.filter((item) => item.id !== id));
    if (formData.id === id) handleCancel();
    try {
      await deleteItem(id);
    } catch {
      setItems(originalItems);
      setError("Failed to delete item");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) return setError("Item name is required");
    const price = parseFloat(formData.item_price);
    if (!price || price <= 0) return setError("Price must be positive");

    const payload = {
      item_name: formData.item_name.trim(),
      item_price: price,
      category: parseInt(formData.category),
      created_user: currentUserId,
    };

    const originalItems = [...items];

    try {
      if (formData.id) {
        setItems(
          items.map((item) =>
            item.id === formData.id ? { ...item, ...payload } : item
          )
        );
        await updateItem(formData.id, payload);
      } else {
        const tempItem = { id: Date.now(), ...payload };
        setItems([...items, tempItem]);
        const res = await addItem(payload);
        setItems((prev) =>
          prev.map((item) =>
            item.id === tempItem.id ? { ...item, id: res.id } : item
          )
        );
      }
      handleCancel();
    } catch {
      setItems(originalItems);
      setError("Failed to save item");
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
              style={{ backgroundColor: "#124451" }}
              className="text-white px-4 py-1 rounded shadow flex items-center gap-1"
            >
              📜 All History
            </button>
          </div>

          <div className="flex flex-row gap-6">
            {/* LEFT: Item List */}
            <div className="w-2/3 overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2">S.No</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Actions</th>
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
                      <td className="p-2">
                        {categories.find((cat) => cat.id === item.category)
                          ?.category_name || "-"}
                      </td>
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

            {/* RIGHT: Add/Update Form */}
            <div className="w-1/3 border-l pl-6">
              <h3 className="text-lg font-bold mb-4">
                {formData.id ? "Update Item" : "Add Item"}
              </h3>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="Item Name"
                  className="w-full mb-3 border rounded px-4 py-2 bg-gray-100"
                />
                <input
                  type="number"
                  name="item_price"
                  value={formData.item_price}
                  onChange={handleChange}
                  placeholder="Price"
                  className="w-full mb-3 border rounded px-4 py-2 bg-gray-100"
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full mb-4 border rounded px-4 py-2 bg-gray-100"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-400 text-white px-4 py-1 rounded shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#124451" }}
                    className="text-white px-4 py-1 rounded shadow"
                  >
                    {formData.id ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ALL PRICE HISTORY */}
          {showHistory && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">All Price History</h3>
                {history.length ? (
                  <ul className="space-y-2">
                    {history.map((entry, idx) => (
                      <li key={idx} className="text-gray-700">
                        {entry.item_name} - ₹ {entry.price} on{" "}
                        {dayjs(entry.date).format("DD/MM/YYYY")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No history available</p>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ backgroundColor: "#124451" }}
                  className="mt-4 text-white px-4 py-1 rounded shadow"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ITEM PRICE HISTORY */}
          {showItemHistory && selectedItem && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">
                  Price History for {selectedItem.item_name}
                </h3>
                {itemHistory.length ? (
                  <ul className="space-y-2">
                    {itemHistory.map((entry, idx) => (
                      <li key={idx} className="text-gray-700">
                        ₹ {entry.price} on{" "}
                        {dayjs(entry.date).format("DD/MM/YYYY")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No history available</p>
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
