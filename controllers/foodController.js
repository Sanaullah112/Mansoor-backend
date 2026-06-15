const FoodListing = require('../models/FoodListing');
const Notification = require('../models/Notification');

// Create food listing (Donor)
const createListing = async (req, res) => {
  try {
    const { foodName, category, quantity, unit, expiryDate, pickupAddress, coordinates, pickupLocation, description } = req.body;
    const normalizedExpiry = expiryDate ? new Date(expiryDate) : null;
    const listing = await FoodListing.create({
      donor: req.user._id,
      foodName,
      category,
      quantity,
      unit,
      expiryDate: normalizedExpiry,
      pickupAddress,
      coordinates: coordinates || pickupLocation || {},
      description
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
    else filter.status = 'available';
    const listings = await FoodListing.find(filter).populate('donor', 'name email phone address');
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
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.donor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    const updated = await FoodListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete listing (Donor)
const deleteListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.donor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// NGO COntroller function

const Request = require('../models/Request');

// 1. GET /api/food - Get all available food items not expired
const getAvailableFood = async (req, res) => {
  try {
    const foodItems = await FoodListing.find({ 
      status: 'available', 
      expiryDate: { $gt: new Date() } 
    }).populate('donor', 'name').sort({ createdAt: -1 });
    
    res.status(200).json(foodItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food items', error });
  }
};  

// 2. POST /api/requests - User/NGO requests a food item
const createRequest = async (req, res) => {
  try {
    const { foodId } = req.body;
    const ngoId = req.user._id;

    // Validate foodId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ message: 'Invalid food item. This may be demo data — please claim real listings only.' });
    }

    // Verify item is still available
    const foodItem = await FoodListing.findById(foodId);
    if (!foodItem || foodItem.status !== 'available') {
      return res.status(400).json({ message: 'Food item is no longer available' });
    }

    // Create request history item
    const newRequest = await Request.create({ ngoId, foodId });

    // Mark food as requested/unavailable so it is no longer shown
    foodItem.status = 'requested';
    await foodItem.save();

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: error.message || 'Request pipeline failed' });
  }
};

// 3. GET /api/requests/my-history - Get NGO's personal claim logs
const getNGOHistory = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const requests = await Request.find({ ngoId })
      .populate({
        path: 'foodId',
        populate: { path: 'donor', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    // Format output mapping schema fields cleanly onto your frontend layout structure
    const formattedHistory = requests.map(reqItem => {
      const f = reqItem.foodId || {};
      return {
        _id: reqItem._id,
        foodId: f._id || null,
        foodName: f.foodName || 'Unknown Food Item',
        category: f.category || 'other',
        quantity: f.quantity || 0,
        unit: f.unit || 'units',
        donor: f.donor || { name: 'Anonymous Donor' },
        expiryDate: f.expiryDate,
        status: reqItem.status,
        updatedAt: reqItem.updatedAt
      };
    });

    res.status(200).json(formattedHistory);
  } catch (error) {
  console.error('NGO HISTORY ERROR:', error);

  res.status(500).json({
    message: error.message
  });
}
};


module.exports = { createListing, getListings, getMyListings, updateListing, deleteListing, getAvailableFood, getNGOHistory, createRequest };