const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
const {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCart,
  validateCouponTypeConditions
} = require('../validators/couponValidator');

/**
 * ### CHANGE THIS ###
 * @route   POST /api/coupons
 * @desc    Create a new coupon
 * @access  Public (should be protected in real app)
 */
router.post('/', 
  validateCreateCoupon,
  validateCouponTypeConditions,
  CouponController.createCoupon
);

/**
 * ### CHANGE THIS ###
 * @route   GET /api/coupons
 * @desc    Get all coupons with filtering and pagination
 * @access  Public (should be protected in real app)
 * @query   page, limit, type, isActive, search, sortBy, sortOrder
 */
router.get('/', CouponController.getAllCoupons);

/**
 * ### CHANGE THIS ###
 * @route   GET /api/coupons/:id
 * @desc    Get a specific coupon by ID
 * @access  Public (should be protected in real app)
 */
router.get('/:id', CouponController.getCouponById);

/**
 * ### CHANGE THIS ###
 * @route   PUT /api/coupons/:id
 * @desc    Update a specific coupon by ID
 * @access  Public (should be protected in real app)
 */
router.put('/:id', 
  validateUpdateCoupon,
  validateCouponTypeConditions,
  CouponController.updateCoupon
);

/**
 * ### CHANGE THIS ###
 * @route   DELETE /api/coupons/:id
 * @desc    Delete a specific coupon by ID
 * @access  Public (should be protected in real app)
 */
router.delete('/:id', CouponController.deleteCoupon);



module.exports = router;
