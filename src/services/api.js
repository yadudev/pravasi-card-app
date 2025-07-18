import { baseUrl } from '../utils/config';

const API_BASE_URL = baseUrl || 'http://localhost:3001/api';

// Generic API call function for authenticated requests
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.success) {
      return response.json();
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Public API call function for unauthenticated requests
const publicApiCall = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Public API call failed:', error);
    throw error;
  }
};

const userApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: (credentials) =>
    apiCall('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () => userApiCall('/auth/logout', { method: 'POST' }),

  refreshToken: () => apiCall('/admin/auth/refresh-token', { method: 'POST' }),
  verifyToken: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiCall('/admin/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};

// ========================================
// ✅ NEW: Newsletter API (Public Endpoints)
// ========================================
export const newsletterAPI = {
  // Subscribe to newsletter (public endpoint - no authentication required)
  subscribe: (email) =>
    publicApiCall('/users/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Unsubscribe from newsletter (if you implement this in the future)
  unsubscribe: (token) =>
    publicApiCall('/users/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Check subscription status (if you implement this in the future)
  checkStatus: (email) =>
    publicApiCall('/users/newsletter/status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ========================================
// ✅ NEW: OTP ADMIN MANAGEMENT API
// ========================================
export const otpAdminAPI = {
  // Get all OTP sessions with filtering and pagination
  getAllOTPSessions: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all valid parameters
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ''
      ) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/admin/users/otp-sessions${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get specific OTP session by session ID
  getOTPSessionById: (sessionId) =>
    apiCall(`/admin/users/otp-sessions/${sessionId}`),

  // Get OTP sessions for specific user
  getUserOTPSessions: (userId, params = {}) => {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ''
      ) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/admin/users/${userId}/otp-sessions${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get OTP statistics for dashboard
  getOTPStatistics: () => apiCall('/admin/users/otp-sessions/stats'),

  // Get user-specific OTP statistics
  getUserOTPStats: (userId) =>
    apiCall(`/admin/users/${userId}/otp-sessions/stats`),

  // Get OTP analytics data
  getOTPAnalytics: (period = '7d') =>
    apiCall(`/admin/users/otp-sessions/analytics?period=${period}`),

  // Manually expire OTP session (admin action)
  expireOTPSession: (sessionId) =>
    apiCall(`/admin/users/otp-sessions/${sessionId}/expire`, {
      method: 'POST',
    }),

  // Admin resend OTP for user
  adminResendOTP: (userId, otpData) =>
    apiCall(`/admin/users/${userId}/otp-sessions/resend`, {
      method: 'POST',
      body: JSON.stringify(otpData),
    }),

  // Export OTP sessions to CSV/Excel
  exportOTPSessions: async (params = {}) => {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ''
      ) {
        queryParams.append(key, params[key]);
      }
    });

    const token = localStorage.getItem('adminToken');
    const queryString = queryParams.toString();

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/otp-sessions/export${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Return blob for download
      return await response.blob();
    } catch (error) {
      console.error('Error exporting OTP sessions:', error);
      throw error;
    }
  },

  // Bulk actions on OTP sessions
  bulkExpireOTPSessions: (sessionIds) =>
    apiCall('/admin/users/otp-sessions/bulk-expire', {
      method: 'POST',
      body: JSON.stringify({ sessionIds }),
    }),

  // Get OTP session counts by status
  getOTPSessionCounts: () => apiCall('/admin/users/otp-sessions/counts'),

  // Search OTP sessions
  searchOTPSessions: (searchTerm, filters = {}) => {
    const params = {
      search: searchTerm,
      ...filters,
    };
    return otpAdminAPI.getAllOTPSessions(params);
  },

  // Get recent OTP activity (for dashboard)
  getRecentOTPActivity: (limit = 10) =>
    apiCall(
      `/admin/users/otp-sessions?limit=${limit}&sortBy=created_at&sortOrder=DESC`
    ),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall('/admin/dashboard/stats'),
  getRecentActivity: () => apiCall('/admin/dashboard/recent-activity'),
  getPendingApprovals: () => apiCall('/admin/dashboard/pending-approvals'),

  // Enhanced dashboard with OTP stats
  getEnhancedStats: async () => {
    try {
      const [generalStats, otpStats] = await Promise.all([
        dashboardAPI.getStats(),
        otpAdminAPI.getOTPStatistics(),
      ]);

      return {
        ...generalStats.data,
        otp: otpStats.data,
      };
    } catch (error) {
      console.error('Error fetching enhanced dashboard stats:', error);
      throw error;
    }
  },
};

// Users Management API
export const usersAPI = {
  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: (id) => apiCall(`/admin/users/${id}`),

  login: (userData) =>
    publicApiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  signUp: (userData) =>
    publicApiCall('/users/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  createProfile: (userData) =>
    apiCall('/users/createProfile', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (id, userData) =>
    apiCall(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  deleteUser: (id) => apiCall(`/admin/users/${id}`, { method: 'DELETE' }),

  resetPassword: (id, newPassword) =>
    apiCall(`/admin/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword: newPassword }),
    }),

  forgotPassword: (emailOrNumber) =>
    publicApiCall(`/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ emailOrNumber: emailOrNumber }),
    }),

  updateCardDetails: (id, cardData) =>
    apiCall(`/admin/users/${id}/card`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    }),

  getProfileStatus: async () => {
    const token = localStorage.getItem('accessToken');
    console.log({ accessToken: token });
    const response = await fetch(`${baseUrl}/users/profile-status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get profile status: ${response.status}`);
    }

    return response.json();
  },

  getUserDiscountHistory: (id) =>
    apiCall(`/admin/users/${id}/discount-history`),

  // ========================================
  // ✅ NEW: CARD MANAGEMENT ENDPOINTS
  // ========================================

  // Get user card details with full information
  getUserCardDetails: () => userApiCall('/users/card/details'),

  // Activate user card
  activateCard: () =>
    userApiCall('/users/card/activate', {
      method: 'POST',
    }),

  // Renew user card
  renewCard: (months = 12) =>
    userApiCall('/users/card/renew', {
      method: 'POST',
      body: JSON.stringify({ months }),
    }),

  // ========================================
  // ✅ NEW: OTP HISTORY ENDPOINT
  // ========================================

  // Get user OTP send history
  getOtpHistory: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.purpose) queryParams.append('purpose', params.purpose);

    const queryString = queryParams.toString();
    return userApiCall(
      `/users/otp/history${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get OTP summary by purpose
  getOtpSummary: async () => {
    try {
      const response = await userApiCall('/users/otp/history?limit=5');

      // Process the data to create summary
      const history = response.data || [];
      const summary = {
        totalSent: history.length,
        byPurpose: {},
        recentActivity: history.slice(0, 5),
      };

      // Group by purpose
      history.forEach((otp) => {
        if (!summary.byPurpose[otp.purpose]) {
          summary.byPurpose[otp.purpose] = {
            total: 0,
            verified: 0,
            expired: 0,
            pending: 0,
          };
        }

        summary.byPurpose[otp.purpose].total++;
        summary.byPurpose[otp.purpose][otp.status]++;
      });

      return summary;
    } catch (error) {
      console.error('Error fetching OTP summary:', error);
      throw error;
    }
  },

  searchShops: (searchParams = {}) => {
    const queryParams = new URLSearchParams();

    // Add search parameters based on your backend API
    if (searchParams.search) queryParams.append('search', searchParams.search);
    if (searchParams.category)
      queryParams.append('category', searchParams.category);
    if (searchParams.location)
      queryParams.append('location', searchParams.location);
    if (searchParams.latitude)
      queryParams.append('latitude', searchParams.latitude);
    if (searchParams.longitude)
      queryParams.append('longitude', searchParams.longitude);
    if (searchParams.maxDistance)
      queryParams.append('maxDistance', searchParams.maxDistance);
    if (searchParams.sortBy) queryParams.append('sortBy', searchParams.sortBy);
    if (searchParams.sortOrder)
      queryParams.append('sortOrder', searchParams.sortOrder);

    // Pagination parameters
    if (searchParams.page) queryParams.append('page', searchParams.page);
    if (searchParams.limit) queryParams.append('limit', searchParams.limit);

    const queryString = queryParams.toString();
    return userApiCall(
      `/users/shops/search${queryString ? `?${queryString}` : ''}`
    );
  },

  // OTP API Methods
  sendEmailOTP: (otpData) =>
    userApiCall('/users/otp/send-email', {
      method: 'POST',
      body: JSON.stringify(otpData),
    }),

  verifyEmailOTP: (verificationData) =>
    userApiCall('/users/otp/verify-email', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),

  resendEmailOTP: (resendData) =>
    userApiCall('/users/otp/resend-email', {
      method: 'POST',
      body: JSON.stringify(resendData),
    }),

  // SMS OTP Methods (if you need them in the future)
  sendSMSOTP: (otpData) =>
    userApiCall('/users/otp/send-sms', {
      method: 'POST',
      body: JSON.stringify(otpData),
    }),

  verifySMSOTP: (verificationData) =>
    userApiCall('/users/otp/verify-sms', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),

  resendSMSOTP: (resendData) =>
    userApiCall('/users/otp/resend-sms', {
      method: 'POST',
      body: JSON.stringify(resendData),
    }),
};

// Shops Management API
export const shopsAPI = {
  getAllShops: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/shops${queryString ? `?${queryString}` : ''}`);
  },

  getShopById: (id) => apiCall(`/admin/shops/${id}`),

  registerShop: (shopData) =>
    publicApiCall('/admin/shops/register', {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),

  approveShop: (id) => apiCall(`/admin/shops/${id}/approve`, { method: 'PUT' }),

  rejectShop: (id, reason) =>
    apiCall(`/admin/shops/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  blockShop: (id) =>
    apiCall(`/admin/shops/${id}/toggle-block`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  activateShop: (id) =>
    apiCall(`/admin/shops/${id}/toggle-block`, { method: 'PUT' }),

  updateShop: (id, shopData) =>
    apiCall(`/admin/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    }),

  getShopPurchases: (id) => apiCall(`/admin/shops/${id}/purchases`),

  updateDiscountSettings: (id, discountData) =>
    apiCall(`/admin/shops/${id}/discount-settings`, {
      method: 'PUT',
      body: JSON.stringify(discountData),
    }),

  createShop: (shopData) =>
    apiCall(`/admin/shops`, {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),
};

// Discounts & Rules API
export const discountsAPI = {
  getGlobalPolicies: () => apiCall('/admin/discounts/global-policies'),

  updateGlobalPolicy: (policyId, policyData) =>
    apiCall(`/admin/discounts/global-policies/${policyId}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    }),

  getPurchaseTiers: () => apiCall('/admin/discounts/purchase-tiers'),

  updatePurchaseTier: (tierId, tierData) =>
    apiCall(`/admin/discounts/purchase-tiers/${tierId}`, {
      method: 'PUT',
      body: JSON.stringify(tierData),
    }),

  createDiscountRule: (ruleData) =>
    apiCall('/admin/discounts/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    }),

  getCardValidityRules: () => apiCall('/admin/discounts/card-validity-rules'),

  updateCardValidityRule: (ruleId, ruleData) =>
    apiCall(`/admin/discounts/card-validity-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    }),

  getSeasonalOffers: () => apiCall('/admin/discounts/seasonal-offers'),

  createSeasonalOffer: (offerData) =>
    apiCall('/admin/discounts/seasonal-offers', {
      method: 'POST',
      body: JSON.stringify(offerData),
    }),

  updateSeasonalOffer: (offerId, offerData) =>
    apiCall(`/admin/discounts/seasonal-offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(offerData),
    }),

  deleteSeasonalOffer: (offerId) =>
    apiCall(`/admin/discounts/seasonal-offers/${offerId}`, {
      method: 'DELETE',
    }),
};

// Content Management API
export const contentAPI = {
  // Homepage Banners
  getBanners: () => apiCall('/admin/content/banners'),

  createBanner: (bannerData) =>
    apiCall('/admin/content/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData),
    }),

  updateBanner: (id, bannerData) =>
    apiCall(`/admin/content/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bannerData),
    }),

  deleteBanner: (id) =>
    apiCall(`/admin/content/banners/${id}`, { method: 'DELETE' }),

  // Blogs & Announcements
  getBlogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/content/blogs${queryString ? `?${queryString}` : ''}`
    );
  },

  getBlogById: (id) => apiCall(`/admin/content/blogs/${id}`),

  createBlog: (blogData) =>
    apiCall('/admin/content/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    }),

  updateBlog: (id, blogData) =>
    apiCall(`/admin/content/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    }),

  deleteBlog: (id) =>
    apiCall(`/admin/content/blogs/${id}`, { method: 'DELETE' }),

  publishBlog: (id) =>
    apiCall(`/admin/content/blogs/${id}/publish`, { method: 'POST' }),

  // FAQ & Help
  getFAQs: () => apiCall('/admin/content/faqs'),

  createFAQ: (faqData) =>
    apiCall('/admin/content/faqs', {
      method: 'POST',
      body: JSON.stringify(faqData),
    }),

  updateFAQ: (id, faqData) =>
    apiCall(`/admin/content/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(faqData),
    }),

  deleteFAQ: (id) => apiCall(`/admin/content/faqs/${id}`, { method: 'DELETE' }),

  getHelpArticles: () => apiCall('/admin/content/help-articles'),

  createHelpArticle: (articleData) =>
    apiCall('/admin/content/help-articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    }),

  updateHelpArticle: (id, articleData) =>
    apiCall(`/admin/content/help-articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    }),

  deleteHelpArticle: (id) =>
    apiCall(`/admin/content/help-articles/${id}`, { method: 'DELETE' }),
};

