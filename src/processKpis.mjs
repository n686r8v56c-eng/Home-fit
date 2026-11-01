import {metrics,dailyRows,valueFor,validDay,localDay,shiftDay,number} from './bodyMetrics.mjs';
export const stages=[['learning','학습','Learning'],['execution','실행','Execution'],['outcome','결과','Outcome'],['social','소셜','Social'],['branding','브랜딩','Branding'],['monetization','수익화','Monetization'],['challenge','경쟁','Challenge']];
export const periods=[['day','일'],['week','주'],['month','월'],['90','90일']];
export const sources=[
 {id:'sequence',stage:'learning',name:'시퀀스 신규 제작 수',unit:'개',origin:'Exercise'},
 {id:'photo',stage:'learning',name:'운동 사진 신규 등록 수',unit:'장',origin:'Exercise'},
 ...[['workout','근력운동'],['stretch','스트레칭'],['skin','마사지']].map(([id,name])=>({id,stage:'execution',name:`${name} 실제 운동 시간`,unit:'분',origin:'홈·일정'})),
 {id:'attendance',stage:'execution',name:'헬스장 출석',unit:'일',origin:'홈·일정'},
 ...metrics.map(x=>({id:`body:${x.key}`,stage:'outcome',name:x.label+(x.key.endsWith('_cm')?'둘레':''),unit:x.unit,origin:'신체'})),
];
export const sourceById=id=>sources.find(x=>x.id===id);
export function rangeFor(period,date){
 if(!validDay(date))throw Error('유효한 기준일을 선택해 주세요.');
 if(period==='day')return [date,date];
 if(period==='week'){const d=new Date(`${date}T12:00:00`),start=shiftDay(date,-((d.getDay()+6)%7));return [start,shiftDay(start,6)];}
 if(period==='month'){const d=new Date(`${date}T12:00:00`);return [date.slice(0,7)+'-01',localDay(new Date(d.getFullYear(),d.getMonth()+1,0))];}
 return [shiftDay(date,-89),date];
}
export const configOf=record=>({groups:[],kpis:[],builtins:{},...(record.processKpis||{})});
export function allKpis(record){const config=configOf(record);return [...sources.map(s=>({...s,id:`auto:${s.id}`,source:'auto',sourceId:s.id,period:'week',target:null,builtin:true,...config.builtins[`auto:${s.id}`]})),...config.kpis];}
export function editConfig(record,fn){return {...record,processKpis:fn(configOf(record))};}
export function saveKpi(config,kpi){
 if(kpi.builtin)return {...config,builtins:{...config.builtins,[kpi.id]:{...(config.builtins[kpi.id]||{}),...kpi}}};
 const exists=config.kpis.some(x=>x.id===kpi.id);
 return {...config,kpis:exists?config.kpis.map(x=>x.id===kpi.id?{...x,...kpi}:x):[...config.kpis,kpi]};
}
export function removeItem(config,kind,id,mode='archive'){
 if(kind==='group'){
  if(mode==='archive')return {...config,groups:config.groups.map(x=>x.id===id?{...x,archived:true}:x)};
  // Only user-defined KPI configuration and manual entries are removed.
  return {...config,groups:config.groups.filter(x=>x.id!==id),kpis:config.kpis.filter(x=>x.groupId!==id)};
 }
 if(id.startsWith('auto:'))return {...config,builtins:{...config.builtins,[id]:{...config.builtins[id],archived:true}}};
 return {...config,kpis:mode==='archive'?config.kpis.map(x=>x.id===id?{...x,archived:true}:x):config.kpis.filter(x=>x.id!==id)};
}
export function putEntry(kpi,entry){
 if(kpi.source!=='manual')throw Error('자동 KPI 실적은 원본에서만 수정할 수 있어요.');
 if(!validDay(entry.date)||number(entry.value)===null)throw Error('날짜와 유효한 실적을 입력해 주세요.');
 const entries=kpi.entries||[];
 return {...kpi,entries:entries.some(x=>x.id===entry.id)?entries.map(x=>x.id===entry.id?{...x,...entry,value:Number(entry.value)}:x):[...entries,{...entry,value:Number(entry.value)}]};
}
function createdDay(item){
 const value=item.created_at||item.createdAt;
 if(!value)return null;
 if(validDay(value))return value;
 const d=new Date(value);return Number.isFinite(d.getTime())?localDay(d):null;
}
// Collect current saved sequences and referenced uploaded photos, not bundled
// exercises/presets, plans or completion snapshots. Deduplicate imported copies.
export function collectExercise(local={},remote=[]){
 const sequences=new Map(),photos=new Map();
 function photo(path,bucket='mindflow-studio-photos',date=null){
  if(typeof path!=='string'||!path||/^(blob:|data:|https?:)/.test(path))return;
  const key=`${bucket}/${path}`,prior=photos.get(key);photos.set(key,{id:key,date:prior?.date||date});
 }
 function itemPhotos(item,bucket){photo(item.imagePath||item.image_path||item.storage_path||item.photo,item.bucket||bucket);}
 function sequence(item,studio,bucket){
  if(!item?.id||String(item.id).startsWith('preset:'))return;
  const key=`${studio}:${item.id}`,prior=sequences.get(key);
  sequences.set(key,{id:key,date:prior?.date||createdDay(item)});
  (item.items||item.steps||[]).forEach(x=>itemPhotos(x,bucket||(studio==='snpe'?'mindflow-yoga':undefined)));
 }
 function studio(data,key){(data.saved||[]).forEach(x=>sequence(x,key));(data.exercises||data.moves||[]).forEach(x=>itemPhotos(x,key==='snpe'?'mindflow-yoga':undefined));}
 (local.sequences||[]).forEach(x=>sequence(x,'yoga'));
 Object.entries(local.activityStudios||{}).forEach(([key,data])=>studio(data,key));
 Object.entries(local.equipmentStudios||{}).forEach(([key,data])=>studio(data,key));
 // Local yoga photos may be embedded images; without upload metadata they are
 // deliberately not counted as newly registered uploads.
 const keys={'요가':'yoga','매트 필라테스':'mat-pilates','스트레칭':'stretching','덤벨':'dumbbell','바벨':'barbell','머신':'machine','케이블':'cable'};
 for(const {table,rows} of remote){
  if(table==='storage')rows.forEach(x=>photo(x.path,x.bucket,createdDay(x)));
  else if(table==='mindflow_studio_data')rows.forEach(x=>studio(x.data||{},x.studio));
  else if(table==='mindflow_snpe_studio')rows.forEach(x=>studio(x.data||{},'snpe'));
  else if(table==='mindflow_activity_sequences')rows.forEach(x=>sequence(x,keys[x.activity]||x.activity,'mindflow-yoga'));
  else if(table==='mindflow_foam_roller_sequences')rows.forEach(x=>sequence(x,'foam-roller'));
  else rows.forEach(x=>itemPhotos(x,'mindflow-yoga'));
 }
 return {sequence:[...sequences.values()],photo:[...photos.values()]};
}
export function actualFor(kpi,record,exercise,date){
 const [from,to]=rangeFor(kpi.period,date),end=to<date?to:date;
 const inRange=d=>d>=from&&d<=end;
 const source=sourceById(kpi.sourceId);
 let target=number(kpi.target);
 if(kpi.source==='manual'){
  const rows=(kpi.entries||[]).filter(x=>validDay(x.date)&&inRange(x.date)&&number(x.value)!==null);
  return {value:rows.length?rows.reduce((n,x)=>n+Number(x.value),0):null,target,from,to,count:rows.length};
 }
 if(!source)return {value:null,target,from,to,note:'연결할 자동 소스를 선택해 주세요.'};
 if(source.stage==='learning'){
  const rows=exercise?.[source.id]||[],unknown=rows.filter(x=>!x.date).length,known=rows.filter(x=>x.date&&inRange(x.date)).length;
  return {value:(unknown&&known===0)||(!exercise?.complete&&rows.length===0)?null:known,target,from,to,total:rows.length,unknown,note:!exercise?.complete?'일부 자료 연동 대기 · 현재 확인된 저장본만 표시해요.':unknown?'날짜 미상 기록은 기간 실적에서 제외돼요.':null};
 }
 if(source.stage==='outcome'){
  const rows=dailyRows(record.bodyMeasurements||[]).filter(x=>inRange(x.row.date)&&valueFor(x.row,source.id.slice(5),record.bodyHeight)!==null);
  const last=rows.at(-1)?.row;
  return {value:valueFor(last,source.id.slice(5),record.bodyHeight),target,from,to,measuredDate:last?.date,note:'기간 내 마지막 실측값 · 합산하지 않음'};
 }
 if(source.id==='attendance')return {value:Object.entries(record.attendance||{}).filter(([d,v])=>validDay(d)&&inRange(d)&&!!v).length,target,from,to};
 const value=Object.entries(record.timeLogs||{}).filter(([d])=>validDay(d)&&inRange(d)).reduce((n,[,log])=>n+(log[source.id]?.done?Math.max(0,number(log[source.id].minutes)||0):0),0);
 if(target===null){const defaults={workout:{days:3,minutes:40},stretch:{days:7,minutes:30},skin:{days:5,minutes:20}},plan=record.strategy?.[source.id]||defaults[source.id];const numDays=Math.round((new Date(`${to}T12:00:00`)-new Date(`${from}T12:00:00`))/86400000)+1;target=Math.round(Math.min(7,Math.max(0,number(plan.days)||0))*Math.min(600,Math.max(0,number(plan.minutes)||0))*numDays/7);}
 return {value,target,from,to};
}
