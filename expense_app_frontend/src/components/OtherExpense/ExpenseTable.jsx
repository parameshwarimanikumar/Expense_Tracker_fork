import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaFileInvoice,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import dayjs from "dayjs";
import axios from "axios";

const ExpenseTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    isVerified: "",
    isRefunded: "",
  });
  const [showFilter, setShowFilter] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseData, setExpenseData] = useState({
    date: "",
    description: "",
    type: "Product",
    bill: null,
    amount: "",
    isVerified: false,
    isRefunded: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewingMyData, setViewingMyData] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access");
        const url = viewingMyData
          ? "http://localhost:8000/api/expenses/mydata/"
          : "http://localhost:8000/api/expenses/";
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [viewingMyData]);

  useEffect(() => {
    let temp = [...expenses];
    if (filters.type)
      temp = temp.filter((e) => e.expense_type === filters.type);
    if (filters.isVerified !== "")
      temp = temp.filter(
        (e) => e.is_verified === (filters.isVerified === "true")
      );
    if (filters.isRefunded !== "")
      temp = temp.filter(
        (e) => e.is_refunded === (filters.isRefunded === "true")
      );
    if (filters.startDate && filters.endDate)
      temp = temp.filter((e) => {
        const d = dayjs(e.date);
        return (
          d.isAfter(dayjs(filters.startDate).subtract(1, "day")) &&
          d.isBefore(dayjs(filters.endDate).add(1, "day"))
        );
      });

    setFilteredExpenses(temp);
    setCurrentPage(1);
  }, [expenses, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () =>
    setFilters({
      type: "",
      isVerified: "",
      isRefunded: "",
      startDate: "",
      endDate: "",
    });

  const showexpense = () => {
    setShowExpense(!showExpense);
    setEditingExpense(null);
    setExpenseData({
      date: "",
      description: "",
      type: "Product",
      bill: null,
      amount: "",
      isVerified: false,
      isRefunded: false,
    });
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    const formData = new FormData();
    formData.append("date", expenseData.date);
    formData.append("description", expenseData.description);
    formData.append("expense_type", expenseData.type);
    formData.append("amount", expenseData.amount);
    if (expenseData.bill) formData.append("bill", expenseData.bill);

    try {
      const res = await axios({
        method: editingExpense ? "put" : "post",
        url: editingExpense
          ? `http://localhost:8000/api/expenses/${editingExpense.id}/`
          : "http://localhost:8000/api/expenses/",
        data: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      setExpenses((prev) =>
        editingExpense
          ? prev.map((e) => (e.id === editingExpense.id ? res.data : e))
          : [...prev, res.data]
      );

      setShowExpense(false);
    } catch (err) {
      console.error("Submit failed:", err.response?.data || err);
      alert("your are not own user or admin Failed to submit.");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseData({
      date: expense.date,
      description: expense.description,
      type: expense.expense_type,
      bill: null,
      amount: expense.amount,
      isVerified: expense.is_verified,
      isRefunded: expense.is_refunded,
    });
    setShowExpense(true);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Confirm delete?")) return;
    const token = localStorage.getItem("access");
    try {
      await axios.delete(`http://localhost:8000/api/expenses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err);
      alert("your are not own user or admin Failed to delete.");
    }
  };

  const handleBillUpload = (e) => {
    const file = e.target.files[0];
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (file && file.size / 1024 / 1024 <= 5 && allowed.includes(file.type)) {
      setExpenseData({ ...expenseData, bill: file });
    } else {
      alert("Invalid file: Must be PDF/JPG/PNG & under 5MB.");
    }
  };

  const finalExpenses = filteredExpenses;
  const indexOfLast = currentPage * itemsPerPage;
  const currentExpenses = finalExpenses.slice(
    indexOfLast - itemsPerPage,
    indexOfLast
  );

  const calculateTotal = () => {
    const total = finalExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount || 0),
      0
    );
    return total.toFixed(2);
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Grand Total: ₹ {calculateTotal()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="bg-gray-300 text-black px-4 py-1 rounded-full hover:bg-gray-400"
          >
            Reset Filters
          </button>
          <button
            onClick={showexpense}
            className="bg-[#124451] text-white px-4 py-1 rounded-full"
          >
            Add Expense
          </button>
        </div>
      </div>
      <button
        onClick={() => setViewingMyData(!viewingMyData)}
        className="bg-[#124451] text-white px-4 py-1 rounded-full"
      >
        {viewingMyData ? "View All Data" : "View My Data"}
      </button>

      {loading ? (
        <p className="text-center text-gray-500 mt-6">Loading...</p>
      ) : currentExpenses.length === 0 ? (
        <p className="text-center text-gray-500 mt-6">No expenses found.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead className="border-b border-gray-100 text-gray-500 text-sm font-medium">
              <tr>
                <th className="p-3 text-left">S.No</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">
                  <div className="flex flex-col">
                    <span>Type</span>
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="mt-1 text-black border border-gray-300 rounded px-1 py-[2px]"
                    >
                      <option value="">All</option>
                      <option value="Product">Product</option>
                      <option value="Food">Food</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                </th>
                <th className="p-3 text-left">Bill</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">
                  <div className="flex flex-col">
                    <span>Verified</span>
                    <select
                      name="isVerified"
                      value={filters.isVerified}
                      onChange={handleFilterChange}
                      className="mt-1 text-black border border-gray-300 rounded px-1 py-[2px]"
                    >
                      <option value="">All</option>
                      <option value="true">Verified</option>
                      <option value="false">Not Verified</option>
                    </select>
                  </div>
                </th>
                <th className="p-3 text-left">
                  <div className="flex flex-col">
                    <span>Refunded</span>
                    <select
                      name="isRefunded"
                      value={filters.isRefunded}
                      onChange={handleFilterChange}
                      className="mt-1 text-black border border-gray-300 rounded px-1 py-[2px]"
                    >
                      <option value="">All</option>
                      <option value="true">Refunded</option>
                      <option value="false">Pending</option>
                    </select>
                  </div>
                </th>

                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="text-gray-800 text-sm">
              {currentExpenses.map((exp, i) => (
                <tr
                  key={exp.id}
                  className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="p-3">
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </td>
                  <td className="p-3">
                    {dayjs(exp.date).format("DD/MM/YYYY")}
                  </td>
                  <td className="p-3">{exp.description}</td>
                  <td className="p-3">{exp.expense_type}</td>
                  <td className="p-3">
                    {exp.bill_url ? (
                      <a
                        href={exp.bill_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="p-3">₹ {parseFloat(exp.amount).toFixed(2)}</td>
                  <td className="p-3">
                    {exp.is_verified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <FaCheckCircle /> Verified
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <FaTimesCircle /> Not Verified
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {exp.is_refunded ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <FaRedo /> Refunded
                      </span>
                    ) : (
                      <span className="text-[#264653] flex items-center gap-1">
                        <FaRedo /> Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEditExpense(exp)}
                      className="text-blue-600"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>
        {Array.from({
          length: Math.ceil(finalExpenses.length / itemsPerPage),
        }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              i + 1 === currentPage ? "bg-[#124451] text-white" : "bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={
            currentPage === Math.ceil(finalExpenses.length / itemsPerPage)
          }
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 space-y-3">
            <h2 className="text-xl font-bold mb-4">Filter</h2>
            <div>
              <label className="block mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border p-2 rounded"
              >
                <option value="">All</option>
                <option value="Product">Product</option>
                <option value="Food">Food</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Verified Status</label>
              <select
                name="isVerified"
                value={filters.isVerified}
                onChange={handleFilterChange}
                className="w-full border p-2 rounded"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button
                className="bg-[#124451] text-white px-4 py-2 rounded"
                onClick={() => setShowFilter(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            {/* Modal Title */}
            <h3 className="text-xl font-semibold mb-4">
              {editingExpense ? "Edit" : "Add"} Expense
            </h3>

            {/* Expense Form */}
            <form onSubmit={handleExpenseSubmit} encType="multipart/form-data">
              {/* Date Field */}
              <div className="mb-4">
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  value={expenseData.date}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, date: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="mb-4">
                <label className="block text-gray-700">Description</label>
                <input
                  type="text"
                  value={expenseData.description}
                  onChange={(e) =>
                    setExpenseData({
                      ...expenseData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Amount Field */}
              <div className="mb-4">
                <label className="block text-gray-700">Amount</label>
                <input
                  type="number"
                  value={expenseData.amount}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, amount: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Type Field */}
              <div className="mb-4">
                <label className="block text-gray-700">Type</label>
                <select
                  value={expenseData.type}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, type: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Product">Product</option>
                  <option value="Food">Food</option>
                  <option value="Service">Service</option> {/* ✅ Correct */}
                </select>
              </div>

              {/* Bill Upload Field */}
              <div className="mb-4">
                <label className="block text-gray-700">
                  Upload Bill (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleBillUpload}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowExpense(false)}
                  className="text-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#124451] text-white px-4 py-2 rounded"
                >
                  {editingExpense ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;
