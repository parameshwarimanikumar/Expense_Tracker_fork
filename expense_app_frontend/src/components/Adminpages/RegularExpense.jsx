import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faPlus } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AddItem from "../UpdateItem/Additem";
import { getGroupedOrders } from "../../api_service/api";

const PAGE_SIZE = 7;

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dropdown filter states
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [uniqueItems, setUniqueItems] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const fetchGroupedData = useCallback(
    async (page) => {
      setLoading(true);
      try {
        const filters = {};
        if (selectedUser) filters.user = selectedUser;
        if (selectedItem) filters.item_name = selectedItem;
        if (selectedDate) filters.date = selectedDate;

        const data = await getGroupedOrders(page, PAGE_SIZE, filters);
        setGroupedItems(data.results);
        setTotalPrice(data.total_price);
        setTotalPages(data.total_pages);

        // Extract unique values for dropdowns
        const usersSet = new Set();
        const itemsSet = new Set();
        const datesSet = new Set();

        Object.entries(data.results).forEach(([date, items]) => {
          datesSet.add(date);
          items.forEach((item) => {
            usersSet.add(item.user);
            itemsSet.add(item.item_name);
          });
        });

        setUniqueUsers([...usersSet]);
        setUniqueItems([...itemsSet]);
        setUniqueDates([...datesSet]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedUser, selectedItem, selectedDate]
  );

  useEffect(() => {
    fetchGroupedData(currentPage);
  }, [fetchGroupedData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchGroupedData(1);
  }, [selectedUser, selectedItem, selectedDate, fetchGroupedData]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Date", "Item", "User", "Count", "Price/item", "Total/item"],
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
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer]),
      `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
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
          {loading
            ? "Loading..."
            : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
            onClick={() => setShowAddItem(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Add Item</span>
          </button>
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* Header with inline dropdown filters */}
      {!loading && (
        <div className="grid grid-cols-7 gap-2 px-2 py-3 bg-gray-50 text-[13px] font-semibold text-gray-600 border-b">
          <div>
            <div>Date</div>
            <select
              className="mt-1 text-xs p-1 rounded w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">All</option>
              {uniqueDates.map((d, i) => (
                <option key={i} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div>Item</div>
            <select
              className="mt-1 text-xs p-1 rounded w-full"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <option value="">All</option>
              {uniqueItems.map((item, i) => (
                <option key={i} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div>User</div>
            <select
              className="mt-1 text-xs p-1 rounded w-full"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">All</option>
              {uniqueUsers.map((user, i) => (
                <option key={i} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-center pb-1">Count</div>
          <div className="flex items-end justify-center pb-1">Price/item</div>
          <div className="flex items-end justify-center pb-1">Total/item</div>
          <div className="flex items-end justify-center pb-1">Total/date</div>
        </div>
      )}

      {/* Table Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-500 mt-12">
          No expense records available.
        </div>
      ) : (
        <>
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
                } p-4 grid grid-cols-7`}
              >
                <div className="flex items-center">{formatDate(date)}</div>
                <div className="col-span-1">
                  {items.map((item, index) => (
                    <div key={index} className="py-1">
                      {item.item_name}
                    </div>
                  ))}
                </div>
                <div>
                  {items.map((item, index) => (
                    <div key={index} className="text-center py-1">
                      {item.user}
                    </div>
                  ))}
                </div>
                <div>
                  {items.map((item, index) => (
                    <div key={index} className="text-center py-1">
                      {item.count}
                    </div>
                  ))}
                </div>
                <div>
                  {items.map((item, index) => (
                    <div key={index} className="text-center py-1">
                      ₹{item.price.toFixed(2)}
                    </div>
                  ))}
                </div>
                <div>
                  {items.map((item, index) => (
                    <div key={index} className="text-center py-1">
                      ₹{(item.count * item.price).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center font-semibold">
                  ₹ {totalPerRow.toFixed(2)}
                </div>
              </div>
            );
          })}

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
