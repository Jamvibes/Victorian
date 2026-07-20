const seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
// Change any one of these values to give that season more or fewer letters.
const correspondenceCounts = [3, 3, 3, 3];
// Upkeep for the family's starting estate. Additional properties can add their own costs later.
const baseSeasonalUpkeep = 125;
let openStaffRole = null;

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
  const familyOpen = tab === 'family';
  const chronicleOpen = tab === 'chronicle';
  $('#household-view').hidden = familyOpen || chronicleOpen;
  $('#family-view').hidden = !familyOpen;
  $('#chronicle-view').hidden = !chronicleOpen;
  $('#household-tab').classList.toggle('is-active', !familyOpen && !chronicleOpen);
  $('#family-tab').classList.toggle('is-active', familyOpen);
  $('#chronicle-tab').classList.toggle('is-active', chronicleOpen);
  if (familyOpen) renderFamily();
  if (chronicleOpen) renderHistory();
}

function relationshipLabel(value) {
  if (value >= 85) return 'Devoted';
  if (value >= 70) return 'Close';
  if (value >= 55) return 'Warm';
  if (value >= 35) return 'Strained';
  return 'Cold';
}

function partnerRelationship() {
  return state.relationships?.partner ?? 50;
}

function changePartnerRelationship(amount) {
  state.relationships ||= { partner: 50 };
  state.relationships.partner = Math.max(0, Math.min(100, state.relationships.partner + amount));
}

clamp = function () {
  state.reputation = Math.max(0, Math.min(100, state.reputation));
  if (state.relationships) state.relationships.partner = Math.max(0, Math.min(100, state.relationships.partner));
};

function renderFamily() {
  const origin = origins.find(item => item.id === state.origin);
  const match = matches.find(item => item.id === state.match);
  const relationship = partnerRelationship();
  $('#family-list').innerHTML = `<article class="family-member family-member--player"><div class="family-monogram">${state.given.charAt(0)}</div><div><p class="eyebrow">You · Head of household</p><h4>${state.given} ${state.family}</h4><p>${origin?.name || 'Family background unrecorded'}</p></div></article><article class="family-member"><div class="family-monogram">${state.partner.charAt(0)}</div><div class="family-member__body"><p class="eyebrow">Partner</p><h4>${state.partner} ${state.family}</h4><p>${match?.name || 'Marriage details unrecorded'}</p><p class="family-detail">${match?.desc || ''}</p><div class="relationship"><span>Your relationship</span><strong>${relationshipLabel(relationship)} · ${Math.round(relationship)}/100</strong><meter min="0" max="100" value="${relationship}">${relationship}</meter></div></div></article>`;
}

