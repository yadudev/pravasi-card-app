const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models');
const ApiResponse = require('../utils/responses');

const userAuth = {
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      console.log({ token_in_backend: token });

      if (!token) {
        return res
          .status(401)
          .json(ApiResponse.error('Access denied. No token provided.', 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Only allow user tokens
      if (decoded.userType !== 'user') {
        return res
          .status(403)
          .json(ApiResponse.error('User access required', 403));
      }

      const user = await Admin.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res
          .status(401)
          .json(ApiResponse.error('Invalid token or user inactive', 401));
      }

      req.user = { ...decoded, ...user.toJSON() };
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json(ApiResponse.error('Invalid token', 401));
    }
  },

  authorize: (role = 'user') => {
    return async (req, res, next) => {
      try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
          return res
            .status(401)
            .json(ApiResponse.error('Access denied. No token provided.', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.userType !== role) {
          return res
            .status(403)
            .json(ApiResponse.error(`${role} access required`, 403));
        }

        let account = null;

        if (role === 'admin') {
          account = await Admin.findByPk(decoded.id);
        } else {
          account = await User.findByPk(decoded.id);
        }

        if (!account || !account.isActive) {
          return res
            .status(401)
            .json(ApiResponse.error('Invalid token or inactive user', 401));
        }

        req.user = { ...decoded, ...account.toJSON() };
        req.token = token;
        next();
      } catch (error) {
        return res.status(401).json(ApiResponse.error('Invalid token', 401));
      }
    };
  },
};

module.exports = userAuth;
