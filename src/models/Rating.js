const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a user can only rate a product or seller once
ratingSchema.index({ rater: 1, product: 1 }, { unique: true, partialFilterExpression: { product: { $exists: true } } });
ratingSchema.index({ rater: 1, seller: 1 }, { unique: true, partialFilterExpression: { seller: { $exists: true } } });

module.exports = mongoose.model('Rating', ratingSchema);
