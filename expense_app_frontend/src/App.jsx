import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import RegularExpense from "./pages/RegularExpense";
import OtherExpense from "./pages/OtherExpense";
import Login from "./pages/Login";
import ProfilePage from "./components/Profile/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import UpdateItem from "./components/UpdateItem/UpdateItem";
import AdminOtherExpense from "./components/Adminpages/OtherExpense";
import AdminRegularExpense from "./components/Adminpages/RegularExpense";
import ExpenseHistory from "./components/Adminpages/ExpenseHistory";

import { setAuthToken } from "./api_service/api";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    const user = JSON.parse(localStorage.getItem("user"));

    const logout = () => {
      localStorage.removeItem("access");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setUserRole(null);
      navigate("/login");
    };

    if (token && user) {
      try {
        const decoded = jwtDecode(token); // ✅ correct usage
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          logout(); // ❌ expired
        } else {
          setAuthToken(token);
          setUserRole(user?.role?.role_name || "User");
          setIsLoggedIn(true);
        }
      } catch {
        logout(); // ❌ malformed token
      }
    }

    setAuthChecked(true);
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {!isLoggedIn ? (
        <Route path="*" element={<Navigate to="/login" />} />
      ) : (
        <Route path="/" element={<Layout />}>
          <Route index element={userRole === "Admin" ? <AdminDashboard /> : <Home />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="regular-expense" element={<RegularExpense />} />
          <Route path="other-expense" element={<OtherExpense />} />
          <Route path="update-item" element={<UpdateItem />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="admin/regular-expense" element={<AdminRegularExpense />} />
          <Route path="admin/other-expense" element={<AdminOtherExpense />} />
          <Route path="admin/expense-history" element={<ExpenseHistory />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
