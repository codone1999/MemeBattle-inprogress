import { createTransport, createTransporter as _createTransporter } from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP service)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('📧 Using Ethereal Email for development (emails won\'t be sent)');
    return createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Production SMTP configuration
  return _createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const transporter = createTransporter();

// Verify connection configuration
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.warn('⚠️  Email service not configured:', error.message);
    return false;
  }
};

export default {
  transporter,
  verifyEmailConnection,
  emailFrom: process.env.EMAIL_FROM 
};