/* 消防 Edge AI 平台｜內容資料（Round 3，2026-11）
 * 所有頁面內容都從這個檔案讀取。新增或修改內容只要改這裡，不用動版面程式。
 * 各類內容以 id 互相關聯。正式版由 Vic 改為資料庫與後台，欄位對照請見 HANDOFF.md。
 *
 * Round 2 主要變動（依交大回饋，11/7 內部決議）：
 * - 「成果」與「應用情境」合併為 applications（應用情境），每一項用同一個 7 區塊模板呈現。
 * - 原本的情境（scenarios）改為 techs（技術模組），只負責對照滑桿與三步驟說明，掛在某個應用情境底下。
 */

/* 成熟度：固定三種 */
const MATURITY = {
  done:     { label: '已完成', note: '已完成驗證' },
  test:     { label: '測試中', note: '已有展示或測試結果，仍在驗證' },
  research: { label: '研究中', note: '仍在研究或規劃階段' }
};

/* 技術模組：首頁「AI 可以在現場幫上什麼忙」的切換卡片與對照滑桿使用
 * app：這個技術放在哪一個應用情境頁 */
const techs = [
  {
    id: 'distance', app: 'firesight',
    title: '看清火源有多遠',
    tech: '火焰辨識＋深度測距',
    team: 'lin',
    maturity: 'test',
    hook: '煙霧與低照度下，很難只靠畫面判斷火源距離。',
    need: '火場的煙霧、低照度與快速變化，使人員難以僅從影像判斷火源距離。前後方也需要能共同判讀的資訊。',
    steps: [
      { t: '取得影像', d: '深度相機同時取得現場畫面與深度資訊' },
      { t: '設備端辨識', d: '在邊緣運算設備上辨識火焰位置' },
      { t: '標示距離', d: '畫面上標出火焰辨識框與估算距離' }
    ],
    result: '記者會展板呈現燃燒櫃影像中的火焰辨識與測距範例，畫面中約 8.70 公尺為該次展示結果。',
    method: '透過深度相機取得影像，結合 NVIDIA Jetson Orin 與 Infineon E84，在邊緣設備上進行火焰辨識及距離估算，標示火焰位置、辨識框與即時距離。',
    future: '規劃整合於消防載具或可攜式設備，並串接指揮 Dashboard，提供前後方共同判讀。',
    devices: ['depth', 'orin', 'e84'],
    compare: { before: '煙霧中只看得到模糊火光', after: '標出火源位置與估算距離' }
  },
  {
    id: 'smoke', app: 'vision',
    title: '濃煙中也找得到人',
    tech: '多源感知融合',
    team: 'hsu',
    maturity: 'test',
    hook: '濃煙會遮住人員與火點，一般攝影機畫面不易辨識。',
    need: '濃煙會遮蔽人員及火點，一般攝影機影像不易辨識；專業設備也可能有成本、重量與載具整合限制。',
    steps: [
      { t: '多種感測', d: '以不同低成本感測器取得現場資訊' },
      { t: '資訊融合', d: '讓不同來源的資訊彼此補位' },
      { t: '辨識標示', d: '標出人員、火與煙的位置' }
    ],
    result: '2026 年 9 月展板記載：E84 模型處理速度為每秒 32.2 張；在人形目標遮蔽九成以上的展示情境中，一般影像辨識為 3.3%，多源融合為 93.3%。此為展板所述測試情境，並非所有火場的效果保證。',
    method: '在消防訓練中心進行真實燃燒訓練，以同一設備拍攝起火前後畫面，融合不同低成本感測器資訊，協助辨識人員、火與煙。',
    future: '未來可探索消防機器人、無人載具的濃煙搜救，以及受困者與火點定位。',
    devices: ['e84'],
    compare: { before: '濃煙遮住人員輪廓', after: '標出人員與火點位置' }
  },
  {
    id: 'count', app: 'count',
    title: '掌握現場有多少人',
    tech: '人員辨識與計數',
    team: 'north',
    maturity: 'research',
    hook: '人員進出頻繁時，靠人工回報容易延遲或重複。',
    need: '火場人員進出頻繁，人工回報可能因任務複雜或通訊繁忙而延遲、重複或不一致。',
    steps: [
      { t: '取得畫面', d: '攝影機拍攝出入口畫面' },
      { t: '辨識人員', d: '在 E84 上辨識畫面中的人員' },
      { t: '統計人數', d: '計算人數；進出方向判斷規劃中' }
    ],
    result: '已完成高雄國際機場站手推車辨識與數量統計試作；依 2026 年 9 月展板，正導入消防影像進行人員辨識模型訓練，虛擬界線與進出方向判斷仍屬規劃。',
    method: '使用攝影機搭配 Infineon PSoC Edge E84 Evaluation Kit，以既有的手推車辨識與計數能力為基礎，延伸至火場人員辨識及計數。',
    future: '逐步發展火場人員辨識與計數，作為人工清點與無線電回報的輔助工具。',
    devices: ['e84'],
    compare: { before: '畫面中人員交錯，難以清點', after: '逐一標出人員並計數' }
  }
];

