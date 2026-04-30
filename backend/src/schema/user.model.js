const mongoose = require('mongoose');

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },

    refreshToken: {
      type: String,
      select: false,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    avatarLabel: {
      type: String,
      trim: true,
      maxlength: 2,
      default: '',
    },

    avatarColor: {
      type: String,
      trim: true,
      default: '#4F46E5',
    },

    demoDataFallbackEnabled: {
      type: Boolean,
      default: false,
    },

    // ✅ SCALABLE WALLET STRUCTURE
    wallet: {
      type: Map,
      of: Number,
      default: {
        USDT: 10000,  // Starting demo balance
      },
    },

    reservedWallet: {
      type: Map,
      of: Number,
      default: {
        USDT: 0,
      },
    },

    demoBalanceTopUpTotal: {
      type: Number,
      default: 0,
    },

    dashboardProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', authSchema);
