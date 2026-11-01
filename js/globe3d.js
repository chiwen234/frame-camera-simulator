/* =========================================================
   FRAME — 真实 WebGL 三维地球
   球体网格 + 程序化贴图（由经纬度矢量多边形生成，无位图素材）
   光照 / 自转 / 鼠标拖动 / 滚轮缩放 / 份额标注
   ========================================================= */
(function () {
  'use strict';

  const DEG = Math.PI / 180;

  /* ---------------- 最小矩阵库 ---------------- */
  function mat4() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function perspective(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function lookAt(out, eye, center, up) {
    let z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    let len = Math.hypot(z0, z1, z2) || 1; z0 /= len; z1 /= len; z2 /= len;
    let x0 = up[1] * z2 - up[2] * z1, x1 = up[2] * z0 - up[0] * z2, x2 = up[0] * z1 - up[1] * z0;
    len = Math.hypot(x0, x1, x2) || 1; x0 /= len; x1 /= len; x2 /= len;
    const y0 = z1 * x2 - z2 * x1, y1 = z2 * x0 - z0 * x2, y2 = z0 * x1 - z1 * x0;
    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out[15] = 1;
    return out;
  }
  function multiply(out, a, b) {
    for (let i = 0; i < 4; i++) {
      const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
      out[i]      = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
      out[i + 4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
      out[i + 8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
      out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }
    return out;
  }
  function rotY(out, rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    out[0] = c; out[1] = 0; out[2] = -s; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = s; out[9] = 0; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }
  function rotX(out, rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = c; out[6] = s; out[7] = 0;
    out[8] = 0; out[9] = -s; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }
  function transformPoint(m, x, y, z) {
    return {
      x: m[0] * x + m[4] * y + m[8] * z + m[12],
      y: m[1] * x + m[5] * y + m[9] * z + m[13],
      z: m[2] * x + m[6] * y + m[10] * z + m[14],
      w: m[3] * x + m[7] * y + m[11] * z + m[15]
    };
  }

  /* ---------------- 着色器 ---------------- */
  const VS = `
  attribute vec3 aPos;
  attribute vec3 aNormal;
  attribute vec2 aUV;
  uniform mat4 uProj;
  uniform mat4 uView;
  uniform mat4 uModel;
  varying vec3 vNormal;
  varying vec2 vUV;
  varying vec3 vViewPos;
  void main() {
    vec4 world = uModel * vec4(aPos, 1.0);
    vNormal = mat3(uModel) * aNormal;
    vUV = aUV;
    vec4 viewPos = uView * world;
    vViewPos = viewPos.xyz;
    gl_Position = uProj * viewPos;
  }`;

  const FS = `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec3 uLightDir;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec2 vUV;
  varying vec3 vViewPos;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N, L), 0.0);
    // 边缘光（大气）
    vec3 V = normalize(-vViewPos);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 base = texture2D(uTex, vUV).rgb;
    vec3 col = base * (0.78 + 0.62 * diff);
    col += vec3(0.42, 0.32, 0.16) * rim * 0.55;
    col *= 0.92;
    // 夜面压暗
    col *= mix(0.55, 1.0, smoothstep(-0.35, 0.40, dot(N, L)));
    gl_FragColor = vec4(col, uOpacity);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('shader: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }

  /* ---------------- 程序化贴图 ---------------- */
  function buildTexture(game) {
    const W = 2048, H = 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const D = window.FRAME_DATA;

    // 海洋
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07121a');
    g.addColorStop(0.5, '#08161f');
    g.addColorStop(1, '#060f16');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 经纬网
    ctx.strokeStyle = 'rgba(150,190,205,0.07)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = (lon + 180) / 360 * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = (90 - lat) / 180 * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const snap = game && game.market && game.market.snapshot;
    const regs = (snap && snap.regions && snap.regions.regions) || [];
    const shareOf = (id) => {
      const r = regs.find(x => x.id === id);
      return r ? (r.playerShare || 0) : 0;
    };
    let maxShare = 1;
    regs.forEach(r => { if ((r.playerShare || 0) > maxShare) maxShare = r.playerShare; });

    const ringsOf = (geo) => {
      if (!geo || !geo.length) return [];
      const first = geo[0];
      return (Array.isArray(first) && typeof first[0] === 'number') ? [geo] : geo;
    };

    (D.REGIONS || []).forEach(region => {
      const share = shareOf(region.id);
      const t = Math.min(1, share / Math.max(1, maxShare));
      // 份额越高 → 越亮的土黄（0.35 起步保证可见）
      const u = 0.42 + t * 0.58;
      const r = Math.round(122 + u * 108);
      const gg = Math.round(128 + u * 74);
      const b = Math.round(78 + u * 24);
      ringsOf(region.geo).forEach(ring => {
        ctx.beginPath();
        ring.forEach((p, i) => {
          const x = (p[0] + 180) / 360 * W;
          const y = (90 - p[1]) / 180 * H;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(240,228,180,0.7)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      });
    });

    return cv;
  }

  /* ---------------- 球体网格 ---------------- */
  function buildSphere(latBands, lonBands) {
    const pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= latBands; i++) {
      const theta = i / latBands * Math.PI;          // 0..PI
      const st = Math.sin(theta), ct = Math.cos(theta);
      for (let j = 0; j <= lonBands; j++) {
        const phi = j / lonBands * Math.PI * 2;       // 0..2PI
        const sp = Math.sin(phi), cp = Math.cos(phi);
        const x = st * cp, y = ct, z = st * sp;
        pos.push(x, y, z);
        nor.push(x, y, z);
        // 贴图左边缘对应 180W，而球体 u=0 在经度 0，需要偏移半张图
        uv.push((j / lonBands + 0.5) % 1, i / latBands);
      }
    }
    for (let i = 0; i < latBands; i++) {
      for (let j = 0; j < lonBands; j++) {
        const a = i * (lonBands + 1) + j;
        const b = a + lonBands + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint16Array(idx) };
  }

  /* ---------------- 主对象 ---------------- */
  function createGlobe3D(canvas, overlay, game) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true })
      || canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return null;
    const isGL2 = !!(window.WebGL2RenderingContext && gl instanceof window.WebGL2RenderingContext);

    let prog, tex, mesh, vao = null;
    let W = 1, H = 1;
    let rot = 0.17, tilt = 0.38;
    let zoom = 1;
    let running = false, raf = null, last = 0;
    let drag = false, lastX = 0, lastY = 0;
    let mvp = mat4();
    let proj = mat4(), view = mat4(), model = mat4();

    function setup() {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
      gl.useProgram(prog);

      mesh = buildSphere(72, 144);

      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
      const locPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0);

      const nbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.nor, gl.STATIC_DRAW);
      const locNor = gl.getAttribLocation(prog, 'aNormal');
      gl.enableVertexAttribArray(locNor);
      gl.vertexAttribPointer(locNor, 3, gl.FLOAT, false, 0, 0);

      const ubo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, ubo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.uv, gl.STATIC_DRAW);
      const locUV = gl.getAttribLocation(prog, 'aUV');
      gl.enableVertexAttribArray(locUV);
      gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, 0, 0);

      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);

      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
    }

    // 真实地球贴图（AI 生成 4096x2048 等距圆柱投影）
    let earthImg = null, earthTried = false;
    function loadEarthTexture() {
      if (earthTried) return;
      earthTried = true;
      try {
        const img = new Image();
        img.onload = function () { earthImg = img; uploadTexture(); draw(); };
        img.onerror = function () { earthImg = null; };
        img.src = 'assets/art/earth-map.png';
      } catch (e) { earthImg = null; }
    }

    function uploadTexture() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      // 优先使用真实地球贴图；失败则回退到程序化色块
      if (earthImg) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImg);
          gl.generateMipmap(gl.TEXTURE_2D);
          return;
        } catch (err) { earthImg = null; }
      }
      const cv = buildTexture(game);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const box = canvas.getBoundingClientRect();
      W = Math.max(200, box.width || canvas.clientWidth || 600);
      H = Math.max(200, box.height || canvas.clientHeight || 600);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (overlay) {
        overlay.width = Math.floor(W * dpr);
        overlay.height = Math.floor(H * dpr);
        overlay.style.width = W + 'px';
        overlay.style.height = H + 'px';
        const octx = overlay.getContext('2d');
        if (octx) octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function drawOverlay() {
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const D = window.FRAME_DATA;
      const snap = game && game.market && game.market.snapshot;
      const regs = (snap && snap.regions && snap.regions.regions) || [];
      const ringsOf = (geo) => {
        if (!geo || !geo.length) return [];
        const first = geo[0];
        return (Array.isArray(first) && typeof first[0] === 'number') ? [geo] : geo;
      };

      const used = [];
      const overlaps = (x, y, w, h) => used.some(r => !(x + w < r.x || x > r.x + r.w || y + h < r.y || y > r.y + r.h));

      (D.REGIONS || []).forEach((region, idx) => {
        // 区域质心（取最长环的平均经纬）
        const rings = ringsOf(region.geo);
        if (!rings.length) return;
        const ring = rings.slice().sort((a, b) => b.length - a.length)[0];
        let lon = 0, lat = 0;
        ring.forEach(p => { lon += p[0]; lat += p[1]; });
        lon /= ring.length; lat /= ring.length;

        const la = lat * DEG, lo = lon * DEG;
        const x = Math.cos(la) * Math.cos(lo);
        const y = Math.sin(la);
        const z = Math.cos(la) * Math.sin(lo);
        const p = transformPoint(mvp, x, y, z);
        if (p.w <= 0) return;
        const sx = (p.x / p.w * 0.5 + 0.5) * W;
        const sy = (1 - (p.y / p.w * 0.5 + 0.5)) * H;
        // 背面剔除（用视空间 z 粗判）
        const worldZ = transformPoint(model, x, y, z);
        const viewP = transformPoint(view, worldZ.x, worldZ.y, worldZ.z);
        if (worldZ.z <= 0.02) return;   // 只画面向摄像机的半球

        const rr = regs.find(q => q.id === region.id);
        const share = rr ? (rr.playerShare || 0) : 0;
        const lead = rr ? (rr.leaderName || '') : '';

        // 候选位置：右上下、右下、左上下、左下、正上、正下，逐个检测是否重叠
        const lw = 96, lh = 26;
        const cands = [
          [sx + 12, sy - 36], [sx + 12, sy + 10],
          [sx - lw - 12, sy - 36], [sx - lw - 12, sy + 10],
          [sx - lw / 2, sy - 46], [sx - lw / 2, sy + 20]
        ];
        let lx = cands[0][0], ly = cands[0][1], anchorX = sx + 12, anchorY = sy - 10;
        for (let ci = 0; ci < cands.length; ci++) {
          const cx2 = cands[ci][0], cy2 = cands[ci][1];
          if (!overlaps(cx2 - 2, cy2 - 2, lw + 4, lh + 4)) {
            lx = cx2; ly = cy2;
            anchorX = sx + (cx2 > sx ? 12 : -12);
            anchorY = sy + (cy2 > sy ? 10 : -10);
            break;
          }
        }

        // 引线
        ctx.save();
        ctx.strokeStyle = 'rgba(216,166,90,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(anchorX, anchorY);
        ctx.lineTo(lx + (lx > sx ? 0 : lw), ly + lh / 2);
        ctx.stroke();
        ctx.restore();

        used.push({ x: lx - 2, y: ly - 2, w: lw + 4, h: lh + 4 });
        ctx.fillStyle = 'rgba(12,11,9,0.86)';
        ctx.fillRect(lx, ly, lw, lh);
        ctx.strokeStyle = 'rgba(216,166,90,0.55)';
        ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
        ctx.fillStyle = '#e8e0cc';
        ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(region.short || region.name, lx + 6, ly + 11);
        ctx.fillStyle = '#d8a65a';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(share.toFixed(1) + '%', lx + 6, ly + 22);
        ctx.fillStyle = 'rgba(180,170,150,0.75)';
        ctx.font = '9px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(lead).slice(0, 4), lx + 50, ly + 22);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#d8a65a';
        ctx.fill();
      });
    }

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const aspect = W / H;
      perspective(proj, 38 * DEG, aspect, 0.1, 100);

      const dist = 3.05 / zoom;
      lookAt(view, [0, 0, dist], [0, 0, 0], [0, 1, 0]);

      const ry = mat4(), rx = mat4();
      rotY(ry, rot);
      rotX(rx, -tilt);
      multiply(model, rx, ry);

      multiply(mvp, proj, view);
      const tmp = mat4();
      multiply(tmp, mvp, model);
      mvp = tmp;

      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProj'), false, proj);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, view);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uModel'), false, model);
      gl.uniform3f(gl.getUniformLocation(prog, 'uLightDir'), -0.55, 0.65, 0.55);
      gl.uniform1f(gl.getUniformLocation(prog, 'uOpacity'), 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawElements(gl.TRIANGLES, mesh.idx.length, gl.UNSIGNED_SHORT, 0);

      drawOverlay();
    }

    function loop(t) {
      if (!running) return;
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      if (!drag) rot += dt * 0.000045;
      draw();
      raf = requestAnimationFrame(loop);
    }

    return {
      init: function () {
        setup();
        loadEarthTexture();
        uploadTexture();
        resize();
        draw();
      },
      start: function () {
        if (!prog) this.init();
        resize();
        running = true; last = 0;
        raf = requestAnimationFrame(loop);
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      refresh: function () { uploadTexture(); draw(); },
      resize: function () { resize(); draw(); },
      setGame: function (g) { game = g; uploadTexture(); draw(); },
      zoomBy: function (d) { zoom = Math.max(0.6, Math.min(3.2, zoom * d)); draw(); },
      dragStart: function (x, y) { drag = true; lastX = x; lastY = y; },
      dragMove: function (x, y) {
        if (!drag) return;
        rot += (x - lastX) * 0.007;
        tilt = Math.max(-1.1, Math.min(1.1, tilt + (y - lastY) * 0.006));
        lastX = x; lastY = y;
        draw();
      },
      dragEnd: function () { drag = false; },
      spin: function (d) { rot += d; draw(); }
    };
  }

  window.FrameGlobe3D = { createGlobe3D };
})();
