/* =========================================================
   FRAME · Camera Company Simulator — interface layer
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const E = window.GameEngine;
  const P = window.Preview;
  const ART = window.FrameArt;
  const ART3D = window.FrameArt3D;
  const PHOTO = window.FramePhoto;
  const PHOTO_DATA = window.FRAME_PHOTO_LIB;

  const bootRoot = document.getElementById('boot-root');
  const appEl = document.getElementById('app');
  const sidebarEl = document.getElementById('sidebar');
  const topbarEl = document.getElementById('topbar');
  const viewEl = document.getElementById('view');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  let game = null;
  let saveTimer = null;
  let savePending = false;
  let processing = false;
  let showcaseCache = '';
  let lastModalFocus = null;

  const PAGE_META = {
    overview: { label: '公司总览', group: '经营' },
    products: { label: '产品中心', group: '经营' },
    design: { label: '设计工作室', group: '经营' },
    gallery: { label: '参考图库', group: '素材' },
    research: { label: '研发中心', group: '经营' },
    chips: { label: '芯片实验室', group: '经营' },
    market: { label: '市场情报', group: '市场' },
    marketing: { label: '营销中心', group: '市场' },
    events: { label: '发布会', group: '市场' },
    operations: { label: '供应链与团队', group: '公司' },
    finance: { label: '财务中心', group: '公司' },
    settings: { label: '设置与帮助', group: '系统' },
    'studio-camera': { label: '相机设计', group: '设计' },
    'studio-lens': { label: '镜头设计', group: '设计' }
  };

  const UI = {
    boot: {
      mode: 'takeover',
      companyId: 'canon',
      startup: {
        name: '光屿影像', en: 'AURA', hq: '深圳 · 中国', positioning: '独立影像品牌',
        archetype: 'minimal', style: 'industrial', difficulty: 'indie',
        targetSegment: 'enthusiast', accentColor: '#a8b8ba', mainColor: '#272b2b'
      }
    },
    savePeek: null,
    page: 'overview',
    productTab: 'cameras',
    productFilter: 'all',
    marketTab: 'overview',
    marketCategory: 'all',
    marketSort: 'new',
    supplyTab: 'production',
    studioStep: 1,
    previewView: 'front',
    previewMode: 'photo',
    artPhotoView: 'hero',
    artGhost: false,
    galleryTab: 'photos',
    chipTab: 'cmos',
    galleryBrand: 'all',
    galleryCat: 'all',
    previewAnnotations: true,
    previewWire: false,
    lensStep: 1,
    lensView: 'side',
    modal: null,
    lastReport: null,
    bootHelp: false,
    sidebarOpen: false
  };

  const SEGMENT_ICONS = {
    consumer: 'users', enthusiast: 'aperture', professional: 'briefcase',
    creator: 'video', cinema: 'film', sports: 'target'
  };

  const SEGMENT_LABELS = D.SEGMENTS;

  // ---------- icon system ----------
  const ICON_PATHS = {
    logo: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.6"/><path d="M12 3.8v3M20.2 12h-3M12 20.2v-3M3.8 12h3"/>',
    overview: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.2"/><path d="M8.5 11.2h.01"/>',
    lens: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.8v2.4M20.2 12h-2.4M12 20.2v-2.4M3.8 12h2.4"/>',
    design: '<path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z"/><path d="M4.5 7.3L12 11.7l7.5-4.4M12 11.7V21"/>',
    flask: '<path d="M9.2 3h5.6M10 3v6.2L4.7 18a2.1 2.1 0 0 0 1.8 3.1h11a2.1 2.1 0 0 0 1.8-3.1L14 9.2V3"/><path d="M7.4 14.5h9.2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h2l4 4h2v-5"/><path d="M6 15l13 4V4L6 10v5z"/><path d="M19 8a4 4 0 0 1 0 8"/>',
    factory: '<path d="M3 21V9l5 3V8l5 3V4h4l4 4v13z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M16 12h5v5h-5a2.5 2.5 0 0 1 0-5z"/><path d="M3 9h13"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.3"/><circle cx="8" cy="17" r="2.3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowLeft: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    arrowUpRight: '<path d="M7 17L17 7M7 7h10v10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 6.5"/>',
    alert: '<path d="M12 3L2.5 20.5h19z"/><path d="M12 9v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    sparkles: '<path d="M12 3l1.6 4.7L18.5 9l-4.9 1.3L12 15l-1.6-4.7L5.5 9l4.9-1.3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 3l.6 1.8L7.5 5.5l-1.9.7L5 8l-.6-1.8-1.9-.7 1.9-.7z"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 19v2h16v-2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/>',
    coins: '<ellipse cx="8" cy="6" rx="5" ry="2.5"/><path d="M3 6v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V6"/><path d="M11 12v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5"/><ellipse cx="16" cy="12" rx="5" ry="2.5"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2"/><path d="M16 5a3 3 0 0 1 0 6M17 13h1a4 4 0 0 1 4 4v3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="M8.5 12l2.3 2.3 4.7-4.8"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    sliders: '<path d="M4 6h5M13 6h7M4 12h9M17 12h3M4 18h3M11 18h9"/><circle cx="11" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
    ruler: '<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 0-4h-.6a2 2 0 0 1 0-4H16a5 5 0 0 0 5-5c0-3-4-5-9-5z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="7" r=".8"/><circle cx="14" cy="7" r=".8"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    refresh: '<path d="M20 8a8.5 8.5 0 1 0 .2 7M20 3v5h-5"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    aperture: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5l4.3 7.5M20.5 12h-8.6M16.5 20l-4.3-7.5M7.5 20l4.3-7.5M3.5 12h8.6M7.5 4l4.3 7.5"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    wrench: '<path d="M14.5 6a4.5 4.5 0 0 0-6 6L3 17.5 6.5 21l5.5-5.5a4.5 4.5 0 0 0 6-6L14.5 13 11 9.5z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H4V5h6"/>',
    xcircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    checkcircle: '<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-6.5"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/>',
    pen: '<path d="M4 20l4.5-1 11-11-3.5-3.5-11 11z"/><path d="M13.5 6.5L17 10"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 7V3M15 7V3M9 21v-4M15 21v-4M7 9H3M7 15H3M21 9h-4M21 15h-4"/>',
    power: '<path d="M12 3v9"/><path d="M6 6.5a8 8 0 1 0 12 0"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    crown: '<path d="M3 8l4 3 5-7 5 7 4-3-2 11H5z"/>',
    hand: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V10M14 10V6a1.5 1.5 0 0 1 3 0v7.5M8 11V8.5a1.5 1.5 0 0 0-3 0V14c0 4 2.6 6.5 6.5 6.5h1.1c3.3 0 5.4-1.8 5.4-5V10"/>',
    warning: '<path d="M12 3L2.8 19.5h18.4z"/><path d="M12 9v5M12 17h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4 16.9l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };

  function icon(name, cls) {
    const path = ICON_PATHS[name] || ICON_PATHS.info;
    return `<svg class="${cls || ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  // ---------- tiny helpers ----------
  const esc = E.escapeHTML;
  const deepClone = obj => obj == null ? obj : JSON.parse(JSON.stringify(obj));
  const money = E.money;
  const moneyNumber = E.moneyNumber;
  const units = E.units;
  const monthLabel = E.monthLabel;
  const monthShort = E.monthShort;
  const clamp = E.clamp;
  const pctNum = E.pctNum;

  function attr(v) { return esc(v == null ? '' : v); }
  function signed(v, digits) {
    if (!Number.isFinite(v)) return '—';
    const d = digits == null ? 0 : digits;
    return (v > 0 ? '+' : '') + v.toFixed(d);
  }
  function signedMoney(v) {
    if (!Number.isFinite(v)) return '—';
    return (v > 0 ? '+' : v < 0 ? '-' : '') + money(Math.abs(v));
  }
  function percentFrom(value, total) { return total > 0 ? clamp(value / total * 100, 0, 100) : 0; }
  function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
  function dateOf(product) { return game ? monthShort(Math.max(-24, game.monthIndex - (product.ageMonths || 0))) : '—'; }
  function activeProducts() { return game ? game.products.filter(p => p.status === 'active') : []; }
  function activeLenses() { return game ? game.lenses.filter(p => p.status === 'active') : []; }
  function latestProduct() {
    return [...activeProducts()].sort((a, b) => (b.releaseMonthIndex ?? -999) - (a.releaseMonthIndex ?? -999))[0] || activeProducts()[0];
  }
  function overviewProduct() {
    const active = activeProducts();
    if (!active.length) return null;
    return [...active].sort((a, b) => (b.overall || 0) - (a.overall || 0))[0];
  }
  function getDraft(scope) { return scope === 'lens' ? game.drafts.lens : game.drafts.camera; }
  function getCameraKitLens(draft) {
    if (!game || !draft || !draft.kitLensId) return null;
    return E.getKitLens(game, { kitLensId: draft.kitLensId, design: draft });
  }
  function categoryData(id) { return D.CATEGORIES[id] || D.CATEGORIES.mirrorless; }
  function segmentData(id) { return D.SEGMENTS[id] || D.SEGMENTS.enthusiast; }
  function scoreTone(score) {
    if (score >= 88) return 'good';
    if (score >= 75) return 'accent';
    if (score >= 62) return '';
    return 'bad';
  }
  function initials(name) {
    const s = String(name || 'FR').trim();
    if (!s) return 'FR';
    if (/[\u4e00-\u9fa5]/.test(s)) return s.slice(0, 1);
    return s.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  function productTypeName(p) {
    if (!p) return '—';
    return p.kind === 'lens' ? '镜头' : categoryData(p.category).name;
  }
  function formatSalary(v) { return money(v) + '/月'; }
  function statusLabel(status) {
    if (status === 'active') return '<span class="dot good"></span>在售';
    if (status === 'discontinued') return '<span class="dot faint"></span>已停产';
    return '<span class="dot accent"></span>研发中';
  }
  function humanizeMinutes(v) {
    if (!Number.isFinite(v)) return '—';
    return Math.round(v) + ' 分钟';
  }
  function scoreBar(value, max) {
    return `<div class="progress"><i style="width:${clamp((value / (max || 100)) * 100, 0, 100)}%"></i></div>`;
  }
  function toneClass(tone) { return tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : ''; }

  // ---------- chart helpers ----------
  function lineChart(series, labels, opts) {
    opts = opts || {};
    const width = 600, height = opts.height || 176;
    const padL = 38, padR = 14, padT = 16, padB = 24;
    const innerW = width - padL - padR, innerH = height - padT - padB;
    const allValues = series.flatMap(s => s.values).filter(Number.isFinite);
    if (!allValues.length) allValues.push(0);
    let max = Math.max(...allValues, 1);
    let min = Math.min(...allValues, 0);
    if (opts.zeroFixed !== false) { max = Math.max(max, 1); }
    const range = max - min || 1;
    max = max + range * .14;
    const pointCount = Math.max(2, labels.length);
    const xFor = i => padL + (pointCount <= 1 ? 0 : i * innerW / (pointCount - 1));
    const yFor = v => padT + (1 - (v - min) / (max - min || 1)) * innerH;
    const gridLines = 4;
    const uid = 'chart-' + Math.random().toString(36).slice(2, 8);
    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="经营趋势图">`;
    svg += `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.color || 'var(--accent)'}" stop-opacity=".2"/><stop offset="1" stop-color="${opts.color || 'var(--accent)'}" stop-opacity="0"/></linearGradient></defs>`;
    for (let g = 0; g <= gridLines; g++) {
      const y = padT + g * innerH / gridLines;
      svg += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" class="chart-grid-line"/>`;
      const val = min + (1 - g / gridLines) * (max - min);
      svg += `<text x="${padL - 6}" y="${y + 3}" text-anchor="end" class="chart-label">${opts.shortValue ? opts.shortValue(val) : compactNumber(val)}</text>`;
    }
    labels.forEach((label, i) => {
      if (labels.length > 8 && i % Math.ceil(labels.length / 6) !== 0 && i !== labels.length - 1) return;
      svg += `<text x="${xFor(i)}" y="${height - 7}" text-anchor="${i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}" class="chart-label">${esc(label)}</text>`;
    });
    series.forEach((s, si) => {
      const values = s.values;
      if (!values.length) return;
      let area = '';
      const pts = values.map((v, i) => [xFor(i), yFor(v)]);
      const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      if (s.area && si === 0) {
        area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${padT + innerH} L${pts[0][0].toFixed(1)},${padT + innerH} Z`;
        svg += `<path d="${area}" fill="url(#${uid})" opacity=".8"/>`;
      }
      svg += `<path d="${path}" fill="none" stroke="${s.color || 'var(--accent)'}" stroke-width="${s.width || 1.8}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="4 4"' : ''}/>`;
      const last = pts[pts.length - 1];
      if (last && !opts.hideDots) svg += `<circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="${s.color || 'var(--accent)'}" stroke="var(--panel)" stroke-width="2"/>`;
    });
    svg += `</svg>`;
    return svg;
  }

  function compactNumber(v) {
    const abs = Math.abs(v);
    if (abs >= 100000000) return (v / 100000000).toFixed(1) + '亿';
    if (abs >= 10000) return (v / 10000).toFixed(0) + '万';
    if (abs >= 1000) return (v / 1000).toFixed(1) + 'k';
    return Math.round(v);
  }

  function sparkline(values, opts) {
    opts = opts || {};
    const width = 110, height = 30;
    const max = Math.max(...values, 1), min = Math.min(...values, 0);
    const x = i => 2 + i * (width - 4) / Math.max(1, values.length - 1);
    const y = v => 3 + (1 - (v - min) / (max - min || 1)) * (height - 5);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" class="sparkline" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${opts.color || 'var(--accent)'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // ---------- showcase render ----------
  function buildShowcase() {
    if (showcaseCache) return showcaseCache;
    if (PHOTO && PHOTO.items.length) {
      const picks = [
        PHOTO.forModel('canon', 'EOS R5 Mark II', 'highres'),
        PHOTO.forModel('sony', 'Alpha 1 II', 'sports'),
        PHOTO.forModel('fujifilm', 'X-T5', 'mirrorless')
      ].filter(Boolean);
      if (picks.length) {
        const hero = picks[0];
        showcaseCache = `<div class="showcase-photo">
          
          
          
          <img src="${attr(PHOTO.url(hero.item))}" alt="${attr(hero.item.brand + ' ' + hero.item.model)} 实拍参考">
          
          
          
          <div class="showcase-caption"><div><b>${esc(hero.label)}</b><br><span>REAL CAMERA / LOCAL PHOTO LIBRARY</span></div><span>${PHOTO.items.length} 台实拍 · ${PHOTO.brands().length} 品牌</span></div>
        </div>`;
        return showcaseCache;
      }
    }
    const showcaseCompany = {
      id: 'frame-showcase', name: 'FRAME', en: 'FRAME', mark: 'FRAME', isReal: false, color: '#d8a65a',
      tech: { sensor: 5, video: 5, af: 5, ibis: 5, color: 5, codec: 5, cooling: 5, battery: 5, screen: 5, optics: 5, material: 5, modular: 5, software: 5 },
      staff: { engineers: 42, designers: 28, qc: 15, marketing: 20, sales: 20 }, catalog: [], lensCatalog: [],
      design: { mainColor: '#202322', finish: 'anodized', material: 'magnesium', accent: '#d8a65a' }
    };
    try {
      const d = E.makeCameraDraft('fullframe', showcaseCompany, {});
      d.name = 'FRAME / 001';
      d.body.type = 'mirrorless'; d.body.silhouette = 'rounded'; d.body.top = 'prism'; d.body.front = 'big_grip';
      d.body.width = 141; d.body.height = 102; d.body.depth = 77; d.body.gripH = 58; d.body.gripD = 62; d.body.gripCurve = 60;
      d.body.roundness = 42; d.body.weatherSealed = true;
      d.materials.body = 'magnesium'; d.materials.finish = 'anodized'; d.materials.frame = 'metal'; d.materials.topPlate = 'metal';
      d.colors.main = '#1e2120'; d.colors.top = '#bdb9ae'; d.colors.grip = '#252827'; d.colors.accent = '#d8a65a'; d.colors.secondaryOn = true; d.colors.secondary = '#bcb8ad'; d.colors.nameplate = '#d9d5cb'; d.colors.button = '#3b3e3b'; d.colors.dial = '#3d403d'; d.colors.accentLine = true;
      d.screen.type = 'sideflip'; d.screen.size = 3.2; d.screen.nits = 1600; d.screen.touch = true;
      d.viewfinder.type = 'pro'; d.viewfinder.pos = 'top_center';
      d.mount.type = 'E'; d.mount.ringColor = 'silver'; d.mount.ringMaterial = 'stainless';
      d.controls.dials = { front: true, rear: true, mode: true, extra: false };
      d.controls.buttons.c1 = { enabled: true, pos: 'top_left' };
      d.details = { vents: true, knurl: false, nameplate: true, redline: true, goldring: true, bluering: false, cage: false, handle: false, expansion: false, portstyling: false };
      d.accessories = { batteryGrip: false, verticalGrip: false, mic: false, monitor: false, fan: false, cage: false, shoulder: false, wireless: false, flash: false };
      showcaseCache = P.renderCamera(d, showcaseCompany, { view: 'front', annotations: true, idPrefix: 'showcase' });
      return showcaseCache;
    } catch (e) {
      console.error('showcase render failed', e);
      return '';
    }
  }

  // ---------- persistence ----------
  function updateSaveState(state) {
    const pill = document.querySelector('.save-pill');
    if (!pill) return;
    if (state === 'saving') { pill.classList.add('is-saving'); pill.textContent = '正在保存'; }
    else if (state === 'error') { pill.classList.add('is-error'); pill.textContent = '保存失败'; }
    else {
      pill.classList.remove('is-saving', 'is-error');
      const t = new Date();
      pill.textContent = '已保存 ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
    }
  }

  function persist(immediate) {
    if (!game) return;
    savePending = true;
    updateSaveState('saving');
    clearTimeout(saveTimer);
    const run = () => {
      const result = E.saveGame(game);
      savePending = false;
      if (result.ok) updateSaveState('saved');
      else { updateSaveState('error'); showToast(result.error || '保存失败', 'bad'); }
    };
    if (immediate) run();
    else saveTimer = setTimeout(run, 850);
  }

  // ---------- boot ----------
  function renderBoot() {
    const peek = UI.savePeek;
    const mode = UI.boot.mode;
    const selected = D.COMPANIES.find(c => c.id === UI.boot.companyId) || D.COMPANIES[0];
    const takeoverContent = `
      <div class="company-grid">
        ${D.COMPANIES.map(c => `
          
          
          
          <button class="company-card ${c.id === selected.id ? 'is-active' : ''}" style="--brand-c:${attr(c.color)}" data-boot-company="${attr(c.id)}">
          
          
          
            <div class="company-card-name"><span class="company-logo" style="--brand-c:${attr(c.color)}">${esc(c.logo || initials(c.name))}</span>${esc(c.name)}</div>
          
          
          
            <div class="company-card-en">${esc(c.en)} · ${esc(c.hq)}</div>
          
          
          
            <div class="company-card-tag">${esc(c.positioning)}</div>
          
          
          
            <div class="company-card-stats"><span>口碑 <b>${c.reputation}</b></span><span>在售 <b>${c.catalog.length}</b></span><span>基础份额 <b>${(c.startingShare || 0).toFixed(1)}%</b></span></div>
          
          
          
          </button>`).join('')}
      </div>
      <div class="company-selection">
        <div class="company-selected-row">
          
          
          
          <div>
          
          
          
            <div class="company-selected-title">${esc(selected.name)} <span class="faint" style="font-size:9px;font-family:var(--font-mono);margin-left:5px">${esc(selected.en)}</span></div>
          
          
          
            <div class="company-selected-sub">${esc(selected.brief)}</div>
          
          
          
          </div>
          
          
          
          <span class="badge accent">${esc(selected.playstyle)}</span>
        </div>
        <div class="company-selected-extra">
          
          
          
          ${selected.strengths.slice(0, 4).map(s => `<span class="mini-tag">${esc(s)}</span>`).join('')}
        </div>
        <div class="company-selected-stats">
          
          
          
          <div class="company-selected-stat"><label>接管现金</label><b>${money(selected.cash)}</b></div>
          
          
          
          <div class="company-selected-stat"><label>品牌认知</label><b>${selected.awareness} / 100</b></div>
          
          
          
          <div class="company-selected-stat"><label>继承产品线</label><b>${selected.catalog.length} 台 + ${selected.lensCatalog.length} 支镜头</b></div>
        </div>
        ${(() => {
          
          
          
          if (!ART) return '';
          
          
          
          const refs = ART.referenceModels({ company: selected, category: 'mirrorless', limit: 4 });
          
          
          
          if (!refs.length) return '';
          
          
          
          return `<div class="boot-brand-dna">
          
          
          
            <div class="boot-brand-dna-head"><span>${icon('eye')} 已载入品牌外形基准</span><b>${esc(selected.positioning)}</b></div>
          
          
          
            <div class="boot-brand-dna-grid">
          
          
          
              ${refs.map(m => {
          
          
          
                const ph = photoForRefModel(m);
          
          
          
                return `<div class="boot-brand-ref">${ph
          
          
          
                  ? `<img src="${attr(PHOTO.url(ph.item))}" alt="${attr(m.name)} 实拍参考" loading="lazy">`
          
          
          
                  : `<canvas data-boot-ref="${attr(m.id)}"></canvas>`}<span>${esc(m.name)}</span><em>${esc(m.year)} · ${esc(m.mount)}</em></div>`;
          
          
          
              }).join('')}
          
          
          
            </div>
          
          
          
            <div class="boot-brand-dna-note">接管后，产品图直接使用该品牌的真实机型照片；新设计会继承这套比例与设计语言，不再生成假外观。</div>
          
          
          
          </div>`;
        })()}
      </div>`;
    const startup = UI.boot.startup;
    const startupContent = `
      <div class="startup-form">
        <div>
          
          
          
          <div class="form-section-label">01 / 公司身份</div>
          
          
          
          <div class="form-grid-2">
          
          
          
            <div class="form-field"><label>公司名称</label><input class="text-input" maxlength="18" value="${attr(startup.name)}" data-boot-field="name" placeholder="例如：光屿影像"></div>
          
          
          
            <div class="form-field"><label>英文 / 品牌缩写</label><input class="text-input" maxlength="18" value="${attr(startup.en)}" data-boot-field="en" placeholder="例如：AURA"></div>
          
          
          
          </div>
          
          
          
          <div class="form-grid-2 mt-8">
          
          
          
            <div class="form-field"><label>总部 / 城市</label><input class="text-input" maxlength="24" value="${attr(startup.hq)}" data-boot-field="hq"></div>
          
          
          
            <div class="form-field"><label>品牌定位</label><input class="text-input" maxlength="26" value="${attr(startup.positioning)}" data-boot-field="positioning"></div>
          
          
          
          </div>
        </div>
        <div>
          
          
          
          <div class="form-section-label">02 / 品牌基因</div>
          
          
          
          <div class="arch-grid">
          
          
          
            ${Object.values(D.ARCHETYPES).map(a => `
          
          
          
              <button class="arch-card ${startup.archetype === a.id ? 'is-active' : ''}" data-boot-archetype="${attr(a.id)}">
          
          
          
                <div class="arch-name">${esc(a.name)} <span style="font-family:var(--font-mono);font-size:6.5px;color:var(--faint);margin-left:4px">${esc(a.en)}</span></div>
          
          
          
                <div class="arch-desc">${esc(a.desc)}</div>
          
          
          
              </button>`).join('')}
          
          
          
          </div>
        </div>
        <div>
          
          
          
          <div class="form-section-label">03 / 工业设计倾向</div>
          
          
          
          <div class="style-swatches">
          
          
          
            ${Object.values(D.STARTUP_STYLES).map(s => `
          
          
          
              <button class="style-swatch ${startup.style === s.id ? 'is-active' : ''}" data-boot-style="${attr(s.id)}" title="${attr(s.desc)}">
          
          
          
                <div class="swatch-colors"><i style="background:${attr(s.design.mainColor)}"></i><i style="background:${attr(s.design.topColor)}"></i><i style="background:${attr(s.design.accent)}"></i></div>
          
          
          
                <label>${esc(s.name)}</label>
          
          
          
              </button>`).join('')}
          
          
          
          </div>
          
          
          
          <div class="accent-colors mt-8">
          
          
          
            ${['#a8b8ba', '#d8a65a', '#b7372c', '#6e8f7d', '#d5a734', '#8eaab7', '#d6d2c7'].map(c => `<button class="accent-dot ${startup.accentColor === c ? 'is-active' : ''}" style="background:${c}" data-boot-accent="${c}" title="品牌主色 ${c}"></button>`).join('')}
          
          
          
            <span class="faint" style="font-size:8px;align-self:center;margin-left:4px">品牌强调色将用于按钮、饰线和发布视觉。</span>
          
          
          
          </div>
        </div>
        <div>
          
          
          
          <div class="form-section-label">04 / 首要目标人群</div>
          
          
          
          <div class="choice-row">
          
          
          
            ${Object.values(D.SEGMENTS).map(s => `<button class="choice-btn ${startup.targetSegment === s.id ? 'is-active' : ''}" data-boot-audience="${attr(s.id)}">${esc(s.name)}</button>`).join('')}
          
          
          
          </div>
        </div>
        <div>
          
          
          
          <div class="form-section-label">05 / 创业难度</div>
          
          
          
          <div class="difficulty-row">
          
          
          
            ${Object.values(D.DIFFICULTIES).map(d => `
          
          
          
              <button class="difficulty-card ${startup.difficulty === d.id ? 'is-active' : ''}" data-boot-difficulty="${attr(d.id)}">
          
          
          
                <div class="difficulty-name">${esc(d.name)}<span class="difficulty-badge">${esc(d.label)}</span></div>
          
          
          
                <div class="difficulty-desc">${esc(d.desc)}</div>
          
          
          
              </button>`).join('')}
          
          
          
          </div>
        </div>
        <div class="callout">
          
          
          
          <div class="callout-title">${icon('info')} 从零开始意味着什么</div>
          
          
          
          没有继承产品、没有渠道，一切从第一台相机开始。你的品牌基因决定初始技术与团队，视觉风格决定第一版设计语言；之后所有选择都由你重新定义。
        </div>
      </div>`;
    const startLabel = mode === 'takeover' ? `接管 ${selected.name}，开始经营` : `注册 ${esc(startup.name || '新公司')}，开始创业`;
    const archive = peek ? `
      <div class="boot-continue">
        <div class="save-orb">${icon('save')}</div>
        <div class="boot-continue-meta">
          
          
          
          <div class="boot-continue-title">发现本地存档 · ${esc(peek.name || '未命名公司')}</div>
          
          
          
          <div class="boot-continue-sub">${peek.monthLabel || ''} · ${money(peek.cash || 0)} 现金 · 进度已保存</div>
        </div>
        <button class="btn btn-sm btn-secondary" data-action="boot-continue">继续经营</button>
      </div>` : '';
    bootRoot.innerHTML = `
      <div class="boot">
        <div class="boot-aperture"></div>
        <div class="boot-shell">
          
          
          
          <header class="boot-topbar">
          
          
          
            <div class="brand-lockup">
          
          
          
              <span class="brand-mark"></span>
          
          
          
              <div>
          
          
          
                <div class="brand-word">FRAME</div>
          
          
          
                <div class="brand-sub">CAMERA COMPANY SIMULATOR · 2026</div>
          
          
          
              </div>
          
          
          
            </div>
          
          
          
            <div class="boot-topmeta">
          
          
          
              <span class="boot-version">INDUSTRIAL IMAGING SANDBOX / PRIVATE BUILD</span>
          
          
          
              <div class="boot-top-actions">
          
          
          
                <button class="btn btn-ghost btn-sm" data-action="open-help">玩法说明</button>
          
          
          
                ${peek ? `<button class="btn btn-secondary btn-sm" data-action="boot-continue">${icon('play')} 继续存档</button>` : ''}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </header>
          
          
          
          <div class="boot-stage">
          
          
          
            <section class="boot-hero">
          
          
          
              <div>
          
          
          
                <div class="boot-kicker">INDUSTRIAL PRODUCT SIMULATOR · 2026</div>
          
          
          
                <h1 class="boot-title">造一台<br><em>真正想买的</em><br><span class="dim">相机。</span></h1>
          
          
          
                <p class="boot-lede">从一块传感器、一条饰线、一个握柄开始，设计机身与镜头，建立你的影像帝国。参数决定它能不能拍，外形决定用户想不想拿起它。</p>
          
          
          
                <div class="boot-features">
          
          
          
                  <span class="boot-feature">全机身工业设计</span>
          
          
          
                  <span class="boot-feature">实时多视角渲染</span>
          
          
          
                  <span class="boot-feature">真实卡口与市场</span>
          
          
          
                  <span class="boot-feature">动态 AI 竞品</span>
          
          
          
                </div>
          
          
          
              </div>
          
          
          
              <div class="boot-hero-visual">
          
          
          
                ${buildShowcase()}
          
          
          
              </div>
          
          
          
              <div class="boot-trust">
          
          
          
                <span>新公司 / 接管巨头</span><span>单机本地存档</span><span>无联机 · 无内购</span><span>2026 现代影像市场</span>
          
          
          
              </div>
          
          
          
            </section>
          
          
          
            <section class="boot-console">
          
          
          
              <div class="boot-console-head">
          
          
          
                <div>
          
          
          
                  <div class="console-label">STARTING POINT / ${mode === 'takeover' ? 'TAKEOVER' : 'FROM SCRATCH'}</div>
          
          
          
                  <div class="console-title">选择你的起点</div>
          
          
          
                </div>
          
          
          
                <span class="badge ${peek ? 'good' : 'accent'}">${peek ? '检测到本地存档' : '新游戏'}</span>
          
          
          
              </div>
          
          
          
              <div class="boot-modes">
          
          
          
                <button class="boot-mode ${mode === 'takeover' ? 'is-active' : ''}" data-boot-mode="takeover">
          
          
          
                  <div class="boot-mode-top"><span class="mode-dot"></span>接管真实公司</div>
          
          
          
                  <div class="boot-mode-desc">继承品牌、技术积累、产品线与供应链，从巨人的肩膀上重新出发。</div>
          
          
          
                </button>
          
          
          
                <button class="boot-mode ${mode === 'startup' ? 'is-active' : ''}" data-boot-mode="startup">
          
          
          
                  <div class="boot-mode-top"><span class="mode-dot"></span>从零新建公司</div>
          
          
          
                  <div class="boot-mode-desc">自定义名称、审美、目标人群和品牌基因。用第一台相机定义你是谁。</div>
          
          
          
                </button>
          
          
          
              </div>
          
          
          
              <div class="boot-console-body">
          
          
          
                ${mode === 'takeover' ? takeoverContent : startupContent}
          
          
          
              </div>
          
          
          
              <div class="boot-console-foot">
          
          
          
                ${archive}
          
          
          
                <div class="boot-start-row">
          
          
          
                  <div class="boot-start-note">
          
          
          
                    
          
          
          ${mode === 'takeover'
          
          
          
                    
          
          
            ? `<strong>${esc(selected.name)}</strong> 已拥有真实产品组合与品牌资产。你将直接面对 2026 年的竞争。`
          
          
          
                    
          
          
            : `<strong>${esc(startup.name || '新公司')}</strong> 将获得 ${money(D.DIFFICULTIES[startup.difficulty]?.cash || 150000000)} 启动资金。第一台相机决定品牌的第一印象。`}
          
          
          
                  </div>
          
          
          
                  <button class="btn btn-primary btn-lg" data-action="boot-start">${icon('arrowRight')} ${startLabel}</button>
          
          
          
                </div>
          
          
          
              </div>
          
          
          
            </section>
          
          
          
          </div>
          
          
          
          <div class="boot-mobile-dock">
          
          
          
            <div class="boot-mobile-dock-meta"><b>${mode === 'takeover' ? esc(selected.name) : esc(startup.name || '新公司')}</b><span>${mode === 'takeover' ? '接管现有品牌与产品线' : '从零建立你的影像公司'}</span></div>
          
          
          
            <button class="btn btn-primary" data-action="boot-start">${mode === 'takeover' ? '接管并开始' : '创建并开始'}</button>
          
          
          
          </div>
        </div>
      </div>`;
    drawBootRefs();
  }

  // ---------- app shell ----------
  function navItem(page, iconName, label, badge) {
    const meta = PAGE_META[page];
    const active = UI.page === page || (page === 'design' && ['studio-camera', 'studio-lens'].includes(UI.page));
    return `<button class="nav-item ${active ? 'is-active' : ''}" data-action="nav" data-page="${page}" title="${esc(meta ? meta.label : label)}">
      ${icon(iconName)}<span class="nav-label">${esc(label)}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}
    </button>`;
  }

  function renderSidebar() {
    if (!game) return '';
    const c = game.company;
    const activeCams = activeProducts().length;
    const activeLensCount = activeLenses().length;
    const projectCount = (c.projects || []).length;
    const meta = PAGE_META[UI.page] || PAGE_META.overview;
    return `
      <div class="sidebar-brand">
        <span class="brand-mark"></span>
        <div>
          
          
          
          <div class="brand-word">FRAME</div>
          
          
          
          <div class="brand-sub">CAMERA CO. / ${game.mode === 'takeover' ? 'TAKEOVER' : 'FOUNDER'} EDITION</div>
        </div>
      </div>
      <div class="sidebar-company">
        <div class="sidebar-company-top">
          
          
          
          <span class="sidebar-company-name">${esc(c.name)}</span>
          
          
          
          <span class="sidebar-company-tag">${game.mode === 'takeover' ? '接管' : '自建'}</span>
        </div>
        <div class="sidebar-company-meta">
          
          
          
          <span>${E.monthLabel(game.monthIndex)}</span>
          
          
          
          <span>份额 <b>${(c.share || 0).toFixed(1)}%</b></span>
          
          
          
          <span>口碑 <b>${c.reputation.toFixed(0)}</b></span>
        </div>
        <div class="sidebar-company-line"><i style="width:${clamp(c.awareness, 0, 100)}%"></i></div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">经营 / OPERATIONS</div>
        <nav class="nav-list">
          
          
          
          ${navItem('overview', 'overview', '公司总览')}
          
          
          
          ${navItem('products', 'camera', '产品中心', activeCams + activeLensCount)}
          
          
          
          ${navItem('design', 'design', '设计工作室', game.drafts.camera || game.drafts.lens ? '●' : '')}
          
          
          
          ${navItem('research', 'flask', '研发中心', projectCount ? projectCount : '')}
          ${navItem('chips', 'cpu', '芯片实验室', game.company.chipPrograms && game.company.chipPrograms.length ? game.company.chipPrograms.length : '')}
          
          
          
          ${navItem('gallery', 'eye', '参考图库', 'REF')}
        </nav>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">市场 / MARKET</div>
        <nav class="nav-list">
          
          
          
          ${navItem('market', 'globe', '市场情报')}
          
          
          
          ${navItem('marketing', 'megaphone', '营销中心')}
          ${navItem('events', 'megaphone', '发布会', (game.launchEvents || []).length ? (game.launchEvents || []).length : '')}
        </nav>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">公司 / COMPANY</div>
        <nav class="nav-list">
          
          
          
          ${navItem('operations', 'factory', '供应链与团队')}
          
          
          
          ${navItem('finance', 'wallet', '财务中心')}
        </nav>
      </div>
      <div class="sidebar-spacer"></div>
      <div class="sidebar-footer">
        ${navItem('settings', 'settings', '设置与帮助')}
        <div class="sidebar-foot-row"><span class="save-pill">已保存</span><b>v1.2</b></div>
        <div class="sidebar-foot-row"><span>FRAME SYSTEM</span><b>${esc(meta.label)}</b></div>
      </div>`;
  }

  function renderTopbar() {
    if (!game) return '';
    const c = game.company;
    const meta = PAGE_META[UI.page] || PAGE_META.overview;
    const unread = game.news && game.news.length;
    return `
      <div class="topbar-left">
        <button class="icon-btn mobile-menu-btn" data-action="toggle-sidebar" aria-label="打开导航">${icon('menu')}</button>
        <div class="topbar-context">
          
          
          
          <div class="topbar-breadcrumb">FRAME / ${esc(meta.group)} / <b>${esc(meta.label)}</b></div>
          
          
          
          <div class="topbar-title">${esc(meta.label)}<span class="topbar-date">${E.monthLabel(game.monthIndex)}</span></div>
        </div>
      </div>
      <div class="topbar-actions">
        <div class="resource-chips">
          
          
          
          <div class="resource-chip">
          
          
          
            <span class="resource-icon">${icon('coins')}</span>
          
          
          
            <div class="resource-meta"><label>现金</label><b class="${c.cash < 0 ? 'is-negative' : ''}">${money(c.cash)}</b></div>
          
          
          
          </div>
          
          
          
          <div class="resource-chip">
          
          
          
            <span class="resource-icon">${icon('trend')}</span>
          
          
          
            <div class="resource-meta"><label>估值</label><b>${money(E.companyValuation(game))}</b></div>
          
          
          
          </div>
          
          
          
          <div class="resource-chip">
          
          
          
            <span class="resource-icon">${icon('target')}</span>
          
          
          
            <div class="resource-meta"><label>份额</label><b>${(c.share || 0).toFixed(1)}%</b></div>
          
          
          
          </div>
        </div>
        <button class="icon-btn ${unread ? 'has-dot' : ''}" data-action="open-news" aria-label="行业动态">${icon('bell')}</button>
        <button class="advance-btn" data-action="advance-month">${icon('play')}<span>推进一月</span></button>
      </div>`;
  }

  function renderPage() {
    if (!game) return '';
    switch (UI.page) {
      case 'products': return renderProductsPage();
      case 'design': return renderDesignHub();
      case 'gallery': return renderGalleryPage();
      case 'studio-camera': return renderCameraStudio();
      case 'studio-lens': return renderLensStudio();
      case 'research': return renderResearchPage();
      case 'chips': return renderChipsPage();
      case 'events': return renderEventsPage();
      case 'market': return renderMarketPage();
      case 'marketing': return renderMarketingPage();
      case 'operations': return renderOperationsPage();
      case 'finance': return renderFinancePage();
      case 'settings': return renderSettingsPage();
      case 'overview':
      default: return renderOverviewPage();
    }
  }

  function renderApp(options) {
    if (!game) return;
    options = options || {};
    const scrollY = window.scrollY;
    document.body.classList.toggle('reduce-motion', !!(game.settings && game.settings.reducedMotion));
    appEl.classList.remove('is-hidden');
    appEl.setAttribute('aria-hidden', 'false');
    appEl.classList.toggle('sidebar-open', !!UI.sidebarOpen);
    bootRoot.innerHTML = '';
    sidebarEl.innerHTML = renderSidebar();
    topbarEl.innerHTML = renderTopbar();
    viewEl.innerHTML = renderPage();
    paintArtCanvases(viewEl);
    fillArtShots(viewEl);
    if (UI.page === 'gallery') {
      drawGallerySilhouettes(viewEl);
      galleryPhotos(viewEl);
      fillGalleryCacheStat();
    }
    if (options.preserveScroll) window.scrollTo({ top: scrollY, behavior: 'auto' });
    else window.scrollTo({ top: 0, behavior: options.scrollSmooth ? 'smooth' : 'auto' });
    updateSaveState('saved');
  }

  function switchPage(page, opts) {
    UI.page = page;
    UI.sidebarOpen = false;
    renderApp(opts);
  }

  // ---------- shared display components ----------
  function pageHead(opts) {
    return `<div class="page-head">
      <div class="page-head-main">
        <div class="eyebrow">${esc(opts.eyebrow || '')}</div>
        <h1 class="page-title">${opts.title || ''}</h1>
        <p class="page-sub">${opts.sub || ''}</p>
      </div>
      <div class="page-actions">${opts.actions || ''}</div>
    </div>`;
  }

  function eventBanner() {
    const mods = (game.market.activeModifiers || []);
    if (!mods.length) return '';
    const mod = mods[0];
    return `<div class="events-banner">
      ${icon('zap')}
      <div><b>市场事件 · ${esc(mod.title)}</b>　${esc(mod.text)} ${mods.length > 1 ? `<span class="event-pill">另有 ${mods.length - 1} 项趋势</span>` : ''}</div>
      <span class="badge ${mod.tone === 'bad' ? 'bad' : mod.tone === 'good' ? 'good' : 'accent'}">剩余 ${mod.expiresIn} 个月</span>
    </div>`;
  }

  function renderShareBars(snapshot, limit) {
    if (!snapshot || !snapshot.brands || !snapshot.brands.length) return '<div class="empty-inline">暂无市场数据。</div>';
    const sorted = [...snapshot.brands].sort((a, b) => b.units - a.units);
    const player = sorted.find(b => b.isPlayer);
    let top = sorted.slice(0, limit || 6);
    if (player && !top.includes(player)) top = [...top.slice(0, (limit || 6) - 1), player];
    top.sort((a, b) => b.units - a.units);
    const max = Math.max(...top.map(b => b.share), 0.01);
    return `<div class="bar-list">
      ${top.map((b, i) => `<div class="bar-list-row ${b.isPlayer ? 'is-player' : ''}">
        <span class="bar-rank">${String(sorted.indexOf(b) + 1).padStart(2, '0')}</span>
        <div class="bar-name"><span class="dot" style="color:${attr(b.color || 'var(--faint)')};background:${attr(b.color || 'var(--faint)')}"></span><span>${esc(b.name)}</span></div>
        <span class="bar-value">${(b.share || 0).toFixed(1)}%</span>
        <div class="bar-track"><i class="${b.isPlayer ? 'player' : ''}" style="width:${clamp((b.share / max) * 100, 1, 100)}%;${b.isPlayer ? 'background:var(--accent)' : `background:${attr(b.color || '#666b62')};opacity:.55`}"></i></div>
      </div>`).join('')}
    </div>`;
  }

  function marketSnapshotSafe() {
    if (!game) return null;
    if (!game.market.snapshot) {
      try {
        return E.computeMarketSnapshot(game, E.getPlayerUnitsByCategory(game, 'forecast'), { monthIndex: game.monthIndex });
      } catch (e) { return null; }
    }
    return game.market.snapshot;
  }

  function currentFinancial() {
    const last = game.lastReport;
    const snapshot = marketSnapshotSafe();
    return {
      last,
      revenue: last ? last.revenueNet : 0,
      profit: last ? last.netProfit : 0,
      cameraUnits: last ? last.cameraUnits : 0,
      lensUnits: last ? last.lensUnits : 0,
      cash: game.company.cash,
      share: game.company.share || 0,
      snapshot
    };
  }

  function runwayMonths() {
    const fixed = E.monthlyFixedCost(game);
    const burn = Object.values(fixed).reduce((a, b) => a + b, 0);
    if (game.company.cash <= 0) return 0;
    if (game.lastReport && game.lastReport.netProfit > 0) return Infinity;
    return Math.floor(game.company.cash / Math.max(1, burn));
  }

  function dashboardChart() {
    const hist = (game.history || []).slice(-12);
    if (hist.length < 2 || !game.lastReport) {
      return `<div class="chart-placeholder">
        <div class="chart-placeholder-grid"></div>
        <span class="chart-placeholder-icon">${icon('chart')}</span>
        <b>第一份月度账本还没有开始。</b>
        <span>推进一个月后，营收、利润与现金曲线会在这里生长。</span>
        <button class="btn btn-sm btn-secondary" data-action="advance-month">${icon('play')} 推进一月</button>
      </div>`;
    }
    const labels = hist.map(h => String(h.label).split('.')[1] || h.label);
    const revenue = hist.map(h => h.revenue || 0);
    const profit = hist.map(h => h.profit || 0);
    return `<div class="chart-wrap">${lineChart([
      { values: revenue, color: 'var(--accent)', area: true },
      { values: profit, color: 'var(--good)', width: 1.4 }
    ], labels, { height: 180, shortValue: compactNumber })}</div>
    <div class="chart-legend mt-8"><span><i class="legend-mark"></i>净营收</span><span><i class="legend-mark good"></i>净利润</span><span style="margin-left:auto">最近 ${hist.length} 个月</span></div>`;
  }

  function renderOverviewPage() {
    const c = game.company;
    const fin = currentFinancial();
    const snap = fin.snapshot;
    const heroProduct = overviewProduct();
    const active = activeProducts();
    const activeLs = activeLenses();
    const latestReport = game.lastReport;
    const avgReview = active.length ? Math.round(avg(active.map(p => p.overall))) : 0;
    const cashRunway = runwayMonths();
    const margin = latestReport && latestReport.revenueNet > 0 ? latestReport.netProfit / latestReport.revenueNet : 0;
    const heroDesign = heroProduct ? heroProduct.design : null;
    const heroKit = heroProduct ? E.getKitLens(game, heroProduct) : null;
    const heroPhoto = heroProduct ? photoForProduct(heroProduct) : null;
    const heroSVG = heroPhoto ? photoImg(heroPhoto, 'is-hero', heroDesign.name) : '';
    const draft = game.drafts.camera;
    const projects = c.projects || [];
    const topNews = (game.news || []).slice(0, 4);
    const milestoneDone = D.MILESTONES.filter(m => game.milestones && game.milestones[m.id]).length;
    const milestoneNext = D.MILESTONES.find(m => !(game.milestones && game.milestones[m.id]));
    const nextProgress = milestoneNext ? E.milestoneProgress(game, milestoneNext.id) : null;
    const lowCash = c.cash < 0;
    return `
      <section class="overview-hero">
        <div class="hero-copy">
          
          
          
          <div>
          
          
          
            <div class="hero-kicker">COMPANY OVERVIEW / ${E.monthShort(game.monthIndex)} ${game.mode === 'takeover' ? '· TAKEOVER' : '· FOUNDER'}</div>
          
          
          
            <h1 class="hero-title">${esc(c.name)}<span class="thin"> · 全球影像业务</span></h1>
          
          
          
            <p class="hero-desc">${esc(c.brief || c.tagline || '从一台相机开始，建立你的影像公司。')}</p>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="hero-stats">
          
          
          
              <div class="hero-stat"><label>在售产品</label><b>${active.length} 台 / ${activeLs.length} 支</b></div>
          
          
          
              <div class="hero-stat"><label>目标品类</label><b>${new Set(active.map(p => p.category)).size} / 10</b></div>
          
          
          
              <div class="hero-stat"><label>公司口碑</label><b>${c.reputation.toFixed(0)} / 100</b></div>
          
          
          
              <div class="hero-stat"><label>团队规模</label><b>${E.companyStaffCount(c)} 人</b></div>
          
          
          
              <div class="hero-stat"><label>市值估算</label><b>${money(E.companyValuation(game))}</b></div>
          
          
          
            </div>
          
          
          
            <div class="hero-actions">
          
          
          
              <button class="btn btn-primary" data-action="new-camera">${icon('plus')} 设计新相机</button>
          
          
          
              <button class="btn btn-secondary" data-action="advance-month">${icon('play')} 推进一月</button>
          
          
          
              <button class="btn btn-ghost" data-action="nav" data-page="products">查看产品线 ${icon('arrowRight')}</button>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="hero-visual">
          
          
          
          <div class="hero-visual-bg"></div>
          
          
          
          <span class="hero-visual-label">LIVE PRODUCT / ${heroProduct ? escapeText(heroProduct.name) : 'EMPTY SLOT'}</span>
          
          
          
          ${heroProduct && heroPhoto && (heroPhoto.substitute || heroPhoto.crossBrand) ? '<span class="real-photo-badge is-ref hero-photo-flag">实拍参考</span>' : ''}
          
          
          
          ${heroProduct ? heroSVG : `<div class="hero-empty">${icon('camera')}<b>还没有一台自己的相机</b><span>从传感器、按键到一块皮革，开始设计第一台真正属于你的产品。</span><button class="btn btn-sm btn-primary" data-action="new-camera">开始设计 ${icon('arrowRight')}</button></div>`}
          
          
          
          ${heroProduct ? `<div class="hero-visual-meta"><div><div class="name">${esc(heroProduct.name)}</div><div class="cat">${esc(categoryData(heroProduct.category).name)} · 评分 ${heroProduct.overall}</div></div><div class="hero-visual-price">${moneyNumber(heroProduct.price)}<small>建议零售价</small></div></div>` : ''}
        </div>
      </section>
      ${eventBanner()}
      ${draft ? `<div class="callout accent mb-16" style="display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap"><div><div class="callout-title">${icon('edit')} 有一份未完成的设计草稿：${esc(draft.name)}</div><span>${esc(categoryData(draft.category).name)} · ${esc(segmentData(draft.targetSegment).name)} · ${D.SENSOR_FORMATS[draft.sensor.format].name} ${draft.sensor.mp}MP</span></div><button class="btn btn-sm btn-primary" data-action="resume-camera-draft">继续设计 ${icon('arrowRight')}</button></div>` : ''}
      <div class="kpi-grid">
        <div class="kpi ${lowCash ? 'is-accent' : ''}">
          
          
          
          <div class="kpi-head"><span class="kpi-label">现金储备</span><span class="kpi-icon">${icon('wallet')}</span></div>
          
          
          
          <div class="kpi-value">${money(c.cash)}</div>
          
          
          
          <div class="kpi-meta">${lowCash ? '<span class="down">现金为负，请立即融资</span>' : `<span>${cashRunway === Infinity ? '<span class="up">已实现经营正循环</span>' : '约 ' + cashRunway + ' 个月固定支出储备'}</span>`}<span style="margin-left:auto">负债 ${money(c.debt)}</span></div>
        </div>
        <div class="kpi">
          
          
          
          <div class="kpi-head"><span class="kpi-label">上期净营收</span><span class="kpi-icon">${icon('receipt')}</span></div>
          
          
          
          <div class="kpi-value">${latestReport ? money(latestReport.revenueNet) : '—'}</div>
          
          
          
          <div class="kpi-meta">${latestReport ? `净利润 <span class="${latestReport.netProfit >= 0 ? 'up' : 'down'}">${signedMoney(latestReport.netProfit)}</span>` : '推进一个月后结算'}</div>
        </div>
        <div class="kpi">
          
          
          
          <div class="kpi-head"><span class="kpi-label">上期相机销量</span><span class="kpi-icon">${icon('camera')}</span></div>
          
          
          
          <div class="kpi-value">${latestReport ? latestReport.cameraUnits.toLocaleString('zh-CN') : '—'}<small>台</small></div>
          
          
          
          <div class="kpi-meta">${latestReport ? `镜头 ${latestReport.lensUnits.toLocaleString('zh-CN')} 支` : '尚无销售记录'}</div>
        </div>
        <div class="kpi">
          
          
          
          <div class="kpi-head"><span class="kpi-label">全球销量份额</span><span class="kpi-icon">${icon('target')}</span></div>
          
          
          
          <div class="kpi-value">${fin.share.toFixed(1)}<small>%</small></div>
          
          
          
          <div class="kpi-meta">${snap ? `全球第 ${snap.playerRank} 名 / 市场 ${units(snap.totalDemand)}` : '等待市场数据'}</div>
        </div>
      </div>
      <div class="dash-grid">
        <div class="dash-col">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header">
          
          
          
              <div><div class="panel-title">${icon('chart')} 营收与盈利</div><div class="panel-sub">公司现金、净营收与经营利润的月度变化。数字以最后结算月为准。</div></div>
          
          
          
              <div class="panel-actions"><span class="badge">${E.monthLabel(game.monthIndex)}</span></div>
          
          
          
            </div>
          
          
          
            <div class="panel-body">${dashboardChart()}</div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header">
          
          
          
              <div><div class="panel-title">${icon('layers')} 在售产品矩阵</div><div class="panel-sub">公司当前的相机与镜头组合，以及上个月的销量表现。</div></div>
          
          
          
              <div class="panel-actions"><button class="link-btn" data-action="nav" data-page="products">完整产品中心 →</button></div>
          
          
          
            </div>
          
          
          
            <div class="panel-body">
          
          
          
              ${active.length || activeLs.length ? `<div class="portfolio-strip">
          
          
          
                ${active.slice(0, 3).map(p => `<button class="portfolio-mini" data-action="open-product" data-id="${attr(p.id)}">
          
          
          
                  <div class="portfolio-mini-stage is-photo">${photoImg(photoForProduct(p), '', p.name)}</div>
          
          
          
                  <div class="portfolio-mini-info"><div class="portfolio-mini-name">${esc(p.name)}</div><div class="portfolio-mini-meta"><span>${esc(categoryData(p.category).short)}</span><b>${(p.lastUnits || 0).toLocaleString('zh-CN')} 台</b></div></div>
          
          
          
                </button>`).join('')}
          
          
          
                ${activeLs.slice(0, Math.max(0, 3 - active.length)).map(p => `<button class="portfolio-mini" data-action="open-product" data-id="${attr(p.id)}">
          
          
          
                  <div class="portfolio-mini-stage">${P.renderLens(p.design, c, { view: 'side', compact: true, idPrefix: 'mini' })}</div>
          
          
          
                  <div class="portfolio-mini-info"><div class="portfolio-mini-name">${esc(p.name)}</div><div class="portfolio-mini-meta"><span>镜头</span><b>${(p.lastUnits || 0).toLocaleString('zh-CN')} 支</b></div></div>
          
          
          
                </button>`).join('')}
          
          
          
                ${(active.length + activeLs.length) < 3 ? `<button class="portfolio-mini" data-action="new-camera" style="display:flex;align-items:center;justify-content:center;min-height:145px;color:var(--faint);font-size:9px;background:rgba(255,255,255,.012);border-style:dashed"><span>${icon('plus')}<br>扩充产品线</span></button>` : ''}
          
          
          
              </div>` : `<div class="empty-inline">暂无在售产品。<button class="link-btn" data-action="new-camera">立项第一台相机 →</button></div>`}
          
          
          
              <div class="grid-3 mt-16">
          
          
          
                <div class="metric-row"><label>平均媒体评分</label><b>${avgReview || '—'}</b></div>
          
          
          
                <div class="metric-row"><label>品牌认知度</label><b>${c.awareness.toFixed(0)} / 100</b></div>
          
          
          
                <div class="metric-row"><label>用户口碑</label><b>${c.reputation.toFixed(0)} / 100</b></div>
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header">
          
          
          
              <div><div class="panel-title">${icon('users')} 品牌与团队状态</div><div class="panel-sub">营销投入和研发进度是长期资产的复利。</div></div>
          
          
          
              <div class="panel-actions"><button class="link-btn" data-action="nav" data-page="operations">团队与供应链 →</button></div>
          
          
          
            </div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="grid-2">
          
          
          
                <div>
          
          
          
                  <div class="mini-label mb-8">品牌健康度</div>
          
          
          
                  <div class="metric-row"><label>品牌认知</label><b>${c.awareness.toFixed(1)}</b></div>
          
          
          
                  <div class="progress mb-8"><i style="width:${clamp(c.awareness, 0, 100)}%"></i></div>
          
          
          
                  <div class="metric-row"><label>用户口碑</label><b>${c.reputation.toFixed(1)}</b></div>
          
          
          
                  <div class="progress progress good"><i style="width:${clamp(c.reputation, 0, 100)}%"></i></div>
          
          
          
                </div>
          
          
          
                <div>
          
          
          
                  <div class="mini-label mb-8">研发管道</div>
          
          
          
                  ${projects.length ? projects.slice(0, 2).map(p => `<div class="metric-row"><label>${esc(p.techName)} Lv.${p.targetLevel}</label><b>${Math.round(p.progress / p.requiredPoints * 100)}%</b></div><div class="progress thin mb-8"><i style="width:${clamp(p.progress / p.requiredPoints * 100, 0, 100)}%"></i></div>`).join('') : '<div class="empty-inline">实验室空闲中。<button class="link-btn" data-action="nav" data-page="research">开始研发 →</button></div>'}
          
          
          
                  <div class="metric-row"><label>研发力量</label><b>${Math.round(E.researchPower(c))} RP / 月</b></div>
          
          
          
                </div>
          
          
          
              </div>
          
          
          
              <div class="milestone-list mt-16">
          
          
          
                ${D.MILESTONES.slice(0, 4).map(m => {
          
          
          
                  const done = game.milestones && game.milestones[m.id];
          
          
          
                  const prog = E.milestoneProgress(game, m.id);
          
          
          
                  return `<div class="milestone ${done ? 'is-done' : ''}"><div class="milestone-top">${icon(done ? 'checkcircle' : m.icon || 'star')}${esc(m.name)}</div><div class="milestone-progress"><span>${done ? '已达成' : esc(prog.display)}</span><span>${done ? '✓' : ''}</span></div></div>`;
          
          
          
                }).join('')}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="dash-col">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header">
          
          
          
              <div><div class="panel-title">${icon('target')} 市场份额</div><div class="panel-sub">按上期全球销量估算 · 共 ${snap ? snap.brands.length : 0} 个品牌</div></div>
          
          
          
              <div class="panel-actions"><button class="link-btn" data-action="nav" data-page="market">详细市场 →</button></div>
          
          
          
            </div>
          
          
          
            <div class="panel-body">${renderShareBars(snap, 6)}</div>
          
          
          
            <div class="panel-footer" style="border-top:1px solid var(--line)">
          
          
          
              <span class="mini-label">你的排名</span><b style="font-family:var(--font-mono);font-size:12px;color:var(--accent-bright)">第 ${snap ? snap.playerRank : '—'} 名</b>
          
          
          
              <span class="faint" style="font-size:8px">上期销量 ${units(fin.cameraUnits)}</span>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header">
          
          
          
              <div><div class="panel-title">${icon('bell')} 行业动态</div><div class="panel-sub">竞品发布、市场趋势与公司新闻。</div></div>
          
          
          
              <div class="panel-actions"><button class="link-btn" data-action="open-news">全部动态 →</button></div>
          
          
          
            </div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="news-list">
          
          
          
                ${topNews.map(n => `<div class="news-item">
          
          
          
                  <div class="news-date">${esc(String(n.date || '').split('.')[1] || n.date || '')}</div>
          
          
          
                  <div class="news-body"><div class="news-title">${esc(n.title)}</div><div class="news-text">${esc(n.text)}</div><span class="news-tag">${esc(n.tag)}</span></div>
          
          
          
                </div>`).join('') || '<div class="empty-inline">暂无动态。</div>'}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('sparkles')} 本月建议</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="tips-list">
          
          
          
                ${active.length === 0 ? '<div class="tip"><span><b>先立项一台相机。</b>选择产品线、定义外形，再推向市场。</span></div>' : ''}
          
          
          
                ${active.length && fin.cameraUnits < 100 ? '<div class="tip"><span><b>销量还很低。</b>用营销提升品牌认知，或重新审视定价与目标人群。</span></div>' : ''}
          
          
          
                ${projects.length === 0 ? '<div class="tip"><span><b>研发实验室空闲。</b>技术等级限制参数上限，提前规划下一代产品。</span></div>' : ''}
          
          
          
                ${c.awareness < 35 ? '<div class="tip"><span><b>品牌认知不足。</b>增加月度营销预算，或在上市时选择更完整的发布节奏。</span></div>' : ''}
          
          
          
                ${reportStockout() ? '<div class="tip"><span><b>渠道缺货。</b>上期有产品损失需求，检查产能与备货。</span></div>' : ''}
          
          
          
                <div class="tip"><span><b>外形不是换壳。</b>拆卸式握柄、按键分区和材质都会影响专业感与握持评分。</span></div>
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
      </div>`;
  }

  function reportStockout() {
    return !!(game.lastReport && game.lastReport.stockouts && game.lastReport.stockouts.length);
  }

  // ---------- products page ----------
  function productCardCamera(p) {
    const kit = E.getKitLens(game, p);
    const cat = categoryData(p.category);
    const tone = scoreTone(p.overall);
    const photo = photoForProduct(p);
    return `<article class="product-card" data-action="open-product" data-id="${attr(p.id)}">
      <div class="product-preview is-photo">
        <div class="product-preview-badges"><span class="badge">${esc(cat.short)}</span>${p.isSeed ? '<span class="badge">继承产品</span>' : ''}${p.kitLensName ? '<span class="badge">套装</span>' : ''}</div>
        <span class="product-preview-index">${esc(E.monthShort(p.releaseMonthIndex ?? 0))} / ${p.status === 'active' ? 'LIVE' : 'ARCHIVE'}</span>
        ${photoImg(photo, 'is-product', p.name)}${photoBadge(photo)}
      </div>
      <div class="product-body">
        <div class="product-overline"><span>${esc(cat.short)} · ${esc(segmentData(p.targetSegment).name)}</span><span>${p.status === 'active' ? statusLabel(p.status) : statusLabel(p.status)}</span></div>
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-price-row"><span class="product-price">${moneyNumber(p.price)} <small>机身</small>${kit ? ` <small>· 套装 ${moneyNumber(p.price + kit.price)}</small>` : ''}</span><span class="product-score"><span class="score-disc ${tone === 'bad' ? 'bad' : ''}">${p.overall}</span></span></div>
        <div class="product-metrics">
          
          
          
          <div class="product-metric"><label>上期销量</label><b>${(p.lastUnits || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
          <div class="product-metric"><label>库存</label><b>${(p.stock || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
          <div class="product-metric"><label>需求预测</label><b>${p.lastForecast ? p.lastForecast.toLocaleString('zh-CN') : '—'}</b></div>
        </div>
        <div class="product-footer">
          
          
          
          <span class="product-status">${p.status === 'active' ? '<span class="dot good"></span>在售' : '<span class="dot faint"></span>已停产'} · ${p.defectRate.toFixed(1)}% 故障率</span>
          
          
          
          <div class="product-actions"><button class="btn btn-sm btn-ghost" data-action="open-product" data-id="${attr(p.id)}">详情 ${icon('arrowRight')}</button></div>
        </div>
      </div>
    </article>`;
  }

  function productCardLens(p) {
    const shot = registerLensShot('card-lens-' + p.id, p.design, { size: 'card', width: 720, height: 470 });
    return `<article class="product-card" data-action="open-product" data-id="${attr(p.id)}">
      <div class="product-preview is-photo">
        <div class="product-preview-badges"><span class="badge">${esc(D.LENS_TYPES[p.lensType] ? D.LENS_TYPES[p.lensType].name : '镜头')}</span>${p.isSeed ? '<span class="badge">继承产品</span>' : ''}</div>
        <span class="product-preview-index">${esc(p.mount.type)} / ${p.status === 'active' ? 'LIVE' : 'ARCHIVE'}</span>
        ${shotImg(shot, 'is-product', p.name)}<span class="real-photo-badge is-ref">3D 示意</span>
      </div>
      <div class="product-body">
        <div class="product-overline"><span>${esc(D.LENS_TYPES[p.lensType]?.name || '镜头')} · ${esc(segmentData(p.targetSegment).name)}</span><span>${p.status === 'active' ? '<span class="dot good"></span>在售' : '<span class="dot faint"></span>停产'}</span></div>
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-price-row"><span class="product-price">${moneyNumber(p.price)} <small>${Number(p.focalMin) === Number(p.focalMax) ? '定焦' : '变焦'}</small></span><span class="product-score"><span class="score-disc">${p.overall}</span></span></div>
        <div class="product-metrics">
          
          
          
          <div class="product-metric"><label>上期销量</label><b>${(p.lastUnits || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
          <div class="product-metric"><label>库存</label><b>${(p.stock || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
          <div class="product-metric"><label>需求预测</label><b>${p.lastForecast ? p.lastForecast.toLocaleString('zh-CN') : '—'}</b></div>
        </div>
        <div class="product-footer">
          
          
          
          <span class="product-status">${p.mount.type} 卡口 · ${p.weight}g · ${p.defectRate.toFixed(1)}% 故障率</span>
          
          
          
          <div class="product-actions"><button class="btn btn-sm btn-ghost" data-action="open-product" data-id="${attr(p.id)}">详情 ${icon('arrowRight')}</button></div>
        </div>
      </div>
    </article>`;
  }

  function renderDrafts() {
    const dCam = game.drafts.camera;
    const dLens = game.drafts.lens;
    if (!dCam && !dLens) return `<div class="empty-state">
      <div class="empty-icon">${icon('edit')}</div><h3>没有未完成的设计</h3>
      <p>相机和镜头都可以从零设计。设计草稿会自动保存在本地，你可以先去推进月份，再回来继续。</p>
      <button class="btn btn-primary" data-action="new-camera">设计一台相机</button>
    </div>`;
    return `<div class="grid-2">
      ${dCam ? `<div class="panel" style="padding:16px">
        <div class="product-overline"><span>相机设计草稿</span><span class="badge accent">未上市</span></div>
        <div class="product-name mt-8">${esc(dCam.name)}</div>
        <div class="muted" style="font-size:9px;margin-top:4px">${esc(categoryData(dCam.category).name)} · ${esc(segmentData(dCam.targetSegment).name)} · ${D.SENSOR_FORMATS[dCam.sensor.format].name} ${dCam.sensor.mp}MP</div>
        <div class="draft-thumb mt-12" style="width:100%;height:150px">${P.renderCamera(dCam, game.company, { view: 'front', annotations: false, compact: true, idPrefix: 'draft' })}</div>
        <div class="flex gap-6 mt-12"><button class="btn btn-sm btn-primary" data-action="resume-camera-draft">继续设计</button><button class="btn btn-sm btn-ghost" data-action="discard-camera-draft">丢弃</button></div>
      </div>` : ''}
      ${dLens ? `<div class="panel" style="padding:16px">
        <div class="product-overline"><span>镜头设计草稿</span><span class="badge accent">未上市</span></div>
        <div class="product-name mt-8">${esc(dLens.name)}</div>
        <div class="muted" style="font-size:9px;margin-top:4px">${esc(D.LENS_TYPES[dLens.lensType]?.name || '镜头')} · ${esc(dLens.mount.type)} 卡口 · ${dLens.focalMin}${dLens.focalMax !== dLens.focalMin ? '–' + dLens.focalMax : ''}mm F${dLens.maxAperture}</div>
        <div class="draft-thumb mt-12" style="width:100%;height:150px">${P.renderLens(dLens, game.company, { view: 'side', compact: true, idPrefix: 'draft' })}</div>
        <div class="flex gap-6 mt-12"><button class="btn btn-sm btn-primary" data-action="resume-lens-draft">继续设计</button><button class="btn btn-sm btn-ghost" data-action="discard-lens-draft">丢弃</button></div>
      </div>` : ''}
    </div>`;
  }

  function renderProductsPage() {
    const active = activeProducts();
    const activeLs = activeLenses();
    const avgScore = active.length ? Math.round(avg(active.map(p => p.overall))) : 0;
    const categoriesCovered = new Set(active.map(p => p.category)).size;
    const tab = UI.productTab;
    let list = '';
    if (tab === 'cameras') {
      const filtered = UI.productFilter === 'all' ? active : active.filter(p => p.category === UI.productFilter);
      list = filtered.length ? `<div class="product-grid">${filtered.map(productCardCamera).join('')}</div>` : `<div class="empty-state">
        <div class="empty-icon">${icon('camera')}</div><h3>${active.length ? '这个品类还没有在售产品' : '产品线还是空的'}</h3>
        <p>${active.length ? '从其他品类获得灵感，或者为这个品类设计一台真正有竞争力的新机。' : '相机公司的核心资产是产品。选择产品线，定义外形和规格，把它带进 2026 年的市场。'}</p>
        <button class="btn btn-primary" data-action="new-camera">${icon('plus')} 立项新相机</button>
      </div>`;
    } else if (tab === 'lenses') {
      list = activeLs.length ? `<div class="product-grid">${activeLs.map(productCardLens).join('')}</div>` : `<div class="empty-state">
        <div class="empty-icon">${icon('lens')}</div><h3>还没有自己的镜头</h3>
        <p>镜头是卡口生态的护城河。为你的机身设计一支套机镜头，或者用独立镜头产品吸引其他系统的用户。</p>
        <button class="btn btn-primary" data-action="new-lens">${icon('plus')} 设计第一支镜头</button>
      </div>`;
    } else {
      list = renderDrafts();
    }
    return `
      ${pageHead({
        eyebrow: 'PRODUCT PORTFOLIO / 产品矩阵',
        title: '从一张图纸，到货架上的产品。',
        sub: '管理在售相机、镜头与未完成设计。参数决定产品能力，外形与定价决定它是否被拿起。',
        actions: `<button class="btn btn-secondary" data-action="new-lens">${icon('lens')} 设计镜头</button><button class="btn btn-primary" data-action="new-camera">${icon('plus')} 设计新相机</button>`
      })}
      ${eventBanner()}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><div class="kpi-head"><span class="kpi-label">在售相机</span><span class="kpi-icon">${icon('camera')}</span></div><div class="kpi-value">${active.length}<small>台</small></div><div class="kpi-meta">${active.length ? `平均评分 ${avgScore}` : '等待第一台产品'}</div></div>
        <div class="kpi"><div class="kpi-head"><span class="kpi-label">在售镜头</span><span class="kpi-icon">${icon('lens')}</span></div><div class="kpi-value">${activeLs.length}<small>支</small></div><div class="kpi-meta">${activeLs.length ? '建立卡口生态' : '镜头线待启动'}</div></div>
        <div class="kpi"><div class="kpi-head"><span class="kpi-label">覆盖品类</span><span class="kpi-icon">${icon('grid')}</span></div><div class="kpi-value">${categoriesCovered}<small>/ 10</small></div><div class="kpi-meta">更完整的产品矩阵能提升品牌存在感</div></div>
        <div class="kpi"><div class="kpi-head"><span class="kpi-label">设计草稿</span><span class="kpi-icon">${icon('edit')}</span></div><div class="kpi-value">${(game.drafts.camera ? 1 : 0) + (game.drafts.lens ? 1 : 0)}<small>份</small></div><div class="kpi-meta">自动保存在本地</div></div>
      </div>
      <div class="product-toolbar">
        <div class="tabs">
          
          
          
          <button class="tab ${tab === 'cameras' ? 'is-active' : ''}" data-action="product-tab" data-tab="cameras">相机 <span class="tab-badge">${active.length}</span></button>
          
          
          
          <button class="tab ${tab === 'lenses' ? 'is-active' : ''}" data-action="product-tab" data-tab="lenses">镜头 <span class="tab-badge">${activeLs.length}</span></button>
          
          
          
          <button class="tab ${tab === 'drafts' ? 'is-active' : ''}" data-action="product-tab" data-tab="drafts">设计草稿 <span class="tab-badge">${(game.drafts.camera ? 1 : 0) + (game.drafts.lens ? 1 : 0)}</span></button>
        </div>
        ${tab === 'cameras' ? `<div class="filter-chips">
          
          
          
          <button class="filter-chip ${UI.productFilter === 'all' ? 'is-active' : ''}" data-action="filter-products" data-filter="all">全部</button>
          
          
          
          ${D.CATEGORY_ORDER.map(id => { const count = active.filter(p => p.category === id).length; return `<button class="filter-chip ${UI.productFilter === id ? 'is-active' : ''}" data-action="filter-products" data-filter="${id}">${esc(D.CATEGORIES[id].short || D.CATEGORIES[id].name)}${count ? ' ' + count : ''}</button>`; }).join('')}
        </div>` : ''}
      </div>
      ${list}
      ${tab !== 'drafts' ? `<div class="designer-tip mt-16">${icon('info')}<div>产品上市后价格和产能仍可调整。打开产品详情可以修改售价、选择套机镜头或停产；在生产页设置自动补货策略，避免缺货损失。</div></div>` : ''}
    `;
  }

  // ---------- design hub ----------
  function designLane(scope) {
    const isCamera = scope === 'camera';
    const draft = isCamera ? game.drafts.camera : game.drafts.lens;
    const title = isCamera ? '相机机体设计' : '镜头光学设计';
    const iconName = isCamera ? 'camera' : 'lens';
    const desc = isCamera
      ? '从机身形态、线条、材质、颜色到按键布局与屏幕结构。每一台相机都可以有独立的外形。'
      : '从焦距、光圈、镜片结构到镜身装饰环与对焦齿轮。光学是品牌的技术签名。';
    const meta = draft ? `未完成 · ${draft.name}` : '从一张空白设计稿开始';
    return `<button class="design-lane" data-action="${draft ? (isCamera ? 'resume-camera-draft' : 'resume-lens-draft') : (isCamera ? 'new-camera' : 'new-lens')}">
      <div>
        <span class="lane-icon">${icon(iconName)}</span>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
      <div class="lane-footer">${draft ? '继续当前草稿' : '开始设计'} ${icon('arrowRight')} <span style="font-family:var(--font-mono);font-size:8px;color:var(--faint);margin-left:8px">${esc(meta)}</span></div>
    </button>`;
  }

  function renderDesignHub() {
    const dCam = game.drafts.camera;
    const dLens = game.drafts.lens;
    const active = activeProducts();
    const latest = overviewProduct();
    let visual;
    if (dCam) visual = photoImg(photoForDesign(dCam), 'is-hero', dCam.name);
    else visual = buildShowcase();
    return `
      ${pageHead({
        eyebrow: 'DESIGN STUDIO / 工业设计中心',
        title: '相机不只是参数，它是一种被拿在手里的态度。',
        sub: '在 FRAME 的设计工作台上，尺寸、轮廓、按键、材质、色彩与卡口全部实时联动。你的每一个选择都会被用户看到，也会被市场打分。',
        actions: `<button class="btn btn-secondary" data-action="new-lens">${icon('lens')} 新镜头</button><button class="btn btn-primary" data-action="new-camera">${icon('plus')} 新相机</button>`
      })}
      <section class="design-hub-hero">
        <div class="design-hub-copy">
          
          
          
          <div class="eyebrow">DESIGN IS THE PRODUCT</div>
          
          
          
          <h2>先让它值得<br><span style="font-family:var(--font-serif);font-style:italic;color:var(--accent-bright)">被拿起来。</span></h2>
          
          
          
          <p>参数可以在发布会上被念出来，但外形会在第一眼被感受到。我们提供一台真正的工业设计工具：不只是换颜色，而是决定机身的每一毫米、每一道倒角、每一个手指天然会停下的位置。</p>
          
          
          
          <div class="design-hub-actions">
          
          
          
            <button class="btn btn-primary btn-lg" data-action="${dCam ? 'resume-camera-draft' : 'new-camera'}">${icon('design')} ${dCam ? '继续相机草稿' : '进入相机工作台'}</button>
          
          
          
            <button class="btn btn-secondary btn-lg" data-action="${dLens ? 'resume-lens-draft' : 'new-lens'}">${icon('lens')} ${dLens ? '继续镜头草稿' : '设计镜头'}</button>
          
          
          
          </div>
          
          
          
          <div class="flex gap-16 mt-24" style="flex-wrap:wrap">
          
          
          
            <div><div class="mini-label">设计中的项目</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--text-soft);margin-top:3px">${(dCam ? 1 : 0) + (dLens ? 1 : 0)}</div></div>
          
          
          
            <div><div class="mini-label">已上市产品</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--text-soft);margin-top:3px">${active.length}</div></div>
          
          
          
            <div><div class="mini-label">最近设计</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--text-soft);margin-top:3px">${latest ? escapeText(latest.name) : '—'}</div></div>
          
          
          
          </div>
        </div>
        <div class="design-hub-stage">
          
          
          
          ${visual}
        </div>
      </section>
      <div class="design-lanes">
        ${designLane('camera')}
        ${designLane('lens')}
      </div>
      ${(() => {
        if (!ART) return '';
        const refs = ART.referenceModels({ company: game.company, category: dCam ? dCam.category : 'mirrorless', limit: 5 });
        if (!refs.length) return '';
        const profile = ART.brandFor(game.company);
        return `<div class="panel mb-16 art-hub-panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('eye')} 参考外形基准</div><div class="panel-sub">${esc(profile.notes || '现实机型的结构比例')}</div></div><button class="btn btn-sm btn-secondary" data-action="nav" data-page="gallery">打开参考图库 ${icon('arrowRight')}</button></div>
          
          
          
          <div class="panel-body">
          
          
          
            <div class="art-hub-refs">
          
          
          
              ${refs.map(m => {
          
          
          
                const ph = photoForRefModel(m);
          
          
          
                return `<button class="art-hub-ref" data-action="art-use-model" data-model="${attr(m.id)}">${ph
          
          
          
                  ? `<img src="${attr(PHOTO.url(ph.item))}" alt="${attr(m.name)} 实拍参考" loading="lazy">`
          
          
          
                  : `<canvas data-ref-silhouette="${attr(m.id)}"></canvas>`}<b>${esc(m.name)}</b><span>${m.w} × ${m.h} × ${m.d} mm</span></button>`;
          
          
          
              }).join('')}
          
          
          
            </div>
          
          
          
            <div class="art-hub-note">${icon('info')} 点击任一机型作为新设计的外形基准。所有产品图都由本机 3D 几何重新渲染，比例、握柄、卡口与取景器结构会按真实工业常识约束。</div>
          
          
          
          </div>
        </div>`;
      })()}
      <div class="panel mb-16">
        <div class="panel-header"><div><div class="panel-title">${icon('layers')} 设计维度</div><div class="panel-sub">每一个维度都参与外观评分、人机工学与目标用户匹配度。</div></div></div>
        <div class="panel-body">
          
          
          
          <div class="design-principles">
          
          
          
            <div class="principle"><div class="idx">01</div><h4>形体与比例</h4><p>机身形态、轮廓、顶盖、前脸、长宽高与握柄比例共同构成产品的第一印象。</p></div>
          
          
          
            <div class="principle"><div class="idx">02</div><h4>材料与表面</h4><p>金属、皮革、碳纤维与不同表面处理，影响重量、散热、质感和定价能力。</p></div>
          
          
          
            <div class="principle"><div class="idx">03</div><h4>色彩与标记</h4><p>双色机身、饰线、铭牌、按键与拨轮颜色。限量版不只是营销，它是完整的设计语言。</p></div>
          
          
          
            <div class="principle"><div class="idx">04</div><h4>操控与结构</h4><p>按键数量、位置、拨轮、翻转屏、取景器、卡口和配件，决定它是否真的像一台相机。</p></div>
          
          
          
          </div>
          
          
          
          <div class="designer-tip mt-16">${icon('sparkles')}<div>设计评价不是越高越好。针对目标人群的审美匹配、成本与制造可行性同样重要。电影剧组不会为糖果色买单，街头用户也未必想背着 2kg 的金属笼。</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><div><div class="panel-title">${icon('sparkles')} 当前品牌设计语言</div><div class="panel-sub">${esc(game.company.positioning || '品牌视觉基调')}</div></div></div>
        <div class="panel-body">
          
          
          
          <div class="grid-3">
          
          
          
            <div class="swatch-line"><span class="swatch-large" style="background:${attr(game.company.design?.mainColor || '#222')}"></span><div class="swatch-meta"><b>机身主色</b><span>${esc(game.company.design?.mainColor || '#222222')}</span></div></div>
          
          
          
            <div class="swatch-line"><span class="swatch-large" style="background:${attr(game.company.design?.accent || game.company.color || '#d8a65a')}"></span><div class="swatch-meta"><b>品牌强调色</b><span>${esc(game.company.design?.accent || game.company.color || '#d8a65a')}</span></div></div>
          
          
          
            <div class="swatch-line"><span class="swatch-large" style="background:${attr(game.company.design?.topColor || '#b7b5ac')}"></span><div class="swatch-meta"><b>顶盖参考</b><span>${esc(game.company.design?.topColor || '#b7b5ac')}</span></div></div>
          
          
          
          </div>
        </div>
      </div>`;
  }

  function escapeText(text) { return esc(text); }

  // ---------- boot event support & global events ----------
  function showToast(message, tone, title) {
    if (!toastRoot) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (tone || '');
    el.innerHTML = `${icon(tone === 'bad' ? 'alert' : tone === 'good' ? 'checkcircle' : 'info', 'toast-icon')}<div>${title ? `<b>${esc(title)}</b>　` : ''}${esc(message)}</div><button class="toast-close" data-toast-close aria-label="关闭">×</button>`;
    toastRoot.appendChild(el);
    const close = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220); };
    el.querySelector('[data-toast-close]').addEventListener('click', close);
    setTimeout(close, tone === 'bad' ? 6200 : 4200);
  }

  function closeModal() {
    UI.modal = null;
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
    if (lastModalFocus && typeof lastModalFocus.focus === 'function') { try { lastModalFocus.focus(); } catch (e) {} }
    lastModalFocus = null;
  }

  function openModal(type, data) {
    lastModalFocus = document.activeElement;
    UI.modal = { type, data: data || {} };
    document.body.classList.add('modal-open');
    renderModal();
  }

  function modalShell({ title, eyebrow, sub, body, foot, size, closable }) {
    return `<div class="modal-backdrop" data-action="modal-backdrop">
      <div class="modal ${size || ''}" role="dialog" aria-modal="true" aria-label="${attr(title)}">
        <div class="modal-head">
          
          
          
          <div><div class="eyebrow">${esc(eyebrow || 'FRAME')}</div><div class="modal-title">${esc(title)}</div>${sub ? `<div class="modal-sub">${sub}</div>` : ''}</div>
          
          
          
          <button class="modal-close" data-action="close-modal" aria-label="关闭">${icon('close')}</button>
        </div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>
    </div>`;
  }

  function renderModal() {
    if (!UI.modal) { modalRoot.innerHTML = ''; return; }
    const m = UI.modal;
    if (m.type === 'news') { modalRoot.innerHTML = renderNewsDrawer(); return; }
    let html = '';
    switch (m.type) {
      case 'help': html = modalHelp(); break;
      case 'new-camera': html = modalNewCamera(); break;
      case 'confirm': html = modalConfirm(m.data); break;
      case 'product': html = modalProduct(m.data); break;
      case 'report': html = modalReport(m.data); break;
      case 'launch-confirm': html = modalLaunchConfirm(m.data); break;
      case 'chip-program': html = modalChipProgram(m.data); break;
      case 'launch-event': html = modalLaunchEvent(m.data); break;
      case 'launch-report': html = modalLaunchReport(m.data); break;
      case 'launch-success': html = modalLaunchSuccess(m.data); break;
      case 'welcome': html = modalWelcome(); break;
      case 'ref-model': html = modalReferenceModel(m.data); break;
      case 'ref-lens': html = modalReferenceLens(m.data); break;
      case 'photo': html = modalPhoto(m.data); break;
      default: html = modalShell({ title: '未命名弹窗', body: '<p class="muted">这是一个无效的面板。</p>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    }
    modalRoot.innerHTML = html;
    if (m.type === 'ref-model' || m.type === 'ref-lens') drawGallerySilhouettes(modalRoot);
    if (m.type === 'product' || m.type === 'launch-confirm' || m.type === 'launch-success' || m.type === 'launch-event' || m.type === 'launch-report') fillArtShots(modalRoot);
  }

  // ---------- studio UI helpers ----------
  const CAMERA_STEPS = [
    { id: 1, label: '定位与灵感', short: '定位' },
    { id: 2, label: '机身形态', short: '机身' },
    { id: 3, label: '材质与颜色', short: '材质' },
    { id: 4, label: '操控与屏幕', short: '操控' },
    { id: 5, label: '卡口与配件', short: '配件' },
    { id: 6, label: '影像核心', short: '影像' },
    { id: 7, label: '视频与电源', short: '视频' },
    { id: 8, label: '成本与上市', short: '上市' }
  ];
  const LENS_STEPS = [
    { id: 1, label: '光学规格', short: '光学' },
    { id: 2, label: '镜身与外观', short: '镜身' },
    { id: 3, label: '成本与上市', short: '上市' }
  ];

  const CAMERA_TEMPLATES = [
    {
      id: 'modern_pro', name: '现代专业', desc: '金属机身 · 弧形顶盖 · 专业握持',
      body: { silhouette: 'rounded', top: 'arc', front: 'big_grip', roundness: 42, gripH: 56, gripD: 62, gripCurve: 61 },
      materials: { body: 'magnesium', finish: 'anodized', frame: 'metal', topPlate: 'metal', },
      colors: { main: '#202423', top: '#b9b6ac', grip: '#242826', accent: '#b98a4c', secondaryOn: true, secondary: '#b9b6ac', nameplate: '#d4d0c6', button: '#363a37', dial: '#3b3e3b', accentLine: true },
      controls: { preset: 'pro', dials: { front: true, rear: true, mode: true, extra: false } },
      screen: { type: 'tilt' }, viewfinder: { type: 'pro', pos: 'top_center' },
      details: { vents: true, knurl: false, nameplate: true, redline: true, goldring: false, bluering: false, cage: false, handle: false, expansion: false, portstyling: false },
      accessories: { fan: false, mic: false, monitor: false, cage: false, shoulder: false, grip: 'none' },
      weatherSealed: true
    },
    {
      id: 'heritage', name: '复古旁轴', desc: '铬银 · 皮革 · 机械转盘',
      body: { silhouette: 'retroblock', top: 'flush', front: 'retro_face', roundness: 16, gripH: 24, gripD: 28, gripCurve: 30 },
      materials: { body: 'aluminum', finish: 'leathergrain', frame: 'metal', topPlate: 'metal' },
      colors: { main: '#cfcabf', top: '#c4c0b5', grip: '#5c4636', accent: '#9b7548', secondaryOn: true, secondary: '#c4c0b5', nameplate: '#2e2d28', button: '#3a3832', dial: '#a7a298', accentLine: true },
      controls: { preset: 'retro', dials: { front: true, rear: true, mode: true, extra: true } },
      screen: { type: 'fixed' }, viewfinder: { type: 'eyelevel', pos: 'top_left' },
      details: { vents: false, knurl: true, nameplate: true, redline: false, goldring: true, bluering: false, cage: false, handle: false, expansion: false, portstyling: false },
      accessories: { fan: false, mic: false, monitor: false, cage: false, shoulder: false, grip: 'none' },
      weatherSealed: false
    },
    {
      id: 'cinema', name: '电影工业', desc: '笼架 · 主动散热 · 片场模块',
      body: { silhouette: 'angular', top: 'cine_shoulder', front: 'pro_face', roundness: 8, gripH: 32, gripD: 45, gripCurve: 24 },
      materials: { body: 'magnesium', finish: 'matte', frame: 'metal', topPlate: 'metal' },
      colors: { main: '#141716', top: '#232726', grip: '#202422', accent: '#b74234', secondaryOn: false, secondary: '#3d423e', nameplate: '#c8c5ba', button: '#353a36', dial: '#383c38', accentLine: true },
      controls: { preset: 'video', dials: { front: true, rear: true, mode: true, extra: true } },
      screen: { type: 'tilt' }, viewfinder: { type: 'none', pos: 'top_center' },
      details: { vents: true, knurl: false, nameplate: true, redline: true, goldring: false, bluering: false, cage: true, handle: true, expansion: true, portstyling: true },
      accessories: { fan: true, mic: false, monitor: true, cage: true, shoulder: false, grip: 'none' },
      weatherSealed: true
    },
    {
      id: 'consumer', name: '消费潮流', desc: '明亮双色 · 轻量 · 翻转屏',
      body: { silhouette: 'rounded', top: 'flat', front: 'round_port', roundness: 58, gripH: 12, gripD: 22, gripCurve: 30 },
      materials: { body: 'plastic', finish: 'enamel', frame: 'plastic', topPlate: 'hybrid' },
      colors: { main: '#e3ded2', top: '#d5a734', grip: '#d5a734', accent: '#d5a734', secondaryOn: true, secondary: '#d5a734', nameplate: '#3b3a34', button: '#5e5a50', dial: '#d5a734', accentLine: true },
      controls: { preset: 'minimal', dials: { front: false, rear: true, mode: true, extra: false } },
      screen: { type: 'sideflip' }, viewfinder: { type: 'none', pos: 'top_center' },
      details: { vents: false, knurl: false, nameplate: true, redline: false, goldring: false, bluering: true, cage: false, handle: false, expansion: false, portstyling: false },
      accessories: { fan: false, mic: false, monitor: false, cage: false, shoulder: false, grip: 'none' },
      weatherSealed: false
    },
    {
      id: 'field', name: '户外机能', desc: '橡胶防护 · 军绿 · 全天候',
      body: { silhouette: 'angular', top: 'flush', front: 'big_grip', roundness: 18, gripH: 48, gripD: 53, gripCurve: 48 },
      materials: { body: 'magnesium', finish: 'powder', frame: 'full_rubber', topPlate: 'hybrid' },
      colors: { main: '#4f584c', top: '#3c423a', grip: '#2f342e', accent: '#c58a52', secondaryOn: true, secondary: '#3c423a', nameplate: '#d6d2c6', button: '#222622', dial: '#343934', accentLine: false },
      controls: { preset: 'pro', dials: { front: true, rear: true, mode: true, extra: false } },
      screen: { type: 'tilt' }, viewfinder: { type: 'pro', pos: 'top_center' },
      details: { vents: true, knurl: false, nameplate: true, redline: false, goldring: false, bluering: false, cage: false, handle: false, expansion: true, portstyling: true },
      accessories: { fan: false, mic: false, monitor: false, cage: false, shoulder: false, grip: 'none' },
      weatherSealed: true
    }
  ];

  function optionCard(o) {
    const active = o.active ? 'is-active' : '';
    const locked = o.locked ? 'is-locked' : '';
    const attrs = [];
    if (o.action) attrs.push(`data-action="${attr(o.action)}"`);
    if (o.path) attrs.push(`data-path="${attr(o.path)}"`);
    if (o.value != null && o.action !== 'set-body-type') attrs.push(`data-value="${attr(o.value)}"`);
    if (o.value != null && o.action === 'set-body-type') attrs.push(`data-body-type="${attr(o.value)}"`);
    if (o.valueType) attrs.push(`data-value-type="${attr(o.valueType)}"`);
    if (o.locked) attrs.push('disabled');
    return `<button class="option-card ${active} ${locked} ${o.className || ''}" ${attrs.join(' ')} ${o.id ? `data-id="${attr(o.id)}"` : ''} ${o.style ? `style="${o.style}"` : ''} title="${attr(o.title || o.name || '')}">
      ${o.iconHTML ? `<div class="option-card-icon">${o.iconHTML}</div>` : ''}
      ${o.bodyIcon ? `<div class="body-icon-wrap">${P.bodyIcon(o.bodyIcon)}</div>` : ''}
      <div class="option-card-name">${o.name || ''}${o.locked ? ' ' + icon('lock') : ''}</div>
      ${o.desc ? `<div class="option-card-desc">${o.desc}</div>` : ''}
      ${o.meta ? `<div class="option-card-meta">${o.meta}</div>` : ''}
    </button>`;
  }

  function rangeField(path, label, value, min, max, step, unit, help, extraClass) {
    const id = 'range-' + String(path).replace(/[^a-z0-9]/gi, '-');
    const pct = clamp((Number(value) - Number(min)) / ((Number(max) - Number(min)) || 1) * 100, 0, 100);
    return `<div class="slider-row ${extraClass || ''}">
      <div class="slider-top"><span>${esc(label)}</span><b><span data-range-output="${attr(path)}">${value}</span> <span class="unit">${esc(unit || '')}</span></b></div>
      <input type="range" id="${id}" data-path="${attr(path)}" min="${min}" max="${max}" step="${step || 1}" value="${value}" style="--pct:${pct}%">
      ${help ? `<div class="form-help">${esc(help)}</div>` : ''}
    </div>`;
  }

  function numberRangeField(path, label, value, min, max, step, unit, help, extraClass) {
    const id = 'number-' + String(path).replace(/[^a-z0-9]/gi, '-');
    const pct = clamp((Number(value) - Number(min)) / ((Number(max) - Number(min)) || 1) * 100, 0, 100);
    return `<div class="slider-row ${extraClass || ''}">
      <div class="slider-top"><span>${esc(label)}</span><div class="flex items-center gap-4"><input class="number-input" style="width:65px;padding:4px 6px;font-size:9px;text-align:right" type="number" inputmode="decimal" data-path="${attr(path)}" min="${min}" max="${max}" step="${step || 1}" value="${value}" data-num-pair="${id}"><span class="unit">${esc(unit || '')}</span></div></div>
      <input type="range" id="${id}" data-path="${attr(path)}" min="${min}" max="${max}" step="${step || 1}" value="${value}" style="--pct:${pct}%" data-range-pair="${attr(path)}">
      ${help ? `<div class="form-help">${esc(help)}</div>` : ''}
    </div>`;
  }

  function toggleRow(path, label, value, desc) {
    return `<div class="dial-card">
      <div><label>${esc(label)}</label>${desc ? `<div class="form-help">${esc(desc)}</div>` : ''}</div>
      <button class="toggle ${value ? 'is-on' : ''}" data-action="flip-path" data-path="${attr(path)}" aria-label="${attr(label)}"></button>
    </div>`;
  }

  function colorRow(label, path, value, palette, compact) {
    return `<div class="color-row">
      <span class="color-row-label">${esc(label)}</span>
      <div class="color-palette">
        ${palette.slice(0, compact ? 10 : 16).map(c => `<button class="color-chip ${String(value).toLowerCase() === c.hex.toLowerCase() ? 'is-active' : ''}" style="background:${c.hex}" data-action="set-color" data-path="${attr(path)}" data-value="${c.hex}" title="${attr(c.name)}"></button>`).join('')}
      </div>
      <div class="color-input-wrap"><input type="color" value="${attr(value)}" data-color-path="${attr(path)}" title="自定义颜色"></div>
    </div>`;
  }

  function techLock(level, label) {
    return level ? `<span class="tech-inline">${icon('lock')} ${esc(label)} Lv.${level}</span>` : '';
  }

  function techLabelShort(key) {
    return D.TECHS[key] ? D.TECHS[key].name : key;
  }

  /* =========================================================
     Artwork, reference library and product render integration
     ========================================================= */
  const refPhotoRecords = new Map();
  const refSignatures = new Map();
  let artIdleTimer = 0;

  function artShotOptions(kind, extra) {
    return Object.assign({
      kind: kind || 'camera', view: 'hero', size: 'card',
      width: 760, height: 500, quality: 0.93
    }, extra || {});
  }

  function registerCameraShot(id, design, opts) {
    if (!ART || !design) return id;
    ART.shots.register(id, design, game.company, artShotOptions('camera', Object.assign({
      kitLens: E.getKitLens(game, { design, kitLensId: design.kitLensId })
    }, opts)));
    return id;
  }

  function registerLensShot(id, design, opts) {
    if (!ART || !design) return id;
    ART.shots.register(id, design, game.company, artShotOptions('lens', opts));
    return id;
  }

  function shotImg(id, cls, alt) {
    return `<img class="art-product-img ${cls || ''}" data-art-shot="${attr(id)}" alt="${attr(alt || '产品渲染图')}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;background:#fff">`;
  }

  function fillArtShots(root) {
    if (!ART || !ART.shots || !root) return;
    ART.shots.fill(root).catch(() => {});
  }

  function paintArtCanvases(root, lowRes) {
    if (!root || !ART3D || !game) return;
    const draftCam = game.drafts.camera;
    const draftLens = game.drafts.lens;
    root.querySelectorAll('canvas[data-art-live]').forEach(cv => {
      const kind = cv.dataset.artLive;
      const rect = cv.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      try {
        if (kind === 'lens') {
          
          
          
          if (!draftLens) return;
          
          
          
          ART3D.paintLens(cv, draftLens, game.company, { yaw: -38, pitch: 7, fov: 21, ss: lowRes ? 0.75 : 1 });
        } else {
          
          
          
          if (!draftCam) return;
          
          
          
          const view = ART3D.views[UI.artPhotoView] || ART3D.views.hero;
          
          
          
          ART3D.paint(cv, draftCam, game.company, Object.assign({}, view, {
          
          
          
            kitLens: getCameraKitLens(draftCam),
          
          
          
            adherence: (game.art && game.art.adherence) || 0.7,
          
          
          
            ss: lowRes ? 0.72 : 1
          
          
          
          }));
        }
      } catch (e) { console.warn('[FRAME] live render failed', e); }
    });
    root.querySelectorAll('canvas[data-art-ghost]').forEach(cv => {
      if (!UI.artGhost || !draftCam) return;
      const refs = currentReferenceModels();
      const model = ART.data.modelById(draftCam.referenceModelId) || refs[0];
      if (!model) return;
      const rect = cv.getBoundingClientRect();
      if (rect.width < 20) return;
      try {
        ART.drawModelSilhouette(cv, model, { width: rect.width, height: rect.height, ink: '#3a3d35', accent: '#9a7a44' });
        cv.style.opacity = '.2';
      } catch (e) { /* ignore */ }
    });
    drawGallerySilhouettes(root);
    if (lowRes) {
      if (artIdleTimer) clearTimeout(artIdleTimer);
      artIdleTimer = setTimeout(() => {
        artIdleTimer = 0;
        paintArtCanvases(root, false);
      }, 220);
    }
  }

  function currentReferenceModels() {
    if (!ART || !game) return [];
    try {
      return ART.referenceModels({ company: game.company, category: game.drafts.camera ? game.drafts.camera.category : 'mirrorless', limit: 6 });
    } catch (e) { return []; }
  }

  function artSpecInfo(draft) {
    try {
      return ART.resolveSpec(draft, game.company, {
        kitLens: getCameraKitLens(draft),
        adherence: (game.art && game.art.adherence) || 0.7
      });
    } catch (e) {
      console.warn('[FRAME] spec failed', e);
      return null;
    }
  }

  function structureBadge(spec) {
    if (!spec) return '';
    const pass = spec.meta.checks.filter(c => c.ok).length;
    const total = spec.meta.checks.length;
    const ok = pass === total;
    const brandScore = spec.meta.brandMatch.score;
    return `<div class="art-checks">
      <span class="art-check ${ok ? 'is-ok' : 'is-warn'}">${icon(ok ? 'checkcircle' : 'alert')} 结构校验 ${pass}/${total}</span>
      <span class="art-check ${brandScore >= 78 ? 'is-ok' : 'is-warn'}">${icon('aperture')} 品牌语言 ${brandScore}</span>
      ${spec.meta.corrections.length ? `<span class="art-check is-warn">${icon('wrench')} 已校正 ${spec.meta.corrections.length} 项比例</span>` : `<span class="art-check is-ok">${icon('check')} 参数在现实区间内</span>`}
    </div>`;
  }

  function referenceChips(draft) {
    const refs = currentReferenceModels();
    if (!draft || !refs.length) return '';
    const active = draft.referenceModelId;
    return `<div class="art-refs">
      <span class="art-refs-label">${icon('eye')} 外形基准</span>
      <div class="art-refs-list">
        ${refs.slice(0, 4).map(m => `<button class="art-ref-chip ${active === m.id ? 'is-active' : ''}" data-action="art-use-model" data-model="${attr(m.id)}" title="${attr((ART.data.brandById(m.brand) || {}).name || '')} · ${attr(m.name)}">${esc(m.name)}</button>`).join('')}
      </div>
      <button class="art-ref-link" data-action="nav" data-page="gallery">图库 ${icon('arrowRight')}</button>
    </div>`;
  }

  /* ---------- real photo helpers ---------- */
  function photoForDesign(design) {
    if (!PHOTO || !design) return null;
    try { return PHOTO.forDesign(design, game.company); } catch (e) { return null; }
  }
  function photoForProduct(p) {
    if (!PHOTO || !p) return null;
    try { return PHOTO.forProduct(p, game.company); } catch (e) { return null; }
  }
  function findStructuralModel(item) {
    if (!ART || !item || !PHOTO) return null;
    const pool = ART.data.MODELS.filter(m => m.brand === item.brandId);
    let best = null, bestScore = 0;
    for (const m of pool) {
      const a = PHOTO.modelCompact(item.model), b = PHOTO.modelCompact(m.name);
      let s = 0;
      if (a === b) s = 1;
      else if (a && b && (a.includes(b) || b.includes(a))) s = 0.85;
      else {
        const ta = new Set(a.split(/(?=\d)|(?=[a-z])/g).filter(Boolean));
        const tb = new Set(b.split(/(?=\d)|(?=[a-z])/g).filter(Boolean));
        let inter = 0; ta.forEach(t => { if (tb.has(t)) inter++; });
        s = inter / Math.max(1, Math.min(ta.size, tb.size)) * 0.7;
      }
      if (s > bestScore) { bestScore = s; best = m; }
    }
    return bestScore >= 0.6 ? best : null;
  }
  function photoForRefModel(m) {
    if (!PHOTO || !m) return null;
    try { return PHOTO.forModel ? PHOTO.forModel(m.brand, m.name, m.cat) : PHOTO.match(m.brand, m.name, m.cat); } catch (e) { return null; }
  }
  function photoFitClass(result) {
    const item = result && result.item;
    const fit = item && item.fit ? item.fit : (item && item.clean ? 'contain' : 'cover');
    return 'fit-' + fit;
  }
  function photoImg(result, extraClass, alt) {
    if (!result || !result.item) return '';
    const eager = /is-detail|is-preview|is-hero|is-product|is-thumb/.test(extraClass || '');
    return `<img class="real-photo ${photoFitClass(result)} ${extraClass || ''}" style="background:${attr(result.item.bg || '#fff')}" src="${attr(PHOTO.url(result.item))}" alt="${attr(alt || result.item.model)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" data-photo-id="${attr(result.item.id)}">`;
  }
  function photoBadge(result) {
    if (!result || !result.item) return '';
    const ref = result.crossBrand || result.custom || result.substitute;
    return `<span class="real-photo-badge ${ref ? 'is-ref' : ''}">${ref ? '实拍参考' : '实拍'}</span>`;
  }
  function photoCreditText(result) {
    if (!result || !result.item) return '';
    const i = result.item;
    return `${i.model} · ${i.source || '本地照片库'}${i.license ? ' · ' + i.license : ''}${i.author ? ' · ' + i.author : ''}`;
  }
  function photoCreditHTML(result) {
    if (!result || !result.item) return '';
    const i = result.item;
    return `<div class="photo-credit">${icon('camera')} 实拍参考：<b>${esc(i.model)}</b> · ${esc(i.source || '本地照片库')}${i.license ? ' · ' + esc(i.license) : ''}${i.author ? ' · ' + esc(i.author) : ''}</div>`;
  }
  function downloadPhoto(result) {
    if (!result || !result.item) return;
    const a = document.createElement('a');
    a.href = PHOTO.url(result.item);
    a.download = result.item.file;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 400);
  }

  function downloadDataURL(url, filename) {
    if (!url) { showToast('渲染失败，请重试。', 'bad'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 500);
  }

  function sanitizeFilename(name) {
    return String(name || 'frame').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 42);
  }

  function exportCameraArtwork(design, company, opts, label) {
    if (!ART3D) return;
    showToast('正在渲染 4K 产品图…', 'info');
    setTimeout(() => {
      try {
        const url = ART3D.exportPNG(design, company, {
          
          
          
          view: 'hero',
          
          
          
          kitLens: opts && opts.kitLens,
          
          
          
          adherence: (game.art && game.art.adherence) || 0.7
        });
        downloadDataURL(url, sanitizeFilename(label || 'FRAME') + '_4K.png');
        showToast('4K 产品图已导出。', 'good');
      } catch (e) {
        showToast('导出失败：' + e.message, 'bad');
      }
    }, 40);
  }

  function exportLensArtwork(design, company, label) {
    if (!ART3D || !ART3D.exportLensPNG) { showToast('镜头渲染模块不可用。', 'bad'); return; }
    showToast('正在渲染 4K 镜头图…', 'info');
    setTimeout(() => {
      try {
        const url = ART3D.exportLensPNG(design, company);
        downloadDataURL(url, sanitizeFilename(label || 'FRAME_LENS') + '_4K.png');
        showToast('4K 镜头图已导出。', 'good');
      } catch (e) { showToast('导出失败：' + e.message, 'bad'); }
    }, 40);
  }

  function applyModelToDraft(model, draft) {
    if (!model || !draft) return false;
    const ratio = model.h / model.w;
    draft.body.width = Math.round(model.w);
    draft.body.height = Math.round(model.w * ratio);
    draft.body.depth = Math.round(model.w * (model.d / model.w));
    const g = model.g || [0.6, 0.3, 0.7];
    draft.body.gripH = Math.round(draft.body.height * g[0]);
    draft.body.gripD = Math.round(model.w * g[1]);
    draft.body.gripCurve = Math.round(clamp(35 + g[2] * 55, 0, 100));
    draft.body.roundness = Math.round(clamp(18 + (model.corner || 0.1) * 180, 6, 88));
    const topMap = { flat: 'flat', arc: 'arc', prism: 'prism', shoulder: 'shoulder', cine: 'cine_shoulder', flush: 'flush' };
    if (topMap[model.top] && !['cinema', 'action'].includes(draft.category)) draft.body.top = topMap[model.top];
    if (model.scr && !['cinema', 'action'].includes(draft.category)) draft.screen.type = model.scr;
    draft.referenceModelId = model.id;
    draft.photoId = null;
    if (PHOTO) {
      const ph = PHOTO.match(model.brand, model.name, model.cat);
      if (ph) draft.photoId = ph.item.id;
    }
    if (game.art) {
      game.art.baseline = { mode: game.mode === 'takeover' ? 'brand' : 'category', brandId: model.brand, modelId: model.id };
    }
    return true;
  }

  function useReferenceModel(modelId, options) {
    const model = ART && ART.data.modelById(modelId);
    if (!model) return;
    const draft = game.drafts.camera;
    if (draft) {
      applyModelToDraft(model, draft);
      persist();
      renderApp({ preserveScroll: true });
      showToast('已按 ' + model.name + ' 的结构比例重设外形基准。', 'good', '参考图引导生成');
    } else {
      if (game.art) game.art.baseline = { mode: 'category', brandId: model.brand, modelId: model.id };
      persist();
      showToast('已记录外形基准。下一台相机将从 ' + model.name + ' 的比例开始。', 'info');
    }
    if (!options || options.keepModal !== true) {
      UI.modal = null;
      modalRoot.innerHTML = '';
      document.body.classList.remove('modal-open');
    }
  }

  async function loadGalleryPhotos(root) {
    if (!ART) return;
    const imgs = Array.from((root || document).querySelectorAll('img[data-ref-photo]'));
    for (const img of imgs) {
      const id = img.getAttribute('data-ref-photo');
      if (!id) continue;
      let rec = refPhotoRecords.get(id);
      if (!rec) {
        rec = await ART.cache.get('refs', 'photo:' + id).catch(() => null);
        if (rec && rec.blob) refPhotoRecords.set(id, rec);
      }
      if (rec && rec.blob) {
        img.src = ART.online.objectURL(rec);
        img.classList.add('is-loaded');
        const card = img.closest('.ref-card');
        if (card) card.classList.add('has-photo');
        if (!refSignatures.has(id)) {
          
          
          
          const sig = ART.analyzeImage(img);
          
          
          
          if (sig && sig.ok) refSignatures.set(id, sig);
        }
      }
    }
  }

  function autoSyncReferences() {
    if (!game || !ART || !ART.online || !ART.online.isOnline() || UI.artAutoSynced) return;
    if (navigator.onLine === false) return;
    const refs = ART.referenceModels({ company: game.company, category: 'mirrorless', limit: 4 });
    if (!refs.length) return;
    UI.artAutoSynced = true;
    ART.online.syncList(refs, { concurrency: 1 }).then(results => {
      const ok = results.filter(r => r.ok).length;
      if (ok) showToast(`已自动缓存 ${ok} 张${game.company.name}经典机型参考图，可在参考图库查看。`, 'good', 'REFERENCE LIBRARY');
    }).catch(() => { /* offline is fine */ });
  }

  function galleryPhotos(root) { loadGalleryPhotos(root); }

  function syncReferenceSet(models, label) {
    if (!ART) return;
    if (!ART.online.isOnline()) {
      showToast('联网检索已关闭。开启后可从 Wikimedia Commons 抓取参考图；离线仍可使用内置结构与已缓存图片。', 'bad');
      return;
    }
    if (!models.length) return;
    const total = models.length;
    showToast('开始抓取 ' + (label || '参考图') + ' · 0/' + total, 'info', 'REFERENCE SYNC');
    const progress = document.createElement('div');
    progress.className = 'art-sync-progress';
    progress.innerHTML = '<i style="width:0%"></i>';
    const host = document.getElementById('view');
    if (host) host.prepend(progress);
    ART.online.syncList(models, {
      onProgress: ({ done: d }) => {
        const bar = progress.querySelector('i');
        if (bar) bar.style.width = Math.round(d / total * 100) + '%';
      }
    }).then(results => {
      progress.remove();
      const ok = results.filter(r => r.ok).length;
      showToast(ok + ' / ' + total + ' 张参考图已缓存到本地。', ok ? 'good' : 'warn', 'REFERENCE SYNC');
      renderApp({ preserveScroll: true });
    }).catch(e => {
      progress.remove();
      showToast('参考图抓取失败：' + (e.message || '网络错误'), 'bad');
    });
  }

  function renderGalleryPage() {
    if (!ART && !PHOTO) return `<div class="callout bad">参考图库模块未加载。</div>`;
    const tab = UI.galleryTab || 'photos';
    const brandFilter = UI.galleryBrand || 'all';
    const catFilter = UI.galleryCat || 'all';
    const onlineOn = ART ? ART.online.isOnline() : false;
    const photoBrands = PHOTO ? PHOTO.brands() : [];
    const photoCats = PHOTO ? PHOTO.categories() : [];
    const photos = PHOTO ? PHOTO.list({ brandId: brandFilter === 'all' ? null : brandFilter, category: catFilter === 'all' ? null : catFilter }) : [];
    const models = ART ? ART.data.MODELS.filter(m =>
      (brandFilter === 'all' || m.brand === brandFilter) &&
      (catFilter === 'all' || m.cat === catFilter)
    ) : [];
    const lenses = ART ? ART.data.LENSES.filter(l => brandFilter === 'all' || l.brand === brandFilter) : [];
    const profile = ART ? ART.brandFor(game.company) : { name: game.company.name };
    const tabs = [
      ['photos', '实拍照片', PHOTO ? PHOTO.items.length : 0],
      ['cameras', '结构参考', ART ? ART.data.MODELS.length : 0],
      ['lenses', '镜头参考', ART ? ART.data.LENSES.length : 0]
    ];
    return `
      ${pageHead({
        eyebrow: 'PHOTO LIBRARY / 真实照片库',
        title: '用真实相机，做真实的生意。',
        sub: '游戏内的产品图直接来自你提供的本地照片库：179 台真实相机、20 个品牌。全部是实拍照片，不做 AI 生成；新设计会优先采用最接近的真实机型照片作为外形参考。',
        actions: tab === 'photos'
          
          
          
          ? `<button class="btn btn-secondary" data-action="art-gallery-reset">${icon('refresh')} 重置筛选</button><button class="btn btn-primary" data-action="photo-random">${icon('sparkles')} 随机挑一台参考</button>`
          
          
          
          : `<button class="btn btn-secondary" data-action="art-sync-brand">${icon('download')} 补充${esc(profile.name || '品牌')}参考</button><button class="btn btn-primary" data-action="art-sync-page">${icon('globe')} 联网补充当前筛选</button>`
      })}
      <div class="art-console">
        <div class="art-console-main">
          
          
          
          <div class="art-console-stat"><label>实拍照片</label><b>${PHOTO ? PHOTO.items.length : 0}</b><span>台真实机身照片</span></div>
          
          
          
          <div class="art-console-stat"><label>覆盖品牌</label><b>${photoBrands.length}</b><span>个真实影像品牌</span></div>
          
          
          
          <div class="art-console-stat"><label>照片品类</label><b>${photoCats.length}</b><span>微单 / 卡片 / 运动 / 电影机 / 其他</span></div>
          
          
          
          <div class="art-console-stat"><label>图片来源</label><b class="good">LOCAL</b><span>用户本地照片库 · 仅个人参考</span></div>
        </div>
        <div class="art-console-actions">
          
          
          
          <button class="btn btn-sm ${onlineOn ? 'btn-secondary' : 'btn-ghost'}" data-action="art-toggle-online">${icon(onlineOn ? 'globe' : 'lock')} ${onlineOn ? '联网补充已开启' : '联网补充已关闭'}</button>
          
          
          
          <button class="btn btn-sm btn-ghost" data-action="art-clear-cache">${icon('trash')} 清理联网缓存</button>
        </div>
        <div class="art-console-note">${icon('info')} 照片来自你提供的本地照片库（Wikimedia Commons / CameraDecision 等，授权信息见每张照片详情），仅作个人外形参考；游戏不会修改或重绘照片本身。</div>
      </div>
      <div class="art-gallery-tabs">
        ${tabs.map(([id, label, count]) => `<button class="tab ${tab === id ? 'is-active' : ''}" data-action="art-gallery-tab" data-tab="${id}">${label} <span class="tab-badge">${count}</span></button>`).join('')}
      </div>
      <div class="filter-row">
        <div class="filter-chips">
          
          
          
          <button class="filter-chip ${brandFilter === 'all' ? 'is-active' : ''}" data-action="art-gallery-brand" data-brand="all">全部品牌</button>
          
          
          
          ${(tab === 'photos' ? photoBrands : (ART ? Object.values(ART.data.BRANDS).filter(b => ART.data.modelsForBrand(b.id).length) : [])).map(b => `<button class="filter-chip ${brandFilter === b.id ? 'is-active' : ''}" data-action="art-gallery-brand" data-brand="${attr(b.id)}">${esc(b.name || b.brandCn)}</button>`).join('')}
        </div>
        ${tab === 'photos' ? `<div class="filter-chips">
          
          
          
          <button class="filter-chip ${catFilter === 'all' ? 'is-active' : ''}" data-action="art-gallery-cat" data-cat="all">全部品类</button>
          
          
          
          ${photoCats.map(c => `<button class="filter-chip ${catFilter === c.id ? 'is-active' : ''}" data-action="art-gallery-cat" data-cat="${c.id}">${esc(c.label)}</button>`).join('')}
        </div>` : tab === 'cameras' ? `<div class="filter-chips">
          
          
          
          <button class="filter-chip ${catFilter === 'all' ? 'is-active' : ''}" data-action="art-gallery-cat" data-cat="all">全部品类</button>
          
          
          
          ${D.CATEGORY_ORDER.map(id => `<button class="filter-chip ${catFilter === id ? 'is-active' : ''}" data-action="art-gallery-cat" data-cat="${id}">${esc(D.CATEGORIES[id].short)}</button>`).join('')}
        </div>` : ''}
      </div>
      <div class="art-gallery-grid" data-gallery-root>
        ${tab === 'photos'
          
          
          
          ? (photos.length ? photos.map(p => photoCard(p)).join('') : '<div class="empty-inline">当前筛选没有照片。</div>')
          
          
          
          : tab === 'cameras'
          
          
          
            ? (models.length ? models.map(m => referenceCard(m)).join('') : '<div class="empty-inline">当前筛选没有参考机型。</div>')
          
          
          
            : (lenses.length ? lenses.map(l => lensReferenceCard(l)).join('') : '<div class="empty-inline">当前筛选没有镜头参考。</div>')}
      </div>
      <div class="callout mt-16"><div class="callout-title">${icon('info')} 照片如何进入游戏</div>产品中心、产品详情、总览和设计工作台直接读取本地照片库中对应品牌的真实机型照片；新设计会按「外形基准 → 参考机型 → 品类」的顺序选择最接近的真实照片，并在图卡上标注「实拍参考」。3D 渲染只保留为「结构示意」工具，不再作为商品图。</div>
    `;
  }

  function photoCard(item) {
    const fit = 'fit-' + (item.fit || (item.clean ? 'contain' : 'cover'));
    return `<article class="ref-card photo-card" data-action="photo-open" data-photo="${attr(item.id)}">
      <div class="ref-figure is-real-photo">
        <img class="ref-photo is-loaded ${fit}" src="${attr(PHOTO.url(item))}" alt="${attr(item.brand + ' ' + item.model)}" loading="lazy" decoding="async">
        <span class="ref-badge">${esc(item.brandCn || item.brand)}</span>
        <span class="ref-code">${esc(item.date)} · ${esc(item.catLabel)}</span>
      </div>
      <div class="ref-body">
        <div class="ref-name">${esc(item.model)}</div>
        <div class="ref-meta"><span>${esc(item.catLabel)} · ${esc(item.brand)}</span><span>${item.w} × ${item.h}</span></div>
        <div class="ref-note">${esc(item.source || '本地照片库')}${item.license ? ' · ' + esc(item.license) : ''}</div>
        <div class="ref-actions">
          
          
          
          <button class="btn btn-sm btn-ghost" data-action="photo-open" data-photo="${attr(item.id)}">查看照片</button>
          
          
          
          <button class="btn btn-sm btn-ghost" data-action="photo-use" data-photo="${attr(item.id)}">设为外形参考</button>
        </div>
      </div>
    </article>`;
  }

  function modalPhoto(data) {
    const item = PHOTO && PHOTO.byId(data.id);
    if (!item) return modalShell({ title: '照片不存在', body: '<div class="callout bad">找不到这张照片。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    const struct = findStructuralModel(item);
    return modalShell({
      title: item.model,
      eyebrow: 'REAL PHOTO / 实拍照片',
      sub: `${item.brandCn || item.brand} · ${item.date} · ${item.catLabel}`,
      size: 'xl',
      body: `<div class="ref-detail-grid">
        <div>
          
          
          
          <div class="ref-detail-stage is-photo-detail">
          
          
          
            <img src="${attr(PHOTO.url(item))}" style="background:${attr(item.bg || '#fff')}" alt="${attr(item.model)}" loading="eager">
          
          
          
          </div>
          
          
          
          <div class="photo-credit">${icon('camera')} ${esc(item.source || '本地照片库')}${item.license ? ' · ' + esc(item.license) : ''}${item.author ? ' · ' + esc(item.author) : ''}</div>
          
          
          
          <div class="flex gap-8 mt-12">
          
          
          
            <button class="btn btn-primary" data-action="photo-use" data-photo="${attr(item.id)}">${icon('target')} 设为外形参考</button>
          
          
          
            <button class="btn btn-secondary" data-action="photo-download" data-photo="${attr(item.id)}">${icon('download')} 下载照片</button>
          
          
          
          </div>
          
          
          
          ${struct ? `<div class="callout mt-12"><div class="callout-title">${icon('info')} 可关联结构比例</div>这张照片对应结构库中的 ${esc(struct.name)}，设为参考时会同时套用它的宽高、握柄与取景器比例。</div>` : `<div class="callout mt-12"><div class="callout-title">${icon('info')} 照片参考</div>这张照片暂未收录结构比例，设为参考后只替换外形照片，比例仍由当前品类基准约束。</div>`}
        </div>
        <div>
          
          
          
          <div class="modal-section-title">照片信息</div>
          
          
          
          <div class="detail-spec-grid">
          
          
          
            <div class="detail-spec-row"><label>品牌</label><b>${esc(item.brand)}</b></div>
          
          
          
            <div class="detail-spec-row"><label>机型</label><b>${esc(item.model)}</b></div>
          
          
          
            <div class="detail-spec-row"><label>发布日期</label><b>${esc(item.date)}</b></div>
          
          
          
            <div class="detail-spec-row"><label>品类</label><b>${esc(item.catLabel)}</b></div>
          
          
          
            <div class="detail-spec-row"><label>原始分辨率</label><b>${item.w} × ${item.h}</b></div>
          
          
          
            <div class="detail-spec-row"><label>来源</label><b>${esc(item.source || '本地照片库')}</b></div>
          
          
          
            <div class="detail-spec-row"><label>授权</label><b>${esc(item.license || '—')}</b></div>
          
          
          
            <div class="detail-spec-row"><label>作者</label><b>${esc(item.author || '—')}</b></div>
          
          
          
            <div class="detail-spec-row"><label>结构库匹配</label><b>${struct ? esc(struct.name) : '未收录'}</b></div>
          
          
          
          </div>
          
          
          
          <div class="modal-section-title mt-16">使用说明</div>
          
          
          
          <p class="muted" style="font-size:10px;line-height:1.7">本照片仅作为个人自用模拟游戏中的外形参考。设为外形参考后，设计工作台会显示这张照片，并在可能的情况下套用对应真实机型的结构比例。照片不会被修改或重新生成。</p>
        </div>
      </div>`,
      foot: `<span class="foot-note">照片版权归原作者 / 来源网站所有；本作仅作个人非商业参考。</span><button class="btn btn-secondary" data-action="close-modal">关闭</button>`
    });
  }

  function referenceCard(m) {
    const brand = ART.data.brandById(m.brand) || {};
    const cat = D.CATEGORIES[m.cat] || D.CATEGORIES.mirrorless;
    const ph = photoForRefModel(m);
    return `<article class="ref-card" data-action="art-open-model" data-model="${attr(m.id)}">
      <div class="ref-figure ${ph ? 'is-real-photo' : ''}">
        ${ph
          
          
          
          ? `<img class="ref-photo is-loaded fit-${ph.item.fit || (ph.item.clean ? 'contain' : 'cover')}" style="background:${attr(ph.item.bg || '#fff')}" src="${attr(PHOTO.url(ph.item))}" alt="${attr(m.name)} 实拍参考" loading="lazy" decoding="async"><span class="ref-photo-flag">${ph.substitute || ph.crossBrand ? '实拍参考' : '实拍'}</span>`
          
          
          
          : `<canvas class="ref-silhouette" data-ref-silhouette="${attr(m.id)}"></canvas><img class="ref-photo" data-ref-photo="${attr(m.id)}" alt="${attr(m.name)} 实拍参考图">`}
        <span class="ref-badge">${esc(brand.name || m.brand)}</span>
        <span class="ref-code">${esc(m.year)} · ${esc(m.mount)}</span>
      </div>
      <div class="ref-body">
        <div class="ref-name">${esc(m.name)}</div>
        <div class="ref-meta"><span>${esc(cat.short)}</span><span>${m.w} × ${m.h} × ${m.d} mm</span></div>
        <div class="ref-note">${esc(m.note || '')}</div>
        <div class="ref-actions">
          
          
          
          <button class="btn btn-sm btn-ghost" data-action="art-use-model" data-model="${attr(m.id)}">设为外形基准</button>
          
          
          
          <button class="btn btn-sm btn-ghost" data-action="art-open-model" data-model="${attr(m.id)}">结构档案</button>
        </div>
      </div>
    </article>`;
  }

  function lensReferenceCard(l) {
    const brand = ART.data.brandById(l.brand) || {};
    return `<article class="ref-card is-lens" data-action="art-open-lens" data-lens="${attr(l.id)}">
      <div class="ref-figure">
        <canvas class="ref-silhouette" data-ref-lens="${attr(l.id)}"></canvas>
        <img class="ref-photo" data-ref-photo="${attr(l.id)}" alt="${attr(l.name)} 实拍参考图">
        <span class="ref-badge">${esc(brand.name || l.brand)}</span>
        <span class="ref-code">${esc(l.mount)} · ${esc(l.type)}</span>
      </div>
      <div class="ref-body">
        <div class="ref-name">${esc(l.name)}</div>
        <div class="ref-meta"><span>⌀${l.dia} × ${l.len} mm</span><span>${l.weight} g</span></div>
        <div class="ref-note">${esc(l.type === 'cinema' ? '电影镜头：统一齿轮环、长行程对焦与粗壮镜身。' : '真实镜头比例：卡口、滤镜口径与镜身长度。')}</div>
        <div class="ref-actions"><button class="btn btn-sm btn-ghost" data-action="art-open-lens" data-lens="${attr(l.id)}">结构档案</button></div>
      </div>
    </article>`;
  }

  function drawGallerySilhouettes(root) {
    if (!ART) return;
    (root || document).querySelectorAll('canvas[data-ref-silhouette]').forEach(cv => {
      const m = ART.data.modelById(cv.dataset.refSilhouette);
      if (m) ART.drawModelSilhouette(cv, m, { ink: '#2b2e28', accent: '#9a7a44' });
    });
    (root || document).querySelectorAll('canvas[data-ref-lens]').forEach(cv => {
      const l = ART.data.lensById(cv.dataset.refLens);
      if (l) drawLensSilhouette(cv, l);
    });
  }

  function drawBootRefs() {
    if (!ART || !bootRoot) return;
    bootRoot.querySelectorAll('canvas[data-boot-ref]').forEach(cv => {
      const m = ART.data.modelById(cv.dataset.bootRef);
      if (!m) return;
      const rect = cv.getBoundingClientRect();
      if (rect.width < 8) return;
      try { ART.drawModelSilhouette(cv, m, { width: rect.width, height: rect.height, ink: '#2c2f29', accent: '#a9854d' }); } catch (e) { /* ignore */ }
    });
  }
  function drawLensSilhouette(canvas, lens) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 240, h = canvas.clientHeight || 130;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pad = 16;
    const len = Math.min(w - pad * 2, 220);
    const dia = Math.min(h - pad * 2, len * (lens.dia / Math.max(1, lens.len)) * 1.5);
    const x0 = (w - len) / 2, y0 = h / 2 - dia / 2;
    const ink = '#2b2e28';
    ctx.fillStyle = '#ddd8ca'; ctx.strokeStyle = ink; ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, len, dia, dia * 0.18); else ctx.rect(x0, y0, len, dia);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c3bdae';
    ctx.fillRect(x0 + len * 0.26, y0 + 1, len * 0.22, dia - 2);
    ctx.strokeRect(x0 + len * 0.26, y0 + 1, len * 0.22, dia - 2);
    ctx.fillStyle = lens.ring || '#b79143';
    ctx.fillRect(x0 + len * 0.72, y0 + 2, Math.max(3, len * 0.035), dia - 4);
    ctx.beginPath(); ctx.ellipse(x0 + len - 1, y0 + dia / 2, Math.max(4, len * 0.06), dia * 0.36, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#39494a'; ctx.fill();
    ctx.fillStyle = '#b5b2a8';
    ctx.fillRect(x0 - 8, y0 + dia * 0.16, 8, dia * 0.68);
    ctx.strokeRect(x0 - 8, y0 + dia * 0.16, 8, dia * 0.68);
  }

  async function fillGalleryCacheStat() {
    if (!ART) return;
    try {
      const s = await ART.cache.stats();
      document.querySelectorAll('.js-cache-count').forEach(el => {
        const kb = Math.round((s.bytes || 0) / 1024);
        el.textContent = s.count + ' 项 / ' + (kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
      });
    } catch (e) { /* ignore */ }
  }

  function modalReferenceModel(data) {
    const isLens = data.kind === 'lens';
    const item = isLens ? ART.data.lensById(data.id) : ART.data.modelById(data.id);
    if (!item) return modalShell({ title: '参考不存在', body: '<div class="callout bad">找不到这条参考数据。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    const brand = ART.data.brandById(item.brand) || {};
    const rec = refPhotoRecords.get(item.id);
    const hasPhoto = !!(rec && rec.blob);
    const photoUrl = hasPhoto ? ART.online.objectURL(rec) : '';
    const specs = isLens ? [
      ['卡口', item.mount], ['类型', item.type], ['尺寸', '⌀' + item.dia + ' × ' + item.len + ' mm'],
      ['重量', item.weight + ' g'], ['焦距', Array.isArray(item.focal) ? (item.focal[0] === item.focal[1] ? item.focal[0] + 'mm' : item.focal.join('–') + 'mm') : item.focal],
      ['最大光圈', 'F' + item.ap], ['镜身语言', item.style]
    ] : [
      ['品牌', brand.name || item.brand], ['年份', item.year], ['品类', (D.CATEGORIES[item.cat] || {}).name || item.cat],
      ['卡口', item.mount], ['尺寸', item.w + ' × ' + item.h + ' × ' + item.d + ' mm'], ['重量', item.weight + ' g'],
      ['握柄比例', (item.g || [0, 0, 0]).map(v => Math.round(v * 100) + '%').join(' / ')],
      ['顶盖形态', item.top], ['取景器', item.evf], ['屏幕', item.scr]
    ];
    return modalShell({
      title: item.name,
      eyebrow: 'REFERENCE DOSSIER / 结构参考',
      sub: brand.name + ' · ' + (item.year || '') + ' · 仅作外形结构参考，生成图不使用原始照片',
      size: 'xl',
      body: `<div class="ref-detail-grid">
        <div>
          
          
          
          <div class="ref-detail-stage">
          
          
          
            ${hasPhoto ? `<img src="${photoUrl}" alt="${attr(item.name)} 参考实拍图">` : `<canvas class="ref-detail-silhouette" data-ref-silhouette="${attr(item.id)}"></canvas>`}
          
          
          
            ${hasPhoto ? `<span class="ref-photo-credit">${esc(rec.license || 'Wikimedia Commons')} · ${esc(rec.artist || '未知作者')}</span>` : `<span class="ref-photo-credit is-empty">尚未缓存实拍图 · 使用内置结构轮廓</span>`}
          
          
          
          </div>
          
          
          
          <div class="callout mt-12"><div class="callout-title">${icon('info')} 使用方式</div>设为首选外形基准后，新设计会从这台真实相机的宽高、厚度、握柄和取景器比例出发，再通过程序化几何生成全新的产品图。</div>
          
          
          
          <div class="flex gap-8 mt-12">
          
          
          
            <button class="btn btn-primary" data-action="art-use-model" data-model="${attr(item.id)}" ${isLens ? 'disabled' : ''}>${icon('target')} 设为外形基准</button>
          
          
          
            ${hasPhoto ? `<button class="btn btn-secondary" data-action="art-refresh-photo" data-model="${attr(item.id)}">${icon('refresh')} 重新抓取</button>` : `<button class="btn btn-secondary" data-action="art-fetch-photo" data-model="${attr(item.id)}">${icon('globe')} 抓取实拍参考</button>`}
          
          
          
          </div>
          
          
          
          ${hasPhoto ? `<div class="ref-attribution">参考图：<a href="${attr(rec.page || '#')}" target="_blank" rel="noopener">${esc(rec.title || 'Wikimedia Commons')}</a> · ${esc(rec.license || '')} · ${esc(rec.artist || '')}</div>` : ''}
        </div>
        <div>
          
          
          
          <div class="modal-section-title">结构数据</div>
          
          
          
          <div class="detail-spec-grid">${specs.map(([k, v]) => `<div class="detail-spec-row"><label>${esc(k)}</label><b>${esc(String(v))}</b></div>`).join('')}</div>
          
          
          
          ${!isLens ? `<div class="modal-section-title mt-16">设计语言</div><p class="muted" style="font-size:10px;line-height:1.7">${esc(item.note || brand.notes || '')}</p>` : ''}
          
          
          
          <div class="modal-section-title mt-16">本地缓存状态</div>
          
          
          
          <div class="detail-spec-row"><label>实拍缩略图</label><b>${hasPhoto ? '已缓存 · ' + Math.round((rec.blob.size || 0) / 1024) + ' KB' : '未缓存'}</b></div>
          
          
          
          ${refSignatures.has(item.id) ? `<div class="detail-spec-row"><label>实拍轮廓解析</label><b>宽高比 ${refSignatures.get(item.id).aspect.toFixed(2)} · 顶部隆起 ${Math.round(refSignatures.get(item.id).hump * 100)}% · 握柄${refSignatures.get(item.id).gripSide === 'left' ? '左' : '右'}侧</b></div>` : ''}
          
          
          
          <div class="detail-spec-row"><label>数据来源</label><b>内置结构库 v1.0</b></div>
        </div>
      </div>`,
      foot: `<span class="foot-note">Wikimedia Commons 缩略图遵循各自 CC / 公有领域授权，仅缓存于本机用于外形比对。</span><button class="btn btn-secondary" data-action="close-modal">关闭</button>`
    });
  }

  function modalReferenceLens(data) { return modalReferenceModel(Object.assign({}, data, { kind: 'lens' })); }

  function renderCameraEvalPanel(ev, draft) {
    if (!ev) return '';
    const matchSeg = segmentData(draft.targetSegment);
    const tone = scoreTone(ev.overall);
    const mode = UI.previewMode === 'technical' ? 'technical' : (UI.previewMode === 'render' ? 'render' : 'photo');
    const artSpec = ART ? artSpecInfo(draft) : null;
    const photo = mode === 'photo' ? photoForDesign(draft) : null;
    const preview = mode === 'technical'
      ? P.renderCamera(draft, game.company, { view: UI.previewView, annotations: UI.previewAnnotations, wireframe: UI.previewWire, kitLens: getCameraKitLens(draft), idPrefix: 'studio' })
      : '';
    const dims = `${Math.round(ev.W)} × ${Math.round(ev.H)} × ${Math.round(ev.Dp)}`;
    const visibleWarnings = ev.warnings.slice(0, 5);
    const bars = [
      ['颜值', ev.traits.looks], ['复古', ev.traits.retro], ['专业', ev.traits.pro],
      ['便携', ev.traits.portability], ['握持', ev.traits.handling], ['电影', ev.traits.cinema],
      ['潮流', ev.traits.trend], ['消费', ev.traits.consumer]
    ];
    const angles = [['hero', '3/4'], ['front', '正面'], ['back', '背面'], ['top', '顶部'], ['side', '侧面']];
    const swatches = [draft.colors.main, draft.colors.top, draft.colors.grip, draft.colors.accent].filter(Boolean);
    return `<div class="preview-card">
      <div class="preview-head">
        <div class="preview-head-left"><span class="preview-dot"></span><span class="preview-title">${mode === 'photo' ? 'REAL PHOTO / REFERENCE' : mode === 'render' ? '3D STUDY / 结构示意' : 'LIVE FORM / ' + String(UI.previewView).toUpperCase()}</span></div>
        <div class="preview-actions">
          
          
          
          <div class="view-switcher">
          
          
          
            <button class="view-btn ${mode === 'photo' ? 'is-active' : ''}" data-action="preview-mode" data-mode="photo">实拍</button>
          
          
          
            <button class="view-btn ${mode === 'render' ? 'is-active' : ''}" data-action="preview-mode" data-mode="render" title="3D 结构示意">3D</button>
          
          
          
            <button class="view-btn ${mode === 'technical' ? 'is-active' : ''}" data-action="preview-mode" data-mode="technical">技术图</button>
          
          
          
          </div>
          
          
          
          ${mode === 'render' ? `
          
          
          
            <button class="mini-toggle angle-cycle" data-action="art-angle-cycle" title="切换视角：${(angles.find(([v]) => v === UI.artPhotoView) || ['hero', '3/4'])[1]}">${(angles.find(([v]) => v === UI.artPhotoView) || ['hero', '3/4'])[1]}</button>
          
          
          
            <button class="mini-toggle ${UI.artGhost ? 'is-active' : ''}" data-action="toggle-art-ghost" title="参考叠影">${icon('layers')}</button>
          
          
          
          ` : ''}
          
          
          
          ${mode === 'technical' ? `
          
          
          
            <div class="view-switcher">
          
          
          
              ${[['front', '正面'], ['back', '背面'], ['top', '顶部'], ['side', '侧面']].map(([v, l]) => `<button class="view-btn ${UI.previewView === v ? 'is-active' : ''}" data-action="preview-view" data-view="${v}">${l}</button>`).join('')}
          
          
          
            </div>
          
          
          
            <button class="mini-toggle ${UI.previewAnnotations ? 'is-active' : ''}" data-action="toggle-annotations" title="尺寸标注">${icon('ruler')}</button>
          
          
          
            <button class="mini-toggle ${UI.previewWire ? 'is-active' : ''}" data-action="toggle-wireframe" title="线稿模式">${icon('pen')}</button>
          
          
          
          ` : ''}
          
          
          
          ${mode === 'photo' ? `<button class="mini-toggle" data-action="photo-open-gallery" title="打开照片库">${icon('eye')}</button>` : ''}
        </div>
      </div>
      <div class="preview-stage ${mode === 'photo' ? 'is-photo is-real' : mode === 'render' ? 'is-photo is-render' : 'is-blueprint'}">
        <span class="stage-corner tl"></span><span class="stage-corner tr"></span><span class="stage-corner bl"></span><span class="stage-corner br"></span>
        ${mode === 'photo'
          
          
          
          ? `${photoImg(photo, 'is-preview', draft.name)}${photoBadge(photo)}<span class="stage-camera-label">REAL PHOTO · ${photo ? esc(photo.item.model) : 'NO MATCH'}</span>`
          
          
          
          : mode === 'render'
          
          
          
            ? `<canvas class="art-ghost" data-art-ghost></canvas><canvas class="art-canvas" data-art-live="camera"></canvas><span class="stage-camera-label">3D STUDY · 仅结构示意</span>`
          
          
          
            : `<span class="stage-camera-label">TECHNICAL ELEVATION</span>${preview}`}
      </div>
      ${mode === 'photo' && photo ? `<div class="design-photo-source">${icon('camera')}<b>${esc(photo.label)}</b><span>${photo.crossBrand ? '跨品牌实拍参考' : '品牌实拍参考'}</span><span class="design-swatches">${swatches.map(c => `<i style="background:${attr(c)}"></i>`).join('')}</span></div>` : ''}
      ${referenceChips(draft)}
      <div class="preview-info">
        <div class="preview-info-top">
          
          
          
          <div><div class="preview-info-name">${esc(draft.name || '未命名相机')}</div><div class="preview-info-sub">${esc(categoryData(draft.category).name)} · ${esc(matchSeg.name)} · ${esc(D.SENSOR_FORMATS[draft.sensor.format].name)}</div></div>
          
          
          
          <div class="preview-info-price">${moneyNumber(draft.price || ev.suggestedPrice)}<small>建议零售价 / 单机身</small></div>
        </div>
        <div class="preview-dimensional"><span>W <b>${Math.round(ev.W)}</b></span><span>H <b>${Math.round(ev.H)}</b></span><span>D <b>${Math.round(ev.Dp)}</b></span><span>重量 <b>${Math.round(ev.cameraWeight)}g</b></span><span>${esc(`${dims} mm`)}</span></div>
        ${mode !== 'technical' && artSpec ? structureBadge(artSpec) : ''}
        ${mode === 'photo' ? `<div class="art-preview-actions">
          
          
          
          <button class="btn btn-xs btn-ghost" data-action="photo-export-design">${icon('download')} 下载实拍参考图</button>
          
          
          
          <span class="art-render-meta">照片来自本机照片库 · 参数配色以左侧为准</span>
          
          
          
          <button class="btn btn-xs btn-secondary" data-action="preview-mode" data-mode="render">${icon('aperture')} 3D 结构示意</button>
        </div>` : ''}
        ${mode === 'render' && artSpec ? `<div class="art-preview-actions">
          
          
          
          <button class="btn btn-xs btn-ghost" data-action="art-repair">${icon('wrench')} 一键校正比例</button>
          
          
          
          <span class="art-render-meta">参考 ${artSpec.refs.length} 台 · ${Math.round(artSpec.W)}×${Math.round(artSpec.H)}×${Math.round(artSpec.D)}mm</span>
          
          
          
          <button class="btn btn-xs btn-secondary" data-action="art-export-4k">${icon('download')} 导出 4K 结构示意</button>
        </div>` : ''}
      </div>
    </div>
    <div class="design-eval">
      <div class="eval-head">
        <span class="eval-title">DESIGN EVALUATION / 外形评价</span>
        <span class="badge ${tone || 'accent'}">${ev.premiumBadge.label}</span>
      </div>
      <div class="flex items-center justify-between mt-12" style="gap:12px">
        <div class="flex items-center gap-10">
          
          
          
          <div class="donut">
          
          
          
            <svg width="62" height="62" viewBox="0 0 62 62">
          
          
          
              <circle cx="31" cy="31" r="25" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="4"/>
          
          
          
              <circle cx="31" cy="31" r="25" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(ev.overall / 100) * 157} 157"/>
          
          
          
            </svg>
          
          
          
            <div class="donut-center"><b>${ev.overall}</b><span>口碑预测</span></div>
          
          
          
          </div>
          
          
          
          <div><div class="mini-label">外观 / APPEARANCE</div><div style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em;line-height:1.1;margin-top:2px">${Math.round(ev.traits.looks)}</div><div class="faint" style="font-size:7px">颜值分 / 100</div></div>
        </div>
        <div class="eval-match">
          
          
          
          <div style="text-align:right"><div class="mini-label">受众匹配</div><div class="match-value">${ev.targetMatch}<small style="font-size:9px;color:var(--faint)">%</small></div><div class="match-label">${esc(matchSeg.name)}</div></div>
          
          
          
          <div class="donut" style="transform:scale(.82)">
          
          
          
            <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3.5"/><circle cx="26" cy="26" r="21" fill="none" stroke="var(--good)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${(ev.targetMatch / 100) * 132} 132"/></svg>
          
          
          
          </div>
        </div>
      </div>
      <div class="eval-bars">
        ${bars.map(([label, value]) => `<div class="eval-bar ${value >= 70 ? 'good' : ''}"><label>${label}<b>${Math.round(value)}</b></label><div class="progress"><i style="width:${clamp(value, 0, 100)}%;${value >= 70 ? 'background:linear-gradient(90deg,#5c7b5d,var(--good))' : ''}"></i></div></div>`).join('')}
      </div>
      <div class="eval-tags">${ev.designTags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${esc(ev.material.name)}</span><span class="tag">${esc(ev.finish.name)}</span></div>
      ${visibleWarnings.length ? `<div class="warning-list">${visibleWarnings.map(w => `<div class="warning-item ${w.blocking ? 'is-blocking' : ''}">${esc(w.text)}</div>`).join('')}</div>` : ''}
      <div class="studio-cost-mini">
        <div><label>制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
        <div><label>整机重量</label><b>${Math.round(ev.cameraWeight)} g</b></div>
        <div><label>建议售价</label><b>${moneyNumber(ev.suggestedPrice)}</b></div>
        <div><label>毛利空间</label><b>${pctNum((1 - ev.unitCost / Math.max(1, draft.price || ev.suggestedPrice)) * 100)}</b></div>
      </div>
      <div class="mini-label mt-12" style="letter-spacing:.1em">${icon('target')} 评价依据：比例、材质、颜色、操控、配件与目标人群</div>
    </div>`;
  }

  function renderCameraStudio() {
    const draft = game.drafts.camera;
    if (!draft) {
      UI.page = 'design';
      return renderDesignHub();
    }
    const ev = E.evaluateCamera(draft, game.company, { kitLens: getCameraKitLens(draft) });
    const cat = categoryData(draft.category);
    const step = clamp(UI.studioStep || 1, 1, 8);
    UI.studioStep = step;
    let stepBody = '';
    try {
      if (step === 1) stepBody = renderCameraStep1(draft, ev);
      else if (step === 2) stepBody = renderCameraStep2(draft, ev);
      else if (step === 3) stepBody = renderCameraStep3(draft, ev);
      else if (step === 4) stepBody = renderCameraStep4(draft, ev);
      else if (step === 5) stepBody = renderCameraStep5(draft, ev);
      else if (step === 6) stepBody = renderCameraStep6(draft, ev);
      else if (step === 7) stepBody = renderCameraStep7(draft, ev);
      else stepBody = renderCameraStep8(draft, ev);
    } catch (e) {
      console.error(e);
      stepBody = `<div class="callout bad">设计面板加载失败：${esc(e.message)}</div>`;
    }
    const stepMeta = CAMERA_STEPS[step - 1];
    const stepScore = step === 8 ? ev.overall : step === 1 ? ev.traits.looks : step === 2 ? ev.traits.handling : step === 3 ? ev.traits.looks : step === 4 ? ev.traits.handling : step === 5 ? ev.traits.pro : step === 6 ? ev.scores.image : ev.scores.video;
    return `<div class="studio-page">
      <div class="studio-head">
        <div class="studio-head-left">
          
          
          
          <button class="studio-back" data-action="nav" data-page="design">${icon('arrowLeft')} 设计工作室</button>
          
          
          
          <div class="studio-title-row">
          
          
          
            <input class="studio-title-input" value="${attr(draft.name)}" data-path="name" data-scope="camera" maxlength="32" aria-label="相机名称">
          
          
          
            <span class="badge accent">${esc(cat.name)}</span>
          
          
          
            <span class="badge">${esc(segmentData(draft.targetSegment).name)}</span>
          
          
          
          </div>
          
          
          
          <div class="studio-meta-row"><span>DRAFT ${String(draft.id).slice(-6).toUpperCase()}</span><span class="sep"></span><span>外形设计 / 工业设计工作台</span><span class="sep"></span><span>${esc(E.monthLabel(game.monthIndex))}</span><span class="sep"></span><span class="${ev.blocking.length ? 'bad' : 'good'}">${ev.blocking.length ? ev.blocking.length + ' 项阻塞' : '可上市'}</span></div>
        </div>
        <div class="studio-head-actions">
          
          
          
          <button class="btn btn-ghost btn-sm" data-action="save-draft">${icon('save')} 保存草稿</button>
          
          
          
          <button class="btn btn-ghost btn-sm" data-action="discard-camera-draft">${icon('trash')} 放弃</button>
          
          
          
          <button class="btn btn-primary btn-sm" data-action="studio-next">${step < 8 ? '继续设计' : '进入上市评审'} ${icon('arrowRight')}</button>
        </div>
      </div>
      <div class="studio-tabs-wrap">
        <div class="studio-tabs">
          
          
          
          ${CAMERA_STEPS.map(s => `<button class="studio-tab ${step === s.id ? 'is-active' : ''} ${step > s.id ? 'is-done' : ''}" data-action="studio-step" data-step="${s.id}"><span class="step-num">${String(s.id).padStart(2, '0')}</span>${s.short}</button>`).join('')}
        </div>
      </div>
      <div class="studio-layout">
        <div class="studio-main">
          
          
          
          <div class="studio-step">
          
          
          
            <div class="studio-step-head">
          
          
          
              <div><div class="studio-step-eyebrow">STEP ${String(step).padStart(2, '0')} / ${stepMeta.label}</div><h2 class="studio-step-title">${esc(stepTitle(step))}</h2><p class="studio-step-desc">${stepDesc(step)}</p></div>
          
          
          
              <div class="studio-step-score"><b class="js-step-score">${Math.round(stepScore)}</b><span>当前维度 / 100</span></div>
          
          
          
            </div>
          
          
          
            <div class="studio-step-body">${stepBody}</div>
          
          
          
            <div class="studio-step-footer">
          
          
          
              <div class="step-dots">${CAMERA_STEPS.map(s => `<span class="step-dot ${s.id === step ? 'is-active' : ''} ${step > s.id ? 'is-done' : ''}"></span>`).join('')}</div>
          
          
          
              <div class="studio-footer-actions">
          
          
          
                ${step > 1 ? `<button class="btn btn-sm btn-secondary" data-action="studio-prev">${icon('arrowLeft')} 上一步</button>` : ''}
          
          
          
                <button class="btn btn-sm btn-secondary" data-action="save-draft">保存</button>
          
          
          
                ${step < 8 ? `<button class="btn btn-sm btn-primary" data-action="studio-next">下一步 ${icon('arrowRight')}</button>` : `<button class="btn btn-sm btn-primary" data-action="open-launch-review">上市评审 ${icon('arrowRight')}</button>`}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <aside class="studio-side js-studio-side">${renderCameraEvalPanel(ev, draft)}</aside>
      </div>
    </div>`;
  }

  function stepTitle(step) {
    return [
      '先决定它为谁而生。',
      '一块金属应该长成什么形状？',
      '材料会替你说话。',
      '让手指知道该放在哪里。',
      '镜头、屏幕与配件共同定义一台相机。',
      '把传感器、快门和对焦写进机身。',
      '视频工作流与电源策略。',
      '把它带进真实市场。'
    ][step - 1] || '';
  }
  function stepDesc(step) {
    return [
      '产品线决定竞争方式和默认配置，目标用户决定审美与技术取舍。你可以用模板快速起步，也可以从空白的机身开始。',
      '所有外形选项都是独立的。改变机身形态会同步推荐比例，但你仍可以精调每一个尺寸。',
      '材质和表面处理不仅影响外观，也影响重量、散热、制造成本和用户对价格的接受度。',
      '按键数量不是越多越好。屏幕结构、取景器和拨轮，会直接影响握持与专业感。',
      '卡口决定镜头生态，配件决定它最终出现在什么场景：街头、婚礼、片场还是山顶。',
      '传感器是画质的起点，对焦和防抖是拍摄的底气。技术等级决定参数上限。',
      '高规格视频会带来散热和功耗压力。电池与接口是专业工作流的最后一公里。',
      '检查每一笔成本、每一个风险，然后为它定一个能被市场接受的价格。'
    ][step - 1] || '';
  }

  function renderCameraStep1(draft) {
    const cat = categoryData(draft.category);
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 产品线定位</div><div class="studio-section-desc">切换产品线会套用该品类的推荐相机形态与规格基础，你之后仍可完全改写。</div></div><span class="studio-section-hint">${D.CATEGORY_ORDER.length} 个可选产品线</span></div>
        <div class="category-mini-grid">
          
          
          
          ${D.CATEGORY_ORDER.map(id => { const c = D.CATEGORIES[id]; return `<button class="category-card-mini ${draft.category === id ? 'is-active' : ''}" data-action="set-camera-category" data-category="${id}">
          
          
          
            <div class="category-code">${esc(c.code)}</div><b>${esc(c.name)}</b><span>${esc(c.sizeLabel)}</span>
          
          
          
          </button>`; }).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 这台相机为谁设计？</div><div class="studio-section-desc">目标人群会改变外形、操控、规格与定价的评分权重。</div></div></div>
        <div class="option-grid cols-3">
          
          
          
          ${D.SEGMENTS_ARRAY.map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), meta: `<span>${esc(s.en)}</span>`, active: draft.targetSegment === s.id, action: 'set-choice', path: 'targetSegment', value: s.id, iconHTML: icon(SEGMENT_ICONS[s.id] || 'users') })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 设计语言模板</div><div class="studio-section-desc">模板只改变外形与材质语言，不会覆盖你已经选好的传感器和镜头卡口。</div></div><span class="studio-section-hint">可随时继续微调</span></div>
        <div class="template-row">
          
          
          
          ${CAMERA_TEMPLATES.map(t => `<button class="template-btn" data-action="apply-template" data-template="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}
          
          
          
          <button class="template-btn" data-action="random-inspiration"><b>随机灵感</b><span>从约束中生成一个意外的起点</span></button>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 当前技术底座</div><div class="studio-section-desc">技术等级由公司研发积累决定，限制这台相机可选的参数上限。</div></div><button class="link-btn" data-action="nav" data-page="research">研发中心 →</button></div>
        <div class="spec-highlight">
          
          
          
          ${['sensor', 'video', 'af', 'optics', 'cooling', 'material'].map(k => `<span>${esc(D.TECHS[k].name)} Lv.${game.company.tech[k]}</span>`).join('')}
          
          
          
          <span>设计团队 ${game.company.staff.designers} 人</span>
          
          
          
          <span>当前品类基准价 ${moneyNumber(cat.basePrice)}</span>
        </div>
        <div class="eyebrow-note">产品线基准：${esc(cat.description)}<br>默认目标用户：${esc(segmentData(cat.target).name)} · 推荐画幅：${esc(D.SENSOR_FORMATS[cat.sensor].name)} · 推荐卡口：${esc(cat.mount === 'FIXED' ? '固定镜头' : cat.mount)}</div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">05</span> 型号命名</div><div class="studio-section-desc">它会被印在机身铭牌、包装、评测标题和新闻里。</div></div></div>
        <div class="form-grid">
          
          
          
          <div class="form-field"><label>产品名称</label><input class="text-input" data-path="name" data-scope="camera" maxlength="32" value="${attr(draft.name)}"></div>
          
          
          
          <div class="form-field"><label>设计说明 <span class="faint">（选填）</span></label><input class="text-input" data-path="notes" data-scope="camera" maxlength="60" value="${attr(draft.notes || '')}" placeholder="一句话描述这台相机的设计主张"></div>
        </div>
      </div>`;
  }

  function renderCameraStep2(draft, ev) {
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 基础形态</div><div class="studio-section-desc">决定相机的第一轮廓。切换形态会加载推荐比例，你可以在下方精调。</div></div></div>
        <div class="option-grid cols-4">
          
          
          
          ${Object.values(D.BODY_TYPES).map(b => optionCard({ bodyIcon: b.id, name: esc(b.name), desc: esc(b.desc), meta: `<span>${esc(b.en)}</span>`, active: draft.body.type === b.id, action: 'set-body-type', value: b.id })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 轮廓与结构</div><div class="studio-section-desc">轮廓、顶盖和前脸决定它在三米外的辨识度。</div></div></div>
        <div class="form-grid" style="align-items:start">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">机身轮廓</div>
          
          
          
            <div class="option-grid cols-2">
          
          
          
              ${Object.values(D.SILHOUETTES).map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), active: draft.body.silhouette === s.id, action: 'set-choice', path: 'body.silhouette', value: s.id })).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">顶盖结构</div>
          
          
          
            <div class="option-grid cols-2">
          
          
          
              ${Object.values(D.TOP_STYLES).map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), active: draft.body.top === s.id, action: 'set-choice', path: 'body.top', value: s.id })).join('')}
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="mini-label mb-8 mt-16">前部造型</div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(D.FRONT_STYLES).map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), active: draft.body.front === s.id, action: 'set-choice', path: 'body.front', value: s.id })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 尺寸与比例</div><div class="studio-section-desc">直接改变机体体积、重量、便携性与内部堆叠空间。不要只看数字，留意右侧实时外形与重量。</div></div><span class="studio-section-hint">${Math.round(ev.W)} × ${Math.round(ev.H)} × ${Math.round(ev.Dp)} mm · ${Math.round(ev.cameraWeight)}g</span></div>
        <div class="size-silhouette-frame mb-16">
          
          
          
          <div class="size-silhouette">${P.bodyIcon(draft.body.type)}</div>
          
          
          
          <div class="size-notes"><b>${esc(D.BODY_TYPES[draft.body.type].name)} · ${esc(D.SILHOUETTES[draft.body.silhouette].name)} · ${esc(D.TOP_STYLES[draft.body.top].name)}</b><br>体积约 ${(ev.volumeL).toFixed(2)} L。${ev.H < 70 ? '机身较矮，内部堆叠与散热空间有限。' : ev.H > 125 ? '高机身提供更强专业感，也牺牲便携。' : '比例处于常规范围。'} ${ev.cameraWeight > 1400 ? '整机偏重，长时间手持会累。' : ''}</div>
        </div>
        <div class="range-cluster">
          
          
          
          ${rangeField('body.width', '机身宽度', Math.round(draft.body.width), 50, 230, 1, 'mm', '横向比例与握持宽度')}
          
          
          
          ${rangeField('body.height', '机身高度', Math.round(draft.body.height), 35, 210, 1, 'mm', '影响手柄、屏幕和内部堆叠')}
          
          
          
          ${rangeField('body.depth', '机身厚度', Math.round(draft.body.depth), 25, 160, 1, 'mm', '厚度与镜头卡口法兰距相关')}
          
          
          
          ${rangeField('body.roundness', '轮廓倒角', Math.round(draft.body.roundness), 0, 100, 1, '%', '更圆润或更硬朗的视觉语言')}
          
          
          
          ${rangeField('body.gripH', '握柄高度', Math.round(draft.body.gripH), 0, 105, 1, 'mm', '握柄太低会让长镜头难以稳定')}
          
          
          
          ${rangeField('body.gripD', '握柄深度', Math.round(draft.body.gripD), 0, 100, 1, 'mm', '手指包覆感的主要来源')}
          
          
          
          ${rangeField('body.gripCurve', '握柄弧度', Math.round(draft.body.gripCurve), 0, 100, 1, '%', '弧形更贴合手掌，硬朗更工业')}
          
          
          
          ${rangeField('body.finishGloss', '表面光泽度', Math.round(draft.body.finishGloss || 0), 0, 100, 1, '%', '从哑光到高光，影响质感与耐指纹性')}
        </div>
        <div class="flex items-center justify-between mt-16">
          
          
          
          <div class="toggle-row" style="flex:1"><div><div class="toggle-label">全天候密封结构</div><div class="toggle-desc">增加 38g 重量与 ¥120 成本，提升专业与体育场景可靠性。</div></div><button class="toggle ${draft.body.weatherSealed ? 'is-on' : ''}" data-action="flip-path" data-path="body.weatherSealed"></button></div>
          
          
          
          <span class="badge ${draft.body.weatherSealed ? 'good' : ''}">${draft.body.weatherSealed ? 'WEATHER SEALED' : 'NO SEALING'}</span>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 取景与握持视觉</div></div><span class="studio-section-hint">下一步可调整屏幕结构</span></div>
        <div class="grid-2">
          
          
          
          <div class="callout"><div class="callout-title">${icon('info')} 人体工学提示</div>${ev.traits.handling >= 75 ? '当前握持分数不错。' : '握柄高度/深度偏低，专业用户可能会觉得镜头重心难以控制。'} 前部造型和机身宽度会改变手指落点。</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('palette')} 比例提示</div>${ev.visualNotes || '比例没有绝对正确答案，但应与目标用户和使用场景一致。'} 机身尺寸会实时影响体积、重量、握持与便携四项评分。</div>
        </div>
      </div>`;
  }

  function renderCameraStep3(draft, ev) {
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 外壳材质</div><div class="studio-section-desc">材料决定密度、加工方式、散热和溢价能力。</div></div></div>
        <div class="option-grid cols-4">
          
          
          
          ${Object.values(D.MATERIALS).map(m => optionCard({ name: esc(m.name), desc: esc(m.desc), active: draft.materials.body === m.id, action: 'set-choice', path: 'materials.body', value: m.id, meta: `<span>密度 ${m.density}</span><span>质感 +${Math.round(m.premium * 100)}</span>`, iconHTML: `<span class="mini-swatch" style="background:${m.id === 'plastic' ? '#474b46' : m.id === 'leather' || m.id === 'skin' ? '#6e513b' : m.id === 'brass' ? '#b28a4c' : m.id === 'titanium' ? '#92928a' : m.id === 'carbon' ? '#2b2e2c' : '#a7a69b'}"></span>` })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 表面工艺</div><div class="studio-section-desc">同样的材料，用不同的表面处理会讲出完全不同的故事。</div></div><span class="studio-section-hint">材质：${esc(D.MATERIALS[draft.materials.body].name)}</span></div>
        <div class="option-grid cols-4">
          
          
          
          ${Object.values(D.FINISHES).map(f => optionCard({ name: esc(f.name), desc: esc(f.desc), active: draft.materials.finish === f.id, action: 'set-choice', path: 'materials.finish', value: f.id, meta: `<span>光泽 ${f.gloss}</span><span>质感 +${Math.round(f.premium * 100)}</span>` })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 骨架与顶盖</div></div></div>
        <div class="section-split">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">边框结构</div>
          
          
          
            <div class="option-grid cols-2">
          
          
          
              ${Object.values(D.FRAME_TYPES).map(f => optionCard({ name: esc(f.name), desc: esc(f.desc), active: draft.materials.frame === f.id, action: 'set-choice', path: 'materials.frame', value: f.id })).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">顶盖材质</div>
          
          
          
            <div class="option-grid cols-2">
          
          
          
              ${Object.values(D.TOP_PLATES).map(t => optionCard({ name: esc(t.name), desc: esc(t.desc), active: draft.materials.topPlate === t.id, action: 'set-choice', path: 'materials.topPlate', value: t.id })).join('')}
          
          
          
            </div>
          
          
          
          </div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 颜色与双色设计</div><div class="studio-section-desc">颜色不是贴图，它会改变审美、目标受众和品牌识别。双色机身在视觉上更复杂，但也更有个性。</div></div></div>
        <div class="grid-2 mb-16">
          
          
          
          <div class="swatch-line"><span class="swatch-large" style="background:${attr(draft.colors.main)}"></span><div class="swatch-meta"><b>主色</b><span>${attr(draft.colors.main)}</span></div></div>
          
          
          
          <div class="swatch-line"><span class="swatch-large" style="background:${attr(draft.colors.accent)}"></span><div class="swatch-meta"><b>强调色</b><span>${attr(draft.colors.accent)}</span></div></div>
        </div>
        ${colorRow('机身主色', 'colors.main', draft.colors.main, D.COLORS, false)}
        ${colorRow('副色 / 顶盖', 'colors.secondary', draft.colors.secondary, D.COLORS, true)}
        <div class="flex items-center justify-between mt-12 mb-12">
          
          
          
          <div class="toggle-row" style="flex:1"><div><div class="toggle-label">启用双色机身</div><div class="toggle-desc">允许顶盖、握柄或面板使用独立颜色。搭配不协调会降低外观分。</div></div><button class="toggle ${draft.colors.secondaryOn ? 'is-on' : ''}" data-action="flip-path" data-path="colors.secondaryOn"></button></div>
          
          
          
          <span class="badge ${draft.colors.secondaryOn ? 'accent' : ''}">${draft.colors.secondaryOn ? 'TWO-TONE' : 'MONOCHROME'}</span>
        </div>
        ${draft.colors.secondaryOn ? `<div class="grid-2">${colorRow('握柄颜色', 'colors.grip', draft.colors.grip, D.COLORS, true)}${colorRow('顶盖颜色', 'colors.top', draft.colors.top, D.COLORS, true)}</div>` : ''}
        <div class="form-grid cols-3 mt-8">
          
          
          
          ${colorRow('铭牌颜色', 'colors.nameplate', draft.colors.nameplate, D.COLORS, true)}
          
          
          
          ${colorRow('按键颜色', 'colors.button', draft.colors.button, D.COLORS, true)}
          
          
          
          ${colorRow('拨轮颜色', 'colors.dial', draft.colors.dial, D.COLORS, true)}
        </div>
        ${colorRow('品牌饰线颜色', 'colors.accent', draft.colors.accent, D.COLORS, true)}
        <div class="flex items-center justify-between mt-8">
          
          
          
          <div class="toggle-row" style="flex:1"><div><div class="toggle-label">显示品牌饰线</div><div class="toggle-desc">一条细线有时比一个 logo 更有识别度。</div></div><button class="toggle ${draft.colors.accentLine ? 'is-on' : ''}" data-action="flip-path" data-path="colors.accentLine"></button></div>
          
          
          
          <div class="toggle-row" style="flex:1;margin-left:18px"><div><div class="toggle-label">机身铭牌刻字</div><div class="toggle-desc">在机身正面保留品牌与型号铭牌。</div></div><button class="toggle ${draft.colors.engraving ? 'is-on' : ''}" data-action="flip-path" data-path="colors.engraving"></button></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">05</span> 色彩与材质氛围</div></div><span class="studio-section-hint">${esc(ev.identity)}</span></div>
        <div class="grid-3">
          
          
          
          <div class="callout"><div class="callout-title">${icon('palette')} 色彩协调</div>${ev.warnings.find(w => /双色|色相/.test(w.text)) ? '当前双色搭配存在冲突，建议让其中一种颜色更中性。' : '当前色彩组合协调，材质所呈现的光泽也支持这种气质。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('layers')} 表面统一性</div>顶盖、握柄与前脸使用不同的处理会带来拼装感。复古与专业设计更依赖材质一致性。</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('trend')} 审美画像</div>复古 ${Math.round(ev.traits.retro)} · 专业 ${Math.round(ev.traits.pro)} · 潮流 ${Math.round(ev.traits.trend)} · 商务 ${Math.round(ev.traits.business)}</div>
        </div>
      </div>`;
  }

  function renderCameraStep4(draft, ev) {
    const screen = draft.screen;
    const view = draft.viewfinder;
    const screenOptions = [
      { id: 'fixed', name: '固定屏', meta: '结构最薄' },
      { id: 'sideflip', name: '侧翻屏', meta: '自拍 / 视频' },
      { id: 'upflip', name: '上翻屏', meta: '低角度' },
      { id: 'downflip', name: '下翻屏', meta: '腰平视角' },
      { id: 'tilt', name: '翻转屏', meta: '上下翻折' },
      { id: 'fold', name: '折叠屏', meta: '复杂结构' },
      { id: 'none', name: '无屏幕', meta: '电影外接' }
    ];
    const screenResOpts = [
      { id: '720p', label: '720p', tech: 1 },
      { id: '1080p', label: '1080p', tech: 1 },
      { id: '1440p', label: '1440p', tech: 3 },
      { id: '4k', label: '4K', tech: 4 }
    ];
    const vfResOpts = [
      { id: '2.36m', label: '2.36M', tech: 2 },
      { id: '3.69m', label: '3.69M', tech: 3 },
      { id: '5.76m', label: '5.76M', tech: 4 },
      { id: '9.44m', label: '9.44M', tech: 5 }
    ];
    const buttonRows = Object.keys(D.CONTROLS).map(id => {
      const def = D.CONTROLS[id];
      const current = draft.controls.buttons[id] || { enabled: false, pos: 'back_upper_right' };
      return `<div class="control-row ${current.enabled ? '' : 'is-disabled'}">
        <div class="control-name"><span class="dot" style="opacity:${current.enabled ? 1 : .25}"></span>${esc(def.name)}<span class="faint" style="font-family:var(--font-mono);font-size:7px">${esc(def.en)}</span></div>
        <button class="toggle control-toggle ${current.enabled ? 'is-on' : ''}" data-action="toggle-control" data-control="${id}" aria-label="${attr(def.name)}"></button>
        <select class="select-input" data-path="controls.buttons.${id}.pos" ${current.enabled ? '' : 'disabled'}>
          
          
          
          ${Object.values(D.CONTROL_POSITIONS).map(p => `<option value="${p.id}" ${current.pos === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </div>`;
    }).join('');
    const dials = draft.controls.dials || {};
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 操控布局</div><div class="studio-section-desc">布局预设只是起点。按键数量和位置会影响握持、误触概率和目标用户的专业感判断。</div></div><span class="studio-section-hint">${ev.buttonCount} 个按键 · ${ev.dialCount} 个拨轮</span></div>
        <div class="template-row mb-12">
          
          
          
          ${[['pro', '专业均衡', '双拨轮 + 摇杆，适合工作流'], ['retro', '复古机械', '大量拨轮与独立按键'], ['video', '视频优先', '录制 / 自定义键优先'], ['minimal', '极简触控', '少按键、触控为主']].map(([id, label, desc]) => `<button class="template-btn" data-action="control-preset" data-preset="${id}"><b>${label}</b><span>${desc}</span></button>`).join('')}
        </div>
        <div class="section-split">
          
          
          
          <div>
          
          
          
            <div class="control-table">
          
          
          
              <div class="control-row header"><span>按键</span><span>启用</span><span>位置</span></div>
          
          
          
              ${buttonRows}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">拨轮与摇杆</div>
          
          
          
            <div class="dial-grid">
          
          
          
              ${[['front', '前拨轮'], ['rear', '后拨轮'], ['mode', '模式转盘'], ['extra', '第三拨轮']].map(([k, label]) => `<div class="dial-card"><label>${label}</label><button class="toggle ${dials[k] ? 'is-on' : ''}" data-action="flip-path" data-path="controls.dials.${k}"></button></div>`).join('')}
          
          
          
              ${toggleRow('controls.joystick', '多功能摇杆', draft.controls.joystick, '快速移动自动对焦点')}
          
          
          
            </div>
          
          
          
            ${draft.controls.joystick ? `<div class="form-field mt-8"><label>摇杆位置</label><select class="select-input" data-path="controls.joystickPos">${Object.values(D.CONTROL_POSITIONS).filter(p => p.zone === 'back' || p.zone === 'grip').map(p => `<option value="${p.id}" ${draft.controls.joystickPos === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>` : ''}
          
          
          
            <div class="mini-label mt-16 mb-8">触控区域</div>
          
          
          
            <div class="segmented">
          
          
          
              ${[['whole', '全屏触控'], ['right', '右侧快捷区'], ['off', '关闭触控']].map(([v, l]) => `<button class="${draft.controls.touchZone === v ? 'is-active' : ''}" data-action="set-choice" data-path="controls.touchZone" data-value="${v}">${l}</button>`).join('')}
          
          
          
            </div>
          
          
          
            <div class="form-help mt-8">触控区越大越易操作，但冬天戴手套或在片场时，物理按键更可靠。</div>
          
          
          
            <div class="mini-label mt-16 mb-8">屏幕界面语言</div>
          
          
          
            <div class="segmented">
          
          
          
              ${[['professional', '专业仪表'], ['classic', '复古机械'], ['minimal', '极简触控'], ['cinema', '电影片场']].map(([v, l]) => `<button class="${(draft.softwareUI || 'professional') === v ? 'is-active' : ''}" data-action="set-choice" data-path="softwareUI" data-value="${v}">${l}</button>`).join('')}
          
          
          
            </div>
          
          
          
            <div class="form-help mt-8">菜单与实时取景的界面语言会影响整机的专业感和用户直觉。</div>
          
          
          
          </div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 屏幕结构与尺寸</div><div class="studio-section-desc">翻转结构直接决定视频博主的使用体验，也会改变机身厚度与可靠性。</div></div></div>
        <div class="option-grid cols-4">
          
          
          
          ${screenOptions.map(s => optionCard({ name: s.name, meta: s.meta, active: screen.type === s.id, action: 'set-choice', path: 'screen.type', value: s.id })).join('')}
        </div>
        ${screen.type !== 'none' ? `<div class="range-cluster mt-16">
          
          
          
          ${rangeField('screen.size', '屏幕尺寸', Number(screen.size).toFixed(1), 2, 4.5, 0.1, '英寸', '对角线尺寸；过大可能干扰机身比例')}
          
          
          
          ${rangeField('screen.bezel', '屏幕边框宽度', Number(screen.bezel || 5), 1, 16, 1, 'mm', '窄边框更现代，宽边框更耐用')}
        </div>
        <div class="section-split mt-16">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">显示素质</div>
          
          
          
            <div class="segmented">
          
          
          
              ${screenResOpts.map(o => `<button class="${screen.res === o.id ? 'is-active' : ''}" data-action="set-choice" data-path="screen.res" data-value="${o.id}" ${game.company.tech.screen < o.tech ? 'disabled title="需要屏幕技术 Lv.' + o.tech + '"' : ''}>${o.label}${game.company.tech.screen < o.tech ? ' 🔒' : ''}</button>`).join('')}
          
          
          
            </div>
          
          
          
            <div class="range-cluster mt-12">
          
          
          
              ${rangeField('screen.nits', '峰值亮度', Math.round(screen.nits), 300, 3000, 50, 'nit', '户外取景能力')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">色彩与刷新</div>
          
          
          
            <div class="segmented">${Object.values(D.GAMUTS).map(g => `<button class="${screen.gamut === g.id ? 'is-active' : ''}" data-action="set-choice" data-path="screen.gamut" data-value="${g.id}">${esc(g.name)}</button>`).join('')}</div>
          
          
          
            <div class="segmented mt-8">${[60, 90, 120, 144].map(r => `<button class="${Number(screen.refresh) === r ? 'is-active' : ''}" data-action="set-choice" data-path="screen.refresh" data-value="${r}" data-value-type="number" ${r > 60 && game.company.tech.screen < 4 ? 'disabled title="需要屏幕技术 Lv.4"' : ''}>${r}Hz</button>`).join('')}</div>
          
          
          
            <div class="flex gap-8 mt-12">
          
          
          
              <button class="toggle ${screen.touch ? 'is-on' : ''}" data-action="flip-path" data-path="screen.touch"></button>
          
          
          
              <div><div class="toggle-label">触控屏</div><div class="toggle-desc">视频博主与大众用户的重要触点。</div></div>
          
          
          
            </div>
          
          
          
          </div>
        </div>` : '<div class="callout warn mt-12">取消屏幕会让相机完全依赖取景器或外接监视器。除非你正在设计一台纯电影设备，否则这会严重影响消费和专业混合用途。</div>'}
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 取景器</div><div class="studio-section-desc">取景器是相机的“眼”，也是专业身份最直观的符号之一。</div></div></div>
        <div class="option-grid cols-5">
          
          
          
          ${Object.values(D.VIEWFINDER_TYPES).map(v => optionCard({ name: esc(v.name), desc: esc(v.desc), active: view.type === v.id, action: 'set-choice', path: 'viewfinder.type', value: v.id })).join('')}
        </div>
        ${view.type !== 'none' ? `<div class="form-grid cols-3 mt-12">
          
          
          
          <div class="form-field"><label>物理位置</label><select class="select-input" data-path="viewfinder.pos">${Object.values(D.VIEWFINDER_POSITIONS).map(p => `<option value="${p.id}" ${view.pos === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
          
          
          
          <div class="form-field"><label>取景器分辨率</label><select class="select-input" data-path="viewfinder.res">${vfResOpts.map(o => `<option value="${o.id}" ${view.res === o.id ? 'selected' : ''} ${game.company.tech.screen < o.tech ? 'disabled' : ''}>${o.label}${game.company.tech.screen < o.tech ? ' · 需 Lv.' + o.tech : ''}</option>`).join('')}</select></div>
          
          
          
          <div class="form-field"><label>放大倍率</label><input class="text-input" type="number" min="0.5" max="1.2" step="0.01" data-path="viewfinder.magnification" value="${view.magnification || 0.76}"></div>
        </div>` : ''}
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 操控体检</div></div></div>
        <div class="grid-3">
          
          
          
          <div class="callout"><div class="callout-title">${icon('target')} 专业感</div>${ev.traits.pro >= 70 ? '拨轮、取景器与按键布局呈现出专业工作流的逻辑。' : '当前专业感偏弱，专业用户可能会把它当作消费级产品。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('hand')} 握持与误触</div>${ev.crowdedZones.length ? '有按键集中在同一区域，容易发生误触。' : '按键分布在可用的操作区域内。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('video')} 视频友好度</div>${['sideflip', 'fold', 'upflip'].includes(screen.type) ? '翻转屏结构适合自拍与低角度视频。' : '当前屏幕结构更偏静态摄影工作流。'}</div>
        </div>
      </div>`;
  }

  function renderCameraStep5(draft, ev) {
    const mounts = Object.values(D.MOUNTS);
    const selectedMount = D.MOUNTS[draft.mount.type] || D.MOUNTS.E;
    const sensorIdx = D.SENSOR_FORMATS[draft.sensor.format].index;
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 镜头卡口</div><div class="studio-section-desc">卡口决定可用的镜头生态、法兰距和机身厚度。固定镜头会锁住用户，也简化设计。</div></div><span class="studio-section-hint">当前传感器：${esc(D.SENSOR_FORMATS[draft.sensor.format].name)}</span></div>
        <div class="option-grid cols-4">
          
          
          
          ${mounts.map(m => {
          
          
          
            const compatible = sensorIdx <= m.maxFormat;
          
          
          
            return optionCard({ name: `${esc(m.name)} <span style="font-family:var(--font-mono);font-size:7px;color:var(--faint)">${esc(m.en)}</span>`, desc: esc(m.desc), meta: `<span>最大像场 ${esc(D.SENSOR_FORMATS[Object.keys(D.SENSOR_FORMATS).find(k => D.SENSOR_FORMATS[k].index === m.maxFormat)]?.name || '—')}</span>${!compatible ? '<span class="bad">像场不足</span>' : ''}`, active: draft.mount.type === m.id, action: 'set-choice', path: 'mount.type', value: m.id, locked: false });
          
          
          
          }).join('')}
        </div>
        ${sensorIdx > selectedMount.maxFormat ? `<div class="callout bad mt-12"><div class="callout-title">${icon('alert')} 像场不兼容</div>当前画幅大于 ${esc(selectedMount.name)} 卡口的最大像场，系统会阻止上市。请更换卡口，或回到影像核心调整传感器。</div>` : ''}
        <div class="form-grid cols-3 mt-16">
          
          
          
          <div class="form-field"><label>卡口环材质</label><select class="select-input" data-path="mount.ringMaterial">${Object.values(D.RING_MATERIALS).map(r => `<option value="${r.id}" ${draft.mount.ringMaterial === r.id ? 'selected' : ''}>${esc(r.name)} · +${moneyNumber(r.cost)}</option>`).join('')}</select></div>
          
          
          
          <div class="form-field"><label>卡口对齐</label><div class="segmented">${[['left', '左置'], ['center', '中置'], ['right', '右置']].map(([v, l]) => `<button class="${draft.mount.align === v ? 'is-active' : ''}" data-action="set-choice" data-path="mount.align" data-value="${v}">${l}</button>`).join('')}</div></div>
          
          
          
          <div class="form-field"><div class="mini-label mb-8">卡口比例</div>${rangeField('mount.ratio', '镜头环直径', Math.round(draft.mount.ratio), 72, 130, 1, '%')}</div>
        </div>
        <div class="mt-12"><span class="mini-label">卡口装饰环</span><div class="color-palette mt-8">${D.RING_COLORS.map(c => `<button class="color-chip ${draft.mount.ringColor === c.id ? 'is-active' : ''}" style="background:${c.hex}" data-action="set-choice" data-path="mount.ringColor" data-value="${c.id}" title="${esc(c.name)}"></button>`).join('')}<span class="form-help" style="align-self:center">镜头环是品牌视觉识别的一部分。</span></div></div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 前部识别细节</div><div class="studio-section-desc">这些不是简单的装饰：它们向用户传达这台相机属于哪个世界。</div></div><span class="studio-section-hint">${Object.values(D.FRONT_DETAILS).filter(d => draft.details[d.id]).length} / ${Object.keys(D.FRONT_DETAILS).length} 启用</span></div>
        <div class="option-grid cols-4">
          
          
          
          ${Object.values(D.FRONT_DETAILS).map(d => {
          
          
          
            let lock = false;
          
          
          
            if (['cage', 'handle', 'expansion'].includes(d.id) && (game.company.tech.modular || 1) < 2) lock = true;
          
          
          
            return optionCard({ name: esc(d.name), desc: esc(d.desc), active: !!draft.details[d.id], action: 'flip-path', path: `details.${d.id}`, meta: `<span>+${moneyNumber(d.cost)}</span>${d.weight ? `<span>+${d.weight}g</span>` : ''}${lock ? '<span class="bad">模块技术 Lv.2</span>' : ''}`, locked: lock });
          
          
          
          }).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 专业配件系统</div><div class="studio-section-desc">配件不是附属品。一个肩扛支架就能改变整台相机的视觉定位和目标市场。</div></div><span class="studio-section-hint">配件重量 ${ev.accessoryWeight}g</span></div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(D.ACCESSORIES).map(a => optionCard({ name: esc(a.name), desc: esc(a.desc), active: !!draft.accessories[a.id], action: 'flip-path', path: `accessories.${a.id}`, meta: `<span>+${moneyNumber(a.cost)}</span><span>+${a.weight}g</span>`, iconHTML: icon(a.id === 'monitor' ? 'video' : a.id === 'mic' || a.id === 'wireless' ? 'zap' : a.id === 'cage' || a.id === 'shoulder' ? 'layers' : a.id === 'fan' ? 'refresh' : 'box') })).join('')}
        </div>
        ${(draft.accessories.mic || draft.accessories.monitor || draft.accessories.batteryGrip || draft.accessories.verticalGrip) ? `<div class="form-grid cols-4 mt-12">
          
          
          
          ${draft.accessories.mic ? `<div class="form-field"><label>麦克风安装位置</label><select class="select-input" data-path="accessories.micPos"><option value="top" ${draft.accessories.micPos === 'top' ? 'selected' : ''}>热靴顶部</option><option value="side" ${draft.accessories.micPos === 'side' ? 'selected' : ''}>侧面扩展臂</option></select></div>` : ''}
          
          
          
          ${draft.accessories.monitor ? `<div class="form-field"><label>监视器尺寸</label><div class="segmented">${[5, 7].map(v => `<button class="${Number(draft.accessories.monitorSize) === v ? 'is-active' : ''}" data-action="set-choice" data-path="accessories.monitorSize" data-value="${v}" data-value-type="number">${v} 英寸</button>`).join('')}</div></div>` : ''}
          
          
          
          ${draft.accessories.batteryGrip ? `<div class="form-field"><label>电池手柄造型</label><div class="segmented">${[['standard', '标准'], ['pro', '加大专业版']].map(([v, l]) => `<button class="${draft.accessories.batteryGripStyle === v ? 'is-active' : ''}" data-action="set-choice" data-path="accessories.batteryGripStyle" data-value="${v}">${l}</button>`).join('')}</div></div>` : ''}
          
          
          
          ${draft.accessories.verticalGrip ? `<div class="form-field"><label>竖拍手柄造型</label><div class="segmented">${[['slim', '轻薄'], ['full', '全尺寸']].map(([v, l]) => `<button class="${draft.accessories.verticalGripStyle === v ? 'is-active' : ''}" data-action="set-choice" data-path="accessories.verticalGripStyle" data-value="${v}">${l}</button>`).join('')}</div></div>` : ''}
        </div>` : ''}
        <div class="callout mt-12"><div class="callout-title">${icon('info')} 不要为了堆满而堆满</div>配件会改变外观风格、重量、握持和售价预期。电影剧组喜欢笼架和监视器，普通消费者可能只想一台能塞进口袋的相机。</div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 整体配件视觉</div></div></div>
        <div class="spec-highlight">
          
          
          
          ${draft.accessories.batteryGrip ? '<span>电池手柄</span>' : ''}${draft.accessories.verticalGrip ? '<span>竖拍手柄</span>' : ''}${draft.accessories.mic ? '<span>机头麦</span>' : ''}${draft.accessories.monitor ? '<span>外接监视器</span>' : ''}${draft.accessories.fan ? '<span>主动散热</span>' : ''}${draft.accessories.cage ? '<span>笼架</span>' : ''}${draft.accessories.shoulder ? '<span>肩扛支架</span>' : ''}${draft.accessories.wireless ? '<span>无线图传</span>' : ''}${draft.accessories.flash ? '<span>闪光灯</span>' : ''}
          
          
          
          ${!Object.values(draft.accessories).some(Boolean) ? '<span>纯机身 / 无配件</span>' : ''}
        </div>
        ${ev.warnings.filter(w => /手柄|散热|配件|笼架|肩扛/.test(w.text)).map(w => `<div class="callout ${w.blocking ? 'bad' : 'warn'} mt-8">${esc(w.text)}</div>`).join('')}
      </div>`;
  }

  function renderCameraStep6(draft, ev) {
    const fs = D.SENSOR_FORMATS;
    const fmt = fs[draft.sensor.format];
    const maxMp = E.maxMPFor(draft.sensor.format, game.company);
    const sensorTypes = Object.values(D.SENSOR_TYPES);
    const afSystems = Object.values(D.AF_SYSTEMS);
    const stabs = Object.values(D.STABILIZATIONS);
    const cardTypes = Object.values(D.CARD_TYPES);
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 传感器系统</div><div class="studio-section-desc">画幅、像素和读出方式共同决定画质与速度。先进结构需要对应技术等级。</div></div><span class="studio-section-hint">传感器技术 Lv.${game.company.tech.sensor}</span></div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(fs).map(f => optionCard({ name: esc(f.name), desc: esc(f.areaLabel), meta: `<span>${esc(f.en)}</span><span>${f.minMP}-${E.maxMPFor(f.id, game.company)}MP</span>`, active: draft.sensor.format === f.id, action: 'set-sensor-format', value: f.id, locked: (f.id === 'mf' && game.company.tech.sensor < 3) || (f.id === 'lf' && game.company.tech.sensor < 4) })).join('')}
        </div>
        <div class="form-grid cols-3 mt-16">
          
          
          
          <div class="form-field">
          
          
          
            <label>有效像素 <span class="faint">(最大 ${maxMp}MP)</span></label>
          
          
          
            ${numberRangeField('sensor.mp', 'Megapixels', Math.round(draft.sensor.mp), fmt.minMP, Math.max(maxMp, fmt.minMP), 1, 'MP', '')}
          
          
          
          </div>
          
          
          
          <div class="form-field"><label>传感器类型</label><div class="option-grid cols-2">${sensorTypes.map(t => `<button class="option-card ${draft.sensor.type === t.id ? 'is-active' : ''} ${game.company.tech.sensor < t.tech ? 'is-locked' : ''}" data-action="set-choice" data-path="sensor.type" data-value="${t.id}" ${game.company.tech.sensor < t.tech ? 'disabled' : ''}><div class="option-card-name">${esc(t.name)}</div><div class="option-card-meta">${game.company.tech.sensor < t.tech ? '需要 Lv.' + t.tech : t.en}</div></button>`).join('')}</div></div>
          
          
          
          <div class="form-field"><label>色彩深度</label><div class="segmented">${[10, 12, 14, 16].map(b => `<button class="${Number(draft.sensor.colorDepth) === b ? 'is-active' : ''}" data-action="set-choice" data-path="sensor.colorDepth" data-value="${b}" data-value-type="number">${b}-bit</button>`).join('')}</div><div class="form-help">中画幅和大画幅通常支持更高色彩深度。</div></div>
        </div>
        <div class="range-cluster mt-16">
          
          
          
          ${rangeField('sensor.dynamicRange', '动态范围', Number(draft.sensor.dynamicRange).toFixed(1), 9, 16, 0.1, 'EV', '高动态范围需要更好的传感器与处理器')}
          
          
          
          ${numberRangeField('sensor.baseIso', '原生 ISO', Math.round(draft.sensor.baseIso), 32, 1600, 32, 'ISO', '低原生 ISO 通常意味着更干净的画面')}
          
          
          
          ${rangeField('sensor.dualIsoValue', '双原生 ISO 高值', Math.round(draft.sensor.dualIsoValue || 800), 100, 12800, 100, 'ISO', '第二档原生增益，提升弱光表现')}
          
          
          
          ${toggleRow('sensor.dualIso', '双原生 ISO', draft.sensor.dualIso, '在暗光环境中提供第二档低噪声增益')}
        </div>
      <div class="chip-design-panel">
        ${(() => {
          const info = E.resolveDesignChips(draft, game.company);
          const chips = (game.company.cmosChips || []).slice().sort((a, b) => (b.builtMonth || 0) - (a.builtMonth || 0));
          const best = info.cmos || chips[0] || null;
          const source = (draft.chip && draft.chip.cmosSource) || 'procure';
          const supplier = E.getSensorSupplier(game.company);
          return `<div class="chip-design-head"><div><b>芯片方案 / CMOS</b><span>采购还是自研，会直接改变单位成本、画质上限和发布会叙事。</span></div><span class="badge ${source === 'inhouse' ? 'accent' : ''}">${source === 'inhouse' ? '自研' : '采购'}</span></div>
          <div class="chip-design-grid">
            <button class="chip-design-option ${source === 'procure' ? 'is-active' : ''}" data-action="set-chip-source" data-kind="cmos" data-source="procure">
              <span class="chip-design-label">采购 CMOS</span>
              <b>${esc(supplier.name)}</b>
              <span>成本 ×${supplier.cost.toFixed(2)} · 质量 ×${supplier.quality.toFixed(2)} · 交期 ${supplier.lead} 周</span>
            </button>
            <div class="chip-design-option ${source === 'inhouse' ? 'is-active' : ''} ${best ? '' : 'is-locked'}">
              <span class="chip-design-label">自研 CMOS</span>
              <b>${best ? esc(best.name) : '尚无可用芯片'}</b>
              <span>${best ? `${esc((D.SENSOR_FORMATS[best.format] || {}).name || best.format)} · ${best.mp}MP · 成本 ×${Number(best.costFactor).toFixed(2)} · 画质 +${best.quality}` : '先在芯片实验室完成一个 CMOS 项目'}</span>
              <div class="chip-design-actions">
                ${best ? `<button class="btn btn-xs ${source === 'inhouse' ? 'btn-primary' : 'btn-secondary'}" data-action="set-chip-source" data-kind="cmos" data-source="inhouse">${source === 'inhouse' ? '已使用' : '使用自研'}</button><button class="btn btn-xs btn-ghost" data-action="adopt-cmos-chip" data-id="${attr(best.id)}">采用该芯片规格</button>` : `<button class="btn btn-xs btn-secondary" data-action="nav" data-page="chips">前往芯片实验室</button>`}
              </div>
            </div>
          </div>
          ${info.warnings.length ? `<div class="callout ${source === 'inhouse' ? 'bad' : ''} mt-8">${info.warnings.map(w => esc(w)).join('<br>')}</div>` : ''}`;
        })()}
      </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 拍摄性能</div><div class="studio-section-desc">速度机不是单纯把数字拉高：传感器读出、快门、缓存和散热必须匹配。</div></div></div>
        <div class="range-cluster">
          
          
          
          ${rangeField('performance.burst', '最高连拍', Math.round(draft.performance.burst), 1, 60, 1, 'fps', '机械/电子快门下的最高速度')}
          
          
          
          ${numberRangeField('performance.buffer', '连拍缓存', Math.round(draft.performance.buffer), 10, 2000, 10, '张', 'RAW 连拍可持续张数')}
          
          
          
          ${rangeField('performance.afTracking', '追焦强度', Math.round(draft.performance.afTracking), 1, 5, 1, '/ 5', '算法与处理器共同决定')}
          
          
          
          ${rangeField('performance.ibisStops', '防抖补偿', Number(draft.performance.ibisStops || 0).toFixed(1), 0, 10, 0.5, 'EV', '更高的补偿级数需要更强的机械防抖')}
        </div>
        <div class="section-split mt-16">
          
          
          
          <div><div class="mini-label mb-8">快门结构</div><div class="option-grid cols-3">${Object.values(D.SHUTTERS).map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), active: draft.performance.shutter === s.id, action: 'set-choice', path: 'performance.shutter', value: s.id, meta: `<span>+${moneyNumber(s.cost)}</span>` })).join('')}</div></div>
          
          
          
          <div><div class="mini-label mb-8">自动对焦系统</div><div class="option-grid cols-2">${afSystems.map(a => optionCard({ name: esc(a.name), desc: esc(a.desc), active: draft.performance.afSystem === a.id, action: 'set-choice', path: 'performance.afSystem', value: a.id, meta: `<span>${game.company.tech.af < a.tech ? '需要 Lv.' + a.tech : a.en}</span>`, locked: game.company.tech.af < a.tech })).join('')}</div></div>
        </div>
        <div class="chip-design-panel mt-16">
          ${(() => {
            const info = E.resolveDesignChips(draft, game.company);
            const chips = (game.company.afChips || []).slice().sort((a, b) => (b.builtMonth || 0) - (a.builtMonth || 0));
            const best = info.af || chips[0] || null;
            const source = (draft.chip && draft.chip.afSource) || 'procure';
            return `<div class="chip-design-head"><div><b>对焦芯片 / AF</b><span>外购模组稳定省事；自研 AF 芯片能降低模组成本并提供额外追焦加成。</span></div><span class="badge ${source === 'inhouse' ? 'accent' : ''}">${source === 'inhouse' ? '自研' : '采购'}</span></div>
            <div class="chip-design-grid">
              <button class="chip-design-option ${source === 'procure' ? 'is-active' : ''}" data-action="set-chip-source" data-kind="af" data-source="procure">
                <span class="chip-design-label">采购 AF 模组</span>
                <b>${esc(D.AF_SYSTEMS[draft.performance.afSystem] ? D.AF_SYSTEMS[draft.performance.afSystem].name : '自动对焦模组')}</b>
                <span>随对焦系统一起采购，成本已计入整机</span>
              </button>
              <div class="chip-design-option ${source === 'inhouse' ? 'is-active' : ''} ${best ? '' : 'is-locked'}">
                <span class="chip-design-label">自研 AF 芯片</span>
                <b>${best ? esc(best.name) : '尚无可用芯片'}</b>
                <span>${best ? `对焦 +${best.bonus} · 模组成本 ${best.costDelta}` : '先在芯片实验室完成一个 AF 芯片项目'}</span>
                <div class="chip-design-actions">
                  ${best ? `<button class="btn btn-xs ${source === 'inhouse' ? 'btn-primary' : 'btn-secondary'}" data-action="set-chip-source" data-kind="af" data-source="inhouse">${source === 'inhouse' ? '已使用' : '使用自研'}</button><button class="btn btn-xs btn-ghost" data-action="adopt-af-chip" data-id="${attr(best.id)}">采用当前芯片</button>` : `<button class="btn btn-xs btn-secondary" data-action="nav" data-page="chips">前往芯片实验室</button>`}
                </div>
              </div>
            </div>`;
          })()}
        </div>
        <div class="mini-label mt-16 mb-8">机身防抖</div>
        <div class="option-grid cols-4">${stabs.map(s => optionCard({ name: esc(s.name), desc: esc(s.desc), active: draft.performance.stabilization === s.id, action: 'set-choice', path: 'performance.stabilization', value: s.id, meta: `<span>${game.company.tech.ibis < s.tech ? '需要 Lv.' + s.tech : s.stops + ' EV'}</span>`, locked: game.company.tech.ibis < s.tech })).join('')}</div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 存储与工作流</div></div></div>
        <div class="section-split">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">静态文件格式</div>
          
          
          
            <div class="flex gap-6" style="flex-wrap:wrap">${Object.values(D.STORAGE_FORMATS).map(f => `<button class="check-chip ${draft.performance.storage.includes(f.id) ? 'is-active' : ''}" data-action="toggle-array" data-path="performance.storage" data-value="${f.id}">${esc(f.name)}</button>`).join('')}</div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">卡槽与卡型</div>
          
          
          
            <div class="flex gap-8 items-center">
          
          
          
              <select class="select-input" style="width:110px" data-path="performance.cardSlots">${[1, 2, 3].map(n => `<option value="${n}" ${Number(draft.performance.cardSlots) === n ? 'selected' : ''}>${n} 个卡槽</option>`).join('')}</select>
          
          
          
              <select class="select-input" style="flex:1" data-path="performance.cardType">${cardTypes.map(c => `<option value="${c.id}" ${draft.performance.cardType === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          
          
          
            </div>
          
          
          
            <div class="form-help">双卡槽是专业工作流的基本安全网；高码率视频对卡速有硬要求。</div>
          
          
          
          </div>
        </div>
        <div class="grid-3 mt-16">
          
          
          
          <div class="callout"><div class="callout-title">${icon('image')} 画质评分 ${Math.round(ev.scores.image)}</div>画幅与技术共同决定上限，过高像素密度会带来噪声与发热。</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('target')} 对焦评分 ${Math.round(ev.scores.focus)}</div>${ev.scores.focus >= 75 ? '现代AI识别对焦，快速且可靠。' : '对焦体系与当前价位相比仍有提升空间。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('zap')} 防抖评分 ${Math.round(ev.scores.stab)}</div>${ev.scores.stab >= 70 ? '手持弱光与视频稳定性优秀。' : '防抖能力有限，依赖镜头或稳定器。'}</div>
        </div>
        ${ev.blocking.length ? `<div class="callout bad mt-12"><div class="callout-title">${icon('alert')} 需要先解决的硬性条件</div>${ev.blocking.map(b => esc(b.text)).join('<br>')}</div>` : ''}
      </div>`;
  }

  function renderCameraStep7(draft, ev) {
    const video = draft.video;
    const maxMp = E.maxMPFor(draft.sensor.format, game.company);
    const resopts = Object.values(D.VIDEO_RES);
    const codecList = Object.values(D.CODECS);
    const ports = Object.values(D.PORTS);
    const wireless = Object.values(D.WIRELESS);
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 视频规格</div><div class="studio-section-desc">分辨率和帧率不只是营销数字。它们决定了传感器带宽、散热负载和存储压力。</div></div><span class="studio-section-hint">视频技术 Lv.${game.company.tech.video} · 编码 Lv.${game.company.tech.codec}</span></div>
        <div class="option-grid cols-5">
          
          
          
          ${resopts.map(r => optionCard({ name: esc(r.name), desc: esc(r.label), active: video.res === r.id, action: 'set-choice', path: 'video.res', value: r.id, meta: `<span>${game.company.tech.video < r.level ? '需要 Lv.' + r.level : '已解锁'}</span>`, locked: game.company.tech.video < r.level })).join('')}
        </div>
        <div class="mini-label mt-16 mb-8">最高帧率</div>
        <div class="segmented">
          
          
          
          ${D.FPS_OPTIONS.map(f => { const need = E.minVideoTechFor(video.res, f); return `<button class="${Number(video.fps) === f ? 'is-active' : ''}" data-action="set-choice" data-path="video.fps" data-value="${f}" data-value-type="number" ${game.company.tech.video < need ? 'disabled title="需要视频技术 Lv.' + need + '"' : ''}>${f}fps${game.company.tech.video < need ? ' 🔒' : ''}</button>`; }).join('')}
        </div>
        <div class="grid-2 mt-16">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">编码格式</div>
          
          
          
            <div class="flex gap-6" style="flex-wrap:wrap">
          
          
          
              ${codecList.map(c => {
          
          
          
                const need = c.tech; const selected = (video.codecs || []).includes(c.id); const locked = game.company.tech.codec < need;
          
          
          
                return `<button class="check-chip ${selected ? 'is-active' : ''}" data-action="toggle-array" data-path="video.codecs" data-value="${c.id}" ${locked ? 'disabled' : ''}>${esc(c.name)}${locked ? ' 🔒' : ''}</button>`;
          
          
          
              }).join('')}
          
          
          
            </div>
          
          
          
            <div class="form-help">至少选择一种编码。更多编码会增加处理器成本与授权成本。</div>
          
          
          
          </div>
          
          
          
          <div class="range-cluster">
          
          
          
            ${rangeField('video.bitrate', '最高码率', Math.round(video.bitrate), 50, 6000, 50, 'Mbps', '高码率意味着更高的存储与散热压力')}
          
          
          
            ${rangeField('video.overheatLimit', '过热保护阈值', Math.round(video.overheatLimit), 5, 180, 5, '分钟', '触发保护前的持续录制时间')}
          
          
          
          </div>
        </div>
        <div class="grid-3 mt-12">
          
          
          
          ${[['log', 'Log 曲线', '专业后期空间'], ['hlg', 'HLG', '直接输出 HDR'], ['rawOut', 'RAW 输出', '外录或机内 RAW'], ['external', '外录支持', '专业监视器/录机'], ['timecode', '时间码', '多机位同步'], ['genlock', '同步锁相', '片场多机系统']].map(([k, label, desc]) => `<button class="check-chip ${video[k] ? 'is-active' : ''}" data-action="flip-path" data-path="video.${k}" style="justify-content:space-between;width:100%">${label}<span class="faint" style="font-size:7px">${desc}</span></button>`).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 接口与无线</div><div class="studio-section-desc">接口不是“有就行”，数量和规格决定它能不能融入专业工作流。</div></div><span class="studio-section-hint">${draft.ports.length} 个接口</span></div>
        <div class="section-split">
          
          
          
          <div><div class="mini-label mb-8">物理接口</div><div class="flex gap-6" style="flex-wrap:wrap">${ports.map(p => `<button class="check-chip ${draft.ports.includes(p.id) ? 'is-active' : ''}" data-action="toggle-array" data-path="ports" data-value="${p.id}">${esc(p.name)} <span class="faint" style="font-size:7px">+${moneyNumber(p.cost)}</span></button>`).join('')}</div></div>
          
          
          
          <div><div class="mini-label mb-8">无线连接</div><div class="flex gap-6" style="flex-wrap:wrap">${wireless.map(w => `<button class="check-chip ${draft.wireless.includes(w.id) ? 'is-active' : ''}" data-action="toggle-array" data-path="wireless" data-value="${w.id}">${esc(w.name)} <span class="faint" style="font-size:7px">+${moneyNumber(w.cost)}</span></button>`).join('')}</div></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 电池与供电</div><div class="studio-section-desc">容量不是续航的全部。屏幕亮度、传感器和视频规格都会真实消耗电量。</div></div><span class="studio-section-hint">估算 ${ev.scores.shots} 张 / ${ev.scores.recordMinutes} 分钟</span></div>
        <div class="range-cluster">
          
          
          
          ${rangeField('battery.capacity', '电池容量', Math.round(draft.battery.capacity), 700, 10000, 50, 'mAh', '容量越大越重，也会占用更多机身空间')}
          
          
          
          ${rangeField('battery.pd', '充电功率', Math.round(draft.battery.pd), 0, 140, 5, 'W', 'USB PD 快充能力')}
          
          
          
          ${rangeField('battery.recordLimit', '固件录制上限', Math.round(draft.battery.recordLimit), 1, 240, 1, '分钟', '人为设置的固件限制，而非电池实际续航')}
          
          
          
          <div class="dial-grid">
          
          
          
            ${toggleRow('battery.usbPower', 'USB 供电', draft.battery.usbPower, '直播与长时间桌面工作')}
          
          
          
            ${toggleRow('battery.dummy', '假电池支持', draft.battery.dummy, '专业片场长时间供电')}
          
          
          
            ${toggleRow('battery.externalPower', '外接电源', draft.battery.externalPower, '电源接口与供电协议')}
          
          
          
          </div>
        </div>
        <div class="grid-3 mt-16">
          
          
          
          <div class="callout"><div class="callout-title">${icon('power')} 静态续航</div>约 ${ev.scores.shots} 张 / 次充电。基于屏幕亮度、传感器和机身功耗估算。</div>
          
          
          
          <div class="callout ${ev.scores.thermalRisk > 28 ? 'bad' : ''}"><div class="callout-title">${icon('refresh')} 热管理</div>估算热风险 ${Math.round(ev.scores.thermalRisk)} / 100。连续录制实际上限约 ${ev.scores.effectiveRecordLimit} 分钟。</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('video')} 视频评分 ${Math.round(ev.scores.video)}</div>${ev.scores.video >= 80 ? '规格与编码足以进入专业视频工作流。' : '视频能力处于同价位常规水平。'}</div>
        </div>
      </div>`;
  }

  function renderCameraStep8(draft, ev) {
    const launch = E.previewCameraLaunch(game, draft);
    const kitLens = getCameraKitLens(draft);
    const compatLenses = activeLenses().filter(l => {
      const cm = draft.mount.type;
      if (!cm || cm === 'FIXED' || l.mount.type !== cm) return false;
      const sensorIdx = D.SENSOR_FORMATS[draft.sensor.format].index;
      const covIdx = D.SENSOR_FORMATS[l.coverage].index;
      return covIdx >= sensorIdx;
    });
    const cashAfter = game.company.cash - launch.totalLaunch;
    const expectedDemand = launch.demand.units;
    const blocking = ev.blocking;
    const margin = 1 - ev.unitCost / Math.max(1, draft.price || ev.suggestedPrice);
    const benchmark = E.getCategoryBenchmark(game, draft.category);
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 定价与备货</div><div class="studio-section-desc">价格是产品定义的一部分。较高的售价能支撑更好的材料与服务，但会面对更成熟竞品的直接比较。</div></div><span class="studio-section-hint">建议零售 ${moneyNumber(ev.suggestedPrice)}</span></div>
        <div class="form-grid cols-3">
          
          
          
          <div class="form-field"><label>零售价 / 单机身</label><div class="input-with-unit"><input class="text-input" type="number" min="99" step="100" value="${Math.round(draft.price)}" data-path="price" data-number="true"><span>CNY</span></div><div class="form-help">市场公允价约 ${moneyNumber(ev.fairPrice)}，建议成本价基础上保留渠道与售后空间。</div></div>
          
          
          
          <div class="form-field"><label>首批备货</label><div class="input-with-unit"><input class="text-input" type="number" min="0" step="100" value="${Math.round(draft.initialStock)}" data-path="initialStock" data-number="true"><span>台</span></div><div class="form-help">建议 ${ev.suggestedStock} 台。自动生产会按预测持续补货。</div></div>
          
          
          
          <div class="form-field"><label>套机镜头</label><select class="select-input" data-select-kit="camera">${compatLenses.length ? `<option value="">仅机身销售</option>${compatLenses.map(l => `<option value="${l.id}" ${draft.kitLensId === l.id ? 'selected' : ''}>${esc(l.name)} · ${moneyNumber(l.price)}</option>`).join('')}` : '<option value="">没有兼容镜头</option>'}</select><div class="form-help">${compatLenses.length ? '套机销售可提高客单价和镜头附着率。销售占比按 55% 估算。' : '先去设计一支兼容自家卡口的镜头，或只卖机身。'}</div></div>
        </div>
        <div class="grid-3 mt-12">
          
          
          
          <div class="financial-mini"><label>单机制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
          
          
          
          <div class="financial-mini"><label>毛利率（按售价）</label><b>${pctNum(margin * 100)}</b></div>
          
          
          
          <div class="financial-mini"><label>预期市场公允价</label><b>${moneyNumber(ev.fairPrice)}</b></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 品控标准</div><div class="studio-section-desc">更高的品控会降低故障率与售后成本，也会提高单机成本和出厂时间。</div></div><span class="studio-section-hint">预计故障率 ${ev.defectRate.toFixed(1)}%</span></div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(D.QC_TIERS).map(q => optionCard({ name: esc(q.name), desc: esc(q.desc), active: draft.qc === q.id, action: 'set-choice', path: 'qc', value: q.id, meta: `<span>+${moneyNumber(q.perUnit)} / 台</span><span>故障率 ×${q.defectMul}</span>` })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 认证与合规</div><div class="studio-section-desc">无线、电池与影像设备需要按市场送审。认证覆盖范围会影响首发市场与后续渠道成本。</div></div><span class="studio-section-hint">${esc(launch.cert.name)} · ${moneyNumber(launch.certCost)}</span></div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(D.CERTIFICATIONS).map(c => optionCard({ name: esc(c.name), desc: esc(c.desc), active: (draft.certification || 'standard') === c.id, action: 'set-choice', path: 'certification', value: c.id, meta: `<span>${esc(c.en)}</span><span>${moneyNumber(c.cost)}</span>` })).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 发布会与上市营销</div><div class="studio-section-desc">没有用户知道的产品不会自己卖出去。首发声量决定第一波订单与评测节奏。</div></div></div>
        <div class="option-grid cols-5">
          
          
          
          ${Object.values(D.CAMPAIGN_TIERS).map(c => optionCard({ name: esc(c.name), desc: esc(c.desc), active: draft.campaign === c.id, action: 'set-choice', path: 'campaign', value: c.id, meta: `<span>${c.cost ? moneyNumber(c.cost) : '免费'}</span><span>声量 +${c.hype}</span>` })).join('')}
        </div>
        <div class="launch-plan-summary">
          <div class="launch-plan-summary-main"><span class="eyebrow">LAUNCH EVENT</span><b>${esc(launch.event ? launch.event.label : '静默上市')}</b><span>${launch.event ? `声量 ${Math.round(launch.event.hype)} · 媒体评分 ${Math.round(launch.event.pressScore)} · 预购 ${launch.preorderUnits ? units(launch.preorderUnits) : '—'} · 成本 ${money(launch.event.cost)}` : '尚未配置发布会'}</span></div>
          <button class="btn btn-sm btn-secondary" data-action="open-launch-planner" data-kind="camera">${icon('megaphone')} 策划发布会</button>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">05</span> 财务与上市检查</div><div class="studio-section-desc">确认工具、库存、认证、营销和现金储备，然后把它推向市场。</div></div><span class="studio-section-hint">截至 ${E.monthLabel(game.monthIndex)}</span></div>
        <div class="launch-box">
          
          
          
          <div class="launch-box-title">${icon('receipt')} 上市投资概览</div>
          
          
          
          <div class="launch-box-grid">
          
          
          
            <div><label>模具与试产</label><b>${moneyNumber(launch.tooling)}</b></div>
          
          
          
            <div><label>首批库存成本</label><b>${moneyNumber(launch.initialStock * ev.unitCost)}</b></div>
          
          
          
            <div><label>${esc(launch.cert.name)}</label><b>${moneyNumber(launch.certCost)}</b></div>
          
          
          
            <div><label>发布会</label><b>${moneyNumber(launch.campaignCost)}</b></div>
          
          
          
            <div><label>现金总计占用</label><b style="color:${launch.totalLaunch > game.company.cash ? 'var(--bad)' : 'var(--accent-bright)'}">${moneyNumber(launch.totalLaunch)}</b></div>
          
          
          
            <div><label>上市后现金</label><b class="${cashAfter < 0 ? 'bad' : ''}">${moneyNumber(cashAfter)}</b></div>
          
          
          
            <div><label>预计首月需求</label><b>${units(expectedDemand)}</b></div>
          
          
          
          </div>
          
          
          
          <div class="launch-note">上市后会在下一个月开始产生销售。自动生产会按照市场需求预测进行补货；建议至少保留 1,000 台以上首批备货以覆盖口碑传播期。</div>
        </div>
        <div class="cost-breakdown">
          
          
          
          <div class="mini-label mb-8">成本结构 / COST BREAKDOWN</div>
          
          
          
          ${Object.entries(ev.costBreakdown).filter(([k]) => k !== 'total').map(([k, v]) => `<div class="cost-line"><label>${esc(COMPONENT_LABEL(k))}</label><b>${v === 0 ? '—' : moneyNumber(v)}</b></div>`).join('')}
          
          
          
          <div class="cost-line total"><label>单机制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">06</span> 竞品价格带</div><div class="studio-section-desc">当前市场同品类中的对手。定价与规格的匹配将直接影响吸引力。</div></div><span class="studio-section-hint">按媒体评分排序</span></div>
        ${benchmark.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>竞品</th><th>品牌</th><th>评分</th><th>价格</th><th>上市</th></tr></thead><tbody>${benchmark.map(p => `<tr><td class="name-cell">${esc(p.name)}</td><td><span class="brand-dot" style="background:${attr(p.color)}"></span>${esc(p.brand)}</td><td class="num">${p.score}</td><td class="num">${moneyNumber(p.price)}</td><td class="num">${p.age} 个月前</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-inline">当前品类暂无足够竞品数据。</div>'}
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">07</span> 上市检查</div></div></div>
        ${blocking.length ? `<div class="callout bad"><div class="callout-title">${icon('alert')} 仍有 ${blocking.length} 项阻塞问题</div>${blocking.map(w => esc(w.text)).join('<br>')}</div>` : `<div class="callout good"><div class="callout-title">${icon('checkcircle')} 可以上市</div>工程可行性与技术许可检查已通过。你可以继续优化，或直接进入上市评审。</div>`}
        ${ev.warnings.filter(w => !w.blocking).length ? `<div class="warning-list mt-8">${ev.warnings.filter(w => !w.blocking).map(w => `<div class="warning-item">${esc(w.text)}</div>`).join('')}</div>` : ''}
        <div class="flex justify-between items-center mt-16" style="flex-wrap:wrap;gap:10px">
          
          
          
          <div><div class="mini-label">预计口碑</div><div style="font-family:var(--font-display);font-size:28px;letter-spacing:-.03em">${ev.overall}<span style="font-size:11px;color:var(--faint);font-family:var(--font-ui)"> / 100</span></div></div>
          
          
          
          <div><div class="mini-label">目标用户匹配</div><div style="font-family:var(--font-display);font-size:28px;letter-spacing:-.03em">${ev.targetMatch}%</div></div>
          
          
          
          <button class="btn btn-primary btn-lg" data-action="open-launch-review" ${blocking.length ? 'disabled' : ''}>${icon('arrowUpRight')} 上市评审</button>
        </div>
      </div>`;
  }

  function COMPONENT_LABEL(key) {
    return {
      sensor: '传感器模组', processor: '处理器与主板', screen: '显示屏与触控', viewfinder: '取景器模组',
      body: '机身结构与材质', mount: '卡口与镜头环', controls: '按键与拨轮', stabilisation: '防抖模组',
      ports: '接口模组', wireless: '无线模块', battery: '电池与电源', details: '外观细节与结构件',
      accessories: '随机器材与配件', assembly: '组装、校准与包装', manufacturing: '代工/制造成本调整',
      qc: '品控与出厂检测', optics: '光学镜片组', mechanism: '机械结构', motor: '对焦马达',
      electronics: '电子与芯片', total: '总计'
    }[key] || key;
  }

  // ---------- lens studio ----------
  function renderLensEvalPanel(lens, ev) {
    const preview = P.renderLens(lens, game.company, { view: UI.lensView, compact: false, idPrefix: 'lensstudio' });
    const photoMode = UI.previewMode !== 'technical';
    const bars = [
      ['光学', ev.optical], ['对焦', ev.focus], ['防抖', ev.stabilization], ['做工', ev.build],
      ['颜值', ev.looks], ['便携', ev.portability], ['电影', ev.traits.cinema], ['复古', ev.traits.retro]
    ];
    const focal = Number(lens.focalMin) === Number(lens.focalMax) ? `${lens.focalMin}mm` : `${lens.focalMin}–${lens.focalMax}mm`;
    return `<div class="preview-card">
      <div class="preview-head">
        <div class="preview-head-left"><span class="preview-dot"></span><span class="preview-title">${photoMode ? 'PRODUCT PHOTO / LENS' : 'OPTICS LAB / ' + (UI.lensView === 'cutaway' ? 'SECTION' : 'SIDE')}</span></div>
        <div class="preview-actions">
          
          
          
          <div class="view-switcher">
          
          
          
            <button class="view-btn ${photoMode ? 'is-active' : ''}" data-action="preview-mode" data-mode="photo">产品图</button>
          
          
          
            <button class="view-btn ${!photoMode ? 'is-active' : ''}" data-action="preview-mode" data-mode="technical">技术图</button>
          
          
          
          </div>
          
          
          
          ${photoMode ? '' : `<div class="view-switcher">
          
          
          
            <button class="view-btn ${UI.lensView !== 'cutaway' ? 'is-active' : ''}" data-action="lens-view" data-view="side">外观</button>
          
          
          
            <button class="view-btn ${UI.lensView === 'cutaway' ? 'is-active' : ''}" data-action="lens-view" data-view="cutaway">剖面</button>
          
          
          
          </div>`}
        </div>
      </div>
      <div class="preview-stage lens-preview-stage ${photoMode ? 'is-photo' : 'is-blueprint'}">
        <span class="stage-corner tl"></span><span class="stage-corner tr"></span><span class="stage-corner bl"></span><span class="stage-corner br"></span>
        ${photoMode ? `<canvas class="art-canvas" data-art-live="lens"></canvas><span class="stage-camera-label">PURE WHITE · 4K PRODUCT</span>` : preview}
      </div>
      <div class="preview-info">
        <div class="preview-info-top">
          
          
          
          <div><div class="preview-info-name">${esc(lens.name || '未命名镜头')}</div><div class="preview-info-sub">${esc(lens.mount.type)} 卡口 · ${esc(D.LENS_TYPES[lens.lensType]?.name || '镜头')} · ${esc(D.SENSOR_FORMATS[lens.coverage]?.name || '')}</div></div>
          
          
          
          <div class="preview-info-price">${moneyNumber(lens.price || ev.suggestedPrice)}<small>建议零售价</small></div>
        </div>
        <div class="preview-dimensional"><span>焦距 <b>${focal}</b></span><span>光圈 <b>F${Number(lens.maxAperture).toFixed(1)}</b></span><span>长度 <b>${Math.round(lens.body.length)}mm</b></span><span>重量 <b>${Math.round(lens.body.weight)}g</b></span></div>
        ${photoMode ? `<div class="art-preview-actions"><span class="art-render-meta">照片库暂无镜头实拍 · 当前为 3D 结构示意（卡口 ${esc(lens.mount.type)} · 滤镜 ${lens.filter}mm）</span><button class="btn btn-xs btn-secondary" data-action="art-export-4k-lens">${icon('download')} 导出 4K 示意</button></div>` : ''}
      </div>
    </div>
    <div class="design-eval">
      <div class="eval-head"><span class="eval-title">OPTICAL EVALUATION / 镜头评价</span><span class="badge ${scoreTone(ev.overall) || 'accent'}">${ev.premiumBadge.label}</span></div>
      <div class="flex items-center justify-between mt-12" style="gap:12px">
        <div class="flex items-center gap-10">
          
          
          
          <div class="donut">
          
          
          
            <svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="25" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="4"/><circle cx="31" cy="31" r="25" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(ev.overall / 100) * 157} 157"/></svg>
          
          
          
            <div class="donut-center"><b>${ev.overall}</b><span>综合预测</span></div>
          
          
          
          </div>
          
          
          
          <div><div class="mini-label">OPTICAL / 光学素质</div><div style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em;line-height:1.1;margin-top:2px">${Math.round(ev.optical)}</div><div class="faint" style="font-size:7px">${D.LENS_TYPES[lens.lensType]?.name || ''}</div></div>
        </div>
        <div class="eval-match"><div style="text-align:right"><div class="mini-label">目标用户匹配</div><div class="match-value">${ev.targetMatch}<small style="font-size:9px;color:var(--faint)">%</small></div><div class="match-label">${esc(segmentData(lens.targetSegment).name)}</div></div></div>
      </div>
      <div class="lens-eval-grid">
        ${bars.map(([label, value]) => `<div class="lens-eval-item"><label>${label}<b>${Math.round(value)}</b></label><div class="progress"><i style="width:${clamp(value, 0, 100)}%"></i></div></div>`).join('')}
      </div>
      ${ev.warnings.length ? `<div class="warning-list">${ev.warnings.slice(0, 5).map(w => `<div class="warning-item ${w.blocking ? 'is-blocking' : ''}">${esc(w.text)}</div>`).join('')}</div>` : ''}
      <div class="studio-cost-mini">
        <div><label>制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
        <div><label>镜片结构</label><b>${ev.elements} 片 / ${ev.groups} 组</b></div>
        <div><label>建议售价</label><b>${moneyNumber(ev.suggestedPrice)}</b></div>
        <div><label>毛利空间</label><b>${pctNum((1 - ev.unitCost / Math.max(1, lens.price || ev.suggestedPrice)) * 100)}</b></div>
      </div>
    </div>`;
  }

  function renderLensStudio() {
    const lens = game.drafts.lens;
    if (!lens) { UI.page = 'design'; return renderDesignHub(); }
    const ev = E.evaluateLens(lens, game.company);
    const step = clamp(UI.lensStep || 1, 1, 3);
    UI.lensStep = step;
    let content = '';
    try {
      if (step === 1) content = renderLensStep1(lens, ev);
      else if (step === 2) content = renderLensStep2(lens, ev);
      else content = renderLensStep3(lens, ev);
    } catch (e) {
      console.error(e);
      content = `<div class="callout bad">镜头面板加载失败：${esc(e.message)}</div>`;
    }
    const stepMeta = LENS_STEPS[step - 1];
    const stepScore = step === 1 ? ev.optical : step === 2 ? ev.looks : ev.overall;
    return `<div class="studio-page lens-studio-page">
      <div class="studio-head">
        <div class="studio-head-left">
          
          
          
          <button class="studio-back" data-action="nav" data-page="design">${icon('arrowLeft')} 设计工作室</button>
          
          
          
          <div class="studio-title-row">
          
          
          
            <input class="studio-title-input" value="${attr(lens.name)}" data-path="name" data-scope="lens" maxlength="42" aria-label="镜头名称">
          
          
          
            <span class="badge accent">${esc(lens.mount.type)} 卡口</span>
          
          
          
            <span class="badge">${esc(D.LENS_TYPES[lens.lensType]?.name || '镜头')}</span>
          
          
          
          </div>
          
          
          
          <div class="studio-meta-row"><span>OPTICS DRAFT ${String(lens.id).slice(-6).toUpperCase()}</span><span class="sep"></span><span>光学设计 / 镜身工业设计</span><span class="sep"></span><span class="${ev.blocking.length ? 'bad' : 'good'}">${ev.blocking.length ? ev.blocking.length + ' 项阻塞' : '可上市'}</span></div>
        </div>
        <div class="studio-head-actions">
          
          
          
          <button class="btn btn-ghost btn-sm" data-action="save-draft">${icon('save')} 保存草稿</button>
          
          
          
          <button class="btn btn-ghost btn-sm" data-action="discard-lens-draft">${icon('trash')} 放弃</button>
          
          
          
          <button class="btn btn-primary btn-sm" data-action="lens-next">${step < 3 ? '继续设计' : '进入上市评审'} ${icon('arrowRight')}</button>
        </div>
      </div>
      <div class="studio-tabs-wrap">
        <div class="studio-tabs">
          
          
          
          ${LENS_STEPS.map(s => `<button class="studio-tab ${step === s.id ? 'is-active' : ''} ${step > s.id ? 'is-done' : ''}" data-action="lens-step" data-step="${s.id}"><span class="step-num">${String(s.id).padStart(2, '0')}</span>${s.short}</button>`).join('')}
        </div>
      </div>
      <div class="lens-studio-layout">
        <div class="studio-main">
          
          
          
          <div class="studio-step">
          
          
          
            <div class="studio-step-head">
          
          
          
              <div><div class="studio-step-eyebrow">STEP ${String(step).padStart(2, '0')} / ${stepMeta.label}</div><h2 class="studio-step-title">${esc(lensStepTitle(step))}</h2><p class="studio-step-desc">${lensStepDesc(step)}</p></div>
          
          
          
              <div class="studio-step-score"><b class="js-lens-score">${Math.round(stepScore)}</b><span>当前维度 / 100</span></div>
          
          
          
            </div>
          
          
          
            <div class="studio-step-body">${content}</div>
          
          
          
            <div class="studio-step-footer">
          
          
          
              <div class="step-dots">${LENS_STEPS.map(s => `<span class="step-dot ${s.id === step ? 'is-active' : ''} ${step > s.id ? 'is-done' : ''}"></span>`).join('')}</div>
          
          
          
              <div class="studio-footer-actions">
          
          
          
                ${step > 1 ? `<button class="btn btn-sm btn-secondary" data-action="lens-prev">${icon('arrowLeft')} 上一步</button>` : ''}
          
          
          
                <button class="btn btn-sm btn-secondary" data-action="save-draft">保存</button>
          
          
          
                ${step < 3 ? `<button class="btn btn-sm btn-primary" data-action="lens-next">下一步 ${icon('arrowRight')}</button>` : `<button class="btn btn-sm btn-primary" data-action="open-lens-launch-review">上市评审 ${icon('arrowRight')}</button>`}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <aside class="studio-side js-lens-side">${renderLensEvalPanel(lens, ev)}</aside>
      </div>
    </div>`;
  }

  function lensStepTitle(step) {
    return ['决定一束光如何被折叠。', '镜身是光学的表情。', '把玻璃带进真实市场。'][step - 1];
  }
  function lensStepDesc(step) {
    return [
      '焦距、光圈、镜片结构和卡口像场决定镜头的上限。好镜头不只是锐，它还要有自己的色彩和呼吸。',
      '镜身外观、材质、对焦环、齿轮和装饰环，会影响用户对它的专业判断和长期使用欲望。',
      '检查成本、定价、首批备货和营销节奏，然后把这支镜头推向你的卡口生态。'
    ][step - 1];
  }

  function lensCounter(label, value, path, min, max, unit) {
    return `<div class="lens-optical-counter"><label>${esc(label)}</label><div class="counter-row"><button class="counter-btn" data-action="counter" data-path="${attr(path)}" data-delta="-1" ${value <= min ? 'disabled' : ''}>−</button><span class="counter-value">${value}${unit || ''}</span><button class="counter-btn" data-action="counter" data-path="${attr(path)}" data-delta="1" ${value >= max ? 'disabled' : ''}>+</button></div></div>`;
  }

  function renderLensStep1(lens, ev) {
    const templates = [
      { id: 'fifty', name: '50mm F1.8', desc: '轻便人像 / 入门定焦', type: 'prime', focalMin: 50, focalMax: 50, maxAperture: 1.8, target: 'enthusiast' },
      { id: '2470', name: '24-70mm F2.8', desc: '专业标准变焦', type: 'zoom', focalMin: 24, focalMax: 70, maxAperture: 2.8, target: 'professional' },
      { id: '70200', name: '70-200mm F2.8', desc: '长焦工作马', type: 'tele', focalMin: 70, focalMax: 200, maxAperture: 2.8, target: 'professional' },
      { id: 'cine35', name: '35mm Cinema', desc: '电影定焦 / T1.8', type: 'cinema', focalMin: 35, focalMax: 35, maxAperture: 1.8, target: 'cinema' }
    ];
    const lensTypes = Object.values(D.LENS_TYPES);
    const coatOpts = Object.values(D.LENS_COATINGS);
    const motorOpts = Object.values(D.LENS_MOTORS);
    const compatibleMounts = Object.values(D.MOUNTS).filter(m => m.id !== 'FIXED');
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 快速光学模板</div><div class="studio-section-desc">从经典规格起步，再按你的镜头卡口和审美重做镜身。</div></div></div>
        <div class="template-row">
          
          
          
          ${templates.map(t => `<button class="template-btn" data-action="lens-template" data-template="${t.id}"><b>${t.name}</b><span>${t.desc}</span></button>`).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 镜头类型与卡口</div><div class="studio-section-desc">镜头需要与你的相机卡口生态协同，像场也必须覆盖目标画幅。</div></div><span class="studio-section-hint">卡口生态：${esc(lens.mount.type)}</span></div>
        <div class="option-grid cols-3">
          
          
          
          ${lensTypes.map(t => optionCard({ name: esc(t.name), desc: esc(t.desc), active: lens.lensType === t.id, action: 'set-choice', path: 'lensType', value: t.id, meta: `<span>${esc(t.en)}</span><span>成本 ×${t.costMul}</span>` })).join('')}
        </div>
        <div class="form-grid mt-16">
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">镜头卡口</div>
          
          
          
            <div class="mount-mini-grid">
          
          
          
              ${compatibleMounts.map(m => `<button class="mount-mini ${lens.mount.type === m.id ? 'is-active' : ''}" data-action="set-lens-mount" data-mount="${m.id}"><b>${esc(m.name)}</b><span>${esc(m.brand)}</span></button>`).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div>
          
          
          
            <div class="mini-label mb-8">像场覆盖</div>
          
          
          
            <div class="segmented">${Object.values(D.SENSOR_FORMATS).slice(0, 5).map(f => `<button class="${lens.coverage === f.id ? 'is-active' : ''}" data-action="set-choice" data-path="coverage" data-value="${f.id}">${esc(f.name)}</button>`).join('')}</div>
          
          
          
            <div class="form-help">像场必须覆盖所搭配相机的画幅。为 APS-C 设计全画幅镜头会带来更大体积和成本。</div>
          
          
          
            <div class="mini-label mt-16 mb-8">目标用户</div>
          
          
          
            <div class="choice-row">${D.SEGMENTS_ARRAY.map(s => `<button class="choice-btn ${lens.targetSegment === s.id ? 'is-active' : ''}" data-action="set-choice" data-path="targetSegment" data-value="${s.id}">${esc(s.name)}</button>`).join('')}</div>
          
          
          
          </div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 焦距与光圈</div><div class="studio-section-desc">这组参数会决定镜头的体积、成本、光学难度和用户场景。</div></div><span class="studio-section-hint">${ev.isZoom ? '变焦比 ' + ev.zoomRatio.toFixed(1) + '×' : '定焦'}</span></div>
        <div class="form-grid cols-4">
          
          
          
          <div class="form-field"><label>起始焦距</label><div class="input-with-unit"><input class="text-input" type="number" data-path="focalMin" data-number="true" min="4" max="1200" step="1" value="${lens.focalMin}"><span>mm</span></div></div>
          
          
          
          <div class="form-field"><label>终止焦距</label><div class="input-with-unit"><input class="text-input" type="number" data-path="focalMax" data-number="true" min="4" max="1200" step="1" value="${lens.focalMax}"><span>mm</span></div></div>
          
          
          
          <div class="form-field"><label>最大光圈</label><div class="input-with-unit"><input class="text-input" type="number" data-path="maxAperture" data-number="true" min="0.7" max="8" step="0.1" value="${lens.maxAperture}"><span>F</span></div></div>
          
          
          
          <div class="form-field"><label>最小光圈</label><div class="input-with-unit"><input class="text-input" type="number" data-path="minAperture" data-number="true" min="4" max="64" step="1" value="${lens.minAperture}"><span>F</span></div></div>
        </div>
        <div class="lens-focal-presets">
          
          
          
          ${[[24, 70], [28, 75], [50, 50], [85, 85], [70, 200], [100, 400], [12, 40], [35, 35]].map(([a, b]) => `<button data-action="lens-focal-preset" data-min="${a}" data-max="${b}">${a === b ? a + 'mm' : a + '-' + b + 'mm'}</button>`).join('')}
        </div>
        <div class="grid-2 mt-16">
          
          
          
          <div><div class="mini-label mb-8">光学结构</div><div class="lens-optical-grid">
          
          
          
            ${lensCounter('镜片数', lens.optical.elements, 'optical.elements', 4, 30, ' 片')}
          
          
          
            ${lensCounter('镜组数', lens.optical.groups, 'optical.groups', 3, 24, ' 组')}
          
          
          
            ${lensCounter('非球面', lens.optical.aspherical, 'optical.aspherical', 0, 8, ' 片')}
          
          
          
            ${lensCounter('低色散', lens.optical.ed, 'optical.ed', 0, 8, ' 片')}
          
          
          
          </div></div>
          
          
          
          <div><div class="mini-label mb-8">特殊镜片</div><div class="lens-optical-grid" style="grid-template-columns:1fr 1fr">
          
          
          
            ${lensCounter('萤石镜片', lens.optical.fluorite, 'optical.fluorite', 0, 4, ' 片')}
          
          
          
            ${lensCounter('滤镜口径', lens.filter, 'filter', 30, 160, ' mm')}
          
          
          
          </div></div>
        </div>
        <div class="grid-2 mt-16">
          
          
          
          <div><div class="mini-label mb-8">镀膜</div><div class="segmented">${coatOpts.map(c => `<button class="${lens.optical.coating === c.id ? 'is-active' : ''}" data-action="set-choice" data-path="optical.coating" data-value="${c.id}" ${c.tech && game.company.tech.optics < c.tech ? 'disabled title="需要光学技术 Lv.' + c.tech + '"' : ''}>${esc(c.name)}${c.tech && game.company.tech.optics < c.tech ? ' 🔒' : ''}</button>`).join('')}</div></div>
          
          
          
          <div><div class="mini-label mb-8">对焦马达</div><div class="segmented">${motorOpts.map(c => `<button class="${lens.focus.motor === c.id ? 'is-active' : ''}" data-action="set-choice" data-path="focus.motor" data-value="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>
        </div>
        <div class="range-cluster mt-16">
          
          
          
          ${rangeField('focus.minDistance', '最近对焦距离', Number(lens.focus.minDistance).toFixed(2), 0.08, 3, 0.01, 'm', '越近越适合微距和细节')}
          
          
          
          ${rangeField('stabilizationStops', '镜头防抖补偿', Number(lens.stabilizationStops || 0).toFixed(1), 0, 8, 0.5, 'EV', '镜头光学防抖的补偿级数')}
          
          
          
          ${toggleRow('stabilization', '镜头光学防抖 OIS', lens.stabilization, '在长焦和弱光中提升成功率')}
          
          
          
          <div class="form-field"><label>呼吸效应控制</label><div class="segmented">${[['normal', '普通'], ['minimal', '低呼吸']].map(([v, l]) => `<button class="${lens.focus.breathing === v ? 'is-active' : ''}" data-action="set-choice" data-path="focus.breathing" data-value="${v}">${l}</button>`).join('')}</div><div class="form-help">低呼吸对视频对焦构图更友好。</div></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 光学预估</div></div></div>
        <div class="grid-3">
          
          
          
          <div class="callout"><div class="callout-title">${icon('lens')} 光学评分 ${Math.round(ev.optical)}</div>${ev.optical >= 80 ? '特殊镜片与镀膜让这支镜头具备高端竞争力。' : '光学结构还有提升空间。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('target')} 对焦与防抖</div>对焦 ${Math.round(ev.focus)} · 防抖 ${Math.round(ev.stabilization)} · 目标匹配 ${ev.targetMatch}%</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('info')} 技术限制</div>当前光学技术 Lv.${game.company.tech.optics} · 自动对焦 Lv.${game.company.tech.af}。大光圈、萤石和非球面会受技术等级影响。</div>
        </div>
      </div>`;
  }

  function renderLensStep2(lens, ev) {
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 镜身设计语言</div><div class="studio-section-desc">银色复古、红圈旗舰、白炮长焦或电影工业黑，镜身配色是品牌最直观的光学身份。</div></div></div>
        <div class="lens-style-grid">
          
          
          
          ${D.LENS_STYLES_ARRAY.map(s => `<button class="lens-style-card ${lens.body.style === s.id ? 'is-active' : ''}" data-action="set-choice" data-path="body.style" data-value="${s.id}">
          
          
          
            <span class="lens-style-bar" style="background:linear-gradient(${s.accent}, ${s.ring})"></span>
          
          
          
            <span><span class="lens-style-name">${esc(s.name)}</span><span class="lens-style-sub">${esc(s.en)}</span></span>
          
          
          
          </button>`).join('')}
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 材质与装饰</div></div></div>
        <div class="option-grid cols-3">
          
          
          
          ${Object.values(D.LENS_MATERIALS).map(m => optionCard({ name: esc(m.name), desc: esc(m.desc), active: lens.body.material === m.id, action: 'set-choice', path: 'body.material', value: m.id, meta: `<span>质感 +${Math.round(m.premium * 100)}</span>` })).join('')}
        </div>
        <div class="form-grid cols-3 mt-16">
          
          
          
          <div class="form-field"><label>表面质感</label><div class="segmented">${['matte', 'brushed', 'anodized', 'rubberized'].map(f => `<button class="${lens.body.finish === f ? 'is-active' : ''}" data-action="set-choice" data-path="body.finish" data-value="${f}">${esc(D.FINISHES[f].name)}</button>`).join('')}</div></div>
          
          
          
          <div class="form-field"><label>镜身颜色</label><div class="swatch-line"><span class="swatch-large" style="background:${attr(lens.body.color)}"></span><div class="swatch-meta"><b>${attr(lens.body.color)}</b><span>主色</span></div><input type="color" value="${attr(lens.body.color)}" data-color-path="body.color"></div></div>
          
          
          
          <div class="form-field"><label>装饰环颜色</label><div class="swatch-line"><span class="swatch-large" style="background:${attr(lens.body.ringColor)}"></span><div class="swatch-meta"><b>${attr(lens.body.ringColor)}</b><span>识别环</span></div><input type="color" value="${attr(lens.body.ringColor)}" data-color-path="body.ringColor"></div></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 尺寸与机械结构</div><div class="studio-section-desc">长焦与电影镜头会明显更大更重。重量也直接决定便携与手持体验。</div></div><span class="studio-section-hint">${Math.round(lens.body.length)} × ⌀${Math.round(lens.body.diameter)}mm · ${Math.round(lens.body.weight)}g</span></div>
        <div class="range-cluster">
          
          
          
          ${rangeField('body.length', '镜身长度', Math.round(lens.body.length), 25, 420, 1, 'mm', '越长越像专业镜头，也更难携带')}
          
          
          
          ${rangeField('body.diameter', '镜身直径', Math.round(lens.body.diameter), 28, 220, 1, 'mm', '大直径容纳更大前组镜片')}
          
          
          
          ${rangeField('body.weight', '镜头重量', Math.round(lens.body.weight), 90, 6000, 10, 'g', '材料、镜片与机械结构共同影响重量')}
        </div>
        <div class="grid-3 mt-16">
          
          
          
          ${toggleRow('body.weatherSealed', '全天候防尘防滴', lens.body.weatherSealed, '镜头密封圈与接口防护')}
          
          
          
          ${toggleRow('body.focusRing', '独立对焦环', lens.body.focusRing, '手动对焦与跟焦手感')}
          
          
          
          ${toggleRow('body.apertureRing', '光圈环', lens.body.apertureRing, '电影与复古操控仪式感')}
          
          
          
          ${toggleRow('body.focusGear', '对焦齿轮环', lens.body.focusGear, '跟焦器可驱动')}
          
          
          
          ${toggleRow('body.zoomGear', '变焦齿轮环', lens.body.zoomGear, '专业变焦器兼容')}
        </div>
        ${lens.lensType === 'cinema' && !lens.body.focusGear ? '<div class="callout warn mt-12">这是一支电影镜头，但没有对焦齿轮环。专业跟焦器无法使用，会影响片场适配。</div>' : ''}
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 外观体检</div></div><span class="studio-section-hint">${esc(ev.identity)}</span></div>
        <div class="grid-3">
          
          
          
          <div class="callout"><div class="callout-title">${icon('palette')} 颜值 ${Math.round(ev.looks)}</div>镜身比例、装饰环和材质共同塑造品牌印象。</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('layers')} 做工 ${Math.round(ev.build)}</div>${ev.build >= 70 ? '机械结构与密封性看起来可靠。' : '材料和机械结构仍有廉价风险。'}</div>
          
          
          
          <div class="callout"><div class="callout-title">${icon('briefcase')} 专业感</div>${ev.traits.pro >= 70 ? '有明确的高端专业镜头气质。' : '对于专业用户来说，专业感仍不够强。'}</div>
        </div>
      </div>`;
  }

  function renderLensStep3(lens, ev) {
    const launch = E.previewLensLaunch(game, lens);
    const cashAfter = game.company.cash - launch.totalLaunch;
    const targetCameras = activeProducts().filter(c => c.design && c.design.mount && c.design.mount.type === lens.mount.type);
    const benchmarkLens = activeLenses().filter(l => l.id !== lens.id && l.status === 'active').slice(0, 3);
    return `
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">01</span> 定价与首批库存</div><div class="studio-section-desc">镜头是长尾生意。定价必须同时考虑卡口用户规模、竞品和品牌溢价。</div></div><span class="studio-section-hint">建议零售 ${moneyNumber(ev.suggestedPrice)}</span></div>
        <div class="form-grid cols-3">
          
          
          
          <div class="form-field"><label>零售价</label><div class="input-with-unit"><input class="text-input" type="number" min="99" step="100" value="${Math.round(lens.price)}" data-path="price" data-number="true"><span>CNY</span></div><div class="form-help">公允价约 ${moneyNumber(ev.fairPrice)}；建议零售价已摊销工装与研发。</div></div>
          
          
          
          <div class="form-field"><label>首批备货</label><div class="input-with-unit"><input class="text-input" type="number" min="0" step="100" value="${Math.round(lens.initialStock)}" data-path="initialStock" data-number="true"><span>支</span></div><div class="form-help">建议 ${ev.suggestedStock} 支。自动补货会跟随需求预测。</div></div>
          
          
          
          <div class="form-field"><label>生态状态</label><div class="callout" style="padding:8px 10px"><div class="flex items-center justify-between"><span>${esc(lens.mount.type)} 卡口可用机身</span><b style="font-family:var(--font-mono);color:${targetCameras.length ? 'var(--good)' : 'var(--accent)'}">${targetCameras.length} 款</b></div><div class="form-help">${targetCameras.length ? '你的机身能为镜头带来内置需求与套机销售机会。' : '没有同卡口机身，只能依赖第三方卡口市场与独立口碑。'}</div></div></div>
        </div>
        <div class="financial-mini-grid">
          
          
          
          <div class="financial-mini"><label>单支制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
          
          
          
          <div class="financial-mini"><label>毛利空间</label><b>${pctNum((1 - ev.unitCost / Math.max(1, lens.price)) * 100)}</b></div>
          
          
          
          <div class="financial-mini"><label>光学评分</label><b>${Math.round(ev.optical)} / 100</b></div>
          
          
          
          <div class="financial-mini"><label>市场公允价</label><b>${moneyNumber(ev.fairPrice)}</b></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">02</span> 品控</div></div><span class="studio-section-hint">预计故障率 ${ev.defectRate.toFixed(1)}%</span></div>
        <div class="option-grid cols-3">${Object.values(D.QC_TIERS).map(q => optionCard({ name: esc(q.name), desc: esc(q.desc), active: lens.qc === q.id, action: 'set-choice', path: 'qc', value: q.id, meta: `<span>+${moneyNumber(q.perUnit * 0.65)} / 支</span>` })).join('')}</div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">03</span> 发布会与上市营销</div></div></div>
        <div class="option-grid cols-5">${Object.values(D.CAMPAIGN_TIERS).map(c => optionCard({ name: esc(c.name), desc: esc(c.desc), active: lens.campaign === c.id, action: 'set-choice', path: 'campaign', value: c.id, meta: `<span>${c.cost ? moneyNumber(c.cost) : '免费'}</span><span>声量 +${c.hype}</span>` })).join('')}</div>
        <div class="launch-plan-summary mt-12">
          <div class="launch-plan-summary-main"><span class="eyebrow">LAUNCH EVENT</span><b>${esc(launch.event ? launch.event.label : '静默上市')}</b><span>${launch.event ? `声量 ${Math.round(launch.event.hype)} · 媒体评分 ${Math.round(launch.event.pressScore)} · 预购 ${launch.preorderUnits ? units(launch.preorderUnits) : '—'} · 成本 ${money(launch.event.cost)}` : '尚未配置发布会'}</span></div>
          <button class="btn btn-sm btn-secondary" data-action="open-launch-planner" data-kind="lens">${icon('megaphone')} 策划发布会</button>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">04</span> 上市概览</div></div></div>
        <div class="launch-box">
          
          
          
          <div class="launch-box-title">${icon('receipt')} 镜头上市投资</div>
          
          
          
          <div class="launch-box-grid">
          
          
          
            <div><label>工装与试产</label><b>${moneyNumber(launch.tooling)}</b></div>
          
          
          
            <div><label>首批库存</label><b>${moneyNumber(launch.initialStock * ev.unitCost)}</b></div>
          
          
          
            <div><label>发布会</label><b>${moneyNumber(launch.campaignCost)}</b></div>
          
          
          
            <div><label>现金总投入</label><b style="color:${launch.totalLaunch > game.company.cash ? 'var(--bad)' : 'var(--accent-bright)'}">${moneyNumber(launch.totalLaunch)}</b></div>
          
          
          
            <div><label>上市后现金</label><b class="${cashAfter < 0 ? 'bad' : ''}">${moneyNumber(cashAfter)}</b></div>
          
          
          
            <div><label>预计首月需求</label><b>${units(launch.demand.units)}</b></div>
          
          
          
          </div>
          
          
          
          <div class="launch-note">镜头直接销售会同时受自身卡口生态与第三方用户需求影响。上市后每月结算实际需求与库存。</div>
        </div>
        <div class="cost-breakdown">
          
          
          
          <div class="mini-label mb-8">成本结构 / COST BREAKDOWN</div>
          
          
          
          ${Object.entries(ev.costBreakdown).filter(([k]) => k !== 'total').map(([k, v]) => `<div class="cost-line"><label>${esc(COMPONENT_LABEL(k))}</label><b>${v === 0 ? '—' : moneyNumber(v)}</b></div>`).join('')}
          
          
          
          <div class="cost-line total"><label>单支制造成本</label><b>${moneyNumber(ev.unitCost)}</b></div>
        </div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">05</span> 市场参考</div></div></div>
        ${benchmarkLens.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>现有镜头</th><th>卡口</th><th>评分</th><th>价格</th><th>状态</th></tr></thead><tbody>${benchmarkLens.map(l => `<tr><td class="name-cell">${esc(l.name)}</td><td>${esc(l.mount.type)}</td><td class="num">${l.overall}</td><td class="num">${moneyNumber(l.price)}</td><td>在售</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-inline">还没有其他在售镜头可供比较。你的这支镜头会成为品牌光学产品的起点。</div>'}
        <div class="eyebrow-note">镜头市场不像相机市场那样依靠单次发布会爆发。长期口碑、卡口装机量和专业内容会持续影响销量。</div>
      </div>
      <div class="studio-section">
        <div class="studio-section-head"><div><div class="studio-section-title"><span class="idx">06</span> 上市检查</div></div></div>
        ${ev.blocking.length ? `<div class="callout bad"><div class="callout-title">${icon('alert')} 仍有 ${ev.blocking.length} 项阻塞</div>${ev.blocking.map(w => esc(w.text)).join('<br>')}</div>` : `<div class="callout good"><div class="callout-title">${icon('checkcircle')} 可以上市</div>光学与机械检查通过。把你的镜头加入卡口生态。</div>`}
        <div class="flex justify-between items-center mt-16" style="flex-wrap:wrap;gap:10px">
          
          
          
          <div><div class="mini-label">预计口碑</div><div style="font-family:var(--font-display);font-size:28px;letter-spacing:-.03em">${ev.overall}</div></div>
          
          
          
          <button class="btn btn-primary btn-lg" data-action="open-lens-launch-review" ${ev.blocking.length ? 'disabled' : ''}>${icon('arrowUpRight')} 上市评审</button>
        </div>
      </div>`;
  }

  // ---------- research page ----------
  function techEffect(tech, level) {
    return tech.levels[clamp(level, 1, 5) - 1];
  }
  // ---------- chip lab page ----------
  function renderChipsPage() {
    const c = game.company;
    const level = E.chipLabLevel(c);
    const lab = E.chipLabDef(c);
    const nextLab = D.CHIP_LAB_LEVELS[level + 1] || null;
    const cmos = c.cmosChips || [];
    const af = c.afChips || [];
    const programs = c.chipPrograms || [];
    const activeCmos = programs.filter(p => p.kind === 'cmos');
    const activeAf = programs.filter(p => p.kind === 'af');
    const tab = UI.chipTab || 'cmos';
    const power = Math.round(E.chipPower(c));
    const slots = E.chipSlots(c);
    const strategy = c.chipStrategy || { cmos: 'procure', af: 'procure' };
    const upgradeCost = lab.upgradeCost != null ? lab.upgradeCost : null;
    const canUpgrade = !!(nextLab && upgradeCost != null && c.cash >= upgradeCost);
    const tabDefs = [
      ['cmos', 'CMOS 传感器', cmos.length],
      ['af', '对焦芯片', af.length],
      ['procurement', '采购与对比', 0]
    ];
    const cmosTargets = Object.values(D.CMOS_TARGETS);
    const afArchs = Object.values(D.AF_ARCHITECTURES);
    return `
      ${pageHead({
        eyebrow: 'CHIP LAB / 芯片实验室',
        title: '把传感器和对焦，做成自己的护城河。',
        sub: 'CMOS 可以采购，也可以自研；对焦芯片同样可以自研。采购快、轻资产，自研前期贵、长期单位成本更低，还能在发布会上讲一个别人没有的芯片故事。',
        actions: `<button class="btn btn-secondary" data-action="open-chip-program" data-kind="${tab === 'af' ? 'af' : 'cmos'}">${icon('plus')} 立项自研${tab === 'af' ? ' AF 芯片' : ' CMOS'}</button><button class="btn btn-primary" data-action="upgrade-chip-lab" ${canUpgrade ? '' : 'disabled'}>${icon('arrowUp')} ${nextLab && upgradeCost != null ? '升级实验室 · ' + moneyNumber(upgradeCost) : '已达最高等级'}</button>`
      })}
      <div class="chip-hero">
        <div class="chip-lab-card">
          <div class="chip-lab-top">
            <div>
              <div class="eyebrow">LAB LEVEL ${level} / ${D.CHIP_LAB_LEVELS.length - 1}</div>
              <div class="chip-lab-name">${esc(lab.name)}</div>
              <div class="chip-lab-en">${esc(lab.en)} · ${esc(lab.desc)}</div>
            </div>
            <span class="badge ${programs.length ? 'accent' : 'good'}">${programs.length}/${slots} 项目</span>
          </div>
          <div class="chip-lab-metrics">
            <div><label>月度芯片研发力</label><b>${power} <small>CP</small></b></div>
            <div><label>可并行项目</label><b>${slots} <small>个</small></b></div>
            <div><label>规格加成</label><b>${lab.quality >= 0 ? '+' : ''}${lab.quality}</b></div>
            <div><label>月度维护</label><b>${lab.upkeep ? money(lab.upkeep) : '—'}</b></div>
          </div>
          <div class="chip-lab-progress">
            <div class="flex justify-between"><span class="mini-label">下一代实验室</span><span class="faint" style="font-size:8px">${nextLab ? esc(nextLab.name) + (upgradeCost != null ? ' · ' + moneyNumber(upgradeCost) : '') : '已达最高等级'}</span></div>
            <div class="progress mt-8"><i style="width:${(level / (D.CHIP_LAB_LEVELS.length - 1)) * 100}%"></i></div>
          </div>
        </div>
        <div class="chip-summary-card">
          <div class="chip-summary-top"><div class="eyebrow">IN-HOUSE SILICON</div><div class="chip-summary-title">自有芯片库</div></div>
          <div class="chip-summary-grid">
            <div><label>自研 CMOS</label><b>${cmos.length}</b><span>${strategy.cmos === 'inhouse' ? '新设计默认自研' : '当前默认采购'}</span></div>
            <div><label>自研 AF 芯片</label><b>${af.length}</b><span>${strategy.af === 'inhouse' ? '新设计默认自研' : '当前默认采购'}</span></div>
          </div>
          <div class="chip-summary-foot">
            <span>${icon('wallet')} 可用现金 ${money(c.cash)}</span>
            <span>${icon('cpu')} 采购供应商 ${esc(E.getSensorSupplier(c).name)}</span>
          </div>
        </div>
      </div>
      <div class="art-gallery-tabs">
        ${tabDefs.map(([id, label, count]) => `<button class="tab ${tab === id ? 'is-active' : ''}" data-action="chip-tab" data-tab="${id}">${label}${count ? ` <span class="tab-badge">${count}</span>` : ''}</button>`).join('')}
      </div>
      ${tab === 'cmos' ? `
        <div class="section-toolbar"><div><div class="section-label"><span class="num">01</span> 自研 CMOS / IN-HOUSE SENSOR</div><div class="faint" style="font-size:9px;margin-top:3px">完成项目后，芯片进入自有芯片库；在相机设计里选择「自研」即可使用。</div></div><span class="badge">${cmos.length} 颗可用</span></div>
        ${cmos.length ? `<div class="chip-grid">${cmos.slice().sort((a, b) => b.builtMonth - a.builtMonth).map(chipCard).join('')}</div>` : '<div class="empty-inline">还没有自研 CMOS。选择一个画幅与预算开始第一个芯片项目。</div>'}
        ${activeCmos.length ? `<div class="section-toolbar mt-20"><div><div class="section-label"><span class="num">02</span> 进行中的 CMOS 项目</div></div><span class="badge accent">${activeCmos.length} 个</span></div><div class="chip-program-list">${activeCmos.map(chipProgramCard).join('')}</div>` : ''}
        <div class="section-toolbar mt-20"><div><div class="section-label"><span class="num">03</span> 可立项方向 / TARGETS</div><div class="faint" style="font-size:9px;margin-top:3px">画幅与结构受传感器技术等级约束；预算越高，规格与良率越好。</div></div><span class="badge">传感器技术 Lv.${c.tech.sensor}</span></div>
        <div class="chip-target-grid">${cmosTargets.map(t => chipTargetCard(t)).join('')}</div>
      ` : tab === 'af' ? `
        <div class="section-toolbar"><div><div class="section-label"><span class="num">01</span> 自研对焦芯片 / AF ASIC</div><div class="faint" style="font-size:9px;margin-top:3px">独立 AF 芯片能降低对焦模组成本，并为追焦、暗光与 AI 识别提供额外加成。</div></div><span class="badge">${af.length} 颗可用</span></div>
        ${af.length ? `<div class="chip-grid">${af.slice().sort((a, b) => b.builtMonth - a.builtMonth).map(chipCard).join('')}</div>` : '<div class="empty-inline">还没有自研对焦芯片。先完成一个 AF 芯片项目。</div>'}
        ${activeAf.length ? `<div class="section-toolbar mt-20"><div><div class="section-label"><span class="num">02</span> 进行中的 AF 项目</div></div><span class="badge accent">${activeAf.length} 个</span></div><div class="chip-program-list">${activeAf.map(chipProgramCard).join('')}</div>` : ''}
        <div class="section-toolbar mt-20"><div><div class="section-label"><span class="num">03</span> 可立项方向 / ARCHITECTURES</div><div class="faint" style="font-size:9px;margin-top:3px">架构受对焦技术等级约束；旗舰版可以给速度机用。</div></div><span class="badge">对焦技术 Lv.${c.tech.af}</span></div>
        <div class="chip-target-grid">${afArchs.map(a => chipTargetCard(a, 'af')).join('')}</div>
      ` : `
        <div class="section-toolbar"><div><div class="section-label"><span class="num">01</span> 采购 / PROCUREMENT</div><div class="faint" style="font-size:9px;margin-top:3px">采购芯片单位成本更高，但不需要前期研发投入，适合现金流紧张或快速铺产品线。</div></div><button class="btn btn-sm btn-secondary" data-action="nav" data-page="operations">${icon('factory')} 供应链设置</button></div>
        <div class="chip-compare-grid">
          <div class="chip-compare-card">
            <div class="chip-compare-head"><div><div class="chip-compare-name">外购 CMOS</div><div class="chip-compare-en">${esc(E.getSensorSupplier(c).name)}</div></div><span class="badge">当前</span></div>
            <div class="chip-compare-row"><label>单位成本系数</label><b>×${E.getSensorSupplier(c).cost.toFixed(2)}</b></div>
            <div class="chip-compare-row"><label>质量系数</label><b>×${E.getSensorSupplier(c).quality.toFixed(2)}</b></div>
            <div class="chip-compare-row"><label>供应交期</label><b>${E.getSensorSupplier(c).lead} 周</b></div>
            <p class="muted" style="font-size:10px;line-height:1.7;margin-top:10px">采购可以随时切换供应商，单位成本由对方报价决定；发布会无法讲“自研芯片”的故事。</p>
            <button class="btn btn-sm btn-secondary mt-12" data-action="nav" data-page="operations">${icon('factory')} 更换供应商</button>
          </div>
          <div class="chip-compare-card is-accent">
            <div class="chip-compare-head"><div><div class="chip-compare-name">自研 CMOS</div><div class="chip-compare-en">IN-HOUSE SILICON</div></div><span class="badge ${cmos.length ? 'good' : ''}">${cmos.length ? cmos.length + ' 颗' : '未完成'}</span></div>
            <div class="chip-compare-row"><label>典型单位成本系数</label><b>×${cmos.length ? Math.min(...cmos.map(x => x.costFactor)).toFixed(2) : '—'}</b></div>
            <div class="chip-compare-row"><label>画质/规格加成</label><b>${cmos.length ? '+' + Math.max(...cmos.map(x => x.quality)) : '—'}</b></div>
            <div class="chip-compare-row"><label>前期投入</label><b>${moneyNumber(D.CMOS_TARGETS.ff.baseCost)} 起</b></div>
            <p class="muted" style="font-size:10px;line-height:1.7;margin-top:10px">自研需要流片、验证与良率爬坡；完成后单位成本更低，且能作为发布会的核心技术叙事。</p>
            <button class="btn btn-sm btn-primary mt-12" data-action="open-chip-program" data-kind="cmos">${icon('plus')} 立项自研 CMOS</button>
          </div>
          <div class="chip-compare-card">
            <div class="chip-compare-head"><div><div class="chip-compare-name">外购 AF 模组</div><div class="chip-compare-en">OFF-THE-SHELF AF</div></div><span class="badge">当前</span></div>
            <div class="chip-compare-row"><label>单位成本</label><b>${moneyNumber(D.AF_SYSTEMS.ai.cost)}</b></div>
            <div class="chip-compare-row"><label>对焦加成</label><b>+${D.AF_SYSTEMS.ai.bonus}</b></div>
            <p class="muted" style="font-size:10px;line-height:1.7;margin-top:10px">AF 模组随对焦系统一起采购，性能受供应商方案限制。</p>
          </div>
          <div class="chip-compare-card is-accent">
            <div class="chip-compare-head"><div><div class="chip-compare-name">自研 AF 芯片</div><div class="chip-compare-en">IN-HOUSE AF ASIC</div></div><span class="badge ${af.length ? 'good' : ''}">${af.length ? af.length + ' 颗' : '未完成'}</span></div>
            <div class="chip-compare-row"><label>额外对焦加成</label><b>${af.length ? '+' + Math.max(...af.map(x => x.bonus)) : '—'}</b></div>
            <div class="chip-compare-row"><label>单位成本变化</label><b>${af.length ? Math.min(...af.map(x => x.costDelta)) : '—'}</b></div>
            <p class="muted" style="font-size:10px;line-height:1.7;margin-top:10px">自研 AF 芯片可以把追焦算法与 NPU 做成差异化卖点，并降低长期模组成本。</p>
            <button class="btn btn-sm btn-primary mt-12" data-action="open-chip-program" data-kind="af">${icon('plus')} 立项自研 AF</button>
          </div>
        </div>
      `}
      <div class="callout mt-16"><div class="callout-title">${icon('info')} 芯片如何影响产品</div>在相机设计工作台的「影像核心 → 芯片方案」里选择采购或自研；自研 CMOS 需要传感器规格与芯片一致，自研 AF 芯片会直接提高对焦评分并降低模组成本。发布会如果讲自研芯片，还会获得额外的媒体与声量加成。</div>
    `;
  }

  function chipCard(chip) {
    const isCmos = chip.kind === 'cmos';
    const fmt = isCmos ? (D.SENSOR_FORMATS[chip.format] || { name: chip.format }) : null;
    const type = isCmos ? (D.SENSOR_TYPES[chip.type] || { name: chip.type }) : null;
    return `<article class="chip-card">
      <div class="chip-card-top">
        <div><div class="chip-name">${esc(chip.name)}</div><div class="chip-en">${isCmos ? `${esc(fmt.name)} · ${chip.mp}MP · ${esc(type.name)}` : esc(chip.shortName || 'AF ASIC')}</div></div>
        <span class="badge good">自研</span>
      </div>
      <div class="chip-spec-grid">
        ${isCmos ? `
          <div><label>单位成本</label><b>×${Number(chip.costFactor).toFixed(2)}</b></div>
          <div><label>画质加成</label><b>+${chip.quality}</b></div>
          <div><label>缺陷系数</label><b>×${Number(chip.defect).toFixed(2)}</b></div>
          <div><label>世代</label><b>GEN ${chip.generation}</b></div>
        ` : `
          <div><label>对焦加成</label><b>+${chip.bonus}</b></div>
          <div><label>模组成本</label><b>${chip.costDelta}</b></div>
          <div><label>架构</label><b>${esc((D.AF_ARCHITECTURES[chip.arch] || {}).name || '—')}</b></div>
          <div><label>世代</label><b>GEN ${chip.generation}</b></div>
        `}
      </div>
      <div class="chip-card-foot"><span class="faint">${chip.builtMonth != null ? E.monthLabel(chip.builtMonth) : ''} 完成</span><button class="btn btn-xs btn-secondary" data-action="chip-use" data-kind="${chip.kind}" data-id="${attr(chip.id)}">设为新设计默认</button></div>
    </article>`;
  }

  function chipProgramCard(program) {
    const activeCount = (game.company.chipPrograms || []).length || 1;
    const rate = E.chipPower(game.company) / activeCount;
    const eta = Math.max(1, Math.ceil((program.requiredPoints - program.progress) / Math.max(1, rate)));
    const pct = clamp(program.progress / Math.max(1, program.requiredPoints) * 100, 0, 100);
    return `<div class="chip-program-card">
      <div class="chip-program-top"><div><div class="chip-program-name">${esc(program.name)}</div><div class="chip-program-en">${program.kind === 'cmos' ? 'CMOS PROGRAM' : 'AF ASIC PROGRAM'} · 立项 ${E.monthLabel(program.startedMonth)}</div></div><span class="badge accent">${program.estimate && program.estimate.months ? program.estimate.months + ' 个月' : '进行中'}</span></div>
      <div class="progress mt-10"><i style="width:${pct}%"></i></div>
      <div class="chip-program-meta"><span>${Math.round(program.progress)} / ${program.requiredPoints} CP</span><span>约 ${eta} 个月完成</span><span>预算 ${money(program.cost)}</span></div>
      <div class="chip-program-foot"><span class="faint">完成后进入自有芯片库</span><button class="link-btn" style="font-size:8px" data-action="cancel-chip-program" data-id="${attr(program.id)}">中止项目</button></div>
    </div>`;
  }

  function chipTargetCard(target, kind) {
    const isAf = kind === 'af';
    const tech = isAf ? (game.company.tech.af || 1) : (game.company.tech.sensor || 1);
    const need = isAf ? target.tech : target.tech;
    const locked = tech < need;
    const cost = isAf
      ? Math.round(target.baseCost * D.CMOS_BUDGETS.balanced.costMult * D.AF_TIERS.advanced.costMult / 100000) * 100000
      : Math.round(target.baseCost * (0.78 + (D.SENSOR_TYPES.stacked.cost) * 0.28) / 100000) * 100000;
    return `<div class="chip-target-card ${locked ? 'is-locked' : ''}">
      <div class="chip-target-top"><div><div class="chip-target-name">${esc(target.name)}</div><div class="chip-target-en">${esc(target.en || '')}</div></div>${locked ? `<span class="badge bad">Lv.${need}</span>` : `<span class="badge">${isAf ? 'AF' : 'CMOS'}</span>`}</div>
      <p class="chip-target-desc">${esc(target.desc)}</p>
      <div class="chip-target-meta"><span>${isAf ? '约 ' + target.months + ' 个月' : target.months + ' 个月'}</span><span>${moneyNumber(cost)} 起</span></div>
      <button class="btn btn-sm btn-secondary mt-10" data-action="open-chip-program" data-kind="${isAf ? 'af' : 'cmos'}" data-target="${attr(target.id)}" ${locked ? 'disabled' : ''}>${locked ? '技术等级不足' : '按此方向立项'}</button>
    </div>`;
  }

  // ---------- launch events page ----------
  function renderEventsPage() {
    const c = game.company;
    const drafts = [];
    if (game.drafts.camera) drafts.push({ kind: 'camera', draft: game.drafts.camera });
    if (game.drafts.lens) drafts.push({ kind: 'lens', draft: game.drafts.lens });
    const history = (game.launchEvents || []).slice().sort((a, b) => (b.monthIndex || 0) - (a.monthIndex || 0));
    const totalReach = history.reduce((s, e) => s + (e.reach || 0), 0);
    const totalPreorders = history.reduce((s, e) => s + (e.preorders || 0), 0);
    const totalSpend = history.reduce((s, e) => s + (e.cost || 0), 0);
    const avgPress = history.length ? history.reduce((s, e) => s + (e.pressScore || 0), 0) / history.length : 0;
    return `
      ${pageHead({
        eyebrow: 'LAUNCH EVENTS / 发布会',
        title: '让一台相机，成为一场事件。',
        sub: '发布会不是一次性广告：规模、形式、城市、媒体、创作者与演示重点共同决定声量、媒体评分、预购和首月需求。芯片与设计故事也会改变媒体叙事。',
        actions: `<button class="btn btn-secondary" data-action="new-camera">${icon('plus')} 新相机</button><button class="btn btn-primary" data-action="open-launch-planner" data-kind="camera" ${game.drafts.camera ? '' : 'disabled'}>${icon('megaphone')} 策划发布会</button>`
      })}
      <div class="event-stats">
        <div class="event-stat"><label>累计发布会</label><b>${history.length}</b><span>场</span></div>
        <div class="event-stat"><label>累计触达</label><b>${totalReach ? (totalReach / 10000).toFixed(1) + '万' : '—'}</b><span>媒体与用户</span></div>
        <div class="event-stat"><label>累计预购</label><b>${totalPreorders ? units(totalPreorders) : '—'}</b><span>台 / 支</span></div>
        <div class="event-stat"><label>平均媒体评分</label><b>${avgPress ? avgPress.toFixed(0) : '—'}</b><span>/ 100</span></div>
        <div class="event-stat"><label>发布会投入</label><b>${totalSpend ? money(totalSpend) : '—'}</b><span>累计</span></div>
      </div>
      <div class="section-toolbar"><div><div class="section-label"><span class="num">01</span> 待发布 / READY TO LAUNCH</div><div class="faint" style="font-size:9px;margin-top:3px">先策划发布会，再进入上市评审；方案会带进上市成本与首月需求。</div></div><span class="badge ${drafts.length ? 'accent' : ''}">${drafts.length} 个草稿</span></div>
      ${drafts.length ? `<div class="event-draft-grid">${drafts.map(x => eventDraftCard(x.kind, x.draft)).join('')}</div>` : `<div class="empty-inline">还没有可发布的草稿。先在设计工作室完成一台相机或一支镜头。</div>`}
      <div class="section-toolbar mt-20"><div><div class="section-label"><span class="num">02</span> 发布会历史 / EVENT HISTORY</div><div class="faint" style="font-size:9px;margin-top:3px">每一场发布会的媒体评分、触达与预购都会被记录。</div></div><span class="badge">${history.length} 场</span></div>
      ${history.length ? `<div class="event-history-list">${history.slice(0, 12).map(e => launchHistoryCard(e)).join('')}</div>` : `<div class="empty-inline">还没有发布会记录。发布第一台产品后，这里会出现媒体报告。</div>`}
      <div class="callout mt-16"><div class="callout-title">${icon('info')} 发布会怎么算</div>规模决定基础声量，形式决定媒体体验，城市决定区域触达，媒体与创作者决定破圈，演示重点必须和产品强项一致。预购会锁定一部分首月需求，但不等于现金收入。发布会费用在选择方案时一次性计入上市支出。</div>
    `;
  }

  function eventDraftCard(kind, draft) {
    const isCamera = kind === 'camera';
    let ev, preview, photo;
    try {
      if (isCamera) {
        ev = E.evaluateCamera(draft, game.company);
        preview = E.previewCameraLaunch(game, draft);
        photo = photoImg(photoForDesign(draft), 'is-detail', draft.name);
      } else {
        ev = E.evaluateLens(draft, game.company);
        preview = E.previewLensLaunch(game, draft);
        photo = shotImg(registerLensShot('event-lens-' + draft.id, draft, { size: 'card', width: 640, height: 420 }), '', draft.name);
      }
    } catch (e) { return ''; }
    const event = preview.event || {};
    return `<article class="event-draft-card">
      <div class="event-draft-visual">${photo}<span class="real-photo-badge">${isCamera ? '相机' : '镜头'}</span></div>
      <div class="event-draft-body">
        <div class="event-draft-top"><div><div class="event-draft-name">${esc(draft.name || '未命名')}</div><div class="event-draft-cat">${esc(isCamera ? categoryData(draft.category).name : (D.LENS_TYPES[draft.lensType]?.name || '镜头'))} · ${ev.overall || '—'} / 100</div></div><span class="badge">${esc(event.scale ? event.scale.name : '未定')}</span></div>
        <div class="event-draft-plan">${icon('megaphone')} <b>${esc(event.label || '静默上市')}</b></div>
        <div class="event-draft-metrics">
          <div><label>预计声量</label><b>${Math.round(event.hype || 0)}</b></div>
          <div><label>媒体评分</label><b>${Math.round(event.pressScore || 0)}</b></div>
          <div><label>预购</label><b>${preview.preorderUnits ? units(preview.preorderUnits) : '—'}</b></div>
          <div><label>发布会成本</label><b>${event.cost ? money(event.cost) : '—'}</b></div>
        </div>
        <div class="event-draft-actions">
          <button class="btn btn-sm btn-primary" data-action="open-launch-planner" data-kind="${kind}">${icon('megaphone')} 策划发布会</button>
          <button class="btn btn-sm btn-secondary" data-action="launch-review" data-kind="${kind}">${icon('arrowUpRight')} 上市评审</button>
          <button class="btn btn-sm btn-ghost" data-action="${isCamera ? 'resume-camera-draft' : 'resume-lens-draft'}">继续设计</button>
        </div>
      </div>
    </article>`;
  }

  function launchHistoryCard(e) {
    const p = [...(game.products || []), ...(game.lenses || [])].find(x => x.id === e.productId);
    const photo = p
      ? (p.kind === 'camera' ? photoImg(photoForProduct(p), '', p.name) : shotImg(registerLensShot('history-lens-' + p.id, p.design, { size: 'card', width: 480, height: 320 }), '', p.name))
      : '';
    return `<article class="event-history-card">
      <div class="event-history-thumb">${photo}</div>
      <div class="event-history-body">
        <div class="event-history-top"><div><div class="event-history-name">${esc(e.productName)}</div><div class="event-history-sub">${esc(e.monthLabel || '')} · ${esc(e.label || '')}</div></div><span class="badge ${e.pressScore >= 85 ? 'good' : e.pressScore >= 70 ? 'accent' : ''}">${Math.round(e.pressScore || 0)}</span></div>
        <div class="event-history-metrics"><span>${icon('globe')} 触达 ${e.reach ? (e.reach / 10000).toFixed(1) + '万' : '—'}</span><span>${icon('users')} 预购 ${e.preorders ? units(e.preorders) : '—'}</span><span>${icon('wallet')} 投入 ${e.cost ? money(e.cost) : '—'}</span></div>
        <div class="event-history-actions"><span class="faint">${esc(e.scaleName || '')} · 声量 ${Math.round(e.hype || 0)}</span><button class="link-btn" data-action="open-launch-report" data-id="${attr(e.id)}">查看报告 →</button></div>
      </div>
    </article>`;
  }


  function renderResearchPage() {
    const c = game.company;
    const power = E.researchPower(c);
    const projects = c.projects || [];
    const techLevels = D.TECH_ORDER.reduce((s, k) => s + (c.tech[k] || 1), 0);
    const masterCount = D.TECH_ORDER.filter(k => c.tech[k] >= 5).length;
    const activeCount = projects.length;
    const maxed = D.TECH_ORDER.filter(k => (c.tech[k] || 1) >= 5).length;
    return `
      ${pageHead({
        eyebrow: 'R&D CENTER / 技术研发',
        title: '把耐心变成别人追不上的参数。',
        sub: '技术等级决定产品参数上限、制造成本、良品率与品牌口碑。研发项目会占用实验室进度，但完成后会永久提升你的产品能力。',
        actions: `<button class="btn btn-ghost" data-action="nav" data-page="chips">${icon('cpu')} 芯片实验室</button><button class="btn btn-secondary" data-action="nav" data-page="products">产品矩阵 ${icon('arrowRight')}</button><button class="btn btn-primary" data-action="new-camera">${icon('plus')} 设计新相机</button>`
      })}
      <div class="research-hero">
        <div class="lab-card">
          
          
          
          <div class="lab-card-top">
          
          
          
            <div><div class="eyebrow">IMAGING LAB / ${E.monthShort(game.monthIndex)}</div><div class="lab-title">${esc(c.name)} · 影像技术实验室</div><div class="lab-sub">研发力由工程师团队和系统技术共同决定。多个项目同时进行时，研发力会被平均分配。</div></div>
          
          
          
            <span class="badge ${activeCount ? 'accent' : 'good'}">${activeCount ? activeCount + ' 个项目进行中' : '实验室空闲'}</span>
          
          
          
          </div>
          
          
          
          <div class="lab-metrics">
          
          
          
            <div class="lab-metric"><label>月度研发力</label><b>${Math.round(power)} <small>RP</small></b></div>
          
          
          
            <div class="lab-metric"><label>工程师</label><b>${c.staff.engineers} <small>人</small></b></div>
          
          
          
            <div class="lab-metric"><label>技术总等级</label><b>${techLevels} <small>/ 65</small></b></div>
          
          
          
            <div class="lab-metric"><label>满级技术</label><b>${masterCount} <small>/ 13</small></b></div>
          
          
          
          </div>
          
          
          
          <div class="progress mt-16" style="height:6px"><i style="width:${clamp((techLevels / 65) * 100, 0, 100)}%"></i></div>
          
          
          
          <div class="flex justify-between mt-8"><span class="mini-label">技术图谱完成度</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--muted)">${Math.round(techLevels / 65 * 100)}%</span></div>
        </div>
        <div class="lab-card">
          
          
          
          <div class="flex items-center justify-between"><div class="lab-title" style="font-size:14px">进行中的项目</div><span class="badge">${activeCount}/3 实验室槽位</span></div>
          
          
          
          <div class="project-list mt-12">
          
          
          
            ${projects.length ? projects.map(p => {
          
          
          
              const percent = clamp(p.progress / p.requiredPoints * 100, 0, 100);
          
          
          
              const eta = Math.max(1, Math.ceil((p.requiredPoints - p.progress) / Math.max(1, power / projects.length)));
          
          
          
              return `<div class="project-card">
          
          
          
                <div class="project-top"><div class="project-name"><span class="dot"></span>${esc(p.techName)}</div><div class="project-level">LV.${p.targetLevel}</div></div>
          
          
          
                <div class="progress mt-8"><i style="width:${percent}%"></i></div>
          
          
          
                <div class="project-progress-line"><span>${Math.round(p.progress)} / ${p.requiredPoints} RP</span><span>约 ${eta} 个月</span></div>
          
          
          
                <div class="flex justify-between mt-8"><span class="faint" style="font-size:7.5px">投入 ${money(p.cost)} · 已进行 ${Math.max(0, game.monthIndex - p.startedMonth)} 个月</span><button class="link-btn" style="font-size:8px" data-action="cancel-research" data-id="${attr(p.id)}">中止项目</button></div>
          
          
          
              </div>`;
          
          
          
            }).join('') : `<div class="empty-inline">实验室当前空闲。选择一个技术方向开始研发。</div>`}
          
          
          
          </div>
          
          
          
          <div class="callout accent mt-12"><div class="callout-title">${icon('info')} 研发策略</div>当一个项目正在进行时再启动新项目，会使双方进度减半。优先突破能解锁下一代产品的关键技术，而不是把等级平均铺开。</div>
        </div>
      </div>
      <div class="section-toolbar"><div><div class="section-label"><span class="num">02</span> 技术树 / TECHNOLOGY TREE</div><div class="faint" style="font-size:9px;margin-top:3px">每个项目在立项时一次性支付研发预算，进度按月自动推进。</div></div><div class="flex gap-8"><span class="badge">当前现金流 ${money(c.cash)}</span><span class="badge ${activeCount >= 3 ? 'bad' : 'accent'}">${activeCount}/3 项目</span></div></div>
      <div class="tech-grid">
        ${D.TECH_ORDER.map(key => {
          
          
          
          const tech = D.TECHS[key];
          
          
          
          const level = c.tech[key] || 1;
          
          
          
          const active = projects.find(p => p.tech === key);
          
          
          
          const max = level >= 5;
          
          
          
          const target = level + 1;
          
          
          
          const nextCost = max ? 0 : tech.costs[target];
          
          
          
          const eta = max ? null : E.projectEta(game, key);
          
          
          
          const canStart = !max && !active && activeCount < 3 && c.cash >= nextCost;
          
          
          
          return `<div class="tech-card ${active ? 'is-researching' : ''} ${max ? 'is-max' : ''}">
          
          
          
            <div class="tech-top">
          
          
          
              <div class="tech-icon">${icon(key === 'sensor' ? 'cpu' : key === 'video' ? 'video' : key === 'af' ? 'target' : key === 'ibis' ? 'zap' : key === 'color' ? 'palette' : key === 'codec' ? 'film' : key === 'cooling' ? 'refresh' : key === 'battery' ? 'power' : key === 'screen' ? 'eye' : key === 'optics' ? 'lens' : key === 'material' ? 'layers' : key === 'modular' ? 'box' : 'sliders')}</div>
          
          
          
              <div><div class="tech-name">${esc(tech.name)} ${level >= 5 ? '<span class="badge good">MAX</span>' : ''}</div><div class="tech-en">${esc(tech.en)} / Lv.${level} → ${max ? 'MAX' : 'Lv.' + target}</div></div>
          
          
          
              <div class="tech-level">${[1, 2, 3, 4, 5].map(n => `<span class="level-pip ${level >= n ? 'is-on' : ''}"></span>`).join('')}</div>
          
          
          
            </div>
          
          
          
            <div class="tech-desc">${esc(tech.desc)}</div>
          
          
          
            <div class="tech-current"><b style="color:var(--text-soft);font-weight:500">当前：</b>${esc(techEffect(tech, level))}</div>
          
          
          
            ${max ? `<div class="tech-level-actions"><span class="badge good">${icon('check')} 已达上限</span><span class="tech-cost">无需继续投入</span></div>` : active ? `<div class="project-progress-line mt-12"><span>研发中 ${Math.round(active.progress / active.requiredPoints * 100)}%</span><span>${Math.round(active.progress)} / ${active.requiredPoints} RP</span></div><div class="progress mt-8"><i style="width:${active.progress / active.requiredPoints * 100}%"></i></div>` : `<div class="tech-next"><div class="tech-cost">预算 <b>${money(nextCost)}</b>${eta ? `${eta.points} RP · 预计 ${eta.months} 个月` : ''}</div><button class="btn btn-sm ${canStart ? 'btn-primary' : 'btn-secondary'}" data-action="start-research" data-tech="${key}" ${canStart ? '' : 'disabled'}>${canStart ? '立项研发' : activeCount >= 3 ? '实验室已满' : '现金不足'}</button></div><div class="tech-locked-note">${nextCost > c.cash ? '需要更多现金或减少其他投入。' : ''}</div>`}
          
          
          
            <div class="tech-level-actions"><span class="tech-cost">下一个等级：<span style="color:var(--faint)">${esc(tech.levels[Math.min(4, level)])}</span></span></div>
          
          
          
          </div>`;
        }).join('')}
      </div>
      <div class="panel mt-16"><div class="panel-header"><div><div class="panel-title">${icon('info')} 研发如何影响产品</div><div class="panel-sub">技术不是抽象的资源，它直接影响设计工作台里能选到的全部选项。</div></div></div><div class="panel-body"><div class="grid-4"><div class="callout"><div class="callout-title">传感器</div>背照式、堆栈式、全局快门、最大像素与中画幅解锁。</div><div class="callout"><div class="callout-title">视频与编码</div>8K/12K、高帧率、ProRes、BRAW、RAW 输出与时间码。</div><div class="callout"><div class="callout-title">光学</div>F1.0 大光圈、萤石、非球面、电影镀膜与镜头评分。</div><div class="callout"><div class="callout-title">结构与材料</div>金属机身、主动散热、模块化笼架、专业配件生态。</div></div></div></div>
    `;
  }

  // ---------- market page ----------
  function renderMarketPage() {
    const snap = marketSnapshotSafe();
    const categories = E.getMarketPressureRows(game);
    const aiProducts = (game.market.aiProducts || []).filter(p => p.age <= 72).sort((a, b) => b.age - a.age);
    const playerCount = (game.products || []).filter(p => p.status === 'active').length;
    const tab = UI.marketTab;
    const aiFiltered = UI.marketCategory === 'all' ? aiProducts : aiProducts.filter(p => p.category === UI.marketCategory);
    const aiSorted = [...aiFiltered].sort((a, b) => {
      if (UI.marketSort === 'score') return b.score - a.score;
      if (UI.marketSort === 'price') return a.price - b.price;
      return a.age - b.age;
    });
    const competitorBrands = game.market.aiBrands || [];
    const marketTotal = categories.reduce((s, c) => s + c.demand, 0);
    const avgPressure = categories.reduce((s, c) => s + c.pressure, 0) / Math.max(1, categories.length);
    let tabContent = '';
    if (tab === 'competitors') {
      tabContent = `<div class="panel">
        <div class="panel-header"><div><div class="panel-title">${icon('search')} 竞品机型数据库</div><div class="panel-sub">追踪所有仍活跃在市场上的 AI 竞品机型。价格变化和产品老化会影响市场竞争强度。</div></div><div class="panel-actions"><span class="badge">${aiFiltered.length} 款在售</span></div></div>
        <div class="panel-body">
          
          
          
          <div class="market-toolbar">
          
          
          
            <div class="market-toolbar-left">
          
          
          
              <div class="filter-chips">
          
          
          
                <button class="filter-chip ${UI.marketCategory === 'all' ? 'is-active' : ''}" data-action="market-filter" data-filter="all">全部</button>
          
          
          
                ${D.CATEGORY_ORDER.map(id => `<button class="filter-chip ${UI.marketCategory === id ? 'is-active' : ''}" data-action="market-filter" data-filter="${id}">${esc(D.CATEGORIES[id].short)}</button>`).join('')}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
            <div class="segmented">
          
          
          
              <button class="${UI.marketSort === 'new' ? 'is-active' : ''}" data-action="market-sort" data-sort="new">最新</button>
          
          
          
              <button class="${UI.marketSort === 'score' ? 'is-active' : ''}" data-action="market-sort" data-sort="score">评分</button>
          
          
          
              <button class="${UI.marketSort === 'price' ? 'is-active' : ''}" data-action="market-sort" data-sort="price">价格</button>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          ${aiSorted.length ? `<div class="data-table-wrap"><table class="data-table">
          
          
          
            <thead><tr><th>机型</th><th>品牌</th><th>品类</th><th>定价</th><th>媒体评分</th><th>上市时间</th><th>规格印象</th></tr></thead>
          
          
          
            <tbody>${aiSorted.slice(0, 40).map(p => `<tr>
          
          
          
              <td class="name-cell">${esc(p.name)}${p.age <= 3 ? ' <span class="badge accent">NEW</span>' : ''}</td>
          
          
          
              <td><span class="brand-dot" style="background:${attr(p.brandColor)}"></span>${esc(p.brandName)}</td>
          
          
          
              <td>${esc(categoryData(p.category).short)}</td>
          
          
          
              <td class="num">${moneyNumber(p.price)}</td>
          
          
          
              <td class="num">${p.score}</td>
          
          
          
              <td class="num">${p.age === 0 ? '本月' : p.age + ' 个月前'}</td>
          
          
          
              <td><span class="faint" style="font-size:8px">${esc(p.res || '')}${p.fps ? ' ' + p.fps + 'p' : ''} · ${p.mp}MP</span></td>
          
          
          
            </tr>`).join('')}</tbody></table></div>` : '<div class="empty-inline">没有匹配的竞品机型。</div>'}
        </div>
      </div>`;
    } else if (tab === 'news') {
      tabContent = `<div class="news-grid">${(game.news || []).slice(0, 24).map(n => `<article class="news-card tone-${attr(n.tone || 'neutral')}"><div class="news-card-top"><span class="news-card-tag">${esc(n.tag)}</span><span class="news-card-date">${esc(n.date)}</span></div><h4>${esc(n.title)}</h4><p>${esc(n.text)}</p></article>`).join('') || '<div class="empty-inline">暂无行业动态。</div>'}</div>`;
    } else {
      tabContent = `<div class="market-grid">
        <div class="stack-12">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('chart')} 全球市场份额</div><div class="panel-sub">按 ${snap ? snap.label : '最新'} 销量估算 · 共 ${snap ? snap.brands.length : 0} 个品牌 · 你排第 ${snap ? snap.playerRank : '—'} 名</div></div><div class="panel-actions"><button class="btn btn-sm btn-secondary" data-action="market-tab" data-tab="competitors">查看竞品 ${icon('arrowRight')}</button></div></div>
          
          
          
            <div class="panel-body">${renderShareBars(snap, 8)}</div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('globe')} 分品类市场结构</div><div class="panel-sub">需求规模、竞争压力和你的上期表现。按下月季节性调整前的基准值展示。</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="category-market-list">
          
          
          
                <div class="category-market-row" style="border-bottom:1px solid var(--line);padding-bottom:6px"><span class="mini-label">品类</span><span class="mini-label">月需求</span><span class="mini-label">竞争压力 / 你的销量</span></div>
          
          
          
                ${categories.map(c => `<div class="category-market-row">
          
          
          
                  <div class="category-market-name"><span>${esc(D.CATEGORIES[c.id].code)}</span><span style="color:var(--text-soft);font-family:var(--font-ui);font-size:9px">${esc(c.name)}</span><span>${c.playerUnits ? c.playerUnits.toLocaleString('zh-CN') + ' 台' : '—'}</span></div>
          
          
          
                  <div class="category-market-demand">${units(c.demand)}</div>
          
          
          
                  <div class="category-market-pressure"><span class="pressure-dot" style="background:${c.pressure > 90 ? 'var(--bad)' : c.pressure > 75 ? 'var(--accent)' : 'var(--good)'}"></span>${Math.min(100, Math.round(c.pressure))} / 100 <span style="color:var(--faint)">· ${c.playerUnits.toLocaleString('zh-CN')} 台</span></div>
          
          
          
                </div>`).join('')}
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="stack-12">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('trend')} 市场脉搏</div></div><span class="badge ${avgPressure > 85 ? 'bad' : 'accent'}">${avgPressure > 85 ? '高压竞争' : '竞争可控'}</span></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="metric-row"><label>全球月度需求</label><b>${units(marketTotal)}</b></div>
          
          
          
              <div class="metric-row"><label>活跃 AI 机型</label><b>${aiProducts.length} 款</b></div>
          
          
          
              <div class="metric-row"><label>在售对手品牌</label><b>${competitorBrands.length} 家</b></div>
          
          
          
              <div class="metric-row"><label>你的市场份额</label><b>${(game.company.share || 0).toFixed(1)}%</b></div>
          
          
          
              <div class="metric-row"><label>玩家在售机型</label><b>${playerCount} 款</b></div>
          
          
          
              <div class="metric-row"><label>市场平均竞争压力</label><b>${Math.round(avgPressure)} / 100</b></div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('zap')} 当前市场趋势</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              ${(game.market.activeModifiers || []).length ? (game.market.activeModifiers || []).map(m => `<div class="callout ${m.tone === 'bad' ? 'bad' : m.tone === 'good' ? 'good' : 'accent'} mb-8"><div class="callout-title">${esc(m.title)} <span class="badge">剩余 ${m.expiresIn} 月</span></div>${esc(m.text)}</div>`).join('') : '<div class="empty-inline">市场暂时没有特殊趋势事件。下一次推进后可能触发新的行业事件。</div>'}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('bell')} 最新竞品动态</div><div class="panel-sub">价格变化、发布与行业信号。</div></div><button class="link-btn" data-action="market-tab" data-tab="news">全部 →</button></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="news-list">${(game.news || []).filter(n => /竞品|市场|技术|设计|行业/.test(n.tag)).slice(0, 4).map(n => `<div class="news-item"><div class="news-date">${esc(String(n.date || '').split('.')[1] || '')}</div><div class="news-body"><div class="news-title">${esc(n.title)}</div><div class="news-text">${esc(n.text)}</div><span class="news-tag">${esc(n.tag)}</span></div></div>`).join('') || '<div class="empty-inline">暂无动态。</div>'}</div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
      </div>`;
    }
    return `
      ${pageHead({
        eyebrow: 'MARKET INTELLIGENCE / 市场情报',
        title: '市场不会等你准备好。',
        sub: '追踪分品类需求、竞品机型、价格变化和市场趋势。真正的产品定位，是在别人的产品已经存在的前提下做出的选择。',
        actions: `<button class="btn btn-secondary" data-action="nav" data-page="marketing">${icon('megaphone')} 营销中心</button><button class="btn btn-primary" data-action="new-camera">${icon('plus')} 设计新相机</button>`
      })}
      ${eventBanner()}
      <div class="market-summary">
        <div class="market-summary-card"><label>全球月需求</label><b>${units(marketTotal)}</b><span>全品类基准</span></div>
        <div class="market-summary-card"><label>你的销量份额</label><b>${(game.company.share || 0).toFixed(1)}%</b><span>全球第 ${snap ? snap.playerRank : '—'} 名</span></div>
        <div class="market-summary-card"><label>竞争压力</label><b>${Math.min(100, Math.round(avgPressure))}<small style="font-size:9px;color:var(--faint)"> / 100</small></b><span>${avgPressure > 85 ? '非常激烈' : avgPressure > 70 ? '竞争正常' : '相对宽松'}</span></div>
        <div class="market-summary-card"><label>活跃对手机型</label><b>${aiProducts.length}<small style="font-size:9px;color:var(--faint)"> 款</small></b><span>${competitorBrands.length} 个品牌</span></div>
      </div>
      <div class="market-header">
        <div class="tabs">
          
          
          
          <button class="tab ${tab === 'overview' ? 'is-active' : ''}" data-action="market-tab" data-tab="overview">市场格局</button>
          
          
          
          <button class="tab ${tab === 'competitors' ? 'is-active' : ''}" data-action="market-tab" data-tab="competitors">竞品机型 <span class="tab-badge">${aiProducts.length}</span></button>
          
          
          
          <button class="tab ${tab === 'news' ? 'is-active' : ''}" data-action="market-tab" data-tab="news">行业动态 <span class="tab-badge">${(game.news || []).length}</span></button>
        </div>
        <span class="badge">数据截至 ${snap ? snap.label : '—'}</span>
      </div>
      ${tabContent}
    `;
  }

  // ---------- marketing page ----------
  function marketingCampaignCard(c) {
    const cooldown = (game.company.campaignCooldowns || {})[c.id] || 0;
    const remaining = Math.max(0, cooldown - game.monthIndex);
    const canRun = remaining <= 0 && game.company.cash >= c.cost;
    return `<div class="campaign-card">
      <div>
        <div class="campaign-card-top"><div><div class="campaign-name">${esc(c.name)}</div><div class="campaign-en">${esc(c.en)}</div></div><span class="badge ${remaining ? '' : 'accent'}">${remaining ? '冷却 ' + remaining + ' 月' : '可投放'}</span></div>
        <div class="campaign-desc">${esc(c.desc)}</div>
        <div class="campaign-effects"><span class="tag">曝光 +${c.awareness.toFixed(1)}</span><span class="tag">口碑 +${c.reputation.toFixed(1)}</span><span class="tag">${esc(c.tag)}</span></div>
      </div>
      <div class="campaign-footer"><span class="campaign-cost">${money(c.cost)}</span><button class="btn btn-sm ${canRun ? 'btn-secondary' : 'btn-ghost'}" data-action="run-campaign" data-campaign="${c.id}" ${canRun ? '' : 'disabled'}>${remaining ? '冷却中' : game.company.cash < c.cost ? '现金不足' : '执行投放'}</button></div>
    </div>`;
  }

  function renderMarketingPage() {
    const c = game.company;
    const active = activeProducts();
    const marketingStaff = c.staff.marketing || 0;
    const efficiency = 1 + Math.sqrt(marketingStaff) / 20;
    const budget = c.marketingBudget || 0;
    const recommended = Math.max(500000, Math.round(Math.min(30000000, c.cash * 0.025) / 100000) * 100000);
    const segmentScores = D.SEGMENTS_ARRAY.map(seg => {
      const products = active.filter(p => p.segmentMatches && p.segmentMatches[seg.id] != null);
      const score = products.length ? products.reduce((s, p) => s + (p.segmentMatches[seg.id] || 0) * Math.max(1, p.lastUnits || 1), 0) / products.reduce((s, p) => s + Math.max(1, p.lastUnits || 1), 0) : 0;
      return { seg, score };
    });
    const topProducts = [...active].sort((a, b) => (b.lastUnits || 0) - (a.lastUnits || 0)).slice(0, 4);
    return `
      ${pageHead({
        eyebrow: 'MARKETING / 品牌营销',
        title: '让用户先认识你，再喜欢你。',
        sub: '品牌认知决定有多少人看见产品，品牌口碑决定看见的人会不会认真考虑。营销不是万能的，但没有关注的产品不会被市场发现。',
        actions: `<button class="btn btn-secondary" data-action="nav" data-page="operations">${icon('users')} 市场团队</button><button class="btn btn-primary" data-action="advance-month">${icon('play')} 推进一月</button>`
      })}
      ${eventBanner()}
      <div class="marketing-hero">
        <div class="brand-pulse">
          
          
          
          <div class="eyebrow">BRAND PULSE / ${E.monthShort(game.monthIndex)}</div>
          
          
          
          <h2>${esc(c.name)} 正在被 <span style="color:var(--accent-bright);font-family:var(--font-serif);font-style:italic">${Math.round(c.awareness)}%</span> 的目标用户认知。</h2>
          
          
          
          <p>${c.awareness < 30 ? '品牌仍是行业里的陌生人。每一次发布与投放都在扩大你的可见度。' : c.awareness < 65 ? '你已经拥有可被记住的名字。现在要把它转化为稳定的信任和购买理由。' : '你已经是行业里无法忽视的品牌。下一步是保持热度，并让品牌溢价被产品力支撑。'}</p>
          
          
          
          <div class="pulse-metrics">
          
          
          
            <div class="pulse-metric"><label>品牌认知</label><b>${c.awareness.toFixed(1)}</b><span>/ 100</span></div>
          
          
          
            <div class="pulse-metric"><label>用户口碑</label><b>${c.reputation.toFixed(1)}</b><span>/ 100</span></div>
          
          
          
            <div class="pulse-metric"><label>品牌关注者</label><b>${(c.fans || 0).toLocaleString('zh-CN')}</b><span>人</span></div>
          
          
          
            <div class="pulse-metric"><label>行业排名</label><b>#${game.market.snapshot ? game.market.snapshot.playerRank : '—'}</b><span>按销量</span></div>
          
          
          
          </div>
          
          
          
          <div class="progress mt-16"><i style="width:${clamp(c.awareness, 0, 100)}%"></i></div>
          
          
          
          <div class="flex justify-between mt-8"><span class="mini-label">Awareness</span><span class="mini-label">${Math.round(c.awareness)}% → ${Math.min(100, Math.round(c.awareness + Math.pow(Math.max(0, budget / 1000000), .45) * .155 * efficiency * (1 - c.awareness / 126)))}% / 下月预估</span></div>
        </div>
        <div class="budget-panel">
          
          
          
          <div class="flex items-center justify-between"><div><div class="eyebrow">ALWAYS-ON BUDGET</div><div style="font-size:14px;font-weight:600;margin-top:4px">月度品牌广告预算</div></div><span class="badge accent">${money(budget)} / 月</span></div>
          
          
          
          <div class="budget-display mt-16"><b>${money(budget)}</b><span>当前月度预算 · 每月结算扣除</span></div>
          
          
          
          <div class="budget-slider-row">
          
          
          
            <div class="slider-top"><span>预算规模</span><b>${money(budget)}</b></div>
          
          
          
            <input type="range" min="0" max="50000000" step="500000" value="${budget}" data-marketing-budget style="--pct:${clamp(budget / 50000000 * 100, 0, 100)}%">
          
          
          
            <div class="range-readouts"><span>0</span><span>¥5,000万</span></div>
          
          
          
            <div class="budget-presets">
          
          
          
              ${[0, 500000, 2000000, 5000000, 15000000, 30000000].map(v => `<button class="filter-chip ${budget === v ? 'is-active' : ''}" data-action="set-marketing-budget" data-value="${v}">${v ? money(v) : '暂停'}</button>`).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="callout mt-12"><div class="callout-title">${icon('sparkles')} 推荐预算 ${money(recommended)}</div>当前现金流与品牌阶段下，建议将月度广告预算控制在可支撑范围内。营销团队 ${marketingStaff} 人，效率系数 ×${efficiency.toFixed(2)}。</div>
        </div>
      </div>
      <div class="section-toolbar"><div><div class="section-label"><span class="num">02</span> 品牌战役 / BRAND CAMPAIGN</div><div class="faint" style="font-size:9px;margin-top:3px">一次性品牌动作，效果立即生效，具有冷却时间。</div></div><span class="badge">现金 ${money(c.cash)}</span></div>
      <div class="campaign-grid">${Object.values(D.BRAND_CAMPAIGNS).map(marketingCampaignCard).join('')}</div>
      <div class="grid-2 mt-16">
        <div class="panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('users')} 受众审美匹配</div><div class="panel-sub">在售产品与各用户群体的外形/功能匹配度，按销量加权。</div></div></div>
          
          
          
          <div class="panel-body">
          
          
          
            <div class="audience-panel">
          
          
          
              ${segmentScores.map(({ seg, score }) => `<div class="audience-row"><span class="audience-name">${esc(seg.name)}</span><div class="audience-bar"><i style="width:${clamp(score, 0, 100)}%"></i></div><span class="audience-score">${score ? Math.round(score) : '—'}</span></div>`).join('')}
          
          
          
            </div>
          
          
          
            <div class="callout mt-16"><div class="callout-title">${icon('info')} 审美不是唯一变量</div>不同用户对重量、按键、屏幕和价格同样敏感。一个高匹配的外观无法弥补完全错误的产品规格。</div>
          
          
          
          </div>
        </div>
        <div class="panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('star')} 产品口碑表现</div><div class="panel-sub">媒体评分与上期销量的组合，是最真实的产品反馈。</div></div><button class="link-btn" data-action="nav" data-page="products">产品中心 →</button></div>
          
          
          
          <div class="panel-body">
          
          
          
            ${topProducts.length ? `<div class="reception-list">${topProducts.map(p => `<div class="reception-row"><div class="reception-thumb is-photo">${photoImg(photoForProduct(p), '', p.name)}</div><div class="reception-info"><b>${esc(p.name)}</b><span>${esc(categoryData(p.category).name)} · ${(p.lastUnits || 0).toLocaleString('zh-CN')} 台 · ${esc(p.pros[0] || '')}</span></div><span class="reception-score">${p.overall}</span></div>`).join('')}</div>` : '<div class="empty-inline">还没有在售相机。营销只能放大真实存在的产品。</div>'}
          
          
          
            <div class="callout mt-12"><div class="callout-title">${icon('megaphone')} 口碑修复</div>如果品控或舆论出现问题，「口碑修复」会比任何广告都更有效。先从产品本身解决问题，再用营销沟通。</div>
          
          
          
          </div>
        </div>
      </div>
    `;
  }

  // ---------- operations page ----------
  function operationsHero() {
    const man = E.getManufacturing(game.company);
    const active = [...activeProducts(), ...activeLenses()];
    const capacity = man.capacity || 0;
    const forecast = active.reduce((s, p) => s + (p.lastForecast || 0), 0);
    const utilization = capacity > 0 ? clamp(forecast / capacity * 100, 0, 100) : 0;
    const fixed = E.monthlyFixedCost(game);
    return `<div class="ops-hero">
      <div class="capacity-panel">
        <div class="capacity-top"><div><div class="eyebrow">MANUFACTURING / ${man.mode === 'self' ? 'IN-HOUSE' : 'CONTRACT'}</div><div class="capacity-title">${esc(man.name)}</div><div class="capacity-sub">${esc(man.desc || '')} ${man.mode === 'self' ? '自有产线承担全部生产。' : '外部代工伙伴提供产能与质量体系。'}</div></div><span class="badge ${utilization > 90 ? 'bad' : utilization > 65 ? 'accent' : 'good'}">${utilization > 90 ? '产能紧张' : utilization > 65 ? '高位运行' : '产能充足'}</span></div>
        <div class="capacity-number">${capacity.toLocaleString('zh-CN')}<small> 台 / 月</small></div>
        <div class="capacity-bar"><i style="width:${utilization}%"></i><i class="free" style="width:${100 - utilization}%"></i></div>
        <div class="capacity-legend"><span><i class="dot accent"></i>预计需求 ${units(forecast)}</span><span><i class="dot faint"></i>可用余量 ${units(Math.max(0, capacity - forecast))}</span><span style="margin-left:auto">利用率 ${Math.round(utilization)}%</span></div>
      </div>
      <div class="ops-summary">
        <div class="eyebrow">MONTHLY OPERATIONS</div>
        <div class="flex justify-between items-center mt-12"><span style="font-size:12px;font-weight:600">固定经营支出</span><span class="badge">每月</span></div>
        <div class="metric-row"><label>员工薪资</label><b>${money(fixed.payroll)}</b></div>
        <div class="metric-row"><label>公司固定运营</label><b>${money(fixed.overhead)}</b></div>
        <div class="metric-row"><label>品牌营销</label><b>${money(fixed.marketing)}</b></div>
        <div class="metric-row"><label>代工伙伴费用</label><b>${money(fixed.partnerFee)}</b></div>
        <div class="metric-row"><label>工厂维护</label><b>${money(fixed.factoryUpkeep)}</b></div>
        <div class="metric-row"><label>贷款利息</label><b>${money(fixed.interest)}</b></div>
        <div class="metric-row" style="padding-top:10px"><label style="color:var(--text-soft);font-weight:600">月度固定支出</label><b style="color:var(--accent-bright);font-size:11px">${money(Object.values(fixed).reduce((a, b) => a + b, 0))}</b></div>
      </div>
    </div>`;
  }

  function renderOperationsPage() {
    const tab = UI.supplyTab;
    const man = E.getManufacturing(game.company);
    const c = game.company;
    const active = [...activeProducts(), ...activeLenses()];
    const productionView = () => {
      const forecast = active.reduce((s, p) => s + (p.lastForecast || 0), 0);
      const capacity = man.capacity || 0;
      return `
        <div class="grid-2 mb-16">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('factory')} 制造伙伴</div><div class="panel-sub">选择你的生产方式。代工厂拥有各自的质量、成本与产能特征。</div></div><span class="badge ${man.mode === 'self' ? 'good' : 'accent'}">${man.mode === 'self' ? '自有工厂' : '外部代工'}</span></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="odm-grid">
          
          
          
                ${Object.values(D.ODM_PARTNERS).filter(p => p.id !== 'self').map(p => `<button class="odm-card ${man.mode === 'partner' && c.odmPartner === p.id ? 'is-active' : ''}" data-action="set-odm" data-odm="${p.id}">
          
          
          
                  <div class="odm-name">${esc(p.name)}</div><div class="odm-en">${esc(p.en)}</div><div class="odm-desc">${esc(p.desc)}</div>
          
          
          
                  <div class="odm-stats"><span>产能 <b>${p.capacity.toLocaleString('zh-CN')} 台/月</b></span><span>成本系数 <b>${p.cost.toFixed(2)}</b></span><span>质量系数 <b>${p.quality.toFixed(2)}</b></span><span>月费 <b>${money(p.fee)}</b></span></div>
          
          
          
                </button>`).join('')}
          
          
          
              </div>
          
          
          
              <div class="factory-panel mt-12">
          
          
          
                <div class="factory-top"><div><div class="factory-name">自有工厂 · ${esc(D.FACTORY_LEVELS[c.ownFactoryLevel || 0].name)}</div><div class="factory-desc">${esc(D.FACTORY_LEVELS[c.ownFactoryLevel || 0].desc)}</div></div><button class="btn btn-sm ${c.manufacturingMode === 'self' ? 'btn-primary' : 'btn-secondary'}" data-action="set-self-manufacturing" ${!c.ownFactoryLevel ? 'disabled' : ''}>${c.manufacturingMode === 'self' ? '正在使用' : '切换到自有产线'}</button></div>
          
          
          
                <div class="factory-levels">${[1, 2, 3].map(n => `<span class="factory-level ${c.ownFactoryLevel >= n ? 'is-on' : ''}"></span>`).join('')}</div>
          
          
          
                <div class="flex justify-between items-center mt-8"><span class="faint" style="font-size:8px">${c.ownFactoryLevel ? '产能 ' + D.FACTORY_LEVELS[c.ownFactoryLevel].capacity.toLocaleString('zh-CN') + ' 台/月 · 成本系数 ' + D.FACTORY_LEVELS[c.ownFactoryLevel].cost : '尚未拥有自有工厂'}${c.ownFactoryLevel < 3 ? ' · 升级费用 ' + money(D.FACTORY_LEVELS[c.ownFactoryLevel].upgradeCost) : ''}</span>${c.ownFactoryLevel < 3 ? `<button class="btn btn-sm btn-secondary" data-action="upgrade-factory" ${c.cash < D.FACTORY_LEVELS[c.ownFactoryLevel].upgradeCost ? 'disabled' : ''}>${icon('plus')} 升级产线</button>` : '<span class="badge good">最高等级</span>'}</div>
          
          
          
              </div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('layers')} 产能配置</div><div class="panel-sub">自动生产按需求预测补货；关闭后可手动设置每月生产上限。</div></div><span class="badge">${capacity.toLocaleString('zh-CN')} 台/月</span></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="metric-row"><label>预计总需求</label><b>${units(forecast)}</b></div>
          
          
          
              <div class="progress mb-12"><i style="width:${capacity ? clamp(forecast / capacity * 100, 0, 100) : 0}%"></i></div>
          
          
          
              <div class="metric-row"><label>当前生产成本系数</label><b>${man.costFactor.toFixed(2)}</b></div>
          
          
          
              <div class="metric-row"><label>预计缺陷质量系数</label><b>${man.quality.toFixed(2)}</b></div>
          
          
          
              <div class="metric-row"><label>当前月费 / 固定成本</label><b>${money(man.mode === 'partner' ? man.fee : 0)}</b></div>
          
          
          
              <div class="metric-row"><label>库存估值</label><b>${money(E.inventoryValue(game))}</b></div>
          
          
          
              <div class="callout accent mt-12"><div class="callout-title">${icon('info')} 产能瓶颈</div>当预计需求超过产能时，自动生产会按比例压缩，导致缺货和口碑损失。升级工厂或切换到更大的代工伙伴可以解除瓶颈。</div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('sliders')} 生产计划</div><div class="panel-sub">自动模式会在每次结算时根据需求预测补货；手动模式下按输入数量生产。</div></div><span class="badge">${active.length} 个在售产品</span></div>
          
          
          
          <div class="panel-body">
          
          
          
            ${active.length ? `<div class="production-row header"><span>产品</span><span>预测需求</span><span>库存</span><span>自动补货</span><span>手动月产量</span></div><div class="production-list">${active.map(p => `<div class="production-row">
          
          
          
              <div class="production-product"><b>${esc(p.name)}</b><span>${p.kind === 'lens' ? '镜头' : categoryData(p.category).short} · 单位成本 ${moneyNumber(p.unitCost)}</span></div>
          
          
          
              <div class="production-cell">${(p.lastForecast || 0).toLocaleString('zh-CN')}</div>
          
          
          
              <div class="production-cell">${(p.stock || 0).toLocaleString('zh-CN')}</div>
          
          
          
              <div class="production-cell"><button class="toggle ${p.autoProduction ? 'is-on' : ''}" data-action="toggle-auto-production" data-id="${attr(p.id)}"></button></div>
          
          
          
              <div class="production-cell"><input class="text-input production-input" type="number" min="0" step="50" value="${p.monthlyProduction || 0}" data-production-input data-id="${attr(p.id)}" ${p.autoProduction ? 'disabled' : ''}></div>
          
          
          
            </div>`).join('')}</div>` : '<div class="empty-inline">还没有在售产品，暂无生产计划。</div>'}
          
          
          
            <div class="callout mt-12"><div class="callout-title">${icon('truck')} 供货节奏</div>首批库存在上市时扣除。之后每个月的备货会占用现金；如果需求低于预期，库存会挤压现金流。不要让「以为会卖爆」变成库存危机。</div>
          
          
          
          </div>
        </div>`;
    };
    const supplyView = () => `
      <div class="grid-2 mb-16">
        <div class="panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('cpu')} 传感器供应商</div><div class="panel-sub">供应商决定传感器成本、质量与可获得的技术上限。变更仅影响之后的新产品。</div></div><span class="badge">${esc(E.getSensorSupplier(c).name)}</span></div>
          
          
          
          <div class="panel-body">
          
          
          
            <div class="supplier-grid">${Object.values(D.SENSOR_SUPPLIERS).filter(s => s.id !== 'inhouse').map(s => {
          
          
          
              const locked = s.minSensorTech && (c.tech.sensor || 1) < s.minSensorTech;
          
          
          
              return `<button class="supplier-card ${c.sensorSupplier === s.id ? 'is-active' : ''} ${locked ? 'is-locked' : ''}" data-action="select-supplier" data-supplier="${s.id}" ${locked ? 'disabled' : ''}>
          
          
          
                <div class="supplier-top"><div class="supplier-name">${esc(s.name)}</div>${locked ? `<span class="badge bad">Lv.${s.minSensorTech}</span>` : c.sensorSupplier === s.id ? '<span class="badge accent">已选</span>' : ''}</div>
          
          
          
                <div class="supplier-en">${esc(s.en)}</div>
          
          
          
                <div class="supplier-desc">${esc(s.desc)}</div>
          
          
          
                <div class="supplier-factors"><span>成本 <b>×${s.cost.toFixed(2)}</b></span><span>质量 <b>×${s.quality.toFixed(2)}</b></span><span>交期 <b>${s.lead}周</b></span></div>
          
          
          
              </button>`;
          
          
          
            }).join('')}</div>
          
          
          
          </div>
        </div>
        <div class="panel">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('shield')} 供应风险与库存</div><div class="panel-sub">更高品质的供应商通常更贵，也更难拿到配额。</div></div></div>
          
          
          
          <div class="panel-body">
          
          
          
            <div class="metric-row"><label>当前供应商质量</label><b>×${E.getSensorSupplier(c).quality.toFixed(2)}</b></div>
          
          
          
            <div class="metric-row"><label>单机成本影响</label><b>×${E.getSensorSupplier(c).cost.toFixed(2)}</b></div>
          
          
          
            <div class="metric-row"><label>供应交期</label><b>${E.getSensorSupplier(c).lead} 周</b></div>
          
          
          
            <div class="metric-row"><label>在售库存价值</label><b>${money(E.inventoryValue(game))}</b></div>
          
          
          
            <div class="metric-row"><label>在售产品数量</label><b>${active.length}</b></div>
          
          
          
            <div class="callout accent mt-12"><div class="callout-title">${icon('cpu')} 自研 CMOS / AF 芯片</div>自研不再是这里的一次性开关：请在「芯片实验室」立项，完成流片与验证后，在相机设计里选择「自研」。<button class="link-btn ml-8" data-action="nav" data-page="chips">前往芯片实验室 →</button></div>
          
          
          
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><div><div class="panel-title">${icon('box')} 生产库存明细</div><div class="panel-sub">库存以制造成本计入公司资产。明显的滞销会占用现金。</div></div></div>
        <div class="panel-body">
          
          
          
          <div class="inventory-grid">
          
          
          
            ${active.map(p => `<div class="inventory-card"><label>${esc(p.name)}</label><b>${(p.stock || 0).toLocaleString('zh-CN')} 件</b><span>库存价值 ${money((p.stock || 0) * p.unitCost)} · 单位成本 ${moneyNumber(p.unitCost)}</span></div>`).join('') || '<div class="empty-inline">暂无库存。</div>'}
          
          
          
          </div>
        </div>
      </div>`;
    const teamView = () => {
      const roles = Object.values(D.STAFF_ROLES);
      const total = E.companyStaffCount(c);
      const salary = E.monthlySalaryBill(c);
      return `
        <div class="panel mb-16">
          
          
          
          <div class="panel-header"><div><div class="panel-title">${icon('users')} 团队结构</div><div class="panel-sub">人不是成本项，而是产品能力和组织速度的来源。</div></div><div class="panel-actions"><span class="badge">${total} 人</span><span class="badge accent">${money(salary)} / 月</span></div></div>
          
          
          
          <div class="panel-body">
          
          
          
            <div class="team-grid">
          
          
          
              ${roles.map(role => `<div class="team-card">
          
          
          
                <div class="team-icon">${icon(role.icon === 'chip' ? 'cpu' : role.icon === 'pen' ? 'pen' : role.icon === 'shield' ? 'shield' : role.icon === 'spark' ? 'sparkles' : 'chart')}</div>
          
          
          
                <div class="team-name">${esc(role.name)}</div>
          
          
          
                <div class="team-desc">${esc(role.desc)}</div>
          
          
          
                <div class="team-count-row"><span class="team-count">${c.staff[role.id] || 0}</span><span class="team-salary">${money(role.salary)} / 人</span></div>
          
          
          
                <div class="team-actions"><button class="btn btn-sm btn-ghost" data-action="fire-staff" data-role="${role.id}" ${!c.staff[role.id] ? 'disabled' : ''}>${icon('minus')} 解雇</button><button class="btn btn-sm btn-secondary" data-action="hire-staff" data-role="${role.id}">${icon('plus')} 招聘</button></div>
          
          
          
                <div class="team-impact">${teamImpactText(role.id, c)}</div>
          
          
          
              </div>`).join('')}
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="grid-2">
          
          
          
          <div class="panel"><div class="panel-header"><div><div class="panel-title">${icon('flask')} 研发能力</div></div></div><div class="panel-body">
          
          
          
            <div class="metric-row"><label>工程师</label><b>${c.staff.engineers} 人</b></div>
          
          
          
            <div class="metric-row"><label>月度研发力</label><b>${Math.round(E.researchPower(c))} RP</b></div>
          
          
          
            <div class="metric-row"><label>设计团队</label><b>${c.staff.designers} 人</b></div>
          
          
          
            <div class="metric-row"><label>外形完成度加成</label><b>+${Math.round(clamp(2 + Math.sqrt(c.staff.designers) * 1.25, 2, 11))} 分</b></div>
          
          
          
            <div class="metric-row"><label>品控团队</label><b>${c.staff.qc} 人</b></div>
          
          
          
          </div></div>
          
          
          
          <div class="panel"><div class="panel-header"><div><div class="panel-title">${icon('briefcase')} 商业与营销</div></div></div><div class="panel-body">
          
          
          
            <div class="metric-row"><label>市场营销</label><b>${c.staff.marketing} 人</b></div>
          
          
          
            <div class="metric-row"><label>品牌广告效率</label><b>×${(1 + Math.sqrt(c.staff.marketing || 0) / 18).toFixed(2)}</b></div>
          
          
          
            <div class="metric-row"><label>渠道与销售</label><b>${c.staff.sales} 人</b></div>
          
          
          
            <div class="metric-row"><label>需求销售加成</label><b>×${(0.9 + Math.sqrt(c.staff.sales || 0) / 75).toFixed(2)}</b></div>
          
          
          
            <div class="callout mt-12"><div class="callout-title">${icon('info')} 招聘成本</div>招聘需要支付约 1.6 个月薪资的猎头与入职成本，解雇需要支付 1 个月薪资作为离职补偿。</div>
          
          
          
          </div></div>
        </div>
        <div class="team-total-panel mt-16">
          
          
          
          <div><div class="mini-label">月度人力总成本</div><div style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em;margin-top:3px">${money(salary)}</div><div class="faint" style="font-size:8px">${total} 名员工 · 不含代工与固定运营成本</div></div>
          
          
          
          <div class="flex gap-8"><button class="btn btn-sm btn-secondary" data-action="nav" data-page="finance">查看财务 ${icon('arrowRight')}</button><button class="btn btn-sm btn-primary" data-action="advance-month">推进一月</button></div>
        </div>`;
    };
    return `
      ${pageHead({
        eyebrow: 'OPERATIONS / 运营中枢',
        title: '把好产品，真的造出来。',
        sub: '从代工与工厂选择、传感器供应到团队配置与产能规划。产品定义得再好，最终也要通过真实的制造与组织能力落地。',
        actions: `<button class="btn btn-secondary" data-action="nav" data-page="finance">${icon('wallet')} 财务中心</button><button class="btn btn-primary" data-action="advance-month">${icon('play')} 推进一月</button>`
      })}
      ${eventBanner()}
      ${operationsHero()}
      <div class="tabs ops-tabs">
        <button class="tab ${tab === 'production' ? 'is-active' : ''}" data-action="supply-tab" data-tab="production">产能与制造</button>
        <button class="tab ${tab === 'supply' ? 'is-active' : ''}" data-action="supply-tab" data-tab="supply">供应链与库存</button>
        <button class="tab ${tab === 'team' ? 'is-active' : ''}" data-action="supply-tab" data-tab="team">团队与组织</button>
      </div>
      ${tab === 'production' ? productionView() : tab === 'supply' ? supplyView() : teamView()}
    `;
  }

  function teamImpactText(roleId, c) {
    if (roleId === 'engineers') return `研发进度约 ${Math.round(E.researchPower(c))} RP / 月`;
    if (roleId === 'designers') return `外形设计加成约 +${Math.round(clamp(2 + Math.sqrt(c.staff.designers) * 1.25, 2, 11))}`;
    if (roleId === 'qc') return `缺陷率降低系数约 ${(1 / (1 + Math.sqrt(c.staff.qc || 0) * 0.16)).toFixed(2)}`;
    if (roleId === 'marketing') return `营销预算效率 ×${(1 + Math.sqrt(c.staff.marketing || 0) / 18).toFixed(2)}`;
    if (roleId === 'sales') return `需求销售加成 ×${(0.9 + Math.sqrt(c.staff.sales || 0) / 75).toFixed(2)}`;
    return '';
  }

  // ---------- finance page ----------
  function renderFinancePage() {
    const c = game.company;
    const fixed = E.monthlyFixedCost(game);
    const fixedTotal = Object.values(fixed).reduce((a, b) => a + b, 0);
    const r = game.lastReport;
    const hist = (game.history || []).slice(-12);
    const labels = hist.map(h => String(h.label).split('.')[1] || h.label);
    const cashValues = hist.map(h => h.cash || 0);
    const profitValues = hist.map(h => h.profit || 0);
    const credit = E.companyCreditLimit(game);
    const available = Math.max(0, credit - c.debt);
    const oneOffs = c.oneOffs || [];
    const taxRate = c.taxRate || 0.25;
    return `
      ${pageHead({
        eyebrow: 'FINANCE / 财务中心',
        title: '现金是公司的氧气。',
        sub: '收入不是利润，利润不是现金，现金也不是自由。管理研发、备货、营销与贷款之间的现金流节奏。',
        actions: `<button class="btn btn-secondary" data-action="nav" data-page="operations">${icon('factory')} 运营与产能</button><button class="btn btn-primary" data-action="advance-month">${icon('play')} 推进一月</button>`
      })}
      <div class="finance-kpis">
        <div class="finance-kpi"><label>账面现金 ${icon('wallet')}</label><b class="${c.cash < 0 ? 'bad' : ''}">${money(c.cash)}</b><span>${c.cash < 0 ? '现金流为负，需立即融资' : '含当前库存占用的机会成本'}</span></div>
        <div class="finance-kpi"><label>有息负债 ${icon('receipt')}</label><b>${money(c.debt)}</b><span>月利率 ${(c.loanRate * 100).toFixed(2)}% · 利息 ${money(fixed.interest)}/月</span></div>
        <div class="finance-kpi"><label>公司估值 ${icon('trend')}</label><b>${money(E.companyValuation(game))}</b><span>品牌 + 产品 + 现金 + 利润倍数</span></div>
        <div class="finance-kpi"><label>月度固定支出 ${icon('chart')}</label><b>${money(fixedTotal)}</b><span>薪资 ${money(fixed.payroll)} · 营销 ${money(fixed.marketing)}</span></div>
      </div>
      <div class="finance-main">
        <div class="stack-12">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('chart')} 现金流与经营表现</div><div class="panel-sub">现金余额与月度净利润。最近 ${hist.length} 个月。</div></div><div class="chart-legend"><span><i class="legend-mark"></i>现金</span><span><i class="legend-mark good"></i>月净利</span></div></div>
          
          
          
            <div class="panel-body"><div class="chart-lg">${lineChart([
          
          
          
              { values: cashValues, color: 'var(--accent)', area: true, width: 1.8 },
          
          
          
              { values: profitValues, color: 'var(--good)', width: 1.4 }
          
          
          
            ], labels.length ? labels : ['开局', '现在'], { height: 250, shortValue: compactNumber })}</div></div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('receipt')} 最近一期损益</div><div class="panel-sub">${r ? r.dateLabel : '尚无结算记录'} · 已售商品成本计入 COGS，未售库存不计入本期损益。</div></div><span class="badge ${r && r.netProfit >= 0 ? 'good' : 'bad'}">${r ? money(r.netProfit) : '—'}</span></div>
          
          
          
            <div class="panel-body">
          
          
          
              ${r ? `<div class="grid-2" style="gap:22px">
          
          
          
                <div><table class="statement-table">
          
          
          
                  <tr><td>相机净营收</td><td>${money(r.cameraRevenue)}</td></tr>
          
          
          
                  <tr class="is-sub"><td>其中套机镜头收入</td><td>${money(r.kitRevenue)}</td></tr>
          
          
          
                  <tr><td>镜头净营收</td><td>${money(r.lensRevenue)}</td></tr>
          
          
          
                  <tr><td>渠道分成</td><td>-${money(r.channelFee)}</td></tr>
          
          
          
                  <tr><td>已售商品成本 COGS</td><td>-${money(r.cogs)}</td></tr>
          
          
          
                  <tr class="is-total"><td>毛利润</td><td>${money(r.grossProfit)}</td></tr>
          
          
          
                </table></div>
          
          
          
                <div><table class="statement-table">
          
          
          
                  <tr><td>员工薪资</td><td>-${money(r.payroll)}</td></tr>
          
          
          
                  <tr><td>固定运营</td><td>-${money(r.overhead)}</td></tr>
          
          
          
                  <tr><td>品牌营销</td><td>-${money(r.marketing)}</td></tr>
          
          
          
                  <tr><td>代工 / 工厂成本</td><td>-${money(r.partnerFee + r.factoryUpkeep)}</td></tr>
          
          
          
                  <tr><td>售后与保修</td><td>-${money(r.warranty)}</td></tr>
          
          
          
                  <tr><td>贷款利息</td><td>-${money(r.interest)}</td></tr>
          
          
          
                  <tr><td>企业所得税 (${(taxRate * 100).toFixed(0)}%)</td><td>-${money(r.tax)}</td></tr>
          
          
          
                  <tr class="is-total"><td>净利润</td><td class="${r.netProfit >= 0 ? '' : 'bad'}">${money(r.netProfit)}</td></tr>
          
          
          
                </table></div>
          
          
          
              </div>
          
          
          
              <div class="grid-3 mt-16">
          
          
          
                <div class="metric-row"><label>本期经营现金流</label><b class="${r.cashDelta >= 0 ? 'good' : 'bad'}">${signedMoney(r.cashDelta)}</b></div>
          
          
          
                <div class="metric-row"><label>期末现金</label><b>${money(r.cashEnd)}</b></div>
          
          
          
                <div class="metric-row"><label>库存价值</label><b>${money(r.inventoryValue)}</b></div>
          
          
          
              </div>` : '<div class="empty-inline">推进一个月后查看第一份损益表。</div>'}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('clock')} 月度历史</div><div class="panel-sub">销量、营收、利润与份额。</div></div><span class="badge">${(game.history || []).length} 条记录</span></div>
          
          
          
            <div class="panel-body panel-body tight" style="padding:0 18px 18px">
          
          
          
              <div class="history-scroll"><table class="data-table">
          
          
          
                <thead><tr><th>月份</th><th>现金</th><th>营收</th><th>净利润</th><th>相机销量</th><th>份额</th><th>负债</th></tr></thead>
          
          
          
                <tbody>${[...(game.history || [])].reverse().slice(0, 24).map(h => `<tr><td>${esc(h.label)}</td><td class="num">${money(h.cash)}</td><td class="num">${money(h.revenue || 0)}</td><td class="num ${h.profit >= 0 ? 'pos' : 'neg'}">${signedMoney(h.profit || 0)}</td><td class="num">${(h.units || 0).toLocaleString('zh-CN')}</td><td class="num">${(h.share || 0).toFixed(1)}%</td><td class="num">${money(h.debt || 0)}</td></tr>`).join('')}</tbody>
          
          
          
              </table></div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="stack-12">
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('wallet')} 银行授信</div><div class="panel-sub">授信额由品牌实力、现金流与历史营收共同决定。</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="metric-row"><label>总授信额度</label><b>${money(credit)}</b></div>
          
          
          
              <div class="metric-row"><label>可用额度</label><b>${money(available)}</b></div>
          
          
          
              <div class="metric-row"><label>已有负债</label><b>${money(c.debt)}</b></div>
          
          
          
              <div class="metric-row"><label>月利率</label><b>${(c.loanRate * 100).toFixed(2)}%</b></div>
          
          
          
              <div class="progress mt-12" style="height:6px"><i style="width:${clamp(c.debt / Math.max(1, credit) * 100, 0, 100)}%;background:linear-gradient(90deg,var(--accent-deep),var(--bad))"></i></div>
          
          
          
              <div class="metric-row mt-12"><label>本月利息成本</label><b>${money(fixed.interest)}</b></div>
          
          
          
              <div class="loan-amount-row">
          
          
          
                <input class="text-input" type="number" id="loan-amount" min="100000" step="100000" placeholder="输入贷款金额，例如 5000000">
          
          
          
                <button class="btn btn-sm btn-secondary" data-action="custom-loan">借款</button>
          
          
          
              </div>
          
          
          
              <div class="flex gap-6 mt-8" style="flex-wrap:wrap">
          
          
          
                ${[10000000, 50000000, 200000000].map(v => `<button class="btn btn-sm btn-ghost" data-action="take-loan" data-amount="${v}" ${available < v ? 'disabled' : ''}>+${money(v)}</button>`).join('')}
          
          
          
              </div>
          
          
          
              <div class="divider my-12" style="margin:12px 0"></div>
          
          
          
              <button class="btn btn-sm btn-secondary btn-block" data-action="repay-loan" ${!c.debt ? 'disabled' : ''}>全额偿还 ${money(Math.min(c.debt, c.cash))}</button>
          
          
          
              <div class="form-help mt-8">偿还金额受现金余额限制。贷款会进入现金但增加负债与每月利息。</div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('layers')} 资产结构</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="metric-row"><label>现金</label><b>${money(c.cash)}</b></div>
          
          
          
              <div class="metric-row"><label>库存资产</label><b>${money(E.inventoryValue(game))}</b></div>
          
          
          
              <div class="metric-row"><label>品牌资产（估算）</label><b>${money(Math.round((c.awareness || 0) * (c.reputation || 0) * 1500000))}</b></div>
          
          
          
              <div class="metric-row"><label>产品组合价值（估算）</label><b>${money([...activeProducts(), ...activeLenses()].length * 18000000)}</b></div>
          
          
          
              <div class="metric-row"><label>公司估值</label><b style="color:var(--accent-bright)">${money(E.companyValuation(game))}</b></div>
          
          
          
              <div class="callout accent mt-12"><div class="callout-title">${icon('info')} 一次性投入</div>${oneOffs.length ? oneOffs.slice(-4).map(o => `${esc(o.label)} ${money(o.amount)}`).join('<br>') : '本月尚未发生研发、招聘、营销或工装类一次性投入。'}</div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel">
          
          
          
            <div class="panel-header"><div><div class="panel-title">${icon('warning') || icon('alert')} 财务健康检查</div></div></div>
          
          
          
            <div class="panel-body">
          
          
          
              <div class="metric-row"><label>固定支出 / 月</label><b>${money(fixedTotal)}</b></div>
          
          
          
              <div class="metric-row"><label>可用月数</label><b>${c.cash > 0 ? (r && r.netProfit > 0 ? '正循环' : Math.floor(c.cash / Math.max(1, fixedTotal)) + ' 个月') : '0 个月'}</b></div>
          
          
          
              <div class="metric-row"><label>上期净利率</label><b>${r && r.revenueNet > 0 ? ((r.netProfit / r.revenueNet) * 100).toFixed(1) + '%' : '—'}</b></div>
          
          
          
              <div class="finance-note mt-12">${icon('info')}<div>研发预算、首批库存和营销战役会在发生时就减少现金，但库存与工装不会立即进入当月损益。请同时关注现金余额和利润表。</div></div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
      </div>
      <div class="panel mt-16"><div class="panel-header"><div><div class="panel-title">${icon('info')} 财务提示</div></div></div><div class="panel-body"><div class="grid-3"><div class="callout"><div class="callout-title">收入 ≠ 利润</div>渠道分成、制造成本和营销支出会从营收中扣除。毛利高不代表净利高。</div><div class="callout"><div class="callout-title">利润 ≠ 现金</div>库存会占用现金，研发和工装会在当月扣除。现金可以比利润先耗尽。</div><div class="callout"><div class="callout-title">贷款是杠杆</div>借款能让你抓住机会，也会增加每月利息。保持授信空间以应对供应链或营销机会。</div></div></div></div>
    `;
  }

  // ---------- settings ----------
  function renderSettingsPage() {
    const c = game.company;
    const savedAt = game.updatedAt ? new Date(game.updatedAt) : null;
    return `
      ${pageHead({
        eyebrow: 'SYSTEM / 设置与存档',
        title: '存档、版本与游戏说明。',
        sub: '这是单机游戏，所有进度保存在你的浏览器本地。重要进度请导出 JSON 备份。',
        actions: `<button class="btn btn-secondary" data-action="save-game">${icon('save')} 立即保存</button><button class="btn btn-primary" data-action="export-save">${icon('download')} 导出存档</button>`
      })}
      <div class="settings-grid">
        <div class="stack-12">
          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('save')} 本地存档</h3>
          
          
          
            <p>游戏会在操作后自动保存到浏览器 localStorage。清理浏览器站点数据、切换浏览器或使用隐私模式可能导致存档丢失。</p>
          
          
          
            <div class="settings-data">
          
          
          
              <div class="settings-data-row"><label>公司</label><b>${esc(c.name)} · ${game.mode === 'takeover' ? '接管模式' : '自建公司'}</b></div>
          
          
          
              <div class="settings-data-row"><label>当前时间</label><b>${E.monthLabel(game.monthIndex)}</b></div>
          
          
          
              <div class="settings-data-row"><label>游戏版本</label><b>v1.2 / SAVE v${E.SAVE_VERSION}</b></div>
          
          
          
              <div class="settings-data-row"><label>最后保存</label><b>${savedAt ? savedAt.toLocaleString('zh-CN') : '—'}</b></div>
          
          
          
              <div class="settings-data-row"><label>产品与人月</label><b>${activeProducts().length} 台相机 · ${activeLenses().length} 支镜头 · ${game.stats.monthsPlayed || 0} 个月</b></div>
          
          
          
              <div class="settings-data-row"><label>累计销量</label><b>${units(game.stats.cameraUnits || 0)} 相机 / ${units(game.stats.lensUnits || 0)} 镜头</b></div>
          
          
          
            </div>
          
          
          
            <div class="settings-actions">
          
          
          
              <button class="btn btn-sm btn-secondary" data-action="save-game">${icon('save')} 保存</button>
          
          
          
              <button class="btn btn-sm btn-secondary" data-action="export-save">${icon('download')} 导出 JSON</button>
          
          
          
              <label class="btn btn-sm btn-secondary" style="cursor:pointer">${icon('upload')} 导入 JSON<input type="file" id="save-file-input" accept="application/json,.json" class="is-hidden"></label>
          
          
          
              <button class="btn btn-sm btn-ghost" data-action="return-title">返回标题</button>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('camera')} 实拍照片库与图像</h3>
          
          
          
            <p>游戏内相机产品图直接读取你提供的本地照片库：${PHOTO ? PHOTO.items.length : 0} 台真实机身、${PHOTO ? PHOTO.brands().length : 0} 个品牌，按机型自动匹配。照片保持原样，不做 AI 生成或重绘；联网补充参考图是可选项。</p>
          
          
          
            <div class="toggle-setting"><div class="toggle-setting-info"><b>联网补充参考图（可选）</b><span>从 Wikimedia Commons 补充本地库没有的参考缩略图。关闭后完全离线。</span></div><button class="toggle ${game.art && game.art.settings.online ? 'is-on' : ''}" data-action="art-toggle-online"></button></div>
          
          
          
            <div class="toggle-setting"><div class="toggle-setting-info"><b>3D 结构示意叠影</b><span>仅在「3D 示意」模式中叠加结构轮廓，不影响实拍商品图。</span></div><button class="toggle ${UI.artGhost ? 'is-on' : ''}" data-action="toggle-art-ghost"></button></div>
          
          
          
            <div class="settings-data">
          
          
          
              <div class="settings-data-row"><label>实拍照片</label><b>${PHOTO ? PHOTO.items.length : 0} 台 / ${PHOTO ? PHOTO.brands().length : 0} 个品牌</b></div>
          
          
          
              <div class="settings-data-row"><label>当前外形照片</label><b>${(() => {
          
          
          
                if (!PHOTO || !game.drafts.camera) return '按当前品牌自动匹配';
          
          
          
                try { const ph = PHOTO.forDesign(game.drafts.camera, game.company); return ph ? esc(ph.label) : '—'; } catch (e) { return '—'; }
          
          
          
              })()}</b></div>
          
          
          
              <div class="settings-data-row"><label>结构比例基准</label><b>${esc((ART && ART.data.modelById(((game.drafts.camera && game.drafts.camera.referenceModelId) || (game.art && game.art.baseline && game.art.baseline.modelId))) || {}).name || '按当前品类自动选择')}</b></div>
          
          
          
              <div class="settings-data-row"><label>照片匹配方式</label><b>品牌 + 机型 → 品类回退</b></div>
          
          
          
              <div class="settings-data-row"><label>3D 结构示意</label><b>WebGL2 · 仅设计工作台</b></div>
          
          
          
            </div>
          
          
          
            <div class="settings-actions">
          
          
          
              <button class="btn btn-sm btn-secondary" data-action="nav" data-page="gallery">${icon('camera')} 打开照片库</button>
          
          
          
              <button class="btn btn-sm btn-ghost" data-action="art-clear-cache">${icon('trash')} 清理联网缓存</button>
          
          
          
            </div>
          
          
          
          </div>          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('settings')} 游戏体验</h3>
          
          
          
            <div class="toggle-setting"><div class="toggle-setting-info"><b>减少动态效果</b><span>关闭镜头发光、页面过渡和脉冲动画。</span></div><button class="toggle ${game.settings.reducedMotion ? 'is-on' : ''}" data-action="toggle-motion"></button></div>
          
          
          
            <div class="toggle-setting"><div class="toggle-setting-info"><b>显示界面提示</b><span>保留设计师提示和经营建议。</span></div><button class="toggle ${game.settings.showTips ? 'is-on' : ''}" data-action="toggle-tips"></button></div>
          
          
          
            <div class="toggle-setting"><div class="toggle-setting-info"><b>自动保存</b><span>在每次操作后写入本地存档。</span></div><span class="badge good">常开</span></div>
          
          
          
            <div class="credits"><b>关于本作</b><br>《FRAME · 相机公司模拟器》是一款个人自用的工业产品与公司经营沙盒。游戏内使用真实品牌、产品与卡口名称，仅用于非商业模拟与学习用途，不代表任何品牌官方信息，所有市场、价格、财务与评价数值均为玩法化虚构。</div>
          
          
          
          </div>
          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('info')} 玩法速览</h3>
          
          
          
            <div class="help-steps">
          
          
          
              <div class="help-step"><span class="help-num">01</span><div><b>从产品线开始</b><p>选择相机品类与目标用户，再用设计模板或自己的直觉确定外形方向。</p></div></div>
          
          
          
              <div class="help-step"><span class="help-num">02</span><div><b>像工业设计师一样定制</b><p>调整机身形态、尺寸、材质、颜色、按键、屏幕、卡口和配件。实时评价会告诉你它是否真的成立。</p></div></div>
          
          
          
              <div class="help-step"><span class="help-num">03</span><div><b>研究技术，补齐上限</b><p>传感器、视频、光学、散热等 13 条技术树决定下一代产品的参数天花板。</p></div></div>
          
          
          
              <div class="help-step"><span class="help-num">04</span><div><b>定价、上市、经营</b><p>设定售价与库存，选择上市营销，然后推进月份观察需求、成本、竞品和口碑变化。</p></div></div>
          
          
          
            </div>
          
          
          
          </div>
        </div>
        <div class="stack-12">
          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('crown')} 本局统计</h3>
          
          
          
            <div class="settings-data" style="grid-template-columns:1fr 1fr">
          
          
          
              <div class="settings-data-row"><label>自研上市相机</label><b>${game.stats.camerasLaunched || 0}</b></div>
          
          
          
              <div class="settings-data-row"><label>自研上市镜头</label><b>${game.stats.lensesLaunched || 0}</b></div>
          
          
          
              <div class="settings-data-row"><label>累计相机销量</label><b>${units(game.stats.cameraUnits || 0)}</b></div>
          
          
          
              <div class="settings-data-row"><label>累计镜头销量</label><b>${units(game.stats.lensUnits || 0)}</b></div>
          
          
          
              <div class="settings-data-row"><label>累计净营收</label><b>${money(game.stats.totalRevenue || 0)}</b></div>
          
          
          
              <div class="settings-data-row"><label>累计净利润</label><b>${money(game.stats.totalProfit || 0)}</b></div>
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel settings-card">
          
          
          
            <h3>${icon('star')} 已达成里程碑</h3>
          
          
          
            <div class="milestone-list" style="grid-template-columns:1fr">
          
          
          
              ${D.MILESTONES.map(m => { const done = game.milestones && game.milestones[m.id]; return `<div class="milestone ${done ? 'is-done' : ''}"><div class="milestone-top">${icon(done ? 'checkcircle' : m.icon || 'star')}${esc(m.name)}</div><div class="milestone-progress"><span>${esc(m.desc)}</span><span>${done ? '✓ 已达成' : esc(E.milestoneProgress(game, m.id).display)}</span></div></div>`; }).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="panel settings-card danger-card">
          
          
          
            <h3>${icon('alert')} 重新开始</h3>
          
          
          
            <p>清除本地存档并从开局界面重新开始。此操作不可撤销。如果你只是想尝试不同路线，建议先导出当前存档。</p>
          
          
          
            <div class="settings-actions">
          
          
          
              <button class="btn btn-sm btn-secondary" data-action="nav" data-page="design">${icon('design')} 回到设计室</button>
          
          
          
              <button class="btn btn-sm btn-danger" data-action="new-game-confirm">${icon('trash')} 新游戏</button>
          
          
          
            </div>
          
          
          
          </div>
        </div>
      </div>
    `;
  }

  // ---------- modal content ----------
  function modalHelp() {
    const hasGame = !!game;
    return modalShell({
      title: '如何经营一家相机公司',
      eyebrow: 'FIELD MANUAL / 玩法说明',
      sub: '你不需要懂相机工程，也能从直觉开始。只要记住：参数决定能力，外形决定吸引力，现金流决定你能玩多久。',
      size: 'wide',
      body: `
        <div class="help-schema">
          
          
          
          <div class="help-block"><h5>${icon('design')} 1 · 定义产品</h5><p>选择产品线、目标人群、设计模板。相机外形、尺寸、材质、颜色、按键、屏幕、卡口、配件全部可独立设计，实时改变评价。</p></div>
          
          
          
          <div class="help-block"><h5>${icon('cpu')} 2 · 工程与成本</h5><p>传感器、视频、编码、对焦、防抖和电池决定成本与性能。技术等级不足时，某些规格会被锁住。成本会反映在定价和毛利中。</p></div>
          
          
          
          <div class="help-block"><h5>${icon('globe')} 3 · 上市与竞争</h5><p>设定售价、备货与营销，推进月份结算销量。AI 竞品会持续发布新品、降价并改变市场压力。用户评价会影响品牌口碑与后续需求。</p></div>
          
          
          
          <div class="help-block"><h5>${icon('factory')} 4 · 公司与长期</h5><p>研发、供应链、团队、产能和营销共同构成公司能力。不要让现金被库存压死，也不要在现金流紧张时盲目扩大产品线。</p></div>
        </div>
        <div class="modal-section mt-16">
          
          
          
          <div class="modal-section-title">推荐游玩顺序</div>
          
          
          
          <div class="welcome-steps">
          
          
          
            <div class="welcome-step"><span class="welcome-step-num">01</span><div><b>先做一台中端微单或视频机</b><p>中端产品竞争激烈但需求大，能帮助新品牌建立第一波用户和口碑。</p></div></div>
          
          
          
            <div class="welcome-step"><span class="welcome-step-num">02</span><div><b>认真设计外形，不要只堆参数</b><p>选择符合目标人群的材质、颜色和握持。高参数低完成度的产品很可能口碑失败。</p></div></div>
          
          
          
            <div class="welcome-step"><span class="welcome-step-num">03</span><div><b>用发布会换来第一批关注</b><p>发布会规模、形式、媒体和创作者决定首发声量、预购与首月需求。</p></div></div>
          
          
          
            <div class="welcome-step"><span class="welcome-step-num">04</span><div><b>观察第一个月的真实需求</b><p>需求超出产能就扩产，库存积压就调价或控制生产。研发下一代技术，形成产品迭代。</p></div></div>
          
          
          
          </div>
        </div>
        <div class="modal-section">
          
          
          
          <div class="modal-section-title">快捷键与提示</div>
          
          
          
          <div class="grid-3"><div class="callout"><div class="callout-title">Esc</div>关闭弹窗或侧边导航。</div><div class="callout"><div class="callout-title">自动保存</div>每次操作后自动保存存档。可在设置页导出 JSON。</div><div class="callout"><div class="callout-title">手动推进</div>点击右上角「推进一月」或总览中的按钮，完成月度经营结算。</div></div>
        </div>`,
      foot: `<span class="foot-note">FRAME / CAMERA COMPANY SIMULATOR · 个人自用模拟游戏</span><button class="btn btn-secondary" data-action="close-modal">关闭</button>${hasGame ? `<button class="btn btn-primary" data-action="help-design">${icon('design')} 进入设计室</button>` : ''}`
    });
  }

  function modalNewCamera() {
    return modalShell({
      title: '为哪条产品线立项？',
      eyebrow: 'NEW PROJECT / 新产品立项',
      sub: '产品线决定默认的外形、传感器、卡口和竞争市场。立项后仍可回到第一步切换产品线。',
      size: 'xl',
      body: `
        <div class="option-grid cols-3" style="margin-bottom:16px">
          
          
          
          ${D.CATEGORY_ORDER.map(id => {
          
          
          
            const c = D.CATEGORIES[id];
          
          
          
            return `<button class="option-card" data-action="start-camera" data-category="${id}" style="padding:14px">
          
          
          
              <div class="category-code">${esc(c.code)}</div>
          
          
          
              <div class="option-card-name" style="font-size:12px;margin-top:8px">${esc(c.name)}</div>
          
          
          
              <div class="option-card-desc" style="-webkit-line-clamp:3">${esc(c.description)}</div>
          
          
          
              <div class="option-card-meta"><span>基准 ${moneyNumber(c.basePrice)}</span><span>默认 ${esc(D.SENSOR_FORMATS[c.sensor].name)}</span></div>
          
          
          
            </button>`;
          
          
          
          }).join('')}
        </div>
        <div class="callout accent"><div class="callout-title">${icon('info')} 设计不是填空题</div>选完产品线后，你仍可以自定义全部外形、操作结构、传感器规格和定价。相机不会因为属于一个品类就长得一样。</div>`,
      foot: `<span class="foot-note">新设计会自动保存为草稿。</span><button class="btn btn-secondary" data-action="close-modal">取消</button>`
    });
  }

  function modalConfirm(data) {
    return modalShell({
      title: data.title || '确认操作',
      eyebrow: data.eyebrow || 'CONFIRMATION / 确认',
      sub: data.sub || '',
      size: 'small',
      body: `<div class="callout ${data.tone === 'danger' ? 'bad' : 'accent'}">${data.messageHtml || `<div class="callout-title">${icon(data.tone === 'danger' ? 'alert' : 'info')} ${esc(data.heading || '请确认')}</div>${esc(data.message || '')}`}</div>`,
      foot: `<button class="btn btn-secondary" data-action="close-modal">${esc(data.cancelLabel || '取消')}</button><button class="btn ${data.tone === 'danger' ? 'btn-danger' : 'btn-primary'}" data-action="confirm-modal">${esc(data.confirmLabel || '确认')}</button>`
    });
  }

  function modalProduct(data) {
    const p = [...game.products, ...game.lenses].find(x => x.id === data.id);
    if (!p) return modalShell({ title: '产品不存在', body: '<div class="callout bad">找不到这台产品。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    const isCamera = p.kind === 'camera';
    const detailPhoto = isCamera ? photoForProduct(p) : null;
    const detailShot = isCamera ? null : registerLensShot('detail-lens-' + p.id, p.design, { size: 'detail', width: 1400, height: 900 });
    const preview = isCamera
      ? `<div class="real-photo-stage">${photoImg(detailPhoto, 'is-detail', p.name)}${photoBadge(detailPhoto)}</div>`
      : `<img class="art-detail-img" data-art-shot="${attr(detailShot)}" alt="${attr(p.name)} 产品图">`;
    const ratingLabels = isCamera
      ? { image: '画质', focus: '对焦', stab: '防抖', video: '视频', battery: '续航', cooling: '散热', design: '外观', handling: '握持', screen: '屏幕', value: '性价比', brand: '品牌', qc: '品控' }
      : { optical: '光学', focus: '对焦', stabilization: '防抖', build: '做工', looks: '外观', portability: '便携', value: '性价比', cinema: '电影感' };
    const ratingKeys = Object.keys(p.ratings || {}).filter(k => ratingLabels[k]);
    const cat = isCamera ? categoryData(p.category) : null;
    const kit = isCamera ? E.getKitLens(game, p) : null;
    const margin = 1 - p.unitCost / Math.max(1, p.price);
    const salePrice = isCamera && kit ? p.price + kit.price * .55 * .8 : p.price;
    const chipInfo = isCamera && p.design ? (p.chipInfo || E.resolveDesignChips(p.design, game.company)) : null;
    const specsCamera = isCamera ? [
      ['画幅 / 像素', `${D.SENSOR_FORMATS[p.design.sensor.format].name} ${p.design.sensor.mp}MP`],
      ['传感器类型', D.SENSOR_TYPES[p.design.sensor.type].name],
      ['视频规格', `${p.design.video.res} ${p.design.video.fps}p`],
      ['视频编码', (p.design.video.codecs || []).map(c => D.CODECS[c]?.name).filter(Boolean).join(' / ') || '—'],
      ['对焦系统', D.AF_SYSTEMS[p.design.performance.afSystem]?.name || '—'],
      ['防抖', D.STABILIZATIONS[p.design.performance.stabilization]?.name || '—'],
      ['卡口', p.design.mount.type],
      ['存储', `${p.design.performance.cardSlots} × ${D.CARD_TYPES[p.design.performance.cardType]?.name || 'SD'}`],
      ['屏幕', p.design.screen.type === 'none' ? '无' : `${p.design.screen.size}" ${D.SCREEN_TYPES[p.design.screen.type].name}`],
      ['取景器', D.VIEWFINDER_TYPES[p.design.viewfinder.type].name],
      ['机身重量', `${Math.round(p.weight)} g`],
      ['机身尺寸', `${Math.round(p.design.body.width)} × ${Math.round(p.design.body.height)} × ${Math.round(p.design.body.depth)} mm`],
      ['电池估算', `${p.scores?.shots || '—'} 张 / ${p.scores?.effectiveRecordLimit || '—'} 分钟`],
      ['CMOS 方案', chipInfo && chipInfo.cmos ? `自研 · ${chipInfo.cmos.shortName || chipInfo.cmos.name}` : `外购 · ${E.getSensorSupplier(game.company).name}`],
      ['AF 芯片', chipInfo && chipInfo.af ? `自研 · ${chipInfo.af.shortName || chipInfo.af.name}` : '外购 AF 模组'],
      ['发布会', p.launchEvent ? p.launchEvent.label : '未记录'],
      ['媒体评分', p.launchEvent ? `${Math.round(p.launchEvent.pressScore || 0)} / 100` : '—'],
      ['认证', D.CERTIFICATIONS[p.certification || 'standard']?.name || '标准认证'],
      ['全天候密封', p.design.body.weatherSealed ? '支持' : '不支持']
    ] : [];
    const specsLens = isCamera ? [] : [
      ['焦距', Number(p.focalMin) === Number(p.focalMax) ? p.focalMin + 'mm' : p.focalMin + '-' + p.focalMax + 'mm'],
      ['最大光圈', 'F' + Number(p.maxAperture).toFixed(1)],
      ['镜片结构', `${p.design.optical.elements} 片 / ${p.design.optical.groups} 组`],
      ['特殊镜片', `非球面 ${p.design.optical.aspherical} · 低色散 ${p.design.optical.ed} · 萤石 ${p.design.optical.fluorite}`],
      ['镀膜', D.LENS_COATINGS[p.design.optical.coating]?.name || '—'],
      ['对焦马达', D.LENS_MOTORS[p.design.focus.motor]?.name || '—'],
      ['卡口 / 像场', `${p.mount.type} / ${D.SENSOR_FORMATS[p.coverage]?.name || ''}`],
      ['滤镜口径', p.design.filter + 'mm'],
      ['重量', p.weight + ' g'],
      ['尺寸', `${Math.round(p.design.body.length)} × ⌀${Math.round(p.design.body.diameter)} mm`],
      ['全天候', p.design.body.weatherSealed ? '支持' : '不支持'],
      ['防抖', p.design.stabilization ? `OIS ${p.design.stabilizationStops} EV` : '无']
    ];
    const specs = isCamera ? specsCamera : specsLens;
    const warnings = p.warnings || [];
    const kitOptions = isCamera ? activeLenses().filter(l => p.design.mount.type !== 'FIXED' && l.mount.type === p.design.mount.type) : [];
    const competitors = isCamera ? E.getCategoryBenchmark(game, p.category).slice(0, 5) : [];
    return modalShell({
      title: '产品档案',
      eyebrow: `${isCamera ? 'CAMERA' : 'LENS'} / ${p.status === 'active' ? 'IN PRODUCTION' : 'ARCHIVED'} · ${p.isSeed ? 'INHERITED' : 'ORIGINAL DESIGN'}`,
      sub: `${p.name} · 上市 ${p.ageMonths || 0} 个月 · ${p.isSeed ? '继承自原有产品线' : '由你的团队设计'} · 编号 ${String(p.id).slice(-8).toUpperCase()}`,
      size: 'xl',
      body: `<div class="product-detail-grid">
        <div>
          
          
          
          <div class="product-detail-stage is-photo ${isCamera ? 'is-real-photo' : ''}">${preview}</div>
          
          
          
          ${isCamera ? photoCreditHTML(detailPhoto) : ''}
          
          
          
          <div class="art-detail-actions">${isCamera ? `<button class="btn btn-xs btn-secondary" data-action="photo-export-product" data-id="${attr(p.id)}">${icon('download')} 下载实拍参考图</button><span class="art-render-meta">${detailPhoto && detailPhoto.crossBrand ? '跨品牌实拍外形参考' : '本机照片库 · 实拍'}</span>` : `<button class="btn btn-xs btn-secondary" data-action="art-export-product" data-id="${attr(p.id)}">${icon('download')} 导出 4K 构图示意</button><span class="art-render-meta">暂无实拍镜头图 · 3D 结构示意</span>`}</div>
          
          
          
          <div class="grid-2 mt-12">
          
          
          
            <div class="financial-mini"><label>上期销量</label><b>${(p.lastUnits || 0).toLocaleString('zh-CN')} ${isCamera ? '台' : '支'}</b></div>
          
          
          
            <div class="financial-mini"><label>当前库存</label><b>${(p.stock || 0).toLocaleString('zh-CN')} ${isCamera ? '台' : '支'}</b></div>
          
          
          
            <div class="financial-mini"><label>上期需求</label><b>${(p.lastDemand || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
            <div class="financial-mini"><label>需求预测</label><b>${(p.lastForecast || 0).toLocaleString('zh-CN')}</b></div>
          
          
          
            <div class="financial-mini"><label>单品成本</label><b>${moneyNumber(p.unitCost)}</b></div>
          
          
          
            <div class="financial-mini"><label>毛利空间</label><b>${pctNum(margin * 100)}</b></div>
          
          
          
          </div>
          
          
          
          ${p.salesHistory && p.salesHistory.length ? `<div class="panel mt-12" style="padding:11px"><div class="flex justify-between items-center"><span class="mini-label">近期销量</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--faint)">${p.salesHistory.slice(-6).map(s => s.label).join(' / ')}</span></div><div class="mt-8">${sparkline(p.salesHistory.slice(-8).map(s => s.units), { color: 'var(--accent)' })}</div></div>` : ''}
          
          
          
          <div class="detail-heading mt-16"><div><div class="detail-name">${esc(p.name)}</div><div class="detail-sub">${isCamera ? esc(cat.name) + ' · ' + esc(segmentData(p.targetSegment).name) : (D.LENS_TYPES[p.lensType]?.name || '镜头') + ' · ' + esc(p.mount.type) + ' 卡口'} · ${p.overall} / 100</div></div><div class="detail-price">${moneyNumber(salePrice)}<small>${kit ? '套机估算价' : '建议零售价'}</small></div></div>
          
          
          
          <div class="detail-spec-grid mt-16">${specs.map(([label, value]) => `<div class="detail-spec-row"><label>${esc(label)}</label><b>${esc(value)}</b></div>`).join('')}</div>
          
          
          
          ${warnings.length ? `<div class="warning-list mt-12">${warnings.slice(0, 5).map(w => `<div class="warning-item ${w.blocking ? 'is-blocking' : ''}">${esc(w.text)}</div>`).join('')}</div>` : ''}
        </div>
        <div>
          
          
          
          <div class="flex gap-8 items-center" style="flex-wrap:wrap"><span class="badge ${p.status === 'active' ? 'good' : ''}">${p.status === 'active' ? '在售' : '已停产'}</span><span class="badge ${scoreTone(p.overall) || 'accent'}">${p.premiumBadge?.label || qualityTier(p.overall).label}</span>${p.isSeed ? '<span class="badge accent">继承机型</span>' : '<span class="badge">自研机型</span>'}</div>
          
          
          
          <div class="modal-section mt-16">
          
          
          
            <div class="modal-section-title">用户评价 / USER RATINGS</div>
          
          
          
            <div class="rating-grid">
          
          
          
              ${ratingKeys.map(k => `<div class="rating-bar"><label>${ratingLabels[k]}<b>${(p.ratings[k] || 0).toFixed(1)}</b></label><div class="progress"><i style="width:${clamp((p.ratings[k] || 0) * 10, 0, 100)}%"></i></div></div>`).join('')}
          
          
          
            </div>
          
          
          
          </div>
          
          
          
          <div class="detail-procon">
          
          
          
            <div class="procon-box"><h5>优点 / PROS</h5><ul>${(p.pros || []).slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          
          
          
            <div class="procon-box cons"><h5>缺点 / CONS</h5><ul>${(p.cons || []).slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          
          
          
          </div>
          
          
          
          <div class="detail-edit-box mt-16">
          
          
          
            <div class="editprice-form">
          
          
          
              <div class="flex justify-between items-center"><span class="mini-label">调整零售价</span><span class="faint" style="font-size:8px">成本 ${moneyNumber(p.unitCost)}</span></div>
          
          
          
              <div class="detail-edit-row mt-8"><input class="text-input" type="number" min="99" step="100" id="product-price-input" value="${Math.round(p.price)}"><button class="btn btn-sm btn-primary" data-action="save-product-price" data-id="${attr(p.id)}">应用</button></div>
          
          
          
            </div>
          
          
          
            ${isCamera ? `<div class="divider" style="margin:12px 0"></div><div class="flex justify-between items-center"><span class="mini-label">套机镜头</span><span class="faint" style="font-size:8px">销售占比约 55%</span></div><div class="detail-edit-row mt-8"><select class="select-input" id="product-kit-select"><option value="">仅机身</option>${kitOptions.map(l => `<option value="${l.id}" ${p.kitLensId === l.id ? 'selected' : ''}>${esc(l.name)} · ${moneyNumber(l.price)}</option>`).join('')}</select><button class="btn btn-sm btn-secondary" data-action="save-kit-lens" data-id="${attr(p.id)}">应用</button></div>` : ''}
          
          
          
          </div>
          
          
          
          <div class="detail-actions">
          
          
          
            ${p.status === 'active' ? `<button class="btn btn-sm btn-secondary" data-action="nav" data-page="operations" data-close-modal="1">${icon('factory')} 生产与库存</button><button class="btn btn-sm btn-danger" data-action="discontinue-product" data-id="${attr(p.id)}">${icon('trash')} 停产</button>` : `<button class="btn btn-sm btn-secondary" data-action="relist-product" data-id="${attr(p.id)}">${icon('refresh')} 重新上架</button>`}
          
          
          
          </div>
          
          
          
          ${isCamera && competitors.length ? `<div class="modal-section mt-16"><div class="modal-section-title">同品类竞品</div><div class="data-table-wrap"><table class="data-table"><tbody>${competitors.map(c => `<tr><td class="name-cell">${esc(c.name)}</td><td><span class="brand-dot" style="background:${attr(c.color)}"></span>${esc(c.brand)}</td><td class="num">${moneyNumber(c.price)}</td><td class="num">${c.score}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
          
          
          
          <div class="callout mt-16"><div class="callout-title">${icon('info')} 产品生命周期</div>发布后价格和营销仍可调整。销量会随竞品、口碑和产品年龄变化，适时推出续代产品是相机公司的长期节奏。</div>
        </div>
      </div>`,
      foot: `<span class="foot-note">${isCamera ? '机身重量不含套机镜头。' : '镜头销量同时受卡口生态与第三方用户需求影响。'}</span><button class="btn btn-secondary" data-action="close-modal">关闭</button>`
    });
  }

  function modalReport(data) {
    const r = data.report || game.lastReport;
    if (!r) return modalShell({ title: '暂无月报', body: '<div class="callout">还没有完成任何月份结算。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    const camSales = r.cameraSales || [];
    const lensSales = r.lensSales || [];
    const achievements = r.achievements || [];
    const warnings = r.warnings || [];
    return modalShell({
      title: '月度经营简报',
      eyebrow: `MONTHLY REVIEW / ${E.monthLabel(r.monthIndex)}`,
      sub: `结算期 ${r.dateLabel} · 结算后时间 ${r.nextLabel} · 这份简报会在关闭后保留在财务记录中。`,
      size: 'xl',
      body: `
        <div class="report-hero">
          
          
          
          <div><div class="report-hero-title">NET PROFIT / 本期净利润</div><div class="report-hero-value ${r.netProfit < 0 ? 'is-negative' : ''}">${money(r.netProfit)}</div><div class="report-hero-meta">${r.netProfit >= 0 ? '经营利润为正。' : '本期经营出现亏损，请检查成本结构与销量。'} 现金变化 ${signedMoney(r.cashDelta)} · 期末现金 ${money(r.cashEnd)}</div></div>
          
          
          
          <div class="report-hero-side"><b>${(r.snapshot ? r.snapshot.playerShare : game.company.share || 0).toFixed(1)}%</b><span>全球销量份额</span><b style="margin-top:9px">${units(r.cameraUnits)}</b><span>本期相机销量</span></div>
        </div>
        <div class="report-kpis">
          
          
          
          <div class="report-kpi"><label>净营收</label><b>${money(r.revenueNet)}</b></div>
          
          
          
          <div class="report-kpi"><label>毛利率</label><b>${r.revenueNet > 0 ? ((r.grossProfit / r.revenueNet) * 100).toFixed(1) + '%' : '—'}</b></div>
          
          
          
          <div class="report-kpi"><label>相机 / 镜头</label><b>${r.cameraUnits.toLocaleString('zh-CN')} / ${r.lensUnits.toLocaleString('zh-CN')}</b></div>
          
          
          
          <div class="report-kpi"><label>品牌变化</label><b>认知 ${signed(r.brandAfter?.awareness - r.brandBefore?.awareness, 1)} / 口碑 ${signed(r.brandAfter?.reputation - r.brandBefore?.reputation, 1)}</b></div>
        </div>
        <div class="report-two-col mt-16">
          
          
          
          <div class="modal-section">
          
          
          
            <div class="modal-section-title">产品销量</div>
          
          
          
            <div class="report-product-list">
          
          
          
              <div class="report-product-row header"><span>产品</span><span class="num">销量</span><span class="num">需求</span><span class="num">净营收</span></div>
          
          
          
              ${camSales.length ? camSales.map(s => `<div class="report-product-row"><span class="report-product-name">${esc(s.name)}</span><span class="num">${s.units.toLocaleString('zh-CN')}</span><span class="num">${s.demand.toLocaleString('zh-CN')}</span><span class="num">${money(s.revenue)}</span></div>`).join('') : '<div class="empty-inline">本期无相机销售。</div>'}
          
          
          
              ${lensSales.length ? lensSales.map(s => `<div class="report-product-row"><span class="report-product-name" style="color:var(--faint)">${esc(s.name)} <span class="badge" style="font-size:6px">镜头</span></span><span class="num">${s.units.toLocaleString('zh-CN')}</span><span class="num">${s.demand.toLocaleString('zh-CN')}</span><span class="num">${money(s.revenue)}</span></div>`).join('') : ''}
          
          
          
            </div>
          
          
          
            ${r.stockouts?.length ? `<div class="callout warn mt-8"><div class="callout-title">${icon('alert')} 缺货损失</div>${r.stockouts.map(s => `${esc(s.name)} 损失约 ${s.lost} 件需求`).join('；')}</div>` : ''}
          
          
          
          </div>
          
          
          
          <div class="modal-section">
          
          
          
            <div class="modal-section-title">财务拆分</div>
          
          
          
            <table class="statement-table"><tr><td>净营收</td><td>${money(r.revenueNet)}</td></tr><tr><td>已售成本 COGS</td><td>-${money(r.cogs)}</td></tr><tr><td>员工薪资</td><td>-${money(r.payroll)}</td></tr><tr><td>固定运营与营销</td><td>-${money(r.overhead + r.marketing)}</td></tr><tr><td>制造 / 售后 / 利息</td><td>-${money(r.partnerFee + r.factoryUpkeep + r.warranty + r.interest)}</td></tr><tr><td>所得税</td><td>-${money(r.tax)}</td></tr><tr class="is-total"><td>净利润</td><td class="${r.netProfit < 0 ? 'bad' : ''}">${money(r.netProfit)}</td></tr></table>
          
          
          
            <div class="grid-2 mt-8"><span class="faint" style="font-size:8px">生产现金支出</span><span style="text-align:right;font-family:var(--font-mono);font-size:8px">${money(r.productionSpend)}</span><span class="faint" style="font-size:8px">库存价值</span><span style="text-align:right;font-family:var(--font-mono);font-size:8px">${money(r.inventoryValue)}</span></div>
          
          
          
          </div>
        </div>
        ${r.aiActions?.length ? `<div class="modal-section"><div class="modal-section-title">竞品动态</div>${r.aiActions.slice(0, 5).map(a => `<div class="report-event">${icon(a.type === 'launch' ? 'camera' : 'trend')}<div><b>${esc(a.text)}</b><span>${a.type === 'launch' ? '预计会改变该品类的竞争压力。' : '现有产品竞争力发生变化。'}</span></div></div>`).join('')}</div>` : ''}
        ${r.rnd?.length ? `<div class="modal-section"><div class="modal-section-title">研发进展</div>${r.rnd.map(p => `<div class="metric-row"><label>${esc(p.techName)} Lv.${p.targetLevel}</label><b>${Math.round(p.after)} / ${p.required} RP</b></div><div class="progress thin"><i style="width:${clamp(p.after / p.required * 100, 0, 100)}%"></i></div>`).join('')}${r.researchCompleted?.length ? `<div class="callout good mt-8"><div class="callout-title">${icon('checkcircle')} 研发完成</div>${r.researchCompleted.map(p => esc(p.techName) + ' 达到 Lv.' + p.level).join(' · ')}</div>` : ''}</div>` : ''}
        ${r.chipProgress?.length || r.chipCompleted?.length ? `<div class="modal-section"><div class="modal-section-title">芯片项目</div>${(r.chipProgress || []).map(p => `<div class="metric-row"><label>${esc(p.name)}</label><b>${Math.round(p.after)} / ${p.required} CP</b></div><div class="progress thin"><i style="width:${clamp(p.progress, 0, 100)}%"></i></div>`).join('')}${r.chipCompleted?.length ? `<div class="callout good mt-8"><div class="callout-title">${icon('cpu')} 芯片完成</div>${r.chipCompleted.map(p => esc(p.name)).join(' · ')} 已进入自有芯片库。</div>` : ''}</div>` : ''}
        ${r.events?.length ? `<div class="modal-section"><div class="modal-section-title">市场事件</div>${r.events.map(e => `<div class="report-event">${icon('zap')}<div><b>${esc(e.title)}</b><span>${esc(e.text)} · 持续 ${e.duration} 个月</span></div></div>`).join('')}</div>` : ''}
        ${achievements.length ? `<div class="modal-section"><div class="modal-section-title">里程碑达成</div>${achievements.map(a => `<div class="achievement-pop">${icon('star')}<div><b>${esc(a.name)}</b> · ${esc(a.desc)}</div></div>`).join('')}</div>` : ''}
        ${warnings.length ? `<div class="modal-section"><div class="callout bad"><div class="callout-title">${icon('alert')} 经营提醒</div>${warnings.map(w => esc(w)).join('<br>')}</div></div>` : ''}
        ${r.oneOffs?.length ? `<div class="modal-section"><div class="modal-section-title">本期已发生一次性投入</div><div class="data-table-wrap"><table class="data-table"><tbody>${r.oneOffs.map(o => `<tr><td class="name-cell">${esc(o.label)}</td><td class="num">${money(o.amount)}</td></tr>`).join('')}</tbody></table></div><div class="form-help">这些投入在发生当月已从现金扣除，不计入本期经营现金流。</div></div>` : ''}
      `,
      foot: `<span class="foot-note">下一个月：${r.nextLabel}。经营建议会随市场与口碑变化。</span><button class="btn btn-secondary" data-action="report-finance">${icon('wallet')} 查看财务</button><button class="btn btn-primary" data-action="close-modal">继续经营 ${icon('arrowRight')}</button>`
    });
  }

  function modalChipProgram(data) {
    const c = game.company;
    const kind = data.kind === 'af' ? 'af' : 'cmos';
    const state = (UI.chipDraft && UI.chipDraft[kind]) || {};
    let cfg;
    if (kind === 'cmos') {
      const target = D.CMOS_TARGETS[state.target] || D.CMOS_TARGETS.ff;
      cfg = {
        target: target.id,
        mp: target.mpOptions.includes(Number(state.mp)) ? Number(state.mp) : target.mpOptions[0],
        type: D.SENSOR_TYPES[state.type] ? state.type : (c.tech.sensor >= 4 ? 'stacked' : 'bsi'),
        budget: D.CMOS_BUDGETS[state.budget] ? state.budget : 'balanced'
      };
      if ((c.tech.sensor || 1) < (D.SENSOR_TYPES[cfg.type] || {}).tech) cfg.type = 'cmos';
      UI.chipDraft = UI.chipDraft || {};
      UI.chipDraft[kind] = cfg;
    } else {
      cfg = {
        arch: D.AF_ARCHITECTURES[state.arch] ? state.arch : 'fullpixel',
        tier: D.AF_TIERS[state.tier] ? state.tier : 'advanced',
        budget: D.CMOS_BUDGETS[state.budget] ? state.budget : 'balanced'
      };
      if ((c.tech.af || 1) < (D.AF_ARCHITECTURES[cfg.arch] || {}).tech) cfg.arch = 'phase';
      UI.chipDraft = UI.chipDraft || {};
      UI.chipDraft[kind] = cfg;
    }
    const estimate = E.chipProgramEstimate(c, kind, cfg);
    const active = (c.chipPrograms || []).length;
    const slots = E.chipSlots(c);
    const can = estimate.ok && c.cash >= estimate.cost && active < slots;
    const target = kind === 'cmos' ? D.CMOS_TARGETS[cfg.target] : null;
    const choice = (label, sub, active, path, value, meta, locked) =>
      `<button class="option-card ${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}" data-action="chip-config" data-kind="${kind}" data-path="${path}" data-value="${attr(value)}" ${locked ? 'disabled' : ''}>
        <div class="option-card-name">${esc(label)}</div>
        <div class="option-card-meta">${esc(sub)}</div>
        ${meta ? `<div class="option-card-meta">${meta}</div>` : ''}
      </button>`;
    const cmosBody = `
      <div class="modal-section-title">画幅目标</div>
      <div class="option-grid cols-3">${Object.values(D.CMOS_TARGETS).map(t => choice(t.name, t.desc, cfg.target === t.id, 'target', t.id, `<span>传感器 Lv.${t.tech}</span><span>${moneyNumber(t.baseCost)} 起</span>`, (c.tech.sensor || 1) < t.tech)).join('')}</div>
      <div class="modal-section-title mt-16">目标像素</div>
      <div class="filter-chips">${target.mpOptions.map(mp => `<button class="filter-chip ${cfg.mp === mp ? 'is-active' : ''}" data-action="chip-config" data-kind="${kind}" data-path="mp" data-value="${mp}">${mp}MP</button>`).join('')}</div>
      <div class="modal-section-title mt-16">传感器结构</div>
      <div class="option-grid cols-2">${Object.values(D.SENSOR_TYPES).map(t => choice(t.name, t.desc, cfg.type === t.id, 'type', t.id, `<span>质量 +${t.quality}</span><span>成本 ×${t.cost}</span>`, (c.tech.sensor || 1) < t.tech)).join('')}</div>
      <div class="modal-section-title mt-16">研发预算</div>
      <div class="option-grid cols-3">${Object.values(D.CMOS_BUDGETS).map(b => choice(b.name, b.desc, cfg.budget === b.id, 'budget', b.id, `<span>成本 ×${b.costMult}</span><span>质量 ${b.quality >= 0 ? '+' : ''}${b.quality}</span><span>缺陷 ×${b.defect}</span>`)).join('')}</div>
    `;
    const afBody = `
      <div class="modal-section-title">芯片架构</div>
      <div class="option-grid cols-3">${Object.values(D.AF_ARCHITECTURES).map(a => choice(a.name, a.desc, cfg.arch === a.id, 'arch', a.id, `<span>对焦 Lv.${a.tech}</span><span>加成 +${a.bonus}</span>`, (c.tech.af || 1) < a.tech)).join('')}</div>
      <div class="modal-section-title mt-16">性能等级</div>
      <div class="option-grid cols-3">${Object.values(D.AF_TIERS).map(t => choice(t.name, t.desc, cfg.tier === t.id, 'tier', t.id, `<span>成本 ×${t.costMult}</span><span>${t.bonus >= 0 ? '+' : ''}${t.bonus} 加成</span>`)).join('')}</div>
      <div class="modal-section-title mt-16">研发预算</div>
      <div class="option-grid cols-3">${Object.values(D.CMOS_BUDGETS).map(b => choice(b.name, b.desc, cfg.budget === b.id, 'budget', b.id, `<span>成本 ×${b.costMult}</span><span>质量 ${b.quality >= 0 ? '+' : ''}${b.quality}</span>`)).join('')}</div>
    `;
    return modalShell({
      title: kind === 'cmos' ? '立项自研 CMOS' : '立项自研对焦芯片',
      eyebrow: 'CHIP PROGRAM / 芯片立项',
      sub: kind === 'cmos' ? '选择画幅、像素、结构与预算。项目开始后按月推进，完成后进入自有芯片库。' : '选择架构、性能等级与预算。自研 AF 芯片会给相机带来额外对焦加成，并降低模组成本。',
      size: 'xl',
      body: `<div class="chip-modal-grid">
        <div>${kind === 'cmos' ? cmosBody : afBody}</div>
        <aside class="chip-estimate">
          <div class="eyebrow">PROGRAM ESTIMATE</div>
          <div class="chip-estimate-title">${esc(estimate.ok ? estimate.name : '当前配置不可行')}</div>
          ${estimate.ok ? `
            <div class="chip-estimate-rows">
              <div><label>前期投入</label><b>${money(estimate.cost)}</b></div>
              <div><label>预计周期</label><b>${estimate.months} 个月</b></div>
              <div><label>研发点数</label><b>${estimate.points} CP</b></div>
              ${kind === 'cmos' ? `
                <div><label>单位成本系数</label><b>×${estimate.costFactor.toFixed(2)}</b></div>
                <div><label>画质加成</label><b>+${estimate.quality}</b></div>
                <div><label>缺陷系数</label><b>×${estimate.defect.toFixed(2)}</b></div>
              ` : `
                <div><label>对焦加成</label><b>+${estimate.bonus}</b></div>
                <div><label>模组成本变化</label><b>${estimate.costDelta}</b></div>
              `}
              <div><label>实验室槽位</label><b>${active}/${slots}</b></div>
            </div>
            <div class="callout ${can ? 'accent' : 'bad'} mt-12"><div class="callout-title">${icon(can ? 'info' : 'alert')} ${can ? '可以立项' : active >= slots ? '实验室槽位已满' : '现金不足'}</div>${can ? `立项后立即扣除 ${money(estimate.cost)} 研发预算，项目按月推进。` : active >= slots ? '先完成或中止一个项目，或升级实验室。' : `当前现金 ${money(c.cash)}，还需要 ${money(estimate.cost - c.cash)}。`}</div>
          ` : `<div class="callout bad"><div class="callout-title">${icon('alert')} 无法立项</div>${esc(estimate.error || '当前配置不满足条件。')}</div>`}
        </aside>
      </div>`,
      foot: `<span class="foot-note">芯片项目与 13 条技术树分开推进，不占用实验室的 3 个技术项目槽位。</span><button class="btn btn-secondary" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="start-chip-program" data-kind="${kind}" ${can ? '' : 'disabled'}>${icon('cpu')} 确认立项</button>`
    });
  }

  function modalLaunchEvent(data) {
    const kind = data.kind === 'lens' ? 'lens' : 'camera';
    const draft = kind === 'camera' ? game.drafts.camera : game.drafts.lens;
    if (!draft) return modalShell({ title: '没有可发布的草稿', body: '<div class="callout bad">请先完成一台相机或一支镜头的设计。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    E.normalizeLaunchEvent(draft, game.company);
    let ev, preview, photo;
    try {
      if (kind === 'camera') {
        ev = E.evaluateCamera(draft, game.company);
        preview = E.previewCameraLaunch(game, draft);
        photo = photoImg(photoForDesign(draft), 'is-detail', draft.name);
      } else {
        ev = E.evaluateLens(draft, game.company);
        preview = E.previewLensLaunch(game, draft);
        photo = shotImg(registerLensShot('planner-lens-' + draft.id, draft, { size: 'card', width: 640, height: 420 }), '', draft.name);
      }
    } catch (e) {
      return modalShell({ title: '发布会策划', body: '<div class="callout bad">无法读取当前设计。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    }
    const plan = draft.launchEvent;
    const event = preview.event;
    const can = !ev.blocking.length && game.company.cash >= preview.totalLaunch;
    const choice = (label, sub, active, path, value, meta, disabled) =>
      `<button class="option-card ${active ? 'is-active' : ''} ${disabled ? 'is-locked' : ''}" data-action="event-set" data-kind="${kind}" data-path="${path}" data-value="${attr(value)}" ${disabled ? 'disabled' : ''}>
        <div class="option-card-name">${esc(label)}</div>
        <div class="option-card-meta">${esc(sub)}</div>
        ${meta ? `<div class="option-card-meta">${meta}</div>` : ''}
      </button>`;
    const scale = Object.values(D.CAMPAIGN_TIERS).map(t => choice(t.name, t.desc, draft.campaign === t.id, 'campaign', t.id, `<span>${t.cost ? moneyNumber(t.cost) : '免费'}</span><span>声量 ${t.hype}</span>`)).join('');
    const formats = Object.values(D.LAUNCH_FORMATS).map(f => choice(f.name, f.desc, plan.format === f.id, 'format', f.id, `<span>成本 ×${f.cost}</span><span>触达 ×${f.reach}</span>`)).join('');
    const cities = Object.values(D.LAUNCH_CITIES).map(ct => choice(ct.name, ct.desc, plan.city === ct.id, 'city', ct.id, `<span>成本 ×${ct.cost}</span><span>${ct.home ? '主场 ' + ct.home : '区域触达'}</span>`)).join('');
    const press = Object.values(D.PRESS_TIERS).map(p => choice(p.name, p.desc, plan.press === p.id, 'press', p.id, `<span>${p.cost ? moneyNumber(p.cost) : '免费'}</span><span>评分 +${p.score}</span>`)).join('');
    const kols = Object.values(D.KOL_TIERS).map(k => choice(k.name, k.desc, plan.kol === k.id, 'kol', k.id, `<span>${k.cost ? moneyNumber(k.cost) : '免费'}</span><span>声量 +${Math.round(k.hype * 100)}%</span>`)).join('');
    const focus = Object.values(D.EVENT_FOCUS).map(f => choice(f.name, f.desc, plan.focus === f.id, 'focus', f.id, `<span>产品得分 ${Math.round(E.launchFocusScore(ev, kind, f.id))}</span>`)).join('');
    return modalShell({
      title: '发布会策划',
      eyebrow: `LAUNCH PLANNER / ${kind === 'camera' ? 'CAMERA' : 'LENS'}`,
      sub: '把发布规模、形式、城市、媒体、创作者和演示重点组合成一场事件。右侧是实时估算，确认后会写进上市方案。',
      size: 'xl',
      body: `<div class="launch-planner">
        <div class="launch-planner-main">
          <div class="launch-product-row">
            <div class="launch-product-visual">${photo}</div>
            <div><div class="eyebrow">${kind === 'camera' ? 'NEW CAMERA' : 'NEW LENS'} · ${esc(E.monthLabel(game.monthIndex))}</div><div class="launch-product-name">${esc(draft.name || '未命名产品')}</div><div class="launch-product-sub">${kind === 'camera' ? esc(categoryData(draft.category).name) : esc(D.LENS_TYPES[draft.lensType]?.name || '镜头')} · ${ev.overall} / 100 预测口碑 · 芯片：${kind === 'camera' && ev.chips && ev.chips.cmosSource === 'inhouse' ? '自研 CMOS' : '外购 CMOS'} / ${kind === 'camera' && ev.chips && ev.chips.afSource === 'inhouse' ? '自研 AF' : '外购 AF'}</div></div>
          </div>
          <div class="modal-section-title">发布规模</div>
          <div class="option-grid cols-5">${scale}</div>
          <div class="modal-section-title mt-16">发布会形式</div>
          <div class="option-grid cols-4">${formats}</div>
          <div class="modal-section-title mt-16">城市 / 现场</div>
          <div class="option-grid cols-5">${cities}</div>
          <div class="modal-section-title mt-16">媒体邀请</div>
          <div class="option-grid cols-4">${press}</div>
          <div class="modal-section-title mt-16">创作者 / KOL</div>
          <div class="option-grid cols-4">${kols}</div>
          <div class="modal-section-title mt-16">演示重点</div>
          <div class="option-grid cols-5">${focus}</div>
          <div class="toggle-setting mt-16"><div class="toggle-setting-info"><b>开放预购</b><span>支付定金锁定首批用户，发布会当天开始收单；预购计入首月需求。</span></div><button class="toggle ${plan.preorder ? 'is-on' : ''}" data-action="event-preorder" data-kind="${kind}"></button></div>
        </div>
        <aside class="launch-estimate">
          <div class="eyebrow">LIVE ESTIMATE</div>
          <div class="launch-estimate-title">${esc(event.label || '静默上市')}</div>
          <div class="launch-estimate-rows">
            <div><label>发布会成本</label><b>${event.cost ? money(event.cost) : '—'}</b></div>
            <div><label>预计声量</label><b>${Math.round(event.hype)}</b></div>
            <div><label>媒体触达</label><b>${event.reach ? (event.reach / 10000).toFixed(1) + ' 万' : '—'}</b></div>
            <div><label>媒体评分</label><b>${Math.round(event.pressScore)} / 100</b></div>
            <div><label>预购转化</label><b>${Math.round(event.preorderRate * 100)}%${preview.preorderUnits ? ' · ' + units(preview.preorderUnits) : ''}</b></div>
            <div><label>演示匹配度</label><b>${Math.round(event.focusMatch * 100)}%</b></div>
            <div><label>首月预计需求</label><b>${units(preview.demand.units)}</b></div>
          </div>
          <div class="launch-roi">
            <div><span>上市总投入</span><b>${money(preview.totalLaunch)}</b></div>
            <div><span>发布会占投入</span><b>${preview.totalLaunch ? Math.round(event.cost / preview.totalLaunch * 100) : 0}%</b></div>
          </div>
          ${event.chipStory ? `<div class="callout accent mt-12"><div class="callout-title">${icon('cpu')} 芯片叙事加成</div>自研芯片会成为媒体关注点，声量与媒体评分已经计入。</div>` : ''}
          ${event.home ? `<div class="callout mt-12"><div class="callout-title">${icon('globe')} 主场优势</div>${esc(event.city.name)} 是品牌的母国/区域市场，媒体与渠道触达获得加成。</div>` : ''}
          ${ev.blocking.length ? `<div class="callout bad mt-12">${icon('alert')} 产品仍有阻塞问题，发布会只能先保存方案。</div>` : ''}
          ${game.company.cash < preview.totalLaunch ? `<div class="callout bad mt-12">${icon('alert')} 现金不足，暂时无法完成上市。</div>` : ''}
        </aside>
      </div>`,
      foot: `<span class="foot-note">发布会方案会保存到当前草稿；上市评审时会计入总支出。</span><button class="btn btn-secondary" data-action="close-modal">取消</button><button class="btn btn-secondary" data-action="event-confirm" data-kind="${kind}">${icon('check')} 确认方案</button><button class="btn btn-primary" data-action="event-confirm-launch" data-kind="${kind}" ${can ? '' : 'disabled'}>${icon('arrowUpRight')} 确认并进入上市评审</button>`
    });
  }

  function modalLaunchReport(data) {
    const report = (game.launchEvents || []).find(e => e.id === data.id);
    if (!report) return modalShell({ title: '发布会报告不存在', body: '<div class="callout bad">找不到这场发布会的记录。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    const p = [...(game.products || []), ...(game.lenses || [])].find(x => x.id === report.productId);
    const isCamera = report.kind === 'camera';
    const photo = p
      ? (isCamera ? photoImg(photoForProduct(p), 'is-detail', p.name) : shotImg(registerLensShot('report-lens-' + p.id, p.design, { size: 'detail', width: 1200, height: 760 }), '', p.name))
      : '';
    const quote = report.pressScore >= 88
      ? '“这是一场准备充分的发布，产品与叙事都站得住。”'
      : report.pressScore >= 75
        ? '“核心规格有竞争力，现场体验比预期更完整。”'
        : report.pressScore >= 62
          ? '“产品有亮点，但发布节奏与信息密度仍有提升空间。”'
          : '“现场声量有限，产品需要更清晰的理由。”';
    return modalShell({
      title: '发布会报告',
      eyebrow: 'LAUNCH REPORT / 媒体与预购',
      sub: `${esc(report.monthLabel || '')} · ${esc(report.productName)} · ${esc(report.label || '')}`,
      size: 'wide',
      body: `<div class="event-report">
        <div class="event-report-visual">${photo}</div>
        <div class="event-report-main">
          <div class="eyebrow">${esc(report.scaleName || '')} / ${esc(report.plan && D.EVENT_FOCUS[report.plan.focus] ? D.EVENT_FOCUS[report.plan.focus].name : '')}</div>
          <h3>${esc(report.productName)}</h3>
          <p class="event-report-quote">${esc(quote)}</p>
          <div class="event-report-metrics">
            <div><label>媒体评分</label><b>${Math.round(report.pressScore || 0)}</b></div>
            <div><label>预计触达</label><b>${report.reach ? (report.reach / 10000).toFixed(1) + '万' : '—'}</b></div>
            <div><label>预购</label><b>${report.preorders ? units(report.preorders) : '—'}</b></div>
            <div><label>发布会成本</label><b>${report.cost ? money(report.cost) : '—'}</b></div>
            <div><label>声量</label><b>${Math.round(report.hype || 0)}</b></div>
            <div><label>演示匹配</label><b>${Math.round((report.focusMatch || 0) * 100)}%</b></div>
          </div>
          <div class="event-report-plan"><b>方案：</b>${esc(report.label || '')}${report.plan ? ` · 媒体 ${esc((D.PRESS_TIERS[report.plan.press] || {}).name || '—')} · 创作者 ${esc((D.KOL_TIERS[report.plan.kol] || {}).name || '—')} · ${report.plan.preorder ? '开放预购' : '不开放预购'}` : ''}</div>
          ${report.chipStory ? `<div class="callout accent mt-12"><div class="callout-title">${icon('cpu')} 自研芯片成为叙事的一部分</div>媒体在报道中提到了自研芯片，对品牌技术形象有额外帮助。</div>` : ''}
          <div class="flex gap-8 mt-16"><button class="btn btn-sm btn-secondary" data-action="launch-success-products">${icon('camera')} 查看产品线</button><button class="btn btn-sm btn-primary" data-action="close-modal">继续经营</button></div>
        </div>
      </div>`
    });
  }


  function modalLaunchConfirm(data) {
    const kind = data.kind;
    const draft = kind === 'camera' ? game.drafts.camera : game.drafts.lens;
    if (!draft) return modalShell({ title: '设计草稿丢失', body: '<div class="callout bad">找不到可上市的设计草稿。</div>', foot: `<button class="btn" data-action="close-modal">关闭</button>` });
    let ev, launch, preview, name, categoryName;
    if (kind === 'camera') {
      ev = E.evaluateCamera(draft, game.company, { kitLens: getCameraKitLens(draft) });
      launch = E.previewCameraLaunch(game, draft);
      preview = `<div class="real-photo-stage">${photoImg(photoForDesign(draft), 'is-detail', draft.name)}</div>`;
      name = draft.name; categoryName = categoryData(draft.category).name;
    } else {
      ev = E.evaluateLens(draft, game.company);
      launch = E.previewLensLaunch(game, draft);
      preview = shotImg(registerLensShot('confirm-lens', draft, { size: 'detail', width: 1200, height: 760 }), '', draft.name);
      name = draft.name; categoryName = D.LENS_TYPES[draft.lensType]?.name || '镜头';
    }
    const cannot = ev.blocking.length || game.company.cash < launch.totalLaunch || !name.trim();
    return modalShell({
      title: '上市评审与发布会',
      eyebrow: `LAUNCH REVIEW / ${kind === 'camera' ? 'CAMERA' : 'LENS'}`,
      sub: '确认它将带着怎样的设计、规格、芯片和发布会进入市场。上市后第一批库存、发布会与营销预算会立即扣除。',
      size: 'wide',
      body: `<div class="product-detail-grid">
        <div class="product-detail-stage" style="min-height:280px">${preview}</div>
        <div>
          
          
          
          <div class="eyebrow">${kind === 'camera' ? 'NEW CAMERA' : 'NEW LENS'}</div>
          
          
          
          <div class="detail-name" style="margin-top:7px">${esc(name || '未命名产品')}</div>
          
          
          
          <div class="detail-sub">${esc(categoryName)} · ${kind === 'camera' ? esc(segmentData(draft.targetSegment).name) : esc(draft.mount.type) + ' 卡口'} · ${ev.overall} / 100 预测口碑 · ${ev.premiumBadge.label}</div>
          
          
          
          <div class="launch-box mt-16">
          
          
          
            <div class="launch-box-title">${icon('receipt')} 上市支出</div>
          
          
          
            <div class="launch-box-grid">
          
          
          
              <div><label>工装与试产</label><b>${moneyNumber(launch.tooling)}</b></div>
          
          
          
              <div><label>首批库存 × ${launch.initialStock}</label><b>${moneyNumber(launch.initialStock * ev.unitCost)}</b></div>
          
          
          
              <div><label>${kind === 'camera' ? esc(launch.cert.name) : '上市营销'}</label><b>${moneyNumber(kind === 'camera' ? launch.certCost : launch.campaignCost)}</b></div>
          
          
          
              <div><label>发布会 · ${esc((launch.event && launch.event.label) || '静默上市')}</label><b>${moneyNumber(launch.campaignCost)}</b></div>
          
          
          
              <div><label>合计</label><b style="color:var(--accent-bright)">${moneyNumber(launch.totalLaunch)}</b></div>
          
          
          
            </div>
          
          
          
            <div class="launch-note">上市后现金 ${money(game.company.cash - launch.totalLaunch)} · 预计首月需求 ${units(launch.demand.units)} · 单件成本 ${moneyNumber(ev.unitCost)}</div>
          ${launch.event ? `<div class="launch-event-summary">
            <div class="launch-event-summary-top"><span class="eyebrow">LAUNCH EVENT</span><span class="badge ${launch.event.hype >= 60 ? 'accent' : ''}">${esc(launch.event.label)}</span></div>
            <div class="launch-event-summary-grid"><span>声量 <b>${Math.round(launch.event.hype)}</b></span><span>媒体评分 <b>${Math.round(launch.event.pressScore)}</b></span><span>触达 <b>${launch.event.reach ? (launch.event.reach / 10000).toFixed(1) + '万' : '—'}</b></span><span>预购 <b>${launch.preorderUnits ? units(launch.preorderUnits) : '—'}</b></span></div>
            <button class="link-btn" data-action="open-launch-planner" data-kind="${kind}">调整发布会方案 →</button>
          </div>` : ''}
          
          
          
          </div>
          
          
          
          ${ev.blocking.length ? `<div class="callout bad mt-12">${ev.blocking.map(w => esc(w.text)).join('<br>')}</div>` : ''}
          
          
          
          ${game.company.cash < launch.totalLaunch ? '<div class="callout bad mt-12">现金不足，暂时无法上市。请先调整备货、营销，或申请贷款。</div>' : ''}
          
          
          
          <div class="callout mt-12"><div class="callout-title">${icon('info')} 上市后</div>产品会在下个月开始销售。你可以继续调整售价与生产计划，但外形和核心规格将被冻结为这一代产品。</div>
        </div>
      </div>`,
      foot: `<span class="foot-note">${cannot ? '当前仍有阻塞问题或资金不足。' : '确认后将扣款并开始生产。'}</span><button class="btn btn-ghost" data-action="open-launch-planner" data-kind="${kind}">${icon('megaphone')} 调整发布会</button><button class="btn btn-secondary" data-action="close-modal">返回调整</button><button class="btn btn-primary" data-action="${kind === 'camera' ? 'confirm-launch-camera' : 'confirm-launch-lens'}" ${cannot ? 'disabled' : ''}>${icon('arrowUpRight')} 确认上市</button>`
    });
  }

  function modalLaunchSuccess(data) {
    const p = data.product;
    const isCamera = data.kind === 'camera';
    const preview = isCamera
      ? photoImg(photoForProduct(p), 'is-detail', p.name)
      : shotImg(registerLensShot('success-lens-' + p.id, p.design, { size: 'detail', width: 1200, height: 760 }), '', p.name);
    return modalShell({
      title: '上市完成',
      eyebrow: 'LAUNCH COMPLETE / 上市成功',
      sub: '它已经进入产品线。下个月推进时，第一批用户评价与订单会回来。',
      size: 'wide',
      body: `<div class="launch-success-hero">
        <div class="launch-success-stage">${preview}</div>
        <div class="launch-success-content">
          
          
          
          <div class="eyebrow">${isCamera ? 'CAMERA' : 'LENS'} / ${esc(E.monthLabel(game.monthIndex))}</div>
          
          
          
          <h3>${esc(p.name)}</h3>
          
          
          
          <p>${isCamera ? esc(categoryData(p.category).name) : esc(D.LENS_TYPES[p.lensType]?.name || '镜头')} · ${isCamera ? `${p.design.sensor.mp}MP ${D.SENSOR_FORMATS[p.design.sensor.format].name}` : `${p.focalMin}${p.focalMax !== p.focalMin ? '-' + p.focalMax : ''}mm F${p.maxAperture}`} · 建议零售 ${moneyNumber(p.price)}</p>
          
          
          
          <div class="launch-metrics">
          
          
          
            <div class="launch-metric"><label>预测口碑</label><b>${p.overall} / 100</b></div>
          
          
          
            <div class="launch-metric"><label>上市投入</label><b>${money(data.launchCost)}</b></div>
          
          
          
            <div class="launch-metric"><label>首批库存</label><b>${(p.stock || 0).toLocaleString('zh-CN')} 件</b></div>
          
          
          
            <div class="launch-metric"><label>预计首月需求</label><b>${units(data.expected)}</b></div>
          
          
          
          </div>
          
          
          
          ${data.achieved && data.achieved.length ? `<div class="callout good mt-12"><div class="callout-title">${icon('star')} 里程碑达成</div>${data.achieved.map(a => esc(a.name)).join(' · ')}</div>` : ''}
          
          
          
          ${p.launchEvent ? `<div class="launch-event-summary mt-12">
            <div class="launch-event-summary-top"><span class="eyebrow">LAUNCH REPORT</span><span class="badge accent">${esc(p.launchEvent.label)}</span></div>
            <div class="launch-event-summary-grid"><span>媒体评分 <b>${Math.round(p.launchEvent.pressScore || 0)}</b></span><span>触达 <b>${p.launchEvent.reach ? (p.launchEvent.reach / 10000).toFixed(1) + '万' : '—'}</b></span><span>预购 <b>${p.launchEvent.preorders ? units(p.launchEvent.preorders) : '—'}</b></span><span>声量 <b>${Math.round(p.launchEvent.hype || 0)}</b></span></div>
            <button class="link-btn" data-action="open-launch-report" data-id="${attr(p.launchEvent.id)}">查看完整发布会报告 →</button>
          </div>` : ''}
          <div class="flex gap-8 mt-16"><button class="btn btn-sm btn-secondary" data-action="launch-success-products">${icon('camera')} 查看产品线</button>${p.launchEvent ? `<button class="btn btn-sm btn-secondary" data-action="open-launch-report" data-id="${attr(p.launchEvent.id)}">${icon('megaphone')} 发布会报告</button>` : ''}<button class="btn btn-sm btn-primary" data-action="close-modal">继续经营</button></div>
        </div>
      </div>`
    });
  }

  function modalWelcome() {
    const isTakeover = game.mode === 'takeover';
    return modalShell({
      title: isTakeover ? '现在，这家公司是你的了。' : '欢迎来到影像行业。',
      eyebrow: isTakeover ? 'TAKEOVER COMPLETE / 接管完成' : 'FOUNDER MODE / 从零开始',
      sub: isTakeover ? '你继承的不只是品牌和产品线，还有用户期待。' : '没有产品、没有渠道、没有品牌资产。但你有定义下一台相机的自由。',
      size: 'wide',
      body: `<div class="welcome-steps">
        <div class="welcome-step"><span class="welcome-step-num">01</span><div><b>${isTakeover ? '先看清你继承的产品和品牌' : '先设计第一台相机'}</b><p>${isTakeover ? '产品中心里有公司现有的相机与镜头产品线，它们已经产生销量。你可以调价、停产或推出新一代。' : '选择一个产品线与目标用户，然后从机身外形、材质、颜色开始，逐步定义一台真正的相机。'}</p></div></div>
        <div class="welcome-step"><span class="welcome-step-num">02</span><div><b>参数是能力，外形是吸引力</b><p>设计工作台会实时渲染相机并给出颜值、复古、专业、便携、握持和目标用户匹配等评价，不只计算成本。</p></div></div>
        <div class="welcome-step"><span class="welcome-step-num">03</span><div><b>把产品带进市场</b><p>定价、备货、品控和上市营销会影响首月销量与口碑。推进月份查看销量、现金流、竞品和用户评价。</p></div></div>
        <div class="welcome-step"><span class="welcome-step-num">04</span><div><b>建立长期技术与芯片壁垒</b><p>研发中心有 13 条技术树；芯片实验室可以自研 CMOS 与 AF 芯片，把成本和性能握在自己手里。</p></div></div>
      </div>
      <div class="callout accent mt-16"><div class="callout-title">${icon('info')} 不必一次完成所有事</div>这是沙盒，不是考试。你可以先做一台平价相机，也可以直接冲击全画幅旗舰。游戏会自动保存，随时可以回来继续设计。</div>`,
      foot: `<span class="foot-note">FRAME · CAMERA COMPANY SIMULATOR / 2026</span><button class="btn btn-secondary" data-action="close-modal">先看公司总览</button><button class="btn btn-primary" data-action="welcome-design">${isTakeover ? '设计你的新一代相机' : '开始设计第一台相机'} ${icon('arrowRight')}</button>`
    });
  }

  function renderNewsDrawer() {
    const news = game.news || [];
    return `<div class="modal-backdrop" data-action="modal-backdrop" style="align-items:stretch;justify-content:flex-end;padding:0">
      <aside class="side-drawer" role="dialog" aria-label="行业动态">
        <div class="drawer-head">
          
          
          
          <div><div class="eyebrow">SIGNAL / 行业动态</div><div class="modal-title" style="font-size:19px;margin-top:5px">市场正在发生什么</div><div class="modal-sub">${news.length} 条新闻 · ${E.monthLabel(game.monthIndex)}</div></div>
          
          
          
          <button class="modal-close" data-action="close-modal" aria-label="关闭">${icon('close')}</button>
        </div>
        <div class="drawer-body">
          
          
          
          ${news.length ? news.map(n => `<div class="drawer-news"><div class="drawer-news-meta"><span style="color:var(--accent);letter-spacing:.05em">${esc(n.tag)}</span><span>${esc(n.date)}</span></div><h4>${esc(n.title)}</h4><p>${esc(n.text)}</p></div>`).join('') : '<div class="empty-inline">暂无动态。推进月份后会出现竞品与市场新闻。</div>'}
        </div>
      </aside>
    </div>`;
  }

  function qualityTier(score) {
    if (score >= 92) return { label: '传奇' };
    if (score >= 85) return { label: '旗舰' };
    if (score >= 76) return { label: '优秀' };
    if (score >= 65) return { label: '均衡' };
    if (score >= 52) return { label: '争议' };
    return { label: '失败' };
  }

  // ---------- core interaction utilities ----------
  function currentStudioScope(el) {
    if (el && el.dataset && el.dataset.scope) return el.dataset.scope;
    return UI.page === 'studio-lens' ? 'lens' : 'camera';
  }
  function objectForScope(scope) {
    if (!game) return null;
    if (scope === 'lens') return game.drafts.lens;
    if (scope === 'camera') return game.drafts.camera;
    if (scope === 'company') return game.company;
    return null;
  }
  function setDeepValue(obj, path, value) {
    if (!obj) return false;
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    return true;
  }
  function parseDataValue(value, type) {
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true';
    return value;
  }
  function activeStepScoreCamera(ev, step) {
    return step === 8 ? ev.overall : step === 1 ? ev.traits.looks : step === 2 ? ev.traits.handling : step === 3 ? ev.traits.looks : step === 4 ? ev.traits.handling : step === 5 ? ev.traits.pro : step === 6 ? ev.scores.image : ev.scores.video;
  }
  function activeStepScoreLens(ev, step) {
    return step === 1 ? ev.optical : step === 2 ? ev.looks : ev.overall;
  }

  function updateRangeVisual(input) {
    if (!input || input.type !== 'range') return;
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const pct = clamp((Number(input.value) - min) / Math.max(1, max - min) * 100, 0, 100);
    input.style.setProperty('--pct', pct + '%');
  }

  function syncPathInputs(path, value, source) {
    document.querySelectorAll('[data-path]').forEach(input => {
      if (input === source) return;
      if (input.dataset.path !== path) return;
      if (input.type === 'range' || input.type === 'number' || input.type === 'text') {
        if (value !== '' && String(input.value) !== String(value)) input.value = value;
        updateRangeVisual(input);
      }
    });
    document.querySelectorAll('[data-range-output]').forEach(out => {
      if (out.dataset.rangeOutput === path) out.textContent = typeof value === 'number' ? Math.round(value * 10) / 10 : value;
    });
    document.querySelectorAll('[data-range-pair]').forEach(inp => {
      if (inp.dataset.rangePair === path) {
        const pct = clamp((Number(inp.value) - Number(inp.min)) / Math.max(1, Number(inp.max) - Number(inp.min)) * 100, 0, 100);
        inp.style.setProperty('--pct', pct + '%');
      }
    });
  }

  let liveRaf = 0;
  function scheduleStudioLive(scope) {
    if (liveRaf) cancelAnimationFrame(liveRaf);
    liveRaf = requestAnimationFrame(() => {
      liveRaf = 0;
      refreshStudioLive(scope);
    });
  }

  function refreshStudioLive(scope) {
    if (!game) return;
    if (scope === 'camera' && UI.page === 'studio-camera' && game.drafts.camera) {
      const draft = game.drafts.camera;
      let ev;
      try { ev = E.evaluateCamera(draft, game.company, { kitLens: getCameraKitLens(draft) }); } catch (e) { return; }
      const side = document.querySelector('.js-studio-side');
      if (side) {
        const oldCanvas = side.querySelector('canvas[data-art-live]');
        side.innerHTML = renderCameraEvalPanel(ev, draft);
        const newCanvas = side.querySelector('canvas[data-art-live]');
        if (oldCanvas && newCanvas) newCanvas.replaceWith(oldCanvas);
        paintArtCanvases(side, true);
      }
      const score = document.querySelector('.js-step-score');
      if (score) score.textContent = Math.round(activeStepScoreCamera(ev, UI.studioStep));
    } else if (scope === 'lens' && UI.page === 'studio-lens' && game.drafts.lens) {
      const lens = game.drafts.lens;
      let ev;
      try { ev = E.evaluateLens(lens, game.company); } catch (e) { return; }
      const side = document.querySelector('.js-lens-side');
      if (side) {
        const oldCanvas = side.querySelector('canvas[data-art-live]');
        side.innerHTML = renderLensEvalPanel(lens, ev);
        const newCanvas = side.querySelector('canvas[data-art-live]');
        if (oldCanvas && newCanvas) newCanvas.replaceWith(oldCanvas);
        paintArtCanvases(side, true);
      }
      const score = document.querySelector('.js-lens-score');
      if (score) score.textContent = Math.round(activeStepScoreLens(ev, UI.lensStep));
    }
  }

  function commitChange(opts) {
    opts = opts || {};
    persist();
    renderApp({ preserveScroll: opts.preserveScroll !== false });
  }

  function askConfirm(opts) {
    openModal('confirm', opts);
  }

  function startCameraDraft(category) {
    if (!game) return;
    const draft = E.makeCameraDraft(category, game.company, { mode: game });
    draft._uiStep = 1;
    game.drafts.camera = draft;
    UI.studioStep = 1;
    UI.previewView = 'front';
    UI.previewAnnotations = true;
    UI.previewWire = false;
    UI.page = 'studio-camera';
    closeModal();
    persist(true);
    renderApp();
    showToast('设计草稿已创建。现在可以从外形开始定义它。', 'good', `立项 · ${D.CATEGORIES[category].name}`);
  }

  function startLensDraft() {
    if (!game) return;
    if (game.drafts.lens) {
      UI.page = 'studio-lens';
      UI.lensStep = game.drafts.lens._uiStep || 1;
      closeModal();
      renderApp();
      showToast('已恢复未完成的镜头设计。', 'info');
      return;
    }
    const draft = E.makeLensDraft(game.company);
    draft._uiStep = 1;
    game.drafts.lens = draft;
    UI.page = 'studio-lens';
    UI.lensStep = 1;
    UI.lensView = 'side';
    closeModal();
    persist(true);
    renderApp();
    showToast('镜头草稿已创建。先确定焦距、光圈和光学结构。', 'good', '光学项目立项');
  }

  function parseFieldValue(target) {
    if (target.type === 'range' || target.type === 'number') {
      if (target.value === '') return null;
      const n = Number(target.value);
      return Number.isFinite(n) ? n : null;
    }
    if (target.type === 'checkbox') return target.checked;
    return target.value;
  }

  function applyStudioChoice(el) {
    const scope = currentStudioScope(el);
    const obj = objectForScope(scope);
    if (!obj) return;
    const path = el.dataset.path;
    const val = parseDataValue(el.dataset.value, el.dataset.valueType);
    if (!path) return;
    setDeepValue(obj, path, val);
    persist();
    renderApp({ preserveScroll: true });
  }

  function getLensTemplate(id) {
    return {
      fifty: { type: 'prime', focalMin: 50, focalMax: 50, maxAperture: 1.8, target: 'enthusiast', style: 'silver_retro', length: 72, diameter: 64, weight: 380, elements: 9, groups: 8, aspherical: 1, ed: 1, fluorite: 0, filter: 58, motor: 'stm' },
      '2470': { type: 'zoom', focalMin: 24, focalMax: 70, maxAperture: 2.8, target: 'professional', style: 'black_pro', length: 112, diameter: 78, weight: 690, elements: 16, groups: 12, aspherical: 2, ed: 3, fluorite: 0, filter: 77, motor: 'linear' },
      '70200': { type: 'tele', focalMin: 70, focalMax: 200, maxAperture: 2.8, target: 'professional', style: 'white_tele', length: 190, diameter: 94, weight: 1350, elements: 19, groups: 15, aspherical: 2, ed: 4, fluorite: 1, filter: 77, motor: 'dual' },
      cine35: { type: 'cinema', focalMin: 35, focalMax: 35, maxAperture: 1.8, target: 'cinema', style: 'cine_black', length: 142, diameter: 110, weight: 1650, elements: 12, groups: 10, aspherical: 2, ed: 2, fluorite: 1, filter: 95, motor: 'cinema' }
    }[id] || null;
  }

  function applyLensTemplate(id) {
    const lens = game.drafts.lens;
    const t = getLensTemplate(id);
    if (!lens || !t) return;
    lens.lensType = t.type;
    lens.focalMin = t.focalMin;
    lens.focalMax = t.focalMax;
    lens.maxAperture = t.maxAperture;
    lens.targetSegment = t.target;
    lens.optical.elements = t.elements;
    lens.optical.groups = t.groups;
    lens.optical.aspherical = t.aspherical;
    lens.optical.ed = t.ed;
    lens.optical.fluorite = t.fluorite;
    lens.filter = t.filter;
    lens.focus.motor = t.motor;
    lens.body.style = t.style;
    lens.body.length = t.length;
    lens.body.diameter = t.diameter;
    lens.body.weight = t.weight;
    lens.body.focusGear = t.type === 'cinema';
    lens.body.zoomGear = t.type === 'cinema' && t.focalMin !== t.focalMax;
    lens.focus.breathing = t.type === 'cinema' ? 'minimal' : 'normal';
    lens.stabilization = t.focalMax > 90;
    lens.stabilizationStops = lens.stabilization ? 5 : 0;
    lens.name = E.suggestLensName(game.company, lens);
    persist();
    renderApp({ preserveScroll: true });
    showToast('已套用光学模板，继续调整镜身细节。', 'good', '模板已加载');
  }

  const CONTROL_PRESETS = {
    pro: {
      buttons: {
        shutter: [true, 'top_right'], record: [true, 'top_mid'], play: [true, 'back_upper_right'], menu: [true, 'back_upper_left'],
        fn: [true, 'back_lower_right'], c1: [true, 'top_left'], c2: [false, 'back_upper_right'], c3: [false, 'side']
      },
      dials: { front: true, rear: true, mode: true, extra: false }, joystick: true, touchZone: 'whole'
    },
    retro: {
      buttons: {
        shutter: [true, 'top_right'], record: [false, 'top_mid'], play: [true, 'back_upper_left'], menu: [true, 'back_upper_right'],
        fn: [true, 'back_lower_right'], c1: [true, 'top_left'], c2: [false, 'side'], c3: [false, 'side']
      },
      dials: { front: true, rear: true, mode: true, extra: true }, joystick: false, touchZone: 'off'
    },
    video: {
      buttons: {
        shutter: [true, 'top_mid'], record: [true, 'top_right'], play: [true, 'back_upper_right'], menu: [true, 'back_upper_left'],
        fn: [true, 'back_lower_right'], c1: [true, 'top_left'], c2: [true, 'back_lower_right'], c3: [false, 'side']
      },
      dials: { front: true, rear: true, mode: true, extra: false }, joystick: true, touchZone: 'whole'
    },
    minimal: {
      buttons: {
        shutter: [true, 'top_right'], record: [true, 'top_mid'], play: [false, 'back_upper_right'], menu: [true, 'top_left'],
        fn: [false, 'back_lower_right'], c1: [false, 'side'], c2: [false, 'side'], c3: [false, 'side']
      },
      dials: { front: false, rear: true, mode: true, extra: false }, joystick: false, touchZone: 'right'
    }
  };

  function applyControlPreset(preset, draft) {
    const p = CONTROL_PRESETS[preset] || CONTROL_PRESETS.pro;
    Object.keys(D.CONTROLS).forEach(id => {
      if (!draft.controls.buttons[id]) draft.controls.buttons[id] = { enabled: false, pos: 'back_upper_right' };
      const conf = p.buttons[id] || [false, 'back_upper_right'];
      draft.controls.buttons[id].enabled = conf[0];
      draft.controls.buttons[id].pos = conf[1];
    });
    draft.controls.dials = Object.assign({ front: false, rear: false, mode: false, extra: false }, p.dials);
    draft.controls.joystick = !!p.joystick;
    draft.controls.touchZone = p.touchZone;
    draft.controls.preset = preset;
  }

  function applyCameraTemplate(templateId) {
    const draft = game.drafts.camera;
    const t = CAMERA_TEMPLATES.find(x => x.id === templateId);
    if (!draft || !t) return;
    draft.body = Object.assign({}, draft.body, t.body || {});
    draft.materials = Object.assign({}, draft.materials, t.materials || {});
    draft.colors = Object.assign({}, draft.colors, t.colors || {});
    if (t.screen) draft.screen = Object.assign({}, draft.screen, t.screen);
    if (t.viewfinder) draft.viewfinder = Object.assign({}, draft.viewfinder, t.viewfinder);
    if (t.details) {
      Object.keys(t.details).forEach(k => { draft.details[k] = t.details[k]; });
    }
    applyControlPreset((t.controls && t.controls.preset) || 'pro', draft);
    if (t.controls && t.controls.dials) draft.controls.dials = Object.assign({}, draft.controls.dials, t.controls.dials);
    if (t.accessories) {
      Object.assign(draft.accessories, {
        batteryGrip: false, verticalGrip: false, mic: false, monitor: false,
        fan: false, cage: false, shoulder: false, wireless: false, flash: false
      });
      Object.keys(t.accessories).forEach(k => { if (k in draft.accessories) draft.accessories[k] = t.accessories[k]; });
    }
    if (t.weatherSealed != null) draft.body.weatherSealed = t.weatherSealed;
    persist();
    renderApp({ preserveScroll: true });
    showToast(`已应用「${t.name}」设计语言。传感器和卡口保持不变。`, 'good', '模板已应用');
  }

  function randomInspiration() {
    const draft = game.drafts.camera;
    if (!draft) return;
    const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
    const silhouettes = Object.keys(D.SILHOUETTES);
    const tops = Object.keys(D.TOP_STYLES);
    const fronts = Object.keys(D.FRONT_STYLES);
    const materials = ['aluminum', 'magnesium', 'titanium', 'carbon', 'plastic', 'leather'];
    const finishes = Object.keys(D.FINISHES);
    const palette = D.COLORS;
    draft.body.silhouette = pickRandom(silhouettes);
    draft.body.top = pickRandom(tops);
    draft.body.front = pickRandom(fronts);
    draft.body.roundness = Math.round(10 + Math.random() * 55);
    draft.materials.body = pickRandom(materials);
    draft.materials.finish = pickRandom(finishes);
    draft.materials.topPlate = pickRandom(['metal', 'hybrid', 'plastic']);
    draft.materials.frame = pickRandom(['metal', 'partial_grip', 'plastic']);
    const main = pickRandom(palette), second = pickRandom(palette);
    draft.colors.main = main.hex;
    draft.colors.secondaryOn = Math.random() > 0.36;
    draft.colors.secondary = second.hex;
    draft.colors.top = Math.random() > 0.5 ? second.hex : main.hex;
    draft.colors.grip = Math.random() > 0.5 ? pickRandom(palette).hex : main.hex;
    draft.colors.accent = game.company.design?.accent || pickRandom(palette).hex;
    draft.colors.accentLine = Math.random() > 0.35;
    draft.screen.type = pickRandom(['fixed', 'tilt', 'sideflip', 'upflip', 'fold']);
    draft.viewfinder.type = pickRandom(['none', 'small', 'pro', 'eyelevel', 'folding']);
    draft.details.vents = Math.random() > 0.55;
    draft.details.knurl = Math.random() > 0.6;
    draft.details.nameplate = true;
    draft.details.redline = Math.random() > 0.55;
    draft.details.goldring = Math.random() > 0.7;
    draft.details.bluering = Math.random() > 0.8;
    draft.details.cage = false;
    draft.details.handle = false;
    draft.details.expansion = Math.random() > 0.65;
    draft.details.portstyling = Math.random() > 0.5;
    Object.keys(draft.accessories).forEach(k => draft.accessories[k] = false);
    if (Math.random() > 0.74) draft.accessories.mic = true;
    if (Math.random() > 0.82) draft.accessories.fan = true;
    if (draft.screen.type === 'none' && draft.viewfinder.type === 'none') draft.viewfinder.type = 'small';
    persist();
    renderApp({ preserveScroll: true });
    showToast('随机灵感已生成。它可能很怪，但可能是好设计的开始。', 'info', '视觉骰子');
  }

  function setCameraCategory(category) {
    const draft = game.drafts.camera;
    if (!draft || !D.CATEGORIES[category]) return;
    const base = E.makeCameraDraft(category, game.company, { mode: game });
    const preserve = {
      name: draft.name, materials: deepClone(draft.materials), colors: deepClone(draft.colors),
      controls: deepClone(draft.controls), details: deepClone(draft.details), accessories: deepClone(draft.accessories),
      notes: draft.notes, _uiStep: draft._uiStep
    };
    ['body', 'sensor', 'performance', 'video', 'ports', 'wireless', 'battery', 'mount', 'screen', 'viewfinder'].forEach(k => { draft[k] = deepClone(base[k]); });
    draft.category = category;
    draft.targetSegment = base.targetSegment;
    draft.price = base.price;
    draft.initialStock = base.initialStock;
    draft.qc = draft.qc || base.qc;
    draft.campaign = draft.campaign || base.campaign;
    draft.kitLensId = null;
    Object.assign(draft, preserve);
    persist();
    renderApp({ preserveScroll: true });
    showToast(`已切换到「${D.CATEGORIES[category].name}」，已套用该品类的推荐结构与规格。`, 'good', '产品线变更');
  }

  function setCameraBodyType(bodyType) {
    const draft = game.drafts.camera;
    const def = D.BODY_TYPES[bodyType];
    if (!draft || !def) return;
    draft.body.type = bodyType;
    const d = def.defaults;
    ['silhouette', 'top', 'front', 'width', 'height', 'depth', 'gripH', 'gripD', 'gripCurve', 'roundness'].forEach(k => {
      if (d[k] != null) draft.body[k] = d[k];
    });
    persist();
    renderApp({ preserveScroll: true });
  }

  function setSensorFormat(formatId) {
    const draft = game.drafts.camera;
    const fmt = D.SENSOR_FORMATS[formatId];
    if (!draft || !fmt) return;
    draft.sensor.format = formatId;
    const max = E.maxMPFor(formatId, game.company);
    draft.sensor.mp = clamp(Math.round(draft.sensor.mp || fmt.minMP), fmt.minMP, Math.max(fmt.minMP, max));
    const allowedTypes = Object.values(D.SENSOR_TYPES).filter(t => game.company.tech.sensor >= t.tech);
    if (!allowedTypes.find(t => t.id === draft.sensor.type)) {
      draft.sensor.type = allowedTypes.length ? allowedTypes[allowedTypes.length - 1].id : 'cmos';
    }
    persist();
    renderApp({ preserveScroll: true });
  }

  function lensCoverageForMount(mountId) {
    const def = D.MOUNTS[mountId];
    if (!def) return 'ff';
    const entries = Object.entries(D.SENSOR_FORMATS).sort((a, b) => b[1].index - a[1].index);
    const match = entries.find(([, f]) => f.index <= def.maxFormat);
    return match ? match[0] : 'one';
  }

  function makeGameFromBoot() {
    const mode = UI.boot.mode;
    if (mode === 'startup') {
      const s = UI.boot.startup;
      if (!String(s.name || '').trim()) {
        showToast('请先给你的公司起一个名字。', 'bad');
        const input = document.querySelector('[data-boot-field="name"]');
        if (input) input.focus();
        return false;
      }
      if (!String(s.en || '').trim()) s.en = s.name;
      if (!String(s.hq || '').trim()) s.hq = '深圳 · 中国';
      try {
        const newGame = E.initGame({ mode: 'startup', startup: deepClone(s) });
        enterGame(newGame, { welcome: true });
      } catch (e) {
        console.error(e);
        showToast('创建公司失败：' + (e.message || '未知错误'), 'bad');
        return false;
      }
    } else {
      try {
        const newGame = E.initGame({ mode: 'takeover', companyId: UI.boot.companyId });
        enterGame(newGame, { welcome: true });
      } catch (e) {
        console.error(e);
        showToast('接管公司失败：' + (e.message || '未知错误'), 'bad');
        return false;
      }
    }
    return true;
  }

  function enterGame(newGame, options) {
    options = options || {};
    game = newGame;
    if (ART && game.art && game.art.settings && ART.online) ART.online.setEnabled(game.art.settings.online !== false);
    const wantAutoSync = !!(game.art && game.art.settings && game.art.settings.autoSync);
    UI.artAutoSynced = !wantAutoSync;
    if (wantAutoSync) setTimeout(autoSyncReferences, 2600);
    UI.savePeek = null;
    UI.page = 'overview';
    UI.productTab = 'cameras';
    UI.productFilter = 'all';
    UI.marketTab = 'overview';
    UI.supplyTab = 'production';
    UI.studioStep = game.drafts.camera ? (game.drafts.camera._uiStep || 1) : 1;
    UI.lensStep = game.drafts.lens ? (game.drafts.lens._uiStep || 1) : 1;
    UI.previewView = 'front';
    UI.lensView = 'side';
    UI.modal = null;
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
    bootRoot.innerHTML = '';
    appEl.classList.remove('is-hidden');
    appEl.setAttribute('aria-hidden', 'false');
    renderApp();
    persist(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => {
      if (options.welcome) openModal('welcome');
      else showToast('存档已载入。继续你的影像生意。', 'good', '欢迎回来');
    }, 160);
  }

  function bootContinue() {
    const res = E.loadSavedGame();
    if (!res.ok) {
      showToast(res.error || '无法读取存档。', 'bad');
      UI.savePeek = E.peekSave();
      renderBoot();
      return;
    }
    enterGame(res.game, { welcome: false });
  }

  function bootStart() {
    if (UI.savePeek) {
      askConfirm({
        title: '覆盖已有存档？', eyebrow: 'NEW GAME / 新游戏', tone: 'danger',
        messageHtml: `<div class="callout-title">${icon('alert')} 已经有进行中的公司</div>开始新游戏会覆盖当前本地存档。若想保留，请先取消并在标题界面继续经营，或从设置页导出备份。`,
        confirmLabel: '覆盖并开始', onConfirm: makeGameFromBoot
      });
    } else {
      makeGameFromBoot();
    }
  }

  function returnToTitle() {
    if (game) persist(true);
    game = null;
    UI.modal = null;
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
    UI.savePeek = E.peekSave();
    appEl.classList.add('is-hidden');
    appEl.setAttribute('aria-hidden', 'true');
    sidebarEl.innerHTML = '';
    topbarEl.innerHTML = '';
    viewEl.innerHTML = '';
    renderBoot();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function resetToBoot(clearSave) {
    if (clearSave) {
      E.clearSave();
      UI.savePeek = null;
    }
    UI.modal = null;
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
    game = null;
    UI.savePeek = clearSave ? null : E.peekSave();
    appEl.classList.add('is-hidden');
    appEl.setAttribute('aria-hidden', 'true');
    sidebarEl.innerHTML = '';
    topbarEl.innerHTML = '';
    viewEl.innerHTML = '';
    renderBoot();
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (clearSave) showToast('新游戏已准备就绪。选择你的起点。', 'info');
  }

  function downloadSave() {
    if (!game) return;
    persist(true);
    const text = E.exportSave(game);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FRAME-${String(game.company.en || game.company.name || 'save').replace(/[^\w\u4e00-\u9fa5-]+/g, '_')}-${E.monthShort(game.monthIndex).replace('.', '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('存档已导出为 JSON 文件。', 'good', '备份完成');
  }

  function handleSaveFile(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { showToast('存档文件大于 8MB，拒绝导入。', 'bad'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const res = E.importSave(String(reader.result || ''));
      if (!res.ok) { showToast(res.error || '存档无效。', 'bad'); return; }
      askConfirm({
        title: '导入这份存档？', eyebrow: 'IMPORT / 导入存档', tone: 'danger',
        messageHtml: `<div class="callout-title">${icon('alert')} 导入会替换当前进度</div>将载入 <b>${esc(res.game.company.name)}</b> 在 ${esc(E.monthLabel(res.game.monthIndex || 0))} 的存档。当前游戏进度会被覆盖。`,
        confirmLabel: '导入并载入', onConfirm: () => {
          
          
          
          enterGame(res.game, { welcome: false });
          
          
          
          E.saveGame(res.game);
          
          
          
          showToast('存档已导入。', 'good');
        }
      });
    };
    reader.onerror = () => showToast('读取存档文件失败。', 'bad');
    reader.readAsText(file);
  }

  function refreshProductModal(id) {
    closeModal();
    setTimeout(() => {
      if (game && [...game.products, ...game.lenses].some(p => p.id === id)) openModal('product', { id });
    }, 80);
  }

  function findGameProduct(id) {
    return game ? [...game.products, ...game.lenses].find(p => p.id === id) : null;
  }

  // ---------- action dispatcher ----------
  function handleAction(action, el, event) {
    if (!action) return;
    if (action !== 'modal-backdrop' && event) event.preventDefault();
    try {
      switch (action) {
        case 'modal-backdrop':
          
          
          
          if (event && event.target === el) closeModal();
          
          
          
          break;
        case 'close-modal':
          
          
          
          closeModal();
          
          
          
          break;
        case 'open-help':
          
          
          
          openModal('help');
          
          
          
          break;
        case 'help-design':
          
          
          
          closeModal();
          
          
          
          if (game) { UI.page = 'design'; renderApp(); setTimeout(() => openModal('new-camera'), 100); }
          
          
          
          break;
        case 'boot-start':
          
          
          
          bootStart();
          
          
          
          break;
        case 'boot-continue':
          
          
          
          bootContinue();
          
          
          
          break;
        case 'nav': {
          
          
          
          if (!game) break;
          
          
          
          const target = el.dataset.page || 'overview';
          
          
          
          if (el.dataset.closeModal) closeModal();
          
          
          
          UI.page = target;
          
          
          
          UI.sidebarOpen = false;
          
          
          
          appEl.classList.remove('sidebar-open');
          
          
          
          if (target === 'studio-camera' && !game.drafts.camera) { openModal('new-camera'); break; }
          
          
          
          if (target === 'studio-lens' && !game.drafts.lens) { startLensDraft(); break; }
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        }
        case 'toggle-sidebar':
          
          
          
          UI.sidebarOpen = !UI.sidebarOpen;
          
          
          
          appEl.classList.toggle('sidebar-open', UI.sidebarOpen);
          
          
          
          break;
        case 'close-sidebar':
          
          
          
          UI.sidebarOpen = false;
          
          
          
          appEl.classList.remove('sidebar-open');
          
          
          
          break;
        case 'open-news':
          
          
          
          if (game) openModal('news', {});
          
          
          
          break;
        case 'advance-month':
          
          
          
          advanceMonth();
          
          
          
          break;
        case 'new-camera':
          
          
          
          if (!game) break;
          
          
          
          if (game.drafts.camera) {
          
          
          
            UI.page = 'studio-camera';
          
          
          
            UI.studioStep = game.drafts.camera._uiStep || 1;
          
          
          
            closeModal();
          
          
          
            renderApp();
          
          
          
            showToast('已恢复未完成的相机设计。', 'info', '设计草稿');
          
          
          
          } else {
          
          
          
            openModal('new-camera');
          
          
          
          }
          
          
          
          break;
        case 'new-lens':
          
          
          
          startLensDraft();
          
          
          
          break;
        case 'start-camera':
          
          
          
          startCameraDraft(el.dataset.category);
          
          
          
          break;
        case 'resume-camera-draft':
          
          
          
          if (!game || !game.drafts.camera) { startCameraDraft('mirrorless'); break; }
          
          
          
          closeModal();
          
          
          
          UI.page = 'studio-camera';
          
          
          
          UI.studioStep = clamp(game.drafts.camera._uiStep || 1, 1, 8);
          
          
          
          renderApp();
          
          
          
          break;
        case 'resume-lens-draft':
          
          
          
          if (!game || !game.drafts.lens) { startLensDraft(); break; }
          
          
          
          closeModal();
          
          
          
          UI.page = 'studio-lens';
          
          
          
          UI.lensStep = clamp(game.drafts.lens._uiStep || 1, 1, 3);
          
          
          
          renderApp();
          
          
          
          break;
        case 'discard-camera-draft':
          
          
          
          askConfirm({
          
          
          
            title: '丢弃这份相机草稿？', eyebrow: 'DISCARD / 删除草稿', tone: 'danger',
          
          
          
            messageHtml: `<div class="callout-title">${icon('alert')} 无法撤销</div>${esc(game.drafts.camera?.name || '当前相机')} 的所有外形、传感器与定价选择都会被删除。`,
          
          
          
            confirmLabel: '丢弃草稿', onConfirm: () => {
          
          
          
              game.drafts.camera = null;
          
          
          
              persist(true);
          
          
          
              if (UI.page === 'studio-camera') UI.page = 'design';
          
          
          
              renderApp();
          
          
          
              showToast('相机草稿已丢弃。', 'info');
          
          
          
            }
          
          
          
          });
          
          
          
          break;
        case 'discard-lens-draft':
          
          
          
          askConfirm({
          
          
          
            title: '丢弃这份镜头草稿？', eyebrow: 'DISCARD / 删除草稿', tone: 'danger',
          
          
          
            messageHtml: `<div class="callout-title">${icon('alert')} 无法撤销</div>${esc(game.drafts.lens?.name || '当前镜头')} 的光学结构、镜身设计和定价都会被删除。`,
          
          
          
            confirmLabel: '丢弃草稿', onConfirm: () => {
          
          
          
              game.drafts.lens = null;
          
          
          
              persist(true);
          
          
          
              if (UI.page === 'studio-lens') UI.page = 'design';
          
          
          
              renderApp();
          
          
          
              showToast('镜头草稿已丢弃。', 'info');
          
          
          
            }
          
          
          
          });
          
          
          
          break;
        case 'save-draft': {
          
          
          
          if (game && game.drafts.camera) game.drafts.camera._uiStep = UI.studioStep;
          
          
          
          if (game && game.drafts.lens) game.drafts.lens._uiStep = UI.lensStep;
          
          
          
          persist(true);
          
          
          
          showToast('设计草稿已保存在本地。', 'good');
          
          
          
          break;
        }
        case 'studio-step': {
          
          
          
          const step = clamp(Number(el.dataset.step) || 1, 1, 8);
          
          
          
          UI.studioStep = step;
          
          
          
          if (game.drafts.camera) game.drafts.camera._uiStep = step;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        }
        case 'studio-next': {
          
          
          
          if (UI.studioStep >= 8) { openModal('launch-confirm', { kind: 'camera' }); break; }
          
          
          
          UI.studioStep += 1;
          
          
          
          if (game.drafts.camera) game.drafts.camera._uiStep = UI.studioStep;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        }
        case 'studio-prev':
          
          
          
          UI.studioStep = Math.max(1, UI.studioStep - 1);
          
          
          
          if (game.drafts.camera) game.drafts.camera._uiStep = UI.studioStep;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        case 'open-launch-review':
          
          
          
          openModal('launch-confirm', { kind: 'camera' });
          
          
          
          break;
        case 'set-camera-category': {
          
          
          
          const cat = el.dataset.category;
          
          
          
          askConfirm({
          
          
          
            title: `切换到${D.CATEGORIES[cat]?.name || '新品类'}？`, eyebrow: 'PRODUCT LINE CHANGE / 产品线变更',
          
          
          
            messageHtml: `<div class="callout-title">${icon('info')} 会重置机械结构，但保留你的视觉语言</div>产品线将改变默认外形、机身尺寸、传感器、卡口和视频基础。你已选的材质、颜色、按键与配件会保留。`,
          
          
          
            confirmLabel: '切换并套用', onConfirm: () => setCameraCategory(cat)
          
          
          
          });
          
          
          
          break;
        }
        case 'set-body-type':
          
          
          
          setCameraBodyType(el.dataset.bodyType);
          
          
          
          break;
        case 'apply-template':
          
          
          
          applyCameraTemplate(el.dataset.template);
          
          
          
          break;
        case 'random-inspiration':
          
          
          
          randomInspiration();
          
          
          
          break;
        case 'set-choice':
          
          
          
          applyStudioChoice(el);
          
          
          
          break;
        case 'set-color': {
          
          
          
          const scope = currentStudioScope(el);
          
          
          
          const obj = objectForScope(scope);
          
          
          
          if (obj) { setDeepValue(obj, el.dataset.path, el.dataset.value); commitChange(); }
          
          
          
          break;
        }
        case 'flip-path': {
          
          
          
          const scope = currentStudioScope(el);
          
          
          
          const obj = objectForScope(scope);
          
          
          
          if (obj) {
          
          
          
            const current = el.dataset.path.split('.').reduce((o, k) => o && o[k], obj);
          
          
          
            setDeepValue(obj, el.dataset.path, !current);
          
          
          
            commitChange();
          
          
          
          }
          
          
          
          break;
        }
        case 'toggle-array': {
          
          
          
          const scope = currentStudioScope(el);
          
          
          
          const obj = objectForScope(scope);
          
          
          
          if (obj) {
          
          
          
            const path = el.dataset.path;
          
          
          
            const current = el.dataset.path.split('.').reduce((o, k) => o && o[k], obj);
          
          
          
            if (Array.isArray(current)) {
          
          
          
              const val = el.dataset.value;
          
          
          
              const idx = current.indexOf(val);
          
          
          
              if (idx >= 0) current.splice(idx, 1); else current.push(val);
          
          
          
              setDeepValue(obj, path, current);
          
          
          
              commitChange();
          
          
          
            }
          
          
          
          }
          
          
          
          break;
        }
        case 'toggle-control': {
          
          
          
          const draft = game.drafts.camera;
          
          
          
          const cid = el.dataset.control;
          
          
          
          if (draft && draft.controls.buttons[cid]) {
          
          
          
            draft.controls.buttons[cid].enabled = !draft.controls.buttons[cid].enabled;
          
          
          
            commitChange();
          
          
          
          }
          
          
          
          break;
        }
        case 'control-preset': {
          
          
          
          if (!game.drafts.camera) break;
          
          
          
          applyControlPreset(el.dataset.preset, game.drafts.camera);
          
          
          
          commitChange();
          
          
          
          showToast('操控布局预设已应用，你可以继续微调每一个按键。', 'info');
          
          
          
          break;
        }
        case 'preview-view':
          
          
          
          UI.previewView = el.dataset.view || 'front';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'preview-mode':
          
          
          
          UI.previewMode = ['technical', 'render', 'photo'].includes(el.dataset.mode) ? el.dataset.mode : 'photo';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'photo-open-gallery':
          
          
          
          UI.page = 'gallery';
          
          
          
          UI.galleryTab = 'photos';
          
          
          
          UI.galleryBrand = 'all';
          
          
          
          UI.galleryCat = 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'art-gallery-reset':
          
          
          
          UI.galleryBrand = 'all';
          
          
          
          UI.galleryCat = 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'photo-export-design': {
          
          
          
          if (!game.drafts.camera) break;
          
          
          
          downloadPhoto(photoForDesign(game.drafts.camera));
          
          
          
          showToast('已下载当前实拍参考图。', 'good');
          
          
          
          break;
        }
        case 'photo-export-product': {
          
          
          
          const p = findGameProduct(el.dataset.id);
          
          
          
          if (p) { downloadPhoto(photoForProduct(p)); showToast('已下载实拍参考图。', 'good'); }
          
          
          
          break;
        }
        case 'photo-open':
          
          
          
          openModal('photo', { id: el.dataset.photo });
          
          
          
          break;
        case 'photo-download': {
          
          
          
          const it = PHOTO && PHOTO.byId(el.dataset.photo);
          
          
          
          if (it) { downloadPhoto({ item: it }); showToast('已下载照片。', 'good'); }
          
          
          
          break;
        }
        case 'photo-random': {
          
          
          
          if (!PHOTO || !PHOTO.items.length) break;
          
          
          
          const pool = PHOTO.list({
          
          
          
            brandId: UI.galleryBrand === 'all' ? null : UI.galleryBrand,
          
          
          
            category: UI.galleryCat === 'all' ? null : UI.galleryCat
          
          
          
          });
          
          
          
          const item = pool.length ? pool[Math.floor(Math.random() * pool.length)] : PHOTO.items[Math.floor(Math.random() * PHOTO.items.length)];
          
          
          
          if (!game.drafts.camera) { openModal('photo', { id: item.id }); break; }
          
          
          
          const draft = game.drafts.camera;
          
          
          
          draft.photoId = item.id;
          
          
          
          const struct = findStructuralModel(item);
          
          
          
          if (struct) { applyModelToDraft(struct, draft); draft.photoId = item.id; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast('已随机选用 ' + item.brand + ' ' + item.model + ' 作为外形参考。', 'good', '照片参考');
          
          
          
          break;
        }
        case 'photo-use': {
          
          
          
          const item = PHOTO && PHOTO.byId(el.dataset.photo);
          
          
          
          if (!item || !game.drafts.camera) { showToast('请先在设计工作室创建一台相机。', 'bad'); break; }
          
          
          
          game.drafts.camera.photoId = item.id;
          
          
          
          const struct = findStructuralModel(item);
          
          
          
          if (struct) {
          
          
          
            applyModelToDraft(struct, game.drafts.camera);
          
          
          
            game.drafts.camera.photoId = item.id;
          
          
          
          }
          
          
          
          persist();
          
          
          
          closeModal();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast('已把 ' + item.brand + ' ' + item.model + ' 设为外形照片参考。', 'good', '照片参考');
          
          
          
          break;
        }
        case 'art-angle-cycle': {
          
          
          
          const order = ['hero', 'front', 'back', 'top', 'side'];
          
          
          
          const idx = order.indexOf(UI.artPhotoView);
          
          
          
          UI.artPhotoView = order[(idx + 1) % order.length];
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        }
        case 'art-angle': {
          
          
          
          UI.artPhotoView = el.dataset.view || 'hero';
          
          
          
          const side = document.querySelector('.js-studio-side');
          
          
          
          if (side && game.drafts.camera) {
          
          
          
            try {
          
          
          
              const ev = E.evaluateCamera(game.drafts.camera, game.company, { kitLens: getCameraKitLens(game.drafts.camera) });
          
          
          
              side.innerHTML = renderCameraEvalPanel(ev, game.drafts.camera);
          
          
          
              paintArtCanvases(side, false);
          
          
          
            } catch (e) { renderApp({ preserveScroll: true }); }
          
          
          
          } else renderApp({ preserveScroll: true });
          
          
          
          break;
        }
        case 'toggle-art-ghost':
          
          
          
          UI.artGhost = !UI.artGhost;
          
          
          
          paintArtCanvases(document.querySelector('.js-studio-side') || viewEl, false);
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'art-repair': {
          
          
          
          if (!game.drafts.camera) break;
          
          
          
          const res = ART.normalizeDesign(game.drafts.camera, game.company, {
          
          
          
            kitLens: getCameraKitLens(game.drafts.camera),
          
          
          
            adherence: (game.art && game.art.adherence) || 0.7
          
          
          
          });
          
          
          
          game.drafts.camera = res.design;
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(res.changed ? `已按现实结构校正 ${res.spec.meta.corrections.length} 项比例。` : '当前比例已经落在现实结构区间内，无需校正。', res.changed ? 'good' : 'info', 'Reality Guard');
          
          
          
          break;
        }
        case 'art-export-4k': {
          
          
          
          if (!game.drafts.camera) break;
          
          
          
          exportCameraArtwork(game.drafts.camera, game.company, { kitLens: getCameraKitLens(game.drafts.camera) }, game.drafts.camera.name);
          
          
          
          break;
        }
        case 'art-export-4k-lens': {
          
          
          
          if (!game.drafts.lens) break;
          
          
          
          exportLensArtwork(game.drafts.lens, game.company, game.drafts.lens.name);
          
          
          
          break;
        }
        case 'art-export-product': {
          
          
          
          const p = findGameProduct(el.dataset.id);
          
          
          
          if (!p) break;
          
          
          
          if (p.kind === 'lens') exportLensArtwork(p.design, game.company, p.name);
          
          
          
          else exportCameraArtwork(p.design, game.company, { kitLens: E.getKitLens(game, p) }, p.name);
          
          
          
          break;
        }
        case 'art-use-model':
          
          
          
          useReferenceModel(el.dataset.model);
          
          
          
          break;
        case 'art-open-model':
          
          
          
          openModal('ref-model', { id: el.dataset.model });
          
          
          
          break;
        case 'art-open-lens':
          
          
          
          openModal('ref-lens', { id: el.dataset.lens });
          
          
          
          break;
        case 'art-gallery-tab':
          
          
          
          UI.galleryTab = ['photos', 'cameras', 'lenses'].includes(el.dataset.tab) ? el.dataset.tab : 'photos';
          
          
          
          UI.galleryBrand = 'all';
          
          
          
          UI.galleryCat = 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'art-gallery-brand':
          
          
          
          UI.galleryBrand = el.dataset.brand || 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'art-gallery-cat':
          
          
          
          UI.galleryCat = el.dataset.cat || 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'art-sync-page': {
          
          
          
          if (UI.galleryTab === 'lenses') {
          
          
          
            const list = ART.data.LENSES.filter(l => UI.galleryBrand === 'all' || l.brand === UI.galleryBrand).slice(0, 12).map(l => Object.assign({ kind: 'lens' }, l));
          
          
          
            syncReferenceSet(list, '镜头参考图');
          
          
          
          } else {
          
          
          
            const list = ART.data.MODELS.filter(m => (UI.galleryBrand === 'all' || m.brand === UI.galleryBrand) && (UI.galleryCat === 'all' || m.cat === UI.galleryCat)).slice(0, 14);
          
          
          
            syncReferenceSet(list, '相机参考图');
          
          
          
          }
          
          
          
          break;
        }
        case 'art-sync-brand': {
          
          
          
          const brandId = game.company.isReal ? game.company.id : null;
          
          
          
          let list = brandId ? ART.data.modelsForBrand(brandId) : [];
          
          
          
          if (!list.length) list = ART.referenceModels({ company: game.company, category: 'mirrorless', limit: 8 });
          
          
          
          syncReferenceSet(list.slice(0, 10), (brandId ? game.company.name : '当前品牌') + ' 经典机型');
          
          
          
          break;
        }
        case 'art-toggle-online': {
          
          
          
          game.art.settings.online = !game.art.settings.online;
          
          
          
          ART.online.setEnabled(game.art.settings.online);
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(game.art.settings.online ? '联网检索已开启。抓取结果会缓存到本地。' : '已切换为离线模式，继续使用本地缓存与内置结构库。', 'info', 'Reference Library');
          
          
          
          break;
        }
        case 'art-clear-cache': {
          
          
          
          ART.cache.clear().then(() => {
          
          
          
            refPhotoRecords.clear();
          
          
          
            renderApp({ preserveScroll: true });
          
          
          
            showToast('参考图与产品图缓存已清空；离线结构数据仍然可用。', 'info');
          
          
          
          });
          
          
          
          break;
        }
        case 'art-fetch-photo':
        case 'art-refresh-photo': {
          
          
          
          const id = el.dataset.model;
          
          
          
          const model = ART.data.modelById(id) || ART.data.lensById(id);
          
          
          
          if (!model) break;
          
          
          
          if (!ART.online.isOnline()) { showToast('联网检索已关闭。可在参考图库或设置中开启。', 'bad'); break; }
          
          
          
          showToast('正在从 Wikimedia Commons 抓取参考图…', 'info');
          
          
          
          const isLens = !!ART.data.lensById(id);
          
          
          
          const task = isLens ? ART.online.fetchLensPhoto(model) : ART.online.fetchModelPhoto(model, { force: true });
          
          
          
          task.then(res => {
          
          
          
            if (res && res.record) refPhotoRecords.set(id, res.record);
          
          
          
            if (res && res.ok) showToast('参考图已缓存。', 'good');
          
          
          
            else showToast((res && res.error) || '抓取失败，可稍后重试。', 'bad');
          
          
          
            if (UI.modal && (UI.modal.type === 'ref-model' || UI.modal.type === 'ref-lens')) openModal(UI.modal.type, UI.modal.data);
          
          
          
          });
          
          
          
          break;
        }
        case 'toggle-annotations':
          
          
          
          UI.previewAnnotations = !UI.previewAnnotations;
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'toggle-wireframe':
          
          
          
          UI.previewWire = !UI.previewWire;
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'set-sensor-format':
          
          
          
          setSensorFormat(el.dataset.value);
          
          
          
          break;
        case 'lens-step': {
          
          
          
          UI.lensStep = clamp(Number(el.dataset.step) || 1, 1, 3);
          
          
          
          if (game.drafts.lens) game.drafts.lens._uiStep = UI.lensStep;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        }
        case 'lens-next':
          
          
          
          if (UI.lensStep >= 3) { openModal('launch-confirm', { kind: 'lens' }); break; }
          
          
          
          UI.lensStep += 1;
          
          
          
          if (game.drafts.lens) game.drafts.lens._uiStep = UI.lensStep;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        case 'lens-prev':
          
          
          
          UI.lensStep = Math.max(1, UI.lensStep - 1);
          
          
          
          if (game.drafts.lens) game.drafts.lens._uiStep = UI.lensStep;
          
          
          
          persist();
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        case 'lens-view':
          
          
          
          UI.lensView = el.dataset.view === 'cutaway' ? 'cutaway' : 'side';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'set-lens-mount': {
          
          
          
          const lens = game.drafts.lens;
          
          
          
          if (!lens) break;
          
          
          
          const mount = el.dataset.mount;
          
          
          
          const def = D.MOUNTS[mount];
          
          
          
          if (!def) break;
          
          
          
          lens.mount.type = mount;
          
          
          
          const currentCov = D.SENSOR_FORMATS[lens.coverage];
          
          
          
          if (!currentCov || currentCov.index > def.maxFormat) lens.coverage = lensCoverageForMount(mount);
          
          
          
          commitChange();
          
          
          
          break;
        }
        case 'lens-template':
          
          
          
          applyLensTemplate(el.dataset.template);
          
          
          
          break;
        case 'lens-focal-preset': {
          
          
          
          const lens = game.drafts.lens;
          
          
          
          if (!lens) break;
          
          
          
          const a = Number(el.dataset.min), b = Number(el.dataset.max);
          
          
          
          lens.focalMin = a; lens.focalMax = b;
          
          
          
          commitChange();
          
          
          
          break;
        }
        case 'counter': {
          
          
          
          const scope = currentStudioScope(el);
          
          
          
          const obj = objectForScope(scope);
          
          
          
          if (!obj || !el.dataset.path) break;
          
          
          
          const delta = Number(el.dataset.delta) || 0;
          
          
          
          const raw = el.dataset.path.split('.').reduce((o, k) => o && o[k], obj);
          
          
          
          const next = Math.max(0, (Number(raw) || 0) + delta);
          
          
          
          setDeepValue(obj, el.dataset.path, next);
          
          
          
          commitChange();
          
          
          
          break;
        }
        case 'open-lens-launch-review':
          
          
          
          openModal('launch-confirm', { kind: 'lens' });
          
          
          
          break;
        case 'set-lens-mount-check':
          
          
          
          break;
        case 'product-tab':
          
          
          
          UI.productTab = el.dataset.tab || 'cameras';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'filter-products':
          
          
          
          UI.productFilter = el.dataset.filter || 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'open-product':
          
          
          
          openModal('product', { id: el.dataset.id });
          
          
          
          break;
        case 'open-report':
          
          
          
          if (game.lastReport) openModal('report', { report: game.lastReport });
          
          
          
          break;
        case 'report-finance':
          
          
          
          closeModal();
          
          
          
          UI.page = 'finance';
          
          
          
          renderApp();
          
          
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          
          
          break;
        case 'launch-success-products':
          
          
          
          closeModal();
          
          
          
          UI.page = 'products';
          
          
          
          renderApp();
          
          
          
          break;
        case 'save-product-price': {
          
          
          
          const val = Number(document.getElementById('product-price-input')?.value);
          
          
          
          const res = E.setProductPrice(game, el.dataset.id, val);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          refreshProductModal(el.dataset.id);
          
          
          
          showToast('售价已更新。', 'good');
          
          
          
          break;
        }
        case 'save-kit-lens': {
          
          
          
          const val = document.getElementById('product-kit-select')?.value || '';
          
          
          
          const res = E.setKitLens(game, el.dataset.id, val || null);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          refreshProductModal(el.dataset.id);
          
          
          
          showToast(val ? '套机镜头已设置。' : '已切换为仅机身销售。', 'good');
          
          
          
          break;
        }
        case 'discontinue-product': {
          
          
          
          const p = findGameProduct(el.dataset.id);
          
          
          
          if (!p) break;
          
          
          
          askConfirm({
          
          
          
            title: `停产 ${p.name}？`, eyebrow: 'DISCONTINUE / 停产', tone: 'danger',
          
          
          
            messageHtml: `<div class="callout-title">${icon('alert')} 从产品线退役</div>库存仍会继续销售，但不会再自动生产。现有用户售后与固件支持仍会继续。`,
          
          
          
            confirmLabel: '确认停产', onConfirm: () => {
          
          
          
              const res = E.discontinueProduct(game, p.id);
          
          
          
              if (!res.ok) { showToast(res.error, 'bad'); return; }
          
          
          
              persist();
          
          
          
              renderApp({ preserveScroll: true });
          
          
          
              refreshProductModal(p.id);
          
          
          
              showToast(`${p.name} 已停产。`, 'info');
          
          
          
            }
          
          
          
          });
          
          
          
          break;
        }
        case 'relist-product': {
          
          
          
          const p = findGameProduct(el.dataset.id);
          
          
          
          if (!p) break;
          
          
          
          const res = E.toggleProductStatus(game, p.id);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          refreshProductModal(p.id);
          
          
          
          showToast('产品已重新上架。', 'good');
          
          
          
          break;
        }
        case 'start-research': {
          
          
          
          const res = E.startResearch(game, el.dataset.tech);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist(true);
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已立项：${D.TECHS[el.dataset.tech].name} Lv.${res.project.targetLevel}。`, 'good', '研发启动');
          
          
          
          break;
        }
        case 'cancel-research': {
          
          
          
          const p = (game.company.projects || []).find(x => x.id === el.dataset.id);
          
          
          
          if (!p) break;
          
          
          
          askConfirm({
          
          
          
            title: `中止 ${p.techName} 研发？`, eyebrow: 'ABORT R&D / 中止项目',
          
          
          
            messageHtml: `<div class="callout-title">${icon('info')} 35% 预算回收</div>项目剩余进度将丢失，但团队会保留部分成果。是否继续？`,
          
          
          
            confirmLabel: '中止项目', onConfirm: () => {
          
          
          
              const res = E.cancelResearch(game, p.id);
          
          
          
              if (!res.ok) { showToast(res.error, 'bad'); return; }
          
          
          
              persist();
          
          
          
              renderApp({ preserveScroll: true });
          
          
          
              showToast(`项目已中止，回收 ${money(res.refund)}。`, 'info');
          
          
          
            }
          
          
          
          });
          
          
          
          break;
        }
        case 'hire-staff': {
          
          
          
          const res = E.hireStaff(game, el.dataset.role);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已招聘 1 名${D.STAFF_ROLES[el.dataset.role].name}。`, 'good');
          
          
          
          break;
        }
        case 'fire-staff': {
          
          
          
          const res = E.fireStaff(game, el.dataset.role);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已解雇 1 名${D.STAFF_ROLES[el.dataset.role].name}。`, 'info');
          
          
          
          break;
        }
        case 'set-odm': {
          
          
          
          const res = E.setManufacturing(game, 'partner', el.dataset.odm);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast('制造伙伴已切换。现有产品的制造成本已锁定。', 'good');
          
          
          
          break;
        }
        case 'set-self-manufacturing': {
          
          
          
          const res = E.setManufacturing(game, 'self');
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast('已切换到自有产线。', 'good');
          
          
          
          break;
        }
        case 'upgrade-factory': {
          
          
          
          const res = E.upgradeFactory(game);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`工厂升级完成：${D.FACTORY_LEVELS[res.level].name}。`, 'good');
          
          
          
          break;
        }
        case 'select-supplier': {
          
          
          
          const res = E.selectSensorSupplier(game, el.dataset.supplier);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`传感器供应商已切换为 ${D.SENSOR_SUPPLIERS[el.dataset.supplier].name}。`, 'good');
          
          
          
          break;
        }
        case 'chip-tab':
          UI.chipTab = ['cmos', 'af', 'procurement'].includes(el.dataset.tab) ? el.dataset.tab : 'cmos';
          renderApp({ preserveScroll: true });
          break;
        case 'open-chip-program': {
          const kind = el.dataset.kind === 'af' ? 'af' : 'cmos';
          UI.chipDraft = UI.chipDraft || {};
          let base;
          if (kind === 'af') {
            base = { arch: 'fullpixel', tier: 'advanced', budget: 'balanced' };
          } else {
            const targetId = D.CMOS_TARGETS[el.dataset.target] ? el.dataset.target : 'ff';
            const target = D.CMOS_TARGETS[targetId];
            base = { target: targetId, mp: target.mpOptions[0], type: (game.company.tech.sensor || 1) >= 4 ? 'stacked' : 'bsi', budget: 'balanced' };
          }
          UI.chipDraft[kind] = Object.assign(base, UI.chipDraft[kind] || {});
          if (el.dataset.target && D.CMOS_TARGETS[el.dataset.target]) {
            const target = D.CMOS_TARGETS[el.dataset.target];
            UI.chipDraft[kind].target = target.id;
            UI.chipDraft[kind].mp = target.mpOptions.includes(Number(UI.chipDraft[kind].mp)) ? Number(UI.chipDraft[kind].mp) : target.mpOptions[0];
          }
          openModal('chip-program', { kind });
          break;
        }
        case 'chip-config': {
          const kind = el.dataset.kind === 'af' ? 'af' : 'cmos';
          UI.chipDraft = UI.chipDraft || {};
          const cfg = Object.assign({}, UI.chipDraft[kind] || {});
          cfg[el.dataset.path] = el.dataset.value;
          if (el.dataset.path === 'target') {
            const target = D.CMOS_TARGETS[cfg.target];
            if (target && !target.mpOptions.includes(Number(cfg.mp))) cfg.mp = target.mpOptions[0];
          }
          UI.chipDraft[kind] = cfg;
          renderModal();
          break;
        }
        case 'start-chip-program': {
          const kind = el.dataset.kind === 'af' ? 'af' : 'cmos';
          const cfg = (UI.chipDraft && UI.chipDraft[kind]) || {};
          const res = E.startChipProgram(game, kind, cfg);
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          persist();
          closeModal();
          renderApp({ preserveScroll: true });
          showToast(`${res.estimate.name} 已立项，预计 ${res.estimate.months} 个月完成。`, 'good', '芯片立项');
          break;
        }
        case 'cancel-chip-program': {
          const program = (game.company.chipPrograms || []).find(p => p.id === el.dataset.id);
          if (!program) break;
          game.company.chipPrograms = game.company.chipPrograms.filter(p => p.id !== program.id);
          persist();
          renderApp({ preserveScroll: true });
          showToast(`${program.name} 已中止，前期投入不会退回。`, 'warn');
          break;
        }
        case 'upgrade-chip-lab': {
          const res = E.upgradeChipLab(game);
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          persist();
          renderApp({ preserveScroll: true });
          showToast(`芯片实验室升级至 Lv.${res.level}，并行槽位与规格上限提高。`, 'good', '实验室升级');
          break;
        }
        case 'chip-use': {
          const kind = el.dataset.kind === 'cmos' ? 'cmos' : 'af';
          const all = kind === 'cmos' ? (game.company.cmosChips || []) : (game.company.afChips || []);
          const chosen = all.find(c => c.id === el.dataset.id) || all[0];
          if (!chosen) break;
          const res = E.setChipStrategy(game, kind, 'inhouse');
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          if (game.drafts.camera) {
            if (kind === 'cmos') E.applyCmosChipToDraft(game.drafts.camera, chosen);
            else E.applyAfChipToDraft(game.drafts.camera, chosen);
          }
          persist();
          renderApp({ preserveScroll: true });
          showToast(`${chosen.name} 已设为新设计的默认芯片。`, 'good', '芯片策略');
          break;
        }
        case 'set-chip-source': {
          const kind = el.dataset.kind === 'af' ? 'af' : 'cmos';
          const source = el.dataset.source === 'inhouse' ? 'inhouse' : 'procure';
          const draft = game.drafts.camera;
          if (!draft) break;
          draft.chip = draft.chip || { cmosSource: 'procure', afSource: 'procure' };
          const chips = kind === 'cmos' ? (game.company.cmosChips || []) : (game.company.afChips || []);
          if (source === 'inhouse' && !chips.length) {
            showToast('还没有可用的自研芯片，请先去芯片实验室完成一个项目。', 'bad');
            break;
          }
          if (kind === 'cmos') {
            draft.chip.cmosSource = source;
            if (source === 'inhouse') {
              const best = E.bestCmosChip(game.company, draft.sensor.format, draft.sensor.mp, draft.sensor.type) || chips[0];
              draft.chip.cmosId = best.id;
              if (!E.bestCmosChip(game.company, draft.sensor.format, draft.sensor.mp, draft.sensor.type)) {
                showToast('自研 CMOS 的规格与当前传感器不一致：可点「采用该芯片规格」或先调整画幅/结构。', 'warn');
              }
            } else {
              draft.chip.cmosId = null;
            }
          } else {
            draft.chip.afSource = source;
            draft.chip.afId = source === 'inhouse' ? chips[0].id : null;
          }
          persist();
          renderApp({ preserveScroll: true });
          break;
        }
        case 'adopt-cmos-chip': {
          const draft = game.drafts.camera;
          if (!draft) break;
          const all = game.company.cmosChips || [];
          const chip = all.find(c => c.id === el.dataset.id)
            || E.bestCmosChip(game.company, draft.sensor.format, draft.sensor.mp, draft.sensor.type)
            || all[0];
          if (!chip) break;
          E.applyCmosChipToDraft(draft, chip);
          persist();
          renderApp({ preserveScroll: true });
          showToast(`已采用 ${chip.name} 的 ${chip.mp}MP ${D.SENSOR_TYPES[chip.type].name} 规格。`, 'good', '自研 CMOS');
          break;
        }
        case 'adopt-af-chip': {
          const draft = game.drafts.camera;
          if (!draft) break;
          const all = game.company.afChips || [];
          const chip = all.find(c => c.id === el.dataset.id) || all[0];
          if (!chip) break;
          E.applyAfChipToDraft(draft, chip);
          persist();
          renderApp({ preserveScroll: true });
          showToast(`已使用 ${chip.name}，对焦加成 +${chip.bonus}。`, 'good', '自研 AF');
          break;
        }
        case 'open-launch-planner': {
          const kind = el.dataset.kind === 'lens' ? 'lens' : 'camera';
          const draft = kind === 'camera' ? game.drafts.camera : game.drafts.lens;
          if (!draft) { showToast('请先完成一个设计草稿。', 'bad'); break; }
          E.normalizeLaunchEvent(draft, game.company);
          openModal('launch-event', { kind });
          break;
        }
        case 'event-set': {
          const kind = el.dataset.kind === 'lens' ? 'lens' : 'camera';
          const draft = kind === 'camera' ? game.drafts.camera : game.drafts.lens;
          if (!draft) break;
          if (el.dataset.path === 'campaign') draft.campaign = el.dataset.value;
          else {
            draft.launchEvent = draft.launchEvent || {};
            draft.launchEvent[el.dataset.path] = el.dataset.value;
          }
          persist();
          renderModal();
          break;
        }
        case 'event-preorder': {
          const kind = el.dataset.kind === 'lens' ? 'lens' : 'camera';
          const draft = kind === 'camera' ? game.drafts.camera : game.drafts.lens;
          if (!draft) break;
          draft.launchEvent = draft.launchEvent || {};
          draft.launchEvent.preorder = !draft.launchEvent.preorder;
          persist();
          renderModal();
          break;
        }
        case 'event-confirm': {
          persist();
          closeModal();
          renderApp({ preserveScroll: true });
          showToast('发布会方案已保存，可在上市评审中继续。', 'good', '发布会');
          break;
        }
        case 'event-confirm-launch': {
          const kind = el.dataset.kind === 'lens' ? 'lens' : 'camera';
          persist();
          closeModal();
          openModal('launch-confirm', { kind });
          break;
        }
        case 'launch-review':
          openModal('launch-confirm', { kind: el.dataset.kind === 'lens' ? 'lens' : 'camera' });
          break;
        case 'open-launch-report':
          openModal('launch-report', { id: el.dataset.id });
          break;
        case 'toggle-auto-production': {
          
          
          
          const p = findGameProduct(el.dataset.id);
          
          
          
          if (!p) break;
          
          
          
          p.autoProduction = !p.autoProduction;
          
          
          
          if (!p.autoProduction && !p.monthlyProduction) p.monthlyProduction = Math.max(100, Math.round((p.lastForecast || 500) / 100) * 100);
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        }
        case 'supply-tab':
          
          
          
          UI.supplyTab = el.dataset.tab || 'production';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'market-tab':
          
          
          
          UI.marketTab = el.dataset.tab || 'overview';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'market-filter':
          
          
          
          UI.marketCategory = el.dataset.filter || 'all';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'market-sort':
          
          
          
          UI.marketSort = el.dataset.sort || 'new';
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'set-marketing-budget': {
          
          
          
          game.company.marketingBudget = Math.max(0, Math.round(Number(el.dataset.value) || 0));
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        }
        case 'run-campaign': {
          
          
          
          const res = E.runBrandCampaign(game, el.dataset.campaign);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist(true);
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`${res.campaign.name} 已执行：品牌曝光 +${res.awareGain.toFixed(1)}，口碑 +${res.repGain.toFixed(1)}。`, 'good', '营销战役');
          
          
          
          break;
        }
        case 'take-loan': {
          
          
          
          const res = E.takeLoan(game, Number(el.dataset.amount));
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已获得 ${money(res.amount)} 贷款。`, 'good', '融资到账');
          
          
          
          break;
        }
        case 'custom-loan': {
          
          
          
          const input = document.getElementById('loan-amount');
          
          
          
          const amount = Number(input?.value || 0);
          
          
          
          if (!amount) { showToast('请输入贷款金额。', 'bad'); break; }
          
          
          
          const res = E.takeLoan(game, amount);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已获得 ${money(res.amount)} 贷款。`, 'good', '融资到账');
          
          
          
          break;
        }
        case 'repay-loan': {
          
          
          
          const amount = Math.min(game.company.debt, game.company.cash);
          
          
          
          if (!amount) { showToast('没有可偿还的现金或负债。', 'bad'); break; }
          
          
          
          const res = E.repayLoan(game, amount);
          
          
          
          if (!res.ok) { showToast(res.error, 'bad'); break; }
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          showToast(`已偿还 ${money(res.amount)} 贷款。`, 'good');
          
          
          
          break;
        }
        case 'save-game': {
          
          
          
          const r = E.saveGame(game);
          
          
          
          if (r.ok) { updateSaveState('saved'); showToast('游戏已保存到本地。', 'good'); }
          
          
          
          else showToast(r.error, 'bad');
          
          
          
          break;
        }
        case 'export-save':
          
          
          
          downloadSave();
          
          
          
          break;
        case 'new-game-confirm':
          
          
          
          askConfirm({
          
          
          
            title: '开始新游戏？', eyebrow: 'NEW GAME / 重新开始', tone: 'danger',
          
          
          
            messageHtml: `<div class="callout-title">${icon('alert')} 当前存档将被删除</div>这会清除你在 ${esc(E.monthLabel(game.monthIndex))} 的全部进度。若要保留当前公司，请先导出存档。`,
          
          
          
            confirmLabel: '删除并重新开始', onConfirm: () => resetToBoot(true)
          
          
          
          });
          
          
          
          break;
        case 'return-title':
          
          
          
          returnToTitle();
          
          
          
          break;
        case 'toggle-motion':
          
          
          
          game.settings.reducedMotion = !game.settings.reducedMotion;
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'toggle-tips':
          
          
          
          game.settings.showTips = !game.settings.showTips;
          
          
          
          persist();
          
          
          
          renderApp({ preserveScroll: true });
          
          
          
          break;
        case 'confirm-modal': {
          
          
          
          const fn = UI.modal && UI.modal.data && UI.modal.data.onConfirm;
          
          
          
          closeModal();
          
          
          
          if (typeof fn === 'function') setTimeout(fn, 60);
          
          
          
          break;
        }
        case 'welcome-design':
          
          
          
          closeModal();
          
          
          
          setTimeout(() => openModal('new-camera'), 100);
          
          
          
          break;
        case 'confirm-launch-camera':
          
          
          
          confirmLaunch('camera');
          
          
          
          break;
        case 'confirm-launch-lens':
          
          
          
          confirmLaunch('lens');
          
          
          
          break;
        case 'noop':
          
          
          
          break;
        default:
          
          
          
          console.warn('Unknown action', action);
      }
    } catch (e) {
      console.error('Action failed:', action, e);
      showToast('操作失败：' + (e.message || '未知错误'), 'bad');
    }
  }

  function confirmLaunch(kind) {
    if (!game || processing) return;
    processing = true;
    try {
      let expected = 0, result;
      if (kind === 'camera') {
        const draft = game.drafts.camera;
        if (!draft) return;
        expected = E.previewCameraLaunch(game, draft).demand.units;
        result = E.launchCamera(game, draft);
      } else {
        const draft = game.drafts.lens;
        if (!draft) return;
        expected = E.previewLensLaunch(game, draft).demand.units;
        result = E.launchLens(game, draft);
      }
      if (!result.ok) {
        showToast(result.error || '上市失败。', 'bad');
        return;
      }
      persist(true);
      UI.page = 'products';
      UI.productTab = kind === 'camera' ? 'cameras' : 'lenses';
      renderApp();
      openModal('launch-success', {
        kind, product: result.product, launchCost: result.launchCost,
        expected, achieved: result.achieved || []
      });
    } catch (e) {
      console.error(e);
      showToast('上市失败：' + (e.message || '未知错误'), 'bad');
    } finally {
      processing = false;
    }
  }

  function advanceMonth() {
    if (!game || processing) return;
    processing = true;
    try {
      closeModal();
      const report = E.advanceMonth(game);
      if (!report) { showToast('月份推进失败。', 'bad'); return; }
      persist(true);
      renderApp({ preserveScroll: true });
      setTimeout(() => openModal('report', { report }), 120);
    } catch (e) {
      console.error(e);
      showToast('经营结算失败：' + (e.message || '未知错误'), 'bad');
    } finally {
      processing = false;
    }
  }

  // ---------- events ----------
  function handleBootClick(el) {
    if (!el) return false;
    if (el.dataset.bootMode) {
      UI.boot.mode = el.dataset.bootMode;
      renderBoot();
      return true;
    }
    if (el.dataset.bootCompany) {
      UI.boot.companyId = el.dataset.bootCompany;
      renderBoot();
      return true;
    }
    if (el.dataset.bootArchetype) {
      UI.boot.startup.archetype = el.dataset.bootArchetype;
      renderBoot();
      return true;
    }
    if (el.dataset.bootStyle) {
      const style = D.STARTUP_STYLES[el.dataset.bootStyle];
      UI.boot.startup.style = el.dataset.bootStyle;
      if (style) {
        UI.boot.startup.accentColor = style.design.accent;
        UI.boot.startup.mainColor = style.design.mainColor;
      }
      renderBoot();
      return true;
    }
    if (el.dataset.bootAccent) {
      UI.boot.startup.accentColor = el.dataset.bootAccent;
      renderBoot();
      return true;
    }
    if (el.dataset.bootAudience) {
      UI.boot.startup.targetSegment = el.dataset.bootAudience;
      renderBoot();
      return true;
    }
    if (el.dataset.bootDifficulty) {
      UI.boot.startup.difficulty = el.dataset.bootDifficulty;
      renderBoot();
      return true;
    }
    return false;
  }

  function onDocumentClick(event) {
    if (!event.target.closest) return;
    const bootEl = event.target.closest('[data-boot-mode],[data-boot-company],[data-boot-archetype],[data-boot-style],[data-boot-accent],[data-boot-audience],[data-boot-difficulty]');
    if (bootEl) {
      event.preventDefault();
      if (handleBootClick(bootEl)) return;
    }
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'modal-backdrop' && event.target !== actionEl) return;
    if (actionEl.hasAttribute('disabled')) return;
    handleAction(action, actionEl, event);
  }

  function onDocumentInput(event) {
    const t = event.target;
    if (t.dataset.bootField) {
      UI.boot.startup[t.dataset.bootField] = t.value;
      return;
    }
    if (t.hasAttribute('data-marketing-budget')) {
      if (!game) return;
      game.company.marketingBudget = Math.max(0, Number(t.value) || 0);
      updateRangeVisual(t);
      const display = document.querySelector('.budget-display b');
      if (display) display.textContent = money(game.company.marketingBudget);
      const top = document.querySelector('.budget-slider-row .slider-top b');
      if (top) top.textContent = money(game.company.marketingBudget);
      persist();
      return;
    }
    if (t.hasAttribute('data-path') && game && (UI.page === 'studio-camera' || UI.page === 'studio-lens')) {
      const scope = currentStudioScope(t);
      const draft = objectForScope(scope);
      if (!draft) return;
      const value = parseFieldValue(t);
      if (value == null) return;
      setDeepValue(draft, t.dataset.path, value);
      updateRangeVisual(t);
      syncPathInputs(t.dataset.path, value, t);
      scheduleStudioLive(scope);
      persist();
      return;
    }
    if (t.hasAttribute('data-color-path') && game) {
      return;
    }
  }

  function onDocumentChange(event) {
    const t = event.target;
    if (t.id === 'save-file-input') {
      const file = t.files && t.files[0];
      handleSaveFile(file);
      t.value = '';
      return;
    }
    if (t.hasAttribute('data-production-input') && game) {
      const p = findGameProduct(t.dataset.id);
      if (p) {
        p.autoProduction = false;
        p.monthlyProduction = Math.max(0, Math.round(Number(t.value) || 0));
        persist();
        showToast(`${p.name} 已切换为手动生产 ${p.monthlyProduction.toLocaleString('zh-CN')} 台/月。`, 'info');
      }
      return;
    }
    if (t.hasAttribute('data-select-kit') && game && game.drafts.camera) {
      game.drafts.camera.kitLensId = t.value || null;
      persist();
      renderApp({ preserveScroll: true });
      return;
    }
    if (t.hasAttribute('data-marketing-budget') && game) {
      renderApp({ preserveScroll: true });
      return;
    }
    if (t.hasAttribute('data-color-path') && game && (UI.page === 'studio-camera' || UI.page === 'studio-lens')) {
      const scope = currentStudioScope(t);
      const draft = objectForScope(scope);
      if (draft) {
        setDeepValue(draft, t.dataset.colorPath, t.value);
        persist();
        renderApp({ preserveScroll: true });
      }
      return;
    }
    if (t.hasAttribute('data-path') && game && (UI.page === 'studio-camera' || UI.page === 'studio-lens')) {
      if (t.type === 'range') return;
      const scope = currentStudioScope(t);
      const draft = objectForScope(scope);
      if (!draft) return;
      const path = t.dataset.path;
      let value = parseFieldValue(t);
      if (value == null) {
        const current = path.split('.').reduce((o, k) => o && o[k], draft);
        t.value = current == null ? '' : current;
        return;
      }
      if (t.type === 'number') {
        if (t.min !== '' && value < Number(t.min)) value = Number(t.min);
        if (t.max !== '' && value > Number(t.max)) value = Number(t.max);
        t.value = value;
      }
      setDeepValue(draft, path, value);
      syncPathInputs(path, value, t);
      persist();
      scheduleStudioLive(scope);
      if (t.tagName === 'SELECT') renderApp({ preserveScroll: true });
      return;
    }
  }

  function onDocumentKeydown(event) {
    if (event.key === 'Escape') {
      if (UI.modal) { closeModal(); return; }
      if (UI.sidebarOpen) {
        UI.sidebarOpen = false;
        appEl.classList.remove('sidebar-open');
      }
    }
  }

  function bindEvents() {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('input', onDocumentInput);
    document.addEventListener('change', onDocumentChange);
    document.addEventListener('keydown', onDocumentKeydown);
    window.addEventListener('beforeunload', () => {
      if (game) E.saveGame(game);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && game) E.saveGame(game);
    });
  }

  // ---------- init ----------
  function init() {
    UI.savePeek = E.peekSave();
    renderBoot();
    bindEvents();
    window.__FRAME__ = {
      get game() { return game; },
      setGame(g) { game = g; },
      UI, renderApp, renderBoot, openModal, closeModal,
      actions: { handleAction, startCameraDraft }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
