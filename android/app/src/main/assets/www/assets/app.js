/* ==========================================================================
   GATE ECE Study OS — application logic
   Vanilla JavaScript. No build step, no external services required.
   All data stays in localStorage + IndexedDB on this device.
   ========================================================================== */
'use strict';

const APP_VERSION = '2.0.0';
const LS_STATE = 'gateos.state.v2';
const LS_ONBOARDED = 'gateos.onboarded.v2';
const LS_THEME = 'gateos.theme';
const LS_TIMER = 'gateos.timer';
const LS_AI = 'gateos.ai.config';
const LS_PREIMPORT = 'gateos.preimport.backup';
const DB_NAME = 'gateos.images';
const DB_STORE = 'images';

const SRS_INTERVALS = [1, 3, 7, 21, 45];
const TIMER_PRESETS = [25, 50, 90];

const SUBJECTS = [
  { name: 'Engineering Mathematics', section: 1 },
  { name: 'Network Theory', section: 2 },
  { name: 'Signals & Systems', section: 2 },
  { name: 'Electronic Devices (EDC)', section: 3 },
  { name: 'Analog Circuits', section: 4 },
  { name: 'Digital Circuits', section: 5 },
  { name: 'Control Systems', section: 6 },
  { name: 'Communications', section: 7 },
  { name: 'Electromagnetics (EMT)', section: 8 },
  { name: 'General Aptitude', section: 9, ga: true }
];

const CAUSES = [
  { name: 'Conceptual gap', fix: 'Re-read the exact definition, then explain it aloud in 60 seconds without notes.' },
  { name: 'Silly / calculation', fix: 'Write one intermediate line per operation. Re-check units and signs before marking.' },
  { name: 'Formula slip', fix: 'Put the formula on a one-page sheet and derive it once from first principles.' },
  { name: 'Sign / unit error', fix: 'Circle every unit and sign convention at the start of the question.' },
  { name: 'Misread question', fix: 'Underline what is asked and the given values before touching the calculator.' },
  { name: 'Time pressure', fix: 'Set a 90-second cap per 1-mark question; skip and return with clean attention.' },
  { name: 'Distraction / focus loss', fix: 'Phone out of the room, one tab, one subject, one timer block.' },
  { name: 'Incomplete revision', fix: 'Schedule the subtopic for active recall tomorrow and again in 3 days.' }
];

const DISTRACTIONS = [
  { cause: 'Phone / social media', fix: 'Put the phone in another room until the timer ends. One tab, one task.' },
  { cause: 'Daydreaming / overthinking', fix: 'Write the intrusive thought on paper, then solve one easy 1-mark PYQ to restart.' },
  { cause: 'Fatigue / sleepy', fix: 'Stand up, drink water, take a 10-minute walk or a 20-minute nap. Do not push through passive reading.' },
  { cause: 'Noise / room disturbance', fix: 'Use headphones with brown noise or move to a quieter spot for the rest of the block.' },
  { cause: 'Stuck on a hard question', fix: 'Enforce a 6-minute cap: capture it in the vault, mark it, and move on.' },
  { cause: 'Task ambiguity', fix: 'Write the next physical action ("solve Q1–Q10 from…") before resuming.' },
  { cause: 'Emotional / anxious', fix: 'Do 4 slow breaths, then choose the smallest useful 5-minute action.' }
];

const SYLLABUS_DEF = [
  {
    subject: 'Engineering Mathematics', section: 1,
    topics: [
      ['em_la_1', 'Linear Algebra: Vector space, basis, linear dependence and independence'],
      ['em_la_2', 'Linear Algebra: Matrix algebra, eigenvalues, eigenvectors, rank, solution of linear equations'],
      ['em_cal_1', 'Calculus: Mean value theorems, integral calculus theorems, definite and improper integrals'],
      ['em_cal_2', 'Calculus: Partial derivatives, maxima and minima, multiple integrals, line/surface/volume integrals, Taylor series'],
      ['em_de_1', 'Differential Equations: First order (linear and nonlinear), higher order linear ODEs, Euler–Cauchy equation'],
      ['em_de_2', 'Differential Equations: Variation of parameters, complementary function and particular integral, PDEs and boundary value problems'],
      ['em_vec_1', 'Vector Analysis: Vectors in plane and space, vector operations, gradient, divergence and curl'],
      ['em_vec_2', 'Vector Analysis: Gauss’s, Green’s and Stokes’ theorems'],
      ['em_cmp_1', 'Complex Analysis: Analytic functions, Cauchy’s integral theorem and Cauchy’s integral formula'],
      ['em_cmp_2', 'Complex Analysis: Sequences, series, convergence tests, Taylor and Laurent series, residue theorem'],
      ['em_prb_1', 'Probability & Statistics: Mean, median, mode, standard deviation, combinatorial probability'],
      ['em_prb_2', 'Probability & Statistics: Binomial, Poisson, exponential and normal distributions, joint/conditional probability, correlation and regression']
    ]
  },
  {
    subject: 'Network Theory', section: 2,
    topics: [
      ['nt_1', 'Node and mesh analysis, superposition, Thevenin’s theorem, Norton’s theorem, reciprocity'],
      ['nt_2', 'Sinusoidal steady state analysis: phasors, complex power, maximum power transfer'],
      ['nt_3', 'Time and frequency domain analysis of linear circuits: RL, RC and RLC circuits'],
      ['nt_4', 'Solution of network equations using Laplace transform'],
      ['nt_5', 'Linear 2-port network parameters, wye–delta transformation']
    ]
  },
  {
    subject: 'Signals & Systems', section: 2,
    topics: [
      ['ss_1', 'Continuous-time signals: Fourier series and Fourier transform, sampling theorem and applications'],
      ['ss_2', 'Discrete-time signals: DTFT, DFT, z-transform, discrete-time processing of continuous-time signals'],
      ['ss_3', 'LTI systems: definition and properties, causality, stability, impulse response, convolution'],
      ['ss_4', 'LTI systems: poles and zeros, frequency response, group delay, phase delay'],
      ['ss_5', 'Signal transmission through LTI systems, FIR and IIR filter design']
    ]
  },
  {
    subject: 'Electronic Devices (EDC)', section: 3,
    topics: [
      ['edc_1', 'Energy bands in intrinsic and extrinsic semiconductors, equilibrium carrier concentration, direct and indirect band-gap'],
      ['edc_2', 'Carrier transport: diffusion current, drift current, mobility and resistivity, generation and recombination'],
      ['edc_3', 'Poisson and continuity equations'],
      ['edc_4', 'P-N junction, Zener diode, BJT'],
      ['edc_5', 'MOS capacitor, MOSFET, MOSFET scaling'],
      ['edc_6', 'Optoelectronic devices: LED, photodiode and solar cell']
    ]
  },
  {
    subject: 'Analog Circuits', section: 4,
    topics: [
      ['an_1', 'Diode circuits: clipping, clamping and rectifiers'],
      ['an_2', 'BJT and MOSFET amplifiers: biasing, AC coupling, small-signal analysis, frequency response'],
      ['an_3', 'Current mirrors and differential amplifiers'],
      ['an_4', 'Op-amp circuits: amplifiers, summers, differentiators, integrators, active filters, Schmitt triggers and oscillators'],
      ['an_5', 'Feedback amplifiers, dominant-pole (Miller) compensation, phase margin']
    ]
  },
  {
    subject: 'Digital Circuits', section: 5,
    topics: [
      ['dig_1', 'Number representations: binary, integer and floating-point numbers'],
      ['dig_2', 'Combinational circuits: Boolean algebra, K-map minimization, logic gates, static CMOS implementations'],
      ['dig_3', 'Combinational circuits: arithmetic circuits, code converters, multiplexers, decoders'],
      ['dig_4', 'Sequential circuits: latches and flip-flops, counters, shift registers, finite state machines'],
      ['dig_5', 'Timing analysis: propagation delay, setup and hold time, critical path delay'],
      ['dig_6', 'Data converters: sample-and-hold circuits, ADCs and DACs'],
      ['dig_7', 'Semiconductor memories: ROM, SRAM, DRAM'],
      ['dig_8', 'Computer organization: machine instructions and addressing modes, ALU, datapath and control unit, pipelining']
    ]
  },
  {
    subject: 'Control Systems', section: 6,
    topics: [
      ['cs_1', 'Basic control system components; feedback principle; transfer function; block diagram; signal flow graph'],
      ['cs_2', 'Transient and steady-state analysis of LTI systems'],
      ['cs_3', 'Frequency response; Routh–Hurwitz and Nyquist stability criteria; Bode and root-locus plots'],
      ['cs_4', 'Lag, lead and lag–lead compensators; PID controllers'],
      ['cs_5', 'State variable model and solution of state equations of LTI systems']
    ]
  },
  {
    subject: 'Communications', section: 7,
    topics: [
      ['com_1', 'Random processes: autocorrelation and power spectral density, white noise, filtering through LTI systems'],
      ['com_2', 'Analog communications: AM and demodulation, angle modulation and demodulation, spectra of AM and FM, superheterodyne receivers'],
      ['com_3', 'Information theory: entropy, mutual information, channel capacity theorem, source coding'],
      ['com_4', 'Digital communications: PCM, DPCM, ASK, PSK, FSK, QAM, bandwidth, inter-symbol interference'],
      ['com_5', 'MAP and ML detection, matched filter receiver, SNR and BER'],
      ['com_6', 'Fundamentals of error correction, Hamming codes, CRC']
    ]
  },
  {
    subject: 'Electromagnetics (EMT)', section: 8,
    topics: [
      ['emt_1', 'Maxwell’s equations: differential and integral forms, boundary conditions, wave equation, Poynting vector'],
      ['emt_2', 'Plane waves: reflection and refraction, polarization, phase and group velocity, propagation through media, skin depth'],
      ['emt_3', 'Transmission lines: equations, characteristic impedance, matching, impedance transformation, S-parameters, Smith chart'],
      ['emt_4', 'Rectangular and circular waveguides, light propagation in optical fibers'],
      ['emt_5', 'Dipole and monopole antennas, linear antenna arrays']
    ]
  },
  {
    subject: 'General Aptitude', section: 9, ga: true,
    topics: [
      ['ga_v_1', 'Verbal Aptitude: grammar (tenses, articles, adjectives, prepositions, conjunctions, agreement)'],
      ['ga_v_2', 'Verbal Aptitude: vocabulary, idioms, phrases in context, reading comprehension, narrative sequencing'],
      ['ga_q_1', 'Quantitative Aptitude: data interpretation, ratios, percentages, powers, exponents, logarithms'],
      ['ga_q_2', 'Quantitative Aptitude: permutations and combinations, series, mensuration, geometry, elementary statistics and probability'],
      ['ga_a_1', 'Analytical Aptitude: logic (deduction and induction), analogy, numerical relations and reasoning'],
      ['ga_s_1', 'Spatial Aptitude: transformation of shapes, assembling, grouping, paper folding/cutting, 2D and 3D patterns']
    ]
  }
];

/* --------------------------------------------------------------------------
   Utilities
   -------------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(value) { return escapeHtml(value); }

function uid(prefix = 'id') {
  if (window.crypto && typeof crypto.randomUUID === 'function') return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n) || 0)); }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function round(n, places = 1) { const f = 10 ** places; return Math.round((Number(n) || 0) * f) / f; }
function pct(part, total) { return total > 0 ? clamp((part / total) * 100, 0, 100) : 0; }
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

function pad2(n) { return String(n).padStart(2, '0'); }
function isoOf(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function todayISO() { return isoOf(new Date()); }
function parseISODate(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).slice(0, 10));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}
function addDaysISO(iso, days) {
  const d = parseISODate(iso) || new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return isoOf(d);
}
function daysBetweenISO(fromISO, toISO) {
  const a = parseISODate(fromISO), b = parseISODate(toISO);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}
function dateLabel(iso, opts = {}) {
  const d = parseISODate(iso);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...opts });
}
function dateTimeLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(ts) {
  const diff = Date.now() - Number(ts || 0);
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
function dayGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late-night session';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
function daysToExam() {
  const exam = state.profile.examDate;
  if (!exam) return null;
  return daysBetweenISO(todayISO(), exam);
}
function formatMinutes(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
function formatTimer(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) || 0));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}
function secondsToClock(totalSeconds) {
  return formatTimer(totalSeconds);
}
function cssEscape(value) {
  if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, '\\$&');
}
function debounce(fn, wait = 180) {
  let t;
  return function debounced(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}
function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
async function downloadFile(filename, content, mime = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: `${mime};charset=utf-8` });
  // Installed Android app: hand the file to the native "Save as" picker.
  if (window.GateOSNative && typeof window.GateOSNative.saveFile === 'function') {
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const handled = window.GateOSNative.saveFile(filename, mime, bytesToBase64(bytes));
      if (handled) return;
    } catch (err) {
      console.warn('Native save failed, falling back to download', err);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* --------------------------------------------------------------------------
   Icon helper
   -------------------------------------------------------------------------- */
