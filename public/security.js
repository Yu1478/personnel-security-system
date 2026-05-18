(() => {
  const {
    setToken: saveToken,
    getMfaTempToken,
    request: apiRequest,
    renderJson: showJson,
    renderProfileSummary: showProfile,
    loadCurrentUser: fetchCurrentUser,
    syncSidebarUser: syncSidebar
  } = window.appCommon;

  const meResult = document.getElementById('meResult');
  const mfaSetupResult = document.getElementById('mfaSetupResult');
  const mfaVerifyResult = document.getElementById('mfaVerifyResult');
  const profileSummary = document.getElementById('profileSummary');
  const mfaTempTokenInput = document.getElementById('mfaTempToken');

  async function loadMe() {
    const current = await fetchCurrentUser();
    if (!current) throw new Error('Please login on the overview page first');
    showProfile(profileSummary, current);
    showJson(meResult, { code: 0, message: 'OK', data: current });
  }

  document.getElementById('loadMeBtn').addEventListener('click', async () => {
    try {
      await loadMe();
    } catch (error) {
      showJson(meResult, { error: error.message });
    }
  });

  document.getElementById('setupMfaBtn').addEventListener('click', async () => {
    try {
      const result = await apiRequest('/api/auth/mfa/setup', { method: 'POST' });
      showJson(mfaSetupResult, result);
    } catch (error) {
      showJson(mfaSetupResult, { error: error.message });
    }
  });

  document.getElementById('mfaVerifyForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const tempToken = document.getElementById('mfaTempToken').value.trim();
      const token = document.getElementById('mfaCode').value.trim();
      const result = await apiRequest('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ tempToken, token })
      });
      if (result.data?.token) {
        saveToken(result.data.token);
        await syncSidebar();
        await loadMe();
      }
      showJson(mfaVerifyResult, result);
    } catch (error) {
      showJson(mfaVerifyResult, { error: error.message });
    }
  });

  if (mfaTempTokenInput) {
    mfaTempTokenInput.value = getMfaTempToken();
  }

  syncSidebar();
  loadMe().catch(() => null);
})();
