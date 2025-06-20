import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import pravasiLogo from '../../assets/images/pravasi-logo.png';
import LoginModal from '../LoginModal';
import ProfileModal from '../ProfileModal';
import CreditCardIcon from '../../assets/icons/CreditCardIcon';
import ActivateModal from '../ActivateModal';
import SignupModal from '../SignupModal';
import { useAuth } from '../../constants/AuthContext';
import ManageCardsModal from '../ManageCardsModal';
import OTPModal from '../OTPModal';
import DiscountCard from '../DiscountCard';
import { usersAPI } from '../../services/api';
import PrivilegeCard from '../PrivilegeCard';

const Header = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isManageCardsModalOpen, setIsManageCardsModalOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPrivilegeCardModalOpen, setIsPrivilegeCardModalOpen] =
    useState(false);
  const navItems = [
    {
      name: 'Home',
      section: 'home',
      active: activeSection === 'home',
      href: '/',
    },
    {
      name: 'How It Works',
      section: 'how-it-works',
      active: activeSection === 'how-it-works',
      href: '/#how-it-works',
    },
    {
      name: 'FAQs',
      section: 'faqs',
      active: activeSection === 'faqs',
      href: '/#faqs',
    },
    {
      name: 'Contact Us',
      section: 'contact-us',
      active: activeSection === 'contact-us',
      href: '/#contact-us',
    },
  ];

  // Function to scroll to a specific section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  const handleClosePrivilegeCardModal = () => {
    setIsPrivilegeCardModalOpen(false);
  };

  const handleNavClick = (e, section) => {
    e.preventDefault();

    if (section === 'home') {
      // For home, navigate to the route and scroll to top
      if (onNavigate) {
        onNavigate('home'); // This handles route navigation
      }
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      setActiveSection('home');
      setIsMenuOpen(false); // Close mobile menu if open
    } else {
      // For other sections, scroll to the specific section
      scrollToSection(section);
    }
  };

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
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    setActiveSection('home');
    onNavigate('home');
  };

  const handleShopRegistrationClick = () => {
    onNavigate('shop-registration');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      setIsProfileModalOpen(false);
      if (onNavigate) onNavigate('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleManageCardClick = () => {
    setIsUserMenuOpen(false);
    setIsManageCardsModalOpen(true);
  };

  const handleCloseManageCardsModal = () => {
    setIsManageCardsModalOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsUserMenuOpen(false);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Handle signup success - opens ActivateModal
  const handleSignupSuccess = (userId, userData) => {
    setNewUserData({
      id: userId,
      ...userData,
    });

    setShowProfileModal(true);
  };

  const handleProfileCreateSuccess = async (profileData) => {
    try {
      // Close the ActivateModal
      setShowProfileModal(false);

      // Update userData with the profile data
      setUserData({
        ...newUserData,
        ...profileData,
      });

      // Open Privilege card modal instead of OTP modal
      setIsPrivilegeCardModalOpen(true);
    } catch (error) {
      console.error('Error in profile create success:', error);
      // You might want to show an error message to the user
    }
  };

  const handleCloseProfileCreateModal = () => {
    setShowProfileModal(false);
    setNewUserData(null);
  };

  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Add intersection observer to update active section based on scroll position
  React.useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sections = ['home', 'how-it-works', 'faqs', 'contact-us'];
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  const handleCloseOTPModal = () => {
    setIsOTPModalOpen(false);
    setOtpSessionId(null);
  };

  const handleOTPResend = async () => {
    try {
      const response = await usersAPI.resendEmailOTP({
        email: userData.email,
        sessionId: otpSessionId,
      });

      if (response.success) {
        setOtpSessionId(response.data.sessionId);
        console.log('Email OTP resent successfully to:', userData.email);
        return true;
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending Email OTP:', error);
      throw error;
    }
  };

  // OTP verification handler - opens DiscountCard on success
  const handleOTPVerify = async (otpCode) => {
    try {
      const response = await usersAPI.verifyEmailOTP({
        otp: otpCode,
        sessionId: otpSessionId,
        email: userData.email,
      });

      if (response.success) {
        // Close OTP modal and open discount card modal
        setIsOTPModalOpen(false);
        setOtpSessionId(null);
        setIsSuccessModalOpen(true);

        console.log('Card activation successful:', response);
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  };

  // Handler for closing success modal (DiscountCard)
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setIsManageCardsModalOpen(false);
    // Reset the flow
    setNewUserData(null);
  };

  // Handler for opening OTP modal from ManageCardsModal
  const handleOpenOTPModal = (sessionId) => {
    setOtpSessionId(sessionId);
    setIsOTPModalOpen(true);
    setIsManageCardsModalOpen(false);
  };

  const handleActivateCard = async () => {
    setIsLoginModalOpen(true);
    setIsPrivilegeCardModalOpen(false);
  };

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        console.log('User email:', parsedUser);
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
    }
  }, []);
  console.log({ isSuccessModalOpen });
  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
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
                  href={`${item.href}`}
                  onClick={(e) => handleNavClick(e, item.section)}
                  className={`${
                    item.active
                      ? 'text-[#3D3C96] border-b-2 border-[#3D3C96] pb-1'
                      : 'text-black hover:text-[#3D3C96]'
                  } font-semibold transition-colors duration-200 font-figtree cursor-pointer`}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right side - Help | Login/Signup or User Avatar */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-black font-figtree">Help</span>
              <span className="text-black">|</span>

              {isAuthenticated && user ? (
                // User Avatar and Dropdown
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-black hover:text-[#3D3C96] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-xs font-semibold">
                          {getUserInitials(user.fullName || user?.email)}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute font-figtree right-0 mt-2 w-72 bg-[#F3F3F3] rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[9999]">
                      <button
                        onClick={handleProfileClick}
                        className="w-full px-6 pt-4 pb-2 border-b border-[#DDDBDB] hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3D3C96] flex items-center justify-center text-white text-sm font-semibold">
                                {getUserInitials(user?.fullName || user?.email)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-black truncate">
                              {user?.fullName}
                            </p>
                            <p className="text-xs font-normal text-[#A8A8A8] truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="py-1">
                        <button
                          onClick={handleManageCardClick}
                          className="flex items-center space-x-3 border-b border-[#DDDBDB] w-full px-6 py-2 text-black group hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors">
                            <CreditCardIcon />
                          </div>
                          <span className="font-medium text-sm">
                            Manage Card
                          </span>
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
                    href={`#${item.section}`}
                    onClick={(e) => handleNavClick(e, item.section)}
                    className={`${
                      item.active ? 'text-blue-600' : 'text-gray-600'
                    } font-medium hover:text-blue-600 transition-colors`}
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

                    {isAuthenticated && user ? (
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
                                {getUserInitials(user?.fullName || user?.email)}
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

      {/* Modals */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={handleCloseSignupModal}
        onSwitchToLogin={handleLoginClick}
        onSignupSuccess={handleSignupSuccess}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToSignup={handleSignupClick}
        onSignupSuccess={handleSignupSuccess}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={userData}
        onLogout={handleLogout}
        getUserInitials={getUserInitials}
      />

      {/* ActivateModal - Updated to handle profile creation success */}
      {showProfileModal && newUserData && (
        <ActivateModal
          isOpen={showProfileModal}
          onClose={handleCloseProfileCreateModal}
          userId={newUserData.id}
          userData={newUserData}
          onProfileCreateSuccess={handleProfileCreateSuccess}
        />
      )}

      {/* ManageCardsModal with OTP modal props */}
      <ManageCardsModal
        isOpen={isManageCardsModalOpen}
        onClose={handleCloseManageCardsModal}
        user={userData}
        onOpenOTPModal={handleOpenOTPModal}
      />

      {/* Privilege Card Modal */}
      <PrivilegeCard
        isOpen={isPrivilegeCardModalOpen}
        onClose={handleClosePrivilegeCardModal}
        onActivate={handleActivateCard}
      />

      {/* OTP Modal */}
      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={handleCloseOTPModal}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        userPhone={userData?.phone}
        userName={userData?.name}
      />

      {/* Success Modal (DiscountCard) */}
      {isSuccessModalOpen && (
        <DiscountCard
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          title="Card Activated Successfully!"
          message="Your privilege card has been activated and is ready to use."
        />
      )}
    </>
  );
};

export default Header;
