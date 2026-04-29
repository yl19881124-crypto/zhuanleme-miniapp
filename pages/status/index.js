const { KEYS, get, set } = require('../../utils/storage');

const STATUS_LIST = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中', '收工'];

Page({
  data: { statusList: STATUS_LIST, currentStatus: '正常上班' },
  chooseStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ currentStatus: status });
    const logs = get(KEYS.STATUS_LOGS, []);
    logs.unshift({ status, time: Date.now() });
    set(KEYS.STATUS_LOGS, logs.slice(0, 100));
    wx.showToast({ title: '状态已记录', icon: 'success' });
  }
});
