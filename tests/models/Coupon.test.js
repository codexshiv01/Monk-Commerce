const Coupon = require('../../src/models/Coupon');
const Product = require('../../src/models/Product');

describe('Coupon Model', () => {
  let product1, product2;

  beforeEach(async () => {
    // Create test products
    product1 = await Product.create({
      name: 'Test Product 1',
      price: 100,
      category: 'Electronics',
      brand: 'TestBrand',
      sku: 'TEST001',
      stock: 50
    });

    product2 = await Product.create({
      name: 'Test Product 2',
      price: 200,
      category: 'Clothing',
      brand: 'TestBrand2',
      sku: 'TEST002',
      stock: 30
    });
  });

  describe('Cart-wise Coupon', () => {
    it('should create a valid cart-wise coupon', async () => {
      const couponData = {
        code: 'CART10',
        name: '10% off on cart',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10,
          maxDiscountAmount: 100
        },
        conditions: {
          minimumAmount: 500
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.id).toBeDefined();
      expect(coupon.code).toBe('CART10');
      expect(coupon.type).toBe('cart_wise');
      expect(coupon.isValid).toBe(true);
    });

    it('should reject cart-wise coupon without minimum amount', async () => {
      const couponData = {
        code: 'INVALID',
        name: 'Invalid coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {}, // Missing minimumAmount
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      await expect(Coupon.create(couponData)).rejects.toThrow();
    });
  });

  describe('Product-wise Coupon', () => {
    it('should create a valid product-wise coupon', async () => {
      const couponData = {
        code: 'PRODUCT20',
        name: '20% off on specific products',
        type: 'product_wise',
        discount: {
          type: 'percentage',
          value: 20
        },
        conditions: {
          applicableProducts: [product1.id, product2.id]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.id).toBeDefined();
      expect(coupon.conditions.applicableProducts).toHaveLength(2);
    });

    it('should create a category-based product-wise coupon', async () => {
      const couponData = {
        code: 'ELECTRONICS15',
        name: '15% off on electronics',
        type: 'product_wise',
        discount: {
          type: 'percentage',
          value: 15
        },
        conditions: {
          applicableCategories: ['Electronics']
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.conditions.applicableCategories).toContain('Electronics');
    });
  });

  describe('BxGy Coupon', () => {
    it('should create a valid BxGy coupon', async () => {
      const couponData = {
        code: 'BUY2GET1',
        name: 'Buy 2 Get 1 Free',
        type: 'bxgy',
        discount: {
          type: 'percentage',
          value: 100 // 100% discount on get products
        },
        conditions: {
          buyProducts: [
            { productId: product1.id, quantity: 2 }
          ],
          getProducts: [
            { productId: product2.id, quantity: 1 }
          ],
          repetitionLimit: 3
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.id).toBeDefined();
      expect(coupon.conditions.buyProducts).toHaveLength(1);
      expect(coupon.conditions.getProducts).toHaveLength(1);
      expect(coupon.conditions.repetitionLimit).toBe(3);
    });
  });

  describe('Coupon Validation', () => {
    it('should reject coupon with duplicate code', async () => {
      const couponData = {
        code: 'DUPLICATE',
        name: 'Test coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {
          minimumAmount: 100
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      await Coupon.create(couponData);
      await expect(Coupon.create(couponData)).rejects.toThrow();
    });

    it('should check if coupon is expired', async () => {
      const couponData = {
        code: 'EXPIRED',
        name: 'Expired coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {
          minimumAmount: 100
        },
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.isExpired).toBe(true);
      expect(coupon.isValid).toBe(false);
    });

    it('should check max usage limit', async () => {
      const couponData = {
        code: 'LIMITED',
        name: 'Limited usage coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {
          minimumAmount: 100,
          maxTotalUsage: 5
        },
        currentUsage: 5,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const coupon = await Coupon.create(couponData);

      expect(coupon.hasReachedMaxUsage()).toBe(true);
    });
  });
});