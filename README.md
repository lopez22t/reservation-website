# Study Room Reservation System

A full-stack web application for Mount Holyoke College students to reserve study rooms in campus buildings (Pratt Music Hall).

## 🚀 Quick Start

**See [SETUP.md](SETUP.md) for detailed instructions.**

```bash
# 1. Backend setup
cd back-end
npm install
npm run seed
npm run dev

# 2. Open in browser
http://localhost:5000

# 3. Login with test credentials
# Email: test@mhc.edu
# Password: Password123
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md)** - Google Calendar integration guide
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Full feature list and status
- **[back-end/API_DOCUMENTATION.md](back-end/API_DOCUMENTATION.md)** - API reference
- **[back-end/README.md](back-end/README.md)** - Backend details

## ✨ Features

### For Students
- ✅ Create account and login securely with JWT
- ✅ Browse available rooms across campus
- ✅ Reserve rooms with calendar interface
- ✅ Automatic conflict detection (prevents double-booking)
- ✅ Manage reservations (edit, cancel)
- ✅ Track check-in/check-out history
- ✅ Real-time room occupancy display
- ✅ **NEW: Google Calendar integration** - Sync reservations to your calendar
- ✅ **NEW: View Google Calendar events** in the reservation system

### For Developers
- ✅ Full REST API with comprehensive endpoints
- ✅ JWT-based authentication and authorization
- ✅ MongoDB database with proper schema design
- ✅ Role-based access control (student, staff, admin)
- ✅ Input validation and error handling
- ✅ CORS enabled for frontend integration
- ✅ Seeded test data for quick start
- ✅ **NEW: Google Calendar API integration** (frontend OAuth)

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM

### Key Models
- **User** - Student/staff accounts with roles
- **Building** - Campus buildings (Pratt Music Hall)
- **Room** - Study rooms with capacity and amenities
- **Reservation** - Room bookings with conflict detection
- **SignIn** - Check-in/check-out records

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (JWT protected)

### Reservations (JWT Protected)
- `GET /api/reservations` - List user's reservations
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Edit reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Rooms & Buildings  
- `GET /api/rooms` - List all rooms with occupancy
- `GET /api/buildings` - Get building info
- `GET /api/buildings/:id/rooms` - Get building's rooms

### Check-In/Check-Out (JWT Protected)
- `POST /api/signin` - Check in to room
- `POST /api/signin/:id/checkout` - Check out from room
- `GET /api/signin/history` - Get check-in history

See [back-end/API_DOCUMENTATION.md](back-end/API_DOCUMENTATION.md) for full details.

## 🔧 Project Structure

```
reservation-website/
├── README.md                    # This file
├── SETUP.md                    # Setup guide
├── PROJECT_STATUS.md           # Feature status report
├── check-setup.sh             # Setup verification script
├── back-end/
│   ├── server.js              # Express server entry
│   ├── .env                   # Environment config
│   ├── package.json           # Dependencies
│   ├── models/                # Database schemas
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth middleware
│   └── seeds/                 # Database seeding
└── front-end/
    ├── index.html             # Home/login page
    ├── reservation.html       # Reservation page
    ├── index.js              # Login logic
    ├── app.js                # Reservation logic
    └── *.css                 # Styling
```

## 🔒 Security

- ✅ JWT token authentication (7-day expiry)
- ✅ bcryptjs password hashing
- ✅ CORS enabled with proper headers
- ✅ User can only access own reservations
- ✅ Automatic conflict detection prevents double-booking
- ✅ Capacity validation on bookings
- ✅ Environment-based configuration (no hardcoded secrets)

## 🧪 Testing

```bash
# Create test account
Email: any@example.com
Password: Any123!

# Or use pre-seeded test account
Email: test@mhc.edu
Password: Password123
```

## 🚧 Future Improvements

- Input validation with express-validator
- Rate limiting on auth endpoints
- Admin dashboard for staff
- Email notifications
- Calendar sync (Google Calendar, Outlook)
- Recurring reservations
- Room analytics

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for complete roadmap.

## 📞 Troubleshooting

See [SETUP.md](SETUP.md#troubleshooting) for common issues and solutions.

## 📄 License

Internal project for Mount Holyoke College
