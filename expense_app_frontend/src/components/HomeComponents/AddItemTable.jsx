import React, { useState, useEffect } from "react";
import axiosInstance from "../../api_service/api";

const AddItemTable = () => {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedItem, setEditedItem] = useState({});
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    amount: "",
  });

  const currentUserId = localStorage.getItem("user_id"); // Or wherever you store logged-in user ID

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axiosInstance.get("/items");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleAddItem = async () => {
    try {
      const response = await axiosInstance.post("/items", newItem);
      setItems([...items, response.data]);
      setNewItem({ name: "", description: "", amount: "" });
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await axiosInstance.put(`/items/${editingId}`, editedItem);
      setEditingId(null);
      fetchItems(); // Refresh after edit
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  return (
    <div>
      <h2>Expense Table</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Refunded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const canEdit =
              String(item.user_id) === String(currentUserId) && !item.is_refunded;
            const isEditing = editingId === item.id;

            return (
              <tr key={item.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedItem.name}
                      onChange={handleEditChange}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      name="description"
                      value={editedItem.description}
                      onChange={handleEditChange}
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      name="amount"
                      value={editedItem.amount}
                      onChange={handleEditChange}
                    />
                  ) : (
                    item.amount
                  )}
                </td>
                <td>{item.is_refunded ? "Yes" : "No"}</td>
                <td>
                  {canEdit && !isEditing && (
                    <button onClick={() => startEditing(item)}>Edit</button>
                  )}
                  {isEditing && (
                    <button onClick={handleSaveEdit}>Save</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div>
        <h3>Add New Expense</h3>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          value={newItem.amount}
          onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
        />
        <button onClick={handleAddItem}>Add Expense</button>
      </div>
    </div>
  );
};

export default AddItemTable;