function icon(name, cls = '') {
  return `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

/* --------------------------------------------------------------------------
   Image store (IndexedDB with in-memory fallback)
   -------------------------------------------------------------------------- */
const memoryImages = new Map();
let dbPromise = null;

function openImageDB() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  }).catch((err) => { dbPromise = null; throw err; });
  return dbPromise;
}

const ImageStore = {
  async put(id, dataUrl) {
    if (!id || !dataUrl) return false;
    try {
      const db = await openImageDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(dataUrl, id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (err) {
      memoryImages.set(id, dataUrl);
      return false;
    }
  },
  async get(id) {
    if (!id) return null;
    if (memoryImages.has(id)) return memoryImages.get(id);
    try {
      const db = await openImageDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const req = tx.objectStore(DB_STORE).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) { return memoryImages.get(id) || null; }
  },
  async del(id) {
    if (!id) return;
    memoryImages.delete(id);
    try {
      const db = await openImageDB();
      await new Promise((resolve) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    } catch (err) { /* ignore */ }
  },
  async clear() {
    memoryImages.clear();
    try {
      const db = await openImageDB();
      await new Promise((resolve) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    } catch (err) { /* ignore */ }
  }
};

async function hydrateImages(root = document) {
  const imgs = $$('img[data-img-id]', root).filter((img) => !img.dataset.loaded);
  await Promise.all(imgs.map(async (img) => {
    img.dataset.loaded = '1';
    const data = await ImageStore.get(img.dataset.imgId);
    if (data) img.src = data;
    else img.replaceWith(Object.assign(document.createElement('div'), {
      className: 'tiny faint', textContent: 'Image unavailable'
    }));
  }));
}

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */
function emptySyllabus(expandedFirst = true) {
  return SYLLABUS_DEF.map((def, index) => ({
    subject: def.subject,
    section: def.section,
    ga: !!def.ga,
    expanded: expandedFirst && index === 0,
    topics: def.topics.map(([id, name]) => ({
      id, name, theory: false, notes: false, pyq: false, revisions: 0
    }))
  }));
}

function defaultState() {
  return {
    app: 'gate-os',
    version: 2,
    demo: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    profile: {
      target: '78+ marks (AIR < 50)',
      examDate: '2027-02-07',
      dailyGoalMin: 240,
      focusSubject: 'Signals & Systems',
      notify: false
    },
    syllabus: emptySyllabus(true),
    tasks: [],
    mistakes: [],
    mocks: [],
    journal: [],
    sessions: [],
    distractions: [],
    chat: [],
    meta: {
      fired: {},
      onboarded: false,
      lastReminderCheck: 0,
      lastSuggestion: null
    }
  };
}

const DEMO_PROGRESS = {
  em_la_1: [1, 1, 1, 3], em_la_2: [1, 1, 0, 2], em_cal_1: [1, 0, 0, 1], em_prb_1: [1, 1, 1, 2],
  nt_1: [1, 1, 1, 3], nt_2: [1, 1, 1, 2], nt_3: [1, 1, 0, 1],
  ss_1: [1, 1, 1, 2], ss_3: [1, 1, 1, 3], ss_2: [1, 1, 0, 1],
  edc_1: [1, 1, 1, 2], edc_4: [1, 1, 0, 1], edc_5: [1, 0, 0, 1],
  an_1: [1, 1, 1, 2], an_4: [1, 1, 1, 2],
  dig_2: [1, 1, 1, 3], dig_3: [1, 1, 1, 2], dig_4: [1, 1, 0, 1],
  cs_1: [1, 1, 1, 3], cs_2: [1, 1, 1, 2], cs_3: [1, 1, 0, 1],
  com_3: [1, 1, 1, 2], com_1: [1, 1, 0, 1],
  emt_1: [1, 1, 1, 2], emt_2: [1, 1, 0, 1],
  ga_v_1: [1, 1, 1, 2], ga_q_1: [1, 1, 1, 2], ga_a_1: [1, 1, 0, 1]
};

function buildDemoState() {
  const s = defaultState();
  s.demo = true;
  s.profile.target = '78+ marks (AIR < 50)';
  s.profile.examDate = '2027-02-07';
  s.profile.focusSubject = 'Signals & Systems';
  s.syllabus = emptySyllabus(true).map((block) => ({
    ...block,
    expanded: block.subject === 'Engineering Mathematics' || block.subject === 'Network Theory',
    topics: block.topics.map((t) => {
      const p = DEMO_PROGRESS[t.id];
      return p ? { ...t, theory: !!p[0], notes: !!p[1], pyq: !!p[2], revisions: p[3] } : t;
    })
  }));

  const d = (offset) => addDaysISO(todayISO(), offset);
  s.tasks = [
    { id: 'demo_t1', demo: true, title: 'Solve 25 timed 2-mark PYQs on Nyquist and Bode plots', subject: 'Control Systems', type: 'PYQ practice', priority: 'High', reminderAt: `${todayISO()}T20:00`, done: false, completedAt: null, createdAt: Date.now() - 86400000 },
    { id: 'demo_t2', demo: true, title: 'Revise depletion width and built-in potential formulas', subject: 'Electronic Devices (EDC)', type: 'Revision & notes', priority: 'High', reminderAt: `${todayISO()}T18:30`, done: false, completedAt: null, createdAt: Date.now() - 86400000 },
    { id: 'demo_t3', demo: true, title: 'Complete setup and hold time numericals', subject: 'Digital Circuits', type: 'PYQ practice', priority: 'Medium', reminderAt: '', done: false, completedAt: null, createdAt: Date.now() - 172800000 },
    { id: 'demo_t4', demo: true, title: 'Finish eigenvalues and Cayley–Hamilton PYQ drill', subject: 'Engineering Mathematics', type: 'PYQ practice', priority: 'Medium', reminderAt: '', done: true, completedAt: `${d(-1)}T21:10`, createdAt: Date.now() - 259200000 }
  ];

  s.mistakes = [
    {
      id: 'demo_m1', demo: true,
      title: 'Nyquist: confused N = P − Z with the clockwise encirclement convention',
      subject: 'Control Systems', topicId: 'cs_3', cause: 'Sign / unit error', source: 'PYQ', type: 'MCQ',
      marks: 2, neg: 0.67, opp: 2, lost: 4.67,
      wrong: 'Counted clockwise encirclements as positive and concluded an unstable closed loop was stable.',
      fix: 'Use N_cw = P − Z, where N is clockwise encirclements of −1+j0, P is open-loop RHP poles and Z is closed-loop RHP poles.',
      box: 2, due: todayISO(), revisions: 2, reviewHistory: [],
      createdAt: Date.now() - 4 * 86400000, imageId: null
    },
    {
      id: 'demo_m2', demo: true,
      title: 'MOSFET: assumed saturation without checking V_DS ≥ V_GS − V_th',
      subject: 'Electronic Devices (EDC)', topicId: 'edc_5', cause: 'Conceptual gap', source: 'Mock test', type: 'NAT',
      marks: 2, neg: 0, opp: 2, lost: 4,
      wrong: 'Plugged into the saturation current equation, but the drain voltage forced the device into triode.',
      fix: 'After solving I_D, always verify V_DS ≥ V_GS − V_th. If violated, re-solve with the triode equation.',
      box: 1, due: todayISO(), revisions: 1, reviewHistory: [],
      createdAt: Date.now() - 3 * 86400000, imageId: null
    },
    {
      id: 'demo_m3', demo: true,
      title: 'Two-port parameters: inverted the Z-matrix determinant sign',
      subject: 'Network Theory', topicId: 'nt_5', cause: 'Silly / calculation', source: 'Practice set', type: 'MCQ',
      marks: 2, neg: 0.67, opp: 0, lost: 2.67,
      wrong: 'Wrote the inverse formula as (1/Δ)[[Z22, Z12],[Z21, Z11]] with the wrong off-diagonal signs.',
      fix: 'For Z⁻¹, the off-diagonal entries are −Z12 and −Z21. Write the adjugate explicitly before substituting numbers.',
      box: 3, due: d(2), revisions: 3, reviewHistory: [],
      createdAt: Date.now() - 9 * 86400000, imageId: null
    },
    {
      id: 'demo_m4', demo: true,
      title: 'Fourier transform: dropped the 1/(2π) factor in the inverse transform',
      subject: 'Signals & Systems', topicId: 'ss_1', cause: 'Formula slip', source: 'PYQ', type: 'MCQ',
      marks: 1, neg: 0.33, opp: 1, lost: 2.33,
      wrong: 'Applied the inverse transform without the 1/(2π) scale factor and normalised the answer incorrectly.',
      fix: 'Write the transform pair at the top of every solution page before starting the problem.',
      box: 5, due: d(12), revisions: 6, reviewHistory: [],
      createdAt: Date.now() - 20 * 86400000, imageId: null
    }
  ];

  s.mocks = [
    { id: 'demo_mk1', demo: true, name: 'Full length mock #1', type: 'Full syllabus', date: d(-24), score: 48.33, total: 100, right: 31, wrong: 12, neg: 4.0, notes: 'Ran out of time in EMT and missed two easy GA questions.' },
    { id: 'demo_mk2', demo: true, name: 'Subject test: Networks + Signals', type: 'Subject test', date: d(-17), score: 57.33, total: 100, right: 36, wrong: 9, neg: 3.0, notes: 'Strong on Laplace; lost marks on DTFT properties.' },
    { id: 'demo_mk3', demo: true, name: 'Full length mock #2', type: 'Full syllabus', date: d(-10), score: 63.5, total: 100, right: 39, wrong: 8, neg: 2.67, notes: 'Better accuracy. Waveguide cutoff formulas still shaky.' },
    { id: 'demo_mk4', demo: true, name: 'Full length mock #3', type: 'Full syllabus', date: d(-3), score: 68.67, total: 100, right: 43, wrong: 6, neg: 3.33, notes: 'Best score so far. Need to convert two 2-mark questions I skipped.' }
  ];

  s.journal = [
    { id: 'demo_j1', demo: true, type: 'Win', text: 'Solved 35 Control Systems Bode and root-locus PYQs at 91% accuracy.', fix: 'Keep the same 50-minute block and phone-free setup.', date: d(-1) },
    { id: 'demo_j2', demo: true, type: 'Loss', text: 'Lost 2.67 marks to a sign error in two-port matrix inversion.', fix: 'Write the adjugate explicitly; never skip the intermediate step.', date: d(-2) },
    { id: 'demo_j3', demo: true, type: 'Insight', text: 'Morning blocks produce almost twice the accuracy of late-night blocks.', fix: 'Schedule EMT and Communications numericals before 11 a.m.', date: d(-4) }
  ];

  s.sessions = [-7, -6, -5, -4, -3, -2, -1, 0].map((offset, i) => ({
    id: `demo_s${i}`, demo: true, date: d(offset),
    minutes: [45, 100, 75, 120, 60, 150, 90, 50][i],
    subject: ['Signals & Systems', 'Control Systems', 'Engineering Mathematics', 'Electronic Devices (EDC)', 'Network Theory', 'Communications', 'Digital Circuits', 'Signals & Systems'][i],
    at: `${d(offset)}T${i % 2 ? '19:00' : '08:30'}`, endedAt: null
  }));

  s.distractions = [
    { id: 'demo_d1', demo: true, date: todayISO(), cause: 'Phone / social media', at: new Date().toISOString() },
    { id: 'demo_d2', demo: true, date: d(-1), cause: 'Fatigue / sleepy', at: `${d(-1)}T22:00` }
  ];

  s.chat = [{
    role: 'ai',
    text: 'Welcome to your **GATE ECE Study OS**. I can see your demo data. Ask for a 7-day plan, a weak-subject diagnosis, or use the 2-hour plan when you feel overwhelmed. Everything here works offline.',
    at: Date.now()
  }];

  return s;
}

function normalizeMistake(raw) {
  const type = raw.type || raw.questionType || 'MCQ';
  const marks = clamp(raw.marks != null ? raw.marks : raw.questionMarks, 0, 5);
  const neg = clamp(raw.neg != null ? raw.neg : raw.negativePenaltyMarks, 0, 5);
  const opp = clamp(raw.opp != null ? raw.opp : raw.opportunityLossMarks, 0, 20);
  const box = clamp(raw.box != null ? raw.box : raw.srsBox, 1, 5) || 1;
  const due = String(raw.due || raw.nextReviewDate || todayISO()).slice(0, 10);
  return {
    id: raw.id || uid('m'),
    demo: !!raw.demo,
    title: String(raw.title || 'Untitled mistake').slice(0, 240),
    subject: SUBJECTS.some((s) => s.name === raw.subject) ? raw.subject : SUBJECTS[0].name,
    topicId: raw.topicId || '',
    cause: CAUSES.some((c) => c.name === raw.cause) ? raw.cause
      : (CAUSES.find((c) => c.name.toLowerCase() === String(raw.cause || raw.category || '').toLowerCase())?.name || CAUSES[0].name),
    source: raw.source || 'PYQ',
    type,
    marks, neg, opp,
    lost: raw.lost != null ? Number(raw.lost) : round(marks + (type === 'NAT' ? 0 : neg) + opp, 2),
    wrong: String(raw.wrong || ''),
    fix: String(raw.fix || ''),
    box,
    due,
    revisions: Math.max(0, Math.floor(num(raw.revisions, 0))),
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory.slice(-40) : [],
    createdAt: Number(raw.createdAt) || Date.now(),
    imageId: raw.imageId || null
  };
}

function normalizeTask(raw) {
  let reminderAt = '';
  if (raw.reminderAt) reminderAt = String(raw.reminderAt).slice(0, 16);
  else if (raw.reminderDate) reminderAt = `${raw.reminderDate}T${raw.reminderTime || '09:00'}`;
  return {
    id: raw.id || uid('t'),
    demo: !!raw.demo,
    title: String(raw.title || 'Untitled task').slice(0, 240),
    subject: SUBJECTS.some((s) => s.name === raw.subject) ? raw.subject : SUBJECTS[0].name,
    type: raw.type || 'PYQ practice',
    priority: ['High', 'Medium', 'Low'].includes(raw.priority) ? raw.priority : 'Medium',
    reminderAt,
    done: !!raw.done,
    completedAt: raw.completedAt || null,
    createdAt: Number(raw.createdAt) || Date.now()
  };
}

function normalizeMock(raw) {
  return {
    id: raw.id || uid('mk'),
    demo: !!raw.demo,
    name: String(raw.name || 'Untitled mock').slice(0, 160),
    type: raw.type || 'Full syllabus',
    date: String(raw.date || todayISO()).slice(0, 10),
    score: clamp(raw.score, 0, 1000),
    total: Math.max(1, num(raw.total, 100)),
    right: Math.max(0, Math.floor(num(raw.right, 0))),
    wrong: Math.max(0, Math.floor(num(raw.wrong, 0))),
    neg: Math.max(0, num(raw.neg, 0)),
    notes: String(raw.notes || '')
  };
}

function normalizeJournal(raw) {
  return {
    id: raw.id || uid('j'),
    demo: !!raw.demo,
    type: ['Win', 'Loss', 'Insight'].includes(raw.type) ? raw.type : 'Insight',
    text: String(raw.text || '').slice(0, 400),
    fix: String(raw.fix || '').slice(0, 300),
    date: String(raw.date || todayISO()).slice(0, 10)
  };
}

function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  // Legacy export from the original single-file tracker.
  if (!raw.app && (raw.profile || raw.mistakes || raw.syllabus)) return migrateLegacy(raw);

  base.createdAt = Number(raw.createdAt) || base.createdAt;
  base.updatedAt = Number(raw.updatedAt) || Date.now();
  base.demo = !!raw.demo;
  base.profile = {
    ...base.profile,
    ...(raw.profile || {}),
    dailyGoalMin: clamp(raw.profile?.dailyGoalMin, 15, 900) || 240
  };
  if (!SUBJECTS.some((s) => s.name === base.profile.focusSubject)) base.profile.focusSubject = SUBJECTS[1].name;
  if (!parseISODate(base.profile.examDate)) base.profile.examDate = '2027-02-07';

  // Merge syllabus by stable topic id so future updates never wipe progress.
  const savedSyllabus = Array.isArray(raw.syllabus) ? raw.syllabus : [];
  base.syllabus = emptySyllabus(true).map((block, index) => {
    const savedBlock = savedSyllabus.find((b) => b && b.subject === block.subject);
    return {
      ...block,
      expanded: savedBlock ? !!savedBlock.expanded : index === 0,
      topics: block.topics.map((topic) => {
        const saved = savedBlock?.topics?.find((t) => t && (t.id === topic.id || t.name === topic.name));
        if (!saved) return topic;
        return {
          ...topic,
          theory: !!saved.theory,
          notes: !!saved.notes,
          pyq: !!saved.pyq,
          revisions: Math.max(0, Math.floor(num(saved.revisions, 0)))
        };
      })
    };
  });

  base.tasks = Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [];
  base.mistakes = Array.isArray(raw.mistakes) ? raw.mistakes.map(normalizeMistake) : [];
  base.mocks = Array.isArray(raw.mocks) ? raw.mocks.map(normalizeMock) : [];
  base.journal = Array.isArray(raw.journal) ? raw.journal.map(normalizeJournal) : [];
  base.sessions = Array.isArray(raw.sessions)
    ? raw.sessions.filter((s) => s && s.date && Number(s.minutes) > 0).map((s) => ({
        id: s.id || uid('s'), demo: !!s.demo, date: String(s.date).slice(0, 10),
        minutes: clamp(s.minutes, 1, 900), subject: s.subject || base.profile.focusSubject,
        at: s.at || `${String(s.date).slice(0, 10)}T09:00`, endedAt: s.endedAt || null
      }))
    : [];
  base.distractions = Array.isArray(raw.distractions)
    ? raw.distractions.filter(Boolean).map((d) => ({
        id: d.id || uid('d'), demo: !!d.demo, date: String(d.date || todayISO()).slice(0, 10),
        cause: String(d.cause || 'Unknown'),
        at: d.at || new Date().toISOString()
      }))
    : [];
  base.chat = Array.isArray(raw.chat)
    ? raw.chat.filter((m) => m && typeof m.text === 'string').slice(-60).map((m) => ({
        role: m.role === 'me' || m.role === 'user' ? 'me' : 'ai',
        text: String(m.text).slice(0, 6000),
        at: Number(m.at) || Date.now()
      }))
    : [];
  base.meta = { ...base.meta, ...(raw.meta || {}) };
  base.meta.fired = (raw.meta && typeof raw.meta.fired === 'object') ? raw.meta.fired : {};
  return base;
}

function migrateLegacy(raw) {
  const s = defaultState();
  s.demo = !!raw.isDemoData;
  s.createdAt = Date.now();
  s.profile.target = raw.profile?.targetMarks || raw.profile?.target || s.profile.target;
  s.profile.examDate = raw.profile?.examDate || s.profile.examDate;
  s.profile.notify = false;

  const legacySyllabus = Array.isArray(raw.syllabus) ? raw.syllabus : [];
  s.syllabus = s.syllabus.map((block, index) => {
    const old = legacySyllabus.find((b) => b.subject === block.subject);
    return {
      ...block,
      expanded: old ? !!old.expanded : index === 0,
      topics: block.topics.map((t) => {
        const ot = old?.topics?.find((x) => x.id === t.id);
        return ot ? { ...t, theory: !!ot.theory, notes: !!ot.notes, pyq: !!ot.pyq, revisions: Math.max(0, Math.floor(num(ot.revisions, 0))) } : t;
      })
    };
  });

  s.tasks = (raw.tasks || []).map(normalizeTask);
  s.mistakes = (raw.mistakes || []).map((m) => normalizeMistake({
    ...m,
    marks: m.questionMarks,
    neg: m.negativePenaltyMarks,
    opp: m.opportunityLossMarks,
    box: m.srsBox,
    due: m.nextReviewDate,
    createdAt: m.createdAt || (m.date ? parseISODate(m.date)?.getTime() : Date.now())
  }));
  s.mocks = (raw.mocks || []).map(normalizeMock);
  s.journal = (raw.journal || []).map(normalizeJournal);
  s.sessions = (raw.focusSessions || []).map((f) => ({
    id: f.id || uid('s'),
    date: f.localDate || isoOf(new Date(f.endedAt || Date.now())),
    minutes: Math.max(1, Math.round((f.durationSeconds || 1500) / 60)),
    subject: f.subject || 'Signals & Systems',
    at: new Date(f.endedAt || Date.now()).toISOString(),
    endedAt: f.endedAt || null
  }));
  s.distractions = (raw.distractionEvents || []).map((d) => ({
    id: d.id || uid('d'), date: d.localDate || todayISO(),
    cause: d.cause || 'Unknown', at: new Date(d.createdAt || Date.now()).toISOString()
  }));
  s.chat = (raw.chatHistory || []).slice(-20).map((m) => ({
    role: m.role === 'user' ? 'me' : 'ai', text: String(m.text || ''), at: Date.now()
  }));
  if (raw.profile?.streakDays) {
    s.profile.legacyStreak = raw.profile.streakDays;
  }
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not load state:', err);
    return null;
  }
}

function saveState() {
  state.updatedAt = Date.now();
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Could not save state:', err);
    toast('Storage is full. Export a backup and remove old screenshots.', 'error', null, 8000);
    return false;
  }
}

let state = loadState() || defaultState();

function hasDemoContent() {
  return !!(state.demo
    || state.tasks.some((t) => t.demo)
    || state.mistakes.some((m) => m.demo)
    || state.mocks.some((m) => m.demo)
    || state.journal.some((j) => j.demo)
    || state.sessions.some((s) => s.demo)
    || state.distractions.some((d) => d.demo));
}

/* --------------------------------------------------------------------------
   Derived data
   -------------------------------------------------------------------------- */
function allTopics() {
  return state.syllabus.flatMap((block, si) => block.topics.map((t) => ({ ...t, subject: block.subject, section: block.section, ga: block.ga, blockIndex: si })));
}
function findTopic(topicId) {
  for (const block of state.syllabus) {
    const t = block.topics.find((x) => x.id === topicId);
    if (t) return { topic: t, block };
  }
  return null;
}
function subjectProgress(block) {
  if (!block || !block.topics.length) return 0;
  const sum = block.topics.reduce((acc, t) => acc + ((t.theory ? 1 : 0) + (t.notes ? 1 : 0) + (t.pyq ? 1 : 0)) / 3, 0);
  return Math.round((sum / block.topics.length) * 100);
}
function ecSyllabusProgress() {
  const bySection = new Map();
  for (const block of state.syllabus) {
    if (block.ga) continue;
    const value = subjectProgress(block);
    if (!bySection.has(block.section)) bySection.set(block.section, []);
    bySection.get(block.section).push(value);
  }
  const sectionAverages = [...bySection.values()].map((arr) => arr.reduce((a, b) => a + b, 0) / arr.length);
  return sectionAverages.length ? Math.round(sectionAverages.reduce((a, b) => a + b, 0) / sectionAverages.length) : 0;
}
function gaProgress() {
  const ga = state.syllabus.find((b) => b.ga);
  return ga ? subjectProgress(ga) : 0;
}
function topicsBySubject(subject) {
  return state.syllabus.find((b) => b.subject === subject)?.topics || [];
}
function topicNameOf(id) {
  return findTopic(id)?.topic?.name || '';
}

function dueMistakes() {
  const today = todayISO();
  return state.mistakes
    .filter((m) => m.due <= today)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)) || a.box - b.box);
}
function activeMistakes() { return state.mistakes.filter((m) => m.box < 5); }
function masteredMistakes() { return state.mistakes.filter((m) => m.box >= 5); }

function todayStats() {
  const today = todayISO();
  const mins = state.sessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0);
  const distractions = state.distractions.filter((d) => d.date === today).length;
  const tasksDone = state.tasks.filter((t) => t.done && String(t.completedAt || '').slice(0, 10) === today).length;
  const pending = state.tasks.filter((t) => !t.done && (!t.reminderAt || t.reminderAt.slice(0, 10) <= today));
  const reviews = state.mistakes.reduce((acc, m) => acc + (m.reviewHistory || []).filter((r) => String(r.date).slice(0, 10) === today).length, 0);
  return { mins, distractions, tasksDone, pending, reviews };
}

function streakDays() {
  const active = new Set();
  state.sessions.forEach((s) => { if (s.minutes >= 5) active.add(s.date); });
  state.tasks.forEach((t) => { if (t.done && t.completedAt) active.add(String(t.completedAt).slice(0, 10)); });
  state.mistakes.forEach((m) => (m.reviewHistory || []).forEach((r) => active.add(String(r.date).slice(0, 10))));
  let cursor = todayISO();
  let streak = 0;
  if (!active.has(cursor)) {
    cursor = addDaysISO(cursor, -1);
    if (!active.has(cursor)) return 0;
  }
  while (active.has(cursor) && streak < 3650) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

function mockAccuracy() {
  const right = state.mocks.reduce((a, m) => a + m.right, 0);
  const wrong = state.mocks.reduce((a, m) => a + m.wrong, 0);
  return { right, wrong, accuracy: right + wrong > 0 ? Math.round((right / (right + wrong)) * 100) : 0 };
}

function latestMock() {
  return [...state.mocks].sort((a, b) => String(a.date).localeCompare(String(b.date))).at(-1) || null;
}

function sortedMocks() {
  return [...state.mocks].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function lostBySubject() {
  const map = new Map();
  state.mistakes.filter((m) => m.box < 5).forEach((m) => {
    map.set(m.subject, (map.get(m.subject) || 0) + (Number(m.lost) || 0));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
function lostByCause() {
  const map = new Map();
  state.mistakes.filter((m) => m.box < 5).forEach((m) => {
    map.set(m.cause, (map.get(m.cause) || 0) + (Number(m.lost) || 0));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
function topWeakTopics(limit = 5) {
  const map = new Map();
  state.mistakes.filter((m) => m.box < 5).forEach((m) => {
    const topic = m.topicId ? topicNameOf(m.topicId) : '';
    const key = topic || `${m.subject} · general`;
    const entry = map.get(key) || { title: key, subject: m.subject, lost: 0, count: 0 };
    entry.lost += Number(m.lost) || 0;
    entry.count++;
    map.set(key, entry);
  });
  return [...map.values()].sort((a, b) => b.lost - a.lost).slice(0, limit);
}
function tasksForToday() {
  const today = todayISO();
  const pending = state.tasks.filter((t) => !t.done)
    .sort((a, b) => {
      const ar = a.reminderAt || '9999', br = b.reminderAt || '9999';
      return ar.localeCompare(br);
    });
  const due = pending.filter((t) => t.reminderAt && t.reminderAt.slice(0, 10) <= today);
  return [...due, ...pending.filter((t) => !due.includes(t))].slice(0, 5);
}
function weeklyData() {
  const today = todayISO();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const iso = addDaysISO(today, -i);
    const d = parseISODate(iso);
    days.push({
      iso,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      minutes: state.sessions.filter((s) => s.date === iso).reduce((a, s) => a + s.minutes, 0),
      tasks: state.tasks.filter((t) => t.done && String(t.completedAt || '').slice(0, 10) === iso).length,
      reviews: state.mistakes.reduce((a, m) => a + (m.reviewHistory || []).filter((r) => String(r.date).slice(0, 10) === iso).length, 0),
      mocks: state.mocks.filter((m) => m.date === iso).length
    });
  }
  return days;
}

/* --------------------------------------------------------------------------
   Toast & dialogs
   -------------------------------------------------------------------------- */
function toast(message, type = 'info', action = null, duration = 4200) {
  const wrap = $('#toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert' : type === 'warn' ? 'alert' : 'info';
  el.innerHTML = `${icon(iconName)}<div class="grow">${escapeHtml(message)}</div>`;
  if (action && typeof action === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'undo'; btn.textContent = 'Undo';
    btn.addEventListener('click', () => { action(); el.remove(); });
    el.appendChild(btn);
  }
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    el.style.transition = 'opacity .2s, transform .2s';
    setTimeout(() => el.remove(), 220);
  }, Math.max(1500, duration));
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}

let confirmHandler = null;
function confirmAction({ title, body, confirmText = 'Confirm', danger = false, onConfirm }) {
  $('#confirmTitle').textContent = title || 'Confirm';
  $('#confirmSub').textContent = 'This action needs confirmation.';
  $('#confirmBody').innerHTML = body || '';
  const ok = $('#confirmOkBtn');
  ok.textContent = confirmText;
  ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
  confirmHandler = typeof onConfirm === 'function' ? onConfirm : null;
  openDialog('confirmDialog');
}

function themeIconName() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'moon' : 'sun';
}

function applyTheme(theme, persist = true) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'light' ? '#f4f7fc' : '#080b12');
  $$('[data-theme-icon] use').forEach((use) => use.setAttribute('href', `#i-${next === 'light' ? 'moon' : 'sun'}`));
  if (persist) { try { localStorage.setItem(LS_THEME, next); } catch (err) { /* ignore */ } }
}

function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

/* --------------------------------------------------------------------------
   Rendering — shell, sidebar, navigation
   -------------------------------------------------------------------------- */
const VIEW_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Your GATE ECE command center' },
  planner: { title: 'Planner & syllabus', subtitle: 'Tasks, reminders and subtopic-level progress' },
  vault: { title: 'Mistake vault', subtitle: 'Capture the trap, write the fix, review on schedule' },
  tests: { title: 'Tests & journal', subtitle: 'Mock scores, lessons and honest reflection' },
  coach: { title: 'AI study coach', subtitle: 'Private, data-driven guidance — offline by default' }
};
let currentView = 'dashboard';

function switchView(view, { scroll = true } = {}) {
  if (!VIEW_META[view]) view = 'dashboard';
  currentView = view;
  $$('.view').forEach((el) => el.classList.toggle('active', el.dataset.view === view));
  $$('[data-nav]').forEach((btn) => {
    if (btn.dataset.nav === view) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  $('#pageTitle').textContent = VIEW_META[view].title;
  $('#pageSubtitle').textContent = VIEW_META[view].subtitle;
  try { history.replaceState(null, '', `${location.pathname}${location.search}#${view}`); } catch (err) { /* file:// may block */ }
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'auto' : 'auto' });
  renderView(view);
  if (view === 'vault') hydrateImages();
}

function renderView(view) {
  switch (view) {
    case 'dashboard': renderDashboard(); break;
    case 'planner': renderPlanner(); break;
    case 'vault': renderVault(); break;
    case 'tests': renderTests(); break;
    case 'coach': renderCoach(); break;
  }
}

