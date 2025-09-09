module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define(
        "payment",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            transactionId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending'
            }
        },
        {
            tableName: 'payment',
            timestamps: true,
        }
    )
    return Payment;
}