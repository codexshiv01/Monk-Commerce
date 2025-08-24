const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { Op } = require('sequelize');

class DiscountService {
  
  /**
   * Calculate applicable coupons for a given cart (including stacking)
   * @param {Object} cart - Cart object with items
   * @param {Array} availableCoupons - Array of coupon objects
   * @param {Object} user - User object for user-specific coupons
   * @param {Boolean} allowStacking - Whether to allow coupon stacking
   * @returns {Array} Array of applicable coupons with calculated discounts
   */
  static async calculateApplicableCoupons(cart, availableCoupons = null, user = null, allowStacking = false) {
    try {
      // If no coupons provided, fetch all valid coupons
      if (!availableCoupons) {
        availableCoupons = await Coupon.findAll({
          where: {
            isActive: true,
            startDate: { [Op.lte]: new Date() },
            endDate: { [Op.gte]: new Date() }
          }
        });
      }

      const applicableCoupons = [];

      for (const coupon of availableCoupons) {
        if (coupon.hasReachedMaxUsage()) {
          continue;
        }

        // Check user eligibility for user-specific coupons
        if (coupon.type === 'user_specific' && user && !coupon.checkUserEligibility(user)) {
          continue;
        }

        const applicabilityResult = await this.checkCouponApplicability(cart, coupon, user);
        
        if (applicabilityResult.isApplicable) {
          const discountCalculation = await this.calculateDiscount(cart, coupon, user);
          
          applicableCoupons.push({
            coupon: coupon,
            isApplicable: true,
            discountAmount: discountCalculation.totalDiscount,
            freeShipping: discountCalculation.freeShipping,
            affectedItems: discountCalculation.affectedItems,
            reason: applicabilityResult.reason,
            priority: coupon.priority,
            stackable: coupon.stackable
          });
        }
      }

      // Handle coupon stacking if enabled
      if (allowStacking) {
        return this.calculateStackedCoupons(applicableCoupons, cart);
      }

      // Sort by discount amount (highest first)
      return applicableCoupons.sort((a, b) => b.discountAmount - a.discountAmount);
      
    } catch (error) {
      throw new Error(`Error calculating applicable coupons: ${error.message}`);
    }
  }

