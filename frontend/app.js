const API_BASE = 'http://127.0.0.1:5000/api';
const HISTORY_KEY = 'dementia-support-sg-history';
const GAME_HISTORY_KEY = 'dementia-support-sg-game-history';

const views = [...document.querySelectorAll('.view')];
const navButtons = [...document.querySelectorAll('[data-view-target]')];
const resultCard = document.getElementById('resultCard');
const insightsGrid = document.getElementById('insightsGrid');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const gameHistoryList = document.getElementById('gameHistoryList');
const gameHistoryEmpty = document.getElementById('gameHistoryEmpty');
const statSaved = document.getElementById('statSaved');
const statGames = document.getElementById('statGames');

const quizState = {
  config: null,
  questions: [],
  answers: {},
  currentIndex: 0,
};

const questionCard = document.getElementById('questionCard');
const questionCurrent = document.getElementById('questionCurrent');
const questionTotal = document.getElementById('questionTotal');
const questionGroup = document.getElementById('questionGroup');
const progressBar = document.getElementById('quizProgressBar');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const quizWizardForm = document.getElementById('quizWizardForm');

const orderedQuestions = [
  { feature: 'Age', group: 'Basic information' },
  { feature: 'Gender', group: 'Basic information' },
  { feature: 'Ethnicity', group: 'Basic information' },
  { feature: 'EducationLevel', group: 'Basic information' },
  { feature: 'BMI', group: 'Basic health' },
  { feature: 'Smoking', group: 'Lifestyle' },
  { feature: 'PhysicalActivity', group: 'Lifestyle' },
  { feature: 'DietQuality', group: 'Lifestyle' },
  { feature: 'SleepQuality', group: 'Lifestyle' },
  { feature: 'AlcoholConsumption', group: 'Lifestyle' },
  { feature: 'Hypertension', group: 'Medical history' },
  { feature: 'Diabetes', group: 'Medical history' },
  { feature: 'CardiovascularDisease', group: 'Medical history' },
  { feature: 'FamilyHistoryAlzheimers', group: 'Family history' },
  { feature: 'MemoryComplaints', group: 'Memory and behaviour' },
  { feature: 'Forgetfulness', group: 'Memory and behaviour' },
  { feature: 'Confusion', group: 'Memory and behaviour' },
  { feature: 'Disorientation', group: 'Memory and behaviour' },
  { feature: 'DifficultyCompletingTasks', group: 'Memory and behaviour' },
  { feature: 'CanRecallDate', group: 'Cognitive tasks' },
  { feature: 'CanRecallWords', group: 'Cognitive tasks' },
  { feature: 'DifficultyFollowing', group: 'Communication' },
  { feature: 'GetsLost', group: 'Safety and orientation' },
  { feature: 'TroubleWriting', group: 'Communication' },
  { feature: 'ManagesFinances', group: 'Independent living' },
  { feature: 'CanTravel', group: 'Independent living' },
  { feature: 'CanCookMeals', group: 'Independent living' },
  { feature: 'ManagesMeds', group: 'Independent living' },
  { feature: 'ManagesHousehold', group: 'Independent living' },
  { feature: 'CanBathe', group: 'Daily activities' },
  { feature: 'CanDress', group: 'Daily activities' },
  { feature: 'CanEat', group: 'Daily activities' },
  { feature: 'CanToilet', group: 'Daily activities' },
  { feature: 'CanWalk', group: 'Daily activities' },
  { feature: 'SystolicBP', group: 'Health readings' },
  { feature: 'DiastolicBP', group: 'Health readings' },
  { feature: 'CholesterolTotal', group: 'Health readings' },
  { feature: 'CholesterolLDL', group: 'Health readings' },
  { feature: 'CholesterolHDL', group: 'Health readings' },
  { feature: 'CholesterolTriglycerides', group: 'Health readings' },
];

