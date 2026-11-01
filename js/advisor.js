/* =========================================================
   FRAME — 顾问系统
   三槽：科技 / 财政 / 外交。同槽多人可选，换人有冷却。
   ========================================================= */
(function () {
  'use strict';

  const A = [
    /* ---------- 科技 ---------- */
    { id: 'reyes', name: '玛尔塔·雷耶斯', slot: 'tech', tier: 3, photo: 'char-reyes',
      salary: 0.55, sign: 5.5, desc: '尼康 CTO，光学与传感器双料权威。',
      eff: { rnd: 0.15, chip: 0.20, speed: 0.35 }, trait: '唯技术论', traitDesc: '研发 +15%，但对营销类决策无加成。' },
    { id: 'otteri', name: '御手洗隆', slot: 'tech', tier: 3, photo: 'char-otteri',
      salary: 0.52, sign: 5.2, desc: '索尼半导体社长，握过全世界的传感器供应。',
      eff: { rnd: 0.10, sensorCost: -0.10, speed: 0.30 }, trait: '铁腕', traitDesc: '对手好感 −0.3/月。' },
    { id: 'miyamoto', name: '宫本静', slot: 'tech', tier: 2, photo: 'char-miyamoto',
      salary: 0.28, sign: 2.8, desc: '富士色彩科学总监，相信颜色比参数重要。',
      eff: { rnd: 0.08, rep: 0.8, speed: 0.30 }, trait: '审美偏执', traitDesc: '口碑每月 +0.08。' },

    /* ---------- 财政 ---------- */
    { id: 'takahashi', name: '高桥修', slot: 'finance', tier: 3, photo: 'char-takahashi',
      salary: 0.55, sign: 5.5, desc: '松下经营企划出身，擅长把亏损部门做成盈利。',
      eff: { cost: -0.08, cashEvent: 0.30, speed: 0.35 }, trait: '成本杀手', traitDesc: '全局成本 −8%。' },
    { id: 'fujiwara', name: '藤原修一', slot: 'finance', tier: 2, photo: 'char-fujiwara',
      salary: 0.26, sign: 2.6, desc: '尼康光学老臣，看着这家公司长大。',
      eff: { cost: -0.05, salary: -0.08, speed: 0.25 }, trait: '老臣', traitDesc: '月薪 −8%，但不可解雇。' },
    { id: 'morita', name: '森田和臣', slot: 'finance', tier: 2, photo: 'char-miyamoto',
      salary: 0.30, sign: 3.0, desc: '三井住友银行出身的财务官僚。',
      eff: { cost: -0.04, cashEvent: 0.18, speed: 0.22 }, trait: ' banker', traitDesc: '融资与现金类事件收益 +18%。' },
    { id: 'nakamura', name: '中村理纱', slot: 'finance', tier: 1, photo: 'char-otteri',
      salary: 0.12, sign: 1.2, desc: '年轻的财务分析师，便宜、拼、缺经验。',
      eff: { cost: -0.03, salary: -0.05, speed: 0.15 }, trait: '性价比', traitDesc: '薪资低，效果也低。' },

    /* ---------- 外交 ---------- */
    { id: 'tsuchiya', name: '土屋千鹤', slot: 'diplo', tier: 3, photo: 'char-tsuchiya',
      salary: 0.55, sign: 5.5, desc: '佳能渠道部长，认识行业里每一个经销商。',
      eff: { rel: 1.0, diploRate: 0.22, cutLoss: -0.28, speed: 0.35 }, trait: '人脉王', traitDesc: '关系自然回升 +1.0/月。' },
    { id: 'chen', name: '陈哲', slot: 'diplo', tier: 2, photo: 'char-chen',
      salary: 0.28, sign: 2.8, desc: '大疆影像负责人，擅长把敌人变成生态伙伴。',
      eff: { rel: 0.6, diploRate: 0.15, allyGain: 0.20, speed: 0.28 }, trait: '联盟派', traitDesc: '结盟收益 +20%。' },
    { id: 'lin', name: '林知微', slot: 'diplo', tier: 2, photo: 'char-lin',
      salary: 0.26, sign: 2.6, desc: '影石创始人，最懂怎么让年轻人替她说话。',
      eff: { rel: 0.5, awareness: 1.2, poach: -0.20, speed: 0.26 }, trait: '社交裂变', traitDesc: '认知 +0.12/月，挖角成本 −20%。' }
  ];

  const SLOTS = ['tech', 'finance', 'diplo'];
  const SLOT_NAME = { tech: '科技顾问', finance: '财政顾问', diplo: '外交顾问' };
  const SLOT_SHORT = { tech: '科技', finance: '财政', diplo: '外交' };

  function ensure(game) {
    if (!game.advisors) {
      game.advisors = { tech: null, finance: null, diplo: null, cooldown: {}, loyalty: {} };
    }
    SLOTS.forEach(function (s) {
      if (game.advisors[s] === undefined) game.advisors[s] = null;
    });
    if (!game.advisors.cooldown) game.advisors.cooldown = {};
    if (!game.advisors.loyalty) game.advisors.loyalty = {};
    return game.advisors;
  }

  function byId(id) {
    return A.filter(function (a) { return a.id === id; })[0] || null;
  }

  function candidates(slot, game) {
    ensure(game);
    const current = game.advisors[slot];
    const t = game.monthIndex || 0;
    return A.filter(function (a) {
      if (a.slot !== slot) return false;
      if (a.id === current) return false;
      const cd = game.advisors.cooldown[a.id];
      return !(cd && cd > t);
    });
  }

  function current(game, slot) {
    ensure(game);
    const id = game.advisors[slot];
    return id ? byId(id) : null;
  }

  function appoint(game, advId, opts) {
    ensure(game);
    const a = byId(advId);
    if (!a) return { ok: false, error: '没有这个顾问' };
    const slot = a.slot;
    const prev = current(game, slot);
    const free = !!(opts && opts.free);
    const cost = free ? 0 : Math.round(a.sign * 1e8);
    if (!free && (game.company.cash || 0) < cost) return { ok: false, error: '签约费不够' };

    if (prev) {
      // 换人：旧顾问进入冷却
      game.advisors.cooldown[prev.id] = (game.monthIndex || 0) + 6;
      delete game.advisors.loyalty[prev.id];
    }
    game.company.cash -= cost;
    game.advisors[slot] = a.id;
    game.advisors.loyalty[a.id] = 60 + (a.tier === 3 ? 10 : 0);
    return { ok: true, advisor: a, paid: cost };
  }

  function dismiss(game, slot) {
    ensure(game);
    const a = current(game, slot);
    if (!a) return { ok: false, error: '这个槽是空的' };
    if (a.trait === '老臣') return { ok: false, error: a.name + ' 不可解雇' };
    const fee = Math.round(a.salary * 3 * 1e8);
    game.company.cash -= fee;
    game.advisors.cooldown[a.id] = (game.monthIndex || 0) + 6;
    delete game.advisors.loyalty[a.id];
    game.advisors[slot] = null;
    return { ok: true, fee: fee };
  }

  /* 月度结算：工资、忠诚、关系自然回升 */
  function monthly(game) {
    ensure(game);
    let bill = 0;
    SLOTS.forEach(function (s) {
      const adv = current(game, s);
      if (!adv) return;
      bill += adv.salary * 1e8;
      const loy = game.advisors.loyalty[adv.id] || 60;
      const losing = (game.company.cash || 0) < 0;
      game.advisors.loyalty[adv.id] = Math.max(0, Math.min(100, loy + (losing ? -2 : 0.5)));
      if (game.advisors.loyalty[adv.id] <= 5) {
        game.advisors[adv.id] = null;
        game.advisors[s] = null;
      }
    });
    game.company.cash -= bill;
    return bill;
  }

  /* 聚合加成 */
  function mods(game) {
    ensure(game);
    const out = { rnd: 1, chip: 1, cost: 1, salary: 1, speed: {}, rel: 0, awareness: 0, diploRate: 0, cutLoss: 0, cashEvent: 0, sensorCost: 1 };
    SLOTS.forEach(function (s) {
      const adv = current(game, s);
      if (!adv) return;
      const e = adv.eff || {};
      if (e.rnd) out.rnd *= (1 + e.rnd);
      if (e.chip) out.chip *= (1 + e.chip);
      if (e.cost) out.cost *= (1 + e.cost);
      if (e.salary) out.salary *= (1 + e.salary);
      if (e.sensorCost) out.sensorCost *= (1 + e.sensorCost);
      if (e.speed) out.speed[s] = Math.max(out.speed[s] || 0, e.speed);
      if (e.rel) out.rel += e.rel;
      if (e.awareness) out.awareness += e.awareness * 0.1;
      if (e.diploRate) out.diploRate += e.diploRate;
      if (e.cutLoss) out.cutLoss += e.cutLoss;
      if (e.cashEvent) out.cashEvent += e.cashEvent;
    });
    return out;
  }

  window.FRAME_ADVISOR = {
    LIST: A, SLOTS: SLOTS, SLOT_NAME: SLOT_NAME, SLOT_SHORT: SLOT_SHORT,
    ensure: ensure, byId: byId, candidates: candidates, current: current,
    appoint: appoint, dismiss: dismiss, monthly: monthly, mods: mods
  };
})();
