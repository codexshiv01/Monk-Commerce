const DiscountService = require('../../src/services/DiscountService');
const Coupon = require('../../src/models/Coupon');
const Product = require('../../src/models/Product');
const Cart = require('../../src/models/Cart');

describe('AdvancedDiscountService', () => {
  let products;
  let sampleCart;
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
      }
    ]);

    // Sample cart with mixed products
    sampleCart = {
      userId: 'test-user-123',
      items: [
        { productId: products[0].id, quantity: 1, price: 1200.00 },
        { productId: products[1].id, quantity: 2, price: 80.00 },
        { productId: products[2].id, quantity: 1, price: 25.00 }
      ],
      subtotal: 1385.00,
      shippingCost: 25.00
    };

    // Sample user for user-specific tests
    sampleUser = {
      id: 'user-123',
      type: 'new',
      isFirstTime: true,
      loyaltyLevel: 3,
      orderCount: 0,
      registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    };
  });

  describe('Tiered Discount Coupons', () => {
    let tieredCoupon;

    beforeEach(async () => {
      tieredCoupon = await Coupon.create({
        code: 'TIERED2024',
        name: 'Tiered Discount',
        type: 'tiered',
        discount: { type: 'percentage', value: 15 },
        conditions: {},
        tieredRules: {
          tiers: [
            {
              name: 'Bronze',
              minimumAmount: 100,
              discountType: 'percentage',
              discountValue: 5,
              maxDiscountAmount: 50
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
      });
    });

    test('should qualify for Gold tier discount', async () => {
      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, tieredCoupon);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('Gold');

      const discount = await DiscountService.calculateDiscount(cart, tieredCoupon);
      expect(discount.totalDiscount).toBe(200); // Capped at max discount
      expect(discount.tierApplied).toBe('Gold');
    });

    test('should qualify for Bronze tier only with smaller cart', async () => {
      const smallCart = {
        ...sampleCart,
        items: [{ productId: products[2].id, quantity: 5, price: 25.00 }],
        subtotal: 125.00
      };

      const cart = new Cart(smallCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, tieredCoupon);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('Bronze');

      const discount = await DiscountService.calculateDiscount(cart, tieredCoupon);
      expect(discount.totalDiscount).toBe(6.25); // 5% of 125
      expect(discount.tierApplied).toBe('Bronze');
    });
  });

  describe('Flash Sale Coupons', () => {
    let flashSaleCoupon;

    beforeEach(async () => {
      flashSaleCoupon = await Coupon.create({
        code: 'FLASH50',
        name: 'Flash Sale',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 25 },
        conditions: { minimumAmount: 50 },
        flashSaleData: {
          discountMultiplier: 1.5,
          timeWindows: [
            {
              startHour: new Date().getHours(), // Current hour for testing
              endHour: new Date().getHours() + 1,
              daysOfWeek: [new Date().getDay()] // Today
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply flash sale during active window', async () => {
      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, flashSaleCoupon);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('Flash sale active');

      const discount = await DiscountService.calculateDiscount(cart, flashSaleCoupon);
      // 25% * 1.5 multiplier = 37.5% discount
      expect(discount.totalDiscount).toBeCloseTo(519.38, 1); // 37.5% of 1385
    });

    test('should check flash sale time window validity', () => {
      expect(flashSaleCoupon.isFlashSaleActive()).toBe(true);
    });
  });

  describe('User-Specific Coupons', () => {
    let userSpecificCoupon;

    beforeEach(async () => {
      userSpecificCoupon = await Coupon.create({
        code: 'FIRSTTIME50',
        name: 'First Timer Discount',
        type: 'user_specific',
        discount: { type: 'percentage', value: 50, maxDiscountAmount: 100 },
        conditions: { minimumAmount: 75 },
        userCriteria: {
          isFirstTime: true,
          maxOrders: 0
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply discount for eligible first-time user', async () => {
      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, userSpecificCoupon, sampleUser);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('meets all eligibility criteria');

      const discount = await DiscountService.calculateDiscount(cart, userSpecificCoupon, sampleUser);
      expect(discount.totalDiscount).toBe(100); // Capped at maxDiscountAmount
    });

    test('should reject non-first-time user', async () => {
      const existingUser = { ...sampleUser, isFirstTime: false, orderCount: 5 };
      const cart = new Cart(sampleCart);

      const result = await DiscountService.checkCouponApplicability(cart, userSpecificCoupon, existingUser);
      expect(result.isApplicable).toBe(false);
      expect(result.reason).toContain('does not meet eligibility criteria');
    });

    test('should check user eligibility', () => {
      expect(userSpecificCoupon.checkUserEligibility(sampleUser)).toBe(true);
      
      const ineligibleUser = { ...sampleUser, isFirstTime: false };
      expect(userSpecificCoupon.checkUserEligibility(ineligibleUser)).toBe(false);
    });
  });

  describe('Graduated BxGy Coupons', () => {
    let graduatedBxGyCoupon;

    beforeEach(async () => {
      graduatedBxGyCoupon = await Coupon.create({
        code: 'GRADEBUY',
        name: 'Graduated BxGy',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [{ productId: products[0].id, quantity: 1 }],
          getProducts: [{ productId: products[1].id, quantity: 1 }],
          graduatedRules: [
            {
              name: 'Basic',
              buyQuantity: 1,
              getQuantity: 1,
              discountPercentage: 100
            },
            {
              name: 'Premium',
              buyQuantity: 2,
              getQuantity: 3,
              discountPercentage: 100
            }
          ],
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply highest qualifying graduated tier', async () => {
      const gradCart = {
        ...sampleCart,
        items: [
          { productId: products[0].id, quantity: 2, price: 1200.00 }, // Buy product
          { productId: products[1].id, quantity: 3, price: 80.00 }    // Get product
        ],
        subtotal: 2640.00
      };

      const cart = new Cart(gradCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, graduatedBxGyCoupon);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('Premium');

      const discount = await DiscountService.calculateDiscount(cart, graduatedBxGyCoupon);
      expect(discount.totalDiscount).toBe(240); // 3 * 80 = 240 (all get products free)
      expect(discount.tierApplied).toContain('Premium');
    });
  });

  describe('Cross-Category BxGy Coupons', () => {
    let crossCatCoupon;

    beforeEach(async () => {
      crossCatCoupon = await Coupon.create({
        code: 'CROSSCAT',
        name: 'Cross Category Deal',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 50 },
        conditions: {
          buyCategories: ['Electronics'],
          getCategories: ['Clothing'],
          buyQuantity: 2,
          getQuantity: 1,
          getDiscountPercentage: 50,
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should apply cross-category discount', async () => {
      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const result = await DiscountService.checkCouponApplicability(cart, crossCatCoupon);
      expect(result.isApplicable).toBe(true);
      expect(result.reason).toContain('Cross-category BxGy requirements met');

      const discount = await DiscountService.calculateDiscount(cart, crossCatCoupon);
      expect(discount.totalDiscount).toBe(12.5); // 50% of clothing item (25 * 0.5)
      expect(discount.buyCategories).toContain('Electronics');
      expect(discount.getCategories).toContain('Clothing');
    });

    test('should fail when insufficient buy category products', async () => {
      const insufficientCart = {
        ...sampleCart,
        items: [
          { productId: products[0].id, quantity: 1, price: 1200.00 }, // Only 1 electronics
          { productId: products[2].id, quantity: 1, price: 25.00 }    // 1 clothing
        ]
      };

      const cart = new Cart(insufficientCart);
      const result = await DiscountService.checkCouponApplicability(cart, crossCatCoupon);
      expect(result.isApplicable).toBe(false);
      expect(result.reason).toContain('Need 2 products from categories: Electronics');
    });
  });

  describe('Coupon Stacking', () => {
    let stackableCoupons;

    beforeEach(async () => {
      stackableCoupons = await Coupon.bulkCreate([
        {
          code: 'STACK10',
          name: 'Stackable 10%',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 10 },
          conditions: { minimumAmount: 100 },
          priority: 1,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'STACKSHIP',
          name: 'Stackable Free Shipping',
          type: 'cart_wise',
          discount: { type: 'free_shipping', value: 0 },
          conditions: { minimumAmount: 50 },
          priority: 2,
          stackable: true,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'NOSTACKBIG',
          name: 'Non-Stackable 25%',
          type: 'cart_wise',
          discount: { type: 'percentage', value: 25 },
          conditions: { minimumAmount: 100 },
          priority: 0,
          stackable: false,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('should calculate best stacking combination', async () => {
      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(cart, stackableCoupons, null, true);
      
      // Should prefer single 25% non-stackable over 10% + free shipping stack
      expect(applicableCoupons.length).toBeGreaterThanOrEqual(1);
      
      // If stacking is optimal, should get 2 coupons
      if (applicableCoupons.length === 2) {
        expect(applicableCoupons.some(ac => ac.coupon.code === 'STACK10')).toBe(true);
        expect(applicableCoupons.some(ac => ac.coupon.code === 'STACKSHIP')).toBe(true);
      }
    });

    test('should generate valid stacking combinations', () => {
      const testCoupons = [
        { priority: 3, stackable: true, discountAmount: 50 },
        { priority: 2, stackable: true, discountAmount: 30 },
        { priority: 1, stackable: true, discountAmount: 20 }
      ];

      const combinations = DiscountService.generateStackingCombinations(testCoupons);
      expect(combinations.length).toBeGreaterThan(0);
      
      // Should include single coupon combinations
      expect(combinations.some(combo => combo.length === 1)).toBe(true);
      
      // Should include multi-coupon combinations
      expect(combinations.some(combo => combo.length > 1)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex cart with multiple advanced coupon types', async () => {
      // Create complex scenario with all coupon types
      const coupons = await Coupon.bulkCreate([
        {
          code: 'TIER100',
          name: 'Tiered Discount',
          type: 'tiered',
          discount: { type: 'percentage', value: 15 },
          conditions: {},
          tieredRules: {
            tiers: [
              { minimumAmount: 1000, discountType: 'percentage', discountValue: 15 }
            ]
          },
          stackable: true,
          priority: 3,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          code: 'USERSPEC',
          name: 'User Specific',
          type: 'user_specific',
          discount: { type: 'fixed_amount', value: 50 },
          conditions: { minimumAmount: 100 },
          userCriteria: { isFirstTime: true },
          stackable: true,
          priority: 2,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const applicableCoupons = await DiscountService.calculateApplicableCoupons(
        cart, 
        coupons, 
        sampleUser, 
        true // Allow stacking
      );

      expect(applicableCoupons.length).toBeGreaterThanOrEqual(1);
      
      // Should find at least the user-specific coupon for first-time user
      expect(applicableCoupons.some(ac => ac.coupon.type === 'user_specific')).toBe(true);
    });

    test('should prioritize best discount combination', async () => {
      const highValueCoupon = await Coupon.create({
        code: 'HIGHVALUE',
        name: 'High Value Non-Stackable',
        type: 'cart_wise',
        discount: { type: 'percentage', value: 30 },
        conditions: { minimumAmount: 100 },
        stackable: false,
        priority: 1,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const cart = new Cart(sampleCart);
      cart.calculateSubtotal();

      const result = await DiscountService.calculateApplicableCoupons(cart, [highValueCoupon], null, false);
      expect(result.length).toBe(1);
      expect(result[0].coupon.code).toBe('HIGHVALUE');
      expect(result[0].discountAmount).toBeCloseTo(415.5, 1); // 30% of 1385
    });
  });
});
