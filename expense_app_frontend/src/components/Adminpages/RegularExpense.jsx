import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faPlus,
  faTrash,
  faEdit,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AddItem from "../UpdateItem/Additem";
import { getGroupedOrders } from "../../api_service/api";
import axios from "axios";

const PAGE_SIZE = 5;

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [uniqueItems, setUniqueItems] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showEditItem, setShowEditItem] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    item: "",
    count: "",
    price: "",
    date: "",
  });

  const currentUser = localStorage.getItem("username");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user.role?.role_name || "").toLowerCase();

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

        const usersSet = new Set();
        const itemsSet = new Set();
        const datesSet = new Set();

        Object.entries(data.results).forEach(([date, items]) => {
          datesSet.add(date);
          items.forEach((item) => {
            usersSet.add(item.user);
            itemsSet.add(
              JSON.stringify({ id: item.item_id, name: item.item_name })
            );
          });
        });

        setUniqueUsers([...usersSet]);
        setUniqueItems([...itemsSet].map((s) => JSON.parse(s)));
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
  const resetFilters = () => {
    setSelectedUser("");
    setSelectedItem("");
    setSelectedDate("");
  };

  const handleDelete = async (itemId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirm) return;
    try {
      await axios.delete(`http://localhost:8000/api/order-items/${itemId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      fetchGroupedData(currentPage);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("❌ Failed to delete item.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = new Date(editFormData.date)
        .toISOString()
        .split("T")[0];

      const payload = {
        item: editFormData.item,
        count: Number(editFormData.count.toString().trim()), // ✅ sanitize count
        added_date: formattedDate,
      };

      await axios.put(
        `http://localhost:8000/api/order-items/${editFormData.id}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      alert("✅ Item updated successfully");
      setShowEditItem(false);
      fetchGroupedData(currentPage);
    } catch (error) {
      console.error("Edit failed:", error.response?.data || error);
      alert("❌ Failed to update item.");
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading
            ? "Loading..."
            : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          {userRole === "admin" && (
            <button
              className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
              onClick={() => setShowAddItem(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          )}

          <button
            className="bg-gray-300 text-black px-4 py-1 rounded-full flex items-center gap-1 hover:bg-gray-400"
            onClick={resetFilters}
          >
            Reset Filters
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

      {/* Filters */}
      {!loading && (
        <div className="grid grid-cols-8 gap-2 px-2 py-3 bg-gray-50 text-[13px] font-semibold text-gray-600 border-b">
          <div>
            Date
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 text-xs p-1 rounded w-full"
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
            Item
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="mt-1 text-xs p-1 rounded w-full"
            >
              <option value="">All</option>
              {uniqueItems.map((item, i) => (
                <option key={i} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            User
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 text-xs p-1 rounded w-full"
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
          <div className="flex items-end justify-center pb-1">Action</div>
        </div>
      )}

      {/* Table */}
      {!loading &&
        Object.keys(groupedItems).map((date, idx) => {
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
              } p-4 grid grid-cols-8`}
            >
              <div className="flex items-center">{formatDate(date)}</div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="py-1">
                    {item.item_name}
                  </div>
                ))}
              </div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {item.user}
                  </div>
                ))}
              </div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {item.count}
                  </div>
                ))}
              </div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    ₹{item.price.toFixed(2)}
                  </div>
                ))}
              </div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    ₹{(item.count * item.price).toFixed(2)}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center font-semibold">
                ₹ {totalPerRow.toFixed(2)}
              </div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {(userRole === "admin" || item.user === currentUser) && (
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => {
                            setEditFormData({
                              id: item.id,
                              item: item.item_id,
                              count: item.count,
                              price: item.price,
                              date: date,
                            });
                            setShowEditItem(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <span className="flex items-center justify-center font-semibold px-3 py-1 border rounded">
            {currentPage} of {totalPages}
          </span>

          <button
            className="px-3 py-1 bg-[#124451] text-white rounded"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditItem && (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowEditItem(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Edit Item
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Item</label>
                <select
                  value={editFormData.item}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, item: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Item</option>
                  {uniqueItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Count</label>
                <input
                  type="number"
                  value={editFormData.count}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, count: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Count"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#124451] text-white rounded w-full"
              >
                Update
              </button>
            </form>
          </div>
        </div>
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
