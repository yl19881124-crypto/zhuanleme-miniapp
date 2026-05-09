const { formatMoney } = require('../../utils/wage');
const { formatDuration } = require('../../utils/day-metrics');
const { getTodayMetrics, getPrivacy, clearTodayRecords } = require('../../utils/day-store');
const { buildPosterContent } = require('../../utils/poster-content');

Page({
  data: {
    gross: '0.00',
    expense: '0.00',
    net: '0.00',
    fishIndex: 0,
    mental: 0,
    mainStatusText: '稳定续命',
    conclusion: '今天先活下来，明天再战。',
    battleRewardText: '带薪摸鱼',
    result: '勉强通关',
    finalResultText: '副本未开始',
    fishGradeLabel: 'C级',
    fishScoreText: '0/100',
    expenseDisplay: '¥0.00',
    workerLevelLabel: '',
    behaviorStats: []
  },
  onShow() { this.stopRefresh(); this.refresh(); this.timer = setInterval(() => this.refresh(), 1000); },
  onHide() { this.stopRefresh(); },
  onUnload() { this.stopRefresh(); },
  stopRefresh() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  buildFishGrade(index) {
    if (index <= 20) return 'C级';
    if (index <= 40) return 'B级';
    if (index <= 60) return 'A级';
    if (index <= 80) return 'S级';
    return 'S+级';
  },
  buildBehaviorStats(metrics) {
    const total = Math.max(
      metrics.scheduleWorkedSeconds + metrics.fishingSeconds + metrics.meetingSeconds + metrics.overtimeSeconds,
      1
    );
    return [
      { key: 'fishing', label: '摸鱼时长', seconds: metrics.fishingSeconds, tone: 'good' },
      { key: 'meeting', label: '开会时长', seconds: metrics.meetingSeconds, tone: 'warn' },
      { key: 'overtime', label: '加班时长', seconds: metrics.overtimeSeconds, tone: 'hot' },
      { key: 'work', label: '正常工作时长', seconds: metrics.scheduleWorkedSeconds, tone: 'good' }
    ].map((item) => ({
      ...item,
      duration: formatDuration(item.seconds * 1000),
      percent: Math.min(100, Math.round((item.seconds / total) * 100))
    }));
  },
  resolveFinalResult(metrics, posterContent) {
    const worked = metrics.scheduleWorkedSeconds + metrics.overtimeSeconds + metrics.meetingSeconds + metrics.fishingSeconds;
    if (worked <= 0 || metrics.grossIncome <= 0) return '副本未开始';
    return posterContent.dungeonResultText || metrics.dungeonResultText || metrics.dungeonResult || '勉强通关';
  },
  refresh() {
    const hidden = !!getPrivacy().hideTodayIncome;
    const metrics = getTodayMetrics(Date.now());
    const posterContent = buildPosterContent(metrics);
    const finalResultText = this.resolveFinalResult(metrics, posterContent);
    const expenseDisplay = Number(metrics.totalExpense) > 0
      ? `-¥${formatMoney(metrics.totalExpense, hidden)}`
      : `¥${formatMoney(metrics.totalExpense, hidden)}`;
    this.setData({
      gross: formatMoney(metrics.grossIncome, hidden),
      expense: formatMoney(metrics.totalExpense, hidden),
      net: formatMoney(metrics.netIncome, hidden),
      fishIndex: metrics.fishingIndex,
      mental: metrics.mentalLoss,
      mainStatusText: posterContent.mainStatusText,
      conclusion: posterContent.conclusion,
      result: posterContent.dungeonResultText || metrics.dungeonResultText || metrics.dungeonResult || '勉强通关',
      finalResultText,
      battleRewardText: posterContent.battleRewardText,
      fishGradeLabel: this.buildFishGrade(metrics.fishingIndex),
      fishScoreText: `${metrics.fishingIndex}/100`,
      expenseDisplay,
      behaviorStats: this.buildBehaviorStats(metrics)
    });
  },
  generatePoster() { wx.navigateTo({ url: '/pages/poster/index' }); },
  restartDay() { clearTodayRecords(Date.now()); wx.showToast({ title: '已重置，明天再战', icon: 'success' }); this.refresh(); }
});
