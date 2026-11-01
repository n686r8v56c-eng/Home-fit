import React,{useMemo,useState} from 'react';
import './body-metrics.css';

const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const metricTypes=[{key:'weight',label:'체중',unit:'kg',digits:1},{key:'bmi',label:'BMI',unit:'',digits:1},{key:'fat',label:'체지방률',unit:'%',digits:1},{key:'muscle',label:'골격근량',unit:'kg',digits:1}];
const parseNumber=v=>v===''||v==null?null:Number.isFinite(Number(v))?Number(v):null;
const valid=(v,min,max)=>v===null||(Number.isFinite(v)&&v>=min&&v<=max);
function Trend({points,unit}){
 const values=points.filter(p=>p.value!==null);
 if(!values.length)return <div className="bm-empty">아직 기록이 없어. 날짜별 수치를 등록하면 그래프가 나타나.</div>;
 const ww=600,hh=185,left=36,right=12,top=16,bottom=30;
 const ys=values.map(p=>p.value),lo=Math.min(...ys),hi=Math.max(...ys),spread=Math.max(1,(hi-lo)*1.25);
 const lower=(hi+lo-spread)/2,upper=lower+spread;
 const xs=values.map(p=>new Date(`${p.date}T12:00:00`).getTime());const minx=Math.min(...xs),maxx=Math.max(...xs);
 const coordinates=values.map((p,i)=>({x:left+(minx===maxx?(ww-left-right)/2:((xs[i]-minx)/(maxx-minx))*(ww-left-right)),y:top+(upper-p.value)/spread*(hh-top-bottom),...p}));
 const path=coordinates.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
 const last=coordinates[coordinates.length-1];
 return <div className="bm-chart-wrap"><svg viewBox={`0 0 ${ww} ${hh}`} className="bm-chart" role="img" aria-label={`기간 내 ${values.length}개 측정 기록 그래프`}>
  {[0,.5,1].map((fraction,i)=>{const y=top+(hh-top-bottom)*fraction;return <g key={i}><line x1={left} x2={ww-right} y1={y} y2={y} stroke="#eee8f4"/><text x={left-5} y={y+4} textAnchor="end" fontSize="10" fill="#92859d">{(upper-spread*fraction).toFixed(1)}</text></g>})}
  {coordinates.length>1&&<path d={path} fill="none" stroke="#7854a9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>}
  {coordinates.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===coordinates.length-1?5:3} fill="#7854a9"><title>{p.date}: {p.value}{unit}</title></circle>)}
  <text x={left} y={hh-9} textAnchor="start" fontSize="11" fill="#92859d">{values[0].date.slice(5)}</text><text x={ww-right} y={hh-9} textAnchor="end" fontSize="11" fill="#92859d">{last.date.slice(5)}</text>
 </svg></div>
}
export default function BodyMetrics({record={},saveRecord,today=localDay()}){
 const height=parseNumber(record.bodyHeight)||null;
 const rows=useMemo(()=>[...(record.bodyMeasurements||[])].filter(r=>r&&/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')).sort((a,b)=>a.date.localeCompare(b.date)),[record.bodyMeasurements]);
 const recent=rows.at(-1);
 const [date,setDate]=useState(today),[weight,setWeight]=useState(''),[fat,setFat]=useState(''),[muscle,setMuscle]=useState('');
 const [editHeight,setEditHeight]=useState(false),[heightDraft,setHeightDraft]=useState('');
 const [metric,setMetric]=useState('weight'),[period,setPeriod]=useState('90');
 const bmi=(w)=>height&&w!=null&&height>0?w/((height/100)**2):null;
 const observed=v=>v==null?'—':Number(v).toFixed(1);
 const currentValues={weight:parseNumber(recent?.weight),bmi:bmi(parseNumber(recent?.weight)),fat:parseNumber(recent?.fat),muscle:parseNumber(recent?.muscle)};
 const start=new Date(`${today}T12:00:00`);if(period!=='all')start.setDate(start.getDate()-Number(period)+1);
 const filtered=rows.filter(x=>period==='all'||x.date>=localDay(start));
 const active=metricTypes.find(x=>x.key===metric);
 const points=filtered.map(r=>({date:r.date,value:metric==='bmi'?bmi(parseNumber(r.weight)):parseNumber(r[metric])}));
 function selectDate(d){setDate(d);const old=rows.find(x=>x.date===d);setWeight(old?.weight==null?'':String(old.weight));setFat(old?.fat==null?'':String(old.fat));setMuscle(old?.muscle==null?'':String(old.muscle));}
 function save(){const w=parseNumber(weight),f=parseNumber(fat),m=parseNumber(muscle);if(!date||!valid(w,15,400)||!valid(f,0,100)||!valid(m,0,200)||[w,f,m].every(x=>x===null)){window.alert('날짜를 선택하고 유효한 측정값을 하나 이상 입력해 줘.');return;}
  saveRecord(s=>({...s,bodyMeasurements:[...(s.bodyMeasurements||[]).filter(x=>x.date!==date),{date,weight:w,fat:f,muscle:m}].sort((a,b)=>a.date.localeCompare(b.date))}));
 }
 function remove(d){if(!window.confirm(`${d} 신체 기록을 삭제할까?`))return;saveRecord(s=>({...s,bodyMeasurements:(s.bodyMeasurements||[]).filter(x=>x.date!==d)}));if(date===d){setWeight('');setFat('');setMuscle('');}}
 function saveHeight(){const h=parseNumber(heightDraft);if(!valid(h,80,250)||h===null){window.alert('키는 80~250cm 사이로 입력해 줘.');return;}saveRecord(s=>({...s,bodyHeight:h}));setEditHeight(false)}
 return <div className="hf-dashboard bm-page"><header className="hf-page-head"><small>HOME FIT · BODY</small><h1>신체 변화</h1></header>
  <div className="bm-top"><div className="bm-height"><span>키</span><strong>{height?`${height} cm`:'미등록'}</strong><button type="button" onClick={()=>{setHeightDraft(height?String(height):'');setEditHeight(v=>!v)}}>수정</button></div>{editHeight&&<div className="bm-height-edit"><input aria-label="키 cm" inputMode="decimal" type="number" min="80" max="250" placeholder="키 (cm)" value={heightDraft} onChange={e=>setHeightDraft(e.target.value)}/><button onClick={saveHeight}>저장</button><button className="bm-cancel" onClick={()=>setEditHeight(false)}>취소</button></div>}</div>
  <div className="hf-kpi-grid bm-stats">{metricTypes.map(x=><div className="hf-kpi" key={x.key}><span>{x.label}</span><strong>{observed(currentValues[x.key])}{currentValues[x.key]==null?'':x.unit}</strong></div>)}</div>
  <section className="hf-section"><div className="hf-section-title"><h2>측정 기록</h2><span>같은 날짜는 수정 저장</span></div><div className="bm-form"><label className="bm-date">날짜<input type="date" value={date} onChange={e=>selectDate(e.target.value)}/></label><div className="bm-numbers"><label>체중 (kg)<input type="number" inputMode="decimal" placeholder="—" value={weight} onChange={e=>setWeight(e.target.value)}/></label><label>체지방률 (%)<input type="number" inputMode="decimal" placeholder="—" value={fat} onChange={e=>setFat(e.target.value)}/></label><label>골격근량 (kg)<input type="number" inputMode="decimal" placeholder="—" value={muscle} onChange={e=>setMuscle(e.target.value)}/></label></div><div className="bm-form-bottom"><span>BMI {height&&parseNumber(weight)!=null?bmi(parseNumber(weight)).toFixed(1):'—'} · 키와 체중으로 자동 계산</span><button type="button" onClick={save}>기록 저장</button></div></div></section>
  <section className="hf-section"><div className="hf-section-title"><h2>변화 그래프</h2><span>항목별 추이</span></div><div className="bm-switch">{metricTypes.map(x=><button key={x.key} className={metric===x.key?'active':''} onClick={()=>setMetric(x.key)}>{x.label}</button>)}</div><div className="bm-switch bm-period">{[['7','7일'],['30','30일'],['90','90일'],['365','1년'],['all','전체']].map(([v,label])=><button key={v} className={period===v?'active':''} onClick={()=>setPeriod(v)}>{label}</button>)}</div><Trend points={points} unit={active.unit}/>{filtered.length>0&&<p className="bm-hint">기록 {points.filter(x=>x.value!==null).length}건 · {active.label} 기준</p>}</section>
  <section className="hf-section"><div className="hf-section-title"><h2>측정 이력</h2><span>{rows.length}일</span></div><div className="bm-history">{[...rows].reverse().map(r=><div key={r.date} className="bm-history-row"><button className="bm-history-main" onClick={()=>selectDate(r.date)}><strong>{r.date.slice(5)}</strong><span>{r.weight!=null?`${r.weight}kg`:'—'} · 체지방 {r.fat!=null?`${r.fat}%`:'—'} · 근육 {r.muscle!=null?`${r.muscle}kg`:'—'}</span></button><button className="bm-delete" title="기록 삭제" aria-label={`${r.date} 삭제`} onClick={()=>remove(r.date)}>×</button></div>)}{!rows.length&&<p className="bm-empty">저장된 신체 측정 기록이 없어.</p>}</div></section>
  <p className="hf-footnote">BMI는 키와 체중으로 계산한 참고 지표야. 근육량은 체성분 측정기의 골격근량 수치를 입력해 줘.</p>
 </div>
}
