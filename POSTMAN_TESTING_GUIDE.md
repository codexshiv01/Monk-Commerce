# Postman Testing Guide for E-Commerce Coupon API

This guide provides step-by-step instructions for testing all API endpoints using Postman with real examples and expected responses.

## 🚀 Setup

1. **Base URL**: `http://localhost:3000/api`
2. **Headers**: Set `Content-Type: application/json` for all POST/PUT requests
3. **Server**: Make sure your server is running with `npm run dev`

## 📋 Collection Structure

Create a new Postman collection called "E-Commerce Coupon API" and organize requests into these folders:

```
📁 E-Commerce Coupon API
├── 📁 1. Health Check
├── 📁 2. Coupon Management
├── 📁 3. Coupon Application
└── 📁 4. Error Testing
```

---

## 🏥 1. Health Check

### GET Health Check
- **URL**: `{{baseURL}}/health`
- **Method**: GET
- **Expected Response**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-08-24T13:29:52.592Z"
}
```

---

## 📝 2. Coupon Management

### 2.1 Create Cart-wise Coupon (Percentage)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "SAVE15",
  "name": "15% Off Cart",
  "description": "Get 15% discount on orders above $200",
  "type": "cart_wise",
  "discount": {
    "type": "percentage",
    "value": 15,
    "maxDiscountAmount": 100
  },
  "conditions": {
    "minimumAmount": 200
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 2.2 Create Cart-wise Coupon (Fixed Amount)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "FLAT50",
  "name": "$50 Off Cart",
  "description": "Get $50 off on orders above $300",
  "type": "cart_wise",
  "discount": {
    "type": "fixed_amount",
    "value": 50
  },
  "conditions": {
    "minimumAmount": 300
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 2.3 Create Cart-wise Coupon (Free Shipping)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "FREESHIP100",
  "name": "Free Shipping",
  "description": "Free shipping on orders above $100",
  "type": "cart_wise",
  "discount": {
    "type": "free_shipping",
    "value": 0
  },
  "conditions": {
    "minimumAmount": 100
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 2.4 Create Product-wise Coupon (Category Based)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "TECH30",
  "name": "30% Off Electronics",
  "description": "30% discount on all electronics",
  "type": "product_wise",
  "discount": {
    "type": "percentage",
    "value": 30
  },
  "conditions": {
    "applicableCategories": ["Electronics"]
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 2.5 Create Product-wise Coupon (Brand Based)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "TECHBRAND25",
  "name": "25% Off TechBrand",
  "description": "25% discount on TechBrand products",
  "type": "product_wise",
  "discount": {
    "type": "percentage",
    "value": 25
  },
  "conditions": {
    "applicableBrands": ["TechBrand"]
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 2.6 Create BxGy Coupon
First, get product IDs by calling `GET {{baseURL}}/coupons` and note the product IDs from existing coupons, or use these sample IDs:

- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "BUY2GET1FREE",
  "name": "Buy 2 Laptops Get 1 Mouse Free",
  "description": "Buy 2 laptops and get 1 mouse absolutely free",
  "type": "bxgy",
  "discount": {
    "type": "percentage",
    "value": 100
  },
  "conditions": {
    "buyProducts": [
      {
        "productId": "REPLACE_WITH_LAPTOP_ID",
        "quantity": 2
      }
    ],
    "getProducts": [
      {
        "productId": "REPLACE_WITH_MOUSE_ID",
        "quantity": 1
      }
    ],
    "repetitionLimit": 2
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

**Note**: Replace `REPLACE_WITH_LAPTOP_ID` and `REPLACE_WITH_MOUSE_ID` with actual product IDs from your database.

### 2.7 Get All Coupons
- **URL**: `{{baseURL}}/coupons`
- **Method**: GET
- **Query Parameters** (optional):
  - `page=1`
  - `limit=10`
  - `type=cart_wise`
  - `isActive=true`
  - `search=TECH`

### 2.8 Get All Coupons with Filters
- **URL**: `{{baseURL}}/coupons?type=product_wise&isActive=true&page=1&limit=5`
- **Method**: GET

### 2.9 Get Specific Coupon by ID
- **URL**: `{{baseURL}}/coupons/{{couponId}}`
- **Method**: GET
- **Note**: Replace `{{couponId}}` with an actual coupon ID from previous responses

### 2.10 Update Coupon
- **URL**: `{{baseURL}}/coupons/{{couponId}}`
- **Method**: PUT
- **Body** (raw JSON):
```json
{
  "name": "Updated Coupon Name",
  "description": "Updated description",
  "discount": {
    "type": "percentage",
    "value": 20
  }
}
```

### 2.11 Delete Coupon
- **URL**: `{{baseURL}}/coupons/{{couponId}}`
- **Method**: DELETE

---

## 🛒 3. Coupon Application

### 3.1 Get Applicable Coupons for Cart
- **URL**: `{{baseURL}}/applicable-coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "REPLACE_WITH_LAPTOP_ID",
      "quantity": 2,
      "price": 1999.99
    },
    {
      "productId": "REPLACE_WITH_MOUSE_ID",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 15.00
}
```

### 3.2 Get Applicable Coupons (Small Cart)
- **URL**: `{{baseURL}}/applicable-coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user456",
  "items": [
    {
      "productId": "REPLACE_WITH_TSHIRT_ID",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shippingCost": 10.00
}
```

### 3.3 Apply Specific Coupon to Cart
- **URL**: `{{baseURL}}/apply-coupon/{{couponId}}`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "REPLACE_WITH_LAPTOP_ID",
      "quantity": 1,
      "price": 1999.99
    },
    {
      "productId": "REPLACE_WITH_MOUSE_ID",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 15.00
}
```

### 3.4 Apply BxGy Coupon
- **URL**: `{{baseURL}}/apply-coupon/{{bxgyCouponId}}`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user789",
  "items": [
    {
      "productId": "REPLACE_WITH_LAPTOP_ID",
      "quantity": 2,
      "price": 1999.99
    },
    {
      "productId": "REPLACE_WITH_MOUSE_ID",
      "quantity": 2,
      "price": 79.99
    }
  ],
  "shippingCost": 20.00
}
```

---

## ❌ 4. Error Testing

### 4.1 Create Invalid Coupon (Missing Required Fields)
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "INVALID",
  "name": "Invalid Coupon"
}
```
**Expected**: 400 Bad Request with validation errors

