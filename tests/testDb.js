const { Sequelize, DataTypes } = require('sequelize');

// Use SQLite in-memory database for tests
const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false, // Disable logging in tests
  define: {
    timestamps: true
  }
});

const Product = testSequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100)
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

const Coupon = testSequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500)
  },
  type: {
    type: DataTypes.ENUM('cart_wise', 'product_wise', 'bxgy', 'tiered', 'flash_sale', 'user_specific', 'graduated_bxgy', 'cross_category_bxgy'),
    allowNull: false
  },
  discount: {
    type: DataTypes.JSON,
    allowNull: false
  },
  conditions: {
    type: DataTypes.JSON,
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
    allowNull: false
  },
  currentUsage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stackable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flashSaleData: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  userCriteria: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  tieredRules: {
    type: DataTypes.JSON,
    defaultValue: null
  }
});

const Cart = testSequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  appliedCoupons: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  freeShipping: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Add essential methods to models
Coupon.prototype.getIsExpired = function() {
  return new Date() > this.endDate;
};

Coupon.prototype.getIsValid = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate;
};

Coupon.prototype.hasReachedMaxUsage = function() {
  const maxUsage = this.conditions?.maxTotalUsage;
  return maxUsage && this.currentUsage >= maxUsage;
};

Coupon.prototype.isFlashSaleActive = function() {
  if (!this.flashSaleData || this.type !== 'flash_sale') return false;
  
  const now = new Date();
  const { timeWindows } = this.flashSaleData;
  
  if (timeWindows && Array.isArray(timeWindows)) {
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    return timeWindows.some(window => {
      const dayMatch = !window.daysOfWeek || window.daysOfWeek.includes(currentDay);
      const timeMatch = currentHour >= window.startHour && currentHour <= window.endHour;
      return dayMatch && timeMatch;
    });
  }
  
  return true;
};

Coupon.prototype.checkUserEligibility = function(user) {
  if (!this.userCriteria || this.type !== 'user_specific') return true;
  
  const { userType, isFirstTime, loyaltyLevel, minOrders, maxOrders } = this.userCriteria;
  
  if (userType && user.type !== userType) return false;
  if (isFirstTime !== undefined && user.isFirstTime !== isFirstTime) return false;
  if (loyaltyLevel && user.loyaltyLevel < loyaltyLevel) return false;
  if (minOrders && user.orderCount < minOrders) return false;
  if (maxOrders && user.orderCount > maxOrders) return false;
  
  return true;
};

Coupon.prototype.getTieredDiscount = function(cartValue) {
  if (!this.tieredRules || this.type !== 'tiered') return null;
  
  const { tiers } = this.tieredRules;
  if (!tiers || !Array.isArray(tiers)) return null;
  
  const sortedTiers = tiers.sort((a, b) => b.minimumAmount - a.minimumAmount);
  
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

Cart.prototype.calculateSubtotal = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.subtotal;
};

Cart.prototype.calculateTotal = function() {
  this.total = this.subtotal - this.totalDiscount + this.shippingCost;
  return this.total;
};

module.exports = {
  sequelize: testSequelize,
  Product,
  Coupon,
  Cart
};
