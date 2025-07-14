const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Admin, User } = require('../../models'); // Import both models
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/responses');
const PermissionManager = require('../../utils/permissions');
const EmailService = require('../../services/emailService');
const logger = require('../../utils/logger');
const bcryptjs = require('bcryptjs');
const emailService = require('../../services/emailService');

// Rate limiting middleware for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for password reset
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: 60 * 60, // 1 hour in seconds
  },
});

class AuthController {
  /**
   * Apply rate limiting middleware to login route
   */
  static getLoginLimiter() {
    return loginLimiter;
  }

  static getResetPasswordLimiter() {
    return resetPasswordLimiter;
  }

  /**
   * Admin Login
   * POST /api/admin/auth/login
   */
  static async adminLogin(req, res) {
    try {
      const { email, password, rememberMe = false } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json(ApiResponse.error('Email and password are required', 400));
      }

      const normalizedEmail = email.trim().toLowerCase();

      const admin = await Admin.scope('withPassword').findOne({
        where: { email: normalizedEmail },
      });

      if (!admin) {
        logger.warn(
          `Admin login attempt with non-existent email: ${normalizedEmail}`
        );
        return res
          .status(401)
          .json(ApiResponse.error('Invalid credentials', 401));
      }

      if (admin.lockUntil && admin.lockUntil > new Date()) {
        const lockTimeRemaining = Math.ceil(
          (admin.lockUntil - new Date()) / 1000 / 60
        );
        logger.warn(
          `Admin login attempt on locked account: ${normalizedEmail}, ${lockTimeRemaining} minutes remaining`
        );
        return res
          .status(423)
          .json(
            ApiResponse.error(
              `Account temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
              423,
              { lockTimeRemaining }
            )
          );
      }

      if (!admin.isActive) {
        logger.warn(
          `Admin login attempt on inactive account: ${normalizedEmail}`
        );
        return res
          .status(401)
          .json(
            ApiResponse.error(
              'Account is inactive. Please contact administrator.',
              401
            )
          );
      }

      const isValidPassword = await admin.validatePassword(password);

      if (!isValidPassword) {
        const newAttempts = (admin.loginAttempts || 0) + 1;
        const updateData = { loginAttempts: newAttempts };

        if (newAttempts >= 5) {
          updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
          logger.warn(
            `Admin account locked due to multiple failed attempts: ${normalizedEmail}`
          );
        }

        await admin.update(updateData);

        logger.warn(
          `Invalid password attempt for admin: ${normalizedEmail}, attempts: ${newAttempts}`
        );
        return res
          .status(401)
          .json(ApiResponse.error('Invalid credentials', 401));
      }

      await admin.update({
        lastLogin: new Date(),
        loginAttempts: 0,
        lockUntil: null,
      });

      const sessionId = crypto.randomUUID();

      const tokenPayload = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        sessionId,
        userType: 'admin', // Important: specify user type
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? '7d' : process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'admin-panel',
        audience: process.env.JWT_AUDIENCE || 'admin-users',
      });

      const refreshToken = jwt.sign(
        {
          id: admin.id,
          sessionId,
          type: 'refresh',
          userType: 'admin',
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
          issuer: process.env.JWT_ISSUER || 'admin-panel',
          audience: process.env.JWT_AUDIENCE || 'admin-users',
        }
      );

      logger.info(
        `Admin login successful: ${admin.email}, Role: ${admin.role}`
      );

      res.json(
        ApiResponse.success(
          {
            token: accessToken,
            refreshToken: refreshToken,
            expiresIn: rememberMe ? '7d' : process.env.JWT_EXPIRES_IN || '24h',
            admin: admin.toJSON(),
            userType: 'admin',
          },
          'Admin login successful'
        )
      );
    } catch (error) {
      logger.error('Admin login error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * User Login
   * POST /api/auth/login
   */
  static async userLogin(req, res) {
    try {
      const { email, password, rememberMe = false } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json(ApiResponse.error('Email and password are required', 400));
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await Admin.scope('withPassword').findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        logger.warn(
          `User login attempt with non-existent email: ${normalizedEmail}`
        );
        return res
          .status(401)
          .json(ApiResponse.error('Invalid credentials', 401));
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        const lockTimeRemaining = Math.ceil(
          (user.lockUntil - new Date()) / 1000 / 60
        );
        logger.warn(
          `User login attempt on locked account: ${normalizedEmail}, ${lockTimeRemaining} minutes remaining`
        );
        return res
          .status(423)
          .json(
            ApiResponse.error(
              `Account temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
              423,
              { lockTimeRemaining }
            )
          );
      }

      if (!user.isActive) {
        logger.warn(
          `User login attempt on inactive account: ${normalizedEmail}`
        );
        return res
          .status(401)
          .json(
            ApiResponse.error(
              'Account is inactive. Please contact support.',
              401
            )
          );
      }

      // Check if email is verified (if your user model has email verification)
      if (user.emailVerified === false) {
        logger.warn(
          `User login attempt on unverified account: ${normalizedEmail}`
        );
        return res
          .status(401)
          .json(
            ApiResponse.error(
              'Please verify your email address before logging in.',
              401
            )
          );
      }

      const isValidPassword = await user.validatePassword(password);

      if (!isValidPassword) {
        const newAttempts = (user.loginAttempts || 0) + 1;
        const updateData = { loginAttempts: newAttempts };

        if (newAttempts >= 5) {
          updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
          logger.warn(
            `User account locked due to multiple failed attempts: ${normalizedEmail}`
          );
        }

        await user.update(updateData);

        logger.warn(
          `Invalid password attempt for user: ${normalizedEmail}, attempts: ${newAttempts}`
        );
        return res
          .status(401)
          .json(ApiResponse.error('Invalid credentials', 401));
      }

      await user.update({
        lastLogin: new Date(),
        loginAttempts: 0,
        lockUntil: null,
      });

      const sessionId = crypto.randomUUID();

      const tokenPayload = {
        id: user.id,
        email: user.email,
        sessionId,
        userType: 'user',
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? '7d' : process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'user-app',
        audience: process.env.JWT_AUDIENCE || 'app-users',
      });

