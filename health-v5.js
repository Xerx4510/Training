(() => {
  console.log('Training Insights Health V5 loaded');
  const API = 'https://trainutra.rafmarq.workers.dev/';
  const $ = s => document.querySelector(s);
  const N = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const first = (...xs) => xs.find(x => x !== null && x !== undefined) ?? null;
  const average = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
  const sleepText = sec => sec == null ? '–' : `${Math.floor(sec/3600)} h ${Math.round((sec%3600)/60)} min`;

  function bodyBatteryValue(source) {
    const vals=[];
    (function walk(x){
      if (Array.isArray(x)) {
        if (x.length >= 2) { const v=N(x[1]); if (v!==null && v>=0 && v<=100) vals.push(v); }
        x.forEach(walk);
      } else if (x && typeof x === 'object') Object.values(x).forEach(walk);
    })(source);
    return vals.length ? vals[vals.length-1] : null;
  }

  function addStyles(){
    if ($('#health-v5-style')) return;
    const s=document.createElement('style'); s.id='health-v5-style';
    s.textContent='.health-section{margin:18px 0}.health-grid-v5{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.health-card-v5{background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:18px;padding:20px}.health-card-v5 b{display:block;font-size:28px;margin:10px 0}.health-card-v5 span{color:var(--muted);font-size:13px}.health-ok{color:var(--green)!important}.health-debug{color:var(--muted);font-size:12px;margin-top:8px}@media(max-width:1000px){.health-grid-v5{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.health-grid-v5{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  async function run(){
    addStyles();
    const dash=$('#dashboard');
    if (!dash) { console.error('Health V5: #dashboard not found'); return; }

    let section=$('#garmin-health-v5');
    if (!section) {
      section=document.createElement('section'); section.id='garmin-health-v5'; section.className='health-section';
      const cards=dash.querySelector('.cards');
      if (cards) cards.insertAdjacentElement('afterend',section); else dash.prepend(section);
    }
    section.innerHTML='<small>GESUNDHEIT & REGENERATION</small><h2>Garmin Health</h2><p class="health-debug">Garmin-Gesundheitsdaten werden geladen …</p>';

    try {
      const r=await fetch(API,{cache:'no-store'}); const j=await r.json();
      if (!r.ok || !j.connected) throw new Error(j.error || `HTTP ${r.status}`);
      const h=j.health || {}, hv=h.hrv || {}, sl=h.sleep || {}, d=h.daily || {};
      const readings=(hv.hrvReadings || []).map(x=>N(x.hrvValue)).filter(x=>x!==null);
      const hrv=first(N(hv.hrvSummary?.lastNightAvg),N(hv.hrvSummary?.weeklyAvg),average(readings));
      const hrvStatus=first(hv.hrvSummary?.status,hv.status,'Garmin HRV');
      const sleepSec=first(N(sl.dailySleepDTO?.sleepTimeSeconds),N(sl.dailySleepDTO?.sleepTimeInSeconds),N(sl.sleepTimeSeconds));
      const sleepScore=first(N(sl.dailySleepDTO?.sleepScores?.overall?.value),N(sl.dailySleepDTO?.sleepScore),N(sl.sleepScore));
      const bb=bodyBatteryValue(h.bodyBattery);
      const resting=first(N(d.restingHeartRate),N(d.minHeartRate));
      const stress=first(N(d.averageStressLevel),N(d.avgStressLevel));

      const entries=[
        ['HRV',hrv===null?'–':`${Math.round(hrv)} ms`,hrvStatus],
        ['SCHLAF',sleepText(sleepSec),sleepScore===null?'Garmin Schlaf':`Score ${Math.round(sleepScore)}`],
        ['BODY BATTERY',bb===null?'–':`${Math.round(bb)} / 100`,'letzter Messwert'],
        ['RUHEPULS',resting===null?'–':`${Math.round(resting)} bpm`,'heutiger Wert'],
        ['STRESS',stress===null?'–':`${Math.round(stress)} / 100`,'Tagesdurchschnitt']
      ];
      section.innerHTML='<small>GESUNDHEIT & REGENERATION</small><h2>Garmin Health</h2><div class="health-grid-v5">'+entries.map(([a,b,c])=>`<article class="health-card-v5"><small>${a}</small><b>${b}</b><span class="${String(c).toUpperCase().includes('BALANCED')?'health-ok':''}">${c}</span></article>`).join('')+'</div>';

      const cutoff=Date.now()-7*864e5;
      const loads=(j.activities||[]).filter(a=>new Date(a.startTimeLocal||a.startTimeGMT||0).getTime()>=cutoff).map(a=>first(N(a.activityTrainingLoad),N(a.trainingLoad),N(a.trainingStressScore))).filter(v=>v!==null && v>=0);
      const k=$('#kpiLoad');
      if(k){ k.textContent=loads.length?Math.round(loads.reduce((a,b)=>a+b,0)):'–'; if(k.previousElementSibling)k.previousElementSibling.textContent='TRAINING LOAD, 7 TAGE'; if(k.nextElementSibling)k.nextElementSibling.textContent=loads.length?'Garmin-Summe':'nicht geliefert'; }
      console.log('Training Insights Health V5 rendered', {hrv,hrvStatus,sleepSec,sleepScore,bodyBattery:bb,restingHeartRate:resting,stress});
    } catch(e) {
      section.innerHTML=`<small>GESUNDHEIT & REGENERATION</small><h2>Garmin Health</h2><p class="health-debug">Health-Modul geladen, Garmin-Abruf fehlgeschlagen: ${e.message}</p>`;
      console.error('Training Insights Health V5 error',e);
    }
  }

  // Script sits at the end of body. Run independently of the window load event.
  setTimeout(run, 300);
})();
