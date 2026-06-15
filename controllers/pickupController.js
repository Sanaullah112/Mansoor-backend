const PickupRequest = require('../models/PickupRequest');
const FoodListing = require('../models/FoodListing');
const Notification = require('../models/Notification');

// NGO sends pickup request
const createRequest = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'available')
      return res.status(400).json({ message: 'Listing is not available' });

    const request = await PickupRequest.create({
      listing: listing._id,
      ngo: req.user._id
    });

    listing.status = 'requested';
    await listing.save();

    await Notification.create({
      user: listing.donor,
      message: `An NGO has requested pickup for your listing: "${listing.foodName}"`,
      type: 'info'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Donor accepts or rejects request
const updateRequestStatus = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id).populate('listing');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const { status } = req.body;
    request.status = status;
    if (status === 'delivered') request.fulfilledAt = new Date();
    await request.save();

    if (status === 'accepted') {
      request.listing.status = 'collected';
      await request.listing.save();
      await Notification.create({
        user: request.ngo,
        message: `Your pickup request has been accepted!`,
        type: 'success'
      });
    }

    if (status === 'rejected') {
      request.listing.status = 'available';
      await request.listing.save();
      await Notification.create({
        user: request.ngo,
        message: `Your pickup request was rejected. Try another listing.`,
        type: 'alert'
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for logged-in NGO
const getMyRequests = async (req, res) => {
  try {
    const requests = await PickupRequest.find({ ngo: req.user._id })
      .populate('listing').populate('driver', 'name phone');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get incoming requests for donor's listings
const getDonorRequests = async (req, res) => {
  try {
    const myListings = await FoodListing.find({ donor: req.user._id });
    const ids = myListings.map(l => l._id);
    const requests = await PickupRequest.find({ listing: { $in: ids } })
      .populate('listing').populate('ngo', 'name email phone');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, updateRequestStatus, getMyRequests, getDonorRequests };