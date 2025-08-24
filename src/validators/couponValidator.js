const Joi = require('joi');

// Schema for discount validation
const discountSchema = Joi.object({
  type: Joi.string().valid('percentage', 'fixed_amount', 'free_shipping').required(),
  value: Joi.number().min(0).required(),
  maxDiscountAmount: Joi.number().min(0).optional()
});

// Schema for conditions validation
const conditionsSchema = Joi.object({
  // Cart-wise conditions
  minimumAmount: Joi.number().min(0).optional(),
  
  // Product-wise conditions
  applicableProducts: Joi.array().items(Joi.string().uuid()).optional(),
  applicableCategories: Joi.array().items(Joi.string()).optional(),
  applicableBrands: Joi.array().items(Joi.string()).optional(),
  
  // BxGy conditions
  buyProducts: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().min(1).default(1)
    })
  ).optional(),
  getProducts: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().min(1).default(1)
    })
  ).optional(),
  repetitionLimit: Joi.number().min(1).default(1).optional(),
  
  // General conditions
  maxUsagePerUser: Joi.number().min(1).optional(),
  maxTotalUsage: Joi.number().min(1).optional(),
  userTypes: Joi.array().items(Joi.string().valid('new', 'existing', 'premium', 'vip')).optional(),
  
  // Advanced BxGy conditions
  graduatedRules: Joi.array().items(
    Joi.object({
      name: Joi.string().optional(),
      buyQuantity: Joi.number().min(1).required(),
      getQuantity: Joi.number().min(1).required(),
      discountPercentage: Joi.number().min(1).max(100).default(100)
    })
  ).optional(),
  
  // Cross-category BxGy conditions
  buyCategories: Joi.array().items(Joi.string()).optional(),
  getCategories: Joi.array().items(Joi.string()).optional(),
  buyQuantity: Joi.number().min(1).optional(),
  getQuantity: Joi.number().min(1).optional(),
  getDiscountPercentage: Joi.number().min(1).max(100).default(100).optional()
});

// Main coupon validation schema
const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).uppercase().required(),
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('cart_wise', 'product_wise', 'bxgy', 'tiered', 'flash_sale', 'user_specific', 'graduated_bxgy', 'cross_category_bxgy').required(),
  discount: discountSchema.required(),
  conditions: conditionsSchema.required(),
  isActive: Joi.boolean().default(true),
  startDate: Joi.date().default(Date.now),
  endDate: Joi.date().greater('now').required(),
  
  // Advanced features
  priority: Joi.number().integer().min(0).default(0).optional(),
  stackable: Joi.boolean().default(false).optional(),
  flashSaleData: Joi.object({
    discountMultiplier: Joi.number().min(1).max(5).optional(),
    timeWindows: Joi.array().items(
      Joi.object({
        startHour: Joi.number().min(0).max(23).required(),
        endHour: Joi.number().min(0).max(23).required(),
        daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).optional()
      })
    ).optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional()
  }).optional(),
  userCriteria: Joi.object({
    userType: Joi.string().valid('new', 'existing', 'premium', 'vip').optional(),
    isFirstTime: Joi.boolean().optional(),
    loyaltyLevel: Joi.number().min(1).max(10).optional(),
    minOrders: Joi.number().min(0).optional(),
    maxOrders: Joi.number().min(0).optional(),
    loyaltyMultiplier: Joi.number().min(1).max(3).optional(),
    maxMultiplier: Joi.number().min(1).max(5).optional(),
    registrationDays: Joi.object({
      min: Joi.number().min(0).required(),
      max: Joi.number().min(0).required()
    }).optional()
  }).optional(),
  tieredRules: Joi.object({
    tiers: Joi.array().items(
      Joi.object({
        name: Joi.string().optional(),
        minimumAmount: Joi.number().min(0).required(),
        discountType: Joi.string().valid('percentage', 'fixed_amount', 'free_shipping').default('percentage'),
        discountValue: Joi.number().min(0).required(),
        maxDiscountAmount: Joi.number().min(0).optional()
      })
    ).min(1).required()
  }).optional()
});

const updateCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).uppercase().optional(),
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('cart_wise', 'product_wise', 'bxgy', 'tiered', 'flash_sale', 'user_specific', 'graduated_bxgy', 'cross_category_bxgy').optional(),
  discount: discountSchema.optional(),
  conditions: conditionsSchema.optional(),
  isActive: Joi.boolean().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater('now').optional()
});

// Cart validation schema
const cartItemSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().min(1).required(),
  price: Joi.number().min(0).required()
});

const cartSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().items(cartItemSchema).min(1).required(),
  shippingCost: Joi.number().min(0).default(0)
});

// Validation middleware functions
const validateCreateCoupon = (req, res, next) => {
  const { error } = createCouponSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};

const validateUpdateCoupon = (req, res, next) => {
  const { error } = updateCouponSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};

const validateCart = (req, res, next) => {
  const { error } = cartSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};

// Custom validation for coupon type specific conditions
const validateCouponTypeConditions = (req, res, next) => {
  const { type, conditions } = req.body;
  
  if (!type || !conditions) {
    return next();
  }
  
  let isValid = true;
  let errorMessage = '';
  
  switch (type) {
    case 'cart_wise':
      if (!conditions.minimumAmount && conditions.minimumAmount !== 0) {
        isValid = false;
        errorMessage = 'Cart-wise coupons must have minimumAmount in conditions';
      }
      break;
      
    case 'product_wise':
      if (!conditions.applicableProducts?.length && 
          !conditions.applicableCategories?.length && 
          !conditions.applicableBrands?.length) {
        isValid = false;
        errorMessage = 'Product-wise coupons must have at least one of: applicableProducts, applicableCategories, or applicableBrands';
      }
      break;
      
    case 'bxgy':
      if (!conditions.buyProducts?.length || !conditions.getProducts?.length) {
        isValid = false;
        errorMessage = 'BxGy coupons must have both buyProducts and getProducts in conditions';
      }
      break;
  }
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: [{ field: 'conditions', message: errorMessage }]
    });
  }
  
  next();
};

module.exports = {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCart,
  validateCouponTypeConditions,
  createCouponSchema,
  updateCouponSchema,
  cartSchema
};
