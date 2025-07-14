import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../constants/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ActivateModal = ({
  isOpen,
  onClose,
  userId,
  userData,
  onProfileCreateSuccess,
}) => {
  const navigate = useNavigate();
  const { createProfile, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    userId: '',
    adminId: '',
    fullName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    location: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryCodes = [
    { code: '+91', flag: '🇮🇳', country: 'India' },
    { code: '+1', flag: '🇺🇸', country: 'USA' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+61', flag: '🇦🇺', country: 'Australia' },
    { code: '+65', flag: '🇸🇬', country: 'Singapore' },
    { code: '+971', flag: '🇦🇪', country: 'UAE' },
  ];

  // Clear form and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      // Don't clear form data as it contains user info from signup
    }
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
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
  }, [isOpen, onClose, isSubmitting]);

  // Enhanced error handling for profile creation
  const handleAPIError = async (error, context = 'general') => {
    // Handle AuthContext profile creation errors
    if (context === 'profile' && error?.message && !error?.response) {
      const errorMsg = (error.message || '').toLowerCase();
      console.log('Processing AuthContext profile error, message:', errorMsg);

      // Check for duplicate profile/user errors
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('profile already created')) {
        console.log('Detected duplicate profile error, showing SweetAlert');
        await Swal.fire({
          title: 'Profile Already Exists',
          text: 'Your profile has already been created. Redirecting you to the main application.',
          icon: 'info',
          confirmButtonText: 'Continue',
          confirmButtonColor: '#3085d6',
        });
        navigate('/search');
        return;
      }

      // Check for validation errors - show inline
      if (errorMsg.includes('validation') || errorMsg.includes('invalid') || errorMsg.includes('required') || errorMsg.includes('format')) {
        console.log('Detected validation error, showing inline error');
        
        // Try to match specific field errors
        if (errorMsg.includes('email')) {
          setErrors({ email: error.message });
        } else if (errorMsg.includes('phone') || errorMsg.includes('number')) {
          setErrors({ phone: error.message });
        } else if (errorMsg.includes('name')) {
          setErrors({ fullName: error.message });
        } else if (errorMsg.includes('location')) {
          setErrors({ location: error.message });
        } else {
          // General validation error
          setErrors({ fullName: error.message });
        }
        return;
      }

      // Check for rate limiting
      if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('try again later')) {
        console.log('Detected rate limiting error, showing toast');
        toast.error(error.message, {
          duration: 6000,
          position: 'top-center',
        });
        return;
      }

      // Check for server errors
      if (errorMsg.includes('server error') || errorMsg.includes('internal error')) {
        console.log('Detected server error, showing toast');
        toast.error(error.message, {
          duration: 5000,
          position: 'top-center',
        });
        return;
      }

      // Fallback for any other profile error
      console.log('No specific match found, showing fallback toast');
      toast.error(error.message || 'Failed to create profile. Please try again.', {
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
        title: 'Access Denied',
        text: 'You do not have permission to create a profile. Please contact support.',
        icon: 'error',
        confirmButtonText: 'Contact Support',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (status === 409) {
      await Swal.fire({
        title: 'Profile Already Exists',
        text: 'A profile with this information already exists. Redirecting you to the main application.',
        icon: 'info',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#3085d6',
      });
      navigate('/search');
      return;
    }

    // Field-specific errors (use inline)
    if (status === 422 && context === 'profile') {
      // Try to extract field-specific errors from response
      const errors = error?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        setErrors(errors);
        return;
      } else {
        setErrors({ fullName: message || 'Please check your input data' });
        return;
      }
    }

    // General errors (use toast)
    let toastMessage = 'An unexpected error occurred. Please try again.';
    
    if (status === 429) {
      toastMessage = 'Too many requests. Please wait before trying again.';
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.trim().length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Show loading toast
    const loadingToast = toast.loading('Creating your profile...');

    try {
      console.log({ formData }, 'form data active modal');
      
      // Try using AuthContext createProfile first, then fallback to direct API
      let result;
      
      if (createProfile) {
        // Use AuthContext method
        result = await createProfile(formData);
      } else {
        // Fallback to direct API call
        result = await usersAPI.createProfile(formData);
      }

      console.log({ result });

      if (result.success) {
        toast.dismiss(loadingToast);
        
        // Show success toast
        toast.success('Profile created successfully! Welcome to Pravasi Privilege.', {
          duration: 4000,
          position: 'top-center',
        });

        // Call success callback
        if (onProfileCreateSuccess) {
          onProfileCreateSuccess(formData);
        }

        // Close modal
        onClose();

        // Navigate to main app
        setTimeout(() => {
          navigate('/search');
        }, 1000);

        // Reset form for next use
        setFormData({
          userId: '',
          adminId: '',
          fullName: '',
          email: '',
          countryCode: '+91',
          phone: '',
          location: '',
        });
      } else {
        toast.dismiss(loadingToast);
        
        // Handle profile creation failure
        console.log('Profile creation failed with result:', result);
        await handleAPIError({ message: result.error }, 'profile');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error submitting form:', error);
      
      // For catch block errors, we might have the actual HTTP response
      await handleAPIError(error, 'profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (userData || userId) {
      setFormData({
        userId: userId || userData?.userId || '',
        adminId: userData?.adminId || '',
        fullName: userData?.fullName || '',
        email: userData?.email || '',
        countryCode: userData?.countryCode || '+91',
        phone: userData?.phone || '',
        location: userData?.location || '',
      });
    }
  }, [userData, userId]);

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

  const handleCountryCodeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: e.target.value,
    }));
  };

  const handleBackdropClick = (e) => {
    // Close modal when clicking on backdrop (only if not submitting)
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const isProcessing = isSubmitting || authLoading;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        className="relative rounded-3xl bg-white border-white border-4 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalContentClick}
      >
        {/* Title and Subtitle */}
        <div className="text-left mb-6 px-8 pt-6">
          <h1 className="text-2xl font-medium text-black mb-2 pr-8">
            Apply for Your Pravasi Privilege Card
          </h1>
          <p className="text-[#989898] text-sm font-medium">
            Fill in your details to get access to exclusive discounts
          </p>
        </div>

        {/* Form */}
        <div className="px-10 pb-8 border border-[#3D3C96] rounded-2xl mx-8 mb-8">
          <div className="space-y-6 py-8">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[#666666] mb-2">
                Full Name*
              </label>
              <input
                name="fullName"
                placeholder="Type your full name"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isProcessing}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.fullName && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.fullName}</p>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#666666] mb-2">
                Email id*
              </label>
              <input
                name="email"
                placeholder="Type your email id"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isProcessing}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.email && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.email}</p>
                </div>
              )}
            </div>

            {/* Phone Number Field with Country Code */}
            <div>
              <label className="block text-sm font-semibold text-[#666666] mb-2">
                Phone Number*
              </label>
              <div
                className={`flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                {/* Country Code Selector */}
                <div className="relative bg-white">
                  <select
                    value={formData.countryCode}
                    onChange={handleCountryCodeChange}
                    disabled={isProcessing}
                    className={`appearance-none bg-white border-0 px-3 py-3 pr-8 focus:ring-0 focus:border-0 outline-none text-gray-900 min-w-[100px] border-r border-gray-300 ${
                      isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {countryCodes.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>

                {/* Phone Number Input */}
                <input
                  name="phone"
                  placeholder="Type your number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 border-0 focus:ring-0 focus:border-0 outline-none placeholder-gray-400 text-gray-900 bg-white ${
                    isProcessing ? 'cursor-not-allowed' : ''
                  }`}
                />
              </div>
              {errors.phone && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                </div>
              )}
            </div>

            {/* Location Field */}
            <div>
              <label className="block text-sm font-semibold text-[#666666] mb-2">
                Location*
              </label>
              <input
                name="location"
                placeholder="Type your location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                disabled={isProcessing}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.location && (
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                  <p className="text-red-500 text-xs">{errors.location}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div
              className="w-full rounded-lg mt-8 p-[1px]"
              style={{
                background:
                  'linear-gradient(92.38deg, #222158 -21.33%, rgba(34, 33, 88, 0) 149.35%)',
              }}
            >
              <button
                onClick={handleSubmit}
                disabled={
                  isProcessing ||
                  !formData.fullName.trim() ||
                  !formData.email.trim() ||
                  !formData.phone.trim() ||
                  !formData.location.trim()
                }
                className={`w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200 flex items-center justify-center ${
                  isProcessing ||
                  !formData.fullName.trim() ||
                  !formData.email.trim() ||
                  !formData.phone.trim() ||
                  !formData.location.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#9ECFFF]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Creating Profile...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateModal;