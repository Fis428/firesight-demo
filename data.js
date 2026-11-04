/* 消防 Edge AI 平台｜內容資料
 * 所有頁面內容都從這個檔案讀取。新增或修改內容只要改這裡，不用動版面程式。
 * 各類內容以 id 互相關聯（例如情境的 team、devices、outcomes）。
 * 正式版由 Vic 改為資料庫，欄位對照請見 HANDOFF.md。
 */

/* 成熟度：固定三種，對應資料模板的「成熟度」欄位 */
const MATURITY = {
  done:     { label: '已完成', note: '已完成驗證' },
  test:     { label: '測試中', note: '已有展示或測試結果，仍在驗證' },
  research: { label: '研究中', note: '仍在研究或規劃階段' }
};

/* 應用情境：給民眾看的入口，也是技術說明的主頁 */
const scenarios = [
  {
    id: 'distance',
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
    resultImage: 'architecture',
    method: '透過深度相機取得影像，結合 NVIDIA Jetson Orin 與 Infineon E84，在邊緣設備上進行火焰辨識及距離估算，標示火焰位置、辨識框與即時距離。',
    future: '規劃整合於消防載具或可攜式設備，並串接指揮 Dashboard，提供前後方共同判讀。',
    devices: ['depth', 'orin', 'e84'],
    compare: { before: '煙霧中只看得到模糊火光', after: '標出火源位置與估算距離' }
  },
  {
    id: 'smoke',
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
    resultImage: 'fusion',
    method: '在消防訓練中心進行真實燃燒訓練，以同一設備拍攝起火前後畫面，融合不同低成本感測器資訊，協助辨識人員、火與煙。',
    future: '未來可探索消防機器人、無人載具的濃煙搜救，以及受困者與火點定位。',
    devices: ['e84'],
    compare: { before: '濃煙遮住人員輪廓', after: '標出人員與火點位置' }
  },
  {
    id: 'count',
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
    resultImage: 'people',
    method: '使用攝影機搭配 Infineon PSoC Edge E84 Evaluation Kit，以既有的手推車辨識與計數能力為基礎，延伸至火場人員辨識及計數。',
    future: '逐步發展火場人員辨識與計數，作為人工清點與無線電回報的輔助工具。',
    devices: ['e84'],
    compare: { before: '畫面中人員交錯，難以清點', after: '逐一標出人員並計數' }
  }
];

/* 成果：featured 為 true 的會出現在首頁「代表成果」卡片列，依陣列順序排列 */
const outcomes = [
  {
    id: 'firesight', featured: true,
    title: '守護之眼 FireSight', name: 'FireSight', headline: '守護之眼',
    date: '2026', cat: '整合原型', maturity: 'test',
    label: '從這裡，看見消防科技的可能',
    summary: '整合現場影像、AI 辨識與感測資訊，為消防人員提供輔助判讀的資訊。',
    points: ['現場影像與辨識', '目標距離資訊', '機器人位置與朝向'],
    foot: '從原型開發，走向更多應用情境',
    image: 'architecture',
    body: '守護之眼是專案的整合原型，將現場影像、AI 辨識結果與感測資訊整合在同一個畫面，協助消防人員判讀現場。正式介紹、介面截圖與展示影片待補。',
    scenarios: ['distance', 'smoke']
  },
  {
    id: 'press', featured: true,
    title: '2026 CSR 公益捐贈記者會', name: 'CSR 2026', headline: '記者會技術展示',
    date: '2026.09.30', cat: '活動紀錄', maturity: 'done',
    label: '三項技術方向首次公開',
    summary: '以技術展板介紹消防 Edge AI 的合作方向與階段成果。',
    points: ['火焰辨識與測距', '多源感知融合', '物件辨識與計數'],
    foot: '活動照片與新聞稿待補',
    image: 'distance',
    body: '此次以記者會技術展板作為展示素材，彙整火焰辨識與測距、多源感知融合，以及物件辨識與計數三項方向。活動照片、正式新聞稿與活動紀錄待補。',
    scenarios: ['distance', 'smoke', 'count']
  },
  {
    id: 'vision', featured: true,
    title: '濃煙環境下的多源感知探索', name: '多源感知', headline: '濃煙中的多源感知',
    date: '2026.09', cat: '技術展示', maturity: 'test',
    label: '真火真煙訓練的測試成果',
    summary: '以真實燃燒訓練與多源資訊融合，探索濃煙中的人員與火煙辨識。',
    points: ['真火真煙訓練', '多種感測資訊融合', '人員與火煙辨識'],
    foot: '測試數據附條件說明，詳見情境頁',
    image: 'fusion',
    body: '許志仲團隊以真實燃燒訓練與多源資訊融合，探索濃煙中人員與火煙辨識。測試數據與限制請見情境頁。',
    scenarios: ['smoke']
  },
  {
    id: 'count', featured: false,
    title: '從手推車計數延伸消防應用', name: '人員計數', headline: '人員計數',
    date: '2026.09', cat: '技術展示', maturity: 'research',
    label: '', summary: '以既有試作能力為基礎，推進消防人員辨識模型訓練。',
    points: [], foot: '', image: 'people',
    body: '北瀚科技已完成手推車辨識與計數試作。消防人員辨識及進出計數仍依展板所述階段推進，尚不呈現為已完成的火場部署成果。',
    scenarios: ['count']
  }
];

