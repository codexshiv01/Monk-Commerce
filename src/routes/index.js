const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
const { validateCart } = require('../validators/couponValidator');

// Import coupon routes
const couponRoutes = require('./couponRoutes');

// Mount coupon routes
router.use('/coupons', couponRoutes);

/**
 * ### CHANGE THIS ###
 * @route   POST /api/applicable-coupons
 * @desc    Get all applicable coupons for a cart
 * @access  Public
 */
router.post('/applicable-coupons', 
  validateCart,
  CouponController.getApplicableCoupons
);

/**
 * ### CHANGE THIS ###
 * @route   POST /api/apply-coupon/:id
 * @desc    Apply a specific coupon to cart
 * @access  Public
 */
router.post('/apply-coupon/:id', 
  validateCart,
  CouponController.applyCoupon
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
