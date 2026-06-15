const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { getAllGuidelines } = require('../controllers/guidelineController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
  getAllGuidelines,
  getAllGuidelines,
  getAllGuidelines,
  getAllGuidelines,
  getAllGuidelines,
  getAllGuidelines,
router.get('/guidelines', getAllGuidelines);

module.exports = router;