import React, { useEffect, useState, useRef } from 'react'
import Avatar from '../../assets/Avatar.png'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { faBell } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Navbar = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/notifications/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setUnreadCount(res.data.unread_count);
        setNotifications(res.data.notifications || []);  // Adjust if API returns notifications list
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
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
        <h1 className='text-2xl text-[#124451] hidden font-semibold md:block'>{title}</h1>

        <div className="flex items-center gap-3">
          <button className="text-xl md:hidden" onClick={toggleSidebar}>
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        <div className="relative flex items-center gap-6 bg-white rounded-full px-6 py-2" ref={dropdownRef}>
          <FontAwesomeIcon 
            icon={faBell} 
            className='text-gray-600 cursor-pointer' 
            onClick={handleBellClick} 
          />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-12 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
              style={{ width: '18px', height: '18px' }}
            >
              {unreadCount}
            </span>
          )}

          {showDropdown && (
            <div className="absolute right-0 mt-10 w-64 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-gray-500">No new notifications</div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                    <p className="text-sm">{notif.message || notif.title || 'Notification'}</p>
                    <small className="text-gray-400">{new Date(notif.created_at).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          )}

          <img
            src={Avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full cursor-pointer"
            onClick={handleAvatarClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
