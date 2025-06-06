const { Op } = require('sequelize');
const {
  User,
  Shop,
  Transaction,
  DiscountRule,
  DiscountCard,
  sequelize,
} = require('../../models');
const ApiResponse = require('../../utils/responses');
const Helpers = require('../../utils/helpers');
const logger = require('../../utils/logger');

class AnalyticsController {
  /**
   * Get dashboard analytics overview
   * GET /api/admin/analytics/dashboard
   */
  static async getDashboardAnalytics(req, res) {
    try {
      const { period = 'month', startDate, endDate } = req.query;

      let dateFilter = {};
      if (period === 'custom' && startDate && endDate) {
        dateFilter = {
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)],
          },
        };
      } else {
        const dateRange = Helpers.getDateRange(period);
        dateFilter = {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end],
          },
        };
      }

      // Basic counts
      const totalUsers = await User.count();
      const totalShops = await Shop.count();
      const totalTransactions = await Transaction.count();

      // Period-specific data
      const newUsers = await User.count({ where: dateFilter });
      const newShops = await Shop.count({ where: dateFilter });
      const periodTransactions = await Transaction.count({ where: dateFilter });

      // Revenue data
      const totalRevenue = (await Transaction.sum('amount')) || 0;
      const periodRevenue =
        (await Transaction.sum('amount', { where: dateFilter })) || 0;
      const totalDiscountGiven = (await Transaction.sum('discountAmount')) || 0;

      // Active metrics
      const activeUsers = await User.count({ where: { isActive: true } });
      const approvedShops = await Shop.count({ where: { status: 'approved' } });
      const pendingShops = await Shop.count({ where: { status: 'pending' } });

      // Tier distribution
      const userTierDistribution = await User.findAll({
        attributes: [
          'currentDiscountTier',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['currentDiscountTier'],
        raw: true,
      });

      const dashboard = {
        overview: {
          totalUsers,
          totalShops,
          totalTransactions,
          totalRevenue: parseFloat(totalRevenue).toFixed(2),
          totalDiscountGiven: parseFloat(totalDiscountGiven).toFixed(2),
        },
        periodData: {
          newUsers,
          newShops,
          transactions: periodTransactions,
          revenue: parseFloat(periodRevenue).toFixed(2),
          period,
        },
        metrics: {
          activeUsers,
          approvedShops,
          pendingShops,
          averageTransactionValue:
            totalTransactions > 0
              ? (totalRevenue / totalTransactions).toFixed(2)
              : 0,
        },
        distributions: {
          userTiers: userTierDistribution.reduce((acc, tier) => {
            acc[tier.currentDiscountTier] = parseInt(tier.count);
            return acc;
          }, {}),
        },
      };

      res.json(
        ApiResponse.success(
          dashboard,
          'Dashboard analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Dashboard analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user analytics
   * GET /api/admin/analytics/users
   */
  static async getUserAnalytics(req, res) {
    try {
      const {
        period = 'month',
        startDate,
        endDate,
        groupBy = 'day',
      } = req.query;

      let dateRange;
      if (period === 'custom' && startDate && endDate) {
        dateRange = { start: new Date(startDate), end: new Date(endDate) };
      } else {
        dateRange = Helpers.getDateRange(period);
      }

      // User registrations over time
      const registrationData = await User.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end],
          },
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      // User activity metrics
      const activeUsers = await User.count({
        where: {
          isActive: true,
          lastLoginAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      // Top users by spending
      const topUsers = await User.findAll({
        attributes: [
          'id',
          'fullName',
          'email',
          'totalSpent',
          'currentDiscountTier',
        ],
        order: [['totalSpent', 'DESC']],
        limit: 10,
      });

      const analytics = {
        registrationTrend: registrationData,
        summary: {
          totalUsers: await User.count(),
          activeUsers,
          verifiedUsers: await User.count({
            where: {
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          }),
          topSpenders: topUsers,
        },
        demographics: {
          tierDistribution: await this.getTierDistribution(),
          cityDistribution: await this.getCityDistribution('users'),
        },
      };

      res.json(
        ApiResponse.success(analytics, 'User analytics retrieved successfully')
      );
    } catch (error) {
      logger.error('User analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get shop analytics
   * GET /api/admin/analytics/shops
   */
  static async getShopAnalytics(req, res) {
    try {
      const { period = 'month', shopType, city } = req.query;

      const dateRange = Helpers.getDateRange(period);

      let whereClause = {};
      if (shopType) whereClause.shopType = shopType;
      if (city) whereClause.city = { [Op.like]: `%${city}%` };

      // Shop registrations over time
      const registrationData = await Shop.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          ...whereClause,
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end],
          },
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      // Top performing shops
      const topShops = await Shop.findAll({
        attributes: [
          'id',
          'shopName',
          'totalRevenue',
          'totalTransactions',
          'city',
        ],
        where: whereClause,
        order: [['totalRevenue', 'DESC']],
        limit: 10,
      });

      // Shop status distribution
      const statusDistribution = await Shop.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: whereClause,
        group: ['status'],
        raw: true,
      });

      const analytics = {
        registrationTrend: registrationData,
        performance: {
          topShops,
          totalRevenue:
            (await Shop.sum('totalRevenue', { where: whereClause })) || 0,
          averageRevenue: await Shop.findOne({
            attributes: [
              [sequelize.fn('AVG', sequelize.col('totalRevenue')), 'avg'],
            ],
            where: whereClause,
            raw: true,
          }),
        },
        distributions: {
          status: statusDistribution.reduce((acc, status) => {
            acc[status.status] = parseInt(status.count);
            return acc;
          }, {}),
          types: await this.getShopTypeDistribution(whereClause),
          cities: await this.getCityDistribution('shops', whereClause),
        },
      };

      res.json(
        ApiResponse.success(analytics, 'Shop analytics retrieved successfully')
      );
    } catch (error) {
      logger.error('Shop analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get transaction analytics
   * GET /api/admin/analytics/transactions
   */
  static async getTransactionAnalytics(req, res) {
    try {
      const { period = 'month', shopId, tier, groupBy = 'day' } = req.query;

      const dateRange = Helpers.getDateRange(period);

      let whereClause = {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
      };

      if (shopId) whereClause.shopId = shopId;

      // Include user tier filter
      const includeClause = [];
      if (tier) {
        includeClause.push({
          model: User,
          attributes: [],
          where: { currentDiscountTier: tier },
        });
      }

      // Transaction volume over time
      const transactionData = await Transaction.findAll({
        attributes: [
          [
            sequelize.fn('DATE', sequelize.col('Transaction.createdAt')),
            'date',
          ],
          [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('SUM', sequelize.col('discountAmount')), 'discounts'],
        ],
        include: includeClause,
        where: whereClause,
        group: [sequelize.fn('DATE', sequelize.col('Transaction.createdAt'))],
        order: [
          [sequelize.fn('DATE', sequelize.col('Transaction.createdAt')), 'ASC'],
        ],
        raw: true,
      });

      // Transaction summary
      const summary = await Transaction.findOne({
        attributes: [
          [
            sequelize.fn('COUNT', sequelize.col('Transaction.id')),
            'totalTransactions',
          ],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
          [
            sequelize.fn('SUM', sequelize.col('discountAmount')),
            'totalDiscounts',
          ],
          [sequelize.fn('AVG', sequelize.col('amount')), 'averageValue'],
        ],
        include: includeClause,
        where: whereClause,
        raw: true,
      });

      const analytics = {
        transactionTrend: transactionData.map((item) => ({
          date: item.date,
          transactions: parseInt(item.count),
          revenue: parseFloat(item.revenue || 0),
          discounts: parseFloat(item.discounts || 0),
        })),
        summary: {
          totalTransactions: parseInt(summary.totalTransactions || 0),
          totalRevenue: parseFloat(summary.totalRevenue || 0),
          totalDiscounts: parseFloat(summary.totalDiscounts || 0),
          averageValue: parseFloat(summary.averageValue || 0),
          discountRate:
            summary.totalRevenue > 0
              ? ((summary.totalDiscounts / summary.totalRevenue) * 100).toFixed(
                  2
                )
              : 0,
        },
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Transaction analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Transaction analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get revenue analytics
   * GET /api/admin/analytics/revenue
   */
  static async getRevenueAnalytics(req, res) {
    try {
      const {
        period = 'month',
        comparison = false,
        groupBy = 'day',
      } = req.query;

      const currentRange = Helpers.getDateRange(period);

      // Current period revenue
      const currentRevenue = await Transaction.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
        ],
        where: {
          createdAt: {
            [Op.between]: [currentRange.start, currentRange.end],
          },
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      let previousRevenue = null;
      if (comparison) {
        const diff = currentRange.end - currentRange.start;
        const previousRange = {
          start: new Date(currentRange.start.getTime() - diff),
          end: new Date(currentRange.end.getTime() - diff),
        };

        previousRevenue = await Transaction.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
          ],
          where: {
            createdAt: {
              [Op.between]: [previousRange.start, previousRange.end],
            },
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });
      }

      // Revenue by shop type
      const revenueByShopType = await Transaction.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('Transaction.amount')), 'revenue'],
          [
            sequelize.fn('COUNT', sequelize.col('Transaction.id')),
            'transactions',
          ],
        ],
        include: [
          {
            model: Shop,
            attributes: ['shopType'],
          },
        ],
        where: {
          createdAt: {
            [Op.between]: [currentRange.start, currentRange.end],
          },
        },
        group: ['Shop.shopType'],
        raw: true,
      });

      const analytics = {
        current: {
          data: currentRevenue.map((item) => ({
            date: item.date,
            revenue: parseFloat(item.revenue || 0),
            transactions: parseInt(item.transactions || 0),
          })),
          total: currentRevenue.reduce(
            (sum, item) => sum + parseFloat(item.revenue || 0),
            0
          ),
        },
        previous: previousRevenue
          ? {
              data: previousRevenue.map((item) => ({
                date: item.date,
                revenue: parseFloat(item.revenue || 0),
                transactions: parseInt(item.transactions || 0),
              })),
              total: previousRevenue.reduce(
                (sum, item) => sum + parseFloat(item.revenue || 0),
                0
              ),
            }
          : null,
        byShopType: revenueByShopType.reduce((acc, item) => {
          acc[item['Shop.shopType']] = {
            revenue: parseFloat(item.revenue || 0),
            transactions: parseInt(item.transactions || 0),
          };
          return acc;
        }, {}),
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Revenue analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Revenue analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get discount usage analytics
   * GET /api/admin/analytics/discounts
   */
  static async getDiscountAnalytics(req, res) {
    try {
      const { period = 'month', tier, ruleId } = req.query;

      const dateRange = Helpers.getDateRange(period);

      let whereClause = {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
        discountAmount: { [Op.gt]: 0 },
      };

      const includeClause = [];
      if (tier) {
        includeClause.push({
          model: User,
          attributes: [],
          where: { currentDiscountTier: tier },
        });
      }

      // Discount usage over time
      const discountUsage = await Transaction.findAll({
        attributes: [
          [
            sequelize.fn('DATE', sequelize.col('Transaction.createdAt')),
            'date',
          ],
          [
            sequelize.fn('COUNT', sequelize.col('Transaction.id')),
            'usageCount',
          ],
          [
            sequelize.fn('SUM', sequelize.col('discountAmount')),
            'totalDiscount',
          ],
          [
            sequelize.fn('AVG', sequelize.col('discountPercentage')),
            'avgPercentage',
          ],
        ],
        include: includeClause,
        where: whereClause,
        group: [sequelize.fn('DATE', sequelize.col('Transaction.createdAt'))],
        order: [
          [sequelize.fn('DATE', sequelize.col('Transaction.createdAt')), 'ASC'],
        ],
        raw: true,
      });

      // Discount by tier
      const discountByTier = await Transaction.findAll({
        attributes: [
          [
            sequelize.fn('SUM', sequelize.col('discountAmount')),
            'totalDiscount',
          ],
          [
            sequelize.fn('COUNT', sequelize.col('Transaction.id')),
            'usageCount',
          ],
          [
            sequelize.fn('AVG', sequelize.col('discountPercentage')),
            'avgPercentage',
          ],
        ],
        include: [
          {
            model: User,
            attributes: ['currentDiscountTier'],
          },
        ],
        where: whereClause,
        group: ['User.currentDiscountTier'],
        raw: true,
      });

      // Most used discount rules
      const topRules = await DiscountRule.findAll({
        attributes: [
          'id',
          'ruleName',
          'discountPercentage',
          'tier',
          [
            sequelize.fn('COUNT', sequelize.col('Transactions.id')),
            'usageCount',
          ],
          [
            sequelize.fn('SUM', sequelize.col('Transactions.discountAmount')),
            'totalDiscount',
          ],
        ],
        include: [
          {
            model: Transaction,
            attributes: [],
            where: {
              createdAt: {
                [Op.between]: [dateRange.start, dateRange.end],
              },
              discountAmount: { [Op.gt]: 0 },
            },
          },
        ],
        group: ['DiscountRule.id'],
        order: [
          [sequelize.fn('COUNT', sequelize.col('Transactions.id')), 'DESC'],
        ],
        limit: 10,
        subQuery: false,
      });

      const analytics = {
        usageTrend: discountUsage.map((item) => ({
          date: item.date,
          usageCount: parseInt(item.usageCount || 0),
          totalDiscount: parseFloat(item.totalDiscount || 0),
          avgPercentage: parseFloat(item.avgPercentage || 0),
        })),
        byTier: discountByTier.reduce((acc, item) => {
          acc[item['User.currentDiscountTier']] = {
            totalDiscount: parseFloat(item.totalDiscount || 0),
            usageCount: parseInt(item.usageCount || 0),
            avgPercentage: parseFloat(item.avgPercentage || 0),
          };
          return acc;
        }, {}),
        topRules: topRules.map((rule) => ({
          id: rule.id,
          ruleName: rule.ruleName,
          discountPercentage: rule.discountPercentage,
          tier: rule.tier,
          usageCount: parseInt(rule.dataValues.usageCount || 0),
          totalDiscount: parseFloat(rule.dataValues.totalDiscount || 0),
        })),
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Discount analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Discount analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get geographic analytics
   * GET /api/admin/analytics/geographic
   */
  static async getGeographicAnalytics(req, res) {
    try {
      const { type = 'users', level = 'city' } = req.query;

      let analytics = {};

      if (type === 'users') {
        analytics = await this.getCityDistribution('users');
      } else if (type === 'shops') {
        analytics = await this.getCityDistribution('shops');
      } else if (type === 'transactions') {
        analytics = await Transaction.findAll({
          attributes: [
            [
              sequelize.fn('SUM', sequelize.col('Transaction.amount')),
              'totalRevenue',
            ],
            [
              sequelize.fn('COUNT', sequelize.col('Transaction.id')),
              'totalTransactions',
            ],
          ],
          include: [
            {
              model: Shop,
              attributes: ['city'],
            },
          ],
          group: ['Shop.city'],
          order: [
            [sequelize.fn('SUM', sequelize.col('Transaction.amount')), 'DESC'],
          ],
          limit: 20,
          raw: true,
        });
      }

      res.json(
        ApiResponse.success(
          analytics,
          'Geographic analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Geographic analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get top performers analytics
   * GET /api/admin/analytics/top-performers
   */
  static async getTopPerformers(req, res) {
    try {
      const { type, metric, period = 'month', limit = 10 } = req.query;

      const dateRange = Helpers.getDateRange(period);

      let analytics = [];

      if (type === 'users') {
        if (metric === 'revenue') {
          analytics = await User.findAll({
            attributes: [
              'id',
              'fullName',
              'email',
              'totalSpent',
              'currentDiscountTier',
            ],
            order: [['totalSpent', 'DESC']],
            limit: parseInt(limit),
          });
        } else if (metric === 'transactions') {
          analytics = await User.findAll({
            attributes: [
              'id',
              'fullName',
              'email',
              'currentDiscountTier',
              [
                sequelize.fn('COUNT', sequelize.col('Transactions.id')),
                'transactionCount',
              ],
            ],
            include: [
              {
                model: Transaction,
                attributes: [],
                where: {
                  createdAt: {
                    [Op.between]: [dateRange.start, dateRange.end],
                  },
                },
              },
            ],
            group: ['User.id'],
            order: [
              [sequelize.fn('COUNT', sequelize.col('Transactions.id')), 'DESC'],
            ],
            limit: parseInt(limit),
            subQuery: false,
          });
        }
      } else if (type === 'shops') {
        if (metric === 'revenue') {
          analytics = await Shop.findAll({
            attributes: ['id', 'shopName', 'totalRevenue', 'city', 'shopType'],
            order: [['totalRevenue', 'DESC']],
            limit: parseInt(limit),
          });
        } else if (metric === 'transactions') {
          analytics = await Shop.findAll({
            attributes: [
              'id',
              'shopName',
              'totalTransactions',
              'city',
              'shopType',
            ],
            order: [['totalTransactions', 'DESC']],
            limit: parseInt(limit),
          });
        }
      }

      res.json(
        ApiResponse.success(analytics, 'Top performers retrieved successfully')
      );
    } catch (error) {
      logger.error('Top performers error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get growth analytics
   * GET /api/admin/analytics/growth
   */
  static async getGrowthAnalytics(req, res) {
    try {
      const { metric, period = 'month', comparison = false } = req.query;

      const currentRange = Helpers.getDateRange(period);

      let currentData = 0;
      let previousData = 0;
      let growthRate = 0;

      // Get current period data
      if (metric === 'users') {
        currentData = await User.count({
          where: {
            createdAt: {
              [Op.between]: [currentRange.start, currentRange.end],
            },
          },
        });
      } else if (metric === 'shops') {
        currentData = await Shop.count({
          where: {
            createdAt: {
              [Op.between]: [currentRange.start, currentRange.end],
            },
          },
        });
      } else if (metric === 'transactions') {
        currentData = await Transaction.count({
          where: {
            createdAt: {
              [Op.between]: [currentRange.start, currentRange.end],
            },
          },
        });
      } else if (metric === 'revenue') {
        currentData =
          (await Transaction.sum('amount', {
            where: {
              createdAt: {
                [Op.between]: [currentRange.start, currentRange.end],
              },
            },
          })) || 0;
      }

      // Get previous period data for comparison
      if (comparison) {
        const diff = currentRange.end - currentRange.start;
        const previousRange = {
          start: new Date(currentRange.start.getTime() - diff),
          end: new Date(currentRange.end.getTime() - diff),
        };

        if (metric === 'users') {
          previousData = await User.count({
            where: {
              createdAt: {
                [Op.between]: [previousRange.start, previousRange.end],
              },
            },
          });
        } else if (metric === 'shops') {
          previousData = await Shop.count({
            where: {
              createdAt: {
                [Op.between]: [previousRange.start, previousRange.end],
              },
            },
          });
        } else if (metric === 'transactions') {
          previousData = await Transaction.count({
            where: {
              createdAt: {
                [Op.between]: [previousRange.start, previousRange.end],
              },
            },
          });
        } else if (metric === 'revenue') {
          previousData =
            (await Transaction.sum('amount', {
              where: {
                createdAt: {
                  [Op.between]: [previousRange.start, previousRange.end],
                },
              },
            })) || 0;
        }

        // Calculate growth rate
        if (previousData > 0) {
          growthRate = (
            ((currentData - previousData) / previousData) *
            100
          ).toFixed(2);
        }
      }

      const analytics = {
        metric,
        period,
        currentPeriod: {
          value: currentData,
          period: `${currentRange.start.toISOString().split('T')[0]} to ${currentRange.end.toISOString().split('T')[0]}`,
        },
        previousPeriod: comparison
          ? {
              value: previousData,
              growthRate: parseFloat(growthRate),
              trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
            }
          : null,
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Growth analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Growth analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Generate custom report
   * POST /api/admin/analytics/custom-report
   */
  static async generateCustomReport(req, res) {
    try {
      const {
        reportName,
        metrics,
        filters = {},
        groupBy,
        startDate,
        endDate,
      } = req.body;

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };

      const report = {
        reportName,
        generatedAt: new Date(),
        dateRange: {
          start: startDate,
          end: endDate,
        },
        data: {},
      };

      // Generate data for each requested metric
      for (const metric of metrics) {
        if (metric === 'users') {
          report.data.users = await this.getCustomUserData(
            dateRange,
            filters,
            groupBy
          );
        } else if (metric === 'shops') {
          report.data.shops = await this.getCustomShopData(
            dateRange,
            filters,
            groupBy
          );
        } else if (metric === 'transactions') {
          report.data.transactions = await this.getCustomTransactionData(
            dateRange,
            filters,
            groupBy
          );
        } else if (metric === 'revenue') {
          report.data.revenue = await this.getCustomRevenueData(
            dateRange,
            filters,
            groupBy
          );
        } else if (metric === 'discounts') {
          report.data.discounts = await this.getCustomDiscountData(
            dateRange,
            filters,
            groupBy
          );
        }
      }

      res.json(
        ApiResponse.success(report, 'Custom report generated successfully')
      );
    } catch (error) {
      logger.error('Custom report error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Export analytics data
   * POST /api/admin/analytics/export
   */
  static async exportAnalytics(req, res) {
    try {
      const {
        reportType,
        format = 'csv',
        period = 'month',
        filters = {},
      } = req.body;

      let data = [];
      let filename = '';

      switch (reportType) {
        case 'users':
          data = await this.exportUserData(period, filters);
          filename = `users_report_${period}`;
          break;
        case 'shops':
          data = await this.exportShopData(period, filters);
          filename = `shops_report_${period}`;
          break;
        case 'transactions':
          data = await this.exportTransactionData(period, filters);
          filename = `transactions_report_${period}`;
          break;
        case 'revenue':
          data = await this.exportRevenueData(period, filters);
          filename = `revenue_report_${period}`;
          break;
        default:
          return res
            .status(400)
            .json(ApiResponse.error('Invalid report type', 400));
      }

      if (format === 'csv') {
        const csv = Helpers.generateCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}.csv`
        );
        res.send(csv);
      } else {
        res.json(
          ApiResponse.success(data, 'Analytics data exported successfully')
        );
      }
    } catch (error) {
      logger.error('Export analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get real-time analytics
   * GET /api/admin/analytics/realtime
   */
  static async getRealtimeAnalytics(req, res) {
    try {
      const { metrics } = req.query;
      const requestedMetrics = metrics
        ? metrics.split(',')
        : ['transactions', 'revenue', 'users'];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const realtimeData = {};

      if (requestedMetrics.includes('transactions')) {
        realtimeData.transactions = {
          today: await Transaction.count({
            where: {
              createdAt: {
                [Op.gte]: today,
              },
            },
          }),
          lastHour: await Transaction.count({
            where: {
              createdAt: {
                [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000),
              },
            },
          }),
        };
      }

      if (requestedMetrics.includes('revenue')) {
        realtimeData.revenue = {
          today:
            (await Transaction.sum('amount', {
              where: {
                createdAt: {
                  [Op.gte]: today,
                },
              },
            })) || 0,
          lastHour:
            (await Transaction.sum('amount', {
              where: {
                createdAt: {
                  [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000),
                },
              },
            })) || 0,
        };
      }

      if (requestedMetrics.includes('users')) {
        realtimeData.users = {
          today: await User.count({
            where: {
              createdAt: {
                [Op.gte]: today,
              },
            },
          }),
          online: await User.count({
            where: {
              lastLoginAt: {
                [Op.gte]: new Date(now.getTime() - 15 * 60 * 1000), // Last 15 minutes
              },
            },
          }),
        };
      }

      res.json(
        ApiResponse.success(
          realtimeData,
          'Real-time analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Real-time analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Compare analytics periods
   * GET /api/admin/analytics/compare
   */
  static async compareAnalytics(req, res) {
    try {
      const {
        metric,
        period1,
        period2,
        startDate1,
        endDate1,
        startDate2,
        endDate2,
      } = req.query;

      let range1, range2;

      if (period1 === 'custom' && startDate1 && endDate1) {
        range1 = { start: new Date(startDate1), end: new Date(endDate1) };
      } else {
        range1 = Helpers.getDateRange(period1);
      }

      if (period2 === 'custom' && startDate2 && endDate2) {
        range2 = { start: new Date(startDate2), end: new Date(endDate2) };
      } else {
        range2 = Helpers.getDateRange(period2);
      }

      let data1 = 0,
        data2 = 0;

      if (metric === 'users') {
        data1 = await User.count({
          where: {
            createdAt: {
              [Op.between]: [range1.start, range1.end],
            },
          },
        });
        data2 = await User.count({
          where: {
            createdAt: {
              [Op.between]: [range2.start, range2.end],
            },
          },
        });
      } else if (metric === 'shops') {
        data1 = await Shop.count({
          where: {
            createdAt: {
              [Op.between]: [range1.start, range1.end],
            },
          },
        });
        data2 = await Shop.count({
          where: {
            createdAt: {
              [Op.between]: [range2.start, range2.end],
            },
          },
        });
      } else if (metric === 'transactions') {
        data1 = await Transaction.count({
          where: {
            createdAt: {
              [Op.between]: [range1.start, range1.end],
            },
          },
        });
        data2 = await Transaction.count({
          where: {
            createdAt: {
              [Op.between]: [range2.start, range2.end],
            },
          },
        });
      } else if (metric === 'revenue') {
        data1 =
          (await Transaction.sum('amount', {
            where: {
              createdAt: {
                [Op.between]: [range1.start, range1.end],
              },
            },
          })) || 0;
        data2 =
          (await Transaction.sum('amount', {
            where: {
              createdAt: {
                [Op.between]: [range2.start, range2.end],
              },
            },
          })) || 0;
      }

      const comparison = {
        metric,
        period1: {
          label: period1,
          value: data1,
          range: range1,
        },
        period2: {
          label: period2,
          value: data2,
          range: range2,
        },
        difference: {
          absolute: data1 - data2,
          percentage:
            data2 > 0 ? (((data1 - data2) / data2) * 100).toFixed(2) : 0,
        },
      };

      res.json(
        ApiResponse.success(
          comparison,
          'Analytics comparison retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Analytics comparison error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get predictive analytics
   * GET /api/admin/analytics/predictions
   */
  static async getPredictiveAnalytics(req, res) {
    try {
      const { metric, horizon = 30 } = req.query;

      // Get historical data for the last 90 days
      const historicalRange = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      let historicalData = [];

      if (metric === 'users') {
        historicalData = await User.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'value'],
          ],
          where: {
            createdAt: {
              [Op.between]: [historicalRange.start, historicalRange.end],
            },
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });
      } else if (metric === 'revenue') {
        historicalData = await Transaction.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'value'],
          ],
          where: {
            createdAt: {
              [Op.between]: [historicalRange.start, historicalRange.end],
            },
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });
      } else if (metric === 'transactions') {
        historicalData = await Transaction.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'value'],
          ],
          where: {
            createdAt: {
              [Op.between]: [historicalRange.start, historicalRange.end],
            },
          },
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
          raw: true,
        });
      }

      // Simple linear trend prediction
      const predictions = this.calculatePredictions(
        historicalData,
        parseInt(horizon)
      );

      const analytics = {
        metric,
        horizon: parseInt(horizon),
        historical: historicalData.map((item) => ({
          date: item.date,
          value: parseFloat(item.value || 0),
        })),
        predictions,
        confidence: 'medium', // This would be more sophisticated in a real implementation
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Predictive analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Predictive analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // Helper methods
  static async getTierDistribution() {
    return await User.findAll({
      attributes: [
        'currentDiscountTier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['currentDiscountTier'],
      raw: true,
    });
  }

  static async getCityDistribution(type, whereClause = {}) {
    const model = type === 'users' ? User : Shop;
    return await model.findAll({
      attributes: [
        'city',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        ...whereClause,
        city: { [Op.ne]: null },
      },
      group: ['city'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });
  }

  static async getShopTypeDistribution(whereClause = {}) {
    return await Shop.findAll({
      attributes: [
        'shopType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: whereClause,
      group: ['shopType'],
      raw: true,
    });
  }

  // Custom report data methods
  static async getCustomUserData(dateRange, filters, groupBy) {
    const whereClause = {
      createdAt: {
        [Op.between]: [dateRange.start, dateRange.end],
      },
      ...filters,
    };

    return await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: whereClause,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  }

  static async getCustomShopData(dateRange, filters, groupBy) {
    const whereClause = {
      createdAt: {
        [Op.between]: [dateRange.start, dateRange.end],
      },
      ...filters,
    };

    return await Shop.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: whereClause,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  }

  static async getCustomTransactionData(dateRange, filters, groupBy) {
    const whereClause = {
      createdAt: {
        [Op.between]: [dateRange.start, dateRange.end],
      },
      ...filters,
    };

    return await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
      ],
      where: whereClause,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  }

  static async getCustomRevenueData(dateRange, filters, groupBy) {
    const whereClause = {
      createdAt: {
        [Op.between]: [dateRange.start, dateRange.end],
      },
      ...filters,
    };

    return await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
      ],
      where: whereClause,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  }

  static async getCustomDiscountData(dateRange, filters, groupBy) {
    const whereClause = {
      createdAt: {
        [Op.between]: [dateRange.start, dateRange.end],
      },
      discountAmount: { [Op.gt]: 0 },
      ...filters,
    };

    return await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('discountAmount')), 'totalDiscount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount'],
      ],
      where: whereClause,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  }

  // Prediction calculation helper
  static calculatePredictions(historicalData, horizon) {
    if (historicalData.length < 2) {
      return [];
    }

    // Simple linear regression for trend
    const values = historicalData.map((item) => parseFloat(item.value || 0));
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedValue = Math.max(0, intercept + slope * (n + i - 1));

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(predictedValue * 100) / 100,
      });
    }

    return predictions;
  }

  // Export data methods
  static async exportUserData(period, filters) {
    const dateRange = Helpers.getDateRange(period);

    const users = await User.findAll({
      include: [
        {
          model: DiscountCard,
          as: 'discountCard',
          attributes: ['cardNumber', 'isActive'],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
        ...filters,
      },
      order: [['createdAt', 'DESC']],
    });

    return users.map((user) => ({
      'User ID': user.id,
      'Full Name': user.fullName,
      Email: user.email,
      Phone: user.phone,
      Tier: user.currentDiscountTier,
      'Total Spent': user.totalSpent,
      Active: user.isActive ? 'Yes' : 'No',
      City: user.city || 'N/A',
      'Registration Date': user.createdAt.toISOString().split('T')[0],
      'Card Number': user.discountCard?.cardNumber || 'N/A',
      'Card Active': user.discountCard?.isActive ? 'Yes' : 'No',
    }));
  }

  static async exportShopData(period, filters) {
    const dateRange = Helpers.getDateRange(period);

    const shops = await Shop.findAll({
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
        ...filters,
      },
      order: [['createdAt', 'DESC']],
    });

    return shops.map((shop) => ({
      'Shop ID': shop.id,
      'Shop Name': shop.shopName,
      'Owner Name': shop.ownerName,
      Email: shop.email,
      Phone: shop.phone,
      'Shop Type': shop.shopType,
      City: shop.city,
      Status: shop.status,
      'Total Revenue': shop.totalRevenue,
      'Total Transactions': shop.totalTransactions,
      'Registration Date': shop.createdAt.toISOString().split('T')[0],
      'Approval Date': shop.approvedAt
        ? shop.approvedAt.toISOString().split('T')[0]
        : 'N/A',
    }));
  }

  static async exportTransactionData(period, filters) {
    const dateRange = Helpers.getDateRange(period);

    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          attributes: ['fullName', 'email', 'currentDiscountTier'],
        },
        {
          model: Shop,
          attributes: ['shopName', 'shopType'],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
        ...filters,
      },
      order: [['createdAt', 'DESC']],
    });

    return transactions.map((txn) => ({
      'Transaction ID': txn.transactionId,
      'User Name': txn.User?.fullName || 'N/A',
      'User Email': txn.User?.email || 'N/A',
      'User Tier': txn.User?.currentDiscountTier || 'N/A',
      'Shop Name': txn.Shop?.shopName || 'N/A',
      'Shop Type': txn.Shop?.shopType || 'N/A',
      Amount: txn.amount,
      'Discount %': txn.discountPercentage,
      'Discount Amount': txn.discountAmount,
      'Final Amount': txn.finalAmount,
      Status: txn.status,
      Date: txn.createdAt.toISOString().split('T')[0],
    }));
  }

  static async exportRevenueData(period, filters) {
    const dateRange = Helpers.getDateRange(period);

    const revenueData = await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('SUM', sequelize.col('discountAmount')), 'discounts'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avgTransaction'],
      ],
      where: {
        createdAt: {
          [Op.between]: [dateRange.start, dateRange.end],
        },
        ...filters,
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });

    return revenueData.map((item) => ({
      Date: item.date,
      Transactions: parseInt(item.transactions || 0),
      Revenue: parseFloat(item.revenue || 0),
      'Discounts Given': parseFloat(item.discounts || 0),
      'Average Transaction': parseFloat(item.avgTransaction || 0),
      'Net Revenue':
        parseFloat(item.revenue || 0) - parseFloat(item.discounts || 0),
    }));
  }
}

module.exports = AnalyticsController;
