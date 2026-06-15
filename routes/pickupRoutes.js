const express = require('express');
const router = express.Router();
const { createRequest, updateRequestStatus, getMyRequests, getDonorRequests } = require('../controllers/pickupController');
const { protect, authorizeRoles } = require('../middleware/auth');
const PickupRequest = require('../models/PickupRequest');

router.post('/:listingId', protect, authorizeRoles('ngo'), createRequest);
router.put('/:id', protect, updateRequestStatus);
router.get('/my', protect, authorizeRoles('ngo'), getMyRequests);
router.get('/donor', protect, authorizeRoles('donor'), getDonorRequests);

// Driver sees their assigned pickups
router.get('/driver', protect, authorizeRoles('driver'), async (req, res) => {
  try {
    const requests = await PickupRequest.find({ driver: req.user._id })
      .populate('listing')
      .populate('ngo', 'name phone address')
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

module.exports = router;