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
        mainStatusText: metrics.mainStatusText || metrics.personality || '稳定续命中',
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
      const width = res[0].width;
      const height = res[0].height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#f3f1ec';
      ctx.fillRect(0, 0, width, height);
      const cardX = 24;
      const cardY = 24;
      const cardW = width - 48;
      const cardH = height - 48;
      ctx.fillStyle = '#fffdf8';
      this.roundRect(ctx, cardX, cardY, cardW, cardH, 18);
      ctx.fill();
      let y = cardY + 52;

      // 1. 顶部品牌区
      ctx.fillStyle = '#111';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('赚了么', cardX + 28, y);
      ctx.fillStyle = '#ffd23f';
      const badgeW = 190;
      const badgeH = 36;
      this.roundRect(ctx, cardX + cardW - badgeW - 28, y - 28, badgeW, badgeH, 18);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = '18px sans-serif';
      ctx.fillText('老板可见安全版', cardX + cardW - badgeW - 14, y - 5);
      // 2. 主状态区
      y += 48;
      ctx.fillStyle = '#222';
      ctx.font = '22px sans-serif';
      ctx.fillText('今日打工副本结算', cardX + 28, y);
      y += 34;
      ctx.fillStyle = '#111';
      const mainStatusLines = this.wrapTextLines(ctx, metrics.mainStatusText, cardX + 28, y, cardW - 56, 54, 2, 'bold 50px sans-serif', 38);
      y += mainStatusLines * 54;
      // 3. 一句话点评
      ctx.fillStyle = '#444';
      const commentLines = this.wrapTextLines(ctx, metrics.conclusion, cardX + 28, y + 8, cardW - 56, 30, 2, '22px sans-serif', 22);
      y += (commentLines * 30) + 28;
      // 4. 今日战果卡
      ctx.fillStyle = '#fff7d8';
      this.roundRect(ctx, cardX + 24, y, cardW - 48, 126, 16);
      ctx.fill();
      ctx.fillStyle = '#7a5a00';
      ctx.font = '18px sans-serif';
      ctx.fillText('今日战果', cardX + 44, y + 30);
      ctx.fillStyle = '#111';
      this.wrapTextLines(ctx, metrics.battleRewardText, cardX + 44, y + 64, cardW - 88, 36, 2, 'bold 32px sans-serif', 24);
      y += 146;
      // 5. 指标区
      const cards = [
        { label: '当前状态', value: metrics.currentStatus },
        { label: '摸鱼指数', value: `${metrics.fishingIndex}/100` },
        { label: '精神损耗', value: `${metrics.mentalLoss}/100` },
        { label: '钱包伤害', value: metrics.walletDamageText }
      ];
      const colW = (cardW - 64) / 2;
      cards.forEach((item, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const x = cardX + 24 + col * (colW + 16);
        const cardYPos = y + row * 90;
        ctx.fillStyle = '#fff';
        this.roundRect(ctx, x, cardYPos, colW, 78, 12);
        ctx.fill();
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.font = '16px sans-serif';
        ctx.fillText(item.label, x + 14, cardYPos + 26);
        this.wrapTextLines(ctx, item.value, x + 14, cardYPos + 55, colW - 28, 24, 1, 'bold 22px sans-serif', 16);
      });
      y += 194;
      // 6. 底部引导区
      ctx.strokeStyle = '#ece7dd';
      ctx.beginPath();
      ctx.moveTo(cardX + 24, y);
      ctx.lineTo(cardX + cardW - 24, y);
      ctx.stroke();
      y += 28;
      ctx.fillStyle = '#111';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('今天打工回血了吗？', cardX + 28, y);
      ctx.fillStyle = '#666';
      ctx.font = '18px sans-serif';
      ctx.fillText('长按识别，看看你的牛马进度条', cardX + 28, y + 30);
      const qrSize = 98;
      const qrX = cardX + cardW - qrSize - 30;
      const qrY = y - 20;
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.fillText('小程序码', qrX + 20, qrY + 56);
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
