const { KEYS, set } = require('../../utils/storage');

Page({
  data: {
    monthlySalary: '',
    workHoursPerDay: 8,
    workDaysPerMonth: 21.75
  },

  onSalaryInput(e) { this.setData({ monthlySalary: e.detail.value }); },

  saveConfig() {
    const monthlySalary = Number(this.data.monthlySalary || 0);
    const hourSalary = monthlySalary / this.data.workDaysPerMonth / this.data.workHoursPerDay;
    set(KEYS.PROFILE, {
      monthlySalary,
      hourSalary,
      daySalary: monthlySalary / this.data.workDaysPerMonth,
      workHoursPerDay: this.data.workHoursPerDay
    });
    set(KEYS.INITIALIZED, true);
    wx.switchTab ? wx.switchTab({ url: '/pages/home/index' }) : wx.redirectTo({ url: '/pages/home/index' });
  }
});
