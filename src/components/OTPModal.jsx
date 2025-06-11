import React, { useState, useEffect, useRef } from 'react';

const OTPModal = ({ isOpen, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(116); // 1:56 = 116 seconds
  const inputRefs = useRef([]);

  // Timer countdown effect
  useEffect(() => {
    if (isOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, timer]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Format timer as MM:SS
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      console.log('OTP Entered:', otpCode);
      // Add your verification logic here
      alert('OTP Verified Successfully!');
      onClose();
    } else {
      alert('Please enter complete OTP');
    }
  };

  const handleResendOTP = () => {
    setTimer(116); // Reset timer
    setOtp(['', '', '', '']); // Clear OTP
    inputRefs.current[0]?.focus(); // Focus first input
    console.log('Resending OTP...');
    // Add your resend OTP logic here
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="relative rounded-3xl bg-white shadow-2xl max-w-lg w-full p-8">
        {/* Modal Content */}
        <div className="text-center">
          {/* Title */}
          <h2 className="text-2xl font-semibold text-black mb-4">
            Enter OTP to Activate Your Card
          </h2>

          {/* Subtitle */}
          <p className="text-[#989898] text-base mb-8 leading-relaxed">
            We've sent an OTP to your email. Please enter the
            <br />
            code below to activate your card
          </p>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-4 mb-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-16 h-16 text-center text-xl font-semibold border border-[#222158] rounded-lg"
                maxLength="1"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-[#989898] text-left ml-18 text-base font-medium mb-8">
            {formatTimer(timer)}
          </div>

          {/* Verify Button */}
          <div
            className="w-full rounded-lg mt-8 p-[1px] mb-4"
            style={{
              background:
                'linear-gradient(92.38deg, #222158 -21.33%, rgba(34, 33, 88, 0) 149.35%)',
            }}
          >
            <button
              onClick={handleVerify}
              className="w-full bg-[#AFDCFF] text-[#222158] py-4 rounded-lg font-semibold text-base transition-colors duration-200"
            >
              Verify
            </button>
          </div>
          {/* Resend OTP Link */}
          <p className="text-[#989898] text-sm font-normal">
            Didn't receive the OTP?
            <button
              onClick={handleResendOTP}
              className="font-bold hover:underline ml-1"
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
