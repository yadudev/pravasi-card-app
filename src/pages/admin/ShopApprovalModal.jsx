// components/Shops/ShopApprovalModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield,
  Clock,
  Store,
  User,
  Mail,
  Phone
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { shopsAPI } from '../../services/api';


const ShopApprovalModal = ({ isOpen, shop, actionType, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotes('');
      setError('');
    }
  }, [isOpen, actionType]);

  const isApproving = actionType === 'approve';
  const isRejecting = actionType === 'reject';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate reason for rejection
    if (isRejecting && !reason.trim()) {
      setError('Please provide a reason for rejecting this shop');
      return;
    }

    if (isRejecting && reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isApproving) {
        // For approval, notes are optional
        await shopsAPI.approveShop(shop.id);
      } else {
        // For rejection, reason is required
        await shopsAPI.rejectShop(shop.id, reason.trim());
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating shop approval status:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(`Failed to ${isApproving ? 'approve' : 'reject'} shop. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getModalConfig = () => {
    if (isApproving) {
      return {
        title: 'Approve Shop Registration',
        icon: CheckCircle,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        buttonText: 'Approve Shop',
        buttonVariant: 'secondary',
        description: 'This action will approve the shop registration and grant them access to the platform.',
        warningText: 'The shop will be able to start processing orders and accessing their dashboard immediately.',
        requireReason: false
      };
    } else {
      return {
        title: 'Reject Shop Registration',
        icon: XCircle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        buttonText: 'Reject Shop',
        buttonVariant: 'danger',
        description: 'This action will reject the shop registration and deny them access to the platform.',
        warningText: 'The shop owner will be notified about the rejection via email with the reason provided.',
        requireReason: true
      };
    }
  };

  const config = getModalConfig();

  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 min-h-0 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <config.icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-600">#{shop.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-160px)]">
          {/* Shop Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Store className="h-6 w-6 text-gray-600" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{shop.name}</h3>
                <p className="text-sm text-gray-600">Category: {shop.category || 'Not specified'}</p>
              </div>
              <Badge variant="warning">
                {shop.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="font-medium">{shop.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{shop.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{shop.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Registration Date</p>
                    <p className="font-medium">
                      {new Date(shop.registrationDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {shop.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{shop.description}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Discount Offered:</span>
                  <span className="ml-2 font-semibold text-green-600">{shop.discountOffered}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Address:</span>
                  <span className="ml-2 text-gray-900">{shop.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Description */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            
            <div className={`p-4 rounded-lg border ${
              isApproving 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                {isApproving ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  isApproving ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config.warningText}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isApproving ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (error) setError('');
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add any notes about the approval (optional)..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes are for internal record keeping only.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError('');
                  }}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please provide a detailed reason for rejecting this shop registration..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reason.length}/500 characters (minimum 10 required)
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  This reason will be sent to the shop owner via email.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>This action will be logged for audit purposes</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <Mail className="h-3 w-3" />
                <span>Shop owner will be notified via email</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex space-x-3 p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={config.buttonVariant}
            className="flex-1"
            disabled={loading || (config.requireReason && reason.trim().length < 10)}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              config.buttonText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopApprovalModal;