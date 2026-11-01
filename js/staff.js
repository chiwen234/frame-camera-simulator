/* =========================================================
   FRAME — 员工系统
   五个部门：研发 / 生产 / 品控 / 营销 / 行政
   人数 × 士气 → 效率乘数；扩招 / 裁员 / 调薪 / 培训
   ========================================================= */
(function () {
  'use strict';

  const DEPTS = [
    { id: 'rnd', name: '研发部', base: 420, avg: 3.0, role: '研发速度 / 芯片进度', icon: 'flask' },
    { id: 'prod', name: '生产部', base: 1200, avg: 2.0, role: '月产能 / 单位成本', icon: 'factory' },
    { id: 'qc', name: '品控部', base: 180, avg: 3.0, role: '品控分 / 退货率', icon: 'shield' },
    { id: 'mkt', name: '营销部', base: 260, avg: 3.0, role: '认知增长 / 发布会声量', icon: 'market' },
    { id: 'admin', name: '行政部', base: 140, avg: 3.0, role: '管理效率', icon: 'doc' }
  ];

  const SCALE = { sony: 1.35, canon: 1.30, nikon: 1.00, fujifilm: 0.95, panasonic: 1.10, dji: 0.85, insta360: 0.45, startup: 0.12 };

  function ensure(game) {
    if (!game.staff) {
      const k = SCALE[game.company.id] || 1;
      game.staff = {};
      DEPTS.forEach(function (d) {
        game.staff[d.id] = {
          head: Math.max(6, Math.round(d.base * k)),
          morale: 62 + Math.round(Math.random() * 10),
          avg: d.avg
        };
      });
    }
    return game.staff;
  }

  function total(game) {
    const s = ensure(game);
    let head = 0, bill = 0;
    DEPTS.forEach(function (d) {
      const x = s[d.id];
      head += x.head;
      bill += x.head * x.avg * 1e4;
    });
    return { head: head, bill: bill };
  }

  function moraleAvg(game) {
    const s = ensure(game);
    let sum = 0;
    DEPTS.forEach(function (d) { sum += s[d.id].morale; });
    return sum / DEPTS.length;
  }

  function effMul(game) {
    const m = moraleAvg(game);
    if (m >= 88) return 1.15;
    if (m >= 70) return 1.00;
    if (m >= 55) return 0.92;
    if (m >= 40) return 0.82;
    return 0.62;
  }

  function mods(game) {
    const s = ensure(game);
    const e = effMul(game);
    return {
      eff: e,
      rnd: 0.6 + 0.8 * (s.rnd.head / DEPTS[0].base) * e,
      capacity: s.prod.head * 26 * e,
      qc: 0.7 + 0.5 * (s.qc.head / DEPTS[2].base) * e,
      awareness: 0.5 + 0.9 * (s.mkt.head / DEPTS[3].base) * e,
      admin: Math.min(1.15, 0.55 + 0.6 * (s.admin.head / DEPTS[4].base) * e)
    };
  }

  function act(game, deptId, action) {
    const s = ensure(game);
    const d = s[deptId];
    if (!d) return { ok: false, error: '没有这个部门' };
    const bill = game.staff ? total(game).bill : 0;

    if (action === 'hire') {
      const add = Math.max(1, Math.round(d.head * 0.1));
      const fee = add * d.avg * 1e4 * 2;
      if ((game.company.cash || 0) < fee) return { ok: false, error: '招聘费不够' };
      game.company.cash -= fee;
      d.head += add;
      d.morale = Math.min(100, d.morale + 2);
      return { ok: true, delta: add, fee: fee };
    }
    if (action === 'layoff') {
      const cut = Math.max(1, Math.round(d.head * 0.1));
      if (d.head - cut < 4) return { ok: false, error: '不能再裁了' };
      const fee = cut * d.avg * 1e4 * 1.5;
      game.company.cash -= fee;
      d.head -= cut;
      d.morale = Math.max(0, d.morale - 12);
      DEPTS.forEach(function (o) {
        if (o.id !== deptId) s[o.id].morale = Math.max(0, s[o.id].morale - 3);
      });
      return { ok: true, delta: -cut, fee: fee };
    }
    if (action === 'raise') {
      d.avg = Number((d.avg * 1.05).toFixed(3));
      d.morale = Math.min(100, d.morale + 10);
      return { ok: true };
    }
    if (action === 'train') {
      const fee = d.head * d.avg * 1e4;
      if ((game.company.cash || 0) < fee) return { ok: false, error: '培训费不够' };
      game.company.cash -= fee;
      d.morale = Math.min(100, d.morale + 6);
      return { ok: true, fee: fee };
    }
    return { ok: false, error: '未知操作' };
  }

  function monthly(game) {
    const s = ensure(game);
    const t = total(game);
    game.company.cash -= t.bill;
    // 士气自然回落 / 亏损打击
    const losing = (game.company.cash || 0) < 0;
    DEPTS.forEach(function (d) {
      const x = s[d.id];
      let drift = losing ? -2 : 0.4;
      x.morale = Math.max(0, Math.min(100, x.morale + drift));
    });
    return t.bill;
  }

  window.FRAME_STAFF = {
    DEPTS: DEPTS, ensure: ensure, total: total, mods: mods, act: act, monthly: monthly,
    moraleAvg: moraleAvg, effMul: effMul
  };
})();
