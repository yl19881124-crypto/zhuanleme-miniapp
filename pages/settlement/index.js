const { KEYS, get } = require('../../utils/storage');
const { formatMoney } = require('../../utils/wage');

Page({
  data: { gross: '***', expense: '***', net: '***' },
  onShow() {
    const privacy = get(KEYS.PRIVACY, { hideTodayIncome: true, hideNetIncome: true });
    const profile = get(KEYS.PROFILE, { hourSalary: 0 });
    const expenses = get(KEYS.EXPENSE_LOGS, []);
    const gross = profile.hourSalary * 8;
    const expenseTotal = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    this.setData({
      gross: formatMoney(gross, privacy.hideTodayIncome),
      expense: formatMoney(expenseTotal, privacy.hideNetIncome),
      net: formatMoney(gross - expenseTotal, privacy.hideNetIncome)
    });
  }
});
