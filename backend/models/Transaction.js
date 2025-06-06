module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cardId: { type: DataTypes.INTEGER, allowNull: false },
    shopId: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    transactionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(models.DiscountCard, { foreignKey: 'cardId', as: 'card' });
    Transaction.belongsTo(models.Shop, { foreignKey: 'shopId', as: 'shop' });
  };

  return Transaction;
};
