const { KEYS, get, set } = require('../../utils/storage');

Page({
  data: {
    privacy: {
      hideSalary: true,
      hideTodayIncome: true,
      hideNetIncome: true,
      maskOnShare: true
    }
  },
  onShow() { this.setData({ privacy: get(KEYS.PRIVACY, this.data.privacy) }); },
  onPrivacyChange(e) {
    const key = e.currentTarget.dataset.key;
    const privacy = { ...this.data.privacy, [key]: e.detail.value };
    this.setData({ privacy });
    set(KEYS.PRIVACY, privacy);
  }
});
