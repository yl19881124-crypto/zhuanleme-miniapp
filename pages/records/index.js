const { getRealtimeCoreData, ALL_STATUS, formatDuration } = require('../../utils/day-metrics');

Page({
  data: { tab: 'status', statusSummary: [], fishIndex: 0, mental: 0, expenses: [] },
  onShow() {
    this.stopRefresh();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 1000);
  },
  onHide() { this.stopRefresh(); },
  onUnload() { this.stopRefresh(); },
  stopRefresh() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); },
  refresh() {
    const core = getRealtimeCoreData(Date.now());
    const total = Object.values(core.workedMsByStatus).reduce((s, v) => s + v, 0) || 1;
    const list = ALL_STATUS.map((k) => {
      const raw = core.workedMsByStatus[k] || 0;
      return { name: k, duration: formatDuration(raw), raw, ratio: `${Math.round((raw / total) * 100)}%` };
    });
    const fish = Math.round(((core.workedMsByStatus['摸鱼中'] || 0) / total) * 100);
    const mental = Math.min(100, Math.round((((core.workedMsByStatus['崩溃中'] || 0) + (core.workedMsByStatus['加班中'] || 0)) / total) * 120));
    const expenses = core.expenses.map((i) => ({ ...i, grind: `${i.grindMinutes || 0} 分钟` }));
    this.setData({ statusSummary: list, fishIndex: fish, mental, expenses });
  }
});
