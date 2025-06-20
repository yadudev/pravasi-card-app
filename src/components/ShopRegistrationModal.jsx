import React, { useState } from 'react';
import { shopsAPI } from '../services/api';

const ShopRegistrationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.shopName.trim())
        newErrors.shopName = 'Store name is required';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.email.trim())
        newErrors.email = 'Business email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (step === 2) {
      if (!formData.district) newErrors.district = 'District is required';
      if (!formData.talukBlock)
        newErrors.talukBlock = 'Taluk/Block is required';
      if (!formData.location.trim())
        newErrors.location = 'Location is required';
    }

    if (step === 3) {
      if (!formData.storeAddress.trim())
        newErrors.storeAddress = 'Store address is required';
      if (!formData.gstNumber.trim())
        newErrors.gstNumber = 'GST number is required';
      if (!formData.confirmDetails)
        newErrors.confirmDetails = 'You must confirm the details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(3)) {
      setIsSubmitting(true); // Start loading
      
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
          // Show success message
          alert(response.message || 'Shop registration submitted successfully! We will review your application and get back to you within 2-3 business days.');
          
          // Close modal and reset form
          onClose();
          resetForm();
        } else {
          // Handle API error response
          alert(response.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Registration error:', error);
        
        // Handle different types of errors
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.message.includes('400')) {
          errorMessage = 'Please check your information and try again.';
        } else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = 'A shop with this email already exists.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        alert(errorMessage);
      } finally {
        setIsSubmitting(false); // Stop loading
      }
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
    onClose();
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
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 font-figtree">
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your store name"
                    disabled={isSubmitting}
                  />
                  {errors.shopName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.shopName}
                    </p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.category}
                    </p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your email id"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your phone number"
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.district}
                    </p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.talukBlock}
                    </p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your location"
                    disabled={isSubmitting}
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.location}
                    </p>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your Store address"
                    disabled={isSubmitting}
                  />
                  {errors.storeAddress && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.storeAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    GST Number*
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      handleInputChange('gstNumber', e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
                      errors.gstNumber
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Type your GST number"
                    disabled={isSubmitting}
                  />
                  {errors.gstNumber && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.gstNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-[#666666] mb-3">
                    Discount Offer You'd Like to Provide
                  </label>
                  <input
                    type="text"
                    value={formData.discountOffer}
                    onChange={(e) =>
                      handleInputChange('discountOffer', e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
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
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#666666]">
                      I confirm that the details above are accurate and agree to
                      offer the mentioned discount to cardholders.
                    </span>
                  </label>
                  {errors.confirmDetails && (
                    <p className="mt-2 text-sm text-red-600 ml-6">
                      {errors.confirmDetails}
                    </p>
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
                className="w-full bg-[#AFDCFF] text-[#222158] py-3 px-6 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg"
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.confirmDetails || isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg ${
                  formData.confirmDetails && !isSubmitting
                    ? 'bg-[#AFDCFF] text-[#222158]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistrationModal;