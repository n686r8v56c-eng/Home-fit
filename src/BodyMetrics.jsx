import React,{useMemo,useState} from 'react';
import {metrics,number,localDay,validDay,shiftDay,valueFor,dailyRows,difference,saveMeasurement} from './bodyMetrics.mjs';
import './body-metrics.css';

function Trend({points,unit,onSelect}){
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
  {coordinates.map((p,i)=><g key={i} role="button" tabIndex={0} aria-label={`${p.date}: ${p.value.toFixed(1)}${unit}`} onClick={()=>onSelect(p.date)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.date)}}}><circle cx={p.x} cy={p.y} r={i===coordinates.length-1?5:3} fill="#7854a9"><title>{p.date}: {p.value}{unit}</title></circle><circle cx={p.x} cy={p.y} r="12" fill="transparent"/></g>)}
  <text x={left} y={hh-9} textAnchor="start" fontSize="11" fill="#92859d">{values[0].date.slice(5)}</text><text x={ww-right} y={hh-9} textAnchor="end" fontSize="11" fill="#92859d">{last.date.slice(5)}</text>
 </svg></div>
}

const inputs=metrics.filter(x=>x.key!=='bmi');
const blank=()=>Object.fromEntries(inputs.map(x=>[x.key,'']));
const display=value=>value===null?'—':value.toFixed(1);
export default function BodyMetrics({record={},saveRecord,today=localDay()}){
 const measurements=Array.isArray(record.bodyMeasurements)?record.bodyMeasurements:[];
 const days=useMemo(()=>dailyRows(measurements),[record.bodyMeasurements]);
 const height=number(record.bodyHeight);
 const [tab,setTab]=useState('calendar'),[metric,setMetric]=useState('weight'),[period,setPeriod]=useState('90');
 const [selected,setSelected]=useState(today),[month,setMonth]=useState(today.slice(0,7));
 const [date,setDate]=useState(today),[draft,setDraft]=useState(()=>{const row=days.find(x=>x.row.date===today)?.row;return Object.fromEntries(inputs.map(x=>[x.key,row?.[x.key]==null?'':String(row[x.key])]))}),[editing,setEditing]=useState(()=>days.find(x=>x.row.date===today)?.index??null),[dirty,setDirty]=useState(false);
 const [editHeight,setEditHeight]=useState(false),[heightDraft,setHeightDraft]=useState(''),[notice,setNotice]=useState('');
 const active=metrics.find(x=>x.key===metric);
 const selectedEntry=days.find(x=>x.row.date===selected);
 const selectedRow=selectedEntry?.row;
 const recent=days.at(-1)?.row;
 function openEntry(day,index){
  if(dirty&&!window.confirm('저장하지 않은 입력을 버리고 기록을 열까요?'))return;
  const entry=index===undefined?days.find(x=>x.row.date===day):{row:measurements[index],index};
  setSelected(day);setDate(day);setMonth(day.slice(0,7));setEditing(entry?.index??null);
  setDraft(Object.fromEntries(inputs.map(x=>[x.key,entry?.row?.[x.key]==null?'':String(entry.row[x.key])])));
  setDirty(false);setNotice('');
 }
 function save(event){
  event.preventDefault();
  const patch={date};
  if(!validDay(date)){setNotice('유효한 날짜를 선택해 주세요.');return;}
  for(const field of inputs){
   const value=number(draft[field.key]);
   if(draft[field.key]!==''&&(value===null||value<field.min||value>field.max)){setNotice(`${field.label}: ${field.min}~${field.max}${field.unit} 사이로 입력해 주세요.`);return;}
   patch[field.key]=value;
  }
  // Date-only rows are allowed; empty metrics remain empty, never zero-filled.
  const savedIndex=editing??measurements.length;
  saveRecord(current=>({...current,bodyMeasurements:saveMeasurement(current.bodyMeasurements||[],editing,patch)}));
  setEditing(savedIndex);setSelected(date);setMonth(date.slice(0,7));setDirty(false);setNotice('기록을 저장했어요.');
 }
 function remove(index){
  const row=measurements[index];if(!row||!window.confirm(`${row.date}의 선택한 신체 기록을 삭제할까요? 같은 날짜의 다른 기록은 유지돼요.`))return;
  saveRecord(current=>({...current,bodyMeasurements:(current.bodyMeasurements||[]).filter((_,i)=>i!==index)}));
  setEditing(null);setDraft(blank());setDirty(false);setNotice('선택한 기록을 삭제했어요.');
 }
 function saveHeight(){
  const value=number(heightDraft);if(value===null||value<80||value>250){setNotice('키는 80~250cm 사이로 입력해 주세요.');return;}
  saveRecord(current=>({...current,bodyHeight:value}));setEditHeight(false);setNotice('키를 저장했어요.');
 }
 const change=(key,daysBack=1)=>{
  const value=difference(measurements,selected,key,height,daysBack),field=metrics.find(x=>x.key===key);
  return value===null?'기록 없음':`${value>0?'+':''}${value.toFixed(1)}${field.changeUnit||field.unit}`;
 };
 const monthStart=new Date(`${month}-01T12:00:00`),lastDay=new Date(monthStart.getFullYear(),monthStart.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((monthStart.getDay()+lastDay)/7)*7},(_,i)=>{const day=i-monthStart.getDay()+1;return day<1||day>lastDay?null:`${month}-${String(day).padStart(2,'0')}`});
 function moveMonth(offset){const d=new Date(`${month}-01T12:00:00`);d.setMonth(d.getMonth()+offset);setMonth(localDay(d).slice(0,7));}
 const filtered=days.filter(({row})=>period==='all'||(row.date>=shiftDay(today,-Number(period)+1)&&row.date<=today));
 const points=filtered.map(({row})=>({date:row.date,value:valueFor(row,metric,height)}));
 const switcher=<div className="bm-switch bm-metrics" aria-label="측정 항목">{metrics.map(x=><button type="button" key={x.key} aria-pressed={metric===x.key} className={metric===x.key?'active':''} onClick={()=>setMetric(x.key)}>{x.label}</button>)}</div>;
 const form=<form className="bm-form" onSubmit={save}>
  <label className="bm-date">날짜<input type="date" required value={date} onChange={e=>{setDate(e.target.value);setDirty(true)}}/></label>
  <p className="bm-hint">{editing===null?'새 기록':'선택한 기록 수정'} · 날짜를 바꾸면 이 기록만 이동해요. 다른 날짜 기록은 달력이나 이력에서 선택해 주세요.</p>
  <div className="bm-numbers">{inputs.map(x=><label key={x.key}>{x.label}{x.key.endsWith('_cm')?'둘레':''} ({x.unit})<input type="number" inputMode="decimal" step="any" min={x.min} max={x.max} placeholder="—" value={draft[x.key]} onChange={e=>{setDraft(s=>({...s,[x.key]:e.target.value}));setDirty(true)}}/></label>)}</div>
  <p className="bm-hint">허벅지는 한쪽 둘레를 같은 쪽에서 측정해 주세요. 모든 측정값은 선택 입력이에요.</p>
  <div className="bm-form-bottom"><span>BMI {display(valueFor({weight: draft.weight},'bmi',height))} · 키와 체중으로 자동 계산</span><button type="submit">기록 저장</button></div>
  {editing!==null&&<button type="button" className="bm-remove-record" onClick={()=>remove(editing)}>선택한 기록 삭제</button>}
 </form>;
 const details=<section className="hf-section bm-selected" aria-label="선택한 날짜 측정값"><div className="hf-section-title"><h2>{selected} 측정</h2><span>{selectedRow?'저장된 기록':'기록 없음'}</span></div>
  <dl className="bm-values">{metrics.map(x=><div key={x.key}><dt>{x.label}</dt><dd>{display(valueFor(selectedRow,x.key,height))}{valueFor(selectedRow,x.key,height)===null?'':x.unit}</dd></div>)}</dl>
  <div className="bm-changes"><p>체중 현재 {display(valueFor(selectedRow,'weight',height))}{valueFor(selectedRow,'weight',height)===null?'':'kg'}</p><p>전일 대비 {change('weight')} · 7일 전 대비 {change('weight',7)}</p>{metric!=='weight'&&<p>{active.label} 전일 대비 {change(metric)}</p>}</div>
  <button type="button" className="bm-edit-selected" onClick={()=>{openEntry(selected);setTab('records')}}>{selectedRow?'이 날짜 기록 수정':'이 날짜 기록 추가'}</button>
 </section>;
 return <div className="hf-dashboard bm-page"><header className="hf-page-head"><small>HOME FIT · BODY</small><h1>신체 변화</h1></header>
  <div className="bm-top"><div className="bm-height"><span>키</span><strong>{height?`${height} cm`:'미등록'}</strong><button type="button" onClick={()=>{setHeightDraft(height?String(height):'');setEditHeight(v=>!v)}}>수정</button></div>{editHeight&&<div className="bm-height-edit"><input aria-label="키 cm" inputMode="decimal" type="number" min="80" max="250" step="any" value={heightDraft} onChange={e=>setHeightDraft(e.target.value)}/><button type="button" onClick={saveHeight}>저장</button><button type="button" className="bm-cancel" onClick={()=>setEditHeight(false)}>취소</button></div>}</div>
  <div className="hf-kpi-grid bm-stats">{metrics.filter(x=>['weight','bmi','fat','muscle'].includes(x.key)).map(x=><div className="hf-kpi" key={x.key}><span>{x.label} · 최근 기록</span><strong>{display(valueFor(recent,x.key,height))}{valueFor(recent,x.key,height)===null?'':x.unit}</strong></div>)}</div>
  <div className="bm-switch bm-tabs" aria-label="신체 보기">{[['calendar','달력'],['graph','그래프'],['records','기록']].map(([key,label])=><button type="button" key={key} aria-pressed={tab===key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</div>
  {notice&&<p className="bm-notice" role="status">{notice}</p>}
  {tab==='calendar'&&<><section className="hf-section" aria-label="신체 측정 달력">{switcher}<div className="bm-month-head"><button type="button" aria-label="이전 달" onClick={()=>moveMonth(-1)}>‹</button><h2>{monthStart.getFullYear()}년 {monthStart.getMonth()+1}월</h2><button type="button" aria-label="다음 달" onClick={()=>moveMonth(1)}>›</button></div><p className="bm-hint">{active.label}{active.unit?` (${active.unit})`:''} · 실제 측정값 · 빈 날짜는 —</p>
   <div className="bm-calendar"><div className="bm-weekdays">{['일','월','화','수','목','금','토'].map(x=><span key={x}>{x}</span>)}</div><div className="bm-days">{cells.map((day,i)=>{if(!day)return <div className="bm-day-blank" key={`blank-${i}`}/>;const row=days.find(x=>x.row.date===day)?.row,value=valueFor(row,metric,height);return <button type="button" key={day} className={`bm-day ${day===selected?'selected':''} ${day===today?'today':''}`} aria-pressed={day===selected} aria-label={`${day} ${active.label} ${value===null?'기록 없음':value.toFixed(1)+active.unit}`} onClick={()=>openEntry(day)}><span>{Number(day.slice(-2))}</span><strong>{display(value)}</strong></button>})}</div></div>
  </section>{details}</>}
  {tab==='graph'&&<><section className="hf-section"><div className="hf-section-title"><h2>변화 그래프</h2><span>{active.label} {active.unit}</span></div>{switcher}<div className="bm-switch bm-period">{[['7','7일'],['30','30일'],['90','90일'],['365','1년'],['all','전체']].map(([v,label])=><button type="button" key={v} aria-pressed={period===v} className={period===v?'active':''} onClick={()=>setPeriod(v)}>{label}</button>)}</div><Trend points={points} unit={active.unit} onSelect={openEntry}/><p className="bm-hint">기록 {points.filter(x=>x.value!==null).length}건 · 점을 선택하면 해당 날짜 수치를 볼 수 있어요.</p></section>{details}</>}
  {tab==='records'&&<><section className="hf-section"><div className="hf-section-title"><h2>측정 기록</h2><button type="button" className="bm-cancel" onClick={()=>{if(dirty&&!window.confirm('저장하지 않은 입력을 버릴까요?'))return;setEditing(null);setDate(selected);setDraft(blank());setDirty(false);setNotice('');}}>새 기록</button></div>{form}</section><section className="hf-section"><div className="hf-section-title"><h2>측정 이력</h2><span>{measurements.length}건</span></div><p className="bm-hint">같은 날짜가 여러 건이면 마지막 저장 배열 항목을 달력·그래프에 표시해요. 각 이력은 따로 보존돼요.</p><div className="bm-history">{measurements.map((row,index)=>({row,index})).filter(x=>x.row&&validDay(x.row.date)).sort((a,b)=>b.row.date.localeCompare(a.row.date)||b.index-a.index).map(({row,index})=><div key={index} className="bm-history-row"><button type="button" className="bm-history-main" onClick={()=>openEntry(row.date,index)}><strong>{row.date}</strong><span>{inputs.map(x=>`${x.label} ${display(valueFor(row,x.key,height))}${valueFor(row,x.key,height)===null?'':x.unit}`).join(' · ')}</span></button><button type="button" className="bm-delete" aria-label={`${row.date} 기록 ${index+1} 삭제`} onClick={()=>remove(index)}>×</button></div>)}{!measurements.length&&<p className="bm-empty">저장된 신체 측정 기록이 없어요.</p>}</div></section></>}
  <p className="hf-footnote">BMI는 키와 체중으로 계산한 참고 지표예요. 골격근량은 체성분 측정기의 수치를 입력해 주세요.</p>
 </div>;
}
