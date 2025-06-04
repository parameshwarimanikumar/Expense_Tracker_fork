import React, { useEffect, useState, useRef } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileImage, setProfileImage] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const token = localStorage.getItem('access');

  const handleAvatarClick = () => navigate('/profile');

  const handleBellClick = () => setShowDropdown(prev => !prev);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/notifications/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.unread_count || 0);
        setNotifications(res.data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.profile_picture) {
          const fullUrl = new URL(res.data.profile_picture, backendUrl).toString();
          setProfileImage(fullUrl);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchNotifications();
    fetchProfile();
  }, [backendUrl, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 right-0 left-0 md:left-64 bg-white md:bg-[rgba(244,247,254,1)] z-40 shadow">
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Title */}
        <h1 className="text-2xl text-[#124451] hidden font-semibold md:block">{title}</h1>

        {/* Sidebar Toggle (Mobile Only) */}
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Right Section */}
        <div ref={dropdownRef} className="relative flex items-center gap-6 bg-white rounded-full px-6 py-2">
          {/* Bell */}
          <FontAwesomeIcon
            icon={faBell}
            className="text-gray-600 cursor-pointer"
            onClick={handleBellClick}
            title="Notifications"
            aria-haspopup="true"
            aria-expanded={showDropdown}
          />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-12 px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full"
              style={{ width: '18px', height: '18px' }}
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount}
            </span>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-10 w-64 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-gray-500">No new notifications</div>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <p className="text-sm">{notif.message || notif.title || 'Notification'}</p>
                    <small className="text-gray-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Avatar */}
          <img
            src={profileImage || '/default_avatar.png'}
            alt="User Avatar"
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-blue-500 bg-gray-100"
            onClick={handleAvatarClick}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default_avatar.png';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
