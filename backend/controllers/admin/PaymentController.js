
const axios = require("axios");
const { Payment } = require('../../models')
const logger = require('../../utils/logger');


module.exports.PaymentController = async (req, res) => {
    try {
        const { id } = req.user;
        const {
            total_amount,
        } = req.body;

        if (!total_amount || total_amount <= 0) {
            return res.status(400).json({
                result: false,
                message: 'Please provide a valid total amount',
            });
        }
        let payment = await Payment.create({
            userId: id,
            amount: total_amount,
            status: 'pending'
        })

        // Razorpay credentials
        // test api key

        const key_id = process.env.RAZORPAY_TEST_KEY_ID;
        const key_secret = process.env.RAZORPAY_TEST_KEY_SECRET;

        //live api keys

        // const key_id = process.env.RAZORPAY_LIVE_KEY_ID;
        // const key_secret = process.env.RAZORPAY_LIVE_KEY_SECRET;

        const callback_url = `https://lunarsenterprises.com:5000/api/user/razorpay/callback?payment_id=${payment.id}`;

        const authHeader = {
            auth: {
                username: key_id,
                password: key_secret,
            },
        };

        const paymentLinkData = {
            amount: Number(total_amount) * 100, // convert to paisa
            currency: 'INR',
            callback_url,
        };
        try {
            const response = await axios.post(
                'https://api.razorpay.com/v1/payment_links',
                paymentLinkData,
                authHeader
            );

            return res.status(200).json({
                result: true,
                message: 'Payment link created successfully!',
                paymentLinkUrl: response.data.short_url,
            });
        } catch (error) {
            console.error('❌ Error creating payment link:', error.response?.data?.error || error.message);
            return res.status(500).json({
                result: false,
                message: 'Failed to create payment link',
                error: error.response?.data?.error || error.message,
            });
        }

    } catch (error) {
        logger.error('payment error:', error);
        res.status(500).json({
            result: false,
            message: 'Internal server error',
            error: error.message || 'An unexpected error occurred',
        });
    }
}