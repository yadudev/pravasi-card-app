import React, { useEffect, useState } from 'react';

const DiscountCard = () => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-800">
          Your Discount Card is Now Active – Valid for 5 Minutes!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Thank you..! Your discount card has been successfully activated and is
          now ready for use at all participating shops.
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

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">Time Remaining:</p>
          <div className="inline-block mt-1 bg-gray-100 text-indigo-900 px-4 py-2 rounded-md text-lg font-semibold">
            {formatTime(timeLeft)}
          </div>
        </div>

        <ul className="text-xs text-gray-500 mt-4 list-disc list-inside text-left">
          <li>This card will expire automatically after 5 minutes.</li>
          <li>Use this card at any partnered shop before the time runs out!</li>
        </ul>
      </div>
    </div>
  );
};

export default DiscountCard;
