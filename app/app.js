/* Leonida Legend — GTA VI trophy guide and tracker.
   Loads its own data/trophies.json (a relative fetch of a file under app/),
   renders the checklist, the trophy detail view and the roadmap, and keeps
   progress in localStorage. No network request is ever made at run time:
   the only fetch is the relative data file, and source links open only when
   the reader clicks one. */

const KEY = 'gta6-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const STAGES = {
  1: { title: 'Stage 1 — Play the story', blurb: 'Chapters 1–4, the named story missions and the final mission. Keep a manual save at the start of every chapter, take the optional missions when they appear, and meditate at Lucia’s balcony spot before Chapter 1 ends.' },
  2: { title: 'Stage 2 — Strangers & side stories', blurb: 'The stranger chains: Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 stranger strands in total. Start each chain as soon as it appears — one source reports their windows are tied to story progress.' },
  3: { title: 'Stage 3 — Activities & challenges', blurb: 'Stunts, races, the shooting range, fishing, the arcade, meditation and the odd one-off feats. Most of the 50 challenges finish themselves while you do the rest.' },
  4: { title: 'Stage 4 — Collectibles & exploration', blurb: 'Cards, WAiNK photos, vehicles and the whole map. Fold these into your travel for other trophies instead of leaving them all for the end.' },
  5: { title: 'Stage 5 — Money & mayhem', blurb: 'Robberies, vaults, laundering, spending and garages. Bring a fast bike for the getaways and keep laundering Marked Bills as you go.' },
  6: { title: 'Stage 6 — Cleanup & the Platinum', blurb: 'Finish the 100% checklist, then the Platinum pops on its own. The checklist asks for more than the trophies in places (300 stunts, 30 races, 70 challenges, 8 vaults, 15 card sets), so expect a final grind.' },
};

const KIND_LABELS = { story: 'Story', missable: 'Missable', collectible: 'Collectible', activity: 'Activity', online: 'Online' };

const $ = (id) => document.getElementById(id);
const cardsEl = $('cards');
const detailEl = $('detail');
const stagesEl = $('stages');

let doc = null;
let trophies = [];
let earned = new Set();
let selectedId = null;

const state = { view: 'checklist', grade: 'all', kind: 'all', earnedFilter: 'all', q: '', spoiler: false };

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    const ids = Array.isArray(raw) ? raw : raw.earned;
    if (Array.isArray(ids)) earned = new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
  } catch { earned = new Set(); }
}

function saveEarned() {
  localStorage.setItem(KEY, JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }));
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function trophyFromParam(value) {
  if (!value) return null;
  const byId = trophies.find((t) => String(t.id) === value);
  if (byId) return byId;
  return trophies.find((t) => slug(t.name) === value) ?? null;
}

function readStateFromUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get('view') === 'roadmap') state.view = 'roadmap';
  if (['platinum', 'gold', 'silver', 'bronze'].includes(p.get('grade'))) state.grade = p.get('grade');
  if (['story', 'missable', 'collectible', 'activity', 'online'].includes(p.get('kind'))) state.kind = p.get('kind');
  if (['earned', 'unearned'].includes(p.get('show'))) state.earnedFilter = p.get('show');
  if (p.get('q')) state.q = p.get('q');
  if (p.get('spoiler') === '1') state.spoiler = true;
  const picked = trophyFromParam(p.get('trophy'));
  if (picked) selectedId = picked.id;
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.view === 'roadmap') p.set('view', 'roadmap');
  if (state.grade !== 'all') p.set('grade', state.grade);
  if (state.kind !== 'all') p.set('kind', state.kind);
  if (state.earnedFilter !== 'all') p.set('show', state.earnedFilter);
  if (state.q) p.set('q', state.q);
  if (state.spoiler) p.set('spoiler', '1');
  if (selectedId) p.set('trophy', slug(trophies.find((t) => t.id === selectedId).name));
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

function isMasked(t) {
  return state.spoiler && t.hidden && !earned.has(t.id);
}

function gradeLabel(t) {
  return isMasked(t) ? 'Hidden' : t.grade;
}

function kindMatches(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return t.missable === true;
  if (state.kind === 'online') return false;
  return t.kind === state.kind;
}

