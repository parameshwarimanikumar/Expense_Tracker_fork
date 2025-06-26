import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { getGroupedOrders } from "../../api_service/api";

const sanitizeText = (text) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ExpenseHistory = () => {
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    isVerified: "",
    startDate: "",
    endDate: "",
    expenseCategory: "",
  });

  const PAGE_SIZE = 10;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const fetchData = useCallback(async (appliedFilters = filters) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        alert("Please log in to view expense history.");
        return;
      }

      // Regular expenses (no pagination)
      const regularData = await getGroupedOrders(appliedFilters);
      const regularExpenses = Object.keys(regularData.results).flatMap((date) =>
        regularData.results[date].map((item) => ({
          id: `${date}-${item.item_name}`,
          date,
          description: sanitizeText(item.item_name),
          expense_category: "Regular",
          expense_type: item.type || "Unknown",
          amount: item.count * item.price,
          is_verified: item.is_verified || false,
        }))
      );

      // Other expenses (no pagination)
      const otherResponse = await axios.get("http://localhost:8000/api/expenses/", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: appliedFilters.type,
          is_verified: appliedFilters.isVerified,
          start_date: appliedFilters.startDate,
          end_date: appliedFilters.endDate,
        },
      });

      const otherExpenses = (otherResponse.data.results || otherResponse.data).map((exp) => ({
        id: exp.id,
        date: exp.date,
        description: sanitizeText(exp.description),
        expense_category: "Other",
        expense_type: exp.expense_type,
        amount: parseFloat(exp.amount),
        is_verified: exp.is_verified,
      }));

      let combined = [...regularExpenses, ...otherExpenses].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      if (appliedFilters.expenseCategory) {
        combined = combined.filter((exp) => exp.expense_category === appliedFilters.expenseCategory);
      }
      if (appliedFilters.type) {
        combined = combined.filter((exp) => exp.expense_type === appliedFilters.type);
      }
      if (appliedFilters.isVerified !== "") {
        combined = combined.filter((exp) => exp.is_verified === (appliedFilters.isVerified === "true"));
      }
      if (appliedFilters.startDate && appliedFilters.endDate) {
        combined = combined.filter((exp) => {
          const date = dayjs(exp.date);
          return (
            date.isAfter(dayjs(appliedFilters.startDate).subtract(1, "day")) &&
            date.isBefore(dayjs(appliedFilters.endDate).add(1, "day"))
          );
        });
      }

      setFilteredExpenses(combined);
      setTotalAmount(combined.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0));
      setTotalPages(Math.ceil(combined.length / PAGE_SIZE));
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch expense history.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const downloadExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("No data to export.");
      return;
    }

    const data = [
      ["Date", "Description", "Category", "Type", "Amount", "Verified"],
      ...filteredExpenses.map((exp) => [
        formatDate(exp.date),
        exp.description,
        exp.expense_category,
        exp.expense_type,
        exp.amount.toFixed(2),
        exp.is_verified ? "Yes" : "No",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = data[0].map((_, colIndex) => ({
      wch: Math.max(...data.map((row) => (row[colIndex] != null ? row[colIndex].toString().length + 2 : 10))),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense History");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }), `expense_history_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const FilterModal = ({ onClose, onSubmit, filters }) => {
    const [type, setType] = useState(filters.type || "");
    const [isVerified, setIsVerified] = useState(filters.isVerified || "");
    const [startDate, setStartDate] = useState(filters.startDate || "");
    const [endDate, setEndDate] = useState(filters.endDate || "");
    const [expenseCategory, setExpenseCategory] = useState(filters.expenseCategory || "");

    const handleSubmit = () => {
      onSubmit({ type, isVerified, startDate, endDate, expenseCategory });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h2 className="text-lg font-bold text-[#124451] mb-4">Filter Expenses</h2>
          <div className="space-y-3">
            <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full p-2 border rounded">
              <option value="">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="Other">Other</option>
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded">
              <option value="">All Types</option>
              <option value="Product">Product</option>
              <option value="Food">Food</option>
              <option value="Service">Service</option>
            </select>
            <select value={isVerified} onChange={(e) => setIsVerified(e.target.value)} className="w-full p-2 border rounded">
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 bg-[#124451] text-white rounded" onClick={handleSubmit}>Apply</button>
          </div>
        </div>
      </div>
    );
  };

  const handleFilterSubmit = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
    setIsFilterOpen(false);
  };

  const currentExpenses = filteredExpenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#124451]">
          {loading ? "Loading..." : `Total Amount: ₹ ${totalAmount.toFixed(2)}`}
        </h2>
        <div className="flex gap-2">
          <button className="bg-[#124451] text-white px-3 py-1 rounded-full flex items-center gap-1" onClick={() => setIsFilterOpen(true)}>
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter</span>
          </button>
          <button className="bg-[#124451] text-white px-3 py-1 rounded-full flex items-center gap-1" onClick={downloadExcel}>
            <FontAwesomeIcon icon={faFileExcel} className="text-green-300" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-t-[#124451] border-gray-200 rounded-full" />
        </div>
      ) : currentExpenses.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">No expense history found.</div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="p-2 text-left">S.No</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Verified</th>
                </tr>
              </thead>
              <tbody>
                {currentExpenses.map((exp, i) => (
                  <tr key={exp.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-2">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="p-2">{formatDate(exp.date)}</td>
                    <td className="p-2">{exp.description}</td>
                    <td className="p-2">{exp.expense_category}</td>
                    <td className="p-2">{exp.expense_type}</td>
                    <td className="p-2">₹{exp.amount.toFixed(2)}</td>
                    <td className="p-2">{exp.is_verified ? "Yes" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-4">
              <button className="px-3 py-1 bg-[#124451] text-white rounded disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Prev
              </button>
              <span className="font-semibold">Page {currentPage} of {totalPages}</span>
              <button className="px-3 py-1 bg-[#124451] text-white rounded disabled:opacity-50"
                onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {isFilterOpen && (
        <FilterModal onClose={() => setIsFilterOpen(false)} onSubmit={handleFilterSubmit} filters={filters} />
      )}
    </div>
  );
};

export default ExpenseHistory;
