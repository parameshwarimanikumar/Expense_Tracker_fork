import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { registerUser } from "../api_service/api";


function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "",
    profile_picture: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture") {
      setFormData({ ...formData, profile_picture: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      await registerUser(data);


      // ✅ Redirect after successful registration
      navigate("/login");
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data;

      if (backendError) {
        const firstKey = Object.keys(backendError)[0];
        const message = Array.isArray(backendError[firstKey])
          ? backendError[firstKey][0]
          : backendError[firstKey];
        setError(message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#2B3B6C]">
          Register
        </h2>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>

          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="username"
              type="text"
              placeholder="Username"
              required
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-2 border rounded-md"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Profile Picture */}
          <input
            type="file"
            name="profile_picture"
            accept="image/*"
            onChange={handleChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-[#2B3B6C] file:text-white
              hover:file:bg-[#1e2a4d]"
          />

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#2B3B6C] text-white py-2 px-4 rounded-md hover:bg-[#1e2a4d] transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
