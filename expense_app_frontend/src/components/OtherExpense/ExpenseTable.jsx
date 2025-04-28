import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaFileInvoice,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaEdit,
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
    startDate: "",
    endDate: "",
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
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          console.error("No access token found in localStorage.");
          return;
        }

        const response = await axios.get(
          "http://localhost:8000/api/expenses/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched expenses:", response.data);
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching expenses:", error.response || error);
      }
    };

    fetchExpenses();
  }, []);

  // APPLY FILTERS

  useEffect(() => {
    let temp = [...expenses];
    // Filter by type
    if (filters.type) {
      temp = temp.filter((exp) => exp.type === filters.type);
    }
    // Filter by verification status
    if (filters.isVerified !== "") {
      temp = temp.filter(
        (exp) => exp.isVerified === (filters.isVerified === "true")
      );
    }
    // Filter by date range
    if (filters.startDate && filters.endDate) {
      temp = temp.filter((exp) => {
        const expDate = dayjs(exp.date);
        return (
          expDate.isAfter(dayjs(filters.startDate).subtract(1, "day")) &&
          expDate.isBefore(dayjs(filters.endDate).add(1, "day"))
        );
      });
    }

    setFilteredExpenses(temp);
    setCurrentPage(1);
  }, [expenses, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: "",
      isVerified: "",
      startDate: "",
      endDate: "",
    });
  };

  const showfilter = () => setShowFilter(!showFilter);
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

    console.log("Expense Data on Submit:", expenseData); // Debugging point

    const token = localStorage.getItem("access");
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const formData = new FormData();
    formData.append("date", expenseData.date);
    formData.append("description", expenseData.description);
    formData.append("expense_type", expenseData.type);
    formData.append("amount", expenseData.amount);

    if (expenseData.bill) {
      console.log("Bill Data being appended:", expenseData.bill); // Check if bill is appended
      formData.append("bill", expenseData.bill); // appending the file correctly
    }

    try {
      const response = await axios({
        method: editingExpense ? "put" : "post", // Use PUT for editing
        url: editingExpense
          ? `http://localhost:8000/api/expenses/${editingExpense.id}/`
          : "http://localhost:8000/api/expenses/",
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingExpense) {
        // Update the existing expense in the state
        setExpenses((prevExpenses) =>
          prevExpenses.map((exp) =>
            exp.id === editingExpense.id ? response.data : exp
          )
        );
      } else {
        // Add the new expense to the state
        setExpenses((prev) => [...prev, response.data]);
      }

      setShowExpense(false);
      alert("Expense submitted successfully.");
    } catch (error) {
      console.error("Error submitting expense:", error.response || error);
      alert("Failed to submit expense.");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseData(expense);
    setShowExpense(true);
  };

  const handlePagination = (pageNumber) => setCurrentPage(pageNumber);

  const currentMonth = dayjs().format("YYYY-MM");
  const filteredByMonth = filteredExpenses.filter(
    (exp) => dayjs(exp.date).format("YYYY-MM") === currentMonth
  );
  const finalExpenses =
    filteredByMonth.length > 0 ? filteredByMonth : filteredExpenses;

  const indexOfLastExpense = currentPage * itemsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - itemsPerPage;
  const currentExpenses = finalExpenses.slice(
    indexOfFirstExpense,
    indexOfLastExpense
  );

  const calculateTotalAmount = () => {
    if (!Array.isArray(finalExpenses)) return "0.00";

    const total = finalExpenses.reduce((sum, exp) => {
      const amount = parseFloat(exp?.amount);
      if (isNaN(amount)) {
        return sum; // Skip invalid amounts
      }
      return sum + amount;
    }, 0);

    return total.toFixed(2);
  };

  const handleBillUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.split("/")[1];
      const fileSize = file.size / 1024 / 1024; // Convert bytes to MB
      if (fileSize > 5) {
        alert("File size exceeds the 5MB limit.");
        return;
      }
      if (fileType !== "pdf" && fileType !== "jpeg" && fileType !== "png") {
        alert("Only PDF, JPG, or PNG files are allowed!");
        return;
      }
      setExpenseData({ ...expenseData, bill: file });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Grand Total: ₹ {calculateTotalAmount()}
        </h2>
        <div className="flex gap-2">
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-2"
            onClick={showfilter}
          >
            <FaFilter /> Filter
          </button>
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full"
            onClick={showexpense}
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Filter</h2>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border p-2 rounded"
              >
                <option value="">All</option>
                <option value="Product">Product</option>
                <option value="Food">Food</option>
                <option value="Office">Office</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Verified Status
              </label>
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
            <div>
              <label className="block text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-full flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  resetFilters();
                  setShowFilter(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#124451] text-white rounded"
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
            <form onSubmit={handleExpenseSubmit}>
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
                  <option value="Travel">Travel</option>
                  <option value="Office">Office</option>
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

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead className="border-b border-gray-100 text-gray-500 text-[14px] font-medium">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Bill</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Is Verified</th>
              <th className="p-3 text-left">Is Refunded</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm">
            {currentExpenses.map((exp, i) => (
              <tr
                key={exp.id}
                className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <td className="p-3">{indexOfFirstExpense + i + 1}</td>
                <td className="p-3">{dayjs(exp.date).format("DD/MM/YYYY")}</td>
                <td className="p-3">{exp.description}</td>
                <td className="p-3">{exp.expense_type}</td>
                <td className="p-3">
                  {exp.bill ? (
                    <span className="text-green-600">Uploaded</span> // If bill is uploaded, show 'Uploaded'
                  ) : (
                    <span className="text-gray-500">N/A</span> // If no bill, show 'N/A'
                  )}
                </td>

                <td className="p-3">₹ {parseFloat(exp.amount).toFixed(2)}</td>
                <td className="p-3">
                  {exp.isVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaCheckCircle /> Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <FaTimesCircle /> Not Verified
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {exp.isRefunded ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaRedo /> Refunded
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-264653-500">
                      <FaRedo /> Pending
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleEditExpense(exp)}
                    className="text-blue-600"
                  >
                    <FaEdit />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center mt-4 gap-2">
        <button
          className="p-2 rounded-full bg-gray-200"
          onClick={() => handlePagination(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>
        <span className="px-3 text-gray-700 font-semibold">
          Page {currentPage} of {Math.ceil(finalExpenses.length / itemsPerPage)}
        </span>
        <button
          className="p-2 rounded-full bg-gray-200"
          onClick={() =>
            handlePagination(
              Math.min(
                Math.ceil(finalExpenses.length / itemsPerPage),
                currentPage + 1
              )
            )
          }
          disabled={
            currentPage === Math.ceil(finalExpenses.length / itemsPerPage)
          }
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default ExpenseTable;
