const express = require("express");
const router = express.Router();
const PickupRequest = require("../models/PickupRequest"); // Your true schema
const Driver = require("../models/Driver");
const { protect } = require("../middleware/auth");

// ─── GET /api/donations/confirmed ─────────────────────────────────────────────
// Gets all accepted pickup requests for this NGO that still need a driver
router.get("/confirmed", protect, async (req, res) => {
  try {
    const pickups = await PickupRequest.find({
      ngo: req.user._id,        // Matches 'ngo' from your schema
      status: "accepted",       // Status after NGO accepts, ready for driver
    })
      .populate({
        path: "listing",        // Populates FoodListing details (title, address etc.)
        select: "title pickupAddress description", 
      })
      .populate("driver", "name phone vehicleNo") // Matches 'driver' from your schema
      .sort({ requestedAt: -1 });

    // Format the response data to match what your frontend dashboard expects
    const formattedDonations = pickups.map((p) => ({
      _id: p._id,
      title: p.listing?.title || "Food Donation",
      pickupAddress: p.listing?.pickupAddress || "N/A",
      status: p.status,
      assignedDriver: p.driver || null,
    }));

    res.json(formattedDonations);
  } catch (error) {
    console.error("Fetch accepted pickups error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/donations/:id/assign-driver ──────────────────────────────────
// Assigns a driver to a specific pickup request
router.patch("/:id/assign-driver", protect, async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required." });
    }

    // Verify driver belongs to this NGO
    const driverVerified = await Driver.findOne({ _id: driverId, ngoId: req.user._id });
    if (!driverVerified) {
      return res.status(404).json({ message: "Driver not found or not authorized." });
    }

    // Update the pickup request matching your schema rules
    const pickup = await PickupRequest.findOneAndUpdate(
      { _id: req.params.id, ngo: req.user._id },
      { 
        driver: driverId,      // Matches 'driver' field
        status: "accepted"     // Or change to a custom state like 'assigned' if added to your enum
      },
      { new: true }
    )
      .populate("listing", "title pickupAddress")
      .populate("driver", "name phone vehicleNo");

    if (!pickup) {
      return res.status(404).json({ message: "Pickup request not found." });
    }

    // Toggle driver status to unavailable so they can't be multi-booked
    await Driver.findByIdAndUpdate(driverId, { isAvailable: false });

    // Format output data safely for frontend consumption
    res.json({ 
      message: "Driver assigned successfully.", 
      donation: { 
        _id: pickup._id,
        title: pickup.listing?.title || "Food Donation",
        pickupAddress: pickup.listing?.pickupAddress || "N/A",
        assignedDriver: pickup.driver
      }
    });
  } catch (error) {
    console.error("Assign driver error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;