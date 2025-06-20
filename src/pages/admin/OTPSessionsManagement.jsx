import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Phone,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  Send
} from 'lucide-react';

const OTPSessionsManagement = ({ otpSessions, onOTPAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  // Calculate statistics
  const getStatistics = () => {
    const total = otpSessions.length;
    const verified = otpSessions.filter(session => session.isVerified).length;
    const expired = otpSessions.filter(session => {
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      return expiresAt < now && !session.isVerified;
    }).length;
    const pending = total - verified - expired;
    const emailOTPs = otpSessions.filter(session => session.otpType === 'email').length;
    const smsOTPs = otpSessions.filter(session => session.otpType === 'sms').length;

    return {
      total,
      verified,
      expired,
      pending,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : 0,
      emailOTPs,
      smsOTPs
    };
  };

  const stats = getStatistics();

  // Filter sessions based on search and filters
  const filteredSessions = otpSessions.filter(session => {
    const matchesSearch = 
      session.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.contactInfo.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatusFilter = true;
    if (selectedFilter !== 'all') {
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      switch (selectedFilter) {
        case 'verified':
          matchesStatusFilter = session.isVerified;
          break;
        case 'pending':
          matchesStatusFilter = !session.isVerified && expiresAt > now;
          break;
        case 'expired':
          matchesStatusFilter = !session.isVerified && expiresAt < now;
          break;
        default:
          matchesStatusFilter = true;
      }
    }

    const matchesTypeFilter = typeFilter === 'all' || session.otpType === typeFilter;
    const matchesPurposeFilter = purposeFilter === 'all' || session.purpose === purposeFilter;

    return matchesSearch && matchesStatusFilter && matchesTypeFilter && matchesPurposeFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (session) => {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (session.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Verified
        </span>
      );
    } else if (expiresAt < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={12} className="mr-1" />
          Expired
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          Pending
        </span>
      );
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    return type === 'email' ? (
      <Mail size={16} className="text-blue-500" />
    ) : (
      <MessageSquare size={16} className="text-green-500" />
    );
  };

  // Statistics cards
  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OTP Sessions Management</h1>
          <p className="text-gray-600">Monitor and manage OTP verification sessions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onOTPAction('refresh')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onOTPAction('export')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total OTPs"
          value={stats.total}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="Verified"
          value={stats.verified}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Expired"
          value={stats.expired}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.verificationRate}%`}
          icon={RefreshCw}
          color="purple"
          subtitle={`${stats.emailOTPs} Email, ${stats.smsOTPs} SMS`}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, email, session ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
            >
              <option value="all">All Purposes</option>
              <option value="card_activation">Card Activation</option>
              <option value="email_verification">Email Verification</option>
              <option value="phone_verification">Phone Verification</option>
              <option value="password_reset">Password Reset</option>
            </select>
          </div>
        </div>
      </div>

      {/* OTP Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>No OTP sessions found</p>
                  </td>
                </tr>
              ) : (
                currentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {session.sessionId.slice(0, 12)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.contactInfo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(session.otpType)}
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {session.otpType}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {session.purpose.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{session.verificationAttempts}</span>
                        <span className="text-gray-500">/{session.maxAttempts}</span>
                      </div>
                      {session.resendCount > 0 && (
                        <div className="text-xs text-gray-500">
                          Resent: {session.resendCount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!session.isVerified && (
                          <>
                            <button
                              onClick={() => onOTPAction('resend', session)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Resend OTP"
                            >
                              <Send size={16} />
                            </button>
                            <button
                              onClick={() => onOTPAction('expire', session)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Expire Session"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredSessions.length)}</span> of{' '}
                  <span className="font-medium">{filteredSessions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">OTP Session Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">{selectedSession.sessionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedSession)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedSession.otpCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedSession.otpType}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.contactInfo}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedSession.purpose.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expires At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedSession.expiresAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attempts</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSession.verificationAttempts}/{selectedSession.maxAttempts}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resends</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSession.resendCount}/{selectedSession.maxResends}</p>
                  </div>
                </div>

                {selectedSession.user && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">User Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">{selectedSession.user.fullName}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedSession.user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedSession.ipAddress && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Technical Details</h4>
                    <div>
                      <label className="block text-xs text-gray-500">IP Address</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedSession.ipAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {!selectedSession.isVerified && (
                  <>
                    <button
                      onClick={() => {
                        onOTPAction('resend', selectedSession);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Resend OTP
                    </button>
                    <button
                      onClick={() => {
                        onOTPAction('expire', selectedSession);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Expire Session
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPSessionsManagement;