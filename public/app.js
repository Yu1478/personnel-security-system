let authToken = localStorage.getItem('authToken') || '';

const loginResult = document.getElementById('loginResult');
const registerResult = document.getElementById('registerResult');
const meResult = document.getElementById('meResult');
const roleResult = document.getElementById('roleResult');
const leaveResult = document.getElementById('leaveResult');
const mfaSetupResult = document.getElementById('mfaSetupResult');
const mfaVerifyResult = document.getElementById('mfaVerifyResult');
const usersResult = document.getElementById('usersResult');
const logsResult = document.getElementById('logsResult');
const profileSummary = document.getElementById('profileSummary');
const userCount = document.getElementById('userCount');
const logCount = document.getElementById('logCount');
const selfStatus = document.getElementById('selfStatus');

function setToken(token) {
  authToken = token || '';
  localStorage.setItem('authToken', authToken);
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function renderJson(el, value) {
  el.textContent = JSON.stringify(value, null, 2);
}

function renderTable(el, rows) {
  if (!rows || !rows.length) {
    el.innerHTML = '<div class="empty-state">No data</div>';
    return;
  }

  const columns = Object.keys(rows[0]);
  const head = columns.map((col) => `<th>${col}</th>`).join('');
  const body = rows.map((row) => {
    return `<tr>${columns.map((col) => `<td>${row[col] ?? ''}</td>`).join('')}</tr>`;
  }).join('');
  el.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderProfileSummary(data) {
  if (!data) {
    profileSummary.innerHTML = '&#30331;&#24405;&#21518;&#26174;&#31034;&#24403;&#21069;&#36134;&#21495;&#20449;&#24687;';
    selfStatus.textContent = 'Offline';
    return;
  }

  const roleCodes = (data.roles || []).map((item) => item.role_code).join(', ') || 'None';
  profileSummary.innerHTML = `
    <div class="profile-row"><span>Username</span><span>${data.username || '-'}</span></div>
    <div class="profile-row"><span>Nickname</span><span>${data.nickname || '-'}</span></div>
    <div class="profile-row"><span>Status</span><span>${data.status || '-'}</span></div>
    <div class="profile-row"><span>Roles</span><span>${roleCodes}</span></div>
    <div class="profile-row"><span>Last Login IP</span><span>${data.last_login_ip || '-'}</span></div>
  `;
  selfStatus.textContent = data.status || 'Unknown';
}

async function loadMe() {
  const result = await request('/api/auth/me');
  renderJson(meResult, result);
  renderProfileSummary(result.data);
  return result;
}

async function loadUsers() {
  const result = await request('/api/users');
  renderTable(usersResult, result.data);
  userCount.textContent = result.data.length;
  return result;
}

async function loadLogs() {
  const result = await request('/api/audit/logs');
  renderTable(logsResult, result.data);
  logCount.textContent = result.data.length;
  return result;
}

document.getElementById('heroLoadBtn').addEventListener('click', async () => {
  try {
    await Promise.all([loadMe(), loadUsers(), loadLogs()]);
  } catch (error) {
    renderJson(loginResult, { error: error.message });
  }
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (result.data?.token) {
      setToken(result.data.token);
    }

    renderJson(loginResult, result);
    if (result.data?.token) {
      await Promise.all([loadMe(), loadUsers(), loadLogs()]);
    }
  } catch (error) {
    renderJson(loginResult, { error: error.message });
  }
});

document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const nickname = document.getElementById('registerNickname').value.trim();
    const result = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname })
    });
    renderJson(registerResult, result);
    await loadUsers().catch(() => null);
  } catch (error) {
    renderJson(registerResult, { error: error.message });
  }
});

document.getElementById('loadMeBtn').addEventListener('click', async () => {
  try {
    await loadMe();
  } catch (error) {
    renderJson(meResult, { error: error.message });
  }
});

document.getElementById('loadUsersBtn').addEventListener('click', async () => {
  try {
    await loadUsers();
  } catch (error) {
    renderJson(usersResult, { error: error.message });
  }
});

document.getElementById('roleForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const userId = document.getElementById('roleUserId').value;
    const roleCode = document.getElementById('roleCode').value;
    const action = document.getElementById('roleAction').value;
    const result = await request(`/api/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleCode, action })
    });
    renderJson(roleResult, result);
    await Promise.all([loadUsers(), loadLogs()]);
  } catch (error) {
    renderJson(roleResult, { error: error.message });
  }
});

document.getElementById('leaveForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const userId = document.getElementById('leaveUserId').value;
    const result = await request(`/api/users/${userId}/leave`, { method: 'POST' });
    renderJson(leaveResult, result);
    await Promise.all([loadUsers(), loadLogs()]);
  } catch (error) {
    renderJson(leaveResult, { error: error.message });
  }
});

document.getElementById('setupMfaBtn').addEventListener('click', async () => {
  try {
    const result = await request('/api/auth/mfa/setup', { method: 'POST' });
    renderJson(mfaSetupResult, result);
  } catch (error) {
    renderJson(mfaSetupResult, { error: error.message });
  }
});

document.getElementById('mfaVerifyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const tempToken = document.getElementById('mfaTempToken').value.trim();
    const token = document.getElementById('mfaCode').value.trim();
    const result = await request('/api/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken, token })
    });
    if (result.data?.token) {
      setToken(result.data.token);
    }
    renderJson(mfaVerifyResult, result);
  } catch (error) {
    renderJson(mfaVerifyResult, { error: error.message });
  }
});

document.getElementById('loadLogsBtn').addEventListener('click', async () => {
  try {
    await loadLogs();
  } catch (error) {
    renderJson(logsResult, { error: error.message });
  }
});
