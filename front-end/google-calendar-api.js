/**
 * Google Calendar Integration
 * Handles OAuth authentication and calendar syncing
 */

// ==================== Configuration ====================
// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = '43397703428-2rktf88b6nsglk0elbiq2ou920gp6tju.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// ==================== Global Variables ====================
let googleToken = null;
let googleUserEmail = null;
let googleCalendarId = 'primary';
let googleEvents = [];

// ==================== Google API Initialization ====================
function initGoogleAPI() {
    gapi.load('client:auth2', () => {
        gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES.join(' ')
        }).then(auth2 => {
            setupGoogleUI(auth2);
            checkGoogleSignIn(auth2);
        }).catch(error => {
            console.error('Google Auth initialization failed:', error);
            showGoogleSetupGuide();
        });
    });
}

// ==================== Google Auth UI Setup ====================
function setupGoogleUI(auth2) {
    const googleAuthDiv = document.getElementById('googleAuthDiv');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');

    if (googleAuthDiv) {
        googleAuthDiv.style.display = 'inline-block';
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            auth2.signIn().then(user => {
                onGoogleSignIn(user);
            }).catch(error => {
                console.error('Google Sign-in failed:', error);
                alert('Google Sign-in failed. Please check your credentials.');
            });
        });
    }

    if (googleSignOutBtn) {
        googleSignOutBtn.addEventListener('click', () => {
            auth2.signOut().then(() => {
                onGoogleSignOut();
            });
        });
    }
}

// ==================== Check Existing Sign-In ====================
function checkGoogleSignIn(auth2) {
    if (auth2.isSignedIn.get()) {
        const currentUser = auth2.currentUser.get();
        onGoogleSignIn(currentUser);
    }
}

// ==================== Google Sign-In Handler ====================
async function onGoogleSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    googleUserEmail = profile.getEmail();
    googleToken = googleUser.getAuthResponse().id_token;

    // Store token in localStorage
    localStorage.setItem('google_token', googleToken);
    localStorage.setItem('google_email', googleUserEmail);

    // Update UI
    updateGoogleSignInUI(true, googleUserEmail);

    // Load Google Calendar events
    await loadGoogleCalendarEvents();

    // Show sync button
    showGoogleSyncOption();
}

// ==================== Google Sign-Out Handler ====================
function onGoogleSignOut() {
    googleToken = null;
    googleUserEmail = null;
    googleEvents = [];

    localStorage.removeItem('google_token');
    localStorage.removeItem('google_email');

    updateGoogleSignInUI(false);

    // Hide Google elements
    const googleCalendarInfo = document.getElementById('googleCalendarInfo');
    const googleEventsPanel = document.getElementById('googleEventsPanel');
    if (googleCalendarInfo) googleCalendarInfo.style.display = 'none';
    if (googleEventsPanel) googleEventsPanel.style.display = 'none';

    console.log('Google Calendar disconnected');
}

// ==================== Update Google Sign-In UI ====================
function updateGoogleSignInUI(isSignedIn, email = '') {
    const googleAuthDiv = document.getElementById('googleAuthDiv');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');
    const googleCalendarInfo = document.getElementById('googleCalendarInfo');
    const googleUserEmailDiv = document.getElementById('googleUserEmail');
    const googleEventsPanel = document.getElementById('googleEventsPanel');

    if (googleAuthDiv) {
        googleAuthDiv.style.display = 'inline-block';
    }

    if (isSignedIn) {
        if (googleSignInBtn) googleSignInBtn.style.display = 'none';
        if (googleSignOutBtn) googleSignOutBtn.style.display = 'inline-block';
        if (googleCalendarInfo) {
            googleCalendarInfo.style.display = 'block';
            if (googleUserEmailDiv) googleUserEmailDiv.textContent = `Logged in as: ${email}`;
        }
        if (googleEventsPanel) googleEventsPanel.style.display = 'block';
    } else {
        if (googleSignInBtn) googleSignInBtn.style.display = 'inline-block';
        if (googleSignOutBtn) googleSignOutBtn.style.display = 'none';
        if (googleCalendarInfo) googleCalendarInfo.style.display = 'none';
        if (googleEventsPanel) googleEventsPanel.style.display = 'none';
    }
}

// ==================== Load Google Calendar Events ====================
async function loadGoogleCalendarEvents(startDate = null, endDate = null) {
    if (!googleToken) {
        console.error('Not signed in to Google Calendar');
        return [];
    }

    if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Past week
    }
    if (!endDate) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Next 30 days
    }

    try {
        gapi.client.load('calendar', 'v3', () => {
            gapi.client.calendar.events.list({
                'calendarId': googleCalendarId,
                'timeMin': startDate.toISOString(),
                'timeMax': endDate.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'
            }).then(response => {
                googleEvents = response.result.items || [];
                displayGoogleCalendarEvents();

                // Highlight booked times in calendar
                highlightGoogleEventSlots();
            }).catch(error => {
                console.error('Error loading Google Calendar events:', error);
            });
        });
    } catch (error) {
        console.error('Error initializing Google Calendar:', error);
    }
}

