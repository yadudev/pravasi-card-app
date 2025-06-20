import L from 'leaflet';

/**
 * Category color mapping for shop icons
 */
export const CATEGORY_COLORS = {
  restaurant: '#3D3C96',
  shopping: '#4ECDC4', 
  healthcare: '#45B7D1',
  beauty: '#96CEB4',
  travel: '#FFEAA7',
  entertainment: '#DDA0DD',
  services: '#A8E6CF',
  groceries: '#FFB347',
  fitness: '#FF8E9B',
  education: '#B19CD9',
  automotive: '#87CEEB',
  electronics: '#F0E68C',
  default: '#222158'
};

/**
 * Create custom shop icon with SVG
 * @param {string} category - Shop category
 * @param {Object} options - Additional options for customization
 * @returns {L.DivIcon} Leaflet div icon
 */
export const createShopIcon = (category, options = {}) => {
  const {
    size = 40,
    shadowBlur = 4,
    borderColor = '#3D3C96',
    iconColor = 'white',
    customColor = null
  } = options;

  const backgroundColor = customColor || CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const uniqueId = `filter_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <defs>
        <filter id="${uniqueId}" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="${shadowBlur}"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
      </defs>
      <g filter="url(#${uniqueId})">
        <path d="M14 4.5H36C39.0376 4.5 41.5 6.96243 41.5 10V37.2197L39.0537 36.0947C38.202 35.703 37.2754 35.5 36.3379 35.5H14C10.9624 35.5 8.5 33.0376 8.5 30V10C8.5 6.96243 10.9624 4.5 14 4.5Z" 
              fill="${backgroundColor}" 
              stroke="${borderColor}"/>
        <path d="M32.4965 18.2934V25.625C32.4965 26.0891 32.3122 26.5342 31.984 26.8624C31.6558 27.1906 31.2107 27.375 30.7465 27.375H20.2535C19.7896 27.3748 19.3447 27.1903 19.0167 26.8621C18.6887 26.534 18.5044 26.089 18.5044 25.625V18.2934M21.5643 16.6562L22.0018 11.625M21.5643 16.6562C21.5643 19.1955 25.5 19.1955 25.5 16.6562M21.5643 16.6562C21.5643 19.4353 17.0537 18.8612 17.6854 16.4392L18.5998 12.9331C18.6975 12.5587 18.9166 12.2271 19.2228 11.9904C19.529 11.7537 19.905 11.6252 20.292 11.625H30.708C31.0951 11.6252 31.4711 11.7537 31.7773 11.9904C32.0835 12.2271 32.3026 12.5587 32.4003 12.9331L33.3147 16.4392C33.9464 18.8621 29.4358 19.4353 29.4358 16.6562M25.5 16.6562V11.625M25.5 16.6562C25.5 19.1955 29.4358 19.1955 29.4358 16.6562M29.4358 16.6562L28.9983 11.625" 
              stroke="${iconColor}" 
              stroke-width="1.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-shop-marker',
    html: `<div class="shop-icon-container" style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    ">${svgIcon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
popupAnchor: [0, -size]  });
};

/**
 * Create icon for specific categories with predefined styles
 */
export const createRestaurantIcon = (options) => createShopIcon('restaurant', options);
export const createShoppingIcon = (options) => createShopIcon('shopping', options);
export const createHealthcareIcon = (options) => createShopIcon('healthcare', options);
export const createBeautyIcon = (options) => createShopIcon('beauty', options);
export const createTravelIcon = (options) => createShopIcon('travel', options);
export const createEntertainmentIcon = (options) => createShopIcon('entertainment', options);
export const createServicesIcon = (options) => createShopIcon('services', options);

/**
 * Create user location icon
 * @param {Object} options - Customization options
 * @returns {L.DivIcon} User location marker
 */
export const createUserLocationIcon = (options = {}) => {
  const { size = 20, color = '#4285f4' } = options;
  
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          width: ${size + 20}px;
          height: ${size + 20}px;
          background-color: ${color};
          opacity: 0.3;
          border-radius: 50%;
          position: absolute;
          top: -13px;
          left: -13px;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.7; }
        }
      </style>
    `,
    iconSize: [size + 20, size + 20],
    iconAnchor: [(size + 20) / 2, (size + 20) / 2],
    popupAnchor: [0, -size / 2]
  });
};

/**
 * Create cluster icon for multiple shops in the same area
 * @param {number} count - Number of shops in cluster
 * @param {Object} options - Customization options
 * @returns {L.DivIcon} Cluster marker
 */
export const createClusterIcon = (count, options = {}) => {
  const { size = 40, backgroundColor = '#ff6b6b', textColor = 'white' } = options;
  
  return L.divIcon({
    className: 'shop-cluster-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${backgroundColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(12, size / 3)}px;
        font-weight: bold;
        color: ${textColor};
        cursor: pointer;
        transition: transform 0.2s ease;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

/**
 * Get category display information
 * @param {string} category - Category name
 * @returns {Object} Category information
 */
export const getCategoryInfo = (category) => {
  const categoryData = {
    restaurant: { name: 'Restaurant', emoji: '🍽️', description: 'Food & Dining' },
    shopping: { name: 'Shopping', emoji: '🛍️', description: 'Retail & Fashion' },
    healthcare: { name: 'Healthcare', emoji: '🏥', description: 'Medical & Pharmacy' },
    beauty: { name: 'Beauty', emoji: '💄', description: 'Beauty & Wellness' },
    travel: { name: 'Travel', emoji: '✈️', description: 'Travel & Tourism' },
    entertainment: { name: 'Entertainment', emoji: '🎬', description: 'Fun & Recreation' },
    services: { name: 'Services', emoji: '🔧', description: 'Professional Services' },
    groceries: { name: 'Groceries', emoji: '🛒', description: 'Food & Groceries' },
    fitness: { name: 'Fitness', emoji: '💪', description: 'Gym & Sports' },
    education: { name: 'Education', emoji: '📚', description: 'Learning & Training' },
    automotive: { name: 'Automotive', emoji: '🚗', description: 'Cars & Transport' },
    electronics: { name: 'Electronics', emoji: '📱', description: 'Tech & Gadgets' }
  };

  return categoryData[category] || {
    name: 'General',
    emoji: '🏪',
    description: 'General Store'
  };
};

/**
 * Create animated marker for special promotions
 * @param {string} category - Shop category
 * @param {Object} options - Animation and style options
 * @returns {L.DivIcon} Animated promotional marker
 */
export const createPromotionalIcon = (category, options = {}) => {
  const {
    size = 45,
    pulseColor = '#ffeb3b',
    animationDuration = '2s'
  } = options;

  const baseIcon = createShopIcon(category, { size: size - 10 });
  const uniqueId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  return L.divIcon({
    className: 'promotional-shop-marker',
    html: `
      <div class="promo-container" style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="promo-pulse-${uniqueId}" style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${pulseColor};
          border-radius: 50%;
          position: absolute;
          opacity: 0.6;
          animation: promoPulse-${uniqueId} ${animationDuration} infinite;
        "></div>
        ${baseIcon.options.html}
      </div>
      <style>
        @keyframes promoPulse-${uniqueId} {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)]
  });
};

export default {
  createShopIcon,
  createUserLocationIcon,
  createClusterIcon,
  createPromotionalIcon,
  createRestaurantIcon,
  createShoppingIcon,
  createHealthcareIcon,
  createBeautyIcon,
  createTravelIcon,
  createEntertainmentIcon,
  createServicesIcon,
  getCategoryInfo,
  CATEGORY_COLORS
};