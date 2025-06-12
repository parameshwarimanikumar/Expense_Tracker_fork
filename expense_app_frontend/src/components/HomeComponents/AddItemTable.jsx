import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FaTrash } from "react-icons/fa";

// Axios instance
const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  timeout: 5000,
});

// Add Authorization token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AddItemTable = () => {
  const [items, setItems] = useState([
    { item: "", count: "", added_date: dayjs().format("YYYY-MM-DD") },
  ]);
  const [itemOptions, setItemOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
 

  // Fetch item options from backend
  const fetchItemOptions = async () => {
    try {
      const res = await axiosInstance.get("items/");
      setItemOptions(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to fetch items.");
    }
  };

  useEffect(() => {
    fetchItemOptions();
  }, []);

  // Handle field changes
  const handleItemChange = (index, field, value) => {
    setError(null);
    const updatedItems = [...items];
    updatedItems[index][field] = field === "item" ? parseInt(value) : value;
    setItems(updatedItems);
  };

  // Add row
  const addRow = () => {
    setItems([
      ...items,
      { item: "", count: "", added_date: dayjs().format("YYYY-MM-DD") },
    ]);
  };

  // Remove row
  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    for (const row of items) {
      if (!row.item || !row.count || !row.added_date) {
        setError("Please fill out all fields in all rows.");
        setLoading(false);
        return;
      }
      if (isNaN(row.count) || parseInt(row.count, 10) <= 0) {
        setError("Count must be a positive number.");
        setLoading(false);
        return;
      }
    }

    const orderData = {
      order_items: items.map(({ item, count, added_date }) => ({
        item,
        count: parseInt(count, 10),
        added_date,
      })),
    };

    try {
      await axiosInstance.post("orders/", orderData);
      alert("Order submitted successfully!");
      setItems([
        { item: "", count: "", added_date: dayjs().format("YYYY-MM-DD") },
      ]);
    } catch (err) {
      console.error("Error submitting order:", err?.response?.data || err.message);
      setError(
        err?.response?.data?.error ||
          JSON.stringify(err?.response?.data) ||
          "Failed to submit order."
      );
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1e2a52]">Add Item</h2>

        <div className="flex gap-3">
          <button
            onClick={addRow}
            type="button"
            className="bg-[#124451] text-white px-5 py-2 rounded-full hover:bg-[#14203f] transition"
          >
            + Add items
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Item</th>
              <th className="p-3">Count</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-3">
                  <select
                    value={item.item}
                    onChange={(e) =>
                      handleItemChange(index, "item", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded"
                    required
                  >
                    <option value="">Select Item</option>
                    {itemOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.item_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="1"
                    value={item.count}
                    onChange={(e) =>
                      handleItemChange(index, "count", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Count"
                    required
                  />
                </td>
                <td className="p-3">
                  <input
                    type="date"
                    value={item.added_date}
                    onChange={(e) =>
                      handleItemChange(index, "added_date", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={items.length === 1}
                    title={
                      items.length === 1 ? "Can't remove last row" : "Remove row"
                    }
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-start">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#124451] text-white px-7 py-2 rounded-full hover:bg-[#0f2f3a] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItemTable;
