const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
// Assuming you have a Donation model. Update path if needed!
const Donation = require("../models/Donation"); 
const { protect } = require("../middleware/auth");

// 1. POST /api/drivers - Register a new driver
router.post("/", protect, async (req, res) => {
  try {
    const { name, phone, vehicleNo } = req.body;

    if (!name || !phone || !vehicleNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const formattedVehicleNo = vehicleNo.trim().toUpperCase();

    // Prevent duplicate vehicle numbers within the same NGO
    const existing = await Driver.findOne({
      vehicleNo: formattedVehicleNo,
      ngoId: req.user._id,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A driver with this vehicle number already exists." });
    }

    const driver = await Driver.create({
      name: name.trim(),
      phone: phone.trim(),
      vehicleNo: formattedVehicleNo,
      ngoId: req.user._id,
    });

    res.status(201).json({ message: "Driver registered successfully.", driver });
  } catch (error) {
    console.error("Register driver error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// 2. GET /api/drivers - Get all drivers for this NGO
router.get("/", protect, async (req, res) => {
  try {
    const drivers = await Driver.find({ ngoId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(drivers);
  } catch (error) {
    console.error("Fetch drivers error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// 3. GET /api/drivers/unassigned-donations - Get donations waiting for assignment
router.get("/unassigned-donations", protect, async (req, res) => {
  try {
    // Finds active donations assigned to this NGO that don't have a driver yet
    // Adjust status queries ('Pending' / 'Accepted') based on your Donation model
    const donations = await Donation.find({ 
      ngoId: req.user._id, 
      driverId: { $exists: false } 
    }).sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error("Fetch unassigned donations error:", error);
    res.status(500).json({ message: "Server error fetching donations." });
  }
});

// 4. PATCH /api/drivers/assign - Assign a donation to a driver
router.patch("/assign", protect, async (req, res) => {
  try {
    const { driverId, donationId } = req.body;

    if (!driverId || !donationId) {
      return res.status(400).json({ message: "Driver and Donation selection are required." });
    }

    // Update donation with driver details
    const donation = await Donation.findOneAndUpdate(
      { _id: donationId, ngoId: req.user._id },
      { driverId: driverId, status: "Driver Assigned" }, // Adjust status naming to your logic
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: "Donation not found or unauthorized." });
    }

    // Mark driver status as "On Duty" (isAvailable = false)
    await Driver.findByIdAndUpdate(driverId, { isAvailable: false });

    res.json({ message: "Donation successfully assigned to driver!", donation });
  } catch (error) {
    console.error("Assign driver error:", error);
    res.status(500).json({ message: "Server error during assignment." });
  }
});

// 5. DELETE /api/drivers/:id - Remove a driver
router.delete("/:id", protect, async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({
      _id: req.params.id,
      ngoId: req.user._id,
    });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    res.json({ message: "Driver removed." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;