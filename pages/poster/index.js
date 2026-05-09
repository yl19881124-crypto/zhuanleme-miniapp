Page({
  goHome() {
    wx.switchTab({ url: '/pages/home/index' });
  },
  goSettlement() {
    wx.switchTab({ url: '/pages/settlement/index' });
  }
});
