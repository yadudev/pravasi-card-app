const {
  User,
  DiscountCard,
  Transaction,
  Shop,
  sequelize,
} = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/responses');
const Helpers = require('../../utils/helpers');
const EmailService = require('../../services/emailService');
const logger = require('../../utils/logger');

class UserController {
  /**
   * Get all users with pagination, search, and filters
   * GET /api/admin/users
   */
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const tier = req.query.tier;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'DESC';

      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ];
      }

      if (status !== undefined) {
        whereClause.isActive = status === 'active';
      }

      if (tier) {
        whereClause.currentDiscountTier = tier;
      }

      const { count, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['createdBy'] },
        where: whereClause,
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiresAt', 'isActive'],
          },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true,
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(users, pagination, 'Users retrieved successfully')
      );
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user by ID with detailed information
   * GET /api/admin/users/:id
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiresAt', 'isActive', 'qrCode'],
          },
          {
            model: Transaction,
            as: 'transactions',
            include: [
              {
                model: Shop,
                as: 'shop',
                attributes: ['name', 'location'],
              },
            ],
            limit: 10,
            order: [['createdAt', 'DESC']],
          },
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      res.json(ApiResponse.success(user, 'User retrieved successfully'));
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Create new user
   * POST /api/admin/users
   */
  static async createUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const {
        fullName,
        email,
        phone,
        password,
        address,
        city,
        state,
        pincode,
        dateOfBirth,
        gender,
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        await transaction.rollback();
        return res
          .status(400)
          .json(ApiResponse.error('Email already exists', 400));
      }

      // Check if phone already exists
      const existingPhone = await User.findOne({
        where: { phone },
      });

      if (existingPhone) {
        await transaction.rollback();
        return res
          .status(400)
          .json(ApiResponse.error('Phone number already exists', 400));
      }

      // Create user
      const user = await User.create(
        {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password,
          address,
          city,
          state,
          pincode,
          dateOfBirth,
          gender,
          referralCode: Helpers.generateReferralCode(fullName),
          isEmailVerified: true, // Admin created users are pre-verified
          isPhoneVerified: true,
        },
        { transaction }
      );

      // Create discount card
      const cardNumber = Helpers.generateCardNumber();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

      await DiscountCard.create(
        {
          userId: user.id,
          cardNumber,
          expiryDate,
          qrCode: Helpers.generateQRCodeData(cardNumber, user.id),
        },
        { transaction }
      );

      await transaction.commit();

      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.warn('Failed to send welcome email:', emailError);
      }

      logger.info(`User created by admin: ${user.email}`);

      res
        .status(201)
        .json(ApiResponse.success(user, 'User created successfully'));
    } catch (error) {
      await transaction.rollback();
      logger.error('Create user error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update user information
   * PUT /api/admin/users/:id
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: updateData.email.toLowerCase(),
            id: { [Op.ne]: id },
          },
        });

        if (existingUser) {
          return res
            .status(400)
            .json(ApiResponse.error('Email already taken', 400));
        }
        updateData.email = updateData.email.toLowerCase();
      }

      // Check if phone is being changed and if it's already taken
      if (updateData.phone && updateData.phone !== user.phone) {
        const existingPhone = await User.findOne({
          where: {
            phone: updateData.phone,
            id: { [Op.ne]: id },
          },
        });

        if (existingPhone) {
          return res
            .status(400)
            .json(ApiResponse.error('Phone number already taken', 400));
        }
      }

      // Update discount tier based on total spent
      if (updateData.totalSpent !== undefined) {
        updateData.currentDiscountTier = Helpers.calculateDiscountTier(
          updateData.totalSpent
        );
      }

      const allowedFields = [
        'fullName',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'pincode',
        'isActive',
        'currentDiscountTier',
        'totalSpent',
        'dateOfBirth',
        'gender',
      ];

      const filteredUpdateData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      });

      await user.update(filteredUpdateData);

      logger.info(`User updated by admin: ${user.email}`);

      res.json(ApiResponse.success(user, 'User updated successfully'));
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Reset user password
   * PUT /api/admin/users/:id/reset-password
   */
  static async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await user.update({ password: newPassword });

      logger.info(`User password reset by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'Password reset successfully'));
    } catch (error) {
      logger.error('Reset user password error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update user discount card details
   * PUT /api/admin/users/:id/card
   */
  static async updateUserCard(req, res) {
    try {
      const { id } = req.params;
      const { expiryDate, isActive } = req.body;

      const user = await User.findByPk(id, {
        include: [{ model: DiscountCard, as: 'discountCard' }],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      if (!user.discountCard) {
        return res
          .status(404)
          .json(ApiResponse.error('User has no discount card', 404));
      }

      const updateData = {};
      if (expiryDate) updateData.expiryDate = expiryDate;
      if (isActive !== undefined) updateData.isActive = isActive;

      await user.discountCard.update(updateData);

      logger.info(`User card updated by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'Card details updated successfully'));
    } catch (error) {
      logger.error('Update user card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Generate new discount card for user
   * POST /api/admin/users/:id/generate-card
   */
  static async generateUserCard(req, res) {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Generate new card
      const cardNumber = Helpers.generateCardNumber();
      const qrCode = Helpers.generateQRCodeData(cardNumber, user.id);

      const discountCard = await DiscountCard.create({
        userId: user.id,
        cardNumber,
        expiryDate: new Date(expiryDate),
        qrCode,
        isActive: true,
      });

      logger.info(`New discount card generated for user: ${user.email}`);

      res
        .status(201)
        .json(
          ApiResponse.success(
            discountCard,
            'Discount card generated successfully'
          )
        );
    } catch (error) {
      logger.error('Generate user card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Send email to user
   * POST /api/admin/users/:id/send-email
   */
  static async sendEmailToUser(req, res) {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await EmailService.sendUserNotification(user, subject, message);

      logger.info(
        `Email sent to user by admin: ${user.email}, Subject: ${subject}`
      );

      res.json(ApiResponse.success(null, 'Email sent successfully'));
    } catch (error) {
      logger.error('Send email to user error:', error);
      res.status(500).json(ApiResponse.error('Failed to send email', 500));
    }
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await user.destroy();

      logger.info(`User deleted by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'User deleted successfully'));
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user statistics
   * GET /api/admin/users/stats
   */
  static async getUserStats(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const verifiedUsers = await User.count({
        where: {
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });

      const tierDistribution = await User.findAll({
        attributes: [
          'currentDiscountTier',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['currentDiscountTier'],
        raw: true,
      });

      const recentRegistrations = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        recentRegistrations,
        tierDistribution: tierDistribution.reduce((acc, tier) => {
          acc[tier.currentDiscountTier] = parseInt(tier.count);
          return acc;
        }, {}),
      };

      res.json(
        ApiResponse.success(stats, 'User statistics retrieved successfully')
      );
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Export users data
   * GET /api/admin/users/export
   */
  static async exportUsers(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const users = await User.findAll({
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiryDate', 'isActive'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const exportData = users.map((user) => ({
        'User ID': user.id,
        'Full Name': user.fullName,
        Email: user.email,
        Phone: user.phone,
        Tier: user.currentDiscountTier,
        'Total Spent': user.totalSpent,
        Active: user.isActive ? 'Yes' : 'No',
        'Email Verified': user.isEmailVerified ? 'Yes' : 'No',
        'Phone Verified': user.isPhoneVerified ? 'Yes' : 'No',
        'Card Number': user.discountCard?.cardNumber || 'N/A',
        'Card Active': user.discountCard?.isActive ? 'Yes' : 'No',
        'Registration Date': user.createdAt.toISOString().split('T')[0],
      }));

      if (format === 'csv') {
        const csv = Helpers.generateCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
      } else {
        res.json(
          ApiResponse.success(exportData, 'Users data exported successfully')
        );
      }
    } catch (error) {
      logger.error('Export users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Bulk update users
   * POST /api/admin/users/bulk-update
   */
  static async bulkUpdateUsers(req, res) {
    try {
      const { userIds, action, data } = req.body;

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
      });

      if (users.length === 0) {
        return res.status(404).json(ApiResponse.error('No users found', 404));
      }

      let updateData = {};

      switch (action) {
        case 'activate':
          updateData.isActive = true;
          break;
        case 'deactivate':
          updateData.isActive = false;
          break;
        case 'update_tier':
          if (data && data.tier) {
            updateData.currentDiscountTier = data.tier;
          }
          break;
        case 'delete':
          await User.destroy({ where: { id: { [Op.in]: userIds } } });
          logger.info(`Bulk delete performed on ${userIds.length} users`);
          return res.json(
            ApiResponse.success(
              null,
              `${userIds.length} users deleted successfully`
            )
          );
        default:
          return res
            .status(400)
            .json(ApiResponse.error('Invalid bulk action', 400));
      }

      await User.update(updateData, {
        where: { id: { [Op.in]: userIds } },
      });

      logger.info(`Bulk ${action} performed on ${userIds.length} users`);

      res.json(
        ApiResponse.success(
          null,
          `${userIds.length} users updated successfully`
        )
      );
    } catch (error) {
      logger.error('Bulk update users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user's discount status and current tier information
   * GET /api/admin/users/:id/discount-status
   */
  static async getUserDiscountStatus(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: [
              'cardNumber',
              'expiresAt',
              'isActive',
              'qrCode',
              'createdAt',
            ],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'email',
          'currentDiscountTier',
          'totalSpent',
          'createdAt',
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Calculate tier benefits
      const tierBenefits = Helpers.getTierBenefits(user.currentDiscountTier);
      const nextTierInfo = Helpers.getNextTierInfo(
        user.currentDiscountTier,
        user.totalSpent
      );

      const discountStatus = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          memberSince: user.createdAt,
        },
        currentTier: {
          tier: user.currentDiscountTier,
          discountPercentage: tierBenefits.discountPercentage,
          benefits: tierBenefits.benefits,
          totalSpent: user.totalSpent,
        },
        nextTier: nextTierInfo,
        discountCard: user.discountCard
          ? {
              cardNumber: user.discountCard.cardNumber,
              isActive: user.discountCard.isActive,
              expiresAt: user.discountCard.expiresAt,
              daysUntilExpiry: Math.ceil(
                (new Date(user.discountCard.expiresAt) - new Date()) /
                  (1000 * 60 * 60 * 24)
              ),
              qrCode: user.discountCard.qrCode,
            }
          : null,
      };

      res.json(
        ApiResponse.success(
          discountStatus,
          'Discount status retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount status error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user's discount usage history
   * GET /api/admin/users/:id/discount-history
   */
  static async getUserDiscountHistory(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      const whereClause = { userId: id };

      // Add date filters if provided
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'name', 'location', 'category'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

      // Calculate discount statistics
      const totalDiscountSaved = transactions.reduce((sum, transaction) => {
        return sum + (transaction.discountAmount || 0);
      }, 0);

      const averageDiscountPerTransaction =
        transactions.length > 0 ? totalDiscountSaved / transactions.length : 0;

      const discountHistory = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          currentTier: user.currentDiscountTier,
        },
        summary: {
          totalTransactions: count,
          totalDiscountSaved: parseFloat(totalDiscountSaved.toFixed(2)),
          averageDiscountPerTransaction: parseFloat(
            averageDiscountPerTransaction.toFixed(2)
          ),
          totalSpent: user.totalSpent,
        },
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          amount: transaction.amount,
          discountAmount: transaction.discountAmount || 0,
          discountPercentage: transaction.discountPercentage || 0,
          finalAmount: transaction.finalAmount,
          shop: transaction.shop,
          date: transaction.createdAt,
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
        })),
        pagination: Helpers.getPaginationData(page, limit, count),
      };

      res.json(
        ApiResponse.success(
          discountHistory,
          'Discount history retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount history error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get discount analytics for a specific user
   * GET /api/admin/users/:id/discount-analytics
   */
  static async getUserDiscountAnalytics(req, res) {
    try {
      const { id } = req.params;
      const period = req.query.period || '6months'; // 1month, 3months, 6months, 1year

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Get transactions within the period
      const transactions = await Transaction.findAll({
        where: {
          userId: id,
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        include: [
          {
            model: Shop,
            as: 'shop',
            attributes: ['name', 'category'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      // Monthly breakdown
      const monthlyData = {};
      transactions.forEach((transaction) => {
        const monthKey = transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            totalSpent: 0,
            totalDiscount: 0,
            transactionCount: 0,
          };
        }
        monthlyData[monthKey].totalSpent += transaction.amount;
        monthlyData[monthKey].totalDiscount += transaction.discountAmount || 0;
        monthlyData[monthKey].transactionCount += 1;
      });

      // Shop category breakdown
      const categoryBreakdown = {};
      transactions.forEach((transaction) => {
        const category = transaction.shop?.category || 'Other';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            category,
            totalSpent: 0,
            totalDiscount: 0,
            transactionCount: 0,
          };
        }
        categoryBreakdown[category].totalSpent += transaction.amount;
        categoryBreakdown[category].totalDiscount +=
          transaction.discountAmount || 0;
        categoryBreakdown[category].transactionCount += 1;
      });

      const analytics = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          currentTier: user.currentDiscountTier,
        },
        period: {
          startDate,
          endDate,
          period,
        },
        overallStats: {
          totalTransactions: transactions.length,
          totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
          totalDiscountSaved: transactions.reduce(
            (sum, t) => sum + (t.discountAmount || 0),
            0
          ),
          averageTransactionValue:
            transactions.length > 0
              ? transactions.reduce((sum, t) => sum + t.amount, 0) /
                transactions.length
              : 0,
          averageDiscountPerTransaction:
            transactions.length > 0
              ? transactions.reduce(
                  (sum, t) => sum + (t.discountAmount || 0),
                  0
                ) / transactions.length
              : 0,
        },
        monthlyBreakdown: Object.values(monthlyData),
        categoryBreakdown: Object.values(categoryBreakdown),
        tierProgression: await getUserTierProgression(id),
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Discount analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get all users' discount summary for admin dashboard
   * GET /api/admin/users/discount-summary
   */
  static async getDiscountSummary(req, res) {
    try {
      const period = req.query.period || '1month';

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '1week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get discount statistics
      const totalDiscountGiven =
        (await Transaction.sum('discountAmount', {
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
            discountAmount: {
              [Op.gt]: 0,
            },
          },
        })) || 0;

      const totalTransactionsWithDiscount = await Transaction.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          discountAmount: {
            [Op.gt]: 0,
          },
        },
      });

      const totalTransactions = await Transaction.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Tier distribution with discount usage
      const tierStats = await User.findAll({
        attributes: [
          'currentDiscountTier',
          [sequelize.fn('COUNT', sequelize.col('User.id')), 'userCount'],
          [
            sequelize.fn(
              'SUM',
              sequelize.fn(
                'COALESCE',
                sequelize.col('transactions.discountAmount'),
                0
              )
            ),
            'totalDiscountUsed',
          ],
        ],
        include: [
          {
            model: Transaction,
            as: 'transactions',
            attributes: [],
            where: {
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            },
            required: false,
          },
        ],
        group: ['currentDiscountTier'],
        raw: true,
      });

      const summary = {
        period: {
          startDate,
          endDate,
          period,
        },
        overallStats: {
          totalDiscountGiven: parseFloat(totalDiscountGiven.toFixed(2)),
          totalTransactionsWithDiscount,
          totalTransactions,
          discountUtilizationRate:
            totalTransactions > 0
              ? parseFloat(
                  (
                    (totalTransactionsWithDiscount / totalTransactions) *
                    100
                  ).toFixed(2)
                )
              : 0,
          averageDiscountPerTransaction:
            totalTransactionsWithDiscount > 0
              ? parseFloat(
                  (totalDiscountGiven / totalTransactionsWithDiscount).toFixed(
                    2
                  )
                )
              : 0,
        },
        tierBreakdown: tierStats.map((stat) => ({
          tier: stat.currentDiscountTier,
          userCount: parseInt(stat.userCount),
          totalDiscountUsed: parseFloat(
            (stat.totalDiscountUsed || 0).toFixed(2)
          ),
        })),
      };

      res.json(
        ApiResponse.success(summary, 'Discount summary retrieved successfully')
      );
    } catch (error) {
      logger.error('Get discount summary error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // Helper function to get user tier progression
  static async getUserTierProgression(userId) {
    try {
      // This would ideally come from a tier_history table if you track tier changes
      // For now, we'll return current tier info
      const user = await User.findByPk(userId, {
        attributes: ['currentDiscountTier', 'totalSpent', 'createdAt'],
      });

      if (!user) return null;

      return {
        currentTier: user.currentDiscountTier,
        totalSpent: user.totalSpent,
        memberSince: user.createdAt,
        // Add tier change history if you implement tier tracking
      };
    } catch (error) {
      logger.error('Get user tier progression error:', error);
      return null;
    }
  }
}

module.exports = UserController;