/* 應用情境（＝原本的成果）：導覽「應用情境」下拉選單依此順序列出
 * 內容頁共用 7 區塊模板：介紹 → 互動對照 → 目前做到哪裡 → 實際案例 → 額外成果 → 團隊介紹 → Logo
 * 沒有資料的區塊會自動隱藏，不顯示空殼。
 * 圖片欄位：src 為 assets/ 底下的檔名（含副檔名）。 */
const applications = [
  {
    id: 'firesight', featured: true,
    nav: '守護之眼 FireSight',
    title: '守護之眼 FireSight', name: 'FireSight', headline: '守護之眼',
    date: '2026', cat: '整合原型', maturity: 'test',
    label: '從這裡，看見消防科技的可能',
    summary: '整合現場影像、AI 辨識與感測資訊，為消防人員提供輔助判讀的資訊。',
    points: ['現場影像與辨識', '目標距離資訊', '機器人位置與朝向'],
    foot: '從原型開發，走向更多應用情境',
    cover: 'architecture.jpeg',
    techs: ['distance'],
    intro: {
      heading: '守護之眼 FireSight',
      sub: '把影像、辨識與距離資訊放在同一個畫面',
      body: ['守護之眼是專案的整合原型，將現場影像、AI 辨識結果與感測資訊整合在同一個畫面，協助消防人員判讀現場。目前整合的技術包含高雄科技大學團隊（林志學）的火焰辨識與深度測距；濃煙下的人員辨識請見「濃煙下的人員與火煙辨識」。']
    },
    progress: {
      text: '記者會展板呈現燃燒櫃影像中的火焰辨識與測距範例，畫面中約 8.70 公尺為該次展示結果。',
      image: { src: 'architecture.jpeg', alt: '火焰辨識與測距展板圖', caption: '技術展板擷取，非活動現場照片。' }
    },
    teams: ['lin', 'hsu'],
    pending: '正式介紹、介面截圖與展示影片待補。'
  },
  {
    id: 'press', featured: true,
    nav: '2026 CSR 公益捐贈記者會',
    title: '2026 CSR 公益捐贈記者會', name: 'CSR 2026', headline: '記者會技術展示',
    date: '2026.09.30', cat: '活動紀錄', maturity: 'done',
    label: '三項技術方向首次公開',
    summary: '以技術展板介紹消防 Edge AI 的合作方向與階段成果。',
    points: ['火焰辨識與測距', '多源感知融合', '物件辨識與計數'],
    foot: '活動照片與新聞稿待補',
    cover: 'distance.jpeg',
    techs: [],
    intro: {
      heading: '2026 CSR 公益捐贈記者會',
      sub: '三項技術方向首次公開',
      body: ['此次以記者會技術展板作為展示素材，彙整火焰辨識與測距、多源感知融合，以及物件辨識與計數三項方向。']
    },
    showcase: ['firesight', 'vision', 'count'],
    progress: {
      image: { src: 'distance.jpeg', alt: '記者會技術展板擷取', caption: '技術展板擷取，非活動現場照片。' }
    },
    teams: ['lin', 'hsu', 'north', 'tga'],
    pending: '活動照片、正式新聞稿與活動紀錄待補。'
  },
  {
    id: 'vision', featured: true,
    nav: '濃煙下的人員與火煙辨識',
    title: '濃煙下的人員與火煙辨識', name: '多源感知', headline: '濃煙中的多源感知',
    date: '2026.09', cat: '技術展示', maturity: 'test',
    label: '真火真煙訓練的測試成果',
    summary: '整合不同感測資訊，協助判讀人員、火與煙的位置。',
    points: ['真火真煙訓練', '多種感測資訊融合', '人員與火煙辨識'],
    foot: '測試數據附條件說明',
    cover: 'nycu-case.jpg',
    techs: ['smoke'],
    intro: {
      heading: '濃煙下的人員與火煙辨識',
      sub: '智慧多源感知融合 Edge AI',
      body: ['結合真實燃燒訓練影像與多種感測資訊，讓不同來源彼此補位，協助消防人員判讀「人在哪、火在哪、煙在哪」。邊緣 AI 讓辨識模型在現場設備上運算，減少對遠端機房的依賴。'],
      painHeading: '現場痛點與技術作法',
      pain: [
        '火場中的濃煙與火光會遮蔽人員及火點，一般攝影機難以完整呈現現場。只依賴單一影像來源，也可能因遮蔽與光線變化而漏掉重要目標。',
        '團隊在消防訓練場記錄真實燃燒訓練，以同一場景的無煙與起煙影像作對照，建立火、煙與人員目標的辨識資料，再融合不同感測資訊，研究濃煙下的目標辨識。火煙人辨識模型已展示在英飛凌邊緣 AI 晶片上即時執行。'
      ]
    },
    progress: {
      heading: '多元資料分析：辨識率與規模',
      stats: [
        { v: '178,200 張', l: '真火實燒影像・13 個場景，先乾淨後燒火配對' },
        { v: '3 類目標', l: '火、煙、人，這些都可以辨識' },
        { v: '3.3% → 93.3%', l: '人形目標被煙遮住九成以上時的辨識結果' },
        { v: '即時運算', l: '在英飛凌 E84 邊緣 AI 晶片上執行（實測速度：每秒 32.2 張）' }
      ],
      image: { src: 'nycu-chart.jpg', alt: '長條圖：人形目標被濃煙遮住的比例越高，一般影像辨識率越低，多源融合仍維持高辨識率', caption: '成果圖表，採用展板長條圖原圖。' },
      text: '2026 年 9 月展板記載：E84 模型處理速度為每秒 32.2 張；在人形目標遮蔽九成以上的展示情境中，一般影像辨識為 3.3%，多源融合為 93.3%。',
      note: '此為展板所述測試情境，並非所有火場的效果保證。'
    },
    cases: [
      { heading: '真實燃燒訓練中的辨識對照',
        body: '一般影像辨識在濃煙遮蔽下漏掉人形目標，多源感知融合仍能在畫面中標示目標位置，呈現不同感測資訊互補的效果。',
        images: [{ src: 'nycu-case.jpg', alt: '三張對照圖：低遮蔽時、起煙後一般影像辨識、同一煙霧畫面的多源感知融合結果' }],
        caption: '左為較低遮蔽時的畫面；中為起煙後的一般影像辨識；右為同一煙霧畫面的多源感知融合結果，煙後的人員目標為人形立板。' }
    ],
    extras: [
      { heading: '多源感測設備與載具',
        body: '團隊建置多源感測器架與履帶式載具，讓不同感測來源在同一場景同步取得資訊，支援煙霧影響分析、融合方法驗證及後續消防機器人應用開發。',
        images: [{ src: 'nycu-rig.jpg', alt: '團隊自製的多源感測器架' }, { src: 'nycu-crawler.jpg', alt: '履帶式載具' }],
        caption: '左為團隊自製的多源感測器架，右為履帶式載具。', pair: true },
      { heading: '不同感測來源的畫面',
        body: '同一場景以彩色、距離、光譜（假色）與材質分析四種方式呈現，上排為無煙情境，下排為起煙情境。',
        images: [{ src: 'nycu-sensing.jpg', alt: '彩色影像、距離影像、光譜影像與材質分析，無煙與起燃各一排' }],
        caption: '由左至右為彩色影像、距離影像、光譜影像（假色）與材質分析；上排為無煙情境，下排為起煙情境。' },
      { heading: '訓練場三維重建',
        body: '以手機拍攝的影片重建訓練場 3D 模型，將實際場域轉成可在電腦中查看的三維空間，並與實拍影像對照，呈現門窗、桶槽等場景結構的對位成果。',
        images: [{ src: 'nycu-3d.jpg', alt: '訓練場重建的三維模型與實拍對照' }],
        caption: '上方為訓練場重建模型；下方依序呈現實拍畫面、三維模型及疊合結果。', narrow: true }
    ],
    lab: {
      school: '國立陽明交通大學 臺南校區',
      dept: 'AI學院／智慧與綠能產學研究所',
      lab: 'ACVLab 前瞻電腦視覺實驗室',
      labDesc: '專注於電腦視覺與人工智慧，研究涵蓋低階視覺處理（Low-level Vision）、高效率 AI 運算（Efficient AI）、多源感知融合，以及機器人與視覺語言動作模型（VLA），致力讓 AI 看得清楚、理解環境，並在實際設備上高效運作。',
      pi: '許志仲 副教授',
      piDesc: '國立陽明交通大學 AI學院／智慧與綠能產學研究所副教授，主持 ACVLab 前瞻電腦視覺實驗室，以電腦視覺與人工智慧研究推進消防現場資訊判讀。',
      url: 'https://sites.google.com/view/acvlab',
      logos: [{ src: 'logo-nycu.png', alt: '國立陽明交通大學' }, { src: 'logo-acvlab.png', alt: 'ACVLab' }]
    },
    teams: ['hsu'],
    pending: ''
  },
  {
    id: 'count', featured: false,
    nav: '從手推車計數延伸消防應用',
    title: '從手推車計數延伸消防應用', name: '人員計數', headline: '人員計數',
    date: '2026.09', cat: '技術展示', maturity: 'research',
    label: '', summary: '以既有試作能力為基礎，推進消防人員辨識模型訓練。',
    points: [], foot: '',
    cover: 'people.jpeg',
    techs: ['count'],
    intro: {
      heading: '從手推車計數延伸消防應用',
      sub: '人員辨識與計數',
      body: ['北瀚科技已完成手推車辨識與計數試作。消防人員辨識及進出計數仍依展板所述階段推進，尚不呈現為已完成的火場部署成果。']
    },
    progress: {
      text: '已完成高雄國際機場站手推車辨識與數量統計試作；依 2026 年 9 月展板，正導入消防影像進行人員辨識模型訓練，虛擬界線與進出方向判斷仍屬規劃。',
      image: { src: 'people.jpeg', alt: '人員辨識展板圖', caption: '技術展板擷取。' }
    },
    cases: [
      { heading: '手推車辨識與數量統計試作', body: '以既有的手推車辨識與計數能力為基礎，延伸至火場人員辨識及計數。',
        images: [{ src: 'counting.jpeg', alt: '手推車辨識與計數展板圖' }], caption: '技術展板擷取。', narrow: true }
    ],
    teams: ['north'],
    pending: ''
  }
];

