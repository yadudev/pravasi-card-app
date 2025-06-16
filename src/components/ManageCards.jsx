import React from 'react';

const ManageCards = () => {
  return (
    <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto shadow-lg font-sans">
      <div className="relative mb-6">
        <h2 className="text-2xl font-semibold">Manage Your Privilege Card</h2>
        <p className="text-gray-500 mt-1">
          Track your card status, activate, renew, or view usage history all in
          one place.
        </p>
        <button className="absolute top-0 right-0 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full text-sm font-medium transition">
          Activate Now
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between font-semibold text-sm mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Pravasi_logo.svg/2560px-Pravasi_logo.svg.png"
              alt="Logo"
              className="h-6"
            />
            <span>PRAVASI PREVILAGE CARD</span>
          </div>
          <div className="text-lg font-mono tracking-widest mb-4">
            1457-8321-0981-0000
          </div>
          <div className="flex justify-between text-sm font-medium text-gray-800">
            <span>Mick Gardy</span>
            <span>12/4</span>
          </div>
          <div className="bg-indigo-900 text-white text-center text-sm py-2 mt-4 rounded-md">
            www.discountcard.com
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="bg-gray-100 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Validity</p>
            <p className="text-base font-semibold">June 1 – June 30</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Time Left</p>
            <p className="text-base font-semibold">12 Days Remaining</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Usage Count</p>
            <p className="text-base font-semibold">3 redemptions</p>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-full font-medium text-sm transition">
            Renew Now →
          </button>
          <p className="text-xs text-gray-500">
            Click to extend your card validity for the next 30 days.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Redemption History</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-md" />
              <div>
                <p className="font-semibold text-sm">Nature's Basket</p>
                <p className="text-xs text-gray-500">May 20 · Thrissur</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-sm font-semibold py-1 px-3 rounded-full">
              20% OFF
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-md" />
              <div>
                <p className="font-semibold text-sm">Max Fashion</p>
                <p className="text-xs text-gray-500">May 20 · Thrissur</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-sm font-semibold py-1 px-3 rounded-full">
              15% OFF
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-md" />
              <div>
                <p className="font-semibold text-sm">Nature's Basket</p>
                <p className="text-xs text-gray-500">May 17 · Thrissur</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-sm font-semibold py-1 px-3 rounded-full">
              20% OFF
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-md" />
              <div>
                <p className="font-semibold text-sm">Lakmé Salon</p>
                <p className="text-xs text-gray-500">May 16 · Thrissur</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-sm font-semibold py-1 px-3 rounded-full">
              25% OFF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCards;