// ==================== Display Google Calendar Events ====================
function displayGoogleCalendarEvents() {
    const googleEventsList = document.getElementById('googleEventsList');
    if (!googleEventsList) return;

    if (googleEvents.length === 0) {
        googleEventsList.innerHTML = '<p style="color:#999; padding:12px;">No events in your calendar</p>';
        return;
    }

    let html = '';
    googleEvents.forEach(event => {
        const startTime = new Date(event.start.dateTime || event.start.date);
        const endTime = new Date(event.end.dateTime || event.end.date);

        let timeStr = startTime.toLocaleDateString();
        if (event.start.dateTime) {
            timeStr += ` ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        html += `
      <div style="padding:8px; border-bottom:1px solid #eee; margin-bottom:8px;">
        <div style="font-weight:bold; color:#007bff;">${event.summary || 'Untitled'}</div>
        <div style="font-size:12px; color:#666;">${timeStr}</div>
        ${event.description ? `<div style="font-size:12px; color:#999; margin-top:4px;">${event.description}</div>` : ''}
      </div>
    `;
    });

    googleEventsList.innerHTML = html;
}

// ==================== Highlight Google Event Slots ====================
function highlightGoogleEventSlots() {
    // Get all time slot cells and check against Google events
    const timeCells = document.querySelectorAll('td[data-time]');

    timeCells.forEach(cell => {
        const roomNumber = cell.dataset.room;
        const time = cell.dataset.time;

        // Check if this time has a Google Calendar event
        const hasGoogleEvent = googleEvents.some(event => {
            if (!roomNumber || !time) return false;

            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            const [hour, minute] = time.split(':').map(Number);
            const slotStart = new Date();
            slotStart.setHours(hour, minute, 0);

            return eventStart.getTime() <= slotStart.getTime() &&
                slotStart.getTime() < eventEnd.getTime();
        });

        if (hasGoogleEvent) {
            cell.classList.add('google-event');
            cell.style.backgroundColor = '#4285f4';
            cell.style.color = 'white';
            cell.textContent = 'Google Event';
        }
    });
}

// ==================== Sync Reservation to Google Calendar ====================
async function syncReservationToGoogle(reservation) {
    if (!googleToken) {
        alert('Please sign in with Google Calendar first');
        return false;
    }

    try {
        gapi.client.load('calendar', 'v3', () => {
            const startDate = new Date(reservation.reservationDate);
            const [startHour, startMin] = reservation.startTime.split(':').map(Number);
            startDate.setHours(startHour, startMin, 0);

            const endDate = new Date(reservation.reservationDate);
            const [endHour, endMin] = reservation.endTime.split(':').map(Number);
            endDate.setHours(endHour, endMin, 0);

            const event = {
                'summary': `Room ${reservation.room.roomNumber} - ${reservation.purpose}`,
                'description': `Reservation for ${reservation.numberOfPeople} people\nPurpose: ${reservation.purpose}`,
                'start': {
                    'dateTime': startDate.toISOString(),
                    'timeZone': 'America/New_York'
                },
                'end': {
                    'dateTime': endDate.toISOString(),
                    'timeZone': 'America/New_York'
                },
                'location': `Pratt Music Hall - Room ${reservation.room.roomNumber}`
            };

            gapi.client.calendar.events.insert({
                'calendarId': googleCalendarId,
                'resource': event
            }).then(response => {
                console.log('Event created: ' + response.result.htmlLink);
                alert('✓ Reservation synced to Google Calendar!');

                // Store sync info
                localStorage.setItem(`reservation_${reservation._id}_google_sync`, response.result.id);
                return true;
            }).catch(error => {
                console.error('Error syncing to Google Calendar:', error);
                alert('Failed to sync to Google Calendar: ' + error.message);
                return false;
            });
        });
    } catch (error) {
        console.error('Error syncing reservation:', error);
        return false;
    }
}

// ==================== Show Sync Option ====================
function showGoogleSyncOption() {
    const syncBtn = document.getElementById('syncCalendarBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            alert('Current reservation will be automatically synced to Google Calendar when created.\n\nClick the "Sync to Google Calendar" button after making a reservation to add it to your calendar.');
        });
    }
}

// ==================== Show Google Setup Guide ====================
function showGoogleSetupGuide() {
    const googleAuthDiv = document.getElementById('googleAuthDiv');
    if (googleAuthDiv) {
        googleAuthDiv.innerHTML = `
      <div style="background:#fff3cd; padding:12px; border-radius:4px; margin-top:12px;">
        <strong>⚠️ Google Calendar Setup Required</strong><br>
        <small>To enable Google Calendar integration:</small>
        <ol style="font-size:12px; margin:8px 0; padding-left:20px;">
          <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
          <li>Create a new project</li>
          <li>Enable Google Calendar API</li>
          <li>Create OAuth 2.0 credentials (Web Application)</li>
          <li>Add <code>http://localhost:5000</code> to authorized origins</li>
          <li>Copy the Client ID to <code>google-calendar-api.js</code></li>
        </ol>
      </div>
    `;
    }
}

// ==================== Check for Stored Google Token ====================
window.addEventListener('load', () => {
    const storedToken = localStorage.getItem('google_token');
    const storedEmail = localStorage.getItem('google_email');

    if (storedToken && storedEmail) {
        googleToken = storedToken;
        googleUserEmail = storedEmail;
        updateGoogleSignInUI(true, storedEmail);
        loadGoogleCalendarEvents();
        showGoogleSyncOption();
    }

    // Initialize Google API
    if (GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        initGoogleAPI();
    } else {
        showGoogleSetupGuide();
    }
});

// ==================== Helper: Format Date ====================
function formatGoogleDateRange(event) {
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);

    if (event.start.dateTime) {
        return `${start.toLocaleString()} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return start.toLocaleDateString();
    }
}

// Export functions for use in app.js
window.syncReservationToGoogle = syncReservationToGoogle;
window.loadGoogleCalendarEvents = loadGoogleCalendarEvents;
