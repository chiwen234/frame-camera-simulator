/* =========================================================
   FRAME — 战略决策界面 v3
   纵向树状布局（钢铁雄心式）：同一列向下推进，
   中途左右分叉成互斥项，各自沿自己的列继续往下。
   顶部两个页签：发展决策 / 外交决策。右侧公司精神面板。
   ========================================================= */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function money(v) {
    const n = Number(v) || 0, a = Math.abs(n), sign = n < 0 ? '-' : '';
    if (a >= 100000000) return sign + '¥' + (a / 100000000).toFixed(2) + '亿';
    if (a >= 10000) return sign + '¥' + Math.round(a / 10000).toLocaleString('zh-CN') + '万';
    return sign + '¥' + Math.round(a).toLocaleString('zh-CN');
  }

  const NODE_W = 132, NODE_H = 56, COL_GAP = 20, ROW_GAP = 84, PAD_X = 24, PAD_Y = 44;

  function ensureStyles() {
    if (document.getElementById('focus-css3')) return;
    const css = `
.fx-tabs{display:flex;gap:6px;margin:12px 0 6px}
.fx-tab{padding:6px 16px;border-radius:0;border:1px solid #4a4034;background:linear-gradient(180deg,#221c15,#181410);font-size:11px;letter-spacing:.06em;cursor:pointer;color:#a99c82}
.fx-tab:hover{color:#e8dfc9;border-color:#6b5b45}
.fx-tab.is-active{background:linear-gradient(180deg,#3a3021,#241d15);border-color:#d8a65a;color:#f0e2c0;box-shadow:inset 0 1px 0 rgba(255,220,150,.15)}
.fx-tab .n{font-size:9px;color:#8d8677;margin-left:6px}
.fx-layout{display:grid;grid-template-columns:1fr 250px;gap:10px;margin-top:8px}
.fx-viewport{position:relative;border:1px solid #3a3226;background:#0b0a08 url(assets/art/tex-grid.png) repeat;background-size:512px 512px;background-blend-mode:soft-light;overflow:hidden;isolation:auto;height:calc(100vh - 300px);min-height:380px;cursor:grab}
.fx-viewport.is-drag{cursor:grabbing}
.fx-widthbar{position:absolute;left:8px;top:8px;display:flex;align-items:center;gap:8px;z-index:9;background:rgba(20,17,13,.92);border:1px solid #4a4034;padding:5px 10px}
.fx-widthbar-label{font-size:10px;letter-spacing:.14em;color:#8a7f6a}
.fx-widthbar-value{font-size:10px;color:#d8a65a;min-width:34px;text-align:right}
.fx-widthbar input[type=range]{width:150px;accent-color:#d8a65a;cursor:pointer}
.fx-zoombar{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:1px;z-index:9}
.fx-zoombar button{width:24px;height:22px;border:1px solid #4a4034;background:#171310;color:#b9ae98;cursor:pointer;font-size:12px;line-height:1}
.fx-zoombar button:hover{border-color:#d8a65a;color:#f0e2c0}
.fx-zlv{font-size:8px;color:#7d7466;text-align:center;padding-top:2px}
.fx-canvas{position:relative;border:1px solid #3a3226;border-radius:0;background:#0b0a08;overflow:auto}
.fx-inner{position:relative}
.fx-svg{position:absolute;left:0;top:0}
.fx-svg .fxg{cursor:pointer}
.fx-svg .fxg:hover rect:first-child{stroke:#d8a65a}
.fxg.is-sel rect:first-child{stroke:#d8a65a;stroke-width:2}
.fx-node{position:absolute;width:132px;height:56px;border-radius:0;border:1px solid #4a4034;background:linear-gradient(180deg,#1d1913,#14110d);cursor:pointer;padding:5px 6px;box-sizing:border-box;transition:none;overflow:hidden}
.fx-node:hover{border-color:#a08a5e;background:linear-gradient(180deg,#241f17,#181410);z-index:5}
.fx-node .t{padding-right:14px;font-size:9px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#c9bfa8}
.fx-node .m{display:flex;gap:4px;margin-top:3px;font-size:8px;color:#7d7466}
.fx-node .m .fp{color:#c9a35c}
.fx-node .m .mo{color:#8f9b6d}
.fx-node.is-done{background:linear-gradient(180deg,#3a3021,#2a2218);border-color:#d8a65a}
.fx-node.is-done .t{color:#f0e2c0}
.fx-node.is-ready{border-color:#8f9b6d}
.fx-node.is-ready .t{color:#dfe0c8}
.fx-node.is-locked{opacity:.45}
.fx-node.is-excluded{opacity:.26;border-style:dashed}
.fx-node.is-active{border-color:#d8a65a}
.fx-node.is-fork{border-width:2px;border-color:#7a6a45}
.fx-node.is-fork::after{content:'◈';position:absolute;right:4px;bottom:2px;font-size:8px;color:#c9a35c;opacity:.9}
.fx-node.is-end{background:linear-gradient(180deg,#43371f,#2b2317);border-color:#d8a65a;box-shadow:inset 0 0 0 1px rgba(216,166,90,.25)}
.fx-node.is-end .t{color:#f6e7c4;font-size:10px}
.fx-node.is-end::after{content:'★';position:absolute;right:4px;bottom:1px;font-size:9px;color:#d8a65a}
.fx-node .ic{position:absolute;left:4px;top:5px;font-size:8px;opacity:.7;line-height:1}
.fx-node .t{padding-left:12px}
.fx-node .tag{position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;font-size:0;background:#6d6558}
.fx-node.is-done .tag{background:#d8a65a}
.fx-node.is-ready .tag{background:#8f9b6d}
.fx-node.is-active .tag{background:#c9a35c}
.fx-node.is-excluded .tag{background:#8c4a3a}
.fx-node .bar{position:absolute;left:0;bottom:0;height:2px;background:#c9a35c}
.fx-lane-label{position:absolute;font-size:9px;letter-spacing:.14em;white-space:nowrap;transform:translateX(-50%);opacity:.8}
.fx-side{display:flex;flex-direction:column;gap:8px}
.fx-panel{border:1px solid #3a3226;border-radius:0;background:linear-gradient(180deg,#1a1611,#13100c);padding:9px 10px}
.fx-panel h4{margin:0 0 6px;font-size:10px;letter-spacing:.12em;color:#c9a35c;font-weight:600}
.fx-spirit{display:flex;gap:7px;padding:5px 0;border-bottom:1px solid #262117}
.fx-spirit:last-child{border-bottom:0}
.fx-spirit .ic{width:16px;height:16px;border-radius:0;display:flex;align-items:center;justify-content:center;font-size:9px;flex:0 0 auto;border:1px solid}
.fx-spirit.good .ic{background:#1d2419;color:#9fae7c;border-color:#3f4a33}
.fx-spirit.bad .ic{background:#261a17;color:#c0836e;border-color:#4d332c}
.fx-spirit .txt b{font-size:9.5px;display:block}
.fx-spirit .txt span{font-size:8.5px;color:#7d7466;line-height:1.55}
.fx-detail{border:1px solid #3a3226;border-radius:0;background:#16130e;padding:9px 10px}
.fx-detail h5{margin:0 0 3px;font-size:10.5px;color:#e8dfc9}
.fx-detail .d{font-size:8.5px;line-height:1.6;color:#8d8677;margin:4px 0 6px}
.fx-detail .e{font-size:8.5px;line-height:1.7;color:#b3ab96}
.fx-detail .w{font-size:8.5px;color:#c0836e;line-height:1.55;margin-top:6px}
.fx-stat{display:flex;gap:10px}
.fx-stat div{flex:1}
.fx-stat label{display:block;font-size:8px;letter-spacing:.1em;color:#7d7466;margin-bottom:2px}
.fx-stat b{font-size:14px;color:#e8dfc9;font-variant-numeric:tabular-nums}
.acq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.acq-card{border:1px solid #3a3226;border-radius:0;padding:9px 10px;background:linear-gradient(180deg,#181410,#12100c)}
.acq-card.is-done{opacity:.5;border-style:dashed}
.acq-head{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.acq-dot{width:7px;height:7px}
.acq-name{font-size:10.5px;color:#d6ccb6}
.acq-sub{font-size:8.5px;color:#7d7466;margin-left:auto}
.acq-row{display:flex;justify-content:space-between;font-size:9px;padding:2px 0;border-bottom:1px solid #221c15}
.acq-row span{color:#7d7466}
.acq-row b{color:#c9bfa8}
.acq-btn{width:100%;margin-top:7px}
.acq-hint{font-size:8.5px;color:#c0836e;margin-top:5px;line-height:1.5}
@media(max-width:1100px){.fx-layout{grid-template-columns:1fr}}
`;
    const el = document.createElement('style');
    el.id = 'focus-css3';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function F() { return window.FocusEngine; }
  function laneColor(tree, laneId) {
    const l = (tree.lanes || []).find(x => x.id === laneId);
    return (l && l.color) || '#9aa093';
  }

  function layout(tree) {
    /* 完全按钢铁雄心 4 的方式排：
       1) 一层一排（深度相同的节点在同一水平线）
       2) 子节点占据连续的列，父节点居中在子节点之上
       3) 每条线从父节点垂直落下，到本层的横线，再各自落进子节点
       —— 子树连续，所以不同父节点的横线永远不会重叠 */
    const byId = {};
    tree.nodes.forEach(function (n) { byId[n.id] = n; });

    // 父 / 子 / 深度
    const parents = {}, kids = {}, depth = {};
    tree.nodes.forEach(function (n) {
      const ps = (n.requires || []).filter(function (r) { return byId[r]; });
      parents[n.id] = ps;
    });
    // 布局用树：每个节点只认第一个前置作为布局父节点（避免 DAG 折叠）
    tree.nodes.forEach(function (n) {
      const p0 = parents[n.id][0];
      if (p0) (kids[p0] = kids[p0] || []).push(n.id);
    });
    Object.keys(kids).forEach(function (k) {
      kids[k].sort(function (x, y) {
        return (byId[x].col - byId[y].col) || (byId[x].row - byId[y].row);
      });
    });

    function dep(id, g) {
      if (depth[id] != null) return depth[id];
      if (g > 80) return 0;
      const ps = parents[id];
      depth[id] = ps.length ? Math.max.apply(null, ps.map(function (p) { return dep(p, g + 1) + 1; })) : 0;
      return depth[id];
    }
    tree.nodes.forEach(function (n) { dep(n.id, 0); });

    const byLane = {};
    tree.nodes.forEach(function (n) { (byLane[n.lane] = byLane[n.lane] || []).push(n); });
    const laneOrder = (tree.lanes || []).map(function (l) { return l.id; })
      .filter(function (id) { return byLane[id] && byLane[id].length; });
    Object.keys(byLane).forEach(function (k) { if (laneOrder.indexOf(k) < 0) laneOrder.push(k); });

    const UNIT = (NODE_W + 22) * 2 * fxWidthScale;   // 列距（滑块可调）
    const ROW_H = NODE_H + 66;     // 行距
    const pos = {};
    let cursorX = PAD_X;

    laneOrder.forEach(function (laneId) {
      const inLane = {};
      byLane[laneId].forEach(function (n) { inLane[n.id] = true; });
      const laneKids = function (id) {
        return (kids[id] || []).filter(function (k) { return inLane[k]; });
      };

      let slot = 0;
      const col = {}, seen = {};
      function place(id) {
        if (col[id] != null) return col[id];
        if (seen[id]) return slot;      // 防环
        seen[id] = true;
        const ks = laneKids(id);
        let c;
        if (!ks.length) {
          c = slot++;                    // 叶子占一列
        } else {
          const cs = ks.map(place);
          c = (Math.min.apply(null, cs) + Math.max.apply(null, cs)) / 2;   // 父居中
        }
        col[id] = c;
        return c;
      }
      // 先放根，再放剩下没被覆盖的（被多个父引用时只算一次）
      byLane[laneId].filter(function (n) { return !parents[n.id].length; })
        .sort(function (x, y) { return (x.col - y.col) || (x.row - y.row); })
        .forEach(function (n) { place(n.id); });
      byLane[laneId].forEach(function (n) { if (col[n.id] == null) place(n.id); });

      byLane[laneId].forEach(function (n) {
        pos[n.id] = {
          x: cursorX + col[n.id] * UNIT,
          y: PAD_Y + (depth[n.id] || 0) * ROW_H
        };
      });
      cursorX += Math.max(1, slot) * UNIT + 54;
    });

    const maxDepth = Math.max.apply(null, tree.nodes.map(function (n) { return depth[n.id] || 0; }));
    return {
      pos: pos, parents: parents, kids: kids, depth: depth,
      width: cursorX + PAD_X,
      height: PAD_Y * 2 + (maxDepth + 1) * ROW_H,
      rows: maxDepth + 1, rowH: ROW_H,
      lanes: laneOrder
    };
  }

  function connector(from, to) {
    const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2, y2 = to.y;
    // 直线：每条边都是独占的一段，不存在共用横线互相盖住的问题
    return 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
  }

  let lastTreeArgs = null;

  function renderTree(game, tree, state) {
    lastTreeArgs = { game: game, tree: tree, state: state };
    const FE = F();
    const L = layout(tree);
    fxSize = { w: L.width, h: L.height };
    const byId = {};
    tree.nodes.forEach(n => { byId[n.id] = n; });

    let lines = '';
    const doneSet = {};
    (state.completed || []).forEach(function (id) { doneSet[id] = true; });

    function ln(d, color, w, dash) {
      return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '"' + (dash || '') + '/>';
    }

    // 每个节点只认一个绘制父节点：最靠近自己中心的那个（避免交叉）
    const drawParent = {};
    tree.nodes.forEach(function (n) {
      const ps = (L.parents && L.parents[n.id] || []).filter(function (r) { return L.pos[r]; });
      if (!ps.length) return;
      const cx = L.pos[n.id].x + NODE_W / 2;
      let best = ps[0], bd = Infinity;
      ps.forEach(function (r) {
        const d = Math.abs(L.pos[r].x + NODE_W / 2 - cx);
        if (d < bd) { bd = d; best = r; }
      });
      drawParent[n.id] = best;
    });

    const childMap = {};
    Object.keys(drawParent).forEach(function (cid) {
      const pid = drawParent[cid];
      (childMap[pid] = childMap[pid] || []).push(cid);
    });

    Object.keys(childMap).forEach(function (pid) {
      const p = L.pos[pid];
      if (!p) return;
      const kidsArr = childMap[pid].sort(function (x, y) { return L.pos[x].x - L.pos[y].x; });
      const px = p.x + NODE_W / 2, py = p.y + NODE_H;
      const done = !!doneSet[pid];
      const color = done ? '#d8a65a' : 'rgba(255,255,255,.20)';
      const w = done ? 1.9 : 1.2;

      const xs = kidsArr.map(function (k) { return L.pos[k].x + NODE_W / 2; });
      const minY = Math.min.apply(null, kidsArr.map(function (k) { return L.pos[k].y; }));
      let busY = py + 20;
      if (busY > minY - 10) busY = py + Math.max(8, (minY - py) * 0.45);

      // 父 → 横线
      lines += ln('M' + px + ' ' + py + ' L' + px + ' ' + busY, color, w);
      // 横线（一棵子树的跨度，天然互不重叠）
      const x1 = Math.min.apply(null, xs), x2 = Math.max.apply(null, xs);
      if (x2 - x1 > 1) lines += ln('M' + x1 + ' ' + busY + ' L' + x2 + ' ' + busY, color, w);
      // 横线 → 各子节点
      kidsArr.forEach(function (k) {
        const kx = L.pos[k].x + NODE_W / 2;
        const ky = L.pos[k].y;
        const kdone = !!doneSet[k];
        const kc = kdone ? '#7f9fbd' : color;
        lines += ln('M' + kx + ' ' + busY + ' L' + kx + ' ' + ky, kc, w);
      });
    });

    // 互斥之间画 ×：同一互斥组的两个节点，在它们中间打叉
    const exGroups = {};
    tree.nodes.forEach(n => {
      if (!n.group || !L.pos[n.id]) return;
      (exGroups[n.group] = exGroups[n.group] || []).push(n);
    });
    Object.keys(exGroups).forEach(g => {
      const list = exGroups[g];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = L.pos[list[i].id], b = L.pos[list[j].id];
          if (!a || !b) continue;
          if (Math.abs(a.y - b.y) > 4) continue;      // 只连同一排的
          if (Math.abs(a.x - b.x) > NODE_W * 1.6) continue;   // 相隔太远就不画
          const x1 = Math.min(a.x, b.x) + NODE_W / 2;
          const x2 = Math.max(a.x, b.x) + NODE_W / 2;
          const y = a.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          const c = (state.completed || []).indexOf(list[i].id) >= 0
            || (state.completed || []).indexOf(list[j].id) >= 0 ? '#8c4a3a' : '#c9a35c';
          lines += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + c + '" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/>';
          const r = 7;
          lines += '<g opacity=".95"><circle cx="' + mx + '" cy="' + y + '" r="' + (r + 3) + '" fill="#0b0a08" stroke="' + c + '" stroke-width="1" opacity=".9"/>'
            + '<path d="M' + (mx - r * 0.6) + ' ' + (y - r * 0.6) + 'L' + (mx + r * 0.6) + ' ' + (y + r * 0.6)
            + 'M' + (mx + r * 0.6) + ' ' + (y - r * 0.6) + 'L' + (mx - r * 0.6) + ' ' + (y + r * 0.6)
            + '" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/></g>';
        }
      }
    });

    // 泳道标签（SVG）
    const laneFirst = {};
    tree.nodes.forEach(n => { if (!laneFirst[n.lane] || n.row < laneFirst[n.lane].row) laneFirst[n.lane] = n; });
    let laneLabelsSvg = '';
    (tree.lanes || []).forEach(lane => {
      const f = laneFirst[lane.id];
      if (!f || !L.pos[f.id]) return;
      laneLabelsSvg += '<text x="' + (L.pos[f.id].x + NODE_W / 2) + '" y="14" text-anchor="middle" fill="' + lane.color
        + '" font-size="9" letter-spacing="1.4" font-family="Segoe UI,system-ui,sans-serif" opacity="0.85">'
        + esc(lane.name) + '</text>';
    });

    // ---- SVG 矢量节点（缩放不糊）----
    let nodesSvg = '';
    tree.nodes.forEach(function (n) {
      const st = FE.nodeState(game, n.id);
      const pr = (state.progress || {})[n.id];
      const pct = pr ? Math.min(100, Math.round((pr.months || 0) / Math.max(1, pr.total) * 100)) : 0;
      const p = L.pos[n.id];
      if (!p) return;
      const isFork = !!n.fork;
      const isEnd = !!n.isEnd;
      const techKey = n.lane === 'img' ? 'sensor' : n.lane === 'af' ? 'af' : n.lane === 'opt' ? 'optics'
        : n.lane === 'vid' ? 'video' : n.lane === 'br' ? 'color' : 'software';
      const curTech = (game.company.tech && game.company.tech[techKey]) || 1;
      const techLock = n.techReq && curTech < n.techReq;
      const w = isEnd ? NODE_W + 34 : NODE_W;
      const h = isEnd ? NODE_H + 10 : NODE_H;
      const x = p.x, y = p.y;

      const isExcl = n.nodeType === 'exclusive' || (n.group && n.group.indexOf('_g') > 0);
      const isRisk = n.nodeType === 'risk';
      const isModel = n.nodeType === 'model';
      const isChip = n.nodeType === 'chip';
      const isDiplo = n.nodeType === 'diplo';
      const isStd = n.nodeType === 'standard' || n.nodeType === 'legend';
      let fill = '#16130e', stroke = '#4a4034', tcol = '#b8ad95', sw = 1;
      if (isExcl) { fill = '#1d1a12'; stroke = '#c9a35c'; sw = 2; }
      if (isRisk) { fill = '#22120f'; stroke = '#c85a4a'; sw = 2; }
      if (isModel) { fill = '#1a2016'; stroke = '#90a86c'; }
      if (isChip) { fill = '#161d20'; stroke = '#5a8fc8'; }
      if (isDiplo) { fill = '#1d1a20'; stroke = '#8a6fb0'; }
      if (isStd) { fill = '#241d10'; stroke = '#d8a65a'; sw = 2; }
      if (st === 'done') { fill = '#332a1c'; stroke = '#d8a65a'; tcol = '#f0e2c0'; }
      else if (st === 'ready') { fill = '#1b1a13'; stroke = '#8f9b6d'; tcol = '#dfe0c8'; }
      else if (st === 'active') { fill = '#242017'; stroke = '#c9a35c'; tcol = '#f0e2c0'; }
      else if (st === 'locked') { fill = '#121009'; stroke = '#332c21'; tcol = '#6d6558'; }
      else if (st === 'excluded') { fill = '#100e0b'; stroke = '#4a3a34'; tcol = '#5f584c'; }
      else if (st === 'cost') { fill = '#151210'; stroke = '#3a3226'; tcol = '#8d8677'; }
      if (isFork) sw = 2;
      if (isEnd) {
        nodesSvg += '<circle cx="' + (x + w - 6) + '" cy="' + (y + 15) + '" r="2.4" fill="#d8a65a"/>';
      }
      const op = st === 'excluded' ? 0.62 : (st === 'locked' ? 0.72 : 1);
      const laneCol = laneColor(tree, n.lane);

      nodesSvg += '<g class="fxg" data-action="focus-select" data-id="' + esc(n.id) + '" style="cursor:pointer" opacity="' + op + '">';
      nodesSvg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="transparent" style="pointer-events:all"/>';
      nodesSvg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill
        + '" stroke="' + stroke + '" stroke-width="' + sw + '"' + (st === 'excluded' ? ' stroke-dasharray="3 2"' : '') + '/>';
      nodesSvg += '<rect x="' + x + '" y="' + y + '" width="2.5" height="' + h + '" fill="' + laneCol + '" opacity="0.75"/>';
      // 节点图标（矢量 path，直接嵌进 SVG）
      const glyph = (window.FrameIcons && window.FrameIcons.GLYPH && window.FrameIcons.GLYPH[n.icon]) || '';
      if (glyph) {
        nodesSvg += '<g transform="translate(' + (x + 5) + ',' + (y + 5) + ') scale(0.46)" opacity="0.92"><path d="' + glyph + '" fill="' + laneCol + '"/></g>';
      }
      nodesSvg += '<text x="' + (x + 22) + '" y="' + (y + 17) + '" fill="' + tcol
        + '" font-size="9.5" font-family="Segoe UI,system-ui,sans-serif">' + esc(cut(n.title, 11)) + '</text>';
      nodesSvg += '<text x="' + (x + w / 2 - 26) + '" y="' + (y + 34) + '" text-anchor="middle" fill="#c9a35c" font-size="8" font-family="Segoe UI,system-ui,sans-serif">' + n.cost + 'FP</text>';
      nodesSvg += '<text x="' + (x + w / 2 + 4) + '" y="' + (y + 34) + '" text-anchor="middle" fill="#8f9b6d" font-size="8" font-family="Segoe UI,system-ui,sans-serif">' + n.months + '月</text>';
      if (n.techReq) {
        nodesSvg += '<text x="' + (x + w / 2 + 34) + '" y="' + (y + 34) + '" text-anchor="middle" fill="' + (techLock ? '#d08a72' : '#7d7466')
          + '" font-size="8" font-family="Segoe UI,system-ui,sans-serif">Lv.' + n.techReq + '</text>';
      }
      const dot = st === 'done' ? '#d8a65a' : st === 'ready' ? '#8f9b6d' : st === 'active' ? '#c9a35c'
        : st === 'excluded' ? '#8c4a3a' : '#4a4034';
      nodesSvg += '<circle cx="' + (x + w - 7) + '" cy="' + (y + 6) + '" r="2.6" fill="' + dot + '"/>';
      if (st === 'excluded') {
        nodesSvg += '<line x1="' + (x + 4) + '" y1="' + (y + 4) + '" x2="' + (x + w - 4) + '" y2="' + (y + h - 4) + '" stroke="#6b3a30" stroke-width="1" opacity="0.7"/>';
      }
      if (isExcl) {
        nodesSvg += '<line x1="' + (x + w - 14) + '" y1="' + (y + 2) + '" x2="' + (x + w - 14) + '" y2="' + (y + h - 2) + '" stroke="#c9a35c" stroke-width="1" opacity="0.5"/>';
        nodesSvg += '<text x="' + (x + w - 12) + '" y="' + (y + h - 6) + '" fill="#c9a35c" font-size="9">\u21C4</text>';
      }
      if (isRisk) {
        nodesSvg += '<text x="' + (x + w - 13) + '" y="' + (y + h - 5) + '" fill="#c85a4a" font-size="9">\u2620</text>';
      }
      if (isFork) {
        nodesSvg += '<circle cx="' + (x + w - 6) + '" cy="' + (y + 15) + '" r="2" fill="#c9a35c"/>';
      }
      if (isEnd) {
        nodesSvg += '<text x="' + (x + w - 12) + '" y="' + (y + h - 4) + '" fill="#d8a65a" font-size="9" font-family="Segoe UI">\u2605</text>';
      }
      if (st === 'active' && pct > 0) {
        nodesSvg += '<rect x="' + x + '" y="' + (y + h - 2) + '" width="' + (w * pct / 100) + '" height="2" fill="#c9a35c"/>';
      }
      nodesSvg += '</g>';
    });

    function cut(str, n) { const t = String(str || ''); return t.length > n ? t.slice(0, n - 1) + '\u2026' : t; }
    return '<div class="fx-viewport" id="fx-viewport">'
      + '<svg id="fx-inner" width="' + L.width + '" height="' + L.height + '" viewBox="0 0 ' + L.width + ' ' + L.height + '"'
      + ' style="position:absolute;left:0;top:0;transform-origin:0 0;overflow:visible">'
      + '<g fill="none">' + lines + '</g>'
      + '<g>' + laneLabelsSvg + '</g>'
      + '<g>' + nodesSvg + '</g>'
      + '</svg>'
      + '<div class="fx-widthbar"><span class="fx-widthbar-label">宽度</span>'
  + '<input type="range" id="fx-width-slider" min="50" max="220" value="' + Math.round(fxWidthScale * 100) + '" step="10">'
  + '<span class="fx-widthbar-value" id="fx-width-value">' + Math.round(fxWidthScale * 100) + '%</span>'
  + '</div>'
  + '<div class="fx-zoombar">'
      + '<button data-action="fx-zoom" data-d="in" title="放大">+</button>'
      + '<button data-action="fx-zoom" data-d="out" title="缩小">-</button>'
      + '<button data-action="fx-zoom" data-d="reset" title="复位">0</button>'
      + '<span class="fx-zlv" id="fx-zlv">100%</span>'
      + '</div></div>';
  }


  // 决策树视口：缩放 + 平移（钢铁雄心式）
  let fxView = { x: 0, y: 0, k: 1 };
  let fxSize = null;
  let fxWidthScale = 1;   // 列距倍率（滑块控制）
  let fxBound = null;      // 当前绑定事件的那个元素
  let fxHandlers = null;

  function applyView() {
    const inner = document.getElementById('fx-inner');
    if (!inner) return;
    const ix = Math.round(fxView.x), iy = Math.round(fxView.y);
    inner.style.transform = 'translate(' + ix + 'px,' + iy + 'px) scale(' + fxView.k + ')';
    // 强制浏览器按矢量重绘，避免位图缓存导致缩放发糊
    inner.style.willChange = 'auto';
    inner.style.imageRendering = 'auto';
    const lv = document.getElementById('fx-zlv');
    if (lv) lv.textContent = Math.round(fxView.k * 100) + '%';
  }

  // 节点矢量图标
  function nodeIcon(n, color) {
    const IC = window.FrameIcons;
    if (!IC) return '';
    const name = n.icon || 'company';
    // 特殊节点用描边徽章，普通节点用实心符号
    if (name === 'purify' || name === 'buff' || name === 'crown' || name === 'flagfire' || name === 'handshake') {
      return IC.svgEmblem(name, 13, color, true);
    }
    return IC.svgNodeIcon(name, 11, color);
  }

  // 每次重新渲染后调用：直接绑定到当前 DOM 元素
  function rerenderViewport() {
    const vp = document.getElementById('fx-viewport');
    if (!vp || !lastTreeArgs) return;
    const html = renderTree(lastTreeArgs.game, lastTreeArgs.tree, lastTreeArgs.state);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const fresh = tmp.firstElementChild;
    if (!fresh) return;
    vp.replaceWith(fresh);
    fxBound = null;
    mount();
  }

  function mount() {
    const vp = document.getElementById('fx-viewport');
    const inner = document.getElementById('fx-inner');
    if (!vp || !inner) return;

    // 已经绑过这个元素 → 只刷新视图
    if (fxBound === vp && fxHandlers) { applyView(); return; }
    fxBound = vp;

    // 初始视图：自动缩放到一屏能看全
    const vw = vp.clientWidth || 1000;
    const vh = vp.clientHeight || 600;
    const iw = (fxSize && fxSize.w) || inner.offsetWidth || 1000;
    const ih = (fxSize && fxSize.h) || inner.offsetHeight || 600;
    // 只按高度适配：保证字看得清，横向由玩家拖动（与钢铁雄心一致）
    const fitH = vh / (ih + 24);
    const k = Math.max(0.5, Math.min(1, Number(fitH.toFixed(3))));
    fxView = { x: 20, y: 10, k: k };
    applyView();

    // 宽度滑块
    const slider = document.getElementById('fx-width-slider');
    const sliderVal = document.getElementById('fx-width-value');
    if (slider) {
      slider.oninput = function () {
        fxWidthScale = Math.max(0.5, Math.min(2.2, (parseInt(slider.value, 10) || 100) / 100));
        if (sliderVal) sliderVal.textContent = Math.round(fxWidthScale * 100) + '%';
        rerenderViewport();
      };
    }

    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

    const onDown = function (e) {
      if (e.button !== 0) return;
      if (e.target.closest('.fx-zoombar')) return;
      if (e.target.closest('.fxg')) return;  // 点在节点上不拖拽
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = fxView.x; oy = fxView.y;
      vp.classList.add('is-drag');
      try { vp.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const onMove = function (e) {
      if (!dragging) return;
      fxView.x = ox + (e.clientX - sx);
      fxView.y = oy + (e.clientY - sy);
      applyView();
      e.preventDefault();
    };
    const onUp = function (e) {
      dragging = false;
      vp.classList.remove('is-drag');
      try { vp.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    const onWheel = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const oldK = fxView.k;
      const nextK = Math.max(0.3, Math.min(2.5, oldK * (e.deltaY > 0 ? 0.9 : 1.1)));
      if (nextK === oldK) return;
      fxView.x = mx - (mx - fxView.x) * (nextK / oldK);
      fxView.y = my - (my - fxView.y) * (nextK / oldK);
      fxView.k = nextK;
      applyView();
    };

    vp.addEventListener('pointerdown', onDown);
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerup', onUp);
    vp.addEventListener('pointercancel', onUp);
    vp.addEventListener('wheel', onWheel, { passive: false });

    fxHandlers = { onDown, onMove, onUp, onWheel };
  }

  function zoomBy(dir) {
    const vp = document.getElementById('fx-viewport');
    if (!vp) return;
    if (dir === 'reset') { fxView = { x: 20, y: 20, k: 1 }; applyView(); return; }
    const rect = vp.getBoundingClientRect();
    const mx = rect.width / 2, my = rect.height / 2;
    const oldK = fxView.k;
    const nextK = Math.max(0.35, Math.min(2.2, oldK * (dir === 'in' ? 1.2 : 0.84)));
    fxView.x = mx - (mx - fxView.x) * (nextK / oldK);
    fxView.y = my - (my - fxView.y) * (nextK / oldK);
    fxView.k = nextK;
    applyView();
  }

  function renderSpirits(game) {
    const sp = window.FRAME_SPIRITS;
    if (!sp) return '';
    const list = sp.spiritsFor(game.company.id);
    if (!list || !list.length) return '';
    return '<div class="fx-panel"><h4>公司精神</h4>' + list.map(s =>
      '<div class="fx-spirit ' + s.kind + '">'
      + '<div class="ic">' + (s.icon || (s.kind === 'good' ? '+' : '−')) + '</div>'
      + '<div class="txt"><b style="color:' + (s.kind === 'good' ? '#a9c97a' : '#d08a72') + '">' + esc(s.name) + '</b>'
      + '<span>' + esc(s.desc) + '</span></div></div>').join('') + '</div>';
  }

  function renderDetail(game, nodeId) {
    const FE = F();
    const node = FE.nodeById(null, nodeId);
    if (!node) return '';
    const st = FE.nodeState(game, nodeId);
    const reason = FE.nodeBlockReason(game, node);
    const mates = (node.excludes || []).map(id => FE.nodeById(null, id)).filter(Boolean);
    const can = st === 'ready';

    const ST_LABEL = {
      done: ['已完成', '#8f9b6d'], active: ['推进中', '#c9a35c'], ready: ['可以推进', '#9fae7c'],
      locked: ['前置未完成', '#8d8677'], excluded: ['已被互斥锁定', '#c0836e'],
      cost: ['决策点不足', '#c0836e'], tech: ['技术等级不足', '#c0836e'],
      waiting: ['槽位已满', '#8d8677'], missing: ['未知节点', '#8d8677']
    };
    const stl = ST_LABEL[st] || ['未解锁', '#8d8677'];

    const reqNames = (node.requires || []).map(function (id) {
      const n = FE.nodeById(null, id);
      const ok = (game.focus.completed || []).indexOf(id) >= 0;
      return { title: n ? n.title : id, ok: ok };
    });

    return '<div class="fx-detail">'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
      + '<span style="font-size:8px;letter-spacing:.14em;color:#7d8276">' + (node.kind === 'pol' ? '政治决策' : '发展决策') + '</span>'
      + '<span style="margin-left:auto;font-size:9px;color:' + stl[1] + ';border:1px solid ' + stl[1] + '55;padding:0 5px">' + stl[0] + '</span>'
      + '</div>'
      + '<h5>' + esc(node.title) + '</h5>'
      + '<div class="d">' + esc(node.desc || '（暂无描述）') + '</div>'
      + '<div style="display:flex;gap:10px;font-size:9px;color:#8d8677;margin:5px 0">'
      + '<span>消耗 <b style="color:#c9a35c">' + node.cost + ' FP</b></span>'
      + '<span>周期 <b style="color:#8f9b6d">' + node.months + ' 月</b></span>'
      + (node.techReq ? '<span>需技术 Lv.' + node.techReq + '</span>' : '')
      + '</div>'
      + '<div class="e">' + esc(FE.effectSummary(node)) + '</div>'
      + (reqNames.length ? '<div style="font-size:8.5px;color:#7d8276;margin-top:6px">前置：'
        + reqNames.map(function (r) { return '<span style="color:' + (r.ok ? '#8f9b6d' : '#c0836e') + '">' + esc(r.title) + '</span>'; }).join('、')
        + '</div>' : '')
      + (mates.length ? '<div class="w">⚠ 互斥：选了它，就永远拿不到「' + mates.map(m => esc(m.title)).join('」「') + '」以及那条线的后续。</div>' : '')
      + (can ? '' : (reason && reason.text ? '<div class="w">' + esc(reason.text) + '</div>' : ''))
      + (can ? '<button class="btn btn-primary" style="width:100%;margin-top:9px" data-action="focus-start" data-id="' + esc(node.id) + '">推进 · ' + node.cost + ' FP / ' + node.months + ' 月</button>'
        : '<div style="font-size:8.5px;color:#6d6558;margin-top:8px;text-align:center">当前不可推进，但可以查看它的效果与前置</div>')
      + '</div>';
  }

  function renderFocusPage(game) {
    ensureStyles();
    const FE = F();
    if (!FE) return '<div class="empty-inline">决策引擎未加载。</div>';
    const kind = (game.focus && game.focus.kind) || 'dev';
    const tree = FE.treeFor(game.company, kind);
    const f = game.focus;
    const doneCount = tree.nodes.filter(n => (f.completed || []).indexOf(n.id) >= 0).length;
    const activeInTree = (f.queue || []).filter(id => tree.nodes.some(n => n.id === id));

    const tab = (k, label) => {
      const t = FE.treeFor(game.company, k);
      const d = t.nodes.filter(n => (f.completed || []).indexOf(n.id) >= 0).length;
      const ic = k === 'pol' ? '⚑' : '⚙';
      return '<button class="fx-tab ' + (kind === k ? 'is-active' : '') + '" data-action="focus-kind" data-kind="' + k + '">'
        + '<span style="margin-right:6px;opacity:.8">' + ic + '</span>' + label
        + '<span class="n">' + d + '/' + t.nodes.length + '</span></button>';
    };

    const head = '<div class="page-head"><div class="page-head-main">'
      + '<div class="eyebrow">GRAND STRATEGY / 战略决策</div>'
      + '<h1 class="page-title">' + esc(tree.name) + '</h1>'
      + '<p class="page-sub">' + esc(tree.motto || '') + '　同一条线向下推进，中途分叉出互斥的两条路；选了哪条，就只能沿那条线走到底。</p>'
      + '</div><div class="page-actions">'
      + '<span class="badge accent">决策点数 ' + Math.round(f.fp) + ' FP</span>'
      + '<span class="badge">政治资本 ' + Math.round(f.pc || 0) + ' PC</span>'
      + '<button class="btn btn-secondary" data-action="nav" data-page="command" title="返回指挥中心" style="display:inline-flex;align-items:center;gap:6px">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
      + '返回指挥中心</button>'
      + '</div></div>';

    const tabs = '<div class="fx-tabs">' + tab('dev', '发展决策') + tab('pol', '政治决策') + '</div>';

    const stat = '<div class="fx-panel"><div class="fx-stat">'
      + '<div><label>本树完成</label><b>' + doneCount + '<span style="font-size:10px;color:var(--faint,#7d8276)">/' + tree.nodes.length + '</span></b></div>'
      + '<div><label>推进中</label><b>' + activeInTree.length + '<span style="font-size:10px;color:var(--faint,#7d8276)">/' + FE.MAX_ACTIVE_FOCUS + '</span></b></div>'
      + '<div><label>每月</label><b>+' + FE.FP_PER_MONTH + '<span style="font-size:10px;color:var(--faint,#7d8276)"> FP</span></b></div>'
      + '</div></div>';

    const active = activeInTree.map(id => {
      const n = FE.nodeById(null, id);
      const pr = (f.progress || {})[id] || { months: 0, total: 1 };
      const pct = Math.min(100, Math.round((pr.months || 0) / Math.max(1, pr.total) * 100));
      return '<div style="font-size:10px;margin:6px 0">'
        + '<div style="display:flex;justify-content:space-between"><span>' + esc(n ? n.title : id) + '</span><span style="color:var(--faint,#7d8276)">' + (pr.months || 0) + '/' + pr.total + '</span></div>'
        + '<div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:' + pct + '%;background:#7f9fbd"></i></div>'
        + '</div>';
    }).join('') || '<div style="font-size:9px;color:var(--faint,#7d8276)">当前没有推进中的决策</div>';

    const side = '<div class="fx-side">' + stat
      + '<div class="fx-panel"><h4>推进中</h4>' + active + '</div>'
      + renderSpirits(game)
      + '<div id="fx-detail-slot">' + renderDetail(game, window.__FX_SELECTED__ || (tree.nodes[0] && tree.nodes[0].id)) + '</div>'
      + '</div>';

    return head + tabs + '<div class="fx-layout">' + renderTree(game, tree, f) + side + '</div>' + renderAcquisitionSection(game);
  }

  function renderAcquisitionSection(game) {
    const FE = F();
    const brands = (game.market.aiBrands || []).filter(b => !b.acquired);
    const owned = (game.market.aiBrands || []).filter(b => b.acquired);
    if (!brands.length && !owned.length) return '';
    const cards = brands.concat(owned).map(b => {
      const elig = FE.acquisitionEligible(game, b);
      const cost = FE.acquisitionCost(game, b);
      const snap = game.market.snapshot;
      const row = snap && snap.brands ? snap.brands.find(x => x.id === b.id) : null;
      const share = row ? row.share : 0;
      return '<div class="acq-card ' + (b.acquired ? 'is-done' : '') + '">'
        + '<div class="acq-head"><span class="acq-dot" style="background:' + esc(b.color || '#888') + '"></span>'
        + '<span class="acq-name">' + esc(b.name) + '</span>'
        + '<span class="acq-sub">' + (b.acquired ? '已并入' : share.toFixed(1) + '% 份额') + '</span></div>'
        + '<div class="acq-row"><span>估值</span><b>' + money(cost) + '</b></div>'
        + (b.acquired
          ? '<div class="acq-hint" style="color:#9aa093">已并入你的公司。</div>'
          : elig.ok
            ? '<button class="btn btn-sm btn-secondary acq-btn" data-action="acq-buy" data-id="' + esc(b.id) + '">发起收购 · ' + money(cost) + '</button>'
            : '<div class="acq-hint">' + esc(elig.reason) + '</div>')
        + '</div>';
    }).join('');
    return '<div class="section-toolbar" style="margin-top:24px"><div>'
      + '<div class="section-label"><span class="num">02</span> 收购 / ACQUISITION</div>'
      + '<div class="faint" style="font-size:9px;margin-top:3px">当对手份额跌破 4%、在六个区域都不是第一、且与你关系恶劣时，才能发起收购。</div>'
      + '</div><span class="badge">现金 ' + money(game.company.cash) + '</span></div>'
      + '<div class="acq-grid">' + cards + '</div>';
  }

  window.FocusUI = {
    renderFocusPage, renderDetail, renderFocusDetail: renderDetail, renderSpirits, renderAcquisitionSection,
    ensureStyles, money, mount, zoomBy
  };
})();
