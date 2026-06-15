const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "assigned", "picked_up", "completed"],
      default: "confirmed",
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);