function renderShell() {
  const tasks = state.tasks.filter((t) => !t.done);
  const due = dueMistakes().length;
  const active = activeMistakes().length;
  $('#sideTaskBadge').textContent = tasks.length;
  $('#sideVaultBadge').textContent = active;
  $('#sideDueBadge').textContent = due;
  const mob = $('#mobileVaultBadge');
  mob.textContent = due;
  mob.hidden = due === 0;
  $('#sideSyllabusPct').textContent = `${ecSyllabusProgress()}%`;
  $('#sideSyllabusBar').style.width = `${ecSyllabusProgress()}%`;
  $('#sideTarget').textContent = state.profile.target;
  const left = daysToExam();
  $('#sideDaysLeft').textContent = left == null ? '—' : (left >= 0 ? left : 0);
  $('#examChipText').textContent = left == null ? 'Set exam date' : left > 1 ? `D-${left}` : left === 1 ? 'D-1' : left === 0 ? 'Exam today' : 'Exam passed';
  $('#examChip').title = left == null ? 'Set your exam date in Settings' : `${Math.abs(left)} days ${left < 0 ? 'since' : 'to'} ${dateLabel(state.profile.examDate, { year: 'numeric' })}`;
  $('#syllabusOverallChip').innerHTML = `${icon('layers', 'i-sm')} ${ecSyllabusProgress()}% EC · ${gaProgress()}% GA`;
  renderDemoBanners();
}

