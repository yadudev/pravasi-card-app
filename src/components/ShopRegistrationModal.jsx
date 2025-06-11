import React, { useState } from 'react';
import {
  X,
  Upload,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Globe,
  Star,
  Camera,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const ShopRegistrationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    category: '',

    // Step 2: Location & Details
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    description: '',

    // Step 3: Verification & Agreement
    businessLicense: null,
    shopPhoto: null,
    agreeTerms: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.shopName.trim())
        newErrors.shopName = 'Store name is required';
      if (!formData.email.trim())
        newErrors.email = 'Business email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.category) newErrors.category = 'Category is required';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    }

    if (step === 3) {
      if (!formData.businessLicense)
        newErrors.businessLicense = 'Business license is required';
      if (!formData.agreeTerms)
        newErrors.agreeTerms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      // Handle form submission here
      console.log('Form submitted:', formData);

      // Show success message or redirect
      alert(
        'Shop registration submitted successfully! We will review your application and get back to you within 2-3 business days.'
      );

      // Close modal and reset form
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      shopName: '',
      ownerName: '',
      email: '',
      phone: '',
      category: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      website: '',
      description: '',
      businessLicense: null,
      shopPhoto: null,
      agreeTerms: false,
      agreeMarketing: false,
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    // Optionally reset form on close
    // resetForm();
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

  const FileUploadArea = ({
    field,
    accept,
    title,
    description,
    icon: Icon,
    file,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {title} {field === 'businessLicense' && '*'}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
          errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      >
        <Icon size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(field, e.target.files[0])}
          className="hidden"
          id={`${field}-upload`}
        />
        <label
          htmlFor={`${field}-upload`}
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Choose File
        </label>
        {file && <p className="mt-2 text-sm text-green-600">✓ {file.name}</p>}
      </div>
      {errors[field] && (
        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
      )}
    </div>
  );

  const InputField = ({
    label,
    field,
    type = 'text',
    placeholder,
    icon: Icon,
    required = false,
    ...props
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {Icon && <Icon size={16} className="inline mr-2" />}
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
        placeholder={placeholder}
        {...props}
      />
      {errors[field] && (
        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 font-figtree">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-auto max-h-[90vh] overflow-y-auto shadow-2xl">
         {/* Step Content */}
        <div className="px-8 py-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-left mb-4">
                <h3 className="text-2xl font-medium mb-3 text-black">
                  Become a Partner Store
                </h3>
                <p className="text-[989898] text-sm font-medium">
                  Join the Pravasi Privilege Network & attract loyal customers
                  with exclusive card deals.
                </p>
              </div>

              <div className="space-y-6 border border-[#3D3C96] p-6 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    placeholder="Type your Store name."
                  />
                  {errors.shopName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.shopName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Location & Details
                </h3>
                <p className="text-gray-600">
                  Provide your shop location and additional information
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Shop Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.address
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter complete shop address including building name, street, area"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="City"
                  field="city"
                  placeholder="City"
                  required
                />

                <InputField
                  label="State"
                  field="state"
                  placeholder="State"
                  required
                />

                <InputField
                  label="Pincode"
                  field="pincode"
                  placeholder="Pincode"
                  required
                />
              </div>

              <InputField
                label="Website"
                field="website"
                type="url"
                placeholder="https://yourshop.com (optional)"
                icon={Globe}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Describe your shop, products, services, and what makes you special. This will help customers find you."
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  📍 <strong>Location Tip:</strong> Make sure your address is
                  accurate. This will help customers locate your shop and verify
                  your business.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Verification & Agreement
                </h3>
                <p className="text-gray-600">
                  Upload documents and finalize your registration
                </p>
              </div>

              <div className="space-y-6">
                <FileUploadArea
                  field="businessLicense"
                  accept=".pdf,.jpg,.png,.jpeg"
                  title="Business License/Registration"
                  description="Upload business license, GST certificate, or shop registration document"
                  icon={Upload}
                  file={formData.businessLicense}
                />

                <FileUploadArea
                  field="shopPhoto"
                  accept=".jpg,.png,.jpeg"
                  title="Shop Photo"
                  description="Upload a clear photo of your shop (exterior/interior)"
                  icon={Camera}
                  file={formData.shopPhoto}
                />
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">
                  Terms & Agreements
                </h4>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) =>
                      handleInputChange('agreeTerms', e.target.checked)
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Privacy Policy
                    </a>{' '}
                    *
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-sm text-red-600 ml-6">
                    {errors.agreeTerms}
                  </p>
                )}

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeMarketing}
                    onChange={(e) =>
                      handleInputChange('agreeMarketing', e.target.checked)
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to receive marketing communications, promotional
                    offers, and business updates
                  </span>
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Your application will be reviewed within 2-3 business days
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You'll receive email confirmation once approved
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Access your merchant dashboard to create offers
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Start attracting Pravasi Card holders with exclusive
                    discounts
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-white">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="px-6 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-600 hover:bg-gray-100 border border-gray-300"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="text-sm text-gray-500 font-medium">
            {currentStep > 1 && `Step ${currentStep} of 3`}
          </div>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="w-full max-w-sm bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg font-medium text-base"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!formData.agreeTerms}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md ${
                formData.agreeTerms
                  ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Submit Application</span>
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ShopRegistrationModal;
