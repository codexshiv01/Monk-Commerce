# API Usage Examples

This document provides detailed examples of how to use the E-Commerce Coupon API.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required (for development purposes).

## Content-Type
All requests should include:
```
Content-Type: application/json
```

---

## 1. Product Management (Helper for Testing)

While not part of the main API, you can seed the database with sample products and coupons:

```bash
npm run seed
```

---

## 2. Coupon Management

### Create Cart-wise Coupon
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "name": "20% Off Orders Over $100",
  "description": "Get 20% discount on orders above $100",
  "type": "cart_wise",
  "discount": {
    "type": "percentage",
    "value": 20,
    "maxDiscountAmount": 200
  },
  "conditions": {
    "minimumAmount": 100
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### Create Product-wise Coupon
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "TECH30",
  "name": "30% Off Electronics",
  "description": "Special discount on electronics category",
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

### Create BxGy Coupon
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "BUY2GET1FREE",
  "name": "Buy 2 Get 1 Free",
  "description": "Buy 2 laptops and get 1 mouse free",
  "type": "bxgy",
  "discount": {
    "type": "percentage",
    "value": 100
  },
  "conditions": {
    "buyProducts": [
      {
        "productId": "674d1234567890abcdef1234",
        "quantity": 2
      }
    ],
    "getProducts": [
      {
        "productId": "674d1234567890abcdef5678",
        "quantity": 1
      }
    ],
    "repetitionLimit": 2
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### Get All Coupons
```http
GET /api/coupons
```

### Get Coupons with Filtering
```http
GET /api/coupons?type=cart_wise&isActive=true&page=1&limit=10
```

### Get Specific Coupon
```http
GET /api/coupons/674d1234567890abcdef1234
```

### Update Coupon
```http
PUT /api/coupons/674d1234567890abcdef1234
Content-Type: application/json

{
  "name": "Updated Coupon Name",
  "discount": {
    "type": "percentage",
    "value": 25
  }
}
```

### Delete Coupon
```http
DELETE /api/coupons/674d1234567890abcdef1234
```

---

## 3. Coupon Application

### Check Applicable Coupons
```http
POST /api/applicable-coupons
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "674d1234567890abcdef1234",
      "quantity": 2,
      "price": 1999.99
    },
    {
      "productId": "674d1234567890abcdef5678",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 15.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Applicable coupons retrieved successfully",
  "data": {
    "cart": {
      "userId": "user123",
      "itemCount": 2,
      "subtotal": 4079.97,
      "shippingCost": 15
    },
    "applicableCoupons": [
      {
        "coupon": {
          "id": "674d1234567890abcdef9999",
          "code": "TECH30",
          "name": "30% Off Electronics",
          "type": "product_wise",
          "discount": {
            "type": "percentage",
            "value": 30
          }
        },
        "discountAmount": 1223.99,
        "freeShipping": false,
        "finalTotal": 2870.98,
        "savings": 1223.99
      }
    ]
  }
}
```

### Apply Specific Coupon
```http
POST /api/apply-coupon/674d1234567890abcdef9999
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "674d1234567890abcdef1234",
      "quantity": 1,
      "price": 1999.99
    },
    {
      "productId": "674d1234567890abcdef5678",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 15.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "cart": {
      "userId": "user123",
      "items": [
        {
          "productId": "674d1234567890abcdef1234",
          "quantity": 1,
          "price": 1999.99,
          "discountAmount": 599.997,
          "finalPrice": 1399.993
        },
        {
          "productId": "674d1234567890abcdef5678",
          "quantity": 1,
          "price": 79.99,
          "discountAmount": 23.997,
          "finalPrice": 55.993
        }
      ],
      "subtotal": 2079.98,
      "totalDiscount": 623.994,
      "shippingCost": 15,
      "freeShipping": false,
      "total": 1470.986,
      "appliedCoupons": [
        {
          "couponId": "674d1234567890abcdef9999",
          "code": "TECH30",
          "discountAmount": 623.994
        }
      ],
      "savings": 623.994
    }
  }
}
```

---

## 4. Complex BxGy Examples

### Scenario 1: Basic BxGy (Buy 2 Laptops, Get 1 Mouse Free)

**Cart:**
```json
{
  "userId": "user456",
  "items": [
    {
      "productId": "674d1234567890abcdef1234", // Gaming Laptop
      "quantity": 2,
      "price": 1999.99
    },
    {
      "productId": "674d1234567890abcdef5678", // Wireless Mouse
      "quantity": 1,
      "price": 79.99
    }
  ]
}
```

**Result:** 1 mouse becomes free (discount = $79.99)

### Scenario 2: Multiple Applications with Repetition Limit

**Cart:**
```json
{
  "userId": "user789",
  "items": [
    {
      "productId": "674d1234567890abcdef1234", // Gaming Laptop
      "quantity": 4,
      "price": 1999.99
    },
    {
      "productId": "674d1234567890abcdef5678", // Wireless Mouse
      "quantity": 3,
      "price": 79.99
    }
  ]
}
```

**BxGy Coupon:** Buy 2 laptops, get 1 mouse free (repetition limit: 2)
**Result:** 2 mice become free (discount = $159.98)

### Scenario 3: Insufficient Buy Products

**Cart:**
```json
{
  "userId": "user101",
  "items": [
    {
      "productId": "674d1234567890abcdef1234", // Gaming Laptop
      "quantity": 1, // Need 2 for BxGy
      "price": 1999.99
    },
    {
      "productId": "674d1234567890abcdef5678", // Wireless Mouse
      "quantity": 1,
      "price": 79.99
    }
  ]
}
```

**Result:** Coupon not applicable (insufficient buy products)

---

## 5. Error Examples

### Invalid Coupon Code
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "A", // Too short
  "name": "Invalid Coupon",
  "type": "cart_wise"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "code",
      "message": "\"code\" length must be at least 3 characters long"
    }
  ]
}
```

### Coupon Not Applicable
```http
POST /api/apply-coupon/674d1234567890abcdef9999
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "674d1234567890abcdef1234",
      "quantity": 1,
      "price": 50 // Below minimum amount
    }
  ]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Coupon not applicable: Cart total must be at least 100",
  "error": "COUPON_NOT_APPLICABLE"
}
```

### Coupon Not Found
```http
GET /api/coupons/674d1234567890abcdef0000
```

**Response:**
```json
{
  "success": false,
  "message": "Coupon not found",
  "error": "COUPON_NOT_FOUND"
}
```

---

## 6. Testing Scenarios

### Scenario 1: Electronics Category Discount

1. **Create products** (via seed script or manual creation)
2. **Create coupon:**
   ```json
   {
     "code": "ELECTRONICS20",
     "name": "20% off Electronics",
     "type": "product_wise",
     "discount": { "type": "percentage", "value": 20 },
     "conditions": { "applicableCategories": ["Electronics"] }
   }
   ```
3. **Test cart:**
   ```json
   {
     "userId": "test",
     "items": [
       { "productId": "laptop_id", "quantity": 1, "price": 1000 },
       { "productId": "tshirt_id", "quantity": 1, "price": 30 }
     ]
   }
   ```
4. **Expected:** Only laptop gets 20% discount ($200 off)

### Scenario 2: Free Shipping Threshold

1. **Create coupon:**
   ```json
   {
     "code": "FREESHIP50",
     "name": "Free shipping over $50",
     "type": "cart_wise",
     "discount": { "type": "free_shipping", "value": 0 },
     "conditions": { "minimumAmount": 50 }
   }
   ```
2. **Test cart:**
   ```json
   {
     "userId": "test",
     "items": [{ "productId": "product_id", "quantity": 1, "price": 60 }],
     "shippingCost": 10
   }
   ```
3. **Expected:** Shipping becomes free (saves $10)

---

## 7. Performance Testing

### Load Testing with Multiple Coupons
```bash
# Create 100 coupons for testing
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/coupons \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"TEST$i\",\"name\":\"Test Coupon $i\",\"type\":\"cart_wise\",\"discount\":{\"type\":\"percentage\",\"value\":10},\"conditions\":{\"minimumAmount\":50},\"endDate\":\"2025-12-31T23:59:59.000Z\"}"
done
```

### Concurrent Coupon Applications
```bash
# Test concurrent applications
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/applicable-coupons \
    -H "Content-Type: application/json" \
    -d '{"userId":"user'$i'","items":[{"productId":"674d1234567890abcdef1234","quantity":1,"price":1000}]}' &
done
wait
```

---

## Notes

1. **Product IDs**: Replace example product IDs with actual IDs from your database
2. **Dates**: Use valid ISO 8601 date strings for coupon expiry
3. **Validation**: All requests are validated; refer to error responses for details
4. **Testing**: Use the seed script to populate test data before running examples
5. **Environment**: Examples assume the server is running on localhost:3000
