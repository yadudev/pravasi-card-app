import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { shopsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ShopRegistrationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    shopName: '',
    category: '',
    email: '',
    phone: '',

    // Step 2: Location Details
    district: '',
    talukBlock: '',
    location: '',

    // Step 3: Final Details
    storeAddress: '',
    gstNumber: '',
    discountOffer: '',
    confirmDetails: false,
  });

  const [errors, setErrors] = useState({});

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
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
  }, [isOpen, isSubmitting]);

  // Enhanced error handling for shop registration
  const handleAPIError = async (error, context = 'general') => {
    const status = error?.response?.status;
    const responseData = error?.response?.data;
    const message = responseData?.message || error?.message;

    // Handle shop registration specific errors
    if (context === 'registration') {
      // Handle structured API validation errors
      if (
        responseData &&
        !responseData.success &&
        responseData.message === 'Validation failed' &&
        responseData.errors
      ) {
        console.log(
          'Detected structured validation errors:',
          responseData.errors
        );

        const newErrors = {};

        // Process each validation error
        responseData.errors.forEach((errorItem) => {
          const errorMessage = errorItem.message || '';
          const errorMsg = errorMessage.toLowerCase();

          // Map API error messages to form fields
          if (errorMsg.includes('gst')) {
            newErrors.gstNumber = errorMessage;
          } else if (errorMsg.includes('email')) {
            newErrors.email = errorMessage;
          } else if (errorMsg.includes('phone')) {
            newErrors.phone = errorMessage;
          } else if (errorMsg.includes('shop') || errorMsg.includes('store')) {
            newErrors.shopName = errorMessage;
          } else if (errorMsg.includes('address')) {
            newErrors.storeAddress = errorMessage;
          } else if (errorMsg.includes('location')) {
            newErrors.location = errorMessage;
          } else if (errorMsg.includes('district')) {
            newErrors.district = errorMessage;
          } else if (errorMsg.includes('taluk') || errorMsg.includes('block')) {
            newErrors.talukBlock = errorMessage;
          } else if (errorMsg.includes('category')) {
            newErrors.category = errorMessage;
          } else {
            // If we can't map to a specific field, show as toast
            toast.error(errorMessage, {
              duration: 4000,
              position: 'top-center',
            });
          }
        });

        // Set field-specific errors
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        }

        return;
      }

      // Check for duplicate shop registration
      if (
        error?.message?.toLowerCase().includes('already exists') ||
        error?.message?.toLowerCase().includes('duplicate') ||
        status === 409
      ) {
        console.log('Detected duplicate shop error, showing SweetAlert');
        await Swal.fire({
          title: 'Shop Already Registered',
          text: 'A shop with this email or details already exists in our system. Please contact support if you believe this is an error.',
          icon: 'warning',
          confirmButtonText: 'Contact Support',
          confirmButtonColor: '#3085d6',
          showCancelButton: true,
          cancelButtonText: 'Try Different Email',
        });
        return;
      }

      // Check for general validation errors (fallback)
      if (
        error?.message?.toLowerCase().includes('validation') ||
        error?.message?.toLowerCase().includes('invalid') ||
        status === 422
      ) {
        console.log('Detected general validation error, showing toast');
        toast.error(
          error.message || 'Please check your information and try again.',
          {
            duration: 4000,
            position: 'top-center',
          }
        );
        return;
      }

      // Check for rate limiting
      if (
        error?.message?.toLowerCase().includes('too many') ||
        error?.message?.toLowerCase().includes('rate limit') ||
        status === 429
      ) {
        console.log('Detected rate limiting error, showing toast');
        toast.error(
          error.message ||
            'Too many registration attempts. Please wait before trying again.',
          {
            duration: 6000,
            position: 'top-center',
          }
        );
        return;
      }

      // Check for server errors
      if (
        error?.message?.toLowerCase().includes('server error') ||
        status >= 500
      ) {
        console.log('Detected server error, showing toast');
        toast.error(
          'Server error occurred. Please try again later or contact support.',
          {
            duration: 5000,
            position: 'top-center',
          }
        );
        return;
      }

      // Network errors
      if (
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('fetch') ||
        !navigator.onLine
      ) {
        console.log('Detected network error, showing toast');
        toast.error(
          'Network error. Please check your internet connection and try again.',
          {
            duration: 5000,
            position: 'top-center',
          }
        );
        return;
      }
    }

    // Critical errors that need SweetAlert2
    if (status === 403) {
      await Swal.fire({
        title: 'Registration Not Allowed',
        text: 'Shop registration is currently not available in your area. Please contact support for more information.',
        icon: 'error',
        confirmButtonText: 'Contact Support',
        confirmButtonColor: '#d33',
      });
      return;
    }

    // General fallback error
    console.log('Showing fallback toast error');
    toast.error(
      message || error?.message || 'Registration failed. Please try again.',
      {
        duration: 4000,
        position: 'top-center',
      }
    );
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.shopName.trim()) {
        newErrors.shopName = 'Store name is required';
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Business email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (step === 2) {
      if (!formData.district) {
        newErrors.district = 'District is required';
      }
      if (!formData.talukBlock) {
        newErrors.talukBlock = 'Taluk/Block is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    }

    if (step === 3) {
      if (!formData.storeAddress.trim()) {
        newErrors.storeAddress = 'Store address is required';
      }
      // GST Number is now optional - no validation required
      if (!formData.confirmDetails) {
        newErrors.confirmDetails = 'You must confirm the details';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    } else {
      toast.error('Please fix the errors before proceeding', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Please fix all errors before submitting', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Show loading toast
    const loadingToast = toast.loading('Submitting your shop registration...');

    try {
      // Prepare the data to match your controller's expected fields
      const registrationData = {
        shopName: formData.shopName,
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        district: formData.district,
        talukBlock: formData.talukBlock,
        location: formData.location,
        storeAddress: formData.storeAddress,
        gstNumber: formData.gstNumber,
        discountOffer: formData.discountOffer,
        confirmDetails: formData.confirmDetails,
      };

      // Call the API
      const response = await shopsAPI.registerShop(registrationData);

      if (response.success) {
        toast.dismiss(loadingToast);

        // Set submitting to false BEFORE closing modal
        setIsSubmitting(false);

        // Close modal and reset form first
        onClose();
        resetForm();

        // Then show success SweetAlert2 after a small delay to ensure modal is closed
        setTimeout(async () => {
          await Swal.fire({
            title: 'Registration Submitted Successfully!',
            html: `
            <div class="text-left">
              <p class="mb-4">Thank you for registering <strong>${formData.shopName}</strong> with Pravasi Privilege!</p>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-800">
                  <strong>What's Next?</strong><br>
                  • Our team will review your application<br>
                  • You'll receive a confirmation email within 24 hours<br>
                  • Approval typically takes 2-3 business days<br>
                  • Once approved, you'll receive partnership materials
                </p>
              </div>
            </div>
          `,
            icon: 'success',
            confirmButtonText: 'Great, Thanks!',
            confirmButtonColor: '#059669',
            allowOutsideClick: false,
            width: '500px',
          });
        }, 100);

        return; // Early return to avoid the finally block
      } else {
        toast.dismiss(loadingToast);

        // Handle API error response - Check for structured validation errors
        console.log('API Error Response:', response);

        if (
          response.message === 'Validation failed' &&
          response.errors &&
          Array.isArray(response.errors)
        ) {
          console.log(
            'Processing structured validation errors:',
            response.errors
          );

          const newErrors = {};

          // Process each validation error
          response.errors.forEach((errorItem) => {
            const errorMessage = errorItem.message || '';
            const errorMsg = errorMessage.toLowerCase();

            console.log('Processing error:', errorMessage);

            // Map API error messages to form fields
            if (errorMsg.includes('gst')) {
              newErrors.gstNumber = errorMessage;
            } else if (errorMsg.includes('email')) {
              newErrors.email = errorMessage;
            } else if (errorMsg.includes('phone')) {
              newErrors.phone = errorMessage;
            } else if (
              errorMsg.includes('shop') ||
              errorMsg.includes('store')
            ) {
              newErrors.shopName = errorMessage;
            } else if (errorMsg.includes('address')) {
              newErrors.storeAddress = errorMessage;
            } else if (errorMsg.includes('location')) {
              newErrors.location = errorMessage;
            } else if (errorMsg.includes('district')) {
              newErrors.district = errorMessage;
            } else if (
              errorMsg.includes('taluk') ||
              errorMsg.includes('block')
            ) {
              newErrors.talukBlock = errorMessage;
            } else if (errorMsg.includes('category')) {
              newErrors.category = errorMessage;
            } else {
              // If we can't map to a specific field, show as toast
              toast.error(errorMessage, {
                duration: 4000,
                position: 'top-center',
              });
            }
          });

          // Set field-specific errors
          if (Object.keys(newErrors).length > 0) {
            console.log('Setting field errors:', newErrors);
            setErrors(newErrors);
          }
        } else {
          // Fallback to generic API error handling
          await handleAPIError({ message: response.message }, 'registration');
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Registration error:', error);
      console.log('Error response:', error?.response?.data);

      // Handle structured validation errors from catch block
      const responseData = error?.response?.data;

      if (
        responseData &&
        responseData.message === 'Validation failed' &&
        responseData.errors &&
        Array.isArray(responseData.errors)
      ) {
        console.log(
          'Catch block - Processing structured validation errors:',
          responseData.errors
        );

        const newErrors = {};

        // Process each validation error
        responseData.errors.forEach((errorItem) => {
          const errorMessage = errorItem.message || '';
          const errorMsg = errorMessage.toLowerCase();

          console.log('Catch block - Processing error:', errorMessage);

          // Map API error messages to form fields
          if (errorMsg.includes('gst')) {
            newErrors.gstNumber = errorMessage;
          } else if (errorMsg.includes('email')) {
            newErrors.email = errorMessage;
          } else if (errorMsg.includes('phone')) {
            newErrors.phone = errorMessage;
          } else if (errorMsg.includes('shop') || errorMsg.includes('store')) {
            newErrors.shopName = errorMessage;
          } else if (errorMsg.includes('address')) {
            newErrors.storeAddress = errorMessage;
          } else if (errorMsg.includes('location')) {
            newErrors.location = errorMessage;
          } else if (errorMsg.includes('district')) {
            newErrors.district = errorMessage;
          } else if (errorMsg.includes('taluk') || errorMsg.includes('block')) {
            newErrors.talukBlock = errorMessage;
          } else if (errorMsg.includes('category')) {
            newErrors.category = errorMessage;
          } else {
            // If we can't map to a specific field, show as toast
            toast.error(errorMessage, {
              duration: 4000,
              position: 'top-center',
            });
          }
        });

        // Set field-specific errors
        if (Object.keys(newErrors).length > 0) {
          console.log('Catch block - Setting field errors:', newErrors);
          setErrors(newErrors);
        }
      } else {
        // Handle different types of errors with the enhanced error handler
        await handleAPIError(error, 'registration');
      }
    } finally {
      // Only set submitting to false if we didn't already do it in the success path
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      shopName: '',
      category: '',
      email: '',
      phone: '',
      district: '',
      talukBlock: '',
      location: '',
      storeAddress: '',
      gstNumber: '',
      discountOffer: '',
      confirmDetails: false,
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const categories = [
    'Shopping',
    'Healthcare',
    'Travel',
    'Dining',
    'Entertainment',
    'Beauty',
    'Home & Living',
    'Services',
    'Automotive',
    'Electronics',
    'Sports & Fitness',
    'Education',
  ];

  const districts = [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
  ];

  const talukBlocks = [
    'Thiruvananthapuram',
    'Chirayinkeezhu',
    'Neyyattinkara',
    'Nedumangad',
    'Varkala',
    'Kollam',
    'Karunagappally',
    'Kottarakkara',
    'Punalur',
    'Pathanamthitta',
    'Adoor',
    'Kozhencherry',
    'Ranni',
    'Mallappally',
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4 font-figtree"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl h-auto max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h2 className="text-2xl font-medium text-black">
              Become a Partner Store
            </h2>
            <p className="text-[#989898] text-sm font-medium mt-1">
              Join the Pravasi Privilege Network & attract loyal customers with
              exclusive card deals.
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 py-2 mx-8 my-2 border border-[#3D3C96] p-6 rounded-xl">
          {currentStep === 1 && (
            <div className="space-y-6 py-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Store Name*
                  </label>
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) =>
                      handleInputChange('shopName', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.shopName
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your store name"
                    disabled={isSubmitting}
                  />
                  {errors.shopName && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.shopName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Categories*
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange('category', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.category
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.category}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Business Email*
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.email
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your email id"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.email}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.phone
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your phone number"
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 py-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    District*
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange('district', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.district
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.district}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Taluk / Block*
                  </label>
                  <select
                    value={formData.talukBlock}
                    onChange={(e) =>
                      handleInputChange('talukBlock', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.talukBlock
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select taluk</option>
                    {talukBlocks.map((taluk) => (
                      <option key={taluk} value={taluk}>
                        {taluk}
                      </option>
                    ))}
                  </select>
                  {errors.talukBlock && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">
                        {errors.talukBlock}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Location*
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange('location', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.location
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your location"
                    disabled={isSubmitting}
                  />
                  {errors.location && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 py-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Store Address*
                  </label>
                  <textarea
                    value={formData.storeAddress}
                    onChange={(e) =>
                      handleInputChange('storeAddress', e.target.value)
                    }
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.storeAddress
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your Store address"
                    disabled={isSubmitting}
                  />
                  {errors.storeAddress && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">
                        {errors.storeAddress}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      handleInputChange('gstNumber', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.gstNumber
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Type your GST number"
                    disabled={isSubmitting}
                  />
                  {errors.gstNumber && (
                    <div className="flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">{errors.gstNumber}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You can provide your GST number if you have one. This helps
                    us better categorize your business.
                  </p>
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Discount Offer You'd Like to Provide
                  </label>
                  <input
                    type="number"
                    value={formData.discountOffer}
                    onChange={(e) =>
                      handleInputChange('discountOffer', e.target.value)
                    }
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="20% OFF on total bill"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mt-6">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.confirmDetails}
                      onChange={(e) =>
                        handleInputChange('confirmDetails', e.target.checked)
                      }
                      className={`mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#666666]">
                      I confirm that the details above are accurate and agree to
                      offer the mentioned discount to cardholders.
                    </span>
                  </label>
                  {errors.confirmDetails && (
                    <div className="flex items-center mt-2 ml-6">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                      <p className="text-sm text-red-600">
                        {errors.confirmDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="w-full rounded-lg p-[1px] my-4"
            style={{
              background:
                'linear-gradient(92.38deg, #222158 -21.33%, rgba(34, 33, 88, 0) 149.35%)',
            }}
          >
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className={`w-full bg-[#AFDCFF] text-[#222158] py-3 px-6 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.confirmDetails || isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center ${
                  formData.confirmDetails && !isSubmitting
                    ? 'bg-[#AFDCFF] text-[#222158]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistrationModal;
