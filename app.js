App({
  globalData: {
    slogan: '今天打工回血了吗？'
  },

  onLaunch() {
    const initialized = wx.getStorageSync('initialized');
    if (!initialized) {
      wx.setStorageSync('initialized', false);
    }

    const privacyConfig = wx.getStorageSync('privacyConfig');
    if (!privacyConfig) {
      wx.setStorageSync('privacyConfig', {
        hideSalary: true,
        hideTodayIncome: true,
        hideNetIncome: true,
        maskOnShare: true
      });
    }
  }
});
