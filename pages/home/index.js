const { formatMoney } = require('../../utils/wage');
const { formatDuration, formatCountdown } = require('../../utils/day-metrics');
const { getTodayMetrics, getTodayState, getPrivacy, savePrivacy, switchStatus, addExpense } = require('../../utils/day-store');

const STATUS_LIST = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中', '收工'];
const CATEGORIES = ['咖啡', '奶茶', '午饭', '通勤', '外卖', '购物', '其他'];

function roast(status) { return `${status || '正常上班'}，继续打工回血中。`; }

Page({
  data: { statusList: STATUS_LIST, categories: CATEGORIES, currentStatus: '正常上班', roastText: roast('正常上班'), progress: 0, todayIncome: '0.00', perSecondText: '+¥0.0000/s', workedDuration: '0小时0分', offWorkCountdown: '00:00:00', todayExpense: '0.00', netIncome: '0.00', fishDuration: '0小时0分', meetingDuration: '0小时0分', recentExpenses: [], showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' }, hide: {}, hideLabel: '👁 金额可见' },
  onShow() { this.startRealtimeRefresh(); },
  onHide() { this.stopRealtimeRefresh(); },
  onUnload() { this.stopRealtimeRefresh(); },
  startRealtimeRefresh() { this.stopRealtimeRefresh(); this.updateRealtimeData(); this.timer = setInterval(() => this.updateRealtimeData(), 1000); },
  stopRealtimeRefresh() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  updateRealtimeData() {
    const privacy = getPrivacy();
    const metrics = getTodayMetrics(Date.now());
    const hidden = !!privacy.hideTodayIncome;
    const dayState = getTodayState(Date.now());
    this.setData({
      hide: privacy,
      hideLabel: hidden ? '🙈 金额隐藏' : '👁 金额可见',
      currentStatus: metrics.currentStatus || '正常上班',
      roastText: roast(metrics.currentStatus),
      progress: metrics.progress,
      perSecondText: hidden ? '***' : `+¥${metrics.secondSalary.toFixed(4)}/s`,
      todayIncome: formatMoney(metrics.earnedToday, hidden),
      workedDuration: formatDuration(metrics.workedSeconds * 1000),
      offWorkCountdown: formatCountdown(metrics.remainingSeconds),
      todayExpense: formatMoney(metrics.totalExpense, hidden),
      netIncome: formatMoney(metrics.netIncome, hidden),
      fishDuration: formatDuration(metrics.fishingSeconds * 1000),
      meetingDuration: formatDuration(metrics.meetingSeconds * 1000),
      recentExpenses: (dayState.expenses || []).slice(0, 3)
    });
  },
  togglePrivacy() { const privacy = { ...getPrivacy(), hideTodayIncome: !getPrivacy().hideTodayIncome }; savePrivacy(privacy); this.updateRealtimeData(); },
  chooseStatus(e) { const status = e.currentTarget.dataset.status; switchStatus(status, Date.now()); if (status === '收工') wx.switchTab({ url: '/pages/settlement/index' }); this.updateRealtimeData(); },
  openExpensePopup() { this.setData({ showExpensePopup: true }); },
  closeExpensePopup() { this.setData({ showExpensePopup: false }); },
  noop() {}, onAmount(e) { this.setData({ 'form.amount': e.detail.value }); }, onNote(e) { this.setData({ 'form.note': e.detail.value }); }, onCategory(e) { this.setData({ 'form.category': CATEGORIES[e.detail.value] }); },
  addExpense() {
    const metrics = getTodayMetrics(Date.now());
    const amount = Number(this.data.form.amount || 0);
    if (!(amount > 0)) return wx.showToast({ title: '请输入有效金额', icon: 'none' });
    const grindMinutes = metrics.secondSalary ? Math.round(amount / metrics.secondSalary / 60) : 0;
    addExpense({ ...this.data.form, amount, grindMinutes });
    wx.showToast({ title: '已记录，这笔消费让钱包轻微受伤', icon: 'none' });
    this.setData({ showExpensePopup: false, form: { amount: '', category: '咖啡', note: '' } });
    this.updateRealtimeData();
  },
  goSettlement() { wx.switchTab({ url: '/pages/settlement/index' }); }
});
