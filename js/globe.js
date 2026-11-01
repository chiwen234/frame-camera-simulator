/* =========================================================
   FRAME — 三维地球（Canvas 2D 正交投影，无第三方依赖）
   大陆轮廓复用 data.js 的 REGIONS[].geo（经纬度多边形）
   球面上标出各区域的市场份额
   ========================================================= */
(function () {
  'use strict';

  const DEG = Math.PI / 180;

  function createGlobe(canvas, game) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, R = 0, cx = 0, cy = 0;
    let rot = 0, tilt = 18 * DEG;
    let raf = null, last = 0, running = false;
    let hoverRegion = null;
    let landCache = null;

    const D = window.FRAME_DATA;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const box = canvas.getBoundingClientRect();
      W = Math.max(240, box.width || canvas.clientWidth || 480);
      H = Math.max(240, box.height || canvas.clientHeight || 480);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.42;
      cx = W / 2;
      cy = H / 2;
    }

    // 经纬度 -> 正交投影后的屏幕坐标与深度
    function project(lon, lat) {
      const la = lat * DEG;
      const lo = lon * DEG + rot;
      const x0 = Math.cos(la) * Math.sin(lo);
      const y0 = Math.sin(la);
      const z0 = Math.cos(la) * Math.cos(lo);
      // 绕 X 轴倾斜
      const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      return { x: cx + R * x0, y: cy - R * y1, z: z1 };
    }

    function ringsOf(geo) {
      if (!geo || !geo.length) return [];
      const first = geo[0];
      const isRing = Array.isArray(first) && typeof first[0] === 'number';
      return isRing ? [geo] : geo;
    }

    // 画一个经纬环（自动在球体边缘裁剪）
    function drawRing(ring, fillStyle, strokeStyle, lineWidth) {
      const pts = ring.map(p => project(p[0], p[1]));
      // 找出可见段
      const segs = [];
      let cur = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.z > 0) {
          cur.push(p);
        } else {
          if (cur.length > 1) segs.push(cur);
          cur = [];
        }
      }
      if (cur.length > 1) segs.push(cur);
      if (!segs.length) return;
      segs.forEach(seg => {
        ctx.beginPath();
        seg.forEach((p, i) => { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
      });
    }

    function playerShareIn(regions, id) {
      const r = (regions || []).find(x => x.id === id);
      return r ? r.playerShare : 0;
    }

    function fillFor(share, maxShare) {
      const t = maxShare > 0 ? Math.max(0, Math.min(1, share / maxShare)) : 0;
      // 低份额偏暗红，高份额偏黄绿
      const r = Math.round(70 + t * 70);
      const g = Math.round(52 + t * 92);
      const b = Math.round(44 + t * 30);
      return 'rgba(' + r + ',' + g + ',' + b + ',0.82)';
    }

    function draw() {
      if (!game || !D) return;
      const snap = game.market && game.market.snapshot;
      const regions = (snap && snap.regions && snap.regions.regions) || [];
      const maxShare = Math.max.apply(null, (regions.length ? regions.map(r => r.playerShare) : [1]).concat([1]));

      ctx.clearRect(0, 0, W, H);

      // 背景球体（暗面）
      const bg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      bg.addColorStop(0, '#1d1a14');
      bg.addColorStop(0.72, '#12100c');
      bg.addColorStop(1, '#0a0908');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // 经纬网
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(200,180,140,0.06)';
      ctx.lineWidth = 1;
      for (let lon = -180; lon < 180; lon += 30) {
        const ring = [];
        for (let lat = -80; lat <= 80; lat += 5) ring.push([lon, lat]);
        drawRing(ring, null, 'rgba(200,180,140,0.06)', 1);
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const ring = [];
        for (let lon = -180; lon <= 180; lon += 5) ring.push([lon, lat]);
        drawRing(ring, null, lat === 0 ? 'rgba(216,166,90,0.14)' : 'rgba(200,180,140,0.05)', lat === 0 ? 1.2 : 1);
      }

      // 大陆
      (D.REGIONS || []).forEach(region => {
        const share = playerShareIn(regions, region.id);
        const rings = ringsOf(region.geo);
        const isHover = hoverRegion === region.id;
        const fill = fillFor(share, maxShare);
        rings.forEach(ring => {
          drawRing(ring, fill, isHover ? 'rgba(240,225,180,0.85)' : 'rgba(120,104,78,0.55)', isHover ? 1.6 : 1);
        });
      });
      ctx.restore();

      // 球体边缘
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(216,166,90,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 份额标记（按索引错位，避免互相压住）
      (D.REGIONS || []).forEach(function (region, idx) {
        const rings = ringsOf(region.geo);
        if (!rings.length) return;
        const ring = rings.slice().sort(function (a, b) { return b.length - a.length; })[0];
        let sx = 0, sy = 0, n = 0;
        ring.forEach(function (p) { const q = project(p[0], p[1]); if (q.z > 0) { sx += q.x; sy += q.y; n++; } });
        if (!n) return;
        const px = sx / n, py = sy / n;
        const share = playerShareIn(regions, region.id);
        const rr = (regions || []).find(function (x) { return x.id === region.id; });
        const lead = rr ? rr.leaderName : '';

        // 交替上下偏移，减少重叠
        const up = (idx % 2 === 0);
        const dx = 16, dy = up ? -26 : 16;

        ctx.save();
        ctx.strokeStyle = 'rgba(216,166,90,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 10, py + dy * 0.5);
        ctx.lineTo(px + dx, py + dy);
        ctx.stroke();

        const labelW = 100, labelH = 28;
        const lx = px + dx, ly = py + dy - (up ? labelH : 0);
        ctx.fillStyle = 'rgba(14,12,9,0.9)';
        ctx.fillRect(lx, ly, labelW, labelH);
        ctx.strokeStyle = 'rgba(216,166,90,0.55)';
        ctx.strokeRect(lx + 0.5, ly + 0.5, labelW - 1, labelH - 1);

        ctx.fillStyle = '#e8e0cc';
        ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(region.short || region.name, lx + 6, ly + 12);
        ctx.fillStyle = '#d8a65a';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(share.toFixed(1) + '%', lx + 6, ly + 23);
        ctx.fillStyle = 'rgba(180,170,150,0.75)';
        ctx.font = '9px "Segoe UI", system-ui, sans-serif';
        ctx.fillText((lead || '').slice(0, 4), lx + 52, ly + 23);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#d8a65a';
        ctx.fill();
      });
    }

    function loop(t) {
      if (!running) return;
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      rot += dt * 0.00006; // 缓慢自转
      draw();
      raf = requestAnimationFrame(loop);
    }

    return {
      start: function () {
        resize();
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      resize: resize,
      redraw: draw,
      setGame: function (g) { game = g; draw(); },
      spin: function (delta) { rot += delta; draw(); }
    };
  }

  window.FrameGlobe = { createGlobe };
})();