const hints = {
  Age: 'Please enter age in years.',
  BMI: 'Body Mass Index if known. If unsure, ask a caregiver or skip with an estimate.',
  PhysicalActivity: 'Approximate exercise hours each week.',
  DietQuality: '0 means very poor, 10 means excellent.',
  SleepQuality: '4 means poor sleep, 10 means excellent sleep.',
  AlcoholConsumption: 'Approximate weekly alcohol units.',
  SystolicBP: 'Upper blood pressure number if known.',
  DiastolicBP: 'Lower blood pressure number if known.',
  CholesterolTotal: 'Use recent health screening values if available.',
  CholesterolLDL: 'Use recent health screening values if available.',
  CholesterolHDL: 'Use recent health screening values if available.',
  CholesterolTriglycerides: 'Use recent health screening values if available.',
};

let wordGameActive = false;
let wordGameWords = [];
let sequenceGame = {
  active: false,
  sequence: [],
  userInput: [],
  acceptingInput: false,
  round: 0,
};

function showView(viewId) {
  views.forEach(view => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.viewTarget === viewId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navButtons.forEach(button => {
  button.addEventListener('click', () => showView(button.dataset.viewTarget));
});

function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function loadGameHistory() {
  return JSON.parse(localStorage.getItem(GAME_HISTORY_KEY) || '[]');
}

function saveHistoryItem(payload) {
  const history = loadHistory();
  history.unshift(payload);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  renderHistory();
}

function saveGameHistoryItem(payload) {
  const history = loadGameHistory();
  history.unshift(payload);
  localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
  renderGameHistory();
}

function riskClass(tier) {
  return tier.toLowerCase().replace(/\s+/g, '-');
}

function renderHistory() {
  const history = loadHistory();
  statSaved.textContent = history.length;
  historyList.innerHTML = '';
  historyEmpty.style.display = history.length ? 'none' : 'block';

  history.forEach(item => {
    const div = document.createElement('article');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="section-header">
        <div>
          <strong>${new Date(item.timestamp).toLocaleString()}</strong>
          <p>Blended score ${item.result.blended_score}% · ${item.result.risk_tier} risk</p>
        </div>
        <div class="badge ${riskClass(item.result.risk_tier)}">${item.result.risk_tier}</div>
      </div>
      <p><strong>Recommendation:</strong> ${item.result.recommendation}</p>
      <p><strong>Approx. MMSE:</strong> ${item.result.derived_scores.MMSE} · <strong>ADL:</strong> ${item.result.derived_scores.ADL}</p>
    `;
    historyList.appendChild(div);
  });
}

function renderGameHistory() {
  const history = loadGameHistory();
  statGames.textContent = history.length;
  gameHistoryList.innerHTML = '';
  gameHistoryEmpty.style.display = history.length ? 'none' : 'block';

  history.forEach(item => {
    const div = document.createElement('article');
    div.className = 'history-item';
    div.innerHTML = `
      <strong>${new Date(item.timestamp).toLocaleString()}</strong>
      <p><strong>${item.game}</strong> · Score: ${item.score}</p>
      <p>${item.note}</p>
    `;
    gameHistoryList.appendChild(div);
  });
}

function renderInsights(items) {
  insightsGrid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <span class="eyebrow">${item.unit}</span>
      <h3>${item.feature}</h3>
      <p>Diagnosed group: <strong>${item.diagnosed}</strong></p>
      <p>Healthy group: <strong>${item.healthy}</strong></p>
    `;
    insightsGrid.appendChild(card);
  });
}

function getQuestionMeta(feature) {
  const questionMap = new Map((quizState.config?.quiz_weights || []).map(q => [q.feature, q]));
  const fromModel = questionMap.get(feature);
  if (fromModel) return fromModel;

  const defaults = quizState.config?.default_form_values || {};
  const fallback = { feature, label: feature, type: 'numeric', options: [] };
  if (['Gender', 'Ethnicity', 'EducationLevel'].includes(feature)) {
    fallback.type = 'categorical';
  } else if ([0, 1].includes(Number(defaults[feature]))) {
    fallback.type = 'binary';
  }
  if (feature === 'Gender') fallback.options = [{ label: 'Male', value: 0 }, { label: 'Female', value: 1 }];
  if (feature === 'Ethnicity') fallback.options = [{ label: 'Chinese', value: 0 }, { label: 'Malay', value: 1 }, { label: 'Indian', value: 2 }, { label: 'Other', value: 3 }];
  if (feature === 'EducationLevel') fallback.options = [
    { label: 'No formal education', value: 0 },
    { label: 'Primary / Secondary', value: 1 },
    { label: 'Diploma / Bachelor\'s', value: 2 },
    { label: 'University & above', value: 3 },
  ];
  if (fallback.type === 'binary') fallback.options = [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }];
  return fallback;
}

function ensureQuizQuestions() {
  quizState.questions = orderedQuestions.map(item => ({ ...item, ...getQuestionMeta(item.feature) }));
  questionTotal.textContent = quizState.questions.length;
}

function currentAnswerFor(question) {
  if (question.feature in quizState.answers) return quizState.answers[question.feature];
  return quizState.config?.default_form_values?.[question.feature] ?? 0;
}

function setAnswer(feature, value) {
  quizState.answers[feature] = Number(value);
}

function renderQuestion() {
  const question = quizState.questions[quizState.currentIndex];
  const current = quizState.currentIndex + 1;
  const total = quizState.questions.length;
  const value = currentAnswerFor(question);

  questionCurrent.textContent = current;
  questionTotal.textContent = total;
  questionGroup.textContent = question.group;
  progressBar.style.width = `${(current / total) * 100}%`;

  const hint = hints[question.feature] ? `<p class="question-note">${hints[question.feature]}</p>` : '';
  let answersHTML = '';

  if (question.type === 'binary' || question.type === 'categorical') {
    answersHTML = `<div class="answer-group">${(question.options || []).map(option => `
      <button class="answer-option ${Number(value) === Number(option.value) ? 'selected' : ''}" type="button" data-answer-value="${option.value}">${option.label}</button>
    `).join('')}</div>`;
  } else {
    answersHTML = `
      <div class="answer-group">
        <input id="numberAnswerInput" class="number-input" type="number" step="any" value="${value}" />
      </div>
    `;
  }

  questionCard.innerHTML = `
    <p class="question-title">${question.label}</p>
    ${hint}
    ${answersHTML}
  `;

  if (question.type === 'binary' || question.type === 'categorical') {
    questionCard.querySelectorAll('[data-answer-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        setAnswer(question.feature, btn.dataset.answerValue);
        renderQuestion();
      });
    });
  } else {
    const input = document.getElementById('numberAnswerInput');
    input.addEventListener('input', () => setAnswer(question.feature, input.value || 0));
    input.focus();
    input.select();
  }

  prevQuestionBtn.disabled = quizState.currentIndex === 0;
  const isLast = quizState.currentIndex === total - 1;
  nextQuestionBtn.classList.toggle('hidden', isLast);
  submitQuizBtn.classList.toggle('hidden', !isLast);
}

