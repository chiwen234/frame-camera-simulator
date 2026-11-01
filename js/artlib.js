/* =========================================================
   FRAME — reference intelligence layer
   ---------------------------------------------------------
   • proportion solver / structural guard ("reality guard")
     turns free-form player parameters into a physically
     plausible camera build sheet
   • brand DNA application (takeover branch)
   • category reference fitting (new-company branch)
   • local reference cache (IndexedDB) + Wikimedia Commons
     thumbnail retrieval (optional, offline-friendly)
   • on-device silhouette analysis of cached reference photos
   • product-shot cache used by the whole UI
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_ART_DATA;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const num = (v, f) => { const n = Number(v); return Number.isFinite(n) ? n : f; };
  const r1 = v => Math.round(v * 10) / 10;
  const hex = c => /^#[0-9a-fA-F]{6}$/.test(String(c || '')) ? String(c) : '#222426';
  const median = arr => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  function shade(c, amt) {
    const h = hex(c).slice(1);
    const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    const out = rgb.map(v => {
      const n = amt >= 0 ? v + (255 - v) * amt : v * (1 + amt);
      return clamp(Math.round(n), 0, 255);
    });
    return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function luminance(c) {
    const h = hex(c).slice(1);
    const v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function hashString(str) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
    }
    return h1.toString(36) + h2.toString(36);
  }
  const round = (v, step) => Math.round(v / step) * step;

  /* =========================================================
     Brand DNA resolution
     ========================================================= */
  const SIL_STYLE = {
    rect: { top: 'flat', front: 'straight', cornerBias: -0.05, bevelBias: 0.02 },
    rounded: { top: 'arc', front: 'big_grip', cornerBias: 0.04, bevelBias: 0.06 },
    angular: { top: 'flat', front: 'layered', cornerBias: -0.12, bevelBias: -0.05 },
    retroblock: { top: 'flush', front: 'retro_face', cornerBias: -0.09, bevelBias: -0.02 },
    ergo: { top: 'arc', front: 'big_grip', cornerBias: 0.02, bevelBias: 0.05 },
    cage: { top: 'cine', front: 'pro_face', cornerBias: -0.14, bevelBias: -0.06 },
    modular: { top: 'modular', front: 'pro_face', cornerBias: -0.11, bevelBias: -0.04 }
  };
  const FRONT_STYLE = {
    straight: { grip: 0.82, bulge: 0.55, texture: 'smooth' },
    big_grip: { grip: 1.0, bulge: 0.85, texture: 'rubber' },
    layered: { grip: 0.9, bulge: 0.7, texture: 'smooth' },
    round_port: { grip: 0.7, bulge: 0.6, texture: 'smooth' },
    retro_face: { grip: 0.34, bulge: 0.35, texture: 'leather' },
    pro_face: { grip: 0.92, bulge: 0.72, texture: 'rubber' }
  };

  function brandFor(company) {
    const id = company && company.id;
    const base = D.BRANDS[id] && D.modelsForBrand(id).length ? D.BRANDS[id] : D.BRANDS.frame;
    const dna = Object.assign({}, base);
    if (!company || company.isReal) {
      dna.wordmark = (base.wordmark || (company && company.en) || 'FRAME');
      dna.mark = (company && company.mark) || base.mark;
      dna.logoStyle = base.logoStyle || 'text';
      if (company && company.design && company.design.accent) dna.accent = company.design.accent;
      return dna;
    }
    // New company: derive a coherent house style from its chosen visual language.
    const arche = company.archetype || 'minimal';
    const style = company.style || 'industrial';
    dna.id = 'frame';
    dna.wordmark = (company.mark || company.en || company.name || 'FRAME').toString().slice(0, 14);
    dna.mark = company.logo || (company.en || 'F').charAt(0);
    dna.logoStyle = 'text';
    dna.accent = (company.design && company.design.accent) || company.color || base.accent;
    dna.bodyColor = (company.design && company.design.mainColor) || base.bodyColor;
    dna.topColor = (company.design && company.design.topColor) || base.topColor;
    dna.gripColor = (company.design && company.design.gripColor) || base.gripColor;
    const tune = {
      industrial: { corner: 0.12, bevel: 0.3, softness: 0.5, top: 'flush', hump: 'low', grip: 0.95, dials: 2, dialStyle: 'milled', mountRing: '#b9b6ac', texture: 'machined', finish: 'matte' },
      heritage: { corner: 0.07, bevel: 0.24, softness: 0.35, top: 'flat', hump: 'none', grip: 0.42, dials: 3, dialStyle: 'stepped', mountRing: '#c4c0b4', texture: 'leather', finish: 'leathergrain' },
      noir: { corner: 0.05, bevel: 0.2, softness: 0.2, top: 'flat', hump: 'none', grip: 0.5, dials: 1, dialStyle: 'flat', mountRing: '#4c504e', texture: 'machined', finish: 'matte' },
      pop: { corner: 0.2, bevel: 0.4, softness: 0.9, top: 'arc', hump: 'smooth', grip: 0.7, dials: 1, dialStyle: 'knurled', mountRing: '#b9b6ac', texture: 'smooth', finish: 'enamel' },
      field: { corner: 0.16, bevel: 0.36, softness: 0.7, top: 'arc', hump: 'low', grip: 1.05, dials: 2, dialStyle: 'knurled', mountRing: '#5d615b', texture: 'rubber', finish: 'powder' }
    }[style] || {};
    const archeTune = {
      minimal: { top: 'flush', hump: 'low', dials: 1, dialStyle: 'milled' },
      heritage: { top: 'flat', hump: 'none', dials: 3, dialStyle: 'stepped', texture: 'leather' },
      cinema: { top: 'cine', hump: 'none', dials: 1, dialStyle: 'flat', texture: 'machined' },
      street: { top: 'flat', hump: 'none', dials: 2, dialStyle: 'knurled', finish: 'enamel' },
      value: { top: 'flat', hump: 'low', dials: 2, dialStyle: 'knurled' }
    }[arche] || {};
    Object.assign(dna, tune, archeTune);
    dna.notes = '自建品牌：结构干净、比例克制。';
    dna.signature = [];
    dna.classic = [];
    return dna;
  }

  /* =========================================================
     Reference sets
     ========================================================= */
  function referenceModels(opts) {
    const company = opts.company;
    const category = opts.category;
    const brandId = company && (company.isReal || D.modelsForBrand(company.id).length > 0) ? company.id : null;
    const catGuide = D.CATEGORY_GUIDE[category] || D.CATEGORY_GUIDE.mirrorless;
    let list = [];
    if (brandId && D.modelsForBrand(brandId).length) {
      list = D.modelsForBrand(brandId).slice();
      const sig = (D.BRANDS[brandId] && D.BRANDS[brandId].signature) || [];
      list.sort((a, b) => {
        const ac = a.cat === category ? 0 : 1;
        const bc = b.cat === category ? 0 : 1;
        if (ac !== bc) return ac - bc;
        const ai = sig.indexOf(a.id);
        const bi = sig.indexOf(b.id);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
    } else {
      const ids = D.CATEGORY_SETS[category] || D.CATEGORY_SETS.mirrorless;
      list = ids.map(id => D.modelById(id)).filter(Boolean);
      (catGuide.extra || []).forEach(id => { const m = D.modelById(id); if (m && !list.includes(m)) list.push(m); });
    }
    return list.slice(0, opts.limit || 6);
  }

  function referenceFit(refs, catGuide) {
    if (!refs || !refs.length) {
      return {
        ratio: catGuide.ratio, depth: catGuide.depthRatio, corner: catGuide.corner || 0.1,
        grip: catGuide.g, top: catGuide.top, hump: catGuide.hump, dials: catGuide.dials,
        lens: catGuide.lensRatio, count: 0
      };
    }
    return {
      ratio: median(refs.map(m => m.h / m.w)),
      depth: median(refs.map(m => m.d / m.h)),
      corner: median(refs.map(m => m.corner || 0.1)),
      grip: [median(refs.map(m => (m.g ? m.g[0] : 0.5))), median(refs.map(m => (m.g ? m.g[1] : 0.25))), median(refs.map(m => (m.g ? m.g[2] : 0.6)))],
      top: refs[0].top, hump: refs[0].hump, evf: refs[0].evf, screen: refs[0].scr,
      dials: Math.round(median(refs.map(m => m.dials || 2))),
      lens: median(refs.map(m => (D.MOUNT_LENS_DIAMETER[m.mount] || 74) / m.h)),
      count: refs.length
    };
  }

  /* =========================================================
     Proportion solver ("Reality Guard")
     ========================================================= */
  function resolveSpec(design, company, options) {
    options = options || {};
    const designSafe = design || {};
    const category = designSafe.category || 'mirrorless';
    const cat = D.CATEGORY_GUIDE[category] || D.CATEGORY_GUIDE.mirrorless;
    const brand = brandFor(company);
    const refs = options.references || referenceModels({ company, category, limit: 6 });
    const fit = referenceFit(refs, cat);
    const adherence = clamp(num(options.adherence, 0.7), 0, 1);
    const corrections = [];

    const body = designSafe.body || {};
    const silId = body.silhouette || cat.silhouette || 'rounded';
    const sil = SIL_STYLE[silId] || SIL_STYLE.rounded;
    const frontId = body.front || 'big_grip';
    const front = FRONT_STYLE[frontId] || FRONT_STYLE.big_grip;

    /* ---- 1. body envelope ---------------------------------- */
    let W = num(body.width, 136);
    let H = num(body.height, 96);
    let Dp = num(body.depth, 74);

    const wLo = cat.w[0], wHi = cat.w[1];
    const widthOut = clamp(W, wLo * 0.92, wHi * 1.05);
    if (Math.abs(widthOut - W) > 1.2) {
      corrections.push({ key: 'W', label: '机身宽度', from: Math.round(W), to: Math.round(widthOut), unit: 'mm', reason: `该品类现实机型区间约 ${wLo}–${wHi}mm` });
      W = widthOut;
    }
    // Height is expressed as a ratio of width and blended toward the reference median.
    const targetRatio = lerp(H / Math.max(1, W), fit.ratio, adherence * 0.55);
    const ratioLo = cat.ratio * 0.86, ratioHi = cat.ratio * 1.16;
    const safeRatio = clamp(targetRatio, ratioLo, ratioHi);
    let Hraw = W * safeRatio;
    const hLo = cat.h[0], hHi = cat.h[1];
    Hraw = clamp(Hraw, Math.min(hLo, W * ratioLo), Math.max(hHi, W * ratioHi));
    if (Math.abs(Hraw - H) > 1.4) {
      corrections.push({ key: 'H', label: '机身高度', from: Math.round(H), to: Math.round(Hraw), unit: 'mm', reason: `按${refs.length ? '参考机型' : '品类基准'}宽高比 ${safeRatio.toFixed(2)} 校正` });
    }
    H = Hraw;

    // The manufacturer "depth" figure includes the forward grip and eyecup,
    // so the body shell is thinner than the published number.
    const depthTarget = clamp(Dp / Math.max(1, H), cat.depthRatio * 0.8, cat.depthRatio * 1.22);
    const depthBlend = lerp(depthTarget, fit.depth, adherence * 0.45);
    let Dtotal = H * clamp(depthBlend, cat.depthRatio * 0.8, cat.depthRatio * 1.25);
    if (Math.abs(Dtotal - Dp) > 1.6) {
      corrections.push({ key: 'D', label: '机身厚度', from: Math.round(Dp), to: Math.round(Dtotal), unit: 'mm', reason: `厚度/高度比 ${clamp(depthBlend, 0, 9).toFixed(2)} 更接近真实结构` });
    }

    /* ---- 2. grip & body shell depth ------------------------ */
    const gripRef = fit.grip;
    const gripBaseH = (gripRef[0] || 0.6) * H;
    let gripH = clamp(num(body.gripH, gripBaseH), 0, H * 0.98);
    let gripW = clamp(num(body.gripD, 48), 0, W * 0.4);
    let gripProtrude = clamp(num(body.gripCurve, gripRef[2] * 100) * 0.17 + Dtotal * 0.02, 5, Dtotal * 0.3);
    const gripEnabled = gripH > 3 && gripW > 3 && category !== 'action' && frontId !== 'retro_face';
    if (gripEnabled) {
      const hMin = H * (category === 'compact' ? 0.02 : 0.3);
      const hMax = H * 0.62;
      const wMin = W * 0.16, wMax = W * 0.34;
      const dMin = 5, dMax = Dtotal * 0.32;
      const newH = clamp(gripH, hMin, hMax);
      const newW = clamp(gripW, wMin, wMax);
      const newD = clamp(gripProtrude, dMin, dMax);
      if (Math.abs(newH - gripH) > 2) corrections.push({ key: 'gripH', label: '握柄高度', from: Math.round(gripH), to: Math.round(newH), unit: 'mm', reason: '握柄需要与机身高度保持合理比例' });
      if (Math.abs(newW - gripW) > 2) corrections.push({ key: 'gripD', label: '握柄宽度', from: Math.round(gripW), to: Math.round(newW), unit: 'mm', reason: '过宽的握柄会破坏前脸比例' });
      if (Math.abs(newD - gripProtrude) > 2) corrections.push({ key: 'gripCurve', label: '握柄凸出量', from: Math.round(gripProtrude), to: Math.round(newD), unit: 'mm', reason: '握柄凸出量受机身厚度限制' });
      gripH = newH; gripW = newW; gripProtrude = newD;
    }
    // Body shell depth excludes most of the grip protrusion.
    Dp = clamp(Dtotal - (gripEnabled ? gripProtrude * 0.9 : 0), H * 0.32, Dtotal * 0.97);

    /* ---- 3. surface language ------------------------------- */
    const roundness = clamp(num(body.roundness, 40), 0, 100);
    const cornerSignal = clamp((sil.cornerBias + (brand.corner || 0.12)) * 0.5 + lerp(0.05, 0.16, roundness / 100) + 0.06, 0.03, 0.2);
    const cornerR = Math.min(W, H) * cornerSignal * 0.95;
    const bevelR = clamp(Math.min(H, Dp) * (0.05 + (brand.bevel || 0.25) * 0.05 + (sil.bevelBias || 0) * 0.02 + roundness / 2600), 2.6, 11);
    const softFactor = clamp((brand.softness || 0.6) * 0.7 + roundness / 220, 0.1, 1);

    /* ---- 4. top plate & viewfinder hump -------------------- */
    const topStyleId = body.top || cat.top || 'arc';
    const topStyleMap = { flat: 'flat', arc: 'arc', prism: 'prism', shoulder: 'arc', flush: 'flush', cine_shoulder: 'cine', modular: 'flat' };
    let topStyle = topStyleMap[topStyleId] || 'arc';
    if (category === 'cinema') topStyle = 'cine';
    if (category === 'action') topStyle = 'flush';
    const topH = clamp(H * (cat.top + (topStyleId === 'prism' ? 0.03 : 0)) * (0.68 + (brand.top === 'arc' ? 0.07 : 0)), 3.5, 17);

    const vf = designSafe.viewfinder || {};
    const vfType = vf.type || 'pro';
    const humpStyle = vfType === 'none' ? 'none'
      : (vfType === 'eyelevel' && silId === 'retroblock' ? 'prism'
        : (brand.hump === 'tall' ? 'tall' : brand.hump === 'smooth' ? 'smooth' : brand.hump === 'prism' ? 'prism' : 'low'));
    let humpH = vfType === 'none' ? 0 : H * (cat.hump * 0.82 + (vfType === 'pro' ? 0.035 : vfType === 'small' ? 0.01 : 0.025));
    humpH = clamp(humpH, 2, H * 0.28);
    if (humpStyle === 'low') humpH *= 0.55;
    if (category === 'cinema' || category === 'action') humpH = 0;
    const humpW = clamp(W * (brand.humpR || 0.32) * (vfType === 'pro' ? 0.8 : 0.7), W * 0.15, W * 0.34);
    const humpD = clamp(Dp * 0.6, Dp * 0.4, Dp * 0.82);
    const humpPos = (vf.pos === 'top_left' || category === 'retro') ? -W * 0.2 : (vf.pos === 'top_right' ? W * 0.2 : 0);

    /* ---- 5. colours & materials ---------------------------- */
    const colors = designSafe.colors || {};
    const materials = designSafe.materials || {};
    const matId = materials.body || 'magnesium';
    const finishId = materials.finish || 'matte';
    const materialDef = (window.FRAME_DATA && window.FRAME_DATA.MATERIALS && window.FRAME_DATA.MATERIALS[matId]) || { id: matId, name: matId };
    const finishDef = (window.FRAME_DATA && window.FRAME_DATA.FINISHES && window.FRAME_DATA.FINISHES[finishId]) || { id: finishId, name: finishId, gloss: 20 };
    const accent = hex(colors.accent || brand.accent || '#d8a65a');
    const mainColor = hex(colors.main || brand.bodyColor || '#222426');
    const topColor = colors.secondaryOn ? hex(colors.top || brand.topColor || shade(mainColor, 0.08)) : hex(shade(colors.top || mainColor, -0.015));
    const gripColor = hex(shade(colors.grip || (colors.secondaryOn ? brand.gripColor || shade(mainColor, -0.06) : shade(mainColor, -0.03)), 0.08));
    const buttonColor = hex(colors.button || shade(mainColor, 0.16));
    const dialColor = hex(colors.dial || shade(mainColor, 0.1));
    const finishGloss = clamp(num(body.finishGloss, finishDef.gloss || 20), 0, 100);
    const surface = surfaceFor(matId, finishId, brand);

    /* ---- 6. mount & lens ----------------------------------- */
    const mount = designSafe.mount || {};
    const mountId = mount.type || cat.mount || 'E';
    const mountDia = ({ E: 46, RF: 54, Z: 55, X: 44, L: 51.6, EF: 54, F: 44, PL: 54, M: 44, M43: 38, GFX: 65, K: 47, B4: 48, FIXED: 0 })[mountId] || 46;
    const kit = options.kitLens || null;
    const integratedLens = mountId === 'FIXED';
    let lensDia, lensLen;
    if (integratedLens) {
      lensDia = clamp(H * 0.56, 22, 74);
      lensLen = clamp(H * 0.3, 10, 46);
    } else if (kit && (kit.diameter || (kit.design && kit.design.body && kit.design.body.diameter))) {
      const kb = kit.design && kit.design.body ? kit.design.body : {};
      lensDia = clamp(kit.diameter || kb.diameter || 74, H * 0.45, H * 1.05);
      lensLen = clamp(kit.length || kb.length || (H * 0.7), H * 0.35, H * 1.85);
    } else {
      const refDia = category === 'cinema' ? H * 1.02 : category === 'sports' ? H * 0.84 : H * 0.64;
      const refLen = category === 'cinema' ? H * 1.3 : category === 'sports' ? H * 0.9 : H * 0.56;
      lensDia = clamp(refDia * (num(mount.ratio, 100) / 100), H * 0.42, H * 1.02);
      lensLen = clamp(refLen, 34, 160);
    }
    const kitBody = kit && kit.design && kit.design.body ? kit.design.body : null;
    const lensStyle = (kit && kit.style) || (kitBody && kitBody.style) || (category === 'cinema' ? 'cine_black' : 'black_pro');
    const lensStyleDef = (window.FRAME_DATA && window.FRAME_DATA.LENS_STYLES && window.FRAME_DATA.LENS_STYLES[lensStyle]) || null;
    const lensRing = (kit && kit.ring) || (lensStyleDef && lensStyleDef.ring) || accent;
    const lensOn = true;
    const lensZoom = !!(kit && (kit.isZoom || (Number(kit.focalMax) > Number(kit.focalMin) * 1.015)));

    /* ---- 7. screen ----------------------------------------- */
    const scr = designSafe.screen || {};
    const scrType = scr.type || 'fixed';
    const hasScreen = scrType !== 'none';
    const screenW = clamp(W * (category === 'cinema' ? 0.62 : 0.56), 42, 120);
    const screenH = clamp(screenW * 0.64, 28, 82);

    /* ---- 8. controls --------------------------------------- */
    const controls = buildControls(designSafe, {
      W, H, Dp, topH, humpH, gripEnabled: !!gripEnabled, gripW, gripH,
      brand, category, screenW, screenH, hasScreen, humpPos, humpW, vfType,
      buttonColor, dialColor
    });

    /* ---- 9. brand adherence -------------------------------- */
    const brandMatch = brandAdherence({ brand, design: designSafe, cat, fit, humpH, H, gripH, gripW, W, topStyle, dials: controls.dials.length, cornerSignal });
    const checks = structureChecks({ W, H, Dp, cat, gripH, gripW, gripD: gripProtrude, humpH, lensDia, screenW, screenH, controls, humpW });

    /* ---- 10. decals / details ------------------------------ */
    const decals = buildDecals({ brand, design: designSafe, company, W, H, Dp, topH, gripEnabled, gripH, gripW, mountDia, category, accent, mainColor });
    const details = designSafe.details || {};

    return {
      kind: 'camera',
      brand, category, catGuide: cat,
      design: designSafe, company,
      W: Math.round(W), H: Math.round(H), D: Math.round(Dp), Dtotal: Math.round(Dtotal),
      body: {
        cornerR, bevelR, softFactor, cornerSignal, topStyle, topH,
        mainColor, topColor, gripColor, buttonColor, dialColor, accent,
        surface, materialDef, finishDef, finishGloss,
        silhouette: silId, front: frontId, frontStyle: front
      },
      hump: { on: humpH > 1, style: humpStyle, w: humpW, h: humpH, d: humpD, x: humpPos, eyecup: vfType === 'pro' ? 'round' : 'small' },
      grip: { on: !!gripEnabled, h: gripH, w: gripW, d: gripProtrude, curve: num(body.gripCurve, 55), color: gripColor, texture: front.texture },
      screen: { on: hasScreen, type: scrType, w: screenW, h: screenH, bezel: clamp(num(scr.bezel, 6), 2, 14) },
      mount: { id: mountId, dia: mountDia, x: mount.align === 'left' ? -W * 0.12 : mount.align === 'right' ? W * 0.12 : 0, y: -H * 0.075, ringColor: hex((window.FRAME_DATA && window.FRAME_DATA.RING_COLORS && (window.FRAME_DATA.RING_COLORS.find(r => r.id === mount.ringColor) || {}).hex) || brand.mountRing) },
      lens: { on: lensOn, integrated: integratedLens, diameter: lensDia, length: lensLen, style: lensStyle, accent: lensRing, name: kit ? kit.name : '', zoom: lensZoom, hood: category === 'cinema' || lensLen > H * 1.2 },
      controls, decals, details,
      accessories: resolveAccessories(designSafe, category),
      refs: refs.map(m => ({ id: m.id, brand: m.brand, name: m.name, cat: m.cat, year: m.year, w: m.w, h: m.h, d: m.d, mount: m.mount })),
      fit,
      meta: {
        corrections, checks, brandMatch,
        totalH: H + (vfsOn(humpStyle) ? humpH : 0) + (topStyle === 'cine' ? 26 : 0),
        source: 'solver'
      },
      ts: Date.now()
    };
  }
  function vfsOn(style) { return style && style !== 'none'; }

  function surfaceFor(matId, finishId, brand) {
    const base = {
      metalness: 0.55, roughness: 0.5, grain: 0.35, pattern: 1,
      clearcoat: 0.0, anisotropy: 0.0, tint: 1
    };
    const mat = {
      plastic: { metalness: 0.02, roughness: 0.62, grain: 0.3 },
      aluminum: { metalness: 0.75, roughness: 0.42, grain: 0.2 },
      magnesium: { metalness: 0.7, roughness: 0.48, grain: 0.26 },
      titanium: { metalness: 0.9, roughness: 0.34, grain: 0.18 },
      carbon: { metalness: 0.3, roughness: 0.35, grain: 0.5, pattern: 4 },
      brass: { metalness: 0.95, roughness: 0.32, grain: 0.15 },
      leather: { metalness: 0.0, roughness: 0.72, grain: 0.55, pattern: 2 },
      rubber: { metalness: 0.0, roughness: 0.8, grain: 0.5, pattern: 6 },
      skin: { metalness: 0.0, roughness: 0.7, grain: 0.5, pattern: 2 }
    }[matId] || {};
    const fin = {
      matte: { roughness: 0.56, clearcoat: 0, grain: 0.3 },
      anodized: { roughness: 0.42, clearcoat: 0.1, grain: 0.2 },
      brushed: { roughness: 0.34, anisotropy: 0.8, grain: 0.35 },
      enamel: { roughness: 0.22, clearcoat: 0.8, grain: 0.08 },
      plated: { roughness: 0.14, clearcoat: 1.0, grain: 0.04 },
      powder: { roughness: 0.7, clearcoat: 0, grain: 0.6 },
      rubberized: { roughness: 0.82, clearcoat: 0, grain: 0.8, pattern: 6 },
      leathergrain: { roughness: 0.68, clearcoat: 0.05, grain: 0.55, pattern: 2 }
    }[finishId] || {};
    const out = Object.assign(base, mat, fin);
    if (brand && brand.texture === 'machined') out.grain = Math.max(0.15, out.grain * 0.5);
    if (brand && brand.texture === 'leather') out.pattern = 2;
    out.roughness = clamp(out.roughness, 0.06, 0.92);
    out.metalness = clamp(out.metalness, 0, 1);
    return out;
  }

  /* ---------------- control layout ---------------- */
  function buildControls(design, ctx) {
    const { W, H, Dp, topH, humpH, brand, category, screenW, screenH, hasScreen, humpPos, humpW, vfType } = ctx;
    const dialsCfg = (design.controls && design.controls.dials) || {};
    const requested = ['mode', 'front', 'rear', 'extra'].filter(k => dialsCfg[k]);
    const dialCount = Math.max(category === 'action' ? 0 : 1, requested.length || (brand.dials || 2));
    const topY = H / 2;
    const topZ = -Dp * 0.5 + topH * 0.4;
    const dialStyle = brand.dialStyle || 'knurled';
    const dialColor = ctx.dialColor || '#26292a';
    const positions = [
      { key: 'mode', x: -W * 0.32, z: -Dp * 0.16, r: H * 0.095 },
      { key: 'rear', x: W * 0.33, z: -Dp * 0.2, r: H * 0.08 },
      { key: 'extra', x: W * 0.22, z: Dp * 0.2, r: H * 0.072 },
      { key: 'front', x: -W * 0.18, z: Dp * 0.26, r: H * 0.064 }
    ];
    // keep dials clear of the EVF hump
    const dials = [];
    for (let i = 0; i < Math.min(4, dialCount); i++) {
      const p = positions[i];
      let x = p.x;
      if (humpH > 2 && Math.abs((x - humpPos)) < humpW * 0.5 + p.r * 1.15) {
        x = humpPos + Math.sign(x - humpPos || 1) * (humpW * 0.5 + p.r * 1.2);
        x = clamp(x, -W * 0.44, W * 0.44);
      }
      dials.push({ kind: p.key, x, y: topY, z: p.z, r: Math.min(p.r, H * 0.12), h: clamp(H * 0.045, 4, 9), color: dialColor, style: dialStyle, ticks: p.key === 'mode' ? 24 : 18 });
    }

    const buttonsCfg = (design.controls && design.controls.buttons) || {};
    const enabled = Object.keys(buttonsCfg).filter(k => buttonsCfg[k] && buttonsCfg[k].enabled);
    const topEnabled = enabled.filter(k => String(buttonsCfg[k].pos || '').startsWith('top_'));
    const topButtons = [];
    const zoneX = { top_left: W * 0.3, top_mid: 0, top_right: -W * 0.3 };
    let zoneUsed = { top_left: 0, top_mid: 0, top_right: 0 };
    topEnabled.forEach((id, i) => {
      const zone = String(buttonsCfg[id].pos || 'top_right');
      const n = zoneUsed[zone] || 0;
      zoneUsed[zone] = n + 1;
      if (id === 'shutter') {
        topButtons.push({ kind: 'shutter', x: -W * 0.3, y: topY, z: Dp * 0.2, r: clamp(H * 0.055, 4, 8), h: 3.2, color: '#2a2d2e' });
        return;
      }
      topButtons.push({
        kind: id, x: zoneX[zone] + n * W * 0.075, y: topY, z: -Dp * 0.28,
        r: id === 'record' ? clamp(W * 0.018, 2.6, 4.6) : clamp(W * 0.014, 2.2, 3.8),
        h: 2.4, color: id === 'record' ? '#a8402f' : (ctx.buttonColor || '#3a3e3f')
      });
    });
    if (!topButtons.some(b => b.kind === 'shutter')) {
      topButtons.push({ kind: 'shutter', x: -W * 0.3, y: topY, z: Dp * 0.2, r: clamp(H * 0.055, 4, 8), h: 3.2, color: '#2a2d2e' });
    }
    // back controls (used for the rear render and for completeness of the record)
    const backButtons = enabled.filter(k => String(buttonsCfg[k].pos || '').startsWith('back_') || ['grip', 'side'].includes(buttonsCfg[k].pos)).map(id => {
      const pos = buttonsCfg[id].pos;
      const x = pos === 'grip' ? -W * 0.38 : pos === 'side' ? W * 0.5 : (pos.includes('left') ? W * 0.22 : W * 0.36);
      const y = pos.includes('lower') ? -H * 0.28 : pos.includes('upper') ? H * 0.28 : 0;
      return { kind: id, x, y, z: -Dp * 0.5, r: clamp(H * 0.028, 3, 6), h: 2, color: ctx.buttonColor || '#3a3e3f', face: 'back' };
    });
    return {
      dials, topButtons, backButtons,
      joystick: !!(design.controls && design.controls.joystick),
      hotshoe: !(ctx.category === 'cinema' || false)
    };
  }

  /* ---------------- accessories ---------------- */
  function resolveAccessories(design, category) {
    const a = design.accessories || {};
    return {
      batteryGrip: !!a.batteryGrip,
      verticalGrip: !!a.verticalGrip,
      cage: !!(a.cage || (design.details && design.details.cage)),
      handle: !!(a.shoulder || (design.details && design.details.handle) || (design.body && design.body.top === 'cine_shoulder')),
      shoulder: !!a.shoulder,
      mic: !!a.mic,
      monitor: !!a.monitor,
      fan: !!(a.fan || (design.details && design.details.vents && category === 'cinema')),
      wireless: !!a.wireless,
      flash: !!a.flash
    };
  }

  /* ---------------- decals ---------------- */
  function buildDecals(ctx) {
    const { brand, design, company, W, H, Dp, topH, gripEnabled, gripH, gripW, mountDia, category, accent, mainColor } = ctx;
    const out = [];
    const lightBody = luminance(mainColor || brand.bodyColor || '#222426') > 0.42;
    const ink = lightBody ? '#262823' : '#ded9cb';
    const ink2 = lightBody ? '#4b4d45' : '#c3bfb2';
    const wordmark = (brand.wordmark || (company && company.en) || 'FRAME').toString();
    const mark = (brand.mark || '').toString();
    const model = (design.name || '').toString();
    const zFront = Dp / 2;
    // brand mark / wordmark on the front, upper corner
    if (brand.logoStyle !== 'mark') {
      out.push({ kind: 'text', text: wordmark.toUpperCase().slice(0, 14), x: -W * 0.26, y: H * 0.3, z: zFront + 0.05, w: clamp(W * 0.24, 22, 40), h: clamp(W * 0.062, 5, 9), color: ink, font: 'display', align: 'left', opacity: 0.92 });
    } else {
      out.push({ kind: 'text', text: mark, x: -W * 0.28, y: H * 0.29, z: zFront + 0.05, w: clamp(W * 0.1, 10, 18), h: clamp(W * 0.085, 7, 12), color: ink, font: 'display', align: 'left', opacity: 0.95 });
      out.push({ kind: 'text', text: wordmark.toUpperCase().slice(0, 10), x: -W * 0.17, y: H * 0.29, z: zFront + 0.05, w: clamp(W * 0.13, 14, 24), h: clamp(W * 0.036, 3, 5.5), color: ink2, font: 'display', align: 'left', opacity: 0.75 });
    }
    // model name on the lower front
    if (model && design.colors && design.colors.engraving !== false) {
      out.push({ kind: 'text', text: model.slice(0, 24), x: W * 0.16, y: -H * 0.33, z: zFront + 0.05, w: clamp(W * 0.24, 22, 42), h: clamp(W * 0.034, 3, 5.2), color: ink2, font: 'mono', align: 'left', opacity: 0.6 });
    }
    // top plate engraving
    out.push({ kind: 'text', text: wordmark.slice(0, 18), x: W * 0.06, y: H / 2 + 0.12, z: -Dp * 0.1, w: clamp(W * 0.18, 16, 30), h: clamp(W * 0.032, 3, 5), color: ink2, font: 'display', align: 'left', opacity: 0.55, face: 'top' });
    // leica red dot
    if (brand.accentUse === 'red_dot') {
      out.push({ kind: 'dot', x: -W * 0.36, y: H * 0.02, z: zFront + 0.08, r: clamp(W * 0.032, 3, 6), color: '#9b2c26' });
    }
    // brand accent line near the mount (Canon style)
    if (brand.accentUse === 'mount_arc') {
      out.push({ kind: 'mountArc', x: 0, y: -H * 0.045, z: zFront + 0.06, r: mountDia * 0.62, color: accent, width: 1.2 });
    }
    if (brand.accentUse === 'grip_line' && gripEnabled) {
      out.push({ kind: 'box', x: -W * 0.5 + gripW * 0.16, y: -H * 0.1, z: zFront + 0.1, w: 1.1, h: Math.min(gripH * 0.72, H * 0.62), d: 1.1, color: accent, opacity: 0.9 });
    }
    if (brand.accentUse === 'accent_line') {
      out.push({ kind: 'box', x: -W * 0.44, y: -H * 0.2, z: zFront + 0.08, w: 0.9, h: H * 0.26, d: 0.9, color: accent, opacity: 0.85 });
    }
    // cinema white "REC" style label on the side / logo bar
    if (brand.accentUse === 'logo_bar') {
      out.push({ kind: 'box', x: -W * 0.5 - 0.05, y: H * 0.16, z: -Dp * 0.1, w: 0.8, h: H * 0.3, d: Dp * 0.5, color: accent, opacity: 0.9 });
    }
    // lens engravings handled by renderer
    return out;
  }

  /* ---------------- structure checks ---------------- */
  function structureChecks(s) {
    const out = [];
    const ratio = s.H / s.W;
    out.push({
      key: 'ratio', label: '机身宽高比', ok: ratio > 0.45 && ratio < 1.05,
      detail: `H/W ${ratio.toFixed(2)} · 现实区间 0.48–0.98`
    });
    out.push({
      key: 'depth', label: '厚度与体积', ok: s.Dp / s.H > 0.3 && s.Dp / s.H < 0.95,
      detail: `D/H ${(s.Dp / s.H).toFixed(2)} · 参考区间 0.35–0.85`
    });
    out.push({
      key: 'grip', label: '握柄融合', ok: !s.gripH || (s.gripH <= s.H * 0.98 && s.gripW <= s.W * 0.42),
      detail: s.gripH ? `握柄 ${Math.round(s.gripH)}×${Math.round(s.gripW)}mm` : '无突出握柄'
    });
    out.push({
      key: 'lens', label: '卡口与镜头比例', ok: s.lensDia <= s.H * 1.04 && s.lensDia >= s.H * 0.36,
      detail: `镜头直径 ${Math.round(s.lensDia)}mm / 机身高度 ${s.H}mm`
    });
    out.push({
      key: 'hump', label: '取景器高度', ok: s.humpH <= s.H * 0.3,
      detail: s.humpH ? `隆起 ${Math.round(s.humpH)}mm` : '无取景器隆起'
    });
    out.push({
      key: 'screen', label: '屏幕适配', ok: s.screenW <= s.W * 0.78 && s.screenH <= s.H * 0.66,
      detail: `屏幕 ${Math.round(s.screenW)}×${Math.round(s.screenH)}mm`
    });
    const dialOverlap = (s.controls.dials || []).some((d, i, arr) => arr.some((o, j) => i !== j && Math.hypot(d.x - o.x, d.z - o.z) < (d.r + o.r) * 0.92));
    out.push({ key: 'layout', label: '顶部拨盘排布', ok: !dialOverlap, detail: `${(s.controls.dials || []).length} 个拨盘${dialOverlap ? ' · 存在重叠' : ' · 间距正常'}` });
    return out;
  }

  function brandAdherence(s) {
    const b = s.brand;
    let score = 100;
    const notes = [];
    const cornerDiff = Math.abs(s.cornerSignal - clamp((b.corner || 0.12) * 0.45 + 0.06, 0.03, 0.2));
    if (cornerDiff > 0.05) { score -= Math.min(18, cornerDiff * 160); notes.push('机身圆角与品牌语言有偏差'); }
    const expectedHump = b.hump === 'none' ? 0 : b.hump === 'low' ? 0.08 : b.hump === 'prism' ? 0.24 : 0.17;
    const actualHump = s.H ? s.humpH / s.H : 0;
    if (Math.abs(actualHump - expectedHump) > 0.09) { score -= 12; notes.push('取景器隆起与品牌比例不同'); }
    if (b.dials && Math.abs((s.dials || 0) - Math.min(4, b.dials)) >= 2) { score -= 10; notes.push('顶部拨盘数量偏离品牌习惯'); }
    if (b.grip && s.H) {
      const gripRatio = s.gripH / s.H;
      const expected = clamp(0.62 * b.grip, 0.1, 0.92);
      if (Math.abs(gripRatio - expected) > 0.28) { score -= 8; notes.push('握柄体积与品牌机型差距较大'); }
    }
    return { score: Math.round(clamp(score, 12, 100)), notes };
  }

  /* =========================================================
     Design normalisation (one-click "repair proportions")
     ========================================================= */
  function normalizeDesign(design, company, options) {
    const spec = resolveSpec(design, company, options);
    const next = JSON.parse(JSON.stringify(design));
    next.body = next.body || {};
    next.body.width = spec.W;
    next.body.height = spec.H;
    next.body.depth = spec.D;
    next.body.gripH = Math.round(spec.grip.on ? spec.grip.h : 0);
    next.body.gripD = Math.round(spec.grip.on ? spec.grip.w : 0);
    next.body.gripCurve = Math.round(spec.grip.on ? clamp((spec.grip.curve || 55), 0, 100) : 0);
    next.body.roundness = Math.round(clamp(next.body.roundness == null ? 40 : next.body.roundness, 0, 100));
    return { design: next, spec, changed: spec.meta.corrections.length > 0 };
  }

  /* =========================================================
     Brand baseline for inherited drafts
     ========================================================= */
  function applyBrandBaseline(design, company, category) {
    if (!design || !design.body) return design;
    const brand = brandFor(company);
    const cat = D.CATEGORY_GUIDE[category] || D.CATEGORY_GUIDE.mirrorless;
    const refs = referenceModels({ company, category, limit: 5 });
    const primary = refs[0];
    const fit = referenceFit(refs, cat);
    const structural = ['cinema', 'action', 'compact', 'gimbal'].includes(category);

    if (!structural) {
      const topMap = { flat: 'flat', arc: 'arc', prism: 'prism', flush: 'flush', cine: 'cine_shoulder' };
      design.body.top = topMap[brand.top] || design.body.top;
      design.body.silhouette = brand.id === 'fujifilm' || brand.id === 'leica' ? 'retroblock'
        : brand.id === 'sony' ? 'rect'
          : brand.id === 'sigma' ? 'rect'
            : brand.id === 'om' ? 'rounded' : 'ergo';
      design.body.front = brand.id === 'fujifilm' || brand.id === 'leica' ? 'retro_face'
        : brand.id === 'sigma' ? 'straight' : 'big_grip';
    }
    design.body.roundness = Math.round(clamp((brand.corner || 0.12) * 210, 8, 82));

    // Proportions follow the reference median, not arbitrary category defaults.
    if (primary) {
      const w = Math.round(lerp(cat.w[0] + (cat.w[1] - cat.w[0]) * 0.5, primary.w, 0.82));
      design.body.width = w;
      design.body.height = Math.round(w * lerp(fit.ratio, primary.h / primary.w, 0.5));
      design.body.depth = Math.round(design.body.height * lerp(fit.depth, primary.d / primary.h, 0.5));
      design.body.gripH = Math.round(design.body.height * (primary.g ? primary.g[0] : fit.grip[0]));
      design.body.gripD = Math.round(design.body.width * (primary.g ? primary.g[1] : fit.grip[1]));
      design.body.gripCurve = Math.round(lerp(45, 80, primary.g ? clamp(primary.g[2], 0, 1) : 0.6) + 12);
      if (primary.scr && !['cinema', 'action'].includes(category)) design.screen.type = primary.scr;
      if (primary.evf && !['cinema', 'action'].includes(category)) {
        design.viewfinder.type = primary.evf === 'none' ? 'none' : primary.evf === 'pro' ? 'pro' : primary.evf === 'eyelevel' ? 'eyelevel' : primary.evf === 'folding' ? 'folding' : 'small';
      }
    }
    // controls counts from brand DNA (players can still change them afterwards)
    const dials = design.controls.dials;
    ['front', 'rear', 'mode', 'extra'].forEach((k, i) => { dials[k] = i < (brand.dials || 2); });
    // mount ring language
    if (design.mount) {
      if (brand.id === 'nikon') design.mount.ringColor = 'silver';
      else if (brand.id === 'canon') design.mount.ringColor = 'silver';
      else if (brand.id === 'sony') design.mount.ringColor = 'silver';
      else if (brand.id === 'leica' || brand.id === 'fujifilm') design.mount.ringColor = 'silver';
      else design.mount.ringColor = 'black';
    }
    // details that belong to the brand signature
    if (design.details) {
      if (brand.accentUse === 'grip_line') design.details.redline = false;
      if (brand.id === 'canon' || brand.id === 'nikon') design.details.redline = false;
      if (brand.id === 'fujifilm') { design.details.knurl = true; design.details.nameplate = true; }
      if (brand.id === 'leica') { design.details.nameplate = true; design.details.redline = false; }
    }
    return design;
  }

  /* =========================================================
     Local cache (IndexedDB with in-memory fallback)
     ========================================================= */
  const CacheDB = (function () {
    const DB_NAME = 'frame.art.cache.v1';
    const STORES = { refs: 'refs', shots: 'shots', meta: 'meta' };
    let dbPromise = null;
    let mem = { refs: new Map(), shots: new Map(), meta: new Map() };
    let healthy = true;
    function withTimeout(promise, ms, fallback) {
      return new Promise(resolve => {
        let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; resolve(fallback); } }, ms);
        promise.then(value => {
          if (done) return;
          done = true; clearTimeout(timer); resolve(value);
        }, () => {
          if (done) return;
          done = true; clearTimeout(timer); resolve(fallback);
        });
      });
    }
    function open() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise(resolve => {
        if (!window.indexedDB) { healthy = false; resolve(null); return; }
        let settled = false;
        const finish = value => { if (settled) return; settled = true; clearTimeout(timer); resolve(value); };
        const timer = setTimeout(() => { healthy = false; finish(null); }, 700);
        let req;
        try { req = indexedDB.open(DB_NAME, 1); } catch (e) { healthy = false; finish(null); return; }
        req.onupgradeneeded = () => {
          const db = req.result;
          Object.values(STORES).forEach(name => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'key' }); });
        };
        req.onsuccess = () => finish(req.result);
        req.onerror = () => { healthy = false; finish(null); };
        req.onblocked = () => { healthy = false; finish(null); };
      });
      return dbPromise;
    }
    async function getRaw(store, key) {
      if (mem[store].has(key)) return mem[store].get(key);
      const db = await withTimeout(open(), 750, null);
      if (!db) return mem[store].get(key) || null;
      return withTimeout(new Promise(resolve => {
        try {
          const rq = db.transaction(store, 'readonly').objectStore(store).get(key);
          rq.onsuccess = () => resolve(rq.result || null);
          rq.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      }), 1200, null);
    }
    async function putRaw(store, value) {
      mem[store].set(value.key, value);
      const db = await withTimeout(open(), 750, null);
      if (!db) return { ok: true, mode: 'memory' };
      return withTimeout(new Promise(resolve => {
        try {
          const tx = db.transaction(store, 'readwrite');
          tx.objectStore(store).put(value);
          tx.oncomplete = () => resolve({ ok: true, mode: 'idb' });
          tx.onerror = () => resolve({ ok: true, mode: 'memory' });
        } catch (e) { resolve({ ok: true, mode: 'memory' }); }
      }), 1800, { ok: true, mode: 'memory' });
    }
    async function delRaw(store, key) {
      mem[store].delete(key);
      const db = await withTimeout(open(), 750, null);
      if (!db) return true;
      return withTimeout(new Promise(resolve => {
        try {
          const tx = db.transaction(store, 'readwrite');
          tx.objectStore(store).delete(key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) { resolve(false); }
      }), 1200, false);
    }
    async function clearAll() {
      mem = { refs: new Map(), shots: new Map(), meta: new Map() };
      const db = await withTimeout(open(), 750, null);
      if (!db) return true;
      return withTimeout(Promise.all(Object.values(STORES).map(name => new Promise(resolve => {
        try {
          const tx = db.transaction(name, 'readwrite');
          tx.objectStore(name).clear();
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) { resolve(false); }
      }))), 1800, true);
    }
    async function stats() {
      const db = await withTimeout(open(), 750, null);
      if (!db) return { mode: 'memory', count: mem.refs.size + mem.shots.size, bytes: mem.refs.size * 90000 + mem.shots.size * 120000 };
      const names = Object.values(STORES);
      const counts = await withTimeout(Promise.all(names.map(name => new Promise(resolve => {
        try {
          const rq = db.transaction(name, 'readonly').objectStore(name).count();
          rq.onsuccess = () => resolve(rq.result || 0);
          rq.onerror = () => resolve(0);
        } catch (e) { resolve(0); }
      }))), 1200, names.map(() => 0));
      const count = counts.reduce((a, b) => a + b, 0);
      return { mode: 'idb', count, bytes: Math.round(count * 110000) };
    }
    return { get: getRaw, put: putRaw, del: delRaw, clear: clearAll, stats, healthy: () => healthy };
  })();
  /* =========================================================
     Online reference retrieval (Wikimedia Commons)
     ========================================================= */
  const Online = (function () {
    const state = {
      enabled: true,
      online: navigator.onLine !== false,
      busy: false,
      lastError: '',
      fetched: 0,
      failed: 0,
      queue: [],
      cancelled: false
    };
    const CONFIG = D.ONLINE;
    const imgCache = new Map(); // key -> objectURL
    let running = 0;

    function setEnabled(v) { state.enabled = !!v; }
    function isOnline() { return state.enabled && navigator.onLine !== false; }

    function stripHtml(s) {
      return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function normalize(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9α]+/g, ''); }

    function scoreCandidate(page, model) {
      const title = normalize(page.title || '');
      const target = normalize(model.name);
      let score = 0;
      if (title.includes(target)) score += 60;
      if (title.includes(normalize((D.brandById(model.brand) || {}).en || ''))) score += 12;
      if (/logo|icon|diagram|schema|teardown|box|package|advert|manual|patent/.test(title)) score -= 45;
      const info = (page.imageinfo && page.imageinfo[0]) || {};
      const w = info.width || 0, h = info.height || 0;
      if (w >= 500 && h >= 300) score += 10;
      if (h > w * 1.4) score -= 12; // portrait product photos are less useful as a silhouette reference
      if (/\.(svg|gif)$/i.test(info.url || '')) score -= 20;
      score += Math.min(12, (info.size || 0) / 400000);
      return score;
    }

    async function apiSearch(query, limit) {
      const params = new URLSearchParams({
        action: 'query', format: 'json', origin: '*',
        generator: 'search', gsrsearch: query + ' filetype:bitmap',
        gsrnamespace: '6', gsrlimit: String(limit || 8),
        prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime',
        iiurlwidth: String(CONFIG.thumbWidth)
      });
      const url = CONFIG.api + '?' + params.toString();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      try {
        const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        const pages = json && json.query && json.query.pages ? Object.values(json.query.pages) : [];
        return pages.sort((a, b) => (a.index || 0) - (b.index || 0));
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    }

    async function fetchModelPhoto(model, opts) {
      opts = opts || {};
      const key = 'photo:' + model.id;
      if (!opts.force) {
        const cached = await CacheDB.get('refs', key);
        if (cached && cached.blob) return { ok: true, cached: true, record: cached };
      }
      if (!isOnline()) return { ok: false, error: 'offline', code: 'offline' };
      const queries = [
        model.commons || '',
        `${(D.brandById(model.brand) || {}).en || ''} ${model.name}`,
        model.name
      ].filter(Boolean);
      let pages = [];
      for (const q of queries) {
        try {
          pages = await apiSearch(q, 8);
          if (pages.length) break;
        } catch (e) {
          state.lastError = e.message || 'network';
          if (String(e.name) === 'AbortError') return { ok: false, error: '请求超时', code: 'timeout' };
        }
      }
      if (!pages.length) { state.failed++; return { ok: false, error: '没有找到参考图', code: 'empty' }; }
      const ranked = pages.map(p => ({ page: p, score: scoreCandidate(p, model) })).sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best || best.score < 0) return { ok: false, error: '检索结果不相关', code: 'weak' };
      const info = best.page.imageinfo[0];
      const meta = info.extmetadata || {};
      const record = {
        key, kind: 'photo', modelId: model.id, brand: model.brand,
        title: best.page.title,
        thumb: info.thumburl,
        page: info.descriptionurl,
        width: info.thumbwidth || info.width,
        height: info.thumbheight || info.height,
        artist: stripHtml((meta.Artist && meta.Artist.value) || '').slice(0, 90),
        license: stripHtml((meta.LicenseShortName && meta.LicenseShortName.value) || '未知授权'),
        source: 'Wikimedia Commons',
        ts: Date.now(),
        expires: Date.now() + CONFIG.ttlDays * 86400000
      };
      try {
        const res = await fetch(info.thumburl, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        if (!/^image\//.test(blob.type)) throw new Error('不是图片');
        record.blob = blob;
        await CacheDB.put('refs', record);
        state.fetched++;
        return { ok: true, cached: false, record };
      } catch (e) {
        state.lastError = e.message || 'download';
        state.failed++;
        // Metadata is still useful: keep it so the UI can show the source and retry later.
        await CacheDB.put('refs', Object.assign({}, record, { stale: true }));
        return { ok: false, error: '参考图下载失败', code: 'download', record };
      }
    }

    async function fetchLensPhoto(lens) {
      const key = 'photo:' + lens.id;
      const cached = await CacheDB.get('refs', key);
      if (cached && cached.blob) return { ok: true, cached: true, record: cached };
      if (!isOnline()) return { ok: false, error: 'offline', code: 'offline' };
      try {
        const pages = await apiSearch(lens.commons || `${lens.name} lens`, 6);
        if (!pages.length) return { ok: false, error: '没有找到参考图', code: 'empty' };
        const b = pages.map(p => ({ p, s: scoreCandidate(p, { name: lens.name, brand: lens.brand }) })).sort((a, b2) => b2.s - a.s)[0];
        if (!b) return { ok: false, error: '无结果', code: 'empty' };
        const info = b.p.imageinfo[0];
        const meta = info.extmetadata || {};
        const record = {
          key, kind: 'photo', lensId: lens.id, brand: lens.brand, title: b.p.title,
          thumb: info.thumburl, page: info.descriptionurl, width: info.thumbwidth, height: info.thumbheight,
          artist: stripHtml((meta.Artist && meta.Artist.value) || '').slice(0, 90),
          license: stripHtml((meta.LicenseShortName && meta.LicenseShortName.value) || '未知授权'),
          source: 'Wikimedia Commons', ts: Date.now(), expires: Date.now() + CONFIG.ttlDays * 86400000
        };
        const res = await fetch(info.thumburl, { mode: 'cors', credentials: 'omit' });
        const blob = await res.blob();
        record.blob = blob;
        await CacheDB.put('refs', record);
        return { ok: true, record };
      } catch (e) {
        return { ok: false, error: e.message || 'network', code: 'network' };
      }
    }

    function objectURL(record) {
      if (!record || !record.blob) return '';
      if (imgCache.has(record.key)) return imgCache.get(record.key);
      const url = URL.createObjectURL(record.blob);
      imgCache.set(record.key, url);
      return url;
    }

    async function getCachedPhoto(modelId) { return CacheDB.get('refs', 'photo:' + modelId); }

    async function syncList(items, opts) {
      opts = opts || {};
      const list = items.slice();
      state.cancelled = false;
      state.busy = true;
      let done = 0;
      const results = [];
      const onProgress = opts.onProgress || (() => {});
      const worker = async () => {
        while (list.length && !state.cancelled) {
          const item = list.shift();
          const res = item.kind === 'lens' ? await fetchLensPhoto(item) : await fetchModelPhoto(item);
          results.push(Object.assign({ item }, res));
          done++;
          onProgress({ done, total: items.length, item, res });
          if (state.cancelled) break;
          await new Promise(r => setTimeout(r, 260));
        }
      };
      const workers = [];
      for (let i = 0; i < (opts.concurrency || CONFIG.maxConcurrent); i++) workers.push(worker());
      await Promise.all(workers);
      state.busy = false;
      return results;
    }

    function status() {
      return {
        enabled: state.enabled, online: navigator.onLine !== false, busy: state.busy,
        fetched: state.fetched, failed: state.failed, lastError: state.lastError
      };
    }
    return {
      CONFIG, state, setEnabled, isOnline, fetchModelPhoto, fetchLensPhoto, getCachedPhoto,
      fetchLensPhotoBy: fetchLensPhoto, objectURL, syncList, status, apiSearch,
      cancel: () => { state.cancelled = true; }
    };
  })();

  /* =========================================================
     Photo silhouette analysis (on-device, no upload)
     ========================================================= */
  function analyzeImage(img) {
    try {
      const maxW = 240;
      const scale = Math.min(1, maxW / img.naturalWidth || 1);
      const w = Math.max(24, Math.round((img.naturalWidth || img.width) * scale));
      const h = Math.max(24, Math.round((img.naturalHeight || img.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
      const corners = [px(1, 1), px(w - 2, 1), px(1, h - 2), px(w - 2, h - 2)];
      const bg = [0, 1, 2].map(c => corners.reduce((s, p) => s + p[c], 0) / corners.length);
      const mask = new Uint8Array(w * h);
      let minX = w, maxX = 0, minY = h, maxY = 0, count = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = px(x, y);
          const d = Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
          if (d > 58) {
            mask[y * w + x] = 1;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            count++;
          }
        }
      }
      if (!count) return { ok: false };
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const rows = [];
      for (let y = minY; y <= maxY; y++) {
        let left = w, right = 0, n = 0;
        for (let x = minX; x <= maxX; x++) if (mask[y * w + x]) { if (x < left) left = x; if (x > right) right = x; n++; }
        rows.push({ y, left, right, n });
      }
      // top hump: how much narrower is the top 18% of the silhouette
      const topRows = rows.slice(0, Math.max(2, Math.round(rows.length * 0.18)));
      const topWidth = topRows.reduce((s, r) => s + (r.right - r.left), 0) / topRows.length;
      const hump = clamp(1 - topWidth / bw, 0, 1);
      // grip mass: compare left and right quarter occupancy
      let leftMass = 0, rightMass = 0;
      rows.forEach(r => {
        for (let x = minX; x <= minX + bw * 0.3; x++) if (mask[r.y * w + x]) leftMass++;
        for (let x = maxX - bw * 0.3; x <= maxX; x++) if (mask[r.y * w + x]) rightMass++;
      });
      const total = leftMass + rightMass || 1;
      return {
        ok: true,
        aspect: bw / bh,
        fill: count / (bw * bh),
        hump: Math.round(hump * 100) / 100,
        gripSide: leftMass > rightMass ? 'left' : 'right',
        gripShare: Math.round(Math.max(leftMass, rightMass) / total * 100) / 100,
        bbox: [bw, bh]
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /* =========================================================
     Reference silhouette drawing (offline visual reference)
     ========================================================= */
  function drawModelSilhouette(canvas, model, options) {
    options = options || {};
    if (!canvas || !model) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || options.width || 220;
    const cssH = canvas.clientHeight || options.height || 140;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const pad = 14;
    const s = Math.min((cssW - pad * 2) / model.w, (cssH - pad * 2) / (model.h * 1.3));
    const W = model.w * s, H = model.h * s;
    const cx = cssW / 2, cy = cssH / 2 + H * 0.08;
    const x0 = cx - W / 2, y0 = cy - H / 2;
    const ink = options.ink || '#20231e';
    const accent = options.accent || '#b58d4c';
    const bodyColor = options.dark ? '#e8e4d8' : '#d9d4c6';
    const corner = Math.min(W, H) * clamp(0.04 + (model.corner || 0.1) * 0.26, 0.02, 0.14);
    ctx.save();
    ctx.lineJoin = 'round';
    // hump
    const hump = model.hump && model.hump !== 'none';
    const humpH = hump ? H * (model.hump === 'low' ? 0.07 : model.hump === 'prism' ? 0.26 : 0.17) : 0;
    const humpW = W * (model.hump === 'prism' ? 0.3 : 0.34);
    if (hump) {
      roundRect(ctx, cx - humpW / 2, y0 - humpH, humpW, humpH + 4, Math.min(9, humpW * 0.18));
      ctx.fillStyle = bodyColor; ctx.fill();
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
    // grip
    const g = model.g || [0.5, 0.25, 0.6];
    const gW = Math.max(0, W * g[1]), gH = Math.max(0, H * g[0]);
    if (gW > 2 && gH > 2 && !['fujifilm', 'leica', 'sigma'].includes(model.brand)) {
      roundRect(ctx, x0 - gW * 0.18, y0 + H - gH, gW + 5, gH, Math.min(gW * 0.5, gH * 0.22));
      ctx.fillStyle = bodyColor; ctx.fill();
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
    // body
    roundRect(ctx, x0, y0, W, H, corner);
    ctx.fillStyle = bodyColor; ctx.fill();
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.1; ctx.stroke(); ctx.globalAlpha = 1;
    // top plate
    ctx.save();
    roundRect(ctx, x0 + 1, y0 + 1, W - 2, H * 0.18, Math.min(corner, H * 0.1));
    ctx.fillStyle = options.dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.4)'; ctx.fill();
    ctx.restore();
    // lens
    const mountDia = D.MOUNT_LENS_DIAMETER[model.mount] || 74;
    const lensR = Math.min(W * 0.26, H * 0.42) * clamp(mountDia / 74, 0.75, 1.35);
    const lx = cx, ly = y0 + H * 0.54;
    ctx.beginPath(); ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    ctx.fillStyle = options.dark ? '#2b2e2b' : '#33362f'; ctx.fill();
    ctx.globalAlpha = 0.35; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(lx, ly, lensR * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = accent; ctx.lineWidth = 1.4; ctx.stroke();
    // dials
    const dials = Math.min(3, model.dials || 2);
    for (let i = 0; i < dials; i++) {
      const dx = x0 + W * (i === 0 ? 0.18 : 0.68) + (i === 2 ? W * 0.14 : 0);
      const dy = y0 + H * 0.09;
      ctx.beginPath(); ctx.arc(dx, dy, Math.max(2.5, H * 0.06), 0, Math.PI * 2);
      ctx.fillStyle = options.dark ? '#1c1f1c' : '#f2efe5'; ctx.fill();
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.6; ctx.lineWidth = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
    }
    // screen hint
    if (model.scr && model.scr !== 'none') {
      const sw = W * 0.5;
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + W * 0.06, y0 + H * 0.28, sw, H * 0.52);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // dimension labels
    if (options.labels) {
      ctx.fillStyle = ink; ctx.globalAlpha = 0.5;
      ctx.font = '9px Consolas, monospace';
      ctx.fillText(`${model.w} × ${model.h} × ${model.d} mm`, 10, cssH - 8);
      ctx.globalAlpha = 1;
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* =========================================================
     Lens build sheet
     ========================================================= */
  function resolveLensSpec(design, company, options) {
    options = options || {};
    const brand = brandFor(company);
    const body = design.body || {};
    const mountId = (design.mount && design.mount.type) || 'E';
    const style = body.style || 'black_pro';
    const isCine = design.lensType === 'cinema' || style === 'cine_black';
    const mountDia = ({ E: 74, RF: 80, Z: 78, X: 70, L: 78, EF: 82, F: 76, M: 56, M43: 64, GFX: 96, K: 76, PL: 110, DL: 62, B4: 90, FIXED: 52 })[mountId] || 74;
    let diameter = clamp(num(body.diameter, mountDia), 26, 180);
    let length = clamp(num(body.length, isCine ? 160 : 105), 30, 420);
    // Reality guard for optics: a lens is never shorter than its mount and rarely wider than 1.5x its length.
    const minLen = isCine ? 70 : 38;
    if (length < minLen) length = minLen;
    if (diameter > length * 1.7) diameter = length * 1.7;
    if (diameter < 34) diameter = 34;
    const zoom = Number(design.focalMax) > Number(design.focalMin) * 1.015;
    const brandStyle = D.BRANDS[brand.id] || {};
    return {
      kind: 'lens', brand, design, company,
      name: design.name || 'FRAME LENS',
      diameter, length, style, isCine, zoom,
      mount: { id: mountId, dia: mountDia },
      accent: (window.FRAME_DATA && window.FRAME_DATA.LENS_STYLES && (window.FRAME_DATA.LENS_STYLES[style] || {}).ring) || brandStyle.accent || '#b79143',
      mountRing: brand.mountRing || '#b9b6ac',
      weight: clamp(num(body.weight, 600), 60, 6000)
    };
  }

  function normalizeLensDesign(design, company) {
    const spec = resolveLensSpec(design, company);
    const next = JSON.parse(JSON.stringify(design));
    next.body = next.body || {};
    next.body.diameter = Math.round(spec.diameter);
    next.body.length = Math.round(spec.length);
    return { design: next, spec };
  }
  /* =========================================================
     Product shot store
     ========================================================= */
  const ShotStore = (function () {
    const registry = new Map();
    const memory = new Map();
    let limit = 260;

    function signature(design, company, opts) {
      const parts = [
        design && design.name, design && design.category,
        JSON.stringify(design && design.body), JSON.stringify(design && design.materials),
        JSON.stringify(design && design.colors), JSON.stringify(design && design.screen),
        JSON.stringify(design && design.viewfinder), JSON.stringify(design && design.mount),
        JSON.stringify(design && design.controls), JSON.stringify(design && design.details),
        JSON.stringify(design && design.accessories),
        company && company.id, opts && opts.view, opts && opts.kind, opts && opts.lensKey, opts && opts.kitLens && opts.kitLens.id, opts && opts.adherence
      ];
      return hashString(parts.join('|'));
    }
    function keyFor(design, company, opts) {
      opts = opts || {};
      return 'shot:' + (opts.view || 'hero') + ':' + (opts.size || 'card') + ':' + signature(design, company, opts) + (opts.lensKey ? ':' + opts.lensKey : '');
    }
    function register(id, design, company, opts) {
      registry.set(id, { design, company, opts: opts || {} });
      return id;
    }
    function getSync(id) {
      const rec = registry.get(id);
      if (!rec) return null;
      const key = keyFor(rec.design, rec.company, rec.opts);
      if (memory.has(key)) return memory.get(key);
      return null;
    }
    async function getCached(id) {
      const rec = registry.get(id);
      if (!rec) return null;
      const key = keyFor(rec.design, rec.company, rec.opts);
      if (memory.has(key)) return memory.get(key);
      const row = await CacheDB.get('shots', key);
      if (row && row.dataURL) { memory.set(key, row.dataURL); return row.dataURL; }
      return null;
    }
    async function render(id, options) {
      const rec = registry.get(id);
      if (!rec) return null;
      const opts = Object.assign({}, rec.opts, options || {});
      const key = keyFor(rec.design, rec.company, opts);
      if (memory.has(key)) return memory.get(key);
      if (!window.FrameArt3D) return null;
      let dataURL = null;
      try {
        dataURL = opts.kind === 'lens'
          ? window.FrameArt3D.renderLensDataURL(rec.design, rec.company, opts)
          : window.FrameArt3D.renderDataURL(rec.design, rec.company, opts);
      } catch (e) {
        console.warn('[FRAME art] render failed', e);
        return null;
      }
      if (!dataURL) return null;
      memory.set(key, dataURL);
      if (memory.size > limit) {
        const first = memory.keys().next().value;
        memory.delete(first);
      }
      CacheDB.put('shots', { key, dataURL, ts: Date.now(), size: opts.size || 'card' }).catch(() => { /* quota */ });
      return dataURL;
    }
    async function fill(root) {
      if (!root) return;
      const imgs = Array.from(root.querySelectorAll('img[data-art-shot]'));
      for (const img of imgs) {
        const id = img.getAttribute('data-art-shot');
        if (!id || img.dataset.artFilled === '1') continue;
        const sync = getSync(id);
        if (sync) { img.src = sync; img.dataset.artFilled = '1'; continue; }
        const shot = await render(id).catch(() => null);
        if (shot) { img.src = shot; img.dataset.artFilled = '1'; }
        else if (!img.src) img.classList.add('is-missing');
      }
    }
    async function fillOne(img, id) {
      if (!img || img.dataset.artFilled === '1') return;
      const cached = await getCached(id).catch(() => null);
      if (cached) { img.src = cached; img.dataset.artFilled = '1'; return; }
      const shot = await render(id).catch(() => null);
      if (shot) { img.src = shot; img.dataset.artFilled = '1'; }
    }
    return { register, getSync, getCached, render, fill, fillOne, keyFor, signature, memory, registry };
  })();

  /* =========================================================
     Public API
     ========================================================= */
  window.FrameArt = {
    version: '1.0.0',
    data: D,
    brandFor,
    referenceModels,
    referenceFit,
    resolveSpec,
    resolveLensSpec,
    normalizeLensDesign,
    normalizeDesign,
    applyBrandBaseline,
    structureChecks,
    brandAdherence,
    analyzeImage,
    drawModelSilhouette,
    cache: CacheDB,
    online: Online,
    shots: ShotStore,
    hashString,
    utils: { clamp, lerp, median, shade, luminance, hex, round, r1 },
    ready: true
  };
})();
