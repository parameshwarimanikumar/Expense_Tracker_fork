import React, { useState, useEffect, useCallback } from "react";
import { faFileExcel, faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getGroupedOrders, getAvailableDates } from "../../api_service/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
 
const DataTable = () => {
const [groupedItems, setGroupedItems] = useState({});
const [loading, setLoading] = useState(true);
const [showFilter, setShowFilter] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [availableDates, setAvailableDates] = useState([]);
const [totalPrice, setTotalPrice] = useState(0);
const [filters, setFilters] = useState({
start_date: null,
end_date: null,
specific_date: null,
month: null,
});
 
const PAGE_SIZE = 10;
 
const fetchData = useCallback(
async (page = 1) => {
setLoading(true);
try {
const apiFilters = {};
if (filters.start_date)
apiFilters.start_date = filters.start_date
.toISOString()
.split("T")[0];
if (filters.end_date)
apiFilters.end_date = filters.end_date.toISOString().split("T")[0];
if (filters.specific_date)
apiFilters.specific_date = filters.specific_date
.toISOString()
.split("T")[0];
if (filters.month) apiFilters.month = filters.month;
 
const data = await getGroupedOrders(page, PAGE_SIZE, apiFilters);
setGroupedItems(data.results);
setTotalPrice(data.total_price);
setTotalPages(data.total_pages);
setCurrentPage(page);
 
if (availableDates.length === 0) {
const dates = await getAvailableDates();
setAvailableDates(dates);
}
} catch (error) {
console.error("Error fetching data:", error);
alert("Failed to fetch grouped orders. Please try again.");
} finally {
setLoading(false);
}
},
[filters, availableDates.length]
);
 
useEffect(() => {
fetchData();
}, [fetchData]);
 
const handleFilterSubmit = (newFilters) => {
setFilters(newFilters);
setShowFilter(false);
setCurrentPage(1);
};
 
const handlePageChange = (page) => {
if (page >= 1 && page <= totalPages) {
fetchData(page);
}
};
 
// Updated formatDate to return a safe sheet name for Excel (YYYY-MM-DD)
const formatDate = (dateString) => {
const d = new Date(dateString);
const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
return `${year}-${month}-${day}`;
};
 
const downloadExcel = () => {
const workbook = XLSX.utils.book_new();
 
const allRows = [
["Date", "Item Name", "Count", "Price per Item", "Total Price"],
];
 
let grandTotal = 0;
 
Object.keys(groupedItems).forEach((date) => {
const items = groupedItems[date];
 
items.forEach((item) => {
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
 
// Add empty row after each date group
allRows.push([]);
});
 
// Add Grand Total row
allRows.push([]);
allRows.push(["", "", "", "Grand Total", grandTotal.toFixed(2)]);
 
const worksheet = XLSX.utils.aoa_to_sheet(allRows);
 
// Auto column width
const colWidths = allRows[0].map((_, colIndex) => {
return Math.max(
...allRows.map((row) => {
const cell = row[colIndex];
if (cell == null) return 10;
return cell.toString().length + 2;
})
);
});
worksheet["!cols"] = colWidths.map((w) => ({ wch: w }));
 
// Bold header row
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
 
const blob = new Blob([excelBuffer], {
type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});
 
const fileName = `all_orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
saveAs(blob, fileName);
};
 
return (
<div className="p-4 md:p-6 bg-white rounded-lg min-h-screen relative">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
<h2 className="text-lg md:text-xl font-bold text-[#124451]">
{loading
? "Loading..."
: `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
</h2>
<div className="flex gap-2 w-full md:w-auto">
<button
className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
onClick={downloadExcel}
>
<FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
<span className="hidden sm:inline">Download Excel</span>
</button>
 
<button
className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
onClick={() => setShowFilter(true)}
>
<FontAwesomeIcon icon={faFilter} />
<span className="hidden sm:inline">Filter</span>
</button>
 
<button
className="bg-gray-300 text-[#124451] px-3 py-1 text-sm md:text-base md:px-4 rounded-full"
onClick={() =>
handleFilterSubmit({
start_date: null,
end_date: null,
specific_date: null,
month: null,
})
}
>
Clear Filters
</button>
</div>
</div>
 
{loading && (
<div className="flex justify-center items-center h-64">
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
</div>
)}
 
{!loading && Object.keys(groupedItems).length > 0 && (
<>
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
className="flex justify-between mb-2 text-sm"
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
)}
 
{showFilter && (
<FilterModal
onClose={() => setShowFilter(false)}
onSubmit={handleFilterSubmit}
availableDates={availableDates}
filters={filters}
/>
)}
 
{!loading && Object.keys(groupedItems).length === 0 && (
<div className="text-center text-gray-500 mt-12">
No grouped orders found.
</div>
)}
 
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
 
const FilterModal = ({ onClose, onSubmit, availableDates, filters }) => {
const [startDate, setStartDate] = useState(filters.start_date);
const [endDate, setEndDate] = useState(filters.end_date);
const [month, setMonth] = useState(filters.month);
 
const uniqueMonths = Array.from(
new Set(
availableDates.map((dateStr) => {
const date = new Date(dateStr);
return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
2,
"0"
)}`;
})
)
);
 
const handleSubmit = () => {
onSubmit({
start_date: startDate,
end_date: endDate,
month,
});
};
 
return (
<div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
<h2 className="text-xl font-bold text-[#124451] mb-4">Filter Orders</h2>
 
<div className="mb-4">
<label className="block mb-1 text-sm font-semibold">Start Date</label>
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
<label className="block mb-1 text-sm font-semibold">End Date</label>
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
<label className="block mb-1 text-sm font-semibold">Month</label>
<select
className="w-full p-2 border rounded"
value={month || ""}
onChange={(e) => setMonth(e.target.value || null)}
>
<option value="">Select Month</option>
{uniqueMonths.map((m) => (
<option key={m} value={m}>
{new Date(`${m}-01`).toLocaleString("default", {
month: "long",
year: "numeric",
})}
</option>
))}
</select>
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
 
export default DataTable;