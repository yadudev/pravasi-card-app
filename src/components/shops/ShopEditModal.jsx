// components/Shops/ShopEditModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Check, Building, User, MapPin, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { shopsAPI } from '../../services/api';

const ShopEditModal = ({ isOpen, shop, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    latitude: '',
    longitude: '',
    category: '',
    description: '',
    discountOffered: 0,
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const categories = [
    'Electronics',
    'Fashion & Clothing',
    'Food & Beverages',
    'Books & Stationery',
    'Health & Beauty',
    'Sports & Fitness',
    'Home & Garden',
    'Automotive',
    'Jewelry',
    'General'
  ];

  // Initialize form data when shop changes
  useEffect(() => {
    if (shop && isOpen) {
      const initialData = {
        name: shop.name || '',
        ownerName: shop.ownerName || '',
        email: shop.email || '',
        phone: shop.phone || '',
        address: shop.address || '',
        location: shop.location || '',
        latitude: shop.latitude || '',
        longitude: shop.longitude || '',
        category: shop.category || '',
        description: shop.description || '',
        discountOffered: shop.discountOffered || 0,
        registrationNumber: shop.registrationNumber || '',
        gstNumber: shop.gstNumber || '',
        panNumber: shop.panNumber || '',
        bankAccountNumber: shop.bankAccountNumber || '',
        ifscCode: shop.ifscCode || '',
        isActive: shop.isActive !== undefined ? shop.isActive : true
      };
      setFormData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [shop, isOpen]);

  const handleInputChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Check if there are changes compared to original shop data
      setHasChanges(JSON.stringify(newData) !== JSON.stringify({
        name: shop.name || '',
        ownerName: shop.ownerName || '',
        email: shop.email || '',
        phone: shop.phone || '',
        address: shop.address || '',
        location: shop.location || '',
        latitude: shop.latitude || '',
        longitude: shop.longitude || '',
        category: shop.category || '',
        description: shop.description || '',
        discountOffered: shop.discountOffered || 0,
        registrationNumber: shop.registrationNumber || '',
        gstNumber: shop.gstNumber || '',
        panNumber: shop.panNumber || '',
        bankAccountNumber: shop.bankAccountNumber || '',
        ifscCode: shop.ifscCode || '',
        isActive: shop.isActive !== undefined ? shop.isActive : true
      }));
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Shop name must be between 2 and 100 characters';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    } else if (formData.ownerName.length < 2 || formData.ownerName.length > 100) {
      newErrors.ownerName = 'Owner name must be between 2 and 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please provide a valid Indian mobile number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 10 || formData.address.length > 500) {
      newErrors.address = 'Address must be between 10 and 500 characters';
    }

    if (formData.discountOffered < 0 || formData.discountOffered > 100) {
      newErrors.discountOffered = 'Discount must be between 0 and 100';
    }

    // Validate latitude and longitude if provided (optional fields)
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Optional field validations
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Please provide a valid GST number';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Please provide a valid PAN number';
    }

    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = 'Please provide a valid IFSC code';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !hasChanges) return;
    
    setLoading(true);
    try {
      // Prepare payload - only send fields that have changed
      const payload = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== (shop[key] || '')) {
          // Handle latitude and longitude conversion
          if (key === 'latitude' || key === 'longitude') {
            payload[key] = formData[key] ? parseFloat(formData[key]) : null;
          } else {
            payload[key] = formData[key];
          }
        }
      });

      await shopsAPI.updateShop(shop.id, payload);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating shop:', error);
      if (error.response?.data?.message) {
        alert(`Failed to update shop: ${error.response.data.message}`);
      } else {
        alert('Failed to update shop. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <Building className="h-5 w-5 mr-2 text-blue-600" />
        Basic Information
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your shop and services"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/1000 characters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Offered (%) *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={true}>Active</option>
              <option value={false}>Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <User className="h-5 w-5 mr-2 text-blue-600" />
        Contact Information
      </h3>
      
      <div className="space-y-4">
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
      </div>
    </div>
  );

  const renderAddressTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
        Address Information
      </h3>
      
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
          <p className="text-xs text-gray-500 mt-1">
            {formData.address.length}/500 characters
          </p>
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

        {/* Latitude and Longitude Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => handleInputChange('latitude', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.latitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 12.9716"
            />
            {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
            <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => handleInputChange('longitude', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.longitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 77.5946"
            />
            {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
            <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-blue-600" />
        Business Information
      </h3>
      
      <div className="space-y-6">
        {/* Business Documents */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Business Documents</h4>
          
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
          <h4 className="font-medium text-gray-800">Bank Details</h4>
          
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
      </div>
    </div>
  );

  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Shop Details</h2>
            <p className="text-gray-600">{shop.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            {hasChanges && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Unsaved changes
              </div>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Basic Info', icon: Building },
              { id: 'contact', label: 'Contact', icon: User },
              { id: 'address', label: 'Address', icon: MapPin },
              { id: 'business', label: 'Business', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'address' && renderAddressTab()}
            {activeTab === 'business' && renderBusinessTab()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
            <div className="text-sm text-gray-600">
              {hasChanges ? 'You have unsaved changes' : 'No changes made'}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={loading || !hasChanges || Object.keys(errors).length > 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopEditModal;