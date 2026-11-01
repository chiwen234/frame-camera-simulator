/* FRAME — 新闻播报系统
   世界大事：所有人可见；国策完成：只有自己可见 */
(function () {
  'use strict';


  /* 事件 → 配图 */
  const NEWS_IMG = {
    w_quota: 'news-quota', w_leak: 'news-quota', w_cut: 'news-cutoff',
    w_meeting: 'news-meeting', w_mount: 'news-mount', w_dji: 'news-dji',
    w_quake: 'news-quake', w_japan: 'news-quake', w_red: 'news-red',
    w_export: 'news-embargo', w_antitrust: 'news-cutoff',
    w_report: 'news-meeting', w_report2: 'news-meeting',
    w_merge: 'news-dji', w_congress: 'news-mount', w_final: 'news-cutoff', w_end: 'news-red'
  };
  function imgFor(id) {
    const base = NEWS_IMG[id];
    return base ? 'assets/art/' + base + '.png' : null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function ensureCSS() {
    if (document.getElementById('news-css')) return;
    var el = document.createElement('style');
    el.id = 'news-css';
    el.textContent = [
      '.news-layer{position:fixed;right:18px;bottom:18px;z-index:9000;display:flex;flex-direction:column;gap:8px;max-width:420px;pointer-events:none}',
      '.news-card{pointer-events:auto;border:1px solid #4a4034;background:linear-gradient(180deg,#1b1712,#12100c);box-shadow:0 10px 30px rgba(0,0,0,.6);animation:newsIn .22s ease-out}',
      '@keyframes newsIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
      '.news-card.is-major{border-color:#d8a65a}',
      '.news-head{display:flex;align-items:center;gap:8px;padding:7px 11px;border-bottom:1px solid #332c21;font-size:9px;letter-spacing:.12em;color:#8d8677}',
      '.news-head .dot{width:6px;height:6px;background:#c85a4a}',
      '.news-head .tag{margin-left:auto;padding:1px 6px;border:1px solid #4a4034;color:#c9a35c;font-size:8px}',
      '.news-body{padding:10px 12px 12px}',
      '.news-title{font-size:14px;color:#f0e2c0;letter-spacing:.04em;margin-bottom:6px}',
      '.news-text{font-size:10.5px;line-height:1.75;color:#a99c82}',
      '.news-opt{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
      '.news-opt button{flex:1 1 auto;min-width:120px;padding:6px 10px;border:1px solid #4a4034;background:#1f1a14;color:#d6ccb6;font-size:10px;cursor:pointer;text-align:left}',
      '.news-opt button:hover{border-color:#d8a65a;color:#f0e2c0}',
      '.news-close{margin-left:auto;border:0;background:none;color:#7d7466;cursor:pointer;font-size:13px;line-height:1}',
      '.news-archive{border:1px solid #3a3226;background:#100e0b}',
      '.news-row{display:flex;gap:10px;padding:7px 11px;border-bottom:1px solid #221c15;font-size:10px;color:#a99c82}',
      '.news-row:hover{background:rgba(216,166,90,.05)}',
      '.news-row .d{color:#7d7466;font-variant-numeric:tabular-nums;flex:0 0 58px}',
      '.news-row .t{color:#d6ccb6;flex:1}',
      '.news-row .g{color:#c9a35c;font-size:9px}'
    ].join('\n');
    document.head.appendChild(el);
  }

  /* 取待处理事件队列 */
  function pending(game) {
    var st = game.events || { pending: [] };
    return (st.pending || []).map(function (id) {
      return window.FrameEvents ? window.FrameEvents.findEvent(id) : null;
    }).filter(Boolean);
  }

  /* 渲染浮层（放 body 末尾） */
  function renderLayer(game) {
    ensureCSS();
    var layer = document.getElementById('news-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'news-layer';
      layer.className = 'news-layer';
      document.body.appendChild(layer);
    }
    var list = pending(game);
    if (!list.length) { layer.innerHTML = ''; return; }
    var ev = list[0];
    var major = ev.tag === '紧急' || ev.tag === '重大' || ev.tag === '终局';
    var opts = (ev.options || []).map(function (o, i) {
      return '<button data-action="news-choose" data-id="' + esc(ev.id) + '" data-i="' + i + '">' + esc(o.label) + '</button>';
    }).join('');
    if (list.length > 1) opts += '<button data-action="news-next" style="flex:0 0 auto;min-width:60px;opacity:.7">下一个 (' + list.length + ')</button>';

    layer.innerHTML = '<div class="news-card' + (major ? ' is-major' : '') + '">'
      + '<div class="news-head"><span class="dot"></span>'
      + (2026 + Math.floor((game.monthIndex || 0) / 12)) + '.' + String(((game.monthIndex || 0) % 12) + 1).padStart(2, '0')
      + '<span class="tag">' + esc(ev.tag || '事件') + '</span>'
      + '<button class="news-close" data-action="news-skip" data-id="' + esc(ev.id) + '">×</button></div>'
      + '<div class="news-body">'
      + (imgFor(ev.id) ? '<img src="' + imgFor(ev.id) + '" style="width:100%;height:104px;object-fit:cover;display:block;margin-bottom:9px;border:1px solid #332c21" alt="">' : '')
      + '<div class="news-title">' + esc(ev.title) + '</div>'
      + '<div class="news-text">' + esc(ev.text) + '</div>'
      + '<div class="news-opt">' + opts + '</div>'
      + '</div></div>';
  }

  /* 归档列表（用于新闻档案面板） */
  function renderArchive(game) {
    ensureCSS();
    var list = (game.news || []);
    if (!list.length) return '<div style="padding:20px;font-size:11px;color:#7d7466">还没有任何播报。</div>';
    var rows = list.map(function (n) {
      var cls = n.kind === 'private' ? '国策' : (n.kind === 'intel' ? '情报' : '世界');
      return '<div class="news-row">'
        + '<span class="d">' + n.year + '.' + String(n.month).padStart(2, '0') + '</span>'
        + '<span class="t">' + esc(n.title) + '</span>'
        + '<span class="g">' + cls + '</span></div>';
    }).join('');
    return '<div class="news-archive">' + rows + '</div>';
  }

  window.NewsUI = { renderLayer: renderLayer, renderArchive: renderArchive, pending: pending, ensureCSS: ensureCSS };
})();
