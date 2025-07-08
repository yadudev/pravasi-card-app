const {
  User,
  DiscountCard,
  Transaction,
  Shop,
  sequelize,
  Admin,
  OTPSession,
} = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/responses');
const Helpers = require('../../utils/helpers');
const EmailService = require('../../services/emailService');
const logger = require('../../utils/logger');
const crypto = require('crypto');
const emailService = require('../../services/emailService');

class UserController {
  /**
   * Get all users with pagination, search, and filters
   * GET /api/admin/users
   */
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const tier = req.query.tier;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'DESC';

      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ];
      }

      if (status !== undefined) {
        whereClause.isActive = status === 'active';
      }

      if (tier) {
        whereClause.currentDiscountTier = tier;
      }

      const { count, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['createdBy'] },
        where: whereClause,
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiresAt', 'isActive'],
          },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        distinct: true,
      });

      const pagination = Helpers.getPaginationData(page, limit, count);

      res.json(
        ApiResponse.paginated(users, pagination, 'Users retrieved successfully')
      );
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Get user by ID with detailed information
   * GET /api/admin/users/:id
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiresAt', 'isActive', 'qrCode'],
          },
          {
            model: Transaction,
            as: 'transactions',
            include: [
              {
                model: Shop,
                as: 'shop',
                attributes: ['name', 'location'],
              },
            ],
            limit: 10,
            order: [['createdAt', 'DESC']],
          },
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      res.json(ApiResponse.success(user, 'User retrieved successfully'));
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Step 1: Create user account with login access (Sign up modal)
   * POST /api/users/signup
   */
  static async signup(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { emailOrNumber, password } = req.body;

      // Determine if input is email or phone
      const isEmail = emailOrNumber.includes('@');
      const userData = {
        password,
        isEmailVerified: false,
        isPhoneVerified: false,
        isProfileComplete: false,
        registrationStep: 1,
      };

      if (isEmail) {
        const normalizedEmail = emailOrNumber.toLowerCase().trim();
        userData.email = normalizedEmail;
        userData.tempEmail = normalizedEmail;
      } else {
        const normalizedPhone = emailOrNumber.trim();
        userData.phone = normalizedPhone;
        userData.tempPhone = normalizedPhone;
      }

      const userWhereClause = { [Op.or]: [] };
      if (userData.email)
        userWhereClause[Op.or].push({ email: userData.email });
      if (userData.phone)
        userWhereClause[Op.or].push({ phone: userData.phone });

      const existingUser = await User.findOne({
        where: userWhereClause,
        attributes: { exclude: ['createdBy'] },
      });

      if (existingUser) {
        await transaction.rollback();
        return res
          .status(400)
          .json(ApiResponse.error('User already exists', 400));
      }

      const adminWhereClause = { [Op.or]: [] };
      if (userData.email)
        adminWhereClause[Op.or].push({ email: userData.email });
      if (userData.phone)
        adminWhereClause[Op.or].push({ phone: userData.phone });

      const existingAdmin = await Admin.findOne({ where: adminWhereClause });

      if (existingAdmin) {
        await transaction.rollback();
        return res
          .status(400)
          .json(ApiResponse.error('Account already exists', 400));
      }

      // Create incomplete user record
      const user = await User.create(userData, { transaction });

      // Create admin entry immediately for login access (with 'user' role)
      const admin = await Admin.create(
        {
          fullName: null,
          email: userData.email || null,
          phone: userData.phone || null,
          password,
          role: 'user',
          permissions: ['read'],
          userId: user.id,
          isActive: true,
          isProfileComplete: false,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(
        `Step 1 signup completed with login access: ${emailOrNumber}`
      );

      return res.status(201).json(
        ApiResponse.success(
          {
            userId: user.id,
            adminId: admin.id,
            email: user.email,
            phone: user.phone,
            hasLoginAccess: true,
            nextStep: 2,
            message:
              'Account created! Please complete your profile to get your Pravasi Privilege Card.',
          },
          'Step 1 completed successfully - You can now login'
        )
      );
    } catch (error) {
      await transaction.rollback();
      logger.error('Signup Step 1 error:', error);
      return res
        .status(500)
        .json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Step 2: Complete profile and create privilege card
   * POST /api/users/createProfile
   */
  static async createProfile(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { userId, adminId, fullName, email, phone, location } = req.body;

      // Find the incomplete user
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['createdBy'] },
      });
      if (!user) {
        await transaction.rollback();
        return res.status(400).json(ApiResponse.error('User not found', 400));
      }

      if (user.isProfileComplete) {
        await transaction.rollback();
        return res
          .status(400)
          .json(ApiResponse.error('Profile already complete', 400));
      }

      // Check if new email/phone conflicts with existing users (excluding current user)
      if (email && email !== user.email) {
        const existingEmailUser = await User.findOne({
          where: {
            email: email.toLowerCase(),
            id: { [Op.ne]: userId },
          },
          attributes: { exclude: ['createdBy'] },
        });

        const existingEmailAdmin = await Admin.findOne({
          where: {
            email: email.toLowerCase(),
            id: { [Op.ne]: adminId },
          },
        });

        if (existingEmailUser || existingEmailAdmin) {
          await transaction.rollback();
          return res
            .status(400)
            .json(ApiResponse.error('Email already exists', 400));
        }
      }

      if (phone && phone !== user.phone) {
        const existingPhoneUser = await User.findOne({
          where: {
            phone: phone,
            id: { [Op.ne]: userId },
          },
          attributes: { exclude: ['createdBy'] },
        });

        const existingPhoneAdmin = await Admin.findOne({
          where: {
            phone: phone,
            id: { [Op.ne]: adminId },
          },
        });

        if (existingPhoneUser || existingPhoneAdmin) {
          await transaction.rollback();
          return res
            .status(400)
            .json(ApiResponse.error('Phone number already exists', 400));
        }
      }

      // Update user with complete profile
      const updateData = {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        location: location.trim(),
        isEmailVerified: true,
        isPhoneVerified: true,
        isProfileComplete: true,
        registrationStep: 2,
      };

      await user.update(updateData, { transaction });

      // Update existing admin entry with complete profile
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (admin) {
        await admin.update(
          {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
          },
          { transaction }
        );
      }

      // Create Pravasi Privilege Card
      const cardNumber = Helpers.generateCardNumber();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const discountCard = await DiscountCard.create(
        {
          userId: user.id,
          cardNumber,
          expiresAt: expiryDate,
          qrCode: Helpers.generateQRCodeData(cardNumber, user.id),
          isActive: true,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`Registration completed: ${user.email}`);

      res.status(201).json(
        ApiResponse.success(
          {
            user: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              phone: user.phone,
            },
            privilegeCard: {
              cardNumber: discountCard.cardNumber,
              expiryDate: discountCard.expiryDate,
              qrCode: discountCard.qrCode,
            },
            loginAccount: {
              role: admin.role,
              isProfileComplete: true,
            },
          },
          'Pravasi Privilege Card created successfully!'
        )
      );
    } catch (error) {
      await transaction.rollback();
      logger.error('Create Privilege Card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Check user profile completion status after login
   * GET /api/users/profile-status
   */
  static async getProfileStatus(req, res) {
    try {
      const userId = req.user?.id || req.admin?.id;

      const admin = await Admin.findOne({
        where: { id: userId },
        attributes: ['role', 'email', 'phone', 'id'],
      });

      const userWhereClause = { [Op.or]: [] };
      if (admin.email) userWhereClause[Op.or].push({ email: admin.email });
      if (admin.phone) userWhereClause[Op.or].push({ phone: admin.phone });

      const user = await User.findOne({
        where: userWhereClause,
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiresAt', 'isActive'],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'email',
          'phone',
          'isProfileComplete',
          'registrationStep',
          'location',
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      const profileStatus = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          location: user.location,
          adminId: admin?.id,
        },
        status: {
          isProfileComplete: user.isProfileComplete,
          currentStep: user.registrationStep,
          hasPrivilegeCard: !!user.discountCard,
          needsProfileCompletion: !user.isProfileComplete,
        },
        loginAccount: {
          role: admin?.role || 'user',
          permissions: admin?.permissions || ['read'],
        },
        privilegeCard: user.discountCard || null,
        nextAction: user.isProfileComplete
          ? 'profile_complete'
          : 'complete_profile_and_get_card',
      };

      res.json(
        ApiResponse.success(
          profileStatus,
          'Profile status retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get profile status error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // ========================================
  // ✅ OTP FUNCTIONALITY - COMPLETE WORKING VERSION
  // ========================================

  /**
   * Generate 4-digit OTP
   */
  static generateOTP() {
    return crypto.randomInt(1000, 9999).toString();
  }

  /**
   * Send Email OTP for verification
   * POST /api/users/otp/send-email
   */
  static async sendEmailOTP(req, res) {
    try {
      const { email, phone, type, fullName } = req.body;

      if (!email && !phone) {
        return res
          .status(400)
          .json(ApiResponse.error('Email or phone is required', 400));
      }

      // Fetch user using email or phone
      const user = await User.findOne({
        where: {
          [Op.or]: [email ? { email } : null, phone ? { phone } : null].filter(
            Boolean
          ),
        },
        attributes: ['id', 'fullName', 'email', 'phone'],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Optional: validate that the input email matches the user's record
      if (email && user.email !== email) {
        return res
          .status(400)
          .json(ApiResponse.error('Email does not match user account', 400));
      }

      const contactInfo = email || user.email;
      const userId = user.id;

      // ✅ Rate limiting check (1 min cooldown)
      const recentCount = await OTPSession.countRecentRequests(
        userId,
        contactInfo,
        1
      );
      if (recentCount > 0) {
        return res
          .status(429)
          .json(
            ApiResponse.error('Please wait before requesting another OTP', 429)
          );
      }

      // ✅ Daily limit check (10 per day)
      const dailyCount = await OTPSession.countDailyRequests(
        userId,
        contactInfo
      );
      if (dailyCount >= 10) {
        return res
          .status(429)
          .json(
            ApiResponse.error(
              'Daily OTP limit exceeded. Please try again tomorrow.',
              429
            )
          );
      }

      // ✅ Generate OTP and create session
      const otpCode = UserController.generateOTP();
      const session = await OTPSession.createSession({
        userId,
        otpCode,
        otpType: 'email',
        contactInfo,
        purpose: type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const emailContent = UserController.generateEmailContent(
        otpCode,
        type,
        fullName || user.fullName
      );
      
      await emailService.sendEmail(
        contactInfo,
        emailContent.subject,
        emailContent.html
      );

      logger.info(`Email OTP sent to ${contactInfo} for user ${userId}`);

      res.status(200).json(
        ApiResponse.success(
          {
            sessionId: session.sessionId,
            message: 'OTP sent successfully to your email',
            expiresAt: session.expiresAt,
          },
          'OTP sent successfully'
        )
      );
    } catch (error) {
      logger.error('Send Email OTP Error:', error);
      res
        .status(500)
        .json(ApiResponse.error('Failed to send OTP. Please try again.', 500));
    }
  }

  /**
   * Verify Email OTP
   * POST /api/users/otp/verify-email
   */
  static async verifyEmailOTP(req, res) {
    try {
      const { otp, sessionId, email } = req.body;

      // Fetch session details by sessionId
      const session = await OTPSession.findBySessionId(sessionId);

      if (!session) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid OTP session', 400));
      }

      // Fetch the user using email or phone from the session
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email }],
        },
        attributes: ['id', 'email', 'phone'],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Validate OTP using model method
      await OTPSession.validateOTP(sessionId, otp, user.id);

      // Handle OTP verification success for the user
      await UserController.handleOTPVerificationSuccess(
        session.purpose,
        user.id,
        email || user.email // Fallback to user email if email is not provided
      );

      logger.info(
        `OTP verified successfully for user ${user.id}, purpose: ${session.purpose}`
      );

      res.status(200).json(
        ApiResponse.success(
          {
            message: 'OTP verified successfully',
            purpose: session.purpose,
          },
          'OTP verification successful'
        )
      );
    } catch (error) {
      logger.error('Verify Email OTP Error:', error);
      res
        .status(400)
        .json(
          ApiResponse.error(error.message || 'OTP verification failed', 400)
        );
    }
  }

  /**
   * Resend Email OTP
   * POST /api/users/otp/resend-email
   */
  static async resendEmailOTP(req, res) {
    try {
      const { email, sessionId } = req.body;

      // Fetch session details by sessionId
      const session = await OTPSession.findBySessionId(sessionId);

      if (!session) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid OTP session', 400));
      }

      // Fetch the user using email or phone from the session
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email }],
        },
        attributes: ['id', 'email', 'phone'],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      if (session.isVerified) {
        return res
          .status(400)
          .json(ApiResponse.error('OTP already verified', 400));
      }

      if (!session.canResend()) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Cannot resend OTP at this time. Please wait or maximum resend limit reached.',
              400
            )
          );
      }

      const newOtpCode = UserController.generateOTP();
      const updatedSession = await session.updateForResend(newOtpCode);

      // Generate and send the OTP via email
      // const emailContent = UserController.generateEmailContent(
      //   newOtpCode,
      //   session.purpose,
      //   user.fullName
      // );
      // await EmailService.sendEmail(
      //   email,
      //   emailContent.subject,
      //   emailContent.html
      // );

      logger.info(`Email OTP resent to ${email} for user ${user.id}`);

      res.status(200).json(
        ApiResponse.success(
          {
            sessionId: sessionId,
            message: 'OTP resent successfully',
            expiresAt: updatedSession.expiresAt,
          },
          'OTP resent successfully'
        )
      );
    } catch (error) {
      logger.error('Resend Email OTP Error:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Failed to resend OTP. Please try again.', 500)
        );
    }
  }

  /**
   * Send SMS OTP for verification
   * POST /api/users/otp/send-sms
   */
  static async sendSMSOTP(req, res) {
    try {
      const { phone, email, type, name } = req.body;
      const userId = req.user?.id || req.admin?.userId;

      // Get user information
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Validate phone belongs to user
      if (user.phone !== phone) {
        return res
          .status(400)
          .json(
            ApiResponse.error('Phone number does not match user account', 400)
          );
      }

      // ✅ Rate limiting check
      const recentCount = await OTPSession.countRecentRequests(
        userId,
        phone,
        1
      );
      if (recentCount > 0) {
        return res
          .status(429)
          .json(
            ApiResponse.error('Please wait before requesting another OTP', 429)
          );
      }

      // ✅ Daily limit check
      const dailyCount = await OTPSession.countDailyRequests(userId, phone);
      if (dailyCount >= 10) {
        return res
          .status(429)
          .json(
            ApiResponse.error(
              'Daily OTP limit exceeded. Please try again tomorrow.',
              429
            )
          );
      }

      // ✅ Generate OTP and create session
      const otpCode = this.generateOTP();
      const session = await OTPSession.createSession({
        userId,
        otpCode,
        otpType: 'sms',
        contactInfo: phone,
        purpose: type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Send SMS
      await this.sendOTPSMS(phone, otpCode, type);

      logger.info(`SMS OTP sent to ${phone} for user ${userId}`);

      res.status(200).json(
        ApiResponse.success(
          {
            sessionId: session.sessionId,
            message: 'OTP sent successfully to your phone',
            expiresAt: session.expiresAt,
          },
          'OTP sent successfully'
        )
      );
    } catch (error) {
      logger.error('Send SMS OTP Error:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Failed to send SMS OTP. Please try again.', 500)
        );
    }
  }

  /**
   * Verify SMS OTP
   * POST /api/users/otp/verify-sms
   */
  static async verifySMSOTP(req, res) {
    try {
      const { otp, sessionId, phone } = req.body;
      const userId = req.user?.id || req.admin?.userId;

      // ✅ Validate OTP using model method
      const session = await OTPSession.validateOTP(sessionId, otp, userId);

      // Perform action based on purpose
      await this.handleOTPVerificationSuccess(session.purpose, userId, phone);

      logger.info(
        `SMS OTP verified successfully for user ${userId}, purpose: ${session.purpose}`
      );

      res.status(200).json(
        ApiResponse.success(
          {
            message: 'OTP verified successfully',
            purpose: session.purpose,
          },
          'OTP verification successful'
        )
      );
    } catch (error) {
      logger.error('Verify SMS OTP Error:', error);
      res
        .status(400)
        .json(
          ApiResponse.error(error.message || 'OTP verification failed', 400)
        );
    }
  }

  /**
   * Resend SMS OTP
   * POST /api/users/otp/resend-sms
   */
  static async resendSMSOTP(req, res) {
    try {
      const { phone, sessionId } = req.body;
      const userId = req.user?.id || req.admin?.userId;

      // ✅ Find existing session
      const session = await OTPSession.findBySessionId(sessionId);

      if (!session || session.userId !== userId) {
        return res
          .status(400)
          .json(ApiResponse.error('Invalid OTP session', 400));
      }

      if (session.isVerified) {
        return res
          .status(400)
          .json(ApiResponse.error('OTP already verified', 400));
      }

      if (!session.canResend()) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Cannot resend OTP at this time. Please wait or maximum resend limit reached.',
              400
            )
          );
      }

      // ✅ Generate new OTP and update session
      const newOtpCode = this.generateOTP();
      const updatedSession = await session.updateForResend(newOtpCode);

      // Send new SMS
      await this.sendOTPSMS(phone, newOtpCode, session.purpose);

      logger.info(`SMS OTP resent to ${phone} for user ${userId}`);

      res.status(200).json(
        ApiResponse.success(
          {
            sessionId: sessionId,
            message: 'OTP resent successfully',
            expiresAt: updatedSession.expiresAt,
          },
          'OTP resent successfully'
        )
      );
    } catch (error) {
      logger.error('Resend SMS OTP Error:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Failed to resend SMS OTP. Please try again.', 500)
        );
    }
  }

  /**
   * Generate email content based on purpose (4-digit OTP)
   */
  static generateEmailContent(otpCode, purpose, userName) {
    const templates = {
      card_activation: {
        subject: 'Activate Your Pravasi Privilege Card - OTP Verification',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Pravasi Privilege Card</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Hello ${userName || 'User'},</h2>
              <p style="color: #666; font-size: 16px;">
                You're almost ready! Use the verification code below to activate your Pravasi Privilege Card:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: white; border: 2px dashed #667eea; padding: 20px; display: inline-block; border-radius: 10px;">
                  <h1 style="color: #667eea; margin: 0; font-size: 48px; letter-spacing: 8px;">${otpCode}</h1>
                </div>
              </div>
              <p style="color: #666;">
                This 4-digit code will expire in 10 minutes. If you didn't request this, please ignore this email.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      },
      email_verification: {
        subject: 'Verify Your Email - Pravasi Privilege',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Email Verification</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Please use this 4-digit code to verify your email address:</p>
            <h1 style="color: #007bff; text-align: center; font-size: 48px; letter-spacing: 8px;">${otpCode}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      },
      phone_verification: {
        subject: 'Verify Your Phone Number - Pravasi Privilege',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Phone Number Verification</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Please use this 4-digit code to verify your phone number:</p>
            <h1 style="color: #007bff; text-align: center; font-size: 48px; letter-spacing: 8px;">${otpCode}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      },
      password_reset: {
        subject: 'Password Reset - Pravasi Privilege',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Password Reset</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Please use this 4-digit code to reset your password:</p>
            <h1 style="color: #dc3545; text-align: center; font-size: 48px; letter-spacing: 8px;">${otpCode}</h1>
            <p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      },
    };

    return templates[purpose] || templates.email_verification;
  }

  /**
   * Send OTP SMS (implement your SMS service) - 4-digit
   */
  static async sendOTPSMS(phone, otpCode, purpose) {
    try {
      const message = `Your Pravasi Privilege verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;

      // Option 1: Twilio (uncomment if using Twilio)
      // const twilio = require('twilio');
      // const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      // await twilioClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: `+91${phone}`
      // });

      // For now, just log (replace with actual SMS service)
      console.log(`SMS OTP: ${otpCode} to ${phone} for ${purpose}`);
    } catch (error) {
      logger.error('Send SMS Error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Handle successful OTP verification based on purpose
   */
  static async handleOTPVerificationSuccess(purpose, userId, contactInfo) {
    try {
      switch (purpose) {
        case 'card_activation':
          // Activate user's card
          await User.update(
            {
              cardStatus: 'active',
              cardActivatedAt: new Date(),
            },
            { where: { id: userId } }
          );

          // Also activate the discount card
          const user = await User.findByPk(userId, {
            include: [{ model: DiscountCard, as: 'discountCard' }],
            attributes: { exclude: ['createdBy'] },
          });

          if (user && user.discountCard) {
            await user.discountCard.update({ isActive: true });
          }

          logger.info(`Card activated for user ${userId}`);
          break;

        case 'email_verification':
          // Mark email as verified
          await User.update(
            {
              isEmailVerified: true,
              emailVerifiedAt: new Date(),
            },
            { where: { id: userId } }
          );
          logger.info(`Email verified for user ${userId}`);
          break;

        case 'phone_verification':
          // Mark phone as verified
          await User.update(
            {
              isPhoneVerified: true,
              phoneVerifiedAt: new Date(),
            },
            { where: { id: userId } }
          );
          logger.info(`Phone verified for user ${userId}`);
          break;

        case 'password_reset':
          // Handle password reset verification
          logger.info(`Password reset verified for user ${userId}`);
          break;

        default:
          logger.info(`No specific action for purpose: ${purpose}`);
      }
    } catch (error) {
      logger.error('Error handling OTP verification success:', error);
      throw error;
    }
  }

  // ========================================
  // END OF OTP FUNCTIONALITY
  // ========================================

  /**
   * Update user information
   * PUT /api/admin/users/:id
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: updateData.email.toLowerCase(),
            id: { [Op.ne]: id },
          },
        });

        if (existingUser) {
          return res
            .status(400)
            .json(ApiResponse.error('Email already taken', 400));
        }
        updateData.email = updateData.email.toLowerCase();
      }

      // Check if phone is being changed and if it's already taken
      if (updateData.phone && updateData.phone !== user.phone) {
        const existingPhone = await User.findOne({
          where: {
            phone: updateData.phone,
            id: { [Op.ne]: id },
          },
        });

        if (existingPhone) {
          return res
            .status(400)
            .json(ApiResponse.error('Phone number already taken', 400));
        }
      }

      // Update discount tier based on total spent
      if (updateData.totalSpent !== undefined) {
        updateData.currentDiscountTier = Helpers.calculateDiscountTier(
          updateData.totalSpent
        );
      }

      const allowedFields = [
        'fullName',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'pincode',
        'isActive',
        'currentDiscountTier',
        'totalSpent',
        'dateOfBirth',
        'gender',
      ];

      const filteredUpdateData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      });

      await user.update(filteredUpdateData);

      logger.info(`User updated by admin: ${user.email}`);

      res.json(ApiResponse.success(user, 'User updated successfully'));
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Search shops with filters, location, and user-specific discount information
   * GET /api/users/shops/search
   */
  static async searchShops(req, res) {
    try {
      const isShopCurrentlyOpen = (openingHours) => {
        try {
          if (!openingHours || typeof openingHours !== 'object') return false;

          const now = new Date();
          const days = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const currentDay = days[now.getDay()];
          const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

          const todayHours = openingHours[currentDay];
          if (!todayHours || todayHours === 'closed') return false;

          // Parse opening hours (assuming format like "09:00-21:00")
          const timeParts = todayHours.split('-');
          if (timeParts.length !== 2) return false;

          const openTime = parseInt(timeParts[0].replace(':', ''));
          const closeTime = parseInt(timeParts[1].replace(':', ''));

          return currentTime >= openTime && currentTime <= closeTime;
        } catch (error) {
          return false; // Default to closed if parsing fails
        }
      };

      const getShopBadges = (shopData) => {
        const badges = [];

        if (shopData.averageRating >= 4.5) badges.push('Top Rated');
        if (shopData.discountOffered >= 20) badges.push('Great Deals');
        if (shopData.isActive) badges.push('Active');

        return badges;
      };

      const getPaginationData = (page, limit, totalCount) => {
        return {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
          limit: limit,
        };
      };

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Search parameters
      const search = req.query.search || '';
      const category = req.query.category;
      const location = req.query.location || '';
      const latitude = parseFloat(req.query.latitude);
      const longitude = parseFloat(req.query.longitude);
      const maxDistance = parseInt(req.query.maxDistance) || 10; // km
      const sortBy = req.query.sortBy || 'distance'; // distance, name, discount, rating
      const sortOrder = req.query.sortOrder || 'ASC';

      // Get user information for personalized discounts
      const userId = req.user?.id || req.admin?.userId;
      let user = null;
      if (userId) {
        user = await User.findByPk(userId, {
          attributes: [
            'id',
            'fullName',
            'email',
            'phone',
            'avatar',
            'dateOfBirth',
            'gender',
            'address',
            'city',
            'state',
            'pincode',
            'location',
            'isActive',
            'isEmailVerified',
            'isPhoneVerified',
            'isProfileComplete',
            'registrationStep',
            'totalSpent',
            'currentDiscountTier',
            'referralCode',
            'referredBy',
            'createdAt',
            'updatedAt',
          ],
          include: [
            {
              model: DiscountCard,
              as: 'discountCard',
              attributes: ['cardNumber', 'isActive', 'expiresAt'],
            },
          ],
        });
      }

      // Build base WHERE conditions
      let baseConditions = `isActive = true AND status = 'approved'`;

      // Add search conditions
      if (search) {
        baseConditions += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%' OR category LIKE '%${search}%' OR tags LIKE '%${search}%')`;
      }

      // Add category filter
      if (category) {
        baseConditions += ` AND category = '${category}'`;
      }

      if (location) {
        // Split location by comma and search for each part
        const locationParts = location.split(',').map((part) => part.trim());
        const locationConditions = [];

        // Add condition for full location match
        locationConditions.push(
          `(location LIKE '%${location}%' OR address LIKE '%${location}%')`
        );

        // Add conditions for each part of the location
        locationParts.forEach((part) => {
          if (part.length > 0) {
            locationConditions.push(
              `(location LIKE '%${part}%' OR address LIKE '%${part}%')`
            );
          }
        });

        baseConditions += ` AND (${locationConditions.join(' OR ')})`;
      }

      let shops = [];
      let totalCount = 0;

      if (latitude && longitude) {
        const combinedQuery = `
          SELECT * FROM (
            -- Shops with coordinates (calculate distance)
            SELECT 
              id, name, description, category, location, address, latitude, longitude,
              phone, email, website, discountOffered, averageRating, featuredImage,
              amenities, openingHours, tags, isActive, createdAt,
              (6371 * acos(
                cos(radians(${latitude})) * 
                cos(radians(COALESCE(latitude, 0))) * 
                cos(radians(COALESCE(longitude, 0)) - radians(${longitude})) + 
                sin(radians(${latitude})) * 
                sin(radians(COALESCE(latitude, 0)))
              )) AS distance,
              'with_coords' as shop_type
            FROM shops 
            WHERE ${baseConditions} 
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND latitude != 0 
            AND longitude != 0
            HAVING distance <= ${maxDistance}
            
            UNION ALL
            
            -- Shops without coordinates but matching location text
            SELECT 
              id, name, description, category, location, address, latitude, longitude,
              phone, email, website, discountOffered, averageRating, featuredImage,
              amenities, openingHours, tags, isActive, createdAt,
              999999 AS distance,  -- Set high distance for shops without coords
              'without_coords' as shop_type
            FROM shops 
            WHERE ${baseConditions}
            AND (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)
          ) combined_results
          ORDER BY 
            CASE 
              WHEN shop_type = 'with_coords' THEN distance 
              ELSE ${sortBy === 'name' ? 'name' : sortBy === 'discount' ? 'discountOffered' : sortBy === 'rating' ? 'averageRating' : 'name'}
            END ${sortOrder}
          LIMIT ${limit} OFFSET ${offset}
        `;

        const countQuery = `
          SELECT COUNT(*) as total FROM (
            -- Count shops with coordinates within distance
            SELECT id
            FROM shops 
            WHERE ${baseConditions} 
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND latitude != 0 
            AND longitude != 0
            AND (6371 * acos(
              cos(radians(${latitude})) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(latitude))
            )) <= ${maxDistance}
            
            UNION ALL
            
            -- Count shops without coordinates but matching location
            SELECT id
            FROM shops 
            WHERE ${baseConditions}
            AND (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)
          ) as total_shops
        `;

        // Execute queries
        const [shopResults] = await sequelize.query(combinedQuery);
        const [countResults] = await sequelize.query(countQuery);

        shops = shopResults;
        totalCount = countResults[0]?.total || 0;
      } else {
        const regularQuery = `
          SELECT 
            id, name, description, category, location, address, latitude, longitude,
            phone, email, website, discountOffered, averageRating, featuredImage,
            amenities, openingHours, tags, isActive, createdAt,
            NULL as distance
          FROM shops 
          WHERE ${baseConditions}
          ORDER BY ${sortBy === 'discount' ? 'discountOffered' : sortBy === 'rating' ? 'averageRating' : sortBy} ${sortOrder}
          LIMIT ${limit} OFFSET ${offset}
        `;
        c;
        const countQuery = `
          SELECT COUNT(*) as total
          FROM shops 
          WHERE ${baseConditions}
        `;

        const [shopResults] = await sequelize.query(regularQuery);
        const [countResults] = await sequelize.query(countQuery);

        shops = shopResults;
        totalCount = countResults[0]?.total || 0;
      }

      // Format results for frontend
      const formattedShops = shops.map((shopData) => {
        // Calculate user-specific discount
        let userDiscount = shopData.discountOffered || 0;
        let discountSource = 'shop';

        if (user && user.discountCard && user.discountCard.isActive) {
          // Define tier discounts based on user's current tier
          const tierDiscounts = {
            Bronze: 5,
            Silver: 10,
            Gold: 15,
            Platinum: 20,
          };

          const tierDiscount = tierDiscounts[user.currentDiscountTier] || 0;

          if (tierDiscount > userDiscount) {
            userDiscount = tierDiscount;
            discountSource = 'tier';
          }
        }

        // Format distance - handle shops without coordinates
        let distance = null;
        if (
          shopData.distance !== null &&
          shopData.distance !== undefined &&
          shopData.distance !== 999999
        ) {
          distance = parseFloat(shopData.distance).toFixed(1);
        }

        // Parse amenities array
        let amenities = [];
        try {
          amenities = shopData.amenities ? JSON.parse(shopData.amenities) : [];
        } catch (e) {
          amenities = [];
        }

        // Parse opening hours
        let openingHours = {};
        try {
          openingHours = shopData.openingHours
            ? JSON.parse(shopData.openingHours)
            : {};
        } catch (e) {
          openingHours = {};
        }

        // Parse tags
        const tags = shopData.tags
          ? shopData.tags.split(',').map((tag) => tag.trim())
          : [];

        return {
          id: shopData.id,
          name: shopData.name,
          description: shopData.description,
          category: shopData.category,
          location: {
            address: shopData.address,
            location: shopData.location,
            coordinates: {
              latitude: shopData.latitude,
              longitude: shopData.longitude,
            },
            distance: distance ? `${distance} km` : 'Location match',
          },
          contact: {
            phone: shopData.phone,
            email: shopData.email,
            website: shopData.website,
          },
          discount: {
            percentage: userDiscount,
            source: discountSource,
            tierBased: discountSource === 'tier',
          },
          rating: {
            average: shopData.averageRating || 0,
          },
          images: {
            featured: shopData.featuredImage,
          },
          amenities,
          openingHours,
          tags,
          isOpen: isShopCurrentlyOpen(openingHours),
          badges: getShopBadges(shopData),
        };
      });

      // Calculate search metadata
      const searchMetadata = {
        totalResults: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
        searchParams: {
          search,
          category,
          location,
          coordinates: latitude && longitude ? { latitude, longitude } : null,
          maxDistance,
          sortBy,
          sortOrder,
        },
        userLocation: latitude && longitude ? { latitude, longitude } : null,
        note:
          latitude && longitude
            ? 'Results include both distance-based and location text matches'
            : 'Results based on text search only',
      };

      const pagination = getPaginationData(page, limit, totalCount);

      res.json(
        ApiResponse.paginated(
          formattedShops,
          pagination,
          'Shops retrieved successfully',
          searchMetadata
        )
      );
    } catch (error) {
      logger.error('Shop search error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // ========================================
  // ADMIN USER MANAGEMENT METHODS
  // ========================================

  static async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await user.update({ password: newPassword });

      logger.info(`User password reset by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'Password reset successfully'));
    } catch (error) {
      logger.error('Reset user password error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async updateUserCard(req, res) {
    try {
      const { id } = req.params;
      const { expiryDate, isActive } = req.body;

      const user = await User.findByPk(id, {
        include: [{ model: DiscountCard, as: 'discountCard' }],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      if (!user.discountCard) {
        return res
          .status(404)
          .json(ApiResponse.error('User has no discount card', 404));
      }

      const updateData = {};
      if (expiryDate) updateData.expiryDate = expiryDate;
      if (isActive !== undefined) updateData.isActive = isActive;

      await user.discountCard.update(updateData);

      logger.info(`User card updated by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'Card details updated successfully'));
    } catch (error) {
      logger.error('Update user card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async generateUserCard(req, res) {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Generate new card
      const cardNumber = Helpers.generateCardNumber();
      const qrCode = Helpers.generateQRCodeData(cardNumber, user.id);

      const discountCard = await DiscountCard.create({
        userId: user.id,
        cardNumber,
        expiryDate: new Date(expiryDate),
        qrCode,
        isActive: true,
      });

      logger.info(`New discount card generated for user: ${user.email}`);

      res
        .status(201)
        .json(
          ApiResponse.success(
            discountCard,
            'Discount card generated successfully'
          )
        );
    } catch (error) {
      logger.error('Generate user card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async sendEmailToUser(req, res) {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await EmailService.sendUserNotification(user, subject, message);

      logger.info(
        `Email sent to user by admin: ${user.email}, Subject: ${subject}`
      );

      res.json(ApiResponse.success(null, 'Email sent successfully'));
    } catch (error) {
      logger.error('Send email to user error:', error);
      res.status(500).json(ApiResponse.error('Failed to send email', 500));
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      await user.destroy();

      logger.info(`User deleted by admin: ${user.email}`);

      res.json(ApiResponse.success(null, 'User deleted successfully'));
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async getUserStats(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const verifiedUsers = await User.count({
        where: {
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });

      const tierDistribution = await User.findAll({
        attributes: [
          'currentDiscountTier',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['currentDiscountTier'],
        raw: true,
      });

      const recentRegistrations = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        recentRegistrations,
        tierDistribution: tierDistribution.reduce((acc, tier) => {
          acc[tier.currentDiscountTier] = parseInt(tier.count);
          return acc;
        }, {}),
      };

      res.json(
        ApiResponse.success(stats, 'User statistics retrieved successfully')
      );
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async exportUsers(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const users = await User.findAll({
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: ['cardNumber', 'expiryDate', 'isActive'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const exportData = users.map((user) => ({
        'User ID': user.id,
        'Full Name': user.fullName,
        Email: user.email,
        Phone: user.phone,
        Tier: user.currentDiscountTier,
        'Total Spent': user.totalSpent,
        Active: user.isActive ? 'Yes' : 'No',
        'Email Verified': user.isEmailVerified ? 'Yes' : 'No',
        'Phone Verified': user.isPhoneVerified ? 'Yes' : 'No',
        'Card Number': user.discountCard?.cardNumber || 'N/A',
        'Card Active': user.discountCard?.isActive ? 'Yes' : 'No',
        'Registration Date': user.createdAt.toISOString().split('T')[0],
      }));

      if (format === 'csv') {
        const csv = Helpers.generateCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
      } else {
        res.json(
          ApiResponse.success(exportData, 'Users data exported successfully')
        );
      }
    } catch (error) {
      logger.error('Export users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async bulkUpdateUsers(req, res) {
    try {
      const { userIds, action, data } = req.body;

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
      });

      if (users.length === 0) {
        return res.status(404).json(ApiResponse.error('No users found', 404));
      }

      let updateData = {};

      switch (action) {
        case 'activate':
          updateData.isActive = true;
          break;
        case 'deactivate':
          updateData.isActive = false;
          break;
        case 'update_tier':
          if (data && data.tier) {
            updateData.currentDiscountTier = data.tier;
          }
          break;
        case 'delete':
          await User.destroy({ where: { id: { [Op.in]: userIds } } });
          logger.info(`Bulk delete performed on ${userIds.length} users`);
          return res.json(
            ApiResponse.success(
              null,
              `${userIds.length} users deleted successfully`
            )
          );
        default:
          return res
            .status(400)
            .json(ApiResponse.error('Invalid bulk action', 400));
      }

      await User.update(updateData, {
        where: { id: { [Op.in]: userIds } },
      });

      logger.info(`Bulk ${action} performed on ${userIds.length} users`);

      res.json(
        ApiResponse.success(
          null,
          `${userIds.length} users updated successfully`
        )
      );
    } catch (error) {
      logger.error('Bulk update users error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async getUserDiscountStatus(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: [
              'cardNumber',
              'expiresAt',
              'isActive',
              'qrCode',
              'createdAt',
            ],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'email',
          'currentDiscountTier',
          'totalSpent',
          'createdAt',
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Calculate tier benefits
      const tierBenefits = Helpers.getTierBenefits(user.currentDiscountTier);
      const nextTierInfo = Helpers.getNextTierInfo(
        user.currentDiscountTier,
        user.totalSpent
      );

      const discountStatus = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          memberSince: user.createdAt,
        },
        currentTier: {
          tier: user.currentDiscountTier,
          discountPercentage: tierBenefits.discountPercentage,
          benefits: tierBenefits.benefits,
          totalSpent: user.totalSpent,
        },
        nextTier: nextTierInfo,
        discountCard: user.discountCard
          ? {
              cardNumber: user.discountCard.cardNumber,
              isActive: user.discountCard.isActive,
              expiresAt: user.discountCard.expiresAt,
              daysUntilExpiry: Math.ceil(
                (new Date(user.discountCard.expiresAt) - new Date()) /
                  (1000 * 60 * 60 * 24)
              ),
              qrCode: user.discountCard.qrCode,
            }
          : null,
      };

      res.json(
        ApiResponse.success(
          discountStatus,
          'Discount status retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount status error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async getUserDiscountHistory(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      const whereClause = { userId: id };

      // Add date filters if provided
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'name', 'location', 'category'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

      // Calculate discount statistics
      const totalDiscountSaved = transactions.reduce((sum, transaction) => {
        return sum + (transaction.discountAmount || 0);
      }, 0);

      const averageDiscountPerTransaction =
        transactions.length > 0 ? totalDiscountSaved / transactions.length : 0;

      const discountHistory = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          currentTier: user.currentDiscountTier,
        },
        summary: {
          totalTransactions: count,
          totalDiscountSaved: parseFloat(totalDiscountSaved.toFixed(2)),
          averageDiscountPerTransaction: parseFloat(
            averageDiscountPerTransaction.toFixed(2)
          ),
          totalSpent: user.totalSpent,
        },
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          amount: transaction.amount,
          discountAmount: transaction.discountAmount || 0,
          discountPercentage: transaction.discountPercentage || 0,
          finalAmount: transaction.finalAmount,
          shop: transaction.shop,
          date: transaction.createdAt,
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
        })),
        pagination: Helpers.getPaginationData(page, limit, count),
      };

      res.json(
        ApiResponse.success(
          discountHistory,
          'Discount history retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount history error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async getUserDiscountAnalytics(req, res) {
    try {
      const { id } = req.params;
      const period = req.query.period || '6months'; // 1month, 3months, 6months, 1year

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Get transactions within the period
      const transactions = await Transaction.findAll({
        where: {
          userId: id,
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        include: [
          {
            model: Shop,
            as: 'shop',
            attributes: ['name', 'category'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      // Monthly breakdown
      const monthlyData = {};
      transactions.forEach((transaction) => {
        const monthKey = transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            totalSpent: 0,
            totalDiscount: 0,
            transactionCount: 0,
          };
        }
        monthlyData[monthKey].totalSpent += transaction.amount;
        monthlyData[monthKey].totalDiscount += transaction.discountAmount || 0;
        monthlyData[monthKey].transactionCount += 1;
      });

      // Shop category breakdown
      const categoryBreakdown = {};
      transactions.forEach((transaction) => {
        const category = transaction.shop?.category || 'Other';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            category,
            totalSpent: 0,
            totalDiscount: 0,
            transactionCount: 0,
          };
        }
        categoryBreakdown[category].totalSpent += transaction.amount;
        categoryBreakdown[category].totalDiscount +=
          transaction.discountAmount || 0;
        categoryBreakdown[category].transactionCount += 1;
      });

      const analytics = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          currentTier: user.currentDiscountTier,
        },
        period: {
          startDate,
          endDate,
          period,
        },
        overallStats: {
          totalTransactions: transactions.length,
          totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
          totalDiscountSaved: transactions.reduce(
            (sum, t) => sum + (t.discountAmount || 0),
            0
          ),
          averageTransactionValue:
            transactions.length > 0
              ? transactions.reduce((sum, t) => sum + t.amount, 0) /
                transactions.length
              : 0,
          averageDiscountPerTransaction:
            transactions.length > 0
              ? transactions.reduce(
                  (sum, t) => sum + (t.discountAmount || 0),
                  0
                ) / transactions.length
              : 0,
        },
        monthlyBreakdown: Object.values(monthlyData),
        categoryBreakdown: Object.values(categoryBreakdown),
        tierProgression: await this.getUserTierProgression(id),
      };

      res.json(
        ApiResponse.success(
          analytics,
          'Discount analytics retrieved successfully'
        )
      );
    } catch (error) {
      logger.error('Get user discount analytics error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  static async getDiscountSummary(req, res) {
    try {
      const period = req.query.period || '1month';

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '1week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get discount statistics
      const totalDiscountGiven =
        (await Transaction.sum('discountAmount', {
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
            discountAmount: {
              [Op.gt]: 0,
            },
          },
        })) || 0;

      const totalTransactionsWithDiscount = await Transaction.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          discountAmount: {
            [Op.gt]: 0,
          },
        },
      });

      const totalTransactions = await Transaction.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Tier distribution with discount usage
      const tierStats = await User.findAll({
        attributes: [
          'currentDiscountTier',
          [sequelize.fn('COUNT', sequelize.col('User.id')), 'userCount'],
          [
            sequelize.fn(
              'SUM',
              sequelize.fn(
                'COALESCE',
                sequelize.col('transactions.discountAmount'),
                0
              )
            ),
            'totalDiscountUsed',
          ],
        ],
        include: [
          {
            model: Transaction,
            as: 'transactions',
            attributes: [],
            where: {
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            },
            required: false,
          },
        ],
        group: ['currentDiscountTier'],
        raw: true,
      });

      const summary = {
        period: {
          startDate,
          endDate,
          period,
        },
        overallStats: {
          totalDiscountGiven: parseFloat(totalDiscountGiven.toFixed(2)),
          totalTransactionsWithDiscount,
          totalTransactions,
          discountUtilizationRate:
            totalTransactions > 0
              ? parseFloat(
                  (
                    (totalTransactionsWithDiscount / totalTransactions) *
                    100
                  ).toFixed(2)
                )
              : 0,
          averageDiscountPerTransaction:
            totalTransactionsWithDiscount > 0
              ? parseFloat(
                  (totalDiscountGiven / totalTransactionsWithDiscount).toFixed(
                    2
                  )
                )
              : 0,
        },
        tierBreakdown: tierStats.map((stat) => ({
          tier: stat.currentDiscountTier,
          userCount: parseInt(stat.userCount),
          totalDiscountUsed: parseFloat(
            (stat.totalDiscountUsed || 0).toFixed(2)
          ),
        })),
      };

      res.json(
        ApiResponse.success(summary, 'Discount summary retrieved successfully')
      );
    } catch (error) {
      logger.error('Get discount summary error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  // Helper function to get user tier progression
  static async getUserTierProgression(userId) {
    try {
      // This would ideally come from a tier_history table if you track tier changes
      // For now, we'll return current tier info
      const user = await User.findByPk(userId, {
        attributes: ['currentDiscountTier', 'totalSpent', 'createdAt'],
      });

      if (!user) return null;

      return {
        currentTier: user.currentDiscountTier,
        totalSpent: user.totalSpent,
        memberSince: user.createdAt,
        // Add tier change history if you implement tier tracking
      };
    } catch (error) {
      logger.error('Get user tier progression error:', error);
      return null;
    }
  }

  // Add this method to your UserController class

  /**
   * Get user OTP send history
   * GET /api/users/otp/history
   */
 static async getOtpHistory(req, res) {
  try {
    const adminId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const purpose = req.query.purpose; // Filter by purpose if provided

    if (!adminId) {
      return res
        .status(401)
        .json(ApiResponse.error('Admin not authenticated', 401));
    }

    // Fetch admin details from Admin table using adminId
    const admin = await Admin.findByPk(adminId, {
      attributes: ['email', 'phone'],
    });

    if (!admin) {
      return res
        .status(404)
        .json(ApiResponse.error('Admin not found', 404));
    }

    // Use email or phone from the admin record to find user
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: admin.email },
          { phone: admin.phone }
        ],
      },
      attributes: ['id'],
    });

    if (!user) {
      return res
        .status(404)
        .json(ApiResponse.error('User not found with admin\'s contact info', 404));
    }

    const userId = user.id;

    // Build where clause for OTP history
    const whereClause = { userId };
    if (purpose) {
      whereClause.purpose = purpose;
    }

    // Get OTP history with pagination
    const { count, rows: otpSessions } = await OTPSession.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'sessionId',
        'otpType',
        'contactInfo',
        'purpose',
        'isVerified',
        'created_at',
        'expires_at',
        'verified_at',
        'resendCount',
        'ipAddress',
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    // Format the OTP history data
    const formattedHistory = otpSessions.map((session) => ({
      id: session.id,
      sessionId: session.sessionId,
      purpose: session.purpose,
      type: session.otpType, // 'email' or 'sms'
      contactInfo: session.contactInfo,
      status: session.isVerified
        ? 'verified'
        : new Date() > new Date(session.expires_at)
          ? 'expired'
          : 'pending',
      sentAt: session.created_at,
      expiresAt: session.expires_at,
      verifiedAt: session.verified_at,
      resendCount: session.resendCount || 0,
      ipAddress: session.ipAddress,
    }));

    // Group by purpose for summary
    const purposeSummary = otpSessions.reduce((acc, session) => {
      const purpose = session.purpose;
      if (!acc[purpose]) {
        acc[purpose] = {
          total: 0,
          verified: 0,
          expired: 0,
          pending: 0,
        };
      }
      acc[purpose].total++;

      if (session.is_verified) {
        acc[purpose].verified++;
      } else if (new Date() > new Date(session.expires_at)) {
        acc[purpose].expired++;
      } else {
        acc[purpose].pending++;
      }

      return acc;
    }, {});

    const pagination = Helpers.getPaginationData(page, limit, count);

    const responseData = {
      history: formattedHistory,
      summary: {
        totalSent: count,
        recentActivity: formattedHistory.slice(0, 5), // Last 5 OTPs
        purposeBreakdown: purposeSummary,
      },
      pagination,
    };

    res.json(
      ApiResponse.paginated(
        formattedHistory,
        pagination,
        'OTP history retrieved successfully',
        responseData.summary
      )
    );
  } catch (error) {
    logger.error('Get OTP history error:', error);
    res.status(500).json(ApiResponse.error('Internal server error', 500));
  }
}


  /**
   * Get user card details with full information
   * GET /api/users/card/details
   */
  static async getCardDetails(req, res) {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        return res
          .status(401)
          .json(ApiResponse.error('User not authenticated', 401));
      }

      // Get the logged-in admin
      const admin = await Admin.findByPk(adminId);

      if (!admin) {
        return res.status(404).json(ApiResponse.error('Admin not found', 404));
      }

      // Find user by email or phone from the Admin record
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: admin.email }, { phone: admin.phone }],
        },
        include: [
          {
            model: DiscountCard,
            as: 'discountCard',
            attributes: [
              'id',
              'cardNumber',
              'expiresAt',
              'isActive',
              'qrCode',
              'createdAt',
              'updatedAt',
            ],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'email',
          'phone',
          'currentDiscountTier',
          'totalSpent',
          'isActive',
          'isEmailVerified',
          'isPhoneVerified',
          'isProfileComplete',
          'createdAt',
        ],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      // Determine card status
      let cardStatus = 'inactive';
      let daysRemaining = 0;
      let isExpired = false;

      if (user.discountCard && user.discountCard.isActive) {
        const expiryDate = new Date(user.discountCard.expiresAt);
        const currentDate = new Date();

        if (expiryDate > currentDate) {
          cardStatus = 'active';
          daysRemaining = Math.ceil(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );
        } else {
          cardStatus = 'expired';
          isExpired = true;
        }
      }

      // Count recent OTP sessions (last 30 days)
      const recentTransactionsCount = await OTPSession.count({
        where: {
          userId: user.id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      });

      const cardDetails = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          memberSince: user.createdAt,
        },
        card: user.discountCard
          ? {
              id: user.discountCard.id,
              cardNumber: user.discountCard.cardNumber,
              status: cardStatus,
              isActive: user.discountCard.isActive,
              isExpired,
              expiresAt: user.discountCard.expiresAt,
              daysRemaining,
              qrCode: user.discountCard.qrCode,
              createdAt: user.discountCard.createdAt,
            }
          : null,
        activity: {
          recentTransactions: recentTransactionsCount,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isProfileComplete: user.isProfileComplete,
        },
      };

      res.json(
        ApiResponse.success(cardDetails, 'Card details retrieved successfully')
      );
    } catch (error) {
      logger.error('Get card details error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Activate user card
   * POST /api/users/card/activate
   */
  static async activateCard(req, res) {
    try {
      const userId = req.user?.id || req.admin?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(ApiResponse.error('User not authenticated', 401));
      }

      const user = await User.findByPk(userId, {
        include: [{ model: DiscountCard, as: 'discountCard' }],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      if (!user.discountCard) {
        return res
          .status(404)
          .json(ApiResponse.error('No card found for user', 404));
      }

      if (user.discountCard.isActive) {
        return res
          .status(400)
          .json(ApiResponse.error('Card is already active', 400));
      }

      // Activate the card
      await user.discountCard.update({
        isActive: true,
        updatedAt: new Date(),
      });

      // Update user card status
      await user.update({
        cardStatus: 'active',
        cardActivatedAt: new Date(),
      });

      logger.info(`Card activated for user ${userId}`);

      res.json(
        ApiResponse.success(
          {
            cardNumber: user.discountCard.cardNumber,
            isActive: true,
            activatedAt: new Date(),
          },
          'Card activated successfully'
        )
      );
    } catch (error) {
      logger.error('Activate card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Renew user card
   * POST /api/users/card/renew
   */
  static async renewCard(req, res) {
    try {
      const userId = req.user?.id || req.admin?.userId;
      const { months = 1 } = req.body; // Default to 1 months renewal

      if (!userId) {
        return res
          .status(401)
          .json(ApiResponse.error('User not authenticated', 401));
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['createdBy'] },
        include: [{ model: DiscountCard, as: 'discountCard' }],
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }

      if (!user.discountCard) {
        return res
          .status(404)
          .json(ApiResponse.error('No card found for user', 404));
      }

      // Calculate new expiry date
      const currentExpiryDate = new Date(user.discountCard.expiresAt);
      const currentDate = new Date();

      // If card is still valid, extend from current expiry date, otherwise from current date
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

      logger.info(
        `Card renewed for user ${userId}, new expiry: ${newExpiryDate}`
      );

      res.json(
        ApiResponse.success(
          {
            cardNumber: user.discountCard.cardNumber,
            previousExpiryDate: currentExpiryDate,
            newExpiryDate: newExpiryDate,
            monthsExtended: months,
            isActive: true,
          },
          'Card renewed successfully'
        )
      );
    } catch (error) {
      logger.error('Renew card error:', error);
      res.status(500).json(ApiResponse.error('Internal server error', 500));
    }
  }

  /**
   * Subscribe to newsletter
   * POST /api/users/newsletter/subscribe
   */
  static async subscribeToNewsletter(req, res) {
    try {
      const { email } = req.body;

      // Validate email
      if (!email || !email.includes('@')) {
        return res
          .status(400)
          .json(ApiResponse.error('Please provide a valid email address', 400));
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists in users table
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        attributes: ['id', 'email', 'fullName', 'isActive'],
      });

      // Prepare email content
      const emailContent = UserController.generateNewsletterWelcomeEmail(
        normalizedEmail,
        existingUser?.fullName || null
      );

      // Send welcome email
      await EmailService.sendEmail(
        normalizedEmail,
        emailContent.subject,
        emailContent.html
      );

      // Log subscription
      logger.info(`Newsletter subscription: ${normalizedEmail}`);

      // If you want to store newsletter subscriptions separately,
      // you can create a NewsletterSubscription model and save it here
      // await NewsletterSubscription.create({
      //   email: normalizedEmail,
      //   isActive: true,
      //   subscribedAt: new Date(),
      //   source: 'footer_form'
      // });

      const responseMessage = existingUser
        ? 'Thank you for subscribing! Welcome back to Pravasi Privilege updates.'
        : 'Thank you for subscribing! Welcome to Pravasi Privilege updates.';

      res.status(200).json(
        ApiResponse.success(
          {
            email: normalizedEmail,
            subscribed: true,
            isExistingUser: !!existingUser,
          },
          responseMessage
        )
      );
    } catch (error) {
      logger.error('Newsletter subscription error:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Failed to subscribe. Please try again later.', 500)
        );
    }
  }

  /**
   * Generate newsletter welcome email content
   */
  static generateNewsletterWelcomeEmail(email, userName) {
    const displayName = userName || 'Valued Customer';

    return {
      subject: 'Welcome to Pravasi Privilege - Subscription Confirmed!',
      html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #222158 0%, #0066B5 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Pravasi Privilege Card
          </h1>
          <p style="color: #AFDCFF; margin: 10px 0 0 0; font-size: 16px;">
            Your Gateway to Exclusive Discounts
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #222158; margin: 0 0 20px 0; font-size: 24px;">
            Welcome ${displayName}! 🎉
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for subscribing to Pravasi Privilege updates! You're now part of our exclusive community.
          </p>

          <div style="background: #f8f9ff; border-left: 4px solid #0066B5; padding: 20px; margin: 25px 0;">
            <h3 style="color: #222158; margin: 0 0 15px 0; font-size: 18px;">
              What's Next?
            </h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Get notified about new partner shops and exclusive discounts</li>
              <li style="margin-bottom: 8px;">Receive updates about special offers and promotions</li>
              <li style="margin-bottom: 8px;">Be the first to know about new features and benefits</li>
              <li style="margin-bottom: 8px;">Access member-only deals and early bird offers</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://pravasiprevilagecard.com'}" 
               style="display: inline-block; background: #222158; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Visit Our Website
            </a>
          </div>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you don't have a Pravasi Privilege Card yet, 
            <a href="${process.env.FRONTEND_URL || 'https://pravasiprevilagecard.com'}/signup" 
               style="color: #0066B5; text-decoration: none; font-weight: bold;">
              sign up today
            </a> 
            to start enjoying exclusive discounts at hundreds of partner locations!
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">
            You're receiving this email because you subscribed to Pravasi Privilege updates.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Pravasi Privilege Card. All rights reserved.
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            <a href="#" style="color: #999; text-decoration: none;">Unsubscribe</a> | 
            <a href="#" style="color: #999; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    `,
    };
  }
}

module.exports = UserController;
