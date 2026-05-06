const { getTodayMetrics } = require('../../utils/day-store');

const STATUS_LABEL_MAP = {
  normal: '正常上班', fishing: '摸鱼中', meeting: '开会中', pretending: '假装忙', breakdown: '崩溃中',
  lunch: '午休中', overtime: '加班中', off: '已收工', 正常上班: '正常上班', 摸鱼中: '摸鱼中',
  开会中: '开会中', 假装忙: '假装忙', 崩溃中: '崩溃中', 午休中: '午休中', 加班中: '加班中', 收工: '已收工'
};

const MAIN_STATUS_POOL = ['稳住续命中', '摸鱼回血中', '打工续航中', '平稳搬砖中', '状态在线中', '能量回升中'];
const WALLET_SHORT_MAP = {
  安全: '安全',
  轻度: '轻度',
  中度: '中度',
  重度: '重度',
  消费克制: '消费克制',
  小额掉血: '小额掉血',
  钱包预警: '钱包预警'
};

function sanitizeMoneyText(text = '') {
  return String(text)
    .replace(/(¥|￥|\$)\s*\d+(?:\.\d+)?/gi, '***')
    .replace(/\d+(?:\.\d+)?\s*(元|块|块钱|人民币|RMB)/gi, '***')
    .replace(/赚了\s*\d+(?:\.\d+)?/gi, '赚了***')
    .replace(/亏了\s*\d+(?:\.\d+)?/gi, '亏了***');
}

function countZhChars(text = '') {
  const matched = String(text).match(/[\u4e00-\u9fa5]/g);
  return matched ? matched.length : 0;
}

function pickShortMainStatus(text = '') {
  if (countZhChars(text) <= 6) return text;
  return MAIN_STATUS_POOL[Math.floor(Math.random() * MAIN_STATUS_POOL.length)];
}

function toWalletShortValue(text = '') {
  const raw = String(text).trim();
  if (WALLET_SHORT_MAP[raw]) return WALLET_SHORT_MAP[raw];
  const found = Object.keys(WALLET_SHORT_MAP).find((key) => raw.includes(key));
  return found ? WALLET_SHORT_MAP[found] : '钱包预警';
}