function nextQuestion() {
  const question = quizState.questions[quizState.currentIndex];
  if (question.type === 'numeric') {
    const input = document.getElementById('numberAnswerInput');
    setAnswer(question.feature, input?.value || 0);
  }
  if (quizState.currentIndex < quizState.questions.length - 1) {
    quizState.currentIndex += 1;
    renderQuestion();
  }
}

function prevQuestion() {
  if (quizState.currentIndex > 0) {
    quizState.currentIndex -= 1;
    renderQuestion();
  }
}

prevQuestionBtn.addEventListener('click', prevQuestion);
nextQuestionBtn.addEventListener('click', nextQuestion);

quizWizardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = quizState.questions[quizState.currentIndex];
  if (question?.type === 'numeric') {
    const input = document.getElementById('numberAnswerInput');
    setAnswer(question.feature, input?.value || 0);
  }

  submitQuizBtn.disabled = true;
  submitQuizBtn.textContent = 'Running...';
  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: quizState.answers }),
    });
    const result = await response.json();
    renderResult(result);
    saveHistoryItem({ timestamp: new Date().toISOString(), answers: { ...quizState.answers }, result });
    showView('diagnosisView');
  } catch (error) {
    resultCard.innerHTML = '<p>Could not connect to the backend API. Please make sure Flask is running on port 5000.</p>';
    showView('diagnosisView');
  } finally {
    submitQuizBtn.disabled = false;
    submitQuizBtn.textContent = 'Run AI screening';
  }
});

