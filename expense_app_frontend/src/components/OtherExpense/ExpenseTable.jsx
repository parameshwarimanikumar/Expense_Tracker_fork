import React, { useState } from "react";
import { FaFilter, FaFileInvoice, FaCheckCircle, FaTimesCircle, FaRedo, FaEdit, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const expenses = [
  { id: 1, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: false, isRefunded: false },
  { id: 2, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: false, isRefunded: false },
  { id: 3, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: false, isRefunded: false },
  { id: 4, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: false, isRefunded: false },
  { id: 5, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
  { id: 6, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
  { id: 7, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
  { id: 8, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
  { id: 9, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
  { id: 10, date: "12/10/2025", description: "Battery, Paper, Pen", type: "Product", bill: 100, amount: 100, isVerified: true, isRefunded: true },
 ];

const ExpenseTable = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  
  const showfilter = () => {
    setShowFilter(!showFilter);
  }

  const showexpense = () => {
    setShowExpense(!showExpense);
  }


  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Total Price: ₹ 1000</h2>
        <div className="flex gap-2">
          <button className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-2" onClick={showfilter}>
            <FaFilter /> Filter
          </button>
          <button className="bg-[#124451] text-white px-4 py-1 rounded-full" onClick={showexpense}>Add Expense</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full ">
          {/* Table Header */}
          <thead className="border-b border-gray-100 text-gray-500 text-[14px] font-medium">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Bill</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Is Verified</th>
              <th className="p-3 text-left">Is Refunded</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="text-gray-800 text-sm">
            {expenses.map((expense, index) => (
              <tr key={expense.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{expense.date}</td>
                <td className="p-3">{expense.description}</td>
                <td className="p-3">{expense.type}</td>
                <td className="p-3 flex items-center gap-2">
                  <FaFileInvoice className="text-gray-500" />
                  {/* {expense.bill} */}
                </td>
                <td className="p-3">₹ {expense.amount}</td>
                <td className="p-3">
                  {expense.isVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaCheckCircle /> Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <FaTimesCircle /> Not Verified
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {expense.isRefunded ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaRedo /> Refunded
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-500">
                      <FaRedo /> Pending
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {expense.isVerified && expense.isRefunded ?
                  <button className="text-gray-600" disabled>
                    <FaEdit />
                  </button> : 
                  <button className="text-green-600 cursor-pointer">
                    <FaEdit />
                  </button> }

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2 text-sm">
          <button className="px-2 py-1 border rounded text-gray-400 cursor-not-allowed">
            <FaChevronLeft />
          </button>
          <button className="px-3 py-1 bg-[#124451] text-white rounded">1</button>
          <button className="px-3 py-1 border rounded">2</button>
          <button className="px-2 py-1 border rounded">
            <FaChevronRight />
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4 relative">

            <h2 className="text-lg md:text-xl font-bold text-[#124451] mb-4">Filter Items</h2>

            <label className="block mb-3">
              <span className="text-sm font-medium text-gray-700">Select Month</span>
              <input type="month" className="mt-1 w-full px-3 py-2 border rounded-md" />
            </label>

            <div className="flex justify-end mt-6 gap-2">
              <button 
                className="px-4 py-1 border rounded-full cursor-pointer"
                onClick={() => setShowFilter(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-[#124451] text-white px-4 py-1 rounded-full cursor-pointer"
                onClick={() => setShowFilter(false)}
              >
                Submit
              </button>
            </div>

          </div>
        </div>
      )}




      {showExpense && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4 relative">

            <h2 className="text-lg md:text-xl font-bold text-[#124451] mb-4">Add Expense</h2>
            <div className="ml-10">
              <label className="block mb-3">
                <span className="text-md font-medium text-[#124451]">Select Date</span>
                <input type="date" className="mt-1 px-3 py-2 border rounded-md ml-6 border-gray-300" />
              </label>

              <label className="block mb-3">
                <span className="text-md font-medium text-[#124451]">Description</span>
                <textarea name="" id="" className="border rounded-md ml-6 border-gray-300"></textarea>
              </label>

              <label className="block mb-3">
                <span className="text-md font-medium text-[#124451]">Type</span>
                <select className="border border-gray-300 px-2 py-1 rounded-md w-30 ml-18">
                  <option value="Product">Product</option>
                  <option value="Tea">Sevice</option>
                </select>
              </label>
              
              <label className="block mb-3">
                <span className="text-md font-medium text-[#124451]">Upload Bill</span>
                <input type="file" className="mt-1 px-3 py-2 border rounded-md ml-6 w-40 border-gray-300" />
              </label>
            </div>
            
            
            <div className="flex justify-end mt-6 gap-2">

              <button className="px-4 py-1 border rounded-full cursor-pointer" onClick={() => setShowExpense(false)}>
                Cancel
              </button>

              <button className="bg-[#124451] text-white px-4 py-1 rounded-full cursor-pointer" onClick={() => setShowExpense(false)}>
                Submit
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpenseTable;
