// components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Percent,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Eye,
  UserCheck,
  ShoppingBag,
  Calendar,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const Dashboard = ({ stats, users, shops, onShopApprove, onShopReject }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate additional metrics
  const pendingShops = shops.filter((shop) => shop.status === 'pending');
  const approvedShops = shops.filter((shop) => shop.status === 'approved');
  const recentUsers = users.filter((user) => {
    const loginDate = new Date(user.lastLogin);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return loginDate > thirtyDaysAgo;
  });

  const totalDiscountUsed = users.reduce(
    (sum, user) => sum + (user.discountUsed || 0),
    0
  );
  const totalShopRevenue = shops.reduce(
    (sum, shop) => sum + (shop.totalPurchases || 0),
    0
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Stats card component
  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <p
                className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}
              >
                {change > 0 ? '+' : ''}
                {change}% from last month
              </p>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your loyalty system
            today.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {currentTime.toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={8.2}
          trend="up"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change={stats.monthlyGrowth}
          trend="up"
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Total Shops"
          value={stats.totalShops}
          change={5.1}
          trend="up"
          icon={Store}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Discounts"
          value={`₹${stats.totalDiscounts.toLocaleString()}`}
          change={18.7}
          trend="up"
          icon={Percent}
          color="bg-orange-500"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Approvals</span>
              <span className="font-semibold text-yellow-600">
                {pendingShops.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Shops</span>
              <span className="font-semibold text-green-600">
                {approvedShops.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Active Users</span>
              <span className="font-semibold text-blue-600">
                {recentUsers.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="font-semibold text-purple-600">
                ₹{totalShopRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              System Health
            </h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Fast
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-gray-900">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Today's Activity
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Registrations</span>
              <span className="font-semibold text-blue-600">+12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Transactions</span>
              <span className="font-semibold text-green-600">+148</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Discounts Applied</span>
              <span className="font-semibold text-purple-600">+67</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Generated</span>
              <span className="font-semibold text-orange-600">₹45,230</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent User Activity
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{user.discountUsed}
                  </p>
                  <p className="text-xs text-gray-500">{user.lastLogin}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Shop Approvals */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Shop Approvals
            </h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pendingShops.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {pendingShops.length > 0 ? (
              pendingShops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Store className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {shop.name}
                      </p>
                      <p className="text-xs text-gray-500">{shop.owner}</p>
                      <p className="text-xs text-gray-500">
                        Discount: {shop.discountOffered}%
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onShopApprove(shop.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onShopReject(shop.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-sm">No pending approvals</p>
                <p className="text-xs text-gray-400">
                  All shops are up to date!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Top Performing Shops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {[
              {
                id: 1,
                user: 'John Doe',
                shop: 'Electronics Hub',
                amount: 1250,
                discount: 125,
                time: '2 min ago',
              },
              {
                id: 2,
                user: 'Jane Smith',
                shop: 'Fashion Store',
                amount: 850,
                discount: 85,
                time: '5 min ago',
              },
              {
                id: 3,
                user: 'Mike Johnson',
                shop: 'Home Decor',
                amount: 2100,
                discount: 210,
                time: '8 min ago',
              },
              {
                id: 4,
                user: 'Sarah Wilson',
                shop: 'Electronics Hub',
                amount: 750,
                discount: 75,
                time: '12 min ago',
              },
            ].map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {transaction.user}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.shop}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{transaction.amount}
                  </p>
                  <p className="text-xs text-green-600">
                    -₹{transaction.discount} discount
                  </p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Shops */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Performing Shops
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {shops
              .filter((shop) => shop.status === 'approved')
              .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
              .slice(0, 4)
              .map((shop, index) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-yellow-100'
                          : index === 1
                            ? 'bg-gray-100'
                            : index === 2
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          index === 0
                            ? 'text-yellow-600'
                            : index === 1
                              ? 'text-gray-600'
                              : index === 2
                                ? 'text-orange-600'
                                : 'text-blue-600'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {shop.name}
                      </p>
                      <p className="text-xs text-gray-500">{shop.owner}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{(shop.totalPurchases || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {shop.discountOffered}% discount
                    </p>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      <Eye className="h-3 w-3 inline mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      {pendingShops.length > 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                High Number of Pending Approvals
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                You have {pendingShops.length} shops waiting for approval.
                Consider reviewing them to improve merchant satisfaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
