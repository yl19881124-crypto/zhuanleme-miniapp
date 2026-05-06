const { getTodayMetrics } = require('../../utils/day-store');

const STATUS_LABEL_MAP = {
  normal: '正常上班', fishing: '摸鱼中', meeting: '开会中', pretending: '假装忙', breakdown: '崩溃中',
  lunch: '午休中', overtime: '加班中', off: '已收工', 正常上班: '正常上班', 摸鱼中: '摸鱼中',
  开会中: '开会中', 假装忙: '假装忙', 崩溃中: '崩溃中', 午休中: '午休中', 加班中: '加班中', 收工: '已收工'
};

function sanitizeMoneyText(text = '') {
  return String(text)
    .replace(/(¥|￥|\$)\s*\d+(?:\.\d+)?/gi, '***')
    .replace(/\d+(?:\.\d+)?\s*(元|块|块钱|人民币|RMB)/gi, '***')
    .replace(/赚了\s*\d+(?:\.\d+)?/gi, '赚了***')
    .replace(/亏了\s*\d+(?:\.\d+)?/gi, '亏了***');
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
        walletDamageText: sanitizeMoneyText(metrics.walletDamageText || metrics.walletDamageLevel || '安全'),
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

    this.roundRect(ctx, 530, 52, 170, 58, 28, '#f5c516');
    this.text(ctx, '老板可见版', 615, 91, '700 36px sans-serif', '#111', 'center');

    this.text(ctx, '赚了么', 62, 132, '900 86px sans-serif', '#101010');
    this.stroke(ctx, '#f5c516', 8, [[58, 154], [210, 136], [140, 158], [290, 158]]);
    this.text(ctx, '★', 294, 170, '700 42px sans-serif', '#f5c516');

    this.text(ctx, '今日打工状态', 62, 255, '700 56px sans-serif', '#111');
    this.text(ctx, metrics.mainStatusText, 62, 390, '900 126px sans-serif', '#090909');
    this.text(ctx, metrics.conclusion, 62, 515, '500 52px sans-serif', '#111');

    this.roundRect(ctx, 40, 560, 670, 240, 30, '#fff9dd', '#f0d36a');
    this.roundRect(ctx, 268, 592, 210, 56, 14, '#f5c516');
    this.text(ctx, '今日战果', 373, 632, '800 52px sans-serif', '#111', 'center');
    this.text(ctx, '🏆', 94, 725, '700 116px sans-serif', '#f5c516');
    this.text(ctx, metrics.battleRewardText, 220, 740, '900 84px sans-serif', '#111');
    this.text(ctx, '🧋', 596, 736, '700 112px sans-serif', '#111', 'center');

    this.metricCard(ctx, 46, 836, 206, 264, '📋', '当前状态', metrics.currentStatusText);
    this.metricCard(ctx, 272, 836, 206, 264, '⏱', '摸鱼指数', metrics.fishingIndex);
    this.metricCard(ctx, 498, 836, 206, 264, '🛡', '钱包伤害', metrics.walletDamageText);

    this.roundRect(ctx, 40, 1124, 670, 170, 28, '#fff', '#f5c516', [8, 10]);
    this.text(ctx, '📣', 76, 1226, '700 74px sans-serif', '#f5c516');
    this.text(ctx, '今天打工回血了吗？', 192, 1199, '800 64px sans-serif', '#111');
    this.text(ctx, metrics.footerGuide, 192, 1260, '500 44px sans-serif', '#111');
    this.roundRect(ctx, 548, 1144, 140, 130, 18, '#f8f8f8', '#cfcfcf', [6, 8]);
    this.text(ctx, '小程序码', 618, 1222, '500 36px sans-serif', '#9c9c9c', 'center');
  },
  metricCard(ctx, x, y, w, h, icon, label, value) {
    this.roundRect(ctx, x, y, w, h, 22, '#fff', '#e6e6e6');
    this.text(ctx, icon, x + 30, y + 72, '700 56px sans-serif', '#111');
    this.text(ctx, label, x + 24, y + 130, '600 36px sans-serif', '#111');
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#f5c516';
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 150);
    ctx.lineTo(x + w - 18, y + 150);
    ctx.stroke();
    ctx.setLineDash([]);
    this.wrapText(ctx, value, x + 22, y + 212, w - 40, 50, 2, '900 66px sans-serif', '#111');
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
  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    const lines = [];
    let line = '';
    for (let i = 0; i < String(text).length; i += 1) {
      const next = line + String(text)[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = String(text)[i];
      } else line = next;
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((item, idx) => ctx.fillText(item, x, y + idx * lineHeight));
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
