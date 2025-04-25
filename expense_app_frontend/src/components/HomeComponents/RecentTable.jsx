import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from "react-icons/fa";
import { fetchExpenses, fetchOrderItemsByDate, deleteOrdersByDate } from '../../api_service/api';
import dayjs from 'dayjs';
import { Tooltip } from 'react-tooltip';
import AddItemTable from './AddItemTable';

const RecentTable = () => {
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const data = await fetchExpenses();
      setRecentData(data.slice(0, 10)); // Show latest 10 entries
    } catch (error) {
      console.error('Error fetching recent data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleEdit = async (item) => {
    const today = dayjs().format('YYYY-MM-DD');

    if (item.is_refunded) {
      alert("Refunded orders cannot be edited.");
      return;
    }

    if (item.date !== today || item.user !== currentUser?.username) {
      alert("Only today's orders created by you can be edited.");
      return;
    }

    try {
      const orderItems = await fetchOrderItemsByDate(item.date, item.user);
      setEditingData({
        date: item.date,
        user: item.user,
        orderItems,
        orderId: item.order_id,
      });
      setIsEditing(true);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete all orders for ${item.user} on ${item.date}?`
    );
    if (!confirmDelete) return;

    try {
      await deleteOrdersByDate(item.date, item.user);
      alert("Orders deleted successfully.");
      fetchRecent();
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert("Failed to delete orders.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData(null);
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    setEditingData(null);
    fetchRecent();
  };

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Recent Entries Table */}
      <div className="bg-white rounded-xl p-4 md:p-6 flex-1 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#124451]">Recently Added</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-100 text-[14px] sticky top-0 bg-white">
                <th className="p-2 md:p-3 font-medium">Date</th>
                <th className="p-2 md:p-3 font-medium">User</th>
                <th className="p-2 md:p-3 text-center font-medium">Count</th>
                <th className="p-2 md:p-3 text-center font-medium">Amount</th>
                <th className="p-2 md:p-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">Loading...</td>
                </tr>
              ) : recentData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">No recent entries found</td>
                </tr>
              ) : (
                recentData.map((data) => {
                  const isToday = data.date === today;
                  const isRefunded = data.is_refunded;
                  const isCurrentUser = data.user === currentUser?.username;

                  const canEdit = isToday && isCurrentUser && !isRefunded;
                  const canDelete = isToday;

                  return (
                    <tr key={data.order_id} className="text-sm font-semibold border-b border-gray-100">
                      <td className="p-2 md:p-3">{dayjs(data.date).format('MMM D, YYYY')}</td>
                      <td className="p-2 md:p-3">{data.user}</td>
                      <td className="p-2 md:p-3 text-center">{data.total_count}</td>
                      <td className="p-2 md:p-3 text-center">₹{data.total_amount.toFixed(2)}</td>
                      <td className="p-2 md:p-3 flex justify-center gap-4">
                        <button
                          onClick={() => handleEdit(data)}
                          disabled={!canEdit}
                          data-tooltip-id={`edit-tooltip-${data.order_id}`}
                          data-tooltip-content={
                            canEdit
                              ? ""
                              : isRefunded
                              ? "Refunded entries cannot be edited"
                              : !isToday
                              ? "Only today's entries can be edited"
                              : !isCurrentUser
                              ? "You can only edit your own entries"
                              : ""
                          }
                          className={`${!canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <FaEdit size={14} color={canEdit ? "#16A63D" : "gray"} />
                        </button>

                        <button
                          onClick={() => handleDelete(data)}
                          disabled={!canDelete}
                          data-tooltip-id={`delete-tooltip-${data.order_id}`}
                          data-tooltip-content={
                            canDelete ? "" : "Only today's entries can be deleted"
                          }
                          className={`${!canDelete ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <FaTrash size={14} color={canDelete ? "red" : "gray"} />
                        </button>

                        <Tooltip id={`edit-tooltip-${data.order_id}`} />
                        <Tooltip id={`delete-tooltip-${data.order_id}`} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Item Section */}
      <div className="bg-white rounded-xl p-4 md:p-6 flex-1">
        {isEditing ? (
          <AddItemTable
            editMode={true}
            editingData={editingData}
            onCancel={handleCancelEdit}
            onUpdateSuccess={handleUpdateSuccess}
          />
        ) : (
          <AddItemTable onUpdateSuccess={fetchRecent} />
        )}
      </div>
    </div>
  );
};

export default RecentTable;
