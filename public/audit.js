(() => {
  const {
    request: apiRequest,
    renderJson: showJson,
    renderTable: showTable,
    syncSidebarUser: syncSidebar
  } = window.appCommon;

  const logsResult = document.getElementById('logsResult');

  async function loadLogs() {
    const result = await apiRequest('/api/audit/logs');
    showTable(logsResult, result.data);
  }

  document.getElementById('loadLogsBtn').addEventListener('click', async () => {
    try {
      await loadLogs();
    } catch (error) {
      showJson(logsResult, { error: error.message });
    }
  });

  syncSidebar();
  loadLogs().catch(() => null);
})();
