const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

class AuthService {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  static async createAdmin(adminData) {
    const hashedPassword = await this.hashPassword(adminData.password);

    return Admin.create({
      ...adminData,
      password: hashedPassword,
    });
  }

  static async findAdminByEmail(email) {
    return Admin.findOne({
      where: { email },
      attributes: { include: ['password'] },
    });
  }

  static generateRefreshToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }
}

module.exports = AuthService;
