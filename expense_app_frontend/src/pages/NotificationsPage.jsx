import React, { useEffect, useState } from "react";
import axios from "axios";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("http://127.0.0.1:8000/api/notifications/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Notifications:", res.data.notifications); // 🔍 Check date field name
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  // Helper to get proper date
  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    return isNaN(date) ? "Invalid date" : date.toLocaleString();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">All Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n, index) => (
            <li key={index} className="p-3 bg-white rounded shadow border">
              <div>{n.message}</div>
              <div className="text-sm text-gray-500">
                {formatDate(n.created_at || n.created || n.date || n.timestamp)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
