import React, { useState, useEffect, useCallback } from 'react';
import { faFilePdf, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getGroupedOrders, getAvailableDates } from "../../api_service/api";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';



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

  // Use `useCallback` to memoize the fetchData function
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

      // Fetch available dates if not already loaded
      if (availableDates.length === 0) {
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading ? 'Loading...' : `Total Price: ₹ ${totalPrice.toFixed(2)}`}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1">
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
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
        </div>
      )}

      {/* Table View */}
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
                    <div key={index} className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-800 py-2 border-b last:border-b-0">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Count:</span> <span>{item.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span> <span>₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Total:</span> <span>₹{(item.count * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-2 border-t font-semibold flex justify-between">
                    <span>Total:</span> <span>₹{totalPerRow.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* No Data Found */}
      {!loading && Object.keys(groupedItems).length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No orders found matching your filters
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <div>
            {currentPage > 1 && (
              <button className="px-3 py-1 border rounded text-gray-700" onClick={() => handlePageChange(currentPage - 1)}>
                Previous
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - (4 - i);
              else pageNum = currentPage - 2 + i;

              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    className={`px-2 py-1 border ${currentPage === pageNum ? 'bg-[#124451] text-white' : 'text-gray-700'}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
            })}
          </div>
          <div>
            {currentPage < totalPages && (
              <button className="px-3 py-1 border rounded text-gray-700" onClick={() => handlePageChange(currentPage + 1)}>
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Popup */}
      {showFilter && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[#124451] mb-4">Apply Filters</h3>
            <div className="mb-4">
              <DatePicker
                selected={filters.start_date}
                onChange={(date) => setFilters((prev) => ({ ...prev, start_date: date }))}
                placeholderText="Start Date"
                className="w-full p-2 border rounded-md"
              />
              <DatePicker
                selected={filters.end_date}
                onChange={(date) => setFilters((prev) => ({ ...prev, end_date: date }))}
                placeholderText="End Date"
                className="w-full p-2 border rounded-md mt-2"
              />
            </div>
            <button
              className="w-full bg-[#124451] text-white py-2 rounded-lg"
              onClick={() => handleFilterSubmit(filters)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
