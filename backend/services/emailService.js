const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Create transporter with correct method name
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For development only
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'SmartDiscounts'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  // Strip HTML tags for plain text version
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Generate email template
  generateTemplate(templateName, data) {
    const templates = {
      welcome: this.getWelcomeTemplate(data),
      passwordReset: this.getPasswordResetTemplate(data),
      passwordChange: this.getPasswordChangeTemplate(data),
      passwordResetConfirmation:
        this.getPasswordResetConfirmationTemplate(data),
      shopApproval: this.getShopApprovalTemplate(data),
      shopRejection: this.getShopRejectionTemplate(data),
      userNotification: this.getUserNotificationTemplate(data),
      shopNotification: this.getShopNotificationTemplate(data),
    };

    return templates[templateName] || null;
  }

  // Welcome email template
  getWelcomeTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to SmartDiscounts!</h1>
            <div style="width: 50px; height: 3px; background-color: #3498db; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.fullName}!</h2>
          <p style="color: #555; line-height: 1.6;">Your account has been successfully created and you're now part of the SmartDiscounts family.</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Account Details:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Current Tier:</strong> <span style="color: #e67e22; font-weight: bold;">${data.currentDiscountTier}</span></p>
            <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Your Dashboard</a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">Start shopping with our partner stores and earn amazing discounts based on your spending!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Password reset email template
  getPasswordResetTemplate(data) {
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${data.resetToken}`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin-bottom: 10px;">Password Reset Request</h1>
            <div style="width: 50px; height: 3px; background-color: #e74c3c; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.fullName},</h2>
          <p style="color: #555; line-height: 1.6;">You have requested to reset your password for your SmartDiscounts admin account.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              <strong>Important:</strong><br>
              • This link will expire in 1 hour<br>
              • For security reasons, you can only use this link once<br>
              • If the button doesn't work, copy and paste this link: <br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Password change notification template
  getPasswordChangeTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #27ae60; margin-bottom: 10px;">Password Changed Successfully</h1>
            <div style="width: 50px; height: 3px; background-color: #27ae60; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.fullName},</h2>
          <p style="color: #555; line-height: 1.6;">Your password has been successfully changed for your SmartDiscounts admin account.</p>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>Change Details:</strong><br>
              Date: ${new Date().toLocaleString()}<br>
              IP Address: ${data.ipAddress || 'Not available'}
            </p>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately at 
              <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@smartdiscounts.com'}" style="color: #721c24;">${process.env.SUPPORT_EMAIL || 'support@smartdiscounts.com'}</a>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Password reset confirmation template
  getPasswordResetConfirmationTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #27ae60; margin-bottom: 10px;">Password Reset Successful</h1>
            <div style="width: 50px; height: 3px; background-color: #27ae60; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.fullName},</h2>
          <p style="color: #555; line-height: 1.6;">Your password has been successfully reset and updated.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>✓ Password Reset Complete</strong><br>
              You can now log in to your admin account with your new password.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/admin/login" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to Admin Panel</a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              <strong>Security Tips:</strong><br>
              • Use a strong, unique password<br>
              • Don't share your login credentials<br>
              • Log out when using shared computers<br>
              • Contact support if you notice any suspicious activity
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Shop approval email template
  getShopApprovalTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #27ae60; margin-bottom: 10px;">🎉 Shop Application Approved!</h1>
            <div style="width: 50px; height: 3px; background-color: #27ae60; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Congratulations ${data.ownerName}!</h2>
          <p style="color: #555; line-height: 1.6;">We're excited to inform you that your shop "<strong>${data.shopName}</strong>" has been approved and is now part of the SmartDiscounts network!</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
            <ul style="color: #155724; margin: 10px 0;">
              <li>Log in to your shop dashboard</li>
              <li>Set up your discount schemes</li>
              <li>Start accepting SmartDiscounts customer cards</li>
              <li>Track your sales and analytics</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/shop/login" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Shop Dashboard</a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">Welcome to the SmartDiscounts family! We're here to help you grow your business and attract more customers.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Shop rejection email template
  getShopRejectionTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin-bottom: 10px;">Shop Application Update</h1>
            <div style="width: 50px; height: 3px; background-color: #e74c3c; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.ownerName},</h2>
          <p style="color: #555; line-height: 1.6;">Thank you for your interest in joining the SmartDiscounts network. After reviewing your application for "${data.shopName}", we regret to inform you that we cannot approve it at this time.</p>
          
          ${
            data.rejectionReason
              ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">Reason for Rejection:</h3>
              <p style="margin: 0; color: #721c24;">${data.rejectionReason}</p>
            </div>
          `
              : ''
          }
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #0c5460; margin: 10px 0;">
              <li>Review and address the concerns mentioned above</li>
              <li>Update your shop information and documentation</li>
              <li>Resubmit your application when ready</li>
              <li>Contact our support team if you have questions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/shop/register" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reapply Now</a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">We appreciate your interest and hope to work with you in the future.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@smartdiscounts.com'}" style="color: #3498db;">Contact Support</a>
          </p>
        </div>
      </div>
    `;
  }

  // User notification email template
  getUserNotificationTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3498db; margin-bottom: 10px;">SmartDiscounts Notification</h1>
            <div style="width: 50px; height: 3px; background-color: #3498db; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.fullName},</h2>
          <div style="color: #555; line-height: 1.6; margin: 20px 0;">
            ${data.message}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Shop notification email template
  getShopNotificationTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3498db; margin-bottom: 10px;">SmartDiscounts Partner Notification</h1>
            <div style="width: 50px; height: 3px; background-color: #3498db; margin: 0 auto;"></div>
          </div>
          
          <h2 style="color: #34495e;">Hello ${data.ownerName},</h2>
          <p style="color: #555; margin-bottom: 10px;">Shop: <strong>${data.shopName}</strong></p>
          
          <div style="color: #555; line-height: 1.6; margin: 20px 0;">
            ${data.message}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Best regards,<br>
            The SmartDiscounts Team<br>
            <a href="${process.env.FRONTEND_URL}" style="color: #3498db;">Visit our website</a>
          </p>
        </div>
      </div>
    `;
  }

  // Email sending methods
  async sendWelcomeEmail(user) {
    const template = this.generateTemplate('welcome', user);
    const subject = 'Welcome to SmartDiscounts!';
    return this.sendEmail(user.email, subject, template);
  }

  async sendPasswordResetEmail(admin, resetToken) {
    const data = { ...admin.toJSON(), resetToken };
    const template = this.generateTemplate('passwordReset', data);
    const subject = 'Password Reset - SmartDiscounts Admin';
    return this.sendEmail(admin.email, subject, template);
  }

  async sendPasswordChangeNotification(admin, ipAddress = null) {
    const data = { ...admin.toJSON(), ipAddress };
    const template = this.generateTemplate('passwordChange', data);
    const subject = 'Password Changed - SmartDiscounts Admin';
    return this.sendEmail(admin.email, subject, template);
  }

  async sendPasswordResetConfirmation(admin) {
    const template = this.generateTemplate(
      'passwordResetConfirmation',
      admin.toJSON()
    );
    const subject = 'Password Reset Successful - SmartDiscounts';
    return this.sendEmail(admin.email, subject, template);
  }

  async sendShopApprovalEmail(shop) {
    const template = this.generateTemplate('shopApproval', shop.toJSON());
    const subject = 'Shop Application Approved - SmartDiscounts';
    return this.sendEmail(shop.email, subject, template);
  }

  async sendShopRejectionEmail(shop, rejectionReason = null) {
    const data = { ...shop.toJSON(), rejectionReason };
    const template = this.generateTemplate('shopRejection', data);
    const subject = 'Shop Application Update - SmartDiscounts';
    return this.sendEmail(shop.email, subject, template);
  }

  async sendUserNotification(user, subject, message) {
    const data = { ...user.toJSON(), message };
    const template = this.generateTemplate('userNotification', data);
    return this.sendEmail(user.email, subject, template);
  }

  async sendShopNotification(shop, subject, message) {
    const data = { ...shop.toJSON(), message };
    const template = this.generateTemplate('shopNotification', data);
    return this.sendEmail(shop.email, subject, template);
  }

  // Bulk email sending
  async sendBulkEmails(recipients, subject, template, data = {}) {
    const promises = recipients.map((recipient) => {
      const personalizedData = { ...data, ...recipient };
      const personalizedTemplate = this.generateTemplate(
        template,
        personalizedData
      );
      return this.sendEmail(recipient.email, subject, personalizedTemplate);
    });

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(
        (result) => result.status === 'fulfilled'
      ).length;
      const failed = results.filter(
        (result) => result.status === 'rejected'
      ).length;

      logger.info(
        `Bulk email completed: ${successful} successful, ${failed} failed`
      );
      return { successful, failed, results };
    } catch (error) {
      logger.error('Bulk email error:', error);
      throw error;
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      await this.verifyConnection();

      const testEmail = {
        to: process.env.SMTP_USER,
        subject: 'SmartDiscounts Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Configuration Test</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Time: ${new Date().toISOString()}</li>
              <li>SMTP Host: ${process.env.SMTP_HOST}</li>
              <li>SMTP Port: ${process.env.SMTP_PORT}</li>
              <li>From: ${process.env.SMTP_USER}</li>
            </ul>
            <p>If you received this email, your configuration is working properly!</p>
          </div>
        `,
      };

      const result = await this.sendEmail(
        testEmail.to,
        testEmail.subject,
        testEmail.html
      );
      logger.info('Test email sent successfully');
      return result;
    } catch (error) {
      logger.error('Test email failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
