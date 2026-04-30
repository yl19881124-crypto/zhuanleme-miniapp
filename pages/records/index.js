const { KEYS, get, set } = require('../../utils/storage');

function fmtDuration(ms = 0) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}小时${mm}分`;
}

Page({
  data: { tab: 'status', statusSummary: [], fishIndex: 0, mental: 0, expenses: [] },
  onShow() { this.refresh(); },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); },
  refresh() {
    const statusLogs = get(KEYS.STATUS_LOGS, []);
    const now = Date.now();
    const summary = {};
    for (let i = 0; i < statusLogs.length; i += 1) {
      const cur = statusLogs[i];
      const next = statusLogs[i - 1];
      const end = next ? next.time : now;
      summary[cur.status] = (summary[cur.status] || 0) + Math.max(0, end - cur.time);
    }
    const list = Object.keys(summary).map((k) => ({ name: k, duration: fmtDuration(summary[k]), raw: summary[k] }));
    const total = list.reduce((s, i) => s + i.raw, 0) || 1;
    const fish = Math.round(((summary['摸鱼中'] || 0) / total) * 100);
    const mental = Math.min(100, Math.round(((summary['崩溃中'] || 0) + (summary['加班中'] || 0)) / total * 120));
    const expenses = get(KEYS.EXPENSE_LOGS, []).map((i) => ({ ...i, grind: `${i.grindMinutes || 0} 分钟` }));
    this.setData({ statusSummary: list, fishIndex: fish, mental, expenses });
  },
  openExpensePopup() {
    const pages = getCurrentPages();
    const home = pages.find((p) => p.route === 'pages/home/index');
    if (home && home.openExpensePopup) {
      wx.switchTab({ url: '/pages/home/index' });
      setTimeout(() => home.openExpensePopup(), 120);
    } else {
      wx.showToast({ title: '请在首页记账', icon: 'none' });
    }
  }
});
