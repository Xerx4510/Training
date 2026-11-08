const GARMIN_API_URL = 'https://trainutra.rafmarq.workers.dev/';
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let data = [];
let syncState = { ok:false, message:'Garmin wird geladen...' };

function num(...xs){ for(const x of xs){ const n=Number(x); if(Number.isFinite(n)) return n; } return 0; }
function sportName(a){ return a.activityType?.typeKey || a.activityType?.typeId || a.sport || 'Training'; }
function prettySport(s){ const m={cycling:'Radfahren',road_biking:'Radfahren',mountain_biking:'Mountainbike',running:'Laufen',walking:'Gehen',strength_training:'Kraft',fitness_equipment:'Fitness',hiking:'Wandern',swimming:'Schwimmen'}; return m[s] || String(s).replaceAll('_',' '); }
function normalize(a){
  const meters=num(a.distance,a.summaryDTO?.distance);
  const seconds=num(a.duration,a.elapsedDuration,a.movingDuration,a.summaryDTO?.duration);
  return {
    date:(a.startTimeLocal||a.startTimeGMT||a.date||'').slice(0,10),
    sport:prettySport(sportName(a)),
    distance:meters>500 ? meters/1000 : meters,
    duration:seconds>300 ? seconds/60 : seconds,
    hr:num(a.averageHR,a.averageHeartRate,a.avgHr,a.summaryDTO?.averageHR),
    maxHr:num(a.maxHR,a.maxHeartRate,a.summaryDTO?.maxHR),
    ascent:num(a.elevationGain,a.totalAscent,a.summaryDTO?.elevationGain),
    calories:num(a.calories,a.summaryDTO?.calories),
    load:num(a.activityTrainingLoad,a.trainingLoad,a.aerobicTrainingEffect)*10 || num(a.trainingStressScore),
    name:a.activityName||a.name||prettySport(sportName(a))
  };
}
async function loadGarmin(){
  try{
    const r=await fetch(GARMIN_API_URL,{cache:'no-store'}); const j=await r.json();
    if(!r.ok || !j.connected || !Array.isArray(j.activities)) throw new Error(j.error||'Garmin-Antwort ungültig');
    data=j.activities.map(normalize).filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date));
    localStorage.setItem('garminActivities',JSON.stringify(data));
    syncState={ok:true,message:`Garmin verbunden · ${data.length} Aktivitäten geladen`};
  }catch(e){
    data=JSON.parse(localStorage.getItem('garminActivities')||'[]');
    syncState={ok:false,message:data.length?`Offline · ${data.length} gespeicherte Aktivitäten`:`Garmin-Fehler: ${e.message}`};
  }
  render();
}
function stats(days=30){const now=new Date(),cut=new Date(now.getTime()-days*864e5),d=data.filter(x=>new Date(x.date)>=cut);return{d,distance:d.reduce((s,x)=>s+x.distance,0),time:d.reduce((s,x)=>s+x.duration,0),load:d.length?d.reduce((s,x)=>s+x.load,0)/d.length:0,ascent:d.reduce((s,x)=>s+x.ascent,0)} }
function put(sel,val){const e=$(sel);if(e)e.textContent=val}
function render(){
  const s=stats(); put('#kpiDistance',`${s.distance.toFixed(1)} km`);put('#kpiTime',`${(s.time/60).toFixed(1)} h`);put('#kpiCount',s.d.length);put('#kpiLoad',Math.round(s.load));
  put('#distanceTrend',syncState.message); put('#gaugeValue',Math.round(s.load));put('#statusTitle',s.load>100?'Hohe Belastung':s.load>55?'Ausgeglichen':'Aufbauphase');put('#statusText',s.load>100?'Plane bewusst Regeneration ein.':s.load>55?'Belastung wirkt insgesamt ausgewogen.':'Steigere Umfang langsam und regelmäßig.');
  recent();table();analysis();drawTrend();drawSports();
}
function recent(){const e=$('#recent');if(!e)return;e.innerHTML=data.slice(0,5).map(x=>`<div class="activity"><b>${x.name}</b><span>${x.date.split('-').reverse().join('.')}</span><span>${x.distance?x.distance.toFixed(1)+' km':'–'}</span><span class="tag">${x.hr?'Ø '+Math.round(x.hr)+' bpm':'Garmin'}</span></div>`).join('')||'<p>Noch keine Garmin-Aktivitäten geladen.</p>'}
function table(){const e=$('#activityTable');if(!e)return;e.innerHTML=data.map(x=>`<tr><td>${x.date}</td><td>${x.sport}</td><td>${x.distance.toFixed(1)} km</td><td>${Math.round(x.duration)} min</td><td>${x.hr?Math.round(x.hr):'–'}</td><td>${Math.round(x.load)}</td></tr>`).join('')}
function setup(c){if(!c)return null;const dpr=devicePixelRatio||1,r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=250*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);return{x,w:r.width,h:250}}
function drawTrend(){const c=$('#trendChart'),z=setup(c);if(!z)return;const {x,w,h}=z,weeks=Number($('#range')?.value||8),vals=Array(weeks).fill(0),now=new Date();data.forEach(a=>{const age=Math.floor((now-new Date(a.date))/6048e5);if(age>=0&&age<weeks)vals[weeks-1-age]+=a.distance});const max=Math.max(...vals,1);x.strokeStyle='#28483d';for(let i=1;i<5;i++){x.beginPath();x.moveTo(0,i*h/5);x.lineTo(w,i*h/5);x.stroke()}x.strokeStyle='#68e6a7';x.lineWidth=3;x.beginPath();vals.forEach((v,i)=>{const px=20+i*(w-40)/Math.max(weeks-1,1),py=h-25-v/max*(h-55);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
function drawSports(){const c=$('#sportChart'),z=setup(c);if(!z)return;const {x,w,h}=z,m={};data.forEach(a=>m[a.sport]=(m[a.sport]||0)+a.duration);const colors=['#68e6a7','#fc8b3c','#5fa8ff','#c783ff','#ffd166'],tot=Object.values(m).reduce((a,b)=>a+b,0)||1;let start=-Math.PI/2;x.lineWidth=34;Object.entries(m).forEach(([k,v],i)=>{const end=start+2*Math.PI*v/tot;x.strokeStyle=colors[i%colors.length];x.beginPath();x.arc(w/2,h/2,75,start,end);x.stroke();start=end});const l=$('#legend');if(l)l.innerHTML=Object.keys(m).map((k,i)=>`<span style="color:${colors[i%colors.length]}">● ${k}</span>`).join('')}
function analysis(){const e=$('#analysis');if(!e)return;const s=stats(),week=stats(7),prevStart=new Date(Date.now()-14*864e5),prevEnd=new Date(Date.now()-7*864e5),prev=data.filter(x=>{const d=new Date(x.date);return d>=prevStart&&d<prevEnd}),prevMin=prev.reduce((a,b)=>a+b.duration,0),delta=prevMin?((week.time-prevMin)/prevMin*100):0;e.innerHTML=`<p><b>Garmin-Status:</b> ${syncState.message}</p><p><b>30 Tage:</b> ${s.d.length} Einheiten, ${s.distance.toFixed(1)} km, ${(s.time/60).toFixed(1)} Stunden und ${Math.round(s.ascent)} Höhenmeter.</p><p><b>7-Tage-Trend:</b> ${prevMin?`${delta>=0?'+':''}${delta.toFixed(0)} % Trainingszeit gegenüber der Vorwoche.`:'Noch nicht genug Vergleichsdaten.'}</p><p><b>Hinweis:</b> Trainingsload ist nur verfügbar, wenn Garmin ihn in der Aktivitätsantwort liefert. Empfehlungen sind keine medizinische Diagnose.</p>`;const p=$('#prompt');if(p)p.value=`Analysiere meine Garmin-Trainingsdaten als vorsichtiger Ausdauercoach. Bewerte Umfang, Intensität, Erholung und Trends und erstelle einen konkreten 7-Tage-Vorschlag. Keine medizinische Diagnose. Daten:\n${JSON.stringify({summary:s,activities:data.slice(0,100)},null,2)}`}
$$('nav button').forEach(b=>b.onclick=()=>{$$('nav button,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.view)?.classList.add('active');render()});$('#theme')?.addEventListener('click',()=>document.body.classList.toggle('light'));$('#range')?.addEventListener('change',drawTrend);$('#refreshAnalysis')?.addEventListener('click',analysis);$('#stravaBtn')?.addEventListener('click',()=>put('#stravaHint','Strava kann im nächsten Schritt ergänzt werden. Garmin ist bereits direkt verbunden.'));$('#copyPrompt')?.addEventListener('click',()=>navigator.clipboard.writeText($('#prompt').value));$('#exportAI')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({source:'Garmin Connect',generated:new Date().toISOString(),summary:stats(),activities:data},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='garmin-training-fuer-ki.json';a.click()});window.addEventListener('resize',()=>{drawTrend();drawSports()});
loadGarmin();
