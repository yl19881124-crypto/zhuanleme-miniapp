const { KEYS, get, set } = require('../../utils/storage');
const { calcSecondIncome, formatMoney } = require('../../utils/wage');

const STATUS_LIST = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中', '收工'];
const CATEGORIES = ['咖啡', '外卖', '通勤', '奶茶', '购物', '其他'];

function roast(status) {
  const map = { '正常上班': '今天先稳住，别被需求追着跑。', '摸鱼中': '摸鱼不是偷懒，是可持续续命。', '开会中': '会议开得热闹，产出先放一放。', '假装忙': '键盘敲得飞快，灵魂还在加载。', '崩溃中': '情绪先别崩，工资会准时到账。', '午休中': '午休回血，下午再战。', '加班中': '夜色已深，KPI 还在发光。' };
  return map[status] || '工位一坐，灵魂出窍。';
}

Page({
  data: {
    statusList: STATUS_LIST, categories: CATEGORIES, currentStatus: '正常上班', roastText: roast('正常上班'),
    progress: 0, todayIncome: '***', perSecond: '***', workedDuration: '00:00', offWorkCountdown: '--:--',
    todayExpense: '***', netIncome: '***', fishDuration: '0分钟', meetingDuration: '0分钟', recentExpenses: [],
    showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' }, hide: {}
  },
  onShow() { this.refresh(); },
  refresh() {
    const profile = get(KEYS.PROFILE, { hourSalary: 0, workHoursPerDay: 8 });
    const privacy = get(KEYS.PRIVACY, { hideSalary: true, hideTodayIncome: true, hideNetIncome: true });
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
