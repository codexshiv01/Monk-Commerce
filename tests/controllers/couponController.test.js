const request = require('supertest');
const app = require('../../src/app');
const Coupon = require('../../src/models/Coupon');
const Product = require('../../src/models/Product');

describe('Coupon Controller', () => {
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

    // Create test coupon
    coupons.cartWise = await Coupon.create({
      code: 'CART10',
      name: '10% off on cart above $100',
      type: 'cart_wise',
      discount: {
        type: 'percentage',
        value: 10
      },
      conditions: {
        minimumAmount: 100
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  });

  describe('POST /api/coupons', () => {
    it('should create a new coupon successfully', async () => {
      const couponData = {
        code: 'NEWCOUPON',
        name: 'New Test Coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 15
        },
        conditions: {
          minimumAmount: 200
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(couponData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.code).toBe('NEWCOUPON');
      expect(response.body.data.coupon.type).toBe('cart_wise');
    });

    it('should reject coupon with duplicate code', async () => {
      const couponData = {
        code: 'CART10', // Already exists
        name: 'Duplicate Coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 15
        },
        conditions: {
          minimumAmount: 200
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(couponData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DUPLICATE_COUPON_CODE');
    });

    it('should reject invalid coupon data', async () => {
      const invalidCouponData = {
        code: 'INVALID',
        // Missing required fields
        type: 'cart_wise'
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidCouponData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should validate cart-wise coupon conditions', async () => {
      const invalidCartWiseCoupon = {
        code: 'INVALIDCART',
        name: 'Invalid Cart Coupon',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10
        },
        conditions: {}, // Missing minimumAmount
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidCartWiseCoupon)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].message).toContain('Cart-wise coupons must have minimumAmount');
    });

    it('should validate BxGy coupon conditions', async () => {
      const validBxGyCoupon = {
        code: 'VALIDBXGY',
        name: 'Valid BxGy Coupon',
        type: 'bxgy',
        discount: {
          type: 'percentage',
          value: 100
        },
        conditions: {
          buyProducts: [
            { productId: products.laptop._id.toString(), quantity: 2 }
          ],
          getProducts: [
            { productId: products.mouse._id.toString(), quantity: 1 }
          ],
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(validBxGyCoupon)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/coupons', () => {
    it('should get all coupons with pagination', async () => {
      const response = await request(app)
        .get('/api/coupons')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should filter coupons by type', async () => {
      const response = await request(app)
        .get('/api/coupons?type=cart_wise')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.coupons.forEach(coupon => {
        expect(coupon.type).toBe('cart_wise');
      });
    });

    it('should search coupons by code', async () => {
      const response = await request(app)
        .get('/api/coupons?search=CART')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/coupons/:id', () => {
    it('should get a specific coupon by ID', async () => {
      const response = await request(app)
        .get(`/api/coupons/${coupons.cartWise._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.code).toBe('CART10');
    });

    it('should return 404 for non-existent coupon', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/coupons/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('COUPON_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/coupons/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_ID_FORMAT');
    });
  });

  describe('PUT /api/coupons/:id', () => {
    it('should update a coupon successfully', async () => {
      const updateData = {
        name: 'Updated Coupon Name',
        discount: {
          type: 'percentage',
          value: 15
        }
      };

      const response = await request(app)
        .put(`/api/coupons/${coupons.cartWise._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.name).toBe('Updated Coupon Name');
      expect(response.body.data.coupon.discount.value).toBe(15);
    });

    it('should return 404 for non-existent coupon', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/coupons/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('COUPON_NOT_FOUND');
    });
  });

  describe('DELETE /api/coupons/:id', () => {
    it('should delete a coupon successfully', async () => {
      const response = await request(app)
        .delete(`/api/coupons/${coupons.cartWise._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCoupon.code).toBe('CART10');

      // Verify coupon is deleted
      const deletedCoupon = await Coupon.findById(coupons.cartWise._id);
      expect(deletedCoupon).toBeNull();
    });

    it('should return 404 for non-existent coupon', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/coupons/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('COUPON_NOT_FOUND');
    });
  });

  describe('POST /api/applicable-coupons', () => {
    it('should return applicable coupons for a cart', async () => {
      const cartData = {
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id.toString(),
            quantity: 1,
            price: 1000
          }
        ],
        shippingCost: 10
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applicableCoupons).toBeInstanceOf(Array);
      expect(response.body.data.cart.subtotal).toBe(1000);
    });

    it('should validate cart data', async () => {
      const invalidCartData = {
        userId: 'testuser',
        items: [] // Empty items array
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(invalidCartData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/apply-coupon/:id', () => {
    it('should apply coupon to cart successfully', async () => {
      const cartData = {
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id.toString(),
            quantity: 1,
            price: 1000
          }
        ],
        shippingCost: 10
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${coupons.cartWise._id}`)
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalDiscount).toBeGreaterThan(0);
      expect(response.body.data.cart.appliedCoupons).toHaveLength(1);
      expect(response.body.data.cart.appliedCoupons[0].code).toBe('CART10');
    });

    it('should reject non-applicable coupon', async () => {
      const cartData = {
        userId: 'testuser',
        items: [
          {
            productId: products.mouse._id.toString(),
            quantity: 1,
            price: 50 // Below minimum amount
          }
        ]
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${coupons.cartWise._id}`)
        .send(cartData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('COUPON_NOT_APPLICABLE');
    });

    it('should return 404 for non-existent coupon', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const cartData = {
        userId: 'testuser',
        items: [
          {
            productId: products.laptop._id.toString(),
            quantity: 1,
            price: 1000
          }
        ]
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${fakeId}`)
        .send(cartData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('COUPON_NOT_FOUND');
    });
  });
});
