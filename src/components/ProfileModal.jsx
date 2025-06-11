import React, { useState } from 'react';
import { X, ChevronRight, Trash2, ArrowRight } from 'lucide-react';

const ProfileModal = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onManageCard,
  getUserInitials,
}) => {
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phoneNumber: user?.phone || '+91 832487778',
    email: user?.email || '',
    location: user?.location || 'Kochi',
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePicture = () => {
    // Add your change picture logic here
    console.log('Change picture clicked');
  };

  const handleDeletePicture = () => {
    // Add your delete picture logic here
    console.log('Delete picture clicked');
  };

  const handleChangePassword = () => {
    // Add your change password logic here
    console.log('Change password clicked');
  };

  const handleDeleteAccount = () => {
    // Add your delete account logic here
    console.log('Delete account clicked');
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center z-[9999] p-4 font-figtree overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-end p-4 pb-0 sticky top-0 bg-white z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="flex items-center justify-center px-6 pb-6">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-xl font-semibold">
                  {getUserInitials(formData.fullName || user?.name || 'User')}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleChangePicture}
                className="px-4 py-2 bg-[#AFDCFF] text-[#3D3C96] border border-[#3D3C96] rounded-full text-sm font-medium transition-colors"
              >
                Change picture
              </button>
              <button
                onClick={handleDeletePicture}
                className="p-2 border border-[#FF4D4D] text-[#FF4D4D] rounded-full  transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-base font-semibold text-[#666666] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] text-black font-semibold text-base rounded-lg focus:ring-2 focus:ring-[#3D3C96] focus:border-transparent outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-base font-semibold text-[#666666] mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] text-black font-semibold text-base rounded-lg focus:ring-2 focus:ring-[#3D3C96] focus:border-transparent outline-none transition-all"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-base font-semibold text-[#666666] mb-2">
              Email id
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 text-black font-semibold text-base rounded-lg focus:ring-2 focus:ring-[#3D3C96] focus:border-transparent outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-base font-semibold text-[#666666] mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-[#CCCCCC] text-black font-semibold text-base rounded-lg focus:ring-2 focus:ring-[#3D3C96] focus:border-transparent outline-none transition-all"
              placeholder="Enter your location"
            />
          </div>

          {/* Change Password */}
          <button
            onClick={handleChangePassword}
            className="w-full flex items-center justify-between px-4 py-3 border border-[#CCCCCC] rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className="text-black text-base font-semibold">Change Password</span>
            <ArrowRight
              size={20}
              className="text-black text-base font-semibold"
            />
          </button>
        </div>

        {/* Delete Account Button */}
        <div className="p-6">
          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-3 bg-[#F0F0F0] text-[#FF4D4D] rounded-lg font-semibold text-base transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;