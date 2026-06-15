const mongoose = require('mongoose');

const safetyGuidelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'deactive'],
    default: 'active'
  }
}, { 
  timestamps: true // This automatically handles createdAt and updatedAt times
});

module.exports = mongoose.model('SafetyGuideline', safetyGuidelineSchema);