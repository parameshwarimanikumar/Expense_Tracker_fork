import React, { useState, useEffect } from "react";
import brillersys from "../../assets/brillersys.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faIndianRupeeSign,
  faWallet,
  faRightFromBracket,
  faXmark,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import { logoutUser } from "../../api_service/api";

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Detect role dynamically on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(storedUser?.role?.role_name === "Admin");
  }, []);

  // Define nav items
  const navItems = [
    { path: "/", name: "Home", icon: faHouse },
    {
      path: isAdmin ? "/admin/regular-expense" : "/regular-expense",
      name: "Regular Expense",
      icon: faIndianRupeeSign,
    },
    {
      path: isAdmin ? "/admin/other-expense" : "/other-expense",
      name: "Other Expense",
      icon: faWallet,
    },
  ];

  // Add admin-only items
  if (isAdmin) {
    navItems.push(
      {
        path: "/update-item",
        name: "Update Item",
        icon: faPenToSquare,
      },
      {
        path: "/admin/expense-history",
        name: "Expense History",
        icon: faWallet, // Customize this icon if needed
      }
    );
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser(); // optional API call
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      window.location.href = "/login"; // Redirect to login
    }
  };

  return (
    <div
      className={`fixed left-0 inset-y-0 top-0 w-64 bg-white h-screen transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50 md:translate-x-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-300 relative">
        <img src={brillersys} alt="Brillersys" className="h-8" />
        <button
          className="text-xl md:hidden absolute right-4"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setActiveTab(item.name)}
            className={({ isActive }) =>
              `flex items-center p-3 font-medium relative group w-60 ${
                activeTab === item.name || isActive
                  ? "text-[#124451] font-bold"
                  : "text-gray-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {(activeTab === item.name || isActive) && (
                  <span className="absolute right-0 h-8 w-1 bg-[#124451] rounded"></span>
                )}
                <FontAwesomeIcon icon={item.icon} className="text-sm mr-2" />
                {item.name}
              </>
            )}
          </NavLink>
        ))}

        {/* Logout Button */}
        <div className="absolute bottom-4 w-full px-4">
          <button
            className="flex items-center p-3 text-gray-500 font-medium"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
