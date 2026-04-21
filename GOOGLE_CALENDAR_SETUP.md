# Google Calendar Integration Setup Guide

This guide explains how to set up and use Google Calendar integration with the MHC Room Reservation System.

## 🎯 Features

With Google Calendar integration enabled, users can:
- ✅ Sign in with their Google account
- ✅ View their Google Calendar events in the reservation system
- ✅ Automatically sync room reservations to their Google Calendar
- ✅ See conflicts between reservations and calendar events
- ✅ Receive calendar notifications for reservations

---

## 🚀 Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a Project"** at the top
3. Click **"NEW PROJECT"**
4. Enter project name: `MHC-Room-Reservation`
5. Click **"CREATE"**
6. Wait for the project to be created (1-2 minutes)

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Google Calendar API"**
3. Click on **Google Calendar API**
4. Click **"ENABLE"**
5. You should see "API enabled" message

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen:
   - Choose **"External"** as User Type
   - Click **"CREATE"**
   - Fill in the consent screen:
     - App name: `MHC Room Reservation`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"SAVE AND CONTINUE"**
   - Skip scopes (click **"SAVE AND CONTINUE"**)
   - Skip test users (click **"SAVE AND CONTINUE"**)
   - Review and click **"BACK TO DASHBOARD"**

5. Back in Credentials, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** again
6. Choose **"Web application"** as Application type
7. Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**
   - Add: `http://localhost:5000`
   - Add: `http://localhost:5001` (if using different port)
   - Add: `https://yourdomain.com` (for production)

8. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
   - Add: `http://localhost:5000`
   - Add: `http://localhost:5001`

