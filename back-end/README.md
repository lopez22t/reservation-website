# Study Room Reservation System - Backend

## Overview
Backend API for the study room reservation system built with Node.js, Express, and MongoDB.

## Features
- User authentication (login/signup)
- User sign-in/sign-out system for rooms
- Building and room management
- Real-time room occupancy status
- Reservation calendar system
- Admin controls

## Database Models

### 1. User
- User authentication and profile management
- Roles: student, admin, staff
- Fields: firstName, lastName, email, password, studentId, phone, department, etc.

### 2. Building
- Campus building information
- Fields: name, code, location, totalFloors, imageUrl, etc.

### 3. Room
- Study room details
- Tracks: capacity, amenities, current occupancy, operating hours
- Room types: study, lab, meeting, group-study
- Real-time occupancy status: available, occupied, maintenance

### 4. Reservation
- Room reservation bookings
- Tracks: reservation date/time, user, duration, purpose
- Status: pending, confirmed, cancelled, completed, no-show
- Double-booking prevention through indexes

### 5. SignIn
- User check-in/check-out records
- Tracks: actual time spent, duration
- Linked to reservations for accountability

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn


### Running the Server (TBD)

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Reservations
- `GET /api/reservations` - Get user's reservations
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Sign-In
- `POST /api/signin` - Check in to a room
- `POST /api/signin/:id/checkout` - Check out from a room
- `GET /api/signin/history` - Get check-in history

### Rooms
- `GET /api/rooms` - Get all rooms with occupancy
- `GET /api/rooms/available` - Get available rooms
- `GET /api/rooms/:id` - Get specific room details
- `PUT /api/rooms/:id/occupancy` - Update room occupancy

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:id/rooms` - Get rooms in a building

## Database Schema Details

### Indexes
- User: email (unique)
- Room: building + floor + roomNumber (compound)
- Reservation: room + reservationDate + startTime + endTime + status (prevents double-booking)
- SignIn: user + createdAt (for history queries)

