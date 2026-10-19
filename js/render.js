// Turns resume data into ATS-friendly HTML (single column, real text, no tables/icons)
// and into a plain-text version for pasting into job portals.
window.ResumeRender = (function () {
  'use strict';

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  // **bold** is the only inline formatting supported.
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const plain = (s) => String(s || '').replace(/\*\*(.+?)\*\*/g, '$1');
  const nonEmpty = (a) => (a || []).map((x) => String(x).trim()).filter(Boolean);
  const SEP = '<span class="r-sep"> | </span>';

  function href(text) {
    const t = text.trim();
    if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
    if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(t)) return 'mailto:' + t;
    return 'https://' + t;
  }
  const displayLink = (t) => t.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

  function contactParts(b) {
    const parts = [];
    if (b.location.trim()) parts.push({ text: b.location.trim() });
    if (b.email.trim()) parts.push({ text: b.email.trim(), href: 'mailto:' + b.email.trim() });
    if (b.phone.trim()) parts.push({ text: b.phone.trim(), href: 'tel:' + b.phone.replace(/[^\d+]/g, '') });
    b.links.forEach((l) => {
      if (l.text.trim()) parts.push({ text: displayLink(l.text), href: href(l.text) });
    });
    return parts;
  }

  const skillRows = (s) => s.items.filter((r) => r.label.trim() || r.value.trim());
  const entryItems = (s) => s.items.filter((it) => it.title.trim() || it.subtitle.trim() || nonEmpty(it.bullets).length);
  const cleanLabel = (l) => l.trim().replace(/:$/, '');

  function isEmpty(s) {
    if (s.type === 'text') return !s.text.trim();
    if (s.type === 'list') return !nonEmpty(s.items).length;
    if (s.type === 'skills') return !skillRows(s).length;
    if (s.type === 'entries') return !entryItems(s).length;
    return true;
  }

  const li = (t) => `<li>${inline(t)}</li>`;

  function sectionBody(s, settings) {
    if (s.type === 'text') {
      return '<div class="r-text">' + s.text.trim().split(/\n\s*\n/)
        .map((p) => `<p>${inline(p.trim()).replace(/\n/g, '<br>')}</p>`).join('') + '</div>';
    }
    if (s.type === 'list') {
      return `<ul class="r-bullets r-list">${nonEmpty(s.items).map(li).join('')}</ul>`;
    }
    if (s.type === 'skills') {
      const rows = skillRows(s);
      if (settings.skillsLayout === 'inline') {
        return '<div class="r-skills-inline">' + rows.map((r) =>
          `<div>${r.label.trim() ? `<span class="r-skill-label">${esc(cleanLabel(r.label))}:</span> ` : ''}${inline(r.value)}</div>`
        ).join('') + '</div>';
      }
      return '<div class="r-skills">' + rows.map((r) =>
        `<div class="r-skill-label">${r.label.trim() ? esc(cleanLabel(r.label)) + ':' : ''}</div><div class="r-skill-value">${inline(r.value)}</div>`
      ).join('') + '</div>';
    }
    // entries: experience / projects / education / custom
    return entryItems(s).map((it) => {
      const bullets = nonEmpty(it.bullets);
      let head = '<div class="r-entry-head"><div class="r-entry-title">';
      if (it.title.trim()) head += `<strong>${esc(it.title.trim())}</strong>`;
      if (it.subtitle.trim()) head += (it.title.trim() ? SEP : '') + `<span class="r-entry-sub">${inline(it.subtitle.trim())}</span>`;
      head += '</div>' + (it.date.trim() ? `<div class="r-date">${esc(it.date.trim())}</div>` : '') + '</div>';
      const note = nonEmpty(it.note.split('\n'));
      if (note.length) head += `<div class="r-note">${note.map(inline).join('<br>')}</div>`;
      // Keep the entry header together with its first bullet across page breaks.
      const first = bullets.length ? `<ul class="r-bullets">${li(bullets[0])}</ul>` : '';
      const rest = bullets.length > 1 ? `<ul class="r-bullets r-cont">${bullets.slice(1).map(li).join('')}</ul>` : '';
      return `<div class="r-entry"><div class="r-keep">${head}${first}</div>${rest}</div>`;
    }).join('');
  }

  function render(data) {
    const b = data.basics;
    let h = '<header class="r-header">';
    if (b.name.trim()) h += `<h1 class="r-name">${esc(b.name.trim())}</h1>`;
    if (b.title.trim()) h += `<div class="r-title">${esc(b.title.trim())}</div>`;
    const cp = contactParts(b);
    if (cp.length) {
      h += '<div class="r-contact">' + cp.map((p) => p.href
        ? `<a href="${esc(p.href)}">${esc(p.text)}</a>`
        : `<span>${esc(p.text)}</span>`).join(SEP) + '</div>';
    }
    h += '</header>';
    for (const s of data.sections) {
      if (!s.visible || isEmpty(s)) continue;
      h += `<section class="r-section"><h2 class="r-heading">${esc(s.title)}</h2>${sectionBody(s, data.settings)}</section>`;
    }
    return h;
  }

  function toPlainText(data) {
    const b = data.basics;
    const out = [];
    if (b.name.trim()) out.push(b.name.trim());
    if (b.title.trim()) out.push(b.title.trim());
    const cp = contactParts(b).map((p) => p.text);
    if (cp.length) out.push(cp.join(' | '));
    for (const s of data.sections) {
      if (!s.visible || isEmpty(s)) continue;
      out.push('', s.title.trim().toUpperCase());
      if (s.type === 'text') out.push(plain(s.text.trim()));
      else if (s.type === 'list') nonEmpty(s.items).forEach((x) => out.push('• ' + plain(x)));
      else if (s.type === 'skills') {
        skillRows(s).forEach((r) => out.push((r.label.trim() ? cleanLabel(r.label) + ': ' : '') + plain(r.value.trim())));
      } else {
        entryItems(s).forEach((it, k) => {
          if (k) out.push('');
          out.push([it.title, plain(it.subtitle), it.date].map((x) => x.trim()).filter(Boolean).join(' | '));
          nonEmpty(it.note.split('\n')).forEach((n) => out.push(plain(n)));
          nonEmpty(it.bullets).forEach((x) => out.push('• ' + plain(x)));
        });
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
  }

  return { render, toPlainText, isEmpty, nonEmpty, esc };
})();
