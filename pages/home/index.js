const { KEYS, get, set } = require('../../utils/storage');
const { formatMoney } = require('../../utils/wage');
const { getRealtimeCoreData, formatDuration, formatCountdown } = require('../../utils/day-metrics');

const STATUS_LIST = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中', '收工'];
const CATEGORIES = ['咖啡', '奶茶', '午饭', '通勤', '外卖', '购物', '其他'];

function roast(status) {
  const map = {
    '正常上班': '你的人已经到岗，灵魂还在加载。',
    '摸鱼中': '恭喜你，正在进行工资套利。',
    '开会中': '本场会议产出未知，工资到账真实。',
    '假装忙': '看起来很忙，实际上系统待机。',
    '崩溃中': '钱在慢慢涨，人也在慢慢碎。',
    '午休中': '身体暂停，工资继续回血。',
    '加班中': '现在赚的是钱，亏的是命。',
    收工: '今日副本准备结算。'
  };
  return map[status] || '工位一坐，灵魂出窍。';
}

Page({
  data: {
    statusList: STATUS_LIST, categories: CATEGORIES, currentStatus: '正常上班', roastText: roast('正常上班'),
    progress: 0, todayIncome: '0.00', perSecondText: '+¥0.0000/s', workedDuration: '0小时0分', offWorkCountdown: '00:00:00',
    todayExpense: '0.00', netIncome: '0.00', fishDuration: '0小时0分', meetingDuration: '0小时0分', recentExpenses: [],
    showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' }, hide: {}, hideLabel: '👁 金额可见'
  },
  onShow() { this.startRealtimeRefresh(); },
  onHide() { this.stopRealtimeRefresh(); },
  onUnload() { this.stopRealtimeRefresh(); },
  startRealtimeRefresh() {
    this.stopRealtimeRefresh();
    this.updateRealtimeData();
    this.timer = setInterval(() => this.updateRealtimeData(), 1000);
  },
  stopRealtimeRefresh() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  updateRealtimeData() {
    const privacy = get(KEYS.PRIVACY, { hideTodayIncome: false, maskOnShare: true });
    const core = getRealtimeCoreData(Date.now());
    const hidden = !!privacy.hideTodayIncome;

    this.setData({
      hide: privacy,
      hideLabel: hidden ? '🙈 金额隐藏' : '👁 金额可见',
      currentStatus: core.currentStatus,
      roastText: roast(core.currentStatus),
      progress: core.progress,
      perSecondText: hidden ? '***' : `+¥${core.secondIncome.toFixed(4)}/s`,
      todayIncome: formatMoney(core.todayEarned, hidden),
      workedDuration: formatDuration(core.totalWorkedMsByStatus || core.workedSeconds * 1000),
      offWorkCountdown: formatCountdown(core.offWorkCountdownSec),
      todayExpense: formatMoney(core.todayExpense, hidden),
      netIncome: formatMoney(core.todayNet, hidden),
      fishDuration: formatDuration(core.fishMs),
      meetingDuration: formatDuration(core.meetingMs),
      recentExpenses: core.expenses.slice(0, 3)
    });
  },
  togglePrivacy() {
    const privacy = { ...this.data.hide, hideTodayIncome: !this.data.hide.hideTodayIncome };
    this.setData({ hide: privacy });
    set(KEYS.PRIVACY, privacy);
    this.updateRealtimeData();
  },
  chooseStatus(e) {
    const status = e.currentTarget.dataset.status;
    const logs = get(KEYS.STATUS_LOGS, []);
    logs.push({ status, time: Date.now() });
    set(KEYS.STATUS_LOGS, logs.slice(-200));
    this.setData({ currentStatus: status, roastText: roast(status) });
    if (status === '收工') wx.switchTab({ url: '/pages/settlement/index' });
    this.updateRealtimeData();
  },
  openExpensePopup() { this.setData({ showExpensePopup: true }); },
  closeExpensePopup() { this.setData({ showExpensePopup: false }); },
  noop() {},
  onAmount(e) { this.setData({ 'form.amount': e.detail.value }); },
  onNote(e) { this.setData({ 'form.note': e.detail.value }); },
  onCategory(e) { this.setData({ 'form.category': CATEGORIES[e.detail.value] }); },
  addExpense() {
    const core = getRealtimeCoreData(Date.now());
    const amount = Number(this.data.form.amount || 0);
    if (!(amount > 0)) return wx.showToast({ title: '请输入有效金额', icon: 'none' });
    const grindMinutes = core.secondIncome ? Math.round(amount / core.secondIncome / 60) : 0;
    const logs = get(KEYS.EXPENSE_LOGS, []);
    logs.unshift({ ...this.data.form, amount, grindMinutes, time: Date.now() });
    set(KEYS.EXPENSE_LOGS, logs.slice(0, 200));
    wx.showToast({ title: '已记录，这笔消费让钱包轻微受伤', icon: 'none' });
    this.setData({ showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' } });
    this.updateRealtimeData();
  },
  goSettlement() { wx.switchTab({ url: '/pages/settlement/index' }); }
});