function renderDemoBanners() {
  const ids = ['demoBannerSlot', 'demoBannerSlotPlanner', 'demoBannerSlotVault', 'demoBannerSlotTests'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!hasDemoContent()) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="demo-banner">${icon('info', 'i-sm')} You are exploring demo data. Nothing here is real progress.
      <button class="btn btn-sm btn-ghost" type="button" data-clear-demo>Remove demo data</button></div>`;
  });
}

/* --------------------------------------------------------------------------
   Dashboard
   -------------------------------------------------------------------------- */
function renderDashboard() {
  renderHero();
  renderOverview();
  renderKpis();
  renderSubjectBars();
  renderWeakPanel();
  renderDueQueue();
  renderDashTasks();
  renderDashMistakes();
  renderWeeklyReview();
  syncTimerUI();
}

function renderHero() {
  const el = $('#heroCard');
  if (!el) return;
  const left = daysToExam();
  const t = todayStats();
  const goal = Math.max(15, Number(state.profile.dailyGoalMin) || 240);
  const goalPct = Math.round(pct(t.mins, goal));
  const due = dueMistakes().length;
  const streak = streakDays();

  el.innerHTML = `
    <div class="hero">
      <div class="hero-top">
        <div style="min-width:0">
          <div class="hero-eyebrow">${icon('sparkles', 'i-sm')} ${escapeHtml(dayGreeting())} · ${escapeHtml(dateLabel(todayISO(), { weekday: 'long' }))}</div>
          <h2>${left == null ? 'Set your exam date and start the clock.' : left > 0 ? `${left} days to make this count.` : left === 0 ? 'Exam day. Trust the reps.' : 'The exam has passed — archive or reset when ready.'}</h2>
          <p class="hero-sub">${due > 0
            ? `${plural(due, 'card is', 'cards are')} due for active recall. Clear those first — recall beats rereading.`
            : `No reviews due. Use the open space to attempt a timed PYQ set or close a syllabus gap.`}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button" data-start-focus>${icon('play')} Start focus</button>
            <button class="btn" type="button" data-new-mistake>${icon('plus')} Log mistake</button>
            <button class="btn btn-ghost" type="button" data-go="coach">${icon('sparkles')} Ask coach</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span>Streak</span><strong>${streak}d</strong></div>
          <div class="hero-stat"><span>Today focus</span><strong>${formatMinutes(t.mins)}</strong></div>
          <div class="hero-stat"><span>Due reviews</span><strong>${due}</strong></div>
          <div class="hero-stat"><span>Target</span><strong style="font-size:12px">${escapeHtml(state.profile.target)}</strong></div>
        </div>
      </div>
      <div class="hero-progress">
        <div class="row-between" style="margin-bottom:5px">
          <span class="tiny muted">Daily focus goal · ${formatMinutes(t.mins)} / ${formatMinutes(goal)}</span>
          <span class="tiny mono muted">${goalPct}%</span>
        </div>
        <div class="progress"><span style="width:${goalPct}%"></span></div>
      </div>
    </div>`;
}

function renderOverview() {
  const el = $('#dashOverview');
  if (!el) return;
  const t = todayStats();
  const due = dueMistakes();
  const pending = state.tasks.filter((x) => !x.done);
  const overdue = pending.filter((x) => x.reminderAt && x.reminderAt < localNowMinute());
  const preview = due.slice(0, 2);
  const goal = Math.max(15, Number(state.profile.dailyGoalMin) || 240);
  const goalPct = Math.round(pct(t.mins, goal));

  el.innerHTML = `
    <div class="card" style="height:100%">
      <div class="card-head">
        <div>
          <h3>${icon('zap')} Today at a glance</h3>
          <p>${overdue.length ? `${overdue.length === 1 ? 'One task is' : `${overdue.length} tasks are`} past the reminder time.` : 'Small, specific actions beat vague intentions.'}</p>
        </div>
        <span class="chip ${goalPct >= 100 ? 'emerald' : 'sky'}">${goalPct}%</span>
      </div>
      <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <div class="week-stat"><span>Focus today</span><strong>${formatMinutes(t.mins)}</strong></div>
        <div class="week-stat"><span>Reviews done</span><strong>${t.reviews}</strong></div>
        <div class="week-stat"><span>Pending tasks</span><strong>${pending.length}</strong></div>
        <div class="week-stat"><span>Cards due</span><strong style="color:${due.length ? 'var(--warn)' : 'var(--success)'}">${due.length}</strong></div>
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:7px;margin-top:10px">
        <button class="btn btn-sm" type="button" data-quick-focus="25">${icon('play')} 25m sprint</button>
        <button class="btn btn-sm" type="button" data-start-deck>${icon('layers')} Review ${due.length || ''}</button>
        <button class="btn btn-sm" type="button" data-new-mistake>${icon('plus')} New mistake</button>
        <button class="btn btn-sm" type="button" data-go="planner">${icon('calendar')} Plan task</button>
      </div>
      <div class="divider"></div>
      <div class="row-between" style="margin-bottom:6px">
        <span class="tiny" style="font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">Next due review</span>
        <button class="tiny btn btn-ghost btn-sm" type="button" data-go="vault">Open vault</button>
      </div>
      ${preview.length ? preview.map((m) => `
        <div class="review-row" style="margin-top:6px">
          <span class="num">B${m.box}</span>
          <div class="grow">
            <h4>${escapeHtml(m.title)}</h4>
            <p>${escapeHtml(m.subject)} · ${m.due < todayISO() ? `${daysBetweenISO(m.due, todayISO())}d overdue` : 'due today'}</p>
          </div>
          <button class="btn btn-sm" type="button" data-review="${escapeAttr(m.id)}">Review</button>
        </div>`).join('') : `
        <div class="empty" style="padding:16px 10px">${icon('check-circle')}<strong>Queue is clear</strong><span>Reviewing ahead is allowed. Your future self will thank you.</span></div>`}
    </div>`;
}

function renderKpis() {
  const el = $('#kpiGrid');
  if (!el) return;
  const acc = mockAccuracy();
  const active = activeMistakes();
  const due = dueMistakes();
  const risk = active.reduce((a, m) => a + (Number(m.lost) || 0), 0);
  const ec = ecSyllabusProgress();
  const ga = gaProgress();
  const mocks = sortedMocks();
  const latest = mocks.at(-1);
  const prev = mocks.at(-2);
  const delta = latest && prev ? latest.score - prev.score : null;
  const pending = state.tasks.filter((t) => !t.done).length;

  el.innerHTML = `
    <div class="kpi">
      <div class="kpi-top"><span class="kpi-label">Mock accuracy</span><span class="kpi-icon emerald">${icon('target')}</span></div>
      <div class="kpi-value"><strong style="color:var(--success)">${acc.accuracy}%</strong><small>${acc.right + acc.wrong ? 'correct ÷ attempted' : 'no attempts'}</small></div>
      <div class="progress success thin"><span style="width:${acc.accuracy}%"></span></div>
      <div class="kpi-foot"><span>${acc.right} right</span><span>${acc.wrong} wrong</span></div>
    </div>
    <div class="kpi">
      <div class="kpi-top"><span class="kpi-label">Mistake vault</span><span class="kpi-icon rose">${icon('shield')}</span></div>
      <div class="kpi-value"><strong style="color:var(--danger)">${active.length}</strong><small>active</small></div>
      <div class="progress danger thin"><span style="width:${pct(due.length, Math.max(active.length, 1))}%"></span></div>
      <div class="kpi-foot"><span>${due.length} due now</span><span>${round(risk, 1)}M at risk</span></div>
    </div>
    <div class="kpi">
      <div class="kpi-top"><span class="kpi-label">Syllabus mastery</span><span class="kpi-icon sky">${icon('layers')}</span></div>
      <div class="kpi-value"><strong style="color:var(--accent)">${ec}%</strong><small>EC core</small></div>
      <div class="progress thin"><span style="width:${ec}%"></span></div>
      <div class="kpi-foot"><span>GA ${ga}%</span><span>${pending} open tasks</span></div>
    </div>
    <div class="kpi">
      <div class="kpi-top"><span class="kpi-label">Latest mock</span><span class="kpi-icon indigo">${icon('chart')}</span></div>
      <div class="kpi-value"><strong style="color:var(--accent-2)">${latest ? round(latest.score, 1) : '—'}</strong><small>${latest ? `/ ${latest.total}` : 'not logged'}</small></div>
      <div class="kpi-foot">
        <span>${delta == null ? 'First data point' : `${delta >= 0 ? '↑' : '↓'} ${round(Math.abs(delta), 1)} vs prev`}</span>
        <span>${mocks.length} mocks</span>
      </div>
    </div>`;
}

function renderSubjectBars() {
  const el = $('#subjectBars');
  if (!el) return;
  el.innerHTML = state.syllabus.map((block) => {
    const p = subjectProgress(block);
    const sectionLabel = block.ga ? 'GA' : `Sec ${block.section}${block.section === 2 ? (block.subject === 'Network Theory' ? 'A' : 'B') : ''}`;
    return `
      <button type="button" class="subject-row" data-jump-subject="${escapeAttr(block.subject)}" style="border:0;background:transparent;padding:0;text-align:left;width:100%;cursor:pointer">
        <span class="name"><span class="faint mono" style="font-size:9.5px;margin-right:4px">${sectionLabel}</span>${escapeHtml(block.subject)}</span>
        <span class="pct">${p}%</span>
        <span class="bar progress thin ${p >= 70 ? 'success' : ''}"><span style="width:${p}%"></span></span>
      </button>`;
  }).join('');
}

function renderWeakPanel() {
  const el = $('#weakPanel');
  if (!el) return;
  const weak = topWeakTopics(4);
  const causes = lostByCause().slice(0, 4);
  const totalLost = activeMistakes().reduce((a, m) => a + (Number(m.lost) || 0), 0);
  if (!weak.length) {
    el.innerHTML = `<div class="empty">${icon('target')}<strong>No leaks logged yet</strong><span>Add the next question you get wrong to see your real weak spots.</span><button class="btn btn-sm btn-primary mt-2" type="button" data-new-mistake>${icon('plus')} Log first mistake</button></div>`;
    return;
  }
  const maxLost = Math.max(...weak.map((w) => w.lost), 1);
  el.innerHTML = `
    <div class="row-between" style="margin-bottom:8px">
      <span class="tiny" style="font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">${icon('flame', 'i-sm')} Top topics by marks at risk</span>
      <span class="chip rose">${round(totalLost, 1)}M</span>
    </div>
    ${weak.map((w) => `
      <div class="bar-row">
        <span class="bar-label" title="${escapeAttr(w.title)}">${escapeHtml(w.title)}</span>
        <span class="bar-val">${round(w.lost, 1)}M</span>
        <span class="bar progress danger thin"><span style="width:${Math.max(4, Math.round((w.lost / maxLost) * 100))}%"></span></span>
      </div>`).join('')}
    <div class="divider"></div>
    <div class="tiny" style="font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Root causes</div>
    ${causes.map(([name, lost], i) => `
      <div class="bar-row">
        <span class="bar-label">${escapeHtml(name)}</span>
        <span class="bar-val">${round(lost, 1)}M</span>
        <span class="bar progress thin"><span style="width:${Math.max(4, Math.round((lost / (causes[0]?.[1] || 1)) * 100))}%"></span></span>
      </div>`).join('')}`;
}

function renderDueQueue() {
  const el = $('#dueQueue');
  if (!el) return;
  const due = dueMistakes();
  if (!due.length) {
    el.innerHTML = `<div class="empty">${icon('check-circle')}<strong>Nothing due today</strong><span>You can still run the full deck to practise ahead of schedule.</span><button class="btn btn-sm mt-2" type="button" data-start-deck>Review anyway</button></div>`;
    return;
  }
  const shown = due.slice(0, 5);
  el.innerHTML = `
    <div class="list">
      ${shown.map((m, i) => {
        const overdue = daysBetweenISO(m.due, todayISO());
        return `
        <div class="review-row">
          <span class="num">${i + 1}</span>
          <div class="grow">
            <h4>${escapeHtml(m.title)}</h4>
            <p>${escapeHtml(m.subject)} · Box ${m.box} · ${overdue > 0 ? `${overdue}d overdue` : 'due today'} · ${m.revisions} reviews</p>
          </div>
          <button class="btn btn-sm btn-primary" type="button" data-review="${escapeAttr(m.id)}">Review</button>
        </div>`;
      }).join('')}
    </div>
    <div class="row-between mt-3">
      <span class="tiny muted">${due.length > shown.length ? `${due.length - shown.length} more waiting` : `${due.length} in the queue`}</span>
      <button class="btn btn-sm" type="button" data-start-deck>${icon('layers')} Full deck</button>
    </div>`;
}

function renderDashTasks() {
  const el = $('#dashTasks');
  if (!el) return;
  const tasks = tasksForToday();
  if (!tasks.length) {
    el.innerHTML = `<div class="empty">${icon('calendar')}<strong>No open tasks</strong><span>Assign one measurable task for today. Two hours of specifics beats a day of intention.</span><button class="btn btn-sm btn-primary mt-2" type="button" data-go="planner">${icon('plus')} Plan a task</button></div>`;
    return;
  }
  el.innerHTML = tasks.map((t) => taskRowHTML(t, true)).join('');
}

function renderDashMistakes() {
  const el = $('#dashMistakes');
  if (!el) return;
  const recent = [...state.mistakes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  if (!recent.length) {
    el.innerHTML = `<div class="empty">${icon('shield')}<strong>No traps captured yet</strong><span>The vault is empty. Add a wrong question with its exact fix to make it useful.</span><button class="btn btn-sm btn-primary mt-2" type="button" data-new-mistake>${icon('plus')} Log mistake</button></div>`;
    return;
  }
  el.innerHTML = recent.map((m) => `
    <button class="list-item" type="button" data-vault-open="${escapeAttr(m.id)}" style="width:100%;text-align:left;cursor:pointer">
      <span class="kpi-icon rose" style="width:26px;height:26px;margin-top:1px">${icon('shield', 'i-sm')}</span>
      <span class="grow" style="flex:1;min-width:0">
        <h4 style="margin:0;font-size:12.5px;font-weight:650;line-height:1.35">${escapeHtml(m.title)}</h4>
        <span class="meta"><span class="chip dim">${escapeHtml(m.subject)}</span><span class="chip ${m.box >= 5 ? 'emerald' : 'amber'}">Box ${m.box}</span><span class="chip rose">${round(m.lost, 1)}M</span></span>
      </span>
      ${icon('chevron-right', 'i-sm')}
    </button>`).join('');
}

function renderWeeklyReview() {
  const el = $('#weeklyReview');
  if (!el) return;
  const days = weeklyData();
  const totalFocus = days.reduce((a, d) => a + d.minutes, 0);
  const totalTasks = days.reduce((a, d) => a + d.tasks, 0);
  const totalReviews = days.reduce((a, d) => a + d.reviews, 0);
  const mocks = days.reduce((a, d) => a + d.mocks, 0);
  const maxMin = Math.max(1, ...days.map((d) => d.minutes));
  const today = todayISO();
  const best = [...days].sort((a, b) => b.minutes - a.minutes)[0];
  const avg = Math.round(totalFocus / 7);
  const mocksThisWeek = state.mocks.filter((m) => m.date >= days[0].iso && m.date <= today);
  const avgScore = mocksThisWeek.length ? round(mocksThisWeek.reduce((a, m) => a + m.score, 0) / mocksThisWeek.length, 1) : null;
  const due = dueMistakes().length;
  const insight = totalFocus === 0
    ? 'No focus sessions in the last seven days. Start with one honest 25-minute block today.'
    : due > 0
      ? `${plural(due, 'card is', 'cards are')} due for recall. Clearing those is the highest-leverage action this week.`
      : best.minutes > 0
        ? `${best.label} was your strongest day (${formatMinutes(best.minutes)}). Copy the conditions that made it work.`
        : 'Momentum is building. Protect the same time block tomorrow.';

  el.innerHTML = `
    <div class="weekly-layout">
      <div>
        <div class="week-summary">
          <div class="week-stat"><span>Focus</span><strong>${formatMinutes(totalFocus)}</strong></div>
          <div class="week-stat"><span>Daily average</span><strong>${formatMinutes(avg)}</strong></div>
          <div class="week-stat"><span>Tasks done</span><strong>${totalTasks}</strong></div>
          <div class="week-stat"><span>Reviews</span><strong>${totalReviews}</strong></div>
        </div>
        <div class="week-bars mt-3" aria-label="Focus minutes for the last 7 days">
          ${days.map((d) => `
            <div class="wb ${d.iso === today ? 'today' : ''}" title="${dateLabel(d.iso, { weekday: 'long' })} · ${formatMinutes(d.minutes)}">
              <div class="wb-bar" style="height:${Math.max(4, Math.round((d.minutes / maxMin) * 100))}%"></div>
              <span class="wb-label">${d.label}</span>
            </div>`).join('')}
        </div>
      </div>
      <div>
        <div class="note-box fix" style="font-size:12px"><strong>Coach read</strong>${escapeHtml(insight)}</div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div class="week-stat"><span>Mocks this week</span><strong>${mocks}${avgScore != null ? ` · ${avgScore}` : ''}</strong></div>
          <div class="week-stat"><span>Marks at risk</span><strong>${round(activeMistakes().reduce((a, m) => a + (Number(m.lost) || 0), 0), 1)}M</strong></div>
        </div>
        <div class="row wrap mt-3">
          <button class="btn btn-sm" type="button" data-go="tests">${icon('chart')} Log a mock</button>
          <button class="btn btn-sm btn-ghost" type="button" id="exportWeekBtn2">${icon('download')} Export .md</button>
        </div>
      </div>
    </div>`;
}

/* --------------------------------------------------------------------------
   Planner & syllabus
   -------------------------------------------------------------------------- */
let taskFilter = 'all';

function taskRowHTML(t, compact = false) {
  const overdue = !t.done && t.reminderAt && t.reminderAt < localNowMinute();
  return `
    <div class="list-item ${t.done ? 'task-done' : ''}" data-task-row="${escapeAttr(t.id)}">
      <button class="avatar-check ${t.done ? 'done' : ''}" type="button" data-task-toggle="${escapeAttr(t.id)}" aria-pressed="${t.done}" aria-label="${t.done ? 'Mark task pending' : 'Mark task done'}">${icon('check', 'i-sm')}</button>
      <div class="grow">
        <h4>${escapeHtml(t.title)}</h4>
        <div class="meta">
          <span class="chip dim">${escapeHtml(t.subject)}</span>
          <span class="chip ${t.priority === 'High' ? 'rose' : t.priority === 'Medium' ? 'amber' : 'dim'}">${escapeHtml(t.priority)}</span>
          ${t.reminderAt ? `<span class="chip ${overdue ? 'rose' : 'sky'}">${icon('clock', 'i-sm')} ${dateLabel(t.reminderAt, { day: 'numeric', month: 'short' })} ${escapeHtml(t.reminderAt.slice(11, 16))}</span>` : ''}
          ${compact ? '' : `<span class="chip dim">${escapeHtml(t.type)}</span>`}
        </div>
      </div>
      <div class="actions">
        ${compact ? '' : `<button class="item-btn" type="button" data-task-edit="${escapeAttr(t.id)}" aria-label="Edit task" title="Edit">${icon('pencil', 'i-sm')}</button>`}
        <button class="item-btn danger" type="button" data-task-del="${escapeAttr(t.id)}" aria-label="Delete task" title="Delete">${icon('trash', 'i-sm')}</button>
      </div>
    </div>`;
}

function renderPlanner() {
  renderTaskList();
  renderSyllabus();
}

function renderTaskList() {
  const el = $('#taskList');
  if (!el) return;
  const open = state.tasks.filter((t) => !t.done).length;
  const done = state.tasks.filter((t) => t.done).length;
  const label = $('#taskCountLabel');
  if (label) label.textContent = `${plural(open, 'open task', 'open tasks')} · ${done} done`;

  let list = [...state.tasks];
  if (taskFilter === 'pending') list = list.filter((t) => !t.done);
  if (taskFilter === 'done') list = list.filter((t) => t.done);
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done) return String(b.completedAt || '').localeCompare(String(a.completedAt || ''));
    const ar = a.reminderAt || '9999', br = b.reminderAt || '9999';
    if (ar !== br) return ar.localeCompare(br);
    return b.createdAt - a.createdAt;
  });

  $$('.seg [data-task-filter]').forEach((btn) => btn.classList.toggle('active', btn.dataset.taskFilter === taskFilter));

  if (!list.length) {
    el.innerHTML = `<div class="empty">${icon('clipboard')}<strong>${taskFilter === 'done' ? 'Nothing completed yet' : 'No tasks here'}</strong><span>${taskFilter === 'done' ? 'Finish a task and it will appear here with its date.' : 'Add a specific, time-boxed task using the form.'}</span></div>`;
    return;
  }
  el.innerHTML = list.map((t) => taskRowHTML(t)).join('');
}

function renderSyllabus() {
  const el = $('#syllabusList');
  if (!el) return;
  el.innerHTML = state.syllabus.map((block, si) => {
    const progress = subjectProgress(block);
    const done = block.topics.filter((t) => t.theory && t.notes && t.pyq).length;
    const sectionLabel = block.ga ? 'General Aptitude' : `Section ${block.section}`;
    return `
      <div class="subject-block">
        <button class="subject-toggle" type="button" data-subject-toggle="${si}" aria-expanded="${!!block.expanded}">
          <span class="chev">${icon('chevron-right', 'i-sm')}</span>
          <span style="min-width:0;flex:1">
            <span class="sub-name">${escapeHtml(block.subject)}</span>
            <span class="sub-meta">${sectionLabel} · ${done}/${block.topics.length} subtopics fully covered</span>
          </span>
          <span class="sub-pct">${progress}%</span>
        </button>
        <div class="subject-panel" ${block.expanded ? '' : 'hidden'}>
          ${block.topics.map((t) => `
            <div class="topic-row">
              <div class="topic-name">${escapeHtml(t.name)}</div>
              <div class="topic-checks">
                <label class="tcheck ${t.theory ? 'on' : ''}"><input type="checkbox" data-topic-check data-subject="${si}" data-topic="${escapeAttr(t.id)}" data-field="theory" ${t.theory ? 'checked' : ''} /> Theory</label>
                <label class="tcheck ${t.notes ? 'on' : ''}"><input type="checkbox" data-topic-check data-subject="${si}" data-topic="${escapeAttr(t.id)}" data-field="notes" ${t.notes ? 'checked' : ''} /> Notes</label>
                <label class="tcheck ${t.pyq ? 'on' : ''}"><input type="checkbox" data-topic-check data-subject="${si}" data-topic="${escapeAttr(t.id)}" data-field="pyq" ${t.pyq ? 'checked' : ''} /> PYQ</label>
                <button class="rev-btn" type="button" data-topic-rev="${si}" data-topic-id="${escapeAttr(t.id)}" title="Log one revision">${icon('refresh', 'i-sm')} ${t.revisions}</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

/* --------------------------------------------------------------------------
   Vault
   -------------------------------------------------------------------------- */
function vaultFilters() {
  return {
    query: ($('#vaultSearch')?.value || '').trim().toLowerCase(),
    subject: $('#vaultSubject')?.value || 'ALL',
    cause: $('#vaultCause')?.value || 'ALL',
    status: $('#vaultStatus')?.value || 'ALL',
    sort: $('#vaultSort')?.value || 'recent'
  };
}

function renderVault() {
  const el = $('#vaultList');
  if (!el) return;
  const f = vaultFilters();
  const today = todayISO();

  let list = state.mistakes.filter((m) => {
    if (f.subject !== 'ALL' && m.subject !== f.subject) return false;
    if (f.cause !== 'ALL' && m.cause !== f.cause) return false;
    if (f.status === 'active' && m.box >= 5) return false;
    if (f.status === 'mastered' && m.box < 5) return false;
    if (f.status === 'due' && !(m.due <= today)) return false;
    if (f.query) {
      const topic = m.topicId ? topicNameOf(m.topicId) : '';
      const hay = `${m.title} ${m.subject} ${m.cause} ${m.source} ${m.wrong} ${m.fix} ${topic}`.toLowerCase();
      if (!hay.includes(f.query)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (f.sort === 'loss') return (b.lost || 0) - (a.lost || 0);
    if (f.sort === 'due') return String(a.due).localeCompare(String(b.due));
    if (f.sort === 'box') return a.box - b.box || String(a.due).localeCompare(String(b.due));
    return b.createdAt - a.createdAt;
  });

  const due = dueMistakes();
  const active = activeMistakes();
  const mastered = masteredMistakes();
  const risk = active.reduce((a, m) => a + (Number(m.lost) || 0), 0);
  $('#vaultStats').innerHTML = `
    <div class="vault-stat"><span>Active</span><strong>${active.length}</strong></div>
    <div class="vault-stat"><span>Due now</span><strong style="color:${due.length ? 'var(--warn)' : 'var(--success)'}">${due.length}</strong></div>
    <div class="vault-stat"><span>Mastered</span><strong style="color:var(--success)">${mastered.length}</strong></div>
    <div class="vault-stat"><span>Marks at risk</span><strong style="color:var(--danger)">${round(risk, 1)}</strong></div>`;
  $('#vaultCountLabel').textContent = `${plural(list.length, 'card', 'cards')} shown${list.length !== state.mistakes.length ? ` of ${state.mistakes.length}` : ''}`;

  if (!list.length) {
    el.innerHTML = `<div class="empty">${icon('shield')}<strong>${state.mistakes.length ? 'No cards match these filters' : 'Your vault is empty'}</strong><span>${state.mistakes.length ? 'Try clearing the search or filters.' : 'Log your first wrong question with the exact fix. That is the whole system.'}</span>${state.mistakes.length ? '' : `<button class="btn btn-sm btn-primary mt-2" type="button" data-new-mistake>${icon('plus')} Log first mistake</button>`}</div>`;
    return;
  }

  el.innerHTML = list.map((m) => {
    const topic = m.topicId ? topicNameOf(m.topicId) : '';
    const overdue = m.box < 5 && m.due < today;
    return `
      <div class="mistake-card ${m.box >= 5 ? 'mastered' : ''}" data-mistake-card="${escapeAttr(m.id)}">
        <div class="mistake-head">
          <div class="grow">
            <h4>${escapeHtml(m.title)}</h4>
            <div class="mistake-tags">
              <span class="chip dim">${escapeHtml(m.subject)}</span>
              ${topic ? `<span class="chip dim" title="${escapeAttr(topic)}">${escapeHtml(topic.length > 34 ? `${topic.slice(0, 34)}…` : topic)}</span>` : ''}
              <span class="chip ${m.box >= 5 ? 'emerald' : overdue ? 'rose' : 'amber'}">${m.box >= 5 ? 'Mastered' : `Box ${m.box}`}</span>
              <span class="chip dim">${escapeHtml(m.cause)}</span>
              <span class="chip dim">${escapeHtml(m.source)}</span>
              <span class="chip dim">${dateLabel(String(m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : m.due))}</span>
            </div>
          </div>
          ${m.imageId ? `<img class="mistake-thumb" data-img-id="${escapeAttr(m.imageId)}" data-open-image="${escapeAttr(m.imageId)}" alt="Mistake screenshot" />` : ''}
          <span class="box-dots" title="SRS box ${m.box} of 5" aria-label="Box ${m.box} of 5">
            ${[1, 2, 3, 4, 5].map((b) => `<i class="${b <= m.box ? 'on' : ''}"></i>`).join('')}
          </span>
        </div>
        <div class="mistake-body">
          ${m.wrong ? `<div class="note-box wrong"><strong>What went wrong</strong>${escapeHtml(m.wrong)}</div>` : ''}
          <div class="note-box fix"><strong>Golden fix</strong>${escapeHtml(m.fix || 'No fix written yet.')}</div>
        </div>
        <div class="mistake-foot">
          <div class="row wrap tiny muted">
            <span>${round(m.lost, 2)} marks lost</span><span>·</span><span>${m.revisions} reviews</span><span>·</span>
            <span>${m.box >= 5 ? 'Box 5 · maintenance' : m.due <= today ? 'Due now' : `Due ${dateLabel(m.due)}`}</span>
          </div>
          <div class="row">
            <button class="btn btn-sm ${m.box >= 5 ? '' : 'btn-success'}" type="button" data-review="${escapeAttr(m.id)}">${icon('layers', 'i-sm')} ${m.box >= 5 ? 'Revisit' : 'Review'}</button>
            <button class="item-btn" type="button" data-mistake-edit="${escapeAttr(m.id)}" aria-label="Edit mistake" title="Edit">${icon('pencil', 'i-sm')}</button>
            <button class="item-btn danger" type="button" data-mistake-del="${escapeAttr(m.id)}" aria-label="Delete mistake" title="Delete">${icon('trash', 'i-sm')}</button>
          </div>
        </div>
      </div>`;
  }).join('');

  hydrateImages(el);
}

/* --------------------------------------------------------------------------
   Tests & journal
   -------------------------------------------------------------------------- */
function renderTests() {
  renderScoreChart();
  renderMockStats();
  renderMockList();
  renderJournal();
}

function scoreChartHTML() {
  const mocks = sortedMocks();
  if (!mocks.length) {
    return `<div class="empty" style="min-height:170px">${icon('chart')}<strong>No score data yet</strong><span>Log your first mock to see the trend. Honest data is more useful than a pretty chart.</span></div>`;
  }
  const W = 640, H = 230, pad = { l: 38, r: 16, t: 16, b: 34 };
  const yMax = Math.max(100, ...mocks.map((m) => m.total));
  const yStep = yMax <= 100 ? 25 : 50;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i) => pad.l + (mocks.length === 1 ? innerW / 2 : (i * innerW) / (mocks.length - 1));
  const y = (v) => pad.t + innerH - (clamp(v, 0, yMax) / yMax) * innerH;
  const points = mocks.map((m, i) => [x(i), y(m.score), m]);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${points.at(-1)[0].toFixed(1)},${pad.t + innerH} L${points[0][0].toFixed(1)},${pad.t + innerH} Z`;
  const grid = [];
  for (let v = 0; v <= yMax; v += yStep) {
    grid.push(`<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border-soft)" stroke-dasharray="3 5"/>
      <text x="${pad.l - 7}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="var(--faint)">${v}</text>`);
  }
  const showEvery = mocks.length > 7 ? 2 : 1;
  const labels = points.map((p, i) => i % showEvery === 0 || i === points.length - 1
    ? `<text x="${p[0]}" y="${H - 12}" text-anchor="middle" font-size="9" fill="var(--faint)">${escapeHtml(dateLabel(p[2].date, { day: 'numeric', month: 'short' }))}</text>`
    : '').join('');
  const dots = points.map((p) => `
    <circle cx="${p[0]}" cy="${p[1]}" r="4.2" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.4"><title>${escapeHtml(p[2].name)} · ${round(p[2].score, 2)}/${p[2].total}</title></circle>
    <text x="${p[0]}" y="${p[1] - 10}" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--text)">${round(p[2].score, 1)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mock score trend">
    <defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid.join('')}
    <path d="${area}" fill="url(#scoreFill)"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${labels}
  </svg>`;
}

function renderScoreChart() {
  const el = $('#scoreChart');
  if (!el) return;
  el.innerHTML = scoreChartHTML();
  const avg = $('#mockAvgChip');
  if (avg) {
    const mocks = sortedMocks();
    avg.textContent = mocks.length ? `Avg ${round(mocks.reduce((a, m) => a + (m.score / m.total) * 100, 0) / mocks.length, 1)}%` : 'No mocks';
  }
}

function renderMockStats() {
  const el = $('#mockStats');
  if (!el) return;
  const mocks = sortedMocks();
  if (!mocks.length) {
    el.innerHTML = `<div class="week-stat"><span>Average</span><strong>—</strong></div><div class="week-stat"><span>Best</span><strong>—</strong></div><div class="week-stat"><span>Negatives</span><strong>—</strong></div>`;
    return;
  }
  const avg = mocks.reduce((a, m) => a + (m.score / m.total) * 100, 0) / mocks.length;
  const best = mocks.reduce((a, m) => (m.score / m.total > a.score / a.total ? m : a), mocks[0]);
  const neg = mocks.reduce((a, m) => a + m.neg, 0);
  el.innerHTML = `
    <div class="week-stat"><span>Average</span><strong>${round(avg, 1)}%</strong></div>
    <div class="week-stat"><span>Best</span><strong>${round((best.score / best.total) * 100, 1)}%</strong></div>
    <div class="week-stat"><span>Negative lost</span><strong style="color:var(--danger)">−${round(neg, 2)}</strong></div>`;
}

function renderMockList() {
  const el = $('#mockList');
  if (!el) return;
  const mocks = sortedMocks().reverse();
  $('#mockCountLabel').textContent = mocks.length ? `${plural(mocks.length, 'mock', 'mocks')} logged` : 'No mocks yet';
  if (!mocks.length) {
    el.innerHTML = `<div class="empty">${icon('award')}<strong>No mocks logged</strong><span>Log a mock and one specific lesson from it.</span></div>`;
    return;
  }
  el.innerHTML = mocks.map((m) => `
    <div class="mock-row">
      <div class="mock-score">${round(m.score, 1)}<small>/${m.total}</small></div>
      <div class="mock-info">
        <h4>${escapeHtml(m.name)}</h4>
        <p>${dateLabel(m.date)} · ${escapeHtml(m.type)} · ${m.right}R / ${m.wrong}W · neg ${round(m.neg, 2)}</p>
        ${m.notes ? `<p class="faint" style="margin-top:4px">${escapeHtml(m.notes)}</p>` : ''}
        <div class="row wrap" style="margin-top:5px">
          <button class="btn btn-sm btn-ghost" type="button" data-mock-mistake="${escapeAttr(m.id)}">${icon('plus', 'i-sm')} Add mistake</button>
        </div>
      </div>
      <div class="actions">
        <button class="item-btn" type="button" data-mock-edit="${escapeAttr(m.id)}" aria-label="Edit mock">${icon('pencil', 'i-sm')}</button>
        <button class="item-btn danger" type="button" data-mock-del="${escapeAttr(m.id)}" aria-label="Delete mock">${icon('trash', 'i-sm')}</button>
      </div>
    </div>`).join('');
}

function renderJournal() {
  const el = $('#journalList');
  if (!el) return;
  const journal = [...state.journal].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id.localeCompare(a.id));
  if (!journal.length) {
    el.innerHTML = `<div class="empty">${icon('book')}<strong>No journal entries</strong><span>A two-line log of what worked today is worth more than a perfect plan tomorrow.</span></div>`;
    return;
  }
  el.innerHTML = journal.map((j) => `
    <div class="journal-item ${j.type.toLowerCase()}" data-journal-row="${escapeAttr(j.id)}">
      <div class="row-between">
        <h4>${escapeHtml(j.type)} · ${dateLabel(j.date)}</h4>
        <button class="item-btn danger" type="button" data-journal-del="${escapeAttr(j.id)}" aria-label="Delete entry">${icon('trash', 'i-sm')}</button>
      </div>
      <p>${escapeHtml(j.text)}</p>
      ${j.fix ? `<div class="fix">${icon('arrow-right', 'i-sm')} ${escapeHtml(j.fix)}</div>` : ''}
    </div>`).join('');
}

/* --------------------------------------------------------------------------
   Coach
   -------------------------------------------------------------------------- */
function miniMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code style="font-family:var(--mono);font-size:11px;background:var(--surface-3);padding:1px 4px;border-radius:4px">$1</code>');
  return html;
}

function renderCoach() {
  renderChat();
  renderCoachSnapshot();
  renderAiStatus();
  renderSuggestion();
}

function renderChat() {
  const el = $('#chatLog');
  if (!el) return;
  if (!state.chat.length) {
    el.innerHTML = `<div class="msg ai"><div class="who">${icon('sparkles', 'i-sm')}</div><div class="bubble">I am your offline study coach. I read your local tasks, vault, syllabus and mocks — no account needed.\n\nTry **2-hour plan**, **7-day plan**, or tell me what feels stuck. You can connect a language model below for concept explanations.</div></div>`;
    return;
  }
  el.innerHTML = state.chat.map((m) => `
    <div class="msg ${m.role === 'me' ? 'me' : 'ai'}">
      <div class="who">${icon(m.role === 'me' ? 'user' : 'sparkles', 'i-sm')}</div>
      <div class="bubble">${miniMarkdown(m.text)}</div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function renderCoachSnapshot() {
  const el = $('#coachSnapshot');
  if (!el) return;
  const due = dueMistakes().length;
  const active = activeMistakes().length;
  const pending = state.tasks.filter((t) => !t.done).length;
  const weak = topWeakTopics(1)[0];
  const cause = lostByCause()[0];
  const latest = latestMock();
  el.innerHTML = `
    <div class="stack-sm">
      <div class="row-between small"><span class="muted">Active mistakes</span><strong class="mono">${active}</strong></div>
      <div class="row-between small"><span class="muted">Due for review</span><strong class="mono" style="color:var(--warn)">${due}</strong></div>
      <div class="row-between small"><span class="muted">Open tasks</span><strong class="mono">${pending}</strong></div>
      <div class="row-between small"><span class="muted">Syllabus (EC)</span><strong class="mono">${ecSyllabusProgress()}%</strong></div>
      <div class="row-between small"><span class="muted">Latest mock</span><strong class="mono">${latest ? `${round(latest.score, 1)}/${latest.total}` : '—'}</strong></div>
      <div class="divider" style="margin:6px 0"></div>
      <div class="tiny muted">Top weak topic</div>
      <div class="small" style="font-weight:650">${weak ? escapeHtml(weak.title) : 'No data yet'}</div>
      <div class="tiny muted mt-2">Dominant cause</div>
      <div class="small" style="font-weight:650">${cause ? `${escapeHtml(cause[0])} · ${round(cause[1], 1)}M` : 'No data yet'}</div>
    </div>`;
}

function renderAiStatus() {
  const cfg = getAiConfig();
  const label = $('#aiStatusText');
  const status = $('#aiStatus');
  if (!label || !status) return;
  const online = cfg.provider !== 'offline' && cfg.key;
  label.textContent = online ? `${cfg.provider === 'gemini' ? 'Gemini' : 'API'} · ${cfg.model || 'default'}` : 'Offline coach';
  status.classList.toggle('offline', !online);
}

function renderSuggestion() {
  const el = $('#aiSuggestionSlot');
  if (!el) return;
  const s = state.meta?.lastSuggestion;
  if (!s) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="note-box fix mt-2" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <div style="flex:1;min-width:150px"><strong>Suggested next task</strong>${escapeHtml(s.title)}</div>
    <button class="btn btn-sm btn-primary" type="button" data-accept-suggestion>${icon('plus', 'i-sm')} Add task</button>
    <button class="btn btn-sm btn-ghost" type="button" data-dismiss-suggestion>Dismiss</button>
  </div>`;
}

function refresh() {
  renderShell();
  renderView(currentView);
  syncTimerUI();
}

function renderAll() { refresh(); }

/* --------------------------------------------------------------------------
   Selects & form helpers
   -------------------------------------------------------------------------- */
function populateSubjectSelects() {
  const subjectOptions = SUBJECTS.map((s) => `<option value="${escapeAttr(s.name)}">${escapeHtml(s.name)}</option>`).join('');
  const taskSel = $('#taskSubject');
  if (taskSel && !taskSel.options.length) taskSel.innerHTML = subjectOptions;
  const mSel = $('#mSubject');
  if (mSel && !mSel.options.length) mSel.innerHTML = subjectOptions;
  const vaultSel = $('#vaultSubject');
  if (vaultSel && vaultSel.options.length <= 1) vaultSel.innerHTML = `<option value="ALL">All subjects</option>${subjectOptions}`;
  const causeSel = $('#mCause');
  if (causeSel && !causeSel.options.length) causeSel.innerHTML = CAUSES.map((c) => `<option value="${escapeAttr(c.name)}">${escapeHtml(c.name)}</option>`).join('');
  const vaultCause = $('#vaultCause');
  if (vaultCause && vaultCause.options.length <= 1) vaultCause.innerHTML = `<option value="ALL">All causes</option>${CAUSES.map((c) => `<option value="${escapeAttr(c.name)}">${escapeHtml(c.name)}</option>`).join('')}`;
  $$('.js-subject-select').forEach((sel) => {
    if (!sel.options.length) sel.innerHTML = subjectOptions;
    sel.value = state.profile.focusSubject;
  });
}

function populateTopicSelect(subject, selectedId = '') {
  const sel = $('#mTopic');
  if (!sel) return;
  const topics = topicsBySubject(subject);
  sel.innerHTML = `<option value="">General / not listed</option>${topics.map((t) => `<option value="${escapeAttr(t.id)}">${escapeHtml(t.name.length > 92 ? `${t.name.slice(0, 92)}…` : t.name)}</option>`).join('')}`;
  sel.value = topics.some((t) => t.id === selectedId) ? selectedId : '';
}

function resetTaskForm() {
  $('#taskEditId').value = '';
  $('#taskTitle').value = '';
  $('#taskSubject').value = state.profile.focusSubject;
  $('#taskType').value = 'PYQ practice';
  $('#taskPriority').value = 'Medium';
  $('#taskDate').value = '';
  $('#taskTime').value = '';
  $('#taskFormTitle').textContent = 'Assign a study task';
  $('#taskFormSub').textContent = 'Make it specific, measurable and time-boxed.';
  $('#taskSubmitBtn').innerHTML = `${icon('plus')} Add task`;
  $('#taskCancelBtn').hidden = true;
}

function resetMockForm() {
  $('#mockEditId').value = '';
  $('#mockName').value = '';
  $('#mockDate').value = todayISO();
  $('#mockType').value = 'Full syllabus';
  $('#mockScore').value = '';
  $('#mockTotal').value = '100';
  $('#mockRight').value = '0';
  $('#mockWrong').value = '0';
  $('#mockNeg').value = '0';
  $('#mockNotes').value = '';
  $('#mockFormTitle').textContent = 'Log a mock';
  $('#mockSubmitBtn').innerHTML = `${icon('plus')} Save mock`;
  $('#mockCancelBtn').hidden = true;
}

/* --------------------------------------------------------------------------
   Tasks
   -------------------------------------------------------------------------- */
function handleTaskSubmit(event) {
  event.preventDefault();
  const title = $('#taskTitle').value.trim();
  if (!title) { $('#taskTitle').focus(); toast('Give the task a specific description.', 'warn'); return; }
  const date = $('#taskDate').value;
  const time = $('#taskTime').value;
  let reminderAt = '';
  if (date) reminderAt = `${date}T${time || '09:00'}`;
  else if (time) reminderAt = `${todayISO()}T${time}`;

  const editId = $('#taskEditId').value;
  if (editId) {
    const task = state.tasks.find((t) => t.id === editId);
    if (!task) return;
    const previousReminder = task.reminderAt;
    Object.assign(task, {
      title,
      subject: $('#taskSubject').value,
      type: $('#taskType').value,
      priority: $('#taskPriority').value,
      reminderAt
    });
    // Allow a changed reminder to fire, and release the old fired marker.
    delete state.meta.fired[`${task.id}|${previousReminder}`];
    delete state.meta.fired[`${task.id}|${task.reminderAt}`];
    state.demo = false;
    saveState();
    toast('Task updated.', 'success');
  } else {
    state.tasks.unshift({
      id: uid('t'), demo: false, title,
      subject: $('#taskSubject').value,
      type: $('#taskType').value,
      priority: $('#taskPriority').value,
      reminderAt, done: false, completedAt: null, createdAt: Date.now()
    });
    state.demo = false;
    saveState();
    toast('Task added to your plan.', 'success');
  }
  resetTaskForm();
  refresh();
}

function editTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  $('#taskEditId').value = t.id;
  $('#taskTitle').value = t.title;
  $('#taskSubject').value = t.subject;
  $('#taskType').value = t.type;
  $('#taskPriority').value = t.priority;
  $('#taskDate').value = t.reminderAt ? t.reminderAt.slice(0, 10) : '';
  $('#taskTime').value = t.reminderAt ? t.reminderAt.slice(11, 16) : '';
  $('#taskFormTitle').textContent = 'Edit study task';
  $('#taskFormSub').textContent = 'Adjust the scope or the reminder.';
  $('#taskSubmitBtn').innerHTML = `${icon('check')} Save changes`;
  $('#taskCancelBtn').hidden = false;
  switchView('planner');
  $('#taskForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => $('#taskTitle').focus(), 250);
}

function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.completedAt = t.done ? new Date().toISOString() : null;
  state.demo = false;
  saveState();
  refresh();
  toast(t.done ? 'Task completed. Keep the chain visible.' : 'Task reopened.', t.done ? 'success' : 'info');
}

function deleteTask(id) {
  const index = state.tasks.findIndex((x) => x.id === id);
  if (index < 0) return;
  const removed = state.tasks.splice(index, 1)[0];
  saveState();
  refresh();
  toast('Task deleted.', 'info', () => {
    state.tasks.splice(index, 0, removed);
    saveState(); refresh(); toast('Task restored.', 'success');
  });
}

/* --------------------------------------------------------------------------
   Syllabus
   -------------------------------------------------------------------------- */
function toggleSubject(index) {
  const block = state.syllabus[index];
  if (!block) return;
  block.expanded = !block.expanded;
  saveState();
  renderSyllabus();
}

function toggleTopicCheck(subjectIndex, topicId, field, checked) {
  const block = state.syllabus[subjectIndex];
  const topic = block?.topics.find((t) => t.id === topicId);
  if (!topic) return;
  topic[field] = !!checked;
  if (checked && field === 'pyq') topic.revisions = Math.max(topic.revisions, 1);
  state.demo = false;
  saveState();
  renderShell();
  renderSyllabus();
}

function incrementRevision(subjectIndex, topicId) {
  const block = state.syllabus[subjectIndex];
  const topic = block?.topics.find((t) => t.id === topicId);
  if (!topic) return;
  topic.revisions = Math.max(0, Math.floor(topic.revisions || 0)) + 1;
  state.demo = false;
  saveState();
  renderShell();
  renderSyllabus();
  toast(`Revision ${topic.revisions} logged. Space the next one 2–3 days out.`, 'success');
}

function jumpToSubject(subject) {
  switchView('planner');
  const index = state.syllabus.findIndex((b) => b.subject === subject);
  if (index >= 0) {
    state.syllabus[index].expanded = true;
    saveState();
    renderSyllabus();
    setTimeout(() => {
      const block = $$('#syllabusList .subject-block')[index];
      block?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (block) {
        block.style.outline = '2px solid var(--accent)';
        setTimeout(() => { block.style.outline = ''; }, 1600);
      }
    }, 220);
  }
}

/* --------------------------------------------------------------------------
   Mistake dialog & image capture
   -------------------------------------------------------------------------- */
const mistakeImage = { dataUrl: null, imageId: null, removed: false };

function computeLoss() {
  const type = $('#mType')?.value || 'MCQ';
  const marks = num($('#mMarks')?.value, 0);
  const neg = type === 'NAT' ? 0 : num($('#mNeg')?.value, 0);
  const opp = num($('#mOpp')?.value, 0);
  return { marks, neg, opp, total: round(marks + neg + opp, 2) };
}

function updateLossPreview() {
  const l = computeLoss();
  const el = $('#mLossPreview');
  if (el) el.textContent = l.total.toFixed(2);
}

function resetMistakeImage() {
  mistakeImage.dataUrl = null;
  mistakeImage.imageId = null;
  mistakeImage.removed = false;
  const preview = $('#mImgPreview');
  const img = $('#mImgPreviewImg');
  if (preview) preview.hidden = true;
  if (img) img.removeAttribute('src');
  const input = $('#mImage');
  if (input) input.value = '';
}

function showMistakePreview() {
  const preview = $('#mImgPreview');
  const img = $('#mImgPreviewImg');
  if (!preview || !img) return;
  if (mistakeImage.dataUrl) {
    img.src = mistakeImage.dataUrl;
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
}

function openMistakeNew(preset = {}) {
  const form = $('#mistakeForm');
  form?.reset();
  $('#mistakeEditId').value = '';
  $('#mistakeDialogTitleText').textContent = 'Log a mistake';
  $('#mTitle').value = preset.title || '';
  $('#mSubject').value = preset.subject && SUBJECTS.some((s) => s.name === preset.subject) ? preset.subject : state.profile.focusSubject;
  populateTopicSelect($('#mSubject').value, preset.topicId || '');
  $('#mCause').value = preset.cause && CAUSES.some((c) => c.name === preset.cause) ? preset.cause : CAUSES[0].name;
  $('#mSource').value = preset.source || 'PYQ';
  $('#mType').value = 'MCQ';
  $('#mMarks').value = '2';
  $('#mNeg').value = '0.67';
  $('#mOpp').value = '2';
  $('#mWrong').value = '';
  $('#mFix').value = '';
  $('#mistakeSaveBtn').innerHTML = `${icon('check')} Save to vault`;
  resetMistakeImage();
  updateLossPreview();
  openDialog('mistakeDialog');
  setTimeout(() => $('#mTitle').focus(), 80);
}

async function openMistakeEdit(id) {
  const m = state.mistakes.find((x) => x.id === id);
  if (!m) return;
  $('#mistakeForm')?.reset();
  $('#mistakeEditId').value = m.id;
  $('#mistakeDialogTitleText').textContent = 'Edit mistake';
  $('#mTitle').value = m.title;
  $('#mSubject').value = m.subject;
  populateTopicSelect(m.subject, m.topicId);
  $('#mCause').value = m.cause;
  $('#mSource').value = m.source;
  $('#mType').value = m.type;
  $('#mMarks').value = String(m.marks);
  $('#mNeg').value = String(m.neg);
  $('#mOpp').value = String(m.opp);
  $('#mWrong').value = m.wrong;
  $('#mFix').value = m.fix;
  $('#mistakeSaveBtn').innerHTML = `${icon('check')} Save changes`;
  resetMistakeImage();
  if (m.imageId) {
    mistakeImage.imageId = m.imageId;
    mistakeImage.dataUrl = await ImageStore.get(m.imageId);
    showMistakePreview();
  }
  updateLossPreview();
  openDialog('mistakeDialog');
  setTimeout(() => $('#mTitle').focus(), 80);
}

function autoNegFor(type, marks) {
  if (type === 'NAT' || type === 'Concept') return 0;
  if (marks >= 2) return 0.67;
  if (marks === 1) return 0.33;
  return 0;
}

async function handleMistakeSubmit(event) {
  event.preventDefault();
  const title = $('#mTitle').value.trim();
  const fix = $('#mFix').value.trim();
  if (!title) { $('#mTitle').focus(); toast('Write the question or trap title first.', 'warn'); return; }
  if (!fix) { $('#mFix').focus(); toast('Write the golden fix — the rule you will apply next time.', 'warn'); return; }

  const type = $('#mType').value;
  const loss = computeLoss();
  const subject = $('#mSubject').value;
  const topicId = $('#mTopic').value || '';
  const cause = $('#mCause').value;
  const source = $('#mSource').value;
  const wrong = $('#mWrong').value.trim();
  const editId = $('#mistakeEditId').value;
  const saveBtn = $('#mistakeSaveBtn');
  saveBtn.disabled = true;

  let imageId = mistakeImage.imageId;
  try {
    if (mistakeImage.removed && mistakeImage.imageId) {
      await ImageStore.del(mistakeImage.imageId);
      imageId = null;
    }
    if (mistakeImage.dataUrl) {
      imageId = imageId || uid('img');
      await ImageStore.put(imageId, mistakeImage.dataUrl);
    }
  } catch (err) {
    console.warn('Image save failed', err);
    toast('Screenshot could not be stored, but the card will still save.', 'warn');
  }

  if (editId) {
    const m = state.mistakes.find((x) => x.id === editId);
    if (m) {
      Object.assign(m, {
        title, subject, topicId, cause, source, type, wrong, fix,
        marks: loss.marks, neg: type === 'NAT' ? 0 : loss.neg, opp: loss.opp, lost: loss.total,
        imageId
      });
    }
    toast('Mistake updated.', 'success');
  } else {
    state.mistakes.unshift({
      id: uid('m'), demo: false,
      title, subject, topicId, cause, source, type,
      marks: loss.marks, neg: type === 'NAT' ? 0 : loss.neg, opp: loss.opp, lost: loss.total,
      wrong, fix, box: 1, due: todayISO(), revisions: 0, reviewHistory: [],
      createdAt: Date.now(), imageId
    });
    toast('Saved to the vault and scheduled for tomorrow’s recall.', 'success');
  }
  state.demo = false;
  saveState();
  saveBtn.disabled = false;
  resetMistakeImage();
  closeDialog('mistakeDialog');
  refresh();
}

async function deleteMistake(id) {
  const index = state.mistakes.findIndex((m) => m.id === id);
  if (index < 0) return;
  const removed = state.mistakes[index];
  const cachedImage = removed.imageId ? await ImageStore.get(removed.imageId) : null;
  state.mistakes.splice(index, 1);
  if (removed.imageId) await ImageStore.del(removed.imageId);
  saveState();
  refresh();
  toast('Mistake deleted.', 'info', async () => {
    state.mistakes.splice(index, 0, removed);
    if (removed.imageId && cachedImage) await ImageStore.put(removed.imageId, cachedImage);
    saveState(); refresh(); toast('Mistake restored.', 'success');
  });
}

function openImageLightbox(imageId) {
  ImageStore.get(imageId).then((src) => {
    if (!src) { toast('Screenshot not available.', 'warn'); return; }
    $('#lightboxImg').src = src;
    openDialog('lightboxDialog');
  });
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Not an image')); return; }
    if (file.size > 8 * 1024 * 1024) { reject(new Error('Image is larger than 8 MB')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        try {
          const maxDim = 1400;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let quality = 0.74;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 1_400_000 && quality > 0.4) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch (err) { reject(err); }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function attachMistakeImage(file) {
  try {
    toast('Compressing screenshot…', 'info', null, 1500);
    const dataUrl = await compressImageFile(file);
    mistakeImage.dataUrl = dataUrl;
    mistakeImage.removed = false;
    showMistakePreview();
    toast('Screenshot attached.', 'success');
  } catch (err) {
    toast(err.message || 'Could not attach that image.', 'error');
  }
}

/* --------------------------------------------------------------------------
   Spaced repetition & deck
   -------------------------------------------------------------------------- */
const deck = { ids: [], index: 0, revealed: false, remembered: 0, forgot: 0, startedAt: 0 };

function startDeck(preferredId = null) {
  let ids = [];
  if (preferredId) {
    if (state.mistakes.some((m) => m.id === preferredId)) ids = [preferredId];
  } else {
    const due = dueMistakes();
    ids = due.length ? due.map((m) => m.id) : [...state.mistakes]
      .sort((a, b) => a.box - b.box || String(a.due).localeCompare(String(b.due)))
      .map((m) => m.id);
  }
  if (!ids.length) {
    toast('No cards in the vault yet. Log a mistake first.', 'warn');
    return;
  }
  // Keep one session focused: cap large decks, due cards first.
  ids = ids.slice(0, 20);
  Object.assign(deck, { ids, index: 0, revealed: false, remembered: 0, forgot: 0, startedAt: Date.now() });
  openDialog('deckDialog');
  renderDeck();
}

function renderDeck() {
  const body = $('#deckBody');
  if (!body) return;
  if (deck.index >= deck.ids.length) {
    const total = deck.remembered + deck.forgot;
    const accuracy = total ? Math.round((deck.remembered / total) * 100) : 0;
    $('#deckDialogSub').textContent = 'Session complete';
    body.innerHTML = `
      <div class="fc-empty">
        <div class="kpi-icon emerald" style="margin:0 auto 10px;width:44px;height:44px">${icon('check-circle', 'i-lg')}</div>
        <h3 style="margin:0 0 4px">Deck cleared</h3>
        <p class="muted small">${deck.remembered} remembered · ${deck.forgot} to relearn · ${accuracy}% recall</p>
        <div class="note-box fix mt-3" style="text-align:left"><strong>Next step</strong>Forgotten cards are back in Box 1 and due tomorrow. Remembered cards moved one box forward.</div>
        <div class="row mt-3" style="justify-content:center">
          <button class="btn btn-primary" type="button" data-deck-restart>${icon('refresh')} Review again</button>
          <button class="btn" type="button" data-close-dialog="deckDialog">Done</button>
        </div>
      </div>`;
    refresh();
    return;
  }

  const m = state.mistakes.find((x) => x.id === deck.ids[deck.index]);
  if (!m) { deck.index++; renderDeck(); return; }
  const topic = m.topicId ? topicNameOf(m.topicId) : '';
  $('#deckDialogSub').textContent = `Card ${deck.index + 1} of ${deck.ids.length} · Box ${m.box} of 5`;
  body.innerHTML = `
    <div class="fc-wrap">
      <div class="fc-progress">
        <div class="progress thin" style="flex:1"><span style="width:${Math.round((deck.index / deck.ids.length) * 100)}%"></span></div>
        <span class="tiny mono muted">${deck.index + 1}/${deck.ids.length}</span>
      </div>
      <div class="fc-card">
        <div>
          <div class="fc-tags">
            <span class="chip sky">${escapeHtml(m.subject)}</span>
            <span class="chip rose">${escapeHtml(m.cause)}</span>
            <span class="chip dim">${escapeHtml(m.source)}</span>
            ${topic ? `<span class="chip dim">${escapeHtml(topic.length > 46 ? `${topic.slice(0, 46)}…` : topic)}</span>` : ''}
          </div>
          <div class="fc-question mt-3">${escapeHtml(m.title)}</div>
          ${m.imageId ? `<img class="mt-3" data-img-id="${escapeAttr(m.imageId)}" alt="Question screenshot" style="max-height:150px;border-radius:9px;border:1px solid var(--border)" />` : ''}
          ${m.wrong ? `<div class="note-box wrong mt-3"><strong>What went wrong</strong>${escapeHtml(m.wrong)}</div>` : ''}
          <div class="${deck.revealed ? '' : 'sr-only'} fc-solution">
            <div class="note-box fix"><strong>Golden fix</strong>${escapeHtml(m.fix || 'No fix written yet.')}</div>
          </div>
        </div>
        ${deck.revealed ? `
          <div class="fc-actions">
            <button class="btn btn-danger" type="button" data-grade="forgot">${icon('refresh')} Forgot · Box 1</button>
            <button class="btn btn-success" type="button" data-grade="remembered">${icon('check')} Remembered</button>
          </div>` : `
          <button class="btn btn-primary btn-block" type="button" id="fcRevealBtn" data-reveal>${icon('eye')} Reveal the fix</button>`}
      </div>
      <p class="tiny faint center mt-2 mb-0">Answer out loud before revealing. Recognition is not recall.</p>
    </div>`;
  hydrateImages(body);
  const reveal = $('#fcRevealBtn');
  if (reveal) setTimeout(() => reveal.focus(), 60);
}

function gradeDeck(remembered) {
  const m = state.mistakes.find((x) => x.id === deck.ids[deck.index]);
  if (!m) return;
  const nextBox = remembered ? Math.min(5, m.box + 1) : 1;
  m.box = nextBox;
  m.due = addDaysISO(todayISO(), SRS_INTERVALS[nextBox - 1]);
  m.revisions = (m.revisions || 0) + 1;
  m.reviewHistory = [...(m.reviewHistory || []), { date: todayISO(), ok: !!remembered }];
  if (remembered) deck.remembered++; else deck.forgot++;
  deck.index++;
  deck.revealed = false;
  state.demo = false;
  saveState();
  renderShell();
  if (currentView === 'dashboard' || currentView === 'vault' || currentView === 'coach') renderView(currentView);
  renderDeck();
}

/* --------------------------------------------------------------------------
   Mocks & journal
   -------------------------------------------------------------------------- */
function handleMockSubmit(event) {
  event.preventDefault();
  const name = $('#mockName').value.trim();
  if (!name) { $('#mockName').focus(); toast('Name the mock so you can compare later.', 'warn'); return; }
  const total = Math.max(1, num($('#mockTotal').value, 100));
  const score = clamp(num($('#mockScore').value, 0), 0, total);
  const payload = {
    name, date: $('#mockDate').value || todayISO(), type: $('#mockType').value,
    score, total,
    right: Math.max(0, Math.floor(num($('#mockRight').value, 0))),
    wrong: Math.max(0, Math.floor(num($('#mockWrong').value, 0))),
    neg: Math.max(0, num($('#mockNeg').value, 0)),
    notes: $('#mockNotes').value.trim()
  };
  const editId = $('#mockEditId').value;
  if (editId) {
    const m = state.mocks.find((x) => x.id === editId);
    if (m) Object.assign(m, payload);
    toast('Mock updated.', 'success');
  } else {
    state.mocks.push({ id: uid('mk'), demo: false, ...payload });
    toast('Mock logged. Now add the mistake that cost you the most.', 'success');
  }
  state.demo = false;
  saveState();
  resetMockForm();
  refresh();
}

function editMock(id) {
  const m = state.mocks.find((x) => x.id === id);
  if (!m) return;
  switchView('tests');
  $('#mockEditId').value = m.id;
  $('#mockName').value = m.name;
  $('#mockDate').value = m.date;
  $('#mockType').value = m.type;
  $('#mockScore').value = String(m.score);
  $('#mockTotal').value = String(m.total);
  $('#mockRight').value = String(m.right);
  $('#mockWrong').value = String(m.wrong);
  $('#mockNeg').value = String(m.neg);
  $('#mockNotes').value = m.notes;
  $('#mockFormTitle').textContent = 'Edit mock';
  $('#mockSubmitBtn').innerHTML = `${icon('check')} Save changes`;
  $('#mockCancelBtn').hidden = false;
  $('#mockFormCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteMock(id) {
  const index = state.mocks.findIndex((m) => m.id === id);
  if (index < 0) return;
  confirmAction({
    title: 'Delete this mock?',
    body: `<p>This removes the score and its history point. The linked mistakes stay in your vault.</p>`,
    confirmText: 'Delete mock', danger: true,
    onConfirm: () => {
      const removed = state.mocks.splice(index, 1)[0];
      saveState(); refresh();
      toast('Mock deleted.', 'info', () => {
        state.mocks.splice(index, 0, removed);
        saveState(); refresh(); toast('Mock restored.', 'success');
      });
    }
  });
}

function handleJournalSubmit(event) {
  event.preventDefault();
  const text = $('#journalText').value.trim();
  if (!text) { $('#journalText').focus(); toast('Write one honest sentence about the session.', 'warn'); return; }
  state.journal.unshift({
    id: uid('j'), demo: false, type: $('#journalType').value,
    text, fix: $('#journalFix').value.trim(), date: todayISO()
  });
  state.demo = false;
  saveState();
  $('#journalText').value = '';
  $('#journalFix').value = '';
  refresh();
  toast('Journal entry saved.', 'success');
}

function deleteJournal(id) {
  const index = state.journal.findIndex((j) => j.id === id);
  if (index < 0) return;
  const removed = state.journal.splice(index, 1)[0];
  saveState(); refresh();
  toast('Journal entry deleted.', 'info', () => {
    state.journal.splice(index, 0, removed);
    saveState(); refresh(); toast('Entry restored.', 'success');
  });
}

/* --------------------------------------------------------------------------
   Settings, onboarding, demo & backups
   -------------------------------------------------------------------------- */
function openSettings() {
  $('#setTarget').value = state.profile.target;
  $('#setExamDate').value = state.profile.examDate;
  $('#setDailyGoal').value = String(state.profile.dailyGoalMin);
  $('#setTheme').value = document.documentElement.getAttribute('data-theme') || 'dark';
  $('#setNotify').value = state.profile.notify ? 'on' : 'off';
  $('#appVersionLine').textContent = `GATE ECE Study OS v${APP_VERSION} · ${state.mistakes.length} mistakes · ${state.tasks.length} tasks · data stored locally`;
  openDialog('settingsDialog');
}

async function handleSettingsSubmit(event) {
  event.preventDefault();
  const examDate = $('#setExamDate').value;
  if (!parseISODate(examDate)) { toast('Choose a valid exam date.', 'warn'); return; }
  state.profile.target = $('#setTarget').value.trim() || 'Target score';
  state.profile.examDate = examDate;
  state.profile.dailyGoalMin = clamp(num($('#setDailyGoal').value, 240), 15, 900);
  state.profile.notify = $('#setNotify').value === 'on';
  applyTheme($('#setTheme').value);
  if (state.profile.notify && 'Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (err) { /* ignore */ }
  }
  saveState();
  refresh();
  closeDialog('settingsDialog');
  toast('Settings saved.', 'success');
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = parsed && parsed.app === 'gate-os' && parsed.data ? normalizeState(parsed.data) : normalizeState(parsed);
    const images = parsed && ((parsed.images && typeof parsed.images === 'object') ? parsed.images : (parsed._embeddedImages || {})) || {};
    const counts = `${plural(imported.tasks.length, 'task', 'tasks')}, ${plural(imported.mistakes.length, 'mistake', 'mistakes')}, ${plural(imported.mocks.length, 'mock', 'mocks')}, ${plural(Object.keys(images).length, 'screenshot', 'screenshots')}`;
    confirmAction({
      title: 'Restore this backup?',
      body: `<p>Found <strong>${counts}</strong>.</p><p class="mt-2">Your current data will be saved to a local safety copy first. Screenshots are restored into this browser.</p>`,
      confirmText: 'Backup & restore',
      onConfirm: async () => {
        try { localStorage.setItem(LS_PREIMPORT, JSON.stringify(state)); } catch (err) { /* ignore */ }
        await ImageStore.clear();
        for (const [id, dataUrl] of Object.entries(images)) {
          if (typeof dataUrl === 'string' && id) await ImageStore.put(id, dataUrl);
        }
        state = imported;
        state.meta.onboarded = true;
        saveState();
        try { localStorage.setItem(LS_ONBOARDED, '1'); } catch (err) { /* ignore */ }
        document.documentElement.classList.remove('demo');
        refresh();
        closeDialog('settingsDialog');
        toast('Backup restored.', 'success');
      }
    });
  } catch (err) {
    console.warn('Import failed', err);
    toast('That file is not a valid Study OS backup.', 'error', null, 6000);
  }
}

function exportJSON() {
  (async () => {
    try {
      const images = {};
      for (const m of state.mistakes) {
        if (m.imageId && !images[m.imageId]) {
          const data = await ImageStore.get(m.imageId);
          if (data) images[m.imageId] = data;
        }
      }
      const payload = { app: 'gate-os', version: 2, exportedAt: new Date().toISOString(), data: state, images };
      downloadFile(`GATE_ECE_StudyOS_Backup_${todayISO()}.json`, JSON.stringify(payload, null, 2));
      toast(`Backup downloaded${Object.keys(images).length ? ` with ${Object.keys(images).length} screenshot(s)` : ''}.`, 'success');
    } catch (err) {
      console.error(err);
      toast('Could not build the backup.', 'error');
    }
  })();
}

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

function exportMistakeCSV() {
  if (!state.mistakes.length) { toast('No mistakes to export yet.', 'warn'); return; }
  const headers = ['Title', 'Subject', 'Topic', 'Cause', 'Source', 'Type', 'Marks', 'Negative', 'Opportunity', 'Marks lost', 'What went wrong', 'Golden fix', 'SRS box', 'Due', 'Revisions', 'Created'];
  const rows = state.mistakes.map((m) => [
    m.title, m.subject, m.topicId ? topicNameOf(m.topicId) : '', m.cause, m.source, m.type,
    m.marks, m.neg, m.opp, m.lost, m.wrong, m.fix, m.box, m.due, m.revisions,
    new Date(m.createdAt || Date.now()).toISOString().slice(0, 10)
  ].map(csvCell).join(','));
  downloadFile(`GATE_ECE_Mistake_Vault_${todayISO()}.csv`, `\ufeff${headers.map(csvCell).join(',')}\r\n${rows.join('\r\n')}`, 'text/csv');
  toast('Mistake vault exported as CSV.', 'success');
}

function exportWeeklyMarkdown() {
  const days = weeklyData();
  const today = todayISO();
  const totalFocus = days.reduce((a, d) => a + d.minutes, 0);
  const totalTasks = days.reduce((a, d) => a + d.tasks, 0);
  const totalReviews = days.reduce((a, d) => a + d.reviews, 0);
  const due = dueMistakes();
  const mocks = state.mocks.filter((m) => m.date >= days[0].iso);
  const weak = topWeakTopics(3);
  const causes = lostByCause().slice(0, 3);
  const pending = state.tasks.filter((t) => !t.done).sort((a, b) => String(a.reminderAt || '9999').localeCompare(String(b.reminderAt || '9999'))).slice(0, 6);

  const lines = [
    `# GATE ECE weekly review — ${dateLabel(days[0].iso)} to ${dateLabel(today)}`,
    '',
    `**Target:** ${state.profile.target}  `,
    `**Exam:** ${dateLabel(state.profile.examDate, { year: 'numeric' })} (${Math.max(0, daysToExam() ?? 0)} days)  `,
    `**Generated:** ${new Date().toLocaleString()}`,
    '',
    '## Focus & consistency',
    `- Focus time: **${formatMinutes(totalFocus)}** across 7 days (avg ${formatMinutes(Math.round(totalFocus / 7))}/day)`,
    `- Tasks completed: **${totalTasks}**`,
    `- Spaced-repetition reviews: **${totalReviews}**`,
    `- Mocks taken: **${mocks.length}**${mocks.length ? ` (${mocks.map((m) => `${m.name}: ${round(m.score, 1)}/${m.total}`).join('; ')})` : ''}`,
    '',
    '## Daily focus',
    ...days.map((d) => `- ${dateLabel(d.iso, { weekday: 'short', day: 'numeric', month: 'short' })}: ${formatMinutes(d.minutes)} · ${d.tasks} task(s) · ${d.reviews} review(s)`),
    '',
    '## Weak spots',
    ...(weak.length ? weak.map((w) => `- ${w.title} — **${round(w.lost, 1)} marks at risk** across ${w.count} card(s)`) : ['- No active weak spots logged.']),
    '',
    '## Root causes',
    ...(causes.length ? causes.map(([c, lost]) => `- ${c}: ${round(lost, 1)} marks at risk`) : ['- No cause data yet.']),
    '',
    '## Due now',
    ...(due.length ? due.slice(0, 10).map((m) => `- [ ] ${m.title} (Box ${m.box}, ${m.subject})`) : ['- Nothing due. Review ahead if you have capacity.']),
    '',
    '## Next actions',
    ...(pending.length ? pending.map((t) => `- [ ] ${t.title} — ${t.subject}${t.reminderAt ? ` (${t.reminderAt.replace('T', ' ')})` : ''}`) : ['- No open tasks. Add 3 specific tasks for the week.']),
    '',
    '---',
    '_Generated by GATE ECE Study OS. Data stayed on this device._'
  ];
  downloadFile(`GATE_ECE_Weekly_Review_${today}.md`, lines.join('\n'), 'text/markdown');
  toast('Weekly review downloaded.', 'success');
}

async function loadDemoData() {
  const hasOwn = state.tasks.length || state.mistakes.length || state.mocks.length || state.journal.length;
  const apply = async () => {
    const demo = buildDemoState();
    state.tasks.push(...demo.tasks);
    state.mistakes.push(...demo.mistakes);
    state.mocks.push(...demo.mocks);
    state.journal.push(...demo.journal);
    state.sessions.push(...demo.sessions);
    state.distractions.push(...demo.distractions);
    if (!state.chat.length) state.chat = demo.chat;
    state.demo = true;
    saveState();
    refresh();
    closeDialog('settingsDialog');
    toast('Demo data loaded. Everything is marked and removable.', 'success');
  };
  if (hasOwn) {
    confirmAction({
      title: 'Add demo data?',
      body: '<p>Demo tasks, mistakes, mocks and journal entries will be added alongside your data and marked as demo.</p>',
      confirmText: 'Add demo', onConfirm: apply
    });
  } else {
    await apply();
  }
}

async function clearDemoData(confirmFirst = true) {
  const doClear = async () => {
    if (state.demo) {
      const profile = { ...state.profile };
      const keep = {
        tasks: state.tasks.filter((t) => !t.demo),
        mistakes: state.mistakes.filter((m) => !m.demo),
        mocks: state.mocks.filter((m) => !m.demo),
        journal: state.journal.filter((j) => !j.demo),
        sessions: state.sessions.filter((s) => !s.demo),
        distractions: state.distractions.filter((d) => !d.demo),
        chat: state.chat.filter((c) => !c.demo),
        syllabus: state.syllabus
      };
      for (const m of state.mistakes) {
        if (m.demo && m.imageId) await ImageStore.del(m.imageId);
      }
      state = defaultState();
      state.profile = profile;
      state.tasks = keep.tasks;
      state.mistakes = keep.mistakes;
      state.mocks = keep.mocks;
      state.journal = keep.journal;
      state.sessions = keep.sessions;
      state.distractions = keep.distractions;
      state.chat = keep.chat;
      // Demo content never seeds or modifies the syllabus matrix, so keep all
      // real syllabus ticks and revision counts when the demo is removed.
      state.syllabus = keep.syllabus;
      state.meta.onboarded = true;
    } else {
      state.tasks = state.tasks.filter((t) => !t.demo);
      state.mistakes = state.mistakes.filter((m) => !m.demo);
      state.mocks = state.mocks.filter((m) => !m.demo);
      state.journal = state.journal.filter((j) => !j.demo);
      state.sessions = state.sessions.filter((s) => !s.demo);
      state.distractions = state.distractions.filter((d) => !d.demo);
    }
    state.demo = false;
    saveState();
    refresh();
    closeDialog('settingsDialog');
    toast('Demo data removed. Your own entries were kept.', 'success');
  };
  if (confirmFirst) {
    confirmAction({
      title: 'Remove demo data?',
      body: `<p>Demo tasks, cards, mocks and focus history will be deleted. Your own entries and syllabus progress stay.</p>`,
      confirmText: 'Remove demo', danger: true, onConfirm: doClear
    });
  } else {
    await doClear();
  }
}

function resetEverything() {
  confirmAction({
    title: 'Reset everything?',
    body: '<p>This permanently deletes all tasks, mistakes, mocks, focus history, journal entries and screenshots from this browser.</p><p class="mt-2"><strong>Export a backup first if you might need this data.</strong></p>',
    confirmText: 'Delete all data', danger: true,
    onConfirm: async () => {
      await ImageStore.clear();
      try {
        localStorage.removeItem(LS_STATE);
        localStorage.removeItem(LS_ONBOARDED);
        localStorage.removeItem(LS_TIMER);
        localStorage.removeItem(LS_PREIMPORT);
      } catch (err) { /* ignore */ }
      state = defaultState();
      timer = { subject: state.profile.focusSubject, preset: 25, phase: 'focus', remaining: 1500, running: false, endsAt: null };
      saveState(); refresh(); closeDialog('settingsDialog');
      toast('Workspace reset.', 'success');
      openOnboarding();
    }
  });
}

function openOnboarding() {
  const target = state.profile.target || '78+ marks (AIR < 50)';
  $('#onboardTarget').value = target;
  $('#onboardDate').value = state.profile.examDate || '2027-02-07';
  $('#onboardGoal').value = String([120, 240, 360, 480].includes(state.profile.dailyGoalMin) ? state.profile.dailyGoalMin : 240);
  openDialog('onboardDialog');
}

function finishOnboarding(useDemo) {
  const target = $('#onboardTarget').value.trim() || '78+ marks (AIR < 50)';
  const examDate = $('#onboardDate').value || '2027-02-07';
  const goal = clamp(num($('#onboardGoal').value, 240), 15, 900);
  const base = useDemo ? buildDemoState() : defaultState();
  base.profile.target = target;
  base.profile.examDate = examDate;
  base.profile.dailyGoalMin = goal;
  base.meta.onboarded = true;
  state = base;
  saveState();
  try { localStorage.setItem(LS_ONBOARDED, '1'); } catch (err) { /* ignore */ }
  timer = { subject: state.profile.focusSubject, preset: 25, phase: 'focus', remaining: 1500, running: false, endsAt: null };
  saveTimer();
  closeDialog('onboardDialog');
  refresh();
  toast(useDemo ? 'Demo workspace ready. Explore, then remove demo data when you start for real.' : 'Your workspace is ready. Add your first mistake or task.', 'success', null, 6000);
}

/* --------------------------------------------------------------------------
   Focus timer
   -------------------------------------------------------------------------- */
const RING_CIRCUMFERENCE = 2 * Math.PI * 66;

function defaultTimer() {
  return {
    subject: state.profile.focusSubject,
    preset: 25,
    phase: 'focus',
    remaining: 25 * 60,
    running: false,
    endsAt: null
  };
}

function loadTimer() {
  try {
    const raw = localStorage.getItem(LS_TIMER);
    if (!raw) return defaultTimer();
    const parsed = JSON.parse(raw);
    const base = defaultTimer();
    const preset = clamp(parsed.preset, 1, 180) || 25;
    return {
      subject: SUBJECTS.some((s) => s.name === parsed.subject) ? parsed.subject : base.subject,
      preset,
      phase: parsed.phase === 'break' ? 'break' : 'focus',
      remaining: clamp(parsed.remaining, 0, preset * 60),
      running: !!parsed.running,
      endsAt: Number(parsed.endsAt) || null
    };
  } catch (err) { return defaultTimer(); }
}

let timer = loadTimer();

function saveTimer() {
  try { localStorage.setItem(LS_TIMER, JSON.stringify(timer)); } catch (err) { /* ignore */ }
}

function timerRemainingSeconds() {
  if (timer.running && timer.endsAt) {
    return clamp(Math.ceil((timer.endsAt - Date.now()) / 1000), 0, timer.preset * 60);
  }
  return clamp(timer.remaining, 0, timer.preset * 60);
}
function timerElapsedSeconds() {
  return Math.max(0, timer.preset * 60 - timerRemainingSeconds());
}

function syncTimerUI() {
  const remaining = timerRemainingSeconds();
  const total = Math.max(1, timer.preset * 60);
  const fraction = remaining / total;
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  const timeText = formatTimer(remaining);
  const phaseText = timer.phase === 'break' ? 'Recovery break' : 'Focus block';

  $$('.js-timer-time').forEach((el) => { el.textContent = timeText; });
  const ring = $('#timerRing');
  if (ring) ring.setAttribute('stroke-dashoffset', String(offset));
  const focusRing = $('#focusRing');
  if (focusRing) focusRing.setAttribute('stroke-dashoffset', String(offset));
  const phase = $('#mainTimerPhase');
  if (phase) phase.textContent = phaseText;
  const focusPhase = $('#focusOverlayPhase');
  if (focusPhase) focusPhase.textContent = phaseText;
  const subj = $('#focusOverlaySubject');
  if (subj) subj.textContent = timer.subject;
  const hint = $('#focusOverlayHint');
  if (hint) hint.textContent = timer.phase === 'break'
    ? 'Stand up, look away from the screen and breathe.'
    : 'One block. One subject. No notifications.';

  const topTime = $('#topTimerTime');
  if (topTime) topTime.textContent = timeText;
  const topBtn = $('#topTimerBtn');
  if (topBtn) topBtn.classList.toggle('running', timer.running);
  const dot = $('#topTimerDot');

  $$('[data-timer-toggle]').forEach((btn) => {
    btn.innerHTML = timer.running
      ? `${icon('pause')}<span>Pause</span>`
      : `${icon('play')}<span>${timer.remaining < timer.preset * 60 && timer.remaining > 0 ? 'Resume' : 'Start'}</span>`;
    btn.setAttribute('aria-label', timer.running ? 'Pause focus session' : 'Start focus session');
  });
  $$('.timer-presets [data-preset]').forEach((btn) => {
    btn.classList.toggle('active', timer.phase === 'focus' && Number(btn.dataset.preset) === timer.preset);
  });
  $$('.js-subject-select').forEach((sel) => { sel.value = timer.subject; });

  const t = todayStats();
  const todayFocus = $('#timerTodayFocus');
  if (todayFocus) todayFocus.textContent = formatMinutes(t.mins);
  const distract = $('#timerTodayDistract');
  if (distract) distract.textContent = t.distractions;
  const streakEl = $('#timerStreak');
  if (streakEl) streakEl.textContent = `${streakDays()}d`;
  const breakBtn = $('#focusBreakBtn');
  if (breakBtn) breakBtn.classList.toggle('btn-primary', timer.phase === 'break');

  const label = timer.running ? `${timeText} · ${timer.phase === 'break' ? 'Break' : 'Focus'}` : 'GATE ECE Study OS';
  document.title = timer.running ? `${label} — GATE ECE Study OS` : 'GATE ECE Study OS';
}

function addFocusSession(minutes, partial = false) {
  const mins = Math.max(1, Math.round(minutes));
  state.sessions.push({
    id: uid('s'), demo: false, date: todayISO(), minutes: mins,
    subject: timer.subject, at: new Date().toISOString(), endedAt: new Date().toISOString()
  });
  state.demo = false;
  saveState();
  toast(`${partial ? 'Partial' : ''} focus session logged: ${mins} minutes on ${timer.subject}.`.replace('  ', ' '), 'success');
}

function finishTimer(silent = false) {
  const wasFocus = timer.phase === 'focus';
  const minutes = timer.preset;
  timer.running = false;
  timer.endsAt = null;
  timer.remaining = timer.preset * 60;
  if (wasFocus) {
    state.sessions.push({
      id: uid('s'), demo: false, date: todayISO(), minutes,
      subject: timer.subject, at: new Date(Date.now() - minutes * 60000).toISOString(), endedAt: new Date().toISOString()
    });
    state.demo = false;
    saveState();
    playChime(true);
    if (!silent) toast(`Block complete — ${minutes} minutes logged. Take 5 and reset your attention.`, 'success', null, 6000);
  } else {
    playChime(false);
    if (!silent) toast('Break over. Start the next block while the context is warm.', 'info');
  }
  saveTimer();
  syncTimerUI();
  if (currentView === 'dashboard') renderDashboard();
  else renderShell();
  if (currentView === 'coach') renderCoachSnapshot();
}

function toggleTimer() {
  if (timer.running) {
    timer.remaining = timerRemainingSeconds();
    timer.running = false;
    timer.endsAt = null;
    saveTimer(); syncTimerUI();
    toast(`Paused at ${formatTimer(timer.remaining)}.`, 'info', null, 2200);
  } else {
    if (timer.remaining <= 0) timer.remaining = timer.preset * 60;
    timer.running = true;
    timer.endsAt = Date.now() + timer.remaining * 1000;
    saveTimer(); syncTimerUI();
    playChime(false);
  }
}

function resetTimer() {
  const elapsed = timerElapsedSeconds();
  const shouldLog = timer.phase === 'focus' && elapsed >= 60;
  timer.running = false;
  timer.endsAt = null;
  timer.remaining = timer.preset * 60;
  if (shouldLog) addFocusSession(Math.floor(elapsed / 60), true);
  saveTimer(); syncTimerUI(); refresh();
  if (!shouldLog) toast('Timer reset.', 'info', null, 1800);
}

function setTimerPreset(minutes) {
  const elapsed = timerElapsedSeconds();
  if (timer.phase === 'focus' && timer.running && elapsed >= 60) addFocusSession(Math.floor(elapsed / 60), true);
  timer.preset = clamp(minutes, 1, 180);
  timer.phase = 'focus';
  timer.remaining = timer.preset * 60;
  timer.running = false;
  timer.endsAt = null;
  saveTimer(); syncTimerUI();
  toast(`Focus timer set to ${timer.preset} minutes.`, 'info', null, 2000);
}

function startBreak() {
  const elapsed = timerElapsedSeconds();
  if (timer.phase === 'focus' && timer.running && elapsed >= 60) addFocusSession(Math.floor(elapsed / 60), true);
  timer.phase = 'break';
  timer.preset = 5;
  timer.remaining = 5 * 60;
  timer.running = true;
  timer.endsAt = Date.now() + 5 * 60 * 1000;
  saveTimer(); syncTimerUI(); openFocus(false);
  toast('Five-minute break started. Stand up and look away from the screen.', 'info', null, 4000);
}

function tickTimer() {
  if (!timer.running) return;
  const remaining = timerRemainingSeconds();
  if (remaining <= 0) { finishTimer(false); return; }
  syncTimerUI();
}

function restoreTimerState() {
  if (!timer.running || !timer.endsAt) { syncTimerUI(); return; }
  if (timer.endsAt <= Date.now()) {
    timer.remaining = 0;
    finishTimer(true);
  } else {
    timer.remaining = timerRemainingSeconds();
    syncTimerUI();
  }
}

function openFocus(startIfIdle = false) {
  const overlay = $('#focusOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  syncTimerUI();
  if (startIfIdle && !timer.running) toggleTimer();
  setTimeout(() => overlay.querySelector('[data-close-focus]')?.focus(), 80);
}

function closeFocus() {
  const overlay = $('#focusOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   Sound: chime + brown noise
   -------------------------------------------------------------------------- */
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playTone(freq, duration = 0.18, delay = 0, gainValue = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function playChime(complete = false) {
  try {
    if (complete) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, 0.32, i * 0.13, 0.07));
    } else {
      playTone(660, 0.12, 0, 0.035);
    }
  } catch (err) { /* audio can be blocked until a gesture */ }
}

const noise = { src: null, gain: null, on: false };

function updateNoiseUI() {
  $$('.js-noise-label').forEach((el) => { el.textContent = noise.on ? 'Noise on' : 'Focus noise'; });
  $$('[data-noise]').forEach((btn) => {
    btn.classList.toggle('btn-primary', noise.on);
    btn.setAttribute('aria-pressed', String(noise.on));
  });
}

function toggleNoise() {
  try {
    const ctx = getAudioContext();
    if (!ctx) { toast('Audio is not supported in this browser.', 'warn'); return; }
    if (noise.on) {
      if (noise.src) { try { noise.src.stop(); } catch (err) { /* ignore */ } noise.src.disconnect(); noise.src = null; }
      if (noise.gain) { noise.gain.disconnect(); noise.gain = null; }
      noise.on = false;
      updateNoiseUI();
      toast('Focus noise stopped.', 'info', null, 1800);
      return;
    }
    const length = Math.floor(ctx.sampleRate * 3);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.09;
    src.connect(gain).connect(ctx.destination);
    src.start();
    noise.src = src; noise.gain = gain; noise.on = true;
    updateNoiseUI();
    toast('Brown-noise focus masker on.', 'success', null, 1800);
  } catch (err) {
    toast('Audio was blocked. Tap again to enable sound.', 'warn');
  }
}

/* --------------------------------------------------------------------------
   Distraction capture
   -------------------------------------------------------------------------- */
function openDistractionDialog() {
  const list = $('#distractionList');
  if (list) {
    list.innerHTML = DISTRACTIONS.map((d, i) => `
      <button class="list-item" type="button" data-distraction-cause="${i}" style="width:100%;text-align:left;cursor:pointer">
        <span class="kpi-icon" style="width:28px;height:28px;background:rgba(251,191,36,.12);color:var(--warn)">${icon('alert', 'i-sm')}</span>
        <span class="grow" style="flex:1;min-width:0">
          <h4>${escapeHtml(d.cause)}</h4>
          <p>${escapeHtml(d.fix)}</p>
        </span>
        ${icon('plus', 'i-sm')}
      </button>`).join('');
  }
  openDialog('distractionDialog');
}

function logDistraction(index) {
  const d = DISTRACTIONS[Number(index)];
  if (!d) return;
  state.distractions.push({
    id: uid('d'), demo: false, date: todayISO(), cause: d.cause, at: new Date().toISOString()
  });
  state.demo = false;
  saveState();
  closeDialog('distractionDialog');
  syncTimerUI();
  if (currentView === 'dashboard') renderDashboard();
  toast(`${d.cause} logged. Fix: ${d.fix}`, 'warn', null, 9000);
}

/* --------------------------------------------------------------------------
   Reminders
   -------------------------------------------------------------------------- */
function localNowMinute() {
  const d = new Date();
  return `${isoOf(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function checkReminders() {
  if (!state.tasks.length) return;
  const now = localNowMinute();
  const today = todayISO();
  const due = state.tasks.filter((t) => {
    if (t.done || !t.reminderAt) return false;
    const key = `${t.id}|${t.reminderAt}`;
    if (state.meta.fired?.[key]) return false;
    if (t.reminderAt > now) return false;
    const gap = daysBetweenISO(t.reminderAt.slice(0, 10), today);
    return gap >= 0 && gap <= 2;
  });
  if (!due.length) return;
  due.sort((a, b) => a.reminderAt.localeCompare(b.reminderAt));
  state.meta.fired = state.meta.fired || {};
  due.forEach((t) => { state.meta.fired[`${t.id}|${t.reminderAt}`] = Date.now(); });
  saveState();
  showReminderBanner(due[0], due.length);
  if (state.profile.notify && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Study reminder', { body: due[0].title, tag: due[0].id });
    } catch (err) { /* ignore */ }
  }
  toast(`Reminder: ${due[0].title}`, 'warn', null, 6000);
}

function showReminderBanner(task, count = 1) {
  const bar = $('#reminderBar');
  if (!bar) return;
  $('#reminderText').innerHTML = `<strong>${escapeHtml(task.title)}</strong>${count > 1 ? ` <span class="muted">(+${count - 1} more)</span>` : ''}`;
  bar.hidden = false;
  bar.dataset.taskId = task.id;
}

function dismissReminder() {
  const bar = $('#reminderBar');
  if (bar) { bar.hidden = true; delete bar.dataset.taskId; }
}

function goToReminderTask() {
  const id = $('#reminderBar')?.dataset.taskId;
  dismissReminder();
  switchView('planner');
  if (!id) return;
  setTimeout(() => {
    const row = document.querySelector(`[data-task-row="${cssEscape(id)}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.style.outline = '2px solid var(--warn)';
      setTimeout(() => { row.style.outline = ''; }, 1600);
    }
  }, 220);
}

/* --------------------------------------------------------------------------
   Coach: configuration, offline engine and live model
   -------------------------------------------------------------------------- */
const AI_DEFAULTS = {
  provider: 'offline',
  key: '',
  model: 'gemini-2.5-flash',
  baseUrl: 'https://api.openai.com/v1'
};

function getAiConfig() {
  try {
    const raw = localStorage.getItem(LS_AI);
    const parsed = raw ? JSON.parse(raw) : {};
    const provider = ['offline', 'gemini', 'openai'].includes(parsed.provider) ? parsed.provider : 'offline';
    return {
      provider,
      key: typeof parsed.key === 'string' ? parsed.key : '',
      model: parsed.model || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'),
      baseUrl: parsed.baseUrl || AI_DEFAULTS.baseUrl
    };
  } catch (err) { return { ...AI_DEFAULTS }; }
}

function setAiConfig(config) {
  try { localStorage.setItem(LS_AI, JSON.stringify(config)); } catch (err) { /* ignore */ }
}

function initAiConfigUI() {
  const cfg = getAiConfig();
  $('#aiProvider').value = cfg.provider;
  $('#aiModel').value = cfg.model;
  $('#aiBaseUrl').value = cfg.baseUrl;
  $('#aiKey').value = cfg.key;
  $('#aiBaseWrap').hidden = cfg.provider !== 'openai';
  renderAiStatus();
}

function showAiConfig() {
  const panel = $('#aiConfigPanel');
  const toggle = $('#aiConfigToggle');
  const open = panel.hidden;
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => $('#aiProvider').focus(), 60);
}

function saveAiSettings() {
  const provider = $('#aiProvider').value;
  const key = $('#aiKey').value.trim();
  const model = $('#aiModel').value.trim() || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');
  const baseUrl = ($('#aiBaseUrl').value.trim() || AI_DEFAULTS.baseUrl).replace(/\/+$/, '');
  if (provider !== 'offline' && !key) {
    toast('Add an API key to use a live model. The offline coach still works.', 'warn');
    return;
  }
  setAiConfig({ provider, key, model, baseUrl });
  renderAiStatus();
  toast(provider === 'offline' ? 'Offline coach enabled.' : 'Model settings saved locally.', 'success');
}

function coachDataSnapshot() {
  const due = dueMistakes();
  const weakTopics = topWeakTopics(5);
  const causes = lostByCause().slice(0, 4);
  const syllabusWeak = [...state.syllabus].filter((b) => !b.ga).sort((a, b) => subjectProgress(a) - subjectProgress(b)).slice(0, 3);
  const pending = state.tasks.filter((t) => !t.done).sort((a, b) => String(a.reminderAt || '9999').localeCompare(String(b.reminderAt || '9999'))).slice(0, 6);
  const mocks = sortedMocks().slice(-5);
  return {
    due, weakTopics, causes, syllabusWeak, pending, mocks,
    active: activeMistakes(),
    latest: latestMock()
  };
}

function buildCoachContext() {
  const s = coachDataSnapshot();
  const lines = [
    `Target: ${state.profile.target}; exam: ${state.profile.examDate}; days left: ${daysToExam() ?? 'unknown'}.`,
    `Syllabus EC core: ${ecSyllabusProgress()}%; GA: ${gaProgress()}%.`,
    `Active mistakes: ${s.active.length}; due now: ${s.due.length}; mastered: ${masteredMistakes().length}.`,
    `Mock accuracy: ${mockAccuracy().accuracy}% across ${state.mocks.length} mocks.`,
    `Pending tasks: ${state.tasks.filter((t) => !t.done).length}.`,
    `Weakest sections: ${s.syllabusWeak.map((b) => `${b.subject} ${subjectProgress(b)}%`).join(', ') || 'none tracked'}.`,
    `Top weak topics: ${s.weakTopics.map((w) => `${w.title} (${round(w.lost, 1)}M)`).join('; ') || 'none'}.`,
    `Root causes: ${s.causes.map(([c, l]) => `${c} (${round(l, 1)}M)`).join('; ') || 'none'}.`,
    `Due cards: ${s.due.slice(0, 6).map((m) => `${m.title} [Box ${m.box}]`).join('; ') || 'none'}.`,
    `Open tasks: ${s.pending.map((t) => `${t.title} (${t.subject})`).join('; ') || 'none'}.`,
    `Recent mocks: ${s.mocks.map((m) => `${m.name}: ${round(m.score, 1)}/${m.total}, ${m.right}R/${m.wrong}W`).join('; ') || 'none'}.`
  ];
  return lines.join('\n');
}

function coachInsightSummary() {
  const s = coachDataSnapshot();
  const active = s.active.length;
  const due = s.due.length;
  const weak = s.weakTopics[0];
  const cause = s.causes[0];
  const lowest = s.syllabusWeak[0];
  const latest = s.latest;
  return { s, active, due, weak, cause, lowest, latest };
}

function offlineCoachReply(prompt) {
  const q = String(prompt || '').toLowerCase();
  const { s, active, due, weak, cause, lowest, latest } = coachInsightSummary();
  const pending = state.tasks.filter((t) => !t.done);

  const header = `**Snapshot:** ${active} active ${active === 1 ? 'card' : 'cards'}, ${due} due now, ${pending.length} open ${pending.length === 1 ? 'task' : 'tasks'}, EC syllabus at ${ecSyllabusProgress()}%.`;

  if (/(7|seven)[\s-]*(day|days)|week plan|study plan|plan my week/.test(q)) {
    const focusSubjects = s.syllabusWeak.slice(0, 3).map((b) => b.subject);
    if (s.weakTopics[0] && !focusSubjects.includes(s.weakTopics[0].subject)) focusSubjects.unshift(s.weakTopics[0].subject);
    const subjects = [...new Set(focusSubjects)].slice(0, 3);
    while (subjects.length < 3) subjects.push(...['Signals & Systems', 'Digital Circuits', 'General Aptitude'].filter((x) => !subjects.includes(x)).slice(0, 3 - subjects.length));
    const plan = [
      `**Day 1 — Reset the recall queue (2h 15m)**`,
      `• Clear ${Math.min(due, 12) || 8} due flashcard${due === 1 ? '' : 's'}; write each fix from memory before revealing.`,
      `• 30m formula sheet for **${cause ? cause[0] : 'your top cause'}** using the entries already in the vault.`,
      `• 25m timed warm-up set from ${subjects[0]}.`,
      ``,
      `**Day 2 — ${subjects[0]} repair (3h)**`,
      `• 60m theory pass on the weakest subtopic${weak ? ` (**${weak.title}**)` : ''}, then explain it aloud in 3 minutes.`,
      `• 20 timed PYQs; every miss goes to the vault with a one-line fix.`,
      ``,
      `**Day 3 — ${subjects[1]} + error review (3h)**`,
      `• 90m mixed PYQs on ${subjects[1]}.`,
      `• 45m re-solve the 5 most expensive vault cards without looking at the fix.`,
      ``,
      `**Day 4 — ${subjects[2]} + General Aptitude (2h 30m)**`,
      `• 60m ${subjects[2]} theory/PYQ mix.`,
      `• 30m GA set (data interpretation + verbal) under a timer.`,
      `• 20m update the syllabus matrix honestly.`,
      ``,
      `**Day 5 — Timed sectional (2h)**`,
      `• 90m sectional test; no pauses.`,
      `• 30m analyse: classify every miss by root cause, not by chapter.`,
      ``,
      `**Day 6 — Repair from the sectional (3h)**`,
      `• 60m re-learn the two costliest traps from Day 5.`,
      `• 60m 30 mixed 2-mark questions.`,
      `• 30m active recall of all Box 1 cards.`,
      ``,
      `**Day 7 — Light consolidation (1h 30m)**`,
      `• 45m formula sheet + error index.`,
      `• 30m easy PYQs to stay sharp.`,
      `• 15m plan next week around the lowest syllabus section${lowest ? ` (${lowest.subject} at ${subjectProgress(lowest)}%)` : ''}.`
    ];
    return {
      text: `${header}\n\nHere is a 7-day plan built from your actual gaps — not a generic timetable. Times assume about 3 focused hours/day; scale them proportionally.\n\n${plan.join('\n')}\n\n**Rule:** every study block ends with either a timed question set or a written recall. Reading alone does not count.`,
      suggestion: { title: `Clear ${Math.min(due, 12) || 8} due recall cards, then 20 timed PYQs on ${subjects[0]}`, subject: subjects[0] }
    };
  }

  if (/weak|worst|analys|analy|diagnos|gap/.test(q)) {
    const lostSubjects = lostBySubject();
    const topLost = lostSubjects[0];
    const accuracy = mockAccuracy();
    const trend = s.mocks.length >= 2 ? s.mocks.at(-1).score - s.mocks.at(-2).score : null;
    const lines = [
      header,
      ``,
      `**Diagnosis**`,
      topLost ? `• The largest marks leak is **${topLost[0]}** (${round(topLost[1], 1)} marks at risk).` : '• No marks leak is logged yet, so the syllabus is your best signal.',
      lowest ? `• The lowest tracked section is **${lowest.subject}** at **${subjectProgress(lowest)}%** — that is likely to cap your score before exam day.` : '',
      weak ? `• Your costliest single topic is **${weak.title}** (${round(weak.lost, 1)}M across ${weak.count} cards).` : '',
      cause ? `• The dominant root cause is **${cause[0]}** (${round(cause[1], 1)}M). Treat it as a process problem, not a knowledge problem.` : '',
      latest ? `• Latest mock: **${round(latest.score, 1)}/${latest.total}**, ${latest.right}R / ${latest.wrong}W. ${trend == null ? '' : trend >= 0 ? `Up ${round(trend, 1)} marks from the previous mock.` : `Down ${round(Math.abs(trend), 1)} marks from the previous mock.`}` : '• No mock data yet; log one to calibrate strategy.',
      ``,
      `**Do this next (in order)**`,
      `1. Clear ${due} due recall card${due === 1 ? '' : 's'} today.`,
      `2. Spend 90 minutes on **${topLost ? topLost[0] : subjectsOrFallback()}**, split into 45m theory + 45m timed questions.`,
      `3. Re-solve 3 vault cards from **${weak ? weak.subject : 'your weakest subject'}** without looking at the fix.`,
      `4. Add one new line to your formula sheet for ${cause ? cause[0].toLowerCase() : 'the most common slip'}.`,
      `5. Only then start new material.`,
      ``,
      `**Falsifiable check:** after 7 days, your ${topLost ? topLost[0] : 'weakest subject'} accuracy on a fresh 20-question set should rise by at least 10 points. If not, the problem is exam execution, not content.`
    ].filter(Boolean);
    return {
      text: lines.join('\n'),
      suggestion: { title: `90-minute repair block: 45m theory + 45m timed PYQs on ${topLost ? topLost[0] : (weak ? weak.subject : 'your weakest subject')}`, subject: topLost ? topLost[0] : (weak ? weak.subject : state.profile.focusSubject) }
    };
  }

  if (/drill|practice|question|problem set/.test(q)) {
    const topics = topWeakTopics(5);
    const drills = topics.length ? topics : [{ title: 'Your weakest syllabus section', subject: lowest ? lowest.subject : state.profile.focusSubject, lost: 0 }];
    const lines = [
      header,
      ``,
      `**Five targeted drills** — 25 minutes each, closed book:`,
      ...drills.map((t, i) => `${i + 1}. **${t.title}** — 10 mixed questions (5 easy, 4 GATE-level, 1 trap). Re-derive the governing formula before Q1. Target: 8/10 with clean steps.`),
      ``,
      `**After each drill:** compare against the vault fix, then log any new trap in one sentence. Do not do all five back-to-back — two per day is plenty.`
    ];
    return {
      text: lines.join('\n'),
      suggestion: { title: `Targeted drill: 10 mixed questions on ${drills[0].title}`, subject: drills[0].subject }
    };
  }

  if (/2[\s-]*hour|two[\s-]*hour|today|right now|next step|overwhelm/.test(q)) {
    const dueCards = dueMistakes().slice(0, 8);
    const target = s.weakTopics[0];
    return {
      text: `${header}\n\n**Your next 2 hours**\n\n• **0–15m — clear the queue.** Recall ${dueCards.length || 'your due'} card${dueCards.length === 1 ? '' : 's'} and say each fix aloud.\n• **15–30m — pick one target.** ${target ? `Work on **${target.title}** (${target.subject}).` : `Work on **${lowest ? lowest.subject : state.profile.focusSubject}**.`}\n• **30–90m — do, don’t read.** 12–15 timed questions from that target. Mark every guess with a dot.\n• **90–110m — repair.** Re-solve the misses without notes; log one new vault card per distinct trap.\n• **110–120m — close the loop.** Write tomorrow’s first action in your planner and stop.\n\n**Boundary:** no new theory videos in this block. If you finish early, review Box 1 cards — do not start a new subject.`,
      suggestion: { title: `2-hour block: recall queue + timed questions on ${target ? target.subject : (lowest ? lowest.subject : state.profile.focusSubject)}`, subject: target ? target.subject : (lowest ? lowest.subject : state.profile.focusSubject) }
    };
  }

  if (/mock|score|trend|accuracy|negative/.test(q)) {
    const mocks = s.mocks;
    const acc = mockAccuracy();
    if (!mocks.length) {
      return {
        text: `${header}\n\nYou have no mock data yet, so any “trend” would be invented. Log one full-length mock this week under real timing. Then bring me the score, correct/wrong counts and the two questions that cost the most. I will turn that into a repair plan.`,
        suggestion: { title: 'Take a timed full-length mock and log the result', subject: 'General Aptitude' }
      };
    }
    const first = mocks[0], last = mocks.at(-1);
    const delta = last.score - first.score;
    const avgNeg = round(mocks.reduce((a, m) => a + m.neg, 0) / mocks.length, 2);
    const lines = [
      header,
      ``,
      `**Mock read**`,
      `• Scores: ${mocks.map((m) => `${dateLabel(m.date)}: ${round(m.score, 1)}`).join(' → ')}.`,
      `• Net change across the window: **${delta >= 0 ? '+' : ''}${round(delta, 1)} marks**.`,
      `• Overall accuracy across all mocks: **${acc.accuracy}%** (${acc.right}R / ${acc.wrong}W).`,
      `• Average negative marks per mock: **${avgNeg}**.`,
      ``,
      `**What it means**`,
      delta > 3 ? '• The trend is genuinely positive. Protect the routine that produced it.' : delta < -3 ? '• The dip is likely execution or sample size, not ability. Check sleep, timing and silly errors before changing the whole plan.' : '• Scores are flat. Flat is a signal to change the input quality, not to work more hours.',
      avgNeg > 3 ? `• Negative marking is eating about ${avgNeg} marks per paper. Attempt fewer speculative questions; skip when two options remain and you cannot eliminate one.` : '• Negative marking is under control. Your upside is in unattempted 2-mark questions.',
      ``,
      `**Next mock**`,
      `• Set a hard per-section time budget before starting.`,
      `• Circle every question you guess; after the test, log them all in the vault.`,
      `• Compare accuracy on guessed vs known questions — that gap is your real weakness.`
    ];
    return {
      text: lines.join('\n'),
      suggestion: { title: 'Analyse the last mock: log the two costliest questions in the vault', subject: last.type === 'Subject test' ? state.profile.focusSubject : 'General Aptitude' }
    };
  }

  if (/motivat|tired|burn|give up|anxious|stress|afraid/.test(q)) {
    return {
      text: `**No hype — just the record.**\n\nYou have ${formatMinutes(state.sessions.reduce((a, s) => a + s.minutes, 0))} of logged focus, ${state.mistakes.length} capture${state.mistakes.length === 1 ? '' : 's'} in the vault, and a ${streakDays()}-day streak. That is evidence you can act, even when motivation is low.\n\nToday’s instruction is deliberately small:\n\n• Set a 25-minute timer.\n• Open **${s.weakTopics[0] ? s.weakTopics[0].title : (lowest ? lowest.subject : state.profile.focusSubject)}**.\n• Do 5 questions. Only 5.\n• Log one line in the journal afterwards.\n\nYou do not need to feel ready. You need one honest block. If you are genuinely exhausted, take the rest — but schedule the next block now, with a time and a subject.`,
      suggestion: { title: `25-minute restart: 5 questions on ${s.weakTopics[0] ? s.weakTopics[0].subject : (lowest ? lowest.subject : state.profile.focusSubject)}`, subject: s.weakTopics[0] ? s.weakTopics[0].subject : (lowest ? lowest.subject : state.profile.focusSubject) }
    };
  }

  if (/formula|sheet|revision|revise/.test(q)) {
    return {
      text: `${header}\n\n**Build a one-page formula sheet — not a textbook.**\n\n1. Take the **5 costliest vault cards** (${topWeakTopics(5).map((w) => w.title).join(' · ') || 'add a few cards first'}).\n2. For each, write the governing formula, its assumptions, and the one sign/unit trap you hit.\n3. Close the source and re-derive each formula from memory.\n4. Two days later, do it again on a blank page. Only the formulas you reproduce count as revised.\n\n**Revision rule:** spaced, effortful, and short. A 15-minute blank-page recall beats 60 minutes of highlighting. ${lowest ? `Start with **${lowest.subject}** (${subjectProgress(lowest)}%).` : ''}`,
      suggestion: { title: 'Create a one-page formula sheet for the five costliest vault cards', subject: s.weakTopics[0] ? s.weakTopics[0].subject : state.profile.focusSubject }
    };
  }

  return {
    text: `${header}\n\nAsk me for a **7-day plan**, a **weak-subject diagnosis**, **5 drills**, a **2-hour plan**, or a **mock trend** read. I can also turn any suggestion into a task.\n\n**Right now, the highest-leverage move is:**\n${due > 0 ? `• Clear ${due} due recall card${due === 1 ? '' : 's'} before starting anything new.` : '• No reviews due — attempt a timed set from your weakest section.'}\n${s.weakTopics[0] ? `• Then 45 minutes on **${s.weakTopics[0].title}** (${s.weakTopics[0].subject}).` : `• Then 45 minutes of timed questions on **${lowest ? lowest.subject : state.profile.focusSubject}**.`}\n• Finish by writing the next physical action in your planner.`,
    suggestion: {
      title: s.weakTopics[0] ? `45-minute timed set on ${s.weakTopics[0].title}` : `45-minute timed set on ${lowest ? lowest.subject : state.profile.focusSubject}`,
      subject: s.weakTopics[0] ? s.weakTopics[0].subject : (lowest ? lowest.subject : state.profile.focusSubject)
    }
  };
}

function subjectsOrFallback() {
  const lowest = [...state.syllabus].filter((b) => !b.ga).sort((a, b) => subjectProgress(a) - subjectProgress(b))[0];
  return lowest ? lowest.subject : state.profile.focusSubject;
}

let chatBusy = false;
function setChatBusy(busy) {
  chatBusy = busy;
  const btn = $('#chatSendBtn');
  if (!btn) return;
  btn.disabled = busy;
  btn.innerHTML = busy ? `${icon('clock')}` : `${icon('send')}`;
  btn.setAttribute('aria-busy', String(busy));
}

async function callLiveModel(userPrompt, { test = false } = {}) {
  const cfg = getAiConfig();
  if (cfg.provider === 'offline' || !cfg.key) throw new Error('No live model is configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const system = `You are a concise, evidence-based GATE ECE study coach. Use only the student data provided; never invent numbers. Be direct and practical. Use plain text with **bold**, short paragraphs and bullet lines starting with •. No tables. Keep answers under 320 words unless the student asks for a day-by-day plan. Finish with one concrete next action. If data is missing, say so and ask for the smallest useful input.\n\nSTUDENT DATA:\n${buildCoachContext()}`;
  try {
    if (cfg.provider === 'gemini') {
      const model = cfg.model || 'gemini-2.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: test ? 40 : 1100 }
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let message = `Gemini returned ${res.status}`;
        try { const parsed = JSON.parse(errText); message = parsed.error?.message || message; } catch (err) { /* ignore */ }
        throw new Error(message.slice(0, 220));
      }
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim();
      if (!text) throw new Error('Gemini returned an empty response (possibly blocked)');
      return text;
    }
    const base = (cfg.baseUrl || AI_DEFAULTS.baseUrl).replace(/\/+$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: test ? 40 : 1100,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userPrompt }]
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let message = `API returned ${res.status}`;
      try { const parsed = JSON.parse(errText); message = parsed.error?.message || message; } catch (err) { /* ignore */ }
      throw new Error(message.slice(0, 220));
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('The model returned an empty response');
    return text;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendChatMessage(rawText) {
  const text = String(rawText || '').trim();
  if (!text || chatBusy) return;
  state.chat.push({ role: 'me', text: text.slice(0, 2000), at: Date.now() });
  state.chat = state.chat.slice(-60);
  saveState();
  renderChat();
  const input = $('#chatInput');
  if (input) { input.value = ''; input.style.height = 'auto'; }
  setChatBusy(true);

  const cfg = getAiConfig();
  let reply = '';
  let suggestion = null;
  let liveError = '';
  if (cfg.provider !== 'offline' && cfg.key) {
    try {
      reply = await callLiveModel(text);
    } catch (err) {
      liveError = err.message || 'Network or CORS error';
    }
  }
  if (!reply) {
    const offline = offlineCoachReply(text);
    reply = offline.text;
    suggestion = offline.suggestion;
    if (liveError) reply = `I couldn't reach the live model (${liveError}).\n\n**Offline analysis**\n\n${reply}`;
  }
  state.chat.push({ role: 'ai', text: reply.slice(0, 8000), at: Date.now() });
  state.chat = state.chat.slice(-60);
  state.meta.lastSuggestion = suggestion || null;
  saveState();
  setChatBusy(false);
  renderChat();
  renderSuggestion();
  renderCoachSnapshot();
  renderAiStatus();
}

function acceptSuggestion() {
  const s = state.meta.lastSuggestion;
  if (!s) return;
  const subject = SUBJECTS.some((x) => x.name === s.subject) ? s.subject : state.profile.focusSubject;
  state.tasks.unshift({
    id: uid('t'), demo: false, title: s.title, subject,
    type: 'Revision & notes', priority: 'High',
    reminderAt: `${addDaysISO(todayISO(), 1)}T09:00`,
    done: false, completedAt: null, createdAt: Date.now()
  });
  state.meta.lastSuggestion = null;
  state.demo = false;
  saveState();
  renderSuggestion();
  refresh();
  toast('Suggested task added to tomorrow’s plan.', 'success');
}

function clearChat() {
  confirmAction({
    title: 'Clear coach chat?',
    body: '<p>Only the conversation is removed. Your tasks, vault and progress stay untouched.</p>',
    confirmText: 'Clear chat', danger: true,
    onConfirm: () => {
      state.chat = [];
      state.meta.lastSuggestion = null;
      saveState();
      renderChat(); renderSuggestion();
      toast('Chat cleared.', 'success');
    }
  });
}

/* --------------------------------------------------------------------------
   Event wiring
   -------------------------------------------------------------------------- */
function wireEvents() {
  // Navigation + global actions (delegated).
  document.addEventListener('click', (event) => {
    const target = event.target;

    const nav = target.closest('[data-nav]');
    if (nav) { switchView(nav.dataset.nav); return; }
    const go = target.closest('[data-go]');
    if (go) { switchView(go.dataset.go); return; }

    if (target.closest('[data-open-settings]')) { openSettings(); return; }
    if (target.closest('[data-theme-toggle]')) { toggleTheme(); return; }
    if (target.closest('[data-start-focus]')) { openFocus(true); return; }
    if (target.closest('[data-open-focus]')) { openFocus(false); return; }
    if (target.closest('[data-close-focus]')) { closeFocus(); return; }
    if (target.closest('[data-timer-toggle]')) { toggleTimer(); return; }
    if (target.closest('[data-timer-reset]')) { resetTimer(); return; }
    const preset = target.closest('[data-preset]');
    if (preset) { setTimerPreset(Number(preset.dataset.preset)); return; }
    if (target.closest('[data-noise]')) { toggleNoise(); return; }
    if (target.closest('[data-distraction]')) { openDistractionDialog(); return; }
    if (target.closest('[data-new-mistake]')) { openMistakeNew(); return; }
    if (target.closest('[data-start-deck]')) { startDeck(); return; }
    const review = target.closest('[data-review]');
    if (review) { startDeck(review.dataset.review); return; }
    const quick = target.closest('[data-quick-focus]');
    if (quick) {
      if (timer.running) toggleTimer();
      timer.preset = Number(quick.dataset.quickFocus) || 25;
      timer.phase = 'focus';
      timer.remaining = timer.preset * 60;
      saveTimer(); syncTimerUI(); openFocus(false); toggleTimer();
      return;
    }
    const close = target.closest('[data-close-dialog]');
    if (close) { closeDialog(close.dataset.closeDialog); return; }
    if (target.closest('[data-clear-demo]')) { clearDemoData(true); return; }

    const taskToggle = target.closest('[data-task-toggle]');
    if (taskToggle) { toggleTask(taskToggle.dataset.taskToggle); return; }
    const taskEdit = target.closest('[data-task-edit]');
    if (taskEdit) { editTask(taskEdit.dataset.taskEdit); return; }
    const taskDel = target.closest('[data-task-del]');
    if (taskDel) { deleteTask(taskDel.dataset.taskDel); return; }
    const taskFilterBtn = target.closest('[data-task-filter]');
    if (taskFilterBtn) { taskFilter = taskFilterBtn.dataset.taskFilter; renderTaskList(); return; }

    const subjectToggle = target.closest('[data-subject-toggle]');
    if (subjectToggle) { toggleSubject(Number(subjectToggle.dataset.subjectToggle)); return; }
    const revision = target.closest('[data-topic-rev]');
    if (revision) { incrementRevision(Number(revision.dataset.topicRev), revision.dataset.topicId); return; }
    const jump = target.closest('[data-jump-subject]');
    if (jump) { jumpToSubject(jump.dataset.jumpSubject); return; }

    const mistakeEdit = target.closest('[data-mistake-edit]');
    if (mistakeEdit) { openMistakeEdit(mistakeEdit.dataset.mistakeEdit); return; }
    const mistakeDel = target.closest('[data-mistake-del]');
    if (mistakeDel) { deleteMistake(mistakeDel.dataset.mistakeDel); return; }
    const imageOpen = target.closest('[data-open-image]');
    if (imageOpen) { openImageLightbox(imageOpen.dataset.openImage); return; }
    const vaultOpen = target.closest('[data-vault-open]');
    if (vaultOpen) {
      switchView('vault');
      setTimeout(() => {
        const card = document.querySelector(`[data-mistake-card="${cssEscape(vaultOpen.dataset.vaultOpen)}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.outline = '2px solid var(--accent)';
          setTimeout(() => { card.style.outline = ''; }, 1700);
        }
      }, 200);
      return;
    }

    const mockEdit = target.closest('[data-mock-edit]');
    if (mockEdit) { editMock(mockEdit.dataset.mockEdit); return; }
    const mockDel = target.closest('[data-mock-del]');
    if (mockDel) { deleteMock(mockDel.dataset.mockDel); return; }
    const mockMistake = target.closest('[data-mock-mistake]');
    if (mockMistake) {
      const mock = state.mocks.find((m) => m.id === mockMistake.dataset.mockMistake);
      openMistakeNew({ source: 'Mock test', title: mock ? `${mock.name}: ` : '', subject: state.profile.focusSubject });
      return;
    }
    const journalDel = target.closest('[data-journal-del]');
    if (journalDel) { deleteJournal(journalDel.dataset.journalDel); return; }

    if (target.closest('[data-reveal]')) { deck.revealed = true; renderDeck(); return; }
    const grade = target.closest('[data-grade]');
    if (grade) { gradeDeck(grade.dataset.grade === 'remembered'); return; }
    if (target.closest('[data-deck-restart]')) { startDeck(); return; }

    const distraction = target.closest('[data-distraction-cause]');
    if (distraction) { logDistraction(distraction.dataset.distractionCause); return; }

    if (target.closest('[data-accept-suggestion]')) { acceptSuggestion(); return; }
    if (target.closest('[data-dismiss-suggestion]')) {
      state.meta.lastSuggestion = null; saveState(); renderSuggestion(); return;
    }
    const prompt = target.closest('[data-prompt]');
    if (prompt) { sendChatMessage(prompt.dataset.prompt); return; }

    if (target.closest('#exportWeekBtn')) { exportWeeklyMarkdown(); return; }
    if (target.closest('#exportWeekBtn2')) { exportWeeklyMarkdown(); return; }
    if (target.closest('#dashAddMistake')) { openMistakeNew(); return; }
    if (target.closest('#vaultAddBtn')) { openMistakeNew(); return; }
    if (target.closest('#startDeckBtn') || target.closest('#startDeckDash')) { startDeck(); return; }
    if (target.closest('#clearDoneTasks')) {
      const doneCount = state.tasks.filter((t) => t.done).length;
      if (!doneCount) { toast('No completed tasks to clear.', 'info'); return; }
      confirmAction({
        title: 'Clear completed tasks?',
        body: `<p>${plural(doneCount, 'completed task', 'completed tasks')} will be removed.</p>`,
        confirmText: 'Clear done', danger: true,
        onConfirm: () => {
          state.tasks = state.tasks.filter((t) => !t.done);
          saveState(); refresh(); toast('Completed tasks cleared.', 'success');
        }
      });
      return;
    }
  });

  // Forms
  $('#taskForm')?.addEventListener('submit', handleTaskSubmit);
  $('#taskCancelBtn')?.addEventListener('click', resetTaskForm);
  $('#mistakeForm')?.addEventListener('submit', handleMistakeSubmit);
  $('#mockForm')?.addEventListener('submit', handleMockSubmit);
  $('#mockCancelBtn')?.addEventListener('click', resetMockForm);
  $('#journalForm')?.addEventListener('submit', handleJournalSubmit);
  $('#settingsForm')?.addEventListener('submit', handleSettingsSubmit);
  $('#chatForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendChatMessage($('#chatInput').value);
  });
  $('#chatInput')?.addEventListener('input', (event) => {
    const el = event.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(120, el.scrollHeight)}px`;
  });

  // Settings actions
  $('#exportJsonBtn')?.addEventListener('click', exportJSON);
  $('#exportCsvBtn')?.addEventListener('click', exportMistakeCSV);
  $('#importBtn')?.addEventListener('click', () => $('#importInput').click());
  $('#importInput')?.addEventListener('change', handleImportFile);
  $('#loadDemoBtn')?.addEventListener('click', loadDemoData);
  $('#clearDemoBtn')?.addEventListener('click', () => clearDemoData(true));
  $('#resetAllBtn')?.addEventListener('click', resetEverything);

  // Confirm
  $('#confirmOkBtn')?.addEventListener('click', () => {
    const fn = confirmHandler;
    confirmHandler = null;
    closeDialog('confirmDialog');
    if (fn) setTimeout(fn, 30);
  });
  $('#confirmCancelBtn')?.addEventListener('click', () => { confirmHandler = null; closeDialog('confirmDialog'); });

  // Onboarding
  $('#onboardStartBtn')?.addEventListener('click', () => finishOnboarding(false));
  $('#onboardDemoBtn')?.addEventListener('click', () => finishOnboarding(true));

  // Syllabus checkboxes (delegated because the matrix is re-rendered).
  document.addEventListener('change', (event) => {
    const check = event.target.closest('[data-topic-check]');
    if (!check) return;
    toggleTopicCheck(Number(check.dataset.subject), check.dataset.topic, check.dataset.field, check.checked);
  });

  // Filters
  $('#vaultSearch')?.addEventListener('input', debounce(renderVault, 140));
  ['vaultSubject', 'vaultCause', 'vaultStatus', 'vaultSort'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderVault);
  });

  // Mistake form dynamics
  $('#mSubject')?.addEventListener('change', (event) => populateTopicSelect(event.target.value, ''));
  $('#mType')?.addEventListener('change', () => {
    const type = $('#mType').value;
    const marks = num($('#mMarks').value, 2);
    $('#mNeg').value = String(autoNegFor(type, marks));
    updateLossPreview();
  });
  $('#mMarks')?.addEventListener('change', () => {
    $('#mNeg').value = String(autoNegFor($('#mType').value, num($('#mMarks').value, 2)));
    $('#mOpp').value = $('#mMarks').value === '0' ? '0' : $('#mMarks').value;
    updateLossPreview();
  });
  ['mNeg', 'mOpp', 'mMarks']?.forEach((id) => document.getElementById(id)?.addEventListener('input', updateLossPreview));

  // Image input / dropzone / paste
  const dropzone = $('#mDropzone');
  const imageInput = $('#mImage');
  dropzone?.addEventListener('click', () => imageInput?.click());
  dropzone?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); imageInput?.click(); }
  });
  imageInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) attachMistakeImage(file);
  });
  ['dragenter', 'dragover'].forEach((type) => dropzone?.addEventListener(type, (event) => {
    event.preventDefault(); dropzone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((type) => dropzone?.addEventListener(type, (event) => {
    event.preventDefault(); dropzone.classList.remove('dragover');
  }));
  dropzone?.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) attachMistakeImage(file);
  });
  $('#mImgRemove')?.addEventListener('click', () => {
    mistakeImage.dataUrl = null;
    mistakeImage.removed = true;
    showMistakePreview();
    if (imageInput) imageInput.value = '';
    toast('Screenshot removed from this card.', 'info', null, 2000);
  });
  document.addEventListener('paste', (event) => {
    if (!document.getElementById('mistakeDialog')?.open) return;
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) { event.preventDefault(); attachMistakeImage(file); }
    }
  });

  // AI coach settings
  $('#aiConfigToggle')?.addEventListener('click', showAiConfig);
  $('#aiProvider')?.addEventListener('change', () => {
    const provider = $('#aiProvider').value;
    $('#aiBaseWrap').hidden = provider !== 'openai';
    if (provider === 'gemini' && (!$('#aiModel').value || $('#aiModel').value === 'gpt-4o-mini')) $('#aiModel').value = 'gemini-2.5-flash';
    if (provider === 'openai' && (!$('#aiModel').value || $('#aiModel').value === 'gemini-2.5-flash')) $('#aiModel').value = 'gpt-4o-mini';
  });
  $('#aiSaveBtn')?.addEventListener('click', saveAiSettings);
  $('#aiTestBtn')?.addEventListener('click', async () => {
    const btn = $('#aiTestBtn');
    saveAiSettings();
    const cfg = getAiConfig();
    if (cfg.provider === 'offline' || !cfg.key) { toast('Offline coach is always ready — no connection needed.', 'info'); return; }
    btn.disabled = true; btn.textContent = 'Testing…';
    try {
      const result = await callLiveModel('Reply with exactly: OK', { test: true });
      toast(`Connection works. Model replied: ${result.slice(0, 40)}`, 'success', null, 6000);
    } catch (err) {
      toast(`Connection failed: ${err.message}. Check key, model, CORS or proxy.`, 'error', null, 8000);
    } finally {
      btn.disabled = false; btn.textContent = 'Test connection';
    }
  });
  $('#clearChatBtn')?.addEventListener('click', clearChat);

  // Timer subject
  $$('.js-subject-select').forEach((sel) => sel.addEventListener('change', () => {
    timer.subject = sel.value;
    state.profile.focusSubject = sel.value;
    saveState(); saveTimer(); syncTimerUI();
    $$('.js-subject-select').forEach((other) => { other.value = sel.value; });
  }));

  // Reminder bar
  $('#reminderDismissBtn')?.addEventListener('click', dismissReminder);
  $('#reminderViewBtn')?.addEventListener('click', goToReminderTask);

  // Focus break
  $('#focusBreakBtn')?.addEventListener('click', startBreak);

  // Settings theme live preview
  $('#setTheme')?.addEventListener('change', (event) => applyTheme(event.target.value));

  // Dialog backdrop dismissal
  $$('dialog.modal').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && dialog.id !== 'onboardDialog') closeDialog(dialog.id);
    });
  });
  $('#onboardDialog')?.addEventListener('close', () => {
    state.meta.onboarded = true;
    saveState();
    try { localStorage.setItem(LS_ONBOARDED, '1'); } catch (err) { /* ignore */ }
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    const tag = (event.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable;
    if (event.altKey && event.key.toLowerCase() === 'q') { event.preventDefault(); openMistakeNew(); return; }
    if (event.altKey && event.key.toLowerCase() === 't') { event.preventDefault(); toggleTimer(); return; }
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      if ($('#focusOverlay').classList.contains('open')) closeFocus(); else openFocus(false);
      return;
    }
    if (event.key === 'Escape' && $('#focusOverlay').classList.contains('open')) { closeFocus(); return; }
    if (!typing && event.key === '/') {
      if (currentView === 'vault') { event.preventDefault(); $('#vaultSearch').focus(); }
    }
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function init() {
  try {
    const storedTheme = localStorage.getItem(LS_THEME);
    applyTheme(storedTheme === 'light' ? 'light' : 'dark', false);
  } catch (err) { applyTheme('dark', false); }

  populateSubjectSelects();
  resetTaskForm();
  resetMockForm();
  if (!$('#onboardDate').value) $('#onboardDate').value = state.profile.examDate || '2027-02-07';
  $('#onboardTarget').value = state.profile.target || '78+ marks (AIR < 50)';

  wireEvents();
  updateNoiseUI();
  initAiConfigUI();

  const hash = (location.hash || '').replace('#', '');
  switchView(VIEW_META[hash] ? hash : 'dashboard', { scroll: false });
  renderShell();
  renderView(currentView);
  syncTimerUI();
  restoreTimerState();

  checkReminders();
  setInterval(checkReminders, 20000);
  setInterval(tickTimer, 500);

  let alreadyOnboarded = false;
  try { alreadyOnboarded = !!localStorage.getItem(LS_ONBOARDED); } catch (err) { /* ignore */ }
  const fresh = !state.meta.onboarded && !alreadyOnboarded;
  if (fresh) setTimeout(() => openOnboarding(), 350);
  else if (!state.meta.onboarded) {
    state.meta.onboarded = true;
    saveState();
  }

  // Persist timer state periodically so a refresh never loses the anchor.
  setInterval(() => { if (timer.running) saveTimer(); }, 15000);

  console.info(`GATE ECE Study OS v${APP_VERSION} ready · ${state.mistakes.length} mistakes · ${state.tasks.length} tasks`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
