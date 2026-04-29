const { KEYS, get, set } = require('../../utils/storage');

Page({
  data: { amount: '', equivalentHours: 0 },
  inputAmount(e) { this.setData({ amount: e.detail.value }); },
  calc() {
    const profile = get(KEYS.PROFILE, { hourSalary: 0 });
    const amount = Number(this.data.amount || 0);
    const equivalentHours = profile.hourSalary ? (amount / profile.hourSalary).toFixed(2) : 0;
    this.setData({ equivalentHours });
    const logs = get(KEYS.EXPENSE_LOGS, []);
    logs.unshift({ amount, equivalentHours, time: Date.now() });
    set(KEYS.EXPENSE_LOGS, logs.slice(0, 100));
  }
});
