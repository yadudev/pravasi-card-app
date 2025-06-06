const bcrypt = require('bcryptjs');
const { Admin } = require('../models');
const logger = require('../utils/logger');

const initDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.count();

    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);

      await Admin.create({
        username: 'admin',
        fullName: 'Default Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
      });

      logger.info('✅ Default admin created: admin@example.com / admin@123');
    } else {
      logger.info(
        'ℹ️ Admin account(s) already exist. Skipping default admin creation.'
      );
    }
  } catch (error) {
    logger.error('❌ Error creating default admin:', error);
  }
};

module.exports = initDefaultAdmin;
