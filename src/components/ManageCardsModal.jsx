import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Loader2, X } from 'lucide-react';
import LoyaltyCard from './cards/LoyaltyCard';
import {
  calculateDaysRemaining,
  formatCardExpiry,
  formatCardNumber,
  formatDisplayDate,
  formatOtpPurpose,
  maskContactInfo,
  usersAPI,
} from '../services/api';

const ManageCardsModal = ({ isOpen, onClose, user, onOpenOTPModal }) => {
  const [cardDetails, setCardDetails] = useState(null);
  const [otpHistory, setOtpHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cardResponse, otpResponse] = await Promise.all([
        usersAPI.getUserCardDetails(),
        usersAPI.getOtpHistory({ limit: 4 }), // Get 4 recent OTPs to match UI grid
      ]);

      setCardDetails(cardResponse.data);
      setOtpHistory(otpResponse.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      await usersAPI.renewCard(1);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error renewing card:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle activation - send Email OTP
  const handleActivateClick = async () => {
    if (!user.email) {
      alert('Email not found. Please update your profile.');
      return;
    }

    setIsActivating(true);

    try {
      // Call API to send Email OTP
      const response = await usersAPI.sendEmailOTP({
        phone: user.phone,
        email: user.email,
        type: 'card_activation',
        name: user.name,
      });
      console.log({ response });
      if (response.success) {
        // Check if onOpenOTPModal function is provided
        if (onOpenOTPModal && typeof onOpenOTPModal === 'function') {
          onOpenOTPModal(response.data?.sessionId);
        } else {
          console.error('onOpenOTPModal function not provided');
          alert('OTP sent to your email. Please check your email.');
        }
        console.log('Email OTP sent successfully to:', user.email);
      } else {
        alert(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending Email OTP:', error);

      // Handle different types of errors
      if (error.message.includes('401')) {
        alert('Please log in to activate your card.');
      } else if (error.message.includes('403')) {
        alert('You do not have permission to activate card.');
      } else if (error.message.includes('429')) {
        alert('Too many OTP requests. Please try again later.');
      } else {
        alert(
          'Failed to send OTP. Please check your connection and try again.'
        );
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 font-figtree">
              Manage Your Privilege Card
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Track your card status, activate, renew, or view usage history all
              in one place.
            </p>
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleActivateClick}
              disabled={isActivating}
              className="bg-[#AFDCFF] text-[#3D3C96] py-2 px-4 border border-[#3D3C96] rounded-full text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                'Activate Now'
              )}
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Card Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div>
                <LoyaltyCard
                  cardNumber={
                    cardDetails &&
                    formatCardNumber(cardDetails?.card?.cardNumber)
                  }
                  website="www.discountcard.com"
                  cardholderName={cardDetails?.user?.fullName}
                  expiryDate={
                    cardDetails?.card?.expiresAt &&
                    formatCardExpiry(cardDetails?.card?.expiresAt)
                  }
                  className="shadow-gray-200 shadow-2xl"
                  showAnimation={true}
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Validity</p>
                  <p className="text-base font-semibold">
                    {cardDetails?.card?.createdAt &&
                    cardDetails?.card?.expiresAt
                      ? `${formatDisplayDate(cardDetails.card.createdAt)} – ${formatDisplayDate(cardDetails.card.expiresAt)}`
                      : ''}
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p className="text-base font-semibold">
                    {cardDetails?.card?.daysRemaining ||
                      calculateDaysRemaining(cardDetails?.card?.expiresAt)}{' '}
                    Days Remaining
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Usage Count</p>
                  <p className="text-base font-semibold">
                    {cardDetails?.activity?.recentTransactions} redemptions
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <button
                    className="font-semibold px-4 py-4 border-2 border-[#3D3C96] rounded-full shadow-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRenew}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2
                        size={20}
                        className="animate-spin text-[#222158]"
                      />
                    ) : (
                      <>
                        <span className="text-[#222158] font-semibold text-sm">
                          Renew Now
                        </span>
                        <ArrowUpRight size={20} className="text-[#222158]" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500">
                    Click to extend your card validity for the next 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* OTP Send History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">OTP Send History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                // Loading placeholders that match the UI
                <>
                  <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-md flex-shrink-0" />
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-md flex-shrink-0" />
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                  </div>
                </>
              ) : otpHistory.length > 0 ? (
                otpHistory.map((otp) => (
                  <div
                    key={otp.id}
                    className="flex items-center justify-between bg-gray-100 p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {otp.type === 'email' ? 'E' : 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {formatOtpPurpose(otp.purpose)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDisplayDate(otp.sentAt)} ·{' '}
                          {maskContactInfo(otp.contactInfo)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold py-1 px-3 rounded-full ${getStatusColor(otp.status)}`}
                    >
                      {otp.status.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-center py-2 mb-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gray-400 text-xl">📱</span>
                  </div>
                  <p>No OTP history found</p>
                  <p className="text-xs mt-1">
                    OTP history will appear here when you verify your phone or
                    email
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageCardsModal;
