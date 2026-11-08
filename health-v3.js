(() => {
  const API='https://trainutra.rafmarq.workers.dev/';
  const n=(...v)=>{for(const x of v){const z=Number(x);if(Number.isFinite(z))return z}return null};
  const deep=(o,keys)=>{if(!o)return null;for(const k of keys){const parts=k.split('.');let v=o;for(const p of parts)v=v?.[p];if(v!==undefined&&v!==null)return v}return null};
  const minsToText=m=>m==null?'–':`${Math.floor(m/60)} h ${Math.round(m%60)} min`;
  const style=document.createElement('style');style.textContent=`.health-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:14px 0}.health-card{background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:18px;padding:20px}.health-card b{display:block;font-size:28px;margin:10px 0}.health-card span{color:var(--muted);font-size:13px}.health-note{color:var(--muted);font-size:12px;margin-top:8px}@media(max-width:900px){.health-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:480px){.health-grid{grid-template-columns:1fr}}`;document.head.appendChild(style);
  async function run(){
    try{
      const r=await fetch(API,{cache:'no-store'}),j=await r.json();if(!j.connected)throw Error(j.error||'Keine Verbindung');
      const h=j.health||{},sleep=h.sleep||{},hrv=h.hrv||{},daily=h.daily||{};
      const sleepSec=n(deep(sleep,['dailySleepDTO.sleepTimeSeconds','dailySleepDTO.sleepTimeInSeconds','sleepTimeSeconds','sleepTimeInSeconds']));
      const sleepMin=sleepSec!=null?sleepSec/60:n(deep(sleep,['dailySleepDTO.sleepDuration','sleepDuration']))||null;
      const sleepScore=n(deep(sleep,['dailySleepDTO.sleepScores.overall.value','dailySleepDTO.sleepScore','sleepScore']));
      const hrvVal=n(deep(hrv,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg']));
      let bb=n(deep(h.bodyBattery,['0.bodyBatteryValuesArray.0.1','0.charged','bodyBattery']));
      if(Array.isArray(h.bodyBattery)){const vals=[];for(const row of h.bodyBattery){for(const v of (row.bodyBatteryValuesArray||[])){if(Array.isArray(v)&&Number.isFinite(Number(v[1])))vals.push(Number(v[1]))}}if(vals.length)bb=vals.at(-1)}
      const resting=n(deep(daily,['restingHeartRate','minHeartRate']));
      const stress=n(deep(daily,['averageStressLevel','avgStressLevel']));
      const cards=[['HRV',hrvVal==null?'–':`${Math.round(hrvVal)} ms`,'letzte Nacht'],['Schlaf',minsToText(sleepMin),sleepScore==null?'Garmin-Schlafdaten':`Score ${Math.round(sleepScore)}`],['Body Battery',bb==null?'–':`${Math.round(bb)}/100`,'aktueller Garmin-Wert'],['Ruhepuls',resting==null?'–':`${Math.round(resting)} bpm`,'Tageszusammenfassung'],['Stress',stress==null?'–':`${Math.round(stress)}/100`,'Tagesdurchschnitt']];
      const grid=document.createElement('section');grid.className='health-grid';grid.innerHTML=cards.map(c=>`<article class="health-card"><small>${c[0].toUpperCase()}</small><b>${c[1]}</b><span>${c[2]}</span></article>`).join('');
      const dashboard=document.querySelector('#dashboard');const cardsEl=dashboard?.querySelector('.cards');if(cardsEl)cardsEl.insertAdjacentElement('afterend',grid);
      const cutoff=Date.now()-7*864e5;const loads=(j.activities||[]).filter(a=>new Date(a.startTimeLocal||a.startTimeGMT||0).getTime()>=cutoff).map(a=>n(a.activityTrainingLoad,a.trainingLoad,a.trainingStressScore)).filter(v=>v!=null&&v>=0&&v<1000);const weekly=loads.reduce((a,b)=>a+b,0);const k=document.querySelector('#kpiLoad');if(k)k.textContent=loads.length?Math.round(weekly):'–';const label=k?.previousElementSibling;if(label)label.textContent='Belastung, 7 Tage';const sub=k?.nextElementSibling;if(sub)sub.textContent=loads.length?'Summe Garmin Training Load':'von Garmin nicht geliefert';
    }catch(e){console.warn('Health V3:',e.message)}
  }
  window.addEventListener('load',()=>setTimeout(run,600));
})();
