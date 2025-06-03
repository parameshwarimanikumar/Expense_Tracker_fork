import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Table from "./Table";
import Mydata from "./Mydata";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faFileAlt,
  faSignOutAlt,
  faEdit,
  faSave,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const COLORS = ["#0E4351", "#971C8A", "#6B4BB0"];
const BACKEND_URL = "http://localhost:8000";

const calculateSummary = (expenses) => {
  let total = 0, refunded = 0, pending = 0;

  expenses.forEach((expense) => {
    const amount = Number(expense.amount);
    total += amount;
    if (expense.is_refunded) refunded += amount;
    else if (!expense.is_verified) pending += amount;
  });

  return [
    { name: "Total", value: total },
    { name: "Refunded", value: refunded },
    { name: "Pending", value: pending },
  ];
};

const PersonalInfo = ({ user, onUpdateUser, setActiveView }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    profile_picture: user.profile_picture || "/default-avatar.png",
    profile_picture_file: null,
  });

  useEffect(() => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      profile_picture: user.profile_picture || "/default-avatar.png",
      profile_picture_file: null,
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profile_picture_file: file,
        profile_picture: URL.createObjectURL(file),
      }));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      profile_picture: user.profile_picture || "/default-avatar.png",
      profile_picture_file: null,
    });
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      if (formData.profile_picture_file) {
        formDataToSend.append("profile_picture", formData.profile_picture_file);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/update-profile-picture/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) throw new Error("Failed to update profile");
      const updatedUser = await response.json();

      const normalizedUser = {
        name: updatedUser.name,
        email: updatedUser.email,
        profile_picture: normalizeProfilePictureUrl(updatedUser.profile_picture),
      };

      onUpdateUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setIsEditing(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const normalizeProfilePictureUrl = (url) => {
    if (!url || url.trim() === "") return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow max-w-xl mx-auto">
      <button
        onClick={() => setActiveView("dashboard")}
        className="mb-4 text-blue-600 hover:underline flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back
      </button>

      <h1 className="text-2xl font-semibold italic mb-4">Personal Info</h1>

      <div className="mb-4 flex flex-col items-center">
        <img
          src={formData.profile_picture}
          alt="Profile"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-avatar.png";
          }}
          className="w-36 h-36 rounded-full object-cover mb-4 border-2 border-gray-300"
        />
        {isEditing && (
          <>
            <input
              type="file"
              accept="image/*"
              id="profilePictureInput"
              onChange={handleFileChange}
              className="hidden"
              ref={(input) => (window.profileInputRef = input)}
            />
            <button
              onClick={() =>
                window.profileInputRef && window.profileInputRef.click()
              }
              className="px-3 py-1 bg-gray-200 text-sm text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Edit Picture</span>
            </button>
          </>
        )}
      </div>

      {!isEditing ? (
        <center>
          <p className="mb-2 text-lg">
            <strong>Name:</strong> {user.name}
          </p>
          <p className="mb-2 text-lg">
            <strong>Email:</strong> {user.email || "No email provided"}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faEdit} />
            <span>Edit</span>
          </button>
        </center>
      ) : (
        <>
          <label className="block mb-4">
            <strong className="block mb-1">Name:</strong>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <label className="block mb-4">
            <strong className="block mb-1">Email:</strong>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0E4351] text-white rounded hover:bg-[#0b3844] flex items-center gap-2 transition-all"
            >
              <FontAwesomeIcon icon={faSave} />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 flex items-center gap-2 transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Cancel</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    profile_picture: "/default-avatar.png",
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/profile/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const updatedUser = {
          name: data.name,
          email: data.email,
          profile_picture: normalizeProfilePictureUrl(data.profile_picture),
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      });
  }, []);

  const normalizeProfilePictureUrl = (url) => {
    if (!url || url.trim() === "") return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/expenses`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setExpenses(data));
  }, []);

  const pieChartData = calculateSummary(expenses);

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50 p-4">
      <div className="bg-blue-50 rounded-2xl shadow-xl flex max-w-6xl w-full h-[90vh] overflow-hidden">
        {/* Sidebar */}
        <div className="bg-[#0E4351] text-white w-64 rounded-l-2xl p-6 flex flex-col items-center">
          <button
            className="self-start mb-4 text-white hover:text-gray-300"
            onClick={() => navigate("/")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
          </button>

          <div className="mb-4">
            <img
              src={user.profile_picture}
              alt="User"
              className="w-24 h-24 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>

          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-sm mb-6">{user.email || "No email found"}</p>

          <button
            onClick={() => setActiveView("personalInfo")}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded ${
              activeView === "personalInfo"
                ? "bg-[#1c6094]"
                : "hover:bg-[#1c6094]/80"
            } transition-colors`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Personal Info</span>
          </button>

          <button
            onClick={() => setActiveView("myExpense")}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded ${
              activeView === "myExpense"
                ? "bg-[#1c6094]"
                : "hover:bg-[#1c6094]/80"
            } transition-colors`}
          >
            <FontAwesomeIcon icon={faFileAlt} />
            <span>My Expense</span>
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="mt-auto flex items-center gap-2 px-4 py-2 rounded transition-colors"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeView === "dashboard" && (
            <>
              <div className="flex flex-col gap-8">
                <div className="flex gap-12 flex-wrap justify-center">
                  <div className="bg-white p-6 rounded-3xl w-150 shadow-md ml-6 mr-6">
                    <h2 className="mb-4 font-semibold text-lg">Expense Type</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          label={({ name, value, percent }) =>
                            `${name} ₹${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <Table />
              </div>
            </>
          )}

          {activeView === "personalInfo" && (
            <PersonalInfo
              user={user}
              onUpdateUser={handleUpdateUser}
              setActiveView={setActiveView}
            />
          )}

          {activeView === "myExpense" && (
            <>
              <button
                onClick={() => setActiveView("dashboard")}
                className="mb-4 text-blue-600 hover:underline flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
              </button>
              <Mydata />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