Page({
  data: { metrics: null, posterImagePath: '', posterReady: false, loading: false },
  onLoad() { this.loadMetrics(); },
  onReady() { this.drawPoster(); },
  loadMetrics() {
    const metrics = getTodayMetrics(Date.now());
    this.setData({
      metrics: {
        mainStatusText: sanitizeMoneyText(metrics.mainStatusText || metrics.personality || '带薪摸鱼中'),
        conclusion: sanitizeMoneyText(metrics.conclusion || '人在工位，灵魂已经先去放风了。'),
        battleRewardText: sanitizeMoneyText(metrics.battleRewardText || metrics.todayHarvest || '奶茶自由达成'),
        currentStatusText: sanitizeMoneyText(STATUS_LABEL_MAP[metrics.currentStatusText || metrics.currentStatus] || '摸鱼中'),
        fishingIndex: `${Math.min(100, Math.max(0, Number(metrics.fishingIndex) || 62))}/100`,
        walletDamageText: toWalletShortValue(sanitizeMoneyText(metrics.walletDamageText || metrics.walletDamageLevel || '安全')),
        footerGuide: sanitizeMoneyText('长按看看你的牛马进度条')
      }
    });
  },
  drawPoster() {
    const { metrics } = this.data;
    if (!metrics) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#posterCanvas').fields({ node: true }).exec((res) => {
      const nodeInfo = res && res[0];
      if (!nodeInfo || !nodeInfo.node) return;
      const canvas = nodeInfo.node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
      const W = 750;
      const H = 1334;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      this.paintPoster(ctx, metrics, W, H);
      this.updatePreviewImage(canvas, W, H);
    });
  },
  paintPoster(ctx, metrics, W, H) {
    ctx.fillStyle = '#f3f2ee';
    ctx.fillRect(0, 0, W, H);

    this.roundRect(ctx, 20, 20, W - 40, H - 40, 36, '#fff');

    this.roundRect(ctx, 518, 52, 178, 58, 28, '#f5c516');
    this.text(ctx, '老板可见版', 607, 91, '700 36px sans-serif', '#111', 'center');

    this.text(ctx, '赚了么', 62, 132, '900 86px sans-serif', '#101010');
    this.stroke(ctx, '#f5c516', 8, [[58, 154], [210, 136], [140, 158], [290, 158]]);
    this.text(ctx, '★', 294, 170, '700 42px sans-serif', '#f5c516');

    this.drawTextBox(ctx, '今日打工状态', 60, 180, 400, {
      fontSize: 34, fontWeight: 700, color: '#111', maxLines: 1, lineHeight: 40
    });
    this.drawTextBox(ctx, pickShortMainStatus(metrics.mainStatusText), 60, 265, 630, {
      fontSize: 76, fontWeight: 900, color: '#090909', lineHeight: 84, maxLines: 1, ellipsis: true
    });
    this.drawTextBox(ctx, metrics.conclusion, 60, 350, 610, {
      fontSize: 30, fontWeight: 400, color: '#111', lineHeight: 42, maxLines: 2, ellipsis: true
    });

    this.roundRect(ctx, 40, 560, 670, 240, 30, '#fff9dd', '#f0d36a');
    this.drawTextBox(ctx, '今日战果', 375, 462, 200, {
      fontSize: 32, fontWeight: 800, color: '#111', align: 'center', maxLines: 1, lineHeight: 38
    });
    this.text(ctx, '🏆', 94, 725, '700 116px sans-serif', '#f5c516');
    const rewardFontSize = countZhChars(metrics.battleRewardText) > 10 ? 38 : 44;
    const rewardLineHeight = rewardFontSize === 38 ? 48 : 54;
    this.drawTextBox(ctx, metrics.battleRewardText, 155, 535, 470, {
      fontSize: rewardFontSize, fontWeight: 900, color: '#111', lineHeight: rewardLineHeight, maxLines: 2, ellipsis: true
    });
    this.text(ctx, '🧋', 596, 736, '700 112px sans-serif', '#111', 'center');

    this.metricCard(ctx, 46, 836, 194, 210, '📋', '今天打工回血了吗？', '看你的牛马进度条', {
      labelX: 64, labelY: 902, labelSize: 24, labelMaxWidth: 156,
      valueX: 64, valueY: 946, valueSize: 20, valueMaxWidth: 156, valueMaxLines: 1
    });
    this.metricCard(ctx, 262, 836, 194, 210, '⏱', '', '', {
      labelX: 280, labelY: 902, labelSize: 24, labelMaxWidth: 156,
      valueX: 280, valueY: 946, valueSize: 20, valueMaxWidth: 156, valueMaxLines: 1
    });
    this.metricCard(ctx, 478, 836, 194, 210, '🛡', '小程序码', '', {
      labelX: 496, labelY: 940, labelSize: 28, labelMaxWidth: 156,
      valueX: 496, valueY: 960, valueSize: 20, valueMaxWidth: 156, valueMaxLines: 1
    });

    this.roundRect(ctx, 40, 1124, 670, 170, 28, '#fff', '#f5c516', [8, 10]);
    this.text(ctx, '📣', 76, 1226, '700 74px sans-serif', '#f5c516');
    this.roundRect(ctx, 548, 1144, 140, 130, 18, '#f8f8f8', '#cfcfcf', [6, 8]);
  },
  metricCard(ctx, x, y, w, h, icon, label, value, textOptions = {}) {
    this.roundRect(ctx, x, y, w, h, 22, '#fff', '#e6e6e6');
    this.text(ctx, icon, x + 30, y + 72, '700 56px sans-serif', '#111');
    if (label) this.drawTextBox(ctx, label, textOptions.labelX, textOptions.labelY, textOptions.labelMaxWidth, {
      fontSize: textOptions.labelSize, fontWeight: 600, color: '#111', align: 'center', maxLines: 2, lineHeight: 30
    });
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#f5c516';
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 150);
    ctx.lineTo(x + w - 18, y + 150);
    ctx.stroke();
    ctx.setLineDash([]);
    if (value) {
      let fishingSize = textOptions.valueSize;
      if (label === '摸鱼指数' && ctx.measureText(String(value)).width > textOptions.valueMaxWidth) fishingSize = 36;
      this.drawTextBox(ctx, value, textOptions.valueX, textOptions.valueY, textOptions.valueMaxWidth, {
        fontSize: fishingSize, fontWeight: 500, color: '#666', align: 'center', maxLines: textOptions.valueMaxLines, lineHeight: 30, ellipsis: true
      });
    }
  },
  roundRect(ctx, x, y, w, h, r, fill, stroke, dash) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      if (dash) ctx.setLineDash(dash);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  stroke(ctx, color, width, points) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  },
  text(ctx, t, x, y, font, color, align = 'left') {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(t, x, y);
    ctx.textAlign = 'left';
  },
  drawTextBox(ctx, text, x, y, maxWidth, options = {}) {
    const {
      fontSize = 30,
      fontWeight = 400,
      color = '#111',
      lineHeight = 36,
      maxLines = 1,
      align = 'left',
      ellipsis = false
    } = options;
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const lines = [];
    let line = '';
    const chars = String(text || '');
    for (let i = 0; i < chars.length; i += 1) {
      const next = line + chars[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
      } else line = next;
    }
    if (line) lines.push(line);
    let output = lines.slice(0, maxLines);
    if (ellipsis && lines.length > maxLines && output.length) {
      let last = output[output.length - 1];
      while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      output[output.length - 1] = `${last}…`;
    }
    output.forEach((item, idx) => ctx.fillText(item, x, y + idx * lineHeight));
    ctx.textAlign = 'left';
  },
  updatePreviewImage(canvas, w, h) {
    wx.canvasToTempFilePath({
      canvas,
      destWidth: w * 2,
      destHeight: h * 2,
      success: (res) => this.setData({ posterImagePath: res.tempFilePath, posterReady: true, loading: false }),
      fail: () => this.setData({ loading: false })
    }, this);
  },
  savePoster() {
    if (!this.data.posterImagePath) return wx.showToast({ title: '海报还没生成，请稍后再试', icon: 'none' });
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImagePath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    });
  },
  onShareAppMessage() {
    return { title: '我今天的牛马进度条已更新', path: '/pages/home/index', imageUrl: this.data.posterImagePath || undefined };
  },
  goBack() { wx.navigateBack({ delta: 1 }); }
});
