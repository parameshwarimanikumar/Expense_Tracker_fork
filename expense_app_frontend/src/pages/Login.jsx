
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { loginUser, setAuthToken } from '../api_service/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      navigate('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      setAuthToken(data.access);

      localStorage.setItem('user', JSON.stringify(data.user));

      // Assume user role is available in response (adjust based on backend)
      const userRole = data?.user?.role.role_name || 'User';
      if (userRole === 'User') {
        navigate('/');
      } else {
        // handle other roles if needed
      }
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Same UI code as before */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-2 border rounded-md"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-[#2B3B6C] text-white py-2 px-4 rounded-md hover:bg-[#1e2a4d]"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
