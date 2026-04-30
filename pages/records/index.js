const { ALL_STATUS, formatDuration } = require('../../utils/day-metrics');
const { getTodayMetrics, getTodayState } = require('../../utils/day-store');

Page({
  data: { tab: 'status', statusSummary: [], fishIndex: 0, mental: 0, expenses: [] },
  onShow() { this.stopRefresh(); this.refresh(); this.timer = setInterval(() => this.refresh(), 1000); },
  onHide() { this.stopRefresh(); },
  onUnload() { this.stopRefresh(); },
  stopRefresh() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); this.refresh(); },
  refresh() {
    const metrics = getTodayMetrics(Date.now());
    const total = Math.max(1, metrics.workedSeconds * 1000);
    const list = ALL_STATUS.map((k) => {
      const raw = metrics.statusDurations[k] || 0;
      return { name: k, duration: formatDuration(raw), raw, ratio: `${Math.round((raw / total) * 100)}%` };
    });
    const dayState = getTodayState(Date.now());
    const expenses = (dayState.expenses || []).map((i) => ({ ...i, grind: `${i.grindMinutes || 0} 分钟` }));
    this.setData({ statusSummary: list, fishIndex: metrics.fishingIndex, mental: metrics.mentalLoss, expenses });
  }
});
