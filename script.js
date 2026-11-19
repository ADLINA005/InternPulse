let statusChartInstance = null;
let monthlyChartInstance = null;

if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.font.weight = '600';
}

const defaultChecklist = [
    { id: 1, text: 'Update Resume', completed: false },
    { id: 2, text: 'Prepare Cover Letter', completed: false },
    { id: 3, text: 'Apply University Internship Letter', completed: false },
    { id: 4, text: 'Update LinkedIn Profile', completed: false },
    { id: 5, text: 'Prepare for onboarding document', completed: false }
];

const defaultProfile = {
    program: 'Sarjana Muda Pengurusan Maklumat (Sistem)',
    institution: 'Universiti Teknologi MARA (UiTM)',
    email: '',
    color: '#0d6efd',
    goal: 10,
    skills: ['HTML', 'CSS', 'JavaScript']
};

const avatarColors = ['#0d6efd', '#4C1050', '#1F3B4D', '#198754', '#dc3545', '#fd7e14'];

function getApps() {
    return JSON.parse(localStorage.getItem('intern_apps')) || [];
}
function saveApps(apps) {
    localStorage.setItem('intern_apps', JSON.stringify(apps));
}
function getChecklist() {
    const saved = localStorage.getItem('intern_checklist');
    if (!saved) {
        localStorage.setItem('intern_checklist', JSON.stringify(defaultChecklist));
        return [...defaultChecklist];
    }
    return JSON.parse(saved);
}
function saveChecklist(items) {
    localStorage.setItem('intern_checklist', JSON.stringify(items));
}
function getProfile() {
    const saved = JSON.parse(localStorage.getItem('intern_profile')) || {};
    return { ...defaultProfile, ...saved };
}
function saveProfile(p) {
    localStorage.setItem('intern_profile', JSON.stringify(p));
}

document.addEventListener('DOMContentLoaded', () => {
//authcheck
    if (!localStorage.getItem('isLoggedIn') && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
        return;
    }

    initSidebar();

    const currentUser = localStorage.getItem('currentUser') || 'ADLINA';
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) userDisplay.textContent = `Hello, ${currentUser}`;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    renderApp();
    renderChecklist();
    loadProfileForm();
    initTimer();

    const form = document.getElementById('app-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const apps = getApps();
            apps.push({
                id: Date.now(),
                company: document.getElementById('company').value.trim(),
                role: document.getElementById('role').value.trim(),
                date: document.getElementById('date').value,
                status: document.getElementById('status').value
            });
            saveApps(apps);
            form.reset();
            renderApp();
        });
    }

//tambahtask//
    const checklistForm = document.getElementById('checklist-form');
    if (checklistForm) {
        checklistForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('checklist');
            const text = input.value.trim();
            if (!text) return;
            const items = getChecklist();
            items.push({ id: Date.now(), text, completed: false });
            saveChecklist(items);
            checklistForm.reset();
            renderChecklist();
        });
    }
//tambahskill//
    const skillForm = document.getElementById('skill-form');
    if (skillForm) {
        skillForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('skill-input');
            const skill = input.value.trim();
            if (!skill) return;
            const p = getProfile();
            if (!p.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                p.skills.push(skill);
                saveProfile(p);
            }
            input.value = '';
            renderSkills();
        });
    }

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`section-${hash}`)) {
        showSection(hash);
    }
});

//togglesidebar//
function setSidebar(open) {
    document.body.classList.toggle('sidebar-open', open);
    const btn = document.getElementById('sidebar-toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    // remember the choice on desktop only
    if (window.innerWidth > 768) {
        try { localStorage.setItem('sidebar_open', open ? '1' : '0'); } catch (e) {}
    }
}

function toggleSidebar() {
    setSidebar(!document.body.classList.contains('sidebar-open'));
}

function initSidebar() {

    const wasOpen = localStorage.getItem('sidebar_open') === '1';
    setSidebar(window.innerWidth > 768 && wasOpen);

    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    if (closeBtn) closeBtn.addEventListener('click', () => setSidebar(false));
    if (backdrop) backdrop.addEventListener('click', () => setSidebar(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setSidebar(false);
    });
}

function showSection(sectionId) {
    const target = document.getElementById(`section-${sectionId}`);
    if (!target) return;

    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    document.querySelectorAll('#sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));

    target.classList.remove('d-none');
    const activeLink = document.getElementById(`nav-${sectionId}`);
    if (activeLink) activeLink.classList.add('active');

    try { history.replaceState(null, '', `#${sectionId}`); } catch (e) {}
    window.scrollTo(0, 0);

    if (window.innerWidth <= 768) setSidebar(false);

    if (sectionId === 'analytics') renderApp();
    if (sectionId === 'profile') loadProfileForm();
}

//studytimer//

const TIMER_GOAL = 30 * 60; // 
const TIMER_KEY = 'intern_timer';
let timerInterval = null;

function getTimer() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(TIMER_KEY)); } catch (e) {}
    return { elapsed: 0, startedAt: null, done: false, hatched: 0, ...(saved || {}) };
}
function saveTimer(t) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(t));
}

