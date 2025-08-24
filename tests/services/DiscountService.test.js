const DiscountService = require('../../src/services/DiscountService');
const Coupon = require('../../src/models/Coupon');
const Product = require('../../src/models/Product');
const Cart = require('../../src/models/Cart');

describe('DiscountService', () => {
  let products = {};
  let coupons = {};

  beforeEach(async () => {
    // Create test products
    products.laptop = await Product.create({
      name: 'Gaming Laptop',
      price: 1000,
      category: 'Electronics',
      brand: 'TechBrand',
      sku: 'LAPTOP001',
      stock: 10
    });

    products.mouse = await Product.create({
      name: 'Wireless Mouse',
      price: 50,
      category: 'Electronics',
      brand: 'TechBrand',
      sku: 'MOUSE001',
      stock: 100
    });

    products.tshirt = await Product.create({
      name: 'Cotton T-Shirt',
      price: 25,
      category: 'Clothing',
      brand: 'FashionBrand',
      sku: 'TSHIRT001',
      stock: 50
    });

    // Create test coupons
    coupons.cartWise = await Coupon.create({
      code: 'CART10',
      name: '10% off on cart above $100',
      type: 'cart_wise',
      discount: {
        type: 'percentage',
        value: 10,
        maxDiscountAmount: 200
      },
      conditions: {
        minimumAmount: 100
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    coupons.productWise = await Coupon.create({
      code: 'ELECTRONICS20',
      name: '20% off on electronics',
      type: 'product_wise',
      discount: {
        type: 'percentage',
        value: 20
      },
      conditions: {
        applicableCategories: ['Electronics']
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    coupons.bxgy = await Coupon.create({
      code: 'BUY2GET1',
      name: 'Buy 2 laptops get 1 mouse free',
      type: 'bxgy',
      discount: {
        type: 'percentage',
        value: 100
      },
      conditions: {
        buyProducts: [
          { productId: products.laptop._id, quantity: 2 }
        ],
        getProducts: [
          { productId: products.mouse._id, quantity: 1 }
        ],
        repetitionLimit: 2
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    coupons.freeShipping = await Coupon.create({
      code: 'FREESHIP',
      name: 'Free shipping on orders above $75',
      type: 'cart_wise',
      discount: {
        type: 'free_shipping',
        value: 0
      },
      conditions: {
        minimumAmount: 75
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  });

  describe('Cart-wise Discount Calculation', () => {
    it('should calculate percentage discount correctly', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000
          }
        ],
        shippingCost: 10
      });
      cart.calculateSubtotal();

      const result = await DiscountService.calculateDiscount(cart, coupons.cartWise);

      expect(result.totalDiscount).toBe(100); // 10% of 1000
      expect(result.freeShipping).toBe(false);
      expect(result.affectedItems).toHaveLength(1);
    });

    it('should apply maximum discount limit', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 3,
            price: 1000
          }
        ]
      });
      cart.calculateSubtotal(); // 3000

      const result = await DiscountService.calculateDiscount(cart, coupons.cartWise);

      expect(result.totalDiscount).toBe(200); // Max discount is 200, not 300 (10% of 3000)
    });

    it('should handle free shipping discount', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000
          }
        ],
        shippingCost: 15
      });
      cart.calculateSubtotal();

      const result = await DiscountService.calculateDiscount(cart, coupons.freeShipping);

      expect(result.totalDiscount).toBe(15); // Shipping cost
      expect(result.freeShipping).toBe(true);
    });
  });

  describe('Product-wise Discount Calculation', () => {
    it('should calculate discount only for applicable products', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000
          },
          {
            productId: products.tshirt._id,
            quantity: 2,
            price: 25
          }
        ]
      });
      cart.calculateSubtotal(); // 1050

      const result = await DiscountService.calculateDiscount(cart, coupons.productWise);

      expect(result.totalDiscount).toBe(200); // 20% of laptop (1000) only, not t-shirt
      expect(result.affectedItems).toHaveLength(1);
      expect(result.affectedItems[0].productId.toString()).toBe(products.laptop._id.toString());
    });
  });

  describe('BxGy Discount Calculation', () => {
    it('should calculate BxGy discount correctly', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 2,
            price: 1000
          },
          {
            productId: products.mouse._id,
            quantity: 2,
            price: 50
          }
        ]
      });
      cart.calculateSubtotal(); // 2100

      const result = await DiscountService.calculateDiscount(cart, coupons.bxgy);

      expect(result.totalDiscount).toBe(50); // 1 mouse free (highest priced get product)
      expect(result.affectedItems).toHaveLength(1);
      expect(result.affectedItems[0].freeQuantity).toBe(1);
      expect(result.applicationsUsed).toBe(1);
    });

    it('should handle multiple applications with repetition limit', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 4, // Can apply BxGy twice
            price: 1000
          },
          {
            productId: products.mouse._id,
            quantity: 3,
            price: 50
          }
        ]
      });
      cart.calculateSubtotal(); // 4150

      const result = await DiscountService.calculateDiscount(cart, coupons.bxgy);

      expect(result.totalDiscount).toBe(100); // 2 mice free
      expect(result.applicationsUsed).toBe(2);
    });

    it('should not apply BxGy if insufficient buy products', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1, // Need 2 for BxGy
            price: 1000
          },
          {
            productId: products.mouse._id,
            quantity: 1,
            price: 50
          }
        ]
      });
      cart.calculateSubtotal();

      const applicabilityResult = await DiscountService.checkCouponApplicability(cart, coupons.bxgy);

      expect(applicabilityResult.isApplicable).toBe(false);
      expect(applicabilityResult.reason).toContain('Need 2 buy products');
    });
  });

  describe('Coupon Applicability Checks', () => {
    it('should check cart-wise minimum amount requirement', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.mouse._id,
            quantity: 1,
            price: 50
          }
        ]
      });
      cart.calculateSubtotal(); // 50 < 100 minimum

      const result = await DiscountService.checkCouponApplicability(cart, coupons.cartWise);

      expect(result.isApplicable).toBe(false);
      expect(result.reason).toContain('Cart total must be at least');
    });

    it('should check product-wise applicable products', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.tshirt._id, // Not in electronics category
            quantity: 1,
            price: 25
          }
        ]
      });
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, coupons.productWise);

      expect(result.isApplicable).toBe(false);
      expect(result.reason).toBe('Cart does not contain applicable products');
    });

    it('should check expired coupons', async () => {
      const expiredCoupon = await Coupon.create({
        code: 'EXPIRED',
        name: 'Expired coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {
          minimumAmount: 50
        },
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });

      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000
          }
        ]
      });
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, expiredCoupon);

      expect(result.isApplicable).toBe(false);
      expect(result.reason).toBe('Coupon is not valid or expired');
    });
  });

  describe('Apply Coupon to Cart', () => {
    it('should apply coupon and update cart correctly', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000,
            finalPrice: 1000
          }
        ],
        shippingCost: 10
      });
      cart.calculateSubtotal();

      const updatedCart = await DiscountService.applyCouponToCart(cart, coupons.cartWise);

      expect(updatedCart.totalDiscount).toBe(100);
      expect(updatedCart.appliedCoupons).toHaveLength(1);
      expect(updatedCart.appliedCoupons[0].code).toBe('CART10');
      expect(updatedCart.items[0].discountAmount).toBeGreaterThan(0);
      expect(updatedCart.total).toBe(910); // 1000 - 100 + 10 shipping
    });

    it('should throw error for non-applicable coupon', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.mouse._id,
            quantity: 1,
            price: 50,
            finalPrice: 50
          }
        ]
      });
      cart.calculateSubtotal(); // 50 < 100 minimum

      await expect(
        DiscountService.applyCouponToCart(cart, coupons.cartWise)
      ).rejects.toThrow('Coupon not applicable');
    });
  });

  describe('Calculate Applicable Coupons', () => {
    it('should return all applicable coupons sorted by discount amount', async () => {
      const cart = new Cart({
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id,
            quantity: 1,
            price: 1000
          }
        ],
        shippingCost: 15
      });
      cart.calculateSubtotal(); // 1000

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(cart);

      expect(applicableCoupons.length).toBeGreaterThan(0);
      
      // Should be sorted by discount amount (highest first)
      if (applicableCoupons.length > 1) {
        expect(applicableCoupons[0].discountAmount).toBeGreaterThanOrEqual(
          applicableCoupons[1].discountAmount
        );
      }

      // Check that all returned coupons are applicable
      applicableCoupons.forEach(ac => {
        expect(ac.isApplicable).toBe(true);
        expect(ac.discountAmount).toBeGreaterThan(0);
      });
    });
  });
});
