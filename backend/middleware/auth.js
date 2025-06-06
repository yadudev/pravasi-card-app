const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(401)
          .json(
            ApiResponse.error('Access denied. No valid token provided.', 401)
          );
      }

      const token = authHeader.substring(7); 

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!admin || !admin.isActive) {
        return res
          .status(401)
          .json(
            ApiResponse.error(
              'Invalid token or admin account is inactive.',
              401
            )
          );
      }

      req.user = admin; // ✅ Use standard naming
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(401).json(ApiResponse.error('Invalid token.', 401));
    }
  }

  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res
          .status(401)
          .json(ApiResponse.error('Authentication required.', 401));
      }

      const roleHierarchy = {
        moderator: 1,
        admin: 2,
        super_admin: 3,
      };

      const userLevel = roleHierarchy[req.user.role] || 0;
      const requiredLevel = Math.max(
        ...roles.map((role) => roleHierarchy[role] || 0)
      );

      if (userLevel < requiredLevel) {
        return res
          .status(403)
          .json(ApiResponse.error('Insufficient permissions.', 403));
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
