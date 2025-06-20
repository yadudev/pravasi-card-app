import React, { useEffect, useState } from 'react';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import { ArrowLeft, Eye, EyeClosed, EyeOff } from 'lucide-react';
import { usersAPI } from '../services/api';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    emailOrNumber: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBackClick = () => {
    // Simple navigation back to home
    window.history.back();
    // Or if you want to go to home specifically:
    // window.location.href = '/';
  };

  const handleBackdropClick = (e) => {
    // Close modal when clicking on backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onHandleClcik = () => {
    onClose();
    onSwitchToLogin();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrNumber.trim()) {
      newErrors.emailOrNumber = 'Email or phone number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;

      if (
        !emailRegex.test(formData.emailOrNumber) &&
        !phoneRegex.test(formData.emailOrNumber)
      ) {
        newErrors.emailOrNumber = 'Please enter a valid email or phone number';
      }
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   onClose();
  //   onSignupSuccess(3, {
  //     email: 'test@gmail.com',
  //     phone: '',
  //     adminId: 3,
  //   });
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        emailOrNumber: formData.emailOrNumber,
        password: formData.newPassword,
      };

      const response = await usersAPI.signUp(userData);

      // Extract user ID from response (adjust based on your API response structure)
      const userId = response.data?.id || response.id || response.userId;

      // Close current modal and open next modal with user ID
      onClose();

      // Call the callback with user ID and any other needed data
      if (onSignupSuccess) {
        setFormData({
          emailOrNumber: '',
          newPassword: '',
          confirmPassword: '',
        });
        onSignupSuccess(userId, {
          ...response.data, // Pass any additional user data
        });
      }
    } catch (error) {
      console.error('Signup failed:', error);

      if (error.message.includes('409')) {
        setErrors({
          emailOrNumber: 'This email or phone number is already registered',
        });
      } else if (error.message.includes('400')) {
        setErrors({
          general: 'Invalid data provided. Please check your inputs.',
        });
      } else {
        setErrors({
          general: 'Signup failed. Please try again later.',
        });
      }
    } finally {
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#F5F5F5] rounded-3xl border-white border-4 shadow-2xl w-full max-w-lg mx-4 relative  max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with Back Button and Logo */}
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="flex items-center text-black hover:text-gray-800 transition-colors pl-6"
            >
              <ArrowLeft size={30} />
            </button>
            {/* Pravasi Logo */}
            <img
              src={pravasiLogo}
              alt="Pravasi Logo"
              className="h-25 w-auto cursor-pointer"
              onClick={() => (window.location.href = '/')}
            />
          </div>
          <div className="px-4">
            <h2 className="text-4xl font-bold mb-2 text-center">Sign up</h2>
            <p className="text-base text-[#707070] text-center mb-6">
              Enter your details to Sign up.
            </p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-base font-normal text-black mb-2">
                  Email or Number
                </label>
                <input
                  name="emailOrNumber"
                  placeholder="Enter mobile number or email"
                  type="text"
                  value={formData.emailOrNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white ${
                    errors.emailOrNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.emailOrNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.emailOrNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-base font-normal text-black mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    name="newPassword"
                    placeholder="Enter your password"
                    type={showPassword.newPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.newPassword ? (
                      <EyeClosed size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-base font-normal text-black mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    placeholder="Enter your password"
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 ${
                      errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.confirmPassword ? (
                      <EyeClosed size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="text-base font-normal text-[#707070] text-justify leading-relaxed">
                By continuing, you agree to Pravasi Privilege's{' '}
                <a href="#" className="text-[#3D3C96] hover:underline">
                  terms & conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#3D3C96] hover:underline">
                  privacy policy
                </a>
              </div>
              <div
                className="w-full rounded-lg p-[1px]"
                style={{
                  background:
                    'linear-gradient(92.38deg, #222158 -21.33%, rgba(34, 33, 88, 0) 149.35%)',
                }}
              >
                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200"
                >
                  Sign up
                </button>
              </div>
            </form>
            <div className="my-2 pt-4 text-base text-center text-[#707070]">
              Already have an account?
              <span
                className="text-black hover:underline cursor-pointer ml-2"
                onClick={onHandleClcik}
              >
                Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