/* 設備／商城：介紹與詢價共用同一份資料（第一階段不做線上付款） */
const devices = [
  { id: 'e84', name: 'PSoC Edge E84 開發套件', sub: '邊緣 AI 開發', chip: 'E84',
    desc: '用於嵌入式 AI 模型部署與推論驗證。',
    spec: '正式規格待確認', price: '洽詢' },
  { id: 'orin', name: 'Jetson Orin 運算平台', sub: '影像運算與整合', chip: 'ORIN',
    desc: '專案中用於影像辨識、距離資訊整合與結果呈現。',
    spec: '正式展示規格待確認', price: '洽詢' },
  { id: 'depth', name: '深度影像感測模組', sub: '現場影像與深度資訊', chip: 'DEPTH',
    desc: '取得現場影像與深度資訊，支援火焰位置及距離判讀。',
    spec: '正式展示規格待確認', price: '洽詢' }
];
const ACCESS_NOTE = '由臺灣守護者聯盟社會公益協會擔任詢價窗口。目前不提供線上付款；價格、供應與取得方式由窗口回覆。';

/* 平台聯絡窗口（與我們聯繫）：聯絡我們頁與設備詢價共用；電話與信箱登入後才顯示
 * 守護者協會卡片的聯繫窗口另填（余亮璇 專案經理），信箱沿用協會信箱 */
