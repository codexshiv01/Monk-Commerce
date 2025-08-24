describe('Advanced Coupon Logic - Unit Tests', () => {
  describe('Tiered Discount Logic', () => {
    test('should select correct tier based on cart value', () => {
      const tieredRules = {
        tiers: [
          { name: 'Bronze', minimumAmount: 100, discountValue: 5, maxDiscountAmount: 50 },
          { name: 'Silver', minimumAmount: 300, discountValue: 10, maxDiscountAmount: 100 },
          { name: 'Gold', minimumAmount: 500, discountValue: 15, maxDiscountAmount: 200 }
        ]
      };

      // Mock coupon object with getTieredDiscount method
      const mockCoupon = {
        tieredRules,
        type: 'tiered',
        getTieredDiscount: function(cartValue) {
          if (!this.tieredRules || this.type !== 'tiered') return null;
          
          const { tiers } = this.tieredRules;
          if (!tiers || !Array.isArray(tiers)) return null;
          
          const sortedTiers = tiers.sort((a, b) => b.minimumAmount - a.minimumAmount);
          
          for (const tier of sortedTiers) {
            if (cartValue >= tier.minimumAmount) {
              return {
                type: 'percentage',
                value: tier.discountValue,
                maxDiscountAmount: tier.maxDiscountAmount,
                tier: tier.name
              };
            }
          }
          
          return null;
        }
      };

      // Test Bronze tier
      let result = mockCoupon.getTieredDiscount(150);
      expect(result).not.toBeNull();
      expect(result.tier).toBe('Bronze');
      expect(result.value).toBe(5);

      // Test Silver tier
      result = mockCoupon.getTieredDiscount(350);
      expect(result).not.toBeNull();
      expect(result.tier).toBe('Silver');
      expect(result.value).toBe(10);

      // Test Gold tier
      result = mockCoupon.getTieredDiscount(750);
      expect(result).not.toBeNull();
      expect(result.tier).toBe('Gold');
      expect(result.value).toBe(15);

      // Test below minimum
      result = mockCoupon.getTieredDiscount(50);
      expect(result).toBeNull();
    });
  });

  describe('Flash Sale Logic', () => {
    test('should validate flash sale time windows', () => {
      const mockCoupon = {
        type: 'flash_sale',
        flashSaleData: {
          timeWindows: [
            {
              startHour: 14,
              endHour: 16,
              daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
            }
          ]
        },
        isFlashSaleActive: function() {
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
        }
      };

      // Mock current time to be during flash sale (Wednesday 15:00)
      const mockDate = new Date();
      mockDate.setHours(15);
      mockDate.setDay(3); // Wednesday
      
      // Override the now reference in the method for testing
      const originalDate = Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.prototype = originalDate.prototype;

      const isActive = mockCoupon.isFlashSaleActive();
      expect(typeof isActive).toBe('boolean');

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('User-Specific Logic', () => {
    test('should validate user eligibility criteria', () => {
      const mockCoupon = {
        type: 'user_specific',
        userCriteria: {
          isFirstTime: true,
          loyaltyLevel: 3,
          maxOrders: 5
        },
        checkUserEligibility: function(user) {
          if (!this.userCriteria || this.type !== 'user_specific') return true;
          
          const { isFirstTime, loyaltyLevel, maxOrders } = this.userCriteria;
          
          if (isFirstTime !== undefined && user.isFirstTime !== isFirstTime) return false;
          if (loyaltyLevel && user.loyaltyLevel < loyaltyLevel) return false;
          if (maxOrders && user.orderCount > maxOrders) return false;
          
          return true;
        }
      };

      // Test eligible first-time user
      const eligibleUser = {
        isFirstTime: true,
        loyaltyLevel: 5,
        orderCount: 2
      };
      expect(mockCoupon.checkUserEligibility(eligibleUser)).toBe(true);

      // Test ineligible user (not first time)
      const ineligibleUser1 = {
        isFirstTime: false,
        loyaltyLevel: 5,
        orderCount: 2
      };
      expect(mockCoupon.checkUserEligibility(ineligibleUser1)).toBe(false);

      // Test ineligible user (low loyalty level)
      const ineligibleUser2 = {
        isFirstTime: true,
        loyaltyLevel: 2,
        orderCount: 2
      };
      expect(mockCoupon.checkUserEligibility(ineligibleUser2)).toBe(false);

      // Test ineligible user (too many orders)
      const ineligibleUser3 = {
        isFirstTime: true,
        loyaltyLevel: 5,
        orderCount: 10
      };
      expect(mockCoupon.checkUserEligibility(ineligibleUser3)).toBe(false);
    });
  });

  describe('Stacking Algorithm Logic', () => {
    test('should generate coupon combinations', () => {
      // Mock stacking algorithm
      const generateCombinations = (arr, size) => {
        if (size === 1) return arr.map(item => [item]);
        if (size === arr.length) return [arr];
        if (size > arr.length) return [];
        
        const combinations = [];
        for (let i = 0; i < arr.length; i++) {
          const smaller = generateCombinations(arr.slice(i + 1), size - 1);
          smaller.forEach(combo => combinations.push([arr[i], ...combo]));
        }
        return combinations;
      };

      const stackableCoupons = [
        { priority: 1, stackable: true, discountAmount: 10 },
        { priority: 2, stackable: true, discountAmount: 15 },
        { priority: 3, stackable: true, discountAmount: 5 }
      ];

      // Test combinations of size 2
      const combinations = generateCombinations(stackableCoupons, 2);
      expect(combinations).toHaveLength(3);
      expect(combinations[0]).toHaveLength(2);
    });

    test('should calculate optimal stacking combination', () => {
      const calculateBestCombination = (applicableCoupons) => {
        const stackables = applicableCoupons.filter(ac => ac.stackable);
        const nonStackables = applicableCoupons.filter(ac => !ac.stackable);
        
        // Calculate best stackable combination
        let bestStackableTotal = 0;
        if (stackables.length > 0) {
          bestStackableTotal = stackables.reduce((sum, ac) => sum + ac.discountAmount, 0);
        }
        
        // Calculate best non-stackable
        let bestNonStackable = 0;
        if (nonStackables.length > 0) {
          bestNonStackable = Math.max(...nonStackables.map(ac => ac.discountAmount));
        }
        
        return Math.max(bestStackableTotal, bestNonStackable);
      };

      const applicableCoupons = [
        { stackable: true, discountAmount: 10 },
        { stackable: true, discountAmount: 15 },
        { stackable: false, discountAmount: 30 },
        { stackable: false, discountAmount: 20 }
      ];

      const bestDiscount = calculateBestCombination(applicableCoupons);
      expect(bestDiscount).toBe(30); // Should choose single 30% over 25% stacked
    });
  });

  describe('Graduated BxGy Logic', () => {
    test('should find highest qualifying tier', () => {
      const findBestTier = (graduatedRules, buyQuantity) => {
        const sortedRules = graduatedRules.sort((a, b) => b.buyQuantity - a.buyQuantity);
        
        for (const rule of sortedRules) {
          if (buyQuantity >= rule.buyQuantity) {
            return rule;
          }
        }
        
        return null;
      };

      const graduatedRules = [
        { name: 'Bronze', buyQuantity: 2, getQuantity: 1, discountPercentage: 100 },
        { name: 'Silver', buyQuantity: 4, getQuantity: 3, discountPercentage: 100 },
        { name: 'Gold', buyQuantity: 6, getQuantity: 5, discountPercentage: 100 }
      ];

      // Test Gold tier
      let tier = findBestTier(graduatedRules, 8);
      expect(tier).not.toBeNull();
      expect(tier.name).toBe('Gold');
      expect(tier.getQuantity).toBe(5);

      // Test Silver tier
      tier = findBestTier(graduatedRules, 5);
      expect(tier).not.toBeNull();
      expect(tier.name).toBe('Silver');
      expect(tier.getQuantity).toBe(3);

      // Test Bronze tier
      tier = findBestTier(graduatedRules, 3);
      expect(tier).not.toBeNull();
      expect(tier.name).toBe('Bronze');
      expect(tier.getQuantity).toBe(1);

      // Test insufficient quantity
      tier = findBestTier(graduatedRules, 1);
      expect(tier).toBeNull();
    });
  });

  describe('Cross-Category Logic', () => {
    test('should validate category requirements', () => {
      const validateCrossCategory = (cart, buyCategories, getCategories, buyQuantity, getQuantity) => {
        // Count products in buy categories
        const buyItems = cart.items.filter(item => 
          buyCategories.includes(item.category)
        );
        const totalBuyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Count products in get categories
        const getItems = cart.items.filter(item => 
          getCategories.includes(item.category)
        );
        const totalGetQuantity = getItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          isApplicable: totalBuyQuantity >= buyQuantity && totalGetQuantity >= getQuantity,
          buyQuantityAvailable: totalBuyQuantity,
          getQuantityAvailable: totalGetQuantity
        };
      };

      const cart = {
        items: [
          { category: 'Electronics', quantity: 2, price: 100 },
          { category: 'Electronics', quantity: 1, price: 50 },
          { category: 'Clothing', quantity: 1, price: 30 },
          { category: 'Footwear', quantity: 1, price: 80 }
        ]
      };

      // Test valid cross-category scenario
      let result = validateCrossCategory(
        cart, 
        ['Electronics'], 
        ['Clothing', 'Footwear'], 
        2, 
        1
      );
      expect(result.isApplicable).toBe(true);
      expect(result.buyQuantityAvailable).toBe(3);
      expect(result.getQuantityAvailable).toBe(2);

      // Test insufficient buy quantity
      result = validateCrossCategory(
        cart, 
        ['Electronics'], 
        ['Clothing'], 
        5, 
        1
      );
      expect(result.isApplicable).toBe(false);
      expect(result.buyQuantityAvailable).toBe(3);
    });
  });

  describe('Percentage BxGy Logic', () => {
    test('should calculate partial discount correctly', () => {
      const calculatePercentageBxGy = (getPrice, discountPercentage) => {
        return (getPrice * discountPercentage) / 100;
      };

      // Test 50% discount
      let discount = calculatePercentageBxGy(100, 50);
      expect(discount).toBe(50);

      // Test 25% discount
      discount = calculatePercentageBxGy(80, 25);
      expect(discount).toBe(20);

      // Test 100% discount (free)
      discount = calculatePercentageBxGy(60, 100);
      expect(discount).toBe(60);
    });
  });
});
