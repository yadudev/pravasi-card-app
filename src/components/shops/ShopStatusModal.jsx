// components/Shops/ShopStatusModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ban, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Shield,
  Clock,
  User,
  Store
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { shopsAPI } from '../../services/api';

const ShopStatusModal = ({ isOpen, shop, actionType, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen, actionType]);

  const isBlocking = actionType === 'block';
  const isActivating = actionType === 'activate';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate reason for blocking
    if (isBlocking && !reason.trim()) {
      setError('Please provide a reason for blocking this shop');
      return;
    }

    if (isBlocking && reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isBlocking) {
        // For blocking, we might need to pass the reason - check if your backend accepts it
        // If your blockShop API accepts reason, update it to: shopsAPI.blockShop(shop.id, reason.trim())
        await shopsAPI.blockShop(shop.id);
      } else {
        // For activating
        await shopsAPI.activateShop(shop.id);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating shop status:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(`Failed to ${isBlocking ? 'block' : 'activate'} shop. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getModalConfig = () => {
    if (isBlocking) {
      return {
        title: 'Block Shop Account',
        icon: Ban,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        buttonText: 'Block Shop',
        buttonVariant: 'danger',
        description: 'This action will block the shop account and prevent them from accessing the platform.',
        warningText: 'Blocked shops will not be able to process new orders or access their dashboard.',
        requireReason: true
      };
    } else {
      return {
        title: 'Activate Shop Account',
        icon: Play,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        buttonText: 'Activate Shop',
        buttonVariant: 'success',
        description: 'This action will activate the shop account and restore their access to the platform.',
        warningText: 'The shop will be able to process orders and access their dashboard immediately.',
        requireReason: false
      };
    }
  };

  const config = getModalConfig();

  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 min-h-0 flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-120px)]">
          {/* Shop Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Store className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{shop.name}</h3>
                <p className="text-sm text-gray-600">Owner: {shop.ownerName}</p>
              </div>
              <Badge variant={shop.status === 'approved' ? 'success' : shop.status === 'blocked' ? 'danger' : 'warning'}>
                {shop.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Email:</span>
                <p className="truncate">{shop.email}</p>
              </div>
              <div>
                <span className="font-medium">Phone:</span>
                <p>{shop.phone}</p>
              </div>
            </div>
          </div>

          {/* Action Description */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            
            <div className={`p-3 rounded-lg border ${
              isBlocking 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start space-x-2">
                {isBlocking ? (
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  isBlocking ? 'text-red-700' : 'text-green-700'
                }`}>
                  {config.warningText}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.requireReason ? 'Reason for blocking *' : 'Reason (optional)'}
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
                placeholder={
                  isBlocking 
                    ? 'Please provide a detailed reason for blocking this shop...'
                    : 'Optional: Add a note about why you\'re activating this shop...'
                }
              />
              {config.requireReason && (
                <p className="text-xs text-gray-500 mt-1">
                  {reason.length}/500 characters (minimum 10 required)
                </p>
              )}
            </div>

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
              {isBlocking && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Shop owner will be notified via email</span>
                </div>
              )}
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

export default ShopStatusModal;