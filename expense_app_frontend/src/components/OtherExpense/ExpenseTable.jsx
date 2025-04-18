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
import dayjs from "dayjs"; // <-- Install via npm i dayjs

const initialExpenses = [
  {
    id: 1,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: false,
    isRefunded: false,
  },

  {
    id: 2,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: false,
    isRefunded: false,
  },

  {
    id: 3,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: false,
    isRefunded: false,
  },

  {
    id: 4,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: false,
    isRefunded: false,
  },

  {
    id: 5,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },

  {
    id: 6,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },

  {
    id: 7,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },

  {
    id: 8,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },

  {
    id: 9,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },

  {
    id: 10,
    date: "12/10/2025",
    description: "Battery, Paper, Pen",
    type: "Product",
    bill: 100,
    amount: 100,
    isVerified: true,
    isRefunded: true,
  },
];

const ExpenseTable = () => {
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
  const [expenses, setExpenses] = useState(initialExpenses);

  const [filters, setFilters] = useState({
    type: "",
    isVerified: "",
    startDate: "",
    endDate: "",
  });

  const [filteredExpenses, setFilteredExpenses] = useState(initialExpenses);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    setCurrentPage(1); // Reset to page 1 after filtering
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

  const handleExpenseSubmit = (e) => {
    e.preventDefault(); // 👈 Important: prevent page reload

    if (editingExpense) {
      const updatedExpenses = expenses.map((expense) =>
        expense.id === editingExpense.id
          ? { ...expense, ...expenseData }
          : expense
      );
      setExpenses(updatedExpenses);
    } else {
      const newExpense = {
        ...expenseData,
        id: Date.now(),
        amount: parseFloat(expenseData.amount),
      };
      setExpenses((prev) => [...prev, newExpense]);
      alert("Notification sent to Admin: New expense needs verification.");
    }
    setShowExpense(false);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseData(expense);
    setShowExpense(true);
  };

  const handlePagination = (pageNumber) => setCurrentPage(pageNumber);

  // Group data by month if more than 15 entries
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
    return finalExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  };

  const handleBillUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
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

      {/* Filters Section */}
      {showFilter && (
         <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
         <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4 relative">

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
              <option value="Travel">Travel</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Verified Status</label>
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
                setShowFilter(false); // close filter section on cancel
              }}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-[#124451] text-white rounded"
              onClick={() => setShowFilter(false)} // just close filter section on apply
            >
              Apply
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
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
            {currentExpenses.map((expense, index) => (
              <tr
                key={expense.id}
                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <td className="p-3">{indexOfFirstExpense + index + 1}</td>
                <td className="p-3">
                  {dayjs(expense.date).format("DD/MM/YYYY")}
                </td>
                <td className="p-3">{expense.description}</td>
                <td className="p-3">{expense.type}</td>
                <td className="p-3">
                  {expense.bill ? (
                    typeof expense.bill === "string" ? (
                      <a
                        href={expense.bill}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">Uploaded</span>
                    )
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="p-3">₹ {expense.amount}</td>
                <td className="p-3">
                  {expense.isVerified ? (
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
                  {expense.isRefunded ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaRedo /> Refunded
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-500">
                      <FaRedo /> Pending
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <button
                    className="text-green-600"
                    onClick={() => handleEditExpense(expense)}
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            className="px-2 py-1 border rounded text-gray-400"
            onClick={() => handlePagination(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          <button className="px-3 py-1 bg-[#124451] text-white rounded">
            {currentPage}
          </button>
          <button
            className="px-2 py-1 border rounded text-gray-400"
            onClick={() => handlePagination(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= finalExpenses.length}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-xl font-semibold mb-4">
              {editingExpense ? "Edit" : "Add"} Expense
            </h3>
            <form onSubmit={handleExpenseSubmit}>
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
              <div className="mb-4">
                <label className="block text-gray-700">Type</label>
                <select
                  value={expenseData.type}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, type: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="Product">Product</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>
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
                  Save
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
