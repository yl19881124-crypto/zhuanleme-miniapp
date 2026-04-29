const KEYS = {
  PROFILE: 'userProfile',
  STATUS_LOGS: 'statusLogs',
  EXPENSE_LOGS: 'expenseLogs',
  PRIVACY: 'privacyConfig',
  INITIALIZED: 'initialized'
};

function get(key, fallback = null) {
  const val = wx.getStorageSync(key);
  return val === '' || val === undefined ? fallback : val;
}

function set(key, value) {
  wx.setStorageSync(key, value);
}

module.exports = { KEYS, get, set };
