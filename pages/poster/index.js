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
    ctx.fillStyle = '#FFFDF8';
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

    this.drawTextBox(ctx, '赚了么', 75, 105, 220, { fontSize: 56, fontWeight: 900, color: '#111111', maxLines: 1 });
    this.drawHandUnderline(ctx, 76, 130, 172, '#F2D34F');
    this.drawTextBox(ctx, '✦', 258, 96, 20, { fontSize: 22, color: '#F2D34F' });
    this.drawPill(ctx, '老板可见版', 504, 72, 156, 50);

    this.drawTextBox(ctx, '今日打工状态', 75, 190, 300, { fontSize: 32, fontWeight: 800, color: '#111111' });
    this.drawTextBox(ctx, c.mainStatusText, 75, 282, 600, { fontSize: 92, fontWeight: 900, color: '#111111', lineHeight: 94, maxLines: 1, ellipsis: true });
    this.drawHandUnderline(ctx, 78, 320, 272, '#F2D34F');
    this.drawTextBox(ctx, c.conclusion, 75, 370, 590, { fontSize: 30, color: '#666666', lineHeight: 42, maxLines: 2, ellipsis: true });

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    this.drawRoundRect(ctx, 70, 448, 610, 188, 26, '#F2D34F', '#E3C240');
    ctx.restore();
    this.drawTextBox(ctx, '✦ 今日战果', 102, 495, 220, { fontSize: 28, fontWeight: 800, color: '#111111', maxLines: 1 });
    const rewardFontSize = (c.battleRewardText || '').length > 10 ? 46 : 52;
    this.drawTextBox(ctx, c.battleRewardText, 102, 568, 500, { fontSize: rewardFontSize, fontWeight: 900, color: '#111111', lineHeight: 56, maxLines: 2, ellipsis: true });
    this.drawTextBox(ctx, '🏆', 612, 502, 44, { fontSize: 34, align: 'center' });
    this.drawTextBox(ctx, '✨', 610, 548, 44, { fontSize: 26, align: 'center' });

    const cardXs = [70, 280, 490];
    cardXs.forEach((x) => this.drawRoundRect(ctx, x, 660, 190, 170, 22, '#FFFFFF', '#E9DFC7'));

    this.drawTextBox(ctx, '🪪', 86, 698, 30, { fontSize: 24 });
    this.drawTextBox(ctx, '当前状态', 70, 718, 190, { fontSize: 23, color: '#666666', align: 'center' });
    this.drawTextBox(ctx, c.currentStatusText, 70, 786, 190, { fontSize: 40, fontWeight: 900, color: '#111111', align: 'center', maxLines: 2, lineHeight: 44, ellipsis: true });

    this.drawTextBox(ctx, '🕒', 296, 698, 30, { fontSize: 24 });
    this.drawTextBox(ctx, '摸鱼指数', 280, 718, 190, { fontSize: 23, color: '#666666', align: 'center' });
    const fishingSize = String(c.fishingIndexText || '').length > 6 ? 34 : 42;
    this.drawTextBox(ctx, c.fishingIndexText, 280, 786, 190, { fontSize: fishingSize, fontWeight: 900, color: '#111111', align: 'center', maxLines: 1, ellipsis: true });

    this.drawTextBox(ctx, '🛡', 506, 698, 30, { fontSize: 24 });
    this.drawTextBox(ctx, '钱包伤害', 490, 718, 190, { fontSize: 23, color: '#666666', align: 'center' });
    this.drawTextBox(ctx, c.walletDamageText, 490, 786, 190, { fontSize: 40, fontWeight: 900, color: '#111111', align: 'center', maxLines: 2, lineHeight: 44, ellipsis: true });

    this.drawRoundRect(ctx, 70, 875, 610, 155, 24, '#FFFDF8', '#E9DFC7');
    this.drawRoundRect(ctx, 84, 889, 408, 127, 18, '#FFFDF8', '#F2D34F', [8, 7]);
    this.drawTextBox(ctx, '📣', 102, 948, 46, { fontSize: 38, maxLines: 1 });
    this.drawTextBox(ctx, c.ctaTitle, 154, 934, 330, { fontSize: 36, fontWeight: 900, color: '#111111', maxLines: 1, ellipsis: true });
    this.drawTextBox(ctx, `→ ${c.ctaSubtitle}`, 154, 978, 330, { fontSize: 24, color: '#666666', maxLines: 1, ellipsis: true });

    this.drawRoundRect(ctx, 520, 900, 140, 110, 18, '#FFFFFF', '#D4D4D4', [6, 6]);
    this.drawTextBox(ctx, '小程序码', 520, 968, 140, { fontSize: 20, color: '#999', align: 'center', maxLines: 1 });
  },
  drawHandUnderline(ctx, x, y, w, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.4, y + 7, x + w * 0.75, y + 1);
    ctx.quadraticCurveTo(x + w * 0.9, y - 2, x + w, y + 2);
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