// Reports & Analytics API
export const reportsAPI = {
  getTopUsersByPurchase: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/top-users${queryString ? `?${queryString}` : ''}`
    );
  },

  getTopShopsByTransaction: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/top-shops${queryString ? `?${queryString}` : ''}`
    );
  },

  getDiscountUsageReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/discount-usage${queryString ? `?${queryString}` : ''}`
    );
  },

  getCardExpiryReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/card-expiry${queryString ? `?${queryString}` : ''}`
    );
  },

  // New OTP-related reports
  getOTPUsageReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/otp-usage${queryString ? `?${queryString}` : ''}`
    );
  },

  getOTPFailureAnalysis: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/admin/reports/otp-failure-analysis${queryString ? `?${queryString}` : ''}`
    );
  },

  exportReport: (reportType, params = {}) => {
    const queryString = new URLSearchParams({
      ...params,
      export: true,
    }).toString();
    return apiCall(
      `/admin/reports/${reportType}${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }
    );
  },

  getAnalyticsSummary: (dateRange) =>
    apiCall(
      `/admin/reports/analytics-summary?${new URLSearchParams(dateRange).toString()}`
    ),

  getUserGrowthAnalytics: (dateRange) =>
    apiCall(
      `/admin/reports/user-growth?${new URLSearchParams(dateRange).toString()}`
    ),

  getRevenueAnalytics: (dateRange) =>
    apiCall(
      `/admin/reports/revenue-analytics?${new URLSearchParams(dateRange).toString()}`
    ),
};

// Upload API for file uploads
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return apiCall('/admin/upload/image', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },

  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);

    return apiCall('/admin/upload/document', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },
};

// Settings API
export const settingsAPI = {
  getSystemSettings: () => apiCall('/admin/settings/system'),

  updateSystemSettings: (settings) =>
    apiCall('/admin/settings/system', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getNotificationSettings: () => apiCall('/admin/settings/notifications'),

  updateNotificationSettings: (settings) =>
    apiCall('/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getEmailTemplates: () => apiCall('/admin/settings/email-templates'),

  updateEmailTemplate: (templateId, templateData) =>
    apiCall(`/admin/settings/email-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    }),
};

