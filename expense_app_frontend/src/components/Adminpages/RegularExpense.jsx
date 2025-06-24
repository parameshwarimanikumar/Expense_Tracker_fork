import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faPlus } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AddItem from "../UpdateItem/Additem";
import { getGroupedOrders } from "../../api_service/api";

const PAGE_SIZE = 10;

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupedData(currentPage);
  }, [currentPage]);

  const fetchGroupedData = async (page) => {
    setLoading(true);
    try {
      const data = await getGroupedOrders(page, PAGE_SIZE);
      setGroupedItems(data.results);
      setTotalPrice(data.total_price);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
          `₹${total.toFixed(2)}`,
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

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#124451]">Total Price: ₹ {totalPrice.toFixed(2)}</h2>
        <div className="flex gap-2">
          <button
            className="bg-[#124451] text-white px-3 py-2 rounded flex items-center gap-2"
            onClick={() => setShowAddItem(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Item
          </button>
          <button
            className="bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} /> Download Excel
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 bg-gray-100 py-2 font-semibold text-sm text-gray-700">
        <div className="pl-2">Date</div>
        <div className="col-span-2">Items</div>
        <div className="text-center">Count</div>
        <div className="text-center">Price / item</div>
        <div className="text-center">Total price / item</div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([date, items], i) => {
          const rowTotal = items.reduce((acc, item) => acc + item.count * item.price, 0);
          return (
            <div key={date} className={`grid grid-cols-6 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
              <div className="pl-2 font-medium">{formatDate(date)}</div>
              <div className="col-span-2">
                {items.map((item, idx) => (
                  <div key={idx}>{item.item_name}</div>
                ))}
              </div>
              <div className="text-center">
                {items.map((item, idx) => (
                  <div key={idx}>{item.count}</div>
                ))}
              </div>
              <div className="text-center">
                {items.map((item, idx) => (
                  <div key={idx}>₹{item.price.toFixed(2)}</div>
                ))}
              </div>
              <div className="text-center font-semibold">
                ₹{rowTotal.toFixed(2)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">No expense records available.</div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-[#124451] text-white" : "bg-gray-100"
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowAddItem(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <AddItem onClose={() => { setShowAddItem(false); fetchGroupedData(currentPage); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExpense;
