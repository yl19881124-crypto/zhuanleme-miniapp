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
        currentStatus: STATUS_LABEL_MAP[metrics.currentStatusText || metrics.currentStatus] || '正常上班',
        workedText: formatDuration(metrics.workedSeconds * 1000),
        remainingText: formatDuration(metrics.remainingSeconds * 1000),
        fishingIndex: metrics.fishingIndex,
        mentalLoss: metrics.mentalLoss,
        mainStatusText: (metrics.mainStatusText || metrics.personality || '稳定续命中').slice(0, 6),
        conclusion: metrics.conclusion || '钱是赚到了一点，人也被消耗了一点。',
        walletDamageText: metrics.walletDamageText || metrics.walletDamageLevel || '安全',
        battleRewardText: metrics.battleRewardText || metrics.todayHarvest || '早餐基金到账',
        dungeonResultText: metrics.dungeonResultText || metrics.dungeonResult || '勉强通关'
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

      ctx.fillStyle = '#f5f3ee';
      ctx.fillRect(0, 0, 750, 1100);
      const cardX = 55;
      const cardY = 40;
      const cardW = 640;
      const cardH = 980;
      ctx.fillStyle = '#fffdf8';
      this.roundRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fill();
      const contentX = cardX + 40;
      const contentW = cardW - 80;

      // 1. 顶部品牌区（固定区块）
      ctx.fillStyle = '#111';
      ctx.font = '800 40px sans-serif';
      ctx.fillText('赚了么', contentX, cardY + 84);

      const badgeText = '老板可见版';
      let badgeFontSize = 24;
      let badgeTextWidth = 0;
      do {
        ctx.font = `600 ${badgeFontSize}px sans-serif`;
        badgeTextWidth = ctx.measureText(badgeText).width;
        if (badgeTextWidth <= 170 || badgeFontSize <= 20) break;
        badgeFontSize -= 1;
      } while (badgeFontSize >= 20);

      ctx.fillStyle = '#F2D34F';
      const badgeW = Math.max(130, Math.min(190, badgeTextWidth + 44));
      const badgeH = 46;
      const badgeX = cardX + cardW - 40 - badgeW;
      const badgeY = cardY + 45;
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 999);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = `600 ${badgeFontSize}px sans-serif`;
      ctx.fillText(badgeText, badgeX + 22, badgeY + 31);

      // 2. 主状态区
      ctx.fillStyle = '#333';
      ctx.font = '28px sans-serif';
      ctx.fillText('今日打工状态', contentX, cardY + 162);
      ctx.fillStyle = '#111';
      ctx.font = '900 64px sans-serif';
      ctx.fillText((metrics.mainStatusText || '稳定续命中').slice(0, 6), contentX, cardY + 244);
      ctx.fillStyle = '#555';
      this.wrapTextLines(ctx, metrics.conclusion, contentX, cardY + 286, contentW, 42, 2, '28px sans-serif');

      // 3. 今日战果卡
      const rewardY = cardY + 380;
      ctx.fillStyle = '#FFF4C8';
      this.roundRect(ctx, contentX, rewardY, contentW, 182, 24);
      ctx.fill();
      ctx.fillStyle = '#7a5a00';
      ctx.font = '26px sans-serif';
      ctx.fillText('今日战果', contentX + 28, rewardY + 46);
      ctx.fillStyle = '#111';
      const rewardFont = String(metrics.battleRewardText || '').length > 10 ? '800 34px sans-serif' : '800 40px sans-serif';
      this.wrapTextLines(ctx, metrics.battleRewardText, contentX + 28, rewardY + 102, contentW - 56, 44, 2, rewardFont);

      // 4. 指标卡片区（仅三项）
      const statY = rewardY + 214;
      const statGap = 16;
      const largeCardH = 120;
      const smallCardH = 120;
      const halfW = Math.floor((contentW - statGap) / 2);
      this.drawMetricCard(ctx, contentX, statY, contentW, largeCardH, '当前状态', metrics.currentStatus);
      this.drawMetricCard(ctx, contentX, statY + largeCardH + statGap, halfW, smallCardH, '摸鱼指数', `${metrics.fishingIndex}/100`);
      this.drawMetricCard(ctx, contentX + halfW + statGap, statY + largeCardH + statGap, halfW, smallCardH, '钱包伤害', metrics.walletDamageText);

      // 5. 底部引导区（固定到底部）
      const footerY = cardY + cardH - 180;
      ctx.strokeStyle = '#EDE7D8';
      ctx.beginPath();
      ctx.moveTo(contentX, footerY);
      ctx.lineTo(contentX + contentW, footerY);
      ctx.stroke();
      ctx.fillStyle = '#222';
      ctx.font = '600 26px sans-serif';
      ctx.fillText('今天打工回血了吗？', contentX, footerY + 48);
      ctx.fillStyle = '#777';
      ctx.font = '22px sans-serif';
      ctx.fillText('看看你的牛马进度条', contentX, footerY + 84);
      const qrSize = 120;
      const qrX = contentX + contentW - qrSize;
      const qrY = footerY + 24;
      ctx.strokeStyle = '#B5B5B5';
      ctx.lineWidth = 2;
      this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#999';
      ctx.font = '20px sans-serif';
      ctx.fillText('小程序码', qrX + 20, qrY + 66);
    });
  },
  drawMetricCard(ctx, x, y, w, h, label, value) {
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.strokeStyle = '#EFEAE0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#777';
    ctx.font = '24px sans-serif';
    ctx.fillText(label, x + 24, y + 42);
    ctx.fillStyle = '#111';
    this.wrapTextLines(ctx, value || '-', x + 24, y + 88, w - 48, 36, 1, '700 34px sans-serif');
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
  wrapTextLines(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2, font = '24px sans-serif', minFont = 16) {
    ctx.font = font;
    const lines = [];
    let line = '';
    for (let i = 0; i < text.length; i += 1) {
      const testLine = line + text[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = text[i];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    const drawLines = lines.slice(0, maxLines);
    drawLines.forEach((item, idx) => { ctx.fillText(item, x, y + (idx * lineHeight)); });
    return drawLines.length;
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
