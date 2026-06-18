const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
// Assuming you have a Donation model. Update path if needed!
const Donation = require("../models/Donation"); 
const { protect } = require("../middleware/auth");
const Request = require("../models/Request");

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


// GET /api/drivers/unassigned-donations - Get donations waiting for assignment
router.get("/unassigned-donations", protect, async (req, res) => {
  try {
    // 1. Find requests for this NGO where a driver hasn't been assigned yet
    // 2. Populate the foodId field with specific properties from FoodListing
    const unassignedRequests = await Request.find({ 
      ngoId: req.user._id, 
      // Using $exists: false or null depending on how your schema initialises empty fields
      $or: [
        { driverId: { $exists: false } },
        { driverId: null }
      ]
    })
    .populate({
      path: "foodId",
      // Choose the exact field names used in your FoodListing model (e.g., title, pickupAddress, location)
      select: "foodName name pickupAddress address description" 
    })
    .sort({ createdAt: -1 });
    
    // 3. (Optional but recommended) Format the array neatly for your frontend mapping loop
    const formattedDonations = unassignedRequests.map(reqItem => {
      return {
        _id: reqItem._id,
        status: reqItem.status,
        createdAt: reqItem.createdAt,
        // Extracted directly from the populated foodId field
        title: reqItem.foodId?.foodName || reqItem.foodId?.name || "Unnamed Food Listing",
        pickupAddress: reqItem.foodId?.pickupAddress || reqItem.foodId?.address || "Address N/A",
        rawFoodDetails: reqItem.foodId // Kept just in case your frontend needs other properties
      };
    });

    res.json(formattedDonations);
  } catch (error) {
    console.error("Fetch unassigned donations error:", error);
    res.status(500).json({ message: "Server error fetching donations." });
  }
});


// PATCH /api/drivers/assign - Assign a donation to a driver
router.patch("/assign", protect, async (req, res) => {
  try {
    const { driverId, donationId } = req.body;

    if (!driverId || !donationId) {
      return res.status(400).json({ message: "Driver and Donation selection are required." });
    }

    // 1. Target the Request collection instead of Donation
    // 2. Map schema properties properly: search via _id, ensure ownership via ngoId
    const requestRecord = await Request.findOneAndUpdate(
      { 
        _id: donationId, 
        ngoId: req.user._id || req.user.id // Ensures this NGO actually owns the request
      },
      { 
        // dynamically append a driver field to track who is picking it up
        driverId: driverId, 
        status: "accepted" // Request accepted and driver assigned
      },
      { new: true }
    );

    // If the database can't find a Request item matching both IDs, it returns null
    if (!requestRecord) {
      return res.status(404).json({ message: "Donation assignment record not found or unauthorized." });
    }

    // Mark driver status as "On Duty" (isAvailable = false)
    await Driver.findByIdAndUpdate(driverId, { isAvailable: false });

    res.json({ 
      message: "Donation successfully assigned to driver!", 
      donation: requestRecord 
    });
    
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