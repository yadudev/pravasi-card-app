import React, { useState, useEffect, useRef } from 'react';

const OTPModal = ({
  isOpen,
  onClose,
  onVerify,
  onResend,
  userPhone,
  userName,
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(116);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setTimer(116);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, timer]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      onVerify(otpCode);
    } else {
      alert('Please enter the complete 4-digit OTP');
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(116);
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
    onResend();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] font-figtree">
      <div className="relative rounded-3xl bg-white shadow-2xl max-w-lg w-full p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Enter OTP to Activate Your Card
          </h2>

          <p className="text-[#989898] text-base mb-8 leading-relaxed">
            We’ve sent an OTP to your email. Please enter the code below to
            activate your card
          </p>

          {/* OTP Inputs */}
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

          <div className="text-[#989898] text-left text-base ml-18 font-medium mb-8">
            {formatTimer(timer)}
          </div>

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

          <p className="text-[#989898] text-sm font-normal">
            Didn't receive the OTP?
            <button
              onClick={handleResend}
              disabled={timer > 0}
              className={`font-bold hover:underline ml-1 ${
                timer > 0 ? 'text-gray-400 cursor-not-allowed' : ''
              }`}
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
