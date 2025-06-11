import React, { useState } from 'react';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import pravasiLogo from '../../assets/images/pravasi-logo.png';
import SignupModal from '../SignUpModal';
import LoginModal from '../LoginModal';
import ProfileModal from '../ProfileModal'; // Import the ProfileModal
import CreditCardIcon from '../../assets/icons/CreditCardIcon';

const Header = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState({
    name: 'Godzilla D.White',
    email: 'godzillaDwhite@gmail.com',
    phone: '+91 832487778',
    location: 'Kochi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  });

  const navItems = [
    { name: 'Home', href: '/', active: true },
    { name: 'How It Works', href: '#' },
    { name: 'FAQs', href: '#' },
    { name: 'Contact Us', href: '#' },
  ];

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleSignupClick = () => {
    setIsSignupModalOpen(true);
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLogoClick = () => {
    onNavigate('home');
  };

  const handleShopRegistrationClick = () => {
    onNavigate('shop-registration');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser({ name: '', email: '', phone: '', location: '', avatar: null });
    setIsUserMenuOpen(false);
    setIsProfileModalOpen(false);
    // Add your logout logic here (clear tokens, redirect, etc.)
  };

  const handleManageCardClick = () => {
    setIsUserMenuOpen(false);
  };

  // Handle profile click - open modal and close dropdown
  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsUserMenuOpen(false); // Close the dropdown when opening modal
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Get user initials for fallback avatar
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-999">
        <div className="pr-5">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button onClick={handleLogoClick} className="flex items-center">
                <img
                  src={pravasiLogo}
                  alt="Pravasi Logo"
                  className="h-30 w-auto cursor-pointer"
                />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.active
                      ? 'text-[#3D3C96] border-b-2 border-[#3D3C96] pb-1'
                      : 'text-black hover:text-[#3D3C96]'
                  } font-semibold transition-colors duration-200 font-figtree`}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right side - Help | Login/Signup or User Avatar */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-black font-figtree">Help</span>
              <span className="text-black">|</span>

              {isLoggedIn ? (
                // User Avatar and Dropdown
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-black hover:text-[#3D3C96] transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-xs font-semibold">
                          {getUserInitials(user.name)}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute font-figtree right-0 mt-2 w-72 bg-[#F3F3F3] rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      {/* User Info Section - Clickable to open profile modal */}
                      <button
                        onClick={handleProfileClick}
                        className="w-full px-6 pt-4 pb-2 border-b border-[#DDDBDB] hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-sm font-semibold">
                                {getUserInitials(user.name)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-black truncate">
                              {user.name}
                            </p>
                            <p className="text-xs font-normal text-[#A8A8A8] truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={handleManageCardClick}
                          className="flex items-center space-x-3 border-b border-[#DDDBDB] w-full px-6 py-2 text-black group hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors">
                            <CreditCardIcon />
                          </div>
                          <span className="font-medium text-sm">Manage Card</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-6 py-2 text-[#EA4335] group hover:bg-red-50 transition-colors"
                        >
                          <div className="w-8 h-8 rotate-180 flex items-center justify-center rounded-lg">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M16 17L21 12L16 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M21 12H9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Login/Signup buttons
                <button className="flex items-center space-x-2 text-black hover:text-[#3D3C96] transition-colors">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg
                      width="24"
                      height="25"
                      viewBox="0 0 24 25"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_214_68)">
                        <path
                          d="M16.5 11C16.5 13.49 14.49 15.5 12 15.5C9.51 15.5 7.5 13.49 7.5 11C7.5 8.51 9.51 6.5 12 6.5C14.49 6.5 16.5 8.51 16.5 11Z"
                          fill="black"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M24 12.5C24 19.13 18.63 24.5 12 24.5C5.37 24.5 0 19.13 0 12.5C0 5.87 5.37 0.5 12 0.5C18.63 0.5 24 5.87 24 12.5ZM6 21.125C6.24 20.726 8.565 17 11.985 17C15.39 17 17.73 20.735 17.97 21.125C19.3648 20.1605 20.5044 18.8716 21.2909 17.3692C22.0774 15.8668 22.4872 14.1958 22.485 12.5C22.485 6.695 17.79 2 11.985 2C6.18 2 1.485 6.695 1.485 12.5C1.485 16.07 3.27 19.235 6 21.125Z"
                          fill="black"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_214_68">
                          <rect
                            width="24"
                            height="24"
                            fill="white"
                            transform="translate(0 0.5)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span className="font-figtree flex items-center space-x-2">
                    <button onClick={handleLoginClick}>Login</button>/
                    <button onClick={handleSignupClick} className="ml-2">
                      Signup
                    </button>
                  </span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.active ? 'text-blue-600' : 'text-gray-600'
                    } font-medium`}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 border-t">
                  <button
                    onClick={handleShopRegistrationClick}
                    className="w-[159px] h-[35px] border-[#D5D5D5] border px-4 py-2 rounded-full transition-colors font-figtree text-sm font-medium mb-4"
                  >
                    Shop Registration
                  </button>

                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Help</span>
                    <span className="text-black">|</span>

                    {isLoggedIn ? (
                      // Mobile User Info - Clickable to open profile modal
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={handleProfileClick}
                          className="flex items-center space-x-3 text-left"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-xs font-semibold">
                                {getUserInitials(user.name)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-700">
                            {user.name}
                          </span>
                        </button>
                        <div className="flex flex-col space-y-2 ml-11">
                          <button
                            onClick={handleManageCardClick}
                            className="text-left text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            Manage Card
                          </button>
                          <button
                            onClick={handleLogout}
                            className="text-left text-red-600 hover:text-red-700 transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Mobile Login/Signup
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleLoginClick}
                          className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          Login
                        </button>
                        <span>/</span>
                        <button
                          onClick={handleSignupClick}
                          className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          Signup
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={handleCloseSignupModal}
        onSwitchToLogin={handleLoginClick}
      />
      
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToSignup={handleSignupClick}
      />
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={user}
        onLogout={handleLogout}
        getUserInitials={getUserInitials}
      />
    </>
  );
};

export default Header;