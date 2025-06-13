import React, { useEffect, useState } from 'react';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import { ArrowLeft, Eye, EyeClosed } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    emailOrNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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

  const onHandleClcik = () => {
    onClose();
    onSwitchToSignup();
  };


  const handleSubmit = () => {};

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#F5F5F5] rounded-3xl border-white border-4 shadow-2xl w-full max-w-lg mx-4 relative p-6">
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
          <h2 className="text-4xl font-bold mb-4 text-center">Login</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-base font-normal text-black mb-2">
                Email or Number
              </label>
              <input
                name="emailOrNumber"
                placeholder="Email mobile number or email"
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-base font-normal text-black">
                  Password
                </label>
                <label className="text-base font-normal text-black hover:underline cursor-pointer">
                  Forgot password?
                </label>
              </div>
              <div className="relative">
                <input
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword.password ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.password ? (
                    <EyeClosed size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
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
                Login
              </button>
            </div>
          </form>
          <div className="my-2 pt-4 text-base text-center text-[#707070]">
            Don’t have an account?
            <span
              className="text-black hover:underline cursor-pointer ml-2"
              onClick={onHandleClcik}
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
