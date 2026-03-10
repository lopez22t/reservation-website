const params = new URLSearchParams(window.location.search);
// Single-building front-end: default to Pratt (internal key)
const building = params.get("building") || "Pratt";

// Display name shown in the UI
const DISPLAY_NAME = 'Pratt Music Hall';

// JWT token from localStorage
let authToken = localStorage.getItem('mhc_token');

// Check if user is authenticated
if (!authToken) {
  alert('Please log in first to make a reservation');
  window.location.href = 'index.html';
}

// Room list fetched from backend
let roomsList = []; // array of { _id, roomNumber }

function formatDateYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
  "21:00"
];

let selectedDate = new Date();
let reservations = [];

function renderCalendar() {
  const calendar = document.getElementById("calendar-widget");
  calendar.innerHTML = "";

  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const header = document.createElement("div");
  header.className = "calendar-header";
  header.textContent = `${selectedDate.toLocaleString("default", { month: "long" })} ${year}`;
  header.style.gridColumn = "span 7";
  header.style.height = "40px";
  calendar.appendChild(header);


  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.textContent = d;

    // Highlight if it's the selected date
    const isSelected = selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year;
    if (isSelected) {
      cell.classList.add("selected");
    }

    cell.onclick = () => {
      selectedDate = new Date(year, month, d);

      // Remove previous selection
      document.querySelectorAll("#calendar-widget .selected").forEach(el => {
        el.classList.remove("selected");
      });

      // Highlight new selection
      cell.classList.add("selected");

      renderReservationTable();
    };
    calendar.appendChild(cell);
  }
}

function checkIfBooked(building, room, date, time) {
  return reservations.some(r =>
    r.building === building &&
    r.room === room &&
    r.date === date.toDateString() &&
    r.time === time
  );
}

function reserveSlot(building, room, date, time) {
  reservations.push({
    building,
    room,
    date: date.toDateString(),
    time
  });
}

function renderReservationTable() {
  const container = document.querySelector(".reservation-table");
  container.innerHTML = `<h2>${DISPLAY_NAME} – ${selectedDate.toDateString()}</h2>`;
  const rooms = roomsList.map(r => r.roomNumber);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Time</th>` + rooms.map(r => `<th>${r}</th>`).join("");
  thead.appendChild(headerRow);

  for (let time of timeSlots) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${time}</td>` + rooms.map(room => {
      const isBooked = checkIfBooked(building, room, selectedDate, time);
      return `<td class="${isBooked ? 'booked' : 'free'}" data-room="${room}" data-time="${time}">
                ${isBooked ? 'Booked' : 'Free'}
              </td>`;
    }).join("");
    tbody.appendChild(row);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

document.addEventListener("click", async e => {
  if (e.target.matches("td.free")) {
    const roomNumber = e.target.dataset.room;
    const time = e.target.dataset.time;
    // find room id
    const roomObj = roomsList.find(r => r.roomNumber === roomNumber);
    if (!roomObj) return alert('Room not found');

    if (confirm(`Reserve ${roomNumber} at ${time}?`)) {
      const numberOfPeople = parseInt(prompt('Number of people', '1')) || 1;
      const purpose = prompt('Purpose (studying, meeting, other)', 'studying') || 'studying';

      // build reservation payload
      const dateStr = formatDateYYYYMMDD(selectedDate);
      const startTime = time;
      // default to 1 hour slot
      const [h, m] = time.split(':').map(Number);
      const endHour = String(h + 1).padStart(2, '0');
      const endTime = `${endHour}:${String(m).padStart(2, '0')}`;

      try {
        const resp = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({
            room: roomObj._id,
            reservationDate: dateStr,
            startTime,
            endTime,
            purpose,
            numberOfPeople
          })
        });

        const json = await resp.json();
        if (!resp.ok) throw new Error(json.message || 'Booking failed');

        alert('Reservation created');
        await loadReservationsForDate();
        renderReservationTable();
      } catch (err) {
        alert('Error creating reservation: ' + err.message);
      }
    }
  }
});

// Load rooms from backend and then load reservations
async function init() {
  try {
    const roomsResp = await fetch('/api/rooms');
    const roomsJson = await roomsResp.json();
    roomsList = (roomsJson.data || []).map(r => ({ _id: r._id, roomNumber: r.roomNumber }));

    await loadReservationsForDate();
    renderCalendar();
    renderReservationTable();
  } catch (err) {
    console.error('Init error', err);
  }
}

// Load reservations for currently selected date for all rooms
async function loadReservationsForDate() {
  reservations = [];
  const dateStr = formatDateYYYYMMDD(selectedDate);
  await Promise.all(roomsList.map(async room => {
    try {
      const resp = await fetch(`/api/reservations/room/${room._id}?date=${dateStr}`);
      const json = await resp.json();
      const items = json.data || [];
      items.forEach(it => {
        reservations.push({
          building: DISPLAY_NAME,
          room: room.roomNumber,
          date: new Date(it.reservationDate).toDateString(),
          time: it.startTime
        });
      });
    } catch (err) {
      console.error('Load reservations error for room', room._id, err);
    }
  }));
}

// Initialize app: load rooms & reservations then render UI
init();
