const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'collected', 'delivered'],
    default: 'pending'
  },
  feedback: { type: String },
  requestedAt: { type: Date, default: Date.now },
  fulfilledAt: { type: Date }
});

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);