function visibleTrophies() {
  const q = state.q.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (!kindMatches(t)) return false;
    const isEarned = earned.has(t.id);
    if (state.earnedFilter === 'earned' && !isEarned) return false;
    if (state.earnedFilter === 'unearned' && isEarned) return false;
    if (q) {
      if (isMasked(t)) return false;
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(t) {
  const badge = el('span', 'grade-badge grade-' + (isMasked(t) ? 'hidden' : t.grade), gradeLabel(t));
  return badge;
}

function tagList(t) {
  const wrap = el('div', 'tags');
  if (isMasked(t)) {
    wrap.append(el('span', 'tag hidden-t', 'Hidden on PlayStation'));
    return wrap;
  }
  wrap.append(el('span', 'tag kind-' + t.kind, KIND_LABELS[t.kind]));
  if (t.hidden) wrap.append(el('span', 'tag hidden-t', 'Hidden on PSN'));
  if (t.missable) wrap.append(el('span', 'tag missable', 'Missable'));
  wrap.append(el('span', 'tag', 'Roadmap stage ' + t.stage));
  return wrap;
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('progressCount').textContent = done + ' of ' + total + ' earned';
  $('progressPct').textContent = pct + '%';
  $('progressFill').style.width = pct + '%';
  $('progressBar').setAttribute('aria-valuenow', String(done));
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return g + ' ' + got + '/' + all;
  });
  $('gradeCounts').textContent = byGrade.join(' · ');
  const missables = trophies.filter((t) => t.missable);
  const missDone = missables.filter((t) => earned.has(t.id)).length;
  $('missableLine').innerHTML = '';
  const strong = el('strong', null, 'Missable: ' + missDone + ' of ' + missables.length + ' earned');
  $('missableLine').append(strong, document.createTextNode(' — do the Chapter 1 meditation before the chapter ends.'));
}

function renderCards() {
  const list = visibleTrophies();
  cardsEl.replaceChildren();
  $('resultLine').textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies' +
    (state.spoiler ? ' · spoiler-safe on: hidden trophies stay masked until earned' : '');
  $('emptyNote').hidden = list.length > 0;
  for (const t of list) {
    const li = el('li', 'card' + (earned.has(t.id) ? ' earned' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + (isMasked(t) ? 'hidden trophy' : t.name));
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(t.id, box.checked);
    });
    const body = el('div');
    body.append(el('h3', null, isMasked(t) ? 'Hidden trophy' : t.name));
    body.append(el('p', 'desc', isMasked(t) ? 'Hidden on PlayStation until earned. Tick it off once it pops to reveal it.' : t.description));
    body.append(tagList(t));
    li.append(box, body, gradeBadge(t));
    li.addEventListener('click', () => selectTrophy(t.id));
    cardsEl.append(li);
  }
}

function sourceListItems(sources) {
  const ul = el('ul', 'sources');
  for (const s of sources) {
    const li = document.createElement('li');
    const match = s.match(/[a-z0-9-]+(?:\.[a-z0-9-]+)+\/*\S*/i);
    if (match) {
      const before = s.slice(0, match.index);
      const after = s.slice(match.index + match[0].length);
      if (before) li.append(document.createTextNode(before));
      const a = document.createElement('a');
      a.href = 'https://' + match[0];
      a.rel = 'noopener';
      a.textContent = match[0];
      li.append(a);
      if (after) li.append(document.createTextNode(after));
    } else {
      li.textContent = s;
    }
    ul.append(li);
  }
  return ul;
}

function renderDetail() {
  detailEl.replaceChildren();
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.append(el('h2', null, 'Pick a trophy'));
    detailEl.append(el('p', 'placeholder', 'Select any trophy on the left to read its official description, its guide and its sources here. Tick the box when you earn it — progress is saved in this browser.'));
    detailEl.append(el('p', 'placeholder', 'Deep links work too: add ?trophy=positive-mental-attitude or ?view=roadmap to the address to open a view directly.'));
    return;
  }
  const masked = isMasked(t);
  detailEl.append(gradeBadge(t));
  detailEl.append(el('h2', null, masked ? 'Hidden trophy' : t.name));
  const official = el('p', 'official');
  official.append(document.createTextNode('Official description: '));
  official.append(el('strong', null, masked ? 'Hidden on PlayStation until earned.' : t.description));
  detailEl.append(official);
  const meta = el('div', 'meta');
  meta.append(el('span', 'tag kind-' + (masked ? 'hidden-t' : t.kind), masked ? 'Hidden' : KIND_LABELS[t.kind]));
  if (t.hidden && !masked) meta.append(el('span', 'tag hidden-t', 'Hidden on PSN'));
  if (t.missable) meta.append(el('span', 'tag missable', 'Missable'));
  meta.append(el('span', 'tag', 'Roadmap stage ' + t.stage));
  detailEl.append(meta);
  if (masked) {
    detailEl.append(el('p', 'spoiler-note', 'Spoiler-safe mode is on: this trophy is hidden on PlayStation, so its name, description and guide stay covered until you earn it. Tick it off below to reveal it.'));
  } else {
    detailEl.append(el('h3', null, 'Guide'));
    detailEl.append(el('p', 'guide-text', t.guide));
    detailEl.append(el('h3', null, 'Sources'));
    detailEl.append(sourceListItems(t.sources));
  }
  const row = el('label', 'earned-row');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.addEventListener('click', () => toggleEarned(t.id, box.checked));
  row.append(box, document.createTextNode(earned.has(t.id) ? ' Earned — nice work.' : ' Mark as earned'));
  detailEl.append(row);
}

