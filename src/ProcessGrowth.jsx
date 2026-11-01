import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {stages,periods,sources,sourceById,configOf,allKpis,editConfig,saveKpi,removeItem,putEntry,collectExercise,actualFor} from './processKpis.mjs';
import {validDay,number} from './bodyMetrics.mjs';
import {useExerciseMetrics} from './processExercise';
import './process-growth.css';
const uid=()=>crypto.randomUUID();
const format=value=>value===null||value===undefined?'—':Number(value).toLocaleString('ko-KR',{maximumFractionDigits:2});
const makeDraft=(stage,groupId=null)=>({id:uid(),stage,groupId,name:'',unit:'',target:'',period:'week',source:'manual',sourceId:'',description:'',entries:[]});
export default function ProcessGrowth({record,saveRecord,today,exerciseData={},active}){
 const config=configOf(record),kpis=allKpis(record);
 const [date,setDate]=useState(today),[showArchived,setShowArchived]=useState(false),[editor,setEditor]=useState(null),[error,setError]=useState('');
 const dialogRef=useRef(null);
 useEffect(()=>{
  if(!editor)return;
  const previous=document.activeElement,dialog=dialogRef.current;
  const focusable=()=>[...dialog.querySelectorAll('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])')];
  focusable()[0]?.focus();
  function trap(event){if(event.key!=='Tab')return;const nodes=focusable(),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
  dialog.addEventListener('keydown',trap);return()=>{dialog.removeEventListener('keydown',trap);previous?.focus()};
 },[editor?.kind,editor?.id,editor?.kpiId]);
 const remote=useExerciseMetrics(active);
 const exercise=useMemo(()=>({...collectExercise(exerciseData,remote.rows),complete:remote.status.startsWith('Exercise 연결 완료')}),[exerciseData,remote.rows,remote.status]);
 const groupHidden=kpi=>kpi.groupId&&config.groups.find(x=>x.id===kpi.groupId)?.archived;
 const update=fn=>saveRecord(current=>editConfig(current,fn));
 const open=value=>{setError('');setEditor(value)};
 function saveEditor(event){
  event.preventDefault();setError('');
  try{
   if(editor.kind==='remove'){
    if(editor.mode==='delete'&&!window.confirm('사용자 정의 분류·KPI 및 수동 기록을 영구 삭제할까요? 원본 운동·신체 데이터는 유지돼요.'))return;
    update(c=>removeItem(c,editor.itemKind,editor.id,editor.mode));
   }else if(editor.kind==='group'){
    if(!editor.name.trim())throw Error('중분류 이름을 입력해 주세요.');
    update(c=>({...c,groups:c.groups.some(x=>x.id===editor.id)?c.groups.map(x=>x.id===editor.id?{...x,name:editor.name.trim()}:x):[...c.groups,{id:editor.id,stage:editor.stage,name:editor.name.trim()}]}));
   }else if(editor.kind==='kpi'){
    const item=editor.value;
    if(!item.name.trim())throw Error('KPI 이름을 입력해 주세요.');
    if(item.target!==''&&item.target!==null&&(number(item.target)===null||Number(item.target)<0))throw Error('목표는 0 이상의 숫자로 입력해 주세요.');
    if(item.source==='auto'&&!sourceById(item.sourceId))throw Error('자동 데이터 소스를 선택해 주세요.');
    update(c=>saveKpi(c,{...item,name:item.name.trim(),unit:item.source==='auto'?sourceById(item.sourceId).unit:item.unit.trim(),target:number(item.target)}));
   }else if(editor.kind==='entry'){
    if(!validDay(editor.value.date)||number(editor.value.value)===null)throw Error('날짜와 유효한 실적을 입력해 주세요.');
    if(!config.kpis.some(x=>x.id===editor.kpiId))throw Error('KPI를 다시 열어 주세요.');
    update(c=>{const item=c.kpis.find(x=>x.id===editor.kpiId);return item?saveKpi(c,putEntry(item,editor.value)):c});
   }
   setEditor(null);
  }catch(e){setError(e.message)}
 }
 const editKpi=kpi=>open({kind:'kpi',value:{...kpi,target:kpi.target??'',unit:kpi.unit||'',description:kpi.description||''}});
 const archiveKpi=kpi=>update(c=>saveKpi(c,{...kpi,archived:!kpi.archived}));
 const deleteItem=(kind,item)=>open({kind:'remove',itemKind:kind,id:item.id,name:item.name,mode:'archive'});
 function renderKpi(kpi){
  const result=actualFor(kpi,record,exercise,date),source=sourceById(kpi.sourceId);
  return <article className="pg-kpi" key={kpi.id} data-kpi-id={kpi.id}>
   <div className="pg-line"><h4>{kpi.name}</h4><div className="pg-actions"><button type="button" onClick={()=>editKpi(kpi)}>편집</button><button type="button" onClick={()=>archiveKpi(kpi)}>{kpi.archived?'복원':'보관'}</button>{!kpi.builtin&&<button type="button" onClick={()=>deleteItem('kpi',kpi)}>삭제</button>}</div></div>
   <p className="pg-source">{kpi.source==='auto'?`자동 · ${source?.origin||'소스 미지정'}`:'수동'} · {result.from} ~ {result.to}{result.measuredDate?` · 측정 ${result.measuredDate}`:''}{kpi.archived?' · 보관됨':''}</p>
   <div className="pg-actual"><strong>실제 {format(result.value)}{result.value===null?'':kpi.unit}</strong><span>목표 {format(result.target)}{result.target===null?'':kpi.unit}</span></div>
   {result.total!==undefined&&<p className="pg-source">연결된 현재 누적 {result.total}{kpi.unit} · 날짜 미상 {result.unknown}{kpi.unit}</p>}
   {result.note&&<p className="pg-source">{result.note}</p>}
   {kpi.description&&<p className="pg-description">{kpi.description}</p>}
   {kpi.source==='auto'?<p className="pg-source">읽기 전용 · {source?.origin||'원본'}에서 수정해 주세요.{source?.stage==='execution'&&kpi.target===null?' 목표는 기존 전략의 주간 계획을 기간에 맞춰 재사용해요.':''}</p>:<>
    <button type="button" className="pg-add" onClick={()=>open({kind:'entry',kpiId:kpi.id,value:{id:uid(),date,value:'',note:''}})}>+ 실적 기록</button>
    <p className="pg-source">기간 내 수동 실적을 합산해요. 같은 날짜의 여러 기록도 합산돼요.</p><details className="pg-history"><summary>날짜별 기록 ({(kpi.entries||[]).length})</summary>{[...(kpi.entries||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(entry=><div key={entry.id} className="pg-entry"><span>{entry.date} · {format(entry.value)}{kpi.unit}{entry.note?` · ${entry.note}`:''}</span><div className="pg-actions"><button type="button" onClick={()=>open({kind:'entry',kpiId:kpi.id,value:{...entry}})}>수정</button><button type="button" onClick={()=>{if(window.confirm('이 수동 실적을 삭제할까요?'))update(c=>{const item=c.kpis.find(x=>x.id===kpi.id);return saveKpi(c,{...item,entries:(item.entries||[]).filter(x=>x.id!==entry.id)})})}}>삭제</button></div></div>)}</details>
   </>}
  </article>;
 }
 const currentKpi=editor?.kind==='kpi'?editor.value:null;
 const setKpi=(key,value)=>setEditor(s=>({...s,value:{...s.value,[key]:value}}));
 return <div className="process-growth">
  <div className="pg-toolbar"><label>기준일<input aria-label="KPI 기준일" type="date" required value={date} onChange={e=>{if(validDay(e.target.value))setDate(e.target.value)}}/></label><label className="pg-check"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>보관함 표시</label></div>
  <p className="pg-source" role="status">{remote.status} <button type="button" className="pg-refresh" onClick={remote.refresh}>새로고침</button></p>
  <p className="pg-source">실적은 기준일까지, 목표는 선택한 전체 기간을 기준으로 표시해요.</p>
  <div className="process-stages">{stages.map(([id,label,english])=>{
   const stageKpis=kpis.filter(x=>x.stage===id),visible=stageKpis.filter(x=>showArchived||(!x.archived&&!groupHidden(x)));
   const groups=config.groups.filter(x=>x.stage===id&&(showArchived||!x.archived));
   return <details key={id} className="process-stage" data-stage={id}><summary><span>{label} <small>{english}</small><small> · KPI {stageKpis.filter(x=>!x.archived&&!groupHidden(x)).length}개</small></span><ChevronDown size={16} aria-hidden="true"/></summary><div className="pg-stage-body">
    <div className="pg-actions pg-stage-actions"><button type="button" onClick={()=>open({kind:'group',stage:id,id:uid(),name:''})}>+ 중분류</button><button type="button" onClick={()=>open({kind:'kpi',value:makeDraft(id)})}>+ KPI</button></div>
    {visible.filter(x=>!x.groupId).map(renderKpi)}
    {groups.map(group=><section key={group.id} className="pg-group"><div className="pg-line"><h3>{group.name}{group.archived?' · 보관됨':''}</h3><div className="pg-actions"><button type="button" onClick={()=>open({kind:'group',...group})}>이름 수정</button><button type="button" onClick={()=>update(c=>({...c,groups:c.groups.map(x=>x.id===group.id?{...x,archived:!x.archived}:x)}))}>{group.archived?'복원':'보관'}</button><button type="button" onClick={()=>deleteItem('group',group)}>삭제</button></div></div>{visible.filter(x=>x.groupId===group.id).map(renderKpi)}<button type="button" className="pg-add" onClick={()=>open({kind:'kpi',value:makeDraft(id,group.id)})}>+ KPI</button></section>)}
    {!visible.length&&<p>아직 등록된 KPI 없음</p>}
   </div></details>;
  })}</div>
  {editor&&<div className="pg-overlay" onClick={e=>{if(e.target===e.currentTarget){if(window.confirm('편집을 닫을까요? 저장하지 않은 입력은 유지되지 않아요.'))setEditor(null)}}} onKeyDown={e=>{if(e.key==='Escape')setEditor(null)}}><div className="pg-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pg-dialog-title"><h2 id="pg-dialog-title">{editor.kind==='group'?'중분류 편집':editor.kind==='kpi'?'KPI 편집':editor.kind==='entry'?'실적 기록':'보관·삭제'}</h2><form onSubmit={saveEditor}>
   {editor.kind==='group'&&<label>중분류 이름<input autoFocus required maxLength={80} value={editor.name} onChange={e=>setEditor(s=>({...s,name:e.target.value}))}/></label>}
   {currentKpi&&<>
    <label>KPI 이름<input autoFocus required maxLength={100} value={currentKpi.name} onChange={e=>setKpi('name',e.target.value)}/></label>
    {!currentKpi.builtin&&<label>중분류<select aria-label="중분류" value={currentKpi.groupId||''} onChange={e=>setKpi('groupId',e.target.value||null)}><option value="">대분류에 직접 등록</option>{config.groups.filter(x=>x.stage===currentKpi.stage).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
    <div className="pg-form-grid"><label>데이터 소스<select aria-label="데이터 소스" value={currentKpi.source} disabled={currentKpi.builtin||(currentKpi.entries||[]).length>0} onChange={e=>setKpi('source',e.target.value)}><option value="manual">수동</option><option value="auto">자동</option></select></label><label>집계 기간<select aria-label="집계 기간" value={currentKpi.period} onChange={e=>setKpi('period',e.target.value)}>{periods.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
    {currentKpi.source==='auto'&&<label>자동 연결<select aria-label="자동 연결" required disabled={currentKpi.builtin} value={currentKpi.sourceId} onChange={e=>setKpi('sourceId',e.target.value)}><option value="">소스 선택</option>{sources.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
    <div className="pg-form-grid"><label>단위<input maxLength={20} disabled={currentKpi.source==='auto'} value={currentKpi.source==='auto'?sourceById(currentKpi.sourceId)?.unit||'':currentKpi.unit} onChange={e=>setKpi('unit',e.target.value)}/></label><label>목표<input type="number" min="0" step="any" placeholder="선택 입력" value={currentKpi.target} onChange={e=>setKpi('target',e.target.value)}/></label></div>
    <label>설명<textarea maxLength={500} value={currentKpi.description} onChange={e=>setKpi('description',e.target.value)}/></label>
   </>}
   {editor.kind==='entry'&&<><label>실적 날짜<input autoFocus type="date" required value={editor.value.date} onChange={e=>setEditor(s=>({...s,value:{...s.value,date:e.target.value}}))}/></label><label>실적 값<input type="number" step="any" required value={editor.value.value} onChange={e=>setEditor(s=>({...s,value:{...s.value,value:e.target.value}}))}/></label><label>실적 메모<input maxLength={300} value={editor.value.note||''} onChange={e=>setEditor(s=>({...s,value:{...s.value,note:e.target.value}}))}/></label></>}
   {editor.kind==='remove'&&<><p>{editor.name} · 보관하면 기록을 유지하며 보관함에서 복원할 수 있어요.</p><label>처리 방식<select aria-label="처리 방식" value={editor.mode} onChange={e=>setEditor(s=>({...s,mode:e.target.value}))}><option value="archive">보관 (권장)</option><option value="delete">영구 삭제 (사용자 정의 기록만)</option></select></label></>}
   {error&&<p role="alert">{error}</p>}<div className="pg-actions pg-form-actions"><button type="button" onClick={()=>setEditor(null)}>취소</button><button type="submit">{editor.kind==='remove'?'적용':'저장'}</button></div>
  </form></div></div>}
 </div>;
}
