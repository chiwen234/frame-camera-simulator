/* =========================================================
   FRAME — procedural product photography engine
   ---------------------------------------------------------
   Builds a physically coherent camera out of a resolved
   "build sheet" (see FrameArt.resolveSpec) and renders it as
   a studio product photograph on pure white:
     • parametric rounded-solid geometry (no impossible shapes)
     • PBR-ish shading, soft-box reflections, procedural
       material micro-structure
     • soft contact shadow from a real shadow map
     • WebGL2 renderer with a Canvas2D fallback
     • 4K export and live preview painting
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     small vector / matrix helpers
     --------------------------------------------------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => d * Math.PI / 180;
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlen = a => Math.sqrt(vdot(a, a));
  const vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function mat4Identity() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function mat4Mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function mat4Perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
  }
  function mat4Ortho(l, r, b, t, n, f) {
    return [2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0,
      -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1];
  }
  function mat4LookAt(eye, center, up) {
    const z = vnorm(vsub(eye, center));
    const x = vnorm(vcross(up, z));
    const y = vcross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -vdot(x, eye), -vdot(y, eye), -vdot(z, eye), 1];
  }
  function projectPoint(mvp, p, w, h) {
    const x = p[0], y = p[1], z = p[2];
    const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
    const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
    const cz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
    const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
    if (cw <= 0.0001) return null;
    return { x: (cx / cw * 0.5 + 0.5) * w, y: (1 - (cy / cw * 0.5 + 0.5)) * h, z: cz / cw, w: cw };
  }

  /* ---------------------------------------------------------
     mesh builders
     --------------------------------------------------------- */
  function Mesh() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; }
  Mesh.prototype.vertexCount = function () { return this.pos.length / 3; };
  Mesh.prototype.pushVertex = function (p, n, uv) {
    this.pos.push(p[0], p[1], p[2]);
    this.nor.push(n[0], n[1], n[2]);
    this.uv.push(uv ? uv[0] : 0, uv ? uv[1] : 0);
    return this.pos.length / 3 - 1;
  };
  Mesh.prototype.tri = function (a, b, c) { this.idx.push(a, b, c); };
  Mesh.prototype.quad = function (i0, i1, i2, i3) { this.idx.push(i0, i1, i2, i0, i2, i3); };

  function roundedRectOutline(w, h, r, seg) {
    const pts = [];
    const hw = Math.max(0.1, w / 2), hh = Math.max(0.1, h / 2);
    r = clamp(r, 0.2, Math.min(hw, hh) * 0.98);
    seg = Math.max(2, seg || 8);
    const corners = [[hw - r, hh - r, 0], [-hw + r, hh - r, Math.PI / 2], [-hw + r, -hh + r, Math.PI], [hw - r, -hh + r, Math.PI * 1.5]];
    corners.forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= seg; i++) {
        const a = a0 + (i / seg) * Math.PI / 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    });
    return pts;
  }
  function roundedRectOutline4(w, h, rtl, rtr, rbr, rbl, seg) {
    const pts = [];
    const hw = Math.max(0.1, w / 2), hh = Math.max(0.1, h / 2);
    const clampR = (r) => clamp(r, 0.2, Math.min(hw, hh) * 0.98);
    const corners = [
      [hw - clampR(rtr), hh - clampR(rtr), 0, clampR(rtr)],
      [-hw + clampR(rtl), hh - clampR(rtl), Math.PI / 2, clampR(rtl)],
      [-hw + clampR(rbl), -hh + clampR(rbl), Math.PI, clampR(rbl)],
      [hw - clampR(rbr), -hh + clampR(rbr), Math.PI * 1.5, clampR(rbr)]
    ];
    seg = Math.max(2, seg || 8);
    corners.forEach(([cx, cy, a0, r]) => {
      for (let i = 0; i <= seg; i++) {
        const a = a0 + (i / seg) * Math.PI / 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    });
    return pts;
  }
  function circleOutline(r, seg, teeth, depth) {
    const pts = [];
    seg = Math.max(8, seg || 32);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      let rr = r;
      if (teeth) rr = r * (1 - depth * (0.5 + 0.5 * Math.sin(a * teeth)));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }
  function scaleOutline(pts, sx, sy) { return pts.map(p => [p[0] * sx, p[1] * sy]); }

  /** Loft a series of 2D outlines positioned along an axis into a solid. */
  function loft(rings, opts) {
    opts = opts || {};
    const axis = opts.axis || 'z';
    const mesh = new Mesh();
    const n = rings[0].pts.length;
    const pointAt = (ring, p) => {
      const c = ring.center || [0, 0];
      if (axis === 'z') return [p[0] + c[0], p[1] + c[1], ring.at];
      if (axis === 'y') return [p[0] + c[0], ring.at, p[1] + c[1]];
      return [ring.at, p[0] + c[0], p[1] + c[1]];
    };
    const centerAt = ring => {
      const c = ring.center || [0, 0];
      if (axis === 'z') return [c[0], c[1], ring.at];
      if (axis === 'y') return [c[0], ring.at, c[1]];
      return [ring.at, c[0], c[1]];
    };
    const P = rings.map(r => r.pts.map(p => pointAt(r, p)));
    const C = rings.map(centerAt);
    // side surface
    const N = [];
    const ids = [];
    for (let i = 0; i < rings.length; i++) {
      ids.push([]);
      N.push([]);
      for (let j = 0; j < n; j++) {
        const prev = P[Math.max(0, i - 1)][j];
        const next = P[Math.min(rings.length - 1, i + 1)][j];
        const jp = P[i][(j + 1) % n], jm = P[i][(j - 1 + n) % n];
        const tu = vsub(jp, jm);
        const tv = vsub(next, prev);
        let normal = vcross(tu, tv);
        if (vlen(normal) < 1e-5) normal = vsub(P[i][j], C[i]);
        normal = vnorm(normal);
        if (vdot(normal, vsub(P[i][j], C[i])) < 0) normal = vmul(normal, -1);
        if (vlen(vsub(P[i][j], C[i])) < 1e-4) normal = vnorm(vsub(P[i][j], C[i]) || [0, 0, 1]);
        N[i].push(normal);
        ids[i].push(mesh.pushVertex(P[i][j], normal, [j / n, i / (rings.length - 1 || 1)]));
      }
    }
    for (let i = 0; i < rings.length - 1; i++) {
      for (let j = 0; j < n; j++) {
        const j2 = (j + 1) % n;
        const a = ids[i][j], b = ids[i][j2], c = ids[i + 1][j2], d = ids[i + 1][j];
        const pA = P[i][j], pB = P[i][j2], pC = P[i + 1][j2], pD = P[i + 1][j];
        const face = vcross(vsub(pB, pA), vsub(pC, pA));
        const avg = vadd(vadd(N[i][j], N[i][j2]), vadd(N[i + 1][j2], N[i + 1][j]));
        if (vdot(face, avg) >= 0) mesh.quad(a, b, c, d);
        else mesh.quad(a, d, c, b);
      }
    }
    // caps
    const addCap = (ringIndex, dir) => {
      const ring = rings[ringIndex];
      const P0 = P[ringIndex];
      const c = C[ringIndex];
      let nrm = axis === 'z' ? [0, 0, dir] : axis === 'y' ? [0, dir, 0] : [dir, 0, 0];
      const centerIdx = mesh.pushVertex(c, nrm, [0.5, 0.5]);
      const rim = P0.map(p => mesh.pushVertex(p, nrm, [0, 0]));
      for (let j = 0; j < n; j++) {
        const a = rim[j], b = rim[(j + 1) % n];
        const pA = P0[j], pB = P0[(j + 1) % n];
        const face = vnorm(vcross(vsub(pA, c), vsub(pB, c)));
        if (vdot(face, nrm) >= 0) mesh.tri(centerIdx, a, b);
        else mesh.tri(centerIdx, b, a);
      }
    };
    if (opts.capStart !== false) addCap(0, (axis === 'z' ? rings[0].at < rings[rings.length - 1].at : rings[0].at < rings[rings.length - 1].at) ? -1 : 1);
    if (opts.capEnd !== false) addCap(rings.length - 1, (axis === 'z' ? rings[0].at < rings[rings.length - 1].at : rings[0].at < rings[rings.length - 1].at) ? 1 : -1);
    return mesh;
  }

  /* ---------------------------------------------------------
     camera scene construction
     --------------------------------------------------------- */
  const MAT = {
    body: '#2a2d2c', top: '#343738', grip: '#1c1f1e', accent: '#c8a05a',
    lens: '#1a1c1d', lensRing: '#232626', chrome: '#c3c0b6', dark: '#0d0f0f',
    button: '#3a3e3f', dial: '#2b2f2e', screen: '#080a0a', cage: '#222524'
  };

  function surfaceMaterial(color, surface, extras) {
    return Object.assign({
      color, metal: surface.metalness, rough: surface.roughness,
      grain: surface.grain, pattern: surface.pattern, clear: surface.clearcoat || 0,
      aniso: surface.anisotropy || 0, scale: 1, glass: 0
    }, extras || {});
  }

  /**
   * Grip cross-section: full bulge at the outer edge, flush with the body
   * at the inner edge, so the grip reads as part of the body instead of a
   * separate block glued onto the front.
   */
  function gripOutline(gw, depth, zBack, bodyFront, taper) {
    gw = Math.max(4, gw);
    depth = Math.max(1, depth);
    taper = clamp(taper == null ? 1 : taper, 0, 1);
    const rc = Math.min(gw, depth) * 0.16;
    const innerFront = bodyFront + depth * 0.5 * taper;
    const outerFront = bodyFront + depth * taper;
    const zFrontAt = x => {
      const t = clamp((gw / 2 - x) / gw, 0, 1);
      const bulge = t * t * (3 - 2 * t);
      return bodyFront + depth * (0.5 + 0.5 * bulge) * taper;
    };
    const pts = [];
    const N = 12;
    const x0 = gw / 2 - rc;
    for (let i = 0; i <= N; i++) {
      const x = x0 - (i / N) * (gw - rc * 2);
      pts.push([x, zFrontAt(x)]);
    }
    pts.push([-gw / 2 + rc * 0.4, outerFront - rc * 0.2]);
    pts.push([-gw / 2, outerFront - rc]);
    pts.push([-gw / 2, zBack + rc]);
    pts.push([-gw / 2 + rc, zBack]);
    pts.push([gw / 2 - rc, zBack]);
    pts.push([gw / 2, zBack + rc]);
    pts.push([gw / 2, innerFront - rc]);
    pts.push([gw / 2 - rc * 0.4, innerFront - rc * 0.2]);
    return pts;
  }
  function buildScene(spec, options) {
    options = options || {};
    const parts = [];
    const W = spec.W, H = spec.H, D = spec.D;
    const frontZ = D / 2, backZ = -D / 2, topY = H / 2, botY = -H / 2;
    const b = spec.body;
    const surface = b.surface;
    const bodyMat = surfaceMaterial(b.mainColor, surface);
    const topMat = surfaceMaterial(b.topColor, Object.assign({}, surface, { roughness: clamp(surface.roughness - 0.04, 0.1, 0.9) }));
    const gripSurface = Object.assign({}, surface, {
      metalness: 0.02, roughness: Math.max(0.62, surface.roughness + 0.14),
      pattern: spec.grip.texture === 'leather' ? 2 : spec.grip.texture === 'rubber' ? 6 : 1,
      grain: 0.45
    });
    const gripMat = surfaceMaterial(b.gripColor, gripSurface);
    const accentMat = { color: spec.brand.accent || b.accent, metal: 0.75, rough: 0.3, grain: 0.15, pattern: 0, clear: 0.2, aniso: 0, scale: 1, glass: 0 };
    const chromeMat = { color: '#b9b6ac', metal: 1.0, rough: 0.24, grain: 0.08, pattern: 0, clear: 0.4, aniso: 0, scale: 1, glass: 0 };
    const darkMetalMat = { color: '#202322', metal: 0.85, rough: 0.4, grain: 0.18, pattern: 0, clear: 0.1, aniso: 0, scale: 1, glass: 0 };
    const buttonMat = { color: b.buttonColor, metal: 0.55, rough: 0.42, grain: 0.2, pattern: 0, clear: 0.15, aniso: 0, scale: 1, glass: 0 };
    const dialMat = { color: b.dialColor, metal: 0.82, rough: 0.33, grain: 0.2, pattern: 1, clear: 0.2, aniso: 0, scale: 1, glass: 0 };
    const lensMat = { color: MAT.lens, metal: 0.55, rough: 0.5, grain: 0.14, pattern: 0, clear: 0.1, aniso: 0, scale: 1, glass: 0 };
    const lensRingMat = { color: '#1c1f1e', metal: 0.32, rough: 0.66, grain: 0.55, pattern: 1, clear: 0, aniso: 0, scale: 1, glass: 0 };
    const glassMat = { color: '#0d1a1c', metal: 0.9, rough: 0.055, grain: 0, pattern: 0, clear: 1, aniso: 0, scale: 1, glass: 1 };
    const screenMat = { color: '#080a0a', metal: 0.35, rough: 0.12, grain: 0.05, pattern: 0, clear: 1, aniso: 0, scale: 1, glass: 2 };
    const cageMat = { color: '#222524', metal: 0.7, rough: 0.42, grain: 0.3, pattern: 5, clear: 0, aniso: 0, scale: 1, glass: 0 };

    /* ---- body shell ---- */
    const bevel = Math.max(2, b.bevelR);
    const corner = Math.max(1, b.cornerR);
    const NS = 8, SEG = 7;
    const bodyRings = [];
    const ringAt = (z, inset, scale) => ({
      at: z,
      pts: scaleOutline(roundedRectOutline4(
        Math.max(4, W - inset * 2), Math.max(4, H - inset * 2),
        Math.max(0.6, corner * 0.5 - inset), Math.max(0.6, corner * 0.5 - inset),
        Math.max(0.6, corner - inset), Math.max(0.6, corner - inset), SEG
      ), scale || 1, scale || 1),
      center: [0, 0]
    });
    // front bevel rings
    for (let k = 0; k <= NS; k++) {
      const t = k / NS;
      const inset = bevel * (1 - Math.cos(t * Math.PI / 2));
      const z = frontZ - bevel + bevel * Math.sin(t * Math.PI / 2);
      bodyRings.push(ringAt(z, inset, 1));
    }
    // back bevel rings (reverse order so at decreases)
    for (let k = NS; k >= 0; k--) {
      const t = k / NS;
      const inset = bevel * (1 - Math.cos(t * Math.PI / 2));
      const z = backZ + bevel - bevel * Math.sin(t * Math.PI / 2);
      bodyRings.push(ringAt(z, inset, 0.992));
    }
    bodyRings.sort((a, b2) => a.at - b2.at);
    parts.push({ mesh: loft(bodyRings, { axis: 'z', capStart: true, capEnd: true }), mat: bodyMat, name: 'body' });

    /* ---- top plate ---- */
    const topH = Math.min(spec.body.topH || 10, H * 0.2);
    const plateRings = [];
    const plateBevel = clamp(topH * 0.35, 1.2, 4);
    for (let k = 0; k <= 3; k++) {
      const t = k / 3;
      const inset = plateBevel * (1 - Math.cos(t * Math.PI / 2));
      plateRings.push({
        at: topY - topH + (topH + 0.4) * (k / 3),
        pts: roundedRectOutline(W - 0.8 - inset * 2, D - 1.4 - inset * 2, Math.max(1, corner - inset * 0.5), SEG),
        center: [0, 0]
      });
    }
    // loft along Y uses (x,z) outlines; our rounded rect is in that plane
    const plateMesh = loft(plateRings.map(r => ({ at: r.at, pts: r.pts, center: [0, 0] })), { axis: 'y', capStart: true, capEnd: true });
    parts.push({ mesh: plateMesh, mat: topMat, name: 'topPlate' });

    /* ---- grip ---- */
    if (spec.grip.on && spec.grip.h > 4 && spec.grip.w > 3) {
      const gw = spec.grip.w, gh = spec.grip.h, gd = Math.max(4, spec.grip.d);
      const gx = -W / 2 + gw * 0.5 + W * 0.004;
      const rings = [];
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const fade = Math.pow(1 - t, 0.7);
        const wf = (0.92 + 0.08 * (1 - t)) * (0.72 + 0.28 * (1 - Math.pow(t, 2.4)));
        const zBack = frontZ - Math.min(14, gd * 0.5);
        const zFront = frontZ + gd * fade;
        const zc = (zBack + zFront) / 2;
        const depth = Math.max(2, zFront - zBack);
        rings.push({
          at: botY + gh * t,
          pts: roundedRectOutline(gw * wf, depth, Math.min(gw, depth) * (0.32 + 0.08 * t), 8),
          center: [gx, zc]
        });
      }
      // loft along Y uses (x,z)
      parts.push({ mesh: loft(rings, { axis: 'y', capStart: true, capEnd: true }), mat: gripMat, name: 'grip' });

    }

    /* ---- viewfinder hump ---- */
    if (spec.hump.on && spec.hump.h > 1) {
      const hw = spec.hump.w, hh = spec.hump.h, hd = spec.hump.d;
      const hx = spec.hump.x;
      const rings = [];
      const steps = 9;
      const narrow = spec.hump.style === 'prism' ? 0.52 : spec.hump.style === 'tall' ? 0.24 : 0.18;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const dome = t > 0.86 ? 1 - Math.pow((t - 0.86) / 0.14, 1.4) * 0.18 : 1;
        const wf = (1 - narrow * Math.pow(t, 1.25)) * dome;
        const df = (1 - 0.22 * t) * (t > 0.86 ? 1 - (t - 0.86) / 0.14 * 0.18 : 1);
        const zShift = -D * 0.05 * t;
        rings.push({
          at: topY - 0.4 + hh * t,
          pts: roundedRectOutline(hw * wf, hd * df, Math.min(hw * wf, hd * df) * (0.07 + 0.12 * (1 - t)), 7),
          center: [hx, -D * 0.02 + zShift]
        });
      }
      parts.push({ mesh: loft(rings, { axis: 'y', capStart: false, capEnd: true }), mat: topMat, name: 'hump' });
      // eyecup / viewfinder window on the back
      const cupW = hw * 0.62, cupH = Math.max(6, hh * 0.62);
      const cup = loftsRoundedBox(hx, topY + hh * 0.3, backZ - 3.4, cupW, cupH, 5.4, 2.6);
      parts.push({ mesh: cup, mat: { color: '#111413', metal: 0.1, rough: 0.8, grain: 0.6, pattern: 6, clear: 0, aniso: 0, scale: 1, glass: 0 }, name: 'eyecup' });
      const win = loftsRoundedBox(hx, topY + hh * 0.4, backZ - 4.1, cupW * 0.68, cupH * 0.5, 1.2, 1.1);
      parts.push({ mesh: win, mat: screenMat, name: 'evfGlass' });
    }

    /* ---- rear screen ---- */
    if (spec.screen.on) {
      const sw = spec.screen.w, sh = spec.screen.h;
      const sx = W * 0.02;
      const sy = -H * 0.02;
      const hinge = spec.screen.type === 'sideflip' || spec.screen.type === 'fold';
      const panel = loftsRoundedBox(sx, sy, backZ - 3.6, sw, sh, 3.4, 3);
      parts.push({ mesh: panel, mat: { color: '#101313', metal: 0.4, rough: 0.35, grain: 0.1, pattern: 0, clear: 0.4, aniso: 0, scale: 1, glass: 0 }, name: 'screenFrame' });
      const glass = loftsRoundedBox(sx, sy, backZ - 4.7, sw - 3.2, sh - 3.2, 1.2, 2.2);
      parts.push({ mesh: glass, mat: screenMat, name: 'screenGlass' });
      if (hinge) {
        const hx = sx + sw / 2 + 1.8;
        const hy = sy - sh * 0.48;
        parts.push({ mesh: cylinderMesh([hx, hy, backZ - 2.4], 2.4, sh * 0.96, 'y', 18, 0), mat: darkMetalMat, name: 'hinge' });
        parts.push({ mesh: cylinderMesh([hx, hy, backZ - 2.4], 1.2, sh * 0.9, 'y', 12, 0), mat: chromeMat, name: 'hingePin' });
      }
      // thumb rest
      parts.push({ mesh: loftsRoundedBox(W * 0.36, -H * 0.22, backZ - 3.4, W * 0.16, H * 0.26, 2.6, 6), mat: gripMat, name: 'thumbRest' });
    }

    /* ---- mount & lens ---- */
    const mountY = spec.mount.y, mountX = spec.mount.x;
    const mountR = Math.max(14, spec.mount.dia / 2);
    if (spec.mount.id !== 'FIXED') {
      parts.push({ mesh: cylinderMesh([mountX, mountY, frontZ - 0.5], mountR * 1.08, 4.2, 'z', 40, 0), mat: chromeMat, name: 'mountRing' });
      parts.push({ mesh: cylinderMesh([mountX, mountY, frontZ + 0.5], mountR * 0.93, 3.2, 'z', 40, 0), mat: darkMetalMat, name: 'mountInner' });
      // bayonet tabs
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
        const tx = mountX + Math.cos(a) * mountR * 0.8;
        const ty = mountY + Math.sin(a) * mountR * 0.8;
        parts.push({ mesh: loftsRoundedBox(tx, ty, frontZ + 1.8, 6, 2.4, 2.2, 0.8), mat: chromeMat, name: 'bayonet' });
      }
      // lens release button
      parts.push({ mesh: cylinderMesh([mountX + mountR * 1.2, mountY - mountR * 0.55, frontZ + 1.2], 2.6, 2.6, 'z', 14, 0), mat: buttonMat, name: 'lensRelease' });
    }

    if (spec.lens.on) {
      const lensParts = buildLens(spec, { x: mountX, y: mountY, z: frontZ, mat: lensMat, ringMat: lensRingMat, accentMat, glassMat, chromeMat, darkMetalMat, options });
      lensParts.forEach(p => parts.push(p));
    } else {
      // body cap
      parts.push({ mesh: cylinderMesh([mountX, mountY, frontZ + 1.6], mountR * 0.98, 3.4, 'z', 36, 0), mat: darkMetalMat, name: 'bodyCap' });
    }

    /* ---- top controls ---- */
    const ctr = spec.controls;
    const dialMesh = (d) => {
      const rings = [
        { at: d.y - 0.2, pts: circleOutline(d.r, 36, 0, 0), center: [0, 0] },
        { at: d.y + d.h * 0.45, pts: circleOutline(d.r * 1.01, 36, 0, 0), center: [0, 0] },
        { at: d.y + d.h, pts: circleOutline(d.r * 0.92, 36, 0, 0), center: [0, 0] }
      ];
      const m = loft(rings, { axis: 'y', capStart: true, capEnd: true });
      return translateMesh(m, d.x, 0, d.z);
    };
    (ctr.dials || []).forEach(d => {
      const ring = { at: d.y + 0.2, pts: circleOutline(d.r * 1.06, 40, d.ticks || 24, 0.035), center: [0, 0] };
      const mid = { at: d.y + d.h * 0.55, pts: circleOutline(d.r * 1.02, 40, d.ticks || 24, 0.04), center: [0, 0] };
      const top = { at: d.y + d.h, pts: circleOutline(d.r * 0.9, 40, 0, 0), center: [0, 0] };
      const m = loft([{ at: d.y - 0.1, pts: circleOutline(d.r * 0.94, 40, 0, 0), center: [0, 0] }, ring, mid, top], { axis: 'y', capStart: true, capEnd: true });
      parts.push({ mesh: translateMesh(m, d.x, 0, d.z), mat: dialMat, name: 'dial' });
      // index marker
      parts.push({ mesh: loftsRoundedBox(d.x - 0.8, d.y + d.h - 0.1, d.z - d.r * 0.75, 1.6, 0.5, d.r * 0.32, 0.2), mat: { color: '#d8d4c6', metal: 0.2, rough: 0.5, grain: 0.1, pattern: 0, clear: 0, aniso: 0, scale: 1, glass: 0 }, name: 'dialMark' });
    });
    (ctr.topButtons || []).forEach(btn => {
      if (btn.kind === 'shutter') {
        parts.push({ mesh: cylinderMesh([btn.x, btn.y, btn.z], btn.r * 1.34, 1.4, 'y', 24, 0), mat: chromeMat, name: 'shutterCollar' });
        parts.push({ mesh: cylinderMesh([btn.x, btn.y + 1.2, btn.z], btn.r, 2.6, 'y', 24, 0), mat: buttonMat, name: 'shutter' });
        parts.push({ mesh: cylinderMesh([btn.x, btn.y + 3.8, btn.z], btn.r * 0.36, 0.6, 'y', 12, 0), mat: darkMetalMat, name: 'shutterHole' });
      } else {
        parts.push({ mesh: cylinderMesh([btn.x, btn.y, btn.z], btn.r, btn.h + 1, 'y', 16, 0), mat: btn.kind === 'record' ? { color: '#a8402f', metal: 0.15, rough: 0.45, grain: 0.1, pattern: 0, clear: 0.5, aniso: 0, scale: 1, glass: 0 } : buttonMat, name: 'btn_' + btn.kind });
      }
    });
    if (ctr.hotshoe) {
      const hx = spec.hump.on ? spec.hump.x + spec.hump.w * 0.5 + 22 : 0;
      const hyd = topY + (spec.hump.on ? 0 : 0.8);
      parts.push({ mesh: loftsRoundedBox(hx, hyd + 0.8, -D * 0.12, 22, 1.6, 16, 0.8), mat: chromeMat, name: 'shoeBase' });
      parts.push({ mesh: loftsRoundedBox(hx - 9, hyd + 2.2, -D * 0.12, 2.4, 3.4, 16, 0.6), mat: chromeMat, name: 'shoeRailL' });
      parts.push({ mesh: loftsRoundedBox(hx + 9, hyd + 2.2, -D * 0.12, 2.4, 3.4, 16, 0.6), mat: chromeMat, name: 'shoeRailR' });
      parts.push({ mesh: loftsRoundedBox(hx, hyd + 1.6, -D * 0.12, 13, 0.8, 10, 0.5), mat: darkMetalMat, name: 'shoeContact' });
    }

    /* ---- body seams & fasteners ---- */
    parts.push({ mesh: loftsRoundedBox(0, topY - topH - 0.3, frontZ - 0.05, Math.max(10, W - Math.max(8, b.cornerR) * 2.2), 0.4, 0.5, 0.2), mat: darkMetalMat, name: 'plateSeamFront' });
    
    [[-0.88, 0.36], [-0.88, -0.28], [0.86, -0.3]].forEach(([fx, fy], i) => {
      parts.push({ mesh: cylinderMesh([fx * W / 2, fy * H, frontZ + 0.1], 1.3, 0.5, 'z', 12, 0), mat: darkMetalMat, name: 'screw' + i });
      parts.push({ mesh: cylinderMesh([fx * W / 2, fy * H, frontZ + 0.55], 0.55, 0.35, 'z', 8, 0), mat: chromeMat, name: 'screwSlot' + i });
    });
    /* ---- rear controls ---- */
    (ctr.backButtons || []).forEach(btn => {
      parts.push({ mesh: cylinderMesh([btn.x, btn.y, backZ - 0.6], btn.r, 2, 'z', 14, 0), mat: buttonMat, name: 'btnBack' });
    });
    if (ctr.joystick) {
      const jx = W * 0.34, jy = -H * 0.02;
      parts.push({ mesh: cylinderMesh([jx, jy, backZ - 1.1], 5.2, 2.2, 'z', 20, 0), mat: darkMetalMat, name: 'joystickRing' });
      parts.push({ mesh: cylinderMesh([jx, jy, backZ - 2.3], 3.4, 1.8, 'z', 16, 0), mat: buttonMat, name: 'joystick' });
    }

    /* ---- side details ---- */
    // strap lugs
    [-1, 1].forEach(s => {
      parts.push({ mesh: cylinderMesh([s * (W / 2 - 1), H * 0.16, -D * 0.1], 2.6, 3.2, 'x', 12, 0), mat: chromeMat, name: 'lug' });
    });
    // front AF window + lamp
    parts.push({ mesh: loftsRoundedBox(W * 0.34, H * 0.24, frontZ + 0.2, 10, 4.4, 0.9, 1.4), mat: { color: '#141616', metal: 0.2, rough: 0.6, grain: 0.2, pattern: 0, clear: 0.3, aniso: 0, scale: 1, glass: 0 }, name: 'afWindow' });
    // side ports panel
    parts.push({ mesh: loftsRoundedBox(W / 2 - 0.4, -H * 0.18, -D * 0.06, 1.2, H * 0.2, D * 0.5, 2.4), mat: { color: '#171a19', metal: 0.4, rough: 0.55, grain: 0.3, pattern: 0, clear: 0, aniso: 0, scale: 1, glass: 0 }, name: 'portDoor' });

    /* ---- brand colour line (Nikon style) ---- */
    if (spec.brand.accentUse === 'grip_line' && spec.grip.on) {
      const gx = -W / 2 + spec.grip.w * 0.52 + W * 0.012;
      parts.push({ mesh: loftsRoundedBox(gx - spec.grip.w * 0.3, -H * 0.18, frontZ + Math.max(2, spec.grip.d) - 0.2, 2, Math.min(H * 0.36, spec.grip.h * 0.7), 1.2, 0.8), mat: accentMat, name: 'brandLine' });
    }
    if (false && spec.brand.accentUse === 'mount_arc') { /* mount accent kept as a decal only */ }
    if (spec.brand.accentUse === 'red_dot') {
      parts.push({ mesh: cylinderMesh([-W * 0.36, H * 0.02, frontZ + 0.3], 4.4, 1, 'z', 24, 0), mat: { color: '#9b2c26', metal: 0.2, rough: 0.35, grain: 0, pattern: 0, clear: 0.7, aniso: 0, scale: 1, glass: 0 }, name: 'redDot' });
    }

    /* ---- accessories ---- */
    const a = spec.accessories;
    if (a.batteryGrip) {
      const gh = Math.max(16, H * 0.22);
      parts.push({ mesh: loftsRoundedBox(0, botY - gh / 2, 0, W * 0.98, gh, D * 0.98, 6), mat: bodyMat, name: 'batteryGrip' });
      parts.push({ mesh: loftsRoundedBox(0, botY - gh * 0.1, D / 2 - 2, W * 0.72, 3, 6, 2), mat: gripMat, name: 'batteryGripPad' });
      parts.push({ mesh: cylinderMesh([-W * 0.28, botY - 1, D * 0.28], 4.2, 2.6, 'y', 20, 0), mat: buttonMat, name: 'vgShutter' });
    }
    if (a.cage) {
      const m = 9;
      parts.push({ mesh: loftsRoundedBox(0, topY + m, 0, W + m * 2, 5, D + m * 2, 2), mat: cageMat, name: 'cageTop' });
      parts.push({ mesh: loftsRoundedBox(0, botY - m, 0, W + m * 2, 5, D + m * 2, 2), mat: cageMat, name: 'cageBottom' });
      [-1, 1].forEach(s => {
        parts.push({ mesh: loftsRoundedBox(s * (W / 2 + m), 0, 0, 5, H + m * 2, D + m * 2, 2), mat: cageMat, name: 'cageSide' });
      });
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
        parts.push({ mesh: cylinderMesh([sx * (W / 2 + m), topY + m + 2.6, sz * (D / 2 + m - 6)], 2.6, 1.2, 'y', 12, 0), mat: chromeMat, name: 'cageScrew' });
      }));
    }
    if (a.handle) {
      const hy = topY + (spec.hump.on ? spec.hump.h : 0) + (a.cage ? 12 : 6);
      const barW = W * 0.66;
      parts.push({ mesh: loftsRoundedBox(0, hy + 22, -D * 0.04, barW, 9, 26, 4), mat: cageMat, name: 'handleBar' });
      [-1, 1].forEach(s => {
        parts.push({ mesh: loftsRoundedBox(s * barW * 0.36, hy + 11, -D * 0.04, 9, 24, 16, 3), mat: cageMat, name: 'handlePost' });
      });
    }
    if (a.mic) {
      parts.push({ mesh: cylinderMesh([0, topY + 16, D * 0.16], 7, 54, 'z', 20, 0), mat: { color: '#222624', metal: 0.3, rough: 0.65, grain: 0.4, pattern: 6, clear: 0, aniso: 0, scale: 1, glass: 0 }, name: 'mic' });
      parts.push({ mesh: cylinderMesh([0, topY + 16, D * 0.16 + 31], 5.2, 8, 'z', 18, 0), mat: darkMetalMat, name: 'micTip' });
      parts.push({ mesh: loftsRoundedBox(0, topY + 12, D * 0.16 - 8, 14, 8, 14, 2), mat: darkMetalMat, name: 'micMount' });
    }
    if (a.monitor) {
      const mx = -W / 2 - 26;
      parts.push({ mesh: loftsRoundedBox(mx, H * 0.06, 0, 5, H * 0.44, D * 0.9, 2), mat: { color: '#141716', metal: 0.45, rough: 0.4, grain: 0.2, pattern: 0, clear: 0.3, aniso: 0, scale: 1, glass: 0 }, name: 'monitorBack' });
      parts.push({ mesh: loftsRoundedBox(mx - 2.6, H * 0.06, 0, 1.6, H * 0.38, D * 0.8, 2), mat: screenMat, name: 'monitorGlass' });
      parts.push({ mesh: loftsRoundedBox(-W / 2 - 8, H * 0.06, 0, 20, 7, 20, 2), mat: cageMat, name: 'monitorArm' });
    }

    /* ---- ground / bounds ---- */
    const bounds = computeBounds(parts);
    return { parts, bounds, spec, W, H, D };
  }

  function loftsRoundedBox(cx, cy, cz, w, h, d, r) {
    // Axis-aligned rounded box: straight middle, rounded top and bottom edges.
    const rb = Math.max(0.4, Math.min(r || 2, Math.min(w, d) * 0.42, h * 0.42));
    const K = 3;
    const rings = [];
    const push = (y, inset) => {
      const ww = Math.max(0.8, w - inset * 2), dd = Math.max(0.8, d - inset * 2);
      const rr = Math.max(0.3, rb - inset);
      rings.push({
        at: y,
        pts: roundedRectOutline(ww, dd, rr, 5),
        center: [cx, cz]
      });
    };
    for (let k = 0; k <= K; k++) {
      const t = k / K;
      push(cy - h / 2 + rb * t, rb * (1 - Math.sin(t * Math.PI / 2)));
    }
    for (let k = 0; k <= K; k++) {
      const t = k / K;
      push(cy + h / 2 - rb + rb * t, rb * (1 - Math.cos(t * Math.PI / 2)));
    }
    return loft(rings, { axis: 'y', capStart: true, capEnd: true });
  }

  function cylinderMesh(center, r, h, axis, seg, teeth) {
    const c = center;
    const rings = [];
    const outline = circleOutline(r, seg || 24, teeth || 0, teeth ? 0.03 : 0);
    if (axis === 'y') {
      rings.push({ at: c[1], pts: outline, center: [c[0], c[2]] });
      rings.push({ at: c[1] + h, pts: outline, center: [c[0], c[2]] });
      return loft(rings, { axis: 'y' });
    }
    if (axis === 'z') {
      rings.push({ at: c[2], pts: outline, center: [c[0], c[1]] });
      rings.push({ at: c[2] + h, pts: outline, center: [c[0], c[1]] });
      return loft(rings, { axis: 'z' });
    }
    rings.push({ at: c[0], pts: outline, center: [c[1], c[2]] });
    rings.push({ at: c[0] + h, pts: outline, center: [c[1], c[2]] });
    return loft(rings, { axis: 'x' });
  }

  function translateMesh(mesh, dx, dy, dz) {
    const p = mesh.pos;
    for (let i = 0; i < p.length; i += 3) { p[i] += dx; p[i + 1] += dy; p[i + 2] += dz; }
    return mesh;
  }

  function computeBounds(parts) {
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    parts.forEach(part => {
      const p = part.mesh.pos;
      for (let i = 0; i < p.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          if (p[i + k] < min[k]) min[k] = p[i + k];
          if (p[i + k] > max[k]) max[k] = p[i + k];
        }
      }
    });
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    return { min, max, center, size, radius: 0.5 * Math.sqrt(size[0] * size[0] + size[1] * size[1] + size[2] * size[2]) };
  }

  /* ---------------------------------------------------------
     lens builder
     --------------------------------------------------------- */
  function buildLens(spec, ctx) {
    const parts = [];
    const { x, y, z } = ctx;
    const R = spec.lens.diameter / 2;
    const L = spec.lens.length;
    const style = spec.lens.style || 'black_pro';
    const isWhite = style === 'white_tele';
    const isCine = style === 'cine_black';
    const barrelColor = isWhite ? '#cfcabd' : isCine ? '#181b1b' : '#1a1c1d';
    const barrelMat = { color: barrelColor, metal: 0.65, rough: isCine ? 0.44 : 0.36, grain: 0.16, pattern: 0, clear: 0.12, aniso: 0, scale: 1, glass: 0 };
    const rearMat = { color: isWhite ? '#b9b4a8' : '#1e2122', metal: 0.55, rough: 0.54, grain: 0.2, pattern: 0, clear: 0.08, aniso: 0, scale: 1, glass: 0 };
    const ringMat = { color: isWhite ? '#c8c3b7' : '#242728', metal: 0.45, rough: 0.58, grain: 0.6, pattern: 1, clear: 0, aniso: 0, scale: 1, glass: 0 };
    const accentMat = { color: spec.lens.accent || spec.brand.accent || '#b79143', metal: 0.7, rough: 0.3, grain: 0.1, pattern: 0, clear: 0.25, aniso: 0, scale: 1, glass: 0 };
    const chromeMat = { color: '#b9b6ac', metal: 1.0, rough: 0.26, grain: 0.08, pattern: 0, clear: 0.4, aniso: 0, scale: 1, glass: 0 };
    const glassMat = { color: '#0c1a1d', metal: 0.92, rough: 0.05, grain: 0, pattern: 0, clear: 1, aniso: 0, scale: 1, glass: 1 };
    const darkMat = { color: '#101313', metal: 0.6, rough: 0.5, grain: 0.2, pattern: 0, clear: 0, aniso: 0, scale: 1, glass: 0 };

    // mount flange + barrel: reaches full diameter quickly, then stays cylindrical
    const z0 = z - 1.5;
    const prof = [
      [0.0, 0.54], [0.018, 0.62], [0.04, 0.74], [0.07, 0.84], [0.1, 0.9], [0.13, 0.95],
      [0.16, 0.98], [0.2, 1.0], [0.44, 1.0], [0.47, 0.95], [0.7, 0.95], [0.74, 1.0],
      [0.9, 1.0], [0.945, 0.96], [0.985, 0.9], [1.0, 0.86]
    ];
    const rings = prof.map(([t, rf]) => ({
      at: z0 + L * t,
      pts: circleOutline(Math.max(2, R * rf), 56, 0, 0),
      center: [x, y]
    }));
    parts.push({ mesh: translateMesh(loft(rings, { axis: 'z', capStart: true, capEnd: false }), 0, 0, 0), mat: barrelMat, name: 'lensBarrel' });
    // mount ring
    parts.push({ mesh: cylinderMesh([x, y, z0 - 1.8], R * 0.74, 2, 'z', 40, 0), mat: chromeMat, name: 'lensMount' });
    // focus ring
    const fr0 = z0 + L * 0.18, fr1 = z0 + L * 0.44;
    parts.push({ mesh: cylinderMesh([x, y, fr0], R * 1.035, fr1 - fr0, 'z', 96, 48), mat: ringMat, name: 'focusRing' });
    // zoom ring
    if (spec.lens.zoom || (ctx.options && ctx.options.lensZoom)) {
      const zr0 = z0 + L * 0.5, zr1 = z0 + L * 0.7;
      parts.push({ mesh: cylinderMesh([x, y, zr0], R * 1.05, zr1 - zr0, 'z', 96, 48), mat: ringMat, name: 'zoomRing' });
    }
    // accent band
    parts.push({ mesh: cylinderMesh([x, y, z0 + L * 0.78], R * 1.012, Math.max(1.6, L * 0.014), 'z', 44, 0), mat: accentMat, name: 'lensAccent' });
    // front rim
    parts.push({ mesh: cylinderMesh([x, y, z0 + L * 0.92], R * 1.0, L * 0.07, 'z', 48, 0), mat: rearMat, name: 'lensRim' });
    // front glass dome
    const zf = z0 + L * 0.99;
    const glassRings = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const f = 1 - i / steps;
      const rr = R * 0.86 * f;
      const zz = zf + (i / steps) * 2.6 - 0.4;
      glassRings.push({ at: zz, pts: circleOutline(Math.max(0.5, rr), 48, 0, 0), center: [x, y] });
    }
    parts.push({ mesh: loft(glassRings, { axis: 'z', capStart: false, capEnd: true }), mat: Object.assign({}, glassMat, { glassCenter: [x, y, 0], glassRadius: Math.max(6, R * 0.86) }), name: 'lensGlass' });
    parts.push({ mesh: cylinderMesh([x, y, zf - 1.6], R * 0.9, 1.1, 'z', 56, 0), mat: chromeMat, name: 'lensBezel' });
    // inner barrel rim
    parts.push({ mesh: cylinderMesh([x, y, zf - 2.4], R * 0.9, 2.6, 'z', 48, 0), mat: darkMat, name: 'lensInner' });
    // aperture marks / distance window
    parts.push({ mesh: loftsRoundedBox(x, y + R * 0.97, z0 + L * 0.55, R * 0.34, 1.2, Math.max(6, L * 0.1), 1.4), mat: { color: '#1c1f1e', metal: 0.2, rough: 0.4, grain: 0.1, pattern: 0, clear: 0.4, aniso: 0, scale: 1, glass: 0 }, name: 'distanceWindow' });
    // cine gear teeth
    if (isCine) {
      [fr0 + 0.4, fr1 - 0.4].forEach((gz, i) => {
        parts.push({ mesh: cylinderMesh([x, y, gz], R * 1.06, Math.max(2, L * 0.02), 'z', 72, 0), mat: accentMat, name: 'gear' + i });
      });
    }
    // hood
    if (spec.lens.hood) {
      const hz = z0 + L * 0.99;
      const ringsH = [
        { at: hz, pts: circleOutline(R * 1.0, 48, 0, 0), center: [x, y] },
        { at: hz + L * 0.12, pts: circleOutline(R * 1.16, 48, 0, 0), center: [x, y] }
      ];
      parts.push({ mesh: loft(ringsH, { axis: 'z', capStart: false, capEnd: false }), mat: barrelMat, name: 'hood' });
    }
    return parts;
  }

  /* ---------------------------------------------------------
     lens-only scene (optics lab product shot)
     --------------------------------------------------------- */
  function buildLensScene(spec, options) {
    options = options || {};
    const R = spec.diameter / 2, L = spec.length;
    const mat = { color: '#1a1c1d', metal: 0.55, rough: 0.5, grain: 0.14, pattern: 0, clear: 0.1, aniso: 0, scale: 1, glass: 0 };
    const ringMat = { color: '#1c1f1e', metal: 0.32, rough: 0.66, grain: 0.55, pattern: 1, clear: 0, aniso: 0, scale: 1, glass: 0 };
    const accentMat = { color: spec.accent || '#b79143', metal: 0.7, rough: 0.3, grain: 0.1, pattern: 0, clear: 0.25, aniso: 0, scale: 1, glass: 0 };
    const chromeMat = { color: '#b9b6ac', metal: 1.0, rough: 0.26, grain: 0.08, pattern: 0, clear: 0.4, aniso: 0, scale: 1, glass: 0 };
    const darkMetalMat = { color: '#202322', metal: 0.85, rough: 0.4, grain: 0.18, pattern: 0, clear: 0.1, aniso: 0, scale: 1, glass: 0 };
    const glassMat = { color: '#0d1a1c', metal: 0.9, rough: 0.055, grain: 0, pattern: 0, clear: 1, aniso: 0, scale: 1, glass: 1, glassCenter: [0, 0, 0], glassRadius: Math.max(8, R * 0.86) };
    const fake = {
      lens: { diameter: spec.diameter, length: spec.length, style: spec.style, accent: spec.accent, zoom: spec.zoom, hood: false, name: spec.name },
      mount: { id: spec.mount.id }, brand: spec.brand || { accent: spec.accent }
    };
    const parts = buildLens(fake, { x: 0, y: 0, z: -L * 0.5, mat, ringMat, accentMat, glassMat, chromeMat, darkMetalMat, options: { lensName: spec.name } });
    // rear mount ring + cap
    parts.push({ mesh: cylinderMesh([0, 0, -L * 0.5 - 2.4], R * 0.7, 2.2, 'z', 40, 0), mat: chromeMat, name: 'rearMount' });
    parts.push({ mesh: cylinderMesh([0, 0, -L * 0.5 - 2.9], R * 0.64, 1.2, 'z', 40, 0), mat: darkMetalMat, name: 'rearCap' });
    const bounds = computeBounds(parts);
    return { parts, bounds, spec, decals: [] };
  }
  /* ---------------------------------------------------------
     decals
     --------------------------------------------------------- */
  function decalQuads(spec, options) {
    const out = [];
    const decals = spec.decals || [];
    const W = spec.W, H = spec.H, D = spec.D;
    decals.forEach(d => {
      if (d.kind === 'text') {
        const face = d.face || 'front';
        let pos, normal, right;
        if (face === 'top') {
          pos = [d.x, H / 2 + 0.65, d.z];
          normal = [0, 1, 0]; right = [1, 0, 0];
        } else {
          pos = [d.x, d.y, D / 2 + 0.12];
          normal = [0, 0, 1]; right = [1, 0, 0];
        }
        out.push({ decal: d, pos, normal, right, w: d.w, h: d.h, color: d.color, opacity: d.opacity == null ? 0.85 : d.opacity, font: d.font, text: d.text, align: d.align });
      }
    });
    // lens engraving on top of the barrel
    if (spec.lens.on && (options.showLensText !== false)) {
      const R = spec.lens.diameter / 2;
      const L = spec.lens.length;
      const name = (options.lensName || spec.lens.name || (spec.mount.id + ' MOUNT')).toString();
      out.push({
        decal: { kind: 'text' }, pos: [spec.mount.x, spec.mount.y + R + 0.35, D / 2 + L * 0.52],
        normal: [0, 1, 0], right: [0, 0, 1], w: L * 0.34, h: Math.max(3.2, R * 0.16),
        color: '#c9c6ba', opacity: 0.62, font: 'mono', text: name.slice(0, 30), align: 'center'
      });
      out.push({
        decal: { kind: 'text' }, pos: [spec.mount.x, spec.mount.y - R - 0.35, D / 2 + L * 0.52],
        normal: [0, -1, 0], right: [0, 0, 1], w: L * 0.26, h: Math.max(2.6, R * 0.12),
        color: '#a9a69a', opacity: 0.5, font: 'mono', text: (spec.mount.id || '') + ' · ' + (spec.lens.accent ? '' : ''), align: 'center'
      });
    }
    return out;
  }

  /* ---------------------------------------------------------
     text textures
     --------------------------------------------------------- */
  const FONT_SETS = {
    display: '"Bahnschrift", "DIN Alternate", "Arial Narrow", Arial, sans-serif',
    mono: '"Cascadia Mono", Consolas, "Courier New", monospace',
    serif: '"Palatino Linotype", "Iowan Old Style", Georgia, serif'
  };
  function makeTextCanvas(text, color, fontKind, tracking) {
    const c = document.createElement('canvas');
    const W = 512, H = 96;
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    const upper = String(text || '');
    let size = 46;
    const font = k => `${k === 'serif' ? 'italic ' : ''}${k === 'mono' ? 500 : 600} ${size}px ${FONT_SETS[k] || FONT_SETS.display}`;
    ctx.font = font(fontKind || 'display');
    const track = tracking == null ? (fontKind === 'mono' ? 3 : 6) : tracking;
    let width = 0;
    for (const ch of upper) width += ctx.measureText(ch).width + track;
    if (width > W - 20) {
      size = Math.max(16, Math.floor(size * (W - 20) / width));
      ctx.font = font(fontKind || 'display');
      width = 0;
      for (const ch of upper) width += ctx.measureText(ch).width + track;
    }
    let x = (W - width) / 2;
    for (const ch of upper) {
      ctx.fillText(ch, x, H / 2 + 2);
      x += ctx.measureText(ch).width + track;
    }
    return c;
  }
  function textTexture(gl, cache, key, text, color, fontKind, tracking) {
    if (cache.has(key)) return cache.get(key);
    const canvas = makeTextCanvas(text, color, fontKind, tracking);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    cache.set(key, tex);
    return tex;
  }

  /* ---------------------------------------------------------
     shaders
     --------------------------------------------------------- */
  const MAIN_VS = `#version 300 es
  precision highp float;
  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNor;
  layout(location = 2) in vec2 aUV;
  uniform mat4 uVP;
  out vec3 vWorld;
  out vec3 vNor;
  out vec2 vUV;
  void main() {
    vWorld = aPos;
    vNor = aNor;
    vUV = aUV;
    gl_Position = uVP * vec4(aPos, 1.0);
  }`;

  const MAIN_FS = `#version 300 es
  precision highp float;
  in vec3 vWorld;
  in vec3 vNor;
  in vec2 vUV;
  out vec4 outColor;

  uniform vec3 uColor;
  uniform vec3 uCamPos;
  uniform vec3 uKeyDir;
  uniform vec3 uFillDir;
  uniform vec3 uRimDir;
  uniform float uMetal;
  uniform float uRough;
  uniform float uGrain;
  uniform float uClear;
  uniform float uAniso;
  uniform int uPattern;
  uniform float uScale;
  uniform float uExposure;
  uniform int uGlass;
  uniform int uDebug;
  uniform vec3 uGlassCenter;
  uniform float uGlassRadius;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1, 0));
    float c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  vec3 triWeights(vec3 n) {
    vec3 a = abs(n);
    return a / (a.x + a.y + a.z + 1e-4);
  }
  float patternHeight(vec3 p, int pattern) {
    float v = 0.0;
    if (pattern == 0) {
      v = fbm(p.xz * 0.5) * 0.22;
    } else if (pattern == 1) {
      v = fbm(p.xz * 1.35 + p.y * 0.6) * 0.62 + fbm(p.xy * 1.1) * 0.3;
    } else if (pattern == 2) {
      vec2 q = p.xz * 1.55 + vec2(p.y * 0.85, 0.0);
      float g = fbm(q);
      float c = smoothstep(0.44, 0.66, g) * 0.75;
      v = c + fbm(p.xz * 4.2 + p.y) * 0.25;
    } else if (pattern == 3) {
      v = fbm(p.xz * 2.4) * 0.7;
    } else if (pattern == 4) {
      float a = (p.x + p.y + p.z) * 0.55;
      v = smoothstep(0.25, 0.75, abs(sin(a * 3.14159))) * 0.5 + fbm(p.xz * 1.9) * 0.5;
    } else if (pattern == 5) {
      v = fbm(vec2(p.y * 0.35, (p.x + p.z) * 2.4)) * 0.8;
    } else if (pattern == 6) {
      vec2 q = p.xz * 1.5 + vec2(p.y * 0.7, 0.0);
      v = smoothstep(0.42, 0.62, fbm(q));
    } else {
      v = fbm(p.xz * 0.9) * 0.5;
    }
    return v;
  }
  vec3 perturbNormal(vec3 N, vec3 P) {
    float h = patternHeight(P, uPattern) * uGrain;
    vec3 dpx = dFdx(P), dpy = dFdy(P);
    float dhx = dFdx(h), dhy = dFdy(h);
    float foot = clamp(1.0 - 0.6 * length(fwidth(P)) * 0.4, 0.0, 1.0);
    vec3 n = normalize(N - (dhx * normalize(dpx) + dhy * normalize(dpy)) * 0.12 * foot);
    return normalize(mix(N, n, 0.8));
  }
  float softbox(vec3 R, vec3 dir, float size, float soft) {
    float d = dot(R, dir);
    return smoothstep(cos(size + soft), cos(max(0.005, size - soft)), d);
  }
  float D_GGX(float NoH, float a) {
    float a2 = a * a;
    float d = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / max(3.14159 * d * d, 1e-5);
  }
  float V_SmithGGX(float NoV, float NoL, float a) {
    float a2 = a * a;
    float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
    float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
    return 0.5 / max(gv + gl, 1e-5);
  }
  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  void main() {
    vec3 N = normalize(vNor);
    if (uDebug == 1) { outColor = vec4(N * 0.5 + 0.5, 1.0); return; }
    if (uDebug == 2) { outColor = vec4(vec3(uMetal, uRough, uGrain), 1.0); return; }
    vec3 V = normalize(uCamPos - vWorld);
    vec3 base = uColor;
    float metal = clamp(uMetal, 0.0, 1.0);
    float rough = clamp(uRough, 0.045, 0.95);
    float ndv = max(dot(N, V), 0.001);
    // micro structure
    if (uGrain > 0.001) {
      N = perturbNormal(N, vWorld);
      float grainDark = patternHeight(vWorld * uScale, uPattern);
      base *= 1.0 + (grainDark - 0.5) * uGrain * 0.08;
      rough = clamp(rough + (grainDark - 0.5) * uGrain * 0.07, 0.05, 0.95);
    }
    vec3 F0 = mix(vec3(0.045), base, metal);
    float a = max(0.02, rough * rough);
    vec3 col = vec3(0.0);

    // analytic studio lights: key, fill, rim, top
    vec3 L1 = normalize(uKeyDir);
    vec3 L2 = normalize(uFillDir);
    vec3 L3 = normalize(uRimDir);
    vec3 lights[3] = vec3[3](L1, L2, L3);
    vec3 lightCols[3] = vec3[3](vec3(1.0, 0.985, 0.955) * 1.15, vec3(0.84, 0.9, 1.0) * 0.4, vec3(1.0, 0.95, 0.88) * 0.46);
    for (int i = 0; i < 3; i++) {
      vec3 L = lights[i];
      float ndl = max(dot(N, L), 0.0);
      vec3 H = normalize(L + V);
      float ndh = max(dot(N, H), 0.0);
      float vdh = max(dot(V, H), 0.0);
      float D = D_GGX(ndh, a);
      float Vis = V_SmithGGX(ndv, max(ndl, 1e-4), a);
      vec3 F = F0 + (1.0 - F0) * pow(1.0 - vdh, 5.0);
      vec3 spec = D * Vis * F;
      vec3 diff = base * (1.0 - metal) * ndl / 3.14159;
      col += (diff + spec * mix(1.0, 2.8, uClear)) * lightCols[i];
    }

    // environment reflection (studio: bright top, dark floor)
    vec3 R = reflect(-V, N);
    float up = smoothstep(-0.55, 0.95, R.y);
    vec3 env = mix(vec3(0.022, 0.023, 0.026), vec3(0.38, 0.4, 0.42), up);
    float boxA = softbox(R, normalize(vec3(-0.5, 0.8, 0.66)), 0.17, 0.08);
    float boxB = softbox(R, normalize(vec3(0.86, 0.48, 0.45)), 0.11, 0.055);
    float boxC = softbox(R, normalize(vec3(0.1, -0.35, 0.92)), 0.26, 0.13);
    vec3 envCol = env + vec3(2.6) * boxA + vec3(1.0) * boxB + vec3(0.2) * boxC;
    float fres = pow(1.0 - ndv, 5.0);
    float envI = (mix(0.16, 0.82, metal) * (0.2 + 0.8 * (1.0 - rough)) + fres * 0.3) * 0.72;
    vec3 envSpec = envCol * mix(vec3(1.0), base, metal) * envI;
    col += envSpec;

    // ambient occlusion-ish darkening in crevices (fake, normal based)
    float ao = mix(0.72, 1.0, smoothstep(-0.6, 0.9, N.y));
    col *= mix(1.0, ao, 0.35);

    // clearcoat
    if (uClear > 0.01) {
      vec3 Hc = normalize(uKeyDir + V);
      float cc = pow(max(dot(N, Hc), 0.0), mix(60.0, 8.0, rough)) * uClear * 0.5;
      col += vec3(cc);
    }

    if (uGlass == 1) {
      // lens coating: dark centre, thin-film tint toward the rim, crisp highlight
      float radial = clamp(length((vWorld.xy - uGlassCenter.xy) / max(uGlassRadius, 1.0)), 0.0, 1.0);
      float rim = smoothstep(0.05, 0.62, radial);
      vec3 tint = mix(vec3(0.006, 0.010, 0.012), vec3(0.018, 0.055, 0.062), rim);
      col = tint;
      col += vec3(0.1, 0.14, 0.13) * pow(boxA, 1.0) * 0.4;
      col += vec3(0.06, 0.11, 0.12) * pow(1.0 - ndv, 4.0);
    }
    if (uGlass == 2) {
      col += vec3(0.06, 0.07, 0.075) * (0.3 + boxA);
    }

    col *= uExposure;
    col = aces(col);
    col = pow(col, vec3(1.0 / 2.2));
    outColor = vec4(col, 1.0);
  }`;

  const DEPTH_VS = `#version 300 es
  precision highp float;
  layout(location = 0) in vec3 aPos;
  uniform mat4 uLightVP;
  void main() { gl_Position = uLightVP * vec4(aPos, 1.0); }`;
  const DEPTH_FS = `#version 300 es
  precision highp float;
  out vec4 o;
  void main() { o = vec4(1.0); }`;

  const GROUND_VS = `#version 300 es
  precision highp float;
  layout(location = 0) in vec3 aPos;
  uniform mat4 uVP;
  out vec3 vWorld;
  void main() { vWorld = aPos; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const GROUND_FS = `#version 300 es
  precision highp float;
  in vec3 vWorld;
  out vec4 outColor;
  uniform mat4 uLightVP;
  uniform sampler2D uShadow;
  uniform vec2 uShadowTexel;
  uniform vec3 uCenter;
  uniform float uRadius;
  float shadowAt(vec3 world) {
    vec4 lp = uLightVP * vec4(world, 1.0);
    vec3 p = lp.xyz / lp.w * 0.5 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 0.0;
    float bias = 0.0016;
    float sum = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        float d = texture(uShadow, p.xy + vec2(float(x), float(y)) * uShadowTexel * 1.6).r;
        sum += (p.z - bias > d) ? 1.0 : 0.0;
      }
    }
    return sum / 9.0;
  }
  void main() {
    float sh = shadowAt(vWorld);
    float d = length(vWorld.xz - uCenter.xz);
    float fade = smoothstep(uRadius * 2.2, uRadius * 0.35, d);
    float contact = exp(-(d * d) / (uRadius * uRadius * 0.55)) * 0.1;
    vec3 white = vec3(1.0);
    vec3 shade = vec3(0.36, 0.365, 0.37);
    vec3 col = mix(white, shade, sh * 0.42 * fade + contact * 0.55);
    outColor = vec4(col, 1.0);
  }`;

  const DECAL_VS = `#version 300 es
  precision highp float;
  layout(location = 0) in vec3 aPos;
  layout(location = 2) in vec2 aUV;
  uniform mat4 uVP;
  out vec2 vUV;
  void main() { vUV = aUV; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const DECAL_FS = `#version 300 es
  precision highp float;
  in vec2 vUV;
  out vec4 outColor;
  uniform sampler2D uTex;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    vec4 t = texture(uTex, vUV);
    if (t.a < 0.02) discard;
    outColor = vec4(uColor * (0.55 + 0.45 * t.a), t.a * uOpacity);
  }`;

  /* ---------------------------------------------------------
     GL renderer
     --------------------------------------------------------- */
  function createProgram(gl, vsSrc, fsSrc) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc); gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error('VS: ' + gl.getShaderInfoLog(vs));
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc); gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error('FS: ' + gl.getShaderInfoLog(fs));
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('LINK: ' + gl.getProgramInfoLog(p));
    return p;
  }

  function GLTarget(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      antialias: true, alpha: false, depth: true, stencil: false,
      preserveDrawingBuffer: true, powerPreference: 'high-performance'
    });
    if (!this.gl) throw new Error('WebGL2 unavailable');
    const gl = this.gl;
    this.program = createProgram(gl, MAIN_VS, MAIN_FS);
    this.depthProgram = createProgram(gl, DEPTH_VS, DEPTH_FS);
    this.groundProgram = createProgram(gl, GROUND_VS, GROUND_FS);
    this.decalProgram = createProgram(gl, DECAL_VS, DECAL_FS);
    this.loc = {
      main: uniformMap(gl, this.program), depth: uniformMap(gl, this.depthProgram),
      ground: uniformMap(gl, this.groundProgram), decal: uniformMap(gl, this.decalProgram)
    };
    this.textCache = new Map();
    this.buffers = new Map();
    this.shadow = null;
    this.ext = gl.getExtension('EXT_color_buffer_float');
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }
  function uniformMap(gl, program) {
    const map = {};
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(program, i);
      const name = info.name.replace(/\[0\]$/, '');
      map[name] = gl.getUniformLocation(program, info.name);
    }
    return map;
  }

  function shadowPass(gl, target, shadow, parts) {
    const size = shadow.size;
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.fbo);
    gl.viewport(0, 0, size, size);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(target.depthProgram);
    gl.uniformMatrix4fv(target.loc.depth.uLightVP, false, new Float32Array(shadow.matrix));
    for (const part of parts) {
      if (part.skipShadow) continue;
      const b = bufferFor(target, part.mesh);
      bindMesh(gl, b, target.depthProgram);
      gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0);
    }
    gl.cullFace(gl.BACK);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function disposeFrameBuffers(target) {
    if (!target.usedBuffers || !target.usedBuffers.length) return;
    const gl = target.gl;
    target.usedBuffers.forEach(b => {
      try {
        if (b.vao) gl.deleteVertexArray(b.vao);
        (b.buffers || []).forEach(buf => gl.deleteBuffer(buf));
      } catch (e) { /* ignore */ }
    });
    target.usedBuffers = [];
  }
  function bufferFor(target, mesh) {
    if (mesh.__buffer && mesh.__buffer.gl === target.gl) return mesh.__buffer;
    const gl = target.gl;
    if (!target.usedBuffers) target.usedBuffers = [];
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.pos), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const nor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.nor), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    const uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    const idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mesh.idx), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const b = { vao, count: mesh.idx.length, gl, buffers: [pos, nor, uv, idx] };
    mesh.__buffer = b;
    target.usedBuffers.push(b);
    return b;
  }
  function bindMesh(gl, b, program) {
    gl.bindVertexArray(b.vao);
    // attribute locations are fixed by declaration order in our shaders (0,1,2)
  }

  function ensureShadow(target, bounds) {
    const gl = target.gl;
    const size = Math.min(2048, Math.max(1024, Math.round(Math.max(1024, bounds.radius * 6))));
    if (target.shadow && target.shadow.size === size) return target.shadow;
    if (target.shadow) {
      gl.deleteFramebuffer(target.shadow.fbo);
      gl.deleteTexture(target.shadow.tex);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    target.shadow = { tex, fbo, size, ok: status === gl.FRAMEBUFFER_COMPLETE };
    return target.shadow;
  }

  function fitDistance(parts, center, dir, right, up2, tanH, tanV, fill) {
    let dist = 1;
    for (const part of parts) {
      const p = part.mesh.pos;
      const stride = Math.max(3, Math.floor(p.length / 3 / 700) * 3);
      for (let i = 0; i < p.length; i += stride) {
        const rx = p[i] - center[0], ry = p[i + 1] - center[1], rz = p[i + 2] - center[2];
        const x = rx * right[0] + ry * right[1] + rz * right[2];
        const y = rx * up2[0] + ry * up2[1] + rz * up2[2];
        const z = rx * dir[0] + ry * dir[1] + rz * dir[2];
        const needX = z + Math.abs(x) / (tanH * fill);
        const needY = z + Math.abs(y) / (tanV * fill);
        if (needX > dist) dist = needX;
        if (needY > dist) dist = needY;
      }
    }
    return dist * 1.02;
  }
  function viewMatrixFor(bounds, opts, parts) {
    const yaw = rad(opts.yaw == null ? -32 : opts.yaw);
    const pitch = rad(opts.pitch == null ? 11 : opts.pitch);
    const dir = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const fov = rad(opts.fov || 19);
    const aspect = opts.aspect || 1.5;
    const upHint = Math.abs(dir[1]) > 0.985 ? [0, 0, -1] : [0, 1, 0];
    const fwd = vmul(dir, -1);
    const right = vnorm(vcross(fwd, upHint));
    const up2 = vcross(right, fwd);
    const tanV = Math.tan(fov / 2), tanH = tanV * aspect;
    const fill = opts.fill || 0.86;
    let center = [bounds.center[0], bounds.center[1] + bounds.size[1] * 0.02, bounds.center[2]];
    let dist;
    if (parts && parts.length) {
      dist = fitDistance(parts, center, dir, right, up2, tanH, tanV, fill);
      // recentre the projected silhouette: fit the bounding sphere is not enough,
      // the lens and grip push the visual mass off-centre.
      for (let pass = 0; pass < 2; pass++) {
        let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        for (const part of parts) {
          const p = part.mesh.pos;
          const stride = Math.max(3, Math.floor(p.length / 3 / 700) * 3);
          for (let i = 0; i < p.length; i += stride) {
            const rx = p[i] - center[0], ry = p[i + 1] - center[1], rz = p[i + 2] - center[2];
            const x = rx * right[0] + ry * right[1] + rz * right[2];
            const y = rx * up2[0] + ry * up2[1] + rz * up2[2];
            const z = rx * dir[0] + ry * dir[1] + rz * dir[2];
            const denom = Math.max(1, dist - z);
            const nx = x / (denom * tanH), ny = y / (denom * tanV);
            if (nx < minX) minX = nx; if (nx > maxX) maxX = nx;
            if (ny < minY) minY = ny; if (ny > maxY) maxY = ny;
          }
        }
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
        if (Math.abs(cx) < 0.004 && Math.abs(cy) < 0.004) break;
        center = [
          center[0] + right[0] * cx * dist * tanH + up2[0] * cy * dist * tanV,
          center[1] + right[1] * cx * dist * tanH + up2[1] * cy * dist * tanV,
          center[2] + right[2] * cx * dist * tanH + up2[2] * cy * dist * tanV
        ];
        dist = fitDistance(parts, center, dir, right, up2, tanH, tanV, fill);
      }
    } else {
      center = bounds.center;
      dist = (bounds.radius / Math.sin(fov / 2)) * 1.12;
    }
    const eye = vadd(center, vmul(vnorm(dir), dist));
    const view = mat4LookAt(eye, center, upHint);
    const near = Math.max(1, dist - bounds.radius * 3.6);
    const far = dist + bounds.radius * 4.4;
    const proj = mat4Perspective(fov, aspect, near, far);
    return { eye, center, view, proj, vp: mat4Mul(proj, view) };
  }  function drawGround(target, groundQuad, cam, shadow, bounds) {
    const gl = target.gl;
    gl.useProgram(target.groundProgram);
    const loc = target.loc.ground;
    gl.uniformMatrix4fv(loc.uVP, false, new Float32Array(cam.vp));
    gl.uniformMatrix4fv(loc.uLightVP, false, new Float32Array(shadow.matrix));
    gl.uniform2f(loc.uShadowTexel, 1 / shadow.size, 1 / shadow.size);
    gl.uniform3f(loc.uCenter, bounds.center[0], bounds.center[1], bounds.center[2]);
    gl.uniform1f(loc.uRadius, Math.max(40, bounds.radius));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadow.tex);
    gl.uniform1i(loc.uShadow, 0);
    const b = bufferFor(target, groundQuad);
    bindMesh(gl, b, target.groundProgram);
    gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0);
  }

  function drawParts(target, parts, cam, opts) {
    const gl = target.gl;
    gl.useProgram(target.program);
    const loc = target.loc.main;
    gl.uniformMatrix4fv(loc.uVP, false, new Float32Array(cam.vp));
    gl.uniform3f(loc.uCamPos, cam.eye[0], cam.eye[1], cam.eye[2]);
    gl.uniform3f(loc.uKeyDir, -0.46, 0.84, 0.6);
    gl.uniform3f(loc.uFillDir, 0.85, 0.38, 0.55);
    gl.uniform3f(loc.uRimDir, 0.18, 0.5, -0.95);
    gl.uniform1f(loc.uExposure, opts.exposure == null ? 1.02 : opts.exposure);
    gl.uniform1i(loc.uDebug, opts.debug || 0);
    gl.uniform3f(loc.uGlassCenter, 0, 0, 0);
    gl.uniform1f(loc.uGlassRadius, 1);
    for (const part of parts) {
      const m = part.mat;
      gl.uniform3f(loc.uColor, ...hexToRgbF(m.color));
      gl.uniform1f(loc.uMetal, m.metal == null ? 0.5 : m.metal);
      gl.uniform1f(loc.uRough, m.rough == null ? 0.45 : m.rough);
      gl.uniform1f(loc.uGrain, m.grain == null ? 0.2 : m.grain);
      gl.uniform1f(loc.uClear, m.clear || 0);
      gl.uniform1f(loc.uAniso, m.aniso || 0);
      gl.uniform1i(loc.uPattern, m.pattern || 0);
      gl.uniform1f(loc.uScale, m.scale || 1);
      gl.uniform1i(loc.uGlass, m.glass || 0);
      gl.uniform3f(loc.uGlassCenter, ...(m.glassCenter || [0, 0, 0]));
      gl.uniform1f(loc.uGlassRadius, m.glassRadius || 1);
      const b = bufferFor(target, part.mesh);
      bindMesh(gl, b, target.program);
      gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0);
    }
  }

  function hexToRgbF(hex) {
    const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '808080';
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  function drawDecals(target, quads, cam) {
    const gl = target.gl;
    if (!quads.length) return;
    gl.useProgram(target.decalProgram);
    const loc = target.loc.decal;
    gl.uniformMatrix4fv(loc.uVP, false, new Float32Array(cam.vp));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    for (const q of quads) {
      const mesh = quadMesh(q.pos, q.normal, q.right, q.w, q.h);
      const tex = textTexture(gl, target.textCache, q.text + q.color + q.font, q.text, '#ffffff', q.font, q.font === 'mono' ? 2 : 4);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.uTex, 0);
      gl.uniform3f(loc.uColor, ...hexToRgbF(q.color));
      gl.uniform1f(loc.uOpacity, q.opacity);
      const b = bufferFor(target, mesh);
      bindMesh(gl, b, target.decalProgram);
      gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0);
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
  }

  function quadMesh(pos, normal, right, w, h) {
    const up = vnorm(vcross(normal, right));
    const r = vmul(vnorm(right), w / 2);
    const u = vmul(up, h / 2);
    const p = [
      vsub(vsub(pos, r), u),
      vsub(vadd(pos, r), u),
      vadd(vadd(pos, r), u),
      vadd(vsub(pos, r), u)
    ];
    const m = new Mesh();
    const a = m.pushVertex(p[0], normal, [0, 1]);
    const b = m.pushVertex(p[1], normal, [1, 1]);
    const c = m.pushVertex(p[2], normal, [1, 0]);
    const d = m.pushVertex(p[3], normal, [0, 0]);
    m.tri(a, b, c); m.tri(a, c, d);
    return m;
  }

  function groundMesh(y, size) {
    const m = new Mesh();
    const n = [0, 1, 0];
    const a = m.pushVertex([-size, y, -size], n, [0, 0]);
    const b = m.pushVertex([size, y, -size], n, [1, 0]);
    const c = m.pushVertex([size, y, size], n, [1, 1]);
    const d = m.pushVertex([-size, y, size], n, [0, 1]);
    m.tri(a, c, b); m.tri(a, d, c);
    return m;
  }

  function renderGL(canvas, design, company, options) {
    options = options || {};
    const t0 = performance.now();
    let spec, scene, decals;
    if (options.__scene) {
      scene = options.__scene;
      spec = scene.spec;
      decals = scene.decals || [];
    } else {
      spec = window.FrameArt.resolveSpec(design, company, {
        kitLens: options.kitLens || null,
        adherence: options.adherence,
        references: options.references
      });
      scene = buildScene(spec, options);
      decals = decalQuads(spec, Object.assign({ lensName: options.lensName }, options));
    }
    if (options.__noLens) { /* reserved */ }
    const dpr = options.dpr || 1;
    const cssW = options.width || canvas.clientWidth || 900;
    const cssH = options.height || canvas.clientHeight || 600;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const gl = canvas.getContext('webgl2', {
      antialias: true, alpha: false, depth: true, stencil: false,
      preserveDrawingBuffer: true, powerPreference: 'high-performance'
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    let target = canvas.__glTarget;
    if (!target || target.gl !== gl) { target = new GLTarget(canvas); canvas.__glTarget = target; }
    disposeFrameBuffers(target);
    const bounds = scene.bounds;
    if (bounds.radius <= 0) throw new Error('empty scene');
    let drawList = scene.parts;
    if (options.hideParts && options.hideParts.length) drawList = drawList.filter(p => !options.hideParts.includes(p.name));
    const shadow = ensureShadow(target, bounds);
    // light view
    const lightDir = vnorm([-0.5, 1.0, 0.62]);
    const lc = bounds.center;
    const lr = Math.max(60, bounds.radius * 1.15);
    const lightEye = vadd(lc, vmul(lightDir, lr * 3.2));
    const lightView = mat4LookAt(lightEye, lc, [0, 1, 0]);
    const lightProj = mat4Ortho(-lr, lr, -lr, lr, 0.5, lr * 7);
    shadow.matrix = mat4Mul(lightProj, lightView);
    // render shadow map
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.fbo);
    gl.viewport(0, 0, shadow.size, shadow.size);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(target.depthProgram);
    gl.uniformMatrix4fv(target.loc.depth.uLightVP, false, new Float32Array(shadow.matrix));
    for (const part of drawList) {
      if (part.mat.glass) continue;
      const b = bufferFor(target, part.mesh);
      bindMesh(gl, b, target.depthProgram);
      gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0);
    }
    gl.cullFace(gl.BACK);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // main pass
    gl.viewport(0, 0, w, h);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    const cam = viewMatrixFor(bounds, Object.assign({ aspect: w / h }, options), scene.parts);
    // ground
    const gmesh = groundMesh(bounds.min[1] - 0.6, Math.max(2600, bounds.radius * 24));
    drawGround(target, gmesh, cam, shadow, bounds);
    // parts
    drawParts(target, drawList, cam, options);
    // decals
    drawDecals(target, decals, cam);
    scene.spec = spec;
    scene.cam = cam;
    scene.stats = { ms: performance.now() - t0, tris: scene.parts.reduce((s, p) => s + p.mesh.idx.length / 3, 0) };
    return scene;
  }

  /* ---------------------------------------------------------
     Canvas2D fallback
     --------------------------------------------------------- */
  function render2D(canvas, design, company, options) {
    options = options || {};
    let spec, scene;
    if (options.__scene) { scene = options.__scene; spec = scene.spec; }
    else { spec = window.FrameArt.resolveSpec(design, company, { kitLens: options.kitLens || null, adherence: options.adherence }); scene = buildScene(spec, options); }
    const dpr = options.dpr || 1;
    const cssW = options.width || canvas.clientWidth || 900;
    const cssH = options.height || canvas.clientHeight || 600;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const bounds = scene.bounds;
    const cam = viewMatrixFor(bounds, Object.assign({ aspect: w / h }, options), scene.parts);
    const tris = [];
    scene.parts.forEach(part => {
      const m = part.mesh;
      const proj = new Array(m.pos.length / 3);
      for (let i = 0; i < m.pos.length / 3; i++) {
        proj[i] = projectPoint(cam.vp, [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]], w, h);
      }
      for (let i = 0; i < m.idx.length; i += 3) {
        const a = m.idx[i], b = m.idx[i + 1], c = m.idx[i + 2];
        const pa = proj[a], pb = proj[b], pc = proj[c];
        if (!pa || !pb || !pc) continue;
        const area = (pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y);
        if (area <= 0) continue;
        const n = [m.nor[a * 3], m.nor[a * 3 + 1], m.nor[a * 3 + 2]];
        const L = vnorm([-0.48, 0.86, 0.62]);
        const ndl = Math.max(0, vdot(n, L));
        const ambient = 0.32 + 0.16 * Math.max(0, n[1]);
        const specular = Math.pow(Math.max(0, vdot(n, vnorm([-0.2, 0.7, 0.7]))), 20) * (part.mat.metal || 0.3);
        const base = hexToRgbF(part.mat.color);
        const col = base.map(v => clamp((v * (ambient + ndl * 1.1) + specular * 0.6) * 0.95, 0, 1));
        tris.push({ z: (pa.z + pb.z + pc.z) / 3, pa, pb, pc, color: `rgb(${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(col[2] * 255)})` });
      }
    });
    tris.sort((a, b) => b.z - a.z);
    tris.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(t.pa.x, t.pa.y); ctx.lineTo(t.pb.x, t.pb.y); ctx.lineTo(t.pc.x, t.pc.y);
      ctx.closePath();
      ctx.fillStyle = t.color;
      ctx.fill();
    });
    return scene;
  }

  /* ---------------------------------------------------------
     public API
     --------------------------------------------------------- */
  const sharedCanvas = document.createElement('canvas');
  const textureCache = new Map();

  function renderToCanvas(canvas, design, company, options) {
    options = options || {};
    try {
      return renderGL(canvas, design, company, options);
    } catch (e) {
      if (!options.__silent) console.warn('[FRAME art3d] WebGL unavailable, using 2D fallback:', e.message);
      try { return render2D(canvas, design, company, options); } catch (e2) { console.error(e2); return null; }
    }
  }

  function renderDataURL(design, company, options) {
    options = options || {};
    const width = options.width || 1200;
    const height = options.height || 800;
    const dpr = options.dpr || 1;
    sharedCanvas.width = width;
    sharedCanvas.height = height;
    const scene = renderToCanvas(sharedCanvas, design, company, Object.assign({}, options, { width, height, dpr, __silent: true }));
    if (!scene) return null;
    try {
      let url = sharedCanvas.toDataURL('image/webp', options.quality || 0.94);
      if (!url || url.indexOf('data:image/webp') !== 0) url = sharedCanvas.toDataURL('image/png');
      return url;
    } catch (e) { return null; }
  }

  function exportPNG(design, company, options) {
    options = options || {};
    const width = options.width || 3840;
    const height = options.height || 2560;
    sharedCanvas.width = width;
    sharedCanvas.height = height;
    renderToCanvas(sharedCanvas, design, company, Object.assign({}, options, { width, height, dpr: 1, __silent: true }));
    return sharedCanvas.toDataURL('image/png');
  }

  let liveRaf = 0;
  const liveState = new WeakMap();
  function paint(canvas, design, company, options) {
    if (!canvas) return null;
    options = options || {};
    const dpr = Math.min(2, window.devicePixelRatio || 1) * (options.ss || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.round((rect.width || canvas.clientWidth || 720)));
    const h = Math.max(140, Math.round((rect.height || canvas.clientHeight || 480)));
    const scene = renderToCanvas(canvas, design, company, Object.assign({}, options, { width: w, height: h, dpr }));
    liveState.set(canvas, { design, company, options });
    return scene;
  }

  function schedule(canvas, design, company, options) {
    if (liveRaf) cancelAnimationFrame(liveRaf);
    liveRaf = requestAnimationFrame(() => {
      liveRaf = 0;
      paint(canvas, design, company, options);
    });
  }

  function renderLensToCanvas(canvas, design, company, options) {
    options = options || {};
    try {
      const spec = window.FrameArt.resolveLensSpec(design, company);
      const scene = buildLensScene(spec, options);
      const decalSpec = {
        decals: [], brand: spec.brand, mount: { id: spec.mount.id, x: 0, y: 0 },
        lens: { diameter: spec.diameter, length: spec.length, accent: spec.accent, name: spec.name },
        W: 0, H: 0, D: 0
      };
      scene.decals = decalQuads(decalSpec, options);
      scene.spec = spec;
      return renderGL(canvas, null, null, Object.assign({}, options, { __scene: scene }));
    } catch (e) {
      console.warn('[FRAME art3d] lens WebGL failed', e);
      try {
        const spec = window.FrameArt.resolveLensSpec(design, company);
        const scene = buildLensScene(spec, options);
        scene.spec = spec;
        return render2D(canvas, null, null, Object.assign({}, options, { __scene: scene }));
      } catch (e2) { console.error(e2); return null; }
    }
  }
  const sharedLensCanvas = document.createElement('canvas');
  function renderLensDataURL(design, company, options) {
    options = options || {};
    const width = options.width || 1200, height = options.height || 700;
    sharedLensCanvas.width = width; sharedLensCanvas.height = height;
    const scene = renderLensToCanvas(sharedLensCanvas, design, company, Object.assign({}, options, { width, height, dpr: 1, __silent: true }));
    if (!scene) return null;
    try { let url = sharedLensCanvas.toDataURL('image/webp', options.quality || 0.94); if (!url || url.indexOf('data:image/webp') !== 0) url = sharedLensCanvas.toDataURL('image/png'); return url; } catch (e) { return null; }
  }
  function paintLens(canvas, design, company, options) {
    if (!canvas) return null;
    options = options || {};
    const dpr = Math.min(2, window.devicePixelRatio || 1) * (options.ss || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.round(rect.width || canvas.clientWidth || 720));
    const h = Math.max(120, Math.round(rect.height || canvas.clientHeight || 420));
    return renderLensToCanvas(canvas, design, company, Object.assign({}, options, { width: w, height: h, dpr }));
  }

  function exportLensPNG(design, company, options) {
    options = options || {};
    const width = options.width || 3840;
    const height = options.height || 2160;
    sharedLensCanvas.width = width;
    sharedLensCanvas.height = height;
    renderLensToCanvas(sharedLensCanvas, design, company, Object.assign({}, options, { width, height, dpr: 1, __silent: true }));
    return sharedLensCanvas.toDataURL('image/png');
  }
  window.FrameArt3D = {
    version: '1.0.0',
    buildScene, buildLensScene,
    renderLensToCanvas, renderLensDataURL, paintLens, exportLensPNG,
    renderToCanvas,
    renderDataURL,
    exportPNG,
    paint,
    schedule,
    views: {
      hero: { yaw: -32, pitch: 11, fov: 19 },
      front: { yaw: 0, pitch: 3, fov: 17 },
      back: { yaw: 158, pitch: 8, fov: 18 },
      top: { yaw: -14, pitch: 62, fov: 20 },
      side: { yaw: -88, pitch: 4, fov: 17 },
      low: { yaw: -26, pitch: -5, fov: 19 }
    }
  };
})();