const CONTACT = {
  org: '臺灣守護者聯盟社會公益協會',
  name: '吳泓億',
  phone: '0935-636-776',
  email: 'guardianedgeai@gmail.com'
};

/* 合作團隊（PARTNERS）：卡片同尺寸，依陣列順序排列；最後固定加一張「歡迎加入」（由版面產生，不寫在這裡）
 * personLabel：學研單位用「主持人」，企業與協會用「聯繫窗口」
 * person：姓名職稱；空白時卡片顯示「主持人待補」或「聯繫窗口待補」
 * role：單位頁「平台角色」說明（沒有負責技術模組的單位會顯示這段）
 * phone、email：聯繫窗口的電話與信箱，登入後才顯示（正式版須由後端控管，見 HANDOFF）
 * 窗口姓名對外顯示英文
 * pending：素材尚未到齊時顯示「素材待補」；到齊後刪掉這個欄位 */
const teams = [
  { id: 'infineon', name: '英飛凌科技', type: '企業', title: '核心技術合作夥伴',
    personLabel: '聯繫窗口', person: 'Lydia Huang', email: 'Lydia.Huang@infineon.com',
    logos: ['logo-infineon.svg'], url: 'https://www.infineon.com/',
    brief: '提供 Edge AI 晶片、開發板、技術文件與開發工具，支援消防 AI 研發與場域驗證。',
    role: '核心技術合作夥伴，擔任三個角色：資源提供者（消防 AI 研發與場域驗證所需資源）、產品供應商（Edge AI 晶片、開發板與相關技術產品）、技術支援者（技術文件、開發工具與技術支援）。' },
  { id: 'tga', name: '臺灣守護者聯盟社會公益協會', type: '協會', title: '連結消防現場與開發團隊',
    personLabel: '聯繫窗口', person: '余亮璇 專案經理', email: CONTACT.email,
    logos: ['guardians.png'], pending: '官網待補',
    brief: '串聯現場需求、學研及產業合作，推進消防科技交流。',
    role: '平台營運與聯絡窗口：負責合作洽詢、設備詢價與網站聯絡事項。' },
  { id: 'lin', name: '高雄科技大學團隊', type: '學研團隊', title: '火焰辨識與即時測距',
    personLabel: '主持人', person: '林志學', photo: true, pending: '主持人形象照、職稱與官網待補',
    brief: '結合火焰辨識與深度測距，讓現場影像同時呈現火焰位置及距離。', app: 'firesight' },
  { id: 'hsu', name: '陽明交通大學團隊', type: '學研團隊', title: '濃煙下的人員與火煙辨識',
    personLabel: '主持人', person: '許志仲 副教授', org: '國立陽明交通大學・ACVLab',
    logos: ['logo-nycu.png', 'logo-acvlab.png'], url: 'https://sites.google.com/view/acvlab',
    brief: '以真火真煙訓練與多源感知融合，讓不同感測資訊彼此補位。', app: 'vision' },
  { id: 'north', name: '北瀚科技', type: '企業', title: '從物件計數走向消防應用',
    personLabel: '聯繫窗口', person: '', logoText: '企業 Logo', pending: '企業 Logo、聯繫窗口與官網待補',
    brief: '以既有的手推車辨識與計數試作，延伸探索火場人員辨識及計數。', app: 'count' }
];

