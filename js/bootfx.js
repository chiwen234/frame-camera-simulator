/* =========================================================
   FRAME — 开机与加载动画
   BootFX.intro()   启动时的自检式开场（约 3.4s，可点击跳过）
   BootFX.loading(name, done)  选完公司进入游戏前的加载
   ========================================================= */
(function () {
  'use strict';

  const CSS = `
.bxfx{position:fixed;inset:0;z-index:9999;background:#050605;overflow:hidden;
  font-family:"Segoe UI",system-ui,sans-serif;color:#d8a65a;letter-spacing:.16em}
.bxfx *{box-sizing:border-box}
.bxfx-scan{position:absolute;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(216,166,90,.85),transparent);
  box-shadow:0 0 18px rgba(216,166,90,.6);animation:bxfxScan 2.4s linear infinite;opacity:.7}
@keyframes bxfxScan{0%{top:-2px}100%{top:100%}}
.bxfx-grid{position:absolute;inset:0;opacity:.16;
  background:repeating-linear-gradient(0deg,rgba(216,166,90,.25) 0 1px,transparent 1px 3px)}
.bxfx-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 38%,rgba(0,0,0,.92) 100%)}
.bxfx-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:min(560px,84vw);text-align:center}
.bxfx-badge{width:104px;height:104px;margin:0 auto 26px;position:relative}
.bxfx-badge svg{width:100%;height:100%;display:block}
.bxfx-badge .ring{stroke:#d8a65a;stroke-width:2;fill:none;stroke-dasharray:200;stroke-dashoffset:200;
  animation:bxfxDraw 1.1s cubic-bezier(.2,.8,.2,1) forwards}
.bxfx-badge .ring2{stroke:rgba(216,166,90,.45);stroke-width:1;fill:none;stroke-dasharray:300;stroke-dashoffset:300;
  animation:bxfxDraw 1.5s .18s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes bxfxDraw{to{stroke-dashoffset:0}}
.bxfx-title{font-size:15px;letter-spacing:.62em;color:#efe6d2;opacity:0;
  animation:bxfxIn .8s .55s forwards}
.bxfx-sub{margin-top:9px;font-size:8.5px;letter-spacing:.42em;color:#7d7466;opacity:0;
  animation:bxfxIn .8s .85s forwards}
@keyframes bxfxIn{to{opacity:1}}
.bxfx-log{margin-top:26px;text-align:left;font-size:9.5px;line-height:1.95;color:#8a8266;
  min-height:96px;border-left:1px solid rgba(216,166,90,.28);padding-left:14px}
.bxfx-log b{color:#d8a65a;font-weight:400}
.bxfx-log .ok{color:#7fb069}
.bxfx-bar{margin-top:20px;height:2px;background:rgba(216,166,90,.14);overflow:hidden}
.bxfx-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8a6b34,#d8a65a);
  box-shadow:0 0 12px rgba(216,166,90,.7);transition:width .18s linear}
.bxfx-pct{margin-top:8px;display:flex;justify-content:space-between;font-size:8.5px;color:#6f6759}
.bxfx-skip{display:none}
.bxfx-empire{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.94);
  text-align:center;opacity:0;pointer-events:none;
  transition:opacity 1.1s ease, transform 1.1s cubic-bezier(.2,.8,.2,1)}
.bxfx-empire.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.bxfx-empire h2{margin:0;font-size:clamp(46px,6.4vw,92px);letter-spacing:.30em;text-indent:.30em;
  color:#f4f1e6;font-weight:600;line-height:1.1;
  text-shadow:0 0 42px rgba(216,166,90,.45)}
.bxfx-empire h2 em{font-style:normal;color:#d8a65a}
.bxfx-empire p{margin:18px 0 0;font-size:10px;letter-spacing:.72em;text-indent:.72em;color:#8a7f6a}
.bxfx-empire .line{width:min(520px,64vw);height:1px;margin:22px auto 0;
  background:linear-gradient(90deg,transparent,rgba(216,166,90,.65),transparent)}
.bxfx-skipbtn{position:absolute;right:26px;top:24px;display:flex;align-items:center;gap:9px;
  padding:9px 16px;border:1px solid rgba(216,166,90,.34);border-radius:999px;cursor:pointer;
  background:rgba(255,255,255,.05);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  color:#d8a65a;font-size:10px;letter-spacing:.28em;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 8px 22px rgba(0,0,0,.45);
  opacity:0;animation:bxfxIn .6s .9s forwards;transition:transform .16s ease,background .16s ease,border-color .16s ease}
.bxfx-skipbtn:hover{transform:translateY(-1px);background:rgba(216,166,90,.14);border-color:rgba(216,166,90,.62)}
.bxfx-skipbtn:active{transform:scale(.97)}
.bxfx-skipbtn i{display:block;width:0;height:0;border-left:6px solid #d8a65a;border-top:4px solid transparent;border-bottom:4px solid transparent}
.bxfx-hint{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);
  font-size:9px;letter-spacing:.42em;color:#6f6759;opacity:0;animation:bxfxIn .8s 6s forwards}
.bxfx-hint b{color:#d8a65a;font-weight:400}
.bxfx-reticle{position:absolute;left:50%;top:50%;width:340px;height:340px;margin:-170px 0 0 -170px;
  pointer-events:none;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.bxfx-out{animation:bxfxOut .5s forwards}
@keyframes bxfxOut{to{opacity:0;visibility:hidden}}
.bxfx-flick{animation:bxfxFlick .12s steps(2) 3}
@keyframes bxfxFlick{50%{opacity:.55}}
`;

  function injectCSS() {
    if (document.getElementById('bxfx-css')) return;
    const st = document.createElement('style');
    st.id = 'bxfx-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function badge() {
    return '<svg viewBox="0 0 100 100"><circle class="ring" cx="50" cy="50" r="31.8"/>' +
      '<circle class="ring2" cx="50" cy="50" r="46"/>' +
      '<circle cx="50" cy="50" r="7" fill="none" stroke="#d8a65a" stroke-width="1.6"/>' +
      '<path d="M50 8v10M50 82v10M8 50h10M82 50h10" stroke="#d8a65a" stroke-width="1.4"/></svg>';
  }

  function intro(onDone) {
    injectCSS();
    const root = document.createElement('div');
    root.className = 'bxfx';
    root.innerHTML =
      '<div class="bxfx-vig"></div><div class="bxfx-grid"></div><div class="bxfx-scan"></div>' +
      '<div class="bxfx-core">' +
        '<div class="bxfx-badge">' + badge() + '</div>' +
        '<div class="bxfx-title">F R A M E</div>' +
        '<div class="bxfx-sub">CAMERA EMPIRE / SYSTEM 2026</div>' +
        '<div class="bxfx-log" id="bxfx-log"></div>' +
        '<div class="bxfx-bar"><i id="bxfx-fill"></i></div>' +
        '<div class="bxfx-pct"><span id="bxfx-stage">SELF TEST</span><span id="bxfx-num">0%</span></div>' +
      '</div>' +
      '<div class="bxfx-reticle" id="bxfx-ret"><svg viewBox="0 0 340 340">' +
        '<circle cx="170" cy="170" r="150" fill="none" stroke="rgba(216,166,90,.10)" stroke-width="1"/>' +
        '<circle cx="170" cy="170" r="118" fill="none" stroke="rgba(216,166,90,.07)" stroke-width="1" stroke-dasharray="3 7"/>' +
        '<path d="M170 8v26M170 306v26M8 170h26M306 170h26" stroke="rgba(216,166,90,.22)" stroke-width="1"/>' +
        '<path d="M52 52l16 16M288 52l-16 16M52 288l16-16M288 288l-16-16" stroke="rgba(216,166,90,.18)" stroke-width="1"/>' +
      '</svg></div>' +
      '<button class="bxfx-skipbtn" id="bxfx-skipbtn"><i></i>跳过 SKIP</button>' +
      '<div class="bxfx-empire" id="bxfx-empire">' +
        '<h2>相机<em>帝国</em></h2>' +
        '<div class="line"></div>' +
        '<p>C A M E R A   E M P I R E</p>' +
      '</div>' +
      '<div class="bxfx-hint">按 <b>任意键</b> 或点击 <b>跳过</b> 直接进入系统</div>';
    document.body.appendChild(root);

    const logEl = root.querySelector('#bxfx-log');
    const fill = root.querySelector('#bxfx-fill');
    const num = root.querySelector('#bxfx-num');
    const stage = root.querySelector('#bxfx-stage');

    const lines = [
      ['OPTICAL BENCH', 'CALIBRATED'],
      ['SENSOR ARRAY', 'ONLINE'],
      ['MOUNT PROTOCOL', 'HANDSHAKE'],
      ['SUPPLY CHAIN LINK', 'SYNCED'],
      ['MARKET FEED', 'LIVE'],
      ['DECISION CORE', 'READY']
    ];

    let i = 0, pct = 0, done = false;
    function finish() {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMove);
      root.classList.add('bxfx-out');
      setTimeout(function () { try { root.remove(); } catch (e) {} }, 520);
      if (typeof onDone === 'function') onDone();
    }

    // 跳过按钮
    const skipBtn = root.querySelector('#bxfx-skipbtn');
    if (skipBtn) skipBtn.addEventListener('click', function (ev) { ev.stopPropagation(); finish(); });

    // 键盘：任意键跳过，空格加速
    function onKey(ev) {
      if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'Escape') { finish(); return; }
      finish();
    }
    window.addEventListener('keydown', onKey);

    // 点击背景也能跳过
    root.addEventListener('click', function (ev) {
      if (ev.target.closest('.bxfx-skipbtn')) return;
      finish();
    });

    // 鼠标视差：准星随指针轻微偏移，增强"可交互"感
    const ret = root.querySelector('#bxfx-ret');
    function onMove(ev) {
      if (!ret) return;
      const dx = (ev.clientX / window.innerWidth - 0.5) * 18;
      const dy = (ev.clientY / window.innerHeight - 0.5) * 18;
      ret.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    }
    window.addEventListener('mousemove', onMove);

    const tick = setInterval(function () {
      pct = Math.min(100, pct + 5 + Math.random() * 6);
      fill.style.width = pct + '%';
      num.textContent = Math.round(pct) + '%';
      if (pct >= 100) {
        clearInterval(tick);
        stage.textContent = 'SYSTEM READY';
        // 结尾大字：直接建 DOM + 内联样式，避免选择器/层叠问题
        (function () {
          var old = root.querySelector('#bxfx-empire-inline');
          if (old) return;
          var wrap = document.createElement('div');
          wrap.id = 'bxfx-empire-inline';
          wrap.style.cssText = 'position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);' +
            'text-align:center;z-index:20;opacity:0;transition:opacity 1s ease';
          wrap.innerHTML =
            '<div style="font-size:clamp(46px,6.4vw,92px);letter-spacing:.30em;text-indent:.30em;' +
            'color:#f2efe4;font-weight:600;line-height:1.1;text-shadow:0 0 46px rgba(216,166,90,.5)">' +
            '相机<span style="color:#d8a65a">帝国</span></div>' +
            '<div style="width:min(520px,64vw);height:1px;margin:24px auto 0;' +
            'background:linear-gradient(90deg,transparent,rgba(216,166,90,.7),transparent)"></div>' +
            '<div style="margin-top:18px;font-size:10px;letter-spacing:.72em;text-indent:.72em;color:#8a7f6a">' +
            'C A M E R A &nbsp; E M P I R E</div>';
          root.appendChild(wrap);
          wrap.style.opacity = '1'; wrap.style.transition = 'none';
        })();
        setTimeout(finish, 2600);
      }
    }, 560);

    const logTick = setInterval(function () {
      if (i >= lines.length) { clearInterval(logTick); return; }
      const l = lines[i++];
      const row = document.createElement('div');
      row.innerHTML = '<b>' + l[0] + '</b> ' + '.'.repeat(Math.max(2, 22 - l[0].length)) +
        ' <span class="ok">[' + l[1] + ']</span>';
      row.style.animation = 'bxfxIn .3s forwards';
      row.style.opacity = '0';
      logEl.appendChild(row);
    }, 1250);

    setTimeout(finish, 10000);
  }

  function loading(label, onDone) {
    injectCSS();
    const root = document.createElement('div');
    root.className = 'bxfx';
    root.innerHTML =
      '<div class="bxfx-vig"></div><div class="bxfx-grid"></div><div class="bxfx-scan"></div>' +
      '<div class="bxfx-core">' +
        '<div class="bxfx-badge">' + badge() + '</div>' +
        '<div class="bxfx-title" style="animation-delay:.1s">' + (label || '') + '</div>' +
        '<div class="bxfx-sub" style="animation-delay:.25s">INITIALIZING COMPANY</div>' +
        '<div class="bxfx-bar" style="margin-top:30px"><i id="bxfx-fill2"></i></div>' +
        '<div class="bxfx-pct"><span id="bxfx-stage2">LOADING</span><span id="bxfx-num2">0%</span></div>' +
      '</div>';
    document.body.appendChild(root);

    const fill = root.querySelector('#bxfx-fill2');
    const num = root.querySelector('#bxfx-num2');
    const stage = root.querySelector('#bxfx-stage2');
    const steps = ['LOADING ASSETS', 'BUILDING MARKET', 'SYNCING RIVALS', 'READY'];
    let pct = 0, si = 0, finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      root.classList.add('bxfx-out');
      setTimeout(function () { try { root.remove(); } catch (e) {} }, 480);
      if (typeof onDone === 'function') onDone();
    }

    const t = setInterval(function () {
      pct = Math.min(100, pct + 9 + Math.random() * 8);
      fill.style.width = pct + '%';
      num.textContent = Math.round(pct) + '%';
      const idx = Math.min(steps.length - 1, Math.floor(pct / 26));
      if (idx !== si) { si = idx; stage.textContent = steps[si]; }
      if (pct >= 100) { clearInterval(t); stage.textContent = 'READY'; setTimeout(finish, 300); }
    }, 110);

    setTimeout(finish, 3000);
  }

  window.BootFX = { intro: intro, loading: loading };
})();
