/* =========================================================
   FRAME — 芯片型号库（每家厂商自有，无公用芯片）
   影像主处理器（含对焦运算）+ 可选独立 AI 芯片 + CMOS 型号
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     影像主处理器：对焦运算与 AI 识别都在这里。
     afScore / aiScore 是 0~100 的能力值，直接进入对焦评分。
     --------------------------------------------------------- */
  const PROCESSORS = {
    canon: [
      {
        id: 'digic-x', name: 'DIGIC X', en: 'DIGIC X', gen: 1, year: 2020,
        afIntegrated: true, aiChipId: null,
        afScore: 74, aiScore: 62, lockMs: 210, detectRange: 82,
        subjects: ['人眼', '面部', '动物', '车辆'],
        cost: 320, power: 1.0, techAf: 3,
        desc: '佳能微单世代的主力处理器，iTR AF X 识别算法集成在里面。'
      },
      {
        id: 'digic-x-accel', name: 'DIGIC X + DIGIC Accelerator', en: 'DIGIC X + ACCEL', gen: 2, year: 2024,
        afIntegrated: true, aiChipId: 'canon-accel', flagshipOnly: true,
        afScore: 90, aiScore: 90, lockMs: 120, detectRange: 94,
        subjects: ['人眼', '面部', '动物', '鸟', '车辆', '运动主体'],
        cost: 780, power: 1.22, techAf: 5,
        desc: 'R1 专属的 AI 加速单元，专门强化对焦与测光运算。民用机型不给，只有高端线才能解锁。'
      }
    ],
    sony: [
      {
        id: 'bionz-x', name: 'BIONZ X', en: 'BIONZ X', gen: 1, year: 2014,
        afIntegrated: true, aiChipId: null,
        afScore: 64, aiScore: 45, lockMs: 260, detectRange: 70,
        subjects: ['人眼', '面部'], cost: 240, power: 0.92, techAf: 2,
        desc: '老一代影像处理器，对焦运算集成，没有独立 AI 单元。'
      },
      {
        id: 'bionz-xr', name: 'BIONZ XR', en: 'BIONZ XR', gen: 2, year: 2020,
        afIntegrated: true, aiChipId: null,
        afScore: 82, aiScore: 70, lockMs: 175, detectRange: 86,
        subjects: ['人眼', '动物', '鸟', '车辆'], cost: 400, power: 1.05, techAf: 4,
        desc: '处理能力大幅提升，对焦追踪已经很快，但识别仍靠主处理器。'
      },
      {
        id: 'bionz-xr-aipu', name: 'BIONZ XR + AI Processing Unit', en: 'BIONZ XR + AI-PU', gen: 3, year: 2023,
        afIntegrated: true, aiChipId: 'sony-ai-pu',
        afScore: 96, aiScore: 97, lockMs: 95, detectRange: 99,
        subjects: ['人眼', '动物', '鸟', '车辆', '飞机', '昆虫'],
        cost: 690, power: 1.18, techAf: 5,
        desc: '行业最早把 AI 识别单独拆成一颗芯片。A7R5 之后全系下放，追焦是当前最强。'
      }
    ],
    nikon: [
      {
        id: 'expeed6', name: 'EXPEED 6', en: 'EXPEED 6', gen: 1, year: 2018,
        afIntegrated: true, aiChipId: null,
        afScore: 68, aiScore: 40, lockMs: 220, detectRange: 66,
        subjects: ['人眼', '面部'], cost: 260, power: 0.95, techAf: 3,
        desc: '单反世代积累的独立 AF 专用处理器的直系后代，单次对焦快，AI 识别起步晚。'
      },
      {
        id: 'expeed7', name: 'EXPEED 7', en: 'EXPEED 7', gen: 2, year: 2023,
        afIntegrated: true, aiChipId: null,
        afScore: 88, aiScore: 78, lockMs: 130, detectRange: 90,
        subjects: ['人眼', '动物', '鸟', '车辆'], cost: 460, power: 1.08, techAf: 4,
        desc: 'Z9/Z8/Z6III 世代。Multi-CAM 对焦模组经验 + EXPEED 7，追焦硬实力很强，但 AI 主体库仍比索尼薄。'
      }
    ],
    fujifilm: [
      {
        id: 'xproc4', name: 'X-Processor 4', en: 'X-PROCESSOR 4', gen: 1, year: 2018,
        afIntegrated: true, aiChipId: null,
        afScore: 62, aiScore: 48, lockMs: 250, detectRange: 72,
        subjects: ['人眼', '面部'], cost: 210, power: 0.9, techAf: 2,
        desc: '第四代处理器，识别能力有限，追焦一直是短板。'
      },
      {
        id: 'xproc5', name: 'X-Processor 5', en: 'X-PROCESSOR 5', gen: 2, year: 2022,
        afIntegrated: true, aiChipId: null,
        afScore: 84, aiScore: 86, lockMs: 165, detectRange: 93,
        subjects: ['人眼', '面部', '动物', '鸟', '昆虫', '无人机'],
        cost: 380, power: 1.02, techAf: 4,
        desc: '内置深度学习主体检测单元。鸟类、昆虫、无人机识别全部解锁，是富士逆袭的关键。'
      }
    ],
    panasonic: [
      {
        id: 'venus-dfd', name: 'Venus Engine（DFD）', en: 'VENUS DFD', gen: 1, year: 2019,
        afIntegrated: true, aiChipId: null,
        afScore: 56, aiScore: 42, lockMs: 300, detectRange: 64,
        subjects: ['人脸', '人体'], cost: 200, power: 0.88, techAf: 2,
        desc: '纯 DFD 反差对焦，视频向调校很强，但连续追焦会来回呼吸。'
      },
      {
        id: 'venus-ai', name: '新一代 Venus Engine + AI NPU', en: 'VENUS AI', gen: 2, year: 2024,
        afIntegrated: true, aiChipId: 'pana-npu',
        afScore: 83, aiScore: 84, lockMs: 158, detectRange: 90,
        subjects: ['人眼', '人体', '动物', '车辆'], cost: 420, power: 1.06, techAf: 4,
        desc: 'GH6 / S5M2 / S1M2 世代，内置 AI NPU，动物与车辆识别大幅补强，视频向依然是强项。'
      }
    ],
    dji: [
      {
        id: 'dji-vision', name: '自研视觉影像处理单元', en: 'DJI VISION SOC', gen: 1, year: 2023,
        afIntegrated: true, aiChipId: 'dji-npu',
        afScore: 86, aiScore: 88, lockMs: 140, detectRange: 96,
        subjects: ['人体', '人脸', '车辆', '运动物体', '天空'],
        cost: 300, power: 0.95, techAf: 4,
        desc: '云台相机把对焦运算和视觉识别做在同一个自研单元里：电机先锁人，芯片再追焦。'
      }
    ],
    insta360: [
      {
        id: 'pro-imaging', name: 'Pro Imaging Chip', en: 'PRO IMAGING', gen: 1, year: 2021,
        afIntegrated: true, aiChipId: null,
        afScore: 58, aiScore: 52, lockMs: 280, detectRange: 70,
        subjects: ['人体', '人脸'], cost: 170, power: 0.86, techAf: 2,
        desc: '负责对焦与降噪的专业影像芯片，单颗方案，成本友好。'
      },
      {
        id: 'pro-imaging-ai', name: 'Pro Imaging Chip + 独立 5nm AI Chip', en: 'DUAL AI CHIP', gen: 2, year: 2024,
        afIntegrated: true, aiChipId: 'insta-ai5',
        afScore: 88, aiScore: 92, lockMs: 145, detectRange: 95,
        subjects: ['人体', '人脸', '运动主体', '宠物'],
        cost: 520, power: 1.15, techAf: 4,
        desc: 'Ace Pro 2 的双 AI 芯片架构：一颗管道，一颗专门做主体追踪、防抖 AI 与智能对焦。贵，良率也有风险。'
      }
    ]
  };

  /* ---------------------------------------------------------
     独立 AI 识别芯片（只有部分厂商有）
     --------------------------------------------------------- */
  const AI_CHIPS = {
    'canon-accel': {
      id: 'canon-accel', name: 'DIGIC Accelerator', en: 'DIGIC ACCELERATOR', brand: 'canon', year: 2024,
      afBoost: 12, aiBoost: 18, cost: 260, power: 0.16, flagshipOnly: true,
      desc: 'R1 专属 AI 加速单元，民用机型不给。'
    },
    'sony-ai-pu': {
      id: 'sony-ai-pu', name: 'AI Processing Unit (AI-PU)', en: 'AI-PU', brand: 'sony', year: 2022,
      afBoost: 10, aiBoost: 22, cost: 220, power: 0.12,
      desc: '索尼独立 AI 识别芯片，实时识别与追踪的底层。'
    },
    'pana-npu': {
      id: 'pana-npu', name: 'Venus AI NPU', en: 'NPU', brand: 'panasonic', year: 2024,
      afBoost: 8, aiBoost: 14, cost: 150, power: 0.1,
      desc: '维纳斯引擎内置的 AI NPU 单元。'
    },
    'dji-npu': {
      id: 'dji-npu', name: '自研视觉 AI 芯片 + NPU', en: 'DJI NPU', brand: 'dji', year: 2023,
      afBoost: 12, aiBoost: 16, cost: 180, power: 0.1,
      desc: '消费端视觉 AI 芯片，负责智能跟拍、对焦与避障识别。'
    },
    'insta-ai5': {
      id: 'insta-ai5', name: '独立 5nm AI Chip', en: '5NM AI CHIP', brand: 'insta360', year: 2024,
      afBoost: 14, aiBoost: 20, cost: 300, power: 0.18,
      desc: '5nm 独立 AI 芯片，主体追踪与防抖 AI 全靠它。成本高、良率有风险。'
    }
  };

  /* ---------------------------------------------------------
     CMOS 型号库：像显卡一样按型号选，不再拖像素滑杆。
     readout: stacked 堆栈 / partial 半堆栈 / bsi 背照
     shutter: global 全域快门 / rolling 卷帘
     --------------------------------------------------------- */
  const CMOS_MODELS = {
    canon: [
      { id: 'canon-dgo45', name: 'CMOS DGO 45MP', en: 'DGO 45MP', format: 'ff', mp: 45, readout: 'stacked', shutter: 'rolling', dr: 14.4, colorDepth: 14, year: 2024, tier: 'flagship', cost: 980, tech: 4, desc: '佳能自产全画幅堆栈，双增益读出，动态范围极强。' },
      { id: 'canon-32', name: 'CMOS 32MP 背照', en: 'BSI 32MP', format: 'ff', mp: 32, readout: 'bsi', shutter: 'rolling', dr: 13.2, colorDepth: 14, year: 2023, tier: 'mid', cost: 620, tech: 3, desc: '主流全画幅背照式，成本与画质平衡。' },
      { id: 'canon-24', name: 'CMOS 24MP 背照', en: 'BSI 24MP', format: 'ff', mp: 24, readout: 'bsi', shutter: 'rolling', dr: 13.6, colorDepth: 14, year: 2022, tier: 'value', cost: 460, tech: 2, desc: '高感光优先的入门全画幅方案。' },
      { id: 'canon-apsc33', name: 'CMOS APS-C 33MP', en: 'APS-C 33MP', format: 'apsc', mp: 33, readout: 'bsi', shutter: 'rolling', dr: 12.8, colorDepth: 14, year: 2023, tier: 'mid', cost: 320, tech: 2, desc: 'APS-C 高像素方案，适合入门与视频。' }
    ],
    sony: [
      { id: 'imx610', name: 'IMX610 50MP 堆栈', en: 'IMX610', format: 'ff', mp: 50, readout: 'stacked', shutter: 'rolling', dr: 14.8, colorDepth: 14, year: 2024, tier: 'flagship', cost: 1020, tech: 5, desc: '索尼半导体旗舰全画幅堆栈，读出速度极快。' },
      { id: 'imx820', name: 'IMX820 33MP 背照', en: 'IMX820', format: 'ff', mp: 33, readout: 'bsi', shutter: 'rolling', dr: 14.2, colorDepth: 14, year: 2022, tier: 'mid', cost: 640, tech: 3, desc: '主流全画幅背照，A7 系列的主力。' },
      { id: 'imx-r61', name: 'IMX 61MP 堆栈', en: 'IMX 61MP', format: 'ff', mp: 61, readout: 'stacked', shutter: 'rolling', dr: 14.6, colorDepth: 14, year: 2024, tier: 'highres', cost: 1180, tech: 5, desc: '高像素商业机专用，细节与宽容度兼顾。' },
      { id: 'imx-global', name: 'IMX 全域快门 24MP', en: 'GLOBAL 24MP', format: 'ff', mp: 24, readout: 'stacked', shutter: 'global', dr: 13.4, colorDepth: 14, year: 2025, tier: 'sports', cost: 1360, tech: 5, desc: '全域快门，果冻效应彻底消失，体育与视频的最优解。' },
      { id: 'imx6700', name: 'IMX APS-C 26MP 堆栈', en: 'APS-C 26MP', format: 'apsc', mp: 26, readout: 'stacked', shutter: 'rolling', dr: 13.0, colorDepth: 14, year: 2024, tier: 'mid', cost: 380, tech: 3, desc: 'APS-C 堆栈方案，速度机与视频机可用。' }
    ],
    nikon: [
      { id: 'imx820-n', name: 'IMX820 定制 45MP 背照', en: 'IMX820 CUSTOM', format: 'ff', mp: 45, readout: 'bsi', shutter: 'rolling', dr: 14.9, colorDepth: 14, year: 2024, tier: 'highres', cost: 860, tech: 4, desc: '与索尼半导体联合定制的背照式全画幅，尼康有独家读出设定。' },
      { id: 'nikon-24', name: 'CMOS 24MP 背照', en: 'BSI 24MP', format: 'ff', mp: 24, readout: 'bsi', shutter: 'rolling', dr: 14.0, colorDepth: 14, year: 2023, tier: 'mid', cost: 520, tech: 3, desc: 'Z6 世代主力，高感与动态范围优秀。' },
      { id: 'nikon-45s', name: 'CMOS 45MP 堆栈', en: 'STACKED 45MP', format: 'ff', mp: 45, readout: 'stacked', shutter: 'rolling', dr: 14.3, colorDepth: 14, year: 2025, tier: 'sports', cost: 1040, tech: 5, desc: '为速度机准备的堆栈方案，读出速度优先。' },
      { id: 'nikon-apsc21', name: 'CMOS APS-C 21MP', en: 'APS-C 21MP', format: 'apsc', mp: 21, readout: 'bsi', shutter: 'rolling', dr: 12.6, colorDepth: 14, year: 2023, tier: 'value', cost: 300, tech: 2, desc: '入门 APS-C，成本低、可靠。' }
    ],
    fujifilm: [
      { id: 'xtrans5', name: 'X-Trans 5 HR 40MP', en: 'X-TRANS 5 HR', format: 'apsc', mp: 40, readout: 'bsi', shutter: 'rolling', dr: 13.2, colorDepth: 14, year: 2022, tier: 'highres', cost: 460, tech: 3, desc: '富士自家 X-Trans 结构，色彩与摩尔纹方案独特。' },
      { id: 'xtrans5s', name: 'X-Trans 5 HS 26MP 堆栈', en: 'X-TRANS 5 HS', format: 'apsc', mp: 26, readout: 'stacked', shutter: 'rolling', dr: 13.0, colorDepth: 14, year: 2022, tier: 'sports', cost: 520, tech: 4, desc: '堆栈版 X-Trans，为速度与视频准备。' },
      { id: 'gfx102', name: 'GFX 102MP BSI', en: 'GFX 102MP', format: 'mf', mp: 102, readout: 'bsi', shutter: 'rolling', dr: 15.0, colorDepth: 16, year: 2023, tier: 'medium', cost: 2600, tech: 4, desc: '中画幅大像场，商业与风景的终极工具。' },
      { id: 'gfx50', name: 'GFX 50MP BSI', en: 'GFX 50MP', format: 'mf', mp: 50, readout: 'bsi', shutter: 'rolling', dr: 14.6, colorDepth: 16, year: 2021, tier: 'medium', cost: 1600, tech: 3, desc: '中画幅入门方案，把门槛拉低。' }
    ],
    panasonic: [
      { id: 'pana-24dg', name: 'CMOS 24MP 双增益', en: 'DUAL GAIN 24MP', format: 'ff', mp: 24, readout: 'bsi', shutter: 'rolling', dr: 14.6, colorDepth: 14, year: 2023, tier: 'video', cost: 620, tech: 3, desc: '双原生 ISO，视频动态范围是松下的招牌。' },
      { id: 'pana-47', name: 'CMOS 47MP 背照', en: 'BSI 47MP', format: 'ff', mp: 47, readout: 'bsi', shutter: 'rolling', dr: 14.2, colorDepth: 14, year: 2024, tier: 'highres', cost: 880, tech: 4, desc: '高像素全画幅，S1R 世代。' },
      { id: 'pana-m43', name: 'M43 25MP 背照', en: 'M43 25MP', format: 'm43', mp: 25, readout: 'bsi', shutter: 'rolling', dr: 13.0, colorDepth: 12, year: 2023, tier: 'video', cost: 340, tech: 2, desc: 'M43 画幅，机身体积与散热优势明显。' },
      { id: 'pana-organic', name: '有机 CMOS 24MP', en: 'ORGANIC 24MP', format: 'ff', mp: 24, readout: 'stacked', shutter: 'global', dr: 15.4, colorDepth: 16, year: 2026, tier: 'experimental', cost: 2100, tech: 5, desc: '有机感光层，全域快门与超高动态范围，但成本与良率都很极端。' }
    ],
    dji: [
      { id: 'dji-1inch', name: '1 英寸 20MP BSI', en: '1" 20MP', format: 'one', mp: 20, readout: 'bsi', shutter: 'rolling', dr: 12.4, colorDepth: 12, year: 2023, tier: 'action', cost: 260, tech: 2, desc: '一英寸大底塞进小机身，云台机主力。' },
      { id: 'dji-113', name: '1/1.3" 48MP BSI', en: '1/1.3" 48MP', format: 'one', mp: 48, readout: 'bsi', shutter: 'rolling', dr: 12.0, colorDepth: 12, year: 2024, tier: 'action', cost: 190, tech: 2, desc: '高像素小底，读速度快，适合运动与算法合成。' },
      { id: 'dji-aps', name: 'APS-C 20MP 堆栈', en: 'APS-C 20MP', format: 'apsc', mp: 20, readout: 'stacked', shutter: 'rolling', dr: 13.4, colorDepth: 14, year: 2025, tier: 'action', cost: 480, tech: 3, desc: '为云台电影机准备的画幅升级。' }
    ],
    insta360: [
      { id: 'insta-dual', name: '双 1/2" 20MP 全景', en: 'DUAL 1/2" 20MP', format: 'one', mp: 20, readout: 'bsi', shutter: 'rolling', dr: 12.2, colorDepth: 12, year: 2024, tier: 'panorama', cost: 320, tech: 2, desc: '两颗传感器同步曝光，靠算法拼成全景。' },
      { id: 'insta-113', name: '1/1.3" 48MP BSI', en: '1/1.3" 48MP', format: 'one', mp: 48, readout: 'bsi', shutter: 'rolling', dr: 12.0, colorDepth: 12, year: 2024, tier: 'action', cost: 200, tech: 2, desc: 'Ace Pro 系列的单机方案，画质与体积平衡。' },
      { id: 'insta-1inch', name: '1 英寸 16MP BSI', en: '1" 16MP', format: 'one', mp: 16, readout: 'bsi', shutter: 'rolling', dr: 13.0, colorDepth: 12, year: 2025, tier: 'action', cost: 340, tech: 3, desc: '大底低像素，暗光表现最好。' }
    ],
    startup: []
  };

  function processorsFor(brandId) { return PROCESSORS[brandId] || PROCESSORS.sony; }
  function defaultProcessor(brandId) {
    const list = processorsFor(brandId);
    return list[list.length - 1] || list[0];
  }
  function processorById(brandId, id) {
    return processorsFor(brandId).find(p => p.id === id) || null;
  }
  function cmosModelsFor(brandId) {
    const list = CMOS_MODELS[brandId];
    if (list && list.length) return list;
    // 自建公司：可以从公开型号里挑，都是别家的现货
    return Object.keys(CMOS_MODELS)
      .filter(k => k !== 'startup' && k !== brandId)
      .reduce((acc, k) => acc.concat(CMOS_MODELS[k]), [])
      .slice(0, 10);
  }
  function cmosModelById(brandId, id) {
    const list = cmosModelsFor(brandId);
    return list.find(m => m.id === id) || list[0] || null;
  }
  function aiChipById(id) { return AI_CHIPS[id] || null; }

  window.FRAME_CHIPS = {
    PROCESSORS, AI_CHIPS, CMOS_MODELS,
    processorsFor, defaultProcessor, processorById,
    cmosModelsFor, cmosModelById, aiChipById
  };
})();