/* 設備：資源與洽詢共用同一份資料 */
const devices = [
  { id: 'e84', name: 'PSoC Edge E84 開發套件', sub: '邊緣 AI 開發', chip: 'E84',
    desc: '用於嵌入式 AI 模型部署與推論驗證。',
    spec: '正式規格待確認' },
  { id: 'orin', name: 'Jetson Orin 運算平台', sub: '影像運算與整合', chip: 'ORIN',
    desc: '專案中用於影像辨識、距離資訊整合與結果呈現。',
    spec: '正式展示規格待確認' },
  { id: 'depth', name: '深度影像感測模組', sub: '現場影像與深度資訊', chip: 'DEPTH',
    desc: '取得現場影像與深度資訊，支援火焰位置及距離判讀。',
    spec: '正式展示規格待確認' }
];
const ACCESS_NOTE = '由台灣守護者聯盟協會（TGA）擔任洽詢窗口。價格、供應與取得方式待確認。';

/* 合作團隊 */
const teams = [
  { id: 'lin', name: '林志學團隊', type: '學研團隊', title: '火焰辨識與即時測距', image: 'distance',
    brief: '結合火焰辨識與深度測距，讓現場影像同時呈現火焰位置及距離。' },
  { id: 'hsu', name: '許志仲團隊', type: '學研團隊', title: '濃煙下的人員與火煙辨識', image: 'fusion',
    brief: '以真火真煙訓練與多源感知融合，讓不同感測資訊彼此補位。' },
  { id: 'north', name: '北瀚科技', type: '產業合作', title: '從物件計數走向消防應用', image: 'counting',
    brief: '以既有的手推車辨識與計數試作，延伸探索火場人員辨識及計數。' },
  { id: 'tga', name: '台灣守護者聯盟協會', type: '專案協作', title: '連結消防現場與開發團隊', image: '',
    brief: '串聯現場需求、學研及產業合作，推進消防科技交流；設備洽詢窗口。正式介紹待協會確認。' }
];

/* 計畫進度：state = done / now / next */
const progress = [
  { t: '技術原型開發', d: '邊緣 AI 模型部署與板上驗證', when: '2026 上半年', state: 'done' },
  { t: '記者會技術展示', d: '公開三項技術方向', when: '2026.09.30', state: 'done' },
  { t: '開發平台建置', d: '平台網站與交流機制', when: '2026.11（目標）', state: 'now' },
  { t: '後續應用延伸', d: '依各團隊規劃推進', when: '待規劃', state: 'next' }
];

/* 討論主題（示意資料；status：open 待回覆 / answered 已解答） */
const seedTopics = [
  { id: '1', title: '火焰辨識與距離資訊如何在同一畫面整合？', cat: '技術交流', scenario: 'distance',
    author: '示意開發者', identity: '開發者', date: '2026.10.20', status: 'answered',
    body: '使用設備：深度相機、Jetson Orin、E84\n遇到的問題：想了解三者在流程中各自負責哪些工作，以及如何在同一畫面呈現辨識框與距離。',
    replies: [{ author: '示意團隊成員', identity: '學研', accepted: true,
      text: '可先參考「看清火源有多遠」情境頁的技術細節：深度影像負責距離、邊緣設備負責辨識，最後疊加在同一畫面。實際介接文件待團隊提供。' }] },
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
