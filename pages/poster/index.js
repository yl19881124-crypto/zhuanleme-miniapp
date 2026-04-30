const { getTodayMetrics } = require('../../utils/day-store');
const { formatDuration } = require('../../utils/day-metrics');

const STATUS_LABEL_MAP = {
  normal: '正常上班',
  fishing: '摸鱼中',
  meeting: '开会中',
  pretending: '假装忙',
  breakdown: '崩溃中',
  lunch: '午休中',
  overtime: '加班中',
  off: '已收工',
  正常上班: '正常上班',
  摸鱼中: '摸鱼中',
  开会中: '开会中',
  假装忙: '假装忙',
  崩溃中: '崩溃中',
  午休中: '午休中',
  加班中: '加班中',
  收工: '已收工'
};

Page({
  data: { metrics: null },
  onLoad() { this.loadMetrics(); },
  onReady() { this.drawPoster(); },
  loadMetrics() {
    const metrics = getTodayMetrics(Date.now());
    this.setData({
      metrics: {
        progress: metrics.progress,
        currentStatus: STATUS_LABEL_MAP[metrics.currentStatus] || '正常上班',
        workedText: formatDuration(metrics.workedSeconds * 1000),
        remainingText: formatDuration(metrics.remainingSeconds * 1000),
        fishingIndex: metrics.fishingIndex,
        mentalLoss: metrics.mentalLoss,
        personality: metrics.personality || '稳定续命中',
        conclusion: metrics.conclusion || '钱是赚到了一点，人也被消耗了一点。',
        walletDamageLevel: metrics.walletDamageLevel || '安全',
        todayHarvest: metrics.todayHarvest || '早餐基金到账',
        dungeonResult: metrics.dungeonResult || '勉强通关'
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
      const width = res[0].width;
      const height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      this.roundRect(ctx, 18, 18, width - 36, height - 36, 16);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('赚了么', 44, 76);
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.fillText('老板可见安全版', 44, 108);

      ctx.fillStyle = '#ffd23f';
      this.roundRect(ctx, width - 270, 46, 220, 42, 20);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = '18px sans-serif';
      ctx.fillText('今日打工副本结算', width - 250, 74);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(metrics.personality, 44, 180);
      ctx.fillStyle = '#444';
      ctx.font = '24px sans-serif';
      this.wrapText(ctx, metrics.conclusion, 44, 230, width - 88, 36);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('今日战果', 44, 294);
      ctx.fillStyle = '#2d6a4f';
      ctx.font = '24px sans-serif';
      this.wrapText(ctx, metrics.todayHarvest, 44, 330, width - 88, 34);

      const cards = [
        `当前状态：${metrics.currentStatus}`,
        `摸鱼指数：${metrics.fishingIndex}/100`,
        `精神损耗：${metrics.mentalLoss}/100`,
        `钱包伤害：${metrics.walletDamageLevel}`,
        `副本结果：${metrics.dungeonResult}`
      ];

      let y = 390;
      cards.forEach((item) => {
        ctx.fillStyle = '#f8f8f8';
        this.roundRect(ctx, 44, y, width - 88, 72, 12);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.font = '24px sans-serif';
        ctx.fillText(item, 64, y + 45);
        y += 86;
      });

      ctx.fillStyle = '#111';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('今天打工回血了吗？', 44, height - 140);
      ctx.fillStyle = '#666';
      ctx.font = '22px sans-serif';
      ctx.fillText('牛马进度条', 44, height - 102);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width - 130, height - 120, 56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.font = '16px sans-serif';
      ctx.fillText('小程序码占位', width - 182, height - 115);
    });
  },
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let currentY = y;
    for (let i = 0; i < text.length; i += 1) {
      const testLine = line + text[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = text[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
  },
  savePoster() {
    wx.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: (err) => {
            if (err.errMsg && err.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中开启“保存到相册”权限',
                success: (mRes) => { if (mRes.confirm) wx.openSetting(); }
              });
              return;
            }
            wx.showToast({ title: '保存失败，请重试', icon: 'none' });
          }
        });
      },
      fail: () => wx.showToast({ title: '海报生成失败', icon: 'none' })
    }, this);
  },
  onShareAppMessage() {
    return { title: '我今天的牛马进度条已更新', path: '/pages/home/index' };
  },
  goBack() { wx.navigateBack({ delta: 1 }); }
});
