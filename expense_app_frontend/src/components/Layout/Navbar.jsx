import React, { useEffect, useState, useRef } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api_service/api";

const Navbar = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showFullView, setShowFullView] = useState(false);

  const handleAvatarClick = () => navigate("/profile");

  const handleBellClick = async () => {
    const toggled = !showDropdown;
    setShowDropdown(toggled);

    if (toggled) {
      await fetchNotifications();
      if (unreadCount > 0) {
        try {
          await axiosInstance.patch("/notifications/mark-all-read/");
          setUnreadCount(0);
        } catch (error) {
          console.error("Failed to mark notifications as read", error);
        }
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications/");
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(Array.isArray(res.data.notifications) ? res.data.notifications : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/profile/");
      if (res.data.profile_picture) {
        setProfileImage(res.data.profile_picture);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchProfile();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Helper to safely format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    const d = new Date(dateStr);
    return isNaN(d) ? "Invalid Date" : d.toLocaleString();
  };

  const getNotificationDate = (notif) =>
    notif.created_date || notif.created_at || notif.timestamp || null;

  return (
    <>
      <div className="fixed top-0 right-0 left-0 md:left-64 bg-white md:bg-[rgba(244,247,254,1)] z-40 shadow">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl text-[#124451] hidden font-semibold md:block">{title}</h1>

          <div className="flex items-center gap-3 md:hidden">
            <button onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          <div ref={dropdownRef} className="relative flex items-center gap-6 bg-white rounded-full px-6 py-2">
            {/* 🔔 Notification Icon */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faBell}
                className="text-gray-600 cursor-pointer"
                onClick={handleBellClick}
                title="Notifications"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* 🔔 Dropdown Preview */}
            {showDropdown && (
              <div className="absolute right-0 mt-10 w-72 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif, index) => (
                    <div key={notif.id || index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b">
                      <p className="text-sm font-medium">{notif.message || "Notification"}</p>
                      <small className="text-gray-400">
                        {formatDate(getNotificationDate(notif))}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500">No new notifications</div>
                )}

                <div
                  onClick={() => setShowFullView(true)}
                  className="text-center text-blue-600 text-sm py-2 cursor-pointer hover:underline border-t"
                >
                  View all
                </div>
              </div>
            )}

            {/* 👤 Avatar */}
            <img
              src={profileImage || "/default_avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full cursor-pointer border-2 border-blue-500 bg-gray-100"
              onClick={handleAvatarClick}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default_avatar.png";
              }}
            />
          </div>
        </div>
      </div>

      {/* 📃 Full Overlay Modal */}
      {showFullView && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-semibold mb-4">All Notifications</h2>
            <button
              onClick={() => setShowFullView(false)}
              className="absolute top-2 right-4 text-gray-600 text-xl"
            >
              &times;
            </button>

            {notifications.length === 0 ? (
              <p className="text-center text-gray-500">No notifications found.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n, i) => (
                  <li key={i} className="p-3 bg-gray-100 rounded border">
                    <div>{n.message}</div>
                    <div className="text-sm text-gray-500">{formatDate(getNotificationDate(n))}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
