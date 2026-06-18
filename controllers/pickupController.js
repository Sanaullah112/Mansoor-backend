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

    const alreadyRequested = await PickupRequest.findOne({
      listing: listing._id,
      ngo: req.user._id
    });

    if (alreadyRequested) {
      return res.status(400).json({ message: 'You already requested this pickup.' });
    }

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

    const populated = await PickupRequest.findById(request._id)
      .populate({ path: 'listing', populate: { path: 'donor', select: 'name email phone' } })
      .populate('ngo', 'name email');

    res.status(201).json(populated);
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
    if (!['pending', 'accepted', 'rejected', 'collected', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    if (status === 'delivered') request.fulfilledAt = new Date();
    await request.save();

    if (status === 'accepted' || status === 'collected') {
      request.listing.status = 'collected';
      await request.listing.save();
      await Notification.create({
        user: request.ngo,
        message: status === 'accepted'
          ? 'Your pickup request has been accepted!'
          : 'The pickup has been marked as collected.',
        type: 'success'
      });
    }

    if (status === 'rejected') {
      request.listing.status = 'available';
      await request.listing.save();
      await Notification.create({
        user: request.ngo,
        message: 'Your pickup request was rejected. Try another listing.',
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
      .populate({
        path: 'listing',
        populate: { path: 'donor', select: 'name email phone address' }
      })
      .populate('driver', 'name phone')
      .sort({ requestedAt: -1 });
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
      .populate({
        path: 'listing',
        populate: { path: 'donor', select: 'name email phone address' }
      })
      .populate('ngo', 'name email phone')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, updateRequestStatus, getMyRequests, getDonorRequests };