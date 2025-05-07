import React, { useState, useEffect } from "react";
import axiosInstance from "../../api_service/api";

const AddItemTable = () => {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedItem, setEditedItem] = useState({});
  const [newItem, setNewItem] = useState({ name: "", description: "", amount: "" });
  const [error, setError] = useState("");

  const currentUserId = localStorage.getItem("user_id");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axiosInstance.get("/items/");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to load items.");
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || isNaN(newItem.amount) || Number(newItem.amount) <= 0) {
      alert("Please provide a valid name and amount.");
      return;
    }

    try {
      const response = await axiosInstance.post("/items/", newItem);
      setItems([...items, response.data]);
      setNewItem({ name: "", description: "", amount: "" });
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item.");
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedItem({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editedItem.name || isNaN(editedItem.amount) || Number(editedItem.amount) <= 0) {
      alert("Please provide a valid name and amount.");
      return;
    }

    try {
      await axiosInstance.put(`/items/${editingId}/`, editedItem);
      setEditingId(null);
      setEditedItem({});
      fetchItems();
    } catch (error) {
      console.error("Error updating item:", error);
      setError("Failed to update item.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-[#124451]">Expense Table</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <table className="w-full border border-gray-300 mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Refunded</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const canEdit =
              String(item.user_id) === String(currentUserId) && !item.is_refunded;
            const isEditing = editingId === item.id;

            return (
              <tr key={item.id}>
                <td className="p-2 border">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedItem.name}
                      onChange={handleEditChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="p-2 border">
                  {isEditing ? (
                    <input
                      type="text"
                      name="description"
                      value={editedItem.description}
                      onChange={handleEditChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td className="p-2 border">
                  {isEditing ? (
                    <input
                      type="number"
                      name="amount"
                      value={editedItem.amount}
                      onChange={handleEditChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    item.amount
                  )}
                </td>
                <td className="p-2 border text-center">
                  {item.is_refunded ? "Yes" : "No"}
                </td>
                <td className="p-2 border">
                  {canEdit && !isEditing && (
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => startEditing(item)}
                    >
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button
                        className="bg-green-500 text-white px-3 py-1 mr-2 rounded"
                        onClick={handleSaveEdit}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-500 text-white px-3 py-1 rounded"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="bg-gray-50 p-4 rounded shadow-md">
        <h3 className="text-xl font-semibold text-[#124451] mb-3">Add New Expense</h3>
        <div className="flex flex-col md:flex-row gap-2 mb-3">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="text"
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newItem.amount}
            onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <button
          className="bg-[#124451] text-white px-4 py-2 rounded"
          onClick={handleAddItem}
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default AddItemTable;
