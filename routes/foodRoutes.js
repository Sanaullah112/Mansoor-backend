const express = require('express');
const router = express.Router();
const { createListing, getListings, getMyListings, updateListing, deleteListing, getAvailableFood, createRequest,  getDonorRequests, updateRequestStatus } = require('../controllers/foodController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { createFeedback, getFeedbackHistory, getDonationOptions } = require('../controllers/foodControllerFeedback');



router.get('/', getAvailableFood);
router.post('/requests', protect, createRequest);
// router.get('/requests/my-history', protect, getNGOHistory);
router.get('/requests/donor', protect, authorizeRoles('donor'), getDonorRequests);
router.put('/requests/:id', protect, updateRequestStatus);


router.route('/feedback')
  .post(protect, createFeedback);

router.route('/history') 
  .get(protect, getFeedbackHistory); 

  // Your existing listing route
router.get('/listings', getListings);

// The NEW route for your feedback dropdown menu
router.get('/options', protect, getDonationOptions);


// PUBLIC — no login required
router.get('/public', async (req, res) => {
    try {
      const listings = await FoodListing.find({ status: 'available' })
        .populate('donor', 'name phone address')
        .sort({ createdAt: -1 })
        .limit(20)
      res.json(listings)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  })

router.get('/', protect, getListings);
router.post('/', protect, authorizeRoles('donor', 'admin'), createListing);
router.get('/my', protect, authorizeRoles('donor'), getMyListings);
router.put('/:id', protect, authorizeRoles('donor', 'admin'), updateListing);
router.delete('/:id', protect, authorizeRoles('donor', 'admin'), deleteListing);


module.exports = router;