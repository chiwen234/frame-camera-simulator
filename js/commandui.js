/* =========================================================
   FRAME — 指挥中心（钢铁雄心式全屏布局）
   左上：公司徽章 → 点开公司总览
   顶部：横排矢量图标，点一个开一个，点另一个自动关掉
   中央：WebGL 三维地球 + 市场份额
   ========================================================= */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function money(v) {
    const n = Number(v) || 0, a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 100000000) return s + (a / 100000000).toFixed(2) + '亿';
    if (a >= 10000) return s + Math.round(a / 10000).toLocaleString('zh-CN') + '万';
    return s + Math.round(a).toLocaleString('zh-CN');
  }
  const I = () => window.FrameIcons;

  const RAIL = [
    { page: 'overview', icon: 'company', label: '公司', hint: '公司总览' },
    { page: 'focus', icon: 'decisions', label: '决策', hint: '战略决策树' },
    { page: 'diplomacy', icon: 'diplomacy', label: '外交', hint: '垄断 / 封锁 / 结盟' },
    { page: 'market', icon: 'market', label: '市场', hint: '份额与竞品' },
    { page: 'chips', icon: 'chips', label: '芯片', hint: 'CMOS / 对焦芯片' },
    { page: 'research', icon: 'research', label: '研发', hint: '技术树' },
    { page: 'operations', icon: 'operations', label: '运营', hint: '供应链与团队' },
    { page: 'finance', icon: 'finance', label: '财务', hint: '现金流与融资' },
    { page: 'products', icon: 'products', label: '产品', hint: '产品矩阵' },
    { page: 'design', icon: 'design', label: '设计', hint: '设计工作室' },
    { page: 'launch', icon: 'launch', label: '发布', hint: '发布会' },
    { page: 'news', icon: 'doc', label: '新闻', hint: '新闻档案' },
    { page: 'advisor', icon: 'crown', label: '顾问', hint: '顾问团队' },
    { page: 'staff', icon: 'factory', label: '员工', hint: '员工与团队' },
    { page: 'settings', icon: 'gear', label: '菜单', hint: '设置与存档' }
  ];

  function ensureCSS() {
    if (document.getElementById('cmd-css')) return;
    const el = document.createElement('style');
    el.id = 'cmd-css';
    el.textContent = `
.cmd{position:relative;height:calc(100vh - 96px);min-height:560px;overflow:hidden;background:#080807;border:1px solid #3a3226}
.cmd-stage{position:absolute;inset:0;background:#080807 url(assets/art/bg-command.png) center/cover no-repeat;background-blend-mode:normal}
.cmd-stage::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(8,8,7,.45) 0%,rgba(8,8,7,.92) 75%);pointer-events:none}
#cmd-globe,#cmd-globe-ov{position:absolute;inset:0;width:100%;height:100%;display:block}
#cmd-globe-ov{pointer-events:none}
.cmd-top{position:absolute;left:0;right:0;top:0;height:34px;display:flex;align-items:stretch;background:linear-gradient(180deg,#191510,#12100c);border-bottom:1px solid #3a3226;z-index:6}
.cmd-top .res{display:flex;align-items:center;gap:6px;padding:0 11px;border-right:1px solid #241f18;font-size:10px;color:#8d8677;white-space:nowrap}
.cmd-top .res b{color:#e8dfc9;font-size:12px;font-variant-numeric:tabular-nums}
.cmd-top .res b.gold{color:#d8a65a}
.cmd-top .spacer{flex:1}
.cmd-top .date{padding:0 11px;border-left:1px solid #241f18;display:flex;align-items:center;font-size:10px;color:#a99c82;font-variant-numeric:tabular-nums}
.cmd-brand{position:absolute;left:10px;top:42px;z-index:40;width:44px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border:1px solid #4a4034;background:linear-gradient(180deg,#1d1913,#12100c);padding:7px 9px 5px}
.cmd-brand:hover{border-color:#d8a65a}
.cmd-brand .nm{font-size:9px;letter-spacing:.1em;color:#c9bfa8}
.cmd-bar{display:flex;gap:1px;align-items:center;padding:0 4px;border-left:1px solid #241f18}
.cmd-btn{width:38px;height:30px;display:flex;align-items:center;justify-content:center;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer;color:#8d8677}
.cmd-btn:hover{background:rgba(216,166,90,.08)}
.cmd-btn.is-active{background:rgba(216,166,90,.14);border-bottom-color:#d8a65a}
.cmd-btn .lb{display:none}
.cmd-btn:hover .lb{opacity:1}
.cmd-panel{position:absolute;left:64px;right:0;top:34px;bottom:0;background:#0e0c09;border-top:1px solid #d8a65a;border-left:1px solid #3a3226;overflow-y:auto;overflow-x:hidden;display:none;z-index:30}
.cmd-panel.is-open{display:block}
.cmd-panel-bar{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:10px;padding:6px 12px;background:#171310;border-bottom:1px solid #3a3226}
.cmd-panel-bar .t{font-size:11px;letter-spacing:.12em;color:#e8dfc9}
.cmd-panel-bar .s{font-size:9px;color:#7d7466}
.cmd-panel-bar .x{margin-left:auto;width:22px;height:20px;border:1px solid #4a4034;background:#221c15;color:#b9ae98;cursor:pointer;font-size:12px;line-height:17px;text-align:center}
.cmd-panel-bar .x:hover{border-color:#d8a65a;color:#f0e2c0}
.cmd-zoom{position:absolute;right:10px;bottom:12px;z-index:6;display:flex;display:flex;flex-direction:column;gap:1px}
.cmd-zoom button{width:24px;height:22px;border:1px solid #4a4034;background:#171310;color:#b9ae98;cursor:pointer;font-size:12px;line-height:1}
.cmd-zoom button:hover{border-color:#d8a65a;color:#f0e2c0}
.cmd-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font-size:9px;color:#5f584c;letter-spacing:.08em;z-index:4;pointer-events:none}
.cmd-legend{position:absolute;left:8px;bottom:12px;z-index:4;font-size:9px;color:#8d8677;background:rgba(10,9,7,.8);border:1px solid #2b251c;padding:5px 8px;line-height:1.7;pointer-events:none}
.cmd-legend i{display:inline-block;width:14px;height:6px;margin-right:4px;vertical-align:middle;border:1px solid #4a4034}
`;
    document.head.appendChild(el);
  }

  function renderCommandPage(game) {
    ensureCSS();
    const ICO = I();
    const snap = game.market && game.market.snapshot;
    const regions = (snap && snap.regions && snap.regions.regions) || [];
    const share = snap ? snap.playerShare : 0;
    const best = regions.slice().sort((a, b) => b.playerShare - a.playerShare)[0];
    const worst = regions.slice().sort((a, b) => a.playerShare - b.playerShare)[0];
    const f = game.focus || {};
    const c = game.company;
    const date = game.clock ? (game.clock.year + ' 年 ' + game.clock.month + ' 月') : '';

    const barHtml = () => RAIL.slice(1).map(r => `
      <button class="cmd-btn" data-action="cmd-open" data-page="${r.page}" title="${esc(r.hint)}">
        ${ICO.svgEmblem(r.icon, 22, '#a99c82', false)}
      </button>`).join('');
    const top = `
      <div class="cmd-top">
        <div class="res">现金 <b>${money(c.cash)}</b></div>
        <div class="res">全球份额 <b class="gold">${Number(share).toFixed(1)}%</b></div>
        <div class="res">决策点 <b>${Math.round(f.fp || 0)}</b></div>
        <div class="res">政治资本 <b>${Math.round(f.pc || 0)}</b></div>
        <div class="res">口碑 <b>${Math.round(c.reputation)}</b></div>
        <div class="res">认知 <b>${Math.round(c.awareness)}</b></div>
        <div class="res">最强区 <b>${best ? esc(best.short) : '—'}</b></div>
        <div class="res">最弱区 <b>${worst ? esc(worst.short) : '—'}</b></div>
        <div class="spacer"></div>
        <div class="cmd-bar">${barHtml()}</div>
        <div class="date">${esc(date)}</div>
      </div>`;

    const brand = `
      <button class="cmd-brand" data-action="cmd-open" data-page="overview" title="公司总览">
        ${ICO.svgEmblem('company', 30, c.color, false)}
        <span class="nm">${esc(c.short || c.name)}</span>
      </button>`;


    return `<div class="cmd">
      <div class="cmd-stage">
        <canvas id="cmd-globe"></canvas>
        <canvas id="cmd-globe-ov"></canvas>
      </div>
      ${top}
      ${brand}
      <div class="cmd-legend">
        <div><i style="background:#4a5638"></i>份额低</div>
        <div><i style="background:#8c8a46"></i>中游</div>
        <div><i style="background:#c8b24a"></i>领先</div>
      </div>
      <div class="cmd-zoom">
        <button data-action="cmd-zoom" data-d="in" title="放大">+</button>
        <button data-action="cmd-zoom" data-d="out" title="缩小">−</button>
        <button data-action="cmd-zoom" data-d="reset" title="复位">◦</button>
      </div>
      <div class="cmd-hint">拖动旋转 · 滚轮缩放</div>
      <div class="cmd-panel" id="cmd-panel">
        <div class="cmd-panel-bar">
          <span class="t" id="cmd-panel-title"></span>
          <span class="s" id="cmd-panel-sub"></span>
          <button class="x" data-action="cmd-close" title="关闭">×</button>
        </div>
        <div id="cmd-panel-body"></div>
      </div>
    </div>`;
  }

  function openPanel(page) {
    const panel = document.getElementById('cmd-panel');
    const body = document.getElementById('cmd-panel-body');
    if (!panel || !body) return;
    if (panel.classList.contains('is-open') && panel.dataset.page === page) { closePanel(); return; }

    const meta = RAIL.find(r => r.page === page) || { label: page, hint: '' };
    const render = window.__FRAME_RENDER_PAGE__;
    let html = '';
    try { html = render ? render(page) : '<div class="empty-inline">面板未就绪</div>'; }
    catch (e) { html = '<div class="empty-inline">渲染失败：' + esc(e.message) + '</div>'; }
    body.innerHTML = html;
    document.getElementById('cmd-panel-title').textContent = meta.label;
    document.getElementById('cmd-panel-sub').textContent = meta.hint || '';
    panel.dataset.page = page;
    panel.classList.add('is-open');
    panel.scrollTop = 0;
    panel.scrollLeft = 0;
    document.querySelectorAll('.cmd-btn').forEach(b => b.classList.toggle('is-active', b.dataset.page === page));
    if (page === 'focus' && window.FocusUI && window.FocusUI.mount) window.FocusUI.mount();
  }

  function closePanel() {
    const panel = document.getElementById('cmd-panel');
    if (panel) { panel.classList.remove('is-open'); panel.dataset.page = ''; }
    const body = document.getElementById('cmd-panel-body');
    if (body) body.innerHTML = '';
    document.querySelectorAll('.cmd-btn').forEach(b => b.classList.remove('is-active'));
  }

  function mountGlobe(game) {
    const canvas = document.getElementById('cmd-globe');
    const overlay = document.getElementById('cmd-globe-ov');
    if (!canvas) return null;
    if (window.__CMD_GLOBE__) { try { window.__CMD_GLOBE__.stop(); } catch (e) {} window.__CMD_GLOBE__ = null; }
    if (!window.FrameGlobe3D) return null;
    let g = null;
    try { g = window.FrameGlobe3D.createGlobe3D(canvas, overlay, game); } catch (e) { console.error('globe3d init', e); }
    if (!g) return null;
    g.start();

    let dragging = false;
    canvas.addEventListener('pointerdown', e => { dragging = true; g.dragStart(e.clientX, e.clientY); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (dragging) g.dragMove(e.clientX, e.clientY); });
    canvas.addEventListener('pointerup', () => { dragging = false; g.dragEnd(); });
    canvas.addEventListener('pointercancel', () => { dragging = false; g.dragEnd(); });
    canvas.addEventListener('wheel', e => { e.preventDefault(); g.zoomBy(e.deltaY > 0 ? 0.92 : 1.08); }, { passive: false });
    window.addEventListener('resize', () => g.resize());
    window.__CMD_GLOBE__ = g;
    return g;
  }

  window.CommandUI = { renderCommandPage, openPanel, closePanel, mountGlobe, ensureCSS, RAIL };
})();
