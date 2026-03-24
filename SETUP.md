# Setup & Getting Started Guide

## Prerequisites

- Node.js v14+ and npm
- MongoDB (local or cloud connection string)
- Git

## Backend Setup

### 1. Install Dependencies

```bash
cd back-end
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `back-end/` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/study-room-reservation

# JWT Configuration - CHANGE THIS IN PRODUCTION
JWT_SECRET=your_secure_jwt_secret_key_here

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
```

**Important**: 
- Change `JWT_SECRET` to a strong random string in production
- For MongoDB: Use local MongoDB for development, or a cloud connection string (MongoDB Atlas)

### 3. Start MongoDB (if running locally)

```bash
# macOS / Linux with Homebrew
brew services start mongodb-community

# Or manually
mongod
```

### 4. Seed Database with Test Data

```bash
cd back-end
node seeds/seedData.js
```

You'll see:
```
✅ Created Pratt building
✅ Created 8 rooms
✅ Created test user (test@mhc.edu / Password123)
```

### 5. Start Backend Server

```bash
# Development with auto-reload
npm run dev

# OR production
npm start
```

Server should output: `Server running on port 5000`

---

## Frontend Setup

The frontend is already bundled with the backend (served via Express static files).

### 1. Open in Browser

Once the backend is running:

```
http://localhost:5000
```

---

## Testing the Application

### 1. Home Page
- Visit `http://localhost:5000`
- Click "Login" button

### 2. Create Account

- Click "Sign up" tab
- Fill in credentials:
  - First Name: `John`
  - Last Name: `Doe`
  - Email: `john@example.com`
  - Password: `Test1234`
- Click "Create account"

### 3. Make a Reservation

- After login, click "Pratt Music Hall" card
- On the reservation page:
  - Select a date from the calendar
  - Click a "Free" time slot
  - Enter number of people
  - Enter purpose (studying, meeting, etc.)
  - Click "Reserve"

### 4. View Reservations

- Click "Login" to open sidebar
- Your reservations will appear
- You can Edit or Cancel each one

### 5. Test Check-In/Check-Out (NEW FEATURE)

After making a reservation, you can test the new check-in/check-out system:

**Option A: Via Frontend UI (Recommended)**
- Go to home page (click "Home" or "Login")
- Your reservations will appear with a **Check-In** button (green)
- Click "Check-In" to record your entry to the room
- Button changes to **Check-Out** once checked in
- Click "Check-Out" to end your session
- View time spent and history in the "Check-In History" tab

**Option B: Via API (for testing)**
```bash
# Get JWT token from login response first
# Then use it as YOUR_JWT_TOKEN below

# Check-in
curl -X POST http://localhost:5000/api/signin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservation":"RESERVATION_ID",
    "room":"ROOM_ID",
    "building":"BUILDING_ID"
  }'

# Check-out
curl -X POST http://localhost:5000/api/signin/SIGNIN_ID/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# View check-in history
curl -X GET http://localhost:5000/api/signin/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. View Room Occupancy (NEW FEATURE)

- Go to the Reservation Page (click on "Pratt Music Hall")
- At the top, you'll see **"Room Occupancy (Real-time)"** display
- Each room shows:
  - Current occupancy vs capacity (e.g., "3/6")
  - Percentage filled
  - Visual progress bar
  - Color-coded status:
    - **Green**: Low occupancy (0-50%)
    - **Yellow**: Medium occupancy (50-80%)
    - **Red**: High occupancy (80-100%)

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (requires JWT)

### Reservations
- `GET /api/reservations` - List user's reservations (requires JWT)
- `POST /api/reservations` - Create reservation (requires JWT)
- `PUT /api/reservations/:id` - Update reservation (requires JWT)
- `DELETE /api/reservations/:id` - Cancel reservation (requires JWT)

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/available` - List available rooms

### Buildings
- `GET /api/buildings` - Get building info
- `GET /api/buildings/:id/rooms` - Get building's rooms

### Sign-In/Check-Out
- `POST /api/signin` - Check in (requires JWT)
- `POST /api/signin/:id/checkout` - Check out (requires JWT)
- `GET /api/signin/history` - Get check-in history (requires JWT)

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`
- Try: `brew services start mongodb-community`

### "Port 5000 already in use"
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port - update .env: PORT=5001
```

### JWT Token Expired
- Tokens expire after 7 days
- Log out and log back in to get a new token

### Reservation Conflicts
- System prevents double-booking automatically
- Time slots on calendar show "Booked" if unavailable

### "Authentication removed" warning in console
- This has been fixed - all protected routes now require JWT
- Ensure you're logged in before accessing reservations page

---

## File Structure

```
back-end/
├── server.js              # Main server entry
├── .env                   # Environment variables
├── seeds/
│   └── seedData.js       # Database seeding script
├── models/               # MongoDB schemas
│   ├── User.js
│   ├── Room.js
│   ├── Reservation.js
│   ├── Building.js
│   └── SignIn.js
├── routes/               # API endpoints
│   ├── auth.js
│   ├── reservations.js
│   ├── rooms.js
│   ├── buildings.js
│   └── signin.js
└── middleware/
    └── auth.js          # JWT verification

front-end/
├── index.html           # Home page
├── reservation.html     # Reservation page
├── index.js            # Login/signup logic
├── app.js              # Reservation page logic
└── main.css / reservation.css
```

---

## Next Steps

1. ✅ **Core functionality is working**
2. ⏳ **Add input validation** with express-validator
3. ⏳ **Implement check-in UI** on frontend
4. ⏳ **Add admin dashboard** for staff
5. ⏳ **Deploy to production** (Heroku, AWS, etc.)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API_DOCUMENTATION.md for detailed API specs
3. Check browser console for JavaScript errors
4. Check server logs for backend errors
