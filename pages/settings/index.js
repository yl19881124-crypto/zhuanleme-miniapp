const { KEYS, set } = require('../../utils/storage');
const { getConfig, saveConfig, getPrivacy, savePrivacy, DEFAULT_PRIVACY, clearTodayRecords } = require('../../utils/day-store');

const defaultPrivacy = DEFAULT_PRIVACY;

Page({
  data: {
    profile: { monthlySalary: '', workdaysPerMonth: 22, startTime: '09:30', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00', lunchPaid: false, weekendPaid: false },
    privacy: defaultPrivacy
  },
  onShow() {
    const config = getConfig();
    this.setData({ profile: { ...this.data.profile, ...config }, privacy: getPrivacy() });
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.updateSelected) tabBar.updateSelected();
  },
  input(e) { this.setData({ [`profile.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  toggleProfile(e) { this.setData({ [`profile.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  saveProfile() {
    const p = this.data.profile;
    const config = {
      monthlySalary: Number(p.monthlySalary || 0),
      workdaysPerMonth: Math.max(1, parseInt(p.workdaysPerMonth, 10) || 22),
      startTime: p.startTime || '09:30',
      endTime: p.endTime || '19:00',
      lunchStart: p.lunchStart || '12:00',
      lunchEnd: p.lunchEnd || '13:00',
      lunchPaid: Boolean(p.lunchPaid),
      weekendPaid: Boolean(p.weekendPaid)
    };
    saveConfig(config);
    wx.showToast({ title: '设置已保存', icon: 'success' });
  },
  onPrivacyChange(e) {
    const key = e.currentTarget.dataset.key;
    const next = e.detail.value;
    const privacy = { ...this.data.privacy, [key]: next };
    if (key === 'hideTodayIncome' && next) privacy.hideSalary = true;
    if (key === 'hideTodayIncome' && !next) privacy.hideSalary = false;
    this.setData({ privacy });
    savePrivacy(privacy);
  },
  clearToday() {
    wx.showModal({
      title: '确认清空',
      content: '确认清空今日战利品吗？',
      success: (res) => {
        if (!res.confirm) return;
        clearTodayRecords();
        set(KEYS.STATUS_LOGS, []);
        set(KEYS.EXPENSE_LOGS, []);
        wx.showToast({ title: '今日记录已清空', icon: 'success' });
      }
    });
  },
  resetAll() { wx.clearStorageSync(); savePrivacy(defaultPrivacy); wx.showToast({ title: '已重置', icon: 'success' }); },
  exportData() { wx.showToast({ title: '导出功能占位', icon: 'none' }); },
  goPlan() { wx.navigateTo({ url: '/pages/plan/index' }); }
});
