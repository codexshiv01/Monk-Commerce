const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize instance
const sequelize = new Sequelize(
  process.env.NODE_ENV === 'test' 
    ? process.env.DATABASE_TEST_URL
    : process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('PostgreSQL connected successfully');
    }
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};

module.exports = {
  sequelize,
  connectDB,
  disconnectDB
};
