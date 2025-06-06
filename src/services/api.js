import { baseUrl } from '../utils/config';

const API_BASE_URL = baseUrl || 'http://localhost:3001/api';

// Generic API call function
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

  logout: () => apiCall('/admin/logout', { method: 'POST' }),

  refreshToken: () => apiCall('/admin/auth/refresh-token', { method: 'POST' }),
  verifyToken: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiCall('/admin/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall('/admin/dashboard/stats'),
  getRecentActivity: () => apiCall('/admin/dashboard/recent-activity'),
  getPendingApprovals: () => apiCall('/admin/dashboard/pending-approvals'),
};

// Users Management API
export const usersAPI = {
  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: (id) => apiCall(`/admin/users/${id}`),

  createUser: (userData) =>
    apiCall('/admin/users', {
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

  updateCardDetails: (id, cardData) =>
    apiCall(`/admin/users/${id}/card`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    }),

  getUserDiscountHistory: (id) =>
    apiCall(`/admin/users/${id}/discount-history`),
};

// Shops Management API
export const shopsAPI = {
  getAllShops: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/shops${queryString ? `?${queryString}` : ''}`);
  },

  getShopById: (id) => apiCall(`/admin/shops/${id}`),

  approveShop: (id) =>
    apiCall(`/admin/shops/${id}/approve`, { method: 'PUT' }),

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
