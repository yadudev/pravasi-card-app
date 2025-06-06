const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define(
    'Banner',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for the banner',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Banner title cannot be empty',
          },
          len: {
            args: [3, 200],
            msg: 'Banner title must be between 3 and 200 characters',
          },
        },
        comment: 'Banner title/heading text',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Banner description cannot exceed 1000 characters',
          },
        },
        comment: 'Optional banner description or subtitle',
      },
      image: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Banner image is required',
          },
          isValidImagePath(value) {
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const hasValidExtension = validExtensions.some((ext) =>
              value.toLowerCase().endsWith(ext)
            );
            if (!hasValidExtension) {
              throw new Error(
                'Banner image must be a valid image file (jpg, jpeg, png, gif, webp)'
              );
            }
          },
        },
        comment: 'Path to the banner image file',
      },
      link: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'Banner link must be a valid URL',
          },
        },
        comment: 'Optional URL that banner should link to when clicked',
      },
      linkText: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Link text cannot exceed 100 characters',
          },
        },
        comment: 'Text for the call-to-action button/link',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the banner is currently active/visible',
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
        comment:
          'Order in which banner should be displayed (lower numbers first)',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'Start date must be a valid date',
          },
          isNotPast(value) {
            if (value && new Date(value) < new Date()) {
              throw new Error('Start date cannot be in the past');
            }
          },
        },
        comment: 'Optional start date for banner visibility',
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'End date must be a valid date',
          },
          isAfterStartDate(value) {
            if (
              value &&
              this.startDate &&
              new Date(value) <= new Date(this.startDate)
            ) {
              throw new Error('End date must be after start date');
            }
          },
        },
        comment: 'Optional end date for banner visibility',
      },
      targetPage: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isIn: {
            args: [['home', 'shops', 'offers', 'about', 'contact', 'all']],
            msg: 'Target page must be one of: home, shops, offers, about, contact, all',
          },
        },
        defaultValue: 'all',
        comment: 'Which page(s) the banner should be displayed on',
      },
      bannerType: {
        type: DataTypes.ENUM(
          'promotional',
          'informational',
          'seasonal',
          'announcement'
        ),
        allowNull: false,
        defaultValue: 'promotional',
        comment: 'Type/category of the banner',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Priority level for banner display',
      },
      backgroundColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          isValidHexColor(value) {
            if (value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
              throw new Error(
                'Background color must be a valid hex color code'
              );
            }
          },
        },
        comment: 'Optional background color in hex format (#FFFFFF)',
      },
      textColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          isValidHexColor(value) {
            if (value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
              throw new Error('Text color must be a valid hex color code');
            }
          },
        },
        comment: 'Optional text color in hex format (#000000)',
      },
      clickCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Click count cannot be negative',
          },
        },
        comment: 'Number of times the banner has been clicked',
      },
      impressionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Impression count cannot be negative',
          },
        },
        comment: 'Number of times the banner has been displayed',
      },
      isResponsive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the banner should be responsive on mobile devices',
      },
      mobileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isValidImagePath(value) {
            if (value) {
              const validExtensions = [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp',
              ];
              const hasValidExtension = validExtensions.some((ext) =>
                value.toLowerCase().endsWith(ext)
              );
              if (!hasValidExtension) {
                throw new Error(
                  'Mobile image must be a valid image file (jpg, jpeg, png, gif, webp)'
                );
              }
            }
          },
        },
        comment: 'Optional separate image for mobile devices',
      },
      altText: {
        type: DataTypes.STRING(200),
        allowNull: true,
        validate: {
          len: {
            args: [0, 200],
            msg: 'Alt text cannot exceed 200 characters',
          },
        },
        comment: 'Alternative text for accessibility',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who created this banner',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the admin who last updated this banner',
      },
    },
    {
      tableName: 'banners',
      timestamps: true,
      underscored: false,
      paranoid: false, 
      defaultScope: {
        attributes: { exclude: ['createdBy', 'updatedBy'] },
      },

      scopes: {
        active: {
          where: {
            isActive: true,
            [sequelize.Sequelize.Op.or]: [
              { startDate: null },
              { startDate: { [sequelize.Sequelize.Op.lte]: new Date() } },
            ],
            [sequelize.Sequelize.Op.or]: [
              { endDate: null },
              { endDate: { [sequelize.Sequelize.Op.gte]: new Date() } },
            ],
          },
        },

        forPage: (page) => ({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { targetPage: page },
              { targetPage: 'all' },
            ],
          },
        }),

        byType: (type) => ({
          where: { bannerType: type },
        }),

        highPriority: {
          where: {
            priority: ['high', 'urgent'],
          },
        },

        withAdminInfo: {
          attributes: { include: ['createdBy', 'updatedBy'] },
        },
      },

      indexes: [
        {
          fields: ['isActive'],
        },
        {
          fields: ['sortOrder'],
        },
        {
          fields: ['startDate', 'endDate'],
        },
        {
          fields: ['targetPage'],
        },
        {
          fields: ['bannerType'],
        },
        {
          fields: ['priority'],
        },
        {
          name: 'banner_active_sorted',
          fields: ['isActive', 'sortOrder'],
        },
      ],

      hooks: {
        beforeValidate: (banner, options) => {
          if (banner.title) banner.title = banner.title.trim();
          if (banner.description)
            banner.description = banner.description.trim();
          if (banner.link) banner.link = banner.link.trim();
          if (banner.linkText) banner.linkText = banner.linkText.trim();
          if (banner.altText) banner.altText = banner.altText.trim();

          // Normalize hex colors
          if (banner.backgroundColor) {
            banner.backgroundColor = banner.backgroundColor.toUpperCase();
          }
          if (banner.textColor) {
            banner.textColor = banner.textColor.toUpperCase();
          }
        },

        beforeCreate: (banner, options) => {
          if (options.adminId) {
            banner.createdBy = options.adminId;
          }
        },

        beforeUpdate: (banner, options) => {
          if (options.adminId) {
            banner.updatedBy = options.adminId;
          }
        },
      },
    }
  );

  Banner.getActiveBanners = function (page = 'all', options = {}) {
    const whereClause = {
      isActive: true,
      [sequelize.Sequelize.Op.or]: [
        { startDate: null },
        { startDate: { [sequelize.Sequelize.Op.lte]: new Date() } },
      ],
      [sequelize.Sequelize.Op.or]: [
        { endDate: null },
        { endDate: { [sequelize.Sequelize.Op.gte]: new Date() } },
      ],
      [sequelize.Sequelize.Op.or]: [
        { targetPage: page },
        { targetPage: 'all' },
      ],
    };

    return this.findAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      ...options,
    });
  };

  Banner.getBannersByType = function (type, options = {}) {
    return this.findAll({
      where: {
        bannerType: type,
        isActive: true,
      },
      order: [['sortOrder', 'ASC']],
      ...options,
    });
  };

  Banner.getHighPriorityBanners = function (options = {}) {
    return this.findAll({
      where: {
        priority: ['high', 'urgent'],
        isActive: true,
      },
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
      ],
      ...options,
    });
  };

  Banner.getBannersForHomepage = function (limit = 5) {
    return this.getActiveBanners('home', { limit });
  };

  // Instance methods
  Banner.prototype.incrementClick = async function () {
    return await this.increment('clickCount');
  };

  Banner.prototype.incrementImpression = async function () {
    return await this.increment('impressionCount');
  };

  Banner.prototype.isCurrentlyVisible = function () {
    if (!this.isActive) return false;

    const now = new Date();

    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    return true;
  };

  Banner.prototype.getClickThroughRate = function () {
    if (this.impressionCount === 0) return 0;
    return ((this.clickCount / this.impressionCount) * 100).toFixed(2);
  };

  Banner.prototype.getRemainingDays = function () {
    if (!this.endDate) return null;

    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  Banner.prototype.duplicate = async function (newTitle) {
    const duplicateData = {
      title: newTitle || `${this.title} (Copy)`,
      description: this.description,
      image: this.image,
      link: this.link,
      linkText: this.linkText,
      targetPage: this.targetPage,
      bannerType: this.bannerType,
      priority: this.priority,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      isResponsive: this.isResponsive,
      mobileImage: this.mobileImage,
      altText: this.altText,
      isActive: false, // Start as inactive
      sortOrder: this.sortOrder + 1,
    };

    return await Banner.create(duplicateData);
  };

  Banner.prototype.getImageUrl = function () {
    return this.image
      ? this.image.startsWith('http')
        ? this.image
        : `${process.env.BASE_URL || ''}${this.image}`
      : null;
  };

  Banner.prototype.getMobileImageUrl = function () {
    return this.mobileImage
      ? this.mobileImage.startsWith('http')
        ? this.mobileImage
        : `${process.env.BASE_URL || ''}${this.mobileImage}`
      : null;
  };

  Banner.getBannerTypes = function () {
    return ['promotional', 'informational', 'seasonal', 'announcement'];
  };

  Banner.getPriorityLevels = function () {
    return ['low', 'medium', 'high', 'urgent'];
  };

  Banner.getTargetPages = function () {
    return ['home', 'shops', 'offers', 'about', 'contact', 'all'];
  };

  Banner.associate = function (models) {
    // Banner belongs to Admin (creator)
    Banner.belongsTo(models.Admin, {
      foreignKey: 'createdBy',
      as: 'creator',
      constraints: false,
    });

    Banner.belongsTo(models.Admin, {
      foreignKey: 'updatedBy',
      as: 'updater',
      constraints: false,
    });
  };

  return Banner;
};
