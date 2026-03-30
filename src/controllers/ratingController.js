const Rating = require('../models/Rating');
const Product = require('../models/Product');
const User = require('../models/User');

// Rate a product or seller
exports.rate = async (req, res) => {
  try {
    const { productId, sellerId, rating, comment } = req.body;
    const rater = req.user._id;
    let ratingDoc;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    if (!productId && !sellerId) {
      return res.status(400).json({ message: 'Product or Seller ID required.' });
    }

    if (productId) {
      // Rate a product
      ratingDoc = await Rating.findOneAndUpdate(
        { rater, product: productId },
        { rating, comment, product: productId, rater },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // Update product's average rating
      const ratings = await Rating.find({ product: productId });
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await Product.findByIdAndUpdate(productId, { averageRating: avg, ratingCount: ratings.length });
    }

    if (sellerId) {
      // Rate a seller
      ratingDoc = await Rating.findOneAndUpdate(
        { rater, seller: sellerId },
        { rating, comment, seller: sellerId, rater },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // Update seller's average rating
      const ratings = await Rating.find({ seller: sellerId });
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await User.findByIdAndUpdate(sellerId, { averageRating: avg, ratingCount: ratings.length });
    }

    res.status(200).json({ message: 'Rating submitted successfully.', rating: ratingDoc });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get ratings for a product or seller
exports.getRatings = async (req, res) => {
  try {
    const { productId, sellerId } = req.query;
    let ratings;
    if (productId) {
      ratings = await Rating.find({ product: productId }).populate('rater', 'name profilePicture');
    } else if (sellerId) {
      ratings = await Rating.find({ seller: sellerId }).populate('rater', 'name profilePicture');
    } else {
      return res.status(400).json({ message: 'Product or Seller ID required.' });
    }
    res.status(200).json({ ratings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
