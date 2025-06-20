import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { usersAPI } from '../services/api';

const ActivateModal = ({
  isOpen,
  onClose,
  userId,
  userData,
  onProfileCreateSuccess,
}) => {
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
  const [submitError, setSubmitError] = useState('');

  const countryCodes = [
    { code: '+91', flag: '🇮🇳', country: 'India' },
    { code: '+1', flag: '🇺🇸', country: 'USA' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+61', flag: '🇦🇺', country: 'Australia' },
    { code: '+65', flag: '🇸🇬', country: 'Singapore' },
    { code: '+971', flag: '🇦🇪', country: 'UAE' },
  ];

  // Close modal on Escape key press
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      console.log({ formData }, 'form data active modal');
      const result = await usersAPI.createProfile(formData);
      console.log({ result });
      if (result.success) {
        onProfileCreateSuccess(formData);
        onClose();
        setFormData({
          userId: userId,
          adminId: userData?.adminId || '',
          fullName: '',
          email: userData?.email || '',
          countryCode: '+91',
          phone: userData?.phone || '',
          location: '',
        });
      } else {
        setSubmitError(
          result.error || 'Failed to submit application. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
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
            {/* Submit Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            )}

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
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
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
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            {/* Phone Number Field with Country Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number*
              </label>
              <div
                className={`flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${
                  isSubmitting ? 'opacity-50' : ''
                }`}
              >
                {/* Country Code Selector */}
                <div className="relative bg-white">
                  <select
                    value={formData.countryCode}
                    onChange={handleCountryCodeChange}
                    disabled={isSubmitting}
                    className={`appearance-none bg-white border-0 px-3 py-3 pr-8 focus:ring-0 focus:border-0 outline-none text-gray-900 min-w-[100px] border-r border-gray-300 ${
                      isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
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
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-3 border-0 focus:ring-0 focus:border-0 outline-none placeholder-gray-400 text-gray-900 bg-white ${
                    isSubmitting ? 'cursor-not-allowed' : ''
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
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
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-gray-900 bg-white ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
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
                disabled={isSubmitting}
                className={`w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200 ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#9ECFFF]'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateModal;
