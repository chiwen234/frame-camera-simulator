/* =========================================================
   FRAME — live industrial design renderer
   All camera previews are generated as SVG from the design data.
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const E = window.GameEngine;

  function escapeXML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, f) { const n = Number(v); return Number.isFinite(n) ? n : f; }
  function safeColor(c, fallback) { return /^#[0-9a-fA-F]{6}$/.test(String(c || '')) ? c : fallback; }
  function lighten(c, amt) { return E.shade(safeColor(c, '#222222'), amt); }
  function darken(c, amt) { return E.shade(safeColor(c, '#222222'), -amt); }
  function id(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 10); }
  function pickDef(obj, key, fallback) { return obj && obj[key] ? obj[key] : fallback; }

  function buildContext(design, company, options) {
    options = options || {};
    const body = design.body || {};
    const colors = design.colors || {};
    const materials = design.materials || {};
    const screen = design.screen || {};
    const viewfinder = design.viewfinder || {};
    const mount = design.mount || {};
    const controls = design.controls || {};
    const details = design.details || {};
    const accessories = design.accessories || {};
    const sensor = design.sensor || {};
    const W = clamp(num(body.width, 136), 40, 260);
    const H = clamp(num(body.height, 96), 30, 230);
    const Dp = clamp(num(body.depth, 70), 20, 180);
    const bodyType = D.BODY_TYPES[body.type] || D.BODY_TYPES.mirrorless;
    const silhouette = D.SILHOUETTES[body.silhouette] || D.SILHOUETTES.rounded;
    const topStyle = D.TOP_STYLES[body.top] || D.TOP_STYLES.flat;
    const frontStyle = D.FRONT_STYLES[body.front] || D.FRONT_STYLES.straight;
    const material = D.MATERIALS[materials.body] || D.MATERIALS.magnesium;
    const finish = D.FINISHES[materials.finish] || D.FINISHES.matte;
    const frame = D.FRAME_TYPES[materials.frame] || D.FRAME_TYPES.metal;
    const topPlate = D.TOP_PLATES[materials.topPlate] || D.TOP_PLATES.metal;
    const screenType = D.SCREEN_TYPES[screen.type] || D.SCREEN_TYPES.fixed;
    const vfType = D.VIEWFINDER_TYPES[viewfinder.type] || D.VIEWFINDER_TYPES.none;
    const mountDef = D.MOUNTS[mount.type] || D.MOUNTS.E;
    const ringColor = (D.RING_COLORS.find(r => r.id === mount.ringColor) || D.RING_COLORS[0]).hex;
    const ringMat = D.RING_MATERIALS[mount.ringMaterial] || D.RING_MATERIALS.aluminum;
    const palette = {
      main: safeColor(colors.main, '#252727'),
      top: safeColor(colors.top, lighten(colors.main || '#252727', 0.08)),
      grip: safeColor(colors.grip, darken(colors.main || '#252727', 0.03)),
      side: safeColor(colors.side, darken(colors.main || '#252727', 0.05)),
      secondary: safeColor(colors.secondary, lighten(colors.main || '#252727', 0.15)),
      accent: safeColor(colors.accent, company && company.color || '#c69a54'),
      nameplate: safeColor(colors.nameplate, '#d6d2c7'),
      button: safeColor(colors.button, lighten(colors.main || '#252727', 0.16)),
      dial: safeColor(colors.dial, lighten(colors.main || '#252727', 0.12)),
      ink: '#1a1d18',
      paper: '#f1eee5'
    };
    const wireframe = !!options.wireframe;
    if (wireframe) {
      palette.main = '#f4f1e8';
      palette.top = '#f4f1e8';
      palette.grip = '#f4f1e8';
      palette.side = '#efebe0';
      palette.secondary = '#f4f1e8';
      palette.button = '#eae6da';
      palette.dial = '#eae6da';
      palette.nameplate = '#f4f1e8';
      palette.ink = '#20231e';
    }
    let scale = Math.min(4.55, 640 / W, 425 / H);
    let bw = W * scale;
    let bh = H * scale;
    const sideScreen = screenType.id === 'sideflip' || screenType.id === 'fold';
    let cx = 500 + (sideScreen && !options.compact ? 38 : 0);
    let bodyX = cx - bw / 2;
    let bodyY = 396 - bh / 2;
    if (options.compact) {
      scale = Math.min(4.55, 620 / W, 410 / H);
      bw = W * scale; bh = H * scale;
      cx = 500; bodyX = cx - bw / 2; bodyY = 382 - bh / 2;
    }
    const uid = id(options.idPrefix || 'cam');
    return {
      design, company, options, body, colors, materials, screen, viewfinder, mount, controls, details, accessories,
      sensor, bodyType, silhouette, topStyle, frontStyle, material, finish, frame, topPlate, screenType, vfType,
      mountDef, ringColor, ringMat, palette, wireframe, W, H, Dp, scale, bw, bh, cx, bodyX, bodyY, uid,
      compact: !!options.compact, view: options.view || 'front'
    };
  }

  // ---------- path helpers ----------
  function roundedPath(x, y, w, h, r) {
    r = clamp(r, 0, Math.min(w, h) / 2);
    if (r <= 0.4) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
    return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
  }
  function angularPath(x, y, w, h, c) {
    c = clamp(c, 0, Math.min(w, h) * 0.22);
    return `M${x + c},${y} H${x + w - c} L${x + w},${y + c} V${y + h - c} L${x + w - c},${y + h} H${x + c} L${x},${y + h - c} V${y + c} Z`;
  }
  function bodyPath(ctx, x, y, w, h, adjust) {
    const corner = ctx.silhouette.corner;
    const isAngular = ctx.silhouette.id === 'angular' || ctx.silhouette.id === 'cage' || ctx.silhouette.id === 'modular';
    const roundness = num(ctx.body.roundness, 30);
    let r = Math.min(w, h) * (corner * 0.8 + roundness / 520);
    if (ctx.bodyType.id === 'action') r = Math.min(w, h) * 0.14;
    if (ctx.bodyType.id === 'compact') r = Math.min(w, h) * 0.24;
    if (isAngular) return angularPath(x, y, w, h, Math.min(w, h) * (0.04 + roundness / 1600));
    return roundedPath(x, y, w, h, r + (adjust || 0));
  }
  function ellipseKnurl(cx, cy, r, count, color, width) {
    let out = '';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * (r * 0.78), y1 = cy + Math.sin(a) * (r * 0.78);
      const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
      out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${width || 1.4}" opacity=".72"/>`;
    }
    return out;
  }

  // ---------- defs ----------
  function buildDefs(ctx, options) {
    const p = ctx.palette;
    const u = ctx.uid;
    const metalBase = ctx.wireframe ? p.paper : '#c3c1b9';
    const mainLight = ctx.wireframe ? p.paper : lighten(p.main, 0.12);
    const mainDark = ctx.wireframe ? p.paper : darken(p.main, 0.11);
    const sideDark = ctx.wireframe ? p.paper : darken(p.side, 0.14);
    const topLight = ctx.wireframe ? p.paper : lighten(p.top, 0.1);
    const topDark = ctx.wireframe ? p.paper : darken(p.top, 0.13);
    const gripLight = ctx.wireframe ? p.paper : lighten(p.grip, 0.08);
    const gripDark = ctx.wireframe ? p.paper : darken(p.grip, 0.12);
    const accent = ctx.wireframe ? p.ink : p.accent;
    const texture = ctx.material.id;
    const pat = `pat-${u}`;
    let texturePattern = '';
    if (!ctx.wireframe) {
      if (texture === 'leather' || texture === 'skin' || ctx.finish.id === 'leathergrain') {
        texturePattern = `<pattern id="${pat}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 2 Q2 0 5 2 T10 2 M0 7 Q3 5 6 7 T10 7" fill="none" stroke="#fff" stroke-width=".7" opacity=".13"/><circle cx="2.4" cy="4.5" r=".6" fill="#000" opacity=".12"/><circle cx="7.8" cy="8.3" r=".5" fill="#000" opacity=".1"/></pattern>`;
      } else if (ctx.finish.id === 'brushed' || ctx.finish.id === 'anodized') {
        texturePattern = `<pattern id="${pat}" width="9" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h9 M0 3h9" stroke="#fff" stroke-width=".5" opacity=".105"/></pattern>`;
      } else if (ctx.material.id === 'carbon') {
        texturePattern = `<pattern id="${pat}" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0l12 12M-3 9L9 -3M3 15L15 3" stroke="#fff" stroke-width="1.1" opacity=".08"/><path d="M0 12L12 0M-3 3L9 15M3 -3L15 9" stroke="#000" stroke-width=".8" opacity=".12"/></pattern>`;
      } else if (ctx.finish.id === 'rubberized' || ctx.material.id === 'rubber' || ctx.frame.id === 'full_rubber') {
        texturePattern = `<pattern id="${pat}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#fff" opacity=".1"/><circle cx="5" cy="5" r=".5" fill="#000" opacity=".12"/></pattern>`;
      } else {
        texturePattern = `<pattern id="${pat}" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="#fff" stroke-width=".3" opacity=".045"/><circle cx="2" cy="3" r=".42" fill="#fff" opacity=".07"/></pattern>`;
      }
    }
    const screenW = ctx.screen.size && ctx.screen.size > 0 ? ctx.screen.size : 3.0;
    const liveViewDefs = `
      <linearGradient id="lv-sky-${u}" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stop-color="#536e80"/><stop offset=".45" stop-color="#d89c74"/><stop offset="1" stop-color="#ead4aa"/>
      </linearGradient>
      <linearGradient id="lv-fg-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#384843"/><stop offset="1" stop-color="#151d1b"/>
      </linearGradient>
      <radialGradient id="lv-sun-${u}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#ffe7ac" stop-opacity=".97"/><stop offset=".6" stop-color="#ffc977" stop-opacity=".3"/><stop offset="1" stop-color="#ffc977" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="lv-haze-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d8d4b9" stop-opacity=".2"/><stop offset=".5" stop-color="#a7d0d0" stop-opacity=".08"/><stop offset="1" stop-color="#2f423f" stop-opacity=".18"/>
      </linearGradient>
    `;
    return `<defs>
      <linearGradient id="body-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${mainLight}"/><stop offset=".3" stop-color="${p.main}"/><stop offset=".72" stop-color="${mainDark}"/><stop offset="1" stop-color="${darken(p.main, 0.18)}"/>
      </linearGradient>
      <linearGradient id="bodyVert-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${ctx.wireframe ? p.paper : lighten(p.main, 0.05)}"/><stop offset=".7" stop-color="${p.main}"/><stop offset="1" stop-color="${ctx.wireframe ? p.paper : darken(p.main, 0.2)}"/>
      </linearGradient>
      <linearGradient id="top-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${topLight}"/><stop offset=".55" stop-color="${p.top}"/><stop offset="1" stop-color="${topDark}"/>
      </linearGradient>
      <linearGradient id="topVert-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${topLight}"/><stop offset=".35" stop-color="${p.top}"/><stop offset="1" stop-color="${topDark}"/>
      </linearGradient>
      <linearGradient id="grip-${u}" x1="0" y1="0" x2="1" y2=".9">
        <stop offset="0" stop-color="${gripLight}"/><stop offset=".42" stop-color="${p.grip}"/><stop offset="1" stop-color="${gripDark}"/>
      </linearGradient>
      <linearGradient id="side-${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${p.side}"/><stop offset=".45" stop-color="${sideDark}"/><stop offset="1" stop-color="${darken(p.side, 0.22)}"/>
      </linearGradient>
      <linearGradient id="metal-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ctx.wireframe ? p.paper : '#efede5'}"/><stop offset=".22" stop-color="${ctx.wireframe ? p.paper : '#9e9e96'}"/><stop offset=".45" stop-color="${ctx.wireframe ? p.paper : '#f5f2e9'}"/><stop offset=".7" stop-color="${ctx.wireframe ? p.paper : '#797b75'}"/><stop offset="1" stop-color="${ctx.wireframe ? p.paper : '#d9d6cd'}"/>
      </linearGradient>
      <linearGradient id="darkMetal-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ctx.wireframe ? p.paper : '#555856'}"/><stop offset=".3" stop-color="${ctx.wireframe ? p.paper : '#1f2221'}"/><stop offset=".58" stop-color="${ctx.wireframe ? p.paper : '#434745'}"/><stop offset="1" stop-color="${ctx.wireframe ? p.paper : '#151716'}"/>
      </linearGradient>
      <radialGradient id="lensBarrel-${u}" cx=".38" cy=".32" r=".72">
        <stop offset="0" stop-color="${ctx.wireframe ? p.paper : '#5c605d'}"/><stop offset=".42" stop-color="${ctx.wireframe ? p.paper : '#202322'}"/><stop offset=".82" stop-color="${ctx.wireframe ? p.paper : '#0d0f0e'}"/><stop offset="1" stop-color="${ctx.wireframe ? p.paper : '#343836'}"/>
      </radialGradient>
      <radialGradient id="glass-${u}" cx=".38" cy=".33" r=".65">
        <stop offset="0" stop-color="#49656b"/><stop offset=".32" stop-color="#1b333b"/><stop offset=".68" stop-color="#141a1f"/><stop offset=".88" stop-color="#3f5661"/><stop offset="1" stop-color="#0d1113"/>
      </radialGradient>
      <radialGradient id="glassGlow-${u}" cx=".42" cy=".4" r=".6">
        <stop offset="0" stop-color="#cddfd3" stop-opacity=".28"/><stop offset=".28" stop-color="#89acb0" stop-opacity=".12"/><stop offset=".65" stop-color="#1d3d48" stop-opacity="0"/><stop offset="1" stop-color="#6b8e95" stop-opacity=".1"/>
      </radialGradient>
      <linearGradient id="screenGlass-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".38" stop-color="#fff" stop-opacity=".02"/><stop offset=".62" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/>
      </linearGradient>
      <linearGradient id="shadowFade-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1b16" stop-opacity=".34"/><stop offset="1" stop-color="#1a1b16" stop-opacity="0"/>
      </linearGradient>
      ${liveViewDefs}
      ${texturePattern}
      <filter id="shadow-${u}" x="-30%" y="-30%" width="160%" height="180%">
        <feGaussianBlur stdDeviation="13"/>
      </filter>
      <filter id="smallShadow-${u}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4"/>
      </filter>
      <filter id="softGlow-${u}" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3"/>
      </filter>
      <clipPath id="bodyClip-${u}"><path d="${bodyPath(ctx, ctx.bodyX, ctx.bodyY, ctx.bw, ctx.bh)}"/></clipPath>
      <clipPath id="gripClip-${u}"><path d="${gripPath(ctx)}"/></clipPath>
      ${screenW ? '' : ''}
    </defs>`;
  }

  function textureOverlay(ctx, path) {
    if (ctx.wireframe) return '';
    return `<path d="${path}" fill="url(#pat-${ctx.uid})" opacity=".9"/>`;
  }

  function gripPath(ctx) {
    const b = ctx.body;
    const W = ctx.bw, H = ctx.bh, x = ctx.bodyX, y = ctx.bodyY;
    let gripH = clamp(num(b.gripH, 48) * ctx.scale * 1.17, H * 0.16, H * 0.94);
    let gripW = clamp(num(b.gripD, 50) * ctx.scale * 0.55, 22, W * 0.35);
    if (ctx.frontStyle.id === 'big_grip') { gripH *= 1.03; gripW *= 1.12; }
    if (ctx.silhouette.id === 'ergo') { gripH *= 1.03; gripW *= 1.03; }
    if (ctx.bodyType.id === 'compact' || ctx.bodyType.id === 'action' || ctx.bodyType.id === 'gimbal') { gripH = Math.min(gripH, H * 0.58); }
    // Keep the grip visually fused with the body: most of it sits inside the front face,
    // with only a small ergonomic bulge beyond the silhouette.
    const gx = x + W - gripW * 0.98;
    const gy = y + H - gripH + 1;
    const r = Math.min(gripW * 0.48, gripH * 0.2);
    return roundedPath(gx, gy, gripW + 6, gripH, r);
  }

  // ---------- live view / screen ----------
  function liveView(ctx, x, y, w, h, options) {
    options = options || {};
    const u = ctx.uid + '-' + (options.suffix || 'lv');
    const pad = Math.max(2, w * 0.012);
    const ix = x + pad, iy = y + pad, iw = w - pad * 2, ih = h - pad * 2;
    const r = Math.min(8, Math.min(iw, ih) * 0.05);
    const fontSize = clamp(iw / 28, 4.5, 13);
    const showHUD = w > 100 && !options.noHud;
    const uiStyle = ctx.design.softwareUI || 'professional';
    const hudColor = uiStyle === 'classic' ? '#f2d8a6' : uiStyle === 'cinema' ? '#e2eee7' : uiStyle === 'minimal' ? '#f7f5ea' : '#dce4a6';
    const clip = `clip-${u}`;
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(9, w * .04)}" fill="#0e1110" stroke="#2f3331" stroke-width="1.5"/>
      <clipPath id="${clip}"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${r}"/></clipPath>
      <g clip-path="url(#${clip})">
        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#lv-sky-${ctx.uid})"/>
        <circle cx="${ix + iw * .68}" cy="${iy + ih * .31}" r="${ih * .36}" fill="url(#lv-sun-${ctx.uid})"/>
        <path d="M${ix} ${iy + ih * .63} L${ix + iw * .18} ${iy + ih * .45} L${ix + iw * .33} ${iy + ih * .57} L${ix + iw * .52} ${iy + ih * .4} L${ix + iw * .72} ${iy + ih * .57} L${ix + iw * .86} ${iy + ih * .47} L${ix + iw} ${iy + ih * .62} V${iy + ih} H${ix} Z" fill="#354844" opacity=".83"/>
        <path d="M${ix} ${iy + ih * .73} L${ix + iw * .24} ${iy + ih * .58} L${ix + iw * .4} ${iy + ih * .69} L${ix + iw * .56} ${iy + ih * .54} L${ix + iw * .72} ${iy + ih * .67} L${ix + iw * .9} ${iy + ih * .6} L${ix + iw} ${iy + ih * .68} V${iy + ih} H${ix} Z" fill="url(#lv-fg-${ctx.uid})"/>
        <path d="M${ix} ${iy + ih * .82} L${ix + iw * .2} ${iy + ih * .69} L${ix + iw * .42} ${iy + ih * .79} L${ix + iw * .62} ${iy + ih * .67} L${ix + iw * .85} ${iy + ih * .77} L${ix + iw} ${iy + ih * .71} V${iy + ih} H${ix} Z" fill="#101716" opacity=".86"/>
        <g opacity="${uiStyle === 'minimal' ? '.08' : '.18'}" stroke="#f1eee3" stroke-width=".7">
          <line x1="${ix + iw / 3}" y1="${iy}" x2="${ix + iw / 3}" y2="${iy + ih}"/><line x1="${ix + iw * 2 / 3}" y1="${iy}" x2="${ix + iw * 2 / 3}" y2="${iy + ih}"/>
          <line x1="${ix}" y1="${iy + ih / 3}" x2="${ix + iw}" y2="${iy + ih / 3}"/><line x1="${ix}" y1="${iy + ih * 2 / 3}" x2="${ix + iw}" y2="${iy + ih * 2 / 3}"/>
        </g>
        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#lv-haze-${ctx.uid})" opacity=".8"/>
        ${uiStyle === 'cinema' ? `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih * .09}" fill="#050807" opacity=".84"/><rect x="${ix}" y="${iy + ih * .91}" width="${iw}" height="${ih * .09}" fill="#050807" opacity=".84"/>` : ''}
        ${showHUD ? `
        <g fill="${hudColor}" opacity=".93" font-family="${uiStyle === 'classic' ? 'Georgia, serif' : 'Bahnschrift, Arial, sans-serif'}" font-size="${fontSize}">
          <rect x="${ix + 6}" y="${iy + 6}" width="${fontSize * (uiStyle === 'minimal' ? 2.2 : 3.2)}" height="${fontSize * 1.3}" rx="2" fill="#0d1110" opacity=".52"/>
          <text x="${ix + 9}" y="${iy + 6 + fontSize}" letter-spacing=".5">${uiStyle === 'classic' ? 'M' : uiStyle === 'cinema' ? 'TC' : 'RAW'}</text>
          ${uiStyle !== 'minimal' ? `<text x="${ix + iw - 9}" y="${iy + 6 + fontSize}" text-anchor="end">${escapeXML(ctx.design.video ? ctx.design.video.res : '4K')}</text><rect x="${ix + iw - 11}" y="${iy + 6}" width="8" height="12" rx="1.5" fill="none" stroke="${hudColor}" stroke-width=".9"/><rect x="${ix + iw - 10}" y="${iy + 7.2}" width="6" height="9" rx=".8" fill="${uiStyle === 'cinema' ? '#b5d0c6' : '#b8c878'}"/>` : ''}
        </g>
        <g fill="none" stroke="${options.afColor || hudColor}" stroke-width="${clamp(iw / 100, 1, 2.2)}" opacity=".88">
          <path d="M${ix + iw * .38} ${iy + ih * .4}h${iw * .035}v${ih * .055}M${ix + iw * .62} ${iy + ih * .4}h${-iw * .035}v${ih * .055}M${ix + iw * .38} ${iy + ih * .61}v${-ih * .055}h${iw * .035}M${ix + iw * .62} ${iy + ih * .61}v${-ih * .055}h${-iw * .035}"/>
        </g>
        ${uiStyle !== 'minimal' ? `<g fill="${hudColor}" font-family="Bahnschrift, Arial, sans-serif" font-size="${fontSize}" opacity=".9">
          <text x="${ix + 7}" y="${iy + ih - 8}">1/250</text>
          <text x="${ix + iw / 2}" y="${iy + ih - 8}" text-anchor="middle">F2.8</text>
          <text x="${ix + iw - 7}" y="${iy + ih - 8}" text-anchor="end">ISO 100</text>
        </g>` : `<circle cx="${ix + iw / 2}" cy="${iy + ih / 2}" r="${clamp(iw * .014, 2, 5)}" fill="${hudColor}" opacity=".9"/>`}
        ${uiStyle === 'cinema' ? `<g font-family="Bahnschrift, Arial, sans-serif" font-size="${fontSize}" fill="${hudColor}" opacity=".92">
          <circle cx="${ix + 9}" cy="${iy + ih * .93}" r="${clamp(fontSize * .32, 1.5, 4)}" fill="#d05a45"/>
          <text x="${ix + 18}" y="${iy + ih * .95}">REC 00:14:22:08</text>
          <text x="${ix + iw - 8}" y="${iy + ih * .95}" text-anchor="end">LUT · LOG3G10</text>
          <path d="M${ix + 8},${iy + ih * .84} h${iw * .1} M${ix + 8},${iy + ih * .87} h${iw * .07}" stroke="${hudColor}" stroke-width=".8" opacity=".65"/>
        </g>` : ''}
        ${uiStyle === 'classic' ? `<g stroke="${hudColor}" fill="none" opacity=".6">
          <path d="M${ix + iw - 16},${iy + ih * .38} h8 M${ix + iw - 16},${iy + ih * .44} h6 M${ix + iw - 16},${iy + ih * .5} h8 M${ix + iw - 16},${iy + ih * .56} h4" stroke-width=".7"/>
          <path d="M${ix + 8},${iy + ih * .36} v${ih * .2} M${ix + 12},${iy + ih * .4} v${ih * .14}" stroke-width=".7"/>
        </g>` : ''}
        ` : ''}
      </g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(9, w * .04)}" fill="url(#screenGlass-${ctx.uid})" opacity=".55" pointer-events="none"/>
    </g>`;
  }

  // ---------- top deck, controls & accessories ----------
  function drawTopDeck(ctx) {
    const b = ctx.body;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    const topH = clamp(ctx.topStyle.height * ctx.bh * 1.8 + H * 0.035, 14, 108);
    const deckY = y - topH;
    const r = Math.min(W * .07, topH * .4);
    const p = ctx.palette;
    let out = '';
    out += `<ellipse cx="${x + W * .5}" cy="${deckY + 10}" rx="${W * .44}" ry="${topH * .7}" fill="#1a1b16" opacity=".2" filter="url(#shadow-${ctx.uid})"/>`;
    if (ctx.topStyle.id === 'arc') {
      const path = `M${x},${y + 4} L${x},${deckY + topH * .55} Q${x},${deckY} ${x + W * .2},${deckY} H${x + W * .8} Q${x + W},${deckY} ${x + W},${deckY + topH * .55} L${x + W},${y + 4} Z`;
      out += `<path d="${path}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .2)}" stroke-width="1.2"/>${textureOverlay(ctx, path)}`;
    } else if (ctx.topStyle.id === 'flush') {
      out += `<rect x="${x + 1}" y="${deckY}" width="${W - 2}" height="${topH + 18}" rx="${r * .7}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .18)}" stroke-width="1.1"/>${textureOverlay(ctx, roundedPath(x + 1, deckY, W - 2, topH + 18, r * .7))}`;
    } else {
      out += `<rect x="${x}" y="${deckY}" width="${W}" height="${topH + 20}" rx="${r}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .17)}" stroke-width="1.2"/>${textureOverlay(ctx, roundedPath(x, deckY, W, topH + 20, r))}`;
    }
    // top plate edge / highlight
    out += `<path d="M${x + 9},${deckY + topH * .16} H${x + W - 9}" stroke="${ctx.wireframe ? p.ink : lighten(p.top, .25)}" stroke-width="1.3" opacity=".55"/>`;
    out += `<path d="M${x + 4},${y - 2} H${x + W - 4}" stroke="${ctx.wireframe ? p.ink : darken(p.top, .28)}" stroke-width="1.5" opacity=".55"/>`;

    if (ctx.topStyle.id === 'prism') {
      const humpH = Math.min(ctx.bh * 0.24, 72);
      const hw = Math.min(ctx.bw * .28, 180);
      const path = roundedPath(x + W * .5 - hw / 2, deckY - humpH, hw, humpH + 22, hw * .14);
      out += `<path d="${path}" fill="url(#topVert-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .2)}" stroke-width="1.2"/>`;
      out += `<path d="M${x + W * .5 - hw * .34},${deckY - humpH + 8} H${x + W * .5 + hw * .34}" stroke="${ctx.wireframe ? p.ink : lighten(p.top, .24)}" stroke-width="1" opacity=".45"/>`;
    }
    if (ctx.topStyle.id === 'shoulder') {
      const sw = Math.min(150, W * .3);
      out += `<rect x="${x + 12}" y="${deckY + 4}" width="${sw}" height="${topH * .65}" rx="5" fill="#1b1f1d" opacity=".9"/>`;
      out += `<rect x="${x + 17}" y="${deckY + 7}" width="${sw - 10}" height="${topH * .48}" rx="3" fill="#527b62" opacity=".75"/>`;
      out += `<g fill="#dae2cf" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(topH * .25, 5, 10)}" opacity=".83"><text x="${x + 22}" y="${deckY + 7 + topH * .24}">RAW</text><text x="${x + sw - 8}" y="${deckY + 7 + topH * .24}" text-anchor="end">1/250</text></g>`;
    }
    if (ctx.topStyle.id === 'modular') {
      for (let i = 0; i < 3; i++) {
        out += `<rect x="${x + 12 + i * (W - 24) / 3}" y="${deckY + 5}" width="${(W - 28) / 3}" height="${topH * .3}" rx="3" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.top, .25)}" stroke-width=".8" opacity=".4"/>`;
      }
    }
    if (ctx.topStyle.id === 'cine_shoulder' || ctx.accessories.cage || ctx.details.handle) {
      out += drawTopHandle(ctx, x, deckY, W, topH);
    }
    return { svg: out, deckY, topH };
  }

  function drawTopHandle(ctx, x, deckY, W, topH) {
    const p = ctx.palette;
    const handleY = deckY - Math.max(32, topH * .65) - 20;
    const hh = Math.max(16, topH * .22);
    const barX = x + W * .18;
    const barW = W * .64;
    let out = '';
    out += `<rect x="${barX + barW * .08}" y="${handleY + hh}" width="12" height="${deckY - handleY - hh + 4}" rx="4" fill="${ctx.wireframe ? p.paper : '#242726'}" stroke="${p.ink}" stroke-opacity="${ctx.wireframe ? '.8' : '.35'}"/>`;
    out += `<rect x="${barX + barW * .82}" y="${handleY + hh}" width="12" height="${deckY - handleY - hh + 4}" rx="4" fill="${ctx.wireframe ? p.paper : '#242726'}" stroke="${p.ink}" stroke-opacity="${ctx.wireframe ? '.8' : '.35'}"/>`;
    const path = roundedPath(barX, handleY, barW, hh + 6, Math.min(12, hh / 2));
    out += `<path d="${path}" fill="url(#darkMetal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#0f1110'}" stroke-width="1.2"/>`;
    out += `<rect x="${barX + 15}" y="${handleY + 5}" width="${barW - 30}" height="${hh - 8}" rx="${Math.min(8, hh / 3)}" fill="${ctx.wireframe ? p.paper : '#2e3230'}" stroke="${ctx.wireframe ? p.ink : '#4f5350'}" stroke-width=".7" opacity=".85"/>`;
    for (let i = 0; i < 4; i++) {
      out += `<circle cx="${barX + barW * (.25 + i * .17)}" cy="${handleY + hh / 2 + 1}" r="2" fill="#aeb0a5" opacity=".55"/>`;
    }
    return out;
  }

  function drawFrontEVF(ctx, deck) {
    if (!ctx.vfType || ctx.vfType.id === 'none') return '';
    const p = ctx.palette;
    const W = ctx.bw, H = ctx.bh;
    const deckY = deck.deckY, topH = deck.topH;
    const pos = (ctx.viewfinder && ctx.viewfinder.pos) || 'top_center';
    const fx = pos === 'top_left' ? .31 : pos === 'top_right' ? .69 : pos === 'side' ? .17 : .5;
    const vx = ctx.bodyX + W * fx;
    const isPrism = ctx.topStyle.id === 'prism';
    const vfKind = ctx.vfType.id;
    const above = clamp(H * (vfKind === 'pro' ? .075 : vfKind === 'folding' ? .095 : vfKind === 'eyelevel' ? .06 : .045), 7, 34);
    const w = clamp(W * (vfKind === 'pro' ? .18 : vfKind === 'folding' ? .17 : vfKind === 'eyelevel' ? .16 : .12), 34, 138);
    let out = '';
    if (isPrism) {
      const humpH = Math.min(H * 0.24, 72);
      out += `<rect x="${vx - w * .3}" y="${deckY - humpH * .7}" width="${w * .6}" height="${Math.max(10, above + 8)}" rx="4" fill="${ctx.wireframe ? p.paper : '#101413'}" stroke="${ctx.wireframe ? p.ink : '#555a52'}" stroke-width="1"/>`;
      out += `<rect x="${vx - w * .24}" y="${deckY - humpH * .65}" width="${w * .48}" height="${Math.max(5, above * .42)}" rx="2" fill="${ctx.wireframe ? 'none' : '#2d3a37'}" opacity=".8"/>`;
    } else {
      const baseY = deckY + topH + 12;
      const topY = deckY - above;
      const totalH = baseY - topY;
      const rad = ctx.vfType.id === 'eyelevel' ? 3 : 8;
      let shape;
      if (ctx.vfType.id === 'eyelevel') {
        shape = roundedPath(vx - w * .5, topY, w, totalH, rad);
      } else if (ctx.vfType.id === 'folding') {
        shape = `M${vx - w * .5},${baseY} V${topY + 11} Q${vx - w * .5},${topY} ${vx - w * .35},${topY} H${vx + w * .35} Q${vx + w * .5},${topY} ${vx + w * .5},${topY + 11} V${baseY} Z`;
      } else {
        shape = `M${vx - w * .5},${baseY} L${vx - w * .44},${topY + 9} Q${vx - w * .38},${topY} ${vx - w * .24},${topY} H${vx + w * .24} Q${vx + w * .38},${topY} ${vx + w * .44},${topY + 9} L${vx + w * .5},${baseY} Z`;
      }
      out += `<path d="${shape}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .2)}" stroke-width="1.2"/>`;
      out += `<path d="${shape}" fill="url(#pat-${ctx.uid})" opacity=".55"/>`;
      out += `<rect x="${vx - w * .3}" y="${topY + Math.max(5, above * .32)}" width="${w * .6}" height="${Math.max(8, above * .9)}" rx="${vfKind === 'eyelevel' ? 2 : 4}" fill="${ctx.wireframe ? p.paper : '#111514'}" stroke="${ctx.wireframe ? p.ink : '#5c6259'}" stroke-width=".9"/>`;
      out += `<rect x="${vx - w * .24}" y="${topY + Math.max(7, above * .36) + 2}" width="${w * .48}" height="${Math.max(3, above * .45)}" rx="2" fill="${ctx.wireframe ? 'none' : '#33443f'}" opacity=".8"/>`;
      if (ctx.vfType.id === 'folding') {
        out += `<path d="M${vx - w * .5},${baseY - 5} H${vx + w * .5}" stroke="${ctx.wireframe ? p.ink : '#5d6058'}" stroke-width="2.5" opacity=".45"/>`;
        out += `<circle cx="${vx - w * .34}" cy="${baseY - 5}" r="2" fill="#b6b4a9" opacity=".55"/><circle cx="${vx + w * .34}" cy="${baseY - 5}" r="2" fill="#b6b4a9" opacity=".55"/>`;
      }
    }
    return out;
  }

  function drawTopControls(ctx, deck) {
    const p = ctx.palette;
    const deckY = deck.deckY;
    const topH = deck.topH;
    const x = ctx.bodyX, W = ctx.bw;
    const enabled = Object.keys(ctx.controls.buttons || {}).filter(id => ctx.controls.buttons[id] && ctx.controls.buttons[id].enabled);
    const topButtons = enabled.filter(id => String(ctx.controls.buttons[id].pos || '').startsWith('top_'));
    const zones = { top_left: {}, top_mid: {}, top_right: {} };
    topButtons.forEach(id => {
      const pos = ctx.controls.buttons[id].pos || 'top_right';
      if (!zones[pos]) zones[pos] = {};
      const key = id;
      zones[pos][key] = true;
    });
    let out = '';
    const baseY = deckY + Math.min(46, topH * .55);
    const zx = { top_left: x + W * .21, top_mid: x + W * .5, top_right: x + W * .77 };
    ['top_left', 'top_mid', 'top_right'].forEach(zone => {
      const ids = Object.keys(zones[zone] || {});
      ids.forEach((bid, index) => {
        const spread = ids.length > 1 ? (index - (ids.length - 1) / 2) * 28 : 0;
        const bx = zx[zone] + spread;
        if (bid === 'shutter') {
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .028, 7, 15)}" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".45" stroke-width="1"/>`;
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .018, 4.5, 10)}" fill="${ctx.wireframe ? p.paper : '#d7d4ca'}" stroke="${p.ink}" stroke-opacity=".6" stroke-width=".8"/>`;
          out += `<path d="M${bx - W * .018},${baseY - 1.2} Q${bx},${baseY - 5} ${bx + W * .018},${baseY - 1.2}" stroke="#f3efe5" stroke-width="1" fill="none" opacity=".6"/>`;
        } else if (bid === 'record') {
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .021, 5.5, 10)}" fill="#2b2c29" stroke="${p.ink}" stroke-opacity=".4"/>`;
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .012, 3, 6)}" fill="${ctx.wireframe ? 'none' : '#bf4034'}" stroke="${ctx.wireframe ? p.ink : '#e2786a'}" stroke-width=".7"/>`;
        } else {
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .015, 4, 7)}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .18)}" stroke-width=".8"/>`;
          out += `<circle cx="${bx}" cy="${baseY}" r="${clamp(W * .007, 2, 3.4)}" fill="${ctx.wireframe ? p.paper : lighten(p.button, .18)}" opacity=".75"/>`;
        }
      });
    });
    // dials
    const dials = ctx.controls.dials || {};
    const dialXs = [];
    if (dials.mode) dialXs.push({ x: x + W * .88, r: clamp(W * .039, 9, 20), ticks: 32, label: true });
    if (dials.front) dialXs.push({ x: x + W * .72, r: clamp(W * .028, 6, 14), ticks: 20 });
    if (dials.rear) dialXs.push({ x: x + W * .93, r: clamp(W * .023, 5, 11), ticks: 18 });
    if (dials.extra) dialXs.push({ x: x + W * .08, r: clamp(W * .026, 5.5, 13), ticks: 20 });
    dialXs.slice(0, 4).forEach((d, i) => {
      const cy = deckY + topH * .3 + i * 3;
      out += `<ellipse cx="${d.x}" cy="${cy + d.r * .18}" rx="${d.r}" ry="${d.r * .58}" fill="#121413" opacity=".28"/>`;
      out += `<circle cx="${d.x}" cy="${cy}" r="${d.r}" fill="url(#darkMetal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#595b55'}" stroke-width=".7"/>`;
      out += ellipseKnurl(d.x, cy, d.r, d.ticks, ctx.wireframe ? p.ink : '#8d8f86', 1);
      out += `<circle cx="${d.x}" cy="${cy}" r="${d.r * .48}" fill="${ctx.wireframe ? p.paper : '#272a28'}" stroke="${ctx.wireframe ? p.ink : '#6e7069'}" stroke-width=".5"/>`;
      if (d.label && !ctx.compact) out += `<text x="${d.x}" y="${cy + 2.8}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(d.r * .5, 4, 7)}" fill="#d7d4c6" opacity=".75">M</text>`;
    });
    // hotshoe (if nothing mounted over it); shift to one side when a center EVF is present
    if (!ctx.accessories.flash && !ctx.accessories.mic && !ctx.accessories.wireless) {
      const vfOffset = ctx.vfType.id !== 'none' && ((ctx.viewfinder && ctx.viewfinder.pos) || 'top_center') === 'top_center' ? -.17 : 0;
      const hx = x + W * (.46 + vfOffset);
      out += `<rect x="${hx}" y="${deckY + 4}" width="${W * .08}" height="${Math.min(18, topH * .26)}" rx="2" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".28" stroke-width=".7"/>`;
      out += `<rect x="${hx + W * .012}" y="${deckY + 7}" width="${W * .037}" height="${Math.min(10, topH * .15)}" rx="1" fill="${ctx.wireframe ? p.paper : '#1a1c1b'}"/>`;
    }
    // brand engraving on deck
    if (!ctx.compact) {
      out += `<text x="${x + W * .1}" y="${deckY + topH * .45}" font-family="Bahnschrift, Arial Narrow, sans-serif" font-size="${clamp(W * .021, 5, 12)}" letter-spacing="2.4" fill="${ctx.wireframe ? p.ink : lighten(p.top, .35)}" opacity=".5">${escapeXML((ctx.company && (ctx.company.mark || ctx.company.en)) || 'FRAME')}</text>`;
    }
    return out;
  }

  function drawLensFront(ctx, options) {
    options = options || {};
    const p = ctx.palette;
    const cameraMount = ctx.mountDef;
    const kit = options.kitLens || null;
    const lensDia = kit && kit.diameter ? kit.diameter : ({
      PL: 110, E: 74, RF: 80, Z: 78, X: 70, L: 78, EF: 82, F: 76, M: 54, M43: 64, GFX: 96, K: 76, B4: 90, FIXED: 48
    }[cameraMount.id] || 74);
    const lensScale = cameraMount.id === 'FIXED' ? 0.58 : 1;
    const R = clamp(lensDia * ctx.scale * 0.5 * (num(ctx.mount.ratio, 100) / 100) * lensScale, 32, Math.min(ctx.bw * .47, 240));
    const align = ctx.mount.align || 'center';
    let lx = ctx.bodyX + ctx.bw * (align === 'left' ? 0.36 : align === 'right' ? 0.64 : 0.5);
    const ly = ctx.bodyY + ctx.bh * 0.48;
    const ringStyle = kit && kit.design && kit.design.body ? (D.LENS_STYLES[kit.design.body.style] || null) : null;
    const ringAccent = ringStyle ? ringStyle.ring : ctx.ringColor;
    const lensName = kit ? kit.name : (cameraMount.id === 'FIXED' ? 'INTEGRATED LENS' : cameraMount.id + ' MOUNT');
    let out = '';
    // shadow beneath lens
    out += `<ellipse cx="${lx + 10}" cy="${ly + R * .36}" rx="${R * 1.05}" ry="${R * .9}" fill="#11130f" opacity=".22" filter="url(#shadow-${ctx.uid})"/>`;
    // mount base ring
    out += `<circle cx="${lx}" cy="${ly}" r="${R * 1.08}" fill="url(#metal-${ctx.uid})" opacity=".8" stroke="${ctx.wireframe ? p.ink : '#b0ada2'}" stroke-width="1"/>`;
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .99}" fill="${ctx.wireframe ? p.paper : '#121514'}" stroke="${ctx.wireframe ? p.ink : '#555852'}" stroke-width="1.2"/>`;
    // outer barrel
    out += `<circle cx="${lx}" cy="${ly}" r="${R}" fill="url(#lensBarrel-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#050707'}" stroke-width="1.4"/>`;
    // barrel outer accent ring
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .94}" fill="none" stroke="${ringAccent}" stroke-width="${Math.max(2, R * .035)}" opacity="${ctx.wireframe ? .5 : .9}"/>`;
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .83}" fill="none" stroke="${ctx.wireframe ? p.ink : '#555b57'}" stroke-width="${Math.max(1, R * .012)}" opacity=".65"/>`;
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .76}" fill="${ctx.wireframe ? p.paper : '#171a19'}" stroke="${ctx.wireframe ? p.ink : '#484c48'}" stroke-width="${Math.max(.6, R * .009)}"/>`;
    // focus distance window / small label ring
    out += `<g opacity="${ctx.wireframe ? .35 : .62}" fill="${ctx.wireframe ? p.ink : '#b8b5ac'}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(R * .085, 3, 7)}" letter-spacing="1.1">`;
    out += `<text x="${lx}" y="${ly - R * .885}" text-anchor="middle">${escapeXML(lensName.length > 32 ? lensName.slice(0, 32) : lensName)}</text>`;
    out += `</g>`;
    // aperture blades ring
    const blades = 9;
    for (let i = 0; i < blades; i++) {
      const a1 = (i / blades) * Math.PI * 2;
      const a2 = ((i + .72) / blades) * Math.PI * 2;
      const r1 = R * .7, r2 = R * .62;
      out += `<path d="M${lx + Math.cos(a1) * r1},${ly + Math.sin(a1) * r1} L${lx + Math.cos(a2) * r2},${ly + Math.sin(a2) * r2}" stroke="${ctx.wireframe ? p.ink : '#72756d'}" stroke-width="${Math.max(.5, R * .008)}" opacity=".38"/>`;
    }
    // glass
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .645}" fill="url(#glass-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#0a0c0c'}" stroke-width="${Math.max(1, R * .012)}"/>`;
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .58}" fill="url(#glassGlow-${ctx.uid})" opacity=".9"/>`;
    // glass reflections
    out += `<path d="M${lx - R * .36},${ly - R * .27} Q${lx - R * .16},${ly - R * .48} ${lx + R * .06},${ly - R * .4} Q${lx - R * .12},${ly - R * .25} ${lx - R * .23},${ly - R * .05} Z" fill="#e7f0e4" opacity=".17"/>`;
    out += `<path d="M${lx + R * .16},${ly + R * .12} Q${lx + R * .32},${ly + R * .02} ${lx + R * .4},${ly + R * .18}" fill="none" stroke="#d5e7e0" stroke-width="${Math.max(.8, R * .012)}" opacity=".19"/>`;
    out += `<ellipse cx="${lx - R * .16}" cy="${ly - R * .16}" rx="${R * .18}" ry="${R * .1}" fill="#95bcc1" opacity=".1" transform="rotate(-36 ${lx - R * .16} ${ly - R * .16})"/>`;
    // inner barrel rim
    out += `<circle cx="${lx}" cy="${ly}" r="${R * .695}" fill="none" stroke="${ctx.wireframe ? p.ink : '#c4c1b7'}" stroke-width="${Math.max(.6, R * .009)}" opacity=".4"/>`;
    // mount screws / ring accents
    if (ctx.details.goldring) out += `<circle cx="${lx}" cy="${ly}" r="${R * 1.03}" fill="none" stroke="#b8934b" stroke-width="${Math.max(1.5, R * .018)}" opacity=".8"/>`;
    if (ctx.details.bluering) out += `<circle cx="${lx}" cy="${ly}" r="${R * 1.03}" fill="none" stroke="#476e92" stroke-width="${Math.max(1.2, R * .013)}" opacity=".8"/>`;
    // mount bayonet lugs
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
      const bx = lx + Math.cos(a) * R * .94, by = ly + Math.sin(a) * R * .94;
      out += `<rect x="${bx - 4}" y="${by - 2}" width="8" height="4" rx="1" fill="${p.ink}" opacity=".3" transform="rotate(${a * 180 / Math.PI} ${bx} ${by})"/>`;
    }
    return out;
  }

  function drawGrip(ctx) {
    const p = ctx.palette;
    const b = ctx.body;
    const W = ctx.bw, H = ctx.bh;
    if (num(b.gripH, 40) < 2 && ctx.frontStyle.id !== 'big_grip') return '';
    const path = gripPath(ctx);
    let out = `<path d="${path}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .18)}" stroke-width="1.2"/>`;
    out += `<g clip-path="url(#gripClip-${ctx.uid})">${textureOverlay(ctx, path)}`;
    out += `<path d="M${ctx.bodyX + W - 34},${ctx.bodyY + H * .35} Q${ctx.bodyX + W - 4},${ctx.bodyY + H * .45} ${ctx.bodyX + W - 26},${ctx.bodyY + H * .7}" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.grip, .2)}" stroke-width="2.2" opacity=".19"/>`;
    out += `<path d="M${ctx.bodyX + W - 46},${ctx.bodyY + H * .52} Q${ctx.bodyX + W - 18},${ctx.bodyY + H * .59} ${ctx.bodyX + W - 38},${ctx.bodyY + H * .8}" fill="none" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .22)}" stroke-width="2" opacity=".28"/>`;
    out += `</g>`;
    if (ctx.details.redline) out += `<path d="M${ctx.bodyX + W - 5},${ctx.bodyY + H * .16} V${ctx.bodyY + H * .9}" stroke="${p.accent}" stroke-width="4.5" opacity=".92"/>`;
    return out;
  }

  function drawBodyDetails(ctx) {
    const p = ctx.palette;
    const b = ctx.body;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    let out = '';
    // side face hint
    out += `<path d="M${x + 8},${y + 10} V${y + H - 12}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .18)}" stroke-width="1.3" opacity=".25"/>`;
    // front panel seam / layered front
    if (ctx.frontStyle.id === 'layered' || ctx.frontStyle.id === 'pro_face') {
      out += `<path d="M${x + W * .05},${y + H * .16} Q${x + W * .22},${y + H * .09} ${x + W * .45},${y + H * .16} V${y + H * .84} Q${x + W * .24},${y + H * .9} ${x + W * .05},${y + H * .82} Z" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .16)}" stroke-width=".9" opacity=".26"/>`;
    }
    if (ctx.frontStyle.id === 'round_port') {
      const rx = x + W * .5, ry = y + H * .48, rr = Math.min(W, H) * .39;
      out += `<circle cx="${rx}" cy="${ry}" r="${rr}" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .2)}" stroke-width="1.2" opacity=".22"/>`;
    }
    // front leatherette panel for retro face
    if (ctx.frontStyle.id === 'retro_face' || ctx.material.id === 'leather' || ctx.material.id === 'skin') {
      const panel = roundedPath(x + W * .035, y + H * .22, W * .47, H * .62, Math.min(12, W * .025));
      out += `<path d="${panel}" fill="${ctx.wireframe ? 'none' : darken(p.main, .035)}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .1)}" stroke-width=".8" opacity=".5"/>`;
      out += `<g clip-path="url(#bodyClip-${ctx.uid})"><path d="${panel}" fill="url(#pat-${ctx.uid})" opacity=".8"/></g>`;
    }
    // vents
    if (ctx.details.vents) {
      for (let i = 0; i < 5; i++) {
        out += `<rect x="${x + W * .055 + i * 7}" y="${y + H * .16}" width="3.2" height="${H * .2}" rx="1.6" fill="${ctx.wireframe ? 'none' : darken(p.main, .3)}" stroke="${ctx.wireframe ? p.ink : '#0e1110'}" stroke-opacity=".25" stroke-width=".5"/>`;
      }
      for (let i = 0; i < 4; i++) {
        out += `<rect x="${x + W * .05 + i * 7}" y="${y + H * .74}" width="3.2" height="${H * .1}" rx="1.6" fill="${ctx.wireframe ? 'none' : darken(p.main, .26)}" opacity=".75"/>`;
      }
    }
    // knurling
    if (ctx.details.knurl) {
      for (let i = 0; i < 9; i++) {
        out += `<line x1="${x + W * .89}" y1="${y + H * (.22 + i * .045)}" x2="${x + W * .96}" y2="${y + H * (.22 + i * .045)}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .3)}" stroke-width="1" opacity=".24"/>`;
      }
    }
    // expansion screw holes
    if (ctx.details.expansion) {
      const points = [[.08, .08], [.92, .08], [.08, .9], [.92, .9]];
      points.forEach(([px, py]) => {
        out += `<circle cx="${x + W * px}" cy="${y + H * py}" r="${clamp(W * .012, 2, 6)}" fill="none" stroke="${ctx.wireframe ? p.ink : '#b2b0a6'}" stroke-width="1" opacity=".48"/>`;
        out += `<circle cx="${x + W * px}" cy="${y + H * py}" r="${clamp(W * .004, 1, 2)}" fill="${ctx.wireframe ? p.ink : '#b2b0a6'}" opacity=".35"/>`;
      });
    }
    // port styling at side
    if (ctx.details.portstyling) {
      out += `<rect x="${x + W * .055}" y="${y + H * .38}" width="${W * .075}" height="${H * .18}" rx="3" fill="${ctx.wireframe ? 'none' : '#171a19'}" stroke="${ctx.wireframe ? p.ink : '#4c504c'}" stroke-width=".8"/>`;
      out += `<rect x="${x + W * .071}" y="${y + H * .415}" width="${W * .026}" height="${H * .04}" rx="1.5" fill="${ctx.wireframe ? 'none' : '#65716b'}" stroke="${ctx.wireframe ? p.ink : 'none'}" stroke-width=".4"/>`;
    }
    // accent line
    if (ctx.colors.accentLine) {
      out += `<path d="M${x + W * .07},${y + H * .93} H${x + W * .38}" stroke="${p.accent}" stroke-width="2.4" opacity=".88"/>`;
    }
    // nameplate
    if (ctx.details.nameplate) {
      const nw = Math.min(W * .27, 190), nh = Math.max(17, H * .052);
      const nx = x + W * .055, ny = y + H * .875;
      out += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="2" fill="${ctx.wireframe ? 'none' : '#141716'}" opacity=".75" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .25)}" stroke-width=".5"/>`;
      out += `<text x="${nx + 7}" y="${ny + nh * .68}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(nh * .48, 4.5, 9)}" letter-spacing="1.3" fill="${ctx.nameplate || p.nameplate}" opacity=".85">${escapeXML(((ctx.company && (ctx.company.mark || ctx.company.en)) || 'FRAME') + ' / ' + (ctx.design.name || 'DESIGN'))}</text>`;
    } else {
      out += `<text x="${x + W * .08}" y="${y + H * .92}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(W * .018, 4, 8)}" letter-spacing="1.2" fill="${ctx.wireframe ? p.ink : lighten(p.main, .4)}" opacity=".5">${escapeText((ctx.company && (ctx.company.mark || ctx.company.en)) || 'FRAME')}</text>`;
    }
    // subtle front highlight
    out += `<path d="M${x + W * .06},${y + H * .07} H${x + W * .94}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .3)}" stroke-width="1.5" opacity=".2"/>`;
    return out;
  }

  function escapeText(s) { return escapeXML(String(s || '').slice(0, 30)); }

  function drawCage(ctx) {
    if (!(ctx.details.cage || ctx.accessories.cage || ctx.body.silhouette === 'cage')) return '';
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    const m = 14;
    let out = `<g fill="none" stroke="${ctx.wireframe ? p.ink : '#272b29'}" stroke-width="6" stroke-linejoin="round" opacity="${ctx.wireframe ? .9 : .96}">`;
    out += `<rect x="${x - m}" y="${y - m * .5}" width="${W + m * 2}" height="${H + m}" rx="6"/>`;
    out += `<path d="M${x - m * .25},${y - m} V${y + H + m * .5} M${x + W + m * .25},${y - m} V${y + H + m * .5}"/>`;
    out += `</g>`;
    // rail highlight
    out += `<rect x="${x - m}" y="${y - m * .5}" width="${W + m * 2}" height="${H + m}" rx="6" fill="none" stroke="${ctx.wireframe ? p.ink : '#5f635d'}" stroke-width="1.2" opacity=".43"/>`;
    // screw holes
    for (let i = 0; i < 4; i++) {
      const sx = x - m + (i % 2) * (W + m * 2), sy = y - m * .5 + Math.floor(i / 2) * (H + m);
      out += `<circle cx="${sx}" cy="${sy}" r="5" fill="${ctx.wireframe ? p.paper : '#151816'}" stroke="${ctx.wireframe ? p.ink : '#8b8d83'}" stroke-width=".8"/>`;
    }
    return out;
  }

  function drawAccessoryFront(ctx) {
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    const a = ctx.accessories;
    const details = ctx.details;
    let out = '';
    // under-body grips / rigs
    if (a.batteryGrip || a.verticalGrip || a.shoulder) {
      const isBat = !!a.batteryGrip;
      const isShoulder = !!a.shoulder;
      const batPro = a.batteryGripStyle === 'pro';
      const verticalFull = a.verticalGripStyle === 'full';
      const gh = isShoulder ? Math.min(120, H * .32) : Math.min(isBat ? (batPro ? 120 : 96) : (verticalFull ? 84 : 68), H * .32);
      const gw = W * (isBat ? .9 : (verticalFull ? .84 : .74));
      const gx = x + (W - gw) / 2, gy = y + H - 4;
      if (isShoulder) {
        out += `<rect x="${x - 55}" y="${y + H + 60}" width="${W + 120}" height="18" rx="9" fill="${ctx.wireframe ? p.paper : '#252826'}" stroke="${p.ink}" stroke-opacity=".4"/>`;
        out += `<rect x="${x + W * .26}" y="${y + H + 12}" width="${W * .48}" height="65" rx="16" fill="${ctx.wireframe ? p.paper : '#151817'}" stroke="${ctx.wireframe ? p.ink : '#484b46'}" stroke-width="1"/>`;
        out += `<path d="M${x + W * .3},${y + H + 18} H${x + W * .7}" stroke="#777b72" stroke-width="1" opacity=".4"/>`;
      }
      out += `<path d="${roundedPath(gx, gy, gw, gh + 8, Math.min(18, gh * .22))}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .2)}" stroke-width="1.3"/>`;
      out += `<g clip-path="url(#gripClip-${ctx.uid})">${textureOverlay(ctx, roundedPath(gx, gy, gw, gh + 8, Math.min(18, gh * .22)))}</g>`;
      out += `<path d="M${gx + 12},${gy + 8} H${gx + gw - 12}" stroke="${ctx.wireframe ? p.ink : lighten(p.grip, .2)}" stroke-width="1.2" opacity=".3"/>`;
      // vertical shutter
      out += `<circle cx="${gx + gw - 40}" cy="${gy + 22}" r="${clamp(W * .026, 5, 12)}" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".35"/>`;
      out += `<rect x="${gx + gw - 76}" y="${gy + 51}" width="38" height="11" rx="3" fill="${ctx.wireframe ? p.paper : '#222622'}" stroke="${ctx.wireframe ? p.ink : '#4d514b'}" stroke-width=".6"/>`;
      if (isBat) {
        out += `<rect x="${gx + 15}" y="${gy + gh - 27}" width="${gw - 30}" height="8" rx="2" fill="${ctx.wireframe ? 'none' : '#141716'}" opacity=".65"/>`;
      }
    }
    // fan module on left side
    if (a.fan) {
      const fx = x - 44, fy = y + H * .24, fw = 54, fh = Math.min(124, H * .36);
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="9" fill="${ctx.wireframe ? p.paper : '#1c201e'}" stroke="${ctx.wireframe ? p.ink : '#4b4f49'}" stroke-width="1.1"/>`;
      out += `<circle cx="${fx + fw / 2}" cy="${fy + fh / 2}" r="${Math.min(fw, fh) * .33}" fill="none" stroke="${ctx.wireframe ? p.ink : '#75786f'}" stroke-width="1.2"/>`;
      for (let i = 0; i < 4; i++) {
        const a1 = i * Math.PI / 2 + .4;
        out += `<path d="M${fx + fw / 2 + Math.cos(a1) * 8},${fy + fh / 2 + Math.sin(a1) * 8} Q${fx + fw / 2 + Math.cos(a1 + .8) * 20},${fy + fh / 2 + Math.sin(a1 + .8) * 20} ${fx + fw / 2 + Math.cos(a1 + 1.3) * 22},${fy + fh / 2 + Math.sin(a1 + 1.3) * 22}" fill="none" stroke="#5d625b" stroke-width="1.4"/>`;
      }
    }
    // monitor on left
    if (a.monitor) {
      const seven = Number(a.monitorSize) >= 7;
      const mw = Math.min(seven ? 236 : 186, W * (seven ? .46 : .38)), mh = mw * .62;
      const mx = x - mw - (seven ? 56 : 44), my = y + H * (seven ? .08 : .13);
      out += `<rect x="${mx + 22}" y="${my + mh * .45}" width="32" height="14" rx="4" fill="${ctx.wireframe ? p.paper : '#292d2b'}" stroke="${ctx.wireframe ? p.ink : '#555951'}" stroke-width=".8"/>`;
      out += liveView(ctx, mx, my, mw, mh, { suffix: 'mon' });
      out += `<rect x="${mx + mw - 10}" y="${my + mh * .3}" width="8" height="${mh * .4}" rx="2" fill="#1e211f" opacity=".8"/>`;
      for (let i = 0; i < (seven ? 4 : 2); i++) out += `<circle cx="${mx + 9 + i * 7}" cy="${my + mh + 6}" r="2" fill="none" stroke="${ctx.wireframe ? p.ink : '#6a6e65'}" stroke-width=".7"/>`;
    }
    // microphone
    if (a.mic) {
      const mw = Math.min(190, W * .36), mh = 17;
      if (a.micPos === 'side') {
        const mx = x - 105, my = y + H * .45;
        out += `<rect x="${mx + 22}" y="${my - 18}" width="55" height="12" rx="4" fill="${ctx.wireframe ? p.paper : '#212422'}" stroke="${ctx.wireframe ? p.ink : '#555a52'}" stroke-width=".8"/>`;
        out += `<rect x="${mx + 42}" y="${my - 12}" width="18" height="18" rx="3" fill="${ctx.wireframe ? p.paper : '#2c302d'}" stroke="${ctx.wireframe ? p.ink : '#555a52'}" stroke-width=".8"/>`;
        out += `<rect x="${mx + 8}" y="${my + 3}" width="${mh}" height="${mw}" rx="${mh / 2}" fill="${ctx.wireframe ? p.paper : '#2a2e2c'}" stroke="${ctx.wireframe ? p.ink : '#5d6159'}" stroke-width="1"/>`;
        out += `<rect x="${mx + 12}" y="${my + 15}" width="${mh - 8}" height="${mw - 27}" rx="7" fill="${ctx.wireframe ? p.paper : '#171a18'}" opacity=".75"/>`;
        for (let i = 0; i < 7; i++) out += `<circle cx="${mx + 8.5}" cy="${my + 24 + i * (mw - 48) / 7}" r="1" fill="#a8aba2" opacity=".4"/>`;
      } else {
        const mx = x + W * .08, my = y - 58;
        out += `<rect x="${mx + mw * .3}" y="${my + mh}" width="9" height="25" rx="3" fill="${ctx.wireframe ? p.paper : '#222523'}" stroke="${p.ink}" stroke-opacity=".3"/>`;
        out += `<rect x="${mx + mw - 16}" y="${my + 3}" width="${mw}" height="${mh}" rx="${mh / 2}" fill="${ctx.wireframe ? p.paper : '#202322'}" stroke="${ctx.wireframe ? p.ink : '#565a53'}" stroke-width="1"/>`;
        out += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="${mh / 2}" fill="${ctx.wireframe ? p.paper : '#2d3130'}" stroke="${ctx.wireframe ? p.ink : '#5f625c'}" stroke-width="1"/>`;
        out += `<path d="M${mx + 19},${my + 4} H${mx + mw - 12}" stroke="${ctx.wireframe ? p.ink : '#101211'}" stroke-width="8" stroke-linecap="round" opacity=".7"/>`;
        for (let i = 0; i < 7; i++) out += `<circle cx="${mx + 28 + i * (mw - 44) / 7}" cy="${my + 8.5}" r="1" fill="#a8aba2" opacity=".4"/>`;
      }
    }
    // flash
    if (a.flash) {
      const fx = x + W * .55, fy = y - 88, fw = 100, fh = 54;
      out += `<rect x="${fx + fw / 2 - 5}" y="${fy + fh}" width="10" height="18" fill="${ctx.wireframe ? p.paper : '#262a28'}" stroke="${p.ink}" stroke-opacity=".3"/>`;
      out += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="6" fill="${ctx.wireframe ? p.paper : '#232725'}" stroke="${ctx.wireframe ? p.ink : '#565a53'}" stroke-width="1"/>`;
      out += `<rect x="${fx + 11}" y="${fy + 9}" width="${fw - 22}" height="${fh - 26}" rx="2" fill="${ctx.wireframe ? 'none' : '#c9d8c6'}" opacity=".35"/>`;
      out += `<rect x="${fx + 17}" y="${fy + 15}" width="${fw - 34}" height="${fh - 38}" rx="2" fill="${ctx.wireframe ? 'none' : '#dce3d5'}" opacity=".17"/>`;
      out += `<rect x="${fx + 16}" y="${fy + fh - 13}" width="${fw - 32}" height="5" rx="2" fill="${p.accent}" opacity=".45"/>`;
    }
    // wireless transmitter
    if (a.wireless) {
      const wx = x + W * .76, wy = y - 35, ww = 52, wh = 42;
      out += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="5" fill="${ctx.wireframe ? p.paper : '#202422'}" stroke="${ctx.wireframe ? p.ink : '#596059'}" stroke-width="1"/>`;
      out += `<line x1="${wx + ww * .6}" y1="${wy}" x2="${wx + ww * .8}" y2="${wy - 34}" stroke="${ctx.wireframe ? p.ink : '#8c9087'}" stroke-width="2.4" stroke-linecap="round"/>`;
      out += `<circle cx="${wx + ww * .8}" cy="${wy - 35}" r="3.3" fill="${ctx.wireframe ? p.paper : p.accent}" stroke="${ctx.wireframe ? p.ink : 'none'}" stroke-width=".7"/>`;
      out += `<circle cx="${wx + 11}" cy="${wy + 12}" r="3" fill="${ctx.wireframe ? 'none' : '#a3c47f'}" opacity=".85"/>`;
    }
    return out;
  }

  function drawScreenExternal(ctx, side, opts) {
    if (!(ctx.screenType.id === 'sideflip' || ctx.screenType.id === 'fold')) return '';
    opts = opts || {};
    const direction = opts.direction === 'right' ? 1 : -1;
    const screenW = Math.min(196, Math.max(132, ctx.bw * .34));
    const screenH = screenW * .66;
    let sx, sy;
    if (direction < 0) sx = ctx.bodyX - screenW - 29;
    else sx = ctx.bodyX + ctx.bw + 29;
    sy = ctx.bodyY + ctx.bh * .19;
    const hingeX = direction < 0 ? sx + screenW + 7 : sx - 7;
    const p = ctx.palette;
    let out = '';
    out += `<path d="M${hingeX},${sy + screenH * .16} l${direction * 22},${-11} M${hingeX},${sy + screenH * .84} l${direction * 22},${11}" stroke="${ctx.wireframe ? p.ink : '#303431'}" stroke-width="3" opacity=".8"/>`;
    out += `<rect x="${hingeX - 5}" y="${sy + 4}" width="10" height="${screenH - 8}" rx="4" fill="${ctx.wireframe ? p.paper : '#2a2d2b'}" stroke="${p.ink}" stroke-opacity=".3"/>`;
    out += `<rect x="${sx}" y="${sy}" width="${screenW}" height="${screenH}" rx="8" fill="${ctx.wireframe ? p.paper : '#111413'}" stroke="${ctx.wireframe ? p.ink : '#555a53'}" stroke-width="1.2"/>`;
    out += liveView(ctx, sx + 7, sy + 6, screenW - 14, screenH - 12, { suffix: direction < 0 ? 'left' : 'right' });
    if (ctx.screenType.id === 'fold') {
      out += `<path d="M${sx + screenW / 2},${sy + 4} V${sy + screenH - 4}" stroke="${ctx.wireframe ? p.ink : '#000'}" stroke-width="2" opacity=".5"/>`;
    }
    out += `<rect x="${sx}" y="${sy}" width="${screenW}" height="${screenH}" rx="8" fill="url(#screenGlass-${ctx.uid})" opacity=".4"/>`;
    return out;
  }

  function drawOpenScreenFront(ctx) {
    return drawScreenExternal(ctx, 'left', { direction: -1 });
  }

  // ---------- front elevation ----------
  function renderFront(ctx) {
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    let out = '';
    // shadow under the whole camera
    out += `<ellipse cx="${x + W / 2}" cy="${y + H + 28}" rx="${W * .58}" ry="${Math.max(22, H * .11)}" fill="#171914" opacity=".26" filter="url(#shadow-${ctx.uid})"/>`;
    out += drawAccessoryFront(ctx);
    const deck = drawTopDeck(ctx);
    out += deck.svg;
    out += drawFrontEVF(ctx, deck);
    out += drawOpenScreenFront(ctx);
    // body
    const path = bodyPath(ctx, x, y, W, H);
    out += `<path d="${path}" fill="url(#body-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.main, .2)}" stroke-width="1.3"/>`;
    out += `<g clip-path="url(#bodyClip-${ctx.uid})">${textureOverlay(ctx, path)}
      <path d="M${x},${y + H * .6} H${x + W}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .16)}" stroke-width="1" opacity=".14"/>
      <path d="M${x},${y + H * .04} H${x + W}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .24)}" stroke-width="1.1" opacity=".2"/>
      <rect x="${x + W * .42}" y="${y + H * .11}" width="${W * .3}" height="${H * .22}" fill="#fff" opacity=".015"/>
    </g>`;
    // right side quick edge
    out += `<path d="M${x + W - 2},${y + H * .1} V${y + H * .9}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .27)}" stroke-width="1.2" opacity=".25"/>`;
    out += drawBodyDetails(ctx);
    out += drawGrip(ctx);
    out += drawLensFront(ctx, ctx.options);
    out += drawTopControls(ctx, deck);
    out += drawCage(ctx);
    // top/front hardware extras
    if (ctx.details.handle && ctx.topStyle.id !== 'cine_shoulder' && !ctx.accessories.cage) {
      // already drawn by deck because details.handle triggers handle
    }
    // mount plate around lens
    out += drawFrontCageDetails(ctx);
    return out;
  }

  function drawFrontCageDetails(ctx) {
    if (!ctx.details.cage && !ctx.accessories.cage) return '';
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    let out = '';
    out += `<rect x="${x + 18}" y="${y + H - 34}" width="${W - 36}" height="8" rx="3" fill="${ctx.wireframe ? 'none' : '#191c1a'}" stroke="${ctx.wireframe ? p.ink : '#555b54'}" stroke-width=".6" opacity=".6"/>`;
    return out;
  }

  // ---------- rear elevation ----------
  function drawRearScreen(ctx) {
    if (ctx.screenType.id === 'none') {
      return `<g opacity=".5"><rect x="${ctx.bodyX + ctx.bw * .13}" y="${ctx.bodyY + ctx.bh * .23}" width="${ctx.bw * .48}" height="${ctx.bh * .35}" rx="4" fill="none" stroke="${ctx.palette.ink}" stroke-width=".8"/>${[0, 1, 2, 3].map(i => `<line x1="${ctx.bodyX + ctx.bw * .18 + i * 15}" y1="${ctx.bodyY + ctx.bh * .3}" x2="${ctx.bodyX + ctx.bw * .18 + i * 15}" y2="${ctx.bodyY + ctx.bh * .5}" stroke="${ctx.palette.ink}" stroke-width="1.2"/>`).join('')}</g>`;
    }
    if (ctx.screenType.id === 'sideflip' || ctx.screenType.id === 'fold') {
      return `<g>
        <rect x="${ctx.bodyX + ctx.bw * .06}" y="${ctx.bodyY + ctx.bh * .22}" width="${ctx.bw * .08}" height="${ctx.bh * .56}" rx="5" fill="${ctx.wireframe ? ctx.palette.paper : '#161918'}" stroke="${ctx.wireframe ? ctx.palette.ink : '#4e524d'}" stroke-width="1"/>
        <path d="M${ctx.bodyX + ctx.bw * .13},${ctx.bodyY + ctx.bh * .3} h${ctx.bw * .05}" stroke="${ctx.wireframe ? ctx.palette.ink : '#757970'}" stroke-width="2"/>
        <circle cx="${ctx.bodyX + ctx.bw * .1}" cy="${ctx.bodyY + ctx.bh * .28}" r="2.4" fill="#7e8177" opacity=".55"/>
        <circle cx="${ctx.bodyX + ctx.bw * .1}" cy="${ctx.bodyY + ctx.bh * .72}" r="2.4" fill="#7e8177" opacity=".55"/>
      </g>`;
    }
    const w = Math.min(ctx.bw * .55, ctx.bh * .83, 310);
    const h = w * .66;
    const x = ctx.bodyX + ctx.bw * .075;
    const y = ctx.bodyY + ctx.bh * .17;
    const bezel = clamp(w * .028, 5, 12);
    let out = '';
    out += `<rect x="${x - bezel}" y="${y - bezel}" width="${w + bezel * 2}" height="${h + bezel * 2}" rx="${bezel * 1.5}" fill="${ctx.wireframe ? ctx.palette.paper : '#0e1110'}" stroke="${ctx.wireframe ? ctx.palette.ink : '#454943'}" stroke-width="1.3"/>`;
    out += liveView(ctx, x, y, w, h, { suffix: 'rear' });
    if (ctx.screenType.id === 'upflip' || ctx.screenType.id === 'downflip' || ctx.screenType.id === 'tilt') {
      const hingeY = ctx.screenType.id === 'downflip' ? y + h + bezel : y - bezel;
      out += `<rect x="${x + 10}" y="${hingeY - 3}" width="${w - 20}" height="6" rx="3" fill="${ctx.wireframe ? ctx.palette.paper : '#3f433f'}" stroke="${ctx.wireframe ? ctx.palette.ink : '#5e625b'}" stroke-width=".6"/>`;
      out += `<path d="M${x + 16},${hingeY - 10} l0,20 M${x + w - 16},${hingeY - 10} l0,20" stroke="${ctx.wireframe ? ctx.palette.ink : '#777b71'}" stroke-width="1" opacity=".5"/>`;
    }
    return out;
  }

  function backButton(ctx, bid, cx, cy) {
    const p = ctx.palette;
    const r = clamp(ctx.bw * .021, 5.5, 13);
    const label = { play: '▶', menu: 'MENU', fn: 'FN', c1: 'C1', c2: 'C2', c3: 'C3', shutter: 'S', record: '●' }[bid] || '';
    let out = '';
    if (bid === 'menu') {
      out += `<rect x="${cx - r * 1.2}" y="${cy - r * .55}" width="${r * 2.4}" height="${r * 1.1}" rx="${r * .35}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .22)}" stroke-width=".8"/>`;
      if (!ctx.compact) out += `<text x="${cx}" y="${cy + r * .24}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(r * .48, 3.4, 5.2)}" fill="${ctx.wireframe ? p.ink : lighten(p.button, .4)}" opacity=".6">MENU</text>`;
    } else if (bid === 'play') {
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".8"/>`;
      out += `<path d="M${cx - r * .26},${cy - r * .34} L${cx + r * .38},${cy} L${cx - r * .26},${cy + r * .34} Z" fill="${ctx.wireframe ? p.ink : lighten(p.button, .5)}" opacity=".6"/>`;
    } else if (bid === 'record') {
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".8"/>`;
      out += `<circle cx="${cx}" cy="${cy}" r="${r * .44}" fill="${ctx.wireframe ? 'none' : '#b84335'}" stroke="${ctx.wireframe ? p.ink : '#e27769'}" stroke-width=".7"/>`;
    } else if (label) {
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".8"/>`;
      if (!ctx.compact) out += `<text x="${cx}" y="${cy + r * .28}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(r * .7, 3.4, 7)}" fill="${ctx.wireframe ? p.ink : lighten(p.button, .42)}" opacity=".66">${label}</text>`;
    } else {
      out += `<circle cx="${cx}" cy="${cy}" r="${r * .8}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".8"/>`;
    }
    return out;
  }

  function drawRearButtons(ctx) {
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    const buttons = Object.keys(ctx.controls.buttons || {}).filter(id => ctx.controls.buttons[id] && ctx.controls.buttons[id].enabled);
    const backButtons = buttons.filter(id => String(ctx.controls.buttons[id].pos || '').startsWith('back_') || ctx.controls.buttons[id].pos === 'grip' || ctx.controls.buttons[id].pos === 'side');
    const screenW = Math.min(W * .55, H * .83, 310), screenH = screenW * .66;
    const sx = x + W * .075, sy = y + H * .17;
    let out = '';
    const zoneCount = {};
    backButtons.forEach(id => {
      const pos = ctx.controls.buttons[id].pos;
      let cx, cy;
      if (pos === 'grip') { cx = x + W * .88; cy = y + H * .58; }
      else if (pos === 'side') { cx = x + W * .985; cy = y + H * .46; }
      else if (pos === 'back_upper_right') { cx = x + W * .79; cy = y + H * .23; }
      else if (pos === 'back_upper_left') { cx = x + W * .18; cy = y + H * .23; }
      else if (pos === 'back_lower_right') { cx = x + W * .79; cy = y + H * .76; }
      else if (pos === 'back_lower_left') { cx = x + W * .18; cy = y + H * .78; }
      else { cx = x + W * .79; cy = y + H * .4; }
      const key = pos + ':' + Math.round(cx) + ':' + Math.round(cy);
      const n = zoneCount[key] = (zoneCount[key] || 0) + 1;
      cx += (n - 1) * clamp(W * .045, 10, 24);
      if (pos !== 'side' && cx > sx + screenW + 10 && cy > sy && cy < sy + screenH) cy = sy + screenH - 12;
      out += backButton(ctx, id, cx, cy);
    });
    // joystick
    if (ctx.controls.joystick) {
      const jp = ctx.controls.joystickPos || 'back_upper_right';
      const jx = x + W * (jp === 'back_upper_left' || jp === 'back_lower_left' ? .2 : jp === 'grip' ? .88 : .82);
      const jy = y + H * (jp.includes('upper') ? .34 : jp.includes('lower') ? .72 : .48);
      out += `<circle cx="${jx}" cy="${jy}" r="${clamp(W * .035, 8, 18)}" fill="${ctx.wireframe ? p.paper : '#1b1e1c'}" stroke="${ctx.wireframe ? p.ink : '#4d514b'}" stroke-width="1"/>`;
      out += `<circle cx="${jx}" cy="${jy}" r="${clamp(W * .021, 5, 11)}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".7"/>`;
      out += `<circle cx="${jx}" cy="${jy}" r="${clamp(W * .006, 1.5, 3)}" fill="${ctx.wireframe ? p.ink : '#111'}" opacity=".4"/>`;
    }
    // rear command dial peeking next to grip
    if (ctx.controls.dials && ctx.controls.dials.rear) {
      const dx = x + W * .9, dy = y + H * .28, r = clamp(W * .032, 7, 17);
      out += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="url(#darkMetal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#686b63'}" stroke-width=".8"/>`;
      out += ellipseKnurl(dx, dy, r, 20, ctx.wireframe ? p.ink : '#9a9c92', 1);
    }
    return out;
  }

  function drawRearViewfinder(ctx) {
    if (ctx.vfType.id === 'none') return '';
    const p = ctx.palette;
    const W = ctx.bw, H = ctx.bh;
    const pos = (ctx.viewfinder && ctx.viewfinder.pos) || 'top_center';
    let cx = ctx.bodyX + W * (pos === 'top_left' ? .3 : pos === 'top_right' ? .7 : .5);
    const y = ctx.bodyY + H * .035;
    const w = clamp(W * (ctx.vfType.id === 'pro' ? .24 : .18), 44, 150);
    const h = clamp(H * (ctx.vfType.id === 'pro' ? .17 : .13), 26, 68);
    let out = `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${h * .34}" fill="${ctx.wireframe ? p.paper : '#101312'}" stroke="${ctx.wireframe ? p.ink : '#4c504b'}" stroke-width="1.3"/>`;
    out += `<rect x="${cx - w * .27}" y="${y + h * .22}" width="${w * .54}" height="${h * .45}" rx="${h * .16}" fill="${ctx.wireframe ? 'none' : '#18201f'}" stroke="${ctx.wireframe ? p.ink : '#575b54'}" stroke-width="1"/>`;
    out += `<ellipse cx="${cx}" cy="${y + h * .44}" rx="${w * .19}" ry="${h * .18}" fill="${ctx.wireframe ? 'none' : '#334542'}" stroke="${ctx.wireframe ? p.ink : '#78817a'}" stroke-width=".7" opacity=".8"/>`;
    if (!ctx.compact) out += `<text x="${cx}" y="${y + h - 5}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(w * .083, 3, 6)}" fill="${ctx.wireframe ? p.ink : '#898c81'}" letter-spacing="1.4" opacity=".55">${escapeXML((ctx.viewfinder.res || '3.69m').toUpperCase())}</text>`;
    return out;
  }

  function renderBack(ctx) {
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    let out = '';
    out += `<ellipse cx="${x + W / 2}" cy="${y + H + 26}" rx="${W * .58}" ry="${Math.max(20, H * .1)}" fill="#171914" opacity=".24" filter="url(#shadow-${ctx.uid})"/>`;
    // rear accessories / underbody rigs
    out += drawAccessoryFront(ctx);
    const deck = drawTopDeck(ctx);
    out += deck.svg;
    out += drawScreenExternal(ctx, 'left', { direction: -1 });
    const path = bodyPath(ctx, x, y, W, H);
    out += `<path d="${path}" fill="url(#body-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.main, .2)}" stroke-width="1.3"/>`;
    out += `<g clip-path="url(#bodyClip-${ctx.uid})">${textureOverlay(ctx, path)}
      <rect x="${x + W * .02}" y="${y + H * .02}" width="${W * .96}" height="${H * .96}" fill="#fff" opacity=".018"/>
    </g>`;
    // rear grip
    const gp = gripPath(ctx);
    out += `<path d="${gp}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .2)}" stroke-width="1.2"/>`;
    out += `<g clip-path="url(#gripClip-${ctx.uid})">${textureOverlay(ctx, gp)}<path d="M${x + W - 36},${y + H * .38} Q${x + W - 9},${y + H * .5} ${x + W - 30},${y + H * .67}" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.grip, .21)}" stroke-width="2.2" opacity=".23"/></g>`;
    // screen
    out += drawRearScreen(ctx);
    // viewfinder
    out += drawRearViewfinder(ctx);
    // rear buttons
    out += drawRearButtons(ctx);
    // top controls on deck
    out += drawTopControls(ctx, deck);
    // details
    out += drawBodyDetails(ctx);
    out += drawCage(ctx);
    // rear ports
    if (ctx.details.portStyling || ctx.details.portstyling) {
      out += `<rect x="${x + W * .04}" y="${y + H * .72}" width="${W * .08}" height="${H * .15}" rx="3" fill="${ctx.wireframe ? 'none' : '#171b19'}" stroke="${ctx.wireframe ? p.ink : '#484d47'}" stroke-width=".7"/>`;
    }
    // battery door and serial engraving
    out += `<path d="M${x + W * .58},${y + H * .9} h${W * .19}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .26)}" stroke-width=".8" opacity=".24"/>`;
    if (!ctx.compact) out += `<text x="${x + W * .59}" y="${y + H * .94}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(W * .012, 3, 6)}" letter-spacing="1.2" fill="${ctx.wireframe ? p.ink : lighten(p.main, .4)}" opacity=".35">NO. ${String(ctx.design.createdAt || '2026').toString().slice(-6)}</text>`;
    return out;
  }

  // ---------- top elevation ----------
  function renderTop(ctx) {
    const p = ctx.palette;
    const W = ctx.W, Dp = ctx.Dp;
    const s = Math.min(4.7, 610 / W, 380 / Dp);
    const tw = W * s, td = Dp * s;
    const bx = 500 - tw / 2;
    const by = 356 - td / 2;
    const frontY = by + td;
    const centerX = 500;
    const bodyShape = bodyPath(ctx, bx, by, tw, td);
    let out = '';
    // shadow and side projection
    out += `<ellipse cx="${centerX}" cy="${by + td + 44}" rx="${tw * .55}" ry="31" fill="#171914" opacity=".25" filter="url(#shadow-${ctx.uid})"/>`;
    out += `<path d="${bodyShape}" transform="translate(0 14)" fill="${ctx.wireframe ? p.paper : darken(p.main, .2)}" stroke="${p.ink}" stroke-opacity=".25" stroke-width="1"/>`;
    // battery grip in top view (bulge on the right/front)
    if (ctx.accessories.batteryGrip || ctx.accessories.verticalGrip) {
      const gw = tw * .22, gh = td * .5;
      out += `<path d="${roundedPath(bx + tw - gw * .7, by + td - gh, gw + 22, gh, Math.min(18, gw * .3))}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .2)}" stroke-width="1"/>`;
      out += `<path d="${roundedPath(bx + tw - gw * .7, by + td - gh, gw + 22, gh, Math.min(18, gw * .3))}" transform="translate(0 12)" fill="${ctx.wireframe ? p.paper : darken(p.grip, .22)}" opacity=".45"/>`;
    }
    // top deck / body
    out += `<path d="${bodyShape}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .2)}" stroke-width="1.4"/>`;
    out += `<g clip-path="url(#bodyClip-${ctx.uid})" transform="translate(${0} ${0})">${textureOverlay(ctx, bodyShape)}</g>`;
    // Actual clip path is front coords; use top-specific overlay instead:
    out += `<path d="${bodyShape}" fill="url(#pat-${ctx.uid})" opacity=".8"/>`;
    // edge highlights
    out += `<path d="M${bx + 12},${by + 4} H${bx + tw - 12}" stroke="${ctx.wireframe ? p.ink : lighten(p.top, .28)}" stroke-width="1.2" opacity=".45"/>`;
    out += `<path d="M${bx + tw - 4},${by + 14} V${by + td - 14}" stroke="${ctx.wireframe ? p.ink : lighten(p.top, .2)}" stroke-width="1" opacity=".35"/>`;
    // grip top surface (ergonomic)
    const gripW = clamp(ctx.body.gripD * s * .45, 30, tw * .3);
    const gripD = clamp(ctx.body.gripH * s * .55, 32, td * .68);
    if (num(ctx.body.gripH, 0) > 2) {
      const gp = roundedPath(bx + tw - gripW + 4, frontY - gripD, gripW + 22, gripD + 12, Math.min(22, gripW * .4));
      out += `<path d="${gp}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .18)}" stroke-width="1.1"/>`;
      out += `<path d="${gp}" fill="url(#pat-${ctx.uid})" opacity=".75"/>`;
      out += `<path d="M${bx + tw - gripW + 16},${frontY - gripD * .6} Q${bx + tw - 6},${frontY - gripD * .4} ${bx + tw - gripW * .5},${frontY - 12}" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.grip, .2)}" stroke-width="1.1" opacity=".22"/>`;
    }
    // lens barrel (points to the front / bottom)
    const kit = ctx.options.kitLens;
    const lensDia = kit && kit.diameter ? kit.diameter : ({ E: 74, RF: 80, Z: 78, X: 70, L: 78, PL: 110, EF: 82, F: 76, M: 54, M43: 64, GFX: 96, FIXED: 48, K: 76 }[ctx.mountDef.id] || 74);
    const lw = clamp(lensDia * s * .88, 48, tw * .58);
    const align = ctx.mount.align || 'center';
    const lcx = centerX + (align === 'left' ? -tw * .17 : align === 'right' ? tw * .17 : 0);
    const ext = Math.min(150, (kit ? (kit.length || 100) : 100) * s * .27);
    const ly0 = frontY - 18;
    const ly1 = frontY + ext;
    const barrelPath = `M${lcx - lw / 2},${ly0} V${ly1 - 24} Q${lcx - lw / 2},${ly1} ${lcx - lw / 2 + 24},${ly1} H${lcx + lw / 2 - 24} Q${lcx + lw / 2},${ly1} ${lcx + lw / 2},${ly1 - 24} V${ly0} Z`;
    out += `<path d="${barrelPath}" fill="url(#lensBarrel-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#111312'}" stroke-width="1.2"/>`;
    const ringColor = (D.RING_COLORS.find(r => r.id === ctx.mount.ringColor) || D.RING_COLORS[0]).hex;
    out += `<path d="M${lcx - lw / 2 + 4},${ly1 - 44} H${lcx + lw / 2 - 4}" stroke="${ctx.wireframe ? p.ink : ringColor}" stroke-width="${Math.max(2, lw * .025)}" opacity=".9"/>`;
    out += `<path d="M${lcx - lw / 2 + 4},${ly1 - 22} H${lcx + lw / 2 - 4}" stroke="${ctx.wireframe ? p.ink : '#6a6e67'}" stroke-width="1.1" opacity=".7"/>`;
    out += `<ellipse cx="${lcx}" cy="${ly1 - 11}" rx="${lw * .43}" ry="${Math.max(6, ext * .065)}" fill="url(#glass-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#8b8d84'}" stroke-width="1"/>`;
    out += `<ellipse cx="${lcx - lw * .12}" cy="${ly1 - 15}" rx="${lw * .13}" ry="${Math.max(2, ext * .025)}" fill="#e6eee4" opacity=".15"/>`;
    // mount ring at base
    out += `<ellipse cx="${lcx}" cy="${frontY - 5}" rx="${lw * .58}" ry="${lw * .13}" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".35" stroke-width=".9"/>`;
    // hotspot / EVF hump at rear
    if (ctx.vfType.id !== 'none') {
      const vw = Math.min(tw * .24, 150), vd = Math.min(td * .2, 58);
      let vx;
      const vpos = (ctx.viewfinder && ctx.viewfinder.pos) || 'top_center';
      if (vpos === 'top_left') vx = bx + tw * .28; else if (vpos === 'top_right') vx = bx + tw * .72; else vx = bx + tw * .5;
      out += `<rect x="${vx - vw / 2}" y="${by - vd * .18}" width="${vw}" height="${vd}" rx="${Math.min(vd * .36, 18)}" fill="${ctx.wireframe ? p.paper : '#202422'}" stroke="${ctx.wireframe ? p.ink : '#4f534c'}" stroke-width="1.1"/>`;
      out += `<rect x="${vx - vw * .29}" y="${by + vd * .16}" width="${vw * .58}" height="${vd * .4}" rx="${Math.min(9, vd * .16)}" fill="${ctx.wireframe ? 'none' : '#101514'}" stroke="${ctx.wireframe ? p.ink : '#6e746a'}" stroke-width=".8"/>`;
    }
    // screen hinge / panel at rear edge
    if (ctx.screenType.id !== 'none') {
      const sw = Math.min(tw * .52, 220);
      out += `<path d="M${bx + tw * .18},${by + 2} H${bx + tw * .82}" stroke="${ctx.wireframe ? p.ink : '#151817'}" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
      out += `<circle cx="${bx + tw * .24}" cy="${by + 3}" r="3" fill="#86887e" opacity=".45"/><circle cx="${bx + tw * .76}" cy="${by + 3}" r="3" fill="#86887e" opacity=".45"/>`;
      if (ctx.screenType.id === 'sideflip' || ctx.screenType.id === 'fold') {
        out += `<rect x="${bx - 38}" y="${by + td * .2}" width="16" height="${td * .52}" rx="4" fill="${ctx.wireframe ? p.paper : '#1b1e1c'}" stroke="${ctx.wireframe ? p.ink : '#555a53'}" stroke-width=".8" transform="rotate(-8 ${bx - 38} ${by + td * .2})"/>`;
      }
    }
    // top controls and dials
    out += drawTopViewControls(ctx, bx, by, tw, td, frontY);
    // details and accessories
    if (ctx.topStyle.id === 'shoulder') {
      out += `<rect x="${bx + tw * .14}" y="${by + td * .33}" width="${tw * .22}" height="${td * .15}" rx="4" fill="${ctx.wireframe ? p.paper : '#171b19'}" stroke="${ctx.wireframe ? p.ink : '#565a52'}"/><text x="${bx + tw * .25}" y="${by + td * .42}" text-anchor="middle" font-family="Bahnschrift" font-size="${clamp(tw * .012, 4, 7)}" fill="#d9d5c8" opacity=".65">SHOULDER</text>`;
    }
    if (ctx.details.vents) {
      for (let i = 0; i < 5; i++) out += `<line x1="${bx + 18 + i * 6}" y1="${by + td * .32}" x2="${bx + 18 + i * 6}" y2="${by + td * .58}" stroke="${ctx.wireframe ? p.ink : '#111412'}" stroke-width="2.4" opacity=".6"/>`;
    }
    if (ctx.details.nameplate) {
      out += `<text x="${bx + tw * .13}" y="${by + td * .74}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(tw * .017, 4, 9)}" letter-spacing="2" fill="${ctx.wireframe ? p.ink : lighten(p.top, .4)}" opacity=".55">${escapeXML((ctx.company && (ctx.company.mark || ctx.company.en)) || 'FRAME')} / ${escapeXML((ctx.design.name || '').slice(0, 22))}</text>`;
    }
    if (ctx.details.cage || ctx.accessories.cage || ctx.body.silhouette === 'cage') {
      out += `<g fill="none" stroke="${ctx.wireframe ? p.ink : '#2a2e2b'}" stroke-width="5"><rect x="${bx - 13}" y="${by - 12}" width="${tw + 26}" height="${td + 24}" rx="7"/></g>`;
    }
    if (ctx.accessories.fan) {
      const fx = bx - 34, fy = by + td * .52;
      out += `<rect x="${fx}" y="${fy}" width="30" height="${td * .22}" rx="5" fill="${ctx.wireframe ? p.paper : '#1b1f1c'}" stroke="${ctx.wireframe ? p.ink : '#545951'}" stroke-width=".8"/>`;
      out += `<circle cx="${fx + 15}" cy="${fy + td * .11}" r="8" fill="none" stroke="#777a71" stroke-width="1"/>`;
    }
    if (ctx.accessories.mic) {
      out += `<rect x="${bx + tw * .12}" y="${by - 36}" width="${tw * .34}" height="11" rx="5.5" fill="${ctx.wireframe ? p.paper : '#252927'}" stroke="${ctx.wireframe ? p.ink : '#65685f'}" stroke-width=".7"/><path d="M${bx + tw * .18},${by - 31} H${bx + tw * .4}" stroke="#0e1110" stroke-width="5" stroke-linecap="round" opacity=".65"/>`;
    }
    if (ctx.accessories.flash) {
      out += `<rect x="${bx + tw * .58}" y="${by - 31}" width="${tw * .16}" height="28" rx="4" fill="${ctx.wireframe ? p.paper : '#242826'}" stroke="${ctx.wireframe ? p.ink : '#5b5f57'}" stroke-width=".8"/>`;
    }
    // annotations for top view
    if (!ctx.compact) {
      const ink = '#4d4f46';
      out += `<g font-family="Bahnschrift, Arial Narrow, sans-serif" fill="${ink}" opacity=".68">
        <path d="M${bx},${by - 72} H${bx + tw}" stroke="${ink}" stroke-width=".8"/><path d="M${bx},${by - 77} V${by - 67} M${bx + tw},${by - 77} V${by - 67}" stroke="${ink}"/>
        <text x="${centerX}" y="${by - 78}" text-anchor="middle" font-size="11">${Math.round(W)} mm</text>
        <path d="M${bx + tw + 38},${by} V${by + td}" stroke="${ink}" stroke-width=".8"/><path d="M${bx + tw + 33},${by} H${bx + tw + 43} M${bx + tw + 33},${by + td} H${bx + tw + 43}" stroke="${ink}"/>
        <text x="${bx + tw + 49}" y="${by + td / 2 + 3}" font-size="11">${Math.round(Dp)} mm</text>
        <text x="56" y="54" font-size="10" letter-spacing="2">TOP ELEVATION</text>
        <text x="56" y="72" font-size="9" letter-spacing="1.2" opacity=".7">${escapeXML((ctx.design.name || 'UNTITLED').toUpperCase())}</text>
        <text x="944" y="632" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".6">${escapeXML(ctx.mountDef.id)} · ${escapeXML(ctx.material.name)}</text>
      </g>`;
    }
    return out;
  }

  function drawTopViewControls(ctx, bx, by, tw, td, frontY) {
    const p = ctx.palette;
    const enabled = Object.keys(ctx.controls.buttons || {}).filter(id => ctx.controls.buttons[id] && ctx.controls.buttons[id].enabled);
    const tops = enabled.filter(id => String(ctx.controls.buttons[id].pos || '').startsWith('top_') || ctx.controls.buttons[id].pos === 'grip');
    const zone = { top_left: [], top_mid: [], top_right: [], grip: [] };
    tops.forEach(id => {
      const pos = ctx.controls.buttons[id].pos;
      if (zone[pos]) zone[pos].push(id);
    });
    let out = '';
    const place = (pos, index, count) => {
      let fx = pos === 'top_left' ? .24 : pos === 'top_right' ? .78 : pos === 'grip' ? .86 : .5;
      let fy = pos === 'grip' ? .7 : .7;
      return { x: bx + tw * fx, y: by + td * fy, index, count };
    };
    Object.keys(zone).forEach(pos => {
      zone[pos].forEach((bid, i) => {
        const pt = place(pos, i, zone[pos].length);
        const px = pt.x + (zone[pos].length > 1 ? (i - (zone[pos].length - 1) / 2) * 26 : 0);
        const py = pt.y;
        if (bid === 'shutter') {
          out += `<circle cx="${px}" cy="${py}" r="${clamp(tw * .022, 6, 13)}" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".3" stroke-width="1"/>`;
          out += `<circle cx="${px}" cy="${py}" r="${clamp(tw * .014, 4, 8)}" fill="${ctx.wireframe ? p.paper : '#d2cec3'}" stroke="${p.ink}" stroke-opacity=".35" stroke-width=".7"/>`;
        } else if (bid === 'record') {
          out += `<circle cx="${px}" cy="${py}" r="${clamp(tw * .016, 4.5, 9)}" fill="#242724" stroke="${p.ink}" stroke-opacity=".3"/><circle cx="${px}" cy="${py}" r="${clamp(tw * .009, 2.5, 5)}" fill="${ctx.wireframe ? 'none' : '#ba3f33'}" stroke="${ctx.wireframe ? p.ink : 'none'}"/>`;
        } else {
          out += `<circle cx="${px}" cy="${py}" r="${clamp(tw * .011, 3, 6)}" fill="${p.button}" stroke="${ctx.wireframe ? p.ink : darken(p.button, .2)}" stroke-width=".6"/>`;
        }
      });
    });
    const dials = ctx.controls.dials || {};
    const dialPositions = [];
    if (dials.mode) dialPositions.push({ fx: .81, fy: .36, r: clamp(tw * .035, 9, 19) });
    if (dials.front) dialPositions.push({ fx: .7, fy: .27, r: clamp(tw * .025, 6, 13) });
    if (dials.rear) dialPositions.push({ fx: .89, fy: .48, r: clamp(tw * .022, 5, 11) });
    if (dials.extra) dialPositions.push({ fx: .16, fy: .43, r: clamp(tw * .024, 5, 12) });
    dialPositions.forEach((d, i) => {
      const dx = bx + tw * d.fx, dy = by + td * d.fy;
      out += `<circle cx="${dx}" cy="${dy}" r="${d.r}" fill="url(#darkMetal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#5e6159'}" stroke-width=".7"/>`;
      out += ellipseKnurl(dx, dy, d.r, 28, ctx.wireframe ? p.ink : '#93968b', .9);
      out += `<circle cx="${dx}" cy="${dy}" r="${d.r * .44}" fill="${ctx.wireframe ? p.paper : '#262a27'}" stroke="${ctx.wireframe ? p.ink : '#73776d'}" stroke-width=".5"/>`;
    });
    // hotshoe
    if (!ctx.accessories.flash && !ctx.accessories.mic && !ctx.accessories.wireless) {
      out += `<rect x="${bx + tw * .47}" y="${by + td * .23}" width="${tw * .07}" height="${td * .12}" rx="2" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".3" stroke-width=".6"/><rect x="${bx + tw * .48}" y="${by + td * .255}" width="${tw * .05}" height="${td * .055}" rx="1" fill="${ctx.wireframe ? p.paper : '#1b1e1c'}"/>`;
    }
    if (ctx.topStyle.id === 'cine_shoulder' || ctx.details.handle || ctx.accessories.cage) {
      out += `<rect x="${bx + tw * .18}" y="${by + td * .12}" width="${tw * .64}" height="12" rx="6" fill="${ctx.wireframe ? p.paper : '#242826'}" stroke="${ctx.wireframe ? p.ink : '#565b53'}" stroke-width=".7"/><rect x="${bx + tw * .29}" y="${by + td * .06}" width="11" height="${td * .16}" fill="${ctx.wireframe ? p.paper : '#202422'}" stroke="${ctx.wireframe ? p.ink : '#4d514a'}" stroke-width=".6"/><rect x="${bx + tw * .66}" y="${by + td * .06}" width="11" height="${td * .16}" fill="${ctx.wireframe ? p.paper : '#202422'}" stroke="${ctx.wireframe ? p.ink : '#4d514a'}" stroke-width=".6"/>`;
    }
    return out;
  }

  // ---------- side elevation ----------
  function renderSide(ctx) {
    const p = ctx.palette;
    const H = ctx.H, Dp = ctx.Dp;
    const s = Math.min(4.7, 420 / H, 330 / Dp);
    const bh = H * s, bd = Dp * s;
    const bodyX = 585 - bd / 2;
    const bodyY = 386 - bh / 2;
    const frontX = bodyX;
    const backX = bodyX + bd;
    const centerY = bodyY + bh / 2;
    const kit = ctx.options.kitLens;
    const lensDia = kit && kit.diameter ? kit.diameter : ({ E: 74, RF: 80, Z: 78, X: 70, L: 78, PL: 110, EF: 82, F: 76, M: 54, M43: 64, GFX: 96, FIXED: 48, K: 76 }[ctx.mountDef.id] || 74);
    const lensR = clamp(lensDia * s * .5, 28, bh * .38);
    const lensLen = clamp((kit ? (kit.length || 100) : 95) * s * .72, 80, 260);
    const lensCY = bodyY + bh * .44;
    let out = '';
    // shadow
    out += `<ellipse cx="${bodyX + bd * .52}" cy="${bodyY + bh + 32}" rx="${bd * .9 + lensLen * .2}" ry="26" fill="#171914" opacity=".24" filter="url(#shadow-${ctx.uid})"/>`;
    // battery grip / rig below
    if (ctx.accessories.batteryGrip || ctx.accessories.verticalGrip || ctx.accessories.shoulder) {
      const gh = ctx.accessories.shoulder ? 86 : (ctx.accessories.batteryGrip ? 92 : 66);
      const gw = bd * .86;
      const gx = frontX + bd * .1;
      out += `<path d="${roundedPath(gx, bodyY + bh - 6, gw, gh, 16)}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .2)}" stroke-width="1.1"/>`;
      out += `<circle cx="${gx + gw - 28}" cy="${bodyY + bh + 14}" r="7" fill="url(#metal-${ctx.uid})" stroke="${p.ink}" stroke-opacity=".3"/>`;
      if (ctx.accessories.shoulder) out += `<rect x="${frontX + bd * .18}" y="${bodyY + bh + gh + 24}" width="${bd * 1.25}" height="14" rx="7" fill="${ctx.wireframe ? p.paper : '#242826'}" stroke="${ctx.wireframe ? p.ink : '#575b52'}"/><rect x="${frontX + bd * .33}" y="${bodyY + bh + gh - 12}" width="12" height="${gh + 36}" fill="${ctx.wireframe ? p.paper : '#232724'}" stroke="${ctx.wireframe ? p.ink : '#4b5048'}" stroke-width=".7"/>`;
    }
    // top deck (profile slab)
    const topH = clamp(ctx.topStyle.height * bh * 1.7 + 9, 9, 70);
    const deckPath = roundedPath(frontX - 3, bodyY - topH, bd + 6, topH + 22, Math.min(11, topH * .35));
    out += `<path d="${deckPath}" fill="url(#top-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.top, .2)}" stroke-width="1.1"/>`;
    out += `<path d="${deckPath}" fill="url(#pat-${ctx.uid})" opacity=".7"/>`;
    // body profile
    const profilePath = ctx.silhouette.id === 'angular' || ctx.silhouette.id === 'cage'
      ? angularPath(bodyX, bodyY, bd, bh, Math.min(18, bh * .06))
      : roundedPath(bodyX, bodyY, bd, bh, Math.min(bd, bh) * .075);
    out += `<path d="${profilePath}" fill="url(#bodyVert-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.main, .22)}" stroke-width="1.2"/>`;
    out += `<path d="${profilePath}" fill="url(#pat-${ctx.uid})" opacity=".8"/>`;
    // grip profile
    const gw = clamp(ctx.body.gripD * s * .34, 12, bd * .5);
    const ghh = clamp(ctx.body.gripH * s * .8, bh * .18, bh * .8);
    const gx = frontX - gw * .36;
    const gy = bodyY + bh - ghh + 2;
    const gripShape = `M${gx},${gy} Q${gx - 8},${gy + ghh * .3} ${gx + 4},${gy + ghh * .65} Q${gx + 10},${gy + ghh} ${gx + gw * .9},${gy + ghh} H${bodyX + 5} V${gy} Z`;
    out += `<path d="${gripShape}" fill="url(#grip-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : darken(p.grip, .2)}" stroke-width="1.1"/>`;
    out += `<path d="${gripShape}" fill="url(#pat-${ctx.uid})" opacity=".9"/>`;
    out += `<path d="M${gx + 3},${gy + ghh * .2} Q${gx + 15},${gy + ghh * .45} ${gx + 5},${gy + ghh * .8}" fill="none" stroke="${ctx.wireframe ? p.ink : lighten(p.grip, .2)}" stroke-width="1.6" opacity=".22"/>`;
    // lens side view
    const lx = frontX - lensLen;
    const ly1 = lensCY - lensR, ly2 = lensCY + lensR;
    const barrel = `M${frontX + 5},${ly1 + 4} H${lx + lensR * .45} Q${lx + 8},${ly1 + 4} ${lx + 8},${lensCY} Q${lx + 8},${ly2 - 4} ${lx + lensR * .45},${ly2 - 4} H${frontX + 5} Z`;
    out += `<path d="${barrel}" fill="url(#lensBarrel-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#0c0e0d'}" stroke-width="1.2"/>`;
    // lens bands
    const ringColor = (D.RING_COLORS.find(r => r.id === ctx.mount.ringColor) || D.RING_COLORS[0]).hex;
    const bandCount = 4;
    for (let i = 0; i < bandCount; i++) {
      const bx = lx + lensLen * (.12 + i * .2);
      if (i === 1) {
        out += `<rect x="${bx}" y="${ly1 + 3}" width="${lensLen * .13}" height="${lensR * 2 - 6}" fill="${ctx.wireframe ? p.paper : darken(p.main, .03)}" stroke="${ctx.wireframe ? p.ink : '#4d514b'}" stroke-width=".7" opacity=".8"/>`;
        for (let k = 0; k < 20; k++) {
          out += `<line x1="${bx + 4 + k * lensLen * .0058}" y1="${ly1 + 8}" x2="${bx + 4 + k * lensLen * .0058}" y2="${ly2 - 8}" stroke="${ctx.wireframe ? p.ink : lighten(p.main, .28)}" stroke-width="1" opacity=".22"/>`;
        }
      } else {
        out += `<rect x="${bx}" y="${ly1 + 4}" width="${Math.max(2, lensR * .12)}" height="${lensR * 2 - 8}" fill="${ctx.wireframe ? 'none' : (i === 2 ? ringColor : '#3b3f3c')}" opacity="${i === 2 ? '.9' : '.65'}"/>`;
      }
    }
    // mount flange
    out += `<rect x="${frontX - 2}" y="${ly1 - 6}" width="15" height="${lensR * 2 + 12}" rx="4" fill="url(#metal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#74766d'}" stroke-width=".7"/>`;
    // front glass
    out += `<ellipse cx="${lx + 9}" cy="${lensCY}" rx="${lensR * .18}" ry="${lensR * .8}" fill="url(#glass-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#94978d'}" stroke-width="1"/>`;
    out += `<ellipse cx="${lx + 7}" cy="${lensCY - lensR * .12}" rx="${lensR * .08}" ry="${lensR * .38}" fill="#e6eee4" opacity=".12"/>`;
    // lens engravings
    if (!ctx.compact) {
      out += `<text x="${lx + lensLen * .38}" y="${lensCY - lensR * .45}" font-family="Bahnschrift, Arial Narrow, sans-serif" font-size="${clamp(lensR * .15, 4, 9)}" letter-spacing="1.2" fill="${ctx.wireframe ? p.ink : '#b8b9ae'}" opacity=".65">${escapeXML(kit ? kit.name.slice(0, 26) : 'FRAME OPTICS')}</text>`;
      out += `<text x="${lx + lensLen * .38}" y="${lensCY + lensR * .38}" font-family="Bahnschrift, Arial Narrow, sans-serif" font-size="${clamp(lensR * .11, 3.5, 7)}" letter-spacing="1" fill="${ctx.wireframe ? p.ink : '#898b81'}" opacity=".55">${ctx.mountDef.id} · ${kit ? (kit.maxAperture ? 'F' + kit.maxAperture : '') : ''}</text>`;
    }
    // viewfinder hump profile
    if (ctx.vfType.id !== 'none') {
      const vfH = clamp(bh * (ctx.vfType.id === 'pro' ? .2 : .14), 16, 70);
      const vfW = bd * (ctx.vfType.id === 'pro' ? .3 : .22);
      const pos = ctx.viewfinder.pos || 'top_center';
      const vx = frontX + bd * (pos === 'top_left' ? .2 : pos === 'top_right' ? .7 : .42);
      out += `<path d="${roundedPath(vx, bodyY - topH - vfH, vfW, vfH + 18, 8)}" fill="${ctx.wireframe ? p.paper : '#1e2220'}" stroke="${ctx.wireframe ? p.ink : '#4f544d'}" stroke-width="1"/>`;
      out += `<rect x="${vx + vfW - 8}" y="${bodyY - topH - vfH + 12}" width="9" height="${vfH * .52}" rx="3" fill="${ctx.wireframe ? 'none' : '#0d100f'}" stroke="${ctx.wireframe ? p.ink : '#5f665c'}" stroke-width=".6"/>`;
    }
    // top handle profile
    if (ctx.topStyle.id === 'cine_shoulder' || ctx.details.handle || ctx.accessories.cage) {
      out += `<path d="M${frontX + bd * .2},${bodyY - topH - 30} H${frontX + bd * .82} Q${frontX + bd * .9},${bodyY - topH - 30} ${frontX + bd * .9},${bodyY - topH - 18} V${bodyY - topH + 4}" fill="none" stroke="${ctx.wireframe ? p.ink : '#222624'}" stroke-width="12" stroke-linecap="round"/>`;
    }
    // screen at back
    if (ctx.screenType.id !== 'none') {
      const sh = bh * .38, sy = bodyY + bh * .22;
      out += `<rect x="${backX - 2}" y="${sy}" width="${ctx.screenType.id === 'sideflip' || ctx.screenType.id === 'fold' ? 17 : 11}" height="${sh}" rx="3" fill="${ctx.wireframe ? p.paper : '#101312'}" stroke="${ctx.wireframe ? p.ink : '#4d514a'}" stroke-width=".8"/>`;
      out += `<path d="M${backX + 14},${sy + 10} h6 M${backX + 14},${sy + sh - 10} h6" stroke="${ctx.wireframe ? p.ink : '#5d6159'}" stroke-width="1.5"/>`;
    }
    // buttons/dials on top profile
    const dials = ctx.controls.dials || {};
    let dialN = 0;
    ['front', 'rear', 'mode', 'extra'].forEach(k => { if (dials[k]) dialN++; });
    for (let i = 0; i < Math.min(3, dialN); i++) {
      const dx = frontX + bd * (.38 + i * .17), dy = bodyY - topH - 7;
      out += `<circle cx="${dx}" cy="${dy}" r="${clamp(bh * .026, 6, 14)}" fill="url(#darkMetal-${ctx.uid})" stroke="${ctx.wireframe ? p.ink : '#686b62'}" stroke-width=".7"/>`;
      out += ellipseKnurl(dx, dy, clamp(bh * .026, 6, 14), 18, ctx.wireframe ? p.ink : '#92958a', .8);
    }
    // ports profile
    out += `<rect x="${backX - 5}" y="${bodyY + bh * .48}" width="8" height="${bh * .13}" rx="2" fill="${ctx.wireframe ? 'none' : '#171a18'}" stroke="${ctx.wireframe ? p.ink : '#474b46'}" stroke-width=".6"/>`;
    out += `<rect x="${backX - 5}" y="${bodyY + bh * .65}" width="8" height="${bh * .045}" rx="1.5" fill="${ctx.wireframe ? 'none' : '#171a18'}" stroke="${ctx.wireframe ? p.ink : '#474b46'}" stroke-width=".6"/>`;
    // cage rails
    if (ctx.details.cage || ctx.accessories.cage || ctx.body.silhouette === 'cage') {
      out += `<rect x="${frontX - 15}" y="${bodyY - topH - 12}" width="${bd + 28}" height="${bh + topH + 32}" rx="8" fill="none" stroke="${ctx.wireframe ? p.ink : '#2a2e2b'}" stroke-width="5"/>`;
      out += `<rect x="${lhSafe(frontX - 15)}" y="${bodyY - topH - 12}" width="${bd + 28}" height="${bh + topH + 32}" rx="8" fill="none" stroke="${ctx.wireframe ? p.ink : '#5a5e56'}" stroke-width="1" opacity=".35"/>`;
    }
    // side annotations
    if (!ctx.compact) {
      const ink = '#4d4f46';
      out += `<g font-family="Bahnschrift, Arial Narrow, sans-serif" fill="${ink}" opacity=".68">
        <path d="M${bodyX},${bodyY - topH - 96} H${bodyX + bd}" stroke="${ink}" stroke-width=".8"/><path d="M${bodyX},${bodyY - topH - 101} V${bodyY - topH - 91} M${bodyX + bd},${bodyY - topH - 101} V${bodyY - topH - 91}" stroke="${ink}"/>
        <text x="${bodyX + bd / 2}" y="${bodyY - topH - 102}" text-anchor="middle" font-size="11">${Math.round(Dp)} mm depth</text>
        <path d="M${bodyX + bd + 70},${bodyY} V${bodyY + bh}" stroke="${ink}" stroke-width=".8"/><path d="M${bodyX + bd + 65},${bodyY} H${bodyX + bd + 75} M${bodyX + bd + 65},${bodyY + bh} H${bodyX + bd + 75}" stroke="${ink}"/>
        <text x="${bodyX + bd + 85}" y="${bodyY + bh / 2 + 3}" font-size="11">${Math.round(H)} mm</text>
        <text x="56" y="54" font-size="10" letter-spacing="2">SIDE ELEVATION</text>
        <text x="56" y="72" font-size="9" letter-spacing="1.2" opacity=".7">${escapeXML((ctx.design.name || 'UNTITLED').toUpperCase())}</text>
        <text x="944" y="632" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".6">${escapeXML(ctx.bodyType.name)} · ${escapeXML(ctx.topStyle.name)}</text>
      </g>`;
    }
    return out;
  }

  function lhSafe(v) { return v; }

  function drawAnnotations(ctx) {
    const p = ctx.palette;
    const x = ctx.bodyX, y = ctx.bodyY, W = ctx.bw, H = ctx.bh;
    const ink = '#4d4f46';
    const depthMm = Math.round(ctx.Dp);
    const labelY = y - 72;
    let out = `<g font-family="Bahnschrift, Arial Narrow, sans-serif" fill="${ink}" opacity=".72">`;
    // crop marks
    out += `<path d="M44,74v-25h25 M956,74v-25h-25 M44,610v25h25 M956,610v25h-25" fill="none" stroke="${ink}" stroke-width="1"/>`;
    // width dimension
    out += `<path d="M${x},${labelY} H${x + W}" stroke="${ink}" stroke-width=".9"/>`;
    out += `<path d="M${x},${labelY - 5} V${labelY + 5} M${x + W},${labelY - 5} V${labelY + 5}" stroke="${ink}" stroke-width="1"/>`;
    out += `<path d="M${x + 2},${labelY - 4} l-6,4 l6,4 M${x + W - 2},${labelY - 4} l6,4 l-6,4" fill="none" stroke="${ink}" stroke-width=".8"/>`;
    out += `<rect x="${x + W / 2 - 31}" y="${labelY - 11}" width="62" height="18" fill="#f1eee5" opacity=".9"/>`;
    out += `<text x="${x + W / 2}" y="${labelY + 2}" text-anchor="middle" font-size="11" letter-spacing=".8">${Math.round(ctx.W)} mm</text>`;
    // height dimension
    out += `<path d="M${x - 48},${y} V${y + H}" stroke="${ink}" stroke-width=".9"/>`;
    out += `<path d="M${x - 53},${y} H${x - 43} M${x - 53},${y + H} H${x - 43}" stroke="${ink}" stroke-width="1"/>`;
    out += `<rect x="${x - 83}" y="${y + H / 2 - 9}" width="58" height="18" fill="#f1eee5" opacity=".9"/>`;
    out += `<text x="${x - 54}" y="${y + H / 2 + 3}" text-anchor="middle" font-size="11" letter-spacing=".7">${Math.round(ctx.H)} mm</text>`;
    out += `<text x="56" y="54" font-size="10" letter-spacing="2" opacity=".7">FRAME / INDUSTRIAL DESIGN</text>`;
    out += `<text x="56" y="72" font-size="9" letter-spacing="1.3" opacity=".5">${escapeXML((ctx.design.name || 'UNTITLED').toUpperCase())} · ${String(ctx.view).toUpperCase()} ELEVATION</text>`;
    out += `<text x="944" y="54" text-anchor="end" font-size="9" letter-spacing="1.3" opacity=".55">SCALE 1:${(1 / clamp(ctx.scale / 8, .1, 10)).toFixed(1)}</text>`;
    out += `<text x="944" y="72" text-anchor="end" font-size="9" letter-spacing="1.1" opacity=".45">DEPTH ${depthMm} mm</text>`;
    out += `<text x="56" y="632" font-size="9" letter-spacing="1.2" opacity=".55">${escapeXML(ctx.material.name)} · ${escapeXML(ctx.finish.name)} · ${escapeXML(ctx.silhouette.name)}</text>`;
    out += `<text x="944" y="632" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".55">${escapeXML(ctx.colors.secondaryOn ? 'TWO-TONE' : 'MONOCHROME')} / ${escapeXML(ctx.mountDef.id)}</text>`;
    out += `</g>`;
    return out;
  }

  // ---------- lens renderer ----------
  function renderLensSVG(design, company, options) {
    options = options || {};
    const u = id('lens');
    const body = design.body || {};
    const optical = design.optical || {};
    const focus = design.focus || {};
    const mountId = design.mount && design.mount.type || 'E';
    const mountDef = D.MOUNTS[mountId] || D.MOUNTS.E;
    const style = D.LENS_STYLES[body.style] || D.LENS_STYLES.black_pro;
    const material = D.LENS_MATERIALS[body.material] || D.LENS_MATERIALS.aluminum;
    const lensType = D.LENS_TYPES[design.lensType] || D.LENS_TYPES.zoom;
    const coating = D.LENS_COATINGS[optical.coating] || D.LENS_COATINGS.basic;
    const isWhite = style.id === 'white_tele';
    const isSilver = style.id === 'silver_retro';
    const barrelColor = safeColor(body.color, isWhite ? '#d8d4c8' : isSilver ? '#b9b6ad' : '#202323');
    const accent = style.ring || '#a68a56';
    const length = clamp(num(body.length, 110), 20, 500);
    const diameter = clamp(num(body.diameter, 76), 20, 240);
    const weight = clamp(num(body.weight, 600), 60, 6000);
    const isZoom = Number(design.focalMax) > Number(design.focalMin) * 1.015;
    const aspherical = Math.max(0, Math.round(num(optical.aspherical, 0)));
    const ed = Math.max(0, Math.round(num(optical.ed, 0)));
    const fluorite = Math.max(0, Math.round(num(optical.fluorite, 0)));
    const s = Math.min(4.7, 500 / length, 300 / diameter);
    const len = length * s;
    const R = Math.max(46, diameter * s / 2);
    const cy = 316;
    const x0 = 500 - len / 2;
    const x1 = x0 + len;
    const frontR = R * (isWhite ? .96 : .92);
    const p = {
      paper: '#f1eee5', ink: '#20231e',
      dark: isWhite ? '#b4b1a7' : (isSilver ? '#87857e' : '#1c1f1e'),
      mid: isWhite ? '#d5d1c5' : (isSilver ? '#a29f95' : '#3a3e3b'),
      light: isWhite ? '#ede9de' : (isSilver ? '#d1cec4' : '#5a5f5a'),
      accent, glass: '#213840'
    };
    const wireframe = !!options.wireframe;
    const cutaway = options.view === 'cutaway';
    const barrelFill = wireframe ? p.paper : (isWhite ? 'url(#barrel-white-' + u + ')' : isSilver ? 'url(#barrel-silver-' + u + ')' : 'url(#barrel-dark-' + u + ')');
    const barrelTop = wireframe ? p.paper : (isWhite ? '#f1ede3' : isSilver ? '#e1ded4' : '#5d625d');
    const barrelBottom = wireframe ? p.paper : (isWhite ? '#a8a59b' : isSilver ? '#88867e' : '#101211');
    const textColor = wireframe ? p.ink : (isWhite || isSilver ? '#393b36' : '#b9baaf');
    const dimColor = '#4d4f46';
    let defs = `<defs>
      <linearGradient id="barrel-dark-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${barrelTop}"/><stop offset=".16" stop-color="${wireframe ? p.paper : '#2b2f2c'}"/><stop offset=".5" stop-color="${wireframe ? p.paper : p.mid}"/><stop offset=".83" stop-color="${wireframe ? p.paper : p.dark}"/><stop offset="1" stop-color="${barrelBottom}"/>
      </linearGradient>
      <linearGradient id="barrel-white-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f5f1e7"/><stop offset=".3" stop-color="#dedacf"/><stop offset=".72" stop-color="#bab6aa"/><stop offset="1" stop-color="#89877d"/>
      </linearGradient>
      <linearGradient id="barrel-silver-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f0ede4"/><stop offset=".23" stop-color="#c7c4ba"/><stop offset=".55" stop-color="#a09d94"/><stop offset=".8" stop-color="#d3d0c7"/><stop offset="1" stop-color="#7e7c74"/>
      </linearGradient>
      <linearGradient id="barrelMetal-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f0eee6"/><stop offset=".22" stop-color="#aaa9a1"/><stop offset=".4" stop-color="#e3e0d7"/><stop offset=".7" stop-color="#777972"/><stop offset="1" stop-color="#d2cfc6"/>
      </linearGradient>
      <radialGradient id="lensGlass-${u}" cx=".38" cy=".4" r=".6">
        <stop offset="0" stop-color="#85a1a2"/><stop offset=".2" stop-color="#36535b"/><stop offset=".55" stop-color="#182b32"/><stop offset=".8" stop-color="#3b5863"/><stop offset="1" stop-color="#0c1214"/>
      </radialGradient>
      <linearGradient id="glassCut-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a5c5c5" stop-opacity=".7"/><stop offset=".5" stop-color="#476d73" stop-opacity=".5"/><stop offset="1" stop-color="#1a3439" stop-opacity=".65"/>
      </linearGradient>
      <linearGradient id="lensShadow-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#151713" stop-opacity=".32"/><stop offset="1" stop-color="#151713" stop-opacity="0"/>
      </linearGradient>
      <pattern id="knurl-${u}" width="7" height="10" patternUnits="userSpaceOnUse">
        <rect width="7" height="10" fill="none"/><line x1="1" y1="0" x2="1" y2="10" stroke="${wireframe ? p.ink : lighten(barrelColor, .26)}" stroke-width="1.2" opacity=".35"/><line x1="4.5" y1="0" x2="4.5" y2="10" stroke="${wireframe ? p.ink : darken(barrelColor, .28)}" stroke-width=".9" opacity=".28"/>
      </pattern>
      <filter id="lensBlur-${u}" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="14"/></filter>
      <clipPath id="barrelClip-${u}"><path d="M${x0 + 24},${cy - R} H${x1 - 28} Q${x1},${cy - R} ${x1},${cy} Q${x1},${cy + R} ${x1 - 28},${cy + R} H${x0 + 24} Q${x0},${cy + R} ${x0},${cy} Q${x0},${cy - R} ${x0 + 24},${cy - R} Z"/></clipPath>
    </defs>`;
    let out = '';
    // shadow
    out += `<ellipse cx="${500 + len * .03}" cy="${cy + R + 54}" rx="${len * .44}" ry="${R * .17}" fill="#151713" opacity=".25" filter="url(#lensBlur-${u})"/>`;
    // mount flange left
    out += `<rect x="${x0 - 36}" y="${cy - R * .98}" width="46" height="${R * 1.96}" rx="7" fill="${wireframe ? p.paper : 'url(#barrelMetal-' + u + ')'}" stroke="${wireframe ? p.ink : '#7d7e76'}" stroke-width="1.1"/>`;
    out += `<rect x="${x0 - 37}" y="${cy - R * .82}" width="8" height="${R * 1.64}" rx="3" fill="${wireframe ? p.paper : '#2d312d'}" opacity=".55"/>`;
    for (let i = 0; i < 3; i++) {
      const yy = cy - R * .57 + i * R * .57;
      out += `<circle cx="${x0 - 17}" cy="${yy}" r="${Math.max(2, R * .028)}" fill="${wireframe ? p.ink : '#b6b5aa'}" opacity=".5"/>`;
    }
    // main barrel
    if (!cutaway) {
      out += `<path d="M${x0 + 24},${cy - R} H${x1 - 28} Q${x1},${cy - R} ${x1},${cy} Q${x1},${cy + R} ${x1 - 28},${cy + R} H${x0 + 24} Q${x0},${cy + R} ${x0},${cy} Q${x0},${cy - R} ${x0 + 24},${cy - R} Z" fill="${barrelFill}" stroke="${wireframe ? p.ink : '#0c0e0d'}" stroke-width="1.4"/>`;
      out += `<g clip-path="url(#barrelClip-${u})">
        <rect x="${x0}" y="${cy - R}" width="${len}" height="${R * .15}" fill="#fff" opacity=".09"/>
        <rect x="${x0}" y="${cy + R * .66}" width="${len}" height="${R * .2}" fill="#000" opacity=".16"/>
        <rect x="${x0}" y="${cy - R * .12}" width="${len}" height="${R * .055}" fill="#fff" opacity=".06"/>
      </g>`;
    } else {
      out += `<path d="M${x0 + 24},${cy - R} H${x1 - 28} Q${x1},${cy - R} ${x1},${cy} Q${x1},${cy + R} ${x1 - 28},${cy + R} H${x0 + 24} Q${x0},${cy + R} ${x0},${cy} Q${x0},${cy - R} ${x0 + 24},${cy - R} Z" fill="${wireframe ? p.paper : '#eeece3'}" fill-opacity="${wireframe ? '1' : '.22'}" stroke="${p.ink}" stroke-width="1.4" stroke-dasharray="5 3"/>`;
    }
    // ring positions
    const ringY = cy - R, ringH = R * 2;
    const apertureX = x0 + len * .19;
    const focusX = x0 + len * .39;
    const focusW = len * .18;
    const zoomX = x0 + len * .61;
    const zoomW = len * .16;
    // aperture ring
    out += `<rect x="${apertureX}" y="${ringY + 2}" width="${Math.max(8, len * .052)}" height="${ringH - 4}" fill="${wireframe ? p.paper : (isWhite ? '#c2beb3' : '#171a19')}" stroke="${wireframe ? p.ink : '#555951'}" stroke-width=".7" opacity=".92"/>`;
    for (let i = 0; i < 8; i++) {
      out += `<line x1="${apertureX + 5}" y1="${ringY + ringH * (.23 + i * .075)}" x2="${apertureX + len * .036}" y2="${ringY + ringH * (.23 + i * .075)}" stroke="${textColor}" stroke-width=".6" opacity=".38"/>`;
    }
    // focus ring with knurling
    out += `<rect x="${focusX}" y="${ringY + 1}" width="${focusW}" height="${ringH - 2}" fill="${wireframe ? p.paper : (isWhite ? '#c9c5ba' : (isSilver ? '#b1aea5' : '#282c29'))}" stroke="${wireframe ? p.ink : (isWhite ? '#a9a69b' : '#0e1110')}" stroke-width=".9"/>`;
    out += `<rect x="${focusX}" y="${ringY + 1}" width="${focusW}" height="${ringH - 2}" fill="url(#knurl-${u})" opacity="${wireframe ? .25 : .75}"/>`;
    out += `<path d="M${focusX + 3},${ringY + R * .32} H${focusX + focusW - 3} M${focusX + 3},${ringY + ringH - R * .32} H${focusX + focusW - 3}" stroke="${wireframe ? p.ink : '#a7a89e'}" stroke-width=".8" opacity=".34"/>`;
    // zoom ring
    if (design.focalMax && Number(design.focalMax) > Number(design.focalMin) * 1.015) {
      out += `<rect x="${zoomX}" y="${ringY + 2}" width="${zoomW}" height="${ringH - 4}" fill="${wireframe ? p.paper : (isWhite ? '#d3cfc4' : (isSilver ? '#bab7ae' : '#252927'))}" stroke="${wireframe ? p.ink : '#111311'}" stroke-width=".8"/>`;
      out += `<rect x="${zoomX}" y="${ringY + 2}" width="${zoomW}" height="${ringH - 4}" fill="url(#knurl-${u})" opacity="${wireframe ? .2 : .55}"/>`;
    }
    // cine gears
    if (design.lensType === 'cinema' && (body.focusGear || body.zoomGear)) {
      const gearXs = [focusX - 6, zoomX - 6];
      gearXs.forEach((gx, idx) => {
        if (idx === 1 && !body.zoomGear) return;
        for (let i = 0; i < 28; i++) {
          const yy = ringY + 6 + i * (ringH - 12) / 28;
          out += `<rect x="${gx}" y="${yy}" width="6" height="${(ringH - 12) / 28 * .54}" fill="${wireframe ? p.paper : '#3f4440'}" stroke="${wireframe ? p.ink : '#141716'}" stroke-width=".4"/>`;
        }
      });
    }
    // style accent ring near front
    out += `<rect x="${x1 - 54}" y="${ringY + 3}" width="11" height="${ringH - 6}" fill="${wireframe ? 'none' : accent}" stroke="${wireframe ? p.ink : 'none'}" opacity=".92"/>`;
    out += `<rect x="${x1 - 38}" y="${ringY + 4}" width="${Math.max(2, R * .035)}" height="${ringH - 8}" fill="${wireframe ? 'none' : (isWhite ? '#4d504a' : '#646860')}" opacity=".6"/>`;
    // front barrel taper
    out += `<path d="M${x1 - 22},${cy - R * .93} Q${x1 + 15},${cy - R * .9} ${x1 + 15},${cy} Q${x1 + 15},${cy + R * .9} ${x1 - 22},${cy + R * .93} Z" fill="${wireframe ? p.paper : (isWhite ? '#d2cec3' : (isSilver ? '#b8b5ac' : '#242826'))}" stroke="${wireframe ? p.ink : '#111311'}" stroke-width="1.1"/>`;
    // front glass ellipse
    out += `<ellipse cx="${x1 + 7}" cy="${cy}" rx="${Math.max(8, R * .15)}" ry="${R * .75}" fill="url(#lensGlass-${u})" stroke="${wireframe ? p.ink : '#93968d'}" stroke-width="1.1"/>`;
    out += `<ellipse cx="${x1 + 2}" cy="${cy - R * .16}" rx="${Math.max(3, R * .045)}" ry="${R * .35}" fill="#e7efe5" opacity=".1"/>`;
    out += `<path d="M${x1 - 7},${cy - R * .67} Q${x1 + 10},${cy - R * .3} ${x1 + 3},${cy - R * .02}" fill="none" stroke="#e5efe9" stroke-width="1.2" opacity=".13"/>`;
    // distance window
    out += `<ellipse cx="${focusX + focusW * .42}" cy="${cy - R * .52}" rx="${Math.max(12, focusW * .23)}" ry="${Math.max(6, R * .15)}" fill="${wireframe ? p.paper : '#d1cdc0'}" stroke="${wireframe ? p.ink : '#72756c'}" stroke-width=".7" opacity=".8"/>`;
    out += `<text x="${focusX + focusW * .42}" y="${cy - R * .49}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(R * .075, 3, 6)}" fill="${wireframe ? p.ink : '#3e403a'}" opacity=".8">0.38 — ∞</text>`;
    // AF / OIS switches
    out += `<rect x="${x0 + len * .19}" y="${cy + R * .55}" width="${Math.max(24, len * .07)}" height="9" rx="3" fill="${wireframe ? p.paper : '#1b1e1c'}" stroke="${wireframe ? p.ink : '#62665e'}" stroke-width=".6" opacity=".9"/>`;
    out += `<rect x="${x0 + len * .19 + 2}" y="${cy + R * .55 + 2}" width="10" height="5" rx="2" fill="${wireframe ? p.ink : '#b9b8ac'}" opacity=".6"/>`;
    out += `<text x="${x0 + len * .2}" y="${cy + R * .74}" font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(R * .07, 2.8, 5.4)}" fill="${textColor}" opacity=".55">AF / MF</text>`;
    // engravings
    if (!wireframe) {
      out += `<text x="${x0 + len * .32}" y="${cy + R * .31}" font-family="Bahnschrift, Arial Narrow, sans-serif" font-size="${clamp(R * .09, 3.4, 7)}" letter-spacing="1.1" fill="${textColor}" opacity=".7">${escapeXML((design.name || 'FRAME LENS').slice(0, 30))}</text>`;
      out += `<text x="${x0 + len * .32}" y="${cy + R * .13}" font-family="Bahnschrift, Arial Narrow, sans-serif" font-size="${clamp(R * .06, 2.6, 5.4)}" letter-spacing=".8" fill="${textColor}" opacity=".43">${escapeXML((mountDef.id || '').toUpperCase())} · ${coating.name}</text>`;
    }
    // hood hint for tele
    if (design.lensType === 'tele' || style.id === 'white_tele') {
      out += `<path d="M${x1 + 14},${cy - R * .99} L${x1 + 50},${cy - R * 1.1} V${cy + R * 1.1} L${x1 + 14},${cy + R * .99} Z" fill="${wireframe ? p.paper : (isWhite ? '#e5e1d6' : '#202422')}" stroke="${wireframe ? p.ink : '#5b5e57'}" stroke-width=".8" opacity=".8"/>`;
    }
    // cutaway content
    if (cutaway) {
      const glassPositions = [];
      const count = clamp(Number(optical.elements) || 12, 5, 20);
      const start = x0 + len * .18, end = x1 - len * .04;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? .5 : i / (count - 1);
        glassPositions.push({ x: start + (end - start) * t, index: i });
      }
      // lens elements
      glassPositions.forEach((g, i) => {
        const base = Math.sin((i + 1) * 1.7) * .18 + .62;
        const h = R * (0.3 + (base - .45) * 1.1);
        const w = clamp(10, 32, len * .024);
        let specialColor = '#7fa7a7';
        if (i < aspherical) specialColor = '#c99558';
        else if (i >= count - ed - fluorite && i < count - fluorite) specialColor = '#789ac7';
        else if (i >= count - fluorite) specialColor = '#8eb88d';
        out += `<g opacity=".85"><ellipse cx="${g.x}" cy="${cy}" rx="${w}" ry="${h}" fill="${specialColor}" fill-opacity=".22" stroke="${specialColor}" stroke-width="1.1"/><ellipse cx="${g.x - 3}" cy="${cy}" rx="${w * .45}" ry="${h * .68}" fill="#d5e2de" opacity=".08"/></g>`;
        if (!options.compact && i % 3 === 0) out += `<text x="${g.x}" y="${cy + R + 22}" text-anchor="middle" font-family="Bahnschrift, Arial, sans-serif" font-size="6" fill="${dimColor}" opacity=".55">L${i + 1}</text>`;
      });
      // rays
      out += `<g stroke="${wireframe ? p.ink : '#d8bf83'}" stroke-width=".8" opacity=".35" fill="none">`;
      out += `<path d="M${x1 + 10},${cy - R * .55} L${x0 + len * .3},${cy - 22} L${x1 + 10},${cy + R * .42}"/>`;
      out += `<path d="M${x1 + 10},${cy - R * .25} L${x0 + len * .3},${cy - 5} L${x1 + 10},${cy + R * .2}"/>`;
      out += `</g>`;
      // labels
      out += `<g font-family="Bahnschrift, Arial, sans-serif" font-size="${clamp(R * .09, 4, 8)}" fill="${dimColor}" opacity=".65">
        <text x="${start - 4}" y="${cy - R - 16}">ASPH × ${aspherical}</text>
        <text x="${start + 75}" y="${cy - R - 16}">ED × ${ed}</text>
        <text x="${start + 135}" y="${cy - R - 16}">FL × ${fluorite}</text>
        <text x="${x1 - 30}" y="${cy + R + 44}" text-anchor="end">FRONT</text>
        <text x="${x0 + 16}" y="${cy + R + 44}">MOUNT</text>
      </g>`;
    }
    // dimensions / annotations
    if (!options.compact) {
      const dimY = cy - R - 64;
      out += `<g font-family="Bahnschrift, Arial Narrow, sans-serif" fill="${dimColor}" opacity=".68">
        <path d="M44,74v-25h25 M956,74v-25h-25 M44,592v25h25 M956,592v25h-25" fill="none" stroke="${dimColor}" stroke-width="1"/>
        <path d="M${x0},${dimY} H${x1}" stroke="${dimColor}" stroke-width=".9"/><path d="M${x0},${dimY - 5} V${dimY + 5} M${x1},${dimY - 5} V${dimY + 5}" stroke="${dimColor}"/>
        <text x="${500}" y="${dimY - 9}" text-anchor="middle" font-size="11">${Math.round(length)} mm</text>
        <path d="M${x1 + 69},${cy - R} V${cy + R}" stroke="${dimColor}" stroke-width=".9"/><path d="M${x1 + 63},${cy - R} H${x1 + 75} M${x1 + 63},${cy + R} H${x1 + 75}" stroke="${dimColor}"/>
        <text x="${x1 + 84}" y="${cy + 4}" font-size="11">⌀ ${Math.round(diameter)} mm</text>
        <text x="${x1 + 84}" y="${cy + 20}" font-size="9" opacity=".7">${Math.round(weight)} g</text>
        <text x="56" y="54" font-size="10" letter-spacing="2">FRAME / OPTICS LAB</text>
        <text x="56" y="72" font-size="9" letter-spacing="1.2" opacity=".7">${escapeXML((design.name || 'UNTITLED').toUpperCase())} · ${cutaway ? 'OPTICAL SECTION' : 'SIDE ELEVATION'}</text>
        <text x="944" y="54" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".65">${escapeXML(mountDef.id)} · ${escapeXML(coating.name)}</text>
        <text x="944" y="72" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".5">${escapeXML(material.name)} · ${escapeXML(style.name)}</text>
        <text x="56" y="622" font-size="9" letter-spacing="1.2" opacity=".58">${isZoom ? (Number(design.focalMin) + '—' + Number(design.focalMax) + 'mm') : (Number(design.focalMin) + 'mm')} · ${design.lensType === 'cinema' ? 'T' : 'F'}${Number(design.maxAperture).toFixed(1)} · ${elements(optical)}</text>
        <text x="944" y="622" text-anchor="end" font-size="9" letter-spacing="1.2" opacity=".58">${escapeXML(lensType.name)} · ${escapeXML(coating.name)}</text>
      </g>`;
    }
    return `<svg class="lens-render" viewBox="0 0 1000 640" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeXML(design.name || '镜头设计预览')}">${defs}${out}</svg>`;
  }

  function elements(optical) {
    return `${Number(optical.elements) || 0} 片 / ${Number(optical.groups) || 0} 组`;
  }

  // ---------- small line icons / thumbnails ----------
  function bodyIcon(bodyTypeId, categoryId) {
    const b = D.BODY_TYPES[bodyTypeId] || D.BODY_TYPES.mirrorless;
    const type = b.id;
    let bodyW = 84, bodyH = 54, bodyX = 28, bodyY = 26;
    if (type === 'compact') { bodyW = 92; bodyH = 42; bodyY = 34; }
    else if (type === 'rangefinder' || type === 'retro') { bodyW = 90; bodyH = 46; bodyY = 30; }
    else if (type === 'cinema') { bodyW = 82; bodyH = 56; bodyX = 29; bodyY = 20; }
    else if (type === 'gimbal') { bodyW = 36; bodyH = 72; bodyX = 52; bodyY = 14; }
    else if (type === 'action') { bodyW = 48; bodyH = 48; bodyX = 46; bodyY = 28; }
    else if (type === 'dslr') { bodyW = 90; bodyH = 55; bodyX = 25; bodyY = 28; }
    let extra = '';
    if (type === 'gimbal') extra = `<circle cx="70" cy="30" r="16" fill="none"/><rect x="56" y="59" width="28" height="12" rx="3" fill="none"/>`;
    else if (type === 'action') extra = `<circle cx="70" cy="52" r="16" fill="none"/><rect x="24" y="30" width="8" height="20" rx="2" fill="none"/>`;
    else if (type === 'cinema') extra = `<rect x="40" y="12" width="60" height="7" rx="3" fill="none"/><circle cx="74" cy="50" r="19" fill="none"/>`;
    else extra = `<circle cx="70" cy="53" r="18" fill="none"/><rect x="${bodyX + bodyW - 23}" y="${bodyY + 13}" width="20" height="${bodyH - 9}" rx="8" fill="none"/><path d="M${bodyX + 20} ${bodyY - 3} v5 M${bodyX + bodyW - 20} ${bodyY - 3} v5"/>`;
    return `<svg viewBox="0 0 140 100" class="body-icon-svg" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${type === 'action' ? 10 : 3}"/><path d="M${bodyX + 8} ${bodyY} v-8 h${bodyW * .24} v8 M${bodyX + bodyW * .58} ${bodyY} v-8 h${bodyW * .18} v8"/>${extra}</g></svg>`;
  }

  function screenPreviewSVG(view) {
    const fakeDesign = {
      name: 'PREVIEW', body: { type: 'mirrorless', silhouette: 'rounded', top: 'arc', front: 'big_grip', width: 136, height: 96, depth: 74, roundness: 44, gripH: 52, gripD: 58, gripCurve: 58 }, materials: { body: 'magnesium', finish: 'anodized', frame: 'metal', topPlate: 'metal' },
      colors: { main: '#222525', grip: '#242827', top: '#b7b5ac', accent: '#b58c4d', secondaryOn: true, secondary: '#b7b5ac', nameplate: '#d3cfc4', button: '#393d3a', dial: '#3b3f3b', accentLine: true },
      controls: { buttons: { shutter: { enabled: true, pos: 'top_right' }, record: { enabled: false }, play: { enabled: true, pos: 'back_upper_right' }, menu: { enabled: true, pos: 'back_upper_left' }, fn: { enabled: true, pos: 'back_lower_right' }, c1: { enabled: false }, c2: { enabled: false }, c3: { enabled: false } }, dials: { front: true, rear: true, mode: true, extra: false }, joystick: true, touchZone: 'whole' },
      screen: { type: 'sideflip', size: 3.2, bezel: 5, touch: true, res: '1080p', nits: 1000, gamut: 'p3', refresh: 60 },
      viewfinder: { type: 'pro', pos: 'top_center', res: '3.69m' }, mount: { type: view === 'lens' ? 'RF' : 'E', ringColor: 'silver', ringMaterial: 'stainless', align: 'center', ratio: 100 },
      details: { vents: true, knurl: false, nameplate: true, redline: true, goldring: true, bluering: false, cage: false, handle: false, expansion: false, portstyling: false },
      accessories: { batteryGrip: false, verticalGrip: false, mic: false, monitor: false, fan: false, cage: false, shoulder: false, wireless: false, flash: false },
      sensor: { format: 'ff' }, video: { res: '8K', fps: 30 }, createdAt: 2026
    };
    return renderCameraPreview(fakeDesign, { color: '#b58c4d', mark: 'FRAME' }, { view: 'front', annotations: false });
  }

  // ---------- public API ----------
  window.Preview = {
    renderCamera: function (design, company, options) {
      options = options || {};
      const ctx = buildContext(design, company, options);
      const view = ctx.view;
      let body = '';
      if (view === 'back') body = renderBack(ctx);
      else if (view === 'top') body = renderTop(ctx);
      else if (view === 'side') body = renderSide(ctx);
      else body = renderFront(ctx);
      const defs = buildDefs(ctx, options);
      const ownAnnotations = view === 'top' || view === 'side';
      const annotations = ctx.compact || options.annotations === false || ownAnnotations ? '' : drawAnnotations(ctx);
      return `<svg class="camera-render" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeXML(design.name || '相机设计预览')}">${defs}${body}${annotations}</svg>`;
    },
    renderLens: function (design, company, options) { return renderLensSVG(design, company, options || {}); },
    bodyIcon,
    buildContext
  };

  function renderCameraPreview(design, company, options) {
    return window.Preview.renderCamera(design, company, options);
  }
})();
