import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import RegularExpense from './pages/RegularExpense';
import OtherExpense from './pages/OtherExpense';
import Login from './pages/Login';
import ProfilePage from './components/Profile/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import UpdateItem from './components/UpdateItem/UpdateItem'
import { setAuthToken } from './api_service/api';
import { useEffect, useState } from 'react';

const isAuthenticated = () => {
  const token = localStorage.getItem('access');
  return !!token;
};

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      setAuthToken(token);
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role?.role_name || 'User';
    setUserRole(role);

    setAuthChecked(true);
  }, []);

  if (!authChecked || !userRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {isAuthenticated() && (
        <Route path="/" element={<Layout />}>
          {/* ✅ Delay this route until userRole is known */}
          <Route
            index
            element={
              userRole === 'Admin'
                ? <AdminDashboard />
                : <Home />
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="regular-expense" element={<RegularExpense />} />
          <Route path="other-expense" element={<OtherExpense />} />
          <Route path="update-item" element={<UpdateItem />} />
          // App.jsx or Routes.jsx
          <Route path="/notifications" element={<NotificationsPage />} />

        </Route>
      )}

      {/* Fallback: if not logged in, redirect all other routes */}
      {!isAuthenticated() && <Route path="*" element={<Navigate to="/login" />} />}
    </Routes>
  );
}

export default App;
