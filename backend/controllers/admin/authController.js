const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Admin } = require('../../models');
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
  max: 5, // Limit each IP to 5 requests per windowMs
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
  /**
   * Admin Login - CORRECTED VERSION
   * POST /api/admin/auth/login
   */
  static async login(req, res) {
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
          `Login attempt with non-existent email: ${normalizedEmail}`
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
          `Login attempt on locked account: ${normalizedEmail}, ${lockTimeRemaining} minutes remaining`
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
        logger.warn(`Login attempt on inactive account: ${normalizedEmail}`);
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
            `Account locked due to multiple failed attempts: ${normalizedEmail}`
          );
        }

        await admin.update(updateData);

        logger.warn(
          `Invalid password attempt for: ${normalizedEmail}, attempts: ${newAttempts}`
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
          type: 'refresh', // 👈 Important for refreshToken validation
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
          },
          'Login successful'
        )
      );
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get Admin Profile
   * GET /api/admin/auth/profile
   */
  static async getProfile(req, res) {
    try {
      const admin = await Admin.findByPk(req.admin.id);

      if (!admin) {
        return res.status(404).json(ApiResponse.error('Admin not found', 404));
      }

      if (!admin.isActive) {
        return res
          .status(401)
          .json(ApiResponse.error('Account is inactive', 401));
      }

      // Enhanced profile information
      const profileData = {
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
      };

      res.json(
        ApiResponse.success(profileData, 'Profile retrieved successfully')
      );
    } catch (error) {
      logger.error('Get profile error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Update Admin Profile
   * PUT /api/admin/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const { fullName, username, avatar } = req.body;
      const admin = req.admin;

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

        // Check if username is already taken by another admin
        if (trimmedUsername !== admin.username) {
          const existingAdmin = await Admin.findOne({
            where: {
              username: trimmedUsername,
              id: { [Op.ne]: admin.id },
            },
          });

          if (existingAdmin) {
            return res
              .status(400)
              .json(ApiResponse.error('Username already taken', 400));
          }
        }
        updateData.username = trimmedUsername;
      }

      if (avatar !== undefined) {
        // Validate avatar URL/path if needed
        updateData.avatar = avatar;
      }

      // Update admin profile
      await Admin.update(updateData, { where: { id: admin.id } });

      logger.info(`Admin profile updated: ${admin.email}`, {
        adminId: admin.id,
        updatedFields: Object.keys(updateData),
      });

      // Return updated profile
      const updatedAdmin = await Admin.findByPk(admin.id);
      res.json(
        ApiResponse.success(
          updatedAdmin.toJSON(),
          'Profile updated successfully'
        )
      );
    } catch (error) {
      logger.error('Update profile error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Change Password
   * PUT /api/admin/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

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

      // Get admin instance (not just data)
      const admin = await Admin.findByPk(req.admin.id);

      if (!admin) {
        return res.status(404).json(ApiResponse.error('Admin not found', 404));
      }

      // Verify current password
      const isCurrentPasswordValid =
        await admin.validatePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        logger.warn(
          `Invalid current password attempt by admin: ${admin.email}`,
          {
            adminId: admin.id,
            ip: req.ip,
          }
        );
        return res
          .status(400)
          .json(ApiResponse.error('Current password is incorrect', 400));
      }

      // Check if new password is different from current
      const isSamePassword = await admin.validatePassword(newPassword);
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

      // Update password (will be hashed by model hook)
      await admin.update({ password: newPassword });

      logger.info(`Password changed successfully for admin: ${admin.email}`, {
        adminId: admin.id,
        ip: req.ip,
      });

      // Send email notification
      try {
        await emailService.sendPasswordChangeNotification(admin);
      } catch (emailError) {
        logger.warn('Failed to send password change notification email:', {
          error: emailError.message,
          adminId: admin.id,
        });
      }

      res.json(ApiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      logger.error('Change password error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Admin Logout
   * POST /api/admin/auth/logout
   */
  static async logout(req, res) {
    try {
      const admin = req.admin;

      // In production, implement token blacklisting here
      // Example: await TokenBlacklist.create({ token: req.token, expiresAt: req.tokenExp });

      logger.info(`Admin logout: ${admin.email}`, {
        adminId: admin.id,
        ip: req.ip,
      });

      res.json(ApiResponse.success(null, 'Logout successful'));
    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Refresh Access Token
   * POST /api/admin/auth/refresh-token
   */
  static async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json(ApiResponse.error('Refresh token is required', 400));
    }

    try {
      // Verify the refresh token using the refresh secret only
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        issuer: process.env.JWT_ISSUER || 'admin-panel',
        audience: process.env.JWT_AUDIENCE || 'admin-users',
      });

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

      // Check if admin exists and is active
      const admin = await Admin.findByPk(decoded.id);
      if (!admin || !admin.isActive) {
        logger.warn('Inactive or missing admin during token refresh', {
          adminId: decoded.id,
          ip: req.ip,
        });
        return res
          .status(401)
          .json(
            ApiResponse.error('Invalid refresh token or admin inactive', 401)
          );
      }

      // Generate a new session ID
      const newSessionId = crypto.randomUUID();

      // Prepare payload for new access token
      const newAccessTokenPayload = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        sessionId: newSessionId,
      };

      // Sign new access token
      const newAccessToken = jwt.sign(
        newAccessTokenPayload,
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: process.env.JWT_ISSUER || 'admin-panel',
          audience: process.env.JWT_AUDIENCE || 'admin-users',
        }
      );

      // Sign new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: admin.id,
          sessionId: newSessionId,
          type: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          issuer: process.env.JWT_ISSUER || 'admin-panel',
          audience: process.env.JWT_AUDIENCE || 'admin-users',
        }
      );

      logger.info('Token refreshed successfully', {
        adminId: admin.id,
        ip: req.ip,
      });

      return res.json(
        ApiResponse.success(
          {
            token: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
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
   * Get Admin Permissions
   * GET /api/admin/auth/permissions
   */
  static async getPermissions(req, res) {
    try {
      const admin = req.admin;
      const role = admin.role;

      // Get permissions for the admin's role
      const permissions = PermissionManager.getPermissionsByRole(role);
      const permissionGroups = PermissionManager.getPermissionGroups(role);
      const modules = PermissionManager.getModules();

      // Filter modules based on permissions
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
   * Check Specific Permission
   * GET /api/admin/auth/permissions/check/:permission
   */
  static async checkPermission(req, res) {
    try {
      const { permission } = req.params;
      const admin = req.admin;

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
   * Forgot Password - Send Reset Email
   * POST /api/admin/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res
          .status(400)
          .json(ApiResponse.error('Email is required', 400));
      }

      const normalizedEmail = email.trim().toLowerCase();
      const admin = await Admin.findOne({
        where: { email: normalizedEmail },
      });

      // Always return success message for security
      const successMessage =
        'If an account with that email exists, a password reset link has been sent.';

      if (!admin) {
        logger.warn(
          `Password reset requested for non-existent email: ${normalizedEmail}`,
          {
            ip: req.ip,
          }
        );
        return res.json(ApiResponse.success(null, successMessage));
      }

      if (!admin.isActive) {
        logger.warn(
          `Password reset requested for inactive account: ${normalizedEmail}`,
          {
            ip: req.ip,
          }
        );
        return res.json(ApiResponse.success(null, successMessage));
      }

      // Generate cryptographically secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to admin record
      await admin.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      });

      // Send reset email
      try {
        await EmailService.sendPasswordResetEmail(admin, resetToken);
        logger.info(`Password reset email sent to: ${normalizedEmail}`, {
          adminId: admin.id,
          ip: req.ip,
        });
      } catch (emailError) {
        logger.error('Failed to send password reset email:', {
          error: emailError.message,
          email: normalizedEmail,
          adminId: admin.id,
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
        email: req.body?.email,
        ip: req.ip,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Reset Password with Token
   * POST /api/admin/auth/reset-password
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json(ApiResponse.error('Token and new password are required', 400));
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

      // Find admin with valid reset token
      const admin = await Admin.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
          isActive: true,
        },
      });

      if (!admin) {
        logger.warn('Invalid or expired reset token attempt', {
          token: token.substring(0, 8) + '...',
          ip: req.ip,
        });
        return res
          .status(400)
          .json(ApiResponse.error('Invalid or expired reset token', 400));
      }

      // Check if new password is different from current (if possible)
      try {
        const isSamePassword = await admin.validatePassword(newPassword);
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
        // Continue if comparison fails - better to allow reset than block it
        logger.warn(
          'Password comparison failed during reset:',
          compareError.message
        );
      }

      // Update password and clear reset token
      await admin.update({
        password: newPassword, // Will be hashed by model hook
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0, // Reset failed login attempts
        lockUntil: null, // Unlock account if it was locked
      });

      logger.info(`Password reset successful for admin: ${admin.email}`, {
        adminId: admin.id,
        ip: req.ip,
      });

      // Send confirmation email
      try {
        await EmailService.sendPasswordResetConfirmation(admin);
      } catch (emailError) {
        logger.warn('Failed to send password reset confirmation email:', {
          error: emailError.message,
          adminId: admin.id,
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
        ip: req.ip,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Validate Reset Token
   * GET /api/admin/auth/validate-reset-token/:token
   */
  static async validateResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res
          .status(400)
          .json(ApiResponse.error('Token is required', 400));
      }

      const admin = await Admin.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
          isActive: true,
        },
        attributes: ['id', 'email', 'fullName', 'resetPasswordExpires'],
      });

      if (!admin) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid or expired reset token', 400));
      }

      const timeRemaining = Math.floor(
        (admin.resetPasswordExpires - new Date()) / 1000 / 60
      );

      res.json(
        ApiResponse.success(
          {
            valid: true,
            email: admin.email,
            timeRemaining: timeRemaining,
            expiresAt: admin.resetPasswordExpires,
          },
          'Token is valid'
        )
      );
    } catch (error) {
      logger.error('Validate reset token error:', {
        error: error.message,
        token: req.params?.token?.substring(0, 8) + '...',
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Upload Avatar
   * POST /api/admin/auth/upload-avatar
   */
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json(ApiResponse.error('No image file provided', 400));
      }

      const admin = await Admin.findByPk(req.admin.id);
      if (!admin) {
        return res.status(404).json(ApiResponse.error('Admin not found', 404));
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Update admin avatar
      await admin.update({ avatar: avatarPath });

      logger.info(`Avatar uploaded for admin: ${admin.email}`, {
        adminId: admin.id,
        filename: req.file.filename,
      });

      res.json(
        ApiResponse.success(
          {
            avatarUrl: avatarPath,
            admin: admin.toJSON(),
          },
          'Avatar uploaded successfully'
        )
      );
    } catch (error) {
      logger.error('Upload avatar error:', {
        error: error.message,
        adminId: req.admin?.id,
      });
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }
}

module.exports = AuthController;
