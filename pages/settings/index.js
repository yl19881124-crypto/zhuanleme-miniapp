const { KEYS, get, set } = require('../../utils/storage');

const defaultPrivacy = { hideSalary: true, hideTodayIncome: true, hideNetIncome: true, maskOnShare: true };

Page({
  data: {
    profile: { monthlySalary: '', workDaysPerMonth: 21.75, onWorkTime: '09:00', offWorkTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00', lunchPaid: false, weekendPaid: false },
    privacy: defaultPrivacy
  },
  onShow() { this.setData({ profile: { ...this.data.profile, ...get(KEYS.PROFILE, {}) }, privacy: get(KEYS.PRIVACY, defaultPrivacy) }); },
  input(e) { this.setData({ [`profile.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  toggleProfile(e) { this.setData({ [`profile.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  saveProfile() {
    const p = this.data.profile;
    const monthlySalary = Number(p.monthlySalary || 0);
    const workHoursPerDay = (Number(p.offWorkTime.split(':')[0]) - Number(p.onWorkTime.split(':')[0])) - 1;
    set(KEYS.PROFILE, { ...p, monthlySalary, workHoursPerDay, hourSalary: monthlySalary / (Number(p.workDaysPerMonth) || 21.75) / (workHoursPerDay || 8) });
    wx.showToast({ title: '设置已保存', icon: 'success' });
  },
  onPrivacyChange(e) { const key = e.currentTarget.dataset.key; const privacy = { ...this.data.privacy, [key]: e.detail.value }; this.setData({ privacy }); set(KEYS.PRIVACY, privacy); },
  clearToday() { set(KEYS.STATUS_LOGS, []); set(KEYS.EXPENSE_LOGS, []); wx.showToast({ title: '今日记录已清空', icon: 'success' }); },
  resetAll() { wx.clearStorageSync(); set(KEYS.PRIVACY, defaultPrivacy); wx.showToast({ title: '已重置', icon: 'success' }); },
  exportData() { wx.showToast({ title: '导出功能占位', icon: 'none' }); }
});
