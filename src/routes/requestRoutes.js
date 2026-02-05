const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequest);

// Protected routes
router.post('/', auth, requestController.createRequest);
router.get('/user/my-requests', auth, requestController.getMyRequests);
router.put('/:id', auth, requestController.updateRequest);
router.delete('/:id', auth, requestController.deleteRequest);

module.exports = router;
