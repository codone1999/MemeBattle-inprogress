const { transporter, emailFrom } = require('../config/email');

class EmailService {
  /**
   * Send email verification email
   * param {string} email - Recipient email
   * param {string} displayName - User's display name
   * param {string} token - Verification token
   * returns {Promise<Object>} - Email send result
   */
  async sendVerificationEmail(email, displayName, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Verify Your Email - Queen\'s Blood Card Game',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 10px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #764ba2;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #888;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 style="color: #667eea;">Welcome to Queen's Blood! 🃏</h1>
              <p>Hi <strong>${displayName}</strong>,</p>
              <p>Thank you for registering! We're excited to have you join our card game community.</p>
              <p>Please verify your email address to complete your registration and start playing:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
              <p>Happy gaming!</p>
              <p>The Queen's Blood Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', info.messageId);
      
      // For development with ethereal email
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log('📧 Preview URL:', require('nodemailer').getTestMessageUrl(info));
      }
      
      return info;
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send welcome email (after verification)
   * param {string} email - Recipient email
   * param {string} displayName - User's display name
   * returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail(email, displayName) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Welcome to Queen\'s Blood - Your Starter Pack Awaits! 🎁',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 10px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .starter-pack {
              background: #f7f7f7;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 style="color: #667eea;">🎉 Email Verified!</h1>
              <p>Hi <strong>${displayName}</strong>,</p>
              <p>Your email has been successfully verified. Welcome to the Queen's Blood community!</p>
              
              <div class="starter-pack">
                <h2 style="color: #764ba2;">Your Starter Pack:</h2>
                <ul>
                  <li>✨ 1 Common Character with unique abilities</li>
                  <li>🃏 20 Cards (15 Common + 5 Rare)</li>
                </ul>
              </div>

              <p>You're all set to start your journey! Build your deck, challenge opponents, and climb the ranks.</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Start Playing Now</a>
              </div>

              <p>Good luck, and may the best strategist win!</p>
              <p>The Queen's Blood Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      // Don't throw error - welcome email is not critical
    }
  }

  /**
   * Resend verification email
   * param {string} email - Recipient email
   * param {string} displayName - User's display name
   * param {string} token - New verification token
   * returns {Promise<Object>} - Email send result
   */
  async resendVerificationEmail(email, displayName, token) {
    return await this.sendVerificationEmail(email, displayName, token);
  }
}

module.exports = EmailService;