// LoginPage.jsx - Updated with gradient divider and fixes
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

// Import reusable components (no Layout needed)
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import pravasiLogo from '../assets/images/pravasi-logo.png';
import FacebookIcon from '../assets/icons/FacebookIcon';
import GoogleIcon from '../assets/icons/GoogleIcon'; // Fixed typo: was GoogleIon
import AppleIcon from '../assets/icons/AppleIcon';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLogin, setIsLogin] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
  };

  const handleBackClick = () => {
    // Simple navigation back to home
    window.history.back();
    // Or if you want to go to home specifically:
    // window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white font-figtree">
      {/* Main Login Section */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Main Card Container */}
          <div className="bg-[#F5F5F5] rounded-3xl border-white border-4 shadow-2xl">
            {/* Header with Back Button and Logo */}
            <div className="flex items-center justify-between mb-8">
              {/* Back Button */}
              <button
                onClick={handleBackClick}
                className="flex items-center text-black hover:text-gray-800 transition-colors pl-6"
              >
                <ArrowLeft size={30} />
              </button>

              {/* Pravasi Logo */}
              <img
                src={pravasiLogo}
                alt="Pravasi Logo"
                className="h-25 w-auto cursor-pointer"
                onClick={() => (window.location.href = '/')}
              />
            </div>

            {/* Title and Subtitle */}
            <div className="text-center mb-8 ">
              <h1 className="text-3xl font-bold text-black mb-2">
                {isLogin ? 'Login or Sign up' : 'Create Account'}
              </h1>
              <p className="text-[#707070] text-sm">
                We will send an OTP to verify
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6 px-6">
              {/* Facebook Button */}
              <button
                onClick={() => handleSocialLogin('Facebook')}
                className="flex items-center justify-center p-3 border border-[#707070] rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <FacebookIcon width={30} height={30} fill="#1877F2" />
              </button>

              {/* Google Button */}
              <button
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center p-3 border border-[#707070] rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <GoogleIcon width={30} height={30} />
              </button>

              {/* Apple Button */}
              <button
                onClick={() => handleSocialLogin('Apple')}
                className="flex items-center justify-center p-3 border border-[#707070] rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <AppleIcon width={30} height={30} fill="#000000" />
              </button>
            </div>

            {/* Divider with Linear Gradient */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center px-6">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#222158] to-transparent"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F5F5F5] text-[#707070] font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Email/Phone Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
              <div>
                <input
                  name="email"
                  placeholder="Enter mobile number or email"
                  type="text"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#707070] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-[#707070] text-gray-900"
                />
              </div>

              <div className="text-sm text-[#707070] text-justify leading-relaxed">
                By continuing, you agree to Pravasi Privilege's{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  terms & conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  privacy policy
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-[#222158] hover:bg-indigo-800 text-white py-3 rounded-xl font-bold text-3xl"
              >
                Continue
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
