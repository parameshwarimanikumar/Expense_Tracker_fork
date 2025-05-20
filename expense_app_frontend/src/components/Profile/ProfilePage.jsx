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

const data1 = [
  { name: "Total", value: 1779 },
  { name: "Refunded", value: 650 },
  { name: "Pending", value: 1170 },
];

const data2 = [
  { name: "Total", value: 2000 },
  { name: "Other Expense", value: 1000 },
  { name: "Regular Expense", value: 1000 },
];

const BACKEND_URL = "http://localhost:8000";

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
    // Simulated save - replace with API call if needed
    onUpdateUser({
      ...user,
      name: formData.name,
      email: formData.email,
      profile_picture: formData.profile_picture,
    });
    setIsEditing(false);
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

      <h1 className="text-2xl font-semibold and italic mb-4">Personal Info</h1>

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
        <>
          <center>
            <div className="mb-4">
              <p className="mb-2 text-lg">
                <strong>Name:</strong> {user.name}
              </p>
              <p className="mb-2 text-lg">
                <strong>Email:</strong> {user.email || "No email provided"}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-all duration-200"
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Edit</span>
            </button>
          </center>
        </>
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

  // activeView: 'dashboard', 'personalInfo', 'myExpense'
  const [activeView, setActiveView] = useState("dashboard");

  const normalizeProfilePictureUrl = (url) => {
    if (!url || url.trim() === "") return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser({
        name: storedUser.name || storedUser.username || "Guest",
        email: storedUser.email || "",
        profile_picture: normalizeProfilePictureUrl(storedUser.profile_picture),
      });
    }
  }, []);

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

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

          <ul className="w-full text-left space-y-4">
            <li
              className={`flex items-center gap-2 cursor-pointer hover:text-gray-300 ${
                activeView === "personalInfo"
                  ? "text-gray-300 font-semibold"
                  : ""
              }`}
              onClick={() => setActiveView("personalInfo")}
            >
              <FontAwesomeIcon icon={faUser} />
              Personal Info
            </li>

            {activeView !== "myExpense" ? (
              <li
                className="flex items-center gap-2 cursor-pointer hover:text-gray-300"
                onClick={() => setActiveView("myExpense")}
              >
                <FontAwesomeIcon icon={faFileAlt} />
                My Expense
              </li>
            ) : (
              <li
                className="flex items-center gap-2 cursor-pointer hover:text-gray-300"
                onClick={() => setActiveView("dashboard")}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
              </li>
            )}

            <li
              className="flex items-center gap-2 cursor-pointer hover:text-gray-300"
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("access_token");
                navigate("/login");
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-6 overflow-auto p-6">
          {activeView === "dashboard" && (
            <>
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl p-4 shadow">
                  <h2 className="text-lg font-semibold mb-4">
                    Expense Summary
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data1}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                      >
                        {data1.map((entry, index) => (
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

                <div className="bg-white rounded-xl p-4 shadow">
                  <h2 className="text-lg font-semibold mb-4">
                    Expense Category
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data2}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                      >
                        {data2.map((entry, index) => (
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

              {/* Data Table */}
              <Table />
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
            <div>
              <button
                onClick={() => setActiveView("dashboard")}
                className="mb-4 text-blue-600 hover:underline flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
              </button>
              {/* MyExpense component should go here */}
              <Mydata />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
