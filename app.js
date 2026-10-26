/* ===== 1. HOLAT ===== */
const $ = id => document.getElementById(id);
const state = {
  lang: 'uz', screen: 'auth', selectedTour: null, guests: 1, pay: 'click', region: 'all',
  user: { id: 'usr_882193', name: 'Mehmon', email: 'tourist@silkway.uz', role: 'tourist', kyc: 'UNVERIFIED' },
  passport: null, bookings: [], logs: []
};

/* ===== 2. TARJIMALAR ===== */
const i18n = {
  uz: { welcome: "Janubiy O‘zbekiston bo‘ylab sayohat", sub: "Qashqadaryo va Surxondaryoning qadimiy go‘zalliklarini kashf eting.", tours: "Turlar", kyc: "KYC", profile: "Profil", kycTitle: "Shaxsni tasdiqlash (KYC)" },
  en: { welcome: "Travel across Southern Uzbekistan", sub: "Discover the ancient heritage of Qashqadaryo and Surxondaryo.", tours: "Tours", kyc: "KYC", profile: "Profile", kycTitle: "Identity verification (KYC)" },
  ru: { welcome: "Путешествие по Южному Узбекистану", sub: "Откройте древнее наследие Кашкадарьи и Сурхандарьи.", tours: "Туры", kyc: "KYC", profile: "Профиль", kycTitle: "Верификация личности (KYC)" }
};

