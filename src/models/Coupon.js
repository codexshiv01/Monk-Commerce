const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 20],
      isUppercase: true
    },
    set(value) {
      this.setDataValue('code', value.toUpperCase().trim());
    }
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  
  description: {
    type: DataTypes.STRING(500),
    validate: {
      len: [0, 500]
    }
  },
  
  type: {
    type: DataTypes.ENUM('cart_wise', 'product_wise', 'bxgy', 'tiered', 'flash_sale', 'user_specific', 'graduated_bxgy', 'cross_category_bxgy'),
    allowNull: false
  },
  
  discount: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidDiscount(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Discount must be an object');
        }
        if (!['percentage', 'fixed_amount', 'free_shipping'].includes(value.type)) {
          throw new Error('Invalid discount type');
        }
        if (typeof value.value !== 'number' || value.value < 0) {
          throw new Error('Discount value must be a non-negative number');
        }
        if (value.maxDiscountAmount !== undefined && (typeof value.maxDiscountAmount !== 'number' || value.maxDiscountAmount < 0)) {
          throw new Error('Max discount amount must be a non-negative number');
        }
      }
    }
  },
  
  conditions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStart(value) {
        if (this.startDate && value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  
  currentUsage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  // Advanced features
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher numbers = higher priority for stacking'
  },
  
  stackable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can this coupon be stacked with others'
  },
  
  flashSaleData: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Flash sale specific data like time windows'
  },
  
  userCriteria: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'User-specific criteria like first-time, loyalty level'
  },
  
  tieredRules: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Tiered discount rules with thresholds'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['type'] },
    { fields: ['isActive', 'startDate', 'endDate'] },
    { 
      fields: ['conditions'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeUpdate: (coupon, options) => {
      coupon.updatedAt = new Date();
    }
  }
});

// Virtual getters
Coupon.prototype.getIsExpired = function() {
  return new Date() > this.endDate;
};

Coupon.prototype.getIsValid = function() {
  return this.isActive && !this.getIsExpired() && new Date() >= this.startDate;
};

// Instance methods
Coupon.prototype.hasReachedMaxUsage = function() {
  return this.conditions.maxTotalUsage && this.currentUsage >= this.conditions.maxTotalUsage;
};

Coupon.prototype.incrementUsage = async function() {
  this.currentUsage += 1;
  await this.save();
};

// Methods for advanced features
Coupon.prototype.isFlashSaleActive = function() {
  if (!this.flashSaleData || this.type !== 'flash_sale') return false;
  
  const now = new Date();
  const { startTime, endTime, daysOfWeek, timeWindows } = this.flashSaleData;
  
  // Check time windows for flash sales
  if (timeWindows && Array.isArray(timeWindows)) {
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return timeWindows.some(window => {
      const dayMatch = !window.daysOfWeek || window.daysOfWeek.includes(currentDay);
      const timeMatch = currentHour >= window.startHour && currentHour <= window.endHour;
      return dayMatch && timeMatch;
    });
  }
  
  // Check absolute time range
  if (startTime && endTime) {
    return now >= new Date(startTime) && now <= new Date(endTime);
  }
  
  return true;
};

Coupon.prototype.checkUserEligibility = function(user) {
  if (!this.userCriteria || this.type !== 'user_specific') return true;
  
  const { userType, isFirstTime, loyaltyLevel, minOrders, maxOrders, registrationDays } = this.userCriteria;
  
  // Check user type
  if (userType && user.type !== userType) return false;
  
  // Check first-time user
  if (isFirstTime !== undefined && user.isFirstTime !== isFirstTime) return false;
  
  // Check loyalty level
  if (loyaltyLevel && user.loyaltyLevel < loyaltyLevel) return false;
  
  // Check order count range
  if (minOrders && user.orderCount < minOrders) return false;
  if (maxOrders && user.orderCount > maxOrders) return false;
  
  // Check registration age
  if (registrationDays) {
    const daysSinceRegistration = Math.floor((new Date() - new Date(user.registrationDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceRegistration < registrationDays.min || daysSinceRegistration > registrationDays.max) {
      return false;
    }
  }
  
  return true;
};

Coupon.prototype.getTieredDiscount = function(cartValue) {
  if (!this.tieredRules || this.type !== 'tiered') return null;
  
  const { tiers } = this.tieredRules;
  if (!tiers || !Array.isArray(tiers)) return null;
  
  // Sort tiers by minimum amount (highest first)
  const sortedTiers = tiers.sort((a, b) => b.minimumAmount - a.minimumAmount);
  
  // Find the highest tier that the cart qualifies for
  for (const tier of sortedTiers) {
    if (cartValue >= tier.minimumAmount) {
      return {
        type: tier.discountType || 'percentage',
        value: tier.discountValue,
        maxDiscountAmount: tier.maxDiscountAmount,
        tier: tier.name || `Tier ${tier.minimumAmount}`
      };
    }
  }
  
  return null;
};

// Add virtual properties for compatibility
Object.defineProperty(Coupon.prototype, 'isExpired', {
  get: function() {
    return this.getIsExpired();
  }
});

Object.defineProperty(Coupon.prototype, 'isValid', {
  get: function() {
    // Override isValid to include flash sale and user checks
    const basicValid = this.getIsValid();
    if (!basicValid) return false;
    
    // Additional checks for flash sales
    if (this.type === 'flash_sale') {
      return this.isFlashSaleActive();
    }
    
    return true;
  }
});

module.exports = Coupon;
