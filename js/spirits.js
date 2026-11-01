/* =========================================================
   FRAME — 公司精神 v2
   按公司强弱分档：
     强势（索尼/佳能）  = 3 正面 + 1 负面
     中上（大疆/影石/富士/松下）= 2 正面 + 2 负面
     弱势（尼康）       = 1 正面 + 3 负面
     自建（新创）       = 1 正面 + 3 负面
   负面精神可以通过决策移除，正面精神可以通过决策新增。
   ========================================================= */
(function () {
  'use strict';

  const TIER = {
    sony: 'strong', canon: 'strong',
    dji: 'mid', insta360: 'mid', fujifilm: 'mid', panasonic: 'mid',
    nikon: 'weak', startup: 'weak'
  };
  const TIER_LABEL = { strong: '强势', mid: '中上', weak: '弱势' };

  const SPIRITS = {
    /* ============ 索尼：强势，只背 1 个包袱 ============ */
    sony: [
      { id: 'sony_sensor', name: '传感器卡特尔', kind: 'good', icon: '◆',
        desc: '全世界一半的高端 CMOS 出自你的晶圆厂，传感器成本远低于对手。',
        effects: { cost: { sensor: 0.84 }, rnd: 1.06 } },
      { id: 'sony_ai', name: 'AI 先手', kind: 'good', icon: '✦',
        desc: '最早把 AI 识别拆成独立芯片，追焦算法领先一个身位。',
        effects: { dsp: 0.9, tech: { af: 1 } } },
      { id: 'sony_eco', name: '内容生态', kind: 'good', icon: '◇',
        desc: '从传感器到内容平台，用户被一整套体系锁住。',
        effects: { demand: { fullframe: 1.06, vlog: 1.05 }, awareness: 0.1 } },
      { id: 'sony_bigcorp', name: '大企业病', kind: 'bad', icon: '▽',
        desc: '部门墙、会议、KPI。决策比小厂慢，团队效率被吃掉一部分。',
        effects: { talent: 0.94, salary: 1.03 } }
    ],

    /* ============ 佳能：强势，只背 1 个包袱 ============ */
    canon: [
      { id: 'canon_channel', name: '渠道之王', kind: 'good', icon: '◆',
        desc: '从一线城市到县城，佳能的柜台永远在最显眼的位置。',
        effects: { demand: { compact: 1.1, mirrorless: 1.06 }, awareness: 0.1 } },
      { id: 'canon_color', name: '直出色彩', kind: 'good', icon: '✦',
        desc: '肤色与直出色彩是婚礼与商业摄影的默认答案。',
        effects: { demand: { fullframe: 1.06, highres: 1.05 } } },
      { id: 'canon_lens', name: '镜头群霸主', kind: 'good', icon: '◇',
        desc: 'RF 卡口镜头数量与素质双强，用户换机也很难走人。',
        effects: { cost: { optics: 0.9 }, demand: { mirrorless: 1.04 } } },
      { id: 'canon_slow', name: '巨人迟缓', kind: 'bad', icon: '▽',
        desc: '体量太大，一代产品的转身要三年。研发进度偏慢。',
        effects: { rnd: 0.9, talent: 0.97 } }
    ],

    /* ============ 大疆：中上 ============ */
    dji: [
      { id: 'dji_supply', name: '供应链降维', kind: 'good', icon: '◆',
        desc: '用无人机供应链打相机，成本结构降一个维度。',
        effects: { cost: { total: 0.9 }, talent: 1.04 } },
      { id: 'dji_vision', name: '视觉算法', kind: 'good', icon: '✦',
        desc: '避障、跟随、构图，都是无人机上练出来的。',
        effects: { dsp: 0.93, demand: { action: 1.08, vlog: 1.05 } } },
      { id: 'dji_pro', name: '专业质疑', kind: 'bad', icon: '▽',
        desc: '片场不认"做无人机的那家"。专业市场门难进。',
        effects: { demand: { cinema: 0.9, highres: 0.92 } } },
      { id: 'dji_gear', name: '配件公司印象', kind: 'bad', icon: '▲',
        desc: '被当成配件厂，可换镜头生态的信任要慢慢攒。',
        effects: { demand: { mirrorless: 0.92 }, reputation: -0.05 } }
    ],

    /* ============ 影石：中上 ============ */
    insta360: [
      { id: 'insta_social', name: '社交基因', kind: 'good', icon: '◆',
        desc: '产品天生适合被分享，用户就是你的投放渠道。',
        effects: { demand: { action: 1.12, vlog: 1.06 }, awareness: 0.12 } },
      { id: 'insta_algo', name: '算法护城河', kind: 'good', icon: '✦',
        desc: '先拍摄后取景，后期重构镜头。这套算法别人短期抄不来。',
        effects: { tech: { software: 1 }, demand: { action: 1.05 } } },
      { id: 'insta_yield', name: '良率诅咒', kind: 'bad', icon: '▽',
        desc: '双芯片与双镜头结构，让良率始终是悬在头上的刀。',
        effects: { qc: 1.08, cost: { total: 1.03 } } },
      { id: 'insta_niche', name: '运动标签', kind: 'bad', icon: '▲',
        desc: '被当成"运动相机公司"，做正经相机时说服不了专业用户。',
        effects: { demand: { fullframe: 0.9, highres: 0.9 } } }
    ],

    /* ============ 富士：中上 ============ */
    fujifilm: [
      { id: 'fuji_color', name: '色彩信仰', kind: 'good', icon: '◆',
        desc: '胶片模拟是别人抄不走的东西，用户为一种颜色买单。',
        effects: { demand: { retro: 1.14, compact: 1.06 }, reputation: 0.08 } },
      { id: 'fuji_medium', name: '中画幅独苗', kind: 'good', icon: '✦',
        desc: '主流厂商里唯一认真做中画幅的，商业摄影绕不开你。',
        effects: { demand: { medium: 1.15 } } },
      { id: 'fuji_capacity', name: '产能瓶颈', kind: 'bad', icon: '▽',
        desc: 'X100VI 排队三个月。不是不想卖，是造不出来。',
        effects: { cost: { total: 1.04 }, demand: { compact: 0.95 } } },
      { id: 'fuji_niche', name: '小众天花板', kind: 'bad', icon: '▲',
        desc: '审美驱动，但规模有限。做大众市场时品牌溢价会打折。',
        effects: { demand: { mirrorless: 0.96 }, awareness: -0.04 } }
    ],

    /* ============ 松下：中上 ============ */
    panasonic: [
      { id: 'pana_video', name: '视频口碑', kind: 'good', icon: '◆',
        desc: '独立制片与视频博主心里，GH 系列是信仰。',
        effects: { demand: { cinema: 1.12, vlog: 1.06 }, reputation: 0.06 } },
      { id: 'pana_venus', name: '维纳斯引擎', kind: 'good', icon: '✦',
        desc: '色彩与散热的调校功力，让长时间录制更稳。',
        effects: { demand: { cinema: 1.05 }, cost: { total: 0.98 } } },
      { id: 'pana_island', name: '生态孤岛', kind: 'bad', icon: '▽',
        desc: 'L 卡口的镜头群始终不够厚，用户会被"镜头太少"劝退。',
        effects: { demand: { mirrorless: 0.93, fullframe: 0.96 } } },
      { id: 'pana_dfd', name: 'DFD 阴影', kind: 'bad', icon: '▲',
        desc: '反差对焦的历史包袱，让"松下对焦不行"的印象挥之不去。',
        effects: { dsp: 1.08, demand: { sports: 0.94 } } }
    ],

    /* ============ 尼康：弱势，3 个负面 ============ */
    nikon: [
      { id: 'nikon_optics', name: '光学名门', kind: 'good', icon: '◆',
        desc: '镜头是刻在基因里的东西。光学成本更低，高端定焦口碑极好。',
        effects: { cost: { optics: 0.9, total: 0.98 }, reputation: 0.05 } },
      { id: 'nikon_pride', name: '百年自负', kind: 'bad', icon: '▲',
        desc: '1917 年以来的光学骄傲，让尼康在算法时代慢了半拍。研发速度下降。',
        effects: { rnd: 0.86, chip: 0.9 } },
      { id: 'nikon_ai', name: 'AI 起步晚', kind: 'bad', icon: '▼',
        desc: '主体识别算法长期落后一档，追焦体验被对手拉开。',
        effects: { dsp: 1.08, demand: { sports: 0.95 } } },
      { id: 'nikon_dslr', name: '单反包袱', kind: 'bad', icon: '▽',
        desc: 'F 卡口积压的库存与产线，必须继续养着。现金流被拖住。',
        effects: { salary: 1.04, cost: { total: 1.02 } } }
    ],

    /* ============ 自建：弱势 ============ */
    startup: [
      { id: 'st_fresh', name: '白纸优势', kind: 'good', icon: '✦',
        desc: '没有历史包袱，可以选任何方向，决策极快。',
        effects: { rnd: 1.12, talent: 1.08 } },
      { id: 'st_nobody', name: '无名之辈', kind: 'bad', icon: '▽',
        desc: '没有品牌资产，渠道不带你玩，用户不认识你。',
        effects: { awareness: -0.1, demand: { mirrorless: 0.94 } } },
      { id: 'st_cash', name: '现金焦虑', kind: 'bad', icon: '▲',
        desc: '每一笔投入都要算回报，试错空间很小。',
        effects: { salary: 1.05, cost: { total: 1.02 } } },
      { id: 'st_eco', name: '无生态', kind: 'bad', icon: '▼',
        desc: '没有镜头群、没有老用户，生态从零开始建。',
        effects: { demand: { fullframe: 0.9, highres: 0.9 } } }
    ]
  };

  /* 决策可以新增的精神（不进初始列表，完成后写入 game.focus.extraSpirits） */
  const REWARD_SPIRITS = {
    // ===== 转型决策专属精神 =====
    optics_faith:    { name: '光学教团',   kind: 'good', icon: '◆', desc: '把光学做到极致，价格由你定。', effects: { cost: { optics: 0.85 }, reputation: 0.25, dsp: 1.04 } },
    digital_newbie:  { name: '电子新贵',   kind: 'good', icon: '✦', desc: '算法追上来了，对焦不再是短板。', effects: { dsp: 0.85, rnd: 1.15, cost: { optics: 1.08 } } },
    arms_dealer:     { name: '军火商',     kind: 'good', icon: '◈', desc: '把传感器卖给所有人，包括对手。', effects: { cost: { sensor: 0.78 }, cashGain: 6000000 } },
    empire_loop:     { name: '帝国闭环',   kind: 'good', icon: '◎', desc: '自己的传感器只给自己用。', effects: { cost: { sensor: 0.82 }, sharePush: { canon: 1.5 }, aiRelations: { canon: -40 } } },
    channel_king:    { name: '渠道之王',   kind: 'good', icon: '◫', desc: '柜台连到县城，谁都能买到。', effects: { demand: { compact: 1.18 }, cost: { total: 0.93 }, rnd: 0.92 } },
    tech_giant:      { name: '技术巨人',   kind: 'good', icon: '⚗', desc: '研发终于跑起来了。', effects: { rnd: 1.15, dsp: 0.9 } },
    color_cult:      { name: '色彩教团',   kind: 'good', icon: '✦', desc: '用户为一种颜色排队。', effects: { demand: { retro: 1.25 }, reputation: 0.3, cost: { total: 1.06 } } },
    scale_believer:  { name: '规模信徒',   kind: 'good', icon: '◫', desc: '不再小众，走量也能赚钱。', effects: { demand: { compact: 1.2 }, cost: { total: 0.94 } } },
    film_set:        { name: '片场正统',   kind: 'good', icon: '▶', desc: '剧组默认配置。', effects: { demand: { cinema: 1.25 }, reputation: 0.3 } },
    beyond_circle:   { name: '破圈者',     kind: 'good', icon: '◇', desc: '从片场走进客厅。', effects: { demand: { compact: 1.18, mirrorless: 1.08 }, cost: { total: 0.93 } } },
    dimension_hunter:{ name: '降维者',     kind: 'good', icon: '◈', desc: '用无人机供应链打相机。', effects: { cost: { total: 0.85 }, demand: { action: 1.25 } } },
    pro_newcomer:    { name: '专业新贵',   kind: 'good', icon: '★', desc: '片场终于认了你。', effects: { demand: { cinema: 1.3 }, reputation: 0.4, cost: { total: 1.05 } } },
    pano_only:       { name: '全景唯一',   kind: 'good', icon: '◉', desc: '全景就是你。', effects: { demand: { action: 1.3 }, tech: { software: 1 } } },
    mainstream:      { name: '主流玩家',   kind: 'good', icon: '◆', desc: '从运动相机杀进主流。', effects: { demand: { mirrorless: 1.22 }, awareness: 0.4 } },
    tech_devotee:    { name: '技术信徒',   kind: 'good', icon: '⚗', desc: '把一切都押在技术上。', effects: { rnd: 1.25, chip: 1.2 } },
    borrower:        { name: '借力者',     kind: 'good', icon: '↔', desc: '别人的供应链，自己的产品。', effects: { cost: { total: 0.85 }, demand: { mirrorless: 1.14 }, rnd: 0.9 } },

    chase_king: { name: '追焦王朝', kind: 'good', icon: '◎', desc: '对焦速度成为行业标杆。', effects: { dsp: 0.9, demand: { sports: 1.08 } } },
    imaging_throne: { name: '影像正统', kind: 'good', icon: '◉', desc: '画质与读出成为事实标准。', effects: { tech: { sensor: 1 }, demand: { highres: 1.08 } } },
    optics_empire: { name: '光学帝国', kind: 'good', icon: '◈', desc: '镜头群让别人无法忽视。', effects: { cost: { optics: 0.88 }, demand: { fullframe: 1.06 } } },
    stage_standard: { name: '片场标配', kind: 'good', icon: '▶', desc: '剧组默认配置。', effects: { demand: { cinema: 1.12 }, reputation: 0.08 } },
    national_brand: { name: '国民影像品牌', kind: 'good', icon: '★', desc: '品牌进入大众语境。', effects: { awareness: 0.2, demand: { compact: 1.08 } } },
    turn_around: { name: '扭亏为盈', kind: 'good', icon: '▲', desc: '财务纪律带来的长期红利。', effects: { cost: { total: 0.95 }, salary: 0.95 } },
    industry_lifeline: { name: '行业命脉', kind: 'good', icon: '◆', desc: '所有对手都要看你的供货脸色。', effects: { cashGain: 20000000, rnd: 1.08 } },
    rule_maker: { name: '规则制定者', kind: 'good', icon: '⌘', desc: '标准由你写。', effects: { reputation: 0.1, launch: { press: 1.06 } } },
    imaging_empire: { name: '影像帝国', kind: 'good', icon: '♛', desc: '版图覆盖全价位。', effects: { demand: { fullframe: 1.05, mirrorless: 1.05 }, awareness: 0.12 } },
    market_purge: { name: '市场肃清', kind: 'good', icon: '✖', desc: '重叠品类的对手被你清出场。', effects: { demand: { mirrorless: 1.08 }, sharePush: { canon: 1.2 } } },
    shadow_empire: { name: '影子帝国', kind: 'good', icon: '◐', desc: '没人喜欢你，但谁也绕不开你。', effects: { cost: { total: 0.93 }, reputation: -0.05 } },
    immortal_bird: { name: '不死鸟', kind: 'good', icon: '◇', desc: '现金流永远健康，熬得过任何一场战争。', effects: { salary: 0.94, cost: { total: 0.95 } } },
    ecology_king: { name: '生态之王', kind: 'good', icon: '❖', desc: '卡口标准由你定。', effects: { demand: { mirrorless: 1.1 }, reputation: 0.12 } }
  };

  function spiritsFor(brandId) { return SPIRITS[brandId] || SPIRITS.startup; }
  function tierOf(brandId) { return TIER[brandId] || 'weak'; }
  function tierLabel(t) { return TIER_LABEL[t] || '弱势'; }

  /* 计算某个公司当前生效的全部精神（初始 + 决策新增 - 决策移除） */
  function activeSpirits(game, brandId) {
    const id = brandId || (game && game.company && game.company.id);
    const base = spiritsFor(id).slice();
    const f = (game && game.focus) || {};
    const removed = f.removedSpirits || [];
    const extra = f.extraSpirits || [];
    const list = base.filter(s => removed.indexOf(s.id) < 0);
    extra.forEach(key => {
      const r = REWARD_SPIRITS[key];
      if (r && !list.some(s => s.id === key)) list.push(Object.assign({ id: key, reward: true }, r));
    });
    return list;
  }

  window.FRAME_SPIRITS = { SPIRITS, REWARD_SPIRITS, TIER, TIER_LABEL, spiritsFor, tierOf, tierLabel, activeSpirits };
})();
