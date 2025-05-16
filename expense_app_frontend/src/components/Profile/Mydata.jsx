import React, { useState, useEffect } from "react";
import axios from "axios";

const Mydata = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyExpenses = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        alert("Please login to continue.");
        return;
      }
      try {
        const response = await axios.get(
          "http://localhost:8000/api/expenses/mydata/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching your expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyExpenses();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="text-center font-bold mb-4 text-xl">My Expense</h2>

      {loading ? (
        <p className="text-center">Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <p className="text-center">No expenses found.</p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: "40vh" }}>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-1">S.No</th>
                <th className="border border-gray-300 px-3 py-1">Date</th>
                <th className="border border-gray-300 px-3 py-1">Description</th>
                <th className="border border-gray-300 px-3 py-1">Type</th>
                <th className="border border-gray-300 px-3 py-1">Bill</th>
                <th className="border border-gray-300 px-3 py-1">Amount</th>
                <th className="border border-gray-300 px-3 py-1">Is Verified</th>
                <th className="border border-gray-300 px-3 py-1">Is Refunded</th>
                <th className="border border-gray-300 px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id} className="text-center hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-1">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-1 break-words max-w-xs">
                    {expense.description}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {expense.type}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {expense.bill ? (
                      <a
                        href={expense.bill}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Uploaded
                      </a>
                    ) : (
                      "No File"
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {expense.is_verified ? "Verified" : "Not Verified"}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {expense.is_refunded ? "Refunded" : "Pending"}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    <button
                      title="Edit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                      onClick={() => alert(`Edit expense ID: ${expense.id}`)}
                    >
                       Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Mydata;
