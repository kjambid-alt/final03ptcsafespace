const STORAGE_KEYS = {
  USERS: 'ptc_safespace_users_v1',
  SESSION: 'ptc_safespace_session_v1',
  REPORTS: 'ptc_safespace_reports_v1',
  CONSULTATIONS: 'ptc_safespace_consultations_v1',
  NOTIFICATIONS: 'ptc_safespace_notifications_v1'
};

function getStore(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    showToast('Storage quota warning: file attachment may be too large.', 'error');
  }
}

function getCurrentSession() {
  return getStore(STORAGE_KEYS.SESSION, null);
}

function setCurrentSession(sessionObj) {
  if (sessionObj) {
    setStore(STORAGE_KEYS.SESSION, sessionObj);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const isError = type === 'error';
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border text-sm font-medium fade-in ${
    isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-ptc-dark border-emerald-700 text-white'
  }`;
  toast.innerHTML = `
    <i class="fa-solid ${isError ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-emerald-300'} mt-0.5 text-base"></i>
    <div class="flex-1">${escapeHTML(message)}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function navigateTo(viewName) {
  ['view-landing', 'view-register', 'view-login', 'view-student-dashboard', 'view-services-dashboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.remove('hidden');
  updateTopNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleBrandClick() {
  const session = getCurrentSession();
  if (!session) navigateTo('landing');
  else if (session.accountType === 'student') navigateTo('student-dashboard');
  else navigateTo('services-dashboard');
}

function updateTopNav() {
  const nav = document.getElementById('nav-actions');
  const session = getCurrentSession();
  if (!session) {
    nav.innerHTML = `
      <button type="button" onclick="navigateTo('login')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-100 hover:text-white hover:bg-white/10 transition cursor-pointer">Log In</button>
      <button type="button" onclick="navigateTo('register')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-ptc-primary hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer">Register</button>
    `;
  } else {
    nav.innerHTML = `
      <div class="hidden sm:flex flex-col text-right mr-1">
        <span class="text-xs font-bold text-white leading-tight">${escapeHTML(session.name)}</span>
        <span class="text-[11px] text-emerald-200">${escapeHTML(session.id)}</span>
      </div>
      <button type="button" onclick="handleLogout()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-red-600 text-white transition flex items-center gap-1.5 cursor-pointer">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </button>
    `;
  }
}

function handleLogout() {
  setCurrentSession(null);
  showToast('You have been securely signed out.');
  navigateTo('landing');
}

let pendingRegDoc = null;

function switchRegisterRole(role) {
  const tabStu = document.getElementById('reg-tab-student');
  const tabSrv = document.getElementById('reg-tab-services');
  const formStu = document.getElementById('form-register-student');
  const formSrv = document.getElementById('form-register-services');
  document.getElementById('reg-stu-error').classList.add('hidden');
  document.getElementById('reg-srv-error').classList.add('hidden');

  if (role === 'student') {
    tabStu.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-ptc-primary text-white shadow-sm';
    tabSrv.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-slate-600 hover:text-ptc-dark';
    formStu.classList.remove('hidden');
    formSrv.classList.add('hidden');
  } else {
    tabSrv.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-ptc-dark text-white shadow-sm';
    tabStu.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-slate-600 hover:text-ptc-dark';
    formSrv.classList.remove('hidden');
    formStu.classList.add('hidden');
  }
}

function handleRegDocSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    pendingRegDoc = null;
    document.getElementById('reg-stu-doc-placeholder').classList.remove('hidden');
    document.getElementById('reg-stu-doc-selected').classList.add('hidden');
    return;
  }
  const sizeKB = Math.max(1, Math.round(file.size / 1024));
  pendingRegDoc = { fileName: file.name, fileType: file.type || 'Document', fileSize: `${sizeKB} KB` };
  document.getElementById('reg-stu-doc-name').textContent = file.name;
  document.getElementById('reg-stu-doc-size').textContent = `${sizeKB} KB • Ready for verification`;
  document.getElementById('reg-stu-doc-placeholder').classList.add('hidden');
  document.getElementById('reg-stu-doc-selected').classList.remove('hidden');
}

function handleStudentRegister(event) {
  event.preventDefault();
  const errBox = document.getElementById('reg-stu-error');
  const errText = document.getElementById('reg-stu-error-text');
  errBox.classList.add('hidden');

  const name = document.getElementById('reg-stu-name').value.trim();
  const studentId = document.getElementById('reg-stu-id').value.trim().toUpperCase();
  const email = document.getElementById('reg-stu-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-stu-password').value;

  if (!name || !studentId || !email || !password) {
    errText.textContent = 'Please complete all required student registration fields.';
    errBox.classList.remove('hidden');
    return;
  }
  if (!/^\d{2}[A-Z]{2,6}-\d{4}$/.test(studentId)) {
    errText.textContent = 'Invalid Student ID format. Please follow the format like 26BSIT-1234.';
    errBox.classList.remove('hidden');
    return;
  }
  if (password.length < 6) {
    errText.textContent = 'Password must be at least 6 characters long.';
    errBox.classList.remove('hidden');
    return;
  }
  if (!pendingRegDoc) {
    errText.textContent = 'Verification required: Please upload either your School ID or Certificate of Registration (COR).';
    errBox.classList.remove('hidden');
    return;
  }

  const users = getStore(STORAGE_KEYS.USERS, []);
  if (users.some(u => u.id === studentId)) {
    errText.textContent = `Student ID ${studentId} is already registered. Please proceed to Log In.`;
    errBox.classList.remove('hidden');
    return;
  }

  users.push({ accountType: 'student', name, id: studentId, email, password, verificationDoc: pendingRegDoc });
  setStore(STORAGE_KEYS.USERS, users);

  event.target.reset();
  pendingRegDoc = null;
  document.getElementById('reg-stu-doc-placeholder').classList.remove('hidden');
  document.getElementById('reg-stu-doc-selected').classList.add('hidden');

  showToast('Student account registered and saved permanently! Please log in.');
  switchLoginRole('student');
  navigateTo('login');
}

function handleServicesRegister(event) {
  event.preventDefault();
  const errBox = document.getElementById('reg-srv-error');
  const errText = document.getElementById('reg-srv-error-text');
  errBox.classList.add('hidden');

  const name = document.getElementById('reg-srv-name').value.trim();
  const role = document.getElementById('reg-srv-role').value;
  const personnelId = document.getElementById('reg-srv-id').value.trim().toUpperCase();
  const email = document.getElementById('reg-srv-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-srv-password').value;

  if (!name || !role || !personnelId || !email || !password) {
    errText.textContent = 'Please complete all required Student Services registration fields.';
    errBox.classList.remove('hidden');
    return;
  }
  if (!/^(GO|SC)-\d{3,5}$/.test(personnelId)) {
    errText.textContent = 'Invalid Personnel ID format. Use GO-XXXX or SC-XXXX.';
    errBox.classList.remove('hidden');
    return;
  }

  const users = getStore(STORAGE_KEYS.USERS, []);
  if (users.some(u => u.id === personnelId)) {
    errText.textContent = `Personnel ID ${personnelId} is already registered.`;
    errBox.classList.remove('hidden');
    return;
  }

  users.push({ accountType: 'services', name, role, id: personnelId, email, password });
  setStore(STORAGE_KEYS.USERS, users);

  event.target.reset();
  showToast('Student Services account created permanently! Please log in.');
  switchLoginRole('services');
  navigateTo('login');
}

function switchLoginRole(role) {
  const tabStu = document.getElementById('login-tab-student');
  const tabSrv = document.getElementById('login-tab-services');
  const formStu = document.getElementById('form-login-student');
  const formSrv = document.getElementById('form-login-services');
  document.getElementById('login-stu-error').classList.add('hidden');
  document.getElementById('login-srv-error').classList.add('hidden');

  if (role === 'student') {
    tabStu.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-ptc-primary text-white shadow-sm';
    tabSrv.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-slate-600 hover:text-ptc-dark';
    formStu.classList.remove('hidden');
    formSrv.classList.add('hidden');
  } else {
    tabSrv.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-ptc-dark text-white shadow-sm';
    tabStu.className = 'py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-slate-600 hover:text-ptc-dark';
    formSrv.classList.remove('hidden');
    formStu.classList.add('hidden');
  }
}

function handleStudentLogin(event) {
  event.preventDefault();
  const errBox = document.getElementById('login-stu-error');
  const errText = document.getElementById('login-stu-error-text');
  errBox.classList.add('hidden');

  const name = document.getElementById('login-stu-name').value.trim();
  const studentId = document.getElementById('login-stu-id').value.trim().toUpperCase();
  const password = document.getElementById('login-stu-password').value;

  const users = getStore(STORAGE_KEYS.USERS, []);
  const matched = users.find(
    u => u.accountType === 'student' && u.id === studentId && u.name.toLowerCase() === name.toLowerCase() && u.password === password
  );

  if (!matched) {
    errText.textContent = 'Account not found or credentials do not match. Please verify your details or register first.';
    errBox.classList.remove('hidden');
    return;
  }

  setCurrentSession(matched);
  event.target.reset();
  showToast(`Welcome back, ${matched.name}!`);
  loadStudentDashboard();
}

function handleServicesLogin(event) {
  event.preventDefault();
  const errBox = document.getElementById('login-srv-error');
  const errText = document.getElementById('login-srv-error-text');
  errBox.classList.add('hidden');

  const name = document.getElementById('login-srv-name').value.trim();
  const role = document.getElementById('login-srv-role').value;
  const personnelId = document.getElementById('login-srv-id').value.trim().toUpperCase();
  const password = document.getElementById('login-srv-password').value;

  const users = getStore(STORAGE_KEYS.USERS, []);
  const matched = users.find(
    u => u.accountType === 'services' && u.id === personnelId && u.role === role && u.name.toLowerCase() === name.toLowerCase() && u.password === password
  );

  if (!matched) {
    errText.textContent = 'Invalid Student Services credentials. Please verify your Name, Role, Personnel ID, and Password.';
    errBox.classList.remove('hidden');
    return;
  }

  setCurrentSession(matched);
  event.target.reset();
  showToast(`Signed in as ${matched.role}`);
  loadServicesDashboard();
}

let pendingIncidentEvidence = null;

function loadStudentDashboard() {
  const session = getCurrentSession();
  if (!session || session.accountType !== 'student') return navigateTo('login');

  document.getElementById('stu-dash-name').textContent = session.name;
  document.getElementById('stu-dash-id').textContent = session.id;
  document.getElementById('stu-dash-email').textContent = session.email;
  if (session.verificationDoc) {
    document.getElementById('stu-dash-doc-badge').textContent = `Verified: ${session.verificationDoc.fileName}`;
  }

  renderStudentReports();
  renderStudentConsultations();
  renderStudentNotifications();
  switchStudentTab('reports');
  navigateTo('student-dashboard');
}

function switchStudentTab(tabName) {
  ['reports', 'new-report', 'counseling', 'notifications'].forEach(t => {
    const panel = document.getElementById(`stu-panel-${t}`);
    const btn = document.getElementById(`stu-tab-btn-${t}`);
    if (t === tabName) {
      panel.classList.remove('hidden');
      btn.className = 'flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-ptc-dark text-white shadow-xs';
    } else {
      panel.classList.add('hidden');
      btn.className = 'flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-slate-600 hover:bg-ptc-bg';
    }
  });
}

function handleEvidenceSelect(event) {
  const file = event.target.files[0];
  const label = document.getElementById('inc-evidence-label');
  if (!file) {
    pendingIncidentEvidence = null;
    label.innerHTML = `<i class="fa-solid fa-paperclip text-ptc-primary mr-1.5"></i> Click to attach screenshot, photo, or document`;
    return;
  }
  pendingIncidentEvidence = { fileName: file.name, fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB` };
  label.innerHTML = `<i class="fa-solid fa-file-circle-check text-ptc-primary mr-1.5"></i> <strong>${escapeHTML(file.name)}</strong> (${pendingIncidentEvidence.fileSize})`;
}

function handleIncidentSubmit(event) {
  event.preventDefault();
  const session = getCurrentSession();
  const reports = getStore(STORAGE_KEYS.REPORTS, []);
  const reportCode = `INC-${new Date().getFullYear()}-${String(reports.length + 101).padStart(4, '0')}`;
  const isAnonymous = document.getElementById('inc-anonymous').checked;

  reports.unshift({
    reportId: reportCode,
    isAnonymous: isAnonymous,
    studentId: session.id,
    studentName: session.name,
    studentDocName: session.verificationDoc ? session.verificationDoc.fileName : 'Verified Document',
    category: document.getElementById('inc-category').value,
    dateTime: document.getElementById('inc-datetime').value,
    location: document.getElementById('inc-location').value.trim(),
    description: document.getElementById('inc-description').value.trim(),
    evidence: pendingIncidentEvidence,
    status: 'Pending Review',
    counselorNotes: '',
    handledBy: '',
    studentUpdates: []
  });

  setStore(STORAGE_KEYS.REPORTS, reports);
  addNotification(
    session.id,
    `Report ${reportCode} Submitted`,
    isAnonymous
      ? 'Your anonymous incident report has been received for Student Services review.'
      : 'Your incident report has been received for Student Services review.'
  );
  event.target.reset();
  pendingIncidentEvidence = null;
  document.getElementById('inc-evidence-label').innerHTML = `<i class="fa-solid fa-paperclip text-ptc-primary mr-1.5"></i> Click to attach screenshot, photo, or document`;

  showToast(`Incident Report ${reportCode} submitted${isAnonymous ? ' anonymously' : ''} successfully!`);
  renderStudentReports();
  renderStudentNotifications();
  switchStudentTab('reports');
}

function getStatusBadgeHTML(status) {
  const styles = {
    'Pending Review': 'bg-amber-100 text-amber-800 border-amber-200',
    'Under Investigation': 'bg-blue-100 text-blue-800 border-blue-200',
    'Referred to Guidance': 'bg-purple-100 text-purple-800 border-purple-200',
    'More Info Requested': 'bg-orange-100 text-orange-800 border-orange-200',
    'Resolved': 'bg-ptc-light text-ptc-dark border-emerald-300'
  };
  return `<span class="px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100'}">${escapeHTML(status)}</span>`;
}

function renderStudentReports() {
  const session = getCurrentSession();
  const myReports = getStore(STORAGE_KEYS.REPORTS, []).filter(r => r.studentId === session.id);

  document.getElementById('stu-stat-total').textContent = myReports.length;
  document.getElementById('stu-stat-pending').textContent = myReports.filter(r => r.status === 'Pending Review').length;
  document.getElementById('stu-stat-progress').textContent = myReports.filter(r =>
    ['Under Investigation', 'Referred to Guidance', 'More Info Requested'].includes(r.status)
  ).length;
  document.getElementById('stu-stat-resolved').textContent = myReports.filter(r => r.status === 'Resolved').length;

  const container = document.getElementById('stu-reports-list');
  if (myReports.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-8 text-center">No incident reports submitted yet.</p>`;
    return;
  }

  container.innerHTML = myReports
    .map(
      r => `
    <div class="p-5 rounded-2xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 mr-2">${escapeHTML(r.reportId)}</span>
          <strong>${escapeHTML(r.category)}</strong>
          ${r.isAnonymous ? `<span class="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-white"><i class="fa-solid fa-user-secret mr-1"></i>Anonymous</span>` : ''}
        </div>
        ${getStatusBadgeHTML(r.status)}
      </div>
      <p class="text-sm text-slate-600 mb-3">${escapeHTML(r.description)}</p>
      <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>${escapeHTML(r.location)} &bull; ${escapeHTML(r.dateTime.replace('T', ' '))}</span>
        <button type="button" onclick="openStudentReportModal('${escapeHTML(r.reportId)}')" class="px-3 py-1.5 rounded-xl bg-ptc-light text-ptc-dark font-bold">View / Add Info</button>
      </div>
      ${r.counselorNotes ? `<div class="mt-3 p-3 rounded-xl bg-ptc-bg border border-emerald-200 text-xs"><strong>Student Services Note:</strong> ${escapeHTML(r.counselorNotes)}</div>` : ''}
    </div>`
    )
    .join('');
}

function openStudentReportModal(reportId) {
  const r = getStore(STORAGE_KEYS.REPORTS, []).find(item => item.reportId === reportId);
  if (!r) return;
  document.getElementById('stu-update-report-id').value = r.reportId;
  document.getElementById('modal-stu-report-details').innerHTML = `
    <div class="flex justify-between items-center">
      <div>
        <strong>${escapeHTML(r.reportId)} - ${escapeHTML(r.category)}</strong>
        ${r.isAnonymous ? `<span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-white"><i class="fa-solid fa-user-secret mr-1"></i>Anonymous</span>` : ''}
      </div>
      ${getStatusBadgeHTML(r.status)}
    </div>
    <p class="p-3 rounded-xl bg-slate-50 border border-slate-200">${escapeHTML(r.description)}</p>
  `;
  document.getElementById('modal-student-update').classList.remove('hidden');
}

function handleStudentAppendInfo(event) {
  event.preventDefault();
  const reportId = document.getElementById('stu-update-report-id').value;
  const extraText = document.getElementById('stu-additional-info').value.trim();
  const reports = getStore(STORAGE_KEYS.REPORTS, []);
  const idx = reports.findIndex(r => r.reportId === reportId);
  if (idx !== -1) {
    reports[idx].studentUpdates.push({ text: extraText, timestamp: new Date().toISOString() });
    setStore(STORAGE_KEYS.REPORTS, reports);
  }
  document.getElementById('stu-additional-info').value = '';
  closeModal('modal-student-update');
  showToast('Additional information saved.');
  renderStudentReports();
}

function handleConsultationSubmit(event) {
  event.preventDefault();
  const session = getCurrentSession();
  const consultations = getStore(STORAGE_KEYS.CONSULTATIONS, []);
  consultations.unshift({
    id: `CONS-${Date.now().toString().slice(-5)}`,
    studentId: session.id,
    studentName: session.name,
    topic: document.getElementById('cons-topic').value,
    date: document.getElementById('cons-date').value,
    mode: document.getElementById('cons-mode').value,
    notes: document.getElementById('cons-notes').value.trim(),
    status: 'Requested',
    counselorReply: ''
  });
  setStore(STORAGE_KEYS.CONSULTATIONS, consultations);
  event.target.reset();
  showToast('Counseling consultation request submitted!');
  renderStudentConsultations();
}

function renderStudentConsultations() {
  const session = getCurrentSession();
  const list = getStore(STORAGE_KEYS.CONSULTATIONS, []).filter(c => c.studentId === session.id);
  document.getElementById('stu-consultations-list').innerHTML = list.length
    ? list.map(c => `<div class="p-3 rounded-xl bg-ptc-bg border border-emerald-100 text-xs"><strong>${escapeHTML(c.topic)}</strong> (${escapeHTML(c.date)}) - <strong>${escapeHTML(c.status)}</strong></div>`).join('')
    : '<p class="text-xs text-slate-400">No requests yet.</p>';
}

function addNotification(studentId, title, message) {
  const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS, []);
  notifs.unshift({ studentId, title, message, read: false, timestamp: new Date().toISOString() });
  setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

function renderStudentNotifications() {
  const session = getCurrentSession();
  const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS, []).filter(n => n.studentId === session.id);
  const unread = notifs.filter(n => !n.read).length;
  const badge = document.getElementById('stu-notif-badge');
  if (unread > 0) {
    badge.textContent = unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
  document.getElementById('stu-notifications-list').innerHTML = notifs.length
    ? notifs.map(n => `<div class="p-3.5 rounded-xl border ${n.read ? 'bg-white' : 'bg-ptc-bg border-ptc-primary/40'} text-xs"><strong>${escapeHTML(n.title)}</strong><p class="mt-1 text-slate-600">${escapeHTML(n.message)}</p></div>`).join('')
    : '<p class="text-xs text-slate-400 text-center py-4">No notifications.</p>';
}

function markAllStudentNotificationsRead() {
  const session = getCurrentSession();
  const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS, []);
  notifs.forEach(n => { if (n.studentId === session.id) n.read = true; });
  setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);
  renderStudentNotifications();
}

function loadServicesDashboard() {
  const session = getCurrentSession();
  if (!session || session.accountType !== 'services') return navigateTo('login');
  document.getElementById('srv-dash-name').textContent = session.name;
  document.getElementById('srv-dash-role-badge').textContent = session.role;
  document.getElementById('srv-dash-id').textContent = session.id;
  document.getElementById('srv-dash-email').textContent = session.email;
  renderServicesDashboard();
  navigateTo('services-dashboard');
}

function renderServicesDashboard() {
  const allReports = getStore(STORAGE_KEYS.REPORTS, []);
  const filterStatus = document.getElementById('srv-filter-status').value;

  document.getElementById('srv-stat-total').textContent = allReports.length;
  document.getElementById('srv-stat-pending').textContent = allReports.filter(r => r.status === 'Pending Review').length;
  document.getElementById('srv-stat-active').textContent = allReports.filter(r =>
    ['Under Investigation', 'Referred to Guidance', 'More Info Requested'].includes(r.status)
  ).length;
  document.getElementById('srv-stat-resolved').textContent = allReports.filter(r => r.status === 'Resolved').length;

  const filtered = filterStatus === 'ALL' ? allReports : allReports.filter(r => r.status === filterStatus);
  document.getElementById('srv-reports-list').innerHTML = filtered.length
    ? filtered
        .map(
          r => `
        <div class="p-5 rounded-2xl border border-slate-200 bg-white">
          <div class="flex flex-wrap justify-between gap-2 mb-2">
            <div><span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 mr-2">${escapeHTML(r.reportId)}</span><strong>${escapeHTML(r.category)}</strong></div>
            ${getStatusBadgeHTML(r.status)}
          </div>
          <div class="text-xs text-slate-600 mb-2">
            ${
              r.isAnonymous
                ? `<span class="inline-flex items-center gap-1.5 font-semibold text-slate-700"><i class="fa-solid fa-user-secret text-ptc-dark"></i> Anonymous Student (Identity Protected)</span>`
                : `Student: <strong>${escapeHTML(r.studentName)} (${escapeHTML(r.studentId)})</strong> &bull; Doc: ${escapeHTML(r.studentDocName || 'Verified')}`
            }
          </div>
          <p class="text-sm text-slate-700 mb-3">${escapeHTML(r.description)}</p>
          <div class="flex justify-end">
            <button type="button" onclick="openServicesReviewModal('${escapeHTML(r.reportId)}')" class="px-4 py-2 rounded-xl bg-ptc-dark text-white text-xs font-bold">Review & Take Action</button>
          </div>
        </div>`
        )
        .join('')
    : '<p class="text-xs text-slate-500 text-center py-8">No incident reports found.</p>';

  const consultations = getStore(STORAGE_KEYS.CONSULTATIONS, []);
  document.getElementById('srv-consultations-list').innerHTML = consultations.length
    ? consultations
        .map(
          c => `
        <div class="p-3.5 rounded-2xl border border-slate-200 bg-ptc-bg/40 text-xs space-y-2">
          <div class="flex justify-between font-bold"><span>${escapeHTML(c.studentName)}</span><span>${escapeHTML(c.status)}</span></div>
          <div>${escapeHTML(c.topic)} (${escapeHTML(c.date)})</div>
          ${c.status === 'Requested' ? `<button type="button" onclick="confirmConsultation('${escapeHTML(c.id)}')" class="w-full py-1.5 rounded-lg bg-ptc-primary text-white font-bold">Confirm Session</button>` : ''}
        </div>`
        )
        .join('')
    : '<p class="text-xs text-slate-400 text-center py-4">No requests.</p>';
}

function openServicesReviewModal(reportId) {
  const r = getStore(STORAGE_KEYS.REPORTS, []).find(item => item.reportId === reportId);
  if (!r) return;
  document.getElementById('srv-review-report-id').value = r.reportId;
  document.getElementById('srv-review-status').value = r.status;
  document.getElementById('srv-review-notes').value = r.counselorNotes || '';

  const reporterLabel = r.isAnonymous
    ? `<i class="fa-solid fa-user-secret mr-1"></i> Anonymous Student (Identity Protected)`
    : `${escapeHTML(r.studentName)} (${escapeHTML(r.studentId)})`;

  document.getElementById('modal-srv-report-details').innerHTML = `
    <div class="p-3 rounded-xl bg-ptc-bg border border-emerald-100 text-xs">
      <strong>${escapeHTML(r.reportId)}</strong> &bull; ${reporterLabel}
    </div>
    <p class="p-3 rounded-xl bg-slate-50 border border-slate-200">${escapeHTML(r.description)}</p>
  `;
  document.getElementById('modal-services-review').classList.remove('hidden');
}

function handleServicesCaseSave(event) {
  event.preventDefault();
  const session = getCurrentSession();
  const reportId = document.getElementById('srv-review-report-id').value;
  const newStatus = document.getElementById('srv-review-status').value;
  const notes = document.getElementById('srv-review-notes').value.trim();

  const reports = getStore(STORAGE_KEYS.REPORTS, []);
  const idx = reports.findIndex(r => r.reportId === reportId);
  if (idx !== -1) {
    reports[idx].status = newStatus;
    reports[idx].counselorNotes = notes;
    reports[idx].handledBy = `${session.name} (${session.role})`;
    setStore(STORAGE_KEYS.REPORTS, reports);
    addNotification(reports[idx].studentId, `Case ${reportId} Updated: ${newStatus}`, notes || `Status changed to ${newStatus}.`);
  }

  closeModal('modal-services-review');
  showToast(`Report ${reportId} updated and student notified.`);
  renderServicesDashboard();
}

function confirmConsultation(consId) {
  const session = getCurrentSession();
  const consultations = getStore(STORAGE_KEYS.CONSULTATIONS, []);
  const idx = consultations.findIndex(c => c.id === consId);
  if (idx !== -1) {
    consultations[idx].status = 'Confirmed';
    consultations[idx].counselorReply = `Confirmed by ${session.name} (${session.role}).`;
    setStore(STORAGE_KEYS.CONSULTATIONS, consultations);
    addNotification(consultations[idx].studentId, 'Consultation Confirmed', consultations[idx].counselorReply);
  }
  showToast('Consultation confirmed.');
  renderServicesDashboard();
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

window.onload = function () {
  const session = getCurrentSession();
  if (session) {
    session.accountType === 'student' ? loadStudentDashboard() : loadServicesDashboard();
  } else {
    navigateTo('landing');
  }
};
