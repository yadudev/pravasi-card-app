const { Payment, Admin, User } = require('../../models');
const { renewUserCard } = require('../../services/cardService');

module.exports.RazorpayCallback = async (req, res) => {
  try {
    const payment_id = req.body.payment_id;
    const payment_status = req.body.razorpay_payment_link_status;
    const payment_type = req.body.payment_type;
    const transaction_id = req.body.razorpay_payment_id;
    console.log('callback:', payment_id, payment_status, payment_type);

    const payment_details = await Payment.findOne({
      where: { id: payment_id },
    });

    if (!payment_details) {
      return res.send({
        result: false,
        message: 'Payment details not found',
        status: null,
      });
    }

    const loginUser = await Admin.findOne({
      where: { id: payment_details?.userId },
    });

    if (!loginUser) {
      return res.send({
        result: false,
        message: 'Admin user not found',
        status: null,
      });
    }

    const userInfo = await User.findOne({
      where: { email: loginUser.email, phone: loginUser.phone },
    });

    if (!userInfo) {
      return res.send({
        result: false,
        message: 'User not found',
        status: null,
      });
    }

    if (payment_status === 'paid') {
      await Payment.update(
        {
          status: 'completed',
          transactionId: transaction_id,
        },
        {
          where: { id: payment_id },
        }
      );

      await User.update(
        { paymentStatus: true },
        { where: { id: userInfo.id } }
      );

      if (payment_details?.type === 'RENEWAL') {
        try {
          await renewUserCard(userInfo.id, 12);
          console.log('Card renewed successfully for user:', userInfo.id);
        } catch (error) {
          console.error('Card renewal failed:', error.message);
          // Note: We don't return here, so payment completion still proceeds
        }
      }

      return res.send({
        result: true,
        message: 'Payment completed successfully',
        status: 'completed',
      });
    } else {
      await Payment.update({ status: 'failed' }, { where: { id: payment_id } });

      return res.send({
        result: false,
        message: 'Payment failed or cancelled',
        status: 'failed',
      });
    }
  } catch (error) {
    console.error('❌ Error in Razorpay callback:', error.message);
    return res.status(500).json({
      result: false,
      message: 'Internal server error',
      status: 'cancelled',
    });
  }
};
