const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(100), allowNull: false, validate: { len: [2, 100] } },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(15), allowNull: false, unique: true, validate: { is: /^[0-9+\-() ]{7,15}$/i } },
    password: { type: DataTypes.STRING(255), allowNull: false, validate: { len: [8, 255] } },
    avatar: { type: DataTypes.STRING(255) },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('male', 'female', 'other') },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(50) },
    state: { type: DataTypes.STRING(50) },
    pincode: { type: DataTypes.STRING(10) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isPhoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    totalSpent: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    currentDiscountTier: { type: DataTypes.ENUM('Bronze', 'Silver', 'Gold', 'Platinum'), defaultValue: 'Bronze' },
    referralCode: { type: DataTypes.STRING(20), unique: true },
    referredBy: { type: DataTypes.INTEGER },
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password') && !user.password.startsWith('$2b$')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    }
  });

  User.associate = function (models) {
    User.hasOne(models.DiscountCard, { foreignKey: 'userId', as: 'discountCard' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.belongsTo(models.User, { foreignKey: 'referredBy', as: 'referrer' });
    User.hasMany(models.User, { foreignKey: 'referredBy', as: 'referrals' });
  };

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};
