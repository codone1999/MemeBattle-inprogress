const mongoose = require('mongoose');
const crypto = require('crypto');

const emailVerificationSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(32).toString('hex')
    },
    expiryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes - define ONLY here, not in field definitions
emailVerificationSchema.index({ token: 1 }, { unique: true });
emailVerificationSchema.index({ accountId: 1 });
emailVerificationSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // TTL index

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

module.exports = EmailVerification;