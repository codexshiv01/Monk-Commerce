# 🚀 Postman Advanced Coupon Testing Guide

## 📋 Overview

This guide covers testing **ALL** advanced coupon features including:
- ✅ Coupon Stacking
- ✅ Tiered Discounts  
- ✅ Flash Sales (Time-based)
- ✅ User-Specific Coupons
- ✅ Graduated BxGy
- ✅ Cross-Category BxGy
- ✅ Percentage BxGy

## 🎯 Quick Setup

### 1. Import Collection
```bash
File → Import → Coupon_API_Collection_Advanced.postman_collection.json
```

### 2. Set Environment Variables
The collection auto-extracts coupon IDs from the "Get All Coupons" request. Run this first:
```
GET {{baseURL}}/coupons
```

### 3. Verify Advanced Coupons Exist
After seeding with `npm run seed:advanced`, you should have these coupons:
- `TIERED2024` - Tiered Discount
- `FLASHFRIDAY` - Flash Sale (Friday 6-8 PM)
- `WELCOME50` - First-time user special
- `LOYALTY20` - Loyalty program
- `STACK10` + `STACKSHIP` - Stackable coupons
- `GRADUATE` - Graduated BxGy
- `CROSSCAT` - Cross-category BxGy
- `BXGY50` - 50% BxGy

## 🔥 Advanced Testing Scenarios

### 1. 🎯 Tiered Discount Testing

**Test Gold Tier (15% off $500+)**
```json
POST {{baseURL}}/apply-coupon/{{tieredCouponId}}
{
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 1,
      "price": 1200.00
    }
  ],
  "subtotal": 1200.00
}
```
**Expected**: 15% discount with $200 max cap = $200 discount

**Test Silver Tier (10% off $300+)**
```json
{
  "items": [
    {
      "productId": "{{mouseId}}",
      "quantity": 4,
      "price": 80.00
    }
  ],
  "subtotal": 320.00
}
```
**Expected**: 10% discount = $32 discount

### 2. ⚡ Flash Sale Testing

**During Active Hours (Friday 6-8 PM)**
```json
POST {{baseURL}}/apply-coupon/{{flashSaleCouponId}}
{
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 1,
      "price": 1200.00
    }
  ],
  "subtotal": 1200.00
}
```
**Expected**: 25% × 1.5 multiplier = 37.5% discount = $450

**Outside Active Hours**
**Expected**: Error message about flash sale not being active

### 3. 👤 User-Specific Coupon Testing

**First-Time User**
```json
POST {{baseURL}}/applicable-coupons
{
  "allowStacking": false,
  "userId": "new-user-456",
  "items": [...],
  "subtotal": 1200.00,
  "user": {
    "id": "new-user-456",
    "type": "new",
    "isFirstTime": true,
    "loyaltyLevel": 1,
    "orderCount": 0,
    "registrationDate": "2025-08-24T10:00:00Z"
  }
}
```
**Expected**: WELCOME50 coupon should be applicable

**Loyalty User (Level 8)**
```json
{
  "user": {
    "loyaltyLevel": 8,
    "orderCount": 25,
    "type": "premium"
  }
}
```
**Expected**: Higher discount due to loyalty multiplier

### 4. 🔥 Coupon Stacking Testing

**Enable Stacking**
```json
POST {{baseURL}}/applicable-coupons
{
  "allowStacking": true,
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 1,
      "price": 1200.00
    }
  ],
  "subtotal": 1200.00,
  "user": {
    "loyaltyLevel": 5,
    "orderCount": 15
  }
}
```
**Expected**: Multiple stackable coupons returned, optimized for maximum savings

### 5. 📈 Graduated BxGy Testing

**VIP Tier Test (Buy 6, Get 5)**
```json
POST {{baseURL}}/apply-coupon/{{graduatedBxGyCouponId}}
{
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 6,
      "price": 1200.00
    },
    {
      "productId": "{{mouseId}}",
      "quantity": 5,
      "price": 80.00
    }
  ],
  "subtotal": 7600.00
}
```
**Expected**: 5 mice free = $400 discount, with VIP tier message

**Basic Tier Test (Buy 2, Get 1)**
```json
{
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 2,
      "price": 1200.00
    },
    {
      "productId": "{{mouseId}}",
      "quantity": 1,
      "price": 80.00
    }
  ]
}
```
**Expected**: 1 mouse free = $80 discount, with Basic tier message

### 6. 🔀 Cross-Category BxGy Testing

**Valid Cross-Category**
```json
POST {{baseURL}}/apply-coupon/{{crossCategoryCouponId}}
{
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 2,
      "price": 1200.00
    },
    {
      "productId": "{{tshirtId}}",
      "quantity": 2,
      "price": 25.00
    }
  ],
  "subtotal": 2450.00
}
```
**Expected**: 50% off clothing items = $25 discount

