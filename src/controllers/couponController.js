const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const DiscountService = require('../services/DiscountService');
const { Op } = require('sequelize');

class CouponController {
  
  /**
   * ### CHANGE THIS ###
   * Create a new coupon
   * POST /coupons
   */
  static async createCoupon(req, res) {
    try {
      const couponData = req.body;
      
      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ where: { code: couponData.code } });
      if (existingCoupon) {
        return res.status(409).json({
          success: false,
          message: 'Coupon code already exists',
          error: 'DUPLICATE_COUPON_CODE'
        });
      }
      
      // Create new coupon
      const coupon = await Coupon.create(couponData);
      
      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            discount: coupon.discount,
            conditions: coupon.conditions,
            isActive: coupon.isActive,
            startDate: coupon.startDate,
            endDate: coupon.endDate
          }
        }
      });
      
    } catch (error) {
      console.error('Error creating coupon:', error);
      
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Get all coupons with optional filtering
   * GET /coupons
   */
  static async getAllCoupons(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        isActive, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter object
      const where = {};
      
      if (type) {
        where.type = type;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (search) {
        where[Op.or] = [
          { code: { [Op.iLike]: `%${search}%` } },
          { name: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build order array
      const order = [[sortBy, sortOrder.toUpperCase()]];
      
      // Execute query
      const { count, rows: coupons } = await Coupon.findAndCountAll({
        where,
        order,
        offset,
        limit: parseInt(limit)
      });
      
      // Calculate pagination info
      const totalPages = Math.ceil(count / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;
      
      res.status(200).json({
        success: true,
        message: 'Coupons retrieved successfully',
        data: {
          coupons: coupons.map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            discount: coupon.discount,
            conditions: coupon.conditions,
            isActive: coupon.isActive,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            currentUsage: coupon.currentUsage,
            isExpired: coupon.isExpired,
            isValid: coupon.isValid
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Get a specific coupon by ID
   * GET /coupons/:id
   */
  static async getCouponById(req, res) {
    try {
      const { id } = req.params;
      
      const coupon = await Coupon.findByPk(id);
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found',
          error: 'COUPON_NOT_FOUND'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Coupon retrieved successfully',
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            discount: coupon.discount,
            conditions: coupon.conditions,
            isActive: coupon.isActive,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            currentUsage: coupon.currentUsage,
            isExpired: coupon.isExpired,
            isValid: coupon.isValid,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting coupon:', error);
      
      if (error.name === 'SequelizeDatabaseError' && error.original?.code === '22P02') {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon ID format',
          error: 'INVALID_ID_FORMAT'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Update a specific coupon by ID
   * PUT /coupons/:id
   */
  static async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if coupon exists
      const existingCoupon = await Coupon.findByPk(id);
      if (!existingCoupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found',
          error: 'COUPON_NOT_FOUND'
        });
      }
      
      // Check if updating code and new code already exists
      if (updateData.code && updateData.code !== existingCoupon.code) {
        const duplicateCoupon = await Coupon.findOne({ 
          where: { 
            code: updateData.code, 
            id: { [Op.ne]: id } 
          } 
        });
        
        if (duplicateCoupon) {
          return res.status(409).json({
            success: false,
            message: 'Coupon code already exists',
            error: 'DUPLICATE_COUPON_CODE'
          });
        }
      }
      
      // Update coupon
      await existingCoupon.update(updateData);
      
      res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: {
          coupon: {
            id: existingCoupon.id,
            code: existingCoupon.code,
            name: existingCoupon.name,
            description: existingCoupon.description,
            type: existingCoupon.type,
            discount: existingCoupon.discount,
            conditions: existingCoupon.conditions,
            isActive: existingCoupon.isActive,
            startDate: existingCoupon.startDate,
            endDate: existingCoupon.endDate,
            currentUsage: existingCoupon.currentUsage,
            updatedAt: existingCoupon.updatedAt
          }
        }
      });
      
    } catch (error) {
      console.error('Error updating coupon:', error);
      
      if (error.name === 'SequelizeDatabaseError' && error.original?.code === '22P02') {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon ID format',
          error: 'INVALID_ID_FORMAT'
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Delete a specific coupon by ID
   * DELETE /coupons/:id
   */
  static async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      
      const coupon = await Coupon.findByPk(id);
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found',
          error: 'COUPON_NOT_FOUND'
        });
      }
      
      const deletedData = {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name
      };
      
      await coupon.destroy();
      
      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully',
        data: {
          deletedCoupon: deletedData
        }
      });
      
    } catch (error) {
      console.error('Error deleting coupon:', error);
      
      if (error.name === 'SequelizeDatabaseError' && error.original?.code === '22P02') {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon ID format',
          error: 'INVALID_ID_FORMAT'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Get all applicable coupons for a cart
   * POST /applicable-coupons
   */
  static async getApplicableCoupons(req, res) {
    try {
      const cartData = req.body;
      const { user, allowStacking = false } = req.body;
      
      // Create a temporary cart object for calculation
      const cart = new Cart(cartData);
      cart.calculateSubtotal();
      
      // Get applicable coupons
      const applicableCoupons = await DiscountService.calculateApplicableCoupons(cart, null, user, allowStacking);
      
      res.status(200).json({
        success: true,
        message: 'Applicable coupons retrieved successfully',
        data: {
          cart: {
            userId: cart.userId,
            itemCount: cart.items.length,
            subtotal: cart.subtotal,
            shippingCost: cart.shippingCost
          },
          applicableCoupons: applicableCoupons.map(ac => ({
            coupon: {
              id: ac.coupon.id,
              code: ac.coupon.code,
              name: ac.coupon.name,
              type: ac.coupon.type,
              discount: ac.coupon.discount
            },
            discountAmount: ac.discountAmount,
            freeShipping: ac.freeShipping,
            finalTotal: Math.max(0, parseFloat(cart.subtotal) - ac.discountAmount + (ac.freeShipping ? 0 : parseFloat(cart.shippingCost || 0))),
            savings: ac.discountAmount + (ac.freeShipping ? parseFloat(cart.shippingCost || 0) : 0)
          }))
        }
      });
      
    } catch (error) {
      console.error('Error getting applicable coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  /**
   * ### CHANGE THIS ###
   * Apply a specific coupon to cart
   * POST /apply-coupon/:id
   */
  static async applyCoupon(req, res) {
    try {
      const { id } = req.params;
      const cartData = req.body;
      
      // Find the coupon
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found',
          error: 'COUPON_NOT_FOUND'
        });
      }
      
      // Create a temporary cart object
      const cart = new Cart(cartData);
      cart.calculateSubtotal();
      
      // Apply coupon to cart
      const updatedCart = await DiscountService.applyCouponToCart(cart, coupon);
      
      // Increment coupon usage (in real app, this should be done after order confirmation)
      // await coupon.incrementUsage();
      
      res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          cart: {
            userId: updatedCart.userId,
            items: updatedCart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discountAmount: item.discountAmount,
              finalPrice: item.finalPrice
            })),
            subtotal: updatedCart.subtotal,
            totalDiscount: updatedCart.totalDiscount,
            shippingCost: updatedCart.freeShipping ? 0 : updatedCart.shippingCost,
            freeShipping: updatedCart.freeShipping,
            total: updatedCart.total,
            appliedCoupons: updatedCart.appliedCoupons.map(ac => ({
              couponId: ac.couponId,
              code: ac.code,
              discountAmount: ac.discountAmount
            })),
            savings: parseFloat(updatedCart.totalDiscount) + (updatedCart.freeShipping ? parseFloat(cartData.shippingCost || 0) : 0)
          }
        }
      });
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      
      if (error.name === 'SequelizeDatabaseError' && error.original?.code === '22P02') {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon ID format',
          error: 'INVALID_ID_FORMAT'
        });
      }
      
      if (error.message.includes('not applicable')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'COUPON_NOT_APPLICABLE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = CouponController;