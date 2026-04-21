# Google Calendar API Implementation - Quick Reference

## 📁 Files Added/Modified

### New Files
- **`front-end/google-calendar-api.js`** - Main Google Calendar integration module

### Modified Files
- **`front-end/reservation.html`** - Added Google Calendar UI elements
- **`front-end/app.js`** - Integrated Google Calendar syncing
- **`front-end/reservation.css`** - Added Google Calendar styling
- **`front-end/main.css`** - Added Google button styling
- **`README.md`** - Added Google Calendar to feature list
- **`GOOGLE_CALENDAR_SETUP.md`** - Complete setup guide (NEW)

---

## 🔧 Implementation Overview

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (Browser)                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  reservation.html                                        │
│    ├── Google Sign-in Button                            │
│    ├── Google Events Panel                              │
│    └── Calendar sync indicators                         │
│                                                          │
│  app.js                                                  │
│    ├── Load Google Calendar events                      │
│    ├── Display events on reservation table              │
│    └── Sync reservations to Google Calendar             │
│                                                          │
│  google-calendar-api.js                                 │
│    ├── OAuth 2.0 authentication flow                    │
│    ├── Google Calendar API calls                        │
│    ├── Event management                                 │
│    └── Token storage/retrieval                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          ↓ gapi.client
┌──────────────────────────────────────────────────────────┐
│            Google Calendar API (Cloud)                   │
├──────────────────────────────────────────────────────────┤
│  • Create events                                         │
│  • List events                                           │
│  • Update events                                         │
│  • Delete events                                         │
└──────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Status | Details |
|---------|--------|---------|
| OAuth 2.0 Sign-in | ✅ | Users sign in with Google account |
| Load Events | ✅ | Fetch user's calendar events for date range |
| Display Events | ✅ | Show events in UI and highlight time slots |
| Create Events | ✅ | Auto-sync reservations to Google Calendar |
| Event Conflicts | ✅ | Mark Google Calendar events as blocked |
| Token Management | ✅ | Store/retrieve GitHub tokens |
| Sign-out | ✅ | Clear tokens and disconnect Google Calendar |

---

## 🎯 Configuration

### Step 1: Get Google Client ID

```
Google Cloud Console
  → Create Project
  → APIs & Services
    → Enable Google Calendar API
    → Create OAuth 2.0 Credentials
      → Get Client ID
```

### Step 2: Update Configuration

Edit `front-end/google-calendar-api.js`:

```javascript
// Line ~10
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID.

### Step 3: Authorized Redirect URIs

Configure in Google Cloud Console:
- `http://localhost:5000`
- `http://localhost:5001` (if needed)
- `https://yourdomain.com` (production)

---

## 📝 Function Reference

### Core Functions

#### `initGoogleAPI()`
- **Purpose**: Initialize Google API and OAuth 2.0
- **Called**: Automatically on page load
- **Returns**: void

#### `onGoogleSignIn(googleUser)`
- **Purpose**: Handle successful OAuth login
- **Called**: When user clicks "Sign in with Google"
- **Params**: `googleUser` - Google User object
- **Actions**: Store token, update UI, load events

#### `onGoogleSignOut()`
- **Purpose**: Handle logout
- **Called**: When user clicks "Sign out"
- **Actions**: Clear token, reset UI, clear events

#### `loadGoogleCalendarEvents(startDate, endDate)`
- **Purpose**: Fetch calendar events from Google
- **Called**: On sign-in and when date range changes
- **Params**: 
  - `startDate` (Date) - Start of range (default: -7 days)
  - `endDate` (Date) - End of range (default: +30 days)
- **Returns**: void (updates `googleEvents` array)
- **API Call**: `gapi.client.calendar.events.list()`

#### `displayGoogleCalendarEvents()`
- **Purpose**: Render events in the UI
- **Called**: After `loadGoogleCalendarEvents()`
- **Updates**: `#googleEventsList` div

#### `syncReservationToGoogle(reservation)`
- **Purpose**: Create event in user's Google Calendar
- **Called**: After creating a reservation (auto-sync)
- **Params**: `reservation` - Reservation object from backend
- **Returns**: Promise<boolean>
- **API Call**: `gapi.client.calendar.events.insert()`
- **Event Details**: 
  - Title: `Room [#] - [purpose]`
  - Location: `Pratt Music Hall - Room [#]`
  - Description: Number of people & purpose

#### `highlightGoogleEventSlots()`
- **Purpose**: Mark time slots with Google Calendar events
- **Called**: After loading events
- **Visual**: Blue background, "Google Event" text

### Utility Functions

#### `updateGoogleSignInUI(isSignedIn, email)`
- Updates button visibility and info display

