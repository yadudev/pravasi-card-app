import React, { useEffect, useState } from 'react';
import LoyaltyCard from './cards/LoyaltyCard';
import { formatCardExpiry, formatCardNumber, usersAPI } from '../services/api';

const DiscountCard = ({ isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isOpen]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(300); // reset timer each time modal opens
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cardResponse] = await Promise.all([usersAPI.getUserCardDetails()]);
      setCardDetails(cardResponse.data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBackdropClick = (e) => {
    // Close modal when clicking on backdrop (only if not submitting)
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h1 className="text-xl font-semibold text-gray-800 text-center">
          Your Discount Card is Now Active – Valid for 5 Minutes!
        </h1>
        <p className="text-sm text-gray-500 mt-1 text-center">
          Thank you..! Your discount card has been successfully activated and is
          now ready for use at all participating shops.
        </p>

        <div className="my-4">
          <LoyaltyCard
            cardNumber={
              cardDetails?.card?.cardNumber &&
              formatCardNumber(cardDetails.card.cardNumber)
            }
            website="www.discountcard.com"
            cardholderName={cardDetails?.user?.fullName}
            expiryDate={
              cardDetails?.card?.expiresAt &&
              formatCardExpiry(cardDetails.card.expiresAt)
            }
            className="shadow-gray-200 shadow-2xl"
            showAnimation={true}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-700">Time Remaining:</p>
          <div className="inline-block mt-1 bg-gray-100 text-indigo-900 px-4 py-2 rounded-md text-lg font-semibold">
            {formatTime(timeLeft)}
          </div>
        </div>

        <ul className="text-xs text-gray-500 mt-4 list-disc list-inside text-left">
          <li>This card will expire automatically after 5 minutes.</li>
          <li>Use this card at any partnered shop before the time runs out!</li>
        </ul>

        {error && (
          <p className="text-red-500 mt-3 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default DiscountCard;
