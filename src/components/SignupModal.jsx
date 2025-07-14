import React, { useEffect, useState } from 'react';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import { ArrowLeft, Eye, EyeClosed, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../constants/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin, onSignupSuccess }) => {
  const navigate = useNavigate();
  const { register, isLoading: authLoading } = useAuth();

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
  const [isLoading, setIsLoading] = useState(false);

  // Clear form and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setFormData({
        emailOrNumber: '',
        newPassword: '',
        confirmPassword: '',
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Enhanced error handling for signup
  const handleAPIError = async (error, context = 'general') => {
    // Handle AuthContext signup errors
    if (context === 'signup' && error?.message && !error?.response) {
      const errorMsg = (error.message || '').toLowerCase();
      console.log('Processing AuthContext signup error, message:', errorMsg);

      // Check for email/phone already exists
      if (
        errorMsg.includes('already exists') ||
        errorMsg.includes('already registered') ||
        errorMsg.includes('email already') ||
        errorMsg.includes('phone already')
      ) {
        console.log('Detected duplicate account error, showing inline error');
        setErrors({
          emailOrNumber: error.message,
        });
        return;
      }

      // Check for validation errors
      if (
        errorMsg.includes('validation') ||
        errorMsg.includes('invalid input') ||
        errorMsg.includes('check your') ||
        errorMsg.includes('invalid data')
      ) {
        console.log('Detected validation error, showing inline error');
        setErrors({
          emailOrNumber: error.message,
        });
        return;
      }

      // Check for rate limiting
      if (
        errorMsg.includes('too many') ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('try again later')
      ) {
        console.log('Detected rate limiting error, showing toast');
        toast.error(error.message, {
          duration: 6000,
          position: 'top-center',
        });
        return;
      }

      // Check for server errors
      if (
        errorMsg.includes('server error') ||
        errorMsg.includes('internal error')
      ) {
        console.log('Detected server error, showing toast');
        toast.error(error.message, {
          duration: 5000,
          position: 'top-center',
        });
        return;
      }

      // Fallback for any other signup error
      console.log('No specific match found, showing fallback toast');
      toast.error(error.message || 'Signup failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    // Handle HTTP status-based errors
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message;

    // Critical errors that need SweetAlert2
    if (status === 403) {
      await Swal.fire({
        title: 'Account Restricted',
        text: 'Your account cannot be created at this time. Please contact support.',
        icon: 'error',
        confirmButtonText: 'Contact Support',
        confirmButtonColor: '#d33',
      });
      return;
    }

    // Field-specific errors (use inline)
    if (status === 409 && context === 'signup') {
      setErrors({
        emailOrNumber: 'This email or mobile number is already registered',
      });
      return;
    }

    if (status === 422 && context === 'signup') {
      setErrors({
        emailOrNumber: 'Invalid email or mobile number format',
      });
      return;
    }

    // General errors (use toast)
    let toastMessage = 'An unexpected error occurred. Please try again.';

    if (status === 429) {
      toastMessage =
        'Too many signup attempts. Please wait before trying again.';
    } else if (status >= 500) {
      toastMessage = 'Server error. Please try again later.';
    } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      toastMessage = 'No internet connection. Please check your network.';
    } else if (message) {
      toastMessage = message;
    }

    console.log('Showing fallback toast with message:', toastMessage);
    toast.error(toastMessage, {
      duration: 4000,
      position: 'top-center',
    });
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
    onSwitchToLogin();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrNumber.trim()) {
      newErrors.emailOrNumber = 'Email or mobile number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;
      const input = formData.emailOrNumber.trim();

      if (!emailRegex.test(input) && !phoneRegex.test(input)) {
        newErrors.emailOrNumber = 'Please enter a valid email or mobile number';
      }
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else {
      // Additional password strength validation
      const hasUpperCase = /[A-Z]/.test(formData.newPassword);
      const hasLowerCase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        newErrors.newPassword =
          'Password must contain uppercase, lowercase, and numbers';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    // Show loading toast
    const loadingToast = toast.loading('Creating your account...');

    try {
      // Use AuthContext register function
      const result = await register({
        emailOrNumber: formData.emailOrNumber.trim(),
        password: formData.newPassword,
      });

      if (result.success) {
        toast.dismiss(loadingToast);

        // Show success toast
        toast.success(
          'Account created successfully! Welcome to Pravasi Privilege.',
          {
            duration: 4000,
            position: 'top-center',
          }
        );

        // Close current modal
        onClose();

        // Handle different signup flows
        if (result.requiresVerification) {
          // Account created but requires verification (email/SMS)
          if (onSignupSuccess) {
            setFormData({
              emailOrNumber: '',
              newPassword: '',
              confirmPassword: '',
            });
            onSignupSuccess(result.user?.id, {
              email: result.user?.email,
              phone: result.user?.phone,
              adminId: result.user?.adminId,
              requiresVerification: true,
              ...result.user,
            });
          }
        } else {
          // Account created and auto-logged in
          if (result.user && result.user.isProfileComplete) {
            // Profile is complete, navigate to main app
            navigate('/search');
          } else {
            // Profile needs completion
            if (onSignupSuccess) {
              setFormData({
                emailOrNumber: '',
                newPassword: '',
                confirmPassword: '',
              });
              onSignupSuccess(result.user?.id, {
                email: result.user?.email,
                phone: result.user?.phone,
                adminId: result.user?.adminId,
                ...result.user,
              });
            }
          }
        }
      } else {
        toast.dismiss(loadingToast);

        // Handle signup failure
        console.log('Signup failed with result:', result);
        await handleAPIError({ message: result.error }, 'signup');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Signup error:', error);

      // For catch block errors, we might have the actual HTTP response
      await handleAPIError(error, 'signup');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitting = isLoading || authLoading;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#F5F5F5] rounded-3xl border-white border-4 shadow-2xl w-full max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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
            <h2 className="text-4xl font-bold mb-2 text-center">Sign up</h2>
            <p className="text-base text-[#707070] text-center mb-6">
              Enter your details to create your account.
            </p>

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
                    errors.emailOrNumber
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.emailOrNumber && (
                  <div className="flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                    <p className="text-red-500 text-xs">
                      {errors.emailOrNumber}
                    </p>
                  </div>
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
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 transition-colors ${
                      errors.newPassword
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    disabled={isSubmitting}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword.newPassword ? (
                      <EyeClosed size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <div className="flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                    <p className="text-red-500 text-xs">{errors.newPassword}</p>
                  </div>
                )}
                {formData.newPassword && formData.newPassword.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p
                      className={
                        formData.newPassword.length >= 8
                          ? 'text-green-600'
                          : 'text-red-500'
                      }
                    >
                      ✓ At least 8 characters
                    </p>
                    <p
                      className={
                        /[A-Z]/.test(formData.newPassword)
                          ? 'text-green-600'
                          : 'text-red-500'
                      }
                    >
                      ✓ One uppercase letter
                    </p>
                    <p
                      className={
                        /[a-z]/.test(formData.newPassword)
                          ? 'text-green-600'
                          : 'text-red-500'
                      }
                    >
                      ✓ One lowercase letter
                    </p>
                    <p
                      className={
                        /\d/.test(formData.newPassword)
                          ? 'text-green-600'
                          : 'text-red-500'
                      }
                    >
                      ✓ One number
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-normal text-black mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 bg-white pr-12 transition-colors ${
                      errors.confirmPassword
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    disabled={isSubmitting}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword.confirmPassword ? (
                      <EyeClosed size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                    <p className="text-red-500 text-xs">
                      {errors.confirmPassword}
                    </p>
                  </div>
                )}
                {formData.confirmPassword && formData.newPassword && (
                  <div className="mt-1">
                    <p
                      className={
                        formData.newPassword === formData.confirmPassword
                          ? 'text-green-600 text-xs'
                          : 'text-red-500 text-xs'
                      }
                    >
                      {formData.newPassword === formData.confirmPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </p>
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
                    !formData.newPassword ||
                    !formData.confirmPassword ||
                    formData.newPassword !== formData.confirmPassword
                  }
                  className={`w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200 flex items-center justify-center ${
                    isSubmitting ||
                    !formData.emailOrNumber.trim() ||
                    !formData.newPassword ||
                    !formData.confirmPassword ||
                    formData.newPassword !== formData.confirmPassword
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#9BCFFF]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Creating Account...
                    </>
                  ) : (
                    'Sign up'
                  )}
                </button>
              </div>
            </form>

            <div className="my-2 pt-4 text-base text-center text-[#707070]">
              Already have an account?
              <span
                className={`text-black hover:underline cursor-pointer ml-2 ${
                  isSubmitting ? 'pointer-events-none opacity-50' : ''
                }`}
                onClick={onHandleClick}
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
