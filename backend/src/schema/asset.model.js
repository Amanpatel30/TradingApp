const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    baseAsset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quoteAsset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["CRYPTO", "STOCK"],
      default: "CRYPTO",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
