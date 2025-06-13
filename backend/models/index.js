const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const logger = require('../utils/logger');

// Initialize database object
const db = {};

// Create Sequelize instance
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: config.logging || ((msg) => logger.info(`[Sequelize] ${msg}`)),
  });
}

// Import all model files automatically
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Manually define models to ensure proper loading order (if some models weren't auto-loaded)
db.Admin = db.Admin || require('./Admin')(sequelize, DataTypes);
db.User = db.User || require('./User')(sequelize, DataTypes);
db.Shop = db.Shop || require('./Shop')(sequelize, DataTypes);
db.DiscountCard =
  db.DiscountCard || require('./DiscountCard')(sequelize, DataTypes);
db.Transaction =
  db.Transaction || require('./Transaction')(sequelize, DataTypes);
db.DiscountRule =
  db.DiscountRule || require('./DiscountRule')(sequelize, DataTypes);
db.Banner = db.Banner || require('./Banner')(sequelize, DataTypes);
db.Blog = db.Blog || require('./Blog')(sequelize, DataTypes);
db.FAQ = db.FAQ || require('./FAQ')(sequelize, DataTypes);

// OPTION 1: Use only the automatic association setup
// Define all model associations using each model's associate method
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// OPTION 2: If you prefer manual control, comment out the above block and uncomment this:
// defineAssociations(db);

// Add Sequelize instance and constructor to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * Define all model associations manually
 * Only use this if you're NOT using the automatic associate() method calls above
 * @param {Object} db - Database models object
 */
function defineAssociations(db) {
  // User associations
  db.User.hasOne(db.DiscountCard, {
    foreignKey: 'userId',
    as: 'discountCard',
    onDelete: 'CASCADE',
  });

  db.User.hasMany(db.Transaction, {
    foreignKey: 'userId',
    as: 'transactions',
    onDelete: 'CASCADE',
  });

  // Self-referencing association for user referrals
  db.User.belongsTo(db.User, {
    foreignKey: 'referredBy',
    as: 'referrer',
    constraints: false,
  });

  db.User.hasMany(db.User, {
    foreignKey: 'referredBy',
    as: 'referrals',
    constraints: false,
  });

  // DiscountCard associations
  db.DiscountCard.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
  });

  // Shop associations
  db.Shop.hasMany(db.Transaction, {
    foreignKey: 'shopId',
    as: 'transactions',
    onDelete: 'CASCADE',
  });

  db.Shop.hasMany(db.DiscountRule, {
    foreignKey: 'shopId',
    as: 'discountRules',
    onDelete: 'CASCADE',
  });

  // Admin associations for shop approval tracking
  db.Shop.belongsTo(db.Admin, {
    foreignKey: 'approvedBy',
    as: 'approver',
    constraints: false,
  });

  // Transaction associations
  db.Transaction.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
  });

  db.Transaction.belongsTo(db.Shop, {
    foreignKey: 'shopId',
    as: 'shop',
    onDelete: 'CASCADE',
  });

  db.Transaction.belongsTo(db.DiscountRule, {
    foreignKey: 'discountRuleId',
    as: 'discountRule',
    constraints: false,
  });

  // DiscountRule associations
  db.DiscountRule.belongsTo(db.Shop, {
    foreignKey: 'shopId',
    as: 'shop',
    constraints: false, // Allow global rules (shopId = null)
  });

  db.DiscountRule.hasMany(db.Transaction, {
    foreignKey: 'discountRuleId',
    as: 'transactions',
  });

  // Admin associations
  db.Admin.hasMany(db.Shop, {
    foreignKey: 'approvedBy',
    as: 'approvedShops',
  });
}

// Add model hooks for common operations
addModelHooks(db);

// Add custom instance methods
addInstanceMethods(db);

// Add custom class methods
addClassMethods(db);

/**
 * Add common model hooks
 * @param {Object} db - Database models object
 */