/* 計畫進程（ROADMAP）：沿用原網站的日期與說明，改用交大示意圖的呈現方式
 * state = done / now / next；icon = code / show / build / shield */
const progress = [
  { t: '技術原型開發', d: '邊緣 AI 模型部署與板上驗證', when: '2026 上半年', state: 'done', icon: 'code' },
  { t: '記者會技術展示', d: '公開三項技術方向', when: '2026.09.30', state: 'done', icon: 'show' },
  { t: '開發平台建置', d: '平台網站與交流機制', when: '2026.11（目標）', state: 'now', icon: 'build' },
  { t: '後續應用延伸', d: '依各團隊規劃推進', when: '待規劃', state: 'next', icon: 'shield' }
];
const STATE_LABEL = { done: '已完成', now: '進行中', next: '規劃中' };

/* 討論主題（示意資料；scenario 對應 techs.id；status：open 待回覆 / answered 已解答） */
const seedTopics = [
  { id: '1', title: '火焰辨識與距離資訊如何在同一畫面整合？', cat: '技術交流', scenario: 'distance',
    author: '示意開發者', identity: '開發者', date: '2026.10.20', status: 'answered',
    body: '使用設備：深度相機、Jetson Orin、E84\n遇到的問題：想了解三者在流程中各自負責哪些工作，以及如何在同一畫面呈現辨識框與距離。',
    replies: [{ author: '示意團隊成員', identity: '學研', accepted: true,
      text: '可先參考「守護之眼 FireSight」頁的技術細節：深度影像負責距離、邊緣設備負責辨識，最後疊加在同一畫面。實際介接文件待團隊提供。' }] },
  { id: '2', title: '濃煙情境中，不同感測來源的限制是什麼？', cat: '技術交流', scenario: 'smoke',
    author: '示意參與者', identity: '學研', date: '2026.10.18', status: 'open',
    body: '希望交流不同感測來源在濃煙環境下的限制與可能性。', replies: [] },
  { id: '3', title: '現場最希望畫面上同時顯示哪些資訊？', cat: '現場需求', scenario: '',
    author: '示意消防同仁', identity: '消防人員', date: '2026.10.15', status: 'open',
    body: '這是一筆需求討論範例：例如火源距離、人員位置、人數，哪些在現場最常需要？', replies: [] },
  { id: '4', title: '人員計數在出入口的安裝位置要怎麼選？', cat: '使用問題', scenario: 'count',
    author: '示意訪客', identity: '一般', date: '2026.10.12', status: 'open',
    body: '想了解攝影機架設高度與角度對計數的影響。', replies: [] }
];
const TOPIC_CATS = ['技術交流', '現場需求', '使用問題'];
const IDENTITIES = ['消防人員', '開發者', '學研', '廠商', '一般'];