      const refreshToken = jwt.sign(
        {
          id: user.id,
          sessionId,
          type: 'refresh',
          userType: 'user',
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
          issuer: process.env.JWT_ISSUER || 'user-app',
          audience: process.env.JWT_AUDIENCE || 'app-users',
        }
      );

      logger.info(`User login successful: ${user.email}`);

      res.json(
        ApiResponse.success(
          {
            token: accessToken,
            refreshToken: refreshToken,
            expiresIn: rememberMe ? '7d' : process.env.JWT_EXPIRES_IN || '24h',
            user: user.toJSON(),
            userType: 'user',
          },
          'User login successful'
        )
      );
    } catch (error) {
      logger.error('User login error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get Profile (works for both admin and user)
   * GET /api/admin/auth/profile or /api/auth/profile
   */
  static async getProfile(req, res) {
    try {
      const userType = req.user?.userType || req.admin?.userType;
      const userId = req.user?.id || req.admin?.id;

      if (!userType || !userId) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
      }

      let profileData;

      if (userType === 'admin') {
        const admin = await Admin.findByPk(userId);
        if (!admin) {
          return res
            .status(404)
            .json(ApiResponse.error('Admin not found', 404));
        }
        if (!admin.isActive) {
          return res
            .status(401)
            .json(ApiResponse.error('Account is inactive', 401));
        }

        profileData = {
          ...admin.toJSON(),
          lastLoginFormatted: admin.lastLogin
            ? new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              }).format(new Date(admin.lastLogin))
            : 'Never',
          accountAge: admin.createdAt
            ? Math.floor(
                (new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24)
              )
            : 0,
          permissions: PermissionManager.getPermissionsByRole(admin.role),
          permissionGroups: PermissionManager.getPermissionGroups(admin.role),
          accessibleModules: PermissionManager.getModules().filter((module) => {
            const permissions = PermissionManager.getPermissionsByRole(
              admin.role
            );
            return permissions.some((permission) =>
              permission.startsWith(module.key)
            );
          }),
          userType: 'admin',
        };
      } else {
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json(ApiResponse.error('User not found', 404));
        }
        if (!user.isActive) {
          return res
            .status(401)
            .json(ApiResponse.error('Account is inactive', 401));
        }

        profileData = {
          ...user.toJSON(),
          lastLoginFormatted: user.lastLogin
            ? new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              }).format(new Date(user.lastLogin))
            : 'Never',
          accountAge: user.createdAt
            ? Math.floor(
                (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
              )
            : 0,
          userType: 'user',
        };
      }

      res.json(
        ApiResponse.success(profileData, 'Profile retrieved successfully')
      );
    } catch (error) {
      logger.error('Get profile error:', {
        error: error.message,
        userId: req.user?.id || req.admin?.id,
        userType: req.user?.userType || req.admin?.userType,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update Profile (works for both admin and user)
   * PUT /api/admin/auth/profile or /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const userType = req.user?.userType || req.admin?.userType;
      const userId = req.user?.id || req.admin?.id;
      const { fullName, username, avatar, phone, dateOfBirth } = req.body;

      if (!userType || !userId) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
      }

      // Input validation
      const updateData = {};

      if (fullName !== undefined) {
        if (!fullName || fullName.trim().length < 2) {
          return res
            .status(400)
            .json(
              ApiResponse.error('Full name must be at least 2 characters', 400)
            );
        }
        updateData.fullName = fullName.trim();
      }

      if (username !== undefined) {
        const trimmedUsername = username.trim().toLowerCase();
        if (!trimmedUsername || trimmedUsername.length < 3) {
          return res
            .status(400)
            .json(
              ApiResponse.error('Username must be at least 3 characters', 400)
            );
        }

        // Check if username is already taken by another user of the same type
        const Model = userType === 'admin' ? Admin : User;
        const existingUser = await Model.findOne({
          where: {
            username: trimmedUsername,
            id: { [Op.ne]: userId },
          },
        });

        if (existingUser) {
          return res
            .status(400)
            .json(ApiResponse.error('Username already taken', 400));
        }
        updateData.username = trimmedUsername;
      }

      if (avatar !== undefined) {
        updateData.avatar = avatar;
      }

      // User-specific fields
      if (userType === 'user') {
        if (phone !== undefined) {
          updateData.phone = phone;
        }
        if (dateOfBirth !== undefined) {
          updateData.dateOfBirth = dateOfBirth;
        }
      }

      // Update profile
      const Model = userType === 'admin' ? Admin : User;
      await Model.update(updateData, { where: { id: userId } });

      logger.info(`${userType} profile updated`, {
        userId: userId,
        userType: userType,
        updatedFields: Object.keys(updateData),
      });

      // Return updated profile
      const updatedRecord = await Model.findByPk(userId);
      res.json(
        ApiResponse.success(
          { ...updatedRecord.toJSON(), userType },
          'Profile updated successfully'
        )
      );
    } catch (error) {
      logger.error('Update profile error:', {
        error: error.message,
        userId: req.user?.id || req.admin?.id,
        userType: req.user?.userType || req.admin?.userType,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Change Password (works for both admin and user)
   * PUT /api/admin/auth/change-password or /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const userType = req.user?.userType || req.admin?.userType;
      const userId = req.user?.id || req.admin?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userType || !userId) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
      }

      // Input validation
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Current password and new password are required',
              400
            )
          );
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'New password must be at least 8 characters long',
              400
            )
          );
      }

      // Get user/admin instance
      const Model = userType === 'admin' ? Admin : User;
      const record = await Model.findByPk(userId);

      if (!record) {
        return res
          .status(404)
          .json(
            ApiResponse.error(
              `${userType === 'admin' ? 'Admin' : 'User'} not found`,
              404
            )
          );
      }

      // Verify current password
      const isCurrentPasswordValid =
        await record.validatePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        logger.warn(
          `Invalid current password attempt by ${userType}: ${record.email}`,
          {
            userId: record.id,
            userType: userType,
            ip: req.ip,
          }
        );
        return res
          .status(400)
          .json(ApiResponse.error('Current password is incorrect', 400));
      }

      // Check if new password is different from current
      const isSamePassword = await record.validatePassword(newPassword);
      if (isSamePassword) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'New password must be different from current password',
              400
            )
          );
      }

      // Update password
      await record.update({ password: newPassword });

      logger.info(
        `Password changed successfully for ${userType}: ${record.email}`,
        {
          userId: record.id,
          userType: userType,
          ip: req.ip,
        }
      );

      // Send email notification
      try {
        await emailService.sendPasswordChangeNotification(record);
      } catch (emailError) {
        logger.warn('Failed to send password change notification email:', {
          error: emailError.message,
          userId: record.id,
          userType: userType,
        });
      }

      res.json(ApiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      logger.error('Change password error:', {
        error: error.message,
        userId: req.user?.id || req.admin?.id,
        userType: req.user?.userType || req.admin?.userType,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Logout (works for both admin and user)
   * POST /api/admin/auth/logout or /api/auth/logout
   */
  static async logout(req, res) {
    try {
      const userType = req.user?.userType || req.admin?.userType;
      const record = req.user || req.admin;

      if (!record) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
      }

      // In production, implement token blacklisting here
      // Example: await TokenBlacklist.create({ token: req.token, expiresAt: req.tokenExp });

      logger.info(`${userType} logout: ${record.email}`, {
        userId: record.id,
        userType: userType,
        ip: req.ip,
      });

      res.json(ApiResponse.success(null, 'Logout successful'));
    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        userId: req.user?.id || req.admin?.id,
        userType: req.user?.userType || req.admin?.userType,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Refresh Access Token (works for both admin and user)
   * POST /api/admin/auth/refresh-token or /api/auth/refresh-token
   */
  static async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json(ApiResponse.error('Refresh token is required', 400));
    }

    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Ensure the token type is 'refresh'
      if (decoded.type !== 'refresh') {
        logger.warn('Invalid token type on refresh attempt', {
          ip: req.ip,
          tokenType: decoded.type,
        });
        return res
          .status(401)
          .json(ApiResponse.error('Invalid token type', 401));
      }

      const userType = decoded.userType;
      if (!userType || !['admin', 'user'].includes(userType)) {
        logger.warn('Invalid or missing user type in refresh token', {
          ip: req.ip,
          userType: userType,
        });
        return res.status(401).json(ApiResponse.error('Invalid token', 401));
      }

      // Check if user/admin exists and is active
      const Model = userType === 'admin' ? Admin : User;
      const record = await Model.findByPk(decoded.id);

      if (!record || !record.isActive) {
        logger.warn(`Inactive or missing ${userType} during token refresh`, {
          userId: decoded.id,
          userType: userType,
          ip: req.ip,
        });
        return res
          .status(401)
          .json(
            ApiResponse.error(
              `Invalid refresh token or ${userType} inactive`,
              401
            )
          );
      }

      // Generate a new session ID
      const newSessionId = crypto.randomUUID();

      // Prepare payload for new access token
      const newAccessTokenPayload = {
        id: record.id,
        email: record.email,
        sessionId: newSessionId,
        userType: userType,
      };

      // Add role for admin
      if (userType === 'admin') {
        newAccessTokenPayload.role = record.role;
      }

      // Set appropriate issuer/audience based on user type
      const issuer =
        userType === 'admin'
          ? process.env.JWT_ISSUER || 'admin-panel'
          : process.env.JWT_ISSUER || 'user-app';
      const audience =
        userType === 'admin'
          ? process.env.JWT_AUDIENCE || 'admin-users'
          : process.env.JWT_AUDIENCE || 'app-users';

      // Sign new access token
      const newAccessToken = jwt.sign(
        newAccessTokenPayload,
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: issuer,
          audience: audience,
        }
      );

      // Sign new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: record.id,
          sessionId: newSessionId,
          type: 'refresh',
          userType: userType,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          issuer: issuer,
          audience: audience,
        }
      );

      logger.info(`Token refreshed successfully for ${userType}`, {
        userId: record.id,
        userType: userType,
        ip: req.ip,
      });

      return res.json(
        ApiResponse.success(
          {
            token: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            userType: userType,
            sessionInfo: {
              sessionId: newSessionId,
              refreshedAt: new Date().toISOString(),
            },
          },
          'Token refreshed successfully'
        )
      );
    } catch (error) {
      logger.warn('Failed to refresh token', {
        error: error.message,
        ip: req.ip,
      });
      return res
        .status(401)
        .json(ApiResponse.error('Invalid or expired refresh token', 401));
    }
  }

  /**
   * Get Admin Permissions (Admin only)
   * GET /api/admin/auth/permissions
   */
  static async getPermissions(req, res) {
    try {
      const admin = req.admin;

      if (!admin || admin.userType !== 'admin') {
        return res
          .status(403)
          .json(ApiResponse.error('Admin access required', 403));
      }

      const role = admin.role;
      const permissions = PermissionManager.getPermissionsByRole(role);
      const permissionGroups = PermissionManager.getPermissionGroups(role);
      const modules = PermissionManager.getModules();

      const accessibleModules = modules.filter((module) => {
        return permissions.some((permission) =>
          permission.startsWith(module.key)
        );
      });

      const responseData = {
        role: role,
        permissions: permissions,
        permissionGroups: permissionGroups,
        modules: accessibleModules,
        meta: {
          totalPermissions: permissions.length,
          totalModules: accessibleModules.length,
          lastUpdated: new Date().toISOString(),
          adminId: admin.id,
          adminName: admin.fullName,
        },
      };

      res.json(
        ApiResponse.success(responseData, 'Permissions retrieved successfully')
      );
    } catch (error) {
      logger.error('Get permissions error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Check Specific Permission (Admin only)
   * GET /api/admin/auth/permissions/check/:permission
   */
  static async checkPermission(req, res) {
    try {
      const { permission } = req.params;
      const admin = req.admin;

      if (!admin || admin.userType !== 'admin') {
        return res
          .status(403)
          .json(ApiResponse.error('Admin access required', 403));
      }

      if (!permission) {
        return res
          .status(400)
          .json(ApiResponse.error('Permission parameter is required', 400));
      }

      const hasPermission = PermissionManager.hasPermission(
        admin.role,
        permission
      );
      const permissionDescription = PermissionManager.PERMISSIONS?.[permission];

      const responseData = {
        hasPermission,
        permission,
        description: permissionDescription || 'Unknown permission',
        role: admin.role,
        timestamp: new Date().toISOString(),
      };

      res.json(
        ApiResponse.success(
          responseData,
          `Permission check completed for: ${permission}`
        )
      );
    } catch (error) {
      logger.error('Check permission error:', {
        error: error.message,
        permission: req.params?.permission,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Forgot Password (works for both admin and user)
   * POST /api/admin/auth/forgot-password or /api/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    try {
      const { emailOrNumber, userType = 'user' } = req.body;

      if (!emailOrNumber) {
        return res
          .status(400)
          .json(ApiResponse.error('Email or phone number is required', 400));
      }

      if (!['admin', 'user'].includes(userType)) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid user type', 400));
      }

      // Regex patterns
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phonePattern = /^[0-9]{10,15}$/;

      const trimmedInput = emailOrNumber.trim();
      const isEmail = emailPattern.test(trimmedInput);
      const isPhone = phonePattern.test(trimmedInput);

      if (!isEmail && !isPhone) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid email or phone number format', 400));
      }

      const normalizedInput = isEmail
        ? trimmedInput.toLowerCase()
        : trimmedInput;

      const whereClause = isEmail
        ? { email: normalizedInput }
        : { phone: normalizedInput };

      const record = await Admin.findOne({ where: whereClause });

      const successMessage =
        'If an account with the provided information exists, a password reset link has been sent.';

      if (!record || !record.isActive) {
        logger.warn(
          `Password reset requested for non-existent or inactive ${userType}: ${normalizedInput}`,
          {
            ip: req.ip,
            userType: userType,
          }
        );
        return res.json(ApiResponse.success(null, successMessage));
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await record.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      });

      try {
        await EmailService.sendPasswordResetEmail(record, resetToken, userType);
        logger.info(
          `Password reset email sent to ${userType}: ${normalizedInput}`,
          {
            userId: record.id,
            userType: userType,
            ip: req.ip,
          }
        );
      } catch (emailError) {
        logger.error('Failed to send password reset email:', {
          error: emailError.message,
          user: normalizedInput,
          userId: record.id,
          userType: userType,
        });
        return res
          .status(500)
          .json(
            ApiResponse.error(
              'Failed to send reset email. Please try again later.',
              500
            )
          );
      }

      res.json(ApiResponse.success(null, successMessage));
    } catch (error) {
      logger.error('Forgot password error:', {
        error: error.message,
        input: req.body?.emailOrNumber,
        userType: req.body?.userType,
        ip: req.ip,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Reset Password with Token (works for both admin and user)
   * POST /api/admin/auth/reset-password or /api/auth/reset-password
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword, userType = 'user' } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json(ApiResponse.error('Token and new password are required', 400));
      }

      if (!['admin', 'user'].includes(userType)) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid user type', 400));
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Password must be at least 8 characters long',
              400
            )
          );
      }

      // Find record with valid reset token
      const Model = userType === 'admin' ? Admin : User;
      const record = await Model.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
          isActive: true,
        },
      });

      if (!record) {
        logger.warn(`Invalid or expired reset token attempt for ${userType}`, {
          token: token.substring(0, 8) + '...',
          userType: userType,
          ip: req.ip,
        });
        return res
          .status(400)
          .json(ApiResponse.error('Invalid or expired reset token', 400));
      }

      // Check if new password is different from current
      try {
        const isSamePassword = await record.validatePassword(newPassword);
        if (isSamePassword) {
          return res
            .status(400)
            .json(
              ApiResponse.error(
                'New password must be different from current password',
                400
              )
            );
        }
      } catch (compareError) {
        logger.warn(
          'Password comparison failed during reset:',
          compareError.message
        );
      }

      // Update password and clear reset token
      await record.update({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0,
        lockUntil: null,
      });

      logger.info(
        `Password reset successful for ${userType}: ${record.email}`,
        {
          userId: record.id,
          userType: userType,
          ip: req.ip,
        }
      );

      // Send confirmation email
      try {
        await EmailService.sendPasswordResetConfirmation(record, userType);
      } catch (emailError) {
        logger.warn('Failed to send password reset confirmation email:', {
          error: emailError.message,
          userId: record.id,
          userType: userType,
        });
      }

      res.json(
        ApiResponse.success(
          null,
          'Password reset successful. You can now login with your new password.'
        )
      );
    } catch (error) {
      logger.error('Reset password error:', {
        error: error.message,
        userType: req.body?.userType,
        ip: req.ip,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * User Registration
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { email, password, fullName, username } = req.body;

      // Input validation
      if (!email || !password || !fullName) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Email, password, and full name are required',
              400
            )
          );
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Password must be at least 8 characters long',
              400
            )
          );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res
          .status(400)
          .json(ApiResponse.error('User with this email already exists', 400));
      }

      // Check username if provided
      if (username) {
        const existingUsername = await User.findOne({
          where: { username: username.trim().toLowerCase() },
        });

        if (existingUsername) {
          return res
            .status(400)
            .json(ApiResponse.error('Username already taken', 400));
        }
      }

      // Create user
      const userData = {
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        username: username ? username.trim().toLowerCase() : null,
        isActive: true,
        emailVerified: false,
      };

      const user = await User.create(userData);

      logger.info(`New user registered: ${normalizedEmail}`, {
        userId: user.id,
        ip: req.ip,
      });

      // Send verification email
      try {
        await emailService.sendEmailVerification(user);
      } catch (emailError) {
        logger.warn('Failed to send verification email:', {
          error: emailError.message,
          userId: user.id,
        });
      }

      res.status(201).json(
        ApiResponse.success(
          {
            user: user.toJSON(),
            message:
              'Registration successful. Please check your email to verify your account.',
          },
          'User registered successfully'
        )
      );
    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        email: req.body?.email,
        ip: req.ip,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Upload Avatar (works for both admin and user)
   * POST /api/admin/auth/upload-avatar or /api/auth/upload-avatar
   */
  static async uploadAvatar(req, res) {
    try {
      const userType = req.user?.userType || req.admin?.userType;
      const userId = req.user?.id || req.admin?.id;

      if (!req.file) {
        return res
          .status(400)
          .json(ApiResponse.error('No image file provided', 400));
      }

      if (!userType || !userId) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
      }

      const Model = userType === 'admin' ? Admin : User;
      const record = await Model.findByPk(userId);

      if (!record) {
        return res
          .status(404)
          .json(
            ApiResponse.error(
              `${userType === 'admin' ? 'Admin' : 'User'} not found`,
              404
            )
          );
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Update avatar
      await record.update({ avatar: avatarPath });

      logger.info(`Avatar uploaded for ${userType}: ${record.email}`, {
        userId: record.id,
        userType: userType,
        filename: req.file.filename,
      });

      const responseKey = userType === 'admin' ? 'admin' : 'user';
      res.json(
        ApiResponse.success(
          {
            avatarUrl: avatarPath,
            [responseKey]: { ...record.toJSON(), userType },
          },
          'Avatar uploaded successfully'
        )
      );
    } catch (error) {
      logger.error('Upload avatar error:', {
        error: error.message,
        userId: req.user?.id || req.admin?.id,
        userType: req.user?.userType || req.admin?.userType,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }
}

module.exports = AuthController;
