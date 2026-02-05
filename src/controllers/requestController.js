const ProductRequest = require('../models/ProductRequest');

// Create product request
exports.createRequest = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.'
      });
    }

    const productRequest = new ProductRequest({
      title,
      description,
      category,
      requester: req.user._id
    });

    await productRequest.save();
    await productRequest.populate('requester', 'name mobile');

    res.status(201).json({
      success: true,
      message: 'Product request created successfully.',
      request: productRequest
    });
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product request.'
    });
  }
};

// Get all product requests
exports.getAllRequests = async (req, res) => {
  try {
    const {
      category,
      status = 'open',
      page = 1,
      limit = 20
    } = req.query;

    const query = { status };

    if (category && category !== 'All') {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      ProductRequest.find(query)
        .populate('requester', 'name mobile')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      ProductRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      requests,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product requests.'
    });
  }
};

// Get single product request
exports.getRequest = async (req, res) => {
  try {
    const productRequest = await ProductRequest.findById(req.params.id)
      .populate('requester', 'name mobile email');

    if (!productRequest) {
      return res.status(404).json({
        success: false,
        message: 'Product request not found.'
      });
    }

    res.json({
      success: true,
      request: productRequest
    });
  } catch (error) {
    console.error('Get Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product request.'
    });
  }
};

// Get user's own requests
exports.getMyRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { requester: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      ProductRequest.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      ProductRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      requests,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get My Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your requests.'
    });
  }
};

// Update product request
exports.updateRequest = async (req, res) => {
  try {
    const productRequest = await ProductRequest.findById(req.params.id);

    if (!productRequest) {
      return res.status(404).json({
        success: false,
        message: 'Product request not found.'
      });
    }

    if (productRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request.'
      });
    }

    const { title, description, category, budgetRange, status } = req.body;

    if (title) productRequest.title = title;
    if (description) productRequest.description = description;
    if (category) productRequest.category = category;
    if (budgetRange) productRequest.budgetRange = budgetRange;
    if (status) productRequest.status = status;

    await productRequest.save();

    res.json({
      success: true,
      message: 'Request updated successfully.',
      request: productRequest
    });
  } catch (error) {
    console.error('Update Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request.'
    });
  }
};

// Delete product request
exports.deleteRequest = async (req, res) => {
  try {
    const productRequest = await ProductRequest.findById(req.params.id);

    if (!productRequest) {
      return res.status(404).json({
        success: false,
        message: 'Product request not found.'
      });
    }

    if (productRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this request.'
      });
    }

    await ProductRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Request deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting request.'
    });
  }
};
