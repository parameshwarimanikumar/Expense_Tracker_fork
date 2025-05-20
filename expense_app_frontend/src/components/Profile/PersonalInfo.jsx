import React, { useState, useEffect } from "react";
import axios from "axios";

const PersonalInfo = () => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    password: "",
    profile_picture: null,
    previewPic: "",
  });

  useEffect(() => {
    axios.get("/api/user/profile/").then((res) => {
      setFormData((prev) => ({
        ...prev,
        first_name: res.data.first_name,
        email: res.data.email,
        previewPic: res.data.profile_picture,
      }));
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      profile_picture: file,
      previewPic: URL.createObjectURL(file),
    });
  };

  const handleSave = async () => {
    const data = new FormData();
    data.append("first_name", formData.first_name);
    data.append("email", formData.email);
    if (formData.password) {
      data.append("password", formData.password);
    }
    if (formData.profile_picture) {
      data.append("profile_picture", formData.profile_picture);
    }

    try {
      await axios.put("/api/user/update/", data);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-[400px] bg-white rounded-xl shadow-2xl p-8 relative z-10">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
          Personal Info
        </h2>

        <div className="flex flex-col items-center mb-6 relative">
          <img
            src={formData.previewPic}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          {editMode && (
            <label className="absolute bottom-0 right-[calc(50%-12px)] cursor-pointer bg-white rounded-full p-1 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="mb-4">
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="User name"
            className="w-full px-4 py-2 border-b-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 disabled:bg-transparent"
          />
        </div>

        <div className="mb-4">
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Email"
            className="w-full px-4 py-2 border-b-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 disabled:bg-transparent"
          />
        </div>

        <div className="mb-4">
          <input
            name="password"
            type="password"
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Password"
            className="w-full px-4 py-2 border-b-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 disabled:bg-transparent"
          />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-teal-700 text-white font-medium px-6 py-2 rounded-md hover:bg-teal-800 transition-all duration-200"
              >
                Save
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-300 text-slate-700 font-medium px-6 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-700 text-white font-medium px-6 py-2 rounded-md hover:bg-blue-800 transition-all duration-200"
            >
              Edit Info
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
