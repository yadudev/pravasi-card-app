// components/Shops/NewShopRegistrationModal.jsx
import React, { useState } from 'react';
import { X, Eye, EyeOff, Check } from 'lucide-react';
import Button from '../ui/Button';
import { shopsAPI } from '../../services/api';

const NewShopRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Basic Shop Information
    name: '',
    description: '',
    category: '',
    
    // Owner Information
    ownerName: '',
    email: '',
    phone: '',
    
    // Address Information
    address: '',
    location: '',
    
    // Business Information
    discountOffered: 0,
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    
    // Additional fields not in model (will be processed separately)
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const categories = [
    'Electronics', 'Fashion', 'Groceries', 'Pharmacy', 'Restaurant',
    'Bakery', 'Bookstore', 'Hardware', 'Jewelry', 'Footwear',
    'Furniture', 'Automotive', 'Sports', 'Beauty', 'Toys',
    'Medical', 'Education', 'Services', 'Other'
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Shop Information
        if (!formData.name.trim()) newErrors.name = 'Shop name is required';
        if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
        break;
        
      case 2: // Address & Category
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
        
      case 3: // Business Information
        if (formData.discountOffered < 0 || formData.discountOffered > 100) {
          newErrors.discountOffered = 'Discount must be between 0 and 100';
        }
        if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
          newErrors.gstNumber = 'Invalid GST number format';
        }
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
          newErrors.panNumber = 'Invalid PAN number format';
        }
        if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
          newErrors.ifscCode = 'Invalid IFSC code format';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      // Prepare payload according to model structure
      const { password, confirmPassword, ...shopData } = formData;
      
      const payload = {
        ...shopData,
        discountOffered: parseFloat(formData.discountOffered) || 0,
        status: 'pending', // Default status for new registrations
        isActive: true,
        totalPurchases: 0,
        totalRevenue: 0,
        lastActivity: new Date().toISOString(),
        password
      };
      
      const response = await shopsAPI.createShop(payload);
      console.log({response})
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating shop:', error);
      alert('Failed to register shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', category: '', ownerName: '', email: '',
      phone: '', address: '', location: '', discountOffered: 0,
      registrationNumber: '', gstNumber: '', panNumber: '',
      bankAccountNumber: '', ifscCode: '', password: '', confirmPassword: ''
    });
    setErrors({});
    setCurrentStep(1);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter shop name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner Name *
          </label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => handleInputChange('ownerName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.ownerName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter owner name"
          />
          {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter 10-digit phone number"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your shop and services"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Address & Category</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter complete shop address"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location/Landmark
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter nearby landmark or location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Offered (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discountOffered}
            onChange={(e) => handleInputChange('discountOffered', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.discountOffered ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter discount percentage"
          />
          {errors.discountOffered && <p className="text-red-500 text-sm mt-1">{errors.discountOffered}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Business Documents & Account</h3>
      
      <div className="space-y-6">
        {/* Business Documents */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Business Documents (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Business registration number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gstNumber && <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.panNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="AAAAA0000A"
              />
              {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Bank Details (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.ifscCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="SBIN0000123"
              />
              {errors.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>}
            </div>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Account Credentials</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Registration Status</h4>
          <p className="text-sm text-blue-700">
            Your shop will be registered with "Pending" status and will require admin approval before becoming active.
            You will receive an email notification once your shop is approved.
          </p>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 min-h-0 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Add New Shop</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-160px)]">
            {renderStepIndicator()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Footer - Fixed */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Shop'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewShopRegistrationModal;