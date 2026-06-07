// app.js — AI Tools Studio | Orchestrator Utama
// Flow: inject CSS → load modul → cek session → login → dashboard

const CDN = 'https://cdn.jsdelivr.net/gh/USERNAME/REPO@main';
const R   = document.getElementById('root');

const App = {
  data: null,
  cat: 'all',
  search: '',

  async init() {
    try {
      injectCSS('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
      injectCSS(`${CDN}/css/style.css`);
      await loadJS(`${CDN}/js/auth.js`);
      await loadJS(`${CDN}/js/api.js`);
      await loadJS(`${CDN}/js/renderer.js`);

      const saved = sessionStorage.getItem('_u');
      if (saved) {
        App.data = await App.fetchTools();
        App.renderDashboard(saved);
      } else {
        App.renderLogin();
      }
    } catch (e) {
      R.innerHTML = `<div style="padding:32px;font-family:sans-serif;color:#f87171"><b>Error:</b> ${e.message}</div>`;
    }
  },

  async fetchTools() {
    const r = await fetch(`${CDN}/tools.json`, { cache: 'no-store' });
    if (!r.ok) throw new Error('Gagal memuat data tools.');
    return r.json();
  },

  // ── LOGIN ────────────────────────────────────────────────────────
  renderLogin() {
    R.innerHTML = `
      <div class="login-screen">
        <div class="login-blob blob-1"></div>
        <div class="login-blob blob-2"></div>
        <div class="login-card">
          <div class="login-brand">
            <div class="login-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span>AI Tools Studio</span>
          </div>
          <h1 class="login-title">Selamat Datang</h1>
          <p class="login-sub">Masukkan email Anda untuk mengakses 134 tools AI profesional</p>
          <div class="login-form">
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" id="em" class="login-input" placeholder="email@contoh.com" autocomplete="email">
            </div>
            <button class="login-btn" id="lb">
              Masuk
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <div id="lm" class="login-msg"></div>
          </div>
          <p class="login-register">Belum punya akses? <a href="https://forms.gle/LINK_FORM_ANDA" target="_blank">Daftar sekarang →</a></p>
        </div>
      </div>`;
    document.getElementById('em').addEventListener('keydown', e => e.key === 'Enter' && App.doLogin());
    document.getElementById('lb').onclick = App.doLogin;
    setTimeout(() => document.getElementById('em').focus(), 100);
  },

  async doLogin() {
    const email = document.getElementById('em').value.trim().toLowerCase();
    const msg   = document.getElementById('lm');
    const btn   = document.getElementById('lb');
    if (!email || !email.includes('@')) { msg.textContent = 'Masukkan email yang valid.'; return; }
    msg.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Memverifikasi...';
    const ok = await checkAccess(email);
    if (!ok) {
      btn.disabled = false;
      btn.innerHTML = 'Masuk <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      msg.innerHTML = `Email tidak terdaftar. <a href="https://forms.gle/LINK_FORM_ANDA" target="_blank">Daftar akses →</a>`;
      return;
    }
    sessionStorage.setItem('_u', email);
    App.data = await App.fetchTools();
    App.renderDashboard(email);
  },

  // ── DASHBOARD ────────────────────────────────────────────────────
  renderDashboard(email) {
    const cats  = App.data.categories;
    const total = cats.reduce((s, c) => s + c.tools.length, 0);
    R.innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <div class="sb-top">
            <div class="sb-brand">
              <div class="sb-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div>
                <div class="sb-name">AI Tools Studio</div>
                <div class="sb-total">${total} tools tersedia</div>
              </div>
            </div>
            <div class="sb-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="search-input" placeholder="Cari tool..." oninput="App.doSearch(this.value)">
            </div>
          </div>
          <nav class="sb-nav">
            <div class="nav-section-label">Kategori</div>
            <button class="nav-btn active" data-cat="all" onclick="App.selectCat('all',this)">
              <span class="nav-ic">⊞</span>
              <span class="nav-lb">Semua Tools</span>
              <span class="nav-ct">${total}</span>
            </button>
            ${cats.map(c => `
              <button class="nav-btn" data-cat="${c.id}" onclick="App.selectCat('${c.id}',this)">
                <span class="nav-ic">${c.icon}</span>
                <span class="nav-lb">${c.label}</span>
                <span class="nav-ct">${c.tools.length}</span>
              </button>`).join('')}
          </nav>
          <div class="sb-footer">
            <div class="sb-user">
              <div class="sb-av">${email[0].toUpperCase()}</div>
              <div class="sb-em" title="${email}">${email}</div>
            </div>
            <button class="btn-logout" onclick="App.logout()" title="Keluar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        <div class="main" id="main">
          <header class="main-head">
            <button class="btn-tog" onclick="App.toggleSb()" title="Toggle sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div class="main-head-info">
              <h2 id="head-title">Semua Tools</h2>
              <span id="head-count" class="head-count">${total} tools</span>
            </div>
          </header>
          <div class="content" id="content">
            <div class="grid" id="grid"></div>
            <div class="panel hidden" id="panel"></div>
          </div>
        </div>
      </div>`;

    App.renderGrid();
  },

  // ── GRID ─────────────────────────────────────────────────────────
  renderGrid() {
    const grid  = document.getElementById('grid');
    const panel = document.getElementById('panel');
    if (panel) panel.classList.add('hidden');
    if (grid) grid.classList.remove('hidden');
    grid.innerHTML = '';

    const cat    = App.cat;
    const search = App.search.toLowerCase();
    let count    = 0;

    App.data.categories.forEach(c => {
      if (cat !== 'all' && c.id !== cat) return;
      c.tools.forEach(t => {
        if (search && !t.name.toLowerCase().includes(search) && !t.description.toLowerCase().includes(search)) return;
        count++;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-top">
            <span class="card-cat-badge">${c.icon} ${c.label}</span>
            <span class="card-type badge-${t.outputType}">${badgeIcon(t.outputType)}</span>
          </div>
          <h3 class="card-title">${t.name}</h3>
          <p class="card-desc">${t.description}</p>
          <button class="card-btn" onclick="App.openTool('${t.id}')">
            Gunakan Tool
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>`;
        grid.appendChild(card);
      });
    });

    if (!count) {
      grid.innerHTML = `<div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>Tidak ada tool ditemukan</p>
        <span>Coba kata kunci yang berbeda</span>
      </div>`;
    }
  },

  openTool(id) {
    const tool = App.data.categories.flatMap(c => c.tools).find(t => t.id === id);
    if (!tool) return;
    const grid  = document.getElementById('grid');
    const panel = document.getElementById('panel');
    grid.classList.add('hidden');
    panel.classList.remove('hidden');
    panel.innerHTML = '';
    panel.appendChild(renderTool(tool));
    panel.scrollIntoView({ behavior: 'smooth' });
  },

  closePanel() {
    document.getElementById('panel').classList.add('hidden');
    document.getElementById('grid').classList.remove('hidden');
    App.renderGrid();
  },

  selectCat(id, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    App.cat    = id;
    App.search = '';
    document.getElementById('search-input').value = '';
    const cat   = App.data.categories.find(c => c.id === id);
    const count = id === 'all'
      ? App.data.categories.reduce((s, c) => s + c.tools.length, 0)
      : (cat?.tools.length || 0);
    document.getElementById('head-title').textContent = id === 'all' ? 'Semua Tools' : (cat?.label || '');
    document.getElementById('head-count').textContent = `${count} tools`;
    App.renderGrid();
  },

  doSearch(val) {
    App.search = val;
    App.renderGrid();
  },

  toggleSb() { document.getElementById('sidebar').classList.toggle('collapsed'); },

  logout() {
    sessionStorage.clear();
    App.data = null;
    App.renderLogin();
  }
};

function badgeIcon(t) {
  return { text: '📝 Text', image: '🖼️ Image', image_text: '🖼️+📝', sound: '🔊 Audio' }[t] || t;
}

function injectCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const el = document.createElement('link');
  el.rel = 'stylesheet'; el.href = href;
  document.head.appendChild(el);
}

function loadJS(src) {
  return new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const el = document.createElement('script');
    el.src = src;
    el.onload = ok;
    el.onerror = () => fail(new Error('Gagal load: ' + src));
    document.head.appendChild(el);
  });
}

App.init();
