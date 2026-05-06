const STATUS_TEXT_MAP = {
  正常上班: '正常上班',
  摸鱼中: '摸鱼中',
  开会中: '开会中',
  假装忙: '假装忙',
  崩溃中: '崩溃中',
  午休中: '午休中',
  加班中: '加班中',
  overtime: '加班中',
  meeting: '开会中',
  fishing: '摸鱼中',
  pretending: '假装忙',
  breakdown: '崩溃中',
  normal: '正常上班'
};

const MAIN_STATUS_POOL = {
  opening: ['刚刚开工中', '开局回血中', '工位加载中', '副本启动中'],
  overtime: ['加班献祭中', '延长营业中', '夜间搬砖中', '下班无期中', '额外续命中'],
  breakdown: ['精神重启中', '表面冷静中', '临界续命中', '一边碎中', '需求追杀中'],
  meeting: ['会议求生中', '会议漂流中', '带薪参会中', '会议包围中', '产出待定中'],
  fishing: ['带薪摸鱼中', '工资套利中', '灵魂离岗中', '精准划水中', '表面在线中'],
  pretending: ['假装很忙中', '表面生产中', '工位待机中', '忙碌表演中', '效率伪装中'],
  tired: ['低电量中', '强撑在线中', '靠意志中', '机械运转中', '下班倒计中'],
  stable: ['稳定续命中', '正常营业中', '平稳搬砖中', '稳定回血中', '安静搬砖中']
};

const CONCLUSION_POOL = {
  stable: ['今天还在稳定回血，先别急着崩。', '老板买到了时间，但没完全买到灵魂。', '今日状态平稳，适合继续续命。', '钱是赚到了一点，人也被消耗了一点。'],
  fishing: ['人在工位，灵魂已经先去放风了。', '表面在线，实际正在节能模式。', '今天最大的努力，是看起来很努力。', '工资在走，灵魂在飘。'],
  meeting: ['会是开了不少，产出还在路上。', '今天的工资，一部分来自认真旁听。', '人在会议里，心在下班路上。', '老板买到了参会时长。'],
  overtime: ['今天赚的是钱，亏的是命。', '下班被延长，灵魂被续费。', '今日份打工，已进入加时赛。', '还没走的人，都是勇士。'],
  tired: ['电量不多，但还在运行。', '今日状态：能撑就撑。', '人还在岗，脑子先下班。', '靠意志完成今日续航。'],
  breakdown: ['表面稳定，内心正在重启。', '今天的情绪，也在参与打工。', '需求还在追，人已经快碎。', '稳住，至少还没当场离职。'],
  opening: ['工位刚就绪，状态还在加载。', '开工阶段先热身，打工引擎启动中。', '今天副本刚开场，先稳住节奏。', '刚进状态，先把进度条点亮。'],
  pretending: ['今天演的是忙碌，主打一个在线。', '看起来很投入，实际在找节奏。', '忙碌感拉满，效率还在集合。', '工位在线，产出稍后到达。']
};

const BATTLE_REWARD_POOLS = [
  { min: 0, max: 20, level: 'level1', lines: ['早餐基金到账', '豆浆油条有着落了', '煎饼果子努力中', '便利店小补给已解锁', '一杯矿泉水自由'] },
  { min: 20, max: 40, level: 'level2', lines: ['一杯美式到手', '奶茶预算已解锁', '咖啡续命成功', '下午茶资格到手', '甜品基金启动'] },
  { min: 40, max: 80, level: 'level3', lines: ['今日通勤已回本', '外卖配送费赚回来了', '午饭基金已到账', '打工没白来，午饭有了', '一顿简餐稳了'] },
  { min: 80, max: 120, level: 'level4', lines: ['一顿像样午饭到手', '奶茶加午饭安排上了', '今天吃饭不用心虚了', '工作餐自由已达成', '午饭饮料双解锁'] },
  { min: 120, max: 200, level: 'level5', lines: ['下班外卖有着落了', '小烧烤基金启动', '电影票有戏了', '今天赚出一点快乐预算', '一顿像样晚饭问题不大'] },
  { min: 200, max: 300, level: 'level6', lines: ['奶茶自由稳了', '下班外卖自由达成', '周末电影票到手', '今天打工没白来', '快乐消费权限已开启'] },
  { min: 300, max: 500, level: 'level7', lines: ['下班小烧烤安排上', '小聚餐基金已到账', '点外卖的底气有了', '今晚可以对自己好一点', '一顿火锅正在靠近'] },
  { min: 500, max: 800, level: 'level8', lines: ['一顿火锅问题不大', '周末聚餐基金有了', '小购物预算已解锁', '今天打工有点成果了', '像样的快乐到账了'] },
  { min: 800, max: 1000, level: 'level9', lines: ['一件小礼物可以安排', '周末快乐预算达成', '报复性消费正在接近', '今天这班开始值钱了', '快乐额度明显提升'] },
  { min: 1000, max: Infinity, level: 'level10', lines: ['演唱会，冲！', 'Live 门票有戏了', '周末快乐基金拉满', '大件心愿开始靠近', '今天是真赚出名堂了', '报复性消费底气上线', '快乐预算明显膨胀', '这班开始有点香了'] }
];

