import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/AdminSidebar';
import Dashboard from '../../components/dashboard/Dashboard';
import AdminHeader from '../../components/layout/AdminHeader';
import UsersManagement from './UsersManagement';
import ShopsManagement from './ShopsManagement';
import OTPSessionsManagement from './OTPSessionsManagement';
import { otpAdminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Real data states
  const [stats, setStats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalShops: 156,
    pendingShops: 12,
    totalDiscounts: 45670,
    monthlyGrowth: 12.5,
    // OTP Stats - will be populated from API
    totalOTPs: 0,
    verifiedOTPs: 0,
    todayOTPs: 0,
    verificationRate: 0
  });

  const [users] = useState([
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      phone: '+1234567890', 
      status: 'active', 
      cardNumber: 'PL001234', 
      discountUsed: 250, 
      lastLogin: '2025-06-01' 
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      phone: '+1234567891', 
      status: 'inactive', 
      cardNumber: 'PL001235', 
      discountUsed: 180, 
      lastLogin: '2025-05-28' 
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      phone: '+1234567892', 
      status: 'active', 
      cardNumber: 'PL001236', 
      discountUsed: 450, 
      lastLogin: '2025-06-02' 
    },
  ]);

  const [shops] = useState([
    { 
      id: 1, 
      name: 'Electronics Hub', 
      owner: 'Mike Johnson', 
      email: 'mike@electronichub.com', 
      status: 'approved', 
      discountOffered: 10, 
      totalPurchases: 45000, 
      registrationDate: '2025-01-15' 
    },
    { 
      id: 2, 
      name: 'Fashion Store', 
      owner: 'Sarah Wilson', 
      email: 'sarah@fashionstore.com', 
      status: 'pending', 
      discountOffered: 15, 
      totalPurchases: 0, 
      registrationDate: '2025-06-01' 
    },
    { 
      id: 3, 
      name: 'Home Decor Plus', 
      owner: 'Robert Brown', 
      email: 'robert@homedecor.com', 
      status: 'pending', 
      discountOffered: 12, 
      totalPurchases: 0, 
      registrationDate: '2025-05-29' 
    },
  ]);

  // Real OTP Sessions data from API
  const [otpSessions, setOtpSessions] = useState([]);
  const [otpStats, setOtpStats] = useState({});
  const [otpLoading, setOtpLoading] = useState(false);

  const [discountPolicies] = useState({
    global: [
      { name: 'Standard Discount', description: 'Default discount for all purchases', value: '5%' },
      { name: 'Premium Discount', description: 'For purchases above ₹10,000', value: '10%' },
    ],
    tiers: [
      { name: 'Bronze', description: '₹0 - ₹5,000', value: '3%' },
      { name: 'Silver', description: '₹5,001 - ₹15,000', value: '5%' },
      { name: 'Gold', description: '₹15,001+', value: '8%' },
    ]
  });

  const [contentData] = useState({
    banners: { 'Active Banners': 3, 'Last Updated': '2025-05-30' },
    blogs: { 'Published': 12, 'Drafts': 3 },
    faq: { 'FAQ Items': 25, 'Help Articles': 8 }
  });

  const [reportData] = useState({
    topUsers: [
      { name: 'John Doe', subtitle: 'PL001234', value: '₹25,000' },
      { name: 'Jane Smith', subtitle: 'PL001235', value: '₹18,000' },
      { name: 'Mike Johnson', subtitle: 'PL001236', value: '₹15,000' },
    ],
    topShops: [
      { name: 'Electronics Hub', subtitle: '450 transactions', value: '₹2,250,000' },
      { name: 'Fashion Store', subtitle: '320 transactions', value: '₹1,600,000' },
      { name: 'Home Decor', subtitle: '280 transactions', value: '₹1,400,000' },
    ]
  });

  // Fetch dashboard stats including OTP data
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [otpStatsResponse] = await Promise.all([
        otpAdminAPI.getOTPStatistics()
      ]);

      if (otpStatsResponse.success) {
        const otpData = otpStatsResponse.data;
        setStats(prevStats => ({
          ...prevStats,
          totalOTPs: otpData.total || 0,
          verifiedOTPs: otpData.verified || 0,
          todayOTPs: otpData.today || 0,
          verificationRate: otpData.verificationRate || 0
        }));
        setOtpStats(otpData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch OTP sessions data
  const fetchOTPSessions = async (params = {}) => {
    try {
      setOtpLoading(true);
      setError(null);
      
      const defaultParams = {
        page: 1,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        ...params
      };

      const response = await otpAdminAPI.getAllOTPSessions(defaultParams);
      
      if (response.success) {
        setOtpSessions(response.data.otpSessions || []);
        
        // Update stats if available
        if (response.data.statistics) {
          setOtpStats(response.data.statistics);
          setStats(prevStats => ({
            ...prevStats,
            totalOTPs: response.data.statistics.total || 0,
            verifiedOTPs: response.data.statistics.verified || 0,
            todayOTPs: response.data.statistics.today || 0,
            verificationRate: response.data.statistics.verificationRate || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching OTP sessions:', error);
      setError('Failed to fetch OTP sessions');
      
      // Show user-friendly error message
      if (error.message.includes('401')) {
        alert('Session expired. Please log in again.');
      } else if (error.message.includes('403')) {
        alert('You do not have permission to access OTP sessions.');
      } else {
        alert('Failed to fetch OTP sessions. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchDashboardStats();
    
    // Fetch OTP sessions if on OTP tab
    if (activeTab === 'otp') {
      fetchOTPSessions();
    }
  }, []);

  // Fetch OTP sessions when switching to OTP tab
  useEffect(() => {
    if (activeTab === 'otp') {
      fetchOTPSessions();
    }
  }, [activeTab]);

  // Event handlers
  const handleUserAction = (action, user) => {
    console.log('User action:', action, user);
    switch (action) {
      case 'add':
        alert('Add User functionality to be implemented');
        break;
      case 'view':
        alert(`Viewing user: ${user.name}`);
        break;
      case 'edit':
        alert(`Editing user: ${user.name}`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
          alert('User deleted successfully');
        }
        break;
      default:
        break;
    }
  };

  const handleShopAction = (action, shop) => {
    console.log('Shop action:', action, shop);
    switch (action) {
      case 'approve':
        alert(`Shop approved: ${typeof shop === 'object' ? shop.name : 'Shop ID: ' + shop}`);
        break;
      case 'reject':
        alert(`Shop rejected: ${typeof shop === 'object' ? shop.name : 'Shop ID: ' + shop}`);
        break;
      case 'view':
        alert(`Viewing shop: ${shop.name}`);
        break;
      case 'edit':
        alert(`Editing shop: ${shop.name}`);
        break;
      default:
        break;
    }
  };

  // Enhanced OTP Session event handlers with real API calls
  const handleOTPAction = async (action, session) => {
    console.log('OTP action:', action, session);
    
    try {
      setOtpLoading(true);
      
      switch (action) {
        case 'view':
          // View action - could open a detailed modal
          alert(`Viewing OTP session: ${session.sessionId}`);
          break;
          
        case 'expire':
          if (window.confirm(`Are you sure you want to expire OTP session ${session.sessionId}?`)) {
            const response = await otpAdminAPI.expireOTPSession(session.sessionId);
            if (response.success) {
              alert('OTP session expired successfully');
              // Refresh the OTP sessions list
              await fetchOTPSessions();
            } else {
              alert('Failed to expire OTP session');
            }
          }
          break;
          
        case 'resend':
          if (window.confirm(`Resend OTP to ${session.contactInfo}?`)) {
            try {
              const response = await otpAdminAPI.adminResendOTP(session.userId, {
                otpType: session.otpType,
                purpose: session.purpose,
                contactInfo: session.contactInfo
              });
              
              if (response.success) {
                alert(`OTP resent successfully to ${session.contactInfo}`);
                // Refresh the OTP sessions list
                await fetchOTPSessions();
              } else {
                alert(response.message || 'Failed to resend OTP');
              }
            } catch (error) {
              console.error('Error resending OTP:', error);
              alert('Failed to resend OTP. Please try again.');
            }
          }
          break;
          
        case 'export':
          try {
            await downloadOTPSessionsCSV();
            alert('OTP sessions data exported successfully');
          } catch (error) {
            console.error('Error exporting OTP sessions:', error);
            alert('Failed to export OTP sessions data');
          }
          break;
          
        case 'refresh':
          alert('Refreshing OTP sessions data...');
          await fetchOTPSessions();
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling OTP action:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePolicyAction = (action, policy) => {
    console.log('Policy action:', action, policy);
    switch (action) {
      case 'new':
        alert('Create new discount rule');
        break;
      case 'edit':
        alert(`Editing ${policy} policies`);
        break;
      default:
        break;
    }
  };

  const handleContentAction = (action) => {
    console.log('Content action:', action);
    switch (action) {
      case 'banners':
        alert('Managing homepage banners');
        break;
      case 'blogs':
        alert('Creating new blog post');
        break;
      case 'faq':
        alert('Managing FAQ section');
        break;
      default:
        break;
    }
  };

  const handleExport = () => {
    console.log('Exporting reports...');
    alert('Export functionality to be implemented');
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users Management',
      shops: 'Shops Management',
      otp: 'OTP Sessions',
      discounts: 'Discounts & Rules',
      content: 'Content Management',
      reports: 'Reports & Analytics',
      settings: 'Settings'
    };
    return titles[activeTab] || 'Dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats}
            users={users}
            shops={shops}
            loading={loading}
            onShopApprove={(id) => handleShopAction('approve', id)}
            onShopReject={(id) => handleShopAction('reject', id)}
          />
        );
      case 'users':
        return <UsersManagement users={users} onUserAction={handleUserAction} />;
      case 'shops':
        return <ShopsManagement shops={shops} onShopAction={handleShopAction} />;
      case 'otp':
        return (
          <OTPSessionsManagement 
            otpSessions={otpSessions}
            loading={otpLoading}
            error={error}
            onOTPAction={handleOTPAction}
            onRefresh={() => fetchOTPSessions()}
            stats={otpStats}
          />
        );
      case 'discounts':
        // return <DiscountsRules discountPolicies={discountPolicies} onPolicyAction={handlePolicyAction} />;
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Discounts & Rules</h2>
            <p className="text-gray-600 mt-2">Discounts management coming soon...</p>
          </div>
        );
      case 'content':
        // return <ContentManagement contentData={contentData} onContentAction={handleContentAction} />;
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
            <p className="text-gray-600 mt-2">Content management coming soon...</p>
          </div>
        );
      case 'reports':
        // return <ReportsAnalytics reportData={reportData} onExport={handleExport} />;
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600 mt-2">Reports and analytics coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-2">Settings page coming soon...</p>
          </div>
        );
      default:
        return (
          <Dashboard
            stats={stats}
            users={users}
            shops={shops}
            loading={loading}
            onShopApprove={(id) => handleShopAction('approve', id)}
            onShopReject={(id) => handleShopAction('reject', id)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-900 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;