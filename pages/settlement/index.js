const { KEYS, get, set } = require('../../utils/storage');
const { formatMoney } = require('../../utils/wage');
const { getRealtimeCoreData, formatDuration } = require('../../utils/day-metrics');

Page({
  data: {
    gross:'0.00', expense:'0.00', net:'0.00', work:'0小时0分', fish:'0小时0分', meeting:'0小时0分', overtime:'0小时0分',
    fishIndex:0, mental:0, persona:'稳定续命型员工', roast:'钱是赚到了一点，人也被消耗了一点。', result: '勉强通关'
  },
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
  refresh() {
    const privacy = get(KEYS.PRIVACY, {});
    const hidden = !!privacy.hideTodayIncome;
    const core = getRealtimeCoreData(Date.now());
    const total = core.totalWorkedMsByStatus || 1;
    const fishIndex = Math.round((core.fishMs / total) * 100);
    const mental = Math.min(100, Math.round((((core.workedMsByStatus['崩溃中'] || 0) + core.overtimeMs) / total) * 130));
    const persona = core.todayExpense > core.todayGross * 0.5 ? '钱包漏风型打工人' : core.overtimeMs > 2 * 3600000 ? '加班献祭型战士' : core.fishMs > 2 * 3600000 ? '摸鱼套利型牛马' : '稳定续命型员工';
    const roast = core.todayNet < 0 ? '今天属于倒贴上班，建议明天控制钱包冲动。' : '钱是赚到了一点，人也被消耗了一点。';
    const result = core.todayNet < 0 ? '倒贴打工' : core.progress >= 100 ? '已通关' : '勉强通关';

    this.setData({
      gross: formatMoney(core.todayGross, hidden),
      expense: formatMoney(core.todayExpense, hidden),
      net: formatMoney(core.todayNet, hidden),
      work: formatDuration(core.totalWorkedMsByStatus),
      fish: formatDuration(core.fishMs),
      meeting: formatDuration(core.meetingMs),
      overtime: formatDuration(core.overtimeMs),
      fishIndex, mental, persona, roast, result
    });
  },
  generatePoster() { wx.showToast({ title: '海报生成功能开发中（默认脱敏）', icon: 'none' }); },
  restartDay() { set(KEYS.STATUS_LOGS, []); set(KEYS.EXPENSE_LOGS, []); wx.showToast({ title: '已重置，明天再战', icon: 'success' }); }
});
