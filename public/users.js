(() => {
  const {
    request: apiRequest,
    renderJson: showJson,
    renderTable: showTable,
    renderProfileSummary: showProfile,
    loadCurrentUser: fetchCurrentUser,
    syncSidebarUser: syncSidebar
  } = window.appCommon;

  const meResult = document.getElementById('meResult');
  const usersResult = document.getElementById('usersResult');
  const usersDebug = document.getElementById('usersDebug');
  const roleResult = document.getElementById('roleResult');
  const leaveResult = document.getElementById('leaveResult');
  const profileSummary = document.getElementById('profileSummary');

  async function loadMe() {
    const current = await fetchCurrentUser();
    if (!current) throw new Error('Please login on the overview page first');
    showProfile(profileSummary, current);
    showJson(meResult, { code: 0, message: 'OK', data: current });
  }

  async function loadUsers() {
    const result = await apiRequest('/api/users');
    showJson(usersDebug, result);
    showTable(usersResult, result.data);
  }

  document.getElementById('loadMeBtn').addEventListener('click', async () => {
    try {
      await loadMe();
    } catch (error) {
      showJson(meResult, { error: error.message });
    }
  });

  document.getElementById('loadUsersBtn').addEventListener('click', async () => {
    try {
      await loadUsers();
    } catch (error) {
      showJson(usersDebug, { error: error.message, hint: 'loadUsers failed' });
      showJson(usersResult, { error: error.message });
    }
  });

  document.getElementById('roleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const userId = document.getElementById('roleUserId').value;
      const roleCode = document.getElementById('roleCode').value;
      const action = document.getElementById('roleAction').value;
      const result = await apiRequest(`/api/users/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleCode, action })
      });
      showJson(roleResult, result);
      await loadUsers();
    } catch (error) {
      showJson(roleResult, { error: error.message });
    }
  });

  document.getElementById('leaveForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const userId = document.getElementById('leaveUserId').value;
      const result = await apiRequest(`/api/users/${userId}/leave`, { method: 'POST' });
      showJson(leaveResult, result);
      await loadUsers();
    } catch (error) {
      showJson(leaveResult, { error: error.message });
    }
  });

  syncSidebar();
  loadMe().catch(() => null);
  loadUsers().catch(() => null);
})();
