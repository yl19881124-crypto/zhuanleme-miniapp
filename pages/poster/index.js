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
  data: { metrics: null, posterImage: '' },
  onLoad() { this.loadMetrics(); },
  onReady() { this.drawPoster(); },
  loadMetrics() {
    const metrics = getTodayMetrics(Date.now());
    this.setData({
      metrics: {
        mainStatusText: sanitizeMoneyText(metrics.mainStatusText || metrics.personality || '稳定续命中'),
        conclusion: sanitizeMoneyText(metrics.conclusion || '钱是赚到了一点，人也被消耗了一点。'),
        battleRewardText: sanitizeMoneyText(metrics.battleRewardText || metrics.todayHarvest || '早餐基金到账'),
        currentStatusText: sanitizeMoneyText(STATUS_LABEL_MAP[metrics.currentStatusText || metrics.currentStatus] || '正常上班'),
        fishingIndex: `${Math.min(100, Math.max(0, Number(metrics.fishingIndex) || 0))}/100`,
        walletDamageText: sanitizeMoneyText(metrics.walletDamageText || metrics.walletDamageLevel || '轻伤'),
        footerGuide: sanitizeMoneyText('看看你的牛马进度条')
      }
    });
  },
  drawPoster() {
    const { metrics } = this.data;
    if (!metrics) return;
    wx.createSelectorQuery().select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo().pixelRatio;
      const width = 750;
      const height = 1100;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const bg = canvas.createImage();
      bg.onload = () => {
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = '#111';
        ctx.font = '800 40px sans-serif';
        ctx.fillText('赚了么', 90, 110);

        ctx.fillStyle = '#333';
        ctx.font = '28px sans-serif';
        ctx.fillText('今日打工状态', 90, 190);
        ctx.fillStyle = '#111';
        this.wrapTextLines(ctx, metrics.mainStatusText, 90, 258, 570, 68, 2, '900 64px sans-serif');

        ctx.fillStyle = '#555';
        this.wrapTextLines(ctx, metrics.conclusion, 90, 352, 570, 42, 2, '28px sans-serif');

        ctx.fillStyle = '#7A5A00';
        ctx.font = '26px sans-serif';
        ctx.fillText('今日战果', 118, 438);
        ctx.fillStyle = '#111';
        this.wrapTextLines(ctx, metrics.battleRewardText, 118, 500, 514, 44, 2, '800 38px sans-serif');

        this.drawMetricText(ctx, 118, 662, '当前状态', metrics.currentStatusText);
        this.drawMetricText(ctx, 118, 802, '摸鱼指数', metrics.fishingIndex);
        this.drawMetricText(ctx, 406, 802, '钱包伤害', metrics.walletDamageText || '***');

        ctx.fillStyle = '#222';
        ctx.font = '600 26px sans-serif';
        ctx.fillText('今天打工回血了吗？', 90, 950);
        ctx.fillStyle = '#777';
        ctx.font = '22px sans-serif';
        ctx.fillText(metrics.footerGuide, 90, 988);

        ctx.fillStyle = '#999';
        ctx.font = '20px sans-serif';
        ctx.fillText('小程序码', 560, 998);

        this.updatePreviewImage();
      };
      bg.src = '/assets/poster/poster-bg.png';
    });
  },
  drawMetricText(ctx, x, y, label, value) {
    ctx.fillStyle = '#777';
    ctx.font = '24px sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#111';
    this.wrapTextLines(ctx, value || '-', x, y + 44, 250, 36, 1, '700 34px sans-serif');
  },
  wrapTextLines(ctx, text = '', x, y, maxWidth, lineHeight, maxLines = 2, font = '24px sans-serif') {
    ctx.font = font;
    const lines = [];
    let line = '';
    for (let i = 0; i < text.length; i += 1) {
      const testLine = line + text[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = text[i];
      } else line = testLine;
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((item, idx) => ctx.fillText(item, x, y + (idx * lineHeight)));
  },
  updatePreviewImage() {
    wx.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      success: (res) => this.setData({ posterImage: res.tempFilePath })
    }, this);
  },
  savePoster() {
    wx.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        });
      },
      fail: () => wx.showToast({ title: '海报生成失败', icon: 'none' })
    }, this);
  },
  onShareAppMessage() {
    return { title: '我今天的牛马进度条已更新', path: '/pages/home/index', imageUrl: this.data.posterImage || undefined };
  },
  goBack() { wx.navigateBack({ delta: 1 }); }
});
