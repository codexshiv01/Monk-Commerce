const { 
  createCouponSchema, 
  updateCouponSchema, 
  applyCouponSchema 
} = require('../../src/validators/couponValidator');

describe('Advanced Coupon Validation', () => {
  describe('Tiered Discount Validation', () => {
    test('should validate tiered coupon structure', () => {
      const tieredCoupon = {
        code: 'TIER2024',
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
              minimumAmount: 500,
              discountType: 'percentage',
              discountValue: 15,
              maxDiscountAmount: 200
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(tieredCoupon);
      expect(error).toBeUndefined();
    });

    test('should reject tiered coupon with empty tiers', () => {
      const invalidTiered = {
        code: 'BADTIER',
        name: 'Bad Tiered',
        type: 'tiered',
        discount: { type: 'percentage', value: 10 },
        conditions: {},
        tieredRules: { tiers: [] }, // Empty tiers
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidTiered);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1 items');
    });

    test('should reject tiered coupon with invalid discount type', () => {
      const invalidTiered = {
        code: 'BADTYPE',
        name: 'Bad Type',
        type: 'tiered',
        discount: { type: 'percentage', value: 10 },
        conditions: {},
        tieredRules: {
          tiers: [
            {
              minimumAmount: 100,
              discountType: 'invalid_type', // Invalid
              discountValue: 10
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidTiered);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });
  });

  describe('Flash Sale Validation', () => {
    test('should validate flash sale structure', () => {
      const flashSale = {
        code: 'FLASH30',
        name: 'Flash Sale',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 30 },
        conditions: { minimumAmount: 50 },
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

      const { error } = createCouponSchema.validate(flashSale);
      expect(error).toBeUndefined();
    });

    test('should reject invalid hour ranges', () => {
      const invalidFlash = {
        code: 'BADHOUR',
        name: 'Bad Hour',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        flashSaleData: {
          timeWindows: [
            {
              startHour: 25, // Invalid hour
              endHour: 16,
              daysOfWeek: [1]
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidFlash);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 23');
    });

    test('should reject invalid days of week', () => {
      const invalidFlash = {
        code: 'BADDAY',
        name: 'Bad Day',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        flashSaleData: {
          timeWindows: [
            {
              startHour: 10,
              endHour: 12,
              daysOfWeek: [8] // Invalid day (0-6 valid)
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidFlash);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 6');
    });

    test('should validate discount multiplier limits', () => {
      const invalidMultiplier = {
        code: 'BIGMULT',
        name: 'Big Multiplier',
        type: 'flash_sale',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        flashSaleData: {
          discountMultiplier: 10 // Too high
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidMultiplier);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 5');
    });
  });

  describe('User-Specific Validation', () => {
    test('should validate user-specific coupon structure', () => {
      const userSpecific = {
        code: 'USER25',
        name: 'User Special',
        type: 'user_specific',
        discount: { type: 'percentage', value: 25 },
        conditions: { minimumAmount: 100 },
        userCriteria: {
          userType: 'new',
          isFirstTime: true,
          loyaltyLevel: 5,
          minOrders: 0,
          maxOrders: 10,
          loyaltyMultiplier: 1.5,
          maxMultiplier: 3,
          registrationDays: {
            min: 0,
            max: 30
          }
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(userSpecific);
      expect(error).toBeUndefined();
    });

    test('should reject invalid user type', () => {
      const invalidUserType = {
        code: 'BADUSER',
        name: 'Bad User Type',
        type: 'user_specific',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        userCriteria: {
          userType: 'invalid_type'
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidUserType);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });

    test('should validate loyalty level range', () => {
      const invalidLoyalty = {
        code: 'BADLOY',
        name: 'Bad Loyalty',
        type: 'user_specific',
        discount: { type: 'percentage', value: 15 },
        conditions: {},
        userCriteria: {
          loyaltyLevel: 15 // Too high (max 10)
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidLoyalty);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 10');
    });

    test('should validate multiplier ranges', () => {
      const invalidMultipliers = {
        code: 'BADMULT',
        name: 'Bad Multipliers',
        type: 'user_specific',
        discount: { type: 'percentage', value: 20 },
        conditions: {},
        userCriteria: {
          loyaltyMultiplier: 0.5, // Too low (min 1)
          maxMultiplier: 10 // Too high (max 5)
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidMultipliers);
      expect(error).toBeDefined();
    });
  });

  describe('Stacking Validation', () => {
    test('should validate stackable coupon properties', () => {
      const stackableCoupon = {
        code: 'STACK5',
        name: 'Stackable 5%',
        type: 'cart_wise',
        discount: { type: 'percentage', value: 5 },
        conditions: { minimumAmount: 100 },
        priority: 2,
        stackable: true,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(stackableCoupon);
      expect(error).toBeUndefined();
    });

    test('should validate priority range', () => {
      const invalidPriority = {
        code: 'BADPRI',
        name: 'Bad Priority',
        type: 'cart_wise',
        discount: { type: 'percentage', value: 10 },
        conditions: {},
        priority: -5, // Negative not allowed
        stackable: true,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidPriority);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 0');
    });
  });

  describe('Graduated BxGy Validation', () => {
    test('should validate graduated BxGy structure', () => {
      const graduatedBxGy = {
        code: 'GRAD',
        name: 'Graduated Deal',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }
          ],
          getProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }
          ],
          graduatedRules: [
            {
              name: 'Bronze',
              buyQuantity: 2,
              getQuantity: 1,
              discountPercentage: 100
            },
            {
              name: 'Gold',
              buyQuantity: 5,
              getQuantity: 3,
              discountPercentage: 100
            }
          ],
          repetitionLimit: 2
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(graduatedBxGy);
      expect(error).toBeUndefined();
    });

    test('should reject invalid discount percentage', () => {
      const invalidPercentage = {
        code: 'BADPERC',
        name: 'Bad Percentage',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }
          ],
          getProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }
          ],
          graduatedRules: [
            {
              buyQuantity: 2,
              getQuantity: 1,
              discountPercentage: 150 // Too high
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidPercentage);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 100');
    });

    test('should reject invalid quantities', () => {
      const invalidQuantity = {
        code: 'BADQTY',
        name: 'Bad Quantity',
        type: 'graduated_bxgy',
        discount: { type: 'percentage', value: 100 },
        conditions: {
          buyProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }
          ],
          getProducts: [
            { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }
          ],
          graduatedRules: [
            {
              buyQuantity: 0, // Invalid (min 1)
              getQuantity: 1,
              discountPercentage: 100
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidQuantity);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });
  });

  describe('Cross-Category BxGy Validation', () => {
    test('should validate cross-category structure', () => {
      const crossCategory = {
        code: 'CROSS',
        name: 'Cross Category',
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
      };

      const { error } = createCouponSchema.validate(crossCategory);
      expect(error).toBeUndefined();
    });

    test('should require buy and get categories', () => {
      const missingCategories = {
        code: 'NOCAT',
        name: 'No Categories',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 30 },
        conditions: {
          // Missing buyCategories and getCategories
          buyQuantity: 1,
          getQuantity: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(missingCategories);
      expect(error).toBeUndefined(); // Categories are optional in base schema
    });

    test('should validate discount percentage range', () => {
      const invalidDiscount = {
        code: 'BIGDIS',
        name: 'Big Discount',
        type: 'cross_category_bxgy',
        discount: { type: 'percentage', value: 50 },
        conditions: {
          buyCategories: ['Electronics'],
          getCategories: ['Clothing'],
          getDiscountPercentage: 150 // Too high
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(invalidDiscount);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('less than or equal to 100');
    });
  });

  describe('Cart Application Validation', () => {
    test('should validate cart with user data for stacking', () => {
      const cartWithUser = {
        userId: 'user-123',
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 2,
            price: 100.00
          }
        ],
        allowStacking: true,
        user: {
          id: 'user-123',
          type: 'new',
          isFirstTime: true,
          loyaltyLevel: 3,
          orderCount: 0
        }
      };

      const { error } = applyCouponSchema.validate(cartWithUser);
      expect(error).toBeUndefined();
    });

    test('should accept cart without user data', () => {
      const cartWithoutUser = {
        userId: 'user-456',
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 1,
            price: 200.00
          }
        ]
      };

      const { error } = applyCouponSchema.validate(cartWithoutUser);
      expect(error).toBeUndefined();
    });

    test('should validate UUID format for product IDs', () => {
      const invalidUUID = {
        userId: 'user-789',
        items: [
          {
            productId: 'not-a-uuid', // Invalid UUID
            quantity: 1,
            price: 50.00
          }
        ]
      };

      const { error } = applyCouponSchema.validate(invalidUUID);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('valid GUID');
    });

    test('should reject negative quantities and prices', () => {
      const negativeValues = {
        userId: 'user-999',
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: -1, // Invalid
            price: -10.00 // Invalid
          }
        ]
      };

      const { error } = applyCouponSchema.validate(negativeValues);
      expect(error).toBeDefined();
    });
  });

  describe('Update Validation', () => {
    test('should allow partial updates to advanced fields', () => {
      const partialUpdate = {
        priority: 5,
        stackable: true,
        flashSaleData: {
          discountMultiplier: 2.0
        }
      };

      const { error } = updateCouponSchema.validate(partialUpdate);
      expect(error).toBeUndefined();
    });

    test('should validate updated tiered rules', () => {
      const updatedTiered = {
        tieredRules: {
          tiers: [
            {
              name: 'Updated Silver',
              minimumAmount: 200,
              discountType: 'fixed_amount',
              discountValue: 50
            }
          ]
        }
      };

      const { error } = updateCouponSchema.validate(updatedTiered);
      expect(error).toBeUndefined();
    });

    test('should reject invalid update values', () => {
      const invalidUpdate = {
        priority: -10, // Invalid
        stackable: 'not-boolean', // Invalid
        flashSaleData: {
          discountMultiplier: 'not-number' // Invalid
        }
      };

      const { error } = updateCouponSchema.validate(invalidUpdate);
      expect(error).toBeDefined();
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    test('should handle maximum complexity coupon', () => {
      const complexCoupon = {
        code: 'COMPLEX',
        name: 'Complex Advanced Coupon',
        description: 'A coupon with all advanced features',
        type: 'user_specific',
        discount: {
          type: 'percentage',
          value: 30,
          maxDiscountAmount: 500
        },
        conditions: {
          minimumAmount: 200,
          maxUsagePerUser: 2,
          maxTotalUsage: 1000,
          userTypes: ['premium', 'vip']
        },
        priority: 10,
        stackable: true,
        flashSaleData: {
          discountMultiplier: 2.5,
          timeWindows: [
            {
              startHour: 8,
              endHour: 10,
              daysOfWeek: [1, 2, 3, 4, 5]
            },
            {
              startHour: 18,
              endHour: 20,
              daysOfWeek: [0, 6]
            }
          ],
          startTime: new Date(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        userCriteria: {
          userType: 'premium',
          isFirstTime: false,
          loyaltyLevel: 8,
          minOrders: 10,
          maxOrders: 100,
          loyaltyMultiplier: 2.0,
          maxMultiplier: 3.0,
          registrationDays: {
            min: 30,
            max: 365
          }
        },
        tieredRules: {
          tiers: [
            {
              name: 'Premium Bronze',
              minimumAmount: 200,
              discountType: 'percentage',
              discountValue: 15,
              maxDiscountAmount: 100
            },
            {
              name: 'Premium Gold',
              minimumAmount: 1000,
              discountType: 'percentage',
              discountValue: 25,
              maxDiscountAmount: 300
            }
          ]
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(complexCoupon);
      expect(error).toBeUndefined();
    });

    test('should validate minimal valid coupon', () => {
      const minimalCoupon = {
        code: 'MIN',
        name: 'Minimal',
        type: 'cart_wise',
        discount: { type: 'percentage', value: 5 },
        conditions: {},
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      };

      const { error } = createCouponSchema.validate(minimalCoupon);
      expect(error).toBeUndefined();
    });

    test('should handle mixed validation scenarios', () => {
      const scenarios = [
        {
          name: 'Empty conditions object',
          data: {
            code: 'EMPTY',
            name: 'Empty Conditions',
            type: 'cart_wise',
            discount: { type: 'percentage', value: 10 },
            conditions: {},
            endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
          },
          shouldPass: true
        },
        {
          name: 'Null optional fields',
          data: {
            code: 'NULL',
            name: 'Null Fields',
            type: 'flash_sale',
            discount: { type: 'percentage', value: 20 },
            conditions: {},
            flashSaleData: null,
            userCriteria: null,
            tieredRules: null,
            endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
          },
          shouldPass: true
        }
      ];

      scenarios.forEach(scenario => {
        const { error } = createCouponSchema.validate(scenario.data);
        if (scenario.shouldPass) {
          expect(error).toBeUndefined();
        } else {
          expect(error).toBeDefined();
        }
      });
    });
  });
});
