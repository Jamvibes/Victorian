Exit code: 0
Wall time: 1.2 seconds
Output:
const origins=[
 {id:'gentry',name:'The landed gentry',desc:'A respected name and a modest estate burdened by expectation.',funds:6200,income:1750,reputation:64,harmony:55,difficulty:'Comfortable'},
 {id:'trade',name:'A mercantile fortune',desc:'New money, abundant capital, and doors that do not always open.',funds:9800,income:2300,reputation:39,harmony:58,difficulty:'Prosperous'},
 {id:'clergy',name:'The rector’s family',desc:'Education and good character, but little inheritance.',funds:3400,income:1250,reputation:54,harmony:66,difficulty:'Demanding'}
];
const matches=[
 {id:'love',name:'A love match',desc:'Deep affection, privately made, with no advantageous settlement.',funds:300,harmony:22,reputation:-3},
 {id:'prudent',name:'A prudent understanding',desc:'Mutual esteem and a useful, if modest, settlement.',funds:1800,harmony:10,reputation:5},
 {id:'arranged',name:'A family arrangement',desc:'Considerable property joins the household; intimacy may follow.',funds:4000,harmony:-8,reputation:10}
];
const staffRoles=[
 {role:'Housekeeper',wage:8,benefit:3},{role:'Cook',wage:7,benefit:2},{role:'Parlour maid',wage:4,benefit:2},{role:'Footman',wage:5,benefit:3},{role:'Governess',wage:6,benefit:2}
];
const investmentTypes=[
 {id:'consols',name:'Government consols',stake:250,risk:.08,upside:.12,downside:.05,reputation:1},
 {id:'railway',name:'Railway shares',stake:400,risk:.34,upside:.42,downside:.38,reputation:0},
 {id:'property',name:'A leasehold property',stake:600,risk:.18,upside:.27,downside:.16,reputation:2},
 {id:'venture',name:'A commercial venture',stake:500,risk:.43,upside:.58,downside:.52,reputation:-1}
];
const events=[
 {title:'An Invitation from Lady Ashcombe',body:'An invitation arrives for dinner at Ashcombe Hall. Your present evening clothes will be noticed, though declining the first invitation may be noticed more.',choices:[
  {label:'Attend in suitable new clothes',note:'£95 · reputation likely to rise',effects:{funds:-95,reputation:9,harmony:2},result:'The evening passes handsomely, and your name appears in several promising conversations.'},
  {label:'Attend without extravagance',note:'A social risk',effects:{reputation:2,harmony:-1},result:'You are received politely. One or two glances linger longer than courtesy requires.'},
  {label:'Send regrets',note:'Preserve funds · lose an opening',effects:{reputation:-5,harmony:2},result:'The household enjoys a quiet evening, while Ashcombe Hall proceeds without you.'}]},
 {title:'The Northern Railway Prospectus',body:'Your banker offers shares in a new northern line. The engineers are confident; the newspapers are divided.',choices:[
  {label:'Subscribe £500',note:'Risk capital for an uncertain return',effects:{funds:-500,investment:500},result:'The certificates are placed in the strongbox. Their value will be known in time.'},
  {label:'Purchase £200 in shares',note:'A measured exposure',effects:{funds:-200,investment:200},result:'A modest parcel of shares joins the family papers.'},
  {label:'Decline the speculation',note:'No risk, no return',effects:{reputation:-1},result:'Your banker inclines his head, revealing neither approval nor disappointment.'}]},
 {title:'A Complaint Below Stairs',body:'The housekeeper reports that long hours and economies in the kitchen have provoked talk of resignations.',choices:[
  {label:'Increase every servant’s allowance',note:'£60 · restore confidence',effects:{funds:-60,loyalty:14,reputation:1},result:'The gesture is discussed warmly below stairs, though the account book feels it at once.'},
  {label:'Hear the staff individually',note:'Time and patience',effects:{harmony:3,loyalty:7},result:'Grievances are aired. Not all are solved, but the household feels heard.'},
  {label:'Insist upon discipline',note:'Save money · risk resentment',effects:{loyalty:-13,reputation:-2},result:'Order returns quickly. Goodwill does not.'}]},
 {title:'Your Partner’s Confidence',body:'Your partner has quietly supported a struggling relation and now asks the household to cover a debt of £140.',choices:[
  {label:'Settle the debt without reproach',note:'£140 · strengthen the marriage',effects:{funds:-140,harmony:13},result:'Relief gives way to gratitude; the matter remains entirely private.'},
  {label:'Pay half, with conditions',note:'£70 · a compromise',effects:{funds:-70,harmony:3},result:'A solution is reached, though neither of you calls it generous.'},
  {label:'Refuse the request',note:'Protect the estate',effects:{harmony:-12,reputation:-3},result:'The estate is protected. The silence at dinner is considerable.'}]},
 {title:'A Fever in the Village',body:'Illness has reached several cottages. The vicar asks you to fund a temporary nurse and clean water carts.',choices:[
  {label:'Meet the full expense',note:'£110 · duty publicly fulfilled',effects:{funds:-110,reputation:11,harmony:3},result:'The measures are effective, and gratitude spreads further than the fever.'},
  {label:'Contribute £40 discreetly',note:'A limited but sincere response',effects:{funds:-40,reputation:4},result:'The vicar thanks you. The need, however, remains greater than the provision.'},
  {label:'The parish must bear its duties',note:'No expense',effects:{reputation:-10,loyalty:-3},result:'The decision is lawful and much discussed.'}]}
];
let state=null;
const $=s=>document.querySelector(s);
function show(id){['welcome','setup','game'].forEach(x=>$('#'+x).hidden=x!==id)}
function renderCards(){
 $('#origins').innerHTML=origins.map((o,i)=>`<label class="choice"><input type="radio" name="origin" value="${o.id}" ${i===0?'checked':''}><strong>${o.name}</strong><small>${o.desc}</small></label>`).join('');
 $('#matches').innerHTML=matches.map((m,i)=>`<label class="choice"><input type="radio" name="match" value="${m.id}" ${i===0?'checked':''}><strong>${m.name}</strong><small>${m.desc}</small></label>`).join(''); updateProspect();
}
function selections(){const o=origins.find(x=>x.id===$('[name=origin]:checked').value),m=matches.find(x=>x.id===$('[name=match]:checked').value);return{o,m}}
function updateProspect(){const {o,m}=selections();$('#prospect').innerHTML=`<span class="eyebrow">Your prospects</span><strong>Funds £${(o.funds+m.funds).toLocaleString()}</strong><strong>Income £${o.income.toLocaleString()}</strong><strong>Reputation ${o.reputation+m.reputation}</strong><strong>Family accord ${o.harmony+m.harmony}</strong><em>${o.difficulty}</em>`}
function newHousehold(data){const {o,m}=selections();state={given:data.get('givenName'),family:data.get('familyName'),partner:data.get('partnerName'),origin:o.id,match:m.id,month:0,funds:o.funds+m.funds,income:o.income,reputation:o.reputation+m.reputation,harmony:o.harmony+m.harmony,loyalty:55,investment:0,holdings:[],staff:[...staffRoles],history:[`${data.get('givenName')} and ${data.get('partnerName')} ${data.get('familyName')} took possession of the house.`],eventOrder:shuffle([...Array(events.length).keys()])};saveState();show('game');renderGame()}
function shuffle(a){for(let i=a.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function money(v){return `${v<0?'−':''}£${Math.abs(Math.round(v)).toLocaleString()}`}
function renderGame(){const months=['January','February','March','April','May','June','July','August','September','October','November','December'];state.holdings=state.holdings||[];$('#date').textContent=`${months[state.month]} 1880`;$('#house-name').textContent=`${state.family} House`;['funds','income'].forEach(k=>$('#'+k).textContent=money(state[k]));['reputation','harmony','loyalty'].forEach(k=>$('#'+k).textContent=Math.round(state[k]));const monthlyIncome=state.income/12,staffCost=state.staff.reduce((a,s)=>a+s.wage,0);$('#accounts').innerHTML=`<div class="account"><span>Income</span><strong>${money(monthlyIncome)}</strong></div><div class="account"><span>Staff wages</span><strong>−£${staffCost}</strong></div><div class="account"><span>Household upkeep</span><strong>−£65</strong></div>`;renderStaff();renderInvestments();renderEvent()}
function renderStaff(){const employed=state.staff.map((s,i)=>`<div class="staff-row"><span>${s.role}</span><button data-dismiss="${i}">Dismiss</button></div>`).join('');const vacant=staffRoles.filter(r=>!state.staff.some(s=>s.role===r.role)).map(r=>`<div class="staff-row"><span><em>Vacant:</em> ${r.role}</span><button data-hire="${r.role}">Hire · £${r.wage}/mo</button></div>`).join('');$('#staff').innerHTML=employed+vacant}
function renderInvestments(){const holdings=state.holdings.length?`<p class="management-note holding">Capital committed: ${money(state.holdings.reduce((a,h)=>a+h.stake,0))}. Returns settle later in the year.</p>`:'<p class="management-note">Uninvested funds are safe but earn no return.</p>';$('#investments').innerHTML=holdings+investmentTypes.map(x=>`<div class="investment-row"><span>${x.name}<small class="management-note">${x.risk<.15?'low':x.risk<.3?'moderate':'high'} risk</small></span><button data-invest="${x.id}" ${state.funds<x.stake?'disabled':''}>Invest £${x.stake}</button></div>`).join('')}
function renderEvent(){const e=events[state.eventOrder[state.month%events.length]];$('#event-title').textContent=e.title;$('#event-body').textContent=e.body;$('#event-choices').innerHTML=e.choices.map((c,i)=>`<button class="event-choice" data-choice="${i}"><strong>${c.label}</strong><small>${c.note}</small></button>`).join('');document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>resolveEvent(e,+b.dataset.choice))}
function resolveEvent(e,i){const c=e.choices[i];Object.entries(c.effects).forEach(([k,v])=>state[k]=(state[k]||0)+v);const monthlyIncome=state.income/12,expenses=65+state.staff.reduce((a,s)=>a+s.wage,0);state.funds+=monthlyIncome-expenses;if(state.investment&&Math.random()<.35){const change=Math.round(state.investment*(Math.random()<.55?.35:-.45));state.funds+=state.investment+change;state.history.unshift(`The railway shares were sold for ${money(state.investment+change)}.`);state.investment=0}settleHoldings();state.history.unshift(c.result);state.month++;clamp();if(state.month>=12||state.funds<-500||state.reputation<=0)return finish();saveState();renderGame();renderHistory()}
function settleHoldings(){state.holdings=state.holdings||[];state.holdings=state.holdings.filter(h=>{if(state.month-h.month<2||Math.random()>.34)return true;const type=investmentTypes.find(x=>x.id===h.id);const failed=Math.random()<type.risk;const change=Math.round(h.stake*(failed?-type.downside:type.upside));state.funds+=h.stake+change;state.reputation+=failed?type.reputation-1:type.reputation;state.history.unshift(`${type.name} ${failed?'disappointed':'rewarded'} the family, returning ${money(h.stake+change)}.`);return false})}
function clamp(){['reputation','harmony','loyalty'].forEach(k=>state[k]=Math.max(0,Math.min(100,state[k])))}
function renderHistory(){$('#chronicle').innerHTML=state.history.map(x=>`<li>${x}</li>`).join('')}
function finish(){const virtues=[['fortune',state.funds],['standing',state.reputation*80],['domestic happiness',state.harmony*75],['a loyal household',state.loyalty*65]].sort((a,b)=>b[1]-a[1]);$('#ending-content').innerHTML=`<p class="eyebrow">December 1880</p><h2>The ${state.family} Legacy</h2><p>No single account can settle whether a life was well lived. The year leaves the ${state.family} family best known for <strong>${virtues[0][0]}</strong>, while ${virtues.at(-1)[0]} remains less certain.</p><p>Funds: ${money(state.funds)} · Reputation: ${state.reputation} · Family accord: ${state.harmony}</p>`;$('#ending').showModal();localStorage.removeItem('victorian-household')}
function saveState(){localStorage.setItem('victorian-household',JSON.stringify(state));$('#continue').hidden=false}
$('#begin').onclick=()=>{show('setup');renderCards()};$('#continue').onclick=()=>{state=JSON.parse(localStorage.getItem('victorian-household'));show('game');renderGame();renderHistory()};$('#household-form').onchange=updateProspect;$('#household-form').onsubmit=e=>{e.preventDefault();newHousehold(new FormData(e.target));renderHistory()};$('#save').onclick=()=>saveState();$('#restart').onclick=()=>{if(confirm('Set aside this household and begin again?')){localStorage.removeItem('victorian-household');show('setup');renderCards()}};$('#ending-restart').onclick=()=>{$('#ending').close();show('setup');renderCards()};document.addEventListener('click',e=>{if(e.target.dataset.dismiss!==undefined){const s=state.staff.splice(+e.target.dataset.dismiss,1)[0];state.loyalty-=6;state.history.unshift(`${s.role} was dismissed from service.`);saveState();renderGame();renderHistory()}if(e.target.dataset.hire){const role=staffRoles.find(r=>r.role===e.target.dataset.hire);if(role&&!state.staff.some(s=>s.role===role.role)){state.staff.push({...role});state.loyalty+=3;state.history.unshift(`A new ${role.role.toLowerCase()} entered the household.`);saveState();renderGame();renderHistory()}}if(e.target.dataset.invest){const type=investmentTypes.find(x=>x.id===e.target.dataset.invest);if(type&&state.funds>=type.stake){state.funds-=type.stake;state.holdings.push({id:type.id,stake:type.stake,month:state.month});state.history.unshift(`${money(type.stake)} was committed to ${type.name.toLowerCase()}.`);saveState();renderGame();renderHistory()}}});if(localStorage.getItem('victorian-household'))$('#continue').hidden=false;

