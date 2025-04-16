import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaSync } from "react-icons/fa";
import { RecentlyAdded, fetchOrderItemsByDate, deleteOrder, deleteOrdersByDate } from '../../api_service/api';
import dayjs from 'dayjs';
import { Tooltip } from 'react-tooltip';
import AddItemTable from './AddItemTable';

const RecentTable = () => {
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));


  //Fetching recent data

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const data = await RecentlyAdded();
      setRecentData(data.slice(0, 10));
    } catch (error) {
      console.log('Error fetching recent data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleEdit = async (item) => {
    const today = dayjs().format('YYYY-MM-DD');
    const isToday = item.date === today;
  
    if (!isToday || item.user !== currentUser?.username) {
      alert("Only today's orders created by you can be edited.");
      return;
    }
  
    try {
      const orderItems = await fetchOrderItemsByDate(item.date, item.user);
  
      setEditingData({
        date: item.date,
        user: item.user,
        orderItems,
        
        // orderId: orderItems[0]?.order
        orderId: item.order_id
      });
      setIsEditing(true);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };
  
  
  
  console.log(editingData)

  //Handle Delete

  // const handleDelete = async (item) => {
  //   if (!item.order_id) {
  //     alert("Cannot delete: missing order ID");
  //     console.warn("Delete failed. Item missing order_id:", item);
  //     return;
  //   }
  //   try {
  //     // await deleteOrder(item.id);
  //     await deleteOrder(item.order_id);
  //     alert("Order deleted successfully.");
  //     fetchRecent(); // refresh the table
  //   } catch (error) {
  //     console.error("Error deleting order:", error);
  //     alert("Delete failed.");
  //   }
  // };
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
  
  

  // TO cancel Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData(null);
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    setEditingData(null);
    fetchRecent(); 
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="bg-white rounded-xl p-4 md:p-6 flex-1 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#124451]">Recently Added</h2>
          {/* <button 
            onClick={fetchRecent}
            className="text-[#124451] hover:text-[#0d2e33] cursor-pointer"
          >
            <FaSync size={18} />
          </button> */}
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
                recentData.map((data, index) => {
                  const today = dayjs().format('YYYY-MM-DD');
                  const isToday = data.date === today;
                  return (
                    <tr key={index} className="text-sm font-semibold border-b border-gray-100">

                      <td className="p-2 md:p-3">{data.date}</td>
                      <td className="p-2 md:p-3">{data.user}</td>
                      <td className="p-2 md:p-3 text-center">{data.total_count}</td>
                      <td className="p-2 md:p-3 text-center">₹{data.total_amount.toFixed(2)}</td>
                      <td className="p-2 md:p-3 flex justify-center gap-4">

                        <button
                          onClick={() => isToday && handleEdit(data)}
                          data-tooltip-id="edit-tooltip"
                          data-tooltip-content={!isToday ? "Only today's entries can be edited" : ""}
                          className={!isToday ? 'cursor-not-allowed' : 'cursor-pointer'}
                        >
                          <FaEdit size={14} color={isToday ? "#16A63D" : "gray"} />
                        </button>

                        <button
                          onClick={() => isToday && handleDelete(data)}
                          data-tooltip-id="delete-tooltip"
                          data-tooltip-content={!isToday ? "Only today's entries can be deleted" : ""}
                          className={!isToday ? 'cursor-not-allowed' : 'cursor-pointer'}
                        >
                          <FaTrash size={14} color={isToday ? "red" : "gray"} />
                        </button>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Tooltip id="edit-tooltip" />
          <Tooltip id="delete-tooltip" />
        </div>
      </div>

      {/* Item Row */}
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