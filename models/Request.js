const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
  status: { type: String, enum: ['Pending', 'Claimed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema); 