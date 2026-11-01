/* =========================================================
   FRAME — 世界地图（战略图）与外交界面
   依赖：window.FRAME_DATA, window.GameEngine, window.FocusEngine, window.DiplomacyEngine
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const E = window.GameEngine;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function money(v) {
    const n = Number(v) || 0, a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 100000000) return s + '¥' + (a / 100000000).toFixed(2) + '亿';
    if (a >= 10000) return s + '¥' + Math.round(a / 10000).toLocaleString('zh-CN') + '万';
    return s + '¥' + Math.round(a).toLocaleString('zh-CN');
  }
  function pct(v) { return (Number(v) || 0).toFixed(1) + '%'; }
  function n(v) { return Number(v || 0).toLocaleString('zh-CN'); }

  /* ---------- styles ---------- */
  function ensureStyles() {
    if (document.getElementById('strategy-css')) return;
    const css = `
.map-layout{display:grid;grid-template-columns:1.45fr .85fr;gap:16px;margin-top:6px}
.map-stage{position:relative;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:
  radial-gradient(circle at 30% 30%,rgba(90,110,80,.10),transparent 60%),
  radial-gradient(circle at 70% 60%,rgba(70,90,110,.10),transparent 60%),
  rgba(255,255,255,.018);padding:12px;overflow:hidden}
.map-svg{display:block;width:100%;height:auto;min-height:420px}
.map-block{cursor:pointer;transition:opacity .15s}
.map-block:hover{opacity:.86}
.map-block .block-fill{stroke:rgba(255,255,255,.16);stroke-width:1;transition:stroke .15s}
.map-block.is-active .block-fill{stroke:#d8a65a;stroke-width:2}
.map-block text{pointer-events:none;font-family:var(--font-ui,sans-serif)}
.map-legend{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:9px;color:var(--faint,#7d8276);margin-top:8px}
.map-legend i{display:inline-block;width:22px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle}
.region-panel{border:1px solid rgba(216,166,90,.2);border-radius:14px;padding:14px 15px;background:rgba(216,166,90,.03)}
.region-panel h3{margin:2px 0 4px;font-size:16px}
.region-panel .sub{font-size:10px;color:var(--muted,#9aa093);line-height:1.7;margin-bottom:10px}
.region-kpi{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px}
.region-kpi div{min-width:64px}
.region-kpi label{display:block;font-size:9px;color:var(--faint,#7d8276);margin-bottom:3px}
.region-kpi b{font-size:15px;font-variant-numeric:tabular-nums}
.share-row{display:grid;grid-template-columns:9px 1fr 46px;gap:7px;align-items:center;margin-bottom:6px;font-size:10px}
.share-row .dot{width:9px;height:9px;border-radius:2px}
.share-row .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.share-row .nm.is-me{color:#d8a65a;font-weight:600}
.share-bar{grid-column:2;height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:2px}
.share-bar i{display:block;height:100%;border-radius:3px}
.share-val{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted,#9aa093)}
.diplo-layout{display:grid;grid-template-columns:.95fr 1.35fr;gap:16px;margin-top:6px}
.diplo-list{display:flex;flex-direction:column;gap:8px}
.diplo-card{border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:10px 12px;cursor:pointer;background:rgba(255,255,255,.025);transition:border-color .12s,background .12s}
.diplo-card:hover{border-color:rgba(216,166,90,.45)}
.diplo-card.is-active{border-color:#d8a65a;background:rgba(216,166,90,.07)}
.diplo-top{display:flex;align-items:center;gap:8px}
.diplo-dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.diplo-name{font-size:12px;font-weight:600}
.diplo-band{margin-left:auto;font-size:9px;padding:1px 6px;border-radius:4px;border:1px solid currentColor}
.attitude-meter{position:relative;height:6px;border-radius:3px;background:linear-gradient(90deg,#c85a4a,#d08a52 30%,#c8b06a 50%,#a9c97a 72%,#8fbf6a);margin-top:8px;opacity:.85}
.attitude-meter .pin{position:absolute;top:-3px;width:2px;height:12px;background:#fff;box-shadow:0 0 6px rgba(255,255,255,.8)}
.attitude-scale{display:flex;justify-content:space-between;font-size:8px;color:var(--faint,#7d8276);margin-top:3px}
.diplo-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
.diplo-tag{font-size:8px;padding:1px 5px;border-radius:3px;border:1px solid rgba(255,255,255,.16);color:var(--muted,#9aa093)}
.action-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:10px}
.action-card{border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 11px;background:rgba(255,255,255,.025);display:flex;flex-direction:column}
.action-card.is-locked{opacity:.52}
.action-card .an{font-size:11px;font-weight:600;display:flex;align-items:center;gap:6px}
.action-card .ad{font-size:9px;line-height:1.65;color:var(--muted,#9aa093);margin:6px 0 8px;flex:1}
.action-card .ac{font-size:9px;color:var(--faint,#7d8276);margin-bottom:8px}
.action-card .ac b{color:#d8a65a}
.diplo-log{margin-top:16px;border-top:1px dashed rgba(255,255,255,.1);padding-top:12px}
.log-item{font-size:10px;line-height:1.8;color:var(--muted,#9aa093);padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.055)}
.log-item b{color:#d8a65a}
.log-item .m{font-size:8px;color:var(--faint,#7d8276);margin-right:6px}
@media(max-width:1000px){.map-layout,.diplo-layout{grid-template-columns:1fr}}
`;
    const el = document.createElement('style');
    el.id = 'strategy-css';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ---------- 投影：经纬度 -> SVG 坐标（等距圆柱，北在上） ---------- */
  const MAP_W = 1000, MAP_H = 520, MAP_PAD = 14;
  function project(lon, lat) {
    const x = MAP_PAD + (lon + 180) / 360 * (MAP_W - MAP_PAD * 2);
    const y = MAP_PAD + (90 - lat) / 180 * (MAP_H - MAP_PAD * 2);
    return [x, y];
  }
  // 一条环线 -> SVG path；smooth 用二次贝塞尔把折线拉成海岸线
  function ringPath(ring, smooth) {
    if (!ring || !ring.length) return '';
    const pts = ring.map(p => project(p[0], p[1]));
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (smooth) {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        d += ' Q' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
      } else {
        d += ' L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
      }
    }
    return d + ' Z';
  }
  // 判断一个 geo 是「单个环」还是「环的数组」
  function geoRings(g) {
    if (!g || !g.length) return [];
    const first = g[0];
    const isRing = Array.isArray(first) && typeof first[0] === 'number';
    return isRing ? [g] : g;
  }
  function regionPaths(region, smooth) {
    const rings = geoRings(region.geo);
    if (!rings.length) return '';
    return rings.map(r => ringPath(r, smooth)).join(' ');
  }
  function regionCentroid(region) {
    const rings = geoRings(region.geo);
    if (!rings.length) return project(0, 0);
    // 用面积最大的一环算中心，避免小岛把标签拉偏
    let best = rings[0], bestArea = -1;
    rings.forEach(r => {
      let a = 0;
      for (let i = 0; i < r.length; i++) {
        const p1 = r[i], p2 = r[(i + 1) % r.length];
        a += p1[0] * p2[1] - p2[0] * p1[1];
      }
      a = Math.abs(a);
      if (a > bestArea) { bestArea = a; best = r; }
    });
    let sx = 0, sy = 0;
    best.forEach(p => { const q = project(p[0], p[1]); sx += q[0]; sy += q[1]; });
    return [sx / best.length, sy / best.length];
  }
  // 区域标签偏移（按大陆形状微调，避免文字互相覆盖）
  const LABEL_OFFSET = {
    north_america: [-10, -6],
    latin_america: [6, 10],
    europe: [4, -14],
    mea: [-6, 10],
    asia_pac: [58, 34],
    greater_china: [10, -26]
  };
  /* ---------- 世界地图 ---------- */
  function shadeFor(share, max) {
    const t = max > 0 ? Math.max(0, Math.min(1, share / Math.max(1, max))) : 0;
    // red (weak) -> amber -> green (strong)
    if (t < 0.5) {
      const k = t / 0.5;
      return blend('#6b3a30', '#8a6a2e', k);
    }
    const k = (t - 0.5) / 0.5;
    return blend('#8a6a2e', '#4f6f45', k);
  }
  function blend(a, b, t) {
    const pa = hex(a), pb = hex(b);
    const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
    return 'rgb(' + c.join(',') + ')';
  }
  function hex(h) {
    const s = h.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  function renderMapPage(game) {
    ensureStyles();
    const snap = game.market.snapshot;
    if (!snap || !snap.regions) return '<div class="empty-inline">还没有市场数据，先推进一月。</div>';
    const R = snap.regions;
    const selId = window.__MAP_SELECTED__ || (R.strongest ? R.strongest.id : R.regions[0].id);
    const sel = R.byId[selId] || R.regions[0];
    const maxShare = Math.max.apply(null, R.regions.map(r => r.playerShare));
    const totalDemand = R.regions.reduce((s, r) => s + r.demand, 0);

    const head = `<div class="page-head">
      <div class="page-head-main">
        <div class="eyebrow">WORLD MARKET / 世界地图</div>
        <h1 class="page-title">你在世界的哪一块地盘上赢？</h1>
        <p class="page-sub">全球需求被拆成六个市场，每个市场里七家厂商各自角力。颜色是你的份额高低：红=弱势，绿=强势。点一个区域看完整排名，也可以直接追加区域投入。</p>
      </div>
      <div class="page-actions">
        <span class="badge">全球份额 ${pct(R.playerShare)}</span>
        <span class="badge accent">${sel ? esc(sel.short) + ' ' + pct(sel.playerShare) : ''}</span>
      </div>
    </div>`;

    const blocks = R.regions
      .slice()
      .sort((a, b) => (a.id === 'greater_china' ? 1 : 0) - (b.id === 'greater_china' ? 1 : 0))
      .map(r => {
        const fill = shadeFor(r.playerShare, maxShare);
        const active = r.id === sel.id ? 'is-active' : '';
        const d = regionPaths(r, false);
        const c = regionCentroid(r);
        const off = LABEL_OFFSET[r.id] || [0, 0];
        const labelX = c[0] + off[0], labelY = c[1] + off[1];
        return `<g class="map-block ${active}" data-action="map-select" data-id="${esc(r.id)}">
          <path class="block-fill" d="${d}" fill="${fill}" fill-opacity=".86" stroke="rgba(255,255,255,.18)" stroke-width="1"></path>
          <text x="${labelX.toFixed(0)}" y="${(labelY - 10).toFixed(0)}" text-anchor="middle" fill="#f4f1e8" font-size="13" font-weight="600">${esc(r.short || r.name)}</text>
          <text x="${labelX.toFixed(0)}" y="${(labelY + 8).toFixed(0)}" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="700">${pct(r.playerShare)}</text>
          <text x="${labelX.toFixed(0)}" y="${(labelY + 23).toFixed(0)}" text-anchor="middle" fill="rgba(244,241,232,.7)" font-size="9">#${r.playerRank} · ${esc(r.leaderName)}领先</text>
        </g>`;
      }).join('');
    // 经纬网（赤道加粗）
    const accLines = (() => {
      let out = '';
      for (let lon = -150; lon <= 150; lon += 30) {
        const a = project(lon, -60), b = project(lon, 75);
        out += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgba(255,255,255,.045)" stroke-width="1"></line>`;
      }
      for (let lat = -45; lat <= 60; lat += 15) {
        const a = project(-178, lat), b = project(178, lat);
        const eq = lat === 0;
        out += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${eq ? 'rgba(216,166,90,.16)' : 'rgba(255,255,255,.045)'}" stroke-width="${eq ? 1.4 : 1}" ${eq ? 'stroke-dasharray="6 6"' : ''}></line>`;
      }
      return out;
    })();
    const svg = `<svg class="map-svg" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.03)" stroke-width="1"></path>
        </pattern>
        <filter id="mapglow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b"></feGaussianBlur>
          <feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mapgrid)"></rect>
      ${accLines}
      ${blocks}
    </svg>`;
    const legend = `<div class="map-legend">
      <span>你的份额</span>
      <span><i style="background:${blend('#6b3a30', '#8a6a2e', 0)}"></i>低</span>
      <span><i style="background:${blend('#8a6a2e', '#4f6f45', 0.5)}"></i>中</span>
      <span><i style="background:${blend('#8a6a2e', '#4f6f45', 1)}"></i>高</span>
      <span style="margin-left:auto">全球需求 ${n(totalDemand)} 台 / 月</span>
    </div>`;

    const rows = sel.list.map(b => `
      <div class="share-row">
        <span class="dot" style="background:${esc(b.color)}"></span>
        <span class="nm ${b.isPlayer ? 'is-me' : ''}">${esc(b.name)}${b.isPlayer ? ' (你)' : ''}</span>
        <span class="share-val">${pct(b.share)}</span>
        <div class="share-bar"><i style="width:${Math.min(100, b.share)}%;background:${esc(b.color)}"></i></div>
      </div>`).join('');

    const investLv = (game.company.regionInvest || {})[sel.id];
    const investCost = (window.DiplomacyEngine || {}).REGION_INVEST_COST || 12000000;

    const panel = `<div class="region-panel">
      <div class="eyebrow" style="font-size:9px;color:var(--faint,#7d8276)">${esc(sel.en || '')}</div>
      <h3>${esc(sel.name)}</h3>
      <div class="sub">${esc(sel.desc || '')}</div>
      <div class="region-kpi">
        <div><label>你的份额</label><b>${pct(sel.playerShare)}</b></div>
        <div><label>排名</label><b>#${sel.playerRank}<span style="font-size:10px;color:var(--faint,#7d8276)"> / ${sel.list.length}</span></b></div>
        <div><label>月需求</label><b>${n(sel.demand)}</b></div>
        <div><label>领先者</label><b style="color:${esc(sel.leaderColor)}">${esc(sel.leaderName)}</b></div>
      </div>
      ${rows}
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-sm btn-secondary" data-action="map-invest" data-id="${esc(sel.id)}">追加区域投入 · ${money(investCost)}</button>
        <span style="font-size:9px;color:var(--faint,#7d8276)">
          ${investLv ? '当前投入 Lv.' + investLv.level + '（+' + (investLv.level * 7) + '% 份额修正，剩 ' + investLv.monthsLeft + ' 月）' : '未投入'}
        </span>
      </div>
      <div class="callout" style="margin-top:12px">
        <div class="callout-title">诊断</div>
        ${sel.playerRank === 1 ? '你在' + esc(sel.short) + '已经是第一，守住它。' :
          '你在' + esc(sel.short) + '落后领先者 ' + pct(sel.leaderShare - sel.playerShare) + '，还能追。'}
      </div>
    </div>`;

    const strong = R.strongest, weak = R.weakest;
    const summary = `<div class="callout" style="margin-top:14px">
      <div class="callout-title">全球诊断</div>
      最强市场 <b>${strong ? esc(strong.short) : '—'}</b>（${strong ? pct(strong.playerShare) : '—'}）　
      最弱市场 <b>${weak ? esc(weak.short) : '—'}</b>（${weak ? pct(weak.playerShare) : '—'}）　
      ${weak && strong && (strong.playerShare - weak.playerShare) > 3 ? '区域差距明显，优先在弱区投入或在那边发起竞争。' : '各区域表现接近，可以集中资源突破一个市场。'}
    </div>`;

    return head + `<div class="map-layout">
      <div><div class="map-stage">${svg}${legend}</div>${summary}</div>
      ${panel}
    </div>`;
  }

  /* ---------- 外交 ---------- */
  function renderDiplomacyPage(game) {
    ensureStyles();
    const DE = window.DiplomacyEngine;
    if (!DE) return '<div class="empty-inline">外交引擎未加载。</div>';
    DE.ensureState(game);
    const brands = (game.market.aiBrands || []).filter(b => !b.acquired);
    if (!brands.length) return '<div class="empty-inline">没有可交涉的对手。</div>';
    const selId = window.__DIPLO_SELECTED__ || brands[0].id;
    const sel = brands.find(b => b.id === selId) || brands[0];
    const rel = game.diplomacy[sel.id] || { attitude: 0 };

    const list = brands.map(b => {
      const r = game.diplomacy[b.id] || { attitude: 0 };
      const band = DE.attitudeBand(r.attitude);
      const tags = [];
      if (r.alliance) tags.push('同盟');
      if (r.supplyCut) tags.push('断供中');
      if (r.competition) tags.push('竞争');
      if (r.sanctions && r.sanctions.length) tags.push('制裁');
      if (r.license) tags.push('授权');
      if (r.monopolizedMonths) tags.push('被垄断');
      return `<div class="diplo-card ${b.id === sel.id ? 'is-active' : ''}" data-action="diplo-select" data-id="${esc(b.id)}">
        <div class="diplo-top">
          <span class="diplo-dot" style="background:${esc(b.color || '#888')}"></span>
          <span class="diplo-name">${esc(b.name)}</span>
          <span class="diplo-band" style="color:${band.color}">${esc(band.name)}</span>
        </div>
        <div class="attitude-meter"><i class="pin" style="left:${(Number(r.attitude || 0) + 100) / 2}%"></i></div>
        <div class="attitude-scale"><span>-100</span><span>${Math.round(r.attitude || 0)}</span><span>+100</span></div>
        ${tags.length ? `<div class="diplo-tags">${tags.map(t => `<span class="diplo-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      </div>`;
    }).join('');

    const band = DE.attitudeBand(rel.attitude);
    const cards = DE.ACTIONS.map(act => {
      const av = DE.actionAvailability(game, act.id, sel.id);
      const est = (() => { try { return act.estimate(game, sel); } catch (e) { return ''; } })();
      const costText = [act.cost ? money(act.cost) : '免费', act.pc ? act.pc + ' PC' : '', act.months + ' 月'].filter(Boolean).join(' · ');
      return `<div class="action-card ${av.ok ? '' : 'is-locked'}">
        <div class="an"><span style="opacity:.7">${act.icon}</span>${esc(act.name)}</div>
        <div class="ad">${esc(act.desc)}</div>
        <div class="ac">${esc(costText)}${est ? '<br><b>' + esc(est) + '</b>' : ''}</div>
        ${av.ok
          ? `<button class="btn btn-sm btn-secondary" data-action="diplo-do" data-id="${esc(act.id)}" data-brand="${esc(sel.id)}">执行</button>`
          : `<div style="font-size:9px;color:#d08a72;line-height:1.6">${esc(av.error)}</div>`}
      </div>`;
    }).join('');

    const hist = (rel.history || []).slice(0, 8).map(h => `
      <div class="log-item"><span class="m">${E.monthLabel(h.month || 0)}</span><b>${esc(h.name)}</b> · ${esc(h.text)}</div>`
    ).join('') || '<div class="log-item">还没有交涉记录。</div>';

    const head = `<div class="page-head">
      <div class="page-head-main">
        <div class="eyebrow">DIPLOMACY / 外交</div>
        <h1 class="page-title">销量对比</h1>
        <p class="page-sub">垄断核心部件、切断对手供应、正面开打强烈竞争、拉拢盟友、实施制裁、授权技术。每一个动作都有代价，也都会招致反制。</p>
      </div>
      <div class="page-actions">
        <span class="badge">政治资本 ${Math.round((game.focus && game.focus.pc) || 0)} PC</span>
        <span class="badge accent">现金 ${money(game.company.cash)}</span>
      </div>
    </div>`;

    return head + `<div class="diplo-layout">
      <div><div class="section-label" style="margin-bottom:8px">对手 / RIVALS</div><div class="diplo-list">${list}</div></div>
      <div class="region-panel">
        <div class="eyebrow" style="font-size:9px;color:var(--faint,#7d8276)">${esc(band.desc)}</div>
        <h3 style="color:${esc(sel.color || '#f0ede4')}">${esc(sel.name)}</h3>
        <div class="sub">态度 ${Math.round(rel.attitude || 0)} · ${esc(band.name)}${rel.alliance ? ' · 同盟中' : ''}${rel.supplyCut ? ' · 已被你断供' : ''}</div>
        <div class="action-grid">${cards}</div>
        <div class="diplo-log">
          <div class="section-label" style="margin-bottom:6px">交涉记录 / HISTORY</div>
          ${hist}
        </div>
      </div>
    </div>`;
  }

  window.StrategyUI = {
    renderMapPage,
    renderDiplomacyPage,
    ensureStyles
  };
})();
