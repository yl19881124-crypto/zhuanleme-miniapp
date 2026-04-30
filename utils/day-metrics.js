const { KEYS, get } = require('./storage');
const { calcSecondIncome } = require('./wage');

const ALL_STATUS = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中'];

function toSeconds(time = '00:00') {
  const [h, m] = String(time).split(':').map((v) => Number(v) || 0);
  return h * 3600 + m * 60;
}

function getDayStart(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getTodayStatusLogs(now = Date.now()) {
  const start = getDayStart(now);
  return get(KEYS.STATUS_LOGS, []).filter((i) => i.time >= start && i.time <= now);
}

function getTodayExpenses(now = Date.now()) {
  const start = getDayStart(now);
  return get(KEYS.EXPENSE_LOGS, []).filter((i) => i.time >= start && i.time <= now);
}

function buildStatusDurations(logs, now = Date.now(), dayStart = getDayStart(now)) {
  const sorted = logs.slice().sort((a, b) => a.time - b.time);
  const durations = {};
  ALL_STATUS.forEach((s) => { durations[s] = 0; });

  if (!sorted.length) return durations;

  for (let i = 0; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    const start = Math.max(dayStart, cur.time);
    const end = next ? Math.min(now, next.time) : now;
    if (end > start && durations[cur.status] !== undefined) {
      durations[cur.status] += end - start;
    }
  }
  return durations;
}

function calcWorkSeconds(profile, now = Date.now()) {
  const d = new Date(now);
  const day = d.getDay();
  if (!profile.weekendPaid && (day === 0 || day === 6)) return 0;

  const secNow = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const on = toSeconds(profile.onWorkTime || '09:00');
  const off = toSeconds(profile.offWorkTime || '18:00');
  const lunchStart = toSeconds(profile.lunchStart || '12:00');
  const lunchEnd = toSeconds(profile.lunchEnd || '13:00');

  if (secNow <= on) return 0;

  let effective = Math.max(0, Math.min(secNow, off) - on);
  if (!profile.lunchPaid) {
    const overlap = Math.max(0, Math.min(secNow, lunchEnd, off) - Math.max(on, lunchStart));
    effective = Math.max(0, effective - overlap);
  }
  return effective;
}

function formatDuration(ms = 0) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}小时${m}分`;
}

function formatCountdown(seconds = 0) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getRealtimeCoreData(now = Date.now()) {
  const profile = get(KEYS.PROFILE, { monthlySalary: 0, workDaysPerMonth: 22, onWorkTime: '09:00', offWorkTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00', lunchPaid: false, weekendPaid: false });
  const perDaySalary = Number(profile.monthlySalary || 0) / Math.max(1, Number(profile.workDaysPerMonth || 22));

  const planWorkSeconds = Math.max(1, calcWorkSeconds({ ...profile, weekendPaid: true }, new Date(now).setHours(23, 59, 59, 999)));
  const secondIncome = calcSecondIncome(perDaySalary / (planWorkSeconds / 3600));

  const workedSeconds = calcWorkSeconds(profile, now);
  const grossIncome = workedSeconds * secondIncome;
  const expenses = getTodayExpenses(now);
  const expenseTotal = expenses.reduce((s, i) => s + Number(i.amount || 0), 0);

  const statusLogs = getTodayStatusLogs(now);
  const durations = buildStatusDurations(statusLogs, now, getDayStart(now));
  const totalStatusMs = Object.values(durations).reduce((s, v) => s + v, 0);
  const currentStatus = statusLogs.length ? statusLogs[statusLogs.length - 1].status : '正常上班';

  const offSec = toSeconds(profile.offWorkTime || '18:00');
  const nowSec = new Date(now).getHours() * 3600 + new Date(now).getMinutes() * 60 + new Date(now).getSeconds();
  const progress = Math.min(100, Math.round((workedSeconds / planWorkSeconds) * 100));

  return {
    secondIncome,
    todayEarned: grossIncome,
    todayGross: grossIncome,
    todayExpense: expenseTotal,
    todayNet: grossIncome - expenseTotal,
    workedSeconds,
    workedMsByStatus: durations,
    totalWorkedMsByStatus: totalStatusMs,
    currentStatus,
    progress,
    offWorkCountdownSec: Math.max(0, offSec - nowSec),
    fishMs: durations['摸鱼中'] || 0,
    meetingMs: durations['开会中'] || 0,
    overtimeMs: durations['加班中'] || 0,
    statusLogs,
    expenses,
    formatDuration,
    formatCountdown
  };
}

module.exports = { ALL_STATUS, formatDuration, formatCountdown, getRealtimeCoreData };
