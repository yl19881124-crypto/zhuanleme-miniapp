const { KEYS, get, set } = require('../../utils/storage');
const { formatMoney } = require('../../utils/wage');

Page({
  data: { gross:'0.00', expense:'0.00', net:'0.00', work:'0小时', fish:'0分钟', meeting:'0分钟', overtime:'0分钟', fishIndex:0, mental:0, persona:'稳定续命型员工', roast:'钱是赚到了一点，人也被消耗了一点。' },
  onShow() {
    const privacy = get(KEYS.PRIVACY, {});
    const profile = get(KEYS.PROFILE, { hourSalary: 0, workHoursPerDay: 8 });
    const statuses = get(KEYS.STATUS_LOGS, []);
    const expenses = get(KEYS.EXPENSE_LOGS, []);
    const grossRaw = profile.hourSalary * profile.workHoursPerDay;
    const expenseRaw = expenses.reduce((s, i) => s + Number(i.amount || 0), 0);
    const counts = (name) => statuses.filter((i) => i.status === name).length;
    const fishMin = counts('摸鱼中') * 15; const meetingMin = counts('开会中') * 20; const overtimeMin = counts('加班中') * 30;
    const fishIndex = Math.min(100, fishMin);
    const mental = Math.min(100, Math.round((counts('崩溃中') * 25 + overtimeMin * 0.4)));
    const persona = fishMin > 120 ? '摸鱼套利型牛马' : meetingMin > 120 ? '会议变现型选手' : expenseRaw > grossRaw * 0.5 ? '钱包漏风型打工人' : overtimeMin > 120 ? '加班献祭型战士' : '稳定续命型员工';
    const roast = '钱是赚到了一点，人也被消耗了一点。';
    this.setData({
      gross: formatMoney(grossRaw, privacy.hideTodayIncome),
      expense: formatMoney(expenseRaw, privacy.hideNetIncome),
      net: formatMoney(grossRaw - expenseRaw, privacy.hideNetIncome),
      work: `${profile.workHoursPerDay}小时`, fish: `${fishMin}分钟`, meeting: `${meetingMin}分钟`, overtime: `${overtimeMin}分钟`,
      fishIndex, mental, persona, roast
    });
  },
  generatePoster() { wx.showToast({ title: '海报生成功能开发中（默认脱敏）', icon: 'none' }); },
  restartDay() { set(KEYS.STATUS_LOGS, []); set(KEYS.EXPENSE_LOGS, []); wx.showToast({ title: '已重置，明天再战', icon: 'success' }); }
});