function timerTotal(t) {
    const live = t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0;
    return Math.min(TIMER_GOAL, t.elapsed + live);
}

function initTimer() {
    if (!document.getElementById('timer-display')) return;

    document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);

    renderTimer();
    timerInterval = setInterval(tickTimer, 500);
}

function tickTimer() {
    const t = getTimer();
    if (t.startedAt && timerTotal(t) >= TIMER_GOAL) {
        t.elapsed = TIMER_GOAL;
        t.startedAt = null;
        t.done = true;
        t.hatched += 1;
        saveTimer(t);
    }
    renderTimer();
}

function toggleTimer() {
    let t = getTimer();
    if (t.done) {

        t = { ...t,elapsed: 0, startedAt: Date.now(), done: false };
    } else if (t.startedAt) {
        t.elapsed = timerTotal(t);
        t.startedAt = null;
    } else {
        t.startedAt = Date.now();
    }
    saveTimer(t);
    renderTimer();
}

function resetTimer() {
    const t = getTimer();
    saveTimer({ elapsed: 0, startedAt: null, done: false, hatched: t.hatched });
    renderTimer();
}

function renderTimer() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    const t = getTimer();
    const total = timerTotal(t);
    const remaining = Math.max(0, Math.ceil(TIMER_GOAL - total));
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    display.textContent = `${mm}:${ss}`;

    const stage = t.done ? 4 : total >= 25 * 60 ? 3 : total >= 20 * 60 ? 2 : total >= 10 * 60 ? 1 : 0;
    const wrap = document.getElementById('egg-wrap');
    if (wrap) {
        wrap.dataset.stage = stage;
        wrap.classList.toggle('running', !!t.startedAt);
    }

    const pct = Math.round((total / TIMER_GOAL) * 100);
    const bar = document.getElementById('timer-progress-bar');
    if (bar) bar.style.width = `${pct}%`;

    const messages = [
        'Study for 30 minutes to hatch your chick!',
        'There is tiny crack... keep going!',
        'The egg is wobbling. Stay focused!',
        'Almost there! Your chick is pecking its way out!',
        'Your chick hatched! congratulations, lets hatched another!'
    ];
    setText('timer-message', messages[stage]);
    setText('timer-hatched', t.hatched);

    const btn = document.getElementById('timer-toggle');
    if (btn) {
        let label = 'Start', icon = 'bi-play-fill';
        if (t.done) { label = 'Study Again'; icon = 'bi-egg-fill'; }
        else if (t.startedAt) { label = 'Pause'; icon = 'bi-pause-fill'; }
        else if (t.elapsed > 0) { label = 'Resume'; }
        btn.innerHTML = `<i class="bi ${icon} me-1"></i><span>${label}</span>`;
    }
}

