const ALL_STATUS = ['正常上班', '摸鱼中', '开会中', '假装忙', '崩溃中', '午休中', '加班中'];

const MAIN_STATUS_POOL = {
  stable: ['稳定续命中', '正常营业中', '平稳打工中', '稳定回血中', '安静搬砖中', '工位待机中'],
  fishing: ['带薪摸鱼中', '工资套利中', '表面在线中', '假装很忙中', '灵魂离岗中', '身在工位心在远方中'],
  meeting: ['会议包围中', '被会议消耗中', '认真参会表演中', '会议变现中', '一边听一边飘中'],
  tired: ['靠意志上班中', '低电量续航中', '人还在岗中', '机械运转中', '强撑在线中'],
  breakdown: ['情绪稳定崩溃中', '一边上班一边碎中', '表面冷静中', '精神重启中', '需求追杀中'],
  overtime: ['加班献祭中', '下班遥遥无期中', '夜间搬砖中', '额外出卖时间中', '今日份延长营业中']
};

const COMMENT_POOL = [
  '钱是赚到了一点，人也被消耗了一点。',
  '今天还在稳定回血，先别急着崩。',
  '老板买到了时间，但没完全买到灵魂。',
  '今天打工不算白来，至少生活基金到账了一点。',
  '工位已就位，灵魂加载中。',
  '今天最大的成就，是没有当场离职。'
];

const DUNGEON_RESULT_POOL = ['顺利通关', '勉强通关', '稳定续命', '低耗过关', '惊险过关', '灵魂半离岗', '差点掉线', '打工保命成功', '还在坚持', '今日存活'];

const WALLET_DAMAGE_POOL = {
  safe: ['安全', '无伤通关', '今日保住了钱包', '消费克制中'],
  light: ['轻度', '小额掉血', '情绪性消费轻微发生', '钱包轻轻受伤'],
  medium: ['中度', '钱包开始掉血', '今日花钱有点认真', '小破财预警'],
  heavy: ['重度', '钱包伤得不轻', '花钱像在泄压', '今天消费有点上头']
};

const TODAY_HARVEST_POOL = [
  { min: 0, max: 20, lines: ['早餐基金到账', '豆浆油条有着落了', '煎饼果子努力中', '便利店小补给已解锁', '一杯矿泉水自由'] },
  { min: 20, max: 40, lines: ['一杯美式到手', '奶茶预算已解锁', '咖啡续命成功', '下午茶资格到手', '甜品基金启动'] },
  { min: 40, max: 80, lines: ['今日通勤已回本', '外卖配送费赚回来了', '午饭基金已到账', '打工没白来，午饭有了', '一顿简餐稳了'] },
  { min: 80, max: 120, lines: ['一顿像样午饭到手', '奶茶加午饭安排上了', '今天吃饭不用心虚了', '工作餐自由已达成', '午饭 + 饮料双解锁'] },
  { min: 120, max: 200, lines: ['下班外卖有着落了', '小烧烤基金启动', '电影票有戏了', '今天已经赚出一点快乐预算', '一顿像样晚饭问题不大'] },
  { min: 200, max: 300, lines: ['奶茶自由稳了', '下班外卖自由达成', '周末一张电影票到手', '今天打工没白来', '快乐消费权限已开启'] },
  { min: 300, max: 500, lines: ['下班小烧烤安排上', '小聚餐基金已到账', '报复性点外卖的底气有了', '今晚可以稍微对自己好一点', '一顿火锅的梦想正在靠近'] },
  { min: 500, max: 800, lines: ['一顿火锅问题不大', '周末聚餐基金有了', '小购物预算已解锁', '今天打工开始有点成果了', '已经赚到一点像样的快乐了'] },
  { min: 800, max: 1000, lines: ['一件小礼物可以安排了', '周末快乐预算达成', '小型报复性消费正在接近', '今天这班开始值点钱了', '快乐额度明显提升中'] },
  { min: 1000, max: Infinity, lines: ['演唱会，冲！', 'Live 门票有戏了', '周末快乐基金拉满', '大件心愿开始靠近', '今天是真赚出点名堂了', '报复性消费底气已上线', '快乐预算明显膨胀中', '这班开始有点香了'] }
];

