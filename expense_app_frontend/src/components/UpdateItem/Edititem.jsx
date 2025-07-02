import React, { useState, useEffect } from "react";
import axios from "axios";

const EditItem = ({ initialData, onClose }) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    item_name: "",
    count: "",
    price: "",
    date: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        count: initialData.count || "",
        price: initialData.price || "",
        date: initialData.date || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");

    const url = isEdit
      ? `http://localhost:8000/api/order-items/${initialData.id}/`
      : `http://localhost:8000/api/order-items/`;

    const method = isEdit ? "put" : "post";

    try {
      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onClose();
    } catch (err) {
      console.error("Failed to submit:", err);
      alert("❌ Failed to save item.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {isEdit ? "Update Expense" : "Add Expense"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Item Name</label>
          <input
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block">Count</label>
          <input
            type="number"
            name="count"
            value={formData.count}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-500 hover:text-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#124451] text-white rounded"
          >
            {isEdit ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItem;
