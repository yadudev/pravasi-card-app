import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  ArrowUpRight,
  Clock,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryIcon from '../assets/icons/CategoryIcon';
import BagBroken from '../assets/icons/BagBroken';
import EarthBroken from '../assets/icons/EarthBroken';
import KeyBroken from '../assets/icons/KeyBroken';
import CategoryCard from '../components/cards/CategoryCard';
import StepIndicator from '../components/ui/StepIndicator';
import LoyaltyCard from '../components/cards/LoyaltyCard';
import FeatureCard from '../components/cards/FeatureCard';
import FAQ from '../components/ui/FAQ';
import { usersAPI } from '../services/api';
import OTPModal from '../components/OTPModal';
import DiscountCard from '../components/DiscountCard';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // OTP related states
  const [isActivating, setIsActivating] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState(null);

  const [userData, setUserData] = useState({
    email: '',
    phone: '',
    name: '',
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Reverse geocoding to get location name
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const city =
                data.results[0].components.city ||
                data.results[0].components.town ||
                data.results[0].components.village;
              const state = data.results[0].components.state;
              setLocationName(`${city}, ${state}`);
            }
          } catch (error) {
            console.error('Error getting location name:', error);
            setLocationName('Current Location');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          email: parsedUser?.email || '',
          phone: parsedUser?.phone || '',
          name: parsedUser?.fullName || '',
        });
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
  }, []);

  const categories = [
    { name: 'Shopping', iconName: 'Shopping', color: 'bg-[#1C1061]' },
    { name: 'Healthcare', iconName: 'Healthcare', color: 'bg-[#0065B3]' },
    { name: 'Travel', iconName: 'Travel', color: 'bg-[#312F92]' },
    { name: 'Dining', iconName: 'Dining', color: 'bg-[#1A49A1]' },
    { name: 'Entertainment', iconName: 'Shopping', color: 'bg-[#1C1061]' },
    { name: 'Beauty', iconName: 'Healthcare', color: 'bg-[#0065B3]' },
    { name: 'Home & Living', iconName: 'Travel', color: 'bg-[#312F92]' },
    { name: 'Services', iconName: 'Dining', color: 'bg-[#1A49A1]' },
  ];

  const categoriesPerPage = 4;
  const totalPages = Math.ceil(categories.length / categoriesPerPage);

  const getCurrentCategories = () => {
    const startIndex = currentPage * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    return categories.slice(startIndex, endIndex);
  };

  useEffect(() => {
    const handleCategoryFromHomePage = () => {
      try {
        // First check navigation state
        if (location.state?.selectedCategory && location.state?.fromHomePage) {
          const { selectedCategory } = location.state;
          console.log('Category selected from HomePage:', selectedCategory);

          // Set the search query to the category name
          setSearchQuery(selectedCategory.name);

          // Find the category in the current categories array and set the page/index appropriately
          const categoryIndex = categories.findIndex(
            (cat) => cat.name === selectedCategory.name
          );
          if (categoryIndex !== -1) {
            const pageIndex = Math.floor(categoryIndex / categoriesPerPage);
            const categoryOnPage = categoryIndex % categoriesPerPage;

            setCurrentPage(pageIndex);
            setActiveCategory(categoryOnPage);
          }

          // Clear the navigation state to prevent re-triggering
          window.history.replaceState({}, document.title);
        }
        // Fallback to sessionStorage
        else {
          const storedCategory = sessionStorage.getItem('selectedCategory');
          if (storedCategory) {
            try {
              const selectedCategory = JSON.parse(storedCategory);
              console.log('Category from sessionStorage:', selectedCategory);

              setSearchQuery(selectedCategory.name);

              // Find the category and set appropriate page/index
              const categoryIndex = categories.findIndex(
                (cat) => cat.name === selectedCategory.name
              );
              if (categoryIndex !== -1) {
                const pageIndex = Math.floor(categoryIndex / categoriesPerPage);
                const categoryOnPage = categoryIndex % categoriesPerPage;

                setCurrentPage(pageIndex);
                setActiveCategory(categoryOnPage);
              }

              // Clear sessionStorage after using
              sessionStorage.removeItem('selectedCategory');
            } catch (error) {
              console.error('Error parsing stored category:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling category from HomePage:', error);
      }
    };

    handleCategoryFromHomePage();
  }, [location.state, categories, categoriesPerPage]);

  const nextCategory = () => {
    setCurrentPage((prevPage) => {
      const nextPage = (prevPage + 1) % totalPages;
      return nextPage;
    });
    setActiveCategory(0);
  };

  const prevCategory = () => {
    setCurrentPage((prevPage) => {
      const newPage = prevPage === 0 ? totalPages - 1 : prevPage - 1;
      return newPage;
    });
    setActiveCategory(0);
  };

  const handleCategoryClick = async (index) => {
    setActiveCategory(index);

    // Get the actual category from the current page
    const currentCategories = getCurrentCategories();
    const selectedCategory = currentCategories[index];

    if (selectedCategory) {
      // Set the search query and location
      const categoryQuery = selectedCategory.name;
      let searchLocation = selectedLocation;

      // Use current location if no location is selected
      if (!selectedLocation && userLocation && locationName) {
        searchLocation = locationName;
      }

      // Fallback to a default location if no location is available
      if (!searchLocation) {
        // Option 1: Use a default location (adjust as needed)
        searchLocation = 'Kochi, Kerala'; // Default location

        // Option 2: Or ask user to select location first
        // alert('Please select a location from the dropdown or allow location access to search by category');
        // return;

        console.log(
          'No location detected, using default location:',
          searchLocation
        );
      }

      setIsSearching(true);

      try {
        // Prepare search parameters for the backend API
        const searchParams = {
          search: categoryQuery.trim(),
          location: searchLocation,
          category: selectedCategory.name,
          latitude: userLocation?.lat || null, // Allow null if location not available
          longitude: userLocation?.lng || null, // Allow null if location not available
          maxDistance: 10, // Search within 10km
          sortBy: 'distance',
          sortOrder: 'ASC',
          page: 1,
          limit: 50,
        };

        console.log('Category Search Parameters:', searchParams);

        // Make API call using the usersAPI service
        const apiResponse = await usersAPI.searchShops(searchParams);

        console.log('Category API Response:', apiResponse);

        // Transform the response data
        const transformedShops = transformShopData(apiResponse);

        console.log('Category Transformed Shops:', transformedShops);

        // Prepare data for the results page
        const searchResults = {
          shops: transformedShops,
          pagination: apiResponse.pagination || {},
          searchMetadata: apiResponse.searchMetadata || {},
          totalResults:
            apiResponse.pagination?.totalRecords || transformedShops.length,
        };

        const searchParamsForResults = {
          query: categoryQuery,
          location: searchLocation,
          coordinates: userLocation || null, // Allow null if not available
          category: selectedCategory.name,
        };

        // Store search results and params for the results page
        sessionStorage.setItem(
          'searchParams',
          JSON.stringify(searchParamsForResults)
        );
        sessionStorage.setItem('searchResults', JSON.stringify(searchResults));

        // Navigate to search results page
        navigate('/search-results', {
          state: { searchParams: searchParamsForResults, searchResults },
        });
      } catch (error) {
        console.error('Category search failed:', error);

        // Handle different types of errors
        if (error.message.includes('401')) {
          alert('Please log in to search for shops.');
        } else if (error.message.includes('403')) {
          alert('You do not have permission to search shops.');
        } else if (error.message.includes('500')) {
          alert('Server error. Please try again later.');
        } else {
          alert('Search failed. Please check your connection and try again.');
        }
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Transform backend API response to frontend format
  const transformShopData = (apiResponse) => {
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
      return [];
    }

    return apiResponse.data.map((shop) => ({
      id: shop.id,
      name: shop.name || 'Unknown Shop',
      category: shop.category || 'general',
      address: shop.location?.address || 'Address not available',
      phone: shop.contact?.phone || 'Phone not available',
      email: shop.contact?.email || 'Email not available',
      rating: shop.rating?.average || 4.0,
      image:
        shop.images?.featured ||
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
      position: [
        shop.location?.coordinates?.latitude || 9.9312,
        shop.location?.coordinates?.longitude || 76.2673,
      ],
      discount: `${shop.discount?.percentage || 10}%`,
      description: shop.description || 'No description available',
      timing: shop.openingHours
        ? formatOpeningHours(shop.openingHours)
        : '9:00 AM - 9:00 PM',
      distance: shop.location?.distance || 'Distance not available',
      website: shop.contact?.website || '',
      amenities: shop.amenities || [],
      tags: shop.tags || [],
      isOpen: shop.isOpen || false,
      badges: shop.badges || [],
    }));
  };

  // Helper function to format opening hours
  const formatOpeningHours = (openingHours) => {
    if (typeof openingHours === 'string') {
      return openingHours;
    }
    if (typeof openingHours === 'object' && openingHours.monday) {
      return `${openingHours.monday} (Mon-Sun may vary)`;
    }
    return '9:00 AM - 9:00 PM';
  };

  const handleSearch = async () => {
    // Determine the search location
    let searchLocation = selectedLocation;

    // If no location is selected, use current location
    if (!selectedLocation && userLocation) {
      searchLocation = locationName || 'Current Location';
    }

    // Validate search input
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    if (!searchLocation) {
      alert('Please select a location or allow location access');
      return;
    }

    setIsSearching(true);

    try {
      // Prepare search parameters for the backend API
      const searchParams = {
        search: searchQuery.trim(),
        location: searchLocation,
        category: undefined,
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        maxDistance: 10, // Search within 10km
        sortBy: 'distance',
        sortOrder: 'ASC',
        page: 1,
        limit: 50,
      };

      console.log('Search Parameters:', searchParams);

      // Make API call using the usersAPI service
      const apiResponse = await usersAPI.searchShops(searchParams);

      console.log('API Response:', apiResponse);

      // Transform the response data
      const transformedShops = transformShopData(apiResponse);

      console.log('Transformed Shops:', transformedShops);

      // Prepare data for the results page
      const searchResults = {
        shops: transformedShops,
        pagination: apiResponse.pagination || {},
        searchMetadata: apiResponse.searchMetadata || {},
        totalResults:
          apiResponse.pagination?.totalRecords || transformedShops.length,
      };

      const searchParamsForResults = {
        query: searchQuery,
        location: searchLocation,
        coordinates: userLocation,
        category: categories[activeCategory]?.name || 'All',
      };

      // Store search results and params for the results page
      sessionStorage.setItem(
        'searchParams',
        JSON.stringify(searchParamsForResults)
      );
      sessionStorage.setItem('searchResults', JSON.stringify(searchResults));

      navigate('/search-results', {
        state: { searchParams: searchParamsForResults, searchResults },
      });
    } catch (error) {
      console.error('Search failed:', error);

      // Handle different types of errors
      if (error.message.includes('401')) {
        alert('Please log in to search for shops.');
      } else if (error.message.includes('403')) {
        alert('You do not have permission to search shops.');
      } else if (error.message.includes('500')) {
        alert('Server error. Please try again later.');
      } else {
        alert('Search failed. Please check your connection and try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for closing success modal
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    // Close the manage cards modal as well since activation is complete
  };

  // Handle activation - send Email OTP
  const handleActivateClick = async () => {
    if (!userData.email) {
      alert('Email not found. Please update your profile.');
      return;
    }

    setIsActivating(true);

    try {
      // Call API to send Email OTP
      const response = await usersAPI.sendEmailOTP({
        phone: userData.phone,
        email: userData.email,
        type: 'card_activation',
        name: userData.fullName,
      });
      if (response.success) {
        setOtpSessionId(response.data?.sessionId);
        setIsOTPModalOpen(true);
        console.log('Email OTP sent successfully to:', userData.email);
      } else {
        alert(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending SMS OTP:', error);

      // Handle different types of errors
      if (error.message.includes('401')) {
        alert('Please log in to activate your card.');
      } else if (error.message.includes('403')) {
        alert('You do not have permission to activate card.');
      } else if (error.message.includes('429')) {
        alert('Too many OTP requests. Please try again later.');
      } else {
        alert(
          'Failed to send OTP. Please check your connection and try again.'
        );
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleCloseOTPModal = () => {
    setIsOTPModalOpen(false);
    setOtpSessionId(null);
  };

  const handleOTPVerify = async (otpCode) => {
    try {
      const response = await usersAPI.verifyEmailOTP({
        otp: otpCode,
        sessionId: otpSessionId,
        email: userData.email,
      });

      if (response.success) {
        // Close OTP modal and open success modal
        setIsOTPModalOpen(false);
        setOtpSessionId(null);
        setIsSuccessModalOpen(true);

        console.log('Card activation successful:', response);
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error; // Re-throw to handle in modal
    }
  };

  // SMS OTP resend handler
  const handleOTPResend = async () => {
    try {
      const response = await usersAPI.resendEmailOTP({
        email: userData.email,
        sessionId: otpSessionId,
      });

      if (response.success) {
        setOtpSessionId(response.sessionId); // Update session ID if needed
        console.log('Email OTP resent successfully to:', userData.email);
        return true;
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending SMS OTP:', error);
      throw error; // Re-throw to handle in modal
    }
  };

  const locations = [
    'Mumbai, Maharashtra',
    'Delhi, Delhi',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
    'Kochi, Kerala',
    'Thiruvananthapuram, Kerala',
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Apply for Your Pravasi Previlage Card',
      description:
        'Fill out a simple form with your name, email, and your preferred discount category (e.g., Restaurants, Fashion, Groceries). Click "Apply Now" to submit your request for a loyalty card.',
    },
    {
      step: 2,
      title: 'SMS Verification with OTP',
      description:
        "Once you apply, you'll receive an SMS with a One-Time Password (OTP). Enter this OTP on the website to verify your identity and confirm your interest in the selected discount offer.",
    },
    {
      step: 3,
      title: 'Activate and Use Your Discount Card',
      description:
        'After OTP verification, your loyalty card will be issued with a countdown timer. Click "Activate Now" before the timer expires.',
    },
  ];

  const features = [
    {
      icon: BagBroken,
      title: 'Discounts in All the Right Places',
      description:
        "Whether you're visiting family, dining out, shopping for gifts, or looking for personal care services — our cards unlock special rates at top-rated restaurants, retail outlets, beauty salons, wellness centers, grocery stores, and much more.",
    },
    {
      icon: Clock,
      title: 'Time-Limited Offers That Add Real Value',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
    {
      icon: EarthBroken,
      title: 'Personalized Offers Based on Your Location & Needs',
      description:
        "Once you select a category (like food, shopping, or wellness), our platform shows you the most relevant offers near you. This way, you only see discounts that you'll actually use tailored for where you are and what you love.",
    },
    {
      icon: KeyBroken,
      title: 'Verified Cards & Secure Access Process',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
  ];

  const faqData = [
    {
      question: 'What is a Pravasi Previlage Discount Card?',
      answer:
        'The Pravasi Previlage Card is a digital loyalty card that provides exclusive discounts and offers at partner stores across various categories including shopping, dining, healthcare, and travel.',
    },
    {
      question: 'How do I get a discount card?',
      answer:
        'Simply fill out our application form with your details and preferred category, verify your phone number with the OTP we send, and your digital card will be issued immediately.',
    },
    {
      question: 'Why do I need to enter an OTP?',
      answer:
        'OTP verification ensures the security of your account and confirms that you have access to the phone number provided during registration.',
    },
    {
      question: 'How long is the card valid after activation?',
      answer:
        'Cards are typically valid for 12 months from the date of activation. You can check the exact expiry date in your digital card.',
    },
    {
      question: 'Can I reuse the same card?',
      answer:
        'Yes, once activated, you can use your card multiple times at any of our partner locations until it expires.',
    },
  ];

  const currentCategories = getCurrentCategories();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <div className="px-6 ml-4 py-8">
        <section className="bg-[#7AC3FB] py-24 px-6 relative overflow-hidden rounded-3xl">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-cyan-400/20"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="font-figtree text-4xl md:text-5xl font-bold mb-6 text-[#3D3C96]">
              Unlock Amazing Discounts with
              <br />
              Our Pravasi Previlage Card.
            </h1>
            {/* Subtitle */}
            <p className="text-[#222158] opacity-67 text-xl font-semibold mb-14 font-figtree">
              Find stores near you and enjoy exclusive discounts on shopping,
              <br />
              dining, wellness, and more.
            </p>
            {/* Search Form */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative border border-[#C7C7C7] rounded-2xl p-2">
                  <input
                    type="text"
                    placeholder="Search for shop, healthcare, travel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-0 rounded-xl placeholder-[#868686] placeholder-font-semibold 
             placeholder-text-sm"
                    disabled={isSearching}
                  />
                  <CategoryIcon
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    width={20}
                    height={20}
                  />
                </div>
                {/* Location Dropdown */}
                <div className="relative min-w-[250px] border border-[#C7C7C7] rounded-2xl p-2">
                  <MapPin
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border-0 rounded-xl cursor-pointer
              ${selectedLocation === '' ? 'text-[#868686] font-semibold text-sm' : 'text-black'}`}
                    disabled={isSearching}
                  >
                    <option value="" disabled>
                      Search Location...
                    </option>
                    {locations.map((location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-[#AFDCFF] text-[#222158] px-8 py-4 rounded-2xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 min-w-[140px] hover:bg-[#9DD0FF] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                  {isSearching ? 'Searching...' : 'Search Now'}
                </button>
              </div>
            </div>
            {/* CTA Section - matching the UI layout */}
            <div className="mx-4 md:mx-8 lg:mx-12 font-figtree">
              <div className="flex flex-col md:flex-row items-center justify-between mt-16">
                {/* Left text */}
                <div className="text-left mb-6 md:mb-0 flex-1">
                  <p className="text-xl text-[#222158] font-semibold">
                    Enjoy exclusive savings at your
                    <br />
                    favorite stores. Shop smart, save
                    <br />
                    big!
                  </p>
                </div>
                {/* Center button */}
                <div className="flex-shrink-0 mx-8">
                  <div
                    className="p-[2px] rounded-full"
                    style={{
                      background:
                        'linear-gradient(177.36deg, #222158 -13.59%, rgba(34, 33, 88, 0) 50.99%)',
                    }}
                  >
                    <button
                      className="bg-sky-300 hover:bg-sky-200 font-semibold px-12 py-4 rounded-full shadow-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleActivateClick}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <Loader2
                          size={20}
                          className="animate-spin text-[#222158]"
                        />
                      ) : (
                        <>
                          <span className="text-[#222158] font-semibold text-xl">
                            ACTIVATE
                          </span>
                          <ArrowUpRight
                            size={20}
                            className="text-[#222158] font-semibold text-xl"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {/* Right text */}
                <div className="text-right flex-1">
                  <div className="text-[#222158] font-semibold text-xl">
                    Activate & Save Instantly!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Categories Section */}
      <section className="py-16 px-6 ml-4 font-figtree">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Explore Partnered Categories & Brands
              </h2>
              <p className="text-[#707070] text-xl">
                Discover stores by category and use your Pravasi Privilege Card
                to unlock exclusive in-store benefits.
              </p>
            </div>
            {/* Enhanced Navigation buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={prevCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Previous categories"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={nextCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Next categories"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentCategories.map((category, index) => (
              <div
                key={`page-${currentPage}-${category.name}-${index}`}
                className="transform transition-all duration-300 ease-out"
                onClick={() => handleCategoryClick(index)}
              >
                <CategoryCard
                  category={category}
                  isActive={activeCategory === index}
                  onClick={() => handleCategoryClick(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 px-6 ml-4 font-figtree" id="how-it-works">
        <div className="max-w-7xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold mb-16 text-transparent bg-clip-text"
            style={{
              backgroundImage:
                'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            How It Works
          </h2>

          <StepIndicator
            steps={howItWorksSteps}
            currentStep={3}
            orientation="horizontal"
          />
        </div>
      </section>
      {/* Why Choose Section */}
      <div className="px-6 ml-4 mt-12 py-8">
        <section
          className="py-16 px-6 text-white relative rounded-3xl font-figtree"
          style={{
            background:
              'linear-gradient(181.2deg, #222158 1.03%, #0066B5 248.15%)',
          }}
        >
          {/* Decorative card elements */}
          <div className="absolute -top-38 -right-20 transform -rotate-28 z-50 scale-50">
            <LoyaltyCard
              className="rounded-xl [box-shadow:-4px_-4px_10px_rgba(0,0,0,0.1),4px_-4px_10px_rgba(0,0,0,0.1)]"
              showAnimation={false}
            />
          </div>
          <div className="absolute -bottom-48 -left-26 transform rotate-32 scale-50">
            <LoyaltyCard
              className="w-72 rounded-xl [box-shadow:-4px_4px_10px_rgba(0,0,0,0.1),4px_4px_10px_rgba(0,0,0,0.1)]"
              showAnimation={false}
            />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold mb-16 text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Why Choose Pravasi Privilege Card?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  variant="default"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
      {/* FAQ Section */}
      <div className="px-6 ml-4 mt-24 py-8" id="faq">
        <section className="py-16 px-6 bg-white font-figtree">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left side - FAQ Title */}
              <div className="max-w-sm">
                <h2
                  className="text-4xl md:text-5xl font-bold text-blue-400 mb-6"
                  style={{
                    backgroundImage:
                      'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  FAQs
                </h2>
                <p className="text-[#707070] text-lg leading-relaxed">
                  Here's what most users want to know before getting started.
                </p>
              </div>
              {/* Right side - FAQ Items */}
              <div className="w-full">
                <FAQ questions={faqData} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={handleCloseOTPModal}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        userPhone={userData.phone}
        userName={userData.name}
      />
      {isSuccessModalOpen && (
        <DiscountCard
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          title="Card Activated Successfully!"
          message="Your privilege card has been activated and is ready to use."
        />
      )}
    </div>
  );
};

export default SearchPage;
