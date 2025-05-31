// Footer.jsx - Fixed version
import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import SocialLinks from '../ui/SocialLinks';
import pravasiLogo from '../../assets/images/pravasi-logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#222158] text-white py-16 px-6 relative overflow-hidden font-figtree">
      {/* Decorative eclipse shapes - responsive */}
      {/* Top-right eclipse */}
      <div className="absolute -top-8 -right-8 md:-top-0 md:-right-0">
        <svg
          width="209"
          height="191"
          viewBox="0 0 209 191"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M292.663 146.913C215.126 211.278 101.841 202.707 39.6349 127.771C-22.5713 52.8339 -10.1432 -60.0923 67.3938 -124.457C144.931 -188.822 258.215 -180.252 320.422 -105.315C382.628 -30.3783 370.2 82.548 292.663 146.913ZM99.2509 -86.0806C43.644 -39.9204 34.7311 41.0662 79.3432 94.8082C123.955 148.55 205.199 154.696 260.806 108.536C316.412 62.3761 325.325 -18.6106 280.713 -72.3525C236.101 -126.095 154.858 -132.241 99.2509 -86.0806Z"
            fill="url(#paint0_linear_214_98)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_214_98"
              x1="292.663"
              y1="146.913"
              x2="67.3938"
              y2="-124.457"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0066B5" stopOpacity="0.5" />
              <stop offset="1" stopColor="#222158" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom-left eclipse */}
      <div className="absolute -bottom-8 -left-8 md:-bottom-2 md:-left-2">
        <svg
          width="314"
          height="198"
          viewBox="0 0 314 198"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M245.663 314.913C168.126 379.278 54.8412 370.707 -7.36505 295.771C-69.5713 220.834 -57.1432 107.908 20.3938 43.5428C97.9309 -20.822 211.215 -12.2518 273.422 62.685C335.628 137.622 323.2 250.548 245.663 314.913ZM52.2509 81.9194C-3.35596 128.08 -12.2689 209.066 32.3432 262.808C76.9553 316.55 158.199 322.696 213.806 276.536C269.412 230.376 278.325 149.389 233.713 95.6475C189.101 41.9055 107.858 35.7592 52.2509 81.9194Z"
            fill="url(#paint0_linear_480_520)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_480_520"
              x1="245.663"
              y1="314.913"
              x2="20.3938"
              y2="43.5428"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0066B5" stopOpacity="0.5" />
              <stop offset="1" stopColor="#222158" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Navigation */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-4 md:gap-8 text-white text-sm md:text-base">
            <a href="#" className="hover:text-[#AFDCFF] transition-colors">
              Home
            </a>
            <a href="#" className="hover:text-[#AFDCFF] transition-colors">
              Categories
            </a>
            <a href="#" className="hover:text-[#AFDCFF] transition-colors">
              Apply for Card
            </a>
            <a href="#" className="hover:text-[#AFDCFF] transition-colors">
              FAQ
            </a>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-8 lg:mb-16">
          {/* Left side - Contact Info */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#AFDCFF]">
              Let's talk
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-white mb-6 lg:mb-8">
              Ask us anything on Pravasi Privilege...
            </p>
            <div className="mb-6 lg:mb-8">
              <h3 className="text-base lg:text-lg font-semibold mb-4">
                Follow us:
              </h3>
              <SocialLinks variant="light" />
            </div>
          </div>

          {/* Right side - Contact Form */}
          <Card className="w-full">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
              {/* Left Side: Text */}
              <div className="flex flex-col justify-center text-[#222158] flex-1">
                <h3 className="text-xl md:text-2xl font-semibold mb-1">
                  Contact Us
                </h3>
                <p className="text-xs md:text-sm">
                  Have questions or need assistance? We're here to help.
                </p>
              </div>

              {/* Right Side: Logo */}
              <div className="flex-shrink-0">
                <img
                  src={pravasiLogo}
                  alt="Pravasi Logo"
                  className="h-28 -mt-8 w-auto object-contain"
                />
              </div>
            </div>

            <form className="space-y-4 md:space-y-6">
              <Input
                label="Email ID"
                placeholder="Enter your email address"
                type="email"
                required
                className="text-gray-600 text-sm w-full"
                style={{ border: '1px solid #222158' }}
                labelClassName="text-lg md:text-xl"
              />

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-[#222158] hover:bg-indigo-800 text-sm md:text-base py-3 md:py-4"
              >
                Subscribe
              </Button>
            </form>
          </Card>
        </div>

        {/* Copyright Section */}
        <div className="pt-2">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm md:text-base gap-4">
            <div className="text-white text-center md:text-left">
              © 2025 Pravasi Privilege Card. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4 text-white justify-center md:justify-end">
              <a href="#" className="hover:text-[#AFDCFF] transition-colors">
                Privacy Policy
              </a>
              <span className="hidden md:inline">|</span>
              <a href="#" className="hover:text-[#AFDCFF] transition-colors">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;