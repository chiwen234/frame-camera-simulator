/* =========================================================
   FRAME — 相机公司模拟器
   Data catalogue: 2026 camera industry sandbox
   All real brands / products are used for a private simulation.
   ========================================================= */
(function () {
  'use strict';

  const CATEGORY_ORDER = [
    'compact', 'mirrorless', 'fullframe', 'highres', 'sports',
    'vlog', 'cinema', 'medium', 'action', 'retro'
  ];

  const CATEGORIES = {
    compact: {
      id: 'compact', name: '入门卡片机', short: '卡片机', en: 'PREMIUM COMPACT', code: 'C',
      tagline: '口袋里的随身影像',
      description: '轻巧、直觉、随时拿出就能拍。传感器不大，但外形和体验往往决定一切。',
      basePrice: 5499, demand: 34000, tooling: 8500000, margin: 0.36,
      target: 'consumer', body: 'compact', sensor: 'one', mount: 'FIXED',
      sizeLabel: '小机身 · 低门槛 · 高颜值',
      seasonality: [1.05, 0.95, 1.0, 0.95, 1.0, 1.02, 1.04, 1.1, 1.0, 1.02, 1.16, 1.28],
      reviewWeights: { image: 0.15, focus: 0.1, stab: 0.05, video: 0.1, battery: 0.08, cooling: 0.04, design: 0.22, handling: 0.06, screen: 0.08, value: 0.12 },
      palette: ['#d9d6cc', '#b7a78f', '#3e4640']
    },
    mirrorless: {
      id: 'mirrorless', name: '中端微单', short: '中端微单', en: 'CORE MIRRORLESS', code: 'M',
      tagline: '公司销量的中坚',
      description: '竞争最激烈的价格带。必须在性能、便携、镜头生态和价格之间找到平衡。',
      basePrice: 8999, demand: 42000, tooling: 18000000, margin: 0.42,
      target: 'enthusiast', body: 'mirrorless', sensor: 'apsc', mount: 'E',
      sizeLabel: '主力价位 · 生态竞争 · 走量',
      seasonality: [1.0, 0.92, 1.02, 1.0, 1.04, 1.0, 1.02, 1.06, 1.08, 1.02, 1.18, 1.3],
      reviewWeights: { image: 0.17, focus: 0.15, stab: 0.07, video: 0.12, battery: 0.06, cooling: 0.04, design: 0.13, handling: 0.07, screen: 0.06, value: 0.13 },
      palette: ['#252728', '#7a7f7d', '#c6c2b6']
    },
    fullframe: {
      id: 'fullframe', name: '高端全画幅', short: '全画幅', en: 'FULL-FRAME FLAGSHIP', code: 'F',
      tagline: '品牌门面与利润中心',
      description: '全画幅是专业用户的主战场，每一项规格都会被放大审视，外形也要撑得起价格。',
      basePrice: 18999, demand: 18500, tooling: 31000000, margin: 0.45,
      target: 'professional', body: 'mirrorless', sensor: 'ff', mount: 'E',
      sizeLabel: '高溢价 · 全画幅 · 专业口碑',
      seasonality: [1.05, 0.94, 1.0, 1.02, 1.02, 0.98, 1.0, 1.03, 1.08, 1.1, 1.22, 1.3],
      reviewWeights: { image: 0.21, focus: 0.17, stab: 0.08, video: 0.13, battery: 0.05, cooling: 0.05, design: 0.1, handling: 0.07, screen: 0.04, value: 0.1 },
      palette: ['#17191a', '#3c4042', '#b9b5aa']
    },
    highres: {
      id: 'highres', name: '高像素商业机', short: '高像素', en: 'HIGH-RESOLUTION STUDIO', code: 'R',
      tagline: '细节、宽容度与棚拍工作流',
      description: '为商业、风光和档案摄影准备。高像素不是全部，散热、存储和镜头素质决定最终成像。',
      basePrice: 28999, demand: 5800, tooling: 38000000, margin: 0.47,
      target: 'professional', body: 'mirrorless', sensor: 'ff', mount: 'E',
      sizeLabel: '高像素 · 商业 · 静态画质',
      seasonality: [1.0, 0.95, 1.05, 1.08, 1.0, 0.96, 0.98, 1.0, 1.05, 1.06, 1.12, 1.16],
      reviewWeights: { image: 0.29, focus: 0.13, stab: 0.07, video: 0.08, battery: 0.05, cooling: 0.06, design: 0.08, handling: 0.06, screen: 0.04, value: 0.14 },
      palette: ['#222426', '#4f5456', '#d4cec1']
    },
    sports: {
      id: 'sports', name: '高速体育机', short: '体育机', en: 'SPORTS & WILDLIFE', code: 'S',
      tagline: '决定瞬间，从不等待',
      description: '对焦、连拍、可靠性和人体工学是全部。体育机不怕重，只怕错过。',
      basePrice: 39999, demand: 3100, tooling: 45000000, margin: 0.47,
      target: 'sports', body: 'mirrorless', sensor: 'ff', mount: 'E',
      sizeLabel: '速度 · 对焦 · 全天候',
      seasonality: [0.85, 0.82, 0.9, 1.0, 1.12, 1.18, 1.04, 1.0, 1.28, 1.16, 0.96, 0.9],
      reviewWeights: { image: 0.13, focus: 0.25, stab: 0.08, video: 0.1, battery: 0.08, cooling: 0.05, design: 0.06, handling: 0.14, screen: 0.03, value: 0.08 },
      palette: ['#141617', '#343b39', '#9c9f93']
    },
    vlog: {
      id: 'vlog', name: '视频博主相机', short: '视频机', en: 'CREATOR HYBRID', code: 'V',
      tagline: '为镜头前的生活而生',
      description: '翻转屏、轻量、收音和直出色彩优先。外形要能出现在画面里，也要愿意每天带出门。',
      basePrice: 7999, demand: 28000, tooling: 16000000, margin: 0.39,
      target: 'creator', body: 'mirrorless', sensor: 'apsc', mount: 'E',
      sizeLabel: '轻量 · 翻转屏 · 直出',
      seasonality: [1.08, 1.02, 1.06, 1.0, 1.02, 1.04, 1.06, 1.08, 1.04, 1.0, 1.1, 1.16],
      reviewWeights: { image: 0.12, focus: 0.16, stab: 0.08, video: 0.22, battery: 0.06, cooling: 0.04, design: 0.14, handling: 0.06, screen: 0.07, value: 0.05 },
      palette: ['#e3e0d7', '#c0b6a7', '#2f3033']
    },
    cinema: {
      id: 'cinema', name: '专业电影机', short: '电影机', en: 'DIGITAL CINEMA', code: 'D',
      tagline: '为银幕和片场制造',
      description: '高码率、模块化、可上笼、可肩扛。卖的是工作流，不是参数表。',
      basePrice: 45999, demand: 2900, tooling: 52000000, margin: 0.5,
      target: 'cinema', body: 'cinema', sensor: 'ff', mount: 'PL',
      sizeLabel: '高码率 · 模块化 · 片场',
      seasonality: [0.9, 0.88, 0.96, 1.06, 1.1, 1.12, 1.04, 1.0, 1.1, 1.08, 1.02, 0.96],
      reviewWeights: { image: 0.22, focus: 0.1, stab: 0.04, video: 0.31, battery: 0.04, cooling: 0.08, design: 0.05, handling: 0.08, screen: 0.02, value: 0.06 },
      palette: ['#111313', '#252929', '#676b65']
    },
    medium: {
      id: 'medium', name: '中画幅相机', short: '中画幅', en: 'MEDIUM FORMAT', code: 'G',
      tagline: '更大的底，更慢的世界',
      description: '极致的静态画质与仪式感。价格高、用户少，但一旦建立口碑就能形成品牌护城河。',
      basePrice: 69999, demand: 950, tooling: 49000000, margin: 0.5,
      target: 'professional', body: 'mirrorless', sensor: 'mf', mount: 'GFX',
      sizeLabel: '超大底 · 高售价 · 低产量',
      seasonality: [1.0, 0.92, 1.0, 1.06, 1.02, 0.96, 0.98, 1.0, 1.02, 1.08, 1.18, 1.24],
      reviewWeights: { image: 0.34, focus: 0.12, stab: 0.07, video: 0.08, battery: 0.04, cooling: 0.04, design: 0.1, handling: 0.06, screen: 0.03, value: 0.12 },
      palette: ['#161718', '#45443f', '#c9c2b3']
    },
    action: {
      id: 'action', name: '运动相机', short: '运动机', en: 'ACTION CAMERA', code: 'A',
      tagline: '极限环境里的可靠伙伴',
      description: '小巧、防抖、耐造，防水与续航往往比画质更能打动用户。外形要一眼识别。',
      basePrice: 3299, demand: 38000, tooling: 7500000, margin: 0.34,
      target: 'sports', body: 'action', sensor: 'one', mount: 'FIXED',
      sizeLabel: '小型 · 防抖 · 耐造',
      seasonality: [0.82, 0.8, 0.94, 1.02, 1.2, 1.32, 1.3, 1.16, 1.02, 0.94, 0.9, 0.9],
      reviewWeights: { image: 0.14, focus: 0.1, stab: 0.23, video: 0.2, battery: 0.1, cooling: 0.05, design: 0.08, handling: 0.04, screen: 0.02, value: 0.04 },
      palette: ['#1b1d1d', '#e0a12d', '#4d7c76']
    },
    retro: {
      id: 'retro', name: '复古旁轴相机', short: '旁轴', en: 'HERITAGE RANGEFINDER', code: 'H',
      tagline: '让拍照重新变成一种仪式',
      description: '金属、皮革、机械转盘与好看的直出。用户买的不只是工具，也是穿在身上的态度。',
      basePrice: 14999, demand: 6200, tooling: 21000000, margin: 0.46,
      target: 'enthusiast', body: 'rangefinder', sensor: 'ff', mount: 'M',
      sizeLabel: '复古 · 金属 · 审美溢价',
      seasonality: [1.12, 1.02, 1.06, 1.0, 1.0, 0.96, 0.94, 0.96, 1.02, 1.08, 1.22, 1.34],
      reviewWeights: { image: 0.16, focus: 0.08, stab: 0.04, video: 0.05, battery: 0.06, cooling: 0.03, design: 0.32, handling: 0.08, screen: 0.03, value: 0.15 },
      palette: ['#d4d0c5', '#202120', '#7b5a3e']
    }
  };

  const SEGMENTS = {
    consumer: {
      id: 'consumer', name: '大众消费者', en: 'EVERYDAY CONSUMER', short: '大众',
      desc: '想要一台好看、轻便、不用学习就能拍好的相机。价格敏感，社交平台风评影响很大。',
      wants: ['轻便好携带', '直出好看', '触控简单', '价格友好'],
      dislikes: ['复杂按键', '沉重', '专业术语'],
      prefs: { looks: 0.24, trend: 0.22, portability: 0.24, consumer: 0.18, business: 0.04, handling: 0.04, retro: 0.04 }
    },
    enthusiast: {
      id: 'enthusiast', name: '摄影爱好者', en: 'PHOTO ENTHUSIAST', short: '爱好者',
      desc: '会研究参数，也会抚摸机身。喜欢金属、机械转盘和复古审美，对操控有执念。',
      wants: ['金属质感', '机械拨盘', '好看的直出', '镜头玩法'],
      dislikes: ['塑料感', '过度简化', '手感差'],
      prefs: { retro: 0.24, looks: 0.22, pro: 0.18, handling: 0.16, portability: 0.08, business: 0.06, trend: 0.06 }
    },
    professional: {
      id: 'professional', name: '专业摄影师', en: 'WORKING PRO', short: '职业',
      desc: '把相机当生产工具。可靠性、握持、双卡、对焦和镜头群优先，外形必须专业克制。',
      wants: ['双卡备份', '专业握持', '可靠品控', '全画幅画质'],
      dislikes: ['花哨配色', '不可靠结构', '玩具感'],
      prefs: { pro: 0.28, handling: 0.25, business: 0.14, looks: 0.13, retro: 0.08, portability: 0.06, trend: 0.03, cinema: 0.03 }
    },
    creator: {
      id: 'creator', name: '视频博主', en: 'CONTENT CREATOR', short: '博主',
      desc: '每天自拍、口播、拍产品。翻转屏、轻量、对焦、收音与直出色彩比大底更重要。',
      wants: ['侧翻屏', '轻量', '视频对焦', '好看上镜'],
      dislikes: ['过热', '没有耳机孔', '太重'],
      prefs: { trend: 0.21, portability: 0.2, looks: 0.17, consumer: 0.14, handling: 0.12, cinema: 0.1, pro: 0.06 }
    },
    cinema: {
      id: 'cinema', name: '电影剧组', en: 'CINEMA PRODUCTION', short: '剧组',
      desc: '关心编码、宽容度、散热、接口和上机附件。外观越像工业设备，他们越安心。',
      wants: ['专业电影壳', '丰富接口', '笼式结构', '高码率编码'],
      dislikes: ['消费级造型', '接口贫乏', '无法肩扛'],
      prefs: { cinema: 0.36, pro: 0.24, handling: 0.16, looks: 0.1, business: 0.06, portability: 0.04, retro: 0.04 }
    },
    sports: {
      id: 'sports', name: '体育生态用户', en: 'SPORTS & OUTDOOR', short: '体育',
      desc: '奔跑、飞鸟、赛车、山海。要的是极端环境下的抓拍与可靠性，以及拿在手里的安全感。',
      wants: ['高速连拍', '强者对焦', '全天候', '专业握持'],
      dislikes: ['对焦犹豫', '续航短', '脆弱外壳'],
      prefs: { handling: 0.25, pro: 0.22, portability: 0.16, trend: 0.09, looks: 0.11, business: 0.09, retro: 0.04, consumer: 0.04 }
    }
  };

  const BODY_TYPES = {
    dslr: {
      id: 'dslr', name: '单反外形', en: 'DSLR', desc: '军舰部、深手柄、光学取景器比例。厚重且专业。',
      defaults: { silhouette: 'ergo', top: 'prism', front: 'big_grip', width: 150, height: 116, depth: 78, gripH: 62, gripD: 62, gripCurve: 62, roundness: 24 },
      mods: { pro: 12, business: 4, retro: 8, portability: -16, handling: 14, trend: -5, cinema: 2, consumer: -4, looks: 2 }
    },
    mirrorless: {
      id: 'mirrorless', name: '微单外形', en: 'MIRRORLESS', desc: '现代相机的主流比例，薄机身与突出的握柄之间取得平衡。',
      defaults: { silhouette: 'rounded', top: 'arc', front: 'big_grip', width: 136, height: 96, depth: 74, gripH: 52, gripD: 58, gripCurve: 58, roundness: 44 },
      mods: { pro: 8, business: 8, retro: 0, portability: 4, handling: 8, trend: 8, cinema: 0, consumer: 2, looks: 5 }
    },
    compact: {
      id: 'compact', name: '卡片机外形', en: 'COMPACT', desc: '平直、轻巧、几乎没有突出物。适合口袋和日常。',
      defaults: { silhouette: 'rounded', top: 'flat', front: 'straight', width: 108, height: 63, depth: 34, gripH: 10, gripD: 18, gripCurve: 28, roundness: 58 },
      mods: { pro: -8, business: 10, retro: 4, portability: 22, handling: -9, trend: 12, cinema: -10, consumer: 16, looks: 4 }
    },
    rangefinder: {
      id: 'rangefinder', name: '旁轴外形', en: 'RANGEFINDER', desc: '平顶、宽比例、镜头靠一侧。克制、优雅、带一点旧时代气息。',
      defaults: { silhouette: 'retroblock', top: 'flush', front: 'retro_face', width: 139, height: 81, depth: 44, gripH: 8, gripD: 16, gripCurve: 20, roundness: 16 },
      mods: { pro: 4, business: 12, retro: 24, portability: 10, handling: -4, trend: 6, cinema: -4, consumer: 2, looks: 10 }
    },
    retro: {
      id: 'retro', name: '复古相机外形', en: 'RETRO SLR', desc: '金属顶盖、皮革、机械转盘与硬朗方块。为审美和情怀买单。',
      defaults: { silhouette: 'retroblock', top: 'prism', front: 'retro_face', width: 146, height: 89, depth: 52, gripH: 30, gripD: 40, gripCurve: 38, roundness: 18 },
      mods: { pro: 5, business: 6, retro: 30, portability: 2, handling: 2, trend: 4, cinema: -4, consumer: 0, looks: 12 }
    },
    cinema: {
      id: 'cinema', name: '专业电影机外形', en: 'CINEMA RIG', desc: '大体积、模块化、散热结构、顶部提手。生来就要被装进片场。',
      defaults: { silhouette: 'angular', top: 'cine_shoulder', front: 'pro_face', width: 176, height: 148, depth: 102, gripH: 30, gripD: 45, gripCurve: 20, roundness: 12 },
      mods: { pro: 20, business: -2, retro: -8, portability: -26, handling: 12, trend: -4, cinema: 30, consumer: -16, looks: 4 }
    },
    gimbal: {
      id: 'gimbal', name: '手持云台外形', en: 'GIMBAL CAM', desc: '纵向握把、三轴云台与小型相机头。为边走边拍而生。',
      defaults: { silhouette: 'rounded', top: 'flush', front: 'round_port', width: 78, height: 132, depth: 40, gripH: 70, gripD: 38, gripCurve: 65, roundness: 64 },
      mods: { pro: -5, business: 2, retro: -4, portability: 20, handling: 8, trend: 24, cinema: 2, consumer: 18, looks: 8 }
    },
    action: {
      id: 'action', name: '运动相机外形', en: 'ACTION CAM', desc: '方寸之间、坚硬外壳、可更换电池与磁吸接口。视觉上要小得可靠。',
      defaults: { silhouette: 'angular', top: 'flush', front: 'straight', width: 70, height: 51, depth: 33, gripH: 0, gripD: 0, gripCurve: 0, roundness: 20 },
      mods: { pro: -4, business: 0, retro: -8, portability: 28, handling: -12, trend: 14, cinema: -2, consumer: 12, looks: 4 }
    }
  };

  const SILHOUETTES = {
    rect: { id: 'rect', name: '矩形机身', desc: '完整、克制、像一件工具。', corner: 0.12, mods: { pro: 5, business: 8, trend: -2, portability: 2, looks: 1 } },
    rounded: { id: 'rounded', name: '圆角机身', desc: '柔和、现代、容易融入日常。', corner: 0.34, mods: { trend: 6, consumer: 6, portability: 3, pro: -1, looks: 4 } },
    angular: { id: 'angular', name: '硬朗棱角', desc: '切面、折线与高密度感，适合专业和电影机。', corner: 0.04, mods: { pro: 9, cinema: 8, business: 4, consumer: -5, trend: 2, looks: 3 } },
    retroblock: { id: 'retroblock', name: '复古方块', desc: '平直、方正、像从1970年代走过来。', corner: 0.09, mods: { retro: 14, business: 5, handling: -2, trend: 1, pro: 2, looks: 4 } },
    ergo: { id: 'ergo', name: '人体工学握柄', desc: '握柄与机身一体成型，长时间拍摄更轻松。', corner: 0.24, mods: { handling: 13, pro: 7, portability: -3, business: 1, looks: 3 } },
    cage: { id: 'cage', name: '战斗笼机身', desc: '外露的金属笼架和扩展孔，片场气场拉满。', corner: 0.02, mods: { cinema: 18, pro: 11, portability: -15, business: -6, retro: -10, looks: 3 } },
    modular: { id: 'modular', name: '模块化机身', desc: '分件式结构、可拆侧板和扩展模块。', corner: 0.06, mods: { cinema: 12, pro: 10, business: 3, handling: 3, portability: -6, looks: 4 } }
  };

  const TOP_STYLES = {
    flat: { id: 'flat', name: '平顶', desc: '简洁平直的顶盖，取景器可省略或外置。', height: 0.03, mods: { business: 8, portability: 4, trend: 5, retro: -2, looks: 3 } },
    arc: { id: 'arc', name: '弧形顶盖', desc: '微拱的流线顶盖，现代而温和。', height: 0.05, mods: { trend: 5, business: 5, pro: 2, looks: 5 } },
    prism: { id: 'prism', name: '军舰部凸起', desc: '中央取景器凸起，经典的单反/专业符号。', height: 0.19, mods: { pro: 10, retro: 8, looks: 6, portability: -5, business: -1 } },
    shoulder: { id: 'shoulder', name: '带肩屏结构', desc: '顶盖一侧额外肩屏，专业操控的仪式感。', height: 0.09, mods: { pro: 12, business: 3, handling: 4, portability: -3, trend: -2, looks: 4 } },
    flush: { id: 'flush', name: '纯平面顶盖', desc: '像一块削出来的金属，极简而昂贵。', height: 0.01, mods: { business: 12, retro: 6, trend: 8, pro: -2, looks: 6 } },
    cine_shoulder: { id: 'cine_shoulder', name: '电影机肩扛结构', desc: '顶部提手、肩垫和供电轨，现场感十足。', height: 0.26, mods: { cinema: 22, pro: 10, portability: -14, consumer: -8, business: -4, looks: 3 } },
    modular: { id: 'modular', name: '模块化顶盖', desc: '分段式顶盖，可挂载手柄、图传和麦克风。', height: 0.1, mods: { cinema: 10, pro: 8, business: 3, trend: 3, portability: -4, looks: 3 } }
  };

  const FRONT_STYLES = {
    straight: { id: 'straight', name: '直板前脸', desc: '干净直接的正面，没有多余线条。', mods: { business: 7, portability: 4, handling: -2, looks: 2, trend: 3 } },
    big_grip: { id: 'big_grip', name: '大手柄前脸', desc: '突出的握柄侵占正面视觉，实用主义。', mods: { handling: 13, pro: 8, portability: -4, looks: 2, consumer: 2 } },
    layered: { id: 'layered', name: '双层前脸', desc: '前脸分层，带来机械拼装感。', mods: { pro: 5, cinema: 4, looks: 5, business: 3, retro: 2 } },
    round_port: { id: 'round_port', name: '圆形镜头舱口', desc: '以镜头为圆心的正面构图，像一颗镜头长出了身体。', mods: { trend: 7, consumer: 5, cinema: 5, looks: 6, business: -2 } },
    retro_face: { id: 'retro_face', name: '复古前脸', desc: '皮革包覆、对称布局，带一点旧时代优雅。', mods: { retro: 15, business: 4, consumer: 1, looks: 7, trend: -1 } },
    pro_face: { id: 'pro_face', name: '专业机前脸', desc: '大量功能结构与散热细节，像一件工业设备。', mods: { pro: 12, cinema: 8, looks: 2, portability: -3, consumer: -5 } }
  };

  const MATERIALS = {
    plastic: { id: 'plastic', name: '工程塑料', en: 'POLYCARBONATE', density: 1.24, cost: 0.55, premium: 0.18, thermal: 0.35, desc: '轻、便宜、好加工，质感取决于工艺。', hint: '成本低，但高端定价会被用户质疑。' },
    aluminum: { id: 'aluminum', name: '铝合金', en: 'ALUMINIUM', density: 2.7, cost: 1.18, premium: 0.64, thermal: 0.9, desc: '成熟的金属质感，兼顾重量与散热。', hint: '兼顾质感、重量与成本的全能材料。' },
    magnesium: { id: 'magnesium', name: '镁合金', en: 'MAGNESIUM ALLOY', density: 1.84, cost: 1.36, premium: 0.75, thermal: 0.82, desc: '专业相机的标准选择，轻且坚固。', hint: '专业感强，同时比铝更轻。' },
    titanium: { id: 'titanium', name: '钛合金', en: 'TITANIUM', density: 4.48, cost: 2.55, premium: 0.97, thermal: 0.7, desc: '昂贵、坚硬、耐蚀。限量版和旗舰的象征。', hint: '溢价能力极强，但会增加重量与成本。' },
    carbon: { id: 'carbon', name: '碳纤维', en: 'CARBON FIBRE', density: 1.58, cost: 2.15, premium: 0.86, thermal: 0.4, desc: '轻量与高科技感，纹理本身就是卖点。', hint: '轻但散热一般，视觉上很“未来”。' },
    brass: { id: 'brass', name: '黄铜', en: 'BRASS', density: 8.5, cost: 1.78, premium: 0.92, thermal: 0.75, desc: '沉重而有岁月感，常见于复古机型装饰。', hint: '非常适合复古，但会很重。' },
    leather: { id: 'leather', name: '皮革', en: 'LEATHER', density: 0.95, cost: 1.05, premium: 0.68, thermal: 0.2, desc: '温润、传统、手感高级。', hint: '复古与商务感强，防护与散热弱。' },
    rubber: { id: 'rubber', name: '橡胶', en: 'RUBBER', density: 1.15, cost: 0.72, premium: 0.32, thermal: 0.18, desc: '防滑、耐撞、户外友好。', hint: '握持和耐用，但容易显得廉价。' },
    skin: { id: 'skin', name: '仿皮蒙皮', en: 'SYNTHETIC LEATHERETTE', density: 1.08, cost: 0.82, premium: 0.5, thermal: 0.28, desc: '复古相机常用的包覆材料，触感柔和。', hint: '复古外观性价比之选。' }
  };

  const FINISHES = {
    matte: { id: 'matte', name: '磨砂', en: 'MATTE', cost: 0.82, gloss: 12, looks: 5, premium: 0.16, desc: '克制、耐指纹，专业设备最常见。', pattern: 'grain' },
    anodized: { id: 'anodized', name: '阳极氧化', en: 'ANODIZED', cost: 1.18, gloss: 30, looks: 7, premium: 0.26, desc: '金属本色与细腻反射，高级而冷静。', pattern: 'fine' },
    brushed: { id: 'brushed', name: '拉丝', en: 'BRUSHED', cost: 1.3, gloss: 42, looks: 7, premium: 0.3, desc: '方向性纹理，经典机械美学。', pattern: 'brushed' },
    enamel: { id: 'enamel', name: '烤漆', en: 'ENAMEL', cost: 1.06, gloss: 66, looks: 5, premium: 0.16, desc: '颜色饱满，像汽车或老式家电。', pattern: 'smooth' },
    plated: { id: 'plated', name: '电镀', en: 'PLATED', cost: 1.48, gloss: 82, looks: 4, premium: 0.22, desc: '强烈反光，适合限量或潮流表达。', pattern: 'metal' },
    powder: { id: 'powder', name: '喷塑', en: 'POWDER COAT', cost: 0.72, gloss: 18, looks: 3, premium: 0.05, desc: '便宜耐用的工业表面。', pattern: 'grain' },
    rubberized: { id: 'rubberized', name: '橡胶喷涂', en: 'SOFT TOUCH', cost: 0.92, gloss: 8, looks: 3, premium: 0.1, desc: '柔和防滑，长期使用需注意老化。', pattern: 'rubber' },
    leathergrain: { id: 'leathergrain', name: '仿皮纹理', en: 'LEATHER GRAIN', cost: 1.02, gloss: 15, looks: 6, premium: 0.2, desc: '视觉温润，复古机型的经典选项。', pattern: 'leather' }
  };

  const FRAME_TYPES = {
    plastic: { id: 'plastic', name: '塑料边框', cost: 0.8, strength: 0.4, premium: 0.1, desc: '轻，成本低，抗冲击一般。' },
    metal: { id: 'metal', name: '金属边框', cost: 1.35, strength: 1.0, premium: 0.38, desc: '坚固、精确，是高端机的默认选项。' },
    full_rubber: { id: 'full_rubber', name: '全包橡胶', cost: 1.12, strength: 1.1, premium: 0.16, desc: '户外与运动机的可靠感。' },
    partial_grip: { id: 'partial_grip', name: '局部防滑涂层', cost: 0.95, strength: 0.62, premium: 0.12, desc: '只在握柄与拇指区增加摩擦。' }
  };

  const TOP_PLATES = {
    metal: { id: 'metal', name: '金属顶盖', cost: 1.0, premium: 0.32, desc: '经典、可靠、有高级金属声。' },
    plastic: { id: 'plastic', name: '塑料顶盖', cost: 0.45, premium: 0.02, desc: '轻、便宜，容易产生塑料感。' },
    hybrid: { id: 'hybrid', name: '混合结构', cost: 0.76, premium: 0.18, desc: '金属骨架配复合材料顶盖，控制成本。' }
  };

  const COLORS = [
    { id: 'black', name: '曜石黑', hex: '#1b1d1e', neutral: true, brightness: 0.11 },
    { id: 'graphite', name: '石墨灰', hex: '#3a3d3e', neutral: true, brightness: 0.23 },
    { id: 'silver', name: '铬银', hex: '#b8b6ae', neutral: true, brightness: 0.69 },
    { id: 'white', name: '陶瓷白', hex: '#e4e0d6', neutral: true, brightness: 0.85 },
    { id: 'titanium', name: '钛灰', hex: '#8d8b80', neutral: true, brightness: 0.51 },
    { id: 'red', name: '信号红', hex: '#b7392d', neutral: false, brightness: 0.36 },
    { id: 'blue', name: '深海蓝', hex: '#2b4c71', neutral: false, brightness: 0.29 },
    { id: 'green', name: '复古绿', hex: '#52624a', neutral: false, brightness: 0.34 },
    { id: 'yellow', name: '胶片黄', hex: '#d5a734', neutral: false, brightness: 0.64 },
    { id: 'orange', name: '暮光橙', hex: '#c96a37', neutral: false, brightness: 0.46 },
    { id: 'purple', name: '暮色紫', hex: '#63506d', neutral: false, brightness: 0.34 },
    { id: 'brown', name: '烟草棕', hex: '#684c3b', neutral: false, brightness: 0.32 },
    { id: 'olive', name: '军绿', hex: '#555b45', neutral: false, brightness: 0.32 },
    { id: 'cream', name: '奶油米', hex: '#d9ceb9', neutral: false, brightness: 0.78 },
    { id: 'navy', name: '午夜蓝', hex: '#202c3a', neutral: false, brightness: 0.18 },
    { id: 'wine', name: '勃艮第红', hex: '#552a31', neutral: false, brightness: 0.24 }
  ];

  const CONTROL_POSITIONS = {
    top_right: { id: 'top_right', name: '顶部右侧', zone: 'top', x: 0.78, y: 0.03 },
    top_mid: { id: 'top_mid', name: '顶部中央', zone: 'top', x: 0.5, y: 0.03 },
    top_left: { id: 'top_left', name: '顶部左侧', zone: 'top', x: 0.23, y: 0.03 },
    back_upper_right: { id: 'back_upper_right', name: '背面右上', zone: 'back', x: 0.8, y: 0.2 },
    back_upper_left: { id: 'back_upper_left', name: '背面左上', zone: 'back', x: 0.2, y: 0.2 },
    back_lower_right: { id: 'back_lower_right', name: '背面右下', zone: 'back', x: 0.8, y: 0.82 },
    back_lower_left: { id: 'back_lower_left', name: '背面左下', zone: 'back', x: 0.2, y: 0.82 },
    side: { id: 'side', name: '机身侧面', zone: 'side', x: 0.95, y: 0.5 },
    grip: { id: 'grip', name: '握柄区', zone: 'grip', x: 0.84, y: 0.5 }
  };

  const CONTROLS = {
    shutter: { id: 'shutter', name: '快门键', en: 'SHUTTER', required: true, desc: '拍摄的第一触点。没有它就不像一台相机。' },
    record: { id: 'record', name: '录制键', en: 'REC', required: false, desc: '独立视频录制，是视频机的身份符号。' },
    play: { id: 'play', name: '播放键', en: 'PLAY', required: false, desc: '查看与回放，影响图片工作流。' },
    menu: { id: 'menu', name: '菜单键', en: 'MENU', required: true, desc: '进入系统设置，几乎是必需按键。' },
    fn: { id: 'fn', name: 'FN键', en: 'FUNCTION', required: false, desc: '用户自定义功能，提升专业操控。' },
    c1: { id: 'c1', name: 'C1快捷键', en: 'CUSTOM 1', required: false, desc: '可编程快捷操作。' },
    c2: { id: 'c2', name: 'C2快捷键', en: 'CUSTOM 2', required: false, desc: '可编程快捷操作。' },
    c3: { id: 'c3', name: 'C3快捷键', en: 'CUSTOM 3', required: false, desc: '可编程快捷操作。' }
  };

  const SCREEN_TYPES = {
    fixed: { id: 'fixed', name: '固定屏', en: 'FIXED', desc: '结构最可靠、最薄，但没有自拍和低角度。', cost: 0, mods: { business: 5, consumer: -5, trend: -5, pro: 2, portability: 2 } },
    sideflip: { id: 'sideflip', name: '侧翻屏', en: 'SIDE FLIP', desc: '视频博主最熟悉的结构，可自拍，侧面翻转。', cost: 160, mods: { trend: 10, consumer: 8, cinema: 1, business: -2, handling: 1 } },
    upflip: { id: 'upflip', name: '上翻屏', en: 'TILT UP', desc: '适合低角度和腰平取景，结构较轻。', cost: 110, mods: { trend: 5, consumer: 4, pro: 2, portability: 1 } },
    downflip: { id: 'downflip', name: '下翻屏', en: 'TILT DOWN', desc: '复古取景方式，适合腰平拍摄，但上脚架时受限。', cost: 105, mods: { retro: 8, business: 2, trend: 1 } },
    tilt: { id: 'tilt', name: '翻转屏', en: 'TILTING', desc: '上下翻折，兼顾高低角度，视频自拍弱。', cost: 95, mods: { pro: 4, business: 2, consumer: 1, trend: 2 } },
    fold: { id: 'fold', name: '折叠屏', en: 'FOLDING', desc: '双层折叠结构，最灵活也最复杂。', cost: 260, mods: { trend: 9, pro: 3, consumer: 5, portability: -2, looks: 2 } },
    none: { id: 'none', name: '无屏幕', en: 'NO SCREEN', desc: '只靠取景器或外接监视器，极端电影机做法。', cost: 0, mods: { cinema: 10, pro: 4, consumer: -24, trend: -15, business: -8, portability: -2 } }
  };

  const VIEWFINDER_TYPES = {
    none: { id: 'none', name: '无取景器', en: 'NO EVF', desc: '省成本、省空间，靠屏幕工作。', cost: 0, mods: { consumer: 5, business: 2, pro: -10, retro: -8, portability: 5 } },
    small: { id: 'small', name: '小型取景器', en: 'COMPACT EVF', desc: '小尺寸电子取景器，够用且不占空间。', cost: 260, mods: { pro: 3, business: 2, consumer: 1, looks: 2 } },
    pro: { id: 'pro', name: '专业取景器', en: 'PRO EVF', desc: '高分辨率大眼点，专业工作流必备。', cost: 980, mods: { pro: 13, cinema: 5, business: 3, portability: -2, looks: 3 } },
    eyelevel: { id: 'eyelevel', name: '眼平取景器', en: 'EYE-LEVEL', desc: '传统相机比例的中心取景器，复古且专业。', cost: 720, mods: { retro: 10, pro: 8, business: 4, looks: 3 } },
    folding: { id: 'folding', name: '折叠取景器', en: 'FOLDING EVF', desc: '腰平与眼平可切换，机械感极强。', cost: 860, mods: { retro: 13, pro: 7, looks: 5, portability: -2, trend: 2 } }
  };

  const VIEWFINDER_POSITIONS = {
    top_center: { id: 'top_center', name: '顶部中央', x: 0.5, y: 0.03 },
    top_left: { id: 'top_left', name: '顶部左侧', x: 0.3, y: 0.03 },
    top_right: { id: 'top_right', name: '顶部右侧', x: 0.7, y: 0.03 },
    side: { id: 'side', name: '侧置取景器', x: 0.15, y: 0.1 }
  };

  const MOUNTS = {
    FIXED: { id: 'FIXED', name: '固定镜头', en: 'FIXED LENS', maxFormat: 6, diameter: 0, flange: 0, desc: '镜头不可更换。紧凑、可靠，也把用户锁在生态内。', brand: '—' },
    RF: { id: 'RF', name: 'RF', en: 'CANON RF', maxFormat: 4, diameter: 54, flange: 20, desc: '大口径、短法兰距，佳能全画幅/APS-C 微单卡口。', brand: 'Canon' },
    Z: { id: 'Z', name: 'Z', en: 'NIKON Z', maxFormat: 4, diameter: 55, flange: 16, desc: '尼康全画幅与 APS-C 微单共用的宽卡口。', brand: 'Nikon' },
    E: { id: 'E', name: 'E', en: 'SONY E', maxFormat: 4, diameter: 46, flange: 18, desc: '开放程度最高的全画幅微单系统之一。', brand: 'Sony' },
    X: { id: 'X', name: 'X', en: 'FUJIFILM X', maxFormat: 3, diameter: 44, flange: 17.7, desc: 'APS-C 专用卡口，镜头群与色彩文化强。', brand: 'Fujifilm' },
    L: { id: 'L', name: 'L', en: 'L-MOUNT', maxFormat: 4, diameter: 51.6, flange: 20, desc: '由徕卡主导的开放全画幅联盟卡口。', brand: 'Leica / L²' },
    EF: { id: 'EF', name: 'EF', en: 'CANON EF', maxFormat: 4, diameter: 54, flange: 44, desc: '经典单反卡口，庞大存量镜头群。', brand: 'Canon' },
    F: { id: 'F', name: 'F', en: 'NIKON F', maxFormat: 4, diameter: 44, flange: 46.5, desc: '长寿的单反卡口，机械与自动镜头遗产丰厚。', brand: 'Nikon' },
    PL: { id: 'PL', name: 'PL', en: 'ARRI PL', maxFormat: 4, diameter: 54, flange: 52, desc: '电影工业标准卡口，坚固、精确、法兰距长。', brand: 'ARRI' },
    M43: { id: 'M43', name: 'M43', en: 'MICRO FOUR THIRDS', maxFormat: 2, diameter: 38, flange: 19.25, desc: '开放微型四三系统，以轻量和镜头群见长。', brand: 'OM / Panasonic' },
    GFX: { id: 'GFX', name: 'GFX', en: 'FUJIFILM G', maxFormat: 5, diameter: 65, flange: 26.7, desc: '中画幅卡口，巨大的像场和镜头体积。', brand: 'Fujifilm' },
    M: { id: 'M', name: 'M', en: 'LEICA M', maxFormat: 4, diameter: 44, flange: 27.8, desc: '旁轴的灵魂卡口，手动对焦与紧凑镜头。', brand: 'Leica' },
    K: { id: 'K', name: 'K', en: 'PENTAX K', maxFormat: 4, diameter: 47, flange: 45.46, desc: '单反时代的另一条支线，机械可靠。', brand: 'Pentax' },
    B4: { id: 'B4', name: 'B4', en: 'BROADCAST B4', maxFormat: 3, diameter: 48, flange: 48, desc: '广播级镜头接口，适合演播与纪录片。', brand: 'Broadcast' }
  };

  const RING_MATERIALS = {
    stainless: { id: 'stainless', name: '不锈钢', cost: 160, premium: 0.1, color: '#c4c0b6' },
    aluminum: { id: 'aluminum', name: '阳极铝', cost: 110, premium: 0.06, color: '#a9adb0' },
    brass: { id: 'brass', name: '黄铜', cost: 240, premium: 0.15, color: '#bd9558' },
    titanium: { id: 'titanium', name: '钛', cost: 360, premium: 0.2, color: '#8c8d88' },
    plastic: { id: 'plastic', name: '复合塑料', cost: 40, premium: 0, color: '#4a4d4b' }
  };

  const RING_COLORS = [
    { id: 'black', name: '黑色', hex: '#222425' },
    { id: 'silver', name: '银色', hex: '#b9b8b2' },
    { id: 'gold', name: '金色', hex: '#b79143' },
    { id: 'red', name: '红色', hex: '#a6352a' },
    { id: 'blue', name: '蓝色', hex: '#33597e' }
  ];

  const FRONT_DETAILS = {
    vents: { id: 'vents', name: '散热孔阵列', cost: 60, desc: '侧面/前部的散热开孔，专业感与散热。', mods: { cinema: 4, pro: 3, business: -1 } },
    knurl: { id: 'knurl', name: '滚花纹理', cost: 35, desc: '金属滚花装饰，提升机械触感。', mods: { retro: 5, pro: 2, looks: 2 } },
    nameplate: { id: 'nameplate', name: '金属铭牌', cost: 40, desc: '品牌与型号铭牌，奢侈品气质。', mods: { business: 5, retro: 4, looks: 3, pro: 2 } },
    redline: { id: 'redline', name: '红色饰线', cost: 18, desc: '一条红色细线，品牌的视觉签名。', mods: { trend: 4, pro: 3, looks: 2 } },
    goldring: { id: 'goldring', name: '金色环', cost: 32, desc: '镜头卡口或饰边的金色环，旗舰符号。', mods: { pro: 3, retro: 3, business: 2, looks: 2 } },
    bluering: { id: 'bluering', name: '蓝色环', cost: 28, desc: '冷调金属环，科技感更强。', mods: { trend: 4, pro: 1, looks: 2 } },
    cage: { id: 'cage', name: '笼式结构', cost: 350, weight: 260, desc: '外露笼架与多组 1/4 螺孔，片场改装基础。', mods: { cinema: 16, pro: 8, portability: -12, consumer: -8 } },
    handle: { id: 'handle', name: '顶部提手', cost: 210, weight: 160, desc: '顶部金属提手，低角度和肩扛移动方便。', mods: { cinema: 10, pro: 4, portability: -6 } },
    expansion: { id: 'expansion', name: '扩展孔位', cost: 85, desc: '侧板上的冷靴、螺孔与定位孔。', mods: { cinema: 5, pro: 5, business: 1 } },
    portstyling: { id: 'portstyling', name: '专业接口舱', cost: 130, desc: '带保护盖的接口模块，更像工业设备。', mods: { pro: 5, cinema: 5, business: 2 } }
  };

  const ACCESSORIES = {
    batteryGrip: { id: 'batteryGrip', name: '电池手柄', en: 'BATTERY GRIP', cost: 720, weight: 280, desc: '翻倍续航，竖拍操控，整机瞬间更专业。', mods: { handling: 13, pro: 10, portability: -12, business: 2, retro: 2 } },
    verticalGrip: { id: 'verticalGrip', name: '竖拍手柄', en: 'VERTICAL GRIP', cost: 460, weight: 185, desc: '更薄的竖拍结构，为婚礼和人像工作流准备。', mods: { handling: 9, pro: 6, portability: -7 } },
    mic: { id: 'mic', name: '外接麦克风', en: 'SHOTGUN MIC', cost: 680, weight: 105, desc: '顶部机头麦，视频创作的一体化感。', mods: { cinema: 6, consumer: 3, trend: 3, portability: -3 } },
    monitor: { id: 'monitor', name: '外接监视器', en: 'FIELD MONITOR', cost: 1580, weight: 240, desc: '高亮监视器，片场取景和监看必备。', mods: { cinema: 13, pro: 5, consumer: -3, portability: -8 } },
    fan: { id: 'fan', name: '散热风扇模块', en: 'COOLING MODULE', cost: 320, weight: 110, desc: '主动散热，降低高规格视频的过热风险。', mods: { cinema: 6, pro: 5, portability: -4, business: -1 } },
    cage: { id: 'cage', name: '电影机笼', en: 'CAMERA CAGE', cost: 780, weight: 340, desc: '全包笼架、提手与扩展位，完整片场形态。', mods: { cinema: 20, pro: 9, portability: -17, consumer: -10, business: -4 } },
    shoulder: { id: 'shoulder', name: '肩扛支架', en: 'SHOULDER RIG', cost: 950, weight: 520, desc: '肩垫、导轨与配重，真正可以扛起来拍。', mods: { cinema: 19, pro: 11, portability: -22, consumer: -8, handling: 4 } },
    wireless: { id: 'wireless', name: '无线图传模块', en: 'WIRELESS VIDEO', cost: 860, weight: 150, desc: '导演监视器与跟焦器所需的图传发射端。', mods: { cinema: 12, pro: 8, business: 2, portability: -6 } },
    flash: { id: 'flash', name: '闪光灯模块', en: 'SPEEDLIGHT', cost: 540, weight: 220, desc: '热靴闪光灯，商业与婚礼摄影的效率工具。', mods: { pro: 5, consumer: 2, business: 2, portability: -4, retro: 4 } }
  };

  const SENSOR_FORMATS = {
    one: { id: 'one', name: '1英寸', en: '1-INCH', index: 1, crop: 2.7, baseCost: 280, refMP: 20, minMP: 8, maxMPBase: 12, maxMPPerLevel: 4, weight: 32, areaLabel: '小底 · 便携 · 消费级', desc: '卡片机、Vlog 机和运动相机的常见尺寸。' },
    m43: { id: 'm43', name: 'M43', en: 'MICRO FOUR THIRDS', index: 2, crop: 2.0, baseCost: 720, refMP: 20, minMP: 12, maxMPBase: 16, maxMPPerLevel: 4, weight: 52, areaLabel: '轻快 · 防抖 · 长焦优势', desc: '系统轻巧、镜头群丰富，适合旅行、生态与视频。' },
    apsc: { id: 'apsc', name: 'APS-C', en: 'APS-C', index: 3, crop: 1.5, baseCost: 1180, refMP: 26, minMP: 16, maxMPBase: 20, maxMPPerLevel: 6, weight: 76, areaLabel: '甜点画幅 · 主流价位', desc: '画质、体积与成本的平衡点，也是走量的主流画幅。' },
    ff: { id: 'ff', name: '全画幅', en: 'FULL FRAME', index: 4, crop: 1.0, baseCost: 3650, refMP: 45, minMP: 20, maxMPBase: 24, maxMPPerLevel: 18, weight: 118, areaLabel: '专业主流 · 高画质', desc: '专业市场的基准画幅，动态范围、虚化与镜头群成熟。' },
    mf: { id: 'mf', name: '中画幅', en: 'MEDIUM FORMAT', index: 5, crop: 0.79, baseCost: 18500, refMP: 100, minMP: 45, maxMPBase: 60, maxMPPerLevel: 34, weight: 320, areaLabel: '极致静态 · 仪式感', desc: '更大的像场与宽容度，适合商业、风光和高端人像。' },
    lf: { id: 'lf', name: '大画幅', en: 'LARGE FORMAT', index: 6, crop: 0.65, baseCost: 52000, refMP: 150, minMP: 80, maxMPBase: 100, maxMPPerLevel: 60, weight: 620, areaLabel: '超大像场 · 旗舰实验', desc: '面向顶级电影与商业制作，成本与体积都极为夸张。' }
  };

  const SENSOR_TYPES = {
    cmos: { id: 'cmos', name: 'CMOS', en: 'STANDARD CMOS', tech: 1, cost: 0.82, quality: 0, dr: 0, desc: '成熟、便宜，动态范围一般。' },
    bsi: { id: 'bsi', name: '背照式', en: 'BSI CMOS', tech: 2, cost: 1.15, quality: 5, dr: 0.6, desc: '更高效的进光，暗光画质更好。' },
    stacked: { id: 'stacked', name: '堆栈式', en: 'STACKED CMOS', tech: 3, cost: 1.62, quality: 9, dr: 0.9, desc: '高速读取，减少果冻效应，是速度机基础。' },
    global: { id: 'global', name: '全局快门', en: 'GLOBAL SHUTTER', tech: 4, cost: 2.35, quality: 7, dr: 0.25, desc: '无果冻效应，闪光同步无限制，但成本与发热更高。' }
  };

  const SHUTTERS = {
    mechanical: { id: 'mechanical', name: '机械快门', cost: 160, desc: '可靠的物理快门，闪光同步更好。', mods: { pro: 4, retro: 3 } },
    efc: { id: 'efc', name: '电子前帘', cost: 120, desc: '减少机震，同时保留机械后帘。', mods: { pro: 2, trend: 1 } },
    electronic: { id: 'electronic', name: '电子快门', cost: 45, desc: '安静、高速、无机械损耗，但可能有果冻效应。', mods: { cinema: 3, tech: 2, retro: -2 } }
  };

  const AF_SYSTEMS = {
    contrast: { id: 'contrast', name: '反差对焦', tech: 1, bonus: 0, cost: 90, desc: '静态精准、成本低，追焦一般。' },
    phase: { id: 'phase', name: '相位对焦', tech: 2, bonus: 8, cost: 230, desc: '速度快，适合动态拍摄。' },
    fullpixel: { id: 'fullpixel', name: '全像素对焦', tech: 3, bonus: 15, cost: 420, desc: '覆盖全画面，暗光与追焦更强。' },
    ai: { id: 'ai', name: 'AI 主体识别对焦', tech: 4, bonus: 23, cost: 680, desc: '识别人眼、动物、车辆和鸟，现代专业机的标配。' }
  };

  const STABILIZATIONS = {
    none: { id: 'none', name: '无防抖', tech: 1, cost: 0, stops: 0, desc: '完全依赖手持技巧和镜头防抖。' },
    three: { id: 'three', name: '三轴防抖', tech: 2, cost: 260, stops: 3, desc: '基础机身防抖，适合拍照和轻量视频。' },
    five: { id: 'five', name: '五轴防抖', tech: 3, cost: 560, stops: 6.5, desc: '主流高端防抖，弱光和手持视频提升明显。' },
    advanced: { id: 'advanced', name: '五轴增强防抖', tech: 4, cost: 820, stops: 8.5, desc: '配合算法与云台思维的高级防抖。' }
  };

  const STORAGE_FORMATS = {
    raw: { id: 'raw', name: 'RAW', cost: 0, mods: { pro: 3 } },
    jpeg: { id: 'jpeg', name: 'JPEG', cost: 0, mods: { consumer: 2 } },
    heif: { id: 'heif', name: 'HEIF', cost: 18, mods: { trend: 2, business: 1 } },
    prores: { id: 'prores', name: 'ProRes 照片', cost: 45, mods: { pro: 2, cinema: 2 } }
  };

  const CARD_TYPES = {
    sd: { id: 'sd', name: 'SD UHS-II', cost: 10, capacity: 1, desc: '通用、便宜，速度上限一般。' },
    cfe_b: { id: 'cfe_b', name: 'CFexpress Type B', cost: 110, capacity: 1, desc: '高速、大容量，是 8K 和高像素机标配。' },
    cfe_a: { id: 'cfe_a', name: 'CFexpress Type A', cost: 140, capacity: 1, desc: '小巧高速，适合紧凑的高端机身。' },
    cfast: { id: 'cfast', name: 'CFast 2.0', cost: 80, capacity: 1, desc: '老牌电影机存储，速度稳定。' },
    ssd: { id: 'ssd', name: '内置 SSD', cost: 450, capacity: 2, desc: '高码率电影机的片场效率方案。' }
  };

  const VIDEO_RES = {
    '1080p': { id: '1080p', name: '1080p', en: 'FHD', level: 0, cost: 0, score: 38, label: '全高清' },
    '4K': { id: '4K', name: '4K', en: 'UHD 4K', level: 1, cost: 230, score: 55, label: '4K UHD' },
    '6K': { id: '6K', name: '6K', en: '6K', level: 2, cost: 580, score: 69, label: '6K' },
    '8K': { id: '8K', name: '8K', en: '8K', level: 3, cost: 1280, score: 83, label: '8K' },
    '12K': { id: '12K', name: '12K', en: '12K', level: 5, cost: 3600, score: 96, label: '12K' }
  };

  const FPS_OPTIONS = [24, 25, 30, 50, 60, 100, 120, 180, 240];

  const CODECS = {
    h264: { id: 'h264', name: 'H.264', tech: 1, cost: 0, thermal: 0.5, quality: 0.45, bitrateMax: 600 },
    h265: { id: 'h265', name: 'H.265', tech: 2, cost: 120, thermal: 0.65, quality: 0.62, bitrateMax: 1200 },
    prores: { id: 'prores', name: 'ProRes', tech: 3, cost: 320, thermal: 0.9, quality: 0.8, bitrateMax: 3000 },
    dnxhr: { id: 'dnxhr', name: 'DNxHR', tech: 3, cost: 280, thermal: 0.86, quality: 0.78, bitrateMax: 2800 },
    braw: { id: 'braw', name: 'BRAW', tech: 4, cost: 460, thermal: 1.0, quality: 0.92, bitrateMax: 4400 },
    raw: { id: 'raw', name: 'RAW', tech: 4, cost: 560, thermal: 1.15, quality: 0.97, bitrateMax: 6000 }
  };

  const SCREEN_RES = {
    '720p': { id: '720p', name: '720p', cost: 25, score: 25 },
    '1080p': { id: '1080p', name: '1080p', cost: 90, score: 48 },
    '1440p': { id: '1440p', name: '1440p', cost: 180, score: 67 },
    '4k': { id: '4k', name: '4K', cost: 420, score: 88 }
  };

  const GAMUTS = {
    srgb: { id: 'srgb', name: 'sRGB', cost: 0, score: 0 },
    p3: { id: 'p3', name: 'DCI-P3', cost: 65, score: 4 },
    adobe: { id: 'adobe', name: 'Adobe RGB', cost: 95, score: 5 }
  };

  const PORTS = {
    hdmi: { id: 'hdmi', name: 'HDMI', cost: 35, mods: { pro: 3, cinema: 3 } },
    sdi: { id: 'sdi', name: 'SDI', cost: 210, mods: { cinema: 10, pro: 5 } },
    usbc: { id: 'usbc', name: 'USB-C', cost: 28, mods: { consumer: 4, pro: 2 } },
    mic: { id: 'mic', name: '麦克风接口', cost: 32, mods: { creator: 8, cinema: 3 } },
    headphone: { id: 'headphone', name: '耳机接口', cost: 38, mods: { creator: 7, cinema: 5 } },
    ethernet: { id: 'ethernet', name: '网口', cost: 120, mods: { cinema: 8, pro: 6 } },
    dc: { id: 'dc', name: 'DC 电源', cost: 45, mods: { cinema: 6, pro: 3 } },
    sync: { id: 'sync', name: '同步锁相', cost: 160, mods: { cinema: 12, pro: 4 } },
    xlr: { id: 'xlr', name: 'XLR 音频', cost: 260, mods: { cinema: 11, pro: 5 } }
  };

  const WIRELESS = {
    wifi: { id: 'wifi', name: 'Wi-Fi', cost: 52, mods: { consumer: 4, creator: 5, pro: 2 } },
    bluetooth: { id: 'bluetooth', name: '蓝牙', cost: 18, mods: { consumer: 2, trend: 3 } },
    '5g': { id: '5g', name: '5G 模块', cost: 390, mods: { trend: 4, business: 3, pro: 1 } },
    tx: { id: 'tx', name: '无线图传', cost: 460, mods: { cinema: 9, pro: 4 } }
  };

  const QC_TIERS = {
    standard: { id: 'standard', name: '标准品控', desc: '按行业标准抽检，成本最低。', perUnit: 0, defectMul: 1.0, rep: 0 },
    enhanced: { id: 'enhanced', name: '加严品控', desc: '提高抽检比例并增加老化测试。', perUnit: 90, defectMul: 0.72, rep: 1.5 },
    extreme: { id: 'extreme', name: '出厂全检', desc: '逐台校准与测试，成本高但口碑稳。', perUnit: 240, defectMul: 0.42, rep: 3.2 }
  };

  const CERTIFICATIONS = {
    standard: { id: 'standard', name: '标准认证', en: 'CE / FCC', cost: 900000, awareness: 0, desc: '覆盖欧盟与北美主要市场，按常规周期送审。' },
    global: { id: 'global', name: '全球认证', en: 'GLOBAL 28', cost: 2200000, awareness: 0.5, desc: '同步覆盖日韩、澳新与东南亚等 28 个市场。' },
    expedited: { id: 'expedited', name: '加急认证', en: 'EXPRESS', cost: 3600000, awareness: 0.2, desc: '多国实验室并行送审，适合卡发布窗口的旗舰产品。' }
  };

  const CAMPAIGN_TIERS = {
    none: { id: 'none', name: '静默上市', desc: '只在官网和渠道上架。', cost: 0, hype: 0, awareness: 0 },
    social: { id: 'social', name: '社交种草', desc: '小规模 KOL 与媒体评测机。', cost: 1500000, hype: 16, awareness: 1.2 },
    creator: { id: 'creator', name: '创作者计划', desc: '视频博主与摄影师深度体验。', cost: 4500000, hype: 30, awareness: 2.4 },
    launch: { id: 'launch', name: '全球发布会', desc: '一场具有话题性的线上/线下发布。', cost: 12000000, hype: 52, awareness: 4.5 },
    spectacle: { id: 'spectacle', name: '影像文化事件', desc: '城市装置、摄影展与全球媒体联动。', cost: 30000000, hype: 82, awareness: 8.0 }
  };

  const BRAND_CAMPAIGNS = {
    social: {
      id: 'social', name: '社交内容种草', en: 'SOCIAL SEEDING', cost: 2000000, cooldown: 2,
      awareness: 2.1, reputation: 0, desc: '与生活方式博主合作，扩大年轻用户触达。', tag: '曝光'
    },
    creator: {
      id: 'creator', name: '创作者扶持计划', en: 'CREATOR PROGRAM', cost: 6000000, cooldown: 3,
      awareness: 2.8, reputation: 1.5, desc: '长期支持视频创作者，建立真实作品口碑。', tag: '内容'
    },
    sports: {
      id: 'sports', name: '体育赛事赞助', en: 'SPORTS SPONSORSHIP', cost: 22000000, cooldown: 4,
      awareness: 5.6, reputation: 1.2, desc: '出现在赛场边，强化速度、可靠与专业形象。', tag: '赛事'
    },
    heritage: {
      id: 'heritage', name: '影像文化展', en: 'PHOTOGRAPHY EXHIBITION', cost: 9000000, cooldown: 4,
      awareness: 2.4, reputation: 3.2, desc: '用摄影展与大师合作讲述品牌历史，提升审美认同。', tag: '品牌'
    },
    pr: {
      id: 'pr', name: '口碑修复行动', en: 'REPUTATION REPAIR', cost: 4500000, cooldown: 2,
      awareness: 0.4, reputation: 3.8, desc: '延长保修、公开测试与真诚沟通，修复用户信任。', tag: '服务'
    }
  };

  const SENSOR_SUPPLIERS = {
    sony_semi: { id: 'sony_semi', name: '索尼半导体', en: 'SONY SEMICONDUCTOR', cost: 1.0, quality: 1.05, tech: 5, lead: 3, desc: '行业标杆，供应紧俏，谈判空间小。' },
    samsung: { id: 'samsung', name: '三星 ISOCELL', en: 'SAMSUNG ISOCELL', cost: 0.92, quality: 0.99, tech: 4, lead: 2.5, desc: '高像素与高速方案成熟，价格更有弹性。' },
    canon_semi: { id: 'canon_semi', name: '佳能半导体', en: 'CANON SEMICONDUCTOR', cost: 0.98, quality: 1.04, tech: 5, lead: 3, desc: '自产体系稳定，特殊规格合作空间有限。' },
    tower: { id: 'tower', name: 'Tower Semiconductor', en: 'TOWER', cost: 0.82, quality: 0.95, tech: 3, lead: 2, desc: '成熟制程与定制传感器，性价比路线。' },
    onsemi: { id: 'onsemi', name: 'onsemi', en: 'ONSEMI', cost: 0.74, quality: 0.92, tech: 2, lead: 1.5, desc: '低成本方案，适合入门和运动相机。' },
    inhouse: { id: 'inhouse', name: '自研传感器', en: 'IN-HOUSE SENSOR', cost: 0.7, quality: 1.08, tech: 5, lead: 4, minSensorTech: 4, desc: '掌握核心规格与成本，但前期投入极高。', unlock: '传感器技术 Lv.4', fee: 12000000 }
  };

  // =========================================================
  // Chip lab: in-house CMOS sensors and AF chips
  // =========================================================
  const CHIP_LAB_LEVELS = [
    { level: 0, name: '合作流片', en: 'PARTNER FAB', upgradeCost: 12000000, upkeep: 0, slots: 1, quality: -2, desc: '借用代工厂的成熟制程，只能做一个 modest 的自研项目。' },
    { level: 1, name: '联合实验室', en: 'JOINT LAB', upgradeCost: 36000000, upkeep: 900000, slots: 1, quality: 0, desc: '与晶圆厂建立联合团队，规格与良率开始可控。' },
    { level: 2, name: '自研芯片中心', en: 'CHIP CENTER', upgradeCost: 88000000, upkeep: 2400000, slots: 2, quality: 2, desc: '自有设计、验证与封测团队，可以并行开发两颗芯片。' },
    { level: 3, name: '先进影像研究院', en: 'ADVANCED LAB', upgradeCost: null, upkeep: 4800000, slots: 2, quality: 4, desc: '先进制程与自研 IP，站在传感器技术的最前沿。' }
  ];

  const CMOS_TARGETS = {
    apsc: { id: 'apsc', name: 'APS-C', format: 'apsc', mpOptions: [26, 33], baseCost: 26000000, months: 6, tech: 3, desc: '主流走量画幅，适合作为第一颗自研传感器。' },
    ff: { id: 'ff', name: '全画幅', format: 'ff', mpOptions: [33, 45, 61], baseCost: 62000000, months: 9, tech: 4, desc: '高端产品线的核心，投入高但回报也最大。' },
    mf: { id: 'mf', name: '中画幅', format: 'mf', mpOptions: [100, 150], baseCost: 145000000, months: 13, tech: 5, desc: '超大像场，只有顶级技术积累才值得挑战。' }
  };

  const CMOS_BUDGETS = {
    lean: { id: 'lean', name: '精益预算', costMult: 0.62, quality: -3, defect: 1.18, monthsMult: 0.85, risk: '高', desc: '控制投入，规格与良率会打折扣。' },
    balanced: { id: 'balanced', name: '均衡投入', costMult: 1, quality: 0, defect: 1, monthsMult: 1, risk: '中', desc: '按计划推进，质量与成本平衡。' },
    aggressive: { id: 'aggressive', name: '不计成本', costMult: 1.5, quality: 4, defect: 0.86, monthsMult: 1.2, risk: '低', desc: '用更高预算换取更好的规格与良率。' }
  };

  const AF_ARCHITECTURES = {
    phase: { id: 'phase', name: '相位检测 AF 芯片', en: 'PDAF ASIC', tech: 2, baseCost: 9000000, months: 7, costDelta: -60, desc: '成熟方案，成本低，适合主流机型。' },
    fullpixel: { id: 'fullpixel', name: '全像素 AF 芯片', en: 'DUAL PIXEL ASIC', tech: 3, baseCost: 18000000, months: 10, costDelta: -120, desc: '覆盖更大的对焦区域，追焦与暗光更好。' },
    ai: { id: 'ai', name: 'AI 追焦芯片', en: 'AI TRACKING ASIC', tech: 4, baseCost: 34000000, months: 13, costDelta: -200, desc: '独立 NPU 与主体识别，旗舰对焦的核心。' }
  };

  const AF_TIERS = {
    standard: { id: 'standard', name: '标准版', costMult: 0.78, monthsMult: 0.9, desc: '基础规格，满足主流产品。' },
    advanced: { id: 'advanced', name: '进阶版', costMult: 1, monthsMult: 1, desc: '覆盖更多对焦点与追焦场景。' },
    flagship: { id: 'flagship', name: '旗舰版', costMult: 1.45, monthsMult: 1.2, desc: '为速度机与专业视频准备的最强规格。' }
  };

  const CHIP_BUDGETS = CMOS_BUDGETS;

  /* ---------------------------------------------------------
  AF chips: every AI brand ships a named sensor and a named AF
  chip. Focus speed is now six measurable numbers, not one bonus.
  --------------------------------------------------------- */
  const AF_COVERAGE = {
    center: { id: 'center', name: '中央区', mult: 0.17 },
    wide: { id: 'wide', name: '宽区域', mult: 0.26 },
    zone: { id: 'zone', name: '分区', mult: 0.34 },
    near: { id: 'near', name: '近全域', mult: 0.46 },
    full: { id: 'full', name: '全域', mult: 0.55 }
  };

  const AF_ARCH_TEMPLATE = {
    phase: { ptPoints: 54, ptCoverage: 0.32, trackBase: 1.55, pvBoost: 0.06, lowLightBase: -1.8, ampCost: 58, ampW: 34 },
    fullpixel: { ptPoints: 118, ptCoverage: 0.46, trackBase: 1.9, pvBoost: 0.12, lowLightBase: -3.1, ampCost: 92, ampW: 52 },
    ai: { ptPoints: 186, ptCoverage: 0.55, trackBase: 2.2, pvBoost: 0.16, lowLightBase: -4.3, ampCost: 145, ampW: 76 }
  };

  const AF_CHIPS = {
    canon: { name: 'Dual Pixel AF + DIGIC Accelerator', en: 'DUAL PIXEL AF', arch: 'fullpixel', coverage: 'full', pt: 62, ev: -6.5, evLight: -4.0, track: 2.35, contrast: 1.25, eye: 0.86, subjects: ['人眼', '面部', '动物', '车辆'], amp: 86, cost: 340, year: 2017, desc: '佳能招牌全像素双核。背屏实时取景和视频追焦一直是它最稳的一块。' },
    sony: { name: 'AI Processing Unit + BIONZ XR', en: 'REAL-TIME RECOGNITION', arch: 'ai', coverage: 'full', pt: 105, ev: -7.5, evLight: -4.5, track: 2.75, contrast: 0.8, eye: 0.95, subjects: ['人眼', '动物', '鸟', '车辆', '飞机'], amp: 92, cost: 420, year: 2022, desc: '独立 AI 处理单元做主体识别，对焦锁定最快、暗光最狠。' },
    nikon: { name: '多头相位检测 + 智能追踪', en: 'MULTI-CAM AF', arch: 'fullpixel', coverage: 'near', pt: 78, ev: -6.5, evLight: -4.5, track: 2.2, contrast: 0.95, eye: 0.9, subjects: ['人眼', '动物', '鸟', '车辆'], amp: 74, cost: 310, year: 2023, desc: '273 点宽区域，单次对焦极快，低光锁定和 Z9 时代的追踪都排在第一梯队。' },
    fujifilm: { name: 'X-Processor 深度学习 AF', en: 'DEEP-LEARNING AF', arch: 'ai', coverage: 'zone', pt: 36, ev: -6.0, evLight: -3.5, track: 2.1, contrast: 1.15, eye: 0.82, subjects: ['人眼', '面部', '动物'], amp: 58, cost: 300, year: 2023, desc: '深度学习识别算法很强，但相位点只集中在分区，全域追焦要等下一代。' },
    panasonic: { name: '相位混合 AF + AI 对象识别', en: 'HYBRID PHASE AF', arch: 'fullpixel', coverage: 'wide', pt: 30, ev: -4.0, evLight: -3.0, track: 1.95, contrast: 1.05, eye: 0.78, subjects: ['人眼', '人体'], amp: 52, cost: 230, year: 2023, desc: 'PDAF 补上了 GH6 的短板，视频追焦舒适，但低光锁定和机型识别还是偏保守；老机型仍是纯 DFD 反差。' },
    dji: { name: '视觉追踪 + 云台融合对焦', en: 'GIMBAL FUSED TRACKING', arch: 'ai', coverage: 'zone', pt: 20, ev: -5.0, evLight: -6.5, track: 2.45, contrast: 0.85, eye: 0.8, subjects: ['人体', '人脸', '车辆', '运动物体'], amp: 36, cost: 190, year: 2023, desc: '相机和云台一起追焦：先电机锁人，芯片再追焦。静止场景一般，任何移动场景都很稳。' },
    insta360: { name: 'FlowState 深度追踪', en: 'FLOWSTATE TRACKING', arch: 'fullpixel', coverage: 'wide', pt: 4, ev: -4.0, evLight: -3.0, track: 2.0, contrast: 1.5, eye: 0.7, subjects: ['人体', '人脸'], amp: 26, cost: 165, year: 2022, desc: '这里只需要两个镜头各自锁定，追踪靠算法在后期里跟着人走。对焦速度和专业机不是一个量级。' }
  };

  const AF_FOUNDATIONS = {
    canon: 'dualpixel', sony: 'hybrid', nikon: 'hybrid',
    fujifilm: 'hybrid', panasonic: 'contrast', dji: 'hybrid', insta360: 'contrast'
  };

  const AF_FOUNDATION_NAMES = { contrast: '反差式基础平台', hybrid: '混合（对比 + 相位）基础平台', dualpixel: '双核对焦基础平台' };

  const CMOS_SENSORS = {
    canon: { code: 'CMOS DGO 双增益', mp: 45, type: 'stacked', desc: '佳能自产的全画幅堆栈传感器，双增益读出。' },
    sony: { code: 'IMX610 堆栈 BSI', mp: 50, type: 'stacked', desc: '索尼半导体主力全画幅堆栈方案，同一颗芯片也会卖给别家。' },
    nikon: { code: 'IMX820 定制 BSI', mp: 45, type: 'bsi', desc: '与索尼半导体联合定制的背照式全画幅，尼康有独家读出设定。' },
    fujifilm: { code: 'X-Trans 5 HR', mp: 40, type: 'bsi', desc: '富士自家的 X-Trans 结构，APS-C 上的色彩与摩尔纹方案。' },
    panasonic: { code: 'ARRI 认证双增益 CMOS', mp: 24, type: 'bsi', desc: '与 ARRI 合作的双原生 ISO 全画幅，动态范围优先。' },
    dji: { code: '1/1.3" 高动态 BSI', mp: 48, type: 'bsi', desc: '小尺寸、高读取速度，为云台与运动场景优化。' },
    insta360: { code: '双 1/2" 全景拼接 BSI', mp: 20, type: 'bsi', desc: '两颗传感器同步曝光，靠算法拼成全景。' }
  };

  /* ---------------------------------------------------------
  AF R&D: a chip programme now runs through five hard stages.
  Each stage can fail (blocked). Incidents fire between stages.
  --------------------------------------------------------- */
  const AF_STAGES = [
    { id: 'arch', name: '架构设计与规格冻结', en: 'SPEC FREEZE', weight: 0.16, difficulty: 0.9, desc: '对焦线数、读出时序和算力预算能不能塞进同一颗芯片。' },
    { id: 'layout', name: '物理版图与 DRC', en: 'PHYSICAL LAYOUT', weight: 0.18, difficulty: 1.0, desc: '布线延迟与串扰，决定你能不能稳定跑到设计的线数。' },
    { id: 'stream', name: '原型流片', en: 'SILICON PROOF', weight: 0.22, difficulty: 1.25, desc: '第一个原型回来，良率与读出速度是头一道关。' },
    { id: 'trigger', name: '触发算法与相位校准', en: 'TRIGGER ALGORITHM', weight: 0.2, difficulty: 1.15, desc: '相位差算不准，对焦就来回抖；这一关没有捷径。' },
    { id: 'qual', name: '量产验证与模组联调', en: 'QUALIFICATION', weight: 0.24, difficulty: 1.35, desc: '镜头、马达、机身主板三方联调，量产良率决定这颗芯片能不能用。' }
  ];

  const AF_INCIDENTS = [
    { id: 'slow_lines', stage: 'stream', name: '读出时序跑不满对焦线数', text: '原型只能跑到设计线数的 60%，对焦线数要临时下调。', fixes: [{ cost: 0, months: 0, effects: { ptLines: -0.22, progress: -0.15 }, label: '接受降级规格' }, { cost: 6000000, months: 1, effects: { progress: -0.08 }, label: '追加预算重做时序' }, { cost: 14000000, months: 2, effects: {}, label: '推倒重来，保规格' }] },
    { id: 'yield', stage: 'stream', name: '流片良率崩盘', text: '第一批晶圆良率不到 40%，量产成本会上浮，周期也会拖长。', fixes: [{ cost: 0, months: 0, effects: { costMultiplier: 0.18, progress: -0.12 }, label: '接受良率代价' }, { cost: 9000000, months: 1, effects: { progress: -0.06 }, label: '更换工艺角重流' }, { cost: 18000000, months: 2, effects: { costMultiplier: 0.05 }, label: '升级制程' }] },
    { id: 'lowlight_noise', stage: 'trigger', name: '低光对焦噪声超标', text: '相位像素在 -5EV 下噪声过高，低光锁定会变慢。', fixes: [{ cost: 0, months: 0, effects: { evLight: 0.8, progress: -0.1 }, label: '降低低光规格' }, { cost: 7000000, months: 1, effects: { progress: -0.05 }, label: '追加算法预算' }, { cost: 16000000, months: 2, effects: {}, label: '重做读出电路' }] },
    { id: 'track_drift', stage: 'trigger', name: '运动目标追踪抖动', text: '高速运动主体会出现来回寻焦，媒体测试一定会抓到。', fixes: [{ cost: 0, months: 0, effects: { track: 0.25, progress: -0.1 }, label: '接受追焦短板' }, { cost: 5000000, months: 1, effects: { progress: -0.05 }, label: '追加追踪算法团队' }] },
    { id: 'lens_handshake', stage: 'qual', name: '镜头马达协同失步', text: '和第三方镜头联调时对焦抖动，需要重做马达驱动协议。', fixes: [{ cost: 0, months: 0, effects: { issueRate: 0.06, progress: -0.12 }, label: '限制定焦镜头使用' }, { cost: 8000000, months: 1, effects: { progress: -0.05 }, label: '重做驱动协议' }] },
    { id: 'thermal', stage: 'qual', name: '长时间录制降频', text: '持续追焦时芯片发热触发降频，视频追焦会明显变慢。', fixes: [{ cost: 0, months: 0, effects: { contrast: 0.15, progress: -0.1 }, label: '接受长时间降频' }, { cost: 6000000, months: 1, effects: { progress: -0.05 }, label: '加装散热与降频策略' }] },
    { id: 'power_draw', stage: 'arch', name: '功耗超预算', text: '对焦芯片单独吃掉了一块电池续航，机身要加厚散热。', fixes: [{ cost: 0, months: 0, effects: { costDelta: 90, progress: -0.08 }, label: '接受更高模组成本' }, { cost: 7000000, months: 1, effects: { progress: -0.04 }, label: '重新做功耗规划' }] },
    { id: 'ip_conflict', stage: 'layout', name: 'IP 授权障碍', text: '对手持有的一段相位算法 IP 卡住了你的版图。', fixes: [{ cost: 0, months: 0, effects: { issueRate: 0.04, progress: -0.1, ipRisk: true }, label: '绕开，承担专利风险' }, { cost: 11000000, months: 1, effects: { progress: -0.05 }, label: '自研替代 IP' }, { cost: 22000000, months: 0, effects: {}, label: '支付授权费' }] },
    { id: 'tooling', stage: 'layout', name: '先进制程改版与昂贵掩膜', text: '为了压功耗必须上更先进制程，掩膜费是预算的数倍。', fixes: [{ cost: 0, months: 0, effects: { costDelta: 120, progress: -0.12 }, label: '停在旧制程' }, { cost: 15000000, months: 2, effects: {}, label: '出钱改版' }] },
    { id: 'abandon', stage: 'qual', name: '平台方案彻底失败', text: '这一代方案已经无法达到目标，要不要重开？', fixes: [{ cost: 0, months: 0, effects: {}, restart: true, label: '推倒重来' }, { cost: 0, months: 0, effects: { ptLines: -0.12, track: 0.2, progress: -0.2 }, label: '降级收尾' }] }
  ];

  // =========================================================
  // Launch events: scale + format + city + press + KOL
  // =========================================================
  const LAUNCH_FORMATS = {
    stream: { id: 'stream', name: '线上直播', en: 'LIVE STREAM', cost: 0.55, reach: 0.82, press: 0.85, desc: '成本最低，覆盖广，但缺少现场体验。' },
    keynote: { id: 'keynote', name: '城市主题演讲', en: 'KEYNOTE', cost: 1.0, reach: 1.0, press: 1.1, desc: '一场有仪式感的发布会，媒体与核心用户到场。' },
    handson: { id: 'handson', name: '媒体上手体验', en: 'HANDS-ON', cost: 0.8, reach: 0.9, press: 1.22, desc: '让媒体先摸到真机，评测口碑最好。' },
    festival: { id: 'festival', name: '影像文化节', en: 'PHOTO FESTIVAL', cost: 1.7, reach: 1.25, press: 1.15, desc: '把产品放进摄影文化现场，声量与品牌感最强。' }
  };

  const LAUNCH_CITIES = {
    online: { id: 'online', name: '线上', en: 'ONLINE', cost: 0.6, reach: 1.0, press: 0.9, home: null, desc: '没有地域限制，适合全球同步。' },
    shanghai: { id: 'shanghai', name: '上海', en: 'SHANGHAI', cost: 1.0, reach: 1.05, press: 1.05, home: '中国', desc: '中国影像消费与创作者的核心现场。' },
    tokyo: { id: 'tokyo', name: '东京', en: 'TOKYO', cost: 1.12, reach: 1.08, press: 1.12, home: '日本', desc: '影像工业的传统中心，媒体密度最高。' },
    newyork: { id: 'newyork', name: '纽约', en: 'NEW YORK', cost: 1.3, reach: 1.12, press: 1.15, home: '美国', desc: '全球科技与商业媒体的焦点。' },
    london: { id: 'london', name: '伦敦', en: 'LONDON', cost: 1.24, reach: 1.06, press: 1.1, home: '德国', desc: '欧洲影像与电影工业的门户。' }
  };

  const PRESS_TIERS = {
    none: { id: 'none', name: '不邀请媒体', cost: 0, reach: 0.82, hype: 0, score: 0, awareness: 0, desc: '只发新闻稿，适合静默上架。' },
    core: { id: 'core', name: '核心影像媒体', cost: 800000, reach: 1.0, hype: 0.06, score: 0.8, awareness: 0.4, desc: '相机与影像垂直媒体，专业读者精准。' },
    global: { id: 'global', name: '全球科技媒体', cost: 2800000, reach: 1.18, hype: 0.12, score: 1.15, awareness: 1.0, desc: '科技与大众媒体同步报道，破圈能力强。' },
    mass: { id: 'mass', name: '全媒体 + 大众', cost: 6500000, reach: 1.36, hype: 0.18, score: 1.0, awareness: 1.8, desc: '电视、门户、社交平台一起推，覆盖面最大。' }
  };

  const KOL_TIERS = {
    none: { id: 'none', name: '不邀请创作者', cost: 0, reach: 1.0, hype: 0, desc: '依靠媒体与官方内容。' },
    micro: { id: 'micro', name: '垂类创作者', cost: 700000, reach: 1.04, hype: 0.04, desc: '摄影与视频 UP 主的第一手体验。' },
    mid: { id: 'mid', name: '头部创作者', cost: 2600000, reach: 1.12, hype: 0.1, desc: '百万粉丝级的影像创作者现场试用。' },
    top: { id: 'top', name: '跨圈层顶流', cost: 7800000, reach: 1.26, hype: 0.18, desc: '明星与顶流博主，声量最大但成本惊人。' }
  };

  const EVENT_FOCUS = {
    image: { id: 'image', name: '画质与传感器', en: 'IMAGE QUALITY', scoreKey: 'image', desc: '把传感器、动态范围和像素作为主角。' },
    af: { id: 'af', name: '对焦与速度', en: 'AUTOFOCUS', scoreKey: 'focus', desc: '现场演示追焦、连拍和 AI 主体识别。' },
    video: { id: 'video', name: '视频与电影感', en: 'VIDEO', scoreKey: 'video', desc: '用片场样片和高帧率演示说服视频用户。' },
    design: { id: 'design', name: '设计与工艺', en: 'DESIGN', scoreKey: 'looks', desc: '把机身、材质和操作感做成一场视觉事件。' },
    value: { id: 'value', name: '价格与普及', en: 'VALUE', scoreKey: 'value', desc: '强调同价位配置，面向更大众的市场。' }
  };

  const PREORDER_OPTIONS = {
    off: { id: 'off', name: '不开放预购', deposit: 0, cost: 0, desc: '发布后直接开卖。' },
    on: { id: 'on', name: '开放预购', deposit: 0.2, cost: 500000, desc: '支付定金锁定首批用户，发布会当天开始收单。' }
  };

  const CHIP_LAB_UPGRADE_COOLDOWN = 0;

  const ODM_PARTNERS = {
    self: { id: 'self', name: '自有工厂', en: 'IN-HOUSE PLANT', capacity: 0, cost: 0.9, quality: 1.03, fee: 0, desc: '从试产到量产完全掌控，但需要自建产线。' },
    foxconn: { id: 'foxconn', name: '富士康', en: 'FOXCONN', capacity: 18000, cost: 1.05, quality: 1.03, fee: 3200000, desc: '全球最强的量产能力，成本和沟通门槛高。' },
    luxshare: { id: 'luxshare', name: '立讯精密', en: 'LUXSHARE', capacity: 12000, cost: 1.02, quality: 1.01, fee: 1800000, desc: '精密制造与快速响应，适合中高端产品。' },
    byd: { id: 'byd', name: '比亚迪电子', en: 'BYD ELECTRONICS', capacity: 14000, cost: 0.95, quality: 0.96, fee: 1300000, desc: '成本控制强，良率需要更严的驻厂品控。' },
    jabil: { id: 'jabil', name: '捷普', en: 'JABIL', capacity: 8000, cost: 1.08, quality: 1.06, fee: 2100000, desc: '高端小批量制造，质量控制出色。' },
    flex: { id: 'flex', name: '伟创力', en: 'FLEX', capacity: 10000, cost: 1.0, quality: 1.0, fee: 1500000, desc: '平衡的全球代工伙伴，交付稳定。' },
    goertek: { id: 'goertek', name: '歌尔股份', en: 'GOERTEK', capacity: 9000, cost: 0.96, quality: 0.99, fee: 1100000, desc: '消费电子经验丰富，适合卡片机与运动相机。' }
  };

  const FACTORY_LEVELS = [
    { level: 0, name: '无自有工厂', capacity: 0, cost: 0.9, upgradeCost: 18000000, upkeep: 0, desc: '完全依赖代工。' },
    { level: 1, name: '试产线', capacity: 5000, cost: 0.94, upgradeCost: 32000000, upkeep: 1800000, desc: '可小批量试产，灵活但效率有限。' },
    { level: 2, name: '中型工厂', capacity: 18000, cost: 0.9, upgradeCost: 55000000, upkeep: 4200000, desc: '支撑主力机型的稳定量产。' },
    { level: 3, name: '影像智造基地', capacity: 45000, cost: 0.86, upgradeCost: null, upkeep: 8500000, desc: '世界级自有产线和完整品控体系。' }
  ];

  const TECHS = {
    sensor: {
      key: 'sensor', name: '传感器技术', en: 'SENSOR', baseCost: 9000000, color: '#d8a558',
      desc: '像场、像素密度、读出速度与动态范围的基础。',
      levels: [
        '标准 CMOS，可用 APS-C / 全画幅基础方案。',
        '解锁背照式结构，暗光与宽容度提升。',
        '解锁堆栈式高速传感器，最高像素上限提升。',
        '解锁全局快门，支持超大画幅实验。',
        '顶尖像场与读取能力，像素和动态范围天花板最高。'
      ],
      costs: [0, 0, 9000000, 16000000, 29000000, 52000000],
      points: [0, 0, 190, 280, 380, 520]
    },
    video: {
      key: 'video', name: '高帧率视频技术', en: 'VIDEO', baseCost: 7500000, color: '#7f9fbd',
      desc: '决定分辨率、帧率与读取速度的上限。',
      levels: [
        '4K 60p 级别，只能满足基础视频。',
        '稳定 4K 120p，6K 读取开始可用。',
        '解锁 6K/8K 主流创作与高帧率。',
        '8K 高帧率与更强处理管线。',
        '12K 级别拍摄能力，片场技术旗舰。'
      ],
      costs: [0, 0, 7500000, 13500000, 25000000, 46000000],
      points: [0, 0, 180, 270, 365, 495]
    },
    af: {
      key: 'af', name: '自动对焦技术', en: 'AUTOFOCUS', baseCost: 6200000, color: '#90a86c',
      desc: '相位检测、追焦算法与主体识别能力。',
      levels: [
        '反差对焦，静态可用。',
        '解锁相位对焦，动态追焦入门。',
        '全像素对焦，覆盖更大画面。',
        'AI 主体识别，稳定的眼控与动物识别。',
        '顶尖追焦与低光对焦，专业体育级。'
      ],
      costs: [0, 0, 6200000, 11200000, 20500000, 38000000],
      points: [0, 0, 175, 260, 350, 475]
    },
    ibis: {
      key: 'ibis', name: '防抖技术', en: 'STABILISATION', baseCost: 4600000, color: '#b48966',
      desc: '机身防抖轴数、补偿级数与算法。',
      levels: [
        '基础算法，依赖镜头防抖。',
        '解锁三轴机身防抖。',
        '解锁五轴机身防抖。',
        '五轴增强与视频协同防抖。',
        '极强补偿与运动场景算法，手持电影感。'
      ],
      costs: [0, 0, 4600000, 8200000, 15000000, 28000000],
      points: [0, 0, 165, 245, 330, 445]
    },
    color: {
      key: 'color', name: '色彩科学与胶片模拟', en: 'COLOR SCIENCE', baseCost: 3800000, color: '#c88d76',
      desc: '直出观感、肤色、胶片模拟与专业色彩管线。',
      levels: [
        '基础直出，色彩风格平庸。',
        '建立初步色彩风格，肤色稳定。',
        '成熟直出与两种胶片模拟。',
        '丰富胶片模拟与专业 Log 曲线。',
        '行业级色彩文化，直出即是品牌资产。'
      ],
      costs: [0, 0, 3800000, 6800000, 12500000, 24000000],
      points: [0, 0, 155, 230, 315, 430]
    },
    codec: {
      key: 'codec', name: '编码与影像格式', en: 'CODEC', baseCost: 5200000, color: '#9d8bbb',
      desc: '压缩效率、RAW 工作流与专业编码支持。',
      levels: [
        'H.264 / H.265 基础编码。',
        '更高码率与 10-bit 支持。',
        '解锁 ProRes / DNxHR 专业编码。',
        '解锁 BRAW / RAW 与高码率输出。',
        '顶尖机内 RAW、代理与片场工作流。'
      ],
      costs: [0, 0, 5200000, 9400000, 17200000, 32000000],
      points: [0, 0, 170, 255, 345, 465]
    },
    cooling: {
      key: 'cooling', name: '散热技术', en: 'THERMAL', baseCost: 4100000, color: '#81a3a0',
      desc: '机身热设计、风道、相变材料与降噪。',
      levels: [
        '被动散热，长时间高码率容易过热。',
        '基础风道设计，可短时高负载。',
        '主动/复合散热，支持长时间录制。',
        '高效静音散热，片场级持续输出。',
        '顶级热管理，几乎不受环境温度影响。'
      ],
      costs: [0, 0, 4100000, 7600000, 14200000, 26500000],
      points: [0, 0, 160, 240, 325, 445]
    },
    battery: {
      key: 'battery', name: '电池与电源', en: 'POWER', baseCost: 3600000, color: '#c3a87a',
      desc: '能量密度、供电协议与续航算法。',
      levels: [
        '标准锂电，续航普通。',
        '更高能量密度与 USB 供电。',
        '智能功耗管理与快充。',
        '高密度电池与热安全体系。',
        '顶级电源效率，支持专业外电生态。'
      ],
      costs: [0, 0, 3600000, 6600000, 12000000, 23000000],
      points: [0, 0, 150, 225, 305, 420]
    },
    screen: {
      key: 'screen', name: '屏幕技术', en: 'DISPLAY', baseCost: 3500000, color: '#7d9bc4',
      desc: '亮度、色域、触控与高刷新显示。',
      levels: [
        '基础 LCD 屏幕，亮度有限。',
        '高分辨率触控屏。',
        '高亮广色域，户外可用。',
        '高刷高亮专业屏。',
        '顶尖 HDR 屏，片场监看级体验。'
      ],
      costs: [0, 0, 3500000, 6400000, 11800000, 22000000],
      points: [0, 0, 150, 220, 300, 410]
    },
    optics: {
      key: 'optics', name: '镜头光学技术', en: 'OPTICS', baseCost: 8500000, color: '#c58f51',
      desc: '特殊玻璃、镀膜、光圈与镜头机械精度。',
      levels: [
        '基础球面镜片与单层镀膜。',
        '非球面与低色散镜片可用。',
        '大光圈设计与高级镀膜。',
        '萤石、ED 与非球面复合结构。',
        '顶级电影光学与超低色散工艺。'
      ],
      costs: [0, 0, 8500000, 15500000, 28500000, 52000000],
      points: [0, 0, 190, 285, 385, 520]
    },
    material: {
      key: 'material', name: '机身材料工艺', en: 'MATERIALS', baseCost: 3300000, color: '#9b9c92',
      desc: '金属加工、表面处理与结构强度。',
      levels: [
        '基础塑料与喷塑。',
        '铝合金与阳极氧化。',
        '镁合金与精密 CNC。',
        '钛合金、碳纤维与高级表面。',
        '顶级材料工程与超薄结构。'
      ],
      costs: [0, 0, 3300000, 5900000, 10800000, 20500000],
      points: [0, 0, 145, 215, 295, 400]
    },
    modular: {
      key: 'modular', name: '模块化配件技术', en: 'MODULARITY', baseCost: 2700000, color: '#b0a064',
      desc: '接口、笼架、扩展手柄与附件生态。',
      levels: [
        '基础热靴与三脚架孔。',
        '标准接口模块与手柄。',
        '电影笼、图传与肩扛系统。',
        '完整模块化生态与电子触点。',
        '行业级扩展平台与第三方认证。'
      ],
      costs: [0, 0, 2700000, 5000000, 9200000, 17500000],
      points: [0, 0, 140, 210, 285, 390]
    },
    software: {
      key: 'software', name: '图像处理与系统', en: 'IMAGING SYSTEM', baseCost: 3100000, color: '#879a80',
      desc: '处理器、菜单、触控、智能功能与稳定性。',
      levels: [
        '基础菜单与图像处理。',
        '更快的响应与直出算法。',
        '流畅触控与主体识别辅助。',
        '高吞吐处理与专业工作流。',
        '行业顶尖的计算摄影与生态。'
      ],
      costs: [0, 0, 3100000, 5600000, 10200000, 19000000],
      points: [0, 0, 145, 215, 290, 395]
    }
  };

  const TECH_ORDER = ['sensor', 'video', 'af', 'ibis', 'color', 'codec', 'cooling', 'battery', 'screen', 'optics', 'material', 'modular', 'software'];

  const STAFF_ROLES = {
    engineers: { id: 'engineers', name: '研发工程师', en: 'ENGINEERS', salary: 42000, hireCost: 42000, desc: '推进技术研发项目，提升产品稳定性。', icon: 'chip' },
    designers: { id: 'designers', name: '工业设计师', en: 'DESIGNERS', salary: 36000, hireCost: 36000, desc: '提升外形完成度、审美一致性与品牌辨识度。', icon: 'pen' },
    qc: { id: 'qc', name: '品控工程师', en: 'QUALITY CONTROL', salary: 25000, hireCost: 25000, desc: '降低故障率、返修与口碑风险。', icon: 'shield' },
    marketing: { id: 'marketing', name: '市场与内容', en: 'MARKETING', salary: 28000, hireCost: 28000, desc: '提高营销预算效率与品牌曝光。', icon: 'spark' },
    sales: { id: 'sales', name: '渠道与销售', en: 'SALES', salary: 23000, hireCost: 23000, desc: '改善渠道覆盖，让好产品真正卖出去。', icon: 'chart' }
  };

  const STARTUP_STYLES = {
    industrial: {
      id: 'industrial', name: '工业极简', en: 'INDUSTRIAL MINIMAL', color: '#a8b8ba',
      desc: '冷调金属、平直顶盖和克制的细节。像一块被精密加工出来的工具。',
      design: {
        mainColor: '#272b2b', topColor: '#b7b5ad', gripColor: '#202323', accent: '#a8b8ba',
        sideColor: '#3b3f3e', finish: 'matte', material: 'aluminum', topPlate: 'metal'
      }
    },
    heritage: {
      id: 'heritage', name: '复古金属', en: 'HERITAGE METAL', color: '#b88e5a',
      desc: '铬银顶盖、皮革蒙皮和机械转盘，带一点上世纪中叶的优雅。',
      design: {
        mainColor: '#c9c4b7', topColor: '#c1beb3', gripColor: '#5d4635', accent: '#a77d4c',
        sideColor: '#918b7d', finish: 'leathergrain', material: 'aluminum', topPlate: 'metal'
      }
    },
    noir: {
      id: 'noir', name: '电影工业', en: 'CINEMA NOIR', color: '#9da6a1',
      desc: '深色金属、模块化结构、散热孔和接口。功能本身就是造型。',
      design: {
        mainColor: '#161818', topColor: '#232727', gripColor: '#282b2a', accent: '#b64a3b',
        sideColor: '#1e2121', finish: 'matte', material: 'magnesium', topPlate: 'metal'
      }
    },
    pop: {
      id: 'pop', name: '明亮潮流', en: 'POP COLOR', color: '#d5a734',
      desc: '奶油色、明快撞色和圆润比例。相机也是穿搭配件。',
      design: {
        mainColor: '#e2ded4', topColor: '#d5a734', gripColor: '#d5a734', accent: '#d5a734',
        sideColor: '#c7c2b7', finish: 'enamel', material: 'plastic', topPlate: 'hybrid'
      }
    },
    field: {
      id: 'field', name: '户外自然', en: 'FIELD GEAR', color: '#c58a52',
      desc: '军绿、橡胶蒙皮、防滑结构与粗粝的表面。生来就是为了走出去。',
      design: {
        mainColor: '#4f584c', topColor: '#3c423a', gripColor: '#2f342e', accent: '#c58a52',
        sideColor: '#394038', finish: 'powder', material: 'magnesium', topPlate: 'hybrid'
      }
    }
  };

  const DIFFICULTIES = {
    indie: {
      id: 'indie', name: '独立创业', en: 'INDEPENDENT', cash: 150000000, awareness: 8, reputation: 12,
      desc: '1.5 亿启动资金，一支小团队和一腔热爱。最推荐的沙盒起点。', label: '推荐'
    },
    dreamer: {
      id: 'dreamer', name: '白手起家', en: 'BOOTSTRAP', cash: 85000000, awareness: 4, reputation: 8,
      desc: '8500 万启动资金，每一台库存和每一次营销都要精打细算。', label: '困难'
    },
    backed: {
      id: 'backed', name: '财团支持', en: 'VENTURE BACKED', cash: 320000000, awareness: 14, reputation: 18,
      desc: '3.2 亿资金和更成熟的开局资源，容错率更高。', label: '轻松'
    }
  };

  const ARCHETYPES = {
    minimal: {
      id: 'minimal', name: '未来极简', en: 'FUTURE MINIMAL', color: '#a8b8ba', cash: 150000000,
      desc: '克制的线条、冷调金属与一块干净的屏幕。相信科技应该隐形。',
      tech: { sensor: 2, software: 2, screen: 2, material: 2 }, rep: 12, awareness: 6,
      staff: { engineers: 6, designers: 3, qc: 1, marketing: 1, sales: 1 },
      palette: ['#1b1d1e', '#b8b6ae', '#a8b8ba'],
      design: { mainColor: '#2a2d2d', finish: 'matte', material: 'aluminum', accent: '#b8c2bf' }
    },
    heritage: {
      id: 'heritage', name: '胶片遗产', en: 'FILM HERITAGE', color: '#c99b5f', cash: 150000000,
      desc: '金属顶盖、皮革、机械转盘和胶片色彩。让每一张照片都像一段记忆。',
      tech: { color: 3, optics: 2, material: 2 }, rep: 18, awareness: 5,
      staff: { engineers: 5, designers: 4, qc: 1, marketing: 1, sales: 1 },
      palette: ['#d4d0c5', '#202120', '#7b5a3e'],
      design: { mainColor: '#c9c3b6', finish: 'leathergrain', material: 'aluminum', accent: '#7b5a3e' }
    },
    cinema: {
      id: 'cinema', name: '片场工业', en: 'CINEMA INDUSTRIAL', color: '#818a88', cash: 160000000,
      desc: '为镜头服务，为片场而生。模块化、散热、接口和可信赖的黑色金属。',
      tech: { video: 3, codec: 2, cooling: 2, sensor: 2 }, rep: 14, awareness: 5,
      staff: { engineers: 7, designers: 3, qc: 2, marketing: 1, sales: 1 },
      palette: ['#111313', '#252929', '#676b65'],
      design: { mainColor: '#181a1a', finish: 'matte', material: 'magnesium', accent: '#8c8f87' }
    },
    street: {
      id: 'street', name: '街头新潮', en: 'STREET CULTURE', color: '#d9c35c', cash: 150000000,
      desc: '相机是穿搭配件，也是社交内容。大胆配色、轻巧机身和一拍即传。',
      tech: { software: 2, screen: 2, video: 2, color: 2 }, rep: 8, awareness: 16,
      staff: { engineers: 4, designers: 4, qc: 1, marketing: 3, sales: 2 },
      palette: ['#e3e0d7', '#d5a734', '#2b4c71'],
      design: { mainColor: '#e2ded4', finish: 'enamel', material: 'plastic', accent: '#d5a734' }
    },
    value: {
      id: 'value', name: '效率性价比', en: 'VALUE ENGINEERING', color: '#8fa77e', cash: 135000000,
      desc: '把每一分成本都花在用户真正需要的地方，用参数和价格撕开市场。',
      tech: { sensor: 2, af: 2, battery: 2, software: 2 }, rep: 10, awareness: 8,
      staff: { engineers: 6, designers: 2, qc: 2, marketing: 1, sales: 2 },
      palette: ['#252728', '#8fa77e', '#d9d6cc'],
      design: { mainColor: '#2b2e2e', finish: 'matte', material: 'plastic', accent: '#8fa77e' }
    }
  };

  const LENS_TYPES = {
    prime: { id: 'prime', name: '定焦镜头', en: 'PRIME', desc: '结构简单、画质上限高，适合人像和街拍。', costMul: 0.82, zoomRange: false, mods: { optics: 8, pro: 4, retro: 3 } },
    zoom: { id: 'zoom', name: '变焦镜头', en: 'ZOOM', desc: '覆盖多个焦段，工作流效率高。', costMul: 1.12, zoomRange: true, mods: { pro: 5, business: 3 } },
    cinema: { id: 'cinema', name: '电影镜头', en: 'CINEMA', desc: '齐焦、低呼吸、齿轮环与统一色彩。', costMul: 1.75, zoomRange: true, mods: { cinema: 16, pro: 8, size: 1 } },
    macro: { id: 'macro', name: '微距镜头', en: 'MACRO', desc: '近摄与细节，特殊机械结构。', costMul: 1.05, zoomRange: false, mods: { optics: 5, pro: 4 } },
    portrait: { id: 'portrait', name: '人像镜头', en: 'PORTRAIT', desc: '大光圈与柔和焦外，面向婚礼和人像。', costMul: 1.0, zoomRange: false, mods: { trend: 4, pro: 3, looks: 2 } },
    tele: { id: 'tele', name: '长焦镜头', en: 'SUPER TELE', desc: '生态、体育和新闻的长焦炮。', costMul: 1.3, zoomRange: true, mods: { pro: 6, sports: 6, handling: -1 } }
  };

  const LENS_MATERIALS = {
    aluminum: { id: 'aluminum', name: '阳极氧化铝', cost: 1.0, premium: 0.55, desc: '专业镜身标准，兼顾重量和耐用。' },
    magnesium: { id: 'magnesium', name: '镁合金', cost: 1.2, premium: 0.68, desc: '更轻的金属镜身，高端镜头常用。' },
    plastic: { id: 'plastic', name: '工程塑料', cost: 0.62, premium: 0.24, desc: '成本友好，容易显得入門。' },
    carbon: { id: 'carbon', name: '碳纤维', cost: 1.75, premium: 0.82, desc: '长焦与电影镜头的减重选项。' },
    brass: { id: 'brass', name: '黄铜镜身', cost: 1.55, premium: 0.9, desc: '复古手动镜的仪式感，沉甸甸。' }
  };

  const LENS_STYLES = {
    black_pro: { id: 'black_pro', name: '黑色专业镜身', en: 'PRO BLACK', mods: { pro: 8, cinema: 5, retro: -2, looks: 2 }, accent: '#282b2b', ring: '#2b2d2d' },
    silver_retro: { id: 'silver_retro', name: '银圈复古镜身', en: 'SILVER RETRO', mods: { retro: 14, looks: 6, business: 3 }, accent: '#b9b6ad', ring: '#b9b6ad' },
    red_ring: { id: 'red_ring', name: '红圈旗舰', en: 'RED RING', mods: { pro: 8, business: 3, trend: 3, looks: 4 }, accent: '#1f2222', ring: '#b13a2d' },
    gold_ring: { id: 'gold_ring', name: '金圈经典', en: 'GOLD RING', mods: { pro: 6, retro: 5, business: 3, looks: 3 }, accent: '#1d2020', ring: '#b38d49' },
    blue_ring: { id: 'blue_ring', name: '蓝圈科技', en: 'BLUE RING', mods: { pro: 5, trend: 5, cinema: 2, looks: 3 }, accent: '#1e2328', ring: '#477298' },
    white_tele: { id: 'white_tele', name: '白色长焦', en: 'WHITE SUPER TELE', mods: { pro: 7, sports: 10, trend: 3, looks: 5 }, accent: '#d8d4c8', ring: '#2e3131' },
    cine_black: { id: 'cine_black', name: '电影工业黑', en: 'CINE BLACK', mods: { cinema: 14, pro: 6, looks: 2 }, accent: '#181b1b', ring: '#4b4e4b' }
  };

  const LENS_COATINGS = {
    basic: { id: 'basic', name: '基础多层镀膜', cost: 0, score: 0, desc: '常规抗眩光表现。' },
    nano: { id: 'nano', name: '纳米结晶镀膜', cost: 180, score: 5, tech: 2, desc: '显著抑制鬼影和眩光。' },
    fluorine: { id: 'fluorine', name: '氟涂层 + 纳米镀膜', cost: 320, score: 8, tech: 3, desc: '防污防水，逆光更干净。' },
    cinema: { id: 'cinema', name: '电影级统一镀膜', cost: 520, score: 10, tech: 4, desc: '镜头组之间色彩高度统一。' }
  };

  const LENS_MOTORS = {
    stm: { id: 'stm', name: 'STM 步进马达', cost: 120, score: 4, desc: '安静平滑，适合视频，速度中等。' },
    linear: { id: 'linear', name: '线性马达', cost: 240, score: 8, desc: '快速、安静，适合高端混合机。' },
    dual: { id: 'dual', name: '双线性马达', cost: 380, score: 11, desc: '大镜片也能快速驱动。' },
    cinema: { id: 'cinema', name: '电影级齿轮对焦', cost: 620, score: 6, desc: '机械齿轮与低呼吸，为跟焦器设计。' },
    mf: { id: 'mf', name: '全手动对焦', cost: 0, score: 0, desc: '专注光学与机械手感，无自动对焦。' }
  };

  const LENS_TYPES_ARRAY = Object.values(LENS_TYPES);
  const LENS_STYLES_ARRAY = Object.values(LENS_STYLES);
  const SEGMENTS_ARRAY = Object.values(SEGMENTS);

  const AI_SERIES = {
    canon: {
      highres: ['EOS R5 Mark III', 'EOS R5X', 'EOS R5 Mark IV'], fullframe: ['EOS R6 Mark IV', 'EOS R6 Mark V', 'EOS R8 II'],
      sports: ['EOS R1 Mark II', 'EOS R1X'], vlog: ['EOS R50 V2', 'PowerShot V3'], compact: ['PowerShot V3', 'PowerShot G9 X'],
      mirrorless: ['EOS R80', 'EOS R7 Mark II', 'EOS R100 Mark II'], cinema: ['EOS C400 II', 'EOS C80 II'], retro: ['EOS RC'],
      medium: ['EOS M5 II']
    },
    sony: {
      highres: ['Alpha 7R VI', 'Alpha 7R V'], fullframe: ['Alpha 7 VI', 'Alpha 7 V'], sports: ['Alpha 1 III', 'Alpha 9 IV'],
      vlog: ['ZV-E10 III', 'ZV-E1 II'], compact: ['RX100 VIII', 'ZV-1 III'], cinema: ['FX4', 'FX30 II'],
      mirrorless: ['Alpha 6700 II', 'Alpha 6100 II'], medium: ['Alpha MF']
    },
    nikon: {
      highres: ['Z8 II', 'Z7 III'], fullframe: ['Z6 IV', 'Z5 III'], sports: ['Z9 II', 'Z90'],
      vlog: ['Z30 II', 'Z50 II V'], compact: ['Coolpix P4'], cinema: ['ZR II'], mirrorless: ['Z50 III', 'Z70'],
      retro: ['Zf II', 'Zfc II'], medium: ['Z MF']
    },
    fujifilm: {
      highres: ['X-H2S II', 'X-T6'], fullframe: ['X-Pro 4'], sports: ['X-H3S', 'X-H2S II'],
      vlog: ['X-M6', 'X-S30'], compact: ['X100VII', 'XQ3'], cinema: ['X-H3 Cine'], mirrorless: ['X-T6', 'X-S40'],
      retro: ['X100VII', 'X-Pro 4'], medium: ['GFX100 III', 'GFX50R II']
    },
    panasonic: {
      highres: ['Lumix S1R II'], fullframe: ['Lumix S1 II', 'Lumix S5 III'], sports: ['Lumix S1H III'],
      vlog: ['Lumix S9 II', 'Lumix G100 II'], compact: ['Lumix TZ100 II', 'Lumix LX100 III'], cinema: ['Lumix GH8', 'Lumix BS1H II'],
      mirrorless: ['Lumix G200'], retro: ['Lumix S Retro']
    },
    dji: {
      vlog: ['Osmo Pocket 4', 'Osmo Pocket 4 Pro'], action: ['Osmo Action 6', 'Osmo Action 6 Pro'],
      cinema: ['Ronin 4D II', 'Ronin 4D-8K'], compact: ['Osmo Nano II'], mirrorless: ['DJI Mirrorless']
    },
    insta360: {
      action: ['X6', 'X6 Air', 'Ace Pro 3', 'GO 4'], vlog: ['GO 4S', 'Flow 2'], compact: ['Luna Pro X', 'Luna Ultra 2'],
      cinema: ['Titan 2'], retro: ['GO Classic']
    }
  };

  /* ---------------------------------------------------------
     Real-world inspired companies. Numbers are sandbox values.
     --------------------------------------------------------- */
  const COMPANIES = [
    {
      id: 'canon', name: '佳能', en: 'CANON', hq: '东京 · 日本', founded: 1937,
      color: '#c4473a', logo: 'C', mark: 'CANON',
      positioning: '全能影像巨头 · 色彩与可靠性',
      tagline: '从婚礼现场到野生动物，佳能总是那个不会出错的选择。',
      brief: '庞大的镜头群、成熟的人体工学和极强的对焦体系。你的挑战是让一个舒适的巨人重新变得敏捷。',
      playstyle: '均衡型',
      strengths: ['全像素双核对焦传统', '庞大的 RF/EF 镜头生态', '直出色彩与可靠性', '渠道覆盖'],
      cash: 3800000000, debt: 420000000, reputation: 86, awareness: 96, startingShare: 21.4,
      fixedOverhead: 52000000, marketingBudget: 22000000,
      staff: { engineers: 92, designers: 33, qc: 42, marketing: 35, sales: 46 },
      tech: { sensor: 5, video: 4, af: 5, ibis: 4, color: 5, codec: 4, cooling: 3, battery: 4, screen: 4, optics: 5, material: 4, modular: 3, software: 4 },
      sensorSupplier: 'canon_semi', odmPartner: 'self', ownFactoryLevel: 3,
      afChipId: 'canon', cmosChipId: 'canon',
      design: { mainColor: '#1b1d1e', finish: 'matte', material: 'magnesium', accent: '#b73b2e', style: 'modern_pro' },
      catalog: [
        { name: 'EOS R1', category: 'sports', price: 52800, score: 94, sensor: 'ff', mp: 24, res: '6K', fps: 120, mount: 'RF', age: 16, target: 'sports' },
        { name: 'EOS R3', category: 'sports', price: 39800, score: 89, sensor: 'ff', mp: 24, res: '6K', fps: 30, mount: 'RF', age: 46, target: 'sports' },
        { name: 'EOS R5 Mark II', category: 'highres', price: 26800, score: 92, sensor: 'ff', mp: 45, res: '8K', fps: 30, mount: 'RF', age: 14, target: 'professional' },
        { name: 'EOS R5C', category: 'cinema', price: 28800, score: 88, sensor: 'ff', mp: 45, res: '8K', fps: 30, mount: 'RF', age: 40, target: 'cinema' },
        { name: 'EOS R6 Mark III', category: 'fullframe', price: 16800, score: 89, sensor: 'ff', mp: 32, res: '4K', fps: 120, mount: 'RF', age: 8, target: 'professional' },
        { name: 'EOS R6 Mark II', category: 'fullframe', price: 14800, score: 85, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'RF', age: 36, target: 'enthusiast' },
        { name: 'EOS R6 V', category: 'vlog', price: 15800, score: 84, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'RF', age: 6, target: 'creator' },
        { name: 'EOS R8 Mark II', category: 'fullframe', price: 11800, score: 83, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'RF', age: 10, target: 'creator' },
        { name: 'EOS R8', category: 'fullframe', price: 9800, score: 79, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'RF', age: 36, target: 'enthusiast' },
        { name: 'EOS RP', category: 'fullframe', price: 6800, score: 70, sensor: 'ff', mp: 26, res: '4K', fps: 30, mount: 'RF', age: 78, target: 'consumer' },
        { name: 'EOS R10', category: 'mirrorless', price: 6980, score: 78, sensor: 'apsc', mp: 24, res: '4K', fps: 30, mount: 'RF', age: 40, target: 'enthusiast' },
        { name: 'EOS R50', category: 'mirrorless', price: 4980, score: 74, sensor: 'apsc', mp: 24, res: '4K', fps: 30, mount: 'RF', age: 34, target: 'consumer' },
        { name: 'EOS R50 V', category: 'vlog', price: 6180, score: 80, sensor: 'apsc', mp: 24, res: '4K', fps: 60, mount: 'RF', age: 12, target: 'creator' }
      ],
      lensCatalog: [
        { name: 'RF 24-70mm F2.8 L IS USM', mount: 'RF', type: 'zoom', focal: [24, 70], aperture: 2.8, price: 18999, score: 94, age: 28 },
        { name: 'RF 50mm F1.2 L USM', mount: 'RF', type: 'prime', focal: [50, 50], aperture: 1.2, price: 15999, score: 92, age: 42 }
      ]
    },
    {
      id: 'sony', name: '索尼', en: 'SONY', hq: '东京 · 日本', founded: 1946,
      color: '#8a9aa6', logo: 'S', mark: 'α',
      positioning: '传感器霸主 · 速度与视频',
      tagline: '当一个半导体巨头决定重新定义相机。',
      brief: '自研传感器给了你天然优势，产品线庞大而锋利。现在要在色彩文化与用户体验上继续赢。',
      playstyle: '技术进攻型',
      strengths: ['自研 CMOS 与堆栈技术', '极强视频规格', 'AI 对焦与速度', '开放 E 卡口生态'],
      cash: 4200000000, debt: 360000000, reputation: 88, awareness: 97, startingShare: 23.1,
      fixedOverhead: 58000000, marketingBudget: 28000000,
      staff: { engineers: 96, designers: 34, qc: 38, marketing: 42, sales: 44 },
      tech: { sensor: 5, video: 5, af: 5, ibis: 4, color: 4, codec: 5, cooling: 4, battery: 4, screen: 5, optics: 4, material: 4, modular: 4, software: 5 },
      sensorSupplier: 'sony_semi', odmPartner: 'self', ownFactoryLevel: 3,
      afChipId: 'sony', cmosChipId: 'sony',
      design: { mainColor: '#202325', finish: 'matte', material: 'magnesium', accent: '#8a9aa6', style: 'modern_pro' },
      catalog: [
        { name: 'Alpha 1 II', category: 'sports', price: 48800, score: 94, sensor: 'ff', mp: 50, res: '8K', fps: 30, mount: 'E', age: 14, target: 'sports' },
        { name: 'Alpha 9 III', category: 'sports', price: 42800, score: 92, sensor: 'ff', mp: 24, res: '4K', fps: 120, mount: 'E', age: 22, target: 'sports' },
        { name: 'Alpha 7R VI', category: 'highres', price: 32800, score: 93, sensor: 'ff', mp: 61, res: '8K', fps: 30, mount: 'E', age: 10, target: 'professional' },
        { name: 'Alpha 7R V', category: 'highres', price: 25800, score: 90, sensor: 'ff', mp: 61, res: '8K', fps: 30, mount: 'E', age: 34, target: 'professional' },
        { name: 'Alpha 7 V', category: 'fullframe', price: 17800, score: 89, sensor: 'ff', mp: 33, res: '4K', fps: 120, mount: 'E', age: 6, target: 'professional' },
        { name: 'Alpha 7 IV', category: 'fullframe', price: 14800, score: 85, sensor: 'ff', mp: 33, res: '4K', fps: 60, mount: 'E', age: 48, target: 'enthusiast' },
        { name: 'Alpha 7 III', category: 'fullframe', price: 10800, score: 80, sensor: 'ff', mp: 24, res: '4K', fps: 30, mount: 'E', age: 90, target: 'enthusiast' },
        { name: 'Alpha 7C II', category: 'fullframe', price: 15800, score: 85, sensor: 'ff', mp: 33, res: '4K', fps: 60, mount: 'E', age: 26, target: 'creator' },
        { name: 'Alpha 7CR', category: 'highres', price: 23800, score: 88, sensor: 'ff', mp: 61, res: '4K', fps: 60, mount: 'E', age: 26, target: 'professional' },
        { name: 'ZV-E1', category: 'vlog', price: 16800, score: 83, sensor: 'ff', mp: 12, res: '4K', fps: 120, mount: 'E', age: 30, target: 'creator' },
        { name: 'Alpha 6700', category: 'mirrorless', price: 11800, score: 84, sensor: 'apsc', mp: 26, res: '4K', fps: 60, mount: 'E', age: 26, target: 'enthusiast' },
        { name: 'ZV-E10 II', category: 'vlog', price: 7480, score: 82, sensor: 'apsc', mp: 26, res: '4K', fps: 60, mount: 'E', age: 10, target: 'creator' },
        { name: 'ZV-E10', category: 'vlog', price: 4980, score: 74, sensor: 'apsc', mp: 24, res: '4K', fps: 30, mount: 'E', age: 60, target: 'creator' },
        { name: 'FX3', category: 'cinema', price: 27800, score: 90, sensor: 'ff', mp: 12, res: '4K', fps: 120, mount: 'E', age: 50, target: 'cinema' },
        { name: 'FX6', category: 'cinema', price: 58000, score: 92, sensor: 'ff', mp: 10, res: '4K', fps: 120, mount: 'E', age: 44, target: 'cinema' },
        { name: 'FX5', category: 'cinema', price: 39800, score: 89, sensor: 'ff', mp: 17, res: '6K', fps: 60, mount: 'E', age: 12, target: 'cinema' },
        { name: 'FX2', category: 'cinema', price: 22800, score: 85, sensor: 'ff', mp: 33, res: '4K', fps: 60, mount: 'E', age: 8, target: 'cinema' },
        { name: 'FR7', category: 'cinema', price: 68800, score: 88, sensor: 'ff', mp: 12, res: '4K', fps: 60, mount: 'E', age: 30, target: 'cinema' }
      ],
      lensCatalog: [
        { name: 'FE 24-70mm F2.8 GM II', mount: 'E', type: 'zoom', focal: [24, 70], aperture: 2.8, price: 16999, score: 94, age: 34 },
        { name: 'FE 50mm F1.2 GM', mount: 'E', type: 'prime', focal: [50, 50], aperture: 1.2, price: 15999, score: 93, age: 40 }
      ]
    },
    {
      id: 'nikon', name: '尼康', en: 'NIKON', hq: '东京 · 日本', founded: 1917,
      color: '#d6b841', logo: 'N', mark: 'Z',
      positioning: '光学名门 · 坚固可靠',
      tagline: '一百年的光学信仰，等待下一台让人心动的机身。',
      brief: 'Z 卡口的光学素质无可挑剔，但产品线和营销节奏需要重新找回锋芒。',
      playstyle: '品质长线型',
      strengths: ['顶级光学与镜头设计', '全天候专业机身', '高可靠性', '百年品牌资产'],
      cash: 2200000000, debt: 260000000, reputation: 85, awareness: 90, startingShare: 13.2,
      fixedOverhead: 34000000, marketingBudget: 14000000,
      staff: { engineers: 68, designers: 25, qc: 31, marketing: 24, sales: 35 },
      tech: { sensor: 4, video: 4, af: 4, ibis: 4, color: 5, codec: 3, cooling: 3, battery: 5, screen: 4, optics: 5, material: 4, modular: 3, software: 4 },
      sensorSupplier: 'sony_semi', odmPartner: 'self', ownFactoryLevel: 3,
      afChipId: 'nikon', cmosChipId: 'nikon',
      design: { mainColor: '#1d1e1d', finish: 'matte', material: 'magnesium', accent: '#d3b238', style: 'modern_pro' },
      catalog: [
        { name: 'D6', category: 'sports', price: 42800, score: 86, sensor: 'ff', mp: 21, res: '4K', fps: 30, mount: 'F', age: 60, target: 'sports' },
        { name: 'D850', category: 'highres', price: 21800, score: 88, sensor: 'ff', mp: 46, res: '4K', fps: 30, mount: 'F', age: 84, target: 'professional' },
        { name: 'D780', category: 'fullframe', price: 13800, score: 80, sensor: 'ff', mp: 24, res: '4K', fps: 30, mount: 'F', age: 66, target: 'professional' },
        { name: 'D7500', category: 'mirrorless', price: 6980, score: 74, sensor: 'apsc', mp: 21, res: '4K', fps: 30, mount: 'F', age: 78, target: 'enthusiast' },
        { name: 'D5600', category: 'mirrorless', price: 4280, score: 68, sensor: 'apsc', mp: 24, res: '1080p', fps: 60, mount: 'F', age: 96, target: 'consumer' },
        { name: 'D3500', category: 'compact', price: 2980, score: 63, sensor: 'apsc', mp: 24, res: '1080p', fps: 60, mount: 'F', age: 84, target: 'consumer' },
        { name: 'Z9', category: 'sports', price: 45800, score: 93, sensor: 'ff', mp: 46, res: '8K', fps: 120, mount: 'Z', age: 30, target: 'sports' },
        { name: 'Z8', category: 'highres', price: 28800, score: 91, sensor: 'ff', mp: 46, res: '8K', fps: 60, mount: 'Z', age: 22, target: 'professional' },
        { name: 'Z6III', category: 'fullframe', price: 18800, score: 88, sensor: 'ff', mp: 25, res: '6K', fps: 120, mount: 'Z', age: 10, target: 'professional' },
        { name: 'Z5II', category: 'fullframe', price: 11800, score: 81, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'Z', age: 8, target: 'enthusiast' },
        { name: 'Z5IIC', category: 'fullframe', price: 12400, score: 80, sensor: 'ff', mp: 24, res: '4K', fps: 60, mount: 'Z', age: 6, target: 'creator' },
        { name: 'Zf', category: 'retro', price: 13900, score: 86, sensor: 'ff', mp: 25, res: '4K', fps: 60, mount: 'Z', age: 20, target: 'enthusiast' },
        { name: 'Z30', category: 'vlog', price: 5480, score: 76, sensor: 'apsc', mp: 21, res: '4K', fps: 30, mount: 'Z', age: 26, target: 'creator' },
        { name: 'Z50II', category: 'mirrorless', price: 8280, score: 79, sensor: 'apsc', mp: 21, res: '4K', fps: 60, mount: 'Z', age: 12, target: 'enthusiast' },
        { name: 'ZR', category: 'cinema', price: 19800, score: 84, sensor: 'ff', mp: 33, res: '6K', fps: 60, mount: 'Z', age: 8, target: 'cinema' }
      ],
      lensCatalog: [
        { name: 'NIKKOR Z 24-70mm f/2.8 S', mount: 'Z', type: 'zoom', focal: [24, 70], aperture: 2.8, price: 15999, score: 95, age: 38 },
        { name: 'NIKKOR Z 85mm f/1.2 S', mount: 'Z', type: 'portrait', focal: [85, 85], aperture: 1.2, price: 19999, score: 94, age: 22 }
      ]
    },
    {
      id: 'fujifilm', name: '富士胶片', en: 'FUJIFILM', hq: '东京 · 日本', founded: 1934,
      color: '#c59a54', logo: 'F', mark: 'FUJIFILM',
      positioning: '色彩文化 · 复古审美',
      tagline: '在数码时代，坚持让照片有胶片的温度。',
      brief: '你是审美和直出色彩的代名词。中画幅与 APS-C 双线并进，把外形设计变成真正的护城河。',
      playstyle: '审美溢价型',
      strengths: ['胶片模拟与直出色彩', '中画幅 GFX 系统', '机械转盘文化', '最强复古设计语言'],
      cash: 2300000000, debt: 180000000, reputation: 88, awareness: 88, startingShare: 10.4,
      fixedOverhead: 32000000, marketingBudget: 16000000,
      staff: { engineers: 58, designers: 30, qc: 27, marketing: 26, sales: 30 },
      tech: { sensor: 4, video: 4, af: 3, ibis: 4, color: 5, codec: 3, cooling: 3, battery: 4, screen: 4, optics: 5, material: 4, modular: 4, software: 4 },
      sensorSupplier: 'sony_semi', odmPartner: 'self', ownFactoryLevel: 3,
      afChipId: 'fujifilm', cmosChipId: 'fujifilm',
      design: { mainColor: '#c9c4b8', finish: 'leathergrain', material: 'aluminum', accent: '#b58f4f', style: 'retro' },
      catalog: [
        { name: 'X-H2S', category: 'sports', price: 14800, score: 87, sensor: 'apsc', mp: 26, res: '6K', fps: 120, mount: 'X', age: 30, target: 'sports' },
        { name: 'X-H2', category: 'highres', price: 12800, score: 88, sensor: 'apsc', mp: 40, res: '8K', fps: 30, mount: 'X', age: 30, target: 'professional' },
        { name: 'X-T5', category: 'mirrorless', price: 11800, score: 87, sensor: 'apsc', mp: 40, res: '6K', fps: 30, mount: 'X', age: 30, target: 'enthusiast' },
        { name: 'X-T50', category: 'mirrorless', price: 8480, score: 82, sensor: 'apsc', mp: 40, res: '6K', fps: 30, mount: 'X', age: 14, target: 'enthusiast' },
        { name: 'X-T30 III', category: 'mirrorless', price: 6480, score: 80, sensor: 'apsc', mp: 26, res: '6K', fps: 30, mount: 'X', age: 8, target: 'enthusiast' },
        { name: 'X-E5', category: 'mirrorless', price: 8280, score: 82, sensor: 'apsc', mp: 40, res: '6K', fps: 30, mount: 'X', age: 6, target: 'enthusiast' },
        { name: 'X-M5', category: 'vlog', price: 5980, score: 79, sensor: 'apsc', mp: 26, res: '6K', fps: 30, mount: 'X', age: 14, target: 'creator' },
        { name: 'X-S20', category: 'mirrorless', price: 8280, score: 81, sensor: 'apsc', mp: 26, res: '6K', fps: 30, mount: 'X', age: 22, target: 'creator' },
        { name: 'X100VI', category: 'retro', price: 13980, score: 89, sensor: 'apsc', mp: 40, res: '6K', fps: 30, mount: 'FIXED', age: 16, target: 'enthusiast' },
        { name: 'X half', category: 'compact', price: 5280, score: 76, sensor: 'one', mp: 18, res: '4K', fps: 30, mount: 'FIXED', age: 6, target: 'creator' },
        { name: 'GFX100 II', category: 'medium', price: 56800, score: 92, sensor: 'mf', mp: 102, res: '8K', fps: 30, mount: 'GFX', age: 18, target: 'professional' },
        { name: 'GFX100S II', category: 'medium', price: 39800, score: 91, sensor: 'mf', mp: 102, res: '4K', fps: 30, mount: 'GFX', age: 12, target: 'professional' },
        { name: 'GFX100RF', category: 'medium', price: 42800, score: 89, sensor: 'mf', mp: 102, res: '4K', fps: 30, mount: 'FIXED', age: 8, target: 'enthusiast' },
        { name: 'GFX ETERNA 55', category: 'cinema', price: 88800, score: 90, sensor: 'mf', mp: 55, res: '8K', fps: 30, mount: 'GFX', age: 6, target: 'cinema' }
      ],
      lensCatalog: [
        { name: 'XF 16-55mm F2.8 R LM WR II', mount: 'X', type: 'zoom', focal: [16, 55], aperture: 2.8, price: 8999, score: 93, age: 14 },
        { name: 'XF 56mm F1.2 R WR', mount: 'X', type: 'portrait', focal: [56, 56], aperture: 1.2, price: 7499, score: 92, age: 24 }
      ]
    },
    {
      id: 'panasonic', name: '松下', en: 'PANASONIC', hq: '大阪 · 日本', founded: 1918,
      color: '#53709c', logo: 'P', mark: 'LUMIX',
      positioning: '视频工作流 · 高性价比',
      tagline: '把专业视频能力，塞进一台愿意带出门的相机。',
      brief: 'GH 系列有忠实的视频用户。现在要用更鲜明的设计和全画幅产品线扩大战场。',
      playstyle: '视频专精型',
      strengths: ['专业视频功能', '优秀散热与防抖', '高性价比', 'L 卡口联盟'],
      cash: 1600000000, debt: 210000000, reputation: 80, awareness: 83, startingShare: 6.8,
      fixedOverhead: 30000000, marketingBudget: 12000000,
      staff: { engineers: 55, designers: 20, qc: 24, marketing: 22, sales: 28 },
      tech: { sensor: 4, video: 5, af: 4, ibis: 4, color: 4, codec: 4, cooling: 4, battery: 3, screen: 4, optics: 3, material: 3, modular: 3, software: 4 },
      sensorSupplier: 'sony_semi', odmPartner: 'self', ownFactoryLevel: 2,
      afChipId: 'panasonic', cmosChipId: 'panasonic',
      design: { mainColor: '#1f2327', finish: 'matte', material: 'magnesium', accent: '#577ca5', style: 'modern_pro' },
      catalog: [
        { name: 'S1R II', category: 'highres', price: 32800, score: 90, sensor: 'ff', mp: 44, res: '8K', fps: 30, mount: 'L', age: 10, target: 'professional' },
        { name: 'S1 II', category: 'fullframe', price: 23800, score: 87, sensor: 'ff', mp: 24, res: '6K', fps: 60, mount: 'L', age: 12, target: 'professional' },
        { name: 'S1 IIE', category: 'fullframe', price: 19800, score: 84, sensor: 'ff', mp: 24, res: '6K', fps: 30, mount: 'L', age: 12, target: 'enthusiast' },
        { name: 'S5 II', category: 'fullframe', price: 13800, score: 85, sensor: 'ff', mp: 24, res: '6K', fps: 30, mount: 'L', age: 32, target: 'enthusiast' },
        { name: 'S5 IIX', category: 'cinema', price: 15800, score: 87, sensor: 'ff', mp: 24, res: '6K', fps: 30, mount: 'L', age: 32, target: 'cinema' },
        { name: 'S9', category: 'vlog', price: 9800, score: 80, sensor: 'ff', mp: 24, res: '6K', fps: 30, mount: 'L', age: 16, target: 'creator' },
        { name: 'GH7', category: 'cinema', price: 15800, score: 89, sensor: 'm43', mp: 25, res: '6K', fps: 60, mount: 'M43', age: 14, target: 'cinema' },
        { name: 'GH5 II', category: 'cinema', price: 11800, score: 82, sensor: 'm43', mp: 20, res: '4K', fps: 60, mount: 'M43', age: 52, target: 'cinema' },
        { name: 'G7', category: 'mirrorless', price: 4280, score: 66, sensor: 'm43', mp: 16, res: '4K', fps: 30, mount: 'M43', age: 120, target: 'consumer' },
        { name: 'ZS300', category: 'compact', price: 5980, score: 72, sensor: 'one', mp: 20, res: '4K', fps: 30, mount: 'FIXED', age: 16, target: 'consumer' },
        { name: 'L10', category: 'compact', price: 3980, score: 64, sensor: 'm43', mp: 17, res: '4K', fps: 30, mount: 'FIXED', age: 90, target: 'consumer' }
      ],
      lensCatalog: [
        { name: 'Lumix S 24-70mm F2.8', mount: 'L', type: 'zoom', focal: [24, 70], aperture: 2.8, price: 13999, score: 91, age: 30 }
      ]
    },
    {
      id: 'dji', name: '大疆创新', en: 'DJI', hq: '深圳 · 中国', founded: 2006,
      color: '#5b6e74', logo: 'D', mark: 'DJI',
      positioning: '稳定影像 · 消费级革命',
      tagline: '让每个人都能拍出稳定的电影感。',
      brief: '你在云台、图传和消费影像上有压倒性优势。如何把无人机式的产品思维带进专业相机市场？',
      playstyle: '消费科技型',
      strengths: ['云台与防抖', '消费级产品定义', '无线图传生态', '供应链规模'],
      cash: 2200000000, debt: 210000000, reputation: 86, awareness: 91, startingShare: 4.6,
      fixedOverhead: 38000000, marketingBudget: 24000000,
      staff: { engineers: 70, designers: 36, qc: 31, marketing: 34, sales: 40 },
      tech: { sensor: 3, video: 4, af: 5, ibis: 5, color: 4, codec: 4, cooling: 4, battery: 4, screen: 5, optics: 4, material: 3, modular: 3, software: 5 },
      sensorSupplier: 'sony_semi', odmPartner: 'self', ownFactoryLevel: 3,
      afChipId: 'dji', cmosChipId: 'dji',
      design: { mainColor: '#202425', finish: 'matte', material: 'aluminum', accent: '#5b6e74', style: 'industrial' },
      catalog: [
        { name: 'Osmo Pocket 4', category: 'vlog', price: 3799, score: 87, sensor: 'one', mp: 20, res: '4K', fps: 120, mount: 'FIXED', age: 8, target: 'creator' },
        { name: 'Osmo Pocket 4P', category: 'vlog', price: 4799, score: 89, sensor: 'one', mp: 20, res: '4K', fps: 120, mount: 'FIXED', age: 8, target: 'creator' },
        { name: 'Osmo 360 II', category: 'action', price: 3299, score: 84, sensor: 'one', mp: 48, res: '8K', fps: 30, mount: 'FIXED', age: 6, target: 'sports' },
        { name: 'Osmo Action 6', category: 'action', price: 2599, score: 85, sensor: 'one', mp: 40, res: '4K', fps: 120, mount: 'FIXED', age: 6, target: 'sports' },
        { name: 'Osmo Action 5 Pro', category: 'action', price: 2299, score: 82, sensor: 'one', mp: 40, res: '4K', fps: 120, mount: 'FIXED', age: 18, target: 'sports' }
      ],
      lensCatalog: []
    },
    {
      id: 'insta360', name: '影石', en: 'INSTA360', hq: '深圳 · 中国', founded: 2015,
      color: '#e07a2f', logo: 'I', mark: 'INSTA360',
      positioning: '全景影像 · 先拍摄后取景',
      tagline: '先拍下来，再决定看哪里。',
      brief: '你用全景重构了"拍摄"这件事本身：用户不需要构图，只需要记录。现在要把这套算法优势扩展到运动相机与创作者工具上，从一家配件公司变成真正的影像公司。',
      playstyle: '内容驱动型',
      strengths: ['全景拼接与后期重构算法', 'FlowState 防抖', '磁吸模块化生态', '年轻用户与社交内容'],
      cash: 900000000, debt: 60000000, reputation: 84, awareness: 79, startingShare: 3.4,
      fixedOverhead: 14000000, marketingBudget: 9000000,
      staff: { engineers: 46, designers: 18, qc: 15, marketing: 19, sales: 17 },
      tech: { sensor: 3, video: 4, af: 3, ibis: 5, color: 3, codec: 4, cooling: 3, battery: 3, screen: 3, optics: 2, material: 3, modular: 5, software: 5 },
      sensorSupplier: 'sony_semi', odmPartner: 'goertek', ownFactoryLevel: 0,
      afChipId: 'insta360', cmosChipId: 'insta360',
      design: { mainColor: '#1d1f21', finish: 'matte', material: 'aluminum', accent: '#e07a2f', style: 'action' },
      catalog: [
        { name: 'X6', category: 'action', price: 3580, score: 87, sensor: 'one', mp: 72, res: '8K', fps: 30, mount: 'FIXED', age: 8, target: 'sports' },
        { name: 'X5', category: 'action', price: 3280, score: 84, sensor: 'one', mp: 72, res: '8K', fps: 30, mount: 'FIXED', age: 22, target: 'sports' },
        { name: 'X4', category: 'action', price: 2680, score: 80, sensor: 'one', mp: 36, res: '8K', fps: 30, mount: 'FIXED', age: 36, target: 'sports' },
        { name: 'X4 Air', category: 'action', price: 2180, score: 77, sensor: 'one', mp: 36, res: '8K', fps: 30, mount: 'FIXED', age: 20, target: 'creator' },
        { name: 'Ace Pro 2', category: 'action', price: 2799, score: 85, sensor: 'one', mp: 50, res: '8K', fps: 30, mount: 'FIXED', age: 12, target: 'creator' },
        { name: 'GO Ultra', category: 'vlog', price: 2680, score: 82, sensor: 'one', mp: 20, res: '4K', fps: 60, mount: 'FIXED', age: 8, target: 'creator' },
        { name: 'GO 3S', category: 'vlog', price: 2198, score: 78, sensor: 'one', mp: 12, res: '4K', fps: 30, mount: 'FIXED', age: 18, target: 'creator' },
        { name: 'Pro 2', category: 'cinema', price: 26800, score: 86, sensor: 'one', mp: 72, res: '8K', fps: 30, mount: 'FIXED', age: 10, target: 'cinema' }
      ],
      lensCatalog: []
    }
  ];

  /* ---------------------------------------------------------
  World regions — the strategic map divides global demand into
  six markets. Every brand has a home advantage multiplier.
  --------------------------------------------------------- */
  const REGIONS = [
    {
      id: 'greater_china', name: '大中华区', en: 'GREATER CHINA', short: '大中华',
      weight: 0.26, x: 0.74, y: 0.44, w: 150, h: 110,
      desc: '全球最大的影像消费增量市场，也是大疆与影石的主场。',
      bias: { dji: 1.55, insta360: 1.55, sony: 1.1, canon: 1.0, nikon: 0.92, fujifilm: 1.08, panasonic: 0.95 },
      geo: [[73,40],[76,41],[80,45],[85,47],[90,48],[95,49],[100,49],[105,49],[110,48],[115,48],[120,50],[124,49],[127,46],[130,44],[131,42],[127,40],[124,39],[122,37],[121,34],[122,31],[120,27],[117,24],[113,22],[110,21],[108,21],[105,22],[101,22],[98,24],[96,28],[92,28],[88,30],[84,33],[80,36],[76,37],[73,40]]
    },
    {
      id: 'asia_pac', name: '亚太（除大中华）', en: 'ASIA PACIFIC', short: '亚太',
      weight: 0.18, x: 0.78, y: 0.6, w: 130, h: 100,
      desc: '日本厂商的传统腹地，摄影文化与器材渠道最成熟。',
      bias: { canon: 1.22, sony: 1.25, nikon: 1.18, fujifilm: 1.12, panasonic: 1.1, dji: 1.0, insta360: 0.95 },
      geo: [[[60,40],[66,38],[70,40],[75,37],[78,34],[80,30],[82,26],[85,24],[88,26],[92,27],[95,26],[97,22],[99,18],[100,13],[103,8],[105,5],[107,10],[109,14],[108,20],[110,21],[113,22],[115,23],[117,24],[120,25],[122,30],[122,34],[125,36],[127,35],[128,38],[130,43],[133,44],[136,45],[140,46],[142,48],[145,50],[148,54],[152,58],[157,60],[162,61],[167,64],[172,67],[178,69],[180,66],[180,54],[175,50],[170,47],[165,44],[160,42],[155,40],[150,38],[146,36],[142,34],[140,32],[137,30],[133,29],[130,28],[127,25],[124,23],[122,20],[120,17],[118,12],[119,8],[121,4],[124,2],[120,-2],[115,-4],[110,-6],[105,-6],[102,-3],[100,2],[98,8],[96,12],[94,16],[90,20],[86,22],[80,15],[76,10],[72,14],[68,20],[64,26],[62,32],[60,40]],[[113,-22],[114,-27],[115,-31],[118,-34],[122,-34],[126,-32],[130,-31],[134,-33],[137,-35],[140,-38],[144,-38],[147,-38],[150,-36],[153,-32],[153,-28],[152,-25],[149,-21],[146,-18],[143,-14],[141,-12],[138,-12],[136,-13],[133,-15],[130,-14],[127,-15],[124,-17],[121,-19],[117,-21],[113,-22]]]
    },
    {
      id: 'north_america', name: '北美', en: 'NORTH AMERICA', short: '北美',
      weight: 0.22, x: 0.17, y: 0.3, w: 160, h: 120,
      desc: '专业用户与内容创作者密度最高，单价高、口碑影响大。',
      bias: { canon: 1.16, sony: 1.12, insta360: 1.18, dji: 1.12, nikon: 1.0, fujifilm: 1.02, panasonic: 0.94 },
      geo: [[-168,65],[-166,60],[-160,58],[-154,59],[-148,60],[-142,60],[-136,58],[-132,54],[-128,51],[-124,48],[-124,44],[-122,40],[-120,35],[-117,32],[-114,30],[-111,25],[-106,23],[-103,20],[-97,16],[-92,15],[-88,16],[-87,21],[-90,21],[-94,18],[-97,21],[-97,26],[-94,29],[-90,29],[-89,30],[-85,30],[-82,28],[-80,25],[-81,31],[-79,34],[-76,37],[-73,40],[-70,42],[-67,45],[-64,47],[-59,47],[-53,49],[-56,52],[-62,55],[-66,58],[-70,62],[-76,64],[-80,68],[-85,70],[-95,72],[-105,73],[-115,72],[-125,71],[-135,70],[-145,70],[-155,71],[-163,69],[-168,65]]
    },
    {
      id: 'europe', name: '欧洲', en: 'EUROPE', short: '欧洲',
      weight: 0.18, x: 0.47, y: 0.27, w: 120, h: 100,
      desc: '审美驱动市场，复古与色彩科学在这里溢价最高。',
      bias: { fujifilm: 1.28, panasonic: 1.22, nikon: 1.1, sony: 1.05, canon: 1.02, dji: 0.95, insta360: 1.0 },
      geo: [[-10,36],[-9,39],[-9,43],[-4,44],[-2,46],[-2,48],[2,51],[4,52],[6,53],[8,54],[9,57],[11,58],[13,55],[13,54],[18,55],[21,56],[24,59],[26,60],[29,60],[30,63],[31,66],[27,70],[22,70],[18,69],[15,67],[12,65],[10,63],[7,61],[5,59],[6,57],[8,55],[10,54],[12,52],[15,50],[19,49],[22,48],[26,48],[29,46],[32,46],[35,45],[38,47],[40,49],[39,53],[36,55],[33,56],[30,58],[27,59],[24,57],[20,56],[17,54],[14,51],[11,48],[8,46],[4,44],[1,42],[-2,41],[-5,38],[-9,37],[-10,36]]
    },
    {
      id: 'latin_america', name: '拉丁美洲', en: 'LATIN AMERICA', short: '拉美',
      weight: 0.09, x: 0.25, y: 0.68, w: 110, h: 100,
      desc: '价格敏感市场，入门机型与渠道覆盖决定份额。',
      bias: { canon: 1.3, sony: 1.1, nikon: 1.05, fujifilm: 0.95, panasonic: 0.9, dji: 1.02, insta360: 0.95 },
      geo: [[-81,7],[-77,8],[-73,11],[-68,11],[-63,10],[-60,8],[-55,6],[-52,4],[-50,0],[-45,-2],[-40,-4],[-37,-8],[-35,-8],[-38,-13],[-39,-18],[-42,-23],[-48,-26],[-52,-32],[-56,-35],[-58,-38],[-62,-40],[-65,-45],[-68,-50],[-70,-54],[-74,-53],[-75,-49],[-74,-44],[-73,-37],[-71,-30],[-70,-23],[-70,-18],[-72,-15],[-76,-14],[-79,-6],[-81,-2],[-80,2],[-81,7]]
    },
    {
      id: 'mea', name: '中东与非洲', en: 'MIDDLE EAST & AFRICA', short: '中东非',
      weight: 0.07, x: 0.52, y: 0.58, w: 120, h: 110,
      desc: '新兴增量市场，专业与户外题材需求增长最快。',
      bias: { nikon: 1.2, canon: 1.15, sony: 1.05, fujifilm: 0.98, panasonic: 0.92, dji: 1.05, insta360: 0.98 },
      geo: [[-17,21],[-16,15],[-13,9],[-8,5],[-2,5],[4,6],[9,4],[9,0],[12,-6],[13,-11],[12,-17],[15,-22],[18,-29],[22,-34],[27,-34],[32,-29],[35,-24],[40,-16],[41,-11],[40,-5],[44,0],[48,3],[51,11],[44,12],[43,15],[48,20],[54,22],[57,25],[60,30],[56,36],[50,38],[44,40],[40,42],[36,37],[33,36],[30,31],[34,29],[38,22],[43,17],[43,12],[40,15],[37,20],[33,28],[28,31],[20,32],[13,34],[7,35],[0,36],[-6,35],[-10,31],[-14,27],[-17,21]]
    }
  ];
  const REGION_ORDER = REGIONS.map(r => r.id);
  const REGION_INDEX = {};
  REGIONS.forEach(r => { REGION_INDEX[r.id] = r; });

  const MARKET_EVENTS = [
    {
      id: 'retro_revival', title: '复古相机回潮', tag: '审美趋势', duration: 2,
      text: '社交平台上刮起胶片与复古相机风潮，年轻用户开始把相机当作穿搭配件。',
      effects: { demand: { retro: 1.28, compact: 1.08 } }, tone: 'good',
      geo: [[-17,21],[-16,12],[-8,5],[3,6],[9,4],[12,-5],[13,-14],[18,-22],[25,-34],[33,-30],[38,-20],[41,-10],[48,-2],[52,8],[44,12],[43,16],[50,22],[57,24],[60,30],[52,36],[44,40],[36,37],[30,31],[24,32],[10,34],[0,35],[-10,30],[-17,21]]
    },
    {
      id: 'sensor_shortage', title: '先进传感器产能紧张', tag: '供应链', duration: 2,
      text: 'AI 数据中心挤占了高端晶圆产能，堆栈式传感器的交期和成本同时上升。',
      effects: { sensorCost: 1.12, pressure: 1.03 }, tone: 'bad'
    },
    {
      id: 'creator_boom', title: '创作者经济继续扩张', tag: '需求侧', duration: 3,
      text: '短视频与独立内容创作持续增长，轻量视频机的需求被重新点燃。',
      effects: { demand: { vlog: 1.18, cinema: 1.06 } }, tone: 'good'
    },
    {
      id: 'sports_year', title: '全球体育大年', tag: '需求侧', duration: 2,
      text: '多项世界级赛事集中在接下来的赛季，体育与生态摄影器材迎来换机潮。',
      effects: { demand: { sports: 1.24, action: 1.1 } }, tone: 'good'
    },
    {
      id: 'material_inflation', title: '金属材料涨价', tag: '供应链', duration: 2,
      text: '铝、镁与稀土材料价格上行，金属机身的成本压力增加。',
      effects: { materialCost: 1.1 }, tone: 'bad'
    },
    {
      id: 'heatwave', title: '极端高温测试', tag: '品控', duration: 1,
      text: '多地区出现极端高温，用户开始重新审视相机的持续录制与散热表现。',
      effects: { thermalRisk: 1.25, demand: { vlog: 1.04, compact: 0.96 } }, tone: 'bad'
    },
    {
      id: 'aifocus_standard', title: 'AI 对焦成为新标配', tag: '技术趋势', duration: 2,
      text: '主流竞品开始普及主体识别对焦，消费者对“对焦表现”的期望被整体抬高。',
      effects: { afExpectation: 1.18 }, tone: 'neutral'
    },
    {
      id: 'fullframe_price_war', title: '全画幅价格战', tag: '竞争', duration: 2,
      text: '全画幅入门机型持续降价，用户的换机门槛进一步降低，利润空间却被压缩。',
      effects: { demand: { fullframe: 1.12 }, pricePressure: 1.06 }, tone: 'neutral'
    },
    {
      id: 'compact_comeback', title: '卡片机文艺复兴', tag: '审美趋势', duration: 2,
      text: '口袋相机重新成为社交货币，时尚品牌与摄影师开始联名合作。',
      effects: { demand: { compact: 1.22, retro: 1.08 } }, tone: 'good'
    },
    {
      id: 'cinema_streaming', title: '流媒体制作热潮', tag: '需求侧', duration: 3,
      text: '流媒体平台增加自制内容投入，中小型电影机与专业镜头需求上升。',
      effects: { demand: { cinema: 1.18, highres: 1.04 } }, tone: 'good'
    },
    {
      id: 'battery_recall', title: '供应链质量事件', tag: '品控', duration: 1,
      text: '某电池供应商出现批次问题，全行业品控标准被临时提高。',
      effects: { thermalRisk: 1.12, defectRisk: 1.08 }, tone: 'bad'
    },
    {
      id: 'heritage_award', title: '设计大奖季', tag: '设计', duration: 1,
      text: '国际工业设计奖项公布，优秀外观设计获得前所未有的媒体曝光。',
      effects: { designDemand: 1.12 }, tone: 'good'
    }
  ];

  const INITIAL_NEWS = [
    { tag: '时代', title: '2026 · 影像行业进入“体验竞争”', text: '参数差距缩小之后，外形、色彩与持机体验重新成为换机理由。' },
    { tag: '市场', title: '全画幅与 APS-C 仍是出货主力', text: '高端全画幅与轻量 APS-C 双线增长，消费者更愿意为“每天愿意带出门”的设计付费。' },
    { tag: '技术', title: 'AI 对焦与大尺寸传感器同步进化', text: '堆栈式传感器和 AI 识别正在把“拍得到”变成“拍得准”。' },
    { tag: '设计', title: '相机正在变回一件随身物品', text: '复古、金属、机械转盘和可换饰件的回潮，让工业设计重新成为产品核心。' }
  ];

  const MILESTONES = [
    { id: 'first_camera', name: '第一台相机', desc: '让第一款自研相机上市。', value: 'launchCamera', icon: 'camera' },
    { id: 'first_lens', name: '第一支镜头', desc: '让第一款自研镜头上市。', value: 'launchLens', icon: 'lens' },
    { id: 'units_10k', name: '月销破万', desc: '单月售出 10,000 台以上相机。', value: 'units10k', icon: 'chart' },
    { id: 'reputation_80', name: '口碑之作', desc: '品牌口碑达到 80。', value: 'rep80', icon: 'star' },
    { id: 'cash_1b', name: '十亿现金', desc: '现金储备达到 10 亿。', value: 'cash1b', icon: 'cash' },
    { id: 'portfolio_4', name: '完整矩阵', desc: '在 4 个产品品类中拥有在售产品。', value: 'portfolio4', icon: 'grid' },
    { id: 'tech_master', name: '技术纵深', desc: '任意 3 项技术达到 Lv.4。', value: 'tech4', icon: 'flask' },
    { id: 'top3', name: '跻身前五', desc: '市场份额进入全球前五。', value: 'top5', icon: 'trophy' },
    { id: 'cinema_debut', name: '片场入场券', desc: '发布一款专业电影机。', value: 'cinema', icon: 'film' }
  ];

  const CATEGORY_ORDER_DISPLAY = CATEGORY_ORDER.map(id => CATEGORIES[id]);

  window.FRAME_DATA = {
    CATEGORY_ORDER, CATEGORIES, CATEGORY_ORDER_DISPLAY, SEGMENTS, SEGMENTS_ARRAY,
    BODY_TYPES, SILHOUETTES, TOP_STYLES, FRONT_STYLES, MATERIALS, FINISHES,
    FRAME_TYPES, TOP_PLATES, COLORS, CONTROL_POSITIONS, CONTROLS, SCREEN_TYPES,
    VIEWFINDER_TYPES, VIEWFINDER_POSITIONS, MOUNTS, RING_MATERIALS, RING_COLORS,
    FRONT_DETAILS, ACCESSORIES, SENSOR_FORMATS, SENSOR_TYPES, SHUTTERS, AF_SYSTEMS,
    STABILIZATIONS, STORAGE_FORMATS, CARD_TYPES, VIDEO_RES, FPS_OPTIONS, CODECS,
    SCREEN_RES, GAMUTS, PORTS, WIRELESS, QC_TIERS, CERTIFICATIONS, CAMPAIGN_TIERS, BRAND_CAMPAIGNS,
    SENSOR_SUPPLIERS, ODM_PARTNERS, FACTORY_LEVELS, TECHS, TECH_ORDER, STAFF_ROLES,
    CHIP_LAB_LEVELS, CMOS_TARGETS, CMOS_BUDGETS, AF_ARCHITECTURES, AF_TIERS, CHIP_BUDGETS,
    AF_COVERAGE, AF_ARCH_TEMPLATE, AF_CHIPS, AF_FOUNDATIONS, AF_FOUNDATION_NAMES, CMOS_SENSORS,
    AF_STAGES, AF_INCIDENTS,
    LAUNCH_FORMATS, LAUNCH_CITIES, PRESS_TIERS, KOL_TIERS, EVENT_FOCUS, PREORDER_OPTIONS,
    STARTUP_STYLES, DIFFICULTIES, ARCHETYPES, LENS_TYPES, LENS_TYPES_ARRAY, LENS_MATERIALS, LENS_STYLES,
    LENS_STYLES_ARRAY, LENS_COATINGS, LENS_MOTORS, COMPANIES, AI_SERIES, MARKET_EVENTS,
    INITIAL_NEWS, MILESTONES, REGIONS, REGION_ORDER, REGION_INDEX
  };
})();
