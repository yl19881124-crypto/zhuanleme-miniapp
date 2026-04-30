const { KEYS, get, set } = require('../../utils/storage');
const { calcSecondIncome, formatMoney } = require('../../utils/wage');

const STATUS_LIST = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中', '收工'];
const CATEGORIES = ['咖啡', '外卖', '通勤', '奶茶', '购物', '其他'];

function roast(status) {
  const map = {
    '正常上班': '你的人已经到岗，灵魂还在加载。',
    '摸鱼中': '恭喜你，正在进行工资套利。',
    '开会中': '本场会议产出未知，工资到账真实。',
    '假装忙': '看起来很忙，实际上系统待机。',
    '崩溃中': '钱在慢慢涨，人也在慢慢碎。',
    '午休中': '身体暂停，工资继续回血。',
    '加班中': '现在赚的是钱，亏的是命。',
    '收工': '今日副本准备结算。'
  };
  return map[status] || '工位一坐，灵魂出窍。';
}

Page({
  data: {
    statusList: STATUS_LIST, categories: CATEGORIES, currentStatus: '正常上班', roastText: roast('正常上班'),
    progress: 0, todayIncome: '0.00', perSecond: '0.00', workedDuration: '00:00', offWorkCountdown: '--:--',
    todayExpense: '0.00', netIncome: '0.00', fishDuration: '0分钟', meetingDuration: '0分钟', recentExpenses: [],
    showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' }, hide: {}
  },
  onShow() { this.refresh(); },
  refresh() {
    const profile = get(KEYS.PROFILE, { hourSalary: 0, workHoursPerDay: 8 });
    const privacy = get(KEYS.PRIVACY, { hideSalary: false, hideTodayIncome: false, hideNetIncome: false, maskOnShare: true });
    const logs = get(KEYS.STATUS_LOGS, []);
    const expenses = get(KEYS.EXPENSE_LOGS, []);
    const currentStatus = logs[0]?.status || '正常上班';
    const workedHours = Math.min(profile.workHoursPerDay, 2.5 + logs.length * 0.1);
    const gross = workedHours * profile.hourSalary;
    const expenseTotal = expenses.reduce((s, i) => s + Number(i.amount || 0), 0);
    const progress = Math.round((workedHours / (profile.workHoursPerDay || 8)) * 100);
    this.setData({
      hide: privacy,
      currentStatus,
      roastText: roast(currentStatus),
      progress,
      perSecond: formatMoney(calcSecondIncome(profile.hourSalary || 0), privacy.hideSalary),
      todayIncome: formatMoney(gross, privacy.hideTodayIncome),
      workedDuration: `${Math.floor(workedHours)}小时${Math.round((workedHours % 1) * 60)}分`,
      offWorkCountdown: `${Math.max(0, profile.workHoursPerDay - workedHours).toFixed(1)}小时`,
      todayExpense: formatMoney(expenseTotal, privacy.hideNetIncome),
      netIncome: formatMoney(gross - expenseTotal, privacy.hideNetIncome),
      fishDuration: `${logs.filter((i) => i.status === '摸鱼中').length * 15}分钟`,
      meetingDuration: `${logs.filter((i) => i.status === '开会中').length * 20}分钟`,
      recentExpenses: expenses.slice(0, 3)
    });
  },
  togglePrivacy() {
    const privacy = { ...this.data.hide, hideTodayIncome: !this.data.hide.hideTodayIncome };
    this.setData({ hide: privacy });
    set(KEYS.PRIVACY, privacy);
    this.refresh();
  },
  chooseStatus(e) {
    const status = e.currentTarget.dataset.status;
    const logs = get(KEYS.STATUS_LOGS, []);
    logs.unshift({ status, time: Date.now() });
    set(KEYS.STATUS_LOGS, logs.slice(0, 200));
    this.setData({ currentStatus: status, roastText: roast(status) });
    if (status === '收工') wx.switchTab({ url: '/pages/settlement/index' });
    this.refresh();
  },
  openExpensePopup() { this.setData({ showExpensePopup: true }); },
  closeExpensePopup() { this.setData({ showExpensePopup: false }); },
  onAmount(e) { this.setData({ 'form.amount': e.detail.value }); },
  onNote(e) { this.setData({ 'form.note': e.detail.value }); },
  onCategory(e) { this.setData({ 'form.category': CATEGORIES[e.detail.value] }); },
  addExpense() {
    const profile = get(KEYS.PROFILE, { hourSalary: 0 });
    const amount = Number(this.data.form.amount || 0);
    if (!amount) return wx.showToast({ title: '请输入金额', icon: 'none' });
    const grindMinutes = profile.hourSalary ? Math.round((amount / profile.hourSalary) * 60) : 0;
    const logs = get(KEYS.EXPENSE_LOGS, []);
    logs.unshift({ ...this.data.form, amount, grindMinutes, time: Date.now() });
    set(KEYS.EXPENSE_LOGS, logs.slice(0, 200));
    wx.showToast({ title: `约白干${grindMinutes}分钟`, icon: 'none' });
    this.setData({ showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' } });
    this.refresh();
  },
  goSettlement() { wx.switchTab({ url: '/pages/settlement/index' }); }
});
