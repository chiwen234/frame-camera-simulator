/* =========================================================
   FRAME — 决策树 v8
   每家：发展 80 + 政治 80 = 160 节点
   发展：4 线 × 18 + 转型区 8
     每线：根 → 互斥①（左右各 3 并行）→ 中继 → 互斥②（左右各 2 并行）→ 线终局 → 传说
   政治：总路线 1 + 3 阵营 ×（1 + 5 支线 × 5） + 终局 1
   ========================================================= */
(function () {
  'use strict';

  const LANE_COLORS = ['#d8a558', '#90a86c', '#b48966', '#c0709a'];

  function scale(theme, d) {
    const out = {};
    Object.keys(theme).forEach(function (k) {
      const v = theme[k];
      if (typeof v === 'number') {
        out[k] = v < 1 ? Number((1 - (1 - v) * d / 4).toFixed(3)) : Number((1 + (v - 1) * d / 4).toFixed(3));
      } else if (v && typeof v === 'object') {
        out[k] = {};
        Object.keys(v).forEach(function (k2) {
          const w = v[k2];
          out[k][k2] = w < 1 ? Number((1 - (1 - w) * d / 4).toFixed(3)) : Number((1 + (w - 1) * d / 4).toFixed(3));
        });
      }
    });
    return out;
  }

  function iconFor(name, fallback) {
    if (/盟|结盟|授权|开放|合作|联名|互补|共赢|来朝|温和/.test(name)) return 'handshake';
    if (/断腕|断臂|殉葬|清仓|放弃|决裂|孤注|暴走|死守|叛|造反/.test(name)) return 'flagfire';
    if (/垄断|绞杀|屠|封锁|断供|绞索|围栏|清场|卡脖子|强硬/.test(name)) return 'fist';
    if (/专利|诉讼|法庭|合规|反倾销|围城/.test(name)) return 'shield';
    if (/收购|鲸吞|合并|并购/.test(name)) return 'merger';
    if (/工厂|产线|产能|量产|爬坡|代工/.test(name)) return 'factory';
    if (/柜台|渠道|经销|电商|下沉|铺货/.test(name)) return 'market';
    if (/研发|芯片|底片|传感器|算法|像素|读出/.test(name)) return 'flask';
    if (/加冕|正统|帝国|王者|王朝|圣殿|传说|达成/.test(name)) return 'crown';
    return fallback;
  }

  const CO = {
    nikon: {
      name: '尼康', tier: 'weak', color: '#e0b136', motto: '沉睡已久的光学名门，什么时候醒来都来得及。',
      lanes: [
        { t: '光学遗产', icon: 'optics', theme: { cost: { optics: 0.94 }, demand: { fullframe: 1.05 } },
          f1: ['封闭 Z 卡口·独食', '开放联盟·共赢'],
          f1L: ['一家独大', '镜头暴利', '转接环帝国'],
          f1R: ['万镜来朝', '副厂授权', '生态收租'],
          f2: ['手工研磨车间', '自动化产线'],
          f2L: ['光学圣殿', '限量复刻'], f2R: ['成本绞杀', '产能暴走'],
          end: '光学帝国加冕', legend: '百年光学·传说' },
        { t: '红门电影', icon: 'video', theme: { demand: { cinema: 1.1 }, tech: { video: 1 } },
          f1: ['专业电影机线', '消费创作者线'],
          f1L: ['好莱坞倒戈', '片场绑定', '租赁巨头合作'],
          f1R: ['一键成片', '博主矩阵', '短视频入侵'],
          f2: ['RED 色彩科学', '自研编码'],
          f2L: ['8K RAW 内录', '电影镜头群'], f2R: ['高效编码', '小体积机身'],
          end: '片场标配加冕', legend: '红门·传说' },
        { t: '对焦翻身', icon: 'af', theme: { dsp: 0.95, tech: { af: 1 } },
          f1: ['自研 AF 芯', '买断算法团队'],
          f1L: ['相位点爆炸', '毫秒之争', '暗光锁定'],
          f1R: ['算法黑箱', '拿来主义', '快速上市'],
          f2: ['挖索尼团队', '自主培养'],
          f2L: ['追焦王朝', 'AI 起步晚消除'], f2R: ['长期研发', '人才梯队'],
          end: '追焦王朝加冕', legend: '算法翻身·传说' },
        { t: '现金自救', icon: 'biz', theme: { cost: { total: 0.96 }, salary: 0.96 },
          f1: ['引入战投', '独立发展'],
          f1L: ['现金充值', '让出董事席', '渠道换股'],
          f1R: ['对赌协议', '稳健经营', '收缩保命'],
          f2: ['产能扩张', '砍线聚焦'],
          f2L: ['全球铺货', '供应链绑定'], f2R: ['轻资产', '聚焦高端'],
          end: '扭亏为盈加冕', legend: '财务自由·传说' }
      ],
      xf: { left: { n: '守住光学', s: 'optics_faith' }, right: { n: '全面算法化', s: 'digital_newbie' },
            leftEnd: '光学教团', rightEnd: '电子新贵' },
      pol: {
        root: '握紧咽喉',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['断供按钮', '专利围剿', '法律绞杀', '渠道封杀', '价格屠城'],
            vocab: ['对手断粮', '产线停摆', '专利地雷', '诉讼绞肉', '清场战术'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['伸出橄榄枝', '技术授权', '连横合纵', '影像联盟', '生态之王'],
            vocab: ['盟友绑定', '授权收租', '标准共建', '联合采购', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['暗中布局', '精准挖角', '舆论伏击', '法律伏击', '影子帝国'],
            vocab: ['情报网络', '人才地震', '黑稿攻势', '专利擦边', '灰色渠道'] }
        ],
        final: '影像霸主'
      }
    },

    sony: {
      name: '索尼', tier: 'strong', color: '#8a9aa6', motto: '把传感器卖给全世界，再证明自己的相机最好。',
      lanes: [
        { t: '半导体霸权', icon: 'sensor', theme: { cost: { sensor: 0.86 }, tech: { sensor: 1 } },
          f1: ['卡特尔之父', '全网供货'],
          f1L: ['传感器沙皇', '断供按钮', '产能军备'],
          f1R: ['军火商协议', '盟友绑定', '技术赎买'],
          f2: ['产线扩建', '代工外包'],
          f2L: ['良率碾压', '先进封装'], f2R: ['成本下探', '产能弹性'],
          end: '行业命脉加冕', legend: '传感器皇帝·传说' },
        { t: '对焦护城河', icon: 'af', theme: { dsp: 0.92, tech: { af: 1 } },
          f1: ['算法封死', '开放授权'],
          f1L: ['毫秒之神', '预测追焦', '主体库扩张'],
          f1R: ['授权收租', '生态锁死', '标准输出'],
          f2: ['云端大模型', '端侧模型'],
          f2L: ['多主体并行', '行为预测'], f2R: ['低功耗锁定', '离线识别'],
          end: '追焦王朝加冕', legend: 'AI 先知·传说' },
        { t: '光学卡口', icon: 'optics', theme: { demand: { fullframe: 1.07 }, cost: { optics: 0.95 } },
          f1: ['封闭 E 卡口', 'E 卡口开放联盟'],
          f1L: ['生态虹吸', '镜头利润中心', '一家独大'],
          f1R: ['万镜来朝', '副厂授权', '生态收租'],
          f2: ['GM 大师线', '走量镜头'],
          f2L: ['GM 涨价', '红 G 信仰'], f2R: ['平价副厂', '入门镜头'],
          end: '光学帝国加冕', legend: '卡口王朝·传说' },
        { t: '帝国改革', icon: 'biz', theme: { rnd: 1.08, talent: 1.06 },
          f1: ['扁平化暴走', '集团集权'],
          f1L: ['KPI 废除', '工程师自治', '决策提速'],
          f1R: ['集团协同', '事业部拆分', '层级保留'],
          f2: ['影像优先', '半导体优先'],
          f2L: ['相机成本优势', '技术下放'], f2R: ['利润最大化', '传感器独占'],
          end: '帝国闭环加冕', legend: '巨轮转向·传说' }
      ],
      xf: { left: { n: '继续做军火商', s: 'arms_dealer' }, right: { n: '垂直整合', s: 'empire_loop' },
            leftEnd: '军火商', rightEnd: '帝国闭环' },
      pol: {
        root: '握紧咽喉',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['断供按钮', '专利围剿', '反垄断对抗', '渠道封杀', '价格屠城'],
            vocab: ['对手断粮', '产线停摆', '专利地雷', '诉讼绞肉', '清场战术'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['技术授权', '标准共建', '军火商协议', '盟友绑定', '生态之王'],
            vocab: ['授权收租', '标准锁定', '联合研发', '采购联盟', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['情报网络', '精准挖角', '舆论伏击', '专利伏击', '影子帝国'],
            vocab: ['数据渗透', '人才地震', '黑稿攻势', '专利擦边', '灰色渠道'] }
        ],
        final: '传感器沙皇'
      }
    },

    canon: {
      name: '佳能', tier: 'strong', color: '#c4473a', motto: '舒适的巨人，什么都能卖。问题是还能不能快起来。',
      lanes: [
        { t: '影像核心', icon: 'sensor', theme: { tech: { sensor: 1 }, cost: { sensor: 0.96 } },
          f1: ['自研闭环', '采购堆栈'],
          f1L: ['成本压死对手', 'DGO 迭代', '全域快门'],
          f1R: ['供应链套利', '规格优先', '背照量产'],
          f2: ['背照堆栈', '全局快门'],
          f2L: ['高速读出', '低噪王'], f2R: ['无果冻效应', '体育专用'],
          end: '影像正统加冕', legend: 'CMOS 王朝·传说' },
        { t: '渠道帝国', icon: 'market', theme: { demand: { compact: 1.12 }, awareness: 0.1 },
          f1: ['直营革命', '经销商同盟'],
          f1L: ['柜台直营化', '电商割喉', '毛利绞杀'],
          f1R: ['经销商联盟', '渠道封锁', '下沉市场'],
          f2: ['婚庆绑定', '体育垄断'],
          f2L: ['婚礼摄影标配', '商业影棚'], f2R: ['赛事赞助', '新闻通稿'],
          end: '白色巨塔加冕', legend: '渠道之神·传说' },
        { t: '卡口圣战', icon: 'optics', theme: { cost: { optics: 0.93 }, demand: { fullframe: 1.05 } },
          f1: ['封闭 RF', '开放 RF 授权'],
          f1L: ['副厂死路', '镜头暴利', '红圈溢价'],
          f1R: ['万镜来朝', '授权收租', '生态虹吸'],
          f2: ['红圈神教', '走量镜头'],
          f2L: ['L 级镜头', '信仰税'], f2R: ['平价 RF', '入门套机'],
          end: '光学帝国加冕', legend: 'RF 王朝·传说' },
        { t: '巨人转型', icon: 'biz', theme: { rnd: 1.05, cost: { total: 0.97 } },
          f1: ['慢做精品', '快走量'],
          f1L: ['研发预算翻倍', '精品路线', '技术巨人'],
          f1R: ['价格绞杀', '产能暴走', '渠道之王'],
          f2: ['家族控股', '引入外部资本'],
          f2L: ['长期主义', '稳步投入'], f2R: ['资本运作', '战略投资'],
          end: '技术巨人加冕', legend: '巨人苏醒·传说' }
      ],
      xf: { left: { n: '死守渠道', s: 'channel_king' }, right: { n: '技术突进', s: 'tech_giant' },
            leftEnd: '渠道之王', rightEnd: '技术巨人' },
      pol: {
        root: '渠道封杀',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['渠道封杀', '价格屠城', '专利围剿', '断供威胁', '法律绞杀'],
            vocab: ['经销商倒戈', '全渠道封锁', '卡口专利墙', '供货掐断', '诉讼绞肉'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['经销商同盟', '开放授权', '赛事联名', '婚庆绑定', '生态之王'],
            vocab: ['渠道共享', '授权收租', '赛事绑定', '专业社群', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['渠道渗透', '舆论攻势', '精准挖角', '专利伏击', '影子帝国'],
            vocab: ['灰色渠道', '黑稿攻势', '人才地震', '专利擦边', '影子供应链'] }
        ],
        final: '白色巨塔'
      }
    },

    fujifilm: {
      name: '富士胶片', tier: 'mid', color: '#d1453b', motto: '你卖的不是相机，是一种颜色。',
      lanes: [
        { t: '色彩教团', icon: 'brand', theme: { demand: { retro: 1.18 }, reputation: 0.13 },
          f1: ['信仰税', '走向大众'],
          f1L: ['限量发售', '色彩认证', '排队经济学'],
          f1R: ['下放模拟', '年轻化', '铺货走量'],
          f2: ['色彩垄断', '开放配方'],
          f2L: ['审美定价权', '色彩霸权'], f2R: ['免费开放', '标准共建'],
          end: '色彩信仰加冕', legend: '色彩教团·传说' },
        { t: '中画幅独苗', icon: 'sensor', theme: { demand: { medium: 1.2 }, tech: { sensor: 1 } },
          f1: ['2 亿像素', 'GFX 平民化'],
          f1L: ['像素暴力', '商业摄影垄断', '中画幅电影'],
          f1R: ['价格下探', '走量中画幅', '入门 GFX'],
          f2: ['APS-C 死守', '中画幅扩张'],
          f2L: ['X 卡口深耕', '独苗的孤独'], f2R: ['大底普及', '中画幅生态'],
          end: '中画幅独苗加冕', legend: '中画幅之王·传说' },
        { t: '产能绞杀', icon: 'factory', theme: { cost: { total: 0.95 }, demand: { compact: 1.05 } },
          f1: ['扩产走量', '饥饿营销'],
          f1L: ['第三工厂', '产线自动化', '供货稳定'],
          f1R: ['限量发售', '二级市场溢价', '稀缺暴利'],
          f2: ['手工复刻', '自动化'],
          f2L: ['匠人产线', '限量精品'], f2R: ['成本绞杀', '产能暴走'],
          end: '产能解放加冕', legend: '制造奇迹·传说' },
        { t: '品牌人群', icon: 'brand', theme: { reputation: 0.14, demand: { retro: 1.06 } },
          f1: ['影像印刷', 'X100 排队'],
          f1L: ['冲印业务', '相纸复刻', '胶片复兴'],
          f1R: ['排队神话', '黄牛经济', '社交爆款'],
          f2: ['医疗反哺', '独立经营'],
          f2L: ['集团输血', '长期主义'], f2R: ['自负盈亏', '成本自律'],
          end: '百年富士加冕', legend: '胶片帝国·传说' }
      ],
      xf: { left: { n: '死守小众', s: 'color_cult' }, right: { n: '走向大众', s: 'scale_believer' },
            leftEnd: '色彩教团', rightEnd: '规模信徒' },
      pol: {
        root: '限量绞杀',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['限量绞杀', '二级市场操盘', '专利围剿', '渠道封锁', '价格屠城'],
            vocab: ['全球限售', '炒货收割', '专利地雷', '渠道收紧', '清场战术'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['色彩联名', '品牌跨界', '影像联盟', '开放配方', '生态之王'],
            vocab: ['联名收割', '跨界合作', '标准共建', '授权收租', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['饥饿战术', '水军工厂', '精准挖角', '专利伏击', '影子帝国'],
            vocab: ['排队神话', '黑稿攻势', '人才地震', '专利擦边', '影子渠道'] }
        ],
        final: '色彩信仰'
      }
    },

    panasonic: {
      name: '松下', tier: 'mid', color: '#3a6ea5', motto: '视频之王，生态之困。',
      lanes: [
        { t: '影像核心', icon: 'sensor', theme: { tech: { sensor: 1 }, demand: { highres: 1.06 } },
          f1: ['有机传感器', '成熟堆栈'],
          f1L: ['有机量产', '动态范围屠榜', '全域快门'],
          f1R: ['双增益进化', '成本下探', '规格碾压'],
          f2: ['大画幅探索', '双原生 ISO'],
          f2L: ['中画幅入场', '大底普及'], f2R: ['高感王', '低噪优化'],
          end: '影像正统加冕', legend: '传感器革命·传说' },
        { t: '对焦翻身', icon: 'af', theme: { dsp: 0.92, chip: 1.08 },
          f1: ['自研相位', '外购顶配'],
          f1L: ['自研 ASIC', '对焦翻篇', '毫秒之争'],
          f1R: ['外购方案', '拿来主义', '快速上市'],
          f2: ['视频追焦', '专业场景'],
          f2L: ['片场级稳定', '主体锁定'], f2R: ['动物识别', '运动追踪'],
          end: '追焦王朝加冕', legend: '对焦翻篇·传说' },
        { t: '视频血统', icon: 'video', theme: { demand: { cinema: 1.16 }, tech: { video: 1 } },
          f1: ['片场正统', '创作者线'],
          f1L: ['Netflix 认证', '剧组绑定', '院线合作'],
          f1R: ['S9 轻量线', '博主收割', '一键成片'],
          f2: ['有机电影机', '传统电影机'],
          f2L: ['动态范围王', '调色友好'], f2R: ['高帧率', '稳定可靠'],
          end: '片场标配加冕', legend: '视频之王·传说' },
        { t: '生态突围', icon: 'handshake', theme: { cost: { optics: 0.94 }, demand: { mirrorless: 1.06 } },
          f1: ['开放 L 卡口', '独狼路线'],
          f1L: ['结盟大疆', '结盟影石', '联盟扩张'],
          f1R: ['自建镜头群', '独立路线', '孤岛求生'],
          f2: ['高端定位', '降价换量'],
          f2L: ['专业溢价', '品牌上探'], f2R: ['价格战', '规模优先'],
          end: '生态成型加冕', legend: '生态之王·传说' }
      ],
      xf: { left: { n: '守在片场', s: 'film_set' }, right: { n: '打入大众', s: 'beyond_circle' },
            leftEnd: '片场正统', rightEnd: '破圈者' },
      pol: {
        root: '片场垄断',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['院线封锁', '技术断供', '专利围剿', '渠道封杀', '价格屠城'],
            vocab: ['独家供片', '编码断供', '专利地雷', '影院排他', '清场战术'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['剧组绑定', '导演联盟', 'L 卡口联盟', '技术授权', '生态之王'],
            vocab: ['制片合作', '导演背书', '联盟扩张', '授权收租', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['专利伏击', '舆论攻势', '精准挖角', '渠道渗透', '影子帝国'],
            vocab: ['格式锁定', '黑稿攻势', '人才地震', '灰色渠道', '影子供应链'] }
        ],
        final: '片场帝国'
      }
    },

    dji: {
      name: '大疆创新', tier: 'mid', color: '#2f7d8c', motto: '卖的不是相机，是「拍得到」。',
      lanes: [
        { t: '供应链降维', icon: 'factory', theme: { cost: { total: 0.9 } },
          f1: ['消费降维', '专业攻坚'],
          f1L: ['价格绞肉机', '成本结构', '快速迭代'],
          f1R: ['品质革命', '专业认证', '剧组攻坚'],
          f2: ['全球产能', '区域深耕'],
          f2L: ['交期碾压', '成本护城河'], f2R: ['本地化', '区域补贴'],
          end: '天空之眼加冕', legend: '降维打击·传说' },
        { t: '云台避障', icon: 'optics', theme: { dsp: 0.92, demand: { action: 1.1 } },
          f1: ['视觉霸权', '硬件暴力'],
          f1L: ['避障算法移植', '自动跟拍', '端侧 AI'],
          f1R: ['云台一体化', '机械暴力', '结构降维'],
          f2: ['云台一体', '可换镜头'],
          f2L: ['口袋云台', '运动稳定'], f2R: ['云台镜头体系', '可换镜生态'],
          end: '视觉算法领先', legend: '云端之眼·传说' },
        { t: '影像核心', icon: 'sensor', theme: { cost: { sensor: 0.94 }, tech: { sensor: 1 } },
          f1: ['自研 CMOS', '采购整合'],
          f1L: ['自研堆栈', '传感器自给', '大底普及'],
          f1R: ['供应链采购', '成本极限', '多供应商'],
          f2: ['APS-C 云台底', '一英寸'],
          f2L: ['专业大底', '画质突破'], f2R: ['轻量化', '成本优先'],
          end: '影像正统加冕', legend: '传感器自立·传说' },
        { t: '品牌升维', icon: 'brand', theme: { awareness: 0.16, reputation: 0.1 },
          f1: ['年轻人第一台', '专业背书'],
          f1L: ['博主矩阵', '内容裂变', '赛事联名'],
          f1R: ['纪录片导演', '影像学院', '专业口碑'],
          f2: ['硬件利润', '生态营收'],
          f2L: ['硬件毛利', '配件生态'], f2R: ['软件服务', '云服务'],
          end: '国民影像品牌加冕', legend: '国民品牌·传说' }
      ],
      xf: { left: { n: '继续降维', s: 'dimension_hunter' }, right: { n: '强攻专业', s: 'pro_newcomer' },
            leftEnd: '降维者', rightEnd: '专业新贵' },
      pol: {
        root: '供应链绞索',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['零件断供', '价格屠城', '专利围栏', '渠道封杀', '法律绞杀'],
            vocab: ['对手停产', '清场战术', '云台专利墙', '渠道收紧', '诉讼绞肉'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['云台生态', '供应链联盟', '影像联盟', '开放授权', '生态之王'],
            vocab: ['生态互补', '联合采购', '标准共建', '授权收租', '伙伴网络'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['逆向工程', '舆论攻势', '精准挖角', '专利擦边', '影子帝国'],
            vocab: ['拆机学习', '黑稿攻势', '人才地震', '专利擦边', '灰色渠道'] }
        ],
        final: '天空霸主'
      }
    },

    insta360: {
      name: '影石', tier: 'mid', color: '#e0651f', motto: '先拍下来，再决定看哪里。',
      lanes: [
        { t: '全景算法', icon: 'video', theme: { demand: { action: 1.14 }, tech: { video: 1 } },
          f1: ['先拍后取景', '实时直出'],
          f1L: ['后期重构', '构图自由', 'AI 剪辑'],
          f1R: ['实时缝合', '直出可用', '低延迟'],
          f2: ['8K 暴力', '4K 均衡'],
          f2L: ['画质屠榜', '像素暴力'], f2R: ['续航优先', '稳定输出'],
          end: '全景标准加冕', legend: '全景教父·传说' },
        { t: '社交裂变', icon: 'brand', theme: { awareness: 0.22, demand: { vlog: 1.1 } },
          f1: ['社交裂变', '内容自制'],
          f1L: ['一键分享', '病毒传播', '平台直连'],
          f1R: ['官方内容', '创作者共创', '自有社区'],
          f2: ['赛事绑定', '社群运营'],
          f2L: ['极限联名', '户外绑定'], f2R: ['创作者基金', '社群活动'],
          end: '主流玩家加冕', legend: '社交帝国·传说' },
        { t: '良率攻坚', icon: 'factory', theme: { qc: 0.93, cost: { total: 0.96 } },
          f1: ['双芯并行', '单芯走量'],
          f1L: ['双镜头攻坚', '良率革命', '品质稳定'],
          f1R: ['单芯方案', '砍配置', '薄利多销'],
          f2: ['供应链升级', '成本极限'],
          f2L: ['供应商绑定', '长期协议'], f2R: ['第二供应商', '成本绞杀'],
          end: '品质稳定', legend: '良率奇迹·传说' },
        { t: '生态扩张', icon: 'handshake', theme: { cost: { optics: 0.95 }, demand: { mirrorless: 1.05 } },
          f1: ['死守全景', '杀入主流'],
          f1L: ['全景唯一', '垂直深耕', '专业全景'],
          f1R: ['可换镜入场', '主流战场', '全能机型'],
          f2: ['结盟松下', '独立云台'],
          f2L: ['L 卡口入场', '算法互补'], f2R: ['自建云台', '配件生态'],
          end: '生态之王', legend: '全景霸权·传说' }
      ],
      xf: { left: { n: '死守全景', s: 'pano_only' }, right: { n: '杀入主流', s: 'mainstream' },
            leftEnd: '全景唯一', rightEnd: '主流玩家' },
      pol: {
        root: '算法围栏',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['缝合专利墙', '平台封锁', '舆论绞杀', '价格屠城', '法律绞杀'],
            vocab: ['专利诉讼', '流量限流', '黑稿攻势', '清场战术', '诉讼绞肉'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['社交裂变', '平台合作', '创作者联盟', '技术授权', '生态之王'],
            vocab: ['流量共享', '平台绑定', '创作者基金', '授权收租', '生态互补'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['水军工厂', '精准挖角', '数据渗透', '专利擦边', '影子帝国'],
            vocab: ['舆情操控', '人才地震', '用户数据', '专利擦边', '灰色渠道'] }
        ],
        final: '全景标准'
      }
    },

    startup: {
      name: '新创公司', tier: 'weak', color: '#d8a65a', motto: '没有历史，所以什么都可以选。',
      lanes: [
        { t: '技术孤注', icon: 'sensor', theme: { rnd: 1.1, chip: 1.08 },
          f1: ['自研芯片', '采购整合'],
          f1L: ['卖房研发', '芯片攻坚', '技术壁垒'],
          f1R: ['采购成熟方案', '成本下探', '轻资产'],
          f2: ['技术孤注', '稳健经营'],
          f2L: ['赌上公司', '全部押注'], f2R: ['小步快跑', '现金流为正'],
          end: '芯片自给', legend: '技术信徒·传说' },
        { t: '生态寄生', icon: 'handshake', theme: { cost: { total: 0.93 }, demand: { mirrorless: 1.06 } },
          f1: ['加入开放卡口', '自建卡口'],
          f1L: ['镜头红利', '生态借力', '借船出海'],
          f1R: ['自建卡口', '孤注一掷', '生态成型'],
          f2: ['品牌联名', '代工合作'],
          f2L: ['联名收割', '渠道借用'], f2R: ['代工绑定', '柔性生产'],
          end: '生态成型加冕', legend: '借力者·传说' },
        { t: '品牌突围', icon: 'brand', theme: { awareness: 0.22, reputation: 0.1 },
          f1: ['年轻潮流', '专业口碑'],
          f1L: ['潮流爆款', '社交裂变', '网红经济'],
          f1R: ['专业背书', '口碑积累', '技术叙事'],
          f2: ['社群运营', '内容营销'],
          f2L: ['粉丝帝国', '共创计划'], f2R: ['内容矩阵', 'KOL 合作'],
          end: '不可忽视加冕', legend: '白纸称帝·传说' },
        { t: '现金命脉', icon: 'biz', theme: { cost: { total: 0.96 }, salary: 0.96 },
          f1: ['接受对赌', '独立发展'],
          f1L: ['A 轮融资', '估值飙升', '资金充沛'],
          f1R: ['现金流为正', '财务纪律', '稳步经营'],
          f2: ['烧钱扩张', '稳健经营'],
          f2L: ['规模优先', '补贴换量'], f2R: ['成本自律', '长期主义'],
          end: '扭亏为盈加冕', legend: '不死鸟·传说' }
      ],
      xf: { left: { n: '技术孤注', s: 'tech_devotee' }, right: { n: '生态寄生', s: 'borrower' },
            leftEnd: '技术信徒', rightEnd: '借力者' },
      pol: {
        root: '价格屠夫',
        camps: [
          { name: '铁腕', icon: 'fist', color: '#c85a4a',
            branches: ['亏本倾销', '价格绞肉机', '专利围剿', '渠道封杀', '法律绞杀'],
            vocab: ['清场战术', '对手出局', '专利地雷', '渠道收紧', '诉讼绞肉'] },
          { name: '结盟', icon: 'handshake', color: '#5a8fc8',
            branches: ['借船出海', '代工联盟', '开放卡口', '技术授权', '生态之王'],
            vocab: ['渠道借用', '联合采购', '生态互补', '授权收租', '伙伴网络'] },
          { name: '暗影', icon: 'flagfire', color: '#7a5aa8',
            branches: ['抄袭起家', '逆向工程', '舆论攻势', '精准挖角', '影子帝国'],
            vocab: ['快速跟随', '拆机学习', '黑稿攻势', '人才地震', '灰色渠道'] }
        ],
        final: '不可忽视'
      }
    }
  };

  const TREES = {}, PROFS = {};

  Object.keys(CO).forEach(function (bid) {
    const c = CO[bid];
    PROFS[bid] = { name: c.name, tier: c.tier, color: c.color, motto: c.motto };
    const treeId = bid + '_dev';
    const nodes = [], lanes = [];

    c.lanes.forEach(function (lane, li) {
      const color = LANE_COLORS[li % LANE_COLORS.length];
      const key = 'L' + li;
      const mk = function (suffix, title, col, row, requires, extra) {
        extra = extra || {};
        let effects = scale(lane.theme, row);
        let icon = extra.icon || iconFor(title, lane.icon);
        if (extra.effects) effects = Object.assign({}, effects, extra.effects);
        const id = treeId + '_' + key + '_' + suffix;
        nodes.push({
          id: id, tree: treeId, kind: 'dev', lane: key, laneName: lane.t, laneColor: color,
          col: col, row: row, title: title, icon: icon, nodeType: extra.nodeType || 'stat',
          desc: lane.t + ' · ' + title,
          cost: extra.cost || (1 + row), months: extra.months || (2 + Math.floor(row / 2)),
          requires: requires || [], excludes: extra.excludes || [], group: extra.group || null,
          requireMode: extra.requireMode || null,
          needShare: extra.needShare || null, needCash: extra.needCash || null, needEvent: extra.needEvent || null,
          risk: extra.risk || null, unlockModel: extra.unlockModel || null,
          unlockChip: extra.unlockChip || null, unlockDiplo: extra.unlockDiplo || null,
          isEnd: !!extra.isEnd, effects: effects
        });
        return id;
      };

      const base = li * 9;
      const r0 = mk('r', lane.t + '·立项', base + 4, 1, []);

      const g1 = treeId + '_' + key + '_g1';
      const a1 = mk('a1', lane.f1[0], base + 2, 2, [r0], { group: g1, icon: 'flagfire', nodeType: 'exclusive', effects: { reputation: 0.05 } });
      const b1 = mk('b1', lane.f1[1], base + 6, 2, [r0], { group: g1, icon: 'handshake', nodeType: 'exclusive', effects: { demand: { mirrorless: 1.04 } } });
      nodes[nodes.length - 2].excludes = [b1];
      nodes[nodes.length - 1].excludes = [a1];

      const a1kids = [], b1kids = [];
      lane.f1L.forEach(function (nm, i) {
        a1kids.push(mk('a1p' + i, nm, base + i * 1.1, 3, [a1], { nodeType: i === 0 ? 'chip' : 'stat', unlockChip: i === 0 ? 'af' : null }));
      });
      lane.f1R.forEach(function (nm, i) {
        b1kids.push(mk('b1p' + i, nm, base + 4 + i * 1.1, 3, [b1], { nodeType: i === 0 ? 'diplo' : 'stat', unlockDiplo: i === 0 ? 'license' : null }));
      });

      const mid = mk('m', lane.t + '·整合', base + 4, 4, a1kids.concat(b1kids), { requireMode: 'any' });

      const g2 = treeId + '_' + key + '_g2';
      const a2 = mk('a2', lane.f2[0], base + 2.5, 5, [mid], { group: g2, icon: 'flagfire', nodeType: 'exclusive' });
      const b2 = mk('b2', lane.f2[1], base + 5.5, 5, [mid], { group: g2, icon: 'handshake', nodeType: 'exclusive' });
      nodes[nodes.length - 2].excludes = [b2];
      nodes[nodes.length - 1].excludes = [a2];

      const a2kids = [], b2kids = [];
      lane.f2L.forEach(function (nm, i) { a2kids.push(mk('a2p' + i, nm, base + 2 + i * 1.4, 6, [a2])); });
      lane.f2R.forEach(function (nm, i) { b2kids.push(mk('b2p' + i, nm, base + 5 + i * 1.4, 6, [b2])); });

      const endId = mk('end', lane.end, base + 4, 7, a2kids.concat(b2kids), {
        nodeType: 'model', unlockModel: bid, isEnd: true, icon: 'crown', cost: 8, months: 6,
        requireMode: 'any', effects: { reputation: 0.2 }
      });
      mk('legend', lane.legend, base + 4, 8, [endId], {
        nodeType: 'standard', icon: 'crown', cost: 10, months: 8, effects: { reputation: 0.25, awareness: 0.15 }
      });

      lanes.push({ id: key, name: lane.t, color: color, icon: lane.icon });
    });

    /* 转型区 8 */
    const xfBase = c.lanes.length * 9 + 2;
    const anyMid = c.lanes.map(function (_, i) { return treeId + '_L' + i + '_m'; });
    const xRoot = treeId + '_xf_r';
    nodes.push({
      id: xRoot, tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase + 2, row: 5, title: '转型·思辨', icon: 'flagfire', nodeType: 'exclusive',
      desc: '决定公司未来十年的方向。', cost: 8, months: 6, requires: anyMid, excludes: [], group: null,
      needCash: 200000000, effects: { pc: 20 }
    });
    const xg = treeId + '_xf_g';
    const xl = treeId + '_xf_l', xr = treeId + '_xf_r2';
    nodes.push({
      id: xl, tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase, row: 6, title: c.xf.left.n, icon: 'flagfire', nodeType: 'exclusive',
      desc: '守成：保住老本行。', cost: 9, months: 6, requires: [xRoot], excludes: [xr], group: xg,
      effects: { gainSpirit: c.xf.left.s, reputation: 0.2 }
    });
    nodes.push({
      id: xr, tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase + 4, row: 6, title: c.xf.right.n, icon: 'flagfire', nodeType: 'exclusive',
      desc: '变革：押注新方向。', cost: 9, months: 6, requires: [xRoot], excludes: [xl], group: xg,
      effects: { gainSpirit: c.xf.right.s, rnd: 1.1 }
    });
    nodes.push({
      id: xl + '_e', tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase, row: 7, title: c.xf.leftEnd, icon: 'crown', nodeType: 'spirit',
      desc: '守成路线的终点。', cost: 10, months: 8, requires: [xl], excludes: [], group: null,
      isEnd: true, effects: { reputation: 0.3, demand: { retro: 1.08 } }
    });
    nodes.push({
      id: xr + '_e', tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase + 4, row: 7, title: c.xf.rightEnd, icon: 'crown', nodeType: 'spirit',
      desc: '变革路线的终点。', cost: 10, months: 8, requires: [xr], excludes: [], group: null,
      isEnd: true, effects: { demand: { fullframe: 1.1 }, rnd: 1.08 }
    });
    nodes.push({
      id: treeId + '_xf_risk', tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase + 2, row: 8, title: '赌上公司', icon: 'flagfire', nodeType: 'risk',
      desc: '把一切押在一个方向上。', cost: 6, months: 6, requires: [xRoot], excludes: [], group: null,
      needCash: 300000000,
      risk: { rate: 0.45, success: { rnd: 1.25, chip: 1.15 }, fail: { cash: -500000000, rnd: 0.8 } },
      effects: {}
    });
    // 转型深化（补足 8 个）
    nodes.push({
      id: treeId + '_xf_ld', tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase - 1, row: 8, title: c.xf.leftEnd + '·深化', icon: 'crown', nodeType: 'standard',
      desc: '把守成路线做到极致。', cost: 11, months: 8, requires: [xl + '_e'], excludes: [], group: null,
      isEnd: true, effects: { reputation: 0.3, demand: { retro: 1.1 }, cost: { total: 0.96 } }
    });
    nodes.push({
      id: treeId + '_xf_rd', tree: treeId, kind: 'dev', lane: 'xf', laneName: '转型', laneColor: '#c85a4a',
      col: xfBase + 5, row: 8, title: c.xf.rightEnd + '·深化', icon: 'crown', nodeType: 'standard',
      desc: '把变革路线做到极致。', cost: 11, months: 8, requires: [xr + '_e'], excludes: [], group: null,
      isEnd: true, effects: { rnd: 1.12, demand: { fullframe: 1.1 }, awareness: 0.1 }
    });
    lanes.push({ id: 'xf', name: '转型', color: '#c85a4a', icon: 'flagfire' });

    TREES[treeId] = { brand: bid, kind: 'dev', name: c.name + ' · 发展决策', color: c.color, motto: c.motto, lanes: lanes, nodes: nodes };

    /* 政治树 */
    const polId = bid + '_pol';
    const polNodes = [];
    const polRootId = polId + '_root';
    polNodes.push({
      id: polRootId, tree: polId, kind: 'pol', lane: 'root', laneName: '总路线', laneColor: '#d8a65a',
      col: 10, row: 1, title: c.pol.root, icon: 'crown', nodeType: 'stat',
      desc: '确立公司的对外姿态。', cost: 2, months: 2, requires: [], excludes: [], group: null,
      effects: { pc: 20 }
    });

    const campIds = [];
    c.pol.camps.forEach(function (camp, ci) {
      const campBase = ci * 7;
      const campId = polId + '_c' + ci;
      campIds.push(campId);
      polNodes.push({
        id: campId, tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
        col: campBase + 3, row: 2, title: camp.name + '路线', icon: camp.icon, nodeType: 'exclusive',
        desc: '三大阵营只能选一个。', cost: 3, months: 3, requires: [polRootId], excludes: [],
        group: polId + '_camp', effects: { pc: 25 }
      });

      camp.branches.forEach(function (bname, bi) {
        const bId = campId + '_b' + bi;
        polNodes.push({
          id: bId, tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
          col: campBase + bi * 1.4, row: 3, title: bname, icon: camp.icon, nodeType: 'stat',
          desc: camp.name + ' · ' + bname, cost: 4, months: 3, requires: [campId], excludes: [], group: null,
          effects: { pc: 15 + bi * 3 }
        });
        const bg = polId + '_c' + ci + '_b' + bi + '_g';
        const lId = bId + 'L', rId = bId + 'R';
        polNodes.push({
          id: lId, tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
          col: campBase + bi * 1.4 - 0.4, row: 4, title: camp.vocab[bi] + '·强硬', icon: 'fist', nodeType: 'exclusive',
          desc: '强硬手段。', cost: 5, months: 3, requires: [bId], excludes: [rId], group: bg,
          effects: { reputation: -0.08, pc: 20 }
        });
        polNodes.push({
          id: rId, tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
          col: campBase + bi * 1.4 + 0.4, row: 4, title: camp.vocab[bi] + '·温和', icon: 'handshake', nodeType: 'exclusive',
          desc: '温和手段。', cost: 5, months: 3, requires: [bId], excludes: [lId], group: bg,
          effects: { reputation: 0.08, pc: 15 }
        });
        polNodes.push({
          id: bId + 'P', tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
          col: campBase + bi * 1.4, row: 4, title: camp.vocab[bi] + '·布局', icon: camp.icon, nodeType: 'stat',
          desc: '并行推进。', cost: 4, months: 3, requires: [bId], excludes: [], group: null,
          effects: { pc: 12, awareness: 0.04 }
        });
        polNodes.push({
          id: bId + 'E', tree: polId, kind: 'pol', lane: 'c' + ci, laneName: camp.name, laneColor: camp.color,
          col: campBase + bi * 1.4, row: 5, title: bname + '·达成', icon: 'crown', nodeType: 'spirit',
          desc: '支线终点。', cost: 6, months: 4, requires: [lId, rId], excludes: [], group: null,
          isEnd: true, effects: { pc: 30, reputation: 0.12 }
        });
      });
    });

    campIds.forEach(function (cid) {
      const n = polNodes.filter(function (x) { return x.id === cid; })[0];
      n.excludes = campIds.filter(function (o) { return o !== cid; });
    });

    polNodes.push({
      id: polId + '_final', tree: polId, kind: 'pol', lane: 'root', laneName: '终局', laneColor: '#d8a65a',
      col: 10, row: 7, title: c.pol.final, icon: 'crown', nodeType: 'legend',
      desc: '政治路线的最终形态。', cost: 12, months: 10,
      requires: campIds.map(function (cid) { return cid + '_b0E'; }),
      requireMode: 'any', excludes: [], group: null, isEnd: true,
      effects: { pc: 80, reputation: 0.3, awareness: 0.2 }
    });

    TREES[polId] = {
      brand: bid, kind: 'pol', name: c.name + ' · 政治决策', color: c.color, motto: c.motto,
      lanes: [{ id: 'root', name: '总路线', color: '#d8a65a', icon: 'crown' }].concat(
        c.pol.camps.map(function (camp, ci) { return { id: 'c' + ci, name: camp.name, color: camp.color, icon: camp.icon }; })),
      nodes: polNodes
    };
  });

  const NEW_MODELS = {
    nikon: [{ code: 'ZR2', name: 'ZR II', category: 'cinema', score: 92, sensor: 'ff', mp: 46, res: '8K', fps: 60, mount: 'Z', target: 'cinema', price: 39800 }],
    sony: [{ code: 'A1III', name: 'Alpha 1 III', category: 'sports', score: 96, sensor: 'ff', mp: 50, res: '8K', fps: 120, mount: 'E', target: 'sports', price: 49800 }],
    canon: [{ code: 'RC', name: 'EOS RC', category: 'retro', score: 89, sensor: 'ff', mp: 33, res: '4K', fps: 60, mount: 'RF', target: 'enthusiast', price: 15800 }],
    fujifilm: [{ code: 'GFX200', name: 'GFX200', category: 'medium', score: 95, sensor: 'mf', mp: 200, res: '8K', fps: 30, mount: 'GFX', target: 'professional', price: 68800 }],
    panasonic: [{ code: 'GH9', name: 'Lumix GH9', category: 'cinema', score: 93, sensor: 'm43', mp: 25, res: '6K', fps: 120, mount: 'M43', target: 'cinema', price: 19800 }],
    dji: [{ code: 'RONIN4D2', name: 'Ronin 4D-II', category: 'cinema', score: 90, sensor: 'apsc', mp: 20, res: '6K', fps: 60, mount: 'FIXED', target: 'cinema', price: 38800 }],
    insta360: [{ code: 'X7', name: 'X7', category: 'action', score: 90, sensor: 'one', mp: 96, res: '8K', fps: 30, mount: 'FIXED', target: 'sports', price: 3998 }],
    startup: [{ code: 'X01', name: '自家 01', category: 'fullframe', score: 88, sensor: 'ff', mp: 33, res: '6K', fps: 60, mount: 'E', target: 'professional', price: 14800 }]
  };

  window.FRAME_FOCUS = { FOCUS_TREES: TREES, PROFILES: PROFS, LANE_COLORS: LANE_COLORS, NEW_MODELS: NEW_MODELS };
})();
