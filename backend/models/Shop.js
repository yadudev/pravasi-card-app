module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define(
    'Shop',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      ownerName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(24, 15),
        allowNull: true,
        validate: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: DataTypes.DECIMAL(24, 15),
        allowNull: true,
        validate: {
          min: -180,
          max: 180,
        },
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comma-separated tags for search optimization',
      },
      discountOffered: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      featuredImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL of the main shop image',
      },
      amenities: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of amenities (WiFi, Parking, AC, etc.)',
      },
      openingHours: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with daily opening hours',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'blocked'),
        defaultValue: 'pending', // All public registrations start as pending
      },
      registrationNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gstNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      bankAccountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ifscCode: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      panNumber: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
      },
      approvedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
      },
      rejectedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      blockedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
      },
      blockedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      blockReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      totalPurchases: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      totalRevenue: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'shops',
      timestamps: true,
      indexes: [
        // Add indexes for better search performance
        {
          fields: ['latitude', 'longitude'],
          name: 'idx_shops_coordinates',
        },
        {
          fields: ['category'],
          name: 'idx_shops_category',
        },
        {
          fields: ['status', 'isActive'],
          name: 'idx_shops_status',
        },
        {
          fields: ['averageRating'],
          name: 'idx_shops_rating',
        },
        // Full-text search index for better text search
        {
          fields: ['name', 'description', 'tags'],
          name: 'idx_shops_search',
          type: 'FULLTEXT', // MySQL/MariaDB only
        },
      ],
    }
  );

  // Add virtual fields for computed properties
  Shop.prototype.getDiscountPercentage = function () {
    return this.discountOffered; // Alias for consistency with API
  };

  Shop.prototype.getAmenitiesList = function () {
    try {
      return this.amenities ? JSON.parse(this.amenities) : [];
    } catch (e) {
      return [];
    }
  };

  Shop.prototype.getOpeningHoursData = function () {
    try {
      return this.openingHours ? JSON.parse(this.openingHours) : {};
    } catch (e) {
      return {};
    }
  };

  Shop.associate = (models) => {
    Shop.hasMany(models.DiscountCard, { foreignKey: 'shopId', as: 'cards' });
    Shop.hasMany(models.Transaction, {
      foreignKey: 'shopId',
      as: 'transactions',
    });

    if (models.Admin) {
      Shop.belongsTo(models.Admin, {
        foreignKey: 'approvedBy',
        as: 'approver',
        allowNull: true,
      });

      Shop.belongsTo(models.Admin, {
        foreignKey: 'rejectedBy',
        as: 'rejector',
        allowNull: true,
      });

      Shop.belongsTo(models.Admin, {
        foreignKey: 'blockedBy',
        as: 'blocker',
        allowNull: true,
      });
    }

    if (models.Purchase) {
      Shop.hasMany(models.Purchase, {
        foreignKey: 'shopId',
        as: 'purchases',
      });
    }
  };

  return Shop;
};
