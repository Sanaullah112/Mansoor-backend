const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterRole: { type: String, required: true, enum: ['user', 'ngo', 'donor', 'driver', 'admin'] },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema); 