import React, { useState, useEffect, useCallback } from 'react';
import { faFilePdf, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getGroupedOrders, getAvailableDates } from "../../api_service/api";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { jsPDF } from "jspdf";

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

  // Fetch data with filters and pagination
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const apiFilters = {};
      if (filters.start_date) apiFilters.start_date = filters.start_date.toISOString().split('T')[0];
      if (filters.end_date) apiFilters.end_date = filters.end_date.toISOString().split('T')[0];
      if (filters.specific_date) apiFilters.specific_date = filters.specific_date.toISOString().split('T')[0];
      if (filters.month) apiFilters.month = filters.month;

      const data = await getGroupedOrders(page, PAGE_SIZE, apiFilters);

      setGroupedItems(data.results);
      setTotalPrice(data.total_price);
      setTotalPages(data.total_pages);
      setCurrentPage(page);

      // Fetch available dates once for filters dropdowns, etc.
      if (availableDates.length === 0) {
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert("Failed to fetch grouped orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, availableDates.length]);

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

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // PDF download handler using jsPDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Grouped Orders Report", 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Price: ₹${totalPrice.toFixed(2)}`, 10, y);
    y += 10;

    Object.keys(groupedItems).forEach((date) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
      doc.setFontSize(14);
      doc.text(`Date: ${formatDate(date)}`, 10, y);
      y += 8;

      doc.setFontSize(11);
      doc.text("Item Name", 10, y);
      doc.text("Count", 80, y);
      doc.text("Price/item", 110, y);
      doc.text("Total Price", 150, y);
      y += 6;

      const items = groupedItems[date];
      let totalPerDate = 0;

      items.forEach((item) => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }
        doc.text(item.item_name, 10, y);
        doc.text(String(item.count), 80, y);
        doc.text(`₹${item.price.toFixed(2)}`, 110, y);
        const totalItemPrice = item.count * item.price;
        doc.text(`₹${totalItemPrice.toFixed(2)}`, 150, y);
        totalPerDate += totalItemPrice;
        y += 6;
      });

      doc.setFontSize(12);
      doc.text(`Total for ${formatDate(date)}: ₹${totalPerDate.toFixed(2)}`, 10, y);
      y += 10;
    });

    doc.save("orders_report.pdf");
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading ? 'Loading...' : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
            onClick={downloadPDF}
          >
            <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
            <span className="hidden sm:inline">Download PDF</span>
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
            onClick={() => handleFilterSubmit({ start_date: null, end_date: null, specific_date: null, month: null })}
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
              const totalPerRow = items.reduce((sum, item) => sum + (item.count * item.price), 0);

              return (
                <div key={date} className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 grid grid-cols-6`}>
                  <div className="row-span-full flex items-center font-semibold">{formatDate(date)}</div>
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
                  <div className="flex items-center justify-center font-semibold">₹ {totalPerRow.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          <div className="md:hidden space-y-4">
            {Object.keys(groupedItems).map((date, idx) => {
              const items = groupedItems[date];
              const totalPerRow = items.reduce((sum, item) => sum + (item.count * item.price), 0);

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
        <div className="text-center text-gray-500 mt-12">No grouped orders found.</div>
      )}

      {/* Pagination Controls */}
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
  const [specificDate, setSpecificDate] = useState(filters.specific_date);
  const [month, setMonth] = useState(filters.month);

  // Generate month options from availableDates
  const uniqueMonths = Array.from(
    new Set(
      availableDates.map((dateStr) => {
        const dt = new Date(dateStr);
        return dt.toISOString().slice(0, 7); // YYYY-MM
      })
    )
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      start_date: startDate,
      end_date: endDate,
      specific_date: specificDate,
      month: month,
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 font-bold text-xl"
          aria-label="Close filter modal"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-4 text-[#124451]">Filter Orders</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholderText="Select start date"
              maxDate={endDate || null}
              isClearable
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholderText="Select end date"
              minDate={startDate || null}
              isClearable
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Specific Date</label>
            <DatePicker
              selected={specificDate}
              onChange={(date) => setSpecificDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholderText="Select specific date"
              isClearable
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Month</label>
            <select
              value={month || ''}
              onChange={(e) => setMonth(e.target.value || null)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">-- Select month --</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#124451] text-white px-4 py-2 rounded hover:bg-[#0d3436]"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataTable;