### 4.2 Create Duplicate Coupon Code
- **URL**: `{{baseURL}}/coupons`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "code": "WELCOME10",
  "name": "Duplicate Coupon",
  "type": "cart_wise",
  "discount": {
    "type": "percentage",
    "value": 10
  },
  "conditions": {
    "minimumAmount": 50
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```
**Expected**: 409 Conflict

### 4.3 Get Non-existent Coupon
- **URL**: `{{baseURL}}/coupons/00000000-0000-0000-0000-000000000000`
- **Method**: GET
**Expected**: 404 Not Found

### 4.4 Apply Non-existent Coupon
- **URL**: `{{baseURL}}/apply-coupon/00000000-0000-0000-0000-000000000000`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "REPLACE_WITH_PRODUCT_ID",
      "quantity": 1,
      "price": 100
    }
  ]
}
```
**Expected**: 404 Not Found

### 4.5 Apply Coupon to Invalid Cart
- **URL**: `{{baseURL}}/apply-coupon/{{couponId}}`
- **Method**: POST
- **Body** (raw JSON):
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "REPLACE_WITH_MOUSE_ID",
      "quantity": 1,
      "price": 50
    }
  ]
}
```
**Expected**: 400 Bad Request (if coupon requires minimum amount > 50)

---

## 🔧 Postman Environment Setup

Create a Postman environment with these variables:

```json
{
  "baseURL": "http://localhost:3000/api",
  "couponId": "",
  "laptopId": "",
  "mouseId": "",
  "tshirtId": ""
}
```

### How to Set Dynamic Variables:

1. **After creating a coupon**, add this to the "Tests" tab:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("couponId", response.data.coupon.id);
}
```

2. **After getting coupons list**, extract product IDs:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    // Extract product IDs from BxGy coupon conditions
    if (response.data.coupons.length > 0) {
        const bxgyCoupon = response.data.coupons.find(c => c.type === 'bxgy');
        if (bxgyCoupon && bxgyCoupon.conditions.buyProducts) {
            pm.environment.set("laptopId", bxgyCoupon.conditions.buyProducts[0].productId);
        }
        if (bxgyCoupon && bxgyCoupon.conditions.getProducts) {
            pm.environment.set("mouseId", bxgyCoupon.conditions.getProducts[0].productId);
        }
    }
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Cart-wise Flow
1. Create a cart-wise coupon (15% off above $200)
2. Get applicable coupons for a cart worth $250
3. Apply the coupon and verify 15% discount

### Scenario 2: Product-wise Electronics Discount
1. Create electronics category coupon (30% off)
2. Test with cart containing electronics
3. Test with cart containing non-electronics

### Scenario 3: BxGy Complex Flow
1. Create BxGy coupon (Buy 2 laptops, get 1 mouse free)
2. Test with exact requirements met
3. Test with excess buy products
4. Test with insufficient buy products
5. Test with multiple repetitions

### Scenario 4: Free Shipping
1. Create free shipping coupon (orders > $100)
2. Test with cart above threshold
3. Test with cart below threshold

### Scenario 5: Multiple Applicable Coupons
1. Create multiple coupons that apply to same cart
2. Get applicable coupons (should be sorted by discount amount)
3. Apply the best coupon

---

## 📊 Expected Response Formats

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

---

## 🎯 Testing Checklist

### ✅ Coupon Creation
- [ ] Cart-wise percentage coupon
- [ ] Cart-wise fixed amount coupon
- [ ] Cart-wise free shipping coupon
- [ ] Product-wise category coupon
- [ ] Product-wise brand coupon
- [ ] Product-wise specific product coupon
- [ ] BxGy coupon with repetition limit
- [ ] Validation error handling
- [ ] Duplicate code prevention

### ✅ Coupon Retrieval
- [ ] Get all coupons
- [ ] Get coupons with pagination
- [ ] Get coupons with filters
- [ ] Get specific coupon by ID
- [ ] Search coupons by code/name

### ✅ Coupon Updates
- [ ] Update coupon details
- [ ] Update discount values
- [ ] Update conditions
- [ ] Prevent duplicate codes on update

### ✅ Coupon Application
- [ ] Get applicable coupons for various cart sizes
- [ ] Apply cart-wise coupons
- [ ] Apply product-wise coupons
- [ ] Apply BxGy coupons
- [ ] Handle non-applicable coupons
- [ ] Calculate correct discounts

### ✅ Edge Cases
- [ ] Expired coupons
- [ ] Inactive coupons
- [ ] Maximum usage reached
- [ ] Minimum cart requirements
- [ ] Invalid product IDs
- [ ] Empty carts
- [ ] Large cart values

---

## 🚨 Common Issues & Solutions

1. **"Coupon not found" when applying**: Make sure you're using the correct UUID format
2. **"Product not found" in BxGy**: Use actual product IDs from your seeded data
3. **Validation errors**: Check that all required fields are provided
4. **Server not responding**: Ensure the server is running on port 3000

Run `npm run seed` to populate the database with test data if you haven't already!

Happy testing! 🎉
