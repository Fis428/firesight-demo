/* 消防 Edge AI 平台｜互動示意版
 * 內容在 data.js；這個檔案負責路由、版面、互動與「登入示意」。
 * 登入、發文、洽詢都只在瀏覽器內模擬，正式實作請見 HANDOFF.md。
 */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (arr, id) => arr.find(x => x.id === id);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const img = (name, alt) => name ? `<img src="assets/${name}.jpeg" alt="${esc(alt)}" loading="lazy">` : '';
const link = (path, text, cls = 'btn', extra = '') => `<a class="${cls}" href="#/${path}" ${extra}>${text} <span aria-hidden="true">→</span></a>`;
const badge = key => `<span class="mat mat-${key}">${MATURITY[key].label}</span>`;
const SOURCE_NOTE = '資料依 2026 年 9 月「技術說明展板規劃」整理；進度標示為示意，待各團隊確認。';
const today = () => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };

function hero(title, eng, desc, parent) {
  return `<section class="page-hero"><div class="wrap"><div class="crumb"><a href="#/">首頁</a> / ${parent ? `<a href="#/${parent[0]}">${parent[1]}</a> / ` : ''}${esc(title)}</div><span class="kicker">${eng}</span><h1>${esc(title)}</h1><p>${desc}</p></div></section>`;
}

/* ---------- 登入示意（瀏覽器內模擬，sessionStorage 保存到關閉分頁為止） ---------- */
const AUTH_KEY = 'fs-demo-auth';
let auth = (() => { try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)) || { role: 'guest' }; } catch { return { role: 'guest' }; } })();
const saveAuth = () => { try { sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth)); } catch { /* 無法保存時，只在本頁有效 */ } };
const loggedIn = () => auth.role !== 'guest';
const me = () => auth.profile || { name: '', identity: '' };

const REASONS = {
  post: ['登入後即可發起討論', '你的討論會顯示名稱與身分，並可以在會員中心追蹤回覆。'],
  reply: ['登入後即可回覆', '你剛剛輸入的內容會保留，登入完成後自動送出。'],
  member: ['登入以查看會員中心', '會員中心集中顯示你的發文與洽詢紀錄。'],
  admin: ['管理員登入', '內容管理後臺僅限指定的管理員帳號。'],
  default: ['登入平台', '瀏覽網站不需要登入。登入後可以發文、回覆，並在會員中心追蹤。']
};
let pendingAfterLogin = null, lastFocus = null;

