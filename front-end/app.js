const params = new URLSearchParams(window.location.search);
const building = params.get("building") || "Ciruti";

const roomData = {
  Ciruti: ["Room 6B", "Room 6C", "Room 6D"],
  Pratt: ["Room 201", "Room 202"]
};

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
  const rooms = roomData[building];
  const container = document.querySelector(".reservation-table");
  container.innerHTML = `<h2>${building} – ${selectedDate.toDateString()}</h2>`;

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

document.addEventListener("click", e => {
  if (e.target.matches("td.free")) {
    const room = e.target.dataset.room;
    const time = e.target.dataset.time;
    if (confirm(`Reserve ${room} at ${time}?`)) {
      reserveSlot(building, room, selectedDate, time);
      renderReservationTable();
    }
  }
});

renderCalendar();
renderReservationTable();
