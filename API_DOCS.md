# CampusXChange API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000` (development)  
**Content-Type:** `application/json`

---

## Table of Contents

- [Authentication](#authentication)
- [Products](#products)
- [Requests](#requests)
- [Chat/Messages](#chatmessages)
- [Error Handling](#error-handling)

---

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Register User

**POST** `/api/auth/register`

Creates a new user account and sends OTP via email.

**Request (multipart/form-data):**

```
name: "John Doe"
mobile: "9876543210"
rollNo: "CS21B001"
email: "john@college.edu"
password: "password123"
photo: [file] (required - profile picture)
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the OTP verification code.",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

### Verify OTP

**POST** `/api/auth/verify-otp`

Verifies email with OTP code.

**Request:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully. Welcome to CampusXChange!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@college.edu"
  }
}
```

---

### Resend OTP

**POST** `/api/auth/resend-otp`

Resends OTP to user's email.

**Request:**

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "OTP resent successfully. Please check your email."
}
```

---

### Login

**POST** `/api/auth/login`

Login with mobile and password.

**Request:**

```json
{
  "mobile": "9876543210",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@college.edu",
    "profilePicture": "https://ik.imagekit.io/..."
  }
}
```

**Response (401) - Unverified User:**

```json
{
  "success": false,
  "message": "Please verify your email first. Check your inbox for the OTP.",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Note:** Users must verify their email via OTP before they can login.

---

### Get Current User

**GET** `/api/auth/me`  
🔒 **Protected**

Gets current logged-in user details.

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@college.edu",
    "profilePicture": "https://ik.imagekit.io/...",
    "createdAt": "2026-02-05T10:30:00.000Z"
  }
}
```

---

### Update Profile

**PUT** `/api/auth/update-profile`  
🔒 **Protected**

Updates user profile.

**Request:**

```json
{
  "name": "John Updated",
  "email": "john.new@college.edu"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "mobile": "9876543210",
    "email": "john.new@college.edu",
    "profilePicture": "https://ik.imagekit.io/..."
  }
}
```

---

## Products

### Get All Products (with Requests)

**GET** `/api/products`

Gets all products and requests (merged for homepage).

**Query Parameters:**

- `search` - Search in title/description
- `category` - Filter by category (Books, Electronics, Furniture, Clothing, Sports, Stationery, Vehicles, Other)
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `status` - available/sold/reserved (default: available)
- `sort` - Sort field (default: -createdAt)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:** `/api/products?category=Books&minPrice=100&maxPrice=500&page=1`

**Response (200):**

```json
{
  "success": true,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Engineering Textbook",
      "description": "Excellent condition",
      "price": 300,
      "category": "Books",
      "images": ["https://ik.imagekit.io/..."],
      "seller": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Doe",
        "mobile": "9876543211"
      },
      "type": "product",
      "status": "available",
      "location": "Hostel A",
      "views": 45,
      "createdAt": "2026-02-05T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Looking for Arduino Kit",
      "description": "Need for project work",
      "category": "Electronics",
      "requester": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Bob Smith",
        "mobile": "9876543212"
      },
      "type": "request",
      "status": "open",
      "responses": 3,
      "createdAt": "2026-02-04T15:30:00.000Z"
    }
  ],
  "products": [...],
  "requests": [...],
  "pagination": {
    "totalProducts": 45,
    "totalRequests": 12,
    "total": 57,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

---

### Get Single Product

**GET** `/api/products/:id`

Gets product details by ID.

**Response (200):**

```json
{
  "success": true,
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Engineering Textbook",
    "description": "Excellent condition, barely used",
    "price": 300,
    "category": "Books",
    "images": ["https://ik.imagekit.io/..."],
    "seller": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "mobile": "9876543211",
      "email": "jane@college.edu",
      "profilePicture": "https://ik.imagekit.io/..."
    },
    "status": "available",
    "location": "Hostel A",
    "views": 46,
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### Create Product

**POST** `/api/products`  
🔒 **Protected**

Creates a new product listing.

**Request (multipart/form-data):**

```
title: "Engineering Textbook"
description: "Excellent condition, barely used"
price: 300
category: "Books"
location: "Hostel A"
images: [file, file, ...] (1-8 images required)
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product listed successfully.",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Engineering Textbook",
    "description": "Excellent condition, barely used",
    "price": 300,
    "category": "Books",
    "images": ["https://ik.imagekit.io/..."],
    "seller": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "mobile": "9876543211"
    },
    "status": "available",
    "location": "Hostel A",
    "views": 0,
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### Get My Products

**GET** `/api/products/user/my-products`  
🔒 **Protected**

Gets current user's products.

**Query Parameters:**

- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

**Response (200):**

```json
{
  "success": true,
  "products": [...],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

---

### Update Product

**PUT** `/api/products/:id`  
🔒 **Protected** (Owner only)

Updates product details.

**Request:**

```json
{
  "title": "Updated Title",
  "price": 250,
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product updated successfully.",
  "product": {...}
}
```

---

### Delete Product

**DELETE** `/api/products/:id`  
🔒 **Protected** (Owner only)

Deletes a product.

**Response (200):**

```json
{
  "success": true,
  "message": "Product deleted successfully."
}
```

---

### Mark as Sold

**PATCH** `/api/products/:id/mark-sold`  
🔒 **Protected** (Owner only)

Marks product as sold.

**Response (200):**

```json
{
  "success": true,
  "message": "Product marked as sold.",
  "product": {...}
}
```

---

## Requests

### Get All Requests

**GET** `/api/requests`

Gets all product requests.

**Query Parameters:**

- `category` - Filter by category
- `status` - open/fulfilled/closed (default: open)
- `page` - Page number
- `limit` - Items per page

**Response (200):**

```json
{
  "success": true,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Looking for Arduino Kit",
      "description": "Need for semester project",
      "category": "Electronics",
      "requester": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Bob Smith",
        "mobile": "9876543212"
      },
      "status": "open",
      "responses": 3,
      "createdAt": "2026-02-04T15:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

