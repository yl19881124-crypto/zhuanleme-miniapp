const { ALL_STATUS, formatDuration } = require('../../utils/day-metrics');
const { getTodayMetrics, getTodayState } = require('../../utils/day-store');

const STATUS_META = {
  '搬砖中': { name: '搬砖中', color: '#7c7c7c' },
  '摸鱼中': { name: '摸鱼中', color: '#ffd900' },
  '开会中': { name: '开会中', color: '#e9bfc3' },
  '装忙中': { name: '装忙中', color: '#8f8a6e' },
  '崩溃中': { name: '崩溃中', color: '#7f7f90' },
  '干饭中': { name: '干饭中', color: '#a8915e' },
  '加班中': { name: '加班中', color: '#c4161c' }
};

function getFishIndexDesc(fishIndex) {
  if (fishIndex <= 10) return '今日很老实。';
  if (fishIndex <= 30) return '轻微摸鱼。';
  if (fishIndex <= 60) return '稳定划水。';
  if (fishIndex <= 80) return '专业摸鱼。';
  return '大师级逃避。';
}

Page({
  data: { tab: 'status', statusSummary: [], fishIndex: 0, fishDesc: '今日很老实。', mental: 0, expenses: [], summaryText: '今天公司买到了你的时间，但没完全买到效率。' },
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
        color: meta.color,
        isZero: raw === 0
      };
    });
    const dayState = getTodayState(Date.now());
    const expenses = (dayState.expenses || []).map((i) => ({ ...i, grind: `${i.grindMinutes || 0} 分钟` }));
    this.setData({
      statusSummary: list,
      fishIndex: metrics.fishingIndex,
      fishDesc: getFishIndexDesc(metrics.fishingIndex),
      mental: metrics.mentalLoss,
      expenses,
      summaryText: metrics.conclusion || metrics.summaryText || '今天公司买到了你的时间，但没完全买到效率。'
    });
  }
});
