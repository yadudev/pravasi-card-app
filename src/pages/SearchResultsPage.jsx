import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  MapPin,
  Star,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  createShopIcon,
  createUserLocationIcon,
  getCategoryInfo,
} from '../utils/shopIconUtils';
import CategoryIcon from '../assets/icons/CategoryIcon';
import { usersAPI } from '../services/api';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SearchResultsPage = ({ onShopClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([9.9312, 76.2673]); // Default to Kochi coordinates
  const [userLocation, setUserLocation] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);

  const locations = [
    'Mumbai, Maharashtra',
    'Delhi, Delhi',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Kochi, Kerala',
    'Thiruvananthapuram, Kerala',
  ];

  // Load search results on component mount
  useEffect(() => {
    loadSearchResults();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Update map center when shops are loaded or search location changes
  useEffect(() => {
    const setMapCenterBasedOnData = async () => {
      // Priority 1: If we have shops with real coordinates, use the first one
      const shopsWithRealCoords = shops.filter(
        (shop) => shop.hasRealCoordinates
      );

      if (shopsWithRealCoords.length > 0) {
        const validPosition = ensureValidPosition(
          shopsWithRealCoords[0].position
        );
        console.log('Using real shop coordinates:', validPosition);
        setMapCenter(validPosition);
        return;
      }

      // Priority 2: If we have any shops (even with default coords), use the first one
      if (shops.length > 0) {
        const validPosition = ensureValidPosition(shops[0].position);
        console.log('Using shop coordinates (may be default):', validPosition);
        setMapCenter(validPosition);
        return;
      }

      // Priority 3: If we have a search location, geocode it
      if (selectedLocation) {
        try {
          const coords = await geocodeLocation(selectedLocation);
          if (coords) {
            console.log('Using geocoded coordinates:', [
              coords.lat,
              coords.lng,
            ]);
            setMapCenter([coords.lat, coords.lng]);
            return;
          }
        } catch (error) {
          console.log('Geocoding failed, using fallback');
        }

        // Try our predefined locations
        const defaultCoords = getLocationDefaults(selectedLocation);
        console.log('Using predefined coordinates:', defaultCoords);
        setMapCenter(defaultCoords);
        return;
      }

      // Priority 4: Use user's current location
      if (
        userLocation &&
        Array.isArray(userLocation) &&
        userLocation.length >= 2
      ) {
        const validUserLocation = ensureValidPosition(userLocation);
        console.log('Using user location:', validUserLocation);
        setMapCenter(validUserLocation);
        return;
      }

      // Priority 5: Final fallback to Kochi
      console.log('Using final fallback: Kochi');
      setMapCenter([9.9312, 76.2673]);
    };

    setMapCenterBasedOnData();
  }, [shops, selectedLocation, userLocation]);

  // Helper function to safely format coordinates
  const formatCoordinate = (coord) => {
    const num = parseFloat(coord);
    return isNaN(num) ? '0.0000' : num.toFixed(4);
  };

  // Helper function to ensure position is valid numbers
  const ensureValidPosition = (position) => {
    if (!position || !Array.isArray(position) || position.length < 2) {
      return [9.9312, 76.2673]; // Default Kochi coordinates
    }

    const lat = parseFloat(position[0]);
    const lng = parseFloat(position[1]);

    return [isNaN(lat) ? 9.9312 : lat, isNaN(lng) ? 76.2673 : lng];
  };
  const getLocationDefaults = (locationString) => {
    const locationDefaults = {
      thiruvananthapuram: [8.5241, 76.9366],
      trivandrum: [8.5241, 76.9366],
      kochi: [9.9312, 76.2673],
      kerala: [10.8505, 76.2711],
      mumbai: [19.076, 72.8777],
      delhi: [28.6139, 77.209],
      bangalore: [12.9716, 77.5946],
      bengaluru: [12.9716, 77.5946],
      chennai: [13.0827, 80.2707],
      hyderabad: [17.385, 78.4867],
      kolkata: [22.5726, 88.3639],
      pune: [18.5204, 73.8567],
    };

    if (!locationString) return null;

    const locationLower = locationString.toLowerCase();

    // Check if selected location matches any of our defaults
    const matchedKey = Object.keys(locationDefaults).find((key) =>
      locationLower.includes(key)
    );

    return matchedKey ? locationDefaults[matchedKey] : null;
  };

  const geocodeLocation = async (locationName) => {
    try {
      // Using OpenStreetMap Nominatim API (free alternative to Google)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Transform backend API response to frontend format
  const transformShopData = (apiResponse) => {
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
      console.warn('Invalid API response structure:', apiResponse);
      return [];
    }

    // Get default coordinates based on search location
    const getDefaultCoordinates = () => {
      return getLocationDefaults(selectedLocation); // This now always returns valid coordinates
    };

    const defaultCoords = getDefaultCoordinates();
    console.log(
      'Default coordinates for shops without location:',
      defaultCoords
    );

    const transformedShops = apiResponse.data.map((shop) => {
      const hasRealCoordinates = !!(
        shop.location?.coordinates?.latitude &&
        shop.location?.coordinates?.longitude
      );

      const finalPosition = ensureValidPosition([
        shop.location?.coordinates?.latitude || defaultCoords[0],
        shop.location?.coordinates?.longitude || defaultCoords[1],
      ]);

      return {
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
        position: finalPosition,
        discount: `${parseFloat(shop.discount?.percentage || 10).toFixed(0)}% `,
        description: shop.description || 'No description available',
        timing: shop.openingHours
          ? formatOpeningHours(shop.openingHours)
          : '9:00 AM - 9:00 PM',
        distance:
          shop.location?.distance ||
          (hasRealCoordinates
            ? 'Distance calculated'
            : 'Located in search area'),
        website: shop.contact?.website || '',
        amenities: shop.amenities || [],
        tags: shop.tags || [],
        isOpen: shop.isOpen || false,
        badges: shop.badges || [],
        hasRealCoordinates,
      };
    });

    console.log('Transformed shops count:', transformedShops.length);
    console.log(
      'Shops with real coordinates:',
      transformedShops.filter((s) => s.hasRealCoordinates).length
    );

    return transformedShops;
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

  const loadSearchResults = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get search results from sessionStorage first (unless forcing refresh)
      const storedResults = sessionStorage.getItem('searchResults');
      const storedParams = sessionStorage.getItem('searchParams');

      if (storedResults && storedParams && !forceRefresh) {
        const searchResults = JSON.parse(storedResults);
        const params = JSON.parse(storedParams);

        console.log('Loading from storage:', params);

        setSearchParams(params);
        setSearchQuery(params.query || '');
        setSelectedLocation(params.location || '');

        // Set the shops and metadata from stored results
        setShops(searchResults.shops || []);
        setSearchMetadata(searchResults.searchMetadata || null);

        console.log(
          'Loaded shops from storage:',
          searchResults.shops?.length || 0
        );
      } else if (storedParams) {
        // If we have stored params but want fresh data, re-execute the search
        const params = JSON.parse(storedParams);
        console.log('Re-executing search with stored params:', params);

        setSearchParams(params);
        setSearchQuery(params.query || '');
        setSelectedLocation(params.location || '');

        // Re-execute search with stored parameters
        await executeSearch(params, true);
      } else {
        // If no stored results, show message to perform a new search
        setError('No search results found. Please perform a new search.');
        return;
      }
    } catch (error) {
      console.error('Error loading search results:', error);
      setError('Failed to load search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSearch = async (searchParameters = null, isRefresh = false) => {
    const params = searchParameters || {
      search: searchQuery.trim(),
      location: selectedLocation,
      latitude: userLocation ? userLocation[0] : undefined,
      longitude: userLocation ? userLocation[1] : undefined,
      maxDistance: 10,
      sortBy: 'distance',
      sortOrder: 'ASC',
      page: 1,
      limit: 50,
    };

    console.log('Executing search with parameters:', params);

    try {
      // Make API call using the usersAPI service
      const apiResponse = await usersAPI.searchShops(params);

      console.log('Search API Response:', apiResponse);

      // Transform the response data
      const transformedShops = transformShopData(apiResponse);

      setShops(transformedShops);
      setSearchMetadata(apiResponse.searchMetadata || null);

      // Prepare data for storage
      const searchResults = {
        shops: transformedShops,
        pagination: apiResponse.pagination || {},
        searchMetadata: apiResponse.searchMetadata || {},
        totalResults:
          apiResponse.pagination?.totalRecords || transformedShops.length,
      };

      const searchParamsForStorage = {
        query: params.search || searchQuery,
        location: params.location || selectedLocation,
        coordinates: userLocation
          ? { lat: userLocation[0], lng: userLocation[1] }
          : null,
      };

      // Update sessionStorage with new results
      sessionStorage.setItem(
        'searchParams',
        JSON.stringify(searchParamsForStorage)
      );
      sessionStorage.setItem('searchResults', JSON.stringify(searchResults));

      setSearchParams(searchParamsForStorage);

      return true;
    } catch (error) {
      console.error('Search failed:', error);

      // Handle different types of errors
      if (error.message.includes('401')) {
        setError('Please log in to search for shops.');
      } else if (error.message.includes('403')) {
        setError('You do not have permission to search shops.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError('Search failed. Please check your connection and try again.');
      }

      return false;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

    setIsSearching(true);
    setError(null);

    const success = await executeSearch();

    setIsSearching(false);
  };

  const handleRefreshData = async () => {
    if (!searchParams) {
      alert('No previous search to refresh');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    console.log('Refreshing data for:', searchParams);

    // Clear cache and reload fresh data
    sessionStorage.removeItem('searchResults');

    await loadSearchResults(true);

    setIsRefreshing(false);
  };

  const handleMarkerClick = (shop) => {
    if (onShopClick) {
      onShopClick(shop);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={40} />
        <p className="text-gray-600">Loading search results...</p>
      </div>
    </div>
  );

  const ErrorMessage = () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
          {searchParams && (
            <button
              onClick={handleRefreshData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Refresh Data
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const NoResults = () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          No shops found for your search criteria.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {searchMetadata?.totalResults !== undefined
            ? `Found ${searchMetadata.totalResults} results total`
            : 'Try adjusting your search terms or location'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try New Search
          </button>
          {searchParams && (
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh Data
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Search Results */}
        <div className="w-lg bg-white">
          <div className="p-4 bg-white">
            <div className="">
              <div className="flex-1 relative border border-gray-300 rounded-xl mb-2">
                <input
                  type="text"
                  placeholder="Search for shop, healthcare, travel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-0 rounded-xl placeholder-[#868686] placeholder-font-semibold 
             placeholder-text-sm"
                  disabled={isSearching}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <CategoryIcon
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  width={20}
                  height={20}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                {/* Location Dropdown */}
                <div className="flex min-w-[250px] border border-[#C7C7C7] rounded-2xl p-2 relative">
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
                  className="bg-[#AFDCFF] text-[#222158] w-full px-8 py-4 rounded-2xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 min-w-[140px] hover:bg-[#9DD0FF] disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                  <span className="whitespace-nowrap">
                    {isSearching ? 'Searching...' : 'Search Now'}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white">
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorMessage />
            ) : shops.length === 0 ? (
              <NoResults />
            ) : (
              <div className="space-y-3">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100"
                    onClick={() => handleMarkerClick(shop)}
                  >
                    <div className="flex">
                      {/* Image Section */}
                      <div className="relative flex-shrink-0 w-30">
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="w-full h-full object-cover rounded-l-2xl"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop';
                          }}
                        />
                        {/* Discount Badge */}
                        <div className="absolute top-2 left-2 bg-[#6FC141] text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                          <span>{shop.discount}</span>
                        </div>
                      </div>
                      {/* Content Section */}
                      <div className="p-4">
                        {/* Header with Location Icon */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex">
                            <MapPin
                              size={16}
                              className="text-[#A6A6A6] mt-0.5 flex-shrink-0"
                            />
                            <div className="text-sm font-medium text-[A6A6A6] ml-1">
                              {shop.address} • {shop.distance}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-black leading-tight">
                            {shop.name}
                          </h3>
                        </div>
                        {/* ✅ RESTORED: Rating section */}
                        {/* <div className="flex items-center mt-2 mb-2">
                          <Star
                            className="text-yellow-400 fill-current mr-1"
                            size={14}
                          />
                          <span className="text-sm font-medium text-gray-600">
                            {shop.rating}
                          </span>
                          {shop.isOpen && (
                            <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              Open Now
                            </span>
                          )}
                        </div> */}
                        {/* Contact Details */}
                        <div className="flex justify-between gap-1 mt-6 flex-wrap md:flex-nowrap">
                          {/* Call Section */}
                          <div className="flex-1 text-[#A6A6A6] min-w-[120px]">
                            <span className="block text-xs font-medium text-[#A6A6A6] mb-1">
                              Call on
                            </span>
                            <div className="flex items-center text-sm font-medium text-black">
                              <span>{shop.phone}</span>
                            </div>
                          </div>
                          {/* Email Section */}
                          <div className="flex-1 text-[#A6A6A6] min-w-[350px] ml-6">
                            <span className="block text-xs font-medium text-[#A6A6A6] mb-1">
                              Email ID
                            </span>
                            <div className="flex items-center text-sm font-medium text-black break-all">
                              <span>{shop.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Map */}
        <div
          className="flex-1 rounded-3xl mt-4 ml-2"
          style={{ height: '700px', width: '820px' }}
        >
          <MapContainer
            center={ensureValidPosition(mapCenter)}
            zoom={14}
            style={{ height: '652px', width: '820px' }}
            className="rounded-2xl overflow-hidden"
            key={`map-${formatCoordinate(mapCenter[0])}-${formatCoordinate(mapCenter[1])}`} // Force re-render when center changes
          >
            {/* Add TileLayer - This is crucial for displaying the map */}
            <TileLayer
              attribution=""
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={ensureValidPosition(userLocation)}
                icon={createUserLocationIcon({ size: 25 })}
              >
                <Popup>
                  <div className="text-center p-2">
                    <div className="font-semibold text-blue-600">
                      📍 Your Location
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Current Position
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
            {/* Shop markers */}
            {shops.map((shop) => {
              const categoryInfo = getCategoryInfo(shop.category);
              const validPosition = ensureValidPosition(shop.position);
              return (
                <Marker
                  key={`shop-${shop.id}-${validPosition[0]}-${validPosition[1]}`} // Ensure re-render on position change
                  position={validPosition}
                  icon={createShopIcon(shop.category, {
                    size: 40,
                    // Different opacity for shops without real coordinates
                    opacity: shop.hasRealCoordinates ? 1.0 : 0.7,
                  })}
                  eventHandlers={{
                    mouseover: () => setHoveredMarker(shop.id),
                    mouseout: () => setHoveredMarker(null),
                    click: () => handleMarkerClick(shop),
                  }}
                >
                  <Popup>
                    <div className="p-3 w-[300px] rounded-xl shadow-lg">
                      {/* Image Section */}
                      <div className="relative">
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="w-full h-36 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop';
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-[#6FC141] text-white px-2 py-1 rounded-md text-xs font-semibold">
                          {shop.discount}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin
                            size={16}
                            className="text-[#A6A6A6] flex-shrink-0 mr-2"
                          />
                          {shop.address} &nbsp;•&nbsp;{' '}
                          {shop.distance ?? '1.0 km'}
                        </p>

                        <h4 className="font-semibold text-lg text-black">
                          {shop.name}
                        </h4>
                        <div className="flex justify-between gap-1 mt-6 flex-wrap md:flex-nowrap">
                          {/* Call Section */}
                          <div className="flex-1 text-[#A6A6A6] min-w-[120px]">
                            <span className="block text-xs font-medium text-[#A6A6A6] mb-1">
                              Call on
                            </span>
                            <div className="flex items-center text-sm font-medium text-black">
                              <span>{shop.phone}</span>
                            </div>
                          </div>
                          {/* Email Section */}
                          <div className="flex-1 text-[#A6A6A6] min-w-[350px] ml-6">
                            <span className="block text-xs font-medium text-[#A6A6A6] mb-1">
                              Email ID
                            </span>
                            <div className="flex items-center text-sm font-medium text-black break-all">
                              <span>{shop.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          {/* Hover overlay for featured image */}
          {hoveredMarker && (
            <div
              className="absolute top-24 right-4 bg-white rounded-xl shadow-xl p-4 max-w-sm"
              style={{ zIndex: 500, pointerEvents: 'none' }}
            >
              {shops.find((shop) => shop.id === hoveredMarker) && (
                <div>
                  {(() => {
                    const shop = shops.find(
                      (shop) => shop.id === hoveredMarker
                    );
                    const categoryInfo = getCategoryInfo(shop.category);
                    return (
                      <>
                        <div className="flex">
                          {/* Image Section */}
                          <div className="relative flex-shrink-0 w-30">
                            <img
                              src={shop.image}
                              alt={shop.name}
                              className="w-full h-full object-cover rounded-l-2xl"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop';
                              }}
                            />
                            {/* Discount Badge */}
                            <div className="absolute top-2 left-2 bg-[#6FC141] text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                              <span>{shop.discount}</span>
                            </div>
                          </div>
                          {/* Content Section */}
                          <div className="px-4">
                            {/* Header with Location Icon */}
                            <div className="flex items-start gap-2 mb-2">
                              <div className="flex">
                                <MapPin
                                  size={16}
                                  className="text-[#A6A6A6] mt-0.5 flex-shrink-0"
                                />
                                <div className="text-sm font-medium text-[A6A6A6] ml-1">
                                  {shop.address} • {shop.distance}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-black leading-tight">
                                {shop.name}
                              </h3>
                            </div>
                            {/* ✅ RESTORED: Rating section */}
                            {/* <div className="flex items-center mt-2 mb-2">
                          <Star
                            className="text-yellow-400 fill-current mr-1"
                            size={14}
                          />
                          <span className="text-sm font-medium text-gray-600">
                            {shop.rating}
                          </span>
                          {shop.isOpen && (
                            <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              Open Now
                            </span>
                          )}
                        </div> */}
                            {/* Contact Details */}
                            <div className="flex justify-between gap-1 mt-6 flex-wrap md:flex-nowrap">
                              {/* Call Section */}
                              <div className="flex-1 text-[#A6A6A6] min-w-[120px]">
                                <span className="block text-xs font-medium text-[#A6A6A6] mb-1">
                                  Call on
                                </span>
                                <div className="flex items-center text-sm font-medium text-black">
                                  <span>{shop.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