---

### Get Single Request

**GET** `/api/requests/:id`

Gets request details by ID.

**Response (200):**

```json
{
  "success": true,
  "request": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Looking for Arduino Kit",
    "description": "Need for semester project",
    "category": "Electronics",
    "requester": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Bob Smith",
      "mobile": "9876543212",
      "email": "bob@college.edu"
    },
    "status": "open",
    "responses": 3,
    "createdAt": "2026-02-04T15:30:00.000Z"
  }
}
```

---

### Create Request

**POST** `/api/requests`  
🔒 **Protected**

Creates a new product request.

**Request:**

```json
{
  "title": "Looking for Arduino Kit",
  "description": "Need for semester project",
  "category": "Electronics"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product request created successfully.",
  "request": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Looking for Arduino Kit",
    "description": "Need for semester project",
    "category": "Electronics",
    "requester": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Bob Smith",
      "mobile": "9876543212"
    },
    "status": "open",
    "responses": 0,
    "createdAt": "2026-02-04T15:30:00.000Z"
  }
}
```

---

### Get My Requests

**GET** `/api/requests/user/my-requests`  
🔒 **Protected**

Gets current user's requests.

**Query Parameters:**

- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

**Response (200):**

```json
{
  "success": true,
  "requests": [...],
  "pagination": {...}
}
```

---

### Update Request

**PUT** `/api/requests/:id`  
🔒 **Protected** (Owner only)

Updates request details.

**Request:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "fulfilled"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Request updated successfully.",
  "request": {...}
}
```

---

### Delete Request

**DELETE** `/api/requests/:id`  
🔒 **Protected** (Owner only)

Deletes a request.

**Response (200):**

```json
{
  "success": true,
  "message": "Request deleted successfully."
}
```

---

## Chat/Messages

### Create Conversation

**POST** `/api/chat/conversations`  
🔒 **Protected**

Creates or gets existing conversation.

**Request:**

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "sellerId": "507f1f77bcf86cd799439012"
}
```

**Response (200/201):**

```json
{
  "success": true,
  "conversation": {
    "_id": "507f1f77bcf86cd799439015",
    "participants": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Bob Smith",
        "mobile": "9876543212",
        "profilePicture": "https://ik.imagekit.io/..."
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Doe",
        "mobile": "9876543211",
        "profilePicture": "https://ik.imagekit.io/..."
      }
    ],
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Engineering Textbook",
      "price": 300,
      "images": ["https://ik.imagekit.io/..."]
    },
    "lastMessage": null,
    "createdAt": "2026-02-05T11:00:00.000Z"
  }
}
```

---

### Get All Conversations

**GET** `/api/chat/conversations`  
🔒 **Protected**

Gets all user's conversations.

**Response (200):**

```json
{
  "success": true,
  "conversations": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "participants": [...],
      "product": {...},
      "lastMessage": {
        "_id": "507f1f77bcf86cd799439016",
        "content": "Is it still available?",
        "sender": "507f1f77bcf86cd799439014",
        "createdAt": "2026-02-05T11:05:00.000Z"
      },
      "updatedAt": "2026-02-05T11:05:00.000Z"
    }
  ]
}
```

---

### Get Single Conversation

**GET** `/api/chat/conversations/:id`  
🔒 **Protected**

Gets conversation details.

**Response (200):**

```json
{
  "success": true,
  "conversation": {...}
}
```

---

### Send Message

**POST** `/api/chat/messages`  
🔒 **Protected**

Sends a message in conversation.

**Request:**

```json
{
  "conversationId": "507f1f77bcf86cd799439015",
  "content": "Is it still available?"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": {
    "_id": "507f1f77bcf86cd799439016",
    "conversation": "507f1f77bcf86cd799439015",
    "sender": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Bob Smith",
      "profilePicture": "https://ik.imagekit.io/..."
    },
    "content": "Is it still available?",
    "read": false,
    "createdAt": "2026-02-05T11:05:00.000Z"
  }
}
```

**Note:** Real-time updates via Socket.IO on event `new-message`

---

### Get Messages

**GET** `/api/chat/messages/:conversationId`  
🔒 **Protected**

Gets all messages in a conversation.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Messages per page (default: 50)

**Response (200):**

```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "sender": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Bob Smith",
        "profilePicture": "https://ik.imagekit.io/..."
      },
      "content": "Is it still available?",
      "read": true,
      "createdAt": "2026-02-05T11:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pages": 1,
    "limit": 50
  }
}
```

---

### Get Unread Count

**GET** `/api/chat/unread-count`  
🔒 **Protected**

Gets total unread messages count.

**Response (200):**

```json
{
  "success": true,
  "unreadCount": 5
}
```

---

## Error Handling

All errors follow this format:

**Response (4xx/5xx):**

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (no token or invalid token)
- **403** - Forbidden (not resource owner)
- **404** - Not Found
- **500** - Internal Server Error

---

## Socket.IO Events

**Connection:**

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "your_jwt_token" },
});
```

**Events:**

- `join-conversation` - Join a conversation room
- `new-message` - Receive new messages
- `message-read` - Mark message as read

---

## Environment Variables

Required `.env` configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campusxchange

# JWT
JWT_SECRET=your_secret_key

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password

# CORS
CLIENT_URL=http://localhost:3000
```

---

## Categories

Available categories for products and requests:

- Books
- Electronics
- Furniture
- Clothing
- Sports
- Stationery
- Vehicles
- Other

---

**Made with ❤️ for Campus Community**
