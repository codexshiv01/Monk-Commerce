const { sequelize, Product, Coupon, Cart } = require('../setup');

// Mock the DiscountService to use our test models
const DiscountService = require('../../src/services/DiscountService');

describe('Advanced Coupon Features - Comprehensive Tests', () => {
  let products;
  let sampleUser;

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
      },
      {
        name: 'Sneakers',
        price: 150.00,
        category: 'Footwear',
        brand: 'Sport',
        sku: 'SHOES001',
        stock: 75
      },
      {
        name: 'Headphones',
        price: 200.00,
        category: 'Electronics',
        brand: 'Audio',
        sku: 'HEADPHONES001',
        stock: 30
      }
    ]);

    sampleUser = {
      id: 'user-123',
      type: 'new',
      isFirstTime: true,
      loyaltyLevel: 3,
      orderCount: 0,
      registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
  });

  describe('🎯 Tiered Discount Coupons', () => {
    let tieredCoupon;

    beforeEach(async () => {
      tieredCoupon = await Coupon.create({
        code: 'TIERED2024',
        name: 'Progressive Tiered Discount',
        type: 'tiered',
        discount: { type: 'percentage', value: 15 },
        conditions: {},
        tieredRules: {
          tiers: [
            {
              name: 'Bronze Tier',
              minimumAmount: 100,
              discountType: 'percentage',
              discountValue: 5,
              maxDiscountAmount: 50
            },
            {
              name: 'Silver Tier',
              minimumAmount: 300,
              discountType: 'percentage',
              discountValue: 10,
              maxDiscountAmount: 100
            },
            {
              name: 'Gold Tier',
              minimumAmount: 500,
              discountType: 'percentage',
              discountValue: 15,
              maxDiscountAmount: 200
            },
            {
              name: 'Platinum Tier',
              minimumAmount: 1000,
              discountType: 'percentage',
              discountValue: 20,
              maxDiscountAmount: 500
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should select Bronze tier for $150 cart', () => {
      const discount = tieredCoupon.getTieredDiscount(150);
      expect(discount).not.toBeNull();
      expect(discount.tier).toBe('Bronze Tier');
      expect(discount.value).toBe(5);
    });

    test('should select Silver tier for $350 cart', () => {
      const discount = tieredCoupon.getTieredDiscount(350);
      expect(discount).not.toBeNull();
      expect(discount.tier).toBe('Silver Tier');
      expect(discount.value).toBe(10);
    });

    test('should select Gold tier for $750 cart', () => {
      const discount = tieredCoupon.getTieredDiscount(750);
      expect(discount).not.toBeNull();
      expect(discount.tier).toBe('Gold Tier');
      expect(discount.value).toBe(15);
    });

    test('should select Platinum tier for $1500 cart', () => {
      const discount = tieredCoupon.getTieredDiscount(1500);
      expect(discount).not.toBeNull();
      expect(discount.tier).toBe('Platinum Tier');
      expect(discount.value).toBe(20);
    });

    test('should return null for cart below minimum threshold', () => {
      const discount = tieredCoupon.getTieredDiscount(50);
      expect(discount).toBeNull();
    });

    test('should apply maximum discount cap', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 5, price: 1200.00 }
        ],
        subtotal: 6000.00
      });

      const result = DiscountService.calculateTieredDiscount(cart, tieredCoupon, []);
      expect(result.totalDiscount).toBe(500); // Capped at Platinum max
    });
  });

  describe('⚡ Flash Sale Coupons', () => {
    let flashSaleCoupon;

    beforeEach(async () => {
      flashSaleCoupon = await Coupon.create({
        code: 'FLASH25',
        name: 'Flash Sale 25% Off',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 25 },
        conditions: { minimumAmount: 50 },
        flashSaleData: {
          discountMultiplier: 1.5,
          timeWindows: [
            {
              startHour: new Date().getHours(), // Current hour
              endHour: new Date().getHours() + 1,
              daysOfWeek: [new Date().getDay()] // Today
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should detect active flash sale during time window', () => {
      expect(flashSaleCoupon.isFlashSaleActive()).toBe(true);
    });

    test('should apply multiplied discount during flash sale', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      });

      const result = DiscountService.calculateFlashSaleDiscount(cart, flashSaleCoupon, []);
      // 25% * 1.5 multiplier = 37.5% discount
      expect(result.totalDiscount).toBeCloseTo(450, 1);
    });

    test('should create flash sale with different time windows', async () => {
      const weekendFlash = await Coupon.create({
        code: 'WEEKEND',
        name: 'Weekend Flash',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 30 },
        conditions: {},
        flashSaleData: {
          timeWindows: [
            {
              startHour: 9,
              endHour: 21,
              daysOfWeek: [0, 6] // Sunday and Saturday
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(weekendFlash.flashSaleData.timeWindows).toHaveLength(1);
      expect(weekendFlash.flashSaleData.timeWindows[0].daysOfWeek).toEqual([0, 6]);
    });
  });

  describe('👤 User-Specific Coupons', () => {
    let newUserCoupon;
    let loyaltyCoupon;

    beforeEach(async () => {
      newUserCoupon = await Coupon.create({
        code: 'NEWUSER50',
        name: 'New User Special',
        type: 'user_specific',
        discount: { type: 'percentage', value: 50, maxDiscountAmount: 100 },
        conditions: { minimumAmount: 75 },
        userCriteria: {
          isFirstTime: true,
          maxOrders: 0
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      loyaltyCoupon = await Coupon.create({
        code: 'LOYALTY15',
        name: 'Loyalty Program',
        type: 'user_specific',
        discount: { type: 'percentage', value: 15 },
        conditions: { minimumAmount: 100 },
        userCriteria: {
          loyaltyLevel: 5,
          loyaltyMultiplier: 1.2,
          maxMultiplier: 2.0
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should validate new user eligibility', () => {
      const newUser = { ...sampleUser, isFirstTime: true, orderCount: 0 };
      expect(newUserCoupon.checkUserEligibility(newUser)).toBe(true);
    });

    test('should reject existing user for new user coupon', () => {
      const existingUser = { ...sampleUser, isFirstTime: false, orderCount: 5 };
      expect(newUserCoupon.checkUserEligibility(existingUser)).toBe(false);
    });

    test('should validate loyalty level requirements', () => {
      const loyalUser = { ...sampleUser, loyaltyLevel: 7 };
      expect(loyaltyCoupon.checkUserEligibility(loyalUser)).toBe(true);
      
      const basicUser = { ...sampleUser, loyaltyLevel: 3 };
      expect(loyaltyCoupon.checkUserEligibility(basicUser)).toBe(false);
    });

    test('should apply loyalty multiplier correctly', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1000.00 }
        ],
        subtotal: 1000.00
      });

      const loyalUser = { ...sampleUser, loyaltyLevel: 8 };
      const result = DiscountService.calculateUserSpecificDiscount(cart, loyaltyCoupon, [], loyalUser);
      
      // 15% * 1.2 multiplier * loyaltyLevel(8) but capped at maxMultiplier(2.0)
      const expectedMultiplier = Math.min(1.2 * 8, 2.0);
      const expectedDiscount = (1000 * 15 * expectedMultiplier) / 100;
      expect(result.totalDiscount).toBeCloseTo(expectedDiscount, 1);
    });

    test('should handle user criteria with order count limits', async () => {
      const limitedCoupon = await Coupon.create({
        code: 'LIMITED5',
        name: 'Limited Orders Coupon',
        type: 'user_specific',
        discount: { type: 'fixed_amount', value: 20 },
        conditions: {},
        userCriteria: {
          minOrders: 2,
          maxOrders: 10
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const qualifyingUser = { ...sampleUser, orderCount: 5 };
      const tooFewUser = { ...sampleUser, orderCount: 1 };
      const tooManyUser = { ...sampleUser, orderCount: 15 };

      expect(limitedCoupon.checkUserEligibility(qualifyingUser)).toBe(true);
      expect(limitedCoupon.checkUserEligibility(tooFewUser)).toBe(false);
      expect(limitedCoupon.checkUserEligibility(tooManyUser)).toBe(false);
    });
  });

  describe('🔥 Coupon Stacking', () => {
    let stackableCoupons;

    beforeEach(async () => {
      stackableCoupons = await Coupon.bulkCreate([
        {
          code: 'STACK5',
          name: 'Stackable 5%',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 5 },
          conditions: { minimumAmount: 100 },
          priority: 1,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'STACK10',
          name: 'Stackable 10%',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 10, maxDiscountAmount: 50 },
          conditions: { minimumAmount: 200 },
          priority: 2,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'STACKSHIP',
          name: 'Stackable Free Shipping',
          type: 'cart_wise',
          discount: { type: 'free_shipping', value: 0 },
          conditions: { minimumAmount: 75 },
          priority: 3,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'BIGDEAL',
          name: 'Non-stackable 25%',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 25 },
          conditions: { minimumAmount: 150 },
          priority: 1,
          stackable: false,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('should generate all possible stacking combinations', () => {
      const stackables = stackableCoupons.filter(c => c.stackable);
      const mockCoupons = stackables.map(c => ({ priority: c.priority, stackable: c.stackable }));
      
      const combinations = DiscountService.generateStackingCombinations(mockCoupons);
      expect(combinations.length).toBeGreaterThan(0);
      expect(combinations.some(combo => combo.length > 1)).toBe(true);
    });

    test('should prioritize best discount combination', () => {
      const applicableCoupons = [
        { coupon: stackableCoupons[0], discountAmount: 25, stackable: true, priority: 1 },
        { coupon: stackableCoupons[1], discountAmount: 50, stackable: true, priority: 2 },
        { coupon: stackableCoupons[2], discountAmount: 15, stackable: true, priority: 3 },
        { coupon: stackableCoupons[3], discountAmount: 125, stackable: false, priority: 1 }
      ];

      const cart = { subtotal: 500 };
      const result = DiscountService.calculateStackedCoupons(applicableCoupons, cart);
      
      // Should choose the single 25% non-stackable (125) over stacking combination (90)
      expect(result).toHaveLength(1);
      expect(result[0].discountAmount).toBe(125);
    });

    test('should handle complex stacking scenarios', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 800.00 }
        ],
        subtotal: 800.00,
        shippingCost: 25.00
      });

      const applicableCoupons = [
        { coupon: stackableCoupons[0], discountAmount: 40, stackable: true, priority: 1 },
        { coupon: stackableCoupons[1], discountAmount: 50, stackable: true, priority: 2 },
        { coupon: stackableCoupons[2], discountAmount: 25, stackable: true, priority: 3 }
      ];

      const result = DiscountService.calculateStackedCoupons(applicableCoupons, cart);
      const totalDiscount = result.reduce((sum, ac) => sum + ac.discountAmount, 0);
      expect(totalDiscount).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(1); // Should stack multiple coupons
    });
  });

  describe('📈 Graduated BxGy Coupons', () => {
    let graduatedCoupon;

    beforeEach(async () => {
      graduatedCoupon = await Coupon.create({
        code: 'GRADUATE',
        name: 'Graduated Buy More Get More',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 1 }],
          getProducts: [{ productId: products[1].id, quantity: 1 }],
          graduatedRules: [
            {
              name: 'Bronze Deal',
              buyQuantity: 1,
              getQuantity: 1,
              discountPercentage: 100
            },
            {
              name: 'Silver Deal',
              buyQuantity: 3,
              getQuantity: 2,
              discountPercentage: 100
            },
            {
              name: 'Gold Deal',
              buyQuantity: 5,
              getQuantity: 4,
              discountPercentage: 100
            },
            {
              name: 'Platinum Deal',
              buyQuantity: 10,
              getQuantity: 8,
              discountPercentage: 100
            }
          ],
          repetitionLimit: 2
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply Bronze tier for small quantities', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 2, price: 1200.00 },
          { productId: products[1].id, quantity: 2, price: 80.00 }
        ],
        subtotal: 2560.00
      });

      const result = DiscountService.calculateGraduatedBxGyDiscount(cart, graduatedCoupon, cart.items);
      expect(result.totalDiscount).toBeGreaterThan(0);
      expect(result.tierApplied).toContain('Bronze');
    });

    test('should apply highest qualifying tier', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 12, price: 1200.00 }, // More than Gold tier requirement
          { productId: products[1].id, quantity: 8, price: 80.00 }
        ],
        subtotal: 15040.00
      });

      const result = DiscountService.calculateGraduatedBxGyDiscount(cart, graduatedCoupon, cart.items);
      expect(result.totalDiscount).toBeGreaterThan(0);
      expect(result.tierApplied).toContain('Platinum');
      expect(result.applicationsUsed).toBe(1); // Limited by repetition limit
    });

    test('should handle partial discount percentages', async () => {
      const partialCoupon = await Coupon.create({
        code: 'PARTIAL50',
        name: 'Partial Graduated Deal',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 50 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 1 }],
          getProducts: [{ productId: products[1].id, quantity: 1 }],
          graduatedRules: [
            {
              name: 'Half Off Deal',
              buyQuantity: 2,
              getQuantity: 1,
              discountPercentage: 50
            }
          ],
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 2, price: 1200.00 },
          { productId: products[1].id, quantity: 1, price: 80.00 }
        ],
        subtotal: 2480.00
      });

      const result = DiscountService.calculateGraduatedBxGyDiscount(cart, partialCoupon, cart.items);
      expect(result.totalDiscount).toBe(40); // 50% of 80
    });
  });

  describe('🔀 Cross-Category BxGy Coupons', () => {
    let crossCategoryCoupon;

    beforeEach(async () => {
      crossCategoryCoupon = await Coupon.create({
        code: 'CROSSCAT',
        name: 'Electronics + Clothing Deal',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 50 },
        conditions: {
          buyCategories: ['Electronics'],
          getCategories: ['Clothing', 'Footwear'],
          buyQuantity: 2,
          getQuantity: 1,
          getDiscountPercentage: 50,
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply discount when requirements are met', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }, // Electronics
          { productId: products[1].id, quantity: 1, price: 80.00 },   // Electronics
          { productId: products[2].id, quantity: 2, price: 25.00 },   // Clothing
          { productId: products[3].id, quantity: 1, price: 150.00 }   // Footwear
        ],
        subtotal: 1480.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const result = DiscountService.calculateCrossCategoryBxGyDiscount(cart, crossCategoryCoupon, enrichedItems);
      expect(result.totalDiscount).toBeGreaterThan(0);
      expect(result.buyCategories).toContain('Electronics');
      expect(result.getCategories).toContain('Clothing');
    });

    test('should fail when insufficient buy category products', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }, // Only 1 Electronics
          { productId: products[2].id, quantity: 1, price: 25.00 }    // Clothing
        ],
        subtotal: 1225.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const applicabilityResult = DiscountService.checkCrossCategoryBxGyApplicability(cart, crossCategoryCoupon, enrichedItems);
      expect(applicabilityResult.isApplicable).toBe(false);
      expect(applicabilityResult.reason).toContain('Need 2 products from categories: Electronics');
    });

    test('should handle multiple get categories', async () => {
      const multiCategoryCoupon = await Coupon.create({
        code: 'MULTICAT',
        name: 'Multi-Category Deal',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 30 },
        conditions: {
          buyCategories: ['Electronics'],
          getCategories: ['Clothing', 'Footwear'],
          buyQuantity: 1,
          getQuantity: 2,
          getDiscountPercentage: 30,
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }, // Electronics
          { productId: products[2].id, quantity: 1, price: 25.00 },   // Clothing
          { productId: products[3].id, quantity: 1, price: 150.00 }   // Footwear
        ],
        subtotal: 1375.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const result = DiscountService.calculateCrossCategoryBxGyDiscount(cart, multiCategoryCoupon, enrichedItems);
      expect(result.totalDiscount).toBeCloseTo(52.5, 1); // 30% of (150 + 25)
    });
  });

  describe('💯 Percentage BxGy Coupons', () => {
    let percentageCoupon;

    beforeEach(async () => {
      percentageCoupon = await Coupon.create({
        code: 'HALF OFF',
        name: 'Buy 2 Get 50% Off',
        type: 'bxgy',
        discount: { type: 'percentage', value: 50 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 2 }],
          getProducts: [{ productId: products[0].id, quantity: 1 }],
          repetitionLimit: 2
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply 50% discount instead of 100% free', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 3, price: 1200.00 }
        ],
        subtotal: 3600.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const result = DiscountService.calculateBxGyDiscount(cart, percentageCoupon, enrichedItems);
      expect(result.totalDiscount).toBe(600); // 50% of 1200
    });

    test('should handle multiple applications with percentage discount', () => {
      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 6, price: 1200.00 } // Can apply twice
        ],
        subtotal: 7200.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const result = DiscountService.calculateBxGyDiscount(cart, percentageCoupon, enrichedItems);
      expect(result.totalDiscount).toBe(1200); // 50% of 2400 (2 applications)
    });
  });

  describe('🧪 Complex Integration Scenarios', () => {
    test('should handle cart with multiple advanced coupon eligibilities', async () => {
      // Create a complex scenario with multiple coupon types
      const coupons = await Coupon.bulkCreate([
        {
          code: 'TIER50',
          name: 'Tiered 50%',
          type: 'tiered',
          discount: { type: 'percentage', value: 20 },
          conditions: {},
          tieredRules: {
            tiers: [
              { minimumAmount: 1000, discountType: 'percentage', discountValue: 20 }
            ]
          },
          stackable: true,
          priority: 1,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'USER25',
          name: 'User Special',
          type: 'user_specific',
          discount: { type: 'fixed_amount', value: 100 },
          conditions: { minimumAmount: 500 },
          userCriteria: { isFirstTime: true },
          stackable: true,
          priority: 2,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 },
          { productId: products[1].id, quantity: 2, price: 80.00 }
        ],
        subtotal: 1360.00
      });

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(
        cart, 
        coupons, 
        sampleUser, 
        true // Allow stacking
      );

      expect(applicableCoupons.length).toBeGreaterThanOrEqual(1);
      
      // Should find user-specific coupon for first-time user
      const userSpecific = applicableCoupons.find(ac => ac.coupon.type === 'user_specific');
      expect(userSpecific).toBeDefined();
    });

    test('should optimize discount combinations for maximum savings', async () => {
      const coupons = await Coupon.bulkCreate([
        {
          code: 'SMALL5',
          name: 'Small Stackable',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 5 },
          conditions: { minimumAmount: 100 },
          stackable: true,
          priority: 1,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'MEDIUM10',
          name: 'Medium Stackable',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 10 },
          conditions: { minimumAmount: 200 },
          stackable: true,
          priority: 2,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'BIG30',
          name: 'Big Non-Stackable',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 30 },
          conditions: { minimumAmount: 150 },
          stackable: false,
          priority: 1,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1000.00 }
        ],
        subtotal: 1000.00
      });

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(
        cart, 
        coupons, 
        null, 
        true // Allow stacking
      );

      // Should prefer the 30% non-stackable over 15% stackable combination
      expect(applicableCoupons.length).toBeGreaterThan(0);
      
      const totalDiscount = applicableCoupons.reduce((sum, ac) => sum + ac.discountAmount, 0);
      expect(totalDiscount).toBeGreaterThan(0);
    });

    test('should handle large cart with multiple coupon types', async () => {
      // Create a comprehensive test with various coupon types
      const mixedCoupons = await Coupon.bulkCreate([
        {
          code: 'FLASH40',
          name: 'Flash Sale',
          type: 'flash_sale',
          discount: { type: 'percentage', value: 40 },
          conditions: { minimumAmount: 100 },
          flashSaleData: {
            timeWindows: [
              {
                startHour: new Date().getHours(),
                endHour: new Date().getHours() + 1,
                daysOfWeek: [new Date().getDay()]
              }
            ]
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'GRADEBUY',
          name: 'Graduated BxGy',
          type: 'graduated_bxgy',
          discount: { type: 'percentage', value: 100 },
          conditions: {
            buyProducts: [{ productId: products[0].id, quantity: 1 }],
            getProducts: [{ productId: products[1].id, quantity: 1 }],
            graduatedRules: [
              { buyQuantity: 2, getQuantity: 1, discountPercentage: 100 }
            ]
          },
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      const largeCart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 3, price: 1200.00 },
          { productId: products[1].id, quantity: 2, price: 80.00 },
          { productId: products[2].id, quantity: 1, price: 25.00 },
          { productId: products[3].id, quantity: 1, price: 150.00 },
          { productId: products[4].id, quantity: 1, price: 200.00 }
        ],
        subtotal: 4135.00
      });

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(
        largeCart, 
        mixedCoupons, 
        sampleUser, 
        false // Single coupon selection
      );

      expect(applicableCoupons.length).toBeGreaterThan(0);
      
      // Should find the most beneficial coupon
      const maxDiscount = Math.max(...applicableCoupons.map(ac => ac.discountAmount));
      expect(maxDiscount).toBeGreaterThan(0);
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    test('should handle malformed tiered rules gracefully', async () => {
      const malformedTiered = await Coupon.create({
        code: 'BADTIER',
        name: 'Malformed Tiered',
        type: 'tiered',
        discount: { type: 'percentage', value: 10 },
        conditions: {},
        tieredRules: { tiers: null }, // Malformed
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const discount = malformedTiered.getTieredDiscount(500);
      expect(discount).toBeNull();
    });

    test('should handle empty flash sale time windows', async () => {
      const emptyFlash = await Coupon.create({
        code: 'EMPTYFLASH',
        name: 'Empty Flash Sale',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 25 },
        conditions: {},
        flashSaleData: { timeWindows: [] },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(emptyFlash.isFlashSaleActive()).toBe(true); // Should default to active
    });

    test('should handle user eligibility with missing user data', async () => {
      const userCoupon = await Coupon.create({
        code: 'USERTEST',
        name: 'User Test',
        type: 'user_specific',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        userCriteria: { isFirstTime: true },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Should handle gracefully when user is null
      expect(userCoupon.checkUserEligibility(null)).toBe(true);
      expect(userCoupon.checkUserEligibility(undefined)).toBe(true);
    });

    test('should handle graduated BxGy with no qualifying products', async () => {
      const graduatedCoupon = await Coupon.create({
        code: 'NOQUALIFY',
        name: 'No Qualifying Products',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [{ productId: 'non-existent-id', quantity: 1 }],
          getProducts: [{ productId: 'another-non-existent-id', quantity: 1 }],
          graduatedRules: [
            { buyQuantity: 1, getQuantity: 1, discountPercentage: 100 }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const cart = new Cart({
        userId: 'user-123',
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }
        ],
        subtotal: 1200.00
      });

      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }));

      const result = DiscountService.calculateGraduatedBxGyDiscount(cart, graduatedCoupon, enrichedItems);
      expect(result.totalDiscount).toBe(0);
    });
  });
});
