
// ── Словари ───────────────────────────────────────────────────────────────────

const PLANET_SYMBOLS = {
  n:'M', // Солнце
  o:'N', // Луна
  p:'O', // Меркурий
  q:'P', // Венера
  r:'Q', // Марс
  s:'R', // Юпитер
  t:'S', // Сатурн
  u:'T', // Уран
  v:'U', // Нептун
  w:'V', // Плутон
  '|':'X', // Хирон
};

const PLANET_NAMES = {
  n:'Солнце', o:'Луна', p:'Меркурий', q:'Венера', r:'Марс',
  s:'Юпитер', t:'Сатурн', u:'Уран', v:'Нептун', w:'Плутон',
  '|':'Хирон'
  // x(Раху) и y(Кету) убраны
};

const SIGN_CHARS = {
  ';':'Овен ♈',     '<':'Телец ♉',    '=':'Близнецы ♊', '>':'Рак ♋',
  '?':'Лев ♌',      '@':'Дева ♍',     'A':'Весы ♎',     'B':'Скорпион ♏',
  'C':'Стрелец ♐',  'D':'Козерог ♑',  'E':'Водолей ♒',  'F':'Рыбы ♓'
};

const SIGN_PLAIN = {
  ';':'Овен',     '<':'Телец',    '=':'Близнецы', '>':'Рак',
  '?':'Лев',      '@':'Дева',     'A':'Весы',     'B':'Скорпион',
  'C':'Стрелец',  'D':'Козерог',  'E':'Водолей',  'F':'Рыбы'
};

const ASPECT_NAMES = {
  0:  {name:'Соединение', cls:'asp-conj' },
  60: {name:'Секстиль',   cls:'asp-sext' },
  90: {name:'Квадрат',    cls:'asp-sq'   },
  120:{name:'Тригон',     cls:'asp-trine'},
  180:{name:'Оппозиция',  cls:'asp-opp'  }
};

// ── Стихии знаков зодиака ────────────────────────────────────────────────────
const SIGN_ELEMENT = {
  ';':'Огонь',   // Овен    — Огонь
  '<':'Земля',   // Телец   — Земля
  '=':'Воздух',  // Близнецы — Воздух
  '>':'Вода',    // Рак     — Вода
  '?':'Огонь',   // Лев     — Огонь
  '@':'Земля',   // Дева    — Земля
  'A':'Воздух',  // Весы    — Воздух
  'B':'Вода',    // Скорпион — Вода
  'C':'Огонь',   // Стрелец — Огонь
  'D':'Земля',   // Козерог — Земля
  'E':'Воздух',  // Водолей — Воздух
  'F':'Вода',    // Рыбы    — Вода
};

// Весовые баллы планет (sym → балл)
// ASC и MC — 2 балла (обрабатываем отдельно)
const PLANET_WEIGHT = {
  n:2,   // Солнце
  o:2,   // Луна
  p:2,   // Меркурий
  // ASC 2, MC 2 — добавляем при расчёте
  q:1,   // Венера
  r:1,   // Марс
  s:1,   // Юпитер
  t:1,   // Сатурн
  u:1,   // Уран
  v:1,   // Нептун
  w:1,   // Плутон
  '|':1  // Хирон
};

// Считаем показатели стихий и энергий
function calcElements(planets, asc, mc) {
  const totals = { Огонь:0, Земля:0, Воздух:0, Вода:0 };

  console.log('=== РАСЧЁТ СТИХИЙ ===');

  // Планеты
  planets.forEach(p => {
    const weight = PLANET_WEIGHT[p.sym];
    if (weight === undefined) return; // Раху/Кету пропускаем
    const name = PLANET_NAMES[p.sym] || p.sym;
    const el = SIGN_ELEMENT[p.signChar];
    const signName = SIGN_PLAIN[p.signChar] || ('НЕИЗВЕСТНО[' + p.signChar + ']');
    console.log(`${name}: знак="${p.signChar}" (${signName}) → стихия=${el||'НЕ НАЙДЕНО'}, вес=${weight}`);
    if (el) totals[el] += weight;
  });

  // ASC (2 балла)
  if (asc) {
    const el = SIGN_ELEMENT[asc.signChar];
    const signName = SIGN_PLAIN[asc.signChar] || ('НЕИЗВЕСТНО[' + asc.signChar + ']');
    console.log(`ASC: знак="${asc.signChar}" (${signName}) → стихия=${el||'НЕ НАЙДЕНО'}, вес=2`);
    if (el) totals[el] += 2;
  }

  // MC (2 балла)
  if (mc) {
    const el = SIGN_ELEMENT[mc.signChar];
    const signName = SIGN_PLAIN[mc.signChar] || ('НЕИЗВЕСТНО[' + mc.signChar + ']');
    console.log(`MC: знак="${mc.signChar}" (${signName}) → стихия=${el||'НЕ НАЙДЕНО'}, вес=2`);
    if (el) totals[el] += 2;
  }

  console.log('Итого:', totals);

  return {
    elements: totals,
    teplo:          totals['Огонь'] + totals['Воздух'],
    holod:          totals['Вода']  + totals['Земля'],
    suhost:         totals['Земля'] + totals['Огонь'],
    vlazhnost:      totals['Вода']  + totals['Воздух'],
    racionalnost:   totals['Земля'] + totals['Воздух'],
    emotsionalnost: totals['Огонь'] + totals['Вода'],
  };
}

// ── Орбисы: лимиты в формате [градусы, минуты, секунды] → хранятся в секундах ─
// Условие "< 7°00′00″" означает строго меньше 7*3600 секунд
function dmsToSec(d, m, s) { return d * 3600 + m * 60 + s; }

const ORB_LIMITS = (function() {
  // [планета1, планета2, градусы, минуты, секунды]
  const pairs = [
    ['Солнце','Луна',        7,0,0],
    ['Солнце','Меркурий',    6,0,0],
    ['Солнце','Венера',      6,0,0],
    ['Солнце','Марс',        6,0,0],
    ['Солнце','Юпитер',      5,0,0],
    ['Солнце','Сатурн',      5,0,0],
    ['Солнце','Уран',        4,0,0],
    ['Солнце','Нептун',      4,0,0],
    ['Солнце','Плутон',      4,0,0],
    ['Солнце','Хирон',       4,0,0],
    ['Луна','Меркурий',      6,0,0],
    ['Луна','Венера',        6,0,0],
    ['Луна','Марс',          6,0,0],
    ['Луна','Юпитер',        5,0,0],
    ['Луна','Сатурн',        5,0,0],
    ['Луна','Уран',          4,0,0],
    ['Луна','Нептун',        4,0,0],
    ['Луна','Плутон',        4,0,0],
    ['Луна','Хирон',         4,0,0],
    ['Меркурий','Венера',    6,0,0],
    ['Меркурий','Марс',      6,0,0],
    ['Меркурий','Юпитер',    5,0,0],
    ['Меркурий','Сатурн',    5,0,0],
    ['Меркурий','Уран',      4,0,0],
    ['Меркурий','Нептун',    4,0,0],
    ['Меркурий','Плутон',    4,0,0],
    ['Меркурий','Хирон',     4,0,0],
    ['Венера','Марс',        6,0,0],
    ['Венера','Юпитер',      5,0,0],
    ['Венера','Сатурн',      5,0,0],
    ['Венера','Уран',        4,0,0],
    ['Венера','Нептун',      4,0,0],
    ['Венера','Плутон',      4,0,0],
    ['Венера','Хирон',       4,0,0],
    ['Марс','Юпитер',        5,0,0],
    ['Марс','Сатурн',        5,0,0],
    ['Марс','Уран',          4,0,0],
    ['Марс','Нептун',        4,0,0],
    ['Марс','Плутон',        4,0,0],
    ['Марс','Хирон',         4,0,0],
    ['Юпитер','Сатурн',      5,0,0],
    ['Юпитер','Уран',        4,0,0],
    ['Юпитер','Нептун',      4,0,0],
    ['Юпитер','Плутон',      4,0,0],
    ['Юпитер','Хирон',       4,0,0],
    ['Сатурн','Уран',        4,0,0],
    ['Сатурн','Нептун',      4,0,0],
    ['Сатурн','Плутон',      4,0,0],
    ['Сатурн','Хирон',       4,0,0],
    ['Уран','Нептун',        4,0,0],
    ['Уран','Плутон',        4,0,0],
    ['Уран','Хирон',         4,0,0],
    ['Нептун','Плутон',      4,0,0],
    ['Нептун','Хирон',       4,0,0],
    ['Плутон','Хирон',       4,0,0],
  ];
  const map = {};
  pairs.forEach(([a, b, d, m, s]) => {
    const key = [a, b].sort().join('|');
    map[key] = dmsToSec(d, m, s); // храним в секундах
  });
  return map;
})();

