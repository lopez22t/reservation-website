document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('closeLogin');
    const list = document.getElementById('reservationsList');
    let currentEmail = null;
    let authToken = localStorage.getItem('mhc_token') || null;
    const logoutBtn = document.getElementById('logoutBtn');
    const authContainer = document.getElementById('authContainer');
    const reservationsContainer = document.getElementById('reservationsContainer');
    const modalTitle = document.getElementById('modalTitle');
    const userInfo = document.getElementById('userInfo');
    const refreshBtn = document.getElementById('refreshReservations');

    function showModal() { modal.style.display = 'flex'; }
    function hideModal() { modal.style.display = 'none'; }

    closeBtn?.addEventListener('click', hideModal);

    async function loadReservations(email) {
        list.textContent = 'Loading...';
        try {
            const resp = await fetch(`/api/reservations`,
                { headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {} });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.message || 'Error fetching reservations');

            const items = json.data || [];
            if (items.length === 0) {
                list.innerHTML = '<p>No reservations found for this email.</p>';
                return;
            }

            const ul = document.createElement('ul');
            items.forEach(r => {
                const li = document.createElement('li');
                const date = new Date(r.reservationDate).toDateString();
                li.innerHTML = `<div style="flex:1">${date} — ${r.startTime} to ${r.endTime} — ${r.purpose} — ${r.numberOfPeople} people — Room ${r.room?.roomNumber || r.room}</div>`;

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.style.marginLeft = '8px';
                editBtn.addEventListener('click', async () => {
                    // Prompt for new values (pre-filled)
                    const newStart = prompt('Start time (HH:MM)', r.startTime) || r.startTime;
                    const newEnd = prompt('End time (HH:MM)', r.endTime) || r.endTime;
                    const newNum = parseInt(prompt('Number of people', String(r.numberOfPeople)) || String(r.numberOfPeople));
                    const newPurpose = prompt('Purpose', r.purpose) || r.purpose;

                    if (!confirm('Save changes to this reservation?')) return;

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
                        if (!putResp.ok) throw new Error(putJson.message || 'Error updating reservation');
                        // reload list
                        await loadReservations(currentEmail);
                    } catch (putErr) {
                        alert('Update failed: ' + putErr.message);
                    }
                });

                // Cancel button
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.marginLeft = '12px';
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
                        // reload list
                        await loadReservations(currentEmail);
                    } catch (delErr) {
                        alert('Cancel failed: ' + delErr.message);
                    }
                });

                const right = document.createElement('div');
                right.appendChild(editBtn);
                right.appendChild(cancelBtn);
                li.appendChild(right);
                ul.appendChild(li);
            });
            list.innerHTML = '';
            list.appendChild(ul);
        } catch (err) {
            list.textContent = 'Error: ' + err.message;
        }
    }

    // Auth helpers
    function setLoggedIn(user, token) {
        authToken = token;
        if (token) localStorage.setItem('mhc_token', token);
        currentEmail = user?.email?.toLowerCase();
        authContainer.style.display = 'none';
        reservationsContainer.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        modalTitle.textContent = 'Your Reservations';
        userInfo.textContent = `${user.firstName || ''} ${user.lastName || ''} (${currentEmail})`;
        loadReservations(currentEmail);
    }

    function clearAuth() {
        authToken = null;
        localStorage.removeItem('mhc_token');
        currentEmail = null;
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

    // wire refresh
    refreshBtn?.addEventListener('click', async () => { if (currentEmail) await loadReservations(currentEmail); });

    // logout
    logoutBtn?.addEventListener('click', () => { if (!confirm('Logout?')) return; clearAuth(); });

    // signup/login form wiring
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

    showSignup?.addEventListener('click', (e) => { e.preventDefault(); signupForm.style.display = 'block'; loginForm.style.display = 'none'; });
    showLogin?.addEventListener('click', (e) => { e.preventDefault(); signupForm.style.display = 'none'; loginForm.style.display = 'block'; });

    doSignup?.addEventListener('click', async (e) => {
        e.preventDefault();
        const body = { firstName: signupFirst.value, lastName: signupLast.value, email: signupEmail.value, password: signupPassword.value };
        try {
            const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Signup failed');
            setLoggedIn(j.user, j.token);
        } catch (err) { alert('Signup error: ' + err.message); }
    });

    doLogin?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value }) });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || 'Login failed');
            setLoggedIn(j.user, j.token);
        } catch (err) { alert('Login error: ' + err.message); }
    });

    // show modal: if token exists restore session first
    loginBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        showModal();
        await restoreSession();
    });

    closeBtn?.addEventListener('click', hideModal);

    // Inline edit form helper
    function renderReservationItem(r) {
        const li = document.createElement('li');
        const date = new Date(r.reservationDate).toDateString();
        const left = document.createElement('div');
        left.style.flex = '1';
        left.innerHTML = `<div class="res-meta">${date} — Room ${r.room?.roomNumber || r.room}</div>`;

        const info = document.createElement('div');
        info.innerHTML = `<div>${r.startTime} to ${r.endTime} — ${r.purpose} — ${r.numberOfPeople} ppl</div>`;
        left.appendChild(info);

        const right = document.createElement('div');

        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit';
        const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel'; cancelBtn.style.marginLeft = '8px';

        editBtn.addEventListener('click', () => {
            // replace li content with inline form
            const form = document.createElement('div');
            form.innerHTML = `
                <label>Start</label><input value="${r.startTime}" class="small-input" />
                <label>End</label><input value="${r.endTime}" class="small-input" />
                <label>People</label><input value="${r.numberOfPeople}" type="number" class="small-input" />
                <label>Purpose</label><input value="${r.purpose}" class="small-input" />
            `;
            const save = document.createElement('button'); save.textContent = 'Save'; save.style.marginLeft = '8px';
            const cancelEdit = document.createElement('button'); cancelEdit.textContent = 'Cancel Edit'; cancelEdit.style.marginLeft = '8px';
            form.appendChild(save); form.appendChild(cancelEdit);
            // replace
            li.innerHTML = ''; li.appendChild(form);

            cancelEdit.addEventListener('click', async () => { await loadReservations(currentEmail); });
            save.addEventListener('click', async () => {
                const inputs = form.querySelectorAll('input');
                const [sIn, eIn, nIn, pIn] = inputs;
                const payload = { startTime: sIn.value, endTime: eIn.value, numberOfPeople: parseInt(nIn.value) || 1, purpose: pIn.value, email: currentEmail };
                try {
                    const putResp = await fetch(`/api/reservations/${r._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const putJson = await putResp.json(); if (!putResp.ok) throw new Error(putJson.message || 'Update failed');
                    await loadReservations(currentEmail);
                } catch (err) { alert('Update failed: ' + err.message); }
            });
        });

        cancelBtn.addEventListener('click', async () => {
            if (!confirm('Cancel this reservation?')) return;
            try {
                const delResp = await fetch(`/api/reservations/${r._id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentEmail }) });
                const delJson = await delResp.json(); if (!delResp.ok) throw new Error(delJson.message || 'Error cancelling');
                await loadReservations(currentEmail);
            } catch (delErr) { alert('Cancel failed: ' + delErr.message); }
        });

        right.appendChild(editBtn); right.appendChild(cancelBtn);
        li.appendChild(left); li.appendChild(right);
        return li;
    }

    // override loadReservations to use renderReservationItem
    async function loadReservations(email) {
        list.textContent = 'Loading...';
        try {
            const resp = await fetch(`/api/reservations?email=${encodeURIComponent(email)}`, { headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {} });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.message || 'Error fetching reservations');

            const items = json.data || [];
            if (items.length === 0) {
                list.innerHTML = '<p>No reservations found for this account.</p>';
                return;
            }

            const ul = document.createElement('ul');
            items.forEach(r => ul.appendChild(renderReservationItem(r)));
            list.innerHTML = '';
            list.appendChild(ul);
        } catch (err) { list.textContent = 'Error: ' + err.message; }
    }
});