function addModelHooks(db) {
  
  // Transaction hooks
  db.Transaction.addHook('afterCreate', async (transaction, options) => {
    try {
      // Update user's total spent
      const user = await db.User.findByPk(transaction.userId, {
        transaction: options.transaction,
      });

      if (user) {
        const newTotalSpent =
          parseFloat(user.totalSpent || 0) + parseFloat(transaction.amount);
        await user.update(
          { totalSpent: newTotalSpent },
          {
            transaction: options.transaction,
          }
        );
      }

      // Update shop's total revenue and transaction count
      const shop = await db.Shop.findByPk(transaction.shopId, {
        transaction: options.transaction,
      });

      if (shop) {
        const newTotalRevenue =
          parseFloat(shop.totalRevenue || 0) + parseFloat(transaction.amount);
        const newTotalTransactions = parseInt(shop.totalTransactions || 0) + 1;

        await shop.update(
          {
            totalRevenue: newTotalRevenue,
            totalTransactions: newTotalTransactions,
          },
          { transaction: options.transaction }
        );
      }

      logger.info(`Transaction processed: ${transaction.transactionId}`);
    } catch (error) {
      logger.error('Error processing transaction hooks:', error);
    }
  });

  // Shop hooks
  db.Shop.addHook('beforeValidate', (shop, options) => {
    // Normalize email and shop name
    if (shop.email) {
      shop.email = shop.email.toLowerCase().trim();
    }
    if (shop.shopName) {
      shop.shopName = shop.shopName.trim();
    }
    if (shop.ownerName) {
      shop.ownerName = shop.ownerName.trim();
    }
  });

  // Admin hooks
  db.Admin.addHook('beforeValidate', (admin, options) => {
    // Normalize email and username
    if (admin.email) {
      admin.email = admin.email.toLowerCase().trim();
    }
    if (admin.username) {
      admin.username = admin.username.toLowerCase().trim();
    }
  });

  // Blog hooks
  db.Blog.addHook('beforeValidate', (blog, options) => {
    // Auto-generate slug if not provided
    if (blog.title && !blog.slug) {
      blog.slug = require('../utils/helpers').slugify(blog.title);
    }
  });

  db.Blog.addHook('beforeCreate', (blog, options) => {
    // Set publishedAt if isPublished is true
    if (blog.isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
  });

  db.Blog.addHook('beforeUpdate', (blog, options) => {
    // Update publishedAt when publishing for the first time
    if (blog.changed('isPublished')) {
      if (blog.isPublished && !blog.publishedAt) {
        blog.publishedAt = new Date();
      } else if (!blog.isPublished) {
        blog.publishedAt = null;
      }
    }
  });
}

/**
 * Add custom instance methods to models
 * @param {Object} db - Database models object
 */
function addInstanceMethods(db) {
  // User instance methods
  db.User.prototype.getFullProfile = async function () {
    return await db.User.findByPk(this.id, {
      include: [
        {
          model: db.DiscountCard,
          as: 'discountCard',
        },
        {
          model: db.Transaction,
          as: 'transactions',
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: db.Shop,
              as: 'shop',
              attributes: ['shopName', 'logo'],
            },
          ],
        },
      ],
    });
  };

  db.User.prototype.calculateNextTierRequirement = function () {
    const helpers = require('../utils/helpers');
    const tierRequirements = helpers.getTierRequirements();
    const currentSpent = parseFloat(this.totalSpent || 0);

    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const currentTierIndex = tiers.indexOf(this.currentDiscountTier);

    if (currentTierIndex < tiers.length - 1) {
      const nextTier = tiers[currentTierIndex + 1];
      const requiredAmount = tierRequirements[nextTier].min;
      return {
        nextTier,
        requiredAmount,
        remainingAmount: requiredAmount - currentSpent,
      };
    }

    return null; // Already at highest tier
  };

  // Shop instance methods
  db.Shop.prototype.getAnalytics = async function (startDate, endDate) {
    const whereClause = { shopId: this.id };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const analytics = await db.Transaction.findOne({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalTransactions'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalRevenue'],
        [
          db.sequelize.fn('SUM', db.sequelize.col('discountAmount')),
          'totalDiscountGiven',
        ],
        [
          db.sequelize.fn('AVG', db.sequelize.col('amount')),
          'averageTransaction',
        ],
      ],
      where: whereClause,
      raw: true,
    });

    return {
      totalTransactions: parseInt(analytics.totalTransactions || 0),
      totalRevenue: parseFloat(analytics.totalRevenue || 0),
      totalDiscountGiven: parseFloat(analytics.totalDiscountGiven || 0),
      averageTransaction: parseFloat(analytics.averageTransaction || 0),
    };
  };

  // Transaction instance methods
  db.Transaction.prototype.calculateDiscount = function () {
    const helpers = require('../utils/helpers');
    return helpers.calculateDiscount(this.amount, this.discountPercentage);
  };

  // DiscountRule instance methods
  db.DiscountRule.prototype.isApplicable = function (
    amount,
    userTier,
    shopId = null
  ) {
    // Check if rule is active
    if (!this.isActive) return false;

    // Check amount range
    if (amount < this.minAmount) return false;
    if (this.maxAmount && amount > this.maxAmount) return false;

    // Check tier
    if (this.tier !== userTier) return false;

    // Check shop specificity
    if (this.shopId && this.shopId !== shopId) return false;

    // Check validity dates
    const now = new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validTo && now > this.validTo) return false;

    return true;
  };
}

