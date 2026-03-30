const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

// Rate a product or seller
router.post('/', auth, ratingController.rate);

// Get ratings for a product or seller
router.get('/', ratingController.getRatings);

module.exports = router;
