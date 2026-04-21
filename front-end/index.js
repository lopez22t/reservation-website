document.addEventListener('DOMContentLoaded', () => {
    // ==================== DOM Elements ====================
    const loginBtn = document.getElementById('loginBtn');
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('closeLogin');
    const reservationsList = document.getElementById('reservationsList');
    const checkInHistoryList = document.getElementById('checkInHistoryList');
    const tabReservations = document.getElementById('tabReservations');
    const tabHistory = document.getElementById('tabHistory');
    const reservationsTab = document.getElementById('reservationsTab');
    const historyTab = document.getElementById('historyTab');

    let authToken = localStorage.getItem('mhc_token') || null;
    const logoutBtn = document.getElementById('logoutBtn');
    const authContainer = document.getElementById('authContainer');
    const reservationsContainer = document.getElementById('reservationsContainer');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');
    const refreshBtn = document.getElementById('refreshReservations');

    // ==================== UI Functions ====================
    function showModal() { modal.style.display = 'flex'; }
    function hideModal() { modal.style.display = 'none'; }

    function switchTab(tabName) {
        if (tabName === 'reservations') {
            reservationsTab.style.display = 'block';
            historyTab.style.display = 'none';
            tabReservations.style.fontWeight = 'bold';
            tabReservations.style.color = '#333';
            tabReservations.style.borderBottom = '3px solid #007bff';
            tabHistory.style.fontWeight = 'normal';
            tabHistory.style.color = '#999';
            tabHistory.style.borderBottom = 'none';
        } else {
            reservationsTab.style.display = 'none';
            historyTab.style.display = 'block';
            tabReservations.style.fontWeight = 'normal';
            tabReservations.style.color = '#999';
            tabReservations.style.borderBottom = 'none';
            tabHistory.style.fontWeight = 'bold';
            tabHistory.style.color = '#333';
            tabHistory.style.borderBottom = '3px solid #007bff';
        }
    }

    closeBtn?.addEventListener('click', hideModal);
    tabReservations?.addEventListener('click', () => switchTab('reservations'));
    tabHistory?.addEventListener('click', () => {
        switchTab('history');
        loadCheckInHistory();
    });

    // ==================== Reservations Loading ====================
    async function loadReservations() {
        reservationsList.textContent = 'Loading...';
        try {
            const resp = await fetch(`/api/reservations`,
                { headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {} });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.message || 'Error fetching reservations');

            const items = json.data || [];
            if (items.length === 0) {
                reservationsList.innerHTML = '<p>No reservations found.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';

            items.forEach(r => {
                const li = document.createElement('li');
                li.style.padding = '12px';
                li.style.marginBottom = '8px';
                li.style.border = '1px solid #ddd';
                li.style.borderRadius = '4px';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';

                const date = new Date(r.reservationDate).toDateString();
                const statusBadge = `<span style="display:inline-block; padding:4px 8px; border-radius:3px; font-size:12px; margin-left:8px; background:${r.status === 'pending' ? '#fff3cd' : r.status === 'confirmed' ? '#d1ecf1' : r.status === 'completed' ? '#d4edda' : '#f8d7da'}; color:#333;">${r.status.toUpperCase()}</span>`;

                const infoDiv = document.createElement('div');
                infoDiv.style.flex = '1';
                infoDiv.innerHTML = `<div><strong>${r.room?.roomNumber || 'Room'}</strong> • ${date}</div><div style="font-size:14px; color:#666; margin-top:4px;">${r.startTime} to ${r.endTime} • ${r.purpose} • ${r.numberOfPeople} people ${statusBadge}</div>`;

                const buttonsDiv = document.createElement('div');
                buttonsDiv.style.display = 'flex';
                buttonsDiv.style.gap = '8px';
                buttonsDiv.style.marginLeft = '12px';

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.style.padding = '6px 12px';
                editBtn.style.fontSize = '12px';
                editBtn.addEventListener('click', async () => {
                    const newStart = prompt('Start time (HH:MM)', r.startTime) || r.startTime;
                    const newEnd = prompt('End time (HH:MM)', r.endTime) || r.endTime;
                    const newNum = parseInt(prompt('Number of people', String(r.numberOfPeople)) || String(r.numberOfPeople));
                    const newPurpose = prompt('Purpose', r.purpose) || r.purpose;

                    if (!confirm('Save changes?')) return;

                    try {
                        const putResp = await fetch(`/api/reservations/${r._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + authToken
                            },
                            body: JSON.stringify({
                                startTime: newStart,
                                endTime: newEnd,
                                numberOfPeople: newNum,
                                purpose: newPurpose
                            })
                        });
                        const putJson = await putResp.json();
                        if (!putResp.ok) throw new Error(putJson.message || 'Error updating');
                        await loadReservations();
                    } catch (err) {
                        alert('Update failed: ' + err.message);
                    }
                });

                // Cancel button
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.padding = '6px 12px';
                cancelBtn.style.fontSize = '12px';
                cancelBtn.addEventListener('click', async () => {
                    if (!confirm('Cancel this reservation?')) return;
                    try {
                        const delResp = await fetch(`/api/reservations/${r._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + authToken
                            }
                        });
                        const delJson = await delResp.json();
                        if (!delResp.ok) throw new Error(delJson.message || 'Error cancelling');
                        await loadReservations();
                    } catch (err) {
                        alert('Cancel failed: ' + err.message);
                    }
                });

                // Check-In button
                if (['pending', 'confirmed'].includes(r.status)) {
                    const checkInBtn = document.createElement('button');
                    checkInBtn.textContent = 'Check-In';
                    checkInBtn.style.padding = '6px 12px';
                    checkInBtn.style.fontSize = '12px';
                    checkInBtn.style.backgroundColor = '#28a745';
                    checkInBtn.style.color = 'white';
                    checkInBtn.style.border = 'none';
                    checkInBtn.style.borderRadius = '4px';
                    checkInBtn.style.cursor = 'pointer';
                    checkInBtn.addEventListener('click', async () => {
                        try {
                            const checkInResp = await fetch('/api/signin', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + authToken
                                },
                                body: JSON.stringify({
                                    reservation: r._id,
                                    room: r.room._id,
                                    building: r.building?._id || '',
                                    notes: 'Checked in from home page'
                                })
                            });
                            const checkInJson = await checkInResp.json();
                            if (!checkInResp.ok) throw new Error(checkInJson.message || 'Check-in failed');
                            alert('Checked in successfully!');
                            await loadReservations();
                        } catch (err) {
                            alert('Check-in failed: ' + err.message);
                        }
                    });
                    buttonsDiv.appendChild(checkInBtn);
                }

                buttonsDiv.appendChild(editBtn);
                buttonsDiv.appendChild(cancelBtn);
                li.appendChild(infoDiv);
                li.appendChild(buttonsDiv);
                ul.appendChild(li);
            });
            reservationsList.innerHTML = '';
            reservationsList.appendChild(ul);
        } catch (err) {
            reservationsList.textContent = 'Error: ' + err.message;
        }
    }

    // ==================== Check-In History Loading ====================
    async function loadCheckInHistory() {
        checkInHistoryList.textContent = 'Loading...';
        try {
            const resp = await fetch('/api/signin/history',
                { headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {} });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.message || 'Error fetching history');

            const items = json.data || [];
            if (items.length === 0) {
                checkInHistoryList.innerHTML = '<p>No check-in history yet.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';

            items.forEach(h => {
                const li = document.createElement('li');
                li.style.padding = '12px';
                li.style.marginBottom = '8px';
                li.style.border = '1px solid #ddd';
                li.style.borderRadius = '4px';
                li.style.backgroundColor = '#f9f9f9';

                const signInTime = new Date(h.signInTime).toLocaleString();
                const signOutTime = h.signOutTime ? new Date(h.signOutTime).toLocaleString() : 'Still checked in';
                const duration = h.actualDuration ? `${Math.round(h.actualDuration / 60)} min` : 'In progress';

                li.innerHTML = `
                    <div><strong>Room ${h.room?.roomNumber || 'Unknown'}</strong> • ${h.status.toUpperCase()}</div>
                    <div style="font-size:14px; color:#666; margin-top:4px;">
                        Checked in: ${signInTime}<br>
                        Checked out: ${signOutTime}<br>
                        Duration: ${duration}
                        ${h.notes ? `<br><em>${h.notes}</em>` : ''}
                    </div>
                `;
                ul.appendChild(li);
            });
            checkInHistoryList.innerHTML = '';
            checkInHistoryList.appendChild(ul);
        } catch (err) {
            checkInHistoryList.textContent = 'Error: ' + err.message;
        }
    }

    // ==================== Auth Helpers ====================
    function setLoggedIn(user, token) {
        authToken = token;
        if (token) localStorage.setItem('mhc_token', token);
        authContainer.style.display = 'none';
        reservationsContainer.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        modalTitle.textContent = 'Your Reservations';
        userInfo.textContent = `${user.firstName || ''} ${user.lastName || ''} (${user.email || ''})`;
        loadReservations();
    }

    function clearAuth() {
        authToken = null;
        localStorage.removeItem('mhc_token');
        authContainer.style.display = 'block';
        reservationsContainer.style.display = 'none';
        logoutBtn.style.display = 'none';
        modalTitle.textContent = 'Account';
        userInfo.textContent = '';
    }

    // Try to restore session via token
    async function restoreSession() {
        if (!authToken) return clearAuth();
        try {
            const p = await fetch('/api/auth/profile', { headers: { 'Authorization': 'Bearer ' + authToken } });
            if (!p.ok) throw new Error('Invalid token');
            const pj = await p.json();
            setLoggedIn(pj.user, authToken);
        } catch (e) {
            clearAuth();
        }
    }

    // ==================== Event Listeners ====================
    refreshBtn?.addEventListener('click', loadReservations);
    logoutBtn?.addEventListener('click', () => {
        if (!confirm('Logout?')) return;
        clearAuth();
    });

    // ==================== Auth Form Elements ====================
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const doLogin = document.getElementById('doLogin');
    const showSignup = document.getElementById('showSignup');
    const signupForm = document.getElementById('signupForm');
    const signupFirst = document.getElementById('signupFirst');
    const signupLast = document.getElementById('signupLast');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const doSignup = document.getElementById('doSignup');
    const showLogin = document.getElementById('showLogin');

    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    doSignup?.addEventListener('click', async (e) => {
        e.preventDefault();
        const body = {
            firstName: signupFirst.value,
            lastName: signupLast.value,
            email: signupEmail.value,
            password: signupPassword.value
        };
        try {
            const r = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Signup failed');
            setLoggedIn(j.user, j.token);
            hideModal();
        } catch (err) {
            alert('Signup error: ' + err.message);
        }
    });

    doLogin?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const r = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail.value,
                    password: loginPassword.value
                })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Login failed');
            setLoggedIn(j.user, j.token);
            hideModal();
        } catch (err) {
            alert('Login error: ' + err.message);
        }
    });

    loginBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        showModal();
        await restoreSession();
    });

    // ==================== Page Initialization ====================
    restoreSession();
});
