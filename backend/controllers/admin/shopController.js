const { Shop, Transaction, User, Admin } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const csv = require('csv-writer');
const path = require('path');
const logger = require('../../utils/logger');
const EmailService = require('../../services/emailService');

class ShopController {
  static async registerShop(req, res) {
    try {
      const {
        shopName,
        category,
        email,
        phone,
        district,
        talukBlock,
        location,
        storeAddress,
        gstNumber,
        discountOffer,
        confirmDetails,
      } = req.body;

      // Validate required fields
      if (
        !shopName ||
        !category ||
        !email ||
        !phone ||
        !district ||
        !talukBlock ||
        !location ||
        !storeAddress
      ) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be filled',
        });
      }

      // Validate email format
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      // Validate confirmation checkbox
      if (!confirmDetails) {
        return res.status(400).json({
          success: false,
          message: 'You must confirm the details to proceed',
        });
      }

      // Check if email already exists
      const existingShop = await Shop.findOne({ where: { email } });
      if (existingShop) {
        return res.status(400).json({
          success: false,
          message: 'A shop with this email already exists',
        });
      }

      // Create shop with pending status
      const shopData = {
        name: shopName.trim(),
        shopType: category,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        address: storeAddress.trim(),
        city: location.trim(),
        state: district,
        talukBlock: talukBlock,
        gstNumber: gstNumber.trim(),
        discountOffer: discountOffer?.trim() || null,
        status: 'pending', // All public registrations start as pending
        isActive: false, // Will be activated when approved
      };

      const shop = await Shop.create(shopData);

      res.status(201).json({
        success: true,
        message:
          'Shop registration submitted successfully! We will review your application and get back to you within 2-3 business days.',
        data: {
          id: shop.id,
          shopName: shop.name,
          status: shop.status,
        },
      });
    } catch (error) {
      logger.error('Error registering shop:', error);

      // Handle specific Sequelize errors
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      // Handle unique constraint violations
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'A shop with this information already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register shop. Please try again.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * NEW: Create shop by admin (admin registration)
   */
  static async createShopByAdmin(req, res) {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: Admin ID not found' });
      }
      const shopData = {
        ...req.body,
        status: 'approved', // Admin can directly approve
        approvedBy: adminId,
        approvedAt: new Date(),
        isActive: true,
        totalRevenue: 0,
        totalTransactions: 0,
      };

      const shop = await Shop.create(shopData);

      const createdShop = await Shop.findByPk(shop.id, {
        include: [
          {
            model: Admin,
            as: 'approver',
            attributes: ['id', 'username', 'email', 'fullName'],
            required: false,
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Shop created successfully',
        data: createdShop,
      });
    } catch (error) {
      logger.error('Error creating shop by admin:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get all shops with pagination, search, and filters
   */
  static async getAllShops(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        shopType,
        city,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { shopName: { [Op.iLike]: `%${search}%` } },
          { ownerName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (shopType) {
        whereClause.shopType = shopType;
      }

      if (city) {
        whereClause.city = { [Op.iLike]: `%${city}%` };
      }

      const { count, rows: shops } = await Shop.findAndCountAll({
        attributes: { exclude: ['registrationDate'] },
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Admin,
            as: 'approver',
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          shops,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching shops:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get shop statistics
   */
  static async getShopStats(req, res) {
    try {
      const totalShops = await Shop.count();
      const approvedShops = await Shop.count({ where: { status: 'approved' } });
      const pendingShops = await Shop.count({ where: { status: 'pending' } });
      const rejectedShops = await Shop.count({ where: { status: 'rejected' } });
      const blockedShops = await Shop.count({ where: { status: 'blocked' } });

      const totalRevenue = (await Shop.sum('totalRevenue')) || 0;
      const totalTransactions = (await Shop.sum('totalTransactions')) || 0;

      res.json({
        success: true,
        data: {
          totalShops,
          approvedShops,
          pendingShops,
          rejectedShops,
          blockedShops,
          totalRevenue,
          totalTransactions,
          approvalRate:
            totalShops > 0
              ? ((approvedShops / totalShops) * 100).toFixed(2)
              : 0,
        },
      });
    } catch (error) {
      logger.error('Error fetching shop stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Export shops data
   */
  static async exportShops(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const shops = await Shop.findAll({
        include: [
          {
            model: Admin,
            as: 'approver',
            attributes: ['username'],
          },
        ],
      });

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Shops');

        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Shop Name', key: 'shopName', width: 30 },
          { header: 'Owner Name', key: 'ownerName', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Shop Type', key: 'shopType', width: 20 },
          { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
          { header: 'Total Transactions', key: 'totalTransactions', width: 15 },
          { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        shops.forEach((shop) => {
          worksheet.addRow({
            id: shop.id,
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            email: shop.email,
            phone: shop.phone,
            status: shop.status,
            shopType: shop.shopType,
            totalRevenue: shop.totalRevenue || 0,
            totalTransactions: shop.totalTransactions || 0,
            createdAt: shop.createdAt,
          });
        });

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=shops.xlsx');

        await workbook.xlsx.write(res);
        res.end();
      } else {
        // CSV export
        const csvWriter = csv.createObjectCsvWriter({
          path: path.join(__dirname, '../../temp/shops.csv'),
          header: [
            { id: 'id', title: 'ID' },
            { id: 'shopName', title: 'Shop Name' },
            { id: 'ownerName', title: 'Owner Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone' },
            { id: 'status', title: 'Status' },
            { id: 'shopType', title: 'Shop Type' },
            { id: 'totalRevenue', title: 'Total Revenue' },
            { id: 'totalTransactions', title: 'Total Transactions' },
            { id: 'createdAt', title: 'Created At' },
          ],
        });

        await csvWriter.writeRecords(
          shops.map((shop) => ({
            id: shop.id,
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            email: shop.email,
            phone: shop.phone,
            status: shop.status,
            shopType: shop.shopType,
            totalRevenue: shop.totalRevenue || 0,
            totalTransactions: shop.totalTransactions || 0,
            createdAt: shop.createdAt,
          }))
        );

        res.download(path.join(__dirname, '../../temp/shops.csv'), 'shops.csv');
      }
    } catch (error) {
      logger.error('Error exporting shops:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get pending shops for approval
   */
  static async getPendingShops(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: shops } = await Shop.findAndCountAll({
        where: { status: 'pending' },
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'ASC']], // FIFO
      });

      res.json({
        success: true,
        data: {
          shops,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching pending shops:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get shop by ID with detailed information
   */
  static async getShopById(req, res) {
    try {
      const { id } = req.params;

      const shop = await Shop.findByPk(id, {
        include: [
          {
            model: Admin,
            as: 'approver',
            attributes: ['id', 'username', 'email'],
          },
          {
            model: Transaction,
            as: 'transactions',
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
          },
        ],
      });

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      res.json({
        success: true,
        data: shop,
      });
    } catch (error) {
      logger.error('Error fetching shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update shop information
   */
  static async updateShop(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      await shop.update(updateData);

      res.json({
        success: true,
        message: 'Shop updated successfully',
        data: shop,
      });
    } catch (error) {
      logger.error('Error updating shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Approve shop
   */
  static async approveShop(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      if (
        shop.status !== 'pending' &&
        shop.status !== 'rejected' &&
        shop.status !== null
      ) {
        return res.status(400).json({
          success: false,
          message: 'Only pending shops can be approved',
        });
      }

      await shop.update({
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes,
        isActive: true,
      });

      // Send approval email
      if (shop.email) {
        try {
          await EmailService.sendShopApprovalEmail(shop.email, shop.shopName);
        } catch (emailError) {
          logger.error('Error sending approval email:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Shop approved successfully',
        data: shop,
      });
    } catch (error) {
      logger.error('Error approving shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Reject shop
   */
  static async rejectShop(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      if (shop.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending shops can be rejected',
        });
      }

      await shop.update({
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        isActive: false,
      });

      // Send rejection email
      if (shop.email) {
        try {
          await EmailService.sendShopRejectionEmail(
            shop.email,
            shop.shopName,
            reason
          );
        } catch (emailError) {
          logger.error('Error sending rejection email:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Shop rejected successfully',
        data: shop,
      });
    } catch (error) {
      logger.error('Error rejecting shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Block/Unblock shop
   */
  static async toggleBlockShop(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      const isCurrentlyBlocked = shop.status === 'blocked';
      const newStatus = isCurrentlyBlocked ? 'approved' : 'blocked';

      await shop.update({
        status: newStatus,
        isActive: !isCurrentlyBlocked,
        blockedBy: isCurrentlyBlocked ? null : adminId,
        blockedAt: isCurrentlyBlocked ? null : new Date(),
        blockReason: isCurrentlyBlocked ? null : reason,
      });

      res.json({
        success: true,
        message: `Shop ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully`,
        data: shop,
      });
    } catch (error) {
      logger.error('Error toggling shop block status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get shop analytics
   */
  static async getShopAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      const analytics = await shop.getAnalytics(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error fetching shop analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get shop transactions
   */
  static async getShopTransactions(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: { shopId: id },
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching shop transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Send email to shop
   */
  static async sendEmailToShop(req, res) {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      if (!shop.email) {
        return res.status(400).json({
          success: false,
          message: 'Shop does not have an email address',
        });
      }

      await EmailService.sendCustomEmail(shop.email, subject, message);

      res.json({
        success: true,
        message: 'Email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending email to shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete shop (super admin only)
   */
  static async deleteShop(req, res) {
    try {
      const { id } = req.params;

      const shop = await Shop.findByPk(id);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }

      await shop.destroy();

      res.json({
        success: true,
        message: 'Shop deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting shop:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Bulk operations for shops
   */
  static async bulkUpdateShops(req, res) {
    try {
      const { shopIds, action, reason } = req.body;
      const adminId = req.user.id;

      const shops = await Shop.findAll({
        where: { id: { [Op.in]: shopIds } },
      });

      if (shops.length !== shopIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some shops were not found',
        });
      }

      const updateData = {};

      switch (action) {
        case 'approve':
          updateData.status = 'approved';
          updateData.approvedBy = adminId;
          updateData.approvedAt = new Date();
          updateData.isActive = true;
          break;
        case 'reject':
          updateData.status = 'rejected';
          updateData.rejectedBy = adminId;
          updateData.rejectedAt = new Date();
          updateData.rejectionReason = reason;
          updateData.isActive = false;
          break;
        case 'block':
          updateData.status = 'blocked';
          updateData.blockedBy = adminId;
          updateData.blockedAt = new Date();
          updateData.blockReason = reason;
          updateData.isActive = false;
          break;
        case 'unblock':
          updateData.status = 'approved';
          updateData.blockedBy = null;
          updateData.blockedAt = null;
          updateData.blockReason = null;
          updateData.isActive = true;
          break;
        case 'delete':
          await Shop.destroy({
            where: { id: { [Op.in]: shopIds } },
          });
          return res.json({
            success: true,
            message: `${shopIds.length} shops deleted successfully`,
          });
      }

      await Shop.update(updateData, {
        where: { id: { [Op.in]: shopIds } },
      });

      res.json({
        success: true,
        message: `${shopIds.length} shops ${action}ed successfully`,
      });
    } catch (error) {
      logger.error('Error performing bulk update:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = ShopController;
