// components/Shops/ShopDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Edit,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  BarChart3,
  Settings,
  Send,
  AlertTriangle,
  Building,
  CreditCard,
  FileText,
  Clock,
  DollarSign,
  Shield,
  Copy,
  ExternalLink
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { shopsAPI } from '../../services/api';

const ShopDetailsModal = ({ isOpen, shop, onClose, onEdit, onDiscountSettings }) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });

  useEffect(() => {
    if (isOpen && shop?.id) {
      fetchAnalytics();
    }
  }, [isOpen, shop?.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await shopsAPI.getShopAnalytics(shop.id);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      await shopsAPI.sendEmailToShop(shop.id, emailData);
      setEmailModalOpen(false);
      setEmailData({ subject: '', message: '' });
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'blocked': return 'danger';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Store className="h-5 w-5 mr-2 text-blue-600" />
          Shop Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Shop Name</label>
            <p className="text-gray-900 font-medium">{shop.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="text-gray-900">{shop.category || 'Not specified'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-gray-900">{shop.description || 'No description provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Discount Offered</label>
            <p className="font-semibold text-green-600">{shop.discountOffered}%</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(shop.status)}>
                {shop.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Owner Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Owner Name</label>
            <p className="text-gray-900 font-medium">{shop.ownerName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email Address</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.email}</p>
              <button 
                onClick={() => copyToClipboard(shop.email)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone Number</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.phone}</p>
              <button 
                onClick={() => copyToClipboard(shop.phone)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Address Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-gray-900">{shop.address}</p>
          </div>
          {shop.location && (
            <div>
              <label className="text-sm font-medium text-gray-500">Location/Landmark</label>
              <p className="text-gray-900">{shop.location}</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(shop.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(shop.totalPurchases)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Last Activity</p>
                <p className="text-sm font-bold text-purple-700">
                  {shop.lastActivity ? formatDate(shop.lastActivity) : 'Never'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      {/* Business Documents */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Business Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Registration Number</label>
            <p className="text-gray-900">{shop.registrationNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">GST Number</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.gstNumber || 'Not provided'}</p>
              {shop.gstNumber && (
                <button 
                  onClick={() => copyToClipboard(shop.gstNumber)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">PAN Number</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.panNumber || 'Not provided'}</p>
              {shop.panNumber && (
                <button 
                  onClick={() => copyToClipboard(shop.panNumber)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          Bank Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Bank Account Number</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.bankAccountNumber || 'Not provided'}</p>
              {shop.bankAccountNumber && (
                <button 
                  onClick={() => copyToClipboard(shop.bankAccountNumber)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">IFSC Code</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{shop.ifscCode || 'Not provided'}</p>
              {shop.ifscCode && (
                <button 
                  onClick={() => copyToClipboard(shop.ifscCode)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Details */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Registration Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Registration Date</label>
            <p className="text-gray-900">{formatDate(shop.registrationDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Active Status</label>
            <Badge variant={shop.isActive ? 'success' : 'danger'}>
              {shop.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovalTab = () => (
    <div className="space-y-6">
      {/* Approval History */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Approval History
        </h3>
        
        {shop.status === 'approved' && shop.approvedBy && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Approved</span>
            </div>
            <div className="text-sm text-green-700">
              <p>Approved on: {formatDate(shop.approvedDate)}</p>
              <p>Approved by: Admin ID {shop.approvedBy}</p>
            </div>
          </div>
        )}

        {shop.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">Rejected</span>
            </div>
            <div className="text-sm text-red-700">
              <p>Rejected on: {formatDate(shop.rejectedDate)}</p>
              <p>Rejected by: Admin ID {shop.rejectedBy}</p>
              {shop.rejectionReason && (
                <div className="mt-2">
                  <p className="font-medium">Reason:</p>
                  <p className="bg-white p-2 rounded border">{shop.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {shop.status === 'blocked' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <Ban className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">Blocked</span>
            </div>
            <div className="text-sm text-orange-700">
              <p>Blocked on: {formatDate(shop.blockedDate)}</p>
              <p>Blocked by: Admin ID {shop.blockedBy}</p>
              {shop.blockReason && (
                <div className="mt-2">
                  <p className="font-medium">Reason:</p>
                  <p className="bg-white p-2 rounded border">{shop.blockReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {shop.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Pending Approval</span>
            </div>
            <p className="text-sm text-yellow-700">
              This shop is waiting for admin approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEmailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Send Email to Shop</h3>
          <button
            onClick={() => setEmailModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-4 border-t">
          <Button variant="secondary" onClick={() => setEmailModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendEmail}
            disabled={!emailData.subject || !emailData.message}
          >
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !shop) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8 min-h-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{shop.name}</h2>
                <p className="text-gray-600">Owner: {shop.ownerName}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(shop.status)}>
                {shop.status}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b bg-gray-50">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Store },
                { id: 'business', label: 'Business Info', icon: Building },
                { id: 'approval', label: 'Approval Status', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'business' && renderBusinessTab()}
            {activeTab === 'approval' && renderApprovalTab()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setEmailModalOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="secondary" onClick={() => window.open(`/admin/shops/${shop.id}/analytics`, '_blank')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="secondary" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Shop
              </Button>
              <Button variant="primary" onClick={onDiscountSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Discount Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && renderEmailModal()}
    </>
  );
};

export default ShopDetailsModal;