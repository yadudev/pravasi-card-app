import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  Download,
  RefreshCw,
  Store,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Settings,
  UserPlus,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { shopsAPI } from '../../services/api';
import NewShopRegistrationModal from '../../components/shops/NewShopRegistrationModal';
import ShopDetailsModal from '../../components/shops/ShopDetailsModal';
import ShopEditModal from '../../components/shops/ShopEditModal';
import ShopStatusModal from '../../components/shops/ShopStatusModal';
import ShopApprovalModal from './ShopApprovalModal';

const ShopsManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShops, setTotalShops] = useState(0);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNewShopModal, setShowNewShopModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedShop, setSelectedShop] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'block', 'activate'

  // Fetch shops from API
  const fetchShops = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      };

      const response = await shopsAPI.getAllShops(params);
      console.log({ response });
      setShops(response.data.shops);
      setTotalPages(response.data.pagination.totalPages);
      setTotalShops(response.data.pagination.totalItems);
      setCurrentPage(response.data.pagination.currentPage);
    } catch (error) {
      console.error('Error fetching shops:', error);
      alert('Failed to fetch shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchShops(1, value, statusFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchShops(1, searchTerm, status);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchShops(page, searchTerm, statusFilter);
  };

  // Handle shop actions
  const handleViewShop = async (shop) => {
    setSelectedShop(shop);
    try {
      const response = await shopsAPI.getShopById(shop.id);
      setSelectedShop(response.data);
    } catch (error) {
      console.error('Error fetching shop details:', error);
    }
    setShowDetailsModal(true);
  };

  const handleEditShop = (shop) => {
    setSelectedShop(shop);
    setShowEditModal(true);
  };

  // NEW: Handle approval/rejection actions
  const handleApprovalAction = (shop, action) => {
    setSelectedShop(shop);
    setActionType(action);
    setShowApprovalModal(true);
  };

  // NEW: Handle status change actions (block/activate)
  const handleStatusAction = (shop, action) => {
    setSelectedShop(shop);
    setActionType(action);
    setShowStatusModal(true);
  };

  const handleViewPurchases = (shop) => {
    setSelectedShop(shop);
    setShowPurchasesModal(true);
  };

  const handleDiscountSettings = (shop) => {
    setSelectedShop(shop);
    setShowDiscountModal(true);
  };

  // NEW: Handle new shop registration
  const handleNewShopRegistration = () => {
    setShowNewShopModal(true);
  };

  // Handle modal close and refresh
  const handleModalClose = (shouldRefresh = false) => {
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowApprovalModal(false);
    setShowPurchasesModal(false);
    setShowDiscountModal(false);
    setShowNewShopModal(false);
    setShowStatusModal(false);
    setSelectedShop(null);
    setActionType('');

    if (shouldRefresh) {
      fetchShops(currentPage, searchTerm, statusFilter);
    }
  };

  const handleExport = async () => {
    try {
      const response = await shopsAPI.exportShops({
        search: searchTerm,
        status: statusFilter,
      });
      // Handle file download
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shops_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting shops:', error);
      alert('Failed to export shops. Please try again.');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'blocked':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Calculate stats
  const stats = {
    total: totalShops,
    pending: shops.filter((s) => s.status === 'pending').length,
    approved: shops.filter((s) => s.status === 'approved').length,
    blocked: shops.filter((s) => s.status === 'blocked').length,
    rejected: shops.filter((s) => s.status === 'rejected').length,
  };

  // Initial load
  useEffect(() => {
    fetchShops();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops Management</h1>
          <p className="text-gray-600">
            Manage shop registrations, approvals, and discount settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleNewShopRegistration}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Shop
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      {/* Filters Section */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by shop name, owner, email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="blocked">Blocked</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => fetchShops(currentPage, searchTerm, statusFilter)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      {/* Stats Cards - Updated with new stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Total Shops Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">
                Total Shops
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {stats?.total?.toLocaleString()}
              </p>
              <p className="text-blue-600 text-xs mt-1">All registered</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full shadow-lg">
              <Store className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        {/* Pending Approval Card */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium mb-1">
                Pending Approval
              </p>
              <p className="text-3xl font-bold text-amber-900">
                {stats.pending}
              </p>
              <p className="text-amber-600 text-xs mt-1">Awaiting review</p>
            </div>
            <div className="bg-amber-500 p-3 rounded-full shadow-lg">
              <Clock className="h-7 w-7 text-white" />
            </div>
          </div>
          {stats.pending > 0 && (
            <div className="mt-3 flex items-center">
              <div className="h-1 w-full bg-amber-200 rounded-full">
                <div
                  className="h-1 bg-amber-500 rounded-full animate-pulse"
                  style={{
                    width: `${Math.min((stats.pending / stats.total) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Approved Shops Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium mb-1">
                Approved Shops
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {stats.approved}
              </p>
              <p className="text-emerald-600 text-xs mt-1">Active & verified</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-full shadow-lg">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
          </div>
          {stats.total > 0 && (
            <div className="mt-3 flex items-center">
              <div className="h-1 w-full bg-emerald-200 rounded-full">
                <div
                  className="h-1 bg-emerald-500 rounded-full"
                  style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-emerald-600 font-medium">
                {stats.total > 0
                  ? Math.round((stats.approved / stats.total) * 100)
                  : 0}
                %
              </span>
            </div>
          )}
        </div>

        {/* Blocked Shops Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium mb-1">
                Blocked Shops
              </p>
              <p className="text-3xl font-bold text-red-900">{stats.blocked}</p>
              <p className="text-red-600 text-xs mt-1">Access revoked</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full shadow-lg">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
          </div>
          {stats.blocked > 0 && (
            <div className="mt-3 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full inline-block">
              Requires attention
            </div>
          )}
        </div>

        {/* Rejected Shops Card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Rejected</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.rejected}
              </p>
              <p className="text-gray-600 text-xs mt-1">Registration denied</p>
            </div>
            <div className="bg-gray-500 p-3 rounded-full shadow-lg">
              <XCircle className="h-7 w-7 text-white" />
            </div>
          </div>
          {stats.rejected > 0 && (
            <div className="mt-3 text-xs text-gray-600">Can be re-approved</div>
          )}
        </div>
      </div>
      {/* Shops Table - Enhanced with new action buttons */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shops found
            </h3>
            <p className="text-gray-600">
              No shops match your current search criteria.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Discount Offered</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {shop.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shop.ownerName}
                      </div>
                      <div className="text-sm text-gray-500">{shop.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {shop.category || 'General'}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {shop.discountOffered}%
                  </TableCell>
                  <TableCell>
                    ₹{shop.totalPurchases?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(shop.status)}>
                      {shop.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(shop.registrationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {/* View Details */}
                      <button
                        onClick={() => handleViewShop(shop)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Shop */}
                      <button
                        onClick={() => handleEditShop(shop)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Edit Shop"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* 🚨 APPROVAL ACTIONS FOR PENDING AND REJECTED SHOPS */}
                      {(shop.status === 'pending' ||
                        shop.status === null ||
                        shop.status === 'rejected') && (
                        <>
                          <button
                            onClick={() =>
                              handleApprovalAction(shop, 'approve')
                            }
                            className={`text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 border border-green-300 ${
                              shop.status === 'rejected'
                                ? 'bg-green-100 ring-2 ring-green-300' // Extra emphasis for re-approval
                                : 'bg-green-50'
                            }`}
                            title={
                              shop.status === 'rejected'
                                ? 'Re-approve Rejected Shop'
                                : 'Approve Shop'
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>

                          {/* Only show reject button for pending/null shops, not for already rejected */}
                          {shop.status !== 'rejected' && (
                            <button
                              onClick={() =>
                                handleApprovalAction(shop, 'reject')
                              }
                              className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 border border-red-300 bg-red-50"
                              title="Reject Shop"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Block Action for Approved Shops */}
                      {shop.status === 'approved' && (
                        <button
                          onClick={() => handleStatusAction(shop, 'block')}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Block Shop"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                      {/* Activate Action for Blocked Shops */}
                      {shop.status === 'blocked' && (
                        <button
                          onClick={() => handleStatusAction(shop, 'activate')}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Activate Shop"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}

                      {/* View Purchases */}
                      <button
                        onClick={() => handleViewPurchases(shop)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="View Purchases"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>

                      {/* Discount Settings */}
                      <button
                        onClick={() => handleDiscountSettings(shop)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                        title="Discount Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'primary' : 'secondary'}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <ShopDetailsModal
        isOpen={showDetailsModal}
        shop={selectedShop}
        onClose={() => handleModalClose(false)}
        onEdit={() => {
          setShowDetailsModal(false);
          setShowEditModal(true);
        }}
        onDiscountSettings={() => {
          setShowDetailsModal(false);
          setShowDiscountModal(true);
        }}
      />
      <ShopEditModal
        isOpen={showEditModal}
        shop={selectedShop}
        onClose={() => handleModalClose(false)}
        onSave={() => handleModalClose(true)}
      />
      <ShopApprovalModal
        isOpen={showApprovalModal}
        shop={selectedShop}
        actionType={actionType}
        onClose={() => handleModalClose(false)}
        onSuccess={() => handleModalClose(true)}
      />
      {/*
      <ShopPurchasesModal 
        isOpen={showPurchasesModal}
        shop={selectedShop}
        onClose={() => handleModalClose(false)}
      />

      <ShopDiscountModal 
        isOpen={showDiscountModal}
        shop={selectedShop}
        onClose={() => handleModalClose(false)}
        onSave={() => handleModalClose(true)}
      /> */}
      {/* NEW: Additional Modals for Admin Features */}
      <NewShopRegistrationModal
        isOpen={showNewShopModal}
        onClose={() => handleModalClose(false)}
        onSuccess={() => handleModalClose(true)}
      />
      <ShopStatusModal
        isOpen={showStatusModal}
        shop={selectedShop}
        actionType={actionType}
        onClose={() => handleModalClose(false)}
        onSuccess={() => handleModalClose(true)}
      />
    </div>
  );
};

export default ShopsManagement;
