const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(25),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [8, 255],
        },
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [2, 100],
        },
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'moderator', 'user'),
        defaultValue: 'admin',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'admins',
      timestamps: true,
      hooks: {
        beforeSave: async (admin) => {
          if (admin.changed('password') && admin.password) {
            const isAlreadyHashed = admin.password.startsWith('$2');
            if (!isAlreadyHashed) {
              admin.password = await bcrypt.hash(admin.password, 12);
            }
          }
        },
      },
      defaultScope: {
        attributes: {
          exclude: ['password', 'resetPasswordToken'],
        },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
        withSecrets: {
          attributes: {
            include: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
          },
        },
      },
    }
  );

  // ADD SHOP ASSOCIATIONS
  Admin.associate = (models) => {
    if (models.Shop) {
      // Shops approved by this admin
      Admin.hasMany(models.Shop, {
        foreignKey: 'approvedBy',
        as: 'approvedShops',
      });

      // Shops rejected by this admin
      Admin.hasMany(models.Shop, {
        foreignKey: 'rejectedBy',
        as: 'rejectedShops',
      });

      // Shops blocked by this admin
      Admin.hasMany(models.Shop, {
        foreignKey: 'blockedBy',
        as: 'blockedShops',
      });
    }

    // Add other associations as needed
    if (models.User) {
      Admin.hasMany(models.User, {
        foreignKey: 'createdBy',
        as: 'createdUsers',
      });
    }
  };

  // Instance method to validate password
  Admin.prototype.validatePassword = async function (password) {
    try {
      if (!this.password || !password) {
        console.log('❌ Missing password or hash');
        return false;
      }

      const result = await bcrypt.compare(password, this.password);
      console.log('✅ Bcrypt compare result:', result);
      return result;
    } catch (error) {
      console.error('❌ Password validation error:', error);
      return false;
    }
  };

  // Instance method to check if account is locked
  Admin.prototype.isLocked = function () {
    return this.lockUntil && this.lockUntil > new Date();
  };

  // Instance method to increment login attempts
  Admin.prototype.incrementLoginAttempts = async function () {
    const newAttempts = (this.loginAttempts || 0) + 1;
    const updateData = { loginAttempts: newAttempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (newAttempts >= 5) {
      updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    return await this.update(updateData);
  };

  // Instance method to reset login attempts
  Admin.prototype.resetLoginAttempts = async function () {
    return await this.update({
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    });
  };

  // Override toJSON to exclude sensitive data
  Admin.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    return values;
  };

  // Class method to find admin by email (with password)
  Admin.findByEmailWithPassword = function (email) {
    return this.scope('withPassword').findOne({
      where: { email: email.toLowerCase() },
    });
  };

  return Admin;
};
