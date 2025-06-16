// PrivilegeCard.jsx
import React from 'react';

const PrivilegeCard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white rounded-md p-6">
      <div className="text-center">
        <h2 className="text-xl font-medium text-black mb-1">
          Payment successful..!{' '}
          <span role="img" aria-label="emoji">
            🔔
          </span>{' '}
          Your discount card is now active
        </h2>
        <p className="text-gray-500 mb-6">
          Thank you for joining the smart discounts network, your card is ready
          to use at partner shops.
        </p>

        {/* Card Box */}
        <div className="bg-white shadow-lg rounded-xl p-6 w-[340px] mx-auto mb-6">
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <img
                src="https://via.placeholder.com/80x20?text=PRAVASI"
                alt="logo"
                className="h-5"
              />
              <span className="text-sm font-semibold text-gray-700">
                PRAVASI PREVILAGE CARD
              </span>
            </div>

            <div className="h-5 w-6 bg-gray-400 rounded-sm mb-4"></div>

            <div className="text-2xl font-mono tracking-widest text-indigo-900 mb-3">
              1457-8321-0981-0000
            </div>

            <div className="flex justify-between text-sm text-gray-800 mb-3">
              <span>Mick Gardy</span>
              <span>12/4</span>
            </div>

            <div className="bg-indigo-900 text-white text-sm py-2 px-4 rounded-b-xl flex justify-between items-center">
              <span>www.discountcard.com</span>
              <span className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="accent-white"
                />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Activate Now Button */}
        <button className="bg-blue-200 text-blue-900 font-medium py-2 px-6 rounded-md hover:bg-blue-300 transition">
          Activate Now
        </button>

        <p className="text-xs text-gray-400 mt-3">
          your card is protected and uniquely linked to your account, Do not
          share card ID with others.
        </p>

        <div className="mt-6">
          <h3 className="font-semibold text-black">Where to use your card</h3>
          <p className="text-gray-600">
            Start saving today..! Explore shops that accept your card
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivilegeCard;