function renderResult(result) {
  resultCard.innerHTML = `
    <div class="badge ${riskClass(result.risk_tier)}">${result.risk_tier} risk</div>
    <div class="result-grid">
      <div class="metric"><div>Blended score</div><div class="value">${result.blended_score}%</div></div>
      <div class="metric"><div>ML probability</div><div class="value">${result.ml_probability}%</div></div>
      <div class="metric"><div>Approx. MMSE</div><div class="value">${result.derived_scores.MMSE}</div></div>
      <div class="metric"><div>ADL</div><div class="value">${result.derived_scores.ADL}</div></div>
    </div>
    <p><strong>Recommendation:</strong> ${result.recommendation}</p>
    <p><strong>Reminder:</strong> This tool supports screening and caregiver observation. It does not diagnose dementia.</p>
  `;
}

function loadExampleAnswers() {
  quizState.answers = {
    Age: 77, Gender: 1, Ethnicity: 0, EducationLevel: 1, BMI: 27,
    Smoking: 0, PhysicalActivity: 1, DietQuality: 4, SleepQuality: 5, AlcoholConsumption: 3,
    Hypertension: 1, Diabetes: 0, CardiovascularDisease: 1, FamilyHistoryAlzheimers: 1,
    MemoryComplaints: 1, Forgetfulness: 1, Confusion: 1, Disorientation: 1,
    DifficultyCompletingTasks: 1, CanRecallDate: 0, CanRecallWords: 0,
    DifficultyFollowing: 1, GetsLost: 1, TroubleWriting: 0,
    ManagesFinances: 0, CanTravel: 0, CanCookMeals: 1, ManagesMeds: 0, ManagesHousehold: 0,
    CanBathe: 1, CanDress: 1, CanEat: 1, CanToilet: 1, CanWalk: 1,
    SystolicBP: 145, DiastolicBP: 88, CholesterolTotal: 225, CholesterolLDL: 145,
    CholesterolHDL: 45, CholesterolTriglycerides: 180,
  };
  quizState.currentIndex = 0;
  renderQuestion();
}

document.getElementById('fillDemoBtn').addEventListener('click', loadExampleAnswers);

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

const wordRecallBox = document.getElementById('wordRecallBox');
const startWordGameBtn = document.getElementById('startWordGameBtn');
const wordSets = [
  ['apple', 'bus', 'river'],
  ['clock', 'leaf', 'orange'],
  ['market', 'chair', 'garden'],
  ['pencil', 'rain', 'bread'],
];

function chooseWordSet() {
  return wordSets[Math.floor(Math.random() * wordSets.length)];
}

async function startWordGame() {
  if (wordGameActive) return;
  wordGameActive = true;
  wordGameWords = chooseWordSet();
  wordRecallBox.innerHTML = `<div><strong>Remember these words:</strong><br>${wordGameWords.join(' · ')}</div>`;
  startWordGameBtn.disabled = true;
  await new Promise(r => setTimeout(r, 4500));
  wordRecallBox.innerHTML = `
    <div style="width:min(360px,100%);display:grid;gap:10px;">
      <label for="wordRecallInput">Type the words you remember, separated by commas.</label>
      <input id="wordRecallInput" class="number-input" type="text" placeholder="Example: apple, bus" />
      <button id="submitWordRecallBtn" class="button primary" type="button">Submit words</button>
    </div>
  `;
  document.getElementById('submitWordRecallBtn').addEventListener('click', finishWordGame);
}

