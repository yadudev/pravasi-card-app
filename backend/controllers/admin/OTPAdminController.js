const { OTPSession, User } = require('../../models');
const { Op } = require('sequelize');

class OTPAdminController {
  // Get all OTP sessions with filtering and pagination
  static async getAllOTPSessions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        otpType,
        purpose,
        isVerified,
        userId,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};
      const userWhereClause = {};

      // Apply filters
      if (otpType) whereClause.otpType = otpType;
      if (purpose) whereClause.purpose = purpose;
      if (isVerified !== undefined) whereClause.isVerified = isVerified === 'true';
      if (userId) whereClause.userId = userId;

      // Date range filter
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at[Op.gte] = new Date(startDate);
        if (endDate) whereClause.created_at[Op.lte] = new Date(endDate);
      }

      // Search filter (by contact info or user details)
      if (search) {
        whereClause[Op.or] = [
          { contactInfo: { [Op.iLike]: `%${search}%` } },
          { sessionId: { [Op.iLike]: `%${search}%` } }
        ];
        // Also search in user fields
        userWhereClause[Op.or] = [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await OTPSession.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'phone', 'isActive'],
            where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
            required: false
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      // Calculate statistics
      const stats = await OTPAdminController.getOTPStatistics();

      res.status(200).json({
        success: true,
        data: {
          otpSessions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            limit: parseInt(limit),
            hasNext: page * limit < count,
            hasPrev: page > 1
          },
          statistics: stats
        }
      });
    } catch (error) {
      console.error('Error fetching OTP sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OTP sessions',
        error: error.message
      });
    }
  }

  // Get specific OTP session by ID
  static async getOTPSessionById(req, res) {
    try {
      const { id } = req.params;

      const otpSession = await OTPSession.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'phone', 'isActive', 'created_at']
          }
        ]
      });

      if (!otpSession) {
        return res.status(404).json({
          success: false,
          message: 'OTP session not found'
        });
      }

      res.status(200).json({
        success: true,
        data: otpSession
      });
    } catch (error) {
      console.error('Error fetching OTP session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OTP session',
        error: error.message
      });
    }
  }

  // Get OTP sessions for specific user
  static async getUserOTPSessions(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows } = await OTPSession.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'phone']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          otpSessions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user OTP sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user OTP sessions',
        error: error.message
      });
    }
  }

  // Get OTP statistics for dashboard
  static async getOTPStatistics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const [
        totalOTPs,
        todayOTPs,
        weekOTPs,
        monthOTPs,
        verifiedOTPs,
        expiredOTPs,
        emailOTPs,
        smsOTPs,
        cardActivationOTPs
      ] = await Promise.all([
        OTPSession.count(),
        OTPSession.count({ where: { created_at: { [Op.gte]: today } } }),
        OTPSession.count({ where: { created_at: { [Op.gte]: thisWeek } } }),
        OTPSession.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
        OTPSession.count({ where: { isVerified: true } }),
        OTPSession.count({ where: { expiresAt: { [Op.lt]: new Date() }, isVerified: false } }),
        OTPSession.count({ where: { otpType: 'email' } }),
        OTPSession.count({ where: { otpType: 'sms' } }),
        OTPSession.count({ where: { purpose: 'card_activation' } })
      ]);

      return {
        total: totalOTPs,
        today: todayOTPs,
        thisWeek: weekOTPs,
        thisMonth: monthOTPs,
        verified: verifiedOTPs,
        expired: expiredOTPs,
        verificationRate: totalOTPs > 0 ? ((verifiedOTPs / totalOTPs) * 100).toFixed(2) : 0,
        typeDistribution: {
          email: emailOTPs,
          sms: smsOTPs
        },
        purposeDistribution: {
          cardActivation: cardActivationOTPs
        }
      };
    } catch (error) {
      console.error('Error calculating OTP statistics:', error);
      return {};
    }
  }

  // Get OTP analytics data
  static async getOTPAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      let startDate;
      switch (period) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get OTP count by day
      const dailyOTPs = await OTPSession.findAll({
        attributes: [
          [OTPSession.sequelize.fn('DATE', OTPSession.sequelize.col('created_at')), 'date'],
          [OTPSession.sequelize.fn('COUNT', '*'), 'count'],
          [OTPSession.sequelize.fn('SUM', OTPSession.sequelize.case()
            .when({ isVerified: true }, 1)
            .else(0)), 'verified']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [OTPSession.sequelize.fn('DATE', OTPSession.sequelize.col('created_at'))],
        order: [[OTPSession.sequelize.fn('DATE', OTPSession.sequelize.col('created_at')), 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          dailyOTPs,
          period
        }
      });
    } catch (error) {
      console.error('Error fetching OTP analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OTP analytics',
        error: error.message
      });
    }
  }

  // Manually expire OTP session (admin action)
  static async expireOTPSession(req, res) {
    try {
      const { id } = req.params;

      const otpSession = await OTPSession.findByPk(id);
      if (!otpSession) {
        return res.status(404).json({
          success: false,
          message: 'OTP session not found'
        });
      }

      otpSession.expiresAt = new Date();
      await otpSession.save();

      res.status(200).json({
        success: true,
        message: 'OTP session expired successfully',
        data: otpSession
      });
    } catch (error) {
      console.error('Error expiring OTP session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to expire OTP session',
        error: error.message
      });
    }
  }
}

module.exports = OTPAdminController;