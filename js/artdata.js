/* =========================================================
   FRAME — reference imaging library (data layer)
   ---------------------------------------------------------
   This module stores *structural* reference data of real
   cameras and lenses plus the industrial-design DNA of each
   manufacturer. It contains no copyrighted photography:
   photos are retrieved on demand from Wikimedia Commons and
   cached locally, and every render the game produces is a
   new procedural image built from this structural data.
   Measurements are public-spec approximations (mm / g) used
   only to anchor proportions. Private, non-commercial use.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. Brand industrial-design DNA
     ---------------------------------------------------------
     corner      : front outline corner radius / min(W,H)
     bevel       : edge bevel / min(W,H)
     softness    : 0 = machined facets, 1 = organic curves
     top         : default top-plate language
     hump        : evf housing shape
     humpR       : hump width / body width
     grip        : grip size multiplier
     dials       : canonical top-dial count
     dialStyle   : knurled | milled | flat | stepped
     accent      : brand accent colour
     accentUse   : where the accent lives on the body
     logoStyle   : text | mark | script
     wordmark    : engraved wordmark on the body
     mountRing   : default mount ring tone
     vent        : cooling vent language
     signature   : reference model ids that define the language
     --------------------------------------------------------- */
  const BRANDS = {
    canon: {
      id: 'canon', name: '佳能', en: 'CANON', mark: 'CANON', wordmark: 'Canon',
      color: '#c4473a', logoStyle: 'text',
      corner: 0.32, bevel: 0.34, softness: 0.8, shoulder: 'curved',
      top: 'arc', hump: 'smooth', humpR: 0.35, grip: 1.12, dials: 2, dialStyle: 'knurled',
      accent: '#b73b2e', accentUse: 'mount_arc', mountRing: '#c9c6bc', vent: 'none',
      bodyColor: '#1c1e1f', topColor: '#242728', gripColor: '#141616',
      texture: 'micrograin', finish: 'matte', screen: 'sideflip', eyecup: 'round',
      notes: '大握柄、圆润肩线、镜头卡口下缘的红色弧线，以及顶部的模式转盘与快门同侧布局。',
      signature: ['eos-r5', 'eos-r6-ii', 'eos-r3', 'eos-r7', 'eos-5d-iv'],
      classic: ['eos-5d-iv', 'eos-r5', 'eos-r3', 'powershot-g7x-iii']
    },
    sony: {
      id: 'sony', name: '索尼', en: 'SONY', mark: 'α', wordmark: 'SONY',
      color: '#8a9aa6', logoStyle: 'mark',
      corner: 0.22, bevel: 0.2, softness: 0.45, shoulder: 'angular',
      top: 'flat', hump: 'low', humpR: 0.3, grip: 1.16, dials: 2, dialStyle: 'milled',
      accent: '#c05a2e', accentUse: 'mount_ring', mountRing: '#b9b7ae', vent: 'none',
      bodyColor: '#202326', topColor: '#282c2f', gripColor: '#17191b',
      texture: 'speckle', finish: 'matte', screen: 'tilt', eyecup: 'square',
      notes: '薄而高的机身、切面肩线、极简顶部布局，以及卡口环上的暖色细节。',
      signature: ['a7-iv', 'a7r-v', 'a1-ii', 'a6700', 'fx3'],
      classic: ['a7-iii', 'a7-iv', 'a1-ii', 'rx100-vii']
    },
    nikon: {
      id: 'nikon', name: '尼康', en: 'NIKON', mark: 'N', wordmark: 'Nikon',
      color: '#d6b841', logoStyle: 'text',
      corner: 0.3, bevel: 0.32, softness: 0.72, shoulder: 'curved',
      top: 'arc', hump: 'tall', humpR: 0.38, grip: 1.1, dials: 2, dialStyle: 'knurled',
      accent: '#b8342c', accentUse: 'grip_line', mountRing: '#b9b6ac', vent: 'none',
      bodyColor: '#1d1e1d', topColor: '#252725', gripColor: '#141515',
      texture: 'micrograin', finish: 'matte', screen: 'tilt', eyecup: 'round',
      notes: '更宽的卡口、深厚的握柄、明显的取景器隆起，以及握柄上那道标志性的红线。',
      signature: ['z8', 'z9', 'z6-iii', 'zf', 'd850'],
      classic: ['d850', 'z8', 'zf', 'z6-iii']
    },
    fujifilm: {
      id: 'fujifilm', name: '富士胶片', en: 'FUJIFILM', mark: 'FUJIFILM', wordmark: 'FUJIFILM',
      color: '#c59a54', logoStyle: 'text',
      corner: 0.16, bevel: 0.22, softness: 0.3, shoulder: 'flat',
      top: 'flat', hump: 'none', humpR: 0.28, grip: 0.62, dials: 3, dialStyle: 'stepped',
      accent: '#a8803f', accentUse: 'top_plate', mountRing: '#b7b3a8', vent: 'none',
      bodyColor: '#c9c4b8', topColor: '#cfcabe', gripColor: '#4c3a2c',
      texture: 'leather', finish: 'leathergrain', screen: 'sideflip', eyecup: 'small',
      notes: '平顶 + 三个机械拨盘 + 银色顶盖 + 皮革包覆，是它最容易被认出的结构签名。',
      signature: ['x-t5', 'x100vi', 'x-h2s', 'x-pro3', 'gfx100-ii'],
      classic: ['x-t4', 'x100vi', 'x-pro3', 'gfx100-ii']
    },
    panasonic: {
      id: 'panasonic', name: '松下', en: 'PANASONIC', mark: 'LUMIX', wordmark: 'LUMIX',
      color: '#53709c', logoStyle: 'text',
      corner: 0.27, bevel: 0.3, softness: 0.62, shoulder: 'curved',
      top: 'arc', hump: 'low', humpR: 0.33, grip: 1.14, dials: 2, dialStyle: 'knurled',
      accent: '#b8382f', accentUse: 'logo_L', mountRing: '#bfbcb2', vent: 'none',
      bodyColor: '#1f2327', topColor: '#272b30', gripColor: '#15181b',
      texture: 'micrograin', finish: 'matte', screen: 'sideflip', eyecup: 'round',
      notes: '厚实的视频机身、深握柄、平缓的顶盖，以及 LUMIX 红色标志。',
      signature: ['s5-ii', 'gh7', 'g9-ii', 's9'],
      classic: ['gh6', 's5-ii', 'g9-ii', 'lx100-ii']
    },
    sigma: {
      id: 'sigma', name: '适马', en: 'SIGMA', mark: 'SIGMA', wordmark: 'SIGMA',
      color: '#7f858a', logoStyle: 'text',
      corner: 0.12, bevel: 0.14, softness: 0.18, shoulder: 'flat',
      top: 'flush', hump: 'none', humpR: 0.2, grip: 0.18, dials: 1, dialStyle: 'flat',
      accent: '#9a9d9f', accentUse: 'none', mountRing: '#b5b2a9', vent: 'side',
      bodyColor: '#2b2e2f', topColor: '#303334', gripColor: '#242627',
      texture: 'machined', finish: 'anodized', screen: 'fixed', eyecup: 'none',
      notes: '极简方块、几乎无握柄、整块铝切削、散热鳍片外露。辨识度来自“什么都没有”。',
      signature: ['fp', 'fp-l', 'bf'],
      classic: ['fp', 'fp-l']
    },
    tamron: {
      id: 'tamron', name: '腾龙', en: 'TAMRON', mark: 'TAMRON', wordmark: 'TAMRON',
      color: '#6f7d84', logoStyle: 'text', lensOnly: true,
      accent: '#8c9aa1', mountRing: '#b5b2a9', notes: '只做镜头。轻量化、统一滤镜口径与简洁的黑色镜身。'
    },
    red: {
      id: 'red', name: 'RED 数字电影', en: 'RED', mark: 'RED', wordmark: 'RED',
      color: '#b23a30', logoStyle: 'text',
      corner: 0.08, bevel: 0.1, softness: 0.12, shoulder: 'flat',
      top: 'cine_shoulder', hump: 'none', humpR: 0.2, grip: 0.2, dials: 1, dialStyle: 'flat',
      accent: '#b23a30', accentUse: 'logo_bar', mountRing: '#3a3d3c', vent: 'side',
      bodyColor: '#171919', topColor: '#202323', gripColor: '#121414',
      texture: 'machined', finish: 'anodized', screen: 'fixed', eyecup: 'none',
      notes: '模块化方形机身、外露散热结构、顶部提手与 PL 卡口。功能件就是造型。',
      signature: ['v-raptor-8k-vv', 'komodo-x', 'v-raptor-xl'],
      classic: ['komodo-x', 'v-raptor-8k-vv']
    },
    blackmagic: {
      id: 'blackmagic', name: 'Blackmagic Design', en: 'BLACKMAGIC', mark: 'BMD', wordmark: 'Blackmagic',
      color: '#8d8f8b', logoStyle: 'text',
      corner: 0.14, bevel: 0.16, softness: 0.28, shoulder: 'flat',
      top: 'flat', hump: 'none', humpR: 0.2, grip: 0.3, dials: 1, dialStyle: 'flat',
      accent: '#9b9e9a', accentUse: 'none', mountRing: '#4e514f', vent: 'side',
      bodyColor: '#26292a', topColor: '#2c2f30', gripColor: '#1d1f20',
      texture: 'machined', finish: 'matte', screen: 'fixed', eyecup: 'none',
      notes: '紧凑方正、背面一整块大屏、简洁到近乎工具化的表面处理。',
      signature: ['pocket-6k-pro', 'ursa-mini-pro-12k', 'pyxis-6k'],
      classic: ['pocket-6k-pro', 'ursa-mini-pro-12k']
    },
    arri: {
      id: 'arri', name: 'ARRI', en: 'ARRI', mark: 'ARRI', wordmark: 'ARRI',
      color: '#7e8b8e', logoStyle: 'text',
      corner: 0.1, bevel: 0.12, softness: 0.2, shoulder: 'flat',
      top: 'cine_shoulder', hump: 'none', humpR: 0.2, grip: 0.16, dials: 1, dialStyle: 'flat',
      accent: '#6f8b96', accentUse: 'logo_bar', mountRing: '#4a4d4d', vent: 'side',
      bodyColor: '#3a4143', topColor: '#464d4f', gripColor: '#2d3335',
      texture: 'machined', finish: 'matte', screen: 'fixed', eyecup: 'none',
      notes: '银灰金属、方形机身、规整的散热与接口阵列，以及粗壮的 PL 卡口。',
      signature: ['alexa-35', 'alexa-mini-lf', 'amira'],
      classic: ['alexa-35', 'alexa-mini-lf']
    },
    leica: {
      id: 'leica', name: '徕卡', en: 'LEICA', mark: 'LEICA', wordmark: 'LEICA',
      color: '#9b2c26', logoStyle: 'mark',
      corner: 0.1, bevel: 0.14, softness: 0.25, shoulder: 'flat',
      top: 'flat', hump: 'none', humpR: 0.25, grip: 0.3, dials: 2, dialStyle: 'stepped',
      accent: '#9b2c26', accentUse: 'red_dot', mountRing: '#b7b4aa', vent: 'none',
      bodyColor: '#b9b6ad', topColor: '#c3c0b6', gripColor: '#26282a',
      texture: 'leather', finish: 'leathergrain', screen: 'fixed', eyecup: 'small',
      notes: '极简平顶、皮革包覆、红色圆标与克制的金属比例。M 系统几乎不设握柄。',
      signature: ['m11', 'q3', 'sl3', 'd-lux-8'],
      classic: ['m11', 'q3', 'sl3']
    },
    om: {
      id: 'om', name: 'OM SYSTEM', en: 'OM SYSTEM', mark: 'OM', wordmark: 'OM SYSTEM',
      color: '#6d7d80', logoStyle: 'text',
      corner: 0.26, bevel: 0.3, softness: 0.62, shoulder: 'curved',
      top: 'arc', hump: 'low', humpR: 0.3, grip: 0.86, dials: 2, dialStyle: 'knurled',
      accent: '#7c8d90', accentUse: 'none', mountRing: '#b7b3a9', vent: 'none',
      bodyColor: '#202322', topColor: '#b9b5aa', gripColor: '#171918',
      texture: 'micrograin', finish: 'matte', screen: 'sideflip', eyecup: 'round',
      notes: '小型化、复古肩线、银色顶盖与 M43 的轻巧比例。',
      signature: ['om-1', 'om-5', 'om-3'],
      classic: ['om-1', 'om-5', 'pen-e-p7']
    },
    dji: {
      id: 'dji', name: '大疆创新', en: 'DJI', mark: 'DJI', wordmark: 'DJI',
      color: '#8f969b', logoStyle: 'text',
      corner: 0.34, bevel: 0.36, softness: 0.9, shoulder: 'curved',
      top: 'flush', hump: 'none', humpR: 0.2, grip: 0.5, dials: 1, dialStyle: 'flat',
      accent: '#9aa1a5', accentUse: 'none', mountRing: '#3c3f3e', vent: 'none',
      bodyColor: '#2a2d2e', topColor: '#333738', gripColor: '#232627',
      texture: 'smooth', finish: 'anodized', screen: 'fixed', eyecup: 'none',
      notes: '云台优先的结构：纵向握把、三轴云台、极小的相机头与磁吸快拆。',
      signature: ['osmo-pocket-3', 'osmo-action-5-pro', 'ronin-4d-8k'],
      classic: ['osmo-pocket-3', 'osmo-action-5-pro']
    },
    gopro: {
      id: 'gopro', name: 'GoPro', en: 'GOPRO', mark: 'GoPro', wordmark: 'GoPro',
      color: '#5b6a6d', logoStyle: 'text',
      corner: 0.22, bevel: 0.26, softness: 0.55, shoulder: 'curved',
      top: 'flush', hump: 'none', humpR: 0.2, grip: 0.1, dials: 1, dialStyle: 'flat',
      accent: '#8c979a', accentUse: 'none', mountRing: '#3c3f3e', vent: 'none',
      bodyColor: '#242829', topColor: '#2a2e2f', gripColor: '#1e2122',
      texture: 'rubber', finish: 'rubberized', screen: 'fixed', eyecup: 'none',
      notes: '小方盒、橡胶防滑层、正面圆形镜头与指扣式快拆接口。',
      signature: ['hero13-black', 'max-2'],
      classic: ['hero13-black', 'hero11-mini']
    },
    frame: {
      id: 'frame', name: '独立品牌', en: 'INDEPENDENT', mark: 'FRAME', wordmark: 'FRAME',
      color: '#d8a65a', logoStyle: 'text',
      corner: 0.24, bevel: 0.28, softness: 0.6, shoulder: 'curved',
      top: 'arc', hump: 'low', humpR: 0.32, grip: 0.95, dials: 2, dialStyle: 'knurled',
      accent: '#d8a65a', accentUse: 'accent_line', mountRing: '#b9b6ac', vent: 'none',
      bodyColor: '#252728', topColor: '#2d3031', gripColor: '#1b1d1e',
      texture: 'micrograin', finish: 'matte', screen: 'sideflip', eyecup: 'round',
      notes: '没有历史包袱的新品牌：结构干净，比例克制，留出强烈的品牌色作为识别点。',
      signature: [], classic: []
    }
  };

  /* ---------------------------------------------------------
     2. Category proportion guides
     ---------------------------------------------------------
     All values are ratios of the body width (or an absolute
     mm range). They define the reality envelope used by the
     proportion solver. g = [gripHeight, gripWidth, gripDepth]
     ratios relative to body H / W / D.
     --------------------------------------------------------- */
  const CATEGORY_GUIDE = {
    compact: {
      label: '卡片机', w: [92, 122], h: [54, 74], d: [26, 48], ratio: 0.56, depthRatio: 0.48,
      g: [0.10, 0.16, 0.28], top: 0.09, hump: 0.05, lensRatio: 0.46, mount: 'FIXED', dials: 1,
      silhouette: 'rounded', screen: 'fixed', note: '口袋比例，镜头几乎与机身同宽。'
    },
    mirrorless: {
      label: '中端微单', w: [112, 146], h: [64, 92], d: [38, 62], ratio: 0.66, depthRatio: 0.62,
      g: [0.62, 0.29, 0.72], top: 0.11, hump: 0.14, lensRatio: 0.72, mount: 'E', dials: 2,
      silhouette: 'rounded', screen: 'sideflip', note: '现代主力比例，握柄与薄机身之间的平衡。'
    },
    fullframe: {
      label: '全画幅', w: [124, 150], h: [82, 106], d: [52, 82], ratio: 0.72, depthRatio: 0.68,
      g: [0.72, 0.31, 0.78], top: 0.12, hump: 0.17, lensRatio: 0.78, mount: 'E', dials: 2,
      silhouette: 'ergo', screen: 'tilt', note: '专业全画幅的厚度与握柄比例。'
    },
    highres: {
      label: '高像素机', w: [128, 152], h: [86, 110], d: [58, 88], ratio: 0.74, depthRatio: 0.7,
      g: [0.74, 0.31, 0.78], top: 0.13, hump: 0.19, lensRatio: 0.78, mount: 'E', dials: 2,
      silhouette: 'ergo', screen: 'tilt', note: '散热与机身强度优先，比主力机更厚一点。'
    },
    sports: {
      label: '高速体育机', w: [136, 162], h: [96, 128], d: [64, 96], ratio: 0.8, depthRatio: 0.72,
      g: [0.86, 0.34, 0.84], top: 0.14, hump: 0.22, lensRatio: 0.82, mount: 'E', dials: 2,
      silhouette: 'ergo', screen: 'tilt', note: '高握柄、深机身、宽顶盖，可靠感来自体积。'
    },
    vlog: {
      label: '视频博主机', w: [106, 132], h: [60, 86], d: [32, 56], ratio: 0.62, depthRatio: 0.55,
      g: [0.46, 0.26, 0.58], top: 0.1, hump: 0.1, lensRatio: 0.66, mount: 'E', dials: 1,
      silhouette: 'rounded', screen: 'sideflip', note: '轻量、侧翻屏、握柄不能太大。'
    },
    cinema: {
      label: '专业电影机', w: [150, 214], h: [96, 168], d: [72, 142], ratio: 0.9, depthRatio: 0.78,
      g: [0.3, 0.18, 0.42], top: 0.16, hump: 0.05, lensRatio: 0.9, mount: 'PL', dials: 1,
      silhouette: 'angular', screen: 'fixed', note: '模块化方形机身，散热与接口决定轮廓。'
    },
    medium: {
      label: '中画幅', w: [140, 172], h: [96, 126], d: [66, 102], ratio: 0.76, depthRatio: 0.68,
      g: [0.7, 0.3, 0.72], top: 0.14, hump: 0.22, lensRatio: 0.86, mount: 'GFX', dials: 2,
      silhouette: 'ergo', screen: 'tilt', note: '大卡口与大取景器，整体比例更厚重。'
    },
    action: {
      label: '运动相机', w: [58, 82], h: [44, 64], d: [26, 44], ratio: 0.7, depthRatio: 0.64,
      g: [0, 0.1, 0.12], top: 0.06, hump: 0, lensRatio: 0.52, mount: 'FIXED', dials: 1,
      silhouette: 'angular', screen: 'fixed', note: '近似立方体，镜头与机身几乎同宽。'
    },
    retro: {
      label: '复古旁轴', w: [124, 148], h: [72, 92], d: [36, 60], ratio: 0.58, depthRatio: 0.52,
      g: [0.22, 0.16, 0.34], top: 0.1, hump: 0.06, lensRatio: 0.62, mount: 'M', dials: 3,
      silhouette: 'retroblock', screen: 'fixed', note: '扁平机身、平顶、机械拨盘，比例克制。'
    }
  };

  /* ---------------------------------------------------------
     3. Real camera structural references
     ---------------------------------------------------------
     g   : [gripH/H, gripW/W, gripD/D]
     top : flat | arc | prism | shoulder | cine
     hump: none | low | smooth | tall | prism
     evf : none | small | pro | eyelevel | folding
     scr : fixed | tilt | sideflip | none
     --------------------------------------------------------- */
  const MODELS = [
    // ---- Canon ----
    { id: 'eos-r5', brand: 'canon', name: 'EOS R5', cat: 'highres', year: 2020, mount: 'RF', w: 138.5, h: 97.5, d: 88, weight: 738, g: [0.7, 0.31, 0.78], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'magnesium', finish: 'matte', commons: 'Canon EOS R5', note: '佳能全画幅微单的基准比例：深握柄、圆肩、中央取景器隆起。' },
    { id: 'eos-r6-ii', brand: 'canon', name: 'EOS R6 Mark II', cat: 'fullframe', year: 2022, mount: 'RF', w: 138.4, h: 98.4, d: 88.4, weight: 670, g: [0.72, 0.31, 0.79], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'magnesium', finish: 'matte', commons: 'Canon EOS R6 Mark II', note: '与 R5 共享工业语言，握柄略浅、机身更轻。' },
    { id: 'eos-r3', brand: 'canon', name: 'EOS R3', cat: 'sports', year: 2021, mount: 'RF', w: 150, h: 142.6, d: 87.2, weight: 1015, g: [1.0, 0.36, 0.88], corner: 0.28, top: 'arc', hump: 'smooth', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1b1d1e', topColor: '#242727', accent: '#b73b2e', material: 'magnesium', finish: 'matte', integratedGrip: true, commons: 'Canon EOS R3', note: '一体式竖拍握柄，体育机的典型体量。' },
    { id: 'eos-r7', brand: 'canon', name: 'EOS R7', cat: 'sports', year: 2022, mount: 'RF', w: 132, h: 90.4, d: 91.7, weight: 612, g: [0.76, 0.33, 0.84], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'magnesium', finish: 'matte', commons: 'Canon EOS R7', note: 'APS-C 速度机，机身厚、握柄深。' },
    { id: 'eos-r10', brand: 'canon', name: 'EOS R10', cat: 'mirrorless', year: 2022, mount: 'RF', w: 122.5, h: 87.8, d: 83.4, weight: 429, g: [0.66, 0.31, 0.72], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'small', scr: 'sideflip', dials: 2, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'plastic', finish: 'matte', commons: 'Canon EOS R10', note: '入门微单：塑料机身但保留佳能的比例语言。' },
    { id: 'eos-r8', brand: 'canon', name: 'EOS R8', cat: 'fullframe', year: 2023, mount: 'RF', w: 132.5, h: 86.1, d: 70, weight: 461, g: [0.68, 0.31, 0.74], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'small', scr: 'sideflip', dials: 2, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'plastic', finish: 'matte', commons: 'Canon EOS R8', note: '紧凑全画幅，薄机身但握柄依旧完整。' },
    { id: 'eos-r50', brand: 'canon', name: 'EOS R50', cat: 'vlog', year: 2023, mount: 'RF', w: 116.3, h: 85.5, d: 68.8, weight: 375, g: [0.58, 0.29, 0.64], corner: 0.32, top: 'arc', hump: 'smooth', evf: 'small', scr: 'sideflip', dials: 1, color: '#1c1e1f', topColor: '#242728', accent: '#b73b2e', material: 'plastic', finish: 'matte', commons: 'Canon EOS R50', note: '面向博主的轻量机身，握柄缩小、顶盖简化。' },
    { id: 'eos-r5-c', brand: 'canon', name: 'EOS R5 C', cat: 'cinema', year: 2022, mount: 'RF', w: 142, h: 101, d: 111, weight: 770, g: [0.66, 0.3, 0.76], corner: 0.24, top: 'arc', hump: 'smooth', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1b1d1e', topColor: '#232626', accent: '#b73b2e', material: 'magnesium', finish: 'matte', fan: true, commons: 'Canon EOS R5 C', note: '在照片机身里塞入主动散热，机身明显变厚。' },
    { id: 'eos-c70', brand: 'canon', name: 'EOS C70', cat: 'cinema', year: 2020, mount: 'RF', w: 160, h: 130, d: 148, weight: 1430, g: [0.28, 0.2, 0.4], corner: 0.18, top: 'cine', hump: 'none', evf: 'none', scr: 'sideflip', dials: 1, color: '#171919', topColor: '#1f2222', accent: '#b73b2e', material: 'magnesium', finish: 'matte', fan: true, commons: 'Canon EOS C70', note: '肩扛式电影机，短法兰距但保留大机身与散热。' },
    { id: 'eos-5d-iv', brand: 'canon', name: 'EOS 5D Mark IV', cat: 'fullframe', year: 2016, mount: 'EF', w: 150.7, h: 116.4, d: 75.9, weight: 890, g: [0.8, 0.33, 0.8], corner: 0.28, top: 'prism', hump: 'prism', evf: 'eyelevel', scr: 'fixed', dials: 2, color: '#1b1d1e', topColor: '#242727', accent: '#b73b2e', material: 'magnesium', finish: 'matte', commons: 'Canon EOS 5D Mark IV', note: '经典单反轮廓：军舰部、光学取景器、厚机身。' },
    { id: 'powershot-g7x-iii', brand: 'canon', name: 'PowerShot G7 X Mark III', cat: 'compact', year: 2019, mount: 'FIXED', w: 105.5, h: 60.9, d: 41.4, weight: 304, g: [0.18, 0.18, 0.3], corner: 0.28, top: 'flat', hump: 'none', evf: 'none', scr: 'tilt', dials: 1, color: '#1b1d1e', topColor: '#242727', accent: '#b73b2e', material: 'aluminum', finish: 'anodized', commons: 'Canon PowerShot G7 X Mark III', note: '一英寸卡片机，镜头收进机身。' },
    { id: 'eos-m50', brand: 'canon', name: 'EOS M50', cat: 'mirrorless', year: 2018, mount: 'EF-M', w: 116.3, h: 88.4, d: 58.7, weight: 387, g: [0.62, 0.3, 0.7], corner: 0.3, top: 'arc', hump: 'smooth', evf: 'small', scr: 'sideflip', dials: 1, color: '#1b1d1e', topColor: '#242727', accent: '#b73b2e', material: 'plastic', finish: 'matte', commons: 'Canon EOS M50', note: '一代走量微单，佳能比例的小型化版本。' },

    // ---- Sony ----
    { id: 'a7-iv', brand: 'sony', name: 'Alpha 7 IV', cat: 'fullframe', year: 2021, mount: 'E', w: 131.3, h: 96.4, d: 79.8, weight: 658, g: [0.74, 0.31, 0.76], corner: 0.22, top: 'flat', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 7 IV', note: '索尼全画幅基准：切面肩线、宽握柄、低矮的取景器。' },
    { id: 'a7r-v', brand: 'sony', name: 'Alpha 7R V', cat: 'highres', year: 2022, mount: 'E', w: 131.3, h: 96.9, d: 82.4, weight: 723, g: [0.75, 0.31, 0.78], corner: 0.22, top: 'flat', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 7R V', note: '高像素机身，多轴翻转屏与厚实的散热结构。' },
    { id: 'a1-ii', brand: 'sony', name: 'Alpha 1 II', cat: 'sports', year: 2024, mount: 'E', w: 136.1, h: 96.9, d: 82.9, weight: 743, g: [0.78, 0.32, 0.8], corner: 0.2, top: 'flat', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#1e2124', topColor: '#262a2d', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 1 II', note: '速度旗舰：加宽的机身和更深的握柄。' },
    { id: 'a9-iii', brand: 'sony', name: 'Alpha 9 III', cat: 'sports', year: 2024, mount: 'E', w: 136.1, h: 96.9, d: 82.9, weight: 702, g: [0.78, 0.32, 0.8], corner: 0.2, top: 'flat', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#1e2124', topColor: '#262a2d', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 9 III', note: '全局快门速度机，外形与 A1 同族。' },
    { id: 'a6700', brand: 'sony', name: 'Alpha 6700', cat: 'mirrorless', year: 2023, mount: 'E', w: 122, h: 69, d: 75.1, weight: 493, g: [0.7, 0.32, 0.76], corner: 0.2, top: 'flat', hump: 'low', evf: 'small', scr: 'sideflip', dials: 2, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 6700', note: 'APS-C 机身，矮而厚，握柄相对机身很大。' },
    { id: 'a7c-ii', brand: 'sony', name: 'Alpha 7C II', cat: 'compact', year: 2023, mount: 'E', w: 124, h: 71.1, d: 63.4, weight: 514, g: [0.52, 0.27, 0.6], corner: 0.26, top: 'flat', hump: 'low', evf: 'small', scr: 'sideflip', dials: 2, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 7C II', note: '全画幅装进紧凑机身，握柄被压缩但仍完整。' },
    { id: 'zv-e10-ii', brand: 'sony', name: 'ZV-E10 II', cat: 'vlog', year: 2024, mount: 'E', w: 115.2, h: 64.2, d: 46.4, weight: 377, g: [0.42, 0.26, 0.5], corner: 0.24, top: 'flat', hump: 'low', evf: 'none', scr: 'sideflip', dials: 1, color: '#272a2c', topColor: '#2d3133', accent: '#c05a2e', material: 'plastic', finish: 'matte', commons: 'Sony ZV-E10 II', note: '无取景器的视频机，薄机身与侧翻屏。' },
    { id: 'zv-1', brand: 'sony', name: 'ZV-1', cat: 'compact', year: 2020, mount: 'FIXED', w: 105.5, h: 60, d: 46.5, weight: 294, g: [0.2, 0.2, 0.34], corner: 0.24, top: 'flat', hump: 'none', evf: 'none', scr: 'sideflip', dials: 1, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'plastic', finish: 'matte', commons: 'Sony ZV-1', note: '一英寸视频卡片机，机身极简。' },
    { id: 'fx3', brand: 'sony', name: 'FX3', cat: 'cinema', year: 2021, mount: 'E', w: 129.7, h: 77.8, d: 84.5, weight: 715, g: [0.6, 0.3, 0.7], corner: 0.2, top: 'cine', hump: 'none', evf: 'none', scr: 'sideflip', dials: 1, color: '#1e2123', topColor: '#262a2c', accent: '#c05a2e', material: 'magnesium', finish: 'matte', fan: true, commons: 'Sony FX3', note: '为云台与兔笼设计的方形电影机身，顶部有螺孔阵列。' },
    { id: 'fx6', brand: 'sony', name: 'FX6', cat: 'cinema', year: 2020, mount: 'E', w: 114, h: 116, d: 153, weight: 890, g: [0.2, 0.18, 0.3], corner: 0.16, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#1e2123', topColor: '#262a2c', accent: '#c05a2e', material: 'magnesium', finish: 'matte', fan: true, commons: 'Sony FX6', note: '纵向体积的电影机，顶部提手与后置电池。' },
    { id: 'a7-iii', brand: 'sony', name: 'Alpha 7 III', cat: 'fullframe', year: 2018, mount: 'E', w: 126.9, h: 95.6, d: 73.7, weight: 650, g: [0.74, 0.31, 0.76], corner: 0.22, top: 'flat', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony Alpha 7 III', note: '定义了现代全画幅微单比例的一代机型。' },
    { id: 'rx100-vii', brand: 'sony', name: 'RX100 VII', cat: 'compact', year: 2019, mount: 'FIXED', w: 101.6, h: 58.1, d: 42.8, weight: 302, g: [0.16, 0.16, 0.3], corner: 0.24, top: 'flat', hump: 'none', evf: 'small', scr: 'tilt', dials: 1, color: '#202326', topColor: '#282c2f', accent: '#c05a2e', material: 'magnesium', finish: 'matte', commons: 'Sony RX100 VII', note: '弹出式取景器的口袋长焦。' },

    // ---- Nikon ----
    { id: 'z8', brand: 'nikon', name: 'Z8', cat: 'highres', year: 2023, mount: 'Z', w: 144, h: 118.5, d: 83, weight: 910, g: [0.8, 0.33, 0.8], corner: 0.3, top: 'arc', hump: 'tall', evf: 'pro', scr: 'tilt', dials: 2, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'magnesium', finish: 'matte', commons: 'Nikon Z8', note: '高机身、深握柄，取景器隆起非常明显。' },
    { id: 'z9', brand: 'nikon', name: 'Z9', cat: 'sports', year: 2021, mount: 'Z', w: 149, h: 149.5, d: 90.5, weight: 1340, g: [1.0, 0.36, 0.9], corner: 0.28, top: 'arc', hump: 'tall', evf: 'pro', scr: 'tilt', dials: 2, color: '#1b1c1b', topColor: '#242624', accent: '#b8342c', material: 'magnesium', finish: 'matte', integratedGrip: true, commons: 'Nikon Z9', note: '一体式竖拍手柄的方块机。' },
    { id: 'z6-iii', brand: 'nikon', name: 'Z6III', cat: 'fullframe', year: 2024, mount: 'Z', w: 138.5, h: 101.5, d: 74, weight: 670, g: [0.76, 0.32, 0.78], corner: 0.3, top: 'arc', hump: 'tall', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'magnesium', finish: 'matte', commons: 'Nikon Z6III', note: '主力全画幅，握柄红线是其识别符号。' },
    { id: 'z7-ii', brand: 'nikon', name: 'Z7 II', cat: 'highres', year: 2020, mount: 'Z', w: 134, h: 100.5, d: 69.5, weight: 705, g: [0.74, 0.32, 0.76], corner: 0.3, top: 'arc', hump: 'tall', evf: 'pro', scr: 'tilt', dials: 2, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'magnesium', finish: 'matte', commons: 'Nikon Z7 II', note: '高像素机身，比例更修长。' },
    { id: 'z5-ii', brand: 'nikon', name: 'Z5 II', cat: 'fullframe', year: 2025, mount: 'Z', w: 134, h: 100.5, d: 72, weight: 700, g: [0.74, 0.32, 0.76], corner: 0.3, top: 'arc', hump: 'tall', evf: 'pro', scr: 'tilt', dials: 2, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'magnesium', finish: 'matte', commons: 'Nikon Z5II', note: '入门全画幅，沿用同一套工业语言。' },
    { id: 'zf', brand: 'nikon', name: 'Zf', cat: 'retro', year: 2023, mount: 'Z', w: 144, h: 103, d: 49, weight: 710, g: [0.3, 0.18, 0.4], corner: 0.14, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'magnesium', finish: 'leathergrain', commons: 'Nikon Zf', note: '复古平顶、机械拨盘与皮革包覆。' },
    { id: 'zfc', brand: 'nikon', name: 'Zfc', cat: 'retro', year: 2021, mount: 'Z', w: 134.5, h: 93.5, d: 43.5, weight: 445, g: [0.2, 0.16, 0.3], corner: 0.14, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#c9c5b9', topColor: '#cfcbbf', accent: '#b8342c', material: 'magnesium', finish: 'leathergrain', commons: 'Nikon Zfc', note: 'APS-C 复古机，银色顶盖 + 黑色蒙皮。' },
    { id: 'z50-ii', brand: 'nikon', name: 'Z50 II', cat: 'mirrorless', year: 2024, mount: 'Z', w: 127, h: 96.8, d: 66.5, weight: 550, g: [0.7, 0.31, 0.74], corner: 0.3, top: 'arc', hump: 'tall', evf: 'small', scr: 'sideflip', dials: 2, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'plastic', finish: 'matte', commons: 'Nikon Z50II', note: 'APS-C 主力机，握柄比例接近全画幅。' },
    { id: 'z30', brand: 'nikon', name: 'Z30', cat: 'vlog', year: 2022, mount: 'Z', w: 128, h: 73.5, d: 59.5, weight: 405, g: [0.6, 0.29, 0.66], corner: 0.3, top: 'arc', hump: 'none', evf: 'none', scr: 'sideflip', dials: 1, color: '#1d1e1d', topColor: '#252725', accent: '#b8342c', material: 'plastic', finish: 'matte', commons: 'Nikon Z30', note: '无取景器视频机，顶盖平直。' },
    { id: 'd850', brand: 'nikon', name: 'D850', cat: 'highres', year: 2017, mount: 'F', w: 146, h: 124, d: 78.5, weight: 1005, g: [0.82, 0.34, 0.82], corner: 0.3, top: 'prism', hump: 'prism', evf: 'eyelevel', scr: 'tilt', dials: 2, color: '#1b1c1b', topColor: '#242624', accent: '#b8342c', material: 'magnesium', finish: 'matte', commons: 'Nikon D850', note: '单反时代的旗舰轮廓，军舰部高而宽。' },

    // ---- Fujifilm ----
    { id: 'x-t5', brand: 'fujifilm', name: 'X-T5', cat: 'mirrorless', year: 2022, mount: 'X', w: 129.5, h: 91, d: 63.8, weight: 557, g: [0.42, 0.24, 0.5], corner: 0.18, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#c9c4b8', topColor: '#cfcabe', accent: '#a8803f', material: 'magnesium', finish: 'leathergrain', commons: 'Fujifilm X-T5', note: '平顶 + 三个拨盘 + 银顶 + 皮革，富士的完整签名。' },
    { id: 'x-t50', brand: 'fujifilm', name: 'X-T50', cat: 'mirrorless', year: 2024, mount: 'X', w: 123.8, h: 84, d: 46.8, weight: 438, g: [0.34, 0.22, 0.44], corner: 0.18, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#c9c4b8', topColor: '#cfcabe', accent: '#a8803f', material: 'aluminum', finish: 'leathergrain', commons: 'Fujifilm X-T50', note: '更小的平顶复古机，胶片模拟转盘是新增符号。' },
    { id: 'x-h2s', brand: 'fujifilm', name: 'X-H2S', cat: 'sports', year: 2022, mount: 'X', w: 136.3, h: 92.9, d: 84.6, weight: 660, g: [0.7, 0.31, 0.76], corner: 0.24, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#a8803f', material: 'magnesium', finish: 'matte', commons: 'Fujifilm X-H2S', note: '富士少有的现代握柄机身，速度取向。' },
    { id: 'x100vi', brand: 'fujifilm', name: 'X100VI', cat: 'retro', year: 2024, mount: 'FIXED', w: 128, h: 74.8, d: 55.3, weight: 521, g: [0.14, 0.14, 0.22], corner: 0.16, top: 'flat', hump: 'none', evf: 'small', scr: 'fixed', dials: 2, color: '#c9c4b8', topColor: '#cfcabe', accent: '#a8803f', material: 'magnesium', finish: 'leathergrain', commons: 'Fujifilm X100VI', note: '固定镜头旁轴风格，平顶与混合取景器。' },
    { id: 'x-pro3', brand: 'fujifilm', name: 'X-Pro3', cat: 'retro', year: 2019, mount: 'X', w: 140.5, h: 82.8, d: 45.9, weight: 497, g: [0.16, 0.16, 0.26], corner: 0.14, top: 'flat', hump: 'none', evf: 'folding', scr: 'fixed', dials: 3, color: '#202120', topColor: '#cfcabe', accent: '#a8803f', material: 'magnesium', finish: 'leathergrain', commons: 'Fujifilm X-Pro3', note: '宽幅旁轴机身，钛灰顶盖与隐藏式背屏。' },
    { id: 'x-s20', brand: 'fujifilm', name: 'X-S20', cat: 'mirrorless', year: 2023, mount: 'X', w: 127.2, h: 85.1, d: 65.2, weight: 491, g: [0.52, 0.27, 0.58], corner: 0.24, top: 'arc', hump: 'low', evf: 'small', scr: 'sideflip', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#a8803f', material: 'plastic', finish: 'matte', commons: 'Fujifilm X-S20', note: '轻量握柄机身，向视频与旅行倾斜。' },
    { id: 'x-m5', brand: 'fujifilm', name: 'X-M5', cat: 'vlog', year: 2024, mount: 'X', w: 111.9, h: 66.6, d: 38.5, weight: 355, g: [0.24, 0.2, 0.34], corner: 0.22, top: 'flat', hump: 'none', evf: 'none', scr: 'sideflip', dials: 2, color: '#c9c4b8', topColor: '#cfcabe', accent: '#a8803f', material: 'aluminum', finish: 'matte', commons: 'Fujifilm X-M5', note: '无取景器的轻量视频机，极薄的平顶机身。' },
    { id: 'gfx100-ii', brand: 'fujifilm', name: 'GFX100 II', cat: 'medium', year: 2023, mount: 'GFX', w: 152.4, h: 117.4, d: 98.7, weight: 1030, g: [0.78, 0.33, 0.8], corner: 0.26, top: 'arc', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#a8803f', material: 'magnesium', finish: 'matte', commons: 'Fujifilm GFX100 II', note: '中画幅的体量与巨大的卡口。' },
    { id: 'gfx100s-ii', brand: 'fujifilm', name: 'GFX100S II', cat: 'medium', year: 2024, mount: 'GFX', w: 150, h: 104.2, d: 87.2, weight: 883, g: [0.72, 0.32, 0.76], corner: 0.26, top: 'arc', hump: 'low', evf: 'pro', scr: 'tilt', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#a8803f', material: 'magnesium', finish: 'matte', commons: 'Fujifilm GFX100S II', note: '更紧凑的中画幅，向下压缩的握柄设计。' },
    { id: 'gfx50r', brand: 'fujifilm', name: 'GFX50R', cat: 'medium', year: 2018, mount: 'GFX', w: 160.7, h: 96.5, d: 66.4, weight: 775, g: [0.18, 0.16, 0.3], corner: 0.14, top: 'flat', hump: 'none', evf: 'small', scr: 'fixed', dials: 2, color: '#202120', topColor: '#cfcabe', accent: '#a8803f', material: 'magnesium', finish: 'leathergrain', commons: 'Fujifilm GFX50R', note: '宽幅旁轴式中画幅，几乎没有握柄。' },
    { id: 'x-t4', brand: 'fujifilm', name: 'X-T4', cat: 'mirrorless', year: 2020, mount: 'X', w: 134.6, h: 92.8, d: 63.8, weight: 607, g: [0.46, 0.25, 0.52], corner: 0.18, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#c9c4b8', topColor: '#cfcabe', accent: '#a8803f', material: 'magnesium', finish: 'leathergrain', commons: 'Fujifilm X-T4', note: '上一代旗舰，比例与 X-T5 基本一致。' },

    // ---- Panasonic ----
    { id: 's5-ii', brand: 'panasonic', name: 'LUMIX S5 II', cat: 'fullframe', year: 2023, mount: 'L', w: 134.3, h: 102.3, d: 90.1, weight: 740, g: [0.76, 0.32, 0.8], corner: 0.28, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'magnesium', finish: 'matte', commons: 'Panasonic Lumix S5 II', note: '厚实、深握柄，视频机的重心分配。' },
    { id: 's1r-ii', brand: 'panasonic', name: 'LUMIX S1R II', cat: 'highres', year: 2025, mount: 'L', w: 148.4, h: 106.8, d: 95.6, weight: 855, g: [0.78, 0.33, 0.82], corner: 0.28, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'magnesium', finish: 'matte', commons: 'Panasonic Lumix S1R II', note: '大体积高像素机身，散热空间充足。' },
    { id: 'gh7', brand: 'panasonic', name: 'LUMIX GH7', cat: 'cinema', year: 2024, mount: 'M43', w: 138.4, h: 100.3, d: 99.6, weight: 805, g: [0.7, 0.31, 0.76], corner: 0.26, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'magnesium', finish: 'matte', fan: true, commons: 'Panasonic Lumix GH7', note: 'M43 视频旗舰，机身厚度接近全画幅。' },
    { id: 'g9-ii', brand: 'panasonic', name: 'LUMIX G9 II', cat: 'sports', year: 2023, mount: 'M43', w: 134.3, h: 102.3, d: 90.1, weight: 658, g: [0.76, 0.32, 0.8], corner: 0.28, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'magnesium', finish: 'matte', commons: 'Panasonic Lumix G9 II', note: 'M43 速度机，外形与 S5 同族。' },
    { id: 's9', brand: 'panasonic', name: 'LUMIX S9', cat: 'compact', year: 2024, mount: 'L', w: 126, h: 73.9, d: 46.8, weight: 486, g: [0.34, 0.22, 0.42], corner: 0.28, top: 'flat', hump: 'none', evf: 'none', scr: 'sideflip', dials: 1, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'magnesium', finish: 'matte', commons: 'Panasonic Lumix S9', note: '无取景器的全画幅紧凑机，靠色彩与轻量取胜。' },
    { id: 'lx100-ii', brand: 'panasonic', name: 'LUMIX LX100 II', cat: 'compact', year: 2018, mount: 'FIXED', w: 115, h: 66, d: 64, weight: 392, g: [0.2, 0.18, 0.3], corner: 0.2, top: 'flat', hump: 'none', evf: 'small', scr: 'fixed', dials: 2, color: '#202326', topColor: '#b9b5aa', accent: '#b8382f', material: 'magnesium', finish: 'anodized', commons: 'Panasonic Lumix LX100 II', note: 'M43 卡片机，镜筒突出、拨盘丰富。' },
    { id: 'g100', brand: 'panasonic', name: 'LUMIX G100', cat: 'vlog', year: 2020, mount: 'M43', w: 115.6, h: 82.5, d: 54.2, weight: 346, g: [0.52, 0.27, 0.6], corner: 0.28, top: 'arc', hump: 'low', evf: 'small', scr: 'sideflip', dials: 1, color: '#1f2327', topColor: '#272b30', accent: '#b8382f', material: 'plastic', finish: 'matte', commons: 'Panasonic Lumix G100', note: '轻量视频机，小尺寸但保留握柄。' },

    // ---- Sigma ----
    { id: 'fp', brand: 'sigma', name: 'fp', cat: 'compact', year: 2019, mount: 'L', w: 112.6, h: 69.9, d: 45.3, weight: 370, g: [0.08, 0.1, 0.12], corner: 0.1, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#2b2e2f', topColor: '#303334', accent: '#9a9d9f', material: 'aluminum', finish: 'anodized', commons: 'Sigma fp', note: '整块铝切削的方块，几乎没有握柄。' },
    { id: 'fp-l', brand: 'sigma', name: 'fp L', cat: 'fullframe', year: 2021, mount: 'L', w: 112.6, h: 69.9, d: 45.3, weight: 427, g: [0.08, 0.1, 0.12], corner: 0.1, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#2b2e2f', topColor: '#303334', accent: '#9a9d9f', material: 'aluminum', finish: 'anodized', commons: 'Sigma fp L', note: '高像素版本，外形与 fp 完全一致。' },
    { id: 'bf', brand: 'sigma', name: 'BF', cat: 'fullframe', year: 2025, mount: 'L', w: 116, h: 72, d: 46, weight: 388, g: [0.06, 0.08, 0.1], corner: 0.08, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#2b2e2f', topColor: '#303334', accent: '#9a9d9f', material: 'aluminum', finish: 'anodized', commons: 'Sigma BF', note: '无握柄、单拨盘的极简全画幅。' },

    // ---- RED ----
    { id: 'v-raptor-8k-vv', brand: 'red', name: 'V-RAPTOR 8K VV', cat: 'cinema', year: 2021, mount: 'PL', w: 178, h: 118, d: 122, weight: 3200, g: [0.1, 0.1, 0.12], corner: 0.08, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#171919', topColor: '#202323', accent: '#b23a30', material: 'aluminum', finish: 'anodized', fan: true, commons: 'RED V-Raptor', note: '模块化电影机身，顶部提手与侧向散热。' },
    { id: 'komodo-x', brand: 'red', name: 'KOMODO-X', cat: 'cinema', year: 2023, mount: 'RF', w: 155, h: 100, d: 100, weight: 1220, g: [0.1, 0.1, 0.12], corner: 0.08, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#171919', topColor: '#202323', accent: '#b23a30', material: 'aluminum', finish: 'anodized', fan: true, commons: 'RED Komodo', note: '小型方块电影机，RF 卡口与全局快门。' },
    { id: 'v-raptor-xl', brand: 'red', name: 'V-RAPTOR XL', cat: 'cinema', year: 2023, mount: 'PL', w: 230, h: 160, d: 150, weight: 4800, g: [0.1, 0.1, 0.12], corner: 0.08, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#171919', topColor: '#202323', accent: '#b23a30', material: 'aluminum', finish: 'anodized', fan: true, commons: 'RED V-Raptor XL', note: '带肩垫与电池模块的完整片场形态。' },

    // ---- Blackmagic ----
    { id: 'pocket-6k-pro', brand: 'blackmagic', name: 'Pocket Cinema Camera 6K Pro', cat: 'cinema', year: 2021, mount: 'EF', w: 180, h: 112, d: 123, weight: 1230, g: [0.24, 0.2, 0.3], corner: 0.14, top: 'flat', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#26292a', topColor: '#2c2f30', accent: '#9b9e9a', material: 'magnesium', finish: 'matte', fan: true, commons: 'Blackmagic Pocket Cinema Camera 6K', note: '短机身 + 背面大屏 + 内置 ND，手持电影机。' },
    { id: 'ursa-mini-pro-12k', brand: 'blackmagic', name: 'URSA Mini Pro 12K', cat: 'cinema', year: 2020, mount: 'PL', w: 205, h: 148, d: 145, weight: 2800, g: [0.3, 0.22, 0.4], corner: 0.12, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#26292a', topColor: '#2c2f30', accent: '#9b9e9a', material: 'magnesium', finish: 'matte', fan: true, commons: 'Blackmagic URSA Mini Pro 12K', note: '肩扛电影机，可旋转把手与侧屏。' },
    { id: 'pyxis-6k', brand: 'blackmagic', name: 'PYXIS 6K', cat: 'cinema', year: 2024, mount: 'PL', w: 195, h: 128, d: 100, weight: 1500, g: [0.1, 0.12, 0.16], corner: 0.1, top: 'flat', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#26292a', topColor: '#2c2f30', accent: '#9b9e9a', material: 'aluminum', finish: 'matte', fan: true, commons: 'Blackmagic PYXIS 6K', note: '方块化机身，为云台与稳定器设计。' },

    // ---- ARRI ----
    { id: 'alexa-35', brand: 'arri', name: 'ALEXA 35', cat: 'cinema', year: 2022, mount: 'PL', w: 240, h: 175, d: 175, weight: 4100, g: [0.1, 0.1, 0.14], corner: 0.1, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#3a4143', topColor: '#464d4f', accent: '#6f8b96', material: 'aluminum', finish: 'matte', fan: true, commons: 'ARRI ALEXA 35', note: '片场标准机身，银灰金属与巨大的 PL 卡口。' },
    { id: 'alexa-mini-lf', brand: 'arri', name: 'ALEXA Mini LF', cat: 'cinema', year: 2019, mount: 'PL', w: 185, h: 140, d: 150, weight: 2600, g: [0.1, 0.1, 0.14], corner: 0.1, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#3a4143', topColor: '#464d4f', accent: '#6f8b96', material: 'aluminum', finish: 'matte', fan: true, commons: 'ARRI ALEXA Mini LF', note: '大画幅紧凑机身，顶部与侧面布满附件接口。' },
    { id: 'amira', brand: 'arri', name: 'AMIRA', cat: 'cinema', year: 2014, mount: 'PL', w: 190, h: 160, d: 170, weight: 4100, g: [0.14, 0.12, 0.2], corner: 0.1, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#3a4143', topColor: '#464d4f', accent: '#6f8b96', material: 'aluminum', finish: 'matte', commons: 'ARRI AMIRA', note: '纪录片肩扛机，一体化机身与提手。' },

    // ---- Leica ----
    { id: 'sl3', brand: 'leica', name: 'SL3', cat: 'fullframe', year: 2024, mount: 'L', w: 147.2, h: 108.2, d: 84.6, weight: 769, g: [0.66, 0.3, 0.72], corner: 0.12, top: 'flat', hump: 'none', evf: 'pro', scr: 'tilt', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#9b2c26', material: 'aluminum', finish: 'matte', commons: 'Leica SL3', note: '极简硬朗的全画幅，红点与干净的前脸。' },
    { id: 'm11', brand: 'leica', name: 'M11', cat: 'retro', year: 2022, mount: 'M', w: 139, h: 80, d: 38.5, weight: 530, g: [0.06, 0.08, 0.1], corner: 0.1, top: 'flat', hump: 'none', evf: 'none', scr: 'fixed', dials: 2, color: '#b9b6ad', topColor: '#c3c0b6', accent: '#9b2c26', material: 'magnesium', finish: 'leathergrain', commons: 'Leica M11', note: '旁轴的比例：宽、扁、几乎无握柄。' },
    { id: 'q3', brand: 'leica', name: 'Q3', cat: 'compact', year: 2023, mount: 'FIXED', w: 130, h: 80.3, d: 92.6, weight: 743, g: [0.16, 0.14, 0.24], corner: 0.12, top: 'flat', hump: 'none', evf: 'small', scr: 'tilt', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#9b2c26', material: 'magnesium', finish: 'leathergrain', commons: 'Leica Q3', note: '固定 28mm 镜头，机身深度包含镜筒。' },
    { id: 'd-lux-8', brand: 'leica', name: 'D-Lux 8', cat: 'compact', year: 2024, mount: 'FIXED', w: 130, h: 69, d: 62, weight: 397, g: [0.14, 0.14, 0.2], corner: 0.12, top: 'flat', hump: 'none', evf: 'small', scr: 'fixed', dials: 2, color: '#1e2020', topColor: '#262828', accent: '#9b2c26', material: 'magnesium', finish: 'matte', commons: 'Leica D-Lux 8', note: '紧凑变焦卡片机，徕卡的极简比例。' },

    // ---- OM SYSTEM ----
    { id: 'om-1', brand: 'om', name: 'OM-1', cat: 'sports', year: 2022, mount: 'M43', w: 134.8, h: 91.6, d: 72.8, weight: 599, g: [0.66, 0.29, 0.7], corner: 0.26, top: 'arc', hump: 'low', evf: 'pro', scr: 'sideflip', dials: 2, color: '#202322', topColor: '#b9b5aa', accent: '#7c8d90', material: 'magnesium', finish: 'matte', commons: 'OM System OM-1', note: 'M43 速度机，银色顶盖与复古肩线。' },
    { id: 'om-5', brand: 'om', name: 'OM-5', cat: 'mirrorless', year: 2022, mount: 'M43', w: 125.3, h: 85.1, d: 55.5, weight: 418, g: [0.5, 0.25, 0.56], corner: 0.26, top: 'arc', hump: 'low', evf: 'small', scr: 'sideflip', dials: 2, color: '#202322', topColor: '#b9b5aa', accent: '#7c8d90', material: 'magnesium', finish: 'matte', commons: 'OM System OM-5', note: '轻量复古微单，比例紧凑。' },
    { id: 'om-3', brand: 'om', name: 'OM-3', cat: 'retro', year: 2025, mount: 'M43', w: 139.8, h: 90.1, d: 49.9, weight: 496, g: [0.24, 0.18, 0.34], corner: 0.18, top: 'flat', hump: 'none', evf: 'small', scr: 'sideflip', dials: 3, color: '#c9c5b9', topColor: '#cfcbbf', accent: '#7c8d90', material: 'magnesium', finish: 'leathergrain', commons: 'OM System OM-3', note: '复古平顶 + 金属拨盘，向 OM-1 胶片机致敬。' },
    { id: 'pen-e-p7', brand: 'om', name: 'PEN E-P7', cat: 'retro', year: 2021, mount: 'M43', w: 118.3, h: 68.5, d: 38.1, weight: 337, g: [0.1, 0.12, 0.16], corner: 0.18, top: 'flat', hump: 'none', evf: 'none', scr: 'tilt', dials: 2, color: '#c9c5b9', topColor: '#cfcbbf', accent: '#7c8d90', material: 'plastic', finish: 'leathergrain', commons: 'Olympus PEN E-P7', note: 'PEN 系列的方盒子比例。' },
    { id: 'tg-7', brand: 'om', name: 'Tough TG-7', cat: 'action', year: 2023, mount: 'FIXED', w: 113.9, h: 65.8, d: 32.7, weight: 249, g: [0.18, 0.2, 0.2], corner: 0.22, top: 'flat', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#242726', topColor: '#2c2f2e', accent: '#7c8d90', material: 'plastic', finish: 'rubberized', commons: 'OM System Tough TG-7', note: '防水三防卡片机，橡胶包覆。' },

    // ---- DJI ----
    { id: 'osmo-pocket-3', brand: 'dji', name: 'Osmo Pocket 3', cat: 'vlog', year: 2023, mount: 'FIXED', w: 139.7, h: 42.2, d: 33.5, weight: 179, g: [0.9, 0.8, 0.9], corner: 0.4, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#2a2d2e', topColor: '#333738', accent: '#9aa1a5', material: 'plastic', finish: 'anodized', gimbal: true, commons: 'DJI Osmo Pocket 3', note: '纵向握把 + 三轴云台 + 旋转屏。' },
    { id: 'osmo-action-5-pro', brand: 'dji', name: 'Osmo Action 5 Pro', cat: 'action', year: 2024, mount: 'FIXED', w: 70.5, h: 44.2, d: 32.8, weight: 146, g: [0, 0.06, 0.08], corner: 0.24, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#242829', topColor: '#2a2e2f', accent: '#9aa1a5', material: 'plastic', finish: 'rubberized', commons: 'DJI Osmo Action 5 Pro', note: '方形运动相机，前后双屏与磁吸快拆。' },
    { id: 'ronin-4d-8k', brand: 'dji', name: 'Ronin 4D 8K', cat: 'cinema', year: 2023, mount: 'DL', w: 235, h: 230, d: 180, weight: 4600, g: [0.7, 0.3, 0.7], corner: 0.2, top: 'cine', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#2a2d2e', topColor: '#333738', accent: '#9aa1a5', material: 'aluminum', finish: 'anodized', fan: true, commons: 'DJI Ronin 4D', note: '四轴云台 + 电影机的一体化形态。' },

    // ---- GoPro ----
    { id: 'hero13-black', brand: 'gopro', name: 'HERO13 Black', cat: 'action', year: 2024, mount: 'FIXED', w: 71.8, h: 50.8, d: 33.6, weight: 154, g: [0, 0.06, 0.08], corner: 0.22, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#242829', topColor: '#2a2e2f', accent: '#8c979a', material: 'plastic', finish: 'rubberized', commons: 'GoPro HERO13 Black', note: '小方盒 + 圆形镜头 + 折指式快拆。' },
    { id: 'hero11-mini', brand: 'gopro', name: 'HERO11 Black Mini', cat: 'action', year: 2022, mount: 'FIXED', w: 53, h: 42, d: 30, weight: 133, g: [0, 0.06, 0.08], corner: 0.24, top: 'flush', hump: 'none', evf: 'none', scr: 'none', dials: 1, color: '#242829', topColor: '#2a2e2f', accent: '#8c979a', material: 'plastic', finish: 'rubberized', commons: 'GoPro HERO11 Black Mini', note: '无屏极简版，体积更小。' },
    { id: 'max-2', brand: 'gopro', name: 'Max 2', cat: 'action', year: 2025, mount: 'FIXED', w: 64, h: 48, d: 30, weight: 150, g: [0, 0.06, 0.08], corner: 0.26, top: 'flush', hump: 'none', evf: 'none', scr: 'fixed', dials: 1, color: '#242829', topColor: '#2a2e2f', accent: '#8c979a', material: 'plastic', finish: 'rubberized', commons: 'GoPro Max', note: '全景运动相机，双鱼眼镜头。' }
  ];

  /* ---------------------------------------------------------
     4. Lens structural references
     --------------------------------------------------------- */
  const LENSES = [
    { id: 'rf-24-70', brand: 'canon', name: 'RF 24-70mm F2.8 L IS USM', mount: 'RF', type: 'zoom', focal: [24, 70], ap: 2.8, dia: 89.8, len: 125.7, weight: 900, style: 'black_pro', ring: '#2b2d2d', commons: 'Canon RF 24-70mm F2.8L IS USM' },
    { id: 'rf-50-12', brand: 'canon', name: 'RF 50mm F1.2 L USM', mount: 'RF', type: 'prime', focal: [50, 50], ap: 1.2, dia: 87.2, len: 108, weight: 950, style: 'black_pro', ring: '#b79143', commons: 'Canon RF 50mm F1.2L USM' },
    { id: 'rf-70-200', brand: 'canon', name: 'RF 70-200mm F2.8 L IS USM', mount: 'RF', type: 'tele', focal: [70, 200], ap: 2.8, dia: 89.9, len: 146, weight: 1070, style: 'white_tele', ring: '#2b2d2d', commons: 'Canon RF 70-200mm F2.8L IS USM' },
    { id: 'rf-100-500', brand: 'canon', name: 'RF 100-500mm F4.5-7.1 L', mount: 'RF', type: 'tele', focal: [100, 500], ap: 4.5, dia: 93.8, len: 207.6, weight: 1370, style: 'white_tele', ring: '#2b2d2d', commons: 'Canon RF 100-500mm' },
    { id: 'sony-24-70-gm2', brand: 'sony', name: 'FE 24-70mm F2.8 GM II', mount: 'E', type: 'zoom', focal: [24, 70], ap: 2.8, dia: 87.8, len: 119.9, weight: 695, style: 'black_pro', ring: '#2b2d2d', commons: 'Sony FE 24-70mm F2.8 GM II' },
    { id: 'sony-50-12-gm', brand: 'sony', name: 'FE 50mm F1.2 GM', mount: 'E', type: 'prime', focal: [50, 50], ap: 1.2, dia: 87, len: 108, weight: 778, style: 'black_pro', ring: '#b79143', commons: 'Sony FE 50mm F1.2 GM' },
    { id: 'sony-70-200-gm2', brand: 'sony', name: 'FE 70-200mm F2.8 GM II', mount: 'E', type: 'tele', focal: [70, 200], ap: 2.8, dia: 88, len: 200, weight: 1045, style: 'white_tele', ring: '#2b2d2d', commons: 'Sony FE 70-200mm F2.8 GM II' },
    { id: 'sony-16-35-gm2', brand: 'sony', name: 'FE 16-35mm F2.8 GM II', mount: 'E', type: 'zoom', focal: [16, 35], ap: 2.8, dia: 87.8, len: 111.5, weight: 547, style: 'black_pro', ring: '#2b2d2d', commons: 'Sony FE 16-35mm F2.8 GM II' },
    { id: 'nikon-24-70s', brand: 'nikon', name: 'NIKKOR Z 24-70mm f/2.8 S', mount: 'Z', type: 'zoom', focal: [24, 70], ap: 2.8, dia: 89, len: 126, weight: 805, style: 'black_pro', ring: '#2b2d2d', commons: 'Nikon Nikkor Z 24-70mm f/2.8 S' },
    { id: 'nikon-50-12s', brand: 'nikon', name: 'NIKKOR Z 50mm f/1.2 S', mount: 'Z', type: 'prime', focal: [50, 50], ap: 1.2, dia: 89.5, len: 150, weight: 1090, style: 'black_pro', ring: '#b79143', commons: 'Nikon Nikkor Z 50mm f/1.2 S' },
    { id: 'nikon-70-200s', brand: 'nikon', name: 'NIKKOR Z 70-200mm f/2.8 VR S', mount: 'Z', type: 'tele', focal: [70, 200], ap: 2.8, dia: 89.5, len: 220, weight: 1360, style: 'black_pro', ring: '#2b2d2d', commons: 'Nikon Nikkor Z 70-200mm f/2.8' },
    { id: 'fuji-16-55', brand: 'fujifilm', name: 'XF 16-55mm F2.8 R LM WR II', mount: 'X', type: 'zoom', focal: [16, 55], ap: 2.8, dia: 78.3, len: 106, weight: 410, style: 'black_pro', ring: '#a8803f', commons: 'Fujifilm XF 16-55mm F2.8' },
    { id: 'fuji-56-12', brand: 'fujifilm', name: 'XF 56mm F1.2 R WR', mount: 'X', type: 'prime', focal: [56, 56], ap: 1.2, dia: 79.4, len: 69.5, weight: 405, style: 'black_pro', ring: '#a8803f', commons: 'Fujifilm XF 56mm F1.2 R WR' },
    { id: 'fuji-150-600', brand: 'fujifilm', name: 'XF 150-600mm F5.6-8 R LM OIS WR', mount: 'X', type: 'tele', focal: [150, 600], ap: 5.6, dia: 99, len: 314.5, weight: 1605, style: 'white_tele', ring: '#a8803f', commons: 'Fujifilm XF 150-600mm' },
    { id: 'panasonic-24-70', brand: 'panasonic', name: 'LUMIX S PRO 24-70mm F2.8', mount: 'L', type: 'zoom', focal: [24, 70], ap: 2.8, dia: 90.9, len: 140, weight: 935, style: 'black_pro', ring: '#b8382f', commons: 'Panasonic Lumix S Pro 24-70mm F2.8' },
    { id: 'panasonic-70-200', brand: 'panasonic', name: 'LUMIX S PRO 70-200mm F2.8', mount: 'L', type: 'tele', focal: [70, 200], ap: 2.8, dia: 94, len: 209, weight: 1570, style: 'black_pro', ring: '#b8382f', commons: 'Panasonic Lumix S Pro 70-200mm F2.8' },
    { id: 'sigma-35-14', brand: 'sigma', name: '35mm F1.4 DG DN Art', mount: 'E', type: 'prime', focal: [35, 35], ap: 1.4, dia: 75.9, len: 111.5, weight: 645, style: 'black_pro', ring: '#9a9d9f', commons: 'Sigma 35mm F1.4 DG DN Art' },
    { id: 'sigma-24-70', brand: 'sigma', name: '24-70mm F2.8 DG DN II Art', mount: 'E', type: 'zoom', focal: [24, 70], ap: 2.8, dia: 87.8, len: 122.2, weight: 745, style: 'black_pro', ring: '#9a9d9f', commons: 'Sigma 24-70mm F2.8 DG DN II' },
    { id: 'tamron-28-75', brand: 'tamron', name: '28-75mm F/2.8 Di III VXD G2', mount: 'E', type: 'zoom', focal: [28, 75], ap: 2.8, dia: 75.8, len: 117.6, weight: 540, style: 'black_pro', ring: '#8c9aa1', commons: 'Tamron 28-75mm F2.8 Di III VXD G2' },
    { id: 'tamron-35-150', brand: 'tamron', name: '35-150mm F/2-2.8 Di III VXD', mount: 'E', type: 'tele', focal: [35, 150], ap: 2, dia: 89.2, len: 158, weight: 1165, style: 'black_pro', ring: '#8c9aa1', commons: 'Tamron 35-150mm F2-2.8' },
    { id: 'arri-sp-35', brand: 'arri', name: 'Signature Prime 35mm T1.8', mount: 'PL', type: 'cinema', focal: [35, 35], ap: 1.8, dia: 114, len: 152, weight: 2400, style: 'cine_black', ring: '#6f8b96', geo: true, commons: 'ARRI Signature Prime 35mm' },
    { id: 'arri-sp-50', brand: 'arri', name: 'Signature Prime 50mm T1.8', mount: 'PL', type: 'cinema', focal: [50, 50], ap: 1.8, dia: 114, len: 148, weight: 2300, style: 'cine_black', ring: '#6f8b96', geo: true, commons: 'ARRI Signature Prime 50mm' },
    { id: 'zeiss-supreme-50', brand: 'arri', name: 'Supreme Prime 50mm T1.5', mount: 'PL', type: 'cinema', focal: [50, 50], ap: 1.5, dia: 114, len: 148, weight: 1850, style: 'cine_black', ring: '#8b8f86', commons: 'Zeiss Supreme Prime 50mm' },
    { id: 'red-pro-35', brand: 'red', name: 'RED PRO Prime 35mm T1.8', mount: 'PL', type: 'cinema', focal: [35, 35], ap: 1.8, dia: 114, len: 145, weight: 1900, style: 'cine_black', ring: '#b23a30', commons: 'RED Pro Prime 35mm' }
  ];

  /* ---------------------------------------------------------
     5. Category → reference model ids (for new companies)
     --------------------------------------------------------- */
  const CATEGORY_SETS = {
    compact: ['rx100-vii', 'powershot-g7x-iii', 'a7c-ii', 'q3', 's9', 'fp'],
    mirrorless: ['a6700', 'x-t5', 'eos-r10', 'z50-ii', 's5-ii', 'eos-r7'],
    fullframe: ['a7-iv', 'eos-r6-ii', 'z6-iii', 's5-ii', 'sl3', 'a7-iii'],
    highres: ['eos-r5', 'z8', 'a7r-v', 'gfx100s-ii', 's1r-ii', 'd850'],
    sports: ['eos-r3', 'z9', 'a1-ii', 'om-1', 'eos-r7', 'a9-iii'],
    vlog: ['zv-e10-ii', 'x-m5', 'eos-r50', 'z30', 'g100', 'zv-1'],
    cinema: ['fx3', 'alexa-mini-lf', 'pocket-6k-pro', 'komodo-x', 'fx6', 'ursa-mini-pro-12k'],
    medium: ['gfx100-ii', 'gfx100s-ii', 'gfx50r', 'sl3', 'z8'],
    action: ['hero13-black', 'osmo-action-5-pro', 'tg-7', 'max-2'],
    retro: ['x100vi', 'x-pro3', 'm11', 'zf', 'om-3', 'x-t5']
  };

  const CATEGORY_LENSES = {
    mirrorless: ['sigma-35-14', 'sony-24-70-gm2', 'fuji-16-55', 'tamron-28-75'],
    fullframe: ['rf-24-70', 'sony-24-70-gm2', 'nikon-24-70s', 'panasonic-24-70'],
    highres: ['rf-50-12', 'sony-50-12-gm', 'nikon-50-12s', 'sigma-35-14'],
    sports: ['rf-100-500', 'sony-70-200-gm2', 'nikon-70-200s', 'fuji-150-600'],
    vlog: ['sony-16-35-gm2', 'sigma-35-14', 'fuji-16-55', 'tamron-28-75'],
    cinema: ['arri-sp-35', 'arri-sp-50', 'red-pro-35', 'zeiss-supreme-50'],
    medium: ['fuji-56-12', 'sigma-35-14', 'fuji-16-55'],
    compact: [],
    action: [],
    retro: ['fuji-56-12', 'sigma-35-14', 'sony-50-12-gm']
  };

  const MOUNT_LENS_DIAMETER = {
    E: 74, RF: 80, Z: 78, X: 70, L: 78, EF: 82, F: 76, M: 56, M43: 64, GFX: 96, K: 76, PL: 110, DL: 62, B4: 90, FIXED: 52
  };

  /* ---------------------------------------------------------
     6. Online retrieval configuration
     --------------------------------------------------------- */
  const ONLINE = {
    provider: 'Wikimedia Commons',
    api: 'https://commons.wikimedia.org/w/api.php',
    licenseNote: '参考图来自 Wikimedia Commons，遵循各自的 CC / 公有领域授权；仅缓存缩略图用于本机外形参考，不参与商用，也不会嵌入生成图。',
    thumbWidth: 640,
    ttlDays: 45,
    maxConcurrent: 2
  };

  window.FRAME_ART_DATA = {
    BRANDS, CATEGORY_GUIDE, MODELS, LENSES, CATEGORY_SETS, CATEGORY_LENSES,
    MOUNT_LENS_DIAMETER, ONLINE,
    modelById: id => MODELS.find(m => m.id === id) || null,
    brandById: id => BRANDS[id] || BRANDS.frame,
    modelsForBrand: brandId => MODELS.filter(m => m.brand === brandId),
    modelsForCategory: cat => MODELS.filter(m => m.cat === cat),
    lensById: id => LENSES.find(l => l.id === id) || null
  };
})();
