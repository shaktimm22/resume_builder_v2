// ATS checks: formatting/content lint + job-description keyword match.
window.ATS = (function () {
  'use strict';
  const R = window.ResumeRender;

  const STOP = new Set(`
    a about above after again against all also am an and any are as at be because been before being below between both but by
    can could did do does doing down during each etc few for from further had has have having he her here hers him his how i if
    in into is it its itself just let may me more most must my no nor not now of off on once only or other our ours out over own
    per same shall she should so some such than that the their them then there these they this those through to too under until
    up upon us very via was we were what when where which while who whom why will with within without would you your yours
    and/or e.g i.e ll re ve
    ability able across additional apply applicant applicants benefits best candidate candidates company related role roles
    position positions job jobs looking join team teams work working works experience experiences experienced year years plus
    strong good excellent great preferred required requirement requirements require requires responsibilities responsibility
    responsible including include includes knowledge understanding skill skills familiarity familiar proficiency proficient
    using use used new well help ensure opportunity environment level minimum degree equivalent relevant demonstrated proven
    least one two three four five ideal day days time full part based like make makes making ideally qualifications qualification
    desired desirable hands-on hands closely key across various multiple other others within world-class growing fast-paced
    salary location remote hybrid office employment equal opportunity employer description about-us mission we're you'll
    seeking seek want wants need needs needed able must-have nice-to-have bonus get take etc. who's what's
  `.split(/\s+/).filter(Boolean));

  const STANDARD = new Set([
    'summary', 'professional summary', 'profile', 'professional profile', 'career summary', 'objective', 'career objective',
    'skills', 'technical skills', 'core competencies', 'key skills', 'core skills', 'technical expertise',
    'experience', 'professional experience', 'work experience', 'employment history', 'work history', 'relevant experience',
    'projects', 'key projects', 'academic projects', 'personal projects', 'education', 'academic background',
    'certifications', 'certificates', 'licenses & certifications', 'licenses and certifications', 'certifications & training',
    'achievements', 'awards', 'honors & awards', 'honors and awards', 'accomplishments', 'publications', 'patents',
    'languages', 'volunteer experience', 'volunteering', 'interests', 'training', 'courses', 'coursework', 'relevant coursework',
    'leadership', 'activities', 'extracurricular activities', 'research', 'research experience', 'internships', 'internship'
  ]);

  const WEAK = ['responsible for', 'worked on', 'working on', 'helped', 'helping', 'assisted', 'involved in',
    'participated in', 'tasked with', 'duties included', 'in charge of', 'was', 'were', 'did'];

  const wc = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

  function dateFormat(p) {
    p = p.trim().replace(/\.$/, '');
    if (!p || /^(present|current|now|ongoing|till date|to date)$/i.test(p)) return null;
    if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\.? \d{4}$/i.test(p)) return 'Mon YYYY';
    if (/^(january|february|march|april|may|june|july|august|september|october|november|december) \d{4}$/i.test(p)) return 'Month YYYY';
    if (/^\d{1,2}\/\d{4}$/.test(p)) return 'MM/YYYY';
    if (/^\d{1,2}\/\d{2}$/.test(p)) return 'MM/YY';
    if (/^\d{4}$/.test(p)) return 'YYYY';
    return '"' + p + '"';
  }

  // ---------- keywords ----------
  function tokenize(text) {
    return (text.match(/[A-Za-z0-9][A-Za-z0-9+#./&-]*/g) || [])
      .map((t) => t.replace(/[./&-]+$/, ''))
      .filter(Boolean);
  }
  function keepToken(t) {
    const l = t.toLowerCase();
    const acronym = t.length >= 2 && /^[A-Z0-9]+$/.test(t) && /[A-Z]/.test(t); // CAN, IT, AWS
    if (STOP.has(l) && !acronym) return false;
    if (/^\d+([.,]\d+)?\+?%?$/.test(t)) return false;
    if (t.length < 2) return t === 'C' || t === 'R';
    return true;
  }

  function extractKeywords(jd) {
    const text = jd.replace(/['’]\w*/g, '');
    const uni = new Map(), bi = new Map(), disp = new Map(), lowerSeen = new Set();
    const chunks = text.split(/[,;:()[\]\n•·|!?]|\.\s|\s[-–—]\s/);
    for (const ch of chunks) {
      let prev = null;
      for (const t of tokenize(ch)) {
        if (!keepToken(t)) { prev = null; continue; }
        const l = t.toLowerCase();
        if (t === l) lowerSeen.add(l);
        uni.set(l, (uni.get(l) || 0) + 1);
        if (!disp.has(l) || /[A-Z]/.test(t)) disp.set(l, t);
        if (prev) {
          const k = prev.l + ' ' + l;
          bi.set(k, (bi.get(k) || 0) + 1);
          if (!disp.has(k)) disp.set(k, prev.t + ' ' + t);
        }
        prev = { l, t };
      }
    }
    // "Techy" = has digits/symbols, or is capitalised everywhere it appears (proper noun / acronym).
    const techy = (l) => /\d|[+#./]/.test(l) || (/[A-Z]/.test(disp.get(l) || '') && !lowerSeen.has(l));
    const items = [];
    uni.forEach((c, k) => items.push({ k, d: disp.get(k), c, s: c * (techy(k) ? 1.8 : 1) }));
    bi.forEach((c, k) => {
      if (c < 2) return;
      const [a, b] = k.split(' ');
      items.push({ k, d: disp.get(k), c, s: c * 1.4 * (techy(a) || techy(b) ? 1.8 : 1) });
    });
    items.sort((x, y) => y.s - x.s || y.c - x.c || x.k.localeCompare(y.k));
    return items.slice(0, 40);
  }

  function hasKeyword(textLow, k) {
    const e = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s-]+');
    const re = new RegExp(`(^|[^a-z0-9+#])${e}(s|es)?(?![a-z0-9+#])`, 'i');
    if (re.test(textLow)) return true;
    if (k.length > 3 && k.endsWith('s')) return hasKeyword(textLow, k.slice(0, -1));
    // "C/C++", "CI/CD": count as found when every part is present.
    if (k.includes('/')) return k.split('/').filter(Boolean).every((p) => hasKeyword(textLow, p));
    return false;
  }

  function matchKeywords(jd, resumeText) {
    const list = extractKeywords(jd);
    const low = resumeText.toLowerCase();
    let total = 0, hit = 0;
    list.forEach((x) => {
      x.found = hasKeyword(low, x.k);
      total += x.s;
      if (x.found) hit += x.s;
    });
    return { list, pct: total ? Math.round((hit / total) * 100) : 0 };
  }

  // ---------- checks ----------
  function analyze(data, jd, pages) {
    const checks = [];
    const add = (level, msg, detail) => checks.push({ level, msg, detail: detail || '' });
    const b = data.basics;
    const vis = data.sections.filter((s) => s.visible && !R.isEmpty(s));
    const entriesOf = (kind) => vis.filter((s) => s.type === 'entries' && s.kind === kind);

    // Contact
    if (!b.name.trim()) add('error', 'Add your full name at the top.');
    if (!b.email.trim()) add('error', 'Add an email address — ATS uses it to create your candidate profile.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) add('error', 'Email address looks invalid.', b.email);
    else add('ok', 'Email address present.');
    if (!b.phone.trim()) add('warn', 'Add a phone number.');
    else add('ok', 'Phone number present.');
    if (!b.location.trim()) add('warn', 'Add a location (City, Country) — recruiters often filter by location.');
    if (!b.links.some((l) => /linkedin\.com/i.test(l.text))) add('info', 'Consider adding your LinkedIn profile URL.');
    if (!b.title.trim()) add('warn', 'Add a headline that matches the job title you are targeting.');
    else add('ok', 'Headline present — make it match the target job title.');

    // Sections
    const summary = vis.find((s) => s.type === 'text');
    if (!summary) add('warn', 'Add a short Summary (2–4 lines) with your core skills and target role.');
    else {
      const w = wc(summary.text);
      if (w < 25) add('warn', `Summary is short (${w} words). Aim for 30–80 words.`);
      else if (w > 90) add('warn', `Summary is long (${w} words). Keep it to 30–80 words.`);
      else add('ok', `Summary length is good (${w} words).`);
    }
    if (!vis.some((s) => s.type === 'skills' || /skill/i.test(s.title))) add('error', 'Add a Skills section — it is the main source of ATS keyword matches.');
    else add('ok', 'Skills section present.');
    if (!entriesOf('experience').length) add('warn', 'No Experience section (fine for freshers — then lead with Projects / Internships).');
    if (!entriesOf('education').length && !vis.some((s) => /education/i.test(s.title))) add('warn', 'Add an Education section.');

    const odd = vis.filter((s) => !STANDARD.has(s.title.trim().toLowerCase().replace(/\s+/g, ' ')));
    if (odd.length) add('info', 'Non-standard headings may not be recognised by some ATS. Prefer standard names.', odd.map((s) => `"${s.title}"`).join(', '));
    else add('ok', 'All section headings are standard.');

    // Entries & bullets
    const missingDates = [], noCompany = [], tooMany = [];
    const formats = new Set();
    const issues = { long: [], short: [], weak: [], pronoun: [] };
    const starts = {};
    let expBullets = 0, expWithNum = 0, endDot = 0, endNo = 0;

    for (const s of vis) {
      if (s.type !== 'entries') continue;
      s.items.forEach((it, j) => {
        const name = `${s.title} › ${it.title.trim() || 'entry ' + (j + 1)}`;
        if ((s.kind === 'experience' || s.kind === 'education') && !it.date.trim()) missingDates.push(name);
        if (s.kind === 'experience' && it.title.trim() && !it.subtitle.trim()) noCompany.push(name);
        if (it.date.trim()) it.date.split(/\s*(?:–|—|-|\bto\b)\s*/i).forEach((p) => { const f = dateFormat(p); if (f) formats.add(f); });
        const bullets = R.nonEmpty(it.bullets);
        if (bullets.length > 8) tooMany.push(`${name} (${bullets.length})`);
        bullets.forEach((t, k) => {
          const where = `${name} › bullet ${k + 1}`;
          const p = t.replace(/\*\*/g, '');
          const low = p.toLowerCase();
          const w = wc(p);
          if (w > 35) issues.long.push(`${where} (${w} words)`);
          else if (w < 5) issues.short.push(where);
          if (WEAK.some((x) => low === x || low.startsWith(x + ' '))) issues.weak.push(`${where}: "${p.split(/\s+/).slice(0, 3).join(' ')}…"`);
          if (/\b(I|[Mm]e|[Mm]y|[Ww]e|[Oo]ur)\b/.test(p)) issues.pronoun.push(where);
          if (s.kind === 'experience') { expBullets++; if (/\d/.test(p)) expWithNum++; }
          const fw = low.match(/^[a-z]+/);
          if (fw) starts[fw[0]] = (starts[fw[0]] || 0) + 1;
          if (/\.$/.test(p)) endDot++; else endNo++;
        });
      });
    }
    if (missingDates.length) add('warn', 'Add dates (e.g. "Feb 2023 – Present") to every job and degree.', missingDates.join('; '));
    if (noCompany.length) add('warn', 'Experience entries should include the company name.', noCompany.join('; '));
    if (formats.size > 1) add('warn', 'Use one consistent date format across entries.', [...formats].join(', '));
    else if (formats.size === 1) add('ok', 'Date format is consistent.');
    if (tooMany.length) add('info', 'Long entries — 3–6 focused bullets per role read better.', tooMany.join('; '));
    if (issues.long.length) add('warn', 'Some bullets are long — keep each to 1–2 lines (≤ 30 words).', issues.long.join('; '));
    if (issues.short.length) add('info', 'Very short bullets — add the result or impact.', issues.short.join('; '));
    if (issues.weak.length) add('warn', 'Start bullets with strong action verbs (Led, Built, Optimized…) instead of passive phrases.', issues.weak.join('; '));
    if (issues.pronoun.length) add('warn', 'Avoid first-person pronouns (I, my, we) in bullets.', issues.pronoun.join('; '));
    if (expBullets) {
      const pct = Math.round((expWithNum / expBullets) * 100);
      if (pct < 35) add('warn', `Only ${pct}% of experience bullets contain a number. Quantify impact (%, count, time, money).`);
      else add('ok', `${pct}% of experience bullets are quantified.`);
    }
    const repeated = Object.entries(starts).filter(([w, c]) => c >= 3 && w.length > 2);
    if (repeated.length) add('info', 'Vary your action verbs — repeated bullet openers.', repeated.map(([w, c]) => `${cap(w)} ×${c}`).join(', '));
    if (endDot && endNo) add('info', 'Mixed bullet endings — end all bullets with a period, or none.', `${endDot} with period, ${endNo} without`);

    // Characters & length
    const text = R.toPlainText(data);
    const symbols = text.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{E000}-\u{F8FF}]/gu);
    if (symbols) add('warn', 'Remove icons / emoji / special symbols — ATS may garble them.', [...new Set(symbols)].join(' '));
    else add('ok', 'No icons or special symbols.');
    if (pages > 2) add('warn', `Resume is about ${pages} pages. Keep it to 1–2 pages.`);
    else add('ok', `Length ≈ ${pages} page${pages > 1 ? 's' : ''}.`);

    let score = 100, warnPen = 0, infoPen = 0;
    checks.forEach((c) => {
      if (c.level === 'error') score -= 15;
      else if (c.level === 'warn') warnPen += 6;
      else if (c.level === 'info') infoPen += 2;
    });
    score = Math.max(0, Math.min(100, score - Math.min(warnPen, 40) - Math.min(infoPen, 10)));

    return { score, checks, words: wc(text), kw: jd && jd.trim() ? matchKeywords(jd, text) : null };
  }

  return { analyze };
})();
