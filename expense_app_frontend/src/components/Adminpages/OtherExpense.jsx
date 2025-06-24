import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
} from "react-icons/fa";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";

const OtherExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    isVerified: "",
    startDate: "",
    endDate: "",
  });
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching expenses:", error.response || error);
      }
    };

    fetchExpenses();
  }, []);

  const handleToggle = async (expenseId, field, value) => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("No access token found.");
      return;
    }

    const updatedExpenses = expenses.map((exp) =>
      exp.id === expenseId ? { ...exp, [field]: value } : exp
    );
    setExpenses(updatedExpenses);
    setFilteredExpenses(updatedExpenses);

    try {
      const target = updatedExpenses.find((e) => e.id === expenseId);
      await axios.put(
        `http://localhost:8000/api/expenses/${expenseId}/`,
        {
          date: target.date,
          description: target.description,
          expense_type: target.expense_type,
          amount: target.amount,
          bill: target.bill,
          is_verified: target.is_verified,
          is_refunded: target.is_refunded,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating field:", error);
      alert("Failed to update. Please try again.");
    }
  };

  useEffect(() => {
    let temp = [...expenses];
    if (filters.type) {
      temp = temp.filter((exp) => exp.expense_type === filters.type);
    }
    if (filters.isVerified !== "") {
      temp = temp.filter(
        (exp) => exp.is_verified === (filters.isVerified === "true")
      );
    }
    if (filters.startDate && filters.endDate) {
      temp = temp.filter((exp) => {
        const date = dayjs(exp.date);
        return (
          date.isAfter(dayjs(filters.startDate).subtract(1, "day")) &&
          date.isBefore(dayjs(filters.endDate).add(1, "day"))
        );
      });
    }

    setFilteredExpenses(temp);
    setCurrentPage(1);
  }, [expenses, filters]);

  const resetFilters = () => {
    setFilters({
      type: "",
      isVerified: "",
      startDate: "",
      endDate: "",
    });
  };

  const downloadExcel = () => {
    const data = [
      ["Date", "Description", "Type", "Amount", "Verified", "Refunded"],
      ...filteredExpenses.map((exp) => [
        dayjs(exp.date).format("DD/MM/YYYY"),
        exp.description,
        exp.expense_type,
        exp.amount,
        exp.is_verified ? "Yes" : "No",
        exp.is_refunded ? "Yes" : "No",
      ]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Other Expenses");
    XLSX.writeFile(wb, "Other_Expenses.xlsx");
  };

  const finalExpenses = filteredExpenses;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentExpenses = finalExpenses.slice(indexOfFirst, indexOfLast);

  const totalAmount = finalExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount || 0),
    0
  );

  const handlePagination = (page) => setCurrentPage(page);

  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Total: ₹ {totalAmount.toFixed(2)}
        </h2>
        <div className="flex gap-2">
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-2"
            onClick={() => setShowFilter(!showFilter)}
          >
            <FaFilter /> Filter
          </button>
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full"
            onClick={downloadExcel}
          >
            <FaDownload /> Download Excel
          </button>
        </div>
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
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
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
                onChange={(e) =>
                  setFilters({ ...filters, isVerified: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
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
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm">
            {currentExpenses.map((exp, i) => (
              <tr
                key={exp.id}
                className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-3">{indexOfFirst + i + 1}</td>
                <td className="p-3">{dayjs(exp.date).format("DD/MM/YYYY")}</td>
                <td className="p-3">{exp.description}</td>
                <td className="p-3">{exp.expense_type}</td>
                <td className="p-3">
                  {exp.bill ? (
                    <a
                      href={exp.bill}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Bill
                    </a>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>

                <td className="p-3">₹ {parseFloat(exp.amount).toFixed(2)}</td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      handleToggle(exp.id, "is_verified", !exp.is_verified)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exp.is_verified
                        ? "bg-green-200 text-green-700"
                        : "bg-[#fbdcdc] text-[#c01e1e]"
                    }`}
                  >
                    {exp.is_verified ? "Verified" : "Verify"}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      handleToggle(exp.id, "is_refunded", !exp.is_refunded)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exp.is_refunded
                        ? "bg-blue-200 text-blue-700"
                        : "bg-[#dce8f8] text-[#23499b]"
                    }`}
                  >
                    {exp.is_refunded ? "Refunded" : "Reimburse"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePagination(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>
        {Array.from({
          length: Math.ceil(finalExpenses.length / itemsPerPage),
        }).map((_, index) => {
          const pageNum = index + 1;
          return (
            <button
              key={pageNum}
              onClick={() => handlePagination(pageNum)}
              className={`px-3 py-1 rounded ${
                pageNum === currentPage
                  ? "bg-[#124451] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePagination(currentPage + 1)}
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

export default OtherExpense;
