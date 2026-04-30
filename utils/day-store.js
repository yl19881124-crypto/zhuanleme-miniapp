const { computeTodayMetrics, toDateKey } = require('./day-metrics');

const STORAGE_KEYS = {
  CONFIG: 'salary_config',
  PRIVACY: 'privacy_settings'
};

const DEFAULT_CONFIG = {
  monthlySalary: 12000,
  workdaysPerMonth: 22,
  startTime: '09:30',
  endTime: '19:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  lunchPaid: false,
  weekendPaid: false
};

function getStorage(key, fallback) {
  const value = wx.getStorageSync(key);
  return value === '' || value === undefined ? fallback : value;
}

function setStorage(key, value) {
  wx.setStorageSync(key, value);
}

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const normalized = {
    monthlySalary: toNumber(source.monthlySalary ?? source.monthSalary ?? source.monthlyIncome ?? source.salary, DEFAULT_CONFIG.monthlySalary),
    workdaysPerMonth: toNumber(source.workdaysPerMonth ?? source.workDaysPerMonth ?? source.workdays ?? source.workDays ?? source.workdayCount, DEFAULT_CONFIG.workdaysPerMonth),
    startTime: source.startTime || source.onWorkTime || DEFAULT_CONFIG.startTime,
    endTime: source.endTime || source.offWorkTime || DEFAULT_CONFIG.endTime,
    lunchStart: source.lunchStart || DEFAULT_CONFIG.lunchStart,
    lunchEnd: source.lunchEnd || DEFAULT_CONFIG.lunchEnd,
    lunchPaid: Boolean(source.lunchPaid),
    weekendPaid: Boolean(source.weekendPaid)
  };
  normalized.workdaysPerMonth = Math.max(1, normalized.workdaysPerMonth);
  return normalized;
}

function getConfig() {
  const fromSalaryConfig = getStorage(STORAGE_KEYS.CONFIG, null);
  const fromLegacyProfile = getStorage('userProfile', null);
  const config = normalizeConfig(fromSalaryConfig || fromLegacyProfile || DEFAULT_CONFIG);
  console.log('[config]', config);
  return config;
}

function saveConfig(config) {
  const normalized = normalizeConfig(config);
  setStorage(STORAGE_KEYS.CONFIG, normalized);
}

function getPrivacy() { return getStorage(STORAGE_KEYS.PRIVACY, { hideTodayIncome: false, maskOnShare: true }); }

function savePrivacy(privacy) { setStorage(STORAGE_KEYS.PRIVACY, privacy); }

function dayKey(dateKey) { return `day_state_${dateKey}`; }

function getTodayState(now = Date.now()) {
  const dateKey = toDateKey(now);
  const defaultState = { dateKey, currentStatus: '', currentStatusStartAt: 0, statusSegments: [], expenses: [], settledAt: null };
  const state = getStorage(dayKey(dateKey), defaultState) || defaultState;
  return { ...defaultState, ...state, dateKey };
}

function saveTodayState(dayState, now = Date.now()) {
  const dateKey = dayState.dateKey || toDateKey(now);
  setStorage(dayKey(dateKey), { ...dayState, dateKey });
}

function getTodayMetrics(now = Date.now()) {
  const config = getConfig();
  const privacy = getPrivacy();
  const dayState = getTodayState(now);
  return computeTodayMetrics({ config, dayState, privacy, now });
}

function switchStatus(status, now = Date.now()) {
  const ts = Number(now);
  const dayState = getTodayState(ts);
  const statusSegments = Array.isArray(dayState.statusSegments) ? dayState.statusSegments.slice() : [];

  if (dayState.currentStatus && dayState.currentStatusStartAt && ts > dayState.currentStatusStartAt) {
    statusSegments.push({
      status: dayState.currentStatus,
      startAt: dayState.currentStatusStartAt,
      endAt: ts
    });
  }

  const next = { ...dayState, currentStatus: status, currentStatusStartAt: ts, statusSegments };
  if (status === '收工') next.settledAt = ts;
  saveTodayState(next, ts);
  return next;
}

function addExpense(expense, now = Date.now()) {
  const ts = Number(now);
  const dayState = getTodayState(ts);
  const expenses = Array.isArray(dayState.expenses) ? dayState.expenses.slice() : [];
  expenses.unshift({ ...expense, time: ts });
  saveTodayState({ ...dayState, expenses }, ts);
}

function clearTodayRecords(now = Date.now()) {
  const dateKey = toDateKey(now);
  setStorage(dayKey(dateKey), { dateKey, currentStatus: '', currentStatusStartAt: 0, statusSegments: [], expenses: [], settledAt: null });
}

module.exports = {
  STORAGE_KEYS,
  DEFAULT_CONFIG,
  getConfig,
  saveConfig,
  getPrivacy,
  savePrivacy,
  getTodayState,
  saveTodayState,
  getTodayMetrics,
  switchStatus,
  addExpense,
  clearTodayRecords
};