// Нормализуем имя планеты из аспекта к стандартному (убираем "истинный", скобки и т.п.)
function normalizePlanetName(raw) {
  const map = {
    'Солнце': 'Солнце',
    'Луна': 'Луна',
    'Меркурий': 'Меркурий',
    'Венера': 'Венера',
    'Марс': 'Марс',
    'Юпитер': 'Юпитер',
    'Сатурн': 'Сатурн',
    'Уран': 'Уран',
    'Нептун': 'Нептун',
    'Плутон': 'Плутон',
    'Хирон': 'Хирон',
  };
  for (const [key, val] of Object.entries(map)) {
    if (raw.includes(key)) return val;
  }
  return raw.trim();
}

// Парсим орбис из строки вида "5°40′33″" → общее количество секунд (целое)
function parseOrbSec(orbStr) {
  // Сотис пишет: градус °, минута ′ (U+2032), секунда ″ (U+2033)
  const m = orbStr.match(/(\d+)\s*°\s*(\d+)\s*[′']\s*(\d+)\s*[″"]?/);
  if (m) {
    return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
  }
  // Только градусы и минуты
  const m2 = orbStr.match(/(\d+)\s*°\s*(\d+)/);
  if (m2) return parseInt(m2[1]) * 3600 + parseInt(m2[2]) * 60;
  // Только градусы
  const m3 = orbStr.match(/(\d+)\s*°/);
  if (m3) return parseInt(m3[1]) * 3600;
  return 999 * 3600;
}

// Проверяем, нужно ли показывать аспект.
// Условие: орбис строго меньше X°00′00″ → в секундах строго меньше X*3600
function shouldShowAspect(p1raw, p2raw, orbStr) {
  const p1 = normalizePlanetName(p1raw);
  const p2 = normalizePlanetName(p2raw);
  const key = [p1, p2].sort().join('|');
  const limitSec = ORB_LIMITS[key];
  if (limitSec === undefined) return false;
  const orbSec = parseOrbSec(orbStr);
  return orbSec < limitSec; // строго меньше: 6°59′59″ ✓, 7°00′00″ ✗
}

// ── Состояние ─────────────────────────────────────────────────────────────────
let currentData  = null;
let selectedFile = null;
let selectedHeight = 0;
let selectedAge = 0;
let selectedGender = '';
let selectedWeight = 0;

// ── Выбор пола ────────────────────────────────────────────────────────────────
function selectGender(v) {
  selectedGender = v;
  const select = document.getElementById('genderSelect');
  if (select) select.value = v;
  document.getElementById('genderErr').style.display = 'none';
}



// Запрещаем отправку форм и открытие новой страницы, если код вставлен в Тильду внутри form-блока
document.addEventListener('submit', function(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, true);

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('button').forEach(function(btn) {
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
  });
});

// ── Файл выбран ───────────────────────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', function(e) {
  selectedFile = e.target.files[0] || null;
  const label = document.getElementById('fileChosen');
  const btn   = document.getElementById('uploadBtnLabel');
  if (selectedFile) {
    label.textContent = '✓ ' + selectedFile.name;
    btn.style.borderColor = '';
    btn.style.color = '';
  } else {
    label.textContent = 'Файл не выбран';
  }
});


function syncStartFoodFields() {
  const pairs = [['genderSelectStart','genderSelect'],['weightInputStart','weightInput'],['heightInputStart','heightInput'],['ageInputStart','ageInput']];
  pairs.forEach(function(pair){
    const from = document.getElementById(pair[0]);
    const to = document.getElementById(pair[1]);
    if (from && to && from.value && !to.value) to.value = from.value;
  });
}

// ── Рассчитать ────────────────────────────────────────────────────────────────
function calculate(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  syncStartFoodFields();
  let ok = true;
  if (!selectedFile) {
    ok = false;
    document.getElementById('uploadBtnLabel').style.borderColor = 'var(--peach)';
    document.getElementById('uploadBtnLabel').style.color = 'var(--peach)';
  }
  if (!ok) return;

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      currentData = parseHTML(ev.target.result);
      render();
    } catch(err) {
      alert('Ошибка чтения файла: ' + err.message);
    }
  };
  reader.readAsText(selectedFile, 'UTF-8');
}

// Надёжно извлекаем символ знака из ячейки таблицы
// textContent в DOMParser декодирует entities, но иногда нет — поэтому используем innerHTML
function decodeChar(cell) {
  // Пробуем innerHTML — он содержит сырой текст с entities
  const raw = (cell.innerHTML || cell.textContent || '').trim();
  // Ручной словарь entities которые Сотис использует для знаков зодиака
  const entityMap = {
    '&lt;':  '<',  // Телец
    '&gt;':  '>',  // Лев
    '&#59;': ';',  // Близнецы
    '&#60;': '<',  // Телец (альт)
    '&#61;': '=',  // Рак
    '&#62;': '>',  // Лев (альт)
    '&#63;': '?',  // Дева
    '&#64;': '@',  // Весы
    '&#65;': 'A',  // Скорпион
    '&#66;': 'B',  // Стрелец
    '&#67;': 'C',  // Козерог
    '&#68;': 'D',  // Водолей
    '&#69;': 'E',  // Рыбы
    '&#70;': 'F',  // Овен
  };
  for (const [entity, ch] of Object.entries(entityMap)) {
    if (raw === entity) return ch;
  }
  // Если уже декодировано — берём первый символ
  return raw.replace(/\s+/g, '').charAt(0);
}

// ── Парсер ────────────────────────────────────────────────────────────────────
function parseHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const vsbl = doc.querySelector('.vsbl text[data-t]');
  let chartName = '', chartDate = '';
  if (vsbl) {
    const raw = vsbl.getAttribute('data-t') || '';
    const nm = raw.match(/<b>(.+?)<\/b>/i);
    if (nm) chartName = nm[1].replace(/\s*\([a-zA-Zа-яА-Я]\)\s*$/, '').trim();
    const dm = raw.match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
    chartDate = dm ? dm[1] : '';
  }

  const planets = [];
  doc.querySelectorAll('table.coord tbody:not(.house) tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 2) return;
    const symEl = tr.querySelector('th .asmb') || tr.querySelector('th');
    if (!symEl) return;
    const sym = symEl.textContent.trim();
    const posRaw = cells[0].textContent.trim();
    // signChar — декодируем entities и берём первый символ
    const signChar = decodeChar(cells[1]);
    const isRetro = posRaw.startsWith('R');
    const pos = posRaw.replace(/^R\s*/, '').trim();
    planets.push({ sym, pos, signChar, isRetro });
  });

  const aspects = [];
  const seen = new Set();
  doc.querySelectorAll('g.asp path[data-t]').forEach(p => {
    const raw = p.getAttribute('data-t') || '';
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    const m = raw.match(/^(.+?)\s*\((\d+)\)\s+(.+?)\s*[<>]+\s*(.+?)\s*\((.+?)\)\s*$/);
    if (!m) return;
    aspects.push({
      type: parseInt(m[2]),
      typeName: m[1].trim(),
      p1: m[3].trim(),
      p2: m[4].trim(),
      orb: m[5].trim()
    });
  });

  // Дома — берём ASC (дом 1) и MC (дом 10)
  let asc = null, mc = null;
  const houseRows = doc.querySelectorAll('table.coord tbody.house tr');
  houseRows.forEach((tr, i) => {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 2) return;
    const pos = cells[0].textContent.trim();
    // signChar — декодируем entities и берём первый символ
    const signChar = decodeChar(cells[1]);
    if (i === 0) asc = { pos, signChar };   // Дом 1 = ASC
    if (i === 9) mc  = { pos, signChar };   // Дом 10 = MC
  });

  return { chartName, chartDate, planets, aspects, asc, mc };
}