9. Click **"CREATE"**
10. Copy the **"Client ID"** (you'll need this next)

### Step 4: Configure the Application

1. Open `/front-end/google-calendar-api.js`
2. Find this line (near the top):
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID from Step 3
4. **Save the file**

### Step 5: Start the Application

```bash
cd back-end
npm run dev
```

Then open `http://localhost:5000` in your browser.

---

## 📖 How to Use Google Calendar Integration

### First-Time Setup

1. Navigate to the **Reservation Page** (click "Pratt Music Hall")
2. Look for the **"📅 Sign in with Google"** button in the navigation bar
3. Click it and authorize the application to access your Google Calendar
4. You'll see a message: **"✓ Google Calendar Connected"**

### Viewing Google Calendar Events

1. After signing in with Google, your calendar events will appear:
   - In the **"📅 Google Calendar Events"** panel below the reservation table
   - Time slots with calendar events will show in **blue** color
   - These slots are blocked from booking

### Syncing Reservations

1. **Automatic Sync**: When you create a reservation, it's automatically synced to your Google Calendar
2. **Manual Sync**: Click the **"Sync to Google Calendar"** button to sync existing reservations
3. The event will appear in your Google Calendar with:
   - Title: `Room [Number] - [Purpose]`
   - Location: `Pratt Music Hall - Room [Number]`
   - Description: Includes number of people and purpose

### Example Reservation Event

When you reserve Room 101 for studying tomorrow at 2:00 PM:

**Google Calendar Event:**
```
Title: Room 101 - studying
Time: Tomorrow 2:00 PM - 3:00 PM
Location: Pratt Music Hall - Room 101
Description: Reservation for 1 people
             Purpose: studying
```

### Disconnect Google Calendar

1. Click the **"Sign out"** button (appears after signing in with Google)
2. Your Google Calendar will no longer be synced
3. Previously synced events remain in your Google Calendar

---

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│     Google Cloud Console                │
│  (OAuth Configuration & Client ID)      │
└────────────────┬────────────────────────┘
                 │
                 │ Client ID used in
                 ▼
┌─────────────────────────────────────────┐
│   google-calendar-api.js (Frontend)     │
│  • Handles OAuth flow                   │
│  • Loads calendar events                │
│  • Syncs reservations                   │
└────────────────┬────────────────────────┘
                 │
                 │ gapi.client library
                 ▼
┌─────────────────────────────────────────┐
│   Google Calendar API                   │
│  • Events.list()                        │
│  • Events.insert()                      │
└─────────────────────────────────────────┘
```

### File Structure

```
front-end/
├── google-calendar-api.js      (NEW - Main integration file)
├── reservation.html            (Updated - Added Google UI)
├── app.js                       (Updated - Integrated sync)
├── reservation.css             (Updated - Added Google styling)
└── main.css                     (Updated - Added Google styling)
```

### API Functions

All Google Calendar functions are in `google-calendar-api.js`:

| Function | Purpose |
|----------|---------|
| `initGoogleAPI()` | Initialize Google API with OAuth |
| `onGoogleSignIn()` | Handle successful OAuth login |
| `onGoogleSignOut()` | Handle logout |
| `loadGoogleCalendarEvents()` | Fetch user's calendar events |
| `displayGoogleCalendarEvents()` | Render events in UI |
| `syncReservationToGoogle()` | Create event in Google Calendar |
| `highlightGoogleEventSlots()` | Mark booked time slots |

---

## 🐛 Troubleshooting

### "Google API initialization failed"
- **Cause**: Invalid or missing Client ID
- **Solution**: Check that your Client ID is correctly copied in `google-calendar-api.js`

### "The redirect URI doesn't match what was registered"
- **Cause**: Your localhost port isn't authorized
- **Solution**: Go back to Google Cloud Console, Credentials, and add your current port to the authorized URIs

### Events not syncing
- **Cause**: Not signed in with Google
- **Solution**: Click the "📅 Sign in with Google" button to authenticate

### "Permission denied" error
- **Cause**: User didn't allow calendar access
- **Solution**: Re-authenticate with Google and ensure to grant permission

### Some calendar events don't appear
- **Cause**: Events from other calendars aren't synced by default
- **Solution**: Google Calendar API only shows primary calendar; other calendars require additional scopes

---

## 🔒 Security & Privacy

### What Data is Shared?
- ✅ Only your email address (for display)
- ✅ Your Google Calendar events (read-only)
- ✅ New events created by the app

### What Data is NOT Shared?
- ❌ Your Google password
- ❌ Other Google application data
- ❌ Personal information beyond email

### Token Storage
- Tokens are stored in browser's `localStorage`
- Tokens expire after 1 hour
- You can clear tokens by signing out

---

## 📱 Usage Examples

### Example 1: Check Schedule Before Booking

1. Sign in with Google
2. View your calendar events
3. See that you have class from 2-3 PM
4. Book the room at 3:15 PM instead
5. Reservation auto-syncs to your calendar

### Example 2: Get Reminders

1. Book a reservation (gets synced to Google Calendar)
2. Open your Google Calendar
3. Edit the event and add a reminder (e.g., 15 minutes before)
4. You'll get a notification/email reminder

### Example 3: Share with Friends

1. Book a reservation
2. Event appears in your Google Calendar
3. Share your calendar link with friends
4. They can see when you've booked rooms

---

## 🚀 Production Deployment

When deploying to production:

1. **Update Authorized Origins** in Google Cloud Console:
   - Add your production domain (e.g., `https://mhc-reservations.edu`)
   - Remove `localhost` URIs

2. **Update google-calendar-api.js**:
   - Keep your Client ID (it's safe to expose)

3. **SSL/HTTPS Required**:
   - OAuth requires HTTPS for production
   - Use services like Let's Encrypt for free SSL

4. **Environment Variables** (Optional):
   - Store Client ID in `.env` and update HTML script loading:
   ```html
   <!-- Instead of hardcoding in google-calendar-api.js -->
   <script>
     window.GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   </script>
   ```

---

## 📚 Additional Resources

- [Google Calendar API Docs](https://developers.google.com/calendar)
- [OAuth 2.0 Reference](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Library](https://developers.google.com/api-client-library/)

---

## ✅ Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google Calendar API
- [ ] Generated OAuth 2.0 Client ID
- [ ] Added authorized origins (include your domain)
- [ ] Updated `google-calendar-api.js` with Client ID
- [ ] Tested sign-in on localhost
- [ ] Created a reservation and verified Google Calendar sync

