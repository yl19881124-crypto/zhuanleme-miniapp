const { KEYS, set } = require('../../utils/storage');
const { saveConfig, DEFAULT_CONFIG } = require('../../utils/day-store');

Page({
  data: {
    monthlySalary: '',
    workHoursPerDay: 8,
    workDaysPerMonth: 21.75
  },

  onSalaryInput(e) { this.setData({ monthlySalary: e.detail.value }); },

  saveConfig() {
    const monthlySalary = Number(this.data.monthlySalary || 0);
    const profile = {
      monthlySalary,
      hourSalary: monthlySalary / this.data.workDaysPerMonth / this.data.workHoursPerDay,
      daySalary: monthlySalary / this.data.workDaysPerMonth,
      workHoursPerDay: this.data.workHoursPerDay
    };
    set(KEYS.PROFILE, profile);
    saveConfig({
      monthlySalary,
      workdaysPerMonth: this.data.workDaysPerMonth,
      startTime: DEFAULT_CONFIG.startTime,
      endTime: DEFAULT_CONFIG.endTime,
      lunchStart: DEFAULT_CONFIG.lunchStart,
      lunchEnd: DEFAULT_CONFIG.lunchEnd,
      lunchPaid: DEFAULT_CONFIG.lunchPaid,
      weekendPaid: DEFAULT_CONFIG.weekendPaid
    });
    set(KEYS.INITIALIZED, true);
    wx.switchTab ? wx.switchTab({ url: '/pages/home/index' }) : wx.redirectTo({ url: '/pages/home/index' });
  }
});