// ── Рендер ────────────────────────────────────────────────────────────────────
function signLabel(ch) { return SIGN_CHARS[ch] || ch; }

function formatNameSignSpacing(text) {
  return String(text || '').replace(/([А-ЯЁа-яёA-Za-z]+)\s*\(/g, '$1 (');
}


function normalizeVisibleText(text) {
  let value = String(text || '')
    .replace(/([,)])(?=\S)/g, '$1 ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();

  // Если в карточке одно короткое значение, убираем точку в конце: «5 грамм.» → «5 грамм».
  if (!/[\n•]/.test(value) && value.length <= 90) {
    value = value.replace(/\.$/, '');
  }
  return value;
}

function normalizeTextNodes(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const oldValue = node.nodeValue;
    const newValue = normalizeVisibleText(oldValue);
    if (newValue !== oldValue.trim()) node.nodeValue = newValue;
  });
}


function makePlanetCard(symbol, name, pos, signChar, isRetro) {
  const card = document.createElement('div');
  card.className = 'planet-card';
  card.innerHTML = `
    <div class="planet-symbol">${symbol}</div>
    <div class="planet-info">
      <div class="planet-name">${name}${isRetro ? '<span class="retrograde">R</span>' : ''}</div>
      <div class="planet-pos">${pos}</div>
      <div class="planet-sign">${signLabel(signChar)}</div>
    </div>`;
  return card;
}

function render() {
  const d = currentData;

  const namePart = d.chartName || '';
  const datePart = d.chartDate || '';
  document.getElementById('chartMeta').textContent = [namePart, datePart].filter(Boolean).join(' · ');
  document.getElementById('genderBadge').textContent = '';

  // Планеты + ASC + MC
  const pg = document.getElementById('planetsGrid');
  pg.innerHTML = '';
  d.planets.forEach(p => {
    const name   = PLANET_NAMES[p.sym];
    const symbol = PLANET_SYMBOLS[p.sym];
    if (!name || !symbol) return; // пропускаем Раху/Кету
    pg.appendChild(makePlanetCard(symbol, name, p.pos, p.signChar, p.isRetro));
  });
  if (d.asc) pg.appendChild(makePlanetCard('w', 'ASC', d.asc.pos, d.asc.signChar, false));
  if (d.mc)  pg.appendChild(makePlanetCard('t', 'MC',  d.mc.pos,  d.mc.signChar,  false));

  // Аспекты — фильтруем по орбисам
  const al = document.getElementById('aspectList');
  al.innerHTML = '';
  const filtered = d.aspects.filter(a => shouldShowAspect(a.p1, a.p2, a.orb));
  filtered.forEach(a => {
    const info = ASPECT_NAMES[a.type] || { name: a.typeName, cls: 'asp-other' };
    const p1n = normalizePlanetName(a.p1);
    const p2n = normalizePlanetName(a.p2);
    const key = [p1n, p2n].sort().join('|');
    const limitSec = ORB_LIMITS[key];
    const limitStr = limitSec !== undefined
      ? `${Math.floor(limitSec/3600)}°${String(Math.floor((limitSec%3600)/60)).padStart(2,'0')}′${String(limitSec%60).padStart(2,'0')}″`
      : '';
    const row = document.createElement('div');
    row.className = 'aspect-row';
    row.innerHTML = `
      <span class="asp-type ${info.cls}">${info.name || a.typeName}</span>
      <span class="asp-planets">${a.p1} — ${a.p2}</span>
      <span class="asp-orb" title="лимит: ${limitStr}">${a.orb}</span>`;
    al.appendChild(row);
  });
  if (filtered.length === 0)
    al.innerHTML = '<div style="color:rgba(250, 243, 235, 0.38);font-size:1.15rem;padding:.8rem">Аспекты в заданных орбисах не найдены</div>';

  // Показатели
  renderIndicators(d);
  normalizeTextNodes(document.getElementById('result'));

  document.getElementById('uploadZone').style.display = 'none';
  document.getElementById('result').style.display = 'block';

  window.scrollTo(0, 0);
}

function renderIndicators(d) {
  const calc = calcElements(d.planets, d.asc, d.mc);
  const el = calc.elements;
  const total = (el['Огонь']||0)+(el['Земля']||0)+(el['Воздух']||0)+(el['Вода']||0);

  // Детализация: какие планеты/точки попали в какую стихию
  const breakdown = { Огонь:[], Земля:[], Воздух:[], Вода:[] };
  d.planets.forEach(p => {
    const weight = PLANET_WEIGHT[p.sym];
    if (weight === undefined) return; // Раху/Кету пропускаем
    const name = PLANET_NAMES[p.sym] || p.sym;
    const elem = SIGN_ELEMENT[p.signChar];
    if (elem) breakdown[elem].push(name);
  });
  if (d.asc) {
    const elem = SIGN_ELEMENT[d.asc.signChar];
    if (elem) breakdown[elem].push('ASC');
  }
  if (d.mc) {
    const elem = SIGN_ELEMENT[d.mc.signChar];
    if (elem) breakdown[elem].push('MC');
  }

  const container = document.getElementById('indicatorsSection');
  container.innerHTML = '';

  // — Стихии —
  const elBlock = document.createElement('div');
  elBlock.innerHTML = ``;
  const elGrid = document.createElement('div');
  elGrid.className = 'elements-grid';
  const elDefs = [
    { key:'Огонь',  cls:'fire',  emoji:'🔥' },
    { key:'Земля',  cls:'earth', emoji:'🌍' },
    { key:'Воздух', cls:'air',   emoji:'💨' },
    { key:'Вода',   cls:'water', emoji:'💧' },
  ];
  elDefs.forEach(({ key, cls, emoji }) => {
    const score = el[key] || 0;
    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    const detail = breakdown[key].length ? formatNameSignSpacing(breakdown[key].join(', ')) : '—';
    const card = document.createElement('div');
    card.className = `element-card ${cls}`;
    card.innerHTML = `
      <div class="element-name">${emoji} ${key}</div>
      <div class="element-score">${score}</div>
      <div style="font-size:1.2rem;color:var(--muted);margin-top:0.25rem">${pct} %</div>
      <div class="element-detail">${detail}</div>`;
    elGrid.appendChild(card);
  });
  elBlock.appendChild(elGrid);
  container.appendChild(elBlock);

  // — Энергии —
  const enBlock = document.createElement('div');
  const energies = [
    { label:'Тепло', formula:'Огонь + Воздух', value: calc.teplo },
    { label:'Холод',           formula:'Вода + Земля',   value: calc.holod },
    { label:'Сухость',         formula:'Земля + Огонь',  value: calc.suhost },
    { label:'Влажность',       formula:'Вода + Воздух',  value: calc.vlazhnost },
    { label:'Рациональность',  formula:'Земля + Воздух', value: calc.racionalnost },
    { label:'Эмоциональность', formula:'Огонь + Вода',   value: calc.emotsionalnost },
  ];
  const enGrid = document.createElement('div');
  enGrid.className = 'energies-grid';
  energies.forEach(({ label, formula, value }) => {
    const card = document.createElement('div');
    card.className = 'energy-card';
    card.innerHTML = `
      <div>
        <div class="energy-label">${label}</div>
      </div>
      <div class="energy-score">${value}</div>`;
    enGrid.appendChild(card);
  });
  enBlock.appendChild(enGrid);
  container.appendChild(enBlock);
}

