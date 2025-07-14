import React, { useEffect, useState } from 'react';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import { ArrowLeft, Eye, EyeClosed, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../constants/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

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
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Clear form and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setFormData({
        emailOrNumber: '',
        password: '',
        rememberMe: false,
      });
    }
  }, [isOpen]);

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

    // Clear field-specific error when user starts typing
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

  // Enhanced error handling with different UI approaches
  const handleAPIError = async (error, context = 'general') => {
    
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message?.error;

    // Handle AuthContext errors specifically - now with proper API messages
    if (context === 'login' && error?.message && !error?.response) {
      const errorMsg = (error?.message || '').toLowerCase();
      console.log('Processing AuthContext login error, message:', errorMsg);
      
      // Check for rate limiting / too many attempts messages
      if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('try again later') || errorMsg.includes('attempt')) {
        console.log('Detected rate limiting error, showing toast');
        toast.error(error.message, {
          duration: 6000,
          position: 'top-center',
        });
        return;
      }
      
      // Check for invalid credentials messages
      if (errorMsg.includes('invalid') || errorMsg.includes('wrong') || errorMsg.includes('incorrect') || errorMsg.includes('password')) {
        console.log('Detected invalid credentials error, showing inline error');
        setErrors({ 
          password: error.message
        });
        return;
      }
      
      // Check for user not found messages
      if (errorMsg.includes('not found') || errorMsg.includes('no user') || errorMsg.includes('user does not exist') || errorMsg.includes('not exist')) {
        console.log('Detected user not found error, showing inline error');
        setErrors({ 
          emailOrNumber: error.message
        });
        return;
      }
      
      // Check for account status messages
      if (errorMsg.includes('suspended') || errorMsg.includes('banned') || errorMsg.includes('deactivated') || errorMsg.includes('blocked') || errorMsg.includes('inactive')) {
        console.log('Detected account status error, showing SweetAlert');
        await Swal.fire({
          title: 'Account Issue',
          text: error.message,
          icon: 'error',
          confirmButtonText: 'Contact Support',
          confirmButtonColor: '#d33',
          allowOutsideClick: false,
        });
        return;
      }
      
      if (errorMsg.includes('locked')) {
        console.log('Detected account locked error, showing SweetAlert');
        await Swal.fire({
          title: 'Account Locked',
          text: error.message,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Reset Password',
          cancelButtonText: 'Try Later',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            handleForgotPasswordClick();
          }
        });
        return;
      }
      
      // For any other login error, show as inline error on password field
      console.log('No specific match found, showing fallback inline error');
      setErrors({ 
        password: error.message || 'Login failed. Please try again.' 
      });
      return;
    }

    // Handle string errors from AuthContext (legacy support)
    if (context === 'login' && typeof error === 'string') {
      const errorMsg = error.toLowerCase();
      console.log('Processing string error:', errorMsg);
      
      if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('try again later') || errorMsg.includes('attempt')) {
        toast.error(error, {
          duration: 6000,
          position: 'top-center',
        });
        return;
      }
      
      if (errorMsg.includes('invalid') || errorMsg.includes('wrong') || errorMsg.includes('incorrect')) {
        setErrors({ 
          password: error
        });
        return;
      }
      
      // Fallback for string errors
      setErrors({ 
        password: error || 'Login failed. Please check your credentials and try again.' 
      });
      return;
    }

    // Critical errors that need SweetAlert2 (HTTP status based)
    if (status === 403) {
      await Swal.fire({
        title: 'Account Suspended',
        text: 'Your account has been suspended. Please contact support for assistance.',
        icon: 'error',
        confirmButtonText: 'Contact Support',
        confirmButtonColor: '#d33',
        allowOutsideClick: false,
      });
      return;
    }

    if (status === 423) {
      await Swal.fire({
        title: 'Account Locked',
        text: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Reset Password',
        cancelButtonText: 'Try Later',
        confirmButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          handleForgotPasswordClick();
        }
      });
      return;
    }

    // Field-specific errors (use inline) - HTTP status based
    if (status === 404 && context === 'login') {
      setErrors({ 
        emailOrNumber: 'No account found with this email or mobile number' 
      });
      return;
    }

    if (status === 401 && context === 'login') {
      setErrors({ 
        password: 'Invalid password. Please check and try again.' 
      });
      return;
    }

    // General errors (use toast)
    let toastMessage = 'An unexpected error occurred. Please try again.';
    
    if (status === 429) {
      toastMessage = 'Too many attempts. Please wait a few minutes before trying again.';
    } else if (status >= 500) {
      toastMessage = 'Server error. Please try again later.';
    } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      toastMessage = 'No internet connection. Please check your network.';
    } else if (message) {
      toastMessage = message;
    }

    console.log('No specific handler matched, showing toast with message:', toastMessage);

    toast.error(toastMessage, {
      duration: 4000,
      position: 'top-center',
    });
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
    // Inline validation for forgot password
    if (!formData.emailOrNumber.trim()) {
      setErrors({
        emailOrNumber: 'Please enter your email or mobile number first',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    const input = formData.emailOrNumber.trim();

    if (!emailRegex.test(input) && !phoneRegex.test(input)) {
      setErrors({
        emailOrNumber: 'Please enter a valid email or mobile number',
      });
      return;
    }

    setForgotPasswordLoading(true);
    setErrors({});

    // Show loading toast
    const loadingToast = toast.loading('Sending reset instructions...');

    try {
      await usersAPI.forgotPassword(formData.emailOrNumber.trim());
      
      toast.dismiss(loadingToast);
      toast.success(
        `Reset instructions sent to ${
          emailRegex.test(input) ? 'your email' : 'your mobile number'
        }. Please check and follow the instructions.`,
        {
          duration: 6000,
          position: 'top-center',
        }
      );
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Forgot password error:', error);
      
      // Handle forgot password errors with appropriate UI
      if (error?.response?.status === 404) {
        setErrors({
          emailOrNumber: 'No account found with this email or mobile number',
        });
      } else {
        await handleAPIError(error, 'forgotPassword');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    // Show loading toast
    const loadingToast = toast.loading('Logging in...');

    try {
      const result = await login(formData.emailOrNumber, formData.password);

      if (result.success) {
        toast.dismiss(loadingToast);
        
        // Show success toast
        toast.success('Login successful! Welcome back.', {
          duration: 3000,
          position: 'top-center',
        });

        try {
          const profileData = await fetchUserProfile();
          const isProfileComplete = checkProfileCompleteness(profileData);
          
          // Close the modal
          onClose();

          if (!isProfileComplete) {
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
            navigate('/search');
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          
          // Show warning toast for profile fetch failure
          toast.error('Could not verify profile status. Please refresh the page.', {
            duration: 4000,
          });

          // Fallback logic
          if (result.user && !result.user.isProfileComplete) {
            if (onSignupSuccess) {
              onSignupSuccess(result.user.id, {
                email: result.user.email,
                phone: result.user.phone,
                adminId: result.user.adminId,
              });
            }
          } else {
            navigate('/search');
          }
        }
      } else {
        toast.dismiss(loadingToast);
        
        // Debug: Log what we're receiving
        console.log('Login failed with result:', result);
        console.log('result.error:', result.error);
        
        // Handle login failure - AuthContext now properly extracts API messages
        await handleAPIError({ message: result.error }, 'login');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Login error:', error);
      
      // For catch block errors, we might have the actual HTTP response
      await handleAPIError(error, 'login');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitting = isLoading || authLoading;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#F5F5F5] rounded-3xl border-white border-4 shadow-2xl w-full max-w-lg mx-4 relative p-6">
        {/* Header with Back Button and Logo */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="flex items-center text-black hover:text-gray-800 transition-colors pl-6 focus:outline-none"
            disabled={isSubmitting}
          >
            <ArrowLeft size={30} />
          </button>
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
                  errors.emailOrNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {/* Inline error for field validation */}
              {errors.emailOrNumber && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.emailOrNumber}</p>
                </div>
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
                  className="text-base font-normal text-black hover:underline cursor-pointer focus:outline-none flex items-center"
                  disabled={isSubmitting || forgotPasswordLoading}
                >
                  {forgotPasswordLoading && (
                    <Loader2 className="animate-spin mr-1" size={14} />
                  )}
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
                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
              {/* Inline error for field validation */}
              {errors.password && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.password}</p>
                </div>
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