const { formatMoney } = require('../../utils/wage');
const { formatDuration } = require('../../utils/day-metrics');
const { getTodayMetrics, getPrivacy, clearTodayRecords } = require('../../utils/day-store');

Page({
  data: { gross: '0.00', expense: '0.00', net: '0.00', work: '0小时0分', fish: '0小时0分', meeting: '0小时0分', overtime: '0小时0分', fishIndex: 0, mental: 0, persona: '稳定续命中', roast: '钱是赚到了一点，人也被消耗了一点。', result: '勉强通关' },
  onShow() { this.stopRefresh(); this.refresh(); this.timer = setInterval(() => this.refresh(), 1000); },
  onHide() { this.stopRefresh(); },
  onUnload() { this.stopRefresh(); },
  stopRefresh() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  refresh() {
    const hidden = !!getPrivacy().hideTodayIncome;
    const metrics = getTodayMetrics(Date.now());
    this.setData({
      gross: formatMoney(metrics.grossIncome, hidden),
      expense: formatMoney(metrics.totalExpense, hidden),
      net: formatMoney(metrics.netIncome, hidden),
      work: formatDuration(metrics.scheduleWorkedSeconds * 1000),
      fish: formatDuration(metrics.fishingSeconds * 1000),
      meeting: formatDuration(metrics.meetingSeconds * 1000),
      overtime: formatDuration(metrics.overtimeSeconds * 1000),
      fishIndex: metrics.fishingIndex,
      mental: metrics.mentalLoss,
      persona: metrics.personality,
      roast: metrics.conclusion,
      result: metrics.dungeonResult || '勉强通关'
    });
  },
  generatePoster() { wx.navigateTo({ url: '/pages/poster/index' }); },
  restartDay() { clearTodayRecords(Date.now()); wx.showToast({ title: '已重置，明天再战', icon: 'success' }); this.refresh(); }
});