  /**
   * Check if a coupon is applicable to a cart
   * @param {Object} cart - Cart object
   * @param {Object} coupon - Coupon object
   * @returns {Object} Applicability result
   */
  static async checkCouponApplicability(cart, coupon) {
    try {
      // Basic validity checks
      if (!coupon.isValid) {
        return { isApplicable: false, reason: 'Coupon is not valid or expired' };
      }

      if (coupon.hasReachedMaxUsage()) {
        return { isApplicable: false, reason: 'Coupon has reached maximum usage limit' };
      }

      // Get product details for cart items
      const productIds = cart.items.map(item => item.productId);
      const products = await Product.findAll({ 
        where: { 
          id: { [Op.in]: productIds } 
        } 
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Enrich cart items with product details
      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: productMap.get(item.productId)
      }));

      // Check based on coupon type
      switch (coupon.type) {
        case 'cart_wise':
          return this.checkCartWiseApplicability(cart, coupon, enrichedItems);
        
        case 'product_wise':
          return this.checkProductWiseApplicability(cart, coupon, enrichedItems);
        
        case 'bxgy':
          return this.checkBxGyApplicability(cart, coupon, enrichedItems);
        
        case 'tiered':
          return this.checkTieredApplicability(cart, coupon, enrichedItems);
        
        case 'flash_sale':
          return this.checkFlashSaleApplicability(cart, coupon, enrichedItems);
        
        case 'user_specific':
          return this.checkUserSpecificApplicability(cart, coupon, enrichedItems, user);
        
        case 'graduated_bxgy':
          return this.checkGraduatedBxGyApplicability(cart, coupon, enrichedItems);
        
        case 'cross_category_bxgy':
          return this.checkCrossCategoryBxGyApplicability(cart, coupon, enrichedItems);
        
        default:
          return { isApplicable: false, reason: 'Unknown coupon type' };
      }
    } catch (error) {
      throw new Error(`Error checking coupon applicability: ${error.message}`);
    }
  }

  /**
   * Check cart-wise coupon applicability
   */
  static checkCartWiseApplicability(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    
    // Check minimum amount requirement
    if (conditions.minimumAmount && cart.subtotal < conditions.minimumAmount) {
      return { 
        isApplicable: false, 
        reason: `Cart total must be at least ${conditions.minimumAmount}` 
      };
    }

    return { isApplicable: true, reason: 'Cart meets minimum requirements' };
  }

  /**
   * Check product-wise coupon applicability
   */
  static checkProductWiseApplicability(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    
    // Check if cart contains applicable products
    const hasApplicableProducts = enrichedItems.some(item => {
      const product = item.product;
      if (!product) return false;

      // Check specific products
      if (conditions.applicableProducts && conditions.applicableProducts.length > 0) {
        return conditions.applicableProducts.includes(product.id);
      }

      // Check categories
      if (conditions.applicableCategories && conditions.applicableCategories.length > 0) {
        return conditions.applicableCategories.includes(product.category);
      }

      // Check brands
      if (conditions.applicableBrands && conditions.applicableBrands.length > 0) {
        return conditions.applicableBrands.includes(product.brand);
      }

      return false;
    });

    if (!hasApplicableProducts) {
      return { 
        isApplicable: false, 
        reason: 'Cart does not contain applicable products' 
      };
    }

    return { isApplicable: true, reason: 'Cart contains applicable products' };
  }

  /**
   * Check BxGy coupon applicability
   */
  static checkBxGyApplicability(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    
    if (!conditions.buyProducts || conditions.buyProducts.length === 0) {
      return { isApplicable: false, reason: 'No buy products specified' };
    }

    if (!conditions.getProducts || conditions.getProducts.length === 0) {
      return { isApplicable: false, reason: 'No get products specified' };
    }

    // Count quantities of buy products in cart
    const buyProductCounts = new Map();
    const getProductCounts = new Map();

    // Count available buy products
    enrichedItems.forEach(item => {
      const productId = item.productId;
      const isBuyProduct = conditions.buyProducts.some(bp => 
        bp.productId === productId
      );
      
      if (isBuyProduct) {
        buyProductCounts.set(productId, (buyProductCounts.get(productId) || 0) + item.quantity);
      }

      const isGetProduct = conditions.getProducts.some(gp => 
        gp.productId === productId
      );
      
      if (isGetProduct) {
        getProductCounts.set(productId, (getProductCounts.get(productId) || 0) + item.quantity);
      }
    });

    // Calculate total buy quantity required
    const totalBuyQuantityRequired = conditions.buyProducts.reduce((sum, bp) => sum + bp.quantity, 0);
    const totalBuyQuantityAvailable = Array.from(buyProductCounts.values()).reduce((sum, qty) => sum + qty, 0);

    if (totalBuyQuantityAvailable < totalBuyQuantityRequired) {
      return { 
        isApplicable: false, 
        reason: `Need ${totalBuyQuantityRequired} buy products, but only ${totalBuyQuantityAvailable} available` 
      };
    }

    // Check if we have get products in cart
    const totalGetQuantityAvailable = Array.from(getProductCounts.values()).reduce((sum, qty) => sum + qty, 0);
    if (totalGetQuantityAvailable === 0) {
      return { 
        isApplicable: false, 
        reason: 'No get products found in cart' 
      };
    }

    return { isApplicable: true, reason: 'BxGy requirements met' };
  }

  /**
   * Check tiered coupon applicability
   */
  static checkTieredApplicability(cart, coupon, enrichedItems) {
    const tieredDiscount = coupon.getTieredDiscount(parseFloat(cart.subtotal));
    
    if (!tieredDiscount) {
      return { 
        isApplicable: false, 
        reason: 'Cart value does not meet any tier requirements' 
      };
    }

    return { 
      isApplicable: true, 
      reason: `Qualifies for ${tieredDiscount.tier}` 
    };
  }

  /**
   * Check flash sale coupon applicability
   */
  static checkFlashSaleApplicability(cart, coupon, enrichedItems) {
    if (!coupon.isFlashSaleActive()) {
      return { 
        isApplicable: false, 
        reason: 'Flash sale is not currently active' 
      };
    }

    // Also check any base conditions (like minimum cart value)
    if (coupon.conditions.minimumAmount && cart.subtotal < coupon.conditions.minimumAmount) {
      return { 
        isApplicable: false, 
        reason: `Cart total must be at least ${coupon.conditions.minimumAmount} for flash sale` 
      };
    }

    return { isApplicable: true, reason: 'Flash sale active and conditions met' };
  }

  /**
   * Check user-specific coupon applicability
   */
  static checkUserSpecificApplicability(cart, coupon, enrichedItems, user) {
    if (!user) {
      return { 
        isApplicable: false, 
        reason: 'User information required for user-specific coupon' 
      };
    }

    if (!coupon.checkUserEligibility(user)) {
      return { 
        isApplicable: false, 
        reason: 'User does not meet eligibility criteria' 
      };
    }

    // Check any additional cart conditions
    if (coupon.conditions.minimumAmount && cart.subtotal < coupon.conditions.minimumAmount) {
      return { 
        isApplicable: false, 
        reason: `Cart total must be at least ${coupon.conditions.minimumAmount}` 
      };
    }

    return { isApplicable: true, reason: 'User meets all eligibility criteria' };
  }

  /**
   * Check graduated BxGy coupon applicability
   */
  static checkGraduatedBxGyApplicability(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    
    if (!conditions.graduatedRules || !Array.isArray(conditions.graduatedRules)) {
      return { isApplicable: false, reason: 'No graduated rules specified' };
    }

    // Count buy products in cart
    const buyProductCounts = new Map();
    enrichedItems.forEach(item => {
      const productId = item.productId;
      const isBuyProduct = conditions.buyProducts?.some(bp => bp.productId === productId);
      
      if (isBuyProduct) {
        buyProductCounts.set(productId, (buyProductCounts.get(productId) || 0) + item.quantity);
      }
    });

    const totalBuyQuantity = Array.from(buyProductCounts.values()).reduce((sum, qty) => sum + qty, 0);
    
    // Check if we meet any graduated tier
    const qualifyingTier = conditions.graduatedRules
      .sort((a, b) => b.buyQuantity - a.buyQuantity) // Sort by buy quantity (highest first)
      .find(rule => totalBuyQuantity >= rule.buyQuantity);

    if (!qualifyingTier) {
      return { 
        isApplicable: false, 
        reason: `Need at least ${Math.min(...conditions.graduatedRules.map(r => r.buyQuantity))} buy products` 
      };
    }

    // Check if we have get products in cart
    const hasGetProducts = enrichedItems.some(item => 
      conditions.getProducts?.some(gp => gp.productId === item.productId)
    );

    if (!hasGetProducts) {
      return { 
        isApplicable: false, 
        reason: 'No get products found in cart' 
      };
    }

    return { 
      isApplicable: true, 
      reason: `Qualifies for tier: Buy ${qualifyingTier.buyQuantity} get ${qualifyingTier.getQuantity}` 
    };
  }

  /**
   * Check cross-category BxGy coupon applicability
   */
  static checkCrossCategoryBxGyApplicability(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    
    if (!conditions.buyCategories || !conditions.getCategories) {
      return { isApplicable: false, reason: 'Buy and get categories not specified' };
    }

    // Count products in buy categories
    const buyProductCount = enrichedItems
      .filter(item => item.product && conditions.buyCategories.includes(item.product.category))
      .reduce((sum, item) => sum + item.quantity, 0);

    const requiredBuyQuantity = conditions.buyQuantity || 1;
    if (buyProductCount < requiredBuyQuantity) {
      return { 
        isApplicable: false, 
        reason: `Need ${requiredBuyQuantity} products from categories: ${conditions.buyCategories.join(', ')}` 
      };
    }

    // Check if we have products in get categories
    const hasGetProducts = enrichedItems.some(item => 
      item.product && conditions.getCategories.includes(item.product.category)
    );

    if (!hasGetProducts) {
      return { 
        isApplicable: false, 
        reason: `No products found from get categories: ${conditions.getCategories.join(', ')}` 
      };
    }

    return { isApplicable: true, reason: 'Cross-category BxGy requirements met' };
  }

  /**
   * Calculate discount amount for a coupon
   * @param {Object} cart - Cart object
   * @param {Object} coupon - Coupon object
   * @returns {Object} Discount calculation result
   */
  static async calculateDiscount(cart, coupon) {
    try {
      // Get product details for cart items
      const productIds = cart.items.map(item => item.productId);
      const products = await Product.findAll({ 
        where: { 
          id: { [Op.in]: productIds } 
        } 
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Enrich cart items with product details
      const enrichedItems = cart.items.map(item => ({
        ...item,
        product: productMap.get(item.productId)
      }));

      switch (coupon.type) {
        case 'cart_wise':
          return this.calculateCartWiseDiscount(cart, coupon, enrichedItems);
        
        case 'product_wise':
          return this.calculateProductWiseDiscount(cart, coupon, enrichedItems);
        
        case 'bxgy':
          return this.calculateBxGyDiscount(cart, coupon, enrichedItems);
        
        case 'tiered':
          return this.calculateTieredDiscount(cart, coupon, enrichedItems);
        
        case 'flash_sale':
          return this.calculateFlashSaleDiscount(cart, coupon, enrichedItems);
        
        case 'user_specific':
          return this.calculateUserSpecificDiscount(cart, coupon, enrichedItems, user);
        
        case 'graduated_bxgy':
          return this.calculateGraduatedBxGyDiscount(cart, coupon, enrichedItems);
        
        case 'cross_category_bxgy':
          return this.calculateCrossCategoryBxGyDiscount(cart, coupon, enrichedItems);
        
        default:
          return { totalDiscount: 0, freeShipping: false, affectedItems: [] };
      }
    } catch (error) {
      throw new Error(`Error calculating discount: ${error.message}`);
    }
  }

  /**
   * Calculate cart-wise discount
   */
  static calculateCartWiseDiscount(cart, coupon, enrichedItems) {
    const { discount } = coupon;
    let totalDiscount = 0;
    let freeShipping = false;

    if (discount.type === 'percentage') {
      totalDiscount = (parseFloat(cart.subtotal) * discount.value) / 100;
      
      // Apply maximum discount limit if specified
      if (discount.maxDiscountAmount && totalDiscount > discount.maxDiscountAmount) {
        totalDiscount = discount.maxDiscountAmount;
      }
    } else if (discount.type === 'fixed_amount') {
      totalDiscount = Math.min(discount.value, parseFloat(cart.subtotal));
    } else if (discount.type === 'free_shipping') {
      freeShipping = true;
      totalDiscount = parseFloat(cart.shippingCost || 0);
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100, // Round to 2 decimal places
      freeShipping,
      affectedItems: enrichedItems.map(item => ({
        productId: item.productId,
        discountAmount: (totalDiscount * (item.price * item.quantity)) / parseFloat(cart.subtotal)
      }))
    };
  }

  /**
   * Calculate product-wise discount
   */
  static calculateProductWiseDiscount(cart, coupon, enrichedItems) {
    const { discount, conditions } = coupon;
    let totalDiscount = 0;
    const affectedItems = [];

    enrichedItems.forEach(item => {
      const product = item.product;
      if (!product) return;

      let isApplicable = false;

      // Check if product is applicable
      if (conditions.applicableProducts && conditions.applicableProducts.length > 0) {
        isApplicable = conditions.applicableProducts.includes(product.id);
      } else if (conditions.applicableCategories && conditions.applicableCategories.length > 0) {
        isApplicable = conditions.applicableCategories.includes(product.category);
      } else if (conditions.applicableBrands && conditions.applicableBrands.length > 0) {
        isApplicable = conditions.applicableBrands.includes(product.brand);
      }

      if (isApplicable) {
        const itemTotal = item.price * item.quantity;
        let itemDiscount = 0;

        if (discount.type === 'percentage') {
          itemDiscount = (itemTotal * discount.value) / 100;
          
          // Apply maximum discount limit if specified
          if (discount.maxDiscountAmount && itemDiscount > discount.maxDiscountAmount) {
            itemDiscount = discount.maxDiscountAmount;
          }
        } else if (discount.type === 'fixed_amount') {
          itemDiscount = Math.min(discount.value, itemTotal);
        }

        totalDiscount += itemDiscount;
        affectedItems.push({
          productId: item.productId,
          discountAmount: Math.round(itemDiscount * 100) / 100
        });
      }
    });

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping: false,
      affectedItems
    };
  }

  /**
   * Calculate BxGy discount
   */
  static calculateBxGyDiscount(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    let totalDiscount = 0;
    const affectedItems = [];

    // Count quantities of buy and get products
    const buyProductCounts = new Map();
    const getProductItems = [];

    enrichedItems.forEach(item => {
      const productId = item.productId;
      
      // Check if this is a buy product
      const isBuyProduct = conditions.buyProducts.some(bp => 
        bp.productId === productId
      );
      
      if (isBuyProduct) {
        buyProductCounts.set(productId, (buyProductCounts.get(productId) || 0) + item.quantity);
      }

      // Check if this is a get product
      const isGetProduct = conditions.getProducts.some(gp => 
        gp.productId === productId
      );
      
      if (isGetProduct) {
        getProductItems.push(item);
      }
    });

    // Calculate how many times we can apply the offer
    const totalBuyQuantityRequired = conditions.buyProducts.reduce((sum, bp) => sum + bp.quantity, 0);
    const totalBuyQuantityAvailable = Array.from(buyProductCounts.values()).reduce((sum, qty) => sum + qty, 0);
    
    const maxApplications = Math.floor(totalBuyQuantityAvailable / totalBuyQuantityRequired);
    const actualApplications = Math.min(maxApplications, conditions.repetitionLimit || 1);

    if (actualApplications > 0) {
      // Calculate total get quantity we can offer for free
      const totalGetQuantityPerApplication = conditions.getProducts.reduce((sum, gp) => sum + gp.quantity, 0);
      const totalFreeQuantity = actualApplications * totalGetQuantityPerApplication;

      // Sort get products by price (highest first) to maximize discount
      getProductItems.sort((a, b) => b.price - a.price);

      let remainingFreeQuantity = totalFreeQuantity;
      
      for (const item of getProductItems) {
        if (remainingFreeQuantity <= 0) break;
        
        const quantityToDiscount = Math.min(item.quantity, remainingFreeQuantity);
        const itemDiscount = quantityToDiscount * item.price;
        
        totalDiscount += itemDiscount;
        affectedItems.push({
          productId: item.productId,
          discountAmount: Math.round(itemDiscount * 100) / 100,
          freeQuantity: quantityToDiscount
        });
        
        remainingFreeQuantity -= quantityToDiscount;
      }
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping: false,
      affectedItems,
      applicationsUsed: actualApplications
    };
  }

  /**
   * Apply coupon to cart and return updated cart
   * @param {Object} cart - Cart object
   * @param {Object} coupon - Coupon object
   * @returns {Object} Updated cart with applied discount
   */
  static async applyCouponToCart(cart, coupon) {
    try {
      // Check if coupon is applicable
      const applicabilityResult = await this.checkCouponApplicability(cart, coupon);
      
      if (!applicabilityResult.isApplicable) {
        throw new Error(`Coupon not applicable: ${applicabilityResult.reason}`);
      }

      // Calculate discount
      const discountCalculation = await this.calculateDiscount(cart, coupon);

      // Clear existing coupons (assuming only one coupon can be applied at a time)
      cart.clearCoupons();

      // Apply new coupon
      const appliedCoupons = [...cart.appliedCoupons];
      appliedCoupons.push({
        couponId: coupon.id,
        code: coupon.code,
        discountAmount: discountCalculation.totalDiscount
      });
      cart.appliedCoupons = appliedCoupons;

      cart.totalDiscount = discountCalculation.totalDiscount;
      cart.freeShipping = discountCalculation.freeShipping;

      // Update individual item discounts
      const items = cart.items.map(item => {
        const affectedItem = discountCalculation.affectedItems.find(ai => 
          ai.productId === item.productId
        );
        
        if (affectedItem) {
          return {
            ...item,
            discountAmount: affectedItem.discountAmount,
            finalPrice: (item.price * item.quantity) - affectedItem.discountAmount
          };
        }
        return item;
      });
      
      cart.items = items;

      // Recalculate total
      cart.calculateTotal();

      return cart;
    } catch (error) {
      throw new Error(`Error applying coupon to cart: ${error.message}`);
    }
  }

  /**
   * Calculate stacked coupons with priority resolution
   */
  static calculateStackedCoupons(applicableCoupons, cart) {
    // Separate stackable from non-stackable coupons
    const stackableCoupons = applicableCoupons.filter(ac => ac.stackable);
    const nonStackableCoupons = applicableCoupons.filter(ac => !ac.stackable);

    // If no stackable coupons, return highest discount non-stackable
    if (stackableCoupons.length === 0) {
      return nonStackableCoupons.sort((a, b) => b.discountAmount - a.discountAmount).slice(0, 1);
    }

    // Calculate best stacking combination
    const stackingCombinations = this.generateStackingCombinations(stackableCoupons);
    
    // Add single non-stackable options
    stackingCombinations.push(...nonStackableCoupons.map(coupon => [coupon]));

    // Find combination with highest total discount
    let bestCombination = [];
    let bestDiscount = 0;

    for (const combination of stackingCombinations) {
      const totalDiscount = combination.reduce((sum, ac) => sum + ac.discountAmount, 0);
      if (totalDiscount > bestDiscount) {
        bestDiscount = totalDiscount;
        bestCombination = combination;
      }
    }

    return bestCombination;
  }

  /**
   * Generate all valid stacking combinations
   */
  static generateStackingCombinations(stackableCoupons) {
    const combinations = [];
    
    // Sort by priority (highest first)
    const sortedCoupons = stackableCoupons.sort((a, b) => b.priority - a.priority);
    
    // Generate all possible combinations (up to 3 coupons for performance)
    for (let i = 1; i <= Math.min(3, sortedCoupons.length); i++) {
      combinations.push(...this.getCombinations(sortedCoupons, i));
    }
    
    return combinations;
  }

  /**
   * Get combinations of specified size
   */
  static getCombinations(arr, size) {
    if (size === 1) return arr.map(item => [item]);
    
    const combinations = [];
    for (let i = 0; i < arr.length - size + 1; i++) {
      const head = arr[i];
      const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
      tailCombinations.forEach(combination => {
        combinations.push([head, ...combination]);
      });
    }
    return combinations;
  }

  /**
   * Calculate tiered discount
   */
  static calculateTieredDiscount(cart, coupon, enrichedItems) {
    const tieredDiscount = coupon.getTieredDiscount(parseFloat(cart.subtotal));
    
    if (!tieredDiscount) {
      return { totalDiscount: 0, freeShipping: false, affectedItems: [] };
    }

    let totalDiscount = 0;
    let freeShipping = false;

    if (tieredDiscount.type === 'percentage') {
      totalDiscount = (parseFloat(cart.subtotal) * tieredDiscount.value) / 100;
      
      if (tieredDiscount.maxDiscountAmount && totalDiscount > tieredDiscount.maxDiscountAmount) {
        totalDiscount = tieredDiscount.maxDiscountAmount;
      }
    } else if (tieredDiscount.type === 'fixed_amount') {
      totalDiscount = Math.min(tieredDiscount.value, parseFloat(cart.subtotal));
    } else if (tieredDiscount.type === 'free_shipping') {
      freeShipping = true;
      totalDiscount = parseFloat(cart.shippingCost || 0);
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping,
      affectedItems: enrichedItems.map(item => ({
        productId: item.productId,
        discountAmount: (totalDiscount * (item.price * item.quantity)) / parseFloat(cart.subtotal)
      })),
      tierApplied: tieredDiscount.tier
    };
  }

  /**
   * Calculate flash sale discount
   */
  static calculateFlashSaleDiscount(cart, coupon, enrichedItems) {
    // Flash sales use the base discount but may have multipliers
    const { discount, flashSaleData } = coupon;
    const multiplier = flashSaleData?.discountMultiplier || 1;

    let totalDiscount = 0;
    let freeShipping = false;

    if (discount.type === 'percentage') {
      totalDiscount = (parseFloat(cart.subtotal) * discount.value * multiplier) / 100;
      
      if (discount.maxDiscountAmount && totalDiscount > discount.maxDiscountAmount) {
        totalDiscount = discount.maxDiscountAmount;
      }
    } else if (discount.type === 'fixed_amount') {
      totalDiscount = Math.min(discount.value * multiplier, parseFloat(cart.subtotal));
    } else if (discount.type === 'free_shipping') {
      freeShipping = true;
      totalDiscount = parseFloat(cart.shippingCost || 0);
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping,
      affectedItems: enrichedItems.map(item => ({
        productId: item.productId,
        discountAmount: (totalDiscount * (item.price * item.quantity)) / parseFloat(cart.subtotal)
      }))
    };
  }

  /**
   * Calculate user-specific discount
   */
  static calculateUserSpecificDiscount(cart, coupon, enrichedItems, user) {
    // User-specific coupons may have user-based multipliers
    const { discount, userCriteria } = coupon;
    
    // Calculate loyalty multiplier
    let multiplier = 1;
    if (user && userCriteria?.loyaltyMultiplier && user.loyaltyLevel) {
      multiplier = Math.min(userCriteria.loyaltyMultiplier * user.loyaltyLevel, userCriteria.maxMultiplier || 2);
    }

    let totalDiscount = 0;
    let freeShipping = false;

    if (discount.type === 'percentage') {
      totalDiscount = (parseFloat(cart.subtotal) * discount.value * multiplier) / 100;
      
      if (discount.maxDiscountAmount && totalDiscount > discount.maxDiscountAmount) {
        totalDiscount = discount.maxDiscountAmount;
      }
    } else if (discount.type === 'fixed_amount') {
      totalDiscount = Math.min(discount.value * multiplier, parseFloat(cart.subtotal));
    } else if (discount.type === 'free_shipping') {
      freeShipping = true;
      totalDiscount = parseFloat(cart.shippingCost || 0);
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping,
      affectedItems: enrichedItems.map(item => ({
        productId: item.productId,
        discountAmount: (totalDiscount * (item.price * item.quantity)) / parseFloat(cart.subtotal)
      })),
      loyaltyMultiplier: multiplier
    };
  }

  /**
   * Calculate graduated BxGy discount
   */
  static calculateGraduatedBxGyDiscount(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    let totalDiscount = 0;
    const affectedItems = [];

    // Count buy products
    const buyProductCounts = new Map();
    enrichedItems.forEach(item => {
      const productId = item.productId;
      const isBuyProduct = conditions.buyProducts?.some(bp => bp.productId === productId);
      
      if (isBuyProduct) {
        buyProductCounts.set(productId, (buyProductCounts.get(productId) || 0) + item.quantity);
      }
    });

    const totalBuyQuantity = Array.from(buyProductCounts.values()).reduce((sum, qty) => sum + qty, 0);
    
    // Find the best graduated tier
    const qualifyingTier = conditions.graduatedRules
      .sort((a, b) => b.buyQuantity - a.buyQuantity)
      .find(rule => totalBuyQuantity >= rule.buyQuantity);

    if (qualifyingTier) {
      // Calculate how many times we can apply this tier
      const applications = Math.floor(totalBuyQuantity / qualifyingTier.buyQuantity);
      const maxApplications = Math.min(applications, conditions.repetitionLimit || 1);
      
      // Get products for discount
      const getProductItems = enrichedItems.filter(item => 
        conditions.getProducts?.some(gp => gp.productId === item.productId)
      );

      // Sort by price (highest first) to maximize discount
      getProductItems.sort((a, b) => b.price - a.price);

      let remainingFreeQuantity = maxApplications * qualifyingTier.getQuantity;
      
      for (const item of getProductItems) {
        if (remainingFreeQuantity <= 0) break;
        
        const quantityToDiscount = Math.min(item.quantity, remainingFreeQuantity);
        
        // Check if this is partial discount (percentage) or full free
        const discountPercentage = qualifyingTier.discountPercentage || 100;
        const itemDiscount = (quantityToDiscount * item.price * discountPercentage) / 100;
        
        totalDiscount += itemDiscount;
        affectedItems.push({
          productId: item.productId,
          discountAmount: Math.round(itemDiscount * 100) / 100,
          freeQuantity: quantityToDiscount,
          discountPercentage
        });
        
        remainingFreeQuantity -= quantityToDiscount;
      }
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping: false,
      affectedItems,
      tierApplied: qualifyingTier?.name || 'Unknown',
      applicationsUsed: Math.floor(totalBuyQuantity / (qualifyingTier?.buyQuantity || 1))
    };
  }

  /**
   * Calculate cross-category BxGy discount
   */
  static calculateCrossCategoryBxGyDiscount(cart, coupon, enrichedItems) {
    const { conditions } = coupon;
    let totalDiscount = 0;
    const affectedItems = [];

    // Count products in buy categories
    const buyProductCount = enrichedItems
      .filter(item => item.product && conditions.buyCategories.includes(item.product.category))
      .reduce((sum, item) => sum + item.quantity, 0);

    const requiredBuyQuantity = conditions.buyQuantity || 1;
    const applications = Math.floor(buyProductCount / requiredBuyQuantity);
    const maxApplications = Math.min(applications, conditions.repetitionLimit || 1);

    if (maxApplications > 0) {
      // Get products from get categories
      const getProductItems = enrichedItems.filter(item => 
        item.product && conditions.getCategories.includes(item.product.category)
      );

      // Sort by price (highest first) to maximize discount
      getProductItems.sort((a, b) => b.price - a.price);

      const getQuantityPerApplication = conditions.getQuantity || 1;
      let remainingFreeQuantity = maxApplications * getQuantityPerApplication;
      
      for (const item of getProductItems) {
        if (remainingFreeQuantity <= 0) break;
        
        const quantityToDiscount = Math.min(item.quantity, remainingFreeQuantity);
        
        // Support percentage discount on get products
        const discountPercentage = conditions.getDiscountPercentage || 100;
        const itemDiscount = (quantityToDiscount * item.price * discountPercentage) / 100;
        
        totalDiscount += itemDiscount;
        affectedItems.push({
          productId: item.productId,
          discountAmount: Math.round(itemDiscount * 100) / 100,
          freeQuantity: quantityToDiscount,
          discountPercentage,
          category: item.product.category
        });
        
        remainingFreeQuantity -= quantityToDiscount;
      }
    }

    return {
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      freeShipping: false,
      affectedItems,
      applicationsUsed: maxApplications,
      buyCategories: conditions.buyCategories,
      getCategories: conditions.getCategories
    };
  }
}

module.exports = DiscountService;