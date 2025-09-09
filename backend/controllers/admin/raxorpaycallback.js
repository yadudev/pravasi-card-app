const { Payment } = require('../../models');

module.exports.RazorpayCallback = async (req, res) => {
    try {
        const payment_id = req.query.payment_id;
        const payment_status = req.query.razorpay_payment_link_status;

        console.log("callback:", payment_id, payment_status);

        const payment_details = await Payment.findOne({ where: { id: payment_id } });

        if (!payment_details) {
            return res.send({
                result: false,
                message: "Payment details not found"
            });
        }

        if (payment_status === 'paid') {
            await Payment.update(
                { status: 'completed' },
                { where: { id: payment_id } }
            );
            return res.send({
                result: true, // ✅ should be true
                message: "Payment completed successfully"
            });
        } else {
            await Payment.update(
                { status: 'cancelled' },
                { where: { id: payment_id } }
            );
            return res.send({
                result: false,
                message: "Payment failed or cancelled"
            });
        }
    } catch (error) {
        console.error('❌ Error in Razorpay callback:', error.message);
        return res.status(500).json({
            result: false,
            message: 'Internal server error'
        });
    }
};
