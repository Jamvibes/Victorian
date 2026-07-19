const seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
// Change any one of these values to give that season more or fewer letters.
const correspondenceCounts = [3, 3, 3, 3];

function recordChronicle(text) {
  state.chronicleOrder = (state.chronicleOrder || 0) + 1;
  state.history.push({
    text,
    season: Math.min(state.season || 0, 3),
    year: 1880,
    order: state.chronicleOrder
  });
}

function normalizeChronicle() {
  const total = state.history.length;
  state.history = state.history.map((entry, index) => {
    if (typeof entry !== 'string') return entry;
    return {
      text: entry,
      season: Math.min(state.season || 0, 3),
      year: 1880,
      order: total - index
    };
  });
  state.chronicleOrder = Math.max(state.chronicleOrder || 0, ...state.history.map(entry => entry.order || 0));
}

function showGameTab(tab) {
  const chronicleOpen = tab === 'chronicle';
  $('#household-view').hidden = chronicleOpen;
  $('#chronicle-view').hidden = !chronicleOpen;
  $('#household-tab').classList.toggle('is-active', !chronicleOpen);
  $('#chronicle-tab').classList.toggle('is-active', chronicleOpen);
  if (chronicleOpen) renderHistory();
}

function personalizeCorrespondence(text) {
  return text
    .replaceAll('{partner}', state.partner)
    .replace(/^Your Partner(?:'s|’s)?/, `${state.partner}'s`)
    .replaceAll('Your partner', state.partner)
    .replaceAll('your partner', state.partner);
}

function correspondenceQueue(count) {
  const queue = [];
  while (queue.length < count) {
    const batch = shuffle([...Array(events.length).keys()]);
    if (queue.length && batch.length > 1 && queue.at(-1) === batch[0]) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    queue.push(...batch.slice(0, count - queue.length));
  }
  return queue;
}

function seasonalCorrespondencePlan() {
  return correspondenceCounts.map(count => correspondenceQueue(count));
}

function migrateSeasonalState() {
  if (state.season === undefined) {
    state.season = Math.min(3, Math.floor((state.month || 0) / 3));
    state.correspondence = 0;
    state.seasonResults = [];
    state.seasonStart = null;
  }
  state.correspondence ||= 0;
  state.seasonResults ||= [];
  state.holdings ||= [];
  state.correspondencePlan ||= seasonalCorrespondencePlan();
  correspondenceCounts.forEach((count, season) => {
    const queue = state.correspondencePlan[season] ||= [];
    if (queue.length < count) queue.push(...correspondenceQueue(count - queue.length));
  });
  state.month = state.season * 3;
}

newHousehold = function (data) {
  const { o, m } = selections();
  state = {
    given: data.get('givenName'), family: data.get('familyName'), partner: data.get('partnerName'),
    origin: o.id, match: m.id, season: 0, correspondence: 0,
    seasonResults: [], seasonStart: null, month: 0,
    funds: o.funds + m.funds, income: o.income,
    reputation: o.reputation + m.reputation, harmony: o.harmony + m.harmony,
    loyalty: 55, investment: 0, holdings: [], staff: [...staffRoles],
    history: [{ text: `${data.get('givenName')} and ${data.get('partnerName')} ${data.get('familyName')} took possession of the house.`, season: 0, year: 1880, order: 1 }],
    chronicleOrder: 1,
    correspondencePlan: seasonalCorrespondencePlan()
  };
  saveState();
  show('game');
  showGameTab('household');
  renderGame();
};

renderGame = function () {
  migrateSeasonalState();
  $('#date').textContent = `${seasonNames[state.season]} 1880`;
  $('#house-name').textContent = `${state.family} House`;
  ['funds', 'income'].forEach(key => $('#' + key).textContent = money(state[key]));
  ['reputation', 'harmony', 'loyalty'].forEach(key => $('#' + key).textContent = Math.round(state[key]));
  const seasonalIncome = state.income / 4;
  const staffCost = state.staff.reduce((total, servant) => total + servant.wage, 0) * 3;
  $('#accounts').innerHTML = `<div class="account"><span>Seasonal income</span><strong>${money(seasonalIncome)}</strong></div><div class="account"><span>Staff wages</span><strong>-${money(staffCost)}</strong></div><div class="account"><span>Household upkeep</span><strong>-${money(195)}</strong></div>`;
  renderStaff();
  renderInvestments();
  renderEvent();
};

renderEvent = function () {
  const seasonQueue = state.correspondencePlan[state.season];
  const event = events[seasonQueue[state.correspondence] % events.length];
  $('#correspondence-progress').textContent = `- ${state.correspondence + 1} of ${seasonQueue.length}`;
  $('#event-title').textContent = personalizeCorrespondence(event.title);
  $('#event-body').textContent = personalizeCorrespondence(event.body);
  $('#event-choices').innerHTML = event.choices.map((choice, index) => `<button class="event-choice" data-choice="${index}"><strong>${personalizeCorrespondence(choice.label)}</strong><small>${personalizeCorrespondence(choice.note)}</small></button>`).join('');
  document.querySelectorAll('[data-choice]').forEach(button => button.onclick = () => resolveEvent(event, +button.dataset.choice));
};

resolveEvent = function (event, index) {
  const choice = event.choices[index];
  const personalizedResult = personalizeCorrespondence(choice.result);
  if (!state.seasonStart) {
    state.seasonStart = {
      funds: state.funds, reputation: state.reputation,
      harmony: state.harmony, loyalty: state.loyalty
    };
  }
  Object.entries(choice.effects).forEach(([key, value]) => state[key] = (state[key] || 0) + value);
  recordChronicle(personalizedResult);
  state.seasonResults.push(personalizedResult);
  clamp();

  if (state.correspondence < state.correspondencePlan[state.season].length - 1) {
    state.correspondence++;
    saveState();
    renderGame();
    renderHistory();
    return;
  }

  const completedSeason = state.season;
  const before = state.seasonStart;
  const seasonalIncome = state.income / 4;
  const staffWages = state.staff.reduce((total, servant) => total + servant.wage, 0) * 3;
  const upkeep = 195;
  const investmentNotes = [];
  state.funds += seasonalIncome - staffWages - upkeep;

  if (state.investment && Math.random() < .45) {
    const change = Math.round(state.investment * (Math.random() < .55 ? .35 : -.45));
    const returned = state.investment + change;
    const note = `The railway shares were sold for ${money(returned)}.`;
    state.funds += returned;
    recordChronicle(note);
    investmentNotes.push(note);
    state.investment = 0;
  }
  investmentNotes.push(...settleHoldings());

  const results = [...state.seasonResults];
  state.season++;
  state.month = state.season * 3;
  state.correspondence = 0;
  state.seasonResults = [];
  state.seasonStart = null;
  clamp();
  finishAfterSummary = state.season >= 4 || state.funds < -500 || state.reputation <= 0;
  if (!finishAfterSummary) saveState();
  showSeasonSummary(completedSeason, results, before, { seasonalIncome, staffWages, upkeep, investmentNotes });
};

// Investment opportunities are offered through correspondence, never a standing sidebar menu.
renderInvestments = function () {};

settleHoldings = function () {
  const notes = [];
  state.holdings ||= [];
  state.holdings = state.holdings.filter(holding => {
    const placedSeason = holding.season ?? Math.floor((holding.month || 0) / 3);
    if (state.season - placedSeason < 1 || Math.random() > .45) return true;
    const type = investmentTypes.find(item => item.id === holding.id);
    const failed = Math.random() < type.risk;
    const change = Math.round(holding.stake * (failed ? -type.downside : type.upside));
    const returned = holding.stake + change;
    const note = `${type.name} ${failed ? 'disappointed' : 'rewarded'} the family, returning ${money(returned)}.`;
    state.funds += returned;
    state.reputation += failed ? type.reputation - 1 : type.reputation;
    recordChronicle(note);
    notes.push(note);
    return false;
  });
  return notes;
};

function showSeasonSummary(season, results, before, account) {
  const net = state.funds - before.funds;
  const investmentText = account.investmentNotes.length
    ? `<ul>${account.investmentNotes.map(note => `<li>${note}</li>`).join('')}</ul>`
    : '<p>No investment matured this season. Existing holdings remain exposed to future gain or loss.</p>';
  $('#month-summary-content').innerHTML = `<p class="eyebrow">The household account</p><h2 id="month-summary-title">${seasonNames[season]} concluded</h2><h3>The story of the season</h3><div class="season-story">${results.map(result => `<p>${result}</p>`).join('')}</div><div class="month-account"><div><span>Household income</span><strong>${money(account.seasonalIncome)}</strong></div><div><span>Staff wages</span><strong>-${money(account.staffWages)}</strong></div><div><span>Household upkeep</span><strong>-${money(account.upkeep)}</strong></div><div class="total"><span>Overall change in ready funds</span><strong>${net >= 0 ? '+' : ''}${money(net)}</strong></div></div><h3>Investments</h3>${investmentText}<div class="summary-changes"><div><span>Reputation</span><strong>${signed(state.reputation - before.reputation)}</strong></div><div><span>Family accord</span><strong>${signed(state.harmony - before.harmony)}</strong></div><div><span>Staff confidence</span><strong>${signed(state.loyalty - before.loyalty)}</strong></div></div>`;
  $('#continue-month').textContent = finishAfterSummary ? 'Read the family legacy' : 'Continue to the next season';
  $('#month-summary').showModal();
}

finish = function () {
  const virtues = [['fortune', state.funds], ['standing', state.reputation * 80], ['domestic happiness', state.harmony * 75], ['a loyal household', state.loyalty * 65]].sort((a, b) => b[1] - a[1]);
  $('#ending-content').innerHTML = `<p class="eyebrow">The close of 1880</p><h2>The ${state.family} Legacy</h2><p>No single account can settle whether a life was well lived. The year leaves the ${state.family} family best known for <strong>${virtues[0][0]}</strong>, while ${virtues.at(-1)[0]} remains less certain.</p><p>Funds: ${money(state.funds)} - Reputation: ${state.reputation} - Family accord: ${state.harmony}</p>`;
  $('#ending').showModal();
  localStorage.removeItem('victorian-household');
};

renderHistory = function () {
  normalizeChronicle();
  const entries = [...state.history].sort((a, b) => (a.order || 0) - (b.order || 0));
  $('#chronicle').innerHTML = entries.map(entry => `<article class="chronicle-entry"><time>${seasonNames[entry.season] || seasonNames[0]} ${entry.year || 1880}</time><p>${entry.text}</p></article>`).join('');
};

$('#household-tab').onclick = () => showGameTab('household');
$('#chronicle-tab').onclick = () => showGameTab('chronicle');
