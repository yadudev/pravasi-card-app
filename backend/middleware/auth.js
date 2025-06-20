const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const ApiResponse = require('../utils/responses');
const PermissionManager = require('../utils/permissions');

const adminAuth = {
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json(ApiResponse.error('Access denied. No token provided.', 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this is an admin token
      if (decoded.userType !== 'admin') {
        return res.status(403).json(ApiResponse.error('Admin access required', 403));
      }

      const admin = await Admin.findByPk(decoded.id);
      if (!admin || !admin.isActive) {
        return res.status(401).json(ApiResponse.error('Invalid token or admin inactive', 401));
      }

      req.admin = { ...decoded, ...admin.toJSON() };
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json(ApiResponse.error('Invalid token', 401));
    }
  },

  // Role-based authorization
  authorize: (requiredRole) => {
    return async (req, res, next) => {
      try {
        // First authenticate the user
        await new Promise((resolve, reject) => {
          adminAuth.authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Check if admin has required role
        if (!req.admin) {
          return res.status(401).json(ApiResponse.error('Authentication required', 401));
        }

        // If specific role is required, check it
        if (requiredRole && req.admin.role !== requiredRole) {
          // Check if it's a higher-level role (role hierarchy)
          const roleHierarchy = {
            'super_admin': 4,
            'admin': 3,
            'manager': 2,
            'moderator': 1
          };

          const adminRoleLevel = roleHierarchy[req.admin.role] || 0;
          const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

          if (adminRoleLevel < requiredRoleLevel) {
            return res.status(403).json(
              ApiResponse.error(`Access denied. ${requiredRole} role required.`, 403)
            );
          }
        }

        next();
      } catch (error) {
        return res.status(401).json(ApiResponse.error('Invalid token', 401));
      }
    };
  },

  // Permission-based authorization
  hasPermission: (permission) => {
    return async (req, res, next) => {
      try {
        // First authenticate the user
        await new Promise((resolve, reject) => {
          adminAuth.authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        if (!req.admin) {
          return res.status(401).json(ApiResponse.error('Authentication required', 401));
        }

        // Check if admin has the required permission
        const hasPermission = PermissionManager.hasPermission(req.admin.role, permission);

        if (!hasPermission) {
          return res.status(403).json(
            ApiResponse.error(`Access denied. Permission '${permission}' required.`, 403)
          );
        }

        next();
      } catch (error) {
        return res.status(403).json(ApiResponse.error('Permission check failed', 403));
      }
    };
  },

  // Multiple permissions (admin must have ALL permissions)
  hasAllPermissions: (permissions) => {
    return async (req, res, next) => {
      try {
        await new Promise((resolve, reject) => {
          adminAuth.authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        if (!req.admin) {
          return res.status(401).json(ApiResponse.error('Authentication required', 401));
        }

        const missingPermissions = permissions.filter(permission => 
          !PermissionManager.hasPermission(req.admin.role, permission)
        );

        if (missingPermissions.length > 0) {
          return res.status(403).json(
            ApiResponse.error(
              `Access denied. Missing permissions: ${missingPermissions.join(', ')}`, 
              403
            )
          );
        }

        next();
      } catch (error) {
        return res.status(403).json(ApiResponse.error('Permission check failed', 403));
      }
    };
  },

  // Multiple permissions (admin must have ANY of the permissions)
  hasAnyPermission: (permissions) => {
    return async (req, res, next) => {
      try {
        await new Promise((resolve, reject) => {
          adminAuth.authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        if (!req.admin) {
          return res.status(401).json(ApiResponse.error('Authentication required', 401));
        }

        const hasAnyPermission = permissions.some(permission => 
          PermissionManager.hasPermission(req.admin.role, permission)
        );

        if (!hasAnyPermission) {
          return res.status(403).json(
            ApiResponse.error(
              `Access denied. One of these permissions required: ${permissions.join(', ')}`, 
              403
            )
          );
        }

        next();
      } catch (error) {
        return res.status(403).json(ApiResponse.error('Permission check failed', 403));
      }
    };
  }
};

module.exports = adminAuth;
