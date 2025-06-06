module.exports = (sequelize, DataTypes) => {
  const DiscountCard = sequelize.define('DiscountCard', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cardNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    tier: { type: DataTypes.ENUM('Bronze', 'Silver', 'Gold', 'Platinum'), defaultValue: 'Bronze' },
    issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expiresAt: { type: DataTypes.DATE },
    shopId: { type: DataTypes.INTEGER },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },  
    qrCode: { type: DataTypes.STRING },                         
  }, {
    tableName: 'discount_cards',
    timestamps: true,
  });

  DiscountCard.associate = function (models) {
    DiscountCard.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    DiscountCard.belongsTo(models.Shop, { foreignKey: 'shopId', as: 'shop' });
    DiscountCard.hasMany(models.Transaction, { foreignKey: 'cardId', as: 'transactions' });
  };

  return DiscountCard;
};
