const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');
require('dotenv').config();

const advancedCoupons = [
  // Tiered Discount Coupon
  {
    code: 'TIERED2024',
    name: 'Tiered Discount - Spend More Save More',
    description: 'Progressive discounts: 5% off $100+, 10% off $300+, 15% off $500+',
    type: 'tiered',
    discount: {
      type: 'percentage',
      value: 15 // Max tier value
    },
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
        }
      ]
    },
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    isActive: true
  },

  // Flash Sale Coupon
  {
    code: 'FLASHFRIDAY',
    name: 'Friday Flash Sale',
    description: 'Extra 25% off every Friday 6-8 PM',
    type: 'flash_sale',
    discount: {
      type: 'percentage',
      value: 25
    },
    conditions: {
      minimumAmount: 50
    },
    flashSaleData: {
      discountMultiplier: 1.5, // Boost the discount by 50%
      timeWindows: [
        {
          startHour: 18, // 6 PM
          endHour: 20,   // 8 PM
          daysOfWeek: [5] // Friday only
        }
      ]
    },
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    isActive: true
  },

  // User-Specific Coupon (First-time users)
  {
    code: 'WELCOME50',
    name: 'First Timer Special',
    description: 'Exclusive 50% off for first-time customers',
    type: 'user_specific',
    discount: {
      type: 'percentage',
      value: 50,
      maxDiscountAmount: 100
    },
    conditions: {
      minimumAmount: 75
    },
    userCriteria: {
      isFirstTime: true,
      maxOrders: 0
    },
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true
  },

  // User-Specific Coupon (Loyalty program)
  {
    code: 'LOYALTY20',
    name: 'Loyalty Rewards',
    description: 'Loyalty discount that scales with your level',
    type: 'user_specific',
    discount: {
      type: 'percentage',
      value: 20
    },
    conditions: {
      minimumAmount: 100
    },
    userCriteria: {
      loyaltyLevel: 3,
      loyaltyMultiplier: 1.5,
      maxMultiplier: 3
    },
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
    isActive: true
  },

  // Stackable Cart-wise Coupon
  {
    code: 'STACK10',
    name: 'Stackable 10% Off',
    description: 'Can be combined with other stackable coupons',
    type: 'cart_wise',
    discount: {
      type: 'percentage',
      value: 10,
      maxDiscountAmount: 50
    },
    conditions: {
      minimumAmount: 150
    },
    priority: 1,
    stackable: true,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    isActive: true
  },

  // Stackable Free Shipping
  {
    code: 'STACKSHIP',
    name: 'Stackable Free Shipping',
    description: 'Free shipping that stacks with other offers',
    type: 'cart_wise',
    discount: {
      type: 'free_shipping',
      value: 0
    },
    conditions: {
      minimumAmount: 75
    },
    priority: 2,
    stackable: true,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    isActive: true
  }
];

const seedAdvancedCoupons = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync database to add new fields
    await sequelize.sync({ alter: true });
    console.log('Database synchronized with new fields');

    // Get existing products for BxGy coupons
    const products = await Product.findAll({ limit: 6 });
    
    if (products.length < 2) {
      console.log('⚠️  Not enough products found. Run "npm run seed" first to create basic products.');
      process.exit(1);
    }

    // Add graduated BxGy coupon
    const graduatedBxGy = {
      code: 'GRADUATE',
      name: 'Graduated Buy More Get More',
      description: 'Buy 2 get 1 free, buy 4 get 3 free, buy 6 get 5 free',
      type: 'graduated_bxgy',
      discount: {
        type: 'percentage',
        value: 100
      },
      conditions: {
        buyProducts: [
          { productId: products[0].id, quantity: 1 }
        ],
        getProducts: [
          { productId: products[1].id, quantity: 1 }
        ],
        graduatedRules: [
          {
            name: 'Basic Tier',
            buyQuantity: 2,
            getQuantity: 1,
            discountPercentage: 100
          },
          {
            name: 'Premium Tier',
            buyQuantity: 4,
            getQuantity: 3,
            discountPercentage: 100
          },
          {
            name: 'VIP Tier',
            buyQuantity: 6,
            getQuantity: 5,
            discountPercentage: 100
          }
        ],
        repetitionLimit: 2
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    };

    // Add cross-category BxGy coupon
    const crossCategoryBxGy = {
      code: 'CROSSCAT',
      name: 'Cross-Category Deal',
      description: 'Buy 2 Electronics, get 50% off Clothing',
      type: 'cross_category_bxgy',
      discount: {
        type: 'percentage',
        value: 50
      },
      conditions: {
        buyCategories: ['Electronics'],
        getCategories: ['Clothing', 'Footwear'],
        buyQuantity: 2,
        getQuantity: 1,
        getDiscountPercentage: 50,
        repetitionLimit: 1
      },
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true
    };

    // Add BxGy with percentage discount
    const percentageBxGy = {
      code: 'BXGY50',
      name: 'Buy 2 Get 50% Off Third',
      description: 'Buy any 2 laptops, get 50% off the third',
      type: 'bxgy',
      discount: {
        type: 'percentage',
        value: 50 // 50% off instead of free
      },
      conditions: {
        buyProducts: [
          { productId: products[0].id, quantity: 2 }
        ],
        getProducts: [
          { productId: products[0].id, quantity: 1 }
        ],
        repetitionLimit: 1
      },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    };

    // Combine all advanced coupons
    const allAdvancedCoupons = [
      ...advancedCoupons,
      graduatedBxGy,
      crossCategoryBxGy,
      percentageBxGy
    ];

    // Insert advanced coupons
    const coupons = await Coupon.bulkCreate(allAdvancedCoupons);
    console.log(`✅ Inserted ${coupons.length} advanced coupons`);

    console.log('\n🎉 Advanced coupon features seeded successfully!');
    console.log('\n🎫 Advanced Coupons created:');
    
    coupons.forEach(coupon => {
      console.log(`  - ${coupon.code}: ${coupon.name} (${coupon.type})`);
    });

    console.log('\n🔥 New Features Available:');
    console.log('  ✅ Coupon Stacking (multiple coupons per order)');
    console.log('  ✅ Tiered Discounts (progressive discount levels)');
    console.log('  ✅ Flash Sales (time-based discounts)');
    console.log('  ✅ User-Specific Coupons (first-time, loyalty)');
    console.log('  ✅ Graduated BxGy (increasing benefits)');
    console.log('  ✅ Cross-Category BxGy (buy electronics, get clothing)');
    console.log('  ✅ Percentage BxGy (50% off instead of free)');

    console.log('\n💡 Test these new features in Postman:');
    console.log('  1. Set allowStacking: true in applicable-coupons requests');
    console.log('  2. Include user object for user-specific coupons');
    console.log('  3. Test flash sales during specified time windows');
    console.log('  4. Try large carts to see tiered discounts activate');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding advanced coupons:', error);
    process.exit(1);
  }
};

seedAdvancedCoupons();
