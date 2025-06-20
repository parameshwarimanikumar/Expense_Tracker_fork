import React, { useState, useEffect, useCallback } from "react";
import { faFileExcel, faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getGroupedOrders } from "../../api_service/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AddItem from "../UpdateItem/Additem";

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    isVerified: "",
    startDate: null,
    endDate: null,
  });

  const PAGE_SIZE = 10;

  const fetchData = useCallback(
    async (page = 1, appliedFilters = filters) => {
      setLoading(true);
      try {
        const data = await getGroupedOrders(page, PAGE_SIZE, appliedFilters);
        setGroupedItems(data.results);
        setTotalPrice(data.total_price);
        setTotalPages(data.total_pages);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch grouped orders. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const allRows = [
      ["Date", "Item Name", "Count", "Price per Item", "Total Price"],
    ];
    let grandTotal = 0;

    Object.keys(groupedItems).forEach((date) => {
      groupedItems[date].forEach((item) => {
        const itemTotal = item.count * item.price;
        grandTotal += itemTotal;
        allRows.push([
          formatDate(date),
          item.item_name,
          item.count,
          item.price,
          itemTotal.toFixed(2),
        ]);
      });
      allRows.push([]);
    });

    allRows.push([]);
    allRows.push(["", "", "", "Grand Total", grandTotal.toFixed(2)]);
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    worksheet["!cols"] = allRows[0].map((_, colIndex) => ({
      wch: Math.max(
        ...allRows.map((row) =>
          row[colIndex] ? row[colIndex].toString().length + 2 : 10
        )
      ),
    }));

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "305496" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `all_orders_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleFilterSubmit = (newFilters) => {
    setFilters(newFilters);
    fetchData(1, newFilters);
    setIsFilterOpen(false);
  };

  const FilterModal = ({ onClose, onSubmit, filters }) => {
    const [type, setType] = useState(filters.type || "");
    const [isVerified, setIsVerified] = useState(filters.isVerified || "");
    const [startDate, setStartDate] = useState(filters.startDate || "");
    const [endDate, setEndDate] = useState(filters.endDate || "");

    const handleSubmit = () => {
      onSubmit({ type, isVerified, startDate, endDate });
    };

    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-[#124451] mb-4">
            Filter Orders
          </h2>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All</option>
              <option value="Product">Product</option>
              <option value="Food">Food</option>
              <option value="Service">Service</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold">
              Verified Status
            </label>
            <select
              value={isVerified}
              onChange={(e) => setIsVerified(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold">
              Start Date
            </label>
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold">End Date</label>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="bg-gray-300 text-[#124451] px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-[#124451] text-white px-4 py-2 rounded"
              onClick={handleSubmit}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading
            ? "Loading..."
            : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:px-4 rounded-full flex items-center gap-1"
            onClick={() => setIsFilterOpen(true)}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter</span>
          </button>
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:px-4 rounded-full flex items-center gap-1"
            onClick={() => setIsFilterOpen(true)}
          >
            + Add Item
          </button>
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:px-4 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-300" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
        </div>
      ) : Object.keys(groupedItems).length > 0 ? (
        <>
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-6 font-semibold text-gray-500 text-[14px] border-b pb-2 mb-2 border-gray-100 p-4">
              <div>Date</div>
              <div>Items</div>
              <div className="text-center">Count</div>
              <div className="text-center">Price / item</div>
              <div className="text-center">Total price / item</div>
              <div className="text-center">Total price</div>
            </div>
            {Object.keys(groupedItems).map((date, idx) => {
              const items = groupedItems[date];
              const totalPerRow = items.reduce(
                (sum, item) => sum + item.count * item.price,
                0
              );
              return (
                <div
                  key={date}
                  className={`${
                    idx % 2 === 0 ? "bg-gray-100" : "bg-white"
                  } p-4 grid grid-cols-6`}
                >
                  <div className="row-span-full flex items-center font-semibold">
                    {formatDate(date)}
                  </div>
                  <div className="col-span-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 text-sm text-gray-800 py-1"
                      >
                        <div>{item.item_name}</div>
                        <div className="text-center">{item.count}</div>
                        <div className="text-center">
                          ₹{item.price.toFixed(2)}
                        </div>
                        <div className="text-center">
                          ₹{(item.count * item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center font-semibold">
                    ₹ {totalPerRow.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {Object.keys(groupedItems).map((date, idx) => {
              const items = groupedItems[date];
              const totalPerRow = items.reduce(
                (sum, item) => sum + item.count * item.price,
                0
              );
              return (
                <div
                  key={date}
                  className={`${
                    idx % 2 === 0 ? "bg-gray-100" : "bg-white"
                  } p-4 rounded-lg shadow-sm`}
                >
                  <div className="font-semibold text-[#124451] mb-3">
                    {formatDate(date)}
                  </div>
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between mb-2 text-sm flex-wrap"
                    >
                      <span>{item.item_name}</span>
                      <span>Count: {item.count}</span>
                      <span>₹{item.price.toFixed(2)}</span>
                      <span>
                        Total: ₹{(item.count * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="font-semibold text-center mt-2 border-t pt-2">
                    Total Price: ₹ {totalPerRow.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 mt-12">
          No grouped orders found.
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            className="px-3 py-1 bg-[#124451] text-white rounded"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="flex items-center justify-center font-semibold px-3 py-1 border rounded">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-[#124451] text-white rounded"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {isFilterOpen && (
        <FilterModal
          onClose={() => setIsFilterOpen(false)}
          onSubmit={handleFilterSubmit}
          filters={filters}
        />
      )}

      {showAddItem && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowAddItem(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <AddItem
              onClose={() => {
                setShowAddItem(false);
                fetchData(); // Refresh list after adding item
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExpense;
