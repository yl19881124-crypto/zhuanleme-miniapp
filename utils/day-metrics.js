const ALL_STATUS = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中'];

function toDateKey(input) {
  const d = new Date(input || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTimeToDate(dateKey, hhmm) {
  const [h, m] = String(hhmm || '00:00').split(':').map((v) => Number(v) || 0);
  const d = new Date(`${dateKey}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function calcDurationMs(startAt, endAt) {
  const toTs = (v) => {
    if (typeof v === 'string' && Number.isNaN(Number(v))) {
      const parsed = Date.parse(v);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  };
  return Math.max(0, toTs(endAt) - toTs(startAt));
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
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function computeTodayMetrics({ config = {}, dayState = {}, privacy = {}, now = Date.now() } = {}) {
  const tsNow = Number(now);
  const dateKey = toDateKey(tsNow);
  const startTime = config.startTime || config.onWorkTime || '09:30';
  const endTime = config.endTime || config.offWorkTime || '19:00';
  const lunchStart = config.lunchStart || '12:00';
  const lunchEnd = config.lunchEnd || '13:00';
  const monthlySalary = Number(config.monthlySalary ?? config.monthSalary ?? config.monthlyIncome ?? config.salary ?? 0);
  const workdaysPerMonth = Math.max(1, Number(config.workdaysPerMonth ?? config.workDaysPerMonth ?? config.workdays ?? config.workDays ?? config.workdayCount ?? 22));
  const configInvalid = !(monthlySalary > 0 && workdaysPerMonth > 0 && startTime && endTime);
  const dailySalary = monthlySalary / workdaysPerMonth;

  const startAt = parseTimeToDate(dateKey, startTime);
  const offAt = parseTimeToDate(dateKey, endTime);
  const lunchStartAt = parseTimeToDate(dateKey, lunchStart);
  const lunchEndAt = parseTimeToDate(dateKey, lunchEnd);

  let effectiveWorkSeconds = Math.max(0, Math.floor((offAt - startAt) / 1000));
  if (!config.lunchPaid) {
    effectiveWorkSeconds -= Math.max(0, Math.floor((Math.min(offAt, lunchEndAt) - Math.max(startAt, lunchStartAt)) / 1000));
  }
  effectiveWorkSeconds = Math.max(1, effectiveWorkSeconds);

  const settledAt = dayState.settledAt ? Number(dayState.settledAt) : null;
  const effectiveNow = settledAt || tsNow;

  const segments = Array.isArray(dayState.statusSegments) ? dayState.statusSegments.slice() : [];
  const statusDurations = {};
  ALL_STATUS.forEach((s) => { statusDurations[s] = 0; });

  segments.forEach((seg) => {
    if (!seg || !seg.status) return;
    const endAt = seg.endAt || effectiveNow;
    const duration = calcDurationMs(seg.startAt, Math.min(endAt, effectiveNow));
    if (statusDurations[seg.status] !== undefined) statusDurations[seg.status] += duration;
  });

  const fallbackCurrent = effectiveNow >= startAt ? '正常上班' : '';
  const currentStatus = dayState.currentStatus || fallbackCurrent;
  const currentStatusStartAt = dayState.currentStatusStartAt || (currentStatus ? startAt : 0);
  if (currentStatus && statusDurations[currentStatus] !== undefined) {
    statusDurations[currentStatus] += calcDurationMs(currentStatusStartAt, effectiveNow);
  }

  const workedMilliseconds = Object.values(statusDurations).reduce((sum, v) => sum + v, 0);
  const workedSeconds = Math.floor(workedMilliseconds / 1000);
  const secondSalary = configInvalid ? 0 : (dailySalary / effectiveWorkSeconds);
  const grossIncome = workedSeconds * secondSalary;

  const expenses = Array.isArray(dayState.expenses) ? dayState.expenses : [];
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netIncome = grossIncome - totalExpense;

  const fishingSeconds = Math.floor((statusDurations['摸鱼中'] || 0) / 1000);
  const meetingSeconds = Math.floor((statusDurations['开会中'] || 0) / 1000);
  const overtimeSeconds = Math.floor((statusDurations['加班中'] || 0) / 1000);
  const fishingIndex = Math.min(100, Math.round((fishingSeconds / Math.max(1, workedSeconds)) * 100));
  const mentalLoss = Math.min(100, Math.round((((statusDurations['崩溃中'] || 0) + (statusDurations['加班中'] || 0)) / Math.max(1, workedMilliseconds)) * 130));

  const personality = totalExpense > grossIncome * 0.5
    ? '钱包漏风型打工人'
    : overtimeSeconds > 7200
      ? '加班献祭型战士'
      : fishingSeconds > 7200
        ? '摸鱼套利型牛马'
        : '稳定续命型员工';
  const conclusion = netIncome < 0
    ? '今天属于倒贴上班，建议明天控制钱包冲动。'
    : '钱是赚到了一点，人也被消耗了一点。';

  console.log('[metrics salary]', {
    monthlySalary,
    workdaysPerMonth,
    dailySalary,
    effectiveWorkSeconds,
    secondSalary,
    workedSeconds,
    earnedToday: grossIncome
  });

  return {
    dateKey,
    currentStatus,
    earnedToday: grossIncome,
    grossIncome,
    totalExpense,
    netIncome,
    dailySalary,
    secondSalary,
    workedSeconds,
    remainingSeconds: Math.max(0, Math.floor((offAt - effectiveNow) / 1000)),
    progress: Math.min(100, Math.round((workedSeconds / effectiveWorkSeconds) * 100)),
    effectiveWorkSeconds,
    monthlySalary,
    workdaysPerMonth,
    configInvalid,
    configInvalidMessage: configInvalid ? '请先设置月薪和工作时间' : '',
    statusDurations,
    fishingSeconds,
    meetingSeconds,
    overtimeSeconds,
    fishingIndex,
    mentalLoss,
    personality,
    conclusion,
    privacy,
    settledAt
  };
}

module.exports = { ALL_STATUS, toDateKey, formatDuration, formatCountdown, computeTodayMetrics };
