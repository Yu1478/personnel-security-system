let authToken = localStorage.getItem('authToken') || '';
let mfaTempToken = localStorage.getItem('mfaTempToken') || '';

function setToken(token) {
  authToken = token || '';
  localStorage.setItem('authToken', authToken);
  if (authToken) {
    clearMfaTempToken();
  }
}

function clearToken() {
  authToken = '';
  localStorage.removeItem('authToken');
}

function setMfaTempToken(token) {
  mfaTempToken = token || '';
  localStorage.setItem('mfaTempToken', mfaTempToken);
}

function clearMfaTempToken() {
  mfaTempToken = '';
  localStorage.removeItem('mfaTempToken');
}

function logout() {
  clearToken();
  clearMfaTempToken();
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: 'Invalid server response' };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function renderJson(el, value) {
  if (el) {
    el.textContent = JSON.stringify(value, null, 2);
  }
}

function renderTable(el, rows) {
  if (!el) return;

  if (!rows || !rows.length) {
    el.innerHTML = '<div class="empty-state">No data</div>';
    return;
  }

  const columnLabels = {
    id: 'ID',
    username: 'Username',
    nickname: 'Nickname',
    status: 'Status',
    left_at: 'Left At',
    created_at: 'Created At',
    updated_at: 'Updated At',
    roles: 'Roles',
    trace_id: 'Trace ID',
    operator_id: 'Operator ID',
    operator_name_snapshot: 'Operator Name',
    operator_username_snapshot: 'Operator Username',
    module: 'Module',
    action: 'Action',
    target_type: 'Target Type',
    target_id: 'Target ID',
    result: 'Result',
    ip_address: 'IP Address',
    location: 'Location'
  };

  const columns = Object.keys(rows[0]);
  const head = columns.map((col) => `<th>${columnLabels[col] || col}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((col) => `<td>${row[col] ?? ''}</td>`).join('')}</tr>`).join('');
  el.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderProfileSummary(el, data) {
  if (!el) return;

  if (!data) {
    el.innerHTML = 'Login to view current account info';
    return;
  }

  const roleCodes = (data.roles || []).map((item) => item.role_code).join(', ') || 'None';
  el.innerHTML = `
    <div class="profile-row"><span>Username</span><span>${data.username || '-'}</span></div>
    <div class="profile-row"><span>Nickname</span><span>${data.nickname || '-'}</span></div>
    <div class="profile-row"><span>Status</span><span>${data.status || '-'}</span></div>
    <div class="profile-row"><span>Roles</span><span>${roleCodes}</span></div>
    <div class="profile-row"><span>Last Login IP</span><span>${data.last_login_ip || '-'}</span></div>
  `;
}

async function loadCurrentUser() {
  if (!authToken) return null;

  try {
    const result = await request('/api/auth/me');
    return result.data;
  } catch {
    return null;
  }
}

async function syncSidebarUser() {
  const sidebarUser = document.getElementById('sidebarUser');
  const sidebarRole = document.getElementById('sidebarRole');
  const current = await loadCurrentUser();

  if (!current) {
    if (sidebarUser) sidebarUser.textContent = 'Logged out';
    if (sidebarRole) sidebarRole.textContent = 'Please login first';
    return;
  }

  const roleText = (current.roles || []).map((item) => item.role_code).join(', ') || 'No roles';
  if (sidebarUser) sidebarUser.textContent = current.username;
  if (sidebarRole) sidebarRole.textContent = roleText;
}

function markActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach((item) => {
    if (item.dataset.nav === page) {
      item.classList.add('active');
    }
  });
}

markActiveNav();
syncSidebarUser();

window.appCommon = {
  getToken: () => authToken,
  getMfaTempToken: () => mfaTempToken,
  setToken,
  clearToken,
  setMfaTempToken,
  clearMfaTempToken,
  logout,
  request,
  renderJson,
  renderTable,
  renderProfileSummary,
  loadCurrentUser,
  syncSidebarUser
};
