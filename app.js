/* 消防 Edge AI 平台｜互動示意版（Round 2，2026-11）
 * 內容在 data.js；這個檔案負責路由、版面、互動與「登入示意」。
 * 登入、發文、詢價都只在瀏覽器內模擬，正式實作請見 HANDOFF.md。
 */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (arr, id) => arr.find(x => x.id === id);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pic = (src, alt, cls = '') => src ? `<img ${cls ? `class="${cls}" ` : ''}src="assets/${src}" alt="${esc(alt)}" loading="lazy">` : '';
const link = (path, text, cls = 'btn', extra = '') => `<a class="${cls}" href="#/${path}" ${extra}>${text} <span aria-hidden="true">→</span></a>`;
const badge = key => `<span class="mat mat-${key}">${MATURITY[key].label}</span>`;
const SOURCE_NOTE = '資料依 2026 年 9 月「技術說明展板規劃」及合作團隊提供的內容整理；進度標示待各團隊確認。';
const today = () => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const appOf = techId => byId(applications, byId(techs, techId)?.app);

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
  member: ['登入以查看會員中心', '會員中心集中顯示你的發文與詢價紀錄。'],
  admin: ['管理員登入', '內容管理後臺僅限指定的管理員帳號。'],
  contact: ['登入後查看聯絡方式', '電話與信箱僅提供給已登入的會員；不登入也可以直接使用聯絡表單。'],
  default: ['登入平台', '瀏覽網站不需要登入。登入後可以發文、回覆，並在會員中心追蹤。']
};
let pendingAfterLogin = null, lastFocus = null;

