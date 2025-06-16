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

        <div className="bg-white rounded-xl shadow-md border mt-6 p-5 relative">
          <div className="flex justify-between items-start">
            <img src={'/pravasi-logo.png'} alt="Logo" className="h-15" />
            <span className="text-sm font-medium text-gray-700">
              PRAVASI PREVILAGE CARD
            </span>
          </div>

          <div className="flex justify-start items-center mt-4">
            <div className="w-10 h-8 bg-gray-300 rounded-sm mr-4"></div>
            <span className="text-lg font-mono tracking-widest text-gray-800">
              1457-8321-0981-0000
            </span>
          </div>

          <div className="flex justify-between text-sm text-gray-700 mt-2">
            <span>Mick Gardy</span>
            <span>12/4</span>
          </div>

          <div className="bg-indigo-900 text-white rounded-b-xl mt-4 px-4 py-2 flex justify-between items-center">
            <a href="https://www.discountcard.com" className="text-sm">
              www.discountcard.com
            </a>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
              <span className="text-sm">Active</span>
            </div>
          </div>
        </div>

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
