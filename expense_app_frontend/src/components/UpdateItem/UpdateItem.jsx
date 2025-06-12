import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

// Axios instance with auth token
const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const UpdateItem = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = parseInt(storedUser?.role) === 1;

  const [items, setItems] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load items and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes, catRes] = await Promise.all([
          axiosInstance.get("items/"),
          axiosInstance.get("categories/"),
        ]);
        setItems(itemRes.data);
        setCategoryOptions(catRes.data);
      } catch (err) {
        console.error("Data fetch error:", err);
      }
    };
    if (isAdmin) fetchData();
  }, [isAdmin]);

  // Add new item
  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice || !newItemCategory) {
      setError("All fields are required.");
      return;
    }

    try {
      const res = await axiosInstance.post("items/", {
        item_name: newItemName,
        item_price: parseFloat(newItemPrice),
        category: newItemCategory,
      });
      setItems((prev) => [...prev, res.data]);
      resetModal();
    } catch (err) {
      console.error("Add item error:", err);
      setError("Failed to add item.");
    }
  };

  // Prepare edit modal
  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItemName(item.item_name);
    setNewItemPrice(item.item_price);
    setNewItemCategory(item.category);
    setShowEditModal(true);
  };

  // Submit edited item
  const handleUpdateItem = async () => {
    if (!newItemName || !newItemPrice || !newItemCategory) {
      setError("All fields are required.");
      return;
    }

    try {
      const res = await axiosInstance.patch(`items/${editingItem.id}/`, {
        item_name: newItemName,
        item_price: parseFloat(newItemPrice),
        category: newItemCategory,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? res.data : item))
      );
      resetModal();
    } catch (err) {
      console.error("Update item error:", err);
      setError("Failed to update item.");
    }
  };

  // Prepare delete
  const confirmDeleteItem = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  // Delete item
  const handleDeleteItem = async () => {
    try {
      await axiosInstance.delete(`items/${deletingItem.id}/`);
      setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
      resetModal();
    } catch (err) {
      console.error("Delete item error:", err);
      setError("Failed to delete item.");
    }
  };

  // Reset all modal state
  const resetModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemCategory("");
    setEditingItem(null);
    setDeletingItem(null);
    setError(null);
    setLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#1e2a52]">Item List</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1e2a52] text-white px-4 py-2 rounded hover:bg-[#14203f]"
        >
          + Add Item
        </button>
      </div>

      {/* Item Table */}
     
      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead className="border-b border-gray-100 text-gray-500 text-[14px] font-medium">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{item.item_name}</td>
                  <td className="p-3">
                    ₹{parseFloat(item.item_price).toFixed(2)}
                  </td>
                  <td className="p-3 flex items-center gap-3">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => confirmDeleteItem(item)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-[#1e2a52]">
              {showEditModal ? "Edit Item" : "Add New Item"}
            </h3>

            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <select
              value={newItemCategory}
              onChange={(e) => {
                setNewItemCategory(e.target.value);
                setError(null);
              }}
              className="w-full mb-3 border px-3 py-2 rounded"
            >
              <option value="">Select Category</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                setError(null);
              }}
              className="w-full mb-3 border px-3 py-2 rounded"
            />

            <input
              type="number"
              placeholder="Price"
              value={newItemPrice}
              onChange={(e) => {
                setNewItemPrice(e.target.value);
                setError(null);
              }}
              className="w-full mb-3 border px-3 py-2 rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdateItem : handleAddItem}
                className="px-4 py-2 bg-[#1e2a52] text-white rounded hover:bg-[#14203f]"
              >
                {loading ? "Saving..." : showEditModal ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-80">
            <h3 className="text-lg font-semibold text-[#1e2a52] mb-4">
              Confirm Delete
            </h3>
            <p className="mb-4">
              Are you sure you want to delete{" "}
              <strong>{deletingItem?.item_name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateItem;
