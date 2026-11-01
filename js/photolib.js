/* =========================================================
   FRAME — real-photo library matcher
   ---------------------------------------------------------
   Links game products / designs to the user's local photo
   collection. The photos are used as-is (resized copies in
   assets/photos); nothing here generates or edits images.
   ========================================================= */
(function () {
  'use strict';

  const LIB = window.FRAME_PHOTO_LIB;
  if (!LIB) return;
  const ITEMS = LIB.items.slice();
  const BY_ID = new Map(ITEMS.map(i => [i.id, i]));
  const BY_BRAND = new Map();
  ITEMS.forEach(i => {
    if (!BY_BRAND.has(i.brandId)) BY_BRAND.set(i.brandId, []);
    BY_BRAND.get(i.brandId).push(i);
  });

  const BRAND_WORDS = /\b(canon|sony|nikon|fujifilm|fuji|panasonic|lumix|leica|sigma|red|arri|blackmagic|om system|om|dji|gopro|ricoh|hasselblad|kodak|insta360|z cam|zcam|pentax|pixii|eos|alpha|powershot|nikkor)\b/g;

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/α/g, 'a')
      .replace(/[’']/g, '')
      .replace(/mark\s*/g, '')
      .replace(/\bmk\s*/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  function compact(s) { return norm(s).replace(/\s+/g, ''); }
  function modelCompact(s) { return modelTokens(s).join('').replace(/[^a-z0-9]/g, ''); }
  function modelTokens(s) {
    return norm(s).replace(BRAND_WORDS, ' ').split(/\s+/).filter(t => t.length > 0);
  }
  function numberSet(s) {
    return new Set((compact(s).match(/\d+/g) || []));
  }
  function sameNumbers(a, b) {
    const A = numberSet(a), B = numberSet(b);
    if (!A.size || !B.size) return false;
    if (A.size !== B.size) return false;
    for (const v of A) if (!B.has(v)) return false;
    return true;
  }
  const CAT_COMPAT = {
    mirrorless: ['mirrorless'],
    fullframe: ['mirrorless'],
    highres: ['mirrorless'],
    sports: ['mirrorless', 'cinema'],
    vlog: ['mirrorless', 'compact'],
    cinema: ['cinema'],
    compact: ['compact', 'other'],
    medium: ['mirrorless'],
    action: ['action'],
    retro: ['mirrorless', 'compact']
  };
  function compatible(photoCat, gameCat) {
    if (!photoCat || !gameCat) return false;
    if (photoCat === gameCat) return true;
    return (CAT_COMPAT[gameCat] || []).includes(photoCat);
  }
  function yearOf(date) { const m = String(date || '').match(/^(\d{4})/); return m ? Number(m[1]) : 0; }

  function scoreItem(item, brandId, model, category) {
    if (brandId && item.brandId !== brandId) return -1;
    if (!model) return -1;
    const a = modelCompact(model), b = modelCompact(item.model);
    if (!a || !b) return -1;
    let score = 0;
    if (a === b) score = 1;
    else {
      const nums = sameNumbers(model, item.model);
      if ((a.includes(b) || b.includes(a)) && (nums || !numberSet(model).size || !numberSet(item.model).size)) {
        const shorter = a.length <= b.length ? a : b;
        const longer = a.length > b.length ? a : b;
        const idx = longer.indexOf(shorter);
        const next = longer.charAt(idx + shorter.length);
        if (!/\d/.test(next)) {
          score = 0.86;
          // a photo whose model is closer in length is more likely the exact variant
          score += Math.max(0, 0.04 - Math.abs(a.length - b.length) * 0.012);
        }
      }
      if (!score) {
        const ta = new Set(modelTokens(model));
        const tb = new Set(modelTokens(item.model));
        let inter = 0;
        ta.forEach(t => { if (tb.has(t)) inter++; });
        const union = new Set([...ta, ...tb]).size || 1;
        score = (inter / union) * 0.8;
        if (inter && nums) score += 0.1;
        if (inter === 0 && nums) score += 0.12;
      }
    }
    if (category) {
      if (item.category === category) score += 0.08;
      else if (compatible(item.category, category)) score += 0.035;
    }
    score += Math.min(0.012, yearOf(item.date) / 300000);
    return score;
  }
  function best(brandId, model, category, minScore) {
    const pool = brandId ? (BY_BRAND.get(brandId) || []) : ITEMS;
    let bestItem = null, bestScore = minScore == null ? 0.24 : minScore;
    for (const item of pool) {
      const s = scoreItem(item, brandId, model, category);
      if (s > bestScore) { bestScore = s; bestItem = item; }
    }
    return bestItem ? { item: bestItem, score: bestScore } : null;
  }

  function bestBrandCategory(brandId, category) {
    const pool = (BY_BRAND.get(brandId) || []).slice();
    if (!pool.length) return null;
    const compat = pool.filter(i => compatible(i.category, category));
    const list = (compat.length ? compat : pool).slice();
    list.sort((a, b) => (yearOf(b.date) - yearOf(a.date)) || (b.clean - a.clean));
    return list[0] || null;
  }
  function bestCategory(category) {
    const compat = ITEMS.filter(i => compatible(i.category, category));
    const list = (compat.length ? compat : ITEMS).slice();
    list.sort((a, b) => (yearOf(b.date) - yearOf(a.date)) || (b.clean - a.clean));
    return list[0] || null;
  }

  const ALIAS = {
    tz99: 'zs99',
    ursacine12k: 'ursa 12k lf',
    pocketcinemacamera6kpro: 'pocket 6k g2',
    vraptorx: 'komodo-x 6k z',
    vraptor: 'komodo-x 6k z',
    alexaminilf: 'alexa 35',
    fpl: 'fp2',
    xt5: 'x-t50',
    x100vi: 'x-e5',
    gfx100ii: 'gfx 100rf',
    xh2s: 'x-t30 iii',
    rx100vii: 'rx10 v',
    xt4: 'x-t30 iii',
    a7iii: 'a7 iv',
    eos5div: 'r6 iii',
    d850: 'z8',
    eosc70: 'c80'
  };
  function aliasModel(model) {
    return ALIAS[modelCompact(model)] || null;
  }
  // Curated substitutes for seed products whose exact photo is not a
  // usable product shot (unboxing, store shelf, rig, rear screen, etc.).
  const PRODUCT_OVERRIDES = {
    'canon|eosr5markii': 'canon-canon-r5-c',
    'canon|eosr6markiii': 'canon-canon-r6-ii',
    'sony|alpha1ii': 'sony-sony-a7-v',
    'sony|fx3': 'sony-sony-fx2',
    'sony|rx100vii': 'sony-sony-rx1r-iii',
    'nikon|zf': 'nikon-nikon-z5-ii',
    'fujifilm|gfx100ii': 'fujifilm-fujifilm-gfx-100rf',
    'sigma|sigmabf': 'sigma-sigma-fp2',
    'blackmagic|pyxis6k': 'blackmagic-blackmagic-ursa-12k-lf',
    'gopro|hero13black': 'gopro-gopro-hero-2024',
    'leica|q3': 'leica-leica-q3-43'
  };
  const BAD_REFERENCE = new Set([
    'canon-canon-r5-ii',
    'sony-sony-fx3',
    'sony-sony-rx10-v',
    'nikon-nikon-zf',
    'fujifilm-fujifilm-gfx-100-ii',
    'sigma-sigma-bf',
    'blackmagic-blackmagic-pyxis-6k',
    'gopro-gopro-hero13-black'
  ]);
  function cleanAlt(brandId, category) {
    const pool = (BY_BRAND.get(brandId) || []).filter(i => i.clean && compatible(i.category, category));
    if (pool.length) {
      pool.sort((a, b) => yearOf(b.date) - yearOf(a.date));
      return pool[0];
    }
    return null;
  }
  function productKey(companyId, name) {
    return (companyId || '') + '|' + String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function pack(item, source, companyId, substitute) {
    if (!item) return null;
    return {
      item,
      source,
      crossBrand: !!(companyId && item.brandId !== companyId),
      custom: !companyId,
      substitute: !!(substitute || source === 'curated'),
      companyId: companyId || null,
      brandName: item.brandCn || item.brand,
      label: item.model
    };
  }

  function findForCompany(brandId, name, category) {
    if (!brandId) return null;
    let hit = best(brandId, name, category);
    if (hit && hit.score >= 0.5) {
      if (BAD_REFERENCE.has(hit.item.id)) {
        const alt = cleanAlt(brandId, category);
        if (alt) return alt;
      }
      return hit.item;
    }
    const alias = aliasModel(name);
    if (alias) {
      const aliasHit = best(brandId, alias, category);
      if (aliasHit) return aliasHit.item;
    }
    if (hit) {
      if (BAD_REFERENCE.has(hit.item.id)) {
        const alt = cleanAlt(brandId, category);
        if (alt) return alt;
      }
      return hit.item;
    }
    return bestBrandCategory(brandId, category);
  }

  /** Resolve the real photo for a camera design. */
  function forDesign(design, company) {
    if (!design) return null;
    if (design.photoId && BY_ID.has(design.photoId)) {
      return pack(BY_ID.get(design.photoId), 'picked', company && company.isReal ? company.id : null);
    }
    const companyId = company && company.isReal ? company.id : null;
    const ref = design.referenceModelId && window.FRAME_ART_DATA && window.FRAME_ART_DATA.modelById
      ? window.FRAME_ART_DATA.modelById(design.referenceModelId) : null;
    if (ref) {
      const ov = PRODUCT_OVERRIDES[productKey(ref.brand, ref.name)];
      if (ov && BY_ID.has(ov)) return pack(BY_ID.get(ov), 'reference', companyId, true);
      const item = findForCompany(ref.brand, ref.name, ref.cat);
      if (item) {
        if (BAD_REFERENCE.has(item.id)) {
          const alt = cleanAlt(ref.brand, ref.cat);
          if (alt) return pack(alt, 'reference', companyId, true);
        }
        return pack(item, 'reference', companyId);
      }
    }
    if (companyId) {
      const item = findForCompany(companyId, design.name, design.category);
      if (item) return pack(item, 'name', companyId);
    }
    // new company: follow its category reference set
    const refs = window.FrameArt && window.FrameArt.referenceModels
      ? window.FrameArt.referenceModels({ company, category: design.category, limit: 8 })
      : [];
    for (const r of refs) {
      const item = best(r.brand, r.name, r.cat);
      if (item) {
        if (BAD_REFERENCE.has(item.item.id)) {
          const alt = cleanAlt(r.brand, r.cat);
          if (alt) return pack(alt, 'category', null, true);
        }
        return pack(item.item, 'category', null);
      }
    }
    const item = bestCategory(design.category);
    return pack(item, 'fallback', null);
  }

  /** Resolve the real photo for a launched product (seed, player or AI). */
  function forProduct(product, company) {
    if (!product) return null;
    const companyId = product.brandId || (company && company.isReal ? company.id : null);
    const design = product.design || {};
    if (!product.isSeed && design.photoId && BY_ID.has(design.photoId)) {
      return pack(BY_ID.get(design.photoId), 'picked', companyId || (design.category && null));
    }
    if (companyId) {
      const ov = PRODUCT_OVERRIDES[productKey(companyId, product.name || design.name)];
      if (ov && BY_ID.has(ov)) return pack(BY_ID.get(ov), 'curated', companyId, true);
    }
    if (companyId) {
      const hit = best(companyId, product.name || design.name, product.category);
      if (hit && hit.score >= 0.4) return pack(hit.item, 'name', companyId);
    }
    const byDesign = forDesign(design, company);
    if (byDesign) return byDesign;
    if (companyId) {
      const item = bestBrandCategory(companyId, product.category);
      return pack(item, 'fallback', companyId);
    }
    return pack(bestCategory(product.category), 'fallback', null);
  }

  /** Curated photo lookup for a reference model / gallery card. */
  function forModel(brandId, name, category) {
    const ov = PRODUCT_OVERRIDES[productKey(brandId, name)];
    if (ov && BY_ID.has(ov)) return pack(BY_ID.get(ov), 'curated', brandId, true);
    const item = findForCompany(brandId, name, category);
    if (item && BAD_REFERENCE.has(item.id)) {
      const alt = cleanAlt(brandId, category);
      if (alt) return pack(alt, 'curated', brandId, true);
    }
    return pack(item, 'reference', brandId);
  }
  function byId(id) { return BY_ID.get(id) || null; }
  function url(item) { return item ? LIB.base + item.file : ''; }
  function forBrandModel(brandId, model, category) {
    const item = findForCompany(brandId, model, category);
    return pack(item, 'lookup', brandId);
  }
  function list(filter) {
    filter = filter || {};
    return ITEMS.filter(i =>
      (!filter.brandId || i.brandId === filter.brandId) &&
      (!filter.category || i.category === filter.category) &&
      (!filter.query || (i.model + ' ' + i.brand).toLowerCase().includes(String(filter.query).toLowerCase()))
    ).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  function brands() {
    const out = [];
    const seen = new Set();
    ITEMS.forEach(i => {
      if (seen.has(i.brandId)) return;
      seen.add(i.brandId);
      out.push({ id: i.brandId, name: i.brandCn || i.brand, en: i.brand, count: (BY_BRAND.get(i.brandId) || []).length });
    });
    return out.sort((a, b) => b.count - a.count);
  }
  function categories() {
    return Object.keys(LIB.categories).map(id => ({
      id, label: LIB.categories[id], count: ITEMS.filter(i => i.category === id).length
    }));
  }
  function debug(brandId, model, category) {
    const pool = brandId ? (BY_BRAND.get(brandId) || []) : ITEMS;
    return pool.map(i => ({ model: i.model, score: Number(scoreItem(i, brandId, model, category).toFixed(3)) }))
      .sort((a, b) => b.score - a.score).slice(0, 5);
  }

  window.FramePhoto = {
    version: '1.0.0',
    data: LIB,
    items: ITEMS,
    byId,
    url,
    match: forBrandModel,
    forModel,
    forDesign,
    forProduct,
    list,
    brands,
    categories,
    debug,
    norm,
    compact,
    modelCompact
  };
})();