const WALLET_POOLS = {
  safe: ['安全', '消费克制'],
  light: ['轻度', '小额掉血'],
  medium: ['中度', '钱包预警'],
  heavy: ['重度', '钱包预警']
};

function hashSeed(seed = '') { let h = 2166136261; const s = String(seed); for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); } return (h >>> 0); }
function seededPick(list, seed) { if (!Array.isArray(list) || !list.length) return ''; return list[hashSeed(seed) % list.length]; }

function buildPosterContent(metrics = {}) {
  const workedMinutes = Math.floor((metrics.workedSeconds || 0) / 60);
  const fishingMinutes = Math.floor((metrics.fishingSeconds || 0) / 60);
  const meetingMinutes = Math.floor((metrics.meetingSeconds || 0) / 60);
  const overtimeMinutes = Math.floor((metrics.overtimeSeconds || 0) / 60);
  const breakdownMinutes = Math.floor(((metrics.statusDurations?.['崩溃中'] || 0) / 1000) / 60);
  const pretendingMinutes = Math.floor(((metrics.statusDurations?.['假装忙'] || 0) / 1000) / 60);
  const statusDurMs = metrics.statusDurations?.[metrics.currentStatus] || 0;
  const currentStatusDurationMinutes = Math.floor(statusDurMs / 1000 / 60);
  const workedSafe = Math.max(1, workedMinutes);

  const currentStatus = metrics.currentStatus || '正常上班';
  const meetingMatched = meetingMinutes >= 45 || (meetingMinutes >= 25 && meetingMinutes / workedSafe >= 0.18) || (currentStatus === '开会中' && currentStatusDurationMinutes >= 20);
  const fishingMatched = fishingMinutes >= 30 || (fishingMinutes >= 20 && fishingMinutes / workedSafe >= 0.15) || (currentStatus === '摸鱼中' && currentStatusDurationMinutes >= 15);

  let mainStatusCategory = 'stable';
  if (workedMinutes < 15) mainStatusCategory = 'opening';
  else if (overtimeMinutes >= 20 || (currentStatus === '加班中' && currentStatusDurationMinutes >= 10)) mainStatusCategory = 'overtime';
  else if (breakdownMinutes >= 10 || (currentStatus === '崩溃中' && currentStatusDurationMinutes >= 5) || (metrics.mentalLoss || 0) >= 70) mainStatusCategory = 'breakdown';
  else if (fishingMinutes >= 60 && fishingMatched) mainStatusCategory = 'fishing';
  else if (meetingMatched) mainStatusCategory = 'meeting';
  else if (fishingMatched) mainStatusCategory = 'fishing';
  else if (pretendingMinutes >= 30 || (pretendingMinutes >= 20 && pretendingMinutes / workedSafe >= 0.15) || (currentStatus === '假装忙' && currentStatusDurationMinutes >= 15)) mainStatusCategory = 'pretending';
  else if ((workedMinutes >= 360 && (metrics.progress || 0) >= 70) || (metrics.mentalLoss || 0) >= 45 || ((metrics.remainingSeconds || 0) <= 3600 && workedMinutes >= 300)) mainStatusCategory = 'tired';

  const rewardConfig = BATTLE_REWARD_POOLS.find((item) => metrics.earnedToday >= item.min && metrics.earnedToday < item.max) || BATTLE_REWARD_POOLS[0];
  const battleRewardLevel = rewardConfig.level;
  const walletLevel = metrics.totalExpense <= 0 ? 'safe' : metrics.totalExpense <= 50 ? 'light' : metrics.totalExpense <= 150 ? 'medium' : 'heavy';
  const dateKey = metrics.dateKey || '';
  const baseSeed = `${dateKey}${mainStatusCategory}${battleRewardLevel}`;

  const mainStatusText = seededPick(MAIN_STATUS_POOL[mainStatusCategory], `${baseSeed}:main`).slice(0, 6);
  return {
    mainStatusText,
    mainStatusCategory,
    conclusion: seededPick(CONCLUSION_POOL[mainStatusCategory] || CONCLUSION_POOL.stable, `${baseSeed}:conclusion`),
    battleRewardText: seededPick(rewardConfig.lines, `${baseSeed}:reward`),
    battleRewardLevel,
    currentStatusText: STATUS_TEXT_MAP[currentStatus] || '正常上班',
    fishingIndexText: `${Math.max(0, Math.min(100, Math.round(metrics.fishingIndex || 0)))}/100`,
    walletDamageText: seededPick(WALLET_POOLS[walletLevel], `${baseSeed}:wallet`),
    ctaTitle: '今天打工回血了吗？',
    ctaSubtitle: '看看你的牛马进度条'
  };
}

module.exports = { buildPosterContent, seededPick };
