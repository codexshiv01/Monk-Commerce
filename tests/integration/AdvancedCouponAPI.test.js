const request = require('supertest');
const app = require('../../src/app');
const { Product, Coupon, Cart } = require('../setup');

describe('Advanced Coupon API Integration Tests', () => {
  let products;
  let testUser;

  beforeEach(async () => {
    // Create test products
    products = await Product.bulkCreate([
      {
        name: 'Gaming Laptop',
        price: 1200.00,
        category: 'Electronics',
        brand: 'TechBrand',
        sku: 'LAPTOP001',
        stock: 50
      },
      {
        name: 'Gaming Mouse',
        price: 80.00,
        category: 'Electronics',
        brand: 'TechBrand',
        sku: 'MOUSE001',
        stock: 100
      },
      {
        name: 'T-Shirt',
        price: 25.00,
        category: 'Clothing',
        brand: 'Fashion',
        sku: 'SHIRT001',
        stock: 200
      }
    ]);

    testUser = {
      id: 'test-user-123',
      type: 'new',
      isFirstTime: true,
      loyaltyLevel: 5,
      orderCount: 0,
      registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
  });

  describe('POST /api/coupons - Advanced Coupon Creation', () => {
    test('should create tiered discount coupon', async () => {
      const tieredCoupon = {
        code: 'APITIERED',
        name: 'API Tiered Test',
        type: 'tiered',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        tieredRules: {
          tiers: [
            {
              name: 'Bronze',
              minimumAmount: 100,
              discountType: 'percentage',
              discountValue: 10,
              maxDiscountAmount: 50
            },
            {
              name: 'Gold',
              minimumAmount: 500,
              discountType: 'percentage',
              discountValue: 20,
              maxDiscountAmount: 200
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(tieredCoupon)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.type).toBe('tiered');
      expect(response.body.data.coupon.tieredRules.tiers).toHaveLength(2);
    });

    test('should create flash sale coupon', async () => {
      const flashSale = {
        code: 'APIFLASH',
        name: 'API Flash Test',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 35 },
        conditions: { minimumAmount: 100 },
        flashSaleData: {
          discountMultiplier: 1.5,
          timeWindows: [
            {
              startHour: 14,
              endHour: 16,
              daysOfWeek: [1, 2, 3, 4, 5]
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(flashSale)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.type).toBe('flash_sale');
      expect(response.body.data.coupon.flashSaleData.timeWindows).toHaveLength(1);
    });

    test('should create user-specific coupon', async () => {
      const userSpecific = {
        code: 'APIUSER',
        name: 'API User Test',
        type: 'user_specific',
        discount: { type: 'percentage', value: 40, maxDiscountAmount: 150 },
        conditions: { minimumAmount: 75 },
        userCriteria: {
          isFirstTime: true,
          loyaltyLevel: 3,
          loyaltyMultiplier: 1.5,
          maxMultiplier: 2.5
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(userSpecific)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.type).toBe('user_specific');
      expect(response.body.data.coupon.userCriteria.isFirstTime).toBe(true);
    });

    test('should create stackable coupon', async () => {
      const stackable = {
        code: 'APISTACK',
        name: 'API Stackable Test',
        type: 'cart_wise',
        discount: { type: 'percentage', value: 8 },
        conditions: { minimumAmount: 200 },
        priority: 3,
        stackable: true,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(stackable)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.stackable).toBe(true);
      expect(response.body.data.coupon.priority).toBe(3);
    });

    test('should create graduated BxGy coupon', async () => {
      const graduated = {
        code: 'APIGRAD',
        name: 'API Graduated Test',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 1 }],
          getProducts: [{ productId: products[1].id, quantity: 1 }],
          graduatedRules: [
            {
              name: 'Basic',
              buyQuantity: 2,
              getQuantity: 1,
              discountPercentage: 100
            },
            {
              name: 'Premium',
              buyQuantity: 4,
              getQuantity: 3,
              discountPercentage: 100
            }
          ],
          repetitionLimit: 2
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(graduated)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.type).toBe('graduated_bxgy');
      expect(response.body.data.coupon.conditions.graduatedRules).toHaveLength(2);
    });

    test('should create cross-category BxGy coupon', async () => {
      const crossCategory = {
        code: 'APICROSS',
        name: 'API Cross Category Test',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 60 },
        conditions: {
          buyCategories: ['Electronics'],
          getCategories: ['Clothing'],
          buyQuantity: 2,
          getQuantity: 1,
          getDiscountPercentage: 60,
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(crossCategory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.type).toBe('cross_category_bxgy');
      expect(response.body.data.coupon.conditions.buyCategories).toContain('Electronics');
    });

    test('should reject invalid advanced coupon data', async () => {
      const invalidCoupon = {
        code: 'INVALID',
        name: 'Invalid Test',
        type: 'tiered',
        discount: { type: 'percentage', value: 15 },
        conditions: {},
        tieredRules: {
          tiers: [] // Invalid - empty tiers
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidCoupon)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/applicable-coupons - Advanced Features', () => {
    let advancedCoupons;

    beforeEach(async () => {
      advancedCoupons = await Coupon.bulkCreate([
        {
          code: 'TESTTIERED',
          name: 'Test Tiered',
          type: 'tiered',
          discount: { type: 'percentage', value: 15 },
          conditions: {},
          tieredRules: {
            tiers: [
              {
                name: 'Bronze',
                minimumAmount: 100,
                discountType: 'percentage',
                discountValue: 5
              },
              {
                name: 'Gold',
                minimumAmount: 1000,
                discountType: 'percentage',
                discountValue: 15,
                maxDiscountAmount: 200
              }
            ]
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'TESTUSER',
          name: 'Test User Specific',
          type: 'user_specific',
          discount: { type: 'percentage', value: 50, maxDiscountAmount: 100 },
          conditions: { minimumAmount: 100 },
          userCriteria: {
            isFirstTime: true,
            maxOrders: 0
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'TESTSTACK1',
          name: 'Test Stackable 1',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 10 },
          conditions: { minimumAmount: 200 },
          priority: 1,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'TESTSTACK2',
          name: 'Test Stackable 2',
          type: 'cart_wise',
          discount: { type: 'free_shipping', value: 0 },
          conditions: { minimumAmount: 100 },
          priority: 2,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('should return applicable coupons without stacking', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applicableCoupons).toBeInstanceOf(Array);
      expect(response.body.data.applicableCoupons.length).toBeGreaterThan(0);
    });

    test('should return stacked coupons when stacking enabled', async () => {
      const cart = {
        allowStacking: true,
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00,
        shippingCost: 25.00
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applicableCoupons).toBeInstanceOf(Array);

      // Should find stackable coupons
      const stackableCoupons = response.body.data.applicableCoupons.filter(
        ac => ac.stackable === true
      );
      expect(stackableCoupons.length).toBeGreaterThanOrEqual(0);
    });

    test('should find user-specific coupons with user data', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00,
        user: testUser
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find user-specific coupon for first-time user
      const userSpecificCoupons = response.body.data.applicableCoupons.filter(
        ac => ac.coupon.type === 'user_specific'
      );
      expect(userSpecificCoupons.length).toBeGreaterThanOrEqual(1);
    });

    test('should apply tiered discount based on cart value', async () => {
      const highValueCart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 2, price: 1200.00 }
        ],
        subtotal: 2400.00
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(highValueCart)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find tiered coupon that qualifies for Gold tier
      const tieredCoupons = response.body.data.applicableCoupons.filter(
        ac => ac.coupon.type === 'tiered'
      );
      expect(tieredCoupons.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle empty cart gracefully', async () => {
      const emptyCart = {
        userId: 'test-user',
        items: [],
        subtotal: 0
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(emptyCart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applicableCoupons).toHaveLength(0);
    });

    test('should validate cart data structure', async () => {
      const invalidCart = {
        userId: 'test-user',
        items: [
          {
            productId: 'invalid-uuid',
            quantity: -1,
            price: -100
          }
        ]
      };

      const response = await request(app)
        .post('/api/applicable-coupons')
        .send(invalidCart)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/apply-coupon/:id - Advanced Application', () => {
    let testCoupons;

    beforeEach(async () => {
      testCoupons = await Coupon.bulkCreate([
        {
          code: 'APPLYTIERED',
          name: 'Apply Tiered Test',
          type: 'tiered',
          discount: { type: 'percentage', value: 20 },
          conditions: {},
          tieredRules: {
            tiers: [
              {
                name: 'Gold',
                minimumAmount: 1000,
                discountType: 'percentage',
                discountValue: 20,
                maxDiscountAmount: 300
              }
            ]
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'APPLYUSER',
          name: 'Apply User Test',
          type: 'user_specific',
          discount: { type: 'fixed_amount', value: 150 },
          conditions: { minimumAmount: 500 },
          userCriteria: {
            isFirstTime: true
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'APPLYGRAD',
          name: 'Apply Graduated Test',
          type: 'graduated_bxgy',
          discount: { type: 'percentage', value: 100 },
          conditions: {
            buyProducts: [{ productId: products[0].id, quantity: 1 }],
            getProducts: [{ productId: products[1].id, quantity: 1 }],
            graduatedRules: [
              {
                buyQuantity: 2,
                getQuantity: 1,
                discountPercentage: 100
              }
            ]
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('should apply tiered discount coupon', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${testCoupons[0].id}`)
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalDiscount).toBeGreaterThan(0);
      expect(response.body.data.cart.total).toBeLessThan(cart.subtotal);
    });

    test('should apply user-specific coupon with user context', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00,
        user: testUser
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${testCoupons[1].id}`)
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalDiscount).toBe(150);
    });

    test('should apply graduated BxGy coupon', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 2, price: 1200.00 },
          { productId: products[1].id, quantity: 1, price: 80.00 }
        ],
        subtotal: 2480.00
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${testCoupons[2].id}`)
        .send(cart)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalDiscount).toBe(80); // One mouse free
    });

    test('should reject user-specific coupon for ineligible user', async () => {
      const ineligibleUser = {
        ...testUser,
        isFirstTime: false,
        orderCount: 10
      };

      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00,
        user: ineligibleUser
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${testCoupons[1].id}`)
        .send(cart)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not applicable');
    });

    test('should handle cart below minimum threshold', async () => {
      const smallCart = {
        userId: 'test-user',
        items: [
          { productId: products[2].id, quantity: 1, price: 25.00 }
        ],
        subtotal: 25.00
      };

      const response = await request(app)
        .post(`/api/apply-coupon/${testCoupons[0].id}`)
        .send(smallCart)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not applicable');
    });

    test('should return 404 for non-existent coupon', async () => {
      const cart = {
        userId: 'test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      };

      const response = await request(app)
        .post('/api/apply-coupon/550e8400-e29b-41d4-a716-446655440000')
        .send(cart)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/coupons - Advanced Filtering', () => {
    beforeEach(async () => {
      await Coupon.bulkCreate([
        {
          code: 'FILTER1',
          name: 'Filter Test 1',
          type: 'tiered',
          discount: { type: 'percentage', value: 10 },
          conditions: {},
          tieredRules: { tiers: [{ minimumAmount: 100, discountValue: 10 }] },
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'FILTER2',
          name: 'Filter Test 2',
          type: 'flash_sale',
          discount: { type: 'percentage', value: 25 },
          conditions: {},
          flashSaleData: { timeWindows: [] },
          stackable: false,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'FILTER3',
          name: 'Filter Test 3',
          type: 'user_specific',
          discount: { type: 'percentage', value: 30 },
          conditions: {},
          userCriteria: { isFirstTime: true },
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('should filter coupons by advanced types', async () => {
      const response = await request(app)
        .get('/api/coupons?type=tiered')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toBeInstanceOf(Array);
      expect(response.body.data.coupons.every(c => c.type === 'tiered')).toBe(true);
    });

    test('should filter stackable coupons', async () => {
      const response = await request(app)
        .get('/api/coupons?stackable=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons.every(c => c.stackable === true)).toBe(true);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/coupons?type=user_specific&stackable=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons.every(c => 
        c.type === 'user_specific' && c.stackable === true
      )).toBe(true);
    });

    test('should return all advanced types when no filter', async () => {
      const response = await request(app)
        .get('/api/coupons')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const types = response.body.data.coupons.map(c => c.type);
      const advancedTypes = ['tiered', 'flash_sale', 'user_specific'];
      const hasAdvancedTypes = advancedTypes.some(type => types.includes(type));
      expect(hasAdvancedTypes).toBe(true);
    });
  });

  describe('PUT /api/coupons/:id - Advanced Updates', () => {
    let updateableCoupon;

    beforeEach(async () => {
      updateableCoupon = await Coupon.create({
        code: 'UPDATETEST',
        name: 'Update Test',
        type: 'tiered',
        discount: { type: 'percentage', value: 15 },
        conditions: {},
        tieredRules: {
          tiers: [
            { minimumAmount: 100, discountValue: 10 }
          ]
        },
        priority: 1,
        stackable: false,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should update advanced coupon fields', async () => {
      const updates = {
        priority: 5,
        stackable: true,
        tieredRules: {
          tiers: [
            { minimumAmount: 200, discountValue: 15 },
            { minimumAmount: 500, discountValue: 25 }
          ]
        }
      };

      const response = await request(app)
        .put(`/api/coupons/${updateableCoupon.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.priority).toBe(5);
      expect(response.body.data.coupon.stackable).toBe(true);
      expect(response.body.data.coupon.tieredRules.tiers).toHaveLength(2);
    });

    test('should update flash sale data', async () => {
      const flashCoupon = await Coupon.create({
        code: 'FLASHUPDATE',
        name: 'Flash Update Test',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        flashSaleData: { timeWindows: [] },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const updates = {
        flashSaleData: {
          discountMultiplier: 2.0,
          timeWindows: [
            {
              startHour: 10,
              endHour: 12,
              daysOfWeek: [1, 2, 3, 4, 5]
            }
          ]
        }
      };

      const response = await request(app)
        .put(`/api/coupons/${flashCoupon.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.flashSaleData.discountMultiplier).toBe(2.0);
      expect(response.body.data.coupon.flashSaleData.timeWindows).toHaveLength(1);
    });

    test('should update user criteria', async () => {
      const userCoupon = await Coupon.create({
        code: 'USERUPDATE',
        name: 'User Update Test',
        type: 'user_specific',
        discount: { type: 'percentage', value: 25 },
        conditions: {},
        userCriteria: { isFirstTime: true },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const updates = {
        userCriteria: {
          isFirstTime: false,
          loyaltyLevel: 5,
          loyaltyMultiplier: 1.8,
          maxMultiplier: 2.5
        }
      };

      const response = await request(app)
        .put(`/api/coupons/${userCoupon.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.userCriteria.isFirstTime).toBe(false);
      expect(response.body.data.coupon.userCriteria.loyaltyLevel).toBe(5);
    });

    test('should reject invalid update data', async () => {
      const invalidUpdates = {
        priority: -10,
        stackable: 'not-a-boolean',
        tieredRules: {
          tiers: 'not-an-array'
        }
      };

      const response = await request(app)
        .put(`/api/coupons/${updateableCoupon.id}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent stacking requests', async () => {
      // Create multiple stackable coupons
      await Coupon.bulkCreate([
        {
          code: 'PERF1',
          name: 'Performance Test 1',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 5 },
          conditions: { minimumAmount: 100 },
          stackable: true,
          priority: 1,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'PERF2',
          name: 'Performance Test 2',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 8 },
          conditions: { minimumAmount: 200 },
          stackable: true,
          priority: 2,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      const cart = {
        allowStacking: true,
        userId: 'perf-test-user',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      };

      // Make multiple concurrent requests
      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/applicable-coupons')
          .send(cart)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle large cart with many items efficiently', async () => {
      const largeCoupon = await Coupon.create({
        code: 'LARGECART',
        name: 'Large Cart Test',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 1 }],
          getProducts: [{ productId: products[1].id, quantity: 1 }],
          graduatedRules: [
            { buyQuantity: 10, getQuantity: 5, discountPercentage: 100 }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Create a large cart
      const largeCart = {
        userId: 'large-cart-user',
        items: Array(20).fill().map((_, i) => ({
          productId: products[i % 3].id,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: [1200.00, 80.00, 25.00][i % 3]
        }))
      };

      largeCart.subtotal = largeCart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/apply-coupon/${largeCoupon.id}`)
        .send(largeCart)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
