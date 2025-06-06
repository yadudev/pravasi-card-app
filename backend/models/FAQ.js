const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const FAQ = sequelize.define(
    'FAQ',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for the FAQ',
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'FAQ question cannot be empty',
          },
          len: {
            args: [10, 500],
            msg: 'FAQ question must be between 10 and 500 characters',
          },
        },
        comment: 'The frequently asked question',
      },
      answer: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'FAQ answer cannot be empty',
          },
          len: {
            args: [10, 5000],
            msg: 'FAQ answer must be between 10 and 5000 characters',
          },
        },
        comment: 'The detailed answer to the question (HTML allowed)',
      },
      shortAnswer: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 200],
            msg: 'Short answer cannot exceed 200 characters',
          },
        },
        comment: 'Brief version of the answer for quick display',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'General',
        validate: {
          notEmpty: {
            msg: 'FAQ category cannot be empty',
          },
          len: {
            args: [2, 100],
            msg: 'FAQ category must be between 2 and 100 characters',
          },
        },
        comment: 'Category/section the FAQ belongs to',
      },
      subcategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'FAQ subcategory cannot exceed 100 characters',
          },
        },
        comment: 'Subcategory for more specific organization',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the FAQ is currently active/visible',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Sort order cannot be negative',
          },
        },
        comment: 'Order in which FAQ should be displayed (lower numbers first)',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Priority level for FAQ display and importance',
      },
      difficulty: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner',
        comment: 'Difficulty level of the topic/question',
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isArrayOfStrings(value) {
            if (
              value &&
              (!Array.isArray(value) ||
                !value.every((item) => typeof item === 'string'))
            ) {
              throw new Error('Keywords must be an array of strings');
            }
            if (value && value.length > 20) {
              throw new Error('Cannot have more than 20 keywords');
            }
          },
        },
        comment: 'Array of keywords for search functionality',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isArrayOfStrings(value) {
            if (
              value &&
              (!Array.isArray(value) ||
                !value.every((item) => typeof item === 'string'))
            ) {
              throw new Error('Tags must be an array of strings');
            }
            if (value && value.length > 10) {
              throw new Error('Cannot have more than 10 tags');
            }
          },
        },
        comment: 'Array of tags for categorization and filtering',
      },
      viewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'View count cannot be negative',
          },
        },
        comment: 'Number of times this FAQ has been viewed',
      },
      helpfulCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Helpful count cannot be negative',
          },
        },
        comment: 'Number of users who found this FAQ helpful',
      },
      notHelpfulCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Not helpful count cannot be negative',
          },
        },
        comment: 'Number of users who found this FAQ not helpful',
      },
      language: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'en',
        validate: {
          isIn: {
            args: [
              ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
            ],
            msg: 'Language must be a supported language code',
          },
        },
        comment: 'Language code for the FAQ',
      },
      targetAudience: {
        type: DataTypes.ENUM('all', 'users', 'shops', 'admins'),
        allowNull: false,
        defaultValue: 'all',
        comment: 'Target audience for this FAQ',
      },
      relatedFAQs: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isArrayOfNumbers(value) {
            if (
              value &&
              (!Array.isArray(value) ||
                !value.every((item) => Number.isInteger(item)))
            ) {
              throw new Error('Related FAQs must be an array of FAQ IDs');
            }
            if (value && value.length > 5) {
              throw new Error('Cannot have more than 5 related FAQs');
            }
          },
        },
        comment: 'Array of related FAQ IDs',
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of file attachments (images, documents) for the FAQ',
      },
      videoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Video URL must be a valid URL',
          },
        },
        comment: 'Optional video explanation URL (YouTube, Vimeo, etc.)',
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when the FAQ content was last updated',
      },
      reviewDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when the FAQ should be reviewed for accuracy',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the FAQ has been verified by an expert',
      },
      verifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who verified this FAQ',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when the FAQ was verified',
      },
      source: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Source of the FAQ (customer support, documentation, etc.)',
      },
      searchableText: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'Processed text for full-text search (auto-generated)',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who created this FAQ',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who last updated this FAQ',
      },
    },
    {
      tableName: 'faqs',
      timestamps: true,
      underscored: false,
      paranoid: true, // Enable soft deletes

      // Model options
      defaultScope: {
        attributes: { exclude: ['createdBy', 'updatedBy', 'searchableText'] },
      },

      scopes: {
        // Active FAQs only
        active: {
          where: {
            isActive: true,
          },
        },

        // FAQs by category
        byCategory: (category) => ({
          where: {
            category: category,
            isActive: true,
          },
        }),

        // FAQs by target audience
        forAudience: (audience) => ({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { targetAudience: audience },
              { targetAudience: 'all' },
            ],
            isActive: true,
          },
        }),

        // High priority FAQs
        highPriority: {
          where: {
            priority: ['high', 'critical'],
            isActive: true,
          },
        },

        // Popular FAQs (by views)
        popular: {
          where: {
            isActive: true,
          },
          order: [['viewCount', 'DESC']],
        },

        // Most helpful FAQs
        helpful: {
          where: {
            isActive: true,
          },
          order: [
            [sequelize.literal('(helpfulCount - notHelpfulCount)'), 'DESC'],
            ['helpfulCount', 'DESC'],
          ],
        },

        // Recently updated FAQs
        recent: {
          where: {
            isActive: true,
          },
          order: [['updatedAt', 'DESC']],
        },

        // Verified FAQs only
        verified: {
          where: {
            isVerified: true,
            isActive: true,
          },
        },

        // FAQs needing review
        needsReview: {
          where: {
            [sequelize.Sequelize.Op.or]: [
              { reviewDate: { [sequelize.Sequelize.Op.lte]: new Date() } },
              { isVerified: false },
            ],
          },
        },

        // Include admin info
        withAdminInfo: {
          attributes: { include: ['createdBy', 'updatedBy', 'verifiedBy'] },
        },
      },

      // Indexes for better performance
      indexes: [
        {
          fields: ['isActive'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['subcategory'],
        },
        {
          fields: ['sortOrder'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['targetAudience'],
        },
        {
          fields: ['language'],
        },
        {
          fields: ['isVerified'],
        },
        {
          fields: ['viewCount'],
        },
        {
          name: 'faq_category_sorted',
          fields: ['category', 'isActive', 'sortOrder'],
        },
        {
          name: 'faq_audience_priority',
          fields: ['targetAudience', 'priority', 'isActive'],
        },
        {
          name: 'faq_search',
          fields: ['question', 'answer', 'searchableText'],
          type: 'FULLTEXT',
        },
      ],

      // Model hooks
      hooks: {
        beforeValidate: (faq, options) => {
          // Trim string fields
          if (faq.question) faq.question = faq.question.trim();
          if (faq.answer) faq.answer = faq.answer.trim();
          if (faq.shortAnswer) faq.shortAnswer = faq.shortAnswer.trim();
          if (faq.category) faq.category = faq.category.trim();
          if (faq.subcategory) faq.subcategory = faq.subcategory.trim();
          if (faq.source) faq.source = faq.source.trim();

          // Generate searchable text
          const searchText = [
            faq.question,
            faq.answer?.replace(/<[^>]*>/g, ''), // Remove HTML tags
            faq.shortAnswer,
            faq.category,
            faq.subcategory,
            ...(faq.keywords || []),
            ...(faq.tags || []),
          ]
            .filter(Boolean)
            .join(' ');

          faq.searchableText = searchText.toLowerCase();

          // Auto-generate short answer if not provided
          if (faq.answer && !faq.shortAnswer) {
            const plainText = faq.answer.replace(/<[^>]*>/g, '');
            faq.shortAnswer =
              plainText.substring(0, 150) +
              (plainText.length > 150 ? '...' : '');
          }

          // Set review date if not provided (6 months from creation)
          if (!faq.reviewDate) {
            const reviewDate = new Date();
            reviewDate.setMonth(reviewDate.getMonth() + 6);
            faq.reviewDate = reviewDate;
          }
        },

        beforeCreate: (faq, options) => {
          // Set creator if admin context is available
          if (options.adminId) {
            faq.createdBy = options.adminId;
          }

          faq.lastUpdated = new Date();
        },

        beforeUpdate: (faq, options) => {
          // Set updater if admin context is available
          if (options.adminId) {
            faq.updatedBy = options.adminId;
          }

          // Update last updated timestamp if content changed
          if (faq.changed('question') || faq.changed('answer')) {
            faq.lastUpdated = new Date();
          }

          // Handle verification
          if (faq.changed('isVerified') && faq.isVerified) {
            faq.verifiedAt = new Date();
            if (options.adminId) {
              faq.verifiedBy = options.adminId;
            }
          }
        },
      },
    }
  );

  // Class methods
  FAQ.getActiveFAQs = function (options = {}) {
    return this.scope('active').findAll({
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      ...options,
    });
  };

  FAQ.getFAQsByCategory = function (category, options = {}) {
    return this.scope({ method: ['byCategory', category] }).findAll({
      order: [['sortOrder', 'ASC']],
      ...options,
    });
  };

  FAQ.getFAQsForAudience = function (audience, options = {}) {
    return this.scope({ method: ['forAudience', audience] }).findAll({
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
      ],
      ...options,
    });
  };

  FAQ.getPopularFAQs = function (limit = 10) {
    return this.scope('popular').findAll({
      limit,
    });
  };

  FAQ.getMostHelpfulFAQs = function (limit = 10) {
    return this.scope('helpful').findAll({
      limit,
    });
  };

  FAQ.searchFAQs = function (query, options = {}) {
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .filter((term) => term.length > 2);

    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            [sequelize.Sequelize.Op.or]: searchTerms.map((term) => ({
              searchableText: { [sequelize.Sequelize.Op.like]: `%${term}%` },
            })),
          },
          { isActive: true },
        ],
      },
      order: [
        ['priority', 'DESC'],
        ['helpfulCount', 'DESC'],
        ['viewCount', 'DESC'],
      ],
      ...options,
    });
  };

  FAQ.getCategories = async function () {
    const categories = await this.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        isActive: true,
      },
      group: ['category'],
      order: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'DESC'],
        ['category', 'ASC'],
      ],
      raw: true,
    });

    return categories.map((cat) => ({
      name: cat.category,
      count: parseInt(cat.count),
    }));
  };

  FAQ.getSubcategories = async function (category) {
    const subcategories = await this.findAll({
      attributes: [
        'subcategory',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        category: category,
        subcategory: { [sequelize.Sequelize.Op.ne]: null },
        isActive: true,
      },
      group: ['subcategory'],
      order: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'DESC'],
        ['subcategory', 'ASC'],
      ],
      raw: true,
    });

    return subcategories.map((subcat) => ({
      name: subcat.subcategory,
      count: parseInt(subcat.count),
    }));
  };

  FAQ.getAllTags = async function () {
    const faqs = await this.findAll({
      attributes: ['tags'],
      where: {
        tags: { [sequelize.Sequelize.Op.ne]: null },
        isActive: true,
      },
      raw: true,
    });

    const tagCounts = {};
    faqs.forEach((faq) => {
      if (faq.tags && Array.isArray(faq.tags)) {
        faq.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  FAQ.getFAQsNeedingReview = function () {
    return this.scope('needsReview').findAll({
      order: [['reviewDate', 'ASC']],
    });
  };

  // Instance methods
  FAQ.prototype.incrementView = async function () {
    return await this.increment('viewCount');
  };

  FAQ.prototype.markHelpful = async function () {
    return await this.increment('helpfulCount');
  };

  FAQ.prototype.markNotHelpful = async function () {
    return await this.increment('notHelpfulCount');
  };

  FAQ.prototype.getHelpfulnessRatio = function () {
    const total = this.helpfulCount + this.notHelpfulCount;
    if (total === 0) return 0;
    return ((this.helpfulCount / total) * 100).toFixed(1);
  };

  FAQ.prototype.getHelpfulnessScore = function () {
    return this.helpfulCount - this.notHelpfulCount;
  };

  FAQ.prototype.isPopular = function () {
    return this.viewCount > 100 || this.helpfulCount > 10;
  };

  FAQ.prototype.needsReview = function () {
    if (!this.isVerified) return true;
    if (!this.reviewDate) return true;
    return new Date(this.reviewDate) <= new Date();
  };

  FAQ.prototype.verify = async function (adminId) {
    return await this.update({
      isVerified: true,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    });
  };

  FAQ.prototype.duplicate = async function (newQuestion) {
    const duplicateData = {
      question: newQuestion || `${this.question} (Copy)`,
      answer: this.answer,
      shortAnswer: this.shortAnswer,
      category: this.category,
      subcategory: this.subcategory,
      priority: this.priority,
      difficulty: this.difficulty,
      keywords: this.keywords ? [...this.keywords] : [],
      tags: this.tags ? [...this.tags] : [],
      targetAudience: this.targetAudience,
      language: this.language,
      isActive: false, // Start as inactive
      sortOrder: this.sortOrder + 1,
    };

    return await FAQ.create(duplicateData);
  };

  FAQ.prototype.getRelatedFAQs = async function (limit = 5) {
    if (this.relatedFAQs && this.relatedFAQs.length > 0) {
      return await FAQ.findAll({
        where: {
          id: { [sequelize.Sequelize.Op.in]: this.relatedFAQs },
          isActive: true,
        },
        limit,
      });
    }

    // Auto-find related FAQs by category and tags
    const whereClause = {
      id: { [sequelize.Sequelize.Op.ne]: this.id },
      category: this.category,
      isActive: true,
    };

    return await FAQ.findAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['helpfulCount', 'DESC'],
      ],
      limit,
    });
  };

  FAQ.prototype.scheduleReview = async function (months = 6) {
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + months);
    return await this.update({ reviewDate });
  };

  FAQ.prototype.getPlainTextAnswer = function () {
    return this.answer.replace(/<[^>]*>/g, '');
  };

  // Static helper methods
  FAQ.getCategories_list = function () {
    return [
      'General',
      'Account',
      'Payments',
      'Discounts',
      'Shops',
      'Orders',
      'Technical',
      'Privacy',
      'Security',
      'Mobile App',
    ];
  };

  FAQ.getPriorityLevels = function () {
    return ['low', 'medium', 'high', 'critical'];
  };

  FAQ.getDifficultyLevels = function () {
    return ['beginner', 'intermediate', 'advanced'];
  };

  FAQ.getTargetAudiences = function () {
    return ['all', 'users', 'shops', 'admins'];
  };

  // Association method (called from models/index.js)
  FAQ.associate = function (models) {
    // FAQ belongs to Admin (creator)
    FAQ.belongsTo(models.Admin, {
      foreignKey: 'createdBy',
      as: 'creator',
      constraints: false,
    });

    // FAQ belongs to Admin (updater)
    FAQ.belongsTo(models.Admin, {
      foreignKey: 'updatedBy',
      as: 'updater',
      constraints: false,
    });

    // FAQ belongs to Admin (verifier)
    FAQ.belongsTo(models.Admin, {
      foreignKey: 'verifiedBy',
      as: 'verifier',
      constraints: false,
    });
  };

  return FAQ;
};
