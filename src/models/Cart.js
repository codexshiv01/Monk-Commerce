const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidItems(value) {
        if (!Array.isArray(value)) {
          throw new Error('Items must be an array');
        }
        value.forEach(item => {
          if (!item.productId || !item.quantity || !item.price) {
            throw new Error('Each item must have productId, quantity, and price');
          }
          if (item.quantity < 1) {
            throw new Error('Quantity must be at least 1');
          }
          if (item.price < 0) {
            throw new Error('Price must be non-negative');
          }
        });
      }
    }
  },
  
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  totalDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  appliedCoupons: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  freeShipping: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { 
      fields: ['items'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeUpdate: (cart, options) => {
      cart.updatedAt = new Date();
    }
  }
});

// Instance methods
Cart.prototype.calculateSubtotal = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);
  return this.subtotal;
};

Cart.prototype.calculateTotal = function() {
  this.calculateSubtotal();
  this.total = Math.max(0, 
    parseFloat(this.subtotal) - 
    parseFloat(this.totalDiscount || 0) + 
    (this.freeShipping ? 0 : parseFloat(this.shippingCost || 0))
  );
  return this.total;
};

Cart.prototype.addItem = function(productId, quantity, price) {
  const items = [...this.items];
  const existingItemIndex = items.findIndex(item => 
    item.productId === productId
  );
  
  if (existingItemIndex > -1) {
    items[existingItemIndex].quantity += quantity;
    items[existingItemIndex].finalPrice = items[existingItemIndex].price * items[existingItemIndex].quantity;
  } else {
    items.push({
      productId,
      quantity,
      price,
      discountAmount: 0,
      finalPrice: price * quantity
    });
  }
  
  this.items = items;
  this.calculateTotal();
};

Cart.prototype.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.productId !== productId
  );
  this.calculateTotal();
};

Cart.prototype.clearCoupons = function() {
  this.appliedCoupons = [];
  this.totalDiscount = 0;
  this.freeShipping = false;
  
  // Reset item discount amounts and final prices
  const items = this.items.map(item => ({
    ...item,
    discountAmount: 0,
    finalPrice: item.price * item.quantity
  }));
  
  this.items = items;
  this.calculateTotal();
};

module.exports = Cart;
