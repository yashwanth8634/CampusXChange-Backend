const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 * Sends OTP verification emails
 */

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

/**
 * Send OTP via email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code
 * @param {string} name - User's name
 * @returns {Promise<Object>} - { success, messageId? }
 */
const sendOTP = async (email, otp, name = 'User') => {
  try {
    // If no email credentials configured, log to console
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log('\n========================================');
      console.log('📧 EMAIL OTP VERIFICATION CODE');
      console.log(`Email: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`OTP: ${otp}`);
      console.log('Valid for: 10 minutes');
      console.log('========================================\n');
      return { success: true, development: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'CampusXChange',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Account - CampusXChange',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 CampusXChange</h1>
              <p>Campus Resource Sharing Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with CampusXChange. To complete your registration, please verify your email address.</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
                <div class="otp">${otp}</div>
              </div>

              <p><strong>This code will expire in 10 minutes.</strong></p>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">Never share this code with anyone. CampusXChange will never ask for your OTP via phone or chat.</p>
              </div>

              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CampusXChange. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    
    // Fallback to console logging
    console.log('\n========================================');
    console.log('📧 EMAIL OTP (Fallback - Email Failed)');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after verification
 * @param {string} email - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return { success: true, development: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'CampusXChange',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to CampusXChange! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
              <h1>🎓 Welcome to CampusXChange!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; margin-top: -10px; border-radius: 0 0 10px 10px;">
              <h2>Hi ${name}!</h2>
              <p>Welcome to CampusXChange - your campus resource sharing platform! 🎉</p>
              
              <h3>What can you do?</h3>
              <ul>
                <li>📚 Buy and sell books, electronics, and more</li>
                <li>🔍 Request items you need from fellow students</li>
                <li>💬 Chat directly with sellers</li>
                <li>🏆 Build trust within your campus community</li>
              </ul>

              <p>Start exploring and connecting with your campus community!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666;">Happy sharing! 🚀</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
              <p>© ${new Date().getFullYear()} CampusXChange. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTP,
  sendWelcomeEmail
};