function pickRandom(list = [], fallback = '') {
  if (!Array.isArray(list) || !list.length) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

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

function intersectInterval(base, clip) {
  const start = Math.max(base.start, clip.start);
  const end = Math.min(base.end, clip.end);
  if (end <= start) return null;
  return { start, end };
}

function subtractCoveredFromInterval(interval, covered) {
  if (!covered.length) return [interval];
  const sorted = covered
    .map((item) => ({ start: item.start, end: item.end }))
    .sort((a, b) => a.start - b.start);
  const merged = [];
  sorted.forEach((item) => {
    if (!merged.length) {
      merged.push(item);
      return;
    }
    const last = merged[merged.length - 1];
    if (item.start <= last.end) {
      last.end = Math.max(last.end, item.end);
    } else {
      merged.push(item);
    }
  });

  const blanks = [];
  let cursor = interval.start;
  merged.forEach((item) => {
    if (item.end <= cursor) return;
    if (item.start > cursor) {
      blanks.push({ start: cursor, end: Math.min(item.start, interval.end) });
    }
    cursor = Math.max(cursor, item.end);
  });
  if (cursor < interval.end) blanks.push({ start: cursor, end: interval.end });
  return blanks.filter((seg) => seg.end > seg.start);
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

  const statusDurations = {};
  ALL_STATUS.forEach((s) => { statusDurations[s] = 0; });

  const scheduleEndAt = Math.min(effectiveNow, offAt);
  let scheduleWorkedSeconds = 0;
  if (scheduleEndAt > startAt) {
    scheduleWorkedSeconds = Math.floor((scheduleEndAt - startAt) / 1000);
    if (!config.lunchPaid) {
      const lunchOverlapMs = Math.max(0, Math.min(scheduleEndAt, lunchEndAt) - Math.max(startAt, lunchStartAt));
      scheduleWorkedSeconds -= Math.floor(lunchOverlapMs / 1000);
    }
  }
  scheduleWorkedSeconds = Math.max(0, Math.min(effectiveWorkSeconds, scheduleWorkedSeconds));

  const workIntervals = [];
  if (config.lunchPaid) {
    if (scheduleEndAt > startAt) workIntervals.push({ start: startAt, end: scheduleEndAt });
  } else {
    const beforeLunchEnd = Math.min(scheduleEndAt, lunchStartAt);
    if (beforeLunchEnd > startAt) workIntervals.push({ start: startAt, end: beforeLunchEnd });
    const afterLunchStart = Math.max(startAt, lunchEndAt);
    if (scheduleEndAt > afterLunchStart) workIntervals.push({ start: afterLunchStart, end: scheduleEndAt });
  }

  const segments = Array.isArray(dayState.statusSegments) ? dayState.statusSegments.slice() : [];
  const statusIntervals = [];
  segments.forEach((seg) => {
    if (!seg || !seg.status || statusDurations[seg.status] === undefined) return;
    const segStart = Number(seg.startAt || 0);
    const segEnd = Number(seg.endAt || effectiveNow);
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segEnd <= segStart) return;
    statusIntervals.push({ status: seg.status, start: segStart, end: Math.min(segEnd, effectiveNow) });
  });

  const fallbackCurrent = effectiveNow >= startAt ? '正常上班' : '';
  const currentStatus = dayState.currentStatus || fallbackCurrent;
  const currentStatusStartAt = dayState.currentStatusStartAt || (currentStatus ? startAt : 0);
  if (currentStatus && statusDurations[currentStatus] !== undefined) {
    const curStart = Number(currentStatusStartAt || 0);
    if (Number.isFinite(curStart) && effectiveNow > curStart) {
      statusIntervals.push({ status: currentStatus, start: curStart, end: effectiveNow });
    }
  }

  workIntervals.forEach((workInterval) => {
    const covered = [];
    statusIntervals.forEach((statusInterval) => {
      const overlap = intersectInterval(workInterval, statusInterval);
      if (!overlap) return;
      statusDurations[statusInterval.status] += overlap.end - overlap.start;
      covered.push(overlap);
    });
    const uncovered = subtractCoveredFromInterval(workInterval, covered);
    uncovered.forEach((gap) => {
      statusDurations['正常上班'] += gap.end - gap.start;
    });
  });

  const workedMilliseconds = Object.values(statusDurations).reduce((sum, v) => sum + v, 0);
  const workedSeconds = Math.floor(workedMilliseconds / 1000);

  const secondSalary = configInvalid ? 0 : (dailySalary / effectiveWorkSeconds);
  const grossIncome = scheduleWorkedSeconds * secondSalary;

  const expenses = Array.isArray(dayState.expenses) ? dayState.expenses : [];
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netIncome = grossIncome - totalExpense;

  const fishingSeconds = Math.floor((statusDurations['摸鱼中'] || 0) / 1000);
  const meetingSeconds = Math.floor((statusDurations['开会中'] || 0) / 1000);
  const overtimeSeconds = Math.floor((statusDurations['加班中'] || 0) / 1000);
  const fishingIndex = Math.min(100, Math.round((fishingSeconds / Math.max(1, workedSeconds)) * 100));
  const mentalLoss = Math.min(100, Math.round((((statusDurations['崩溃中'] || 0) + (statusDurations['加班中'] || 0)) / Math.max(1, workedMilliseconds)) * 130));

  const statusKey = overtimeSeconds > 7200
    ? 'overtime'
    : (statusDurations['崩溃中'] || 0) > 1800000
      ? 'breakdown'
      : meetingSeconds > 5400
        ? 'meeting'
        : fishingSeconds > 7200
          ? 'fishing'
          : mentalLoss > 65
            ? 'tired'
            : 'stable';
  const personality = pickRandom(MAIN_STATUS_POOL[statusKey], '稳定续命中');
  const conclusion = pickRandom(COMMENT_POOL, '钱是赚到了一点，人也被消耗了一点。');
  const dungeonResult = pickRandom(DUNGEON_RESULT_POOL, '勉强通关');
  const harvestTier = TODAY_HARVEST_POOL.find((tier) => grossIncome >= tier.min && grossIncome < tier.max) || TODAY_HARVEST_POOL[0];
  const todayHarvest = pickRandom(harvestTier.lines, '早餐基金到账');

  const walletDamagePool = totalExpense <= 0
    ? WALLET_DAMAGE_POOL.safe
    : totalExpense <= 50
      ? WALLET_DAMAGE_POOL.light
      : totalExpense <= 150
        ? WALLET_DAMAGE_POOL.medium
        : WALLET_DAMAGE_POOL.heavy;
  const walletDamageLevel = pickRandom(walletDamagePool, '安全');

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
    scheduleWorkedSeconds,
    remainingSeconds: Math.max(0, Math.floor((offAt - effectiveNow) / 1000)),
    progress: Math.min(100, Math.round((scheduleWorkedSeconds / effectiveWorkSeconds) * 100)),
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
    dungeonResult,
    todayHarvest,
    walletDamageLevel,
    privacy,
    settledAt
  };
}

module.exports = { ALL_STATUS, toDateKey, formatDuration, formatCountdown, computeTodayMetrics };
