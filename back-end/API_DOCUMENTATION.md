# API Documentation - Study Room Reservation System

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/signup
Register a new user account

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "studentId": "2024001",
  "phone": "+1234567890",
  "department": "Computer Science"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "isActive": true
  }
}
```

---

### POST /auth/login
Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### GET /auth/profile
Get current user's profile information

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Profile retrieved successfully",
  "user": { ... }
}
```

---

### PUT /auth/profile
Update current user's profile

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "department": "Engineering",
  "profilePicture": "https://example.com/pic.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### POST /auth/change-password
Change user's password

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Buildings Endpoints

### GET /buildings
Get all buildings on campus

**Query Parameters:**
- `active` (boolean) - Filter by active status

**Response (200):**
```json
{
  "message": "Buildings retrieved successfully",
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Engineering Building",
      "code": "ENG",
      "location": { ... },
      "totalFloors": 4,
      "isActive": true
    }
  ]
}
```

---

### GET /buildings/:id
Get specific building with its rooms

**Response (200):**
```json
{
  "message": "Building retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Engineering Building",
    "rooms": [ ... ]
  }
}
```

---

### GET /buildings/:id/rooms
Get all rooms in a building

**Query Parameters:**
- `floor` (number) - Filter by floor number
- `status` (string) - Filter by occupancy status (available, occupied, maintenance)

**Response (200):**
```json
{
  "message": "Building rooms retrieved successfully",
  "buildingName": "Engineering Building",
  "count": 12,
  "data": [ ... ]
}
```

---

### POST /buildings (Admin Only)
Create a new building

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Library Annex",
  "code": "LIB",
  "location": {
    "street": "123 Academic Ave",
    "city": "College Town",
    "postalCode": "12345",
    "coordinates": {
      "latitude": 40.1234,
      "longitude": -74.5678
    }
  },
  "description": "Main library building",
  "totalFloors": 3
}
```

**Response (201):**
```json
{
  "message": "Building created successfully",
  "data": { ... }
}
```

---

### PUT /buildings/:id (Admin Only)
Update building information

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true,
  "totalFloors": 4
}
```

**Response (200):**
```json
{
  "message": "Building updated successfully",
  "data": { ... }
}
```

---

## Rooms Endpoints

### GET /rooms
Get all rooms with occupancy information

**Query Parameters:**
- `building` (string) - Filter by building ID
- `floor` (number) - Filter by floor number
- `status` (string) - Filter by occupancy status
- `roomType` (string) - Filter by room type
- `minCapacity` (number) - Minimum capacity needed

**Response (200):**
```json
{
  "message": "Rooms retrieved successfully",
  "count": 24,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "roomNumber": "101",
      "floor": 1,
      "capacity": 6,
      "roomType": "study",
      "amenities": ["wifi", "projector"],
      "occupancyStatus": "available",
      "currentOccupancy": 0,
      "building": { ... }
    }
  ]
}
```

---

### GET /rooms/available
Get only available rooms (quick search)

**Query Parameters:**
- `building` (string) - Filter by building ID
- `minCapacity` (number) - Minimum capacity needed

**Response (200):**
```json
{
  "message": "Available rooms retrieved successfully",
  "count": 8,
  "data": [ ... ]
}
```

---

### GET /rooms/:id
Get specific room details

**Response (200):**
```json
{
  "message": "Room retrieved successfully",
  "data": { ... }
}
```

---

### POST /rooms (Admin Only)
Create a new room

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "roomNumber": "205",
  "building": "507f1f77bcf86cd799439011",
  "floor": 2,
  "capacity": 8,
  "roomType": "group-study",
  "amenities": ["wifi", "whiteboard", "desks"],
  "operatingHours": {
    "openTime": "08:00",
    "closeTime": "22:00"
  }
}
```

**Response (201):**
```json
{
  "message": "Room created successfully",
  "data": { ... }
}
```

---

### PUT /rooms/:id (Admin Only)
Update room information

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "capacity": 10,
  "amenities": ["wifi", "projector", "whiteboard"],
  "operatingHours": {
    "openTime": "07:00",
    "closeTime": "23:00"
  },
  "isActive": true
}
```

**Response (200):**
```json
{
  "message": "Room updated successfully",
  "data": { ... }
}
```

---

### PATCH /rooms/:id/occupancy
Update room occupancy status (real-time tracking)

**Request Body:**
```json
{
  "currentOccupancy": 3,
  "status": "occupied"
}
```

**Response (200):**
```json
{
  "message": "Room occupancy updated successfully",
  "data": {
    "roomId": "507f1f77bcf86cd799439011",
    "occupancyStatus": "occupied",
    "currentOccupancy": 3,
    "lastUpdated": "2024-12-04T10:30:00Z"
  }
}
```

---

## Reservations Endpoints

### GET /reservations
Get user's reservations

