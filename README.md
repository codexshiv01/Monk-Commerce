# E-Commerce Coupon Management API

A comprehensive RESTful API for managing and applying different types of discount coupons (cart-wise, product-wise, and BxGy) for an e-commerce platform, built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Multiple Coupon Types**: Cart-wise, Product-wise, and BxGy (Buy X Get Y) coupons
- **Flexible Discount System**: Percentage, fixed amount, and free shipping discounts
- **Comprehensive Validation**: Input validation with detailed error messages
- **Advanced BxGy Logic**: Support for repetition limits and complex product combinations
- **Extensible Architecture**: Easy to add new coupon types in the future
- **Performance Optimized**: Database indexing and efficient algorithms
- **Comprehensive Testing**: Unit tests with high coverage
- **API Documentation**: Well-documented endpoints with examples

## 📋 Table of Contents

- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Coupon Types](#coupon-types)
- [Implemented Cases](#implemented-cases)
- [Unimplemented Cases](#unimplemented-cases)
- [Assumptions](#assumptions)
- [Limitations](#limitations)
- [Testing](#testing)
- [Architecture](#architecture)
- [Examples](#examples)

## 🛠 Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) or Neon Database
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-coupon-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   The `.env` file is already configured with the Neon PostgreSQL database:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_1UWu4MepkTgX@ep-delicate-pine-ad8msrci-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📚 API Endpoints

### Coupon Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons` | Create a new coupon |
| GET | `/api/coupons` | Retrieve all coupons (with pagination and filtering) |
| GET | `/api/coupons/:id` | Retrieve a specific coupon by ID |
| PUT | `/api/coupons/:id` | Update a specific coupon by ID |
| DELETE | `/api/coupons/:id` | Delete a specific coupon by ID |

### Coupon Application

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applicable-coupons` | Get all applicable coupons for a cart |
| POST | `/api/apply-coupon/:id` | Apply a specific coupon to a cart |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |

## 🎯 Coupon Types

### 1. Cart-wise Coupons

Apply discounts to the entire cart based on conditions like minimum cart value.

#### Subtypes:
- **Percentage Discount**: Apply a percentage discount to the entire cart
- **Fixed Amount Discount**: Deduct a fixed amount from the cart total
- **Free Shipping**: Remove shipping charges for qualifying carts

#### Examples:
- 10% off on carts over $100
- $15 off on carts over $150
- Free shipping on orders above $75

### 2. Product-wise Coupons

Apply discounts to specific products, categories, or brands.

#### Subtypes:
- **Specific Product Discount**: Discount on particular products
- **Category Discount**: Discount on all products in a category
- **Brand Discount**: Discount on all products from a specific brand
- **Multi-Product Discount**: Discount on a set of specified products

#### Examples:
- 20% off on specific laptops
- 15% off on all electronics
- $5 off on Nike products

### 3. BxGy (Buy X Get Y) Coupons

Complex offers where purchasing certain products gives free or discounted items.

#### Features:
- **Flexible Product Sets**: Buy from one set, get from another set
- **Quantity Control**: Specify exact quantities for buy/get products
- **Repetition Limits**: Control how many times the offer can be applied
- **Mixed Product Types**: Different products for buy and get conditions

#### Examples:
- Buy 2 laptops, get 1 mouse free
- Buy 3 items from [A, B, C], get 1 item from [X, Y, Z] free
- Buy 2 get 1 free with repetition limit of 3

## ✅ Implemented Cases

### Cart-wise Coupons
1. **Percentage Discount with Maximum Limit**
   - 10% off with maximum discount of $200
   - Prevents excessive discounts on high-value carts

2. **Fixed Amount Discount**
   - $25 off on carts over $100
   - Ensures cart total doesn't go negative

3. **Free Shipping**
   - Free shipping on orders above $75
   - Removes shipping cost entirely

4. **Minimum Cart Value Validation**
   - Coupons only apply when cart meets minimum threshold
   - Clear error messages for non-qualifying carts

### Product-wise Coupons
1. **Specific Product Discounts**
   - Target individual products by ID
   - Support for multiple specific products

2. **Category-based Discounts**
   - Apply to all products in specified categories
   - Support for multiple categories

3. **Brand-based Discounts**
   - Apply to all products from specific brands
   - Support for multiple brands

4. **Mixed Conditions**
   - Combine specific products, categories, and brands
   - OR logic: discount applies if any condition is met

### BxGy Coupons
1. **Basic BxGy Implementation**
   - Buy X quantity of products, get Y quantity free
   - Supports different buy and get products

2. **Repetition Limit Control**
   - Limit how many times offer can be applied to single cart
   - Handles scenarios with excess qualifying products

3. **Optimal Free Product Selection**
   - Automatically selects highest-priced get products for discount
   - Maximizes customer savings

4. **Complex Product Set Matching**
   - Buy from set [A, B, C], get from set [X, Y, Z]
   - Flexible quantity requirements

5. **Insufficient Product Handling**
   - Clear validation when cart doesn't meet buy requirements
   - Graceful handling of partial matches

### General Features
1. **Coupon Lifecycle Management**
   - Start and end date validation
   - Automatic expiry checks
   - Usage tracking and limits

2. **Validation & Error Handling**
   - Comprehensive input validation
   - Detailed error messages
   - Graceful failure handling

3. **Performance Optimizations**
   - Database indexing for fast lookups
   - Efficient discount calculation algorithms
   - Pagination for large datasets

4. **Extensible Architecture**
   - Plugin-style coupon type system
   - Easy to add new discount types
   - Modular service layer

## ✅ Advanced Features Implemented

### 🎯 **Advanced Coupon Types**

#### 1. **Coupon Stacking** ✅
- **Feature**: Apply multiple coupons simultaneously with priority resolution
- **How it works**: 
  - Coupons can be marked as `stackable: true`
  - Priority system determines optimal combinations
  - Algorithm compares single high-value vs. multiple stacked coupons
- **Usage**: Set `allowStacking: true` in API requests
- **Test**: Use codes `STACK10` + `STACKSHIP` together

#### 2. **Tiered Discounts** ✅
- **Feature**: Progressive discounts based on cart value
- **Example**: 5% off $100+, 10% off $300+, 15% off $500+
- **How it works**: 
  - Multiple tier definitions with minimum thresholds
  - Automatic selection of highest qualifying tier
  - Max discount caps per tier
- **Test**: Use code `TIERED2024` with different cart values

#### 3. **Flash Sales** ✅
- **Feature**: Time-based discounts with specific active windows
- **How it works**:
  - Define time windows (hour ranges, days of week)
  - Discount multipliers for flash periods
  - Real-time validation of active status
- **Test**: Use code `FLASHFRIDAY` (active Friday 6-8 PM)

#### 4. **User-Specific Coupons** ✅
- **Feature**: Coupons based on user characteristics and behavior
- **Criteria supported**:
  - First-time users (`isFirstTime: true`)
  - Loyalty levels with multipliers
  - Order count ranges
  - Registration age requirements
- **Test**: Use code `WELCOME50` with new user data

#### 5. **Graduated BxGy** ✅
- **Feature**: Increasing benefits with higher purchase quantities
- **Example**: Buy 2→get 1 free, Buy 4→get 3 free, Buy 6→get 5 free
- **How it works**:
  - Multiple tier rules with increasing benefits
  - Optimal tier selection based on cart contents
  - Repetition limits per tier
- **Test**: Use code `GRADUATE` with varying quantities

#### 6. **Cross-Category BxGy** ✅
- **Feature**: Buy from one category, get discount on another
- **Example**: Buy 2 Electronics → 50% off Clothing
- **How it works**:
  - Category-based buy/get requirements
  - Flexible discount percentages (not just free)
  - Cross-category relationship validation
- **Test**: Use code `CROSSCAT` with mixed categories

#### 7. **Percentage BxGy** ✅
- **Feature**: Partial discounts instead of completely free items
- **Example**: Buy 2 laptops → 50% off the third laptop
- **How it works**:
  - Configurable discount percentages (1-100%)
  - Works with all BxGy variants
  - Smart price-based sorting for maximum savings
- **Test**: Use code `BXGY50` for 50% discount

### 🔧 **Implementation Details**

#### **Database Schema Enhancements**
```sql
-- New Coupon fields
priority INTEGER DEFAULT 0,
stackable BOOLEAN DEFAULT false,
flashSaleData JSONB,
userCriteria JSONB,
tieredRules JSONB

-- New coupon types
type ENUM(..., 'tiered', 'flash_sale', 'user_specific', 'graduated_bxgy', 'cross_category_bxgy')
```

#### **API Enhancements**
```javascript
// Stacking support
POST /api/applicable-coupons
{
  "allowStacking": true,
  "user": { "isFirstTime": true, "loyaltyLevel": 3 }
}

// Advanced conditions
{
  "type": "tiered",
  "tieredRules": {
    "tiers": [
      { "minimumAmount": 100, "discountValue": 10 }
    ]
  }
}
```


## 📝 Assumptions

### Technical Assumptions
1. **Single Currency**: All prices are in the same currency (no conversion needed)
2. **Synchronous Processing**: Coupon application is processed synchronously
3. **In-Memory Cart**: Cart data is provided with each request (no persistent cart storage)
4. **Product Catalog**: Products exist in the database with required fields (price, category, brand)
5. **No Authentication**: API endpoints are publicly accessible (should be secured in production)

### Business Logic Assumptions
1. **Single Coupon Application**: Only one coupon can be applied per cart at a time
2. **Immediate Discount**: Discounts are applied immediately without approval workflow
3. **No Coupon Abuse Prevention**: No advanced fraud detection for coupon misuse
4. **Static Product Prices**: Product prices don't change during coupon calculation
5. **No Tax Calculations**: Discounts are applied before tax considerations

### Data Assumptions
1. **Valid Product IDs**: All product IDs in requests exist in the database
2. **Positive Quantities**: All item quantities are positive integers
3. **Valid Dates**: Coupon start/end dates are properly formatted
4. **Unique Coupon Codes**: Coupon codes are unique across the system
5. **Stable Database**: Database operations are reliable and don't fail unexpectedly

### User Behavior Assumptions
1. **Honest Usage**: Users don't attempt to manipulate coupon system
2. **Valid Cart Data**: Cart items represent genuine purchase intent
3. **One-time Usage**: Each coupon application represents a unique transaction
4. **Real-time Processing**: Users expect immediate coupon validation results

## 🧪 Testing

### Test Coverage
- **Models**: Comprehensive model validation and method testing
- **Services**: Business logic testing with various scenarios
- **Controllers**: API endpoint testing with integration tests
- **Error Handling**: Edge cases and error condition testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Categories
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: API endpoint testing
3. **Edge Case Tests**: Boundary condition testing
4. **Error Tests**: Error handling verification

## 🏗 Architecture

### Project Structure
```
src/
├── config/          # Database and environment configuration
├── controllers/     # API request handlers
├── middleware/      # Express middleware functions
├── models/          # Database models and schemas
├── routes/          # API route definitions
├── services/        # Business logic services
├── validators/      # Input validation schemas
└── app.js          # Main application entry point

tests/
├── controllers/     # Controller integration tests
├── models/          # Model unit tests
├── services/        # Service unit tests
└── setup.js        # Test environment setup
```

### Design Patterns
1. **MVC Pattern**: Separation of concerns with Models, Views (Controllers), and business logic
2. **Service Layer**: Business logic abstraction for reusability
3. **Repository Pattern**: Data access abstraction through Sequelize models
4. **Strategy Pattern**: Different discount calculation strategies for each coupon type
5. **Factory Pattern**: Coupon creation with type-specific validation

### Key Components
1. **DiscountService**: Core business logic for coupon calculations
2. **CouponController**: API request handling and response formatting
3. **Validation Middleware**: Input validation and sanitization
4. **Error Middleware**: Centralized error handling and formatting
5. **Sequelize Models**: PostgreSQL data models with JSONB support for flexible schemas

## 📖 Examples

### Creating Coupons

#### Cart-wise Coupon
```javascript
POST /api/coupons
{
  "code": "CART10",
  "name": "10% off on cart above $100",
  "type": "cart_wise",
  "discount": {
    "type": "percentage",
    "value": 10,
    "maxDiscountAmount": 200
  },
  "conditions": {
    "minimumAmount": 100
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

#### Product-wise Coupon
```javascript
POST /api/coupons
{
  "code": "ELECTRONICS20",
  "name": "20% off on electronics",
  "type": "product_wise",
  "discount": {
    "type": "percentage",
    "value": 20
  },
  "conditions": {
    "applicableCategories": ["Electronics", "Gadgets"]
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

#### BxGy Coupon
```javascript
POST /api/coupons
{
  "code": "BUY2GET1",
  "name": "Buy 2 laptops get 1 mouse free",
  "type": "bxgy",
  "discount": {
    "type": "percentage",
    "value": 100
  },
  "conditions": {
    "buyProducts": [
      { "productId": "507f1f77bcf86cd799439011", "quantity": 2 }
    ],
    "getProducts": [
      { "productId": "507f1f77bcf86cd799439012", "quantity": 1 }
    ],
    "repetitionLimit": 3
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### Applying Coupons

#### Check Applicable Coupons
```javascript
POST /api/applicable-coupons
{
  "userId": "user123",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "price": 1000
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "price": 50
    }
  ],
  "shippingCost": 15
}
```

#### Apply Specific Coupon
```javascript
POST /api/apply-coupon/507f1f77bcf86cd799439013
{
  "userId": "user123",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 1,
      "price": 1000
    }
  ],
  "shippingCost": 15
}
```



