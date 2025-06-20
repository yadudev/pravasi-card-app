import React, { useEffect, useState } from 'react';
import LoyaltyCard from './cards/LoyaltyCard';
import { usersAPI, formatCardNumber, formatCardExpiry } from '../services/api';

const PrivilegeCard = ({ isOpen, onClose, onActivate }) => {
  const handleBackdropClick = (e) => {
    // Close modal when clicking on backdrop (only if not activating)
    if (e.target === e.currentTarget && !isActivating) {
      onClose();
    }
  };

  const handleActivateClick = async () => {
    onActivate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 relative">
        <div className="text-center">
          <h2 className="text-xl font-medium text-black mb-1">
            Payment successful..!{' '}
            <span role="img" aria-label="emoji">
              🔔
            </span>{' '}
            Your discount card is now active
          </h2>
          <p className="text-gray-500 mb-6">
            Thank you for joining the smart discounts network, your card is
            ready to use at partner shops.
          </p>

          {/* Loyalty Card */}
          <div className="my-4">
            <LoyaltyCard />
          </div>

          {/* Action Button */}
          <button
            className="bg-blue-200 text-blue-900 font-medium py-2 px-6 rounded-md hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleActivateClick}
          >
            Login Now
          </button>

          {/* Note */}
          <p className="text-xs text-gray-400 mt-3">
            Your card is protected and uniquely linked to your account. Do not
            share your card ID with others.
          </p>

          {/* Where to Use */}
          <div className="mt-6">
            <h3 className="font-semibold text-black">Where to use your card</h3>
            <p className="text-gray-600">
              Start saving today..! Explore shops that accept your card.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivilegeCard;
