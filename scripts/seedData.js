const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');
require('dotenv').config();

const seedProducts = [
  {
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop with RTX 4080',
    price: 1999.99,
    category: 'Electronics',
    brand: 'TechBrand',
    sku: 'LAPTOP001',
    stock: 25,
    weight: 2.5,
    tags: ['gaming', 'laptop', 'high-performance']
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with RGB lighting',
    price: 79.99,
    category: 'Electronics',
    brand: 'TechBrand',
    sku: 'MOUSE001',
    stock: 150,
    weight: 0.1,
    tags: ['mouse', 'wireless', 'rgb']
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with blue switches',
    price: 149.99,
    category: 'Electronics',
    brand: 'TechBrand',
    sku: 'KEYBOARD001',
    stock: 75,
    weight: 1.2,
    tags: ['keyboard', 'mechanical', 'rgb']
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Premium quality cotton t-shirt',
    price: 29.99,
    category: 'Clothing',
    brand: 'FashionBrand',
    sku: 'TSHIRT001',
    stock: 200,
    weight: 0.2,
    tags: ['clothing', 'cotton', 'casual']
  },
  {
    name: 'Denim Jeans',
    description: 'Classic blue denim jeans',
    price: 89.99,
    category: 'Clothing',
    brand: 'FashionBrand',
    sku: 'JEANS001',
    stock: 100,
    weight: 0.8,
    tags: ['clothing', 'denim', 'casual']
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with cushioned sole',
    price: 129.99,
    category: 'Footwear',
    brand: 'SportsBrand',
    sku: 'SHOES001',
    stock: 80,
    weight: 0.6,
    tags: ['shoes', 'running', 'sports']
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Insert products
    const products = await Product.bulkCreate(seedProducts);
    console.log(`Inserted ${products.length} products`);

    // Create sample coupons using created products
    const sampleCoupons = [
      {
        code: 'WELCOME10',
        name: '10% Welcome Discount',
        description: 'New customer welcome offer',
        type: 'cart_wise',
        discount: {
          type: 'percentage',
          value: 10,
          maxDiscountAmount: 100
        },
        conditions: {
          minimumAmount: 50
        },
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true
      },
      {
        code: 'ELECTRONICS25',
        name: '25% Off Electronics',
        description: 'Special discount on all electronics',
        type: 'product_wise',
        discount: {
          type: 'percentage',
          value: 25,
          maxDiscountAmount: 500
        },
        conditions: {
          applicableCategories: ['Electronics']
        },
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true
      },
      {
        code: 'FREESHIP75',
        name: 'Free Shipping Over $75',
        description: 'Get free shipping on orders over $75',
        type: 'cart_wise',
        discount: {
          type: 'free_shipping',
          value: 0
        },
        conditions: {
          minimumAmount: 75
        },
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true
      },
      {
        code: 'TECHCOMBO',
        name: 'Buy Laptop Get Mouse Free',
        description: 'Buy any laptop and get a wireless mouse free',
        type: 'bxgy',
        discount: {
          type: 'percentage',
          value: 100
        },
        conditions: {
          buyProducts: [
            { productId: products.find(p => p.sku === 'LAPTOP001').id, quantity: 1 }
          ],
          getProducts: [
            { productId: products.find(p => p.sku === 'MOUSE001').id, quantity: 1 }
          ],
          repetitionLimit: 1
        },
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true
      },
      {
        code: 'FASHION15',
        name: '15% Off Fashion',
        description: 'Discount on clothing items',
        type: 'product_wise',
        discount: {
          type: 'percentage',
          value: 15
        },
        conditions: {
          applicableCategories: ['Clothing']
        },
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        isActive: true
      },
      {
        code: 'GAMING50',
        name: '$50 Off Gaming Setup',
        description: 'Fixed discount on gaming products',
        type: 'cart_wise',
        discount: {
          type: 'fixed_amount',
          value: 50
        },
        conditions: {
          minimumAmount: 300
        },
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        isActive: true
      }
    ];

    const coupons = await Coupon.bulkCreate(sampleCoupons);
    console.log(`Inserted ${coupons.length} coupons`);

    console.log('\\n✅ Database seeded successfully!');
    console.log('\\n📦 Products created:');
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - $${product.price}`);
    });

    console.log('\\n🎫 Coupons created:');
    coupons.forEach(coupon => {
      console.log(`  - ${coupon.code}: ${coupon.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
