import React, { useEffect, useState } from 'react';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import { ArrowLeft, Eye, EyeClosed, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../constants/AuthContext';
import { usersAPI } from '../services/api';

const LoginModal = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onSignupSuccess,
  onLoginSuccess,
}) => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    emailOrNumber: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
  });
  const [isLoading, setIsLoading] = useState(false);

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
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrNumber.trim()) {
      newErrors.emailOrNumber = 'Email or mobile number is required';
    } else {
      // Basic email/phone validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;
      const input = formData.emailOrNumber.trim();

      if (!emailRegex.test(input) && !phoneRegex.test(input)) {
        newErrors.emailOrNumber = 'Please enter a valid email or mobile number';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to fetch user profile and check completeness using existing API
  const fetchUserProfile = async () => {
    try {
      const profileData = await usersAPI.getProfileStatus();
      return profileData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Function to check if profile is complete
  const checkProfileCompleteness = (profileData) => {
    // Check the isProfileCompleted boolean field from user table
    return profileData?.data?.status?.isProfileComplete === true;
  };

  const handleBackClick = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onHandleClick = () => {
    onClose();
    onSwitchToSignup();
  };

  const handleForgotPasswordClick = async () => {
    if (!formData.emailOrNumber.trim()) {
      setErrors({
        emailOrNumber: 'Please enter your email or mobile number first',
      });
      return;
    }

    try {
      await usersAPI.forgotPassword(formData.emailOrNumber.trim());
      alert(
        'Password reset instructions have been sent to your email/mobile number.'
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({
        general:
          error.response?.data?.message ||
          'Failed to send reset instructions. Please try again.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Use the login function from AuthContext
      const result = await login(formData.emailOrNumber, formData.password);

      if (result.success) {
        // Login successful - AuthContext handles token storage and user state

        try {
          // Fetch user profile to check completeness using existing API
          const profileData = await fetchUserProfile();
          const isProfileComplete = checkProfileCompleteness(profileData);
          // Close the modal
          onClose();

          // Check profile completeness and navigate accordingly
          if (!isProfileComplete) {
            // Profile incomplete - show activation modal
            if (onSignupSuccess) {
              setFormData({
                emailOrNumber: '',
                password: '',
                rememberMe: false,
              });
              onSignupSuccess(profileData?.data?.user?.id, {
                email: profileData?.data?.user?.email,
                phone: profileData?.data?.user?.phone,
                adminId: profileData?.data?.user?.adminId,
              });
            }
          } else {
            // Profile complete - navigate to search
            navigate('/search');
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);

          // Fallback to the original method if profile API fails
          if (result.user && !result.user.isProfileComplete) {
            // Profile incomplete - show activation modal
            if (onSignupSuccess) {
              onSignupSuccess(result.user.id, {
                email: result.user.email,
                phone: result.user.phone,
                adminId: result.user.adminId,
              });
            }
          } else {
            // Profile complete - navigate to search
            navigate('/search');
          }

          // Optionally show a warning that profile check failed
          console.warn(
            'Profile completeness check failed, using fallback method'
          );
        }
      } else {
        // Login failed - show error from AuthContext
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Combine local loading state with auth loading state
  const isSubmitting = isLoading || authLoading;

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
            className="flex items-center text-black hover:text-gray-800 transition-colors pl-6 focus:outline-none"
            disabled={isSubmitting}
          >
            <ArrowLeft size={30} />
          </button>
          {/* Pravasi Logo */}
          <img
            src={pravasiLogo}
            alt="Pravasi Logo"
            className="h-25 w-auto cursor-pointer"
            onClick={() => {
              onClose();
              navigate('/');
            }}
          />
        </div>

        <div className="px-4">
          <h2 className="text-4xl font-bold mb-4 text-center">Login</h2>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.general}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white transition-colors ${
                  errors.emailOrNumber ? 'border-red-500' : ''
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-base font-normal text-black hover:underline cursor-pointer focus:outline-none"
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword.password ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.emailOrNumber.trim() ||
                  !formData.password.trim()
                }
                className={`w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200 flex items-center justify-center ${
                  isSubmitting ||
                  !formData.emailOrNumber.trim() ||
                  !formData.password.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#9BCFFF]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          <div className="my-2 pt-4 text-base text-center text-[#707070]">
            Don't have an account?
            <span
              className={`text-black hover:underline cursor-pointer ml-2 ${
                isSubmitting ? 'pointer-events-none opacity-50' : ''
              }`}
              onClick={onHandleClick}
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
