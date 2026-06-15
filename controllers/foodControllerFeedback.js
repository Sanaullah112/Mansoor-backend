// Make sure you are importing your correct model name at the top of the file!
const FoodListing = require('../models/FoodListing'); // Fixed model import name
const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res) => {
  try {
    const { foodId, feedbackType, rating, comments } = req.body;

    // 1. Safety check for the auth user session
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, user credentials missing' });
    }

    // 2. FIXED: Changed from 'Food' to 'FoodListing' to match your database collection
    const foodExists = await FoodListing.findById(foodId);
    if (!foodExists) {
      return res.status(404).json({ message: 'Donation item not found' });
    }

    const newFeedback = new Feedback({
      foodId,
      userId: req.user.id, 
      feedbackType,
      rating,
      comments
    });

    const savedFeedback = await newFeedback.save();
    
    // 3. FIXED: Clean execution syntax to populate references out of the instance document
    const populatedFeedback = await Feedback.findById(savedFeedback._id)
      .populate('foodId', 'foodName');

    res.status(201).json(populatedFeedback);
  } catch (error) {
    // This will now capture and output the exact technical text description to help you log cleanly
    res.status(500).json({ 
      message: 'Server Error: Failed to submit feedback', 
      error: error.message 
    });
  }
};

// @desc    Get logged-in user's feedback history
// @route   GET /api/feedback/history
exports.getFeedbackHistory = async (req, res) => {
  try {
    const history = await Feedback.find({ userId: req.user.id })
      .populate('foodId', 'foodName') // Grabs the name from the Food collection
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not retrieve history', error: error.message });
  }
};


exports.getDonationOptions = async (req, res) => {
  try {
    // Option A: If you want users to give feedback on ALL listings:
    const listings = await FoodListing.find({}, 'foodName'); 

    /* // Option B (Recommended): If you only want users to review items they claimed/received:
    // This assumes your FoodListing schema tracks who claimed it (e.g., recipient field)
    const listings = await FoodListing.find({ 
      recipient: req.user.id, 
      status: 'completed' 
    }, 'foodName'); 
    */

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load donation options: ' + error.message });
  }
};  