function personalizeCorrespondence(text) {
  return text
    .replaceAll('{partner}', state.partner)
    .replace(/^Your Partner(?:'s|’s)?/, `${state.partner}'s`)
    .replaceAll('Your partner', state.partner)
    .replaceAll('your partner', state.partner);
}

function eventWeight(event) {
  return Math.max(.1, state.staff.reduce((weight, servant) => weight * (servant.eventWeights?.[event.id] || 1), 1));
}

function weightedEventIndex(excluded = []) {
  const choices = events.map((event, index) => ({ index, weight: excluded.includes(index) ? 0 : eventWeight(event) }));
  let roll = Math.random() * choices.reduce((total, choice) => total + choice.weight, 0);
  for (const choice of choices) {
    roll -= choice.weight;
    if (roll <= 0 && choice.weight) return choice.index;
  }
  return choices.find(choice => choice.weight)?.index || 0;
}

function correspondenceQueue(count) {
  const queue = [];
  while (queue.length < count) {
    const used = queue.length < events.length ? queue : [];
    queue.push(weightedEventIndex(used));
  }
  return queue;
}

function seasonalCorrespondencePlan() {
  return [correspondenceQueue(correspondenceCounts[0]), null, null, null];
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
  if (!state.relationships) state.relationships = { partner: Number.isFinite(state.harmony) ? state.harmony : 50 };
  if (state.estateIncomeModelVersion !== 2) {
    const incomeOrigin = origins.find(item => item.id === state.origin) || origins[0];
    state.income = incomeOrigin.income;
    state.incomeSources = incomeOrigin.incomeSources.map(source => ({ ...source }));
    state.estateIncomeModelVersion = 2;
  }
  if (state.seasonStart && state.seasonStart.partnerRelationship === undefined) {
    state.seasonStart.partnerRelationship = Number.isFinite(state.seasonStart.harmony) ? state.seasonStart.harmony : state.relationships.partner;
  }
  state.staff ||= [];
  state.staff = state.staff.map(servant => {
    if (servant.name) return servant;
    return { ...servant, id: `incumbent-${servant.role.toLowerCase().replaceAll(' ', '-')}`, name: `Established ${servant.role}`, trait: 'Experienced', description: 'An experienced servant retained from the household’s earlier arrangements.', eventWeights: {} };
  });
  state.correspondencePlan ||= seasonalCorrespondencePlan();
  if (!state.staffSystemVersion) {
    state.correspondencePlan = state.correspondencePlan.map((queue, season) => season > state.season ? null : queue);
    state.staffSystemVersion = 1;
  }
  correspondenceCounts.forEach((count, season) => {
    if (season !== state.season && !state.correspondencePlan[season]) return;
    const queue = state.correspondencePlan[season] ||= correspondenceQueue(count);
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
    funds: o.funds + m.funds, income: o.income, incomeSources: o.incomeSources.map(source => ({ ...source })), estateIncomeModelVersion: 2,
    reputation: o.reputation + m.reputation, relationships: { partner: o.partnerRelationship + m.partnerRelationship },
    investment: 0, holdings: [], staff: [],
    history: [{ text: `${data.get('givenName')} and ${data.get('partnerName')} ${data.get('familyName')} took possession of the house.`, season: 0, year: 1880, order: 1 }],
    chronicleOrder: 1,
    correspondencePlan: null
  };
  state.correspondencePlan = seasonalCorrespondencePlan();
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
  $('#reputation').textContent = Math.round(state.reputation);
  const seasonalIncome = state.income / 4;
  const staffCost = state.staff.reduce((total, servant) => total + servant.wage, 0) * 3;
  const wageItems = state.staff.length ? state.staff.map(servant => `<li><span>${servant.name}</span><strong>-${money(servant.wage * 3)}</strong></li>`).join('') : '<li><span>No staff currently employed</span><strong>£0</strong></li>';
  const incomeItems = state.incomeSources.map(source => `<li><span>${source.name}</span><strong>${money(source.annual / 4)}</strong></li>`).join('');
  $('#accounts').innerHTML = `<details class="finance-entry"><summary><span>Household income</span><strong>${money(seasonalIncome)}</strong></summary><ul>${incomeItems}</ul></details><details class="finance-entry"><summary><span>Staff costs</span><strong>-${money(staffCost)}</strong></summary><ul>${wageItems}</ul></details><div class="finance-total"><span>Estate upkeep</span><strong>-${money(baseSeasonalUpkeep)}</strong></div>`;
  renderStaff();
  renderInvestments();
  renderEvent();
};

renderStaff = function () {
  $('#staff').innerHTML = Object.keys(staffCandidates).map(role => {
    const employed = state.staff.find(servant => servant.role === role);
    if (employed) return `<article class="staff-member"><div class="staff-member__heading"><div><strong>${employed.name}</strong><small>${role} · ${money(employed.wage)}/month</small></div><button data-staff-dismiss="${role}">Dismiss</button></div><span class="staff-trait">${employed.trait}</span><p>${employed.description}</p></article>`;
    const applicants = openStaffRole === role ? `<div class="staff-applicants">${staffCandidates[role].map(candidate => `<article class="staff-candidate"><div><strong>${candidate.name}</strong><small>${money(candidate.wage)}/month</small></div><span class="staff-trait">${candidate.trait}</span><p>${candidate.description}</p><button data-candidate-role="${role}" data-candidate-id="${candidate.id}" ${state.funds < candidate.wage * 3 ? 'disabled' : ''}>Employ</button></article>`).join('')}</div>` : '';
    return `<section class="staff-vacancy"><div class="staff-member__heading"><div><strong>${role}</strong><small>Position vacant</small></div><button data-review-role="${role}">${openStaffRole === role ? 'Close' : 'Review applicants'}</button></div>${applicants}</section>`;
  }).join('');
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
      partnerRelationship: partnerRelationship()
    };
  }
  Object.entries(choice.effects).forEach(([key, value]) => {
    if (key === 'partnerRelationship' || key === 'harmony') changePartnerRelationship(value);
    else state[key] = (state[key] || 0) + value;
  });
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
  const staffCosts = state.staff.reduce((total, servant) => total + servant.wage, 0) * 3;
  const upkeep = baseSeasonalUpkeep;
  const investmentNotes = [];
  state.funds += seasonalIncome - staffCosts - upkeep;

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
  if (state.season < 4 && !state.correspondencePlan[state.season]) {
    state.correspondencePlan[state.season] = correspondenceQueue(correspondenceCounts[state.season]);
  }
  clamp();
  finishAfterSummary = state.season >= 4 || state.funds < -500 || state.reputation <= 0;
  if (!finishAfterSummary) saveState();
  showSeasonSummary(completedSeason, results, before, { seasonalIncome, staffCosts, upkeep, investmentNotes });
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
  $('#month-summary-content').innerHTML = `<p class="eyebrow">The household account</p><h2 id="month-summary-title">${seasonNames[season]} concluded</h2><h3>The story of the season</h3><div class="season-story">${results.map(result => `<p>${result}</p>`).join('')}</div><div class="month-account"><div><span>Household income</span><strong>${money(account.seasonalIncome)}</strong></div><div><span>Staff costs</span><strong>-${money(account.staffCosts)}</strong></div><div><span>Estate upkeep</span><strong>-${money(account.upkeep)}</strong></div><div class="total"><span>Overall change in ready funds</span><strong>${net >= 0 ? '+' : ''}${money(net)}</strong></div></div><h3>Investments</h3>${investmentText}<div class="summary-changes"><div><span>Reputation</span><strong>${signed(state.reputation - before.reputation)}</strong></div><div><span>Relationship with ${state.partner}</span><strong>${signed(partnerRelationship() - before.partnerRelationship)}</strong></div></div>`;
  $('#continue-month').textContent = finishAfterSummary ? 'Read the family legacy' : 'Continue to the next season';
  $('#month-summary').showModal();
}

finish = function () {
  const virtues = [['fortune', state.funds], ['standing', state.reputation * 80], [`a ${relationshipLabel(partnerRelationship()).toLowerCase()} marriage`, partnerRelationship() * 75]].sort((a, b) => b[1] - a[1]);
  $('#ending-content').innerHTML = `<p class="eyebrow">The close of 1880</p><h2>The ${state.family} Legacy</h2><p>No single account can settle whether a life was well lived. The year leaves the ${state.family} family best known for <strong>${virtues[0][0]}</strong>, while ${virtues.at(-1)[0]} remains less certain.</p><p>Funds: ${money(state.funds)} - Reputation: ${state.reputation} - Relationship with ${state.partner}: ${Math.round(partnerRelationship())}</p>`;
  $('#ending').showModal();
  localStorage.removeItem('victorian-household');
};

renderHistory = function () {
  normalizeChronicle();
  const entries = [...state.history].sort((a, b) => (a.order || 0) - (b.order || 0));
  $('#chronicle').innerHTML = entries.map(entry => `<article class="chronicle-entry"><time>${seasonNames[entry.season] || seasonNames[0]} ${entry.year || 1880}</time><p>${entry.text}</p></article>`).join('');
};

$('#household-tab').onclick = () => showGameTab('household');
$('#family-tab').onclick = () => showGameTab('family');
$('#chronicle-tab').onclick = () => showGameTab('chronicle');

document.addEventListener('click', event => {
  const reviewRole = event.target.dataset.reviewRole;
  if (reviewRole) {
    openStaffRole = openStaffRole === reviewRole ? null : reviewRole;
    renderStaff();
    return;
  }
  const candidateRole = event.target.dataset.candidateRole;
  if (candidateRole) {
    const candidate = staffCandidates[candidateRole].find(person => person.id === event.target.dataset.candidateId);
    if (candidate && !state.staff.some(servant => servant.role === candidateRole)) {
      state.staff.push({ ...candidate, eventWeights: { ...candidate.eventWeights } });
      openStaffRole = null;
      recordChronicle(`${candidate.name} entered the household as ${candidateRole.toLowerCase()}.`);
      saveState();
      renderGame();
    }
    return;
  }
  const dismissRole = event.target.dataset.staffDismiss;
  if (dismissRole) {
    const index = state.staff.findIndex(servant => servant.role === dismissRole);
    if (index >= 0) {
      const [servant] = state.staff.splice(index, 1);
      recordChronicle(`${servant.name} left the household’s service.`);
      saveState();
      renderGame();
    }
  }
});
