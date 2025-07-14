import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usersAPI, authAPI } from '../services/api';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to get stored tokens
  const getStoredTokens = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  };

  // Helper function to store tokens
  const storeTokens = (accessToken, refreshToken) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  };

  // Helper function to clear tokens
  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  };

  // Helper function to extract API error message
  const extractApiErrorMessage = (error) => {
    // First, try to get the message from the API response
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    // If no API message, check for standard HTTP status codes
    const status = error?.response?.status;
    const errorMessage = error?.message || '';
    
    if (status === 401 || errorMessage.includes('401')) {
      return 'Invalid email or password';
    } else if (status === 403 || errorMessage.includes('403')) {
      return 'Account is blocked or inactive';
    } else if (status === 400 || errorMessage.includes('400')) {
      return 'Please check your login credentials';
    } else if (status === 404 || errorMessage.includes('404')) {
      return 'User not found';
    } else if (status === 429 || errorMessage.includes('429')) {
      return 'Too many attempts. Please try again later';
    } else if (status >= 500 || errorMessage.includes('500')) {
      return 'Server error. Please try again later';
    }
    
    // Fallback to generic network error
    return error?.message;
  };

  // Check if user is authenticated
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { accessToken } = getStoredTokens();
      
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Check profile status using your existing API
      const profileData = await usersAPI.getProfileStatus();
      
      if (profileData && profileData?.data?.user) {
        setUser(profileData?.data?.user);
        setIsAuthenticated(true);
        
        // Cache user data
        localStorage.setItem('userData', JSON.stringify(profileData?.data?.user));
      } else {
        // Invalid token or no user data
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // If it's a 401 error, try to refresh token
      if (error.message.includes('401')) {
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh access token using your existing API
  const refreshAccessToken = async () => {
    try {
      const refreshData = await authAPI.verifyToken();
      
      if (refreshData && refreshData.accessToken) {
        storeTokens(refreshData.accessToken, refreshData.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  };

  // Login function using your existing API
  const login = async (email, password) => {
    try {
      const loginData = await usersAPI.login({ email, password });
      
      // Check if login was successful
      if (loginData && loginData.success !== false) {
        // Handle different response structures
        const accessToken = loginData?.data?.accessToken || loginData?.data?.token;
        const refreshToken = loginData?.data?.refreshToken;
        const userData = loginData?.user || loginData?.data?.user || loginData;
        
        if (accessToken) {
          storeTokens(accessToken, refreshToken);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('userData', JSON.stringify(userData));
          return { success: true, user: userData };
        } else {
          return { success: false, error: loginData.message || 'Login failed - no token received' };
        }
      } else {
        // Login failed but we got a response
        return { success: false, error: loginData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.log('Error response:', error?.response);
      console.log('Error response data:', error?.response?.data);
      
      // Extract the proper error message from API response
      const errorMessage = extractApiErrorMessage(error);
      
      return { success: false, error: errorMessage };
    }
  };

  // Register function using your existing API
  const register = async (userData) => {
    try {
      const signupData = await usersAPI.signUp(userData);

      if (signupData && signupData.success !== false) {
        // Handle different response structures
        const accessToken = signupData.accessToken || signupData.token;
        const refreshToken = signupData.refreshToken;
        const user = signupData.user || signupData.data || signupData;

        // Some registration flows might auto-login, others might require verification
        if (accessToken) {
          storeTokens(accessToken, refreshToken);
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('userData', JSON.stringify(user));
        }
        
        return { 
          success: true, 
          user: user,
          requiresVerification: !accessToken,
          message: signupData.message || 'Registration successful'
        };
      } else {
        return { success: false, error: signupData.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract error message from API response
      let errorMessage = 'Network error. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else {
        const status = error?.response?.status;
        if (status === 409 || error.message.includes('conflict')) {
          errorMessage = 'Email already exists';
        } else if (status === 400 || error.message.includes('400')) {
          errorMessage = 'Please check your registration details';
        } else if (status === 422 || error.message.includes('422')) {
          errorMessage = 'Invalid input data';
        } else if (status >= 500 || error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later';
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Create profile function using your existing API
  const createProfile = async (profileData) => {
    try {
      const response = await usersAPI.createProfile(profileData);
      
      if (response && response.success !== false) {
        // Update user data with new profile
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message || 'Profile creation failed' };
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      return { success: false, error: 'Failed to create profile. Please try again.' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try to call logout endpoint to invalidate token on server
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local data
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      // Use the updateUser method from your existing API
      const response = await usersAPI.updateUser(user.id, updatedData);

      if (response && response.success !== false) {
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message || 'Update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Enhanced API call function that works with your existing API structure
  const authenticatedApiCall = async (apiFunction, ...args) => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      // If token expired, try to refresh and retry
      if (error.message.includes('401')) {
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          // Retry the original API call
          return await apiFunction(...args);
        } else {
          // Refresh failed, logout user
          await logout();
          throw new Error('Session expired. Please login again.');
        }
      }
      throw error;
    }
  };

  // Get user profile data
  const getUserProfile = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    try {
      const profileData = await usersAPI.getProfileStatus();
      return profileData;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }, [isAuthenticated]);

  // Update card details
  const updateCardDetails = async (cardData) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await usersAPI.updateCardDetails(user.id, cardData);
      
      if (response && response.success !== false) {
        // Update user data with new card details
        const updatedUser = { ...user, cardDetails: response.cardDetails };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message || 'Failed to update card details' };
      }
    } catch (error) {
      console.error('Card update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up token refresh interval (optional)
  useEffect(() => {
    if (isAuthenticated) {
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      const interval = setInterval(() => {
        refreshAccessToken();
      }, 14 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' && !e.newValue && isAuthenticated) {
        // Token was removed in another tab, logout this tab too
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const contextValue = {
    // State
    user,
    isLoading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    createProfile,
    updateProfile,
    updateCardDetails,
    checkAuthStatus,
    getUserProfile,
    
    // Utilities
    authenticatedApiCall, // For making authenticated API calls
    getStoredTokens,
    clearTokens,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};