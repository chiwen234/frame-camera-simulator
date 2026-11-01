/* =========================================================
   FRAME — focus tree engine (决策系统)
   Monthly focus points, exclusive routes, modifier stacking,
   AI focus progress and the acquisition system.
   Depends on: window.FRAME_DATA, window.FRAME_FOCUS, window.GameEngine
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const FT = window.FRAME_FOCUS;
  const E = window.GameEngine;
  const FOCUS_TREES = FT.FOCUS_TREES;

  const BRANCH_LABELS = {
    sensor: '影像核心', af: '对焦与技术', video: '视频与电影', optics: '光学与卡口',
    brand: '品牌与文化', business: '商业与产能'
  };
  const BRANCH_COLORS = {
    sensor: '#d8a558', af: '#90a86c', video: '#7f9fbd',
    optics: '#b48966', brand: '#c0709a', business: '#6e8f7d'
  };
  const FP_PER_MONTH = 1;
  const AI_FP_PER_MONTH = 0.7;
  const MAX_ACTIVE_FOCUS = 1; // 同时只能推进一条决策，和钢铁雄心一样

  /* ---------- index ---------- */
  // 每家公司有两棵树：dev 发展 / diplo 外交
  function treeKey(company, kind) {
    const id = (company && company.id) || 'startup';
    const want = (kind === 'pol' || kind === 'diplo') ? 'pol' : 'dev';
    const key = id + '_' + want;
    return FOCUS_TREES[key] ? key : ('startup_' + want);
  }
  function treeFor(company, kind) {
    return FOCUS_TREES[treeKey(company, kind)] || FOCUS_TREES.startup_dev_dev;
  }
  function nodeById(treeId, nodeId) {
    const tree = FOCUS_TREES[treeId];
    if (tree) return (tree.nodes || []).find(n => n.id === nodeId) || null;
    // 没给树 id 时，在所有树里找（节点 id 自带 brand_kind 前缀）
    for (const k of Object.keys(FOCUS_TREES)) {
      const hit = (FOCUS_TREES[k].nodes || []).find(n => n.id === nodeId);
      if (hit) return hit;
    }
    return null;
  }
  function treeNodeMap(tree) {
    const map = {};
    (tree.nodes || []).forEach(n => { map[n.id] = n; });
    return map;
  }

  /* ---------- bound game ---------- */
  let CURRENT_GAME = null;
  function bindGame(game) {
    CURRENT_GAME = game;
    // non-enumerable so JSON.stringify(exportSave) never hits a circular ref
    if (game && game.company) {
      try { Object.defineProperty(game.company, '_gameRef', { value: game, enumerable: false, writable: true, configurable: true }); }
      catch (e) { /* ignore */ }
    }
    return game;
  }
  function currentGame() { return CURRENT_GAME; }

  /* ---------- state ---------- */
  function currentTechLevel(company, key) {
    return (company && company.tech && company.tech[key]) || 1;
  }
  function techGates(node, company) {
    const gates = [];
    const eff = node.effects || {};
    const tech = eff.tech || {};
    Object.keys(tech).forEach(k => {
      const need = currentTechLevel(company, k) + 1;
      if (need > 5) gates.push({ key: k, need: 5, label: (D.TECHS[k] && D.TECHS[k].name) || k, hard: false });
    });
    return gates;
  }

  const SLOT_KEYS = ['gen', 'tech', 'finance', 'diplo'];

  function slotOfNode(node) {
    if (!node) return 'gen';
    if (node.kind === 'pol') return 'diplo';
    if (node.lane === 'xf') return 'finance';
    const ln = String(node.laneName || '');
    if (/现金|品牌/.test(ln)) return 'finance';
    return 'tech';
  }

  function ensureSlots(game) {
    const f = game.focus;
    if (!f.slots) f.slots = { gen: null, tech: null, finance: null, diplo: null };
    SLOT_KEYS.forEach(function (k) { if (f.slots[k] === undefined) f.slots[k] = null; });
    return f.slots;
  }

  function slotFree(game, node) {
    const slots = ensureSlots(game);
    const want = slotOfNode(node);
    if (!slots[want]) return want;
    if (!slots.gen) return 'gen';
    return null;
  }

  function slotLabel(k) {
    return { gen: '通用', tech: '科技', finance: '财政', diplo: '外交' }[k] || k;
  }

  function initFocusState(game) {
    if (!game.company) return;
    const tree = treeFor(game.company);
    if (!game.focus) game.focus = {};
    const f = game.focus;
    if (!f.kind) f.kind = 'dev';
    if (!f.treeId) f.treeId = treeKey(game.company, f.kind);
    if (f.fp == null) f.fp = 3;
    if (f.pc == null) f.pc = 0;
    if (!Array.isArray(f.completed)) f.completed = [];
    if (!Array.isArray(f.queue)) f.queue = [];
    if (!f.progress) f.progress = {};
    if (!f.modifiers) f.modifiers = null;
    if (!f.lockedGroups) f.lockedGroups = {};
    if (!f.history) f.history = [];
    f.treeId = (FOCUS_TREES[f.treeId] && FOCUS_TREES[f.treeId] === tree) ? f.treeId : (FOCUS_TREES[game.company.id] ? game.company.id : 'startup');
    recalcFocusModifiers(game);
    return game.focus;
  }
  function normalizeFocusState(game) {
    if (!game || !game.company) return game;
    initFocusState(game);
    // clean completed ids that no longer exist in the tree
    const tree = FOCUS_TREES[game.focus.treeId] || FOCUS_TREES.startup_dev;
    const map = treeNodeMap(tree);
    game.focus.completed = game.focus.completed.filter(id => !!map[id]);
    game.focus.queue = game.focus.queue.filter(id => !!map[id] && game.focus.completed.indexOf(id) < 0);
    (game.market && game.market.aiBrands || []).forEach(b => {
      if (!b.focus) { b.focus = { completed: [], fp: 4, pc: 0, progress: {} }; return; }
      const aiMap = treeNodeMap(FOCUS_TREES[b.id] || FOCUS_TREES.startup_dev);
      b.focus.completed = (b.focus.completed || []).filter(id => !!aiMap[id]);
      b.focus.queue = (b.focus.queue || []).filter(id => !!aiMap[id] && b.focus.completed.indexOf(id) < 0);
    });
    recalcFocusModifiers(game);
    return game;
  }

  /* ---------- node state ---------- */
  // 把前置拆成「必须全满足的组」，其中互为互斥的节点合并为一组（组内任一即满足）
  function reqGroups(node) {
    const req = (node.requires || []).slice();
    if (!req.length) return [];
    // requireMode='any'：全部前置合并为一组，完成任意一个即可
    if (node.requireMode === 'any') return [req];
    const groups = [];
    const used = {};
    req.forEach(function (id) {
      if (used[id]) return;
      const n = nodeById(null, id);
      const g = [id];
      used[id] = true;
      if (n && n.exclusiveGroup) {
        // 同一互斥组里的其他前置，合并进同一组
        req.forEach(function (other) {
          if (used[other] || other === id) return;
          const o = nodeById(null, other);
          if (o && o.exclusiveGroup === n.exclusiveGroup) { g.push(other); used[other] = true; }
        });
      }
      groups.push(g);
    });
    return groups;
  }

  // 前置是否满足：每个组里至少完成一个（组内是互斥关系）
  function requiresMetWith(completed, node) {
    const done = completed || [];
    const groups = reqGroups(node);
    return groups.every(function (g) { return g.some(id => done.indexOf(id) >= 0); });
  }

  function requiresMet(game, node) {
    return requiresMetWith((game.focus && game.focus.completed) || [], node);
  }

  // 还缺哪个组（用于提示）
  function missingGroups(game, node) {
    const done = (game.focus && game.focus.completed) || [];
    return reqGroups(node).filter(function (g) { return !g.some(id => done.indexOf(id) >= 0); });
  }

  function nodeState(game, nodeId) {
    const f = game.focus || {};
    const tree = FOCUS_TREES[f.treeId] || FOCUS_TREES.startup_dev;
    const node = nodeById(null, nodeId);
    if (!node) return 'missing';
    if ((f.completed || []).indexOf(nodeId) >= 0) return 'done';
    if ((f.queue || []).indexOf(nodeId) >= 0) return 'active';
    const ex = node.excludes || [];
    if (ex.some(id => (f.completed || []).indexOf(id) >= 0)) return 'excluded';
    if (!requiresMet(game, node)) return 'locked';
    if (node.needCash && game.company.cash < node.needCash) return 'cost';
    if (node.needShare) {
      const snap = game.market && game.market.snapshot;
      if (snap && (snap.playerShare || 0) < node.needShare) return 'locked';
    }
    if (node.needEvent) {
      const fired = (game.events && game.events.fired) || [];
      const ok = Array.isArray(node.needEvent) ? node.needEvent.some(function (id) { return fired.indexOf(id) >= 0; })
        : fired.indexOf(node.needEvent) >= 0;
      if (!ok) return 'locked';
    }
    if ((f.queue || []).length >= MAX_ACTIVE_FOCUS) return 'waiting';
    if (!slotFree(game, node)) return 'cost';
    const gates = techGates(node, game.company);
    if (gates.length && gates.every(g => currentTechLevel(game.company, g.key) < 1)) { /* noop */ }
    return 'ready';
  }
  function nodeBlockReason(game, node) {
    const f = game.focus || {};
    const excludedBy = (node.excludes || []).filter(id => (f.completed || []).indexOf(id) >= 0).map(id => nodeById(f.treeId, id)).filter(Boolean);
    if (excludedBy.length) return { code: 'excluded', text: '已选择互斥路线：' + excludedBy.map(n => n.title).join('、') };
    // 份额 / 现金 / 事件 前置
    if (node.needCash && game.company.cash < node.needCash) {
      return { code: 'cash', text: '现金不足（需要 ' + Math.round(node.needCash / 1e8) + ' 亿）' };
    }
    if (node.needShare) {
      const snap = game.market && game.market.snapshot;
      const share = snap ? (snap.playerShare || 0) : 0;
      if (share < node.needShare) {
        return { code: 'share', text: '份额不足（需要 ' + node.needShare + '%，当前 ' + share.toFixed(1) + '%）' };
      }
    }
    if (node.needEvent) {
      const fired = (game.events && game.events.fired) || [];
      const any = Array.isArray(node.needEvent) ? node.needEvent.some(function (id) { return fired.indexOf(id) >= 0; })
        : fired.indexOf(node.needEvent) >= 0;
      if (!any) return { code: 'event', text: '需要先发生某件事（' + node.needEvent + '）' };
    }
    const miss = missingGroups(game, node);
    if (miss.length) {
      const text = miss.map(function (g) {
        const names = g.map(id => { const n = nodeById(null, id); return n ? n.title : id; });
        return names.length > 1 ? '「' + names.join('」或「') + '」任一' : '「' + names[0] + '」';
      }).join('、');
      return { code: 'locked', text: '需要先完成：' + text };
    }
    if ((f.queue || []).length >= MAX_ACTIVE_FOCUS) return { code: 'waiting', text: `同时最多推进 ${MAX_ACTIVE_FOCUS} 条决策` };
    if (!slotFree(game, node)) return { code: 'cost', text: '没有空闲槽位（需要 ' + slotLabel(slotOfNode(node)) + ' 槽或通用槽）' };
    return null;
  }
  function availableNodes(game) {
    const f = game.focus || {};
    const tree = FOCUS_TREES[f.treeId] || FOCUS_TREES.startup_dev;
    return (tree.nodes || []).filter(n => nodeState(game, n.id) === 'ready');
  }
  function branchProgress(game) {
    const f = game.focus || {};
    const tree = FOCUS_TREES[f.treeId] || FOCUS_TREES.startup_dev;
    const out = {};
    (tree.branches || []).forEach(b => {
      const total = (tree.nodes || []).filter(n => n.branch === b.id).length;
      const done = (tree.nodes || []).filter(n => n.branch === b.id && (f.completed || []).indexOf(n.id) >= 0).length;
      out[b.id] = { name: b.name, color: BRANCH_COLORS[b.id] || b.color, total, done };
    });
    return out;
  }
  function routeLabel(game) {
    const f = game.focus || {};
    const tree = FOCUS_TREES[f.treeId] || FOCUS_TREES.startup_dev;
    const chosen = [];
    (tree.nodes || []).forEach(n => {
      if (!n.exclusiveGroup) return;
      if ((f.completed || []).indexOf(n.id) >= 0) chosen.push(n);
    });
    if (!chosen.length) return '未定路线';
    return chosen.map(n => n.title).join(' / ');
  }

  /* ---------- modifiers ---------- */
  function blankModifiers() {
    return {
      rnd: 1, chip: 1, dsp: 1, talent: 1, salary: 1, qc: 1,
      revenue: 1, awarenessGain: 0, reputationGain: 0, pcGain: 0,
      cashDelta: 0, demand: {}, cost: { sensor: 1, body: 1, optics: 1, af: 1, total: 1 },
      sharePush: {}, aiRelations: {}, launch: { reach: 1, press: 1, preorder: 1 },
      tech: {}, logistics: 0, defectMod: 0, sources: []
    };
  }
  function mergeNodeInto(mods, node) {
    const e = node.effects || {};
    if (e.rnd) mods.rnd *= e.rnd;
    if (e.chip) mods.chip *= (1 + (e.chip - 1) * 0.25);
    if (e.dsp) mods.dsp *= e.dsp;
    if (e.talent) mods.talent *= e.talent;
    if (e.salary) mods.salary *= e.salary;
    if (e.qc) mods.qc *= e.qc;
    if (e.revenue) mods.revenue *= e.revenue;
    if (e.awareness) mods.awarenessGain += Number(e.awareness);
    if (e.reputation) mods.reputationGain += Number(e.reputation);
    if (e.cash) mods.cashDelta += Number(e.cash);
    if (e.launch) {
      if (e.launch.reach) mods.launch.reach *= e.launch.reach;
      if (e.launch.press) mods.launch.press *= e.launch.press;
      if (e.launch.preorder) mods.launch.preorder *= e.launch.preorder;
    }
    if (e.demand) Object.keys(e.demand).forEach(k => { mods.demand[k] = (mods.demand[k] || 1) * e.demand[k]; });
    if (e.cost) Object.keys(e.cost).forEach(k => { mods.cost[k] = (mods.cost[k] || 1) * e.cost[k]; });
    if (e.sharePush) Object.keys(e.sharePush).forEach(k => { mods.sharePush[k] = (mods.sharePush[k] || 0) + Number(e.sharePush[k]); });
    if (e.aiRelations) Object.keys(e.aiRelations).forEach(k => { mods.aiRelations[k] = (mods.aiRelations[k] || 0) + Number(e.aiRelations[k]); });
    if (e.tech) Object.keys(e.tech).forEach(k => { mods.tech[k] = (mods.tech[k] || 0) + Number(e.tech[k]); });
    mods.sources.push({ id: node.id, title: node.title, effects: e });
    return mods;
  }
  function recalcFocusModifiers(game) {
    const f = game.focus || {};
    const mods = blankModifiers();
    // 已完成决策（跨两棵树）
    (f.completed || []).forEach(function (id) {
      const node = findAnyNode(id);
      if (node) mergeNodeInto(mods, node);
    });
    // 公司精神：永久生效的正面 / 负面 buff
    const sp = window.FRAME_SPIRITS;
    if (sp && game.company) {
      // 用 activeSpirits：已扣除决策移除的负面、加上决策新增的正面
      const act = sp.activeSpirits(game);
      act.forEach(function (sip) {
        mergeNodeInto(mods, { id: sip.id, title: sip.name, effects: sip.effects });
      });
      f.spirits = act;
    }
    f.modifiers = mods;
    return mods;
  }
  function findAnyNode(id) {
    for (const k of Object.keys(FOCUS_TREES)) {
      const hit = (FOCUS_TREES[k].nodes || []).find(function (n) { return n.id === id; });
      if (hit) return hit;
    }
    return null;
  }
  function focusMods(game) {
    if (!game || !game.focus) return blankModifiers();
    if (!game.focus.modifiers) recalcFocusModifiers(game);
    return game.focus.modifiers;
  }
  function modMult(game, group, key) {
    const m = focusMods(game);
    if (group === 'cost') return (m.cost && m.cost[key]) || 1;
    if (group === 'demand') return (m.demand && m.demand[key]) || 1;
    if (group === 'launch') return (m.launch && m.launch[key]) || 1;
    return 1;
  }
  function techBonus(game, key) {
    const m = focusMods(game);
    return (m.tech && m.tech[key]) || 0;
  }
  function sharePushFor(game, brandId) {
    const m = focusMods(game);
    return (m.sharePush && m.sharePush[brandId]) || 0;
  }

  /* ---------- actions ---------- */
  function startFocus(game, nodeId) {
    const f = game.focus;
    if (!f) return { ok: false, error: '决策系统尚未初始化。' };
    const node = nodeById(null, nodeId);
    if (!node) return { ok: false, error: '未知决策。' };
    if (nodeState(game, nodeId) === 'done') return { ok: false, error: '该决议已经完成。' };
    const reason = nodeBlockReason(game, node);
    if (reason) return { ok: false, error: reason.text };
    // 占用槽位
    const slotsS = ensureSlots(game);
    const wantS = slotOfNode(node);
    const useS = !slotsS[wantS] ? wantS : 'gen';
    slotsS[useS] = node.id;
    f.slotUsed = f.slotUsed || {};
    f.slotUsed[node.id] = useS;
    f.queue.push(nodeId);
    f.progress[nodeId] = { months: 0, total: Math.max(1, Number(node.months) || 1), startedMonth: game.monthIndex };
    if (typeof E.addNews === 'function' && E.addNews.length >= 0) {
      try {
        E.addNews(game, {
          tag: '决策', title: `${game.company.name} 启动决策：${node.title}`,
          text: `预计 ${node.months} 个月完成。${node.desc}`, tone: 'neutral', color: game.company.color
        });
      } catch (e) { /* addNews may not be exported */ }
    }
    return { ok: true, node };
  }
  function cancelFocus(game, nodeId) {
    const f = game.focus;
    if (!f || (f.queue || []).indexOf(nodeId) < 0) return { ok: false, error: '该决议不在推进中。' };
    const node = nodeById(null, nodeId);
    f.queue = f.queue.filter(id => id !== nodeId);
    delete f.progress[nodeId];
    f.fp = Number(f.fp || 0) + Math.round(Number(node && node.cost || 0) * 0.5);
    return { ok: true, refunded: true };
  }
  function monthlyFocusProgress(game, report) {
    const f = game.focus;
    if (!f) return null;
    const out = { completed: [], progress: [], fpGained: 0, pcGained: 0 };
    const fpGain = FP_PER_MONTH + Math.round((f.modifiers && f.modifiers.pcGain) || 0);
    f.fp = Number(f.fp || 0) + FP_PER_MONTH;
    out.fpGained = FP_PER_MONTH;
    if (report) report.focusProgress = out;
    const tree = FOCUS_TREES[f.treeId] || FOCUS_TREES.startup_dev;
    const map = treeNodeMap(tree);
    (f.queue || []).slice().forEach(id => {
      const node = map[id] || findAnyNode(id);
      if (!node) { f.queue = f.queue.filter(x => x !== id); return; }
      const pr = f.progress[id] || (f.progress[id] = { months: 0, total: Math.max(1, node.months || 1) });
      pr.months = (pr.months || 0) + 1;
      out.progress.push({ id, title: node.title, months: pr.months, total: pr.total });
      if (pr.months >= pr.total) {
        f.queue = f.queue.filter(x => x !== id);
        f.completed.push(id);
        // 释放该决策占用的槽位
        try {
          const sFree = ensureSlots(game);
          const uFree = (f.slotUsed && f.slotUsed[id]) || null;
          if (uFree && sFree[uFree] === id) sFree[uFree] = null;
          if (f.slotUsed) delete f.slotUsed[id];
        } catch (err) {}
      try {
        if (window.FrameEvents) {
          window.FrameEvents.focusBroadcast(game, node);
          window.FrameEvents.onFocusComplete(game, node);
        }
      } catch (err) {}

        delete f.progress[id];
        f.history.push({ id, title: node.title, month: game.monthIndex + 1 });
        applyNodeCompletion(game, node, report);
        out.completed.push({ id, title: node.title, desc: node.desc });
      }
    });
    recalcFocusModifiers(game);
    return out;
  }
  function applyNodeCompletion(game, node, report) {
    const c = game.company;
    const e = node.effects || {};
    // permanent tech jumps
    if (e.tech) {
      Object.keys(e.tech).forEach(k => {
        const cur = c.tech[k] || 1;
        const next = Math.min(5, cur + Number(e.tech[k]));
        if (next > cur) {
          c.tech[k] = next;
          if (report && report.researchCompleted) report.researchCompleted.push({ tech: k, techName: (D.TECHS[k] && D.TECHS[k].name) || k, level: next, fromFocus: true });
        }
      });
    }
    if (e.fp) game.focus.fp = Number(game.focus.fp || 0) + Number(e.fp);
    if (e.pc) game.focus.pc = Number(game.focus.pc || 0) + Number(e.pc);
    if (e.cash) {
      c.cash += Number(e.cash);
      if (report && report.oneOffs) report.oneOffs.push({ label: `决策：${node.title}`, amount: -Number(e.cash) });
    }
    if (e.aiRelations && game.diplomacy) {
      Object.keys(e.aiRelations).forEach(brand => {
        const rel = game.diplomacy[brand];
        if (rel) rel.attitude = clampNum((rel.attitude || 0) + Number(e.aiRelations[brand]), -100, 100);
        else game.diplomacy[brand] = { attitude: clampNum(Number(e.aiRelations[brand]), -100, 100), trust: 30, contracts: [] };
      });
    }
    if (typeof E.addNews === 'function') {
      try {
        E.addNews(game, {
          tag: '决策', title: `${game.company.name} 完成决策：${node.title}`,
          text: effectSummary(node), tone: 'good', color: game.company.color
        });
      } catch (err) { /* ignore */ }
    }
    // NEW EFFECTS: 解锁 CMOS / 解锁新机型 / 新增精神 / 移除负面精神
    // 风险节点：掷骰
    if (node.risk) {
      const rate = Number(node.risk.rate || 0.6)
        + (game.company.morale > 70 ? 0.1 : 0) - (game.company.morale < 40 ? 0.15 : 0)
        + (game.company.cash > 2000000000 ? 0.05 : 0);
      const win = Math.random() < rate;
      const pick = win ? node.risk.success : node.risk.fail;
      Object.keys(pick || {}).forEach(function (k) {
        const v = pick[k];
        if (k === 'cash') game.company.cash += v;
        else if (k === 'rnd') game.focus.extRnd = (game.focus.extRnd || 1) * v;
        else if (k === 'chip') game.focus.extChip = (game.focus.extChip || 1) * v;
        else if (k === 'reputation') game.company.reputation = Math.max(0, Math.min(100, game.company.reputation + v * 100));
      });
      game.focus.lastRisk = { id: node.id, title: node.title, win: win, rate: rate };
      if (typeof addNews === 'function' || E.addNews) {
        const it = { tag: '风险', title: node.title + '：' + (win ? '成功' : '失败'),
          text: win ? '赌赢了。' : '赌输了，代价已经付出。', tone: win ? 'good' : 'warn', color: game.company.color };
        try { (E.addNews || addNews)(game, it); } catch (err) {}
      }
      if (game.company.cash < 0) { game.bankrupt = true; }
    }
    if (node.unlockModel && window.FRAME_FOCUS && window.FRAME_FOCUS.NEW_MODELS) {
      const pool = window.FRAME_FOCUS.NEW_MODELS[game.company.id] || [];
      const m = pool.find(function (x) { return (game.company.unlockedModels || []).indexOf(x.code) < 0; });
      if (m) {
        game.company.unlockedModels = game.company.unlockedModels || [];
        game.company.unlockedModels.push(m.code);
      }
    }
    if (node.unlockChip) {
      game.company.unlockedChips = game.company.unlockedChips || [];
      if (game.company.unlockedChips.indexOf(node.unlockChip) < 0) game.company.unlockedChips.push(node.unlockChip);
    }
    if (node.unlockDiplo) {
      game.unlockedDiplo = game.unlockedDiplo || [];
      if (game.unlockedDiplo.indexOf(node.unlockDiplo) < 0) game.unlockedDiplo.push(node.unlockDiplo);
    }
    if (e.unlockSensor) unlockSensorModel(game, node);
    if (e.unlockModel) unlockNewModel(game, node);
    if (e.gainSpirit) {
      game.focus.extraSpirits = game.focus.extraSpirits || [];
      if (game.focus.extraSpirits.indexOf(e.gainSpirit) < 0) game.focus.extraSpirits.push(e.gainSpirit);
      const SP = window.FRAME_SPIRITS;
      const sp = SP && SP.REWARD_SPIRITS[e.gainSpirit];
      if (sp && E.addNews) notify(game, { tag: '精神', title: c.name + ' 获得正面精神「' + sp.name + '」', text: sp.desc, tone: 'good', color: c.color });
    }
    if (e.removeSpirit) {
      game.focus.removedSpirits = game.focus.removedSpirits || [];
      const ids = Array.isArray(e.removeSpirit) ? e.removeSpirit : [e.removeSpirit];
      const SP2 = window.FRAME_SPIRITS;
      ids.forEach(function (sid) {
        if (game.focus.removedSpirits.indexOf(sid) < 0) game.focus.removedSpirits.push(sid);
        const sp = SP2 && SP2.SPIRITS[c.id] && SP2.SPIRITS[c.id].find(function (x) { return x.id === sid; });
        if (sp && E.addNews) notify(game, { tag: '精神', title: c.name + ' 摆脱了负面精神「' + sp.name + '」', text: '这条包袱终于被丢掉了。', tone: 'good', color: c.color });
      });
    }
    // acquisitions: a completed focus can force an AI rival to merge into you
    if (node.acquire) acquireByFocus(game, node, report);
  }
  // 安全新闻：focus.js 里没有局部 addNews，统一走 E.addNews
  function notify(game, item) {
    try {
      if (E && typeof E.addNews === 'function') E.addNews(game, item);
    } catch (err) { /* ignore */ }
  }

  // 解锁一颗该公司的旗舰 CMOS 进入芯片库
  function unlockSensorModel(game, node) {
    const c = game.company;
    const L = window.FRAME_CHIPS;
    if (!L) return;
    const list = L.cmosModelsFor(c.id) || [];
    if (!list.length) return;
    const best = list.slice().sort(function (x, y) { return (y.mp || 0) - (x.mp || 0); })[0];
    c.unlockedSensors = c.unlockedSensors || [];
    if (c.unlockedSensors.indexOf(best.id) >= 0) return;
    c.unlockedSensors.push(best.id);
    if (E.addNews) {
      try { notify(game, { tag: '研发', title: c.name + ' 研发出新 CMOS：' + best.name, text: '已进入自有芯片库，可在设计工作台选用。', tone: 'good', color: c.color }); } catch (err) { /* ignore */ }
    }
  }
  // 解锁一台新机型（进设计工作台，由玩家定价发布）
  function unlockNewModel(game, node) {
    const c = game.company;
    const FM = window.FRAME_FOCUS;
    if (!FM || !FM.NEW_MODELS) return;
    const pool = FM.NEW_MODELS[c.id] || [];
    if (!pool.length) return;
    c.unlockedModels = c.unlockedModels || [];
    const next = pool.find(function (m) { return c.unlockedModels.indexOf(m.code) < 0; });
    if (!next) return;
    c.unlockedModels.push(next.code);
    if (E.addNews) {
      try { notify(game, { tag: '研发', title: c.name + ' 完成 ' + next.name + ' 的原型', text: '新机型已进入设计工作台，可以开始定价与发布。', tone: 'good', color: c.color }); } catch (err) { /* ignore */ }
    }
  }
  function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- acquisition ---------- */
  // 收购是终局手段：目标必须已经濒死，且你要有足够现金与政治资本。
  const ACQ_MIN_PC = 120;
  const ACQ_SHARE_LIMIT = 4;

  function snapshotShare(game, brandId) {
    const snap = game.market && game.market.snapshot;
    if (!snap || !snap.brands) return null;
    const row = snap.brands.find(x => x.id === brandId);
    return row ? Number(row.share || 0) : 0;
  }
  function brandStrength(game, brandId) {
    // 目标在六个区域里排第一的次数 + 平均份额，用来判断它是不是真的衰弱
    const regs = (game.market && game.market.snapshot && game.market.snapshot.regions && game.market.snapshot.regions.regions) || [];
    let leads = 0, sum = 0, n = 0;
    regs.forEach(r => {
      const row = (r.list || []).find(e => e.id === brandId);
      if (!row) return;
      n++; sum += row.share;
      if ((r.list || [])[0] && r.list[0].id === brandId) leads++;
    });
    return { leads, avg: n ? sum / n : 0, regions: n };
  }
  function acquisitionCost(game, brand) {
    // 兼容旧签名：acquisitionCost(brand)
    if (typeof game === 'string' || (game && game.id && !game.market)) { brand = game; game = null; }
    const share = game ? snapshotShare(game, brand.id) : null;
    const real = share == null ? Number(brand.share || 0) : share;
    const rep = Number(brand.reputation || 70);
    const products = (game.market.aiProducts || []).filter(p => p.brandId === brand.id && p.age <= 68).length;
    // 体量 = 份额 + 产品线 + 品牌资产；起步就是十几亿，巨头更贵
    const base = 900000000 + real * 260000000 + rep * 12000000 + products * 60000000;
    return Math.round(base / 10000000) * 10000000;
  }
  function acquisitionEligible(game, brand) {
    if (!brand || brand.acquired) return { ok: false, reason: '该品牌已并入其他公司。' };
    const snap = game.market && game.market.snapshot;
    if (!snap) return { ok: false, reason: '还没有市场数据，先推进一个月。' };
    const share = snapshotShare(game, brand.id);
    if (share == null) return { ok: false, reason: '该品牌已不在市场统计中。' };
    const strength = brandStrength(game, brand.id);
    const rel = (game.diplomacy || {})[brand.id] || {};
    const pc = Number((game.focus && game.focus.pc) || 0);
    const cash = Number(game.company.cash || 0);
    const cost = acquisitionCost(game, brand);
    const myShare = Number(game.company.share || 0);

    if (strength.leads > 0) return { ok: false, reason: `它在 ${strength.leads} 个区域还是第一，没有理由卖身。` };
    if (share > ACQ_SHARE_LIMIT) return { ok: false, reason: `份额仍有 ${share.toFixed(1)}%，必须跌到 ${ACQ_SHARE_LIMIT}% 以下才算濒死。` };
    if (rel.attitude != null && rel.attitude > -40) return { ok: false, reason: `态度 ${Math.round(rel.attitude)}，还没到愿意谈出售的地步（需要 ≤ -40，先用断供或制裁施压）。` };
    if (myShare < share * 1.6) return { ok: false, reason: `你的份额 ${myShare.toFixed(1)}% 还压不住它（需要达到它的 1.6 倍以上）。` };
    if (pc < ACQ_MIN_PC) return { ok: false, reason: `政治资本不足（需要 ${ACQ_MIN_PC} PC，当前 ${Math.round(pc)}）。` };
    if (cash < cost) return { ok: false, reason: `现金不足：报价 ${costCny(cost)}，你只有 ${costCny(cash)}。` };
    return { ok: true, cost, share, strength };
  }

  function acquireBrand(game, brandId, options) {
    options = options || {};
    const c = game.company;
    const brand = (game.market.aiBrands || []).find(b2 => b2.id === brandId);
    if (!brand) return { ok: false, error: '目标公司不存在。' };
    const elig = acquisitionEligible(game, brand);
    if (!elig.ok && !options.force) return { ok: false, error: elig.reason };
    const cost = elig.cost || acquisitionCost(game, brand);
    if (c.cash < cost && !options.force) return { ok: false, error: `现金不足，收购需要 ${costCny(cost)}。` };
    c.cash -= cost;
    if (game.focus && game.focus.pc != null) game.focus.pc = Math.max(0, Number(game.focus.pc) - ACQ_MIN_PC);
    if (game.oneOffs) game.oneOffs.push({ label: `收购 ${brand.name}`, amount: cost });

    const def = D.COMPANIES.find(x => x.id === brandId);
    const absorbed = { products: 0, tech: [], chips: [], regions: 0 };

    // 1) 产品线：把对方在售机型并入你的产品矩阵（按 72% 规格继承，避免直接抄数值）
    if (def) {
      (def.catalog || []).forEach((seed, idx) => {
        try {
          const p = buildAbsorbedProduct(game, c, seed, brand, idx);
          if (p) { game.products.push(p); absorbed.products++; }
        } catch (e) { /* ignore single product */ }
      });
    }

    // 2) 技术：取对方最强的两项技术 +1（不超过 5）
    if (def && def.tech) {
      Object.keys(def.tech).sort((x, y) => (def.tech[y] || 1) - (def.tech[x] || 1)).slice(0, 2).forEach(k => {
        const before = c.tech[k] || 1;
        const after = Math.min(5, Math.max(before, Math.round((def.tech[k] || 1) * 0.8)));
        if (after > before) { c.tech[k] = after; absorbed.tech.push(`${(D.TECHS[k] && D.TECHS[k].name) || k} Lv.${after}`); }
      });
    }

    // 3) 团队：吸收对方工程师（35%）与设计师（30%）
    if (def && def.staff) {
      c.staff.engineers = (c.staff.engineers || 0) + Math.round((def.staff.engineers || 0) * 0.35);
      c.staff.designers = (c.staff.designers || 0) + Math.round((def.staff.designers || 0) * 0.3);
      c.staff.marketing = (c.staff.marketing || 0) + Math.round((def.staff.marketing || 0) * 0.3);
    }

    // 4) 芯片：接管对方自有的处理器与 CMOS 型号
    const CH = window.FRAME_CHIPS;
    if (CH && CH.PROCESSORS[brandId]) {
      c.absorbedChips = c.absorbedChips || { processors: [], cmos: [] };
      (CH.PROCESSORS[brandId] || []).forEach(p => {
        if (!c.absorbedChips.processors.some(x => x.id === p.id)) { c.absorbedChips.processors.push(p); absorbed.chips.push(p.name); }
      });
      (CH.CMOS_MODELS[brandId] || []).forEach(m => {
        if (!c.absorbedChips.cmos.some(x => x.id === m.id)) { c.absorbedChips.cmos.push(m); absorbed.chips.push(m.name); }
      });
    }

    // 5) 渠道：接管它在你没有优势的区域
    const snap = game.market.snapshot;
    if (snap && snap.regions) {
      c.regionInvest = c.regionInvest || {};
      snap.regions.regions.forEach(r => {
        const row = (r.list || []).find(e => e.id === brandId);
        if (!row || row.share < r.playerShare) return;
        const cur = c.regionInvest[r.id] || { level: 0, monthsLeft: 0 };
        cur.level = Math.min(4, cur.level + 1);
        cur.monthsLeft = Math.max(cur.monthsLeft || 0, 12);
        c.regionInvest[r.id] = cur;
        absorbed.regions++;
      });
    }

    brand.acquired = true;
    brand.acquiredBy = c.id;
    brand.acquiredMonth = game.monthIndex;
    brand.absorbedShare = snapshotShare(game, brandId) || 0;
    brand.share = 0;
    brand.absorbedCatalog = def ? (def.catalog || []).length : 0;

    // 6) 代价：口碑下滑 + 全行业敌意
    if (c.awareness != null) c.awareness = Math.min(100, c.awareness + 4);
    if (c.reputation != null) c.reputation = Math.max(0, c.reputation - 5);
    Object.keys(game.diplomacy || {}).forEach(id => {
      if (id === brandId) return;
      game.diplomacy[id].attitude = clampNum((game.diplomacy[id].attitude || 0) - 20, -100, 100);
    });

    game.stats = game.stats || {};
    game.stats.acquisitions = (game.stats.acquisitions || 0) + 1;
    game.stats.acquiredBrands = game.stats.acquiredBrands || [];
    if (game.stats.acquiredBrands.indexOf(brandId) < 0) game.stats.acquiredBrands.push(brandId);

    if (typeof E.addNews === 'function') {
      try {
        E.addNews(game, {
          tag: '收购', title: `${c.name} 完成对 ${brand.name} 的收购`,
          text: `交易金额 ${costCny(cost)}。并入 ${absorbed.products} 条产品线、${absorbed.chips.length} 颗自有芯片、${absorbed.regions} 个区域渠道。全行业震动。`,
          tone: 'bad', color: c.color
        });
      } catch (e) { /* ignore */ }
    }
    return { ok: true, cost, brand, absorbed };
  }

  // 把被收购方的机型变成玩家产品（继承 72% 规格，保留品牌基因）
  function buildAbsorbedProduct(game, company, seed, brand, idx) {
    try {
      const p = E.buildSeedCamera(seed, company, game, idx);
      if (!p) return null;
      p.name = `${seed.name}（原 ${brand.name}）`;
      p.fromAcquisition = brand.id;
      p.overall = Math.max(50, Math.round((p.overall || 70) * 0.72 + (company.reputation || 60) * 0.18));
      p.price = Math.round((p.price || 8000) * 0.9 / 100) * 100;
      p.unitCost = Math.round((p.unitCost || 4000) * 1.02);
      p.stock = Math.max(60, Math.round((p.stock || 0) * 0.5));
      p.status = 'active';
      return p;
    } catch (e) { return null; }
  }

  function acquireByFocus(game, node, report) {
    if (!node.acquire) return;
    const target = (game.market.aiBrands || []).find(b => b.id === node.acquire);
    if (!target || target.acquired) return;
    const res = acquireBrand(game, node.acquire, { viaFocus: true, force: true });
    if (res.ok && report && report.acquisitions) report.acquisitions.push({ name: res.brand.name, cost: res.cost });
    if (res.ok && report && !report.acquisitions) report.acquisitions = [{ name: res.brand.name, cost: res.cost }];
    node._acquiredDone = true;
  }
  function costCny(v) {
    if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(2) + ' 亿';
    return Math.round(v / 10000) + ' 万';
  }

  /* ---------- diplomacy ---------- */
  function initDiplomacyState(game) {
    if (!game.diplomacy) game.diplomacy = {};
    (game.market && game.market.aiBrands || []).forEach(b => {
      if (b.id === game.company.id) return;
      if (!game.diplomacy[b.id]) {
        game.diplomacy[b.id] = { attitude: 0, trust: 30, contracts: [], acquired: false };
      }
    });
    return game.diplomacy;
  }

  /* ---------- AI focus ---------- */
  function aiNodeState(brand, node) {
    const done = brand.focus && brand.focus.completed || [];
    const queue = brand.focus && brand.focus.queue || [];
    if (done.indexOf(node.id) >= 0) return 'done';
    if (queue.indexOf(node.id) >= 0) return 'active';
    if ((node.excludes || []).some(id => done.indexOf(id) >= 0)) return 'excluded';
    if (!requiresMetWith(done, node)) return 'locked';
    return 'ready';
  }
  function aiPickFocus(game, brand) {
    if (!brand.focus) brand.focus = { completed: [], queue: [], fp: 3, pc: 0 };
    if ((brand.focus.queue || []).length >= 1) return null;
    const tree = FOCUS_TREES[brand.id] || FOCUS_TREES.startup_dev;
    if (!tree) return null;
    const candidates = (tree.nodes || []).filter(n => aiNodeState(brand, n) === 'ready' && true || Number(n.cost || 0) <= Number(brand.focus.fp || 0));
    if (!candidates.length) return null;
    // aggression pushes toward the destructive / expansionist branches
    const aggression = Number(brand.aggression || 0.5);
    const weights = candidates.map(n => {
      let w = 1;
      if (n.branch === 'sensor' || n.branch === 'business') w += aggression * 1.2;
      if (n.branch === 'brand') w += (1 - aggression) * 0.8;
      if (n.excludes && n.excludes.length) w += 0.8;
      if (Number(n.row) <= 1) w += 0.6;
      return { n, w };
    });
    const total = weights.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    let chosen = weights[weights.length - 1].n;
    for (let i = 0; i < weights.length; i++) { r -= weights[i].w; if (r <= 0) { chosen = weights[i].n; break; } }
    return chosen;
  }
  function advanceAIFocus(game, brand) {
    const f = brand.focus;
    if (!f) return null;
    f.fp = Number(f.fp || 0) + AI_FP_PER_MONTH;
    if (f.pc == null) f.pc = 0;
    f.pc += Math.random() < 0.5 ? 1 : 0;
    if (!f.progress) f.progress = {};
    let completed = null;
    (f.queue || []).slice().forEach(id => {
      const node = nodeById(brand.id, id);
      if (!node) { f.queue = f.queue.filter(x => x !== id); return; }
      const pr = f.progress[id] || (f.progress[id] = { months: 0, total: Math.max(1, node.months || 1) });
      pr.months += 1;
      if (pr.months >= pr.total) {
        f.queue = f.queue.filter(x => x !== id);
        f.completed.push(id);
        delete f.progress[id];
        completed = node;
      }
    });
    if (!completed) {
      const chosen = aiPickFocus(game, brand);
      if (chosen) {
        f.fp -= Number(chosen.cost || 0);
        f.queue.push(chosen.id);
        f.progress[chosen.id] = { months: 0, total: Math.max(1, chosen.months || 1) };
      }
    }
    return completed;
  }
  function aiFocusFactor(game, brandId) {
    const brand = (game.market.aiBrands || []).find(b => b.id === brandId);
    const f = (game.focus && game.focus.modifiers) || null;
    const push = f && f.sharePush ? Number(f.sharePush[brandId] || 0) : 0;
    let mult = 1;
    if (brand && brand.focus && brand.focus.completed) {
      const tree = FOCUS_TREES[brand.id];
      if (tree) {
        const map = treeNodeMap(tree);
        brand.focus.completed.forEach(id => {
          const n = map[id];
          if (!n || !n.effects) return;
          const e = n.effects;
          if (e.cost && e.cost.total) mult *= 1 + (1 - e.cost.total) * 1.2;
          if (e.demand) { const avg = Object.values(e.demand).reduce((s, v) => s + v, 0) / Object.keys(e.demand).length; mult *= 1 + (avg - 1) * 0.8; }
          if (e.tech) mult *= 1.03;
        });
      }
    }
    // the player's focus can directly squeeze a specific rival
    mult *= (1 + Math.min(0.45, push * 0.09));
    return mult;
  }

  /* ---------- display helpers ---------- */
  function effectSummary(node) {
    const e = node.effects || {};
    const parts = [];
    if (e.tech) Object.keys(e.tech).forEach(k => parts.push(`${(D.TECHS[k] && D.TECHS[k].name) || k} +${e.tech[k]}`));
    if (e.rnd) parts.push(`研发速度 ×${e.rnd}`);
    if (e.chip) parts.push(`芯片研发力 ×${e.chip}`);
    if (e.talent) parts.push(`团队效率 ×${e.talent}`);
    if (e.salary) parts.push(`人力成本 ×${e.salary}`);
    if (e.qc) parts.push(`品控缺陷 ×${e.qc}`);
    if (e.cost && e.cost.total) parts.push(`单位成本 ×${e.cost.total}`);
    if (e.cost && e.cost.sensor) parts.push(`传感器成本 ×${e.cost.sensor}`);
    if (e.cost && e.cost.af) parts.push(`对焦模组成本 ×${e.cost.af}`);
    if (e.demand) Object.keys(e.demand).forEach(k => {
      const cat = (D.CATEGORIES[k] && D.CATEGORIES[k].short) || k;
      parts.push(`${cat}需求 ×${e.demand[k]}`);
    });
    if (e.sharePush) Object.keys(e.sharePush).forEach(k => {
      if (e.sharePush[k]) parts.push(`从对手抢份额 +${e.sharePush[k]}`);
    });
    if (e.aiRelations) Object.keys(e.aiRelations).forEach(k => parts.push(`${k} 态度 ${e.aiRelations[k] > 0 ? '+' : ''}${e.aiRelations[k]}`));
    if (e.cash) parts.push(`现金 ${e.cash > 0 ? '+' : ''}${costCny(e.cash)}`);
    if (e.fp) parts.push(`决策点数 +${e.fp}`);
    if (e.pc) parts.push(`政治资本 +${e.pc}`);
    if (e.awareness) parts.push(`认知月增 ${e.awareness > 0 ? '+' : ''}${e.awareness}`);
    if (e.reputation) parts.push(`口碑月增 ${e.reputation > 0 ? '+' : ''}${e.reputation}`);
    if (e.launch) parts.push('发布会加成');
    return parts.join(' · ') || '无直接数值修正';
  }

  window.FocusEngine = {
    FOCUS_TREES, BRANCH_LABELS, BRANCH_COLORS, FP_PER_MONTH, MAX_ACTIVE_FOCUS,
    bindGame, currentGame,
    treeFor, nodeById, treeNodeMap, initFocusState, normalizeFocusState,
    nodeState, nodeBlockReason, availableNodes, reqGroups, requiresMet, requiresMetWith, missingGroups, branchProgress, routeLabel,
    startFocus, cancelFocus, monthlyFocusProgress, recalcFocusModifiers, focusMods, treeKey, treeFor, findAnyNode,
    unlockSensorModel, unlockNewModel,
    modMult, techBonus, sharePushFor,
    acquireBrand, acquisitionCost, acquisitionEligible, acquireByFocus,
    initDiplomacyState, aiNodeState, advanceAIFocus, aiFocusFactor, aiPickFocus,
    effectSummary, costCny,
    slotOfNode, ensureSlots, slotFree, slotLabel, SLOT_KEYS
  };
})();
