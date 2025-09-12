const { User, DiscountCard } = require('../models');

module.exports.renewUserCard = async (userId, months = 12) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['createdBy'] },
    include: [{ model: DiscountCard, as: 'discountCard' }],
  });

  if (!user || !user.discountCard) {
    throw new Error('User or card not found');
  }

  // Calculate new expiry date
  const currentExpiryDate = new Date(user.discountCard.expiresAt);
  const currentDate = new Date();

  const extensionStartDate =
    currentExpiryDate > currentDate ? currentExpiryDate : currentDate;
  const newExpiryDate = new Date(extensionStartDate);
  newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

  // Renew the card
  await user.discountCard.update({
    expiresAt: newExpiryDate,
    isActive: true,
    updatedAt: new Date(),
  });

  return {
    cardNumber: user.discountCard.cardNumber,
    previousExpiryDate: currentExpiryDate,
    newExpiryDate: newExpiryDate,
    monthsExtended: months,
    isActive: true,
  };
};
