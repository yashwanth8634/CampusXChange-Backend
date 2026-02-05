const mongoose = require('mongoose');

const productRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Books',
      'Electronics',
      'Furniture',
      'Clothing',
      'Sports',
      'Stationery',
      'Vehicles',
      'Other'
    ]
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'fulfilled', 'closed'],
    default: 'open'
  },
  responses: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
productRequestSchema.index({ category: 1, status: 1 });
productRequestSchema.index({ requester: 1 });
productRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProductRequest', productRequestSchema);