// ── Экспорт в DOCX ───────────────────────────────────────────────────────────
async function exportDocx() {
  if (!currentData) return;
  const d = currentData;
  const name   = d.chartName || 'Неизвестно';
  const date   = d.chartDate || '';
  const gender = selectedGender || '—';
  const calc   = calcElements(d.planets, d.asc, d.mc);
  const el     = calc.elements;
  const total  = (el['Огонь']||0)+(el['Земля']||0)+(el['Воздух']||0)+(el['Вода']||0);

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
    VerticalAlign
  } = docx;

  const gold   = 'FC9FBC';
  const dark   = '0B1957';
  const gray   = '7D7590';
  const white  = 'FAF3EB';

  const border = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  function heading(text, level = 1) {
    return new Paragraph({
      children: [new TextRun({
        text, bold: true, color: gold,
        size: level === 1 ? 36 : 26,
        font: 'Arial',
      })],
      spacing: { before: level === 1 ? 400 : 300, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: gold, space: 4 } },
    });
  }

  function subheading(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, color: '333333', font: 'Arial' })],
      spacing: { before: 200, after: 100 },
    });
  }

  function bodyRow(label, value, bold = false) {
    return new Paragraph({
      children: [
        new TextRun({ text: label + ': ', bold: true, size: 20, font: 'Arial', color: '555555' }),
        new TextRun({ text: value, bold, size: 20, font: 'Arial', color: '222222' }),
      ],
      spacing: { after: 80 },
    });
  }

  function divider() {
    return new Paragraph({
      children: [new TextRun({ text: '' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'EEEEEE', space: 2 } },
      spacing: { before: 120, after: 120 },
    });
  }

  // Таблица планет
  function planetsTable() {
    const headerRow = new TableRow({
      children: [
        ['Планета', 2000], ['Позиция', 2200], ['Знак', 2200], ['R', 800]
      ].map(([text, w]) => new TableCell({
        borders,
        width: { size: w, type: WidthType.DXA },
        shading: { fill: '0B1957', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, color: gold, size: 18, font: 'Arial' })]
        })]
      }))
    });

    const dataRows = [];
    // Планеты
    d.planets.forEach(p => {
      const pname = PLANET_NAMES[p.sym]; if (!pname) return;
      const sign  = SIGN_PLAIN[p.signChar] || p.signChar;
      const el    = SIGN_ELEMENT[p.signChar] || '';
      const elColor = { Огонь:'C0392B', Земля:'27AE60', Воздух:'2980B9', Вода:'1A5276' }[el] || '444444';
      dataRows.push(new TableRow({
        children: [
          cell(pname, 2000),
          cell(p.pos, 2200),
          colorCell(sign, elColor, 2200),
          cell(p.isRetro ? 'R' : '', 800),
        ]
      }));
    });
    // ASC
    if (d.asc) {
      const sign = SIGN_PLAIN[d.asc.signChar] || d.asc.signChar;
      const elColor = { Огонь:'C0392B', Земля:'27AE60', Воздух:'2980B9', Вода:'1A5276' }[SIGN_ELEMENT[d.asc.signChar]] || '444444';
      dataRows.push(new TableRow({ children: [cell('ASC',2000), cell(d.asc.pos,2200), colorCell(sign,elColor,2200), cell('',800)] }));
    }
    // MC
    if (d.mc) {
      const sign = SIGN_PLAIN[d.mc.signChar] || d.mc.signChar;
      const elColor = { Огонь:'C0392B', Земля:'27AE60', Воздух:'2980B9', Вода:'1A5276' }[SIGN_ELEMENT[d.mc.signChar]] || '444444';
      dataRows.push(new TableRow({ children: [cell('MC',2000), cell(d.mc.pos,2200), colorCell(sign,elColor,2200), cell('',800)] }));
    }

    return new Table({
      width: { size: 7200, type: WidthType.DXA },
      columnWidths: [2000, 2200, 2200, 800],
      rows: [headerRow, ...dataRows],
    });
  }

  function cell(text, w) {
    return new TableCell({
      borders, width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Arial' })] })]
    });
  }
  function colorCell(text, color, w) {
    return new TableCell({
      borders, width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Arial', color })] })]
    });
  }

  // Таблица аспектов
  function aspectsTable() {
    const filtered = d.aspects.filter(a => shouldShowAspect(a.p1, a.p2, a.orb));
    if (filtered.length === 0) return new Paragraph({ children: [new TextRun({ text: 'Нет аспектов в заданных орбисах', size: 18, font: 'Arial', color: gray })] });

    const aspColors = { 'Соединение':'2471A3', 'Тригон':'1E8449', 'Секстиль':'117A65', 'Квадрат':'C0392B', 'Оппозиция':'76448A' };
    const headerRow = new TableRow({
      children: [['Аспект',1800],['Планета 1',2200],['Планета 2',2200],['Орбис',1000]].map(([t,w]) =>
        new TableCell({
          borders, width:{size:w,type:WidthType.DXA},
          shading:{fill:'0B1957',type:ShadingType.CLEAR},
          margins:{top:80,bottom:80,left:120,right:120},
          children:[new Paragraph({children:[new TextRun({text:t,bold:true,color:gold,size:18,font:'Arial'})]})]
        })
      )
    });
    const rows = filtered.map(a => {
      const info = ASPECT_NAMES[a.type] || { name: a.typeName };
      const aColor = aspColors[info.name] || '444444';
      return new TableRow({ children: [
        new TableCell({ borders, width:{size:1800,type:WidthType.DXA}, margins:{top:60,bottom:60,left:120,right:120},
          children:[new Paragraph({children:[new TextRun({text:info.name||a.typeName,size:18,font:'Arial',color:aColor,bold:true})]})] }),
        cell(a.p1, 2200), cell(a.p2, 2200), cell(a.orb, 1000),
      ]});
    });
    return new Table({ width:{size:7200,type:WidthType.DXA}, columnWidths:[1800,2200,2200,1000], rows:[headerRow,...rows] });
  }

  // Таблица стихий
  function elementsTable() {
    const elDefs = [
      { key:'Огонь',  color:'C0392B', signs:'Овен, Лев, Стрелец' },
      { key:'Земля',  color:'1E8449', signs:'Телец, Дева, Козерог' },
      { key:'Воздух', color:'2471A3', signs:'Близнецы, Весы, Водолей' },
      { key:'Вода',   color:'154360', signs:'Рак, Скорпион, Рыбы' },
    ];
    const headerRow = new TableRow({
      children: [['Стихия',1400],['Знаки',3000],['Баллы',800],['%',600],['Состав',2400]].map(([t,w])=>
        new TableCell({borders,width:{size:w,type:WidthType.DXA},shading:{fill:'0B1957',type:ShadingType.CLEAR},
          margins:{top:80,bottom:80,left:120,right:120},
          children:[new Paragraph({children:[new TextRun({text:t,bold:true,color:gold,size:18,font:'Arial'})]})]})
      )
    });

    // Детализация
    const breakdown = { Огонь:[], Земля:[], Воздух:[], Вода:[] };
    d.planets.forEach(p => {
      const w2 = PLANET_WEIGHT[p.sym]; if (w2===undefined) return;
      const pname = PLANET_NAMES[p.sym]||p.sym;
      const sign  = SIGN_PLAIN[p.signChar]||p.signChar;
      const elem  = SIGN_ELEMENT[p.signChar];
      if (elem) breakdown[elem].push(`${pname} (${sign})`);
    });
    if (d.asc) { const e=SIGN_ELEMENT[d.asc.signChar]; if(e) breakdown[e].push(`ASC (${SIGN_PLAIN[d.asc.signChar]||d.asc.signChar})`); }
    if (d.mc)  { const e=SIGN_ELEMENT[d.mc.signChar];  if(e) breakdown[e].push(`MC (${SIGN_PLAIN[d.mc.signChar]||d.mc.signChar})`); }

    const rows = elDefs.map(({key,color,signs}) => {
      const sc  = el[key]||0;
      const pct = total>0 ? Math.round(sc/total*100) : 0;
      const det = formatNameSignSpacing(breakdown[key].join(', '))||'—';
      return new TableRow({ children: [
        new TableCell({borders,width:{size:1400,type:WidthType.DXA},margins:{top:60,bottom:60,left:120,right:120},
          children:[new Paragraph({children:[new TextRun({text:key,bold:true,color,size:18,font:'Arial'})]})]
        }),
        cell(signs,3000), cell(String(sc),800), cell(pct+' %',600), cell(det,2400),
      ]});
    });
    return new Table({width:{size:8200,type:WidthType.DXA},columnWidths:[1400,3000,800,600,2400],rows:[headerRow,...rows]});
  }

  // Таблица энергий
  function energiesTable() {
    const energies = [
      { label:'Тепло', formula:'Огонь + Воздух', value: calc.teplo },
      { label:'Холод',           formula:'Вода + Земля',   value: calc.holod },
      { label:'Сухость',         formula:'Земля + Огонь',  value: calc.suhost },
      { label:'Влажность',       formula:'Вода + Воздух',  value: calc.vlazhnost },
      { label:'Рациональность',  formula:'Земля + Воздух', value: calc.racionalnost },
      { label:'Эмоциональность', formula:'Огонь + Вода',   value: calc.emotsionalnost },
    ];
    const headerRow = new TableRow({
      children: [['Показатель',3000],['Формула',3000],['Значение',1200]].map(([t,w])=>
        new TableCell({borders,width:{size:w,type:WidthType.DXA},shading:{fill:'0B1957',type:ShadingType.CLEAR},
          margins:{top:80,bottom:80,left:120,right:120},
          children:[new Paragraph({children:[new TextRun({text:t,bold:true,color:gold,size:18,font:'Arial'})]})]})
      )
    });
    const rows = energies.map(({label,formula,value})=>
      new TableRow({children:[cell(label,3000),cell(formula,3000),cell(String(value),1200)]})
    );
    return new Table({width:{size:7200,type:WidthType.DXA},columnWidths:[3000,3000,1200],rows:[headerRow,...rows]});
  }

  const children = [
    // Заголовок
    new Paragraph({
      children: [new TextRun({ text: 'Расчёт правильного питания с помощью натальной карты', bold: true, size: 40, font: 'Arial', color: dark })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: name + '  |  ' + gender + '  |  ' + date, size: 20, font: 'Arial', color: gray })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    heading('Планеты в знаках'),
    planetsTable(),
    divider(),

    heading('Аспекты'),
    aspectsTable(),
    divider(),

    heading('Расчёт показателей'),
    subheading('Стихии'),
    elementsTable(),
    new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 160 } }),
    subheading('Энергии'),
    energiesTable(),
  ];

  const document = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
      },
      children,
    }]
  });

  const buffer = await Packer.toBlob(document);
  const safe = name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9_\- ]/g,'').trim() || 'karta';
  const fn = `pitanie_${safe}_${date.replace(/[.: ]/g,'-')}.docx`;
  const a = document.createElement ? null : null;
  const link = window.document.createElement('a');
  link.href = URL.createObjectURL(buffer);
  link.download = fn;
  link.click();
  URL.revokeObjectURL(link.href);
}


