const { ALL_STATUS, formatDuration } = require('../../utils/day-metrics');
const { getTodayMetrics, getTodayState } = require('../../utils/day-store');

const STATUS_META = {
  '搬砖中': { name: '常规工作', color: '#7c7c7c' },
  '摸鱼中': { name: '专业摸鱼', color: '#ffd900' },
  '开会中': { name: '无意义会议', color: '#e9bfc3' },
  '装忙中': { name: '装忙中', color: '#8f8a6e' },
  '干饭中': { name: '干饭中', color: '#a8915e' },
  '加班中': { name: '加班中', color: '#c4161c' }
};

Page({
  data: { tab: 'status', statusSummary: [], fishIndex: 0, mental: 0, expenses: [], summaryText: '今天公司买到了你的时间，但没完全买到效率。' },
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
      const meta = STATUS_META[k] || { name: k, color: '#888' };
      return {
        key: k,
        name: meta.name,
        duration: formatDuration(raw),
        raw,
        ratio: Math.round((raw / total) * 100),
        color: meta.color
      };
    });
    const dayState = getTodayState(Date.now());
    const expenses = (dayState.expenses || []).map((i) => ({ ...i, grind: `${i.grindMinutes || 0} 分钟` }));
    this.setData({
      statusSummary: list,
      fishIndex: metrics.fishingIndex,
      mental: metrics.mentalLoss,
      expenses,
      summaryText: metrics.conclusion || metrics.summaryText || '今天公司买到了你的时间，但没完全买到效率。'
    });
  }
});
