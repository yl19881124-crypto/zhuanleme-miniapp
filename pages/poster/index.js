const { getTodayMetrics } = require('../../utils/day-store');
const { buildPosterContent } = require('../../utils/poster-content');

const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1100;

Page({
  data: { posterImagePath: '' },
  onLoad() {
    console.log('[poster] onLoad');
    this.generatePoster();
  },
  generatePoster() {
    const metrics = getTodayMetrics(Date.now());
    const posterContent = buildPosterContent(metrics);
    console.log('[poster] content', posterContent);

    const query = wx.createSelectorQuery().in(this);
    query.select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
      const nodeInfo = res && res[0];
      if (!nodeInfo || !nodeInfo.node) {
        console.error('[poster] canvas node not found', res);
        return;
      }
      const canvas = nodeInfo.node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
      canvas.width = POSTER_WIDTH * dpr;
      canvas.height = POSTER_HEIGHT * dpr;
      ctx.scale(dpr, dpr);

      const bg = canvas.createImage();
      bg.onload = () => {
        console.log('[poster] bg loaded');
        ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
        ctx.drawImage(bg, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
        this.drawPosterTexts(ctx, posterContent);
        wx.canvasToTempFilePath({
          canvas,
          destWidth: POSTER_WIDTH * dpr,
          destHeight: POSTER_HEIGHT * dpr,
          success: (result) => {
            console.log('[poster] export success', result.tempFilePath);
            this.setData({ posterImagePath: result.tempFilePath });
          },
          fail: (err) => {
            console.error('[poster] canvas export fail', err);
          }
        }, this);
      };
      bg.onerror = (err) => console.error('[poster] bg load error', err);
      bg.src = '/assets/poster/poster-bg.png';
    });
  },
  drawPosterTexts(ctx, c) {
    const black = '#111';
    this.drawTextBox(ctx, '赚了么', 60, 95, 220, { fontSize: 50, fontWeight: 900, color: black, maxLines: 1 });
    this.drawTextBox(ctx, '老板可见版', 555, 85, 170, { fontSize: 26, fontWeight: 700, color: black, maxLines: 1 });

    this.drawTextBox(ctx, '今日打工状态', 60, 180, 260, { fontSize: 34, fontWeight: 700, color: black, maxLines: 1 });
    this.drawTextBox(ctx, c.mainStatusText, 60, 265, 630, { fontSize: 74, fontWeight: 900, color: black, lineHeight: 82, maxLines: 1, ellipsis: true, autoShrink: true, minFontSize: 64 });
    this.drawTextBox(ctx, c.conclusion, 60, 350, 610, { fontSize: 30, color: black, lineHeight: 42, maxLines: 2, ellipsis: true });

    this.drawTextBox(ctx, '今日战果', 375, 462, 200, { fontSize: 32, fontWeight: 800, color: black, align: 'center', maxLines: 1 });
    const rewardFontSize = c.battleRewardText.length > 10 ? 38 : 44;
    const rewardLineHeight = c.battleRewardText.length > 10 ? 48 : 54;
    this.drawTextBox(ctx, c.battleRewardText, 155, 535, 470, { fontSize: rewardFontSize, fontWeight: 900, color: black, lineHeight: rewardLineHeight, maxLines: 2, ellipsis: true, autoShrink: true, minFontSize: 34 });

    this.drawTextBox(ctx, '当前状态', 70, 690, 170, { fontSize: 24, align: 'center', maxLines: 1 });
    this.drawTextBox(ctx, c.currentStatusText, 70, 760, 170, { fontSize: 42, fontWeight: 900, align: 'center', maxLines: 2, lineHeight: 46, autoShrink: true, minFontSize: 34 });

    this.drawTextBox(ctx, '摸鱼指数', 285, 690, 170, { fontSize: 24, align: 'center', maxLines: 1 });
    this.drawTextBox(ctx, c.fishingIndexText, 285, 760, 170, { fontSize: 40, fontWeight: 900, align: 'center', maxLines: 1, autoShrink: true, minFontSize: 36 });

    this.drawTextBox(ctx, '钱包伤害', 500, 690, 170, { fontSize: 24, align: 'center', maxLines: 1 });
    this.drawTextBox(ctx, c.walletDamageText, 500, 760, 170, { fontSize: 38, fontWeight: 900, align: 'center', maxLines: 2, lineHeight: 44, autoShrink: true, minFontSize: 32 });

    this.drawTextBox(ctx, c.ctaTitle, 140, 910, 360, { fontSize: 36, fontWeight: 900, maxLines: 1, ellipsis: true, autoShrink: true, minFontSize: 28 });
    this.drawTextBox(ctx, c.ctaSubtitle, 140, 955, 360, { fontSize: 24, maxLines: 1, ellipsis: true, autoShrink: true, minFontSize: 20 });
    this.drawTextBox(ctx, '小程序码', 630, 940, 140, { fontSize: 22, color: '#999', align: 'center', maxLines: 1 });
  },
  drawTextBox(ctx, text, x, y, maxWidth, options = {}) {
    const { fontSize = 30, minFontSize = 24, fontWeight = 400, color = '#111', lineHeight = Math.round(fontSize * 1.3), maxLines = 1, align = 'left', ellipsis = false, autoShrink = false } = options;
    let size = fontSize;
    const raw = String(text || '');
    const setFont = () => { ctx.font = `${fontWeight} ${size}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; };

    const buildLines = () => {
      setFont();
      const lines = []; let line = '';
      for (let i = 0; i < raw.length; i += 1) {
        const next = line + raw[i];
        if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = raw[i]; } else { line = next; }
      }
      if (line) lines.push(line);
      return lines;
    };

    let lines = buildLines();
    while (autoShrink && size > minFontSize && (lines.length > maxLines || lines.some((line) => ctx.measureText(line).width > maxWidth))) {
      size -= 1;
      lines = buildLines();
    }

    let output = lines.slice(0, maxLines);
    if (ellipsis && lines.length > maxLines && output.length) {
      let last = output[output.length - 1];
      while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      output[output.length - 1] = `${last}…`;
    }

    setFont();
    output.forEach((line, idx) => {
      const drawX = align === 'center' ? x + (maxWidth / 2) : x;
      ctx.fillText(line, drawX, y + idx * lineHeight, maxWidth);
    });
    ctx.textAlign = 'left';
  },
  savePoster() {
    if (!this.data.posterImagePath) {
      wx.showToast({ title: '海报还没生成，请稍后再试', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImagePath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: (err) => {
        const denied = err && /auth|authorize|permission/i.test(err.errMsg || '');
        wx.showToast({ title: denied ? '请先打开相册权限' : '保存失败，请重试', icon: 'none' });
      }
    });
  },
  onShareAppMessage() { return { title: '我今天的牛马进度条已更新', path: '/pages/home/index' }; },
  goBack() { wx.navigateBack({ delta: 1 }); }
});
