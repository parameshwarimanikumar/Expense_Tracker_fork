import React, { useState, useEffect } from "react";
import axiosInstance from "../../api_service/api"; // ✅ Correct import


const AddItemTable = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    amount: "",
  });

  useEffect(() => {
    // Fetch data when the component mounts
    fetchItems();
  }, []);

  // Function to fetch items from the API
  const fetchItems = async () => {
    try {
      const response = await axiosInstance.get("/items"); // Adjust the API route as needed
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Handle adding a new item
  const handleAddItem = async () => {
    try {
      const response = await axiosInstance.post("/items", newItem); // Adjust the API route as needed
      setItems([...items, response.data]);
      setNewItem({ name: "", description: "", amount: "" });
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Handle updating an item (if needed)
  // const handleUpdate = async (id) => {
  //   try {
  //     // Logic for updating an item
  //     const updatedItem = { ...newItem }; // Adjust the data to be updated
  //     await axiosInstance.put(`/items/${id}`, updatedItem);
  //     fetchItems();
  //   } catch (error) {
  //     console.error("Error updating item:", error);
  //   }
  // };

  return (
    <div>
      <h2>Item Table</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Add New Item</h3>
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
        <button onClick={handleAddItem}>Add Item</button>
      </div>
    </div>
  );
};

export default AddItemTable;