//checklist//
function renderChecklist() {
    const ul = document.getElementById('checklist-items');
    if (!ul) return;

    const items = getChecklist();
    ul.innerHTML = '';

    if (items.length === 0) {
        ul.innerHTML = '<li class="list-group-item text-muted small">No tasks yet. Add one below.</li>';
    }

    items.forEach(item => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <label class="d-flex align-items-center mb-0" style="cursor: pointer;">
                    <input class="form-check-input me-2" type="checkbox"
                        ${item.completed ? 'checked' : ''}
                        onchange="toggleChecklist(${item.id})">
                    <span class="${item.completed ? 'text-decoration-line-through text-muted' : ''}">
                        ${escapeHTML(item.text)}
                    </span>
                </label>
                <button type="button" onclick="deleteChecklist(${item.id})" class="btn btn-sm text-danger border-0 p-0" title="Delete task" aria-label="Delete task">
                    <i class="bi bi-trash"></i>
                </button>
            </li>`;
    });

    const done = items.filter(i => i.completed).length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    const bar = document.getElementById('checklist-progress-bar');
    const label = document.getElementById('checklist-progress-label');
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${done} of ${items.length} done (${pct}%)`;
}

function toggleChecklist(id) {
    saveChecklist(getChecklist().map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    renderChecklist();
}

function deleteChecklist(id) {
    saveChecklist(getChecklist().filter(i => i.id !== id));
    renderChecklist();
}

//Aplikasi&dashboard//
function renderApp() {
    const apps = getApps();
    const count = s => apps.filter(a => a.status === s).length;
    const applied = count('Applied');
    const interview = count('Interview');
    const offered = count('Offered');
    const rejected = count('Rejected');

    setText('stat-total', apps.length);
    setText('stat-interview', interview);
    setText('stat-offered', offered);
    setText('stat-rejected', rejected);

    const tbody = document.getElementById('table-body');
    if (tbody) {
        tbody.innerHTML = apps.length === 0
            ? `<tr><td colspan="5" class="text-center text-muted py-3">No applications added yet. Open 'Manage Applications' to create one!</td></tr>`
            : apps.map(app => `
                <tr>
                    <td class="fw-bold">${escapeHTML(app.company)}</td>
                    <td>${escapeHTML(app.role)}</td>
                    <td>${escapeHTML(app.date)}</td>
                    <td><span class="badge badge-${escapeHTML(app.status)}">${escapeHTML(app.status)}</span></td>
                    <td><button onclick="deleteApp(${app.id})" class="btn btn-outline-danger btn-sm" aria-label="Delete application"><i class="bi bi-trash"></i></button></td>
                </tr>`).join('');
    }

    const fullBody = document.getElementById('full-table-body');
    if (fullBody) {
        fullBody.innerHTML = apps.length === 0
            ? `<tr><td colspan="5" class="text-center text-muted py-3">No applications yet.</td></tr>`
            : apps.map(app => `
                <tr>
                    <td class="fw-bold">${escapeHTML(app.company)}</td>
                    <td>${escapeHTML(app.role)}</td>
                    <td>${escapeHTML(app.date)}</td>
                    <td>
                        <select class="form-select form-select-sm" onchange="updateStatus(${app.id}, this.value)">
                            ${['Applied', 'Interview', 'Offered', 'Rejected']
                                .map(s => `<option value="${s}" ${s === app.status ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </td>
                    <td><button onclick="deleteApp(${app.id})" class="btn btn-outline-danger btn-sm" aria-label="Delete application"><i class="bi bi-trash"></i></button></td>
                </tr>`).join('');
    }

    renderChart(applied, interview, offered, rejected);
    renderAnalytics(apps);
    renderGoalProgress(apps.length);
}

function updateStatus(id, status) {
    saveApps(getApps().map(a => a.id === id ? { ...a, status } : a));
    renderApp();
}

function deleteApp(id) {
    saveApps(getApps().filter(a => a.id !== id));
    renderApp();
}

//analitikstatus//
function renderChart(applied, interview, offered, rejected) {
    const ctx = document.getElementById('statusChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (statusChartInstance) statusChartInstance.destroy();

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Applied', 'Interview', 'Offered', 'Rejected'],
            datasets: [{
                data: [applied, interview, offered, rejected],
                backgroundColor: ['#ffeb14', '#ff9f17', '#329eb1', '#e91919']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderAnalytics(apps) {
    const total = apps.length;
    const count = s => apps.filter(a => a.status === s).length;
    const pct = n => total ? Math.round((n / total) * 100) : 0;

    setText('kpi-interview-rate', `${pct(count('Interview') + count('Offered'))}%`);
    setText('kpi-offer-rate', `${pct(count('Offered'))}%`);
    setText('kpi-rejection-rate', `${pct(count('Rejected'))}%`);
    setText('kpi-pending', count('Applied'));

    const insight = document.getElementById('analytics-insight');
    if (insight) {
        let msg = 'Add your first application to see insights.';
        if (total > 0) {
            if (count('Offered') > 0) msg = `Great news! You have ${count('Offered')} offers. Think carefully before you decide!`;
            else if (count('Interview') > 0) msg = `You have ${count('Interview')} interviews in progress. Make sure you dress well, yea!`;
            else if (count('Rejected') === total) msg = "All applications were rejected. It's fine, you can apply for another one!";
            else msg = `${count('Applied')} applications are waiting for a reply. Make sure to always check your email!`;
        }
        insight.textContent = msg;
    }

    const monthly = {};
    apps.forEach(a => {
        if (!a.date) return;
        const key = a.date.slice(0, 7); // YYYY-MM
        monthly[key] = (monthly[key] || 0) + 1;
    });
    const keys = Object.keys(monthly).sort().slice(-6);

    const ctx = document.getElementById('monthlyChart');
    if (ctx && typeof Chart !== 'undefined') {
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: keys,
                datasets: [{ label: 'Applications', data: keys.map(k => monthly[k]), backgroundColor: '#4C1050' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

//profilesaya//
function loadProfileForm() {
    if (!document.getElementById('section-profile')) return;
    const p = getProfile();
    const name = localStorage.getItem('currentUser') || 'ADLINA';

    setValue('profile-username-input', name);
    setValue('profile-program-input', p.program);
    setValue('profile-institution-input', p.institution);
    setValue('profile-email-input', p.email);
    setValue('profile-goal-input', p.goal);
    setText('profile-name', name);

    renderAvatar(name, p.color);
    renderColorPicker(p.color);
    renderSkills();
    renderGoalProgress(getApps().length);
}

function renderAvatar(name, color) {
    const avatar = document.getElementById('profile-avatar');
    if (!avatar) return;
    avatar.textContent = (name || 'A').charAt(0).toUpperCase();
    avatar.style.backgroundColor = color;
}

function renderColorPicker(selected) {
    const box = document.getElementById('color-picker');
    if (!box) return;
    box.innerHTML = avatarColors.map(c =>
        `<button type="button" class="color-swatch ${c === selected ? 'selected' : ''}"
            style="background-color:${c}" aria-label="Choose colour ${c}"
            onclick="chooseColor('${c}')"></button>`).join('');
}

function chooseColor(color) {
    const p = getProfile();
    p.color = color;
    saveProfile(p);
    renderAvatar(localStorage.getItem('currentUser') || 'ADLINA', color);
    renderColorPicker(color);
}

function renderSkills() {
    const box = document.getElementById('skills-list');
    if (!box) return;
    const skills = getProfile().skills;
    box.innerHTML = skills.length === 0
        ? '<span class="text-muted small">No skills added yet.</span>'
        : skills.map((s, i) =>
            `<span class="skill-tag">${escapeHTML(s)}
                <button type="button" onclick="removeSkill(${i})" title="Remove" aria-label="Remove skill"><i class="bi bi-x-lg"></i></button>
            </span>`).join('');
}

function removeSkill(index) {
    const p = getProfile();
    p.skills.splice(index, 1);
    saveProfile(p);
    renderSkills();
}

function renderGoalProgress(totalApps) {
    const bar = document.getElementById('goal-progress-bar');
    if (!bar) return;
    const goal = Math.max(1, parseInt(getProfile().goal, 10) || 1);
    const pct = Math.min(100, Math.round((totalApps / goal) * 100));
    bar.style.width = `${pct}%`;
    bar.textContent = `${pct}%`;
    setText('goal-progress-label', `${totalApps} of ${goal} applications sent`);
}

function updateProfile() {
    const name = document.getElementById('profile-username-input').value.trim();
    if (!name) {
        alert('Name cannot be empty.');
        return;
    }
    const p = getProfile();
    p.program = document.getElementById('profile-program-input').value.trim();
    p.institution = document.getElementById('profile-institution-input').value.trim();
    p.email = document.getElementById('profile-email-input').value.trim();
    p.goal = Math.max(1, parseInt(document.getElementById('profile-goal-input').value, 10) || 1);
    saveProfile(p);

    localStorage.setItem('currentUser', name);
    setText('user-display', `Hello, ${name}`);
    setText('profile-name', name);
    renderAvatar(name, p.color);
    renderGoalProgress(getApps().length);
    alert('Profile updated successfully!');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}
function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}