**Headers Required:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string) - Filter by status (pending, confirmed, cancelled, completed)
- `from` (string) - From date (YYYY-MM-DD)
- `to` (string) - To date (YYYY-MM-DD)

**Response (200):**
```json
{
  "message": "User reservations retrieved successfully",
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "room": { ... },
      "building": { ... },
      "reservationDate": "2024-12-05T00:00:00Z",
      "startTime": "14:00",
      "endTime": "16:00",
      "duration": 120,
      "purpose": "studying",
      "numberOfPeople": 2,
      "status": "confirmed"
    }
  ]
}
```

---

### GET /reservations/:id
Get specific reservation details

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Reservation retrieved successfully",
  "data": { ... }
}
```

---

### POST /reservations
Create a new room reservation

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "room": "507f1f77bcf86cd799439011",
  "building": "507f1f77bcf86cd799439012",
  "reservationDate": "2024-12-05",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "studying",
  "numberOfPeople": 2,
  "notes": "Need projector"
}
```

**Response (201):**
```json
{
  "message": "Reservation created successfully",
  "data": { ... }
}
```

**Errors:**
- 400: Missing required fields or invalid time
- 409: Time slot already booked (conflict)

---

### PUT /reservations/:id
Update reservation (only if pending)

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startTime": "15:00",
  "endTime": "17:00",
  "numberOfPeople": 3,
  "status": "confirmed"
}
```

**Response (200):**
```json
{
  "message": "Reservation updated successfully",
  "data": { ... }
}
```

---

### DELETE /reservations/:id
Cancel a reservation

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Schedule changed"
}
```

**Response (200):**
```json
{
  "message": "Reservation cancelled successfully",
  "data": { ... }
}
```

---

### GET /reservations/room/:roomId
Get all reservations for a room (for calendar view)

**Query Parameters:**
- `date` (string) - Filter by date (YYYY-MM-DD)

**Response (200):**
```json
{
  "message": "Room reservations retrieved successfully",
  "count": 5,
  "data": [ ... ]
}
```

---

## Sign-In Endpoints

### POST /signin
Check in to a reserved room

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reservation": "507f1f77bcf86cd799439011",
  "room": "507f1f77bcf86cd799439012",
  "building": "507f1f77bcf86cd799439013",
  "notes": "Early arrival"
}
```

**Response (201):**
```json
{
  "message": "Check-in successful",
  "data": {
    "signInId": "507f1f77bcf86cd799439014",
    "signInTime": "2024-12-05T14:05:00Z",
    "roomOccupancy": 3
  }
}
```

---

### POST /signin/:id/checkout
Check out from a room

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Study session completed"
}
```

**Response (200):**
```json
{
  "message": "Check-out successful",
  "data": {
    "signInId": "507f1f77bcf86cd799439014",
    "signOutTime": "2024-12-05T16:00:00Z",
    "actualDuration": 115,
    "roomOccupancy": 2
  }
}
```

---

### GET /signin/history
Get user's check-in history

**Headers Required:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `from` (string) - From date (YYYY-MM-DD)
- `to` (string) - To date (YYYY-MM-DD)
- `status` (string) - Filter by status (active, completed, abandoned)

**Response (200):**
```json
{
  "message": "Sign-in history retrieved successfully",
  "count": 15,
  "data": [ ... ]
}
```

---

### GET /signin/:id
Get specific sign-in record details

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Check-in record retrieved successfully",
  "data": { ... }
}
```

---

### PUT /signin/:id
Update sign-in record notes

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Updated notes",
  "status": "abandoned"
}
```

**Response (200):**
```json
{
  "message": "Check-in record updated successfully",
  "data": { ... }
}
```

---

### GET /signin/room/:roomId
Get current occupancy and active check-ins for a room

**Response (200):**
```json
{
  "message": "Room occupancy data retrieved successfully",
  "roomData": {
    "roomId": "507f1f77bcf86cd799439011",
    "currentOccupancy": 3,
    "capacity": 8,
    "occupancyStatus": "occupied"
  },
  "activeUsers": [ ... ],
  "count": 3
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 - Bad Request:**
```json
{
  "message": "Invalid input or missing required fields"
}
```

**401 - Unauthorized:**
```json
{
  "message": "No token provided or invalid token"
}
```

**403 - Forbidden:**
```json
{
  "message": "Insufficient permissions (admin only)"
}
```

**404 - Not Found:**
```json
{
  "message": "Resource not found"
}
```

**409 - Conflict:**
```json
{
  "message": "Resource already exists or time conflict detected"
}
```

**500 - Internal Server Error:**
```json
{
  "message": "Error processing request"
}
```

---

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **500** - Server Error

---

## Role-Based Access Control

### Student
- Can create/view/cancel own reservations
- Can view available rooms and buildings
- Can check in/out
- Can view own history

### Admin
- Can perform all student actions
- Can create/update buildings and rooms
- Can view all reservations and sign-ins
- Can manage user accounts

### Staff
- Can update room occupancy
- Can view real-time occupancy data
