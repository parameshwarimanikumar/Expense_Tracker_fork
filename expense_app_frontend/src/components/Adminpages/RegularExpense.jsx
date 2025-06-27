import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faPlus, faFilter } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AddItem from "../UpdateItem/Additem";
import { getGroupedOrders } from "../../api_service/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PAGE_SIZE = 7;

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [itemName, setItemName] = useState("");

  const fetchGroupedData = useCallback(async (page) => {
    setLoading(true);
    try {
      const filters = {};
      if (startDate) filters.start_date = startDate.toISOString().slice(0, 10);
      if (endDate) filters.end_date = endDate.toISOString().slice(0, 10);
      if (itemName) filters.item_name = itemName;

      const data = await getGroupedOrders(page, PAGE_SIZE, filters);
      setGroupedItems(data.results);
      setTotalPrice(data.total_price);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, itemName]);

  useEffect(() => {
    fetchGroupedData(currentPage);
  }, [fetchGroupedData, currentPage]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [["Date", "Item", "Count", "Price/item", "Total/item"]];
    let grandTotal = 0;

    Object.entries(groupedItems).forEach(([date, items]) => {
      items.forEach((item) => {
        const total = item.count * item.price;
        rows.push([
          formatDate(date),
          item.item_name,
          item.count,
          `₹${item.price.toFixed(2)}`,
          `₹${total.toFixed(2)}`
        ]);
        grandTotal += total;
      });
      rows.push([]);
    });

    rows.push(["", "", "", "Grand Total", `₹${grandTotal.toFixed(2)}`]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFilterApply = () => {
    setShowFilter(false);
    setCurrentPage(1);
    fetchGroupedData(1);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setItemName("");
    setCurrentPage(1);
    fetchGroupedData(1);
    setShowFilter(false);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading ? "Loading..." : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
            onClick={() => setShowFilter(true)}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
            onClick={() => setShowAddItem(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Add Item</span>
          </button>
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
          <button
            className="bg-gray-300 text-[#124451] px-3 py-1 text-sm md:text-base md:px-4 rounded-full"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button className="absolute top-3 right-4 text-xl" onClick={() => setShowFilter(false)}>×</button>
            <h3 className="text-lg font-semibold mb-4">Filter Expenses</h3>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full p-2 border rounded"
                placeholderText="Select start date"
                dateFormat="yyyy-MM-dd"
                isClearable
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="w-full p-2 border rounded"
                placeholderText="Select end date"
                dateFormat="yyyy-MM-dd"
                isClearable
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Item Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleClearFilters}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-[#124451] text-white rounded" onClick={handleFilterApply}>
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-500 mt-12">No expense records available.</div>
      ) : (
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
              const totalPerRow = items.reduce((sum, item) => sum + item.count * item.price, 0);
              return (
                <div key={date} className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 grid grid-cols-6`}>
                  <div className="row-span-full flex items-center font-semibold">
                    {formatDate(date)}
                  </div>
                  <div className="col-span-4">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 text-sm text-gray-800 py-1">
                        <div>{item.item_name}</div>
                        <div className="text-center">{item.count}</div>
                        <div className="text-center">₹{item.price.toFixed(2)}</div>
                        <div className="text-center">₹{(item.count * item.price).toFixed(2)}</div>
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
              const totalPerRow = items.reduce((sum, item) => sum + item.count * item.price, 0);
              return (
                <div key={date} className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 rounded-lg shadow-sm`}>
                  <div className="font-semibold text-[#124451] mb-3">{formatDate(date)}</div>
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between mb-2 text-sm">
                      <span>{item.item_name}</span>
                      <span>Count: {item.count}</span>
                      <span>₹{item.price.toFixed(2)}</span>
                      <span>Total: ₹{(item.count * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="font-semibold text-center mt-2 border-t pt-2">
                    Total Price: ₹ {totalPerRow.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
        </>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
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
                fetchGroupedData(currentPage);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExpense;