/* ===== 3. TURLAR MA'LUMOTI ===== */
const toursData = [
  { id: 'tour_q1', region: 'qashqadaryo', title: 'Shahrisabz Oqsaroy va qadimiy obidalar', duration: '2 kun / 1 tun', price: 450000, guide: 'Anvar Aliyev', rating: 4.9, image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=500&q=80', desc: 'Amir Temur tug‘ilgan shahar: Oqsaroy majmuasi va Dorus-Saodat.' },
  { id: 'tour_s1', region: 'surxondaryo', title: 'Termiz buddaviy yodgorliklari va Fayoztepa', duration: '3 kun / 2 tun', price: 680000, guide: 'Sardor Qosimov', rating: 5.0, image: 'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=500&q=80', desc: 'Termiz, Fayoztepa va Qoratepa buddaviy ibodatxonalari bo‘ylab ekspeditsiya.' },
  { id: 'tour_q2', region: 'qashqadaryo', title: 'Hisor tog‘lari va G‘elon qishlog‘i ekoturi', duration: '1 kunlik', price: 320000, guide: 'Nodira Umarova', rating: 4.8, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80', desc: 'Tog‘ qishloqlariga toza havo va tabiat turi.' },
  { id: 'tour_s2', region: 'surxondaryo', title: 'Boysun manzaralari va Sangardak sharsharasi', duration: '2 kun / 1 tun', price: 520000, guide: 'Erkin Zokirov', rating: 4.9, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80', desc: 'Boysunning madaniy muhiti va sharshara.' }
];

/* ===== 4. YORDAMCHI ===== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => n.toLocaleString('ru-RU') + ' UZS';
const ON = 'bg-emeraldDeep text-white shadow', OFF = 'text-slate-600';
function setBtn(el, on, onCls, offCls) { el.className = el.className.replace(onCls, '').replace(offCls, '') + ' ' + (on ? onCls : offCls); }

function logSql(text) {
  state.logs.unshift('[' + new Date().toLocaleTimeString() + '] ' + text);
  state.logs.length = Math.min(state.logs.length, 20);
  $('db-logs').innerHTML = state.logs.map(l => `<div class="text-emerald-400/90 text-[10px] truncate">${esc(l)}</div>`).join('');
}

/* ===== 5. TIL ===== */
function changeLanguage(l) {
  state.lang = l; const d = i18n[l];
  $('t-welcome').textContent = d.welcome; $('t-welcomeSub').textContent = d.sub;
  $('t-navTours').textContent = d.tours; $('t-navKyc').textContent = d.kyc; $('t-navProfile').textContent = d.profile;
  $('t-kyc').textContent = d.kycTitle;
  logSql('SET app.language = ' + l);
}

/* ===== 6. NAVIGATSIYA ===== */
function navigate(id) {
  state.screen = id;
  ['auth', 'kyc', 'explorer', 'booking'].forEach(s => $('screen-' + s).classList.toggle('hidden', s !== id));
  document.querySelectorAll('[data-nav]').forEach(b => {
    const on = b.dataset.nav === id;
    b.classList.toggle('text-emeraldDeep', on); b.classList.toggle('text-slate-400', !on);
  });
  logSql('NAVIGATE /app/' + id);
}

/* ===== 7. KIRISH ===== */
function setAuthMode(mode) {
  const reg = mode === 'register';
  $('f-name').classList.toggle('hidden', !reg); $('f-role').classList.toggle('hidden', !reg);
  $('authTab-login').className = 'flex-1 py-2 rounded-lg ' + (reg ? 'text-slate-600' : 'bg-white shadow text-emeraldDeep');
  $('authTab-register').className = 'flex-1 py-2 rounded-lg ' + (reg ? 'bg-white shadow text-emeraldDeep' : 'text-slate-600');
  $('authSubmit').textContent = reg ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish';
  $('authForm').dataset.mode = mode;
}
function enter(name) {
  if (name) state.user.name = name;
  $('inPass').value = ''; $('inPass').type = 'password'; $('eye').textContent = 'Ko‘rsatish';
  updateInspector(); renderDb(); navigate('explorer');
}
$('authForm').addEventListener('submit', e => {
  e.preventDefault();
  const reg = e.currentTarget.dataset.mode === 'register', email = $('inEmail').value.trim();
  state.user.email = email;
  if (reg) {
    state.user.role = $('inRole').value;
    logSql(`INSERT INTO users (email, role) VALUES ('${email}', '${state.user.role}')`);
    enter($('inName').value.trim() || 'Yangi foydalanuvchi');
  } else {
    logSql(`SELECT * FROM users WHERE email='${email}'`);
    enter(email.split('@')[0]);
  }
});
$('eye').onclick = () => { const p = $('inPass'), h = p.type === 'password'; p.type = h ? 'text' : 'password'; $('eye').textContent = h ? 'Yashirish' : 'Ko‘rsatish'; };
document.querySelectorAll('[data-mode]').forEach(b => { if (b.id) b.onclick = () => setAuthMode(b.dataset.mode); });
document.querySelectorAll('[data-social]').forEach(b => b.onclick = () => { logSql('OAUTH via ' + b.dataset.social); enter(b.dataset.social + ' foydalanuvchi'); });
$('forgot').onclick = () => $('otp').classList.remove('hidden');
$('otpCancel').onclick = () => $('otp').classList.add('hidden');
$('otpOk').onclick = () => {
  if (!/^\d{4}$/.test($('otpCode').value)) { $('otpMsg').textContent = '4 xonali kod kiriting.'; return; }
  $('otpMsg').textContent = ''; $('otpCode').value = ''; $('otp').classList.add('hidden'); logSql('OTP_VERIFY: SUCCESS');
};

/* ===== 8. KYC ===== */
function enable(btn) { btn.disabled = false; btn.className = 'w-full py-2.5 bg-emeraldDeep text-goldWarm font-bold text-xs rounded-xl'; }
$('btnScan').onclick = () => {
  logSql('KYC_OCR: skanerlanmoqda...');
  setTimeout(() => {
    $('ocrBox').classList.remove('hidden'); state.passport = 'FA7890123'; enable($('btnFace'));
    logSql(`INSERT INTO kyc (user_id, passport, status) VALUES ('${state.user.id}', 'FA7890123', 'PENDING')`); renderDb();
  }, 1000);
};
$('btnFace').onclick = () => { $('kyc1').classList.add('hidden'); $('kyc2').classList.remove('hidden'); $('dot2').classList.replace('bg-slate-300', 'bg-emeraldDeep'); };
$('btnStartFace').onclick = () => {
  $('radar').classList.remove('hidden'); $('faceText').textContent = 'Harakatlanmang...';
  $('faceIcon').className = 'fa-solid fa-face-smile text-6xl text-goldWarm animate-pulse';
  setTimeout(() => {
    $('radar').classList.add('hidden'); $('faceIcon').className = 'fa-solid fa-face-laugh-beam text-6xl text-emerald-400';
    $('faceText').textContent = 'Yuz mos keldi'; $('faceOk').classList.remove('hidden');
    $('kycBadge').textContent = 'APPROVED 🟢'; $('kycBadge').className = 'px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold h-fit';
    state.user.kyc = 'APPROVED'; $('kycDot').classList.replace('bg-amber-500', 'bg-emerald-500');
    enable($('btnFinish')); logSql(`UPDATE kyc SET status='APPROVED' WHERE user_id='${state.user.id}'`);
    updateInspector(); renderDb();
  }, 2500);
};
$('btnFinish').onclick = () => navigate('explorer');

/* ===== 9. TURLAR ===== */
function renderTours() {
  const q = $('search').value.trim().toLowerCase();
  const list = toursData.filter(t => (state.region === 'all' || t.region === state.region) && (!q || (t.title + t.desc).toLowerCase().includes(q)));
  $('tours').innerHTML = list.length ? list.map(t => `
   <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="h-32 bg-slate-800 relative"><img src="${t.image}" alt="${esc(t.title)}" class="w-full h-full object-cover" onerror="this.remove()">
     <span class="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 text-goldWarm font-bold text-[10px] rounded-full">★ ${t.rating}</span></div>
    <div class="p-3"><h4 class="font-bold text-xs">${esc(t.title)}</h4><p class="text-[10px] text-slate-500 mt-1">${esc(t.desc)}</p>
     <div class="mt-2 pt-2 border-t flex items-center justify-between text-[11px]"><div><span class="text-slate-400 block text-[9px]">Gid: ${esc(t.guide)}</span><strong class="text-emeraldDeep">${money(t.price)}</strong></div>
     <button data-book="${t.id}" class="px-3 py-1.5 bg-emeraldDeep text-goldWarm font-bold text-[10px] rounded-xl">Bron qilish</button></div></div>
   </div>`).join('') : '<p class="text-xs text-slate-500 text-center py-6">Hech narsa topilmadi. Qidiruvni o‘zgartiring.</p>';
}
function setRegion(r) {
  state.region = r;
  document.querySelectorAll('[data-region]').forEach(b => { b.className = 'flex-1 py-1.5 rounded-lg ' + (b.dataset.region === r ? ON : OFF); });
  renderTours(); logSql(`SELECT * FROM tours WHERE region='${r}'`);
}
$('search').oninput = renderTours;
document.querySelectorAll('[data-region]').forEach(b => b.onclick = () => setRegion(b.dataset.region));
$('tours').onclick = e => { const b = e.target.closest('[data-book]'); if (b) openBooking(b.dataset.book); };

/* ===== 10. BRON VA TO'LOV ===== */
function openBooking(id) {
  const t = state.selectedTour = toursData.find(x => x.id === id); state.guests = 1;
  $('bTitle').textContent = t.title; $('bDur').textContent = t.duration; $('bPrice').textContent = money(t.price);
  $('bGuide').textContent = 'Gid: ' + t.guide; $('gCount').textContent = '1 kishi';
  const d = new Date(); d.setDate(d.getDate() + 1); $('bDate').min = new Date().toISOString().split('T')[0]; $('bDate').value = d.toISOString().split('T')[0];
  selectPay('click'); recalc(); navigate('booking');
}
function recalc() { $('bTotal').textContent = money(state.selectedTour.price * state.guests); }
function selectPay(m) {
  state.pay = m;
  document.querySelectorAll('[data-pay]').forEach(b => { b.className = 'p-2.5 rounded-xl text-[10px] font-bold ' + (b.dataset.pay === m ? 'border-2 border-emeraldDeep bg-emerald-50' : 'border border-slate-200 bg-white'); });
}
$('gMinus').onclick = () => { state.guests = Math.max(1, state.guests - 1); $('gCount').textContent = state.guests + ' kishi'; recalc(); };
$('gPlus').onclick = () => { state.guests++; $('gCount').textContent = state.guests + ' kishi'; recalc(); };
document.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => selectPay(b.dataset.pay));
$('backBtn').onclick = () => navigate('explorer');
$('btnPay').onclick = () => {
  const t = state.selectedTour, total = t.price * state.guests, ref = 'SW-' + Math.floor(10000 + Math.random() * 90000);
  state.bookings.push({ id: ref, title: t.title, amount: total, status: 'ON_HOLD', method: state.pay.toUpperCase() });
  logSql(`ESCROW_CREATE: ${total} UZS, booking=${ref}`);
  $('rCode').textContent = ref; $('rAmount').textContent = money(total); $('rMethod').textContent = state.pay.toUpperCase();
  $('receipt').classList.remove('hidden'); renderDb();
};
$('rClose').onclick = () => { $('receipt').classList.add('hidden'); navigate('explorer'); };

/* ===== 11. INSPEKTOR ===== */
function updateInspector() {
  $('inspUser').textContent = `${state.user.name} (${state.user.role})`;
  const ok = state.user.kyc === 'APPROVED';
  $('inspKyc').textContent = ok ? 'APPROVED 🟢' : 'UNVERIFIED 🔴';
  $('inspKyc').className = 'text-xs font-bold ' + (ok ? 'text-emerald-400' : 'text-amber-400');
}
function renderDb() {
  const row = h => `<div class="bg-sapphireCard p-2 rounded border border-slate-800 space-y-1 mb-1">${h}</div>`, u = state.user;
  $('db-users').innerHTML = row(`<div class="text-goldWarm font-bold">id: ${u.id}</div><div>name: "${esc(u.name)}"</div><div>email: "${esc(u.email)}"</div><div>role: "${u.role}"</div>`);
  $('db-kyc').innerHTML = row(`<div>passport: "${state.passport || 'N/A'}"</div><div>status: '${u.kyc}'</div>`);
  $('db-bookings').innerHTML = state.bookings.length ? state.bookings.map(b => row(`<div class="text-goldWarm font-bold">id: ${b.id}</div><div>tour: "${esc(b.title.slice(0, 20))}…"</div><div>amount: ${b.amount} UZS</div><div>escrow: ${b.status}</div>`)).join('') : '<div class="text-slate-500 italic">Hali bronlar yo‘q</div>';
}
document.querySelectorAll('#dbTabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#dbTabs button').forEach(x => x.className = 'flex-1 py-2.5 border-b-2 ' + (x === b ? 'border-goldWarm text-goldWarm' : 'border-transparent'));
  ['users', 'kyc', 'bookings', 'logs'].forEach(t => $('db-' + t).classList.toggle('hidden', t !== b.dataset.tab));
});
$('resetBtn').onclick = () => {
  state.user.kyc = 'UNVERIFIED'; state.bookings = []; state.passport = null;
  updateInspector(); renderDb(); logSql('TRUNCATE bookings, kyc'); alert('Demo ma’lumotlari tozalandi.');
};
$('viewBtn').onclick = () => {
  const f = $('frame'), full = f.classList.toggle('max-w-[430px]');
  ['h-[860px]', 'rounded-[42px]', 'border-[10px]'].forEach(c => f.classList.toggle(c, full));
  ['max-w-full', 'h-full', 'border-0'].forEach(c => f.classList.toggle(c, !full));
  $('viewModeText').textContent = full ? 'Expanded' : 'Phone frame';
};

/* ===== 12. BOSHLASH ===== */
function tick() { $('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
$('lang').onchange = e => changeLanguage(e.target.value);
document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => navigate(b.dataset.nav));
tick(); setInterval(tick, 30000);
changeLanguage('uz'); setAuthMode('login'); setRegion('all'); renderDb(); navigate('auth');
logSql('INIT demo session');
