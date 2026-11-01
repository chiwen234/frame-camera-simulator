/* =========================================================
   FRAME — 架空历史事件系统
   三类事件：
     world   世界大事：所有厂商都收到播报
     private 国策完成：只有自己收到
     intel   对手动向：情报覆盖到的人收到
   触发方式：
     1. 按月触发（日期表）
     2. 决策完成后触发（focus 事件）
     3. 满足条件触发（份额/现金等）
   ========================================================= */
(function () {
  'use strict';

  const E = () => window.GameEngine;

  /* ---------------- 世界大事（按月） ---------------- */
  // m: 2026.01 起算的月份序号（0 = 2026.01）
  const WORLD = [
    { m: 0, id: 'w_quota', title: '索尼收紧传感器配额', tag: '紧急',
      text: '索尼半导体发布年度配额令，高端 CMOS 优先供应自家影像部门与两家"战略伙伴"，其余客户交期延长三个月。业内解读：这是在为下一代全域快门传感器锁死供应链。',
      options: [
        { label: '接受现实，调整排产', effects: { cost: { sensor: 1.06 } } },
        { label: '转投国产传感器', effects: { cost: { sensor: 1.02 }, reputation: -0.05 } },
        { label: '立即启动自研', effects: { rnd: 1.08, cash: -300000000 } }
      ] },
    { m: 1, id: 'w_leak', title: 'RF 卡口白皮书泄露', tag: '重大',
      text: '一份标注"内部讨论稿"的佳能文件流出，内容涉及 RF 卡口对第三方厂商的授权方案。佳能尚未回应，副厂股价应声上涨。',
      options: [
        { label: '公开支持开放', effects: { demand: { mirrorless: 1.06 }, reputation: 0.1 } },
        { label: '保持沉默', effects: {} }
      ] },
    { m: 2, id: 'w_cut', title: '索尼断供，行业震动', tag: '紧急',
      text: '供货削减 40%，即刻生效。尼康全画幅产线停摆，松下 S 系列延期。一位不愿具名的索尼高管说：「我们只是优先照顾自己人。」',
      options: [
        { label: '抗议并联合施压', effects: { aiRelations: { panasonic: 15, nikon: 15 }, reputation: 0.08 } },
        { label: '忍下，另寻供应', effects: { cost: { total: 1.04 } } }
      ] },
    { m: 3, id: 'w_meeting', title: '七厂东京密会，未达成共识', tag: '重大',
      text: '七家厂商代表在东京密会四小时，议题是"如何应对供应链被卡脖子"。据称会议没有达成任何联合声明，因为「有人中途离席」。',
      options: [
        { label: '加入采购联盟', effects: { cost: { sensor: 0.94 }, aiRelations: { panasonic: 10, insta360: 10 } } },
        { label: '单独谈判', effects: { cash: 50000000 } },
        { label: '把消息卖给索尼', effects: { cash: 120000000, reputation: -0.1, aiRelations: { nikon: -20 } } }
      ] },
    { m: 5, id: 'w_mount', title: '佳能做出选择', tag: '重大',
      text: '佳能正式公布 RF 卡口授权政策。开放阵营认为这是行业标准化的开始，封闭派警告"这是把利润拱手让人"。索尼连夜召开紧急会议。',
      options: [
        { label: '这是行业的好消息', effects: { demand: { mirrorless: 1.05 } } },
        { label: '这是垄断的前奏', effects: { reputation: 0.05 } }
      ] },
    { m: 7, id: 'w_dji', title: '大疆发布全画幅机身', tag: '重大',
      text: '一家做无人机的公司，做出了一台全画幅可换镜机身，价格比同级日系产品低 30%。某记者问"你们会做镜头吗"，大疆的回答是："我们会做生态。"',
      options: [
        { label: '降价应对', effects: { cost: { total: 0.96 }, revenue: 0.94 } },
        { label: '守住价格', effects: { demand: { fullframe: 0.96 } } }
      ] },
    { m: 9, id: 'w_quake', title: '熊本地震，索尼产线停产', tag: '紧急',
      text: '熊本强震，索尼影像传感器主力工厂停产，预计六周恢复。全行业缺货，谁有库存谁是王。',
      options: [
        { label: '抢产能囤货', effects: { cash: -200000000, cost: { sensor: 0.94 } } },
        { label: '按兵不动', effects: { demand: { mirrorless: 0.95 } } }
      ] },
    { m: 11, id: 'w_report', title: '2026 年度报告：三家厂商份额下滑', tag: '行业',
      text: '行业总出货量下降 4%，但头部集中度上升 6 个百分点。供应链能力第一次比产品力更重要。',
      options: [{ label: '知道了', effects: {} }] },
    { m: 13, id: 'w_antitrust', title: '反垄断调查启动', tag: '紧急',
      text: '日本公平交易委员会对高端 CMOS 供货限制正式立案。若认定成立，相关企业可能被强制授权核心技术。',
      options: [
        { label: '配合调查', effects: { reputation: 0.05 } },
        { label: '游说拖延', effects: { cash: -150000000, reputation: -0.08 } }
      ] },
    { m: 15, id: 'w_red', title: '尼康把 RED 装进了 Z 卡口', tag: '重大',
      text: '4 万元、8K RAW 内录、全画幅。三家好莱坞租赁公司宣布转向尼康。松下的两个剧组连夜改签，索尼 FX 系列经销商开始降价清库存。',
      options: [
        { label: '跟进电影机路线', effects: { demand: { cinema: 1.08 }, rnd: 1.05 } },
        { label: '专注照片市场', effects: { demand: { highres: 1.05 } } }
      ] },
    { m: 17, id: 'w_japan', title: '日本地震，供应链二次断裂', tag: '紧急',
      text: '继熊本之后，又一处精密零件工厂受灾。镜片玻璃交期从 8 周拉长到 20 周。',
      options: [
        { label: '高价抢料', effects: { cash: -180000000, cost: { optics: 0.95 } } },
        { label: '减产等待', effects: { demand: { mirrorless: 0.94 } } }
      ] },
    { m: 19, id: 'w_export', title: '出口管制升级', tag: '紧急',
      text: '高端影像传感器被列入出口管制清单。跨国供应链被迫重组，本地化生产成为唯一出路。',
      options: [
        { label: '启动本地化', effects: { cash: -250000000, cost: { total: 0.96 } } },
        { label: '转口贸易', effects: { cash: 100000000, reputation: -0.12 } }
      ] },
    { m: 21, id: 'w_merge', title: '影石与大疆传出合并谈判', tag: '重大',
      text: '两家中国影像公司被曝正在接触。若合并成真，将成为全球第三大影像集团。',
      options: [
        { label: '撮合并购', effects: {} },
        { label: '从中作梗', effects: { cash: -80000000, aiRelations: { insta360: -20, dji: -20 } } }
      ] },
    { m: 23, id: 'w_report2', title: '2027 年度报告：供应链决定生死', tag: '行业',
      text: '这一年，没有人靠产品赢，所有人靠产能活。',
      options: [{ label: '知道了', effects: {} }] },
    { m: 25, id: 'w_congress', title: '全球影像标准大会', tag: '重大',
      text: 'ISO 影像标准委员会将重写卡口与元数据规范。谁能进入起草组，谁就定义下一个十年。',
      options: [
        { label: '争夺起草席位', effects: { cash: -120000000, reputation: 0.15 } },
        { label: '联合盟友推举', effects: { aiRelations: { panasonic: 10, fujifilm: 10 } } }
      ] },
    { m: 27, id: 'w_final', title: '最后一次行业洗牌', tag: '紧急',
      text: '渠道、供应链、标准三条战线同时收紧。弱者在这一季彻底出局。',
      options: [{ label: '全力冲刺', effects: { cost: { total: 0.97 }, rnd: 1.08 } }] },
    { m: 29, id: 'w_end', title: '新秩序', tag: '终局',
      text: '两年半的混战结束。行业格局已经重写，剩下的名字，都是活下来的。',
      options: [{ label: '进入终局结算', effects: {} }] }
  ];

  /* ---------------- 决策完成触发（每家专属） ---------------- */
  // nodeMatcher: 国策标题包含的关键词
  const FOCUS_EVENTS = {
    nikon: [
      { match: '断腕清库存', id: 'n_dslr', title: 'F 卡口遗老造反', tag: '内部',
        text: '三十年工龄的镜头师傅集体请辞。媒体标题写着：「尼康背叛了光学。」',
        options: [
          { label: '公开致敬，追加补偿', effects: { cash: -150000000, reputation: 0.2 } },
          { label: '放行，让新血上位', effects: { reputation: -0.25, rnd: 1.08 } }
        ] },
      { match: '影像正统加冕', id: 'n_king', title: '尼康价', tag: '市场',
        text: '二手 Z9 被炒到官方价 1.5 倍。黄牛在官网门口收机器。',
        options: [
          { label: '官方加价', effects: { revenue: 1.08, demand: { highres: 0.96 } } },
          { label: '严格控价', effects: { reputation: 0.12 } }
        ] },
      { match: '追焦王朝加冕', id: 'n_af', title: '算法团队的背叛', tag: '内部',
        text: '从索尼挖来的团队被发现仍在向老东家传数据。',
        options: [
          { label: '起诉到底', effects: { aiRelations: { sony: -40 }, rnd: 0.96 } },
          { label: '私了，继续用', effects: { rnd: -0.05 } }
        ] }
    ],
    sony: [
      { match: '断供按钮', id: 's_cut', title: '反垄断调查文件送达', tag: '监管',
        text: '公平交易委员会要求索尼提交近三年供货合同。半导体部门拒绝对外评论。',
        options: [
          { label: '配合', effects: { reputation: 0.05, cash: -100000000 } },
          { label: '硬扛', effects: { cash: -400000000, sharePush: { canon: 1.3 } } }
        ] },
      { match: '帝国闭环加冕', id: 's_loop', title: '兄弟阋墙', tag: '内部',
        text: '影像部门要求优先供货，半导体部门拒绝。集团内部会议不欢而散。',
        options: [
          { label: '站影像部门', effects: { cost: { sensor: 0.9 }, revenue: 0.96 } },
          { label: '站半导体部门', effects: { cash: 300000000, cost: { sensor: 1.05 } } }
        ] },
      { match: '行业命脉加冕', id: 's_tax', title: '索尼税', tag: '行业',
        text: '全行业开始把"索尼溢价"写进成本模型。你成了别人财报里的一个负数。',
        options: [
          { label: '继续加价', effects: { cash: 500000000, reputation: -0.2 } },
          { label: '让利稳住客户', effects: { cost: { sensor: 0.94 }, reputation: 0.15 } }
        ] }
    ],
    canon: [
      { match: '封闭 RF', id: 'c_lock', title: '副厂大逃亡', tag: '行业',
        text: '适马、腾龙同时宣布转向索尼 E 卡口。佳能镜头群第一次出现"孤岛"这个词。',
        options: [
          { label: '认错，开放授权', effects: { demand: { mirrorless: 1.08 }, revenue: 0.94 } },
          { label: '加倍封锁', effects: { cash: 200000000, reputation: -0.15 } }
        ] },
      { match: '开放授权', id: 'c_open', title: '经销商造反', tag: '内部',
        text: '全国 300 家经销商联名反对开放卡口，怕利润被摊薄。',
        options: [
          { label: '补贴渠道', effects: { cash: -200000000, demand: { compact: 1.06 } } },
          { label: '直营革命', effects: { demand: { compact: 0.94 }, revenue: 1.08 } }
        ] },
      { match: '巨人的第二次呼吸', id: 'c_board', title: '董事会政变', tag: '内部',
        text: '保守派要求撤换影像事业部负责人。改革派只剩最后一次表决。',
        options: [
          { label: '支持改革', effects: { rnd: 1.15, talent: 0.94 } },
          { label: '妥协换稳定', effects: { rnd: 0.95, salary: 0.95 } }
        ] }
    ],
    fujifilm: [
      { match: '限量发售', id: 'f_hype', title: '黄牛帝国', tag: '市场',
        text: 'X100VII 被炒到 3 倍价，用户在官网留言：「你们是在卖相机还是在炒币？」',
        options: [
          { label: '维持神话', effects: { revenue: 1.1, reputation: -0.15 } },
          { label: '加大供给', effects: { cost: { total: 1.04 }, reputation: 0.15 } }
        ] },
      { match: '第三工厂', id: 'f_factory', title: '环保审查', tag: '监管',
        text: '新工厂因排污被举报停建。审查组已经进场。',
        options: [
          { label: '追加环保投入', effects: { cash: -200000000, cost: { total: 0.96 } } },
          { label: '转移到海外', effects: { cash: -120000000, reputation: -0.1 } }
        ] },
      { match: '色彩信仰加冕', id: 'f_secret', title: '富士胶片的秘密', tag: '媒体',
        text: '记者挖出：胶片模拟的色彩数据其实来自医疗影像部门。信徒们开始怀疑信仰。',
        options: [
          { label: '反手营销', effects: { awareness: 0.3, reputation: 0.1 } },
          { label: '沉默', effects: { reputation: -0.12 } }
        ] }
    ],
    panasonic: [
      { match: '片场正统', id: 'p_set', title: '剧组毁约', tag: '危机',
        text: '一个剧组因对焦问题当众换机，视频在行业群里疯传。',
        options: [
          { label: '免费换新', effects: { cash: -80000000, reputation: 0.2 } },
          { label: '起诉对方造谣', effects: { reputation: -0.15 } }
        ] },
      { match: '结盟大疆', id: 'p_dji', title: '联盟内讧', tag: '内部',
        text: 'L 卡口联盟内部反对松下的开放标准，徕卡与适马要求重新谈判。',
        options: [
          { label: '让步', effects: { cost: { optics: 1.04 }, demand: { mirrorless: 1.06 } } },
          { label: '强推', effects: { demand: { mirrorless: 1.1 }, aiRelations: { dji: -20 } } }
        ] },
      { match: '生态成型加冕', id: 'p_sell', title: '要不要卖掉相机', tag: '内部',
        text: '董事会正式提案剥离影像业务。会议室里没人看你的眼睛。',
        options: [
          { label: '独立出去', effects: { cash: -300000000, rnd: 1.15 } },
          { label: '接受集团安排', effects: { salary: 0.94, rnd: 0.95 } }
        ] }
    ],
    dji: [
      { match: '第一台正经相机', id: 'd_first', title: '专业媒体集体差评', tag: '媒体',
        text: '三家权威媒体给出一致评价：「参数漂亮，味道不对。」',
        options: [
          { label: '认错改进', effects: { rnd: 1.1, demand: { cinema: 0.95 } } },
          { label: '买通评测', effects: { cash: -100000000, reputation: -0.2 } }
        ] },
      { match: '影像学院', id: 'd_poach', title: '挖角风暴', tag: '行业',
        text: '尼康、佳能、松下的工程师被成批挖走。日经称这是"影像行业的人才地震"。',
        options: [
          { label: '加薪留人', effects: { salary: 1.12, talent: 1.08 } },
          { label: '加速挖角', effects: { cash: -150000000, rnd: 1.12, aiRelations: { nikon: -20, canon: -20 } } }
        ] },
      { match: '天空之眼加冕', id: 'd_ban', title: '无人机的影子', tag: '监管',
        text: '大疆相机被部分市场限制采购，理由是"数据安全"。',
        options: [
          { label: '本地化生产', effects: { cash: -250000000, cost: { total: 1.06 } } },
          { label: '提起诉讼', effects: { cash: -80000000, reputation: 0.15 } }
        ] }
    ],
    insta360: [
      { match: '8K 暴力', id: 'i_yield', title: '良率崩盘', tag: '危机',
        text: '首批 X7 退货率 18%，论坛炸锅。售后电话被打爆。',
        options: [
          { label: '全面召回', effects: { cash: -120000000, reputation: 0.18 } },
          { label: '降价补偿', effects: { revenue: 0.94, qc: 1.06 } }
        ] },
      { match: '杀入主流', id: 'i_label', title: '运动标签反噬', tag: '市场',
        text: '主业运动机被解说成"不务正业"。老用户开始怀念那个只做全景的影石。',
        options: [
          { label: '双线并行', effects: { cost: { total: 1.06 }, demand: { action: 1.08 } } },
          { label: '全力主流', effects: { demand: { mirrorless: 1.12, action: 0.88 } } }
        ] },
      { match: '全景标准加冕', id: 'i_std', title: '标准之争', tag: '行业',
        text: '大疆联合三家厂商推出竞争标准。你的标准可能活不过这个季度。',
        options: [
          { label: '硬碰硬', effects: { cash: -100000000, reputation: 0.2 } },
          { label: '兼容对方', effects: { demand: { action: 1.1 }, reputation: -0.1 } }
        ] }
    ],
    startup: [
      { match: 'A 轮融资', id: 't_bet', title: '一亿美元的绳子', tag: '资本',
        text: '投资人要求在 18 个月内做出自研芯片，否则触发回购条款。',
        options: [
          { label: '签了对赌', effects: { rnd: 1.25, chip: 1.15, cash: 200000000 } },
          { label: '拒绝，自己扛', effects: { cash: -50000000, reputation: 0.1 } }
        ] },
      { match: '技术孤注', id: 't_leave', title: '核心工程师走了', tag: '危机',
        text: '首席传感器工程师被索尼挖走，带走了三个关键参数。',
        options: [
          { label: '竞业诉讼', effects: { cash: -60000000, rnd: 0.94 } },
          { label: '加薪挽留团队', effects: { salary: 1.1, talent: 1.08 } }
        ] },
      { match: '不可忽视加冕', id: 't_offer', title: '巨头的邀请', tag: '终局',
        text: '索尼提议注资 80 亿，条件是控股 51%。签字笔就放在桌上。',
        options: [
          { label: '接受注资', effects: { cash: 800000000, rnd: 0.92 } },
          { label: '拒绝，独立到底', effects: { reputation: 0.2, aiRelations: { sony: -30 } } }
        ] }
    ]
  };

  /* ---------------- 工具 ---------------- */
  function monthOf(game) {
    return Number(game.monthIndex || 0);
  }

  function dateOf(game) {
    const m = monthOf(game);
    return { year: 2026 + Math.floor(m / 12), month: (m % 12) + 1 };
  }

  function ensureState(game) {
    if (!game.events) game.events = { fired: [], pending: [], log: [] };
    if (!game.events.fired) game.events.fired = [];
    if (!game.events.log) game.events.log = [];
    return game.events;
  }

  function pushNews(game, item) {
    if (!game.news) game.news = [];
    game.news.unshift(item);
    if (game.news.length > 80) game.news.length = 80;
  }

  /* ---------------- 按月检查 ---------------- */
  function checkMonth(game) {
    const st = ensureState(game);
    const m = monthOf(game);
    const out = [];
    WORLD.forEach(function (ev) {
      if (ev.m > m) return;   // 到期即触发，漏掉的也会补上
      if (st.fired.indexOf(ev.id) >= 0) return;
      st.fired.push(ev.id);
      st.pending.push(ev.id);
      out.push(ev);
    });
    return out;
  }

  /* ---------------- 决策完成后触发 ---------------- */
  function onFocusComplete(game, node) {
    const st = ensureState(game);
    const brand = game.company.id;
    const list = FOCUS_EVENTS[brand] || [];
    const hits = list.filter(function (ev) {
      return node.title.indexOf(ev.match) >= 0 && st.fired.indexOf(ev.id) < 0;
    });
    hits.forEach(function (ev) { st.fired.push(ev.id); st.pending.push(ev.id); });
    return hits;
  }

  /* ---------------- 取事件对象 ---------------- */
  function findEvent(id) {
    var hit = WORLD.filter(function (e) { return e.id === id; })[0];
    if (hit) return hit;
    var all = [];
    Object.keys(FOCUS_EVENTS).forEach(function (k) { all = all.concat(FOCUS_EVENTS[k]); });
    return all.filter(function (e) { return e.id === id; })[0] || null;
  }

  /* ---------------- 应用选项 ---------------- */
  function choose(game, id, index) {
    const ev = findEvent(id);
    if (!ev || !ev.options || !ev.options[index]) return null;
    const opt = ev.options[index];
    const FE = window.FocusEngine;
    const st = ensureState(game);
    st.pending = st.pending.filter(function (x) { return x !== id; });
    st.log.push({ id: id, title: ev.title, choice: opt.label, ...dateOf(game) });

    // 立即应用简单效果
    const c = game.company;
    const e = opt.effects || {};
    if (e.cash) c.cash += e.cash;
    if (e.reputation) c.reputation = Math.max(0, Math.min(100, c.reputation + e.reputation * 100));
    if (e.awareness) c.awareness = Math.max(0, Math.min(100, c.awareness + e.awareness * 100));
    if (e.rnd && game.focus) game.focus.extRnd = (game.focus.extRnd || 1) * e.rnd;
    if (e.cost && game.focus) {
      game.focus.extCost = game.focus.extCost || {};
      Object.keys(e.cost).forEach(function (k) {
        game.focus.extCost[k] = (game.focus.extCost[k] || 1) * e.cost[k];
      });
    }
    if (e.demand && game.focus) {
      game.focus.extDemand = game.focus.extDemand || {};
      Object.keys(e.demand).forEach(function (k) {
        game.focus.extDemand[k] = (game.focus.extDemand[k] || 1) * e.demand[k];
      });
    }
    if (e.revenue && game.focus) game.focus.extRevenue = (game.focus.extRevenue || 1) * e.revenue;
    if (e.aiRelations) {
      Object.keys(e.aiRelations).forEach(function (bid) {
        if (game.diplomacy && game.diplomacy[bid]) {
          game.diplomacy[bid].attitude = Math.max(-100, Math.min(100,
            (game.diplomacy[bid].attitude || 0) + e.aiRelations[bid]));
        }
      });
    }

    // 记录播报
    pushNews(game, {
      kind: 'world', id: id, title: ev.title, tag: ev.tag || '事件',
      text: '你的选择：' + opt.label,
      ...dateOf(game)
    });
    return opt;
  }

  /* ---------------- 播报：国策完成（仅自己） ---------------- */
  function focusBroadcast(game, node) {
    pushNews(game, {
      kind: 'private', id: 'focus_' + node.id, title: node.title,
      tag: '国策', text: node.desc || '决策完成。',
      ...dateOf(game)
    });
  }

  window.FrameEvents = {
    WORLD: WORLD, FOCUS_EVENTS: FOCUS_EVENTS,
    checkMonth: checkMonth, onFocusComplete: onFocusComplete,
    findEvent: findEvent, choose: choose, ensureState: ensureState, monthOf: monthOf, dateOf: dateOf,
    pushNews: pushNews, focusBroadcast: focusBroadcast
  };
})();
