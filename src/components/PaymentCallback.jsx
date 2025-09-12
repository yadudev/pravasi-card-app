import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { usersAPI } from '../services/api';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, failed, error
  const [message, setMessage] = useState('Processing your payment...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Extract payment parameters from URL
    const paymentData = {
      payment_id: searchParams.get('payment_id'),
      razorpay_payment_id: searchParams.get('razorpay_payment_id'),
      razorpay_payment_link_id: searchParams.get('razorpay_payment_link_id'),
      razorpay_payment_link_reference_id: searchParams.get('razorpay_payment_link_reference_id'),
      razorpay_payment_link_status: searchParams.get('razorpay_payment_link_status'),
      razorpay_signature: searchParams.get('razorpay_signature')
    };

    console.log('Payment callback data:', paymentData);

    // Process the payment callback
    processPaymentCallback(paymentData);
  }, [searchParams]);

  // Start countdown when status is set to success or failed
  useEffect(() => {
    if (status === 'success' || status === 'failed' || status === 'error') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/'); // Redirect to home page
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const processPaymentCallback = async (paymentData) => {
    try {
      // Validate required data
      if (!paymentData.payment_id) {
        setStatus('error');
        setMessage('Payment ID missing from callback');
        return;
      }

      // Call your API to update payment status
      const response = await usersAPI.updatePaymentStatus({
        payment_id: paymentData.payment_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_payment_link_id: paymentData.razorpay_payment_link_id,
        razorpay_payment_link_reference_id: paymentData.razorpay_payment_link_reference_id,
        razorpay_payment_link_status: paymentData.razorpay_payment_link_status,
        razorpay_signature: paymentData.razorpay_signature
      });

      console.log('Payment update response:', response);

      if (response.result && response?.status === 'completed') {
        setStatus('success');
        setMessage('Payment successful! Your Pravasi Privilege Card has been activated.');
      } else if (response.result && response?.status === 'failed') {
        setStatus('failed');
        setMessage('Payment failed. Please try again or contact support.');
      } else {
        setStatus('error');
        setMessage(response.message || 'Failed to process payment. Please contact support.');
      }
    } catch (error) {
      console.error('Payment callback processing error:', error);
      setStatus('error');
      setMessage('An error occurred while processing your payment. Please contact support.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'error':
        return 'Payment Error';
      default:
        return 'Processing Payment...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border-2 ${getStatusColor()}`}>
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {getStatusTitle()}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Payment ID */}
        {searchParams.get('payment_id') && (
          <div className="bg-gray-100 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-500">Payment ID:</p>
            <p className="font-mono text-sm">{searchParams.get('payment_id')}</p>
            <p className="text-sm text-gray-500">Transaction ID:</p>
            <p className="font-mono text-sm">{searchParams.get('razorpay_payment_id')}</p>
          </div>
        )}

        {/* Countdown and Actions */}
        {status !== 'processing' && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Redirecting to home page in {countdown} seconds...
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Home Page
              </button>
              
              {status === 'failed' && (
                <button
                  onClick={() => navigate('/payment')} // Navigate to payment page to retry
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;