function finishWordGame() {
  const input = (document.getElementById('wordRecallInput')?.value || '').toLowerCase();
  const guesses = input.split(',').map(s => s.trim()).filter(Boolean);
  const correct = wordGameWords.filter(word => guesses.includes(word)).length;
  wordRecallBox.innerHTML = `<div>You remembered <strong>${correct}</strong> out of 3 words.<br>Words were: ${wordGameWords.join(', ')}</div>`;
  saveGameHistoryItem({
    timestamp: new Date().toISOString(),
    game: 'Word Recall',
    score: `${correct}/3`,
    note: `Remembered ${correct} of 3 words.`,
  });
  startWordGameBtn.disabled = false;
  wordGameActive = false;
}

startWordGameBtn.addEventListener('click', startWordGame);

const sequenceStatus = document.getElementById('sequenceStatus');
const sequenceTiles = [...document.querySelectorAll('[data-seq-value]')];
const startSequenceBtn = document.getElementById('startSequenceBtn');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function flashTile(value) {
  const tile = sequenceTiles.find(btn => btn.dataset.seqValue === String(value));
  if (!tile) return;
  tile.classList.add('flash');
  await sleep(450);
  tile.classList.remove('flash');
  await sleep(180);
}

async function playSequence() {
  sequenceGame.acceptingInput = false;
  sequenceStatus.textContent = `Watch the sequence: ${sequenceGame.sequence.join(' ')}`;
  for (const value of sequenceGame.sequence) {
    await flashTile(value);
  }
  sequenceGame.userInput = [];
  sequenceGame.acceptingInput = true;
  sequenceStatus.textContent = 'Now tap the numbers in the same order.';
}

async function startSequenceGame() {
  sequenceGame = { active: true, sequence: [], userInput: [], acceptingInput: false, round: 0 };
  startSequenceBtn.disabled = true;
  await nextSequenceRound();
}

async function nextSequenceRound() {
  sequenceGame.round += 1;
  sequenceGame.sequence.push(1 + Math.floor(Math.random() * 4));
  sequenceStatus.textContent = `Round ${sequenceGame.round}`;
  await sleep(600);
  await playSequence();
}

async function endSequenceGame(success) {
  const score = Math.max(sequenceGame.round - (success ? 0 : 1), 0);
  sequenceStatus.textContent = success
    ? `Well done. Final score: ${score}`
    : `Game over. Final score: ${score}`;
  saveGameHistoryItem({
    timestamp: new Date().toISOString(),
    game: 'Sequence Tap',
    score: String(score),
    note: `Reached round ${score}.`,
  });
  sequenceGame.active = false;
  sequenceGame.acceptingInput = false;
  startSequenceBtn.disabled = false;
}

sequenceTiles.forEach(tile => {
  tile.addEventListener('click', async () => {
    if (!sequenceGame.active || !sequenceGame.acceptingInput) return;
    const value = Number(tile.dataset.seqValue);
    sequenceGame.userInput.push(value);
    tile.classList.add('flash');
    setTimeout(() => tile.classList.remove('flash'), 200);

    const currentIndex = sequenceGame.userInput.length - 1;
    if (sequenceGame.sequence[currentIndex] !== value) {
      await endSequenceGame(false);
      return;
    }

    if (sequenceGame.userInput.length === sequenceGame.sequence.length) {
      sequenceGame.acceptingInput = false;
      sequenceStatus.textContent = 'Correct. Next round coming...';
      await sleep(700);
      if (sequenceGame.round >= 5) {
        await endSequenceGame(true);
      } else {
        await nextSequenceRound();
      }
    }
  });
});

startSequenceBtn.addEventListener('click', startSequenceGame);

async function loadConfig() {
  const response = await fetch(`${API_BASE}/config`);
  const config = await response.json();
  quizState.config = config;
  document.getElementById('statRows').textContent = config.model.dataset_rows;
  document.getElementById('statAuc').textContent = config.model.test_auc.toFixed(3);
  ensureQuizQuestions();
  renderQuestion();
  renderInsights(config.insights);
  renderHistory();
  renderGameHistory();
}

loadConfig().catch(error => {
  console.error(error);
  resultCard.innerHTML = '<p>Could not connect to the backend API. Please make sure Flask is running on port 5000.</p>';
  renderHistory();
  renderGameHistory();
});