function openLogin(reason = 'default', after = null) {
  pendingAfterLogin = after; lastFocus = document.activeElement;
  const [t, d] = REASONS[reason] || REASONS.default;
  showModal(`<span class="kicker">SIGN IN</span><h2 id="m-title">${t}</h2><p>${d}</p>
    <button class="google-btn" data-google><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>使用 Google 帳號登入</span><small>示意，不會連線</small></button>
    <p class="meta">正式版由後端串接 Google 登入。是否需要公務信箱等其他登入方式，待確認。</p>`);
}
function profileStep(editing = false) {
  const p = me();
  showModal(`<span class="kicker">${editing ? 'PROFILE' : 'FIRST SIGN-IN'}</span><h2 id="m-title">${editing ? '修改個人資料' : '第一次登入，請補上基本資料'}</h2>
    <p>名稱與身分會顯示在你的發文旁，方便大家理解提問的背景。</p>
    <form id="profile-form"><label for="p-name">顯示名稱 *</label><input id="p-name" name="name" required maxlength="30" value="${esc(p.name)}" autocomplete="nickname">
    <fieldset class="id-pick"><legend>身分 *</legend>${IDENTITIES.map((x, i) => `<label><input type="radio" name="identity" value="${x}" ${(p.identity ? p.identity === x : i === 0) ? 'checked' : ''}><span>${x}</span></label>`).join('')}</fieldset>
    ${editing ? '' : '<label class="check"><input type="checkbox" name="agree" required> 我同意平台使用規範（規範內容待訂）</label>'}
    <div class="actions"><button class="btn primary">${editing ? '儲存' : '完成登入'}</button></div></form>`);
}
function showModal(inner) {
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close><div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title"><button class="modal-x" data-close aria-label="關閉">×</button>${inner}</div></div>`;
  document.body.classList.add('modal-open');
  ($('#modal-root input:not([type=radio]):not([type=checkbox])') || $('#modal-root [data-google]') || $('.modal-x')).focus();
}
function closeModal() {
  $('#modal-root').innerHTML = ''; document.body.classList.remove('modal-open');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
function finishLogin() {
  closeModal(); renderAccount();
  toast(`已登入：${me().name}（${me().identity}）`);
  const run = pendingAfterLogin; pendingAfterLogin = null;
  if (run) run(); else if (['member', 'admin', 'community'].includes(route().section)) render();
}
function setRole(role) {
  if (role === 'guest') auth.role = 'guest';
  else {
    if (!auth.profile) auth.profile = role === 'admin' ? { name: '示意管理員', identity: '一般' } : { name: '示意會員', identity: '消防人員' };
    auth.role = role;
  }
  saveAuth(); renderAccount();
}
function renderAccount() {
  $('#role-switch').value = auth.role;
  if (!loggedIn()) { $('#account').innerHTML = '<button class="btn small ghost" data-login>登入</button>'; return; }
  const p = me();
  $('#account').innerHTML = `<div class="acct"><button class="acct-btn" aria-haspopup="true" aria-expanded="false" data-acct><span class="avatar" aria-hidden="true">${esc(p.name.slice(0, 1))}</span><span class="acct-name">${esc(p.name)}</span></button>
    <div class="acct-menu" hidden><div class="acct-head"><strong>${esc(p.name)}</strong><span>${esc(p.identity)}${auth.role === 'admin' ? ' · 管理員' : ''}</span></div><a href="#/member">會員中心</a>${auth.role === 'admin' ? '<a href="#/admin">內容管理後臺</a>' : ''}<button data-logout>登出</button></div></div>`;
}
function gatePage(title, reason) {
  return hero(title, 'SIGN IN REQUIRED', '瀏覽網站不需要登入；這項功能需要先登入。') + `<div class="wrap page-body"><div class="gate"><p>${REASONS[reason][1]}</p><button class="btn primary" data-login="${reason}">登入以繼續</button></div></div>`;
}

/* ---------- 首頁 ---------- */
function featuredCarousel() {
  const items = outcomes.filter(o => o.featured), n = items.length;
  return `<section class="fc" aria-roledescription="carousel" aria-label="代表成果">
  <div class="fc-track" tabindex="0" aria-label="代表成果，可左右滑動">${items.map((o, i) => `
    <article class="fc-slide feature" role="group" aria-roledescription="slide" aria-label="第 ${i + 1} 個，共 ${n} 個：${esc(o.headline)}">
      <div class="feature-top"><span class="feature-kicker">代表成果</span><span class="feature-name">${esc(o.name)}</span></div>
      <div class="feature-body"><div class="fc-meta"><span class="feature-label">${esc(o.label)}</span>${badge(o.maturity)}</div><h2>${esc(o.headline)}</h2><p>${esc(o.summary)}</p><ul>${o.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${link('results/' + o.id, '了解這項成果', 'text-btn')}</div>
      <div class="feature-bottom">${esc(o.foot)}</div></article>`).join('')}
  </div>
  ${n > 1 ? `<div class="fc-controls"><button class="fc-btn" data-fc="-1" aria-label="上一個成果">←</button><div class="fc-dots">${items.map((o, i) => `<button class="fc-dot" data-fc-go="${i}" aria-label="第 ${i + 1} 個：${esc(o.headline)}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('')}</div><span class="fc-count" aria-live="polite">1 / ${n}</span><button class="fc-btn" data-fc="1" aria-label="下一個成果">→</button></div>` : ''}
</section>`;
}
function scnTab(s, on) {
  return `<button class="scn-tab" role="tab" id="tab-${s.id}" aria-selected="${on}" aria-controls="scn-panel" tabindex="${on ? 0 : -1}" data-scn="${s.id}"><span class="scn-tech">${esc(s.tech)}</span><strong>${esc(s.title)}</strong><span class="scn-hook">${esc(s.hook)}</span>${badge(s.maturity)}</button>`;
}
function steps(s) { return `<ol class="steps">${s.steps.map((st, i) => `<li><b aria-hidden="true">${i + 1}</b><strong>${esc(st.t)}</strong><span>${esc(st.d)}</span></li>`).join('')}</ol>`; }
function scnPanel(s) {
  const team = byId(teams, s.team);
  return `<div class="scn-grid"><div class="scn-text">
    <div class="scn-status">${badge(s.maturity)}<span class="meta">${MATURITY[s.maturity].note}</span></div>
    <h3>${esc(s.title)}</h3>
    <h4>現場的困難</h4><p>${esc(s.need)}</p>
    <h4>AI 怎麼做</h4>${steps(s)}
    <h4>目前做到哪裡</h4><p>${esc(s.result)}</p></div>
    <div class="scn-visual">${compare(s)}</div></div>
    <div class="scn-actions">${link('scenarios/' + s.id, '完整介紹與技術細節', 'btn primary')}${link('community?scenario=' + s.id, '看相關討論')}<span class="meta">負責：<a href="#/team/${team.id}">${esc(team.name)}</a></span></div>`;
}

/* 對照滑桿：左邊一般畫面、右邊 AI 辨識畫面（目前為示意圖） */
function compare(s) {
  return `<figure class="compare" style="--pos:50%"><div class="cmp-stage">
    <div class="cmp-layer">${scene(s.id, 'after')}</div><div class="cmp-layer cmp-before">${scene(s.id, 'before')}</div>
    <div class="cmp-line" aria-hidden="true"><span>⇆</span></div>
    <span class="cmp-label cmp-l">一般畫面</span><span class="cmp-label cmp-r">AI 辨識</span>
    <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="拖曳比較：一般畫面與 AI 辨識畫面"></div>
    <figcaption><span><b>左</b>${esc(s.compare.before)}</span><span><b>右</b>${esc(s.compare.after)}</span><em>示意圖，待替換為團隊提供的實際對照畫面</em></figcaption></figure>`;
}
function person(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="#1c2a31"><circle cx="0" cy="-62" r="11"/><rect x="-15" y="-49" width="30" height="46" rx="10"/><rect x="-13" y="-8" width="10" height="38" rx="4"/><rect x="3" y="-8" width="10" height="38" rx="4"/></g>`;
}
function flame(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-30 0 -34 -34 -14 -58 C-12 -40 -2 -40 0 -52 C6 -70 2 -84 -6 -96 C26 -80 36 -46 26 -20 C34 -26 36 -36 34 -44 C46 -26 40 0 0 0Z" fill="#e8662a"/><path d="M2 0 C-14 0 -18 -18 -6 -32 C-4 -22 4 -22 6 -30 C16 -20 18 0 2 0Z" fill="#f6c343"/></g>`;
}
function box(x, y, w, h, label) {
  const lw = label.length * 13 + 14;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#2ee6c6" stroke-width="2.5"/><rect x="${x}" y="${y - 22}" width="${lw}" height="22" fill="#2ee6c6"/><text x="${x + 7}" y="${y - 6}" font-size="13" font-weight="700" fill="#0b2a26">${label}</text>`;
}
function scene(id, mode) {
  const after = mode === 'after';
  const objects = id === 'distance' ? flame(335, 215, 1.1)
    : id === 'smoke' ? person(165, 225) + flame(360, 228, .7)
    : person(120, 232, .9) + person(235, 222) + person(345, 236, .85);
  const marks = !after ? '' : id === 'distance' ? box(290, 100, 92, 120, '火源 · 距離估算')
    : id === 'smoke' ? box(140, 150, 52, 110, '人員') + box(334, 152, 52, 80, '火點')
    : box(98, 162, 44, 100, '人員 1') + box(212, 148, 48, 106, '人員 2') + box(323, 168, 44, 96, '人員 3') + '<rect x="18" y="58" width="96" height="28" fill="#0b2a26" opacity=".85"/><text x="28" y="78" font-size="15" font-weight="700" fill="#2ee6c6">人數：3</text>';
  return `<svg viewBox="0 0 480 300" role="img" aria-label="${after ? 'AI 辨識畫面示意' : '一般攝影機畫面示意'}" preserveAspectRatio="xMidYMid slice">
    <rect width="480" height="300" fill="#3a4a52"/><path d="M0 300 L120 190 H360 L480 300Z" fill="#2b383e"/><path d="M120 190 V40 H360 V190" fill="none" stroke="#4d5f68" stroke-width="2"/>
    ${objects}
    <rect width="480" height="300" fill="#a9b3b8" opacity="${after ? .5 : .82}"/>
    <ellipse cx="150" cy="150" rx="170" ry="70" fill="#c7cfd2" opacity="${after ? .25 : .55}"/><ellipse cx="360" cy="120" rx="150" ry="60" fill="#c7cfd2" opacity="${after ? .2 : .5}"/>
    ${marks}
    </svg>`;
}

function home(params) {
  const s = byId(scenarios, params.get('s')) || scenarios[0];
  return `<section class="hero"><div class="wrap hero-grid">
    <div class="reveal"><div class="eyebrow">消防科技 · 應用情境 · 技術交流</div><h1>讓科技走進現場<br><span>讓創新持續發生</span></h1>
      <p class="intro">濃煙裡看不清火源與人員，是消防現場的日常挑戰。<br>我們串連學研與產業，探索用 Edge AI 協助判讀現場資訊。</p>
      <div class="actions"><button class="btn primary" data-scroll="scenarios">看 AI 如何協助救災 <span aria-hidden="true">↓</span></button>${link('community', '技術交流專區')}</div>
      <p class="hero-note">消防與技術人員可以直接進入交流專區，查找技術細節與設備資訊。</p></div>
    ${featuredCarousel()}</div></section>
  <section id="scenarios" class="band"><div class="wrap">
    <div class="section-head reveal"><div><span class="kicker">APPLICATIONS</span><h2>AI 可以在現場幫上什麼忙？</h2></div><small>點選情境，看看它怎麼運作</small></div>
    <div class="scn-tabs reveal" role="tablist" aria-label="應用情境">${scenarios.map(x => scnTab(x, x.id === s.id)).join('')}</div>
    <div id="scn-panel" class="scn-panel" role="tabpanel" aria-labelledby="tab-${s.id}">${scnPanel(s)}</div></div></section>
  <section class="wrap block"><div class="section-head reveal"><div><span class="kicker">ROADMAP</span><h2>計畫目前走到哪裡</h2></div><small>進度為示意，待團隊確認</small></div>
    <ol class="timeline reveal">${progress.map(p => `<li class="tl-${p.state}" ${p.state === 'now' ? 'aria-current="step"' : ''}><span class="tl-dot" aria-hidden="true"></span><span class="tl-when">${esc(p.when)}</span><strong>${esc(p.t)}</strong><span class="tl-d">${esc(p.d)}</span>${p.state === 'now' ? '<span class="tag">目前階段</span>' : ''}</li>`).join('')}</ol></section>
  <section class="wrap block"><div class="section-head reveal"><div><span class="kicker">PARTNERS</span><h2>一起推進的團隊</h2></div>${link('about', '關於計畫', 'text-btn')}</div>
    <div class="team-strip reveal">${teams.map(t => `<a class="team-mini" href="#/team/${t.id}"><span class="tag">${esc(t.type)}</span><strong>${esc(t.name)}</strong><span>${esc(t.title)}</span></a>`).join('')}</div></section>
  <section class="wrap block last"><div class="section-head reveal"><div><span class="kicker">GET INVOLVED</span><h2>接下來，你可以</h2></div></div>
    <div class="join reveal">${[
      ['results', '看更多成果', '記者會、技術展示與整合原型'],
      ['community', '加入技術交流', '提出現場需求或技術問題'],
      ['devices', '洽詢相關設備', '由台灣守護者聯盟協會擔任窗口'],
      ['contact', '合作聯絡', '學研、產業或消防單位的合作提案']
    ].map(([p, t, d]) => `<a class="join-card" href="#/${p}"><strong>${t}</strong><span>${d}</span><i aria-hidden="true">→</i></a>`).join('')}</div></section>`;
}

/* ---------- 應用情境 ---------- */
function scenariosPage(id) {
  if (!id) return hero('應用情境', 'APPLICATIONS', '從消防現場的困難出發，認識每項技術能幫上什麼忙。') + `<div class="wrap page-body"><div class="grid3">${scenarios.map(s => `<article class="card reveal"><div class="art">${img(s.resultImage, s.title)}</div><div class="card-body"><div class="card-tags"><span class="tag">${esc(s.tech)}</span>${badge(s.maturity)}</div><h3>${esc(s.title)}</h3><p>${esc(s.hook)}</p>${link('scenarios/' + s.id, '看它怎麼運作', 'text-btn')}</div></article>`).join('')}</div><p class="source-note">${SOURCE_NOTE}</p></div>`;
  const s = byId(scenarios, id); if (!s) return missing();
  const team = byId(teams, s.team), related = outcomes.filter(o => o.scenarios.includes(s.id));
  return hero(s.title, esc(s.tech), esc(s.hook), ['scenarios', '應用情境']) + `<div class="wrap page-body two-col"><article class="prose">
    <div class="scn-status">${badge(s.maturity)}<span class="meta">${MATURITY[s.maturity].note}</span></div>
    <h2>現場的困難</h2><p>${esc(s.need)}</p><h2>AI 怎麼做</h2>${steps(s)}${compare(s)}
    <h2>目前做到哪裡</h2><p>${esc(s.result)}</p>${img(s.resultImage, s.title + '的展板圖片')}
    <details class="tech-details"><summary>技術細節（給消防與技術人員）</summary>
      <h3>技術做法</h3><p>${esc(s.method)}</p>
      <h3>使用設備</h3><ul>${s.devices.map(d => `<li><a href="#/devices/${d}">${esc(byId(devices, d).name)}</a></li>`).join('')}</ul>
      <h3>後續應用方向</h3><p>${esc(s.future)}</p>
      <p class="meta">技術文件、程式碼與介接說明待團隊提供。</p></details>
    <p class="source-note">${SOURCE_NOTE}</p></article>
  <aside class="side-stack"><div class="sidebox"><h3>負責團隊</h3><p><a href="#/team/${team.id}">${esc(team.name)}</a><br>${esc(team.title)}</p></div>
    <div class="sidebox"><h3>交流這項應用</h3><p>對技術或現場使用有疑問，可以到交流專區討論。</p>${link('community?scenario=' + s.id, '看相關討論')}${link('community/new?scenario=' + s.id, '發起討論', 'btn primary', 'data-gate="post"')}</div>
    ${related.length ? `<div class="sidebox"><h3>相關成果</h3><ul class="plain">${related.map(o => `<li><a href="#/results/${o.id}">${esc(o.title)}</a></li>`).join('')}</ul></div>` : ''}
    <div class="sidebox"><h3>其他情境</h3><ul class="plain">${scenarios.filter(x => x.id !== s.id).map(x => `<li><a href="#/scenarios/${x.id}">${esc(x.title)}</a></li>`).join('')}</ul></div></aside></div>`;
}

/* ---------- 成果 ---------- */
function results(id) {
  if (!id) return hero('成果', 'PROJECT STORIES', '記錄合作的每一步，看見消防科技從構想到實作。') + `<div class="wrap page-body">${outcomes.map(r => `<article class="result-row reveal"><div class="art">${img(r.image, r.title)}</div><div><span class="meta">${esc(r.date)} · ${esc(r.cat)}</span> ${badge(r.maturity)}${r.featured ? ' <span class="tag">代表成果</span>' : ''}<h3><a href="#/results/${r.id}">${esc(r.title)}</a></h3><p>${esc(r.summary)}</p></div>${link('results/' + r.id, '閱讀更多', 'text-btn')}</article>`).join('')}<p class="source-note">圖片為技術展板擷取，作為版型範例；正式活動照片與新聞連結待補。</p></div>`;
  const r = byId(outcomes, id); if (!r) return missing();
  return hero(r.title, 'PROJECT STORY', `${esc(r.date)} · ${esc(r.cat)}`, ['results', '成果']) + `<div class="wrap page-body two-col"><article class="prose"><div class="scn-status">${badge(r.maturity)}</div><p>${esc(r.body)}</p>${r.points.length ? `<ul>${r.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${img(r.image, r.title)}<p class="source-note">圖片為技術展板擷取，非活動現場照片。</p></article>
  <aside class="side-stack"><div class="sidebox"><h3>相關應用情境</h3><ul class="plain">${r.scenarios.map(x => `<li><a href="#/scenarios/${x}">${esc(byId(scenarios, x).title)}</a></li>`).join('')}</ul></div><div class="sidebox"><h3>延伸了解</h3><p>想了解合作方式，或提出現場需求？</p>${link('contact?item=' + encodeURIComponent(r.title), '聯繫專案窗口')}</div></aside></div>`;
}

/* ---------- 設備（資源與洽詢共用） ---------- */
const device = (d) => `<div class="device">${d.chip}<small>概念示意圖</small></div>`;
function devicesPage(id) {
  if (!id) return hero('設備', 'DEVICES', '專案使用的開發設備。想取得設備，由台灣守護者聯盟協會擔任洽詢窗口。') + `<div class="wrap page-body"><div class="notice">${ACCESS_NOTE}</div><div class="grid3">${devices.map(d => `<article class="card reveal"><div class="art">${device(d)}</div><div class="card-body"><span class="tag">${esc(d.sub)}</span><h3>${esc(d.name)}</h3><p>${esc(d.desc)}</p>${link('devices/' + d.id, '查看設備', 'text-btn')}</div></article>`).join('')}</div></div>`;
  const d = byId(devices, id); if (!d) return missing();
  const used = scenarios.filter(s => s.devices.includes(d.id));
  return hero(d.name, 'DEVICE', esc(d.sub), ['devices', '設備']) + `<div class="wrap page-body"><div class="product-hero"><div class="art">${device(d)}</div><div class="prose"><span class="tag">${esc(d.sub)}</span><h2>${esc(d.name)}</h2><p>${esc(d.desc)}</p>${link(`contact?purpose=${encodeURIComponent('設備詢問')}&item=${encodeURIComponent(d.name)}`, '向 TGA 洽詢此設備', 'btn primary')}<p class="meta">${ACCESS_NOTE}</p></div></div>
  <h2 class="spaced">設備資訊</h2><table class="spec"><tbody><tr><td>用途</td><td>${esc(d.desc)}</td></tr><tr><td>規格</td><td>${esc(d.spec)}</td></tr><tr><td>用在哪些情境</td><td>${used.map(s => `<a href="#/scenarios/${s.id}">${esc(s.title)}</a>`).join('、')}</td></tr><tr><td>取得方式</td><td>${ACCESS_NOTE}</td></tr></tbody></table></div>`;
}

/* ---------- 關於・聯絡、團隊 ---------- */
function about() {
  return hero('關於・聯絡', 'ABOUT', '連結消防需求、學研技術與產業資源，讓現場經驗成為開發的起點。') + `<div class="wrap page-body two-col"><article class="prose">
    <h2>讓現場資訊更容易被看見</h2><p>濃煙、火光與快速變化的環境，讓人員位置、火源與距離的判讀充滿挑戰。消防 Edge AI 專案從這些資訊需求出發，探索在設備端整合影像、辨識與感測資訊。</p>
    <h2>從階段成果，走向持續交流</h2><p>守護之眼的原型與記者會展示，是合作的一個起點。平台希望整理技術成果與資源，讓消防員、開發者及關心專案的人能持續交流。</p></article>
  <aside class="side-stack"><div class="sidebox"><h3>聯絡我們</h3><p>合作提案、現場需求或設備洽詢，都可以從這裡開始。</p>${link('contact', '填寫聯絡表單', 'btn primary')}</div></aside></div>
  <div class="wrap page-body pt0"><div class="section-title"><h2>合作團隊</h2><span class="badge-count">${teams.length} 個合作單位</span></div><div class="grid4">${teams.map(t => `<article class="card reveal"><div class="art">${t.image ? img(t.image, t.title) : '<span class="initial">TGA</span>'}</div><div class="card-body"><span class="tag">${esc(t.type)}</span><h3>${esc(t.name)}</h3><p>${esc(t.brief)}</p>${link('team/' + t.id, '了解團隊', 'text-btn')}</div></article>`).join('')}</div></div>`;
}
function team(id) {
  const t = byId(teams, id); if (!t) return missing();
  const owned = scenarios.filter(s => s.team === t.id);
  return hero(t.name, 'PARTNER', esc(t.title), ['about', '關於・聯絡']) + `<div class="wrap page-body two-col"><article class="prose"><span class="tag">${esc(t.type)}</span><h2>團隊簡介</h2><p>${esc(t.brief)}</p>
    ${owned.length ? `<h2>負責的應用情境</h2>${owned.map(s => `<p><a href="#/scenarios/${s.id}"><strong>${esc(s.title)}</strong></a>（${esc(s.tech)}） ${badge(s.maturity)}<br>${esc(s.hook)}</p>`).join('')}` : '<h2>平台角色</h2><p>擔任設備洽詢與合作聯繫窗口。具體合作方式、窗口與正式介紹待協會確認。</p>'}
    ${img(t.image, t.title)}<p class="source-note">${SOURCE_NOTE}</p></article>
  <aside class="side-stack"><div class="sidebox"><h3>與團隊聯繫</h3><p>希望了解合作方式或提供現場需求？</p>${link('contact?item=' + encodeURIComponent(t.name), '聯絡我們')}<p class="meta">團隊官網與技術文件待提供。</p></div></aside></div>`;
}
function contact(params) {
  const item = params.get('item') || '', purpose = params.get('purpose') || '';
  const opts = ['合作洽詢', '設備詢問', '技術交流', '其他問題'];
  return hero('聯絡我們', 'CONTACT', '分享現場需求、技術問題，或聊聊下一個合作可能。', ['about', '關於・聯絡']) + `<div class="wrap page-body two-col"><form id="contact-form"><div class="split-fields"><div><label for="name">姓名 *</label><input id="name" name="name" required maxlength="80" autocomplete="name" value="${esc(me().name)}"></div><div><label for="email">回覆信箱 *</label><input id="email" name="email" type="email" required autocomplete="email"></div></div>
    <label for="purpose">聯絡目的</label><select id="purpose" name="purpose">${opts.map(o => `<option ${o === purpose ? 'selected' : ''}>${o}</option>`).join('')}</select>
    <label for="item">相關情境／設備／團隊</label><input id="item" name="item" value="${esc(item)}" maxlength="150">
    <label for="message">訊息內容 *</label><textarea id="message" name="message" required maxlength="5000" placeholder="請簡單說明你的需求與想了解的內容"></textarea>
    <div class="actions"><button class="btn primary">預覽送出內容 →</button></div><div id="mail-output" aria-live="polite"></div></form>
  <aside class="side-stack"><div class="sidebox"><h3>不用登入也能聯絡</h3><p>聯絡表單開放所有人使用。設備詢問由台灣守護者聯盟協會回覆。</p><div class="notice">示意版只顯示送出內容預覽，不會寄出。正式收件窗口與寄送方式待確認。</div></div></aside></div>`;
}

/* ---------- 技術交流（討論區） ---------- */
let topics = seedTopics.map(t => ({ ...t, replies: t.replies.map(r => ({ ...r })) }));
const cm = { cat: '全部', scenario: '', sort: 'new', q: '' };
function topicRows() {
  let a = topics.filter(t => (cm.cat === '全部' || t.cat === cm.cat) && (!cm.scenario || t.scenario === cm.scenario) && (t.title + t.body).toLowerCase().includes(cm.q.toLowerCase()));
  if (cm.sort === 'open') a = [...a].sort((x, y) => (x.status === 'open' ? 0 : 1) - (y.status === 'open' ? 0 : 1));
  if (cm.sort === 'replies') a = [...a].sort((x, y) => y.replies.length - x.replies.length);
  if (!a.length) return `<div class="empty"><p>找不到符合的討論。</p><button class="btn" data-clear-filter>清除篩選</button> ${link('community/new' + (cm.scenario ? '?scenario=' + cm.scenario : ''), '發起新討論', 'btn primary', 'data-gate="post"')}</div>`;
  return a.map(t => { const s = byId(scenarios, t.scenario); return `<article class="topic"><div><div class="topic-tags"><span class="tag">${esc(t.cat)}</span>${s ? `<a class="scn-chip" href="#/scenarios/${s.id}">${esc(s.title)}</a>` : ''}</div><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.author)} <span class="role">${esc(t.identity)}</span> · ${esc(t.date)}</span></div><div class="meta">${t.replies.length} 則回覆</div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div></article>`; }).join('');
}
const POST_TEMPLATE = '使用設備：\n執行環境：\n遇到的問題：\n已嘗試的方法：';
function community(id, params) {
  if (id === 'new') {
    if (!loggedIn()) return gatePage('發起討論', 'post');
    const pre = params.get('scenario') || '';
    return hero('發起討論', 'NEW TOPIC', '把問題說清楚，回答的人就不用一直追問。', ['community', '技術交流']) + `<div class="wrap page-body two-col"><form id="new-topic"><label for="topic-title">標題 *</label><input id="topic-title" name="title" required maxlength="100" placeholder="一句話說明你的問題或需求">
      <div class="split-fields"><div><label for="topic-cat">分類</label><select id="topic-cat" name="cat">${TOPIC_CATS.map(c => `<option>${c}</option>`).join('')}</select></div><div><label for="topic-scn">相關情境</label><select id="topic-scn" name="scenario"><option value="">不指定</option>${scenarios.map(s => `<option value="${s.id}" ${s.id === pre ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></div></div>
      <label for="topic-body">內容 *</label><textarea id="topic-body" name="body" required maxlength="5000" placeholder="${POST_TEMPLATE.replace(/\n/g, '&#10;')}"></textarea><button type="button" class="text-btn" data-template>套用技術提問格式</button>
      <div class="actions"><button class="btn primary">送出討論</button>${link('community', '取消', 'btn', '')}</div></form>
      <aside class="side-stack"><div class="sidebox"><h3>以這個身分發文</h3><p><strong>${esc(me().name)}</strong> <span class="role">${esc(me().identity)}</span></p><p class="meta">示意版的發文只保留在目前分頁，重新整理後重置。</p></div><div class="sidebox"><h3>提問小提醒</h3><p>技術問題請寫出使用的設備、執行環境與已嘗試的方法；現場需求請描述情境與希望得到的資訊。</p></div></aside></div>`;
  }
  if (!id) {
    cm.scenario = params.get('scenario') || '';
    return hero('消防與技術交流', 'COMMUNITY', '現場需求、技術問題與使用經驗，在這裡討論清楚。') + `<div class="wrap page-body two-col cm"><div>
      <div class="toolbar"><input aria-label="搜尋討論" id="topic-search" placeholder="搜尋標題或內容" value="${esc(cm.q)}">${link('community/new' + (cm.scenario ? '?scenario=' + cm.scenario : ''), '發起討論', 'btn primary', 'data-gate="post"')}</div>
      <div class="toolbar filters"><div class="chips">${['全部', ...TOPIC_CATS].map(c => `<button class="chip ${c === cm.cat ? 'selected' : ''}" data-filter="${c}" aria-pressed="${c === cm.cat}">${c}</button>`).join('')}</div>
        <label class="inline">情境<select id="scn-filter"><option value="">全部情境</option>${scenarios.map(s => `<option value="${s.id}" ${s.id === cm.scenario ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>
        <label class="inline">排序<select id="sort"><option value="new" ${cm.sort === 'new' ? 'selected' : ''}>最新</option><option value="open" ${cm.sort === 'open' ? 'selected' : ''}>待回覆優先</option><option value="replies" ${cm.sort === 'replies' ? 'selected' : ''}>回覆最多</option></select></label></div>
      <div class="forum" id="topic-list">${topicRows()}</div></div>
    <aside class="side-stack"><div class="sidebox"><h3>快速查找</h3><p class="meta">各情境的技術細節</p><ul class="plain">${scenarios.map(s => `<li><a href="#/scenarios/${s.id}">${esc(s.title)}</a></li>`).join('')}</ul><p class="meta">設備</p><ul class="plain">${devices.map(d => `<li><a href="#/devices/${d.id}">${esc(d.name)}</a></li>`).join('')}</ul></div>
      <div class="sidebox"><h3>發文需要登入</h3><p>瀏覽討論不需要登入；發文與回覆需要登入，並會顯示你的名稱與身分。</p></div></aside></div>`;
  }
  const t = byId(topics, id); if (!t) return missing();
  const s = byId(scenarios, t.scenario);
  return hero(t.title, 'DISCUSSION', `<span class="tag">${esc(t.cat)}</span> <span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span>`, ['community', '技術交流']) + `<div class="wrap page-body two-col"><div>
    <article class="post"><div class="meta">${esc(t.author)} <span class="role">${esc(t.identity)}</span> · ${esc(t.date)}</div><p>${esc(t.body)}</p></article>
    <div class="section-title"><h2>${t.replies.length} 則回覆</h2></div>
    ${t.replies.map(r => `<article class="post answer ${r.accepted ? 'accepted' : ''}">${r.accepted ? '<span class="accepted-tag">被採納的回答</span>' : ''}<div class="meta">${esc(r.author)} <span class="role">${esc(r.identity)}</span></div><p>${esc(r.text)}</p></article>`).join('')}
    <form id="reply-form" data-topic="${t.id}"><label for="reply">你的回覆 *</label><textarea id="reply" name="body" required maxlength="5000" placeholder="${loggedIn() ? '輸入回覆內容' : '可以先輸入，送出時再登入；內容會保留'}"></textarea><div class="actions"><button class="btn primary">送出回覆</button>${loggedIn() ? `<span class="meta">以 ${esc(me().name)}（${esc(me().identity)}）身分回覆</span>` : '<span class="meta">送出時需要登入</span>'}</div></form></div>
  <aside class="side-stack">${s ? `<div class="sidebox"><h3>相關情境</h3><p><a href="#/scenarios/${s.id}">${esc(s.title)}</a><br><span class="meta">${esc(s.tech)}</span></p>${link('scenarios/' + s.id, '查看技術細節')}</div>` : ''}<div class="sidebox"><h3>一起把問題說清楚</h3><p>回覆時可以補充你的使用情境與觀察。</p><p class="meta">示意版的回覆只保留在目前分頁，重新整理後重置。</p></div></aside></div>`;
}

/* ---------- 會員中心、後臺、搜尋 ---------- */
function member() {
  if (!loggedIn()) return gatePage('會員中心', 'member');
  const mine = topics.filter(t => t.mine), p = me();
  return hero('會員中心', 'MEMBER', `${esc(p.name)} · ${esc(p.identity)}`) + `<div class="wrap page-body two-col"><div>
    <div class="section-title"><h2>我的發文</h2>${link('community/new', '發起討論', 'btn primary', 'data-gate="post"')}</div>
    <div class="forum">${mine.length ? mine.map(t => `<article class="topic"><div><span class="tag">${esc(t.cat)}</span><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.date)}</span></div><div class="meta">${t.replies.length} 則回覆</div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div></article>`).join('') : '<div class="empty">還沒有發文。示意版的發文只保留在目前分頁。</div>'}</div>
    <div class="section-title"><h2>我的設備洽詢</h2></div><div class="notice">洽詢紀錄與 TGA 的回覆流程，待與後端確認後於下一輪加入。</div></div>
  <aside class="side-stack"><div class="sidebox"><h3>帳號資訊</h3><table class="spec mini"><tbody><tr><td>名稱</td><td>${esc(p.name)}</td></tr><tr><td>身分</td><td>${esc(p.identity)}</td></tr><tr><td>權限</td><td>${auth.role === 'admin' ? '管理員' : '會員'}</td></tr><tr><td>登入方式</td><td>Google（示意）</td></tr></tbody></table><div class="actions"><button class="btn" data-edit-profile>修改資料</button><button class="btn" data-logout>登出</button></div></div></aside></div>`;
}
const adminFields = { 情境: ['情境標題', '技術名稱', '一句話說明', '現場的困難', '三步驟做法', '目前成果'], 成果: ['標題', '日期', '摘要', '內文', '封面圖片'], 設備: ['設備名稱', '分類', '用途', '規格', '圖片'] };
function admin(kind) {
  if (auth.role !== 'admin') return hero('內容管理後臺', 'ADMIN', '此頁僅限管理員。') + `<div class="wrap page-body"><div class="gate"><p>正式版由管理員帳號登入後進入。示意版可用頁尾的「示意身分切換」切成管理員查看。</p></div></div>`;
  if (kind === '討論') return hero('內容管理後臺', 'ADMIN', '維護網站內容與管理討論。') + adminNav('討論') + `<div class="wrap page-body pt0"><div class="forum">${topics.map(t => `<article class="topic"><div><span class="tag">${esc(t.cat)}</span><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.author)} · ${esc(t.date)}</span></div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div><div class="row-actions"><button class="chip" data-mark="${t.id}">${t.status === 'answered' ? '改為待回覆' : '標記已解答'}</button><button class="chip" data-hide="${t.id}">隱藏</button></div></article>`).join('')}</div><p class="source-note">示意操作，重新整理後重置。</p></div>`;
  if (!adminFields[kind]) kind = '情境';
  return hero('內容管理後臺', 'ADMIN', '維護網站內容與管理討論。') + adminNav(kind) + `<div class="wrap page-body pt0 two-col"><form id="admin-form"><h2>新增${kind}</h2>${adminFields[kind].map((f, i) => `<label for="field${i}">${f}${i === 0 ? ' *' : ''}</label>${f.includes('圖片') ? `<input id="field${i}" name="${f}" type="file" accept="image/*">` : i > 1 ? `<textarea id="field${i}" name="${f}"></textarea>` : `<input id="field${i}" name="${f}" ${i === 0 ? 'required' : ''}>`}`).join('')}${kind !== '設備' ? `<label for="mat">成熟度</label><select id="mat" name="成熟度">${Object.values(MATURITY).map(m => `<option>${m.label}</option>`).join('')}</select>` : ''}<div class="actions"><button class="btn primary">預覽內容</button></div></form><aside class="sidebox"><h3>內容預覽</h3><div id="admin-output"><p>填寫左側欄位後，點選「預覽內容」。</p></div></aside></div>`;
}
const adminNav = k => `<div class="wrap"><div class="admin-nav">${['情境', '成果', '設備', '討論'].map(x => `<a class="chip ${x === k ? 'selected' : ''}" href="#/admin/${x}">${x}${x === '討論' ? '管理' : ''}</a>`).join('')}</div></div>`;
function search() { return hero('搜尋', 'SEARCH', '搜尋情境、成果、設備、團隊與討論。') + `<div class="wrap page-body"><div class="toolbar"><input id="global-search" aria-label="搜尋平台內容" placeholder="例如：測距、E84、濃煙、記者會"></div><div id="search-results" class="forum">${searchRows('')}</div></div>`; }
function searchRows(q) {
  const all = [...scenarios.map(s => ({ t: s.title + '｜' + s.tech, p: 'scenarios/' + s.id, k: '情境' })), ...outcomes.map(r => ({ t: r.title, p: 'results/' + r.id, k: '成果' })), ...devices.map(d => ({ t: d.name, p: 'devices/' + d.id, k: '設備' })), ...teams.map(t => ({ t: t.name + '｜' + t.title, p: 'team/' + t.id, k: '團隊' })), ...topics.map(t => ({ t: t.title, p: 'community/' + t.id, k: '討論' }))].filter(x => x.t.toLowerCase().includes(q.toLowerCase()));
  return all.length ? all.map(x => `<div class="topic"><div><span class="tag">${x.k}</span><h3><a href="#/${x.p}">${esc(x.t)}</a></h3></div></div>`).join('') : '<div class="empty">找不到符合的內容，請換一個關鍵字。</div>';
}
function missing() { return hero('找不到這個頁面', 'PAGE NOT FOUND', '請從導覽列選擇其他內容。') + `<div class="wrap page-body">${link('', '返回首頁')}</div>`; }

/* ---------- 路由 ---------- */
const LEGACY = { resources: id => id ? 'team/' + id : 'scenarios', shop: id => id ? 'devices/' + id : 'devices', cart: () => 'devices' };
const NAV_GROUP = { scenarios: 'scenarios', results: 'results', devices: 'devices', about: 'about', team: 'about', contact: 'about', community: 'community', search: 'search' };
function route() {
  const raw = location.hash.replace(/^#\/?/, ''), [path, qs] = raw.split('?');
  const [section = '', id] = path.split('/').map(decodeURIComponent);
  return { section, id, params: new URLSearchParams(qs || '') };
}
let firstRender = true;
function render() {
  const { section, id, params } = route();
  if (LEGACY[section]) { location.replace('#/' + LEGACY[section](id)); return; }
  const views = { '': () => home(params), scenarios: () => scenariosPage(id), results: () => results(id), devices: () => devicesPage(id), about, team: () => team(id), contact: () => contact(params), community: () => community(id, params), member, admin: () => admin(id), search };
  $('#app').innerHTML = (views[section] || missing)();
  $$('[data-route]').forEach(a => { const on = NAV_GROUP[section] === a.dataset.route; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  document.title = (section ? ($('#app h1')?.textContent + '｜') : '') + '消防 Edge AI 開發平台';
  if (!firstRender) { window.scrollTo(0, 0); $('#app').focus({ preventScroll: true }); }
  firstRender = false;
  initReveal(); initCarousel();
}

/* ---------- 互動 ---------- */
let revealObs;
function initReveal() {
  const els = $$('.reveal:not(.in)');
  if (reduceMotion() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  revealObs?.disconnect();
  revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => revealObs.observe(e));
}
function initCarousel() {
  const track = $('.fc-track'); if (!track) return;
  const slides = $$('.fc-slide', track), dots = $$('.fc-dot'), count = $('.fc-count');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.intersectionRatio > .6) { const i = slides.indexOf(e.target); dots.forEach((d, j) => j === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')); if (count) count.textContent = `${i + 1} / ${slides.length}`; track.dataset.index = i; }
  }), { root: track, threshold: [.6] });
  slides.forEach(s => io.observe(s));
}
function goSlide(i) {
  const track = $('.fc-track'), slides = $$('.fc-slide', track); if (!slides.length) return;
  i = (i + slides.length) % slides.length;
  track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function selectScenario(id, focus) {
  const s = byId(scenarios, id); if (!s) return;
  $$('.scn-tab').forEach(t => { const on = t.dataset.scn === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  const panel = $('#scn-panel'); panel.setAttribute('aria-labelledby', 'tab-' + id); panel.innerHTML = scnPanel(s);
  if (!reduceMotion()) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  history.replaceState(null, '', '#/?s=' + id);
}
let toastTimer;
function toast(s) { const t = $('#toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3800); }

document.addEventListener('click', e => {
  const el = e.target.closest('button, a, [data-close]'); if (!el) return;
  if (el.matches('[data-close]') && (e.target === el || el.classList.contains('modal-x'))) return closeModal();
  if (el.matches('[data-google]')) return auth.profile ? (auth.role = 'member', saveAuth(), finishLogin()) : profileStep();
  if (el.matches('[data-login]')) { const r = el.dataset.login || 'default'; return openLogin(r, r === 'default' ? null : () => render()); }
  if (el.matches('[data-gate]') && !loggedIn()) { e.preventDefault(); const href = el.getAttribute('href'); return openLogin(el.dataset.gate, () => { location.hash = href.slice(1); }); }
  if (el.matches('[data-acct]')) { const m = el.nextElementSibling, open = m.hidden; m.hidden = !open; el.setAttribute('aria-expanded', open); return; }
  if (el.matches('[data-logout]')) { auth.role = 'guest'; saveAuth(); renderAccount(); toast('已登出'); return render(); }
  if (el.matches('[data-edit-profile]')) { lastFocus = el; return profileStep(true); }
  if (el.matches('[data-scroll]')) { document.getElementById(el.dataset.scroll)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' }); $('.scn-tab[aria-selected=true]')?.focus({ preventScroll: true }); return; }
  if (el.matches('[data-scn]')) return selectScenario(el.dataset.scn);
  if (el.matches('[data-fc]')) return goSlide(+($('.fc-track').dataset.index || 0) + (+el.dataset.fc));
  if (el.matches('[data-fc-go]')) return goSlide(+el.dataset.fcGo);
  if (el.matches('[data-filter]')) { cm.cat = el.dataset.filter; $$('[data-filter]').forEach(b => { const on = b === el; b.classList.toggle('selected', on); b.setAttribute('aria-pressed', on); }); $('#topic-list').innerHTML = topicRows(); return; }
  if (el.matches('[data-clear-filter]')) { Object.assign(cm, { cat: '全部', scenario: '', q: '' }); location.hash = '/community'; return render(); }
  if (el.matches('[data-template]')) { const ta = $('#topic-body'); if (!ta.value.trim()) ta.value = POST_TEMPLATE; ta.focus(); return; }
  if (el.matches('[data-mark]')) { const t = byId(topics, el.dataset.mark); t.status = t.status === 'answered' ? 'open' : 'answered'; toast('已更新狀態（示意）'); return render(); }
  if (el.matches('[data-hide]')) { topics = topics.filter(t => t.id !== el.dataset.hide); toast('已隱藏討論（示意）'); return render(); }
});
document.addEventListener('click', e => { if (!e.target.closest('.acct')) $$('.acct-menu').forEach(m => { m.hidden = true; m.previousElementSibling?.setAttribute('aria-expanded', 'false'); }); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#modal-root').innerHTML) closeModal(); $$('.acct-menu').forEach(m => m.hidden = true); }
  if (e.target.matches('.scn-tab') && ['ArrowRight', 'ArrowLeft'].includes(e.key)) { const ids = scenarios.map(s => s.id), i = ids.indexOf(e.target.dataset.scn); selectScenario(ids[(i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length], true); e.preventDefault(); }
  if (e.target.matches('.fc-track') && ['ArrowRight', 'ArrowLeft'].includes(e.key)) { goSlide(+(e.target.dataset.index || 0) + (e.key === 'ArrowRight' ? 1 : -1)); e.preventDefault(); }
});
document.addEventListener('input', e => {
  if (e.target.matches('.cmp-range')) e.target.closest('.compare').style.setProperty('--pos', e.target.value + '%');
  if (e.target.id === 'topic-search') { cm.q = e.target.value; $('#topic-list').innerHTML = topicRows(); }
  if (e.target.id === 'global-search') $('#search-results').innerHTML = searchRows(e.target.value);
});
document.addEventListener('change', e => {
  if (e.target.id === 'scn-filter') { cm.scenario = e.target.value; history.replaceState(null, '', '#/community' + (cm.scenario ? '?scenario=' + cm.scenario : '')); $('#topic-list').innerHTML = topicRows(); }
  if (e.target.id === 'sort') { cm.sort = e.target.value; $('#topic-list').innerHTML = topicRows(); }
  if (e.target.id === 'role-switch') { setRole(e.target.value); toast(`示意身分：${e.target.selectedOptions[0].text}`); render(); }
});
document.addEventListener('submit', e => {
  const f = e.target, data = Object.fromEntries(new FormData(f));
  if (!['profile-form', 'new-topic', 'reply-form', 'contact-form', 'admin-form'].includes(f.id)) return;
  e.preventDefault();
  if (f.id === 'profile-form') {
    if (!data.name.trim()) return toast('請填寫顯示名稱。');
    const editing = loggedIn(); auth.profile = { name: data.name.trim(), identity: data.identity };
    if (!editing) auth.role = 'member';
    saveAuth();
    if (editing) { closeModal(); renderAccount(); toast('資料已更新'); return render(); }
    return finishLogin();
  }
  if (f.id === 'new-topic') {
    if (!loggedIn()) return openLogin('post', () => f.requestSubmit());
    if (!data.title.trim() || !data.body.trim()) return toast('請填寫標題與內容。');
    const id = 'my-' + Date.now();
    topics.unshift({ id, title: data.title.trim(), cat: data.cat, scenario: data.scenario, author: me().name, identity: me().identity, date: today(), status: 'open', body: data.body, replies: [], mine: true });
    location.hash = '/community/' + id; toast('已發布（示意，重新整理後重置）');
  }
  if (f.id === 'reply-form') {
    if (!data.body.trim()) return toast('請填寫回覆內容。');
    if (!loggedIn()) return openLogin('reply', () => f.requestSubmit());
    byId(topics, f.dataset.topic).replies.push({ author: me().name, identity: me().identity, text: data.body });
    render(); toast('已送出回覆（示意，重新整理後重置）');
  }
  if (f.id === 'contact-form') {
    const text = `主旨：【${data.purpose}】${data.item || '消防 Edge AI 平台'}\n收件窗口：${data.purpose === '設備詢問' ? '台灣守護者聯盟協會（待設定）' : '正式窗口待設定'}\n\n${data.message}\n\n相關項目：${data.item || '未指定'}\n姓名：${data.name}\n回覆信箱：${data.email}`;
    $('#mail-output').innerHTML = '<h2 class="spaced">送出內容預覽</h2><p class="notice">內容已整理，尚未寄出。正式寄送功能待實作。</p><div class="mail-preview">' + esc(text) + '</div>';
  }
  if (f.id === 'admin-form') $('#admin-output').innerHTML = Object.entries(data).map(([k, v]) => `<h4>${esc(k)}</h4><p style="white-space:pre-wrap">${esc(v instanceof File ? (v.name || '未選擇') : v) || '尚未填寫'}</p>`).join('');
});

document.documentElement.classList.add('js');
renderAccount();
window.addEventListener('hashchange', render);
render();
