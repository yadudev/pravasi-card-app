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
        allowNull: false,
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
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    }
  );

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
