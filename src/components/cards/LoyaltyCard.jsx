import React from 'react';
import pravasiLogo from '../../assets/images/pravasi-logo.png';
import PrivilegeCardSVG from '../../assets/PrivilegeCardSVG';

const LoyaltyCard = ({
  cardNumber = '1457-8321-0981-0000',
  website = 'www.discountcard.com',
  cardholderName = 'Mick Gardy',
  expiryDate = '12/4',
  className = '',
  showAnimation = true,
}) => {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-md
        max-w-md
        w-full
        mx-auto
        overflow-hidden
        font-figtree
        ${showAnimation ? 'transform hover:scale-105 transition-transform duration-300' : ''}
        ${className}
      `}
    >
      {/* White top section with header and card details */}
      <div className="bg-white pb-2">
        <div className="flex justify-between items-start mb-4">
          {/* Left: Logo */}
          <div>
            <img src={pravasiLogo} alt="Pravasi Logo" className="h-15 w-auto" />
          </div>

          {/* Right: Title */}
          <div className="text-base font-semibold mr-4 text-gray-700 text-right pt-5">
            PRAVASI PRIVILEGE CARD
          </div>
        </div>

        {/* Chip icon */}
        <div className="mb-4 ml-6">
          <PrivilegeCardSVG />
        </div>

        {/* Card Number */}
        <div className="text-center mb-3">
          <div className="text-4xl font-graduate text-[#222158] font-medium tracking-wider">
            {cardNumber}
          </div>
        </div>

        {/* Cardholder details */}
        <div className="flex justify-between items-center ml-6">
          <div className="flex gap-4">
            <div className="text-base font-semibold text-[#222158]">
              {cardholderName}
            </div>
            <div className="text-base font-semibold text-[#222158]">
              {expiryDate}
            </div>
          </div>
        </div>
      </div>

      {/* Purple middle section with website */}
      <div className="bg-[#3D3C96] text-white text-center py-3 font-medium text-base">
        {website}
      </div>

      {/* White bottom section */}
      <div className="bg-white h-6">{/* Empty white space at bottom */}</div>
    </div>
  );
};

export default LoyaltyCard;
