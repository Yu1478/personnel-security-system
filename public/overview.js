(() => {
  const {
    setToken: saveToken,
    setMfaTempToken: saveMfaTempToken,
    logout: performLogout,
    request: apiRequest,
    renderJson: showJson,
    renderProfileSummary: showProfile,
    loadCurrentUser: fetchCurrentUser,
    syncSidebarUser: syncSidebar
  } = window.appCommon;

  const loginResult = document.getElementById('loginResult');
  const registerResult = document.getElementById('registerResult');
  const meResult = document.getElementById('meResult');
  const profileSummary = document.getElementById('profileSummary');
  const sessionStatus = document.getElementById('sessionStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  function renderSessionState(type, message) {
    if (!sessionStatus) return;
    sessionStatus.className = `status-banner ${type}`;
    sessionStatus.textContent = message;
  }

  async function refreshCurrentUser() {
    const current = await fetchCurrentUser();

    if (!current) {
      showProfile(profileSummary, null);
      showJson(meResult, { message: 'Not logged in' });
      renderSessionState('idle', 'Not logged in. Use admin1 / 123456.');
      if (logoutBtn) logoutBtn.disabled = true;
      return;
    }

    showProfile(profileSummary, current);
    showJson(meResult, { code: 0, message: 'OK', data: current });
    renderSessionState('success', `Logged in as ${current.username}`);
    if (logoutBtn) logoutBtn.disabled = false;
  }

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (result.data?.token) {
        saveToken(result.data.token);
        renderSessionState('success', `Login success: ${username}`);
      } else if (result.data?.mfaRequired && result.data?.tempToken) {
        saveMfaTempToken(result.data.tempToken);
        renderSessionState('warning', 'MFA required. Open the Security page to finish verification.');
      }

      showJson(loginResult, result);
      await syncSidebar();
      await refreshCurrentUser();
    } catch (error) {
      renderSessionState('error', `Login failed: ${error.message}`);
      showJson(loginResult, { error: error.message });
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const username = document.getElementById('registerUsername').value.trim();
      const password = document.getElementById('registerPassword').value;
      const nickname = document.getElementById('registerNickname').value.trim();
      const result = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, nickname })
      });
      showJson(registerResult, result);
    } catch (error) {
      showJson(registerResult, { error: error.message });
    }
  });

  document.getElementById('loadMeBtn').addEventListener('click', async () => {
    try {
      await refreshCurrentUser();
    } catch (error) {
      showJson(meResult, { error: error.message });
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      performLogout();
      await syncSidebar();
      await refreshCurrentUser();
      showJson(loginResult, { message: 'Logged out' });
    });
  }

  refreshCurrentUser();
})();
