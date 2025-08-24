# 🚀 Postman Quick Reference - E-Commerce Coupon API

## Base Setup
- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json` (for POST/PUT requests)

## 🆔 Real Product IDs (From Your Database)

Use these actual product IDs in your Postman requests:

```json
{
  "laptopId": "833e33ef-6823-499f-b940-d9a4700eaab7",
  "mouseId": "b874ff7b-9a50-4e98-98f7-757f7d1284cd"
}
```

## 🆔 Real Coupon IDs (From Your Database)

```json
{
  "welcome10": "53aad4e0-8dab-4d64-b728-d0a073b4623c",
  "electronics25": "bd4ca30c-dfed-4510-b39a-5f00514fbeb0",
  "freeship75": "59be1f5e-44ed-48da-81cd-f292abdb84aa",
  "techcombo": "799a8fcd-109f-42db-81bd-abcaf76166f0",
  "fashion15": "860ea9e2-60d4-4897-97b2-a9f22869297f",
  "gaming50": "b1f45e27-a12a-4d61-8818-ca77c92b39e2"
}
```

---

## 🎯 Quick Test Requests

### 1. Test Health Check
```
GET http://localhost:3000/api/health
```

### 2. Get All Existing Coupons
```
GET http://localhost:3000/api/coupons
```

### 3. Get Specific Coupon
```
GET http://localhost:3000/api/coupons/53aad4e0-8dab-4d64-b728-d0a073b4623c
```

### 4. Create New Cart-wise Coupon
```
POST http://localhost:3000/api/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "name": "20% Off Cart",
  "description": "Get 20% discount on orders above $150",
  "type": "cart_wise",
  "discount": {
    "type": "percentage",
    "value": 20,
    "maxDiscountAmount": 200
  },
  "conditions": {
    "minimumAmount": 150
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 5. Create BxGy Coupon (Using Real Product IDs)
```
POST http://localhost:3000/api/coupons
Content-Type: application/json

{
  "code": "BUY2GET1",
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
        "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
        "quantity": 2
      }
    ],
    "getProducts": [
      {
        "productId": "b874ff7b-9a50-4e98-98f7-757f7d1284cd",
        "quantity": 1
      }
    ],
    "repetitionLimit": 3
  },
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

### 6. Check Applicable Coupons for High-Value Cart
```
POST http://localhost:3000/api/applicable-coupons
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
      "quantity": 1,
      "price": 1999.99
    },
    {
      "productId": "b874ff7b-9a50-4e98-98f7-757f7d1284cd",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 15.00
}
```

### 7. Apply Electronics Coupon
```
POST http://localhost:3000/api/apply-coupon/bd4ca30c-dfed-4510-b39a-5f00514fbeb0
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
      "quantity": 1,
      "price": 1999.99
    }
  ],
  "shippingCost": 15.00
}
```

### 8. Apply BxGy Coupon (Perfect Match)
```
POST http://localhost:3000/api/apply-coupon/799a8fcd-109f-42db-81bd-abcaf76166f0
Content-Type: application/json

{
  "userId": "user456",
  "items": [
    {
      "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
      "quantity": 1,
      "price": 1999.99
    },
    {
      "productId": "b874ff7b-9a50-4e98-98f7-757f7d1284cd",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "shippingCost": 20.00
}
```

### 9. Apply Free Shipping Coupon
```
POST http://localhost:3000/api/apply-coupon/59be1f5e-44ed-48da-81cd-f292abdb84aa
Content-Type: application/json

{
  "userId": "user789",
  "items": [
    {
      "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
      "quantity": 1,
      "price": 100.00
    }
  ],
  "shippingCost": 25.00
}
```

### 10. Test Cart Below Minimum (Should Fail)
```
POST http://localhost:3000/api/apply-coupon/53aad4e0-8dab-4d64-b728-d0a073b4623c
Content-Type: application/json

{
  "userId": "user999",
  "items": [
    {
      "productId": "b874ff7b-9a50-4e98-98f7-757f7d1284cd",
      "quantity": 1,
      "price": 30.00
    }
  ],
  "shippingCost": 10.00
}
```

---

## 🔧 Expected Response Examples

### ✅ Successful Coupon Creation
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "coupon": {
      "id": "new-uuid-here",
      "code": "SAVE20",
      "name": "20% Off Cart",
      "type": "cart_wise",
      "discount": {
        "type": "percentage",
        "value": 20,
        "maxDiscountAmount": 200
      },
      "conditions": {
        "minimumAmount": 150
      },
      "isActive": true,
      "startDate": "2025-08-24T...",
      "endDate": "2025-12-31T23:59:59.000Z"
    }
  }
}
```

### ✅ Successful Coupon Application
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "cart": {
      "userId": "user123",
      "items": [
        {
          "productId": "833e33ef-6823-499f-b940-d9a4700eaab7",
          "quantity": 1,
          "price": 1999.99,
          "discountAmount": 499.9975,
          "finalPrice": 1499.9925
        }
      ],
      "subtotal": 1999.99,
      "totalDiscount": 499.9975,
      "shippingCost": 15,
      "freeShipping": false,
      "total": 1515.0025,
      "appliedCoupons": [
        {
          "couponId": "bd4ca30c-dfed-4510-b39a-5f00514fbeb0",
          "code": "ELECTRONICS25",
          "discountAmount": 499.9975
        }
      ],
      "savings": 499.9975
    }
  }
}
```

### ❌ Coupon Not Applicable
```json
{
  "success": false,
  "message": "Coupon not applicable: Cart total must be at least 50",
  "error": "COUPON_NOT_APPLICABLE"
}
```

### ❌ Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "endDate",
      "message": "\"endDate\" is required"
    }
  ]
}
```

---

## 🧪 Test Scenarios to Try

### Scenario 1: Electronics Shopping
1. **Cart**: 1 Laptop ($1999.99) + 1 Mouse ($79.99) = $2079.98
2. **Expected Applicable Coupons**: 
   - ELECTRONICS25 (25% off) = $519.9975 discount
   - WELCOME10 (10% off) = $207.998 discount  
   - FREESHIP75 (free shipping) = $15 discount

### Scenario 2: BxGy Perfect Match
1. **Cart**: 1 Laptop + 1 Mouse
2. **Apply**: TECHCOMBO coupon
3. **Expected**: Mouse becomes free ($79.99 discount)

### Scenario 3: Small Cart (Below Minimums)
1. **Cart**: 1 Mouse ($79.99)
2. **Expected**: Only FREESHIP75 applicable, others fail minimum requirements

### Scenario 4: High-Value Gaming Setup
1. **Cart**: 2 Laptops ($3999.98) + accessories
2. **Expected**: GAMING50 ($50 off) applicable due to >$300 minimum

---

## 💡 Pro Tips for Testing

1. **Copy the UUID format correctly** - they're case-sensitive
2. **Test edge cases** - carts exactly at minimum thresholds
3. **Try invalid UUIDs** to test error handling
4. **Use different userIds** to simulate different customers
5. **Test expired coupons** by creating ones with past end dates
6. **Test maximum discount limits** with high-value carts

## 🎯 Quick Checklist

- [ ] Health check responds
- [ ] Can create all coupon types
- [ ] Can retrieve coupons with filters
- [ ] Can update existing coupons
- [ ] Can delete coupons
- [ ] Cart-wise coupons calculate correctly
- [ ] Product-wise coupons apply to right products
- [ ] BxGy coupons work with exact quantities
- [ ] Free shipping coupons remove shipping cost
- [ ] Error handling works for invalid requests
- [ ] Non-applicable coupons are rejected properly

Happy testing! 🚀
