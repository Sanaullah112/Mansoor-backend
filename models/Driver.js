const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    vehicleNo: {
      type: String,
      required: [true, "Vehicle number is required"],
      trim: true,
      uppercase: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);