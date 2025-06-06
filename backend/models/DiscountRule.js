module.exports = (sequelize, DataTypes) => {
  const DiscountRule = sequelize.define('DiscountRule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shopId: { type: DataTypes.INTEGER, allowNull: false },
    ruleName: { type: DataTypes.STRING(100), allowNull: false },
    discountPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'discount_rules',
    timestamps: true,
  });

  DiscountRule.associate = (models) => {
    DiscountRule.belongsTo(models.Shop, { foreignKey: 'shopId', as: 'shop' });
  };

  return DiscountRule;
};
