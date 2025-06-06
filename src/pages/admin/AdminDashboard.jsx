import React, { useState } from 'react';
import Sidebar from '../../components/layout/AdminSidebar';
import Dashboard from '../../components/dashboard/Dashboard';
import AdminHeader from '../../components/layout/AdminHeader';
import UsersManagement from './UsersManagement';
import ShopsManagement from './ShopsManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Mock data states
  const [stats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalShops: 156,
    pendingShops: 12,
    totalDiscounts: 45670,
    monthlyGrowth: 12.5
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

  // Event handlers
  const handleUserAction = (action, user) => {
    console.log('User action:', action, user);
    switch (action) {
      case 'add':
        // Open add user modal/form
        alert('Add User functionality to be implemented');
        break;
      case 'view':
        // Open user details modal
        alert(`Viewing user: ${user.name}`);
        break;
      case 'edit':
        // Open edit user modal/form
        alert(`Editing user: ${user.name}`);
        break;
      case 'delete':
        // Show confirmation dialog and delete user
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
            onShopApprove={(id) => handleShopAction('approve', id)}
            onShopReject={(id) => handleShopAction('reject', id)}
          />
        );
      case 'users':
        return <UsersManagement users={users} onUserAction={handleUserAction} />;
      case 'shops':
        return <ShopsManagement shops={shops} onShopAction={handleShopAction} />;
      case 'discounts':
        // return <DiscountsRules discountPolicies={discountPolicies} onPolicyAction={handlePolicyAction} />;
      case 'content':
        // return <ContentManagement contentData={contentData} onContentAction={handleContentAction} />;
      case 'reports':
        // return <ReportsAnalytics reportData={reportData} onExport={handleExport} />;
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;