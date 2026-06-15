const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, assignDriver, getStats, createUserByAdmin, updateUserStatus } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const { createGuideline, getAllGuidelines, updateGuideline, deleteGuideline } = require('../controllers/guidelineController');


router.post('/users', protect, authorizeRoles('admin'), createUserByAdmin);
router.put('/users/:id/status', protect, authorizeRoles('admin'), updateUserStatus);

router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);
router.put('/assign-driver/:id', protect, authorizeRoles('admin'), assignDriver);
router.get('/stats', protect, authorizeRoles('admin'), getStats);


// Guidelines route for admin can add eid delte 
router.post('/guidelines', protect, authorizeRoles('admin'), createGuideline);
router.get('/guidelines', protect, authorizeRoles('admin'), getAllGuidelines);
router.put('/guidelines/:id', protect, authorizeRoles('admin'), updateGuideline);
router.delete('/guidelines/:id', protect, authorizeRoles('admin'), deleteGuideline);



// Update user role
router.put('/users/:id/role', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role: req.body.role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all pickup requests
router.get('/requests', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const requests = await PickupRequest.find()
      .populate('listing')
      .populate('ngo', 'name phone email')
      .populate('driver', 'name phone');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }



});

module.exports = router;