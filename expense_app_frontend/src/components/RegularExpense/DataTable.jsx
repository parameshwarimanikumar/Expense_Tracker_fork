import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getGroupedOrders } from "../../api_service/api";

const PAGE_SIZE = 6;

const DataTable = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueItems, setUniqueItems] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    item_name: "",
    user: "",
  });

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const data = await getGroupedOrders(page, PAGE_SIZE, filters);
        setGroupedItems(data.results);
        setTotalPrice(data.total_price);
        setTotalPages(data.total_pages);
        setCurrentPage(page);

        const datesSet = new Set();
        const itemsSet = new Set();
        const usersSet = new Set();

        Object.entries(data.results).forEach(([date, items]) => {
          datesSet.add(date);
          items.forEach((item) => {
            itemsSet.add(item.item_name);
            usersSet.add(item.user);
          });
        });

        setUniqueDates([...datesSet]);
        setUniqueItems([...itemsSet]);
        setUniqueUsers([...usersSet]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Date", "Item Name", "User", "Count", "Price/item", "Total/item"],
    ];
    let grandTotal = 0;

    Object.entries(groupedItems).forEach(([date, items]) => {
      items.forEach((item) => {
        const total = item.count * item.price;
        rows.push([
          formatDate(date),
          item.item_name,
          item.user,
          item.count,
          `₹${item.price.toFixed(2)}`,
          `₹${total.toFixed(2)}`,
        ]);
        grandTotal += total;
      });
      rows.push([]);
    });

    rows.push(["", "", "", "", "Grand Total", `₹${grandTotal.toFixed(2)}`]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading ? "Loading..." : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* Column Headers with Dropdown Filters */}
      {!loading && (
        <div className="grid grid-cols-7 gap-2 mb-2 p-2 bg-gray-50 text-xs font-medium text-gray-600">
          {/* Date Filter */}
          <div>
            <div className="text-[11px] font-semibold mb-1">Date</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            >
              <option value="">All</option>
              {uniqueDates.map((d, i) => (
                <option key={i} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Item Filter */}
          <div>
            <div className="text-[11px] font-semibold mb-1">Item</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.item_name}
              onChange={(e) => setFilters({ ...filters, item_name: e.target.value })}
            >
              <option value="">All</option>
              {uniqueItems.map((item, i) => (
                <option key={i} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <div className="text-[11px] font-semibold mb-1">User</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            >
              <option value="">All</option>
              {uniqueUsers.map((user, i) => (
                <option key={i} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Static Headers */}
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Count</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Price/item</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Total/item</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Total/date</div>
        </div>
      )}

      {/* Data Rows */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]" />
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-500 mt-12">No data found.</div>
      ) : (
        <>
          {Object.entries(groupedItems).map(([date, items], idx) => {
            const rowTotal = items.reduce((sum, item) => sum + item.count * item.price, 0);
            return (
              <div
                key={date}
                className={`${
                  idx % 2 === 0 ? "bg-gray-100" : "bg-white"
                } p-4 grid grid-cols-7`}
              >
                <div className="flex items-center">{formatDate(date)}</div>
                <div>
                  {items.map((item, i) => (
                    <div key={i} className="py-1">{item.item_name}</div>
                  ))}
                </div>
                <div>
                  {items.map((item, i) => (
                    <div key={i} className="text-center py-1">{item.user}</div>
                  ))}
                </div>
                <div>
                  {items.map((item, i) => (
                    <div key={i} className="text-center py-1">{item.count}</div>
                  ))}
                </div>
                <div>
                  {items.map((item, i) => (
                    <div key={i} className="text-center py-1">₹{item.price.toFixed(2)}</div>
                  ))}
                </div>
                <div>
                  {items.map((item, i) => (
                    <div key={i} className="text-center py-1">₹{(item.count * item.price).toFixed(2)}</div>
                  ))}
                </div>
                <div className="flex items-center justify-center font-semibold">
                  ₹{rowTotal.toFixed(2)}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
    </div>
  );
};

export default DataTable;