#### `showGoogleSyncOption()`
- Enables sync button after successful sign-in

#### `showGoogleSetupGuide()`
- Displays setup instructions if Client ID not configured

#### `formatGoogleDateRange(event)`
- Formats Google Calendar event dates for display

---

## 🔄 Data Flow

### Sign-In Flow
```
1. User clicks "📅 Sign in with Google"
2. Google shows OAuth consent screen
3. User authorizes access
4. onGoogleSignIn() is called
5. Token stored in localStorage
6. UI updates (button changes to "Sign out")
7. loadGoogleCalendarEvents() called
```

### Reservation Creation Flow
```
1. User selects time slot and creates reservation
2. Reservation saved to backend
3. Backend returns reservation object
4. syncReservationToGoogle(reservation) called
5. Event created in user's Google Calendar
6. Sync ID stored in localStorage
7. User gets success confirmation
```

### Event Display Flow
```
1. loadGoogleCalendarEvents() fetches events from Google
2. Events stored in googleEvents array
3. displayGoogleCalendarEvents() renders in UI
4. highlightGoogleEventSlots() marks booked times
5. Reserved times show blue "Google Event" label
```

---

## 🔑 Key Variables

```javascript
let googleToken = null;           // OAuth token
let googleUserEmail = null;       // User's email
let googleCalendarId = 'primary'; // Default calendar
let googleEvents = [];            // Array of events
```

---

## 🎨 UI Elements

### Navigation Bar
```
[Home] [Login] [📅 Sign in with Google] [Sign out]
```

### Google Calendar Info Box
```
✓ Google Calendar Connected
Logged in as: user@gmail.com
[Sync to Google Calendar]
```

### Google Events Panel
```
📅 Google Calendar Events
• Event 1 - Tue, Mar 24, 2:00 PM
• Event 2 - Wed, Mar 25, 9:00 AM
• Event 3 - Thu, Mar 26, 3:30 PM
```

### Time Slot Highlighting
```
Normal slot:    [Free]       ← White background
Google event:   [Google Event] ← Blue background
Booked:         [Booked]     ← Purple background
```

---

## 🐛 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "initialization failed" | Invalid Client ID | Update Client ID in code |
| "redirect URI doesn't match" | Port not authorized | Add port to Google Console |
| "Permission denied" | User didn't grant access | Re-authenticate |
| Events not loading | Not signed in | Click Google sign-in button |
| Sync fails silently | API limit reached | Wait and retry |

---

## 🧪 Testing

### Test Sign-In
1. Click "📅 Sign in with Google"
2. See Google permission dialog
3. Authorize access
4. Should see "✓ Google Calendar Connected"

### Test Event Loading
1. After sign-in, navigate to Reservation page
2. Should see your calendar events in "📅 Google Calendar Events" panel
3. Time slots with events should be blue

### Test Reservation Sync
1. Open Google Calendar in another tab
2. Create a reservation
3. Check Google Calendar
4. New event should appear instantly

### Test Sign-Out
1. Click "Sign out" button
2. Should return to sign-in state
3. Google events should disappear

---

## 📚 API Reference

### Google Calendar API Methods Used

#### `events.list()`
```javascript
gapi.client.calendar.events.list({
  'calendarId': 'primary',
  'timeMin': '2024-03-24T00:00:00Z',
  'timeMax': '2024-04-24T23:59:59Z',
  'singleEvents': true,
  'orderBy': 'startTime'
})
```

#### `events.insert()`
```javascript
gapi.client.calendar.events.insert({
  'calendarId': 'primary',
  'resource': {
    'summary': 'Room 101 - studying',
    'start': { 'dateTime': '...', 'timeZone': 'America/New_York' },
    'end': { 'dateTime': '...', 'timeZone': 'America/New_York' },
    'location': 'Pratt Music Hall - Room 101'
  }
})
```

---

## 🚀 Production Checklist

- [ ] Google Cloud Project created
- [ ] Google Calendar API enabled
- [ ] OAuth 2.0 Client ID generated
- [ ] Production domain added to authorized origins
- [ ] Client ID updated in code
- [ ] HTTPS enforced
- [ ] Environment variable configured (optional)
- [ ] Tested on production domain
- [ ] Tested across different browsers
- [ ] Error handling verified

---

## 🔒 Security Notes

- ✅ Client ID is safe to expose (not a secret)
- ✅ Tokens stored only in localStorage
- ✅ No server-side processing needed
- ✅ User maintains control of Google Calendar
- ❌ Never expose Google OAuth Client Secret in frontend

---

## 📞 Support

For issues:
1. Check [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md)
2. Review Google Cloud Console configuration
3. Check browser console for errors (F12)
4. Verify Client ID is correctly set
5. Test with a different Google account
