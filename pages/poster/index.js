const { getTodayMetrics } = require('../../utils/day-store');
const { buildPosterContent, seededPick } = require('../../utils/poster-content');

const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1100;
const MAIN_STATUS_FALLBACK_POOL = ['状态拉满中', '稳定推进中', '专注营业中', '稳步搬砖中', '节奏在线中'];

Page({
  data: { posterImagePath: '' },
  onLoad() {
    this.generatePoster();
  },
  generatePoster() {
    const metrics = getTodayMetrics(Date.now());
    const posterContent = buildPosterContent(metrics);
    if ((posterContent.mainStatusText || '').length > 6) {
      const dateSeed = metrics.dateKey || new Date().toISOString().slice(0, 10);
      posterContent.mainStatusText = seededPick(MAIN_STATUS_FALLBACK_POOL, `${dateSeed}:main-fallback`);
    }

    const query = wx.createSelectorQuery().in(this);
    query.select('#posterCanvas').fields({ node: true }).exec((res) => {
      const nodeInfo = res && res[0];
      if (!nodeInfo || !nodeInfo.node) return;

      const canvas = nodeInfo.node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
      canvas.width = POSTER_WIDTH * dpr;
      canvas.height = POSTER_HEIGHT * dpr;
      ctx.scale(dpr, dpr);

      this.drawPoster(ctx, canvas, posterContent, dpr);
    });
  },
  drawPoster(ctx, canvas, content, dpr) {
    ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
    ctx.fillStyle = '#FFF8E8';
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    const bg = canvas.createImage();
    bg.onload = () => {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.drawImage(bg, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
      ctx.restore();
      this.drawPosterLayers(ctx, content);
      this.exportPoster(canvas, dpr);
    };
    bg.onerror = () => {
      this.drawPosterLayers(ctx, content);
      this.exportPoster(canvas, dpr);
    };
    bg.src = '/assets/poster/poster-bg.png';
  },
  drawPosterLayers(ctx, c) {
    const mainX = 45;
    const mainY = 35;
    const mainW = 660;
    const mainH = 1030;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    this.drawRoundRect(ctx, mainX, mainY, mainW, mainH, 36, '#FFFDF8');
    ctx.restore();

    this.drawRoundRect(ctx, 70, 62, 610, 92, 24, '#FFFAED', '#121212');
    this.drawRoundRect(ctx, 80, 72, 12, 72, 6, '#F2D34F');
    this.drawTextBox(ctx, '赚了么', 104, 104, 260, { fontSize: 56, fontWeight: 900, color: '#111', maxLines: 1 });
    this.drawRoundRect(ctx, 104, 124, 180, 9, 5, '#F2D34F');
    this.drawPill(ctx, '老板可见版', 515, 82, 145, 50);
    this.drawHandDrawSpark(ctx, 486, 95, 12, '#111');

    this.drawTextBox(ctx, '今日打工状态', 75, 205, 300, { fontSize: 32, fontWeight: 800, color: '#222' });
    this.drawRoundRect(ctx, 70, 225, 610, 182, 26, '#FFFFFF', '#1A1A1A');
    this.drawTextBox(ctx, c.mainStatusText, 95, 295, 560, { fontSize: 88, fontWeight: 900, color: '#111', lineHeight: 92, maxLines: 1, ellipsis: true });
    this.drawTextBox(ctx, c.conclusion, 95, 356, 540, { fontSize: 30, color: '#4A4A4A', lineHeight: 42, maxLines: 1, ellipsis: true });
    this.drawRoundRect(ctx, 95, 385, 170, 8, 4, '#F2D34F');
    this.drawHandDrawSpark(ctx, 650, 280, 14, '#111');

    this.drawRoundRect(ctx, 70, 435, 610, 210, 28, '#FFE56A', '#111');
    this.drawRoundRect(ctx, 88, 455, 574, 170, 20, 'rgba(255,255,255,0.25)');
    this.drawTextBox(ctx, '🏆 今日战果', 255, 490, 240, { fontSize: 34, fontWeight: 900, color: '#111', align: 'center' });
    const rewardFontSize = (c.battleRewardText || '').length > 10 ? 40 : 46;
    const rewardLineHeight = (c.battleRewardText || '').length > 10 ? 50 : 56;
    this.drawTextBox(ctx, c.battleRewardText, 112, 570, 526, { fontSize: rewardFontSize, fontWeight: 900, color: '#111', lineHeight: rewardLineHeight, maxLines: 2, align: 'center', ellipsis: true });
    this.drawHandDrawSpark(ctx, 110, 510, 11, '#111');
    this.drawHandDrawSpark(ctx, 640, 600, 11, '#111');

    [70, 280, 490].forEach((x, idx) => {
      this.drawRoundRect(ctx, x, 680, 190, 170, 24, '#FFFFFF', '#E0D5BD');
      if (idx === 0) this.drawRoundRect(ctx, x + 12, 694, 28, 8, 4, '#F2D34F');
      if (idx === 1) this.drawRoundRect(ctx, x + 12, 694, 28, 8, 4, '#111');
      if (idx === 2) this.drawRoundRect(ctx, x + 12, 694, 28, 8, 4, '#F2D34F');
    });

    this.drawTextBox(ctx, '当前状态', 70, 730, 190, { fontSize: 24, color: '#666', align: 'center' });
    this.drawTextBox(ctx, c.currentStatusText, 70, 800, 190, { fontSize: 42, fontWeight: 900, color: '#111', align: 'center', maxLines: 2, lineHeight: 46, ellipsis: true });

    this.drawTextBox(ctx, '摸鱼指数', 280, 730, 190, { fontSize: 24, color: '#666', align: 'center' });
    const fishingSize = String(c.fishingIndexText || '').length > 6 ? 36 : 42;
    this.drawTextBox(ctx, c.fishingIndexText, 280, 800, 190, { fontSize: fishingSize, fontWeight: 900, color: '#111', align: 'center', maxLines: 1, ellipsis: true });

    this.drawTextBox(ctx, '钱包伤害', 490, 730, 190, { fontSize: 24, color: '#666', align: 'center' });
    this.drawTextBox(ctx, c.walletDamageText, 490, 800, 190, { fontSize: 42, fontWeight: 900, color: '#111', align: 'center', maxLines: 2, lineHeight: 46, ellipsis: true });

    this.drawRoundRect(ctx, 70, 885, 610, 145, 26, '#FFFDF8', '#111', [8, 8]);
    this.drawTextBox(ctx, '📣', 98, 948, 50, { fontSize: 42, maxLines: 1 });
    this.drawTextBox(ctx, c.ctaTitle, 160, 936, 340, { fontSize: 36, fontWeight: 900, color: '#111', maxLines: 1, ellipsis: true });
    this.drawTextBox(ctx, c.ctaSubtitle, 160, 980, 340, { fontSize: 24, color: '#666', maxLines: 1, ellipsis: true });

    this.drawRoundRect(ctx, 555, 905, 105, 105, 16, '#FFFDF8', '#999', [6, 6]);
    this.drawTextBox(ctx, '小程序码', 555, 970, 105, { fontSize: 20, color: '#999', align: 'center', maxLines: 1 });
  },
  drawHandDrawSpark(ctx, x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color || '#111';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size * 0.65, y - size * 0.65);
    ctx.lineTo(x + size * 0.65, y + size * 0.65);
    ctx.moveTo(x + size * 0.65, y - size * 0.65);
    ctx.lineTo(x - size * 0.65, y + size * 0.65);
    ctx.stroke();
    ctx.restore();
  },
  exportPoster(canvas, dpr) {
    wx.canvasToTempFilePath({
      canvas,
      destWidth: POSTER_WIDTH * dpr,
      destHeight: POSTER_HEIGHT * dpr,
      success: (result) => this.setData({ posterImagePath: result.tempFilePath })
    }, this);
  },
  drawRoundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, dash) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      if (Array.isArray(dash)) ctx.setLineDash(dash);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (Array.isArray(dash)) ctx.setLineDash([]);
    }
    ctx.restore();
  },
  drawTextBox(ctx, text, x, y, maxWidth, options = {}) {
    const { fontSize = 30, fontWeight = 400, color = '#111', lineHeight = Math.round(fontSize * 1.3), maxLines = 1, align = 'left', ellipsis = false } = options;
    const raw = String(text || '');
    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = align;

    const lines = [];
    let current = '';
    for (let i = 0; i < raw.length; i += 1) {
      const ch = raw[i];
      const next = current + ch;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);

    let output = lines.slice(0, maxLines);
    if (ellipsis && lines.length > maxLines && output.length) {
      let last = output[output.length - 1];
      while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      output[output.length - 1] = `${last}…`;
    }

    output.forEach((line, idx) => {
      const drawX = align === 'center' ? x + (maxWidth / 2) : x;
      const drawY = y + idx * lineHeight;
      ctx.fillText(line, drawX, drawY, maxWidth);
    });
    ctx.restore();
  },
  drawPill(ctx, text, x, y, w, h) {
    this.drawRoundRect(ctx, x, y, w, h, 25, '#F2D34F');
    this.drawTextBox(ctx, text, x, y + (h / 2) + 1, w, { fontSize: 24, fontWeight: 700, color: '#111', align: 'center', maxLines: 1 });
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