function visibleAspects() {
  return currentData.aspects.filter(a => shouldShowAspect(a.p1, a.p2, a.orb));
}

function hasAspectBetween(aspects, planetA, planetB, types) {
  return aspects.some(a => {
    const p1 = normalizePlanetName(a.p1);
    const p2 = normalizePlanetName(a.p2);
    return ((p1 === planetA && p2 === planetB) || (p1 === planetB && p2 === planetA)) && types.includes(a.type);
  });
}

function hasAnyAspectBetween(aspects, planetA, planetB) {
  return aspects.some(a => {
    const p1 = normalizePlanetName(a.p1);
    const p2 = normalizePlanetName(a.p2);
    return (p1 === planetA && p2 === planetB) || (p1 === planetB && p2 === planetA);
  });
}

function tenseAspectCount(aspects, planetName) {
  return aspects.filter(a => {
    const p1 = normalizePlanetName(a.p1);
    const p2 = normalizePlanetName(a.p2);
    return (a.type === 90 || a.type === 180) && (p1 === planetName || p2 === planetName);
  }).length;
}

// ── Прием пищи и завтрак ─────────────────────────────────────────────────────

function formatNumberSpace(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function showFoodPage(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  syncStartFoodFields();
  if (!currentData) return false;

  let ok = true;
  selectedGender = document.getElementById('genderSelect').value;
  selectedWeight = parseFloat(document.getElementById('weightInput').value);
  selectedHeight = parseFloat(document.getElementById('heightInput')?.value || 0);
  selectedAge = parseFloat(document.getElementById('ageInput')?.value || 0);

  if (!selectedGender) {
    ok = false;
    document.getElementById('genderErr').style.display = 'block';
  } else {
    document.getElementById('genderErr').style.display = 'none';
  }

  if (!selectedWeight || selectedWeight <= 0) {
    ok = false;
    document.getElementById('weightErr').style.display = 'block';
  } else {
    document.getElementById('weightErr').style.display = 'none';
  }

  if (!selectedHeight || selectedHeight <= 0) {
    ok = false;
    const el = document.getElementById('heightErr'); if (el) el.style.display = 'block';
  } else {
    const el = document.getElementById('heightErr'); if (el) el.style.display = 'none';
  }

  if (!selectedAge || selectedAge <= 0) {
    ok = false;
    const el = document.getElementById('ageErr'); if (el) el.style.display = 'block';
  } else {
    const el = document.getElementById('ageErr'); if (el) el.style.display = 'none';
  }

  if (!ok) return false;
  document.getElementById('genderBadge').textContent = selectedGender + ' · ' + selectedWeight + ' кг · ' + selectedHeight + ' см · ' + selectedAge + ' лет';
  if (currentData) currentData.userData = {gender:selectedGender, weight:selectedWeight, height:selectedHeight, age:selectedAge};

  const bmr = selectedGender === 'Женский'
    ? (10 * selectedWeight) + (6.25 * selectedHeight) - (5 * selectedAge) - 161
    : (10 * selectedWeight) + (6.25 * selectedHeight) - (5 * selectedAge) + 5;
  const kbjuEl = document.getElementById('kbjuBmrText');
  if (kbjuEl) kbjuEl.textContent = 'Базовый обмен: ' + formatNumberSpace(bmr) + ' ккал в день.';
  if (currentData) { currentData.userData = {gender:selectedGender, weight:selectedWeight, height:selectedHeight, age:selectedAge, bmr:Math.round(bmr), kbjuText:(kbjuEl?kbjuEl.textContent:'')}; localStorage.setItem('astrodisCalcData', JSON.stringify(currentData)); }

  const calc = calcElements(currentData.planets, currentData.asc, currentData.mc);
  const rational = calc.racionalnost;
  const emotional = calc.emotsionalnost;
  const cold = calc.holod;
  const wet = calc.vlazhnost;
  const dry = calc.suhost;
  const controlCold = selectedGender === 'Мужской' ? cold : (cold + wet) / 2;

  let meals = '';
  if (rational > emotional + controlCold) {
    meals = '4 приема';
  } else if ((rational > controlCold && rational > emotional) || (emotional > rational && emotional > controlCold)) {
    meals = '3 приема';
  } else if (controlCold > rational || controlCold > emotional) {
    meals = '2 приема';
  } else {
    meals = 'На усмотрение';
  }
  document.getElementById('foodMeals').textContent = meals;
  document.getElementById('foodFormula').textContent = '';

  if (wet > dry) {
    document.getElementById('breakfastTimeTitle').textContent = 'Ранний завтрак';
    document.getElementById('breakfastTimeText').textContent = 'В течение часа после пробуждения.';
  } else if (dry > wet) {
    document.getElementById('breakfastTimeTitle').textContent = 'Поздний завтрак';
    document.getElementById('breakfastTimeText').textContent = 'Через несколько часов после пробуждения.';
  } else {
    document.getElementById('breakfastTimeTitle').textContent = 'На усмотрение';
    document.getElementById('breakfastTimeText').textContent = 'На усмотрение.';
  }

  if (rational > 11) {
    document.getElementById('breakfastVolumeTitle').textContent = 'Символический завтрак';
    document.getElementById('breakfastVolumeText').textContent = '10 % суточного рациона.';
  } else if (rational > 7 && rational < 11) {
    document.getElementById('breakfastVolumeTitle').textContent = 'Средний завтрак';
    document.getElementById('breakfastVolumeText').textContent = '40 % суточного рациона.';
  } else {
    document.getElementById('breakfastVolumeTitle').textContent = 'Полноценный завтрак';
    document.getElementById('breakfastVolumeText').textContent = '50 % суточного рациона.';
  }

  if (emotional > 11) {
    document.getElementById('lunchVolumeTitle').textContent = 'Символический обед';
    document.getElementById('lunchVolumeText').textContent = '10 % суточного рациона.';
  } else if (emotional > 6 && emotional < 11) {
    document.getElementById('lunchVolumeTitle').textContent = 'Средний обед';
    document.getElementById('lunchVolumeText').textContent = '40 % суточного рациона.';
  } else {
    document.getElementById('lunchVolumeTitle').textContent = 'Полноценный обед';
    document.getElementById('lunchVolumeText').textContent = '50 % суточного рациона.';
  }

  const indicator3 = controlCold;
  if (indicator3 < 6) {
    document.getElementById('dinnerVolumeTitle').textContent = 'Полноценный ужин';
    document.getElementById('dinnerVolumeText').textContent = '50 % суточного рациона.';
  } else if (indicator3 > 6) {
    document.getElementById('dinnerVolumeTitle').textContent = 'Ограниченный ужин';
    document.getElementById('dinnerVolumeText').textContent = 'Количество не должно превышать завтрак и обед.';
  } else {
    document.getElementById('dinnerVolumeTitle').textContent = 'Ужин на усмотрение';
    document.getElementById('dinnerVolumeText').textContent = 'На усмотрение.';
  }

  const sun = currentData.planets.find(p => p.sym === 'n');
  const sunSign = sun ? SIGN_PLAIN[sun.signChar] : '';
  const energySavingSigns = ['Близнецы', 'Рак', 'Весы', 'Скорпион', 'Водолей', 'Рыбы'];
  const energyIntensiveSigns = ['Овен', 'Телец', 'Лев', 'Дева', 'Стрелец', 'Козерог'];

  if (energySavingSigns.includes(sunSign)) {
    document.getElementById('metabolismTitle').textContent = 'Энергосберегающий';
    document.getElementById('metabolismText').textContent = 'Физическая активность после приёма еды. Организм необходимо разогревать после еды.';
  } else if (energyIntensiveSigns.includes(sunSign)) {
    document.getElementById('metabolismTitle').textContent = 'Энергоёмкий';
    document.getElementById('metabolismText').textContent = 'Прием еды после физической активности. Организм должен быть разогретым в момент приема пищи.';
  } else {
    document.getElementById('metabolismTitle').textContent = 'Метаболизм не определён';
    document.getElementById('metabolismText').textContent = 'Не удалось определить знак Солнца.';
  }

  const fireSaltSigns = ['Овен', 'Лев'];
  const lowSaltSigns = ['Водолей', 'Весы'];
  let saltValue = '';
  if (fireSaltSigns.includes(sunSign)) {
    saltValue = '5–10 грамм в день.';
  } else if (lowSaltSigns.includes(sunSign)) {
    saltValue = 'До 5 грамм или бессолевая диета.';
  } else {
    saltValue = '5 грамм.';
  }
  document.getElementById('saltText').textContent = saltValue;

  let waterCoef = 12.5;
  if (rational >= 0 && rational <= 3) waterCoef = 12.5;
  else if (rational >= 4 && rational <= 6) waterCoef = 15;
  else if (rational >= 7 && rational <= 9) waterCoef = 17.5;
  else if (rational >= 10 && rational <= 12) waterCoef = 20;
  else if (rational >= 13 && rational <= 15) waterCoef = 22.5;
  else if (rational >= 16 && rational <= 18) waterCoef = 25;
  const waterMl = Math.round(waterCoef * selectedWeight);
  document.getElementById('waterText').textContent = `${formatNumberSpace(waterMl)} мл в день.`;

  const moon = currentData.planets.find(p => p.sym === 'o');
  const moonSign = moon ? SIGN_PLAIN[moon.signChar] : '';
  const fireMoon = ['Овен', 'Лев', 'Стрелец'];
  const earthMoon = ['Телец', 'Дева', 'Козерог'];
  const airMoon = ['Близнецы', 'Весы', 'Водолей'];
  const waterMoon = ['Рак', 'Скорпион', 'Рыбы'];
  let liquidText = 'Не удалось определить знак Луны.';
  if (fireMoon.includes(moonSign)) {
    liquidText = `${formatNumberSpace(50 * selectedWeight)}–${formatNumberSpace(60 * selectedWeight)} мл в день.`;
  } else if (earthMoon.includes(moonSign)) {
    liquidText = `${formatNumberSpace(50 * selectedWeight)} мл в день.`;
  } else if (airMoon.includes(moonSign)) {
    liquidText = `${formatNumberSpace(40 * selectedWeight)} мл в день.`;
  } else if (waterMoon.includes(moonSign)) {
    liquidText = `${formatNumberSpace(30 * selectedWeight)}–${formatNumberSpace(40 * selectedWeight)} мл в день.`;
  }
  document.getElementById('liquidText').textContent = liquidText;

  let drinkText = '';
  if (rational > emotional) {
    drinkText = 'Обязательно записать все продукты.';
  } else if (rational >= 6 && rational <= 10) {
    drinkText = 'Запивать по желанию.';
  } else if (rational < 6) {
    drinkText = 'Не запивать.';
  } else {
    drinkText = 'На усмотрение.';
  }
  document.getElementById('drinkFoodText').textContent = drinkText;

  const mars = currentData.planets.find(p => p.sym === 'r');
  const marsSign = mars ? SIGN_PLAIN[mars.signChar] : '';
  const vegetarianAllowed = ['Овен', 'Скорпион', 'Козерог'];
  const vegetarianForbidden = ['Телец', 'Рак', 'Весы'];
  let vegetarianText = 'Нейтрально.';
  if (vegetarianAllowed.includes(marsSign)) vegetarianText = 'Можно.';
  else if (vegetarianForbidden.includes(marsSign)) vegetarianText = 'Нельзя.';
  else if (marsSign) vegetarianText = 'Нейтрально.';
  else vegetarianText = 'Не удалось определить знак Марса.';
  document.getElementById('vegetarianText').textContent = vegetarianText;

  const proteinSources = {
    'Овен': 'баранина, свинина',
    'Телец': 'говядина, телятина',
    'Близнецы': 'курица, утка, индейка, гусь',
    'Рак': 'морепродукты',
    'Лев': 'свинина',
    'Дева': 'говядина, кролик',
    'Весы': 'курица, утка, индейка, гусь',
    'Скорпион': 'морепродукты',
    'Стрелец': 'баранина, свинина, конина, оленина',
    'Козерог': 'баранина, говядина',
    'Водолей': 'дикая птица, курица, утка, индейка, гусь',
    'Рыбы': 'морепродукты'
  };
  document.getElementById('proteinSourceText').textContent = marsSign ? (proteinSources[marsSign] || 'не определено') : 'Не удалось определить знак Марса.';

  const jupiter = currentData.planets.find(p => p.sym === 's');
  const jupiterSign = jupiter ? SIGN_PLAIN[jupiter.signChar] : '';
  const fatBalance = jupiter && jupiter.isRetro ? '70 % животных жиров / 30 % растительных жиров' : '50 % животных жиров / 50 % растительных жиров';
  document.getElementById('fatProportionText').textContent = jupiter ? fatBalance : 'Не удалось определить Юпитер.';

  const fatAccumulationSigns = ['Телец', 'Лев', 'Скорпион', 'Водолей'];
  document.getElementById('fatAccumulationText').textContent = jupiterSign
    ? (fatAccumulationSigns.includes(jupiterSign) ? 'Способствуют накоплению жира.' : 'Не выражено.')
    : 'Не удалось определить знак Юпитера.';

  const cholesterolSigns = ['Близнецы', 'Дева', 'Козерог'];
  document.getElementById('cholesterolText').textContent = jupiterSign
    ? (cholesterolSigns.includes(jupiterSign) ? 'Вероятность отложения холестерина на стенках сосудов.' : 'Не выражено.')
    : 'Не удалось определить знак Юпитера.';

  const fullnessControl = selectedGender === 'Мужской' ? cold : (cold + wet) / 2;
  const hasFullnessPredisposition = Math.abs(rational - fullnessControl) < 0.0001;
  document.getElementById('fullnessText').textContent = hasFullnessPredisposition ? 'Предрасположенность к полноте.' : 'Не выражено.';

  const fatSources = {
    'Овен': 'подсолнечное и оливковое масло',
    'Телец': 'жирные сорта рыбы',
    'Близнецы': 'подсолнечное, соевое, кукурузное и хлопковое масло',
    'Рак': 'льняное масло, рыба любая',
    'Лев': 'подсолнечное и оливковое масло',
    'Дева': 'жирные сорта рыбы',
    'Весы': 'подсолнечное, соевое, кукурузное и хлопковое масло',
    'Скорпион': 'льняное масло, рыба любая',
    'Стрелец': 'подсолнечное и оливковое масло',
    'Козерог': 'жирные сорта рыбы',
    'Водолей': 'подсолнечное, соевое, кукурузное и хлопковое масло',
    'Рыбы': 'льняное масло, рыба любая'
  };
  document.getElementById('fatSourceText').textContent = jupiterSign ? (fatSources[jupiterSign] || 'не определено') : 'Не удалось определить знак Юпитера.';

  const aspectsForCalc = visibleAspects();
  const venus = currentData.planets.find(p => p.sym === 'q');
  const venusSign = venus ? SIGN_PLAIN[venus.signChar] : '';
  const fixedSigns = ['Телец', 'Лев', 'Скорпион', 'Водолей'];
  const hyperTriggers = [];
  if (['Дева', 'Скорпион'].includes(venusSign)) hyperTriggers.push(`Венера в знаке ${venusSign}`);
  if (hasAspectBetween(aspectsForCalc, 'Венера', 'Солнце', [0])) hyperTriggers.push('Венера соединение Солнце');
  if (fixedSigns.includes(venusSign) && fixedSigns.includes(jupiterSign)) hyperTriggers.push(`Венера и Юпитер в фиксированных знаках: ${venusSign} / ${jupiterSign}`);
  if (hasAspectBetween(aspectsForCalc, 'Юпитер', 'Нептун', [90, 180])) hyperTriggers.push('Юпитер квадрат / оппозиция Нептун');
  document.getElementById('hyperinsulinText').textContent = hyperTriggers.length ? ('Присутствует.\n' + hyperTriggers.map(x => '• ' + x).join('\n')) : 'Не выражено.';

  const sugarRules = [];
  if (hasAspectBetween(aspectsForCalc, 'Венера', 'Юпитер', [90, 180]) || hasAspectBetween(aspectsForCalc, 'Венера', 'Нептун', [90, 180]) || hasAspectBetween(aspectsForCalc, 'Юпитер', 'Нептун', [90, 180])) sugarRules.push('Запрет на сахарозу');
  if (hasAspectBetween(aspectsForCalc, 'Венера', 'Марс', [90, 180, 0])) sugarRules.push('Запрет на мёд');
  if (hasAspectBetween(aspectsForCalc, 'Венера', 'Хирон', [90, 180])) sugarRules.push('Запрет на сахарозаменитель');
  if (hasAspectBetween(aspectsForCalc, 'Венера', 'Марс', [120, 60])) sugarRules.push('Разрешён мёд');
  if (hasAnyAspectBetween(aspectsForCalc, 'Венера', 'Плутон')) sugarRules.push('Разрешено варенье');
  document.getElementById('sugarRulesText').textContent = sugarRules.length ? sugarRules.map(x => '• ' + x).join('\n') : 'Ограничений и разрешений не найдено.';

  const vitaminRules = [['A', 'Солнце'], ['B1', 'Меркурий'], ['B2', 'Луна'], ['B3 (PP)', 'Венера'], ['B6', 'Юпитер'], ['B9', 'Марс'], ['B12', 'Марс'], ['C', 'Сатурн'], ['D', 'Сатурн'], ['E', 'Венера'], ['K', 'Юпитер']];
  const mineralRules = [['Калий', 'Луна'], ['Медь', 'Венера'], ['Железо', 'Марс'], ['Магний', 'Юпитер'], ['Фосфор', 'Юпитер'], ['Кальций', 'Сатурн'], ['Йод', 'Уран'], ['Фтор', 'Нептун'], ['Цинк', 'Плутон'], ['Селен', 'Плутон']];
  const formatNeeds = rules => {
    const rows = rules
      .map(([name, planet]) => ({ name, planet, count: tenseAspectCount(aspectsForCalc, planet) }))
      .filter(x => x.count >= 2)
      .map(x => `• ${x.name}`);
    return rows.length ? rows.join('\n') : 'Не выявлено.';
  };
  document.getElementById('vitaminsText').textContent = formatNeeds(vitaminRules);
  document.getElementById('mineralsText').textContent = formatNeeds(mineralRules);

  const foodDataBlock = document.getElementById('foodDataBlock');
  if (foodDataBlock) foodDataBlock.style.display = 'none';

  // Экран питания открывается как отдельная страница внутри блока, без перехода Тильды на новый URL.
  const chartSections = document.querySelectorAll('#result > .chart-title, #result > .section-title, #result > .planets-grid, #result > .aspects-section, #result > #indicatorsSection');
  chartSections.forEach(el => { if (el.id !== 'foodPage') el.style.display = 'none'; });

  const foodPage = document.getElementById('foodPage');
  foodPage.style.display = 'block';
  normalizeTextNodes(foodPage);
  window.scrollTo(0, 0);
  return false;
}


// ── Экспорт страницы питания в Word ──────────────────────────────────────────
function exportToWord(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const foodPage = document.getElementById('foodPage');
  if (!foodPage || foodPage.style.display === 'none') {
    alert('Сначала перейдите к расчёту питания.');
    return false;
  }
  const meta = (document.getElementById('chartMeta')?.textContent || '').trim();
  const fileNameBase = (meta.split('·')[0] || 'Расчет_питания')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_') || 'Расчет_питания';
  const clone = foodPage.cloneNode(true);
  clone.querySelectorAll('button, .food-data-actions').forEach(el => el.remove());
  const text = 'Расчёт правильного питания\n' + meta + '\n\n' + (clone.innerText || clone.textContent || '');
  const blob = new Blob(['\ufeff', text], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileNameBase}_питание.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return false;
}

// ── Экран 4: список продуктов ────────────────────────────────────────────────
function makeProductCard(title, items, note) {
  const card = document.createElement('div');
  card.className = 'energy-card wide-card';
  const list = (items || []).map(x => '• ' + x).join('\n');
  card.innerHTML = `
    <div>
      <div class="energy-label">${title}</div>
      ${note ? `<div class="small-note-text" style="margin-bottom:.75rem;">${note}</div>` : ''}
      <div class="energy-formula formula-list">${list}</div>
    </div>`;
  return card;
}

function generateProductsPage() {
  const box = document.getElementById('productsContent');
  if (!box) return;
  box.innerHTML = '';

  const proteinText = (document.getElementById('proteinSourceText')?.textContent || '') + ' ' + (document.getElementById('fatSourceText')?.textContent || '');
  const sugarText = document.getElementById('sugarRulesText')?.textContent || '';
  const vitaminsText = document.getElementById('vitaminsText')?.textContent || '';
  const mineralsText = document.getElementById('mineralsText')?.textContent || '';
  const waterText = document.getElementById('waterText')?.textContent || '';

  const proteinItems = [];
  if (/рыб|морепродукт/i.test(proteinText)) proteinItems.push('рыба', 'лосось', 'скумбрия', 'тунец', 'креветки');
  if (/птиц|кур|индей/i.test(proteinText)) proteinItems.push('курица', 'индейка', 'яйца');
  if (/мяс/i.test(proteinText)) proteinItems.push('говядина', 'телятина', 'печень');
  if (/творог|молоч|сыр/i.test(proteinText)) proteinItems.push('творог', 'греческий йогурт', 'сыр');
  if (!proteinItems.length) proteinItems.push('яйца', 'курица', 'индейка', 'рыба', 'творог', 'бобовые');

  const limitItems = ['фастфуд', 'трансжиры', 'сладкая газировка'];
  if (/сахароз/i.test(sugarText)) limitItems.push('сахар', 'конфеты', 'сладкие напитки');
  if (/м[её]д/i.test(sugarText) && /запрет/i.test(sugarText)) limitItems.push('мёд');
  if (/сахарозамен/i.test(sugarText)) limitItems.push('сахарозаменители');

  const vitaminItems = [];
  if (/A/i.test(vitaminsText)) vitaminItems.push('морковь', 'тыква', 'яичный желток');
  if (/B/i.test(vitaminsText)) vitaminItems.push('гречка', 'овсянка', 'бобовые');
  if (/C/i.test(vitaminsText)) vitaminItems.push('цитрусовые', 'киви', 'болгарский перец');
  if (/D/i.test(vitaminsText)) vitaminItems.push('жирная рыба', 'яйца');
  if (/E/i.test(vitaminsText)) vitaminItems.push('орехи', 'семечки', 'растительные масла');
  if (!vitaminItems.length) vitaminItems.push('зелень', 'овощи', 'ягоды', 'цельные крупы');

  const mineralItems = [];
  if (/Магний/i.test(mineralsText)) mineralItems.push('тыквенные семечки', 'гречка', 'шпинат');
  if (/Железо/i.test(mineralsText)) mineralItems.push('говядина', 'печень', 'гречка');
  if (/Кальций/i.test(mineralsText)) mineralItems.push('творог', 'сыр', 'кунжут');
  if (/Йод/i.test(mineralsText)) mineralItems.push('морская рыба', 'морская капуста');
  if (/Цинк|Селен/i.test(mineralsText)) mineralItems.push('морепродукты', 'яйца', 'орехи');
  if (!mineralItems.length) mineralItems.push('орехи', 'семечки', 'зелень', 'морская рыба');

  const waterItems = ['чистая вода', 'несладкий травяной чай'];
  if (/минерал|соль/i.test(waterText)) waterItems.push('минеральная вода по рекомендации специалиста');

  const cards = [
    ['Белки', Array.from(new Set(proteinItems)), 'Основа для завтрака, обеда и ужина.'],
    ['Жиры', ['оливковое масло', 'сливочное масло', 'авокадо', 'орехи', 'семечки'], 'Добавлять умеренно, без жарки во фритюре.'],
    ['Углеводы', ['гречка', 'рис', 'овсянка', 'картофель', 'цельнозерновой хлеб'], 'Лучше выбирать простые продукты без сладких добавок.'],
    ['Овощи и зелень', ['огурцы', 'кабачок', 'брокколи', 'шпинат', 'листовой салат'], 'Добавлять к основным приемам пищи.'],
    ['Нехватка витаминов', Array.from(new Set(vitaminItems)), vitaminsText && vitaminsText !== 'Не выявлено.' ? 'Подобрано по рассчитанным витаминам.' : 'Базовый поддерживающий набор.'],
    ['Нехватка минералов', Array.from(new Set(mineralItems)), mineralsText && mineralsText !== 'Не выявлено.' ? 'Подобрано по рассчитанным минералам.' : 'Базовый поддерживающий набор.'],
    ['Напитки', waterItems, 'Сладкие напитки лучше не использовать как замену воде.'],
    ['Ограничить', Array.from(new Set(limitItems)), 'Список ограничений формируется с учетом блока сахаров.']
  ];

  cards.forEach(([title, items, note]) => box.appendChild(makeProductCard(title, items, note)));

  const meta = document.getElementById('chartMeta')?.textContent || '';
  const productsMeta = document.getElementById('productsMeta');
  if (productsMeta) productsMeta.textContent = meta;
}

function showProductsPage(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const foodPage = document.getElementById('foodPage');
  if (!foodPage || foodPage.style.display === 'none') {
    alert('Сначала перейдите к расчёту питания.');
    return false;
  }
  generateProductsPage();
  document.getElementById('uploadZone').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('productsPage').style.display = 'block';
  window.scrollTo(0, 0);
  return false;
}

function backToFoodPage(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  document.getElementById('productsPage').style.display = 'none';
  document.getElementById('result').style.display = 'block';
  const foodPage = document.getElementById('foodPage');
  if (foodPage) foodPage.style.display = 'block';
  window.scrollTo(0, 0);
  return false;
}

// ── Сброс ─────────────────────────────────────────────────────────────────────
function resetPage() {
  currentData = null; selectedFile = null; selectedGender = ''; selectedWeight = 0; selectedHeight = 0; selectedAge = 0;
  document.getElementById('fileInput').value = '';
  document.getElementById('fileChosen').textContent = 'Файл не выбран';
  const btn = document.getElementById('uploadBtnLabel');
  btn.style.borderColor = ''; btn.style.color = '';
  document.getElementById('genderSelect').value = '';
  document.getElementById('weightInput').value = '';
  if(document.getElementById('heightInput')) document.getElementById('heightInput').value = '';
  if(document.getElementById('ageInput')) document.getElementById('ageInput').value = '';
  document.getElementById('genderErr').style.display = 'none';
  document.getElementById('weightErr').style.display = 'none';
  const foodPage = document.getElementById('foodPage');
  if (foodPage) foodPage.style.display = 'none';
  const productsPage = document.getElementById('productsPage');
  if (productsPage) productsPage.style.display = 'none';
  const foodDataBlock = document.getElementById('foodDataBlock');
  if (foodDataBlock) foodDataBlock.style.display = 'block';
  document.getElementById('uploadZone').style.display = 'flex';
  document.getElementById('result').style.display = 'none';
  window.scrollTo(0, 0);
}
</script>


