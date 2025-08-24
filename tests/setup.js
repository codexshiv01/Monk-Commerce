const { sequelize, Product, Coupon, Cart } = require('./testDb');

// Setup before all tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

// Cleanup after all tests
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
});

// Clear database before each test
beforeEach(async () => {
  try {
    // Clear all tables in proper order
    await Cart.destroy({ where: {}, truncate: { cascade: true } });
    await Coupon.destroy({ where: {}, truncate: { cascade: true } });
    await Product.destroy({ where: {}, truncate: { cascade: true } });
  } catch (error) {
    console.warn('Test database reset warning:', error.message);
    // Don't throw - some tests might not need clean state
  }
});

module.exports = { sequelize, Product, Coupon, Cart };
