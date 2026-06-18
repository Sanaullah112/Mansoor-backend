const FoodListing = require("../models/FoodListing");
const Notification = require("../models/Notification");

// Create food listing (Donor)
const createListing = async (req, res) => {
  try {
    const {
      foodName,
      category,
      quantity,
      unit,
      expiryDate,
      pickupAddress,
      coordinates,
      description,
    } = req.body;
    const listing = await FoodListing.create({
      donor: req.user._id,
      foodName,
      category,
      quantity,
      unit,
      expiryDate,
      pickupAddress,
      coordinates,
      description,
    });
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all available listings (NGO)
const getListings = async (req, res) => {
  try {
    const { category, status } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = "available";
    const listings = await FoodListing.find(filter).populate(
      "donor",
      "name email phone address",
    );
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get donor's own listings
const getMyListings = async (req, res) => {
  try {
    const listings = await FoodListing.find({ donor: req.user._id });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update listing (Donor)
const updateListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.donor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    const updated = await FoodListing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete listing (Donor)
const deleteListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.donor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    await listing.deleteOne();
    res.json({ message: "Listing removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NGO COntroller function

const Request = require("../models/Request");

// 1. GET /api/food - Get all available food items not expired
const getAvailableFood = async (req, res) => {
  try {
    const foodItems = await FoodListing.find({
      status: "available",
      expiryDate: { $gt: new Date() },
    }).populate("donor", "name");

    res.status(200).json(foodItems);
  } catch (error) {
    res.status(500).json({ message: "Error fetching food items", error });
  }
};

// POST /api/requests - NGO requests a food item
const createRequest = async (req, res) => {
  try {
    const { foodId } = req.body;
    const requesterId = req.user._id || req.user.id;
    const requesterRole = (req.user.role || '').toLowerCase();

    if (!foodId) {
      return res.status(400).json({ message: "Food item ID is required." });
    }

    if (!['ngo', 'user'].includes(requesterRole)) {
      return res.status(403).json({ message: 'Only NGO and user accounts can claim food.' });
    }

    // 1. Verify item exists and is still available
    const foodItem = await FoodListing.findById(foodId);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found." });
    }

    // Check original state safely (case-insensitive fallback comparison)
    if (foodItem.status.toLowerCase() !== "available") {
      return res
        .status(400)
        .json({ message: "Food item is no longer available." });
    }

    const requestPayload = {
      requesterId,
      requesterRole,
      foodId,
      status: "pending",
    };
    if (requesterRole === 'ngo') requestPayload.ngoId = requesterId;

    const newRequest = await Request.create(requestPayload);

    res.status(201).json({
      message: "Food item claimed! Awaiting donor approval.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Request pipeline failed:", error);
    res.status(500).json({
      message: "Request pipeline failed",
      error: error.message || error,
    });
  }
};

// 4. GET /api/food/requests/donor - Get all pending requests for donor's food items
const getDonorRequests = async (req, res) => {
  try {
    const donorId = req.user._id;

    // Find all food listings belonging to this donor
    const donorListings = await FoodListing.find({ donor: donorId });
    const listingIds = donorListings.map(l => l._id);

    // Find all requests for those listings and populate details
    const requests = await Request.find({ foodId: { $in: listingIds } })
      .populate({
        path: 'foodId',
        select: 'foodName category quantity unit pickupAddress expiryDate'
      })
      .populate({
        path: 'ngoId',
        select: 'name phone email address'
      })
      .populate({
        path: 'requesterId',
        select: 'name phone email address'
      })
      .sort({ createdAt: -1 });

    // Format response to match DonorRequests.jsx expectations
    const formattedRequests = requests.map((req) => {
      const requester = req.requesterRole === 'ngo' ? req.ngoId : req.requesterId;
      return {
        _id: req._id,
        status: req.status,
        requestedAt: req.createdAt,
        listing: req.foodId,
        ngo: requester || req.ngoId,
        requesterRole: req.requesterRole,
      };
    });

    res.status(200).json(formattedRequests);
  } catch (error) {
    console.error('Donor requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 5. PUT /api/food/requests/:id - Update request status (accept/reject)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('foodId').populate('ngoId', 'name email phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // If rejected, keep listing available; if accepted, mark as requested
    if (status === 'accepted') {
      await FoodListing.findByIdAndUpdate(request.foodId._id, { status: 'requested' });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: error.message });
  }
};











module.exports = {
  createListing,
  getListings,
  getMyListings,
  updateListing,
  deleteListing,
  getAvailableFood,
  createRequest,
  getDonorRequests,
  updateRequestStatus,
};
