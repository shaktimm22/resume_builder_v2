(function () {
  'use strict';
  const R = window.ResumeRender;
  const esc = R.esc;

  const STORE_KEY = 'resumeBuilder.v2.data';
  const JD_KEY = 'resumeBuilder.v2.jd';
  const PX_PER_MM = 96 / 25.4;
  const PAGE_SIZES = { A4: { w: 210, h: 297 }, Letter: { w: 215.9, h: 279.4 } };
  const FONTS = {
    Inter: "'Inter', 'Segoe UI', Arial, sans-serif",
    Arial: 'Arial, Helvetica, sans-serif',
    Calibri: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif",
    Georgia: "Georgia, 'Times New Roman', serif",
    'Times New Roman': "'Times New Roman', Times, serif"
  };
  const DEFAULT_SETTINGS = {
    pageSize: 'A4', font: 'Inter', fontSize: 9.75, lineHeight: 1.55,
    marginX: 15, marginY: 14, accent: '#1c2b45', skillsLayout: 'columns'
  };
  const ACCENTS = ['#1c2b45', '#000000', '#1f3d7a', '#0f4c5c', '#3b3b58', '#5a1e2e'];

  const SECTION_PRESETS = {
    summary: { label: 'Summary', type: 'text', title: 'Summary' },
    skills: { label: 'Skills', type: 'skills', title: 'Skills' },
    experience: { label: 'Experience', type: 'entries', kind: 'experience', title: 'Professional Experience' },
    projects: { label: 'Projects', type: 'entries', kind: 'project', title: 'Projects' },
    education: { label: 'Education', type: 'entries', kind: 'education', title: 'Education' },
    internships: { label: 'Internships', type: 'entries', kind: 'experience', title: 'Internships' },
    certifications: { label: 'Certifications', type: 'list', title: 'Certifications' },
    achievements: { label: 'Achievements', type: 'list', title: 'Achievements' },
    languages: { label: 'Languages', type: 'list', title: 'Languages' },
    custom_entries: { label: 'Custom — entries with bullets', type: 'entries', kind: 'generic', title: 'Custom Section' },
    custom_list: { label: 'Custom — bullet list', type: 'list', title: 'Custom Section' },
    custom_text: { label: 'Custom — paragraph', type: 'text', title: 'Custom Section' }
  };

  const KIND_LABELS = {
    experience: { noun: 'job', title: 'Job title', titlePh: 'Data Analyst', subtitle: 'Company', subtitlePh: 'Company name', date: 'Dates', datePh: 'Feb 2023 – Present', note: 'Extra line (optional)', notePh: 'e.g. Bengaluru, India' },
    project: { noun: 'project', title: 'Project name', titlePh: 'Customer Churn Analysis', subtitle: 'Tech stack', subtitlePh: 'Python, SQL, Power BI', date: 'Date (optional)', datePh: '2024', note: 'Extra line (optional)', notePh: 'e.g. github.com/you/project' },
    education: { noun: 'degree', title: 'Degree, Field', titlePh: 'Bachelor of Science, Statistics', subtitle: 'Institution, Location', subtitlePh: 'Institute name, City, State', date: 'Dates', datePh: 'Jun 2018 – Jul 2022', note: 'Details (one per line)', notePh: 'CGPA: 8.8' },
    generic: { noun: 'entry', title: 'Title', titlePh: '', subtitle: 'Subtitle', subtitlePh: '', date: 'Date', datePh: '', note: 'Extra line (optional)', notePh: '' }
  };
  const TYPE_TAG = { text: 'Paragraph', skills: 'Skills', list: 'Bullet list' };
  const KIND_TAG = { experience: 'Experience', project: 'Projects', education: 'Education', generic: 'Entries' };

  // ---------- utils ----------
  const $ = (s) => document.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const str = (v) => (v == null ? '' : String(v));
  const arr = (v) => (Array.isArray(v) ? v : []);
  const round2 = (n) => Math.round(n * 100) / 100;

  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // ---------- data model ----------
  function blankEntry() {
    return { id: uid(), title: '', subtitle: '', date: '', note: '', bullets: [] };
  }

  function normSection(s) {
    if (!s || !['text', 'list', 'skills', 'entries'].includes(s.type)) return null;
    const sec = { id: s.id || uid(), type: s.type, title: str(s.title), visible: s.visible !== false };
    if (s.type === 'entries') sec.kind = KIND_LABELS[s.kind] ? s.kind : 'generic';
    if (s.type === 'text') sec.text = str(s.text);
    else if (s.type === 'list') sec.items = arr(s.items).map(str);
    else if (s.type === 'skills') sec.items = arr(s.items).map((it) => ({ id: it.id || uid(), label: str(it.label), value: str(it.value) }));
    else sec.items = arr(s.items).map((it) => ({
      id: it.id || uid(), title: str(it.title), subtitle: str(it.subtitle), date: str(it.date),
      note: str(it.note), bullets: arr(it.bullets).map(str)
    }));
    return sec;
  }

  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    const b = d.basics || {};
    const settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
    if (!PAGE_SIZES[settings.pageSize]) settings.pageSize = 'A4';
    if (!FONTS[settings.font]) settings.font = 'Inter';
    return {
      version: 1,
      settings,
      basics: {
        name: str(b.name), title: str(b.title), location: str(b.location), email: str(b.email), phone: str(b.phone),
        links: arr(b.links).map((l) => ({ id: (l && l.id) || uid(), text: str(typeof l === 'string' ? l : l && l.text) }))
      },
      sections: arr(d.sections).map(normSection).filter(Boolean)
    };
  }

  function newSection(key) {
    const p = SECTION_PRESETS[key];
    const s = { type: p.type, kind: p.kind, title: p.title, visible: true };
    if (p.type === 'text') s.text = '';
    if (p.type === 'list') s.items = [];
    if (p.type === 'skills') s.items = [{ label: '', value: '' }];
    if (p.type === 'entries') s.items = [blankEntry()];
    return normSection(s);
  }

  function blankResume() {
    return normalize({
      settings: clone(state.settings),
      basics: { links: [{ text: '' }] },
      sections: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'].map(newSection)
    });
  }

  function loadStored() {
    const raw = storeGet(STORE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // Strip ids for export so the JSON stays clean.
  function exportable() {
    const d = clone(state);
    d.basics.links.forEach((l) => delete l.id);
    d.sections.forEach((s) => {
      delete s.id;
      if (s.type === 'skills' || s.type === 'entries') s.items.forEach((it) => delete it.id);
    });
    return d;
  }

  // ---------- state ----------
  let state = normalize(loadStored() || clone(window.SAMPLE_RESUME));
  const ui = {
    tab: 'content',
    openSecs: new Set(state.sections.map((s) => s.id)),
    openItems: new Set(),
    zoom: 'fit',
    scale: 1,
    pages: 1,
    jd: storeGet(JD_KEY) || ''
  };

  const getPath = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), state);
  function setPath(path, val) {
    const ks = path.split('.');
    const last = ks.pop();
    ks.reduce((o, k) => o[k], state)[last] = val;
  }

  const save = debounce(() => storeSet(STORE_KEY, JSON.stringify(state)), 300);

  // ---------- form helpers ----------
  function iconBtn(act, attrs, title, sym, danger) {
    return `<button type="button" class="icon-btn${danger ? ' danger' : ''}" data-act="${act}" ${attrs} title="${title}" aria-label="${title}">${sym}</button>`;
  }
  function input(path, ph, cls) {
    return `<input type="text" class="${cls || ''}" data-bind="${path}" value="${esc(getPath(path))}" placeholder="${esc(ph || '')}">`;
  }
  function field(label, path, o = {}) {
    return `<label class="field${o.wide ? ' wide' : ''}"><span class="lbl">${esc(label)}</span>` +
      `<input type="${o.type || 'text'}" data-bind="${path}" value="${esc(getPath(path))}" placeholder="${esc(o.ph || '')}"></label>`;
  }
  function area(label, path, o = {}) {
    const v = getPath(path);
    const text = o.lines ? arr(v).join('\n') : str(v);
    return `<label class="field${o.wide === false ? '' : ' wide'}"><span class="lbl">${esc(label)}${o.hint ? `<em>${esc(o.hint)}</em>` : ''}</span>` +
      `<textarea ${o.lines ? 'data-bind-lines' : 'data-bind'}="${path}" rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}" spellcheck="true">${esc(text)}</textarea></label>`;
  }
  function select(label, path, options) {
    const v = getPath(path);
    return `<label class="field"><span class="lbl">${esc(label)}</span><select data-bind="${path}">` +
      options.map(([val, txt]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(txt)}</option>`).join('') +
      '</select></label>';
  }
  function range(label, path, min, max, step, unit) {
    const v = getPath(path);
    return `<label class="field"><span class="lbl">${esc(label)}<output>${v}${unit}</output></span>` +
      `<input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-bind-num="${path}" data-unit="${unit}"></label>`;
  }

  // ---------- Content tab ----------
  function renderContent() {
    const b = state.basics;
    let h = `<div class="card"><div class="card-head"><h3>Header &amp; contact</h3></div><div class="card-body grid2">
      ${field('Full name', 'basics.name', { ph: 'Your Name' })}
      ${field('Headline / target job title', 'basics.title', { ph: 'Data Analyst' })}
      ${field('Location', 'basics.location', { ph: 'City, State, Country' })}
      ${field('Email', 'basics.email', { ph: 'you@email.com', type: 'email' })}
      ${field('Phone', 'basics.phone', { ph: '+91 90000 00000' })}
      <div class="field wide"><span class="lbl">Links<em>shown as typed, e.g. linkedin.com/in/you</em></span>
        ${b.links.map((l, i) => `<div class="row">${input(`basics.links.${i}.text`, 'linkedin.com/in/you')}${iconBtn('link-up', `data-i="${i}"`, 'Move up', '↑')}${iconBtn('link-down', `data-i="${i}"`, 'Move down', '↓')}${iconBtn('link-del', `data-i="${i}"`, 'Remove', '✕', true)}</div>`).join('')}
        <div><button type="button" class="btn small ghost" data-act="link-add">+ Add link</button></div>
      </div></div></div>`;

    state.sections.forEach((s, i) => { h += sectionCard(s, i); });

    h += `<div class="add-sec"><select id="add-sec-type" aria-label="Section type">` +
      Object.entries(SECTION_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.label)}</option>`).join('') +
      `</select><button type="button" class="btn" data-act="sec-add">+ Add section</button></div>`;
    return h;
  }

  function sectionCard(s, i) {
    const open = ui.openSecs.has(s.id);
    const tag = s.type === 'entries' ? KIND_TAG[s.kind] : TYPE_TAG[s.type];
    const a = `data-i="${i}"`;
    return `<div class="card sec${open ? ' open' : ''}${s.visible ? '' : ' hidden-sec'}">
      <div class="card-head">
        ${iconBtn('sec-toggle', `data-id="${s.id}"`, open ? 'Collapse' : 'Expand', open ? '▾' : '▸')}
        <input type="text" class="sec-title-input" data-bind="sections.${i}.title" value="${esc(s.title)}" aria-label="Section heading">
        <span class="tag">${tag}</span>
        <label class="vis" title="Show this section in the resume"><input type="checkbox" data-bind-check="sections.${i}.visible"${s.visible ? ' checked' : ''}>Show</label>
        ${iconBtn('sec-up', a, 'Move section up', '↑')}${iconBtn('sec-down', a, 'Move section down', '↓')}${iconBtn('sec-del', a, 'Delete section', '✕', true)}
      </div>
      ${open ? `<div class="card-body">${sectionBody(s, i)}</div>` : ''}
    </div>`;
  }

  function sectionBody(s, i) {
    const p = `sections.${i}`;
    if (s.type === 'text') return area('Text', `${p}.text`, { rows: 5, hint: '30–80 words · **bold** supported' });
    if (s.type === 'list') return area('Items', `${p}.items`, { lines: true, rows: 3, hint: 'One per line' });
    if (s.type === 'skills') {
      return '<div class="skill-rows">' + s.items.map((it, j) => {
        const a = `data-i="${i}" data-j="${j}"`;
        return `<div class="row skill-row">${input(`${p}.items.${j}.label`, 'Category', 'w-label')}` +
          `<textarea data-bind="${p}.items.${j}.value" rows="1" placeholder="Skill, Skill, Skill">${esc(it.value)}</textarea>` +
          `${iconBtn('skill-up', a, 'Move up', '↑')}${iconBtn('skill-down', a, 'Move down', '↓')}${iconBtn('skill-del', a, 'Remove', '✕', true)}</div>`;
      }).join('') + `</div><button type="button" class="btn small ghost" data-act="skill-add" data-i="${i}">+ Add skill row</button>`;
    }
    const L = KIND_LABELS[s.kind] || KIND_LABELS.generic;
    return s.items.map((it, j) => entryCard(i, it, j, L)).join('') +
      `<button type="button" class="btn small ghost" data-act="item-add" data-i="${i}">+ Add ${L.noun}</button>`;
  }

  function entryCard(i, it, j, L) {
    const open = ui.openItems.has(it.id);
    const p = `sections.${i}.items.${j}`;
    const a = `data-i="${i}" data-j="${j}"`;
    return `<div class="item${open ? ' open' : ''}">
      <div class="item-head" data-act="item-toggle" data-id="${it.id}">
        <span class="caret">${open ? '▾' : '▸'}</span>
        <span class="item-title">${esc(it.title || '(untitled)')}</span>
        <span class="item-meta">${esc(it.date || it.subtitle)}</span>
        <span class="tools">${iconBtn('item-up', a, 'Move up', '↑')}${iconBtn('item-down', a, 'Move down', '↓')}${iconBtn('item-dup', a, 'Duplicate', '⧉')}${iconBtn('item-del', a, 'Delete', '✕', true)}</span>
      </div>
      ${open ? `<div class="item-body grid2">
        ${field(L.title, `${p}.title`, { ph: L.titlePh })}
        ${field(L.subtitle, `${p}.subtitle`, { ph: L.subtitlePh })}
        ${field(L.date, `${p}.date`, { ph: L.datePh })}
        ${area(L.note, `${p}.note`, { rows: 1, ph: L.notePh, wide: false })}
        ${area('Bullet points', `${p}.bullets`, { lines: true, rows: 4, hint: 'One per line · action verb + result + number' })}
      </div>` : ''}
    </div>`;
  }

  // ---------- Design tab ----------
  function renderDesign() {
    const s = state.settings;
    return `<div class="card"><div class="card-head"><h3>Layout &amp; typography</h3></div><div class="card-body grid2">
      ${select('Page size', 'settings.pageSize', [['A4', 'A4 (210 × 297 mm)'], ['Letter', 'US Letter (8.5 × 11 in)']])}
      ${select('Font', 'settings.font', Object.keys(FONTS).map((f) => [f, f]))}
      ${range('Font size', 'settings.fontSize', 9, 11.5, 0.25, 'pt')}
      ${range('Line spacing', 'settings.lineHeight', 1.2, 1.8, 0.05, '')}
      ${range('Side margins', 'settings.marginX', 8, 25, 1, 'mm')}
      ${range('Top / bottom margins', 'settings.marginY', 8, 25, 1, 'mm')}
      ${select('Skills layout', 'settings.skillsLayout', [['columns', 'Two columns (as sample)'], ['inline', 'Inline — Category: skills']])}
      <div class="field"><span class="lbl">Accent colour</span><div class="swatches">
        ${ACCENTS.map((c) => `<button type="button" class="swatch${c === s.accent ? ' on' : ''}" style="background:${c}" data-act="accent" data-color="${c}" title="${c}" aria-label="Accent ${c}"></button>`).join('')}
        <input type="color" data-bind="settings.accent" value="${esc(s.accent)}" aria-label="Custom accent colour">
      </div></div>
    </div></div>
    <div class="card"><div class="card-head"><h3>Fit to pages</h3></div><div class="card-body">
      <p class="muted">Currently <b id="fit-pages">≈ ${ui.pages} page${ui.pages > 1 ? 's' : ''}</b>. Shrinks spacing, then font size, then margins until it fits.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="fit" data-n="1">Fit to 1 page</button>
        <button type="button" class="btn" data-act="fit" data-n="2">Fit to 2 pages</button>
        <button type="button" class="btn" data-act="design-reset">Reset design</button>
      </div>
    </div></div>
    <div class="card"><div class="card-head"><h3>Why this layout is ATS-safe</h3></div><div class="card-body">
      <ul class="tips">
        <li>Single column, real selectable text — no tables, text boxes, images or icons.</li>
        <li>Standard section headings (Summary, Skills, Experience…) that parsers recognise.</li>
        <li>Contact details in the body, not in the page header/footer.</li>
        <li>PDF is generated by the browser with embedded fonts, so every word stays searchable.</li>
      </ul>
    </div></div>`;
  }

  // ---------- ATS tab ----------
  function renderAtsTab() {
    return `<div class="card"><div class="card-head"><h3>Job description match</h3></div><div class="card-body">
      <label class="field wide"><span class="lbl">Paste the job posting<em>keywords are matched against your resume</em></span>
      <textarea id="jd" rows="6" placeholder="Paste the full job description here…">${esc(ui.jd)}</textarea></label>
    </div></div><div id="ats-results"></div>`;
  }

  const LEVEL = {
    error: { label: 'Must fix', cls: 'err' },
    warn: { label: 'Should fix', cls: 'warn' },
    info: { label: 'Suggestions', cls: 'info' },
    ok: { label: 'Passed', cls: 'ok' }
  };
  const scoreColor = (n) => (n >= 85 ? 'var(--ok)' : n >= 65 ? 'var(--warn)' : 'var(--danger)');

  function updateAts() {
    const res = window.ATS.analyze(state, ui.jd, ui.pages);
    const badge = $('#ats-badge');
    badge.textContent = res.score;
    badge.style.background = scoreColor(res.score);

    const box = $('#ats-results');
    if (!box) return;
    let h = `<div class="card"><div class="card-body score-card">
      <div class="score-ring" style="--p:${res.score};--c:${scoreColor(res.score)}"><span>${res.score}</span></div>
      <div><b>ATS readiness</b><p class="muted">Format &amp; content checks · ${res.words} words · ≈ ${ui.pages} page${ui.pages > 1 ? 's' : ''}</p></div>`;
    if (res.kw) {
      h += `<div class="score-ring" style="--p:${res.kw.pct};--c:${scoreColor(res.kw.pct)}"><span>${res.kw.pct}%</span></div>
        <div><b>Keyword match</b><p class="muted">Weighted by frequency in the job post</p></div>`;
    }
    h += '</div></div>';

    if (res.kw) {
      const miss = res.kw.list.filter((x) => !x.found);
      const hit = res.kw.list.filter((x) => x.found);
      h += `<div class="card"><div class="card-head"><h3>Keywords</h3></div><div class="card-body">
        <p class="lbl">Missing (${miss.length})<em>add only what you genuinely have — in Skills or a bullet</em></p>
        <div class="chips">${miss.map((x) => `<span class="chip miss" title="Appears ${x.c}× in job post">${esc(x.d)}${x.c > 1 ? ` <i>${x.c}</i>` : ''}</span>`).join('') || '<span class="muted">None — great match.</span>'}</div>
        <p class="lbl">Found (${hit.length})</p>
        <div class="chips">${hit.map((x) => `<span class="chip hit">${esc(x.d)}</span>`).join('') || '<span class="muted">—</span>'}</div>
      </div></div>`;
    }

    h += '<div class="card"><div class="card-head"><h3>Checks</h3></div><div class="card-body">';
    for (const lvl of ['error', 'warn', 'info', 'ok']) {
      const items = res.checks.filter((c) => c.level === lvl);
      if (!items.length) continue;
      const list = items.map((c) => `<div class="check ${LEVEL[lvl].cls}"><span class="dot"></span><div>${esc(c.msg)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</div></div>`).join('');
      h += lvl === 'ok'
        ? `<details class="check-group"><summary>${LEVEL[lvl].label} (${items.length})</summary>${list}</details>`
        : `<div class="check-group"><div class="group-title">${LEVEL[lvl].label} (${items.length})</div>${list}</div>`;
    }
    h += '</div></div>';
    box.innerHTML = h;
  }
  const scheduleAts = debounce(updateAts, 250);

  // ---------- panel ----------
  const panel = $('#panel-body');

  function autoGrow(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }

  function renderPanel() {
    const scroll = panel.scrollTop;
    panel.innerHTML = ui.tab === 'design' ? renderDesign() : ui.tab === 'ats' ? renderAtsTab() : renderContent();
    panel.querySelectorAll('textarea').forEach(autoGrow);
    panel.scrollTop = scroll;
    document.querySelectorAll('.tabs [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
    if (ui.tab === 'ats') updateAts();
  }

  const cleanLine = (l) => l.replace(/^\s*(?:[-*•▪◦·]|\d+[.)])\s+/, '').trim();

  panel.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'jd') {
      ui.jd = t.value;
      storeSet(JD_KEY, t.value);
      autoGrow(t);
      scheduleAts();
      return;
    }
    if (t.tagName === 'TEXTAREA') autoGrow(t);
    const d = t.dataset;
    let path;
    if ((path = d.bind) != null) setPath(path, t.value);
    else if ((path = d.bindLines) != null) setPath(path, t.value.split('\n').map(cleanLine).filter(Boolean));
    else if ((path = d.bindNum) != null) {
      setPath(path, parseFloat(t.value));
      const out = t.closest('.field').querySelector('output');
      if (out) out.textContent = t.value + d.unit;
    } else if ((path = d.bindCheck) != null) {
      setPath(path, t.checked);
      t.closest('.card').classList.toggle('hidden-sec', !t.checked);
    } else return;

    const item = t.closest('.item');
    if (item && /\.(title|date|subtitle)$/.test(path)) {
      const it = getPath(path.replace(/\.\w+$/, ''));
      item.querySelector('.item-title').textContent = it.title || '(untitled)';
      item.querySelector('.item-meta').textContent = it.date || it.subtitle;
    }
    if (path === 'settings.accent') panel.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('on', s.dataset.color === t.value));
    changed();
  });

  function move(list, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }
  function toggle(set, id) { if (set.has(id)) set.delete(id); else set.add(id); }

  panel.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const i = +el.dataset.i, j = +el.dataset.j;
    const secs = state.sections;
    const links = state.basics.links;
    switch (act) {
      case 'sec-toggle': toggle(ui.openSecs, el.dataset.id); break;
      case 'sec-up': move(secs, i, -1); break;
      case 'sec-down': move(secs, i, 1); break;
      case 'sec-del':
        if (!confirm(`Delete the "${secs[i].title}" section?`)) return;
        secs.splice(i, 1);
        break;
      case 'sec-add': {
        const s = newSection($('#add-sec-type').value);
        secs.push(s);
        ui.openSecs.add(s.id);
        if (s.type === 'entries') ui.openItems.add(s.items[0].id);
        break;
      }
      case 'item-toggle': toggle(ui.openItems, el.dataset.id); break;
      case 'item-add': {
        const it = blankEntry();
        secs[i].items.push(it);
        ui.openItems.add(it.id);
        break;
      }
      case 'item-up': move(secs[i].items, j, -1); break;
      case 'item-down': move(secs[i].items, j, 1); break;
      case 'item-dup': {
        const c = clone(secs[i].items[j]);
        c.id = uid();
        secs[i].items.splice(j + 1, 0, c);
        ui.openItems.add(c.id);
        break;
      }
      case 'item-del':
        if (!confirm(`Delete "${secs[i].items[j].title || 'this entry'}"?`)) return;
        secs[i].items.splice(j, 1);
        break;
      case 'skill-add': secs[i].items.push({ id: uid(), label: '', value: '' }); break;
      case 'skill-up': move(secs[i].items, j, -1); break;
      case 'skill-down': move(secs[i].items, j, 1); break;
      case 'skill-del': secs[i].items.splice(j, 1); break;
      case 'link-add': links.push({ id: uid(), text: '' }); break;
      case 'link-up': move(links, i, -1); break;
      case 'link-down': move(links, i, 1); break;
      case 'link-del': links.splice(i, 1); break;
      case 'accent': state.settings.accent = el.dataset.color; break;
      case 'design-reset': state.settings = Object.assign({}, DEFAULT_SETTINGS); break;
      case 'fit': fitToPages(+el.dataset.n); break;
      default: return;
    }
    e.preventDefault();
    e.stopPropagation();
    changed();
    renderPanel();
  });

  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    ui.tab = b.dataset.tab;
    panel.scrollTop = 0;
    renderPanel();
  });

  // ---------- preview ----------
  const sheet = $('#sheet'), wrap = $('#sheet-wrap'), scrollBox = $('#preview-scroll');
  const printRoot = $('#print-root'), pageStyle = $('#page-style');

  function renderPreviewNow() {
    const s = state.settings;
    const ps = PAGE_SIZES[s.pageSize];
    const vars = `--fs:${s.fontSize}pt;--lh:${s.lineHeight};--accent:${s.accent};--font:${FONTS[s.font]}`;
    const html = `<div class="resume" style="${esc(vars)}">${R.render(state)}</div>`;

    sheet.style.width = ps.w + 'mm';
    sheet.style.padding = `${s.marginY}mm ${s.marginX}mm`;
    sheet.innerHTML = html;
    printRoot.innerHTML = html;
    pageStyle.textContent = `@page { size: ${s.pageSize === 'Letter' ? 'letter' : 'A4'}; margin: ${s.marginY}mm ${s.marginX}mm; }`;

    // Estimate page breaks: printable height per page = page height − top/bottom margins.
    const usable = ps.h - 2 * s.marginY;
    const contentMm = sheet.firstElementChild.offsetHeight / PX_PER_MM;
    ui.pages = Math.max(1, Math.ceil((contentMm - 0.5) / usable));
    let guides = '';
    for (let n = 1; n < ui.pages; n++) {
      guides += `<div class="page-guide" style="top:${s.marginY + n * usable}mm"><span>page ${n + 1}</span></div>`;
    }
    sheet.insertAdjacentHTML('beforeend', guides);
    sheet.style.minHeight = (2 * s.marginY + ui.pages * usable) + 'mm';
    const pagesText = `≈ ${ui.pages} page${ui.pages > 1 ? 's' : ''}`;
    $('#page-info').textContent = `${s.pageSize === 'Letter' ? 'US Letter' : 'A4'} · ${pagesText}`;
    const fit = $('#fit-pages');
    if (fit) fit.textContent = pagesText;
    applyZoom();
  }

  const renderPreview = debounce(() => { renderPreviewNow(); scheduleAts(); }, 30);

  function applyZoom() {
    const sw = sheet.offsetWidth, sh = sheet.offsetHeight;
    const avail = scrollBox.clientWidth - 48;
    const sc = ui.zoom === 'fit' ? Math.min(1.5, Math.max(0.3, avail / sw)) : ui.zoom;
    ui.scale = sc;
    sheet.style.transform = `scale(${sc})`;
    wrap.style.width = sw * sc + 'px';
    wrap.style.height = sh * sc + 'px';
    $('#zoom-label').textContent = Math.round(sc * 100) + '%';
  }

  document.querySelector('.zoom').addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (!b) return;
    const z = b.dataset.zoom;
    if (z === 'fit') ui.zoom = 'fit';
    else ui.zoom = Math.min(2, Math.max(0.3, round2(ui.scale + (z === 'in' ? 0.1 : -0.1))));
    applyZoom();
  });
  window.addEventListener('resize', debounce(() => {
    applyZoom();
    panel.querySelectorAll('textarea').forEach(autoGrow);
  }, 100));

  function fitToPages(n) {
    const s = state.settings;
    const before = Object.assign({}, s);
    renderPreviewNow();
    let guard = 80;
    while (ui.pages > n && guard--) {
      if (s.lineHeight > 1.36) s.lineHeight = round2(s.lineHeight - 0.05);
      else if (s.fontSize > 9.26) s.fontSize = round2(s.fontSize - 0.25);
      else if (s.marginY > 10) s.marginY -= 1;
      else if (s.marginX > 10) s.marginX -= 1;
      else break;
      renderPreviewNow();
    }
    if (ui.pages <= n) {
      toast(`Fits on ${n} page${n > 1 ? 's' : ''}.`);
    } else {
      Object.assign(s, before); // don't leave a cramped layout behind
      renderPreviewNow();
      toast(`Can't fit on ${n} page${n > 1 ? 's' : ''} without going too small — trim some content.`);
    }
  }

  function changed() {
    save();
    renderPreview();
  }

  // ---------- commands ----------
  const fileBase = () => ((state.basics.name || 'Resume').trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '') || 'Resume') + '_Resume';

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Plain-text resume copied — paste it into job portal forms.');
  }

  function printPdf() {
    renderPreviewNow();
    const old = document.title;
    document.title = fileBase(); // becomes the default PDF file name
    const restore = () => { document.title = old; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
  }

  function replaceState(next) {
    state = normalize(next);
    ui.openSecs = new Set(state.sections.map((s) => s.id));
    ui.openItems = new Set();
    save();
    renderPanel();
    renderPreviewNow();
    updateAts();
  }

  const fileInput = $('#file-input');
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.sections)) throw new Error('not a resume file');
      replaceState(data);
      toast(`Loaded ${f.name}`);
    } catch (e) {
      alert('Could not read that file: ' + e.message);
    }
  });

  document.querySelector('.actions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (!b) return;
    switch (b.dataset.cmd) {
      case 'pdf': printPdf(); break;
      case 'export': download(fileBase() + '.json', JSON.stringify(exportable(), null, 2), 'application/json'); break;
      case 'import': fileInput.click(); break;
      case 'copy-text': copyText(R.toPlainText(state)); break;
      case 'download-txt': download(fileBase() + '.txt', R.toPlainText(state), 'text/plain'); break;
      case 'blank':
        if (confirm('Start a blank resume? Your current content will be replaced (export JSON first to keep it).')) replaceState(blankResume());
        break;
      case 'sample':
        if (confirm('Load the sample resume? Your current content will be replaced (export JSON first to keep it).')) replaceState(clone(window.SAMPLE_RESUME));
        break;
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); printPdf(); }
  });
  window.addEventListener('beforeprint', renderPreviewNow);

  // ---------- boot ----------
  // builder.html?start=blank (from the welcome page) — don't silently wipe saved work.
  if (new URLSearchParams(location.search).get('start') === 'blank') {
    history.replaceState(null, '', location.pathname + location.hash);
    if (!storeGet(STORE_KEY) || confirm('Start a blank resume? Your saved resume in this browser will be replaced (Cancel keeps it).')) {
      state = blankResume();
      ui.openSecs = new Set(state.sections.map((s) => s.id));
      state.sections.forEach((s) => { if (s.type === 'entries') s.items.forEach((it) => ui.openItems.add(it.id)); });
      save();
    }
  }
  const hashTab = location.hash.slice(1);
  if (['content', 'design', 'ats'].includes(hashTab)) ui.tab = hashTab;
  renderPanel();
  renderPreviewNow();
  updateAts();
  // Re-measure once the web font arrives (text widths change).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      renderPreviewNow();
      updateAts();
      panel.querySelectorAll('textarea').forEach(autoGrow);
    });
  }
})();
