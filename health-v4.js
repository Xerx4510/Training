(() => {
  const API='https://trainutra.rafmarq.workers.dev/';
  const $=s=>document.querySelector(s);
  const finite=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const first=(...v)=>{for(const x of v)if(x!==undefined&&x!==null)return x;return null};
  const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  const fmtSleep=sec=>sec==null?'–':`${Math.floor(sec/3600)} h ${Math.round((sec%3600)/60)} min`;
  function findNums(obj,key){const out=[];(function walk(x){if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return;}for(const [k,v] of Object.entries(x)){if(k===key&&finite(v)!=null)out.push(finite(v));walk(v)}})(obj);return out}
  function lastBodyBattery(bb){const vals=[];(function walk(x){if(!x)return;if(Array.isArray(x)){if(x.length>=2&&finite(x[1])!=null&&finite(x[1])>=0&&finite(x[1])<=100)vals.push(finite(x[1]));x.forEach(walk)}else if(typeof x==='object')Object.values(x).forEach(walk)})(bb);return vals.length?vals.at(-1):null}
  function addStyle(){const s=document.createElement('style');s.textContent=`.health-title{margin:22px 0 10px}.health-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:0 0 14px}.health-card{background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:18px;padding:20px}.health-card b{display:block;font-size:28px;margin:10px 0}.health-card span{color:var(--muted);font-size:13px}.health-good{color:var(--green)!important}@media(max-width:1000px){.health-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:500px){.health-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
  async function run(){
    addStyle();
    try{
      const r=await fetch(API,{cache:'no-store'}),j=await r.json(); if(!r.ok||!j.connected)throw Error(j.error||'Garmin nicht verbunden');
      const h=j.health||{}, hv=h.hrv||{}, sl=h.sleep||{}, d=h.daily||{};
      // Real Garmin response: hrvSummary + hrvReadings[{hrvValue,...}]
      const readings=(hv.hrvReadings||[]).map(x=>finite(x.hrvValue)).filter(x=>x!=null);
      const hrv=first(finite(hv.hrvSummary?.lastNightAvg),finite(hv.lastNightAvg),avg(readings));
      const status=first(hv.hrvSummary?.status,hv.status,'Garmin HRV');
      const sleepSec=first(finite(sl.dailySleepDTO?.sleepTimeSeconds),finite(sl.dailySleepDTO?.sleepTimeInSeconds),finite(sl.sleepTimeSeconds),finite(sl.sleepTimeInSeconds));
      const sleepScore=first(finite(sl.dailySleepDTO?.sleepScores?.overall?.value),finite(sl.dailySleepDTO?.sleepScore),finite(sl.sleepScore));
      const bb=lastBodyBattery(h.bodyBattery);
      const resting=first(finite(d.restingHeartRate),finite(d.minHeartRate),...findNums(d,'restingHeartRate'));
      const stress=first(finite(d.averageStressLevel),finite(d.avgStressLevel),...findNums(d,'averageStressLevel'));
      let old=$('.health-v4');if(old)old.remove();
      const wrap=document.createElement('section');wrap.className='health-v4';
      wrap.innerHTML=`<div class="health-title"><small>GESUNDHEIT & REGENERATION</small><h2>Garmin Health</h2></div><div class="health-grid">
        <article class="health-card"><small>HRV</small><b>${hrv==null?'–':Math.round(hrv)+' ms'}</b><span class="${String(status).toUpperCase().includes('BALANCED')?'health-good':''}">${status}</span></article>
        <article class="health-card"><small>SCHLAF</small><b>${fmtSleep(sleepSec)}</b><span>${sleepScore==null?'Garmin Schlaf':`Score ${Math.round(sleepScore)}`}</span></article>
        <article class="health-card"><small>BODY BATTERY</small><b>${bb==null?'–':Math.round(bb)+' / 100'}</b><span>letzter Messwert</span></article>
        <article class="health-card"><small>RUHEPULS</small><b>${resting==null?'–':Math.round(resting)+' bpm'}</b><span>heutiger Wert</span></article>
        <article class="health-card"><small>STRESS</small><b>${stress==null?'–':Math.round(stress)+' / 100'}</b><span>Tagesdurchschnitt</span></article>
      </div>`;
      const dash=$('#dashboard'),cards=dash?.querySelector('.cards');if(cards)cards.insertAdjacentElement('afterend',wrap);
      // Replace misleading load KPI: raw Garmin activityTrainingLoad values are not multiplied.
      const cutoff=Date.now()-7*864e5;const loads=(j.activities||[]).filter(a=>new Date(a.startTimeLocal||a.startTimeGMT||0).getTime()>=cutoff).map(a=>finite(first(a.activityTrainingLoad,a.trainingLoad,a.trainingStressScore))).filter(v=>v!=null&&v>=0);
      const k=$('#kpiLoad');if(k){k.textContent=loads.length?Math.round(loads.reduce((a,b)=>a+b,0)):'–';if(k.previousElementSibling)k.previousElementSibling.textContent='TRAINING LOAD, 7 TAGE';if(k.nextElementSibling)k.nextElementSibling.textContent=loads.length?'Garmin-Summe':'nicht geliefert'}
    }catch(e){console.warn('Garmin Health V4:',e)}
  }
  window.addEventListener('load',()=>setTimeout(run,500));
})();
