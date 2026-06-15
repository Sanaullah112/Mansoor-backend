// models/Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  foodId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FoodListing', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true  // The user leaving the feedback
  },
  feedbackType: { 
    type: String, 
    enum: ['Food Quality', 'Packaging Integrity', 'Delivery Timing', 'Other'],
    required: true
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5,
    required: true
  },
  comments: { 
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);