/**
 * Add custom class methods to models
 * @param {Object} db - Database models object
 */
function addClassMethods(db) {
  // User class methods
  db.User.findActiveUsers = function (options = {}) {
    return this.findAll({
      where: {
        isActive: true,
        ...options.where,
      },
      ...options,
    });
  };

  db.User.findByTier = function (tier, options = {}) {
    return this.findAll({
      where: {
        currentDiscountTier: tier,
        ...options.where,
      },
      ...options,
    });
  };

  db.User.getRegistrationStats = async function (period = 'month') {
    const helpers = require('../utils/helpers');
    const dateRange = helpers.getDateRange(period);

    return await this.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: {
          [db.Sequelize.Op.between]: [dateRange.start, dateRange.end],
        },
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
  };

  // Shop class methods
  db.Shop.findApprovedShops = function (options = {}) {
    return this.findAll({
      where: {
        status: 'approved',
        isActive: true,
        ...options.where,
      },
      ...options,
    });
  };

  db.Shop.findPendingApproval = function (options = {}) {
    return this.findAll({
      where: {
        status: 'pending',
        ...options.where,
      },
      order: [['createdAt', 'ASC']], // FIFO
      ...options,
    });
  };

  db.Shop.getTopPerformers = function (limit = 10, metric = 'totalRevenue') {
    return this.findAll({
      where: {
        status: 'approved',
        isActive: true,
      },
      order: [[metric, 'DESC']],
      limit,
    });
  };

  // Transaction class methods
  db.Transaction.getRevenueStats = async function (
    period = 'month',
    shopId = null
  ) {
    const helpers = require('../utils/helpers');
    const dateRange = helpers.getDateRange(period);

    const whereClause = {
      createdAt: {
        [db.Sequelize.Op.between]: [dateRange.start, dateRange.end],
      },
    };

    if (shopId) {
      whereClause.shopId = shopId;
    }

    return await this.findOne({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalTransactions'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalRevenue'],
        [
          db.sequelize.fn('SUM', db.sequelize.col('discountAmount')),
          'totalDiscountGiven',
        ],
        [
          db.sequelize.fn('AVG', db.sequelize.col('amount')),
          'averageTransaction',
        ],
      ],
      where: whereClause,
      raw: true,
    });
  };

  // DiscountRule class methods
  db.DiscountRule.findApplicableRules = function (
    amount,
    userTier,
    shopId = null
  ) {
    const whereClause = {
      isActive: true,
      minAmount: { [db.Sequelize.Op.lte]: amount },
      tier: userTier,
    };

    // Handle max amount
    whereClause[db.Sequelize.Op.or] = [
      { maxAmount: null },
      { maxAmount: { [db.Sequelize.Op.gte]: amount } },
    ];

    // Handle shop specificity (include global rules)
    if (shopId) {
      whereClause[db.Sequelize.Op.or] = [{ shopId: shopId }, { shopId: null }];
    } else {
      whereClause.shopId = null;
    }

    // Handle validity dates
    const now = new Date();
    whereClause[db.Sequelize.Op.and] = [
      {
        [db.Sequelize.Op.or]: [
          { validFrom: null },
          { validFrom: { [db.Sequelize.Op.lte]: now } },
        ],
      },
      {
        [db.Sequelize.Op.or]: [
          { validTo: null },
          { validTo: { [db.Sequelize.Op.gte]: now } },
        ],
      },
    ];

    return this.findAll({
      where: whereClause,
      order: [['discountPercentage', 'DESC']], // Best discount first
      include: shopId
        ? [
            {
              model: db.Shop,
              as: 'shop',
              attributes: ['shopName'],
            },
          ]
        : [],
    });
  };

  db.DiscountRule.getBestDiscount = async function (
    amount,
    userTier,
    shopId = null
  ) {
    const applicableRules = await this.findApplicableRules(
      amount,
      userTier,
      shopId
    );
    return applicableRules.length > 0 ? applicableRules[0] : null;
  };
}

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
}

// Initialize database connection test
if (require.main === module) {
  testConnection();
}

module.exports = db;
