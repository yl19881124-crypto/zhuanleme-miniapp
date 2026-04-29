const { KEYS, get } = require('../../utils/storage');
const { calcSecondIncome, formatMoney } = require('../../utils/wage');

Page({
  data: {
    progress: 0,
    todayIncome: '***',
    perSecond: '***',
    workedDuration: '00:00:00',
    offWorkCountdown: '--:--:--',
    status: '正常上班',
    roastText: '工位一坐，灵魂出窍。',
    hideSalary: true
  },

  onShow() {
    const profile = get(KEYS.PROFILE, {});
    const privacy = get(KEYS.PRIVACY, { hideTodayIncome: true, hideSalary: true });
    const perSecond = calcSecondIncome(profile.hourSalary || 0);
    this.setData({
      perSecond: formatMoney(perSecond, privacy.hideSalary),
      todayIncome: formatMoney((profile.hourSalary || 0) * 2.5, privacy.hideTodayIncome),
      progress: 31,
      hideSalary: privacy.hideSalary
    });
  }
});
