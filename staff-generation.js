// Staff generation data is kept in this file so names, traits, wages and roles
// can be expanded without changing the household management code.

const staffGivenNames = {
  female: ['Ada', 'Agnes', 'Alice', 'Anne', 'Beatrice', 'Clara', 'Constance', 'Edith', 'Eleanor', 'Eliza', 'Florence', 'Harriet', 'Jane', 'Louisa', 'Martha', 'Matilda', 'Rose'],
  male: ['Albert', 'Alfred', 'Arthur', 'Charles', 'Edmund', 'Edward', 'Ernest', 'Frederick', 'George', 'Henry', 'James', 'Samuel', 'Thomas', 'Walter', 'William']
};

const staffSurnames = ['Bates', 'Bell', 'Cole', 'Doyle', 'Ellis', 'Finch', 'Gray', 'Mercer', 'Moss', 'Parker', 'Price', 'Pritchard', 'Reed', 'Ward', 'Webb', 'Whitby'];

// Add, remove or edit traits here. Each generated applicant receives one trait.
// eventWeights are optional: values below 1 make an event less likely and values
// above 1 make it more likely while that servant is employed.
const staffTraits = [
  {
    id: 'discreet',
    name: 'Discreet',
    description: 'Handles private household matters without encouraging wider discussion.',
    eventWeights: { partner_debt: 0.6 }
  },
  {
    id: 'economical',
    name: 'Economical',
    description: 'Keeps a close eye on waste, though strict economies can cause friction below stairs.',
    eventWeights: { staff_dispute: 1.35 }
  },
  {
    id: 'meticulous',
    name: 'Meticulous',
    description: 'Approaches every duty with exacting care and attention to cleanliness.',
    eventWeights: { village_fever: 0.75 }
  },
  {
    id: 'temperamental',
    name: 'Temperamental',
    description: 'Capable in service, but prone to quarrels when placed under pressure.',
    eventWeights: { staff_dispute: 1.55 }
  },
  {
    id: 'observant',
    name: 'Observant',
    description: 'Notices small grievances before they become larger household problems.',
    eventWeights: { staff_dispute: 0.75 }
  },
  {
    id: 'gossip',
    name: 'Fond of gossip',
    description: 'Takes a lively interest in private news and the affairs of neighbouring households.',
    eventWeights: { partner_debt: 1.4 }
  },
  {
    id: 'polished',
    name: 'Polished',
    description: 'Presents the household with confidence before visitors and society callers.',
    eventWeights: { society: 1.35 }
  },
  {
    id: 'well-connected',
    name: 'Well connected',
    description: 'Maintains useful acquaintances among servants in other respectable houses.',
    eventWeights: { society: 1.5 }
  },
  {
    id: 'prudent',
    name: 'Prudent',
    description: 'Regards fashionable schemes and speculative proposals with careful suspicion.',
    eventWeights: { railway: 0.65 }
  },
  {
    id: 'compassionate',
    name: 'Compassionate',
    description: 'Takes a sincere interest in charitable causes and families facing hardship.',
    eventWeights: { village_fever: 1.35 }
  }
];

// Wage ranges are monthly. Gender determines which name list and title are used.
// An array may be supplied for gender/title if a future role can generate either.
const staffRoleGeneration = {
  Housekeeper: { gender: 'female', title: 'Mrs', wageMin: 8, wageMax: 13, applicantCount: 3 },
  Cook: { gender: 'female', title: 'Mrs', wageMin: 6, wageMax: 11, applicantCount: 3 },
  'Parlour maid': { gender: 'female', title: 'Miss', wageMin: 3, wageMax: 6, applicantCount: 3 },
  Footman: { gender: 'male', title: 'Mr', wageMin: 4, wageMax: 7, applicantCount: 3 },
  Governess: { gender: 'female', title: 'Miss', wageMin: 5, wageMax: 8, applicantCount: 3 }
};

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatedStaffId(role) {
  const roleId = role.toLowerCase().replaceAll(' ', '-');
  return `${roleId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateStaffApplicant(role, usedNames = new Set()) {
  const settings = staffRoleGeneration[role];
  const gender = Array.isArray(settings.gender) ? randomFrom(settings.gender) : settings.gender;
  const title = Array.isArray(settings.title) ? randomFrom(settings.title) : settings.title;
  const trait = randomFrom(staffTraits);

  let givenName;
  let surname;
  let fullName;
  do {
    givenName = randomFrom(staffGivenNames[gender]);
    surname = randomFrom(staffSurnames);
    fullName = `${title} ${givenName} ${surname}`;
  } while (usedNames.has(fullName));
  usedNames.add(fullName);

  return {
    id: generatedStaffId(role),
    name: fullName,
    gender,
    role,
    wage: randomInteger(settings.wageMin, settings.wageMax),
    trait: trait.name,
    traitId: trait.id,
    description: trait.description,
    eventWeights: { ...trait.eventWeights },
    appearance: null
  };
}

function generateStaffApplicantPool(role) {
  const settings = staffRoleGeneration[role];
  const usedNames = new Set(state.staff.map(servant => servant.name));
  return Array.from(
    { length: settings.applicantCount },
    () => generateStaffApplicant(role, usedNames)
  );
}

function applicantsForRole(role) {
  state.staffApplicants ||= {};
  state.staffApplicants[role] ||= generateStaffApplicantPool(role);
  return state.staffApplicants[role];
}

function clearApplicantsForRole(role) {
  if (state.staffApplicants) delete state.staffApplicants[role];
}
