const Product = require('../models/Product');
const ProductRequest = require('../models/ProductRequest');
const { uploadMultipleImages } = require('../services/imageService');
const { verifyToken } = require('../utils/jwt');

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.'
      });
    }

    // Check if images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image.'
      });
    }

    if (req.files.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 8 images allowed.'
      });
    }

    // Upload images to ImageSocket and get URLs
    const imageUrls = await uploadMultipleImages(req.files);

    // Create product
    const product = new Product({
      title,
      description,
      price,
      category,
      location,
      images: imageUrls,
      seller: req.user._id
    });

    await product.save();

    // Populate seller info
    await product.populate('seller', 'name mobile');

    res.status(201).json({
      success: true,
      message: 'Product listed successfully.',
      product
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product.'
    });
  }
};

// Get all products and requests (merged for homepage)
exports.getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      status = 'available',
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build product query
    const productQuery = { status };
    
    if (search) {
      productQuery.$text = { $search: search };
    }

    if (category && category !== 'All') {
      productQuery.category = category;
    }

    if (minPrice || maxPrice) {
      productQuery.price = {};
      if (minPrice) productQuery.price.$gte = Number(minPrice);
      if (maxPrice) productQuery.price.$lte = Number(maxPrice);
    }

    // Build request query
    const requestQuery = { status: status === 'available' ? 'open' : status };
    
    if (search) {
      requestQuery.$text = { $search: search };
    }

    if (category && category !== 'All') {
      requestQuery.category = category;
    }

    // Execute queries with pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [products, requests, productsTotal, requestsTotal] = await Promise.all([
      Product.find(productQuery)
        .populate('seller', 'name mobile')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      ProductRequest.find(requestQuery)
        .populate('requester', 'name mobile')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(productQuery),
      ProductRequest.countDocuments(requestQuery)
    ]);

    // Combine and mark type
    const productsWithType = products.map(p => ({
      ...p.toObject(),
      type: 'product'
    }));

    const requestsWithType = requests.map(r => ({
      ...r.toObject(),
      type: 'request',
      seller: r.requester // Alias for consistency in frontend
    }));

    // Merge and sort by createdAt
    const allItems = [...productsWithType, ...requestsWithType]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));

    res.json({
      success: true,
      items: allItems,
      products: productsWithType,
      requests: requestsWithType,
      pagination: {
        totalProducts: productsTotal,
        totalRequests: requestsTotal,
        total: productsTotal + requestsTotal,
        page: Number(page),
        pages: Math.ceil((productsTotal + requestsTotal) / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products.'
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name mobile email profilePicture');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Unique View Counting Logic
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        
        // Initialize viewedBy if it doesn't exist
        if (!product.viewedBy) {
          product.viewedBy = [];
        }

        const userId = decoded.userId;
        const hasViewed = product.viewedBy.some(id => id.toString() === userId);

        // If user ID is valid and not in viewedBy list
        if (userId && !hasViewed) {
          product.viewedBy.push(userId);
          product.views += 1;
          await product.save();
        }
      } catch (err) {
        // Token error - ignore and don't count view
        console.log('View count token error:', err.message);
      }
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product.'
    });
  }
};

// Get user's own products
exports.getMyProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { seller: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get My Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your products.'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product.'
      });
    }

    const { title, description, price, category, condition, location, status } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (condition) product.condition = condition;
    if (location) product.location = location;
    if (status) product.status = status;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product.'
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this product.'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product.'
    });
  }
};

// Mark product as sold
exports.markAsSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product.'
      });
    }

    product.status = 'sold';
    await product.save();

    res.json({
      success: true,
      message: 'Product marked as sold.',
      product
    });
  } catch (error) {
    console.error('Mark As Sold Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status.'
    });
  }
};