**Insufficient Buy Category**
```json
{
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 1,
      "price": 1200.00
    }
  ]
}
```
**Expected**: Error - need 2 electronics products

### 7. 💯 Percentage BxGy Testing

**50% Off Third Item**
```json
POST {{baseURL}}/apply-coupon/{{percentageBxGyCouponId}}
{
  "userId": "user-123",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 3,
      "price": 1200.00
    }
  ],
  "subtotal": 3600.00
}
```
**Expected**: 50% off 1 laptop = $600 discount

## 🧪 Complex Test Scenarios

### Scenario 1: High-Value Gaming Setup
```json
{
  "allowStacking": true,
  "userId": "gamer-user-999",
  "items": [
    {
      "productId": "{{laptopId}}",
      "quantity": 2,
      "price": 1200.00
    },
    {
      "productId": "{{mouseId}}",
      "quantity": 3,
      "price": 80.00
    }
  ],
  "subtotal": 2640.00,
  "user": {
    "type": "premium",
    "loyaltyLevel": 7,
    "orderCount": 18
  }
}
```
**Expected**: Should find optimal combination of applicable coupons

### Scenario 2: New User Journey
```json
{
  "allowStacking": true,
  "user": {
    "type": "new",
    "isFirstTime": true,
    "loyaltyLevel": 1,
    "orderCount": 0
  }
}
```
**Expected**: New user coupons should be prioritized

### Scenario 3: Loyalty Program Benefits
```json
{
  "user": {
    "type": "premium", 
    "loyaltyLevel": 10,
    "orderCount": 50
  }
}
```
**Expected**: Maximum loyalty multipliers applied

## 📊 Expected Response Formats

### Tiered Discount Response
```json
{
  "success": true,
  "data": {
    "cart": {
      "totalDiscount": 200.00,
      "tierApplied": "Gold Tier"
    }
  }
}
```

### Graduated BxGy Response
```json
{
  "success": true,
  "data": {
    "cart": {
      "totalDiscount": 400.00,
      "tierApplied": "VIP Tier",
      "applicationsUsed": 1
    }
  }
}
```

### Stacking Response
```json
{
  "success": true,
  "data": {
    "applicableCoupons": [
      {
        "coupon": { "code": "STACK10" },
        "discountAmount": 136.00,
        "stackable": true,
        "priority": 1
      },
      {
        "coupon": { "code": "STACKSHIP" },
        "discountAmount": 25.00,
        "stackable": true,
        "priority": 2
      }
    ]
  }
}
```

## ❌ Error Testing

### Flash Sale Outside Hours
```json
{
  "success": false,
  "message": "Flash sale is not currently active"
}
```

### Insufficient User Criteria
```json
{
  "success": false,
  "message": "User does not meet eligibility criteria"
}
```

### Insufficient Cart Value
```json
{
  "success": false,
  "message": "Cart value does not meet any tier requirements"
}
```

## 🚀 Performance Testing

### Load Test with Stacking
Run the stacking request 50+ times to test performance:
```bash
for i in {1..50}; do
  curl -X POST {{baseURL}}/applicable-coupons \
    -H "Content-Type: application/json" \
    -d '{"allowStacking": true, ...}'
done
```

### Concurrent User Testing
Test multiple user types simultaneously to verify isolation:
- New users
- Loyalty users  
- Premium users
- Basic users

## 📈 Analytics & Insights

Use the test results to analyze:
1. **Optimal Stacking Combinations**: Which combinations provide best value?
2. **Tier Distribution**: How often does each tier activate?
3. **User Segmentation**: Which user types benefit most?
4. **Performance Metrics**: Response times for complex calculations
5. **Error Rates**: Common failure patterns

## 🔧 Troubleshooting

### Common Issues

1. **Coupon IDs Not Found**
   - Run "Get All Coupons" first to populate environment variables
   - Verify `npm run seed:advanced` completed successfully

2. **Flash Sale Always Fails**
   - Check current time vs. configured time windows
   - Flash sales only work during specific hours

3. **User-Specific Coupons Not Working**
   - Ensure user object is included in request body
   - Verify user criteria match coupon requirements

4. **Stacking Returns Single Coupon**
   - Ensure `allowStacking: true` is set
   - Check that coupons have `stackable: true` property

5. **BxGy Not Applying**
   - Verify product IDs match exactly
   - Check quantity requirements are met
   - Ensure both buy and get products are in cart

## 🎯 Success Criteria

✅ All basic coupon types work  
✅ Tiered discounts select correct tier  
✅ Flash sales respect time windows  
✅ User-specific coupons validate criteria  
✅ Stacking finds optimal combinations  
✅ Graduated BxGy calculates correct tier  
✅ Cross-category BxGy validates categories  
✅ Percentage BxGy applies partial discounts  
✅ Error handling is graceful  
✅ Performance is acceptable (<500ms)  

Ready to test the future of e-commerce coupons! 🚀