function renderRoadmap() {
  stagesEl.replaceChildren();
  for (const num of [1, 2, 3, 4, 5, 6]) {
    const stage = STAGES[num];
    const members = trophies.filter((t) => t.stage === num);
    const done = members.filter((t) => earned.has(t.id)).length;
    const box = el('section', 'stage');
    const h = el('h3', null, stage.title + ' ');
    h.append(el('span', 'stage-count', done + ' of ' + members.length + ' earned'));
    box.append(h, el('p', null, stage.blurb));
    const ul = document.createElement('ul');
    for (const t of members) {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = earned.has(t.id);
      cb.setAttribute('aria-label', 'Earned: ' + t.name);
      cb.addEventListener('click', () => toggleEarned(t.id, cb.checked));
      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'roadmap-link';
      name.textContent = isMasked(t) ? 'Hidden trophy' : t.name;
      if (earned.has(t.id)) name.classList.add('done');
      name.addEventListener('click', () => { selectTrophy(t.id); showView('checklist'); });
      li.append(cb, name, el('span', 'mini-grade', t.grade));
      if (t.missable) li.append(el('span', 'miss-flag', 'MISSABLE'));
      ul.append(li);
    }
    box.append(ul);
    stagesEl.append(box);
  }
}

function toggleEarned(id, on) {
  if (on) earned.add(id);
  else earned.delete(id);
  saveEarned();
  renderProgress();
  renderCards();
  renderDetail();
  renderRoadmap();
}

function selectTrophy(id) {
  selectedId = id;
  renderCards();
  renderDetail();
  syncUrl();
}

function showView(view) {
  state.view = view;
  $('tabChecklist').classList.toggle('active', view === 'checklist');
  $('tabRoadmap').classList.toggle('active', view === 'roadmap');
  $('tabChecklist').setAttribute('aria-pressed', String(view === 'checklist'));
  $('tabRoadmap').setAttribute('aria-pressed', String(view === 'roadmap'));
  $('checklistView').hidden = view !== 'checklist';
  $('roadmapView').hidden = view !== 'roadmap';
  syncUrl();
}

function renderAll() {
  renderProgress();
  renderCards();
  renderDetail();
  renderRoadmap();
  showView(state.view);
}

function wireControls() {
  $('tabChecklist').addEventListener('click', () => showView('checklist'));
  $('tabRoadmap').addEventListener('click', () => showView('roadmap'));
  $('search').addEventListener('input', (e) => { state.q = e.target.value; renderCards(); syncUrl(); });
  $('grade').addEventListener('change', (e) => { state.grade = e.target.value; renderCards(); syncUrl(); });
  $('kind').addEventListener('change', (e) => { state.kind = e.target.value; renderCards(); syncUrl(); });
  $('earnedFilter').addEventListener('change', (e) => { state.earnedFilter = e.target.value; renderCards(); syncUrl(); });
  $('spoiler').addEventListener('change', (e) => { state.spoiler = e.target.checked; renderAll(); syncUrl(); });
  $('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('not a progress file');
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      saveEarned();
      renderAll();
    } catch {
      alert('That file is not a trophy progress export from this guide.');
    }
    e.target.value = '';
  });
}

async function init() {
  loadEarned();
  const response = await fetch(DATA_URL);
  doc = await response.json();
  trophies = doc.trophies;
  readStateFromUrl();
  $('search').value = state.q;
  $('grade').value = state.grade;
  $('kind').value = state.kind;
  $('earnedFilter').value = state.earnedFilter;
  $('spoiler').checked = state.spoiler;
  wireControls();
  renderAll();
}

init();
