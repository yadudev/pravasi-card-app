const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const OTPSession = sequelize.define(
    'OTPSession',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'user_id',
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4(),
        field: 'session_id',
      },
      otpCode: {
        type: DataTypes.STRING(6),
        allowNull: false,
        validate: {
          isNumeric: true,
          len: [4, 6],
        },
        field: 'otp_code',
      },
      otpType: {
        type: DataTypes.ENUM('email', 'sms'),
        allowNull: false,
        field: 'otp_type',
      },
      contactInfo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        field: 'contact_info',
      },
      purpose: {
        type: DataTypes.ENUM(
          'card_activation',
          'email_verification',
          'phone_verification',
          'password_reset',
          'account_verification'
        ),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
        validate: {
          isDate: true,
        },
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
      },
      verificationAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 10,
        },
        field: 'verification_attempts',
      },
      maxAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        validate: {
          min: 1,
          max: 10,
        },
        field: 'max_attempts',
      },
      resendCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 10,
        },
        field: 'resend_count',
      },
      maxResends: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        validate: {
          min: 1,
          max: 10,
        },
        field: 'max_resends',
      },
      lastResentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_resent_at',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verified_at',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        validate: {
          isIP: true,
        },
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
    },
    {
      tableName: 'otp_sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // ✅ NEW: ASSOCIATION DEFINITION
  OTPSession.associate = function (models) {
    // OTPSession belongs to User
    OTPSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  // ✅ Static Method to Create Session
  OTPSession.createSession = async function ({
    userId,
    otpCode,
    otpType,
    contactInfo,
    purpose,
    ipAddress,
    userAgent,
  }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity
    return await this.create({
      userId,
      otpCode,
      otpType,
      contactInfo,
      purpose,
      ipAddress,
      userAgent,
      expiresAt,
    });
  };

  // ✅ Static Method to Count OTPs in last X minutes
  OTPSession.countRecentRequests = async function (
    userId,
    contactInfo,
    minutes
  ) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return await this.count({
      where: {
        userId,
        contactInfo,
        created_at: { [sequelize.Sequelize.Op.gt]: since },
      },
    });
  };

  // ✅ Static Method to Count OTPs today
  OTPSession.countDailyRequests = async function (userId, contactInfo) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return await this.count({
      where: {
        userId,
        contactInfo,
        created_at: { [sequelize.Sequelize.Op.gt]: startOfDay },
      },
    });
  };

  // ✅ UPDATED: Enhanced validateOTP with user include option
  OTPSession.validateOTP = async function (
    sessionId,
    otpCode,
    userId,
    includeUser = false
  ) {
    const include = [];
    if (includeUser) {
      include.push({
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'phone', 'isActive'],
      });
    }

    const session = await this.findOne({
      where: {
        sessionId,
        userId,
        isVerified: false,
      },
      include,
    });

    if (!session) {
      throw new Error('OTP session not found or already verified');
    }

    const now = new Date();

    if (session.expiresAt < now) {
      throw new Error('OTP has expired');
    }

    if (session.verificationAttempts >= session.maxAttempts) {
      throw new Error('Maximum verification attempts exceeded');
    }

    if (session.otpCode !== otpCode) {
      await session.increment('verificationAttempts');
      throw new Error('Invalid OTP code');
    }

    // Mark as verified
    session.isVerified = true;
    session.verifiedAt = now;
    await session.save();

    return session;
  };

  // ✅ UPDATED: Enhanced findBySessionId with proper user include
  OTPSession.findBySessionId = async function (
    sessionId,
    otpType = null,
    purpose = null,
    includeUser = false
  ) {
    if (!sessionId) {
      throw new Error('Missing sessionId');
    }

    const whereClause = {
      sessionId,
      isVerified: false,
      expiresAt: {
        [sequelize.Sequelize.Op.gt]: new Date(),
      },
    };

    if (otpType) whereClause.otpType = otpType;
    if (purpose) whereClause.purpose = purpose;

    const include = [];
    if (includeUser) {
      include.push({
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'phone', 'isActive'],
      });
    }

    return await this.findOne({
      where: whereClause,
      include,
    });
  };

  // ✅ NEW: Find all OTP sessions for a user
  OTPSession.findByUserId = async function (userId, options = {}) {
    const {
      limit = 10,
      offset = 0,
      purpose = null,
      otpType = null,
      isVerified = null,
      includeUser = false,
    } = options;

    const whereClause = { userId };
    if (purpose) whereClause.purpose = purpose;
    if (otpType) whereClause.otpType = otpType;
    if (isVerified !== null) whereClause.isVerified = isVerified;

    const include = [];
    if (includeUser) {
      include.push({
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'phone', 'isActive'],
      });
    }

    return await this.findAndCountAll({
      where: whereClause,
      include,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  };

  // ✅ NEW: Get OTP statistics for admin
  OTPSession.getStatistics = async function (dateRange = null) {
    const whereClause = {};

    if (dateRange) {
      if (dateRange.startDate) {
        whereClause.created_at = {
          [sequelize.Sequelize.Op.gte]: dateRange.startDate,
        };
      }
      if (dateRange.endDate) {
        if (whereClause.created_at) {
          whereClause.created_at[sequelize.Sequelize.Op.lte] =
            dateRange.endDate;
        } else {
          whereClause.created_at = {
            [sequelize.Sequelize.Op.lte]: dateRange.endDate,
          };
        }
      }
    }

    const [total, verified, expired, email, sms, cardActivation] =
      await Promise.all([
        this.count({ where: whereClause }),
        this.count({ where: { ...whereClause, isVerified: true } }),
        this.count({
          where: {
            ...whereClause,
            isVerified: false,
            expiresAt: { [sequelize.Sequelize.Op.lt]: new Date() },
          },
        }),
        this.count({ where: { ...whereClause, otpType: 'email' } }),
        this.count({ where: { ...whereClause, otpType: 'sms' } }),
        this.count({ where: { ...whereClause, purpose: 'card_activation' } }),
      ]);

    const pending = total - verified - expired;
    const verificationRate =
      total > 0 ? ((verified / total) * 100).toFixed(2) : 0;

    return {
      total,
      verified,
      expired,
      pending,
      verificationRate,
      typeDistribution: { email, sms },
      purposeDistribution: { cardActivation },
    };
  };

  // ✅ NEW: Clean up expired OTP sessions
  OTPSession.cleanupExpired = async function () {
    const now = new Date();
    const result = await this.destroy({
      where: {
        expiresAt: { [sequelize.Sequelize.Op.lt]: now },
        isVerified: false,
      },
    });
    return result;
  };

  // ✅ NEW: Admin expire session
  OTPSession.expireSession = async function (sessionId) {
    const session = await this.findOne({
      where: { sessionId, isVerified: false },
    });

    if (!session) {
      throw new Error('OTP session not found or already verified');
    }

    session.expiresAt = new Date(); // Set to current time to expire immediately
    await session.save();

    return session;
  };

  // ✅ INSTANCE METHOD: Check if session can be resent
  OTPSession.prototype.canResend = function () {
    const now = new Date();

    if (this.resendCount >= this.maxResends) return false;

    // Rate-limit to 30 seconds between resends
    if (this.lastResentAt) {
      const diff = now - new Date(this.lastResentAt); // in ms
      if (diff < 30 * 1000) return false; // 30 seconds wait
    }

    return true;
  };

  // ✅ INSTANCE METHOD: Update for resend
  OTPSession.prototype.updateForResend = async function (newOtpCode) {
    const now = new Date();
    this.otpCode = newOtpCode;
    this.lastResentAt = now;
    this.resendCount += 1;
    this.expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // extend 5 mins
    return await this.save();
  };

  // ✅ INSTANCE METHOD: Check if session is expired
  OTPSession.prototype.isExpired = function () {
    return new Date() > this.expiresAt;
  };

  // ✅ INSTANCE METHOD: Get time remaining
  OTPSession.prototype.getTimeRemaining = function () {
    const now = new Date();
    const diff = this.expiresAt - now;

    if (diff <= 0) return { expired: true, minutes: 0, seconds: 0 };

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { expired: false, minutes, seconds };
  };

  return OTPSession;
};
