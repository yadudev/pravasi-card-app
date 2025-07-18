import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Shield, 
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { authAPI } from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token validity
      verifyToken(token);
    }
    
    // Check if user is blocked
    checkLoginBlock();
  }, []);

  // Handle login block countdown
  useEffect(() => {
    let interval;
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  const verifyToken = async (token) => {
    try {
      const response = await authAPI.verifyToken(token);
      if (response.valid) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
    }
  };

  const checkLoginBlock = () => {
    const blockData = localStorage.getItem('adminLoginBlock');
    if (blockData) {
      const { timestamp, attempts } = JSON.parse(blockData);
      const now = Date.now();
      const blockDuration = 15 * 60 * 1000; // 15 minutes
      
      if (now - timestamp < blockDuration && attempts >= 5) {
        setIsBlocked(true);
        setLoginAttempts(attempts);
        setBlockTimeRemaining(Math.ceil((blockDuration - (now - timestamp)) / 1000));
      } else if (now - timestamp >= blockDuration) {
        localStorage.removeItem('adminLoginBlock');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(attempts);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginFailure = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60); // 15 minutes
      localStorage.setItem('adminLoginBlock', JSON.stringify({
        timestamp: Date.now(),
        attempts: newAttempts
      }));
    } else {
      localStorage.setItem('adminLoginBlock', JSON.stringify({
        timestamp: Date.now(),
        attempts: newAttempts
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked) {
      alert(`Too many failed attempts. Please wait ${Math.ceil(blockTimeRemaining / 60)} minutes.`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      if (response.success) {
        // Store token
        localStorage.setItem('adminToken', response?.data?.token);
        
        localStorage.setItem('refreshToken', response?.data?.refreshToken);

        // Store user info
       // localStorage.setItem('adminUser', JSON.stringify(response.user));
        
        // Clear login attempts
        localStorage.removeItem('adminLoginBlock');
        setLoginAttempts(0);
        
        // Show success message briefly
        setErrors({ success: 'Login successful! Redirecting...' });
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        setErrors({ form: 'Invalid email or password' });
        handleLoginFailure();
      } else if (error.message.includes('423')) {
        setErrors({ form: 'Account is locked. Please contact support.' });
      } else {
        setErrors({ form: 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pravasi Loyalty System Administration
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-lg px-8 py-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Global Error/Success Message */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.form}</p>
                  </div>
                </div>
              </div>
            )}

            {errors.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{errors.success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Block Warning */}
            {isBlocked && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      Too many failed login attempts. Please wait {formatTime(blockTimeRemaining)} before trying again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                  <div className="ml-3">
                    <p className="text-sm text-orange-800">
                      {5 - loginAttempts} login attempts remaining before temporary lock.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="admin@pravasi.com"
                  disabled={loading || isBlocked}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full pl-10 pr-12 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={loading || isBlocked}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    disabled={loading || isBlocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading || isBlocked}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
                  onClick={() => alert('Please contact system administrator for password reset')}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || isBlocked}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading || isBlocked
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Sign in to Admin Panel'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              This is a secure admin area. Unauthorized access is prohibited.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2025 Pravasi Loyalty System. All rights reserved.
            </p>
          </div>
        </div>

        {/* Development/Demo Credentials */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Demo Credentials</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>Super Admin:</strong> admin@pravasi.com / admin123</p>
              <p><strong>Manager:</strong> manager@pravasi.com / manager123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'admin@pravasi.com',
                  password: 'admin123',
                  rememberMe: false
                });
              }}
              className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              Fill demo credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;