import React, { useState, useEffect } from "react";
import axios from "axios";

const Mydata = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal states
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseData, setExpenseData] = useState({
    date: "",
    description: "",
    expense_type: "",
    amount: "",
    bill: null,
  });
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchMyExpenses = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        alert("Please login to continue.");
        return;
      }
      try {
        const response = await axios.get(
          "http://localhost:8000/api/expenses/mydata/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching your expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyExpenses();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // Open modal and load expense data for editing
  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setExpenseData({
      date: expense.date,
      description: expense.description,
      expense_type: expense.expense_type,
      amount: expense.amount,
      bill: null, // user can upload new file if needed
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bill") {
      setExpenseData((prev) => ({ ...prev, bill: files[0] }));
    } else {
      setExpenseData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit edited expense to API and update state
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    const formData = new FormData();
    formData.append("date", expenseData.date);
    formData.append("description", expenseData.description);
    formData.append("expense_type", expenseData.expense_type);
    formData.append("amount", expenseData.amount);
    if (expenseData.bill) {
      formData.append("bill", expenseData.bill);
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/expenses/${editingExpense.id}/`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === editingExpense.id ? response.data : exp))
      );

      setShowEditModal(false);
      setEditingExpense(null);
      alert("Expense updated successfully.");
    } catch (error) {
      console.error("Error updating expense:", error.response || error);
      alert("Failed to update expense.");
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      
      <h2 className="text-center font-bold mb-4 text-xl">My Expenses</h2>

      {loading ? (
        <div className="text-center py-4 text-gray-600">
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No expenses found.</div>
      ) : (
        <>
          <div className="overflow-auto" style={{ maxHeight: "40vh" }}>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="border border-gray-300 px-3 py-1">S.No</th>
                  <th className="border border-gray-300 px-3 py-1">Date</th>
                  <th className="border border-gray-300 px-3 py-1">
                    Description
                  </th>
                  <th className="border border-gray-300 px-3 py-1">Type</th>
                  <th className="border border-gray-300 px-3 py-1">Bill</th>
                  <th className="border border-gray-300 px-3 py-1">Amount</th>
                  <th className="border border-gray-300 px-3 py-1">Verified</th>
                  <th className="border border-gray-300 px-3 py-1">Refunded</th>
                  <th className="border border-gray-300 px-3 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className="text-center hover:bg-gray-50 text-sm"
                  >
                    <td className="border border-gray-300 px-3 py-1">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 break-words max-w-xs">
                      {expense.description}
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      {expense.expense_type}
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      {expense.bill ? (
                        <a
                          href={expense.bill}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Uploaded
                        </a>
                      ) : (
                        <span className="text-gray-500">No File</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      <span
                        className={
                          expense.is_verified
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {expense.is_verified ? "Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      <span
                        className={
                          expense.is_refunded
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {expense.is_refunded ? "Refunded" : "Pending"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-1">
                      <button
                        title="Edit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        onClick={() => handleEditClick(expense)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto p-6">
                <h3 className="text-xl font-semibold mb-4">Edit Expense</h3>
                <form onSubmit={handleEditSubmit}>
                  <label className="block mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={expenseData.date}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded mb-4"
                    required
                  />

                  <label className="block mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={expenseData.description}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded mb-4"
                    required
                  />

                  <label className="block mb-1">Type</label>
                  <select
                    name="expense_type"
                    value={expenseData.expense_type}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded mb-4"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Product">Product</option>
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                  </select>

                  <label className="block mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={expenseData.amount}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded mb-4"
                    required
                  />

                  <label className="block mb-1">Upload Bill (optional)</label>
                  <input
                    type="file"
                    name="bill"
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded mb-4"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded border"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingExpense(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#0E4351] text-white px-4 py-2 rounded"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Mydata;
