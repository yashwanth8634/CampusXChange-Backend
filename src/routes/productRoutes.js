const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Protected routes
router.post('/', auth, upload.array('images', 8), productController.createProduct);
router.get('/user/my-products', auth, productController.getMyProducts);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);
router.patch('/:id/mark-sold', auth, productController.markAsSold);

module.exports = router;
