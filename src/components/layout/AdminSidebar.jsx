// components/Layout/Sidebar.jsx
import React from 'react';
import {
  BarChart3,
  Users,
  Store,
  Percent,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Phone,
  PhoneIcon,
} from 'lucide-react';

const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  // Menu items matching your AdminDashboard tabs
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'shops', label: 'Shops Management', icon: Store },
    { id: 'otp', label: 'OTP Management', icon: PhoneIcon },
    ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear admin token and user data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Redirect to admin login
      window.location.href = '/admin/login';
    }
  };

  return (
    <div
      className={`${isOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white transition-all duration-300 flex flex-col h-full shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Pravasi Admin</h1>
              <p className="text-xs text-gray-400">Loyalty System</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Admin User Info (when expanded) */}
      {isOpen && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-400 truncate">
                admin@pravasi.com
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
              />

              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        {/* System Status (when expanded) */}
        {isOpen && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-400 mb-2">System Status</div>
            <div className="flex justify-between text-xs">
              <span className="text-green-400">● Online</span>
              <span className="text-gray-300">All systems operational</span>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 group"
          title={!isOpen ? 'Logout' : ''}
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-white" />
          {isOpen && <span className="ml-3 font-medium">Logout</span>}
        </button>

        {/* Version Info (when expanded) */}
        {isOpen && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
