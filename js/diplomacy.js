/* =========================================================
   FRAME — diplomacy engine (外交系统)
   垄断 / 切断供应 / 强烈竞争 / 结盟 / 制裁 / 技术授权
   与国策系统共用 game.diplomacy，不另开关系账本。
   依赖：window.FRAME_DATA, window.GameEngine
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const E = window.GameEngine;

  /* ---------- 态度区间 ---------- */
  const ATTITUDE_BANDS = [
    { id: 'ally', name: '盟友', min: 60, color: '#8fbf6a', desc: '可结盟、可共享技术' },
    { id: 'friendly', name: '友好', min: 30, color: '#a9c97a', desc: '可谈判、可技术授权' },
    { id: 'neutral', name: '中立', min: -30, color: '#c8b06a', desc: '正常竞争' },
    { id: 'cold', name: '冷淡', min: -60, color: '#d08a52', desc: '可能被制裁或断供' },
    { id: 'hostile', name: '敌对', min: -101, color: '#c85a4a', desc: '会主动发起强烈竞争' }
  ];
  function attitudeBand(v) {
    const n = Number(v) || 0;
    for (const b of ATTITUDE_BANDS) if (n >= b.min) return b;
    return ATTITUDE_BANDS[ATTITUDE_BANDS.length - 1];
  }
  function clampA(v) { return Math.max(-100, Math.min(100, v)); }

  /* ---------- 动作定义 ---------- */
  const ACTIONS = [
    {
      id: 'monopoly', name: '供应垄断', en: 'SUPPLY MONOPOLY', icon: '◇',
      desc: '把核心部件（传感器 / 对焦芯片）的供货权握在手里，对所有对手提价。',
      cost: 80000000, pc: 15, months: 8, global: true,
      tone: 'accent',
      requires: (game) => {
        const c = game.company;
        const strongSensor = (c.tech.sensor || 1) >= 4;
        const ownChip = (c.afChips || []).some(x => !x.isBrand) || (c.cmosChips || []).length > 0;
        if (!strongSensor && !ownChip) return '需要传感器技术 Lv.4，或一颗自研 CMOS / AF 芯片。';
        return null;
      },
      estimate: () => '全体对手份额权重 -6%，你的单位成本 -3%',
      apply: (game) => {
        game.company.diplo = game.company.diplo || {};
        game.company.diplo.costTotal = 0.97;
        game.company.diploUntil = game.monthIndex + 8;
        Object.keys(game.diplomacy).forEach(id => { game.diplomacy[id].attitude = clampA(game.diplomacy[id].attitude - 20); });
        Object.keys(game.diplomacy).forEach(id => {
          game.diplomacy[id].monopolizedMonths = 8;
        });
        return '你宣布对核心影像部件实行供应垄断，全行业成本上升。';
      }
    },
    {
      id: 'supply_cut', name: '切断供应', en: 'SUPPLY CUT', icon: '⊘',
      desc: '停止向某家对手供应关键部件，直接削弱它的产品线。',
      cost: 20000000, pc: 25, months: 5, target: true, tone: 'danger',
      requires: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        if (rel && rel.attitude > -20) return '对方态度还不够差（需要低于 -20），断供会显得毫无理由。';
        if (rel && rel.supplyCut && rel.supplyCut.by === game.company.id) return '已经在对它断供了。';
        const c = game.company;
        const canSupply = (c.tech.sensor || 1) >= 4 || (c.afChips || []).length > 0 || (c.tech.optics || 1) >= 4;
        if (!canSupply) return '你没有可断供的核心部件（需要传感器/对焦/光学技术 Lv.4，或自研芯片）。';
        return null;
      },
      estimate: (game, brand) => `${brand.name} 份额权重 -18%，你的口碑 -1.2，对方态度 -40`,
      apply: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        rel.supplyCut = { by: game.company.id, monthsLeft: 5 };
        rel.regionPush = rel.regionPush || {};
        D.REGION_ORDER.forEach(r => { rel.regionPush[r] = (rel.regionPush[r] || 1) * 0.9; });
        rel.attitude = clampA(rel.attitude - 40);
        game.company.reputation = Math.max(0, game.company.reputation - 1.2);
        return `你切断了对 ${brand.name} 的部件供应。对方正在寻找替代方案。`;
      }
    },
    {
      id: 'fierce', name: '强烈竞争', en: 'FIERCE COMPETITION', icon: '⚔',
      desc: '在重叠品类上正面开战：降价、抢渠道、抢发布窗口。',
      cost: 45000000, pc: 10, months: 4, target: true, tone: 'warn',
      requires: (game, brand) => {
        const shared = sharedCategories(game, brand);
        if (!shared.length) return '你们没有任何重叠品类，打不起来。';
        return null;
      },
      estimate: (game, brand) => {
        const shared = sharedCategories(game, brand);
        return `重叠品类：${shared.map(c => (D.CATEGORIES[c] || {}).short || c).join('、')} · 对方权重 -12%，你的品类需求 +6%，态度 -15`;
      },
      apply: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        const shared = sharedCategories(game, brand);
        rel.competition = { by: game.company.id, monthsLeft: 4, categories: shared };
        rel.regionPush = rel.regionPush || {};
        D.REGION_ORDER.forEach(r => { rel.regionPush[r] = (rel.regionPush[r] || 1) * 0.88; });
        rel.attitude = clampA(rel.attitude - 15);
        game.company.diplo = game.company.diplo || {};
        game.company.diplo.demand = game.company.diplo.demand || {};
        shared.forEach(c => { game.company.diplo.demand[c] = 1.06; });
        return `你在 ${shared.map(c => (D.CATEGORIES[c] || {}).short || c).join('、')} 上向 ${brand.name} 发起强烈竞争。`;
      }
    },
    {
      id: 'alliance', name: '结盟', en: 'ALLIANCE', icon: '⚭',
      desc: '共享镜头生态、共建标准，双方在重叠品类上一起变大。',
      cost: 30000000, pc: 30, months: 12, target: true, tone: 'good',
      requires: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        if (!rel || rel.attitude < 30) return '对方态度需要达到 30 以上才愿意谈结盟。';
        if (rel.alliance) return '你们已经是盟友了。';
        return null;
      },
      estimate: (game, brand) => `双方重叠品类需求 +5%，对方态度 +20，其他对手对你 -10`,
      apply: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        rel.alliance = { monthsLeft: 12, since: game.monthIndex };
        rel.attitude = clampA(rel.attitude + 20);
        game.company.diplo = game.company.diplo || {};
        game.company.diplo.demand = game.company.diplo.demand || {};
        sharedCategories(game, brand).forEach(c => { game.company.diplo.demand[c] = (game.company.diplo.demand[c] || 1) * 1.05; });
        Object.keys(game.diplomacy).forEach(id => {
          if (id === brand.id) return;
          game.diplomacy[id].attitude = clampA(game.diplomacy[id].attitude - 10);
        });
        return `你与 ${brand.name} 结成影像生态同盟。`;
      }
    },
    {
      id: 'sanction', name: '制裁', en: 'SANCTION', icon: '⛒',
      desc: '限制对方在你最强的市场销售，但对方会反制。',
      cost: 25000000, pc: 35, months: 6, target: true, tone: 'danger',
      requires: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        if (!rel || rel.attitude > -50) return '双方关系还没恶劣到可以公开制裁（需要态度 ≤ -50）。';
        if (rel.sanctions && rel.sanctions.some(s => s.by === game.company.id)) return '已经在制裁它了。';
        return null;
      },
      estimate: (game, brand) => `${brand.name} 在你最强区域的权重 -25%，其反制会让你第二强区域 -10%`,
      apply: (game, brand) => {
        const rel = game.diplomacy[brand.id];
        rel.sanctions = rel.sanctions || [];
        rel.sanctions.push({ by: game.company.id, monthsLeft: 6, since: game.monthIndex });
        const snap = game.market.snapshot;
        const rs = snap && snap.regions ? snap.regions.regions : [];
        const sorted = rs.slice().sort((a, b) => b.playerShare - a.playerShare);
        const strong = sorted[0];
        const second = sorted[1];
        if (strong) {
          rel.regionPush = rel.regionPush || {};
          rel.regionPush[strong.id] = (rel.regionPush[strong.id] || 1) * 0.75;
        }
        // retaliation hits the player inside the second-strongest region
        if (second) {
          game.company.diplo = game.company.diplo || {};
          game.company.diplo.regionHit = game.company.diplo.regionHit || {};
          game.company.diplo.regionHit[second.id] = { mult: 0.9, monthsLeft: 6 };
        }
        rel.attitude = clampA(rel.attitude - 25);
        return `你对 ${brand.name} 实施市场制裁，对方立刻宣布反制。`;
      }
    },
    {
      id: 'license', name: '技术授权', en: 'TECH LICENSE', icon: '⌘',
      desc: '把对方缺的技术授权出去，换现金和好感。',
      cost: 0, pc: 5, months: 6, target: true, tone: 'accent',
      requires: (game, brand) => {
        const gap = techGap(game, brand);
        if (!gap.length) return '对方在任何技术领域都不落后于你，没有可授权的筹码。';
        const rel = game.diplomacy[brand.id];
        if (rel && rel.attitude < 0) return '对方态度为负，不会接受你的技术授权。';
        return null;
      },
      estimate: (game, brand) => {
        const gap = techGap(game, brand);
        return `授权：${gap.map(g => g.name).join('、')} · 收入约 ${fmtMoney(licenseFee(game, brand))} · 对方态度 +15`;
      },
      apply: (game, brand) => {
        const fee = licenseFee(game, brand);
        game.company.cash += fee;
        if (game.oneOffs) game.oneOffs.push({ label: `技术授权：${brand.name}`, amount: -fee });
        const rel = game.diplomacy[brand.id];
        rel.license = { monthsLeft: 6, fee };
        rel.attitude = clampA(rel.attitude + 15);
        return `${brand.name} 支付 ${fmtMoney(fee)} 获得你的技术授权。`;
      }
    }
  ];
  const ACTION_MAP = {};
  ACTIONS.forEach(a => { ACTION_MAP[a.id] = a; });

  /* ---------- helpers ---------- */
  function fmtMoney(v) {
    const n = Math.abs(Number(v) || 0);
    if (n >= 100000000) return '¥' + (n / 100000000).toFixed(2) + '亿';
    if (n >= 10000) return '¥' + Math.round(n / 10000) + '万';
    return '¥' + Math.round(n);
  }
  function sharedCategories(game, brand) {
    const mine = new Set((game.products || []).filter(p => p.status === 'active').map(p => p.category));
    const theirs = new Set((game.market.aiProducts || []).filter(p => p.brandId === brand.id && p.age <= 68).map(p => p.category));
    return Array.from(mine).filter(c => theirs.has(c)).slice(0, 3);
  }
  function techGap(game, brand) {
    const def = D.COMPANIES.find(c => c.id === brand.id);
    if (!def || !def.tech) return [];
    const mine = game.company.tech || {};
    const out = [];
    D.TECH_ORDER.forEach(k => {
      if ((mine[k] || 1) - (def.tech[k] || 1) >= 2) {
        out.push({ key: k, name: (D.TECHS[k] && D.TECHS[k].name) || k, gap: (mine[k] || 1) - (def.tech[k] || 1) });
      }
    });
    return out.sort((a, b) => b.gap - a.gap).slice(0, 2);
  }
  function licenseFee(game, brand) {
    const gap = techGap(game, brand);
    const depth = gap.reduce((s, g) => s + g.gap, 0);
    return Math.round((18000000 + depth * 12000000) / 1000000) * 1000000;
  }

  /* ---------- state ---------- */
  function ensureState(game) {
    if (!game.diplomacy) game.diplomacy = {};
    (game.market && game.market.aiBrands || []).forEach(b => {
      if (b.id === game.company.id) return;
      if (!game.diplomacy[b.id]) {
        game.diplomacy[b.id] = { attitude: 0, trust: 30, contracts: [], sanctions: [], history: [] };
      }
      const rel = game.diplomacy[b.id];
      if (!rel.regionPush) rel.regionPush = {};
      if (!rel.history) rel.history = [];
      if (rel.attitude == null) rel.attitude = 0;
      if (!rel.sanctions) rel.sanctions = [];
    });
    return game.diplomacy;
  }
  function normalizeDiplomacyState(game) {
    if (!game || !game.company) return game;
    ensureState(game);
    return game;
  }

  /* ---------- availability ---------- */
  function actionAvailability(game, actionId, brandId) {
    const act = ACTION_MAP[actionId];
    if (!act) return { ok: false, error: '未知外交动作。' };
    const brand = (game.market.aiBrands || []).find(b => b.id === brandId);
    if (act.target && !brand) return { ok: false, error: '目标公司不存在。' };
    if (brand && brand.acquired) return { ok: false, error: '目标公司已被收购。' };
    const f = game.focus || {};
    if ((act.pc || 0) > Number(f.pc || 0)) return { ok: false, error: `政治资本不足（需要 ${act.pc} PC）。` };
    if ((act.cost || 0) > Number(game.company.cash || 0)) return { ok: false, error: `现金不足（需要 ${fmtMoney(act.cost)}）。` };
    const err = act.requires(game, brand);
    if (err) return { ok: false, error: err };
    return { ok: true };
  }

  /* ---------- execute ---------- */
  function executeAction(game, actionId, brandId) {
    const avail = actionAvailability(game, actionId, brandId);
    if (!avail.ok) return avail;
    const act = ACTION_MAP[actionId];
    const brand = act.target ? (game.market.aiBrands || []).find(b => b.id === brandId) : null;
    if (act.cost) {
      game.company.cash -= act.cost;
      if (game.oneOffs) game.oneOffs.push({ label: `外交：${act.name}`, amount: act.cost });
    }
    if (act.pc) game.focus.pc = Number(game.focus.pc || 0) - act.pc;
    const text = act.apply(game, brand);
    if (brand) {
      const rel = game.diplomacy[brand.id];
      rel.history = rel.history || [];
      rel.history.unshift({ month: game.monthIndex, action: act.id, name: act.name, text });
      if (rel.history.length > 20) rel.history = rel.history.slice(0, 20);
      rel.lastAction = { id: act.id, month: game.monthIndex, months: act.months };
    }
    game.diploLog = game.diploLog || [];
    game.diploLog.unshift({ month: game.monthIndex, action: act.id, name: act.name, target: brand ? brand.name : '全行业', text });
    if (game.diploLog.length > 40) game.diploLog = game.diploLog.slice(0, 40);
    try {
      if (E.addNews) {
        E.addNews(game, {
          tag: '外交', title: brand ? `${game.company.name} 对 ${brand.name} 采取${act.name}` : `${game.company.name} 宣布${act.name}`,
          text, tone: act.tone === 'danger' ? 'bad' : act.tone === 'good' ? 'good' : 'neutral', color: game.company.color
        });
      }
    } catch (e) { /* ignore */ }
    return { ok: true, text, action: act, brand };
  }

  /* ---------- monthly tick ---------- */
  function monthlyDiplomacy(game, report) {
    ensureState(game);
    const c = game.company;
    const out = { expired: [], aiActions: [], news: [] };
    if (report) report.diplomacy = out;

    // player-side temporary modifiers expire
    if (c.diploUntil != null && game.monthIndex >= c.diploUntil) {
      if (c.diplo) { c.diplo.costTotal = 1; }
      c.diploUntil = null;
      out.expired.push('供应垄断');
    }
    if (c.diplo && c.diplo.regionHit) {
      Object.keys(c.diplo.regionHit).forEach(rid => {
        const h = c.diplo.regionHit[rid];
        if (--h.monthsLeft <= 0) delete c.diplo.regionHit[rid];
      });
    }

    Object.keys(game.diplomacy).forEach(id => {
      const rel = game.diplomacy[id];
      const brand = (game.market.aiBrands || []).find(b => b.id === id);
      [['supplyCut', '断供'], ['competition', '强烈竞争'], ['alliance', '同盟'], ['license', '技术授权']].forEach(([key, label]) => {
        if (rel[key] && rel[key].monthsLeft != null) {
          rel[key].monthsLeft -= 1;
          if (rel[key].monthsLeft <= 0) {
            delete rel[key];
            out.expired.push(`${brand ? brand.name : id} 的${label}`);
          }
        }
      });
      if (rel.sanctions && rel.sanctions.length) {
        rel.sanctions.forEach(s => { s.monthsLeft -= 1; });
        rel.sanctions = rel.sanctions.filter(s => s.monthsLeft > 0);
      }
      if (rel.monopolizedMonths != null) {
        rel.monopolizedMonths -= 1;
        if (rel.monopolizedMonths <= 0) delete rel.monopolizedMonths;
        else rel.attitude = clampA(rel.attitude - 1); // resentment builds
      }
      // natural attitude drift back toward neutral
      if (rel.attitude > 0) rel.attitude = clampA(rel.attitude - 0.35);
      else if (rel.attitude < 0) rel.attitude = clampA(rel.attitude + 0.25);
    });

    // AI takes initiative
    (game.market.aiBrands || []).forEach(brand => {
      if (brand.acquired) return;
      const rel = game.diplomacy[brand.id];
      if (!rel) return;
      if (rel.attitude <= -60 && Math.random() < 0.22) {
        const kind = Math.random() < 0.5 ? '强烈竞争' : '价格战';
        rel.aiHarass = rel.aiHarass || {};
        rel.aiHarass.monthsLeft = 3;
        out.aiActions.push({ brandId: brand.id, brandName: brand.name, kind });
        out.news.push(`${brand.name} 对你发起${kind}。`);
        if (E.addNews) {
          try {
            E.addNews(game, {
              tag: '外交', title: `${brand.name} 对你发起${kind}`,
              text: `${brand.name} 在重叠品类上主动出手，你的份额在接下来三个月承压。`, tone: 'bad', color: brand.color
            });
          } catch (e) { /* ignore */ }
        }
      }
      if (rel.aiHarass && rel.aiHarass.monthsLeft != null) {
        rel.aiHarass.monthsLeft -= 1;
        if (rel.aiHarass.monthsLeft <= 0) delete rel.aiHarass;
      }
      // friendly brands drift toward alliance on their own
      if (rel.attitude >= 50 && !rel.alliance && Math.random() < 0.08) {
        rel.alliance = { monthsLeft: 10, since: game.monthIndex, fromAI: true };
        rel.attitude = clampA(rel.attitude + 10);
        out.news.push(`${brand.name} 主动提出与你们建立长期同盟。`);
      }
    });

    if (out.news.length) out.news.forEach(n => { game.news.unshift({ id: 'n' + Date.now() + Math.random(), tag: '外交', title: n, text: '', date: '' }); });
    return out;
  }

  /* ---------- weight effects used by computeMarketSnapshot ---------- */
  function brandWeightModifier(game, brandId) {
    let m = 1;
    const rel = game.diplomacy && game.diplomacy[brandId];
    if (!rel) return 1;
    if (rel.supplyCut && rel.supplyCut.by === game.company.id) m *= 0.82;
    if (rel.competition && rel.competition.by === game.company.id) m *= 0.88;
    if (rel.alliance) m *= 1.12;
    if (rel.monopolizedMonths) m *= 0.94;
    if (rel.sanctions && rel.sanctions.some(s => s.by === game.company.id)) m *= 0.85;
    if (rel.aiHarass) m *= 1.06;
    return m;
  }
  function playerWeightModifier(game) {
    let m = 1;
    Object.keys(game.diplomacy || {}).forEach(id => {
      const rel = game.diplomacy[id];
      if (rel.competition && rel.competition.by === id) m *= 0.94;
      if (rel.aiHarass) m *= 0.96;
      if (rel.alliance) m *= 1.03;
    });
    return m;
  }

  /* ---------- region investment (地图上的主动投入) ---------- */
  const REGION_INVEST_COST = 12000000;
  function investRegion(game, regionId) {
    const region = (D.REGION_INDEX || {})[regionId];
    if (!region) return { ok: false, error: '未知区域。' };
    if (game.company.cash < REGION_INVEST_COST) return { ok: false, error: `现金不足，区域投入需要 ${fmtMoney(REGION_INVEST_COST)}。` };
    game.company.cash -= REGION_INVEST_COST;
    if (game.oneOffs) game.oneOffs.push({ label: `区域投入：${region.name}`, amount: REGION_INVEST_COST });
    game.company.regionInvest = game.company.regionInvest || {};
    const cur = game.company.regionInvest[regionId] || { level: 0, monthsLeft: 0 };
    cur.level = Math.min(4, cur.level + 1);
    cur.monthsLeft = 12;
    game.company.regionInvest[regionId] = cur;
    return { ok: true, level: cur.level, text: `你在${region.name}追加投入，区域份额修正 +${(cur.level * 7)}%。` };
  }
  function regionInvestMultiplier(game, regionId) {
    const inv = (game.company.regionInvest || {})[regionId];
    if (!inv) return 1;
    return 1 + inv.level * 0.07;
  }
  function tickRegionInvest(game) {
    const inv = game.company.regionInvest || {};
    Object.keys(inv).forEach(rid => {
      inv[rid].monthsLeft = (inv[rid].monthsLeft || 0) - 1;
      if (inv[rid].monthsLeft <= 0) {
        inv[rid].level = Math.max(0, inv[rid].level - 1);
        if (inv[rid].level === 0) delete inv[rid];
        else inv[rid].monthsLeft = 6;
      }
    });
  }

  window.DiplomacyEngine = {
    ACTIONS, ACTION_MAP, ATTITUDE_BANDS, REGION_INVEST_COST,
    attitudeBand, ensureState, normalizeDiplomacyState,
    actionAvailability, executeAction, monthlyDiplomacy,
    brandWeightModifier, playerWeightModifier,
    investRegion, regionInvestMultiplier, tickRegionInvest,
    sharedCategories, techGap, licenseFee, fmtMoney
  };
})();