// ========================================
// ✅ UTILITY FUNCTIONS FOR NEWSLETTER
// ========================================

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Newsletter subscription helper with error handling
export const subscribeToNewsletter = async (email) => {
  try {
    // Validate email first
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Make API call
    const response = await newsletterAPI.subscribe(email);

    return {
      success: true,
      message: response.message || 'Successfully subscribed to newsletter!',
      data: response.data,
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);

    // Handle specific error messages
    let errorMessage = 'Failed to subscribe. Please try again.';

    if (
      error.message.includes('already exists') ||
      error.message.includes('already subscribed')
    ) {
      errorMessage = 'This email is already subscribed to our newsletter.';
    } else if (
      error.message.includes('invalid email') ||
      error.message.includes('valid email')
    ) {
      errorMessage = 'Please enter a valid email address.';
    } else if (
      error.message.includes('network') ||
      error.message.includes('fetch')
    ) {
      errorMessage =
        'Network error. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// ========================================
// ✅ EXISTING UTILITY FUNCTIONS FOR CARD & OTP MANAGEMENT
// ========================================

// Format OTP purpose for display
export const formatOtpPurpose = (purpose) => {
  const purposeMap = {
    card_activation: 'Card Activation',
    email_verification: 'Email Verification',
    phone_verification: 'Phone Verification',
    password_reset: 'Password Reset',
    transaction_verification: 'Transaction Verification',
    login_verification: 'Login Verification',
    account_verification: 'Account Verification',
  };

  return (
    purposeMap[purpose] ||
    purpose.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// Format card status for display
export const formatCardStatus = (status) => {
  const statusMap = {
    active: { text: 'Active', color: 'green' },
    inactive: { text: 'Inactive', color: 'gray' },
    expired: { text: 'Expired', color: 'red' },
    suspended: { text: 'Suspended', color: 'yellow' },
  };

  return statusMap[status] || { text: status, color: 'gray' };
};

// Calculate days remaining until card expiry
export const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 0;

  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

// Mask contact information for privacy
export const maskContactInfo = (contactInfo) => {
  if (!contactInfo) return '';

  if (contactInfo.includes('@')) {
    // Email masking
    const [username, domain] = contactInfo.split('@');
    const maskedUsername =
      username.substring(0, 2) + '****' + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  } else {
    // Phone masking
    return contactInfo.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }
};

// Format date for display
export const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatCardExpiry = (expiryDateString) => {
  const date = new Date(expiryDateString);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = String(date.getFullYear()).slice(-2); // Get last two digits
  return `${month}/${year}`;
};

export const formatCardNumber = (cardNumber = '') => {
  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');

  // Limit to 16 digits
  const trimmed = digitsOnly.slice(0, 16);

  // Format as XXXX-XXXX-XXXX-XXXX
  return trimmed.replace(/(.{4})(?=.)/g, '$1-');
};

export const formatFullName = (name = '') => {
  return name
    .trim()
    .split(/\s+/) // split by space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Validate card status
export const getCardValidationStatus = (cardData) => {
  if (!cardData) return { isValid: false, message: 'No card found' };

  const now = new Date();
  const expiryDate = new Date(cardData.expiresAt);

  if (!cardData.isActive) {
    return { isValid: false, message: 'Card is not activated' };
  }

  if (expiryDate <= now) {
    return { isValid: false, message: 'Card has expired' };
  }

  const daysRemaining = calculateDaysRemaining(cardData.expiresAt);
  if (daysRemaining <= 7) {
    return {
      isValid: true,
      message: `Card expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      warning: true,
    };
  }

  return { isValid: true, message: 'Card is active and valid' };
};

// ========================================
// ✅ NEW: OTP UTILITY FUNCTIONS
// ========================================

// Get OTP status with color coding
export const getOTPStatus = (session) => {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  if (session.isVerified) {
    return { status: 'verified', text: 'Verified', color: 'green' };
  } else if (expiresAt < now) {
    return { status: 'expired', text: 'Expired', color: 'red' };
  } else {
    return { status: 'pending', text: 'Pending', color: 'yellow' };
  }
};

// Calculate OTP expiry time remaining
export const getOTPTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;

  if (diffMs <= 0) return { expired: true, text: 'Expired' };

  const minutes = Math.floor(diffMs / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return { expired: false, text: `${minutes}m ${seconds}s` };
  } else {
    return { expired: false, text: `${seconds}s` };
  }
};

// Export OTP sessions data as CSV
export const downloadOTPSessionsCSV = async (filters = {}) => {
  try {
    const blob = await otpAdminAPI.exportOTPSessions({
      ...filters,
      format: 'csv',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `otp-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  } else if (error.message.includes('403')) {
    // Forbidden
    alert('You do not have permission to perform this action.');
  } else if (error.message.includes('500')) {
    // Server error
    alert('Server error. Please try again later.');
  } else {
    // General error
    alert('An error occurred. Please try again.');
  }
};

// Response interceptor for common error handling
const originalApiCall = apiCall;
const apiCallWithErrorHandling = async (endpoint, options = {}) => {
  try {
    return await originalApiCall(endpoint, options);
  } catch (error) {
    handleAPIError(error);
    throw error;
  }
};

export default apiCallWithErrorHandling;
