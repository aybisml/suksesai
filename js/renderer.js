// renderer.js — Dynamic form builder dari tools.json
// Tambah tool baru = cukup tambah entry JSON, tidak perlu ubah kode ini

function renderTool(tool) {
  const wrap = document.createElement('div');
  wrap.className = 'tool-wrap';
  wrap.innerHTML = `
    <div class="tool-header">
      <button class="btn-back" onclick="App.closePanel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Kembali
      </button>
      <div class="tool-meta">
        <span class="tool-badge badge-${tool.outputType}">${badgeLabel(tool.outputType)}</span>
        <h2 class="tool-title">${tool.name}</h2>
        <p class="tool-desc">${tool.description}</p>
      </div>
    </div>
    <div class="tool-body">
      <div class="form-section" id="form-${tool.id}"></div>
      <button class="btn-generate" id="btn-${tool.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Generate
      </button>
      <div class="output-section" id="out-${tool.id}"></div>
    </div>`;

  const formEl = wrap.querySelector(`#form-${tool.id}`);
  tool.inputs.forEach(inp => {
    const g = document.createElement('div');
    g.className = 'form-group';
    g.innerHTML = `<label class="form-label">${inp.label}${inp.required ? '<span class="required">*</span>' : ''}</label>${buildInput(inp)}`;
    formEl.appendChild(g);
  });

  wrap.querySelector(`#btn-${tool.id}`).onclick = () => doGenerate(tool, wrap);
  return wrap;
}

function buildInput(inp) {
  const id = `i_${inp.id}`;
  switch (inp.type) {
    case 'text':
      return `<input type="text" class="form-input" id="${id}" placeholder="${inp.label}" ${inp.required ? 'required' : ''}>`;
    case 'textarea':
      return `<textarea class="form-textarea" id="${id}" rows="3" placeholder="${inp.label}"></textarea>`;
    case 'select':
      const opts = (inp.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
      return `<select class="form-select" id="${id}">${opts}</select>`;
    case 'file':
      return `
        <div class="form-upload" onclick="document.getElementById('${id}').click()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Klik untuk upload</span>
          <input type="file" id="${id}" accept="${inp.accept||'*'}" style="display:none" onchange="handlePreview(this,'prev_${inp.id}')">
        </div>
        <div id="prev_${inp.id}" class="form-preview"></div>`;
    case 'range':
      return `
        <div class="form-range-wrap">
          <input type="range" class="form-range" id="${id}" min="${inp.min||1}" max="${inp.max||5}" value="${inp.default||1}"
            oninput="document.getElementById('val_${inp.id}').textContent=this.value">
          <div class="range-display">
            <span class="range-label">${inp.min||1}</span>
            <span class="range-value" id="val_${inp.id}">${inp.default||1}</span>
            <span class="range-label">${inp.max||5}</span>
          </div>
        </div>`;
    case 'number':
      return `<input type="number" class="form-input" id="${id}" min="${inp.min||1}" max="${inp.max||100}" value="${inp.default||''}">`;
    default:
      return `<input type="text" class="form-input" id="${id}" placeholder="${inp.label}">`;
  }
}

function handlePreview(el, prevId) {
  const prev = document.getElementById(prevId);
  if (!prev || !el.files[0]) return;
  if (el.files[0].type.startsWith('image/')) {
    prev.innerHTML = `<img src="${URL.createObjectURL(el.files[0])}" class="preview-img">`;
  } else {
    prev.innerHTML = `<div class="preview-file"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${el.files[0].name}</div>`;
  }
}

function getValues(tool) {
  const v = {};
  tool.inputs.forEach(inp => {
    const el = document.getElementById(`i_${inp.id}`);
    if (!el) return;
    v[inp.id] = inp.type === 'file' ? (el.files[0]?.name || '') : (el.value || '');
  });
  return v;
}

function buildPrompt(tool, vals) {
  return tool.promptTemplate.replace(/\{\{([\w-]+)\}\}/g, (_, k) => vals[k] || '');
}

function badgeLabel(t) {
  return { text: 'Text', image: 'Image', image_text: 'Text + Image', sound: 'Audio' }[t] || t;
}

// ── GENERATE ──────────────────────────────────────────────────────────
async function doGenerate(tool, wrap) {
  const btn = wrap.querySelector(`#btn-${tool.id}`);
  const out = wrap.querySelector(`#out-${tool.id}`);

  const missing = tool.inputs.filter(i => i.required && !document.getElementById(`i_${i.id}`)?.value).map(i => i.label);
  if (missing.length) {
    showError(out, `Field wajib belum diisi: ${missing.join(', ')}`);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generating...`;
  showLoading(out);

  try {
    const vals   = getValues(tool);
    const prompt = buildPrompt(tool, vals);
    const count  = parseInt(vals['jumlah'] || '1');

    if (tool.outputType === 'text' || tool.outputType === 'sound') {
      const result = await aiText(prompt);
      showText(out, result);
    } else if (tool.outputType === 'image') {
      const urls = await aiImage(prompt, count);
      showImages(out, urls);
    } else if (tool.outputType === 'image_text') {
      const [txt, imgs] = await Promise.all([aiText(prompt), aiImage(prompt, count)]);
      out.innerHTML = '';
      showText(out, txt, false);
      showImages(out, imgs, true);
    }
  } catch (e) {
    showError(out, e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate`;
  }
}

// ── OUTPUT RENDERERS ──────────────────────────────────────────────────
function showLoading(el) {
  el.innerHTML = `<div class="output-loading">
    <div class="loading-dots"><span></span><span></span><span></span></div>
    <p>AI sedang memproses...</p>
  </div>`;
}

function showError(el, msg) {
  el.innerHTML = `<div class="output-error">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ${msg}
  </div>`;
}

function showText(el, text, append = false) {
  if (!append) el.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'output-box output-appear';
  box.innerHTML = `
    <div class="output-toolbar">
      <span class="output-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        Hasil
      </span>
      <button class="btn-copy" onclick="copyText(this, \`${esc(text)}\`)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy
      </button>
    </div>
    <div class="output-text">${mdToHtml(text)}</div>`;
  el.appendChild(box);
}

function showImages(el, urls, append = false) {
  if (!append) el.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'output-box output-appear';
  const grid = urls.map((url, i) => `
    <div class="img-card">
      <img src="${url}" alt="Hasil ${i+1}" onclick="openImgFull('${url}')">
      <button class="btn-dl" onclick="dlImg('${url}','hasil-${i+1}.png')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
    </div>`).join('');
  box.innerHTML = `
    <div class="output-toolbar">
      <span class="output-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        ${urls.length} Gambar
      </span>
    </div>
    <div class="img-grid">${grid}</div>`;
  el.appendChild(box);
}

function copyText(btn, text) {
  const decoded = text.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#96;/g,'`');
  navigator.clipboard.writeText(decoded).then(() => {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Tersalin!`;
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
      btn.classList.remove('copied');
    }, 2000);
  });
}

function dlImg(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

function openImgFull(url) {
  const w = window.open('', '_blank');
  w.document.write(`<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain"></body></html>`);
}

function mdToHtml(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^### (.+)$/gm,'<h4>$1</h4>')
    .replace(/^## (.+)$/gm,'<h3>$1</h3>')
    .replace(/^# (.+)$/gm,'<h2>$1</h2>')
    .replace(/^[-•] (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');
}
