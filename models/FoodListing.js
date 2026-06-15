const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodName: { type: String, required: true },
  category: { type: String, enum: ['cooked', 'raw', 'packaged', 'bakery', 'dairy', 'other'], required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  expiryDate: { type: Date, required: true },
  pickupAddress: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, enum: ['available', 'requested', 'collected', 'expired'], default: 'available' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FoodListing', foodListingSchema);