function openLogin(reason = 'default', after = null) {
  pendingAfterLogin = after; lastFocus = document.activeElement;
  const [t, d] = REASONS[reason] || REASONS.default;
  showModal(`<span class="kicker">SIGN IN</span><h2 id="m-title">${t}</h2><p>${d}</p>
    <button class="google-btn" data-google><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>使用 Google 帳號登入</span><small>示意，不會連線</small></button>
    <p class="meta">正式版提供 Google 與 Email 登入（Supabase），由後端串接。</p>`);
}
function profileStep(editing = false) {
  const p = me();
  showModal(`<span class="kicker">${editing ? 'PROFILE' : 'FIRST SIGN-IN'}</span><h2 id="m-title">${editing ? '修改個人資料' : '第一次登入，請補上基本資料'}</h2>
    <p>名稱與身分會顯示在你的發文旁，方便大家理解提問的背景。</p>
    <form id="profile-form"><label for="p-name">顯示名稱 *</label><input id="p-name" name="name" required maxlength="30" value="${esc(p.name)}" autocomplete="nickname">
    <fieldset class="id-pick"><legend>身分 *</legend>${IDENTITIES.map((x, i) => `<label><input type="radio" name="identity" value="${x}" ${(p.identity ? p.identity === x : i === 0) ? 'checked' : ''}><span>${x}</span></label>`).join('')}</fieldset>
    ${editing ? '' : '<label class="check"><input type="checkbox" name="agree" required> 我同意平台使用規範與隱私權政策（內容待訂）</label>'}
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
  if (run) run(); else if (['member', 'admin', 'community', 'team', 'contact'].includes(route().section)) render();
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

/* ---------- 導覽：應用情境下拉選單（桌機滑入、手機點按） ---------- */
function buildNav() {
  $('#apps-menu').innerHTML = `<a href="#/applications" class="sub-all">全部應用情境</a>` +
    applications.map(a => `<a href="#/applications/${a.id}"><span>${esc(a.nav)}</span><small>${esc(a.cat)}</small></a>`).join('');
}
const touchNav = () => window.matchMedia('(hover: none), (max-width: 720px)').matches;
function setMenu(open) {
  const item = $('.has-menu'), btn = $('.nav-parent');
  item.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
}
function closeNav() {
  setMenu(false); document.body.classList.remove('nav-open'); $('.menu-btn').setAttribute('aria-expanded', 'false');
  if ($('.has-menu').matches(':hover')) $('.has-menu').classList.add('hold-closed');
}

/* ---------- 共用：對照滑桿、三步驟 ---------- */
function steps(t) { return `<ol class="steps">${t.steps.map((st, i) => `<li><b aria-hidden="true">${i + 1}</b><strong>${esc(st.t)}</strong><span>${esc(st.d)}</span></li>`).join('')}</ol>`; }
function compare(t) {
  return `<figure class="compare" style="--pos:50%"><div class="cmp-stage">
    <div class="cmp-layer">${scene(t.id, 'after')}</div><div class="cmp-layer cmp-before">${scene(t.id, 'before')}</div>
    <div class="cmp-line" aria-hidden="true"><span>⇆</span></div>
    <span class="cmp-label cmp-l">一般畫面</span><span class="cmp-label cmp-r">AI 辨識</span>
    <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="拖曳比較：一般畫面與 AI 辨識畫面"></div>
    <figcaption><span><b>左</b>${esc(t.compare.before)}</span><span><b>右</b>${esc(t.compare.after)}</span><em>示意圖，待替換為團隊提供的實際對照畫面</em></figcaption></figure>`;
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

/* ---------- 共用：計畫進程、合作團隊卡片 ---------- */
const ICONS = {
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  show: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4M7 12l3-3 3 2 4-4"/>',
  build: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ''}</svg>`;
function roadmap() {
  return `<ol class="roadmap">${progress.map(p => `<li class="rm-${p.state}" ${p.state === 'now' ? 'aria-current="step"' : ''}>
    <span class="rm-node" aria-hidden="true">${p.state === 'done' ? '<svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span>
    <span class="rm-title">${icon(p.icon)}${esc(p.t)}</span>
    <span class="rm-when">${esc(p.when)}</span><span class="rm-d">${esc(p.d)}</span>
    <span class="rm-state">${STATE_LABEL[p.state]}</span></li>`).join('')}</ol>`;
}
function partnerMedia(t) {
  if (t.logos) return `<div class="pc-logos">${t.logos.map(l => pic(l, t.name + ' 標誌')).join('<span class="pc-div" aria-hidden="true"></span>')}</div>`;
  if (t.photo) return `<div class="pc-photo"><span class="pc-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" fill="#fff"/><path d="M4 21c1.2-4.5 4.4-6.5 8-6.5s6.8 2 8 6.5" fill="#fff"/></svg></span><span class="pc-ph">主持人形象照</span></div>`;
  return `<div class="pc-logotext">${esc(t.logoText || 'Logo')}</div>`;
}
const personLine = t => t.person ? `${esc(t.personLabel || '聯繫窗口')}｜${esc(t.person)}` : `<span class="muted">${esc(t.personLabel || '聯繫窗口')}待補</span>`;
/* 「歡迎加入」卡片：固定排在合作團隊最後，不屬於 teams 資料（不進搜尋、不計入單位數、沒有單位頁） */
function joinCard(compact = false) {
  return `<a class="pcard pc-join${compact ? ' compact' : ''}" href="#/contact?purpose=${encodeURIComponent('合作洽詢')}">
    <span class="pc-media"><span class="pc-plus" aria-hidden="true">＋</span></span>
    <span class="pc-body"><span class="pc-name">歡迎加入</span><span class="pc-person">學研、產業、消防單位合作洽詢 →</span></span></a>`;
}
/* 聯絡方式：姓名公開；電話與信箱登入後才顯示（原型只做畫面隱藏，正式版由後端控管） */
const lockedContact = () => `<button class="btn small lock-btn" data-login="contact">🔒 登入後查看電話與信箱</button>`;
function contactDetails(c) {
  if (!c.phone && !c.email) return '';
  if (!loggedIn()) return `<li>${lockedContact()}</li>`;
  return `${c.phone ? `<li>電話：<a href="tel:${esc(c.phone.replace(/-/g, ''))}">${esc(c.phone)}</a></li>` : ''}${c.email ? `<li>信箱：<a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : ''}`;
}
const contactLines = (c = CONTACT, org = CONTACT.org) => `<ul class="plain contact-lines"><li>${esc(org)}</li><li>${esc(c.personLabel || '聯絡人')}：${esc(c.person || c.name || '待補')}</li>${contactDetails(c)}</ul>`;
function partnerCard(t, compact = false) {
  return `<article class="pcard${compact ? ' compact' : ''}">
    <a class="pc-media" href="#/team/${t.id}" aria-label="${esc(t.name)}">${partnerMedia(t)}${t.pending ? '<span class="pc-pending">素材待補</span>' : ''}</a>
    <div class="pc-body"><a class="pc-name" href="#/team/${t.id}">${esc(t.name)}</a>
      <span class="pc-person">${personLine(t)}</span>
      ${compact ? '' : `<span class="pc-type">${esc(t.type)}・${esc(t.title)}</span>${t.url ? `<a class="pc-url" href="${esc(t.url)}" target="_blank" rel="noopener">官網 ↗</a>` : ''}`}</div></article>`;
}

/* ---------- 首頁 ---------- */
function featuredCarousel() {
  const items = applications.filter(o => o.featured), n = items.length;
  return `<section class="fc" aria-roledescription="carousel" aria-label="代表成果">
  <div class="fc-track" tabindex="0" aria-label="代表成果，可左右滑動">${items.map((o, i) => `
    <article class="fc-slide feature" role="group" aria-roledescription="slide" aria-label="第 ${i + 1} 個，共 ${n} 個：${esc(o.headline)}">
      <div class="feature-top"><span class="feature-kicker">代表成果</span><span class="feature-name">${esc(o.name)}</span></div>
      <div class="feature-body"><div class="fc-meta"><span class="feature-label">${esc(o.label)}</span>${badge(o.maturity)}</div><h2>${esc(o.headline)}</h2><p>${esc(o.summary)}</p><ul>${o.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${link('applications/' + o.id, '看完整介紹', 'text-btn')}</div>
      <div class="feature-bottom">${esc(o.foot)}</div></article>`).join('')}
  </div>
  ${n > 1 ? `<div class="fc-controls"><button class="fc-btn" data-fc="-1" aria-label="上一個成果">←</button><div class="fc-dots">${items.map((o, i) => `<button class="fc-dot" data-fc-go="${i}" aria-label="第 ${i + 1} 個：${esc(o.headline)}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('')}</div><span class="fc-count" aria-live="polite">1 / ${n}</span><button class="fc-btn" data-fc="1" aria-label="下一個成果">→</button></div>` : ''}
</section>`;
}
function scnTab(t, on) {
  return `<button class="scn-tab" role="tab" id="tab-${t.id}" aria-selected="${on}" aria-controls="scn-panel" tabindex="${on ? 0 : -1}" data-scn="${t.id}"><span class="scn-tech">${esc(t.tech)}</span><strong>${esc(t.title)}</strong><span class="scn-hook">${esc(t.hook)}</span>${badge(t.maturity)}</button>`;
}
function scnPanel(t) {
  const team = byId(teams, t.team), app = appOf(t.id);
  return `<div class="scn-grid"><div class="scn-text">
    <div class="scn-status">${badge(t.maturity)}<span class="meta">${MATURITY[t.maturity].note}</span></div>
    <h3>${esc(t.title)}</h3>
    <h4>現場的困難</h4><p>${esc(t.need)}</p>
    <h4>AI 怎麼做</h4>${steps(t)}
    <h4>目前做到哪裡</h4><p>${esc(t.result)}</p></div>
    <div class="scn-visual">${compare(t)}</div></div>
    <div class="scn-actions">${link('applications/' + app.id, '看完整介紹', 'btn primary')}${link('community?scenario=' + t.id, '看相關討論')}<span class="meta">負責：<a href="#/team/${team.id}">${esc(team.name)}</a></span></div>`;
}
function home(params) {
  const t = byId(techs, params.get('s')) || techs[0];
  return `<section class="hero"><div class="wrap hero-grid">
    <div class="reveal"><div class="eyebrow">消防科技 · 應用情境 · 技術交流</div><h1>讓科技走進現場<br><span>讓創新持續發生</span></h1>
      <p class="intro">濃煙裡看不清火源與人員，是消防現場的日常挑戰。<br>我們串連學研與產業，探索用 Edge AI 協助判讀現場資訊。</p>
      <div class="actions"><button class="btn primary" data-scroll="scenarios">看 AI 如何協助救災 <span aria-hidden="true">↓</span></button>${link('community', '技術交流專區')}</div>
      <p class="hero-note">消防與技術人員可以直接進入交流專區，查找技術細節與設備資訊。</p></div>
    ${featuredCarousel()}</div></section>
  <section id="scenarios" class="band"><div class="wrap">
    <div class="section-head reveal"><div><span class="kicker">APPLICATIONS</span><h2>AI 可以在現場幫上什麼忙？</h2></div>${link('applications', '全部應用情境', 'text-btn')}</div>
    <div class="scn-tabs reveal" role="tablist" aria-label="應用情境">${techs.map(x => scnTab(x, x.id === t.id)).join('')}</div>
    <div id="scn-panel" class="scn-panel" role="tabpanel" aria-labelledby="tab-${t.id}">${scnPanel(t)}</div></div></section>
  <section class="wrap block"><div class="section-head reveal"><div><span class="kicker">ROADMAP</span><h2>計畫目前走到哪裡</h2></div>${link('partners', '計畫進程與合作團隊', 'text-btn')}</div>
    <div class="reveal">${roadmap()}</div></section>
  <section class="wrap block"><div class="section-head reveal"><div><span class="kicker">PARTNERS</span><h2>一起推進的團隊</h2></div>${link('partners', '認識合作團隊', 'text-btn')}</div>
    <div class="pgrid partners-grid compact reveal">${teams.map(x => partnerCard(x, true)).join('')}${joinCard(true)}</div></section>
  <section class="wrap block last"><div class="section-head reveal"><div><span class="kicker">GET INVOLVED</span><h2>接下來，你可以</h2></div></div>
    <div class="join reveal">${[
      ['applications', '看更多應用情境', '整合原型、技術展示與活動紀錄'],
      ['community', '加入技術交流', '提出現場需求或技術問題'],
      ['devices', '詢價相關設備', '由臺灣守護者聯盟社會公益協會擔任窗口'],
      ['contact', '合作聯絡', '學研、產業或消防單位的合作提案']
    ].map(([p, h, d]) => `<a class="join-card" href="#/${p}"><strong>${h}</strong><span>${d}</span><i aria-hidden="true">→</i></a>`).join('')}</div></section>`;
}

/* ---------- 應用情境（成果與情境合併；內容頁共用 7 區塊模板） ---------- */
function applicationsPage(id) {
  if (!id) return hero('應用情境', 'APPLICATIONS', '從消防現場的困難出發，看每一項成果做到哪裡、由誰推進。') + `<div class="wrap page-body">${applications.map(a => `<article class="result-row reveal"><a class="art" href="#/applications/${a.id}" tabindex="-1" aria-hidden="true">${pic(a.cover, '')}</a><div><span class="meta">${esc(a.date)} · ${esc(a.cat)}</span> ${badge(a.maturity)}${a.featured ? ' <span class="tag">代表成果</span>' : ''}<h3><a href="#/applications/${a.id}">${esc(a.title)}</a></h3><p>${esc(a.summary)}</p></div>${link('applications/' + a.id, '看完整介紹', 'text-btn')}</article>`).join('')}<p class="source-note">${SOURCE_NOTE}</p></div>`;
  const a = byId(applications, id); if (!a) return missing();
  const ts = (a.techs || []).map(x => byId(techs, x));
  const imgs = (list, cls) => `<div class="figs ${cls || ''}">${list.map(i => `<figure>${pic(i.src, i.alt)}</figure>`).join('')}</div>`;
  const cap = c => c ? `<p class="fig-cap">${esc(c)}</p>` : '';
  const S = [];
  /* 01 介紹 */
  S.push(['intro', '介紹', `<h2>${esc(a.intro.heading)}</h2>${a.intro.sub ? `<p class="lead">${esc(a.intro.sub)}</p>` : ''}${a.intro.body.map(p => `<p>${esc(p)}</p>`).join('')}
    ${a.intro.pain ? `<h3>${esc(a.intro.painHeading)}</h3>${a.intro.pain.map(p => `<p>${esc(p)}</p>`).join('')}` : ''}
    ${ts.map(t => `${!a.intro.pain ? `<h3>現場的困難</h3><p>${esc(t.need)}</p>` : ''}<h3>AI 怎麼做｜${esc(t.tech)}</h3>${steps(t)}
      <details class="tech-details"><summary>技術細節（給消防與技術人員）</summary><h3>技術做法</h3><p>${esc(t.method)}</p>
      <h3>使用設備</h3><ul>${t.devices.map(d => `<li><a href="#/devices/${d}">${esc(byId(devices, d).name)}</a></li>`).join('')}</ul>
      <h3>後續應用方向</h3><p>${esc(t.future)}</p><p class="meta">技術文件、程式碼與介接說明待團隊提供。</p></details>`).join('')}
    ${a.showcase ? `<h3>展示的三項技術方向</h3><div class="grid3">${a.showcase.map(x => { const o = byId(applications, x); return `<a class="join-card" href="#/applications/${o.id}"><strong>${esc(o.title)}</strong><span>${esc(o.summary)}</span><i aria-hidden="true">→</i></a>`; }).join('')}</div>` : ''}`]);
  /* 02 互動對照（沿用原網站拖曳比較） */
  if (ts.length) S.push(['compare', '互動對照', `<h2>一般畫面 vs AI 辨識</h2><p>拖曳中間的把手，比較一般攝影機畫面與 AI 辨識後的差別。</p>${ts.map(compare).join('')}`]);
  /* 03 目前做到哪裡 */
  const pg = a.progress;
  if (pg) S.push(['progress', '目前做到哪裡', `<h2>${esc(pg.heading || '目前做到哪裡')}</h2><div class="scn-status">${badge(a.maturity)}<span class="meta">${MATURITY[a.maturity].note}</span></div>
    ${pg.stats ? `<div class="stat-grid"><figure class="stat-chart">${pic(pg.image.src, pg.image.alt)}</figure><ul class="stats">${pg.stats.map(s => `<li><strong>${esc(s.v)}</strong><span>${esc(s.l)}</span></li>`).join('')}</ul></div>${cap(pg.image.caption)}`
      : pg.image ? `<figure class="fig-one">${pic(pg.image.src, pg.image.alt)}</figure>${cap(pg.image.caption)}` : ''}
    ${pg.text ? `<p>${esc(pg.text)}</p>` : ''}${pg.note ? `<div class="notice">${esc(pg.note)}</div>` : ''}`]);
  /* 04 實際案例 */
  if (a.cases?.length) S.push(['cases', '實際案例', a.cases.map(c => `<h2>${esc(c.heading)}</h2><p>${esc(c.body)}</p>${imgs(c.images, c.narrow ? 'narrow' : '')}${cap(c.caption)}`).join('')]);
  /* 05 額外成果 */
  if (a.extras?.length) S.push(['extras', '額外成果', a.extras.map(c => `<div class="extra"><h2>${esc(c.heading)}</h2><p>${esc(c.body)}</p>${imgs(c.images, c.pair ? 'pair' : c.narrow ? 'narrow' : '')}${cap(c.caption)}</div>`).join('')]);
  /* 06 團隊介紹 */
  if (a.lab) { const L = a.lab; S.push(['team', '學校實驗室與老師', `<div class="lab"><div><span class="lab-k">學校與系所</span><p class="lab-v">${esc(L.school)}<br>${esc(L.dept)}</p></div>
    <div><span class="lab-k">實驗室</span><p class="lab-v"><strong>${esc(L.lab)}</strong></p><p>${esc(L.labDesc)}</p></div>
    <div><span class="lab-k">主持人</span><p class="lab-v"><strong>${esc(L.pi)}</strong></p><p>${esc(L.piDesc)}</p><a class="text-btn" href="${esc(L.url)}" target="_blank" rel="noopener">實驗室官網 <span aria-hidden="true">↗</span></a></div></div>
    <div class="lab-logos">${L.logos.map(l => pic(l.src, l.alt)).join('')}</div>`]); }
  else if (a.teams?.length) S.push(['team', '參與團隊', `<div class="pgrid">${a.teams.map(x => partnerCard(byId(teams, x))).join('')}</div>`]);

  const i = applications.indexOf(a), next = applications[(i + 1) % applications.length];
  return `<section class="page-hero app-hero"><div class="wrap"><div class="crumb"><a href="#/">首頁</a> / <a href="#/applications">應用情境</a> / ${esc(a.title)}</div>
      <span class="kicker">${esc(a.date)} · ${esc(a.cat)}</span><h1>${esc(a.title)}</h1><p>${esc(a.summary)}</p><div class="card-tags spaced-sm">${badge(a.maturity)}${ts.map(t => `<span class="tag">${esc(t.tech)}</span>`).join('')}</div></div></section>
    <nav class="sec-nav" aria-label="本頁段落"><div class="wrap">${S.map(([k, l], n) => `<button data-jump="sec-${k}"><b>${String(n + 1).padStart(2, '0')}</b>${l}</button>`).join('')}</div></nav>
    <div class="wrap app-body">${S.map(([k, l, html], n) => `<section class="app-sec" id="sec-${k}"><span class="sec-tag"><b>${String(n + 1).padStart(2, '0')}</b>${l}</span><div class="prose">${html}</div></section>`).join('')}
      ${a.pending ? `<div class="notice">${esc(a.pending)}</div>` : ''}<p class="source-note">${SOURCE_NOTE}</p>
      <div class="app-next"><div><span class="meta">下一個應用情境</span><a href="#/applications/${next.id}"><strong>${esc(next.title)}</strong> <span aria-hidden="true">→</span></a></div>
        <div class="app-cta">${ts[0] ? link('community?scenario=' + ts[0].id, '看相關討論') : ''}${link('contact?item=' + encodeURIComponent(a.title), '聯繫專案窗口', 'btn primary')}</div></div></div>`;
}

/* ---------- 設備／商城（介紹與詢價共用） ---------- */
const device = d => `<div class="device">${d.chip}<small>概念示意圖</small></div>`;
const inquire = (d, cls = 'btn primary') => link(`contact?purpose=${encodeURIComponent('設備詢價')}&item=${encodeURIComponent(d.name)}`, '詢價', cls);
function devicesPage(id) {
  if (!id) return hero('設備／商城', 'DEVICES & SHOP', '專案使用的開發設備與可取得的品項。目前以詢價方式提供，由臺灣守護者聯盟社會公益協會回覆。') + `<div class="wrap page-body"><div class="notice">${ACCESS_NOTE}</div><div class="grid3">${devices.map(d => `<article class="card reveal"><a class="art" href="#/devices/${d.id}" tabindex="-1" aria-hidden="true">${device(d)}</a><div class="card-body"><span class="tag">${esc(d.sub)}</span><h3><a href="#/devices/${d.id}">${esc(d.name)}</a></h3><p>${esc(d.desc)}</p><div class="shop-row"><span class="price">價格：${esc(d.price)}</span>${inquire(d, 'btn small primary')}</div>${link('devices/' + d.id, '查看設備資訊', 'text-btn')}</div></article>`).join('')}</div></div>`;
  const d = byId(devices, id); if (!d) return missing();
  const used = techs.filter(t => t.devices.includes(d.id)).map(t => appOf(t.id));
  return hero(d.name, 'DEVICE', esc(d.sub), ['devices', '設備／商城']) + `<div class="wrap page-body"><div class="product-hero"><div class="art">${device(d)}</div><div class="prose"><span class="tag">${esc(d.sub)}</span><h2>${esc(d.name)}</h2><p>${esc(d.desc)}</p><p class="price big">價格：${esc(d.price)}</p>${inquire(d)}<p class="meta">${ACCESS_NOTE}</p></div></div>
  <h2 class="spaced">設備資訊</h2><table class="spec"><tbody><tr><td>用途</td><td>${esc(d.desc)}</td></tr><tr><td>規格</td><td>${esc(d.spec)}</td></tr><tr><td>用在哪些應用情境</td><td>${used.map(a => `<a href="#/applications/${a.id}">${esc(a.title)}</a>`).join('、')}</td></tr><tr><td>取得方式</td><td>${ACCESS_NOTE}</td></tr></tbody></table></div>`;
}

/* ---------- 合作團隊（計畫進程＋合作夥伴）、團隊頁、聯絡 ---------- */
function partners() {
  return hero('計畫進程與合作團隊', 'ROADMAP & PARTNERS', '連結消防需求、學研技術與產業資源，讓現場經驗成為開發的起點。') + `<div class="wrap page-body">
    <section class="panel"><div class="section-head nohead"><div><span class="kicker">ROADMAP</span><h2>計畫進程</h2></div><small>以日期、里程碑與目前階段呈現</small></div>${roadmap()}</section>
    <section class="panel"><div class="section-head nohead"><div><span class="kicker">PARTNERS</span><h2>合作團隊</h2></div><small>${teams.length} 個合作單位</small></div><div class="pgrid partners-grid">${teams.map(t => partnerCard(t)).join('')}${joinCard()}</div>
      <p class="source-note">標示「素材待補」的單位，Logo、形象照、聯繫窗口與官網將陸續補齊。</p></section>
    <section class="about-split"><div class="prose"><h2>計畫緣起</h2><p>濃煙、火光與快速變化的環境，讓人員位置、火源與距離的判讀充滿挑戰。消防 Edge AI 專案從這些資訊需求出發，探索在設備端整合影像、辨識與感測資訊。</p><p>守護之眼的原型與記者會展示，是合作的一個起點。平台希望整理技術成果與資源，讓消防員、開發者及關心專案的人能持續交流。</p></div>
      <aside class="sidebox"><h3>想加入合作？</h3><p>學研、產業或消防單位的合作提案，都可以從這裡開始。</p>${link('contact?purpose=' + encodeURIComponent('合作洽詢'), '聯絡我們', 'btn primary')}</aside></section></div>`;
}
function team(id) {
  const t = byId(teams, id); if (!t) return missing();
  const owned = techs.filter(s => s.team === t.id).map(s => appOf(s.id));
  return hero(t.name, 'PARTNER', esc(t.title), ['partners', '合作團隊']) + `<div class="wrap page-body two-col"><article class="prose"><span class="tag">${esc(t.type)}</span><h2>團隊簡介</h2><p>${esc(t.brief)}</p>
    ${owned.length ? `<h2>相關應用情境</h2>${owned.map(a => `<p><a href="#/applications/${a.id}"><strong>${esc(a.title)}</strong></a> ${badge(a.maturity)}<br>${esc(a.summary)}</p>`).join('')}` : ''}
    ${t.role ? `<h2>平台角色</h2><p>${esc(t.role)}</p>` : ''}
    ${t.pending ? `<p class="meta">${esc(t.pending)}</p>` : ''}
    <p class="source-note">${SOURCE_NOTE}</p></article>
  <aside class="side-stack">${partnerCard(t)}<div class="sidebox"><h3>與團隊聯繫</h3>${contactLines(t, t.name)}${t.phone || t.email ? '' : '<p>希望了解合作方式或提供現場需求，可透過平台窗口聯繫。</p>'}${link('contact?item=' + encodeURIComponent(t.name), '聯絡我們')}</div></aside></div>`;
}
function contact(params) {
  const item = params.get('item') || '', purpose = params.get('purpose') || '';
  const opts = ['合作洽詢', '設備詢價', '技術交流', '其他問題'];
  return hero('聯絡我們', 'CONTACT', '分享現場需求、技術問題，或聊聊下一個合作可能。') + `<div class="wrap page-body two-col"><form id="contact-form"><div class="split-fields"><div><label for="name">姓名 *</label><input id="name" name="name" required maxlength="80" autocomplete="name" value="${esc(me().name)}"></div><div><label for="email">回覆信箱 *</label><input id="email" name="email" type="email" required autocomplete="email"></div></div>
    <label for="purpose">聯絡目的</label><select id="purpose" name="purpose">${opts.map(o => `<option ${o === purpose ? 'selected' : ''}>${o}</option>`).join('')}</select>
    <label for="item">相關應用情境／設備／團隊</label><input id="item" name="item" value="${esc(item)}" maxlength="150">
    <label for="message">訊息內容 *</label><textarea id="message" name="message" required maxlength="5000" placeholder="請簡單說明你的需求與想了解的內容"></textarea>
    <div class="actions"><button class="btn primary">預覽送出內容 →</button></div><div id="mail-output" aria-live="polite"></div></form>
  <aside class="side-stack"><div class="sidebox"><h3>平台聯絡窗口</h3>${contactLines()}<p>合作洽詢、設備詢價與網站相關問題，都由這個窗口回覆；也可以直接填寫左側表單，不用登入。</p><div class="notice">示意版只顯示送出內容預覽，不會寄出。正式寄送方式待實作。</div></div></aside></div>`;
}

/* ---------- 技術交流（技術資源＋討論區） ---------- */
let topics = seedTopics.map(t => ({ ...t, replies: t.replies.map(r => ({ ...r })) }));
const cm = { cat: '全部', scenario: '', sort: 'new', q: '' };
function topicRows() {
  let a = topics.filter(t => (cm.cat === '全部' || t.cat === cm.cat) && (!cm.scenario || t.scenario === cm.scenario) && (t.title + t.body).toLowerCase().includes(cm.q.toLowerCase()));
  if (cm.sort === 'open') a = [...a].sort((x, y) => (x.status === 'open' ? 0 : 1) - (y.status === 'open' ? 0 : 1));
  if (cm.sort === 'replies') a = [...a].sort((x, y) => y.replies.length - x.replies.length);
  if (!a.length) return `<div class="empty"><p>找不到符合的討論。</p><button class="btn" data-clear-filter>清除篩選</button> ${link('community/new' + (cm.scenario ? '?scenario=' + cm.scenario : ''), '發起新討論', 'btn primary', 'data-gate="post"')}</div>`;
  return a.map(t => { const s = byId(techs, t.scenario); return `<article class="topic"><div><div class="topic-tags"><span class="tag">${esc(t.cat)}</span>${s ? `<a class="scn-chip" href="#/applications/${s.app}">${esc(s.title)}</a>` : ''}</div><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.author)} <span class="role">${esc(t.identity)}</span> · ${esc(t.date)}</span></div><div class="meta">${t.replies.length} 則回覆</div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div></article>`; }).join('');
}
const POST_TEMPLATE = '使用設備：\n執行環境：\n遇到的問題：\n已嘗試的方法：';
function community(id, params) {
  if (id === 'new') {
    if (!loggedIn()) return gatePage('發起討論', 'post');
    const pre = params.get('scenario') || '';
    return hero('發起討論', 'NEW TOPIC', '把問題說清楚，回答的人就不用一直追問。', ['community', '技術交流']) + `<div class="wrap page-body two-col"><form id="new-topic"><label for="topic-title">標題 *</label><input id="topic-title" name="title" required maxlength="100" placeholder="一句話說明你的問題或需求">
      <div class="split-fields"><div><label for="topic-cat">分類</label><select id="topic-cat" name="cat">${TOPIC_CATS.map(c => `<option>${c}</option>`).join('')}</select></div><div><label for="topic-scn">相關技術</label><select id="topic-scn" name="scenario"><option value="">不指定</option>${techs.map(s => `<option value="${s.id}" ${s.id === pre ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></div></div>
      <label for="topic-body">內容 *</label><textarea id="topic-body" name="body" required maxlength="5000" placeholder="${POST_TEMPLATE.replace(/\n/g, '&#10;')}"></textarea><button type="button" class="text-btn" data-template>套用技術提問格式</button>
      <div class="actions"><button class="btn primary">送出討論</button>${link('community', '取消', 'btn', '')}</div></form>
      <aside class="side-stack"><div class="sidebox"><h3>以這個身分發文</h3><p><strong>${esc(me().name)}</strong> <span class="role">${esc(me().identity)}</span></p><p class="meta">示意版的發文只保留在目前分頁，重新整理後重置。</p></div><div class="sidebox"><h3>提問小提醒</h3><p>技術問題請寫出使用的設備、執行環境與已嘗試的方法；現場需求請描述情境與希望得到的資訊。</p></div></aside></div>`;
  }
  if (!id) {
    cm.scenario = params.get('scenario') || '';
    return hero('技術交流', 'COMMUNITY', '技術資源與討論集中在這裡：先查技術細節，找不到答案再發問。') + `<div class="wrap page-body">
      <div class="section-title pt-none"><h2>技術資源</h2><span class="badge-count">技術文件整理中</span></div>
      <div class="grid3 res-grid">${techs.map(t => `<a class="res-card" href="#/applications/${t.app}"><span class="tag">${esc(t.tech)}</span><strong>${esc(t.title)}</strong><span>${esc(t.method)}</span><em>使用設備：${t.devices.map(d => esc(byId(devices, d).chip)).join('、')}</em></a>`).join('')}</div>
      <div class="two-col cm spaced"><div><div class="section-title pt-none"><h2>討論區</h2></div>
      <div class="toolbar"><input aria-label="搜尋討論" id="topic-search" placeholder="搜尋標題或內容" value="${esc(cm.q)}">${link('community/new' + (cm.scenario ? '?scenario=' + cm.scenario : ''), '發起討論', 'btn primary', 'data-gate="post"')}</div>
      <div class="toolbar filters"><div class="chips">${['全部', ...TOPIC_CATS].map(c => `<button class="chip ${c === cm.cat ? 'selected' : ''}" data-filter="${c}" aria-pressed="${c === cm.cat}">${c}</button>`).join('')}</div>
        <label class="inline">技術<select id="scn-filter"><option value="">全部</option>${techs.map(s => `<option value="${s.id}" ${s.id === cm.scenario ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>
        <label class="inline">排序<select id="sort"><option value="new" ${cm.sort === 'new' ? 'selected' : ''}>最新</option><option value="open" ${cm.sort === 'open' ? 'selected' : ''}>待回覆優先</option><option value="replies" ${cm.sort === 'replies' ? 'selected' : ''}>回覆最多</option></select></label></div>
      <div class="forum" id="topic-list">${topicRows()}</div></div>
    <aside class="side-stack"><div class="sidebox"><h3>發文需要登入</h3><p>瀏覽討論不需要登入；發文與回覆需要登入，並會顯示你的名稱與身分。</p></div><div class="sidebox"><h3>設備</h3><ul class="plain">${devices.map(d => `<li><a href="#/devices/${d.id}">${esc(d.name)}</a></li>`).join('')}</ul></div><div class="notice">正式版第一階段討論區先顯示「即將開放」，發文與回覆列於第二階段；此處為互動示意。</div></aside></div></div>`;
  }
  const t = byId(topics, id); if (!t) return missing();
  const s = byId(techs, t.scenario);
  return hero(t.title, 'DISCUSSION', `<span class="tag">${esc(t.cat)}</span> <span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span>`, ['community', '技術交流']) + `<div class="wrap page-body two-col"><div>
    <article class="post"><div class="meta">${esc(t.author)} <span class="role">${esc(t.identity)}</span> · ${esc(t.date)}</div><p>${esc(t.body)}</p></article>
    <div class="section-title"><h2>${t.replies.length} 則回覆</h2></div>
    ${t.replies.map(r => `<article class="post answer ${r.accepted ? 'accepted' : ''}">${r.accepted ? '<span class="accepted-tag">被採納的回答</span>' : ''}<div class="meta">${esc(r.author)} <span class="role">${esc(r.identity)}</span></div><p>${esc(r.text)}</p></article>`).join('')}
    <form id="reply-form" data-topic="${t.id}"><label for="reply">你的回覆 *</label><textarea id="reply" name="body" required maxlength="5000" placeholder="${loggedIn() ? '輸入回覆內容' : '可以先輸入，送出時再登入；內容會保留'}"></textarea><div class="actions"><button class="btn primary">送出回覆</button>${loggedIn() ? `<span class="meta">以 ${esc(me().name)}（${esc(me().identity)}）身分回覆</span>` : '<span class="meta">送出時需要登入</span>'}</div></form></div>
  <aside class="side-stack">${s ? `<div class="sidebox"><h3>相關應用情境</h3><p><a href="#/applications/${s.app}">${esc(appOf(s.id).title)}</a><br><span class="meta">${esc(s.tech)}</span></p>${link('applications/' + s.app, '查看技術細節')}</div>` : ''}<div class="sidebox"><h3>一起把問題說清楚</h3><p>回覆時可以補充你的使用情境與觀察。</p><p class="meta">示意版的回覆只保留在目前分頁，重新整理後重置。</p></div></aside></div>`;
}

/* ---------- 會員中心、後臺、搜尋 ---------- */
function member() {
  if (!loggedIn()) return gatePage('會員中心', 'member');
  const mine = topics.filter(t => t.mine), p = me();
  return hero('會員中心', 'MEMBER', `${esc(p.name)} · ${esc(p.identity)}`) + `<div class="wrap page-body two-col"><div>
    <div class="section-title"><h2>我的發文</h2>${link('community/new', '發起討論', 'btn primary', 'data-gate="post"')}</div>
    <div class="forum">${mine.length ? mine.map(t => `<article class="topic"><div><span class="tag">${esc(t.cat)}</span><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.date)}</span></div><div class="meta">${t.replies.length} 則回覆</div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div></article>`).join('') : '<div class="empty">還沒有發文。示意版的發文只保留在目前分頁。</div>'}</div>
    <div class="section-title"><h2>我的設備詢價</h2></div><div class="notice">詢價紀錄與 TGA 的回覆流程，待與後端確認後加入。</div></div>
  <aside class="side-stack"><div class="sidebox"><h3>帳號資訊</h3><table class="spec mini"><tbody><tr><td>名稱</td><td>${esc(p.name)}</td></tr><tr><td>身分</td><td>${esc(p.identity)}</td></tr><tr><td>權限</td><td>${auth.role === 'admin' ? '管理員' : '會員'}</td></tr><tr><td>登入方式</td><td>Google（示意）</td></tr></tbody></table><div class="actions"><button class="btn" data-edit-profile>修改資料</button><button class="btn" data-logout>登出</button></div></div></aside></div>`;
}
const adminFields = {
  應用情境: ['標題', '分類', '日期', '介紹', '現場痛點與技術作法', '目前做到哪裡', '封面圖片'],
  設備: ['設備名稱', '分類', '用途', '規格', '價格（或「洽詢」）', '圖片'],
  合作團隊: ['單位名稱', '類型（學研團隊／企業／協會／消防單位）', '稱謂（主持人或聯繫窗口）', '姓名職稱', '簡介', '平台角色說明', '官網', 'Logo 或形象照圖片'],
  計畫進程: ['里程碑名稱', '日期', '簡短說明']
};
function admin(kind) {
  if (auth.role !== 'admin') return hero('內容管理後臺', 'ADMIN', '此頁僅限管理員。') + `<div class="wrap page-body"><div class="gate"><p>正式版由管理員帳號登入後進入。示意版可用頁尾的「示意身分切換」切成管理員查看。</p></div></div>`;
  if (kind === '討論') return hero('內容管理後臺', 'ADMIN', '維護網站內容與管理討論。') + adminNav('討論') + `<div class="wrap page-body pt0"><div class="forum">${topics.map(t => `<article class="topic"><div><span class="tag">${esc(t.cat)}</span><h3><a href="#/community/${t.id}">${esc(t.title)}</a></h3><span class="meta">${esc(t.author)} · ${esc(t.date)}</span></div><div><span class="status st-${t.status}">${t.status === 'answered' ? '已解答' : '待回覆'}</span></div><div class="row-actions"><button class="chip" data-mark="${t.id}">${t.status === 'answered' ? '改為待回覆' : '標記已解答'}</button><button class="chip" data-hide="${t.id}">隱藏</button></div></article>`).join('')}</div><p class="source-note">示意操作，重新整理後重置。</p></div>`;
  if (!adminFields[kind]) kind = '應用情境';
  const extra = kind === '應用情境' ? `<label for="mat">成熟度</label><select id="mat" name="成熟度">${Object.values(MATURITY).map(m => `<option>${m.label}</option>`).join('')}</select>`
    : kind === '計畫進程' ? `<label for="st">狀態</label><select id="st" name="狀態">${Object.values(STATE_LABEL).map(m => `<option>${m}</option>`).join('')}</select>` : '';
  return hero('內容管理後臺', 'ADMIN', '維護網站內容與管理討論。') + adminNav(kind) + `<div class="wrap page-body pt0 two-col"><form id="admin-form"><h2>新增${kind}</h2>${adminFields[kind].map((f, i) => `<label for="field${i}">${f}${i === 0 ? ' *' : ''}</label>${f.includes('圖片') ? `<input id="field${i}" name="${f}" type="file" accept="image/*">` : i > 1 ? `<textarea id="field${i}" name="${f}"></textarea>` : `<input id="field${i}" name="${f}" ${i === 0 ? 'required' : ''}>`}`).join('')}${extra}<div class="actions"><button class="btn primary">預覽內容</button></div></form><aside class="sidebox"><h3>內容預覽</h3><div id="admin-output"><p>填寫左側欄位後，點選「預覽內容」。</p></div></aside></div>`;
}
const adminNav = k => `<div class="wrap"><div class="admin-nav">${[...Object.keys(adminFields), '討論'].map(x => `<a class="chip ${x === k ? 'selected' : ''}" href="#/admin/${x}">${x}${x === '討論' ? '管理' : ''}</a>`).join('')}</div></div>`;
function search() { return hero('搜尋', 'SEARCH', '搜尋應用情境、設備、團隊與討論。') + `<div class="wrap page-body"><div class="toolbar"><input id="global-search" aria-label="搜尋平台內容" placeholder="例如：測距、E84、濃煙、記者會"></div><div id="search-results" class="forum">${searchRows('')}</div></div>`; }
function searchRows(q) {
  const all = [...applications.map(a => ({ t: a.title + '｜' + a.summary + (a.techs || []).map(x => byId(techs, x).tech).join(''), show: a.title, p: 'applications/' + a.id, k: '應用情境' })), ...devices.map(d => ({ t: d.name, p: 'devices/' + d.id, k: '設備' })), ...teams.map(t => ({ t: t.name + '｜' + t.title, p: 'team/' + t.id, k: '團隊' })), ...topics.map(t => ({ t: t.title, p: 'community/' + t.id, k: '討論' }))].filter(x => x.t.toLowerCase().includes(q.toLowerCase()));
  return all.length ? all.map(x => `<div class="topic"><div><span class="tag">${x.k}</span><h3><a href="#/${x.p}">${esc(x.show || x.t)}</a></h3></div></div>`).join('') : '<div class="empty">找不到符合的內容，請換一個關鍵字。</div>';
}
function missing() { return hero('找不到這個頁面', 'PAGE NOT FOUND', '請從導覽列選擇其他內容。') + `<div class="wrap page-body">${link('', '返回首頁')}</div>`; }

/* ---------- 路由 ---------- */
const TECH_APP = { distance: 'firesight', smoke: 'vision', count: 'count' };
const LEGACY = {
  resources: id => id ? 'team/' + id : 'applications', shop: id => id ? 'devices/' + id : 'devices', cart: () => 'devices',
  scenarios: id => 'applications' + (TECH_APP[id] ? '/' + TECH_APP[id] : ''), results: id => 'applications' + (id ? '/' + id : ''), about: () => 'partners'
};
const NAV_GROUP = { applications: 'applications', devices: 'devices', partners: 'partners', team: 'partners', contact: 'contact', community: 'community', search: 'search' };
function route() {
  const raw = location.hash.replace(/^#\/?/, ''), [path, qs] = raw.split('?');
  const [section = '', id] = path.split('/').map(decodeURIComponent);
  return { section, id, params: new URLSearchParams(qs || '') };
}
let firstRender = true;
function render() {
  const { section, id, params } = route();
  if (LEGACY[section]) { location.replace('#/' + LEGACY[section](id)); return; }
  const views = { '': () => home(params), applications: () => applicationsPage(id), devices: () => devicesPage(id), partners, team: () => team(id), contact: () => contact(params), community: () => community(id, params), member, admin: () => admin(id), search };
  $('#app').innerHTML = (views[section] || missing)();
  $$('[data-route]').forEach(a => { const on = NAV_GROUP[section] === a.dataset.route; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  $$('#apps-menu a').forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#/' + section + (id ? '/' + id : '')));
  document.title = (section ? ($('#app h1')?.textContent + '｜') : '') + '消防 Edge AI 開發平台';
  closeNav(); setHeaderVar();
  if (!firstRender) { window.scrollTo(0, 0); $('#app').focus({ preventScroll: true }); }
  firstRender = false;
  initReveal(); initCarousel(); initSecNav();
}
function setHeaderVar() {
  const h = $('.site-header'), sticky = getComputedStyle(h).position === 'sticky';
  document.documentElement.style.setProperty('--hdr', (sticky ? h.offsetHeight : 0) + 'px');
}

/* ---------- 互動 ---------- */
let revealObs, secObs;
function initReveal() {
  const els = $$('.reveal:not(.in)');
  if (reduceMotion() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  revealObs?.disconnect();
  revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => revealObs.observe(e));
}
function initSecNav() {
  secObs?.disconnect(); const secs = $$('.app-sec'); if (!secs.length || !('IntersectionObserver' in window)) return;
  secObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.sec-nav button').forEach(b => b.classList.toggle('on', b.dataset.jump === e.target.id)); }), { rootMargin: '-35% 0px -60% 0px' });
  secs.forEach(s => secObs.observe(s));
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
  const t = byId(techs, id); if (!t) return;
  $$('.scn-tab').forEach(x => { const on = x.dataset.scn === id; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; if (on && focus) x.focus(); });
  const panel = $('#scn-panel'); panel.setAttribute('aria-labelledby', 'tab-' + id); panel.innerHTML = scnPanel(t);
  if (!reduceMotion()) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  history.replaceState(null, '', '#/?s=' + id);
}
let toastTimer;
function toast(s) { const t = $('#toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3800); }

document.addEventListener('click', e => {
  const el = e.target.closest('button, a, [data-close]'); if (!el) return;
  if (el.matches('[data-close]') && (e.target === el || el.classList.contains('modal-x'))) return closeModal();
  if (el.matches('.menu-btn')) { const open = !document.body.classList.contains('nav-open'); document.body.classList.toggle('nav-open', open); el.setAttribute('aria-expanded', open); return; }
  if (el.matches('.nav-parent') && touchNav() && !$('.has-menu').classList.contains('open')) { e.preventDefault(); return setMenu(true); }
  if (el.matches('.menu-caret')) { return setMenu(!$('.has-menu').classList.contains('open')); }
  if (el.matches('[data-jump]')) { document.getElementById(el.dataset.jump)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
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
document.addEventListener('click', e => {
  if (!e.target.closest('.acct')) $$('.acct-menu').forEach(m => { m.hidden = true; m.previousElementSibling?.setAttribute('aria-expanded', 'false'); });
  if (!e.target.closest('.has-menu') && $('.has-menu').classList.contains('open')) setMenu(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#modal-root').innerHTML) closeModal(); $$('.acct-menu').forEach(m => m.hidden = true); if ($('.has-menu').classList.contains('open')) { setMenu(false); $('.nav-parent').focus(); } document.body.classList.remove('nav-open'); }
  if (e.target.matches('.scn-tab') && ['ArrowRight', 'ArrowLeft'].includes(e.key)) { const ids = techs.map(s => s.id), i = ids.indexOf(e.target.dataset.scn); selectScenario(ids[(i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length], true); e.preventDefault(); }
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
    const text = `主旨：【${data.purpose}】${data.item || '消防 Edge AI 平台'}\n收件窗口：${CONTACT.org}\n\n${data.message}\n\n相關項目：${data.item || '未指定'}\n姓名：${data.name}\n回覆信箱：${data.email}`;
    $('#mail-output').innerHTML = '<h2 class="spaced">送出內容預覽</h2><p class="notice">內容已整理，尚未寄出。正式寄送功能待實作。</p><div class="mail-preview">' + esc(text) + '</div>';
  }
  if (f.id === 'admin-form') $('#admin-output').innerHTML = Object.entries(data).map(([k, v]) => `<h4>${esc(k)}</h4><p style="white-space:pre-wrap">${esc(v instanceof File ? (v.name || '未選擇') : v) || '尚未填寫'}</p>`).join('');
});
document.addEventListener('mouseleave', e => { if (e.target.classList?.contains('has-menu')) e.target.classList.remove('hold-closed'); }, true);
window.addEventListener('resize', setHeaderVar);

document.documentElement.classList.add('js');
buildNav(); renderAccount();
window.addEventListener('hashchange', render);
render();
