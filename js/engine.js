/* =========================================================
   FRAME — camera company simulator
   Game engine: design maths, costs, market, finance, R&D
   ========================================================= */
(function () {
  'use strict';

  const D = window.FRAME_DATA;
  const SAVE_KEY = 'frame.camera.company.save.v1';
  const SAVE_VERSION = 1;
  const START_YEAR = 2026;
  const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const MONTH_SHORT = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  const COMPONENT_LABELS = {
    sensor: '传感器模组', processor: '处理器与主板', screen: '显示屏与触控', viewfinder: '取景器模组',
    body: '机身结构与材质', mount: '卡口与镜头环', controls: '按键与拨轮', stabilisation: '防抖模组',
    ports: '接口模组', wireless: '无线模块', battery: '电池与电源', details: '外观细节与结构件',
    accessories: '随机器材与配件', assembly: '组装、校准与包装', manufacturing: '代工/制造成本调整',
    qc: '品控与出厂检测', total: '单机制造成本'
  };

  const MODEL_NAMING = {
    canon: { compact: 'PowerShot V', mirrorless: 'EOS R', fullframe: 'EOS R6', highres: 'EOS R5', sports: 'EOS R1', vlog: 'EOS R50 V', cinema: 'EOS C', medium: 'EOS M', action: 'PowerShot Go', retro: 'EOS RC' },
    sony: { compact: 'RX', mirrorless: 'Alpha', fullframe: 'Alpha 7', highres: 'Alpha 7R', sports: 'Alpha 1', vlog: 'ZV-E', cinema: 'FX', medium: 'Alpha MF', action: 'Action', retro: 'Alpha Retro' },
    nikon: { compact: 'Coolpix P', mirrorless: 'Z', fullframe: 'Z6', highres: 'Z8', sports: 'Z9', vlog: 'Z30', cinema: 'ZR', medium: 'Z MF', action: 'KeyMission', retro: 'Zf' },
    fujifilm: { compact: 'XQ', mirrorless: 'X-T', fullframe: 'X-Pro', highres: 'X-H', sports: 'X-HS', vlog: 'X-M', cinema: 'X-H Cine', medium: 'GFX', action: 'XP', retro: 'X100' },
    panasonic: { compact: 'Lumix TZ', mirrorless: 'Lumix G', fullframe: 'Lumix S', highres: 'Lumix S1R', sports: 'Lumix S1H', vlog: 'Lumix S9', cinema: 'Lumix GH', medium: 'Lumix MF', action: 'Lumix FT', retro: 'Lumix Retro' },
    sigma: { compact: 'fp C', mirrorless: 'fp Air', fullframe: 'fp', highres: 'fp L', sports: 'fp S', vlog: 'fp V', cinema: 'fp Cine', medium: 'fp MF', action: 'fp Go', retro: 'fp Classic' },
    tamron: { compact: 'TAM C', mirrorless: 'TAM M', fullframe: 'TAM F', highres: 'TAM R', sports: 'TAM S', vlog: 'TAM V', cinema: 'TAM Cine', medium: 'TAM G', action: 'TAM Go', retro: 'TAM H' },
    red: { cinema: 'V-RAPTOR', highres: 'RAPTOR', sports: 'RAPTOR S', medium: 'RAPTOR XL', fullframe: 'KOMODO', compact: 'KOMODO C' },
    blackmagic: { cinema: 'URSA Cine', highres: 'URSA', fullframe: 'PYXIS', compact: 'Pocket', vlog: 'Pocket V', action: 'Pocket Go', sports: 'URSA S' },
    arri: { cinema: 'ALEXA', highres: 'ALEXA 65', fullframe: 'ALEXA LF', sports: 'ALEXA S', medium: 'ALEXA 65' },
    leica: { compact: 'Q', mirrorless: 'CL', fullframe: 'SL', highres: 'SL R', sports: 'SL S', vlog: 'V-Lux', cinema: 'SL Cine', medium: 'S', retro: 'M' },
    om: { compact: 'Tough', mirrorless: 'OM', fullframe: 'OM-X', highres: 'OM-R', sports: 'OM-1', vlog: 'OM-V', cinema: 'OM-Cine', medium: 'OM-G', action: 'Tough', retro: 'OM-3' },
    dji: { compact: 'Osmo Nano', mirrorless: 'DJI M', fullframe: 'DJI F', highres: 'DJI R', sports: 'Osmo Action', vlog: 'Osmo Pocket', cinema: 'Ronin', medium: 'DJI G', action: 'Osmo Action', retro: 'Osmo Retro' },
    gopro: { action: 'HERO', vlog: 'HERO V', compact: 'GoPro C', sports: 'HERO S', cinema: 'MAX Cine' }
  };

  const AI_PRICE_PREMIUM = {
    canon: 1.03, sony: 1.1, nikon: 1.02, fujifilm: 1.08, panasonic: 0.96, sigma: 0.94,
    tamron: 0.82, red: 3.4, blackmagic: 0.92, arri: 6.2, leica: 2.5, om: 0.92, dji: 0.9, gopro: 0.72
  };

  const LENS_MOUNT_PREFIX = {
    RF: 'RF', Z: 'NIKKOR Z', E: 'FE', X: 'XF', L: 'LUMIX S', EF: 'EF', F: 'NIKKOR F',
    PL: 'Cine PL', M43: 'M.Zuiko', GFX: 'GF', M: 'Summicron-M', K: 'HD', B4: 'B4', FIXED: ''
  };

  const BASE_LENS_MARKET = {
    E: 5200, Z: 2800, RF: 3400, X: 2300, L: 2100, EF: 1700, F: 1000, PL: 620,
    M43: 1700, GFX: 240, M: 520, K: 160, B4: 120, FIXED: 0
  };

  const ACCESSORY_VISUALS = ['batteryGrip', 'verticalGrip', 'mic', 'monitor', 'fan', 'cage', 'shoulder', 'wireless', 'flash'];

  // ---------- generic helpers ----------
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function round(v, step) { step = step || 1; return Math.round(v / step) * step; }
  function maybe(p) { return Math.random() < p; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function deepClone(obj) { return obj == null ? obj : JSON.parse(JSON.stringify(obj)); }
  function uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 99999).toString(36); }
  function pct(v, digits) { return (v * 100).toFixed(digits == null ? 1 : digits) + '%'; }
  function roman(n) { return ROMAN[n] || String(n); }
  function escapeHTML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function money(v, options) {
    options = options || {};
    const abs = Math.abs(v || 0);
    const sign = v < 0 ? '-' : (options.signed ? '+' : '');
    if (abs >= 100000000) {
      const n = abs / 100000000;
      return sign + '¥' + n.toFixed(options.digits != null ? options.digits : (n >= 100 ? 0 : 2)) + '亿';
    }
    if (abs >= 10000) {
      const n = abs / 10000;
      return sign + '¥' + n.toFixed(options.digits != null ? options.digits : (n >= 1000 ? 0 : (n >= 100 ? 1 : 2))) + '万';
    }
    return sign + '¥' + Math.round(abs).toLocaleString('zh-CN');
  }
  function moneyNumber(v) {
    return '¥' + Math.round(v || 0).toLocaleString('zh-CN');
  }
  function units(v) {
    const n = Math.round(v || 0);
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万台';
    return n.toLocaleString('zh-CN') + '台';
  }
  function pctNum(v, digits) { return (v || 0).toFixed(digits == null ? 1 : digits) + '%'; }
  function monthLabel(index) {
    const y = START_YEAR + Math.floor(index / 12);
    const m = ((index % 12) + 12) % 12;
    return y + '年' + MONTH_NAMES[m];
  }
  function monthShort(index) {
    const y = START_YEAR + Math.floor(index / 12);
    const m = ((index % 12) + 12) % 12;
    return y + '.' + MONTH_SHORT[m];
  }
  function seasonMonth(index) { return ((index % 12) + 12) % 12; }

  function hexToRgb(hex) {
    let h = String(hex || '#222222').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '222222';
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgbToHex(r, g, b) {
    const f = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return '#' + f(r) + f(g) + f(b);
  }
  function shade(hex, amt) {
    const c = hexToRgb(hex);
    return rgbToHex(c.r + 255 * amt, c.g + 255 * amt, c.b + 255 * amt);
  }
  function colorStats(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { r, g, b, h, s, l, brightness: l, neutral: s < 0.16 };
  }
  function distanceHue(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function getCategory(id) { return D.CATEGORIES[id] || D.CATEGORIES.mirrorless; }
  function getCompany(id) { return D.COMPANIES.find(c => c.id === id); }
  function getManufacturing(company) {
    if (company && company.manufacturingMode === 'self') {
      const f = D.FACTORY_LEVELS[company.ownFactoryLevel || 0];
      if (f && f.capacity > 0) {
        return { id: 'self', mode: 'self', name: f.name, capacity: f.capacity, costFactor: f.cost, quality: 1.0 + (company.ownFactoryLevel || 0) * 0.008, fee: 0, upkeep: f.upkeep, desc: f.desc };
      }
    }
    const p = D.ODM_PARTNERS[company && company.odmPartner] || D.ODM_PARTNERS.luxshare;
    return { id: p.id, mode: 'partner', name: p.name, capacity: p.capacity, costFactor: p.cost, quality: p.quality, fee: p.fee, upkeep: 0, desc: p.desc };
  }
  function getFactoryUpkeep(company) {
    const f = D.FACTORY_LEVELS[company && company.ownFactoryLevel || 0];
    return f ? f.upkeep : 0;
  }
  function getSensorSupplier(company) {
    const s = D.SENSOR_SUPPLIERS[company && company.sensorSupplier] || D.SENSOR_SUPPLIERS.sony_semi;
    if (s.id === 'inhouse' && (company.tech.sensor || 1) < (s.minSensorTech || 4)) {
      return Object.assign({}, D.SENSOR_SUPPLIERS.sony_semi, { invalidChoice: true });
    }
    return s;
  }

  // ---------- chip lab: in-house CMOS / AF ----------
  function chipLabLevel(company) {
    return clamp(Number(company && company.chipLabLevel || 0), 0, D.CHIP_LAB_LEVELS.length - 1);
  }
  function chipLabDef(company) {
    return D.CHIP_LAB_LEVELS[chipLabLevel(company)] || D.CHIP_LAB_LEVELS[0];
  }
  function chipPower(company) {
    return Math.max(10, researchPower(company) * 0.55 * (1 + chipLabLevel(company) * 0.08));
  }
  function chipSlots(company) {
    return chipLabDef(company).slots || 1;
  }
  function chipLabUpkeep(company) {
    return chipLabDef(company).upkeep || 0;
  }
  function latestChip(chips) {
    return (chips || []).slice().sort((a, b) =>
      (Number(b.builtMonth) || 0) - (Number(a.builtMonth) || 0) ||
      (Number(b.generation) || 0) - (Number(a.generation) || 0)
    )[0] || null;
  }
  function findCmosChip(company, id) {
    return (company && company.cmosChips || []).find(c => c.id === id) || null;
  }
  function findAfChip(company, id) {
    return (company && company.afChips || []).find(c => c.id === id) || null;
  }
  function bestCmosChip(company, format, mp, type) {
    const pool = (company && company.cmosChips || []).filter(c =>
      c.format === format && c.type === type && Number(mp) <= Number(c.mp)
    );
    return pool.sort((a, b) => (b.mp - a.mp) || (b.generation - a.generation))[0] || null;
  }
  function bestAfChip(company) {
    return latestChip(company && company.afChips);
  }
  function resolveDesignChips(design, company) {
    const chip = (design && design.chip) || {};
    const cmosSource = chip.cmosSource === 'inhouse' ? 'inhouse' : 'procure';
    const afSource = chip.afSource === 'inhouse' ? 'inhouse' : 'procure';
    const warnings = [];
    let cmos = null;
    let af = null;
    if (cmosSource === 'inhouse') {
      cmos = findCmosChip(company, chip.cmosId) || bestCmosChip(company, design.sensor.format, design.sensor.mp, design.sensor.type);
      if (!cmos) {
        warnings.push('尚未完成可用的自研 CMOS 项目，本机按采购传感器估算成本与画质。');
      } else if (cmos.format !== design.sensor.format) {
        warnings.push(`自研 CMOS 为 ${D.SENSOR_FORMATS[cmos.format] ? D.SENSOR_FORMATS[cmos.format].name : cmos.format} 画幅，与当前 ${D.SENSOR_FORMATS[design.sensor.format].name} 传感器不匹配，本机按采购方案估算。`);
        cmos = null;
      } else if (cmos.type !== design.sensor.type) {
        warnings.push(`自研 CMOS 为 ${D.SENSOR_TYPES[cmos.type] ? D.SENSOR_TYPES[cmos.type].name : cmos.type} 结构，与当前传感器结构不匹配，本机按采购方案估算。`);
        cmos = null;
      } else if (Number(design.sensor.mp) > Number(cmos.mp)) {
        warnings.push(`自研 CMOS 最高 ${cmos.mp}MP，无法覆盖当前 ${design.sensor.mp}MP，本机按采购方案估算。`);
        cmos = null;
      }
    }
    if (afSource === 'inhouse') {
      af = findAfChip(company, chip.afId) || bestAfChip(company);
      if (!af) warnings.push('尚未完成自研对焦芯片，本机按采购 AF 模组估算。');
    }
    return { cmosSource, afSource, cmos, af, warnings };
  }
  function normalizeChipDraft(design, company) {
    if (!design || !design.sensor) return design;
    design.chip = design.chip || {};
    if (design.chip.cmosSource !== 'inhouse') design.chip.cmosSource = 'procure';
    if (design.chip.afSource !== 'inhouse') design.chip.afSource = 'procure';
    if (design.chip.cmosSource === 'inhouse' && !findCmosChip(company, design.chip.cmosId)) {
      const best = bestCmosChip(company, design.sensor.format, design.sensor.mp, design.sensor.type);
      if (best) design.chip.cmosId = best.id;
      else { design.chip.cmosSource = 'procure'; design.chip.cmosId = null; }
    }
    if (design.chip.afSource === 'inhouse' && !findAfChip(company, design.chip.afId)) {
      const best = bestAfChip(company);
      if (best) design.chip.afId = best.id;
      else { design.chip.afSource = 'procure'; design.chip.afId = null; }
    }
    return design;
  }
  function applyCmosChipToDraft(draft, chip) {
    if (!draft || !chip) return false;
    draft.sensor.format = chip.format;
    draft.sensor.mp = chip.mp;
    draft.sensor.type = chip.type;
    draft.chip = draft.chip || {};
    draft.chip.cmosSource = 'inhouse';
    draft.chip.cmosId = chip.id;
    return true;
  }
  function applyAfChipToDraft(draft, chip) {
    if (!draft || !chip) return false;
    draft.chip = draft.chip || {};
    draft.chip.afSource = 'inhouse';
    draft.chip.afId = chip.id;
    return true;
  }
  function chipProgramEstimate(company, kind, config) {
    config = config || {};
    const lab = chipLabDef(company);
    const budget = D.CMOS_BUDGETS[config.budget] || D.CMOS_BUDGETS.balanced;
    if (kind === 'cmos') {
      const target = D.CMOS_TARGETS[config.target] || D.CMOS_TARGETS.ff;
      const type = D.SENSOR_TYPES[config.type] || D.SENSOR_TYPES.bsi;
      const mp = Number(config.mp) || target.mpOptions[0];
      const tech = company.tech || {};
      if ((tech.sensor || 1) < target.tech) return { ok: false, error: `自研 ${target.name} CMOS 需要传感器技术 Lv.${target.tech}。` };
      if ((tech.sensor || 1) < type.tech) return { ok: false, error: `${type.name} 结构需要传感器技术 Lv.${type.tech}。` };
      if (!target.mpOptions.includes(mp)) return { ok: false, error: '目标像素不在该画幅的自研范围内。' };
      const cost = Math.round(target.baseCost * budget.costMult * (0.78 + type.cost * 0.28) / 100000) * 100000;
      const months = Math.max(2, Math.round((target.months * budget.monthsMult + (type.tech - 2) * 1.2) * 10) / 10);
      const points = Math.round(months * chipPower(company) * 0.9);
      const quality = clamp(Math.round((type.quality || 0) + budget.quality + lab.quality + Math.max(0, (tech.sensor || 1) - target.tech) * 1.6), 1, 24);
      const costFactor = clamp(0.74 - (budget.id === 'aggressive' ? 0.05 : 0) - lab.level * 0.018 - Math.max(0, (tech.sensor || 1) - 4) * 0.012, 0.52, 0.72);
      const defect = clamp(budget.defect * (1 - lab.level * 0.03), 0.8, 1.25);
      return {
        ok: true, kind, config: { target: target.id, mp, type: type.id, budget: budget.id },
        name: `自研 ${target.name} ${mp}MP ${type.name}`,
        cost, months, points, quality, costFactor, defect, target, type, budget,
        spec: { format: target.format, mp, type: type.id, quality, costFactor, defect }
      };
    }
    const arch = D.AF_ARCHITECTURES[config.arch] || D.AF_ARCHITECTURES.fullpixel;
    const tier = D.AF_TIERS[config.tier] || D.AF_TIERS.advanced;
    const tech = company.tech || {};
    if ((tech.af || 1) < arch.tech) return { ok: false, error: `自研 ${arch.name} 需要对焦技术 Lv.${arch.tech}。` };
    const cost = Math.round(arch.baseCost * tier.costMult * budget.costMult / 100000) * 100000;
    const months = Math.max(2, Math.round(arch.months * tier.monthsMult * budget.monthsMult * 10) / 10);
    const points = Math.round(months * chipPower(company) * 0.9);
    const bonus = Math.max(2, Math.round(arch.bonus + tier.bonus + budget.quality * 0.6 + lab.quality * 0.5 + (tech.af || 1) * 0.4));
    const costDelta = Math.round(arch.costDelta * (0.9 + lab.level * 0.05));
    return {
      ok: true, kind, config: { arch: arch.id, tier: tier.id, budget: budget.id },
      name: `自研 ${arch.name} · ${tier.name}`,
      cost, months, points, bonus, costDelta, arch, tier, budget,
      spec: { bonus, costDelta, arch: arch.id, tier: tier.id }
    };
  }
  function startChipProgram(game, kind, config) {
    const c = game.company;
    const estimate = chipProgramEstimate(c, kind, config);
    if (!estimate.ok) return estimate;
    const active = (c.chipPrograms || []).length;
    if (active >= chipSlots(c)) return { ok: false, error: `芯片实验室最多同时进行 ${chipSlots(c)} 个项目。` };
    if (c.cash < estimate.cost) return { ok: false, error: `现金不足，立项需要 ${moneyNumber(estimate.cost)}。` };
    c.cash -= estimate.cost;
    c.stats = c.stats || {};
    game.stats.rdSpend = (game.stats.rdSpend || 0) + estimate.cost;
    const program = {
      id: uid('chip'),
      kind,
      name: estimate.name,
      config: estimate.config,
      cost: estimate.cost,
      requiredPoints: estimate.points,
      progress: 0,
      startedMonth: game.monthIndex,
      status: 'active',
      estimate
    };
    c.chipPrograms = c.chipPrograms || [];
    c.chipPrograms.push(program);
    addOneOff(game, `芯片研发：${estimate.name}`, estimate.cost, '研发');
    addNews(game, {
      tag: '芯片', title: `${c.name} 启动${kind === 'cmos' ? '自研 CMOS' : '自研对焦芯片'}项目`,
      text: `${estimate.name} · 预算 ${moneyNumber(estimate.cost)} · 预计 ${estimate.months} 个月。`,
      tone: 'good', color: c.color
    });
    return { ok: true, program, estimate };
  }
  function completeChipProgram(game, program, report) {
    const c = game.company;
    const estimate = program.estimate || {};
    const seq = c.chipSeq || 1;
    c.chipSeq = seq + 1;
    const generation = program.kind === 'cmos' ? (c.cmosChips || []).length + 1 : (c.afChips || []).length + 1;
    let chip;
    if (program.kind === 'cmos') {
      const target = D.CMOS_TARGETS[estimate.config.target] || D.CMOS_TARGETS.ff;
      chip = {
        id: `${c.id || 'chip'}-cmos-${seq}`,
        kind: 'cmos',
        name: `${c.name} ${target.name} ${estimate.config.mp}MP 自研 CMOS`,
        shortName: `自研 ${target.name} ${estimate.config.mp}MP`,
        format: estimate.config.format || target.format,
        mp: estimate.config.mp,
        type: estimate.config.type,
        costFactor: estimate.costFactor,
        quality: estimate.quality,
        defect: estimate.defect,
        generation,
        builtMonth: game.monthIndex,
        programId: program.id
      };
      c.cmosChips = c.cmosChips || [];
      c.cmosChips.push(chip);
    } else {
      const arch = D.AF_ARCHITECTURES[estimate.config.arch] || D.AF_ARCHITECTURES.fullpixel;
      const tier = D.AF_TIERS[estimate.config.tier] || D.AF_TIERS.advanced;
      chip = {
        id: `${c.id || 'chip'}-af-${seq}`,
        kind: 'af',
        name: `${c.name} ${arch.name} · ${tier.name}`,
        shortName: `${arch.name} ${tier.name}`,
        bonus: estimate.bonus,
        costDelta: estimate.costDelta,
        arch: estimate.config.arch,
        tier: estimate.config.tier,
        generation,
        builtMonth: game.monthIndex,
        programId: program.id
      };
      c.afChips = c.afChips || [];
      c.afChips.push(chip);
    }
    c.chipPrograms = (c.chipPrograms || []).filter(p => p.id !== program.id);
    game.stats.chipsDeveloped = (game.stats.chipsDeveloped || 0) + 1;
    if (report) {
      report.chipCompleted = report.chipCompleted || [];
      report.chipCompleted.push({ name: chip.name, kind: chip.kind });
    }
    addNews(game, {
      tag: '芯片', title: `${c.name} 完成${chip.kind === 'cmos' ? '自研 CMOS' : '自研 AF 芯片'}`,
      text: `${chip.name} 已进入可用芯片库。${chip.kind === 'cmos' ? '单位成本与画质将优于外购方案。' : '对焦性能与成本将获得改善。'}`,
      tone: 'good', color: c.color
    });
    return chip;
  }
  function monthlyChipProgress(game, report) {
    const c = game.company;
    const active = c.chipPrograms || [];
    if (!active.length) return;
    const power = chipPower(c) / active.length;
    const finished = [];
    active.forEach(program => {
      program.progress = (program.progress || 0) + power;
      if (!program.lastProgress) program.lastProgress = 0;
      if (!report.chipProgress) report.chipProgress = [];
      report.chipProgress.push({
        name: program.name, kind: program.kind,
        before: program.progress - power, after: program.progress,
        required: program.requiredPoints,
        progress: clamp(program.progress / Math.max(1, program.requiredPoints) * 100, 0, 100)
      });
      if (program.progress >= program.requiredPoints) finished.push(program);
    });
    finished.forEach(program => completeChipProgram(game, program, report));
  }
  function upgradeChipLab(game) {
    const c = game.company;
    const level = chipLabLevel(c);
    const def = D.CHIP_LAB_LEVELS[level];
    if (!def || def.upgradeCost == null) return { ok: false, error: '芯片实验室已经达到最高等级。' };
    if (c.cash < def.upgradeCost) return { ok: false, error: `现金不足，升级需要 ${moneyNumber(def.upgradeCost)}。` };
    c.cash -= def.upgradeCost;
    c.chipLabLevel = level + 1;
    addOneOff(game, `芯片实验室升级：${D.CHIP_LAB_LEVELS[level + 1].name}`, def.upgradeCost, '研发');
    addNews(game, {
      tag: '芯片', title: `${c.name} 芯片实验室升级`,
      text: `升级为 ${D.CHIP_LAB_LEVELS[level + 1].name}，可同时进行 ${D.CHIP_LAB_LEVELS[level + 1].slots} 个芯片项目，规格与良率上限提高。`,
      tone: 'good', color: c.color
    });
    return { ok: true, level: level + 1, cost: def.upgradeCost };
  }
  function setChipStrategy(game, kind, source) {
    const c = game.company;
    c.chipStrategy = c.chipStrategy || { cmos: 'procure', af: 'procure' };
    if (kind !== 'cmos' && kind !== 'af') return { ok: false, error: '未知芯片类型。' };
    if (source === 'inhouse') {
      const has = kind === 'cmos' ? (c.cmosChips || []).length : (c.afChips || []).length;
      if (!has) return { ok: false, error: '还没有可用的自研芯片，请先在芯片实验室完成一个项目。' };
      c.chipStrategy[kind] = 'inhouse';
    } else {
      c.chipStrategy[kind] = 'procure';
    }
    return { ok: true, strategy: c.chipStrategy };
  }
  function normalizeChipState(game) {
    if (!game || !game.company) return game;
    const c = game.company;
    if (c.chipLabLevel == null) c.chipLabLevel = ((c.tech && c.tech.sensor >= 5) ? 2 : (c.tech && c.tech.sensor >= 4) ? 1 : 0);
    c.chipLabLevel = chipLabLevel(c);
    c.chipPrograms = c.chipPrograms || [];
    c.cmosChips = c.cmosChips || [];
    c.afChips = c.afChips || [];
    c.chipSeq = c.chipSeq || 1;
    c.chipStrategy = Object.assign({ cmos: 'procure', af: 'procure' }, c.chipStrategy || {});
    // Legacy in-house supplier saves: grant a starter chip so old strategies still work.
    if (c.sensorSupplier === 'inhouse' && !c.cmosChips.length) {
      const fmt = (c.tech && c.tech.sensor >= 5) ? 'ff' : 'apsc';
      const type = (c.tech && c.tech.sensor >= 4) ? 'stacked' : 'bsi';
      const mp = fmt === 'ff' ? 45 : 26;
      c.cmosChips.push({
        id: `${c.id || 'chip'}-cmos-1`, kind: 'cmos', name: `${c.name} 自研 ${D.SENSOR_FORMATS[fmt].name} ${mp}MP CMOS`,
        shortName: `自研 ${D.SENSOR_FORMATS[fmt].name} ${mp}MP`,
        format: fmt, mp, type, costFactor: 0.68, quality: 5, defect: 1, generation: 1, builtMonth: game.monthIndex || 0, legacy: true
      });
      c.chipSeq = Math.max(2, c.chipSeq);
      c.chipStrategy.cmos = 'inhouse';
      c.chipLabLevel = Math.max(1, c.chipLabLevel);
    }
    if (c.sensorSupplier === 'inhouse') c.sensorSupplier = c.id === 'canon' ? 'canon_semi' : 'sony_semi';
    if (game.drafts) {
      if (game.drafts.camera) { normalizeChipDraft(game.drafts.camera, c); normalizeLaunchEvent(game.drafts.camera, c); }
      if (game.drafts.lens) { normalizeChipDraft(game.drafts.lens, c); normalizeLaunchEvent(game.drafts.lens, c); }
    }
    game.launchEvents = game.launchEvents || [];
    game.stats = game.stats || {};
    game.stats.chipsDeveloped = game.stats.chipsDeveloped || 0;
    return game;
  }
  function researchPower(company) {
    return 20 + Math.sqrt(Math.max(0, company.staff.engineers || 0)) * 22 * (1 + Math.min(0.3, (company.tech.software || 1) * 0.015));
  }
  function monthlySalaryBill(company) {
    return Object.keys(company.staff).reduce((total, key) => total + (company.staff[key] || 0) * (D.STAFF_ROLES[key] ? D.STAFF_ROLES[key].salary : 0), 0);
  }
  function companyStaffCount(company) {
    return Object.keys(company.staff).reduce((total, key) => total + (company.staff[key] || 0), 0);
  }

  function maxMPFor(formatId, company) {
    const fmt = D.SENSOR_FORMATS[formatId];
    if (!fmt) return 40;
    const tech = clamp(company.tech.sensor || 1, 1, 5);
    return Math.round(fmt.maxMPBase + tech * fmt.maxMPPerLevel);
  }
  function minVideoTechFor(res, fps) {
    if (res === '12K') return 5;
    const base = D.VIDEO_RES[res] ? D.VIDEO_RES[res].level : 1;
    let extra = 0;
    if (fps > 120) extra = 2;
    else if (fps > 60) extra = 1;
    else if (fps > 30 && res !== '1080p') extra = 0;
    return Math.max(1, base + extra);
  }
  function videoComboAllowed(res, fps, videoTech) {
    return videoTech >= minVideoTechFor(res, fps);
  }
  function bestAllowedVideoFps(res, videoTech, desired) {
    const options = D.FPS_OPTIONS.filter(f => videoComboAllowed(res, f, videoTech));
    if (!options.length) return 30;
    return options.includes(desired) ? desired : options[options.length - 1];
  }

  function formatFactor(formatId) {
    const fmt = D.SENSOR_FORMATS[formatId] || D.SENSOR_FORMATS.ff;
    return fmt.index || 4;
  }
  function qualityTier(score) {
    if (score >= 92) return { label: '传奇', tone: 'gold' };
    if (score >= 85) return { label: '旗舰', tone: 'good' };
    if (score >= 76) return { label: '优秀', tone: 'good' };
    if (score >= 65) return { label: '均衡', tone: 'neutral' };
    if (score >= 52) return { label: '争议', tone: 'warn' };
    return { label: '失败', tone: 'bad' };
  }
  function starRating(score) {
    const s = clamp(score / 20, 0, 5);
    return Math.round(s * 2) / 2;
  }

  // ---------- default content ----------
  function designPaletteFor(company) {
    const d = company.design || {};
    const main = d.mainColor || (company.isReal ? '#202223' : '#2a2d2d');
    const top = d.topColor || shade(main, 0.1);
    const grip = d.gripColor || shade(main, -0.045);
    const side = d.sideColor || shade(main, -0.03);
    return {
      main, top, grip, side,
      accent: d.accent || (company.accentColor || '#d5a734'),
      nameplate: '#d8d5cc', button: shade(main, 0.22), dial: shade(main, 0.17)
    };
  }

  function recommendedMount(categoryId, company) {
    const cat = getCategory(categoryId);
    if (cat.mount === 'FIXED') return 'FIXED';
    const lens = (company.lensCatalog || [])[0];
    const camera = (company.catalog || []).find(c => c.mount && c.mount !== 'FIXED');
    const nativeMap = {
      canon: 'RF', sony: 'E', nikon: 'Z', fujifilm: 'X', panasonic: 'L', sigma: 'L',
      tamron: 'E', red: 'PL', blackmagic: 'PL', arri: 'PL', leica: 'L', om: 'M43', dji: 'FIXED', gopro: 'FIXED'
    };
    if (company.isReal) {
      let native = nativeMap[company.id] || (lens && lens.mount) || (camera && camera.mount) || cat.mount;
      if (categoryId === 'retro' && company.id === 'leica') native = 'M';
      if (categoryId === 'medium') native = company.id === 'fujifilm' ? 'GFX' : 'GFX';
      const def = D.MOUNTS[native];
      const fmt = D.SENSOR_FORMATS[cat.sensor];
      if (def && fmt && fmt.index <= def.maxFormat) return native;
      return cat.mount;
    }
    return cat.mount;
  }

  function suggestModelName(company, categoryId, mode) {
    const cat = getCategory(categoryId);
    const map = MODEL_NAMING[company.id] || {};
    const rawBase = map[categoryId] || (company.isReal ? (map.mirrorless || company.en || company.name) : (company.en || company.name));
    const base = String(rawBase || 'FRAME').trim();
    const existing = new Set([
      ...(mode && mode.products ? mode.products.map(p => p.name) : []),
      ...(mode && mode.lenses ? mode.lenses.map(p => p.name) : [])
    ]);
    for (let i = 1; i < 80; i++) {
      let candidate;
      if (company.isReal) {
        candidate = base + (i === 1 ? '' : ' ' + roman(i));
      } else {
        candidate = base + ' ' + cat.code + i;
      }
      if (!existing.has(candidate)) return candidate;
    }
    return base + ' ' + cat.code + 'X';
  }

  function suggestLensName(company, draft) {
    const mountPrefix = LENS_MOUNT_PREFIX[draft.mount.type] || '';
    const focal = draft.focalMin === draft.focalMax ? draft.focalMin + 'mm' : draft.focalMin + '-' + draft.focalMax + 'mm';
    const ap = draft.lensType === 'cinema' ? 'T' + Number(draft.maxAperture).toFixed(1) : 'F' + Number(draft.maxAperture).toFixed(1);
    const brandPrefix = company && company.isReal ? mountPrefix : ((company && company.en) || 'FRAME').trim().toUpperCase().slice(0, 5);
    return [brandPrefix, focal, ap].filter(Boolean).join(' ');
  }

  function makeCameraDraft(categoryId, company, overrides) {
    const cat = getCategory(categoryId);
    const bodyDef = D.BODY_TYPES[cat.body] || D.BODY_TYPES.mirrorless;
    const bd = bodyDef.defaults;
    const palette = designPaletteFor(company);
    const tech = company.tech;
    const design = company.design || {};

    let width = bd.width, height = bd.height, depth = bd.depth;
    if (categoryId === 'sports') { width += 5; height += 18; depth += 5; }
    else if (categoryId === 'highres') { height += 3; }
    else if (categoryId === 'vlog') { height -= 4; width -= 2; }
    else if (categoryId === 'cinema') { width += 2; height += 3; }
    else if (categoryId === 'retro') { width -= 2; height -= 1; }

    let mp = { one: 20, m43: 20, apsc: 26, ff: 33, mf: 100, lf: 150 }[cat.sensor] || 26;
    if (categoryId === 'highres') mp = cat.sensor === 'mf' ? 100 : 45;
    if (categoryId === 'sports') mp = cat.sensor === 'ff' ? 24 : 20;
    if (categoryId === 'action') mp = 27;
    mp = Math.min(mp, maxMPFor(cat.sensor, company));

    let sensorType = 'cmos';
    if ((tech.sensor || 1) >= 2) sensorType = 'bsi';
    if ((categoryId === 'sports' || categoryId === 'cinema') && (tech.sensor || 1) >= 3) sensorType = 'stacked';
    if ((tech.sensor || 1) >= 4 && categoryId === 'action') sensorType = 'stacked';

    const mountType = overrides && overrides.mount ? overrides.mount : recommendedMount(categoryId, company);
    const allowedMount = D.MOUNTS[mountType] ? mountType : cat.mount;
    const screenTypeMap = {
      compact: 'fixed', action: 'fixed', vlog: 'sideflip', retro: 'fixed', cinema: 'tilt',
      mirrorless: 'tilt', fullframe: 'tilt', highres: 'tilt', sports: 'tilt', medium: 'tilt'
    };
    const screenType = screenTypeMap[categoryId] || 'tilt';
    const vfMap = {
      compact: 'none', action: 'none', gimbal: 'none', cinema: 'none', retro: 'eyelevel',
      sports: 'pro', highres: 'pro', mirrorless: 'small', fullframe: 'pro', vlog: 'small', medium: 'pro'
    };
    const viewfinderType = vfMap[categoryId] || 'pro';

    let videoRes = '4K';
    if (categoryId === 'cinema') videoRes = (tech.video || 1) >= 2 ? '6K' : '4K';
    if (categoryId === 'highres' && (tech.video || 1) >= 3) videoRes = '8K';
    let desiredFps = categoryId === 'sports' ? 120 : (categoryId === 'cinema' ? 60 : (categoryId === 'vlog' ? 60 : 30));
    const fps = bestAllowedVideoFps(videoRes, tech.video || 1, desiredFps);

    const codecList = ['h264'];
    if ((tech.codec || 1) >= 2) codecList.push('h265');
    if ((categoryId === 'cinema' || categoryId === 'vlog' || categoryId === 'highres') && (tech.codec || 1) >= 3) codecList.push('prores');
    if ((categoryId === 'cinema' || categoryId === 'highres') && (tech.codec || 1) >= 4) codecList.push('braw');
    if ((categoryId === 'cinema') && (tech.codec || 1) >= 5) codecList.push('raw');

    const afMap = ['contrast', 'contrast', 'phase', 'fullpixel', 'ai', 'ai'];
    let afSystem = afMap[clamp(tech.af || 1, 1, 5)];
    if (categoryId === 'cinema' && (tech.af || 1) < 4) afSystem = 'phase';
    const stabMap = ['none', 'none', 'three', 'five', 'advanced', 'advanced'];
    let stab = stabMap[clamp(tech.ibis || 1, 1, 5)];
    if (categoryId === 'cinema') stab = (tech.ibis || 1) >= 3 ? 'five' : 'three';
    if (categoryId === 'action') stab = (tech.ibis || 1) >= 3 ? 'advanced' : (tech.ibis || 1) >= 2 ? 'five' : 'three';
    if (categoryId === 'compact') stab = (tech.ibis || 1) >= 3 ? 'three' : 'none';

    const cardType = ['compact', 'action', 'vlog'].includes(categoryId) ? 'sd' : ((tech.video || 1) >= 3 ? 'cfe_b' : 'sd');
    const ports = ['usbc'];
    if (categoryId !== 'action') ports.push('hdmi');
    if (['vlog', 'cinema', 'highres', 'sports'].includes(categoryId)) ports.push('mic');
    if (['cinema', 'highres', 'sports'].includes(categoryId)) ports.push('headphone');
    if (categoryId === 'cinema') ports.push('dc', 'timecode_placeholder');
    if (categoryId === 'sports') ports.push('ethernet');
    const portIds = ports.filter(p => p !== 'timecode_placeholder');

    const wireless = ['wifi'];
    if (['vlog', 'compact', 'action'].includes(categoryId)) wireless.push('bluetooth');
    if (categoryId === 'cinema' && (tech.modular || 1) >= 4) wireless.push('tx');

    const buttons = {};
    Object.keys(D.CONTROLS).forEach(id => {
      const base = { shutter: { enabled: true, pos: 'top_right' }, record: { enabled: ['vlog', 'cinema', 'action'].includes(categoryId), pos: 'top_mid' }, play: { enabled: true, pos: 'back_upper_right' }, menu: { enabled: true, pos: 'back_upper_left' }, fn: { enabled: ['professional', 'sports', 'cinema'].includes(cat.target), pos: 'back_lower_right' }, c1: { enabled: ['vlog', 'cinema'].includes(categoryId), pos: 'top_left' }, c2: { enabled: categoryId === 'cinema', pos: 'back_lower_right' }, c3: { enabled: false, pos: 'side' } };
      buttons[id] = deepClone(base[id]);
    });

    const draft = {
      id: uid('draft-cam'),
      kind: 'camera',
      version: 1,
      step: 1,
      name: suggestModelName(company, categoryId, overrides && overrides.mode),
      category: categoryId,
      targetSegment: cat.target,
      body: {
        type: cat.body,
        silhouette: bd.silhouette,
        top: bd.top,
        front: bd.front,
        width: width,
        height: height,
        depth: depth,
        roundness: bd.roundness,
        gripH: bd.gripH,
        gripD: bd.gripD,
        gripCurve: bd.gripCurve,
        weatherSealed: ['sports', 'action', 'cinema'].includes(categoryId),
        finishGloss: 25
      },
      materials: {
        body: design.material || (categoryId === 'compact' || categoryId === 'action' ? 'plastic' : 'magnesium'),
        finish: design.finish || (categoryId === 'cinema' ? 'matte' : 'anodized'),
        frame: categoryId === 'action' ? 'full_rubber' : (categoryId === 'compact' ? 'plastic' : 'metal'),
        topPlate: design.topPlate || (categoryId === 'compact' ? 'hybrid' : 'metal')
      },
      colors: {
        main: palette.main,
        secondaryOn: ['retro', 'compact', 'vlog'].includes(categoryId),
        secondary: palette.top,
        grip: palette.grip,
        top: palette.top,
        side: palette.side,
        accent: palette.accent,
        nameplate: palette.nameplate,
        button: palette.button,
        dial: palette.dial,
        accentLine: ['retro', 'cinema'].includes(categoryId),
        engraving: true
      },
      controls: {
        buttons,
        dials: {
          front: categoryId !== 'action',
          rear: !['compact', 'action'].includes(categoryId),
          mode: categoryId !== 'action',
          extra: categoryId === 'cinema'
        },
        joystick: ['fullframe', 'highres', 'sports', 'cinema'].includes(categoryId),
        joystickPos: 'back_upper_right',
        touchZone: ['vlog', 'compact', 'action'].includes(categoryId) ? 'right' : 'whole',
        preset: categoryId === 'retro' ? 'retro' : (['cinema', 'vlog'].includes(categoryId) ? 'video' : 'pro')
      },
      screen: {
        type: screenType,
        size: categoryId === 'action' ? 2.4 : (categoryId === 'cinema' ? 3.5 : (categoryId === 'compact' ? 3.0 : 3.2)),
        bezel: categoryId === 'cinema' ? 8 : 5,
        touch: categoryId !== 'cinema',
        res: (tech.screen || 1) >= 4 ? '1440p' : '1080p',
        nits: (tech.screen || 1) >= 4 ? 1400 : ((tech.screen || 1) >= 2 ? 800 : 500),
        gamut: (tech.screen || 1) >= 3 ? 'p3' : 'srgb',
        refresh: (tech.screen || 1) >= 4 ? 120 : 60
      },
      viewfinder: {
        type: viewfinderType,
        pos: categoryId === 'retro' ? 'top_left' : 'top_center',
        res: (tech.screen || 1) >= 4 ? '5.76m' : '3.69m',
        magnification: categoryId === 'sports' ? 0.8 : 0.76
      },
      mount: {
        type: allowedMount,
        ringMaterial: categoryId === 'cinema' ? 'stainless' : 'aluminum',
        ringColor: categoryId === 'cinema' ? 'black' : (categoryId === 'retro' ? 'silver' : 'black'),
        align: 'center',
        ratio: categoryId === 'cinema' ? 112 : 100
      },
      details: {
        vents: ['cinema', 'sports', 'highres'].includes(categoryId),
        knurl: categoryId === 'retro',
        nameplate: true,
        redline: ['cinema', 'sports'].includes(categoryId),
        goldring: categoryId === 'retro',
        bluering: false,
        cage: false,
        handle: false,
        expansion: ['cinema', 'sports'].includes(categoryId),
        portstyling: categoryId === 'cinema'
      },
      softwareUI: categoryId === 'cinema' ? 'cinema' : categoryId === 'retro' ? 'classic' : categoryId === 'compact' || categoryId === 'action' ? 'minimal' : 'professional',
      accessories: {
        batteryGrip: false,
        verticalGrip: false,
        mic: categoryId === 'vlog',
        monitor: false,
        fan: ['cinema', 'sports'].includes(categoryId),
        cage: false,
        shoulder: false,
        wireless: false,
        flash: false,
        micPos: 'top',
        monitorSize: 5,
        batteryGripStyle: 'standard',
        verticalGripStyle: 'slim'
      },
      sensor: {
        format: cat.sensor,
        mp: mp,
        type: sensorType,
        dynamicRange: clamp(10.5 + (tech.sensor || 1) * 0.7 + (sensorType === 'stacked' ? 0.8 : 0), 9, 16),
        baseIso: cat.sensor === 'ff' ? 100 : (cat.sensor === 'apsc' ? 100 : (cat.sensor === 'mf' ? 64 : 160)),
        dualIso: (tech.sensor || 1) >= 3,
        dualIsoValue: cat.sensor === 'ff' ? 800 : 400,
        colorDepth: cat.sensor === 'mf' ? 16 : 14
      },
      performance: {
        burst: categoryId === 'sports' ? 30 : (categoryId === 'action' ? 20 : (categoryId === 'cinema' ? 4 : (categoryId === 'medium' ? 4 : (categoryId === 'highres' ? 8 : 10)))),
        shutter: categoryId === 'action' ? 'electronic' : 'mechanical',
        buffer: categoryId === 'sports' ? 300 : 120,
        afSystem: afSystem,
        afTracking: clamp(tech.af || 1, 1, 5),
        stabilization: stab,
        ibisStops: D.STABILIZATIONS[stab].stops,
        storage: (tech.trend || 0) > 0 ? ['raw', 'jpeg', 'heif'] : ['raw', 'jpeg'],
        cardSlots: ['professional', 'sports', 'cinema', 'highres'].includes(cat.target) ? 2 : 1,
        cardType: cardType
      },
      video: {
        res: videoRes,
        fps: fps,
        codecs: codecList,
        bitrate: categoryId === 'cinema' ? 1200 : (categoryId === 'vlog' ? 280 : 180),
        log: ['cinema', 'highres', 'fullframe', 'sports'].includes(categoryId),
        hlg: categoryId === 'vlog',
        rawOut: categoryId === 'cinema',
        external: categoryId === 'cinema',
        timecode: categoryId === 'cinema',
        genlock: false,
        overheatLimit: categoryId === 'cinema' ? 60 : 30
      },
      ports: portIds,
      wireless: wireless,
      battery: {
        capacity: categoryId === 'action' ? 1720 : (categoryId === 'compact' ? 1250 : (categoryId === 'cinema' ? 3350 : 2280)),
        pd: ['compact', 'vlog', 'action'].includes(categoryId) ? 45 : (categoryId === 'cinema' ? 90 : 18),
        recordLimit: categoryId === 'cinema' ? 240 : 60,
        usbPower: true,
        dummy: categoryId === 'cinema',
        externalPower: categoryId === 'cinema'
      },
      price: cat.basePrice,
      initialStock: Math.max(300, round(cat.demand * 0.035, 100)),
      qc: 'enhanced',
      certification: 'standard',
      campaign: 'social',
      launchEvent: null,
      chip: { cmosSource: 'procure', cmosId: null, afSource: 'procure', afId: null },
      kitLensId: null,
      notes: '',
      createdAt: Date.now()
    };
    if (overrides && overrides.seed) {
      Object.assign(draft, overrides.seed);
    }
    if (!D.MOUNTS[draft.mount.type]) draft.mount.type = 'E';
    // Default to the company's chip strategy where a matching in-house chip exists.
    if (!(overrides && overrides.seed)) {
      if (company.chipStrategy && company.chipStrategy.cmos === 'inhouse') {
        const cmos = bestCmosChip(company, draft.sensor.format, draft.sensor.mp, draft.sensor.type);
        if (cmos) applyCmosChipToDraft(draft, cmos);
      }
      if (company.chipStrategy && company.chipStrategy.af === 'inhouse') {
        const af = bestAfChip(company);
        if (af) applyAfChipToDraft(draft, af);
      }
    }
    normalizeChipDraft(draft, company);
    normalizeLaunchEvent(draft, company);
    // Apply the reference-derived industrial design baseline (brand DNA for a
    // takeover, category reference set for a new company) before costing.
    if (window.FrameArt && window.FrameArt.applyBrandBaseline) {
      try {
        window.FrameArt.applyBrandBaseline(draft, company, categoryId);
        const refs = window.FrameArt.referenceModels({ company, category: categoryId, limit: 5 });
        draft.referenceModelId = refs[0] ? refs[0].id : null;
        // Lock the closest real photo to the design so the designer and the
        // launched product show the same reference image. Seed products keep
        // their name-based product photo instead.
        if (!(overrides && overrides.seed) && window.FramePhoto && window.FramePhoto.forDesign) {
          const ph = window.FramePhoto.forDesign(draft, company);
          if (ph && ph.item) draft.photoId = ph.item.id;
        }
      } catch (e) { /* reference layer is optional */ }
    }
    // A first sensible price derived from cost and category, not a placeholder.
    try {
      const ev = evaluateCamera(draft, company);
      draft.price = ev.suggestedPrice;
      draft.initialStock = ev.suggestedStock;
    } catch (e) {
      draft.price = cat.basePrice;
    }
    return draft;
  }

  function makeLensDraft(company, overrides) {
    let defaultMount = (overrides && overrides.mount) || recommendedMount('mirrorless', company);
    if (defaultMount === 'FIXED') defaultMount = 'E';
    const mount = D.MOUNTS[defaultMount] ? defaultMount : 'E';
    const palette = designPaletteFor(company);
    const lens = {
      id: uid('draft-lens'),
      kind: 'lens',
      version: 1,
      step: 1,
      name: '',
      lensType: 'zoom',
      mount: { type: mount },
      coverage: mount === 'GFX' ? 'mf' : (mount === 'M43' ? 'm43' : (mount === 'X' ? 'apsc' : 'ff')),
      focalMin: 24,
      focalMax: 70,
      maxAperture: 2.8,
      minAperture: 22,
      targetSegment: 'professional',
      optical: {
        elements: 16,
        groups: 12,
        aspherical: 2,
        ed: 2,
        fluorite: 0,
        coating: (company.tech.optics || 1) >= 3 ? 'nano' : 'basic'
      },
      focus: {
        motor: (company.tech.optics || 1) >= 3 ? 'linear' : 'stm',
        minDistance: 0.38,
        breathing: (company.tech.optics || 1) >= 4 ? 'minimal' : 'normal'
      },
      stabilization: true,
      stabilizationStops: (company.tech.optics || 1) >= 3 ? 5 : 3,
      filter: 77,
      body: {
        material: 'aluminum',
        finish: 'matte',
        style: 'black_pro',
        length: 112,
        diameter: 78,
        weight: 690,
        weatherSealed: true,
        focusRing: true,
        apertureRing: true,
        focusGear: false,
        zoomGear: false,
        color: '#202323',
        ringColor: '#b58d49',
        accentStyle: 'minimal'
      },
      price: 8999,
      initialStock: 900,
      qc: 'enhanced',
      campaign: 'social',
      launchEvent: null,
      notes: '',
      createdAt: Date.now()
    };
    lens.lensType = 'zoom';
    if (overrides && overrides.prime) {
      lens.focalMin = 50;
      lens.focalMax = 50;
      lens.maxAperture = 1.8;
      lens.body.length = 86;
      lens.body.diameter = 72;
      lens.body.weight = 510;
      lens.targetSegment = 'enthusiast';
    }
    if (overrides) {
      ['lensType', 'coverage', 'focalMin', 'focalMax', 'maxAperture', 'minAperture', 'targetSegment'].forEach(k => {
        if (overrides[k] !== undefined) lens[k] = overrides[k];
      });
    }
    if (!D.LENS_TYPES[lens.lensType]) lens.lensType = 'zoom';
    lens.name = (overrides && overrides.name) || suggestLensName(company, lens);
    try {
      normalizeLaunchEvent(lens, company);
    const ev = evaluateLens(lens, company);
      lens.price = ev.suggestedPrice;
      lens.initialStock = ev.suggestedStock;
    } catch (e) {}
    return lens;
  }

  // ---------- camera evaluation ----------
  function evaluateCamera(draft, company, options) {
    options = options || {};
    const cat = getCategory(draft.category);
    const format = D.SENSOR_FORMATS[draft.sensor.format] || D.SENSOR_FORMATS.ff;
    const sensorType = D.SENSOR_TYPES[draft.sensor.type] || D.SENSOR_TYPES.cmos;
    const material = D.MATERIALS[draft.materials.body] || D.MATERIALS.magnesium;
    const finish = D.FINISHES[draft.materials.finish] || D.FINISHES.matte;
    const frame = D.FRAME_TYPES[draft.materials.frame] || D.FRAME_TYPES.metal;
    const topPlate = D.TOP_PLATES[draft.materials.topPlate] || D.TOP_PLATES.metal;
    const bodyType = D.BODY_TYPES[draft.body.type] || D.BODY_TYPES.mirrorless;
    const silhouette = D.SILHOUETTES[draft.body.silhouette] || D.SILHOUETTES.rounded;
    const topStyle = D.TOP_STYLES[draft.body.top] || D.TOP_STYLES.flat;
    const frontStyle = D.FRONT_STYLES[draft.body.front] || D.FRONT_STYLES.straight;
    const screenType = D.SCREEN_TYPES[draft.screen.type] || D.SCREEN_TYPES.fixed;
    const vf = D.VIEWFINDER_TYPES[draft.viewfinder.type] || D.VIEWFINDER_TYPES.none;
    const mount = D.MOUNTS[draft.mount.type] || D.MOUNTS.E;
    const ringMat = D.RING_MATERIALS[draft.mount.ringMaterial] || D.RING_MATERIALS.aluminum;
    const supplier = getSensorSupplier(company);
    const manufacturer = getManufacturing(company);
    const tech = company.tech;
    const warnings = [];
    const blocking = [];

    const addWarning = (text, severity, isBlocking) => {
      const w = { text, severity: severity || 'warn', blocking: !!isBlocking };
      warnings.push(w);
      if (isBlocking) blocking.push(w);
    };
    const chipState = resolveDesignChips(draft, company);
    chipState.warnings.forEach(w => addWarning(w, 'warn'));
    const cmosChip = chipState.cmos;
    const afChip = chipState.af;

    const techCheck = (key, need, label) => {
      const have = tech[key] || 1;
      if (have < need) {
        addWarning(`${label}需要${D.TECHS[key].name} Lv.${need}，当前仅 Lv.${have}。`, 'bad', true);
        return false;
      }
      return true;
    };

    // ---------------- physical / material ----------------
    const W = clamp(Number(draft.body.width) || 130, 50, 230);
    const H = clamp(Number(draft.body.height) || 90, 35, 210);
    const Dp = clamp(Number(draft.body.depth) || 70, 25, 160);
    const volumeCm3 = W * H * Dp / 1000;
    const volumeL = volumeCm3 / 1000;
    const gripVol = Math.max(0, (draft.body.gripH || 0) * (draft.body.gripD || 0) * Math.max(18, Math.min(52, W * 0.34)) / 1000 * 0.38);
    const bodyWeight = Math.round(
      60 +
      (volumeCm3 * 0.16 + gripVol) * material.density +
      format.weight * 0.42 +
      (draft.battery.capacity || 2000) * 0.027 +
      (screenType.id === 'none' ? 0 : 26) +
      (vf.id === 'none' ? 0 : 18) +
      (draft.performance.cardSlots || 1) * 6 +
      (draft.body.weatherSealed ? 38 : 0)
    );
    let accessoryWeight = ACCESSORY_VISUALS.reduce((total, key) => {
      const item = D.ACCESSORIES[key];
      if (draft.accessories[key] && item && item.weight) total += item.weight;
      return total;
    }, 0);
    if (draft.accessories.monitor && Number(draft.accessories.monitorSize) >= 7) accessoryWeight += 85;
    if (draft.accessories.batteryGrip && draft.accessories.batteryGripStyle === 'pro') accessoryWeight += 70;
    if (draft.accessories.verticalGrip && draft.accessories.verticalGripStyle === 'full') accessoryWeight += 45;
    const detailsWeight = Object.values(D.FRONT_DETAILS).reduce((total, item) => total + (draft.details[item.id] && item.weight ? item.weight : 0), 0);
    const kitLens = options.kitLens || (options.product && options.product.kitLens) || null;
    const cameraWeight = bodyWeight + accessoryWeight + detailsWeight;
    const totalWeight = cameraWeight + (kitLens ? kitLens.weight || 0 : 0);

    // ---------------- buttons & layout ----------------
    const enabledButtons = Object.keys(D.CONTROLS).filter(id => draft.controls.buttons && draft.controls.buttons[id] && draft.controls.buttons[id].enabled);
    const buttonCount = enabledButtons.length;
    const zoneCount = {};
    enabledButtons.forEach(id => {
      const c = draft.controls.buttons[id];
      zoneCount[c.pos] = (zoneCount[c.pos] || 0) + 1;
    });
    const crowdedZones = Object.keys(zoneCount).filter(z => zoneCount[z] >= 3);
    const dialCount = Object.keys(draft.controls.dials || {}).filter(k => draft.controls.dials[k]).length;
    const joystick = !!draft.controls.joystick;

    // ---------------- color analysis ----------------
    const mainColor = colorStats(draft.colors.main);
    const accentColor = colorStats(draft.colors.accent);
    const secondaryColor = draft.colors.secondaryOn ? colorStats(draft.colors.secondary) : null;
    const paletteCoherent = !secondaryColor || secondaryColor.neutral || mainColor.neutral || distanceHue(mainColor.h, secondaryColor.h) < 70;
    const vibrant = mainColor.s > 0.32 && mainColor.l > 0.24;
    const accentClash = secondaryColor && !paletteCoherent;

    // ---------------- trait model ----------------
    const knownTraits = ['looks', 'retro', 'pro', 'portability', 'handling', 'business', 'trend', 'cinema', 'consumer', 'premium'];
    const sums = {};
    knownTraits.forEach(k => sums[k] = 0);
    function addMods(mods, multiplier) {
      if (!mods) return;
      const m = multiplier == null ? 1 : multiplier;
      knownTraits.forEach(k => { if (typeof mods[k] === 'number') sums[k] += mods[k] * m; });
    }
    addMods(bodyType.mods);
    addMods(silhouette.mods);
    addMods(topStyle.mods);
    addMods(frontStyle.mods);
    addMods(screenType.mods);
    addMods(vf.mods);
    Object.values(D.FRONT_DETAILS).forEach(item => { if (draft.details[item.id]) addMods(item.mods, 1); });
    ACCESSORY_VISUALS.forEach(key => { if (draft.accessories[key]) addMods(D.ACCESSORIES[key].mods, 1); });
    if (draft.body.weatherSealed) { sums.pro += 6; sums.cinema += 2; sums.consumer += 1; }
    if (gripVol > 55) sums.pro += 2;
    if (draft.controls.preset === 'retro') sums.retro += 8;
    if (draft.controls.preset === 'video') sums.cinema += 7;
    if (draft.controls.preset === 'minimal') { sums.trend += 7; sums.business += 2; }
    if (draft.softwareUI === 'professional') { sums.pro += 3; sums.business += 2; }
    else if (draft.softwareUI === 'classic') { sums.retro += 5; sums.business += 1; }
    else if (draft.softwareUI === 'cinema') { sums.cinema += 5; sums.pro += 2; }
    else if (draft.softwareUI === 'minimal') { sums.trend += 4; sums.consumer += 3; }

    // color and material nuance
    if (mainColor.neutral) { sums.business += 7; sums.pro += 3; sums.looks += 2; }
    else {
      sums.trend += vibrant ? 8 : 4;
      sums.consumer += 3;
      sums.looks += vibrant ? 3 : 1;
    }
    if (draft.colors.secondaryOn) {
      sums.trend += 4;
      sums.looks += paletteCoherent ? 3 : -7;
      if (material.id === 'leather' || material.id === 'skin') sums.retro += 5;
    }
    if (accentColor.s > 0.45) sums.trend += 3;
    if (material.premium >= 0.7) { sums.premium += 8; sums.pro += 4; sums.looks += 5; }
    if (material.id === 'leather' || material.id === 'skin') { sums.retro += 10; sums.business += 3; sums.handling += 2; }
    if (material.id === 'rubber') { sums.handling += 6; sums.consumer += 2; sums.cinema += 2; sums.looks -= 2; }
    if (material.id === 'brass') { sums.retro += 9; sums.looks += 3; sums.portability -= 8; }
    if (material.id === 'carbon') { sums.trend += 5; sums.pro += 4; }
    if (finish.id === 'brushed' || finish.id === 'anodized') { sums.pro += 4; sums.business += 3; sums.looks += 2; }
    if (finish.id === 'enamel' || finish.id === 'plated') { sums.trend += 4; sums.retro += 2; sums.consumer += 2; }
    if (finish.id === 'leathergrain') { sums.retro += 5; }
    if (finish.id === 'rubberized' || finish.id === 'powder') { sums.handling += 2; }
    if (topPlate.id === 'metal') { sums.premium += 3; sums.retro += 3; }
    if (topPlate.id === 'plastic') { sums.premium -= 4; }
    if (frame.id === 'metal') { sums.pro += 4; sums.premium += 2; }
    if (frame.id === 'full_rubber') { sums.handling += 3; sums.cinema += 3; sums.consumer -= 2; }
    if (draft.controls.buttons.shutter && !draft.controls.buttons.shutter.enabled) { sums.pro -= 7; }
    if (dialCount >= 2) { sums.retro += dialCount * 2; sums.pro += 2; }
    if (joystick) sums.pro += 3;
    if (buttonCount > 10) { sums.looks -= Math.min(10, (buttonCount - 10) * 1.2); sums.handling -= (buttonCount - 10) * 1.1; }
    if (crowdedZones.length) { sums.handling -= crowdedZones.length * 2.5; }
    if (screenType.id === 'sideflip' || screenType.id === 'fold') sums.consumer += 4;
    if (vf.id === 'pro' || vf.id === 'eyelevel') sums.pro += 3;
    if (draft.details.cage || draft.accessories.cage) sums.cinema += 5;
    if (draft.accessories.shoulder) sums.cinema += 5;
    if (draft.accessories.fan) sums.pro += 2;
    if (draft.accessories.flash) { sums.consumer += 1; sums.pro -= 1; }
    if (screenType.id === 'none') { sums.business += 2; sums.cinema += 4; }

    // physical trait baselines
    const designerSkill = clamp(2 + Math.sqrt(company.staff.designers || 0) * 1.25, 2, 11);
    let portability = 98 - Math.max(0, cameraWeight - 230) * 0.055 - Math.max(0, volumeL - 0.22) * 18 + sums.portability;
    let handling = 32 + draft.body.gripH * 0.28 + draft.body.gripD * 0.17 + draft.body.gripCurve * 0.1 + W * 0.075 + sums.handling;
    if (cameraWeight > 1200) handling -= (cameraWeight - 1200) * 0.012;
    if (cameraWeight < 260) handling -= (260 - cameraWeight) * 0.055;
    if (kitLens && kitLens.weight > 850 && cameraWeight < 850) handling -= 8;
    handling += dialCount * 1.4 + (joystick ? 2 : 0);
    let retro = 28 + sums.retro + (dialCount >= 2 ? 5 : 0) + (draft.viewfinder.type === 'eyelevel' || draft.viewfinder.type === 'folding' ? 5 : 0);
    if (mainColor.neutral && mainColor.l > 0.55) retro += 7;
    if (vibrant) retro -= 4;
    if (draft.accessories.monitor || draft.accessories.fan || draft.accessories.shoulder) retro -= 3;
    let pro = 35 + sums.pro + (draft.body.weatherSealed ? 8 : 0) + (draft.performance.cardSlots >= 2 ? 5 : 0) + (draft.screen.type === 'none' ? -8 : 0);
    if (vibrant) pro -= 4;
    let business = 27 + sums.business + (mainColor.neutral ? 7 : -2) + (topStyle.id === 'flush' ? 4 : 0) + (W <= 145 ? 3 : 0);
    if (vibrant) business -= 4;
    if (accessoryWeight > 300) business -= 5;
    let trend = 30 + sums.trend + (vibrant ? 8 : 0) + (screenType.id === 'sideflip' ? 6 : 0) + (draft.screen.touch ? 4 : 0) + (cameraWeight < 500 ? 5 : 0);
    if (dialCount > 2) trend -= 3;
    let cinema = 20 + sums.cinema + (draft.accessories.monitor ? 9 : 0) + (draft.accessories.shoulder ? 13 : 0) + (draft.accessories.fan ? 5 : 0) + (mount.id === 'PL' ? 6 : 0);
    if (['cinema', 'gimbal'].includes(draft.body.type)) cinema += 8;
    if (mainColor.neutral && mainColor.l < 0.25) cinema += 5;
    if (vibrant) cinema -= 6;
    let consumer = 27 + sums.consumer + (draft.screen.touch ? 5 : 0) + (screenType.id === 'sideflip' ? 5 : 0) + (buttonCount <= 5 ? 4 : -3) + (cameraWeight < 450 ? 7 : 0) + (mount.id === 'FIXED' ? 5 : 0);
    if (buttonCount > 9) consumer -= 5;
    let premium = 24 + sums.premium + material.premium * 28 + finish.premium * 12 + topPlate.premium * 9 + frame.premium * 7 + (company.reputation || 0) * 0.07;
    if (vibrant) premium -= 3;
    if (accentClash) premium -= 3;

    // coherence / proportion penalties
    let coherence = 0;
    if (['retro', 'rangefinder', 'dslr'].includes(draft.body.type) && (draft.accessories.cage || draft.details.cage || draft.body.silhouette === 'cage')) coherence -= 8;
    if (['compact', 'action'].includes(draft.category) && (draft.accessories.shoulder || draft.accessories.cage)) coherence -= 9;
    if (draft.category === 'cinema' && vibrant) coherence -= 3;
    if (material.id === 'brass' && draft.category === 'action') coherence -= 10;
    if (material.id === 'plastic' && premium > 55) coherence -= 4;
    if (topPlate.id === 'plastic' && (material.id === 'titanium' || material.id === 'brass')) coherence -= 5;
    if (screenType.id === 'none' && draft.viewfinder.type === 'none') coherence -= 8;
    const aspectExpected = bodyType.defaults.width / bodyType.defaults.height;
    const aspectActual = W / H;
    const aspectPenalty = Math.min(8, Math.abs(aspectActual - aspectExpected) * 22);
    const depthPenalty = Math.max(0, Math.abs(Dp / H - bodyType.defaults.depth / bodyType.defaults.height) - 0.18) * 12;
    const screenWidthEstimate = draft.screen.size * 25.4 * 0.86;
    if (screenWidthEstimate > W * 0.84 && draft.screen.type !== 'none') addWarning('屏幕尺寸相对机身过大，边框与翻转结构可能干涉。', 'warn');
    const gripOverflow = draft.body.gripH > H * 0.9 || draft.body.gripD > Dp * 1.45;
    if (gripOverflow) addWarning('握柄尺寸接近或超过机身比例，结构可能需要外凸设计。', 'warn');

    const looks = clamp(52 + sums.looks + material.premium * 13 + finish.looks * 0.5 + topPlate.premium * 8 + designerSkill + coherence - aspectPenalty - depthPenalty + (paletteCoherent ? 2 : -3), 12, 99);
    portability = clamp(portability, 5, 99);
    handling = clamp(handling, 5, 99);
    retro = clamp(retro, 0, 99);
    pro = clamp(pro, 0, 99);
    business = clamp(business, 0, 99);
    trend = clamp(trend, 0, 99);
    cinema = clamp(cinema, 0, 99);
    consumer = clamp(consumer, 0, 99);
    premium = clamp(premium, 0, 99);

    const traits = { looks, retro, pro, portability, handling, business, trend, cinema, consumer, premium };

    // ---------------- image pipeline ----------------
    const baseFormatScore = { one: 34, m43: 43, apsc: 52, ff: 64, mf: 76, lf: 84 }[format.id] || 60;
    let imageScore = baseFormatScore
      + Math.log2(Math.max(1, draft.sensor.mp / 12)) * 3.0
      + (tech.sensor || 1) * 1.4
      + sensorType.quality * 1.0
      + (draft.sensor.dynamicRange - 11) * 1.5
      + (draft.sensor.baseIso <= 100 ? 2.2 : 0)
      + draft.sensor.colorDepth * 0.22
      + (tech.color || 1) * 0.6;
    const maxMp = maxMPFor(format.id, company);
    if (draft.sensor.mp > maxMp) imageScore -= (draft.sensor.mp - maxMp) * 0.35;
    if (kitLens && kitLens.metrics) imageScore += (kitLens.metrics.optical - 70) * 0.12;
    if (cmosChip) imageScore += cmosChip.quality * 0.55;
    imageScore = clamp(imageScore, 18, 100);

    const afDef = D.AF_SYSTEMS[draft.performance.afSystem] || D.AF_SYSTEMS.contrast;
    if ((tech.af || 1) < afDef.tech) {
      addWarning(`${afDef.name}需要自动对焦技术 Lv.${afDef.tech}。`, 'bad', true);
    }
    const afBonus = afDef.bonus + (draft.performance.afTracking || 3) * 3.6 + (afChip ? afChip.bonus : 0);
    let focusScore = 28 + (tech.af || 1) * 5.2 + afBonus + (tech.software || 1) * 1.5 + (draft.sensor.type === 'stacked' ? 3 : 0);
    if (kitLens && kitLens.motor === 'mf') focusScore -= 35;
    focusScore = clamp(focusScore, 8, 100);

    const stabDef = D.STABILIZATIONS[draft.performance.stabilization] || D.STABILIZATIONS.none;
    if ((tech.ibis || 1) < stabDef.tech) addWarning(`${stabDef.name}需要防抖技术 Lv.${stabDef.tech}。`, 'bad', true);
    let stabScore = stabDef.id === 'none' ? 12 : 20 + (tech.ibis || 1) * 4.8 + (draft.performance.ibisStops || stabDef.stops) * 4.2;
    if (kitLens && kitLens.stabilization) stabScore += 5;
    stabScore = clamp(stabScore, 5, 100);

    const codecDefs = (draft.video.codecs || []).map(c => D.CODECS[c]).filter(Boolean);
    if (!codecDefs.length) addWarning('至少需要选择一种视频编码，或彻底取消视频功能。', 'bad', true);
    codecDefs.forEach(c => {
      if ((tech.codec || 1) < c.tech) addWarning(`${c.name}编码需要编码技术 Lv.${c.tech}。`, 'bad', true);
    });
    if (!videoComboAllowed(draft.video.res, draft.video.fps, tech.video || 1)) {
      addWarning(`${draft.video.res} ${draft.video.fps}fps 需要高帧率视频技术 Lv.${minVideoTechFor(draft.video.res, draft.video.fps)}。`, 'bad', true);
    }
    const resDef = D.VIDEO_RES[draft.video.res] || D.VIDEO_RES['4K'];
    if ((tech.video || 1) < resDef.level) addWarning(`${resDef.name}录制需要高帧率视频技术 Lv.${resDef.level}。`, 'bad', true);
    const bestCodec = codecDefs.reduce((best, c) => !best || c.quality > best.quality ? c : best, null);
    let videoScore = resDef.score * 0.62
      + Math.min(14, draft.video.fps / 10)
      + (bestCodec ? bestCodec.quality * 12 : 0)
      + Math.min(15, (draft.video.bitrate || 100) / 260)
      + (draft.video.log ? 4 : 0)
      + (draft.video.hlg ? 2 : 0)
      + (draft.video.rawOut ? 5 : 0)
      + (draft.video.external ? 2 : 0)
      + (draft.video.timecode ? 2 : 0)
      + (draft.video.genlock ? 2 : 0)
      + (tech.video || 1) * 1.1
      + (tech.codec || 1) * 0.7;
    if (draft.sensor.type === 'global') videoScore += 2;
    videoScore = clamp(videoScore, 5, 100);

    // screen
    let screenScore = 0;
    if (screenType.id !== 'none') {
      const screenRes = D.SCREEN_RES[draft.screen.res] || D.SCREEN_RES['1080p'];
      const gamut = D.GAMUTS[draft.screen.gamut] || D.GAMUTS.srgb;
      screenScore = 35 + screenRes.score * 0.34 + draft.screen.nits / 35 + gamut.score * 1.2
        + (draft.screen.touch ? 8 : 0) + (draft.screen.refresh >= 120 ? 7 : draft.screen.refresh >= 90 ? 3 : 0)
        + (draft.screen.size >= 3.5 ? 2 : 0) + (tech.screen || 1) * 1.1;
      if (draft.screen.res === '4k' && (tech.screen || 1) < 4) addWarning('4K 显示屏需要屏幕技术 Lv.4。', 'warn');
      if (draft.screen.nits > 1600 && (tech.screen || 1) < 4) addWarning('超高亮度屏幕需要屏幕技术 Lv.4。', 'warn');
    }
    screenScore = clamp(screenScore, 0, 100);

    // thermal
    const thermalCodec = codecDefs.length ? codecDefs.reduce((t, c) => t + c.thermal, 0) / codecDefs.length : 0.5;
    const heatLoad = 5 + resDef.level * 7 + Math.max(0, draft.video.fps - 30) * 0.28
      + (draft.video.bitrate || 100) / 150 + thermalCodec * 5
      + (draft.video.rawOut ? 4 : 0) + draft.sensor.mp / 30
      + (draft.sensor.type === 'stacked' ? 3 : 0) + (draft.sensor.type === 'global' ? 4 : 0);
    const coolingCapacity = 18 + (tech.cooling || 1) * 8 + volumeL * 8 + material.thermal * 6
      + (draft.accessories.fan ? 22 : 0) + (draft.details.vents ? 4 : 0)
      + (draft.body.silhouette === 'cage' || draft.accessories.cage ? 3 : 0)
      + (draft.body.weatherSealed ? -3 : 0);
    const thermalRisk = clamp((heatLoad - coolingCapacity) * 1.9, 0, 82);
    const coolingScore = clamp(100 - thermalRisk * 1.35 + (tech.cooling || 1) * 2 + (draft.accessories.fan ? 5 : 0), 4, 100);
    const thermalLimitMin = Math.round(clamp(70 - thermalRisk * 1.1 + (tech.cooling || 1) * 3 + (draft.accessories.fan ? 12 : 0), 5, 180));
    if (thermalRisk > 28) addWarning(`散热压力较高，连续高规格录制可能提前过热（估算 ${thermalLimitMin} 分钟）。`, 'warn');
    if (draft.video.fps > 60 && !draft.accessories.fan && draft.category === 'cinema') addWarning('电影机高帧率录制未配置主动散热模块。', 'warn');

    // battery
    const powerDraw = 0.87 + format.index * 0.065 + draft.screen.nits / 4300 + (draft.video.fps > 60 ? 0.16 : 0) + (draft.battery.capacity > 5000 ? 0.08 : 0);
    const shots = Math.max(50, Math.round(draft.battery.capacity * (0.225 + (tech.battery || 1) * 0.026) / powerDraw / 10) * 10);
    const rawRecordMinutes = draft.battery.capacity * (0.016 + (tech.battery || 1) * 0.0022) / (1 + resDef.level * 0.09 + (draft.video.fps > 60 ? 0.2 : 0));
    const recordMinutes = Math.round(rawRecordMinutes * 10) / 10;
    const effectiveRecordLimit = Math.min(draft.battery.recordLimit || 60, draft.video.overheatLimit || 60, thermalLimitMin);
    const batteryScore = clamp(shots / 9 + Math.min(150, effectiveRecordLimit) * 0.22 + (draft.battery.usbPower ? 3 : 0), 5, 100);

    // performance & build
    const shutterDef = D.SHUTTERS[draft.performance.shutter] || D.SHUTTERS.mechanical;
    const performanceScore = clamp(
      28 + (draft.performance.burst || 5) * 1.6 + Math.min(20, (draft.performance.buffer || 60) / 40)
      + (draft.sensor.type === 'stacked' ? 6 : 0) + (draft.sensor.type === 'global' ? 8 : 0)
      + (draft.performance.afSystem === 'ai' ? 4 : 0) + (shutterDef.id === 'electronic' ? 2 : 0) + (cmosChip ? 2 : 0), 5, 100
    );
    const buildScore = clamp(30 + material.premium * 22 + frame.strength * 12 + (draft.body.weatherSealed ? 11 : 0) + topPlate.premium * 6 + finish.premium * 5, 8, 100);

    // ---------------- cost ----------------
    const sensorCost = Math.round(format.baseCost * (0.68 + draft.sensor.mp / format.refMP * 0.82) * sensorType.cost * (cmosChip ? cmosChip.costFactor : supplier.cost));
    const processorCost = Math.round(240 + resDef.level * 300 + codecDefs.length * 105 + (draft.performance.burst > 20 ? 120 : 0) + (tech.software || 1) * 48);
    const afCost = Math.max(0, Math.round(afDef.cost + (afChip ? afChip.costDelta : 0)));
    const screenCost = screenType.id === 'none' ? 0 : Math.round(120 + draft.screen.size * draft.screen.size * 36 + draft.screen.nits * 0.16 + (D.SCREEN_RES[draft.screen.res] || D.SCREEN_RES['1080p']).cost + (D.GAMUTS[draft.screen.gamut] || D.GAMUTS.srgb).cost + (draft.screen.touch ? 70 : 0) + (draft.screen.refresh > 60 ? 80 : 0));
    const viewfinderCost = Math.round(vf.cost + (draft.viewfinder.res === '5.76m' ? 180 : 0));
    const topPlateCost = topPlate.cost * 190;
    const bodyCost = Math.round(80 + volumeCm3 * 0.34 * material.cost + material.premium * 180 + frame.cost * 230 + topPlateCost + finish.cost * 145 + (draft.body.weatherSealed ? 120 : 0) + (gripVol * material.density * 0.5));
    const mountCost = Math.round(40 + ringMat.cost + (mount.id === 'PL' ? 220 : 0) + (mount.id === 'GFX' ? 180 : 0));
    const controlsCost = Math.round(buttonCount * 38 + dialCount * 82 + (joystick ? 70 : 0) + (draft.controls.touchZone !== 'off' ? 20 : 0));
    const stabCost = Math.round(stabDef.cost + ((tech.ibis || 1) >= 4 ? 80 : 0));
    const portsCost = Math.round(sum((draft.ports || []).map(p => D.PORTS[p] ? D.PORTS[p].cost : 0)));
    const wirelessCost = Math.round(sum((draft.wireless || []).map(w => D.WIRELESS[w] ? D.WIRELESS[w].cost : 0)));
    const batteryCost = Math.round(70 + draft.battery.capacity * 0.095 + draft.battery.pd * 1.8 + (draft.battery.dummy ? 45 : 0));
    const detailsCost = Math.round(sum(Object.values(D.FRONT_DETAILS).filter(item => draft.details[item.id]).map(item => item.cost || 0)));
    let accessoriesCost = Math.round(ACCESSORY_VISUALS.reduce((total, key) => total + (draft.accessories[key] && D.ACCESSORIES[key] ? D.ACCESSORIES[key].cost : 0), 0));
    if (draft.accessories.monitor && Number(draft.accessories.monitorSize) >= 7) accessoriesCost += 520;
    if (draft.accessories.batteryGrip && draft.accessories.batteryGripStyle === 'pro') accessoriesCost += 160;
    if (draft.accessories.verticalGrip && draft.accessories.verticalGripStyle === 'full') accessoriesCost += 90;
    if (draft.accessories.mic && draft.accessories.micPos === 'side') accessoriesCost += 45;
    const assemblyCost = Math.round(120 + (sensorCost + processorCost + afCost + screenCost + viewfinderCost + bodyCost + controlsCost + stabCost + portsCost + wirelessCost + batteryCost) * 0.065);
    const subtotal = sensorCost + processorCost + afCost + screenCost + viewfinderCost + bodyCost + mountCost + controlsCost + stabCost + portsCost + wirelessCost + batteryCost + detailsCost + accessoriesCost + assemblyCost;
    const manufacturingAdjustment = Math.round((subtotal - sensorCost) * (manufacturer.costFactor - 1));
    const qcPerUnit = (D.QC_TIERS[draft.qc] || D.QC_TIERS.standard).perUnit;
    const unitCost = Math.max(200, sensorCost + processorCost + afCost + screenCost + viewfinderCost + bodyCost + mountCost + controlsCost + stabCost + portsCost + wirelessCost + batteryCost + detailsCost + accessoriesCost + assemblyCost + manufacturingAdjustment + qcPerUnit);
    const costBreakdown = {
      sensor: sensorCost, processor: processorCost, autofocus: afCost, screen: screenCost, viewfinder: viewfinderCost,
      body: bodyCost, mount: mountCost, controls: controlsCost, stabilisation: stabCost,
      ports: portsCost, wireless: wirelessCost, battery: batteryCost, details: detailsCost,
      accessories: accessoriesCost, assembly: assemblyCost, manufacturing: manufacturingAdjustment, qc: qcPerUnit,
      total: unitCost
    };

    let tooling = Math.round(cat.tooling * (0.82 + material.premium * 0.18 + (buttonCount + dialCount) * 0.008 + (draft.accessories.cage ? 0.12 : 0) + (draft.sensor.type === 'global' ? 0.1 : 0)) / 100000) * 100000;
    const expectedLifetimeUnits = Math.max(500, cat.demand * 0.12 * 18);
    const amortizedRnd = Math.round(tooling / expectedLifetimeUnits);
    const targetMargin = clamp(cat.margin + (premium / 100 - 0.5) * 0.1, 0.28, 0.6);
    const suggestedPrice = Math.max(499, Math.round((unitCost + amortizedRnd) / (1 - targetMargin) / 100) * 100);
    const suggestedStock = Math.max(300, Math.round((cat.demand * 0.035 + 200) / 100) * 100);
    const selectedPrice = Number(draft.price) > 0 ? Number(draft.price) : suggestedPrice;

    // ---------------- defect / QC ----------------
    const qcTier = D.QC_TIERS[draft.qc] || D.QC_TIERS.standard;
    let defectRate = 1.55
      + thermalRisk * 0.03
      + Math.max(0, draft.sensor.mp - 45) * 0.015
      + warnings.filter(w => w.severity === 'warn').length * 0.16
      + Math.max(0, buttonCount - 9) * 0.06
      + (draft.sensor.type === 'global' ? 0.4 : 0);
    defectRate *= (2 - manufacturer.quality);
    if (cmosChip) defectRate *= cmosChip.defect;
    else defectRate *= (2 - supplier.quality);
    defectRate *= qcTier.defectMul;
    defectRate *= 1 / (1 + Math.sqrt(company.staff.qc || 0) * 0.16);
    defectRate = clamp(defectRate, 0.3, 12);
    const qualityRating = clamp(10 - defectRate * 0.48, 1.5, 10);

    // technical compatibility
    if (format.index > mount.maxFormat) {
      addWarning(`${format.name}传感器无法通过${mount.name}卡口覆盖像场，卡口像场不足。`, 'bad', true);
    }
    if (sensorType.tech > (tech.sensor || 1)) addWarning(`${sensorType.name}传感器需要传感器技术 Lv.${sensorType.tech}。`, 'bad', true);
    if (format.id === 'mf' && (tech.sensor || 1) < 3) addWarning('中画幅传感器需要传感器技术 Lv.3。', 'bad', true);
    if (format.id === 'lf' && (tech.sensor || 1) < 4) addWarning('大画幅传感器需要传感器技术 Lv.4。', 'bad', true);
    if (draft.sensor.mp > maxMp) addWarning(`当前传感器技术只能稳定量产至约 ${maxMp}MP，超出部分会增加发热与像素密度压力。`, 'warn');
    if (draft.body.weatherSealed === false && ['professional', 'sports'].includes(draft.targetSegment)) addWarning('目标用户为专业/体育人群，但机身没有全天候密封。', 'warn');
    if (!draft.controls.buttons.shutter || !draft.controls.buttons.shutter.enabled) addWarning('没有快门键，这会直接影响拍摄可用性。', 'bad', true);
    if (!draft.controls.buttons.menu || !draft.controls.buttons.menu.enabled) addWarning('没有独立菜单键，菜单只能通过触控或组合键进入。', 'warn');
    if (screenType.id === 'none' && vf.id === 'none') addWarning('没有屏幕和取景器，用户几乎无法完成构图与设置。', 'bad', true);
    if (draft.screen.type === 'none' && ['creator', 'consumer'].includes(draft.targetSegment)) addWarning('目标用户需要屏幕，但设计中没有取景/回放屏。', 'warn');
    if (buttonCount > 11) addWarning('按键数量偏多，按键分区需要更谨慎的人机工学验证。', 'warn');
    if (crowdedZones.length) addWarning('同一区域集中了过多按键，可能造成误触。', 'warn');
    if (draft.body.gripH < 10 && ['sports', 'professional'].includes(draft.targetSegment)) addWarning('几乎没有握柄，专业用户的手感和镜头支撑会受影响。', 'warn');
    if (dialCount === 0 && ['enthusiast', 'professional'].includes(draft.targetSegment)) addWarning('目标用户期待机械拨轮，但机身上没有任何拨轮。', 'warn');
    if (material.id === 'plastic' && selectedPrice > 20000) addWarning('高价产品使用工程塑料机身，用户可能质疑质感与定价。', 'warn');
    if (material.id === 'titanium' && cameraWeight > 1200) addWarning('钛合金机身重量较高，长时间手持会降低舒适度。', 'warn');
    if (draft.accessories.batteryGrip && draft.accessories.verticalGrip) addWarning('电池手柄与竖拍手柄功能重叠，建议只保留一种。', 'warn');
    if (draft.accessories.fan && !draft.details.vents) addWarning('安装了主动散热模块，但机身没有对应的进出风结构。', 'warn');
    if (draft.colors.secondaryOn && !paletteCoherent) addWarning('双色搭配的色相差异过大，整体视觉统一性下降。', 'warn');
    if (tech.sensor < 2 && sensorType.id !== 'cmos') addWarning('先进传感器需要传感器技术 Lv.2 以上。', 'bad', true);
    if (draft.mount.type === 'FIXED' && ['mirrorless', 'fullframe', 'highres', 'sports', 'medium'].includes(draft.category)) addWarning('可换镜产品线采用了固定镜头卡口，无法建立镜头生态。', 'warn');

    // ---------------- experiential scores & reviews ----------------
    const segmentMatches = {};
    D.SEGMENTS_ARRAY.forEach(seg => {
      let weighted = 0, totalW = 0;
      Object.keys(seg.prefs).forEach(k => {
        const w = seg.prefs[k];
        weighted += (traits[k] || 50) * w;
        totalW += w;
      });
      segmentMatches[seg.id] = Math.round(clamp((weighted / Math.max(0.0001, totalW)) * 1.06 + 3, 4, 99));
    });
    const targetMatch = segmentMatches[draft.targetSegment] || 50;
    if (targetMatch < 45) addWarning('当前外形与所选目标人群的审美偏好匹配度偏低。', 'warn');
    if (looks < 42) addWarning('整体造型完成度偏低，可能难以在社交渠道形成记忆点。', 'warn');

    // fair market price / value rating
    const specWeightMap = {
      image: cat.reviewWeights.image, focus: cat.reviewWeights.focus, stab: cat.reviewWeights.stab,
      video: cat.reviewWeights.video, battery: cat.reviewWeights.battery, cooling: cat.reviewWeights.cooling,
      screen: cat.reviewWeights.screen, performance: 0.04, build: 0.04
    };
    const specWeightTotal = sum(Object.values(specWeightMap));
    const specScore = Math.round(clamp(Object.keys(specWeightMap).reduce((total, key) => {
      const values = { image: imageScore, focus: focusScore, stab: stabScore, video: videoScore, battery: batteryScore, cooling: coolingScore, screen: screenScore, performance: performanceScore, build: buildScore };
      return total + (values[key] || 0) * (specWeightMap[key] || 0);
    }, 0) / Math.max(0.01, specWeightTotal), 1, 100));
    const fairnessPerf = specScore * 0.5 + looks * 0.27 + targetMatch * 0.23;
    const brandPremium = 1 + Math.max(0, company.reputation - 70) * 0.0014 + Math.max(0, company.awareness - 70) * 0.0009;
    const fairPrice = Math.max(499, Math.round(cat.basePrice * (0.55 + fairnessPerf / 100 * 1.05) * brandPremium / 100) * 100);
    const price = Math.max(99, selectedPrice);
    const valueRatio = fairPrice / price;
    const valueRating = clamp(5 + (valueRatio - 1) * 4.6, 1, 10);

    const ratings = {
      image: Number((imageScore / 10).toFixed(1)),
      focus: Number((focusScore / 10).toFixed(1)),
      stab: Number((stabScore / 10).toFixed(1)),
      video: Number((videoScore / 10).toFixed(1)),
      battery: Number((batteryScore / 10).toFixed(1)),
      cooling: Number((coolingScore / 10).toFixed(1)),
      design: Number((looks / 10).toFixed(1)),
      handling: Number((handling / 10).toFixed(1)),
      screen: Number((screenScore / 10).toFixed(1)),
      value: Number(valueRating.toFixed(1)),
      brand: Number(((company.reputation || 50) / 10).toFixed(1)),
      qc: Number(qualityRating.toFixed(1))
    };
    const reviewWeights = cat.reviewWeights;
    const overall = Math.round(clamp(
      Object.keys(reviewWeights).reduce((total, k) => total + ratings[k] * 10 * reviewWeights[k], 0) * 0.93
      + (ratings.qc * 10) * 0.035 + (ratings.brand * 10) * 0.035
      + (targetMatch - 50) * 0.04
      - (defectRate > 4 ? 2 : 0), 5, 99
    ));
    const premiumBadge = qualityTier(overall);

    const pros = [];
    const cons = [];
    if (imageScore >= 82) pros.push('画质细节和宽容度处于同价位第一梯队');
    if (focusScore >= 80) pros.push('对焦果断，主体识别稳定');
    if (videoScore >= 82) pros.push('视频规格与工作流完整');
    if (looks >= 78) pros.push('外观辨识度高，实机比参数更有吸引力');
    if (targetMatch >= 78) pros.push('外形与目标用户审美高度契合');
    if (premium >= 72) pros.push('材质与工艺营造出高级感');
    if (portability >= 75) pros.push('轻便，愿意每天带出门');
    if (handling >= 75) pros.push('握持扎实，长时间拍摄不易疲劳');
    if (thermalRisk > 24) cons.push('高规格连续录制存在过热风险');
    if (focusScore < 60) cons.push('对焦追焦落后于同价位竞品');
    if (batteryScore < 50) cons.push('续航偏弱，需要多备电池');
    if (defectRate > 4) cons.push('品控稳定性存在隐患');
    if (targetMatch < 55) cons.push('外观可能不符合目标用户的审美预期');
    if (inputMissing(draft)) cons.push('部分关键操控缺失，工作流不完整');
    if (valueRating < 4.5) cons.push('定价偏高，性价比压力明显');
    if (pros.length === 0) pros.push('规格均衡，没有明显短板');
    if (cons.length === 0) cons.push('暂未发现致命短板，市场表现取决于定价与营销');

    const designTags = [];
    if (retro >= 65) designTags.push('复古');
    if (pro >= 68) designTags.push('专业');
    if (cinema >= 68) designTags.push('电影感');
    if (trend >= 68) designTags.push('潮流');
    if (consumer >= 65) designTags.push('消费级');
    if (premium >= 70) designTags.push('高级');
    if (designTags.length === 0) designTags.push('现代');

    const identity = [D.MATERIALS[draft.materials.body].name, D.FINISHES[draft.materials.finish].name, D.SILHOUETTES[draft.body.silhouette].name].join(' · ');

    return {
      cat, format, sensorType, material, finish, frame, topPlate, bodyType, silhouette, topStyle, frontStyle,
      screenType, viewfinder: vf, mount, ringMat, supplier, manufacturer,
      W, H, Dp, volumeL, cameraWeight, totalWeight, bodyWeight, accessoryWeight,
      buttonCount, dialCount, enabledButtons, crowdedZones,
      traits, segmentMatches, targetMatch, looks,
      scores: {
        image: imageScore, focus: focusScore, stab: stabScore, video: videoScore, screen: screenScore,
        cooling: coolingScore, battery: batteryScore, performance: performanceScore, build: buildScore,
        thermalRisk, thermalLimitMin, shots, recordMinutes, effectiveRecordLimit, rawRecordMinutes,
        valueRatio, specScore
      },
      ratings, overall, stars: starRating(overall), premiumBadge, pros, cons, designTags, identity,
      warnings, blocking, defectRate, qualityRating,
      chips: { cmos: cmosChip, af: afChip, cmosSource: chipState.cmosSource, afSource: chipState.afSource },
      costBreakdown, unitCost, tooling, amortizedRnd, expectedLifetimeUnits,
      suggestedPrice, suggestedStock, fairPrice, price, priceValue: valueRatio,
      targetMargin, specScore,
      launchEstimate: {
        tooling, initialStock: draft.initialStock || suggestedStock,
        campaignCost: (D.CAMPAIGN_TIERS[draft.campaign] || D.CAMPAIGN_TIERS.none).cost
      }
    };
  }

  function inputMissing(draft) {
    return !draft.controls.buttons.shutter || !draft.controls.buttons.shutter.enabled || (draft.screen.type === 'none' && draft.viewfinder.type === 'none');
  }

  // ---------- lens evaluation ----------
  function evaluateLens(draft, company, options) {
    options = options || {};
    const mount = D.MOUNTS[draft.mount.type] || D.MOUNTS.E;
    const typeDef = D.LENS_TYPES[draft.lensType] || D.LENS_TYPES.zoom;
    const style = D.LENS_STYLES[draft.body.style] || D.LENS_STYLES.black_pro;
    const styleMods = Object.assign({ looks: 0, pro: 0, retro: 0, cinema: 0, trend: 0, business: 0 }, style.mods || {});
    const material = D.LENS_MATERIALS[draft.body.material] || D.LENS_MATERIALS.aluminum;
    const coating = D.LENS_COATINGS[draft.optical.coating] || D.LENS_COATINGS.basic;
    const motor = D.LENS_MOTORS[draft.focus.motor] || D.LENS_MOTORS.stm;
    const manufacturer = getManufacturing(company);
    const tech = company.tech;
    const warnings = [];
    const blocking = [];
    const addWarning = (text, severity, isBlocking) => {
      const w = { text, severity: severity || 'warn', blocking: !!isBlocking };
      warnings.push(w);
      if (isBlocking) blocking.push(w);
    };
    const chipState = resolveDesignChips(draft, company);
    chipState.warnings.forEach(w => addWarning(w, 'warn'));
    const cmosChip = chipState.cmos;
    const afChip = chipState.af;
    const techCheck = (key, need, label) => {
      const have = tech[key] || 1;
      if (have < need) {
        addWarning(`${label}需要${D.TECHS[key].name} Lv.${need}，当前仅 Lv.${have}。`, 'bad', true);
        return false;
      }
      return true;
    };

    const isZoom = Number(draft.focalMax) > Number(draft.focalMin) * 1.015;
    const focalMin = Math.max(4, Math.min(800, Number(draft.focalMin) || 24));
    const focalMax = Math.max(focalMin, Math.min(1200, Number(draft.focalMax) || focalMin));
    const zoomRatio = focalMax / focalMin;
    const coverage = D.SENSOR_FORMATS[draft.coverage] || D.SENSOR_FORMATS.ff;
    const maxAp = clamp(Number(draft.maxAperture) || 2.8, 0.6, 8);
    const minAp = clamp(Number(draft.minAperture) || 22, 4, 64);
    const elements = clamp(Math.round(Number(draft.optical.elements) || 12), 4, 30);
    const groups = clamp(Math.round(Number(draft.optical.groups) || Math.max(3, Math.round(elements * 0.7))), 3, 24);
    const aspherical = clamp(Math.round(Number(draft.optical.aspherical) || 0), 0, 8);
    const ed = clamp(Math.round(Number(draft.optical.ed) || 0), 0, 8);
    const fluorite = clamp(Math.round(Number(draft.optical.fluorite) || 0), 0, 4);
    const filter = clamp(Math.round(Number(draft.filter) || 72), 30, 160);
    const length = clamp(Math.round(Number(draft.body.length) || 100), 25, 420);
    const diameter = clamp(Math.round(Number(draft.body.diameter) || 75), 28, 220);
    const weight = clamp(Math.round(Number(draft.body.weight) || 600), 90, 6000);
    const designSkill = clamp(2 + Math.sqrt(company.staff.designers || 0) * 1.2, 2, 11);

    if (!isZoom && draft.lensType === 'zoom') addWarning('当前焦距为定焦，但镜头类型设置为变焦。建议选择定焦类型。', 'warn');
    if (isZoom && draft.lensType === 'prime') addWarning('当前焦距跨越多个焦段，但镜头类型设置为定焦。', 'warn');
    if (isZoom && draft.lensType === 'cinema' && !draft.body.focusGear) addWarning('电影变焦镜头没有对焦/变焦齿轮环，跟焦器无法使用。', 'warn');
    if (maxAp < 1.0 && (tech.optics || 1) < 5) addWarning('F1.0 级别大光圈需要镜头光学技术 Lv.5。', 'bad', true);
    else if (maxAp < 1.4 && (tech.optics || 1) < 4) addWarning('超大光圈设计需要镜头光学技术 Lv.4。', 'bad', true);
    else if (maxAp < 2.0 && (tech.optics || 1) < 3) addWarning('F1.8/F2 大光圈需要镜头光学技术 Lv.3。', 'bad', true);
    if (coating.tech && (tech.optics || 1) < coating.tech) addWarning(`${coating.name}需要镜头光学技术 Lv.${coating.tech}。`, 'bad', true);
    if (fluorite > 0 && (tech.optics || 1) < 4) addWarning('萤石镜片需要镜头光学技术 Lv.4。', 'bad', true);
    if (isZoom && zoomRatio > 6 && elements < 18) addWarning('大变焦比但镜片数量偏少，边缘画质与色散控制会承压。', 'warn');
    if (isZoom && zoomRatio > 10) addWarning('超过 10 倍的变焦范围会显著增加体积、成本与光学设计难度。', 'warn');
    if (elements <= groups) addWarning('镜片数量不应少于镜组数量，请检查光学结构。', 'warn');
    if (maxAp > minAp) addWarning('最大光圈应小于最小光圈数值（例如 F2.8 < F22）。', 'warn', true);
    if (!draft.body.weatherSealed && ['professional', 'cinema', 'sports'].includes(draft.targetSegment)) addWarning('目标用户需要全天候镜头，但镜身没有防尘防滴结构。', 'warn');
    if (draft.lensType === 'cinema' && motor.id === 'mf' && !draft.body.focusGear) addWarning('电影镜头缺少齿轮环，手动跟焦工作流不完整。', 'warn');
    if (weight > 2200 && diameter < 82) addWarning('镜身重量与大直径镜片不匹配，机械结构可能失衡。', 'warn');
    if (material.id === 'plastic' && draft.price > 12000) addWarning('高价镜头使用工程塑料镜身，可能影响专业用户对可靠性的判断。', 'warn');
    if (draft.body.weatherSealed && !draft.body.focusRing) addWarning('全天候结构通常需要完整的对焦环密封，当前对焦环缺失。', 'warn');
    if (focalMin < 10) addWarning('超广角设计对前组镜片和遮光罩要求极高，可能产生严重暗角。', 'warn');
    if (coverage.index < (D.MOUNTS[draft.mount.type] ? 2 : 1)) addWarning('像场覆盖过小，无法覆盖当前卡口的标准画幅。', 'warn');

    const specialScore = aspherical * 2.4 + ed * 2.1 + fluorite * 5.2;
    const apertureFactor = clamp(2.8 / maxAp, 0.45, 3.3);
    let optical = 38
      + (tech.optics || 1) * 5
      + specialScore
      + coating.score * 1.2
      + apertureFactor * 6.5
      + (isZoom ? -Math.max(0, zoomRatio - 2.5) * 1.6 : 3.5)
      + (draft.lensType === 'cinema' ? 4 : 0)
      + (draft.lensType === 'macro' ? 2 : 0)
      + Math.min(8, elements * 0.35);
    if (isZoom && zoomRatio > 3 && elements >= 18) optical += 3;
    if (elements < 8) optical -= 8;
    optical = clamp(optical, 15, 100);

    let focus = 36 + motor.score * 4.2 + (tech.af || 1) * 1.8 + (motor.id === 'mf' ? -12 : 0) + (draft.lensType === 'cinema' ? 2 : 0);
    if (draft.focus.breathing === 'minimal') focus += 4;
    if (motor.id === 'cinema') focus += 3;
    focus = clamp(focus, 8, 100);

    let stabilization = 8;
    if (draft.stabilization) stabilization = clamp(42 + (draft.stabilizationStops || 3) * 4.8 + (tech.optics || 1) * 1.2, 10, 100);
    if (draft.lensType === 'cinema' && draft.stabilization) stabilization -= 8;

    let build = 28 + material.premium * 28 + (draft.body.weatherSealed ? 12 : 0) + (draft.body.apertureRing ? 5 : 0)
      + (draft.body.focusGear ? 5 : 0) + (style.id === 'cine_black' ? 5 : 0) + (tech.optics || 1) * 0.8;
    build = clamp(build, 10, 100);

    let looks = 50 + styleMods.looks * 1.0 + material.premium * 16 + designSkill
      + (isZoom ? 2 : 4) + (draft.body.focusRing ? 3 : 0) + (draft.body.apertureRing ? 2 : 0)
      + (length / diameter > 4.2 ? -5 : 0) + (weight > 1800 ? -2 : 0);
    if (draft.body.finish === 'brushed') looks += 3;
    if (draft.body.finish === 'matte') looks += 2;
    looks = clamp(looks, 15, 99);
    const portability = clamp(98 - weight * 0.055 - length * 0.1 - diameter * 0.06, 5, 99);

    const lensTraits = {
      optical,
      focus,
      stabilization,
      build,
      looks,
      portability,
      pro: clamp(30 + build * 0.35 + optical * 0.22 + (draft.body.weatherSealed ? 10 : 0) + styleMods.pro * 1.2, 5, 99),
      retro: clamp(24 + styleMods.retro * 1.3 + (material.premium > 0.65 ? 10 : 0) + (draft.body.apertureRing ? 7 : 0) + (draft.body.focusRing ? 4 : 0), 0, 99),
      cinema: clamp(20 + styleMods.cinema * 1.4 + (draft.lensType === 'cinema' ? 20 : 0) + (draft.body.focusGear ? 12 : 0) + (draft.body.zoomGear ? 8 : 0) + (draft.focus.breathing === 'minimal' ? 6 : 0), 0, 99),
      trend: clamp(30 + styleMods.trend * 1.2 + (material.premium > 0.6 ? 5 : 0) + (draft.body.color === '#d8d4c8' ? 6 : 0), 0, 99),
      business: clamp(26 + build * 0.18 + styleMods.business * 1.1 + (draft.body.weatherSealed ? 5 : 0), 0, 99)
    };
    const lensSegmentPrefs = {
      consumer: { looks: .3, portability: .3, trend: .25, value: .15 },
      enthusiast: { retro: .3, looks: .25, optical: .3, build: .15 },
      professional: { optical: .35, build: .25, pro: .25, focus: .15 },
      creator: { focus: .3, portability: .25, stabilization: .2, looks: .15, value: .1 },
      cinema: { cinema: .4, optical: .3, build: .2, focus: .1 },
      sports: { focus: .35, build: .25, stabilization: .2, optical: .2 }
    };
    const matchPrefs = lensSegmentPrefs[draft.targetSegment] || lensSegmentPrefs.professional;
    let matchWeighted = 0, matchWeightTotal = 0;
    Object.keys(matchPrefs).forEach(k => {
      const v = k === 'value' ? 65 : (lensTraits[k] || 50);
      matchWeighted += v * matchPrefs[k];
      matchWeightTotal += matchPrefs[k];
    });
    const targetMatch = Math.round(clamp(matchWeighted / matchWeightTotal, 5, 99));

    const specialCost = aspherical * 165 + ed * 210 + fluorite * 580;
    const opticalCost = Math.round(elements * 58 + groups * 34 + specialCost + coating.cost);
    const barrelCost = Math.round(120 + length * diameter * 0.055 * material.cost + styleMods.cinema * 7 + (draft.body.weatherSealed ? 120 : 0));
    const mechanismCost = Math.round((isZoom ? 240 + zoomRatio * 45 : 80) + (draft.body.focusGear ? 130 : 0) + (draft.body.zoomGear ? 110 : 0) + (draft.body.apertureRing ? 60 : 0));
    const motorCost = motor.cost;
    const oisCost = draft.stabilization ? Math.round(120 + (draft.stabilizationStops || 3) * 35) : 0;
    const electronicsCost = Math.round(140 + (draft.body.apertureRing ? 30 : 0) + (technologyLensChip(tech) * 28));
    const manufacturingAdjustment = Math.round((opticalCost + barrelCost + mechanismCost + motorCost + oisCost + electronicsCost) * (manufacturer.costFactor - 1));
    const qcPerUnit = (D.QC_TIERS[draft.qc] || D.QC_TIERS.standard).perUnit * 0.65;
    const unitCost = Math.max(180, Math.round(opticalCost + barrelCost + mechanismCost + motorCost + oisCost + electronicsCost + manufacturingAdjustment + qcPerUnit + 80));
    const costBreakdown = {
      optics: opticalCost, body: barrelCost, mechanism: mechanismCost, motor: motorCost,
      stabilisation: oisCost, electronics: electronicsCost, manufacturing: manufacturingAdjustment,
      assembly: 80, qc: Math.round(qcPerUnit), total: unitCost
    };
    const tooling = Math.round((4200000 + elements * 180000 + specialCost * 5500 + (isZoom ? 1800000 : 0) + (draft.lensType === 'cinema' ? 4800000 : 0)) / 100000) * 100000;
    const expectedLifetimeUnits = 18000;
    const amortizedRnd = Math.round(tooling / expectedLifetimeUnits);
    const marginBase = draft.lensType === 'cinema' ? 0.5 : (draft.lensType === 'tele' ? 0.44 : 0.42);
    const margin = clamp(marginBase + (material.premium - 0.5) * 0.1, 0.28, 0.58);
    const suggestedPrice = Math.max(399, Math.round((unitCost + amortizedRnd) / (1 - margin) / 100) * 100);
    const suggestedStock = 500;
    const price = Number(draft.price) > 0 ? Number(draft.price) : suggestedPrice;

    const qcTier = D.QC_TIERS[draft.qc] || D.QC_TIERS.standard;
    let defectRate = 1.2 + Math.max(0, elements - 15) * 0.06 + (draft.stabilization ? 0.25 : 0) + warnings.filter(w => !w.blocking).length * 0.12;
    defectRate *= (2 - manufacturer.quality);
    defectRate *= qcTier.defectMul;
    defectRate *= 1 / (1 + Math.sqrt(company.staff.qc || 0) * 0.15);
    defectRate = clamp(defectRate, 0.3, 10);
    const qualityRating = clamp(10 - defectRate * 0.55, 1.5, 10);

    const lensTypeBase = { prime: 5600, zoom: 8600, cinema: 24000, macro: 6200, portrait: 6600, tele: 11800 }[draft.lensType] || 8600;
    const coverageFactor = { one: .52, m43: .72, apsc: .82, ff: 1.0, mf: 1.8, lf: 3.0 }[draft.coverage] || 1;
    const brandPremium = 1 + Math.max(0, company.reputation - 70) * 0.0035 + Math.max(0, company.awareness - 70) * 0.0012;
    const fairnessPerf = optical * 0.44 + targetMatch * 0.2 + looks * 0.16 + build * 0.12 + focus * 0.08;
    const fairPrice = Math.max(299, Math.round(lensTypeBase * coverageFactor * (0.52 + fairnessPerf / 100 * 1.1) * (2.8 / maxAp) * 0.55 + 300 + brandPremium * 500));
    const valueRatio = fairPrice / Math.max(99, price);
    const valueRating = clamp(5 + (valueRatio - 1) * 4.2, 1, 10);
    const ratings = {
      optical: Number((optical / 10).toFixed(1)),
      focus: Number((focus / 10).toFixed(1)),
      stabilization: Number((stabilization / 10).toFixed(1)),
      build: Number((build / 10).toFixed(1)),
      looks: Number((looks / 10).toFixed(1)),
      portability: Number((portability / 10).toFixed(1)),
      value: Number(valueRating.toFixed(1)),
      cinema: Number((lensTraits.cinema / 10).toFixed(1)),
      brand: Number(((company.reputation || 50) / 10).toFixed(1))
    };
    const overall = Math.round(clamp(
      ratings.optical * 10 * 0.32 + ratings.focus * 10 * 0.15 + ratings.stabilization * 10 * 0.07
      + ratings.build * 10 * 0.13 + ratings.looks * 10 * 0.12 + ratings.portability * 10 * 0.09
      + ratings.value * 10 * 0.09 + (targetMatch - 50) * 0.06 + (ratings.brand || 6) * 0.4,
      5, 99
    ));
    const badge = qualityTier(overall);
    const pros = [];
    const cons = [];
    if (optical >= 82) pros.push('解析力与特殊镜片配置扎实');
    if (maxAp <= 1.8) pros.push('大光圈带来的弱光与虚化优势');
    if (focus >= 78) pros.push('对焦马达快速安静');
    if (looks >= 78) pros.push('镜身比例和装饰具有品牌辨识度');
    if (build >= 75) pros.push('镜身做工与全天候结构可靠');
    if (portability >= 70) pros.push('同规格中相对轻巧');
    if (focus < 55 && motor.id !== 'mf') cons.push('对焦速度与精度不足');
    if (portability < 45) cons.push('重量和体积不适合长时间手持');
    if (valueRating < 4.2) cons.push('定价偏高，镜头生态竞争压力大');
    if (draft.lensType === 'cinema' && lensTraits.cinema < 65) cons.push('电影工作流适配仍然不足');
    if (overall < 60) cons.push('光学与机械结构缺少亮点');
    if (!pros.length) pros.push('规格克制，易于量产');
    if (!cons.length) cons.push('整体均衡，市场表现取决于卡口生态与定价');

    const identity = [typeDef.name, material.name, style.name].join(' · ');
    return {
      mount, typeDef, style, material, coating, motor, coverage,
      isZoom, zoomRatio, focalMin, focalMax, maxAp, minAp, elements, groups,
      aspherical, ed, fluorite, filter, length, diameter, weight,
      traits: lensTraits, targetMatch, ratings, overall, stars: starRating(overall), premiumBadge: badge,
      pros, cons, warnings, blocking, defectRate, qualityRating,
      costBreakdown, unitCost, tooling, amortizedRnd, suggestedPrice, suggestedStock,
      fairPrice, price, valueRatio, optical, focus, stabilization, build, looks, portability, targetSegment: draft.targetSegment,
      identity
    };
  }

  function technologyLensChip(tech) {
    return (tech.optics || 1) + (tech.software || 1) * 0.4;
  }

  // ---------- product record creation ----------
  function getKitLens(game, product) {
    if (!product || !product.kitLensId) return null;
    const lens = game.lenses.find(l => l.id === product.kitLensId && l.status === 'active');
    if (!lens) return null;
    const cameraMount = product.design && product.design.mount ? product.design.mount.type : null;
    if (!cameraMount || cameraMount === 'FIXED') return null;
    if (lens.mount.type !== cameraMount) return null;
    const sensorIdx = D.SENSOR_FORMATS[product.design.sensor.format] ? D.SENSOR_FORMATS[product.design.sensor.format].index : 4;
    const coverageIdx = D.SENSOR_FORMATS[lens.coverage] ? D.SENSOR_FORMATS[lens.coverage].index : 4;
    if (coverageIdx < sensorIdx) return null;
    return lens;
  }

  function productFromDraft(draft, ev, company, game, opts) {
    opts = opts || {};
    const age = opts.age || 0;
    const kitLens = getKitLens(game, { kitLensId: draft.kitLensId, design: draft });
    const overall = opts.overallOverride || ev.overall;
    const product = {
      id: opts.id || uid('cam'),
      kind: 'camera',
      name: draft.name,
      category: draft.category,
      targetSegment: draft.targetSegment,
      design: deepClone(draft),
      price: ev.price,
      unitCost: opts.unitCost != null ? opts.unitCost : ev.unitCost,
      fairPrice: ev.fairPrice,
      ratings: ev.ratings,
      scores: ev.scores,
      traits: ev.traits,
      segmentMatches: ev.segmentMatches,
      targetMatch: ev.targetMatch,
      specScore: ev.specScore,
      overall: overall,
      stars: starRating(overall),
      premiumBadge: qualityTier(overall),
      pros: ev.pros,
      cons: ev.cons,
      designTags: ev.designTags,
      identity: ev.identity,
      warnings: ev.warnings,
      blocking: ev.blocking,
      defectRate: ev.defectRate,
      qualityRating: ev.qualityRating,
      weight: ev.cameraWeight,
      kitLensId: draft.kitLensId || null,
      qc: draft.qc || 'enhanced',
      certification: draft.certification || 'standard',
      campaign: draft.campaign || 'social',
      ageMonths: age,
      releaseMonthIndex: (game ? game.monthIndex : 0) - age,
      stock: opts.stock != null ? opts.stock : 0,
      monthlyProduction: 0,
      autoProduction: true,
      launchHype: opts.launchHype != null ? opts.launchHype : 0,
      preorderUnits: 0,
      preorders: 0,
      launchEvent: null,
      chipInfo: ev.chips || null,
      salesHistory: [],
      totalSold: 0,
      totalRevenue: 0,
      lastUnits: 0,
      lastDemand: 0,
      lastRevenue: 0,
      lastStockout: 0,
      lastForecast: 0,
      isSeed: !!opts.isSeed,
      status: 'active',
      pressScore: opts.overallOverride || ev.overall,
      createdAt: Date.now()
    };
    if (kitLens) product.kitLensName = kitLens.name;
    return product;
  }

  function lensProductFromDraft(draft, ev, company, game, opts) {
    opts = opts || {};
    const age = opts.age || 0;
    const overall = opts.overallOverride || ev.overall;
    return {
      id: opts.id || uid('lens'),
      kind: 'lens',
      name: draft.name,
      lensType: draft.lensType,
      mount: { type: draft.mount.type },
      coverage: draft.coverage,
      focalMin: ev.focalMin,
      focalMax: ev.focalMax,
      maxAperture: ev.maxAp,
      minAperture: ev.minAp,
      design: deepClone(draft),
      price: ev.price,
      unitCost: opts.unitCost != null ? opts.unitCost : ev.unitCost,
      fairPrice: ev.fairPrice,
      ratings: ev.ratings,
      traits: ev.traits,
      overall: overall,
      stars: starRating(overall),
      premiumBadge: qualityTier(overall),
      metrics: {
        optical: ev.optical, focus: ev.focus, stabilization: ev.stabilization,
        build: ev.build, looks: ev.looks, portability: ev.portability,
        targetMatch: ev.targetMatch, valueRatio: ev.valueRatio
      },
      specScore: Math.round(ev.optical * 0.52 + ev.focus * 0.18 + ev.stabilization * 0.1 + ev.build * 0.12 + ev.portability * 0.08),
      targetMatch: ev.targetMatch,
      targetSegment: draft.targetSegment,
      pros: ev.pros,
      cons: ev.cons,
      warnings: ev.warnings,
      blocking: ev.blocking,
      defectRate: ev.defectRate,
      qualityRating: ev.qualityRating,
      weight: ev.weight,
      qc: draft.qc || 'enhanced',
      campaign: draft.campaign || 'social',
      ageMonths: age,
      releaseMonthIndex: (game ? game.monthIndex : 0) - age,
      stock: opts.stock != null ? opts.stock : 0,
      monthlyProduction: 0,
      autoProduction: true,
      launchHype: opts.launchHype != null ? opts.launchHype : 0,
      preorderUnits: 0,
      preorders: 0,
      launchEvent: null,
      chipInfo: ev.chips || null,
      salesHistory: [],
      totalSold: 0,
      totalRevenue: 0,
      lastUnits: 0,
      lastDemand: 0,
      lastRevenue: 0,
      lastStockout: 0,
      lastForecast: 0,
      isSeed: !!opts.isSeed,
      status: 'active',
      createdAt: Date.now()
    };
  }

  function normalizeVideoRes(res) {
    const r = String(res || '4K').toUpperCase();
    if (r.includes('12K')) return '12K';
    if (r.includes('8K')) return '8K';
    if (r.includes('6K') || r.includes('5K') || r.includes('5.7K') || r.includes('5.3K')) return '6K';
    if (r.includes('4K') || r.includes('4.5K')) return '4K';
    return '1080p';
  }

  function buildSeedCamera(seed, company, game, index) {
    const cat = getCategory(seed.category);
    const draft = makeCameraDraft(seed.category, company, { mode: game });
    draft.name = seed.name;
    draft.targetSegment = seed.target || cat.target;
    draft.sensor.format = seed.sensor || cat.sensor;
    draft.sensor.mp = seed.mp || draft.sensor.mp;
    if ((company.tech.sensor || 1) >= 2) draft.sensor.type = 'bsi';
    if (['sports', 'cinema'].includes(seed.category) && (company.tech.sensor || 1) >= 3) draft.sensor.type = 'stacked';
    if (['arri', 'blackmagic', 'dji'].includes(company.id) && (company.tech.sensor || 1) >= 3) draft.sensor.type = 'stacked';
    draft.mount.type = seed.mount || cat.mount;
    if (!D.MOUNTS[draft.mount.type]) draft.mount.type = cat.mount;
    draft.video.res = normalizeVideoRes(seed.res);
    draft.video.fps = seed.fps || draft.video.fps;
    if (!videoComboAllowed(draft.video.res, draft.video.fps, company.tech.video || 1)) {
      draft.video.fps = bestAllowedVideoFps(draft.video.res, company.tech.video || 1, Math.min(seed.fps || 30, 60));
    }
    draft.price = seed.price;
    draft.kitLensId = null;
    if (['retro', 'rangefinder', 'dslr', 'compact'].includes(draft.body.type)) {
      draft.colors.secondaryOn = true;
    }
    const ev = evaluateCamera(draft, company);
    const product = productFromDraft(draft, ev, company, game, {
      id: 'seed-cam-' + company.id + '-' + index,
      age: seed.age || 0,
      unitCost: Math.round(seed.price * 0.47),
      overallOverride: seed.score,
      isSeed: true,
      stock: 0
    });
    product.ratings = ev.ratings;
    product.fairPrice = Math.round(seed.price * (0.82 + Math.random() * 0.12));
    return product;
  }

  function buildSeedLens(seed, company, game, index) {
    const lensDraft = makeLensDraft(company, {
      name: seed.name,
      mount: seed.mount || 'E',
      lensType: seed.type || (seed.focal[0] === seed.focal[1] ? 'prime' : 'zoom'),
      focalMin: seed.focal[0],
      focalMax: seed.focal[1],
      maxAperture: seed.aperture,
      coverage: seed.coverage || (seed.mount === 'M43' ? 'm43' : (seed.mount === 'X' ? 'apsc' : (seed.mount === 'GFX' ? 'mf' : 'ff'))),
      targetSegment: seed.type === 'cinema' ? 'cinema' : 'professional'
    });
    lensDraft.price = seed.price;
    lensDraft.body.style = seed.type === 'cinema' ? 'cine_black' : (seed.name.match(/Art|Sigma/) ? 'black_pro' : 'black_pro');
    lensDraft.body.length = seed.type === 'cinema' ? 180 : (seed.focal[1] > 150 ? 190 : 112);
    lensDraft.body.weight = seed.type === 'cinema' ? 1800 : (seed.focal[1] > 150 ? 1400 : 700);
    lensDraft.body.diameter = seed.type === 'cinema' ? 114 : (seed.focal[1] > 150 ? 94 : 78);
    if (seed.type === 'cinema') {
      lensDraft.body.focusGear = true;
      lensDraft.body.zoomGear = seed.focal[0] !== seed.focal[1];
      lensDraft.focus.motor = 'cinema';
    }
    const ev = evaluateLens(lensDraft, company);
    const product = lensProductFromDraft(lensDraft, ev, company, game, {
      id: 'seed-lens-' + company.id + '-' + index,
      age: seed.age || 0,
      unitCost: Math.round(seed.price * 0.4),
      overallOverride: seed.score,
      isSeed: true,
      stock: 0
    });
    product.fairPrice = Math.round(seed.price * (0.85 + Math.random() * 0.1));
    product.ratings = ev.ratings;
    return product;
  }

  // ---------- market model ----------
  function aggregateModifiers(game) {
    const result = { demand: {}, materialCost: 1, sensorCost: 1, pressure: 1, thermalRisk: 1, defectRisk: 1, afExpectation: 1, designDemand: 1, pricePressure: 1 };
    (game.market.activeModifiers || []).forEach(mod => {
      const eff = mod.effects || {};
      if (eff.demand) {
        Object.keys(eff.demand).forEach(k => result.demand[k] = (result.demand[k] || 1) * eff.demand[k]);
      }
      ['materialCost', 'sensorCost', 'pressure', 'thermalRisk', 'defectRisk', 'afExpectation', 'designDemand', 'pricePressure'].forEach(k => {
        if (eff[k]) result[k] *= eff[k];
      });
    });
    return result;
  }

  function categoryDemand(game, catId, monthIndexOverride) {
    const cat = getCategory(catId);
    const mi = monthIndexOverride == null ? game.monthIndex : monthIndexOverride;
    const season = cat.seasonality[seasonMonth(mi)] || 1;
    const modifiers = aggregateModifiers(game);
    const growth = 1 + Math.max(0, mi) * 0.0018;
    return Math.round(cat.demand * season * growth * (modifiers.demand[catId] || 1));
  }

  function getAIBrand(game, brandId) {
    return (game.market.aiBrands || []).find(b => b.id === brandId);
  }

  function aiProductScore(product, cat) {
    const brand = getAIBrand(this && this.market ? this.market : { market: {} }, product.brandId);
    const valueBase = cat.basePrice * (0.7 + product.score / 100 * 0.9);
    const value = clamp(valueBase / product.price, 0.4, 2);
    const ageFactor = clamp(1 - Math.max(0, product.age - 12) * 0.009, 0.55, 1);
    const brandF = brand ? (0.7 + (brand.awareness || 70) / 250 + (brand.reputation || 70) / 300) : 1;
    return product.score * (0.72 + value * 0.22) * ageFactor * brandF;
  }

  function getCategoryPressure(game, catId) {
    const cat = getCategory(catId);
    const modifiers = aggregateModifiers(game);
    const products = (game.market.aiProducts || []).filter(p => p.category === catId && p.age <= 68);
    if (!products.length) return clamp(58 * modifiers.pressure, 40, 105);
    const values = products.map(p => {
      const brand = getAIBrand(game, p.brandId);
      const fair = cat.basePrice * (0.7 + p.score / 100 * 0.9);
      const value = clamp(fair / p.price, 0.4, 2);
      const ageFactor = clamp(1 - Math.max(0, p.age - 12) * 0.009, 0.55, 1);
      const brandF = brand ? (0.7 + (brand.awareness || 70) / 250 + (brand.reputation || 70) / 300) : 1;
      return p.score * (0.72 + value * 0.22) * ageFactor * brandF;
    }).sort((a, b) => b - a).slice(0, 5);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clamp(avg * modifiers.pressure, 35, 110);
  }

  function effectiveCameraPricing(game, product) {
    const kit = getKitLens(game, product);
    let effectivePrice = product.price;
    let effectiveFair = product.fairPrice;
    let kitFactor = 1;
    if (kit) {
      const kitShare = 0.55;
      effectivePrice += kit.price * 0.8 * kitShare;
      effectiveFair += kit.fairPrice * 0.8 * kitShare;
      kitFactor = 1.02 + (kit.overall - 70) * 0.002;
    }
    return { kit, effectivePrice, effectiveFair, kitFactor };
  }

  function estimateCameraDemand(game, product, options) {
    options = options || {};
    const cat = getCategory(product.category);
    const modifiers = aggregateModifiers(game);
    const categoryTotal = categoryDemand(game, product.category, options.monthIndex);
    const pressure = getCategoryPressure(game, product.category);
    const sameCategory = (game.products || []).filter(p => p.status === 'active' && p.category === product.category);
    const ownPenalty = 1 / Math.sqrt(1 + Math.max(0, sameCategory.length - 1) * 0.3);
    const pricing = effectiveCameraPricing(game, product);
    const price = Math.max(99, pricing.effectivePrice);
    const fair = Math.max(price * 0.3, pricing.effectiveFair);
    const value = clamp(fair / price, 0.2, 3.2);
    const awareness = clamp(game.company.awareness || 0, 0, 100);
    const reputation = clamp(game.company.reputation || 0, 0, 100);
    const salesStaff = game.company.staff.sales || 0;
    const brandFactor = (0.34 + awareness / 100 * 0.82) * (0.74 + reputation / 100 * 0.4) * (0.9 + Math.sqrt(salesStaff) / 75);
    const categoryAffinity = product.targetSegment === cat.target ? 1.08 : 0.92;
    const desire = (product.overall || 50) * 0.48 + (product.traits ? product.traits.looks : 50) * 0.22 + (product.targetMatch || 50) * 0.18 + (product.traits ? product.traits.premium : 30) * 0.12;
    const launchBoost = 1 + Math.min(0.55, (product.launchHype || 0) / 150) + (product.ageMonths <= 1 ? 0.08 : 0);
    const ageDecay = product.ageMonths <= 16 ? 1 : clamp(1 - (product.ageMonths - 16) * 0.016, 0.62, 1);
    let designBoost = modifiers.designDemand > 1 ? 0.8 + (product.traits ? product.traits.looks : 50) / 100 * 0.5 : 1;
    if (modifiers.afExpectation > 1 && (product.scores ? product.scores.focus : 50) < 68) designBoost *= 0.94;
    const pricePressure = modifiers.pricePressure > 1 ? 0.97 : 1;
    let share = 0.145
      * Math.pow(clamp(desire, 30, 110) / 75, 2.05)
      * Math.pow(value, 1.28)
      * brandFactor
      * (0.72 + (product.targetMatch || 50) / 160)
      * launchBoost
      * ageDecay
      * designBoost
      * pricing.kitFactor
      * categoryAffinity
      * ownPenalty
      * Math.pow(76 / Math.max(35, pressure), 0.88)
      * (options.forecast ? 1 : rand(0.9, 1.11))
      * pricePressure;
    share = clamp(share, 0.0004, 0.31);
    const demandUnits = Math.max(0, Math.round(categoryTotal * share));
    return {
      units: demandUnits, share, categoryTotal, pressure, value, desire,
      effectivePrice: price, fairPrice: fair, kit: pricing.kit, kitFactor: pricing.kitFactor,
      brandFactor, ownPenalty
    };
  }

  function estimateLensDemand(game, lens, options) {
    options = options || {};
    const modifiers = aggregateModifiers(game);
    const mountId = lens.mount && lens.mount.type ? lens.mount.type : 'E';
    const coverageIdx = D.SENSOR_FORMATS[lens.coverage] ? D.SENSOR_FORMATS[lens.coverage].index : 4;
    const cameras = (game.products || []).filter(p => p.status === 'active' && p.design && p.design.mount && p.design.mount.type === mountId);
    let ownCameraForecast = 0;
    cameras.forEach(cam => {
      const sIdx = D.SENSOR_FORMATS[cam.design.sensor.format] ? D.SENSOR_FORMATS[cam.design.sensor.format].index : 4;
      if (coverageIdx >= sIdx) ownCameraForecast += estimateCameraDemand(game, cam, { forecast: true }).units;
    });
    const installed = (game.company.installedBase && game.company.installedBase[mountId]) || 0;
    const baseMarket = BASE_LENS_MARKET[mountId] || 900;
    const ownEcosystem = ownCameraForecast * 0.19 + Math.max(0, installed) * 0.004;
    const hasActiveCamera = (game.products || []).some(p => p.status === 'active');
    const thirdPartyLens = !hasActiveCamera && (game.lenses || []).some(l => l.status === 'active');
    const marketFactor = thirdPartyLens ? 0.4 : 0.2;
    const lensAppeal = (lens.overall || 60) * 0.56 + (lens.metrics ? lens.metrics.looks : 50) * 0.16 + (lens.metrics ? lens.metrics.build : 50) * 0.14 + (lens.metrics ? lens.metrics.portability : 50) * 0.14;
    const price = Math.max(99, lens.price);
    const fair = Math.max(price * 0.25, lens.fairPrice || price);
    const value = clamp(fair / price, 0.15, 3.5);
    const awareness = clamp(game.company.awareness || 0, 0, 100);
    const reputation = clamp(game.company.reputation || 0, 0, 100);
    const brandFactor = Math.max(0.52, (0.3 + awareness / 100 * 0.82) * (0.76 + reputation / 100 * 0.38));
    const ageDecay = lens.ageMonths <= 20 ? 1 : clamp(1 - (lens.ageMonths - 20) * 0.014, 0.6, 1);
    const base = (baseMarket * marketFactor + ownEcosystem) * Math.pow(clamp(lensAppeal, 20, 100) / 70, 1.6) * Math.pow(value, 1.15) * brandFactor * ageDecay;
    const units = Math.max(0, Math.round(base * (options.forecast ? 1 : rand(0.88, 1.13))));
    return { units, baseMarket, ownEcosystem, value, lensAppeal, brandFactor, categoryTotal: baseMarket, thirdPartyLens };
  }

  function getPlayerUnitsByCategory(game, mode) {
    const map = {};
    (game.products || []).filter(p => p.status === 'active').forEach(p => {
      let units = 0;
      if (mode === 'actual') units = p.lastUnits || 0;
      else if (mode === 'stored') units = p.lastUnits || 0;
      else units = estimateCameraDemand(game, p, { forecast: true }).units;
      map[p.category] = (map[p.category] || 0) + units;
    });
    return map;
  }

  function activeAISnapshotProducts(game) {
    return (game.market.aiProducts || []).filter(p => p.age <= 68);
  }

  function computeMarketSnapshot(game, playerUnitsByCategory, options) {
    options = options || {};
    const monthIdx = options.monthIndex == null ? game.monthIndex : options.monthIndex;
    const brands = new Map();
    const addBrand = (id, name, color, isPlayer, extra) => {
      if (!brands.has(id)) brands.set(id, Object.assign({ id, name, color, isPlayer: !!isPlayer, units: 0, byCategory: {} }, extra || {}));
      return brands.get(id);
    };
    addBrand(game.company.id, game.company.name, game.company.color || '#d5a734', true);
    (game.market.aiBrands || []).forEach(b => addBrand(b.id, b.name, b.color, false, { en: b.en }));
    addBrand('others', '其他厂商', '#666b62', false);
    const categories = {};
    let playerTotal = 0;
    let marketTotal = 0;
    const aiProducts = activeAISnapshotProducts(game);
    D.CATEGORY_ORDER.forEach(catId => {
      const demand = categoryDemand(game, catId, monthIdx);
      const playerUnits = Math.max(0, Math.min(demand * 1.1, Math.round((playerUnitsByCategory && playerUnitsByCategory[catId]) || 0)));
      playerTotal += playerUnits;
      marketTotal += demand;
      categories[catId] = { demand, playerUnits, playerShare: demand > 0 ? playerUnits / demand * 100 : 0 };
      const playerBrand = addBrand(game.company.id, game.company.name, game.company.color || '#d5a734', true);
      playerBrand.units += playerUnits;
      playerBrand.byCategory[catId] = playerUnits;
      const remaining = Math.max(0, demand - playerUnits);
      const cat = getCategory(catId);
      const candidates = aiProducts.filter(p => p.category === catId);
      if (!candidates.length) {
        const other = addBrand('others', '其他厂商', '#666b62', false);
        other.units += remaining;
        other.byCategory[catId] = (other.byCategory[catId] || 0) + remaining;
      } else {
        const weighted = candidates.map(p => {
          const brand = getAIBrand(game, p.brandId);
          const fair = cat.basePrice * (0.7 + p.score / 100 * 0.9);
          const value = clamp(fair / p.price, 0.35, 2.2);
          const ageF = clamp(1 - Math.max(0, p.age - 12) * 0.009, 0.55, 1);
          const brandF = brand ? (0.55 + (brand.awareness || 70) / 220 + (brand.reputation || 70) / 320) : 1;
          return { p, w: Math.pow(p.score / 60, 1.75) * Math.pow(value, 0.75) * ageF * brandF };
        });
        const totalWeight = weighted.reduce((sum, x) => sum + x.w, 0);
        weighted.forEach(x => {
          const units = totalWeight > 0 ? remaining * x.w / totalWeight : 0;
          const brand = addBrand(x.p.brandId, x.p.brandName, x.p.brandColor, false);
          brand.units += units;
          brand.byCategory[catId] = (brand.byCategory[catId] || 0) + units;
          x.p.lastUnits = units;
          x.p.share = demand > 0 ? units / demand * 100 : 0;
        });
      }
    });
    // merge cases where player had no product in a category; all AI products get a rough per-category share above.
    const brandList = Array.from(brands.values()).map(b => ({
      ...b,
      share: marketTotal > 0 ? b.units / marketTotal * 100 : 0,
      units: Math.round(b.units),
      byCategory: Object.fromEntries(Object.entries(b.byCategory).map(([k, v]) => [k, Math.round(v)]))
    })).sort((a, b) => b.units - a.units);
    const playerRow = brandList.find(b => b.isPlayer);
    const snapshot = {
      monthIndex: monthIdx,
      label: monthShort(monthIdx),
      totalDemand: marketTotal,
      playerUnits: Math.round(playerTotal),
      playerShare: marketTotal > 0 ? playerTotal / marketTotal * 100 : 0,
      brands: brandList,
      categories,
      playerRank: playerRow ? brandList.indexOf(playerRow) + 1 : brandList.length,
      aiProducts: aiProducts.map(p => ({ id: p.id, name: p.name, brandId: p.brandId, category: p.category, price: p.price, score: p.score, age: p.age, lastUnits: Math.round(p.lastUnits || 0), share: p.share || 0 }))
    };
    game.company.share = snapshot.playerShare;
    game.market.snapshot = snapshot;
    return snapshot;
  }

  function getCompanyMarketRank(game) {
    const snapshot = game.market.snapshot;
    if (!snapshot) return 99;
    return snapshot.playerRank;
  }

  // ---------- initialization ----------
  function makePlayerFromTakeover(def) {
    const equipmentOwned = def.ownFactoryLevel || 0;
    const mode = def.odmPartner === 'self' ? 'self' : 'partner';
    return {
      id: def.id,
      name: def.name,
      en: def.en,
      mark: def.mark,
      logo: def.logo,
      hq: def.hq,
      founded: def.founded,
      isReal: true,
      color: def.color,
      positioning: def.positioning,
      tagline: def.tagline,
      brief: def.brief,
      playstyle: def.playstyle,
      strengths: deepClone(def.strengths || []),
      cash: def.cash,
      debt: def.debt || 0,
      reputation: def.reputation,
      awareness: def.awareness,
      share: def.startingShare || 0,
      fans: Math.round(def.awareness * 120000),
      tech: Object.assign({ sensor: 1, video: 1, af: 1, ibis: 1, color: 1, codec: 1, cooling: 1, battery: 1, screen: 1, optics: 1, material: 1, modular: 1, software: 1 }, def.tech),
      staff: Object.assign({ engineers: 4, designers: 2, qc: 1, marketing: 1, sales: 1 }, def.staff),
      fixedOverhead: def.fixedOverhead,
      marketingBudget: def.marketingBudget || 2000000,
      sensorSupplier: def.sensorSupplier || 'sony_semi',
      chipLabLevel: ((def.tech && def.tech.sensor >= 5) ? 2 : (def.tech && def.tech.sensor >= 4) ? 1 : 0),
      chipPrograms: [],
      cmosChips: [],
      afChips: [],
      chipSeq: 1,
      chipStrategy: { cmos: def.sensorSupplier === 'inhouse' ? 'inhouse' : 'procure', af: 'procure' },
      manufacturingMode: mode,
      odmPartner: def.odmPartner === 'self' ? 'luxshare' : def.odmPartner,
      ownFactoryLevel: equipmentOwned,
      design: deepClone(def.design || {}),
      projects: [],
      campaignCooldowns: {},
      installedBase: {},
      loanRate: 0.0065,
      taxRate: 0.25,
      lastMonthUnits: 0,
      lastMonthRevenue: 0,
      lastMonthProfit: 0,
      targetSegment: 'professional',
      sourceCompanyId: def.id
    };
  }

  function makePlayerFromStartup(form) {
    const arch = D.ARCHETYPES[form.archetype] || D.ARCHETYPES.minimal;
    const style = D.STARTUP_STYLES[form.style] || D.STARTUP_STYLES.industrial;
    const diff = D.DIFFICULTIES[form.difficulty] || D.DIFFICULTIES.indie;
    const tech = {};
    D.TECH_ORDER.forEach(k => tech[k] = 1);
    Object.keys(arch.tech || {}).forEach(k => tech[k] = Math.max(tech[k] || 1, arch.tech[k]));
    const staff = Object.assign({ engineers: 5, designers: 2, qc: 1, marketing: 1, sales: 1 }, arch.staff);
    const design = deepClone(style.design);
    if (form.accentColor) design.accent = form.accentColor;
    if (form.mainColor) design.mainColor = form.mainColor;
    const accent = form.accentColor || style.design.accent;
    return {
      id: 'custom-' + Date.now().toString(36),
      name: form.name || '新影像公司',
      en: (form.en || form.name || 'FRAME').trim(),
      mark: (form.en || form.name || 'FRAME').trim().slice(0, 10),
      logo: (form.en || form.name || 'F').trim().charAt(0).toUpperCase(),
      hq: form.hq || '深圳 · 中国',
      founded: 2026,
      isReal: false,
      color: accent,
      positioning: (form.positioning || '独立影像品牌'),
      tagline: '从零开始，造一台真正想买的相机。',
      brief: arch.desc,
      playstyle: arch.name,
      strengths: [arch.name + ' 的品牌基因', style.name + ' 的视觉语言', '从零建立的用户关系'],
      cash: diff.cash,
      debt: 0,
      reputation: Math.round(diff.reputation + arch.rep * 0.35),
      awareness: Math.round(diff.awareness + arch.awareness * 0.35),
      share: 0,
      fans: 1500 + diff.awareness * 800,
      tech,
      staff,
      fixedOverhead: 3200000,
      marketingBudget: 500000,
      sensorSupplier: form.archetype === 'value' ? 'tower' : 'sony_semi',
      chipLabLevel: 0,
      chipPrograms: [],
      cmosChips: [],
      afChips: [],
      chipSeq: 1,
      chipStrategy: { cmos: 'procure', af: 'procure' },
      manufacturingMode: 'partner',
      odmPartner: form.archetype === 'cinema' ? 'jabil' : 'luxshare',
      ownFactoryLevel: 0,
      design,
      accentColor: accent,
      projects: [],
      campaignCooldowns: {},
      installedBase: {},
      loanRate: 0.0068,
      taxRate: 0.25,
      lastMonthUnits: 0,
      lastMonthRevenue: 0,
      lastMonthProfit: 0,
      targetSegment: form.targetSegment || 'enthusiast',
      sourceCompanyId: null,
      archetype: arch.id,
      style: style.id,
      difficulty: diff.id,
      startupStaffCount: companyStaffCount({ staff }),
      visualStyle: style.name
    };
  }

  function buildAIBrands(game) {
    return D.COMPANIES
      .filter(c => c.id !== game.company.id && c.catalog && c.catalog.length)
      .map(c => {
        const categories = Array.from(new Set([...(c.catalog || []).map(s => s.category), ...Object.keys(D.AI_SERIES[c.id] || {})]));
        return {
          id: c.id, name: c.name, en: c.en, color: c.color, reputation: c.reputation, awareness: c.awareness,
          focus: categories, pricePremium: AI_PRICE_PREMIUM[c.id] || 1,
          averageTech: D.TECH_ORDER.reduce((s, k) => s + (c.tech[k] || 1), 0) / D.TECH_ORDER.length,
          series: D.AI_SERIES[c.id] || {},
          aggression: 0.35 + (c.awareness / 100) * 0.3 + Math.random() * 0.2
        };
      });
  }

  function buildAIName(brand, categoryId, existing) {
    const pool = (brand.series && brand.series[categoryId]) || [];
    const activeNames = new Set((existing || []).map(p => p.name));
    for (let i = 0; i < pool.length; i++) {
      if (!activeNames.has(pool[i])) return pool[i];
    }
    const year = START_YEAR + Math.floor(2026 / 12) + Math.floor(Math.random() * 2);
    const base = pool[0] || (brand.name + ' ' + getCategory(categoryId).code);
    let candidate = base + ' ' + (year + 1);
    let n = 2;
    while (activeNames.has(candidate)) {
      candidate = base + ' ' + (year + 1) + '-' + n;
      n++;
    }
    return candidate;
  }

  function buildAISeedProduct(company, seed, index) {
    return {
      id: 'ai-' + company.id + '-' + index,
      brandId: company.id,
      brandName: company.name,
      brandColor: company.color,
      name: seed.name,
      category: seed.category,
      price: seed.price,
      initialPrice: seed.price,
      score: seed.score,
      basePrice: seed.price,
      age: seed.age || 0,
      mp: seed.mp,
      res: seed.res,
      fps: seed.fps,
      mount: seed.mount,
      target: seed.target,
      lastUnits: 0,
      share: 0,
      generated: false
    };
  }

  function initialGameNews(game, companyDef) {
    const news = [];
    const add = (tag, title, text, extra) => news.push(Object.assign({
      id: uid('news'), tag, title, text, date: monthShort(game.monthIndex), tone: 'neutral', createdAt: Date.now()
    }, extra || {}));
    D.INITIAL_NEWS.forEach(n => add(n.tag, n.title, n.text));
    if (game.mode === 'takeover' && companyDef) {
      add('公司', `你正式接管 ${companyDef.name} 影像业务`, `${companyDef.tagline} 现有 ${companyDef.catalog.length} 条相机产品线、${companyDef.lensCatalog.length} 支在售镜头。先稳住基本盘，再决定你的第一台新机。`, { tone: 'good', color: companyDef.color });
    } else {
      add('公司', `${game.company.name} 正式成立`, `总部位于${game.company.hq}。没有产品、没有渠道、没有历史包袱。第一台相机将定义你是谁。`, { tone: 'good', color: game.company.color });
    }
    add('市场', '2026 年的相机市场正在重新分层', '参数不再是唯一答案。外观、色彩、操控与内容生态，正在成为溢价的新来源。', { tone: 'neutral' });
    return news;
  }

  function initGame(config) {
    const mode = config.mode || 'takeover';
    const now = Date.now();
    let company;
    let companyDef = null;
    if (mode === 'takeover') {
      companyDef = getCompany(config.companyId) || D.COMPANIES[0];
      company = makePlayerFromTakeover(companyDef);
    } else {
      company = makePlayerFromStartup(config.startup || {});
    }
    const game = {
      version: SAVE_VERSION,
      createdAt: now,
      updatedAt: now,
      mode,
      difficulty: mode === 'startup' ? (config.startup && config.startup.difficulty || 'indie') : 'takeover',
      monthIndex: 0,
      startLabel: monthLabel(0),
      company,
      products: [],
      lenses: [],
      drafts: { camera: null, lens: null },
      market: {
        aiBrands: [],
        aiProducts: [],
        activeModifiers: [],
        snapshot: null,
        events: [],
        lastAILaunches: [],
        lastPriceCuts: []
      },
      news: [],
      history: [],
      stats: {
        camerasLaunched: 0,
        lensesLaunched: 0,
        totalUnits: 0,
        cameraUnits: 0,
        lensUnits: 0,
        totalRevenue: 0,
        totalProfit: 0,
        campaignSpend: 0,
        rdSpend: 0,
        peakMonthlyUnits: 0,
        lastMonthUnits: 0,
        cinemaLaunched: 0,
        monthsPlayed: 0
      },
      milestones: {},
      lastReport: null,
      settings: { reducedMotion: false, showTips: true },
      art: {
        baseline: {
          mode: mode === 'takeover' ? 'brand' : 'category',
          brandId: company.isReal ? company.id : 'frame',
          modelId: null
        },
        adherence: 0.7,
        settings: { online: false, autoCache: false, autoSync: false, showReference: true, quality: 'high' }
      },
      bootCompany: companyDef ? companyDef.id : null
    };
    if (window.FrameArt && window.FrameArt.referenceModels) {
      try {
        const refs = window.FrameArt.referenceModels({ company, category: 'mirrorless', limit: 6 });
        game.art.baseline.modelId = refs[0] ? refs[0].id : null;
        game.art.references = refs.map(m => ({ id: m.id, brand: m.brand, name: m.name, cat: m.cat }));
      } catch (e) { /* ignore */ }
    }

    game.market.aiBrands = buildAIBrands(game);
    game.market.aiProducts = [];
    game.market.aiBrands.forEach(brand => {
      const def = D.COMPANIES.find(c => c.id === brand.id);
      (def.catalog || []).forEach((seed, idx) => game.market.aiProducts.push(buildAISeedProduct(def, seed, idx)));
    });

    if (mode === 'takeover') {
      (companyDef.catalog || []).forEach((seed, idx) => {
        const p = buildSeedCamera(seed, company, game, idx);
        game.products.push(p);
      });
      (companyDef.lensCatalog || []).forEach((seed, idx) => {
        const l = buildSeedLens(seed, company, game, idx);
        game.lenses.push(l);
      });
      // Initial inventory inherited from the existing business.
      game.products.forEach(p => {
        const forecast = estimateCameraDemand(game, p, { forecast: true }).units;
        p.lastForecast = forecast;
        p.stock = Math.max(80, Math.round(forecast * 0.95));
      });
      // Estimate an installed base from the inherited camera business.
      game.company.installedBase = {};
      game.products.forEach(p => {
        const mount = p.design.mount ? p.design.mount.type : 'E';
        if (mount && mount !== 'FIXED') {
          const forecast = estimateCameraDemand(game, p, { forecast: true }).units;
          game.company.installedBase[mount] = (game.company.installedBase[mount] || 0) + forecast * 18;
        }
      });
      game.lenses.forEach(l => {
        const demand = estimateLensDemand(game, l, { forecast: true }).units;
        l.lastForecast = demand;
        l.stock = Math.max(50, Math.round(demand * 0.9));
      });
      game.news = initialGameNews(game, companyDef);
    } else {
      game.news = initialGameNews(game, null);
      game.company.installedBase = {};
    }

    // Initial share / competitive snapshot based on forecast, not on a fabricated sale.
    const playerUnits = getPlayerUnitsByCategory(game, 'forecast');
    const snap = computeMarketSnapshot(game, playerUnits, { monthIndex: game.monthIndex });
    game.company.share = snap.playerShare;
    game.history.push({
      mIndex: -1, label: '开局', cash: game.company.cash, revenue: 0, profit: 0,
      units: 0, share: game.company.share, reputation: game.company.reputation,
      lensUnits: 0, debt: game.company.debt
    });
    game.stats.peakMonthlyUnits = 0;
    refreshMilestones(game, { silent: true });
    normalizeChipState(game);
    game.updatedAt = Date.now();
    return game;
  }

  // ---------- launch events ----------
  function defaultLaunchEvent(company, campaignId) {
    const hq = (company && company.hq) || '';
    let city = 'shanghai';
    if (/日本/.test(hq)) city = 'tokyo';
    else if (/美国/.test(hq)) city = 'newyork';
    else if (/德国|英国|欧洲/.test(hq)) city = 'london';
    const none = campaignId === 'none';
    return {
      format: none ? 'stream' : 'keynote',
      city,
      press: none ? 'none' : 'core',
      kol: none ? 'none' : 'micro',
      focus: 'image',
      preorder: false
    };
  }
  function normalizeLaunchEvent(draft, company) {
    if (!draft) return null;
    const def = defaultLaunchEvent(company, draft.campaign);
    const plan = Object.assign({}, def, draft.launchEvent || {});
    if (!D.LAUNCH_FORMATS[plan.format]) plan.format = def.format;
    if (!D.LAUNCH_CITIES[plan.city]) plan.city = def.city;
    if (!D.PRESS_TIERS[plan.press]) plan.press = def.press;
    if (!D.KOL_TIERS[plan.kol]) plan.kol = def.kol;
    if (!D.EVENT_FOCUS[plan.focus]) plan.focus = def.focus;
    plan.preorder = !!plan.preorder;
    draft.launchEvent = plan;
    return plan;
  }
  function launchFocusScore(ev, kind, focusId) {
    if (!ev) return 50;
    const focus = D.EVENT_FOCUS[focusId] || D.EVENT_FOCUS.image;
    if (kind === 'lens') {
      const m = ev.metrics || {};
      const map = { image: m.optical, focus: m.af, video: m.cinema, looks: m.looks, value: (ev.valueRatio || 1) * 58 };
      return clamp(map[focus.id] != null ? map[focus.id] : (ev.overall || 50), 0, 100);
    }
    const s = ev.scores || {};
    const t = ev.traits || {};
    const map = {
      image: s.image,
      focus: s.focus,
      video: s.video,
      looks: t.looks,
      value: (ev.valueRatio || 1) * 58
    };
    return clamp(map[focus.id] != null ? map[focus.id] : (ev.overall || 50), 0, 100);
  }
  function computeLaunchEvent(game, draft, ev, kind) {
    const company = game.company;
    const campaign = D.CAMPAIGN_TIERS[draft.campaign] || D.CAMPAIGN_TIERS.none;
    const plan = normalizeLaunchEvent(draft, company);
    const format = D.LAUNCH_FORMATS[plan.format] || D.LAUNCH_FORMATS.stream;
    const city = D.LAUNCH_CITIES[plan.city] || D.LAUNCH_CITIES.online;
    const press = D.PRESS_TIERS[plan.press] || D.PRESS_TIERS.none;
    const kol = D.KOL_TIERS[plan.kol] || D.KOL_TIERS.none;
    const focus = D.EVENT_FOCUS[plan.focus] || D.EVENT_FOCUS.image;
    const focusScore = launchFocusScore(ev, kind, plan.focus);
    const focusMatch = clamp((focusScore - 55) / 40, 0, 1);
    const home = !!(city.home && (company.hq || '').includes(city.home));
    const chipStory = !!(ev && ev.chips && (ev.chips.cmosSource === 'inhouse' || ev.chips.afSource === 'inhouse'));
    const none = campaign.id === 'none' || !campaign.cost;
    const cost = none ? 0 : Math.round(
      campaign.cost * (1 + format.cost * 0.35 + city.cost * 0.2) +
      press.cost + kol.cost + (plan.preorder ? D.PREORDER_OPTIONS.on.cost : 0)
    );
    const mult = format.reach * city.reach * (1 + press.hype + kol.hype + (home ? 0.06 : 0));
    const hype = none ? 0 : clamp(campaign.hype * mult + focusMatch * 10 + (chipStory ? 6 : 0), 0, 160);
    const reach = Math.round(hype * (2.0 + format.reach + city.reach) * 10000);
    const pressScore = none ? 0 : clamp(
      46 + (ev.overall || 50) * 0.28 + focusMatch * 10 + press.score * 3.8 +
      (campaign.id === 'launch' ? 2 : 0) + (campaign.id === 'spectacle' ? 4 : 0) +
      (chipStory ? 2 : 0) - ((ev.valueRatio || 1) < 0.9 ? 3 : 0), 35, 96
    );
    const preorderRate = (plan.preorder && !none) ? clamp(0.08 + hype / 500 + focusMatch * 0.06, 0, 0.55) : 0;
    const awareness = none ? 0 : campaign.awareness * format.reach * city.reach * (0.8 + press.awareness * 0.5);
    const reputation = none ? 0 : clamp((pressScore - 64) / 10 + focusMatch * 1.4, -2, 6);
    return {
      campaign, plan, format, city, press, kol, focus,
      focusScore, focusMatch, home, chipStory,
      cost, hype, reach, pressScore, preorderRate, awareness, reputation,
      label: `${campaign.name} · ${format.name} · ${city.name}`
    };
  }

  // ---------- previews for the design lab ----------
  function previewCameraLaunch(game, draft) {
    const company = game.company;
    const ev = evaluateCamera(draft, company);
    const event = computeLaunchEvent(game, draft, ev, 'camera');
    // A transient product is enough for demand estimation.
    const ghost = productFromDraft(draft, ev, company, game, { stock: 0, launchHype: event.hype, id: 'preview-camera' });
    ghost.launchHype = event.hype;
    ghost.ageMonths = 0;
    const demand = estimateCameraDemand(game, ghost, { forecast: true });
    const preorderUnits = Math.round(demand.units * event.preorderRate);
    ghost.preorderUnits = preorderUnits;
    const tooling = ev.tooling;
    const campaignCost = event.cost;
    const cert = D.CERTIFICATIONS[draft.certification] || D.CERTIFICATIONS.standard;
    const certCost = cert.cost;
    const initialStock = Math.max(0, Math.round(draft.initialStock != null && draft.initialStock !== '' ? Number(draft.initialStock) : ev.suggestedStock));
    const totalLaunch = tooling + initialStock * ev.unitCost + campaignCost + certCost;
    return { ev, demand, tooling, campaignCost, eventCost: event.cost, event, cert, certCost, initialStock, totalLaunch, ghost, preorderUnits };
  }

  function previewLensLaunch(game, draft) {
    const company = game.company;
    const ev = evaluateLens(draft, company);
    const event = computeLaunchEvent(game, draft, ev, 'lens');
    const ghost = lensProductFromDraft(draft, ev, company, game, { stock: 0, launchHype: event.hype, id: 'preview-lens' });
    ghost.launchHype = event.hype;
    ghost.ageMonths = 0;
    const demand = estimateLensDemand(game, ghost, { forecast: true });
    const preorderUnits = Math.round(demand.units * event.preorderRate);
    ghost.preorderUnits = preorderUnits;
    const tooling = ev.tooling;
    const campaignCost = event.cost;
    const initialStock = Math.max(0, Math.round(draft.initialStock != null && draft.initialStock !== '' ? Number(draft.initialStock) : ev.suggestedStock));
    const totalLaunch = tooling + initialStock * ev.unitCost + campaignCost;
    return { ev, demand, tooling, campaignCost, eventCost: event.cost, event, initialStock, totalLaunch, ghost, preorderUnits };
  }

  // ---------- general company calculations ----------
  function addNews(game, item) {
    const news = Object.assign({
      id: uid('news'),
      date: monthShort(game.monthIndex),
      tone: 'neutral',
      tag: '行业',
      title: '',
      text: '',
      color: game.company.color
    }, item || {});
    game.news.unshift(news);
    if (game.news.length > 80) game.news.length = 80;
    return news;
  }

  function addOneOff(game, label, amount, category) {
    if (!game.company.oneOffs) game.company.oneOffs = [];
    game.company.oneOffs.push({ id: uid('oneoff'), label, amount: Math.round(amount), category: category || '其他', date: monthShort(game.monthIndex) });
  }

  function inventoryValue(game) {
    return [...game.products, ...game.lenses].reduce((total, p) => total + Math.max(0, p.stock || 0) * (p.unitCost || 0), 0);
  }

  function companyCreditLimit(game) {
    const company = game.company;
    const recent = (game.history || []).slice(-3);
    const avgRevenue = recent.length ? recent.reduce((s, h) => s + (h.revenue || 0), 0) / recent.length : 0;
    const brandPower = clamp((company.awareness || 0) / 100, 0, 1) * clamp((company.reputation || 0) / 100, 0, 1);
    const base = brandPower * 2800000000 + avgRevenue * 7 + Math.max(0, company.cash || 0) * 0.12 + Math.max(0, company.fans || 0) * 20;
    return Math.max(10000000, Math.round(base / 1000000) * 1000000);
  }

  function companyValuation(game) {
    const c = game.company;
    const brandValue = (c.awareness || 0) * (c.reputation || 0) * 1500000 + (c.fans || 0) * 200;
    const productValue = [...game.products, ...game.lenses].filter(p => p.status === 'active').length * 18000000;
    const inv = inventoryValue(game);
    const recent = (game.history || []).slice(-6);
    const avgProfit = recent.length ? recent.reduce((s, h) => s + (h.profit || 0), 0) / recent.length : 0;
    const profitValue = Math.max(0, avgProfit) * 12 * 7;
    return Math.max(0, Math.round(c.cash - c.debt + brandValue + productValue + inv + profitValue));
  }

  function monthlyFixedCost(game) {
    const c = game.company;
    const man = getManufacturing(c);
    return {
      payroll: monthlySalaryBill(c),
      overhead: (c.fixedOverhead || 0) + chipLabUpkeep(c),
      marketing: c.marketingBudget || 0,
      partnerFee: man.mode === 'partner' ? man.fee : 0,
      factoryUpkeep: getFactoryUpkeep(c),
      interest: Math.round((c.debt || 0) * (c.loanRate || 0.0065))
    };
  }

  function projectEta(game, techKey) {
    const c = game.company;
    const level = (c.tech[techKey] || 1) + 1;
    if (level > 5) return { level, months: 0, cost: 0, points: 0, rate: 0 };
    const tech = D.TECHS[techKey];
    const existing = (c.projects || []).length + 1;
    const rate = researchPower(c) / Math.max(1, existing);
    const points = tech.points[level];
    return { level, months: Math.max(1, Math.ceil(points / rate)), cost: tech.costs[level], points, rate };
  }

  // ---------- product management ----------
  function findProduct(game, id) {
    return game.products.find(p => p.id === id) || game.lenses.find(p => p.id === id);
  }

  function setProductPrice(game, id, price) {
    const p = findProduct(game, id);
    if (!p) return { ok: false, error: '产品不存在。' };
    const n = Math.round(Number(price));
    if (!Number.isFinite(n) || n < 99) return { ok: false, error: '价格必须大于 ¥99。' };
    p.price = n;
    return { ok: true, product: p };
  }

  function setProductionSettings(game, id, settings) {
    const p = findProduct(game, id);
    if (!p) return { ok: false, error: '产品不存在。' };
    if (settings.autoProduction != null) p.autoProduction = !!settings.autoProduction;
    if (settings.monthlyProduction != null) p.monthlyProduction = Math.max(0, Math.round(Number(settings.monthlyProduction) || 0));
    return { ok: true };
  }

  function setKitLens(game, productId, lensId) {
    const p = game.products.find(c => c.id === productId);
    if (!p) return { ok: false, error: '相机不存在。' };
    if (!lensId) {
      p.kitLensId = null;
      p.kitLensName = null;
      return { ok: true };
    }
    const lens = game.lenses.find(l => l.id === lensId && l.status === 'active');
    if (!lens) return { ok: false, error: '镜头不存在或已停产。' };
    const cameraMount = p.design && p.design.mount ? p.design.mount.type : null;
    if (!cameraMount || cameraMount === 'FIXED' || lens.mount.type !== cameraMount) return { ok: false, error: '卡口不兼容，无法作为套装镜头。' };
    const sensorIdx = D.SENSOR_FORMATS[p.design.sensor.format] ? D.SENSOR_FORMATS[p.design.sensor.format].index : 4;
    const covIdx = D.SENSOR_FORMATS[lens.coverage] ? D.SENSOR_FORMATS[lens.coverage].index : 4;
    if (covIdx < sensorIdx) return { ok: false, error: '镜头像场无法覆盖该机身传感器。' };
    p.kitLensId = lens.id;
    p.kitLensName = lens.name;
    return { ok: true };
  }

  function discontinueProduct(game, id) {
    const p = findProduct(game, id);
    if (!p) return { ok: false, error: '产品不存在。' };
    if (p.status !== 'active') return { ok: false, error: '产品已停产。' };
    p.status = 'discontinued';
    p.autoProduction = false;
    p.discontinuedMonth = game.monthIndex;
    addNews(game, {
      tag: '公司', title: `${game.company.name} 宣布 ${p.name} 停产`,
      text: '产品将逐步退出渠道，已售用户的固件与售后服务仍会延续。',
      tone: 'neutral', color: game.company.color
    });
    return { ok: true };
  }

  function toggleProductStatus(game, id) {
    const p = findProduct(game, id);
    if (!p) return { ok: false, error: '产品不存在。' };
    if (p.status === 'active') return discontinueProduct(game, id);
    p.status = 'active';
    p.autoProduction = true;
    delete p.discontinuedMonth;
    addNews(game, {
      tag: '公司', title: `${p.name} 重新上架`,
      text: '经典产品重新回到渠道，可能吸引一部分怀旧用户。',
      tone: 'good', color: game.company.color
    });
    return { ok: true };
  }

  // ---------- R&D ----------
  function startResearch(game, techKey) {
    const c = game.company;
    const tech = D.TECHS[techKey];
    if (!tech) return { ok: false, error: '未知技术。' };
    const current = c.tech[techKey] || 1;
    if (current >= 5) return { ok: false, error: `${tech.name}已达到最高等级。` };
    if ((c.projects || []).some(p => p.tech === techKey)) return { ok: false, error: `已在研发${tech.name}。` };
    if ((c.projects || []).length >= 3) return { ok: false, error: '研发实验室最多同时进行 3 个项目。' };
    const target = current + 1;
    const cost = tech.costs[target];
    const points = tech.points[target];
    if (c.cash < cost) return { ok: false, error: `现金不足，需要 ${moneyNumber(cost)}。` };
    c.cash -= cost;
    c.projects = c.projects || [];
    const project = {
      id: uid('project'), tech: techKey, techName: tech.name, targetLevel: target,
      cost, requiredPoints: points, progress: 0, startedMonth: game.monthIndex,
      estimatedMonths: Math.max(1, Math.ceil(points / (researchPower(c) / (c.projects.length + 1))))
    };
    c.projects.push(project);
    addOneOff(game, `研发立项：${tech.name} Lv.${target}`, cost, '研发');
    game.stats.rdSpend = (game.stats.rdSpend || 0) + cost;
    addNews(game, {
      tag: '研发', title: `${c.name} 启动${tech.name} Lv.${target} 研发`,
      text: `${tech.desc} 项目预算 ${money(cost)}，预计约 ${project.estimatedMonths} 个月完成。`,
      tone: 'neutral', color: c.color
    });
    return { ok: true, project };
  }

  function cancelResearch(game, projectId) {
    const c = game.company;
    c.projects = c.projects || [];
    const idx = c.projects.findIndex(p => p.id === projectId);
    if (idx < 0) return { ok: false, error: '项目不存在。' };
    const p = c.projects[idx];
    const refund = Math.round((p.cost || 0) * 0.35);
    c.cash += refund;
    c.projects.splice(idx, 1);
    addNews(game, { tag: '研发', title: `${p.techName} 研发项目中止`, text: `团队保留了部分成果，回收预算 ${money(refund)}。`, tone: 'warn', color: c.color });
    return { ok: true, refund };
  }

  function monthlyResearchProgress(game, report) {
    const c = game.company;
    c.projects = c.projects || [];
    if (!c.projects.length) return;
    const rate = researchPower(c) / c.projects.length;
    const done = [];
    c.projects.forEach(project => {
      const before = project.progress;
      project.progress = Math.min(project.requiredPoints, project.progress + rate);
      report.rnd.push({
        tech: project.tech, techName: project.techName, targetLevel: project.targetLevel,
        before, after: project.progress, required: project.requiredPoints, rate, complete: project.progress >= project.requiredPoints
      });
      if (project.progress >= project.requiredPoints) done.push(project);
    });
    done.forEach(project => {
      c.tech[project.tech] = Math.max(c.tech[project.tech] || 1, project.targetLevel);
      c.projects = c.projects.filter(p => p.id !== project.id);
      report.researchCompleted.push({ tech: project.tech, techName: project.techName, level: project.targetLevel });
      addNews(game, {
        tag: '研发', title: `${project.techName} 达到 Lv.${project.targetLevel}`,
        text: `${D.TECHS[project.tech].levels[project.targetLevel - 1]} 新产品设计的上限被进一步打开。`,
        tone: 'good', color: c.color
      });
    });
  }

  // ---------- team & operations ----------
  function hireStaff(game, role) {
    const c = game.company;
    const def = D.STAFF_ROLES[role];
    if (!def) return { ok: false, error: '未知岗位。' };
    const cost = Math.round(def.salary * 1.6);
    if (c.cash < cost) return { ok: false, error: `现金不足，招聘需要 ${moneyNumber(cost)}。` };
    c.staff[role] = (c.staff[role] || 0) + 1;
    c.cash -= cost;
    addOneOff(game, `招聘：${def.name}`, cost, '人力');
    return { ok: true, count: c.staff[role], cost };
  }

  function fireStaff(game, role) {
    const c = game.company;
    const def = D.STAFF_ROLES[role];
    if (!def) return { ok: false, error: '未知岗位。' };
    if ((c.staff[role] || 0) <= 0) return { ok: false, error: '该岗位已经没有员工。' };
    const cost = Math.round(def.salary);
    c.staff[role] -= 1;
    c.cash -= cost;
    addOneOff(game, `离职补偿：${def.name}`, cost, '人力');
    return { ok: true, count: c.staff[role], cost };
  }

  function setManufacturing(game, mode, partnerId) {
    const c = game.company;
    if (mode === 'self') {
      if (!c.ownFactoryLevel) return { ok: false, error: '尚未拥有自有工厂，请先升级产线。' };
      c.manufacturingMode = 'self';
      return { ok: true };
    }
    const p = D.ODM_PARTNERS[partnerId];
    if (!p || partnerId === 'self') return { ok: false, error: '请选择有效的外部代工伙伴。' };
    c.manufacturingMode = 'partner';
    c.odmPartner = partnerId;
    return { ok: true };
  }

  function upgradeFactory(game) {
    const c = game.company;
    const current = c.ownFactoryLevel || 0;
    if (current >= 3) return { ok: false, error: '自有产线已经达到最高等级。' };
    const def = D.FACTORY_LEVELS[current];
    const cost = def.upgradeCost;
    if (!cost) return { ok: false, error: '无法继续升级。' };
    if (c.cash < cost) return { ok: false, error: `现金不足，升级需要 ${moneyNumber(cost)}。` };
    c.cash -= cost;
    c.ownFactoryLevel = current + 1;
    addOneOff(game, `工厂升级：${D.FACTORY_LEVELS[current + 1].name}`, cost, '制造');
    addNews(game, {
      tag: '制造', title: `${c.name} ${D.FACTORY_LEVELS[current + 1].name} 落成`,
      text: `自有产能提升至 ${D.FACTORY_LEVELS[current + 1].capacity.toLocaleString('zh-CN')} 台/月，制造成本系数与品控将进一步优化。`,
      tone: 'good', color: c.color
    });
    return { ok: true, level: current + 1, cost };
  }

  function selectSensorSupplier(game, supplierId) {
    const c = game.company;
    const supplier = D.SENSOR_SUPPLIERS[supplierId];
    if (!supplier) return { ok: false, error: '未知传感器供应商。' };
    if (supplier.id === 'inhouse' && (c.tech.sensor || 1) < 4) return { ok: false, error: '自研传感器需要传感器技术 Lv.4。' };
    if (supplier.fee && supplier.id !== c.sensorSupplier) {
      if (c.cash < supplier.fee) return { ok: false, error: `现金不足，建立自研传感器体系需要 ${moneyNumber(supplier.fee)}。` };
      c.cash -= supplier.fee;
      addOneOff(game, '自研传感器体系启动', supplier.fee, '研发');
    }
    c.sensorSupplier = supplierId;
    return { ok: true };
  }

  // ---------- marketing & finance ----------
  function runBrandCampaign(game, campaignId) {
    const c = game.company;
    const campaign = D.BRAND_CAMPAIGNS[campaignId];
    if (!campaign) return { ok: false, error: '未知营销项目。' };
    const readyAt = (c.campaignCooldowns && c.campaignCooldowns[campaignId]) || 0;
    if (game.monthIndex < readyAt) return { ok: false, error: `${campaign.name}还需等待 ${readyAt - game.monthIndex} 个月才能再次投放。` };
    if (c.cash < campaign.cost) return { ok: false, error: `现金不足，需要 ${moneyNumber(campaign.cost)}。` };
    c.cash -= campaign.cost;
    const efficiency = 1 + Math.sqrt(c.staff.marketing || 0) / 20;
    const awareGain = campaign.awareness * efficiency;
    const repGain = campaign.reputation * (0.8 + Math.sqrt(c.staff.marketing || 0) / 35);
    c.awareness = clamp(c.awareness + awareGain * (1 - c.awareness / 125), 0, 100);
    c.reputation = clamp(c.reputation + repGain, 0, 100);
    c.campaignCooldowns = c.campaignCooldowns || {};
    c.campaignCooldowns[campaignId] = game.monthIndex + campaign.cooldown;
    game.stats.campaignSpend += campaign.cost;
    addOneOff(game, `营销：${campaign.name}`, campaign.cost, '营销');
    addNews(game, {
      tag: '营销', title: `${c.name} 启动「${campaign.name}」`,
      text: `${campaign.desc} 品牌曝光 +${awareGain.toFixed(1)}，口碑 +${repGain.toFixed(1)}。`,
      tone: 'good', color: c.color
    });
    return { ok: true, campaign, awareGain, repGain, nextAvailable: c.campaignCooldowns[campaignId] };
  }

  function takeLoan(game, amount) {
    const c = game.company;
    const n = Math.round(Number(amount));
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: '贷款金额无效。' };
    const limit = companyCreditLimit(game);
    const available = Math.max(0, limit - c.debt);
    if (n > available) return { ok: false, error: `超过可用授信额度，最多可借 ${moneyNumber(available)}。` };
    c.cash += n;
    c.debt += n;
    addNews(game, {
      tag: '财务', title: `${c.name} 获得 ${money(n)} 银行授信`,
      text: '资金将用于产品研发、备货与市场扩张。贷款按月计息，请注意现金流。',
      tone: 'neutral', color: c.color
    });
    return { ok: true, amount: n, debt: c.debt };
  }

  function repayLoan(game, amount) {
    const c = game.company;
    const n = Math.min(c.debt, Math.max(0, Math.round(Number(amount))));
    if (!n) return { ok: false, error: '还款金额无效或没有负债。' };
    if (c.cash < n) return { ok: false, error: '现金不足，无法偿还该笔贷款。' };
    c.cash -= n;
    c.debt -= n;
    return { ok: true, amount: n, debt: c.debt };
  }

  // ---------- launch ----------
  function launchCamera(game, draft) {
    if (!draft || draft.kind !== 'camera') return { ok: false, error: '设计草稿不存在。' };
    if (!String(draft.name || '').trim()) return { ok: false, error: '请为相机命名。' };
    const ev = evaluateCamera(draft, game.company);
    if (ev.blocking.length) return { ok: false, error: ev.blocking.map(w => w.text).join(' ') };
    const event = computeLaunchEvent(game, draft, ev, 'camera');
    const cert = D.CERTIFICATIONS[draft.certification] || D.CERTIFICATIONS.standard;
    const initialStock = Math.max(0, Math.round(Number(draft.initialStock) || 0));
    const tooling = ev.tooling;
    const total = tooling + initialStock * ev.unitCost + event.cost + cert.cost;
    if (game.company.cash < total) return { ok: false, error: `现金不足。本次上市需要 ${moneyNumber(total)}，当前现金 ${moneyNumber(game.company.cash)}。` };
    game.company.cash -= total;
    const ghost = productFromDraft(draft, ev, game.company, game, {
      stock: initialStock, launchHype: event.hype, overallOverride: null
    });
    ghost.launchHype = event.hype;
    ghost.ageMonths = 0;
    ghost.releaseMonthIndex = game.monthIndex;
    ghost.ratings = ev.ratings;
    ghost.fairPrice = ev.fairPrice;
    const demandProxy = estimateCameraDemand(game, ghost, { forecast: true });
    const preorders = Math.round(demandProxy.units * event.preorderRate);
    ghost.preorderUnits = preorders;
    ghost.preorders = preorders;
    const report = {
      id: uid('launch'),
      kind: 'camera',
      productId: ghost.id,
      productName: ghost.name,
      monthIndex: game.monthIndex,
      monthLabel: monthLabel(game.monthIndex),
      scale: event.campaign.id,
      scaleName: event.campaign.name,
      label: event.label,
      cost: event.cost,
      hype: event.hype,
      reach: event.reach,
      pressScore: event.pressScore,
      preorders,
      focusScore: event.focusScore,
      focusMatch: event.focusMatch,
      chipStory: event.chipStory,
      plan: event.plan
    };
    ghost.launchEvent = report;
    game.products.push(ghost);
    game.launchEvents = game.launchEvents || [];
    game.launchEvents.push(report);
    const marketingEfficiency = 1 + Math.sqrt(game.company.staff.marketing || 0) / 22;
    game.company.awareness = clamp(game.company.awareness + (event.awareness + cert.awareness) * marketingEfficiency * (1 - game.company.awareness / 125), 0, 100);
    game.company.reputation = clamp((game.company.reputation || 50) + event.reputation, 0, 100);
    game.company.fans = (game.company.fans || 0) + Math.round(event.hype * 1800);
    game.stats.camerasLaunched += 1;
    if (draft.category === 'cinema') game.stats.cinemaLaunched += 1;
    addOneOff(game, `${cert.name}：${ghost.name}`, cert.cost, '认证');
    addOneOff(game, `试产与模具：${ghost.name}`, tooling, '制造');
    addOneOff(game, `首批库存：${ghost.name} × ${initialStock.toLocaleString('zh-CN')}`, initialStock * ev.unitCost, '库存');
    if (event.cost) addOneOff(game, `发布会：${event.label}`, event.cost, '营销');
    game.stats.campaignSpend = (game.stats.campaignSpend || 0) + event.cost;
    const cat = getCategory(draft.category);
    addNews(game, {
      tag: '新品', title: `${game.company.name} 发布 ${ghost.name}`,
      text: `${cat.name} · ${D.SENSOR_FORMATS[draft.sensor.format].name} ${draft.sensor.mp}MP · ${draft.video.res}${draft.video.fps} · 建议零售价 ${moneyNumber(ghost.price)}。${event.label}${preorders ? ' · 预购 ' + preorders.toLocaleString('zh-CN') + ' 台' : ''}。`,
      tone: 'good', color: game.company.color
    });
    game.drafts.camera = null;
    const achieved = refreshMilestones(game);
    return { ok: true, product: ghost, launchCost: total, initialStock, ev, event, report, preorders, achieved };
  }

  function launchLens(game, draft) {
    if (!draft || draft.kind !== 'lens') return { ok: false, error: '镜头设计草稿不存在。' };
    if (!String(draft.name || '').trim()) return { ok: false, error: '请为镜头命名。' };
    const ev = evaluateLens(draft, game.company);
    if (ev.blocking.length) return { ok: false, error: ev.blocking.map(w => w.text).join(' ') };
    const event = computeLaunchEvent(game, draft, ev, 'lens');
    const initialStock = Math.max(0, Math.round(Number(draft.initialStock) || 0));
    const tooling = ev.tooling;
    const total = tooling + initialStock * ev.unitCost + event.cost;
    if (game.company.cash < total) return { ok: false, error: `现金不足。本次上市需要 ${moneyNumber(total)}，当前现金 ${moneyNumber(game.company.cash)}。` };
    game.company.cash -= total;
    const product = lensProductFromDraft(draft, ev, game.company, game, { stock: initialStock, launchHype: event.hype });
    product.launchHype = event.hype;
    product.ageMonths = 0;
    product.releaseMonthIndex = game.monthIndex;
    const demandProxy = estimateLensDemand(game, product, { forecast: true });
    const preorders = Math.round(demandProxy.units * event.preorderRate);
    product.preorderUnits = preorders;
    product.preorders = preorders;
    const report = {
      id: uid('launch'), kind: 'lens', productId: product.id, productName: product.name,
      monthIndex: game.monthIndex, monthLabel: monthLabel(game.monthIndex),
      scale: event.campaign.id, scaleName: event.campaign.name, label: event.label,
      cost: event.cost, hype: event.hype, reach: event.reach, pressScore: event.pressScore,
      preorders, focusScore: event.focusScore, focusMatch: event.focusMatch,
      chipStory: event.chipStory, plan: event.plan
    };
    product.launchEvent = report;
    game.lenses.push(product);
    game.launchEvents = game.launchEvents || [];
    game.launchEvents.push(report);
    const marketingEfficiency = 1 + Math.sqrt(game.company.staff.marketing || 0) / 22;
    game.company.awareness = clamp(game.company.awareness + event.awareness * marketingEfficiency * (1 - game.company.awareness / 125), 0, 100);
    game.company.reputation = clamp((game.company.reputation || 50) + event.reputation, 0, 100);
    game.company.fans = (game.company.fans || 0) + Math.round(event.hype * 900);
    game.stats.lensesLaunched += 1;
    addOneOff(game, `镜头试产：${product.name}`, tooling, '制造');
    addOneOff(game, `首批镜头库存：${product.name} × ${initialStock.toLocaleString('zh-CN')}`, initialStock * ev.unitCost, '库存');
    if (event.cost) addOneOff(game, `发布会：${event.label}`, event.cost, '营销');
    game.stats.campaignSpend = (game.stats.campaignSpend || 0) + event.cost;
    addNews(game, {
      tag: '镜头', title: `${game.company.name} 发布 ${product.name}`,
      text: `${ev.typeDef.name} · ${draft.mount.type} 卡口 · 最大光圈 F${ev.maxAp} · 建议零售价 ${moneyNumber(product.price)}。${event.label}${preorders ? ' · 预购 ' + preorders.toLocaleString('zh-CN') + ' 支' : ''}。`,
      tone: 'good', color: game.company.color
    });
    game.drafts.lens = null;
    const achieved = refreshMilestones(game);
    return { ok: true, product, launchCost: total, initialStock, ev, event, report, preorders, achieved };
  }

  // ---------- market events & AI competition ----------
  function rollMarketEvent(game, report) {
    if ((game.market.activeModifiers || []).length >= 2) return;
    if (!maybe(0.34)) return;
    const activeIds = new Set((game.market.activeModifiers || []).map(m => m.id));
    const candidates = D.MARKET_EVENTS.filter(e => !activeIds.has(e.id));
    if (!candidates.length) return;
    const ev = pick(candidates);
    const modifier = {
      id: ev.id, title: ev.title, tag: ev.tag, text: ev.text, effects: deepClone(ev.effects),
      duration: ev.duration, expiresIn: ev.duration, tone: ev.tone, started: monthShort(game.monthIndex)
    };
    game.market.activeModifiers.push(modifier);
    game.market.events.unshift(modifier);
    if (game.market.events.length > 30) game.market.events.length = 30;
    addNews(game, {
      tag: ev.tag, title: ev.title, text: ev.text,
      tone: ev.tone === 'bad' ? 'warn' : (ev.tone === 'good' ? 'good' : 'neutral')
    });
    report.events.push({ type: 'market', title: ev.title, text: ev.text, tone: ev.tone, duration: ev.duration });
  }

  function tickModifiers(game) {
    if (!game.market.activeModifiers) game.market.activeModifiers = [];
    game.market.activeModifiers.forEach(m => m.expiresIn -= 1);
    game.market.activeModifiers = game.market.activeModifiers.filter(m => m.expiresIn > 0);
  }

  function uniqueAIName(base, category, game) {
    const activeNames = new Set(game.market.aiProducts.map(p => p.name));
    if (!activeNames.has(base)) return base;
    for (let i = 2; i < 20; i++) {
      const candidate = base + ' ' + roman(i);
      if (!activeNames.has(candidate)) return candidate;
    }
    return base + ' ' + (START_YEAR + Math.floor(game.monthIndex / 12) + 1);
  }

  function generateAIProduct(game, brand, categoryId) {
    const cat = getCategory(categoryId);
    const companyDef = D.COMPANIES.find(c => c.id === brand.id);
    if (!companyDef) return null;
    let score = 53 + brand.averageTech * 6 + rand(0, 9);
    if ((companyDef.catalog || []).some(c => c.category === categoryId)) score += 3;
    score = clamp(Math.round(score), 58, 97);
    const name = uniqueAIName(buildAIName(brand, categoryId, game.market.aiProducts), categoryId, game);
    const price = Math.max(499, Math.round(cat.basePrice * (0.68 + score / 100 * 0.98) * brand.pricePremium * rand(0.9, 1.08) / 100) * 100);
    const product = {
      id: uid('ai'),
      brandId: brand.id,
      brandName: brand.name,
      brandColor: brand.color,
      name,
      category: categoryId,
      price,
      initialPrice: price,
      score,
      basePrice: cat.basePrice,
      age: 0,
      mp: categoryId === 'medium' ? randInt(80, 160) : (cat.sensor === 'ff' ? randInt(24, 61) : randInt(20, 40)),
      res: categoryId === 'cinema' ? pick(['6K', '8K']) : (categoryId === 'highres' ? '8K' : '4K'),
      fps: categoryId === 'sports' ? pick([60, 120, 120]) : pick([30, 60, 60, 120]),
      mount: cat.mount,
      target: cat.target,
      lastUnits: 0,
      share: 0,
      generated: true,
      released: game.monthIndex
    };
    game.market.aiProducts.push(product);
    return product;
  }

  function advanceAI(game, report) {
    const products = game.market.aiProducts;
    products.forEach(p => { p.age += 1; });
    // Retire products that are too old for the simulated shelf.
    const before = products.length;
    game.market.aiProducts = products.filter(p => p.age <= 72);
    if (before !== game.market.aiProducts.length) {
      // pruning is silent; it represents normal channel turnover
    }
    // Price cuts on older inventory.
    const cutCandidates = game.market.aiProducts.filter(p => p.age >= 10 && p.price > p.initialPrice * 0.55);
    const cutCount = randInt(1, 2);
    for (let i = 0; i < cutCount && cutCandidates.length; i++) {
      const idx = Math.floor(Math.random() * cutCandidates.length);
      const p = cutCandidates.splice(idx, 1)[0];
      if (!p) continue;
      const cut = rand(0.925, 0.978);
      const oldPrice = p.price;
      p.price = Math.max(Math.round(p.initialPrice * 0.55 / 10) * 10, Math.round(p.price * cut / 10) * 10);
      p.lastPriceCut = oldPrice - p.price;
      if (maybe(0.62)) {
        addNews(game, {
          tag: '竞品', title: `${p.brandName} 下调 ${p.name} 价格`,
          text: `官方渠道价格由 ${moneyNumber(oldPrice)} 调整为 ${moneyNumber(p.price)}，继续加强在该价位段的竞争力。`,
          tone: 'warn', color: p.brandColor
        });
      }
      report.aiActions.push({ type: 'price_cut', brand: p.brandName, name: p.name, oldPrice, newPrice: p.price, text: `${p.brandName} 将 ${p.name} 降价至 ${moneyNumber(p.price)}` });
    }

    // New competitor launches.
    const launchChance = 0.69;
    const launches = maybe(launchChance) ? (maybe(0.18) ? 2 : 1) : 0;
    for (let i = 0; i < launches; i++) {
      const aiBrands = game.market.aiBrands.filter(b => b.focus && b.focus.length);
      if (!aiBrands.length) break;
      const totalWeight = aiBrands.reduce((s, b) => s + Math.pow(b.awareness / 70, 1.3) * (1 + b.aggression * 0.2), 0);
      let r = Math.random() * totalWeight;
      let brand = aiBrands[0];
      for (const b of aiBrands) {
        r -= Math.pow(b.awareness / 70, 1.3) * (1 + b.aggression * 0.2);
        if (r <= 0) { brand = b; break; }
      }
      const focus = brand.focus.filter(c => D.CATEGORIES[c]);
      const category = pick(focus.length ? focus : D.CATEGORY_ORDER);
      const p = generateAIProduct(game, brand, category);
      if (!p) continue;
      addNews(game, {
        tag: '竞品新品', title: `${p.brandName} 发布 ${p.name}`,
        text: `${getCategory(p.category).name} · 官方定价 ${moneyNumber(p.price)} · 媒体预期评分 ${p.score}。这款产品可能会改变该品类的竞争强度。`,
        tone: 'warn', color: p.brandColor
      });
      report.aiActions.push({
        type: 'launch', brand: p.brandName, name: p.name, category: p.category,
        price: p.price, score: p.score,
        text: `${p.brandName} 发布 ${p.name}，定价 ${moneyNumber(p.price)}`
      });
    }
    report.aiActions.forEach(action => {
      if (action.type === 'launch' && !report.aiLaunchNames) report.aiLaunchNames = [];
    });
  }

  // ---------- milestones ----------
  function activeCategoriesCount(game) {
    return new Set(game.products.filter(p => p.status === 'active').map(p => p.category)).size;
  }

  function milestoneProgress(game, id) {
    const c = game.company;
    switch (id) {
      case 'first_camera': return { now: Math.min(1, game.stats.camerasLaunched || 0), target: 1, display: `${game.stats.camerasLaunched || 0}/1` };
      case 'first_lens': return { now: Math.min(1, game.stats.lensesLaunched || 0), target: 1, display: `${game.stats.lensesLaunched || 0}/1` };
      case 'units_10k': return { now: Math.min(10000, game.stats.peakMonthlyUnits || 0), target: 10000, display: `${(game.stats.peakMonthlyUnits || 0).toLocaleString('zh-CN')}/10,000` };
      case 'reputation_80': return { now: Math.min(80, c.reputation), target: 80, display: `${c.reputation.toFixed(0)}/80` };
      case 'cash_1b': return { now: Math.min(1e9, c.cash), target: 1e9, display: money(c.cash) + ' / ¥10亿' };
      case 'portfolio_4': return { now: Math.min(4, activeCategoriesCount(game)), target: 4, display: `${activeCategoriesCount(game)}/4` };
      case 'tech_master': return { now: Math.min(3, D.TECH_ORDER.filter(k => c.tech[k] >= 4).length), target: 3, display: `${D.TECH_ORDER.filter(k => c.tech[k] >= 4).length}/3` };
      case 'top3': return { now: game.market.snapshot ? Math.max(0, 6 - game.market.snapshot.playerRank) : 0, target: 5, display: game.market.snapshot ? `第 ${game.market.snapshot.playerRank} 名` : '—' };
      case 'cinema_debut': return { now: Math.min(1, game.stats.cinemaLaunched || 0), target: 1, display: `${game.stats.cinemaLaunched || 0}/1` };
      default: return { now: 0, target: 1, display: '—' };
    }
  }

  function milestoneSatisfied(game, id) {
    const c = game.company;
    switch (id) {
      case 'first_camera': return (game.stats.camerasLaunched || 0) >= 1;
      case 'first_lens': return (game.stats.lensesLaunched || 0) >= 1;
      case 'units_10k': return (game.stats.peakMonthlyUnits || 0) >= 10000;
      case 'reputation_80': return c.reputation >= 80;
      case 'cash_1b': return c.cash >= 1000000000;
      case 'portfolio_4': return activeCategoriesCount(game) >= 4;
      case 'tech_master': return D.TECH_ORDER.filter(k => c.tech[k] >= 4).length >= 3;
      case 'top3': return game.market.snapshot && game.market.snapshot.playerRank <= 5;
      case 'cinema_debut': return (game.stats.cinemaLaunched || 0) >= 1;
      default: return false;
    }
  }

  function refreshMilestones(game, options) {
    options = options || {};
    if (!game.milestones) game.milestones = {};
    const newly = [];
    D.MILESTONES.forEach(m => {
      if (!game.milestones[m.id] && milestoneSatisfied(game, m.id)) {
        game.milestones[m.id] = true;
        newly.push(m);
        if (!options.silent) {
          addNews(game, {
            tag: '里程碑', title: `里程碑达成 · ${m.name}`,
            text: `${m.desc} 这是 ${game.company.name} 走向影像品牌的重要一步。`,
            tone: 'good', color: game.company.color
          });
        }
      }
    });
    if (!options.silent) return newly;
    return newly;
  }

  // ---------- month settlement ----------
  function advanceMonth(game) {
    if (!game) return null;
    const settleIndex = game.monthIndex;
    const company = game.company;
    const manufacturing = getManufacturing(company);
    const modifiers = aggregateModifiers(game);
    const report = {
      id: uid('report'),
      monthIndex: settleIndex,
      dateLabel: monthLabel(settleIndex),
      dateShort: monthShort(settleIndex),
      nextLabel: monthLabel(settleIndex + 1),
      revenueGross: 0, channelFee: 0, revenueNet: 0, cogs: 0, grossProfit: 0,
      cameraUnits: 0, lensUnits: 0, cameraRevenue: 0, lensRevenue: 0, kitRevenue: 0, kitUnits: 0,
      productionSpend: 0, productionUnits: 0, capacity: manufacturing.capacity,
      cameraSales: [], lensSales: [], stockouts: [],
      payroll: 0, overhead: 0, marketing: 0, partnerFee: 0, factoryUpkeep: 0,
      warranty: 0, interest: 0, tax: 0, netRevenue: 0,
      operatingProfit: 0, netProfit: 0, cashDelta: 0, cashEnd: 0, inventoryValue: 0,
      oneOffs: [], oneOffTotal: 0,
      rnd: [], researchCompleted: [],
      aiActions: [], events: [], achievements: [], warnings: [],
      brandBefore: { awareness: company.awareness, reputation: company.reputation, share: company.share },
      brandAfter: {},
      snapshot: null
    };
    report.oneOffs = (company.oneOffs || []).slice();
    report.oneOffTotal = report.oneOffs.reduce((s, x) => s + x.amount, 0);
    company.oneOffs = [];

    // R&D projects progress before design deadlines are reset.
    monthlyResearchProgress(game, report);
    monthlyChipProgress(game, report);
    if (company.projects.length > 3) company.projects = company.projects.slice(0, 3);

    // ----- production planning -----
    const activeCameras = game.products.filter(p => p.status === 'active');
    const activeLenses = game.lenses.filter(p => p.status === 'active');
    const productionItems = [];
    activeCameras.forEach(p => {
      const forecast = estimateCameraDemand(game, p, { forecast: true }).units;
      p.lastForecast = forecast;
      const desired = p.autoProduction
        ? Math.max(0, Math.ceil(forecast * 1.06 - (p.stock || 0)))
        : Math.max(0, Math.round(p.monthlyProduction || 0));
      productionItems.push({ kind: 'camera', p, desired, unitCost: p.unitCost });
    });
    activeLenses.forEach(p => {
      const forecast = estimateLensDemand(game, p, { forecast: true }).units;
      p.lastForecast = forecast;
      const desired = p.autoProduction
        ? Math.max(0, Math.ceil(forecast * 1.06 - (p.stock || 0)))
        : Math.max(0, Math.round(p.monthlyProduction || 0));
      productionItems.push({ kind: 'lens', p, desired, unitCost: p.unitCost });
    });

    let totalDesired = productionItems.reduce((s, it) => s + it.desired, 0);
    let capacityScale = 1;
    if (manufacturing.capacity <= 0) {
      capacityScale = 0;
      report.warnings.push('当前没有可用产能：自有工厂为 0 或代工伙伴不可用，本月无法生产新产品。');
    } else if (totalDesired > manufacturing.capacity) {
      capacityScale = manufacturing.capacity / totalDesired;
      report.warnings.push(`本月计划产量超过产能上限，生产按比例压缩至 ${Math.floor(manufacturing.capacity).toLocaleString('zh-CN')} 台。`);
    }
    // Produce only within 88% of available cash. The rest is reserved for operations.
    let plannedCost = productionItems.reduce((s, it) => s + Math.floor(it.desired * capacityScale) * it.unitCost, 0);
    let budgetScale = 1;
    const productionBudget = Math.max(0, company.cash * 0.88);
    if (plannedCost > productionBudget) {
      budgetScale = plannedCost > 0 ? productionBudget / plannedCost : 0;
      report.warnings.push('现金不足以支撑计划产量，产能被现金流限制。可通过贷款或提高定价来缓解。');
    }
    let producedTotal = 0;
    productionItems.forEach(item => {
      const units = Math.max(0, Math.floor(item.desired * capacityScale * budgetScale));
      item.produced = units;
      item.p.producedLastMonth = units;
      item.p.stock = (item.p.stock || 0) + units;
      producedTotal += units;
      report.productionSpend += units * item.unitCost;
    });
    report.productionUnits = producedTotal;

    // ----- camera sales -----
    const cameraRevenueGross = [];
    activeCameras.forEach(p => {
      const estimate = estimateCameraDemand(game, p);
      let demand = estimate.units;
      if ((p.preorderUnits || 0) > 0) {
        if ((p.ageMonths || 0) <= 1) demand += p.preorderUnits;
        p.preorderUnits = 0;
      }
      const available = Math.max(0, p.stock || 0);
      const sold = Math.min(available, demand);
      const lost = Math.max(0, demand - sold);
      const kit = estimate.kit;
      const kitUnits = kit ? Math.round(sold * 0.55) : 0;
      const unitPrice = p.price + (kit ? kit.price * 0.8 * 0.55 : 0);
      const gross = sold * unitPrice;
      const channel = gross * 0.12;
      const net = gross - channel;
      const cogs = sold * p.unitCost + (kit ? kitUnits * kit.unitCost : 0);
      p.stock = Math.max(0, available - sold);
      p.lastUnits = sold;
      p.lastDemand = demand;
      p.lastRevenue = net;
      p.lastStockout = lost;
      p.totalSold = (p.totalSold || 0) + sold;
      p.totalRevenue = (p.totalRevenue || 0) + net;
      if (!p.salesHistory) p.salesHistory = [];
      p.salesHistory.push({ month: settleIndex, label: monthShort(settleIndex), units: sold, demand, revenue: net, lost });
      if (p.salesHistory.length > 36) p.salesHistory = p.salesHistory.slice(-36);
      report.cameraUnits += sold;
      report.cameraRevenue += net;
      report.kitRevenue += kit ? kitUnits * kit.price * 0.8 : 0;
      report.kitUnits += kitUnits;
      report.revenueGross += gross;
      report.channelFee += channel;
      report.revenueNet += net;
      report.cogs += cogs;
      report.warranty += sold * (p.defectRate / 100) * p.unitCost * 0.42;
      report.cameraSales.push({
        id: p.id, name: p.name, category: p.category, categoryName: getCategory(p.category).name,
        units: sold, demand, stock: p.stock, produced: p.producedLastMonth || 0,
        lost, price: unitPrice, revenue: net, overall: p.overall,
        stockout: lost > 0
      });
      if (lost > Math.max(100, sold * 0.2)) report.stockouts.push({ name: p.name, lost, demand, stock: p.stock });
      if (kit) {
        // A kit consumes a lens in the customer's box; keep installed mount data consistent.
        const mount = p.design.mount.type;
        if (mount && mount !== 'FIXED') company.installedBase[mount] = (company.installedBase[mount] || 0) + kitUnits * 0.35;
      }
      const mount = p.design.mount ? p.design.mount.type : null;
      if (mount && mount !== 'FIXED') company.installedBase[mount] = (company.installedBase[mount] || 0) + sold;
    });

    // ----- lens sales -----
    activeLenses.forEach(p => {
      const estimate = estimateLensDemand(game, p);
      let demand = estimate.units;
      if ((p.preorderUnits || 0) > 0) {
        if ((p.ageMonths || 0) <= 1) demand += p.preorderUnits;
        p.preorderUnits = 0;
      }
      const available = Math.max(0, p.stock || 0);
      const sold = Math.min(available, demand);
      const lost = Math.max(0, demand - sold);
      const gross = sold * p.price;
      const channel = gross * 0.12;
      const net = gross - channel;
      const cogs = sold * p.unitCost;
      p.stock = Math.max(0, available - sold);
      p.lastUnits = sold;
      p.lastDemand = demand;
      p.lastRevenue = net;
      p.lastStockout = lost;
      p.totalSold = (p.totalSold || 0) + sold;
      p.totalRevenue = (p.totalRevenue || 0) + net;
      if (!p.salesHistory) p.salesHistory = [];
      p.salesHistory.push({ month: settleIndex, label: monthShort(settleIndex), units: sold, demand, revenue: net, lost });
      if (p.salesHistory.length > 36) p.salesHistory = p.salesHistory.slice(-36);
      report.lensUnits += sold;
      report.lensRevenue += net;
      report.revenueGross += gross;
      report.channelFee += channel;
      report.revenueNet += net;
      report.cogs += cogs;
      report.warranty += sold * (p.defectRate / 100) * p.unitCost * 0.4;
      report.lensSales.push({
        id: p.id, name: p.name, units: sold, demand, stock: p.stock, lost,
        price: p.price, revenue: net, overall: p.overall, mount: p.mount.type
      });
      if (lost > Math.max(50, sold * 0.2)) report.stockouts.push({ name: p.name, lost, demand, stock: p.stock });
    });

    report.grossProfit = report.revenueNet - report.cogs;
    report.warranty = Math.round(report.warranty);

    // ----- brand freshness -----
    const camerasSold = report.cameraUnits;
    const lensesSold = report.lensUnits;
    const mktEfficiency = 1 + Math.sqrt(company.staff.marketing || 0) / 18;
    let awarenessGain = Math.pow(Math.max(0, company.marketingBudget || 0) / 1000000, 0.45) * 0.155 * mktEfficiency * (1 - company.awareness / 126);
    awarenessGain += Math.min(1.9, Math.sqrt(camerasSold) / 105) * (0.68 + company.reputation / 170);
    awarenessGain += Math.min(0.6, Math.sqrt(lensesSold) / 180);
    awarenessGain -= company.awareness * 0.0012;
    company.awareness = clamp(company.awareness + awarenessGain, 0, 100);

    let repDelta = 0;
    if (camerasSold > 0) {
      const soldProducts = game.products.filter(p => p.status === 'active' && (p.lastUnits || 0) > 0);
      const reviewWeighted = soldProducts.reduce((s, p) => s + p.overall * p.lastUnits, 0) / Math.max(1, soldProducts.reduce((s, p) => s + p.lastUnits, 0));
      const avgDefect = soldProducts.reduce((s, p) => s + p.defectRate * p.lastUnits, 0) / Math.max(1, soldProducts.reduce((s, p) => s + p.lastUnits, 0));
      repDelta += (reviewWeighted - 64) * 0.028 * Math.min(1, Math.sqrt(camerasSold) / 22);
      repDelta -= Math.max(0, avgDefect - 2) * 0.055;
      if (reviewWeighted >= 87) repDelta += 0.12;
      if (report.stockouts.length > 0) repDelta -= Math.min(0.25, report.stockouts.length * 0.05);
    } else {
      repDelta -= 0.04;
    }
    if (lensesSold > 0) {
      const opticalAvg = game.lenses.filter(l => l.status === 'active' && l.lastUnits > 0).reduce((s, l) => s + (l.proxyOverall || l.overall) * l.lastUnits, 0) / Math.max(1, game.lenses.filter(l => l.status === 'active' && l.lastUnits > 0).reduce((s, l) => s + l.lastUnits, 0));
      repDelta += (opticalAvg - 68) * 0.012;
    }
    if (company.cash < 0) repDelta -= 0.1;
    company.reputation = clamp(company.reputation + clamp(repDelta, -1.5, 1.5), 0, 100);
    company.fans = Math.max(0, Math.round((company.fans || 0) + camerasSold * 0.34 + lensesSold * 0.12 + Math.max(0, awarenessGain) * 1800));
    report.brandAfter = { awareness: company.awareness, reputation: company.reputation };

    // ----- financials -----
    report.payroll = monthlySalaryBill(company);
    report.chipLab = chipLabUpkeep(company);
    report.overhead = (company.fixedOverhead || 0) + report.chipLab;
    report.marketing = company.marketingBudget || 0;
    report.partnerFee = manufacturing.mode === 'partner' ? manufacturing.fee : 0;
    report.factoryUpkeep = getFactoryUpkeep(company);
    report.interest = Math.round(company.debt * (company.loanRate || 0.0065));
    const operatingCosts = report.payroll + report.overhead + report.marketing + report.partnerFee + report.factoryUpkeep + report.warranty + report.interest;
    const preTax = report.revenueNet - report.cogs - operatingCosts;
    report.tax = preTax > 0 ? Math.round(preTax * (company.taxRate || 0.25)) : 0;
    report.operatingProfit = Math.round(preTax);
    report.netProfit = Math.round(preTax - report.tax);
    report.cashDelta = Math.round(report.revenueNet - report.productionSpend - operatingCosts - report.tax);
    company.cash += report.cashDelta;
    report.cashEnd = company.cash;
    report.inventoryValue = inventoryValue(game);

    // Stats and player market share for the settled month.
    game.stats.cameraUnits = (game.stats.cameraUnits || 0) + report.cameraUnits;
    game.stats.lensUnits = (game.stats.lensUnits || 0) + report.lensUnits;
    game.stats.totalUnits = (game.stats.cameraUnits || 0);
    game.stats.totalRevenue = (game.stats.totalRevenue || 0) + report.revenueNet;
    game.stats.totalProfit = (game.stats.totalProfit || 0) + report.netProfit;
    game.stats.lastMonthUnits = report.cameraUnits;
    game.stats.peakMonthlyUnits = Math.max(game.stats.peakMonthlyUnits || 0, report.cameraUnits);
    game.stats.monthsPlayed = (game.stats.monthsPlayed || 0) + 1;
    company.lastMonthUnits = report.cameraUnits;
    company.lastMonthRevenue = report.revenueNet;
    company.lastMonthProfit = report.netProfit;

    if (company.cash < 0) report.warnings.push('现金已为负。请在财务中心申请贷款或削减开支，否则下个月无法正常生产。');
    if (report.stockouts.length) report.warnings.push('部分产品出现明显缺货，损失了可实现的销量；可提高备货或产能。');

    const unitsByCategory = {};
    game.products.filter(p => p.status === 'active').forEach(p => {
      unitsByCategory[p.category] = (unitsByCategory[p.category] || 0) + (p.lastUnits || 0);
    });
    const snapshot = computeMarketSnapshot(game, unitsByCategory, { monthIndex: settleIndex });
    report.snapshot = snapshot;
    report.brandAfter.share = snapshot.playerShare;
    game.company.share = snapshot.playerShare;

    const newly = refreshMilestones(game);
    report.achievements = newly;

    // history uses settled month before advancing the clock.
    game.history.push({
      mIndex: settleIndex,
      label: monthShort(settleIndex),
      cash: company.cash,
      revenue: report.revenueNet,
      profit: report.netProfit,
      units: report.cameraUnits,
      lensUnits: report.lensUnits,
      share: snapshot.playerShare,
      reputation: company.reputation,
      debt: company.debt
    });
    if (game.history.length > 60) game.history = game.history.slice(-60);

    // Aging, market evolution, and the next month.
    game.products.forEach(p => {
      if (p.status === 'active') {
        p.ageMonths = (p.ageMonths || 0) + 1;
        p.launchHype = Math.max(0, (p.launchHype || 0) * 0.68);
      }
    });
    game.lenses.forEach(p => {
      if (p.status === 'active') {
        p.ageMonths = (p.ageMonths || 0) + 1;
        p.launchHype = Math.max(0, (p.launchHype || 0) * 0.7);
      }
    });

    game.monthIndex += 1;
    tickModifiers(game);
    rollMarketEvent(game, report);
    advanceAI(game, report);
    report.nextLabel = monthLabel(game.monthIndex);
    report.brandAfter.share = game.company.share;

    game.stats.peakMonthlyUnits = Math.max(game.stats.peakMonthlyUnits || 0, game.stats.lastMonthUnits || 0);
    game.lastReport = report;
    game.updatedAt = Date.now();
    return report;
  }

  // ---------- save / load ----------
  function saveGame(game) {
    if (!game) return { ok: false, error: '没有可保存的游戏。' };
    try {
      game.updatedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
      return { ok: true, savedAt: game.updatedAt };
    } catch (e) {
      return { ok: false, error: '存档失败：' + (e && e.message ? e.message : '浏览器存储不可用') };
    }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function normalizeArtState(game) {
    if (!game) return game;
    game.art = game.art || {};
    const brandId = game.company && game.company.isReal ? game.company.id : 'frame';
    game.art.baseline = Object.assign(
      { mode: game.mode === 'takeover' ? 'brand' : 'category', brandId, modelId: null },
      game.art.baseline || {}
    );
    game.art.adherence = clamp(Number(game.art.adherence == null ? 0.7 : game.art.adherence), 0, 1);
    game.art.settings = Object.assign({ online: false, autoCache: false, autoSync: false, showReference: true, quality: 'high' }, game.art.settings || {});
    if (!game.art.references && window.FrameArt && window.FrameArt.referenceModels) {
      try {
        const refs = window.FrameArt.referenceModels({ company: game.company, category: 'mirrorless', limit: 6 });
        game.art.references = refs.map(m => ({ id: m.id, brand: m.brand, name: m.name, cat: m.cat }));
      } catch (e) { /* ignore */ }
    }
    return game;
  }
  function loadSavedGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ok: false, error: '没有可用存档。' };
      const game = JSON.parse(raw);
      if (!game || !game.company || !game.market) return { ok: false, error: '存档格式无效。' };
      if (!game.drafts) game.drafts = { camera: null, lens: null };
      if (!game.settings) game.settings = { reducedMotion: false, showTips: true };
      if (!game.milestones) game.milestones = {};
      if (!game.company.projects) game.company.projects = [];
      if (!game.company.campaignCooldowns) game.company.campaignCooldowns = {};
      if (!game.company.oneOffs) game.company.oneOffs = [];
      if (!game.stats) game.stats = {};
      game.products.forEach(p => {
        if (!p.salesHistory) p.salesHistory = [];
        if (p.producedLastMonth == null) p.producedLastMonth = 0;
      });
      game.lenses.forEach(p => {
        if (!p.salesHistory) p.salesHistory = [];
        if (p.producedLastMonth == null) p.producedLastMonth = 0;
      });
      normalizeArtState(game);
      normalizeChipState(game);
      return { ok: true, game };
    } catch (e) {
      return { ok: false, error: '读取存档失败：' + (e && e.message ? e.message : '未知错误') };
    }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); return { ok: true }; } catch (e) { return { ok: false, error: '无法清除存档。' }; }
  }

  function exportSave(game) {
    return JSON.stringify({ app: 'FRAME-CAMERA-COMPANY', version: SAVE_VERSION, exportedAt: new Date().toISOString(), game }, null, 2);
  }

  function importSave(text) {
    try {
      const parsed = JSON.parse(text);
      const game = parsed && parsed.game ? parsed.game : parsed;
      if (!game || !game.company || !game.market) return { ok: false, error: '文件不是有效的《相机公司模拟器》存档。' };
      if (game.version && game.version > SAVE_VERSION) return { ok: false, error: '存档来自更高版本的游戏，无法导入。' };
      if (!game.drafts) game.drafts = { camera: null, lens: null };
      if (!game.company.projects) game.company.projects = [];
      if (!game.company.oneOffs) game.company.oneOffs = [];
      normalizeArtState(game);
      normalizeChipState(game);
      return { ok: true, game };
    } catch (e) {
      return { ok: false, error: '无法解析存档文件：' + (e && e.message ? e.message : '格式错误') };
    }
  }

  function peekSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw);
      return { name: g.company && g.company.name, en: g.company && g.company.en, color: g.company && g.company.color, monthLabel: monthLabel(g.monthIndex || 0), cash: g.company && g.company.cash, mode: g.mode, updatedAt: g.updatedAt, share: g.company && g.company.share };
    } catch (e) { return null; }
  }

  // ---------- market helpers used by UI ----------
  function getCategoryBenchmark(game, categoryId) {
    const ai = activeAISnapshotProducts(game).filter(p => p.category === categoryId);
    return ai.sort((a, b) => b.score - a.score).slice(0, 8).map(p => ({
      id: p.id, name: p.name, brand: p.brandName, brandId: p.brandId, color: p.brandColor,
      price: p.price, score: p.score, age: p.age
    }));
  }

  function getMarketPressureRows(game) {
    return D.CATEGORY_ORDER.map(id => {
      const cat = getCategory(id);
      const demand = categoryDemand(game, id);
      const pressure = getCategoryPressure(game, id);
      const playerUnits = game.products.filter(p => p.status === 'active' && p.category === id).reduce((s, p) => s + (p.lastUnits || 0), 0);
      const products = game.market.aiProducts.filter(p => p.category === id).sort((a, b) => b.score - a.score).slice(0, 5);
      return { id, name: cat.name, en: cat.en, demand, pressure, playerUnits, products };
    });
  }

  function validateDraftName(draft) {
    if (!draft) return false;
    return !!String(draft.name || '').trim();
  }

  function getActiveEmployees(game) {
    return companyStaffCount(game.company);
  }

  window.GameEngine = {
    D, SAVE_KEY, SAVE_VERSION,
    // utilities
    money, moneyNumber, units, pctNum, monthLabel, monthShort, clamp, round, shade, colorStats,
    getCategory, getCompany, getManufacturing, getSensorSupplier, maxMPFor, minVideoTechFor,
    videoComboAllowed, researchPower, monthlySalaryBill, companyStaffCount, formatFactor, qualityTier,
    starRating, escapeHTML, deepClone, pick, uid,
    // design
    makeCameraDraft, makeLensDraft, evaluateCamera, evaluateLens, suggestModelName, suggestLensName,
    previewCameraLaunch, previewLensLaunch, normalizeVideoRes, getKitLens,
    // chips & launch events
    chipLabLevel, chipLabDef, chipPower, chipSlots, chipLabUpkeep, chipProgramEstimate, startChipProgram,
    upgradeChipLab, setChipStrategy, normalizeChipState, resolveDesignChips, applyCmosChipToDraft,
    applyAfChipToDraft, bestCmosChip, bestAfChip, completeChipProgram, monthlyChipProgress,
    defaultLaunchEvent, normalizeLaunchEvent, computeLaunchEvent, launchFocusScore,
    // game state
    initGame, advanceMonth, saveGame, hasSave, loadSavedGame, peekSave, clearSave, exportSave, importSave,
    // company actions
    launchCamera, launchLens, setProductPrice, setProductionSettings, setKitLens, discontinueProduct,
    toggleProductStatus, startResearch, cancelResearch, hireStaff, fireStaff, setManufacturing,
    upgradeFactory, selectSensorSupplier, runBrandCampaign, takeLoan, repayLoan,
    // calculation helpers
    inventoryValue, companyCreditLimit, companyValuation, monthlyFixedCost, projectEta,
    categoryDemand, getCategoryPressure, estimateCameraDemand, estimateLensDemand,
    computeMarketSnapshot, getPlayerUnitsByCategory, aggregateModifiers, activeAISnapshotProducts,
    refreshMilestones, milestoneProgress, milestoneSatisfied, activeCategoriesCount,
    getCategoryBenchmark, getMarketPressureRows, validateDraftName, getActiveEmployees,
    getFactoryUpkeep, monthlyResearchProgress, normalizeArtState, companyBreakdown: null
  };
})();
