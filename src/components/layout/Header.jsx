import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import pravasiLogo from '../../assets/images/pravasi-logo.png';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onNavigate }) => {
  //const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/', active: true },
    { name: 'How It Works', href: '#' },
    { name: 'FAQs', href: '#' },
    { name: 'Contact Us', href: '#' },
  ];

  const handleLoginClick = () => {
    onNavigate('login');
  };

  const handleLogoClick = () => {
    onNavigate('home');
  };

  return (
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

          {/* Right side - Help | Login/Signup */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-black font-figtree">Help</span>
            {/* Pipe separator */}
            <span className="text-black">|</span>
            <button className="flex items-center space-x-2 text-black hover:text-[#3D3C96] transition-colors">
              {/* Profile/Avatar icon - standard person silhouette */}
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  width="24"
                  height="25"
                  viewBox="0 0 24 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_214_68)">
                    <path
                      d="M16.5 11C16.5 13.49 14.49 15.5 12 15.5C9.51 15.5 7.5 13.49 7.5 11C7.5 8.51 9.51 6.5 12 6.5C14.49 6.5 16.5 8.51 16.5 11Z"
                      fill="black"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
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
              <span className="font-figtree">
                <button onClick={handleLoginClick} className="flex items-center">
                  Login / Signup
                </button>
              </span>
            </button>
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
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">Help</span>
                  <span className="text-black">|</span>
                  <button className="flex items-center space-x-2 text-gray-700">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span>Login / Signup</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
