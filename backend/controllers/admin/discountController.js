const { DiscountRule, Shop, Transaction, sequelize } = require('../../models');

class DiscountController {
  /**
   * Get all discount rules with pagination and filters
   * GET /api/admin/discounts
   */
  static async getAllDiscountRules(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const shopId = req.query.shopId;
      const tier = req.query.tier;
      const status = req.query.status;
      const type = req.query.type;

      const whereClause = {};

      if (shopId) {
        whereClause.shopId = shopId;
      }

      if (tier) {
        whereClause.tier = tier;
      }

      if (status) {
        whereClause.isActive = status === 'active';
      }

      if (type === 'global') {
        whereClause.shopId = null;
      } else if (type === 'shop_specific') {
        whereClause.shopId = { [Op.ne]: null };
      }

      const { count, rows: rules } = await DiscountRule.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Shop,
            attributes: ['shopName', 'shopType'],
            required: false,
          },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(
          rules,
          pagination,
          'Discount rules retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get discount rules error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get discount rule by ID
   * GET /api/admin/discounts/:id
   */
  static async getDiscountRuleById(req, res) {
    try {
      const { id } = req.params;

      const rule = await DiscountRule.findByPk(id, {
        include: [
          {
            model: Shop,
            attributes: ['shopName', 'shopType', 'ownerName'],
            required: false,
          },
        ],
      });

      if (!rule) {
        return res
          .status(404)
          .json(ApiResponse.error('Discount rule not found', 404));
      }

      res.json(
        ApiResponse.success(rule, 'Discount rule retrieved successfully')
      );
    } catch (error) {
      logger.error('Get discount rule by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Create new discount rule
   * POST /api/admin/discounts
   */
  static async createDiscountRule(req, res) {
    try {
      const {
        ruleName,
        description,
        minAmount,
        maxAmount,
        discountPercentage,
        tier,
        shopId,
        validFrom,
        validTo,
        maxUsage,
        isStackable,
      } = req.body;

      // If shopId is provided, verify shop exists
      if (shopId) {
        const shop = await Shop.findByPk(shopId);
        if (!shop) {
          return res.status(404).json(ApiResponse.error('Shop not found', 404));
        }
      }

      const rule = await DiscountRule.create({
        ruleName: ruleName.trim(),
        description: description?.trim(),
        minAmount: parseFloat(minAmount),
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        discountPercentage: parseFloat(discountPercentage),
        tier,
        shopId: shopId || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTo: validTo ? new Date(validTo) : null,
        maxUsage: maxUsage ? parseInt(maxUsage) : null,
        isStackable: isStackable || false,
        isActive: true,
      });

      logger.info(`Discount rule created by admin: ${ruleName}`);

      res
        .status(201)
        .json(ApiResponse.success(rule, 'Discount rule created successfully'));
    } catch (error) {
      logger.error('Create discount rule error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update discount rule
   * PUT /api/admin/discounts/:id
   */
  static async updateDiscountRule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const rule = await DiscountRule.findByPk(id);
      if (!rule) {
        return res
          .status(404)
          .json(ApiResponse.error('Discount rule not found', 404));
      }

      const allowedFields = [
        'ruleName',
        'description',
        'minAmount',
        'maxAmount',
        'discountPercentage',
        'tier',
        'isActive',
        'validFrom',
        'validTo',
        'maxUsage',
        'isStackable',
      ];

      const filteredUpdateData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          if (
            ['minAmount', 'maxAmount', 'discountPercentage'].includes(field) &&
            updateData[field] !== null
          ) {
            filteredUpdateData[field] = parseFloat(updateData[field]);
          } else if (
            ['maxUsage'].includes(field) &&
            updateData[field] !== null
          ) {
            filteredUpdateData[field] = parseInt(updateData[field]);
          } else if (
            ['validFrom', 'validTo'].includes(field) &&
            updateData[field] !== null
          ) {
            filteredUpdateData[field] = new Date(updateData[field]);
          } else {
            filteredUpdateData[field] = updateData[field];
          }
        }
      });

      await rule.update(filteredUpdateData);

      logger.info(`Discount rule updated by admin: ${rule.ruleName}`);

      res.json(ApiResponse.success(rule, 'Discount rule updated successfully'));
    } catch (error) {
      logger.error('Update discount rule error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Toggle discount rule status
   * PUT /api/admin/discounts/:id/toggle
   */
  static async toggleDiscountRule(req, res) {
    try {
      const { id } = req.params;

      const rule = await DiscountRule.findByPk(id);
      if (!rule) {
        return res
          .status(404)
          .json(ApiResponse.error('Discount rule not found', 404));
      }

      await rule.update({ isActive: !rule.isActive });

      logger.info(
        `Discount rule ${rule.isActive ? 'activated' : 'deactivated'} by admin: ${rule.ruleName}`
      );

      res.json(
        ApiResponse.success(
          null,
          `Discount rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`
        )
      );
    } catch (error) {
      logger.error('Toggle discount rule error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Delete discount rule
   * DELETE /api/admin/discounts/:id
   */
  static async deleteDiscountRule(req, res) {
    try {
      const { id } = req.params;

      const rule = await DiscountRule.findByPk(id);
      if (!rule) {
        return res
          .status(404)
          .json(ApiResponse.error('Discount rule not found', 404));
      }

      await rule.destroy();

      logger.info(`Discount rule deleted by admin: ${rule.ruleName}`);

      res.json(ApiResponse.success(null, 'Discount rule deleted successfully'));
    } catch (error) {
      logger.error('Delete discount rule error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Duplicate discount rule
   * POST /api/admin/discounts/:id/duplicate
   */
  static async duplicateDiscountRule(req, res) {
    try {
      const { id } = req.params;
      const { ruleName } = req.body;

      const originalRule = await DiscountRule.findByPk(id);
      if (!originalRule) {
        return res
          .status(404)
          .json(ApiResponse.error('Discount rule not found', 404));
      }

      const duplicatedRule = await DiscountRule.create({
        ruleName: ruleName.trim(),
        description: originalRule.description,
        minAmount: originalRule.minAmount,
        maxAmount: originalRule.maxAmount,
        discountPercentage: originalRule.discountPercentage,
        tier: originalRule.tier,
        shopId: originalRule.shopId,
        validFrom: new Date(),
        validTo: originalRule.validTo,
        maxUsage: originalRule.maxUsage,
        isStackable: originalRule.isStackable,
        isActive: false, // Start as inactive
      });

      logger.info(
        `Discount rule duplicated by admin: ${originalRule.ruleName} -> ${ruleName}`
      );

      res
        .status(201)
        .json(
          ApiResponse.success(
            duplicatedRule,
            'Discount rule duplicated successfully'
          )
        );
    } catch (error) {
      logger.error('Duplicate discount rule error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Test discount calculation
   * POST /api/admin/discounts/test-calculation
   */
  static async testDiscountCalculation(req, res) {
    try {
      const { amount, tier, shopId } = req.body;

      const whereClause = {
        isActive: true,
        minAmount: { [Op.lte]: amount },
        tier: tier,
      };

      if (req.body.maxAmount) {
        whereClause.maxAmount = { [Op.gte]: amount };
      }

      if (shopId) {
        whereClause[Op.or] = [
          { shopId: shopId },
          { shopId: null }, // Include global rules
        ];
      } else {
        whereClause.shopId = null; // Only global rules
      }

      const applicableRules = await DiscountRule.findAll({
        where: whereClause,
        include: shopId ? [{ model: Shop, attributes: ['shopName'] }] : [],
        order: [['discountPercentage', 'DESC']], // Highest discount first
      });

      if (applicableRules.length === 0) {
        return res.json(
          ApiResponse.success(
            {
              originalAmount: parseFloat(amount),
              applicableRules: [],
              bestDiscount: null,
              finalAmount: parseFloat(amount),
              totalSavings: 0,
            },
            'No applicable discount rules found'
          )
        );
      }

      const bestRule = applicableRules[0];
      const discountCalculation = Helpers.calculateDiscount(
        amount,
        bestRule.discountPercentage
      );

      const result = {
        originalAmount: discountCalculation.originalAmount,
        applicableRules: applicableRules.map((rule) => ({
          id: rule.id,
          ruleName: rule.ruleName,
          discountPercentage: rule.discountPercentage,
          shopName: rule.Shop?.shopName || 'Global Rule',
          tier: rule.tier,
        })),
        bestDiscount: {
          ruleId: bestRule.id,
          ruleName: bestRule.ruleName,
          percentage: bestRule.discountPercentage,
        },
        discountAmount: discountCalculation.discountAmount,
        finalAmount: discountCalculation.finalAmount,
        totalSavings: discountCalculation.discountAmount,
      };

      res.json(ApiResponse.success(result, 'Discount calculation completed'));
    } catch (error) {
      logger.error('Test discount calculation error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get discount statistics
   * GET /api/admin/discounts/stats
   */
  static async getDiscountStats(req, res) {
    try {
      const totalRules = await DiscountRule.count();
      const activeRules = await DiscountRule.count({
        where: { isActive: true },
      });
      const globalRules = await DiscountRule.count({ where: { shopId: null } });
      const shopSpecificRules = await DiscountRule.count({
        where: { shopId: { [Op.ne]: null } },
      });

      const rulesByTier = await DiscountRule.findAll({
        attributes: [
          'tier',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['tier'],
        raw: true,
      });

      const averageDiscount = await DiscountRule.findOne({
        attributes: [
          [
            sequelize.fn('AVG', sequelize.col('discountPercentage')),
            'averageDiscount',
          ],
        ],
        where: { isActive: true },
        raw: true,
      });

      const stats = {
        totalRules,
        activeRules,
        inactiveRules: totalRules - activeRules,
        globalRules,
        shopSpecificRules,
        averageDiscount: parseFloat(
          averageDiscount.averageDiscount || 0
        ).toFixed(2),
        rulesByTier: rulesByTier.reduce((acc, tier) => {
          acc[tier.tier] = parseInt(tier.count);
          return acc;
        }, {}),
      };

      res.json(
        ApiResponse.success(stats, 'Discount statistics retrieved successfully')
      );
    } catch (error) {
      logger.error('Get discount stats error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Bulk update discount rules
   * POST /api/admin/discounts/bulk-update
   */
  static async bulkUpdateDiscountRules(req, res) {
    try {
      const { ruleIds, action } = req.body;

      const rules = await DiscountRule.findAll({
        where: { id: { [Op.in]: ruleIds } },
      });

      if (rules.length === 0) {
        return res
          .status(404)
          .json(ApiResponse.error('No discount rules found', 404));
      }

      let updateData = {};

      switch (action) {
        case 'activate':
          updateData.isActive = true;
          break;
        case 'deactivate':
          updateData.isActive = false;
          break;
        case 'delete':
          await DiscountRule.destroy({ where: { id: { [Op.in]: ruleIds } } });
          logger.info(
            `Bulk delete performed on ${ruleIds.length} discount rules`
          );
          return res.json(
            ApiResponse.success(
              null,
              `${ruleIds.length} discount rules deleted successfully`
            )
          );
        default:
          return res
            .status(400)
            .json(ApiResponse.error('Invalid bulk action', 400));
      }

      await DiscountRule.update(updateData, {
        where: { id: { [Op.in]: ruleIds } },
      });

      logger.info(
        `Bulk ${action} performed on ${ruleIds.length} discount rules`
      );

      res.json(
        ApiResponse.success(
          null,
          `${ruleIds.length} discount rules ${action}d successfully`
        )
      );
    } catch (error) {
      logger.error('Bulk update discount rules error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }
}

module.exports = DiscountController;
